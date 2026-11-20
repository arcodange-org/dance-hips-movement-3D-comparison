// #90 — chaining the sortie fille into the end of the sortie garçon (docs/spec-enchainements.md), on the
// real GLB. PROBE=1 counts the violations instead of failing on the first one.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-enchainement-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'enchainement', 'sortieFille', 'sortieGarcon']
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
const near = (a, b, tolerance, label) => check(Math.abs(a - b) <= tolerance, `${label} ${a} != ${b} (tol ${tolerance})`, label);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.SORTIE_FILLE_PAIR_DZ;
assert.equal(api.SORTIE_GARCON_PAIR_DZ, dz, 'one couple spacing for both sorties');
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const stanceOf = m => (m.legs.L.hipX - m.legs.L.rest.x + m.legs.R.rest.x - m.legs.R.hipX) / 2;
const restOf = f => ({ L: f.model.legs.L.rest, R: f.model.legs.R.rest });
// The sorties are offered in the styles that are not restricted to on the spot and forward / backward.
const STYLES = Object.keys(api.STYLES).filter(k => api.movementAllowed(k, 'sortieF') && api.movementAllowed(k, 'sortieG') && (!process.env.STYLE || k === process.env.STYLE));
const AMPS = process.env.AMP ? [Number(process.env.AMP)] : null;
const options = (i, extra = {}) => ({ movement: 'sortieF', embrace: true, sortieChain: true, follower: !!i, ...extra });
const B = api.CHAIN_BEATS, FROM = api.CHAIN_FROM, JOIN = api.CHAIN_FROM + api.CHAIN_BRIDGE.beats;

// 1. Samples: the sortie fille up to its position 3, the sortie garçon from its position 2 (translated),
// continuous at both junctions; the leader's D stays planted over the bridge; weights as announced; the
// follower's G never leaves before the leader's (R24).
{
  const [lead, foll] = couple();
  const o = api.placementOffset('quinconce', 1);
  for (const [i, f] of [lead, foll].entries()) {
    const s = t => api.sampleSortieFG(t, !!i, restOf(f), o, 1, stanceOf(f.model));
    const fille = api.sampleSortieFille(2.5, !!i, restOf(f), 'hook', o, 1, stanceOf(f.model));
    for (const side of ['L', 'R']) near(s(2.5).feet[side].x, fille.feet[side].x, 1e-12, 'sortie fille unchanged before position 3');
    for (const t of [FROM, JOIN]) for (const side of ['L', 'R']) {
      const a = s(t - 1e-7), b = s(t + 1e-7);
      near(a.feet[side].x, b.feet[side].x, 1e-5, `foot continuity at ${t}`); near(a.feet[side].z, b.feet[side].z, 1e-5, `foot continuity at ${t}`);
      near(a.root.x, b.root.x, 1e-5, `root continuity at ${t}`); near(a.root.z, b.root.z, 1e-5, `root continuity at ${t}`);
      near(a.loadR, b.loadR, 1e-5, `load continuity at ${t}`);
    }
    // Garçon part: his own figure, translated (same relative steps).
    const g = t => api.sampleSortieGarcon(t, !!i, restOf(f), 'line', api.DEFAULT_SORTIE_CONTRA, o, 1, stanceOf(f.model));
    const d0 = { x: s(JOIN).feet.L.x - g(api.CHAIN_TO).feet.L.x, z: s(JOIN).feet.L.z - g(api.CHAIN_TO).feet.L.z };
    for (let t = JOIN; t <= B; t += .25) for (const side of ['L', 'R']) {
      near(s(t).feet[side].x - g(api.CHAIN_TO + t - JOIN).feet[side].x, d0.x, 1e-12, 'sortie garçon translated');
      near(s(t).feet[side].z - g(api.CHAIN_TO + t - JOIN).feet[side].z, d0.z, 1e-12, 'sortie garçon translated');
    }
    if (!i) for (let t = FROM; t <= JOIN; t += .05) { near(s(t).feet.R.x, s(FROM).feet.R.x, 1e-12, 'leader D planted'); near(s(t).feet.R.z, s(FROM).feet.R.z, 1e-12, 'leader D planted'); }
  }
  const leaves = which => { const s = t => api.sampleSortieFG(t, which === 'F', restOf(which === 'F' ? foll : lead), o, 1, stanceOf(lead.model));
    for (let t = FROM; t <= JOIN; t += .005) for (const side of ['L', 'R']) if (Math.hypot(s(t).feet[side].x - s(FROM).feet[side].x, s(t).feet[side].z - s(FROM).feet[side].z) > 1e-9) return t; return Infinity; };
  check(leaves('F') >= leaves('L') - 1e-9, `follower's first foot never before the leader's (${leaves('F')} vs ${leaves('L')})`);
  near(api.sampleSortieFG(JOIN, false, restOf(lead), o, 1, stanceOf(lead.model)).loadR, 1, 1e-12, 'leader on D at the junction');
  near(api.sampleSortieFG(JOIN, true, restOf(foll), o, 1, stanceOf(foll.model)).loadR, 0, 1e-12, 'follower on G at the junction');
  console.log('PASS enchaînement : sortie fille jusqu\'à sa position 3, pont de 2 temps, fin de la sortie garçon translatée ; continuité, D du leader planté, suiveur jamais en avance');
}

