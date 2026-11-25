// #75 — the owner's quantified rules measured at their own thresholds, separately from the regression
// guards: R4 (plexus contact with contraposition, 6 cm), R8 (steps of about one foot length, 21.2 cm,
// and one hip width, 34 cm) and R21 (#62: each weight arrival on a beat of the music, within 0.05 beat). A known gap is reported, not failed; a figure that gets further from a rule
// than its recorded value fails (ratchet, scripts/fixtures/ecarts-regles.json; WRITE=1 records the
// current values after a deliberate change). Rules without a number (R2, R3) are not measured here.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-ecarts-regles-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const RULES = { R4: 6, R8: { long: 21.2, side: 34 }, R21: 0.05 };
const FIGURES = {
  'sortie garçon': { options: { movement: 'sortieG' }, beats: 5, kind: 'sortieG' },
  'sortie fille, crochet': { options: { movement: 'sortieF', sortieFilleVariant: 'hook' }, beats: 5, kind: 'sortieF' },
  'sortie fille, recul': { options: { movement: 'sortieF', sortieFilleVariant: 'back' }, beats: 5, kind: 'sortieF' },
  'quart de tour': { options: { movement: 'quarts', quarts: true, quartsPaire: true }, beats: 4, kind: 'quarts' },
  'ida e volta': { options: { movement: 'ida', ida: true, idaPaire: true }, beats: 8, kind: 'ida' },
};
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
// The couple's half-spacing, shared by the pair figures (#203).
const couple = () => [fixture(api, { offset: [0, 0, -api.COUPLE_DZ] }), fixture(api, { rotation: Math.PI, offset: [0, 0, api.COUPLE_DZ] })];
const app = { placement: 'quinconce', amp: 1, embrace: true };
const cm = v => Math.round(v * 1000) / 10;

const measured = {};
for (const [name, { options, beats, kind }] of Object.entries(FIGURES)) {
  // R4: chest markers, the app's default pair view (quinconce, plexus contact, contraposition), every
  // style offering the figure.
  let plexus = 0;
  for (const styleKey of Object.keys(api.STYLES).filter(k => api.movementAllowed(k, kind))) {
    const pair = couple();
    for (let b = 0; b <= beats + 1e-9; b += 0.125) {
      pair.forEach((f, i) => api.applyPose(f.r, f.model, b, { ...options, ...app, styleKey, follower: !!i, plexus: true, contraposition: 1 }));
      plexus = Math.max(plexus, world(pair[0], 'contactChest').distanceTo(world(pair[1], 'contactChest')));
    }
  }
  // R8: each foot's net step between consecutive whole beats (both dancers stand on the beat), in the
  // dancer's own frame at the start (the follower faces the leader); kizomba, the reference style.
  const pair = couple(), steps = { leader: { long: 0, side: 0 }, follower: { long: 0, side: 0 } };
  let previous = null;
  for (let b = 0; b <= beats; b++) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, b, { ...options, ...app, styleKey: 'kizomba', follower: !!i }));
    const now = pair.map(f => ({ L: world(f, 'footL'), R: world(f, 'footR') }));
    if (previous) for (const [i, role] of [[0, 'leader'], [1, 'follower']]) for (const side of ['L', 'R']) {
      const d = now[i][side].clone().sub(previous[i][side]), sign = i ? -1 : 1;
      if (Math.hypot(d.x, d.z) < 0.01) continue;
      steps[role].long = Math.max(steps[role].long, Math.abs(d.z * sign));
      steps[role].side = Math.max(steps[role].side, Math.abs(d.x * sign));
    }
    previous = now;
  }
  // R21: instants the weight arrives on a foot (load ≥ 0.995 after the other foot carried it), both roles,
  // kizomba; the largest distance to the nearest beat.
  let offBeat = 0;
  for (const [i] of [[0], [1]]) {
    const f = pair[i]; let carried = null;
    for (let k = 0; k <= beats * 200; k++) {
      const b = k / 200, st = api.applyPose(f.r, f.model, b, { ...options, ...app, styleKey: 'kizomba', follower: !!i });
      const side = st.loadR >= 0.995 ? 'R' : st.loadL >= 0.995 ? 'L' : null;
      if (side && carried && side !== carried) offBeat = Math.max(offBeat, Math.abs(b - Math.round(b)));
      if (side) carried = side;
    }
  }
  measured[name] = { R21: Math.round(offBeat * 1000) / 1000, R4: cm(plexus), R8: Object.fromEntries(Object.entries(steps).map(([r, s]) => [r, { long: cm(s.long), side: cm(s.side) }])) };
}

