import { HIP_WIDTH } from "./anatomy";
import { SORTIE_GINGA_CAP, gingaWindow, type FigureFoot, type FigureFootPose, type FootPoint } from "./sortieGarcon";
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

/** #105, owner (20 Nov.): « reprendre les unités de la sortie garçon : on avance/recule d'une longueur de
 * pied environ, et des déplacements latéraux à 1/2, 1 ou 3/2 la largeur de hanche ». Lengths in metres, in
 * each dancer's own frame (docs/spec-sortie-fille.md, section #105). */
export const SORTIE_FILLE_FOOT = 0.212;
export const SORTIE_FILLE_UNITS = {
  /** The leader's G1 forward and the follower's D1 back (R22: his step forward equals hers back). */
  step: SORTIE_FILLE_FOOT,
  /** The follower's G2 opening: 3/2 hip in the hook (her D3 lands inside it, so her G4 really crosses
   * in front of it), wider at amplitude 2 where the D/D arrival widens; 1 hip in the alternative. */
  hookOpen: 1.5 * HIP_WIDTH, hookOpenWide: 0.60, backOpen: HIP_WIDTH,
  /** The leader's D2 straight back in the alternative. */
  backD2: 0.07,
  /** The follower's D3 stops this far behind the leader's D (its diagonal must otherwise cover the
   * whole couple depth); the upper thighs still touch (the follower's pelvis comes 3 cm forward). */
  hookStagger: 0.15, backStagger: 0.17,
  /** The leader's G3 back: one foot in the hook, 7/4 foot in the alternative (his D2 went back). */
  hookG3: SORTIE_FILLE_FOOT, backG3: 1.75 * SORTIE_FILLE_FOOT,
  /** The leader's D4 back, from his D2: the couple ends this far behind his D2, so that the follower's
   * G4 lands about 23 cm (a foot's length of sole) in front of her D3 and crosses it without touching. */
  hookD4: 0.48, backD4: 0.46,
  /** Lateral translation of the couple over the figure: a quarter hip to the leader's right. */
  endX: -HIP_WIDTH / 4,
};

/** #127 (owner, 21 Nov.: « Le fait d'aller vers l'avant avec le pied gauche perpendiculaire s'appelle une
 * virgula. […] Dans la sortie fille version pas latéral (et non recul) au 2nd temps on peut utiliser cette
 * "virgula" au premier temps pour le garçon (en gardant le buste du suiveur stable grâce à la
 * contraposition du leader) »): in the hook variant the leader's G1 is a virgula, as the first step of
 * the quarter turn. Calibrated on the GLB (docs/spec-sortie-fille.md, section #127):
 * - the foot goes as far forward as the straight step (R22) and lands at a right angle, its ankle
 *   `beside` to the left of his D's ankle: the heel next to the inner edge of his D. Heel exactly at the
 *   tip of the D (the quarter turn's rule), from the quinconce it lands 10 cm deeper, on the line of the
 *   follower's right knee, deeply bent during her G2: the shins cross;
 * - `yaw`: the foot's yaw at the landing (towards his left); it pivots over the end of the flight, from
 *   `yawFrom` of it, once it has passed the follower's retreating D;
 * - `pelvis`: his pelvis opens this much to his left with the foot (rad, from `pelvisFrom` of the flight)
 *   and squares up again during his hook (`pelvisBack`, shares of action 2), before the plexus facing cap
 *   would turn his chest; `knee`: his G knee points this far out (rad, between the pelvis and the foot),
 *   his D knee keeps facing forward;
 * - his chest does not follow his pelvis (contraposition): the follower's chest is not turned;
 * - the foot and its knee come back while his G3 goes back (action 3). */
export const SORTIE_FILLE_VIRGULA = { beside: 0.11, yaw: Math.PI / 2, yawFrom: 0.35, pelvis: 0.175, pelvisFrom: 0.4, pelvisBack: [0.2, 0.7], knee: 0.8 };

export function sortieFilleVariantOf(value: string | null): SortieFilleVariant {
  return value === "back" ? "back" : "hook";
}

/** #88: the follower's G2 leaves with the leader's hook and lands sooner. */
export const SORTIE_FILLE_SYNC = { g2touchdown: .5 };

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
  // Which coordinate of the (possibly shifted) landing the corner takes, so that the last segment
  // runs straight into the landing whatever the placement.
  align?: "x" | "z";
  delay?: number;
  /** #127: yaw of the foot once landed (rad, towards the dancer's left); it stays until the foot moves again. */
  yaw?: number;
}

/** #157: beats where the sortie fille is too tight for the ginga's bounce and sway (`ramp`: beats to fade). */
/** Beat (position 3) where the sortie fille may be chained into the sortie garçon (#90): the figure and
 * its chained form are the same up to it, the ginga included (`gingaJunctions`). */
