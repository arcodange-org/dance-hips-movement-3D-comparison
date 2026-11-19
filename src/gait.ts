/** Walking step of a figure foot (#49, docs/spec-marche-naturelle.md): the foot rolls instead of
 * gliding flat. Pure: given the share of the flight and the step's travel, it returns where along the
 * figure's path the foot is, how high it is lifted, its pitch and the sole point it pivots on.
 * Pitch convention (as the foot's extra rotation about its local x axis): positive = toes down /
 * heel up, negative = toes up. */
export type GaitPivot = "ball" | "heel" | null;
export interface GaitPose { progress: number; lift: number; pitch: number; pivot: GaitPivot }

/** Proposals to validate by eye (owner): shares of the flight and angles in radians. */
export const GAIT = {
  /** End of the push-off (heel rising on the ball) and start of the landing, as shares of the flight. */
  push: 0.18, land: 0.78,
  /** Heel rise at push-off, toes up at a forward heel strike, toes down at a backward landing. */
  heelUp: 0.35, toeUp: 0.22, backLand: 0.25,
  /** Swing height of the ankle above its rolled position (m). */
  liftPeak: 0.06,
  /** Step length (m) from which the roll is complete; shorter steps roll proportionally less. */
  fullStep: 0.25,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * @param flight share of the step's flight window, 0 → 1
 * @param travel the step's displacement in the dancer's frame (+z forward, +x left)
 * @param footYaw the foot's yaw in the dancer's frame (0 = pointing forward)
 * @param roll share of the roll (heel rise and landing angles), e.g. smaller to uncross the legs
 */
export function gaitStep(flight: number, travel: { x: number; z: number }, footYaw = 0, roll = 1): GaitPose {
  const t = clamp01(Number.isFinite(flight) ? flight : 0);
  const distance = Math.hypot(travel.x, travel.z);
  const amount = clamp01(distance / GAIT.fullStep) * clamp01(roll);
  // Component of the travel along the foot's own axis: > 0 forward step, < 0 backward step.
  const along = distance > 1e-6 ? (travel.x * Math.sin(footYaw) + travel.z * Math.cos(footYaw)) / distance : 0;
  const forward = along > 0.3;
  // A reduced roll also shortens the push-off and the landing: the foot leaves at once.
  const share = clamp01(roll);
  const push = GAIT.push * share, land = 1 - (1 - GAIT.land) * share;
  const progress = clamp01((t - push) / (land - push));
  if (t <= 0 || t >= 1) return { progress: t >= 1 ? 1 : 0, lift: 0, pitch: 0, pivot: null };
  const heelUp = GAIT.heelUp * amount;
  const landingPitch = (forward ? -GAIT.toeUp : GAIT.backLand) * amount;
  if (t < push && push > 0) {
    // Push-off: the heel rises while the ball of the foot stays on the floor.
    return { progress: 0, lift: 0, pitch: heelUp * smooth(t / push), pivot: "ball" };
  }
  if (t < land || land >= 1) {
    // Swing: the foot leaves the floor (peak a little before mid-swing) and turns towards its landing.
    const s = (t - push) / (land - push);
    const lift = GAIT.liftPeak * mix(0.35, 1, amount) * Math.sin(Math.PI * Math.pow(s, 0.85));
    return { progress, lift, pitch: mix(heelUp, landingPitch, smooth(s)), pivot: null };
  }
  // Landing: heel strike then roll to flat (forward), or ball then heel (backward, sideways).
  const u = (t - land) / (1 - land);
  return { progress: 1, lift: 0, pitch: landingPitch * (1 - smooth(u)), pivot: forward ? "heel" : "ball" };
}
