/** Validated five-action figure. GLB coordinates: left +x, forward +z. */
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
  variant: SortieVariant = "line", contraDegrees = DEFAULT_SORTIE_CONTRA) {
  const b = sortieGarconBeat(beat);
  const index = Math.min(4, Math.floor(b));
  const t = b - index;
  const shift = variant === "right" ? 0.10 : 0;
  // Absolute offsets from the initial ankle positions, in each dancer's local frame.
  // The follower retreats with D/G/D/G; it never copies the leader's exit or crossing.
  const steps: [FigureFoot, FootPoint][] = follower ? [
    ["R", { x: 0, z: -0.14 }], ["L", { x: 0, z: -0.40 }],
    ["R", { x: 0, z: -0.70 }], ["L", { x: shift, z: -0.70 }],
    ["R", { x: shift, z: -0.70 }],
  ] : [
    ["L", { x: 0.34, z: 0.14 }], ["R", { x: 0.34, z: 0.40 }],
    ["L", { x: 0, z: 0.70 }], ["R", { x: -shift, z: 0.70 }],
    ["L", { x: -shift, z: 0.70 }],
  ];
  const positions = { L: { ...rest.L }, R: { ...rest.R } };
  // At the crossing the pelvis stays between the feet; returning it to x=0 before
  // D follows would over-stretch that leg and force G's knee into the partner.
  const bodyAfter = (action: number, offset: FootPoint): FootPoint =>
    !follower && action === 0 ? { x: 0.17, z: 0.07 }
    : !follower && action === 2 ? { x: 0.17, z: 0.55 } : offset;
  let support: FigureFoot = follower ? "L" : "R";
  let body: FootPoint = { x: 0, z: 0 };
  for (let i = 0; i < index; i++) {
    const [side, offset] = steps[i];
    positions[side] = { x: rest[side].x + offset.x, z: rest[side].z + offset.z };
    if (i < 4) { support = side; body = bodyAfter(i, offset); }
  }
  const [moving, offset] = steps[index];
  const from = positions[moving];
  const to = { x: rest[moving].x + offset.x, z: rest[moving].z + offset.z };
  const flight = Math.min(1, t / 0.6);
  let point = interpolate(from, to, smooth(flight));
  // Clear the partner's right knee before advancing; cross in front of the planted D.
  const via = !follower && index === 1 ? { x: to.x + 0.06, z: from.z + 0.06 }
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
  const root = index < 4 ? interpolate(body, bodyAfter(index, offset), smooth(t)) : body;
  // Same local yaw for both partners, whose outer frames differ by π.
  const exit = b < 1 ? smooth(b) : b < 2 ? 1 : b < 3 ? 1 - smooth(b - 2) : 0;
  const contra = Number.isFinite(contraDegrees) ? Math.max(0, Math.min(30, contraDegrees)) : DEFAULT_SORTIE_CONTRA;
  return { beat: b, action: Math.ceil(b), moving, feet, root, loadR, loadL: 1 - loadR,
    chestYaw: -contra * Math.PI / 180 * exit };
}
