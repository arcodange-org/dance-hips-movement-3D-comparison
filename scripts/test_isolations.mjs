#!/usr/bin/env node
// #206 (docs/spec-isolations.md) : exercices d'isolation seul, pieds posés, en boucle à trois vitesses.
// 1. Le module pur (src/isolations.ts) : catalogue, boucle, chemins (marqué par le centre, lié sans), sens, réglages élus.
// 2. Le vrai GLB avec applyPose : pieds posés et immobiles, seule la partie nommée bouge, sens réels, boucle fermée.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";

const bundle = new URL("./.test-isolations-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "rigJoints", "isolations", "essais"].map(n => `export * from "./src/${n}";`).join("\n"),
  resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href);
unlinkSync(bundle);
const { ESSAIS, ISOLATIONS, ISOLATION_IDS, ISOLATION_DEFAULT, ISOLATION_AMPLITUDES, ISOLATION_ESSAIS, ISOLATION_HEEL, ISOLATION_SPEEDS, ISOLATION_TENUE,
  isolationAt, isolationPath, isolationSettings, isIsolationId, isolationBeats, isolationStages, isolationStage } = api;

const STEP = 1 / 32;
const beats = (from, to, step = STEP) => { const out = []; for (let b = from; b <= to + 1e-9; b += step) out.push(b); return out; };
const flat = p => [p.head.nod, p.head.turn, p.head.tilt, p.chest.fore, p.chest.side, p.pelvis.fore, p.pelvis.side, p.pelvis.tilt, p.pelvis.hike, p.pelvis.turn, p.heel];
const maxDiff = (a, b) => Math.max(...a.map((x, i) => Math.abs(x - b[i])));
const settings = (patch) => ({ ...ISOLATION_DEFAULT, ...patch });
const VARIANTS = [["élu", ISOLATION_DEFAULT], ["huit qui glisse", settings({ huit: "glisse" })], ["huit qui tourne", settings({ huit: "tourne" })], ["miroir", settings({ miroir: true })],
  ["sur pointes", settings({ pointes: true })], ["talons un peu", settings({ hauteur: "unPeu", pointes: true })], ["talons tenus", settings({ talons: "tenue" })]];
const where = { devant: [1, 0], derriere: [-1, 0], gauche: [0, 1], droite: [0, -1], centre: [0, 0] };
const at = (id, b, s = ISOLATION_DEFAULT) => isolationAt(id, b, s);
const isAt = (id, b, name, s) => { const p = at(id, b, s).path, [f, sd] = where[name]; return Math.abs(p.fore - f) < 1e-9 && Math.abs(p.side - sd) < 1e-9; };
/** Début de la vitesse `k` (0 : deux temps par mouvement, 1 : un temps, 2 : un demi-temps). */
const startOf = (id, k) => isolationStages(id).slice(0, k).reduce((a, b) => a + b, 0);
/** Le point de la figure au mouvement `m` de la vitesse `k`. */
const pointAt = (id, k, m) => startOf(id, k) + m * ISOLATION_SPEEDS[k];

// ---------------------------------------------------------------- 1. module pur
{
  assert.equal(ISOLATION_IDS.length, 22, "dix-huit exercices, le huit dans ses deux sens, deux demi-cercles, les talons (#216)");
  const codes = ISOLATION_IDS.map(id => ISOLATIONS[id].code);
  assert.equal(new Set(codes).size, 22, "un code par exercice");
  const count = f => ISOLATION_IDS.filter(id => ISOLATIONS[id].famille === f).length;
  assert.deepEqual([count("cou"), count("poitrine"), count("bassin"), count("pieds")], [6, 7, 8, 1]);
  assert.ok(isIsolationId("bassin-huit") && !isIsolationId("bassin") && !isIsolationId(null) && !isIsolationId("toString"));
  for (const id of ISOLATION_IDS) assert.ok(!/\d+\s*(cm|mm|°)/.test(ISOLATIONS[id].nom), `${id} : le nom parle en danseur`);
  console.log("PASS catalogue : 22 boucles (cou 6, poitrine 7, bassin 8, talons 1), noms sans mesure");
}

{
  // Le comportement élu (le huit, tranché le 25 novembre) ; à plat sans `pointes` ; les candidats de #216 inertes sans ?essai=.
  assert.deepEqual(isolationSettings(), ISOLATION_DEFAULT);
  assert.equal(ISOLATION_DEFAULT.huit, "alterne");
  assert.ok(!ISOLATION_DEFAULT.pointes && ISOLATION_DEFAULT.hauteur === "miHauteur" && ISOLATION_DEFAULT.talons === "vitesses");
  assert.equal(isolationSettings({ miroir: true }).miroir, true);
  assert.equal(isolationSettings({ pointes: true }).pointes, true);
  assert.deepEqual([...ISOLATION_ESSAIS], ["talonsBas", "talonsTenue"]);
  assert.ok(ISOLATION_ESSAIS.every(k => k in ESSAIS) && !Object.keys(ESSAIS).some(k => k.startsWith("iso")), "les candidats sont des essais");
  assert.equal(isolationSettings({}, e => e === "talonsBas").hauteur, "unPeu");
  assert.equal(isolationSettings({}, e => e === "talonsTenue").talons, "tenue");
  assert.ok(ISOLATION_IDS.every(id => beats(0, isolationBeats(id), 1 / 4).every(b => ISOLATIONS[id].famille === "pieds" || at(id, b).heel === 0)), "à plat sans pointes");
  console.log("PASS réglages : le comportement élu, à plat sans pointes, candidats des talons inertes sans ?essai=");
}

