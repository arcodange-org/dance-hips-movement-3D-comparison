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
  assert.deepEqual(names, ['huit', 'huitRond', 'huitInverse', 'huitAmple', 'huitGrand', 'genoux', 'genouxQuart', 'genouxRond']);
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

// 2. #167 (on main): every setting continues the phase from the figure danced before, except after an ida e
// volta, which gives its own phase (the figure then starts settled, with and without the figure before).
{
  const dz = api.GUIDE_PAIR_DZ, ZERO = { leader: { x: 0, z: 0 }, follower: { x: 0, z: 0 } };
  let poses = 0, changed = 0;
  let unchanged = 0;
  for (const [kind, previous] of [['avance', 'avance'], ['sortieG', 'recule'], ['quart', 'sortieG'], ['sortieF', 'quart'], ['avance', 'ida']]) for (const follower of [false, true]) {
    const f = follower ? fixture(api, { rotation: Math.PI, offset: [0, 0, dz] }) : fixture(api, { offset: [0, 0, -dz] });
    const at = (beat, ginga, before) => {
      api.applyPose(f.r, f.model, beat, { ...api.guidePoseOptions({ movement: api.GUIDE_FIGURES[kind].movement, rootOffset: ZERO, kind, ginga, previous: before }, follower), placement: 'quinconce', contraposition: 1, styleKey: 'kizomba', amp: 1 });
      return [...f.r.pelvis.position.toArray(), f.r.pelvis.rotation.x, f.r.pelvis.rotation.y, f.r.pelvis.rotation.z, f.r.root.position.y];
    };
    for (let beat = 0; beat <= 2; beat += 0.125) {
      for (const ginga of ['marque', api.GUIDE_GINGA_DEFAULT, 'huitRond']) {
        const a = at(beat, ginga, previous), b = at(beat, ginga, null), differs = a.some((v, k) => Math.abs(v - b[k]) > 1e-6);
        if (previous === 'ida') assert.ok(!differs, `${ginga} ${kind} after the ida e volta starts settled at ${beat}`);
        else if (differs) changed++; else unchanged++;
      }
      poses++;
    }
  }
  assert.ok(changed > 0, 'every setting continues the phase of the figure danced before');
  console.log(`PASS la phase se poursuit d'une figure à la suivante, réglages calibrés et prototypes (${changed} poses différentes sur ${changed + unchanged}) ; après un ida e volta la figure démarre posée (${poses} temps contrôlés)`);
}

