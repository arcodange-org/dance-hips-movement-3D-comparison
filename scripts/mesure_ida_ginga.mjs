// #210 — the pair ida e volta on the real GLB (not in npm test): contraposition (chest against pelvis, world yaw) and
// the ginga's continuity (how long the hips stand still between two go-and-returns). App view: quinconce, plexus
// contact, contraposition 1 (PLACEMENT=reference for feet facing feet). For a candidate share of the weight: IDA_POIDS=<name>.
//   node scripts/mesure_ida_ginga.mjs [styles…]
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const root = new URL('../', import.meta.url).pathname;
const bundle = new URL(`./.mesure-ida-ginga-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'idaPaire'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
if (process.env.IDA_POIDS) api.setIdaWeightProto(process.env.IDA_POIDS);
// #210: IDA_GINGA=tenu holds the ginga between two go-and-returns (the model before).
if (process.env.IDA_GINGA) api.setIdaGingaFlow(process.env.IDA_GINGA);
const styles = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(api.STYLES).filter(k => api.movementAllowed(k, 'ida'));
const dz = api.IDA_PAIR_DZ, deg = 180 / Math.PI, STEP = 1 / 32;
const yawOf = o => new THREE.Euler().setFromQuaternion(o.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
for (const styleKey of styles) {
  const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
  const out = pair.map(() => ({ twist: 0, pelvis: 0, chest: 0, still: 0, longestStill: 0, run: 0, side: [] }));
  let prev = null;
  for (let beat = 0; beat <= 16 + 1e-9; beat += STEP) {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, { movement: 'ida', ida: true, idaPaire: true, embrace: true, follower: !!i,
      placement: process.env.PLACEMENT ?? 'quinconce', styleKey, amp: 1, plexus: true, contraposition: 1 }));
    const now = pair.map((f, i) => {
      f.r.root.updateWorldMatrix(true, true);
      const facing = i ? Math.PI : 0;
      const pelvis = wrap(yawOf(f.r.pelvis) - facing), chest = wrap(yawOf(f.r.chest) - facing);
      const o = out[i];
      o.twist = Math.max(o.twist, Math.abs(wrap(chest - pelvis))); o.pelvis = Math.max(o.pelvis, Math.abs(pelvis)); o.chest = Math.max(o.chest, Math.abs(chest));
      const p = f.r.pelvis.getWorldPosition(new THREE.Vector3());
      return { x: i ? -p.x : p.x };
    });
    if (prev && beat >= 8) now.forEach((n, i) => {
      // Lateral speed of the pelvis (cm per beat): below 1 cm/beat the hips stand still.
      const v = Math.abs(n.x - prev[i].x) / STEP * 100, o = out[i];
      if (v < 1) { o.still += STEP; o.run += STEP; o.longestStill = Math.max(o.longestStill, o.run); } else o.run = 0;
    });
    prev = now;
  }
  out.forEach((o, i) => console.log(`${styleKey.padEnd(10)} ${i ? 'suiveuse' : 'guideur '} buste contre bassin ${(o.twist * deg).toFixed(1)}°`,
    `bassin ${(o.pelvis * deg).toFixed(1)}°, buste ${(o.chest * deg).toFixed(1)}° (vers le partenaire = 0) ;`,
    `hanches immobiles ${(o.still / 8 * 100).toFixed(0)} % du cycle, au plus ${o.longestStill.toFixed(2)} temps d'affilée`));
}
