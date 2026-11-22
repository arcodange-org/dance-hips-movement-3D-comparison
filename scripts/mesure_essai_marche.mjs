// #148 (élections de variantes) — mesure d'un candidat de la marche hors figure (#73) sur le vrai GLB.
// Ce n'est pas un test : il chiffre ce que montre le GIF (kizomba, solo, corridinho, amplitude 1,
// temps 8 à 16 : le danseur marche le cercle, un pas d'environ 47 cm tous les 2 temps par pied).
// Depuis le vote du 21 novembre 2026, la marche déroulée est le comportement : `ESSAI=marcheDeroulee` n'a plus d'effet
// (les mesures A et B du dossier se refont au commit 06d1a33).
// Usage : node scripts/mesure_essai_marche.mjs                       (marche actuelle, à plat)
//         ESSAI=marcheDeroulee node scripts/mesure_essai_marche.mjs  (candidat « déroulée »)
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY } from "./pose_fixture.mjs";

const bundle = new URL("./.mesure-essai-marche-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "styles", "rigJoints", "placement"]
  .map(n => `export * from "./src/${n}";`).join("\n"), resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href); unlinkSync(bundle);

const f = fixture(api);
const options = { styleKey: "kizomba", amp: 1, movement: "corridinho", corridinho: true };
const NAMES = { L: "gauche", R: "droit" };
// Inclinaison du pied : angle de son axe talon-pointe avec le sol, par rapport au pied posé au repos.
const pitch = side => { const t = f.model.legs[side].toeOut;
  const axis = new THREE.Vector3(Math.sin(t), 0, Math.cos(t)).applyQuaternion(f.r["foot" + side].getWorldQuaternion(new THREE.Quaternion()));
  return THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, axis.y)))); };
api.applyPose(f.r, f.model, 0, { styleKey: "kizomba", amp: 0 });
const rest = { L: pitch("L"), R: pitch("R") };
const most = { angle: 0 }, up = { angle: 0 }, down = { angle: 0 }; let flat = 0, samples = 0, lowest = Infinity;
for (let beat = 8; beat < 16 - 1e-9; beat += 0.02) {
  api.applyPose(f.r, f.model, beat, options); samples++;
  lowest = Math.min(lowest, minimumBoneY(f.r));
  let tilted = false;
  for (const side of ["L", "R"]) {
    const angle = pitch(side) - rest[side];
    if (Math.abs(angle) > 1) tilted = true;
    if (Math.abs(angle) > Math.abs(most.angle)) Object.assign(most, { angle, beat, side });
    if (angle < down.angle) Object.assign(down, { angle, beat, side });
    if (angle > up.angle) Object.assign(up, { angle, beat, side });
  }
  if (!tilted) flat++;
}
const deg = v => v.toFixed(1).replace(".", ",");
console.log(`candidat : ${process.env.ESSAI ?? "marche actuelle"}`);
console.log(`les deux pieds à plat (moins de 1° d'inclinaison) : ${flat} instants sur ${samples}`);
console.log(`pointe la plus basse (talon levé) : ${deg(-down.angle)}°${down.side ? `, pied ${NAMES[down.side]}, au temps ${down.beat.toFixed(2)}` : ""}`);
console.log(`pointe la plus haute (pose par le talon) : ${deg(up.angle)}°${up.side ? `, pied ${NAMES[up.side]}, au temps ${up.beat.toFixed(2)}` : ""}`);
console.log(`os le plus bas : ${(lowest * 1000).toFixed(2).replace(".", ",")} mm par rapport au sol (négatif = sous le sol)`);
void most;
