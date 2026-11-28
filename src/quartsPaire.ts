/** Quarter turns in pair, around the leader (#37, docs/spec-quarts-paire.md).
 * GLB coordinates: left +x, forward +z. The couple frame is the leader's outer frame; the
 * follower's outer frame is translated by 2·QUARTS_PAIR_DZ along +z and turned by π. */
import { gaitStep, GAIT } from "./gait";
import { COUPLE_DZ, placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

export const QUARTS_BEATS = 16;
/** Same half-spacing as the five-action figures: the couple placements are calibrated for it. */
export const QUARTS_PAIR_DZ = COUPLE_DZ;
/** Owner rule (phase 14): the left heel comes to the tip of the right foot, at a right angle.
 * Ankle offset from the right ankle: the heel lies 5.6 cm behind the ankle, the toe 15.6 cm ahead. */
export const QUARTS_HEEL_AT_TOE: FootPoint = { x: 0.056, z: 0.20 };
/** #208 (owner, 24 Nov. 2026, after a lesson: « on va corriger le quart de tour (qui est trop rapide) […] le pas
 * virgula avance (il est un peu plus loin que le bout du pied pour faire reculer la partenaire d'environ la distance
 * d'un pied) et donc l'accélération de la rotation n'est pas aussi soudaine »). PROTOTYPE until his vote, shown by the
 * address only (`?quart=<nom>`), the quarter of today by default:
 * - `beyond` (m): how much further forward than today the virgula's heel lands (today 2 cm beyond the tip of his D);
 *   in the rigid quarter about C, the follower's D lands back by as much;
 * - `turn`: `diagonale`: the block (pelvis and chest) turns half the quarter over the first foot's whole flight and
 *   the rest over the second's, easing in and out (no sudden stop at the landing; today it turns over the last 60 % of
 *   the first flight and stops dead); `apres`: the same, the first half ending `QUART_AFTER` beats after the first
 *   foot has landed (the block catches up with the foot while the weight settles).
 * Owner, 25 Nov. 2026: no pivot from the first step on; the turn grows gradually between the first step (which goes
 * forward and makes the follower step back) and the second. `progressif`: the block turns the whole quarter in one
 * smooth curve from the moment the first foot leaves to the landing of the second, nearly facing front when the first
 * foot lands; `entreLesPas`: the first step only goes forward, the block turns from its landing to the second's. */
export interface QuartVirgula { beyond: number; beside?: number; pivot?: boolean; turn: "aujourdhui" | "diagonale" | "apres" | "progressif" | "entreLesPas";
  /** #211: the follower's D goes this far straight back on « 1 » (m), then pivots, loaded, and closes on « 4 ». */
  back?: number;
  /** #211: at « 1 » the leader's chest turns this far towards the coming turn (rad), the pelvises still facing. */
  chestLead?: number;
  /** #211 (owner, 28 Nov. 2026): beats of one quarter; 2: the first steps land on « 1 », the couple turns and is back in
   * the neutral position on « 2 » (`QUART_TWO`). Four beats when absent. */
  beats?: 2 }
export const QUART_AFTER = 0.4;
export const QUART_TODAY: QuartVirgula = { beyond: 0, turn: "aujourdhui" };
export const QUART_CANDIDATES: Record<string, QuartVirgula> = {
  plus5: { beyond: 0.05, turn: "diagonale" }, plus10: { beyond: 0.10, turn: "diagonale" },
  // The follower's D lands about one foot back (21 cm).
  unPied: { beyond: 0.19, turn: "diagonale" }, apres: { beyond: 0.10, turn: "apres" },
  // 25 Nov.: the turn spread over the two steps (the virgula of `plus10`).
  progressif: { beyond: 0.10, turn: "progressif" }, entreLesPas: { beyond: 0.10, turn: "entreLesPas" },
  // The quarter before #208.
  ancien: QUART_TODAY,
};
/** #208, votes of 25 Nov. 2026: the virgula goes one foot further (`unPied`) and the first step only goes forward
 * (the follower steps back), the block turning from its landing to the second's (`entreLesPas`). Tuned on the GLB
 * without any leg-bone crossing (scripts/sonde_croisements_couple.mjs): `beside` (m), the virgula lands that much
 * further to his left, clear of the follower's standing G. The quarter in four beats, retained until 28 Nov. 2026
 * (f8619a1), shown by `?quart=quatreTemps`; the candidates before the two-beat quarter are built on it. */
export const QUART_FOUR: QuartVirgula = { beyond: 0.19, beside: 0.034, turn: "entreLesPas" };
/** #208, precision of 25 Nov. (PROTOTYPE, `?quart=pivotSuiveur`): the follower's D steps straight back without turning,
 * then pivots on its ball, loaded, while the couple turns. Its bones never cross his, but in the quinconce at amplitude
 * 1 her toes land on his virgula's (spec, « Le pivot de la suiveuse »): not the default until the owner decides. */
QUART_CANDIDATES.pivotSuiveur = { ...QUART_FOUR, pivot: true };
/** #211 (owner, 27 Nov. 2026, after the films of f8619a1: on « 1 » the follower steps straight back on the line instead of
 * starting the pivot). PROTOTYPES, to elect: her D goes straight back on « 1 » and her pelvis with it, without turning;
 * the D then carries her and pivots on its ball while the couple turns (from his D's lift for « 2 »); her G goes round
 * on « 3 »; her D, free again, closes to the quarter's place on « 4 » (the quarter stays rigid, spec #37).
 * - `reculDroit` (H): the elected virgula; it lands in her D's lane, 13 cm beyond her toes: her D goes back 34 cm.
 * - `reculUnPied` (H′): the virgula 10 cm further to his left, out of her lane; her D goes back one foot (21 cm).
 * Both: at « 1 » his chest turns 15° towards the coming turn while the pelvises still face each other; hers follows it
 * (`chestLead`). */
QUART_CANDIDATES.reculDroit = { ...QUART_FOUR, back: 0.34, chestLead: 15 * Math.PI / 180 };
QUART_CANDIDATES.reculUnPied = { ...QUART_FOUR, beside: (QUART_FOUR.beside ?? 0) + 0.10, back: 0.21, chestLead: 15 * Math.PI / 180 };
/** #211 (`back`): `close`, beats of the quarter over which her free D closes to the quarter's place (« 4 »), `lift` (m) its
 * marca's height; `pelvis`: share of her D's way back her pelvis takes (over the D that carries her), `stay`: beats of the
 * quarter while it stays there before going to the quarter's place with her G; `lag`: beats her chest follows his. */
export const QUART_RECUL = { close: [3.1, 3.8], lift: 0.005, pelvis: 0.85, stay: [1.2, 2.0, 3.6], lag: 0.1 };
/** #211 (owner, 28 Nov. 2026: the quarter is danced in two beats, not four; on « 2 » the couple is back in the neutral
 * position it started from, turned a quarter). Two prototypes were filmed (57c32da):
 * - `deuxTemps`: the four-beat quarter in two beats: his virgula and her D land on « 1 » (her D at its place, already
 *   turned, as in f8619a1), the pelvises not turned yet; the block turns between « 1 » and « 2 », his D and her G land
 *   on « 2 », the couple in quinconce again;
 * - `deuxTempsRecul`: the same, her D going back on « 1 » without turning and pivoting on its ball on « 2 » while the
 *   couple turns (`pivot`), chests leading (`chestLead`). Back as straight as the neutral on « 2 » allows: a D exactly
 *   straight back ends, once pivoted, 18 cm short of its place, under his D (spec #211, « Le quart en deux temps »).
 * The owner chose `deuxTempsRecul` (28 Nov. 2026, « pied D qui recule »): it is the quarter turn in pair. Its chests keep
 * the plexus contact (R4) and so turn with the partner, 30° on « 1 », towards the coming turn: turned 15° only
 * (`chestLead`, as filmed), they parted 16 cm on « 1 » (R4: 6 cm), still shown by `?quart=buste15`. */
QUART_CANDIDATES.deuxTemps = { ...QUART_FOUR, beats: 2 };
export const QUART_ELECTED: QuartVirgula = { ...QUART_FOUR, beats: 2, pivot: true };
QUART_CANDIDATES.deuxTempsRecul = QUART_ELECTED;
QUART_CANDIDATES.buste15 = { ...QUART_ELECTED, chestLead: 15 * Math.PI / 180 };
QUART_CANDIDATES.quatreTemps = QUART_FOUR;

/** #208 (`entreLesPas`): the leader's G knee points where its foot does (the virgula turned out to the left, the
 * pelvis not yet turned); his trailing D knee opens `right` rad outwards meanwhile, in proportion; the follower's D
 * knee opens `follower` rad to her right while she steps back and pivots on it. */
export const QUART_KNEE = { left: 1, right: 0.6, follower: 0.3 };
export const QUART_PROTO: { v: QuartVirgula } = { v: QUART_ELECTED };
export const setQuartProto = (name: string | null | undefined) => { QUART_PROTO.v = (name && QUART_CANDIDATES[name]) || QUART_ELECTED; };
/** Quintic ease: zero speed and zero acceleration at both ends. */
const ease5 = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * t * (10 - 15 * t + 6 * t * t); };
const QUARTER = Math.PI / 2;
/** Beats of one quarter (#211: 2 for the two-beat prototypes). */
export const quartBeats = () => QUART_PROTO.v.beats ?? 4;

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
/** #163 (docs/spec-ginga-couple.md): the pair quarter turn takes the couple's largest ginga setting, and
 * is held to `cap` (the `marque` setting: share of the style's hip sway, bounce in metres) at both ends of
 * the quarter: the room opens over `from` and closes over `until` (beats of the quarter). Measured on the
 * GLB in the game mode's sessions: ending on the `ample` setting, the two right femurs met an eighth of a
 * beat into the next figure (sortie fille, double), the pelvis still carrying the quarter's sway. */
