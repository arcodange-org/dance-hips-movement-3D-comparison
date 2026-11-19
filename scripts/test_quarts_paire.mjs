// #37 — quarter turns in pair, around the leader (docs/spec-quarts-paire.md), on the real GLB.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-quarts-paire-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'share']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const near = (a, b, tolerance = 1e-8, label = '') => assert.ok(Math.abs(a - b) <= tolerance, `${label} ${a} != ${b} (tol ${tolerance})`);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.QUARTS_PAIR_DZ;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const options = (i, extra = {}) => ({ movement: 'quarts', quarts: true, embrace: true, quartsPaire: true, follower: !!i, ...extra });
const stanceOf = m => (m.legs.L.hipX - m.legs.L.rest.x + m.legs.R.rest.x - m.legs.R.hipX) / 2;
const footAxis = (f, side) => { const t = f.model.legs[side].toeOut;
  return new THREE.Vector3(Math.sin(t), 0, Math.cos(t)).applyQuaternion(f.r['foot' + side].getWorldQuaternion(new THREE.Quaternion())); };
const rotateAbout = (c, p, th) => { const x = p.x - c.x, z = p.z - c.z;
  return { x: c.x + x * Math.cos(th) + z * Math.sin(th), z: c.z - x * Math.sin(th) + z * Math.cos(th) }; };

// 1. Rigid quarter turns: at the end of quarter k, feet and pelvises are the start rotated by k·π/2
// about the centre, the partners face each other, and the couple is back at the start after 16 beats.
for (const placement of ['quinconce', 'face', 'reference']) {
  const pair = couple();
  const rest = { L: pair[0].model.legs.L.rest, R: pair[0].model.legs.R.rest };
  const stance = stanceOf(pair[0].model);
  const c0 = api.quartsCouple(rest, api.placementOffset(placement, 1), stance).centre;
  const centre = { x: c0.x, z: c0.z - dz }; // world
  const at = beat => pair.map((f, i) => { api.applyPose(f.r, f.model, beat, options(i, { placement }));
    return { L: world(f, 'footL'), R: world(f, 'footR'), root: world(f, 'root'),
      yaw: new THREE.Euler().setFromQuaternion(f.r.root.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y }; });
  // At b = 0 both dancers stand on their start feet (only the leader's upper body anticipates).
  const start = at(0);
  for (let k = 1; k <= 4; k++) {
    const end = at(4 * k);
    for (const i of [0, 1]) for (const key of ['L', 'R', 'root']) {
      const expected = rotateAbout(centre, start[i][key], k * Math.PI / 2);
      near(end[i][key].x, expected.x, 1e-6, `${placement} q${k} role${i} ${key}.x`);
      near(end[i][key].z, expected.z, 1e-6, `${placement} q${k} role${i} ${key}.z`);
    }
    near(wrap(end[0].yaw - k * Math.PI / 2), 0, 1e-6, `${placement} leader faces quarter ${k}`);
    near(wrap(end[1].yaw - end[0].yaw - Math.PI), 0, 1e-6, `${placement} partners face each other at quarter ${k}`);
  }
}
console.log('PASS quarts en paire: rotation rigide du couple autour du centre, face à face à chaque quart, retour au départ');

// 2. The leader's feet fill the four quarters of the couple's compass; the follower travels further.
{
  const pair = couple(); const quadrants = new Set(); let leader = 0, follower = 0, previous = null;
  for (let tick = 0; tick <= 1600; tick++) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, tick / 100, options(i, { placement: 'quinconce' })));
    for (const side of ['L', 'R']) { const p = world(pair[0], 'foot' + side); quadrants.add(`${p.x > 0 ? 'W' : 'E'}${p.z > 0 ? 'S' : 'N'}`); }
    const roots = pair.map(f => world(f, 'root'));
    if (previous) { leader += roots[0].distanceTo(previous[0]); follower += roots[1].distanceTo(previous[1]); }
    previous = roots;
  }
  assert.equal(quadrants.size, 4, `leader feet in every quarter of the compass (${[...quadrants]})`);
  assert(follower > leader, `follower travels further (${follower.toFixed(3)} > ${leader.toFixed(3)})`);
  console.log(`PASS boussole: pieds du leader dans les 4 quarts ; bassin du leader ${leader.toFixed(2)} m, du suiveur ${follower.toFixed(2)} m par tour`);
}

