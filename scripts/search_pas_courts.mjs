import { buildSync } from "esbuild"; import { unlinkSync } from "node:fs"; import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs"; import { footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.s56-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose','anatomy','styles','rigJoints','placement','sortieGarcon'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname }, bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname, define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const dz = api.SORTIE_GARCON_PAIR_DZ; const pair = [fixture(api, { offset: [0,0,-dz] }), fixture(api, { rotation: Math.PI, offset: [0,0,dz] })];
const rest = { L: pair[0].model.legs.L.rest, R: pair[0].model.legs.R.rest };
const hull = (f, s) => footHull(f.model.legs[s].sole.map(p => p.clone().applyMatrix4(f.r['foot' + s].matrixWorld)));
const share = +(process.env.SHARE ?? 0.4); globalThis.__BK = process.env.BK ? +process.env.BK : undefined;
const opts = (a) => a.flatMap(x => [x]);
const results = [];
const TABLES = JSON.parse(process.env.TABLES ?? 'null');
const L = [[1,2],[2],[2,3],[3,4],[5]], F = [[1,2],[2,3],[2,3,4],[3,4],[5]];
const combos = (sets) => sets.reduce((acc, s) => acc.flatMap(c => s.map(v => [...c, v])), [[]]).filter(c => c.every((v, i) => i === 0 || v >= c[i - 1]));
for (const [lc, fc] of (TABLES ?? combos(L).flatMap(l => combos(F).map(f => [l, f])))) {
  Object.assign(api.SORTIE_GARCON_TRAVEL, { share, leader: lc, follower: fc });
  let maxStep = 0, steps = [];
  for (const fl of [false, true]) for (let b = 0; b < 5; b++) { const a = api.sampleSortieGarcon(b, fl, rest, 'line', undefined, 'quinconce'), c = api.sampleSortieGarcon(b + .999, fl, rest, 'line', undefined, 'quinconce');
    for (const k of ['L','R']) { const d = Math.hypot(c.feet[k].x - a.feet[k].x, c.feet[k].z - a.feet[k].z); maxStep = Math.max(maxStep, d); if (d > .01) steps.push((fl?'f':'l')+k+(b+1)+':'+Math.round(d*100)); } }
  let ov = 0, where = {};
  for (const placement of (process.env.PLACES ?? 'quinconce').split(',')) for (const amp of (process.env.AMPS ?? '1').split(',').map(Number)) for (const sortieVariant of (process.env.SVS ?? 'line').split(',')) for (let t = 0; t <= 500; t += 4) { const H = []; pair.forEach((f, i) => { api.applyPose(f.r, f.model, t / 100, { movement: 'sortieG', embrace: true, placement, amp, sortieVariant, follower: !!i }); H.push(hull(f, 'L'), hull(f, 'R')); });
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (footHullsOverlap(H[i], H[j])) { ov++; const k = placement[0]+amp+':'+i+''+j; where[k] = where[k] ?? (t/100); } }
  results.push({ lc: lc.join(''), fc: fc.join(''), maxStep: Math.round(maxStep * 100), ov, steps: steps.join(' ') + ' @' + JSON.stringify(where) });
}
results.sort((a, b) => a.ov - b.ov || a.maxStep - b.maxStep);
for (const r of results.filter(r => r.ov <= +(process.env.MAXOV ?? 1e9)).sort((a, b) => a.maxStep - b.maxStep || a.ov - b.ov).slice(0, 12)) console.log(r.lc, r.fc, 'max', r.maxStep, 'ov', r.ov, '|', r.steps);