// 3. The measure shown in the election: surface each hip goes around in the three views, longest stop.
{
  const trace = (...args) => JSON.parse(execFileSync('node', [fileURLToPath(new URL('./tracer_hanches.mjs', import.meta.url)), '', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const sudden = {}, measure = (ginga, role = 'suiveur') => { const t = trace(ginga, role); sudden[ginga] = t.transfert.soudain; return t.mesures; };
  // Today: the default setting (`ample` since #163). The film's: `marque`, the size of the prototypes B, C, D.
  const today = measure(api.GUIDE_GINGA_DEFAULT), film = measure('marque'), round = measure('huitRond'), other = measure('huitInverse'), large = measure('huitAmple'), larger = measure('huitGrand'), angular = measure('huit');
  for (const hip of ['L', 'R']) {
    for (const [name, m] of [[api.GUIDE_GINGA_DEFAULT, today], ['marque', film]])
      assert.ok(m[hip].dessus < 0.1, `${name}: a hip goes and returns on a line seen from above (${m[hip].dessus} cm²)`);
    for (const [name, m] of [['huit', angular], ['huitRond', round], ['huitInverse', other], ['huitAmple', large], ['huitGrand', larger]])
      for (const view of ['dessus', 'face', 'profil']) assert.ok(m[hip][view] > 0.5, `${name}: hip ${hip} goes round seen from ${view} (${m[hip][view]} cm²)`);
    assert.ok(round[hip].dessus > 3 && large[hip].dessus > 2 * round[hip].dessus && larger[hip].dessus > 1.5 * large[hip].dessus, `sizes seen from above: ${round[hip].dessus} < ${large[hip].dessus} < ${larger[hip].dessus} cm²`);
    assert.ok(Math.abs(other[hip].dessus - round[hip].dessus) < 0.2 * round[hip].dessus, 'the other sense has the same size');
  }
  // Since #172 (main) the phase is averaged over half a beat: the angular « 8 » (B) is the round one (C).
  assert.ok(angular.L.dessus === round.L.dessus && angular.C.arret === round.C.arret, 'B and C are now the same path');
  assert.ok(today.C.arret > 0.05 && film.C.arret > today.C.arret && round.C.arret < 0.05 && other.C.arret < 0.05 && large.C.arret < 0.05 && larger.C.arret < 0.05,
    `stops: ${film.C.arret} (marque), ${today.C.arret} (${api.GUIDE_GINGA_DEFAULT}) → ${angular.C.arret}, ${round.C.arret}`);
  // The kompa alone (#161): today a line with a long stop on each side; the prototypes go round, the largest
  // « 8 » of the styles, and never stop. The model of today is untouched unless a prototype is chosen.
  const kompa = name => { const t = trace(name, 'seul', 'base', 'kompa'); sudden['kompa ' + name] = t.transfert.soudain; return t.mesures; };
  assert.equal(api.KOMPA_PROTO.eight, null, 'no kompa prototype by default');
  assert.deepEqual(Object.keys(api.KOMPA_EIGHTS), ['huit', 'huitGrand', 'huitInverse', 'genoux', 'genouxRond', 'hanches', 'hanchesFortes', 'profil', 'profilFort']);
  const k0 = kompa('aujourdhui'), k1 = kompa('huit'), k2 = kompa('huitGrand'), k3 = kompa('huitInverse');
  assert.ok(k0.C.profondeur < 0.5 && k0.L.dessus < 2 && k0.C.arret > 0.4, `kompa today: a line (${k0.C.profondeur} cm deep, ${k0.L.dessus} cm², stop ${k0.C.arret})`);
  for (const [name, m] of [['huit', k1], ['huitGrand', k2], ['huitInverse', k3]]) assert.ok(m.L.dessus > 50 && m.R.dessus > 50 && m.C.arret < 0.05 && Math.abs(m.C.largeur - k0.C.largeur) < 1, `kompa ${name}: ${m.L.dessus} cm², stop ${m.C.arret}, ${m.C.largeur} cm wide`);
  assert.ok(k2.L.dessus > 1.5 * k1.L.dessus && Math.abs(k3.L.dessus - k1.L.dessus) < 0.1 * k1.L.dessus, 'kompa: sizes and senses');
  assert.ok(k1.L.dessus > 2 * large.L.dessus, 'the kompa prototype is the largest « 8 »');
  // Rule R34 (22 Nov.): no sudden relay between left and right. The passage from one side to the other,
  // against a pendulum of the same width and period (1), in a session of the game. Since #172 (main) every
  // setting of the couple crosses like a pendulum; only the kompa alone of today still crosses suddenly.
  const today_ = api.GUIDE_GINGA_DEFAULT;
  for (const name of [today_, 'marque', 'huit', 'huitRond', 'huitInverse', 'huitAmple', 'huitGrand', 'kompa huit', 'kompa huitGrand', 'kompa huitInverse'])
    assert.ok(sudden[name] < 1.2, `${name}: a passage as gradual as a pendulum (${sudden[name]})`);
  assert.ok(sudden['kompa aujourdhui'] > 3, `kompa today crosses suddenly (${sudden['kompa aujourdhui']})`);
  console.log(`PASS passage d'un côté à l'autre, rapporté à un balancier (1) : ${sudden[today_]} aujourd'hui en couple, ${sudden.huitRond} avec les « 8 » ; kompa seul ${sudden['kompa aujourdhui']} aujourd'hui, ${sudden['kompa huit']} avec ses prototypes`);
  // Vote of 22 Nov. (sense D, size F, the knees lead): the knees bend in turn, the pelvis never stops and its
  // acceleration is lower than with today's walk and with the pelvis-led F; seen from the front each hip goes
  // round more the later the knees bend; `genoux` keeps both knees bent alike as the pelvis passes the centre.
  // (In the walk the steps themselves bend the knees from 20° to 45°: the share of the cycle where the knees
  // move in opposite senses does not tell the variants apart, it is not asserted here.)
  const fluid = name => trace(name, 'suiveur').fluidite, led = name => trace(name, 'suiveur');
  const [fToday, fF] = [fluid(today_), fluid('huitGrand')];
  for (const name of ['genoux', 'genouxQuart', 'genouxRond']) {
    const t = led(name);
    assert.ok(t.fluidite.arretPart === 0 && t.fluidite.acceleration99 < fToday.acceleration99 && t.fluidite.acceleration99 < fF.acceleration99,
      `${name}: never still, smoother (${t.fluidite.acceleration99} m/s² against ${fToday.acceleration99} today and ${fF.acceleration99} for F)`);
  }
  const g0 = led('genoux'), g2 = led('genouxRond');
  assert.ok(g0.genoux.auCentre.every(([l, r]) => Math.abs(l - r) < 2), `genoux: both knees bent alike at the centre (${JSON.stringify(g0.genoux.auCentre)})`);
  assert.ok(g2.mesures.L.face > 2 * g0.mesures.L.face, `genouxRond: each hip goes round seen from the front (${g2.mesures.L.face} cm²)`);
  const kg = trace('genouxRond', 'seul', 'base', 'kompa');
  assert.ok(kg.fluidite.arretPart === 0 && kg.mesures.L.face > 10, `kompa genouxRond: never still, hips round seen from the front (${kg.mesures.L.face} cm²)`);
  // Fourth round (vote: still « skiing », the 8 seen from the front must be larger than from above): less glide.
  for (const name of ['hanches', 'hanchesFortes']) {
    const k = trace(name, 'seul', 'base', 'kompa');
    assert.ok(k.fluidite.arretPart === 0 && k.mesures.L.face > 1.5 * k.mesures.L.dessus && k.mesures.R.face > 1.5 * k.mesures.R.dessus,
      `kompa ${name}: the 8 seen from the front larger than from above (${k.mesures.L.face} against ${k.mesures.L.dessus} cm²)`);
  }
  // Fifth round (vote for KG3: the « 8 » seen from the side, less knee, the buttocks back, the chest isolated).
  const kh = trace('hanches', 'seul', 'base', 'kompa');
  for (const name of ['profil', 'profilFort']) {
    const k = trace(name, 'seul', 'base', 'kompa');
    assert.ok(k.fluidite.arretPart === 0 && k.mesures.L.profil > 10 * kh.mesures.L.profil && k.mesures.R.profil > 10 * kh.mesures.R.profil,
      `kompa ${name}: an « 8 » seen from the side (${k.mesures.L.profil} against ${kh.mesures.L.profil} cm²)`);
    assert.ok(k.mesures.L.face > 40, `kompa ${name}: the « 8 » seen from the front is kept (${k.mesures.L.face} cm²)`);
    assert.ok(k.buste.largeur < 2 && k.buste.profondeur < 2 && kh.buste.largeur > 10, `kompa ${name}: the chest stays in place (${k.buste.largeur} cm sideways against ${kh.buste.largeur})`);
    assert.ok(k.genoux.gauche[1] < kh.genoux.gauche[1] - 10, `kompa ${name}: the knees bend less (${k.genoux.gauche[1]}° against ${kh.genoux.gauche[1]}°)`);
  }
  console.log(`PASS genoux qui mènent (vote du 22 novembre) : jamais à l'arrêt, accélération du bassin ${led('genouxQuart').fluidite.acceleration99} m/s² (${fToday.acceleration99} aujourd'hui, ${fF.acceleration99} pour F) ; de face ${g0.mesures.L.face} à ${g2.mesures.L.face} cm² ; kompa ${kg.mesures.L.face} cm²`);
  console.log(`PASS kompa seul : aujourd'hui une ligne (${k0.C.profondeur} cm d'avant en arrière, arrêt de ${k0.C.arret} temps) ; prototypes : ${k1.L.dessus} et ${k2.L.dessus} cm² entourés vu de dessus, aucun arrêt`);
  console.log(`PASS mesure du « 8 » (suiveuse, marche) : vu de dessus chaque hanche entoure ${today.L.dessus} cm² aujourd'hui (réglage ${api.GUIDE_GINGA_DEFAULT} ; ${film.L.dessus} avec marque, la taille du film), ${angular.L.dessus} (anguleux), ${round.L.dessus} (arrondi), ${large.L.dessus} (ample), ${larger.L.dessus} (très ample) ; arrêt le plus long du bassin ${film.C.arret} (marque), ${today.C.arret} (${api.GUIDE_GINGA_DEFAULT}) → ${round.C.arret} temps`);
}
