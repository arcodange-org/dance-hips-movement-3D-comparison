import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-sortie-fille-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'clock', 'rigJoints', 'gait', 'sortieGarcon', 'sortieFille', 'placement', 'sortieGarconContact', 'share']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b} (tol ${tolerance})`);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
// Functional foot axis (heel → ball), not the ankle pivot's +z: the GLB foot is natively turned out.
const footAxis = (f, side) => { const t = f.model.legs[side].toeOut;
  return new THREE.Vector3(Math.sin(t), 0, Math.cos(t)).applyQuaternion(f.r['foot' + side].getWorldQuaternion(new THREE.Quaternion())); };
const couple = () => {
  const dz = api.SORTIE_FILLE_PAIR_DZ;
  return [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
};
// TEST_PLACEMENT=reference|quinconce|face replays the whole runner for one couple placement.
const placement = process.env.TEST_PLACEMENT ?? 'reference';
// TEST_PLEXUS=1 replays the runner with the plexus contact the app enables with a placement (#51).
const options = { movement: 'sortieF', embrace: true, placement, plexus: process.env.TEST_PLEXUS === '1' };
// Owner request (19 Nov.): the middle/upper right thighs touch at the D/D arrival. Contact of the
// illustrative 8.5 cm envelopes: gap in [-6, +3] mm, closest points on the middle/upper part
// of both femurs (s ≤ 0.70 along hip → knee).
const thighContact = (proximity, hipA, kneeA, hipB, kneeB, label) => {
  const sA = proximity.centerA.distanceTo(hipA) / hipA.distanceTo(kneeA), sB = proximity.centerB.distanceTo(hipB) / hipB.distanceTo(kneeB);
  assert(proximity.gap >= -.006 && proximity.gap <= .003, `${label}: thighs touch (gap ${proximity.gap})`);
  assert(sA <= .7 && sB <= .7, `${label}: contact on the middle/upper thighs (s=${sA.toFixed(2)}/${sB.toFixed(2)})`);
  return { sA, sB };
};

const o = api.placementOffset(placement);
// Neutral stance at the start: feet under the hips (owner request), absorbed on each first step.
const stanceOf = m => (m.legs.L.hipX - m.legs.L.rest.x + m.legs.R.rest.x - m.legs.R.hipX) / 2;

const variants = ['hook', 'back'];
const moving = [['L', 'R', 'L', 'R', 'L'], ['R', 'L', 'R', 'L', 'R']];
const rightLoads = [[1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 0, 0]];
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
const legNames = [...boneNames, 'AnklePivot_L', 'AnklePivot_R'];
const config = (role, sortieFilleVariant) => ({ ...options, follower: role === 1, sortieFilleVariant });

for (const variant of variants) {
  const pair = couple();
  const at = beat => pair.map((f, role) => {
    const stats = api.applyPose(f.r, f.model, beat, config(role, variant));
    return { L: world(f, 'footL'), R: world(f, 'footR'), root: world(f, 'root'), stats };
  });
  const stops = Array.from({ length: 6 }, (_, beat) => at(beat));
  const [start, first, second, third, fourth, fifth] = stops;
  // The leader's landings are validated: his first steps absorb the placement shift.
  assert(first[0].L.z > start[0].L.z + .1 - o.z, 'leader G advances');
  assert(first[1].R.z > start[1].R.z + .1, 'follower D retreats');
  // One hip width from the validated stance; the neutral start is already `stance` wider.
  assert(first[1].L.x - second[1].L.x >= api.HIP_WIDTH - stanceOf(pair[1].model) - 1e-8, 'G opens at least one hip width');

  if (variant === 'hook') {
    near(second[1].L.z, first[1].L.z);
    // Same flight fractions as the validated hook, shifted by the close-start lead.
    const lead = api.sortieFilleHookLead(o), when = f => 1 + lead + f * (.68 - lead);
    // #49: the foot travels during the swing of its (reduced) walking roll: the corner of the hook is
    // reached half-way through that swing.
    const roll = api.SORTIE_FILLE_FIRST_ROLL, push = api.GAIT.push * roll, land = 1 - (1 - api.GAIT.land) * roll;
    const early = at(when(.15 / .68))[0].R, corner = at(when(push + .5 * (land - push)))[0].R, late = at(when(.5 / .68 * 1))[0].R;
    assert(early.x < first[0].R.x - .03, 'initial flight moves right');
    near(early.z, first[0].R.z);
    // The leader's D starts shifted by o (world +x = his left) and widened to the hips (−x),
    // and lands on the validated hook.
    const stance = stanceOf(pair[0].model);
    near(corner.x, first[0].R.x - api.HIP_WIDTH / 2 - o.x + stance);
    near(corner.z, first[0].R.z);
    near(late.x, corner.x);
    // From a closer start (quinconce) the hook's longitudinal part is shorter, never reversed.
    assert(late.z > corner.z + Math.min(.03, (second[0].R.z - corner.z) / 3), 'longitudinal flight comes after the lateral flight');
    near(second[0].R.z, second[0].L.z);
    near(second[0].R.x, first[0].R.x - api.HIP_WIDTH / 2 - o.x + stance);
  } else {
    assert(second[1].L.z < first[1].L.z - .10, 'follower G advances diagonally in the alternate');
    near(second[0].R.x, first[0].R.x - o.x + stanceOf(pair[0].model));
    assert(second[0].R.z < first[0].R.z - .05, 'alternate D leader retreats');
  }
  assert(third[0].L.z < second[0].L.z - .2, 'leader G retreats on action 3');
  assert(third[1].R.z < second[1].R.z - .2, 'follower D advances on action 3');
  assert(third[1].R.x < third[0].R.x - .12, 'follower D lies right of leader D in leader coordinates');
  near(third[1].R.z, third[0].R.z);
  at(3);
  // Neutral feet (owner request): the heel → ball axis of the final right foot points forward.
  const forward = footAxis(pair[1], 'R');
  near(forward.x, 0);
  near(forward.z, -1);
  const diagonal = third[1].R.clone().sub(second[1].R);
  assert(diagonal.x < -.12 && diagonal.z < -.20, 'D follows a forward diagonal in follower coordinates');
  let previous = 0;
  for (let tick = 1; tick <= 20; tick++) {
    const current = at(2 + tick / 20)[1].R.clone().sub(second[1].R);
    // #49: the ankle leaves the line only while the foot pivots on its ball or heel (≤ 2 cm).
    near((current.x * diagonal.z - current.z * diagonal.x) / Math.hypot(diagonal.x, diagonal.z), 0, .02);
    const progress = current.x / diagonal.x;
    // #49: the heel strike (toes up about the heel) may draw the ankle back a few millimetres.
    assert(progress >= previous - .03 && progress <= 1 + .03, `direct diagonal is monotonic (${previous} → ${progress})`);
    previous = progress;
  }
  assert(fourth[0].R.z < third[0].R.z - .07, 'leader D retreats on action 4');
  assert(at(3.23)[0].R.z < third[0].R.z - .04, 'leader D yields before follower starts crossing');
  near(at(3.23)[1].L.distanceTo(third[1].L), 0);
  assert(third[1].L.x < third[1].R.x && fourth[1].L.x > fourth[1].R.x, 'follower G crosses D');
  assert(fourth[1].L.z < third[1].L.z - .18, 'follower G advances on the crossing');
  assert(fourth[1].L.z < fourth[1].R.z - .18, 'follower G crosses in front of planted D');
  // #48: the couple ends translated together (the leader's historical 6.5 cm to his left included).
  const shiftX = fifth[0].L.x - start[0].L.x;
  assert(Math.abs(fourth[1].L.x - start[1].L.x - shiftX) < .01, 'cross returns to the initial lane, translated with the couple');
  // #48: pelvises as at the start (2o apart sideways in quinconce, aligned in the reference placement).
  near(fifth[0].root.x - fifth[1].root.x, start[0].root.x - start[1].root.x, 1e-6);
  for (let role = 0; role < pair.length; role++) {
    for (const [beat, stop] of stops.entries()) near(stop[role].stats.loadR, rightLoads[role][beat]);
    const stance = moving[role][4] === 'R' ? 'L' : 'R';
    const free = moving[role][4];
    const rig = pair[role];
    near(fifth[role][stance].distanceTo(fourth[role][stance]), 0);
    // #48: neutral end, the start translated: quinconce, feet under the hips and stagger retrieved.
    for (const side of ['L', 'R']) for (const axis of ['x', 'z'])
      near(fifth[role][side][axis] - start[role][side][axis], fifth[0].L[axis] - start[0].L[axis], 1e-6);
  }

  // With the plexus contact (#51) the chests face each other (contraposition) instead of
  // playing the figure's frame cue: the cue is checked without it.
  if (!options.plexus) {
    // Observe the model's world thorax with style motion muted to isolate the frame cue.
    const cueAt = beat => pair.map((f, role) => {
      api.applyPose(f.r, f.model, beat, { ...config(role, variant), amp: 0 });
      return f.r.chest.getWorldQuaternion(new THREE.Quaternion());
    });
    const before = cueAt(0), leaderCue = cueAt(.68), response = cueAt(.94);
    assert(before[0].angleTo(leaderCue[0]) > .03, 'visible leader chest starts opening before exit');
    near(before[1].angleTo(leaderCue[1]), 0, 1e-7);
    assert(before[1].angleTo(response[1]) > .03, 'visible follower chest responds before lateral foot flight');
    near(at(.94)[1].L.distanceTo(start[1].L), 0);

    // Verify that the cue remains distinguishable from the Zouk style's own yaw
    // at the highest UI amplitude, with the pelvic rotation inherited by the chest.
    const zoukWorldCue = beat => pair.map((f, role) => {
      api.applyPose(f.r, f.model, beat, { ...config(role, variant), styleKey: 'zouk', amp: 2, iso: false });
      const localForward = new THREE.Vector3(0, 0, 1).applyQuaternion(f.r.chest.getWorldQuaternion(new THREE.Quaternion()))
        .applyQuaternion(f.outer.quaternion.clone().invert());
      return Math.atan2(localForward.x, localForward.z);
    });
    const cueDirections = zoukWorldCue(.68), responseDirections = zoukWorldCue(.94);
    assert(cueDirections[0] < cueDirections[1] - .03, 'leader cue changes visible Zouk yaw');
    assert(responseDirections[0] < responseDirections[1] - .08, 'Zouk roles remain oriented distinctly at the anticipatory cue');
  }

  for (const [role, f] of pair.entries()) {
    const poseAt = b => api.applyPose(f.r, f.model, b, config(role, variant));
    for (const [action, swing] of moving[role].entries()) {
      const planted = swing === 'R' ? 'L' : 'R';
      poseAt(action);
      const start = world(f, 'foot' + planted);
      for (let tick = 1; tick <= 20; tick++) {
        poseAt(action + tick / 20);
        near(world(f, 'foot' + planted).distanceTo(start), 0);
      }
    }
    for (const beat of [0, .47, .68, .72, 1, 1.34, 1.68, 2, 2.34, 2.68, 3, 3.24, 3.46, 3.48, 3.68, 4, 4.34, 4.68, 5]) {
      poseAt(beat - 1e-7); const before = snapshot(f.r);
      poseAt(beat + 1e-7);
      snapshot(f.r).forEach((v, i) => near(v, before[i], .0001));
    }
    poseAt(5); const end = snapshot(f.r);
    for (const beat of [23, 1.33, 5]) {
      poseAt(beat);
      if (beat >= 5) snapshot(f.r).forEach((v, i) => near(v, end[i]));
    }
  }
}
console.log('PASS sortie fille: anatomical directions, two-stage hook, alternative, frame cue, crossing, supports and final pose');

let poses = 0, minY = Infinity, maxAnkleError = 0;
for (const styleKey of Object.keys(api.STYLES)) for (const amp of [.5, 1, 2]) for (const variant of variants) {
  for (const [role, f] of couple().entries()) for (let tick = 0; tick <= 100; tick++) {
    const beat = tick / 20;
    const stats = api.applyPose(f.r, f.model, beat, { ...config(role, variant), styleKey, amp, plant: false, travel: 1, dir: -1, iso: false });
    assert(snapshot(f.r).every(Number.isFinite));
    const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
    assert(ground >= -.0001, `floor ${styleKey} ${amp} ${variant} ${beat}: ${ground}`);
    near(stats.loadL + stats.loadR, 1);
    for (const side of ['L', 'R']) {
      const hip = world(f, 'hip' + side), knee = world(f, 'knee' + side), foot = world(f, 'foot' + side);
      const error = foot.distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
      maxAnkleError = Math.max(maxAnkleError, error);
      assert(error < .001, `final target ${styleKey} ${variant} ${beat} ${side}`);
      near(hip.distanceTo(knee), f.model.legs[side].length1);
      near(knee.distanceTo(foot), f.model.legs[side].length2);
      const soleY = Math.min(...f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld).y));
      near(soleY, f.model.lift[side]);
      if (soleY > .0001) near(stats['load' + side], 0);
    }
    if (beat >= 4) near(stats.loadR, rightLoads[role][5]);
    poses++;
  }
}
console.log('PASS sortie fille GLB:', poses, 'poses; min vertex Y', minY, '; max ankle error', maxAnkleError);

for (const variant of variants) {
  const url = new URL(api.buildShareUrl('https://example.test/', {
    mode: 'pair', sortieF: true, sortieFilleVariant: variant, sortieBeat: 4, playing: false,
  }, null, null));
  assert.equal(api.sortieFilleVariantOf(url.searchParams.get('sortieFilleVariant')), variant);
  assert.equal(api.sortieFilleBeat(Number(url.searchParams.get('sortieBeat'))), 4);
  assert.equal(url.searchParams.get('playing'), '0');
}
assert.equal(api.sortieFilleBeat(Infinity), 0);
assert.equal(api.sortieFilleBeat(-1), 0);
assert.equal(api.sortieFilleBeat(9), 5);
assert.equal(api.sortieFilleVariantOf(null), 'hook');
assert.equal(api.sortieFilleVariantOf('unexpected'), 'hook');
assert.equal(api.cycleBeats({ movement: 'sortieF' }), 5);
assert.equal(api.cycleBeats({ movement: 'sortieGF' }), 16);
const solo = fixture(api);
for (const beat of [0, 1.34, 2.5, 4.68, 7]) {
  const base = api.applyPose(solo.r, solo.model, beat, { movement: 'none' });
  const baseMatrix = snapshot(solo.r);
  const stats = api.applyPose(solo.r, solo.model, beat, { movement: 'sortieF', sortieFilleVariant: 'back' });
  assert.deepEqual(snapshot(solo.r), baseMatrix, 'sortie fille leaves the solo pose alone');
  assert.deepEqual(stats, base);
}

// Amplitudes above 1 fade the thigh contact back to the looser arrival: the feet are checked there too.
for (const sortieFilleVariant of variants) for (const amp of [1, 1.5, 2]) {
  const pair = couple();
  for (let tick = 0; tick <= 500; tick++) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 100, { ...options, follower: !!i, sortieFilleVariant, amp });
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      assert(!footHullsOverlap(polygons[i], polygons[j]), `foot clearance at ${tick / 100} (${sortieFilleVariant}, amp ${amp}), feet ${i}/${j}`);
  }
  if (amp !== 1) continue;
  pair.forEach((f, i) => api.applyPose(f.r, f.model, 3, { ...options, follower: !!i, sortieFilleVariant }));
  const proximity = api.thighProximity(world(pair[0], 'hipR'), world(pair[0], 'kneeR'), world(pair[1], 'hipR'), world(pair[1], 'kneeR'));
  assert(proximity.direction.x < -.95, `rightward thigh proximity: ${proximity.direction.x}`);
  const { sA, sB } = thighContact(proximity, world(pair[0], 'hipR'), world(pair[0], 'kneeR'), world(pair[1], 'hipR'), world(pair[1], 'kneeR'), `sortieF ${sortieFilleVariant}`);
  console.log(sortieFilleVariant, `D/D thigh contact ${(proximity.gap * 1000).toFixed(1)} mm at s=${sA.toFixed(2)}/${sB.toFixed(2)}, rightward component ${proximity.direction.x.toFixed(2)}`);
}
console.log('PASS sortie fille: swept foot hulls and D/D contact of the upper thighs');

// Real transformed triangles, not GLB cached bounding boxes or knee-marker distances.
// Include mid-flight poses, direction changes and landings specific to the two variants.
const collisionBeats = [...new Set([...Array.from({ length: 51 }, (_, i) => i / 10),
  .26, 1.34, 1.68, 2.34, 2.42, 2.46, 2.53, 2.68, 2.83, 3.07, 3.24,
  3.46, 3.48, 3.68, 3.85, 3.95, 4.16, 4.25, 4.34, 4.42, 4.68, 4.87])].sort((a, b) => a - b);
let collisionPoses = 0;
for (const styleKey of Object.keys(api.STYLES)) for (const amp of [.5, 1, 2]) for (const sortieFilleVariant of variants) {
  const pair = couple();
  for (const beat of collisionBeats) {
    pair.forEach((f, role) => {
      const pose = { ...config(role, sortieFilleVariant), styleKey, amp };
      api.applyPose(f.r, f.model, beat, { ...pose, iso: false });
      const lowerBody = legNames.map(name => f.r[name].matrixWorld.clone());
      api.applyPose(f.r, f.model, beat, pose);
      for (const [i, name] of legNames.entries()) {
        lowerBody[i].elements.forEach((value, index) => near(value, f.r[name].matrixWorld.elements[index]));
      }
    });
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames) {
      const collision = meshIntersection(meshes[0][a], meshes[1][b]);
      assert(!collision, JSON.stringify({ styleKey, amp, sortieFilleVariant, beat, leader: a, partner: b, collision }));
    }
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R'))) {
        const collision = meshIntersection(own[a], own[b]);
        assert(!collision, JSON.stringify({ styleKey, amp, sortieFilleVariant, beat, role, left: a, right: b, collision }));
      }
    collisionPoses++;
  }
}
console.log('PASS sortie fille:', collisionPoses, 'couple poses: no inter/intra-dancer leg-bone triangle crossing or containment');
