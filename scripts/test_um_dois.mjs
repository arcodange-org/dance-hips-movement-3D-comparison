// #196 (rule R42, docs/spec-pas-de-base-1-2.md): the « 1 2 », basic step of the kizomba and of the semba,
// PROTOTYPE shown by `?unDeux=<candidat>`. On the real GLB: the supports (weight on the leg that stepped aside
// on 1 and 2, on the other on 3 and 4), the marka without weight, the step's width, the feet (on the floor,
// moving only when free), the continuity of the pelvis, and nothing changed without the parameter.
// What is NOT checked here: the choreography itself, which the owner judges on film.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY } from "./pose_fixture.mjs";
const bundle = new URL("./.test-um-dois-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'umDois'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname, define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

const STEPS = 32, TEMPO = { kizomba: 90, semba: 130 }, JOINTS = ['pelvis', 'chest', 'head', 'hipL', 'hipR', 'kneeL', 'kneeR', 'footL', 'footR'];
const f = fixture(api, {});
const world = name => { f.r.root.updateWorldMatrix(true, true); return f.r[name].getWorldPosition(new THREE.Vector3()); };
const pose = (styleKey, clock, extra = {}) => { const stats = api.applyPose(f.r, f.model, clock, { styleKey, amp: 1, ...extra }); return { stats, joints: Object.fromEntries(JOINTS.map(j => [j, world(j)])) }; };
// As scripts/test_poses.mjs: the ankles on their targets, the lowest bone vertex against the floor.
const ankleError = side => world('foot' + side).distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));

// 1. Off by default, and only for the two styles.
{
  assert.equal(api.UM_DOIS_PROTO.step, null, 'no candidate asked for by default');
  assert.deepEqual(Object.keys(api.UM_DOIS), ['large', 'court', 'doux']);
  for (const [name, step] of Object.entries(api.UM_DOIS)) assert.ok(step.ecart > 0.1 && step.ecart <= api.HIP_WIDTH, `${name}: the foot steps aside by a hip's width at most (R8), ${step.ecart} m`);
  const before = Object.fromEntries(Object.keys(api.STYLES).map(k => [k, [0.3, 1, 2.6].map(c => pose(k, c).joints)]));
  api.setUmDoisProto('large');
  for (const k of Object.keys(api.STYLES)) {
    assert.equal(!!api.umDoisOf(k), k === 'kizomba' || k === 'semba', `${k}: ${k === 'kizomba' || k === 'semba' ? 'dances' : 'does not dance'} the « 1 2 »`);
    if (api.umDoisOf(k)) continue;
    [0.3, 1, 2.6].forEach((c, i) => { const now = pose(k, c).joints; for (const j of JOINTS) assert.ok(now[j].distanceTo(before[k][i][j]) < 1e-9, `${k}: unchanged by the candidate`); });
  }
  // In pair, in travel or in a figure the two styles keep what they dance today.
  for (const k of ['kizomba', 'semba']) for (const extra of [{ embrace: true, placePaire: true, placement: 'quinconce' }, { travel: 0.5 }, { ida: true, movement: 'ida' }, { plant: false }]) {
    const with_ = pose(k, 1.3, extra).joints; api.setUmDoisProto(null);
    const without = pose(k, 1.3, extra).joints; api.setUmDoisProto('large');
    for (const j of JOINTS) assert.ok(with_[j].distanceTo(without[j]) < 1e-9, `${k} ${JSON.stringify(extra)}: unchanged by the candidate`);
  }
  api.setUmDoisProto('inconnu'); assert.equal(api.UM_DOIS_PROTO.step, null, 'an unknown name asks for nothing');
  console.log('PASS « 1 2 » : éteint par défaut ; avec le paramètre, seuls la kizomba et le semba dansés seuls sur place changent');
}

