#!/usr/bin/env node
// #225 (docs/spec-pied-sur-la-plante.md) : les orteils articulés, sur le vrai GLB.
// 1. La découpe : les phalanges passent sous `ToePivot_<côté>`, os par os ; au repos, le pied est celui d'origine.
// 2. La ligne de pli et le pli maximal (demi-pointe d'un danseur), mesurés sur les os.
// 3. Le pied qui pivote sur la ligne : rien sous le sol jusqu'au pli maximal ; hauteurs du talon et de la cheville.
// 4. Un pli nul ne change rien : hors des exercices, les orteils suivent le pied comme avant.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fixture } from "./pose_fixture.mjs";

const bundle = new URL("./.test-orteils-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "rigJoints", "orteils", "isolations"].map(n => `export * from "./src/${n}";`).join("\n"),
  resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href);
unlinkSync(bundle);
const { articulateToes, islands, TOE_EXTENSION_MAX, ISOLATION_HEEL, ISOLATION_HEIGHTS } = api;

const DEG = 180 / Math.PI, SIDES = ["L", "R"];
const bytes = readFileSync(new URL("../public/anatomy.glb", import.meta.url));
const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
const pointsOf = (mesh, frame) => {
  mesh.updateWorldMatrix(true, false); frame.updateWorldMatrix(true, false);
  const m = frame.matrixWorld.clone().invert().multiply(mesh.matrixWorld), p = mesh.geometry.attributes.position, out = [];
  for (let i = 0; i < p.count; i++) out.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(m));
  return out;
};
// Arrondis au micromètre avant le tri : un écart d'arrondi ne doit pas changer l'ordre de deux sommets voisins.
const sorted = pts => pts.map(p => p.toArray().map(x => Math.round(x * 1e6))).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);

// ---------------------------------------------------------------- 1. la découpe
{
  const original = scene.clone(true);
  for (const s of SIDES) {
    const ankle = original.getObjectByName("AnklePivot_" + s), foot = original.getObjectByName("Foot_" + s);
    const before = pointsOf(foot, ankle), triangles = foot.geometry.index.count / 3, source = foot.geometry;
    const all = islands(source);
    assert.equal(all.length, 27, `${s} : 27 îlots, un par os (le tarse, les métatarsiens, les phalanges, un îlot dégénéré)`);
    const pivot = articulateToes(ankle, s);
    assert.ok(pivot && pivot.name === "ToePivot_" + s && pivot.parent === ankle, `${s} : le nœud des orteils est un enfant de la cheville`);
    const rays = pivot.children, toes = rays.map(ray => ray.children[0]);
    assert.deepEqual(rays.map(ray => ray.name), [1, 2, 3, 4, 5].map(k => `ToeRay${k}_${s}`), `${s} : cinq orteils, du gros au petit`);
    assert.ok(toes.every((m, k) => m?.isMesh && m.name === `Toes${k + 1}_${s}` && m.material === foot.material), `${s} : un maillage par orteil, matière du pied`);
    // Un os a au moins 50 sommets ; le petit orteil porte aussi un fragment minuscule (l'îlot « dégénéré »).
    const bones = toes.map(m => islands(m.geometry).filter(g => g.length >= 50).length);
    assert.deepEqual(bones, [2, 3, 3, 3, 3], `${s} : deux phalanges au gros orteil, trois aux autres`);
    assert.equal(toes.reduce((n, m) => n + islands(m.geometry).length, 0), 15, `${s} : quatorze phalanges et un fragment`);
    assert.equal(islands(foot.geometry).length, 12, `${s} : le tarse et les métatarsiens restent au pied`);
    assert.equal(foot.geometry.index.count / 3 + toes.reduce((n, m) => n + m.geometry.index.count / 3, 0), triangles, `${s} : aucun triangle perdu ni ajouté`);
    assert.ok(foot.geometry !== source && source.attributes.position.count === before.length, `${s} : la géométrie d'origine (partagée par les copies du GLB) ne change pas`);
    assert.ok(toes.every(m => m.geometry.attributes.position.array.constructor === source.attributes.position.array.constructor), `${s} : la quantification est gardée`);
    assert.ok(rays[1].position.length() < 1e-12, `${s} : la ligne de pli passe par la tête du 2e métatarsien`);
    const after = [...pointsOf(foot, ankle), ...toes.flatMap(m => pointsOf(m, ankle))];
    assert.equal(after.length, before.length, `${s} : autant de sommets`);
    const a = sorted(before), b = sorted(after);
    const worst = Math.max(...a.map((p, i) => Math.max(...p.map((x, k) => Math.abs(x - b[i][k]))))) * 1e-6;
    assert.ok(worst < 2e-6, `${s} : au repos, les maillages réunis sont le pied d'origine (${worst.toExponential(1)} m)`);
    assert.equal(articulateToes(ankle, s), pivot, `${s} : une seconde articulation ne change rien`);
    assert.equal(ankle.children.filter(c => c.name === "ToePivot_" + s).length, 1);
    assert.equal(islands(foot.geometry).length, 12);
  }
  const fresh = scene.getObjectByName("Foot_R");
  assert.ok(!scene.getObjectByName("ToePivot_R") && fresh.geometry.attributes.position.count === 9152, "le GLB chargé n'est pas touché");
  console.log("PASS découpe : 14 phalanges par pied sous ToePivot, os par os, un nœud par orteil à la tête de son métatarsien ; au repos, le pied d'origine sommet pour sommet ; idempotente ; GLB intact");
}