export const QUARTS_GINGA = { cap: { sway: 0.3, bounce: 0.009 }, from: [0, 0.5], until: [3.3, 3.8] };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Same convention as quartTurnStep: positive angle = yaw towards the left (anticlockwise). */
const rotate = (p: FootPoint, th: number): FootPoint =>
  ({ x: p.x * Math.cos(th) + p.z * Math.sin(th), z: -p.x * Math.sin(th) + p.z * Math.cos(th) });
const about = (c: FootPoint, p: FootPoint, th: number): FootPoint => {
  const v = rotate({ x: p.x - c.x, z: p.z - c.z }, th);
  return { x: c.x + v.x, z: c.z + v.z };
};
const toFollower = (p: FootPoint): FootPoint => ({ x: -p.x, z: 2 * QUARTS_PAIR_DZ - p.z });

export interface QuartsCouple {
  centre: FootPoint;
  leader: { L: FootPoint; R: FootPoint; root: FootPoint };
  follower: { L: FootPoint; R: FootPoint; root: FootPoint };
}
/** Start configuration (couple frame) and the turn centre derived from the owner's rule. */
export function quartsCouple(rest: Record<FigureFoot, FootPoint>, o: PlacementOffset, stance = 0): QuartsCouple {
  const widen = Number.isFinite(stance) ? stance : 0;
  const stagger = (o.stagger ?? 0) / 2;
  const own = {
    L: { x: rest.L.x + widen + o.x, z: rest.L.z + o.z },
    R: { x: rest.R.x - widen + o.x, z: rest.R.z + o.z + stagger },
    root: { x: o.x, z: o.z },
  };
  const leader = own;
  const follower = { L: toFollower(own.L), R: toFollower(own.R), root: toFollower(own.root) };
  // The quarter rotation sending L0 onto L1 = R0 + heel-at-toe: rotate(u) - u = d with u = L0 - C.
  const target = { x: own.R.x + QUARTS_HEEL_AT_TOE.x, z: own.R.z + QUARTS_HEEL_AT_TOE.z + QUART_PROTO.v.beyond };
  target.x += QUART_PROTO.v.beside ?? 0;
  const d = { x: target.x - own.L.x, z: target.z - own.L.z };
  const u = { x: -(d.x + d.z) / 2, z: (d.x - d.z) / 2 };
  return { centre: { x: own.L.x - u.x, z: own.L.z - u.z }, leader, follower };
}

