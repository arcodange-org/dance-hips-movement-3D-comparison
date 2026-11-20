/** Guide mode proof of concept (#69, docs/spec-mode-guidage-poc.md): the player leads, the follower
 * executes the chosen pair figure at the next beat boundary, always through the neutral quinconce.
 * Pure: segments, couple frame, inertialized pelvis offsets and timing grades are a function of the
 * timestamped intentions and of the beat (a session can be replayed exactly). */
import { movementAllowed, STYLE_MOVEMENTS, type MovementKey } from "./styles";
import { samplePlacePaire, PLACE_PAIR_DZ } from "./placePaire";
import { sampleIdaPaire, IDA_PAIR_DZ, IDA_DEFAULT, type IdaVariant } from "./idaPaire";
import { sampleMarchePaire, MARCHE_PAIR_DZ, type MarcheKind } from "./marchePaire";
import { sampleQuartsPaire, QUARTS_PAIR_DZ } from "./quartsPaire";
import { sampleSortieGarcon, SORTIE_GARCON_PAIR_DZ, DEFAULT_SORTIE_CONTRA, type FigureFoot, type FootPoint } from "./sortieGarcon";
import { sampleSortieFille, SORTIE_FILLE_PAIR_DZ } from "./sortieFille";
import { placementOffset, placementScale, type CouplePlacement } from "./placement";

export type GuideFigure = "ida" | "idaD" | "idaArr" | "idaArrD" | "quart" | "sortieG" | "sortieF" | "avance" | "recule" | "double";
export type GuideKind = "base" | GuideFigure;

interface GuideFigureDef {
  movement: MovementKey; beats: number; end: number; label: string;
  /** Physical key (KeyboardEvent.code), the same place on every layout: WASD on QWERTY, ZQSD on AZERTY;
   * "" for a figure led by a combination (#89: an arrow held with the ida's key, ↑ ↑). */
  code: string;
  /** Its QWERTY letter (or arrow), shown until the real layout is known; for an ida variant, the arrows
   * held with the ida's key. */
  key: string;
  /** #89: ida e volta variant, or a walk in its place. */
  ida?: IdaVariant; marche?: MarcheKind;
}
/** Pair figures available to the leader: pose movement, segment length (beats) and labels. */
export const GUIDE_FIGURES: Record<GuideFigure, GuideFigureDef> = {
  ida: { movement: "ida", beats: 8, end: 8, label: "Ida e volta", code: "KeyW", key: "W" },
  // #89 (owner: « Ida e volta + droite = ida e volta jambe droite ; ida e volta + arrière : on commence
  // en arrière »): an arrow held while the ida's key is pressed.
  idaD: { movement: "ida", beats: 8, end: 8, label: "Ida e volta jambe droite", code: "", key: "→", ida: { side: "R", back: false } },
  idaArr: { movement: "ida", beats: 8, end: 8, label: "Ida e volta en arrière", code: "", key: "↓", ida: { side: "L", back: true } },
  idaArrD: { movement: "ida", beats: 8, end: 8, label: "Ida e volta en arrière, jambe droite", code: "", key: "↓ →", ida: { side: "R", back: true } },
  quart: { movement: "quarts", beats: 4, end: 4, label: "Quart de tour", code: "KeyQ", key: "Q" },
  // The five-action figures hold their marka one beat (their style is frozen at beat 4, in phase with
  // the next segment's beat 0).
  sortieG: { movement: "sortieG", beats: 6, end: 5, label: "Sortie garçon", code: "KeyD", key: "D" },
  sortieF: { movement: "sortieF", beats: 6, end: 5, label: "Sortie fille", code: "KeyA", key: "A" },
  // #89: « haut = avancer (PG puis PD) ; bas = reculer » ; « haut + haut successif rapidement : PG + PD
  // en 1 temps + marka 1 temps ».
  avance: { movement: "ida", beats: 2, end: 2, label: "Avancer", code: "ArrowUp", key: "↑", marche: "avance" },
  recule: { movement: "ida", beats: 2, end: 2, label: "Reculer", code: "ArrowDown", key: "↓", marche: "recule" },
  double: { movement: "ida", beats: 2, end: 2, label: "Double et marka", code: "", key: "↑ ↑", marche: "double" },
};
export const GUIDE_FIGURE_KEYS = Object.keys(GUIDE_FIGURES) as GuideFigure[];
/** #89: the walks, offered in every style. */
export const GUIDE_WALKS: GuideFigure[] = ["avance", "recule", "double"];
/** #62, #85, #89: the figures a style offers in the game. Kompa, tarraxinha and zouk (on the spot and
 * forward / backward only: « le konpa ne propose rien à part avancer et reculer ») offer the walks only. */
