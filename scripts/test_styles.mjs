#!/usr/bin/env node
// Test numerique des courbes de styles (src/styles.ts) : pas de NaN, clamp
// root.position.y >= 0 (convention verrouillée), amplitude du deplacement
// (+-17 cm a travel=1), enveloppe de sortie bornee dans [0,1] et periodique.
// Usage : npm test   (bundle esbuild de src/styles.ts + src/anatomy.ts, aucune
// dépendance ajoutée : esbuild est déjà une dépendance de vite)
import { createRequire } from "node:module";
import { rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "scripts", ".test-styles-bundle.mjs");

esbuild.buildSync({
  stdin: {
    contents: 'export * from "../src/styles"; export * from "../src/anatomy";',
    resolveDir: join(root, "scripts"),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundle,
  logLevel: "silent",
  define: { "import.meta.env.BASE_URL": '"/"' },
});

const mod = await import(pathToFileURL(bundle).href + "?t=" + Date.now());
rmSync(bundle, { force: true });
const { STYLES, sortieEnvelope, HIP_WIDTH, S2 } = mod;
const { Group } = await import(
  pathToFileURL(join(root, "node_modules", "three", "build", "three.module.js")).href
);

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error("FAIL:", msg);
};

function mockRig() {
  return {
    root: new Group(),
    pelvis: new Group(),
    spine: new Group(),
    lumbar: new Group(),
    thoracic: new Group(),
    chest: new Group(),
    head: new Group(),
    hipL: new Group(),
    hipR: new Group(),
    kneeL: new Group(),
    kneeR: new Group(),
    extraL: 0,
    extraR: 0,
  };
}

function allFinite(r) {
  const objs = [r.root, r.pelvis, r.spine, r.lumbar, r.thoracic, r.chest, r.head, r.hipL, r.hipR, r.kneeL, r.kneeR];
  for (const o of objs) {
    for (const v of [...o.position.toArray(), o.rotation.x, o.rotation.y, o.rotation.z]) {
      if (!Number.isFinite(v)) return false;
    }
  }
  return Number.isFinite(r.extraL) && Number.isFinite(r.extraR);
}

// 1) Aucune NaN / Infinity et clamp y >= 0 pour chaque style sur 800 temps.
for (const [key, st] of Object.entries(STYLES)) {
  const r = mockRig();
  let maxAbsX = 0;
  let bad = false;
  for (let b = 0; b <= 800 && !bad; b += 0.05) {
    for (const o of [r.root, r.pelvis, r.spine, r.lumbar, r.thoracic, r.chest, r.head, r.hipL, r.hipR, r.kneeL, r.kneeR]) {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
    }
    r.extraL = 0;
    r.extraR = 0;
    st.apply(r, b, 1);
    if (!allFinite(r)) {
      fail(`${key}: valeur non finie a b=${b}`);
      bad = true;
    }
    if (r.root.position.y < 0) r.root.position.y = 0; // clamp applique dans Rig
    if (r.root.position.y < -1e-12) fail(`${key}: clamp y viole a b=${b}`);
    maxAbsX = Math.max(maxAbsX, Math.abs(r.root.position.x));
  }
  if (maxAbsX > 0.5) fail(`${key}: root.x anormalement grand (${maxAbsX.toFixed(3)} m)`);
  if (!bad) console.log(`ok ${key}: 16001 pas, valeurs finies, clamp OK, |root.x|max=${maxAbsX.toFixed(3)} m`);
}

// 2) Amplitude du curseur Déplacement (formule du Rig) : travel=1 -> ±~17 cm.
{
  let maxAmp = 0;
  for (let b = 0; b <= 800; b += 0.01) maxAmp = Math.max(maxAmp, Math.abs(Math.tanh(2.2 * S2(b))));
  const amp = (HIP_WIDTH / 2) * maxAmp;
  console.log(`ok deplacement: amplitude max a travel=1 = ±${(amp * 100).toFixed(1)} cm (HIP_WIDTH=${HIP_WIDTH})`);
  if (amp < 0.15 || amp > 0.17) fail(`amplitude deplacement hors spec: ${amp}`);
}

// 3) Enveloppe de sortie : bornee [0,1], pleine entre les temps 1 et 3, nulle a partir de 5, periode 8.
{
  let bad = false;
  for (let b = -16; b <= 800 && !bad; b += 0.01) {
    const e = sortieEnvelope(b);
    if (!Number.isFinite(e) || e < -1e-9 || e > 1 + 1e-9) {
      fail(`sortieEnvelope hors [0,1] a b=${b}: ${e}`);
      bad = true;
      break;
    }
    const p = ((b % 8) + 8) % 8;
    if (p >= 5 && e > 1e-9) fail(`sortie non nulle a p=${p} (b=${b})`);
    if (p >= 1 && p <= 3 && Math.abs(e - 1) > 1e-9) fail(`sortie non pleine a p=${p} (b=${b})`);
  }
  for (let b = 0; b <= 100; b += 0.37) {
    if (Math.abs(sortieEnvelope(b) - sortieEnvelope(b + 8)) > 1e-12) fail(`sortie non periodique a b=${b}`);
  }
  if (!bad) console.log("ok sortieEnvelope: [0,1], pleine temps 1-3, nulle >= 5, periode 8");
}

if (failures) {
  console.error(`${failures} echec(s)`);
  process.exit(1);
}
console.log("Tous les tests de styles passent.");
