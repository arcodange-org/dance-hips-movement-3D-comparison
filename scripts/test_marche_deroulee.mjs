// #73 — hors figure, la marche déroule le pied (variante élue le 21 novembre 2026, docs/spec-marche-naturelle.md).
// Contrôles sur le vrai GLB, sans relire `gaitStep` : on mesure ce que fait le pied posé par `applyPose`.
//  1. le pied se déroule : le talon se lève à l'impulsion ; la pointe se relève à la pose d'un pas vers l'avant,
//     et le pied se pose par la demi-pointe quand le pas va en arrière ou de côté ;
//  2. le point d'appui (demi-pointe ou talon) ne glisse pas tant qu'il touche le sol ;
//  3. aucun os sous le sol ;
//  4. aucune saccade aux changements de phase du pas (matrices à t−ε, t, t+ε) ;
//  5. le bassin ne bouge pas plus brusquement qu'avec la marche à plat qu'elle remplace (R34) : son plus grand
//     déplacement en un huitième de temps, comparé à celui mesuré sur `main` avant le changement ;
//  6. ce qui ne marche pas garde le pied à plat : le déplacement latéral (les pieds y marquent le pas sur place),
//     l'ida e volta en solo (contrat de l'oracle) et le sur place.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";

const bundle = new URL("./.test-marche-deroulee-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "styles", "rigJoints", "placement"].map(n => `export * from "./src/${n}";`).join("\n"),
  resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href); unlinkSync(bundle);

const f = fixture(api, {});
const SIDES = ["L", "R"];
const deg = v => v * 180 / Math.PI;
const point = (side, name) => f.model.legs[side][name].clone().applyMatrix4(f.r["foot" + side].matrixWorld);
/** Inclinaison du pied : angle de l'axe talon → demi-pointe avec l'horizontale (+ = talon levé). */
const slope = side => { const b = point(side, "ball"), h = point(side, "heel"); return Math.atan2(h.y - b.y, Math.hypot(h.x - b.x, h.z - b.z)); };

// Pose de repos : hauteur des deux points de la semelle et inclinaison à plat (« Sur place » : seule, la kizomba danse
// le « 1 2 », dont un pied marque sur sa demi-pointe, #196).
api.applyPose(f.r, f.model, 0, { styleKey: "kizomba", amp: 0, movement: "surPlace", plant: true });
f.r.root.updateWorldMatrix(true, true);
const rest = Object.fromEntries(SIDES.map(s => [s, { slope: slope(s), ball: point(s, "ball").y, heel: point(s, "heel").y }]));
const pitch = side => slope(side) - rest[side].slope;
/** Le point touche le sol : à moins d'un dixième de millimètre de sa hauteur de repos. */
const grounded = (side, name) => point(side, name).y - rest[side][name] < 1e-4;