{
  // Trois vitesses, du plus lent au plus rapide (élu le 24 novembre) : deux temps, un temps, un demi-temps par
  // mouvement ; chacune dure deux mesures, ou le tour entier de la figure s'il est plus long (le cercle marqué, huit
  // points, prend quatre mesures à deux temps par mouvement) ; un nombre entier de tours.
  assert.deepEqual([...ISOLATION_SPEEDS], [2, 1, 0.5]);
  for (const id of ISOLATION_IDS) {
    const stages = isolationStages(id), marked = ISOLATIONS[id].form.kind === "cercleMarque";
    assert.deepEqual(stages, marked ? [16, 8, 8] : [8, 8, 8], `${id} : durée de chaque vitesse`);
    assert.equal(isolationBeats(id), marked ? 32 : 24);
    stages.forEach((d, k) => assert.ok(d >= 8 && Number.isInteger(d / (ISOLATION_SPEEDS[k] * (marked ? 8 : 4))), `${id} : vitesse ${k}, tours entiers`));
    for (const k of [0, 1, 2]) {
      const st = isolationStage(id, startOf(id, k) + 0.01);
      assert.equal(st.stage, k); assert.equal(st.speed, ISOLATION_SPEEDS[k]);
    }
  }
  console.log("PASS trois vitesses : deux temps, un temps, un demi-temps par mouvement, deux mesures chacune (quatre pour le cercle marqué lent)");
}

{
  // Une boucle, sans à-coup, aussi aux changements de vitesse et à la couture.
  for (const [name, s] of VARIANTS) for (const id of ISOLATION_IDS) {
    const L = isolationBeats(id);
    for (const b of beats(0, L, 1 / 8)) assert.ok(maxDiff(flat(at(id, b, s)), flat(at(id, b + L, s))) < 1e-9, `${id} (${name}) : boucle au temps ${b}`);
    let previous = flat(at(id, -0.5, s)), worst = 0;
    for (const b of beats(-0.5 + 1 / 128, L + 0.5, 1 / 128)) { const now = flat(at(id, b, s)); worst = Math.max(worst, maxDiff(now, previous)); previous = now; }
    // 1/128 de temps : au plus 0,6 cm et 1,5° (le plus vif est le demi-temps).
    assert.ok(worst < 0.026, `${id} (${name}) : saut de ${worst.toFixed(4)} en 1/128 de temps`);
    for (const v of flat(at(id, 3.3, s))) assert.ok(Number.isFinite(v));
  }
  console.log(`PASS boucle : fermée, sans saut, changements de vitesse et couture compris (${VARIANTS.length} réglages × 22)`);
}

{
  // Seule la partie nommée bouge.
  for (const [name, s] of VARIANTS) for (const id of ISOLATION_IDS) {
    const f = ISOLATIONS[id].famille;
    let moved = 0;
    for (const b of beats(0, isolationBeats(id), 1 / 16)) {
      const p = at(id, b, s);
      const head = [p.head.nod, p.head.turn, p.head.tilt], chest = [p.chest.fore, p.chest.side], pelvis = flat(p).slice(5, 10);
      // Sur pointes, les talons restent levés toute la boucle (à la hauteur réglée) ; dans l'exercice des talons, ils bougent.
      if (f !== "pieds") assert.equal(p.heel, s.pointes ? ISOLATION_HEEL[s.hauteur] : 0, `${id} (${name}) : talons au temps ${b}`);
      for (const [part, values] of [["cou", head], ["poitrine", chest], ["bassin", pelvis], ["pieds", [p.heel]]]) {
        if (part === "pieds" && f !== "pieds") continue;
        if (part === f) moved = Math.max(moved, ...values.map(Math.abs));
        else assert.ok(values.every(v => v === 0), `${id} (${name}) : ${part} bouge au temps ${b}`);
      }
    }
    assert.ok(moved > 0.01, `${id} (${name}) : la partie nommée bouge`);
  }
  console.log("PASS seule la partie nommée bouge (module)");
}