// ---------------------------------------------------------------- 2. la ligne de pli, le pli maximal
const { r, outer, model } = fixture(api);
const rests = [];
{
  for (const s of SIDES) {
    const leg = model.legs[s], toe = r["toe" + s];
    assert.ok(toe && toe.parent === r["foot" + s], `${s} : r.toe${s} est le nœud des orteils`);
    const along = new THREE.Vector3(Math.sin(leg.toeOut), 0, Math.cos(leg.toeOut));
    const lowest = Math.min(...leg.sole.map(p => p.y));
    const a = leg.hinge.dot(along), above = leg.hinge.y - lowest;
    // Entre la fin des métatarsiens et la base des phalanges, au centre de la tête du 2e métatarsien.
    assert.ok(a > 0.105 && a < 0.115, `${s} : la ligne de pli à ${(a * 100).toFixed(1)} cm de la cheville, le long du pied`);
    assert.ok(above > 0.008 && above < 0.016, `${s} : la ligne de pli à ${(above * 1000).toFixed(1)} mm au-dessus du sol`);
    assert.equal(leg.rearSole.length + leg.toeSole.length, leg.sole.length, `${s} : la semelle se partage entre le pied et les orteils`);
    rests.push(toe.userData.restExtension);
  }
  for (const e of rests) assert.ok(e > 15 / DEG && e < 25 / DEG, `extension du gros orteil au repos : ${(e * DEG).toFixed(1)}°`);
  const foldMax = model.legs.L.toeFoldMax;
  assert.equal(model.legs.R.toeFoldMax, foldMax, "les deux pieds plient de même");
  assert.ok(Math.abs(foldMax - (TOE_EXTENSION_MAX - (rests[0] + rests[1]) / 2)) < 1e-12);
  assert.ok(foldMax > 65 / DEG && foldMax < 75 / DEG, `pli maximal ${(foldMax * DEG).toFixed(1)}°`);
  console.log(`PASS ligne de pli : centre de la tête du 2e métatarsien ; gros orteil étendu au repos de ${rests.map(e => (e * DEG).toFixed(1) + "°").join(" (G), ")} (D) ; pli maximal ${(foldMax * DEG).toFixed(1)}° (90° d'extension)`);
}

