// Test de contrat du pont ReCoDanse : il échoue quand une évolution du moteur casse ce dont le pont dépend,
// et il mesure le haut du corps anatomique sur les figures du moteur (GLB réel, sans navigateur).
//
//   node recodanse/scripts/test_contrat.mjs            (depuis la racine du moteur)
//
// Ne fait pas partie de `npm test` du moteur : le pont n'engage pas le moteur.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";

const ici = path.dirname(fileURLToPath(import.meta.url));
const pont = path.join(ici, ".."), moteur = path.resolve(pont, process.env.MOTEUR ?? "..");
const { fixture } = await import(path.join(moteur, "scripts/pose_fixture.mjs"));
const lot = path.join(ici, ".test-contrat-lot.mjs");
buildSync({
  stdin: {
    contents: [...["pose", "anatomy", "styles", "rigJoints", "muscles", "quartsPaire", "sortieGarcon", "sortieFille", "idaPaire", "placePaire", "cadre"].map(n => `export * from "@moteur/${n}";`),
      'export * from "./src/haut";', 'export * from "./src/mascotte";', 'export * from "./src/reglages";'].join("\n"),
    resolveDir: pont,
  },
  alias: { "@moteur": path.join(moteur, "src") },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: lot,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent",
});
const api = await import(lot);
unlinkSync(lot);
const manifeste = JSON.parse(readFileSync(path.join(pont, "actifs/anatomie_haut.json"), "utf8"));
const lire = f => readFileSync(path.join(moteur, f), "utf8");
const glbJson = f => { const b = readFileSync(f); return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()); };
const proche = (a, b, eps = 1e-9) => a.every((x, i) => Math.abs(x - b[i]) < eps);