{
  // Le cercle marqué repasse par le centre entre ses quatre points ; le lié n'y repasse pas (tranché le 24 novembre).
  const marked = { 1: ["devant", "centre", "droite", "centre", "derriere", "centre", "gauche", "centre"],
    [-1]: ["devant", "centre", "gauche", "centre", "derriere", "centre", "droite", "centre"] };
  for (const fam of ["poitrine", "bassin"]) for (const [suffix, sens] of [["", 1], ["-inverse", -1]]) {
    const m = `${fam}-cercle-marque${suffix}`, l = `${fam}-cercle-lie${suffix}`;
    // À chaque vitesse, le marqué passe par ses huit points dans l'ordre (sur 1, 2, 3… à un temps par mouvement).
    for (const k of [0, 1, 2]) marked[sens].forEach((name, j) => assert.ok(isAt(m, pointAt(m, k, j), name), `${m} : ${name}, mouvement ${j + 1}, vitesse ${k}`));
    // Le lié passe par devant, côté, derrière, autre côté à chaque vitesse, sans jamais repasser par le centre.
    for (const k of [0, 1, 2]) [0, 2, 4, 6].forEach((j, i) => assert.ok(isAt(l, pointAt(l, k, i), marked[sens][j]), `${l} : ${marked[sens][j]}, vitesse ${k}`));
    let nearest = Infinity;
    for (const b of beats(0, isolationBeats(l), 1 / 64)) { const p = at(l, b).path; nearest = Math.min(nearest, Math.hypot(p.fore, p.side)); }
    assert.ok(nearest > 0.999, `${l} : ne repasse pas par le centre (${nearest})`);
  }
  console.log("PASS cercles : le marqué repasse par le centre entre ses points, le lié jamais, aux trois vitesses");
}

{
  // Posé puis tenu, sauf quand la vitesse ne le permet plus : fluide au demi-temps.
  const id = "poitrine-cercle-marque", held = k => isAt(id, pointAt(id, k, 2) + 0.2 * ISOLATION_TENUE * ISOLATION_SPEEDS[k], "droite");
  assert.ok(held(0) && held(1), "à deux temps et à un temps : la poitrine se tient sur le point");
  assert.ok(!held(2), "au demi-temps : elle ne s'y tient pas");
  // Au demi-temps, le marqué traverse le centre sans s'arrêter.
  const c = pointAt(id, 2, 1), speed = Math.hypot(...["fore", "side"].map(f => at(id, c + 1e-3).path[f] - at(id, c - 1e-3).path[f])) / 2e-3;
  assert.ok(speed > 1, `au demi-temps la poitrine traverse le centre sans s'arrêter (${speed.toFixed(2)})`);
  const a = "poitrine-avant";
  assert.ok(isAt(a, pointAt(a, 1, 0) + 0.1, "devant") && !isAt(a, pointAt(a, 2, 0) + 0.1, "devant"));
  console.log("PASS points posés puis tenus à deux temps et à un temps, fluides au demi-temps");
}

{
  // La tête : cercles dans les deux sens, demi-cercle par devant, tête en arrière moins loin, tourner et pencher séparés.
  const head = (id, b) => at(id, b).head, P = (id, j) => pointAt(id, 0, j);
  assert.ok(head("cou-cercle", P("cou-cercle", 0)).nod > 0 && head("cou-cercle", P("cou-cercle", 1)).tilt < 0
    && head("cou-cercle", P("cou-cercle", 2)).nod < 0 && head("cou-cercle", P("cou-cercle", 3)).tilt > 0);
  assert.ok(head("cou-cercle-inverse", P("cou-cercle-inverse", 1)).tilt > 0 && head("cou-cercle-inverse", P("cou-cercle-inverse", 3)).tilt < 0);
  assert.ok(-head("cou-cercle", P("cou-cercle", 2)).nod < head("cou-cercle", 0).nod && -head("cou-hoche", P("cou-hoche", 2)).nod < head("cou-hoche", 0).nod);
  assert.ok(head("cou-tourne", 0).turn > 0 && head("cou-tourne", 0).tilt === 0 && head("cou-tourne", P("cou-tourne", 2)).turn < 0);
  assert.ok(head("cou-penche", 0).tilt > 0 && head("cou-penche", 0).turn === 0 && head("cou-penche", P("cou-penche", 2)).tilt < 0);
  // Le demi-cercle : l'oreille gauche, le menton en bas, l'oreille droite, le menton ; jamais la tête en arrière.
  const d = "cou-demi-cercle";
  assert.ok(isAt(d, P(d, 0), "gauche") && isAt(d, P(d, 1), "devant") && isAt(d, P(d, 2), "droite") && isAt(d, P(d, 3), "devant"));
  for (const b of beats(0, isolationBeats(d), 1 / 32)) {
    const p = at(d, b).path;
    assert.ok(p.fore >= -1e-9 && Math.abs(Math.hypot(p.fore, p.side) - 1) < 1e-9, `${d} : sur le demi-cercle de devant au temps ${b}`);
  }
  const pd = "poitrine-demi-cercle";
  assert.ok(isAt(pd, P(pd, 0), "gauche") && isAt(pd, P(pd, 1), "devant") && isAt(pd, P(pd, 2), "droite") && at(pd, P(pd, 1)).chest.fore > 0.04);
  console.log("PASS tête et demi-cercles : cercles dans les deux sens, demi-cercle par devant sans passer derrière, tête en arrière moins loin");
}