/** Shape of one step. `start`–`end`: flight window in beats of the quarter (0–4). In fractions of the
 * flight, the foot first disengages along `bump` (dancer's frame at the start of the quarter, full at
 * `bumpPeak`, back to 0 at landing), its arc around the centre starts after `arcDelay` and may
 * `bulge` (fraction of the radius), and it pivots after `yawDelay`. */
export interface QuartsStepShape {
  start: number; end: number; bump: FootPoint; bumpPeak: number; arcDelay: number; bulge: number; yawDelay: number;
}
/** Per role: [first foot, second foot] (leader G then D, follower D then G). */
export type QuartsShapes = Record<"leader" | "follower", [QuartsStepShape, QuartsStepShape]>;
const still: QuartsStepShape = { start: 0, end: 1.2, bump: { x: 0, z: 0 }, bumpPeak: 0.4, arcDelay: 0, bulge: 0, yawDelay: 0 };
/** Calibrated on the GLB soles and leg bones over the first quarter (all quarters are the same up to
 * the rotation), docs/spec-quarts-paire.md, Calibrage. In quinconce each first foot stands between the
 * partner's feet, forefeet in contact. #82 (owner, 20 Nov.: « ça doit se faire en simultané »): the
 * follower's D and the leader's G leave together (0.4) and land together on beat 1 (#62, weight on the
 * beat); her D still retreats first along its path (bump) before arcing, which leaves his G its place;
 * then her G (1.45–3, on beat 3) and his D (1.8–2.9: landing on 3 would overlap her G), which circles
 * 40 % wide around the heel of his G and pivots in the second half of its flight. */
export const QUARTS_SHAPES: QuartsShapes = {
  leader: [
    { ...still, start: 0.4, end: 1.0, bump: { x: 0, z: 0.07 }, bumpPeak: 0.6, arcDelay: 0.1, bulge: -0.3 },
    { ...still, start: 1.8, end: 2.9, arcDelay: 0.3, bulge: 0.4, yawDelay: 0.5, bump: { x: -0.07, z: -0.03 }, bumpPeak: 0.35 },
  ],
  follower: [
    { ...still, start: 0.4, end: 1.0, bump: { x: 0, z: -0.32 }, bumpPeak: 0.5, arcDelay: 0.3 },
    { ...still, start: 1.45, end: 3.0, bump: { x: 0, z: -0.18 }, bumpPeak: 0.2, arcDelay: 0.1, bulge: 0.35 },
  ],
};
/** #208: where the right foot pivots, its ball, from the ankle, figure frame at foot yaw 0 (measured on the GLB foot,
 * turned out at rest: `model.legs.R.ball` through the posed foot). */
export const QUART_BALL: FootPoint = { x: -0.016841006, z: 0.116643436 };
/** #211: the left heel, from the ankle, same frame and measure (`model.legs.L.heel`; the feet are not exact mirrors). */
export const QUART_HEEL_L: FootPoint = { x: 0.007825869, z: -0.035071788 };
/** #208 (`entreLesPas`): how far ahead of its yaw the place of the pelvis goes round C with the first step (1: an
 * eighth of the quarter at the first landing, as the feet; 0: it waits for the second step). */
