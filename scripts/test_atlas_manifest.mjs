// #132 — manifeste de l'atlas anatomique (docs/atlas/manifest.json) : schéma validé, articulations
// résolues contre les nœuds réels du GLB (public/anatomy.glb, chunk JSON parsé sans dépendance)
// ou contre les articulations du buste JSX (RigHandle, src/anatomy.ts), ROM bornées.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(root + "docs/atlas/manifest.json", "utf8"));

// Noms des nœuds du rig réel, lus dans le chunk JSON du GLB.
const glb = readFileSync(root + "public/anatomy.glb");
assert.equal(glb.readUInt32LE(0), 0x46546c67, "magic GLB");
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLen).toString("utf8"));
const glbNodes = new Set(gltf.nodes.map((n) => n.name));
assert.ok(glbNodes.has("HipPivot_R") && glbNodes.has("Pelvis"), "nœuds attendus présents dans le GLB");

// Articulations du buste stylisé monté en JSX au-dessus du sacrum (RigHandle, src/anatomy.ts).
const BUSTE_JOINTS = new Set(["spine", "lumbar", "thoracic", "chest", "head"]);
const VIEWS = new Set(["face", "troisQuarts", "profil", "troisQuartsDos", "dos"]);
const PREUVES = new Set(["proposition", "faible", "documente"]);

// 1. Métadonnées et licences : attribution DBCLS maintenue, source paramétrique déclarée.
assert.equal(manifest.atlas, "atlas-anatomique");
assert.equal(manifest.version, 1);
assert.equal(manifest.issue, 132);
assert.match(manifest.licence.maillages, /CC BY-SA 2\.1 Japan/, "attribution BodyParts3D");
assert.match(manifest.licence.maillages, /DBCLS/, "auteur DBCLS");
assert.match(manifest.source, /pose\.ts/, "génération paramétrique via le moteur de pose");
assert.match(manifest.source, /pas de mocap/i, "pas de mocap déclaré");
assert.ok(Array.isArray(manifest.views) && manifest.views.length >= 3, "au moins 3 vues");
for (const v of manifest.views) assert.ok(VIEWS.has(v), `vue connue: ${v}`);
console.log("PASS atlas : métadonnées, licences (CC BY-SA 2.1 Japan © DBCLS) et vues multi-angles");

// 2. Chaque mouvement : schéma complet, articulation résolue contre le rig réel, ROM bornée.
assert.ok(Array.isArray(manifest.mouvements) && manifest.mouvements.length >= 10, "au moins 10 mouvements");
const ids = new Set();
for (const m of manifest.mouvements) {
  assert.match(m.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `id kebab-case: ${m.id}`);
  assert.ok(!ids.has(m.id), `id unique: ${m.id}`); ids.add(m.id);
  assert.ok(m.label && m.labelEn, `labels FR/EN: ${m.id}`);
  assert.ok(m.rig === "glb" || m.rig === "buste", `rig glb|buste: ${m.id}`);
  if (m.rig === "glb") assert.ok(glbNodes.has(m.articulation), `nœud GLB ${m.articulation} (${m.id})`);
  else assert.ok(BUSTE_JOINTS.has(m.articulation), `articulation buste ${m.articulation} (${m.id})`);
  assert.ok(["x", "y", "z"].includes(m.axeLocal), `axe local x|y|z: ${m.id}`);
  const [min, max] = m.romDeg;
  assert.ok(min < max, `rom min<max: ${m.id}`);
  assert.ok(Math.abs(min) <= 180 && Math.abs(max) <= 180 && max - min <= 180, `rom bornée: ${m.id}`);
  assert.ok(["R", "L", "les deux"].includes(m.cote), `cote: ${m.id}`);
  assert.ok([1, 2, 3].includes(m.priorite), `priorité 1..3: ${m.id}`);
  assert.ok(typeof m.preuve === "string" && m.preuve.length > 0, `niveau de preuve renseigné: ${m.id}`);
}
console.log(`PASS atlas : ${manifest.mouvements.length} mouvements, articulations résolues contre le GLB/buste, ROM bornées`);

// 3. Le cœur du projet est couvert en priorité 1 : bassin (Pelvis) et hanche (HipPivot_R).
const prio1 = manifest.mouvements.filter((m) => m.priorite === 1).map((m) => m.id);
assert.ok(manifest.mouvements.some((m) => m.priorite === 1 && m.articulation === "Pelvis"), "un mouvement prio 1 sur Pelvis");
assert.ok(manifest.mouvements.some((m) => m.priorite === 1 && m.articulation === "HipPivot_R"), "un mouvement prio 1 sur HipPivot_R");
console.log(`PASS atlas : priorités 1 couvrent bassin et hanche (${prio1.join(", ")})`);
