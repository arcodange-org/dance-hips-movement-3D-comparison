#!/usr/bin/env node
// Builds public/anatomy_upper.glb: the anatomical upper body (rib cage, spinal column, neck, skull, shoulder
// girdle, arms, forearms and hands; bones and muscles) from BodyParts3D 4.0. See docs/spec-haut-du-corps.md.
//
//   node scripts/build_upper_body.mjs [--cache extracted/bp3d] [--cell-bone 0.0025] [--cell-muscle 0.003] [--raw]
//
// The three BodyParts3D files (see scripts/bp3d.mjs) go in the cache folder; nothing is downloaded here.
// Output: one GLB, meshes weighted on 18 joints (standard glTF skin), Draco-compressed with
// @gltf-transform/cli (--raw: no compression); the manifest (rest joints, axes, pieces, measures) is the
// `extras` of its scene. Same frame as public/anatomy.glb. The skin weights are computed here, once: nothing
// is deformed by hand while dancing.
// Mesh licence: BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan.
import { execFileSync } from "node:child_process";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openBp3d, box, centroid, sliceCentre, fitSphere, SOURCE } from "./bp3d.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const cache = path.resolve(arg("cache", path.join(root, "extracted/bp3d")));
const out = path.resolve(arg("out", path.join(root, "public/anatomy_upper.glb")));
const CELL_BONE = +arg("cell-bone", 0.0025), CELL_MUSCLE = +arg("cell-muscle", 0.003);
const b = openBp3d(cache);

// ---------- vectors ----------
const sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
const add = (a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
const cross = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
const norm = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => mul(a, 1 / norm(a));
const smooth = (a, c, x) => { const t = Math.max(0, Math.min(1, (x - a) / (c - a))); return t * t * (3 - 2 * t); };
const rounded = (a, n = 4) => a.map(x => +x.toFixed(n));

// The engine's trunk joints at rest, in the skeleton frame, read from src/rigJoints.ts (spine; chest = spine +
// chest; head = chest + head). scripts/test_upper_body.mjs fails if they change without a rebuild.
const jointsSource = readFileSync(path.join(root, "src/rigJoints.ts"), "utf8");
const torso = name => JSON.parse(new RegExp(`${name}: (\\[[^\\]]+\\])`).exec(jointsSource)[1]);
const ENGINE = { pelvis: [0, 0, 0], spine: torso("spine"), chest: rounded(add(torso("spine"), torso("chest")), 6) };
ENGINE.head = rounded(add(ENGINE.chest, torso("head")), 6);

/** Principal axes of a cloud (Jacobi on the covariance): from the widest to the narrowest. */
function principalAxes(points) {
  const c = [0, 0, 0];
  for (const p of points) for (let k = 0; k < 3; k++) c[k] += p[k] / points.length;
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of points) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m[i][j] += (p[i] - c[i]) * (p[j] - c[j]);
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let turn = 0; turn < 60; turn++) for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
    if (Math.abs(m[p][q]) < 1e-18) continue;
    const th = 0.5 * Math.atan2(2 * m[p][q], m[q][q] - m[p][p]), cs = Math.cos(th), sn = Math.sin(th);
    for (let k = 0; k < 3; k++) { const a = m[k][p], d = m[k][q]; m[k][p] = cs * a - sn * d; m[k][q] = sn * a + cs * d; }
    for (let k = 0; k < 3; k++) { const a = m[p][k], d = m[q][k]; m[p][k] = cs * a - sn * d; m[q][k] = sn * a + cs * d; }
    for (let k = 0; k < 3; k++) { const a = v[k][p], d = v[k][q]; v[k][p] = cs * a - sn * d; v[k][q] = sn * a + cs * d; }
  }
  return [0, 1, 2].map(i => ({ value: m[i][i], axis: [v[0][i], v[1][i], v[2][i]] })).sort((x, y) => y.value - x.value);
}
const pointsOf = (pos, keep = () => true) => {
  const list = [];
  for (let i = 0; i < pos.length; i += 3) { const p = [pos[i], pos[i + 1], pos[i + 2]]; if (keep(p)) list.push(p); }
  return list;
};