export const guideFiguresFor = (styleKey: string): GuideFigure[] =>
  STYLE_MOVEMENTS[styleKey] ? GUIDE_WALKS : GUIDE_FIGURE_KEYS.filter(f => movementAllowed(styleKey, GUIDE_FIGURES[f].movement));
/** #85 (owner: « dans le mode jeu la position de base doit être le suave (sauf en konpa) »): the basic
 * step is danced in suave, the figures in the chosen style; kompa (and the styles handled like it) keep
 * their own style throughout. */
export const guideStyleOf = (kind: GuideKind, styleKey: string): string =>
  kind === "base" && !STYLE_MOVEMENTS[styleKey] ? "suave" : styleKey;

/** Arrows held while a key is pressed (#89). */
export interface HeldArrows { right?: boolean; down?: boolean }
/** Figure led by a key press, by physical position (QWERTY W A Q D = AZERTY Z Q A D), adapted by the
 * arrows held: → the right leg, ↓ backwards first (compatible figure: the ida e volta). */
export function figureOfCode(code: string, held: HeldArrows = {}): GuideFigure | null {
  if (!code) return null;
  const figure = GUIDE_FIGURE_KEYS.find(f => GUIDE_FIGURES[f].code === code) ?? null;
  if (figure === "ida") return held.down ? (held.right ? "idaArrD" : "idaArr") : held.right ? "idaD" : "ida";
  return figure;
}
/** Letter shown for a figure's key: the real layout's letter when known, else the QWERTY one. */
export function keyLabel(figure: GuideFigure, layout?: { get(code: string): string | undefined } | null): string {
  const def = GUIDE_FIGURES[figure];
  if (def.ida) return `${def.key} + ${keyLabel("ida", layout)}`;
  const letter = def.code ? layout?.get(def.code) : undefined;
  return (letter && letter.length === 1 ? letter : def.key).toUpperCase();
}
/** Pose options of a segment kind's figure (#89: ida variant, walk). */
export function figureOptions(kind: GuideKind): { idaVariant: IdaVariant; marche: MarcheKind | null } {
  const f = kind === "base" ? null : GUIDE_FIGURES[kind];
  return { idaVariant: f?.ida ?? IDA_DEFAULT, marche: f?.marche ?? null };
}

/** Proposals to validate (owner):
 * - `prep`: an intention counts for a boundary at least this many beats later (0: up to the boundary
 *   itself, so a press on the beat of the boundary is taken; the leader's chest still leads by 0.25 beat);
 * - `baseGrid`: the basic step can be left every `baseGrid` beats (style periods divide 4);
 * - `window`: during a figure, intentions are taken in its last `window` beats only;
 * - `inertia`: beats over which a pelvis residual at a boundary fades out (quintic, no overshoot);
 * - `double`: a second ↑ within this many beats of the first turns the walk into the double (#89);
 * - `chord`: the ida's key pressed this many beats after ↓ (held) replaces the walk backwards (#89).
 */
export const GUIDE = { prep: 0, baseGrid: 4, window: 2, inertia: 1, double: 0.5, chord: 1 };

/** Grades of a press against the nearest beat: ±min(ms, share of a beat). */
export const GUIDE_GRADES = [
  { grade: "Parfait", ms: 50, share: 0.08 },
  { grade: "Bien", ms: 100, share: 0.15 },
  { grade: "Juste", ms: 160, share: 0.25 },
] as const;
export type GuideGrade = "Parfait" | "Bien" | "Juste" | "Raté";

export interface GuideIntention { beat: number; figure: GuideFigure; bpm: number }
export type GuideVerdict = "accepté" | "ambigu" | "trop tôt" | "trop tard" | "répété" | "en attente";
export interface GuideOutcome {
  intention: GuideIntention; grade: GuideGrade; errorMs: number;
  verdict: GuideVerdict; boundary: number | null; streak: number;
}
/** Rigid transform of the couple frame: yaw about +y then translation (three.js rotation.y convention). */
export interface CoupleTransform { yaw: number; x: number; z: number }
export interface Offset { x: number; z: number }
export interface GuideSegment {
  kind: GuideKind; start: number; end: number;
  /** Couple frame of the segment (composition of the previous figures' motions). */
  couple: CoupleTransform;
  /** Pelvis residual of each dancer at the segment's start, in its own frame (faded by `inertia`). */
  residual: { leader: Offset; follower: Offset };
  /** Segment danced before this one (its pelvis height is inertialized by the view, src/guidagePose.ts). */
  previous: GuideKind | null;
}
/** Motion of one figure: couple transform from its start to its end, and the pelvis residual of each
 * dancer (own frame) the next segment starts with. */
