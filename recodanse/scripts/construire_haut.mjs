#!/usr/bin/env node
// Construit le haut du corps anatomique du pont ReCoDanse : thorax, colonne, cou, crâne, ceinture
// scapulaire, bras, avant-bras et mains (os et muscles), depuis BodyParts3D 4.0.
//
//   node recodanse/scripts/construire_haut.mjs [--cache recodanse/.cache/bp3d] [--maille-os 0.0025] [--maille-muscle 0.003] [--brut]
//
// Sorties : recodanse/actifs/anatomie_haut.glb (maillages pesés sur 18 articulations, peau glTF standard,
//           compressé par Draco avec @gltf-transform/cli ; --brut : sans compression)
//           recodanse/actifs/anatomie_haut.json (articulations au repos, axes, pièces, mesures)
// Les trois fichiers de BodyParts3D (voir bp3d.mjs) se déposent dans le cache ; rien n'est téléchargé ici.
//
// Même repère que public/anatomy.glb (voir bp3d.mjs). Les poids de peau sont calculés ici, une fois :
// le pont ne déforme rien à la main pendant la danse.
// Licence des maillages : BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan.
import { execFileSync } from "node:child_process";
import { renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ouvrir, boite, centre, centreTranche, sphere, SOURCE } from "./bp3d.mjs";

const ici = path.dirname(fileURLToPath(import.meta.url));
const arg = (nom, defaut) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > 0 ? process.argv[i + 1] : defaut;
};
const cache = path.resolve(arg("cache", path.join(ici, "../.cache/bp3d")));
const sortie = path.resolve(arg("sortie", path.join(ici, "../actifs")));
const MAILLE_OS = +arg("maille-os", 0.0025), MAILLE_MUSCLE = +arg("maille-muscle", 0.003);
const b = ouvrir(cache);

// Articulations du moteur au repos, dans le repère du squelette (src/rigJoints.ts : spine, chest = spine + chest,
// head = chest + head). Recopiées ici ; scripts/test_contrat.mjs échoue si le moteur les change.
const MOTEUR = { bassin: [0, 0, 0], colonne: [0, 0.08, 0], thorax: [0, 0.32, 0], tete: [0, 0.6, 0] };

// ---------- vecteurs ----------
const sub = (a, c) => [a[0] - c[0], a[1] - c[1], a[2] - c[2]];
const add = (a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
const cross = (a, c) => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
const norme = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => mul(a, 1 / norme(a));
const lisse = (a, c, x) => { const t = Math.max(0, Math.min(1, (x - a) / (c - a))); return t * t * (3 - 2 * t); };
const arrondi = (a, n = 4) => a.map(x => +x.toFixed(n));

/** Axes principaux d'un nuage (Jacobi sur la covariance) : du plus étalé au moins étalé. */
function axes(points) {
  const c = [0, 0, 0];
  for (const p of points) for (let k = 0; k < 3; k++) c[k] += p[k] / points.length;
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of points) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m[i][j] += (p[i] - c[i]) * (p[j] - c[j]);
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let tour = 0; tour < 60; tour++) for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
    if (Math.abs(m[p][q]) < 1e-18) continue;
    const th = 0.5 * Math.atan2(2 * m[p][q], m[q][q] - m[p][p]), cs = Math.cos(th), sn = Math.sin(th);
    for (let k = 0; k < 3; k++) { const a = m[k][p], d = m[k][q]; m[k][p] = cs * a - sn * d; m[k][q] = sn * a + cs * d; }
    for (let k = 0; k < 3; k++) { const a = m[p][k], d = m[q][k]; m[p][k] = cs * a - sn * d; m[q][k] = sn * a + cs * d; }
    for (let k = 0; k < 3; k++) { const a = v[k][p], d = v[k][q]; v[k][p] = cs * a - sn * d; v[k][q] = sn * a + cs * d; }
  }
  return [0, 1, 2].map(i => ({ valeur: m[i][i], axe: [v[0][i], v[1][i], v[2][i]] })).sort((x, y) => y.valeur - x.valeur);
}
const points = (pos, garde = () => true) => {
  const out = [];
  for (let i = 0; i < pos.length; i += 3) { const p = [pos[i], pos[i + 1], pos[i + 2]]; if (garde(p)) out.push(p); }
  return out;
};

