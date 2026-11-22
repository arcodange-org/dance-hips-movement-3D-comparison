// #132 — planches « mouvements » de l'atlas anatomique (docs/atlas/mouvements/<id>/), sans navigateur.
// Le rig réel (public/anatomy.glb) est posé par le moteur de l'application (src/atlas.ts → src/pose.ts) ;
// on contrôle la ROM sur le quaternion monde du nœud, une preuve indépendante par les positions des
// hanches, les conventions verrouillées, puis la fraîcheur et l'intégrité des fichiers versionnés.
// Spécification : docs/spec-atlas-anatomique.md, D12 à D16.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import {
  ATLAS_CAPTURE, DOCS_DIR, ELECTIONS_DIR, META_FILE, PUBLIC_DIR, README_FILE, ROOT, buildAtlasMeta, buildPlancheReadme, electionFile,
  electionGif, electionPage, gifSequence, loadAtlasApi, measureMovement, readManifest,
} from "./atlas_meta.mjs";
import { fixture } from "./pose_fixture.mjs";

const api = await loadAtlasApi();
const manifest = readManifest();
const near = (a, b, tolerance, label) => assert.ok(Math.abs(a - b) <= tolerance, `${label} : ${a} vs ${b} (tolérance ${tolerance})`);

// 1. Fonctions pures : angles de la ROM, état de la vue lu dans l'URL, vues caméra, séquence des GIF.
{
  assert.deepEqual(api.atlasAngles({ romDeg: [-10, 10] }, 9), [-10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10]);
  assert.deepEqual(api.atlasAngles({ romDeg: [0, 90] }, 2), [0, 90]);
  assert.throws(() => api.atlasAngles({ romDeg: [0, 90] }, 1), RangeError);
  const state = api.parseAtlasParams(new URLSearchParams("atlas=bassin-obliquite"));
  assert.deepEqual(state, { id: "bassin-obliquite", vue: "face", frame: 4, frames: 9, muscles: true, variante: null }, "défauts : frame du milieu, muscles, règle versionnée");
  assert.deepEqual(api.parseAtlasParams(new URLSearchParams("atlas=x&vue=inconnue&frame=99&frames=5&muscles=0")),
    { id: "x", vue: "face", frame: 4, frames: 5, muscles: false, variante: null }, "vue inconnue et frame hors bornes ramenées");
  assert.equal(api.atlasKey(state), "bassin-obliquite|face|4/9");
  assert.deepEqual(api.parseAtlasParams(new URLSearchParams(api.atlasQuery(state))), state, "atlasQuery se relit à l'identique");
  // D14 : sans variante, l'URL et la clé de rendu sont celles des planches versionnées ; la variante s'y ajoute.
  assert.equal(api.atlasQuery(state), "atlas=bassin-obliquite&vue=face&frame=4&frames=9&muscles=1");
  const varie = api.parseAtlasParams(new URLSearchParams("atlas=bassin-obliquite&variante=relais"));
  assert.equal(varie.variante, "relais");
  assert.equal(api.atlasKey(varie), "bassin-obliquite|face|4/9|relais");
  assert.deepEqual(api.parseAtlasParams(new URLSearchParams(api.atlasQuery(varie))), varie, "atlasQuery garde la variante");
  assert.equal(api.atlasAngleLabel(7.5), "+7,5°"); assert.equal(api.atlasAngleLabel(-10), "−10°"); assert.equal(api.atlasAngleLabel(0), "0°");
  // Vues : cinq azimuts autour de la cible du preset ; distance et élévation conservées.
  const preset = api.CAM_PRESETS[api.ATLAS_CAM], base = api.viewAnglesOf(preset.position, preset.target);
  for (const vue of manifest.views) {
    assert.ok(vue in api.ATLAS_VIEWS, `vue du manifeste connue des caméras : ${vue}`);
    for (const cote of ["les deux", "R"]) {
      const view = api.atlasView(vue, cote), angles = api.viewAnglesOf(view.position, view.target);
      near(angles.dist, base.dist, 1e-9, `distance ${vue}`); near(angles.el, base.el, 1e-9, `élévation ${vue}`);
      const expected = api.ATLAS_VIEWS[vue] * (cote === "R" ? -1 : 1);
      near(Math.cos((angles.az - expected) * Math.PI / 180), 1, 1e-12, `azimut ${vue} ${cote}`);
    }
  }
  assert.ok(api.atlasView("face").position[2] > 0 && api.atlasView("dos").position[2] < 0, "face devant (+z), dos derrière");
  assert.ok(api.atlasView("profil").position[0] > 0, "profil : caméra à la gauche du sujet (+x)");
  assert.ok(api.atlasView("profil", "R").position[0] < 0, "mouvement du côté droit : caméra à droite du sujet (x < 0)");
  assert.deepEqual(gifSequence(4), [0, 0, 0, 1, 2, 3, 3, 3, 2, 1]);
  console.log("PASS atlas planches : angles de la ROM, état de la vue ?atlas=, cinq vues caméra, séquence des GIF");
}

