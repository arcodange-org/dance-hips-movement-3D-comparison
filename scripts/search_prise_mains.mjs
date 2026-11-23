// #179 — sonde de calibrage de la prise des mains (pas un test) : cherche comment la main droite de la suiveuse
// s'emboîte dans la main gauche du guideur, sur les os du vrai GLB (public/anatomy_upper.glb).
// Règle du propriétaire (23 novembre 2026) : les quatre doigts de la suiveuse, d'un seul bloc comme dans une moufle,
// passent entre le pouce et l'index du guideur, paume contre paume, son pouce sous le sien ; ni os ni muscles ne se
// traversent. La sonde tire des poses au hasard (graine fixe), les note, affine la meilleure et l'affiche dans le
// repère de la main du guideur (R vers son pouce, U vers ses doigts, N hors de sa paume). Les constantes retenues
// sont dans GRIP.upright (src/upperBody.ts) ; scripts/mesure_essai_mains.mjs mesure la prise dans le couple.
// Second temps (photo de référence d'une tenue de salon) : les doigts du guideur se referment sur le tranchant de sa main.
// Usage : node scripts/search_prise_mains.mjs
//   TMIN, TMAX : bornes de l'angle de sa main en travers de la sienne (rad, défaut 1.2 à 1.42) ; N : tirages
//   (défaut 200000) ; POUCE : ouverture du pouce du guideur (rad, défaut 1.55).
//   MAIN_LUI, MAIN_ELLE (#183) : fichier JSON décrivant une autre main que celle du squelette humain, dans le repère
//   de repos du moteur — { poignet, doigts: { thumb|index|… : { os: [articulations], bout, rot: [[{ axe, de, moins }]] } },
//   rayons: { metacarpe, doigt, pouce, avantBras } } : `rot` donne pour chaque articulation ses rotations (axe, angle
//   `de` = f0 f1 f2 pour les doigts, t0 t1 t2 pour le pouce, diminué de `moins`), `rayons` la chair autour des os (m).
//   Les seuils de la recherche s'écartent d'autant que ces rayons dépassent ceux des os humains. SORTIE : fichier JSON
//   où écrire les constantes trouvées.
import { readFileSync, writeFileSync } from "node:fs";
import * as THREE from "three";
const glb = readFileSync(new URL("../public/anatomy_upper.glb", import.meta.url));
const m = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString()).scenes[0].extras;
const v = a => new THREE.Vector3(...a);
const FINGERS = ["thumb", "index", "middle", "ring", "little"];

/** La main du squelette humain, côté `s`, comme modèle : articulations au repos, rotations de chaque articulation,
 * rayons des os (épaissis d'un demi-millimètre à un millimètre : la marge de la recherche). */
function modeleHumain(s) {
  const ax = m.axes[s], doigts = {};
  for (const f of FINGERS) doigts[f] = { os: [1, 2, 3].map(k => m.rest[`${f}${k}${s}`]), bout: ax.tips[f],
    rot: [0, 1, 2].map(k => [{ axe: ax.flexion[f][k], de: (f === "thumb" ? "t" : "f") + k, moins: f === "thumb" && !k ? m.measures[s].thumbToIndex : 0 }]) };
  return { cote: s, poignet: m.rest["hand" + s], doigts, rayons: { metacarpe: 0.008, doigt: 0.0075, pouce: 0.0085, avantBras: 0.016 } };
}
const OS = modeleHumain("L").rayons;   // rayons de référence : ceux des os humains
const lire = (f, s) => f ? { cote: s, ...JSON.parse(readFileSync(f, "utf8")) } : modeleHumain(s);
const LUI = lire(process.env.MAIN_LUI, "L"), ELLE = lire(process.env.MAIN_ELLE, "R");
// Ce que la chair ajoute aux os, en cm : paumes (e), doigts (f), pouces (t). Zéro pour deux mains humaines.
const eL = (LUI.rayons.metacarpe - OS.metacarpe) * 100, eR = (ELLE.rayons.metacarpe - OS.metacarpe) * 100, fL = (LUI.rayons.doigt - OS.doigt) * 100, fR = (ELLE.rayons.doigt - OS.doigt) * 100;
const tL = (LUI.rayons.pouce - OS.pouce) * 100, tR = (ELLE.rayons.pouce - OS.pouce) * 100;

