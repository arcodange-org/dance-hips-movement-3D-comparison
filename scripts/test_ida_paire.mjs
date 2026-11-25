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

// 2. Sequence (#107, owner: « avant gauche + retour neutre en 2 temps, derrière gauche + retour, avant
// droit + retour, derrière droit + retour. Le tout en 8 temps »): in each 2-beat slot the leader's foot
// goes out (forward, then back in the next slot) and returns to neutral; the follower takes the symmetric
// step (opposite foot, opposite direction, same length). #88: her foot never leaves before his; the foot
// stepping back clears the lane first. The couple moves as a block; the leader's chest leads.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  const o = api.placementOffset('quinconce', 1);
  const N = api.idaNeutral(rest, o);
  const S = api.IDA_PAIR.step;
  assert.deepEqual([0, 2, 4, 6].map(b => { const s = api.idaStepAt(b + .5); return `${s.side}${s.dir > 0 ? '+' : '-'}`; }), ['L+', 'L-', 'R+', 'R-']);
  let travel = 0;
  const left = { leader: {}, follower: {} };
  for (let tick = 0; tick <= 800; tick++) {
    const b = tick / 100;
    const L = api.sampleIdaPaire(b, false, rest, 'quinconce'), F = api.sampleIdaPaire(b, true, rest, 'quinconce');
    assert.equal(F.moving, L.moving === 'L' ? 'R' : 'L', `follower uses the opposite foot at ${b}`);
    const { q, dir, index } = api.idaStepAt(b);
    const dl = L.feet[L.moving].z - N[L.moving].z, df = F.feet[F.moving].z - N[F.moving].z;
    assert(dl * dir >= -1e-12 && df * dir <= 1e-12, `leader ${dir > 0 ? 'forward' : 'back'}, follower the other way at ${b}`);
    // Same length: out at the end of the outgoing flight, home at the end of the return.
    if (q >= api.IDA_PAIR.out[1] && q <= api.IDA_PAIR.ret[0]) { near(dl, dir * S, 1e-12, `leader out at ${b}`); near(df, -dir * S, 1e-12, `follower out at ${b}`); }
    if (q >= api.IDA_PAIR.ret[1]) { near(dl, 0, 1e-12, `leader home at ${b}`); near(df, 0, 1e-12, `follower home at ${b}`); }
    // First instant each foot leaves in each flight (outgoing / return) of each slot.
    const key = `${index}${q < 1 ? 'out' : 'ret'}`;
    if (Math.abs(dl - (q < 1 ? 0 : dir * S)) > 1e-9 && left.leader[key] === undefined) left.leader[key] = b;
    if (Math.abs(df - (q < 1 ? 0 : -dir * S)) > 1e-9 && left.follower[key] === undefined) left.follower[key] = b;
    // The foot stepping back clears the lane first: its progress is never behind the other's.
    const lp = q < 1 ? Math.abs(dl) / S : 1 - Math.abs(dl) / S, fp = q < 1 ? Math.abs(df) / S : 1 - Math.abs(df) / S;
    const followerBack = (q < 1) === (dir > 0);
    assert(followerBack ? fp >= lp - 1e-12 : lp >= fp - 1e-12, `backward foot clears the lane first at ${b}`);
    // Roots in the couple (world) frame: leader -dz + z, follower dz - z: constant gap.
    near((dz - F.root.z) - (-dz + L.root.z), 2 * dz - 2 * o.z, 1e-12, `couple block at ${b}`);
    travel = Math.max(travel, Math.abs(L.root.z - o.z));
    near(L.loadL + L.loadR, 1); near(L.loadR, F.loadL, 1e-12, `mirrored loads at ${b}`);
  }
  for (const key of Object.keys(left.leader)) assert(left.follower[key] >= left.leader[key] - 1e-9, `R24: follower never leaves first (${key}: ${left.follower[key]} vs ${left.leader[key]})`);
  // The leader's upper body (chest yaw) plays the follower's mirrored upper curve IDA_LEAD earlier.
  for (let tick = 0; tick < 800; tick++) {
    const b = tick / 100;
    const L = api.sampleIdaPaire(b, false, rest, 'quinconce'), F = api.sampleIdaPaire(b + api.IDA_LEAD, true, rest, 'quinconce');
    near(L.rootYaw + L.chestYaw, -(F.rootYaw + F.chestYaw), 1e-12, `leader chest leads by ${api.IDA_LEAD} at ${b}`);
  }
  // #84 (owner: « un côté de la hanche avance/recule et l'autre côté reste ») : the pelvis pivots about the
  // standing hip; the moving foot's hip is ahead of it (in the dancer's step direction) by `hip` times the
  // leader's step; the knees do not follow the pivot (kneeYaw = kneeFoot · pivot).
  {
    const span = rest.L.x - rest.R.x;
    let peak = 0;
    for (let tick = 0; tick < 800; tick++) for (const follower of [false, true]) {
      const b = tick / 100, x = api.sampleIdaPaire(b, follower, rest, 'quinconce'), lead = api.sampleIdaPaire(b, false, rest, 'quinconce');
      const leadOffset = lead.feet[lead.moving].z - api.sampleIdaPaire(0, false, rest, 'quinconce').feet[lead.moving].z;
      // Advance of the moving hip over the standing one, in the dancer's own frame (z forward).
      const ahead = (x.moving === 'L' ? -1 : 1) * span * Math.sin(x.rootYaw);
      // #210: flowing, the advance follows the leader's steps over the whole cycle: the moving hip goes the way the
      // dancer's moving foot goes while the weight is on it (beats 0.8 to 1.4 of each slot), never further than `hip`
      // times the step, and the pelvis is square at each slot boundary.
      const { q, dir } = api.idaStepAt(b), way = follower ? -dir : dir;
      if (q >= 0.8 && q <= 1.4) assert(ahead * way > 0.005, `#84 moving hip ahead at ${b} (${follower ? 'follower' : 'leader'}): ${ahead}`);
      assert(Math.abs(ahead) <= api.IDA_PAIR.hip * S + 1e-3, `#84 the moving hip leads by at most hip·step at ${b}`);
      if (tick % 200 === 0) near(x.rootYaw, 0, 1e-9, `#210 square pelvis at the slot boundary ${b}`);
      // The single go-and-return inserted in another figure (#144) keeps its own slot's path: the hip follows the foot.
      const one = api.sampleIdaPaire(b, follower, rest, 'quinconce', 0, api.IDA_DEFAULT, true);
      near((one.moving === 'L' ? -1 : 1) * span * Math.sin(one.rootYaw), api.IDA_PAIR.hip * (follower ? -leadOffset : leadOffset), 2e-3, `#84 inserted: moving hip ahead at ${b}`);
      near(x.kneeYaw, api.IDA_PAIR.kneeFoot * x.rootYaw, 1e-12, `#84 knees do not follow the pivot at ${b}`);
      peak = Math.max(peak, Math.abs(ahead));
    }
    assert(peak > 0.02, `#84: the moving hip leads by a few centimetres (${peak})`);
    console.log(`PASS #84 : bassin qui pivote sur la hanche d’appui, hanche du pied qui bouge en avance de ${(peak * 100).toFixed(1)} cm au plus ; genoux au-dessus des pieds`);
  }
  // #84: the pelvis travels with the weight (carry) plus half of the moving hip's advance (hip); #210: as far as the
  // share of the weight that goes onto the outgoing foot.
  const carry = api.IDA_PAIR.carry * api.IDA_WEIGHT_PROTO.v.share;
  assert(travel >= carry * api.IDA_PAIR.step - 1e-3 && travel <= (carry + api.IDA_PAIR.hip / 2) * api.IDA_PAIR.step + 1e-3,
    `pelvises travel between carry·share·step and (carry·share + hip/2)·step (${travel})`);
  // #89: the variants are the cycle started later (right leg +4, backwards first +2).
  for (const [v, shift] of [[{ side: 'R', back: false }, 4], [{ side: 'L', back: true }, 2], [{ side: 'R', back: true }, 6]])
    for (let b = 0; b < 8; b += .25) { const x = api.sampleIdaPaire(b, false, rest, 'quinconce', 0, v), y = api.sampleIdaPaire(b + shift, false, rest, 'quinconce');
      for (const side of ['L', 'R']) near(x.feet[side].z, y.feet[side].z, 1e-12, `variant ${JSON.stringify(v)} = cycle + ${shift}`); }
  console.log(`PASS séquence : avant G, arrière G, avant D, arrière D (un aller-retour par 2 temps), suiveur en miroir sans partir avant le leader, couple d'un bloc (${(travel * 100).toFixed(1)} cm), buste du leader en avance de ${api.IDA_LEAD} temps ; variantes = cycle décalé`);
}