{
  // Allers-retours : un point par mouvement, en repassant par le centre ; au demi-temps, un côté par temps.
  const a = "poitrine-avant";
  ["devant", "centre", "derriere", "centre"].forEach((n, j) => [0, 1, 2].forEach(k => assert.ok(isAt(a, pointAt(a, k, j), n), `${a} : ${n}, vitesse ${k}`)));
  assert.equal(pointAt(a, 0, 1), 2, "à deux temps par mouvement : au centre sur 3");
  assert.equal(pointAt(a, 1, 1) - pointAt(a, 1, 0), 1, "à un temps : au centre sur 2");
  assert.equal(pointAt(a, 2, 2) - pointAt(a, 2, 0), 1, "au demi-temps : devant sur 1, derrière sur 2");
  assert.ok(at("bassin-bascule", 0).pelvis.tilt > 0 && at("bassin-bascule", pointAt("bassin-bascule", 0, 2)).pelvis.tilt < 0);
  const side = at("bassin-cote", 0).pelvis;
  assert.ok(side.side > 0 && side.hike > 0 && side.tilt === 0 && side.fore === 0);
  console.log("PASS allers-retours : par le centre, deux temps puis un temps puis un demi-temps par mouvement");
}

{
  // Le huit : centre, gauche, centre, droite ; chaque côté part par devant (ou par derrière dans l'autre sens).
  for (const [id, sens] of [["bassin-huit", 1], ["bassin-huit-inverse", -1]]) for (const k of [0, 1, 2]) {
    const P = j => pointAt(id, k, j);
    assert.ok(isAt(id, P(0), "centre") && isAt(id, P(1), "gauche") && isAt(id, P(2), "centre") && isAt(id, P(3), "droite"), `${id} : vitesse ${k}`);
    assert.ok(Math.sign(at(id, P(0.5)).path.fore) === sens && Math.sign(at(id, P(1.5)).path.fore) === -sens, `${id} : à gauche, part par ${sens > 0 ? "devant" : "derrière"}`);
  }
  const tourne = settings({ huit: "tourne" });
  assert.ok(at("bassin-huit", 1, tourne).pelvis.turn < 0 && at("bassin-huit", 5, tourne).pelvis.turn > 0, "la hanche de devant mène");
  assert.ok(Math.abs(Math.max(...beats(0, 8, 1 / 64).map(b => Math.abs(at("bassin-huit", b, tourne).pelvis.turn))) - ISOLATION_AMPLITUDES.bassin.eightTurn) < 1e-3);
  assert.ok(beats(0, 24, 1 / 16).every(b => at("bassin-huit", b, settings({ huit: "glisse" })).pelvis.turn === 0), "qui glisse : sans tourner");
  // Élu : il alterne, une mesure chacun, en commençant par glisser (mesures 1, 3, 5 glissent ; 2, 4, 6 tournent).
  for (const id of ["bassin-huit", "bassin-huit-inverse"]) for (let m = 0; m < isolationBeats(id) / 4; m++) {
    const inside = beats(4 * m, 4 * m + 4, 1 / 32).slice(1, -1);
    const turn = inside.map(b => Math.abs(at(id, b).pelvis.turn)), same = inside.every(b => at(id, b).pelvis.turn === at(id, b, tourne).pelvis.turn);
    if (m % 2 === 0) assert.ok(turn.every(t => t === 0), `${id} : mesure ${m + 1}, il glisse`);
    else assert.ok(same && Math.max(...turn) > 0.5 * ISOLATION_AMPLITUDES.bassin.eightTurn, `${id} : mesure ${m + 1}, il tourne`);
    // Chaque mesure commence au centre : rien ne tourne au passage d'une manière à l'autre.
    assert.ok(isAt(id, 4 * m, "centre") && Math.abs(at(id, 4 * m, tourne).pelvis.turn) < 1e-12, `${id} : mesure ${m + 1}, au centre`);
  }
  console.log("PASS huit : centre, gauche, centre, droite aux trois vitesses ; il alterne, une mesure il glisse, une mesure il tourne");
}

{
  // Miroir : gauche et droite échangés, devant et derrière gardés.
  for (const id of ISOLATION_IDS) for (const b of [0, 1.3, 2, 5.7, 17.2, 21.9]) {
    const m = at(id, b, settings({ miroir: true })), o = at(id, b);
    assert.ok(m.path.side === -o.path.side && m.path.fore === o.path.fore, `${id} : le miroir échange gauche et droite`);
    assert.ok(Math.abs(m.head.turn + o.head.turn) < 1e-12 && Math.abs(m.head.tilt + o.head.tilt) < 1e-12 && m.head.nod === o.head.nod);
    assert.ok(Math.abs(m.chest.side + o.chest.side) < 1e-12 && Math.abs(m.pelvis.side + o.pelvis.side) < 1e-12 && Math.abs(m.pelvis.hike + o.pelvis.hike) < 1e-12);
  }
  assert.equal(isolationPath("poitrine-cote", 0).side, 1);
  console.log("PASS miroir : gauche et droite échangés, devant et derrière gardés");
}

