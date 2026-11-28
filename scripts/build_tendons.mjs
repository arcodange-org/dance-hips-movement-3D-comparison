#!/usr/bin/env node
// #229 : les tendons d'Achille (tendon calcanéen, BodyParts3D 4.0) pour la couche des muscles : public/anatomy_tendons.glb,
// dans le repère de public/anatomy_muscles.glb (BodyParts3D, (x, z, -y) × 0,001, origine au milieu des centres des boîtes
// des deux os coxaux ; src/muscles.ts le replace sur les os). Deux maillages, `Muscle_CalcanealTendon_R` et `_L`, allégés
// (sommets fusionnés par cellule), puis compressés en Draco comme les autres couches.
// Usage : node scripts/build_tendons.mjs [--cache extracted/bp3d] [--cell 0.002] [--raw]
// Licence des maillages : BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan.
import { execFileSync } from "node:child_process";
import { renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { box, openBp3d, SOURCE } from "./bp3d.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const cache = path.resolve(arg("cache", path.join(root, "extracted/bp3d"))), CELL = +arg("cell", 0.002);
const out = path.join(root, "public/anatomy_tendons.glb");
const ATTRIBUTION = "BodyParts3D v4.0, © DBCLS (The Database Center for Life Science), CC BY-SA 2.1 Japan";
const b = openBp3d(cache);

/** Sommets fusionnés par cellule (comme scripts/build_upper_body.mjs). */
function lighten({ pos, idx }, cell) {
  const key = new Map(), sum = [], count = [], to = new Uint32Array(pos.length / 3);
  for (let i = 0; i < pos.length; i += 3) {
    const k = `${Math.round(pos[i] / cell)},${Math.round(pos[i + 1] / cell)},${Math.round(pos[i + 2] / cell)}`;
    let n = key.get(k);
    if (n === undefined) { n = count.length; key.set(k, n); sum.push(0, 0, 0); count.push(0); }
    sum[n * 3] += pos[i]; sum[n * 3 + 1] += pos[i + 1]; sum[n * 3 + 2] += pos[i + 2]; count[n]++;
    to[i / 3] = n;
  }
  const p2 = new Float32Array(count.length * 3);
  for (let n = 0; n < count.length; n++) for (let k = 0; k < 3; k++) p2[n * 3 + k] = sum[n * 3 + k] / count[n];
  const seen = new Set(), faces = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = to[idx[i]], c = to[idx[i + 1]], d = to[idx[i + 2]];
    if (a === c || c === d || a === d) continue;
    const k = [a, c, d].sort((x, y) => x - y).join(",");
    if (seen.has(k)) continue;
    seen.add(k); faces.push(a, c, d);
  }
  return { pos: p2, idx: Uint32Array.from(faces) };
}
function normals({ pos, idx }) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const [a, c, d] = [idx[i], idx[i + 1], idx[i + 2]].map(j => [pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]]);
    const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const j of [idx[i], idx[i + 1], idx[i + 2]]) for (let k = 0; k < 3; k++) n[j * 3 + k] += f[k];
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}

// Le tendon calcanéen n'a qu'un nom pour les deux côtés : chaque fichier est rangé par le signe de x (droite : x < 0).
const pieces = [];
for (const fj of b.resolve(["calcaneal tendon"], "C")) {
  const m = lighten(b.load([fj]), CELL), { lo, hi } = box(m.pos), side = (lo[0] + hi[0]) / 2 < 0 ? "R" : "L";
  pieces.push({ name: `Muscle_CalcanealTendon_${side}`, fj, ...m, nrm: normals(m), lo, hi });
}
pieces.sort((a, c) => a.name.localeCompare(c.name));
if (pieces.map(p => p.name).join() !== "Muscle_CalcanealTendon_L,Muscle_CalcanealTendon_R") throw new Error(`tendons inattendus : ${pieces.map(p => p.name)}`);

const chunks = [], views = [], accessors = [];
let length = 0;
function accessor(data, type, component, extra = {}, target) {
  const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength), pad = (4 - (bytes.length % 4)) % 4;
  views.push({ buffer: 0, byteOffset: length, byteLength: bytes.length, ...(target ? { target } : {}) });
  chunks.push(bytes, Buffer.alloc(pad)); length += bytes.length + pad;
  accessors.push({ bufferView: views.length - 1, componentType: component, count: data.length / { SCALAR: 1, VEC3: 3 }[type], type, ...extra });
  return accessors.length - 1;
}
const meshes = pieces.map(p => {
  const idx = Uint16Array.from(p.idx);
  return { name: p.name, primitives: [{ attributes: { POSITION: accessor(p.pos, "VEC3", 5126, { min: p.lo, max: p.hi }, 34962), NORMAL: accessor(p.nrm, "VEC3", 5126, {}, 34962) },
    indices: accessor(idx, "SCALAR", 5123, {}, 34963) }] };
});
const gltf = {
  asset: { version: "2.0", generator: "scripts/build_tendons.mjs", copyright: ATTRIBUTION },
  scene: 0, scenes: [{ name: "AnatomyTendons", nodes: pieces.map((_, i) => i), extras: { attribution: ATTRIBUTION, source: SOURCE + "isa_BP3D_4.0_obj_99.zip", frame: "that of public/anatomy_muscles.glb (BodyParts3D, origin at the middle of the hip bones' box centres)", pieces: pieces.map(p => ({ name: p.name, source: p.fj, vertices: p.pos.length / 3, triangles: p.idx.length / 3 })) } }],
  nodes: pieces.map((p, i) => ({ name: p.name, mesh: i })), meshes, accessors, bufferViews: views, buffers: [{ byteLength: length }],
};
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const bin = Buffer.concat(chunks), header = Buffer.alloc(12), hJson = Buffer.alloc(8), hBin = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
hJson.writeUInt32LE(json.length, 0); hJson.writeUInt32LE(0x4e4f534a, 4);
hBin.writeUInt32LE(bin.length, 0); hBin.writeUInt32LE(0x004e4942, 4);
const rawFile = path.join(cache, "anatomy_tendons.raw.glb");
writeFileSync(rawFile, Buffer.concat([header, hJson, json, hBin, bin]));
if (process.argv.includes("--raw")) renameSync(rawFile, out);
else execFileSync("npx", ["--yes", "--prefer-offline", "@gltf-transform/cli@4", "draco", rawFile, out], { stdio: ["ignore", "ignore", "inherit"] });
for (const p of pieces) console.log(`${p.name} (${p.fj}) : ${p.pos.length / 3} sommets, ${p.idx.length / 3} triangles ; y ${p.lo[1].toFixed(3)}..${p.hi[1].toFixed(3)}`);
console.log(`GLB → ${out}\nAttribution requise : ${ATTRIBUTION}`);