// 3. Sequence and lead: the follower's D leaves first (on the beat) and her G follows; the leader's G
// lands in the place her D left, then his D; the leader's upper body runs QUARTS_LEAD ahead of hers.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  const S = api.QUARTS_SHAPES;
  assert.equal(S.follower[0].start, 0, 'the follower answers on the beat');
  assert(S.follower[1].start > S.follower[0].start && S.leader[0].start > S.follower[0].start, 'follower D first');
  assert(S.leader[0].end < S.follower[0].end, 'the leader G lands before the follower D slides in beside it');
  assert(S.leader[1].start >= S.leader[0].end, 'leader G then D');
  const yaw = s => s.rootYaw + s.chestYaw;
  for (let tick = 0; tick < 1600; tick++) {
    const b = tick / 100;
    const L = api.sampleQuartsPaire(b, false, rest, 'quinconce'), F = api.sampleQuartsPaire(b + api.QUARTS_LEAD, true, rest, 'quinconce');
    near(wrap(yaw(L) - yaw(F)), 0, 1e-9, `leader upper body leads by ${api.QUARTS_LEAD} at ${b}`);
  }
  console.log('PASS séquence : D puis G du suiveur, G puis D du leader, buste du leader en avance de', api.QUARTS_LEAD, 'temps');
}

// 4–5. GLB pose invariants: floor, IK targets, bone lengths, functional foot axis, loads, planted foot,
// continuity and loop.
let poses = 0, minY = Infinity, maxAnkleError = 0;
for (const styleKey of Object.keys(api.STYLES)) for (const amp of [.5, 1, 2]) {
  const pair = couple();
  for (let tick = 0; tick <= 64; tick++) for (const [i, f] of pair.entries()) {
    const beat = tick / 4;
    const stats = api.applyPose(f.r, f.model, beat, options(i, { styleKey, amp, placement: 'quinconce' }));
    snapshot(f.r).forEach(v => assert(Number.isFinite(v)));
    const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
    assert(ground >= -.0001, `floor ${styleKey} ${amp} ${beat}: ${ground}`);
    near(stats.loadL + stats.loadR, 1);
    const sample = api.sampleQuartsPaire(beat, !!i, { L: f.model.legs.L.rest, R: f.model.legs.R.rest }, api.placementOffset('quinconce', amp), stanceOf(f.model));
    for (const side of ['L', 'R']) {
      const hip = world(f, 'hip' + side), knee = world(f, 'knee' + side), foot = world(f, 'foot' + side);
      const error = foot.distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
      maxAnkleError = Math.max(maxAnkleError, error);
      assert(error < .001, `final target ${styleKey} ${beat} ${side}`);
      near(hip.distanceTo(knee), f.model.legs[side].length1);
      near(knee.distanceTo(foot), f.model.legs[side].length2);
      if (f.model.lift[side] > 1e-6) near(stats['load' + side], 0);
      // Feet forward along the knees: the heel → ball axis turns with the foot's yaw; #49: it only
      // pitches (heel rise, heel strike) in the vertical plane of that yaw.
      const forward = footAxis(f, side), yaw = sample.feet[side].yaw + (i ? Math.PI : 0);
      const pitch = sample.feet[side].pitch ?? 0, flat = Math.hypot(forward.x, forward.z);
      near(flat, Math.cos(pitch), 1e-6, `foot pitch ${styleKey} ${beat} ${side}`);
      near(forward.x / flat, Math.sin(yaw), 1e-6, `foot axis x ${styleKey} ${beat} ${side}`);
      near(forward.z / flat, Math.cos(yaw), 1e-6, `foot axis z ${styleKey} ${beat} ${side}`);
    }
    poses++;
  }
}
console.log('PASS quarts en paire GLB:', poses, 'poses ; min vertex Y', minY, '; max ankle error', maxAnkleError);

