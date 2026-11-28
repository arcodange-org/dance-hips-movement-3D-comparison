#!/usr/bin/env node
// #229 (docs/spec-pied-sur-la-plante.md, « La cheville et le raccord à la jambe ») : sur le vrai GLB, os et muscles, à plat
// puis talons levés aux trois hauteurs (mi-hauteur, trois quarts élus, demi-pointe complète).
// 1. La couche des muscles est posée sur les os : son origine (celle de BodyParts3D) est prise sur les os coxaux du GLB.
// 2. Les tendons qui passent la cheville suivent le pied : sous la cheville, chaque sommet garde sa place contre les os
//    du pied.
// 3. Le tendon d'Achille tient au mollet en haut et au talon en bas, à toutes les hauteurs.
// 4. Rien de la couche des muscles ne passe sous le sol, dans les exercices comme en danse.
// 5. Le talus reste dans la pince du tibia et de la fibula : ce qui y entre, et le jeu, mesurés.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
import { graft } from "./muscles_fixture.mjs";

const bundle = new URL("./.test-cheville-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "rigJoints", "orteils", "isolations", "muscles", "cheville"].map(n => `export * from "./src/${n}";`).join("\n"),
  resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href);
unlinkSync(bundle);
const { ANKLE_CROSSING, ISOLATION_DEFAULT, footShare, muscleFrameOrigin } = api;

const SIDES = ["L", "R"], mm = x => (x * 1000).toFixed(1);
const { r, model } = fixture(api);
const muscles = graft(api, r);
const byName = name => muscles.find(m => m.name === name);
/** Les sommets d'un maillage dans le monde (pesés par la cheville pour les tendons qui la passent). */
function world(mesh) {
  mesh.updateMatrixWorld(true);
  const p = mesh.geometry.attributes.position, out = [];
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    if (mesh.isSkinnedMesh) mesh.applyBoneTransform(i, v);
    out.push(v.applyMatrix4(mesh.matrixWorld));
  }
  return out;
}
const footBones = s => [r["Foot_" + s], ...r["toe" + s].children.map(ray => ray.children[0])];
const nearest = (p, cloud) => { let d = Infinity; for (const q of cloud) d = Math.min(d, q.distanceToSquared(p)); return Math.sqrt(d); };
const POSES = [
  ["à plat", { isolation: { id: "cou-tourne" } }],
  ["mi-hauteur", { isolation: { id: "cou-tourne", settings: { ...ISOLATION_DEFAULT, pointes: true, hauteur: "miHauteur" } } }],
  ["trois quarts", { isolation: { id: "cou-tourne", settings: { ...ISOLATION_DEFAULT, pointes: true } } }],
  ["demi-pointe complète", { isolation: { id: "cou-tourne", settings: { ...ISOLATION_DEFAULT, pointes: true, hauteur: "demiPointe" } } }],
];
const pose = options => { api.applyPose(r, model, 2, options); r.root.updateWorldMatrix(true, true); };
const report = [];

// ---------------------------------------------------------------- 1. la couche des muscles posée sur les os
{
  const origin = muscleFrameOrigin(r);
  // Mesuré : l'origine de BodyParts3D est 4,2 cm plus haut et 0,8 cm plus en arrière que celle du GLB des os.
  assert.ok(Math.abs(origin.x) < 0.001 && Math.abs(origin.y - 0.042) < 0.002 && Math.abs(origin.z + 0.008) < 0.002,
    `origine des muscles dans le repère des os : ${origin.toArray().map(mm).join(", ")} mm`);
  api.resetRig(r); r.root.updateWorldMatrix(true, true);
  for (const s of SIDES) {
    const knee = r["knee" + s].getWorldPosition(new THREE.Vector3()), ankle = r["foot" + s].getWorldPosition(new THREE.Vector3());
    const sole = Math.min(...footBones(s).flatMap(world).map(p => p.y));
    const top = name => Math.max(...world(byName(`Muscle_${name}_${s}`)).map(p => p.y));
    const bottom = name => Math.min(...world(byName(`Muscle_${name}_${s}`)).map(p => p.y));
    // Les jumeaux naissent sur les condyles du fémur, au-dessus du genou ; le soléaire finit au-dessus de la cheville ;
    // les tendons qui descendent dans le pied s'arrêtent au-dessus de la semelle des os.
    assert.ok(top("Gastrocnemius") - knee.y > 0.04, `${s} : les jumeaux partent au-dessus du genou (${mm(top("Gastrocnemius") - knee.y)} mm)`);
    assert.ok(bottom("Soleus") - ankle.y > 0.03, `${s} : le soléaire finit au-dessus de la cheville (${mm(bottom("Soleus") - ankle.y)} mm)`);
    for (const name of Object.keys(ANKLE_CROSSING))
      assert.ok(bottom(name) - sole > 0.005, `${s} : ${name} s'arrête au-dessus de la semelle (${mm(bottom(name) - sole)} mm)`);
  }
  console.log(`PASS couche des muscles : posée sur les os (origine ${origin.toArray().map(mm).join(", ")} mm)`);
}