// ---------- selection ----------
const RANKS = "first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth";
const names = pattern => { const n = b.names(pattern); if (!n.length) throw new Error(`no name for ${pattern}`); return n; };
const HAND = names(/^(scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|(first|second|third|fourth|fifth) metacarpal bone|(proximal|middle|distal) phalanx of (thumb|(index|middle|ring|little) finger))$/);
const COLUMN = names(new RegExp(`^((${RANKS}) thoracic vertebra|(first|second|third|fourth|fifth) lumbar vertebra|intervertebral disk of (${RANKS}) thoracic vertebra|intervertebral disk of (first|second|third|fourth|fifth) lumbar vertebra)$`));
const CERVICAL = names(/^(atlas|axis|(third|fourth|fifth|sixth|seventh) cervical vertebra|intervertebral disk of (third|fourth|fifth|sixth|seventh) cervical vertebra)$/);
const RIB_CAGE = [...names(new RegExp(`^(${RANKS}) rib$`)), ...names(new RegExp(`^(${RANKS}) costal cartilage$`)), "manubrium", "body of sternum", "xiphoid process"];
const SKULL = names(/^(frontal bone|occipital bone|parietal bone|temporal bone|sphenoid bone|ethmoid|ethmoid bone|maxilla|mandible|zygomatic bone|nasal bone|vomer|palatine bone|lacrimal bone|inferior nasal concha)$/);