const STEP = 1 / 64, FLOOR = -1e-4, SLIDE = 5e-4, FLAT = 1e-6;
function walk(label, options, from, to, expect) {
  const m = { heelUp: 0, toeUp: 0, slide: 0, floor: Infinity, poses: 0, pivoting: 0 };
  let previous = null;
  for (let i = 0, n = Math.round((to - from) / STEP); i <= n; i++) {
    const beat = from + i * STEP;
    api.applyPose(f.r, f.model, beat, options);
    f.r.root.updateWorldMatrix(true, true);
    const floor = minimumBoneY(f.r);
    m.floor = Math.min(m.floor, floor);
    assert(floor >= FLOOR, `${label} temps ${beat.toFixed(3)} : aucun os sous le sol (${(floor * 1000).toFixed(2)} mm)`);
    const now = {};
    for (const s of SIDES) {
      const p = pitch(s);
      m.heelUp = Math.max(m.heelUp, p); m.toeUp = Math.max(m.toeUp, -p);
      now[s] = { p, ball: point(s, "ball"), heel: point(s, "heel"), ballDown: grounded(s, "ball"), heelDown: grounded(s, "heel") };
      if (!previous) continue;
      for (const name of ["ball", "heel"]) {
        if (!now[s][name + "Down"] || !previous[s][name + "Down"]) continue;
        const slide = Math.hypot(now[s][name].x - previous[s][name].x, now[s][name].z - previous[s][name].z);
        m.slide = Math.max(m.slide, slide);
        assert(slide < SLIDE, `${label} temps ${beat.toFixed(3)} : ${name === "ball" ? "demi-pointe" : "talon"} ${s} au sol sans glisser (${(slide * 1000).toFixed(2)} mm)`);
        if (Math.abs(p) > 1e-3) m.pivoting++;
      }
    }
    previous = now; m.poses++;
  }
  if (expect.heelUp !== undefined) assert(deg(m.heelUp) >= expect.heelUp, `${label} : le talon se lève (${deg(m.heelUp).toFixed(1)}° < ${expect.heelUp}°)`);
  if (expect.toeUp !== undefined) assert(deg(m.toeUp) >= expect.toeUp, `${label} : la pointe se relève à la pose (${deg(m.toeUp).toFixed(1)}° < ${expect.toeUp}°)`);
  if (expect.ballLanding) assert(deg(m.toeUp) < 0.5, `${label} : pose par la demi-pointe, la pointe ne se relève pas (${deg(m.toeUp).toFixed(1)}°)`);
  if (expect.flat) assert(Math.max(m.heelUp, m.toeUp) < FLAT, `${label} : le pied reste à plat (${deg(Math.max(m.heelUp, m.toeUp)).toFixed(3)}°)`);
  return m;
}

/** Aucune saccade : les matrices finales à t−ε, t et t+ε restent voisines, aux changements de phase du pas. */
function seams(label, options, times) {
  for (const t of times) {
    const frames = [t - 1e-7, t, t + 1e-7].map(b => { api.applyPose(f.r, f.model, b, options); return snapshot(f.r); });
    for (const [a, b] of [[frames[0], frames[1]], [frames[1], frames[2]]])
      a.forEach((value, i) => assert(Math.abs(value - b[i]) < 1e-4, `${label} : continuité au temps ${t} (matrice ${i})`));
  }
  return times.length;
}

/** Plus grand déplacement du bassin en un huitième de temps (mm), sur les temps 8 à 16. */
function pelvisEighth(options) {
  const N = 256, positions = [];
  for (let i = 0; i <= 8 * N; i++) {
    api.applyPose(f.r, f.model, 8 + i / N, options); f.r.root.updateWorldMatrix(true, true);
    positions.push(f.r.pelvis.getWorldPosition(new THREE.Vector3()));
  }
  let worst = 0;
  for (let i = 0; i + N / 8 < positions.length; i++) worst = Math.max(worst, positions[i].distanceTo(positions[i + N / 8]));
  return worst * 1000;
}
// Référence : la marche à plat de `main` (commit 5f6a76a), même mesure, amplitude 1 : [sens du cercle, sens inversé].
const FLAT_PELVIS_EIGHTH = { kizomba: [69.1, 69.1], semba: [107.4, 100.2], kompa: [114.9, 114.8],
  tarraxinha: [52.7, 59.8], suave: [58.8, 59.2], zouk: [59.8, 59.2] };