{
  // #216 : l'exercice des talons, en haut puis à plat, aux trois vitesses ; candidats : un peu, et monter-tenir-redescendre.
  const id = "talons", H = ISOLATION_HEEL.miHauteur;
  assert.ok(H > ISOLATION_HEEL.unPeu && ISOLATION_HEEL.unPeu > 0);
  for (const k of [0, 1, 2]) for (let j = 0; j < 4; j++)
    assert.ok(Math.abs(at(id, pointAt(id, k, j)).heel - (j % 2 === 0 ? H : 0)) < 1e-12, `${id} : vitesse ${k}, en haut puis à plat (point ${j})`);
  // Posé puis tenu à deux temps et à un temps ; fluide au demi-temps.
  const held = k => at(id, pointAt(id, k, 0) + 0.2 * ISOLATION_SPEEDS[k]).heel === H;
  assert.ok(held(0) && held(1) && !held(2), "tenu à deux temps et à un temps, fluide au demi-temps");
  // Le rythme candidat : en haut sur 1, tenu jusqu'au 3, en bas sur 4.
  const tenue = settings({ talons: "tenue" });
  for (const [b, h] of [[0, H], [1, H], [2, H], [3, 0], [4, H], [23, 0], [24, H]])
    assert.ok(Math.abs(at(id, b, tenue).heel - h) < 1e-12, `talons tenus : au temps ${b}`);
  assert.equal(at(id, 0, settings({ hauteur: "unPeu" })).heel, ISOLATION_HEEL.unPeu);
  // `pointes` ne change rien à l'exercice des talons.
  assert.ok(beats(0, 24, 1 / 16).every(b => at(id, b, settings({ pointes: true })).heel === at(id, b).heel));
  console.log("PASS talons : en haut puis à plat aux trois vitesses, tenus puis fluides ; candidats un peu, et monter-tenir-redescendre");
}

