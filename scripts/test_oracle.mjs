#!/usr/bin/env node
// Runner de l'oracle de poses (phase 18) : exécute docs/oracle.feature contre src/oracle.ts
// (bundle esbuild, comme test_features.mjs). Ne dépend PAS de docs/features/ (réservé issue #17).
// Usage : npm test (3e étape) ou node scripts/test_oracle.mjs
import { createRequire } from "node:module";
import { readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "scripts", ".test-oracle-bundle.mjs");
esbuild.buildSync({
  stdin: {
    contents: 'export * from "../src/oracle"; export * from "../src/styles";',
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
const { oraclePose, oracleHalfStep, quartTurnStep } = mod;

// ---------- mini parseur Gherkin ----------
function parseFeature(text) {
  const scenarios = [];
  let cur = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const mS = /^(Scenario Outline|Scenario):\s*(.*)$/.exec(line);
    if (mS) {
      if (cur) scenarios.push(cur);
      cur = { name: mS[2], steps: [] };
      continue;
    }
    const mStep = /^(Given|When|Then|And|But)\s+(.*)$/.exec(line);
    if (mStep && cur) cur.steps.push(mStep[2]);
  }
  if (cur) scenarios.push(cur);
  return scenarios;
}

// ---------- comparaison de poses ----------
const TOL = 1e-9;
function footEq(a, b, tol = TOL) {
  return Math.abs(a.x - b.x) <= tol && Math.abs(a.z - b.z) <= tol && Math.abs(a.yaw - b.yaw) <= tol;
}
function poseEq(a, b, tol = TOL) {
  return footEq(a.footL, b.footL, tol) && footEq(a.footR, b.footR, tol) &&
    Math.abs(a.upperYaw - b.upperYaw) <= tol && Math.abs(a.lowerYaw - b.lowerYaw) <= tol;
}
function wrapPi(d) {
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

// ---------- registre de steps ----------
const steps = [
  [/^le mouvement "(quarts|ida)" sur (\d+) temps$/, (c, m) => { c.movement = m[1]; c.n = Number(m[2]); c.reverse = false; }],
  [/^on calcule les poses oracle des demi-pas k de 0 à (\d+) en reverse$/, (c, m) => {
    c.reverse = true;
    c.steps = [];
    for (let k = 0; k < Number(m[1]); k++) c.steps.push(oracleHalfStep(c.movement, k, true));
  }],
  [/^on calcule les poses oracle des demi-pas k de 0 à (\d+)$/, (c, m) => {
    c.steps = [];
    for (let k = 0; k < Number(m[1]); k++) c.steps.push(oracleHalfStep(c.movement, k, c.reverse));
  }],
  [/^end\(k\) est égal à start\(k\+1\) pour tout k$/, (c) => {
    for (let k = 0; k + 1 < c.steps.length; k++) {
      if (!poseEq(c.steps[k].end, c.steps[k + 1].start)) {
        throw new Error(`discontinuité au demi-pas k=${k}: end=${JSON.stringify(c.steps[k].end)} start(k+1)=${JSON.stringify(c.steps[k + 1].start)}`);
      }
    }
  }],
  [/^la pose au temps (\d+) est égale à la pose au temps (\d+) \(raccord de cycle\)$/, (c, m) => {
    const a = oraclePose(c.movement, Number(m[1]), c.reverse);
    const b = oraclePose(c.movement, Number(m[2]), c.reverse);
    if (!poseEq(a, b)) throw new Error(`raccord de cycle violé: pose(${m[1]}) != pose(${m[2]})`);
  }],
  [/^chaque pose oracle au temps 2k correspond à quartTurnStep\(2k\) \(pieds, upperYaw, lowerYaw\)$/, (c) => {
    for (let k = 0; k < c.steps.length; k++) {
      const qs = quartTurnStep(2 * k, c.reverse);
      const p = c.steps[k].start;
      if (!footEq(p.footL, qs.footL) || !footEq(p.footR, qs.footR) ||
          Math.abs(p.upperYaw - qs.upperYaw) > TOL || Math.abs(p.lowerYaw - qs.lowerYaw) > TOL) {
        throw new Error(`pose oracle k=${k} != quartTurnStep(2k)`);
      }
    }
  }],
  [/^chaque pose reverse est le miroir de la pose normale \(footL<->footR, z et yaw opposés, upperYaw\/lowerYaw opposés\)$/, (c) => {
    for (let k = 0; k < c.steps.length; k++) {
      const norm = oraclePose(c.movement, 2 * k, false);
      const rev = oraclePose(c.movement, 2 * k, true);
      const ok =
        footEq(rev.footL, { x: norm.footR.x, z: -norm.footR.z, yaw: -norm.footR.yaw }) &&
        footEq(rev.footR, { x: norm.footL.x, z: -norm.footL.z, yaw: -norm.footL.yaw }) &&
        Math.abs(rev.upperYaw + norm.upperYaw) <= TOL && Math.abs(rev.lowerYaw + norm.lowerYaw) <= TOL;
      if (!ok) throw new Error(`dualité reverse violée au demi-pas k=${k}`);
    }
  }],
  [/^on calcule les poses oracle aux temps ([\d, ]+)/, (c, m) => {
    c.times = m[1].split(",").map((s) => Number(s.trim()));
    c.poses = c.times.map((t) => ({ t, pose: oraclePose(c.movement, t, c.reverse) }));
  }],
  [/^l'écart de lacet entre le pied pivotant et l'autre pied vaut pi\/2 à chaque quart$/, (c) => {
    for (const { t, pose } of c.poses) {
      const qs = quartTurnStep(t, c.reverse);
      const pivot = qs.stepSide === "L" ? pose.footL : pose.footR;
      const other = qs.stepSide === "L" ? pose.footR : pose.footL;
      const d = Math.abs(wrapPi(pivot.yaw - other.yaw));
      if (Math.abs(d - Math.PI / 2) > 1e-9) throw new Error(`t=${t}: écart de lacet pivot = ${d}, attendu pi/2`);
    }
  }],
  [/^upperYaw et lowerYaw sont de signes strictement opposés à chaque milieu de pas$/, (c) => {
    for (const { t, pose } of c.poses) {
      if (!(pose.upperYaw * pose.lowerYaw < 0)) throw new Error(`t=${t}: pas de contraposition (upper=${pose.upperYaw}, lower=${pose.lowerYaw})`);
    }
  }],
  [/^upperYaw et lowerYaw sont nuls aux frontières de pas \(temps pairs\)$/, (c) => {
    for (let t = 0; t < c.n; t += 2) {
      const p = oraclePose(c.movement, t, c.reverse);
      if (Math.abs(p.upperYaw) > 1e-12 || Math.abs(p.lowerYaw) > 1e-12) throw new Error(`t=${t}: yaws non nuls à la frontière (${p.upperYaw}, ${p.lowerYaw})`);
    }
  }],
];

// ---------- exécution ----------
const scenarios = parseFeature(readFileSync(join(root, "docs", "oracle.feature"), "utf8"));
let pass = 0, fail = 0;
for (const sc of scenarios) {
  const c = {};
  try {
    for (const st of sc.steps) {
      const hit = steps.find(([re]) => re.test(st));
      if (!hit) throw new Error("step inconnu: " + st);
      hit[1](c, st.match(hit[0]));
    }
    pass++;
    console.log(`[PASS] oracle :: ${sc.name}`);
  } catch (e) {
    fail++;
    console.log(`[FAIL] oracle :: ${sc.name}\n       ${e.message}`);
  }
}
console.log(`\nOracle: ${pass} PASS, ${fail} FAIL sur ${scenarios.length} scénarios`);
process.exit(fail ? 1 : 0);