export const QUART_LEAD = 0.9;
/** #208, #219 (R34: the pelvis never stops and its speed never breaks): the place of the pelvis goes round C along one
 * curve over the whole quarter instead of two bursts held still in between (it went 45 % of the way within the first
 * foot's flight, 80 cm per beat, then the rest within the second's, then stood still for the last beat). `knots`: [beat
 * of the quarter, share of the quarter] it passes through: it starts before the first feet leave, is over the virgula
 * when it lands (`QUART_LEAD`), drifts while the block turns and finishes after the second foot has landed; `drift`:
 * share per beat it still moves at both ends of the quarter, the same at both, so that quarters chain without a break.
 * A monotone cubic through them (Fritsch-Butland): it never goes back. Measured on the GLB (game mode, kizomba): 324
 * cm/beat² and 57 cm per beat at most instead of 419 and 80, never still. Bounded by the bones: a pelvis behind the
 * virgula when it lands crosses the legs (amplitude 0.5); a pelvis ahead of the trailing foot when it pushes off makes
 * the height jump (the legs' reach, 1 400 to 3 000 cm/beat²). */
export const QUART_ROOT = { knots: [[0, 0], [0.35, 0.012], [1, QUART_LEAD / 2], [1.75, 0.47], [3, 0.97], [4, 1]] as [number, number][], drift: 0.02 };
/** Share of the quarter the place of the pelvis has gone round C at beat `q` of the quarter (`QUART_ROOT`). */
export function quartRootShare(q: number, path: { knots: [number, number][]; drift: number } = quartBeats() === 2 ? QUART_TWO.root : QUART_ROOT): number {
  const k = path.knots, n = k.length, t = Math.max(k[0][0], Math.min(k[n - 1][0], q));
  const width = k.slice(1).map(([x], i) => x - k[i][0]), secant = k.slice(1).map(([, y], i) => (y - k[i][1]) / width[i]);
  // Interior slopes: Fritsch-Butland's weighted harmonic mean of the neighbouring secants (monotone, no overshoot).
  const slope = k.map((_, i) => i === 0 || i === n - 1 ? path.drift : secant[i - 1] * secant[i] <= 0 ? 0
    : 3 * (width[i - 1] + width[i]) / ((2 * width[i] + width[i - 1]) / secant[i - 1] + (width[i] + 2 * width[i - 1]) / secant[i]));
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const h = k[i + 1][0] - k[i][0], u = (t - k[i][0]) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * k[i][1] + (u3 - 2 * u2 + u) * h * slope[i] + (-2 * u3 + 3 * u2) * k[i + 1][1] + (u3 - u2) * h * slope[i + 1];
}
/** #208 (`entreLesPas`): the leader's D arcs from the moment it leaves (the virgula one foot further makes its way
 * longer; arcing late, it caught up at the end and the pelvis rose 6 cm within a quarter of a beat). */
export const QUART_BETWEEN_SHAPES: QuartsShapes = {
  ...QUARTS_SHAPES, leader: [QUARTS_SHAPES.leader[0], { ...QUARTS_SHAPES.leader[1], arcDelay: 0 }],
};
/** #211 (`beats: 2`): the quarter in two beats. « 1 » as in four beats (the first feet leave together and land on it);
 * « 2 » is the four-beat quarter from its « 1 » to its second landing (beat 2.9 of four), played 1.9 times faster: the
 * same poses in the same order, the block turning as far as the place of the pelvis has gone round C (a place ahead of the
 * turn crossed his G's leg with her D's in the middle of « 2 »). `shapes`: the second feet; `root`, `crossing`: the
 * knots of `QUART_ROOT` and the window of `QUARTS_BODY.crossing` on that time; `ginga`: the room of `QUARTS_GINGA` closes
 * before « 2 »; `chestLag`: the chest's delay on the pelvis (0.13, `QUARTS_BODY.chestLag` on that time, turned his chest
 * 27° against his pelvis in the middle of « 2 », where it turns fastest, beyond the 18° of the « not wrestlers » rule). Her G leaves at 1.05, as soon as her D carries her: leaving at
 * 1.24, her pelvis popped up 3 cm in a tenth of a beat as it left (1 183 to 1 471 cm/beat² against 780 now). */