/** Les articulations d'une main posée : `q`, `wrist` placent le poignet ; `shape` plie les doigts (comme UpperBody.shape). */
function hand(M, shape, q = new THREE.Quaternion(), wrist = v(M.poignet)) {
  const s = M.cote, root = new THREE.Object3D(), valeur = { f0: shape.fingers[0], f1: shape.fingers[1], f2: shape.fingers[2], t0: shape.thumb[0], t1: shape.thumb[1], t2: shape.thumb[2] };
  root.position.copy(wrist); root.quaternion.copy(q);
  const nodes = { ["hand" + s]: root };
  for (const f of FINGERS) {
    const D = M.doigts[f]; let parent = root, avant = v(M.poignet);
    D.os.forEach((pos, k) => {
      const o = new THREE.Object3D(); o.position.copy(v(pos).sub(avant)); avant = v(pos);
      for (const r of D.rot[k] ?? []) o.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(v(r.axe), valeur[r.de] - (r.moins ?? 0)));
      parent.add(o); parent = o; nodes[`${f}${k + 1}${s}`] = o;
    });
    const o = new THREE.Object3D(); o.position.copy(v(D.bout).sub(avant)); parent.add(o); nodes[`${f}T${s}`] = o;
    D.derniere = D.os.length;
  }
  root.updateMatrixWorld(true);
  // Une articulation qui manque à cette main (un pouce à deux phalanges) se lit sur la suivante, jusqu'au bout.
  const P = n => { const g = n.match(/^([a-z]+)(\d)$/); const o = nodes[n + s] ?? (g ? nodes[`${g[1]}T${s}`] : undefined); return o.getWorldPosition(new THREE.Vector3()); };
  const segs = [];
  for (const f of FINGERS) {
    const chaine = ["hand", ...M.doigts[f].os.map((_, k) => f + (k + 1)), f + "T"];
    chaine.slice(0, -1).forEach((x, k) => segs.push({ f, k, a: P(x), b: P(chaine[k + 1]), r: k === 0 ? M.rayons.metacarpe : f === "thumb" ? M.rayons.pouce : M.rayons.doigt }));
  }
  return { P, segs, palm: root.localToWorld(v(m.axes[s].palm).sub(v(M.poignet))), q };
}
const basis = (x, y) => new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
const from = (d0, h0, d, h) => {
  const hp = h0.clone().addScaledVector(d0, -h0.dot(d0)).normalize(), hq = h.clone().addScaledVector(d, -h.dot(d)).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(basis(d, hq).multiply(basis(d0, hp).transpose()));
};
function segDist(p1, q1, p2, q2) { // distance entre deux segments
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  let s, t; const c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
  s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e;
  if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
  return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t));
}

// Repère de la main gauche du guideur au repos.
const axL = m.axes.L, U = v(axL.fingers).normalize(), R = new THREE.Vector3().crossVectors(v(axL.palmNormal), U).normalize(), N = new THREE.Vector3().crossVectors(U, R).normalize();
const palmL = v(axL.palm), toFrame = p => { const d = p.clone().sub(palmL); return [d.dot(R), d.dot(U), d.dot(N)].map(x => +(x * 100).toFixed(1)); };
const axR = m.axes.R, restF = v(axR.fingers).normalize(), restN = v(axR.palmNormal).normalize(), palmFromWrist = v(axR.palm).sub(v(ELLE.poignet));