// R21 on the spot, style by style (solo, planted feet, as the app's default).
const onTheSpot = {};
{
  const f = fixture(api, {});
  for (const styleKey of Object.keys(api.STYLES)) {
    let carried = null, offBeat = 0;
    for (let k = 0; k <= 8 * 200; k++) {
      const b = k / 200, st = api.applyPose(f.r, f.model, b, { movement: 'none', plant: true, styleKey, amp: 1 });
      const side = st.loadR >= 0.995 ? 'R' : st.loadL >= 0.995 ? 'L' : null;
      if (side && carried && side !== carried) offBeat = Math.max(offBeat, Math.abs(b - Math.round(b)));
      if (side) carried = side;
    }
    onTheSpot[styleKey] = Math.round(offBeat * 1000) / 1000;
  }
}
measured['sur place (R21)'] = onTheSpot;

const path = new URL('./fixtures/ecarts-regles.json', import.meta.url);
if (process.env.WRITE) { writeFileSync(path, JSON.stringify(measured, null, 2) + '\n'); console.log('written', path.pathname); }
const recorded = JSON.parse(readFileSync(path, 'utf8'));
const mark = (value, limit) => value <= limit ? 'respectée' : `écart ${(value - limit).toFixed(1)} cm`;
console.log(`Règles chiffrées (amplitude 1, quinconce) — R4 plexus ≤ ${RULES.R4} cm ; R8 pas ≤ ${RULES.R8.long} cm en longueur, ≤ ${RULES.R8.side} cm en largeur ; R21 poids sur le temps à ${RULES.R21} temps près`);
for (const [name, m] of Object.entries(measured)) {
  const r = recorded[name];
  if (name === 'sur place (R21)') {
    for (const [style, v] of Object.entries(m)) assert(v <= Math.max(r?.[style] ?? 0, RULES.R21) + 0.01, `sur place ${style}: R21 ${v} beat off, further than recorded`);
    console.log(`  ${'sur place'.padEnd(22)} R21 ${Object.entries(m).map(([st, v]) => `${st} ${v}`).join(', ')} temps du temps (${Object.values(m).every(v => v <= RULES.R21) ? 'respectée' : 'écarts'})`);
    continue;
  }
  assert(r, `${name}: recorded in scripts/fixtures/ecarts-regles.json (WRITE=1)`);
  // Ratchet: never further from the rule than recorded (half a centimetre of numerical slack).
  assert(m.R4 <= Math.max(r.R4, RULES.R4) + 0.5, `${name}: R4 ${m.R4} cm, further from the rule than recorded (${r.R4} cm)`);
  if (r.R21 !== undefined) assert(m.R21 <= Math.max(r.R21, RULES.R21) + 0.01, `${name}: R21 ${m.R21} beat off, further from the beat than recorded (${r.R21})`);
  for (const role of ['leader', 'follower']) for (const axis of ['long', 'side'])
    assert(m.R8[role][axis] <= Math.max(r.R8[role][axis], RULES.R8[axis]) + 0.5, `${name}: R8 ${role} ${axis} ${m.R8[role][axis]} cm, further from the rule than recorded (${r.R8[role][axis]} cm)`);
  const steps = ['leader', 'follower'].map(role => `${role === 'leader' ? 'leader' : 'suiveur'} ${m.R8[role].long}/${m.R8[role].side} cm (${mark(m.R8[role].long, RULES.R8.long)}${m.R8[role].side > RULES.R8.side ? ', largeur ' + mark(m.R8[role].side, RULES.R8.side) : ''})`).join(' ; ');
  const r21 = m.R21 <= RULES.R21 ? 'respectée' : `écart ${(m.R21 - RULES.R21).toFixed(2)} temps`;
  console.log(`  ${name.padEnd(22)} R4 ${String(m.R4).padStart(5)} cm (${mark(m.R4, RULES.R4)}) ; R8 ${steps} ; R21 poids à ${m.R21} temps du temps (${r21})`);
}
console.log('PASS écarts aux règles chiffrées : mesurés, affichés, jamais plus loin de la règle qu’enregistré');