for (const follower of [false, true]) {
  const f = couple()[follower ? 1 : 0];
  const config = options(follower ? 1 : 0, { placement: 'quinconce' });
  const shapes = api.QUARTS_SHAPES[follower ? 'follower' : 'leader'];
  const order = follower ? ['R', 'L'] : ['L', 'R'];
  // Never both feet in the air: a foot leaves only once the other has landed.
  assert(shapes[1].start >= shapes[0].end && shapes[0].start + 4 >= shapes[1].end, `${follower ? 'follower' : 'leader'}: one foot at a time`);
  for (let quarter = 0; quarter < 4; quarter++) for (const [k, side] of order.entries()) {
    // Outside its own flight window, a foot stays where it is (it carries the weight or waits).
    const windows = [[0, shapes[k].start], [shapes[k].end, 4]];
    for (const [from, to] of windows) {
      if (to - from < .05) continue;
      api.applyPose(f.r, f.model, 4 * quarter + from + .001, config); const start = world(f, 'foot' + side);
      for (let t = from + .05; t < to; t += .05) {
        api.applyPose(f.r, f.model, 4 * quarter + t, config);
        near(start.distanceTo(world(f, 'foot' + side)), 0, 1e-9, `${side} planted q${quarter} t${t.toFixed(2)}`);
      }
    }
  }
  for (const beat of [0, .25, 1.2, 2, 3.2, 4, 7.75, 8, 12, 15.75, 16, ...order.flatMap((_, k) => [shapes[k].start, shapes[k].end])]) {
    api.applyPose(f.r, f.model, beat - 1e-7, config); const before = snapshot(f.r);
    api.applyPose(f.r, f.model, beat + 1e-7, config);
    snapshot(f.r).forEach((v, n) => near(v, before[n], .0001, `continuity ${beat}`));
  }
  api.applyPose(f.r, f.model, 0, config); const first = snapshot(f.r);
  api.applyPose(f.r, f.model, 16, config); snapshot(f.r).forEach((v, n) => near(v, first[n], 1e-6, 'loop'));
}
console.log('PASS pied porteur immobile, continuité et boucle de 16 temps');

// 6. Swept foot hulls of the four feet stay apart, every placement, amplitudes 1, 1.5 and 2.
for (const placement of ['quinconce', 'face']) for (const amp of [1, 1.5, 2]) {
  const pair = couple();
  for (let tick = 0; tick < 1600; tick += 2) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 100, options(i, { placement, amp }));
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      assert(!footHullsOverlap(polygons[i], polygons[j]), `foot clearance ${placement} amp ${amp} at ${tick / 100}, feet ${i}/${j}`);
  }
}
console.log('PASS enveloppes des quatre pieds disjointes (quinconce, face à face ; amplitudes 1 ; 1,5 ; 2)');

// Leg bones: no crossing between partners nor between one dancer's legs (six styles, three amplitudes).
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
let collisionPoses = 0;
for (const placement of ['quinconce', 'face']) for (const styleKey of Object.keys(api.STYLES)) for (const amp of [.5, 1, 2]) {
  const pair = couple();
  // One quarter is enough: the others are the same up to the rotation (checked above).
  for (let beat = 0; beat < 4; beat += .125) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i, { styleKey, amp, placement })));
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames) {
      const collision = meshIntersection(meshes[0][a], meshes[1][b]);
      assert(!collision, JSON.stringify({ placement, styleKey, amp, beat, leader: a, partner: b, collision }));
    }
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R'))) {
        const collision = meshIntersection(own[a], own[b]);
        assert(!collision, JSON.stringify({ placement, styleKey, amp, beat, role, left: a, right: b, collision }));
      }
    collisionPoses++;
  }
}
console.log('PASS', collisionPoses, 'poses de couple : aucun croisement des os des jambes, entre danseurs ni pour un même danseur');

// Share URL keeps the placement for pair quarter turns.
const url = new URL(api.buildShareUrl('https://example.test/', { mode: 'pair', quarts: true, placement: 'face' }, null, null));
assert.equal(url.searchParams.get('placement'), 'face');
console.log('PASS partage du placement des quarts en paire');
