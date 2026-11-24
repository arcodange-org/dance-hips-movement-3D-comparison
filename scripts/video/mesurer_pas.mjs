#!/usr/bin/env node
// #155 — mesures du pas de base sur place de chaque style, danseur seul, sur le GLB : ce que la fiche de faits
// (`docs/video/faits-pas-de-base.md`) et la narration disent du modèle à l'image.
// Par style, sur huit temps : trajet du bassin (côté, hauteur, avant-arrière, surface entourée vue de dessus,
// arrêt le plus long), pivot du bassin autour de la verticale (lu sur la ligne des deux hanches), inclinaison du
// tronc vers l'avant, déplacement du buste de côté, flexion des genoux, et le poids : part portée par le pied
// droit sur chaque temps (celle que la pose calcule, figure du « 1 2 » comprise), suite des arrivées du poids (G, D)
// sur huit temps ; le trajet du bassin vu de dessus sur quatre temps (`trajet`, pour le dessiner).
// Usage : node scripts/video/mesurer_pas.mjs [--json]
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "../pose_fixture.mjs";

const bundle = new URL("./.mesurer-pas-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "styles", "rigJoints"].map(n => `export * from "./src/${n}";`).join("\n"), resolveDir: new URL("../../", import.meta.url).pathname, loader: "ts" },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname, define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href); unlinkSync(bundle);

const PAS = 32, TEMPS = 8; // échantillons par temps, temps mesurés
const arrondi = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;
const etendue = v => Math.max(...v) - Math.min(...v);

/** Surface entourée par un trajet fermé (cm²), quel que soit le sens de chaque boucle : un aller-retour par le
 *  même chemin n'entoure rien, une boucle ou un « 8 » entoure la sienne. */
function entoure(pts) {
  const h = 0.025, y0 = Math.min(...pts.map(p => p[1])), ny = Math.ceil(etendue(pts.map(p => p[1])) / h) + 1;
  let cases = 0;
  for (let j = 0; j < ny; j++) {
    const y = y0 + (j + 0.5) * h, coupes = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if ((p[1] <= y) !== (q[1] <= y)) coupes.push([p[0] + (y - p[1]) * (q[0] - p[0]) / (q[1] - p[1]), q[1] > p[1] ? 1 : -1]);
    }
    coupes.sort((u, v) => u[0] - v[0]);
    let tours = 0;
    for (let k = 0; k + 1 < coupes.length; k++) { tours += coupes[k][1]; if (tours !== 0) cases += (coupes[k + 1][0] - coupes[k][0]) / h; }
  }
  return cases * h * h;
}

