// #159 — prototypes of the « 8 » of the hips (docs/spec-ginga-huit.md), on the real GLB. What is checked:
// the prototypes stay apart from the calibrated settings, the calibrated settings are not changed by the
// prototypes' machinery, and the measure the election shows (scripts/tracer_hanches.mjs) says what the
// spec says: today each hip goes and returns on a line seen from above, a prototype goes round in the
// three views and the pelvis no longer stops. The prototypes are NOT checked for bone crossings here.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { execFileSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-ginga-huit-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'insertion', 'guidage'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname, define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

// 1. Prototypes apart: named, not offered by default, built on a calibrated size.
{
  const names = Object.keys(api.GUIDE_EIGHT);
  assert.deepEqual(names, ['huit', 'huitRond', 'huitInverse', 'huitAmple']);
  for (const name of names) {
    assert.ok(!(name in api.GUIDE_GINGA), `${name} is not a calibrated setting`);
    assert.ok(api.guideGingaOf(name).eight, `${name} carries its « 8 »`);
  }
  for (const name of Object.keys(api.GUIDE_GINGA)) assert.equal(api.guideGingaOf(name), api.GUIDE_GINGA[name]);
  assert.ok(!(api.GUIDE_GINGA_DEFAULT in api.GUIDE_EIGHT), 'the default setting is a calibrated one');
  assert.deepEqual([api.GUIDE_EIGHT.huitRond.sway, api.GUIDE_EIGHT.huitRond.bounce], [api.GUIDE_GINGA.marque.sway, api.GUIDE_GINGA.marque.bounce]);
  assert.deepEqual([api.GUIDE_EIGHT.huitAmple.sway, api.GUIDE_EIGHT.huitAmple.bounce], [api.GUIDE_GINGA.ample.sway, api.GUIDE_GINGA.ample.bounce]);
  console.log(`PASS prototypes du « 8 » (${names.join(', ')}) à part des réglages calibrés ; réglage par défaut inchangé (${api.GUIDE_GINGA_DEFAULT})`);
}

// 2. The calibrated settings do not use the figure danced before: same pose with and without it.
{
  const dz = api.GUIDE_PAIR_DZ, ZERO = { leader: { x: 0, z: 0 }, follower: { x: 0, z: 0 } };
  let poses = 0, changed = 0;
  for (const [kind, previous] of [['avance', 'avance'], ['sortieG', 'recule'], ['quart', 'sortieG'], ['sortieF', 'quart']]) for (const follower of [false, true]) {
    const f = follower ? fixture(api, { rotation: Math.PI, offset: [0, 0, dz] }) : fixture(api, { offset: [0, 0, -dz] });
    const at = (beat, ginga, before) => {
      api.applyPose(f.r, f.model, beat, { ...api.guidePoseOptions({ movement: api.GUIDE_FIGURES[kind].movement, rootOffset: ZERO, kind, ginga, previous: before }, follower), placement: 'quinconce', contraposition: 1, styleKey: 'kizomba', amp: 1 });
      return [...f.r.pelvis.position.toArray(), f.r.pelvis.rotation.x, f.r.pelvis.rotation.y, f.r.pelvis.rotation.z, f.r.root.position.y];
    };
    for (let beat = 0; beat <= 2; beat += 0.125) {
      assert.deepEqual(at(beat, 'marque', previous), at(beat, 'marque', null), `marque ${kind} after ${previous} at ${beat}`);
      const a = at(beat, 'huitRond', previous), b = at(beat, 'huitRond', null);
      if (a.some((v, k) => Math.abs(v - b[k]) > 1e-6)) changed++;
      poses++;
    }
  }
  assert.ok(changed > 0, 'the prototypes continue the phase of the figure danced before');
  console.log(`PASS réglage calibré indifférent à la figure précédente (${poses} poses identiques) ; les prototypes poursuivent la phase de la figure précédente (${changed} poses différentes)`);
}

// 3. The measure shown in the election: surface each hip goes around in the three views, longest stop.
{
  const measure = (ginga, role = 'suiveur') => JSON.parse(execFileSync('node', [fileURLToPath(new URL('./tracer_hanches.mjs', import.meta.url)), '', ginga, role], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).mesures;
  const today = measure('marque'), round = measure('huitRond'), other = measure('huitInverse'), large = measure('huitAmple'), angular = measure('huit');
  for (const hip of ['L', 'R']) {
    assert.ok(today[hip].dessus < 0.1, `today a hip goes and returns on a line seen from above (${today[hip].dessus} cm²)`);
    for (const [name, m] of [['huit', angular], ['huitRond', round], ['huitInverse', other], ['huitAmple', large]])
      for (const view of ['dessus', 'face', 'profil']) assert.ok(m[hip][view] > 0.5, `${name}: hip ${hip} goes round seen from ${view} (${m[hip][view]} cm²)`);
    assert.ok(round[hip].dessus > 3 && large[hip].dessus > 2 * round[hip].dessus, `sizes seen from above: ${round[hip].dessus} < ${large[hip].dessus} cm²`);
    assert.ok(Math.abs(other[hip].dessus - round[hip].dessus) < 0.2 * round[hip].dessus, 'the other sense has the same size');
  }
  assert.ok(today.C.arret > 0.1 && round.C.arret < 0.05 && other.C.arret < 0.05 && large.C.arret < 0.05 && angular.C.arret < today.C.arret, `stops: ${today.C.arret} → ${angular.C.arret}, ${round.C.arret}`);
  console.log(`PASS mesure du « 8 » (suiveuse, marche) : vu de dessus chaque hanche entoure ${today.L.dessus} cm² aujourd'hui, ${angular.L.dessus} (anguleux), ${round.L.dessus} (arrondi), ${large.L.dessus} (ample) ; arrêt le plus long du bassin ${today.C.arret} → ${round.C.arret} temps`);
}