/** [node name, weight class, BodyParts3D names, display group]. */
const UNPAIRED_BONES = [
  ["RibCage", "chest", RIB_CAGE, "thorax"],
  ["Column", "column", COLUMN, "thorax"],
  ["Cervical", "neck", CERVICAL, "neck"],
  ["Skull", "head", SKULL, "skull"],
];
const PAIRED_BONES = [
  ["Clavicle", "chest", ["clavicle"], "shoulder"],
  ["Scapula", "chest", ["scapula"], "shoulder"],
  ["Humerus", "arm", ["humerus"], "arm"],
  ["Ulna", "fore0", ["ulna"], "forearm"],
  ["Radius", "fore4", ["radius"], "forearm"],
  ["Hand", "hand", HAND, "hand"],
];
const MUSCLES = [
  // neck and shoulder girdle
  ["Trapezius", "neck", ["ascending part of trapezius", "transverse part of trapezius", "descending part of trapezius"], "shoulder"],
  ["LevatorScapulae", "neck", ["levator scapulae"], "neck"],
  ["Sternocleidomastoid", "neck", ["sternocleidomastoid"], "neck"],
  ["ScalenusAnterior", "neck", ["scalenus anterior"], "neck"],
  ["ScalenusMedius", "neck", ["scalenus medius"], "neck"],
  ["ScalenusPosterior", "neck", ["scalenus posterior"], "neck"],
  ["SpleniusCapitis", "neck", ["splenius capitis"], "neck"],
  ["SemispinalisCapitis", "neck", ["semispinalis capitis"], "neck"],
  ["RhomboidMajor", "chest", ["rhomboid major"], "shoulder"],
  ["RhomboidMinor", "chest", ["rhomboid minor"], "shoulder"],
  ["SerratusAnterior", "chest", ["serratus anterior"], "shoulder"],
  ["PectoralisMinor", "chest", ["pectoralis minor"], "shoulder"],
  ["Subclavius", "chest", ["subclavius"], "shoulder"],
  // shoulder: from the thorax to the humerus
  ["Deltoid", "shoulder", ["clavicular part of deltoid", "acromial part of deltoid", "spinal part of deltoid"], "shoulder"],
  ["Supraspinatus", "shoulder", ["supraspinatus"], "shoulder"],
  ["Infraspinatus", "shoulder", ["infraspinatus muscle"], "shoulder"],
  ["TeresMinor", "shoulder", ["teres minor"], "shoulder"],
  ["TeresMajor", "shoulder", ["teres major"], "shoulder"],
  ["Subscapularis", "shoulder", ["subscapularis"], "shoulder"],
  ["PectoralisMajor", "shoulder", ["clavicular part of pectoralis major", "sternocostal part of pectoralis major", "abdominal part of pectoralis major"], "shoulder"],
  ["Coracobrachialis", "shoulder", ["coracobrachialis"], "arm"],
  // arm
  ["BicepsBrachii", "armChest", ["long head of biceps brachii", "short head of biceps brachii"], "arm"],
  ["TricepsBrachii", "armChest", ["long head of triceps brachii", "lateral head of triceps brachii", "medial head of triceps brachii"], "arm"],
  ["Brachialis", "arm", ["brachialis"], "arm"],
  ["Anconeus", "arm", ["anconeus"], "arm"],
  // forearm
  ["Brachioradialis", "forearm", ["brachioradialis"], "forearm"],
  ["PronatorTeres", "forearm", ["humeral head of pronator teres", "ulnar head of pronator teres"], "forearm"],
  ["FlexorCarpiRadialis", "forearm", ["flexor carpi radialis"], "forearm"],
  ["PalmarisLongus", "forearm", ["palmaris longus"], "forearm"],
  ["FlexorCarpiUlnaris", "forearm", ["humeral head of flexor carpi ulnaris", "ulnar head of flexor carpi ulnaris"], "forearm"],
  ["FlexorDigitorumSuperficialis", "forearm", ["flexor digitorum superficialis"], "forearm"],
  ["FlexorDigitorumProfundus", "forearm", ["flexor digitorum profundus"], "forearm"],
  ["FlexorPollicisLongus", "forearm", ["flexor pollicis longus"], "forearm"],
  ["PronatorQuadratus", "forearm", ["pronator quadratus"], "forearm"],
  ["ExtensorCarpiRadialisLongus", "forearm", ["extensor carpi radialis longus"], "forearm"],
  ["ExtensorCarpiRadialisBrevis", "forearm", ["extensor carpi radialis brevis"], "forearm"],
  ["ExtensorDigitorum", "forearm", ["extensor digitorum"], "forearm"],
  ["ExtensorDigitiMinimi", "forearm", ["extensor digiti minimi"], "forearm"],
  ["ExtensorCarpiUlnaris", "forearm", ["extensor carpi ulnaris"], "forearm"],
  ["Supinator", "forearm", ["supinator"], "forearm"],
  ["AbductorPollicisLongus", "forearm", ["abductor pollicis longus"], "forearm"],
  ["ExtensorPollicisBrevis", "forearm", ["extensor pollicis brevis"], "forearm"],
  ["ExtensorPollicisLongus", "forearm", ["extensor pollicis longus"], "forearm"],
  ["ExtensorIndicis", "forearm", ["extensor indicis"], "forearm"],
  // hand
  ["AbductorPollicisBrevis", "hand", ["abductor pollicis brevis"], "hand"],
  ["FlexorPollicisBrevis", "hand", ["flexor pollicis brevis"], "hand"],
  ["OpponensPollicis", "hand", ["opponens pollicis"], "hand"],
  ["AdductorPollicis", "hand", ["oblique head of adductor pollicis", "transverse head of adductor pollicis"], "hand"],
  ["AbductorDigitiMinimi", "hand", ["abductor digiti minimi of hand"], "hand"],
  ["FlexorDigitiMinimiBrevis", "hand", ["flexor digiti minimi brevis of hand"], "hand"],
  ["OpponensDigitiMinimi", "hand", ["opponens digiti minimi of hand"], "hand"],
  ["Lumbricals", "hand", ["set of lumbricals of hand"], "hand"],
  ["DorsalInterossei", "hand", ["set of dorsal interossei of hand"], "hand"],
  ["PalmarInterossei", "hand", ["set of palmar interossei of hand"], "hand"],
];

