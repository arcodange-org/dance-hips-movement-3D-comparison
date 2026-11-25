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
export interface QuartVirgula { beyond: number; beside?: number; turn: "aujourdhui" | "diagonale" | "apres" | "progressif" | "entreLesPas" }
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
 * (the follower steps back), the block turning from its landing to the second's (`entreLesPas`, working hypothesis
 * until the owner confirms it). Tuned on the GLB without any leg-bone crossing (scripts/sonde_croisements_couple.mjs):
 * `beside` (m), the virgula lands that much further to his left, clear of the follower's standing G. */
export const QUART_ELECTED: QuartVirgula = { beyond: 0.19, beside: 0.034, turn: "entreLesPas" };
/** #208 (`entreLesPas`): the leader's G knee points where its foot does (the virgula turned out to the left, the
 * pelvis not yet turned); his trailing D knee opens `right` rad outwards meanwhile, in proportion. */
export const QUART_KNEE = { left: 1, right: 0.3 };
export const QUART_PROTO: { v: QuartVirgula } = { v: QUART_ELECTED };
export const setQuartProto = (name: string | null | undefined) => { QUART_PROTO.v = (name && QUART_CANDIDATES[name]) || QUART_ELECTED; };
/** Quintic ease: zero speed and zero acceleration at both ends. */
const ease5 = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * t * (10 - 15 * t + 6 * t * t); };
const QUARTER = Math.PI / 2;

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
  const { from, to, ramp: r } = QUARTS_BODY.crossing;
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
  const role = shapes[follower ? "follower" : "leader"];
  const step = (time: number) => {
    const p = ((time % QUARTS_BEATS) + QUARTS_BEATS) % QUARTS_BEATS;
    const quarter = Math.min(3, Math.floor(p / 4));
    const q = p - quarter * 4;
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
      const from = v.turn === "progressif" ? role[0].start : role[0].end, p = 2 * ease5((t - from) / (role[1].end - from));
      return [Math.min(1, p), Math.max(0, p - 1)];
    }
    return [ramp(rawAt(role[0], t), Math.max(QUARTS_BODY.delay, role[0].arcDelay)), ramp(rawAt(role[1], t), role[1].arcDelay)];
  };
  const [a1, a2] = turnAt(now.q);
  // #208 (`entreLesPas`): the pelvis goes over the first foot as the weight moves onto it, its yaw waiting for the
  // landing: the place of the block follows the steps, only its turn is delayed (a pelvis left behind the virgula
  // pushed the trailing knee into the partner's). It follows the rigid quarter about C: the #106 diagonal (the
  // extremity in place at the first landing) belongs to a block that turns with the first step.
  const between = QUART_PROTO.v.turn === "entreLesPas";
  const [p1, p2]: [number, number] = between ? [ease5(rawAt(role[0], now.q)), ease5(rawAt(role[1], now.q))] : [a1, a2];
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
    const lift = raw > 0 && raw < 1 ? Math.max(gait.lift, GAIT.liftPeak * 0.35 * Math.sin(Math.PI * raw) ** 2) : 0;
    // The moving foot pivots once it has left its neighbours.
    feet[side] = { ...own, yaw: base + QUARTER * ramp(raw, Math.max(shape.yawDelay, shape.arcDelay)), lift,
      pitch, pivot };
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
  const lagged = turnAt(now.q - QUARTS_BODY.chestLag);
  const chestYaw = (QUARTER / 2) * (lagged[0] + lagged[1] - a1 - a2);
  const rigid = about(c, start.root, (QUARTER / 2) * (p1 + p2)), diagonal = diagonalRoot(c, start.root, QUARTS_BODY.extremity, p1, p2);
  const travel = between ? 0 : QUARTS_BODY.travel[follower ? "follower" : "leader"];
  const rootPoint = about(c, { x: mix(rigid.x, diagonal.x, travel), z: mix(rigid.z, diagonal.z, travel) }, base);
  const root = follower ? toFollower(rootPoint) : rootPoint;
  // #82 (« le leader engage le buste avec son pied gauche ») holds: his chest turns with his G, which
  // leaves with her D (#88: she never anticipates); the chest turns with the pelvis (#106).
  const crossing = crossingAt(now.q);
  // The quarters follow one another (cyclic): the room is the same, closed, at the end of one and at the
  // start of the next.
  const ending = smooth((now.q - QUARTS_GINGA.from[0]) / (QUARTS_GINGA.from[1] - QUARTS_GINGA.from[0]))
    * (1 - smooth((now.q - QUARTS_GINGA.until[0]) / (QUARTS_GINGA.until[1] - QUARTS_GINGA.until[0])));
  const moving = two.flying || two.raw >= 1 ? order[1] : order[0];
  const action = now.quarter * 2 + (now.q >= role[1].start ? 1 : 0);
  // #208: the leader's G goes forward with its knee turned to the left like its foot (the virgula); the knee comes
  // back over the pelvis as the block catches up with the foot.
  const kneeOut = follower || !between ? 0 : Math.max(0, feet.L.yaw - bodyYaw);
  return { beat: b, action, moving, feet, root, rootYaw: bodyYaw, chestYaw,
    ...(kneeOut > 0 ? { kneeYawSide: { L: -QUART_KNEE.left * kneeOut, R: QUART_KNEE.right * kneeOut / QUARTER } } : {}), loadR, loadL: 1 - loadR,
    coupling: QUARTS_BODY.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05), cyclic: true, kneeCap: mix(QUARTS_BODY.kneeCap, QUARTS_BODY.crossing.kneeCap, crossing), sway: QUARTS_BODY.sway,
    rotationCap: mix(QUARTS_BODY.rotationCap, QUARTS_BODY.crossing.rotationCap, crossing),
    dip: mix(QUARTS_BODY.dip, 0, crossing),
    // #163: back to the cap over the end of the quarter, whatever the figure that follows.
    gingaCap: QUARTS_GINGA.cap, gingaCapRoom: { sway: ending, bounce: ending } };
}
