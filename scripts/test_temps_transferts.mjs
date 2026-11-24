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
// beat), and the transfer half-way between beats. Kompa has its own rhythms (below), and so has the semba
// danced alone (its elected step, #162, below); in pair the semba keeps one transfer per beat.
const styles = Object.keys(api.STYLES).filter(k => k !== 'kompa');
for (const styleKey of styles) for (const pair of [false, true]) {
  if ((styleKey === 'semba' || styleKey === 'kizomba') && !pair) continue;
  const f = fixture(api, {});
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey, amp: 1, ...(pair ? { embrace: true, placePaire: true, placement: 'quinconce' } : {}) }).loadR;
  for (let k = 0; k < 4; k++) {
    const on = load(k), next = load(k + 1), half = load(k + 0.5);
    assert(Math.abs(on - 0.5) > 0.5 * Math.abs(api.STYLES[styleKey].support(0.5)) - 1e-6, `${styleKey}${pair ? ' (paire)' : ''}: full support on beat ${k} (${on.toFixed(3)})`);
    assert(Math.sign(on - 0.5) === -Math.sign(next - 0.5), `${styleKey}: alternating feet on beats ${k}, ${k + 1}`);
    assert(Math.abs(half - 0.5) < 1e-6, `${styleKey}: the transfer crosses half-way between beats (${half.toFixed(3)} at ${k + 0.5})`);
  }
}
console.log(`PASS temps et transferts : sur place (solo et paire ; la kizomba et le semba en paire seulement), poids sur chaque temps pour ${styles.join(', ')}`);

// Kompa. Alone, on the spot (#195, rule R40 of 24 Nov. 2026: one beat per support, not two): the weight is
// whole on a foot on every beat, the left on the odd beats, the right on the even ones, and it stays there
// for most of the beat (the transfer takes the 0.2 beat before the beat). In pair the kompa keeps the two
// beats per support of #62 (step 1, touch 2, step 3, touch 4) until #187: the weight lands on 1 and 3 and is
// held through the touches on 2 and 4.
{
  const f = fixture(api, {});
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey: 'kompa', amp: 1 }).loadR;
  for (const k of [1, 3, 5, 7]) assert(load(k) < 1e-6, `kompa alone: left foot full on beat ${k} (${load(k)})`);
  for (const k of [2, 4, 6, 8]) assert(load(k) > 1 - 1e-6, `kompa alone: right foot full on beat ${k} (${load(k)})`);
  for (const k of [1, 3, 5, 7]) for (const d of [0.2, 0.5, 0.75]) assert(load(k + d) < 1e-6 && load(k + 1 + d) > 1 - 1e-6, `kompa alone: the weight is held after beat ${k} (+${d})`);
  let transfers = 0, prev = load(0);
  for (let b = 0.05; b <= 8; b += 0.05) { const l = load(b); if ((l - 0.5) * (prev - 0.5) < 0) transfers++; prev = l; }
  assert.equal(transfers, 8, `kompa alone: one transfer per beat (${transfers} in 8 beats)`);
  // The step as voted on 23 Nov. (`?kompa=deuxTemps`) and the model of before the votes: two beats per support.
  for (const name of ['deuxTemps', 'ancien']) {
    api.setKompaProto(name);
    for (const k of [1, 2, 5, 6]) assert(load(k) < 1e-6, `kompa ${name}: left foot full on beat ${k} (${load(k)})`);
    for (const k of [3, 4, 7, 8]) assert(load(k) > 1 - 1e-6, `kompa ${name}: right foot full on beat ${k} (${load(k)})`);
  }
  api.setKompaProto(null);
}
{
  const f = fixture(api, {});
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey: 'kompa', amp: 1, embrace: true, placePaire: true, placement: 'quinconce' }).loadR;
  for (const k of [1, 2, 5, 6]) assert(load(k) < 1e-6, `kompa in pair: left foot full on beat ${k} (${load(k)})`);
  for (const k of [3, 4, 7, 8]) assert(load(k) > 1 - 1e-6, `kompa in pair: right foot full on beat ${k} (${load(k)})`);
  let transfers = 0, prev = load(0);
  for (let b = 0.05; b <= 8; b += 0.05) { const l = load(b); if ((l - 0.5) * (prev - 0.5) < 0) transfers++; prev = l; }
  assert.equal(transfers, 4, `kompa in pair: one transfer every two beats (${transfers} in 8 beats)`);
}
console.log('PASS temps et transferts : kompa seul, un appui par temps (gauche sur les temps impairs) ; en paire, pas sur 1 et 3, touche sur 2 et 4');

