#!/usr/bin/env node
// #206 (docs/spec-isolations.md) : exercices d'isolation seul, pieds posés, sur un huit qui boucle.
// 1. Le module pur (src/isolations.ts) : catalogue, boucle, chemins (marqué par le centre, lié sans), sens, candidats.
// 2. Le vrai GLB avec applyPose : pieds posés et immobiles, seule la partie nommée bouge, sens réels, boucle fermée.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";

const bundle = new URL("./.test-isolations-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "rigJoints", "isolations"].map(n => `export * from "./src/${n}";`).join("\n"),
  resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href);
unlinkSync(bundle);
const { ISOLATIONS, ISOLATION_IDS, ISOLATION_DEFAULT, ISOLATION_ESSAIS, ISOLATION_AMPLITUDES, AMPLITUDE_LEVELS, isolationAt, isolationPath,
  isolationSettings, isIsolationId } = api;

const STEP = 1 / 32;
const beats = (from, to, step = STEP) => { const out = []; for (let b = from; b <= to + 1e-9; b += step) out.push(b); return out; };
const flat = p => [p.head.nod, p.head.turn, p.head.tilt, p.chest.fore, p.chest.side, p.pelvis.fore, p.pelvis.side, p.pelvis.tilt, p.pelvis.hike, p.pelvis.turn];
const maxDiff = (a, b) => Math.max(...a.map((x, i) => Math.abs(x - b[i])));
const settings = (patch) => ({ ...ISOLATION_DEFAULT, ...patch });
const VARIANTS = [
  ["proposition", ISOLATION_DEFAULT],
  ["deux temps", settings({ rythme: "deuxTemps" })],
  ["continu", settings({ rythme: "continu" })],
  ["fluide", settings({ tenue: 0 })],
  ["huit qui tourne", settings({ huit: "tourne" })],
  ["grand", settings({ amplitude: { cou: 1.5, poitrine: 1.5, bassin: 1.5 } })],
  ["miroir", settings({ miroir: true })],
];
const where = { devant: [1, 0], derriere: [-1, 0], gauche: [0, 1], droite: [0, -1], centre: [0, 0] };
const at = (id, b, s = ISOLATION_DEFAULT) => isolationAt(id, b, s);
const isAt = (id, b, name, s) => { const p = at(id, b, s).path, [f, sd] = where[name]; return Math.abs(p.fore - f) < 1e-9 && Math.abs(p.side - sd) < 1e-9; };

// ---------------------------------------------------------------- 1. module pur
{
  assert.equal(ISOLATION_IDS.length, 19, "dix-huit exercices, le huit dans ses deux sens");
  const codes = ISOLATION_IDS.map(id => ISOLATIONS[id].code);
  assert.equal(new Set(codes).size, 19, "un code par exercice");
  const count = f => ISOLATION_IDS.filter(id => ISOLATIONS[id].famille === f).length;
  assert.deepEqual([count("cou"), count("poitrine"), count("bassin")], [5, 6, 8]);
  assert.ok(isIsolationId("bassin-huit") && !isIsolationId("bassin") && !isIsolationId(null) && !isIsolationId("toString"));
  for (const id of ISOLATION_IDS) assert.ok(!/\d+\s*(cm|mm|°)/.test(ISOLATIONS[id].nom), `${id} : le nom parle en danseur`);
  console.log("PASS catalogue : 19 boucles (cou 5, poitrine 6, bassin 8), noms sans mesure");
}

{
  // Sans interrupteur d'essai, les réglages sont la proposition : les candidats sont inertes.
  assert.deepEqual(isolationSettings(() => false), ISOLATION_DEFAULT);
  assert.equal(isolationSettings(() => false, true).miroir, true);
  const changed = k => Object.entries(isolationSettings(e => e === k)).filter(([f, v]) => JSON.stringify(v) !== JSON.stringify(ISOLATION_DEFAULT[f])).map(([f]) => f);
  for (const k of ISOLATION_ESSAIS) assert.equal(changed(k).length, 1, `${k} ne change qu'un réglage`);
  assert.equal(isolationSettings(e => e === "isoPoitrineGrand").amplitude.poitrine, AMPLITUDE_LEVELS.grand);
  assert.equal(isolationSettings(e => e === "isoCouPetit").amplitude.cou, AMPLITUDE_LEVELS.petit);
  console.log(`PASS candidats : inertes sans ?essai=, chacun ne change qu'un réglage (${ISOLATION_ESSAIS.length})`);
}

