// #219, #221 — the pelvis of both dancers in a game-mode session (planGuide, applyGuidePose: what the game shows), a
// figure commanded from the basic step, measured on the real GLB: speed and acceleration of its centre (cm per beat),
// of its yaw and its roll (degrees per beat), zone by zone. Shared by the figures' tests (docs/spec-bassin-continu.md).
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";

/** The modules of the game mode, bundled once per process. */
let loaded = null;
export async function guideApi() {
  if (loaded) return loaded;
  const bundle = new URL(`./.bassin-mesure-${process.pid}.mjs`, import.meta.url);
  buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'guidage', 'guidagePose', 'placePaire', 'insertion']
    .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
    bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
    define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
  loaded = await import(bundle.href); unlinkSync(bundle);
  return loaded;
}

const deg = 180 / Math.PI;
const unwrap = a => { const y = a.slice(); for (let i = 1; i < y.length; i++) y[i] -= Math.round((y[i] - y[i - 1]) / (2 * Math.PI)) * 2 * Math.PI; return y; };

/** `kind` commanded at beat 0 (then `then`, if given): the session from `before` beats ahead of the figure to `after`
 * beats past the segment that follows it. Rows per role (`guideur`, `suiveuse`), `t` in beats from the figure's start. */
export async function pelvisSession(kind, { styleKey = 'kizomba', then = null, steps = 48, before = 1.5, after = 1.1 } = {}) {
  const api = await guideApi();
  const probe = fixture(api), rest = { L: probe.model.legs.L.rest, R: probe.model.legs.R.rest };
  const stance = (probe.model.legs.L.hipX - rest.L.x + rest.R.x - probe.model.legs.R.hipX) / 2;
  const motions = api.guideMotions({ rest, stance, placement: 'quinconce', amp: 1 });
  const plan = api.planGuide([{ beat: 0, figure: kind }, ...(then ? [{ beat: 0.1, figure: then }] : [])], motions, 40);
  const segment = plan.segments.find(s => s.kind === kind), next = plan.segments[plan.segments.indexOf(segment) + 1];
  const end = next.start - segment.start, from = segment.start - before;
  const to = next.start + (next.kind === 'base' ? 0 : api.segmentBeats(next.kind, next.touches ?? [])) + after;
  const roles = {};
  for (const follower of [false, true]) {
    const f = { ...fixture(api), cache: new Map() }, track = [];
    for (let i = 0; i <= Math.round((to - from) * steps); i++) {
      const beat = from + i / steps, sample = api.sampleGuide(plan, beat), t = api.compose(sample.couple, api.outerOf(follower));
      f.outer.position.set(t.x, 0, t.z); f.outer.rotation.set(0, t.yaw, 0); f.outer.updateMatrixWorld(true);
      api.applyGuidePose(f.r, f.model, sample, { placement: 'quinconce', contraposition: 1, styleKey, amp: 1 }, follower, f.cache);
      f.r.root.updateWorldMatrix(true, true);
      const e = new THREE.Euler().setFromQuaternion(f.r.pelvis.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
      track.push({ t: beat - segment.start, p: f.r.pelvis.getWorldPosition(new THREE.Vector3()).multiplyScalar(100), yaw: e.y, roll: e.z });
    }
    const yaw = unwrap(track.map(s => s.yaw)), roll = unwrap(track.map(s => s.roll)), h = 1 / steps, rows = [];
    for (let i = 1; i < track.length - 1; i++) {
      const v = track[i + 1].p.clone().sub(track[i - 1].p).divideScalar(2 * h);
      const a = track[i + 1].p.clone().add(track[i - 1].p).sub(track[i].p.clone().multiplyScalar(2)).divideScalar(h * h);
      rows.push({ t: track[i].t, v: Math.hypot(v.x, v.z), vy: v.y, a: Math.hypot(a.x, a.z), ay: a.y,
        w: (yaw[i + 1] - yaw[i - 1]) / (2 * h) * deg, aw: (yaw[i + 1] - 2 * yaw[i] + yaw[i - 1]) / (h * h) * deg,
        r: (roll[i + 1] - roll[i - 1]) / (2 * h) * deg, ar: (roll[i + 1] - 2 * roll[i] + roll[i - 1]) / (h * h) * deg });
    }
    roles[follower ? 'suiveuse' : 'guideur'] = rows;
  }
  return { end, next: next.kind, roles, steps };
}

/** Largest accelerations (centre on the ground, height, yaw, roll), top and lowest speed, and the longest stretch where
 * the pelvis stands still (centre under 1 cm, yaw and roll under 2° per beat), between beats `lo` and `hi`. */
export function zoneOf(rows, lo, hi, steps = 48) {
  const z = rows.filter(r => r.t >= lo - 1e-9 && r.t <= hi + 1e-9);
  const top = key => z.reduce((m, r) => (Math.abs(r[key]) > Math.abs(m[key]) ? r : m));
  const still = r => Math.hypot(r.v, r.vy) < 1 && Math.abs(r.w) < 2 && Math.abs(r.r) < 2;
  let longest = 0, run = 0;
  for (const r of z) { run = still(r) ? run + 1 / steps : 0; longest = Math.max(longest, run); }
  const slow = z.reduce((m, r) => (Math.hypot(r.v, r.vy) < Math.hypot(m.v, m.vy) ? r : m));
  const at = (key) => ({ value: Math.abs(top(key)[key]), t: top(key).t });
  return { a: at('a'), ay: at('ay'), aw: at('aw'), ar: at('ar'), vmax: top('v').v, vmin: { value: Math.hypot(slow.v, slow.vy), t: slow.t }, still: longest };
}
