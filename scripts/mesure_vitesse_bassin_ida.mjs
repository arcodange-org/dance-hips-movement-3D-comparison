// #210 — speed of the pelvis in the pair ida e volta, on the real GLB (not in npm test; the guard lives in
// scripts/test_ida_paire.mjs). The comparator's pair view (quinconce, plexus contact, contraposition 1), every 1/50 of a
// beat over a whole cycle in regime (beats 8 to 16): linear speed of the pelvis centre (cm per beat), angular speed of
// the pelvis (degrees per beat), and the slowest instants. A pose held on the beat shows as a dip of both near zero.
//   node scripts/mesure_vitesse_bassin_ida.mjs [styles…]      IDA_GINGA=tenu: the model before; DETAIL=1: every sample
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const root = new URL('../', import.meta.url).pathname;
const bundle = new URL(`./.mesure-vitesse-ida-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'idaPaire'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
if (process.env.IDA_GINGA) api.setIdaGingaFlow(process.env.IDA_GINGA);
if (process.env.IDA_POIDS) api.setIdaWeightProto(process.env.IDA_POIDS);
const styles = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(api.STYLES).filter(k => api.movementAllowed(k, 'ida'));
const STEP = 1 / 50, deg = 180 / Math.PI;
const report = {};
for (const styleKey of styles) {
  const dz = api.IDA_PAIR_DZ;
  const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
  const tracks = pair.map(() => []);
  for (let k = 0; k <= 8 / STEP + 1; k++) {
    const beat = 8 + k * STEP;
    pair.forEach((f, i) => { api.applyPose(f.r, f.model, beat, { movement: 'ida', ida: true, idaPaire: true, embrace: true, follower: !!i,
      placement: 'quinconce', styleKey, amp: 1, plexus: true, contraposition: 1 }); f.r.root.updateWorldMatrix(true, true);
      tracks[i].push({ beat, p: f.r.pelvis.getWorldPosition(new THREE.Vector3()), q: f.r.pelvis.getWorldQuaternion(new THREE.Quaternion()) }); });
  }
  report[styleKey] = tracks.map((t, i) => {
    const speeds = [];
    for (let k = 1; k < t.length - 1; k++) {
      // Central differences: speed at the sample itself.
      const v = t[k + 1].p.distanceTo(t[k - 1].p) / (2 * STEP) * 100, w = t[k + 1].q.angleTo(t[k - 1].q) / (2 * STEP) * deg;
      speeds.push({ beat: +(t[k].beat - 8).toFixed(2), v, w });
    }
    if (process.env.DETAIL) speeds.forEach(s => console.log(styleKey, i ? 'suiveuse' : 'guideur', s.beat, s.v.toFixed(2), s.w.toFixed(2)));
    const slowest = speeds.reduce((a, s) => (s.v < a.v ? s : a)), stillest = speeds.reduce((a, s) => (s.w < a.w ? s : a));
    // Both slow at once: the pose held. `figee` is the largest of the two, in their own units, scaled to a common one
    // (1 cm per beat ~ 1 degree per beat for the pelvis: its hips are about 14 cm apart, 1 degree moves them 1.2 mm…
    // so the angular speed is divided by 4).
    const both = speeds.reduce((a, s) => (Math.max(s.v, s.w / 4) < Math.max(a.v, a.w / 4) ? s : a));
    return { danseur: i ? 'suiveuse' : 'guideur',
      vitesseMin_cm_par_temps: +slowest.v.toFixed(2), ou: slowest.beat,
      rotationMin_deg_par_temps: +stillest.w.toFixed(2), ouRotation: stillest.beat,
      lesDeuxAuPlusBas: { temps: both.beat, cm_par_temps: +both.v.toFixed(2), deg_par_temps: +both.w.toFixed(2) },
      sousUnCmParTemps: +(speeds.filter(s => s.v < 1).length / speeds.length * 100).toFixed(0) + ' %' };
  });
}
console.log(JSON.stringify(report, null, 1));
