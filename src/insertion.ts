/** An ida e volta inserted in the middle of a sortie (#91, docs/spec-insertion-ida.md). Owner (20 Nov.):
 * « le leader peut guider un ida e volta en milieu de figure : par exemple un ida e volta jambe gauche
 * arrière en premier entre les temps/positions 3 et 4 de la sortie fille, ou entre les positions 2 et 3 de
 * la sortie garçon faire un ida e volta jambe gauche en avant en premier ».
 *
 * Measured on the samplers: at the end of action 2 of both sorties the leader stands on his D (his G is
 * free) and his next step is his G, backwards in the sortie fille (−31 cm) and forwards in the sortie
 * garçon (+34 cm); the follower stands on her G. The inserted ida e volta is his G's go-and-return
 * (one 2-beat slot of the ida e volta cycle, #107) in the direction of that next step, the follower mirroring with her D; it is a touch (owner:
 * « c'est un touch ») : the returning foot does not take the weight, which ends on the support it
 * started from, and the figure resumes from the same position.
 * Every position is in the dancer's own outer frame (as the figure samplers). */
import { sampleIdaPaire, idaNeutral, IDA_PAIR, type IdaVariant } from "./idaPaire";
import { sampleSortieFille } from "./sortieFille";
import { sampleSortieGarcon, DEFAULT_SORTIE_CONTRA, type FigureFoot, type FigureFootPose, type FootPoint } from "./sortieGarcon";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";

export type InsertionHost = "sortieF" | "sortieG";
/** Position (end of action) where the ida is inserted, its length (the G's go-and-return) and variant. */
export const INSERTION_AT = 2, INSERTION_BEATS = 2;
export const INSERTION_VARIANT: Record<InsertionHost, IdaVariant> = {
  sortieF: { side: "L", back: true },
  sortieG: { side: "L", back: false },
};
/** Length (beats) of the sortie with its inserted ida e volta (marka included). */
export const INSERTED_BEATS = 5 + INSERTION_BEATS;
/** Opening of the follower's D during an insertion in the sortie garçon (m, her own frame: to her left). */
export const INSERTION_OPEN = 0.03;
const smooth = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const other = (s: FigureFoot): FigureFoot => (s === "L" ? "R" : "L");

/** #144 (docs/spec-ida-partout.md). Owner (21 Nov.): « chaque pied qui avance ou qui recule peut devenir
 * un "ida e volta" (un simple aller retour du pied, en virgula ou non) » ; « un "touch"/marka en aller
 * retour donc si c'est le pied gauche qui sort et revient le poids reste à droite au début et à la fin et
 * c'est encore au pied gauche de bouger ensuite ».
 * A touch: before a step of the figure, the foot about to step goes and returns (2 beats), then the figure
 * resumes with that step. `at`: the position, i.e. the end of action `at` of the figure, in its own beats
 * (0: before its first step). `side`, `back`: the leader's foot and its direction, those of the step the
 * touch precedes; the follower mirrors with her other foot, as in the pair ida e volta. `virgula`: the
 * leader's G lands at a right angle when it goes forward (R26). `open`: the follower's moving foot opens
 * by this much (m, her own frame) during the touch, where it would rub the leader's. */
export interface Touch { at: number; side: FigureFoot; back: boolean; virgula?: boolean; open?: number;
  /** Length of the go-and-return, as a share of the ida e volta's step (1 by default), and lateral shift
   * of the leader's moving foot at its far point (m, his own frame), where the full straight step would
   * bring two thighs together. */
  scale?: number; aside?: number;
  /** Share of the ida e volta's foot lift kept during the touch (1 by default). */
  lift?: number }
export const TOUCH_BEATS = 2;
/** Positions where a touch is offered, per pair figure of the game mode (docs/spec-ida-partout.md): the
 * steps of the leader that go forward or backward, measured on the samplers. Not offered: the sortie
 * fille's D2 (a side step), the sortie garçon's G5 (it closes) and D4 (crossed legs), the double's second
 * step (half a beat), the quarter turn's second step (the couple is turning). */
export const TOUCH_POSITIONS: Record<string, Touch[]> = {
  avance: [{ at: 0, side: "L", back: false }, { at: 1, side: "R", back: false }],
  // D backwards: a lower foot (at the ida's full lift the two kneecaps meet in suave at amplitude 2).
  recule: [{ at: 0, side: "L", back: true }, { at: 1, side: "R", back: true, lift: 0.5 }],
  double: [{ at: 0, side: "L", back: false }],
  quart: [{ at: 0, side: "L", back: false }],
  // G1: a lower foot (as a virgula, at full lift, the kneecaps meet in semba at amplitude 2).
  // D2: a shorter go-and-return (in full, the leader's right thigh crosses the follower's in semba). D4 is
  // not offered: the leader's legs are crossed there, and his D going straight forward passes through his G.
  sortieG: [{ at: 0, side: "L", back: false, lift: 0.5 }, { at: 1, side: "R", back: false, scale: 0.8 },
    { at: INSERTION_AT, side: "L", back: false, open: INSERTION_OPEN }],
  sortieF: [{ at: 0, side: "L", back: false, lift: 0.5 }, { at: INSERTION_AT, side: "L", back: true },
    { at: 3, side: "R", back: true }, { at: 4, side: "L", back: true }],
  // #90: the chained sortie fille shares its positions up to the chain, then the sortie garçon's G3.
  sortieFG: [{ at: 0, side: "L", back: false, lift: 0.5 }, { at: INSERTION_AT, side: "L", back: true }, { at: 5, side: "L", back: false }],
};
/** The virgula is offered where the leader's G goes forward from the neutral stance (#127, #128). */
export const touchVirgula = (_kind: string, touch: Touch): boolean => touch.side === "L" && !touch.back && touch.at === 0;
/** What a figure sample must give for a touch to be added to it. */
export interface TouchHostSample {
  beat: number; feet: Record<FigureFoot, FigureFootPose>; root: { x: number; z: number };
  loadR?: number; chestYaw: number;
}