export const QUART_TWO = {
  shapes: {
    leader: [QUARTS_SHAPES.leader[0], { ...QUARTS_SHAPES.leader[1], start: 1.42, end: 2.0, arcDelay: 0 }],
    follower: [QUARTS_SHAPES.follower[0], { ...QUARTS_SHAPES.follower[1], start: 1.05, end: 2.0 }],
  } as QuartsShapes,
  root: { knots: [[0, 0], [0.35, 0.012], [1, QUART_LEAD / 2], [1.395, 0.47], [2, 1]] as [number, number][], drift: QUART_ROOT.drift },
  crossing: { from: 0.6, to: 1.32 },
  ginga: { from: [0, 0.4], until: [1.6, 1.95] },
  chestLag: 0.05,
  /** The block starts turning a little before « 1 » (1.5° on it), so that its turn starts gently (it turned the quarter
   * from « 1 » to « 2 »: 520 °/beat² at most). Her D pivots from its landing on « 1 ». */
  turnFrom: 0.85,
  /** His virgula lands `open` (rad) further out than perpendicular and closes back on its heel over `close` (beats), while
   * her D pivots away. Perpendicular, the tip of his virgula and her toes overlapped from her landing to 1.44 (quinconce,
   * amplitude 1): with the neutral on « 2 », where her D lands is fixed whatever the virgula's place (spec #211).
   * About its ball the toes hardly move (still 48 samples at 20°); about its heel, 10° clears them. */
  open: 10 * Math.PI / 180, close: [1.3, 1.9],
  /** Her D's way back on « 1 »: `1 − (1 − smooth)^backEase` of the way at each moment of its flight (3 in four beats). She
   * answers the virgula at once (half her way within a tenth of the flight): slower, her knee met his virgula's thigh at
   * 0.5 with the game's ginga (3 to 8 poses from 3 to 6); going straight back first and to her right late instead, her
   * foot stayed in the lane his G arrives in. */
  backEase: 8,
};
/** Pelvis and style during the pair quarter turns (calibrated, docs/spec-quarts-paire.md):
 * - #106: pelvis and upper body turn as one block with the feet, half the quarter with the first foot
 *   (the diagonal when it lands), the rest with the second; `extremity`: lateral offset of the side
 *   that reaches its final place with the first foot (his left, her right); `travel`: share of the
 *   way from the rigid rotation about the centre to that extremity rule (the full rule leaves the back
 *   foot so far behind that the pelvis drops and the front knee juts into the partner); `delay`: the
 *   block turns over the end of the first foot's flight (from 40 % of it, #126: a smoother start), once
 *   the partner's foot has cleared; `chestLag`: the chest follows the pelvis that many beats later (#126,
 *   « le buste peut avoir un léger retard sur le pied : le temps de transfert »); `heel`:
 *   the leader's trailing D rises on its ball (rad) while his G carries him;
 * - `coupling`: the follower's pelvis mirrors the leader's (hips that seek each other);
 * - `sway`: share of the style's pelvis sway kept while the couple turns interleaved (#203: 0.25, half as before:
 *   with the knees at 30° at least, the semba's and the suave's swaying pelvis brought the standing knees together);
 * - knee flexion cap, style pelvis rotation cap and style bounce, softened around the `crossing`
 *   (both pairs of thighs interleaved while the leader's G lands next to the follower's standing G). */
export const QUARTS_BODY = {
  extremity: 0.09, travel: { leader: 0.65, follower: 0.58 }, delay: 0.4, chestLag: 0.25, heel: 0.18, coupling: 1, sway: 0.25, kneeCap: 0.22, rotationCap: 0.12, dip: -0.008, roll: 0.5,
  crossing: { from: 0.6, to: 1.6, ramp: 0.3, kneeCap: 0.12, rotationCap: 0.04 },
};
function crossingAt(q: number): number {
  const { ramp: r } = QUARTS_BODY.crossing, { from, to } = quartBeats() === 2 ? QUART_TWO.crossing : QUARTS_BODY.crossing;
  return Math.max(0, Math.min(smooth((q - from + r) / r), 1 - smooth((q - to) / r)));
}
const ramp = (x: number, delay: number) => smooth((x - delay) / Math.max(1e-6, 1 - delay));

/** #106: the body (pelvis and upper body, one block) turns half the quarter with the first foot, about the
 * pivot that brings the extremity on that side to its final place, then the other half about that
 * extremity with the second foot. Couple frame, quarter 0; the extremity lies on the couple's +x side for
 * both roles (his left, her right). */
function diagonalRoot(c: FootPoint, r0: FootPoint, extremity: number, a1: number, a2: number): FootPoint {
  const half = QUARTER / 2;
  const h0 = { x: r0.x + extremity, z: r0.z }, h1 = about(c, h0, QUARTER);
  // Pivot P of the half rotation R sending h0 to h1: (I − R)·P = h1 − R·h0.
  const co = Math.cos(half), si = Math.sin(half), rh = rotate(h0, half);
  const bx = h1.x - rh.x, bz = h1.z - rh.z;
  const m = [[1 - co, -si], [si, 1 - co]], det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  const pivot = { x: (bx * m[1][1] - m[0][1] * bz) / det, z: (m[0][0] * bz - m[1][0] * bx) / det };
  const diagonal = about(pivot, r0, half);
  return a2 > 0 ? about(h1, diagonal, half * a2) : about(pivot, r0, half * a1);
}

