#!/usr/bin/env node
// Phase M5 — recoupement oracle ↔ poses FINALES du moteur #19 : applique applyPose sur le GLB
// réel (fixture) et compare aux prédictions de src/oracle.ts (chevilles x/z/lacets, lacets
// root/buste = dissociation haut/bas, déplacement latéral rootX des sorties, sol y>=0).
// Fichier neuf (coordination issues #21/#22) ; ne modifie aucun moteur (lecture seule).
// Usage : npm test (4e étape) ou node scripts/test_oracle_final.mjs
import { createRequire } from "node:module";
import { unlinkSync } from "node:fs";
const require = createRequire(import.meta.url);
const { buildSync } = require("esbuild");
const THREE = require("three");
const { fixture, minimumBoneY } = await import("./pose_fixture.mjs");

const root = new URL("../", import.meta.url).pathname;
const bundle = new URL("./.test-oracle-final-bundle.mjs", import.meta.url);
buildSync({
  stdin: {
    contents: 'export * from "./src/pose"; export * from "./src/oracle"; export * from "./src/anatomy"; export * from "./src/styles"; export * from "./src/clock"; export * from "./src/rigJoints";',
    resolveDir: root,
    loader: "ts",
  },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent",
});
const api = await import(bundle.href);
unlinkSync(bundle.pathname);
const { applyPose, createPoseModel, oraclePose, PAIR_DZ } = api;

const wrapPi = (d) => Math.atan2(Math.sin(d), Math.cos(d));
const eul = new THREE.Euler();
const worldYaw = (o) => {
  eul.setFromQuaternion(o.getWorldQuaternion(new THREE.Quaternion()), "YXZ");
  return eul.y; // lacet pur, insensible au pitch/roll
};
const worldPos = (o) => o.getWorldPosition(new THREE.Vector3());

let checks = 0;
const errors = { foot: 0, footYaw: 0, lowerYaw: 0, upperYaw: 0, rootX: 0 };
let minY = Infinity;
function near(a, b, tol, label, errKey) {
  const e = Math.abs(a - b);
  if (e > errors[errKey]) errors[errKey] = e;
  if (e > tol) throw new Error(`${label}: ${a} vs ${b} (err ${e} > ${tol})`);
  checks++;
}

function checkSolo(movement, cycle, extraOpts, footBeats, relative = false) {
  const f = fixture(api, {}); // solo : offset 0, rotation 0
  // repos plan (oracle, constantes QH/QF) vs repos GLB réel (fixture) : pour les mouvements
  // posés relativement au repos (ida, sorties), on compare les déplacements relatifs.
  const pr = oraclePose("quarts", 0, false, "leader").footR; // repos plan {x:-QH, z:QF}
  const planRest = { L: { x: -pr.x, z: pr.z }, R: { x: pr.x, z: pr.z } };
  for (let b = 0; b <= cycle; b += 0.25) {
    applyPose(f.r, f.model, b, { styleKey: "kizomba", amp: 1, embrace: true, movement, ...extraOpts });
    minY = Math.min(minY, minimumBoneY(f.r));
    const o = oraclePose(movement, b, false, "leader");
    // Lacets appliqués aux joints (ce que l'oracle prédit) : root.rotation.y = lowerYaw,
    // chest.rotation.y = dissociation (upperYaw - lowerYaw) après lockUpperTrunk.
    near(wrapPi(f.r.root.rotation.y - o.lowerYaw), 0, 1e-9, `${movement} b=${b} lowerYaw`, "lowerYaw");
    near(wrapPi(f.r.chest.rotation.y - (o.upperYaw - o.lowerYaw)), 0, 1e-9, `${movement} b=${b} upperYaw`, "upperYaw");
    for (const s of ["L", "R"]) {
      if (!footBeats(b)) continue; // pieds/lacets comparés quand le pas est posé (e=1)
      const foot = f.r["foot" + s];
      const p = worldPos(foot);
      near(wrapPi(worldYaw(foot) - o["foot" + s].yaw), 0, 1e-6, `${movement} b=${b} foot${s} yaw`, "footYaw");
      if (relative) {
        near(p.x - f.model.legs[s].rest.x, o["foot" + s].x - planRest[s].x, 1e-6, `${movement} b=${b} foot${s}.x (rel repos)`, "foot");
        near(p.z - f.model.legs[s].rest.z, o["foot" + s].z - planRest[s].z, 1e-6, `${movement} b=${b} foot${s}.z (rel repos)`, "foot");
      } else {
        near(p.x, o["foot" + s].x, 1e-6, `${movement} b=${b} foot${s}.x`, "foot");
        near(p.z, o["foot" + s].z, 1e-6, `${movement} b=${b} foot${s}.z`, "foot");
      }
    }
    if (footBeats(b)) near(worldPos(f.r.root).x, o.rootX, 0.03, `${movement} b=${b} rootX`, "rootX");
  }
}

