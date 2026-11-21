// #144 — a touch (a foot's go-and-return, « ida e volta ») before any step that goes forward or backward
// (docs/spec-ida-partout.md), on the real GLB, in the game mode's configuration (quinconce, plexus).
// PROBE=1 counts the violations per position instead of failing on the first one; EXTRA=1 adds the
// candidate positions that are not offered (to measure them).
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-touches-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'insertion', 'guidage']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const PROBE = process.env.PROBE === '1';
const failures = {};
const check = (ok, label, key = label) => {
  if (ok) return;
  if (!PROBE) assert.fail(label);
  if (process.env.VERBOSE) console.log(label);
  failures[key] = (failures[key] ?? 0) + 1;
};
const near = (a, b, tolerance, label, key = label) => check(Math.abs(a - b) <= tolerance, `${label} ${a} != ${b} (tol ${tolerance})`, key);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.GUIDE_PAIR_DZ;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const stanceOf = m => (m.legs.L.hipX - m.legs.L.rest.x + m.legs.R.rest.x - m.legs.R.hipX) / 2;
const restOf = f => ({ L: f.model.legs.L.rest, R: f.model.legs.R.rest });
const ZERO = { leader: { x: 0, z: 0 }, follower: { x: 0, z: 0 } };
/** Pose options of the game mode for a figure kind, with its touches. #157: the game dances at amplitude 1
 * with its ginga (hip sway and bounce, docs/spec-ginga-couple.md), calibrated there; the other amplitudes
 * check the touch itself, without it. GINGA=… chooses another setting. */
const options = (kind, i, touches, extra = {}) => ({
  ...api.guidePoseOptions({ movement: api.GUIDE_FIGURES[kind].movement, rootOffset: ZERO, kind, ginga: extra.amp !== undefined && extra.amp !== 1 ? 'sans' : process.env.GINGA ?? api.GUIDE_GINGA_DEFAULT }, !!i), placement: 'quinconce', contraposition: 1, touches, ...extra });
const label = (kind, touch) => `${kind}@${touch.at}${touch.side === 'L' ? 'G' : 'D'}${touch.back ? '-' : '+'}${touch.virgula ? 'v' : ''}${touch.scale ? '*' + touch.scale : ''}${touch.aside ? '~' + touch.aside : ''}${touch.lift !== undefined ? '^' + touch.lift : ''}`;

// Candidates: every offered position, alone; with EXTRA=1 the positions measured but not offered.
const candidates = Object.entries(api.TOUCH_POSITIONS).flatMap(([kind, touches]) => touches.map(touch => ({ kind, touch })));
// The virgula, where the leader's G goes forward and the position offers it.
for (const { kind, touch } of [...candidates]) if (touch.virgula === undefined && api.touchVirgula(kind, touch)) candidates.push({ kind, touch: { ...touch, virgula: true } });
if (process.env.EXTRA === '1') {
  const F = false, T = true;
  candidates.push(
    { kind: 'quart', touch: { at: 1, side: 'R', back: F } },
    { kind: 'sortieFG', touch: { at: 0, side: 'L', back: F } }, { kind: 'sortieFG', touch: { at: 2, side: 'L', back: T } },
    { kind: 'sortieFG', touch: { at: 5, side: 'L', back: F } }, { kind: 'sortieFG', touch: { at: 6, side: 'R', back: F } },
    ...['avance', 'double', 'quart', 'sortieG', 'sortieF'].map(kind => ({ kind, touch: { at: 0, side: 'L', back: F, virgula: T } })),
    { kind: 'sortieG', touch: { at: 2, side: 'L', back: F, virgula: T, open: api.INSERTION_OPEN } },
  );
}
// TRY='{"kind":"sortieG","touch":{…}}': one more candidate, to measure an adjustment.
if (process.env.TRY) candidates.push(...[].concat(JSON.parse(process.env.TRY)));
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const list = candidates.filter(c => !only || only.test(label(c.kind, c.touch)));
// A touch is an ida e volta: it is danced in the styles that offer the figure and the ida e volta.
const stylesOf = kind => Object.keys(api.STYLES).filter(k => api.guideFiguresFor(k).includes(kind) && api.guideFiguresFor(k).includes('ida') && (!process.env.STYLE || k === process.env.STYLE));
const AMPS = process.env.AMP ? process.env.AMP.split(',').map(Number) : [.5, 1, 2];

