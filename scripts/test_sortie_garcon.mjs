import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-sortie-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'clock', 'rigJoints', 'sortieGarcon', 'sortieGarconContact', 'share']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b} (tol ${tolerance})`);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const couple = (figure = true) => {
  const dz = figure ? api.SORTIE_GARCON_PAIR_DZ : api.PAIR_DZ;
  return [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
};
const options = { movement: 'sortieG', embrace: true };

// Direction and support assertions describe the validated choreography, independently of the planner.
for (const sortieVariant of ['line', 'right']) {
  const pair = couple();
  const states = [];
  for (let beat = 0; beat <= 5; beat++) {
    states.push(pair.map((f, i) => {
      const stats = api.applyPose(f.r, f.model, beat, { ...options, follower: !!i, sortieVariant });
      return { L: world(f, 'footL'), R: world(f, 'footR'), root: world(f, 'root'), stats };
    }));
  }
  assert(states[1][0].L.x - states[0][0].L.x > .3, 'leader exits to own left');
  assert(states[1][0].L.z > states[0][0].L.z + .1, 'leader advances G');
  assert(states[1][1].R.z > states[0][1].R.z + .1, 'partner retreats D');
  assert(states[2][0].R.z > states[2][0].L.z + .2, 'leader D is in front of G');
  assert(states[2][0].R.x > Math.max(states[2][1].R.x, states[2][1].L.x) + .1,
    'leader feet outside partner feet, not interleaved');
  assert(states[3][0].L.x < states[3][0].R.x - .1, 'G crosses in front of D toward initial lane');
  assert(states[3][0].L.z > states[3][0].R.z + .15, 'cross is forward');
  for (let beat = 0; beat <= 5; beat++) {
    near(states[beat][0].stats.loadR, [1, 0, 1, 0, 1, 1][beat]);
    near(states[beat][1].stats.loadR, [0, 1, 0, 1, 0, 0][beat]);
  }
  for (const i of [0, 1]) {
    for (const side of ['L', 'R']) {
      near(states[5][i][side].z - states[0][i][side].z, .70);
      near(states[5][i][side].x - states[0][i][side].x, sortieVariant === 'right' ? -.1 : 0);
    }
    near(states[5][i].L.x - states[5][i].R.x, states[0][i].L.x - states[0][i].R.x);
  }
  near(states[5][0].root.x, states[5][1].root.x);
}
const restForProgress = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
for (const follower of [false, true]) for (const variant of ['line', 'right']) {
  let previous = api.sampleSortieGarcon(0, follower, restForProgress, variant);
  for (let tick = 1; tick <= 500; tick++) {
    const current = api.sampleSortieGarcon(tick / 100, follower, restForProgress, variant);
    for (const side of ['L', 'R']) assert((current.feet[side].z - previous.feet[side].z) * (follower ? -1 : 1) >= -1e-12,
      'the forward leader / retreating partner never make a backward excursion');
    previous = current;
  }
}
console.log('PASS sortie garçon: directions, croisé, partenaire, quatre transferts et deux fins');

let poses = 0, minY = Infinity, maxAnkleError = 0;
for (const styleKey of Object.keys(api.STYLES)) for (const amp of [.5, 1, 2]) for (const sortieVariant of ['line', 'right']) {
  const pair = couple();
  for (let tick = 0; tick <= 100; tick++) for (const [i, f] of pair.entries()) {
    const beat = tick / 20;
    const stats = api.applyPose(f.r, f.model, beat, { ...options, styleKey, amp, sortieVariant, follower: !!i, plant: false, travel: 1, dir: -1 });
    snapshot(f.r).forEach(v => assert(Number.isFinite(v)));
    const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
    assert(ground >= -.0001, `floor ${styleKey} ${amp} ${beat}: ${ground}`);
    near(stats.loadL + stats.loadR, 1);
    for (const side of ['L', 'R']) {
      const hip = world(f, 'hip' + side), knee = world(f, 'knee' + side), foot = world(f, 'foot' + side);
      const error = foot.distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
      maxAnkleError = Math.max(maxAnkleError, error);
      assert(error < .001, `final target ${styleKey} ${beat} ${side}`);
      near(hip.distanceTo(knee), f.model.legs[side].length1);
      near(knee.distanceTo(foot), f.model.legs[side].length2);
      if (f.model.lift[side] > 1e-6) near(stats['load' + side], 0);
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(f.r['foot' + side].getWorldQuaternion(new THREE.Quaternion()));
      near(forward.z, i ? -1 : 1); near(forward.x, 0);
    }
    if (beat >= 4) near(i ? stats.loadR : stats.loadL, 0);
    poses++;
  }
}
console.log('PASS sortie garçon GLB:', poses, 'poses; min vertex Y', minY, '; max ankle error', maxAnkleError);

for (const follower of [false, true]) for (const sortieVariant of ['line', 'right']) {
  const f = couple()[follower ? 1 : 0];
  const config = { ...options, follower, sortieVariant };
  for (let action = 0; action < 5; action++) {
    api.applyPose(f.r, f.model, action, config);
    const moving = (follower ? ['R', 'L', 'R', 'L', 'R'] : ['L', 'R', 'L', 'R', 'L'])[action];
    const planted = moving === 'L' ? 'R' : 'L';
    const start = world(f, 'foot' + planted);
    for (let phase = .05; phase < 1; phase += .05) {
      api.applyPose(f.r, f.model, action + phase, config);
      near(start.distanceTo(world(f, 'foot' + planted)), 0);
    }
  }
  for (const beat of [0, .3, .6, .65, 1, 1.3, 1.6, 2, 2.3, 2.6, 3, 3.3, 3.6, 4, 4.6, 5, 8]) {
    api.applyPose(f.r, f.model, beat - 1e-7, config); const before = snapshot(f.r);
    api.applyPose(f.r, f.model, beat + 1e-7, config);
    snapshot(f.r).forEach((v, n) => near(v, before[n], .0001));
  }
  api.applyPose(f.r, f.model, 5, config); const final = snapshot(f.r);
  api.applyPose(f.r, f.model, 9, config); snapshot(f.r).forEach((v, n) => near(v, final[n]));
  api.applyPose(f.r, f.model, .2, config);
  api.applyPose(f.r, f.model, 5, config); snapshot(f.r).forEach((v, n) => near(v, final[n]));
}
console.log('PASS planted-foot stability, continuous transitions, final hold and seek independence');

for (const sortieVariant of ['line', 'right']) {
  const pair = couple();
  for (let tick = 0; tick <= 500; tick++) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 100, { ...options, follower: !!i, sortieVariant });
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      assert(!footHullsOverlap(polygons[i], polygons[j]), `foot clearance at ${tick / 100} (${sortieVariant}), feet ${i}/${j}`);
  }
  pair.forEach((f, i) => api.applyPose(f.r, f.model, 2, { ...options, follower: !!i }));
  const proximity = api.thighProximity(world(pair[0], 'hipR'), world(pair[0], 'kneeR'), world(pair[1], 'hipR'), world(pair[1], 'kneeR'));
  assert(proximity.direction.x < -.95, 'D/D proximity is lateral, on both anatomical right flanks');
  assert(proximity.gap >= 0 && proximity.gap < .03, `illustrative thigh gap ${proximity.gap}`);
}
console.log('PASS swept foot hull clearance and lateral D/D thigh proximity (illustrative envelopes)');

// The geometry guard must detect both surface crossings and full containment.
const cube = (size, x = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size));
  mesh.position.x = x; mesh.updateMatrixWorld(true); return transformedMesh(mesh);
};
assert(meshIntersection(cube(.1), cube(.1, .075)));
assert(meshIntersection(cube(.1), cube(.02)));
assert.equal(meshIntersection(cube(.1), cube(.1, .2)), null);

// Real transformed triangles, not GLB cached bounding boxes or knee-marker distances.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
const collisionBeats = [...new Set([...Array.from({ length: 51 }, (_, i) => i / 10), .26, 2.83, 3.07, 4.25, 4.42, 4.87])].sort((a, b) => a - b);
let collisionPoses = 0;
for (const styleKey of Object.keys(api.STYLES)) for (const amp of [.5, 1, 2]) for (const sortieVariant of ['line', 'right']) {
  const pair = couple();
  for (const beat of collisionBeats) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, { ...options, styleKey, amp, sortieVariant, follower: !!i }));
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames) {
      const collision = meshIntersection(meshes[0][a], meshes[1][b]);
      assert(!collision, JSON.stringify({ styleKey, amp, sortieVariant, beat, leader: a, partner: b, collision }));
    }
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R'))) {
        const collision = meshIntersection(own[a], own[b]);
        assert(!collision, JSON.stringify({ styleKey, amp, sortieVariant, beat, role, left: a, right: b, collision }));
      }
    collisionPoses++;
  }
}
console.log('PASS', collisionPoses, 'couple poses: no inter/intra-dancer leg-bone triangle crossing or containment');

const legacy = JSON.parse(readFileSync(new URL('./fixtures/sorties-historiques.json', import.meta.url)));
const fingerprint = values => createHash('sha256').update(JSON.stringify(values.map(v => Math.round(v * 1e6)))).digest('hex');
let regressions = 0;
for (const { poses: rows, ...config } of legacy.cases) {
  const f = couple(config.movement === 'sortieG')[config.follower ? 1 : 0];
  for (const [beat, expected] of rows) {
    const stats = api.applyPose(f.r, f.model, beat, { sortieVariant: 'right', sortieContra: 30, ...config, embrace: true, sortieFilleVariant: 'back' });
    assert.equal(fingerprint([...snapshot(f.r), stats.loadL, stats.loadR, stats.kneeL, stats.kneeR]), expected,
      `historical ${JSON.stringify(config)} at ${beat}`);
    regressions++;
  }
}
console.log('PASS', regressions, 'unchanged sortieG/sortieGF final poses from', legacy.source);

const clock = api.createDanceClock(); clock.beat = 4.99;
api.advanceClock(clock, .1, 90, true, 5); near(clock.beat, 5);
api.advanceClock(clock, .1, 90, true, 5); near(clock.beat, 5);
clock.exportFrame = 0; clock.beat = 3;
api.advanceClock(clock, .1, 90, true, 5); near(clock.beat, 3);
for (const [movement, expected] of [['sortieG', 5], ['sortieF', 5], ['sortieGF', 16]]) near(api.cycleBeats({ movement }), expected);
for (const variant of ['line', 'right']) {
  const url = new URL(api.buildShareUrl('https://example.test/', { sortieG: true, sortieVariant: variant, sortieContra: 23, sortieBeat: 5 }, null, null));
  assert.deepEqual(api.sortieGarconSettings(url.searchParams), { variant, contra: 23, beat: 5 });
}
assert.deepEqual(api.sortieGarconSettings(new URLSearchParams('sortieVariant=unknown&sortieContra=NaN&sortieBeat=Infinity')),
  { variant: 'line', contra: 12, beat: 0 });
api.seekClock(clock, 2); near(clock.beat, 2); near(clock.revision, 1);
near(api.cycleBeats({ movement: 'sortieG', temps3: true }), 5);
console.log('PASS five-action transport, export period, settings and shared pose');