{
  // Une boucle d'un huit, sans à-coup, aussi à la couture (7,97 → 8 → 8,03).
  for (const [name, s] of VARIANTS) for (const id of ISOLATION_IDS) {
    for (const b of beats(0, 8, 1 / 8)) assert.ok(maxDiff(flat(at(id, b, s)), flat(at(id, b + 8, s))) < 1e-9, `${id} (${name}) : période 8 au temps ${b}`);
    let previous = flat(at(id, 7.5, s)), worst = 0;
    for (const b of beats(7.5 + 1 / 128, 16.5, 1 / 128)) { const now = flat(at(id, b, s)); worst = Math.max(worst, maxDiff(now, previous)); previous = now; }
    // 1/128 de temps : au plus 0,7 cm et 1,5° (le pas le plus vif est l'aller-retour continu, en grand).
    assert.ok(worst < 0.026, `${id} (${name}) : saut de ${worst.toFixed(4)} en 1/128 de temps`);
    for (const v of flat(at(id, 3.3, s))) assert.ok(Number.isFinite(v));
  }
  console.log(`PASS boucle : période d'un huit et sans saut, couture comprise (${VARIANTS.length} réglages × 19)`);
}

{
  // Seule la partie nommée bouge.
  for (const [name, s] of VARIANTS) for (const id of ISOLATION_IDS) {
    const f = ISOLATIONS[id].famille;
    let moved = 0;
    for (const b of beats(0, 8, 1 / 16)) {
      const p = at(id, b, s);
      const head = [p.head.nod, p.head.turn, p.head.tilt], chest = [p.chest.fore, p.chest.side], pelvis = flat(p).slice(5);
      for (const [part, values] of [["cou", head], ["poitrine", chest], ["bassin", pelvis]]) {
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
    for (const s of [ISOLATION_DEFAULT, settings({ tenue: 0 })]) {
      marked[sens].forEach((name, k) => assert.ok(isAt(`${fam}-cercle-marque${suffix}`, k, name, s), `${fam} marqué${suffix} : ${name} sur ${k + 1}`));
      // Les points de passage du lié sont ceux du marqué sur 1, 3, 5, 7.
      [0, 2, 4, 6].forEach(k => assert.ok(isAt(`${fam}-cercle-lie${suffix}`, k, marked[sens][k], s), `${fam} lié${suffix} : ${marked[sens][k]} sur ${k + 1}`));
      let nearest = Infinity;
      for (const b of beats(0, 8, 1 / 64)) { const p = at(`${fam}-cercle-lie${suffix}`, b, s).path; nearest = Math.min(nearest, Math.hypot(p.fore, p.side)); }
      assert.ok(nearest > 0.999, `${fam} lié${suffix} : ne repasse pas par le centre (${nearest})`);
    }
    // Le marqué est tenu sur son point un instant, puis part ; fluide, il part tout de suite.
    assert.ok(isAt(`${fam}-cercle-marque`, 2.2, "droite", ISOLATION_DEFAULT), "tenu sur 3");
    assert.ok(!isAt(`${fam}-cercle-marque`, 2.2, "droite", settings({ tenue: 0 })), "fluide : déjà parti");
  }
  console.log("PASS cercles : le marqué repasse par le centre sur 2, 4, 6, 8 ; le lié passe aux mêmes points sur 1, 3, 5, 7 sans le centre");
}

{
  // Sens des cercles de la tête : devant (menton en bas), droite (oreille droite vers l'épaule), derrière, gauche.
  const head = (id, b) => at(id, b).head;
  assert.ok(head("cou-cercle", 0).nod > 0 && head("cou-cercle", 2).tilt < 0 && head("cou-cercle", 4).nod < 0 && head("cou-cercle", 6).tilt > 0);
  assert.ok(head("cou-cercle-inverse", 0).nod > 0 && head("cou-cercle-inverse", 2).tilt > 0 && head("cou-cercle-inverse", 6).tilt < 0);
  // La tête en arrière va moins loin qu'en avant.
  assert.ok(-head("cou-cercle", 4).nod < head("cou-cercle", 0).nod && -head("cou-hoche", 4).nod < head("cou-hoche", 0).nod);
  // Tourner et pencher sont deux exercices : l'un tourne seulement, l'autre penche seulement.
  assert.ok(head("cou-tourne", 0).turn > 0 && head("cou-tourne", 0).tilt === 0 && head("cou-tourne", 4).turn < 0);
  assert.ok(head("cou-penche", 0).tilt > 0 && head("cou-penche", 0).turn === 0 && head("cou-penche", 4).tilt < 0);
  // Le cou va deux temps par point : à gauche sur 1, au centre sur 3, à droite sur 5, au centre sur 7.
  ["gauche", "centre", "droite", "centre"].forEach((n, k) => assert.ok(isAt("cou-tourne", 2 * k, n), `cou : ${n} sur ${2 * k + 1}`));
  console.log("PASS tête : cercles dans les deux sens, tête en arrière moins loin, tourner et pencher séparés, deux temps par point");
}

{
  // Allers-retours de la poitrine et du bassin : les trois rythmes.
  ["devant", "centre", "derriere", "centre", "devant", "centre", "derriere", "centre"].forEach((n, k) => assert.ok(isAt("poitrine-avant", k, n), `poitrine : ${n} sur ${k + 1}`));
  ["devant", "centre", "derriere", "centre"].forEach((n, k) => assert.ok(isAt("bassin-bascule", 2 * k, n, settings({ rythme: "deuxTemps" })), `deux temps : ${n} sur ${2 * k + 1}`));
  ["gauche", "droite", "gauche", "droite"].forEach((n, k) => assert.ok(isAt("poitrine-cote", k, n, settings({ rythme: "continu" })), `continu : ${n} sur ${k + 1}`));
  assert.ok(Math.abs(at("poitrine-cote", 0.5, settings({ rythme: "continu" })).path.side) < 1e-9, "continu : passe au centre entre deux temps");
  // Le bassin bascule : avant = le pubis avance ; il glisse de côté en remontant la hanche de ce côté.
  assert.ok(at("bassin-bascule", 0).pelvis.tilt > 0 && at("bassin-bascule", 2).pelvis.tilt < 0);
  const side = at("bassin-cote", 0).pelvis;
  assert.ok(side.side > 0 && side.hike > 0 && side.tilt === 0 && side.fore === 0);
  console.log("PASS allers-retours : un point par temps par le centre (proposition), deux temps, continu");
}

{
  // Le huit : centre sur 1 et 5, chaque côté part par devant (ou par derrière dans l'autre sens).
  for (const [id, sens] of [["bassin-huit", 1], ["bassin-huit-inverse", -1]]) {
    assert.ok(isAt(id, 0, "centre") && isAt(id, 4, "centre") && isAt(id, 2, "gauche") && isAt(id, 6, "droite"), `${id} : centre, gauche, centre, droite`);
    assert.ok(Math.sign(at(id, 1).path.fore) === sens && Math.sign(at(id, 3).path.fore) === -sens, `${id} : à gauche, part par ${sens > 0 ? "devant" : "derrière"}`);
    assert.ok(Math.sign(at(id, 5).path.fore) === sens && Math.sign(at(id, 7).path.fore) === -sens, `${id} : à droite, part par ${sens > 0 ? "devant" : "derrière"}`);
  }
  const tourne = settings({ huit: "tourne" });
  assert.ok(at("bassin-huit", 1, tourne).pelvis.turn < 0 && at("bassin-huit", 5, tourne).pelvis.turn > 0, "la hanche de devant mène");
  assert.ok(Math.abs(Math.max(...beats(0, 8, 1 / 64).map(b => Math.abs(at("bassin-huit", b, tourne).pelvis.turn)))
    - ISOLATION_AMPLITUDES.bassin.eightTurn) < 1e-3, "le huit qui tourne atteint son amplitude");
  assert.ok(beats(0, 8, 1 / 16).every(b => at("bassin-huit", b).pelvis.turn === 0), "proposition : le bassin glisse sans tourner");
  console.log("PASS huit : centre sur 1 et 5, chaque côté part par devant (ou par derrière) ; candidat « tourne »");
}

{
  // Amplitudes et miroir.
  const grand = settings({ amplitude: { cou: AMPLITUDE_LEVELS.grand, poitrine: AMPLITUDE_LEVELS.grand, bassin: AMPLITUDE_LEVELS.grand } });
  for (const id of ISOLATION_IDS) for (const b of [0, 1.3, 2, 5.7]) {
    const a = flat(at(id, b)), g = flat(at(id, b, grand)), m = at(id, b, settings({ miroir: true })), o = at(id, b);
    a.forEach((v, i) => assert.ok(Math.abs(g[i] - 1.5 * v) < 1e-12, `${id} : grand = 1,5 × moyen`));
    assert.ok(m.path.side === -o.path.side && m.path.fore === o.path.fore, `${id} : le miroir échange gauche et droite`);
    assert.ok(Math.abs(m.head.turn + o.head.turn) < 1e-12 && Math.abs(m.head.tilt + o.head.tilt) < 1e-12 && m.head.nod === o.head.nod);
    assert.ok(Math.abs(m.chest.side + o.chest.side) < 1e-12 && Math.abs(m.pelvis.side + o.pelvis.side) < 1e-12 && Math.abs(m.pelvis.hike + o.pelvis.hike) < 1e-12);
  }
  assert.equal(isolationPath("poitrine-cote", 0).side, 1);
  console.log("PASS amplitude (grand = 1,5 × moyen) et miroir (gauche et droite échangés, devant et derrière gardés)");
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
  for (const id of ISOLATION_IDS) {
    const fam = ISOLATIONS[id].famille;
    let feet = 0, soles = Infinity, bones = Infinity, legs = 0, pelvis = 0, chest = 0, chestTurn = 0, chestDrop = 0, chestLow = Infinity, chestHigh = -Infinity, headTurn = 0, headOnChest = 0, jump = 0;
    let previous = null;
    for (const b of beats(0, 8, 1 / 16)) {
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
    assert.ok(jump < 0.012, `${id} (${label}) : saut de ${(jump * 1000).toFixed(1)} mm en 1/16 de temps`);
    report.push(`${ISOLATIONS[id].code} ${((chestHigh - chestLow) * 1000).toFixed(0)}`);
    // La boucle se referme : la pose du temps 8 est celle du temps 0.
    api.applyPose(r, model, 0, { isolation: { id } }); const first = snapshot(r);
    api.applyPose(r, model, 8, { isolation: { id } }); const last = snapshot(r);
    assert.ok(maxDiff(first, last) < 1e-9, `${id} (${label}) : la dernière image enchaîne sur la première`);
  }
  // Après un exercice, la pose ordinaire revient intacte (la tête retrouve sa place).
  api.applyPose(r, model, 2.5, { isolation: { id: "cou-penche" } });
  api.applyPose(r, model, 1.25, {});
  const after = snapshot(r);
  const fresh = fixture(api, where); api.applyPose(fresh.r, fresh.model, 1.25, {});
  assert.ok(maxDiff(after, snapshot(fresh.r)) < 1e-9, `${label} : la pose ordinaire revient intacte`);
  console.log(`PASS GLB (${label}) : pieds posés et immobiles, longueurs, os au-dessus du sol, seule la partie nommée bouge, cage droite et de face, boucle fermée`);
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
  pose("cou-hoche", 4); assert.ok(dir(r.head, new THREE.Vector3(0, 0, 1)).y > 0.25, "le menton en haut");
  pose("poitrine-cote", 0); assert.ok(local(r.chest).x > 0.045, "la poitrine à gauche");
  pose("poitrine-avant", 2); assert.ok(local(r.chest).z < -0.035, "la poitrine derrière");
  pose("bassin-cote", 0); assert.ok(local(r.pelvis).x > 0.045, "le bassin à gauche");
  pose("bassin-bascule", 0); assert.ok(dir(r.pelvis, new THREE.Vector3(0, 1, 0)).z < -0.15, "le pubis avance : le haut du bassin part en arrière");
  pose("bassin-bascule", 2); assert.ok(dir(r.pelvis, new THREE.Vector3(0, 1, 0)).z > 0.15, "les fesses sortent");
  pose("bassin-huit", 1, settings({ huit: "tourne" })); assert.ok(dir(r.pelvis, new THREE.Vector3(1, 0, 0)).z > 0.1, "huit qui tourne : la hanche gauche devant");
  console.log("PASS sens sur le corps : tête, poitrine, bassin (gauche du danseur = +x), miroir");
}
