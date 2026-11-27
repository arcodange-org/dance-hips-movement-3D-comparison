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
import { sampleTouched, touchedBeat, touchVirgula, TOUCH_BEATS, TOUCH_POSITIONS, type Touch } from "./insertion";
import { placementOffset, placementScale, type CouplePlacement } from "./placement";
import type { GingaEight } from "./pose";

export type GuideFigure = "ida" | "idaD" | "idaArr" | "idaArrD" | "quart" | "sortieG" | "sortieF" | "sortieFG" | "avance" | "recule" | "double";
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
  // #91, #144: the ida's key during a figure adds a touch to it (a foot's go-and-return before one of its
  // steps): no kind of its own, the segment carries its touches.
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
export function figureOptions(kind: GuideKind): { idaVariant: IdaVariant; marche: MarcheKind | null; sortieChain: boolean } {
  const f = kind === "base" ? null : GUIDE_FIGURES[kind];
  return { idaVariant: f?.ida ?? IDA_DEFAULT, marche: f?.marche ?? null, sortieChain: !!f?.chain };
}
/** #144: positions of a figure where a touch may be added (docs/spec-ida-partout.md). */
export const touchPositionsOf = (kind: GuideKind): Touch[] => TOUCH_POSITIONS[kind] ?? [];

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
 * - #144, before a step that may become a touch (a foot's go-and-return, 2 beats more): probability
 *   `touch`, `junctionFit` when the figure then ends exactly on the phrase, `junctionStay` when it does
 *   without the touch; `virgula`: share of the touches danced as a virgula, where it is offered;
 * - the chain (9 beats, it shifts the dance by one beat): `chainEven` on the beat, `chainOdd` when
 *   already off (`junction` for the test draw that ignores the phrase). */
export const GUIDE_AUTO = {
  phrase: 32, family: 3, walk: 1, fit: 4, overshoot: 0.25, repeat: 0.3, realign: 3,
  touch: 0.12, virgula: 0.3, junction: 0.3, junctionFit: 0.8, junctionStay: 0.05, chainEven: 0.15, chainOdd: 0.9,
};

/** #157 (owner: « que le "sway" des hanches et le petit effet de "bounce", le ginga en fait, soit présent
 * pour montrer que les danseurs se balancent au rythme de la musique », docs/spec-ginga-couple.md): the
 * ginga of the couple dance. `sway`: share of the style's lateral hip shift, in every figure, on the
 * support transfers; `bounce` (m): vertical pulse, lowest on each beat. Calibrated on the GLB; the
 * setting is the owner's to elect (`?ginga=sans|discret|marque|ample`). #163 (owner, on `marque` seen in
 * the couple: « Trop discret. »): the default is the largest calibrated setting. */
export type GuideGinga = "sans" | "discret" | "marque" | "ample" | GuideEight;
export const GUIDE_GINGA: Record<Exclude<GuideGinga, GuideEight>, { sway: number; bounce: number } | null> = {
  sans: null,
  discret: { sway: 0.2, bounce: 0.005 },
  marque: { sway: 0.3, bounce: 0.009 },
  ample: { sway: 0.45, bounce: 0.014 },
};
export const GUIDE_GINGA_DEFAULT: GuideGinga = "ample";
/** #159 (owner: « on dit souvent que l'"on fait un 8" », « le 8 se lit dans les deux plans », « j'ai envie
 * de dire les 3 plans même », docs/spec-ginga-huit.md): PROTOTYPES of the « 8 » of the hips, to elect
 * (`?ginga=huit|huitRond|huitInverse|huitAmple|huitGrand`). Not checked on the GLB: they are not offered by default.
 * - `huit`: the size of `marque`; the pelvis waits on the support, then crosses (an angular « 8 »);
 * - `huitRond`: the same, the lateral shift on the moving phase too: the pelvis never stops;
 * - `huitInverse`: `huitRond` the other way round (back as the weight arrives, forward on the support);
 * - `huitAmple`: `huitRond`, larger;
 * - `huitGrand`: larger still (owner, 22 Nov., on the `marque` size in the couple: « Trop discret. »). */
