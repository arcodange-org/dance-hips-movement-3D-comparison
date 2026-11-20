/** An ida e volta inserted in the middle of a sortie (#91, docs/spec-insertion-ida.md). Owner (20 Nov.):
 * « le leader peut guider un ida e volta en milieu de figure : par exemple un ida e volta jambe gauche
 * arrière en premier entre les temps/positions 3 et 4 de la sortie fille, ou entre les positions 2 et 3 de
 * la sortie garçon faire un ida e volta jambe gauche en avant en premier ».
 *
 * Measured on the samplers: at the end of action 2 of both sorties the leader stands on his D (his G is
 * free) and his next step is his G, backwards in the sortie fille (−31 cm) and forwards in the sortie
 * garçon (+34 cm); the follower stands on her G. The inserted ida e volta is his G's go-and-return
 * (4 beats) in the direction of that next step, the follower mirroring with her D; it is a touch (owner:
 * « c'est un touch ») : the returning foot does not take the weight, which ends on the support it
 * started from, and the figure resumes from the same position.
 * Every position is in the dancer's own outer frame (as the figure samplers). */
import { sampleIdaPaire, idaNeutral, type IdaVariant } from "./idaPaire";
import { sampleSortieFille } from "./sortieFille";
import { sampleSortieGarcon, DEFAULT_SORTIE_CONTRA, type FigureFoot, type FigureFootPose, type FootPoint } from "./sortieGarcon";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";

export type InsertionHost = "sortieF" | "sortieG";
/** Position (end of action) where the ida is inserted, its length (the G's go-and-return) and variant. */
export const INSERTION_AT = 2, INSERTION_BEATS = 4;
export const INSERTION_VARIANT: Record<InsertionHost, IdaVariant> = {
  sortieF: { side: "L", back: true },
  sortieG: { side: "L", back: false },
};
/** Length (beats) of the sortie with its inserted ida e volta (marka included). */
export const INSERTED_BEATS = 5 + INSERTION_BEATS;

export function sampleInserted(host: InsertionHost, beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0,
  contraDegrees = DEFAULT_SORTIE_CONTRA) {
  const b = Math.max(0, Math.min(INSERTED_BEATS, Number.isFinite(beat) ? beat : 0));
  const o = placementOffset(placement);
  const figure = (t: number) => host === "sortieF"
    ? sampleSortieFille(t, follower, rest, "hook", o, contact, stance)
    : sampleSortieGarcon(t, follower, rest, "line", contraDegrees, o, contact, stance);
  if (b <= INSERTION_AT) return { ...figure(b), beat: b, inserted: false };
  if (b >= INSERTION_AT + INSERTION_BEATS) return { ...figure(b - INSERTION_BEATS), beat: b, inserted: false };
  // The ida's displacements from its own neutral stance, added to the held position of the sortie.
  const held = figure(INSERTION_AT);
  const t = b - INSERTION_AT;
  const variant = INSERTION_VARIANT[host];
  const ida = sampleIdaPaire(t, follower, rest, o, stance, variant), start = sampleIdaPaire(0, follower, rest, o, stance, variant);
  const neutral = idaNeutral(rest, o, stance);
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  for (const side of ["L", "R"] as FigureFoot[]) {
    const p = held.feet[side], q = ida.feet[side];
    feet[side] = { ...p, x: p.x + q.x - neutral[side].x, z: p.z + q.z - neutral[side].z,
      lift: q.lift ?? 0, pitch: q.pitch, pivot: q.pivot };
  }
  // Weight: the outgoing step rocks onto the moving foot and back (the ida's own loads); the return is a
  // touch, the weight stays on the support.
  const loadR = t < 2 ? ida.loadR : held.loadR;
  return { ...held, beat: b, feet, loadR, loadL: 1 - loadR,
    root: { x: held.root.x + ida.root.x - neutral.root.x, z: held.root.z + ida.root.z - neutral.root.z },
    chestYaw: held.chestYaw + (ida.chestYaw - start.chestYaw),
    rootYaw: ((held as { rootYaw?: number }).rootYaw ?? 0) + (ida.rootYaw - start.rootYaw), inserted: true };
}