const report = [];
for (const styleKey of ['kizomba', 'semba']) for (const name of Object.keys(api.UM_DOIS)) {
  api.setUmDoisProto(name);
  const step = api.UM_DOIS[name], tag = `${styleKey} ${name}`, rest = f.model.legs, stance = rest.L.rest.x - rest.R.rest.x;
  const load = clock => pose(styleKey, clock).stats.loadR;
  // 2. Supports (R21, R39): the weight is whole on the left foot on 1 and 2 (clock 0 and 1), on the right one
  // on 3 and 4; four transfers in eight beats.
  for (const c of [0, 1, 4, 5]) assert.ok(load(c) < 1e-6, `${tag}: left foot full on the clock's beat ${c} (${load(c)})`);
  for (const c of [2, 3, 6, 7]) assert.ok(load(c) > 1 - 1e-6, `${tag}: right foot full on the clock's beat ${c} (${load(c)})`);
  let transfers = 0, prev = load(0.02);
  for (let c = 0.07; c <= 8.02; c += 0.05) { const l = load(c); if ((l - 0.5) * (prev - 0.5) < 0) transfers++; prev = l; }
  assert.equal(transfers, 4, `${tag}: one transfer every two beats (${transfers} in 8 beats)`);
  // 3. The feet. Where they are: the pure calendar, and the pose puts the ankles there.
  const N = 4 * STEPS, samples = [];
  for (let i = 0; i < N; i++) {
    const clock = i / STEPS, p = pose(styleKey, clock), feet = { L: api.umDoisFoot('L', clock), R: api.umDoisFoot('R', clock) };
    samples.push({ clock, loadR: p.stats.loadR, feet, ground: minimumBoneY(f.r), ankle: Math.max(ankleError('L'), ankleError('R')), lifted: { L: f.model.lift.L, R: f.model.lift.R }, joints: p.joints, x: { L: rest.L.rest.x + step.ecart * feet.L.place, R: rest.R.rest.x + step.ecart * feet.R.place }, rootY: f.r.root.position.y,
      thigh: { L: p.joints.hipL.distanceTo(p.joints.kneeL), R: p.joints.hipR.distanceTo(p.joints.kneeR) }, shin: { L: p.joints.kneeL.distanceTo(p.joints.footL), R: p.joints.kneeR.distanceTo(p.joints.footR) } });
    for (const j of JOINTS) assert.ok(['x', 'y', 'z'].every(k => Number.isFinite(p.joints[j][k])), `${tag}: finite pose at ${clock}`);
  }
  const at = clock => samples[Math.round(((clock % 4) + 4) % 4 * STEPS) % N];
  // The marka: on 2 the right foot is beside the left one, on its ball, heel up, and carries nothing; on 4, the left.
  for (const [clock, mark, held] of [[1, 'R', 'L'], [3, 'L', 'R']]) {
    const s = at(clock);
    assert.ok(Math.abs(Math.abs(s.x.L - s.x.R) - stance) < 1e-9, `${tag}: on the marka the feet are side by side (${(Math.abs(s.x.L - s.x.R) * 100).toFixed(1)} cm apart)`);
    assert.ok(s.feet[mark].pitch > 0.2 && s.feet[mark].air && !s.feet[held].air && s.feet[held].pitch === 0, `${tag}: the marking foot is on its ball, the other one flat`);
    assert.ok((mark === 'R' ? s.loadR : 1 - s.loadR) < 1e-6, `${tag}: the marking foot carries no weight`);
    assert.ok(s.joints['foot' + mark].y > s.joints['foot' + held].y + 0.02, `${tag}: the marking foot's heel is up (ankle ${((s.joints['foot' + mark].y - s.joints['foot' + held].y) * 100).toFixed(1)} cm higher)`);
  }
  // Step aside: the foot that receives the weight on 1 (left) and on 3 (right) has moved by `ecart`, and is flat
  // on the floor half a beat before; the dancer is back where he started every four beats.
  assert.ok(Math.abs(at(0).x.L - at(3).x.L - step.ecart) < 1e-9 && Math.abs(at(1).x.R - at(2).x.R - step.ecart) < 1e-9, `${tag}: each foot steps aside by ${step.ecart} m`);
  for (const [clock, side] of [[3.5, 'L'], [1.5, 'R']]) assert.ok(!at(clock).feet[side].air && at(clock).feet[side].lift === 0, `${tag}: the stepping foot has landed half a beat before its beat`);
  for (const j of JOINTS) assert.ok(pose(styleKey, 0.7).joints[j].distanceTo(pose(styleKey, 4.7).joints[j]) < 1e-9 && pose(styleKey, 2.2).joints[j].distanceTo(pose(styleKey, 10.2).joints[j]) < 1e-9, `${tag}: the same pose every four beats`);
  let lowest = Infinity, missed = 0, movedLoaded = 0, closest = Infinity, bone = 0;
  samples.forEach((s, i) => {
    const next = samples[(i + 1) % N];
    for (const side of ['L', 'R']) {
      // A foot moves or leaves the floor only when it carries (almost) nothing.
      const share = side === 'R' ? s.loadR : 1 - s.loadR;
      if (Math.abs(next.x[side] - s.x[side]) > 1e-9 || s.feet[side].lift > 0) movedLoaded = Math.max(movedLoaded, share);
      bone = Math.max(bone, Math.abs(s.thigh[side] - f.model.legs[side].length1), Math.abs(s.shin[side] - f.model.legs[side].length2));
    }
    lowest = Math.min(lowest, s.ground); missed = Math.max(missed, s.ankle);
    closest = Math.min(closest, s.x.L - s.x.R);
  });
  assert.ok(movedLoaded < 0.01, `${tag}: a foot moves only when it carries no weight (${movedLoaded.toFixed(3)})`);
  assert.ok(lowest >= -0.0001, `${tag}: no bone below the floor (${(lowest * 1000).toFixed(2)} mm)`);
  assert.ok(missed <= 0.001, `${tag}: every ankle reaches its place (${(missed * 1000).toFixed(2)} mm off at the most)`);
  assert.ok(closest > stance - 1e-9, `${tag}: the feet never come closer than side by side (${(closest * 100).toFixed(1)} cm)`);
  assert.ok(bone < 1e-8, `${tag}: thighs and shins keep their length (${(bone * 1000).toFixed(6)} mm)`);
  // 4. Continuity (R34) at the style's tempo: the pelvis's acceleration, its height (R3), no jump of any joint.
  const dt = 60 / TEMPO[styleKey] / STEPS, pelvis = samples.map(s => s.joints.pelvis);
  const accel = pelvis.map((p, i) => { const a = pelvis[(i + N - 1) % N], b = pelvis[(i + 1) % N]; return Math.hypot(a.x - 2 * p.x + b.x, a.y - 2 * p.y + b.y, a.z - 2 * p.z + b.z) / dt / dt; });
  const peak = Math.max(...accel), heights = pelvis.map(p => p.y), bounce = Math.max(...heights) - Math.min(...heights);
  let jump = 0;
  samples.forEach((s, i) => { for (const j of JOINTS) jump = Math.max(jump, s.joints[j].distanceTo(samples[(i + 1) % N].joints[j])); });
  // The body is carried `ecart` in one beat: half a wave of that size costs (ecart / 2)·(π / beat)², whatever the hip does.
  const carried = step.ecart / 2 * (Math.PI / (60 / TEMPO[styleKey])) ** 2;
  assert.ok(peak < carried + 2.5, `${tag}: the pelvis's acceleration stays near what its travel costs (${peak.toFixed(1)} m/s², travel alone ${carried.toFixed(1)})`);
  assert.ok(bounce < 0.035, `${tag}: the pelvis's height varies by ${(bounce * 100).toFixed(1)} cm (R3)`);
  assert.ok(jump < 0.03, `${tag}: no joint jumps (${(jump * 100).toFixed(1)} cm in 1/${STEPS} beat)`);
  const width = Math.max(...pelvis.map(p => p.x)) - Math.min(...pelvis.map(p => p.x));
  assert.ok(width > step.ecart && width < step.ecart + 0.12, `${tag}: the pelvis travels the step plus its own sway (${(width * 100).toFixed(1)} cm)`);
  report.push(`${tag} : écart ${Math.round(step.ecart * 100)} cm, bassin ${(width * 100).toFixed(1)} cm de côté et ${(bounce * 100).toFixed(1)} cm de haut, ${peak.toFixed(1)} m/s² à ${TEMPO[styleKey]} bpm`);
}
api.setUmDoisProto(null);
console.log(`PASS « 1 2 » : appuis G G D D sur les comptes 1 à 4, marca sans poids sur la plante, pieds au sol, bassin sans à-coup\n  ${report.join('\n  ')}`);
