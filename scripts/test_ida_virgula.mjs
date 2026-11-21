// #128 — virgula of the leader in the pair ida e volta (docs/spec-ida-paire.md), on the real GLB.
// Owner (21 Nov.): the virgula (« aller vers l'avant avec le pied gauche perpendiculaire ») « peut être un
// effet de style lors du ida e volta ». Compared with the default ida e volta (the same cycle without it).
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap, hullGap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-ida-virgula-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'idaPaire', 'share', 'shareParams']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const near = (a, b, tolerance = 1e-8, label = '') => assert.ok(Math.abs(a - b) <= tolerance, `${label} ${a} != ${b} (tol ${tolerance})`);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.IDA_PAIR_DZ, V = api.IDA_VIRGULA, P = api.IDA_PAIR;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const variant = virgula => ({ side: 'L', back: false, virgula });
const options = (i, virgula, extra = {}) => ({ movement: 'ida', ida: true, embrace: true, idaPaire: true, follower: !!i, idaVariant: variant(virgula), ...extra });
const footAxis = (f, side) => { const t = f.model.legs[side].toeOut;
  return new THREE.Vector3(Math.sin(t), 0, Math.cos(t)).applyQuaternion(f.r['foot' + side].getWorldQuaternion(new THREE.Quaternion())); };
const yawQ = q => { const v = new THREE.Vector3(0, 0, 1).applyQuaternion(q); return Math.atan2(v.x, v.z); };
const worldYaw = (f, name) => yawQ(f.r[name].getWorldQuaternion(new THREE.Quaternion()));
const soleOf = (f, side) => footHull(f.model.legs[side].sole.map(point => point.clone().applyMatrix4(f.r['foot' + side].matrixWorld)));
const STYLES = Object.keys(api.STYLES);

// 1. Sampler: the virgula only changes the leader's first slot (his G forward and its return).
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  for (const placement of ['quinconce', 'face', 'reference']) {
    const N = api.idaNeutral(rest, api.placementOffset(placement, 1));
    for (let tick = 0; tick <= 800; tick++) {
      const b = tick / 100;
      const on = api.sampleIdaPaire(b, false, rest, placement, 0, variant(true)), off = api.sampleIdaPaire(b, false, rest, placement, 0, variant(false));
      // The follower's step does not change at all.
      assert.deepEqual(api.sampleIdaPaire(b, true, rest, placement, 0, variant(true)), api.sampleIdaPaire(b, true, rest, placement, 0, variant(false)), `follower unchanged at ${b}`);
      // Outside the first slot the leader is the default ida e volta.
      if (b >= 2) { assert.deepEqual(on, off, `leader unchanged at ${b}`); continue; }
      // Same step along the line (R22: as long as the follower's), same timing, same weight (R24, R21).
      near(on.feet.L.z, off.feet.L.z, 1e-12, `same depth at ${b}`);
      near(on.feet.L.lift, off.feet.L.lift, 1e-12); near(on.loadR, off.loadR, 1e-12);
      assert.deepEqual(on.feet.R, off.feet.R, `leader's D unchanged at ${b}`);
      // The chest keeps its direction while the pelvis opens (contraposition): chestYaw is relative to the pelvis.
      near(on.rootYaw + on.chestYaw, off.rootYaw + off.chestYaw, 1e-12, `chest direction at ${b}`);
      assert(on.feet.L.yaw >= -1e-12 && on.feet.L.yaw <= V.yaw + 1e-12 && on.rootYaw >= off.rootYaw - 1e-12, `turn towards his left at ${b}`);
      // Out (between the flight out and the return): right angle, ankle `beside` his D's, pelvis open.
      if (b >= P.out[1] && b <= P.ret[0]) {
        near(on.feet.L.yaw, Math.PI / 2, 1e-12, `right angle at ${b}`);
        near(on.feet.L.x, N.R.x + V.beside, 1e-12, `next to his D at ${b}`);
        near(on.rootYaw - off.rootYaw, V.pelvis, 1e-12, `pelvis opening at ${b}`);
      }
    }
    // Home at the end of the slot: neutral, foot forward.
    for (const b of [0, 1.85, 2]) { const s = api.sampleIdaPaire(b, false, rest, placement, 0, variant(true));
      near(s.feet.L.yaw, 0, 1e-12); near(s.feet.L.x, N.L.x, 1e-12); near(s.feet.L.z, N.L.z, 1e-12); }
  }
  // #89: the game variants are the same cycle started later; the virgula stays on the G forward slot.
  for (const [v, shift] of [[{ side: 'R', back: false }, 4], [{ side: 'L', back: true }, 2], [{ side: 'R', back: true }, 6]])
    for (const b of [0, .5, 1, 1.5, 2.5, 3, 4.6, 5, 6.9, 7]) {
      const shifted = api.sampleIdaPaire(b, false, rest, 'quinconce', 0, { ...v, virgula: true }), base = api.sampleIdaPaire(b + shift, false, rest, 'quinconce', 0, variant(true));
      assert.deepEqual(shifted.feet, base.feet, `variant ${v.side}${v.back ? ' back' : ''} at ${b}`);
    }
  console.log('PASS virgula de l’ida (échantillonneur) : suiveur inchangé, leader inchangé hors du premier créneau, même pas, pied à 90° près du D, buste inchangé');
}