// ---------------------------------------------------------------- 3. le pied qui pivote sur la ligne
const report = [];
{
  for (const s of SIDES) {
    const leg = model.legs[s], axis = new THREE.Vector3(Math.cos(leg.toeOut), 0, -Math.sin(leg.toeOut));
    const lowest = Math.min(...leg.sole.map(p => p.y)), H = leg.hinge;
    // Le pied tourne autour de la ligne de pli, qui garde sa place ; les orteils, à plat, ne bougent pas.
    const turn = (p, th) => p.clone().sub(H).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, th)).add(H);
    const heights = th => {
      const rear = Math.min(...leg.rearSole.map(p => turn(p, th).y)) - lowest;
      return { rear, ankle: turn(new THREE.Vector3(), th).y, heel: turn(leg.heel, th).y - lowest, ankleOver: turn(new THREE.Vector3(), th).sub(H).dot(new THREE.Vector3(Math.sin(leg.toeOut), 0, Math.cos(leg.toeOut))) };
    };
    for (let d = 0; d <= leg.toeFoldMax * DEG + 1e-9; d += 0.5) {
      const h = heights(d / DEG);
      assert.ok(h.rear > -1e-4, `${s} : à ${d}°, le pied ne passe pas sous le sol (${(h.rear * 1000).toFixed(2)} mm)`);
    }
    // La demi-pointe complète : la cheville à l'aplomb de la ligne de pli, juste sous le pli maximal.
    let lo = 0, hi = Math.PI / 2;
    for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (heights(mid).ankleOver < 0) lo = mid; else hi = mid; }
    const full = (lo + hi) / 2;
    assert.ok(full < leg.toeFoldMax && full > 60 / DEG, `${s} : demi-pointe complète à ${(full * DEG).toFixed(1)}°, sous le pli maximal`);
    const row = th => { const h = heights(th); return `${(th * DEG).toFixed(0)}° : talon ${(h.heel * 100).toFixed(1)} cm, cheville +${(h.ankle * 100).toFixed(1)} cm`; };
    report.push(`${s} ${[ISOLATION_HEIGHTS.miHauteur, ISOLATION_HEEL, full].map(row).join(" | ")}`);
    if (s === "R") {
      // Aux trois quarts élus (le 28 novembre), le talon est aux trois quarts de sa hauteur en demi-pointe complète.
      const ratio = heights(ISOLATION_HEEL).heel / heights(full).heel;
      assert.ok(ratio > 0.7 && ratio < 0.8, `aux trois quarts, le talon est à ${(ratio * 100).toFixed(0)} % de sa hauteur en demi-pointe complète`);
      report.push(`aux trois quarts, le talon à ${(ratio * 100).toFixed(0)} % de sa hauteur en demi-pointe complète`);
    }
  }
  console.log("PASS pied sur la plante : rien sous le sol jusqu'au pli maximal, demi-pointe complète sous la limite");
  for (const line of report) console.log("INFO " + line);
}

