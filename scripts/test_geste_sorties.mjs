// #213, #214 (rule R45, docs/spec-sorties-geste.md): in both sorties the hip carries the step, as elected for the « 1 2 »
// (the hip first). Real GLB, kizomba, amplitude 1, the couple in quinconce: in every step of the sortie garçon (two
// variants) and of the sortie fille (two variants) that carries the weight, the pelvis is half-way at most 0.1 beat after the foot, and the foot
// has done at most 5 % of its way when the pelvis has done a tenth of its own (window opened 0.3 beat before the foot
// leaves, closed 0.15 after it lands: `geste_hanche_mesure.mjs`). The former timing (`?geste=ancien`) fails it.
// What is NOT checked here: the choreography itself, which the owner judges on film.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import { gestureSteps, gestureFigures } from "./geste_hanche_mesure.mjs";
const bundle = new URL("./.test-geste-sorties-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'sortieGarcon', 'sortieFille', 'gesteHanche']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

assert.equal(api.FIGURE_GESTURE_ELECTED, 'hancheDabord');
assert.equal(api.FIGURE_GESTURE.v, api.FIGURE_GESTURES.hancheDabord, 'the hip first by default');
api.setFigureGesture('inconnu'); assert.equal(api.FIGURE_GESTURE.v, api.FIGURE_GESTURES.hancheDabord, 'an unknown name gives the elected one');

const figures = gestureFigures(api).filter(f => /^sortie/.test(f.name));
assert.equal(figures.length, 4);
// The steps that carry the weight (actions 1 to 4); the marka (action 5) only touches the floor, without weight.
const measure = () => figures.flatMap(f => gestureSteps(api, f, { before: 0.3, after: 0.15 })).filter(r => r.decalage_temps !== undefined && r.temps[0] < 4);
const elected = measure();
assert.ok(elected.length >= 25, `every carried step is measured (${elected.length})`);
let worstLag = -Infinity, worstFoot = -Infinity;
for (const r of elected) {
  const tag = `${r.figure}, ${r.danseur} ${r.pied} (${r.temps.join(' → ')})`;
  assert.ok(r.decalage_temps <= 0.1, `${tag}: the pelvis is half-way ${r.decalage_temps} beat after the foot`);
  assert.ok(r.piedQuandLeBassinPart <= 0.05, `${tag}: the foot has done ${r.piedQuandLeBassinPart * 100} % of its way when the pelvis leaves`);
  worstLag = Math.max(worstLag, r.decalage_temps); worstFoot = Math.max(worstFoot, r.piedQuandLeBassinPart);
}
api.setFigureGesture('ancien');
const former = measure().filter(r => r.decalage_temps > 0.1 || r.piedQuandLeBassinPart > 0.05);
assert.ok(former.length >= 8, `the former timing is the step, then the hip (${former.length} such steps)`);
api.setFigureGesture(null);
console.log(`PASS sorties : la hanche porte le pas (R45) dans ${elected.length} pas ; bassin à mi-chemin au plus ${worstLag} temps après le pied, pied à ${Math.round(worstFoot * 100)} % au plus quand le bassin part (avec l'ancien geste : ${former.length} pas « pied puis hanche »)`);
