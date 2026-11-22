// #167 — sudden moves of the pelvis in the game mode (docs/spec-transfert-continu.md), on the real GLB.
// Rule R34 (22 Nov. 2026), the one put first: no jolt, no teleporting, no sudden relay between left and
// right. Two measures, taken in sessions of the game itself (planGuide, applyGuidePose: what the game
// shows, boundaries included):
//  - the largest move of the pelvis within an eighth of a beat (83 ms at 90 bpm), up or down and in the
//    horizontal plane, for every figure the game offers and both dancers;
//  - the passage from one side to the other in the walk, against a pendulum of the same width and period
//    (`soudain`: 1 = as gradual as a pendulum, 2 = twice as sudden).
// Today's values are known gaps: they are reported, not failed. A figure that does worse than its recorded
// value fails (ratchet, scripts/fixtures/saccades.json; WRITE=1 records the current values after a
// deliberate change).
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-saccades-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'guidage', 'guidagePose', 'placePaire', 'insertion']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

const STYLE = 'kizomba', STEPS = 32, WINDOW = STEPS / 8, ROLES = ['leader', 'suiveur'];
const probe = fixture(api), rest = { L: probe.model.legs.L.rest, R: probe.model.legs.R.rest };
const stance = (probe.model.legs.L.hipX - rest.L.x + rest.R.x - probe.model.legs.R.hipX) / 2;
const motions = api.guideMotions({ rest, stance, placement: 'quinconce', amp: 1 });
const dancers = () => ROLES.map(() => ({ ...fixture(api), cache: new Map() }));
/** The game's pose of one dancer at a beat of a session (couple frame, default ginga). */
const pose = (f, follower, plan, beat) => {
  const sample = api.sampleGuide(plan, beat), t = api.compose(sample.couple, api.outerOf(follower));
  f.outer.position.set(t.x, 0, t.z); f.outer.rotation.set(0, t.yaw, 0); f.outer.updateMatrixWorld(true);
  api.applyGuidePose(f.r, f.model, sample, { placement: 'quinconce', contraposition: 1, styleKey: STYLE, amp: 1 }, follower, f.cache);
  f.r.root.updateWorldMatrix(true, true);
};
const round = (v, digits = 1) => Math.round(v * 10 ** digits) / 10 ** digits;

// 1. Largest move of the pelvis within an eighth of a beat, figure by figure: the figure commanded from the
// basic step, measured from half a beat before it to the end of the inertia that follows it.
const measured = { figures: {}, soudain: {} };
const KINDS = ['base', ...api.guideFiguresFor(STYLE).filter(kind => !api.GUIDE_FIGURES[kind].chain)];
for (const kind of KINDS) {
  const plan = api.planGuide(kind === 'base' ? [] : [{ beat: 0, figure: kind }], motions, 40);
  const segment = kind === 'base' ? { start: 4 } : plan.segments.find(s => s.kind === kind);
  assert(segment, `${kind}: danced when commanded (${plan.segments.map(s => s.kind).join(' ')})`);
  const beats = kind === 'base' ? 4 : api.GUIDE_FIGURES[kind].beats, from = segment.start - 0.5, to = segment.start + beats + api.GUIDE.inertia;
  const pair = dancers(), tracks = ROLES.map(() => []);
  for (let i = 0; i <= (to - from) * STEPS; i++) pair.forEach((f, k) => { pose(f, k === 1, plan, from + i / STEPS); tracks[k].push(f.r.pelvis.getWorldPosition(new THREE.Vector3())); });
  measured.figures[kind] = Object.fromEntries(ROLES.map((role, k) => {
    const p = tracks[k], worst = { vertical: { cm: 0, temps: 0 }, horizontal: { cm: 0, temps: 0 } };
    for (let i = 0; i + WINDOW < p.length; i++) {
      const a = p[i], b = p[i + WINDOW], local = round(from + i / STEPS - segment.start, 2);
      const moves = { vertical: Math.abs(b.y - a.y) * 100, horizontal: Math.hypot(b.x - a.x, b.z - a.z) * 100 };
      for (const axis of ['vertical', 'horizontal']) if (moves[axis] > worst[axis].cm) worst[axis] = { cm: moves[axis], temps: local };
    }
    for (const axis of ['vertical', 'horizontal']) worst[axis].cm = round(worst[axis].cm);
    return [role, worst];
  }));
}