// ---------------------------------------------------------------- 2, 3, 4. tendons, tendon d'Achille, sol
{
  // À plat : la distance de chaque sommet des tendons aux os les plus proches (du pied, ou de la jambe), selon sa part de
  // pied (`footShare`) : sur le pied (part 1), dans la bande où la peau passe de la jambe au pied (entre 0 et 1).
  pose(POSES[0][1]);
  const shin = s => [r["Tibia_" + s], r["Fibula_" + s]].flatMap(world);
  const tracked = {};
  for (const s of SIDES) {
    const foot = footBones(s).flatMap(world), all = [...foot, ...shin(s)];
    for (const name of Object.keys(ANKLE_CROSSING)) {
      const mesh = byName(`Muscle_${name}_${s}`), P = world(mesh), w = mesh.geometry.attributes.skinWeight;
      assert.ok(mesh.isSkinnedMesh, `${mesh.name} passe la cheville : pesé entre la jambe et le pied`);
      const onFoot = [], band = [];
      for (let i = 0; i < P.length; i++) { const share = w.getY(i); if (share >= 0.999) onFoot.push(i); else if (share > 0) band.push(i); }
      assert.ok(onFoot.length > 20, `${mesh.name} : une partie suit le pied (${onFoot.length} sommets)`);
      tracked[mesh.name] = { onFoot, band, footRest: onFoot.map(i => nearest(P[i], foot)), bandRest: band.map(i => nearest(P[i], all)) };
    }
  }
  const soleusOf = s => world(byName(`Muscle_Soleus_${s}`));
  const tendonTop = s => { const P = world(byName(`Muscle_CalcanealTendon_${s}`)), y = Math.max(...P.map(p => p.y)); return P.filter(p => p.y > y - 0.01); };
  const topRest = Object.fromEntries(SIDES.map(s => [s, Math.max(...tendonTop(s).map(p => nearest(p, soleusOf(s))))]));
  const lines = [];
  for (const [label, options] of POSES) {
    pose(options);
    let floor = Infinity, onFoot = { d: 0 }, band = { d: 0 };
    for (const s of SIDES) {
      const foot = footBones(s).flatMap(world), all = [...foot, ...shin(s)];
      for (const name of Object.keys(ANKLE_CROSSING)) {
        const mesh = byName(`Muscle_${name}_${s}`), P = world(mesh), t = tracked[mesh.name];
        t.onFoot.forEach((i, k) => { const d = Math.abs(nearest(P[i], foot) - t.footRest[k]); if (d > onFoot.d) onFoot = { d, name: mesh.name }; });
        t.band.forEach((i, k) => { const d = nearest(P[i], all) - t.bandRest[k]; if (d > band.d) band = { d, name: mesh.name }; });
      }
      const top = Math.max(...tendonTop(s).map(p => nearest(p, soleusOf(s))));
      assert.ok(top < topRest[s] + 0.001, `${label}, ${s} : le haut du tendon d'Achille reste contre le soléaire (${mm(top)} mm)`);
    }
    for (const mesh of muscles) for (const p of world(mesh)) floor = Math.min(floor, p.y);
    // Sur le pied, les tendons ne bougent pas contre ses os ; dans la bande, ils s'écartent des os de 12 mm au plus (le
    // jambier antérieur, tendu devant la cheville quand le pied se tend) : ils ne flottent pas.
    assert.ok(onFoot.d < 1e-4, `${label} : sur le pied, les tendons suivent ses os (${onFoot.name} : ${mm(onFoot.d)} mm)`);
    assert.ok(band.d < 0.012, `${label} : entre la jambe et le pied, les tendons restent près des os (${band.name} s'écarte de ${mm(band.d)} mm)`);
    assert.ok(floor > 0, `${label} : aucun muscle sous le sol (${mm(floor)} mm)`);
    lines.push(`${label} : entre la jambe et le pied, un tendon s'écarte des os de ${mm(band.d)} mm au plus (${band.name ?? "aucun"}) ; muscle le plus bas à ${mm(floor)} mm du sol`);
  }
  // En danse aussi (le pied roulé de la marche, les genoux pliés), rien sous le sol.
  for (const options of [{ styleKey: "kizomba" }, { styleKey: "semba", corridinho: true, travel: 0.6 }, { styleKey: "kompa", travel: 0.6 }]) {
    for (const b of [0, 0.4, 1.25, 2.7, 5.5]) {
      api.applyPose(r, model, b, options); r.root.updateWorldMatrix(true, true);
      let floor = Infinity;
      for (const mesh of muscles) for (const p of world(mesh)) floor = Math.min(floor, p.y);
      assert.ok(floor > -0.0005, `${JSON.stringify(options)} au temps ${b} : aucun muscle sous le sol (${mm(floor)} mm)`);
    }
  }
  console.log("PASS tendons : ils suivent le pied sous la cheville ; le tendon d'Achille tient au mollet et au talon ; rien sous le sol");
  report.push(...lines);
}

