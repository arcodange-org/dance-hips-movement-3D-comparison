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
import { resolveCam, SOLID_TORSO_OPACITY } from "./cameras";
import { usePersistentState } from "./hooks/usePersistentState";
import { STYLES, type ModeKey } from "./styles";

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
  const [followDelay, setFollowDelay] = usePersistentState("followDelay", 0.5);
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
    if (p.has("corridinho")) setCorridinho(p.get("corridinho") !== "0");
    if (p.has("ligne")) setShowLigne(p.get("ligne") !== "0");
    if (p.has("iso")) setIso(p.get("iso") !== "0");
    if (p.has("cadre")) setCadre(p.get("cadre") !== "0");
    if (p.has("delay")) { const d = num("delay"); if (d !== null) setFollowDelay(Math.min(2, Math.max(0, d))); }
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
  const cam = resolveCam(params.get("cam"), mode === "pair");
  const solid = params.get("solid") === "1";
  const isPair = mode === "pair";
  const isCompare = mode === "compare";
  const isObserve = mode === "observe";
  // Ligne de danse affichée par défaut en paire/comparaison ; en solo, seulement si ligne=1 explicite.
  const ligneVisible = showLigne && (isPair || isCompare || params.get("ligne") === "1");
  const ghostA = (isCompare || isPair) && ghostSel === "B";
  const ghostB = ghostSel === "A";

  const offsetA: [number, number, number] = isPair ? [0, 0, -0.14] : isCompare ? [-0.85, 0, 0] : [0, 0, 0];
  const offsetB: [number, number, number] = isPair ? [0, 0, 0.14] : [0.85, 0, 0];

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
        <Canvas camera={{ position: cam.position, fov: 42 }} dpr={[1, 2]}>
          <color attach="background" args={["#0b1220"]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[3, 5, 4]} intensity={1.3} />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#93c5fd" />
          <GridFloor />
          <OriginMarker visible={showRepere} />
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
            />
            {(isCompare || isPair) && (
              <Rig
                styleKey={styleB}
                bpm={bpm}
                amp={amp}
                playing={playing}
                offset={offsetB}
                rotationY={isPair ? Math.PI : 0}
                ghost={ghostB}
                embrace={isPair}
                phaseOffset={isPair ? followDelay : 0}
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
              />
            )}
            {isPair && <ContactViz pair={pairRef} />}
          </React.Suspense>
          <OrbitControls
            target={cam.target}
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
        followDelay={followDelay}
        onFollowDelay={setFollowDelay}
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
        corridinho={corridinho}
        onCorridinho={setCorridinho}
        showLigne={showLigne}
        onShowLigne={setShowLigne}
        iso={iso}
        onIso={setIso}
        cadre={cadre}
        onCadre={setCadre}
        ghostSel={ghostSel}
        onGhostSel={setGhostSel}
        onExport={exportCycle}
      />

      <div
        className="relative rounded-2xl overflow-hidden border border-slate-800"
        style={{ height: 540 }}
      >
        <Canvas camera={{ position: [0, 1.2, 3.4], fov: 42 }} dpr={[1, 2]}>
          <color attach="background" args={["#0b1220"]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[3, 5, 4]} intensity={1.3} />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#93c5fd" />
          <GridFloor />
          <OriginMarker visible={showRepere} />
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
            />
            {(isCompare || isPair) && (
              <Rig
                styleKey={styleB}
                bpm={bpm}
                amp={amp}
                playing={playing}
                offset={offsetB}
                rotationY={isPair ? Math.PI : 0}
                ghost={ghostB}
                embrace={isPair}
                phaseOffset={isPair ? followDelay : 0}
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
              />
            )}
            {isPair && <ContactViz pair={pairRef} />}
          </React.Suspense>
          <OrbitControls
            target={cam.target}
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
          </div>
        )}
      </div>

      <div className={"grid gap-4 " + (isPair ? "md:grid-cols-3" : isCompare ? "md:grid-cols-2" : "")}>
        <InfoCard styleKey={styleA} position={isPair ? "guideur" : isCompare ? "gauche" : ""} />
        {(isCompare || isPair) && (
          <InfoCard styleKey={styleB} position={isPair ? "suiveur" : "droite"} />
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
