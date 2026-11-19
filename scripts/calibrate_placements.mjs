#!/usr/bin/env node
// Calibration sweep for docs/spec-placements-couple.md: first leg-bone crossing or sole overlap
// for a placement offset, until the relative arrival. Not part of npm test.
// Usage: [AMPS=.5,1] node scripts/calibrate_placements.mjs <x> <z1> [z2 ...]
import { buildSync } from "esbuild"; import { unlinkSync } from "node:fs";
import { fixture } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL(`./.search-bundle-${process.pid}.mjs`, import.meta.url);
buildSync({ stdin: { contents: ['pose','anatomy','styles','rigJoints','sortieGarcon','sortieFille','placement'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname }, bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname, define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const bones = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(n => ['L', 'R'].map(s => n + '_' + s));
const [x, ...zs] = process.argv.slice(2).map(Number);
for (const z of zs) {
  const placement = { x, z }; let found = null;
  outer: for (const [movement, until, variants, key] of [['sortieG', 2, ['line'], 'sortieVariant'], ['sortieF', 3, ['hook', 'back'], 'sortieFilleVariant']])
  for (const variant of variants) for (const styleKey of Object.keys(api.STYLES)) for (const amp of (process.env.AMPS ?? ".5,1,2").split(",").map(Number)) {
    const pair = [fixture(api, { offset: [0, 0, -.2] }), fixture(api, { rotation: Math.PI, offset: [0, 0, .2] })];
    for (let k = 0; k <= until * 10; k++) {
      const beat = k / 10;
      pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, { movement, embrace: true, follower: !!i, styleKey, amp, placement, [key]: variant }));
      const m = pair.map(f => Object.fromEntries(bones.map(n => [n, transformedMesh(f.r[n])])));
      for (const a of bones) for (const b of bones) if (meshIntersection(m[0][a], m[1][b])) { found = { movement, variant, styleKey, amp, beat, a, b }; break outer; }
      const polys = pair.flatMap(f => ['L','R'].map(s => footHull(f.model.legs[s].sole.map(p => p.clone().applyMatrix4(f.r['foot'+s].matrixWorld)))));
      for (const [i,j] of [[0,2],[0,3],[1,2],[1,3]]) if (footHullsOverlap(polys[i], polys[j])) { found = { movement, variant, styleKey, amp, beat, feet: [i,j] }; break outer; }
    }
  }
  console.log(JSON.stringify(placement), found ? 'COLLISION ' + JSON.stringify(found) : 'clear');
}
