/** Validated five-action figure. GLB coordinates: left +x, forward +z. */
import { placementOffset, startCoupling, type CouplePlacement, type PlacementOffset } from "./placement";
export type FigureFoot = "L" | "R";
export type SortieVariant = "line" | "right";
export interface FootPoint { x: number; z: number }
export interface FigureFootPose extends FootPoint { yaw: number; lift: number }
export const SORTIE_GARCON_BEATS = 5;
// Half-spacing calibrated for this figure's real leg meshes; other pair figures retain PAIR_DZ.
export const SORTIE_GARCON_PAIR_DZ = 0.20;
export const SORTIE_GARCON_ACTIONS = [
  "Départ · gauche disponible", "1 · Gauche en avant à gauche",
  "2 · Droit en avant, hors ligne", "3 · Gauche croisé devant",
  "4 · Droit, retour en face", "5 · Marka gauche, sans transfert",
] as const;
export const DEFAULT_SORTIE_CONTRA = 12;
const STEP1_LEAD = 0.1;
const STEP4_LEAD = 0.2;
const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const interpolate = (a: FootPoint, b: FootPoint, t: number): FootPoint => ({ x: mix(a.x, b.x, t), z: mix(a.z, b.z, t) });

export function sortieGarconBeat(beat: number): number {
  return Number.isFinite(beat) ? Math.max(0, Math.min(SORTIE_GARCON_BEATS, beat)) : 0;
}
export function sortieGarconSettings(params: URLSearchParams): { variant: SortieVariant; contra: number; beat: number } {
  const raw = params.get("sortieContra");
  const contra = raw !== null && raw.trim() !== "" ? Number(raw) : DEFAULT_SORTIE_CONTRA;
  return { variant: params.get("sortieVariant") === "right" ? "right" : "line",
    contra: Number.isFinite(contra) ? Math.max(0, Math.min(30, contra)) : DEFAULT_SORTIE_CONTRA,
    beat: sortieGarconBeat(Number(params.get("sortieBeat") ?? 0)) };
}

