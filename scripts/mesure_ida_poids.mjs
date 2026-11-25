// #210 — measures of the pair ida e volta's weight on the real GLB (not in npm test): in each slot of the cycle, how much of
// the weight the outgoing foot takes, how far the pelvis goes towards it (forward or back, and sideways: the ginga), where
// the pelvis stands between the two ankles on the beat, and how the knees bend. For a candidate: IDA_POIDS=<name>.
//   node scripts/mesure_ida_poids.mjs [style] [placement]
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const root = new URL('../', import.meta.url).pathname;
const bundle = new URL(`./.mesure-ida-poids-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'idaPaire'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
if (process.env.IDA_POIDS) api.setIdaWeightProto(process.env.IDA_POIDS);
// #210: IDA_GINGA=tenu holds the ginga between two go-and-returns; IDA_CONTRA=<degrees> probes the contraposition.
if (process.env.IDA_GINGA) api.setIdaGingaFlow(process.env.IDA_GINGA);
if (process.env.IDA_CONTRA) api.setIdaContraProto(process.env.IDA_CONTRA);
const [styleKey = 'kizomba', placement = 'quinconce'] = process.argv.slice(2);
const dz = api.IDA_PAIR_DZ;
const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const pose = beat => pair.map((f, i) => { const s = api.applyPose(f.r, f.model, beat, { movement: 'ida', ida: true, embrace: true, idaPaire: true,
  follower: !!i, placement, styleKey, amp: 1 }); f.r.root.updateWorldMatrix(true, true); return s; });
const world = o => o.getWorldPosition(new THREE.Vector3());
// Each dancer's own frame: forward +z for the leader, -z for the follower (she faces him); left +x for him, -x for her.
const own = (i, v) => (i ? new THREE.Vector3(-v.x, v.y, -v.z) : v.clone());
const roll = f => new THREE.Euler().setFromQuaternion(f.r.pelvis.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').z;
const STEPS = 64, deg = 180 / Math.PI, cm = v => +(v * 100).toFixed(1);
const SLOTS = ['G en avant', 'G en arrière', 'D en avant', 'D en arrière'];
const report = { style: styleKey, placement, candidat: process.env.IDA_POIDS ?? 'aujourdhui', guideur: [], suiveuse: [] };
for (let slot = 0; slot < 4; slot++) {
  const s0 = 2 * slot;
  pose(s0);
  const start = pair.map((f, i) => ({ pelvis: own(i, world(f.r.pelvis)), roll: roll(f) }));
  const acc = pair.map(() => ({ load: 0, ahead: 0, aside: 0, roll: 0 }));
  let moving = null;
  for (let k = 0; k <= 1.5 * STEPS; k++) {
    const stats = pose(s0 + k / STEPS);
    pair.forEach((f, i) => {
      const sample = api.sampleIdaPaire(s0 + k / STEPS, !!i, { L: { x: .071, z: 0 }, R: { x: -.071, z: 0 } }, placement);
      const m = sample.moving; if (k === 0) (moving ??= [])[i] = m;
      const p = own(i, world(f.r.pelvis)).sub(start[i].pelvis);
      const a = acc[i], load = m === 'R' ? stats[i].loadR : stats[i].loadL;
      a.load = Math.max(a.load, load);
      if (Math.abs(p.z) > Math.abs(a.ahead)) a.ahead = p.z;
      // Sideways towards the moving foot (left foot: +x in the own frame).
      const side = (m === 'L' ? 1 : -1) * p.x;
      if (side > a.aside) a.aside = side;
      const r = (roll(f) - start[i].roll) * deg;
      if (Math.abs(r) > Math.abs(a.roll)) a.roll = r;
    });
  }
  // On the beat: where the pelvis stands between the standing ankle (0) and the moving one (1), in the floor plane.
  const stats = pose(s0 + 1);
  pair.forEach((f, i) => {
    const m = moving[i], standing = m === 'L' ? 'R' : 'L';
    const a = world(f.r['foot' + standing]), b = world(f.r['foot' + m]), p = world(f.r.pelvis);
    const ab = new THREE.Vector2(b.x - a.x, b.z - a.z), ap = new THREE.Vector2(p.x - a.x, p.z - a.z);
    const along = ab.dot(ap) / ab.lengthSq();
    const knee = side => +stats[i]['knee' + side].toFixed(0);
    report[i ? 'suiveuse' : 'guideur'].push({ pas: SLOTS[slot], piedSorti: m,
      poidsMaxSurLePiedSorti: +acc[i].load.toFixed(2), bassinVersLePied_cm: cm(acc[i].ahead), bassinDeCote_cm: cm(acc[i].aside),
      roulisMax_deg: +acc[i].roll.toFixed(1), bassinEntreLesChevillesAuTemps: +along.toFixed(2),
      genouxAuTemps_deg: { porteur: knee(standing), sorti: knee(m) } });
  });
}
console.log(JSON.stringify(report, null, 1));
