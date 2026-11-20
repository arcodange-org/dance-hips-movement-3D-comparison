/** Chaining figures (#90, docs/spec-enchainements.md). Owner (20 Nov.): « La position 2 de la sortie garçon
 * est la configuration de la position 5 de la sortie fille si le leader ne demande pas à la fille de
 * reprendre la ligne mais d'avancer tout simplement : le guideur peut alors reprendre la fin de la sortie
 * garçon au lieu de faire la fin de la sortie fille. »
 *
 * Measured on the samplers (neither dancer turns): the sortie fille's position before her G « retakes the
 * line » (end of action 3) has the same topology as the sortie garçon's position 2 (right sides together,
 * facing each other, D/D side by side), 20 cm wider sideways. From it the leader keeps his D planted
 * (weight onto it, then his G placed) while the follower places her D, then advances her G (weight onto
 * it): two beats of bridge, then the sortie garçon's actions 3 to 5 (and its held marka).
 * Every position is in the dancer's own outer frame (as the figure samplers). */
import { gaitStep } from "./gait";
import { sampleSortieFille } from "./sortieFille";
import { sampleSortieGarcon, DEFAULT_SORTIE_CONTRA, type FigureFoot, type FigureFootPose, type FootPoint } from "./sortieGarcon";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";

/** Beat of the sortie fille where the chain leaves it, beat of the sortie garçon where it joins it. */
export const CHAIN_FROM = 3, CHAIN_TO = 2;
/** Bridge windows (beats from `CHAIN_FROM`), proposals to validate by eye (owner):
 * - leader: weight onto his planted D (`shift`), then his G placed (`leader`); his pelvis travels over
 *   `leaderBody` (#104: it ends over his D, next to her right thigh, so it waits for her D to clear);
 * - follower: her advanced G would land where her D stands, so her D goes first: weight onto her G in
 *   place (`toG`), her D placed with his G (never before it, R24: `herD`), weight onto it (`toD`), her G
 *   placed (`herG`) and weighted on the beat (`onG`);
 * - `roll`: share of the walking roll of the bridge steps;
 * - `rotationCap`, `sway`, `kneeCap`: the style's pelvis rotation, hip shift and knee flexion, held
 *   smaller in the middle of the bridge (the sorties' own values at both ends).
 * Both leave the D/D thigh contact of position 3 early (an eighth of a beat) and the style is held
 * smaller: otherwise the suave's wide hips press the right thighs together (amplitude 2, measured on the
 * GLB; each measure alone leaves crossings). */
export const CHAIN_BRIDGE = {
  beats: 2, shift: [0, 0.12], leader: [0.12, 1.1], leaderBody: [0.6, 1.5],
  toG: [0, 0.15], herD: [0.16, 0.7], toD: [1.1, 1.3], herG: [1.3, 1.85], onG: [1.8, 2],
  roll: 0.3, rotationCap: 0.06, sway: 0.6, kneeCap: 0.3,
} as const;
/** Length (beats) of the chained figure: sortie fille to its position 3, bridge, sortie garçon from its
 * position 2 to its marka. */
export const CHAIN_BEATS = CHAIN_FROM + CHAIN_BRIDGE.beats + (5 - CHAIN_TO);

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const window01 = (u: number, [a, b]: readonly [number, number] | readonly number[]) => Math.max(0, Math.min(1, (u - a) / (b - a)));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

type Sample = ReturnType<typeof sampleSortieGarcon> | ReturnType<typeof sampleSortieFille>;

export function sampleSortieFG(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0,
  contraDegrees = DEFAULT_SORTIE_CONTRA) {
  const b = Math.max(0, Math.min(CHAIN_BEATS, Number.isFinite(beat) ? beat : 0));
  const o = placementOffset(placement);
  const fille = (t: number, f: boolean) => sampleSortieFille(t, f, rest, "hook", o, contact, stance);
  const garcon = (t: number, f: boolean) => sampleSortieGarcon(t, f, rest, "line", contraDegrees, o, contact, stance);
  if (b <= CHAIN_FROM) return { ...fille(b, follower), beat: b, chain: "fille" as const };
  // Couple translation that keeps the leader's planted D: his D at the sortie fille's position 3 is his D
  // at the sortie garçon's position 2. The leader's own frame is the couple frame translated; the
  // follower's is turned by π (a couple translation T is −T in her frame).
  const a = fille(CHAIN_FROM, false), g = garcon(CHAIN_TO, false);
  const tx = a.feet.R.x - g.feet.R.x, tz = a.feet.R.z - g.feet.R.z;
  const shift = follower ? { x: -tx, z: -tz } : { x: tx, z: tz };
  const moved = (s: Sample) => ({
    ...s,
    feet: { L: { ...s.feet.L, x: s.feet.L.x + shift.x, z: s.feet.L.z + shift.z }, R: { ...s.feet.R, x: s.feet.R.x + shift.x, z: s.feet.R.z + shift.z } },
    root: { x: s.root.x + shift.x, z: s.root.z + shift.z },
  });
  const bridgeEnd = CHAIN_FROM + CHAIN_BRIDGE.beats;
  if (b >= bridgeEnd) return { ...moved(garcon(CHAIN_TO + b - bridgeEnd, follower)), beat: b, chain: "garcon" as const };
  // Bridge: each foot goes from its sortie fille position to its (translated) sortie garçon position.
  const from = fille(CHAIN_FROM, follower), to = moved(garcon(CHAIN_TO, follower));
  const u = b - CHAIN_FROM, w = CHAIN_BRIDGE;
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  for (const side of ["L", "R"] as FigureFoot[]) {
    const window = follower ? (side === "L" ? w.herG : w.herD) : (side === "L" ? w.leader : w.shift);
    const p = from.feet[side], q = to.feet[side];
    const travel = { x: q.x - p.x, z: q.z - p.z };
    const gait = gaitStep(window01(u, window), travel, 0, w.roll);
    const k = gait.progress;
    // Her D joins his planted D (D/D contact of the sortie garçon's position 2): it goes back first, then
    // sideways towards him, rather than straight into his right thigh.
    const corner = follower && side === "R";
    const along = corner ? { x: smooth(2 * k - 1), z: smooth(2 * k) } : { x: k, z: k };
    feet[side] = { x: p.x + travel.x * along.x, z: p.z + travel.z * along.z, yaw: 0,
      lift: gait.lift, pitch: gait.pitch, pivot: gait.pivot };
  }
  // Weight: the leader onto his planted D first; the follower onto her G, her placed D, then her G.
  const loadR = follower
    ? mix(mix(mix(from.loadR, 0, smooth(window01(u, w.toG))), 1, smooth(window01(u, w.toD))), to.loadR, smooth(window01(u, w.onG)))
    : mix(from.loadR, to.loadR, smooth(window01(u, w.shift)));
  // The pelvis follows the moving feet (the leader over his whole bridge, the follower over hers).
  const body = smooth(follower ? window01(u, [w.herD[0], w.herG[1]]) : window01(u, w.leaderBody));
  const root = { x: mix(from.root.x, to.root.x, body), z: mix(from.root.z, to.root.z, body) };
  const turn = smooth(u / w.beats);
  const hold = Math.sin(Math.PI * u / w.beats) ** 2;
  return { beat: b, feet, root, loadR, loadL: 1 - loadR, chestYaw: mix(from.chestYaw, to.chestYaw, turn),
    coupling: mix(from.coupling, to.coupling, turn),
    rotationCap: mix(0.12, w.rotationCap, hold), sway: mix(1, w.sway, hold), kneeCap: mix(0.45, w.kneeCap, hold),
    chain: "pont" as const };
}
