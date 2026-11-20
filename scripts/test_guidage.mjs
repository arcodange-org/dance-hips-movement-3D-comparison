// #69 — guide mode proof of concept (docs/spec-mode-guidage-poc.md): scheduling, grades, couple
// frame, continuity at the boundaries and leg-bone clearance on the real GLB.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-guidage-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'guidage', 'guidagePose', 'placePaire']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const STYLES = Object.keys(api.STYLES);
const near = (a, b, tolerance, label) => assert.ok(Math.abs(a - b) <= tolerance, `${label}: ${a} != ${b} (tol ${tolerance})`);

const probe = fixture(api);
const rest = { L: probe.model.legs.L.rest, R: probe.model.legs.R.rest };
const stance = (probe.model.legs.L.hipX - rest.L.x + rest.R.x - probe.model.legs.R.hipX) / 2;
const rig = { rest, stance, placement: 'quinconce', amp: 1 };
const motions = api.guideMotions(rig);
const I = (beat, figure, bpm = 90) => ({ beat, figure, bpm });
const kinds = plan => plan.segments.map(s => `${s.kind}@${s.start}`).join(' ');

// 1. Scheduling: boundaries, preparation, refusals, ambiguity, repeats, pending.
{
  assert.equal(kinds(api.planGuide([], motions, 30)), 'base@0', 'no lead: the basic step goes on');
  let plan = api.planGuide([I(3.5, 'ida')], motions, 30);
  assert.equal(kinds(plan), 'base@0 ida@4 base@12');
  assert.equal(plan.outcomes[0].verdict, 'accepté'); assert.equal(plan.outcomes[0].boundary, 4);
  plan = api.planGuide([I(4, 'ida')], motions, 30);
  assert.equal(kinds(plan), 'base@0 ida@4 base@12', 'a press on the beat of the boundary is taken');
  plan = api.planGuide([I(4.05, 'ida')], motions, 30);
  assert.equal(kinds(plan), 'base@0 ida@8 base@16', 'just after a boundary: the next one');
  plan = api.planGuide([I(3, 'ida'), I(4.2, 'quart'), I(7, 'quart'), I(10.5, 'sortieG')], motions, 40);
  assert.equal(kinds(plan), 'base@0 ida@4 sortieG@12 base@18');
  assert.deepEqual(plan.outcomes.map(o => o.verdict), ['accepté', 'trop tard', 'trop tôt', 'accepté']);
  plan = api.planGuide([I(1, 'ida'), I(2, 'quart')], motions, 20);
  assert.equal(kinds(plan), 'base@0', 'ambiguous lead: the follower stays in the basic step');
  assert.deepEqual(plan.outcomes.map(o => o.verdict), ['ambigu', 'ambigu']);
  plan = api.planGuide([I(1, 'quart'), I(2, 'quart')], motions, 20);
  assert.equal(kinds(plan), 'base@0 quart@4 base@8');
  assert.deepEqual(plan.outcomes.map(o => o.verdict), ['accepté', 'répété']);
  plan = api.planGuide([I(1, 'sortieF')], motions, 2);
  assert.equal(kinds(plan), 'base@0'); assert.equal(plan.outcomes[0].verdict, 'en attente');
  assert.equal(api.planGuide([I(5, 'ida')], motions, 4).outcomes.length, 0, 'a future press is ignored');
  // Base boundaries every 4 beats of the segment, also after a five-action figure (6 beats).
  plan = api.planGuide([I(3, 'sortieG'), I(19, 'ida')], motions, 40);
  assert.equal(kinds(plan), 'base@0 sortieG@4 base@10 ida@22 base@30');
  // The demonstration session of the view (GIF): every figure, every lead accepted.
  plan = api.planGuide(api.GUIDE_DEMO.map(i => ({ ...i, bpm: 90 })), motions, 40);
  assert.equal(kinds(plan), 'base@0 ida@4 sortieG@12 base@18 quart@22 sortieF@26 base@32');
  assert.ok(plan.outcomes.every(o => o.verdict === 'accepté'));
}
console.log('PASS ordonnancement : frontières, préparation, trop tôt / trop tard, ambiguïté, répétition, attente');