// 2. GLB invariants: floor, IK targets (styles, amplitudes, placements).
let poses = 0, minY = Infinity;
for (const placement of ['quinconce', 'reference']) for (const styleKey of STYLES) for (const amp of [.5, 1, 2]) {
  const pair = couple();
  for (let tick = 0; tick <= B * 8; tick++) pair.forEach((f, i) => {
    api.applyPose(f.r, f.model, tick / 8, options(i, { styleKey, amp, placement }));
    const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
    check(ground >= -.0001, `floor ${placement} ${styleKey} ${amp} ${tick / 8}: ${ground}`, 'floor');
    for (const side of ['L', 'R']) {
      const error = world(f, 'foot' + side).distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
      check(error < .001, `target ${styleKey} ${tick / 8} ${side}: ${error}`, 'target');
    }
    snapshot(f.r).forEach(v => check(Number.isFinite(v), 'finite'));
    poses++;
  });
}
console.log('PASS enchaînement GLB :', poses, 'poses ; min vertex Y', minY.toFixed(5));

// 3. Swept foot hulls of the four feet stay apart over the bridge and the garçon part.
for (const placement of ['quinconce', 'reference']) for (const amp of [.5, 1, 1.5, 2]) {
  const pair = couple();
  for (let tick = FROM * 50; tick <= B * 50; tick++) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 50, options(i, { placement, amp }));
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
      check(!footHullsOverlap(polygons[a], polygons[b]), `foot clearance ${placement} amp ${amp} at ${tick / 50}, feet ${a}/${b}`, `feet ${placement}`);
  }
}
console.log('PASS enveloppes des quatre pieds disjointes (pont et fin de la sortie garçon ; amplitudes 0,5 à 2)');

// 4. Leg bones: no crossing between partners nor between one dancer's legs.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
let collisionPoses = 0;
const boneConfigs = [{ placement: 'quinconce' }, { placement: 'reference' }, { placement: 'quinconce', plexus: true, contraposition: 1 }];
for (const config of boneConfigs) for (const styleKey of STYLES) for (const amp of AMPS ?? [.5, 1, 2]) {
  const pair = couple(); const placement = config.placement + (config.plexus ? '+plexus' : '');
  for (let beat = FROM; beat <= B; beat += .125) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i, { styleKey, amp, ...config })));
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames)
      check(!meshIntersection(meshes[0][a], meshes[1][b]), JSON.stringify({ placement, styleKey, amp, beat, leader: a, partner: b }), `bones ${placement} ${styleKey}`);
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R')))
        check(!meshIntersection(own[a], own[b]), JSON.stringify({ placement, styleKey, amp, beat, role, left: a, right: b }), `own bones ${placement} ${styleKey}`);
    collisionPoses++;
  }
}
console.log('PASS', collisionPoses, 'poses de couple (pont et fin de la sortie garçon) : aucun croisement des os des jambes');
if (PROBE) console.log(JSON.stringify(failures, null, 1));
