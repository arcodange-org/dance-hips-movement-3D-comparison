// BodyParts3D 4.0 reader ("is_a" OBJ archive and concept lists) for the Node build scripts.
// Same frame as public/anatomy.glb and public/anatomy_muscles.glb: (x, z, -y) × 0.001, origin at the middle
// of the two hip bones' box centres, right side at x < 0.
// Mesh licence: BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const SOURCE = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/";
export const FILES = ["isa_BP3D_4.0_obj_99.zip", "isa_parts_list_e.txt", "isa_element_parts.txt"];
const HIP_R = "FJ3152", HIP_L = "FJ3288";

export function openBp3d(cache) {
  for (const f of FILES)
    if (!existsSync(path.join(cache, f)))
      throw new Error(`${f} is missing in ${cache}: download it from ${SOURCE}${f}`);
  const zip = path.join(cache, FILES[0]);
  const objDir = path.join(cache, "obj");
  mkdirSync(objDir, { recursive: true });
  const rows = f => readFileSync(path.join(cache, f), "utf8").split("\n").slice(1).map(l => l.split("\t")).filter(p => p.length >= 3);
  const nameOf = new Map(), filesOf = new Map();
  for (const p of rows(FILES[1])) nameOf.set(p[0], p[2].toLowerCase().trim());
  for (const p of rows(FILES[2])) {
    if (!filesOf.has(p[0])) filesOf.set(p[0], []);
    filesOf.get(p[0]).push(p[2].trim());
  }
  // side-less name → { R: [FJ], L: [FJ], C: [FJ] }
  const index = new Map();
  for (const [fma, name] of nameOf) {
    const side = /\bright\b/.test(name) ? "R" : /\bleft\b/.test(name) ? "L" : "C";
    const neutral = name.replace(/\b(right|left)\b/g, " ").replace(/\s+/g, " ").trim();
    if (!index.has(neutral)) index.set(neutral, { R: [], L: [], C: [] });
    index.get(neutral)[side].push(...(filesOf.get(fma) ?? []));
  }

  /** FJ files of side-less names for a side: R, L, or C (unpaired piece, or both sides). */
  function resolve(names, side) {
    const out = new Set();
    for (const n of names) {
      const e = index.get(n.toLowerCase());
      if (!e) throw new Error(`BodyParts3D: unknown name "${n}"`);
      const list = side === "C" ? (e.C.length ? e.C : [...e.R, ...e.L]) : e[side];
      if (!list.length) throw new Error(`BodyParts3D: "${n}" has no piece for side ${side}`);
      for (const f of list) out.add(f);
    }
    return [...out];
  }
  const names = pattern => [...index.keys()].filter(n => pattern.test(n));

  function extract(fjs) {
    const missing = fjs.filter(f => !existsSync(path.join(objDir, `${f}.obj`)));
    for (let i = 0; i < missing.length; i += 80)
      execFileSync("unzip", ["-j", "-o", "-q", zip, ...missing.slice(i, i + 80).map(f => `*/${f}.obj`), "-d", objDir]);
  }
  const raw = fj => {
    const v = [], f = [];
    for (const l of readFileSync(path.join(objDir, `${fj}.obj`), "utf8").split("\n")) {
      if (l.startsWith("v ")) {
        const p = l.split(/\s+/);
        v.push(+p[1], +p[2], +p[3]);
      } else if (l.startsWith("f ")) {
        const p = l.trim().split(/\s+/).slice(1).map(t => parseInt(t, 10) - 1);
        for (let k = 1; k + 1 < p.length; k++) f.push(p[0], p[k], p[k + 1]);
      }
    }
    const pos = new Float32Array(v.length);
    for (let i = 0; i < v.length; i += 3) {
      pos[i] = v[i] * 0.001; pos[i + 1] = v[i + 2] * 0.001; pos[i + 2] = -v[i + 1] * 0.001;
    }
    return { pos, idx: Uint32Array.from(f) };
  };
  extract([HIP_R, HIP_L]);
  const boxCentre = pos => { const { lo, hi } = box(pos); return lo.map((a, k) => (a + hi[k]) / 2); };
  const cR = boxCentre(raw(HIP_R).pos), cL = boxCentre(raw(HIP_L).pos);
  const origin = cR.map((a, k) => (a + cL[k]) / 2);

  /** Merged mesh of a list of FJ files, in the skeleton frame (origin at the pelvis centre). */
  function load(fjs) {
    extract(fjs);
    const parts = fjs.map(raw);
    const nv = parts.reduce((a, m) => a + m.pos.length / 3, 0), ni = parts.reduce((a, m) => a + m.idx.length, 0);
    const pos = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    let ov = 0, oi = 0;
    for (const m of parts) {
      for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) pos[ov * 3 + i + k] = m.pos[i + k] - origin[k];
      for (let i = 0; i < m.idx.length; i++) idx[oi + i] = m.idx[i] + ov;
      ov += m.pos.length / 3; oi += m.idx.length;
    }
    return { pos, idx };
  }
  return { resolve, names, load, origin };
}

// --- small measures on a point cloud (Float32Array xyz) ---
export const box = pos => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) {
    lo[k] = Math.min(lo[k], pos[i + k]); hi[k] = Math.max(hi[k], pos[i + k]);
  }
  return { lo, hi };
};
/** Centre of the points whose `axis` coordinate lies in the slice [from, to] (fractions of the extent, 0 = low). */
export function sliceCentre(pos, axis, from, to) {
  const { lo, hi } = box(pos);
  const min = lo[axis] + from * (hi[axis] - lo[axis]), max = lo[axis] + to * (hi[axis] - lo[axis]);
  const c = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < pos.length; i += 3) if (pos[i + axis] >= min && pos[i + axis] <= max) {
    c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; n++;
  }
  return c.map(x => x / n);
}
export const centroid = pos => {
  const c = [0, 0, 0];
  for (let i = 0; i < pos.length; i += 3) { c[0] += pos[i]; c[1] += pos[i + 1]; c[2] += pos[i + 2]; }
  return c.map(x => x / (pos.length / 3));
};
/** Sphere fitted to points (algebraic least squares): centre and radius. */
export function fitSphere(points) {
  // Solves [2x 2y 2z 1] · [cx cy cz k] = x²+y²+z²; k = r² - |c|².
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
