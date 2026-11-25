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
  // The elected step is the basic step when the address asks for nothing; `ancien` is the model of before.
  assert.equal(api.KOMPA_PROTO.eight, undefined, 'no kompa variant asked for by default');
  assert.equal(api.KOMPA_ELECTED, 'assisBuste');
  // #195 (rule R40, 24 Nov. 2026): the basic step is the elected one read twice as fast, one beat per support;
  // `deuxTemps` is the step as voted. Same knees, same hips' path but for the 8 mm hip accent of the touch,
  // which goes with the touch; the pose at the clock's beat c is the voted pose at 2c − 1.
  { const elected = trace('assisBuste', 'seul', 'base', 'kompa'), voted = trace('deuxTemps', 'seul', 'base', 'kompa'), plain = trace('aujourdhui', 'seul', 'base', 'kompa');
    assert.equal(api.KOMPA_BEATS, 1);
    assert.deepEqual(voted.mesures, elected.mesures, 'kompa: `deuxTemps` is the elected step as voted');
    assert.equal(voted.transfert.periode, 4); assert.equal(plain.transfert.periode, 2, 'kompa: one beat per support, a side-to-side cycle in two beats');
    // The same poses, sampled at other instants: the extremes agree to a tenth of a degree (#203: the knee floor is
    // reached smoothly, the extremes are no longer the floor itself).
    [plain.genoux.gauche, plain.genoux.droit].flat().forEach((v, i) => assert.ok(Math.abs(v - [elected.genoux.gauche, elected.genoux.droit].flat()[i]) < 0.1,
      `kompa: the knees keep their range (${JSON.stringify([plain.genoux, elected.genoux])})`));
    for (const hip of ['L', 'R']) for (const view of ['dessus', 'face', 'profil'])
      assert.ok(Math.abs(plain.mesures[hip][view] - elected.mesures[hip][view]) < 0.05 * elected.mesures[hip][view], `kompa: hip ${hip} keeps its path seen from ${view} (${plain.mesures[hip][view]} against ${elected.mesures[hip][view]} cm²)`);
    assert.ok(Math.abs(plain.posture.inclinaison[1] - elected.posture.inclinaison[1]) < 0.1 && Math.abs(plain.buste.largeur - elected.buste.largeur) < 1, `kompa: the bust keeps its lean and its sway (${JSON.stringify(plain.buste)})`);
    assert.ok(plain.fluidite.arretPart === 0 && plain.fluidite.acceleration99 < 5 && plain.transfert.soudain < 1.1, `kompa: smooth at one beat per support (${JSON.stringify(plain.fluidite)}, ${plain.transfert.soudain})`);
    const f = fixture(api, {}), joints = ['pelvis', 'spine', 'chest', 'head', 'hipL', 'hipR', 'kneeL', 'kneeR', 'footL', 'footR'];
    const pose = (beat, name) => { api.setKompaProto(name); api.applyPose(f.r, f.model, beat, { styleKey: 'kompa', amp: 1 }); f.r.root.updateWorldMatrix(true, true); return joints.map(j => f.r[j].getWorldPosition(f.r[j].position.clone())); };
    let worst = 0, same = 0, count = 0;
    for (let c = 1; c < 5; c += 1 / 16) {
      const fast = pose(c, null), slow = pose(2 * c - 1, 'deuxTemps'), gap = Math.max(...fast.map((p, i) => p.distanceTo(slow[i])));
      worst = Math.max(worst, gap); count++; if (gap < 1e-9) same++;
    }
    api.setKompaProto(null);
    assert.ok(worst < 0.0085, `kompa: the poses are the voted ones but for the hip accent of the touch (${(worst * 1000).toFixed(1)} mm)`);
    assert.ok(same / count > 0.7, `kompa: most poses are exactly the voted ones (${same} of ${count})`);
    console.log(`PASS kompa, un appui par temps (#195) : poses du pas voté lues deux fois plus vite (écart maximal ${(worst * 1000).toFixed(1)} mm, l'accent de hanche de la touche), genoux ${plain.genoux.gauche.join('° à ')}°, accélération du bassin ${plain.fluidite.acceleration99} m/s² (${voted.fluidite.acceleration99} à deux temps par appui)`); }
  assert.deepEqual(Object.keys(api.KOMPA_EIGHTS), ['huit', 'huitGrand', 'huitInverse', 'genoux', 'genouxRond', 'hanches', 'hanchesFortes', 'profil', 'profilFort', 'alterne', 'alterneTalon', 'alterneDirect', 'hancheFinit', 'hancheTenue', 'hancheAssise', 'hancheApres', 'assis', 'assisMarque', 'assisBuste', 'assisBusteAvant']);
  const k0 = kompa('ancien'), k1 = kompa('huit'), k2 = kompa('huitGrand'), k3 = kompa('huitInverse');
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
  assert.ok(sudden['kompa ancien'] > 3, `kompa today crosses suddenly (${sudden['kompa ancien']})`);
  console.log(`PASS passage d'un côté à l'autre, rapporté à un balancier (1) : ${sudden[today_]} aujourd'hui en couple, ${sudden.huitRond} avec les « 8 » ; kompa seul ${sudden['kompa ancien']} aujourd'hui, ${sudden['kompa huit']} avec ses prototypes`);
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
  // #203: with the knees never under 30° the hips rise less in the knee-led prototypes (2.4 → 1.5 cm for `genoux`), and
  // the roundness seen from the front shrinks with them (17.1 → 9.3 cm² for `genouxRond`, 6.3 for `genoux`).
  assert.ok(g2.mesures.L.face > 1.4 * g0.mesures.L.face, `genouxRond: each hip goes round seen from the front (${g2.mesures.L.face} cm² against ${g0.mesures.L.face})`);
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
  // Sixth round (vote for KG3 again: the legs must visibly alternate, one bent, one straighter). Measured: in
  // `hanches` the supporting leg is the more bent of the two most of the time, both knees past 60°.
  assert.ok(kh.genoux.appuiPlusPlie > 0.5 && kh.genoux.gauche[0] > 55 && kh.genoux.ecart < 20, `kompa hanches: both legs bent, the supporting one more (${JSON.stringify(kh.genoux)})`);
  const straighter = api.KNEE_FLOOR_ELECTED + 6;
  for (const name of ['alterne', 'alterneTalon', 'alterneDirect']) {
    const k = trace(name, 'seul', 'base', 'kompa'), g = k.genoux;
    // #203 (R43, 24 Nov.: no leg ever straight; the alternation of these rounds was there to show the movement): the
    // straighter leg now stays at the minimum flexion, 30°.
    assert.ok(g.gauche[0] < straighter && g.droit[0] < straighter && g.gauche[1] > 45 && g.droit[1] > 45 && g.ecart > 15, `kompa ${name}: one leg at the minimum flexion, the other bent (${JSON.stringify(g)})`);
    assert.ok(g.gauche[0] > api.KNEE_FLOOR_ELECTED - 1 && g.droit[0] > api.KNEE_FLOOR_ELECTED - 1, `kompa ${name}: the straighter leg keeps the minimum flexion (${g.gauche[0]}°)`);
    assert.ok(g.appuiPlusPlie <= (name === 'alterneDirect' ? 0.01 : 0.25), `kompa ${name}: the supporting leg is the straighter one (${g.appuiPlusPlie})`);
    assert.ok(k.fluidite.arretPart === 0 && k.fluidite.acceleration99 < kh.fluidite.acceleration99, `kompa ${name}: never still, no harsher than hanches (${k.fluidite.acceleration99} m/s²)`);
    if (name !== 'alterneDirect') assert.ok(k.mesures.L.face > 1.2 * k.mesures.L.dessus && k.mesures.R.face > 1.2 * k.mesures.R.dessus, `kompa ${name}: the « 8 » seen from the front stays larger than from above (${k.mesures.L.face} against ${k.mesures.L.dessus} cm²)`);
  }
  // Seventh round (vote: none; the free heel lifted, but less; the attack of `alterneDirect`, the return of
  // `hanches`: the hip finishes the transfer and does not start it). The three keep the alternation.
  for (const name of ['hancheFinit', 'hancheTenue', 'hancheAssise', 'hancheApres']) {
    const k = trace(name, 'seul', 'base', 'kompa'), g = k.genoux;
    assert.ok(g.gauche[0] < straighter && g.gauche[0] > api.KNEE_FLOOR_ELECTED - 1 && g.gauche[1] > 45 && g.ecart > 15, `kompa ${name}: one leg at the minimum flexion, the other bent (${JSON.stringify(g)})`);
    assert.ok(g.appuiPlusPlie <= (name === 'hancheFinit' ? 0.2 : 0.01), `kompa ${name}: the supporting leg is the straighter one (${g.appuiPlusPlie})`);
    assert.ok(k.fluidite.arretPart === 0 && k.fluidite.acceleration99 < kh.fluidite.acceleration99, `kompa ${name}: never still (${k.fluidite.acceleration99} m/s²)`);
    // The hip that waits then arrives with the weight goes round seen from the front; the two others stay
    // close to the line of `alterneDirect`.
    if (name === 'hancheFinit') assert.ok(k.mesures.L.face > k.mesures.L.dessus && k.mesures.R.face > k.mesures.R.dessus, `kompa ${name}: the « 8 » seen from the front larger than from above (${k.mesures.L.face} against ${k.mesures.L.dessus} cm²)`);
    else assert.ok(k.mesures.L.face > 2 && k.mesures.L.face < 15, `kompa ${name}: a narrow loop seen from the front (${k.mesures.L.face} cm²)`);
  }
  // Eighth round (vote: `hancheApres` for its flow; the hip must sit as the weight lands on the beat, back and
  // outwards with a slight pivot of the pelvis under a chest that keeps facing front, then rise slowly and round;
  // the free heel lower still). The supporting leg is then the bent one as it receives the weight.
  for (const name of ['assis', 'assisMarque']) {
    const k = trace(name, 'seul', 'base', 'kompa'), g = k.genoux;
    // #203: the less bent leg at the minimum flexion (30°).
    assert.ok(g.gauche[0] < api.KNEE_FLOOR_ELECTED + 6 && g.gauche[1] > 40 && g.ecart > 15, `kompa ${name}: the legs still alternate (${JSON.stringify(g)})`);
    assert.ok(g.appuiPlusPlie > 0.5, `kompa ${name}: the supporting leg sits (${g.appuiPlusPlie})`);
    assert.ok(k.fluidite.arretPart === 0 && k.fluidite.acceleration99 < kh.fluidite.acceleration99, `kompa ${name}: never still (${JSON.stringify(k.fluidite)})`);
    assert.ok(k.buste.largeur < 2 && k.buste.profondeur < 3, `kompa ${name}: the chest stays above the feet (${JSON.stringify(k.buste)})`);
    assert.ok(k.mesures.L.face > k.mesures.L.dessus && k.mesures.L.profil > 5, `kompa ${name}: round seen from the front and from the side (${k.mesures.L.face}, ${k.mesures.L.profil} cm²)`);
  }
  // Ninth round (vote: `assisMarque`; the bust may follow the pelvis, sideways and by a few degrees of pivot,
  // upright; and it leans slightly forward: seen from the side the knees do not pass the bust, rule R33).
  const km = trace('assisMarque', 'seul', 'base', 'kompa');
  assert.ok(km.posture.busteDevantGenoux[1] < -10 && trace('ancien', 'seul', 'base', 'kompa').posture.busteDevantGenoux[1] < -18, `kompa: the bust stands behind the knees today and in assisMarque (${km.posture.busteDevantGenoux})`);
  // #203: with the knees at 30° at least they stand about 1 cm further forward: the bust of `assisBusteAvant` is 2.3 cm
  // behind them at the most (−2 before).
  for (const [name, behind] of [['assisBuste', -7], ['assisBusteAvant', -3]]) {
    const k = trace(name, 'seul', 'base', 'kompa');
    assert.ok(k.posture.busteDevantGenoux[0] > behind && k.posture.busteDevantGenoux[2] < 3, `kompa ${name}: the bust above the knees (${k.posture.busteDevantGenoux} cm)`);
    assert.ok(k.posture.inclinaison[1] > 12 && k.posture.inclinaison[1] < 25 && k.posture.inclinaison[2] - k.posture.inclinaison[0] < 1, `kompa ${name}: a steady forward lean (${k.posture.inclinaison}°)`);
    assert.ok(k.buste.largeur > 5 && k.buste.largeur < 12, `kompa ${name}: the bust follows the pelvis sideways (${k.buste.largeur} cm)`);
    assert.ok(k.fluidite.arretPart === 0 && k.genoux.gauche[0] < api.KNEE_FLOOR_ELECTED + 6 && k.genoux.gauche[1] > 40 && Math.abs(k.mesures.L.face - km.mesures.L.face) < 2, `kompa ${name}: the hips of assisMarque (${k.mesures.L.face} cm²)`);
  }
  console.log(`PASS genoux qui mènent (vote du 22 novembre) : jamais à l'arrêt, accélération du bassin ${led('genouxQuart').fluidite.acceleration99} m/s² (${fToday.acceleration99} aujourd'hui, ${fF.acceleration99} pour F) ; de face ${g0.mesures.L.face} à ${g2.mesures.L.face} cm² ; kompa ${kg.mesures.L.face} cm²`);
  console.log(`PASS kompa seul : aujourd'hui une ligne (${k0.C.profondeur} cm d'avant en arrière, arrêt de ${k0.C.arret} temps) ; prototypes : ${k1.L.dessus} et ${k2.L.dessus} cm² entourés vu de dessus, aucun arrêt`);
  console.log(`PASS mesure du « 8 » (suiveuse, marche) : vu de dessus chaque hanche entoure ${today.L.dessus} cm² aujourd'hui (réglage ${api.GUIDE_GINGA_DEFAULT} ; ${film.L.dessus} avec marque, la taille du film), ${angular.L.dessus} (anguleux), ${round.L.dessus} (arrondi), ${large.L.dessus} (ample), ${larger.L.dessus} (très ample) ; arrêt le plus long du bassin ${film.C.arret} (marque), ${today.C.arret} (${api.GUIDE_GINGA_DEFAULT}) → ${round.C.arret} temps`);
}