export function sampleSortieGarcon(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  variant: SortieVariant = "line", contraDegrees = DEFAULT_SORTIE_CONTRA,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0) {
  const b = sortieGarconBeat(beat);
  const index = Math.min(4, Math.floor(b));
  const t = b - index;
  const shift = variant === "right" ? 0.10 : 0;
  // Owner requests (19 Nov.):
  // - Step 1 is more forward than sideways (36 cm forward, 30 cm left): the leader's forward
  //   intention makes the partner retreat (D1: 16 cm). With the feet pointing forward, G1 must stay
  //   9 cm clear of D2 laterally. This holds at every amplitude.
  // - At action 2 the middle of the right thighs touch. The partner's G2 retreats 22 cm (not 40) and
  //   the leader's D2 goes 46 cm (not 40): the pelvises are 16 cm apart along the line instead of 40.
  //   The leader's pelvis sits 2.5 cm inside his D, which stays out for the partner's D3 to pass,
  //   and moves 7 cm further during the crossing so that G clears D. `contact` (1 up to amplitude 1,
  //   0 at amplitude 2) returns to the earlier, looser arrival where large style motion would make
  //   the femurs cross.
  const touch = Number.isFinite(contact) ? Math.max(0, Math.min(1, contact)) : 1;
  // Absolute offsets from the initial ankle positions, in each dancer's local frame.
  // The follower retreats with D/G/D/G; it never copies the leader's exit or crossing.
  const steps: [FigureFoot, FootPoint][] = follower ? [
    ["R", { x: 0, z: -0.16 }], ["L", { x: 0, z: mix(-0.40, -0.22, touch) }],
    ["R", { x: 0, z: -0.70 }], ["L", { x: shift, z: -0.70 }],
    ["R", { x: shift, z: -0.70 }],
  ] : [
    ["L", { x: 0.30, z: 0.36 }], ["R", { x: mix(0.34, 0.345, touch), z: mix(0.40, 0.46, touch) }],
    ["L", { x: 0, z: 0.70 }], ["R", { x: -shift, z: 0.70 }],
    ["L", { x: -shift, z: 0.70 }],
  ];
  // Couple placement (docs/spec-placements-couple.md): both feet start shifted by o. A landing
  // either keeps o (same step amplitude) or lands on the validated target; the relative arrival
  // (D/D at action 2) and everything after it are validated, so the figure ends unchanged.
  const o = placementOffset(placement);
  // The D/D arrival comes right after the first step: keeping G1's amplitude would raise the
  // leader's pelvis (its height depends on the free foot) and open the thigh gap past the 3 cm
  // proximity threshold. Every landing is therefore validated; each foot absorbs o on its first step.
  const shifted = [false, false, false, false, false];
  const shiftOf: Record<FigureFoot, number> = { L: 1, R: 1 };
  const target = (i: number, side: FigureFoot, offset: FootPoint): FootPoint => ({
    x: rest[side].x + offset.x + (shifted[i] ? o.x : 0), z: rest[side].z + offset.z + (shifted[i] ? o.z : 0) });
  // Initial/neutral stance: each foot `stance` further out (feet under the hips), absorbed on its first step.
  const widen = Number.isFinite(stance) ? stance : 0;
  const stagger = (o.stagger ?? 0) / 2;
  const positions = { L: { x: rest.L.x + widen + o.x, z: rest.L.z + o.z }, R: { x: rest.R.x - widen + o.x, z: rest.R.z + o.z + stagger } };
  // At the crossing the pelvis stays between the feet; returning it to x=0 before
  // D follows would over-stretch that leg and force G's knee into the partner.
  const bodyAfter = (action: number, offset: FootPoint): FootPoint =>
    !follower && action === 0 ? { x: 0.15, z: 0.18 }
    : !follower && action === 1 ? { x: mix(0.34, 0.32, touch), z: offset.z }
    : !follower && action === 2 ? { x: 0.17, z: mix(0.55, 0.62, touch) } : offset;
  let support: FigureFoot = follower ? "L" : "R";
  let body: FootPoint = { x: 0, z: 0 };
  for (let i = 0; i < index; i++) {
    const [side, offset] = steps[i];
    positions[side] = target(i, side, offset);
    shiftOf[side] = shifted[i] ? 1 : 0;
    if (i < 4) { support = side; body = bodyAfter(i, offset); }
  }
  const [moving, offset] = steps[index];
  const from = positions[moving];
  const to = target(index, moving, offset);
  // The pelvis follows the shift of the support foot, so it is validated whenever the dancer
  // stands on a validated landing (the D/D arrival in particular).
  const weightBefore = shiftOf[support];
  const weightAfter = index < 4 ? (shifted[index] ? 1 : 0) : weightBefore;
  const shiftedBody = (point: FootPoint, weight: number): FootPoint =>
    ({ x: point.x + o.x * weight, z: point.z + o.z * weight });
  // The leader's forward intention starts in the frame: his G1 (and pelvis) leave 0.1 beat after the
  // partner's D1, so his knee never meets her thigh before she retreats (face-à-face placement).
  const lead = !follower && index === 0 ? STEP1_LEAD : !follower && index === 3 ? STEP4_LEAD : 0;
  // D4 returns behind the planted G once the partner's G4 has left (same 0.65 touchdown).
  const span = !follower && index === 3 ? 0.65 - STEP4_LEAD : 0.6;
  const flight = Math.max(0, Math.min(1, (t - lead) / span));
  let point = interpolate(from, to, smooth(flight));
  // D2 slides sideways past the partner's right knee, then advances; G crosses in front of the planted D.
  // From the interleaved quinconce start, the partner's first two steps retreat before sliding back
  // to the validated lane, so a foot in contact with the leader's never slides into it.
  const via = follower && index < 2 && Math.abs(to.x - from.x) > 1e-6 ? { x: from.x, z: to.z }
    : !follower && index === 1 ? { x: to.x, z: from.z }
    : !follower && index === 2 ? { x: from.x, z: to.z }
    : !follower && index === 3 ? { x: to.x, z: from.z } : null;
  if (via) point = flight < 0.5 ? interpolate(from, via, smooth(flight * 2))
    : interpolate(via, to, smooth(flight * 2 - 1));
  const lift = (index === 4 ? 0.005 : 0.045) * Math.sin(Math.PI * flight) ** 2;
  const feet: Record<FigureFoot, FigureFootPose> = {
    L: { ...positions.L, yaw: 0, lift: 0 }, R: { ...positions.R, yaw: 0, lift: 0 },
  };
  feet[moving] = { ...point, yaw: 0, lift };
  const transfer = index < 4 ? smooth((t - 0.65) / 0.35) : 0;
  const oldR = support === "R" ? 1 : 0;
  const loadR = mix(oldR, moving === "R" ? 1 : 0, transfer);
  const root = index < 4
    ? interpolate(shiftedBody(body, weightBefore), shiftedBody(bodyAfter(index, offset), weightAfter),
      smooth((t - lead) / (1 - lead)))
    : shiftedBody(body, weightBefore);
  // Same local yaw for both partners, whose outer frames differ by π.
  const exit = b < 1 ? smooth(b) : b < 2 ? 1 : b < 3 ? 1 - smooth(b - 2) : 0;
  const contra = Number.isFinite(contraDegrees) ? Math.max(0, Math.min(30, contraDegrees)) : DEFAULT_SORTIE_CONTRA;
  return { beat: b, action: Math.ceil(b), moving, feet, root, loadR, loadL: 1 - loadR,
    chestYaw: -contra * Math.PI / 180 * exit, coupling: startCoupling(b, o) };
}
