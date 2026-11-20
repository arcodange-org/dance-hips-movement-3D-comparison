// #54 — ida e volta in pair (docs/spec-ida-paire.md), on the real GLB.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-ida-paire-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'idaPaire', 'gait', 'share']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const near = (a, b, tolerance = 1e-8, label = '') => assert.ok(Math.abs(a - b) <= tolerance, `${label} ${a} != ${b} (tol ${tolerance})`);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.IDA_PAIR_DZ;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const options = (i, extra = {}) => ({ movement: 'ida', ida: true, embrace: true, idaPaire: true, follower: !!i, ...extra });
const stanceOf = m => (m.legs.L.hipX - m.legs.L.rest.x + m.legs.R.rest.x - m.legs.R.hipX) / 2;
const restOf = f => ({ L: f.model.legs.L.rest, R: f.model.legs.R.rest });
const footAxis = (f, side) => { const t = f.model.legs[side].toeOut;
  return new THREE.Vector3(Math.sin(t), 0, Math.cos(t)).applyQuaternion(f.r['foot' + side].getWorldQuaternion(new THREE.Quaternion())); };
const STYLES = Object.keys(api.STYLES);

// 0. Opt-in: without idaPaire the phase 8 model is unchanged (both dancers take the same step).
{
  const [f] = couple();
  const legacy = { movement: 'ida', ida: true, embrace: true };
  api.applyPose(f.r, f.model, 1.1, legacy); const a = snapshot(f.r);
  api.applyPose(f.r, f.model, 1.1, { ...legacy, idaPaire: false, placement: 'quinconce' }); const b = snapshot(f.r);
  a.forEach((v, n) => near(v, b[n], 1e-12, 'phase 8 ida unchanged without idaPaire'));
  console.log('PASS ida e volta : modèle de la phase 8 inchangé sans idaPaire');
}

// 1. Neutral: at beats 0, 4 and 8 feet and roots of both dancers are on the placement's neutral stance.
for (const placement of ['quinconce', 'face', 'reference']) {
  const pair = couple();
  const neutral = api.idaNeutral(restOf(pair[0]), api.placementOffset(placement, 1), stanceOf(pair[0].model));
  for (const beat of [0, 4, 8]) pair.forEach((f, i) => {
    api.applyPose(f.r, f.model, beat, options(i, { placement }));
    for (const side of ['L', 'R']) {
      const p = f.outer.worldToLocal(world(f, 'foot' + side)), t = f.model.targets[side];
      near(p.x, t.x, 1e-6); near(p.z, t.z, 1e-6);
      near(t.x, neutral[side].x, 1e-9, `${placement} ${beat} role${i} ${side}.x`);
      near(t.z, neutral[side].z, 1e-9, `${placement} ${beat} role${i} ${side}.z`);
    }
    const s = api.sampleIdaPaire(beat, !!i, restOf(f), api.placementOffset(placement, 1), stanceOf(f.model));
    near(s.root.x, neutral.root.x, 1e-12); near(s.root.z, neutral.root.z, 1e-12);
  });
}
console.log('PASS neutre : quinconce (ou placement) retrouvé aux temps 0, 4 et 8');