// Pieds comparés quand le pas est posé (e=1) : quarts/ida -> b = 2k+1.2 ; sortie -> b = k+0.6.
checkSolo("quarts", 16, { quarts: true }, (b) => Math.abs((b % 2) - 1.2) < 1e-9);
checkSolo("ida", 8, { ida: true }, (b) => Number.isInteger(b) && b % 2 === 0, true); // frontières b=2k ; pieds relatifs au repos GLB
checkSolo("sortieG", 8, {}, (b) => Math.abs(b - Math.floor(b) - 0.6) < 1e-9, true); // pieds = repos GLB + dx

// Paire + combiné G→F : root monde du leader vs oracle leader, du suiveur (miroir rotY=π) vs -oracle follower.
{
  const lead = fixture(api, { offset: [0, 0, -PAIR_DZ] });
  const fol = fixture(api, { rotation: Math.PI, offset: [0, 0, PAIR_DZ] });
  for (let b = 0; b <= 16; b += 0.25) {
    applyPose(lead.r, lead.model, b, { styleKey: "kizomba", amp: 1, embrace: true, movement: "sortieGF" });
    applyPose(fol.r, fol.model, b, { styleKey: "kizomba", amp: 1, embrace: true, movement: "sortieGF", follower: true });
    minY = Math.min(minY, minimumBoneY(lead.r), minimumBoneY(fol.r));
    const oL = oraclePose("sortieGF", b, false, "leader");
    const oF = oraclePose("sortieGF", b, false, "follower");
    // root.x : la projection de portée (reach discs) peut décaler le root -> tolérance 0.08 m
    near(worldPos(lead.r.root).x, oL.rootX, 0.08, `sortieGF paire b=${b} leader rootX`, "rootX");
    near(worldPos(fol.r.root).x, -oF.rootX, 0.08, `sortieGF paire b=${b} follower rootX (miroir)`, "rootX");
    // pieds posés (e=1, b=k+0.6) : déplacement latéral EXACT vs oracle (rel repos GLB)
    if (Math.abs(b - Math.floor(b) - 0.6) < 1e-9) {
      const pr = oraclePose("quarts", 0, false, "leader").footR;
      for (const [f, o, side] of [[lead, oL, "L"], [lead, oL, "R"], [fol, oF, "L"], [fol, oF, "R"]]) {
        const p = worldPos(f.r["foot" + side]);
        const rest = f.model.legs[side].rest;
        near(p.x - rest.x, (side === "L" ? -pr.x : pr.x) * 0 + o["foot" + side].x - (side === "L" ? -pr.x : pr.x), 1e-6, `sortieGF paire b=${b} foot${side} x`, "foot");
      }
    }
    // fenêtres : leader actif p<8, follower p>=8
    const p = ((b % 16) + 16) % 16;
    if (p >= 8.0 && p < 8.2) near(Math.abs(oL.rootX), 0, 1e-12, "leader nul en p 8", "rootX");
  }
}

if (minY < -1e-9) throw new Error(`sol violé: minY=${minY}`);
checks++;
console.log(`PASS oracle↔poses finales GLB: ${checks} assertions, erreurs max foot=${errors.foot.toExponential(2)} footYaw=${errors.footYaw.toExponential(2)} lowerYaw=${errors.lowerYaw.toExponential(2)} upperYaw=${errors.upperYaw.toExponential(2)} rootX=${errors.rootX.toFixed(4)} minY=${minY.toExponential(2)}`);