// ---------- sélection des pièces ----------
const RANGS = "first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth";
const noms = motif => { const n = b.noms(motif); if (!n.length) throw new Error(`aucun nom pour ${motif}`); return n; };
const NOMS_MAIN = noms(/^(scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|(first|second|third|fourth|fifth) metacarpal bone|(proximal|middle|distal) phalanx of (thumb|(index|middle|ring|little) finger))$/);
const VERTEBRES = noms(new RegExp(`^((${RANGS}) thoracic vertebra|(first|second|third|fourth|fifth) lumbar vertebra|intervertebral disk of (${RANGS}) thoracic vertebra|intervertebral disk of (first|second|third|fourth|fifth) lumbar vertebra)$`));
const CERVICALES = noms(/^(atlas|axis|(third|fourth|fifth|sixth|seventh) cervical vertebra|intervertebral disk of (third|fourth|fifth|sixth|seventh) cervical vertebra)$/);
const CAGE = [...noms(new RegExp(`^(${RANGS}) rib$`)), ...noms(new RegExp(`^(${RANGS}) costal cartilage$`)), "manubrium", "body of sternum", "xiphoid process"];
const CRANE = noms(/^(frontal bone|occipital bone|parietal bone|temporal bone|sphenoid bone|ethmoid|ethmoid bone|maxilla|mandible|zygomatic bone|nasal bone|vomer|palatine bone|lacrimal bone|inferior nasal concha)$/);