// ---------------------------------------------------------------- 2. vrai GLB
const SIDES = ["L", "R"];
const v3 = () => new THREE.Vector3();
function measure(r, outer) {
  r.root.updateWorldMatrix(true, true);
  const local = o => outer.worldToLocal(o.getWorldPosition(v3()));
  const q = o => outer.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(o.getWorldQuaternion(new THREE.Quaternion()));
  const legs = Object.fromEntries(SIDES.map(s => [s, [r["hip" + s], r["knee" + s], r["foot" + s]].map(o => o.getWorldPosition(v3()))]));
  return {
    feet: SIDES.map(s => local(r["foot" + s])), footQ: SIDES.map(s => q(r["foot" + s])),
    pelvis: local(r.pelvis), pelvisQ: q(r.pelvis), chest: local(r.chest), chestQ: q(r.chest), head: local(r.head), headQ: q(r.head),
    thigh: SIDES.map(s => legs[s][0].distanceTo(legs[s][1])), shin: SIDES.map(s => legs[s][1].distanceTo(legs[s][2])),
  };
}
const angle = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(a.dot(b))));
const DEG = 180 / Math.PI;
for (const [label, where] of [["seul", {}], ["comparaison, à droite, tourné", { offset: [0.85, 0, 0.3], rotation: 0.7 }]]) {
  const { r, outer, model } = fixture(api, where);
  // La station neutre : le cou au centre (sur 3), rien d'autre ne bouge.
  api.applyPose(r, model, 2, { isolation: { id: "cou-tourne" } });
  assert.ok(isAt("cou-tourne", 2, "centre"));
  const rest = measure(r, outer);
  const report = [];
  let worstJump = 0;
  for (const id of ISOLATION_IDS.filter(id => ISOLATIONS[id].famille !== "pieds")) {
    const fam = ISOLATIONS[id].famille;
    let feet = 0, soles = Infinity, bones = Infinity, legs = 0, pelvis = 0, chest = 0, chestTurn = 0, chestDrop = 0, chestLow = Infinity, chestHigh = -Infinity, headTurn = 0, headOnChest = 0, jump = 0;
    let previous = null;
    for (const b of beats(0, isolationBeats(id), 1 / 8)) {
      api.applyPose(r, model, b, { isolation: { id } });
      const m = measure(r, outer);
      m.feet.forEach((p, i) => { feet = Math.max(feet, p.distanceTo(rest.feet[i])); });
      m.footQ.forEach((p, i) => { feet = Math.max(feet, angle(p, rest.footQ[i]) * 0.1); });
      bones = Math.min(bones, minimumBoneY(r));
      for (const s of SIDES) {
        const foot = r["foot" + s];
        let low = Infinity; const v = v3();
        for (const p of model.legs[s].sole) low = Math.min(low, outer.worldToLocal(v.copy(p).applyMatrix4(foot.matrixWorld)).y);
        soles = Math.min(soles, Math.abs(low) < 1e-4 ? 0 : low);
      }
      legs = Math.max(legs, ...m.thigh.map((d, i) => Math.abs(d - rest.thigh[i])), ...m.shin.map((d, i) => Math.abs(d - rest.shin[i])));
      const pelvisMove = Math.max(m.pelvis.distanceTo(rest.pelvis), angle(m.pelvisQ, rest.pelvisQ) * 0.1);
      const target = isolationAt(id, b).chest;
      const slide = new THREE.Vector3(target.side, 0, target.fore);
      const chestFlat = new THREE.Vector3(m.chest.x - rest.chest.x, 0, m.chest.z - rest.chest.z);
      if (fam !== "bassin") pelvis = Math.max(pelvis, pelvisMove);
      else pelvis = Math.max(pelvis, pelvisMove > 0.005 ? 1 : 0);
      chest = Math.max(chest, chestFlat.distanceTo(slide));
      chestDrop = Math.max(chestDrop, rest.chest.y - m.chest.y);
      chestLow = Math.min(chestLow, m.chest.y); chestHigh = Math.max(chestHigh, m.chest.y);
      chestTurn = Math.max(chestTurn, angle(m.chestQ, rest.chestQ));
      const headRel = m.chestQ.clone().invert().multiply(m.headQ);
      if (fam !== "cou") headOnChest = Math.max(headOnChest, angle(headRel, new THREE.Quaternion()), m.head.clone().sub(m.chest).distanceTo(rest.head.clone().sub(rest.chest)));
      else headTurn = Math.max(headTurn, angle(headRel, new THREE.Quaternion()));
      if (previous) jump = Math.max(jump, m.head.distanceTo(previous.head), m.chest.distanceTo(previous.chest), m.pelvis.distanceTo(previous.pelvis));
      previous = m;
    }
    assert.ok(feet < 1e-4, `${id} (${label}) : pieds immobiles (${(feet * 1000).toFixed(3)} mm)`);
    assert.ok(soles > -1e-4 && soles < 1e-4, `${id} (${label}) : semelles posées (${(soles * 1000).toFixed(3)} mm)`);
    assert.ok(bones > -1e-4, `${id} (${label}) : os au-dessus du sol (${(bones * 1000).toFixed(3)} mm)`);
    assert.ok(legs < 1e-4, `${id} (${label}) : longueurs des jambes (${(legs * 1000).toFixed(3)} mm)`);
    assert.ok(chest < 1e-3, `${id} (${label}) : la cage est à sa place, plus son glissé (${(chest * 1000).toFixed(2)} mm)`);
    assert.ok(chestTurn * DEG < 0.01, `${id} (${label}) : la cage reste droite et de face (${(chestTurn * DEG).toFixed(4)}°)`);
    if (fam === "cou") {
      assert.ok(pelvis < 1e-4 && chestDrop < 1e-4, `${id} (${label}) : bassin et cage immobiles`);
      assert.ok(headTurn > 0.25, `${id} (${label}) : la tête bouge`);
    } else assert.ok(headOnChest < 1e-6, `${id} (${label}) : la tête suit la cage sans tourner ni pencher`);
    if (fam === "poitrine") assert.ok(pelvis < 1e-4, `${id} (${label}) : bassin immobile (${(pelvis * 1000).toFixed(3)})`);
    if (fam === "bassin") assert.ok(pelvis === 1, `${id} (${label}) : le bassin bouge`);
    // Le bassin reste à niveau sur la boucle (le danseur s'assoit un peu dans ses genoux) : la cage ne descend que du
    // glissé de la colonne (au plus 6 mm), et de 1,5 cm au plus sous la station neutre.
    assert.ok(chestHigh - chestLow < 0.006, `${id} (${label}) : la cage monte et descend de ${((chestHigh - chestLow) * 1000).toFixed(1)} mm`);
    assert.ok(chestDrop < 0.015, `${id} (${label}) : la cage descend de ${(chestDrop * 1000).toFixed(1)} mm sous la station neutre`);
    // Au demi-temps, le demi-cercle de la poitrine et le huit vont vite (3 cm par huitième de temps) : une vitesse, pas un saut.
    assert.ok(jump < 0.035, `${id} (${label}) : saut de ${(jump * 1000).toFixed(1)} mm en 1/8 de temps`);
    report.push(`${ISOLATIONS[id].code} ${((chestHigh - chestLow) * 1000).toFixed(0)}`);
    worstJump = Math.max(worstJump, jump);
    // La boucle se referme : la pose de sa fin est celle du temps 0.
    api.applyPose(r, model, 0, { isolation: { id } }); const first = snapshot(r);
    api.applyPose(r, model, isolationBeats(id), { isolation: { id } }); const last = snapshot(r);
    assert.ok(maxDiff(first, last) < 1e-9, `${id} (${label}) : la dernière image enchaîne sur la première`);
  }
  // #216 : les avant-pieds (horizontalement : le pied d'un bloc tient sur le bout des orteils) et les talons.
  const footPoint = (s, point) => outer.worldToLocal(model.legs[s][point].clone().applyMatrix4(r["foot" + s].matrixWorld));
  const lowestSole = () => Math.min(...SIDES.map(s => Math.min(...model.legs[s].sole.map(p => outer.worldToLocal(p.clone().applyMatrix4(r["foot" + s].matrixWorld)).y))));
  api.applyPose(r, model, 2, { isolation: { id: "cou-tourne" } }); r.root.updateWorldMatrix(true, true);
  const balls = SIDES.map(s => footPoint(s, "ball"));
  const feetChecks = (what) => {
    r.root.updateWorldMatrix(true, true);
    const ballMove = Math.max(...SIDES.map((s, i) => { const p = footPoint(s, "ball"); return Math.hypot(p.x - balls[i].x, p.z - balls[i].z); }));
    assert.ok(ballMove < 1e-4, `${what} (${label}) : les avant-pieds ne bougent pas (${(ballMove * 1000).toFixed(3)} mm)`);
    assert.ok(Math.abs(lowestSole()) < 1e-4, `${what} (${label}) : les pieds sont posés`);
    assert.ok(minimumBoneY(r) > -1e-4, `${what} (${label}) : os au-dessus du sol`);
    const m = measure(r, outer);
    assert.ok(Math.max(...m.thigh.map((d, i) => Math.abs(d - rest.thigh[i])), ...m.shin.map((d, i) => Math.abs(d - rest.shin[i]))) < 1e-4, `${what} (${label}) : longueurs des jambes`);
    return m;
  };
  // Sur la pointe des pieds, chaque exercice est celui à plat monté d'un bloc : bassin, cage et tête à la même place et dans
  // la même orientation, plus haut d'une hauteur constante ; les talons restent levés.
  // (La hauteur varie d'un exercice à l'autre de moins d'un millimètre : chacun a son niveau, mesuré sur sa boucle.)
  let lifts = [], heelLow = Infinity;
  for (const id of ISOLATION_IDS.filter(id => ISOLATIONS[id].famille !== "pieds")) {
   const own = [];
   for (const b of beats(0, isolationBeats(id), 1 / 2)) {
    api.applyPose(r, model, b, { isolation: { id } }); const a = measure(r, outer);
    api.applyPose(r, model, b, { isolation: { id, settings: settings({ pointes: true }) } }); const m = feetChecks(`${id} sur pointes`);
    heelLow = Math.min(heelLow, ...SIDES.map(s => footPoint(s, "heel").y));
    for (const part of ["pelvis", "chest", "head"]) {
      assert.ok(Math.hypot(m[part].x - a[part].x, m[part].z - a[part].z) < 1e-6 && angle(m[part + "Q"], a[part + "Q"]) < 1e-6, `${id} sur pointes (${label}) : ${part} comme à plat, au temps ${b}`);
      own.push(m[part].y - a[part].y);
    }
   }
   assert.ok(Math.max(...own) - Math.min(...own) < 1e-4, `${id} sur pointes (${label}) : monté d'un bloc (${((Math.max(...own) - Math.min(...own)) * 1000).toFixed(3)} mm d'écart)`);
   lifts.push(...own);
  }
  assert.ok(Math.min(...lifts) > 0.05 && Math.max(...lifts) - Math.min(...lifts) < 0.002, `sur pointes (${label}) : monté de ${(Math.min(...lifts) * 100).toFixed(2)} à ${(Math.max(...lifts) * 100).toFixed(2)} cm`);
  assert.ok(heelLow > 0.07, `sur pointes (${label}) : talons levés (${(heelLow * 100).toFixed(1)} cm)`);
  // L'exercice des talons : le corps monte et descend d'un bloc avec les chevilles, rien d'autre ne bouge ; à plat, il est
  // à sa place.
  {
    const id = "talons";
    let block = 0, moved = 0, top = 0, jump = 0, previous = null;
    for (const b of beats(0, isolationBeats(id), 1 / 8)) {
      api.applyPose(r, model, b, { isolation: { id } }); const m = feetChecks(`${id} au temps ${b}`);
      const dy = m.pelvis.y - rest.pelvis.y; top = Math.max(top, dy);
      for (const part of ["pelvis", "chest", "head"]) {
        block = Math.max(block, Math.abs(m[part].y - rest[part].y - dy));
        moved = Math.max(moved, Math.hypot(m[part].x - rest[part].x, m[part].z - rest[part].z), angle(m[part + "Q"], rest[part + "Q"]) * 0.1);
        if (previous) jump = Math.max(jump, m[part].distanceTo(previous[part]));
      }
      previous = m;
    }
    assert.ok(block < 1e-4 && moved < 1e-4, `${id} (${label}) : le corps monte d'un bloc (${(block * 1000).toFixed(3)} mm), sans glisser ni tourner (${(moved * 1000).toFixed(3)})`);
    assert.ok(top > 0.05 && jump < 0.035, `${id} (${label}) : monte de ${(top * 100).toFixed(1)} cm, ${(jump * 1000).toFixed(1)} mm au plus en 1/8 de temps`);
    api.applyPose(r, model, pointAt(id, 0, 1), { isolation: { id } });
    const flatPose = measure(r, outer);
    assert.ok(Math.abs(flatPose.pelvis.y - rest.pelvis.y) < 1e-3, `${id} (${label}) : à plat, le bassin à sa place`);
    api.applyPose(r, model, 0, { isolation: { id } }); const first = snapshot(r);
    api.applyPose(r, model, isolationBeats(id), { isolation: { id } });
    assert.ok(maxDiff(first, snapshot(r)) < 1e-9, `${id} (${label}) : la boucle se referme`);
    console.log(`INFO talons (${label}) : le corps monte de ${(top * 100).toFixed(1)} cm ; sur pointes, de ${(Math.min(...lifts) * 100).toFixed(1)} cm, talons à ${(heelLow * 100).toFixed(1)} cm du sol`);
  }
  // Après un exercice, la pose ordinaire revient intacte (la tête retrouve sa place).
  api.applyPose(r, model, 2.5, { isolation: { id: "cou-penche" } });
  api.applyPose(r, model, 1.25, {});
  const after = snapshot(r);
  const fresh = fixture(api, where); api.applyPose(fresh.r, fresh.model, 1.25, {});
  assert.ok(maxDiff(after, snapshot(fresh.r)) < 1e-9, `${label} : la pose ordinaire revient intacte`);
  console.log(`PASS GLB (${label}) : pieds posés et immobiles, longueurs, os au-dessus du sol, seule la partie nommée bouge, cage droite et de face, boucle fermée ; sur pointes, l'exercice monté d'un bloc ; talons : le corps monte d'un bloc`);
  console.log(`INFO plus grand déplacement en 1/8 de temps (tête, cage, bassin) : ${(worstJump * 1000).toFixed(1)} mm`);
  console.log(`INFO la cage monte et descend (mm) : ${report.filter(x => !x.endsWith(" 0")).join(", ")}`);
}