// 1b. Keys by physical position: QWERTY W A Q D = AZERTY Z Q A D; labels follow the layout.
// #89: arrows held adapt the ida (→ right leg, ↓ backwards first); ↑ and ↓ alone lead the walks.
{
  assert.deepEqual(['KeyW', 'KeyA', 'KeyQ', 'KeyD', 'KeyZ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', ''].map(c => api.figureOfCode(c)),
    ['ida', 'sortieF', 'quart', 'sortieG', null, 'avance', 'recule', null, null]);
  assert.deepEqual([{ right: true }, { down: true }, { down: true, right: true }].map(h => api.figureOfCode('KeyW', h)), ['idaD', 'idaArr', 'idaArrD']);
  assert.equal(api.figureOfCode('KeyD', { right: true }), 'sortieG');
  const azerty = new Map([['KeyW', 'z'], ['KeyA', 'q'], ['KeyQ', 'a'], ['KeyD', 'd']]);
  const letters = ['ida', 'quart', 'sortieG', 'sortieF'];
  assert.deepEqual(letters.map(f => api.keyLabel(f, azerty)), ['Z', 'A', 'D', 'Q']);
  assert.deepEqual(letters.map(f => api.keyLabel(f, null)), ['W', 'Q', 'D', 'A']);
  assert.deepEqual(['idaD', 'idaArr', 'idaArrD', 'avance', 'recule', 'double'].map(f => api.keyLabel(f, azerty)), ['→ + Z', '↓ + Z', '↓ → + Z', '↑', '↓', '↑ ↑']);
  // ↑ ↑ within half a beat: one intention, the double; ↓ then the ida's key: the backwards ida.
  const s = new api.GuideSession();
  s.press(1, 'avance', 90); s.press(1.4, 'avance', 90);
  s.press(5, 'avance', 90); s.press(5.6, 'avance', 90);
  s.press(9, 'recule', 90); s.press(9.3, 'idaArrD', 90);
  assert.deepEqual(s.intentions.map(i => [i.beat, i.figure]), [[1, 'double'], [5, 'avance'], [5.6, 'avance'], [9.3, 'idaArrD']]);
  // Kompa, tarraxinha and zouk offer the walks only; kizomba everything.
  for (const k of ['kompa', 'tarraxinha', 'zouk']) assert.deepEqual(api.guideFiguresFor(k), ['avance', 'recule', 'double']);
  assert.deepEqual(api.guideFiguresFor('kizomba'), api.GUIDE_FIGURE_KEYS);
}
console.log('PASS touches par position physique (QWERTY W A Q D = AZERTY Z Q A D), lettres selon la disposition ; flèches : marche, variantes de l\'ida, double');

// 2. Grades and streak.
{
  const beatMs = bpm => 60000 / bpm;
  for (const bpm of [72, 90, 120]) {
    const b = beatMs(bpm);
    const at = ms => 8 + ms / b;
    assert.equal(api.gradeOf(at(0), bpm).grade, 'Parfait');
    assert.equal(api.gradeOf(at(-Math.min(50, .08 * b) + 1), bpm).grade, 'Parfait');
    assert.equal(api.gradeOf(at(Math.min(100, .15 * b) - 1), bpm).grade, 'Bien');
    assert.equal(api.gradeOf(at(-Math.min(160, .25 * b) + 1), bpm).grade, 'Juste');
    assert.equal(api.gradeOf(at(Math.min(160, .25 * b) + 1), bpm).grade, 'Raté');
    near(api.gradeOf(at(-30), bpm).errorMs, -30, 1e-6, 'signed error');
  }
  const plan = api.planGuide([I(3, 'ida'), I(10, 'quart'), I(15.5, 'ida'), I(17.02, 'sortieF')], motions, 40);
  // Received on time: +1 (Parfait, Bien); a miss halves; a refused lead (too early) does not count.
  assert.deepEqual(plan.outcomes.map(o => o.streak), [1, 2, 1, 1]);
  assert.deepEqual(api.planGuide([I(1, 'ida'), I(2, 'ida'), I(3, 'ida')], motions, 20).outcomes.map(o => o.streak), [1, 1, 1], 'repeats do not count');
}
console.log('PASS notes Parfait / Bien / Juste / Raté (72, 90, 120 bpm) ; série : guidages reçus à temps, divisée par deux sur un raté');

// 3. Replay: direct access equals sequential access (live session), and is deterministic.
{
  const intentions = [I(2.9, 'ida'), I(10.1, 'quart'), I(13.2, 'quart'), I(17, 'sortieF'), I(21.9, 'sortieG'), I(26, 'ida')];
  const session = new api.GuideSession(); session.bind(rig);
  const direct = api.planGuide(intentions, motions, 60);
  let pressed = 0;
  for (let beat = 0; beat < 60; beat += 0.0625) {
    // Presses arrive live (they invalidate the cache); between them the cached plan is reused.
    while (pressed < intentions.length && intentions[pressed].beat <= beat) { const i = intentions[pressed++]; session.press(i.beat, i.figure, i.bpm); }
    const live = session.sample(beat), fixed = api.sampleGuide(direct, beat);
    assert.equal(live.kind, fixed.kind, `kind at ${beat}`); near(live.localBeat, fixed.localBeat, 1e-9, `local beat at ${beat}`);
    for (const k of ['yaw', 'x', 'z']) near(live.couple[k], fixed.couple[k], 1e-12, `couple ${k} at ${beat}`);
  }
  assert.deepEqual(api.planGuide(intentions, motions, 60), direct);
}
console.log('PASS rejeu : accès direct = accès séquentiel, résultat déterministe');

