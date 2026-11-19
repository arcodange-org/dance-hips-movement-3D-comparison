// src/anatomy.ts
import * as THREE from "three";
var TAU = Math.PI * 2;
var ANATOMY_URL = `${import.meta.env.BASE_URL}anatomy.glb`;
var HIP_WIDTH = 0.34;

// src/placement.ts
var DEFAULT_PLACEMENT = "quinconce";
var PLACEMENT_OFFSETS = {
  // The validated figures, unchanged (roots at ±SORTIE_*_PAIR_DZ).
  reference: { x: 0, z: 0 },
  // Patellae cross beyond 1 cm per dancer as soon as a style flexes the knees (measured on the GLB).
  face: { x: 0, z: 0.01 },
  // Owner's quinconce (19 Nov.), feet forward and under the hips: the outer edge of the leader's
  // right forefoot touches the inner edge of the follower's left forefoot, and the inner edge of the
  // leader's left forefoot touches the outer edge of the follower's right forefoot (first third of
  // the foot, ≈1 mm on the GLB soles). The right feet start 5 cm further towards the partner so the
  // right knees pass each other (bone-clear up to amplitude 1 with coupled pelvises).
  quinconce: { x: 0.0405, z: 0.06, stagger: 0.1 }
};
function placementScale(amp) {
  return Number.isFinite(amp) ? Math.max(0, Math.min(1, 2 - amp)) : 0;
}
var PLACEMENT_LABELS = {
  quinconce: "Quinconce (demi-pointes au contact)",
  face: "Face \xE0 face (pointes rapproch\xE9es)"
};
function placementOf(value) {
  return value === "face" ? "face" : "quinconce";
}
function placementOffset(placement = DEFAULT_PLACEMENT, amp = 1) {
  const o = typeof placement === "string" ? PLACEMENT_OFFSETS[placement] ?? PLACEMENT_OFFSETS[DEFAULT_PLACEMENT] : placement;
  const scale = typeof placement === "string" ? placementScale(amp) : 1;
  const stagger = Number.isFinite(o.stagger) ? o.stagger * scale : 0;
  return Number.isFinite(o.x) && Number.isFinite(o.z) ? { x: o.x * scale, z: o.z * scale, stagger } : { x: 0, z: 0, stagger: 0 };
}
function startCoupling(beat, offset) {
  const closeness = Math.min(1, Math.hypot(offset.x, offset.z) / 0.05);
  const t = Math.max(0, Math.min(1, beat - 1));
  return closeness * (1 - t * t * (3 - 2 * t));
}

