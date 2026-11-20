import { HIP_WIDTH } from "./anatomy";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";
import { gaitStep } from "./gait";
import { placementOffset, startCoupling, endCoupling, type CouplePlacement, type PlacementOffset } from "./placement";

export type SortieFilleVariant = "hook" | "back";
export const SORTIE_FILLE_BEATS = 5;
export const SORTIE_FILLE_PAIR_DZ = 0.20;
/** #49: share of the roll of the first two (interleaved) steps: a full heel rise would push a knee into the partner's. */
export const SORTIE_FILLE_FIRST_ROLL = 0.2;
/** #49: share of the roll of the follower's G4, crossing in front of her planted D, and of her D3
 * closing the D/D contact. */
export const SORTIE_FILLE_CROSS_ROLL = 0.3;
export const SORTIE_FILLE_ACTIONS = [
  "Départ · G leader / D suiveur disponibles",
  "1 · G leader avance / D suiveur recule",
  "2 · Crochet D leader / G suiveur sort à gauche",
  "3 · G leader recule / D suiveur avance en diagonale",
  "4 · D leader dégage / G suiveur croise",
  "5 · Marka G leader et D suiveur",
] as const;

export function sortieFilleVariantOf(value: string | null): SortieFilleVariant {
  return value === "back" ? "back" : "hook";
}

/** Delay (in beats) of the leader's D2 after the follower's G2, proportional to the close start. */
export function sortieFilleHookLead(offset: PlacementOffset): number {
  // #51: 0.06 beat more since the shorter opening keeps her G knee closer to his hooked D.
  return 0.06 + 0.08 * Math.min(1, Math.hypot(offset.x, offset.z) / 0.05);
}

export function sortieFilleBeat(beat: number): number {
  return Number.isFinite(beat) ? Math.max(0, Math.min(SORTIE_FILLE_BEATS, beat)) : 0;
}

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const interpolate = (a: FootPoint, b: FootPoint, t: number): FootPoint =>
  ({ x: mix(a.x, b.x, t), z: mix(a.z, b.z, t) });

interface Action {
  foot: FigureFoot;
  target: FootPoint;
  body: FootPoint;
  corner?: FootPoint;
  // Which coordinate of the (possibly shifted) start the corner keeps, so that each
  // segment keeps its direction when the couple placement shifts the start.
  keep?: "x" | "z";
  delay?: number;
}