// 4. Couple frame and continuity at every boundary (samplers in the couple frame).
const twoSegments = (a, b) => ({ segments: [
  { kind: a, start: 0, end: api.endBeatOf(a), couple: api.IDENTITY, residual: { leader: { x: 0, z: 0 }, follower: { x: 0, z: 0 } }, previous: null },
  { kind: b, start: api.endBeatOf(a), end: Infinity, couple: motions[a].couple, residual: motions[a].residual, previous: a },
], outcomes: [] });
const worldOf = (couple, follower, p) => api.applyTransform(api.compose(couple, api.outerOf(follower)), p);
{
  assert.deepEqual(motions.ida.couple, { yaw: 0, x: 0, z: 0 });
  near(motions.quart.couple.yaw, Math.PI / 2, 1e-9, 'quarter turn');
  const every = ['base', ...api.GUIDE_FIGURE_KEYS];
  let pairs = 0;
  for (const a of every) for (const b of every) {
    const endA = api.endBeatOf(a);
    const plan = twoSegments(a, b);
    for (const follower of [false, true]) {
      const role = follower ? 'follower' : 'leader';
      const before = api.sampleGuide(plan, endA - 1e-9), after = api.sampleGuide(plan, endA);
      const sb = api.sampleKind(a, before.localBeat, follower, rig), sa = api.sampleKind(b, after.localBeat, follower, rig);
      for (const side of ['L', 'R']) {
        const p = worldOf(before.couple, follower, sb.feet[side]), q = worldOf(after.couple, follower, sa.feet[side]);
        assert.ok(Math.hypot(p.x - q.x, p.z - q.z) < 1e-3, `${a}→${b} ${role} foot ${side} jumps ${Math.hypot(p.x - q.x, p.z - q.z)}`);
      }
      const rootOf = (s, sample) => ({ x: s.root.x + sample.rootOffset[role].x, z: s.root.z + sample.rootOffset[role].z });
      const p = worldOf(before.couple, follower, rootOf(sb, before)), q = worldOf(after.couple, follower, rootOf(sa, after));
      assert.ok(Math.hypot(p.x - q.x, p.z - q.z) < 1e-3, `${a}→${b} ${role} pelvis jumps ${Math.hypot(p.x - q.x, p.z - q.z)}`);
      const settled = api.sampleGuide(plan, endA + api.GUIDE.inertia);
      assert.deepEqual([settled.rootOffset[role].x, settled.rootOffset[role].z].map(v => Math.abs(v) < 1e-12), [true, true]);
    }
    pairs++;
  }
  near(Math.hypot(motions.sortieG.residual.follower.x, motions.sortieG.residual.follower.z), 0.015, 1e-3, 'sortie garçon residual');
  console.log(`PASS repère du couple et continuité aux ${pairs} enchaînements (pieds et bassins < 1 mm, résidu effacé en ${api.GUIDE.inertia} temps)`);
}

const place = (f, follower, frame) => {
  const t = api.compose(frame, api.outerOf(follower));
  f.outer.position.set(t.x, 0, t.z); f.outer.rotation.set(0, t.yaw, 0); f.outer.updateMatrixWorld(true);
};
/** Largest joint displacement across a boundary over 1e-6 beat (the motion itself is ≪ 0.01 mm). */
const GUIDE_JUMP = 0.0002;

// 4b. GLB: the whole skeleton is continuous at every boundary (pelvis pose inertialized before the IK).
{
  const joints = ['pelvis', 'hipL', 'hipR', 'kneeL', 'kneeR', 'footL', 'footR', 'chest', 'head'];
  const every = ['base', ...api.GUIDE_FIGURE_KEYS];
  let worst = { jump: 0 };
  for (const styleKey of STYLES) for (const a of every) for (const b of every) {
    const plan = twoSegments(a, b), endA = api.endBeatOf(a);
    for (const follower of [false, true]) {
      const f = { ...fixture(api), cache: new Map() };
      const at = beat => {
        const s = api.sampleGuide(plan, beat); place(f, follower, s.couple);
        api.applyGuidePose(f.r, f.model, s, { styleKey, amp: 1, placement: 'quinconce', contraposition: 1 }, follower, f.cache);
        f.r.root.updateWorldMatrix(true, true);
        return joints.map(n => f.r[n].getWorldPosition(new THREE.Vector3()));
      };
      const before = at(endA - 1e-6), after = at(endA);
      before.forEach((p, k) => { const jump = p.distanceTo(after[k]); if (jump > worst.jump) worst = { jump, styleKey, a, b, follower, joint: joints[k] }; });
    }
  }
  assert.ok(worst.jump < GUIDE_JUMP, `joint jump at a boundary ${JSON.stringify(worst)}`);
  console.log(`PASS squelette continu aux frontières (six styles, 25 enchaînements) : saut max ${(worst.jump * 1000).toFixed(3)} mm sur 1e-6 temps (${worst.styleKey} ${worst.a}→${worst.b}, ${worst.joint}) < ${GUIDE_JUMP * 1000} mm`);
}

