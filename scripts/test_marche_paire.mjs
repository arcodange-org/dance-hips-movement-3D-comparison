// #89 — game mode arrows (docs/spec-jeu-fleches.md): walking forward / backward / double in pair, and the
// ida e volta variants (right leg, backwards first), on the real GLB.
// PROBE=1 counts the violations instead of failing on the first one.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-marche-paire-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'idaPaire', 'marchePaire', 'gait']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const PROBE = process.env.PROBE === '1';
const failures = {};
const check = (ok, label, key = label) => {
  if (ok) return;
  if (!PROBE) assert.fail(label);
  if (process.env.VERBOSE && /bones/.test(key)) console.log(label);
  failures[key] = (failures[key] ?? 0) + 1;
};
const near = (a, b, tolerance = 1e-8, label = '') => check(Math.abs(a - b) <= tolerance, `${label} ${a} != ${b} (tol ${tolerance})`, label.replace(/[0-9.]+/g, '#'));
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.MARCHE_PAIR_DZ;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const stanceOf = m => (m.legs.L.hipX - m.legs.L.rest.x + m.legs.R.rest.x - m.legs.R.hipX) / 2;
const restOf = f => ({ L: f.model.legs.L.rest, R: f.model.legs.R.rest });
// Walks: every style (kompa, tarraxinha and zouk dance forward and backward). The ida e volta variants:
// the styles whose game offers figures (not those restricted to on the spot and forward / backward).
const STYLES = Object.keys(api.STYLES).filter(k => api.movementAllowed(k, 'ida'));
const FIGURE_STYLES = STYLES.filter(k => !api.STYLE_MOVEMENTS[k]);
const WALKS = ['avance', 'recule', 'double'];
const VARIANTS = [{ side: 'R', back: false }, { side: 'L', back: true }, { side: 'R', back: true }];
/** Cases: [label, beats, extra pose options, styles]. */
const cases = [
  ...WALKS.map(kind => [kind, api.MARCHE_BEATS, { marche: kind }, STYLES]),
  ...VARIANTS.map(v => [`ida ${v.side}${v.back ? ' arrière' : ''}`, api.IDA_BEATS, { idaVariant: v }, FIGURE_STYLES]),
];
const ONLY = process.env.CASES ? new RegExp(process.env.CASES) : null;
if (ONLY) cases.splice(0, cases.length, ...cases.filter(c => ONLY.test(c[0])));
const options = (i, extra = {}) => ({ movement: 'ida', ida: true, embrace: true, idaPaire: true, follower: !!i, ...extra });

// 1. Walks: directions, same length, the follower never leaves before the leader (R24), weight on the
// beat, neutral translated by one step at the end; the right-leg ida is the cycle shifted by 4 beats.
{
  const [lead, foll] = couple();
  const o = api.placementOffset('quinconce', 1);
  const S = api.MARCHE_PAIR.step;
  for (const kind of WALKS) {
    const way = kind === 'recule' ? -1 : 1;
    const N = api.idaNeutral(restOf(lead), o, stanceOf(lead.model));
    const leaves = { leader: {}, follower: {} };
    for (let tick = 0; tick <= 200; tick++) {
      const b = tick / 100;
      const L = api.sampleMarchePaire(b, false, restOf(lead), o, stanceOf(lead.model), kind);
      const F = api.sampleMarchePaire(b, true, restOf(foll), o, stanceOf(foll.model), kind);
      for (const side of ['L', 'R']) {
        const dl = (L.feet[side].z - N[side].z) * way, df = (F.feet[side].z - N[side].z) * way;
        check(dl >= -1e-12 && df <= 1e-12, `${kind}: leader goes ${way > 0 ? 'forward' : 'back'}, follower the other way at ${b}`);
        if (Math.abs(dl) > 1e-9 && leaves.leader[side] === undefined) leaves.leader[side] = b;
        if (Math.abs(df) > 1e-9 && leaves.follower[side] === undefined) leaves.follower[side] = b;
      }
      near(L.loadL + L.loadR, 1, 1e-12, `${kind} loads`);
      near(L.loadR, F.loadL, 1e-12, `${kind}: mirrored loads at ${b}`);
    }
    // The follower's PD answers the leader's PG, her PG his PD: never before (R24).
    check(leaves.follower.R >= leaves.leader.L - 1e-9 && leaves.follower.L >= leaves.leader.R - 1e-9,
      `${kind}: follower never ahead ${JSON.stringify(leaves)}`);
    const end = api.sampleMarchePaire(2, false, restOf(lead), o, stanceOf(lead.model), kind);
    for (const side of ['L', 'R']) near(end.feet[side].z - N[side].z, way * S, 1e-12, `${kind}: ${side} one step at the end`);
    near(end.root.z - N.root.z, way * S, 1e-12, `${kind}: pelvis one step at the end`);
    // Weight: on the second foot at the start and at the end (the PG is free to start again); the
    // walking steps put it on each landed foot on the beat.
    near(api.sampleMarchePaire(0, false, restOf(lead), o, stanceOf(lead.model), kind).loadR, 1, 1e-12, `${kind}: start on PD`);
    near(end.loadR, 1, 1e-12, `${kind}: end on PD`);
    if (kind !== 'double') near(api.sampleMarchePaire(1, false, restOf(lead), o, stanceOf(lead.model), kind).loadL, 1, 1e-12, `${kind}: PG weighted on beat 1`);
  }
  // Double: the marka touches without weight, then the PG is back beside the PD.
  for (let b = 1; b <= 2; b += .05) near(api.sampleMarchePaire(b, false, restOf(lead), o, stanceOf(lead.model), 'double').loadR, 1, 1e-12, `double: marka without weight at ${b}`);
  for (let b = 0; b <= 8; b += .125) {
    const a = api.sampleIdaPaire(b, false, restOf(lead), o, stanceOf(lead.model), { side: 'R', back: false });
    const c = api.sampleIdaPaire(b + 4, false, restOf(lead), o, stanceOf(lead.model));
    for (const side of ['L', 'R']) { near(a.feet[side].x, c.feet[side].x, 1e-12, 'ida R = ida + 4'); near(a.feet[side].z, c.feet[side].z, 1e-12, 'ida R = ida + 4'); }
  }
  const back = api.sampleIdaPaire(1, false, restOf(lead), o, stanceOf(lead.model), { side: 'L', back: true });
  check(back.feet.L.z < api.idaNeutral(restOf(lead), o, stanceOf(lead.model)).L.z - .1, 'ida arrière: the leader steps back first');
  console.log('PASS marche : directions, même pas, suiveur jamais en avance, appuis sur les temps, un pas de couple ; ida jambe droite = cycle décalé de 4 temps, ida en arrière d\'abord');
}

