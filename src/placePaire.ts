/** Pair on the spot (#61, docs/spec-sur-place-paire.md): the couple dances in the neutral position, the
 * quinconce (#48), instead of feet facing feet. Both dancers keep their feet planted at the neutral
 * stance (placement offset, feet under the hips, right foot staggered); the style moves the pelvis over
 * them. In the close couple the follower's pelvis mirrors the leader's (coupled pelvises, #28), so the
 * interleaved knees travel side by side instead of meeting.
 * GLB coordinates: left +x, forward +z, in each dancer's own outer frame. */
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import { idaNeutral } from "./idaPaire";
import { travelOffset, swingLift } from "./styles";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

/** Same half-spacing as the pair figures: the couple placements are calibrated for it. */
export const PLACE_PAIR_DZ = 0.20;
/** Proposals calibrated on the GLB (six styles, three amplitudes): `rotationCap` bounds the pelvis
 * rotations, `kneeCap` the knee flexion of the reach, `styleSway` the share of the style's lateral
 * hip shift kept on top of the planted feet, `dip` the lowest pelvis level. */
export const PLACE_PAIR = { coupling: 1, rotationCap: 0.16, kneeCap: 0.35, styleSway: 0.5, dip: -0.03,
  /** Lateral travel (#71): share of the solo sway kept by the pelvises and by the landing feet, and the
   * largest travel setting followed in the close couple. */
  travel: { body: 0.5, feet: 0, max: 0.5 } };

/** Lateral travel (« Déplacement », #71): the couple sways sideways together, as the solo does
 * (`travelOffset`), the feet stepping in turn (one step per beat, or per 3 beats with `temps3`); the
 * follower, who faces the leader, goes to her right when he goes to his left, with her other foot. */
export interface PlaceTravel { travel: number; dir: number; length: number }

export function samplePlacePaire(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0,
  move: PlaceTravel = { travel: 0, dir: 1, length: 1 }) {
  const b = Number.isFinite(beat) ? beat : 0;
  const o = placementOffset(placement);
  const neutral = idaNeutral(rest, o, stance);
  const sign = follower ? -1 : 1, travel = Number.isFinite(move.travel) ? Math.max(0, Math.min(PLACE_PAIR.travel.max, move.travel)) : 0;
  const length = move.length > 0 ? move.length : 1;
  // The stepping foot is in the air for 0.6 beat, also when the steps come every 3 beats (temps3).
  const index = Math.floor(b / length), t = Math.max(0, Math.min(1, (b - index * length) / 0.6));
  const leaderSide: FigureFoot = ((index % 2) + 2) % 2 === 0 ? "L" : "R";
  const stepping: FigureFoot = follower ? (leaderSide === "L" ? "R" : "L") : leaderSide;
  // Each foot lands under the body (same rule as the solo walk): the sway brings it back to its place.
  const lateral = (time: number) => sign * travelOffset(travel, move.dir, time);
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  for (const side of ["L", "R"] as FigureFoot[]) {
    // The leader's G (the follower's D) steps on even beats, when the couple sways to his left.
    const parity = (side === "L") !== follower ? 0 : 1;
    const lift = travel > 0 && side === stepping ? swingLift(t, travel) : 0;
    feet[side] = { x: neutral[side].x + PLACE_PAIR.travel.feet * lateral((parity + 0.6) * length), z: neutral[side].z, yaw: 0, lift };
  }
  const root = { x: neutral.root.x + PLACE_PAIR.travel.body * lateral(b), z: neutral.root.z };
  return { beat: b, feet, root, chestYaw: 0, cyclic: true as const,
    coupling: PLACE_PAIR.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05),
    rotationCap: PLACE_PAIR.rotationCap, kneeCap: PLACE_PAIR.kneeCap, dip: PLACE_PAIR.dip,
    styleSway: PLACE_PAIR.styleSway };
}