// #85 (owner: « dans le mode jeu la position de base doit être le suave (sauf en konpa) »): the basic
// step in suave, the figures in the chosen style; kompa (and tarraxinha, zouk, handled like it) keep theirs.
{
  for (const k of ['kizomba', 'semba', 'suave']) { assert.equal(api.guideStyleOf('base', k), 'suave'); assert.equal(api.guideStyleOf('ida', k), k); }
  for (const k of ['kompa', 'tarraxinha', 'zouk']) assert.equal(api.guideStyleOf('base', k), k);
  console.log('PASS pas de base du mode jeu en suave (figures dans le style choisi ; kompa, tarraxinha, zouk gardent le leur), styles mélangés sur le temps d’inertie');
}

// 5. GLB: the basic step and seeded random sessions, both dancers in the couple frame.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
const couple = () => [fixture(api), fixture(api)].map(f => ({ ...f, cache: new Map() }));
const pose = (pair, sample, extra) => pair.forEach((f, i) => {
  place(f, i === 1, sample.couple);
  api.applyGuidePose(f.r, f.model, sample, { placement: 'quinconce', contraposition: 1, ...extra }, i === 1, f.cache);
  f.r.root.updateWorldMatrix(true, true);
});
const clearance = (pair, label) => {
  const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
  for (const a of boneNames) for (const b of boneNames) {
    const collision = meshIntersection(meshes[0][a], meshes[1][b]);
    assert(!collision, JSON.stringify({ ...label, leader: a, partner: b, collision }));
  }
  for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
    for (const b of boneNames.filter(n => n.endsWith('_R'))) {
      const collision = meshIntersection(own[a], own[b]);
      assert(!collision, JSON.stringify({ ...label, role, left: a, right: b, collision }));
    }
  for (const f of pair) assert.ok(minimumBoneY(f.r) >= -1e-4, `bones under the floor ${JSON.stringify(label)}`);
};
let poses = 0;
{
  const plan = api.planGuide([], motions, 8);
  for (const styleKey of STYLES) for (const amp of [.5, 1, 2]) {
    const pair = couple();
    const ampMotions = api.guideMotions({ ...rig, amp });
    const ampPlan = api.planGuide([], ampMotions, 8);
    let first = null;
    for (let beat = 0; beat < 4; beat += .125) {
      pose(pair, api.sampleGuide(ampPlan, beat), { styleKey, amp });
      const feet = pair.flatMap(f => ['L', 'R'].map(s => f.r['foot' + s].getWorldPosition(new THREE.Vector3())));
      if (!first) first = feet;
      feet.forEach((p, k) => assert.ok(p.distanceTo(first[k]) < 1e-6, `basic step: feet still (${styleKey}, amp ${amp}, beat ${beat})`));
      clearance(pair, { styleKey, amp, beat, segment: 'base' }); poses++;
    }
  }
  assert.ok(plan.segments.length === 1);
}
console.log('PASS pas de base en paire : pieds immobiles, aucun croisement d’os, os au-dessus du sol (six styles, amplitudes 0,5 à 2)');
{
  // Seeded sessions: every boundary of every figure, the inertialized pelvis after the sortie garçon.
  let seed = 69;
  const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (const styleKey of STYLES) {
    const intentions = [];
    // #62: each style draws from the figures it offers (kompa: the ida e volta only).
    const offered = api.guideFiguresFor(styleKey);
    if (!offered.length) continue; // basic step only (tested above)
    for (let beat = 2.9; beat < 60; beat += 4) intentions.push(I(beat + random() * .9, offered[Math.floor(random() * offered.length)]));
    if (offered.includes('sortieG')) intentions.push(I(2.5, 'sortieG'));
    const plan = api.planGuide(intentions, motions, 70);
    const boundaries = plan.segments.slice(1).map(s => s.start);
    assert.ok(new Set(plan.segments.map(s => s.kind)).size >= Math.min(4, offered.length + 1), `${styleKey}: varied session ${kinds(plan)}`);
    const pair = couple();
    for (const boundary of boundaries) for (let beat = boundary - .5; beat <= boundary + api.GUIDE.inertia + .25; beat += .125) {
      pose(pair, api.sampleGuide(plan, beat), { styleKey, amp: 1 });
      clearance(pair, { styleKey, beat, around: boundary }); poses++;
    }
  }
}
console.log('PASS', poses, 'poses du mode guidage : aucun croisement des os des jambes autour des frontières (six styles)');
