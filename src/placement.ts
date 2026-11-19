/** Initial couple placements for the five-action figures. See docs/spec-placements-couple.md.
 * An offset is the same for both roles, in each dancer's own frame (+x left, +z forward):
 * each dancer moves to their own left and towards the partner, keeping the couple centred. */
export interface PlacementOffset {
  x: number; z: number;
  /** Quinconce: each right foot starts `stagger / 2` further towards the partner, so the two right
   * knees pass each other (the leader's between the follower's knees) instead of meeting side by side. */
  stagger?: number;
}
export type CouplePlacement = "quinconce" | "face";
export const DEFAULT_PLACEMENT: CouplePlacement = "quinconce";
export const PLACEMENT_OFFSETS: Record<CouplePlacement | "reference", PlacementOffset> = {
  // The validated figures, unchanged (roots at ±SORTIE_*_PAIR_DZ).
  reference: { x: 0, z: 0 },
  // Patellae cross beyond 1 cm per dancer as soon as a style flexes the knees (measured on the GLB).
  face: { x: 0, z: 0.010 },
  // Owner's quinconce (19 Nov.), feet forward and under the hips: the outer edge of the leader's
  // right forefoot touches the inner edge of the follower's left forefoot, and the inner edge of the
  // leader's left forefoot touches the outer edge of the follower's right forefoot (first third of
  // the foot, ≈1 mm on the GLB soles). The right feet start 5 cm further towards the partner so the
  // right knees pass each other (bone-clear up to amplitude 1 with coupled pelvises).
  quinconce: { x: 0.0405, z: 0.060, stagger: 0.10 },
};
/** Full approach up to amplitude 1, fading linearly to the validated spacing at amplitude 2,
 * where deep knee flexion leaves no bone-clear approach. */
export function placementScale(amp: number): number {
  return Number.isFinite(amp) ? Math.max(0, Math.min(1, 2 - amp)) : 0;
}
export const PLACEMENT_LABELS: Record<CouplePlacement, string> = {
  quinconce: "Quinconce (demi-pointes au contact)",
  face: "Face à face (pointes rapprochées)",
};

export function placementOf(value: string | null | undefined): CouplePlacement {
  return value === "face" ? "face" : "quinconce";
}
/** Offset of a placement at a style amplitude; a non-finite override falls back to the reference. */
export function placementOffset(placement: CouplePlacement | "reference" | PlacementOffset = DEFAULT_PLACEMENT, amp = 1): PlacementOffset {
  const o = typeof placement === "string" ? PLACEMENT_OFFSETS[placement] ?? PLACEMENT_OFFSETS[DEFAULT_PLACEMENT] : placement;
  const scale = typeof placement === "string" ? placementScale(amp) : 1;
  // The approach and the knee stagger fade first; the lateral interleave stays complete until half
  // the fade, so interleaved feet never face each other while still close.
  const lateral = Math.min(1, 2 * scale);
  const stagger = Number.isFinite(o.stagger) ? (o.stagger as number) * scale : 0;
  return Number.isFinite(o.x) && Number.isFinite(o.z) ? { x: o.x * lateral, z: o.z * scale, stagger } : { x: 0, z: 0, stagger: 0 };
}

/** Weight of the coupled pelvises (0..1): full during the first action, while feet from the close
 * start are still interleaved, then fading out over the second action as the position opens.
 * Proportional to the approach, so the validated spacing (no approach) keeps independent pelvises. */
export function startCoupling(beat: number, offset: PlacementOffset): number {
  const closeness = Math.min(1, Math.hypot(offset.x, offset.z) / 0.05);
  const t = Math.max(0, Math.min(1, beat - 1));
  return closeness * (1 - t * t * (3 - 2 * t));
}