// 1. Samples: the figure up to the position, the touch added to the held position, the figure resumed;
// continuous at both ends; the foot goes in the direction of its step and returns without the weight;
// the follower mirrors with her other foot and never leaves before the leader (R24).
{
  const [lead, foll] = couple();
  const o = api.placementOffset('quinconce', 1);
  for (const { kind, touch } of list) {
    const key = label(kind, touch), AT = touch.at, END = AT + api.TOUCH_BEATS;
    const rigOf = f => ({ rest: restOf(f), stance: stanceOf(f.model), placement: 'quinconce', amp: 1 });
    for (const [i, f] of [lead, foll].entries()) {
      const host = t => api.sampleKind(kind, t, !!i, rigOf(f));
      const s = t => api.sampleTouched(host, [touch], t, !!i, restOf(f), o, stanceOf(f.model));
      for (const t of [AT * .5, AT]) for (const side of ['L', 'R']) near(s(t).feet[side].z, host(t).feet[side].z, 1e-12, `${key}: unchanged before the touch`);
      for (const t of [END, END + .5, END + 1.25]) for (const side of ['L', 'R']) near(s(t).feet[side].z, host(t - api.TOUCH_BEATS).feet[side].z, 1e-12, `${key}: resumed after the touch`);
      for (const t of [AT, END]) {
        const a = s(t - 1e-7), b = s(t + 1e-7);
        for (const side of ['L', 'R']) { near(a.feet[side].x, b.feet[side].x, 1e-5, `${key}: foot continuity at ${t}`); near(a.feet[side].z, b.feet[side].z, 1e-5, `${key}: foot continuity at ${t}`); }
        near(a.root.z, b.root.z, 1e-5, `${key}: root continuity at ${t}`);
        if (a.loadR !== undefined) near(a.loadR, b.loadR, 1e-5, `${key}: load continuity at ${t}`);
      }
      // The moving foot: his, and her other one; forward or back as his step (she mirrors).
      const moving = (touch.side === 'L') !== !!i ? 'L' : 'R', still = moving === 'L' ? 'R' : 'L', held = s(AT);
      const way = (touch.back ? -1 : 1) * (i ? -1 : 1);
      check((s(AT + 1).feet[moving].z - held.feet[moving].z) * way > .1, `${key}: ${i ? 'her' : 'his'} ${moving} goes ${way > 0 ? 'forward' : 'back'} (${s(AT + 1).feet[moving].z - held.feet[moving].z})`);
      for (let t = AT; t <= END; t += .125) near(s(t).feet[still].z, held.feet[still].z, 1e-12, `${key}: the supporting foot stays`);
      // Touch: the weight is on the other foot at both ends, and stays there during the return.
      if (held.loadR !== undefined) {
        const onStill = x => (still === 'R' ? x.loadR : 1 - x.loadR);
        check(onStill(held) > .95, `${key}: ${i ? 'her' : 'his'} weight is on the other foot before the touch (${onStill(held)})`);
        for (let t = AT + 1.25; t <= END; t += .05) near(s(t).loadR, held.loadR, 1e-12, `${key}: return without weight at ${t}`);
      }
    }
    const leaves = (i, f) => { const moving = (touch.side === 'L') !== !!i ? 'L' : 'R';
      const s = t => api.sampleTouched(t2 => api.sampleKind(kind, t2, !!i, rigOf(f)), [touch], t, !!i, restOf(f), o, stanceOf(f.model));
      for (let t = AT; t <= END; t += .005) if (Math.abs(s(t).feet[moving].z - s(AT).feet[moving].z) > 1e-9) return t; return Infinity; };
    check(leaves(1, foll) >= leaves(0, lead) - 1e-9, `${key}: follower never ahead (${leaves(1, foll)} vs ${leaves(0, lead)})`);
  }
  console.log(`PASS allers-retours (${list.length} cas) : figure inchangée avant, reprise après, continuité, pied dans le sens de son pas, retour sans poids, suiveur en miroir et jamais en avance`);
}

// 2. GLB: floor, IK targets, swept foot hulls, leg bones (between partners and within one dancer), over the
// touch and half a beat on each side.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
let poses = 0, minY = Infinity;
for (const { kind, touch } of list) for (const styleKey of stylesOf(kind)) for (const amp of AMPS) {
  const key = label(kind, touch), pair = couple();
  const from = Math.max(0, touch.at - .5), to = touch.at + api.TOUCH_BEATS + .5;
  for (let beat = from; beat <= to + 1e-9; beat += .125) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(kind, i, [touch], { styleKey, amp })));
    for (const [i, f] of pair.entries()) {
      const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
      check(ground >= -.0001, `${key} floor ${styleKey} ${amp} ${beat}: ${ground}`, `${key} floor`);
      for (const side of ['L', 'R']) {
        const error = world(f, 'foot' + side).distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
        check(error < .001, `${key} target ${styleKey} ${amp} ${beat} ${i ? 'follower' : 'leader'} ${side}: ${error}`, `${key} target`);
      }
      snapshot(f.r).forEach(v => check(Number.isFinite(v), `${key} finite`));
    }
    const polygons = pair.flatMap(f => ['L', 'R'].map(side => footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld)))));
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
      check(!footHullsOverlap(polygons[a], polygons[b]), `${key}: feet ${a}/${b} overlap, ${styleKey} amp ${amp} at ${beat}`, `${key} feet`);
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames)
      check(!meshIntersection(meshes[0][a], meshes[1][b]), JSON.stringify({ key, styleKey, amp, beat, leader: a, partner: b }), `${key} bones`);
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R')))
        check(!meshIntersection(own[a], own[b]), JSON.stringify({ key, styleKey, amp, beat, role, left: a, right: b }), `${key} own bones`);
    poses++;
  }
}
console.log('PASS', poses, 'poses de couple avec un aller-retour : os au-dessus du sol (min', minY.toFixed(5) + '), cibles des pieds atteintes, semelles disjointes, aucun croisement des os des jambes');
if (PROBE) console.log(JSON.stringify(failures, null, 1));