/** [nom du nœud, classe de poids, noms BodyParts3D, groupe d'affichage]. Une pièce « C » est impaire. */
const OS_IMPAIRS = [
  ["Cage", "thorax", CAGE, "thorax"],
  ["Colonne", "colonne", VERTEBRES, "thorax"],
  ["Cervicales", "cou", CERVICALES, "cou"],
  ["Crane", "tete", CRANE, "crane"],
];
const OS_PAIRS = [
  ["Clavicule", "thorax", ["clavicle"], "epaule"],
  ["Scapula", "thorax", ["scapula"], "epaule"],
  ["Humerus", "bras", ["humerus"], "bras"],
  ["Ulna", "av0", ["ulna"], "avantBras"],
  ["Radius", "av4", ["radius"], "avantBras"],
  ["Main", "main", NOMS_MAIN, "main"],
];
const MUSCLES = [
  // cou et ceinture scapulaire
  ["Trapezius", "cou", ["ascending part of trapezius", "transverse part of trapezius", "descending part of trapezius"], "epaule"],
  ["LevatorScapulae", "cou", ["levator scapulae"], "cou"],
  ["Sternocleidomastoid", "cou", ["sternocleidomastoid"], "cou"],
  ["ScalenusAnterior", "cou", ["scalenus anterior"], "cou"],
  ["ScalenusMedius", "cou", ["scalenus medius"], "cou"],
  ["ScalenusPosterior", "cou", ["scalenus posterior"], "cou"],
  ["SpleniusCapitis", "cou", ["splenius capitis"], "cou"],
  ["SemispinalisCapitis", "cou", ["semispinalis capitis"], "cou"],
  ["RhomboidMajor", "thorax", ["rhomboid major"], "epaule"],
  ["RhomboidMinor", "thorax", ["rhomboid minor"], "epaule"],
  ["SerratusAnterior", "thorax", ["serratus anterior"], "epaule"],
  ["PectoralisMinor", "thorax", ["pectoralis minor"], "epaule"],
  ["Subclavius", "thorax", ["subclavius"], "epaule"],
  // épaule : du thorax à l'humérus
  ["Deltoid", "epaule", ["clavicular part of deltoid", "acromial part of deltoid", "spinal part of deltoid"], "epaule"],
  ["Supraspinatus", "epaule", ["supraspinatus"], "epaule"],
  ["Infraspinatus", "epaule", ["infraspinatus muscle"], "epaule"],
  ["TeresMinor", "epaule", ["teres minor"], "epaule"],
  ["TeresMajor", "epaule", ["teres major"], "epaule"],
  ["Subscapularis", "epaule", ["subscapularis"], "epaule"],
  ["PectoralisMajor", "epaule", ["clavicular part of pectoralis major", "sternocostal part of pectoralis major", "abdominal part of pectoralis major"], "epaule"],
  ["Coracobrachialis", "epaule", ["coracobrachialis"], "bras"],
  // bras
  ["BicepsBrachii", "brasThorax", ["long head of biceps brachii", "short head of biceps brachii"], "bras"],
  ["TricepsBrachii", "brasThorax", ["long head of triceps brachii", "lateral head of triceps brachii", "medial head of triceps brachii"], "bras"],
  ["Brachialis", "bras", ["brachialis"], "bras"],
  ["Anconeus", "bras", ["anconeus"], "bras"],
  // avant-bras
  ["Brachioradialis", "avantBras", ["brachioradialis"], "avantBras"],
  ["PronatorTeres", "avantBras", ["humeral head of pronator teres", "ulnar head of pronator teres"], "avantBras"],
  ["FlexorCarpiRadialis", "avantBras", ["flexor carpi radialis"], "avantBras"],
  ["PalmarisLongus", "avantBras", ["palmaris longus"], "avantBras"],
  ["FlexorCarpiUlnaris", "avantBras", ["humeral head of flexor carpi ulnaris", "ulnar head of flexor carpi ulnaris"], "avantBras"],
  ["FlexorDigitorumSuperficialis", "avantBras", ["flexor digitorum superficialis"], "avantBras"],
  ["FlexorDigitorumProfundus", "avantBras", ["flexor digitorum profundus"], "avantBras"],
  ["FlexorPollicisLongus", "avantBras", ["flexor pollicis longus"], "avantBras"],
  ["PronatorQuadratus", "avantBras", ["pronator quadratus"], "avantBras"],
  ["ExtensorCarpiRadialisLongus", "avantBras", ["extensor carpi radialis longus"], "avantBras"],
  ["ExtensorCarpiRadialisBrevis", "avantBras", ["extensor carpi radialis brevis"], "avantBras"],
  ["ExtensorDigitorum", "avantBras", ["extensor digitorum"], "avantBras"],
  ["ExtensorDigitiMinimi", "avantBras", ["extensor digiti minimi"], "avantBras"],
  ["ExtensorCarpiUlnaris", "avantBras", ["extensor carpi ulnaris"], "avantBras"],
  ["Supinator", "avantBras", ["supinator"], "avantBras"],
  ["AbductorPollicisLongus", "avantBras", ["abductor pollicis longus"], "avantBras"],
  ["ExtensorPollicisBrevis", "avantBras", ["extensor pollicis brevis"], "avantBras"],
  ["ExtensorPollicisLongus", "avantBras", ["extensor pollicis longus"], "avantBras"],
  ["ExtensorIndicis", "avantBras", ["extensor indicis"], "avantBras"],
  // main
  ["AbductorPollicisBrevis", "main", ["abductor pollicis brevis"], "main"],
  ["FlexorPollicisBrevis", "main", ["flexor pollicis brevis"], "main"],
  ["OpponensPollicis", "main", ["opponens pollicis"], "main"],
  ["AdductorPollicis", "main", ["oblique head of adductor pollicis", "transverse head of adductor pollicis"], "main"],
  ["AbductorDigitiMinimi", "main", ["abductor digiti minimi of hand"], "main"],
  ["FlexorDigitiMinimiBrevis", "main", ["flexor digiti minimi brevis of hand"], "main"],
  ["OpponensDigitiMinimi", "main", ["opponens digiti minimi of hand"], "main"],
  ["Lumbricals", "main", ["set of lumbricals of hand"], "main"],
  ["DorsalInterossei", "main", ["set of dorsal interossei of hand"], "main"],
  ["PalmarInterossei", "main", ["set of palmar interossei of hand"], "main"],
];