export type GuideEight = "huit" | "huitRond" | "huitInverse" | "huitAmple" | "huitGrand" | "genoux" | "genouxQuart" | "genouxRond";
export const GUIDE_EIGHT: Record<GuideEight, { sway: number; bounce: number; eight: GingaEight }> = {
  huit: { sway: 0.3, bounce: 0.009, eight: { turn: 1, rollLag: 0.25, yawLag: 0.5, depth: 0.01, depthLag: 0, bounceLag: 0.25, round: 0 } },
  huitRond: { sway: 0.3, bounce: 0.009, eight: { turn: 1, rollLag: 0.25, yawLag: 0.5, depth: 0.01, depthLag: 0, bounceLag: 0.25, round: 1 } },
  huitInverse: { sway: 0.3, bounce: 0.009, eight: { turn: 1, rollLag: -0.25, yawLag: -0.5, depth: 0.01, depthLag: 0.5, bounceLag: 0.25, round: 1 } },
  huitAmple: { sway: 0.45, bounce: 0.014, eight: { turn: 1.5, rollLag: 0.25, yawLag: 0.5, depth: 0.02, depthLag: 0, bounceLag: 0.25, round: 1 } },
  // The bounce stays the one of `ample`: 20 mm crossed the knees in the basic step and the ida e volta (measured).
  huitGrand: { sway: 0.6, bounce: 0.014, eight: { turn: 2, rollLag: 0.25, yawLag: 0.5, depth: 0.03, depthLag: 0, bounceLag: 0.25, round: 1 } },
  // Vote of 22 Nov.: sense D, size F, the knees lead (they bend in turn and overlap; the hips sit where the
  // legs put them, `turn` 0: no style roll on top). `genouxRond`: the knees half a beat after the shift, each
  // hip goes round seen from the front.
  genoux: { sway: 0.6, bounce: 0.014, eight: { turn: 0, rollLag: 0, yawLag: -0.5, depth: 0.03, depthLag: 0.5, bounceLag: 0.25, round: 1, knees: { base: 0.22, swing: 0.25, lag: 0 } } },
  genouxQuart: { sway: 0.6, bounce: 0.014, eight: { turn: 0, rollLag: 0, yawLag: -0.5, depth: 0.03, depthLag: 0.5, bounceLag: 0.25, round: 1, knees: { base: 0.22, swing: 0.25, lag: 0.25 } } },
  genouxRond: { sway: 0.6, bounce: 0.014, eight: { turn: 0, rollLag: 0, yawLag: -0.5, depth: 0.03, depthLag: 0.5, bounceLag: 0.25, round: 1, knees: { base: 0.22, swing: 0.25, lag: 0.5 } } },
};
/** The pose setting of a ginga name (a calibrated setting or a prototype of the « 8 »). */
export const guideGingaOf = (name: GuideGinga) => (name in GUIDE_EIGHT ? GUIDE_EIGHT[name as GuideEight] : GUIDE_GINGA[name as Exclude<GuideGinga, GuideEight>]);

/** A command: the figure asked for, dated on the beat clock. #144: `virgula` (a key held with the ida's)
 * asks for the touch as a virgula, where the step offers it. */
export interface GuideIntention { beat: number; figure: GuideFigure; virgula?: boolean }
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
/** #152 (owner: « ajoute un peu de contrôle dans le hasard pour ne pas enchaîner trop de fois les mêmes
 * figures ou combinaisons de figures »): how tightly the automatic dance's draw is held.
 * - `again`: weight of a figure for each time it was danced among the last `GUIDE_MEMORY.figures`;
 * - `pair`: weight of a figure when « the previous figure → this one » was already danced among the last
 *   `GUIDE_MEMORY.pairs`;
 * - `streak`: a figure already danced that many times in a row is set aside (unless it is the only one).
 * `libre` is the draw before #152. Proposals to try by eye (`?hasard=libre|tenu|strict`). */