// 2. GLB: right angle, heel next to his D, pelvis and knees, chest and follower unchanged, planted foot,
// continuity and loop.
for (const config of [{ placement: 'quinconce' }, { placement: 'quinconce', plexus: true, contraposition: 1 }, { placement: 'reference' }, { placement: 'face', plexus: true, contraposition: 1 }]) {
  const pair = couple(), label = config.placement + (config.plexus ? ', plexus' : '');
  const pose = (beat, virgula) => pair.map((f, i) => { api.applyPose(f.r, f.model, beat, options(i, virgula, config));
    return { snapshot: snapshot(f.r), chest: worldYaw(f, 'chest'), pelvis: worldYaw(f, 'root'), foot: (() => { const a = footAxis(f, 'L'); return Math.atan2(a.x, a.z); })(),
      kneeL: worldYaw(f, 'kneeL'), kneeR: worldYaw(f, 'kneeR'), L: world(f, 'footL') }; });
  const on = pose(1, true), off = pose(1, false);
  near(on[0].foot, Math.PI / 2, 1e-6, `${label}: G at a right angle`);
  pose(1, true);
  const heelGap = hullGap(soleOf(pair[0], 'L'), soleOf(pair[0], 'R'));
  assert(heelGap > 0 && heelGap < .05, `${label}: heel next to his D (${heelGap})`);
  const opening = on[0].pelvis - off[0].pelvis;
  near(opening, V.pelvis, 1e-6, `${label}: pelvis opening`);
  assert(on[0].kneeL > on[0].pelvis + .2 && on[0].kneeL < on[0].foot - .2, `${label}: G knee between pelvis and foot (${on[0].kneeL})`);
  near(on[0].kneeR, off[0].kneeR, .02, `${label}: D knee as before`);
  let chestDrift = 0;
  for (let tick = 0; tick <= 400; tick++) {
    const beat = tick / 50, a = pose(beat, true), b = pose(beat, false);
    a[1].snapshot.forEach((value, i) => near(value, b[1].snapshot[i], 1e-9, `${label}: follower unchanged at ${beat}`));
    if (beat >= 2) a[0].snapshot.forEach((value, i) => near(value, b[0].snapshot[i], 1e-9, `${label}: leader unchanged at ${beat}`));
    chestDrift = Math.max(chestDrift, Math.abs(a[0].chest - b[0].chest));
  }
  assert(chestDrift < 1 * Math.PI / 180, `${label}: leader's chest keeps its direction (${chestDrift})`);
  // The foot does not move while it is out, turned; the pose is continuous and loops.
  const f = pair[0], opts = options(0, true, config);
  api.applyPose(f.r, f.model, P.out[1] + .001, opts); const planted = world(f, 'footL');
  for (let t = P.out[1] + .05; t < P.ret[0]; t += .05) { api.applyPose(f.r, f.model, t, opts); near(planted.distanceTo(world(f, 'footL')), 0, 1e-9, `${label}: G planted at ${t}`); }
  for (const beat of [.1, .35, .5, .8, 1, 1.2, 1.5, 1.85, 2]) {
    api.applyPose(f.r, f.model, beat - 1e-7, opts); const before = snapshot(f.r);
    api.applyPose(f.r, f.model, beat + 1e-7, opts);
    snapshot(f.r).forEach((value, i) => near(value, before[i], .0001, `${label}: continuity ${beat}`));
  }
  api.applyPose(f.r, f.model, 0, opts); const first = snapshot(f.r);
  api.applyPose(f.r, f.model, 8, opts); snapshot(f.r).forEach((value, i) => near(value, first[i], 1e-6, 'loop'));
  console.log(`PASS virgula de l’ida (${label}) : G à 90°, talon à ${(heelGap * 100).toFixed(1)} cm du D, bassin ouvert de ${(opening * 180 / Math.PI).toFixed(1)}°, genou G à ${(on[0].kneeL * 180 / Math.PI).toFixed(1)}°, buste à ${(chestDrift * 180 / Math.PI).toFixed(2)}° près, suiveur inchangé`);
}