// ---------- articulations anatomiques ----------
const COTES = ["L", "R"];
const os = {};
for (const s of COTES) for (const [nom, , liste] of OS_PAIRS) os[nom + s] = b.charger(b.resoudre(liste, s));
const cage = b.charger(b.resoudre(CAGE, "C"));
const articulations = { ...MOTEUR }, axesRepos = {}, mesures = {};
for (const s of COTES) {
  const hum = os["Humerus" + s].pos, rad = os["Radius" + s].pos, uln = os["Ulna" + s].pos;
  const bh = boite(hum);
  // Tête humérale : calotte du haut de l'os, du côté du tronc ; son centre est celui de l'articulation.
  const milieuX = (bh.lo[0] + bh.hi[0]) / 2, versTronc = s === "L" ? -1 : 1;
  const calotte = points(hum, p => p[1] > bh.hi[1] - 0.04 && (p[0] - milieuX) * versTronc > -0.012);
  const tete = sphere(calotte);
  const epaule = tete.r > 0.015 && tete.r < 0.035 ? tete.c : centreTranche(hum, 1, 0.9, 1);
  const coude = centreTranche(hum, 1, 0, 0.055);
  const bras = unit(sub(coude, epaule));
  // Charnière du coude : la plus grande étendue du bas de l'humérus, perpendiculaire au bras, orientée vers la
  // droite du corps (une rotation positive autour d'elle porte l'avant-bras vers l'avant).
  let charniere = axes(points(hum, p => p[1] < bh.lo[1] + 0.035).map(p => sub(p, mul(bras, dot(p, bras)))))[0].axe;
  charniere = unit(sub(charniere, mul(bras, dot(charniere, bras))));
  if (charniere[0] > 0) charniere = mul(charniere, -1);
  const teteRadiale = centreTranche(rad, 1, 0.95, 1), teteUlnaire = centreTranche(uln, 1, 0, 0.05);
  const poignet = mul(add(centreTranche(rad, 1, 0, 0.05), teteUlnaire), 0.5);
  const meta = n => b.charger(b.resoudre([`${n} metacarpal bone`], s)).pos;
  const metas = ["second", "third", "fourth", "fifth"].flatMap(n => points(meta(n)));
  let normale = axes(metas)[2].axe;
  const pisiforme = centre(b.charger(b.resoudre(["pisiform"], s)).pos), triquetral = centre(b.charger(b.resoudre(["triquetral"], s)).pos);
  if (dot(normale, sub(pisiforme, triquetral)) < 0) normale = mul(normale, -1);
  const paume = add(centre(meta("third")), mul(normale, 0.012));
  const bout = centre(b.charger(b.resoudre(["distal phalanx of middle finger"], s)).pos);
  Object.assign(articulations, { ["bras" + s]: epaule, ["av0" + s]: coude, ["main" + s]: poignet });
  for (let k = 1; k <= 4; k++) articulations[`av${k}${s}`] = teteRadiale;
  axesRepos[s] = {
    bras: arrondi(bras), charniere: arrondi(charniere), pronation: arrondi(unit(sub(teteUlnaire, teteRadiale))),
    teteRadiale: arrondi(teteRadiale), paume: arrondi(paume), normalePaume: arrondi(unit(normale)),
    doigts: arrondi(unit(sub(bout, poignet))), boutMajeur: arrondi(bout),
  };
  mesures[s] = {
    rayonTeteHumerale: +tete.r.toFixed(4), bras: +norme(sub(coude, epaule)).toFixed(4),
    avantBras: +norme(sub(poignet, coude)).toFixed(4), coudePaume: +norme(sub(paume, coude)).toFixed(4),
    poignetBoutMajeur: +norme(sub(bout, poignet)).toFixed(4),
  };
}

// ---------- peau : articulations et poids ----------
const SEGMENTS = ["bassin", "colonne", "thorax", "tete", ...COTES.flatMap(s => ["bras", "av0", "av1", "av2", "av3", "av4", "main"].map(n => n + s))];
const PARENT = { colonne: "bassin", thorax: "colonne", tete: "thorax" };
for (const s of COTES) {
  PARENT["bras" + s] = "thorax"; PARENT["av0" + s] = "bras" + s; PARENT["main" + s] = "av4" + s;
  for (let k = 1; k <= 4; k++) PARENT[`av${k}${s}`] = "av0" + s;
}
const indice = Object.fromEntries(SEGMENTS.map((n, i) => [n, i]));

