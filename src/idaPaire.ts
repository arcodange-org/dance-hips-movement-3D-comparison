/** Ida e volta in pair (#54, docs/spec-ida-paire.md). #107 (owner, 20 Nov.: « avant gauche + retour neutre
 * en 2 temps, derrière gauche + retour, avant droit + retour, derrière droit + retour. Le tout en 8 temps »):
 * four 2-beat go-and-returns, the solo ida e volta's cycle (`idaEVoltaStep`, phase 8); the follower takes
 * the symmetric step (opposite foot, opposite direction, same lane), shown with the contraposition.
 * GLB coordinates: left +x, forward +z. Every position is in the dancer's own outer frame (the root
 * starts at the placement offset); the follower's frame faces the leader's, 2·IDA_PAIR_DZ away. */
import { gaitStep, GAIT } from "./gait";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import { idaContra, idaEVoltaStep } from "./styles";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

export const IDA_BEATS = 8;
/** Same half-spacing as the other pair figures: the couple placements are calibrated for it. */
export const IDA_PAIR_DZ = 0.20;
/** The leader's upper body anticipates by a quarter beat (owner rule, #37). */
export const IDA_LEAD = 0.25;
/** Proposals to validate by eye (owner), calibrated on the GLB (docs/spec-ida-paire.md, Calibrage):
 * - `step`: length of the forward/backward step (m), the phase 8 amplitude (±9 cm);
 * - `out`, `ret`: flight windows of the outgoing step and of the return (beats from the start of the
 *   2-beat slot, the leader's);
 * - `weight`: the weight moves onto the outgoing foot on the beat (`on`) and rocks back onto the other
 *   foot (`back`) before the return, which comes back unloaded; after a backward slot the returned foot
 *   takes the weight (`home`); see `idaTransfers`;
 * - when the follower steps back her foot leaves the floor with his (R24) and lands after `share` of his
 *   flight; when the leader steps back, hers leaves
 *   `delay` later (#88);
 * - `forwardRoll`, `backRoll`: share of the walking roll (src/gait.ts) of forward and backward steps;
 * - `aside`: a moving left foot (the outer lane of each pair of feet in quinconce: the leader's G next to
 *   the follower's D, the follower's G next to the leader's D) opens this far to its left during its
 *   flight, so the two knees that travel side by side clear each other;
 * - `carry`: share of the step the pelvises travel with the weight;
 * - `pelvisYaw`: share of the phase 15 pelvis yaw (idaContra) kept in the close couple: the yaw brings
 *   the standing thighs of the outer lane towards each other;
 * - `coupling`, `kneeCap`, `rotationCap`, `dip`, `sway`: pelvis and style bounds in the close couple. */
export const IDA_PAIR = {
  step: 0.18, out: [0.1, 0.8], ret: [1.2, 1.85], share: 0.7, delay: 0.15,
  weight: { on: [0.8, 1.0], back: [1.0, 1.2], home: [1.85, 2.0] },
  aside: 0.02, carry: 0.5, forwardRoll: 0.3, backRoll: 0.3,
  pelvisYaw: 0.5, coupling: 1, kneeCap: 0.22, rotationCap: 0.035, dip: -0.008, sway: 1,
};

/** #88: the follower never leaves before the leader. On an outgoing step both moving feet leave at
 * `start` (beats into the slot); her backward foot lands `backFlight` later, clearing the lane before his
 * forward foot (which keeps landing at `IDA_PAIR.flight`). */
export const IDA_PAIR_SYNC = { start: .3, backFlight: .5 };

/** #42 (docs/spec-ginga.md): the ginga is triggered at each support transfer. The style's own hip
 * pattern (one transfer per beat, `S2`) is driven by the figure's transfers instead of the clock;
 * `sway` adds that share of the style's lateral hip shift to the figure's pelvis, `leader` scales the
 * leader's ginga (he transmits it, the follower pronounces it). Proposals to validate by eye. */
export const IDA_GINGA = { sway: 0.25, leader: 0.7, follower: 1, mode: "leaderPhase" as "leaderPhase" | "own" };

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const other = (s: FigureFoot): FigureFoot => (s === "L" ? "R" : "L");

export interface IdaStep {
  /** Step slot (0–3): leader G forward, G back, D forward, D back (each out and return). */
  index: number;
  /** Beat within the 2-beat slot. */
  q: number;
  /** The leader's moving foot. */
  side: FigureFoot;
  /** +1: the leader steps forward (the follower back); -1: the leader steps back. */
  dir: 1 | -1;
}
export function idaStepAt(beat: number): IdaStep {
  const b = Number.isFinite(beat) ? beat : 0;
  const p = ((b % IDA_BEATS) + IDA_BEATS) % IDA_BEATS;
  const index = Math.min(3, Math.floor(p / 2));
  const { side, dir } = idaEVoltaStep(b);
  return { index, q: p - index * 2, side, dir };
}