// 1. Ce que le pont lit dans le moteur existe encore.
{
  for (const n of ["applyPose", "bindSkeleton", "createPoseModel", "TORSO_JOINTS", "ARM_JOINTS", "CADRE_SITES", "solveArm", "solveFrame", "makeMuscleMaterial", "DRACO_DECODER_PATH"])
    assert(n in api, `le moteur n'exporte plus ${n}`);
  const rig = lire("src/components/Rig.tsx");
  assert(/export default function Rig\(/.test(rig) && /export interface RigProps/.test(rig), "Rig.tsx : composant par défaut et RigProps");
  assert(/pair\.current\[side\] = \{[^}]*rig: r/s.test(rig), "Rig.tsx ne publie plus son rig dans `pair.current[side].rig` : le pont ne peut plus l'habiller");
  assert(/userData=\{\{ part: "torso" \}\}/.test(rig) && /ref=\{reg\("head"\)\}/.test(rig) && /ref=\{reg\("torso"\)\}/.test(rig), "Rig.tsx : volumes du buste marqués `torso`, nœuds `head` et `torso`");
  assert(/userData\.part === "anchor"/.test(lire("src/pose.ts")) && /userData\.part === "anchor"/.test(lire("src/anatomy.ts")), "le moteur n'ignore plus les maillages marqués `anchor`");
  assert(/lazy\(\(\) => import\("\.\/App"\)\)/.test(lire("src/main.tsx")), "src/main.tsx : l'entrée que la vue du pont importe");
  const noeuds = new Set(glbJson(path.join(moteur, "public/anatomy.glb")).nodes.map(n => n.name));
  for (const n of ["AnklePivot_L", "AnklePivot_R", "Femur_R", "Foot_L", "Foot_R"]) assert(noeuds.has(n), `public/anatomy.glb n'a plus le nœud ${n}`);
  console.log("PASS contrat : exports, Rig, marquage `anchor`, entrée et nœuds du GLB du moteur");
}

// 2. Les articulations du moteur recopiées à la construction sont toujours les siennes.
{
  const { spine, chest, head } = api.TORSO_JOINTS;
  const colonne = spine, thorax = spine.map((x, i) => x + chest[i]), tete = thorax.map((x, i) => x + head[i]);
  assert(proche(manifeste.moteur.colonne, colonne) && proche(manifeste.moteur.thorax, thorax) && proche(manifeste.moteur.tete, tete),
    "TORSO_JOINTS a changé : relancer recodanse/scripts/construire_haut.mjs (poids de la colonne et du cou)");
  console.log("PASS contrat : articulations du tronc du moteur = celles de la construction");
}

// 3. Le fichier anatomique correspond à son manifeste.
{
  const g = glbJson(path.join(pont, "actifs/anatomie_haut.glb"));
  const peau = g.skins[0].joints.map(j => g.nodes[j].name.replace(/^art_/, ""));
  assert.deepEqual(peau, manifeste.segments, "ordre des articulations de la peau");
  const noms = new Set(g.nodes.filter(n => n.mesh !== undefined).map(n => n.name));
  for (const p of manifeste.pieces) assert(noms.has(p.nom), `pièce ${p.nom} absente du GLB`);
  assert(/BodyParts3D/.test(g.asset.copyright) && /CC BY-SA 2\.1/.test(manifeste.attribution), "attribution BodyParts3D");
  const os = manifeste.pieces.filter(p => p.type === "os").length, muscles = manifeste.pieces.length - os;
  console.log(`PASS fichier anatomique : ${os} pièces osseuses, ${muscles} muscles, ${manifeste.segments.length} articulations`);
}

// 4. Écart mesuré entre les bras du moteur et l'anatomie (information pour le propriétaire).
{
  const { thorax } = manifeste.moteur, A = manifeste.articulations, m = manifeste.mesures.L;
  const epaule = thorax.map((x, i) => x + api.ARM_JOINTS.shoulderL[i]);
  const d = Math.hypot(...A.brasL.map((x, i) => x - epaule[i]));
  console.log(`INFO bras : épaule du moteur à ${(d * 100).toFixed(1)} cm de l'articulation anatomique ; bras ${(-api.ARM_JOINTS.elbow[1] * 100).toFixed(0)} cm (anatomie ${(m.bras * 100).toFixed(1)}) ; coude→main ${(-api.ARM_JOINTS.hand[1] * 100).toFixed(0)} cm (anatomie : poignet ${(m.avantBras * 100).toFixed(1)}, paume ${(m.coudePaume * 100).toFixed(1)})`);
}

// 5. Le haut du corps sur les figures du moteur : la paume vient où le moteur pose la main, les longueurs
//    des os ne changent pas, la pronation reste dans son amplitude, rien n'est indéfini.
const modele = { manifeste, pieces: [] };
const options = { matiereOs: new THREE.MeshBasicMaterial(), matiereMuscle: () => new THREE.MeshBasicMaterial() };
const monde = o => o.getWorldPosition(new THREE.Vector3());
const bilan = [];
{
  const cas = [
    ["sortie garçon", api.SORTIE_GARCON_PAIR_DZ, 5, { movement: "sortieG" }],
    ["sortie fille", api.SORTIE_FILLE_PAIR_DZ, 5, { movement: "sortieF" }],
    ["quarts de tour", api.QUARTS_PAIR_DZ, 16, { movement: "quarts", quarts: true, quartsPaire: true }],
    ["ida e volta", api.IDA_PAIR_DZ, 8, { movement: "ida", ida: true, idaPaire: true }],
    ["sur place", api.PLACE_PAIR_DZ, 4, { movement: "none", placePaire: true }],
  ];
  for (const [nom, dz, temps, opt] of cas) {
    const couple = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
    const hauts = couple.map(f => new api.Haut(f.r, modele, options));
    const lu = { ecart: 0, prises: { dos: 0, mains: 0, libre: 0 }, coude: [Infinity, 0], pronation: [Infinity, -Infinity], saut: 0, sautMoteur: 0, n: 0 };
    const avant = [{}, {}];
    for (let b = 0; b <= temps; b += 1 / 16) {
      couple.forEach((f, i) => api.applyPose(f.r, f.model, b, { ...opt, embrace: true, placement: "quinconce", follower: !!i, styleKey: "kizomba", amp: 1, plexus: true }));
      couple.forEach((f, i) => api.solveFrame(f.r, couple[1 - i].r, !!i));
      hauts.forEach((h, i) => {
        h.maj(couple[1 - i].r, !!i);
        for (const s of ["L", "R"]) {
          const e = h.etat[s], r = couple[i].r;
          const S = monde(r.chest.getObjectByName("pont_bras" + s)), C = monde(r.chest.getObjectByName("pont_av0" + s));
          assert([e.paume, e.coude].every(p => Number.isFinite(p.x + p.y + p.z)) && Number.isFinite(e.pronation), `${nom} ${b} ${s} : pose indéfinie`);
          assert(Math.abs(S.distanceTo(C) - manifeste.mesures[s].bras) < 2e-4, `${nom} ${b} ${s} : longueur du bras`);
          assert(e.pronation >= api.PRONATION.min - 1e-9 && e.pronation <= api.PRONATION.max + 1e-9, `${nom} ${b} ${s} : pronation hors amplitude`);
          const flexion = Math.acos(Math.max(-1, Math.min(1, S.clone().sub(C).normalize().dot(e.paume.clone().sub(C).normalize())))) * 180 / Math.PI;
          lu.ecart = Math.max(lu.ecart, e.ecart); lu.prises[e.prise]++; lu.n++;
          lu.coude = [Math.min(lu.coude[0], flexion), Math.max(lu.coude[1], flexion)];
          lu.pronation = [Math.min(lu.pronation[0], e.pronation), Math.max(lu.pronation[1], e.pronation)];
          // Continuité : le coude, vu du thorax, d'un seizième de temps au suivant.
          const local = r.chest.worldToLocal(C.clone()), duMoteur = r.chest.worldToLocal(monde(r["armF" + s]));
          if (avant[i][s]) { lu.saut = Math.max(lu.saut, local.distanceTo(avant[i][s][0])); lu.sautMoteur = Math.max(lu.sautMoteur, duMoteur.distanceTo(avant[i][s][1])); }
          avant[i][s] = [local, duMoteur];
        }
      });
    }
    assert(lu.ecart < 0.004, `${nom} : la paume manque la main du moteur de ${(lu.ecart * 1000).toFixed(1)} mm`);
    bilan.push({ figure: nom, "écart paume (mm)": +(lu.ecart * 1000).toFixed(2), "angle au coude (°)": lu.coude.map(x => Math.round(x)).join(" à "),
      "pronation (°)": lu.pronation.map(x => Math.round(x * 180 / Math.PI)).join(" à "), "saut du coude (cm)": +(lu.saut * 100).toFixed(1), "celui du moteur (cm)": +(lu.sautMoteur * 100).toFixed(1),
      "mains sur le dos / jointes / libres": `${lu.prises.dos} / ${lu.prises.mains} / ${lu.prises.libre}` });
    hauts.forEach(h => h.liberer());
  }
  console.table(bilan);
  console.log("PASS haut du corps en paire : paume sur la main du moteur (< 4 mm), longueurs constantes, pronation dans l'amplitude");
}

// 6. Danseur seul : tous les styles, cadre de bras du moteur.
{
  const f = fixture(api), h = new api.Haut(f.r, modele, options);
  let pire = 0;
  for (const styleKey of Object.keys(api.STYLES)) for (let b = 0; b <= 8; b += 0.125) {
    api.applyPose(f.r, f.model, b, { styleKey, amp: 1, cadre: true });
    h.maj(null, false);
    for (const s of ["L", "R"]) { assert(Number.isFinite(h.etat[s].ecart), `${styleKey} ${b} ${s}`); pire = Math.max(pire, h.etat[s].ecart); }
  }
  assert(pire < 0.004, `seul : la paume manque la main du moteur de ${(pire * 1000).toFixed(1)} mm`);
  h.liberer();
  assert(!f.r.chest.getObjectByName("pont_brasL") && !f.r.pelvis.getObjectByName("pont_haut"), "liberer() retire tout ce que le pont a ajouté");
  console.log(`PASS haut du corps seul : ${Object.keys(api.STYLES).length} styles, écart de paume maximal ${(pire * 1000).toFixed(2)} mm ; le rig est rendu intact`);
}

// 7. Les pièces de mascotte : pivot de la tête sur le nœud `head`, semelle dans le plan de la semelle
//    anatomique, moteur aveugle à ces maillages (ses appuis ne changent pas).
{
  const f = fixture(api);
  const empreinte = m => [m.legs.L.sole.length, m.legs.L.toeOut, ...m.legs.L.ball.toArray(), ...m.legs.R.heel.toArray()];
  const avant = empreinte(f.model);
  const cube = (x, y, z, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), new THREE.MeshStandardMaterial()); m.position.set(...c); const g = new THREE.Group(); g.add(m); return g; };
  const manif = { nom: "essai", source: "", date: "", echelle: 1, pieces: {
    tete: { glb: "", pivot: [0, 1.5, 0] }, piedL: { glb: "", cheville: [0.08, 0.1, 0], sol: 0 }, piedR: { glb: "", cheville: [-0.08, 0.1, 0], sol: 0 } } };
  const pieces = { tete: cube(0.2, 0.2, 0.2, [0, 1.6, 0]), piedL: cube(0.08, 0.1, 0.2, [0.08, 0.05, 0.04]), piedR: cube(0.08, 0.1, 0.2, [-0.08, 0.05, 0.04]) };
  api.applyPose(f.r, f.model, 0, { styleKey: "kizomba", amp: 0 });
  const m = new api.Mascotte(f.r, { manifeste: manif, pieces }, { tete: true, pieds: true });
  f.outer.updateWorldMatrix(true, true);
  const bas = o => { const b = new THREE.Box3().setFromObject(o); return b.min.y; };
  for (const s of ["L", "R"]) assert(Math.abs(bas(m.pieds[s].groupe)) < 0.002, `semelle ${s} à ${(bas(m.pieds[s].groupe) * 1000).toFixed(1)} mm du sol, pied à plat`);
  const pivot = m.tete.localToWorld(new THREE.Vector3(0, 1.5, 0));
  assert(pivot.distanceTo(monde(f.r.head)) < 1e-6, "pivot de la tête sur le nœud `head`");
  assert(proche(empreinte(api.createPoseModel(f.r)), avant, 1e-9), "les pièces de mascotte changent les appuis du moteur");
  assert(!f.r.Foot_L.visible, "os du pied masqués sous le pied de la mascotte");
  m.liberer();
  assert(f.r.Foot_L.visible && !f.r.head.children.includes(m.tete), "liberer() rend le rig intact");
  console.log("PASS mascotte : tête sur son pivot, semelles au sol, appuis du moteur inchangés");
}