/** Distance d'un point au nuage (échantillonné) d'un ensemble d'os. */
function nuage(...listes) {
  const total = listes.reduce((a, l) => a + l.length / 3, 0), pas = Math.max(1, Math.floor(total / 2500));
  const pts = [];
  for (const l of listes) for (let i = 0; i < l.length; i += 3 * pas) pts.push(l[i], l[i + 1], l[i + 2]);
  const a = Float32Array.from(pts);
  return p => {
    let d = Infinity;
    for (let i = 0; i < a.length; i += 3) {
      const dx = a[i] - p[0], dy = a[i + 1] - p[1], dz = a[i + 2] - p[2], q = dx * dx + dy * dy + dz * dz;
      if (q < d) d = q;
    }
    return Math.sqrt(d);
  };
}
const versThorax = {}, versHumerus = {};
for (const s of COTES) {
  versThorax[s] = nuage(cage.pos, os["Clavicule" + s].pos, os["Scapula" + s].pos);
  versHumerus[s] = nuage(os["Humerus" + s].pos);
}
const Y_C7 = 0.515, Y_ATLAS = 0.615;

/** Poids d'un sommet selon la classe de la pièce : { segment: poids }. */
function poids(classe, s, p) {
  switch (classe) {
    case "thorax": return { thorax: 1 };
    case "tete": return { tete: 1 };
    case "main": return { ["main" + s]: 1 };
    case "av0": return { ["av0" + s]: 1 };
    case "av4": return { ["av4" + s]: 1 };
    case "colonne": {
      const bassin = 1 - lisse(0.03, 0.11, p[1]), thorax = lisse(0.16, 0.36, p[1]);
      return { bassin, thorax, colonne: Math.max(0, 1 - bassin - thorax) };
    }
    case "cou": { const t = lisse(Y_C7, Y_ATLAS, p[1]); return { tete: t, thorax: 1 - t }; }
    case "epaule": case "bras": case "brasThorax": {
      const E = articulations["bras" + s], C = articulations["av0" + s], L = norme(sub(C, E));
      const t = dot(sub(p, E), unit(sub(C, E))) / L;
      const avant = classe === "epaule" ? 0 : lisse(0.86, 1.14, t);
      let thorax = 0;
      if (classe !== "bras") {
        const dt = versThorax[s](p) + 0.002, dh = versHumerus[s](p) + 0.002;
        thorax = lisse(0.15, 0.85, dh * dh / (dh * dh + dt * dt));
      }
      return { ["av0" + s]: avant, thorax: (1 - avant) * thorax, ["bras" + s]: (1 - avant) * (1 - thorax) };
    }
    case "avantBras": {
      const C = articulations["av0" + s], W = articulations["main" + s], L = norme(sub(W, C));
      const t = dot(sub(p, C), unit(sub(W, C))) / L;
      const bras = 1 - lisse(-0.1, 0.14, t), main = lisse(0.93, 1.1, t), reste = Math.max(0, 1 - bras - main);
      const u = Math.max(0, Math.min(0.9999, t)) * 4, k = Math.floor(u), f = u - k;
      return { ["bras" + s]: bras, ["main" + s]: main, [`av${k}${s}`]: reste * (1 - f), [`av${k + 1}${s}`]: reste * f };
    }
    default: throw new Error(`classe inconnue ${classe}`);
  }
}

// ---------- allègement : fusion des sommets par cellule ----------
function alleger({ pos, idx }, maille) {
  const cle = new Map(), somme = [], nb = [], vers = new Uint32Array(pos.length / 3);
  for (let i = 0; i < pos.length; i += 3) {
    const k = `${Math.round(pos[i] / maille)},${Math.round(pos[i + 1] / maille)},${Math.round(pos[i + 2] / maille)}`;
    let n = cle.get(k);
    if (n === undefined) { n = nb.length; cle.set(k, n); somme.push(0, 0, 0); nb.push(0); }
    somme[n * 3] += pos[i]; somme[n * 3 + 1] += pos[i + 1]; somme[n * 3 + 2] += pos[i + 2]; nb[n]++;
    vers[i / 3] = n;
  }
  const p2 = new Float32Array(nb.length * 3);
  for (let n = 0; n < nb.length; n++) for (let k = 0; k < 3; k++) p2[n * 3 + k] = somme[n * 3 + k] / nb[n];
  const vus = new Set(), faces = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = vers[idx[i]], c = vers[idx[i + 1]], d = vers[idx[i + 2]];
    if (a === c || c === d || a === d) continue;
    const k = [a, c, d].sort((x, y) => x - y).join(",");
    if (vus.has(k)) continue;
    vus.add(k); faces.push(a, c, d);
  }
  return { pos: p2, idx: Uint32Array.from(faces) };
}
function normales({ pos, idx }) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, c, d] = [idx[i], idx[i + 1], idx[i + 2]].map(j => [pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]]);
    const f = cross(sub(c, a), sub(d, a));
    for (const j of [idx[i], idx[i + 1], idx[i + 2]]) for (let k = 0; k < 3; k++) n[j * 3 + k] += f[k];
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l; n[i + 1] /= l; n[i + 2] /= l;
  }
  return n;
}

