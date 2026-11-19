import { HIP_WIDTH } from "./anatomy";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";
import { placementOffset, type CouplePlacement, type PlacementOffset } from "./placement";

export type SortieFilleVariant = "hook" | "back";
export const SORTIE_FILLE_BEATS = 5;
export const SORTIE_FILLE_PAIR_DZ = 0.20;
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
  placement: CouplePlacement | "reference" | PlacementOffset = "reference") {
  const b = sortieFilleBeat(beat);
  const index = Math.min(4, Math.floor(b));
  const t = b - index;
  const back = variant === "back";
  const halfHip = HIP_WIDTH / 2;
  const firstLeaderZ = .12;
  const firstFollowerZ = back ? -.42 : -.55;
  const secondFollowerX = back ? HIP_WIDTH : .55;
  const secondLeader: FootPoint = { x: back ? 0 : -halfHip, z: back ? -.07 : rest.L.z + firstLeaderZ - rest.R.z };
  // Align the two right ankles longitudinally. The follower's +x is the
  // leader's right; the clearance is measured between those ankle targets.
  const approach: FootPoint = {
    x: (back ? .22 : .28) - 2 * rest.R.x - secondLeader.x,
    z: 2 * SORTIE_FILLE_PAIR_DZ - 2 * rest.R.z - secondLeader.z,
  };
  const returnZ = approach.z + .225;
  const mark: FootPoint = { x: .05, z: returnZ };
  const returnBodyZ = returnZ - .10;
  const leaderEndZ = secondLeader.z - .64;
  // Positions are offsets in each dancer's own frame. For the suiveur,
  // a positive x offset therefore moves to the leader's right.
  const steps: Action[] = follower ? [
    { foot: "R", target: { x: .07, z: firstFollowerZ }, body: { x: 0, z: firstFollowerZ * .43 } },
    { foot: "L", target: { x: secondFollowerX, z: back ? .13 : 0 }, body: { x: back ? .22 : .33, z: back ? -.005 : -.12 } },
    { foot: "R", target: approach, body: { x: back ? .36 : .43, z: back ? .44 : .30 } },
    { foot: "L", target: mark, body: { x: .16, z: returnBodyZ },
      corner: { x: secondFollowerX, z: returnZ }, keep: "x", delay: .24 },
    { foot: "R", target: mark, body: { x: mark.x, z: returnBodyZ },
      corner: { x: 0, z: approach.z }, delay: back ? .16 : 0 },
  ] : [
    { foot: "L", target: { x: 0, z: firstLeaderZ }, body: { x: 0, z: firstLeaderZ / 2 } },
    { foot: "R", target: secondLeader,
      body: { x: back ? 0 : -.095, z: back ? .02 : firstLeaderZ }, corner: back ? undefined : { x: -halfHip, z: 0 }, keep: "z" },
    { foot: "L", target: { x: 0, z: -.19 }, body: { x: back ? 0 : -.08, z: back ? -.04 : .10 } },
    { foot: "R", target: { x: .065, z: leaderEndZ }, body: { x: .025, z: leaderEndZ } },
    { foot: "L", target: { x: .065, z: leaderEndZ }, body: { x: 0, z: leaderEndZ } },
  ];

  // Couple placement (docs/spec-placements-couple.md): both feet start shifted by o. Shifted
  // landings keep the step amplitude; the D/D arrival (leader D2, follower D3) and every later
  // landing are validated, so the figure is unchanged from action 3 on.
  const o = placementOffset(placement);
  // The leader's hooked D must reach the longitudinal level of his own G and anchor the D/D
  // arrival, so his G1 is validated too; only the follower's D1/G2 keep their amplitude.
  const shifted = follower ? [true, true, false, false, false] : [false, false, false, false, false];
  const shiftOf: Record<FigureFoot, number> = { L: 1, R: 1 };
  const position = (foot: FigureFoot, offset: FootPoint, shift = 0): FootPoint =>
    ({ x: rest[foot].x + offset.x + o.x * shift, z: rest[foot].z + offset.z + o.z * shift });
  const feet: Record<FigureFoot, FigureFootPose> = {
    L: { ...position("L", { x: 0, z: 0 }, 1), yaw: 0, lift: 0 },
    R: { ...position("R", { x: 0, z: 0 }, 1), yaw: 0, lift: 0 },
  };
  let support: FigureFoot = follower ? "L" : "R";
  let body: FootPoint = { x: 0, z: 0 };
  steps.slice(0, index).forEach((action, i) => {
    shiftOf[action.foot] = shifted[i] ? 1 : 0;
    feet[action.foot] = { ...position(action.foot, action.target, shiftOf[action.foot]), yaw: 0, lift: 0 };
    support = action.foot;
    body = action.body;
  });
  const action = steps[index];
  const fromShift = shiftOf[action.foot];
  // The pelvis follows the shift of the support foot (validated from the D/D arrival on).
  const weightBefore = shiftOf[support];
  const weightAfter = index < 4 ? (shifted[index] ? 1 : 0) : weightBefore;
  const from = feet[action.foot], to = position(action.foot, action.target, shifted[index] ? 1 : 0);
  const delay = action.delay ?? 0;
  const touchdown = !follower && index === 3 ? .48 : .68;
  const flight = Math.max(0, Math.min(1, (t - delay) / (touchdown - delay)));
  let point = interpolate(from, to, smooth(flight));
  if (action.corner) {
    const via = position(action.foot, action.corner);
    if (action.keep === "x") via.x += o.x * fromShift;
    if (action.keep === "z") via.z += o.z * fromShift;
    point = flight < .5 ? interpolate(from, via, smooth(flight * 2))
      : interpolate(via, to, smooth(flight * 2 - 1));
  }
  const swing = Math.sin(Math.PI * flight) ** 2;
  // The right toe turns toward the diagonal during the follower’s flight. The ankle
  // follows one straight segment and the foot faces forward again at touchdown.
  const yaw = follower && index === 2 ? 55 * Math.PI / 180 * swing : 0;
  feet[action.foot] = { ...point, yaw, lift: (index === 4 ? .022 : .045) * swing };
  const transfer = index < 4 ? smooth((t - touchdown) / (1 - touchdown)) : 0;
  const loadR = mix(Number(support === "R"), Number(action.foot === "R"), transfer);
  const bodyPhase = follower && index === 1 ? (t - .25) / .75 : t;
  const root = interpolate({ x: body.x + o.x * weightBefore, z: body.z + o.z * weightBefore },
    { x: action.body.x + o.x * weightAfter, z: action.body.z + o.z * weightAfter }, smooth(bodyPhase));
  // Keep the follower's pelvis over the outside support while D clears the
  // leader's leg. The support foot stays fixed and D keeps its straight segment.
  if (follower && index === 2) root.x += (back ? .06 : .10) * Math.sin(Math.PI * t) ** 2;
  // Opening of the leader's chest leads the answering rotation of the partner.
  const cue = follower ? .72 : .47;
  const chestYaw = -.20 * smooth((b - cue) / .72) * (1 - smooth((b - 2.15) / 1.1));
  return { beat: b, feet, root, loadR, chestYaw };
}
