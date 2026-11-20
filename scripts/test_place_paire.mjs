// #61 (docs/spec-sur-place-paire.md): pair on the spot in the neutral quinconce, on the real GLB.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-place-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'placePaire']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const dz = api.PLACE_PAIR_DZ;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const options = (i, extra) => ({ embrace: true, placePaire: true, follower: !!i, ...extra });

// Without placePaire the historical pair pose is unchanged (opt-in).
{
  const [a, b] = [fixture(api, {}), fixture(api, {})];
  api.applyPose(a.r, a.model, 1.3, { embrace: true, styleKey: 'kizomba' });
  api.applyPose(b.r, b.model, 1.3, { embrace: true, styleKey: 'kizomba', placePaire: false });
  assert.ok(world(a, 'footL').distanceTo(world(b, 'footL')) < 1e-12);
}

// Neutral quinconce: each right foot between the partner's feet; feet planted all along.
{
  const pair = couple();
  pair.forEach((f, i) => api.applyPose(f.r, f.model, 0, options(i, { placement: 'quinconce', styleKey: 'kizomba', amp: 1 })));
  const [lead, part] = pair.map(f => ({ L: world(f, 'footL'), R: world(f, 'footR') }));
  assert(lead.R.x > part.L.x && lead.R.x < part.R.x, "leader D between the partner's feet");
  assert(part.R.x > lead.R.x && part.R.x < lead.L.x, "partner D between the leader's feet");
  for (const styleKey of Object.keys(api.STYLES)) for (let beat = 0; beat < 4; beat += .25) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i, { placement: 'quinconce', styleKey, amp: 1 })));
    const now = pair.map(f => ({ L: world(f, 'footL'), R: world(f, 'footR') }));
    for (const role of [0, 1]) for (const side of ['L', 'R'])
      assert(now[role][side].distanceTo([lead, part][role][side]) < 1e-6, `${styleKey} ${beat}: planted feet`);
  }
  console.log('PASS sur place en paire : quinconce neutre, pieds plantés, opt-in');
}

// Leg bones: no crossing between partners nor within a dancer (six styles, four amplitudes,
// quinconce and reference, with and without the plexus contact the app enables).
let poses = 0;
for (const config of [{ placement: 'quinconce' }, { placement: 'reference' }, { placement: 'quinconce', plexus: true, contraposition: 1 }])
  for (const styleKey of Object.keys(api.STYLES)) for (const amp of [.5, 1, 1.5, 2]) {
    const pair = couple();
    for (let beat = 0; beat < 4; beat += .1) {
      pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i, { styleKey, amp, ...config })));
      const meshes = pair.map(f => Object.fromEntries(['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(n => ['L', 'R'].map(s => n + '_' + s)).map(n => [n, transformedMesh(f.r[n])])));
      const names = Object.keys(meshes[0]);
      for (const a of names) for (const b of names)
        assert(!meshIntersection(meshes[0][a], meshes[1][b]), JSON.stringify({ ...config, styleKey, amp, beat, leader: a, partner: b }));
      for (const [role, own] of meshes.entries()) for (const a of names.filter(n => n.endsWith('_L'))) for (const b of names.filter(n => n.endsWith('_R')))
        assert(!meshIntersection(own[a], own[b]), JSON.stringify({ ...config, styleKey, amp, beat, role, left: a, right: b }));
      poses++;
    }
  }
console.log('PASS', poses, 'poses de couple sur place : aucun croisement des os des jambes');

// Tarraxinha (owner): the hip's forward intention leads (pelvis yaw), the returning hip opens to its
// side (lateral shift in quadrature); roll stays secondary.
{
  const f = fixture(api, {});
  let yaw = 0, roll = 0, side = 0;
  for (let beat = 0; beat < 2; beat += .05) {
    api.applyPose(f.r, f.model, beat, { styleKey: 'tarraxinha', amp: 1 });
    yaw = Math.max(yaw, Math.abs(f.r.pelvis.rotation.y)); roll = Math.max(roll, Math.abs(f.r.pelvis.rotation.z));
    side = Math.max(side, Math.abs(f.r.pelvis.position.x));
  }
  assert(yaw > 2 * roll, `tarraxinha: yaw leads roll (${yaw.toFixed(3)} vs ${roll.toFixed(3)})`);
  assert(side >= .025, `tarraxinha: the returning hip opens to its side (${side.toFixed(3)} m)`);
  console.log(`PASS tarraxinha : lacet ${yaw.toFixed(2)} rad > roulis ${roll.toFixed(2)} rad, ouverture latérale ${(side * 100).toFixed(1)} cm`);
}