// 2c. Ginga (#42, docs/spec-ginga.md): the style's hip pattern is triggered by each transfer. #210: the outgoing foot
// takes three quarters of the weight (vote of 25 Nov.): the phase goes towards it until the style's support is the
// figure's and comes back the same way; it advances one half-cycle per whole transfer (two per 8-beat cycle). The
// go-and-returns follow one another without the ginga stopping: the phase moves all along the cycle, each swing over
// its window (`idaGingaWindows`, which follow one another), and at the end of each window the style's support is the
// figure's after that transfer (the coupled follower dances the leader's phase mirrored, i.e. on her own mirrored
// feet). The leader transmits at 70 %, the follower pronounces it fully.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  assert.equal(api.IDA_WEIGHT_PROTO.v.share, 0.75, 'three quarters of the weight by default (#210, question 31: C)');
  for (const follower of [false, true]) {
    const windows = api.idaGingaWindows(follower), transfers = api.idaTransfers(follower);
    windows.forEach((w, k) => {
      const next = windows[(k + 1) % windows.length];
      near(next.start + (k === windows.length - 1 ? api.IDA_BEATS : 0), w.end, 1e-12, `ginga windows follow one another (${k})`);
      // The hip reaches the outgoing foot as the weight does, on the beat.
      if (!transfers[k].returning && transfers[k].amount < 1) near(w.end, transfers[k].end, 1e-12, `the hip arrives with the weight (${k})`);
    });
  }
  for (const styleKey of Object.keys(api.STYLES).filter(k => k !== 'kompa')) {
    const support = api.STYLES[styleKey].support;
    for (const follower of [false, true]) {
      // Never held: between two samples a hundredth of a beat apart the phase moves, except where a swing turns
      // back (a window's ends).
      const windows = api.idaGingaWindows(follower), ends = windows.flatMap(w => [w.start, w.end].map(x => ((x % 8) + 8) % 8));
      let previous = api.sampleIdaPaire(0, follower, rest, 'quinconce').gingaBeat, held = 0;
      for (let b = 0.01; b <= 16; b += 0.01) {
        const g = api.sampleIdaPaire(b, follower, rest, 'quinconce').gingaBeat;
        if (Math.abs(g - previous) < 1e-6 && !ends.some(e => Math.abs(((b % 8) + 8) % 8 - e) < 0.03)) held++;
        previous = g;
      }
      assert.equal(held, 0, `${styleKey}: the ginga never holds (${held} samples)`);
      const s0 = api.sampleIdaPaire(0, follower, rest, 'quinconce').gingaBeat, s8 = api.sampleIdaPaire(8, follower, rest, 'quinconce').gingaBeat;
      assert(Math.abs(s8 - s0 - 2) < 1e-9, `${styleKey}: two half-cycles per cycle (${s8 - s0})`);
      api.idaTransfers(follower).forEach((t, k) => {
        const f = api.sampleIdaPaire(windows[k].end, follower, rest, 'quinconce');
        const side = Math.sign(support(f.gingaBeat)) * (follower ? -1 : 1);
        const after = api.sampleIdaPaire(t.end + 1e-6, follower, rest, 'quinconce');
        assert.equal(side, after.loadR >= 0.5 ? 1 : -1, `${styleKey} ${follower ? 'follower' : 'leader'}: style support = figure support after ${t.from}→${t.to}@${t.end}`);
        // The style's support carries the figure's share of the weight: -sin(π·phase) is -1 on the left, +1 on the right.
        near((1 - Math.sin(Math.PI * f.gingaBeat) * (follower ? -1 : 1)) / 2, after.loadR, 1e-6, `${styleKey}: style's share of the weight after ${t.from}→${t.to}@${t.end}`);
      });
    }
  }
  const lead = api.sampleIdaPaire(1, false, rest, 'quinconce'), foll = api.sampleIdaPaire(1, true, rest, 'quinconce');
  assert(Math.abs(lead.gingaAmp / foll.gingaAmp - 0.7) < 1e-9, 'leader at 70 % of the follower');
  console.log('PASS ginga : trois quarts du poids sur le pied sorti, la hanche y va et revient, sans jamais s’arrêter d’un aller-retour à l’autre ; appui du style = appui de la figure ; leader à 70 %');
}