// Semba alone (#162, the step elected on 23 Nov. 2026: two landings in a row on each foot, the double
// bounce): the weight is whole on a foot on every beat, the same foot twice, then the other; one transfer
// every two beats; between its two landings the weight does not leave the foot of the bounce.
{
  const f = fixture(api, {});
  // #196: alone the semba's basic step is the « 1 2 » (below); its step on the spot is the figure « Sur place ».
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey: 'semba', amp: 1, movement: 'surPlace' }).loadR;
  for (const k of [1, 2, 5, 6]) assert(load(k) < 1e-6, `semba alone: left foot full on beat ${k} (${load(k)})`);
  for (const k of [3, 4, 7, 8]) assert(load(k) > 1 - 1e-6, `semba alone: right foot full on beat ${k} (${load(k)})`);
  let transfers = 0, prev = load(0);
  for (let b = 0.05; b <= 8; b += 0.05) { const l = load(b); if ((l - 0.5) * (prev - 0.5) < 0) transfers++; prev = l; }
  assert.equal(transfers, 4, `semba alone: one transfer every two beats (${transfers} in 8 beats)`);
  for (let b = 1; b <= 2; b += 0.05) assert(load(b) < 0.3, `semba alone: inside the double bounce the weight stays on the left foot (${load(b).toFixed(2)} at ${b.toFixed(2)})`);
  const pairLoad = beat => api.applyPose(f.r, f.model, beat, { styleKey: 'semba', amp: 1, embrace: true, placePaire: true, placement: 'quinconce' }).loadR;
  assert(Math.sign(pairLoad(1) - 0.5) === -Math.sign(pairLoad(2) - 0.5), 'semba in pair: one transfer per beat, as before');
}
console.log('PASS temps et transferts : semba seul, deux arrivées sur chaque pied (double rebond), poids sur chaque temps');

// #196 (rule R42): alone, the kizomba and the semba dance the « 1 2 »: the weight lands on the leg that stepped aside
// on 1 (the clock's beat 0) and again on 2, then on the other on 3 and 4; it is whole on a foot on every beat. The
// kizomba's step on the spot (the figure « Sur place ») keeps one transfer per beat.
for (const styleKey of ['kizomba', 'semba']) {
  const f = fixture(api, {});
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey, amp: 1 }).loadR;
  for (const k of [0, 1, 4, 5]) assert(load(k) < 1e-6, `${styleKey} « 1 2 »: left foot full on the clock's beat ${k} (${load(k)})`);
  for (const k of [2, 3, 6, 7]) assert(load(k) > 1 - 1e-6, `${styleKey} « 1 2 »: right foot full on the clock's beat ${k} (${load(k)})`);
}
{
  const f = fixture(api, {});
  const load = beat => api.applyPose(f.r, f.model, beat, { styleKey: 'kizomba', amp: 1, movement: 'surPlace' }).loadR;
  for (let k = 0; k < 4; k++) assert(Math.sign(load(k) - 0.5) === -Math.sign(load(k + 1) - 0.5) && Math.abs(load(k + 0.5) - 0.5) < 1e-6, `kizomba « Sur place »: one transfer per beat (${k})`);
}
console.log('PASS temps et transferts : kizomba et semba seuls, le « 1 2 » (gauche aux comptes 1 et 2, droite aux comptes 3 et 4) ; « Sur place », comme avant');

// Owner (20 Nov.): « on peut laisser le style konpa faire uniquement le sur place et le avant / arrière
// (pas de marka en konpa) » : kompa offers on the spot and ida e volta only; the other styles everything.
for (const m of ['none', 'ida']) assert(api.movementAllowed('kompa', m), `kompa: ${m} offered`);
for (const m of ['temps3', 'corridinho', 'quarts', 'sortieG', 'sortieF', 'sortieGF']) assert(!api.movementAllowed('kompa', m), `kompa: no ${m}`);
for (const k of ['tarraxinha', 'zouk']) for (const m of ['quarts', 'sortieG', 'sortieF', 'temps3']) assert(!api.movementAllowed(k, m), `${k}: no ${m} (like kompa)`);
for (const k of ['kizomba', 'semba', 'suave']) assert(api.movementAllowed(k, 'sortieF'), `${k}: every movement`);
console.log('PASS kompa, tarraxinha, zouk : sur place et ida e volta seulement, sans marka');

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