// src/sortieFille.ts
var SORTIE_FILLE_BEATS = 5;
var SORTIE_FILLE_PAIR_DZ = 0.2;
var SORTIE_FILLE_ACTIONS = [
  "D\xE9part \xB7 G leader / D suiveur disponibles",
  "1 \xB7 G leader avance / D suiveur recule",
  "2 \xB7 Crochet D leader / G suiveur sort \xE0 gauche",
  "3 \xB7 G leader recule / D suiveur avance en diagonale",
  "4 \xB7 D leader d\xE9gage / G suiveur croise",
  "5 \xB7 Marka G leader et D suiveur"
];
function sortieFilleVariantOf(value) {
  return value === "back" ? "back" : "hook";
}
function sortieFilleBeat(beat) {
  return Number.isFinite(beat) ? Math.max(0, Math.min(SORTIE_FILLE_BEATS, beat)) : 0;
}
var smooth = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
var mix = (a, b, t) => a + (b - a) * t;
var interpolate = (a, b, t) => ({ x: mix(a.x, b.x, t), z: mix(a.z, b.z, t) });
function sampleSortieFille(beat, follower, rest, variant = "hook", placement = "reference", contact = 1, stance = 0) {
  const b = sortieFilleBeat(beat);
  const index = Math.min(4, Math.floor(b));
  const t = b - index;
  const back = variant === "back";
  const touch = Number.isFinite(contact) ? Math.max(0, Math.min(1, contact)) : 1;
  const halfHip = HIP_WIDTH / 2;
  const firstLeaderZ = 0.12;
  const firstFollowerZ = back ? -0.42 : -0.55;
  const secondFollowerX = back ? HIP_WIDTH : 0.55;
  const secondLeader = { x: back ? 0 : -halfHip, z: back ? -0.07 : rest.L.z + firstLeaderZ - rest.R.z };
  const approach = {
    x: (back ? 0.22 : 0.28) - 2 * rest.R.x - secondLeader.x,
    z: 2 * SORTIE_FILLE_PAIR_DZ - 2 * rest.R.z - secondLeader.z
  };
  const returnZ = approach.z + 0.225;
  const mark = { x: 0.05, z: returnZ };
  const returnBodyZ = returnZ - 0.1;
  const leaderEndZ = secondLeader.z - 0.64;
  const steps = follower ? [
    { foot: "R", target: { x: 0.07, z: firstFollowerZ }, body: { x: 0, z: firstFollowerZ * 0.43 } },
    { foot: "L", target: { x: secondFollowerX, z: back ? 0.13 : 0 }, body: { x: back ? 0.22 : 0.33, z: back ? -5e-3 : -0.12 } },
    { foot: "R", target: approach, body: { x: mix(back ? 0.36 : 0.43, back ? 0.33 : 0.41, touch), z: back ? 0.44 : 0.3 } },
    {
      foot: "L",
      target: mark,
      body: { x: 0.16, z: returnBodyZ },
      corner: { x: secondFollowerX, z: returnZ },
      keep: "x",
      delay: 0.24
    },
    {
      foot: "R",
      target: mark,
      body: { x: mark.x, z: returnBodyZ },
      corner: { x: 0, z: approach.z },
      delay: back ? 0.16 : 0
    }
  ] : [
    { foot: "L", target: { x: 0, z: firstLeaderZ }, body: { x: 0, z: firstLeaderZ / 2 } },
    {
      foot: "R",
      target: secondLeader,
      body: { x: back ? 0 : -0.095, z: back ? 0.02 : firstLeaderZ },
      corner: back ? void 0 : { x: -halfHip, z: 0 },
      keep: "z"
    },
    { foot: "L", target: { x: 0, z: -0.19 }, body: { x: back ? 0 : -0.08, z: back ? -0.04 : 0.1 } },
    { foot: "R", target: { x: 0.065, z: leaderEndZ }, body: { x: 0.025, z: leaderEndZ } },
    { foot: "L", target: { x: 0.065, z: leaderEndZ }, body: { x: 0, z: leaderEndZ } }
  ];
  const o = placementOffset(placement);
  const shifted = follower ? [true, true, false, false, false] : [false, false, false, false, false];
  const shiftOf = { L: 1, R: 1 };
  const position = (foot, offset, shift = 0) => ({ x: rest[foot].x + offset.x + o.x * shift, z: rest[foot].z + offset.z + o.z * shift });
  const widen = Number.isFinite(stance) ? stance : 0;
  const feet = {
    L: { ...position("L", { x: widen, z: 0 }, 1), yaw: 0, lift: 0 },
    R: { ...position("R", { x: -widen, z: (o.stagger ?? 0) / 2 }, 1), yaw: 0, lift: 0 }
  };
  let support = follower ? "L" : "R";
  let body = { x: 0, z: 0 };
  steps.slice(0, index).forEach((action2, i) => {
    shiftOf[action2.foot] = shifted[i] ? 1 : 0;
    feet[action2.foot] = { ...position(action2.foot, action2.target, shiftOf[action2.foot]), yaw: 0, lift: 0 };
    support = action2.foot;
    body = action2.body;
  });
  const action = steps[index];
  const fromShift = shiftOf[action.foot];
  const weightBefore = shiftOf[support];
  const weightAfter = index < 4 ? shifted[index] ? 1 : 0 : weightBefore;
  const from = feet[action.foot], to = position(action.foot, action.target, shifted[index] ? 1 : 0);
  const delay = action.delay ?? 0;
  const touchdown = !follower && index === 3 ? 0.48 : 0.68;
  const flight = Math.max(0, Math.min(1, (t - delay) / (touchdown - delay)));
  let point = interpolate(from, to, smooth(flight));
  if (action.corner) {
    const via = position(action.foot, action.corner);
    if (action.keep === "x") via.x += o.x * fromShift;
    if (action.keep === "z") via.z += o.z * fromShift;
    point = flight < 0.5 ? interpolate(from, via, smooth(flight * 2)) : interpolate(via, to, smooth(flight * 2 - 1));
  }
  const swing = Math.sin(Math.PI * flight) ** 2;
  const yaw = follower && index === 2 ? 55 * Math.PI / 180 * swing : 0;
  feet[action.foot] = { ...point, yaw, lift: (index === 4 ? 0.022 : 0.045) * swing };
  const transfer = index < 4 ? smooth((t - touchdown) / (1 - touchdown)) : 0;
  const loadR = mix(Number(support === "R"), Number(action.foot === "R"), transfer);
  const bodyPhase = follower && index === 1 ? (t - 0.25) / 0.75 : t;
  const root = interpolate(
    { x: body.x + o.x * weightBefore, z: body.z + o.z * weightBefore },
    { x: action.body.x + o.x * weightAfter, z: action.body.z + o.z * weightAfter },
    smooth(bodyPhase)
  );
  if (follower && index === 2) root.x += (back ? 0.06 : 0.1) * Math.sin(Math.PI * t) ** 2;
  const cue = follower ? 0.72 : 0.47;
  const chestYaw = -0.2 * smooth((b - cue) / 0.72) * (1 - smooth((b - 2.15) / 1.1));
  return { beat: b, feet, root, loadR, chestYaw, coupling: startCoupling(b, o) };
}
export {
  DEFAULT_PLACEMENT,
  PLACEMENT_LABELS,
  PLACEMENT_OFFSETS,
  SORTIE_FILLE_ACTIONS,
  SORTIE_FILLE_BEATS,
  SORTIE_FILLE_PAIR_DZ,
  placementOf,
  placementOffset,
  placementScale,
  sampleSortieFille,
  sortieFilleBeat,
  sortieFilleVariantOf,
  startCoupling
};
