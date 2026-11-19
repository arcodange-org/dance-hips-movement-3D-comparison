import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-sortie-fille-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'clock', 'rigJoints', 'sortieGarcon', 'sortieFille', 'sortieGarconContact', 'share']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b} (tol ${tolerance})`);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const couple = () => {
  const dz = api.SORTIE_FILLE_PAIR_DZ;
  return [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
};
const options = { movement: 'sortieF', embrace: true };

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
  assert(first[0].L.z > start[0].L.z + .1, 'leader G advances');
  assert(first[1].R.z > start[1].R.z + .1, 'follower D retreats');
  assert(first[1].L.x - second[1].L.x >= api.HIP_WIDTH - 1e-8, 'G opens at least one hip width');

  if (variant === 'hook') {
    near(second[1].L.z, first[1].L.z);
    const early = at(1.15)[0].R, corner = at(1.34)[0].R, late = at(1.5)[0].R;
    assert(early.x < first[0].R.x - .03, 'initial flight moves right');
    near(early.z, first[0].R.z);
    near(corner.x, first[0].R.x - api.HIP_WIDTH / 2);
    near(corner.z, first[0].R.z);
    near(late.x, corner.x);
    assert(late.z > corner.z + .03, 'longitudinal flight comes after the lateral flight');
    near(second[0].R.z, second[0].L.z);
    near(second[0].R.x, first[0].R.x - api.HIP_WIDTH / 2);
  } else {
    assert(second[1].L.z < first[1].L.z - .10, 'follower G advances diagonally in the alternate');
    near(second[0].R.x, first[0].R.x);
    assert(second[0].R.z < first[0].R.z - .05, 'alternate D leader retreats');
  }
  assert(third[0].L.z < second[0].L.z - .2, 'leader G retreats on action 3');
  assert(third[1].R.z < second[1].R.z - .2, 'follower D advances on action 3');
  assert(third[1].R.x < third[0].R.x - .12, 'follower D lies right of leader D in leader coordinates');
  near(third[1].R.z, third[0].R.z);
  at(3);
  const finalRightToe = pair[1].r.footR.getWorldQuaternion(new THREE.Quaternion());
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(finalRightToe);
  near(forward.x, 0);
  near(forward.z, -1);
  const diagonal = third[1].R.clone().sub(second[1].R);
  assert(diagonal.x < -.12 && diagonal.z < -.20, 'D follows a forward diagonal in follower coordinates');
  let previous = 0;
  for (let tick = 1; tick <= 20; tick++) {
    const current = at(2 + tick / 20)[1].R.clone().sub(second[1].R);
    near(current.x * diagonal.z - current.z * diagonal.x, 0);
    const progress = current.x / diagonal.x;
    assert(progress >= previous - 1e-8 && progress <= 1 + 1e-8, 'direct diagonal is monotonic');
    previous = progress;
  }
  assert(fourth[0].R.z < third[0].R.z - .07, 'leader D retreats on action 4');
  assert(at(3.23)[0].R.z < third[0].R.z - .04, 'leader D yields before follower starts crossing');
  near(at(3.23)[1].L.distanceTo(third[1].L), 0);
  assert(third[1].L.x < third[1].R.x && fourth[1].L.x > fourth[1].R.x, 'follower G crosses D');
  assert(fourth[1].L.z < third[1].L.z - .18, 'follower G advances on the crossing');
  assert(fourth[1].L.z < fourth[1].R.z - .18, 'follower G crosses in front of planted D');
  assert(Math.abs(fourth[1].L.x - start[1].L.x) < .06, 'cross returns to initial lane');
  assert(Math.abs(fifth[0].root.x - fifth[1].root.x) <= .06, 'couple returns to line');
  for (let role = 0; role < pair.length; role++) {
    for (const [beat, stop] of stops.entries()) near(stop[role].stats.loadR, rightLoads[role][beat]);
    const stance = moving[role][4] === 'R' ? 'L' : 'R';
    const free = moving[role][4];
    const rig = pair[role];
    near(fifth[role][stance].distanceTo(fourth[role][stance]), 0);
    near(fifth[role][free].z - fifth[role][stance].z, (rig.model.legs[free].rest.z - rig.model.legs[stance].rest.z) * (role ? -1 : 1));
    near(fifth[role][free].x - fifth[role][stance].x, (rig.model.legs[free].rest.x - rig.model.legs[stance].rest.x) * (role ? -1 : 1));
  }

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

for (const sortieFilleVariant of variants) {
  const pair = couple();
  for (let tick = 0; tick <= 500; tick++) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 100, { ...options, follower: !!i, sortieFilleVariant });
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      assert(!footHullsOverlap(polygons[i], polygons[j]), `foot clearance at ${tick / 100} (${sortieFilleVariant}), feet ${i}/${j}`);
  }
  pair.forEach((f, i) => api.applyPose(f.r, f.model, 3, { ...options, follower: !!i, sortieFilleVariant }));
  const proximity = api.thighProximity(world(pair[0], 'hipR'), world(pair[0], 'kneeR'), world(pair[1], 'hipR'), world(pair[1], 'kneeR'));
  assert(proximity.direction.x < -.95, `rightward thigh proximity: ${proximity.direction.x}`);
  assert(proximity.gap >= 0 && proximity.gap < .03, `illustrative thigh gap ${proximity.gap}`);
  console.log(sortieFilleVariant, `illustrative D/D gap ${(proximity.gap * 1000).toFixed(1)} mm, rightward component ${proximity.direction.x.toFixed(2)}`);
}
console.log('PASS sortie fille: swept foot hulls and rightward D/D thigh proximity');

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