export interface FigureMotion { couple: CoupleTransform; residual: { leader: Offset; follower: Offset } }
export type GuideMotions = Record<GuideKind, FigureMotion>;

export const IDENTITY: CoupleTransform = { yaw: 0, x: 0, z: 0 };
const ZERO: Offset = { x: 0, z: 0 };

export function rotate(yaw: number, p: Offset): Offset {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { x: c * p.x + s * p.z, z: -s * p.x + c * p.z };
}
export function applyTransform(t: CoupleTransform, p: Offset): Offset {
  const q = rotate(t.yaw, p);
  return { x: q.x + t.x, z: q.z + t.z };
}
/** a ∘ b: apply b, then a. */
export function compose(a: CoupleTransform, b: CoupleTransform): CoupleTransform {
  const t = rotate(a.yaw, { x: b.x, z: b.z });
  return { yaw: a.yaw + b.yaw, x: t.x + a.x, z: t.z + a.z };
}

/** Each dancer's outer frame inside the couple frame: the leader at −dz, the follower at +dz facing back. */
export const GUIDE_PAIR_DZ = IDA_PAIR_DZ;
export function outerOf(follower: boolean): CoupleTransform {
  return follower ? { yaw: Math.PI, x: 0, z: GUIDE_PAIR_DZ } : { yaw: 0, x: 0, z: -GUIDE_PAIR_DZ };
}

export interface GuideRig { rest: Record<FigureFoot, FootPoint>; stance: number; placement: CouplePlacement; amp: number }

/** Samples a segment kind at a local beat, in the dancer's own frame (as `applyPose` does). */
export function sampleKind(kind: GuideKind, beat: number, follower: boolean, g: GuideRig) {
  const o = placementOffset(g.placement, g.amp);
  switch (kind) {
    case "base": return samplePlacePaire(beat, follower, g.rest, o, g.stance);
    case "ida": case "idaD": case "idaArr": case "idaArrD":
      return sampleIdaPaire(beat, follower, g.rest, o, g.stance, figureOptions(kind).idaVariant);
    case "avance": case "recule": case "double": return sampleMarchePaire(beat, follower, g.rest, o, g.stance, kind);
    case "quart": return sampleQuartsPaire(beat, follower, g.rest, o, g.stance);
    case "sortieG": return sampleSortieGarcon(beat, follower, g.rest, "line", DEFAULT_SORTIE_CONTRA, o, placementScale(g.amp), g.stance);
    case "sortieF": return sampleSortieFille(beat, follower, g.rest, "hook", o, placementScale(g.amp), g.stance);
  }
}

/** Couple motion and pelvis residuals of every segment kind, measured on the samplers. */
export function guideMotions(g: GuideRig): GuideMotions {
  if (new Set([IDA_PAIR_DZ, MARCHE_PAIR_DZ, QUARTS_PAIR_DZ, SORTIE_GARCON_PAIR_DZ, SORTIE_FILLE_PAIR_DZ, PLACE_PAIR_DZ]).size !== 1)
    throw new Error("guide mode: the pair figures must share one couple spacing");
  const motions = {} as GuideMotions;
  for (const kind of ["base", ...GUIDE_FIGURE_KEYS] as GuideKind[]) {
    const end = kind === "base" ? 0 : GUIDE_FIGURES[kind].end;
    const start = { leader: sampleKind(kind, 0, false, g), follower: sampleKind(kind, 0, true, g) };
    const last = { leader: sampleKind(kind, end, false, g), follower: sampleKind(kind, end, true, g) };
    // The couple moves as the leader's left foot does (rigid in practice: see the tests).
    const lead = outerOf(false);
    const yaw = last.leader.feet.L.yaw - start.leader.feet.L.yaw;
    const from = applyTransform(lead, start.leader.feet.L), to = applyTransform(lead, last.leader.feet.L);
    const turned = rotate(yaw, from);
    const couple = { yaw, x: to.x - turned.x, z: to.z - turned.z };
    const residual = { leader: ZERO, follower: ZERO };
    for (const role of ["leader", "follower"] as const) {
      const outer = outerOf(role === "follower");
      const old = applyTransform(outer, last[role].root);
      const fresh = applyTransform(compose(couple, outer), start[role].root);
      // Residual in the dancer's new own frame: the next segment starts where this one ended.
      residual[role] = rotate(-(couple.yaw + outer.yaw), { x: old.x - fresh.x, z: old.z - fresh.z });
    }
    motions[kind] = { couple, residual };
  }
  return motions;
}