// 2. Pose neutre du moteur (D7) : ni mouvement ni posture de style ; un style à amplitude nulle garde,
// lui, sa posture de danse — c'est pourquoi l'option existe.
{
  const f = fixture(api);
  const neutral = api.applyPose(f.r, f.model, 0, { neutral: true, amp: 0 });
  const minimalKnee = 0.12 * 180 / Math.PI;
  near(neutral.kneeR, minimalKnee, 0.3, "genou droit neutre au minimum de l'IK");
  near(neutral.kneeL, minimalKnee, 0.3, "genou gauche neutre au minimum de l'IK");
  near(neutral.trunkTilt, 0, 1e-6, "thorax vertical en pose neutre");
  near(neutral.roll, 0, 1e-9, "bassin sans roulis en pose neutre");
  const style = api.applyPose(f.r, f.model, 0, { styleKey: "kizomba", amp: 0 });
  assert.ok(style.kneeR > 20 && style.trunkTilt > 3, `kizomba à amplitude nulle garde sa posture (genou ${style.kneeR.toFixed(1)}°, thorax ${style.trunkTilt.toFixed(1)}°)`);
  console.log(`PASS atlas planches : pose neutre du moteur (genoux ${neutral.kneeR.toFixed(1)}°/${neutral.kneeL.toFixed(1)}°, thorax 0°) distincte d'un style à amplitude nulle (genoux ${style.kneeR.toFixed(1)}°, thorax ${style.trunkTilt.toFixed(1)}°)`);
}

// 3. Les mouvements sans règle de pose sont refusés explicitement et n'ont pas de planche.
{
  const unsupported = manifest.mouvements.filter(m => !api.atlasSupport(m).ok);
  for (const m of unsupported) {
    assert.throws(() => buildAtlasMeta(api, manifest, m.id), /règle de pose non écrite/, `refus explicite : ${m.id}`);
    assert.throws(() => api.applyAtlasPose(null, null, m, 0), /règle de pose non écrite/, `le moteur de l'atlas refuse aussi : ${m.id}`);
    assert.ok(!existsSync(join(DOCS_DIR, m.id)), `pas de planche pour un mouvement non posé : ${m.id}`);
  }
  assert.throws(() => buildAtlasMeta(api, manifest, "bassin-obliquite", { vues: ["face", "plongee"] }), /vues inconnues/);
  assert.throws(() => buildAtlasMeta(api, manifest, "bassin-obliquite", { frames: 99 }), /--frames entre 2 et/);
  assert.throws(() => buildAtlasMeta(api, manifest, "inexistant"), /absent du manifeste/);
  console.log(`PASS atlas planches : ${unsupported.length} mouvements sans règle de pose refusés explicitement, sans planche ; vues, frames et ids invalides refusés`);
}

// Preuve par les positions (D12 contrôle 2, D13) : un vecteur lié au bassin (« hanche droite → hanche gauche »
// ou « milieu des hanches → centre du sacrum ») suit la rotation rigide de l'angle commandé autour de l'axe
// monde anatomique. Renvoie l'erreur maximale (mm) et l'amplitude (mm) de la composante `composante` (0 = x,
// 1 = y, 2 = z) du vecteur mesuré.
function rigidEvidence(measured, vecteur, monde, composante) {
  const v0 = new THREE.Vector3(...measured.neutral[vecteur]), axis = new THREE.Vector3(...monde);
  let error = 0, low = Infinity, high = -Infinity;
  for (const s of measured.samples) {
    const actual = new THREE.Vector3(...s.mesure[vecteur]);
    error = Math.max(error, v0.clone().applyAxisAngle(axis, s.angleDeg * Math.PI / 180).distanceTo(actual) * 1000);
    low = Math.min(low, actual.getComponent(composante) * 1000); high = Math.max(high, actual.getComponent(composante) * 1000);
  }
  return { error, amplitude: high - low };
}