// 2. Sequence: the leader steps forward while the follower steps back with her opposite foot, at the
// same instant and by the same length; the couple moves as a block; the leader's chest leads.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  const o = api.placementOffset('quinconce', 1);
  const N = api.idaNeutral(rest, o);
  let travel = 0;
  for (let tick = 0; tick <= 800; tick++) {
    const b = tick / 100;
    const L = api.sampleIdaPaire(b, false, rest, 'quinconce'), F = api.sampleIdaPaire(b, true, rest, 'quinconce');
    assert.equal(F.moving, L.moving === 'L' ? 'R' : 'L', `follower uses the opposite foot at ${b}`);
    const dl = L.feet[L.moving].z - N[L.moving].z, df = F.feet[F.moving].z - N[F.moving].z;
    assert(dl >= -1e-12 && df <= 1e-12, `leader forward, follower backward at ${b}`);
    // Same step length: at the end of each flight both feet are out (or back) by the same amount.
    const { q, out } = api.idaStepAt(b), S = api.IDA_PAIR.step;
    if (q >= api.IDA_PAIR.flight) { near(dl, out ? S : 0, 1e-12, `leader landed at ${b}`); near(df, out ? -S : 0, 1e-12, `follower landed at ${b}`); }
    // #88: the follower never leaves before the leader. Outgoing step: both feet leave together at
    // IDA_PAIR_SYNC.start, her backward foot clears the lane faster. Return: his backward foot leads and
    // her forward foot waits `delay`.
    // Progress of each moving foot along its step, 0 → 1.
    const back = out ? -df / S : 1 - dl / S, fwd = out ? dl / S : 1 + df / S;
    if (out && q <= api.IDA_PAIR_SYNC.start) { near(fwd, 0, 1e-12, `leader waits at ${b}`); near(back, 0, 1e-12, `follower waits for the leader at ${b}`); }
    if (!out && q <= api.IDA_PAIR.delay) near(fwd, 0, 1e-12, `forward foot waits at ${b}`);
    assert(back >= fwd - 1e-12, `backward foot clears the lane first at ${b}`);
    // Roots in the couple (world) frame: leader -dz + z, follower dz - z: constant gap.
    near((dz - F.root.z) - (-dz + L.root.z), 2 * dz - 2 * o.z, 1e-12, `couple block at ${b}`);
    travel = Math.max(travel, L.root.z - o.z);
    near(L.loadL + L.loadR, 1); near(L.loadR, F.loadL, 1e-12, `mirrored loads at ${b}`);
  }
  // The leader's upper body (chest yaw) plays the follower's mirrored upper curve IDA_LEAD earlier.
  for (let tick = 0; tick < 800; tick++) {
    const b = tick / 100;
    const L = api.sampleIdaPaire(b, false, rest, 'quinconce'), F = api.sampleIdaPaire(b + api.IDA_LEAD, true, rest, 'quinconce');
    near(L.rootYaw + L.chestYaw, -(F.rootYaw + F.chestYaw), 1e-12, `leader chest leads by ${api.IDA_LEAD} at ${b}`);
  }
  near(travel, api.IDA_PAIR.carry * api.IDA_PAIR.step, 1e-3, 'pelvises travel carry·step');
  console.log(`PASS séquence : leader en avant, suiveur en arrière (pied opposé, même pas, le pied qui recule part en premier), couple d'un bloc (${(travel * 100).toFixed(1)} cm), buste du leader en avance de ${api.IDA_LEAD} temps`);
}

// 2c. Ginga (#42, docs/spec-ginga.md): the style's hip pattern is triggered by each transfer. Its phase
// is continuous and non-decreasing, advances one half-cycle per transfer (six per 8-beat cycle) and holds
// on the support between transfers; once a transfer has ended, the style's support is the figure's
// (the coupled follower dances the leader's phase mirrored, i.e. on her own mirrored feet). The leader
// transmits at 70 %, the follower pronounces it fully.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  for (const styleKey of Object.keys(api.STYLES).filter(k => k !== 'kompa')) {
    const support = api.STYLES[styleKey].support;
    for (const follower of [false, true]) {
      let previous = -Infinity;
      for (let b = 0; b <= 16; b += 0.01) {
        const g = api.sampleIdaPaire(b, follower, rest, 'quinconce').gingaBeat;
        assert(g >= previous - 1e-9, `${styleKey}: ginga phase non-decreasing at ${b.toFixed(2)}`);
        previous = g;
      }
      const s0 = api.sampleIdaPaire(0, follower, rest, 'quinconce').gingaBeat, s8 = api.sampleIdaPaire(8, follower, rest, 'quinconce').gingaBeat;
      assert(Math.abs(s8 - s0 - 6) < 1e-9, `${styleKey}: six half-cycles per cycle (${s8 - s0})`);
      for (const t of api.idaTransfers(follower)) {
        const f = api.sampleIdaPaire(t.end + 0.02, follower, rest, 'quinconce');
        const side = Math.sign(support(f.gingaBeat)) * (follower ? -1 : 1);
        assert.equal(side, t.to === 'R' ? 1 : -1, `${styleKey} ${follower ? 'follower' : 'leader'}: style support = figure support after ${t.from}→${t.to}@${t.end}`);
        assert.equal(f.support, t.to);
      }
    }
  }
  const lead = api.sampleIdaPaire(1, false, rest, 'quinconce'), foll = api.sampleIdaPaire(1, true, rest, 'quinconce');
  assert(Math.abs(lead.gingaAmp / foll.gingaAmp - 0.7) < 1e-9, 'leader at 70 % of the follower');
  console.log('PASS ginga : phase déclenchée par chaque transfert (six demi-cycles par cycle, continue), appui du style = appui de la figure, leader à 70 %');
}