// ---------- pièces ----------
const pieces = [];
function piece(nom, type, groupe, classe, s, fjs) {
  const brut = b.charger(fjs), m = alleger(brut, type === "os" ? MAILLE_OS : MAILLE_MUSCLE), nv = m.pos.length / 3;
  const joints = new Uint8Array(nv * 4), w = new Float32Array(nv * 4);
  for (let i = 0; i < nv; i++) {
    const e = Object.entries(poids(classe, s, [m.pos[i * 3], m.pos[i * 3 + 1], m.pos[i * 3 + 2]]))
      .filter(([, v]) => v > 1e-4).sort((x, y) => y[1] - x[1]).slice(0, 4);
    const total = e.reduce((a, [, v]) => a + v, 0);
    e.forEach(([seg, v], k) => { joints[i * 4 + k] = indice[seg]; w[i * 4 + k] = v / total; });
  }
  pieces.push({ nom, type, groupe, cote: s, classe, sources: fjs, sommetsSource: brut.pos.length / 3, ...m, nrm: normales(m), joints, w });
}
for (const [nom, classe, liste, groupe] of OS_IMPAIRS) piece(`Os_${nom}_C`, "os", groupe, classe, "C", b.resoudre(liste, "C"));
for (const s of COTES) for (const [nom, classe, liste, groupe] of OS_PAIRS) piece(`Os_${nom}_${s}`, "os", groupe, classe, s, b.resoudre(liste, s));
for (const s of COTES) for (const [nom, classe, liste, groupe] of MUSCLES) piece(`Muscle_${nom}_${s}`, "muscle", groupe, classe, s, b.resoudre(liste, s));