// Ce que chaque planche du bassin doit montrer, écrit ici sans lire le manifeste : axe monde anatomique (sujet
// face à +z, côté droit en x < 0), vecteur et composante qui varient, amplitude minimale (mm), sens de variation
// quand l'angle croît, convention de signe attendue dans meta.json, et un axe erroné qui doit être détecté.
const PREUVES = {
  "bassin-obliquite": { axe: "z", monde: [0, 0, 1], vecteur: "hanches", composante: 1, amplitudeMm: 40, sens: 1, signe: /hanche gauche monte/, faux: "x" },
  "bassin-rotation": { axe: "y", monde: [0, 1, 0], vecteur: "hanches", composante: 2, amplitudeMm: 80, sens: -1, signe: /hanche droite avance/, faux: "z" },
  "bassin-anteversion": { axe: "x", monde: [1, 0, 0], vecteur: "sacrum", composante: 1, amplitudeMm: 15, sens: 1, signe: /vers l'avant \(antéversion\)/, faux: "y" },
};

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pngSize = (bytes, label) => {
  assert.ok(bytes.subarray(0, 8).equals(PNG) && bytes.toString("latin1", 12, 16) === "IHDR", `signature PNG : ${label}`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

/** Égalité structurelle, tolérante sur les seuls nombres mesurés (0,5 mm ; 0,05° sinon). */
function assertFresh(actual, expected, path, hint) {
  if (typeof expected === "number" && typeof actual === "number") {
    const tolerance = /Mm$/.test(path.split(".").at(-1)) ? 0.5 : 0.05;
    assert.ok(Math.abs(actual - expected) <= tolerance, `${path} périmé : ${actual} versionné, ${expected} recalculé. ${hint}`);
  } else if (Array.isArray(expected) || (expected && typeof expected === "object")) {
    assert.ok(actual && typeof actual === "object", `${path} absent ou mal formé. ${hint}`);
    assert.deepEqual(Object.keys(actual), Object.keys(expected), `${path} : clés différentes. ${hint}`);
    for (const key of Object.keys(expected)) assertFresh(actual[key], expected[key], `${path}.${key}`, hint);
  } else assert.equal(actual, expected, `${path} périmé. ${hint}`);
}

// 4. Chaque planche versionnée.
const planches = existsSync(DOCS_DIR) ? readdirSync(DOCS_DIR).filter(d => statSync(join(DOCS_DIR, d)).isDirectory()).sort() : [];
for (const id of Object.keys(PREUVES)) assert.ok(planches.includes(id), `la planche ${id} est versionnée`);
for (const id of planches) {
  const dir = join(DOCS_DIR, id), served = join(PUBLIC_DIR, id);
  const mouvement = manifest.mouvements.find(m => m.id === id);
  assert.ok(mouvement, `planche ${id} : mouvement présent dans le manifeste`);
  const meta = JSON.parse(readFileSync(join(dir, META_FILE), "utf8"));
  const frames = meta.capture.frames, hint = `Relancer : ${meta.capture.commande} (ou --meta-seul si les images sont inchangées).`;
  const measured = measureMovement(api, mouvement, frames);
  const { r, model, outer } = measured.fixture;

  // 4a. ROM : l'angle mesuré sur le quaternion monde du nœud GLB suit l'angle commandé, sur l'axe attendu.
  for (const s of measured.samples) {
    near(s.mesure.angleDeg, s.angleDeg, 0.01, `${id} image ${s.index} : angle mesuré`);
    near(s.mesure.horsAxeDeg, 0, 0.01, `${id} image ${s.index} : rotation hors de l'axe`);
  }
  const angles = measured.samples.map(s => s.mesure.angleDeg);
  near(Math.min(...angles), mouvement.romDeg[0], 0.01, `${id} : borne basse de la ROM`);
  near(Math.max(...angles), mouvement.romDeg[1], 0.01, `${id} : borne haute de la ROM`);

  // 4b. Repère anatomique lu sur le GLB : côté droit en x < 0, orteils devant les talons (+z).
  api.applyAtlasPose(r, model, mouvement, 0);
  r.root.updateWorldMatrix(true, true);
  assert.ok(r.hipR.getWorldPosition(new THREE.Vector3()).x < 0 && r.hipL.getWorldPosition(new THREE.Vector3()).x > 0, "hanche droite en x < 0");
  for (const side of ["L", "R"]) assert.ok(model.legs[side].ball.z > model.legs[side].heel.z, "le sujet regarde +z (avant-pied devant le talon)");

  // 4b bis. Preuve par les positions, propre au bassin : axe monde anatomique, vecteurs liés au bassin en
  // rotation rigide, composante du repère qui varie dans le sens écrit dans meta.json, axe erroné détecté.
  let detail = "";
  const preuve = PREUVES[id], first = measured.samples[0], last = measured.samples.at(-1), minimalKnee = 0.12 * 180 / Math.PI;
  assert.ok(preuve, `${id} : preuve par les positions déclarée pour chaque planche du bassin`);
  assert.equal(mouvement.axeLocal, preuve.axe, `${id} : axe local ${preuve.axe}`);
  near(measured.reference.axe.dot(new THREE.Vector3(...preuve.monde)), 1, 1e-9, `${id} : axe monde anatomique`);
  for (const vecteur of ["hanches", "sacrum"]) {
    const rigid = rigidEvidence(measured, vecteur, preuve.monde, preuve.composante);
    assert.ok(rigid.error <= 0.01, `${id} : le vecteur « ${vecteur} » suit la rotation rigide attendue (écart ${rigid.error} mm)`);
  }
  const evidence = rigidEvidence(measured, preuve.vecteur, preuve.monde, preuve.composante);
  assert.ok(evidence.amplitude >= preuve.amplitudeMm, `${id} : amplitude du repère de position ${evidence.amplitude.toFixed(1)} mm`);
  const repere = (sample) => sample[preuve.vecteur][preuve.composante];
  assert.ok(preuve.sens * (repere(last.mesure) - repere(measured.neutral)) > 0 && preuve.sens * (repere(first.mesure) - repere(measured.neutral)) < 0,
    `${id} : le repère varie dans le sens attendu de part et d'autre de la pose neutre`);
  assert.match(meta.articulation.signe, preuve.signe, `${id} : convention de signe écrite dans meta.json`);
  // Contre-épreuve : posé autour d'un autre axe, le repère ne varie plus et la rotation rigide attendue n'est plus suivie.
  const wrong = rigidEvidence(measureMovement(api, { ...mouvement, axeLocal: preuve.faux }, frames), preuve.vecteur, preuve.monde, preuve.composante);
  assert.ok(wrong.amplitude < 1 && wrong.error > 10, `${id} : un axe erroné est détecté (amplitude ${wrong.amplitude.toFixed(2)} mm, erreur ${wrong.error.toFixed(1)} mm)`);
  const millimetres = (sample) => (repere(sample) * 1000).toFixed(1);
  if (id !== "bassin-obliquite") {
    // Rotation et antéversion : les hanches restent à la même hauteur, le bassin ne descend pas, les genoux
    // restent près du minimum de l'IK (aucune jambe n'a à fléchir).
    for (const s of measured.samples) {
      near(s.mesure.ecartHanchesMm, measured.neutral.ecartHanchesMm, 0.2, `${id} image ${s.index} : hauteur relative des hanches inchangée`);
      near(s.mesure.bassinMm, measured.neutral.bassinMm, 0.5, `${id} image ${s.index} : hauteur du bassin inchangée`);
      for (const side of ["R", "L"]) assert.ok(s.mesure.genouDeg[side] <= minimalKnee + 1, `${id} image ${s.index} : genou ${side} près du minimum de l'IK`);
    }
  }
  if (id === "bassin-rotation")
    detail = `, hanche gauche de ${millimetres(first.mesure)} à ${millimetres(last.mesure)} mm d'avant en arrière, thorax de face, axe erroné détecté`;
  if (id === "bassin-anteversion") {
    // Les centres de hanche sont sur l'axe de bascule : ils ne bougent pas.
    for (const s of measured.samples)
      assert.ok(new THREE.Vector3(...s.mesure.hanches).distanceTo(new THREE.Vector3(...measured.neutral.hanches)) <= 0.0005, `${id} image ${s.index} : hanches immobiles`);
    detail = `, sacrum de ${millimetres(first.mesure)} à ${millimetres(last.mesure)} mm au-dessus de l'axe des hanches, hanches immobiles, axe erroné détecté`;
  }
  if (id === "bassin-obliquite") {
    // Chaîne fermée, règle retenue « genoux chevauchés » (D15) : le genou du côté qui descend est le plus fléchi,
    // les deux genoux bougent en sens inverse sans palier, et la hauteur du bassin ne change pas.
    assert.equal(meta.regle?.id, "chevauchement", `${id} : règle de pose écrite dans meta.json`);
    for (const s of measured.samples) {
      const [down, up] = s.angleDeg > 0 ? ["R", "L"] : ["L", "R"];
      if (s.angleDeg !== 0) assert.ok(s.mesure.genouDeg[down] > s.mesure.genouDeg[up] + 2, `${id} image ${s.index} : genou ${down} plus fléchi`);
      near(s.mesure.bassinMm, measured.neutral.bassinMm, 0.001, `${id} image ${s.index} : hauteur du bassin constante`);
    }
    const knees = measured.samples.map(s => s.mesure.genouDeg);
    assert.ok(knees.every((k, i) => i === 0 || (k.R > knees[i - 1].R && k.L < knees[i - 1].L)), `${id} : genoux en sens inverse, sans palier`);
    near(Math.min(first.mesure.genouDeg.R, last.mesure.genouDeg.L), minimalKnee, 0.5, `${id} : aux extrêmes, la jambe haute est près du minimum de l'IK`);
    detail = `, hanches ${first.mesure.ecartHanchesMm.toFixed(1)} à ${last.mesure.ecartHanchesMm.toFixed(1)} mm, genoux ${measured.neutral.genouDeg.R.toFixed(1)}°/${
      measured.neutral.genouDeg.L.toFixed(1)}° au centre et jusqu'à ${Math.max(...knees.map(k => k.R)).toFixed(1)}°, bassin à hauteur constante, axe erroné détecté`;
  }

  // 4c. Conventions verrouillées après pose : sol, chevilles sur leurs cibles, longueurs, thorax vertical.
  let ankleError = 0, footDrift = 0;
  const planted = {};
  for (const s of measured.samples) {
    assert.ok(s.solMm >= -0.1, `${id} image ${s.index} : sommets osseux au-dessus du sol (${s.solMm} mm)`);
    near(s.mesure.thoraxDeg, 0, 0.01, `${id} image ${s.index} : thorax vertical (iso=1)`);
    near(s.mesure.thoraxRotationDeg, 0, 0.01, `${id} image ${s.index} : thorax dans son orientation neutre, tous axes (D13)`);
    api.applyAtlasPose(r, model, mouvement, s.angleDeg);
    r.root.updateWorldMatrix(true, true);
    for (const side of ["L", "R"]) {
      const hip = r["hip" + side].getWorldPosition(new THREE.Vector3()), knee = r["knee" + side].getWorldPosition(new THREE.Vector3());
      const foot = r["foot" + side].getWorldPosition(new THREE.Vector3());
      near(hip.distanceTo(knee), model.legs[side].length1, 1e-9, "longueur du fémur");
      near(knee.distanceTo(foot), model.legs[side].length2, 1e-9, "longueur du tibia");
      ankleError = Math.max(ankleError, foot.distanceTo(outer.localToWorld(model.targets[side].clone())));
      planted[side] ??= foot.clone();
      footDrift = Math.max(footDrift, foot.distanceTo(planted[side]));
    }
  }
  assert.ok(ankleError <= 0.001, `${id} : chevilles sur leurs cibles (${ankleError} m)`);
  assert.ok(footDrift <= 0.001, `${id} : pieds plantés sur toute la ROM (${footDrift} m)`);

  // 4d. Fraîcheur : meta.json et README.md versionnés = recalculés par le moteur et le manifeste courants.
  const expected = buildAtlasMeta(api, manifest, id, { frames, vues: meta.vues.map(v => v.id), muscles: meta.capture.muscles });
  assertFresh(meta, expected, "meta", hint);
  assert.equal(readFileSync(join(dir, README_FILE), "utf8"), buildPlancheReadme(api, meta), `README.md de la planche ${id} périmé. ${hint}`);
  assert.deepEqual(meta.vues.map(v => v.id), manifest.views, `${id} : toutes les vues du manifeste`);

  // 4e. Fichiers : tous présents, bien formés, rien de périmé ; copies servies identiques.
  const { largeurPx, hauteurPx } = meta.capture;
  assert.deepEqual([largeurPx, hauteurPx], [ATLAS_CAPTURE.largeurPx, ATLAS_CAPTURE.hauteurPx], "taille de capture courante");
  const listed = new Set([META_FILE, README_FILE, meta.fichiers.planche, ...Object.values(meta.fichiers.gifs), ...Object.values(meta.fichiers.images).flat()]);
  for (const vue of meta.vues) {
    assert.equal(meta.fichiers.images[vue.id].length, frames, `${id} ${vue.id} : une image par frame`);
    for (const file of meta.fichiers.images[vue.id])
      assert.deepEqual(pngSize(readFileSync(join(dir, file)), file), [largeurPx, hauteurPx], `dimensions de ${file}`);
    const gif = readFileSync(join(dir, meta.fichiers.gifs[vue.id]));
    assert.equal(gif.toString("latin1", 0, 6), "GIF89a", `signature GIF : ${vue.id}`);
    assert.deepEqual([gif.readUInt16LE(6), gif.readUInt16LE(8)], [largeurPx, hauteurPx], `dimensions du GIF ${vue.id}`);
  }
  const [sheetWidth, sheetHeight] = pngSize(readFileSync(join(dir, meta.fichiers.planche)), meta.fichiers.planche);
  assert.ok(sheetWidth >= frames * largeurPx / 2 && sheetHeight >= meta.vues.length * (hauteurPx / 2 - 40), `planche composite ${sheetWidth}×${sheetHeight}`);
  assert.deepEqual(readdirSync(dir).sort(), [...listed].sort(), `${id} : aucun fichier périmé ou manquant dans docs/`);
  assert.deepEqual(readdirSync(served).sort(), [...meta.fichiers.servis].sort(), `${id} : public/ ne contient que les assets servis`);
  for (const file of meta.fichiers.servis)
    assert.ok(readFileSync(join(served, file)).equals(readFileSync(join(dir, file))), `${id} : copie servie identique (${file})`);

  // 4f. Provenance honnête, niveau de preuve et attribution.
  assert.match(meta.generation, /ni capture de mouvement, ni photo de modèle, ni relecture par un professeur d'anatomie/);
  assert.equal(meta.niveauDePreuve, mouvement.preuve, "niveau de preuve repris du manifeste");
  assert.match(meta.licence.maillages, /DBCLS/); assert.match(meta.licence.maillages, /CC BY-SA 2\.1 Japan/);
  assert.match(meta.licence.attribution, /BodyParts3D v4\.0, © DBCLS, CC BY-SA 2\.1 Japan/);

  console.log(`PASS atlas planche ${id} : ROM mesurée ${Math.min(...angles).toFixed(2)} à ${Math.max(...angles).toFixed(2)}° sur le nœud ${mouvement.articulation}${detail} ; sol, chevilles (${(ankleError * 1000).toFixed(3)} mm), pieds plantés, thorax immobile ; meta.json et README à jour ; ${listed.size} fichiers, copies servies identiques`);
}

// 5. Élection de la règle de pose de l'obliquité (D14, D15) : « genoux chevauchés » retenue, « genoux en relais »
// en variante ; les deux mesurées sur le GLB, face à face.
{
  const id = "bassin-obliquite", frames = 17, minimalKnee = 0.12 * 180 / Math.PI;
  const mouvement = manifest.mouvements.find(m => m.id === id), election = api.ATLAS_ELECTIONS[id];
  assert.deepEqual(Object.keys(api.ATLAS_ELECTIONS), [id, "bassin-rotation"], "élections de règle de pose : obliquité (D14, D15), rotation (D16)");
  assert.deepEqual(election.regles.map(r => `${r.lettre} ${r.id}`), ["A relais", "B chevauchement"], "lettres du vote");
  assert.equal(election.retenue, "chevauchement", "règle retenue : le vote du propriétaire (B)");
  assert.equal(election.danse, "chevauchement", "pour la danse, la même règle (D15, D17)");
  const retenue = api.atlasRegle(mouvement, null), variante = api.atlasRegle(mouvement, "relais");
  assert.ok(retenue.ok && retenue.regle.id === "chevauchement" && !retenue.variante, "sans variante : la règle retenue");
  assert.ok(variante.ok && variante.regle.id === "relais" && variante.variante, "« relais » est la variante");
  assert.ok(api.atlasRegle(mouvement, "chevauchement").ok && !api.atlasRegle(mouvement, "chevauchement").variante, "la règle retenue peut être nommée");
  // Refus explicites : règle inconnue, variante demandée pour un mouvement sans élection.
  const anteversion = manifest.mouvements.find(m => m.id === "bassin-anteversion");
  assert.deepEqual(api.atlasRegle(anteversion, null), { ok: true, regle: null, variante: false }, "mouvement sans élection : pas de règle nommée");
  assert.equal(api.atlasRegle(mouvement, "inconnue").ok, false);
  const refusal = fixture(api);
  assert.throws(() => api.applyAtlasPose(refusal.r, refusal.model, mouvement, 0, "inconnue"), /variante « inconnue » inconnue pour bassin-obliquite \(règles : relais, chevauchement\)/);
  assert.throws(() => api.applyAtlasPose(refusal.r, refusal.model, anteversion, 0, "relais"), /ce mouvement n'a pas de variante/);

  const relais = measureMovement(api, mouvement, frames, "relais"), chevauche = measureMovement(api, mouvement, frames, "chevauchement");
  // Sans variante, la planche est posée par la règle retenue.
  for (const [index, s] of measureMovement(api, mouvement, frames).samples.entries()) {
    const nommee = chevauche.samples[index].mesure;
    assert.ok(s.mesure.bassinMm === nommee.bassinMm && s.mesure.genouDeg.R === nommee.genouDeg.R && s.mesure.genouDeg.L === nommee.genouDeg.L,
      `${id} image ${index} : sans variante, la pose est celle de la règle retenue`);
  }
  const heights = relais.samples.map(s => s.mesure.bassinMm), basse = Math.min(...heights), rebond = Math.max(...heights) - basse;
  assert.ok(rebond >= 10, `relais : le bassin remonte au centre (${rebond.toFixed(1)} mm), c'est ce que la règle retenue supprime`);
  const { r, model, outer } = chevauche.fixture;
  let ankleError = 0, footDrift = 0;
  const planted = {};
  for (const [index, s] of chevauche.samples.entries()) {
    const autre = relais.samples[index], label = `${id} chevauchement image ${index}`;
    near(s.mesure.bassinMm, basse, 0.001, `${label} : bassin à sa hauteur la plus basse de la ROM`);
    for (const [nom, sample] of [["chevauchement", s], ["relais", autre]]) {
      near(sample.mesure.angleDeg, sample.angleDeg, 0.01, `${id} ${nom} image ${index} : angle de bassin mesuré`);
      near(sample.mesure.horsAxeDeg, 0, 0.01, `${id} ${nom} image ${index} : rotation hors de l'axe`);
      near(sample.mesure.thoraxRotationDeg, 0, 0.01, `${id} ${nom} image ${index} : thorax dans son orientation neutre`);
      assert.ok(sample.solMm >= -0.1, `${id} ${nom} image ${index} : sommets osseux au-dessus du sol (${sample.solMm} mm)`);
    }
    assert.ok(new THREE.Vector3(...s.mesure.hanches).distanceTo(new THREE.Vector3(...autre.mesure.hanches)) <= 1e-9, `${label} : même orientation du bassin dans les deux règles`);
    for (const side of ["R", "L"])
      assert.ok(s.mesure.genouDeg[side] >= autre.mesure.genouDeg[side] - 0.01, `${label} : genou ${side} au moins aussi fléchi qu'en relais`);
    // Relais : la jambe du côté haut reste au minimum de l'IK.
    near(Math.min(autre.mesure.genouDeg.R, autre.mesure.genouDeg.L), minimalKnee, 0.3, `${id} relais image ${index} : jambe haute au minimum de l'IK`);
    for (const regle of ["chevauchement", "relais"]) {
      api.applyAtlasPose(r, model, mouvement, s.angleDeg, regle);
      r.root.updateWorldMatrix(true, true);
      for (const side of ["L", "R"]) {
        const hip = r["hip" + side].getWorldPosition(new THREE.Vector3()), knee = r["knee" + side].getWorldPosition(new THREE.Vector3());
        const foot = r["foot" + side].getWorldPosition(new THREE.Vector3());
        near(hip.distanceTo(knee), model.legs[side].length1, 1e-9, "longueur du fémur");
        near(knee.distanceTo(foot), model.legs[side].length2, 1e-9, "longueur du tibia");
        ankleError = Math.max(ankleError, foot.distanceTo(outer.localToWorld(model.targets[side].clone())));
        planted[side] ??= foot.clone();
        footDrift = Math.max(footDrift, foot.distanceTo(planted[side]));
      }
    }
  }
  assert.ok(ankleError <= 0.001 && footDrift <= 0.001, `${id} : chevilles sur leurs cibles (${ankleError} m), pieds plantés (${footDrift} m), dans les deux règles`);
  // Au centre : deux genoux fléchis du même angle (règle retenue), presque tendus (relais).
  const centre = chevauche.samples.find(s => s.angleDeg === 0).mesure, centreRelais = relais.samples.find(s => s.angleDeg === 0).mesure;
  near(centre.genouDeg.R, centre.genouDeg.L, 0.5, "chevauchement : deux genoux du même angle au centre");
  assert.ok(Math.min(centre.genouDeg.R, centre.genouDeg.L) >= minimalKnee + 10, `chevauchement : deux genoux nettement fléchis au centre (${centre.genouDeg.R.toFixed(1)}°)`);
  assert.ok(Math.max(centreRelais.genouDeg.R, centreRelais.genouDeg.L) <= minimalKnee + 0.3, "relais : deux genoux au minimum de l'IK au centre");
  // Règle retenue : les genoux bougent en sens inverse sur toute la ROM, sans palier.
  const knees = chevauche.samples.map(s => s.mesure.genouDeg);
  assert.ok(knees.every((k, i) => i === 0 || (k.R > knees[i - 1].R && k.L < knees[i - 1].L)), "chevauchement : genoux en sens inverse, sans palier");
  // À la borne la plus basse, les deux règles donnent la même pose.
  const low = heights.indexOf(basse);
  for (const side of ["R", "L"]) near(chevauche.samples[low].mesure.genouDeg[side], relais.samples[low].mesure.genouDeg[side], 0.01, "pose identique à la borne la plus basse");
  // GIF comparatif et page d'élection versionnés ; le vote y est recopié mot pour mot.
  assert.equal(electionGif(election), "docs/gifs/election-obliquite-genoux.gif");
  const gif = readFileSync(join(ELECTIONS_DIR, electionFile(election)));
  assert.equal(gif.toString("latin1", 0, 6), "GIF89a", "signature du GIF comparatif");
  const page = readFileSync(join(ROOT, electionPage(election)), "utf8");
  assert.ok(page.includes(electionFile(election)), "la page d'élection montre le GIF");
  assert.ok(page.includes("c'est bien de montrer les 2, mais pour la danse on veut B"), "le vote du propriétaire est recopié mot pour mot");
  assert.match(page, /BodyParts3D v4\.0, © DBCLS, CC BY-SA 2\.1 Japan/, "attribution sur la page d'élection");
  console.log(`PASS atlas élection ${election.id} : règle retenue ${election.retenue} (bassin constant à ${basse.toFixed(1)} mm, genoux ${centre.genouDeg.R.toFixed(1)}°/${centre.genouDeg.L.toFixed(1)}° au centre), variante relais (rebond de ${rebond.toFixed(1)} mm, genoux ${centreRelais.genouDeg.R.toFixed(1)}°/${centreRelais.genouDeg.L.toFixed(1)}° au centre) ; même angle de bassin, sol, pieds plantés, thorax immobile dans les deux ; règles inconnues refusées ; GIF, page d'élection et vote présents`);
}

// 6. Élection de la règle de pose de la rotation (D16) : « thorax de face » (A, règle de la planche) ou
// « buste solidaire » (B) ou « thorax à l'opposé » (C), variantes. Vote attendu.
{
  const id = "bassin-rotation", frames = 17;
  const mouvement = manifest.mouvements.find(m => m.id === id), election = api.ATLAS_ELECTIONS[id];
  assert.equal(election.id, "rotation-buste");
  assert.deepEqual(election.regles.map(r => `${r.lettre} ${r.id}`), ["A thorax-face", "B solidaire", "C oppose"], "lettres de l'élection");
  assert.equal(election.retenue, "thorax-face", "vote D17 : la planche reste en A");
  assert.equal(election.danse, "oppose", "vote D17 : pour la danse, C");
  const meta = JSON.parse(readFileSync(join(DOCS_DIR, id, META_FILE), "utf8"));
  assert.equal(meta.regle?.danse, "oppose", "meta.json nomme la règle de la danse");
  assert.ok(readFileSync(join(DOCS_DIR, id, README_FILE), "utf8").includes("Pour la danse : **thorax à l'opposé** (C)"), "la page de la planche nomme la règle de la danse");
  const retenue = api.atlasRegle(mouvement, null), variante = api.atlasRegle(mouvement, "solidaire");
  assert.ok(retenue.ok && retenue.regle.id === "thorax-face" && !retenue.variante, "sans variante : la règle retenue");
  assert.ok(variante.ok && variante.regle.id === "solidaire" && variante.variante, "« solidaire » est la variante");
  const refusal = fixture(api);
  assert.throws(() => api.applyAtlasPose(refusal.r, refusal.model, mouvement, 0, "chevauchement"),
    /variante « chevauchement » inconnue pour bassin-rotation \(règles : thorax-face, solidaire, oppose\)/, "une règle d'une autre élection est refusée");

  const face = measureMovement(api, mouvement, frames, "thorax-face"), solidaire = measureMovement(api, mouvement, frames, "solidaire");
  const oppose = measureMovement(api, mouvement, frames, "oppose");
  for (const [index, s] of measureMovement(api, mouvement, frames).samples.entries())
    assert.ok(s.mesure.thoraxRotationDeg === face.samples[index].mesure.thoraxRotationDeg && s.mesure.hanches.every((v, k) => v === face.samples[index].mesure.hanches[k]),
      `${id} image ${index} : sans variante, la pose est celle de la règle retenue`);
  const { r, model } = solidaire.fixture, planted = {};
  let footDrift = 0, torsionMax = 0;
  for (const [index, a] of face.samples.entries()) {
    const b = solidaire.samples[index], c = oppose.samples[index], label = `${id} image ${index}`;
    for (const [nom, s] of [["thorax-face", a], ["solidaire", b], ["oppose", c]]) {
      near(s.mesure.angleDeg, s.angleDeg, 0.01, `${label} ${nom} : angle de bassin mesuré`);
      near(s.mesure.horsAxeDeg, 0, 0.01, `${label} ${nom} : rotation hors de l'axe`);
      assert.ok(s.solMm >= -0.1, `${label} ${nom} : sommets osseux au-dessus du sol (${s.solMm} mm)`);
    }
    for (const autre of [b, c])
      assert.ok(new THREE.Vector3(...a.mesure.hanches).distanceTo(new THREE.Vector3(...autre.mesure.hanches)) <= 1e-6, `${label} : même repère de bassin (hanches) dans les trois règles`);
    near(c.mesure.thoraxLacetDeg, -c.angleDeg, 0.5, `${label} oppose : le thorax tourne du même angle en sens inverse`);
    near(c.mesure.thoraxRotationDeg, Math.abs(c.angleDeg), 0.5, `${label} oppose : le thorax ne tourne qu'autour de la verticale`);
    near(a.mesure.thoraxRotationDeg, 0, 0.01, `${label} thorax-face : thorax dans son orientation neutre`);
    near(b.mesure.thoraxLacetDeg, b.angleDeg, 0.5, `${label} solidaire : le thorax tourne du même angle que le bassin`);
    near(b.mesure.thoraxRotationDeg, Math.abs(b.angleDeg), 0.5, `${label} solidaire : le thorax ne tourne qu'autour de la verticale`);
    torsionMax = Math.max(torsionMax, Math.abs(b.angleDeg - b.mesure.thoraxLacetDeg));
    for (const regle of ["thorax-face", "solidaire", "oppose"]) {
      api.applyAtlasPose(r, model, mouvement, a.angleDeg, regle);
      r.root.updateWorldMatrix(true, true);
      for (const side of ["L", "R"]) {
        const foot = r["foot" + side].getWorldPosition(new THREE.Vector3());
        planted[side] ??= foot.clone();
        footDrift = Math.max(footDrift, foot.distanceTo(planted[side]));
      }
    }
  }
  assert.ok(footDrift <= 0.001, `${id} : pieds plantés dans les trois règles (${footDrift} m)`);
  // Contre-épreuve : la variante n'est pas la règle retenue (le thorax tourne vraiment).
  const bout = solidaire.samples.at(-1).mesure;
  assert.ok(Math.abs(bout.thoraxLacetDeg) >= 14, `${id} solidaire : thorax tourné de ${bout.thoraxLacetDeg.toFixed(2)}° à la borne`);
  assert.equal(electionGif(election), "docs/gifs/election-rotation-buste.gif");
  const gif = readFileSync(join(ELECTIONS_DIR, electionFile(election)));
  assert.equal(gif.toString("latin1", 0, 6), "GIF89a", "signature du GIF comparatif");
  const page = readFileSync(join(ROOT, electionPage(election)), "utf8");
  assert.ok(page.includes(electionFile(election)), "la page d'élection montre le GIF");
  assert.ok(page.includes("**A pour la planche**") && page.includes("**C pour la danse**"), "le résultat du vote est écrit sur la page");
  assert.match(page, /BodyParts3D v4\.0, © DBCLS, CC BY-SA 2\.1 Japan/, "attribution sur la page d'élection");
  console.log(`PASS atlas élection ${election.id} : planche thorax-face, danse oppose (vote D17) ; règle retenue thorax-face (thorax immobile), variante solidaire (thorax tourné de ${bout.thoraxLacetDeg.toFixed(1)}° à ${solidaire.samples.at(-1).angleDeg}°, torsion du dos ${torsionMax.toFixed(2)}° au plus), variante oppose (thorax à ${oppose.samples.at(-1).mesure.thoraxLacetDeg.toFixed(1)}°) ; même bassin, sol, pieds plantés dans les trois ; règle d'une autre élection refusée ; GIF et page présents`);
}
