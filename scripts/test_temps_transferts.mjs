// #62 (R21): « les beats correspondent aux transferts de poids des danseurs ». The music plays its beats
// on the clock's integer beats (src/music/scheduler.ts); the weight must arrive there.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-temps-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'placePaire', 'sortieGarcon', 'sortieFille']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

// On the spot, solo and in pair: full weight on a foot on each beat, alternating feet (one transfer per
// beat), and the transfer half-way between beats. Kompa has its own rhythm (below).
const styles = Object.keys(api.STYLES).filter(k => k !== 'kompa');
for (const styleKey of styles) for (const pair of [false, true]) {
  const f = fixture(api, {});
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey, amp: 1, ...(pair ? { embrace: true, placePaire: true, placement: 'quinconce' } : {}) }).loadR;
  for (let k = 0; k < 4; k++) {
    const on = load(k), next = load(k + 1), half = load(k + 0.5);
    assert(Math.abs(on - 0.5) > 0.5 * Math.abs(api.STYLES[styleKey].support(0.5)) - 1e-6, `${styleKey}${pair ? ' (paire)' : ''}: full support on beat ${k} (${on.toFixed(3)})`);
    assert(Math.sign(on - 0.5) === -Math.sign(next - 0.5), `${styleKey}: alternating feet on beats ${k}, ${k + 1}`);
    assert(Math.abs(half - 0.5) < 1e-6, `${styleKey}: the transfer crosses half-way between beats (${half.toFixed(3)} at ${k + 0.5})`);
  }
}
console.log(`PASS temps et transferts : sur place (solo et paire), poids sur chaque temps pour ${styles.join(', ')}`);

// Kompa (docs/musique/kompa.md: step 1, touch 2, step 3, touch 4): one transfer every two beats, the
// weight landing on 1 and 3 and held through the touches on 2 and 4.
for (const pair of [false, true]) {
  const f = fixture(api, {});
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey: 'kompa', amp: 1, ...(pair ? { embrace: true, placePaire: true, placement: 'quinconce' } : {}) }).loadR;
  for (const k of [1, 2, 5, 6]) assert(load(k) < 1e-6, `kompa: left foot full on beat ${k} (${load(k)})`);
  for (const k of [3, 4, 7, 8]) assert(load(k) > 1 - 1e-6, `kompa: right foot full on beat ${k} (${load(k)})`);
  let transfers = 0, prev = load(0);
  for (let b = 0.05; b <= 8; b += 0.05) { const l = load(b); if ((l - 0.5) * (prev - 0.5) < 0) transfers++; prev = l; }
  assert.equal(transfers, 4, `kompa: one transfer every two beats (${transfers} in 8 beats)`);
}
console.log('PASS temps et transferts : kompa, pas sur 1 et 3, touche sur 2 et 4');

// Owner (20 Nov.): « on peut laisser le style konpa faire uniquement le sur place et le avant / arrière
// (pas de marka en konpa) » : kompa offers on the spot and ida e volta only; the other styles everything.
for (const m of ['none', 'ida']) assert(api.movementAllowed('kompa', m), `kompa: ${m} offered`);
for (const m of ['temps3', 'corridinho', 'quarts', 'sortieG', 'sortieF', 'sortieGF']) assert(!api.movementAllowed('kompa', m), `kompa: no ${m}`);
for (const k of Object.keys(api.STYLES).filter(k => k !== 'kompa')) assert(api.movementAllowed(k, 'sortieF'), `${k}: every movement`);
console.log('PASS kompa : sur place et ida e volta seulement, sans marka');

// The five-action figures already land each transfer on a whole beat (audit 20 Nov.): kept.
{
  const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
  for (const [label, sample] of [['sortie garçon', (b, fl) => api.sampleSortieGarcon(b, fl, rest)], ['sortie fille', (b, fl) => api.sampleSortieFille(b, fl, rest)]])
    for (const follower of [false, true]) for (let k = 1; k <= 4; k++) {
      const l = sample(k, follower).loadR;
      assert(l < 1e-6 || l > 1 - 1e-6, `${label}: full support on beat ${k} (${l})`);
    }
  console.log('PASS temps et transferts : sorties garçon et fille, appui plein sur chaque temps');
}
