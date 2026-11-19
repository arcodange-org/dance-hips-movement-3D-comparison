// #51 (docs/spec-marche-naturelle.md, criterion 4): plexus-to-plexus contact in the pair figures.
// The contraposition variant is the owner's indicator of the right distance: the chest markers of the
// two dancers stay together during the whole figure. The variant without contraposition is reported.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-plexus-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'sortieGarcon', 'sortieFille']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());

// Largest chest-marker distance accepted with contraposition (m): regression guards of the measured
// state. Only the upper body leans (PLEXUS.pelvisPull 0): pulling the pelvises or lowering the couple
// together crosses the partners' leg bones. In the sorties the couple stays too far apart for the
// chests to meet: the indicator says the figures' distances are still too large (#51).
const cases = [
  ['sortieG line', api.SORTIE_GARCON_PAIR_DZ, 5, { movement: 'sortieG', sortieVariant: 'line' }, .18],
  ['sortieG right', api.SORTIE_GARCON_PAIR_DZ, 5, { movement: 'sortieG', sortieVariant: 'right' }, .18],
  ['quarts paire', api.QUARTS_PAIR_DZ, 16, { movement: 'quarts', quarts: true, quartsPaire: true }, .11],
  ['sortieF hook', api.SORTIE_FILLE_PAIR_DZ, 5, { movement: 'sortieF', sortieFilleVariant: 'hook' }, .22],
  ['sortieF back', api.SORTIE_FILLE_PAIR_DZ, 5, { movement: 'sortieF', sortieFilleVariant: 'back' }, .22],
];
const distances = (dz, beats, options, extra) => {
  const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
  const rows = [];
  for (let beat = 0; beat <= beats + 1e-9; beat += .125) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, { ...options, embrace: true, follower: !!i, ...extra }));
    rows.push(world(pair[0], 'contactChest').distanceTo(world(pair[1], 'contactChest')));
  }
  return rows;
};
for (const placement of ['quinconce', 'reference']) for (const [label, dz, beats, options, limit] of cases) {
  for (const styleKey of ['kizomba', 'kompa']) {
    const contra = distances(dz, beats, options, { placement, styleKey, amp: 1, plexus: true, contraposition: 1 });
    const free = distances(dz, beats, options, { placement, styleKey, amp: 1, plexus: true, contraposition: 0 });
    const off = distances(dz, beats, options, { placement, styleKey, amp: 1 });
    const max = rows => Math.max(...rows);
    contra.forEach(d => assert.ok(Number.isFinite(d)));
    assert(max(contra) <= limit, `${label} ${placement} ${styleKey}: plexus contact with contraposition (${max(contra).toFixed(3)} > ${limit})`);
    // The lean only closes the gap: never further apart than without the plexus option.
    assert(max(contra) <= max(off) + 1e-9, `${label} ${placement} ${styleKey}: plexus option brings the chests closer`);
    console.log(`${label.padEnd(13)} ${placement.padEnd(9)} ${styleKey.padEnd(7)} chest markers max: contraposition ${(max(contra) * 100).toFixed(1)} cm,`,
      `without ${(max(free) * 100).toFixed(1)} cm, plexus off ${(max(off) * 100).toFixed(1)} cm`);
  }
}
console.log('PASS plexus-to-plexus lean with contraposition (measured state guarded)');

// The app enables the plexus contact whenever a placement is set: the figure runners (GLB poses,
// supports, foot hulls, thigh contacts, leg-bone triangles across six styles and three
// amplitudes) are replayed with it, in the default quinconce placement.
for (const runner of ['test_sortie_garcon.mjs', 'test_sortie_fille.mjs', 'test_quarts_paire.mjs']) {
  const result = spawnSync(process.execPath, ['scripts/' + runner], {
    cwd: new URL('../', import.meta.url).pathname, encoding: 'utf8',
    env: { ...process.env, TEST_PLACEMENT: 'quinconce', TEST_PLEXUS: '1' }, timeout: 1800000,
  });
  assert.equal(result.status, 0, `${runner} (plexus, quinconce) failed:\n${result.stdout}\n${result.stderr}`);
  console.log(`PASS plexus: ${runner} replayed with the plexus contact (quinconce)`);
}

