import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Rig from "./components/Rig";
import ContactViz from "./components/ContactViz";
import GridFloor from "./components/GridFloor";
import Controls from "./components/Controls";
import { InfoCard, PairInfoCard } from "./components/InfoCards";
import { usePersistentState } from "./hooks/usePersistentState";
import { STYLES, type ModeKey } from "./styles";

export default function App() {
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
  const pairRef = useRef<Record<string, any>>({});

  const isPair = mode === "pair";
  const isCompare = mode === "compare";
  const isObserve = mode === "observe";
  const ghostA = (isCompare || isPair) && ghostSel === "B";
  const ghostB = ghostSel === "A";

  const offsetA: [number, number, number] = isPair ? [-0.14, 0, 0] : isCompare ? [-0.85, 0, 0] : [0, 0, 0];
  const offsetB: [number, number, number] = isPair ? [0.14, 0, 0] : [0.85, 0, 0];

  const handleMode = (m: ModeKey) => {
    if (m === "observe" && mode !== "observe") {
      setBpm(32);
      setShowTorso(false);
      setTravel(0);
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
          <React.Suspense fallback={null}>
            <Rig
              styleKey={styleA}
              bpm={bpm}
              amp={amp}
              playing={playing}
              offset={offsetA}
              rotationY={isPair ? Math.PI / 2 : 0}
              ghost={ghostA}
              embrace={isPair}
              pair={isPair ? pairRef : null}
              side={isPair ? "leader" : null}
              showContacts={isPair && showContacts}
              travel={travel}
              showTorso={showTorso}
            />
            {(isCompare || isPair) && (
              <Rig
                styleKey={styleB}
                bpm={bpm}
                amp={amp}
                playing={playing}
                offset={offsetB}
                rotationY={isPair ? -Math.PI / 2 : 0}
                ghost={ghostB}
                embrace={isPair}
                phaseOffset={isPair ? followDelay : 0}
                pair={isPair ? pairRef : null}
                side={isPair ? "follower" : null}
                showContacts={isPair && showContacts}
                travel={travel}
                showTorso={showTorso}
              />
            )}
            {isPair && <ContactViz pair={pairRef} />}
          </React.Suspense>
          <OrbitControls
            target={[0, 0.88, 0]}
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
        transparence au-dessus du sacrum. « Déplacement » : 0 = sur place, 100 % = largeur de
        hanche (±17 cm). Réglages sauvegardés localement (localStorage).
      </p>
    </div>
  );
}