/** Pose de la suiveuse relative à la main du guideur. p = { theta, a, b, g, roll, pitch, f:[..], t:[..] } */
function hers(p) {
  const d = U.clone().multiplyScalar(Math.cos(p.theta)).addScaledVector(R, Math.sin(p.theta));
  const side = new THREE.Vector3().crossVectors(d, N).normalize();           // largeur de sa main, dans le plan de la paume du guideur
  // roulis autour de ses doigts, tangage : ses doigts piquent vers (ou hors de) la paume du guideur
  const n = N.clone().negate().applyAxisAngle(d, p.roll);
  const dd = d.clone().applyAxisAngle(side, p.pitch), nn = n.clone().applyAxisAngle(side, p.pitch);
  const q = from(restF, restN, dd, nn);
  const P = palmL.clone().addScaledVector(R, p.a).addScaledVector(U, p.b).addScaledVector(N, p.g);
  return hand(ELLE, { fingers: p.f, thumb: p.t }, q, P.clone().sub(palmFromWrist.clone().applyQuaternion(q)));
}
function score(p, his, detail = false) {
  const h = hers(p);
  let pen = 0, worst = Infinity, pair = "";
  for (const A of h.segs) for (const B of his.segs) {
    const dist = segDist(A.a, A.b, B.a, B.b), lack = A.r + B.r + 0.001 - dist;
    if (dist - A.r - B.r < worst) { worst = dist - A.r - B.r; pair = `${A.f}${A.k} / ${B.f}${B.k}`; }
    if (lack > 0) pen += (lack * 100) ** 2;
  }
  // Ses quatre doigts passent entre le pouce et l'index du guideur : le bout de chaque doigt derrière la main du guideur
  // (N < -1,2 cm), du côté de son pouce ; ses premières phalanges devant sa paume.
  let hook = 0, front = 0;
  const thumbMCP = toFrame(his.P("thumb2")), indexMCP = toFrame(his.P("index1"));
  for (const f of ["index", "middle", "ring", "little"]) {
    const tip = toFrame(h.P(f + "T")), k1 = toFrame(h.P(f + "1")), k2 = toFrame(h.P(f + "2"));
    hook += Math.max(0, tip[2] + 1.4 + eL) ** 2 + Math.max(0, -2.6 - 2 * eL - fR - tip[2]) ** 2 + Math.max(0, tip[0] - (k2[0] - 0.8)) ** 2;   // le bout derrière la main, revenu vers elle                                   // le bout derrière la main
    front += Math.max(0, 0.9 + eL + eR - k1[2]) ** 2;                                    // la jointure devant la paume
    // la deuxième articulation au-delà du bord de la palmure (droite pouce MCP -> index MCP), entre les deux doigts
    const ex = indexMCP[0] - thumbMCP[0], ey = indexMCP[1] - thumbMCP[1], L = Math.hypot(ex, ey);
    const along = ((k2[0] - thumbMCP[0]) * ex + (k2[1] - thumbMCP[1]) * ey) / L, beyond = ((k2[0] - thumbMCP[0]) * ey - (k2[1] - thumbMCP[1]) * ex) / L;
    hook += Math.max(0, 0.6 + eL + fR - beyond) ** 2 + Math.max(0, beyond - 2.2 - eL - fR) ** 2 + Math.max(0, -along) ** 2 + Math.max(0, along - L) ** 2;
  }
  // Paume contre paume : écart faible, paumes parallèles, sa paume sur celle du guideur.
  const palm = toFrame(h.palm), flat = (p.roll * 6) ** 2 + (p.pitch * 6) ** 2 + Math.max(0, palm[2] - 1.8 - eL - eR) ** 2 * 4 + Math.max(0, Math.abs(palm[0]) - 2) ** 2 * 2 + Math.max(0, -4 - palm[1]) ** 2 + Math.max(0, palm[1] - 1) ** 2;
  // Son pouce sous celui du guideur : le bout de son pouce plus bas (U) que le pouce du guideur, à moins de 3 cm.
  const ht = toFrame(his.P("thumb3")); let under = 0;
  for (const n of ["thumb2", "thumb3", "thumbT"]) { const tt = toFrame(h.P(n)); under += Math.max(0, tt[1] - (ht[1] - 1.5 - tL - tR)) ** 2 + Math.max(0, -6.6 - tL - tR - tt[1]) ** 2 + Math.max(0, 0.9 + (eL + eR) / 2 - tt[2]) ** 2 + (n === "thumb2" ? 0 : Math.max(0, 2.5 - tt[0]) ** 2); }
  const total = pen * 4 + hook * 3 + front + flat + under;
  return detail ? { total, pen, hook, front, flat, under, worst: +(worst * 100).toFixed(2), pair, h } : total;
}