// ---------- anatomical joints ----------
const SIDES = ["L", "R"];
const bones = {};
for (const s of SIDES) for (const [name, , list] of PAIRED_BONES) bones[name + s] = b.load(b.resolve(list, s));
const ribCage = b.load(b.resolve(RIB_CAGE, "C"));
const rest = { ...ENGINE }, axes = {}, measures = {};
for (const s of SIDES) {
  const hum = bones["Humerus" + s].pos, rad = bones["Radius" + s].pos, uln = bones["Ulna" + s].pos;
  const bh = box(hum);
  // Humeral head: the cap at the top of the bone, on the trunk's side; its centre is the joint's.
  const midX = (bh.lo[0] + bh.hi[0]) / 2, towardsTrunk = s === "L" ? -1 : 1;
  const head = fitSphere(pointsOf(hum, p => p[1] > bh.hi[1] - 0.04 && (p[0] - midX) * towardsTrunk > -0.012));
  const shoulder = head.r > 0.015 && head.r < 0.035 ? head.c : sliceCentre(hum, 1, 0.9, 1);
  const elbow = sliceCentre(hum, 1, 0, 0.055);
  const arm = unit(sub(elbow, shoulder));
  // Elbow hinge: the widest extent of the lower humerus, perpendicular to the arm, pointing to the body's right
  // (a positive rotation about it brings the forearm forward).
  let hinge = principalAxes(pointsOf(hum, p => p[1] < bh.lo[1] + 0.035).map(p => sub(p, mul(arm, dot(p, arm)))))[0].axis;
  hinge = unit(sub(hinge, mul(arm, dot(hinge, arm))));
  if (hinge[0] > 0) hinge = mul(hinge, -1);
  const radialHead = sliceCentre(rad, 1, 0.95, 1), ulnarHead = sliceCentre(uln, 1, 0, 0.05);
  const wrist = mul(add(sliceCentre(rad, 1, 0, 0.05), ulnarHead), 0.5);
  const metacarpal = n => b.load(b.resolve([`${n} metacarpal bone`], s)).pos;
  let palmNormal = principalAxes(["second", "third", "fourth", "fifth"].flatMap(n => pointsOf(metacarpal(n))))[2].axis;
  const pisiform = centroid(b.load(b.resolve(["pisiform"], s)).pos), triquetral = centroid(b.load(b.resolve(["triquetral"], s)).pos);
  if (dot(palmNormal, sub(pisiform, triquetral)) < 0) palmNormal = mul(palmNormal, -1);
  const palm = add(centroid(metacarpal("third")), mul(palmNormal, 0.012));
  const tip = centroid(b.load(b.resolve(["distal phalanx of middle finger"], s)).pos);
  Object.assign(rest, { ["arm" + s]: shoulder, ["fore0" + s]: elbow, ["hand" + s]: wrist });
  for (let k = 1; k <= 4; k++) rest[`fore${k}${s}`] = radialHead;
  axes[s] = {
    arm: rounded(arm), hinge: rounded(hinge), pronation: rounded(unit(sub(ulnarHead, radialHead))),
    radialHead: rounded(radialHead), palm: rounded(palm), palmNormal: rounded(unit(palmNormal)),
    fingers: rounded(unit(sub(tip, wrist))), middleTip: rounded(tip),
  };
  measures[s] = {
    humeralHeadRadius: +head.r.toFixed(4), arm: +norm(sub(elbow, shoulder)).toFixed(4),
    forearm: +norm(sub(wrist, elbow)).toFixed(4), elbowToPalm: +norm(sub(palm, elbow)).toFixed(4),
    wristToMiddleTip: +norm(sub(tip, wrist)).toFixed(4),
  };
}

// ---------- skin: joints and weights ----------
const JOINTS = ["pelvis", "spine", "chest", "head", ...SIDES.flatMap(s => ["arm", "fore0", "fore1", "fore2", "fore3", "fore4", "hand"].map(n => n + s))];
const PARENT = { spine: "pelvis", chest: "spine", head: "chest" };
for (const s of SIDES) {
  PARENT["arm" + s] = "chest"; PARENT["fore0" + s] = "arm" + s; PARENT["hand" + s] = "fore4" + s;
  for (let k = 1; k <= 4; k++) PARENT[`fore${k}${s}`] = "fore0" + s;
}
const jointIndex = Object.fromEntries(JOINTS.map((n, i) => [n, i]));

