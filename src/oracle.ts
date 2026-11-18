/** Reference geometry for the current model, independent of the motion helpers in styles.ts.
 * Coordinates belong to the rig's outer frame, never its animated root/pelvis frame.
 * See docs/spec-oracle-corrections.md. This is not a mocap or universal dance standard. */
export interface FootPose { x: number; z: number; yaw: number }
export type Feet = { L: FootPose; R: FootPose };
export interface Pose {
  footL: FootPose; footR: FootPose;
  targets: Feet; // destination of this step, distinct from its evaluated feet
  rootLocalYaw: number;
  chestLocalYaw: number; // nominal local yaw after isolation, not a world orientation
  nominalRootX: number; nominalRootZ: number; // before style translation and IK projection
}
export type OracleMovement = "quarts" | "ida";
export type OracleSide = "leader" | "follower";
export type LegacySortie = "sortieG" | "sortieF" | "sortieGF";
const restFeet = (): Feet => ({ L: { x: .084, z: .09, yaw: 0 }, R: { x: -.084, z: .09, yaw: 0 } });
const phase = (beat: number, period: number) => ((beat % period) + period) % period;
const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const interpolate = (a: FootPose, b: FootPose, t: number): FootPose => ({
  x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: a.yaw + angleDelta(a.yaw, b.yaw) * t,
});
function finiteBeat(b: number) {
  if (!Number.isFinite(b)) throw new RangeError("oracle beat must be finite");
}
function validateRest(rest: Feet) {
  for (const side of ["L", "R"] as const) for (const key of ["x", "z", "yaw"] as const)
    if (!Number.isFinite(rest[side][key])) throw new RangeError("oracle rest must be finite");
}
function pose(feet: Feet, targets: Feet, rootLocalYaw: number, chestLocalYaw: number,
  nominalRootX = 0, nominalRootZ = 0): Pose {
  return { footL: { ...feet.L }, footR: { ...feet.R }, targets: { L: { ...targets.L }, R: { ...targets.R } },
    rootLocalYaw, chestLocalYaw, nominalRootX, nominalRootZ };
}

// Alternating pivot/closing landings, in metres and quarter turns. A complete square
// returns both anatomical feet to their initial locations. These reference coordinates
// deliberately do not import the production QH/QF/QTOE or quartTurnStep.
const QUART_LANDINGS: ["L" | "R", number, number, number][] = [
  ["L", -.084, .200, 1], ["R", -.084, .368, 1],
  ["L", .026, .368, 2], ["R", .194, .368, 2],
  ["L", .194, .258, 3], ["R", .194, .090, 3],
  ["L", .084, .090, 4], ["R", -.084, .090, 4],
];
function mirrorQuarts(feet: Feet): Feet {
  return { L: { x: feet.R.x, z: -feet.R.z, yaw: -feet.R.yaw },
    R: { x: feet.L.x, z: -feet.L.z, yaw: -feet.L.yaw } };
}
function quartsPose(b: number, reverse: boolean): Pose {
  const p = phase(b, 16), step = Math.floor(p / 2), within = p - step * 2;
  const feet = restFeet();
  for (let i = 0; i < step; i++) {
    const [side, x, z, turns] = QUART_LANDINGS[i];
    feet[side] = { x, z, yaw: turns * Math.PI / 2 };
  }
  const targets = { L: { ...feet.L }, R: { ...feet.R } };
  const [side, x, z, turns] = QUART_LANDINGS[step];
  targets[side] = { x, z, yaw: turns * Math.PI / 2 };
  feet[side] = interpolate(feet[side], targets[side], smooth(within / 1.2));
  const quarter = Math.floor(step / 2), baseYaw = quarter * Math.PI / 2;
  const lower = baseYaw + (step % 2 ? within / 2 * Math.PI / 2 : 0);
  const upper = baseYaw + (step % 2 ? Math.PI / 2 : within / 2 * Math.PI / 2);
  const evaluated = reverse ? mirrorQuarts(feet) : feet;
  return pose(evaluated, reverse ? mirrorQuarts(targets) : targets,
    reverse ? -lower : lower, (reverse ? -1 : 1) * (upper - lower),
    (evaluated.L.x + evaluated.R.x) / 2, (evaluated.L.z + evaluated.R.z) / 2 - (reverse ? -.09 : .09));
}
function idaPose(b: number, rest: Feet): Pose {
  const p = phase(b, 8), step = Math.floor(p / 2), within = p - step * 2;
  const side = step < 2 ? "L" : "R";
  const feet: Feet = { L: { ...rest.L, z: rest.L.z - .09 }, R: { ...rest.R, z: rest.R.z - .09 } };
  // The first action of either foot starts from its backward landing; the second
  // starts from its forward landing. The other foot stays at its last backward stop.
  if (step % 2) feet[side].z = rest[side].z + .09;
  const targets = { L: { ...feet.L }, R: { ...feet.R } };
  targets[side].z = rest[side].z + (step % 2 ? -.09 : .09);
  feet[side] = interpolate(feet[side], targets[side], smooth(within / 1.2));
  const bell = (side === "L" ? 1 : -1) * Math.sin(Math.PI * within / 2);
  return pose(feet, targets, .08 * bell, -.18 * bell);
}

