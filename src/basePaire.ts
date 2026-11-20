/** Basic step in pair for the guide mode (#69, docs/spec-mode-guidage-poc.md): the neutral quinconce of
 * the pair figures, feet still, the style dancing on the spot. It is the hub every pair figure starts
 * from and returns to. Same frame and bounds as the ida e volta in pair (src/idaPaire.ts). */
import { IDA_PAIR, idaNeutral } from "./idaPaire";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

/** Illustrative support of the leader: right foot on even beats, left foot on odd beats (the pair
 * figures start with the leader on the right foot, the follower on the left). Provisional: the ginga
 * triggered by support transfers (#42) will drive it. */
export function baseLoadR(beat: number, follower: boolean): number {
  const b = Number.isFinite(beat) ? beat : 0;
  const leader = (1 + Math.cos(Math.PI * b)) / 2;
  return follower ? 1 - leader : leader;
}

export function sampleBasePaire(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0) {
  const b = Number.isFinite(beat) ? beat : 0;
  const o = placementOffset(placement);
  const neutral = idaNeutral(rest, o, stance);
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  for (const side of ["L", "R"] as FigureFoot[]) feet[side] = { x: neutral[side].x, z: neutral[side].z, yaw: 0, lift: 0 };
  const loadR = baseLoadR(b, follower);
  return { beat: b, action: 0, moving: null, feet, root: { ...neutral.root }, rootYaw: 0, chestYaw: 0,
    loadR, loadL: 1 - loadR, support: (loadR >= 0.5 ? "R" : "L") as FigureFoot, cyclic: true as const,
    coupling: IDA_PAIR.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05),
    kneeCap: IDA_PAIR.kneeCap, rotationCap: IDA_PAIR.rotationCap, dip: IDA_PAIR.dip, sway: IDA_PAIR.sway };
}