// 2b. Support transfers, explicit for the ginga (#42, « transferts de poids […] à chaque alternance ») :
// ten per cycle (#107), alternating feet, the same instants for both dancers with mirrored feet; the load
// only changes inside a transfer and ends on its target foot: three quarters of the weight on the outgoing foot
// (#210), all of it once it has come back.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  for (const follower of [false, true]) {
    const list = api.idaTransfers(follower);
    assert.equal(list.length, 10, "ten transfers per cycle");
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
        assert(Math.abs(s.loadR - 0.5) >= 0.25 - 1e-9 || inside, `support outside transfers at ${b}`); }
      else { assert.equal(s.transfer?.to, t.to); assert(t.to === 'R' ? s.loadR >= previous.loadR - 1e-12 : s.loadR <= previous.loadR + 1e-12, `monotonic transfer at ${b}`); }
      previous = s;
    }
    for (const t of list) {
      const s = api.sampleIdaPaire(t.end + 1e-6, follower, rest, 'quinconce');
      const share = t.returning || t.amount === 1 ? 1 : t.amount;
      near(t.to === 'R' ? s.loadR : s.loadL, share, 1e-9, `transfer ends on ${t.to} (${share})`);
      // Both feet are down during every transfer.
      for (const side of ['L', 'R']) near(api.sampleIdaPaire((t.start + t.end) / 2, follower, rest, 'quinconce').feet[side].lift, 0, 1e-12);
    }
  }
  console.log('PASS transferts d’appui : dix par cycle, alternés D/G, simultanés et en miroir, deux pieds au sol', api.idaTransfers(false).map(t => `${t.from}→${t.to}@${t.start}`).join(' '));
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
    // foot does not move while it is out (#107: between its outgoing flight and its return).
    for (const [side, from, until] of [[still, 0, 2], [s.moving, api.IDA_PAIR.out[1], api.IDA_PAIR.ret[0]]]) {
      api.applyPose(f.r, f.model, slot * 2 + from + .001, config); const start = world(f, 'foot' + side);
      for (let t = from + .05; t < until; t += .05) {
        api.applyPose(f.r, f.model, slot * 2 + t, config);
        near(start.distanceTo(world(f, 'foot' + side)), 0, 1e-9, `${side} planted slot ${slot} t${t.toFixed(2)}`);
      }
    }
  }
  for (const beat of [0, .5, .8, 1, 1.2, 1.85, 2, 3, 3.85, 4, 5, 6, 7, 7.85, 7.99, 8]) {
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

// #210 (owner, 25 Nov. 2026): no pose held on the beats; the go-and-returns follow one another without the ginga, the
// hips or the pelvis stopping. Guard: in the comparator's pair view (quinconce, plexus contact, contraposition), every
// 1/50 of a beat over two cycles from the start, six styles, both dancers, the pelvis centre moves at 1 cm per beat at
// least. Below that a film at 12 images per second (90 bpm: 8 images per beat) moves the pelvis about a millimetre per
// image: a pose held to the eye. Measured on 25 Nov.: 0 cm per beat on every even beat before (pelvis held from 1.85 to
// 2.1 of each slot, ginga, carry and pivot all stopped together); now at least 1.4 cm per beat (kompa, follower).
// scripts/mesure_vitesse_bassin_ida.mjs gives the curves and the angular speed.
{
  const STEP = 1 / 50, FLOOR = 1;
  let slowest = { v: Infinity };
  for (const styleKey of Object.keys(api.STYLES).filter(k => api.movementAllowed(k, 'ida'))) {
    const pair = couple(), last = [null, null];
    for (let k = 0; k <= 16 / STEP; k++) {
      const beat = k * STEP;
      pair.forEach((f, i) => {
        api.applyPose(f.r, f.model, beat, { movement: 'ida', ida: true, idaPaire: true, embrace: true, follower: !!i,
          placement: 'quinconce', styleKey, amp: 1, plexus: true, contraposition: 1 });
        f.r.root.updateWorldMatrix(true, true);
        const p = f.r.pelvis.getWorldPosition(new THREE.Vector3());
        if (last[i]) {
          const v = p.distanceTo(last[i]) / STEP * 100;
          if (v < slowest.v) slowest = { v, styleKey, beat, who: i ? 'suiveuse' : 'guideur' };
        }
        last[i] = p;
      });
    }
  }
  assert(slowest.v >= FLOOR, `#210: the pelvis stands still (${slowest.v.toFixed(2)} cm per beat, ${slowest.styleKey}, ${slowest.who}, beat ${slowest.beat.toFixed(2)})`);
  console.log(`PASS #210 : le bassin ne s’arrête jamais, au moins ${slowest.v.toFixed(1)} cm par temps (${slowest.styleKey}, ${slowest.who}, temps ${slowest.beat.toFixed(2)}) ; garde : ${FLOOR} cm par temps`);
}