/** Distance from a point to the (sampled) cloud of a set of bones. */
function cloud(...lists) {
  const total = lists.reduce((a, l) => a + l.length / 3, 0), step = Math.max(1, Math.floor(total / 2500));
  const pts = [];
  for (const l of lists) for (let i = 0; i < l.length; i += 3 * step) pts.push(l[i], l[i + 1], l[i + 2]);
  const a = Float32Array.from(pts);
  return p => {
    let d = Infinity;
    for (let i = 0; i < a.length; i += 3) {
      const dx = a[i] - p[0], dy = a[i + 1] - p[1], dz = a[i + 2] - p[2], q = dx * dx + dy * dy + dz * dz;
      if (q < d) d = q;
    }
    return Math.sqrt(d);
  };
}
const toThorax = {}, toHumerus = {};
for (const s of SIDES) {
  toThorax[s] = cloud(ribCage.pos, bones["Clavicle" + s].pos, bones["Scapula" + s].pos);
  toHumerus[s] = cloud(bones["Humerus" + s].pos);
}
const Y_C7 = 0.515, Y_ATLAS = 0.615;

/** Weights of a vertex for the piece's class: { joint: weight }. */
function weights(cls, s, p) {
  switch (cls) {
    case "chest": return { chest: 1 };
    case "head": return { head: 1 };
    case "hand": return { ["hand" + s]: 1 };
    case "fore0": return { ["fore0" + s]: 1 };
    case "fore4": return { ["fore4" + s]: 1 };
    case "column": {
      const pelvis = 1 - smooth(0.03, 0.11, p[1]), chest = smooth(0.16, 0.36, p[1]);
      return { pelvis, chest, spine: Math.max(0, 1 - pelvis - chest) };
    }
    case "neck": { const t = smooth(Y_C7, Y_ATLAS, p[1]); return { head: t, chest: 1 - t }; }
    case "shoulder": case "arm": case "armChest": {
      const E = rest["arm" + s], C = rest["fore0" + s], L = norm(sub(C, E));
      const t = dot(sub(p, E), unit(sub(C, E))) / L;
      const fore = cls === "shoulder" ? 0 : smooth(0.86, 1.14, t);
      let chest = 0;
      if (cls !== "arm") {
        const dt = toThorax[s](p) + 0.002, dh = toHumerus[s](p) + 0.002;
        chest = smooth(0.15, 0.85, dh * dh / (dh * dh + dt * dt));
      }
      return { ["fore0" + s]: fore, chest: (1 - fore) * chest, ["arm" + s]: (1 - fore) * (1 - chest) };
    }
    case "forearm": {
      const C = rest["fore0" + s], W = rest["hand" + s], L = norm(sub(W, C));
      const t = dot(sub(p, C), unit(sub(W, C))) / L;
      const arm = 1 - smooth(-0.1, 0.14, t), hand = smooth(0.93, 1.1, t), left = Math.max(0, 1 - arm - hand);
      const u = Math.max(0, Math.min(0.9999, t)) * 4, k = Math.floor(u), f = u - k;
      return { ["arm" + s]: arm, ["hand" + s]: hand, [`fore${k}${s}`]: left * (1 - f), [`fore${k + 1}${s}`]: left * f };
    }
    default: throw new Error(`unknown class ${cls}`);
  }
}

