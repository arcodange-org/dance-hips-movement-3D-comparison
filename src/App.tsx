import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Rig from "./components/Rig";
import DanceTransport from "./components/DanceTransport";
import { createDanceClock, cycleBeats, exportBeat, seekClock } from "./clock";
import ContactViz from "./components/ContactViz";
import SortieGarconContactViz from "./components/SortieGarconContactViz";
import GridFloor from "./components/GridFloor";
import { DEFAULT_PLACEMENT, placementOf, type CouplePlacement } from "./placement";
import { SORTIE_FILLE_BEATS, SORTIE_FILLE_PAIR_DZ, sortieFilleBeat, sortieFilleVariantOf, type SortieFilleVariant } from "./sortieFille";
import { SORTIE_GARCON_BEATS, SORTIE_GARCON_PAIR_DZ, DEFAULT_SORTIE_CONTRA, sortieGarconSettings, type SortieVariant } from "./sortieGarcon";
import PagePrincipale from "./components/page/PagePrincipale";
import DemoOverlay, { DEMOS } from "./components/DemoOverlay";
import OriginMarker from "./components/OriginMarker";
import LineOfDance from "./components/LineOfDance";
import { essaiEnCours } from "./essais";
import CompassRose from "./components/CompassRose";
import { resolveCam, resolveView, viewAnglesOf, SOLID_TORSO_OPACITY } from "./cameras";
import { usePersistentState } from "./hooks/usePersistentState";
import { STYLES, movementOf, movementFlags, movementAllowed, travelAllowed, PAIR_DZ, setKompaProto, setSembaProto, setUmDoisProto, type ModeKey, type MovementKey } from "./styles";
import { setKneeFloor } from "./pose";
import { setUmDoisGesture } from "./umDois";
import { QUARTS_PAIR_DZ } from "./quartsPaire";
import { IDA_PAIR_DZ } from "./idaPaire";
import { PLACE_PAIR_DZ } from "./placePaire";
import { parseVec3, buildShareUrl } from "./share";
import { parseShareParams } from "./shareParams";
import { DIR_LABELS, isDiagonal } from "./directions";
import { useMusic, type MusicSource } from "./music/useMusic";
import { recordingOf } from "./music/recordings";

function readParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}
// #161 (prototype, docs/spec-ginga-huit.md): `?kompa=huit|huitGrand|huitInverse` shows a prototype of the
// kompa's « 8 » in place of today's model.
setKompaProto(readParams().get("kompa"));
setSembaProto(readParams().get("semba"));
// #196 (docs/spec-pas-de-base-1-2.md): the « 1 2 » is the basic step of the kizomba and of the semba alone;
// `?unDeux=large|court|doux` shows another candidate than the elected ones.
setUmDoisProto(readParams().get("unDeux"));
// #203 (prototype, docs/spec-flexion-minimale.md): `?flexion=15|20` shows a candidate minimum flexion of the knees.
setKneeFloor(readParams().get("flexion"));
// #209 (prototype, docs/spec-un-deux-geste.md): `?geste=ensemble|hancheDabord|hancheFinit` shows a candidate timing of
// the step aside of the « 1 2 » against the body that carries it.
setUmDoisGesture(readParams().get("geste"));

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
        appuis indicatifs G {Math.round(hud.loadL * 100)}% · D {Math.round(hud.loadR * 100)}% · genoux{" "}
        {hud.kneeL.toFixed(0)}°/{hud.kneeR.toFixed(0)}° · roll {hud.roll.toFixed(1)}° · inclinaison buste{" "}
        {(hud.trunkTilt ?? 0).toFixed(1)}°
      </div>
    </div>
  );
}

