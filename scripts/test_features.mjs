#!/usr/bin/env node
// Runner Gherkin minimal (zéro dépendance) : exécute les scénarios de docs/features/*.feature
// contre les fonctions pures de src/styles.ts + src/anatomy.ts (bundle esbuild, comme
// test_styles.mjs). Les scénarios tagués @wip sont sautés (fonctionnalité pas encore livrée).
// Usage : npm test   (test_styles.mjs puis test_features.mjs)
import { createRequire } from "node:module";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "scripts", ".test-features-bundle.mjs");
esbuild.buildSync({
  stdin: {
    contents: 'export * from "../src/styles"; export * from "../src/anatomy"; export * from "../src/cameras";',
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
const { STYLES, supportOf, sortieEnvelope, sortieOffset, plantBlend, corridinhoPath, HIP_WIDTH, HIP_Y, S2, CAM_PRESETS, resolveCam, SOLID_TORSO_OPACITY, lockUpperTrunk, residualRoll, upperStability, DANCE_FRAME } = mod;
const { Group } = await import(
  pathToFileURL(join(root, "node_modules", "three", "build", "three.module.js")).href
);

// ---------- parsing Gherkin ----------
function parseFeature(text) {
  const lines = text.split("\n");
  const scenarios = [];
  let tags = [];
  let cur = null;
  let inExamples = false;
  let exampleRows = [];
  let exampleHeader = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("@")) {
      tags.push(line.slice(1).trim());
      continue;
    }
    const mS = /^(Scenario Outline|Scenario):\s*(.*)$/.exec(line);
    if (mS) {
      if (cur) scenarios.push(cur);
      cur = { outline: mS[1] === "Scenario Outline", name: mS[2], tags: [...tags], steps: [], examples: null };
      tags = [];
      inExamples = false;
      continue;
    }
    if (/^Examples:/.test(line)) {
      inExamples = true;
      exampleRows = [];
      continue;
    }
    if (inExamples && line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (!exampleHeader) exampleHeader = cells;
      else exampleRows.push(cells);
      continue;
    }
    if (/^\|/.test(line) && cur && !inExamples) continue;
    const mStep = /^(Given|When|Then|And|But)\s+(.*)$/.exec(line);
    if (mStep && cur) {
      cur.steps.push(mStep[2]);
      continue;
    }
    if (line && !line.startsWith("#") && cur && !mStep) {
      // texte libre de description
    }
  }
  if (cur) scenarios.push(cur);
  for (const sc of scenarios) {
    if (sc.outline && exampleHeader) {
      sc.examples = exampleRows.map((row) => {
        const map = {};
        exampleHeader.forEach((h, i) => (map[h] = row[i]));
        return map;
      });
    }
  }
  return scenarios;
}

// ---------- maquette de rig ----------
function mockRig() {
  return {
    root: new Group(), pelvis: new Group(), spine: new Group(), lumbar: new Group(),
    thoracic: new Group(), chest: new Group(), head: new Group(),
    hipL: new Group(), hipR: new Group(), kneeL: new Group(), kneeR: new Group(),
    extraL: 0, extraR: 0,
  };
}
function allFinite(r) {
  for (const o of [r.root, r.pelvis, r.spine, r.lumbar, r.thoracic, r.chest, r.head, r.hipL, r.hipR, r.kneeL, r.kneeR]) {
    for (const v of [...o.position.toArray(), o.rotation.x, o.rotation.y, o.rotation.z]) {
      if (!Number.isFinite(v)) return false;
    }
  }
  return Number.isFinite(r.extraL) && Number.isFinite(r.extraR);
}
function ampMax(travel) {
  let m = 0;
  for (let b = 0; b <= 800; b += 0.01) m = Math.max(m, Math.abs(Math.tanh(2.2 * S2(b))));
  return travel * (HIP_WIDTH / 2) * m;
}

// ---------- registre de steps ----------
const steps = [
  [/^le style "([^"]+)"$/, (c, m) => { if (!STYLES[m[1]]) throw new Error("style inconnu: " + m[1]); c.style = m[1]; }],
  [/^on applique le style sur (\d+) temps à amplitude ([\d.]+) sans déplacement$/, (c, m) => {
    const n = Number(m[1]), amp = Number(m[2]);
    const r = mockRig();
    c.run = { finite: true, minY: Infinity, supportBad: false, minExtra: Infinity, maxExtra: -Infinity };
    for (let b = 0; b <= n; b += 0.05) {
      STYLES[c.style].apply(r, b, amp);
      if (!allFinite(r)) c.run.finite = false;
      if (r.root.position.y < 0) r.root.position.y = 0; // clamp sol du Rig
      c.run.minY = Math.min(c.run.minY, r.root.position.y);
      const s = supportOf(c.style, r, b);
      if (!Number.isFinite(s) || s < -1 - 1e-9 || s > 1 + 1e-9) c.run.supportBad = true;
      c.run.minExtra = Math.min(c.run.minExtra, r.extraL, r.extraR);
      c.run.maxExtra = Math.max(c.run.maxExtra, r.extraL, r.extraR);
    }
  }],
  [/^toutes les positions et rotations sont finies$/, (c) => { if (!c.run.finite) throw new Error("valeurs non finies"); }],
  [/^root\.position\.y est superieur ou egal à 0 après le clamp sol$/, (c) => { if (c.run.minY < -1e-12) throw new Error("clamp sol violé: " + c.run.minY); }],
  [/^la charge du pied droit \(support\) reste dans \[-1, 1\]$/, (c) => { if (c.run.supportBad) throw new Error("support hors [-1,1]"); }],
  [/^le pivot sur la plante \(extra\) reste dans \[-0\.05, 0\.35\] rad$/, (c) => { if (c.run.minExtra < -0.05 - 1e-9 || c.run.maxExtra > 0.35 + 1e-9) throw new Error(`extra hors plage: [${c.run.minExtra}, ${c.run.maxExtra}]`); }],
  [/^travel = ([\d.]+)$/, (c, m) => { c.travel = Number(m[1]); }],
  [/^l'amplitude latérale max est 0 m$/, (c) => { if (Math.abs(ampMax(c.travel)) > 1e-12) throw new Error("amplitude non nulle: " + ampMax(c.travel)); }],
  [/^l'amplitude latérale max est entre ([\d.]+) et ([\d.]+) m$/, (c, m) => { const a = ampMax(c.travel); if (a < Number(m[1]) - 1e-9 || a > Number(m[2]) + 1e-9) throw new Error(`amplitude ${a} hors [${m[1]}, ${m[2]}]`); }],
  [/^on évalue sortieOffset pour b de 0 à (\d+) à amplitude ([\d.]+)$/, (c, m) => {
    const n = Number(m[1]), amp = Number(m[2]);
    c.sortie = [];
    for (let b = 0; b <= n; b += 0.01) c.sortie.push({ b, e: sortieEnvelope(b), off: sortieOffset(b, amp) });
  }],
  [/^l'enveloppe est pleine entre les temps 1 et 3 du cycle$/, (c) => {
    for (const s of c.sortie) { const p = ((s.b % 8) + 8) % 8; if (p >= 1 && p <= 3 && Math.abs(s.e - 1) > 1e-9) throw new Error("enveloppe non pleine à p=" + p); }
  }],
  [/^l'enveloppe est nulle à partir du temps 5 du cycle$/, (c) => {
    for (const s of c.sortie) { const p = ((s.b % 8) + 8) % 8; if (p >= 5 && s.e > 1e-9) throw new Error("enveloppe non nulle à p=" + p); }
  }],
  [/^l'enveloppe est périodique de 8 temps$/, (c) => {
    for (let b = 0; b <= 8; b += 0.01) {
      if (Math.abs(sortieEnvelope(b) - sortieEnvelope(b + 8)) > 1e-9) throw new Error("non périodique à b=" + b);
    }
  }],
  [/^sortieOffset est borné entre 0 et ([\d.]+) m$/, (c, m) => {
    for (const s of c.sortie) { if (!Number.isFinite(s.off) || s.off < -1e-9 || s.off > Number(m[1]) + 1e-9) throw new Error("sortieOffset hors [0," + m[1] + "]: " + s.off); }
  }],
  [/^travel = ([\d.]+) et plant = (true|false)$/, (c, m) => { c.travel = Number(m[1]); c.plant = m[2] === "true"; }],
  [/^plantBlend vaut ([\d.]+)$/, (c, m) => { const v = plantBlend(c.travel, c.plant); if (Math.abs(v - Number(m[1])) > 1e-9) throw new Error(`plantBlend=${v}, attendu ${m[1]}`); }],
  [/^on applique chaque style sur (\d+) temps à amplitude ([\d.]+)$/, (c, m) => {
    const n = Number(m[1]), amp = Number(m[2]);
    c.all = { minExtra: Infinity, maxExtra: -Infinity, supportBad: false };
    for (const key of Object.keys(STYLES)) {
      const r = mockRig();
      for (let b = 0; b <= n; b += 0.05) {
        STYLES[key].apply(r, b, amp);
        c.all.minExtra = Math.min(c.all.minExtra, r.extraL, r.extraR);
        c.all.maxExtra = Math.max(c.all.maxExtra, r.extraL, r.extraR);
        const sv = supportOf(key, r, b);
        if (!Number.isFinite(sv) || sv < -1 - 1e-9 || sv > 1 + 1e-9) c.all.supportBad = true;
      }
    }
  }],
  [/^extraL et extraR restent dans \[-0\.05, 0\.35\] rad$/, (c) => { if (c.all.minExtra < -0.05 - 1e-9 || c.all.maxExtra > 0.35 + 1e-9) throw new Error(`extra hors plage: [${c.all.minExtra}, ${c.all.maxExtra}]`); }],
  [/^la charge de chaque pied \(load G\/D\) reste dans \[0, 1\]$/, (c) => { if (c.all.supportBad) throw new Error("charge hors [0,1]"); }],
  [/^les presets cam (.+) sont définis$/, (c, m) => {
    const names = m[1].split(",").map((x) => x.trim().replace(/"/g, ""));
    for (const n of names) if (!CAM_PRESETS[n]) throw new Error("preset cam inconnu: " + n);
  }],
  [/^le mode pair sans preset cam$/, (c) => { c.preset = null; c.isPair = true; }],
  [/^la caméra par défaut est le preset (\w+)$/, (c, m) => {
    const r = resolveCam(c.preset, c.isPair);
    if (JSON.stringify(r) !== JSON.stringify(CAM_PRESETS[m[1]])) throw new Error("défaut != " + m[1]);
  }],
  [/^le paramètre solid = 1$/, (c) => { c.solid = true; }],
  [/^torsoOpacity vaut ([\d.]+)$/, (c, m) => { if (Math.abs(SOLID_TORSO_OPACITY - Number(m[1])) > 1e-9) throw new Error("SOLID_TORSO_OPACITY=" + SOLID_TORSO_OPACITY); }],
  [/^la séquence corridinho sur (\d+) temps$/, (c, m) => { c.n = Number(m[1]); }],
  [/^on évalue la trajectoire de root$/, (c) => {
    c.path = [];
    for (let b = 0; b <= c.n; b += 0.05) { const p = corridinhoPath(b); c.path.push({ b, ...p, finite: [p.x, p.z, p.ry].every(Number.isFinite) }); }
  }],
  [/^les temps 0 à 3 font un quart de tour à droite/, (c) => {
    const pts = c.path.filter((p) => { const q = ((p.b % 16) + 16) % 16; return q < 4; });
    if (pts[0].ry > 0.05) throw new Error("ry initial non nul: " + pts[0].ry);
    const last = pts[pts.length - 1];
    if (Math.abs(last.ry - Math.PI / 2) > 0.06) throw new Error("fin pivot droit ry=" + last.ry);
  }],
  [/^les temps 4 à 7 font un quart de tour à gauche/, (c) => {
    const pts = c.path.filter((p) => { const q = ((p.b % 16) + 16) % 16; return q >= 4 && q < 8; });
    if (Math.abs(pts[0].ry - Math.PI / 2) > 0.06) throw new Error("début pivot gauche ry=" + pts[0].ry);
    if (Math.abs(pts[pts.length - 1].ry) > 0.06) throw new Error("fin pivot gauche ry=" + pts[pts.length - 1].ry);
  }],
  [/^les temps 8 à 15 décrivent un cercle de rayon entre ([\d.]+) et ([\d.]+) m autour du point \(0, ([\d.]+)\), en passant par le repère fixe$/, (c, m) => {
    const cx = 0, cz = Number(m[3]);
    for (const p of c.path) {
      const q = ((p.b % 16) + 16) % 16;
      if (q < 8 || q >= 16) continue;
      const d = Math.hypot(p.x - cx, p.z - cz);
      if (Math.abs(d - Number(m[3])) > 0.02) throw new Error("pas sur le cercle à b=" + p.b + " d=" + d);
    }
    if (!(Number(m[1]) <= Number(m[3]) && Number(m[3]) <= Number(m[2]))) throw new Error("rayon hors plage");
  }],
  [/^la trajectoire reste finie et le rayon est borné$/, (c) => {
    for (const p of c.path) if (!p.finite) throw new Error("trajectoire non finie à b=" + p.b);
  }],
  [/^on applique le style puis lockUpperTrunk avec iso = (true|false) sur (\d+) temps à amplitude ([\d.]+)$/, (c, m) => {
    const iso = m[1] === "true", n = Number(m[2]), amp = Number(m[3]);
    const r = mockRig();
    c.isoRun = { maxRes: 0, maxPelvisRoll: 0, minKnee: Infinity, minStab: Infinity };
    for (let b = 0; b <= n; b += 0.05) {
      r.root.position.set(0, 0, 0); r.root.rotation.set(0, 0, 0);
      r.pelvis.position.set(0, HIP_Y, 0); r.pelvis.rotation.set(0, 0, 0);
      r.spine.rotation.set(0, 0, 0); r.lumbar.rotation.set(0, 0, 0); r.thoracic.rotation.set(0, 0, 0);
      r.chest.rotation.set(0, 0, 0); r.head.rotation.set(0, 0, 0);
      r.hipL.rotation.set(0, 0, 0); r.hipR.rotation.set(0, 0, 0);
      r.kneeL.rotation.set(0, 0, 0); r.kneeR.rotation.set(0, 0, 0);
      STYLES[c.style].apply(r, b, amp);
      lockUpperTrunk({ spine: r.spine.rotation, chest: r.chest.rotation, head: r.head.rotation }, r.pelvis.rotation, iso);
      c.isoRun.maxRes = Math.max(c.isoRun.maxRes, Math.abs(residualRoll({ spine: r.spine.rotation, chest: r.chest.rotation }, r.pelvis.rotation)));
      c.isoRun.maxPelvisRoll = Math.max(c.isoRun.maxPelvisRoll, Math.abs(r.pelvis.rotation.z));
      c.isoRun.minKnee = Math.min(c.isoRun.minKnee, r.kneeL.rotation.x, r.kneeR.rotation.x);
      c.isoRun.minStab = Math.min(c.isoRun.minStab, upperStability({ spine: r.spine.rotation, chest: r.chest.rotation }, r.pelvis.rotation));
    }
  }],
  [/^le roll résiduel du thorax reste inférieur à ([\d.]+) rad$/, (c, m) => { if (c.isoRun.maxRes > Number(m[1]) + 1e-9) throw new Error("roll résiduel=" + c.isoRun.maxRes); }],
  [/^le pelvis roule d'au moins ([\d.]+) rad$/, (c, m) => { if (c.isoRun.maxPelvisRoll < Number(m[1]) - 1e-9) throw new Error("pelvis roll=" + c.isoRun.maxPelvisRoll); }],
  [/^les genoux restent fléchis d'au moins ([\d.]+) rad$/, (c, m) => { if (c.isoRun.minKnee < Number(m[1]) - 1e-9) throw new Error("knee min=" + c.isoRun.minKnee); }],
  [/^la stabilité du buste vaut au moins ([\d.]+)$/, (c, m) => { if (c.isoRun.minStab < Number(m[1]) - 1e-9) throw new Error("stabilité min=" + c.isoRun.minStab); }],
  [/^le roll résiduel du thorax n'est pas corrigé \(supérieur au cas iso=1\)$/, (c) => { if (!(c.isoRun.maxRes > 0.03)) throw new Error("iso=false: roll résiduel encore faible: " + c.isoRun.maxRes); }],
  [/^le cadre de bras a les bras vers l'avant et les coudes pliés$/, () => {
    if (!(DANCE_FRAME.upperArm.x < -1)) throw new Error("bras pas vers l'avant: " + DANCE_FRAME.upperArm.x);
    if (!(Math.abs(DANCE_FRAME.forearmLeft.z) > 1.5 && Math.abs(DANCE_FRAME.forearmRight.z) > 1.5)) throw new Error("coudes pas pliés");
  }],
  [/^l'avant-bras gauche est vers le haut$/, () => { if (Math.abs(DANCE_FRAME.forearmLeft.z - Math.PI) > 1e-9) throw new Error("avant-bras G pas en haut: " + DANCE_FRAME.forearmLeft.z); }],
  [/^l'avant-bras droit est vers la gauche, paume vers le buste$/, () => {
    if (!(Math.abs(DANCE_FRAME.forearmRight.z + Math.PI / 2) < 1e-9 && Math.abs(DANCE_FRAME.forearmRight.x - Math.PI) < 1e-9)) throw new Error("avant-bras D mal orienté: " + JSON.stringify(DANCE_FRAME.forearmRight));
  }],
];

// ---------- exécution ----------
const featuresDir = join(root, "docs", "features");
const files = readdirSync(featuresDir).filter((f) => f.endsWith(".feature")).sort();
let pass = 0, fail = 0, skip = 0;
for (const f of files) {
  const scenarios = parseFeature(readFileSync(join(featuresDir, f), "utf8"));
  for (const sc of scenarios) {
    const expanded = sc.examples
      ? sc.examples.map((ex) => ({ ...sc, name: Object.entries(ex).reduce((acc, [k, v]) => acc.replaceAll(`<${k}>`, v), sc.name), steps: sc.steps.map((s) => Object.entries(ex).reduce((a, [k, v]) => a.replaceAll(`<${k}>`, v), s)) }))
      : [sc];
    for (const ex of expanded) {
      const label = `${f} :: ${ex.name}`;
      if (ex.tags.includes("wip")) {
        skip++;
        console.log(`[SKIP @wip] ${label}`);
        continue;
      }
      const ctx = {};
      try {
        for (const stepText of ex.steps) {
          const hit = steps.find(([re]) => re.test(stepText));
          if (!hit) throw new Error("step non reconnu: " + stepText);
          hit[1](ctx, hit[0].exec(stepText));
        }
        pass++;
        console.log(`[PASS] ${label}`);
      } catch (e) {
        fail++;
        console.error(`[FAIL] ${label}\n       ${e.message}`);
      }
    }
  }
}
console.log(`\nGherkin: ${pass} PASS, ${fail} FAIL, ${skip} SKIP (@wip) sur ${files.length} fichiers`);
process.exit(fail ? 1 : 0);