export const SORTIE_FILLE_JUNCTION = 3;
export const SORTIE_FILLE_GINGA = { bounceFrom: 0.35, swayOff: [0.95, 1.45], ramp: 0.3,
  // #163: found at a sixteenth of a beat (the checks of #157 sampled every eighth): at 0.94 the leader's
  // right femur meets the follower's left kneecap with the bounce of `marque` (semba), not with 5 mm. The
  // bounce keeps `keep` of itself over `window` (down, held, up); the sway is off from 0.95.
  bounceDip: { window: [0.7, 0.85, 1.05, 1.2], keep: 0.4 },
  // #163: room above the sorties' cap (beats), measured with the cap ignored and the `ample` setting: the
  // leg bones cross up to 1.0 and from 4.81 on; the larger bounce also once around 2.25.
  capSway: { from: [1.2, 1.55], until: [4.2, 4.6] },
  capBounce: { from: [1.2, 1.55], notch: [1.87, 2.12, 2.38, 2.63], until: [4.2, 4.6] } };

export function sampleSortieFille(beat: number, follower: boolean,
  rest: Record<FigureFoot, FootPoint>, variant: SortieFilleVariant = "hook",
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0, virgula = true) {
  const b = sortieFilleBeat(beat);
  const index = Math.min(4, Math.floor(b));
  const t = b - index;
  const back = variant === "back";
  // Owner request (19 Nov.): at action 3 the upper right thighs touch. The follower's pelvis comes
  // 2 cm (hook) or 3 cm (back) closer to the leader's; `contact` fades this above amplitude 1.
  const touch = Number.isFinite(contact) ? Math.max(0, Math.min(1, contact)) : 1;
  const halfHip = HIP_WIDTH / 2;
  const U = SORTIE_FILLE_UNITS;
  // Couple placement (docs/spec-placements-couple.md): both feet start shifted by o.
  const o = placementOffset(placement);
  // Initial/neutral stance: each foot `stance` further out (feet under the hips), absorbed on its first step.
  const widen = Number.isFinite(stance) ? stance : 0;
  // #127: the leader's G1 of the hook variant is a virgula, its heel next to his D where it stands.
  const V = SORTIE_FILLE_VIRGULA;
  const comma = virgula && !follower && !back;
  const firstLeaderZ = U.step;
  const commaTarget: FootPoint = { x: rest.R.x - widen + o.x + V.beside - rest.L.x, z: firstLeaderZ };
  // #105: one foot back, 7 cm to her left as before (R22).
  const firstFollowerZ = -U.step;
  const secondFollowerX = back ? U.backOpen : mix(U.hookOpenWide, U.hookOpen, touch);
  const secondLeader: FootPoint = { x: back ? 0 : -halfHip, z: back ? -U.backD2 : rest.L.z + firstLeaderZ - rest.R.z };
  // The follower's D arrives on the right of the leader's D, `stagger` behind it (#105). The follower's
  // +x is the leader's right; the clearance is measured between those ankle targets.
  const approach: FootPoint = {
    // #51: the D/D contact of action 3 is 7 cm closer to the line in the hook (shorter opening);
    // like the thigh contact it fades back above amplitude 1.
    x: (back ? .22 : mix(.28, .21, touch)) - 2 * rest.R.x - secondLeader.x,
    z: 2 * SORTIE_FILLE_PAIR_DZ - 2 * rest.R.z - secondLeader.z - (back ? U.backStagger : U.hookStagger),
  };
  const leaderEndZ = secondLeader.z - (back ? U.backD4 : U.hookD4);
  // #48: the figure ends in the neutral position, the start translated. The leader's last landings
  // define the translation; the follower's mirror it exactly (her frame faces his).
  const leaderEnd: FootPoint = { x: U.endX, z: leaderEndZ };
  const returnZ = -leaderEnd.z;
  const mark: FootPoint = { x: -leaderEnd.x, z: returnZ };
  // Positions are offsets in each dancer's own frame. For the suiveur,
  // a positive x offset therefore moves to the leader's right.
  const steps: Action[] = follower ? [
    // #105: her pelvis follows her D1 over 70 % of the step: lagging, her knees meet the leader's
    // advancing G knee (quinconce, measured on the GLB).
    { foot: "R", target: { x: .07, z: firstFollowerZ }, body: { x: 0, z: firstFollowerZ * .7 } },
    { foot: "L", target: { x: secondFollowerX, z: back ? .13 : -.06 * touch }, body: { x: back ? .22 : .33 * secondFollowerX / .55, z: back ? -.005 : -.12 } },
    // #105: her pelvis stops 3 cm in front of her D3 so that the upper thighs touch despite the stagger.
    { foot: "R", target: approach, body: { x: mix(back ? .36 : .43, back ? .32 : .40, touch), z: approach.z + .03 } },
    // After her G4 the follower's pelvis stays 12 cm behind it and 6 cm towards her D (#105): over her
    // G, her pelvis drops between her crossed feet and her G knee meets the leader's (amplitude 2).
    { foot: "L", target: mark, body: { x: .22, z: returnZ - .12 },
      corner: { x: secondFollowerX, z: returnZ }, keep: "x", align: "z", delay: .24 },
    // #105: her D5 unwinds 10 cm behind her D3 level, clear of her planted G's heel.
    { foot: "R", target: mark, body: { x: mark.x, z: returnZ },
      corner: { x: mark.x, z: approach.z - .10 }, align: "x", delay: back ? .16 : 0 },
  ] : [
    { foot: "L", target: comma ? commaTarget : { x: 0, z: firstLeaderZ }, body: { x: 0, z: firstLeaderZ / 2 }, yaw: comma ? V.yaw : 0 },
    // #105: on his hooked D the leader's pelvis stays 8 cm behind it, so that his knees leave room for
    // her D3 diagonal (her swinging D knee passes in front of his D knee).
    { foot: "R", target: secondLeader,
      body: { x: back ? 0 : -.095, z: back ? .02 : firstLeaderZ - .08 }, corner: back ? undefined : { x: -halfHip, z: 0 }, keep: "z" },
    { foot: "L", target: { x: 0, z: firstLeaderZ - (back ? U.backG3 : U.hookG3) }, body: { x: back ? 0 : -.08, z: back ? -.04 : firstLeaderZ - .02 } },
    // #105: his pelvis ends 3 cm to the left of his D4, his D knee away from her crossing G knee.
    { foot: "R", target: leaderEnd, body: { x: leaderEnd.x + .03, z: leaderEnd.z } },
    { foot: "L", target: leaderEnd, body: leaderEnd },
  ];

  // Couple placement (docs/spec-placements-couple.md): both feet start shifted by o. Shifted
  // landings keep the step amplitude; the D/D arrival (leader D2, follower D3) and every later
  // landing are validated, so the figure is unchanged from action 3 on.
  // The leader's hooked D must reach the longitudinal level of his own G and anchor the D/D
  // arrival, so his G1 is validated too; only the follower's D1/G2 keep their amplitude.
  // From the quinconce start (knees interleaved), the follower's D1 lands on its validated target to
  // free the leader's knee; her G2 keeps its amplitude.
  const shifted = follower ? [false, true, false, false, false] : [false, false, false, false, false];
  // #48: once the couple is back face to face on the line (actions 4 and 5), the landings are neutral
  // again: quinconce shift, feet under the hips and the right foot's stagger, as at the start.
  const neutral = [false, false, false, true, true];
  const shiftOf: Record<FigureFoot, number> = { L: 1, R: 1 };
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
    feet[action.foot] = { ...landing(i, action), yaw: action.yaw ?? 0, lift: 0 };
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
  // #88: the follower never leaves before the leader: her G2 waits for his hook (it used to open the way
  // first, sortieFilleHookLead earlier).
  const delay = action.delay ?? (index === 1 ? sortieFilleHookLead(o) : 0);
  // #88: synced with his hook, her G2 lands sooner to open the way in time.
  // #105: her D1 lands sooner too (it clears the leader's G1, R24 kept: it leaves with it), and the
  // leader's G5 marka is placed before her D5 marka joins it in the neutral quinconce.
  const touchdown = !follower && index === 3 ? .48 : !follower && index === 4 ? .5
    : follower && index === 1 ? SORTIE_FILLE_SYNC.g2touchdown : follower && index === 0 ? .5 : .68;
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
  // #127: a foot landing turned out lands on its ball (the travel is across its own axis).
  const gait = gaitStep(flight, { x: to.x - from.x, z: to.z - from.z }, action.yaw ?? 0,
    interleaved ? SORTIE_FILLE_FIRST_ROLL : crossing || contactStep ? SORTIE_FILLE_CROSS_ROLL : 1);
  const along = index === 4 ? flight : gait.progress;
  let point = interpolate(from, to, smooth(along));
  if (action.corner) {
    const via = position(action.foot, action.corner);
    // The corner keeps the start's own coordinate (shift, stance and stagger included).
    if (action.keep === "x") via.x = from.x;
    if (action.keep === "z") via.z = from.z;
    if (action.align === "x") via.x = to.x;
    if (action.align === "z") via.z = to.z;
    point = along < .5 ? interpolate(from, via, smooth(along * 2))
      : interpolate(via, to, smooth(along * 2 - 1));
  }
  const swing = Math.sin(Math.PI * flight) ** 2;
  // The right toe turns toward the diagonal during the follower’s flight. The ankle
  // follows one straight segment and the foot faces forward again at touchdown.
  // #127: the virgula pivots over the end of its flight and comes back while the foot next moves.
  const late = (x: number, start: number) => smooth((x - start) / Math.max(1e-6, 1 - start));
  const yaw = follower && index === 2 ? 55 * Math.PI / 180 * swing
    : mix(from.yaw, action.yaw ?? 0, action.yaw ? late(flight, V.yawFrom) : smooth(flight));
  feet[action.foot] = { ...point, yaw, ...(index === 4 ? { lift: .022 * swing } : { lift: gait.lift, pitch: gait.pitch, pivot: gait.pivot }) };
  const transfer = index < 4 ? smooth((t - touchdown) / (1 - touchdown)) : 0;
  const loadR = mix(Number(support === "R"), Number(action.foot === "R"), transfer);
  // From a close start the follower's pelvis completes its retreat over D1 by 80 % of the step, so
  // her planted G leg never folds onto the leader's right knee between hers (measured on the GLB).
  const bodyPhase = follower && index === 1 ? (t - .25) / .75
    // #105: her pelvis waits a quarter beat over her G before following her D3 diagonal: leading, it
    // pulls her swinging D knee into the leader's D knee.
    : follower && index === 2 ? (t - .25) / .75
    : follower && index === 0 ? t / (1 - 0.2 * closeStart)
    // #48: into the neutral quinconce the pelvis arrives with the marka: lagging behind it, the
    // follower's right knee would lean onto the leader's interleaved right knee.
    : index === 4 ? (t - delay) / (touchdown - delay) : t;
  const root = interpolate({ x: body.x + o.x * weightBefore, z: body.z + o.z * weightBefore },
    { x: action.body.x + o.x * weightAfter, z: action.body.z + o.z * weightAfter }, smooth(bodyPhase));
  // Keep the follower's pelvis over the outside support while D clears the
  // leader's leg. The support foot stays fixed and D keeps its straight segment.
  // #105: 20 cm in the hook (10 before): her shorter diagonal starts closer to the leader's D.
  if (follower && index === 2) root.x += (back ? .06 : .20) * Math.sin(Math.PI * t) ** 2;
  // Opening of the leader's chest leads the answering rotation of the partner.
  const cue = follower ? .72 : .47;
  const chestYaw = -.20 * smooth((b - cue) / .72) * (1 - smooth((b - 2.15) / 1.1));
  // #157 (docs/spec-ginga-couple.md): where this figure leaves no room for the ginga of the couple dance,
  // measured on the GLB: the bounce over its first third of a beat (the knees meet as the leader's G leaves),
  // the hip sway around its beat 1.25 (the leader's right thigh against the follower's left leg, in semba).
  const G = SORTIE_FILLE_GINGA;
  const D = G.bounceDip.window, dip = smooth((b - D[0]) / (D[1] - D[0])) * (1 - smooth((b - D[2]) / (D[3] - D[2])));
  const gingaRoom = { bounce: smooth((b - G.bounceFrom) / G.ramp) * (1 - (1 - G.bounceDip.keep) * dip),
    sway: 1 - smooth((b - (G.swayOff[0] - G.ramp)) / G.ramp) * (1 - smooth((b - G.swayOff[1]) / G.ramp)) };
  const sample = { beat: b, feet, root, loadR, chestYaw, coupling: Math.max(startCoupling(b, o), endCoupling(b, o)), gingaRoom, gingaCap: SORTIE_GINGA_CAP,
    gingaCapRoom: { sway: gingaWindow(b, G.capSway), bounce: gingaWindow(b, G.capBounce) }, gingaJunctions: [SORTIE_FILLE_JUNCTION] };
  if (!comma) return sample;
  // #127: the pelvis opens with the virgula (over the end of its flight) and squares up during the hook;
  // the chest keeps its own direction (contraposition); the G knee points out between the pelvis and the
  // foot until the foot goes back, the D knee keeps facing forward.
  const out = index === 0 ? late(flight, V.yawFrom) : index === 1 ? 1 : index === 2 ? 1 - smooth(flight) : 0;
  const open = index === 0 ? late(flight, V.pelvisFrom) : index === 1 ? 1 - smooth((t - V.pelvisBack[0]) / (V.pelvisBack[1] - V.pelvisBack[0])) : 0;
  const rootYaw = V.pelvis * open;
  return { ...sample, chestYaw: chestYaw - rootYaw, rootYaw, kneeYawSide: { L: rootYaw - V.knee * out, R: rootYaw } };
}