// 2. The passage from one side to the other in the walk: the walk commanded five times in a row, the third
// one measured (established regime). Lateral position of the pelvis in the dancer's own frame, the figure's
// travel removed; one side-to-side cycle every two beats.
{
  const kind = 'avance', beats = api.GUIDE_FIGURES[kind].beats, PERIOD = 2;
  const plan = api.planGuide([0, 0.1, 0.2, 0.3, 0.4].map(beat => ({ beat, figure: kind })), motions, 16 + 5 * beats);
  const repeats = plan.segments.filter(s => s.kind === kind);
  assert.equal(repeats.length, 5, `the walk danced five times in a row (${plan.segments.map(s => s.kind).join(' ')})`);
  const pair = dancers();
  ROLES.forEach((role, k) => {
    const lateral = [];
    for (let i = 0; i < beats * STEPS; i++) {
      pose(pair[k], k === 1, plan, repeats[2].start + i / STEPS);
      const r = pair[k].r, p = r.pelvis.getWorldPosition(new THREE.Vector3()).applyMatrix4(r.root.parent.matrixWorld.clone().invert());
      lateral.push((p.x - r.root.position.x) * 100);
    }
    const width = Math.max(...lateral) - Math.min(...lateral);
    const peak = Math.max(...lateral.map((x, i) => Math.abs(lateral[(i + 1) % lateral.length] - x) * STEPS));
    measured.soudain[role] = { largeur: round(width), soudain: round(peak / (Math.PI * width / PERIOD), 2) };
  });
}

const path = new URL('./fixtures/saccades.json', import.meta.url);
if (process.env.WRITE) { writeFileSync(path, JSON.stringify(measured, null, 2) + '\n'); console.log('written', path.pathname); }
const recorded = JSON.parse(readFileSync(path, 'utf8'));
// Ratchet: never worse than recorded (3 mm, 0.1 of a pendulum, of numerical slack).
const SLACK = { cm: 0.3, soudain: 0.1 };
let better = 0;
console.log(`À-coups du bassin dans le mode jeu (${STYLE}, ginga par défaut) : plus grand déplacement en un huitième de temps, et le temps de la figure où il commence`);
for (const [kind, roles] of Object.entries(measured.figures)) {
  const r = recorded.figures[kind];
  assert(r, `${kind}: recorded in scripts/fixtures/saccades.json (WRITE=1)`);
  const cells = ROLES.map(role => {
    for (const axis of ['vertical', 'horizontal']) {
      const now = roles[role][axis].cm, before = r[role][axis].cm;
      assert(now <= before + SLACK.cm, `${kind}, ${role}: the pelvis moves ${now} cm (${axis}) within an eighth of a beat at ${roles[role][axis].temps}, worse than recorded (${before} cm)`);
      if (now < before - SLACK.cm) better++;
    }
    return `${role} ${String(roles[role].vertical.cm).padStart(4)} cm en hauteur (temps ${roles[role].vertical.temps}), ${String(roles[role].horizontal.cm).padStart(4)} cm à l'horizontale (temps ${roles[role].horizontal.temps})`;
  });
  const label = kind === 'base' ? 'Pas de base' : api.GUIDE_FIGURES[kind].label;
  console.log(`  ${label.padEnd(37)} ${cells.join(' ; ')}`);
}
for (const role of ROLES) {
  const now = measured.soudain[role].soudain, before = recorded.soudain[role].soudain;
  assert(now <= before + SLACK.soudain, `walk, ${role}: the pelvis passes from one side to the other ${now} times more suddenly than a pendulum, worse than recorded (${before})`);
  if (now < before - SLACK.soudain) better++;
}
console.log(`  Passage d'un côté à l'autre dans la marche, rapporté à un balancier (1) : ${ROLES.map(role => `${role} ${measured.soudain[role].soudain} (bassin large de ${measured.soudain[role].largeur} cm)`).join(' ; ')}`);
if (better) console.log(`  ${better} mesure(s) meilleure(s) qu'enregistré : WRITE=1 pour enregistrer le progrès`);
console.log('PASS à-coups du bassin et passage d’un côté à l’autre : mesurés, affichés, jamais pires qu’enregistré');