export function gradeOf(beat: number, bpm: number): { grade: GuideGrade; errorMs: number } {
  const error = beat - Math.round(beat);
  const beatMs = 60000 / Math.max(1e-6, bpm);
  const errorMs = error * beatMs;
  for (const w of GUIDE_GRADES) if (Math.abs(errorMs) <= Math.min(w.ms, w.share * beatMs)) return { grade: w.grade, errorMs };
  return { grade: "Raté", errorMs };
}

export interface GuidePlan { segments: GuideSegment[]; outcomes: GuideOutcome[] }

/** Segments up to `until` (beats) and the verdict of each intention. Intentions are sorted by beat;
 * one with `beat > until` is ignored (not pressed yet). */
export function planGuide(intentions: GuideIntention[], motions: GuideMotions, until: number): GuidePlan {
  const list = intentions.filter(i => Number.isFinite(i.beat) && i.beat <= until)
    .map((intention, order) => ({ intention, order })).sort((a, b) => a.intention.beat - b.intention.beat || a.order - b.order);
  const outcomes: GuideOutcome[] = new Array(list.length);
  const segments: GuideSegment[] = [];
  let current: GuideSegment = { kind: "base", start: 0, end: Infinity, couple: IDENTITY, residual: { leader: ZERO, follower: ZERO }, previous: null };
  segments.push(current);
  let next = 0; // first intention not yet assigned to a boundary
  let streak = 0;
  const settle = (index: number, verdict: GuideVerdict, boundary: number | null) => {
    const { intention } = list[index];
    const g = gradeOf(intention.beat, intention.bpm);
    // A miss halves the streak; only a received lead on time (Parfait, Bien) extends it.
    if (g.grade === "Raté") streak = Math.floor(streak / 2);
    else if (verdict === "accepté" && g.grade !== "Juste") streak++;
    outcomes[list[index].order] = { intention, ...g, verdict, boundary, streak };
  };
  let previousBoundary = 0;
  for (let guard = 0; guard < 100000; guard++) {
    const boundary = current.kind === "base"
      ? current.start + GUIDE.baseGrid * Math.max(1, Math.ceil((previousBoundary - current.start + 1e-9) / GUIDE.baseGrid))
      : current.start + GUIDE_FIGURES[current.kind].beats;
    // Intentions whose preparation ends by this boundary.
    const taken: number[] = [];
    while (next < list.length && list[next].intention.beat + GUIDE.prep <= boundary + 1e-9) taken.push(next++);
    // During a figure, a lead is prepared in its last beats: earlier presses are refused (just after
    // its start: late for the previous boundary; later: too early for this one).
    const refused = (i: number) => current.kind !== "base" && list[i].intention.beat < boundary - GUIDE.window;
    const distinct = [...new Set(taken.filter(i => !refused(i)).map(i => list[i].intention.figure))];
    const reached = boundary <= until;
    const choice: GuideFigure | null = reached && distinct.length === 1 ? distinct[0] : null;
    let counted = false;
    for (const i of taken) {
      const beat = list[i].intention.beat;
      if (refused(i)) settle(i, beat < current.start + 0.5 ? "trop tard" : "trop tôt", null);
      else if (!reached) settle(i, "en attente", boundary);
      else if (distinct.length > 1) settle(i, "ambigu", boundary);
      else { settle(i, counted ? "répété" : "accepté", boundary); counted = true; }
    }
    if (!reached) {
      // Pressed but meant for a later boundary.
      for (let i = next; i < list.length; i++) settle(i, "en attente", null);
      break;
    }
    previousBoundary = boundary;
    if (current.kind === "base" && !choice) continue; // keep dancing the basic step
    const motion = motions[current.kind];
    const couple = compose(current.couple, motion.couple);
    current.end = boundary;
    current = { kind: choice ?? "base", start: boundary, end: Infinity, couple, residual: motion.residual, previous: current.kind };
    segments.push(current);
  }
  return { segments, outcomes };
}

/** Quintic fade of an inertialized residual (Bollo): 1 → 0 over `GUIDE.inertia` beats, flat at both ends. */
export function inertiaWeight(elapsed: number): number {
  const u = Math.max(0, Math.min(1, elapsed / GUIDE.inertia));
  return 1 - u * u * u * (10 - 15 * u + 6 * u * u);
}

