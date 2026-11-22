// Lecture de BodyParts3D 4.0 (archive OBJ « is_a », listes de concepts) pour le pont ReCoDanse.
// Même repère que public/anatomy.glb et public/anatomy_muscles.glb : (x, z, -y) × 0,001, origine au
// milieu des centres des deux os coxaux, côté droit à x < 0.
// Licence des maillages : BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const SOURCE = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/";
export const FICHIERS = ["isa_BP3D_4.0_obj_99.zip", "isa_parts_list_e.txt", "isa_element_parts.txt"];
const HIP_R = "FJ3152", HIP_L = "FJ3288";

export function ouvrir(cache) {
  for (const f of FICHIERS)
    if (!existsSync(path.join(cache, f)))
      throw new Error(`${f} manque dans ${cache} : le télécharger depuis ${SOURCE}${f}`);
  const zip = path.join(cache, FICHIERS[0]);
  const obj = path.join(cache, "obj");
  mkdirSync(obj, { recursive: true });
  const lignes = f => readFileSync(path.join(cache, f), "utf8").split("\n").slice(1).map(l => l.split("\t")).filter(p => p.length >= 3);
  const nomDe = new Map(), fjDe = new Map();
  for (const p of lignes(FICHIERS[1])) nomDe.set(p[0], p[2].toLowerCase().trim());
  for (const p of lignes(FICHIERS[2])) {
    if (!fjDe.has(p[0])) fjDe.set(p[0], []);
    fjDe.get(p[0]).push(p[2].trim());
  }
  // nom sans côté → { R: [FJ], L: [FJ], C: [FJ] }
  const index = new Map();
  for (const [fma, nom] of nomDe) {
    const cote = /\bright\b/.test(nom) ? "R" : /\bleft\b/.test(nom) ? "L" : "C";
    const neutre = nom.replace(/\b(right|left)\b/g, " ").replace(/\s+/g, " ").trim();
    if (!index.has(neutre)) index.set(neutre, { R: [], L: [], C: [] });
    index.get(neutre)[cote].push(...(fjDe.get(fma) ?? []));
  }

  /** FJ d'une liste de noms (sans côté) pour un côté : R, L, ou C (pièce impaire ou les deux côtés). */
  function resoudre(noms, cote) {
    const out = new Set();
    for (const n of noms) {
      const e = index.get(n.toLowerCase());
      if (!e) throw new Error(`BodyParts3D : nom inconnu « ${n} »`);
      const liste = cote === "C" ? (e.C.length ? e.C : [...e.R, ...e.L]) : e[cote];
      if (!liste.length) throw new Error(`BodyParts3D : « ${n} » n'a pas de pièce pour le côté ${cote}`);
      for (const f of liste) out.add(f);
    }
    return [...out];
  }
  const noms = motif => [...index.keys()].filter(n => motif.test(n));

  function extraire(fjs) {
    const manque = fjs.filter(f => !existsSync(path.join(obj, `${f}.obj`)));
    for (let i = 0; i < manque.length; i += 80)
      execFileSync("unzip", ["-j", "-o", "-q", zip, ...manque.slice(i, i + 80).map(f => `*/${f}.obj`), "-d", obj]);
  }
  function lireObj(fj) {
    const texte = readFileSync(path.join(obj, `${fj}.obj`), "utf8");
    const v = [], f = [];
    for (const l of texte.split("\n")) {
      if (l.startsWith("v ")) {
        const p = l.split(/\s+/);
        v.push(+p[1], +p[2], +p[3]);
      } else if (l.startsWith("f ")) {
        const p = l.trim().split(/\s+/).slice(1).map(t => parseInt(t, 10) - 1);
        for (let k = 1; k + 1 < p.length; k++) f.push(p[0], p[k], p[k + 1]);
      }
    }
    return { v, f };
  }
  const brut = fj => {
    const { v, f } = lireObj(fj);
    const pos = new Float32Array(v.length);
    for (let i = 0; i < v.length; i += 3) {
      pos[i] = v[i] * 0.001; pos[i + 1] = v[i + 2] * 0.001; pos[i + 2] = -v[i + 1] * 0.001;
    }
    return { pos, idx: Uint32Array.from(f) };
  };
  const centreBoite = pos => {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], pos[i + k]); hi[k] = Math.max(hi[k], pos[i + k]);
    }
    return lo.map((a, k) => (a + hi[k]) / 2);
  };
  extraire([HIP_R, HIP_L]);
  const cR = centreBoite(brut(HIP_R).pos), cL = centreBoite(brut(HIP_L).pos);
  const origine = cR.map((a, k) => (a + cL[k]) / 2);

  /** Maillage fusionné d'une liste de FJ, dans le repère du squelette (origine au centre du bassin). */
  function charger(fjs) {
    extraire(fjs);
    const morceaux = fjs.map(brut);
    const nv = morceaux.reduce((a, m) => a + m.pos.length / 3, 0), ni = morceaux.reduce((a, m) => a + m.idx.length, 0);
    const pos = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let ov = 0, oi = 0;
    for (const m of morceaux) {
      for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) pos[ov * 3 + i + k] = m.pos[i + k] - origine[k];
      for (let i = 0; i < m.idx.length; i++) idx[oi + i] = m.idx[i] + ov;
      ov += m.pos.length / 3; oi += m.idx.length;
    }
    return { pos, idx };
  }
  return { resoudre, noms, charger, origine };
}

// --- petites mesures sur un nuage de points (Float32Array xyz) ---
export const boite = pos => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) {
    lo[k] = Math.min(lo[k], pos[i + k]); hi[k] = Math.max(hi[k], pos[i + k]);
  }
  return { lo, hi };
};
/** Centre des points dont la coordonnée `axe` est dans la tranche [de, a] (fractions de l'étendue, 0 = bas). */
export function centreTranche(pos, axe, de, a) {
  const { lo, hi } = boite(pos);
  const min = lo[axe] + de * (hi[axe] - lo[axe]), max = lo[axe] + a * (hi[axe] - lo[axe]);
  const c = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < pos.length; i += 3) if (pos[i + axe] >= min && pos[i + axe] <= max) {
    c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; n++;
  }
  return c.map(x => x / n);
}
export const centre = pos => {
  const c = [0, 0, 0];
  for (let i = 0; i < pos.length; i += 3) { c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; }
  return c.map(x => x / (pos.length / 3));
};
/** Sphère ajustée aux points (moindres carrés algébriques) : centre et rayon. */
export function sphere(points) {
  // Résout [2x 2y 2z 1] · [cx cy cz k] = x²+y²+z² ; k = r² - |c|².
  const A = Array.from({ length: 4 }, () => new Float64Array(5));
  for (const [x, y, z] of points) {
    const row = [2 * x, 2 * y, 2 * z, 1], b = x * x + y * y + z * z;
    for (let i = 0; i < 4; i++) { for (let j = 0; j < 4; j++) A[i][j] += row[i] * row[j]; A[i][4] += row[i] * b; }
  }
  for (let i = 0; i < 4; i++) {
    let p = i;
    for (let r = i + 1; r < 4; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]];
    for (let r = 0; r < 4; r++) if (r !== i) {
      const k = A[r][i] / A[i][i];
      for (let j = i; j < 5; j++) A[r][j] -= k * A[i][j];
    }
  }
  const s = A.map((r, i) => r[4] / r[i]);
  return { c: [s[0], s[1], s[2]], r: Math.sqrt(s[3] + s[0] * s[0] + s[1] * s[1] + s[2] * s[2]) };
}