export type GuideVariety = "libre" | "tenu" | "strict";
export const GUIDE_VARIETY: Record<GuideVariety, { again: number; pair: number; streak: number }> = {
  libre: { again: 1, pair: 1, streak: Infinity },
  tenu: { again: 0.45, pair: 0.35, streak: 2 },
  strict: { again: 0.2, pair: 0.1, streak: 1 },
};
export const GUIDE_MEMORY = { figures: 4, pairs: 8 };
export interface GuideOptions {
  modes?: GuideModeChange[];
  /** #152: how tightly the draw avoids repeating figures and pairs of figures (`tenu` by default). */
  variety?: GuideVariety;
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
/** #219: an offset of the root (or its speed per beat): on the ground, and its own yaw (`rootYaw`). */
export interface RootOffset { x: number; z: number; yaw: number }
export interface GuideSegment {
  kind: GuideKind; start: number; end: number;
  /** Couple frame of the segment (composition of the previous figures' motions). */
  couple: CoupleTransform;
  /** Pelvis residual of each dancer at the segment's start, in its own frame (faded by `inertia`). */
  residual: { leader: Offset; follower: Offset };
  /** #219: speed of that residual at the segment's start (end of the segment before − start of this one), own frame:
   * the fade carries it, so that the pelvis keeps its speed across the boundary. None: a fade from rest. */
  speed?: { leader: RootOffset; follower: RootOffset };
  /** Segment danced before this one (its pelvis height is inertialized by the view, src/guidagePose.ts). */
  previous: GuideKind | null;
  /** #140: a command of the player, or a choice of the automatic dance (the basic step: neither). */
  by?: "commande" | "auto";
  /** #144: touches of the figure (a foot's go-and-return before one of its steps), sorted by position;
   * each adds `TOUCH_BEATS` to the segment. */
  touches?: Touch[];
  /** Touches of the segment danced before this one (they set its length, hence the style's time at its end). */
  previousTouches?: Touch[];
}
/** Length (beats) of a segment: the figure and its touches. */
export const segmentBeats = (kind: GuideKind, touches: Touch[] = []): number =>
  (kind === "base" ? GUIDE.baseGrid : GUIDE_FIGURES[kind].beats) + TOUCH_BEATS * touches.length;
/** Motion of one figure: couple transform from its start to its end, and the pelvis residual of each
 * dancer (own frame) the next segment starts with. #219: speed of the root as the figure starts (`entry`, own frame) and
 * as it ends (`exit`, in the dancer's own frame of the next segment). */
export interface FigureMotion { couple: CoupleTransform; residual: { leader: Offset; follower: Offset };
  entry: { leader: RootOffset; follower: RootOffset }; exit: { leader: RootOffset; follower: RootOffset };
  /** #219: the entry speed when the figure starts with a touch (#144: at its position 0), by touch (`touchKey`). */
  entryTouched: Record<string, { leader: RootOffset; follower: RootOffset }> }
/** #219: a touch as the plan builds it (its position, and `virgula` when danced so). */
export const touchKey = (touch: Touch) => JSON.stringify(touch);
export type GuideMotions = Record<GuideKind, FigureMotion>;

export const IDENTITY: CoupleTransform = { yaw: 0, x: 0, z: 0 };
const ZERO: Offset = { x: 0, z: 0 };
const RESTING: RootOffset = { x: 0, z: 0, yaw: 0 };
/** #219: beats between the samples that measure a speed at a boundary (second-order one-sided differences). */
export const JUNCTION_STEP = 1 / 96;
/** #219: speed at the end of `f` sampled at `at`, `at − h`, `at − 2h` (`back`), or at its start `at`, `at + h`, `at + 2h`. */
export const backSpeed = (f0: number, f1: number, f2: number, h = JUNCTION_STEP) => (3 * f0 - 4 * f1 + f2) / (2 * h);
export const aheadSpeed = (f0: number, f1: number, f2: number, h = JUNCTION_STEP) => (-3 * f0 + 4 * f1 - f2) / (2 * h);

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
  }
}
/** #144: samples a figure with its touches at a local beat of the segment. */
export function sampleSegment(kind: GuideKind, touches: Touch[], beat: number, follower: boolean, g: GuideRig) {
  return touches.length ? sampleTouched(b => sampleKind(kind, b, follower, g), touches, beat, follower, g.rest, placementOffset(g.placement, g.amp), g.stance)
    : sampleKind(kind, beat, follower, g);
}