/** Where a local beat of a touched figure falls: in the figure (`hostBeat`), or in a touch (`touch`, `t`
 * beats into it, on the figure's held position `hostBeat`). `touches` are sorted by position. */
export function touchedBeat(touches: Touch[], beat: number): { hostBeat: number; touch: Touch | null; t: number } {
  let shift = 0;
  for (const touch of touches) {
    const start = touch.at + shift;
    if (beat <= start) break;
    if (beat < start + TOUCH_BEATS) return { hostBeat: touch.at, touch, t: beat - start };
    shift += TOUCH_BEATS;
  }
  return { hostBeat: beat - shift, touch: null, t: 0 };
}

/** A figure with touches (#144): `host` samples the figure at one of its own beats; `beat` is the local
 * beat of the touched figure (each touch adds `TOUCH_BEATS`). Every position is in the dancer's own frame.
 * The sample keeps the figure's own beat (held during a touch): the style then dances the figure exactly
 * as without touches, so every pose outside a touch is one of the figure's, and a touch adds the ida's
 * displacements to a pose of the figure. `styleRuns` (#91 as first delivered): the style keeps running
 * with the local beat during and after the touch. */
export function sampleTouched<S extends TouchHostSample>(host: (beat: number) => S, touches: Touch[], beat: number, follower: boolean,
  rest: Record<FigureFoot, FootPoint>, placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0,
  styleRuns = false): S & { inserted: boolean } {
  const b = Number.isFinite(beat) ? beat : 0;
  const { hostBeat, touch, t } = touchedBeat(touches, b);
  if (!touch) return { ...host(hostBeat), ...(styleRuns ? { beat: b } : {}), inserted: false };
  // The ida's displacements from its own neutral stance, added to the held position of the figure.
  const held = host(hostBeat);
  const o = placementOffset(placement);
  const variant: IdaVariant = { side: touch.side, back: touch.back, ...(touch.virgula ? { virgula: true } : {}) };
  const ida = sampleIdaPaire(t, follower, rest, o, stance, variant), start = sampleIdaPaire(0, follower, rest, o, stance, variant);
  const neutral = idaNeutral(rest, o, stance);
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  // #91: her D stands edge to edge with his D at the sortie garçon's position 2 (R9): during the touch it
  // opens to her left, so that going back and forth it does not rub his.
  const window = smooth(t / 0.3) * (1 - smooth((t - 1.7) / 0.3));
  const opening = follower && touch.open ? touch.open * window : 0, aside = !follower && touch.aside ? touch.aside * window : 0;
  const opened = other(touch.side), k = touch.scale ?? 1;
  for (const side of ["L", "R"] as FigureFoot[]) {
    const p = held.feet[side], q = ida.feet[side];
    feet[side] = { ...p, x: p.x + k * (q.x - neutral[side].x) + (side === opened ? opening : 0) + (side === touch.side ? aside : 0), z: p.z + k * (q.z - neutral[side].z),
      ...(q.yaw ? { yaw: p.yaw + q.yaw } : {}), lift: (q.lift ?? 0) * (touch.lift ?? 1), pitch: q.pitch, pivot: q.pivot };
  }
  // Weight: the outgoing step rocks onto the moving foot and back (the ida's own loads); the return is a
  // touch, the weight stays on the support (the backward slot's final transfer is not taken).
  const loadR = t < IDA_PAIR.weight.back[1] ? ida.loadR : held.loadR ?? ida.loadR;
  const extra = held as { rootYaw?: number; kneeYaw?: number };
  return { ...held, ...(styleRuns ? { beat: b } : {}), feet, loadR, loadL: 1 - loadR,
    root: { x: held.root.x + k * (ida.root.x - neutral.root.x), z: held.root.z + k * (ida.root.z - neutral.root.z) },
    chestYaw: held.chestYaw + (ida.chestYaw - start.chestYaw),
    rootYaw: (extra.rootYaw ?? 0) + (ida.rootYaw - start.rootYaw),
    // #84: the knees do not follow the ida's pelvis pivot.
    kneeYaw: (extra.kneeYaw ?? 0) + ida.kneeYaw - start.kneeYaw,
    // #128: the virgula's own knee directions.
    ...("kneeYawSide" in ida && ida.kneeYawSide ? { kneeYawSide: ida.kneeYawSide } : {}),
    inserted: true };
}

/** #91: the sortie with an ida e volta inserted at its position 2 (the first case of #144's touches). */
export function sampleInserted(host: InsertionHost, beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0,
  contraDegrees = DEFAULT_SORTIE_CONTRA) {
  const b = Math.max(0, Math.min(INSERTED_BEATS, Number.isFinite(beat) ? beat : 0));
  const o = placementOffset(placement);
  const figure = (t: number) => host === "sortieF"
    ? sampleSortieFille(t, follower, rest, "hook", o, contact, stance)
    : sampleSortieGarcon(t, follower, rest, "line", contraDegrees, o, contact, stance);
  const touch: Touch = { at: INSERTION_AT, ...INSERTION_VARIANT[host], ...(host === "sortieG" ? { open: INSERTION_OPEN } : {}) };
  return sampleTouched(figure, [touch], b, follower, rest, o, stance, true) as ReturnType<typeof figure> & { inserted: boolean; loadL?: number; kneeYaw?: number };
}
