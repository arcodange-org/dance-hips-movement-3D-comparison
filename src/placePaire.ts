/** Pair on the spot (#61, docs/spec-sur-place-paire.md): the couple dances in the neutral position, the
 * quinconce (#48), instead of feet facing feet. Both dancers keep their feet planted at the neutral
 * stance (placement offset, feet under the hips, right foot staggered); the style moves the pelvis over
 * them. In the close couple the follower's pelvis mirrors the leader's (coupled pelvises, #28), so the
 * interleaved knees travel side by side instead of meeting.
 * GLB coordinates: left +x, forward +z, in each dancer's own outer frame. */
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import { idaNeutral } from "./idaPaire";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

/** Same half-spacing as the pair figures: the couple placements are calibrated for it. */
export const PLACE_PAIR_DZ = 0.20;
/** Proposals calibrated on the GLB (six styles, three amplitudes): `rotationCap` bounds the pelvis
 * rotations, `kneeCap` the knee flexion of the reach, `styleSway` the share of the style's lateral
 * hip shift kept on top of the planted feet, `dip` the lowest pelvis level. */
export const PLACE_PAIR = { coupling: 1, rotationCap: 0.16, kneeCap: 0.35, styleSway: 0.5, dip: -0.03 };

export function samplePlacePaire(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0) {
  const b = Number.isFinite(beat) ? beat : 0;
  const o = placementOffset(placement);
  const neutral = idaNeutral(rest, o, stance);
  const feet: Record<FigureFoot, FigureFootPose> = {
    L: { ...neutral.L, yaw: 0, lift: 0 }, R: { ...neutral.R, yaw: 0, lift: 0 },
  };
  return { beat: b, feet, root: neutral.root, chestYaw: 0, cyclic: true as const,
    coupling: PLACE_PAIR.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05),
    rotationCap: PLACE_PAIR.rotationCap, kneeCap: PLACE_PAIR.kneeCap, dip: PLACE_PAIR.dip,
    styleSway: PLACE_PAIR.styleSway };
}