// ---------------------------------------------------------------- 4. chaque orteil suit sa tête de métatarsien, son bout reste posé
{
  const world = (o, p) => p.clone().applyMatrix4(o.matrixWorld);
  const lowOf = mesh => { const p = mesh.geometry.attributes.position, v = new THREE.Vector3(); let y = Infinity; for (let i = 0; i < p.count; i++) y = Math.min(y, v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld).y); return y; };
  const state = () => {
    r.root.updateWorldMatrix(true, true);
    return SIDES.map(s => model.legs[s].rays.map(ray => ({
      low: lowOf(ray.node.children[0]),
      attach: world(r["foot" + s], model.legs[s].hinge.clone().add(ray.rest)).distanceTo(ray.node.getWorldPosition(new THREE.Vector3())),
      slope: 2 * Math.acos(Math.min(1, Math.abs(ray.node.quaternion.w))),
    })));
  };
  api.applyPose(r, model, 2, { isolation: { id: "cou-tourne" } });
  const atRest = state();
  const lines = [];
  // Jusqu'aux trois quarts, la plante reste au sol, le 2e orteil à plat ; en demi-pointe complète, la plante quitte le sol
  // de l'épaisseur de son coussinet (vote du 28 novembre : les orteils plient au-dessus du sol), et chaque orteil descend
  // en pente jusqu'à son bout, posé (pentes en degrés : le 2e, au plus et au moins ; tous, au plus).
  for (const [name, hauteur, [lo, hi], steepest] of [["mi-hauteur", "miHauteur", [0, 0], 35], ["trois quarts", undefined, [0, 0], 35], ["demi-pointe complète", "demiPointe", [8, 14], 50]]) {
    const settings = { ...api.ISOLATION_DEFAULT, pointes: true, ...(hauteur ? { hauteur } : {}) };
    api.applyPose(r, model, 2, { isolation: { id: "cou-tourne", settings } });
    const now = state();
    now.forEach((rays, i) => rays.forEach((ray, k) => {
      assert.ok(ray.attach < 1e-9, `${name} : l'orteil ${k + 1} tient à la tête de son métatarsien (${(ray.attach * 1000).toFixed(4)} mm)`);
      assert.ok(Math.abs(ray.low - atRest[i][k].low) < 1e-5, `${name} : le bout de l'orteil ${k + 1} reste posé (${((ray.low - atRest[i][k].low) * 1000).toFixed(3)} mm)`);
    }));
    assert.ok(now.every(rays => rays[1].slope * DEG >= lo - 1e-4 && rays[1].slope * DEG <= hi + 1e-4), `${name} : le 2e orteil en pente de ${now.map(rays => (rays[1].slope * DEG).toFixed(2)).join(", ")}° (de ${lo} à ${hi}°)`);
    const slopes = [0, 1, 2, 3, 4].map(k => Math.max(...now.map(rays => rays[k].slope)) * DEG);
    assert.ok(slopes[0] < 6 + hi && Math.max(...slopes) < steepest, `${name} : pente des orteils ${slopes.map(x => x.toFixed(0)).join(", ")}°`);
    lines.push(`${name} : pente des orteils, du gros au petit, ${slopes.map(x => x.toFixed(1)).join(" · ")}°`);
  }
  console.log("PASS orteils : chacun tient à la tête de son métatarsien, son bout reste posé ; le 2e à plat jusqu'aux trois quarts, en pente en demi-pointe complète");
  for (const line of lines) console.log("INFO " + line);
}

// ---------------------------------------------------------------- 5. un pli nul ne change rien
{
  // Hors des exercices (une danse, la marche roulée du corridinho), les orteils suivent le pied, comme avant.
  for (const options of [{ styleKey: "kizomba" }, { styleKey: "semba", corridinho: true, travel: 0.6 }, { styleKey: "kompa", travel: 0.6 }]) {
    for (const b of [0, 0.4, 1.25, 2.7, 5.5]) {
      api.applyPose(r, model, b, options);
      for (const s of SIDES) assert.ok(r["toe" + s].quaternion.equals(new THREE.Quaternion()) && model.legs[s].rays.every(ray => ray.node.quaternion.equals(new THREE.Quaternion()) && ray.node.position.equals(ray.rest)), `${JSON.stringify(options)} : orteils à plat dans le pied, au temps ${b}`);
    }
  }
  // Après un exercice sur pointes, la pose ordinaire revient intacte.
  api.applyPose(r, model, 3, { isolation: { id: "talons" } });
  assert.ok(SIDES.some(s => !r["toe" + s].quaternion.equals(new THREE.Quaternion())), "dans l'exercice des talons, les orteils plient");
  api.applyPose(r, model, 1.25, { styleKey: "kizomba" });
  assert.ok(SIDES.every(s => r["toe" + s].quaternion.equals(new THREE.Quaternion()) && model.legs[s].rays.every(ray => ray.node.quaternion.equals(new THREE.Quaternion()) && ray.node.position.equals(ray.rest))), "puis reviennent à plat dans le pied");
  console.log("PASS pli nul : hors des exercices, les orteils suivent le pied comme avant");
}
