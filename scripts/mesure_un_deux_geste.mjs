// #209 — the « 1 2 » danced alone on the real GLB (not in npm test): is the step aside one gesture with the hip, or two?
// Over the beat before 1 (clock 3 → 4, the left foot steps aside) and the beat of 2 (clock 0 → 1, the right foot joins):
// the travel of the moving foot and of the pelvis (x, towards the dancer's left), when each covers half of its way and
// the lag between them, how much of the foot's way is done before the pelvis has done a tenth of its own, the roll of
// the pelvis and the knee of the moving leg. GESTE=<candidat> for a candidate timing (`?geste=`), UNDEUX=<candidat> for
// another elected step (`?unDeux=`).
//   node scripts/mesure_un_deux_geste.mjs [style]
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const root = new URL('../', import.meta.url).pathname;
const bundle = new URL(`./.mesure-un-deux-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'umDois'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
if (process.env.UNDEUX) api.setUmDoisProto(process.env.UNDEUX);
if (process.env.GESTE) api.setUmDoisGesture(process.env.GESTE);
const [styleKey = 'kizomba'] = process.argv.slice(2);
const f = fixture(api);
const world = o => o.getWorldPosition(new THREE.Vector3());
const STEPS = 64, deg = 180 / Math.PI;
const sample = clock => {
  const stats = api.applyPose(f.r, f.model, clock, { styleKey, amp: 1 }); f.r.root.updateWorldMatrix(true, true);
  const e = new THREE.Euler().setFromQuaternion(f.r.pelvis.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
  return { footL: world(f.r.footL).x, footR: world(f.r.footR).x, pelvis: world(f.r.pelvis).x, roll: e.z * deg, kneeL: stats.kneeL, kneeR: stats.kneeR, loadL: stats.loadL };
};
const report = { style: styleKey, geste: process.env.GESTE ?? 'élu (hancheDabord)', pas: process.env.UNDEUX ?? 'élu' };
for (const [name, from, foot, knee] of [['pas de côté (G, temps 3 → 4)', 3, 'footL', 'kneeL'], ['marque (D rejoint, temps 0 → 1)', 0, 'footR', 'kneeR']]) {
  const rows = Array.from({ length: STEPS + 1 }, (_, k) => ({ t: from + k / STEPS, ...sample(from + k / STEPS) }));
  const way = key => { const a = rows[0][key], b = rows[STEPS][key]; return rows.map(r => (r[key] - a) / (b - a || 1)); };
  const footWay = way(foot), pelvisWay = way('pelvis');
  const at = (w, share) => rows[w.findIndex(v => v >= share)]?.t ?? NaN;
  const footHalf = at(footWay, 0.5), pelvisHalf = Math.abs(rows[STEPS].pelvis - rows[0].pelvis) > 0.05 ? at(pelvisWay, 0.5) : NaN;
  const footDoneWhenPelvisStarts = footWay[pelvisWay.findIndex(v => v >= 0.1)] ?? NaN;
  // How far apart the two shares of the way get (0: one gesture, 1: the foot arrives before the pelvis leaves).
  const gap = Math.max(...footWay.map((v, i) => Math.abs(v - pelvisWay[i])));
  // The marca: the body stays on its foot and makes its small round; the joining foot's way against the pelvis's
  // sideways excursion (towards the joining foot: negative).
  const excursion = rows.map(r => (r.pelvis - rows[0].pelvis) * Math.sign(rows[STEPS][foot] - rows[0][foot]));
  report[name] = {
    pied_cm: +((rows[STEPS][foot] - rows[0][foot]) * 100).toFixed(1), bassin_cm: +((rows[STEPS].pelvis - rows[0].pelvis) * 100).toFixed(1),
    piedAMiChemin: +footHalf.toFixed(3), bassinAMiChemin: +pelvisHalf.toFixed(3), decalage_temps: +(pelvisHalf - footHalf).toFixed(3),
    ...(Math.abs(rows[STEPS].pelvis - rows[0].pelvis) > 0.05 ? { cheminDuPiedQuandLeBassinPart: +footDoneWhenPelvisStarts.toFixed(2), ecartMaxDesCheminsParcourus: +gap.toFixed(2) }
      : { bassinVersLePiedQuiRejoint_cm: [Math.min(...excursion), Math.max(...excursion)].map(v => +(v * 100).toFixed(1)),
        piedEnRouteDe_a: [rows[footWay.findIndex(v => v > 0.05)].t, rows[footWay.findIndex(v => v > 0.95)].t] }),
    roulis_deg: [Math.min(...rows.map(r => r.roll)), Math.max(...rows.map(r => r.roll))].map(v => +v.toFixed(1)),
    genouQuiBouge_deg: [Math.min(...rows.map(r => r[knee])), Math.max(...rows.map(r => r[knee]))].map(v => +v.toFixed(0)),
    parQuartDeTemps: [0, 8, 16, 24, 32, 40, 48, 56, 64].map(k => ({ t: rows[k].t, pied_cm: +(rows[k][foot] * 100).toFixed(1), bassin_cm: +(rows[k].pelvis * 100).toFixed(1), roulis: +rows[k].roll.toFixed(1), genou: +rows[k][knee].toFixed(0), poidsG: +rows[k].loadL.toFixed(2) })),
  };
}
console.log(JSON.stringify(report, null, 1));
