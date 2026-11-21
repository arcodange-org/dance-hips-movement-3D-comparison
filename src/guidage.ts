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
import { sampleSortieFG, CHAIN_BEATS, CHAIN_FROM } from "./enchainement";
import { sampleInserted, INSERTED_BEATS, INSERTION_AT } from "./insertion";
import { placementOffset, placementScale, type CouplePlacement } from "./placement";

export type GuideFigure = "ida" | "idaD" | "idaArr" | "idaArrD" | "quart" | "sortieG" | "sortieF" | "sortieFG" | "sortieFI" | "sortieGI" | "avance" | "recule" | "double";
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
  /** #90: led during another figure (no key or button of its own). */
  chain?: boolean;
  /** #91: the sortie with an ida e volta inserted at its position 2 (led during the sortie). */
  insert?: boolean;
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
  // #90: ↑ during the sortie fille, before her G retakes the line: she advances into the sortie garçon's
  // position 2 and the couple finishes the sortie garçon (marka held one beat, as the sorties).
  sortieFG: { movement: "sortieF", beats: CHAIN_BEATS + 1, end: CHAIN_BEATS, label: "Sortie fille → fin de la sortie garçon", code: "", key: "↑", chain: true },
  // #91: the ida's key during a sortie, before its position 2: the leader's G goes and returns (backwards
  // in the sortie fille, forwards in the sortie garçon: the direction of his next step), then the sortie
  // resumes.
  sortieFI: { movement: "sortieF", beats: INSERTED_BEATS + 1, end: INSERTED_BEATS, label: "Sortie fille avec ida e volta", code: "", key: "W", insert: true },
  sortieGI: { movement: "sortieG", beats: INSERTED_BEATS + 1, end: INSERTED_BEATS, label: "Sortie garçon avec ida e volta", code: "", key: "W", insert: true },
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
export function figureOptions(kind: GuideKind): { idaVariant: IdaVariant; marche: MarcheKind | null; sortieChain: boolean; sortieInsert: boolean } {
  const f = kind === "base" ? null : GUIDE_FIGURES[kind];
  return { idaVariant: f?.ida ?? IDA_DEFAULT, marche: f?.marche ?? null, sortieChain: !!f?.chain, sortieInsert: !!f?.insert };
}

/** Proposals to validate (owner):
 * - `baseGrid`: the basic step can be left every `baseGrid` beats (style periods divide 4);
 * - `inertia`: beats over which a pelvis residual at a boundary fades out (quintic, no overshoot);
 * - `double`: a second ↑ within this many beats of the first turns the walk into the double (#89);
 * - `chord`: the ida's key pressed this many beats after ↓ (held) replaces the walk backwards (#89).
 * #140: the timing challenge is gone (no preparation window, no grade): every command is queued.
 */
export const GUIDE = { baseGrid: 4, inertia: 1, double: 0.5, chord: 1 };

/** #140 (owner: « ça danse tout seul : à chaque position le choix de faire le début d'une figure si
 * possible ou de terminer l'actuelle. Toutes les 4 mesures de 8 temps on essaie d'être en position
 * neutre mais ce n'est pas obligatoire »): the automatic dance (docs/spec-jeu-file-auto.md).
 * - `phrase`: beats of a phrase (4 bars of 8 beats); the draw prefers a neutral position on its end;
 * - at the neutral position, weights: `family` for each of the ida e volta (its variants together), the
 *   quarter turn and the two sorties, `walk` for each walk; × `fit` when the figure ends exactly on the
 *   phrase, × `overshoot` when it runs past it, × `repeat` for the family just danced, × `realign` for
 *   the sortie fille when the dance is one beat off (its chain is the only odd figure);
 * - at a junction of a sortie, probability of starting the other figure: `junction`, `junctionFit` when
 *   it then ends exactly on the phrase, `junctionStay` when finishing the sortie does; for the chain
 *   (9 beats, it shifts the dance by one beat): `chainEven` on the beat, `chainOdd` when already off. */
export const GUIDE_AUTO = {
  phrase: 32, family: 3, walk: 1, fit: 4, overshoot: 0.25, repeat: 0.3, realign: 3,
  junction: 0.3, junctionFit: 0.8, junctionStay: 0.05, chainEven: 0.15, chainOdd: 0.9,
};

/** A command: the figure asked for, dated on the beat clock. */
export interface GuideIntention { beat: number; figure: GuideFigure }
/** #140: what became of a command. « en file »: waiting behind others; « en cours »: being danced;
 * « dansée »: done; « insérée », « enchaînée »: it changed the sortie under way (#91, #90). */