export default function App() {
  const params = readParams();
  const clock = useRef(createDanceClock()).current;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const cancelExport = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelExport.current?.(), []);
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
  const [chosenTravel, setTravel] = usePersistentState("travel", 0);
  const [showTorso, setShowTorso] = usePersistentState("showTorso", true);
  const [showMuscles, setShowMuscles] = usePersistentState("showMuscles", false);
  // #176: `haut=1` shows the anatomical bones and muscles of the trunk, arms and hands (docs/spec-haut-du-corps.md).
  const upperBody = params.get("haut") === "1";
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
  // #196: alone, in kizomba and in semba, the step on the spot of before the « 1 2 ».
  const [surPlace, setSurPlace] = usePersistentState("surPlace", false);
  // Phase 17 — sorties garçon/fille/combinée : 3 options de plus dans le mouvement exclusif.
  const [sortieG, setSortieG] = usePersistentState("sortieG", false);
  const [sortieF, setSortieF] = usePersistentState("sortieF", false);
  const [sortieGF, setSortieGF] = usePersistentState("sortieGF", false);
  const [sortieFilleVariant, setSortieFilleVariant] = usePersistentState<SortieFilleVariant>("sortieFilleVariant", "hook");
  const [placement, setPlacement] = usePersistentState<CouplePlacement>("placement", DEFAULT_PLACEMENT);
  // #51: plexus-to-plexus contact; 1 = chest faces the partner (contraposition), 0 = aligned with the pelvis.
  const [contraposition, setContraposition] = usePersistentState<number>("contraposition", 1);
  const [sortieVariant, setSortieVariant] = usePersistentState<SortieVariant>("sortieVariant", "line");
  const [sortieContra, setSortieContra] = usePersistentState("sortieContra", DEFAULT_SORTIE_CONTRA);
  // #128: virgula of the leader's G forward step in the pair ida e volta (style effect).
  const [idaVirgula, setIdaVirgula] = usePersistentState("idaVirgula", false);
  // Phase 14 — déplacements = options NON combinables (radio) : un seul actif à la fois.
  const chosenMovement = movementOf({ corridinho, quarts, temps3, ida, sortieG, sortieF, sortieGF, surPlace });
  // A style may offer only some movements (kompa: on the spot and ida e volta); otherwise on the spot.
  const shownStyles = mode === "compare" ? [styleA, styleB] : [styleA];
  // The figure « Sur place » (#196) is danced alone only: in pair the couple's basic step is on the spot already.
  const movement = shownStyles.every(k => movementAllowed(k, chosenMovement)) && !(mode === "pair" && chosenMovement === "surPlace") ? chosenMovement : "none";
  // Kompa: no lateral travel either (on the spot and ida e volta only).
  const travel = shownStyles.every(travelAllowed) ? chosenTravel : 0;
  const setMovement = (m: MovementKey) => {
    if ((m === "sortieG" || (mode === "pair" && m === "sortieF")) && m !== movement) seekClock(clock, 0);
    const f = movementFlags(m);
    setCorridinho(f.corridinho);
    setQuarts(f.quarts);
    setTemps3(f.temps3);
    setIda(f.ida);
    setSurPlace(f.surPlace);
    setSortieG(f.sortieG);
    setSortieF(f.sortieF);
    setSortieGF(f.sortieGF);
  };
  const [dir, setDir] = usePersistentState("dir", 1);
  const [showBoussole, setShowBoussole] = usePersistentState("boussole", true);
  // Son synthétisé (#44, docs/spec-son-synthese.md) : éteint à chaque visite (geste requis).
  const [musicSide, setMusicSide] = usePersistentState<"A" | "B">("musique", "A");
  const [musicMuted, setMusicMuted] = usePersistentState<string[]>("musiqueMuted", []);
  const [musicVolume, setMusicVolume] = usePersistentState("musiqueVolume", 0.7);
  // #142 (docs/spec-musique-elevenlabs.md) : boucle enregistrée par défaut, synthèse au choix.
  const [musicSource, setMusicSource] = usePersistentState<MusicSource>("musiqueSource", "enregistrement");
  const [soundWanted, setSoundWanted] = useState(false);
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
    // #31: the parsing is pure (src/shareParams.ts, tested with buildShareUrl); here it is only applied.
    const s = parseShareParams(params, { mode, movement });
    if (s.mode) setMode(s.mode);
    if (s.styleA) setStyleA(s.styleA);
    if (s.styleB) setStyleB(s.styleB);
    if (s.bpm !== undefined) setBpm(s.bpm);
    if (s.travel !== undefined) setTravel(s.travel);
    if (s.amp !== undefined) setAmp(s.amp);
    if (s.playing !== undefined) setPlaying(s.playing);
    if (s.torso !== undefined) setShowTorso(s.torso);
    if (s.muscles !== undefined) setShowMuscles(s.muscles);
    if (s.repere !== undefined) setShowRepere(s.repere);
    if (s.appui !== undefined) setShowAppui(s.appui);
    if (s.plant !== undefined) setPlant(s.plant);
    if (s.movement !== undefined) {
      const f = movementFlags(s.movement);
      setCorridinho(f.corridinho); setQuarts(f.quarts); setTemps3(f.temps3); setIda(f.ida); setSurPlace(f.surPlace);
      setSortieG(f.sortieG); setSortieF(f.sortieF); setSortieGF(f.sortieGF);
    }
    if (s.sortieFilleVariant) setSortieFilleVariant(s.sortieFilleVariant);
    if (s.placement) setPlacement(s.placement);
    if (s.contraposition !== undefined) setContraposition(s.contraposition);
    if (s.sortieVariant) setSortieVariant(s.sortieVariant);
    if (s.sortieContra !== undefined) setSortieContra(s.sortieContra);
    if (s.virgula !== undefined) setIdaVirgula(s.virgula);
    if (s.seek !== undefined) seekClock(clock, s.seek);
    // Élections (#148) : pendant une capture d'essai, `sortieBeat` avance l'horloge dans tous les modes.
    else if (essaiEnCours() && Number(params.get("sortieBeat")) >= 0) seekClock(clock, Number(params.get("sortieBeat")));
    if (s.ligne !== undefined) setShowLigne(s.ligne);
    if (s.iso !== undefined) setIso(s.iso);
    if (s.cadre !== undefined) setCadre(s.cadre);
    if (s.dir !== undefined) setDir(s.dir);
    if (s.boussole !== undefined) setShowBoussole(s.boussole);
    if (s.ghost) setGhostSel(s.ghost);
    if (s.contacts !== undefined) setShowContacts(s.contacts);
    if (s.musique) setMusicSide(s.musique);
    if (s.son) setSoundWanted(true);
    if (s.source) setMusicSource(s.source);
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
  const isSortieGarcon = isPair && movement === "sortieG";
  const isSortieFille = isPair && movement === "sortieF";
  const isFiveActionFigure = isSortieGarcon || isSortieFille;
  // #37: pair quarter turns share the couple placement of the five-action figures.
  const isQuartsPaire = isPair && movement === "quarts";
  // #54: so does the pair ida e volta (leader forward, follower back, quinconce at each return).
  const isIdaPaire = isPair && movement === "ida";
  // #61, #71: in pair without a figure (lateral travel, temps3), the couple dances in the neutral quinconce.
  const isPlacePaire = isPair && (movement === "none" || movement === "temps3");
  // #71: the pair corridinho is the validated couple turn of #37 (a circle on the floor in 16 beats).
  const isCorridinhoPaire = isPair && movement === "corridinho";
  const hasPlacement = isFiveActionFigure || isQuartsPaire || isIdaPaire || isPlacePaire || isCorridinhoPaire;
  const endBeat = isSortieFille ? SORTIE_FILLE_BEATS : SORTIE_GARCON_BEATS;
  const handlePlaying = (value: boolean) => {
    if (value && isFiveActionFigure && clock.beat >= endBeat) seekClock(clock, 0);
    setPlaying(value);
  };
  const isCompare = mode === "compare";
  const isObserve = mode === "observe";
  const reverseB = isPair && corridinho;
  // Comparaison : la musique de A ou de B ; sinon celle du style A.
  const musicStyleKey = isCompare && musicSide === "B" ? styleB : styleA;
  const music = useMusic({ clock, styleKey: musicStyleKey, bpm, playing: playing && !exporting,
    muted: musicMuted, volume: musicVolume, source: musicSource });
  const soundOn = music.status === "on";

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
      torso: showTorso, muscles: showMuscles, repere: showRepere, appui: showAppui,
      sortieG: movement === "sortieG" ? true : undefined,
      sortieVariant: isSortieGarcon ? sortieVariant : undefined,
      sortieContra: isSortieGarcon ? sortieContra : undefined,
      virgula: isIdaPaire && idaVirgula ? true : undefined,
      sortieFilleVariant: isSortieFille ? sortieFilleVariant : undefined,
      placement: hasPlacement ? placement : undefined,
      contra: hasPlacement ? contraposition : undefined,
      sortieBeat: isFiveActionFigure ? Number(clock.beat.toFixed(3)) : undefined,
      sortieF: movement === "sortieF" ? true : undefined,
      sortieGF: movement === "sortieGF" ? true : undefined,
      surPlace: movement === "surPlace" ? true : undefined,
      plant, corridinho, ligne: showLigne, iso, cadre, quarts, temps3, ida, dir,
      ghost: ghostSel, boussole: showBoussole, contacts: showContacts,
      son: soundOn ? true : undefined, musique: soundOn && isCompare ? musicSide : undefined,
      source: soundOn && musicSource === "synthese" && recordingOf(musicStyleKey) ? "synthese" : undefined,
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

  // Les figures en cinq actions ont chacune un écartement calibré.
  const pairDz = isSortieGarcon ? SORTIE_GARCON_PAIR_DZ : isSortieFille ? SORTIE_FILLE_PAIR_DZ : isQuartsPaire || isCorridinhoPaire ? QUARTS_PAIR_DZ
    : isIdaPaire ? IDA_PAIR_DZ : isPlacePaire ? PLACE_PAIR_DZ : PAIR_DZ;
  const offsetA: [number, number, number] = isPair ? [0, 0, -pairDz] : isCompare ? [-0.85, 0, 0] : [0, 0, 0];
  const offsetB: [number, number, number] = isPair ? [0, 0, pairDz] : [0.85, 0, 0];

  const handleMode = (m: ModeKey) => {
    if (m === "pair" && mode !== "pair" && (movement === "sortieG" || movement === "sortieF")) seekClock(clock, 0);
    if (m === "observe" && mode !== "observe") {
      setBpm(32);
      setShowTorso(false);
      setTravel(0);
      setShowAppui(true);
    }
    setMode(m);
  };

  const exportCycle = async () => {
    if (cancelExport.current) return;
    if (isFiveActionFigure && (!pairRef.current.leader || !pairRef.current.follower)) {
      setExportError("Les corps sont en cours de chargement. Réessayez l’export lorsqu’ils apparaissent."); return;
    }
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      setExportError("L’export vidéo n’est pas disponible dans ce navigateur."); return;
    }
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
      .find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) { setExportError("Ce navigateur ne prend pas en charge l’export WebM."); return; }
    const savedBeat = clock.beat;
    let frameId = 0;
    let stream: MediaStream | undefined;
    let rec: MediaRecorder | undefined;
    let cancelled = false;
    const restore = () => {
      cancelAnimationFrame(frameId);
      stream?.getTracks().forEach(track => track.stop());
      clock.beat = savedBeat; clock.exportFrame = null;
      cancelExport.current = null;
      setExporting(false);
    };
    cancelExport.current = () => {
      cancelled = true;
      if (rec?.state === "recording") rec.stop();
      restore();
    };
    setExportError(""); setExporting(true);
    clock.exportFrame = 0; clock.beat = 0;
    try {
      // Let both rigs render beat zero before the recording starts, also when paused.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (cancelled) return;
      stream = canvas.captureStream(30);
      rec = new MediaRecorder(stream, { mimeType: mime });
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onerror = () => { cancelled = true; setExportError("L’enregistrement vidéo a échoué."); restore(); };
      rec.onstop = () => {
        if (!cancelled) {
          const url = URL.createObjectURL(new Blob(chunks, { type: mime }));
          const link = document.createElement("a");
          link.href = url;
          link.download = `danse-${styleA}-${bpm}bpm.webm`;
          link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        restore();
      };
      const duration = cycleBeats({ movement: (movement === "sortieG" || movement === "sortieF") && !isPair ? "none" : movement, quarts, corridinho, ida, temps3 });
      const started = performance.now();
      const tick = (now: number) => {
        const elapsed = (now - started) / 1000;
        if (elapsed >= duration * 60 / bpm) {
          if (isFiveActionFigure) {
            // Hold the final marka for two frames so the recording ends on it.
            clock.beat = duration;
            frameId = requestAnimationFrame(() => { frameId = requestAnimationFrame(() => rec!.stop()); });
          } else rec!.stop();
          return;
        }
        const frame = Math.floor(elapsed * 30);
        clock.exportFrame = frame; clock.beat = exportBeat(frame, 30, bpm);
        frameId = requestAnimationFrame(tick);
      };
      rec.start(); frameId = requestAnimationFrame(tick);
    } catch {
      cancelled = true; setExportError("Impossible de démarrer l’export vidéo."); restore();
    }
  };

  // #31: one scene for the bare (captures) and the full view; the bare view keeps its own clock (no music
  // driver) and no pan.
  const renderScene = (bare: boolean, driver: typeof music.driver | null) => (
    <Canvas camera={{ position: camPosParam ?? cam.position, fov: 42 }} dpr={[1, 2]}>
      {!isFiveActionFigure && <DanceTransport clock={clock} bpm={bpm} playing={playing} driver={driver} />}
      <color attach="background" args={["#0b1220"]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.3} />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#93c5fd" />
      <GridFloor />
      <OriginMarker visible={showRepere} />
      <CompassRose visible={showBoussole && showRepere} />
      {/* #72 (elected 2026-11-21): in pair, the line of dance runs through both dancers. */}
      <LineOfDance visible={ligneVisible} axis={isPair ? "z" : "x"} />
      <React.Suspense fallback={null}>
        {isFiveActionFigure && <DanceTransport clock={clock} bpm={bpm} playing={playing}
          endBeat={endBeat} onEnd={() => setPlaying(false)} driver={driver} />}
        <Rig
          styleKey={styleA}
          bpm={bpm}
          clock={clock}
          amp={amp}
          playing={playing}
          offset={offsetA}
          rotationY={0}
          ghost={ghostA}
          embrace={isPair}
          pair={isPair ? pairRef : null}
          side={isPair ? "leader" : null}
          showContacts={isPair && showContacts && !hasPlacement}
          travel={travel}
          showTorso={showTorso}
          showMuscles={showMuscles}
          upperBody={upperBody}
          movement={movement}
          sortieFilleVariant={sortieFilleVariant}
          placement={hasPlacement ? placement : undefined}
          contraposition={contraposition}
          sortieVariant={sortieVariant}
          sortieContra={sortieContra}
          idaVirgula={isIdaPaire && idaVirgula}
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
            clock={clock}
            amp={amp}
            playing={playing}
            offset={offsetB}
            rotationY={isPair ? Math.PI : 0}
            ghost={ghostB}
            embrace={isPair}
            pair={isPair ? pairRef : null}
            side={isPair ? "follower" : null}
            showContacts={isPair && showContacts && !hasPlacement}
            travel={travel}
            showTorso={showTorso}
            showMuscles={showMuscles}
          upperBody={upperBody}
            movement={movement}
            sortieFilleVariant={sortieFilleVariant}
            placement={hasPlacement ? placement : undefined}
          contraposition={contraposition}
            sortieVariant={sortieVariant}
            sortieContra={sortieContra}
            idaVirgula={isIdaPaire && idaVirgula}
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
        {isPair && showContacts && (isFiveActionFigure
          ? <SortieGarconContactViz pair={pairRef} clock={isSortieFille ? clock : undefined} /> : <ContactViz pair={pairRef} />)}
      </React.Suspense>
      <OrbitControls
        ref={controlsRef}
        target={camTgtParam ?? cam.target}
        enableDamping
        dampingFactor={0.08}
        // Avec le haut du corps anatomique on vient voir les mains de près (#179).
        minDistance={upperBody ? 0.35 : 1.8}
        maxDistance={7}
        {...(bare ? { enablePan: false } : {})}
      />
    </Canvas>
  );
  if (bare) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
        {renderScene(true, null)}
        {showAppui && (isCompare || isFiveActionFigure) && hud && hudB && (
          <div className="absolute top-3 right-3 pointer-events-none bg-slate-900/70 rounded-md px-2 py-1 space-y-1.5 max-w-[90%]">
            <Gauge label={`${isFiveActionFigure ? "Leader" : "A"} · ${STYLES[styleA].label}`} color={STYLES[styleA].color} hud={hud} />
            <Gauge label={`${isFiveActionFigure ? "Partenaire" : "B"} · ${STYLES[isPair ? styleA : styleB].label}`} color={STYLES[isFiveActionFigure ? styleA : styleB].color} hud={hudB} />
          </div>
        )}
        {showAppui && !isCompare && !isFiveActionFigure && hud && (
          <div className="absolute top-3 right-3 pointer-events-none text-[11px] font-mono text-slate-200 bg-slate-900/70 rounded-md px-2 py-1 space-y-0.5">
            <div>
              appuis indicatifs · D {Math.round(hud.loadR * 100)}% · G {Math.round(hud.loadL * 100)}%
            </div>
            <div>
              genou D {hud.kneeR.toFixed(0)}° · G {hud.kneeL.toFixed(0)}°
            </div>
            <div>roll bassin {hud.roll.toFixed(1)}° · inclinaison buste {(hud.trunkTilt ?? 0).toFixed(1)}°</div>
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
              style={{ background: STYLES[isPair ? styleA : styleB].color }}
            >
              {isPair ? "Suiveur · " : ""}
              {STYLES[isPair ? styleA : styleB].label}
            </span>
          </div>
        )}
      </div>
    );
  }

  // #192 (docs/spec-page-scene-panneau.md): the page (tabs, scene, playback bar, settings panel) is laid out by
  // `PagePrincipale`; the state, the URL parameters and the scene stay here.
  return (
    <PagePrincipale
      scene={renderScene(false, music.driver)}
      clock={clock}
      etat={{ mode, styleA, styleB, movement, playing, bpm, amp, travel, dir, showTorso, showMuscles, showAppui, ghostSel,
        showRepere, showBoussole, showLigne, showContacts, plant, iso, cadre, sortieVariant, sortieContra, sortieFilleVariant,
        placement, contraposition, idaVirgula }}
      on={{ mode: handleMode, styleA: setStyleA, styleB: setStyleB, movement: setMovement, playing: handlePlaying, bpm: setBpm,
        amp: setAmp, travel: setTravel, dir: setDir, showTorso: setShowTorso, showMuscles: setShowMuscles, showAppui: setShowAppui,
        ghostSel: setGhostSel, showRepere: setShowRepere, showBoussole: setShowBoussole, showLigne: setShowLigne,
        showContacts: setShowContacts, plant: setPlant, iso: setIso, cadre: setCadre, sortieVariant: setSortieVariant,
        sortieContra: setSortieContra, sortieFilleVariant: setSortieFilleVariant, placement: setPlacement,
        contraposition: setContraposition, idaVirgula: setIdaVirgula }}
      son={{ status: music.status, wanted: soundWanted, toggle: () => { setSoundWanted(false); void music.toggle(); },
        styleKey: musicStyleKey, side: musicSide, onSide: setMusicSide, muted: musicMuted, onMuted: setMusicMuted,
        volume: musicVolume, onVolume: setMusicVolume, recording: music.recording,
        hasRecording: recordingOf(musicStyleKey) !== undefined, source: musicSource, onSource: setMusicSource,
        unavailable: music.unavailable, loading: music.loading }}
      mesures={hud}
      mesuresB={hudB}
      onShare={onShare}
      copied={copied}
      onExport={exportCycle}
      exporting={exporting}
      exportError={exportError}
    />
  );
}
