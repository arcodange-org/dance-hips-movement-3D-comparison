// #51 (docs/spec-marche-naturelle.md, criterion 4): plexus-to-plexus contact in the pair figures.
// The contraposition variant is the owner's indicator of the right distance: the chest markers of the
// two dancers stay together during the whole figure. The variant without contraposition is reported.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-plexus-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'sortieGarcon', 'sortieFille']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());

// Largest chest-marker distance accepted with contraposition (m). The sortie fille is a regression
// guard only: at action 2 her G2 opens 55 cm aside, and at action 4 her feet stand 55 cm apart (D
// still at the D/D contact, G crossed back) so her pelvis drops and her chest is lower than his.
// Closing that gap changes the figure's choreography (owner decision, docs/spec-marche-naturelle.md).
const cases = [
  ['sortieG line', api.SORTIE_GARCON_PAIR_DZ, 5, { movement: 'sortieG', sortieVariant: 'line' }, .075],
  ['sortieG right', api.SORTIE_GARCON_PAIR_DZ, 5, { movement: 'sortieG', sortieVariant: 'right' }, .075],
  ['quarts paire', api.QUARTS_PAIR_DZ, 16, { movement: 'quarts', quarts: true, quartsPaire: true }, .06],
  ['sortieF hook', api.SORTIE_FILLE_PAIR_DZ, 5, { movement: 'sortieF', sortieFilleVariant: 'hook' }, .17],
  ['sortieF back', api.SORTIE_FILLE_PAIR_DZ, 5, { movement: 'sortieF', sortieFilleVariant: 'back' }, .17],
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
console.log('PASS plexus-to-plexus contact with contraposition (sorties garçon, quarts de tour en paire; sortie fille guarded)');