export type GuideStatus = "en file" | "en cours" | "dansée" | "insérée" | "enchaînée";
export interface GuideOutcome {
  intention: GuideIntention; status: GuideStatus;
  /** Beat at which it starts (its boundary, or the junction of the sortie it changes); null while it waits. */
  start: number | null;
}
/** #140: Space switches between listening to the commands (`auto: false`, the default) and the automatic dance. */
export interface GuideModeChange { beat: number; auto: boolean }
export interface GuideOptions {
  modes?: GuideModeChange[];
  /** Seed of the automatic dance (same seed, same dance). */
  seed?: number;
  /** Figures the style offers (the automatic dance draws from them). */
  offered?: GuideFigure[];
  /** Tests: draw with equal weights, without the phrase preference. */
  plain?: boolean;
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
  /** #140: a command of the player, or a choice of the automatic dance (the basic step: neither). */
  by?: "commande" | "auto";
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
    case "sortieFG": return sampleSortieFG(beat, follower, g.rest, o, placementScale(g.amp), g.stance);
    case "sortieFI": return sampleInserted("sortieF", beat, follower, g.rest, o, placementScale(g.amp), g.stance);
    case "sortieGI": return sampleInserted("sortieG", beat, follower, g.rest, o, placementScale(g.amp), g.stance);
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

/** #140: deterministic draw in [0, 1) from the seed and a decision key (a mulberry32 step). */
export function guideDraw(seed: number, key: number): number {
  let t = (Math.imul(seed | 0, 0x9E3779B1) + Math.imul(key | 0, 0x85EBCA6B) + 0x6D2B79F5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Family of a figure (the automatic dance avoids repeating one). */
export const guideFamilyOf = (kind: GuideKind): string =>
  kind === "base" ? "base" : GUIDE_FIGURES[kind].marche ? "marche" : GUIDE_FIGURES[kind].movement;
const onPhrase = (beat: number) => { const m = ((beat % GUIDE_AUTO.phrase) + GUIDE_AUTO.phrase) % GUIDE_AUTO.phrase; return m < 1e-6 || GUIDE_AUTO.phrase - m < 1e-6; };
/** The dance is one beat off the bars (after an odd number of chains): its boundaries fall on odd beats. */
const offBeat = (beat: number) => Math.abs((((beat % 2) + 2) % 2) - 1) < 1e-6;

/** #140: figure the automatic dance starts at a neutral position (`boundary`), after `previous`. */
export function autoFigure(seed: number, boundary: number, previous: GuideKind, offered: GuideFigure[], plain = false): GuideFigure | null {
  const A = GUIDE_AUTO;
  const candidates = offered.filter(f => !GUIDE_FIGURES[f].chain && !GUIDE_FIGURES[f].insert);
  if (!candidates.length) return null;
  const into = ((boundary % A.phrase) + A.phrase) % A.phrase, remaining = A.phrase - into;
  const size: Record<string, number> = {};
  for (const f of candidates) size[guideFamilyOf(f)] = (size[guideFamilyOf(f)] ?? 0) + 1;
  const weights = candidates.map(f => {
    if (plain) return 1;
    const family = guideFamilyOf(f), beats = GUIDE_FIGURES[f].beats;
    let w = family === "marche" ? A.walk : A.family / size[family];
    if (Math.abs(beats - remaining) < 1e-6) w *= A.fit;
    else if (beats > remaining) w *= A.overshoot;
    if (family === guideFamilyOf(previous)) w *= A.repeat;
    if (f === "sortieF" && offBeat(boundary) && offered.includes("sortieFG")) w *= A.realign;
    return w;
  });
  const total = weights.reduce((a, w) => a + w, 0);
  let u = guideDraw(seed, Math.round(boundary * 8) * 4) * total;
  for (let i = 0; i < candidates.length; i++) { u -= weights[i]; if (u < 0) return candidates[i]; }
  return candidates[candidates.length - 1];
}

export interface GuidePlan {
  segments: GuideSegment[]; outcomes: GuideOutcome[];
  /** #140: figures waiting in the queue, in order. */
  queue: GuideFigure[];
  /** #140: the automatic dance is on at `until`. */
  auto: boolean;
}

/** Segments up to `until` (beats) and what became of each command (#140: a queue, nothing is refused
 * nor graded). Commands are sorted by beat; one with `beat > until` is ignored (not pressed yet).
 * - At each boundary (end of a figure, every `baseGrid` beats of the basic step) the first command of the
 *   queue starts; the queue empty, the automatic dance draws a figure when it is on, else the basic step
 *   goes on.
 * - During a sortie, before its junction, two commands change the sortie instead of being queued: the
 *   ida's key (any variant) inserts the ida e volta at its position 2 (#91), ↑ chains the sortie fille
 *   into the end of the sortie garçon at its position 3 (#90). The automatic dance draws the same choice
 *   at each junction (« le début d'une figure si possible ou terminer l'actuelle »). */
export function planGuide(intentions: GuideIntention[], motions: GuideMotions, until: number, options: GuideOptions = {}): GuidePlan {
  const list = intentions.filter(i => Number.isFinite(i.beat) && i.beat <= until)
    .map((intention, order) => ({ intention, order })).sort((a, b) => a.intention.beat - b.intention.beat || a.order - b.order);
  const modes = (options.modes ?? []).filter(m => Number.isFinite(m.beat) && m.beat <= until).sort((a, b) => a.beat - b.beat);
  const autoAt = (beat: number) => { let auto = false; for (const m of modes) { if (m.beat <= beat + 1e-9) auto = m.auto; else break; } return auto; };
  const offered = options.offered ?? GUIDE_FIGURE_KEYS, seed = options.seed ?? 0, plain = !!options.plain;
  const outcomes: GuideOutcome[] = new Array(list.length);
  const segments: GuideSegment[] = [];
  let current: GuideSegment = { kind: "base", start: 0, end: Infinity, couple: IDENTITY, residual: { leader: ZERO, follower: ZERO }, previous: null };
  segments.push(current);
  let next = 0; // first command not yet read
  const queue: number[] = []; // commands waiting, in order
  const started = new Map<number, GuideSegment>(); // command → the segment it started
  const settle = (index: number, status: GuideStatus, start: number | null) => {
    outcomes[list[index].order] = { intention: list[index].intention, status, start };
  };
  let previousBoundary = 0;
  const consumed = new Set<number>();
  for (let guard = 0; guard < 100000; guard++) {
    // Junctions of the sortie under way: position 2 (#91, ida e volta inserted), then position 3 of the
    // sortie fille (#90, end of the sortie garçon). The poses up to the junction are the sortie's: the
    // segment changes kind without a jump. A command pressed during the sortie decides; else the
    // automatic dance draws, once the junction is reached.
    if (current.kind === "sortieF" || current.kind === "sortieG") {
      const host = current.kind, insertAt = current.start + INSERTION_AT, chainAt = current.start + CHAIN_FROM;
      const junction = host === "sortieF" ? chainAt : insertAt;
      for (let i = next; i < list.length && list[i].intention.beat < junction; i++) {
        const { beat, figure } = list[i].intention;
        if (consumed.has(i)) continue;
        const def = GUIDE_FIGURES[figure];
        if (def.movement === "ida" && !def.marche && beat < insertAt && offered.includes(host === "sortieF" ? "sortieFI" : "sortieGI")) {
          current.kind = host === "sortieF" ? "sortieFI" : "sortieGI"; consumed.add(i); settle(i, "insérée", insertAt); break;
        }
        if (figure === "avance" && host === "sortieF" && offered.includes("sortieFG")) {
          current.kind = "sortieFG"; consumed.add(i); settle(i, "enchaînée", chainAt); break;
        }
      }
      const A = GUIDE_AUTO, stay = current.start + GUIDE_FIGURES[host].beats;
      const inserted: GuideFigure = host === "sortieF" ? "sortieFI" : "sortieGI";
      if (current.kind === host && until >= insertAt && autoAt(insertAt) && offered.includes(inserted)) {
        const p = plain ? A.junction : onPhrase(current.start + GUIDE_FIGURES[inserted].beats) ? A.junctionFit : onPhrase(stay) ? A.junctionStay : A.junction;
        if (guideDraw(seed, Math.round(insertAt * 8) * 4 + 1) < p) { current.kind = inserted; current.by = "auto"; }
      }
      if (current.kind === "sortieF" && until >= chainAt && autoAt(chainAt) && offered.includes("sortieFG")) {
        const p = plain ? A.junction : offBeat(current.start) ? A.chainOdd : A.chainEven;
        if (guideDraw(seed, Math.round(chainAt * 8) * 4 + 2) < p) { current.kind = "sortieFG"; current.by = "auto"; }
      }
    }
    const boundary = current.kind === "base"
      ? current.start + GUIDE.baseGrid * Math.max(1, Math.ceil((previousBoundary - current.start + 1e-9) / GUIDE.baseGrid))
      : current.start + GUIDE_FIGURES[current.kind].beats;
    // Commands pressed by this boundary join the queue (a press on the beat of the boundary included).
    while (next < list.length && list[next].intention.beat <= boundary + 1e-9) { if (!consumed.has(next)) queue.push(next); next++; }
    if (boundary > until) break;
    previousBoundary = boundary;
    const command = queue.shift();
    const choice: GuideFigure | null = command !== undefined ? list[command].intention.figure
      : autoAt(boundary) ? autoFigure(seed, boundary, current.kind, offered, plain) : null;
    if (current.kind === "base" && !choice) continue; // keep dancing the basic step
    const motion = motions[current.kind];
    const couple = compose(current.couple, motion.couple);
    current.end = boundary;
    current = { kind: choice ?? "base", start: boundary, end: Infinity, couple, residual: motion.residual, previous: current.kind,
      ...(choice ? { by: command !== undefined ? "commande" as const : "auto" as const } : {}) };
    segments.push(current);
    if (command !== undefined) started.set(command, current);
  }
  for (const [index, segment] of started) settle(index, segment === current ? "en cours" : "dansée", segment.start);
  // The head of the queue starts at the next boundary; the others wait behind it.
  const ahead = current.kind === "base"
    ? current.start + GUIDE.baseGrid * Math.max(1, Math.ceil((previousBoundary - current.start + 1e-9) / GUIDE.baseGrid))
    : current.start + GUIDE_FIGURES[current.kind].beats;
  queue.forEach((index, k) => settle(index, "en file", k === 0 ? ahead : null));
  return { segments, outcomes, queue: queue.map(index => list[index].intention.figure), auto: autoAt(until) };
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

/** #90 demonstration (`?guidage=1&demo=enchainement`): sortie fille, ↑ at its beat 2, end of the sortie garçon. */
export const GUIDE_DEMO_CHAIN: { beat: number; figure: GuideFigure }[] = [
  { beat: 3.9, figure: "sortieF" }, { beat: 5.95, figure: "avance" },
];

/** #91 demonstration (`?guidage=1&demo=insertion`): sortie garçon with an ida e volta inserted at its
 * position 2, then sortie fille with one (backwards). */
export const GUIDE_DEMO_INSERT: { beat: number; figure: GuideFigure }[] = [
  { beat: 3.9, figure: "sortieG" }, { beat: 5.5, figure: "ida" }, { beat: 11.9, figure: "sortieF" }, { beat: 13.5, figure: "ida" },
];

/** Live wrapper used by the view: commands are appended as keys are pressed, mode changes as Space is. */
export class GuideSession {
  intentions: GuideIntention[] = [];
  /** #140: switches between listening (the default) and the automatic dance. */
  modes: GuideModeChange[] = [];
  seed = 1;
  offered: GuideFigure[] = GUIDE_FIGURE_KEYS;
  motions: GuideMotions | null = null;
  boundKey: string | null = null;
  private cache: { key: string; plan: GuidePlan } | null = null;
  bind(g: GuideRig, key = "") { this.motions = guideMotions(g); this.boundKey = key; this.cache = null; }
  press(beat: number, figure: GuideFigure) {
    // #89: ↑ ↑ in quick succession leads the double (one command). ↓ held then the ida's key: the ↓ press
    // was a walk backwards until the key came; the ida variant replaces it.
    const last = this.intentions[this.intentions.length - 1];
    if (figure === "avance" && last?.figure === "avance" && beat - last.beat <= GUIDE.double) last.figure = "double";
    else if ((figure === "idaArr" || figure === "idaArrD") && last?.figure === "recule" && beat - last.beat <= GUIDE.chord)
      Object.assign(last, { beat, figure });
    else this.intentions.push({ beat, figure });
    this.cache = null;
  }
  /** The automatic dance is on (after the last mode change). */
  get auto(): boolean { return this.modes.length ? this.modes[this.modes.length - 1].auto : false; }
  setAuto(beat: number, auto: boolean) { this.modes.push({ beat, auto }); this.cache = null; }
  reset(auto = false) { this.intentions = []; this.modes = auto ? [{ beat: 0, auto: true }] : []; this.cache = null; }
  plan(beat: number): GuidePlan | null {
    if (!this.motions) return null;
    const key = `${this.intentions.length}:${this.modes.length}:${Math.floor(beat * 8)}`;
    if (this.cache?.key !== key) this.cache = { key, plan: planGuide(this.intentions, this.motions, beat, { modes: this.modes, seed: this.seed, offered: this.offered }) };
    return this.cache.plan;
  }
  sample(beat: number): GuideSample | null {
    const plan = this.plan(beat);
    return plan ? sampleGuide(plan, beat) : null;
  }
}
