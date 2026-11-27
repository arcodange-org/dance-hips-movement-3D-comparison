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
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'idaPaire', 'sortieGarcon', 'sortieFille']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());

// Largest chest-marker distance accepted with contraposition (m): regression guards of the measured
// state. Only the upper body leans (PLEXUS.pelvisPull 0), and only a little in a close couple (owner,
// 20 Nov.: the permanent lean and the contraposition looked like sumo wrestlers): in the sorties the
// couple opens and the chests stay apart (#51, #67: the figures' distances are still too large).
const cases = [
  ['sortieG line', api.SORTIE_GARCON_PAIR_DZ, 5, { movement: 'sortieG', sortieVariant: 'line' }, .37],
  ['sortieG right', api.SORTIE_GARCON_PAIR_DZ, 5, { movement: 'sortieG', sortieVariant: 'right' }, .37],
  // #203: with the knees bent the couple stands 8 cm further apart. In the app's quinconce the chests keep their
  // contact; the reference spacing (tests only, feet facing feet) keeps the pelvises 48 cm apart, and the trunk, at
  // its largest lean, leaves the chests 13 to 16 cm apart (guards only).
  ['quarts paire', api.QUARTS_PAIR_DZ, 16, { movement: 'quarts', quarts: true, quartsPaire: true }, { quinconce: .11, reference: .16 }],
  // #54: the couple travels as a block (pelvises together): the plexus contact holds in quinconce
  // (owner's indicator, 6 cm). The reference spacing keeps the pelvises apart (guard only).
  ['ida paire', api.IDA_PAIR_DZ, 8, { movement: 'ida', ida: true, idaPaire: true }, { quinconce: .06, reference: .145 }],
  ['sortieF hook', api.SORTIE_FILLE_PAIR_DZ, 5, { movement: 'sortieF', sortieFilleVariant: 'hook' }, .41],
  ['sortieF back', api.SORTIE_FILLE_PAIR_DZ, 5, { movement: 'sortieF', sortieFilleVariant: 'back' }, .41],
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
for (const placement of ['quinconce', 'reference']) for (const [label, dz, beats, options, limits] of cases) {
  const limit = typeof limits === 'number' ? limits : limits[placement];
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

// Owner (20 Nov.): « la contraposition et l'inclinaison vers l'avant en permanence ont été mal
// interprétées (on dirait des lutteurs de sumo) ». Dancers, not wrestlers: with the plexus contact the
// trunk leans at most 8° from the vertical (style posture included) and the chest turns at most 18°
// against the pelvis, in every pair figure (six styles but kompa, which dances neither sorties nor
// quarts; quinconce and reference).
// #223 (R46: above the navel the trunk stays still, the hips turn under it): the 18° now bound the contraposition, the
// chest against the figure's heading (the root); in the ida e volta the chest keeps facing the partner while the hips
// turn up to 9° away, 22° from them (`IDA_FACING`). Against the pelvis the chest is now as far as the style turns the
// hips under it (tarraxinha, zouk: 24°): bounded at 25°. Before #223 the chest followed the hips, up to 24.7° from the
// figure's heading.
{
  const vertical = new THREE.Vector3(0, 1, 0);
  const yawOf = q => new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
  let lean = 0, twist = 0, contra = 0, where = '', twistWhere = '', contraWhere = '';
  for (const placement of ['quinconce', 'reference']) for (const [label, dz, beats, options] of cases)
    for (const styleKey of Object.keys(api.STYLES).filter(k => k !== 'kompa')) {
      const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
      for (let beat = 0; beat <= beats + 1e-9; beat += .25) {
        pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, { ...options, embrace: true, follower: !!i, placement, styleKey, amp: 1, plexus: true, contraposition: 1 }));
        for (const f of pair) {
          // #223: from where the pelvis would be under the unbent spine (the waist takes up the hips' sway).
          const trunk = world(f, 'head').sub(api.trunkFoot(f.r)).angleTo(vertical);
          const chestYaw = yawOf(f.r.chest.getWorldQuaternion(new THREE.Quaternion())), angle = d => Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
          const t = angle(chestYaw - yawOf(f.r.pelvis.getWorldQuaternion(new THREE.Quaternion())));
          const c = angle(chestYaw - yawOf(f.r.root.getWorldQuaternion(new THREE.Quaternion()))), cap = label.startsWith('ida') ? 23 : 18;
          if (c * 180 / Math.PI / cap > contra) { contra = c * 180 / Math.PI / cap; contraWhere = `${(c * 180 / Math.PI).toFixed(1)}° (${label} ${placement} ${styleKey} ${beat})`; }
          if (trunk > lean) { lean = trunk; where = `${label} ${placement} ${styleKey} ${beat}`; }
          if (t > twist) { twist = t; twistWhere = `${label} ${placement} ${styleKey} ${beat} ${f === pair[1] ? 'suiveuse' : 'guideur'}`; }
        }
      }
    }
  assert(lean <= 8 * Math.PI / 180, `trunk lean ${(lean * 180 / Math.PI).toFixed(1)}° (${where})`);
  assert(contra <= 1, `contraposition: the chest turns ${contraWhere} from the figure's heading (18°, ida e volta 23°)`);
  assert(twist <= 25 * Math.PI / 180, `chest twist ${(twist * 180 / Math.PI).toFixed(1)}° against the pelvis (${twistWhere})`);
  console.log(`PASS danseurs, pas lutteurs : tronc au plus ${(lean * 180 / Math.PI).toFixed(1)}° de la verticale, contraposition au plus ${contraWhere}, `
    + `buste au plus ${(twist * 180 / Math.PI).toFixed(1)}° contre le bassin qui tourne dessous (#223)`);
}

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

