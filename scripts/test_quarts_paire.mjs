// #37 — quarter turns in pair, around the leader (docs/spec-quarts-paire.md), on the real GLB.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL(`./.test-quarts-paire-bundle-${process.pid}.mjs`, import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'share']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
// #211: QUART=<candidat> runs these tests on a candidate quarter turn (`?quart=` in the app), to measure it.
if (process.env.QUART) api.setQuartProto(process.env.QUART);
const near = (a, b, tolerance = 1e-8, label = '') => assert.ok(Math.abs(a - b) <= tolerance, `${label} ${a} != ${b} (tol ${tolerance})`);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.QUARTS_PAIR_DZ;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const options = (i, extra = {}) => ({ movement: 'quarts', quarts: true, embrace: true, quartsPaire: true, follower: !!i, plexus: process.env.TEST_PLEXUS === '1', ...extra });
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
  // #208: the virgula lands one foot further forward and the follower steps back as far: the turn centre (fixed by
  // where the virgula lands, the quarter being rigid) moves from beside the leader to between the partners, who then
  // travel about the same distance (the follower further before #208). Question put to the owner.
  assert(follower > 0.9 * leader, `follower travels about as far as the leader (${follower.toFixed(3)} > 0.9 × ${leader.toFixed(3)})`);
  console.log(`PASS boussole: pieds du leader dans les 4 quarts ; bassin du leader ${leader.toFixed(2)} m, du suiveur ${follower.toFixed(2)} m par tour`);
}

// 3. Sequence (#82, owner: « le suiveur anticipe [...] ça doit se faire en simultané » ; « le leader engage
// le buste avec son pied gauche »): the follower's D and the leader's G leave together and land together on beat 1,
// then her G and his D. Body rotation, #208 (rule of 25 Nov. 2026, replacing the #106 diagonal for the quarter): no
// pivot with the first step, which only goes forward (his virgula) and back (her D); pelvis and chest turn from the
// first landing to the second, gradually (never backwards), the chest a little later (#126); both dancers in step.
// The pelvis still goes over the first foot as the weight moves onto it.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  const S = api.QUARTS_SHAPES, Q = Math.PI / 2;
  assert.equal(S.follower[0].start, S.leader[0].start, 'first feet leave together');
  assert.equal(S.follower[0].end, 1, 'the follower D lands on beat 1');
  assert.equal(S.leader[0].end, 1, 'the leader G lands on beat 1');
  assert(S.leader[1].start >= S.leader[0].end && S.follower[1].start >= S.follower[0].end, 'G then D (leader), D then G (follower)');
  for (const follower of [false, true]) {
    const s = b => api.sampleQuartsPaire(b, follower, rest, 'quinconce');
    const first = follower ? S.follower : S.leader;
    // #126: the chest follows the pelvis `chestLag` beats later (the weight transfer).
    for (let tick = 0; tick < 1600; tick++) { const t = tick / 100;
      near(wrap(s(t).rootYaw + s(t).chestYaw - s(t - api.QUARTS_BODY.chestLag).rootYaw), 0, 1e-9, `chest follows the pelvis ${api.QUARTS_BODY.chestLag} beat later at ${t}`); }
    for (let quarter = 0; quarter < 4; quarter++) {
      const t0 = quarter * 4;
      near(wrap(s(t0 + first[0].end).rootYaw - s(t0).rootYaw), 0, 1e-9, `no pivot with the first step (quarter ${quarter})`);
      near(wrap(s(t0 + first[1].end).rootYaw - s(t0).rootYaw), Q, 1e-6, `whole quarter with the second foot (quarter ${quarter})`);
      let previous = 0;
      for (let tick = 0; tick <= 100; tick++) {
        const t = t0 + first[0].end + (first[1].end - first[0].end) * tick / 100, turned = wrap(s(t).rootYaw - s(t0).rootYaw);
        assert(turned >= previous - 1e-9, `the block turns gradually between the two landings (quarter ${quarter}, ${t})`); previous = turned;
      }
      // The pelvis has moved towards the first foot when it lands (his forward, her back): more than half its way.
      const from = s(t0).root, at = s(t0 + first[0].end).root, foot = s(t0 + first[0].end).feet[follower ? 'R' : 'L'], start = s(t0).feet[follower ? 'R' : 'L'];
      const along = ((at.x - from.x) * (foot.x - start.x) + (at.z - from.z) * (foot.z - start.z)) / Math.hypot(foot.x - start.x, foot.z - start.z) ** 2;
      assert(along > 0.5, `the pelvis goes over the first foot (quarter ${quarter}, ${along.toFixed(2)})`);
    }
  }
  console.log('PASS séquence : D du suiveur et G du leader ensemble (posés sur le 1) ; le premier pas avance sans pivot, le bloc tourne entre les deux poses (#208)');
}