// ---------- lighter meshes: vertices merged per cell ----------
function lighten({ pos, idx }, cell) {
  const key = new Map(), sum = [], count = [], to = new Uint32Array(pos.length / 3);
  for (let i = 0; i < pos.length; i += 3) {
    const k = `${Math.round(pos[i] / cell)},${Math.round(pos[i + 1] / cell)},${Math.round(pos[i + 2] / cell)}`;
    let n = key.get(k);
    if (n === undefined) { n = count.length; key.set(k, n); sum.push(0, 0, 0); count.push(0); }
    sum[n * 3] += pos[i]; sum[n * 3 + 1] += pos[i + 1]; sum[n * 3 + 2] += pos[i + 2]; count[n]++;
    to[i / 3] = n;
  }
  const p2 = new Float32Array(count.length * 3);
  for (let n = 0; n < count.length; n++) for (let k = 0; k < 3; k++) p2[n * 3 + k] = sum[n * 3 + k] / count[n];
  const seen = new Set(), faces = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = to[idx[i]], c = to[idx[i + 1]], d = to[idx[i + 2]];
    if (a === c || c === d || a === d) continue;
    const k = [a, c, d].sort((x, y) => x - y).join(",");
    if (seen.has(k)) continue;
    seen.add(k); faces.push(a, c, d);
  }
  return { pos: p2, idx: Uint32Array.from(faces) };
}
function normals({ pos, idx }) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, c, d] = [idx[i], idx[i + 1], idx[i + 2]].map(j => [pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]]);
    const f = cross(sub(c, a), sub(d, a));
    for (const j of [idx[i], idx[i + 1], idx[i + 2]]) for (let k = 0; k < 3; k++) n[j * 3 + k] += f[k];
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}

// ---------- pieces ----------
const pieces = [];
function piece(name, kind, group, cls, s, fjs) {
  const source = b.load(fjs), m = lighten(source, kind === "bone" ? CELL_BONE : CELL_MUSCLE), nv = m.pos.length / 3;
  const joints = new Uint8Array(nv * 4), w = new Float32Array(nv * 4);
  for (let i = 0; i < nv; i++) {
    const e = Object.entries(weights(cls, s, [m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]]))
      .filter(([, v]) => v > 1e-4).sort((x, y) => y[1] - x[1]).slice(0, 4);
    const total = e.reduce((a, [, v]) => a + v, 0);
    e.forEach(([joint, v], k) => { joints[i * 4 + k] = jointIndex[joint]; w[i * 4 + k] = v / total; });
  }
  pieces.push({ name, kind, group, side: s, weights: cls, sources: fjs, sourceVertices: source.pos.length / 3, ...m, nrm: normals(m), joints, w });
}
for (const [name, cls, list, group] of UNPAIRED_BONES) piece(`Bone_${name}_C`, "bone", group, cls, "C", b.resolve(list, "C"));
for (const s of SIDES) for (const [name, cls, list, group] of PAIRED_BONES) piece(`Bone_${name}_${s}`, "bone", group, cls, s, b.resolve(list, s));
for (const s of SIDES) for (const [name, cls, list, group] of MUSCLES) piece(`Muscle_${name}_${s}`, "muscle", group, cls, s, b.resolve(list, s));

const ATTRIBUTION = "BodyParts3D v4.0, © DBCLS (The Database Center for Life Science), CC BY-SA 2.1 Japan";
const manifest = {
  attribution: ATTRIBUTION, source: SOURCE + "isa_BP3D_4.0_obj_99.zip",
  frame: "that of public/anatomy.glb: metres, origin at the pelvis centre, +x left, +y up, +z forward",
  cells: { bone: CELL_BONE, muscle: CELL_MUSCLE },
  joints: JOINTS, parents: PARENT, engine: ENGINE,
  rest: Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, rounded(v, 5)])),
  axes, measures,
  pieces: pieces.map(p => ({ name: p.name, kind: p.kind, group: p.group, side: p.side, weights: p.weights, sources: p.sources.length, vertices: p.pos.length / 3, sourceVertices: p.sourceVertices, triangles: p.idx.length / 3 })),
};

