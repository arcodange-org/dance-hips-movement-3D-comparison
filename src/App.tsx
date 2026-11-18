import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Rig from "./components/Rig";
import ContactViz from "./components/ContactViz";
import GridFloor from "./components/GridFloor";
import Controls from "./components/Controls";
import { InfoCard, PairInfoCard } from "./components/InfoCards";
import DemoOverlay, { DEMOS } from "./components/DemoOverlay";
import OriginMarker from "./components/OriginMarker";
import LineOfDance from "./components/LineOfDance";
import CompassRose from "./components/CompassRose";
import { resolveCam, resolveView, viewAnglesOf, SOLID_TORSO_OPACITY } from "./cameras";
import { usePersistentState } from "./hooks/usePersistentState";
import { STYLES, movementOf, movementFlags, PAIR_DZ, type ModeKey, type MovementKey } from "./styles";
import { parseVec3, buildShareUrl } from "./share";
import { DIR_LABELS, isDiagonal } from "./directions";

function readParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function Gauge({ label, color, hud }: { label: string; color: string; hud: any }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-semibold" style={{ color }}>
        {label}
      </div>
      <div className="flex h-2.5 w-44 rounded overflow-hidden border border-slate-600">
        <div style={{ width: `${hud.loadL * 100}%`, background: color, opacity: 0.95 }} title="appui G" />
        <div style={{ width: `${hud.loadR * 100}%`, background: color, opacity: 0.45 }} title="appui D" />
      </div>
      <div className="text-[10px] text-slate-300 font-mono">
        G {Math.round(hud.loadL * 100)}% · D {Math.round(hud.loadR * 100)}% · genoux{" "}
        {hud.kneeL.toFixed(0)}°/{hud.kneeR.toFixed(0)}° · roll {hud.roll.toFixed(1)}° · buste{" "}
        {Math.round((hud.stab ?? 1) * 100)}%
      </div>
    </div>
  );
}