// 2b. Support transfers, explicit for the ginga (#42, « transferts de poids […] à chaque alternance ») :
// six per cycle, alternating feet, the same instants for both dancers with mirrored feet; the load
// only changes inside a transfer and ends fully on its target foot.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  for (const follower of [false, true]) {
    const list = api.idaTransfers(follower);
    assert.equal(list.length, 6, 'six transfers per cycle');
    list.forEach((t, k) => {
      assert.notEqual(t.from, t.to);
      const next = list[(k + 1) % list.length];
      assert.equal(next.from, t.to, `transfers alternate (${k})`);
      assert(t.end > t.start && (k === list.length - 1 || next.start >= t.end), `ordered transfers (${k})`);
      const mirror = api.idaTransfers(!follower)[k];
      near(mirror.start, t.start); near(mirror.end, t.end);
      assert.equal(mirror.to, t.to === 'L' ? 'R' : 'L', 'mirrored feet');
    });
    let previous = api.sampleIdaPaire(0, follower, rest, 'quinconce');
    assert.equal(previous.loadR, follower ? 0 : 1, 'cycle starts on the leader R / follower L');
    for (let tick = 1; tick <= 800; tick++) {
      const b = tick / 100, s = api.sampleIdaPaire(b, follower, rest, 'quinconce');
      const t = list.find(x => b > x.start + 1e-9 && b < x.end - 1e-9);
      if (!t) { const inside = list.some(x => b >= x.start - .011 && b <= x.end + .011);
        if (!inside) near(s.loadR, previous.loadR, 1e-12, `load constant outside transfers at ${b}`);
        assert(s.loadR === 0 || s.loadR === 1 || inside, `full support outside transfers at ${b}`); }
      else { assert.equal(s.transfer?.to, t.to); assert(t.to === 'R' ? s.loadR >= previous.loadR - 1e-12 : s.loadR <= previous.loadR + 1e-12, `monotonic transfer at ${b}`); }
      previous = s;
    }
    for (const t of list) {
      const s = api.sampleIdaPaire(t.end + 1e-6, follower, rest, 'quinconce');
      near(t.to === 'R' ? s.loadR : s.loadL, 1, 1e-9, `transfer ends on ${t.to}`);
      // Both feet are down during every transfer.
      for (const side of ['L', 'R']) near(api.sampleIdaPaire((t.start + t.end) / 2, follower, rest, 'quinconce').feet[side].lift, 0, 1e-12);
    }
  }
  console.log('PASS transferts d’appui : six par cycle, alternés D/G, simultanés et en miroir, deux pieds au sol', api.idaTransfers(false).map(t => `${t.from}→${t.to}@${t.start}`).join(' '));
}

// 3. Walk: heel rises before the foot leaves the floor; heel strike forward, ball first backward.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  for (const follower of [false, true]) for (let slot = 0; slot < 4; slot++) {
    let lifted = false, heelBefore = false; const pivots = [];
    for (let k = 1; k < 120; k++) {
      const b = slot * 2 + k / 100, s = api.sampleIdaPaire(b, follower, rest, 'quinconce'), foot = s.feet[s.moving];
      if (!lifted && foot.lift > 1e-6) { lifted = true; heelBefore = pivots.includes('ball'); }
      if (foot.pivot) pivots.push(foot.pivot);
    }
    const out = slot % 2 === 0, forward = follower ? !out : out;
    assert(lifted && heelBefore, `heel rises before the foot leaves (${follower ? 'follower' : 'leader'} slot ${slot})`);
    assert.equal(pivots.at(-1), forward ? 'heel' : 'ball', `landing ${forward ? 'heel strike' : 'ball first'} (${follower ? 'follower' : 'leader'} slot ${slot})`);
  }
  console.log('PASS marche : talon levé avant le décollage, attaque du talon en avant, avant-pied d’abord en arrière');
}

// 4. GLB invariants: floor, IK targets, bone lengths, foot axis, loads, planted foot, continuity, loop.
let poses = 0, minY = Infinity, maxAnkleError = 0;
for (const placement of ['quinconce', 'reference']) for (const styleKey of STYLES) for (const amp of [.5, 1, 2]) {
  const pair = couple();
  for (let tick = 0; tick <= 64; tick++) for (const [i, f] of pair.entries()) {
    const beat = tick / 8;
    const stats = api.applyPose(f.r, f.model, beat, options(i, { styleKey, amp, placement }));
    snapshot(f.r).forEach(v => assert(Number.isFinite(v)));
    const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
    assert(ground >= -.0001, `floor ${placement} ${styleKey} ${amp} ${beat}: ${ground}`);
    near(stats.loadL + stats.loadR, 1);
    const sample = api.sampleIdaPaire(beat, !!i, restOf(f), api.placementOffset(placement, amp), stanceOf(f.model));
    // The engine's supports are the sampler's (both feet down) or all on the standing foot.
    if (sample.feet.L.lift === 0 && sample.feet.R.lift === 0) near(stats.loadR, sample.loadR, 1e-9, `GLB load ${styleKey} ${beat}`);
    for (const side of ['L', 'R']) {
      const hip = world(f, 'hip' + side), knee = world(f, 'knee' + side), foot = world(f, 'foot' + side);
      const error = foot.distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
      maxAnkleError = Math.max(maxAnkleError, error);
      assert(error < .001, `final target ${placement} ${styleKey} ${amp} ${beat} ${side}: ${error}`);
      near(hip.distanceTo(knee), f.model.legs[side].length1);
      near(knee.distanceTo(foot), f.model.legs[side].length2);
      if (f.model.lift[side] > 1e-6) near(stats['load' + side], 0);
      // Feet forward along the knees; #49: they only pitch in the vertical plane of their yaw.
      const forward = footAxis(f, side), yaw = sample.feet[side].yaw + (i ? Math.PI : 0);
      const pitch = sample.feet[side].pitch ?? 0, flat = Math.hypot(forward.x, forward.z);
      near(flat, Math.cos(pitch), 1e-6, `foot pitch ${styleKey} ${beat} ${side}`);
      near(forward.x / flat, Math.sin(yaw), 1e-6, `foot axis x ${styleKey} ${beat} ${side}`);
      near(forward.z / flat, Math.cos(yaw), 1e-6, `foot axis z ${styleKey} ${beat} ${side}`);
    }
    poses++;
  }
}
console.log('PASS ida en paire GLB:', poses, 'poses ; min vertex Y', minY.toFixed(5), '; max ankle error', maxAnkleError.toExponential(2));