const report = [];
let checkedSeams = 0;
const F = api.ROLLED_WALK.flight;
// Cercle du corridinho (temps 8 à 16) : pas vers l'avant d'environ 47 cm, pose par le talon.
for (const styleKey of Object.keys(api.STYLES)) {
  for (const extra of [{}, { reverse: true, follower: true }]) {
    const options = { styleKey, amp: 1, movement: "corridinho", corridinho: true, ...extra };
    const label = `corridinho ${styleKey}${extra.reverse ? " inversé" : ""}`;
    // Sens inversé : le cercle se marche à reculons, le pied se pose par la demi-pointe.
    const m = walk(label, options, 8, 16, extra.reverse ? { heelUp: 12, ballLanding: true } : { heelUp: 12, toeUp: 6 });
    // Un pas par temps : envol de 0 à `F` temps, phases du déroulé à 18 % et 78 % de l'envol.
    checkedSeams += seams(label, options, [8, 9, 10, 11].flatMap(k => [k, k + F * 0.18, k + F * 0.78, k + F]));
    // Bassin : en avant, pas plus brusque que la marche à plat ; à reculons, au plus 15 % de plus.
    const flat = FLAT_PELVIS_EIGHTH[styleKey][extra.reverse ? 1 : 0], pelvis = pelvisEighth(options);
    const limit = extra.reverse ? flat * 1.15 : flat + 0.5;
    assert(pelvis <= limit, `${label} : le bassin fait ${pelvis.toFixed(1)} mm en un huitième de temps (marche à plat : ${flat} mm, limite ${limit.toFixed(1)} mm)`);
    report.push({ label, ...m, pelvis, flat });
  }
}
// Ce qui ne change pas. Déplacement latéral : le bassin va d'un pied à l'autre, chaque pied marque le pas là où
// il est (il ne voyage pas : rien à dérouler). Ida e volta en solo et sur place : à plat.
// Kizomba, kompa et tarraxinha n'ont pas de bascule du pied propre au style : à plat veut dire 0°.
for (const [travel, dir] of [[1, 1], [0.5, -1]])
  walk(`déplacement ${travel}${dir < 0 ? " arrière" : ""} kizomba`, { styleKey: "kizomba", amp: 1, movement: "none", travel, dir }, 0, 8, { flat: true });
for (const styleKey of ["kizomba", "kompa", "tarraxinha"])
  walk(`ida e volta en solo ${styleKey}`, { styleKey, amp: 1, movement: "ida", ida: true }, 0, 8, { flat: true });
// #196: seule, la kizomba danse le « 1 2 » (pieds qui se déplacent, marca sur la demi-pointe, test_um_dois.mjs) ; son
// pas sur place, pieds à plat, est la figure « Sur place ».
walk("sur place kizomba", { styleKey: "kizomba", amp: 1, movement: "surPlace", plant: true }, 0, 8, { flat: true });

const worst = key => Math.max(...report.map(r => r[key]));
const corridinho = report.filter(r => r.label.startsWith("corridinho"));
console.log(`PASS marche déroulée hors figure : ${report.length} marches (${report.reduce((n, r) => n + r.poses, 0)} poses), ` +
  `talon levé jusqu'à ${deg(worst("heelUp")).toFixed(1)}°, pointe relevée jusqu'à ${deg(Math.max(...corridinho.map(r => r.toeUp))).toFixed(1)}° dans le cercle du corridinho, ` +
  `point d'appui immobile (au plus ${(worst("slide") * 1000).toFixed(2)} mm sur ${report.reduce((n, r) => n + r.pivoting, 0)} poses en bascule), ` +
  `os le plus bas ${(Math.min(...report.map(r => r.floor)) * 1000).toFixed(2)} mm, ${checkedSeams} changements de phase continus ; ` +
  `bassin en un huitième de temps : en avant ${Math.round(100 * Math.max(...corridinho.filter(r => !r.label.includes("inversé")).map(r => r.pelvis / r.flat)))} % au plus de la marche à plat, ` +
  `à reculons ${Math.round(100 * Math.max(...corridinho.filter(r => r.label.includes("inversé")).map(r => r.pelvis / r.flat)))} % au plus ; ` +
  `déplacement latéral, ida e volta en solo et sur place à plat`);
if (process.env.DETAIL) for (const r of report) console.log(`  ${r.label} : talon ${deg(r.heelUp).toFixed(1)}°, pointe ${deg(r.toeUp).toFixed(1)}°, glissement ${(r.slide * 1000).toFixed(2)} mm, sol ${(r.floor * 1000).toFixed(2)} mm, bassin ${r.pelvis.toFixed(1)} mm par huitième de temps (à plat : ${r.flat})`);
