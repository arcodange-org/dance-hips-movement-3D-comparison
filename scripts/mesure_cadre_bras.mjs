// #185 — mesure du cadre fermé sur le vrai GLB, haut du corps anatomique : où se pose la main droite du guideur sur le
// dos de la suiveuse (par rapport à son omoplate gauche), et lequel des deux bras passe au-dessus de l'autre là où ils
// se croisent (bras gauche de la suiveuse, bras droit du guideur). Ce n'est pas un test : il chiffre ce que montrent
// les images (kizomba, quinconce, plexus, amplitude 1).
// Usage : node scripts/mesure_cadre_bras.mjs                     (comportement)
//         ESSAI=coudeBas node scripts/mesure_cadre_bras.mjs      (candidat : le coude de la suiveuse où #180 l'avait mis)
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";

const bundle = new URL("./.mesure-cadre-bras-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "styles", "rigJoints", "muscles", "quartsPaire", "sortieGarcon", "sortieFille", "idaPaire", "placePaire", "cadre", "upperBody"]
  .map(n => `export * from "./src/${n}";`).join("\n"), resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
export const api = await import(bundle.href); unlinkSync(bundle);
const glb = readFileSync(new URL("../public/anatomy_upper.glb", import.meta.url));
const manifest = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString()).scenes[0].extras;
const model = { manifest, pieces: [] };
const options = { boneMaterial: new THREE.MeshBasicMaterial(), muscleMaterial: () => new THREE.MeshBasicMaterial() };
const cm = x => +(x * 100).toFixed(1), world = o => o.getWorldPosition(new THREE.Vector3());