const hisShape = { fingers: [0.14, 0.16, 0.1], thumb: [Number(process.env.POUCE ?? 1.55), 0.05, 0.1] };
const his = hand(LUI, hisShape);
// Avant-bras du guideur tel que le moteur le pose dans cette prise (poignet plié de 46°) : vers son coude, dans le repère de sa main.
const versCoude = R.clone().multiplyScalar(0.71).addScaledVector(U, -0.69).addScaledVector(N, 0.12).normalize();
his.segs.push({ f: "avant-bras", k: 0, a: his.P("hand"), b: his.P("hand").addScaledVector(versCoude, 0.14), r: LUI.rayons.avantBras });
console.log("guideur (R,U,N cm) : pouce", ["thumb1", "thumb2", "thumb3", "thumbT"].map(n => toFrame(his.P(n)).join(",")).join(" | "), "; index", ["index1", "index2", "index3", "indexT"].map(n => toFrame(his.P(n)).join(",")).join(" | "), "; auriculaire", toFrame(his.P("little1")).join(","), "; poignet", toFrame(his.P("hand")).join(","));

const E = (eL + eR) / 100;   // la chair des deux paumes, en mètres : elle écarte d'autant les bornes de la recherche
const lo = { theta: Number(process.env.TMIN ?? 1.2), a: -0.03 - E, b: -0.05 - E, g: 0.006 + 0.7 * E, roll: -0.12, pitch: -0.12, f0: 0.05, f1: 0.3, f2: 0.1, t0: 0.3, t1: 0, t2: 0 };
const hi = { theta: Number(process.env.TMAX ?? 1.42), a: 0.045 + E, b: 0.02 + E, g: 0.025 + 1.3 * E, roll: 0.12, pitch: 0.12, f0: 1.0, f1: 1.9, f2: 1.3, t0: 1.5, t1: 0.9, t2: 0.9 };
const keys = Object.keys(lo), unpack = x => ({ theta: x.theta, a: x.a, b: x.b, g: x.g, roll: x.roll, pitch: x.pitch, f: [x.f0, x.f1, x.f2], t: [x.t0, x.t1, x.t2] });
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
let best = null, bestS = Infinity;
for (let i = 0; i < Number(process.env.N ?? 200000); i++) {
  const x = Object.fromEntries(keys.map(k => [k, lo[k] + rnd() * (hi[k] - lo[k])])), s = score(unpack(x), his);
  if (s < bestS) { bestS = s; best = x; }
}
for (let pass = 0, step = 0.25; pass < 400; pass++) {            // affinage local
  const x = { ...best }; for (const k of keys) if (rnd() < 0.4) x[k] = Math.min(hi[k], Math.max(lo[k], x[k] + (rnd() - 0.5) * step * (hi[k] - lo[k])));
  const s = score(unpack(x), his); if (s < bestS) { bestS = s; best = x; } else if (pass % 60 === 59) step *= 0.6;
}
const d = score(unpack(best), his, true);
console.log("meilleur :", JSON.stringify(Object.fromEntries(keys.map(k => [k, +best[k].toFixed(3)]))));
console.log(`total ${d.total.toFixed(2)} ; pénétration ${d.pen.toFixed(2)} ; crochet ${d.hook.toFixed(2)} ; devant ${d.front.toFixed(2)} ; à plat ${d.flat.toFixed(2)} ; pouce ${d.under.toFixed(2)} ; jeu minimal ${d.worst} cm (${d.pair})`);
console.log("suiveuse (R,U,N cm) : paume", toFrame(d.h.palm).join(","), "; poignet", toFrame(d.h.P("hand")).join(","));
for (const f of FINGERS) console.log("  ", f, ["1", "2", "3", "T"].map(n => toFrame(d.h.P(f + n)).join(",")).join(" | "));
console.log(`GRIP.upright : across ${best.theta.toFixed(3)}, at [${[best.a, best.b, best.g].map(x => x.toFixed(3)).join(", ")}], roll ${best.roll.toFixed(3)}, pitch ${best.pitch.toFixed(3)}, hers { fingers: [${[best.f0, best.f1, best.f2].map(x => x.toFixed(3)).join(", ")}], thumb: [${[best.t0, best.t1, best.t2].map(x => x.toFixed(3)).join(", ")}] }`);

