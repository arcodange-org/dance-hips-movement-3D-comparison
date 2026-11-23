// #179 (élections de variantes) — mesure d'une attitude des mains jointes sur le vrai GLB, haut du corps anatomique.
// Ce n'est pas un test : il chiffre ce que montrent les images (kizomba, quinconce, plexus, amplitude 1).
// Usage : node scripts/mesure_essai_mains.mjs                        (attitude actuelle : entre les poitrines)
//         ESSAI=mainsCote node scripts/mesure_essai_mains.mjs        (sur le côté, milieu des mains à l'épaule, emboîtées)
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
const FINGERS = ["thumb", "index", "middle", "ring", "little"], NOMS = { thumb: "pouce", index: "index", middle: "majeur", ring: "annulaire", little: "auriculaire", fore: "avant-bras" };
const v = a => new THREE.Vector3(...a), world = o => o.getWorldPosition(new THREE.Vector3());
/** Les os d'une main et de son avant-bras, en segments épaissis du rayon de l'os (m) : carpe et métacarpiens, phalanges. */
function bones(u, s) {
  const J = n => u.joints.get(n + s), segs = [{ f: "fore", k: 0, a: world(J("fore0")), b: world(J("hand")), r: 0.011 }];
  for (const f of FINGERS) {
    const tip = J(f + "3").localToWorld(v(manifest.axes[s].tips[f]).sub(v(manifest.rest[`${f}3${s}`])));
    const P = [world(J("hand")), world(J(f + "1")), world(J(f + "2")), world(J(f + "3")), tip];
    for (let k = 0; k < 4; k++) segs.push({ f, k, a: P[k], b: P[k + 1], r: k === 0 ? 0.007 : f === "thumb" ? 0.006 : 0.005 });
  }
  return segs;
}
function gap(A, B) { // distance entre deux segments, rayons ôtés
  const d1 = A.b.clone().sub(A.a), d2 = B.b.clone().sub(B.a), r = A.a.clone().sub(B.a), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
  let s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0, t = (b * s + f) / e;
  if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
  return A.a.clone().addScaledVector(d1, s).distanceTo(B.a.clone().addScaledVector(d2, t)) - A.r - B.r;
}

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
  const seen = { height: range(), top: range(), play: Infinity, pair: "", miss: 0, right: range(), towards: range(), tilt: [range(), range()], grip: range(), wrist: [range(), range()], facing: range(), joined: 0, n: 0 };
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
    // Les os des deux mains (et des avant-bras) ne se traversent pas : jeu minimal entre leurs segments, rayons d'os ôtés.
    seen.miss = Math.max(seen.miss, uppers[1].state.R.error);
    for (const A of bones(uppers[1], "R")) for (const B of bones(uppers[0], "L")) {
      if (A.f === "fore" && B.f === "fore") continue;
      const g = gap(A, B);
      if (g < seen.play) { seen.play = g; seen.pair = `${NOMS[A.f]} ${A.k} (elle) / ${NOMS[B.f]} ${B.k} (lui)`; }
    }
    if (label === "sur place" && Math.abs(b - 2) < 1e-9)
      console.log(`sur place, temps 2 : paume du guideur en (${his.palm.toArray().map(x => x.toFixed(2)).join(", ")}), de la suiveuse en (${hers.palm.toArray().map(x => x.toFixed(2)).join(", ")})`);
  }
  const span = (r, f) => seen.joined ? `${f(r[0])} à ${f(r[1])}` : "—";
  table.push({ figure: label, "mains jointes (échantillons)": `${seen.joined} / ${seen.n}`, "milieu des mains / épaules (cm)": span(seen.height, cm),
    "haut des doigts / épaules (cm)": span(seen.top, cm), "paume du guideur / sa droite (°)": span(seen.right, deg), "/ la suiveuse (°)": span(seen.towards, deg),
    "doigts / verticale, guideur (°)": span(seen.tilt[0], deg), "suiveuse (°)": span(seen.tilt[1], deg),
    "paumes (cm)": span(seen.grip, cm), "face à face, à (°)": span(seen.facing, deg),
    "poignet guideur (°)": span(seen.wrist[0], deg), "poignet suiveuse (°)": span(seen.wrist[1], deg),
    "jeu minimal entre os (cm)": seen.joined ? cm(seen.play) : "—", "au plus près": seen.pair, "sa paume manque sa place de (mm)": +(seen.miss * 1000).toFixed(1) });
  uppers.forEach(u => u.dispose());
}
console.log(`ESSAI=${process.env.ESSAI ?? "(aucun)"}`);
console.table(table);