/** Les deux segments d'un bras anatomique : épaule → coude → poignet (monde). */
const arm = (u, s) => [world(u.joints.get("arm" + s)), world(u.joints.get("fore0" + s)), world(u.joints.get("hand" + s))];
/** Les points les plus proches de deux segments (a0-a1, b0-b1). */
function closest(a0, a1, b0, b1) {
  const d1 = a1.clone().sub(a0), d2 = b1.clone().sub(b0), r = a0.clone().sub(b0), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
  let s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0, t = (b * s + f) / e;
  if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
  return [a0.clone().addScaledVector(d1, s), b0.clone().addScaledVector(d2, t)];
}
export function measure(label, dz, beats, opt, log = false) {
  const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
  const uppers = pair.map(f => new api.UpperBody(f.r, model, options));
  const range = () => [Infinity, -Infinity], add = (r, x) => { r[0] = Math.min(r[0], x); r[1] = Math.max(r[1], x); };
  const seen = { on: 0, n: 0, x: range(), y: range(), z: range(), over: range(), gap: range(), elbowHis: range(), elbowHers: range(), shoulderHand: 0, cross: range(), crossed: 0, miss: 0, elbows: range(), outside: range(), under: range() };
  for (let b = 0; b <= beats; b += 1 / 16) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, b, { ...opt, embrace: true, placement: "quinconce", follower: !!i, styleKey: "kizomba", amp: 1, plexus: true }));
    const frames = pair.map((f, i) => api.solveFrame(f.r, pair[1 - i].r, !!i));
    uppers.forEach((u, i) => u.update(pair[1 - i].r, !!i));
    seen.n++;
    if (uppers[0].state.R.hold !== "back" || frames[0].R.released) continue;
    seen.on++;
    // La paume du guideur dans le repère de la poitrine de la suiveuse (+x : sa gauche ; +y : haut ; -z : son dos).
    const palm = pair[1].r.chest.worldToLocal(uppers[0].hand("R").palm.clone());
    add(seen.x, palm.x); add(seen.y, palm.y); add(seen.z, palm.z);
    if (uppers[1].state.L.hold === "back") seen.shoulderHand++;
    // Là où les deux bras sont au plus près : lequel est au-dessus (hauteur de la suiveuse moins celle du guideur).
    const his = arm(uppers[0], "R"), hers = arm(uppers[1], "L");
    let best = null;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const [p, q] = closest(hers[i], hers[i + 1], his[j], his[j + 1]), d = p.distanceTo(q);
      if (!best || d < best.d) best = { d, over: p.y - q.y, i, j, out: pair[1].r.chest.worldToLocal(p.clone()).x - pair[1].r.chest.worldToLocal(q.clone()).x };
    }
    // Son coude par rapport à celui du guideur ; son bras en dehors de celui du guideur (repère de sa poitrine, vers sa
    // gauche) ; le poignet du guideur sous l'épaule de la suiveuse.
    add(seen.elbows, hers[1].y - his[1].y); add(seen.outside, best.out); add(seen.under, hers[0].y - his[2].y);
    add(seen.over, best.over); add(seen.gap, best.d);
    seen.miss = Math.max(seen.miss, uppers[1].state.L.error, uppers[0].state.R.error);
    // Vu de dessus : là où son bras croise celui du guideur, de combien il est plus haut.
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const a = hers[i], b = hers[i + 1], c = his[j], d = his[j + 1];
      const den = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x);
      if (Math.abs(den) < 1e-9) continue;
      const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / den, u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      seen.crossed++; add(seen.cross, a.y + (b.y - a.y) * t - (c.y + (d.y - c.y) * u));
    }
    add(seen.elbowHis, his[1].y - his[0].y); add(seen.elbowHers, hers[1].y - hers[0].y);
    if (log && Math.abs(b - 2) < 1e-9) console.log(`${label}, temps 2 : paume du guideur dans la poitrine de la suiveuse (${palm.toArray().map(x => x.toFixed(3)).join(", ")}) ; au plus près : ${["bras", "avant-bras"][best.i]} (elle) / ${["bras", "avant-bras"][best.j]} (lui), ${cm(best.d)} cm, elle ${cm(best.over)} cm au-dessus`);
  }
  uppers.forEach(u => u.dispose());
  return seen;
}
export const CASES = [
  ["sur place", api.PLACE_PAIR_DZ, 4, { movement: "none", placePaire: true }],
  ["sortie garçon", api.SORTIE_GARCON_PAIR_DZ, 5, { movement: "sortieG" }],
  ["sortie fille", api.SORTIE_FILLE_PAIR_DZ, 5, { movement: "sortieF" }],
  ["quarts de tour", api.QUARTS_PAIR_DZ, 16, { movement: "quarts", quarts: true, quartsPaire: true }],
  ["ida e volta", api.IDA_PAIR_DZ, 8, { movement: "ida", ida: true, idaPaire: true }],
];
if (import.meta.url === `file://${process.argv[1]}`) {
  const span = (r, f = cm) => r[0] === Infinity ? "—" : `${f(r[0])} à ${f(r[1])}`;
  console.log(`ESSAI=${process.env.ESSAI ?? "(aucun)"} — corps de l'omoplate gauche dans le repère de la poitrine : 6 à 13 cm de la colonne, 2 à 10 cm au-dessus de son origine`);
  console.table(CASES.map(([label, dz, beats, opt]) => {
    const s = measure(label, dz, beats, opt, true);
    return { figure: label, "main au dos (échantillons)": `${s.on} / ${s.n}`, "paume x (cm, vers sa gauche)": span(s.x), "y (cm, au-dessus de sa poitrine)": span(s.y), "z (cm, vers son dos)": span(s.z),
      "son bras au-dessus du sien, au plus près (cm)": span(s.over), "écart des deux bras (cm)": span(s.gap), "son bras en dehors du sien (cm)": span(s.outside), "son coude au-dessus du sien (cm)": span(s.elbows), "poignet du guideur sous son épaule (cm)": span(s.under), "mains manquent leur place de (mm)": +(s.miss * 1000).toFixed(1), "coude du guideur sous son épaule (cm)": span(s.elbowHis), "coude de la suiveuse sous la sienne (cm)": span(s.elbowHers) };
  }));
}