/** One support transfer: the weight moves from one foot to the other between `start` and `end`
 * (beats in the 8-beat cycle). The ginga (#42) is triggered at each left/right alternation. */
export interface IdaTransfer { start: number; end: number; from: FigureFoot; to: FigureFoot }
/** Every support transfer of a dancer over the cycle (ten, alternating feet): in each slot the weight
 * goes onto the outgoing foot on the beat, then rocks back onto the other foot; after a backward slot the
 * returning foot takes the weight as it lands, so that the other foot is free for the next slot (G then D:
 * #107). */
export function idaTransfers(follower: boolean): IdaTransfer[] {
  const w = IDA_PAIR.weight, list: IdaTransfer[] = [];
  for (let index = 0; index < 4; index++) {
    const side: FigureFoot = index < 2 ? "L" : "R", moving = follower ? other(side) : side, slot = 2 * index;
    list.push({ start: slot + w.on[0], end: slot + w.on[1], from: other(moving), to: moving });
    list.push({ start: slot + w.back[0], end: slot + w.back[1], from: moving, to: other(moving) });
    if (index % 2 === 1) list.push({ start: slot + w.home[0], end: slot + w.home[1], from: other(moving), to: moving });
  }
  return list;
}

/** Load on the right foot at a beat of the cycle, from the transfers (the cycle starts on the leader's
 * D, the follower's G). */
function idaLoadR(p: number, follower: boolean): number {
  let loadR = follower ? 0 : 1;
  for (const t of idaTransfers(follower)) {
    if (p <= t.start) break;
    const k = smooth((p - t.start) / (t.end - t.start));
    loadR = t.to === "R" ? Math.max(loadR, k) : Math.min(loadR, 1 - k);
  }
  return loadR;
}

/** Neutral stance (own frame): feet under the hips, placement offset, right foot staggered. */
export function idaNeutral(rest: Record<FigureFoot, FootPoint>, o: PlacementOffset, stance = 0) {
  const widen = Number.isFinite(stance) ? stance : 0;
  const stagger = (o.stagger ?? 0) / 2;
  return {
    L: { x: rest.L.x + widen + o.x, z: rest.L.z + o.z },
    R: { x: rest.R.x - widen + o.x, z: rest.R.z + o.z + stagger },
    root: { x: o.x, z: o.z },
  };
}

/** #89 (game mode arrows): the leg that starts (`side`, the leader's; left by default) and whether the
 * leader starts backwards (`back`). #107: both are the same cycle started later (right leg: beat 4,
 * backwards: beat 2), so the variants have the same poses. */
export interface IdaVariant { side: FigureFoot; back: boolean }
export const IDA_DEFAULT: IdaVariant = { side: "L", back: false };

