#!/usr/bin/env node
// Couple placements of the five-action figures (docs/spec-placements-couple.md, issue #28).
// Placement-specific checks here, then the complete sortie garçon / fille runners are replayed
// for each placement (TEST_PLACEMENT), on the real GLB.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, snapshot } from "./pose_fixture.mjs";
const bundle = new URL("./.test-placements-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'sortieGarcon', 'sortieFille', 'placement', 'share']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const near = (a, b, tolerance = 1e-9, message = '') => assert.ok(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance,
  `${message} ${a} != ${b} (tol ${tolerance})`);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());

// Parsing, amplitude fade and defensive offsets.
assert.equal(api.placementOf('face'), 'face');
for (const value of ['quinconce', 'unknown', '', null, undefined]) assert.equal(api.placementOf(value), 'quinconce');
assert.equal(api.DEFAULT_PLACEMENT, 'quinconce');
for (const [amp, scale] of [[0, 1], [.5, 1], [1, 1], [1.5, .5], [2, 0], [3, 0], [NaN, 0]]) near(api.placementScale(amp), scale, 1e-12, `scale(${amp})`);
assert.deepEqual(api.placementOffset('reference', 1), { x: 0, z: 0, stagger: 0 });
assert.deepEqual(api.placementOffset({ x: NaN, z: .1 }), { x: 0, z: 0, stagger: 0 });
near(api.placementOffset('quinconce', 1.5).z, api.PLACEMENT_OFFSETS.quinconce.z / 2, 1e-12);
near(api.placementOffset('quinconce', 1.5).x, api.PLACEMENT_OFFSETS.quinconce.x, 1e-12); // lateral fades last
near(api.placementOffset('quinconce', 1.75).x, api.PLACEMENT_OFFSETS.quinconce.x / 2, 1e-12);
const shared = new URL(api.buildShareUrl('https://example.test/', { mode: 'pair', sortieF: true, placement: 'face' }, null, null));
assert.equal(api.placementOf(shared.searchParams.get('placement')), 'face');
console.log('PASS placements: parsing, share parameter and amplitude fade');