// 3. Swept foot hulls of the four feet stay apart over the virgula's slot.
for (const placement of ['quinconce', 'face']) for (const amp of [.5, 1, 1.5, 2]) {
  const pair = couple();
  for (let tick = 0; tick <= 200; tick += 2) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, tick / 100, options(i, true, { placement, amp })));
    const polygons = pair.flatMap(f => ['L', 'R'].map(side => soleOf(f, side)));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      assert(!footHullsOverlap(polygons[i], polygons[j]), `foot clearance ${placement} amp ${amp} at ${tick / 100}, feet ${i}/${j}`);
  }
}
console.log('PASS virgula de l’ida : enveloppes des quatre pieds disjointes (quinconce, face à face ; amplitudes 0,5 à 2)');

// 4. Leg bones: no crossing between partners nor between one dancer's legs over the virgula's slot.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
let collisionPoses = 0;
for (const config of [{ placement: 'quinconce' }, { placement: 'reference' }, { placement: 'quinconce', plexus: true, contraposition: 1 }]) for (const styleKey of STYLES) for (const amp of [.5, 1, 2]) {
  const pair = couple(); const placement = config.placement + (config.plexus ? '+plexus' : '');
  for (let beat = 0; beat <= 2; beat += .0625) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i, true, { styleKey, amp, ...config })));
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
console.log('PASS virgula de l’ida :', collisionPoses, 'poses de couple, aucun croisement des os des jambes');

// 5. Share URL: `virgula=1` is written and read back.
{
  const url = new URL(api.buildShareUrl('https://example.test/', { mode: 'pair', ida: true, virgula: true }, null, null));
  assert.equal(url.searchParams.get('virgula'), '1');
  assert.equal(api.parseShareParams(url.searchParams, { mode: 'solo', movement: 'none' }).virgula, true);
  assert.equal(api.parseShareParams(new URLSearchParams('mode=pair&ida=1'), { mode: 'solo', movement: 'none' }).virgula, undefined);
  assert.equal(api.parseShareParams(new URLSearchParams('mode=pair&ida=1&virgula=0'), { mode: 'solo', movement: 'none' }).virgula, false);
  console.log('PASS virgula de l’ida : partage par URL (virgula=1)');
}