for (const follower of [false, true]) {
  const f = couple()[follower ? 1 : 0];
  const config = options(follower ? 1 : 0, { placement: 'quinconce' });
  for (let slot = 0; slot < 4; slot++) {
    const s = api.sampleIdaPaire(slot * 2 + .5, follower, restOf(f), 'quinconce');
    const still = s.moving === 'L' ? 'R' : 'L';
    // The other foot carries the weight or waits: it does not move during the whole slot; the moving
    // foot does not move once landed (end of its flight to the end of the slot).
    for (const [side, from] of [[still, 0], [s.moving, api.IDA_PAIR.flight]]) {
      api.applyPose(f.r, f.model, slot * 2 + from + .001, config); const start = world(f, 'foot' + side);
      for (let t = from + .05; t < 2; t += .05) {
        api.applyPose(f.r, f.model, slot * 2 + t, config);
        near(start.distanceTo(world(f, 'foot' + side)), 0, 1e-9, `${side} planted slot ${slot} t${t.toFixed(2)}`);
      }
    }
  }
  for (const beat of [0, .5, 1.2, 1.45, 2, 3.2, 4, 5.2, 6, 7.2, 7.99, 8]) {
    api.applyPose(f.r, f.model, beat - 1e-7, config); const before = snapshot(f.r);
    api.applyPose(f.r, f.model, beat + 1e-7, config);
    snapshot(f.r).forEach((v, n) => near(v, before[n], .0001, `continuity ${beat}`));
  }
  api.applyPose(f.r, f.model, 0, config); const first = snapshot(f.r);
  api.applyPose(f.r, f.model, 8, config); snapshot(f.r).forEach((v, n) => near(v, first[n], 1e-6, 'loop'));
}
console.log('PASS pied d’appui immobile, continuité et boucle de 8 temps');

// 5. Swept foot hulls of the four feet stay apart (quinconce, face; amplitudes 0.5, 1, 1.5, 2).
for (const placement of ['quinconce', 'face']) for (const amp of [.5, 1, 1.5, 2]) {
  const pair = couple();
  for (let tick = 0; tick < 800; tick += 2) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 100, options(i, { placement, amp }));
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      assert(!footHullsOverlap(polygons[i], polygons[j]), `foot clearance ${placement} amp ${amp} at ${tick / 100}, feet ${i}/${j}`);
  }
}
console.log('PASS enveloppes des quatre pieds disjointes (quinconce, face à face ; amplitudes 0,5 à 2)');

// Leg bones: no crossing between partners nor between one dancer's legs (six styles, three amplitudes,
// quinconce and reference, and the app's default view: quinconce with plexus contact and contraposition).
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
let collisionPoses = 0;
const boneConfigs = [{ placement: 'quinconce' }, { placement: 'reference' }, { placement: 'quinconce', plexus: true, contraposition: 1 }];
for (const config of boneConfigs) for (const styleKey of STYLES) for (const amp of [.5, 1, 2]) {
  const pair = couple(); const placement = config.placement + (config.plexus ? '+plexus' : '');
  for (let beat = 0; beat < 8; beat += .125) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i, { styleKey, amp, ...config })));
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

// Share URL keeps the placement for the pair ida e volta.
const url = new URL(api.buildShareUrl('https://example.test/', { mode: 'pair', ida: true, placement: 'face' }, null, null));
assert.equal(url.searchParams.get('placement'), 'face');
console.log('PASS partage du placement de l’ida e volta en paire');
