// #219 — the pelvis keeps its speed (docs/spec-bassin-continu.md), on the real GLB, in the game mode itself
// (planGuide, applyGuidePose: what the game shows). Rule R34: no jolt.
//  1. At every boundary between two segments (basic step → figure, figure → figure, figure → basic step) the pelvis's
//     speed is the same on both sides: centre, yaw and roll, both dancers, the six styles. Before #219 the residual of a
//     boundary faded in place only: the pelvis jumped from one figure's speed to the next one's (10 to 20 cm per beat).
// The figures' own guards (the quarter turn, the ida e volta) use the same measure: scripts/bassin_mesure.mjs.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-bassin-continu-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'guidage', 'guidagePose', 'placePaire', 'insertion']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

const STYLES = ['kizomba', 'semba', 'kompa', 'tarraxinha', 'suave', 'zouk'];
const probe = fixture(api), rest = { L: probe.model.legs.L.rest, R: probe.model.legs.R.rest };
const stance = (probe.model.legs.L.hipX - rest.L.x + rest.R.x - probe.model.legs.R.hipX) / 2;
const motions = api.guideMotions({ rest, stance, placement: 'quinconce', amp: 1 });
const deg = 180 / Math.PI, H = api.JUNCTION_STEP;

/** Pelvis of one dancer at a beat of a session: world position (cm) and its yaw and roll (degrees). */
function pelvisAt(f, follower, plan, beat, styleKey) {
  const sample = api.sampleGuide(plan, beat), t = api.compose(sample.couple, api.outerOf(follower));
  f.outer.position.set(t.x, 0, t.z); f.outer.rotation.set(0, t.yaw, 0); f.outer.updateMatrixWorld(true);
  api.applyGuidePose(f.r, f.model, sample, { placement: 'quinconce', contraposition: 1, styleKey, amp: 1 }, follower, f.cache);
  f.r.root.updateWorldMatrix(true, true);
  const p = f.r.pelvis.getWorldPosition(new THREE.Vector3()).multiplyScalar(100);
  const e = new THREE.Euler().setFromQuaternion(f.r.pelvis.getWorldQuaternion(new THREE.Quaternion()), 'YXZ');
  return [p.x, p.y, p.z, e.y * deg, e.z * deg];
}
const unwrap = (a, b) => a - Math.round((a - b) / 360) * 360;

// 1. Speed on both sides of every boundary (second-order one-sided differences, `JUNCTION_STEP` apart).
const LIMIT = { centre: 1, turn: 2 }; // cm per beat, degrees per beat
let boundaries = 0;
const worst = { centre: { jump: 0 }, turn: { jump: 0 } };
for (const styleKey of STYLES) {
  const offered = api.guideFiguresFor(styleKey).filter(k => !api.GUIDE_FIGURES[k].chain);
  // Every figure from and back to the basic step; in kizomba, every figure followed by every other.
  const plans = offered.map(k => [k]);
  if (styleKey === 'kizomba') for (const a of offered) for (const b of offered) plans.push([a, b]);
  for (const figures of plans) {
    const plan = api.planGuide(figures.map((figure, k) => ({ beat: k * 0.1, figure })), motions, 40);
    const starts = plan.segments.slice(1).map(s => s.start).filter(b => b < 30);
    for (const follower of [false, true]) {
      const f = { ...fixture(api), cache: new Map() };
      for (const b of starts) {
        const at = beat => pelvisAt(f, follower, plan, beat, styleKey);
        const before = [b - 1e-7, b - H, b - 2 * H].map(at), after = [b, b + H, b + 2 * H].map(at);
        for (const side of [before, after]) for (const s of side) for (const k of [3, 4]) s[k] = unwrap(s[k], side[0][k]);
        for (const k of [3, 4]) for (const s of after) s[k] = unwrap(s[k], before[0][k]);
        const out = before[0].map((_, k) => api.backSpeed(before[0][k], before[1][k], before[2][k]));
        const into = after[0].map((_, k) => api.aheadSpeed(after[0][k], after[1][k], after[2][k]));
        const centre = Math.hypot(into[0] - out[0], into[1] - out[1], into[2] - out[2]);
        const turn = Math.max(Math.abs(into[3] - out[3]), Math.abs(into[4] - out[4]));
        const where = { styleKey, figures: figures.join('→'), beat: b, role: follower ? 'suiveuse' : 'guideur' };
        if (centre > worst.centre.jump) worst.centre = { jump: centre, ...where };
        if (turn > worst.turn.jump) worst.turn = { jump: turn, ...where };
        boundaries++;
      }
    }
  }
}
assert.ok(worst.centre.jump < LIMIT.centre, `pelvis speed breaks at a boundary: ${JSON.stringify(worst.centre)}`);
assert.ok(worst.turn.jump < LIMIT.turn, `pelvis turning speed breaks at a boundary: ${JSON.stringify(worst.turn)}`);
console.log(`PASS vitesse du bassin continue à ${boundaries} frontières (six styles, chaque figure depuis et vers le pas de base, en kizomba chaque figure suivie de chaque autre) : `
  + `écart max ${worst.centre.jump.toFixed(2)} cm par temps (${worst.centre.styleKey} ${worst.centre.figures}, ${worst.centre.role}), `
  + `${worst.turn.jump.toFixed(2)}° par temps en lacet ou roulis (${worst.turn.styleKey} ${worst.turn.figures}) ; avant #219 : 10 à 20 cm par temps`);
