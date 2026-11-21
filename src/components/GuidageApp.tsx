/** Game mode (#69, docs/spec-mode-guidage-poc.md; #140, docs/spec-jeu-file-auto.md): `?mode=pair&guidage=1`.
 * The player leads: each key queues a pair figure for the follower; the figures are danced in order, each
 * from the neutral quinconce. Space lets the couple dance by itself. The rest of the app is unchanged. */
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
import TransitionCard from "./TransitionCard";
import { FOLLOWER_VARIANT } from "../insertion";
import { transitionAt } from "../transitions";
import {
  GuideSession, GUIDE_FIGURES, GUIDE_FIGURE_KEYS, guideFiguresFor, guideStyleOf, GUIDE_PAIR_DZ, GUIDE_DEMO, GUIDE_DEMO_ARROWS, GUIDE_DEMO_CHAIN, GUIDE_DEMO_INSERT, GUIDE_DEMO_TOUCH, applyTransform, figureOfCode, keyLabel, type HeldArrows,
  type GuideFigure, type GuideKind, type GuideSample,
} from "../guidage";

const KIND_LABEL = (k: GuideKind) => (k === "base" ? "Pas de base" : GUIDE_FIGURES[k].label);
/** #144: what the HUD shows of the figure under way: its touches, and the one being danced. */
type Now = Pick<GuideSample, "kind" | "touch" | "touchBeat" | "figureBeat"> & { touches: number };
const START: Now = { kind: "base", touch: null, touchBeat: 0, figureBeat: 0, touches: 0 };
/** The ida e volta's slot a touch dances: the same foot, the same direction. */
const touchKey = (now: Now) => (now.touch!.back ? (now.touch!.side === "R" ? "idaArrD" : "idaArr") : now.touch!.side === "R" ? "idaD" : "ida") as GuideFigure;
const touchLabel = (now: Now) => `aller-retour du ${now.touch!.side === "L" ? "pied gauche" : "pied droit"} ${now.touch!.back ? "en arrière" : "en avant"}${now.touch!.virgula ? ", en virgula" : ""}`;

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
  // #137: the muscle layer for the captures (`muscles=1`), as in the app.
  const muscles = params.get("muscles") === "1";
  // #87: the leader's point of view by default (`vue=libre` for the free orbit view).
  const [leaderView, setLeaderView] = useState(params.get("vue") !== "libre");
  const initialBpm = Number(params.get("bpm"));
  const [bpm, setBpm] = useState(Number.isFinite(initialBpm) && initialBpm >= 40 && initialBpm <= 130 ? initialBpm : 60);
  // #140 (owner: « par défaut le simulateur "écoute" (pas besoin d'appuyer sur espace) »): the couple dances
  // and the keys are listened to as soon as the view opens. `beat=` (or `sortieBeat=`,
  // scripts/capture_figure_gif.mjs) shows that beat, paused, for frame-by-frame captures.
  const capture = params.has("beat") || params.has("sortieBeat");
  const [playing, setPlaying] = useState(!capture);
  const clock = useMemo(() => createDanceClock(), []);
  const session = useMemo(() => new GuideSession(), []);
  // #140: Space switches between listening to the commands and the automatic dance (`auto=1` opens in
  // it; `graine=N` fixes its seed: same seed, same dance).
  const [auto, setAuto] = useState(params.get("auto") === "1");
  // #62: the style offers some figures only (kompa: the walks).
  const offered = guideFiguresFor(styleKey);
  useMemo(() => {
    const seed = Number(params.get("graine"));
    session.seed = params.has("graine") && Number.isFinite(seed) ? Math.trunc(seed) : Date.now() % 2147483647;
    session.offered = guideFiguresFor(styleKey);
    session.reset(params.get("auto") === "1");
    // `demo=…`: the demonstration sessions (commands already pressed).
    if (params.get("demo") === "1") session.intentions = GUIDE_DEMO.map(i => ({ ...i }));
    if (params.get("demo") === "fleches") session.intentions = GUIDE_DEMO_ARROWS.map(i => ({ ...i }));
    if (params.get("demo") === "enchainement") session.intentions = GUIDE_DEMO_CHAIN.map(i => ({ ...i }));
    if (params.get("demo") === "insertion") session.intentions = GUIDE_DEMO_INSERT.map(i => ({ ...i }));
    if (params.get("demo") === "allerretour") session.intentions = GUIDE_DEMO_TOUCH.map(i => ({ ...i }));
    // Election prototypes (#86, #144): `suiveuse=memePied|immobile`; `debut=N` starts the captures at beat N.
    FOLLOWER_VARIANT.sameFoot = params.get("suiveuse") === "memePied";
    FOLLOWER_VARIANT.still = params.get("suiveuse") === "immobile";
    const frame = Number(params.get("beat") ?? params.get("sortieBeat")) + (Number(params.get("debut")) || 0);
    if (capture && Number.isFinite(frame)) seekClock(clock, Math.max(0, frame));
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
  const [hud, setHud] = useState<{ beat: number; now: Now; queue: GuideFigure[]; queueTouches: number[] }>({ beat: 0, now: START, queue: [], queueTouches: [] });
  // #144: the virgula, asked with Shift held (or this toggle on a touch screen) when a touch is commanded.
  const [virgula, setVirgula] = useState(false);

  // Beat of a press: the last frame's beat plus the time elapsed since (the clock advances per frame).
  const beatAt = (time: number) => {
    const { beat, time: at } = last.current;
    // Same 0.1 s cap per frame as the transport (src/clock.ts): a press never runs ahead of the clock.
    return playing ? beat + Math.min(0.1, Math.max(0, time - at) / 1000) * bpm / 60 : beat;
  };
  const held = useRef<HeldArrows>({});
  // #140: every command joins the queue (no timing grade, nothing refused); in the automatic dance the
  // figure keys are not listened to.
  const lead = (figure: GuideFigure, time = performance.now(), comma = virgula) => {
    if (!offered.includes(figure) || auto) return;
    session.press(beatAt(time), figure, comma);
  };
  const toggleAuto = (time = performance.now()) => {
    const next = !session.auto;
    session.setAuto(beatAt(time), next);
    setAuto(next);
  };
  const restart = () => {
    // Without `graine=`, the automatic dance draws another dance each time.
    if (!params.has("graine")) session.seed = Date.now() % 2147483647;
    session.reset(auto); seekClock(clock, 0); last.current = { beat: 0, time: performance.now() }; setPlaying(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight" || e.code === "ArrowDown") held.current[e.code === "ArrowRight" ? "right" : "down"] = true;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      // #140: Space no longer pauses: it switches between listening and the automatic dance.
      if (e.code === "Space") { e.preventDefault(); toggleAuto(e.timeStamp); return; }
      if (e.code === "ArrowRight") { e.preventDefault(); return; }
      // Physical position (e.code): ZQSD on AZERTY = WASD on QWERTY. The letter typed teaches the layout.
      // #89: the arrows held adapt a compatible figure (→ right leg, ↓ backwards first).
      const figure = figureOfCode(e.code, held.current);
      if (figure) {
        e.preventDefault(); lead(figure, e.timeStamp, e.shiftKey || virgula);
        if (e.key.length === 1) setLayout(l => (l.get(e.code) === e.key ? l : new Map(l).set(e.code, e.key)));
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight") held.current.right = false;
      if (e.code === "ArrowDown") held.current.down = false;
    };
    const onBlur = () => { held.current = {}; };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onUp); window.removeEventListener("blur", onBlur); };
  });

  useEffect(() => {
    const id = setInterval(() => {
      const plan = session.plan(clock.beat), sample = session.sample(clock.beat);
      if (!plan || !sample) return;
      setHud({ beat: clock.beat, queue: plan.queue, queueTouches: plan.queueTouches,
        now: { kind: sample.kind, touch: sample.touch, touchBeat: sample.touchBeat, figureBeat: sample.figureBeat, touches: sample.touches.length } });
    }, 80);
    return () => clearInterval(id);
  }, [clock, session]);

  // Captures: `cam=x,y,z` places the free view's camera (it then follows the couple).
  const cam = (params.get("cam") ?? "").split(",").map(Number);
  const freeCamera: [number, number, number] = cam.length === 3 && cam.every(Number.isFinite) ? [cam[0], cam[1], cam[2]] : [2.7, 1.5, 3.4];
  const count = Math.floor(hud.beat) % 8 + 1;
  const queueText = hud.queue.map((f, k) => GUIDE_FIGURES[f].label + (hud.queueTouches[k] ? ` (${hud.queueTouches[k]} aller-retour${hud.queueTouches[k] > 1 ? "s" : ""})` : "")).join(" → ");
  const now = hud.now;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-200">
      <Canvas camera={{ position: leaderView ? [LEADER_VIEW.eye.x, LEADER_VIEW.eye.y, LEADER_VIEW.eye.z] : freeCamera, fov: 40 }} dpr={[1, 2]}>
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
                embrace pair={pair} side={side} placement="quinconce" movement="none" guide={session} showMuscles={muscles} />
            ))}
          </CoupleFrame>
        </React.Suspense>
        <OrbitControls makeDefault target={leaderView ? [LEADER_VIEW.target.x, LEADER_VIEW.target.y, LEADER_VIEW.target.z] : [0, 0.8, 0]} enableDamping dampingFactor={0.08} minDistance={1.4} maxDistance={7} />
        <CameraFollow session={session} clock={clock} paused={paused} leaderView={leaderView} />
      </Canvas>

      {bare && (
        <div className="absolute top-2 left-3 right-3 text-sm text-slate-200">
          <span className="text-xl font-semibold tabular-nums mr-2">{count}</span>{KIND_LABEL(now.kind)}
          {now.touch && <span className="text-amber-300"> · {touchLabel(now)}</span>}
          {hud.queue.length > 0 && <span className="text-sky-300"> → {queueText}</span>}
          {auto && <span className="ml-2 text-emerald-300">danse seule</span>}
          {params.get("etiquette") && <span className="block text-base font-semibold text-emerald-300">{params.get("etiquette")}</span>}
          <span className="block text-[10px] text-slate-500">Mode jeu · BodyParts3D © DBCLS, CC BY-SA 2.1 Japan</span>
        </div>
      )}
      {!bare && <>
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 max-w-md pointer-events-auto">
          <h1 className="text-sm font-semibold text-slate-100">Mode jeu <span className="text-slate-400 font-normal">· {auto ? "danse seule" : "écoute"}</span></h1>
          <p className="text-xs text-slate-400 mt-1">
            Vous êtes le leader : chaque commande s'ajoute à la file, et la suiveuse danse les figures dans
            l'ordre, depuis la quinconce. Espace laisse le couple danser seul. Pas de base en {STYLES[guideStyleOf("base", styleKey)].label}, figures en {STYLES[styleKey].label ?? styleKey}, {bpm} bpm.
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-2xl font-semibold tabular-nums text-slate-100" aria-label="compte">{count}</span>
            <span className="text-slate-100">{KIND_LABEL(now.kind)}</span>
            {now.touch && <span className="text-amber-300">{touchLabel(now)}</span>}
          </div>
          <div className="mt-1 text-xs min-h-[1.25rem]" aria-live="polite" aria-label="file de commandes">
            {hud.queue.length > 0
              ? <><span className="text-slate-400">File : </span><span className="text-sky-300">{queueText}</span></>
              : <span className="text-slate-400">{auto ? "Danse seule : le simulateur choisit la suite." : "File vide : pas de base."}</span>}
          </div>
          {now.kind !== "base" && <div className="mt-2 border-t border-slate-800 pt-2">
            <TransitionCard transition={now.touch ? transitionAt(touchKey(now), now.touchBeat) : transitionAt(now.kind, now.figureBeat)} compact />
          </div>}
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs flex flex-wrap gap-2 pointer-events-auto">
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700" onClick={() => setPlaying(p => !p)}>
            {playing ? "Pause" : "Reprendre"}
          </button>
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 hover:bg-slate-700" aria-pressed={auto} onClick={e => toggleAuto(e.timeStamp)}
            title="Écoute : vos commandes s'ajoutent à la file. Danse seule : le simulateur choisit les figures.">
            {auto ? "Danse seule" : "Écoute"} <kbd className="text-slate-500">Espace</kbd>
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

      {/* Bottom panel, full width: figure buttons (wrapping rows), the arrows hint, the attribution. */}
      <div className="absolute bottom-2 inset-x-3 flex flex-col items-center gap-1.5">
        <div className="flex flex-wrap justify-center gap-1.5">
          {offered.includes("ida") && <button onClick={() => setVirgula(v => !v)} aria-pressed={virgula} disabled={auto}
            title="Le prochain aller-retour commandé se fait en virgula (pied gauche posé perpendiculaire), quand le pas le permet"
            className={`rounded-lg border px-2.5 py-1.5 text-xs disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm ${virgula ? "bg-amber-500/20 border-amber-400 text-amber-200" : "bg-slate-900/85 border-slate-700 text-slate-100 hover:bg-slate-800"}`}>
            Virgula <kbd className="ml-1 text-slate-400">Maj</kbd>
          </button>}
          {/* #89: the ida variants are led by an arrow held with its key (hint below), not by buttons. */}
          {offered.filter(f => !GUIDE_FIGURES[f].ida && !GUIDE_FIGURES[f].chain).map(f => (
            <button key={f} onPointerDown={e => lead(f, e.timeStamp)} disabled={auto}
              className="rounded-lg bg-slate-900/85 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm">
              {GUIDE_FIGURES[f].label} <kbd className="ml-1 text-slate-400">{keyLabel(f, layout)}</kbd>
            </button>
          ))}
        </div>
        {offered.includes("idaD") && <p className="text-center text-[11px] text-slate-400">
          → ou ↓ maintenue + {keyLabel("ida", layout)} : ida e volta jambe droite, en arrière d'abord · ↑ ↑ : double et marka
          {offered.includes("sortieFG") && <> · ↑ pendant la sortie fille : fin de la sortie garçon</>}
        </p>}
        {/* #144: every step that goes forward or backward can become a touch (the foot goes and returns). */}
        {offered.includes("ida") && <p className="text-center text-[11px] text-slate-400">
          {keyLabel("ida", layout)} pendant une figure, ou quand une figure attend : son prochain pas devient un aller-retour (le pied part et revient) · Maj + {keyLabel("ida", layout)} : en virgula
        </p>}
        <p className="self-stretch text-[10px] text-slate-500">
          Anatomie : BodyParts3D, © The Database Center for Life Science, licence CC BY-SA 2.1 Japan. Animation
          paramétrique illustrative, sans validation chorégraphique.
        </p>
      </div>
      </>}
    </div>
  );
}