/** Couple motion and pelvis residuals of every segment kind, measured on the samplers. */
export function guideMotions(g: GuideRig): GuideMotions {
  if (new Set([IDA_PAIR_DZ, MARCHE_PAIR_DZ, QUARTS_PAIR_DZ, SORTIE_GARCON_PAIR_DZ, SORTIE_FILLE_PAIR_DZ, PLACE_PAIR_DZ]).size !== 1)
    throw new Error("guide mode: the pair figures must share one couple spacing");
  const motions = {} as GuideMotions;
  const H = JUNCTION_STEP;
  /** Root on the ground and its own yaw, own frame. */
  const rootAt = (kind: GuideKind, beat: number, follower: boolean, touches: Touch[] = []) => {
    const s = sampleSegment(kind, touches, beat, follower, g) as { root: FootPoint; rootYaw?: number };
    return { x: s.root.x, z: s.root.z, yaw: s.rootYaw ?? 0 };
  };
  const entryOf = (kind: GuideKind, touches: Touch[] = []) => {
    const entry = { leader: RESTING, follower: RESTING };
    for (const role of ["leader", "follower"] as const) {
      const a = [0, 1, 2].map(k => rootAt(kind, k * H, role === "follower", touches));
      entry[role] = { x: aheadSpeed(a[0].x, a[1].x, a[2].x), z: aheadSpeed(a[0].z, a[1].z, a[2].z), yaw: aheadSpeed(a[0].yaw, a[1].yaw, a[2].yaw) };
    }
    return entry;
  };
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
    // #219: the root's speed as the figure starts (alone, or with a touch at its position 0), and as its segment ends
    // (the sorties hold their marka: at rest; a touch never ends a figure).
    const close = segmentBeats(kind), exit = { leader: RESTING, follower: RESTING };
    for (const role of ["leader", "follower"] as const) {
      const b = [0, 1, 2].map(k => rootAt(kind, close - k * H, role === "follower"));
      // Into the next segment's own frame (a speed only turns with the couple).
      const out = rotate(-couple.yaw, { x: backSpeed(b[0].x, b[1].x, b[2].x), z: backSpeed(b[0].z, b[1].z, b[2].z) });
      exit[role] = { ...out, yaw: backSpeed(b[0].yaw, b[1].yaw, b[2].yaw) };
    }
    const entryTouched: FigureMotion["entryTouched"] = {};
    for (const position of touchPositionsOf(kind).filter(t => t.at === 0)) for (const virgula of [false, true]) {
      if (virgula && !touchVirgula(kind, position)) continue;
      const touch: Touch = { ...position, ...(virgula ? { virgula: true } : {}) };
      entryTouched[touchKey(touch)] = entryOf(kind, [touch]);
    }
    motions[kind] = { couple, residual, entry: entryOf(kind), exit, entryTouched };
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

/** #152: what one sees as « the same figure »: the ida e volta whatever its variant, the sortie fille
 * chained or not; every other figure is itself (the three walks are three figures). */
export const guideIdentityOf = (kind: GuideKind): string =>
  kind === "base" ? "base" : kind === "sortieFG" ? "sortieF" : GUIDE_FIGURES[kind].movement === "ida" && !GUIDE_FIGURES[kind].marche ? "ida" : kind;

/** #140: figure the automatic dance starts at a neutral position (`boundary`). `history`: the figures
 * danced so far, the last one last (#152: the draw remembers them; it stays a pure function of the seed,
 * the beat and this history). */
export function autoFigure(seed: number, boundary: number, history: GuideKind[], offered: GuideFigure[], plain = false, variety: GuideVariety = "tenu"): GuideFigure | null {
  const A = GUIDE_AUTO, V = GUIDE_VARIETY[variety];
  const previous: GuideKind = history[history.length - 1] ?? "base";
  const identities = history.map(guideIdentityOf), last = identities[identities.length - 1];
  const recent = identities.slice(-GUIDE_MEMORY.figures), pairs = identities.slice(-(GUIDE_MEMORY.pairs + 1));
  const streak = Number.isFinite(V.streak) ? identities.slice(-V.streak) : [];
  const candidates = offered.filter(f => !GUIDE_FIGURES[f].chain);
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
    // #152: the figures and the pairs of figures danced lately.
    const identity = guideIdentityOf(f);
    w *= V.again ** recent.filter(x => x === identity).length;
    if (pairs.some((x, k) => k > 0 && pairs[k - 1] === last && x === identity)) w *= V.pair;
    return w;
  });
  // A figure danced `streak` times in a row is set aside, unless nothing else is offered.
  const held = candidates.map((f, k) => (streak.length >= V.streak && streak.every(x => x === guideIdentityOf(f)) ? 0 : weights[k]));
  if (!plain && held.some(w => w > 0)) held.forEach((w, k) => { weights[k] = w; });
  const total = weights.reduce((a, w) => a + w, 0);
  let u = guideDraw(seed, Math.round(boundary * 8) * 4) * total;
  for (let i = 0; i < candidates.length; i++) { u -= weights[i]; if (u < 0) return candidates[i]; }
  return candidates[candidates.length - 1];
}

export interface GuidePlan {
  segments: GuideSegment[]; outcomes: GuideOutcome[];
  /** #140: figures waiting in the queue, in order; #144: touches already asked for each of them. */
  queue: GuideFigure[]; queueTouches: number[];
  /** #140: the automatic dance is on at `until`. */
  auto: boolean;
}

/** Segments up to `until` (beats) and what became of each command (#140: a queue, nothing is refused
 * nor graded). Commands are sorted by beat; one with `beat > until` is ignored (not pressed yet).
 * - At each boundary (end of a figure, every `baseGrid` beats of the basic step) the first command of the
 *   queue starts; the queue empty, the automatic dance draws a figure when it is on, else the basic step
 *   goes on.
 * - #144: the ida's key (any variant) turns the next possible step of the dance into a touch (the foot
 *   goes and returns, then the figure resumes): in the figure under way, else in the figure waiting first
 *   in the queue; with neither, it is the 8-beat ida e volta, queued like any command.
 * - #90: ↑ during the sortie fille, before its position 3, chains it into the end of the sortie garçon.
 * - The automatic dance draws the same choices at each junction (« le début d'une figure si possible ou
 *   terminer l'actuelle »). Every decision is taken in the order of the clock: a plan never rewrites its
 *   past, and the poses up to a junction are those of the figure. */