/** Evaluated continuous plan. Reverse is supported only for quarts, as in the renderer. */
export function oraclePose(movement: OracleMovement, b: number, reverse = false, rest: Feet = restFeet()): Pose {
  finiteBeat(b); validateRest(rest);
  if (typeof reverse !== "boolean") throw new TypeError("reverse must be boolean");
  if (movement === "quarts") return quartsPose(b, reverse);
  if (movement === "ida" && !reverse) return idaPose(b, rest);
  throw new RangeError(`unsupported oracle movement/reverse: ${movement}/${reverse}`);
}

/** A two-beat window of the evaluated plan; adjacency alone is NOT a continuity test. */
export function oracleHalfStep(movement: OracleMovement, k: number, reverse = false, rest: Feet = restFeet()) {
  if (!Number.isSafeInteger(k) || k < 0) throw new RangeError("half-step index must be a non-negative integer");
  return { start: oraclePose(movement, 2 * k, reverse, rest), end: oraclePose(movement, 2 * (k + 1), reverse, rest) };
}

// Historical lateral movement only. It has known resets at b=5 (and b=13 in GF):
// model them honestly, do not claim continuity or silently change the rendered figures.
function legacyOffset(movement: LegacySortie, b: number, side: OracleSide): number {
  const cycle = phase(b, movement === "sortieGF" ? 16 : 8);
  if ((movement === "sortieG" && side === "follower") || (movement === "sortieF" && side === "leader")) return 0;
  if (movement === "sortieGF" && (side === "leader" ? cycle >= 8 : cycle < 8)) return 0;
  const p = movement === "sortieGF" && side === "follower" ? cycle - 8 : cycle;
  const envelope = p < 1 ? p : p < 3 ? 1 : p < 5 ? (5 - p) / 2 : 0;
  return .22 * smooth(envelope);
}
export function legacySortiePose(movement: LegacySortie, b: number, side: OracleSide = "leader", rest: Feet = restFeet()): Pose {
  finiteBeat(b); validateRest(rest);
  if (!["sortieG", "sortieF", "sortieGF"].includes(movement) || !["leader", "follower"].includes(side))
    throw new RangeError("unsupported historical movement/role");
  const dx = legacyOffset(movement, b, side), index = Math.floor(b), moving = phase(index, 2) === 0 ? "L" : "R";
  const feet: Feet = { L: { ...rest.L }, R: { ...rest.R } };
  const targets: Feet = { L: { ...rest.L }, R: { ...rest.R } };
  if (dx > 0) for (const foot of ["L", "R"] as const) {
    const previous = index - (moving === foot ? 2 : 1);
    const before = { ...rest[foot], x: rest[foot].x + legacyOffset(movement, previous + .6, side) };
    targets[foot] = { ...rest[foot], x: rest[foot].x + legacyOffset(movement, (moving === foot ? index : previous) + .6, side) };
    feet[foot] = moving === foot ? interpolate(before, targets[foot], smooth((b - index) / .6)) : before;
  }
  return pose(feet, targets, 0, -dx, dx);
}
