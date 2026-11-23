// #179 (élections de variantes) — mesure d'une attitude des mains jointes sur le vrai GLB, haut du corps anatomique.
// Ce n'est pas un test : il chiffre ce que montrent les images (kizomba, quinconce, plexus, amplitude 1).
// Usage : node scripts/mesure_essai_mains.mjs                        (attitude actuelle : entre les poitrines)
//         ESSAI=mainsCote node scripts/mesure_essai_mains.mjs        (sur le côté, milieu des mains à l'épaule, mains dressées)
//         ESSAI=mainsBasses node scripts/mesure_essai_mains.mjs      (sur le côté, plus bas)
// Même montage du couple que scripts/test_upper_body.mjs.
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";

const bundle = new URL("./.mesure-essai-mains-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "styles", "rigJoints", "muscles", "quartsPaire", "sortieGarcon", "sortieFille", "idaPaire", "placePaire", "cadre", "upperBody"]
  .map(n => `export * from "./src/${n}";`).join("\n"), resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href); unlinkSync(bundle);
const glb = readFileSync(new URL("../public/anatomy_upper.glb", import.meta.url));
const manifest = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString()).scenes[0].extras;
const model = { manifest, pieces: [] };
const options = { boneMaterial: new THREE.MeshBasicMaterial(), muscleMaterial: () => new THREE.MeshBasicMaterial() };
const deg = x => Math.round(x * 180 / Math.PI), cm = x => +(x * 100).toFixed(1);
const UP = new THREE.Vector3(0, 1, 0);

const cases = [
  ["sur place", api.PLACE_PAIR_DZ, 4, { movement: "none", placePaire: true }],
  ["sortie garçon", api.SORTIE_GARCON_PAIR_DZ, 5, { movement: "sortieG" }],
  ["sortie fille", api.SORTIE_FILLE_PAIR_DZ, 5, { movement: "sortieF" }],
  ["quarts de tour", api.QUARTS_PAIR_DZ, 16, { movement: "quarts", quarts: true, quartsPaire: true }],
  ["ida e volta", api.IDA_PAIR_DZ, 8, { movement: "ida", ida: true, idaPaire: true }],
];
const table = [];
for (const [label, dz, beats, opt] of cases) {
  const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
  const uppers = pair.map(f => new api.UpperBody(f.r, model, options));
  const range = () => [Infinity, -Infinity], add = (r, x) => { r[0] = Math.min(r[0], x); r[1] = Math.max(r[1], x); };
  const seen = { height: range(), top: range(), right: range(), towards: range(), tilt: [range(), range()], grip: range(), wrist: [range(), range()], facing: range(), joined: 0, n: 0 };
  for (let b = 0; b <= beats; b += 1 / 16) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, b, { ...opt, embrace: true, placement: "quinconce", follower: !!i, styleKey: "kizomba", amp: 1, plexus: true }));
    pair.forEach((f, i) => api.solveFrame(f.r, pair[1 - i].r, !!i));
    uppers.forEach((u, i) => u.update(pair[1 - i].r, !!i));
    seen.n++;
    if (uppers[0].state.L.hold !== "hands" || uppers[1].state.R.hold !== "hands") continue;
    seen.joined++;
    const his = uppers[0].hand("L"), hers = uppers[1].hand("R");
    const shoulders = pair[0].r.chest.localToWorld(new THREE.Vector3(...api.ARM_JOINTS.shoulderL)).y / 2 + pair[1].r.chest.localToWorld(new THREE.Vector3(...api.ARM_JOINTS.shoulderR)).y / 2;
    // Milieu de la main : entre le poignet et le bout du majeur (dernière articulation, à 2 cm du bout).
    const middle = s => uppers[s === "L" ? 0 : 1].joints.get("hand" + s).getWorldPosition(new THREE.Vector3()).add(uppers[s === "L" ? 0 : 1].joints.get("middle3" + s).getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    add(seen.height, (middle("L").y + middle("R").y) / 2 - shoulders);
    add(seen.top, Math.max(uppers[0].joints.get("middle3L").getWorldPosition(new THREE.Vector3()).y, uppers[1].joints.get("middle3R").getWorldPosition(new THREE.Vector3()).y) - shoulders);
    add(seen.right, his.normal.angleTo(new THREE.Vector3(-1, 0, 0).transformDirection(pair[0].r.chest.matrixWorld)));
    add(seen.towards, his.normal.angleTo(new THREE.Vector3(0, 0, 1).transformDirection(pair[0].r.chest.matrixWorld)));
    add(seen.tilt[0], his.fingers.angleTo(UP)); add(seen.tilt[1], hers.fingers.angleTo(UP));
    add(seen.grip, hers.palm.distanceTo(his.palm)); add(seen.facing, Math.PI - hers.normal.angleTo(his.normal));
    add(seen.wrist[0], uppers[0].state.L.wrist); add(seen.wrist[1], uppers[1].state.R.wrist);
    if (label === "sur place" && Math.abs(b - 2) < 1e-9)
      console.log(`sur place, temps 2 : paume du guideur en (${his.palm.toArray().map(x => x.toFixed(2)).join(", ")}), de la suiveuse en (${hers.palm.toArray().map(x => x.toFixed(2)).join(", ")})`);
  }
  const span = (r, f) => seen.joined ? `${f(r[0])} à ${f(r[1])}` : "—";
  table.push({ figure: label, "mains jointes (échantillons)": `${seen.joined} / ${seen.n}`, "milieu des mains / épaules (cm)": span(seen.height, cm),
    "haut des doigts / épaules (cm)": span(seen.top, cm), "paume du guideur / sa droite (°)": span(seen.right, deg), "/ la suiveuse (°)": span(seen.towards, deg),
    "doigts / verticale, guideur (°)": span(seen.tilt[0], deg), "suiveuse (°)": span(seen.tilt[1], deg),
    "paumes (cm)": span(seen.grip, cm), "face à face, à (°)": span(seen.facing, deg),
    "poignet guideur (°)": span(seen.wrist[0], deg), "poignet suiveuse (°)": span(seen.wrist[1], deg) });
  uppers.forEach(u => u.dispose());
}
console.log(`ESSAI=${process.env.ESSAI ?? "(aucun)"}`);
console.table(table);