export function planGuide(intentions: GuideIntention[], motions: GuideMotions, until: number, options: GuideOptions = {}): GuidePlan {
  const list = intentions.filter(i => Number.isFinite(i.beat) && i.beat <= until)
    .map((intention, order) => ({ intention, order })).sort((a, b) => a.intention.beat - b.intention.beat || a.order - b.order);
  const modes = (options.modes ?? []).filter(m => Number.isFinite(m.beat) && m.beat <= until).sort((a, b) => a.beat - b.beat);
  const autoAt = (beat: number) => { let auto = false; for (const m of modes) { if (m.beat <= beat + 1e-9) auto = m.auto; else break; } return auto; };
  const offered = options.offered ?? GUIDE_FIGURE_KEYS, seed = options.seed ?? 0, plain = !!options.plain, variety = options.variety ?? "tenu";
  const A = GUIDE_AUTO;
  const figures: GuideSegment[] = []; // #152: the figures danced, for the memory of the draw
  const outcomes: GuideOutcome[] = new Array(list.length);
  const segments: GuideSegment[] = [];
  let current: GuideSegment = { kind: "base", start: 0, end: Infinity, couple: IDENTITY, residual: { leader: ZERO, follower: ZERO }, previous: null, touches: [] };
  segments.push(current);
  let next = 0; // first command not yet read
  const queue: number[] = []; // commands waiting, in order
  const pending = new Map<number, Touch[]>(); // #144: touches asked for a command still waiting
  const started = new Map<number, GuideSegment>(); // command → the segment it started
  const touching: { index: number; host: number; touch: Touch }[] = []; // touch commands on a waiting figure
  const settle = (index: number, status: GuideStatus, start: number | null) => {
    outcomes[list[index].order] = { intention: list[index].intention, status, start };
  };
  let previousBoundary = 0;
  /** Junctions of the segment under way already decided (`t<position>`, `chain`). */
  let decided = new Set<string>();
  const drawKey = (beat: number, k: number) => Math.round(beat * 8) * 4 + k;
  const touchesOf = (s: GuideSegment) => s.touches ?? [];
  /** Beat of a position of the segment: the touches before it have each added their beats. */
  const junctionOf = (s: GuideSegment, at: number) => s.start + at + TOUCH_BEATS * touchesOf(s).filter(t => t.at < at).length;
  // A touch is an ida e volta: offered where the style offers the ida e volta (not in the walk-only styles).
  const touchable = offered.includes("ida");
  const freePositions = (s: GuideSegment) => touchable ? touchPositionsOf(s.kind).filter(p => !decided.has(`t${p.at}`)) : [];
  const addTouch = (s: GuideSegment, position: Touch, virgula: boolean): Touch => {
    const touch: Touch = { ...position, ...(virgula && touchVirgula(s.kind, position) ? { virgula: true } : {}) };
    s.touches = [...touchesOf(s), touch].sort((a, b) => a.at - b.at);
    // #219: a touch at the start changes the speed the segment starts with.
    if (position.at === 0 && s.previous !== null) s.speed = junctionSpeed(motions, s.previous, s.kind, s.touches);
    decided.add(`t${position.at}`);
    return touch;
  };
  /** #90: the sortie fille can still be chained (a touch from its position 3 on continues it instead). */
  const chainable = (s: GuideSegment) => s.kind === "sortieF" && offered.includes("sortieFG") && !decided.has("chain") && !touchesOf(s).some(t => t.at >= CHAIN_FROM);
  const boundaryOf = (s: GuideSegment) => s.kind === "base"
    ? s.start + GUIDE.baseGrid * Math.max(1, Math.ceil((previousBoundary - s.start + 1e-9) / GUIDE.baseGrid))
    : s.start + segmentBeats(s.kind, touchesOf(s));
  /** Next junction of the figure under way not decided yet: the chain, or a position (the chain first on a tie). */
  const nextJunction = (s: GuideSegment): { beat: number; position: Touch | null } | null => {
    if (s.kind === "base") return null;
    let best: { beat: number; position: Touch | null } | null = chainable(s) ? { beat: junctionOf(s, CHAIN_FROM), position: null } : null;
    for (const position of freePositions(s)) {
      const beat = junctionOf(s, position.at);
      if (!best || beat < best.beat - 1e-9) best = { beat, position };
    }
    return best;
  };
  for (let guard = 0; guard < 400000; guard++) {
    const boundary = boundaryOf(current);
    const junction = nextJunction(current);
    const command = next < list.length ? list[next].intention : null;
    // 1. A junction of the figure under way: the commands pressed before it have been read; the automatic
    // dance draws (a command pressed on the beat of the junction comes too late for it).
    if (junction && junction.beat <= until && (!command || junction.beat <= command.beat)) {
      const { beat, position } = junction;
      if (!position) {
        decided.add("chain");
        if (autoAt(beat) && guideDraw(seed, drawKey(beat, 2)) < (plain ? A.junction : offBeat(current.start) ? A.chainOdd : A.chainEven)) {
          current.kind = "sortieFG"; current.by = "auto";
        }
      } else {
        decided.add(`t${position.at}`);
        if (autoAt(beat)) {
          const end = boundaryOf(current);
          const p = plain ? A.touch : onPhrase(end + TOUCH_BEATS) ? A.junctionFit : onPhrase(end) ? A.junctionStay : A.touch;
          if (guideDraw(seed, drawKey(beat, 1)) < p) addTouch(current, position, guideDraw(seed, drawKey(beat, 3)) < A.virgula);
        }
      }
      continue;
    }
    // 2. A command pressed by the boundary (a press on the beat of the boundary included).
    if (command && command.beat <= boundary + 1e-9) {
      const index = next++;
      const def = GUIDE_FIGURES[command.figure];
      if (def.movement === "ida" && !def.marche) {
        // #144: the next possible step of the dance becomes a touch.
        const position = freePositions(current)[0];
        if (position) { addTouch(current, position, !!command.virgula); settle(index, "insérée", junctionOf(current, position.at)); continue; }
        const host = queue[0];
        if (host !== undefined && touchable) {
          const figure = list[host].intention.figure, taken = pending.get(host) ?? [];
          const spot = touchPositionsOf(figure).find(q => !taken.some(t => t.at === q.at));
          if (spot) {
            const touch: Touch = { ...spot, ...(command.virgula && touchVirgula(figure, spot) ? { virgula: true } : {}) };
            pending.set(host, [...taken, touch]); touching.push({ index, host, touch });
            continue;
          }
        }
      } else if (command.figure === "avance" && chainable(current)) {
        current.kind = "sortieFG"; decided.add("chain"); settle(index, "enchaînée", junctionOf(current, CHAIN_FROM));
        continue;
      }
      queue.push(index);
      continue;
    }
    // 3. The boundary: the first command of the queue, else the automatic dance, else the basic step.
    if (boundary > until) break;
    previousBoundary = boundary;
    const head = queue.shift();
    const choice: GuideFigure | null = head !== undefined ? list[head].intention.figure
      : autoAt(boundary) ? autoFigure(seed, boundary, figures.slice(-(GUIDE_MEMORY.pairs + 1)).map(s => s.kind), offered, plain, variety) : null;
    if (current.kind === "base" && !choice) continue; // keep dancing the basic step
    const motion = motions[current.kind], previous = current;
    previous.end = boundary;
    const touches = head !== undefined ? [...(pending.get(head) ?? [])].sort((a, b) => a.at - b.at) : [];
    current = { kind: choice ?? "base", start: boundary, end: Infinity, couple: compose(previous.couple, motion.couple), residual: motion.residual,
      speed: junctionSpeed(motions, previous.kind, choice ?? "base", touches),
      previous: previous.kind, previousTouches: touchesOf(previous), touches,
      ...(choice ? { by: head !== undefined ? "commande" as const : "auto" as const } : {}) };
    decided = new Set(touches.map(t => `t${t.at}`));
    segments.push(current);
    if (choice) figures.push(current);
    if (head !== undefined) started.set(head, current);
  }
  for (const [index, segment] of started) settle(index, segment === current ? "en cours" : "dansée", segment.start);
  // A touch asked for a figure still waiting starts with it.
  for (const { index, host, touch } of touching) {
    const segment = started.get(host);
    settle(index, "insérée", segment ? segment.start + touch.at + TOUCH_BEATS * touchesOf(segment).filter(t => t.at < touch.at).length : null);
  }
  // The head of the queue starts at the next boundary; the others wait behind it.
  const ahead = boundaryOf(current);
  queue.forEach((index, k) => settle(index, "en file", k === 0 ? ahead : null));
  return { segments, outcomes, queue: queue.map(index => list[index].intention.figure), queueTouches: queue.map(index => pending.get(index)?.length ?? 0), auto: autoAt(until) };
}