export function sampleIdaPaire(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0, variant: IdaVariant = IDA_DEFAULT) {
  const b = (Number.isFinite(beat) ? beat : 0) + (variant.side === "R" ? 4 : 0) + (variant.back ? 2 : 0);
  const o = placementOffset(placement);
  const neutral = idaNeutral(rest, o, stance);
  const now = idaStepAt(b);
  // The follower takes the symmetric step: her opposite foot, the opposite direction, on the same lane.
  const moving: FigureFoot = follower ? other(now.side) : now.side;
  const forward = (follower ? -1 : 1) * now.dir;
  const step = IDA_PAIR.step * forward;
  // #88: when the follower steps back, her foot leaves with the leader's (never before) and clears the
  // lane first; when the leader steps back, his foot leads and hers follows `delay` later.
  const flight = ([a, e]: number[], leaderForward: boolean) => {
    // Her backward foot leaves the floor at the same instant as his forward foot: her start makes up for
    // her shorter push-off (src/gait.ts), then her shorter flight clears the lane first.
    const lag = GAIT.push * (e - a) * (IDA_PAIR.forwardRoll - IDA_PAIR.backRoll * IDA_PAIR.share);
    const [start, end] = !follower ? [a, e] : leaderForward ? [a + lag, a + lag + IDA_PAIR.share * (e - a)] : [a + IDA_PAIR.delay, e];
    return Math.max(0, Math.min(1, (now.q - start) / (end - start)));
  };
  const going = now.q < (IDA_PAIR.out[1] + IDA_PAIR.ret[0]) / 2;
  const raw = going ? flight(IDA_PAIR.out, now.dir > 0) : flight(IDA_PAIR.ret, now.dir < 0);
  const from = going ? 0 : step, to = going ? step : 0;
  const ahead = to - from > 0;
  const gait = gaitStep(raw, { x: 0, z: to - from }, 0, ahead ? IDA_PAIR.forwardRoll : IDA_PAIR.backRoll);
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  for (const side of ["L", "R"] as FigureFoot[]) {
    const n = neutral[side];
    if (side === moving) {
      const open = side === "L" && raw > 0 && raw < 1 ? IDA_PAIR.aside * smooth(raw / 0.25) * (1 - smooth((raw - 0.75) / 0.25)) : 0;
      feet[side] = { x: n.x + open, z: n.z + from + (to - from) * gait.progress, yaw: 0, lift: gait.lift,
        pitch: gait.pitch, pivot: gait.pivot };
    } else feet[side] = { x: n.x, z: n.z, yaw: 0, lift: 0 };
  }
  // Weight: rock step, onto the outgoing foot on the beat and back onto the other foot; the return comes
  // back unloaded.
  const w = IDA_PAIR.weight;
  const onMoving = smooth((now.q - w.on[0]) / (w.on[1] - w.on[0])) * (1 - smooth((now.q - w.back[0]) / (w.back[1] - w.back[0])));
  const p0 = ((b % IDA_BEATS) + IDA_BEATS) % IDA_BEATS;
  const loadR = idaLoadR(p0, follower);
  // Both pelvises travel together with the weight: the gap between them (and the plexus contact) stays.
  const root = { x: neutral.root.x, z: neutral.root.z + forward * IDA_PAIR.carry * IDA_PAIR.step * onMoving };
  // Phase 15 contraposition on the dancer's own moving foot (the follower mirrors the leader: opposite
  // world yaws, like the coupled pelvises). The leader's upper body leads by IDA_LEAD.
  const sign = follower ? -1 : 1;
  const lower = sign * IDA_PAIR.pelvisYaw * idaContra(b).lowerYaw;
  const upper = sign * idaContra(follower ? b : b + IDA_LEAD).upperYaw;
  // The support transfer under way (explicit for the ginga #42), with its progress.
  const p = ((b % IDA_BEATS) + IDA_BEATS) % IDA_BEATS;
  const current = idaTransfers(follower).find(t => p >= t.start && p < t.end);
  const transfer = current ? { ...current, progress: smooth((p - current.start) / (current.end - current.start)) } : null;
  return { beat: Number.isFinite(beat) ? beat : 0, action: now.index, moving, feet, root, rootYaw: lower, chestYaw: upper - lower,
    // Coupled pelvises (quinconce): the follower's style mirrors the leader's, so she follows his phase
    // (her transfers are his, mirrored); her lateral hip shift goes to her own support (opposite sign).
    gingaBeat: idaGingaBeat(b, follower && IDA_GINGA.mode === "own"),
    gingaAmp: follower ? IDA_GINGA.follower : IDA_GINGA.leader,
    gingaSway: (follower && IDA_GINGA.mode !== "own" ? -1 : 1) * IDA_GINGA.sway,
    loadR, loadL: 1 - loadR, support: (loadR >= 0.5 ? "R" : "L") as FigureFoot, transfer, cyclic: true as const,
    coupling: IDA_GINGA.mode === "own" ? 0 : IDA_PAIR.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05),
    kneeCap: IDA_PAIR.kneeCap, rotationCap: IDA_PAIR.rotationCap, dip: IDA_PAIR.dip, sway: IDA_PAIR.sway };
}

/** #42: phase of the style's hip pattern driven by the support transfers. The style puts full weight on
 * the left foot at phase 0.5 and on the right at 1.5 (support = -S2): each transfer advances the phase by
 * one beat with its progress, and it holds on the support between transfers. Continuous over cycles
 * (six transfers per 8-beat cycle). */
export function idaGingaBeat(beat: number, follower: boolean): number {
  const b = Number.isFinite(beat) ? beat : 0;
  const cycle = Math.floor(b / IDA_BEATS), p = b - cycle * IDA_BEATS;
  const transfers = idaTransfers(follower);
  let phase = transfers[0].from === "R" ? 1.5 : 0.5;
  for (const t of transfers) {
    if (p >= t.end) phase += 1;
    else if (p > t.start) phase += smooth((p - t.start) / (t.end - t.start));
  }
  return cycle * transfers.length + phase;
}
