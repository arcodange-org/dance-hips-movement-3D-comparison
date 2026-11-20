/** Guide mode proof of concept (#69, docs/spec-mode-guidage-poc.md): `?mode=pair&guidage=1`.
 * The player leads: a key chooses the follower's next pair figure, executed at the next beat boundary
 * through the neutral quinconce. The rest of the app is unchanged. */
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Rig from "./Rig";
import DanceTransport from "./DanceTransport";
import GridFloor from "./GridFloor";
import { createDanceClock, seekClock, type DanceClock } from "../clock";
import { STYLES } from "../styles";
import { useMusic } from "../music/useMusic";
import {
  GuideSession, GUIDE_FIGURES, GUIDE_FIGURE_KEYS, GUIDE_PAIR_DZ, GUIDE_DEMO, applyTransform, figureOfCode, keyLabel,
  type GuideFigure, type GuideOutcome, type GuideKind,
} from "../guidage";

const KIND_LABEL = (k: GuideKind) => (k === "base" ? "Pas de base" : GUIDE_FIGURES[k].label);
const GRADE_CLASS: Record<string, string> = {
  Parfait: "text-emerald-300", Bien: "text-sky-300", Juste: "text-amber-300", Raté: "text-rose-300",
};

/** Moves the couple frame (both dancers) with the composed motion of the figures already danced. */
function CoupleFrame({ session, clock, children }: { session: GuideSession; clock: DanceClock; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const s = session.sample(clock.beat);
    if (!group.current || !s) return;
    group.current.position.set(s.couple.x, 0, s.couple.z);
    group.current.rotation.y = s.couple.yaw;
  }, -50);
  return <group ref={group}>{children}</group>;
}

/** #87 (owner: « proposer le point de vue du guideur ») : the camera stands behind the leader, over his
 * shoulder, in the couple frame (it turns with the couple), looking at the follower. Couple frame: the
 * leader at z = −GUIDE_PAIR_DZ facing +z. */
export const LEADER_VIEW = { eye: { x: 0.45, y: 1.95, z: -GUIDE_PAIR_DZ - 2.6 }, target: { x: 0, y: 0.75, z: 0.3 } };

/** Keeps the orbit target on the couple's centre; the camera follows by the same displacement. In the
 * leader's view, it follows the couple frame, yaw included. */