const figures = [
  // arrival: the D/D relative arrival; identical: first beat where every foot is validated
  // (in the sortie fille the follower's free G keeps its shift until its crossing lands).
  { movement: 'sortieG', key: 'sortieVariant', variants: ['line', 'right'], dz: api.SORTIE_GARCON_PAIR_DZ, arrival: 2, identical: 2 },
  { movement: 'sortieF', key: 'sortieFilleVariant', variants: ['hook', 'back'], dz: api.SORTIE_FILLE_PAIR_DZ, arrival: 3, identical: 4 },
];
const couple = dz => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
let compared = 0;
for (const figure of figures) for (const variant of figure.variants) for (const placement of ['quinconce', 'face']) {
  const pair = couple(figure.dz), reference = couple(figure.dz);
  const pose = (fixtures, beat, role, extra) => api.applyPose(fixtures[role].r, fixtures[role].model, beat,
    { movement: figure.movement, embrace: true, follower: role === 1, [figure.key]: variant, ...extra });
  // Start: each dancer shifted by o in their own frame (the right foot by `stagger / 2` more);
  // relative ankle offset 2o; couple centred. Both starts share the neutral stance (feet under hips).
  const o = api.placementOffset(placement, 1);
  for (const role of [0, 1]) {
    pose(pair, 0, role, { placement }); pose(reference, 0, role, { placement: 'reference' });
    const sign = role ? -1 : 1;
    for (const side of ['L', 'R']) {
      const shifted = world(pair[role], 'foot' + side), validated = world(reference[role], 'foot' + side);
      near(shifted.x - validated.x, sign * o.x, 1e-9, `${figure.movement} ${placement} start x`);
      near(shifted.z - validated.z, sign * (o.z + (side === 'R' ? (o.stagger ?? 0) / 2 : 0)), 1e-9, `${figure.movement} ${placement} start z`);
    }
  }
  if (placement === 'quinconce') {
    const [lead, part] = pair.map(f => ({ L: world(f, 'footL'), R: world(f, 'footR') }));
    // World +x is the leader's left; the partner faces him, so her right foot has the larger x.
    assert(lead.R.x > part.L.x && lead.R.x < part.R.x, 'leader D between the partner\'s feet');
    assert(part.R.x > lead.R.x && part.R.x < lead.L.x, 'partner D between the leader\'s feet');
  }
  // At the relative arrival, the D/D ankles and both pelvis roots are the validated ones.
  for (const amp of [.5, 1]) for (const role of [0, 1]) {
    pose(pair, figure.arrival, role, { placement, amp }); pose(reference, figure.arrival, role, { placement: 'reference', amp });
    for (const name of ['footR', 'root']) {
      const a = world(pair[role], name), b = world(reference[role], name);
      near(a.x, b.x, 1e-9, `${figure.movement} ${placement} arrival ${name}.x`); near(a.z, b.z, 1e-9, `${figure.movement} ${placement} arrival ${name}.z`);
    }
  }
  // Once every foot has landed on a validated target, the figure is the validated one.
  for (const amp of [.5, 1]) for (let tick = figure.identical * 20; tick <= 100; tick++) for (const role of [0, 1]) {
    pose(pair, tick / 20, role, { placement, amp }); pose(reference, tick / 20, role, { placement: 'reference', amp });
    const a = snapshot(pair[role].r), b = snapshot(reference[role].r);
    a.forEach((v, n) => near(v, b[n], 1e-9, `${figure.movement}/${variant}/${placement} amp ${amp} beat ${tick / 20} role ${role}`));
    compared++;
  }
  // Amplitude 2: no approach at all.
  for (let tick = 0; tick <= 50; tick++) for (const role of [0, 1]) {
    pose(pair, tick / 10, role, { placement, amp: 2 }); pose(reference, tick / 10, role, { placement: 'reference', amp: 2 });
    const a = snapshot(pair[role].r), b = snapshot(reference[role].r);
    a.forEach((v, n) => near(v, b[n], 1e-9, `${figure.movement}/${variant}/${placement} amp 2 beat ${tick / 10}`));
    compared++;
  }
}
console.log(`PASS placements: shifted start, validated D/D arrival, validated poses once all feet landed and at amplitude 2 (${compared} poses)`);

// The follower's shifted landings in the sortie fille keep the validated step amplitudes.
const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
for (const variant of ['hook', 'back']) for (const placement of ['quinconce', 'face']) {
  const o = api.placementOffset(placement, 1);
  // D1 lands on its validated target (frees the leader's knee); G2 keeps its amplitude.
  for (const [beat, side] of [[2, 'L']]) {
    const shifted = api.sampleSortieFille(beat, true, rest, variant, o).feet[side];
    const validated = api.sampleSortieFille(beat, true, rest, variant, 'reference').feet[side];
    near(shifted.x - validated.x, o.x, 1e-12, `follower ${side} amplitude x`);
    near(shifted.z - validated.z, o.z, 1e-12, `follower ${side} amplitude z`);
  }
}
console.log('PASS placements: shifted landings keep their amplitude');

// Full sortie runners replayed for each placement (directions, GLB poses, supports, continuity,
// foot hulls, thigh proximity, leg-bone triangles across six styles and three amplitudes).
for (const placement of ['quinconce', 'face']) for (const runner of ['test_sortie_garcon.mjs', 'test_sortie_fille.mjs']) {
  const result = spawnSync(process.execPath, ['scripts/' + runner], {
    cwd: new URL('../', import.meta.url).pathname, encoding: 'utf8',
    env: { ...process.env, TEST_PLACEMENT: placement }, timeout: 900000,
  });
  assert.equal(result.signal, null, `${runner} (${placement}) timed out`);
  assert.equal(result.status, 0, `${runner} (${placement}) failed:\n${result.stdout}\n${result.stderr}`);
  console.log(`PASS placements: ${runner} replayed with placement=${placement}`);
}