/** #219: speed of the residual at a boundary from `from` to `to` (own frame of `to`): what the pelvis keeps of its speed.
 * `touches`: those of `to` (one at its position 0 starts it). */
export function junctionSpeed(motions: GuideMotions, from: GuideKind, to: GuideKind, touches: Touch[] = []): { leader: RootOffset; follower: RootOffset } {
  const minus = (a: RootOffset, b: RootOffset): RootOffset => ({ x: a.x - b.x, z: a.z - b.z, yaw: a.yaw - b.yaw });
  const first = touches.find(t => t.at === 0), entry = (first && motions[to].entryTouched[touchKey(first)]) || motions[to].entry;
  return { leader: minus(motions[from].exit.leader, entry.leader), follower: minus(motions[from].exit.follower, entry.follower) };
}
/** #219 (Bollo, « Inertialization », GDC 2018): an offset that starts at `x0` with speed `v0` (per beat), the place gone
 * after `T` beats and the speed after `V`, with neither speed nor acceleration left, the acceleration nil at the start.
 * With `v0` = 0 it is the quintic fade of #69 (`inertiaWeight`); with `V` = `T`, Bollo's own curve. The pelvis then
 * keeps both its place and its speed across a boundary. */
export function inertialize(x0: number, v0: number, elapsed: number, T = GUIDE.inertia, V = T): number {
  const t = Math.max(0, elapsed), place = t >= T ? 0 : x0 * inertiaWeight(t);
  if (t >= V || v0 === 0) return place;
  // The speed's own curve (Bollo's with no offset), over `V` beats: it carries on by `JUNCTION_OVERSHOOT`·v0·V at most.
  const u = t / V;
  return place + v0 * V * u * (1 + u * u * (-6 + u * (8 - 3 * u)));
}
/** #219: the farthest the speed's own curve carries on (share of v0·V), a fifth of the way into its time. */
export const JUNCTION_OVERSHOOT = 0.19;
/** #219: the root's own yaw carries its speed at most this far beyond the next figure (rad). Carried over a whole beat,
 * the 19° per beat of an ida e volta started on another beat of its cycle turned the knees into the partner's (measured
 * on the GLB, `test_guidage`: kizomba idaArrD → idaD; with 1°, still suave idaArrD → sortie fille chained; 0.5°: no
 * leg-bone crossing in the six styles). Its speed then fades faster. */
