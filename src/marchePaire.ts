/** Walking forward and backward in pair (#89, docs/spec-jeu-fleches.md), led by the game mode's arrows.
 * The leader steps PG then PD (forward or backward), the follower takes the symmetric steps (opposite
 * foot, opposite direction, same lane and length: R22); the second step closes beside the first, so the
 * couple ends in the neutral quinconce translated by one step. The double (↑ ↑) takes PG + PD in one
 * beat, then the leader's marka of the PG (touch without weight: the weight stays on PD, the PG is free
 * again); the follower holds.
 * GLB coordinates: left +x, forward +z, in the dancer's own outer frame (as src/idaPaire.ts). */
import { gaitStep } from "./gait";
import { idaNeutral, IDA_PAIR, IDA_PAIR_DZ, IDA_PAIR_SYNC } from "./idaPaire";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

export type MarcheKind = "avance" | "recule" | "double";
/** Same spacing as the other pair figures (the game mode composes them). */
export const MARCHE_PAIR_DZ = IDA_PAIR_DZ;
export const MARCHE_BEATS = 2;

/** Proposals to validate by eye (owner), calibrated on the GLB:
 * - `step`: step length (the ida e volta's, about one foot length);
 * - walking steps (one per beat): flight from `leave` to `land`, weight onto the landed foot until the
 *   next beat (`land` → 1: the weight arrives on the beat, #62);
 * - `lag`: her backward foot leaves this much after his forward foot (it lands first);
 * - `delay`: when the leader steps back, the follower's forward foot leaves this much later (R24: she is
 *   never ahead); when the follower steps back her foot leaves with his and lands `backFlight` after
 *   leaving (IDA_PAIR_SYNC), clearing the lane first;
 * - double: two half-beat steps (`doubleLeave`, `doubleLand` within each half beat), then the marka
 *   (`markaFrom` → `markaTo`, touch `markaTap` m in the walking direction — 0, in place: forward, his
 *   thigh meets hers —, lifted `markaLift`);
 * - `carry`: share of the weighted foot's position the pelvis follows (the rest follows the feet's mean). */
export const MARCHE_PAIR = {
  step: IDA_PAIR.step, leave: 0.1, land: 0.8, delay: 0.15, lag: 0.03, backFlight: IDA_PAIR_SYNC.backFlight * 0.8,
  doubleLeave: 0.05, doubleLand: 0.4, markaFrom: 1.1, markaTo: 1.9, markaTap: 0, markaLift: 0.022,
  carry: 0.5, forwardRoll: IDA_PAIR.forwardRoll, backRoll: IDA_PAIR.backRoll, aside: IDA_PAIR.aside,
};

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const other = (s: FigureFoot): FigureFoot => (s === "L" ? "R" : "L");

interface Window { leave: number; land: number; weightFrom: number; weightEnd: number }
/** Flight and weight windows of step `index` (0: leader PG / follower PD, 1: the other foot). */
function stepWindow(kind: MarcheKind, index: number, follower: boolean): Window {
  const m = MARCHE_PAIR;
  // The follower steps back when the leader walks forward (and in the double, which walks forward).
  const followerBack = kind !== "recule";
  // Both weights move together, from the leader's landing to the beat (mirrored loads); her backward
  // foot leaves a little after his (the shorter flight would otherwise leave the floor first, R24) and
  // lands first.
  if (kind === "double") {
    const t0 = index * 0.5, span = 0.5;
    const leave = t0 + m.doubleLeave * span * 2, land = t0 + m.doubleLand * span * 2;
    if (follower && followerBack) return { leave: leave + m.lag, land: leave + m.lag + (land - leave) * 0.7, weightFrom: land, weightEnd: t0 + span };
    return { leave, land, weightFrom: land, weightEnd: t0 + span };
  }
  const t0 = index;
  if (followerBack) return follower
    ? { leave: t0 + m.leave + m.lag, land: t0 + m.leave + m.lag + m.backFlight, weightFrom: t0 + m.land, weightEnd: t0 + 1 }
    : { leave: t0 + m.leave, land: t0 + m.land, weightFrom: t0 + m.land, weightEnd: t0 + 1 };
  return { leave: t0 + m.leave + (follower ? m.delay : 0), land: t0 + m.land, weightFrom: t0 + m.land, weightEnd: t0 + 1 };
}