{
  // Les sens, vus sur le corps (gauche du danseur = +x, devant = +z).
  const { r, outer, model } = fixture(api);
  const pose = (id, b, s) => { api.applyPose(r, model, b, { isolation: { id, settings: s } }); r.root.updateWorldMatrix(true, true); };
  const dir = (o, v) => v.clone().applyQuaternion(outer.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(o.getWorldQuaternion(new THREE.Quaternion())));
  const local = o => outer.worldToLocal(o.getWorldPosition(v3()));
  pose("cou-tourne", 0); assert.ok(dir(r.head, new THREE.Vector3(0, 0, 1)).x > 0.6, "regarder à gauche");
  pose("cou-tourne", 0, settings({ miroir: true })); assert.ok(dir(r.head, new THREE.Vector3(0, 0, 1)).x < -0.6, "miroir : à droite");
  pose("cou-penche", 0); assert.ok(dir(r.head, new THREE.Vector3(0, 1, 0)).x > 0.4 && local(r.head).x > 0.02, "l'oreille vers l'épaule gauche, le cou plie depuis sa base");
  pose("cou-hoche", 0); assert.ok(dir(r.head, new THREE.Vector3(0, 0, 1)).y < -0.4, "le menton en bas");
  pose("cou-hoche", pointAt("cou-hoche", 0, 2)); assert.ok(dir(r.head, new THREE.Vector3(0, 0, 1)).y > 0.25, "le menton en haut");
  pose("poitrine-cote", 0); assert.ok(local(r.chest).x > 0.045, "la poitrine à gauche");
  pose("poitrine-avant", pointAt("poitrine-avant", 0, 2)); assert.ok(local(r.chest).z < -0.035, "la poitrine derrière");
  pose("bassin-cote", 0); assert.ok(local(r.pelvis).x > 0.045, "le bassin à gauche");
  pose("bassin-bascule", 0); assert.ok(dir(r.pelvis, new THREE.Vector3(0, 1, 0)).z < -0.15, "le pubis avance : le haut du bassin part en arrière");
  pose("bassin-bascule", pointAt("bassin-bascule", 0, 2)); assert.ok(dir(r.pelvis, new THREE.Vector3(0, 1, 0)).z > 0.15, "les fesses sortent");
  pose("bassin-huit", 1, settings({ huit: "tourne" })); assert.ok(dir(r.pelvis, new THREE.Vector3(1, 0, 0)).z > 0.1, "huit qui tourne : la hanche gauche devant");
  console.log("PASS sens sur le corps : tête, poitrine, bassin (gauche du danseur = +x), miroir");
}
