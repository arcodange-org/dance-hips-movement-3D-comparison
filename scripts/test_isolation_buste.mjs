// #223 — above the navel the trunk stays still (docs/spec-isolation-buste.md, rule R46), on the real GLB.
// The hips carry the weight all the time; the waist takes up what the pelvis does (its sway, its roll, its pitch, its
// yaw). Measured as in issue #223: the top of the chest (`chest`) in each dancer's own frame, each track compared with
// its sliding mean over 4 beats (one period of the basic step, which takes out the figure's travel); peak to peak.
//  1. Alone, on the spot, the six styles (the elected basic step): the chest does not roll, pitch nor turn; it does not
//     move aside nor forward, but for the travel of the kizomba's and the semba's « 1 2 » (their feet change place).
//     The pelvis keeps all its motion: the isolation is the trunk's, not a smaller hip.
//  2. In pair, the game mode itself (planGuide, applyGuidePose), both dancers, the basic step and each figure of each
//     style, junctions included: the chest stays still. Not bounded here, as the rule keeps them: the quarter turn's own
//     rotation, and in the sorties the leader turning to lead and the travel aside (#220).
//  3. `?buste=elu` keeps the trunk of before: the kompa's chest follows its pelvis as voted on 23 Nov.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL(`./.test-isolation-buste-${process.pid}.mjs`, import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'guidage', 'guidagePose', 'placePaire', 'insertion']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

const STYLES = ['kizomba', 'semba', 'kompa', 'tarraxinha', 'suave', 'zouk'];
const STEPS = 24, W = 2 * STEPS, deg = 180 / Math.PI;
const LIMIT = { side: 0.3, turn: 0.3 }; // cm, degrees: still
const unwrap = a => { const y = a.slice(); for (let i = 1; i < y.length; i++) y[i] -= Math.round((y[i] - y[i - 1]) / 360) * 360; return y; };
/** Peak to peak of what is left once the sliding mean over 4 beats is taken out. */
const swing = arr => { const out = []; for (let i = W; i < arr.length - W; i++) { let m = 0; for (let j = i - W; j <= i + W; j++) m += arr[j]; out.push(arr[i] - m / (2 * W + 1)); } return Math.max(...out) - Math.min(...out); };
/** A node of the rig in the dancer's own frame (the parent of its root): position (cm), yaw, pitch, roll (degrees). */
function take(f, node) {
  const inv = f.r.root.parent.matrixWorld.clone().invert(), q = f.r.root.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const p = node.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv).multiplyScalar(100);
  const e = new THREE.Euler().setFromQuaternion(q.multiply(node.getWorldQuaternion(new THREE.Quaternion())), 'YXZ');
  return { x: p.x, z: p.z, yaw: e.y * deg, pitch: e.x * deg, roll: e.z * deg };
}
const swings = track => ({ side: swing(track.map(s => s.x)), fore: swing(track.map(s => s.z)),
  roll: swing(unwrap(track.map(s => s.roll))), yaw: swing(unwrap(track.map(s => s.yaw))), pitch: swing(unwrap(track.map(s => s.pitch))) });

// 1. Alone, on the spot.
function solo(styleKey) {
  const f = fixture(api), chest = [], pelvis = [];
  for (let i = -W; i <= 8 * STEPS + W; i++) {
    api.applyPose(f.r, f.model, 8 + i / STEPS, { styleKey, amp: 1 }); f.r.root.updateWorldMatrix(true, true);
    chest.push(take(f, f.r.chest)); pelvis.push(take(f, f.r.pelvis));
  }
  return { chest: swings(chest), pelvis: swings(pelvis) };
}
const hips = {};
for (const styleKey of STYLES) {
  const { chest, pelvis } = solo(styleKey), travels = styleKey === 'kizomba' || styleKey === 'semba';
  for (const k of ['roll', 'yaw', 'pitch']) assert.ok(chest[k] < LIMIT.turn, `${styleKey} alone: the chest's ${k} follows the pelvis (${chest[k].toFixed(2)}°)`);
  if (!travels) for (const k of ['side', 'fore']) assert.ok(chest[k] < LIMIT.side, `${styleKey} alone: the chest goes ${k} with the pelvis (${chest[k].toFixed(2)} cm)`);
  hips[styleKey] = pelvis;
}
assert.ok(hips.tarraxinha.yaw > 20 && hips.zouk.yaw > 15 && hips.kompa.roll > 30 && hips.suave.pitch > 5,
  `the pelvis lost its motion: ${JSON.stringify(hips)}`);