export const JUNCTION_YAW = 0.5 * Math.PI / 180;
export const yawFade = (speed: number) => Math.min(GUIDE.inertia, JUNCTION_YAW / Math.max(1e-9, JUNCTION_OVERSHOOT * Math.abs(speed)));

/** Quintic fade of an inertialized residual (Bollo): 1 → 0 over `GUIDE.inertia` beats, flat at both ends. */
export function inertiaWeight(elapsed: number): number {
  const u = Math.max(0, Math.min(1, elapsed / GUIDE.inertia));
  return 1 - u * u * u * (10 - 15 * u + 6 * u * u);
}

export interface GuideSample {
  segment: GuideSegment; kind: GuideKind; movement: MovementKey; localBeat: number;
  /** #144: touches of the segment, and the one under way at this beat (with its beats elapsed). */
  touches: Touch[]; touch: Touch | null; touchBeat: number;
  /** Beat of the figure itself (the touches taken out; held on its position during a touch). */
  figureBeat: number;
  /** #157: the ginga setting of the session. */
  ginga: GuideGinga;
  couple: CoupleTransform; rootOffset: { leader: RootOffset; follower: RootOffset };
  /** Share (1 → 0) of a boundary residual still applied (quintic fade). */
  inertia: number;
}
export function sampleGuide(plan: GuidePlan, beat: number, ginga: GuideGinga = GUIDE_GINGA_DEFAULT): GuideSample {
  let segment = plan.segments[0];
  for (const s of plan.segments) if (s.start <= beat + 1e-9) segment = s;
  const localBeat = Math.max(0, beat - segment.start);
  const w = inertiaWeight(localBeat);
  // #219: the residual goes with its speed (a fade from rest where the segment gives none).
  const faded = (o: Offset, v: RootOffset = RESTING): RootOffset =>
    ({ x: inertialize(o.x, v.x, localBeat), z: inertialize(o.z, v.z, localBeat), yaw: inertialize(0, v.yaw, localBeat, GUIDE.inertia, yawFade(v.yaw)) });
  const touches = segment.touches ?? [], where = touchedBeat(touches, localBeat);
  return {
    segment, kind: segment.kind, localBeat, couple: segment.couple,
    touches, touch: where.touch, touchBeat: where.t, figureBeat: where.hostBeat, ginga,
    movement: movementOf(segment.kind),
    rootOffset: { leader: faded(segment.residual.leader, segment.speed?.leader), follower: faded(segment.residual.follower, segment.speed?.follower) },
    inertia: segment.previous === null ? 0 : w,
  };
}

/** Pose movement of a segment kind. */
export function movementOf(kind: GuideKind): MovementKey {
  return kind === "base" ? "none" : GUIDE_FIGURES[kind].movement;
}

/** Pose options of one dancer for a guide sample (shared by the view and the GLB tests): the pair
 * figure models, plexus contact, and the inertialized pelvis offsets of both dancers. */
