import { HIP_WIDTH } from "./anatomy";
import type { FigureFoot, FigureFootPose, FootPoint } from "./sortieGarcon";

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
  delay?: number;
}

export function sampleSortieFille(beat: number, follower: boolean,
  rest: Record<FigureFoot, FootPoint>, variant: SortieFilleVariant = "hook") {
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
      corner: { x: secondFollowerX, z: returnZ }, delay: .24 },
    { foot: "R", target: mark, body: { x: mark.x, z: returnBodyZ },
      corner: { x: 0, z: approach.z }, delay: back ? .16 : 0 },
  ] : [
    { foot: "L", target: { x: 0, z: firstLeaderZ }, body: { x: 0, z: firstLeaderZ / 2 } },
    { foot: "R", target: secondLeader,
      body: { x: back ? 0 : -.095, z: back ? .02 : firstLeaderZ }, corner: back ? undefined : { x: -halfHip, z: 0 } },
    { foot: "L", target: { x: 0, z: -.19 }, body: { x: back ? 0 : -.08, z: back ? -.04 : .10 } },
    { foot: "R", target: { x: .065, z: leaderEndZ }, body: { x: .025, z: leaderEndZ } },
    { foot: "L", target: { x: .065, z: leaderEndZ }, body: { x: 0, z: leaderEndZ } },
  ];

  const position = (foot: FigureFoot, offset: FootPoint): FootPoint =>
    ({ x: rest[foot].x + offset.x, z: rest[foot].z + offset.z });
  const feet: Record<FigureFoot, FigureFootPose> = {
    L: { ...rest.L, yaw: 0, lift: 0 }, R: { ...rest.R, yaw: 0, lift: 0 },
  };
  let support: FigureFoot = follower ? "L" : "R";
  let body: FootPoint = { x: 0, z: 0 };
  for (const action of steps.slice(0, index)) {
    feet[action.foot] = { ...position(action.foot, action.target), yaw: 0, lift: 0 };
    support = action.foot;
    body = action.body;
  }
  const action = steps[index];
  const from = feet[action.foot], to = position(action.foot, action.target);
  const delay = action.delay ?? 0;
  const touchdown = !follower && index === 3 ? .48 : .68;
  const flight = Math.max(0, Math.min(1, (t - delay) / (touchdown - delay)));
  let point = interpolate(from, to, smooth(flight));
  if (action.corner) {
    const via = position(action.foot, action.corner);
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
  const root = interpolate(body, action.body, smooth(bodyPhase));
  // Keep the follower's pelvis over the outside support while D clears the
  // leader's leg. The support foot stays fixed and D keeps its straight segment.
  if (follower && index === 2) root.x += (back ? .06 : .10) * Math.sin(Math.PI * t) ** 2;
  // Opening of the leader's chest leads the answering rotation of the partner.
  const cue = follower ? .72 : .47;
  const chestYaw = -.20 * smooth((b - cue) / .72) * (1 - smooth((b - 2.15) / 1.1));
  return { beat: b, feet, root, loadR, chestYaw };
}