console.log(`PASS seul, sur place, six styles : le haut du buste ne roule, ne pique ni ne tourne (< ${LIMIT.turn}°), ne part ni de côté ni en avant `
  + `(< ${LIMIT.side} cm ; le « 1 2 » de la kizomba et du semba change de place) ; le bassin garde son mouvement (tarraxinha `
  + `${hips.tarraxinha.yaw.toFixed(0)}° de lacet, kompa ${hips.kompa.roll.toFixed(0)}° de roulis, suave ${hips.suave.pitch.toFixed(1)}° de tangage)`);

// 2. In pair, the game mode.
const probe = fixture(api), rest = { L: probe.model.legs.L.rest, R: probe.model.legs.R.rest };
const stance = (probe.model.legs.L.hipX - rest.L.x + rest.R.x - probe.model.legs.R.hipX) / 2;
const motions = api.guideMotions({ rest, stance, placement: 'quinconce', amp: 1 });
const FREE = new Set(['quart', 'sortieG', 'sortieF']);
/** The chest of one dancer through a session: a figure commanded at beat 0, or the basic step alone. */
function session(styleKey, kind, follower) {
  const plan = api.planGuide(kind === 'base' ? [] : [{ beat: 0, figure: kind }], motions, 40);
  const seg = kind === 'base' ? { start: 8 } : plan.segments.find(s => s.kind === kind);
  const beats = kind === 'base' ? 8 : api.segmentBeats(kind, seg.touches ?? []);
  const f = { ...fixture(api), cache: new Map() }, track = [];
  for (let i = -W; i <= beats * STEPS + W; i++) {
    const sample = api.sampleGuide(plan, seg.start + i / STEPS), t = api.compose(sample.couple, api.outerOf(follower));
    f.outer.position.set(t.x, 0, t.z); f.outer.rotation.set(0, t.yaw, 0); f.outer.updateMatrixWorld(true);
    api.applyGuidePose(f.r, f.model, sample, { placement: 'quinconce', contraposition: 1, styleKey, amp: 1, iso: true, cadre: true }, follower, f.cache);
    f.r.root.updateWorldMatrix(true, true);
    track.push(take(f, f.r.chest));
  }
  return swings(track);
}
let checked = 0;
const worst = { side: { v: 0 }, turn: { v: 0 } };
for (const styleKey of STYLES) {
  for (const kind of ['base', ...api.guideFiguresFor(styleKey).filter(k => !api.GUIDE_FIGURES[k].chain && !FREE.has(k))]) {
    for (const follower of [false, true]) {
      const s = session(styleKey, kind, follower), where = `${styleKey} ${kind} ${follower ? 'suiveuse' : 'guideur'}`;
      const turn = Math.max(s.roll, s.yaw, s.pitch);
      // Aside: the figures travel forward and back along the line, never aside.
      if (s.side > worst.side.v) worst.side = { v: s.side, where };
      if (turn > worst.turn.v) worst.turn = { v: turn, where };
      checked++;
    }
  }
}
assert.ok(worst.turn.v < LIMIT.turn, `in pair the chest rolls, pitches or turns with the pelvis: ${worst.turn.v.toFixed(2)}° (${worst.turn.where})`);
assert.ok(worst.side.v < LIMIT.side, `in pair the chest goes aside with the pelvis: ${worst.side.v.toFixed(2)} cm (${worst.side.where})`);
console.log(`PASS en couple, mode jeu, six styles, ${checked} séances (pas de base et chaque figure, deux danseurs, jonctions comprises) : `
  + `le haut du buste ne roule, ne pique ni ne tourne avec le bassin (${worst.turn.v.toFixed(2)}° au plus) et ne part pas de côté `
  + `(${worst.side.v.toFixed(2)} cm au plus) ; avant #223 : 5,6 cm de côté et 16 à 17° de tangage au pas de base. Le quart de tour (sa rotation) `
  + `et les sorties (le guideur qui tourne pour guider, le déplacement de côté) ne sont pas bornés ici`);

// 3. The trunk of before, as voted for the kompa.
api.setTrunk('elu');
const elected = solo('kompa').chest;
api.setTrunk(null);
assert.ok(elected.yaw > 3 && elected.side > 3, `?buste=elu no longer shows the kompa's trunk as voted: ${JSON.stringify(elected)}`);
console.log(`PASS ?buste=elu : le buste du kompa tel qu'élu le 23 novembre suit encore son bassin (${elected.side.toFixed(1)} cm de côté, ${elected.yaw.toFixed(1)}° de lacet)`);