export default function App() {
  const params = readParams();
  const [mode, setMode] = usePersistentState<ModeKey>("mode", "solo");
  const [styleA, setStyleA] = usePersistentState("styleA", "kizomba");
  const [styleB, setStyleB] = usePersistentState("styleB", "kizomba");
  const [ghostSel, setGhostSel] = usePersistentState("ghostSel", "none");
  const [playing, setPlaying] = usePersistentState("playing", true);
  const [bpm, setBpm] = usePersistentState("bpm", 32);
  const [amp, setAmp] = usePersistentState("amp", 1);
  // Phase 15 — plus de paramètre « retard du suiveur » : en paire, le suiveur est le miroir
  // exact du guideur (phaseOffset 0), même style ; la comparaison de styles différents se fait
  // en mode « Comparaison côte à côte » (styleB), pas avec un suiveur retardé.
  const [showContacts, setShowContacts] = usePersistentState("showContacts", true);
  const [travel, setTravel] = usePersistentState("travel", 0);
  const [showTorso, setShowTorso] = usePersistentState("showTorso", true);
  const [showMuscles, setShowMuscles] = usePersistentState("showMuscles", false);
  const [sortie, setSortie] = usePersistentState("sortie", false);
  const [showRepere, setShowRepere] = usePersistentState("repere", true);
  const [showAppui, setShowAppui] = usePersistentState("appui", false);
  const statsRef = useRef<any>({ loadR: 0.5, loadL: 0.5, kneeR: 0, kneeL: 0, roll: 0 });
  const statsBRef = useRef<any>({ loadR: 0.5, loadL: 0.5, kneeR: 0, kneeL: 0, roll: 0 });
  const [hudB, setHudB] = useState<any>(null);
  const [plant, setPlant] = usePersistentState("plant", true);
  const [corridinho, setCorridinho] = usePersistentState("corridinho", false);
  const [showLigne, setShowLigne] = usePersistentState("ligne", true);
  const [iso, setIso] = usePersistentState("iso", true);
  const [cadre, setCadre] = usePersistentState("cadre", true);
  const [quarts, setQuarts] = usePersistentState("quarts", false);
  const [temps3, setTemps3] = usePersistentState("temps3", false);
  const [ida, setIda] = usePersistentState("ida", false);
  // Phase 14 — déplacements = options NON combinables (radio) : un seul actif à la fois.
  const movement = movementOf({ corridinho, quarts, temps3, ida });
  const setMovement = (m: MovementKey) => {
    const f = movementFlags(m);
    setCorridinho(f.corridinho);
    setQuarts(f.quarts);
    setTemps3(f.temps3);
    setIda(f.ida);
  };
  const [dir, setDir] = usePersistentState("dir", 1);
  const [showBoussole, setShowBoussole] = usePersistentState("boussole", true);
  const [copied, setCopied] = useState(false);
  const controlsRef = useRef<any>(null);
  const camPosParam = parseVec3(params.get("campos"));
  const camTgtParam = parseVec3(params.get("camtgt"));
  // Angle et zoom de vue explicites en URL (sous campos/camtgt) : angle = azimut ° autour de
  // la cible (0 = +Z, 90 = +X = E), zoom = distance caméra→cible en m.
  const angleParam = params.has("angle") && Number.isFinite(Number(params.get("angle"))) ? Number(params.get("angle")) : null;
  const zoomParam = params.has("zoom") && Number.isFinite(Number(params.get("zoom"))) ? Number(params.get("zoom")) : null;
  const [hud, setHud] = useState<any>(null);
  const pairRef = useRef<Record<string, any>>({});

  // Paramètres d'URL (?style=&styleB=&mode=&bpm=&travel=&amp=&playing=&torso=&muscles=&sortie=&bare=)
  // prioritaires sur localStorage : utilisé par les captures automatisées (scripts/capture_gifs.mjs).
  useEffect(() => {
    const p = params;
    const num = (k: string) => (p.has(k) ? Number(p.get(k)) : null);
    const str = (k: string) => p.get(k);
    if (str("mode") && ["solo", "observe", "compare", "pair"].includes(str("mode")!)) setMode(str("mode") as ModeKey);
    if (str("style") && STYLES[str("style")!]) setStyleA(str("style")!);
    if (str("styleB") && STYLES[str("styleB")!]) setStyleB(str("styleB")!);
    const b = num("bpm"); if (b !== null && b >= 24 && b <= 140) setBpm(b);
    const tr = num("travel"); if (tr !== null && tr >= 0 && tr <= 1) setTravel(tr);
    const am = num("amp"); if (am !== null && am >= 0.5 && am <= 2) setAmp(am);
    if (p.has("playing")) setPlaying(p.get("playing") !== "0");
    if (p.has("torso")) setShowTorso(p.get("torso") !== "0");
    if (p.has("muscles")) setShowMuscles(p.get("muscles") !== "0");
    if (p.has("sortie")) setSortie(p.get("sortie") !== "0");
    if (p.has("repere")) setShowRepere(p.get("repere") !== "0");
    if (p.has("appui")) setShowAppui(p.get("appui") !== "0");
    if (p.has("plant")) setPlant(p.get("plant") !== "0");
    if (p.has("corridinho") || p.has("quarts") || p.has("temps3") || p.has("ida")) {
      // options exclusives : si plusieurs params sont présents, un seul est retenu (movementOf)
      const m = movementOf({
        corridinho: p.has("corridinho") && p.get("corridinho") !== "0",
        quarts: p.has("quarts") && p.get("quarts") !== "0",
        temps3: p.has("temps3") && p.get("temps3") !== "0",
        ida: p.has("ida") && p.get("ida") !== "0",
      });
      const f = movementFlags(m);
      setCorridinho(f.corridinho);
      setQuarts(f.quarts);
      setTemps3(f.temps3);
      setIda(f.ida);
    }
    if (p.has("ligne")) setShowLigne(p.get("ligne") !== "0");
    if (p.has("iso")) setIso(p.get("iso") !== "0");
    if (p.has("cadre")) setCadre(p.get("cadre") !== "0");
    if (p.has("dir")) { const d = num("dir"); if (d !== null && (d === 1 || d === -1)) setDir(d); }
    if (p.has("boussole")) setShowBoussole(p.get("boussole") !== "0");
    // `delay` (retard du suiveur) supprimé en phase 15 : ignoré s'il est présent dans l'URL.
    if (p.has("contacts")) setShowContacts(p.get("contacts") !== "0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showAppui) return;
    const id = setInterval(() => {
      setHud(statsRef.current ? { ...statsRef.current } : null);
      setHudB(statsBRef.current ? { ...statsBRef.current } : null);
    }, 120);
    return () => clearInterval(id);
  }, [showAppui]);

  const bare = params.get("bare") === "1";
  const demoKey = params.get("demo");
  const demo = demoKey && DEMOS[demoKey] ? DEMOS[demoKey] : null;
  // Preset caméra pour les captures : ?cam=hip zoome sur le bassin (sans recadrage,
  // pour garder l'habillage motion design visible).
  const cam = resolveView(resolveCam(params.get("cam"), mode === "pair"), angleParam, zoomParam);
  const solid = params.get("solid") === "1";
  const isPair = mode === "pair";
  const isCompare = mode === "compare";
  const isObserve = mode === "observe";
  const reverseB = isPair && (corridinho || quarts);

  // Partage de la vue : URL avec tous les paramètres d'état + l'angle caméra (campos/camtgt).
  const onShare = () => {
    const ctl = controlsRef.current;
    const camPos: [number, number, number] | null = ctl
      ? [ctl.object.position.x, ctl.object.position.y, ctl.object.position.z]
      : null;
    const camTgt: [number, number, number] | null = ctl
      ? [ctl.target.x, ctl.target.y, ctl.target.z]
      : null;
    // Angle + zoom de vue lisibles dans l'URL (en plus de campos/camtgt exacts).
    const view = camPos && camTgt ? (() => { const va = viewAnglesOf(camPos, camTgt); return { angle: va.az, zoom: va.dist }; })() : null;
    const rel = buildShareUrl(window.location.pathname, {
      mode, style: styleA, styleB, bpm, travel, amp, playing,
      torso: showTorso, muscles: showMuscles, sortie, repere: showRepere, appui: showAppui,
      plant, corridinho, ligne: showLigne, iso, cadre, quarts, temps3, ida, dir,
      ghost: ghostSel, boussole: showBoussole, contacts: showContacts,
      cam: params.get("cam") ?? undefined, demo: params.get("demo") ?? undefined,
      bare: params.get("bare") ?? undefined, solid: params.get("solid") ?? undefined,
    }, camPos, camTgt, view);
    history.replaceState(null, "", rel);
    const full = window.location.origin + rel;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
        () => { setCopied(true); setTimeout(() => setCopied(false), 2000); }
      );
    } else {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };
  // Ligne de danse affichée par défaut en paire/comparaison ; en solo, seulement si ligne=1 explicite.
  const ligneVisible = showLigne && (isPair || isCompare || params.get("ligne") === "1");
  const ghostA = (isCompare || isPair) && ghostSel === "B";
  const ghostB = ghostSel === "A";

  // Phase 15 — embrace proche : les surfaces frontales (poitrine, bassin, genoux) sont en
  // contact à z=∓0.125 (voir marqueurs contact* et ContactViz).
  const offsetA: [number, number, number] = isPair ? [0, 0, -PAIR_DZ] : isCompare ? [-0.85, 0, 0] : [0, 0, 0];
  const offsetB: [number, number, number] = isPair ? [0, 0, PAIR_DZ] : [0.85, 0, 0];

  const handleMode = (m: ModeKey) => {
    if (m === "observe" && mode !== "observe") {
      setBpm(32);
      setShowTorso(false);
      setTravel(0);
      setShowAppui(true);
    }
    setMode(m);
  };

  const exportCycle = () => {
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `danse-${styleA}${isCompare || isPair ? `-vs-${styleB}` : ""}-${bpm}bpm.webm`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    rec.start();
    const beats = 4;
    setTimeout(() => rec.stop(), (beats * 60 * 1000) / bpm);
  };

  if (bare) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
        <Canvas camera={{ position: camPosParam ?? cam.position, fov: 42 }} dpr={[1, 2]}>
          <color attach="background" args={["#0b1220"]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[3, 5, 4]} intensity={1.3} />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#93c5fd" />
          <GridFloor />
          <OriginMarker visible={showRepere} />
          <CompassRose visible={showBoussole && showRepere} />
          <LineOfDance visible={ligneVisible} />
          <React.Suspense fallback={null}>
            <Rig
              styleKey={styleA}
              bpm={bpm}
              amp={amp}
              playing={playing}
              offset={offsetA}
              rotationY={0}
              ghost={ghostA}
              embrace={isPair}
              pair={isPair ? pairRef : null}
              side={isPair ? "leader" : null}
              showContacts={isPair && showContacts}
              travel={travel}
              showTorso={showTorso}
              showMuscles={showMuscles}
              sortie={sortie}
              showAppui={showAppui}
              stats={statsRef}
              plant={plant}
              corridinho={corridinho}
              torsoOpacity={solid ? SOLID_TORSO_OPACITY : undefined}
              iso={iso}
              cadre={cadre}
              quarts={quarts}
              reverse={false}
              dir={dir}
              temps3={temps3}
              ida={ida}
            />
            {(isCompare || isPair) && (
              <Rig
                styleKey={isPair ? styleA : styleB}
                bpm={bpm}
                amp={amp}
                playing={playing}
                offset={offsetB}
                rotationY={isPair ? Math.PI : 0}
                ghost={ghostB}
                embrace={isPair}
                pair={isPair ? pairRef : null}
                side={isPair ? "follower" : null}
                showContacts={isPair && showContacts}
                travel={travel}
                showTorso={showTorso}
                showMuscles={showMuscles}
                sortie={sortie}
                showAppui={showAppui}
                stats={statsBRef}
                plant={plant}
                corridinho={corridinho}
                torsoOpacity={solid ? SOLID_TORSO_OPACITY : undefined}
              iso={iso}
              cadre={cadre}
              quarts={quarts}
              reverse={reverseB}
              dir={dir}
              temps3={temps3}
              ida={ida}
              />
            )}
            {isPair && <ContactViz pair={pairRef} />}
          </React.Suspense>
          <OrbitControls
            ref={controlsRef}
            target={camTgtParam ?? cam.target}
            enableDamping
            dampingFactor={0.08}
            minDistance={1.8}
            maxDistance={7}
            enablePan={false}
          />
        </Canvas>
        {showAppui && isCompare && hud && hudB && (
          <div className="absolute top-3 right-3 pointer-events-none bg-slate-900/70 rounded-md px-2 py-1 space-y-1.5">
            <Gauge label={`A · ${STYLES[styleA].label}`} color={STYLES[styleA].color} hud={hud} />
            <Gauge label={`B · ${STYLES[styleB].label}`} color={STYLES[styleB].color} hud={hudB} />
          </div>
        )}
        {showAppui && hud && (
          <div className="absolute top-3 right-3 pointer-events-none text-[11px] font-mono text-slate-200 bg-slate-900/70 rounded-md px-2 py-1 space-y-0.5">
            <div>
              appui D {Math.round(hud.loadR * 100)}% · G {Math.round(hud.loadL * 100)}%
            </div>
            <div>
              genou D {hud.kneeR.toFixed(0)}° · G {hud.kneeL.toFixed(0)}°
            </div>
            <div>roll bassin {hud.roll.toFixed(1)}° · stabilité buste {Math.round((hud.stab ?? 1) * 100)}%</div>
            <div>
              direction {DIR_LABELS[hud.facing ?? 0]}
              {isDiagonal(hud.facing ?? 0) ? " (diago)" : ""} · pos/ repère : ligne{" "}
              {(hud.posX ?? 0) >= 0 ? "+" : ""}
              {(hud.posX ?? 0).toFixed(2)} m, travers {(hud.posZ ?? 0) >= 0 ? "+" : ""}
              {(hud.posZ ?? 0).toFixed(2)} m
            </div>
          </div>
        )}
        {demo && <DemoOverlay demo={demo} />}
        {!demo && (
        <div className="absolute bottom-3 left-3 flex gap-2 pointer-events-none">
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-950"
            style={{ background: STYLES[styleA].color }}
          >
            {isPair ? "Guideur · " : ""}
            {STYLES[styleA].label}
          </span>
        </div>
        )}
        {!demo && (isCompare || isPair) && (
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-950"
              style={{ background: STYLES[styleB].color }}
            >
              {isPair ? "Suiveur · " : ""}
              {STYLES[styleB].label}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Comparateur 3D des styles de danse
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Anatomie réelle du bassin au pied (BodyParts3D) animée par la spec biomécanique. Le
          curseur « Déplacement » passe du sur place à une amplitude latérale d'une largeur de
          hanche (les pieds marchent quand Déplacement &gt; 0). Le tracé coloré visualise l'orbite
          du centre du bassin. Mode « Observation hanche » : tempo lent (~32 bpm), buste masqué,
          pour détailler le déhanché temps par temps.
        </p>
      </div>

      <Controls
        mode={mode}
        onMode={handleMode}
        styleA={styleA}
        styleB={styleB}
        onStyleA={setStyleA}
        onStyleB={setStyleB}
        playing={playing}
        onPlaying={setPlaying}
        travel={travel}
        onTravel={setTravel}
        bpm={bpm}
        onBpm={setBpm}
        amp={amp}
        onAmp={setAmp}
        showTorso={showTorso}
        onShowTorso={setShowTorso}
        showContacts={showContacts}
        onShowContacts={setShowContacts}
        showMuscles={showMuscles}
        onShowMuscles={setShowMuscles}
        sortie={sortie}
        onSortie={setSortie}
        showRepere={showRepere}
        onShowRepere={setShowRepere}
        showAppui={showAppui}
        onShowAppui={setShowAppui}
        plant={plant}
        onPlant={setPlant}
        movement={movement}
        onMovement={setMovement}
        showLigne={showLigne}
        onShowLigne={setShowLigne}
        iso={iso}
        onIso={setIso}
        cadre={cadre}
        onCadre={setCadre}
        dir={dir}
        onDir={setDir}
        showBoussole={showBoussole}
        onShowBoussole={setShowBoussole}
        onShare={onShare}
        copied={copied}
        ghostSel={ghostSel}
        onGhostSel={setGhostSel}
        onExport={exportCycle}
      />

      <div
        className="relative rounded-2xl overflow-hidden border border-slate-800"
        style={{ height: 540 }}
      >
        <Canvas camera={{ position: camPosParam ?? cam.position, fov: 42 }} dpr={[1, 2]}>
          <color attach="background" args={["#0b1220"]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[3, 5, 4]} intensity={1.3} />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#93c5fd" />
          <GridFloor />
          <OriginMarker visible={showRepere} />
          <CompassRose visible={showBoussole && showRepere} />
          <LineOfDance visible={ligneVisible} />
          <React.Suspense fallback={null}>
            <Rig
              styleKey={styleA}
              bpm={bpm}
              amp={amp}
              playing={playing}
              offset={offsetA}
              rotationY={0}
              ghost={ghostA}
              embrace={isPair}
              pair={isPair ? pairRef : null}
              side={isPair ? "leader" : null}
              showContacts={isPair && showContacts}
              travel={travel}
              showTorso={showTorso}
              showMuscles={showMuscles}
              sortie={sortie}
              showAppui={showAppui}
              stats={statsRef}
              plant={plant}
              corridinho={corridinho}
              torsoOpacity={solid ? SOLID_TORSO_OPACITY : undefined}
              iso={iso}
              cadre={cadre}
              quarts={quarts}
              reverse={false}
              dir={dir}
              temps3={temps3}
              ida={ida}
            />
            {(isCompare || isPair) && (
              <Rig
                styleKey={isPair ? styleA : styleB}
                bpm={bpm}
                amp={amp}
                playing={playing}
                offset={offsetB}
                rotationY={isPair ? Math.PI : 0}
                ghost={ghostB}
                embrace={isPair}
                pair={isPair ? pairRef : null}
                side={isPair ? "follower" : null}
                showContacts={isPair && showContacts}
                travel={travel}
                showTorso={showTorso}
                showMuscles={showMuscles}
                sortie={sortie}
                showAppui={showAppui}
                stats={statsBRef}
                plant={plant}
                corridinho={corridinho}
                torsoOpacity={solid ? SOLID_TORSO_OPACITY : undefined}
              iso={iso}
              cadre={cadre}
              quarts={quarts}
              reverse={reverseB}
              dir={dir}
              temps3={temps3}
              ida={ida}
              />
            )}
            {isPair && <ContactViz pair={pairRef} />}
          </React.Suspense>
          <OrbitControls
            ref={controlsRef}
            target={camTgtParam ?? cam.target}
            enableDamping
            dampingFactor={0.08}
            minDistance={1.8}
            maxDistance={7}
          />
        </Canvas>
        <div className="absolute bottom-3 left-3 flex gap-2 pointer-events-none">
          <span
            className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-950"
            style={{ background: STYLES[styleA].color }}
          >
            {isPair ? "Guideur · " : ""}
            {STYLES[styleA].label}
          </span>
        </div>
        {(isCompare || isPair) && (
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-950"
              style={{ background: STYLES[styleB].color }}
            >
              {isPair ? "Suiveur · " : ""}
              {STYLES[styleB].label}
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 text-[10px] text-slate-500 pointer-events-none">
          glisser pour orbiter, molette pour zoomer
        </div>
        {showAppui && isCompare && hud && hudB && (
          <div className="absolute top-10 right-3 pointer-events-none bg-slate-900/70 rounded-md px-2 py-1 space-y-1.5">
            <Gauge label={`A · ${STYLES[styleA].label}`} color={STYLES[styleA].color} hud={hud} />
            <Gauge label={`B · ${STYLES[styleB].label}`} color={STYLES[styleB].color} hud={hudB} />
          </div>
        )}
        {showAppui && hud && (
          <div className="absolute top-10 right-3 pointer-events-none text-[11px] font-mono text-slate-200 bg-slate-900/70 rounded-md px-2 py-1 space-y-0.5">
            <div>
              appui D {Math.round(hud.loadR * 100)}% · G {Math.round(hud.loadL * 100)}%
            </div>
            <div>
              genou D {hud.kneeR.toFixed(0)}° · G {hud.kneeL.toFixed(0)}°
            </div>
            <div>roll bassin {hud.roll.toFixed(1)}° · stabilité buste {Math.round((hud.stab ?? 1) * 100)}%</div>
            <div>
              direction {DIR_LABELS[hud.facing ?? 0]}
              {isDiagonal(hud.facing ?? 0) ? " (diago)" : ""} · pos/ repère : ligne{" "}
              {(hud.posX ?? 0) >= 0 ? "+" : ""}
              {(hud.posX ?? 0).toFixed(2)} m, travers {(hud.posZ ?? 0) >= 0 ? "+" : ""}
              {(hud.posZ ?? 0).toFixed(2)} m
            </div>
          </div>
        )}
      </div>

      <div className={"grid gap-4 " + (isPair ? "md:grid-cols-3" : isCompare ? "md:grid-cols-2" : "")}>
        <InfoCard styleKey={styleA} position={isPair ? "guideur" : isCompare ? "gauche" : ""} />
        {(isCompare || isPair) && (
          <InfoCard styleKey={isPair ? styleA : styleB} position={isPair ? "suiveur (miroir)" : "droite"} />
        )}
        {isPair && <PairInfoCard />}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Anatomie réelle du bassin au pied : os coxaux, sacrum, fémurs, patellas, tibias, fibulas et
        les 52 os des pieds, d'après BodyParts3D (réduction polygonale 99 %), © The Database Center
        for Life Science (DBCLS), licence CC BY-SA 2.1 Japan (
        https://dbarchive.biosciencedbc.jp/en/bodyparts3d/license.html). Buste stylisé en
        transparence au-dessus du sacrum ; couche musculaire optionnelle issue du même jeu de
        données BodyParts3D (même attribution CC BY-SA 2.1 Japan © DBCLS). « Déplacement » :
        0 = sur place, 100 % = largeur de hanche (±17 cm). Réglages sauvegardés localement
        (localStorage).
      </p>
    </div>
  );
}