export function sampleMarchePaire(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0, kind: MarcheKind = "avance") {
  const b = Math.max(0, Math.min(MARCHE_BEATS, Number.isFinite(beat) ? beat : 0));
  const o = placementOffset(placement);
  const neutral = idaNeutral(rest, o, stance);
  const m = MARCHE_PAIR;
  // Leader forward (+1) or backward (−1); the follower mirrors (her own frame faces his).
  const way = kind === "recule" ? -1 : 1;
  const dir = (follower ? -1 : 1) * way;
  const first: FigureFoot = follower ? "R" : "L", second = other(first);
  const order: FigureFoot[] = [first, second];
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  const moved: Record<FigureFoot, number> = { L: 0, R: 0 };
  let loadFirst = 0; // share of the weight on the first foot (it starts on the second one)
  let action = 0;
  order.forEach((side, index) => {
    const w = stepWindow(kind, index, follower);
    const raw = Math.max(0, Math.min(1, (b - w.leave) / (w.land - w.leave)));
    const ahead = dir > 0;
    const gait = gaitStep(raw, { x: 0, z: dir * m.step }, 0, ahead ? m.forwardRoll : m.backRoll);
    const n = neutral[side];
    // A moving left foot opens a little to its left (outer lane in quinconce), as in the ida e volta.
    const open = side === "L" && raw > 0 && raw < 1 ? m.aside * smooth(raw / 0.25) * (1 - smooth((raw - 0.75) / 0.25)) : 0;
    moved[side] = dir * m.step * gait.progress;
    feet[side] = { x: n.x + open, z: n.z + moved[side], yaw: 0, lift: gait.lift, pitch: gait.pitch, pivot: gait.pivot };
    const onto = smooth((b - w.weightFrom) / (w.weightEnd - w.weightFrom));
    if (index === 0) loadFirst = onto;
    else loadFirst *= 1 - onto;
    if (b >= w.leave) action = index;
  });
  // Double: the leader's marka of his PG, a touch in place without weight (his weight stays on PD, his PG
  // is free to start again). The follower holds: her mirrored marka would bring both lifted knees together
  // (femurs crossing at the marka's peak, measured on the GLB).
  if (kind === "double" && !follower && b > m.markaFrom && b < m.markaTo) {
    const t = (b - m.markaFrom) / (m.markaTo - m.markaFrom), swing = Math.sin(Math.PI * t) ** 2;
    feet[first] = { ...feet[first], z: feet[first].z + dir * m.markaTap * swing, lift: m.markaLift * swing };
    action = 2;
  }
  const loadR = first === "R" ? loadFirst : 1 - loadFirst;
  // The pelvis travels with the weight and the feet: one step forward (or back) at the end.
  const weighted = moved[first] * loadFirst + moved[second] * (1 - loadFirst);
  const mean = (moved.L + moved.R) / 2;
  const root = { x: neutral.root.x, z: neutral.root.z + m.carry * weighted + (1 - m.carry) * mean };
  const moving: FigureFoot = order[Math.min(1, action)];
  return { beat: b, action, moving, feet, root, rootYaw: 0, chestYaw: 0,
    loadR, loadL: 1 - loadR, support: (loadR >= 0.5 ? "R" : "L") as FigureFoot, transfer: null,
    coupling: IDA_PAIR.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05),
    kneeCap: IDA_PAIR.kneeCap, rotationCap: IDA_PAIR.rotationCap, dip: IDA_PAIR.dip, sway: IDA_PAIR.sway };
}