// ---------- GLB (peau glTF standard) ----------
const tampons = [], vues = [], accesseurs = [];
let longueur = 0;
function vue(data, cible) {
  const octets = Buffer.from(data.buffer, data.byteOffset, data.byteLength), bourre = (4 - (octets.length % 4)) % 4;
  vues.push({ buffer: 0, byteOffset: longueur, byteLength: octets.length, ...(cible ? { target: cible } : {}) });
  tampons.push(octets, Buffer.alloc(bourre));
  longueur += octets.length + bourre;
  return vues.length - 1;
}
function accesseur(data, type, composant, extra = {}, cible) {
  accesseurs.push({ bufferView: vue(data, cible), componentType: composant, count: data.length / { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 }[type], type, ...extra });
  return accesseurs.length - 1;
}
const noeuds = [], maillages = [];
const monde = n => articulations[n], local = n => (PARENT[n] ? sub(monde(n), monde(PARENT[n])) : monde(n));
SEGMENTS.forEach(n => noeuds.push({ name: `art_${n}`, translation: arrondi(local(n), 6) }));
SEGMENTS.forEach((n, i) => {
  const enfants = SEGMENTS.map((m, j) => (PARENT[m] === n ? j : -1)).filter(j => j >= 0);
  if (enfants.length) noeuds[i].children = enfants;
});
const inverses = new Float32Array(SEGMENTS.length * 16);
SEGMENTS.forEach((n, i) => { const p = monde(n); inverses.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -p[0], -p[1], -p[2], 1], i * 16); });
const peau = { joints: SEGMENTS.map((_, i) => i), skeleton: 0, inverseBindMatrices: accesseur(inverses, "MAT4", 5126) };
for (const p of pieces) {
  const { lo, hi } = boite(p.pos);
  const idx = p.pos.length / 3 < 65536 ? Uint16Array.from(p.idx) : p.idx;
  maillages.push({
    name: p.nom,
    primitives: [{
      attributes: {
        POSITION: accesseur(p.pos, "VEC3", 5126, { min: lo, max: hi }, 34962), NORMAL: accesseur(p.nrm, "VEC3", 5126, {}, 34962),
        JOINTS_0: accesseur(p.joints, "VEC4", 5121, {}, 34962), WEIGHTS_0: accesseur(p.w, "VEC4", 5126, {}, 34962),
      },
      indices: accesseur(idx, "SCALAR", idx instanceof Uint16Array ? 5123 : 5125, {}, 34963),
    }],
  });
  noeuds.push({ name: p.nom, mesh: maillages.length - 1, skin: 0, extras: { type: p.type, groupe: p.groupe, cote: p.cote } });
}
const ATTRIBUTION = "BodyParts3D v4.0, © DBCLS (The Database Center for Life Science), CC BY-SA 2.1 Japan";
const gltf = {
  asset: { version: "2.0", generator: "recodanse/scripts/construire_haut.mjs", copyright: ATTRIBUTION },
  scene: 0, scenes: [{ name: "AnatomieHaut", nodes: [0, ...pieces.map((_, i) => SEGMENTS.length + i)] }],
  nodes: noeuds, meshes: maillages, skins: [peau], accessors: accesseurs, bufferViews: vues, buffers: [{ byteLength: longueur }],
};
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const bin = Buffer.concat(tampons), entete = Buffer.alloc(12), eJson = Buffer.alloc(8), eBin = Buffer.alloc(8);
entete.writeUInt32LE(0x46546c67, 0); entete.writeUInt32LE(2, 4); entete.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
eJson.writeUInt32LE(json.length, 0); eJson.writeUInt32LE(0x4e4f534a, 4);
eBin.writeUInt32LE(bin.length, 0); eBin.writeUInt32LE(0x004e4942, 4);
const glb = path.join(sortie, "anatomie_haut.glb"), brut = path.join(cache, "anatomie_haut.brut.glb");
writeFileSync(brut, Buffer.concat([entete, eJson, json, eBin, bin]));
if (process.argv.includes("--brut")) renameSync(brut, glb);
else execFileSync("npx", ["--yes", "@gltf-transform/cli@4", "draco", brut, glb], { stdio: ["ignore", "ignore", "inherit"] });

const manifeste = {
  attribution: ATTRIBUTION, source: SOURCE + "isa_BP3D_4.0_obj_99.zip",
  repere: "celui de public/anatomy.glb : mètres, origine au centre du bassin, +x gauche, +y haut, +z avant",
  mailles: { os: MAILLE_OS, muscle: MAILLE_MUSCLE },
  segments: SEGMENTS, parents: PARENT, moteur: MOTEUR,
  articulations: Object.fromEntries(Object.entries(articulations).map(([k, v]) => [k, arrondi(v, 5)])),
  axes: axesRepos, mesures,
  pieces: pieces.map(p => ({ nom: p.nom, type: p.type, groupe: p.groupe, cote: p.cote, classe: p.classe, sources: p.sources.length, sommets: p.pos.length / 3, sommetsSource: p.sommetsSource, triangles: p.idx.length / 3 })),
};
writeFileSync(path.join(sortie, "anatomie_haut.json"), JSON.stringify(manifeste, null, 1));
const total = t => pieces.filter(p => p.type === t).reduce((a, p) => a + p.pos.length / 3, 0);
console.log(`pièces : ${pieces.filter(p => p.type === "os").length} os (${total("os")} sommets), ${pieces.filter(p => p.type === "muscle").length} muscles (${total("muscle")} sommets)`);
console.log(`GLB : ${((12 + 8 + json.length + 8 + bin.length) / 1e6).toFixed(2)} Mo avant compression`);
for (const s of COTES) console.log(`côté ${s}`, JSON.stringify(mesures[s]), "épaule", arrondi(articulations["bras" + s], 3), "coude", arrondi(articulations["av0" + s], 3), "poignet", arrondi(articulations["main" + s], 3), "normale paume", axesRepos[s].normalePaume, "charnière", axesRepos[s].charniere);
console.log(`Attribution requise : ${ATTRIBUTION}`);
