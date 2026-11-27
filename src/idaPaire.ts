/** Ida e volta in pair (#54, docs/spec-ida-paire.md). #107 (owner, 20 Nov.: « avant gauche + retour neutre
 * en 2 temps, derrière gauche + retour, avant droit + retour, derrière droit + retour. Le tout en 8 temps »):
 * four 2-beat go-and-returns, the solo ida e volta's cycle (`idaEVoltaStep`, phase 8); the follower takes
 * the symmetric step (opposite foot, opposite direction, same lane), shown with the contraposition.
 * GLB coordinates: left +x, forward +z. Every position is in the dancer's own outer frame (the root
 * starts at the placement offset); the follower's frame faces the leader's, 2·IDA_PAIR_DZ away. */
import { gaitStep, GAIT } from "./gait";
import { COUPLE_DZ, placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";
import { idaContra, idaEVoltaStep } from "./styles";
import { SORTIE_FILLE_VIRGULA } from "./sortieFille";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

export const IDA_BEATS = 8;
/** Same half-spacing as the other pair figures: the couple placements are calibrated for it. */
export const IDA_PAIR_DZ = COUPLE_DZ;
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
 * - `carry`: share of the step the pelvises travel towards the weighted foot; `pelvisBack` (#167): the
 *   pelvis goes out through the whole outgoing step and is back at this beat of the slot (it followed the
 *   weight: out and back within a fifth of a beat each way). Back at 1.7 or later, with the default ginga,
 *   his left femur meets her right tibia in semba (measured on the GLB); 1.5 keeps a margin;
 * - `hip` (#84, owner: « un côté de la hanche avance/recule et l'autre côté reste »): the pelvis turns
 *   about the standing hip; the hip of the moving foot follows this share of the leader's step (forward
 *   for him, backward for her: the gap between the pelvises stays). It replaces the phase 15 pelvis yaw;
 * - `kneeFoot` (#84): share of the pelvis pivot the knees do not follow (`kneeYaw`): 1 keeps them over
 *   the feet, 1.2 a little further; the pivot no longer swings them sideways into the partner's;
 * - `coupling`, `kneeCap`, `rotationCap`, `dip`, `sway`: pelvis and style bounds in the close couple. */
export const IDA_PAIR = {
  step: 0.18, out: [0.1, 0.8], ret: [1.2, 1.85], share: 0.7, delay: 0.15,
  weight: { on: [0.8, 1.0], back: [1.0, 1.2], home: [1.85, 2.0] },
  aside: 0.02, carry: 0.5, pelvisBack: 1.5, forwardRoll: 0.3, backRoll: 0.3,
  hip: 0.15, kneeFoot: 1.2, coupling: 1, kneeCap: 0.22, rotationCap: 0.035, dip: -0.008, sway: 1,
};

/** #210 (owner, 24 Nov. 2026): the ida e volta is a go-and-return of the foot that never lets the whole weight
 * go onto the foot that goes out, forward or backward, with or without the virgula. Elected on film on 25 Nov.
 * (docs/spec-ida-poids.md, question 31: C): the outgoing foot takes three quarters of the weight.
 * - `share`: share of the weight the outgoing foot takes on the beat, given back to the other foot before the
 *   return. The pelvis travels that share of the whole weight's way (`IDA_PAIR.carry`, the hip pivot unchanged),
 *   and the ginga goes that far towards the foot and comes back the same way.
 * The other candidates stay under `?idaPoids=<name>` (`entier`: the whole weight, the model before the vote). */
export interface IdaWeight { share: number }
export const IDA_WEIGHT_ELECTED: IdaWeight = { share: 0.75 };
export const IDA_WEIGHT_CANDIDATES: Record<string, IdaWeight> = {
  entier: { share: 1 }, peu: { share: 0.2 }, moitie: { share: 0.5 }, troisQuarts: IDA_WEIGHT_ELECTED,
};
export const IDA_WEIGHT_PROTO = { v: IDA_WEIGHT_ELECTED };
export const setIdaWeightProto = (name?: string | null) => {
  IDA_WEIGHT_PROTO.v = (name && IDA_WEIGHT_CANDIDATES[name]) || IDA_WEIGHT_ELECTED;
};

/** #210 (owner, 25 Nov. 2026): the go-and-returns follow one another without the ginga stopping: the hips keep
 * swaying from one to the next. `v` 1 (default): the style's phase moves all along the cycle, each transfer's swing
 * spread from half-way after the transfer before it to half-way before the one after it (`idaGingaWindows`): the hip
 * arrives over the outgoing foot as the weight does, on the beat, and is back on the other side as the next foot
 * leaves. The hips then also sway while one foot is in the air: that foot bends its knee instead of lifting the pelvis
 * (`bear` 0, as in the rolled walk, R34); otherwise the pelvis jumped up as the foot left the floor (measured in the
 * game mode, scripts/test_saccades.mjs: 1.9 cm within an eighth of a beat, 0.7 cm with it).
 * `v` 0 (`?idaGinga=tenu`): the model before, the swing within the transfer itself, held on the support in between. */
export const IDA_GINGA_FLOW = { v: 1 };

/** #210 (owner, 25 Nov. 2026: no pose held on the beats; the pelvis draws an 8, the hip carries the step and finishes
 * the weight transfer). With the ginga flowing, the pelvis's travel forward and back and its pivot about the standing
 * hip are periodic curves over the whole cycle instead of one go and return per slot held in between (measured on the
 * GLB, scripts/mesure_vitesse_bassin_ida.mjs: the pelvis stood still, 0 cm and 0° per beat, at every even beat, and
 * under 0.6 cm per beat on every odd one). They pass the neutral stance at the slot boundaries without stopping there,
 * and reach their furthest `lag` after the weight arrives (`idaFlowBeat`): there the ginga turns back on its own
 * beat while the pelvis still travels, so the three never stop together. */
export const IDA_FLOW = { lag: 0.4 };
/** #210: the cycle's beat warped so that the slot boundaries stay where they are and the middle of each slot (the
 * weight's beat) comes `IDA_FLOW.lag` later (about 0.3 beat for a lag of 0.4); always increasing. */
export const idaFlowBeat = (b: number) => b - IDA_FLOW.lag * Math.sin(Math.PI * b / 2) ** 2;
/** #210: the pivot's curve over the flowing cycle (towards the moving foot: L forward, L back, R forward, R back),
 * scaled so that its furthest is 1, as far as the moving hip went with the foot before. */
const pivotWave = (u: number) => Math.sin(Math.PI * u / 2) * Math.cos(Math.PI * (u - 2) / 4);
const PIVOT_PEAK = Math.max(...Array.from({ length: 801 }, (_, k) => Math.abs(pivotWave(k / 100))));
export const setIdaGingaFlow = (name?: string | null) => { IDA_GINGA_FLOW.v = name === "tenu" ? 0 : 1; };

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
/** #163 (docs/spec-ginga-couple.md): the ida e volta holds the couple's bounce to `cap` (m) over `window`
 * (cycle beats: down, held, up). Measured on the GLB every sixteenth of a beat: with 14 mm the leg bones
 * cross at 4.81 and 5.19 (semba); with 9 mm they do not. */
export const IDA_GINGA_BOUNCE = { cap: 0.009, window: [4.45, 4.7, 5.3, 5.55] };
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
export interface IdaTransfer { start: number; end: number; from: FigureFoot; to: FigureFoot;
  /** #210: share of the whole weight that moves (1: all of it, from one foot to the other). */
  amount: number;
  /** #210: a partial transfer that gives back what the one before it took: the ginga goes back the way it came. */
  returning: boolean }
/** Every support transfer of a dancer over the cycle (ten, alternating feet): in each slot the weight
 * goes onto the outgoing foot on the beat, then rocks back onto the other foot; after a backward slot the
 * returning foot takes the weight as it lands, so that the other foot is free for the next slot (G then D:
 * #107). #210: the outgoing foot takes `IDA_WEIGHT_PROTO.v.share` of the weight and gives it back; the
 * returning foot's transfer after a backward slot is a whole one (the feet are side by side). */
export function idaTransfers(follower: boolean): IdaTransfer[] {
  const w = IDA_PAIR.weight, list: IdaTransfer[] = [], share = IDA_WEIGHT_PROTO.v.share, partial = share < 1;
  for (let index = 0; index < 4; index++) {
    const side: FigureFoot = index < 2 ? "L" : "R", moving = follower ? other(side) : side, slot = 2 * index;
    list.push({ start: slot + w.on[0], end: slot + w.on[1], from: other(moving), to: moving, amount: share, returning: false });
    list.push({ start: slot + w.back[0], end: slot + w.back[1], from: moving, to: other(moving), amount: share, returning: partial });
    if (index % 2 === 1) list.push({ start: slot + w.home[0], end: slot + w.home[1], from: other(moving), to: moving, amount: 1, returning: false });
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
    // Each transfer moves its share of the weight from where the one before it left the feet.
    loadR = Math.max(0, Math.min(1, loadR + (t.to === "R" ? 1 : -1) * t.amount * k));
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
export interface IdaVariant { side: FigureFoot; back: boolean;
  /** #128 (owner, 21 Nov.: the virgula « peut être un effet de style lors du ida e volta »): the leader's
   * G forward step lands at a right angle, with the geometry of the sortie fille's virgula (#127). */
  virgula?: boolean }
export const IDA_DEFAULT: IdaVariant = { side: "L", back: false };
/** #128: the virgula of the ida e volta, in the slot where the leader's G goes forward. The geometry is
 * the sortie fille's (`SORTIE_FILLE_VIRGULA`: ankle `beside` his D's, right angle, pelvis and G knee
 * opening); the foot pivots over the end of its flight out and comes back forward over its return, the
 * pelvis and the knee with it. The follower's step does not change. Calibrated on the GLB
 * (docs/spec-ida-paire.md, section #128). */
export const IDA_VIRGULA = { ...SORTIE_FILLE_VIRGULA,
  /** Share of the step after which the foot comes in next to his D: earlier, it would cross the lane of
   * the follower's D, which retreats next to it (quinconce). */
  inFrom: 0.5 };
const late = (x: number, start: number) => smooth((x - start) / Math.max(1e-6, 1 - start));

/** The feet at `b` (variant-shifted beat, own frame). The follower takes the symmetric step: her opposite
 * foot, the opposite direction, on the same lane. */
function idaFeet(b: number, follower: boolean, neutral: ReturnType<typeof idaNeutral>, virgula = false) {
  const now = idaStepAt(b);
  // #128: the leader's G forward slot (the first of the cycle) as a virgula.
  const comma = virgula && !follower && now.index === 0;
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
  // #128: a foot landing turned out lands on its ball (the travel is across its own axis).
  const gait = gaitStep(raw, { x: 0, z: to - from }, comma && going ? IDA_VIRGULA.yaw : 0, ahead ? IDA_PAIR.forwardRoll : IDA_PAIR.backRoll);
  // #128: share of the virgula's turn (foot and knee) and of the pelvis opening: over the end of the flight
  // out, held under the weight, back over the return.
  const out = !comma ? 0 : going ? late(raw, IDA_VIRGULA.yawFrom) : 1 - smooth(raw);
  const opening = !comma ? 0 : going ? late(raw, IDA_VIRGULA.pelvisFrom) : 1 - smooth(raw);
  const feet = {} as Record<FigureFoot, FigureFootPose>;
  for (const side of ["L", "R"] as FigureFoot[]) {
    const n = neutral[side];
    if (side === moving) {
      const along = from + (to - from) * gait.progress;
      // The moving left foot opens to its left during its flight; the virgula instead comes in next to his D.
      const open = comma ? (neutral.R.x + IDA_VIRGULA.beside - n.x) * late(along / step, IDA_VIRGULA.inFrom)
        : side === "L" && raw > 0 && raw < 1 ? IDA_PAIR.aside * smooth(raw / 0.25) * (1 - smooth((raw - 0.75) / 0.25)) : 0;
      feet[side] = { x: n.x + open, z: n.z + along, yaw: IDA_VIRGULA.yaw * out, lift: gait.lift,
        pitch: gait.pitch, pivot: gait.pivot, ...(IDA_GINGA_FLOW.v ? { bear: 0 } : {}) };
    } else feet[side] = { x: n.x, z: n.z, yaw: 0, lift: 0 };
  }
  return { now, moving, forward, step, feet, out, opening };
}

export function sampleIdaPaire(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", stance = 0, variant: IdaVariant = IDA_DEFAULT,
  /** #210: a single go-and-return inserted in another figure (#144, src/insertion.ts) keeps the pelvis path of its own
   * slot, which starts and ends at the neutral stance. */
  slot = false) {
  const styleOffset = (variant.side === "R" ? 4 : 0) + (variant.back ? 2 : 0);
  const b = (Number.isFinite(beat) ? beat : 0) + styleOffset;
  const o = placementOffset(placement);
  const neutral = idaNeutral(rest, o, stance);
  const { now, moving, forward, feet, out, opening } = idaFeet(b, follower, neutral, variant.virgula);
  // Weight: rock step, onto the outgoing foot on the beat and back onto the other foot; the return comes
  // back unloaded.
  const w = IDA_PAIR.weight;
  const p0 = ((b % IDA_BEATS) + IDA_BEATS) % IDA_BEATS;
  const loadR = idaLoadR(p0, follower);
  // #84: the pelvis turns about the standing hip; the hip of the moving foot follows the leader's step
  // (forward for him, backward for her), so the gap between the pelvises stays. Both pelvises still travel
  // with the weight: the gap (and the plexus contact) stays.
  const hipSpan = Math.max(0.05, neutral.L.x - neutral.R.x);
  const lead = idaFeet(b, false, neutral);
  const leadOffset = lead.feet[lead.moving].z - neutral[lead.moving].z;
  const flowing = IDA_GINGA_FLOW.v > 0 && !slot, u = idaFlowBeat(b);
  // #210: with the ginga flowing, the moving hip's advance and the pivot follow the leader's steps over the whole cycle
  // (forward, back, forward, back: a period of 4 beats; the pivot turns towards the moving foot: L, then R).
  const slotHip = IDA_PAIR.hip * (follower ? -leadOffset : leadOffset), slotPivot = (moving === "L" ? -1 : 1) * slotHip / hipSpan;
  // #128: the virgula opens the pelvis itself; there the pivot goes back to its own slot's (the chest, facing the
  // partner, keeps its direction within 1°: measured on the GLB, the flowing pivot added to the opening turned it 3°).
  const own = smooth(Math.max(opening, out));
  const hip = flowing ? IDA_PAIR.hip * IDA_PAIR.step * (follower ? -1 : 1) * Math.sin(Math.PI * u / 2) : slotHip;
  const pivot = flowing ? -IDA_PAIR.hip * IDA_PAIR.step / hipSpan * pivotWave(u) / PIVOT_PEAK * (1 - own) + slotPivot * own : slotPivot;
  // #128: the pelvis opens to his left with the virgula; the chest keeps its own direction (`upper`).
  const lower = pivot + IDA_VIRGULA.pelvis * opening;
  // #167: the pelvis goes out through the whole outgoing step (from the moment the foot leaves to the beat
  // where the weight arrives) and comes back over half a beat (`pelvisBack`). It followed the weight, which
  // rocks onto the foot and back within a fifth of a beat each way: a jab. Its place on the beat is unchanged.
  const through = smooth((now.q - IDA_PAIR.out[0]) / (w.on[1] - IDA_PAIR.out[0])) * (1 - smooth((now.q - w.back[0]) / (IDA_PAIR.pelvisBack - w.back[0])));
  // #210: the pelvis goes as far as the weight does (today's way for the whole weight).
  const carry = IDA_PAIR.carry * IDA_WEIGHT_PROTO.v.share;
  // #210: flowing, the pelvis's travel with the weight follows the same periodic curve as the hip's advance.
  const travel = flowing ? (follower ? -1 : 1) * carry * IDA_PAIR.step * Math.sin(Math.PI * u / 2) : forward * carry * IDA_PAIR.step * through;
  const root = { x: neutral.root.x, z: neutral.root.z + travel + hip / 2 };
  // Phase 15 contraposition of the chest, on the dancer's own moving foot (the follower mirrors the
  // leader). The leader's upper body leads by IDA_LEAD.
  const sign = follower ? -1 : 1;
  const upper = sign * idaContra(follower ? b : b + IDA_LEAD).upperYaw;
  // The support transfer under way (explicit for the ginga #42), with its progress.
  const p = ((b % IDA_BEATS) + IDA_BEATS) % IDA_BEATS;
  const current = idaTransfers(follower).find(t => p >= t.start && p < t.end);
  const W = IDA_GINGA_BOUNCE.window;
  const transfer = current ? { ...current, progress: smooth((p - current.start) / (current.end - current.start)) } : null;
  return { beat: Number.isFinite(beat) ? beat : 0, action: now.index, moving, feet, root, rootYaw: lower, chestYaw: upper - lower, kneeYaw: IDA_PAIR.kneeFoot * pivot, styleOffset,
    // #128: with the virgula the G knee points out between the pelvis and the foot, the D knee as before.
    ...(out > 0 || opening > 0 ? { kneeYawSide: { L: IDA_VIRGULA.pelvis * opening - IDA_VIRGULA.knee * out, R: IDA_VIRGULA.pelvis * opening } } : {}),
    // Coupled pelvises (quinconce): the follower's style mirrors the leader's, so she follows his phase
    // (her transfers are his, mirrored); her lateral hip shift goes to her own support (opposite sign).
    gingaBeat: idaGingaBeat(b, follower && IDA_GINGA.mode === "own"),
    gingaAmp: follower ? IDA_GINGA.follower : IDA_GINGA.leader,
    gingaSway: (follower && IDA_GINGA.mode !== "own" ? -1 : 1) * IDA_GINGA.sway,
    loadR, loadL: 1 - loadR, support: (loadR >= 0.5 ? "R" : "L") as FigureFoot, transfer, cyclic: true as const,
    coupling: IDA_GINGA.mode === "own" ? 0 : IDA_PAIR.coupling * Math.min(1, Math.hypot(o.x, o.z) / 0.05),
    kneeCap: IDA_PAIR.kneeCap, rotationCap: IDA_PAIR.rotationCap, dip: IDA_PAIR.dip, sway: IDA_PAIR.sway,
    // #163: the ida e volta takes the bounce of the largest setting, except around its cycle beat 5.
    gingaCap: { sway: 1, bounce: IDA_GINGA_BOUNCE.cap },
    gingaCapRoom: { sway: 1, bounce: 1 - smooth((p - W[0]) / (W[1] - W[0])) * (1 - smooth((p - W[2]) / (W[3] - W[2]))) } };
}

/** #210: the beats over which each transfer swings the style's phase. With the ginga flowing (`IDA_GINGA_FLOW`),
 * from half-way after the transfer before it to half-way before the one after it: the windows follow one another
 * over the whole cycle (the first may start before 0, the last end after `IDA_BEATS`). Otherwise the transfer's own
 * beats. */
export function idaGingaWindows(follower: boolean): { start: number; end: number }[] {
  const list = idaTransfers(follower), n = list.length;
  return list.map((t, k) => {
    if (!IDA_GINGA_FLOW.v) return { start: t.start, end: t.end };
    const before = list[(k + n - 1) % n], after = list[(k + 1) % n];
    const beforeEnd = before.end - (k === 0 ? IDA_BEATS : 0), afterStart = after.start + (k === n - 1 ? IDA_BEATS : 0);
    return { start: (beforeEnd + t.start) / 2, end: (t.end + afterStart) / 2 };
  });
}

/** #42: phase of the style's hip pattern driven by the support transfers. The style puts full weight on
 * the left foot at phase 0.5 and on the right at 1.5 (support = -S2): each whole transfer advances the phase
 * by one beat. Continuous over cycles. #210: a partial transfer advances it until the style's support is the
 * figure's, and the one that gives the weight back goes back the same way (the hip goes towards the foot and
 * comes back); each swing spreads over its window (`idaGingaWindows`): with the ginga flowing the phase never
 * holds. */
export function idaGingaBeat(beat: number, follower: boolean): number {
  const b = Number.isFinite(beat) ? beat : 0;
  const cycle = Math.floor(b / IDA_BEATS), p = b - cycle * IDA_BEATS;
  const transfers = idaTransfers(follower), windows = idaGingaWindows(follower);
  let phase = transfers[0].from === "R" ? 1.5 : 0.5, net = 0;
  transfers.forEach((t, k) => {
    // The style's support is -sin(π·phase): advancing by acos(1 - 2·amount)/π puts on the foot the share of
    // the weight the figure gives it.
    const step = (t.returning ? -1 : 1) * Math.acos(Math.max(-1, Math.min(1, 1 - 2 * t.amount))) / Math.PI;
    const { start, end } = windows[k], at = (x: number) => smooth((x - start) / (end - start));
    net += step;
    // This cycle's swing, the end of the previous cycle's, the start of the next one's.
    phase += step * (at(p) + at(p + IDA_BEATS) - 1 + at(p - IDA_BEATS));
  });
  return cycle * net + phase;
}
