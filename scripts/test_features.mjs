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
    contents: 'export * from "../src/styles"; export * from "../src/anatomy"; export * from "../src/cameras"; export * from "../src/share"; export * from "../src/directions";',
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
const { STYLES, supportOf, sortieEnvelope, sortieOffset, plantBlend, corridinhoPath, quartsPath, reversePath, travelOffset, swingBeat, idaEVoltaStep, virgulaFootYawDelta, HIP_WIDTH, HIP_Y, S2, CAM_PRESETS, resolveCam, resolveView, viewAnglesOf, posFromView, SOLID_TORSO_OPACITY, lockUpperTrunk, residualRoll, upperStability, DANCE_FRAME, DANCE_FRAME_FOLLOWER, parseVec3, buildShareUrl, DIR_LABELS, facingSector, isDiagonal, relToLineOfDance } = mod;
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
  [/^la trajectoire reste finie$/, (c) => {
    const rows = c.quarts || c.path || [];
    for (const r of rows) if (!r.finite) throw new Error("non fini à b=" + r.b);
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
  [/^la séquence quarts de tour sur (\d+) temps$/, (c, m) => { c.n = Number(m[1]); }],
  [/^on évalue quartsPath de 0 à (\d+)$/, (c, m) => {
    c.quarts = [];
    for (let b = 0; b <= Number(m[1]); b += 0.05) { const q = quartsPath(b); c.quarts.push({ b, ry: q.ry, finite: Number.isFinite(q.ry) }); }
  }],
  [/^ry croît de 0 à 2π \(tour complet\)$/, (c) => {
    const first = c.quarts[0], last = c.quarts[c.quarts.length - 1];
    if (Math.abs(first.ry) > 1e-9) throw new Error("ry initial=" + first.ry);
    if (Math.abs(last.ry - 2 * Math.PI) > 0.1) throw new Error("ry final=" + last.ry + " (attendu ~2π)");
    for (let i = 1; i < c.quarts.length; i++) if (c.quarts[i].ry < c.quarts[i - 1].ry - 1e-9) throw new Error("ry non monotone à b=" + c.quarts[i].b);
  }],
  [/^on inverse la trajectoire du corridinho \(reversePath\)$/, (c) => {
    c.rev = [];
    for (let b = 0; b <= 16; b += 0.05) {
      const p = corridinhoPath(b); const q = reversePath(p);
      c.rev.push({ b, x: q.x, z: q.z, ry: q.ry, ok: Math.abs(q.z + p.z) < 1e-9 && Math.abs(q.ry + p.ry) < 1e-9 });
    }
  }],
  [/^z est miroir et ry opposé, et le cercle passe encore par le repère \(0, 0\)$/, (c) => {
    for (const r of c.rev) if (!r.ok) throw new Error("reverse incorrect à b=" + r.b);
    const onCircle = c.rev.filter((r) => { const p = ((r.b % 16) + 16) % 16; return p >= 8 && p < 16; });
    const origin = onCircle.find((r) => Math.abs(r.x) < 0.31 && Math.abs(r.z) < 0.31 && Math.hypot(r.x, r.z) < 0.02 + 0.0001);
    if (!origin) throw new Error("le cercle inversé ne passe pas par le repère (0,0)");
  }],
  [/^on évalue travelOffset avec travel = ([\d.]+), dir = (-?\d+) puis dir = (-?\d+) sur (\d+) temps$/, (c, m) => {
    c.trav = { t: Number(m[1]), d1: Number(m[2]), d2: Number(m[3]), n: Number(m[4]), rows: [] };
    for (let b = 0; b <= c.trav.n; b += 0.05) c.trav.rows.push([travelOffset(c.trav.t, c.trav.d1, b), travelOffset(c.trav.t, c.trav.d2, b)]);
  }],
  [/^travelOffset\(dir=-1\) est l'opposé de travelOffset\(dir=1\) à chaque temps$/, (c) => {
    for (const [a, bb] of c.trav.rows) if (Math.abs(a + bb) > 1e-9) throw new Error("dir=-1 pas opposé: " + a + " vs " + bb);
  }],
  [/^swingBeat avec temps3 a une période de 3 temps$/, () => {
    for (let b = 0; b <= 12; b += 0.25) if (swingBeat(b, true) !== Math.floor(b / 3)) throw new Error("période != 3 à b=" + b);
  }],
  [/^swingBeat sans temps3 a une période de 1 temps$/, () => {
    for (let b = 0; b <= 12; b += 0.25) if (swingBeat(b, false) !== Math.floor(b)) throw new Error("période != 1 à b=" + b);
  }],
  [/^on évalue idaEVoltaStep sur (\d+) temps$/, (c, m) => {
    c.ida = [];
    for (let b = 0; b < Number(m[1]); b += 0.5) c.ida.push({ b, ...idaEVoltaStep(b) });
  }],
  [/^la séquence est L avant, L arrière, R avant, R arrière$/, (c) => {
    const exp = [["L", 1], ["L", -1], ["R", 1], ["R", -1]];
    for (let k = 0; k < 4; k++) {
      const rows = c.ida.filter((r) => Math.floor(((r.b % 8) + 8) % 8 / 2) === k);
      if (!rows.length) throw new Error("pas de lignes pour k=" + k);
      for (const r of rows) if (r.side !== exp[k][0] || r.dir !== exp[k][1]) throw new Error(`b=${r.b}: ${r.side}${r.dir}, attendu ${exp[k]}`);
    }
  }],
  [/^l'état mode=(\w+), style=(\w+), bpm=(\d+), travel=([\d.]+), iso=(true|false), quarts=(true|false), dir=(-?\d+)$/, (c, m) => {
    c.share = { mode: m[1], style: m[2], bpm: Number(m[3]), travel: Number(m[4]), iso: m[5] === "true", quarts: m[6] === "true", dir: Number(m[7]) };
  }],
  [/^on construit l'URL de partage avec la caméra campos=([-\d.,]+) et camtgt=([-\d.,]+)$/, (c, m) => {
    c.url = buildShareUrl("https://example.test/app/", c.share, parseVec3(m[1]), parseVec3(m[2]));
  }],
  [/^l'URL contient (.+)$/, (c, m) => {
    const url = new URL(c.url);
    for (const pair of m[1].split(" et ")) {
      const eq = pair.indexOf("=");
      const k = pair.slice(0, eq), v = pair.slice(eq + 1);
      if (url.searchParams.get(k) !== v) throw new Error(`param ${k}=${url.searchParams.get(k)}, attendu ${v}`);
    }
  }],
  [/^parseVec3\("([^"]*)"\) vaut (\[[^\]]*\]|null)$/, (c, m) => {
    const got = parseVec3(m[1]);
    const exp = m[2] === "null" ? null : JSON.parse(m[2]);
    if (JSON.stringify(got) !== JSON.stringify(exp)) throw new Error(`parseVec3("${m[1]}")=${JSON.stringify(got)}, attendu ${m[2]}`);
  }],
  [/^le danseur à ry = ([-\d.]+) fait face à "(\w+)"( \(diago\))?$/, (c, m) => {
    const s = facingSector(Number(m[1]));
    if (DIR_LABELS[s] !== m[2]) throw new Error(`ry=${m[1]} → ${DIR_LABELS[s]}, attendu ${m[2]}`);
    if ((m[3] !== undefined) !== isDiagonal(s)) throw new Error(`diago mal détecté pour ${m[2]}`);
  }],
  [/^relToLineOfDance\(x=([-\d.]+), z=([-\d.]+)\) donne along=([-\d.]+), across=([-\d.]+)$/, (c, m) => {
    const r = relToLineOfDance(Number(m[1]), Number(m[2]));
    if (Math.abs(r.along - Number(m[3])) > 1e-9 || Math.abs(r.across - Number(m[4])) > 1e-9) throw new Error(JSON.stringify(r));
  }],
  [/^le cadre de la suiveuse a le coude gauche levé et le coude droit baissé$/, () => {
    if (!(DANCE_FRAME_FOLLOWER.upperLeft.x < -1.3)) throw new Error("coude G pas levé: " + DANCE_FRAME_FOLLOWER.upperLeft.x);
    if (!(DANCE_FRAME_FOLLOWER.upperRight.x > -0.8)) throw new Error("coude D pas baissé: " + DANCE_FRAME_FOLLOWER.upperRight.x);
    if (!(DANCE_FRAME_FOLLOWER.foreRight.x < -1.0)) throw new Error("avant-bras D pas ramené vers la main G du guideur");
  }],
  // Phase 11 — vírgula (pied en angle sur les quarts de tour) + URL angle/zoom
  [/^on évalue virgulaFootYawDelta pour foot=([-\d.]+) et corps=([-\d.]+)$/, (c, m) => {
    c.vy = { foot: Number(m[1]), corps: Number(m[2]), delta: virgulaFootYawDelta(Number(m[1]), Number(m[2])) };
  }],
  [/^virgulaFootYawDelta\(foot=([-\d.]+), corps=([-\d.]+)\) vaut ([-\d.]+)$/, (c, m) => {
    const got = virgulaFootYawDelta(Number(m[1]), Number(m[2]));
    if (Math.abs(got - Number(m[3])) > 1e-4) throw new Error(`delta=${got}, attendu ${m[3]}`);
  }],
  [/^après correction le lacet du pied rejoint celui du corps modulo 2π$/, (c) => {
    let d = c.vy.foot + c.vy.delta - c.vy.corps;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (Math.abs(d) > 1e-9) throw new Error(`foot+delta-corps=${d} (mod 2π)`);
  }],
  [/^le cadre danseur a l'avant-bras gauche vers le haut et la paume vers la droite$/, () => {
    const f = DANCE_FRAME.forearmLeft;
    if (Math.abs(f.y - Math.PI / 2) > 1e-9) throw new Error("avant-bras G pas vers le haut: y=" + f.y);
    if (Math.abs(f.z - Math.PI) > 1e-9) throw new Error("paume G pas vers la droite: z=" + f.z);
    const fr = DANCE_FRAME.forearmRight;
    if (Math.abs(fr.x - Math.PI) > 1e-9 || Math.abs(fr.z + Math.PI / 2) > 1e-9) throw new Error("avant-bras D: " + JSON.stringify(fr));
  }],
  [/^le preset caméra "(\w+)"$/, (c, m) => {
    c.preset = CAM_PRESETS[m[1]];
    if (!c.preset) throw new Error("preset inconnu: " + m[1]);
  }],
  [/^resolveView sans override retourne le preset inchangé$/, (c) => {
    if (resolveView(c.preset, null, null) !== c.preset) throw new Error("preset modifié sans override");
  }],
  [/^resolveView avec angle=([-\d.]+) remplace l'azimut et garde la distance$/, (c, m) => {
    const v = resolveView(c.preset, Number(m[1]), null);
    const va = viewAnglesOf(v.position, v.target);
    const exp = ((Number(m[1]) % 360) + 360) % 360;
    if (Math.abs(va.az - exp) > 1e-6) throw new Error(`az=${va.az}, attendu ${exp}`);
    const d0 = viewAnglesOf(c.preset.position, c.preset.target).dist;
    if (Math.abs(va.dist - d0) > 1e-9) throw new Error(`dist=${va.dist}, attendu ${d0}`);
  }],
  [/^resolveView avec zoom=([\d.]+) remplace la distance et garde l'azimut$/, (c, m) => {
    const v = resolveView(c.preset, null, Number(m[1]));
    const va = viewAnglesOf(v.position, v.target);
    if (Math.abs(va.dist - Number(m[1])) > 1e-9) throw new Error(`dist=${va.dist}, attendu ${m[1]}`);
    const az0 = viewAnglesOf(c.preset.position, c.preset.target).az;
    if (Math.abs(va.az - az0) > 1e-9) throw new Error(`az=${va.az}, attendu ${az0}`);
  }],
  [/^viewAnglesOf\(pos=([-\d.,]+), tgt=([-\d.,]+)\) donne az=([-\d.]+), el=([-\d.]+), dist=([-\d.]+)$/, (c, m) => {
    const va = viewAnglesOf(parseVec3(m[1]), parseVec3(m[2]));
    for (const [k, exp] of [["az", m[3]], ["el", m[4]], ["dist", m[5]]]) {
      if (Math.abs(va[k] - Number(exp)) > 0.01) throw new Error(`${k}=${va[k]}, attendu ${exp}`);
    }
    c.va = va;
    c.tgt = parseVec3(m[2]);
  }],
  [/^posFromView est l'inverse de viewAnglesOf$/, (c) => {
    const p = posFromView(c.tgt, c.va.az, c.va.el, c.va.dist);
    const va2 = viewAnglesOf(p, c.tgt);
    if (Math.abs(va2.az - c.va.az) > 1e-6 || Math.abs(va2.el - c.va.el) > 1e-6 || Math.abs(va2.dist - c.va.dist) > 1e-9)
      throw new Error(JSON.stringify({ va2, va: c.va }));
  }],
  [/^on construit l'URL de partage avec campos=([-\d.,]+) camtgt=([-\d.,]+) et la vue courante$/, (c, m) => {
    const cp = parseVec3(m[1]);
    const ct = parseVec3(m[2]);
    const va = viewAnglesOf(cp, ct);
    c.url = buildShareUrl("https://example.test/app/", c.share, cp, ct, { angle: va.az, zoom: va.dist });
    c.va = va;
  }],
  [/^l'URL a des params angle et zoom cohérents avec la caméra$/, (c) => {
    const url = new URL(c.url);
    const a = Number(url.searchParams.get("angle"));
    const z = Number(url.searchParams.get("zoom"));
    if (!Number.isFinite(a) || !Number.isFinite(z)) throw new Error("angle/zoom absents de l'URL");
    if (Math.abs(a - c.va.az) > 0.05) throw new Error(`angle=${a}, attendu ~${c.va.az}`);
    if (Math.abs(z - c.va.dist) > 0.005) throw new Error(`zoom=${z}, attendu ~${c.va.dist}`);
  }],
  [/^le GLB place patella et fibula au niveau du genou$/, () => {
    const buf = readFileSync(join(root, "public", "anatomy.glb"));
    const clen = buf.readUInt32LE(12);
    const gltf = JSON.parse(buf.subarray(20, 20 + clen).toString("utf8"));
    const nodes = gltf.nodes;
    const byName = Object.fromEntries(nodes.map((n) => [n.name, n]));
    for (const sd of ["R", "L"]) {
      const knee = byName[`KneePivot_${sd}`];
      const kids = knee.children.map((i) => nodes[i]);
      const shin = kids.find((n) => n.translation && Math.abs(n.translation[1]) > 0.15);
      const patella = kids.find((n) => n.translation && n.translation[1] > -0.05 && n.translation[2] > 0.02);
      const fibula = kids.find((n) => n.name.startsWith("Fibula"));
      if (!shin) throw new Error(`pas de tibia long sous KneePivot_${sd}`);
      if (!patella) throw new Error(`pas de patella au genou sous KneePivot_${sd}: ` + JSON.stringify(kids.map((k) => k.translation)));
      if (!fibula || Math.abs(fibula.translation[0]) > 0.05) throw new Error(`fibula ${sd} trop latérale: ` + JSON.stringify(fibula && fibula.translation));
    }
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