// ---------- GLB (standard glTF skin) ----------
const chunks = [], views = [], accessors = [];
let length = 0;
function view(data, target) {
  const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength), pad = (4 - (bytes.length % 4)) % 4;
  views.push({ buffer: 0, byteOffset: length, byteLength: bytes.length, ...(target ? { target } : {}) });
  chunks.push(bytes, Buffer.alloc(pad));
  length += bytes.length + pad;
  return views.length - 1;
}
function accessor(data, type, component, extra = {}, target) {
  accessors.push({ bufferView: view(data, target), componentType: component, count: data.length / { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type], type, ...extra });
  return accessors.length - 1;
}
const nodes = [], meshes = [];
const local = n => (PARENT[n] ? sub(rest[n], rest[PARENT[n]]) : rest[n]);
JOINTS.forEach(n => nodes.push({ name: `joint_${n}`, translation: rounded(local(n), 6) }));
JOINTS.forEach((n, i) => {
  const children = JOINTS.map((m, j) => (PARENT[m] === n ? j : -1)).filter(j => j >= 0);
  if (children.length) nodes[i].children = children;
});
const inverses = new Float32Array(JOINTS.length * 16);
JOINTS.forEach((n, i) => { const p = rest[n]; inverses.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -p[0], -p[1], -p[2], 1], i * 16); });
const skin = { joints: JOINTS.map((_, i) => i), skeleton: 0, inverseBindMatrices: accessor(inverses, "MAT4", 5126) };
for (const p of pieces) {
  const { lo, hi } = box(p.pos);
  const idx = p.pos.length / 3 < 65536 ? Uint16Array.from(p.idx) : p.idx;
  meshes.push({
    name: p.name,
    primitives: [{
      attributes: {
        POSITION: accessor(p.pos, "VEC3", 5126, { min: lo, max: hi }, 34962), NORMAL: accessor(p.nrm, "VEC3", 5126, {}, 34962),
        JOINTS_0: accessor(p.joints, "VEC4", 5121, {}, 34962), WEIGHTS_0: accessor(p.w, "VEC4", 5126, {}, 34962),
      },
      indices: accessor(idx, "SCALAR", idx instanceof Uint16Array ? 5123 : 5125, {}, 34963),
    }],
  });
  nodes.push({ name: p.name, mesh: meshes.length - 1, skin: 0 });
}
const gltf = {
  asset: { version: "2.0", generator: "scripts/build_upper_body.mjs", copyright: ATTRIBUTION },
  scene: 0, scenes: [{ name: "AnatomyUpper", nodes: [0, ...pieces.map((_, i) => JOINTS.length + i)], extras: manifest }],
  nodes, meshes, skins: [skin], accessors, bufferViews: views, buffers: [{ byteLength: length }],
};
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const bin = Buffer.concat(chunks), header = Buffer.alloc(12), hJson = Buffer.alloc(8), hBin = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
hJson.writeUInt32LE(json.length, 0); hJson.writeUInt32LE(0x4e4f534a, 4);
hBin.writeUInt32LE(bin.length, 0); hBin.writeUInt32LE(0x004e4942, 4);
const rawFile = path.join(cache, "anatomy_upper.raw.glb");
writeFileSync(rawFile, Buffer.concat([header, hJson, json, hBin, bin]));
if (process.argv.includes("--raw")) renameSync(rawFile, out);
else execFileSync("npx", ["--yes", "@gltf-transform/cli@4", "draco", rawFile, out], { stdio: ["ignore", "ignore", "inherit"] });

const total = k => pieces.filter(p => p.kind === k).reduce((a, p) => a + p.pos.length / 3, 0);
console.log(`pièces : ${pieces.filter(p => p.kind === "bone").length} os (${total("bone")} sommets), ${pieces.filter(p => p.kind === "muscle").length} muscles (${total("muscle")} sommets)`);
console.log(`GLB : ${((12 + 8 + json.length + 8 + bin.length) / 1e6).toFixed(2)} Mo avant compression → ${out}`);
for (const s of SIDES) console.log(`côté ${s}`, JSON.stringify(measures[s]), "épaule", rounded(rest["arm" + s], 3), "coude", rounded(rest["fore0" + s], 3), "poignet", rounded(rest["hand" + s], 3));
console.log(`Attribution requise : ${ATTRIBUTION}`);