export function sampleQuartsPaire(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0, shapes: QuartsShapes = QUARTS_SHAPES) {
  const b = Number.isFinite(beat) ? beat : 0;
  const o = placementOffset(placement);
  const couple = quartsCouple(rest, o, stance);
  const c = couple.centre;
  // Leader: G first (upper body follows), then D (lower body). Follower: D first, then G.
  const order: [FigureFoot, FigureFoot] = follower ? ["R", "L"] : ["L", "R"];
  const between = QUART_PROTO.v.turn === "entreLesPas";
  const span = quartBeats(), cycle = 4 * span;
  const role = (shapes !== QUARTS_SHAPES ? shapes : span === 2 ? QUART_TWO.shapes : between ? QUART_BETWEEN_SHAPES : shapes)[follower ? "follower" : "leader"];
  const step = (time: number) => {
    const p = ((time % cycle) + cycle) % cycle;
    const quarter = Math.min(3, Math.floor(p / span));
    const q = p - quarter * span;
    const base = quarter * QUARTER;
    const feet = order.map((side, k) => {
      const shape = role[k];
      const raw = Math.max(0, Math.min(1, (q - shape.start) / (shape.end - shape.start)));
      return { side, shape, raw, arc: ramp(raw, shape.arcDelay), flying: raw > 0 && raw < 1 };
    });
    return { quarter, q, base, feet };
  };
  // Feet land on the beat for both dancers: from the interleaved quinconce the leader's G can only
  // take the place the follower's D leaves (#82: they leave together, #88: she never anticipates).
  const now = step(b);
  const { base } = now;
  const start = follower ? couple.follower : couple.leader;
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  const angle = { L: base, R: base } as Record<FigureFoot, number>;
  const [one, two] = now.feet;
  const rawAt = (shape: QuartsStepShape, t: number) => Math.max(0, Math.min(1, (t - shape.start) / (shape.end - shape.start)));
  // #106, #208: how much of each half of the quarter the block (pelvis and chest) has turned at time t of the quarter.
  const turnAt = (t: number): [number, number] => {
    const v = QUART_PROTO.v;
    if (v.turn === "apres") return [ease5((t - role[0].start) / (role[0].end + QUART_AFTER - role[0].start)), ease5(rawAt(role[1], t))];
    if (v.turn === "diagonale") return [ease5(rawAt(role[0], t)), ease5(rawAt(role[1], t))];
    if (v.turn === "progressif" || v.turn === "entreLesPas") {
      // One curve for the whole quarter, its first half then its second (the diagonal root keeps its two halves).
      const from = v.turn === "progressif" ? role[0].start : span === 2 ? QUART_TWO.turnFrom : role[0].end, p = 2 * ease5((t - from) / (role[1].end - from));
      return [Math.min(1, p), Math.max(0, p - 1)];
    }
    return [ramp(rawAt(role[0], t), Math.max(QUARTS_BODY.delay, role[0].arcDelay)), ramp(rawAt(role[1], t), role[1].arcDelay)];
  };
  const [a1, a2] = turnAt(now.q);
  // #208 (`entreLesPas`): the pelvis goes over the first foot as the weight moves onto it, its yaw waiting for the
  // landing: the place of the block follows the steps round C, only its turn is delayed (a pelvis left behind the
  // virgula pushed the trailing knee into the partner's). The #106 diagonal (the extremity in place at the first
  // landing) belongs to a block that turns with the first step: it is not followed.
  const p1 = between ? ease5(rawAt(role[0], now.q)) : a1;
  for (const [index, { side, shape, raw, arc }] of now.feet.entries()) {
    angle[side] = base + QUARTER * arc;
    let point = about(c, start[side], angle[side]);
    const k = 1 + shape.bulge * Math.sin(Math.PI * arc);
    point = { x: c.x + (point.x - c.x) * k, z: c.z + (point.z - c.z) * k };
    let own = follower ? toFollower(point) : point;
    const peak = Math.max(1e-6, Math.min(0.999, shape.bumpPeak));
    const away = raw <= 0 || raw >= 1 ? 0 : raw < peak ? smooth(raw / peak) : 1 - smooth((raw - peak) / (1 - peak));
    // The bump is given in the dancer's frame at the start of the quarter.
    const bump = rotate(shape.bump, base);
    own = { x: own.x + bump.x * away, z: own.z + bump.z * away };
    // #49: the foot rolls (heel rise, swing, landing) along its calibrated arc; the arc's timing is kept.
    const startPoint = about(c, start[side], base), endPoint = about(c, start[side], base + QUARTER);
    const travel = rotate({ x: endPoint.x - startPoint.x, z: endPoint.z - startPoint.z }, -base);
    // No roll around the crossing, where the interleaved knees leave no room for a heel rise.
    const roll = QUARTS_BODY.roll * (1 - crossingAt(now.q));
    // #208 (`entreLesPas`, 25 Nov.): the follower's D steps straight back, without turning, then pivots on its ball,
    // loaded, while the couple turns: it lands where that pivot brings its ankle to the quarter's place.
    const backStep = between && follower && index === 0 && !!QUART_PROTO.v.pivot;
    // #211 (`back`): her D straight back on « 1 », then the pivot on its ball while it carries her, then it closes on « 4 ».
    const recul = between && follower && index === 0 && QUART_PROTO.v.back !== undefined;
    let closing = 0;
    if (recul) {
      const from = toFollower(startPoint), to = toFollower(endPoint), behind = rotate({ x: 0, z: -QUART_PROTO.v.back! }, base);
      const spot = { x: from.x + behind.x, z: from.z + behind.z }, ball = rotate(QUART_BALL, base);
      const turned = QUARTER * (a1 + a2) / 2, onBall = rotate(QUART_BALL, base + turned);
      const pivoted = { x: spot.x + ball.x - onBall.x, z: spot.z + ball.z - onBall.z };
      const e = 1 - (1 - smooth(raw)) ** 3;
      closing = smooth((now.q - QUART_RECUL.close[0]) / (QUART_RECUL.close[1] - QUART_RECUL.close[0]));
      own = raw < 1 ? { x: mix(from.x, spot.x, e), z: mix(from.z, spot.z, e) } : { x: mix(pivoted.x, to.x, closing), z: mix(pivoted.z, to.z, closing) };
      // The straight way back, in the dancer's frame at the start of the quarter.
      travel.x = 0; travel.z = QUART_PROTO.v.back!;
    }
    let pivotYaw = 0, landing = own;
    if (backStep) {
      const from = toFollower(startPoint), to = toFollower(endPoint), ball = rotate(QUART_BALL, base + QUARTER);
      const on = { x: to.x + ball.x, z: to.z + ball.z }, back = rotate(QUART_BALL, base);
      landing = { x: on.x - back.x, z: on.z - back.z };
      // From her D's landing (#211: the block may have started turning just before).
      const atLanding = (turnAt(shape.end)[0] + turnAt(shape.end)[1]) / 2;
      pivotYaw = QUARTER * Math.max(0, ((a1 + a2) / 2 - atLanding) / (1 - atLanding));
      // She answers the virgula: most of her way back is done early in the step (smooth start and landing).
      const turnedBall = rotate(QUART_BALL, base + pivotYaw), e = 1 - (1 - smooth(raw)) ** (span === 2 ? QUART_TWO.backEase : 3);
      own = raw < 1 ? { x: mix(from.x, landing.x, e), z: mix(from.z, landing.z, e) } : { x: on.x - turnedBall.x, z: on.z - turnedBall.z };
      // The straight way back, in the dancer's frame at the start of the quarter.
      const way = rotate({ x: landing.x - from.x, z: landing.z - from.z }, -base);
      travel.x = -way.x; travel.z = -way.z;
    }
    const gait = gaitStep(raw, follower ? { x: -travel.x, z: -travel.z } : travel, 0, roll);
    // #106: the leader's trailing D rises on its ball once his G carries him (the pelvis then stays up
    // instead of dropping and pushing the front knee into the partner), until its own push-off.
    let { pitch, pivot } = gait;
    const heel = follower || index === 0 ? 0 : QUARTS_BODY.heel;
    if (heel > 0) {
      const push = GAIT.push * Math.max(0, Math.min(1, roll));
      const trail = heel * p1 * (raw <= 0 ? 1 : push > 0 && raw < push ? 1 - smooth(raw / push) : 0);
      if (trail > pitch) { pitch = trail; pivot = "ball"; }
    }
    const lift = raw > 0 && raw < 1 ? Math.max(gait.lift, GAIT.liftPeak * 0.35 * Math.sin(Math.PI * raw) ** 2)
      : closing > 0 && closing < 1 ? QUART_RECUL.lift * Math.sin(Math.PI * closing) ** 2 : 0;
    // The moving foot pivots once it has left its neighbours.
    feet[side] = { ...own, yaw: recul ? base + (raw < 1 ? 0 : QUARTER * (a1 + a2) / 2) : backStep ? base + (raw < 1 ? 0 : pivotYaw) : base + QUARTER * ramp(raw, Math.max(shape.yawDelay, shape.arcDelay)), lift,
      ...(recul && raw >= 1 ? { pitch: 0, pivot: undefined } : { pitch, pivot }) };
    // #211: his virgula lands a little more open and closes back on its heel (the heel stays where it landed).
    if (!follower && index === 0 && span === 2 && QUART_TWO.open) {
      const open = QUART_TWO.open * ramp(raw, Math.max(shape.yawDelay, shape.arcDelay))
        * (1 - smooth((now.q - QUART_TWO.close[0]) / (QUART_TWO.close[1] - QUART_TWO.close[0])));
      const left = QUART_HEEL_L, square = rotate(left, base + QUARTER), wide = rotate(left, base + QUARTER + open);
      feet[side] = { ...feet[side], x: feet[side].x + square.x - wide.x, z: feet[side].z + square.z - wide.z, yaw: feet[side].yaw + open };
    }
  }
  // Weight: on the second foot at the start of a quarter; it moves to each foot as that foot lands.
  const toFirst = smooth((one.raw - 0.5) / 0.5), toSecond = smooth((two.raw - 0.5) / 0.5);
  const onFirst = toFirst * (1 - toSecond);
  const loadR = order[0] === "R" ? onFirst : 1 - onFirst;
  // #106 (owner, 20 Nov.: « le bassin et l'épaule (avec tout le haut du corps) bougent en même temps que le
  // pied […] l'extrémité est déjà en position finale et le reste est en position intermédiaire "diago"
  // jusqu'à ramener l'autre pied »): pelvis and upper body turn with the feet, the diagonal when the first
  // foot lands, the quarter when the second does.
  const bodyYaw = base + (QUARTER / 2) * (a1 + a2);
  // #126 (owner: « le buste peut avoir un léger retard sur le pied : le temps de transfert »): the chest
  // follows the pelvis `chestLag` beats later.
  // #211: in two beats the previous quarter is still turning at its end, so the chest looks back into it.
  const back = now.q - (span === 2 ? QUART_TWO.chestLag : QUARTS_BODY.chestLag), lagged = back < 0 ? turnAt(back + span) : turnAt(back);
  const chestYaw = (QUARTER / 2) * (lagged[0] + lagged[1] - (back < 0 ? 2 : 0) - a1 - a2);
  // #208 (`entreLesPas`): the place of the pelvis goes round C with the feet, `QUART_LEAD` of an eighth with the first
  // step, the rest with the second (following the yaw instead crossed the legs; staying in place, the trailing knee).
  let rootPoint: FootPoint;
  if (between && follower && QUART_PROTO.v.back !== undefined) {
    // #211 (`back`): straight back over her D on « 1 » (couple frame: her back is +z), there while it carries her and
    // pivots, then to the quarter's place with her G; the place goes round C only once the couple turns.
    // Blended with the retained path (`QUART_ROOT`), which it joins once her G carries her.
    const [rise, stay, gone] = QUART_RECUL.stay;
    const over = ease5((now.q - 0.35) / (rise - 0.35)) * (1 - ease5((now.q - stay) / (gone - stay)));
    const kept = about(c, start.root, QUARTER * quartRootShare(now.q)), back = { x: start.root.x, z: start.root.z + QUART_RECUL.pelvis * QUART_PROTO.v.back! };
    rootPoint = about(c, { x: mix(kept.x, back.x, over), z: mix(kept.z, back.z, over) }, base);
  } else if (between) {
    const placed = quartRootShare(now.q);
    rootPoint = about(c, about(c, start.root, QUARTER * placed), base);
  } else {
    const rigid = about(c, start.root, (QUARTER / 2) * (a1 + a2)), diagonal = diagonalRoot(c, start.root, QUARTS_BODY.extremity, a1, a2);
    const travel = QUARTS_BODY.travel[follower ? "follower" : "leader"];
    rootPoint = about(c, { x: mix(rigid.x, diagonal.x, travel), z: mix(rigid.z, diagonal.z, travel) }, base);
  }
  const root = follower ? toFollower(rootPoint) : rootPoint;
  // #82 (« le leader engage le buste avec son pied gauche ») holds: his chest turns with his G, which
  // leaves with her D (#88: she never anticipates); the chest turns with the pelvis (#106).
  const crossing = crossingAt(now.q);
  // The quarters follow one another (cyclic): the room is the same, closed, at the end of one and at the
  // start of the next.
  const room = span === 2 ? QUART_TWO.ginga : QUARTS_GINGA;
  const ending = smooth((now.q - room.from[0]) / (room.from[1] - room.from[0]))
    * (1 - smooth((now.q - room.until[0]) / (room.until[1] - room.until[0])));
  const moving = two.flying || two.raw >= 1 ? order[1] : order[0];
  const action = now.quarter * 2 + (now.q >= role[1].start ? 1 : 0);
  // #208: the leader's G goes forward with its knee turned to the left like its foot (the virgula); the knee comes
  // back over the pelvis as the block catches up with the foot.
  // The follower's D knee opens to her right (away from his virgula) while she steps back and pivots on it.
  const kneeOut = follower || !between ? 0 : Math.max(0, feet.L.yaw - bodyYaw);
  const herOut = follower && between && QUART_PROTO.v.pivot ? QUART_KNEE.follower * p1 * (1 - (a1 + a2) / 2) : 0;
  // #211 (`chestLead`): the figure turns the chests itself (`chestOwn`, over the root) instead of the plexus contact, which
  // swings them 30° by « 1 » as she steps back and he steps forward to his left. Each chest faces the partner as at the
  // start of the quarter (the quinconce's angle); at « 1 » his turns `chestLead` further towards the coming turn and hers
  // follows it; both come back over their pelvis as the block turns, the chest a little later (`chestLag`).
  const leadAt = (t: number) => (QUART_PROTO.v.chestLead ?? 0) * smooth((t - role[0].start) / (role[0].end - role[0].start))
    * (1 - (turnAt(t)[0] + turnAt(t)[1]) / 2);
  let chestOwn: number | undefined;
  if (between && QUART_PROTO.v.chestLead !== undefined) {
    const own = follower ? toFollower(couple.follower.root) : couple.leader.root, partner = follower ? toFollower(couple.leader.root) : couple.follower.root;
    chestOwn = Math.atan2(partner.x - own.x, partner.z - own.z) + chestYaw + leadAt(((now.q - (follower ? QUART_RECUL.lag : 0)) + span) % span);
  }
  return { beat: b, action, moving, feet, root, rootYaw: bodyYaw, chestYaw, ...(chestOwn !== undefined ? { chestOwn } : {}),
    ...(kneeOut > 0 ? { kneeYawSide: { L: -QUART_KNEE.left * kneeOut, R: QUART_KNEE.right * kneeOut / QUARTER } } : {}),
    ...(herOut > 0 ? { kneeYawSide: { L: 0, R: herOut } } : {}), loadR, loadL: 1 - loadR,
    coupling: QUARTS_BODY.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05), cyclic: true, kneeCap: mix(QUARTS_BODY.kneeCap, QUARTS_BODY.crossing.kneeCap, crossing), sway: QUARTS_BODY.sway,
    rotationCap: mix(QUARTS_BODY.rotationCap, QUARTS_BODY.crossing.rotationCap, crossing),
    dip: mix(QUARTS_BODY.dip, 0, crossing),
    // #163: back to the cap over the end of the quarter, whatever the figure that follows.
    gingaCap: QUARTS_GINGA.cap, gingaCapRoom: { sway: ending, bounce: ending },
    };
}