export function sampleSortieFille(beat: number, follower: boolean,
  rest: Record<FigureFoot, FootPoint>, variant: SortieFilleVariant = "hook",
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0) {
  const b = sortieFilleBeat(beat);
  const index = Math.min(4, Math.floor(b));
  const t = b - index;
  const back = variant === "back";
  // Owner request (19 Nov.): at action 3 the upper right thighs touch. The follower's pelvis comes
  // 2 cm (hook) or 3 cm (back) closer to the leader's; `contact` fades this above amplitude 1.
  const touch = Number.isFinite(contact) ? Math.max(0, Math.min(1, contact)) : 1;
  const halfHip = HIP_WIDTH / 2;
  const firstLeaderZ = .12;
  // #51: the follower's D1 retreats 45 cm in the hook (55 before) so the couple keeps its plexus
  // contact longer; shorter, her knees meet the leader's (six styles, quinconce, measured on the GLB).
  const firstFollowerZ = back ? -.42 : -.45;
  // #51 (owner choice: shorter opening): the follower's G2 opens 45 cm in the hook (55 before), 6 cm
  // behind her line so that her D3 passes in front of it; her pelvis follows the opening. Like the
  // contacts, the shorter opening fades back above amplitude 1 (`touch`).
  const secondFollowerX = back ? HIP_WIDTH : mix(.55, .45, touch);
  const secondLeader: FootPoint = { x: back ? 0 : -halfHip, z: back ? -.07 : rest.L.z + firstLeaderZ - rest.R.z };
  // Align the two right ankles longitudinally. The follower's +x is the
  // leader's right; the clearance is measured between those ankle targets.
  const approach: FootPoint = {
    // #51: the D/D contact of action 3 is 7 cm closer to the line in the hook (shorter opening);
    // like the thigh contact it fades back above amplitude 1.
    x: (back ? .22 : mix(.28, .21, touch)) - 2 * rest.R.x - secondLeader.x,
    z: 2 * SORTIE_FILLE_PAIR_DZ - 2 * rest.R.z - secondLeader.z,
  };
  const leaderEndZ = secondLeader.z - .64;
  // #48: the figure ends in the neutral position, the start translated along the line. The leader's
  // last landings define the translation; the follower's mirror it exactly (her frame faces his).
  const leaderEnd: FootPoint = { x: .065, z: leaderEndZ };
  const returnZ = -leaderEnd.z;
  const mark: FootPoint = { x: -leaderEnd.x, z: returnZ };
  // Positions are offsets in each dancer's own frame. For the suiveur,
  // a positive x offset therefore moves to the leader's right.
  // After her G4 the follower's pelvis stays 12 cm behind it (measured window 0.11–0.12 on the GLB,
  // six styles): closer, her knees meet the leader's in his lunge; further, her own legs cross.
  const steps: Action[] = follower ? [
    { foot: "R", target: { x: .07, z: firstFollowerZ }, body: { x: 0, z: firstFollowerZ * .43 } },
    { foot: "L", target: { x: secondFollowerX, z: back ? .13 : -.06 * touch }, body: { x: back ? .22 : .33 * secondFollowerX / .55, z: back ? -.005 : -.12 } },
    { foot: "R", target: approach, body: { x: mix(back ? .36 : .43, back ? .33 : .41, touch), z: back ? .44 : .30 } },
    { foot: "L", target: mark, body: { x: .16, z: returnZ - .12 },
      corner: { x: secondFollowerX, z: returnZ }, keep: "x", delay: .24 },
    { foot: "R", target: mark, body: { x: mark.x, z: returnZ },
      corner: { x: 0, z: approach.z }, delay: back ? .16 : 0 },
  ] : [
    { foot: "L", target: { x: 0, z: firstLeaderZ }, body: { x: 0, z: firstLeaderZ / 2 } },
    { foot: "R", target: secondLeader,
      body: { x: back ? 0 : -.095, z: back ? .02 : firstLeaderZ }, corner: back ? undefined : { x: -halfHip, z: 0 }, keep: "z" },
    { foot: "L", target: { x: 0, z: -.19 }, body: { x: back ? 0 : -.08, z: back ? -.04 : .10 } },
    { foot: "R", target: leaderEnd, body: { x: leaderEnd.x - .04, z: leaderEnd.z } },
    { foot: "L", target: leaderEnd, body: leaderEnd },
  ];

  // Couple placement (docs/spec-placements-couple.md): both feet start shifted by o. Shifted
  // landings keep the step amplitude; the D/D arrival (leader D2, follower D3) and every later
  // landing are validated, so the figure is unchanged from action 3 on.
  const o = placementOffset(placement);
  // The leader's hooked D must reach the longitudinal level of his own G and anchor the D/D
  // arrival, so his G1 is validated too; only the follower's D1/G2 keep their amplitude.
  // From the quinconce start (knees interleaved), the follower's D1 lands on its validated target to
  // free the leader's knee; her G2 keeps its amplitude.
  const shifted = follower ? [false, true, false, false, false] : [false, false, false, false, false];
  // #48: once the couple is back face to face on the line (actions 4 and 5), the landings are neutral
  // again: quinconce shift, feet under the hips and the right foot's stagger, as at the start.
  const neutral = [false, false, false, true, true];
  const shiftOf: Record<FigureFoot, number> = { L: 1, R: 1 };
  // Initial/neutral stance: each foot `stance` further out (feet under the hips), absorbed on its first step.
  const widen = Number.isFinite(stance) ? stance : 0;
  const position = (foot: FigureFoot, offset: FootPoint, shift = 0, home = 0): FootPoint =>
    ({ x: rest[foot].x + offset.x + o.x * shift + (foot === "L" ? widen : -widen) * home,
      z: rest[foot].z + offset.z + o.z * shift + (foot === "R" ? (o.stagger ?? 0) / 2 : 0) * home });
  const landing = (i: number, action: Action) =>
    position(action.foot, action.target, shifted[i] || neutral[i] ? 1 : 0, neutral[i] ? 1 : 0);
  const feet: Record<FigureFoot, FigureFootPose> = {
    L: { ...position("L", { x: widen, z: 0 }, 1), yaw: 0, lift: 0 },
    R: { ...position("R", { x: -widen, z: (o.stagger ?? 0) / 2 }, 1), yaw: 0, lift: 0 },
  };
  let support: FigureFoot = follower ? "L" : "R";
  let body: FootPoint = { x: 0, z: 0 };
  steps.slice(0, index).forEach((action, i) => {
    shiftOf[action.foot] = shifted[i] || neutral[i] ? 1 : 0;
    feet[action.foot] = { ...landing(i, action), yaw: 0, lift: 0 };
    support = action.foot;
    body = action.body;
  });
  const action = steps[index];
  const fromShift = shiftOf[action.foot];
  // The pelvis follows the shift of the support foot (validated from the D/D arrival on).
  const weightBefore = shiftOf[support];
  const weightAfter = index < 4 ? (shifted[index] || neutral[index] ? 1 : 0) : weightBefore;
  const from = feet[action.foot], to = landing(index, action);
  // From a close start the leader's D2 touches the follower's G: her G2 opens the way first.
  const closeStart = Math.min(1, Math.hypot(o.x, o.z) / 0.05);
  const delay = action.delay ?? (!follower && index === 1 ? sortieFilleHookLead(o) : 0);
  const touchdown = !follower && index === 3 ? .48 : .68;
  const flight = Math.max(0, Math.min(1, (t - delay) / (touchdown - delay)));
  // #49: a walking step (heel rise, swing, heel strike or ball landing); the marka only touches.
  // From the interleaved quinconce a heel rise would push the knee into the partner's: the first steps
  // and the hook (the follower's G2 opens the way, the leader's D passes her knee) leave the floor with
  // little push-off.
  // Her G4 crosses in front of her planted D and of the leader's retreating D: it rolls little too.
  const interleaved = index <= 1;
  const crossing = follower && index === 3;
  // Her D3 closes the D/D contact against the leader's D knee: it rolls little too.
  const contactStep = follower && index === 2;
  const gait = gaitStep(flight, { x: to.x - from.x, z: to.z - from.z }, 0,
    interleaved ? SORTIE_FILLE_FIRST_ROLL : crossing || contactStep ? SORTIE_FILLE_CROSS_ROLL : 1);
  const along = index === 4 ? flight : gait.progress;
  let point = interpolate(from, to, smooth(along));
  if (action.corner) {
    const via = position(action.foot, action.corner);
    // The corner keeps the start's own coordinate (shift, stance and stagger included).
    if (action.keep === "x") via.x = from.x;
    if (action.keep === "z") via.z = from.z;
    point = along < .5 ? interpolate(from, via, smooth(along * 2))
      : interpolate(via, to, smooth(along * 2 - 1));
  }
  const swing = Math.sin(Math.PI * flight) ** 2;
  // The right toe turns toward the diagonal during the follower’s flight. The ankle
  // follows one straight segment and the foot faces forward again at touchdown.
  const yaw = follower && index === 2 ? 55 * Math.PI / 180 * swing : 0;
  feet[action.foot] = { ...point, yaw, ...(index === 4 ? { lift: .022 * swing } : { lift: gait.lift, pitch: gait.pitch, pivot: gait.pivot }) };
  const transfer = index < 4 ? smooth((t - touchdown) / (1 - touchdown)) : 0;
  const loadR = mix(Number(support === "R"), Number(action.foot === "R"), transfer);
  // From a close start the follower's pelvis completes its retreat over D1 by 80 % of the step, so
  // her planted G leg never folds onto the leader's right knee between hers (measured on the GLB).
  const bodyPhase = follower && index === 1 ? (t - .25) / .75
    : follower && index === 0 ? t / (1 - 0.2 * closeStart)
    // #48: into the neutral quinconce the pelvis arrives with the marka: lagging behind it, the
    // follower's right knee would lean onto the leader's interleaved right knee.
    : index === 4 ? (t - delay) / (touchdown - delay) : t;
  const root = interpolate({ x: body.x + o.x * weightBefore, z: body.z + o.z * weightBefore },
    { x: action.body.x + o.x * weightAfter, z: action.body.z + o.z * weightAfter }, smooth(bodyPhase));
  // Keep the follower's pelvis over the outside support while D clears the
  // leader's leg. The support foot stays fixed and D keeps its straight segment.
  if (follower && index === 2) root.x += (back ? .06 : .10) * Math.sin(Math.PI * t) ** 2;
  // Opening of the leader's chest leads the answering rotation of the partner.
  const cue = follower ? .72 : .47;
  const chestYaw = -.20 * smooth((b - cue) / .72) * (1 - smooth((b - 2.15) / 1.1));
  return { beat: b, feet, root, loadR, chestYaw, coupling: Math.max(startCoupling(b, o), endCoupling(b, o)) };
}