export function mesurer(styleKey) {
  const f = fixture(api), bassin = [], lacet = [], tronc = [], buste = [], genoux = { L: [], R: [] }, droite = [];
  for (let i = 0; i < TEMPS * PAS; i++) {
    const temps = i / PAS;
    const stats = api.applyPose(f.r, f.model, temps, { styleKey, amp: 1 });
    f.r.root.updateWorldMatrix(true, true);
    const inverse = f.r.root.parent.matrixWorld.clone().invert();
    // Repère du danseur : x vers sa droite, y vers le haut, z vers l'avant ; centimètres.
    const lieu = (nom, en) => { const p = f.r[nom].localToWorld(en ?? new THREE.Vector3()).applyMatrix4(inverse); return [-p.x * 100, p.y * 100, p.z * 100]; };
    const G = lieu("hipL"), D = lieu("hipR"), base = lieu("chest"), epaules = lieu("chest", new THREE.Vector3(0, api.ARM_JOINTS.shoulderL[1], 0));
    bassin.push(lieu("pelvis"));
    lacet.push(Math.atan2(D[2] - G[2], D[0] - G[0]) * 180 / Math.PI);
    tronc.push(Math.atan2(epaules[2] - base[2], epaules[1] - base[1]) * 180 / Math.PI);
    buste.push(base[0]);
    for (const c of ["L", "R"]) genoux[c].push(Math.abs(f.r["knee" + c].rotation.x) * 180 / Math.PI);
    droite.push(stats.loadR); // la part du poids que la pose donne au pied droit (le « 1 2 » compris)
  }
  // Arrêt le plus long : le bassin bouge de moins de 1 mm par seizième de temps.
  let arret = 0, suite = 0;
  for (let i = 0; i < 2 * bassin.length; i++) {
    const p = bassin[i % bassin.length], q = bassin[(i + 2) % bassin.length];
    suite = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 0.1 ? suite + 1 : 0; arret = Math.max(arret, suite);
  }
  // Une arrivée du poids : la part portée par un pied repasse au-dessus de 90 % après être descendue sous 80 %.
  // Deux arrivées de suite sur le même pied : le poids est reparti en partie, puis revenu (double rebond).
  const n = droite.length, suiteDesArrivees = [];
  for (const [nom, part] of [["D", v => v], ["G", v => 1 - v]]) {
    let pret = false;
    for (let i = 0; i < 2 * n; i++) {
      const ici = part(droite[i % n]);
      if (ici < 0.8) pret = true;
      else if (ici > 0.9 && pret) { pret = false; if (i >= n) suiteDesArrivees.push([arrondi((i - n) / PAS, 2), nom]); }
    }
  }
  suiteDesArrivees.sort((a, b) => a[0] - b[0]);
  return {
    style: styleKey, trajet: bassin.slice(0, 4 * PAS).map(p => [arrondi(p[0], 2), arrondi(p[2], 2)]),
    bassin: { cote: arrondi(etendue(bassin.map(p => p[0]))), hauteur: arrondi(etendue(bassin.map(p => p[1]))), avantArriere: arrondi(etendue(bassin.map(p => p[2]))),
      entoureVuDeDessus: arrondi(entoure(bassin.slice(0, 4 * PAS).map(p => [p[0], p[2]]))), arret: arrondi(Math.min(bassin.length, arret) / PAS, 2) },
    pivotDuBassin: arrondi(etendue(lacet) / 2),
    tronc: { inclinaison: arrondi(tronc.reduce((a, b) => a + b, 0) / tronc.length), variation: arrondi(etendue(tronc)), busteDeCote: arrondi(etendue(buste)) },
    genoux: [arrondi(Math.min(...genoux.L, ...genoux.R)), arrondi(Math.max(...genoux.L, ...genoux.R))],
    poids: { partDroiteSurLeTemps: Array.from({ length: TEMPS }, (_, k) => arrondi(droite[k * PAS], 2)), partLaPlusForte: arrondi(Math.max(...droite), 2), arrivees: suiteDesArrivees.map(a => a[1]).join(""), instants: suiteDesArrivees.map(a => a[0]) },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mesures = Object.keys(api.STYLES).map(mesurer);
  if (process.argv.includes("--json")) console.log(JSON.stringify(mesures, null, 1));
  else for (const m of mesures)
    console.log(`${m.style.padEnd(11)} bassin : ${m.bassin.cote} cm de côté, ${m.bassin.hauteur} de haut, ${m.bassin.avantArriere} d'avant en arrière, ${m.bassin.entoureVuDeDessus} cm² entourés, arrêt ${m.bassin.arret} temps ; pivot ±${m.pivotDuBassin}° ; tronc ${m.tronc.inclinaison}° (varie de ${m.tronc.variation}°), buste ${m.tronc.busteDeCote} cm de côté ; genoux ${m.genoux[0]}° à ${m.genoux[1]}° ; poids à droite sur les temps ${m.poids.partDroiteSurLeTemps.join(" ")} (au plus ${m.poids.partLaPlusForte}) ; arrivées ${m.poids.arrivees || "aucune au-dessus de 90 %"} (${m.poids.instants.join(" ")})`);
}