// 2. GLB invariants: floor, IK targets, bone lengths, continuity (styles, amplitudes, placements).
let poses = 0, minY = Infinity;
for (const [label, beats, extra, styles] of cases) for (const placement of ['quinconce', 'reference']) for (const styleKey of styles) for (const amp of [.5, 1, 2]) {
  const pair = couple();
  for (let tick = 0; tick <= beats * 8; tick++) {
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 8, options(i, { styleKey, amp, placement, ...extra }));
      const ground = minimumBoneY(f.r); minY = Math.min(minY, ground);
      check(ground >= -.0001, `${label} floor ${placement} ${styleKey} ${amp} ${tick / 8}: ${ground}`, `${label} floor`);
      for (const side of ['L', 'R']) {
        const error = world(f, 'foot' + side).distanceTo(f.outer.localToWorld(f.model.targets[side].clone()));
        check(error < .001, `${label} target ${styleKey} ${tick / 8} ${side}: ${error}`, `${label} target`);
      }
      snapshot(f.r).forEach(v => check(Number.isFinite(v), `${label} finite`));
      poses++;
    });
  }
}
console.log('PASS marche et variantes GLB :', poses, 'poses ; min vertex Y', minY.toFixed(5));

// 3. Swept foot hulls of the four feet stay apart (quinconce, face; amplitudes 0.5 to 2).
for (const [label, beats, extra] of cases) for (const placement of ['quinconce', 'face']) for (const amp of [.5, 1, 1.5, 2]) {
  const pair = couple();
  for (let tick = 0; tick <= beats * 50; tick++) {
    const polygons = [];
    pair.forEach((f, i) => {
      api.applyPose(f.r, f.model, tick / 50, options(i, { placement, amp, ...extra }));
      for (const side of ['L', 'R']) polygons.push(footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld))));
    });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
      check(!footHullsOverlap(polygons[i], polygons[j]), `${label}: foot clearance ${placement} amp ${amp} at ${tick / 50}, feet ${i}/${j}`, `${label} feet ${placement}`);
  }
}
console.log('PASS enveloppes des quatre pieds disjointes (marche et variantes ; quinconce, face à face ; amplitudes 0,5 à 2)');

// 4. Leg bones: no crossing between partners nor between one dancer's legs.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
let collisionPoses = 0;
const boneConfigs = [{ placement: 'quinconce' }, { placement: 'reference' }, { placement: 'quinconce', plexus: true, contraposition: 1 }];
for (const [label, beats, extra, styles] of cases) for (const config of boneConfigs) for (const styleKey of styles) for (const amp of [.5, 1, 2]) {
  const pair = couple(); const placement = config.placement + (config.plexus ? '+plexus' : '');
  for (let beat = 0; beat <= beats; beat += .125) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i, { styleKey, amp, ...config, ...extra })));
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames) {
      const collision = meshIntersection(meshes[0][a], meshes[1][b]);
      check(!collision, JSON.stringify({ label, placement, styleKey, amp, beat, leader: a, partner: b }), `${label} bones ${placement} ${styleKey}`);
    }
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R'))) {
        const collision = meshIntersection(own[a], own[b]);
        check(!collision, JSON.stringify({ label, placement, styleKey, amp, beat, role, left: a, right: b }), `${label} own bones ${placement} ${styleKey}`);
      }
    collisionPoses++;
  }
}
console.log('PASS', collisionPoses, 'poses de couple (marche et variantes) : aucun croisement des os des jambes');
if (PROBE) console.log(JSON.stringify(failures, null, 1));