function CameraFollow({ session, clock, paused, leaderView }: { session: GuideSession; clock: DanceClock; paused: React.MutableRefObject<boolean>; leaderView: boolean }) {
  const controls = useThree(s => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const camera = useThree(s => s.camera);
  useFrame(() => {
    const s = session.sample(clock.beat);
    if (!controls || !s) return;
    // Frame-by-frame captures (paused at a given beat) jump straight to the couple.
    const rate = clock.exportFrame === null && !paused.current ? 0.06 : 1;
    if (leaderView) {
      const eye = applyTransform(s.couple, LEADER_VIEW.eye), target = applyTransform(s.couple, LEADER_VIEW.target);
      camera.position.lerp(new THREE.Vector3(eye.x, LEADER_VIEW.eye.y, eye.z), rate);
      controls.target.lerp(new THREE.Vector3(target.x, LEADER_VIEW.target.y, target.z), rate);
      controls.update();
      return;
    }
    const centre = applyTransform(s.couple, { x: 0, z: 0 });
    const goal = new THREE.Vector3(centre.x, 0.8, centre.z);
    const step = goal.sub(controls.target).multiplyScalar(rate);
    controls.target.add(step); camera.position.add(step); controls.update();
  });
  return null;
}

/** Last frame's beat and time, to date a key press between two frames. */
function FrameClock({ clock, last }: { clock: DanceClock; last: React.MutableRefObject<{ beat: number; time: number }> }) {
  // Negative priority: after the transport (−100), and R3F keeps rendering automatically.
  useFrame(() => { last.current = { beat: clock.beat, time: performance.now() }; }, -40);
  return null;
}

export default function GuidageApp() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const styleKey = STYLES[params.get("style") ?? ""] ? params.get("style")! : "kizomba";
  // `bare=1`: canvas and a one-line caption only (GIF captures).
  const bare = params.get("bare") === "1";
  // #87: the leader's point of view by default (`vue=libre` for the free orbit view).
  const [leaderView, setLeaderView] = useState(params.get("vue") !== "libre");
  const initialBpm = Number(params.get("bpm"));
  const [bpm, setBpm] = useState(Number.isFinite(initialBpm) && initialBpm >= 40 && initialBpm <= 130 ? initialBpm : 60);
  const [playing, setPlaying] = useState(false);
  const clock = useMemo(() => createDanceClock(), []);
  const session = useMemo(() => new GuideSession(), []);
  // `demo=1`: the demonstration session; `beat=` (or `sortieBeat=`, scripts/capture_figure_gif.mjs) shows
  // that beat, paused, for frame-by-frame captures.
  useMemo(() => {
    if (params.get("demo") === "1") session.intentions = GUIDE_DEMO.map(i => ({ ...i, bpm }));
    const frame = Number(params.get("beat") ?? params.get("sortieBeat"));
    if (params.has("beat") || params.has("sortieBeat")) if (Number.isFinite(frame)) seekClock(clock, Math.max(0, frame));
  }, [params, session, clock]); // eslint-disable-line react-hooks/exhaustive-deps
  const pair = useRef<Record<string, any>>({});
  const last = useRef({ beat: 0, time: performance.now() });
  const paused = useRef(true);
  // Letters of the user's layout (AZERTY shows Z Q A D): Keyboard API where available, then key presses.
  const [layout, setLayout] = useState<Map<string, string>>(() => new Map());
  useEffect(() => {
    const kb = (navigator as unknown as { keyboard?: { getLayoutMap?: () => Promise<Map<string, string>> } }).keyboard;
    kb?.getLayoutMap?.().then(map => setLayout(new Map(map))).catch(() => undefined);
  }, []);
  paused.current = !playing;
  const music = useMusic({ clock, styleKey, bpm, playing, muted: [], volume: 0.8 });
  const [hud, setHud] = useState<{ beat: number; kind: GuideKind; next: number | null; pending: GuideFigure | null; outcome: GuideOutcome | null; streak: number }>(
    { beat: 0, kind: "base", next: null, pending: null, outcome: null, streak: 0 });

  // Beat of a press: the last frame's beat plus the time elapsed since (the clock advances per frame).
  const beatAt = (time: number) => {
    const { beat, time: at } = last.current;
    // Same 0.1 s cap per frame as the transport (src/clock.ts): a press never runs ahead of the clock.
    return playing ? beat + Math.min(0.1, Math.max(0, time - at) / 1000) * bpm / 60 : beat;
  };
  const lead = (figure: GuideFigure, time = performance.now()) => {
    if (!playing) return;
    session.press(beatAt(time), figure, bpm);
  };
  const restart = () => { session.reset(); seekClock(clock, 0); last.current = { beat: 0, time: performance.now() }; setPlaying(true); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") { e.preventDefault(); setPlaying(p => !p); return; }
      // Physical position (e.code): ZQSD on AZERTY = WASD on QWERTY. The letter typed teaches the layout.
      const figure = figureOfCode(e.code);
      if (figure) {
        e.preventDefault(); lead(figure, e.timeStamp);
        if (e.key.length === 1) setLayout(l => (l.get(e.code) === e.key ? l : new Map(l).set(e.code, e.key)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const id = setInterval(() => {
      const plan = session.plan(clock.beat);
      if (!plan) return;
      const s = plan.segments[plan.segments.length - 1];
      const waiting = plan.outcomes.filter(o => o && o.verdict === "en attente" && o.boundary !== null);
      const latest = plan.outcomes.length ? plan.outcomes[plan.outcomes.length - 1] : null;
      const kind = (s.start <= clock.beat ? s : plan.segments[plan.segments.length - 2] ?? s).kind;
      const next = s.kind === "base" ? null : s.start + GUIDE_FIGURES[s.kind].beats;
      setHud({ beat: clock.beat, kind, next, pending: waiting.length ? waiting[waiting.length - 1].intention.figure : null,
        outcome: latest ?? null, streak: latest?.streak ?? 0 });
    }, 80);
    return () => clearInterval(id);
  }, [clock, session]);

  const count = Math.floor(hud.beat) % 8 + 1;
  const o = hud.outcome;
  const verdictText = o ? ({
    accepté: "guidage reçu", ambigu: "guidage ambigu : elle reste au pas de base", "trop tôt": "trop tôt dans la figure",
    "trop tard": "trop tard pour cette frontière", répété: "déjà reçu", "en attente": "en attente de la prochaine frontière",
  } as const)[o.verdict] : "";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Canvas camera={{ position: leaderView ? [LEADER_VIEW.eye.x, LEADER_VIEW.eye.y, LEADER_VIEW.eye.z] : [2.7, 1.5, 3.4], fov: 40 }} dpr={[1, 2]}>
        <DanceTransport clock={clock} bpm={bpm} playing={playing} driver={music.driver} />
        <FrameClock clock={clock} last={last} />
        <color attach="background" args={["#0b1220"]} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#93c5fd" />
        <GridFloor />
        <React.Suspense fallback={null}>
          <CoupleFrame session={session} clock={clock}>
            {(["leader", "follower"] as const).map(side => (
              <Rig key={side} styleKey={styleKey} bpm={bpm} clock={clock} amp={1} playing={playing}
                offset={[0, 0, side === "leader" ? -GUIDE_PAIR_DZ : GUIDE_PAIR_DZ]} rotationY={side === "leader" ? 0 : Math.PI}
                embrace pair={pair} side={side} placement="quinconce" movement="none" guide={session} />
            ))}
          </CoupleFrame>
        </React.Suspense>
        <OrbitControls makeDefault target={leaderView ? [LEADER_VIEW.target.x, LEADER_VIEW.target.y, LEADER_VIEW.target.z] : [0, 0.8, 0]} enableDamping dampingFactor={0.08} minDistance={1.4} maxDistance={7} />
        <CameraFollow session={session} clock={clock} paused={paused} leaderView={leaderView} />
      </Canvas>

      {bare && (
        <div className="absolute top-2 left-3 right-3 text-sm text-slate-200">
          <span className="text-xl font-semibold tabular-nums mr-2">{count}</span>{KIND_LABEL(hud.kind)}
          {hud.pending && <span className="text-sky-300"> → {GUIDE_FIGURES[hud.pending].label}</span>}
          {o && <span className={"ml-2 " + GRADE_CLASS[o.grade]}>{o.grade}</span>}
          <span className="block text-[10px] text-slate-500">Mode guidage (preuve de concept) · BodyParts3D © DBCLS, CC BY-SA 2.1 Japan</span>
        </div>
      )}
      {!bare && <>
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 max-w-md pointer-events-auto">
          <h1 className="text-sm font-semibold text-slate-100">Mode guidage <span className="text-slate-400 font-normal">· preuve de concept</span></h1>
          <p className="text-xs text-slate-400 mt-1">
            Vous êtes le leader : choisissez la figure suivante juste avant le temps. La suiveuse la danse à la
            prochaine frontière, depuis la quinconce. {STYLES[styleKey].label ?? styleKey}, {bpm} bpm.
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-2xl font-semibold tabular-nums text-slate-100" aria-label="compte">{count}</span>
            <span>
              <span className="text-slate-100">{KIND_LABEL(hud.kind)}</span>
              {hud.pending && <span className="text-sky-300"> → {GUIDE_FIGURES[hud.pending].label}</span>}
            </span>
          </div>
          <div className="mt-1 text-xs min-h-[1.25rem]" aria-live="polite">
            {o && <>
              <span className={GRADE_CLASS[o.grade]}>{o.grade}</span>
              <span className="text-slate-400"> {Math.abs(o.errorMs).toFixed(0)} ms {o.errorMs < 0 ? "tôt" : o.errorMs > 0 ? "tard" : ""}</span>
              <span className="text-slate-300"> · {verdictText}</span>
            </>}
          </div>
          <div className="text-xs text-slate-400">Série : <span className="text-slate-100 tabular-nums">{hud.streak}</span></div>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs flex flex-wrap gap-2 pointer-events-auto">
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700" onClick={() => playing ? setPlaying(false) : (clock.beat === 0 ? restart() : setPlaying(true))}>
            {playing ? "Pause" : clock.beat === 0 ? "Démarrer" : "Reprendre"} <kbd className="text-slate-500">Espace</kbd>
          </button>
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700" onClick={restart}>Recommencer</button>
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700" aria-pressed={leaderView} onClick={() => setLeaderView(v => !v)}
            title="Point de vue du guideur (derrière son épaule) ou vue libre">
            Vue : {leaderView ? "guideur" : "libre"}
          </button>
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700" aria-pressed={music.status === "on"} onClick={() => void music.toggle()}>
            Son {music.status === "on" ? "actif" : "coupé"}
          </button>
          <label className="flex items-center gap-1 text-slate-400">bpm
            <input type="number" min={40} max={130} value={bpm} onChange={e => setBpm(Math.max(40, Math.min(130, Number(e.target.value) || 60)))}
              className="w-14 rounded bg-slate-800 px-1 py-1 text-slate-100" />
          </label>
          <a className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700" href={`?mode=pair&style=${styleKey}`}>Quitter</a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 px-3">
        {GUIDE_FIGURE_KEYS.map(f => (
          <button key={f} onPointerDown={e => lead(f, e.timeStamp)} disabled={!playing}
            className="rounded-xl bg-slate-900/85 border border-slate-700 px-4 py-3 text-sm text-slate-100 hover:bg-slate-800 disabled:opacity-50">
            {GUIDE_FIGURES[f].label} <kbd className="ml-1 text-slate-400">{keyLabel(f, layout)}</kbd>
          </button>
        ))}
      </div>
      <p className="absolute bottom-2 left-3 right-3 text-[10px] text-slate-500">
        Anatomie : BodyParts3D, © The Database Center for Life Science, licence CC BY-SA 2.1 Japan. Animation
        paramétrique illustrative, sans validation chorégraphique.
      </p>
      </>}
    </div>
  );
}