export interface GuideSample {
  segment: GuideSegment; kind: GuideKind; movement: MovementKey; localBeat: number;
  couple: CoupleTransform; rootOffset: { leader: Offset; follower: Offset };
  /** Share (1 → 0) of a boundary residual still applied (quintic fade). */
  inertia: number;
}
export function sampleGuide(plan: GuidePlan, beat: number): GuideSample {
  let segment = plan.segments[0];
  for (const s of plan.segments) if (s.start <= beat + 1e-9) segment = s;
  const localBeat = Math.max(0, beat - segment.start);
  const w = inertiaWeight(localBeat);
  const scaled = (o: Offset) => ({ x: o.x * w, z: o.z * w });
  return {
    segment, kind: segment.kind, localBeat, couple: segment.couple,
    movement: movementOf(segment.kind),
    rootOffset: { leader: scaled(segment.residual.leader), follower: scaled(segment.residual.follower) },
    inertia: segment.previous === null ? 0 : w,
  };
}

/** Pose movement of a segment kind. */
export function movementOf(kind: GuideKind): MovementKey {
  return kind === "base" ? "none" : GUIDE_FIGURES[kind].movement;
}

/** Pose options of one dancer for a guide sample (shared by the view and the GLB tests): the pair
 * figure models, plexus contact, and the inertialized pelvis offsets of both dancers. */
export function guidePoseOptions(s: Pick<GuideSample, "movement" | "rootOffset"> & { kind?: GuideKind }, follower: boolean) {
  const role = follower ? "follower" : "leader", partner = follower ? "leader" : "follower";
  return {
    movement: s.movement, embrace: true, follower, ...figureOptions(s.kind ?? "base"),
    quartsPaire: s.movement === "quarts", idaPaire: s.movement === "ida", placePaire: s.movement === "none", plexus: true,
    // #62: the basic step keeps the clock's phase so that it joins the figures continuously.
    onBeat: false,
    rootOffset: s.rootOffset[role], partnerRootOffset: s.rootOffset[partner],
  } as const;
}

/** Local beat at which a segment kind ends (the basic step loops every `baseGrid` beats). */
export function endBeatOf(kind: GuideKind): number {
  return kind === "base" ? GUIDE.baseGrid : GUIDE_FIGURES[kind].beats;
}

/** Demonstration session (`?guidage=1&demo=1`, GIF of the PR): ida e volta, sortie garçon, quart de
 * tour, sortie fille, each led a little before its boundary. */
export const GUIDE_DEMO: { beat: number; figure: GuideFigure }[] = [
  { beat: 2.9, figure: "ida" }, { beat: 10.9, figure: "sortieG" }, { beat: 20.9, figure: "quart" }, { beat: 24.95, figure: "sortieF" },
];

/** #89 demonstration (`?guidage=1&demo=fleches`): walk forward, double, walk backward, ida e volta right leg
 * backwards first. */
export const GUIDE_DEMO_ARROWS: { beat: number; figure: GuideFigure }[] = [
  { beat: 3.9, figure: "avance" }, { beat: 5.9, figure: "double" }, { beat: 7.9, figure: "recule" }, { beat: 11.9, figure: "idaArrD" },
];

/** Live wrapper used by the view: intentions are appended as keys are pressed. */
export class GuideSession {
  intentions: GuideIntention[] = [];
  motions: GuideMotions | null = null;
  boundKey: string | null = null;
  private cache: { key: string; plan: GuidePlan } | null = null;
  bind(g: GuideRig, key = "") { this.motions = guideMotions(g); this.boundKey = key; this.cache = null; }
  press(beat: number, figure: GuideFigure, bpm: number) {
    // #89: ↑ ↑ in quick succession leads the double (one intention, graded on the first press).
    // ↓ held then the ida's key: the ↓ press was a walk backwards until the key came; the ida variant
    // replaces it (graded on the key).
    const last = this.intentions[this.intentions.length - 1];
    if (figure === "avance" && last?.figure === "avance" && beat - last.beat <= GUIDE.double) last.figure = "double";
    else if ((figure === "idaArr" || figure === "idaArrD") && last?.figure === "recule" && beat - last.beat <= GUIDE.chord)
      Object.assign(last, { beat, figure, bpm });
    else this.intentions.push({ beat, figure, bpm });
    this.cache = null;
  }
  reset() { this.intentions = []; this.cache = null; }
  plan(beat: number): GuidePlan | null {
    if (!this.motions) return null;
    const key = `${this.intentions.length}:${Math.floor(beat * 8)}`;
    if (this.cache?.key !== key) this.cache = { key, plan: planGuide(this.intentions, this.motions, beat) };
    return this.cache.plan;
  }
  sample(beat: number): GuideSample | null {
    const plan = this.plan(beat);
    return plan ? sampleGuide(plan, beat) : null;
  }
}