// Deuxième temps (photo de référence d'une tenue de salon, 23 novembre 2026) : sa main posée, les quatre doigts du
// guideur, d'un seul bloc, se referment sur le tranchant de la main de la suiveuse et viennent sur le dos de sa main,
// sans traverser ses os. Sa pose à elle ne bouge plus ; on cherche la flexion des doigts du guideur.
const elle = d.h, dos = toFrame(elle.palm)[2];
function enveloppe(f) {
  const lui = hand(LUI, { fingers: f, thumb: hisShape.thumb });
  let pen = 0, worst = Infinity, pair = "", wrap = 0;
  for (const A of elle.segs) for (const B of lui.segs) {
    const dist = segDist(A.a, A.b, B.a, B.b), lack = A.r + B.r + 0.001 - dist;
    if (dist - A.r - B.r < worst) { worst = dist - A.r - B.r; pair = `${A.f}${A.k} / ${B.f}${B.k}`; }
    if (lack > 0) pen += (lack * 100) ** 2;
  }
  for (const g of ["index", "middle", "ring", "little"]) {
    // Le bout du doigt passé sur le dos de sa main (au-delà de sa paume vers N), revenu vers son poignet à lui (U),
    // et sa dernière phalange près de ses os à elle (moins de 4 mm de jeu).
    const tip = toFrame(lui.P(g + "T")), base = toFrame(lui.P(g + "1"));
    const last = lui.segs.find(x => x.f === g && x.k === 3);
    let near = Infinity; for (const A of elle.segs) near = Math.min(near, segDist(A.a, A.b, last.a, last.b) - A.r - last.r);
    wrap += Math.max(0, dos + 1.6 + eR + fL - tip[2]) ** 2 + Math.max(0, tip[1] - (base[1] - 1.5)) ** 2 + Math.max(0, near * 100 - 0.4) ** 2;
  }
  // Avec de la chair, ne rien traverser passe avant de faire le tour : des doigts trop courts pour une main épaisse
  // s'arrêtent au contact. Pour deux mains d'os, le poids d'origine (constantes validées le 23 novembre 2026).
  return { total: pen * (eL + eR + fL + fR > 0 ? 40 : 4) + wrap, pen, wrap, worst: +(worst * 100).toFixed(2), pair };
}
let bf = [0.14, 0.16, 0.1], bs = enveloppe(bf).total;
for (let i = 0; i < 20000; i++) { const f = [rnd() * 1.6, rnd() * 1.8, rnd() * 1.2], t = enveloppe(f).total; if (t < bs) { bs = t; bf = f; } }
for (let pass = 0, step = 0.3; pass < 300; pass++) {
  const f = bf.map(x => Math.max(0, x + (rnd() - 0.5) * step)), t = enveloppe(f).total; if (t < bs) { bs = t; bf = f; } else if (pass % 50 === 49) step *= 0.6;
}
const e = enveloppe(bf);
console.log(`enveloppe : total ${e.total.toFixed(2)} ; pénétration ${e.pen.toFixed(2)} ; tour ${e.wrap.toFixed(2)} ; jeu minimal ${e.worst} cm (${e.pair})`);
console.log(`GRIP.upright.his : fingers [${bf.map(x => x.toFixed(3)).join(", ")}]`);
if (process.env.SORTIE) writeFileSync(process.env.SORTIE, JSON.stringify({
  across: +best.theta.toFixed(3), at: [best.a, best.b, best.g].map(x => +x.toFixed(4)), roll: +best.roll.toFixed(3), pitch: +best.pitch.toFixed(3),
  his: { fingers: bf.map(x => +x.toFixed(3)), thumb: hisShape.thumb }, hers: { fingers: [best.f0, best.f1, best.f2].map(x => +x.toFixed(3)), thumb: [best.t0, best.t1, best.t2].map(x => +x.toFixed(3)) },
  mesures: { penetration: +d.pen.toFixed(3), jeuMinimalCm: d.worst, enveloppe: { penetration: +e.pen.toFixed(3), jeuMinimalCm: e.worst } },
}, null, 1) + "\n");
