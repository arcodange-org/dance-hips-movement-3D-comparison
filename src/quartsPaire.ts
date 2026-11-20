/** Quarter turns in pair, around the leader (#37, docs/spec-quarts-paire.md).
 * GLB coordinates: left +x, forward +z. The couple frame is the leader's outer frame; the
 * follower's outer frame is translated by 2·QUARTS_PAIR_DZ along +z and turned by π. */
import { gaitStep, GAIT } from "./gait";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

export const QUARTS_BEATS = 16;
/** Same half-spacing as the five-action figures: the couple placements are calibrated for it. */
export const QUARTS_PAIR_DZ = 0.20;
/** The leader anticipates each step by a quarter beat, filling the follower's response delay. */
export const QUARTS_LEAD = 0.25;
/** Owner rule (phase 14): the left heel comes to the tip of the right foot, at a right angle.
 * Ankle offset from the right ankle: the heel lies 5.6 cm behind the ankle, the toe 15.6 cm ahead. */
export const QUARTS_HEEL_AT_TOE: FootPoint = { x: 0.056, z: 0.20 };
const QUARTER = Math.PI / 2;

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
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
  const target = { x: own.R.x + QUARTS_HEEL_AT_TOE.x, z: own.R.z + QUARTS_HEEL_AT_TOE.z };
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
    { ...still, start: 1.8, end: 2.9, arcDelay: 0.3, bulge: 0.4, yawDelay: 0.5 },
  ],
  follower: [
    { ...still, start: 0.4, end: 1.0, bump: { x: 0, z: -0.32 }, bumpPeak: 0.5, arcDelay: 0.3 },
    { ...still, start: 1.45, end: 3.0, bump: { x: 0, z: -0.18 }, bumpPeak: 0.2, arcDelay: 0.1, bulge: 0.35 },
  ],
};
/** Pelvis and style during the pair quarter turns (calibrated, docs/spec-quarts-paire.md):
 * - each pelvis turns around the centre with its second foot (the leader's D, the follower's G), so a
 *   standing leg is never laid across the partner's landing foot;
 * - `coupling`: the follower's pelvis mirrors the leader's (hips that seek each other);
 * - `sway`: share of the style's pelvis sway kept while the couple turns interleaved;
 * - knee flexion cap, style pelvis rotation cap and style bounce, softened around the `crossing`
 *   (both pairs of thighs interleaved while the leader's G lands next to the follower's standing G). */
export const QUARTS_BODY = {
  coupling: 1, sway: 0.5, kneeCap: 0.3, rotationCap: 0.12, dip: -0.008, roll: 0.5,
  crossing: { from: 0.6, to: 1.6, ramp: 0.3, kneeCap: 0.12, rotationCap: 0.04 },
};
function crossingAt(q: number): number {
  const { from, to, ramp: r } = QUARTS_BODY.crossing;
  return Math.max(0, Math.min(smooth((q - from + r) / r), 1 - smooth((q - to) / r)));
}
const ramp = (x: number, delay: number) => smooth((x - delay) / Math.max(1e-6, 1 - delay));

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
  // take the place the follower's D leaves. The leader anticipates with his upper body and frame
  // (QUARTS_LEAD ahead); the follower's upper body answers on the beat, a quarter beat later.
  const now = step(b);
  const { base } = now;
  const start = follower ? couple.follower : couple.leader;
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  const angle = { L: base, R: base } as Record<FigureFoot, number>;
  for (const { side, shape, raw, arc } of now.feet) {
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
    const gait = gaitStep(raw, follower ? { x: -travel.x, z: -travel.z } : travel, 0, QUARTS_BODY.roll * (1 - crossingAt(now.q)));
    const lift = raw > 0 && raw < 1 ? Math.max(gait.lift, GAIT.liftPeak * 0.35 * Math.sin(Math.PI * raw) ** 2) : 0;
    // The moving foot pivots once it has left its neighbours.
    feet[side] = { ...own, yaw: base + QUARTER * ramp(raw, Math.max(shape.yawDelay, shape.arcDelay)), lift,
      pitch: gait.pitch, pivot: gait.pivot };
  }
  // Weight: on the second foot at the start of a quarter; it moves to each foot as that foot lands.
  const [one, two] = now.feet;
  const toFirst = smooth((one.raw - 0.5) / 0.5), toSecond = smooth((two.raw - 0.5) / 0.5);
  const onFirst = toFirst * (1 - toSecond);
  const loadR = order[0] === "R" ? onFirst : 1 - onFirst;
  const rootAngle = base + QUARTER * two.arc;
  const rootPoint = about(c, start.root, rootAngle);
  const root = follower ? toFollower(rootPoint) : rootPoint;
  // #82 (owner, 20 Nov.: « le leader engage le buste avec son pied gauche »): upper bodies share one
  // intention curve, the leader's first step (his G). His chest turns with his G; the follower's
  // answers QUARTS_LEAD later (he leads, she does not anticipate).
  const intention = (time: number) => {
    const p = ((time % QUARTS_BEATS) + QUARTS_BEATS) % QUARTS_BEATS;
    const quarter = Math.min(3, Math.floor(p / 4)), shape = shapes.leader[0];
    const raw = Math.max(0, Math.min(1, (p - quarter * 4 - shape.start) / (shape.end - shape.start)));
    return quarter * QUARTER + QUARTER * ramp(raw, shape.arcDelay);
  };
  const upper = intention(follower ? b - QUARTS_LEAD : b);
  const crossing = crossingAt(now.q);
  const lower = angle[order[1]];
  const moving = two.flying || two.raw >= 1 ? order[1] : order[0];
  const action = now.quarter * 2 + (now.q >= role[1].start ? 1 : 0);
  return { beat: b, action, moving, feet, root, rootYaw: lower,
    chestYaw: Math.atan2(Math.sin(upper - lower), Math.cos(upper - lower)), loadR, loadL: 1 - loadR,
    coupling: QUARTS_BODY.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05), cyclic: true, kneeCap: mix(QUARTS_BODY.kneeCap, QUARTS_BODY.crossing.kneeCap, crossing), sway: QUARTS_BODY.sway,
    rotationCap: mix(QUARTS_BODY.rotationCap, QUARTS_BODY.crossing.rotationCap, crossing),
    dip: mix(QUARTS_BODY.dip, 0, crossing) };
}