export function guidePoseOptions(s: Pick<GuideSample, "movement" | "rootOffset"> & { kind?: GuideKind; touches?: Touch[]; ginga?: GuideGinga; previous?: GuideKind | null }, follower: boolean) {
  const role = follower ? "follower" : "leader", partner = follower ? "leader" : "follower";
  // #167: the figure danced just before, for the ginga's phase to continue from it.
  const before = s.previous && s.previous !== "base" ? GUIDE_FIGURES[s.previous] : null;
  return {
    gingaFrom: before && { movement: before.movement, ...figureOptions(s.previous!), quartsPaire: before.movement === "quarts", idaPaire: before.movement === "ida", placePaire: false, beats: before.beats },
    movement: s.movement, embrace: true, follower, ...figureOptions(s.kind ?? "base"), touches: s.touches ?? [],
    ginga: guideGingaOf(s.ginga ?? GUIDE_GINGA_DEFAULT),
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

/** #144 demonstration (`?guidage=1&demo=allerretour`): the owner's two examples. A sortie garçon whose G1
 * is first a go-and-return, as a virgula (the ida's key with Shift while the sortie waits); then a sortie
 * fille whose return (D4) is one (the ida's key before its position 3). */
export const GUIDE_DEMO_TOUCH: GuideIntention[] = [
  { beat: 1, figure: "sortieG" }, { beat: 2, figure: "ida", virgula: true }, { beat: 10, figure: "sortieF" }, { beat: 14.6, figure: "ida" },
];

/** #157 demonstration (`?guidage=1&demo=ginga`, GIFs of the election): the figures that had no hip sway
 * before the ginga, from the first beat: walk forward, walk backward, sortie garçon, quart de tour. */
export const GUIDE_DEMO_GINGA: GuideIntention[] = [
  { beat: 0, figure: "avance" }, { beat: 0.1, figure: "recule" }, { beat: 0.2, figure: "sortieG" }, { beat: 0.3, figure: "quart" },
];

/** Live wrapper used by the view: commands are appended as keys are pressed, mode changes as Space is. */
export class GuideSession {
  intentions: GuideIntention[] = [];
  /** #140: switches between listening (the default) and the automatic dance. */
  modes: GuideModeChange[] = [];
  seed = 1;
  /** #152: how tightly the automatic dance avoids repetitions. */
  variety: GuideVariety = "tenu";
  /** #157: the ginga setting (hip sway and bounce of the couple). */
  ginga: GuideGinga = GUIDE_GINGA_DEFAULT;
  offered: GuideFigure[] = GUIDE_FIGURE_KEYS;
  motions: GuideMotions | null = null;
  boundKey: string | null = null;
  private cache: { key: string; plan: GuidePlan } | null = null;
  bind(g: GuideRig, key = "") { this.motions = guideMotions(g); this.boundKey = key; this.cache = null; }
  press(beat: number, figure: GuideFigure, virgula = false) {
    // #89: ↑ ↑ in quick succession leads the double (one command). ↓ held then the ida's key: the ↓ press
    // was a walk backwards until the key came; the ida variant replaces it.
    // #140: only a command still waiting in the queue is rewritten this way; one already started (or that
    // changed the sortie under way) is final, and the new press is a command of its own.
    const last = this.intentions[this.intentions.length - 1];
    const waiting = !!last && this.waiting(last, beat);
    if (waiting && figure === "avance" && last.figure === "avance" && beat - last.beat <= GUIDE.double) last.figure = "double";
    else if (waiting && (figure === "idaArr" || figure === "idaArrD") && last.figure === "recule" && beat - last.beat <= GUIDE.chord)
      Object.assign(last, { beat, figure });
    else this.intentions.push({ beat, figure, ...(virgula ? { virgula: true } : {}) });
    this.cache = null;
  }
  /** The command has not started yet (an unbound session cannot tell: it waits). */
  private waiting(intention: GuideIntention, beat: number): boolean {
    const outcome = this.plan(beat)?.outcomes.find(o => o?.intention === intention);
    return !outcome || outcome.status === "en file";
  }
  /** The automatic dance is on (after the last mode change). */
  get auto(): boolean { return this.modes.length ? this.modes[this.modes.length - 1].auto : false; }
  setAuto(beat: number, auto: boolean) { this.modes.push({ beat, auto }); this.cache = null; }
  reset(auto = false) { this.intentions = []; this.modes = auto ? [{ beat: 0, auto: true }] : []; this.cache = null; }
  plan(beat: number): GuidePlan | null {
    if (!this.motions) return null;
    const key = `${this.intentions.length}:${this.modes.length}:${Math.floor(beat * 8)}`;
    if (this.cache?.key !== key) this.cache = { key, plan: planGuide(this.intentions, this.motions, beat, { modes: this.modes, seed: this.seed, offered: this.offered, variety: this.variety }) };
    return this.cache.plan;
  }
  sample(beat: number): GuideSample | null {
    const plan = this.plan(beat);
    return plan ? sampleGuide(plan, beat, this.ginga) : null;
  }
}