// 4–5. GLB pose invariants: floor, IK targets, bone lengths, functional foot axis, loads, planted foot,
// continuity and loop.
let poses = 0, minY = Infinity, maxAnkleError = 0;
for (const styleKey of Object.keys(api.STYLES).filter(k => api.movementAllowed(k, 'quarts'))) for (const amp of [.5, 1, 2]) {
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
      // #106: the leader's trailing D may rise on its ball (never more than QUARTS_BODY.heel): the ball
      // of the foot is what stays planted; every other waiting foot stays flat.
      const ball = () => f.model.legs[side].ball.clone().applyMatrix4(f.r['foot' + side].matrixWorld);
      api.applyPose(f.r, f.model, 4 * quarter + from + .001, config); const start = ball();
      for (let t = from + .05; t < to; t += .05) {
        api.applyPose(f.r, f.model, 4 * quarter + t, config);
        // The rigid GLB foot rests on its toes once the heel is up: the ball stays put horizontally and
        // the lowest sole point stays on the floor.
        const now = ball();
        near(Math.hypot(now.x - start.x, now.z - start.z), 0, 1e-9, `${side} planted q${quarter} t${t.toFixed(2)}`);
        const lowest = Math.min(...f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld).y));
        near(lowest, 0, 1e-4, `${side} on the floor q${quarter} t${t.toFixed(2)}`);
        const pitch = api.sampleQuartsPaire(4 * quarter + t, follower, { L: f.model.legs.L.rest, R: f.model.legs.R.rest }, api.placementOffset('quinconce', 1)).feet[side].pitch ?? 0;
        assert(follower || k === 0 ? Math.abs(pitch) < 1e-12 : pitch >= 0 && pitch <= api.QUARTS_BODY.heel + 1e-12, `${side} flat or on its ball q${quarter} t${t.toFixed(2)}: ${pitch}`);
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
console.log('PASS pied porteur immobile (D du leader sur sa demi-pointe, #106), continuité et boucle de 16 temps');

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
for (const placement of ['quinconce', 'face']) for (const styleKey of Object.keys(api.STYLES).filter(k => api.movementAllowed(k, 'quarts'))) for (const amp of [.5, 1, 2]) {
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

// #208, #219 (R34): in the game mode the pelvis never stops and its speed never breaks, from the basic step through the
// quarter turn and back (scripts/bassin_mesure.mjs). Before: the pelvis went 45 % of the way round C within the first
// foot's flight (80 cm per beat, 419 cm/beat²), stood still for the last beat (0.08 beat), and broke its speed at both
// junctions (473 and 528 cm/beat²); its roll stopped dead at the cap (656 °/beat²). The basic step: 30 cm/beat².
// Known gap, held where it is: the height follows the legs' reach (468 to 1 020 cm/beat², 507 to 914 before; 44 in the
// basic step). A pelvis that anticipates it, even lowered by 5 mm, crosses the bones (docs/spec-bassin-continu.md).
{
  const { pelvisSession, zoneOf } = await import('./bassin_mesure.mjs');
  const LIMIT = { a: 350, ay: 1100, ar: 300, aw: 200, vmax: 60 };
  const worst = {};
  for (const styleKey of ['kizomba', 'semba', 'suave']) {
    const { end, roles } = await pelvisSession('quart', { styleKey });
    for (const [role, rows] of Object.entries(roles)) {
      const z = zoneOf(rows, -0.5, end + 1);
      assert.equal(z.still, 0, `${styleKey} ${role}: the pelvis stands still ${z.still} beat`);
      // Height and roll: semba's own bounce (in every figure, and in the passage to the basic step danced in suave).
      for (const key of ['a', 'aw', ...(styleKey === 'semba' ? [] : ['ay', 'ar'])])
        assert(z[key].value < LIMIT[key], `${styleKey} ${role}: ${key} ${z[key].value.toFixed(0)} at ${z[key].t.toFixed(2)} (≤ ${LIMIT[key]})`);
      assert(z.vmax < LIMIT.vmax, `${styleKey} ${role}: top speed ${z.vmax.toFixed(1)} cm per beat`);
      for (const key of ['a', 'ay', 'aw', 'ar']) if (!worst[key] || z[key].value > worst[key].value) worst[key] = { ...z[key], styleKey, role };
      if (!worst.vmin || z.vmin.value < worst.vmin.value) worst.vmin = { ...z.vmin, styleKey, role };
    }
  }
  const say = k => `${worst[k].value.toFixed(0)} (${worst[k].styleKey}, ${worst[k].role}, ${worst[k].t.toFixed(2)})`;
  console.log(`PASS #208 : bassin du quart de tour sans arrêt (au moins ${worst.vmin.value.toFixed(1)} cm par temps), accélération au sol ${say('a')}, `
    + `en hauteur ${say('ay')}, lacet ${say('aw')}, roulis ${say('ar')} ; jonctions comprises`);
}
