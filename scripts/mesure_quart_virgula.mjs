// #208 — measures of the pair quarter turn's first step on the real GLB (not in npm test): where the leader's virgula
// lands against the tip of his D, how far the follower's D retreats, and how the two pelvises turn (yaw speed and
// acceleration). First quarter; the others are the same up to the rotation.
//   node scripts/mesure_quart_virgula.mjs [style] [placement]     (QUARTS=<JSON of QUARTS_VIRGULA> for a candidate)
// REGLAGE tries a setting without touching the sources, as in scripts/sonde_croisements_couple.mjs.
import { build } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const root = new URL('../', import.meta.url).pathname;
const settings = JSON.parse(process.env.REGLAGE ?? '[]');
const tune = { name: 'reglage', setup(b) {
  b.onLoad({ filter: /src\/.*\.ts$/ }, args => {
    let text = readFileSync(args.path, 'utf8');
    for (const [file, from, to] of settings) if (args.path === root + file) {
      if (!text.includes(from)) throw new Error(`REGLAGE: « ${from} » absent de ${file}`);
      text = text.replace(from, to);
    }
    return { contents: text, loader: 'ts' };
  });
} };
const bundle = new URL(`./.mesure-quart-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent', plugins: [tune] });
const api = await import(bundle.href); unlinkSync(bundle);
// #208: QUART=<candidat> measures a candidate quarter turn (`?quart=` in the app).
if (process.env.QUART) api.setQuartProto(process.env.QUART);
const [styleKey = 'kizomba', placement = 'quinconce'] = process.argv.slice(2);
const dz = api.QUARTS_PAIR_DZ;
const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const pose = beat => pair.forEach((f, i) => { api.applyPose(f.r, f.model, beat, { movement: 'quarts', quarts: true, embrace: true, quartsPaire: true,
  follower: !!i, placement, styleKey, amp: 1 }); f.r.root.updateWorldMatrix(true, true); });
const sole = (f, side) => f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld));
const point = (f, side, name) => f.model.legs[side][name].clone().applyMatrix4(f.r['foot' + side].matrixWorld);
const yawOf = f => new THREE.Euler().setFromQuaternion(f.r.pelvis.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
const STEPS = 64, deg = 180 / Math.PI;
pose(0);
const start = { tipR: Math.max(...sole(pair[0], 'R').map(p => p.z)), herR: pair[1].r.footR.getWorldPosition(new THREE.Vector3()),
  hisL: pair[0].r.footL.getWorldPosition(new THREE.Vector3()), hisR: pair[0].r.footR.getWorldPosition(new THREE.Vector3()) };
let retreat = 0;
const yaw = [[], []];
for (let i = 0; i <= 4 * STEPS; i++) {
  pose(i / STEPS);
  retreat = Math.max(retreat, pair[1].r.footR.getWorldPosition(new THREE.Vector3()).z - start.herR.z);
  pair.forEach((f, k) => yaw[k].push(yawOf(f)));
}
pose(1);
// The virgula: his G lands across, heel beyond the tip of his D (his forward is +z at the start of the quarter).
const heel = point(pair[0], 'L', 'heel'), ankleL = pair[0].r.footL.getWorldPosition(new THREE.Vector3());
const herR1 = pair[1].r.footR.getWorldPosition(new THREE.Vector3());
const report = { style: styleKey, placement,
  virgula: { talonAuDelaDuBoutDuD_cm: +((heel.z - start.tipR) * 100).toFixed(1), avanceeDuG_cm: +((ankleL.z - start.hisL.z) * 100).toFixed(1),
    devantLaChevilleD_cm: +((ankleL.z - start.hisR.z) * 100).toFixed(1) },
  suiveuse: { reculMaxDuD_cm: +(retreat * 100).toFixed(1), reculAuTemps1_cm: +((herR1.z - start.herR.z) * 100).toFixed(1) },
  lacet: {} };
for (const [k, role] of [[0, 'guideur'], [1, 'suiveuse']]) {
  let y = yaw[k].slice();
  for (let i = 1; i < y.length; i++) { while (y[i] - y[i - 1] > Math.PI) y[i] -= 2 * Math.PI; while (y[i] - y[i - 1] < -Math.PI) y[i] += 2 * Math.PI; }
  const v = y.map((_, i) => i && i < y.length - 1 ? (y[i + 1] - y[i - 1]) / 2 * STEPS * deg : 0);
  const a = y.map((_, i) => i && i < y.length - 1 ? (y[i + 1] - 2 * y[i] + y[i - 1]) * STEPS * STEPS * deg : 0);
  const quarterBeat = Array.from({ length: 16 }, (_, q) => Math.round((y[(q + 1) * STEPS / 4] - y[q * STEPS / 4]) * 4 * deg));
  const top = arr => { let m = 0, at = 0; arr.forEach((x, i) => { if (Math.abs(x) > Math.abs(m)) { m = x; at = i / STEPS; } }); return { valeur: Math.round(m), temps: +at.toFixed(3) }; };
  report.lacet[role] = { vitesseMax_degParTemps: top(v), accelerationMax_degParTemps2: top(a), auTemps1_deg: Math.round((y[STEPS] - y[0]) * deg),
    vitesseMoyenneParQuartDeTemps: quarterBeat.join(' ') };
}
console.log(JSON.stringify(report, null, 1));
