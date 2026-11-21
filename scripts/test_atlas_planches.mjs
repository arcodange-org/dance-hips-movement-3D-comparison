// #132 — planches « mouvements » de l'atlas anatomique (docs/atlas/mouvements/<id>/), sans navigateur.
// Le rig réel (public/anatomy.glb) est posé par le moteur de l'application (src/atlas.ts → src/pose.ts) ;
// on contrôle la ROM sur le quaternion monde du nœud, une preuve indépendante par les positions des
// hanches, les conventions verrouillées, puis la fraîcheur et l'intégrité des fichiers versionnés.
// Spécification : docs/spec-atlas-anatomique.md, D12.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as THREE from "three";
import {
  ATLAS_CAPTURE, DOCS_DIR, META_FILE, PUBLIC_DIR, README_FILE, buildAtlasMeta, buildPlancheReadme, gifSequence,
  loadAtlasApi, measureMovement, readManifest,
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
  assert.deepEqual(state, { id: "bassin-obliquite", vue: "face", frame: 4, frames: 9, muscles: true }, "défauts : frame du milieu, muscles");
  assert.deepEqual(api.parseAtlasParams(new URLSearchParams("atlas=x&vue=inconnue&frame=99&frames=5&muscles=0")),
    { id: "x", vue: "face", frame: 4, frames: 5, muscles: false }, "vue inconnue et frame hors bornes ramenées");
  assert.equal(api.atlasKey(state), "bassin-obliquite|face|4/9");
  assert.deepEqual(api.parseAtlasParams(new URLSearchParams(api.atlasQuery(state))), state, "atlasQuery se relit à l'identique");
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
    assert.ok(!existsSync(join(DOCS_DIR, m.id)), `pas de planche pour un mouvement non posé : ${m.id}`);
  }
  console.log(`PASS atlas planches : ${unsupported.length} mouvements sans règle de pose refusés explicitement, sans planche`);
}

// Obliquité : preuve par les positions. Une rotation dans le plan frontal fait monter une hanche et
// descendre l'autre ; l'écart de hauteur vaut la composante verticale du vecteur inter-hanches neutre
// tourné de l'angle autour de l'axe antéro-postérieur. Renvoie l'erreur maximale (mm) et l'amplitude (mm).
function frontalEvidence(measured) {
  const h0 = new THREE.Vector3(...measured.neutral.hanches), forward = new THREE.Vector3(0, 0, 1);
  let error = 0, low = Infinity, high = -Infinity;
  for (const s of measured.samples) {
    const expected = h0.clone().applyAxisAngle(forward, s.angleDeg * Math.PI / 180).y * 1000;
    error = Math.max(error, Math.abs(s.mesure.ecartHanchesMm - expected));
    low = Math.min(low, s.mesure.ecartHanchesMm); high = Math.max(high, s.mesure.ecartHanchesMm);
  }
  return { error, amplitude: high - low };
}

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
assert.ok(planches.includes("bassin-obliquite"), "la planche de preuve de chaîne (bassin-obliquite) est versionnée");
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

  let detail = "";
  if (id === "bassin-obliquite") {
    // Plan frontal : axe monde antéro-postérieur, et preuve par les positions des hanches.
    assert.equal(mouvement.axeLocal, "z", "obliquité : rotation autour de l'axe antéro-postérieur (z)");
    near(Math.abs(measured.reference.axe.z), 1, 1e-9, "axe monde de l'obliquité : antéro-postérieur");
    const evidence = frontalEvidence(measured);
    assert.ok(evidence.error <= 0.01, `une hanche monte, l'autre descend, de la valeur géométrique attendue (écart ${evidence.error} mm)`);
    assert.ok(evidence.amplitude >= 40, `amplitude de l'écart de hauteur des hanches : ${evidence.amplitude.toFixed(1)} mm`);
    const first = measured.samples[0], last = measured.samples.at(-1);
    assert.ok(last.mesure.ecartHanchesMm > measured.neutral.ecartHanchesMm && first.mesure.ecartHanchesMm < measured.neutral.ecartHanchesMm,
      "angle positif : hanche gauche haute ; angle négatif : hanche droite haute");
    assert.match(meta.articulation.signe, /hanche gauche monte/, "convention de signe écrite dans meta.json");
    // Contre-épreuve : l'axe du manifeste v1 (x, bascule sagittale) ne fait monter aucune hanche.
    const wrong = frontalEvidence(measureMovement(api, { ...mouvement, axeLocal: "x" }, frames));
    assert.ok(wrong.amplitude < 1 && wrong.error > 10, `un axe erroné est détecté (amplitude ${wrong.amplitude.toFixed(2)} mm, erreur ${wrong.error.toFixed(1)} mm)`);
    // Chaîne fermée : le genou du côté qui descend fléchit de plus en plus, l'autre reste au minimum de l'IK.
    const minimalKnee = 0.12 * 180 / Math.PI;
    for (const s of measured.samples) {
      const [down, up] = s.angleDeg > 0 ? ["R", "L"] : ["L", "R"];
      if (s.angleDeg !== 0) assert.ok(s.mesure.genouDeg[down] > s.mesure.genouDeg[up] + 5, `${id} image ${s.index} : genou ${down} plus fléchi`);
      near(Math.min(s.mesure.genouDeg.R, s.mesure.genouDeg.L), minimalKnee, 0.3, `${id} image ${s.index} : jambe haute au minimum de l'IK`);
    }
    const kneeR = measured.samples.filter(s => s.angleDeg >= 0).map(s => s.mesure.genouDeg.R);
    assert.ok(kneeR.every((v, i) => i === 0 || v > kneeR[i - 1]), "flexion du genou droit croissante avec l'angle");
    detail = `, hanches ${first.mesure.ecartHanchesMm.toFixed(1)} à ${last.mesure.ecartHanchesMm.toFixed(1)} mm, genou jusqu'à ${Math.max(...kneeR).toFixed(1)}°, axe erroné détecté`;
  }

  // 4c. Conventions verrouillées après pose : sol, chevilles sur leurs cibles, longueurs, thorax vertical.
  let ankleError = 0, footDrift = 0;
  const planted = {};
  for (const s of measured.samples) {
    assert.ok(s.solMm >= -0.1, `${id} image ${s.index} : sommets osseux au-dessus du sol (${s.solMm} mm)`);
    near(s.mesure.thoraxDeg, 0, 0.01, `${id} image ${s.index} : thorax vertical (iso=1)`);
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

  console.log(`PASS atlas planche ${id} : ROM mesurée ${Math.min(...angles).toFixed(2)} à ${Math.max(...angles).toFixed(2)}° sur le nœud ${mouvement.articulation}${detail} ; sol, chevilles (${(ankleError * 1000).toFixed(3)} mm), pieds plantés, thorax vertical ; meta.json et README à jour ; ${listed.size} fichiers, copies servies identiques`);
}