// 4. #162: the semba, built on the hip elected for the kompa, with its double bounce (two landings in a row on
// the same foot). Prototypes, off by default; the pattern of the landings and the joins of the double bounce.
{
  assert.equal(api.SEMBA_PROTO.sit, undefined, 'no semba variant asked for by default');
  assert.equal(api.SEMBA_ELECTED, 'parCote');
  assert.deepEqual(Object.keys(api.SEMBA_SITS), ['pause', 'parCote', 'simple']);
  // Which foot receives the weight on each beat: the pelvis is on that side a third of a beat after the landing.
  const feet = name => Array.from({ length: api.SEMBA_SITS[name].pattern.length }, (_, n) => api.sembaSwing(api.SEMBA_SITS[name], 0.5 + n + 0.3) > 0 ? 'G' : 'D').join('');
  assert.equal(feet('pause'), 'GDGGDGDD', 'pause: one, two, three, then the same foot again (the double bounce on the fourth beat)');
  assert.equal(feet('parCote'), 'GGDD', 'parCote: two landings on each foot');
  assert.equal(feet('simple'), 'GD', 'simple: one transfer per beat');
  // The double bounce joins the plain swing without a jump: position and speed of the lateral swing are
  // continuous over the whole cycle, and inside the bounce the pelvis stays on the side of the bounce.
  for (const name of ['pause', 'parCote']) {
    const p = api.SEMBA_SITS[name], n = p.pattern.length, S = 400, x = Array.from({ length: n * S }, (_, i) => api.sembaSwing(p, 0.5 + i / S));
    const speed = x.map((v, i) => (x[(i + 1) % x.length] - v) * S);
    const jump = Math.max(...speed.map((v, i) => Math.abs(speed[(i + 1) % speed.length] - v)));
    assert.ok(jump < 0.15, `${name}: the speed of the swing never jumps (${jump.toFixed(3)} per beat between two samples)`);
    p.pattern.forEach((kind, k) => { if (kind !== 'D') return; const inside = x.slice(k * S, (k + 1) * S), side = Math.sign(inside[S / 4]);
      assert.ok(Math.min(...inside.map(v => v * side)) > -0.1 && Math.max(...inside.map(v => v * side)) > 0.99, `${name}: inside the double bounce the pelvis reaches its side and comes back to about the centre`); });
  }
  const trace = (...args) => JSON.parse(execFileSync('node', [fileURLToPath(new URL('./tracer_hanches.mjs', import.meta.url)), '', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const today_ = trace('ancien', 'seul', 'base', 'semba');
  assert.ok(today_.fluidite.acceleration99 > 50 && today_.posture.busteDevantGenoux[1] < -12, `semba before the votes: two sharp bounces per beat (${today_.fluidite.acceleration99} m/s²), the bust behind the knees (${today_.posture.busteDevantGenoux[1]} cm)`);
  const report = [];
  assert.deepEqual(trace('aujourdhui', 'seul', 'base', 'semba').mesures, trace('parCote', 'seul', 'base', 'semba').mesures, 'semba: the basic step is the elected one');
  for (const name of ['simple', 'pause', 'parCote']) {
    const k = trace(name, 'seul', 'base', 'semba'), g = k.genoux;
    assert.ok(k.fluidite.arretPart === 0 && k.fluidite.acceleration99 < 12, `semba ${name}: never still, no jolt (${JSON.stringify(k.fluidite)})`);
    assert.ok(g.gauche[0] < api.KNEE_FLOOR_ELECTED + 6 && g.gauche[1] > 44 && g.ecart > 14, `semba ${name}: the legs alternate (${JSON.stringify(g)})`);
    assert.ok(k.posture.busteDevantGenoux[0] > -8.5 && k.posture.inclinaison[1] > 12 && k.buste.largeur > 4 && k.buste.largeur < 10, `semba ${name}: the bust of the elected kompa (${JSON.stringify(k.posture)}, ${k.buste.largeur} cm sideways)`);
    assert.ok(k.mesures.C.hauteur > 1.5 && k.mesures.C.hauteur < 4, `semba ${name}: one bounce per landing (${k.mesures.C.hauteur} cm)`);
    report.push(`${name} ${k.fluidite.acceleration99} m/s², genoux ${g.gauche[0]}° à ${g.gauche[1]}°`);
  }
  console.log(`PASS semba seul (#162) : aujourd'hui ${today_.fluidite.acceleration99} m/s² ; prototypes ${report.join(' ; ')} ; appuis pause ${feet('pause')}, parCote ${feet('parCote')}`);
}
