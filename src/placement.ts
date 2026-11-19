/** Initial couple placements for the five-action figures. See docs/spec-placements-couple.md.
 * An offset is the same for both roles, in each dancer's own frame (+x left, +z forward):
 * each dancer moves to their own left and towards the partner, keeping the couple centred. */
export interface PlacementOffset { x: number; z: number }
export type CouplePlacement = "quinconce" | "face";
export const DEFAULT_PLACEMENT: CouplePlacement = "quinconce";
export const PLACEMENT_OFFSETS: Record<CouplePlacement | "reference", PlacementOffset> = {
  // The validated figures, unchanged (roots at ±SORTIE_*_PAIR_DZ).
  reference: { x: 0, z: 0 },
  // Patellae cross beyond 1 cm per dancer as soon as a style flexes the knees (measured on the GLB).
  face: { x: 0, z: 0.010 },
  // Right legs interleaved: each right knee centred between the partner's knees (7.2 cm relative
  // lateral offset); 3.5 cm closer per dancer is the bone-clear limit up to amplitude 1.
  quinconce: { x: 0.036, z: 0.035 },
};
/** Full approach up to amplitude 1, fading linearly to the validated spacing at amplitude 2,
 * where deep knee flexion leaves no bone-clear approach. */
export function placementScale(amp: number): number {
  return Number.isFinite(amp) ? Math.max(0, Math.min(1, 2 - amp)) : 0;
}
export const PLACEMENT_LABELS: Record<CouplePlacement, string> = {
  quinconce: "Quinconce (jambes droites intercalées)",
  face: "Face à face (pointes rapprochées)",
};

export function placementOf(value: string | null | undefined): CouplePlacement {
  return value === "face" ? "face" : "quinconce";
}
/** Offset of a placement at a style amplitude; a non-finite override falls back to the reference. */
export function placementOffset(placement: CouplePlacement | "reference" | PlacementOffset = DEFAULT_PLACEMENT, amp = 1): PlacementOffset {
  const o = typeof placement === "string" ? PLACEMENT_OFFSETS[placement] ?? PLACEMENT_OFFSETS[DEFAULT_PLACEMENT] : placement;
  const scale = typeof placement === "string" ? placementScale(amp) : 1;
  return Number.isFinite(o.x) && Number.isFinite(o.z) ? { x: o.x * scale, z: o.z * scale } : { x: 0, z: 0 };
}
