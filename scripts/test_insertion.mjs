// #91 — an ida e volta inserted at position 2 of the sorties (docs/spec-insertion-ida.md), on the real GLB. PROBE=1 counts the violations instead of failing on the first one.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-insertion-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'insertion', 'idaPaire', 'sortieFille', 'sortieGarcon']
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
const B = api.INSERTED_BEATS, AT = api.INSERTION_AT, END = api.INSERTION_AT + api.INSERTION_BEATS;
const HOSTS = ['sortieF', 'sortieG'];
const options = (host, i, extra = {}) => ({ movement: host, embrace: true, sortieInsert: true, follower: !!i, ...extra });

// 1. Samples: the sortie up to its position 2, the ida's displacements added to the held position, the
// sortie resumed; continuous at both junctions; the leader's G goes in the direction of his next step and
// returns without the weight (touch); the follower's D never leaves before his G (R24).
{
  const [lead, foll] = couple();
  const o = api.placementOffset('quinconce', 1);
  for (const host of HOSTS) {
    const figure = (t, i, f) => host === 'sortieF'
      ? api.sampleSortieFille(t, !!i, restOf(f), 'hook', o, 1, stanceOf(f.model))
      : api.sampleSortieGarcon(t, !!i, restOf(f), 'line', api.DEFAULT_SORTIE_CONTRA, o, 1, stanceOf(f.model));
    for (const [i, f] of [lead, foll].entries()) {
      const s = t => api.sampleInserted(host, t, !!i, restOf(f), o, 1, stanceOf(f.model));
      for (const t of [0.5, 1.5, 2]) for (const side of ['L', 'R']) near(s(t).feet[side].z, figure(t, i, f).feet[side].z, 1e-12, `${host}: unchanged before position 2`);
      for (const t of [END, 7, B]) for (const side of ['L', 'R']) near(s(t).feet[side].z, figure(t - api.INSERTION_BEATS, i, f).feet[side].z, 1e-12, `${host}: resumed after the ida`);
      for (const t of [AT, END]) {
        const a = s(t - 1e-7), b = s(t + 1e-7);
        for (const side of ['L', 'R']) { near(a.feet[side].x, b.feet[side].x, 1e-5, `${host}: foot continuity at ${t}`); near(a.feet[side].z, b.feet[side].z, 1e-5, `${host}: foot continuity at ${t}`); }
        near(a.root.z, b.root.z, 1e-5, `${host}: root continuity at ${t}`); near(a.loadR, b.loadR, 1e-5, `${host}: load continuity at ${t}`);
      }
      // The moving foot: his G, her D; forward or back as his next step.
      const moving = i ? 'R' : 'L', held = s(AT);
      const way = (host === 'sortieF' ? -1 : 1) * (i ? -1 : 1);
      check((s(AT + 1).feet[moving].z - held.feet[moving].z) * way > .1, `${host}: ${i ? 'her D' : 'his G'} goes ${way > 0 ? 'forward' : 'back'}`);
      // Touch: during the return the weight stays on the support.
      for (let t = AT + 1.25; t <= END; t += .05) near(s(t).loadR, held.loadR, 1e-12, `${host}: return without weight at ${t}`);
    }
    const leaves = (i, f, side) => { const s = t => api.sampleInserted(host, t, !!i, restOf(f), o, 1, stanceOf(f.model));
      for (let t = AT; t <= END; t += .005) if (Math.abs(s(t).feet[side].z - s(AT).feet[side].z) > 1e-9) return t; return Infinity; };
    check(leaves(1, foll, 'R') >= leaves(0, lead, 'L') - 1e-9, `${host}: follower never ahead (${leaves(1, foll, 'R')} vs ${leaves(0, lead, 'L')})`);
  }
  console.log('PASS insertion : sortie jusqu\'à sa position 2, ida e volta du G (en arrière dans la sortie fille, en avant dans la sortie garçon), retour en touche, sortie reprise ; continuité, suiveur jamais en avance');
}

// 2. GLB invariants: floor, IK targets (styles, amplitudes, placements).
let poses = 0, minY = Infinity;
for (const host of HOSTS) for (const placement of ['quinconce', 'reference']) for (const styleKey of STYLES) for (const amp of [.5, 1, 2]) {
  const pair = couple();
  for (let tick = AT * 8; tick <= END * 8; tick++) pair.forEach((f, i) => {
    api.applyPose(f.r, f.model, tick / 8, options(host, i, { styleKey, amp, placement }));
    const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
    check(ground >= -.0001, `${host} floor ${placement} ${styleKey} ${amp} ${tick / 8}: ${ground}`, `${host} floor`);
    for (const side of ['L', 'R']) {
      const error = world(f, 'foot' + side).distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
      check(error < .001, `${host} target ${styleKey} ${tick / 8} ${side}: ${error}`, `${host} target`);
    }
    snapshot(f.r).forEach(v => check(Number.isFinite(v), 'finite'));
    poses++;
  });
}
console.log('PASS insertion GLB :', poses, 'poses ; min vertex Y', minY.toFixed(5));

// 3. Swept foot hulls of the four feet stay apart during the inserted ida.
for (const host of HOSTS) for (const placement of ['quinconce', 'reference']) for (const amp of [.5, 1, 1.5, 2]) {
  const pair = couple();
  for (let tick = AT * 50; tick <= END * 50; tick++) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 50, options(host, i, { placement, amp }));
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
      check(!footHullsOverlap(polygons[a], polygons[b]), `${host}: foot clearance ${placement} amp ${amp} at ${tick / 50}, feet ${a}/${b}`, `${host} feet ${placement}`);
  }
}
console.log('PASS enveloppes des quatre pieds disjointes (ida inséré ; amplitudes 0,5 à 2)');

// 4. Leg bones: no crossing between partners nor between one dancer's legs.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
let collisionPoses = 0;
const boneConfigs = [{ placement: 'quinconce' }, { placement: 'reference' }, { placement: 'quinconce', plexus: true, contraposition: 1 }];
for (const host of HOSTS) for (const config of boneConfigs) for (const styleKey of STYLES) for (const amp of AMPS ?? [.5, 1, 2]) {
  const pair = couple(); const placement = config.placement + (config.plexus ? '+plexus' : '');
  for (let beat = AT; beat <= END; beat += .125) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(host, i, { styleKey, amp, ...config })));
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames)
      check(!meshIntersection(meshes[0][a], meshes[1][b]), JSON.stringify({ host, placement, styleKey, amp, beat, leader: a, partner: b }), `${host} bones ${placement} ${styleKey}`);
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R')))
        check(!meshIntersection(own[a], own[b]), JSON.stringify({ host, placement, styleKey, amp, beat, role, left: a, right: b }), `${host} own bones ${placement} ${styleKey}`);
    collisionPoses++;
  }
}
console.log('PASS', collisionPoses, 'poses de couple (ida inséré) : aucun croisement des os des jambes');
if (PROBE) console.log(JSON.stringify(failures, null, 1));