// ---------------------------------------------------------------- 5. le talus dans la pince
{
  // Repère de la jambe (le genou) : le tibia et la fibula y sont fixes. Un sommet du talus est dedans quand un rayon qui
  // en part traverse leurs surfaces un nombre impair de fois (deux directions sur trois).
  const s = "R", knee = r["knee" + s], tri = [], cloud = [];
  pose(POSES[0][1]);
  const inKnee = () => knee.matrixWorld.clone().invert();
  for (const mesh of [r["Tibia_" + s], r["Fibula_" + s]]) {
    const P = world(mesh).map(p => p.applyMatrix4(inKnee())), idx = mesh.geometry.index;
    cloud.push(...P);
    for (let k = 0; k < idx.count; k += 3) tri.push([P[idx.getX(k)], P[idx.getX(k + 1)], P[idx.getX(k + 2)]]);
  }
  const ray = new THREE.Ray(), hit = new THREE.Vector3();
  const dirs = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.3, -0.2, 0.93).normalize(), new THREE.Vector3(-0.8, 0.1, -0.59).normalize()];
  const inside = p => dirs.filter(d => { ray.set(p, d); let n = 0; for (const [a, b, c] of tri) if (ray.intersectTriangle(a, b, c, false, hit)) n++; return n % 2; }).length >= 2;
  const talus = () => { const foot = r["Foot_" + s], all = world(foot).map(p => p.applyMatrix4(inKnee())); return api.talusOf(foot).map(i => all[i]); };
  const restT = talus(), restD = restT.map(p => nearest(p, cloud)), near = restT.map((_, i) => i).filter(i => restD[i] < 0.012);
  const seated = Math.min(...restD);
  for (const [label, options] of POSES) {
    pose(options);
    const T = talus();
    let n = 0, depth = 0, closest = Infinity;
    for (const i of near) { const d = nearest(T[i], cloud); closest = Math.min(closest, d); if (inside(T[i])) { n++; depth = Math.max(depth, d); } }
    // Le talus n'entre ni dans le tibia ni dans la fibula, et reste assis dans la pince : au plus près, il en est aussi
    // près qu'à plat (l'espace du cartilage), à 1,5 mm près.
    assert.equal(n, 0, `${label} : le talus entre dans le tibia ou la fibula (${n} sommets, au plus ${mm(depth)} mm)`);
    assert.ok(closest < seated + 0.0015, `${label} : le talus reste assis dans la pince (au plus près ${mm(closest)} mm, à plat ${mm(seated)} mm)`);
    report.push(`talus, ${label} : rien dans le tibia ni la fibula ; au plus près ${mm(closest)} mm (à plat ${mm(seated)} mm) ; glissement ${mm(r["foot" + s].position.distanceTo(model.legs[s].ankleRest))} mm`);
  }
  console.log("PASS talus : il reste assis dans la pince, sans entrer dans le tibia ni la fibula");
}
for (const line of report) console.log("INFO " + line);
