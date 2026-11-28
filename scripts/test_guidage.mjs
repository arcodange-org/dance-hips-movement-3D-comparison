// #69, #140 — game mode (docs/spec-mode-guidage-poc.md, docs/spec-jeu-file-auto.md): command queue,
// automatic dance, couple frame, continuity at the boundaries and leg-bone clearance on the real GLB.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-guidage-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'guidage', 'guidagePose', 'placePaire', 'insertion']
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
const I = (beat, figure) => ({ beat, figure });
// A segment as text: its figure, the positions of its touches (#144; `v`: as a virgula), its start.
const kinds = plan => plan.segments.map(s => `${s.kind}${(s.touches ?? []).map(t => `+${t.at}${t.virgula ? 'v' : ''}`).join('')}@${s.start}`).join(' ');
const fates = plan => plan.outcomes.map(o => [o.status, o.start]);
/** Seeded generator of the tests (the automatic dance has its own draw, api.guideDraw). */
const lcg = seed => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

// 1. #140 — command queue (owner: « ne pas avoir le défi d'être synchronisé et de voir mes mouvements
// "rater". Simplement ce que je "commande" s'empiler dans une queue de mouvements »).
{
  assert.equal(kinds(api.planGuide([], motions, 30)), 'base@0', 'no command: the basic step goes on');
  let plan = api.planGuide([I(3.5, 'ida')], motions, 30);
  assert.equal(kinds(plan), 'base@0 ida@4 base@12');
  assert.deepEqual(fates(plan), [['dansée', 4]]);
  // No timing: pressed at any moment, the figure starts at the next neutral position.
  for (const beat of [0, 0.2, 1, 2.6, 4]) assert.equal(kinds(api.planGuide([I(beat, 'ida')], motions, 30)), 'base@0 ida@4 base@12', `pressed at ${beat}`);
  assert.equal(kinds(api.planGuide([I(4.05, 'ida')], motions, 30)), 'base@0 ida@8 base@16', 'just after a boundary: the next one');
  // A burst of commands: all danced, in the order pressed (nothing refused, nothing lost).
  plan = api.planGuide([I(1, 'ida'), I(1.5, 'quart'), I(2, 'sortieG'), I(2.2, 'quart')], motions, 40);
  // #211: the quarter turn lasts two beats.
  assert.equal(kinds(plan), 'base@0 ida@4 quart@12 sortieG@14 quart@20 base@22');
  assert.deepEqual(fates(plan), [['dansée', 4], ['dansée', 12], ['dansée', 14], ['dansée', 20]]);
  assert.deepEqual(plan.segments.map(s => s.by), [undefined, 'commande', 'commande', 'commande', 'commande', undefined]);
  // The same figure twice is danced twice; a command pressed during a figure waits for its end.
  assert.equal(kinds(api.planGuide([I(1, 'quart'), I(2, 'quart')], motions, 20)), 'base@0 quart@4 quart@6 base@8');
  assert.equal(kinds(api.planGuide([I(3, 'ida'), I(5, 'quart'), I(6, 'sortieG')], motions, 40)), 'base@0 ida@4 quart@12 sortieG@14 base@20');
  // The queue as the view shows it: the figure under way, the next one with its start, the others behind.
  plan = api.planGuide([I(3, 'ida'), I(5, 'quart'), I(6, 'sortieG')], motions, 9);
  assert.equal(kinds(plan), 'base@0 ida@4');
  assert.deepEqual(fates(plan), [['en cours', 4], ['en file', 12], ['en file', null]]);
  assert.deepEqual(plan.queue, ['quart', 'sortieG']);
  plan = api.planGuide([I(1, 'sortieF')], motions, 2);
  assert.equal(kinds(plan), 'base@0'); assert.deepEqual(fates(plan), [['en file', 4]]); assert.deepEqual(plan.queue, ['sortieF']);
  assert.equal(api.planGuide([I(5, 'ida')], motions, 4).outcomes.length, 0, 'a future press is ignored');
  // Base boundaries every 4 beats of the segment, also after a five-action figure (6 beats).
  assert.equal(kinds(api.planGuide([I(3, 'sortieG'), I(19, 'ida')], motions, 40)), 'base@0 sortieG@4 base@10 ida@22 base@30');
  // Seeded bursts: every command is danced (or changes the sortie under way), in the order pressed.
  const figures = ['ida', 'idaD', 'idaArr', 'idaArrD', 'quart', 'sortieG', 'sortieF', 'avance', 'recule', 'double'];
  let commands = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const random = lcg(seed), list = [];
    for (let beat = random() * 4; list.length < 25; beat += random() * random() * 9) list.push(I(beat, figures[Math.floor(random() * figures.length)]));
    plan = api.planGuide(list, motions, 400);
    assert.equal(plan.queue.length, 0, `seed ${seed}: the queue empties`);
    assert.ok(plan.outcomes.every(o => ['dansée', 'insérée', 'enchaînée'].includes(o.status)), `seed ${seed}: ${JSON.stringify(fates(plan))}`);
    const danced = plan.outcomes.filter(o => o.status === 'dansée');
    assert.deepEqual(plan.segments.filter(s => s.by === 'commande').map(s => s.start), danced.map(o => o.start), `seed ${seed}: one segment per command, in order`);
    danced.forEach((o, k) => assert.ok(k === 0 || o.start > danced[k - 1].start, `seed ${seed}: order kept`));
    commands += list.length;
  }
  // The demonstration sessions of the view (GIFs) keep their segments.
  assert.equal(kinds(api.planGuide(api.GUIDE_DEMO, motions, 40)), 'base@0 ida@4 sortieG@12 base@18 quart@22 sortieF@24 base@30');
  assert.equal(kinds(api.planGuide(api.GUIDE_DEMO_ARROWS, motions, 40)), 'base@0 avance@4 double@6 recule@8 base@10 idaArrD@14 base@22');
  assert.equal(kinds(api.planGuide(api.GUIDE_DEMO_CHAIN, motions, 40)), 'base@0 sortieFG@4 base@13');
  assert.equal(kinds(api.planGuide(api.GUIDE_DEMO_INSERT, motions, 40)), 'base@0 sortieG+2@4 sortieF+2@12 base@20');
  // #144: the owner's two examples (G1 of the sortie garçon, as a virgula; D4 of the sortie fille).
  assert.equal(kinds(api.planGuide(api.GUIDE_DEMO_TOUCH, motions, 40)), 'base@0 sortieG+0v@4 sortieF+3@12 base@20');
  console.log(`PASS file de commandes : aucune commande refusée ni perdue, ordre des appuis conservé (${commands} commandes tirées), file affichée, quatre démonstrations inchangées`);
}
// 1c. #90: ↑ during the sortie fille, from its start to its position 3, chains it into the end of the sortie
// garçon (one segment, which changes kind without changing its start). Pressed before the sortie starts,
// or from position 3 on, ↑ is an ordinary command of the queue.
{
  let plan = api.planGuide([I(3.9, 'sortieF'), I(6, 'avance')], motions, 30);
  assert.equal(kinds(plan), 'base@0 sortieFG@4 base@13');
  assert.deepEqual(fates(plan), [['dansée', 4], ['enchaînée', 7]]);
  plan = api.planGuide([I(3.9, 'sortieF'), I(6, 'avance')], motions, 6.5);
  assert.equal(kinds(plan), 'base@0 sortieFG@4', 'chained as soon as pressed (replay)');
  assert.deepEqual(fates(plan), [['en cours', 4], ['enchaînée', 7]]);
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(4.5, 'avance')], motions, 30)), 'base@0 sortieFG@4 base@13', 'from the start of the sortie fille');
  for (const beat of [7, 8.5]) assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(beat, 'avance')], motions, 30)), 'base@0 sortieF@4 avance@10 base@12', `↑ at ${beat}: the walk after the sortie`);
  assert.equal(kinds(api.planGuide([I(1, 'sortieF'), I(2, 'avance')], motions, 30)), 'base@0 sortieF@4 avance@10 base@12', 'pressed before the sortie starts: queued');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(5, 'avance'), I(6, 'avance')], motions, 30)), 'base@0 sortieFG@4 avance@13 base@15', 'one change per sortie');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieG'), I(5, 'avance')], motions, 30)), 'base@0 sortieG@4 avance@10 base@12', 'the sortie garçon is not chained');
  const without = api.GUIDE_FIGURE_KEYS.filter(f => f !== 'sortieFG');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(5, 'avance')], motions, 30, { offered: without })), 'base@0 sortieF@4 avance@10 base@12', 'chain not offered');
  assert.equal(api.figureOptions('sortieFG').sortieChain, true);
  assert.equal(api.figureOptions('sortieF').sortieChain, false);
}
console.log('PASS enchaînement : ↑ pendant la sortie fille (du début à la position 3) → fin de la sortie garçon ; sinon commande ordinaire');
// 1d. #91, #144 (owner: « chaque pied qui avance ou qui recule peut devenir un "ida e volta" (un simple
// aller retour du pied, en virgula ou non) »): the ida's key (any variant) turns the next possible step of
// the dance into a touch: in the figure under way, else in the figure waiting first; with neither, it is
// the 8-beat ida e volta. The segment keeps its kind and its start, and lasts 2 beats more per touch.
{
  const V = (beat, figure) => ({ beat, figure, virgula: true });
  let plan = api.planGuide([I(3.9, 'sortieG'), I(5.5, 'ida')], motions, 30);
  assert.equal(kinds(plan), 'base@0 sortieG+2@4 base@12');
  assert.deepEqual(fates(plan), [['dansée', 4], ['insérée', 6]]);
  assert.deepEqual(plan.segments[1].touches, [api.TOUCH_POSITIONS.sortieG.find(t => t.at === 2)], 'the touch of #91: his G forward, her D opened');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(5.2, 'idaArr')], motions, 30)), 'base@0 sortieF+2@4 base@12', 'any ida variant; the direction is the step\'s');
  // The next possible step: pressed during the first action, the second step (D2) becomes the touch.
  plan = api.planGuide([I(3.9, 'sortieG'), I(4.1, 'ida')], motions, 30);
  assert.equal(kinds(plan), 'base@0 sortieG+1@4 base@12'); assert.deepEqual(fates(plan)[1], ['insérée', 5]);
  // On the beat of a position, the press comes too late for it: the next one.
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieG'), I(5, 'ida')], motions, 30)), 'base@0 sortieG+2@4 base@12');
  // Every possible step of a figure: each touch adds 2 beats, and shifts the next positions.
  plan = api.planGuide([I(3.9, 'sortieF'), I(5, 'ida'), I(7, 'ida'), I(9.5, 'ida')], motions, 40);
  assert.equal(kinds(plan), 'base@0 sortieF+2+3+4@4 base@16');
  assert.deepEqual(fates(plan), [['dansée', 4], ['insérée', 6], ['insérée', 9], ['insérée', 12]]);
  // No possible step left in the figure, nothing waiting: the 8-beat ida e volta, queued.
  for (const beat of [6, 6.5]) assert.equal(kinds(api.planGuide([I(3.9, 'sortieG'), I(beat, 'ida')], motions, 30)), 'base@0 sortieG@4 ida@10 base@18', `ida at ${beat}: after the sortie`);
  assert.equal(kinds(api.planGuide([I(1, 'ida'), I(2, 'ida')], motions, 30)), 'base@0 ida@4 ida@12 base@20', 'the ida e volta has no step to touch');
  // A figure waiting first in the queue: its first step (owner: « une sortie garçon (G1) peut être
  // remplacée par une ida volta et reprendre ensuite »), then the next ones.
  plan = api.planGuide([I(1, 'sortieG'), I(2, 'ida')], motions, 30);
  assert.equal(kinds(plan), 'base@0 sortieG+0@4 base@12'); assert.deepEqual(fates(plan), [['dansée', 4], ['insérée', 4]]);
  plan = api.planGuide([I(1, 'sortieG'), I(2, 'ida')], motions, 3);
  assert.deepEqual([plan.queue, plan.queueTouches, fates(plan)], [['sortieG'], [1], [['en file', 4], ['insérée', null]]], 'shown in the queue while it waits');
  assert.equal(kinds(api.planGuide([I(1, 'sortieG'), I(2, 'ida'), I(2.5, 'ida')], motions, 30)), 'base@0 sortieG+0+1@4 base@14');
  assert.equal(kinds(api.planGuide([I(1, 'quart'), I(2, 'ida')], motions, 30)), 'base@0 quart+0@4 base@8', '« ida e volta + quart de tour ensuite »');
  assert.equal(kinds(api.planGuide([I(1, 'double'), I(2, 'ida'), I(2.2, 'ida')], motions, 30)), 'base@0 double+0@4 ida@8 base@16', 'no step left in the waiting figure: queued');
  assert.equal(kinds(api.planGuide([I(1, 'avance'), I(1.5, 'recule'), I(2, 'ida')], motions, 30)), 'base@0 avance+0@4 recule@8 base@10', 'the figure waiting first');
  // The walks: both steps.
  assert.equal(kinds(api.planGuide([I(3.9, 'recule'), I(4.5, 'ida')], motions, 30)), 'base@0 recule+1@4 base@8');
  // A sortie fille can be both touched and chained (#90); a touch from its position 3 on continues it.
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(5, 'ida'), I(6.5, 'avance')], motions, 30)), 'base@0 sortieFG+2@4 base@15', 'chained at its position 3, two beats later');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(4.5, 'avance'), I(5, 'ida')], motions, 40)), 'base@0 sortieFG+2@4 base@15');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(6.5, 'ida'), I(6.8, 'avance')], motions, 40)), 'base@0 sortieF+3@4 avance@12 base@14', 'D4 touched: the sortie fille goes on, ↑ is queued');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieF'), I(4.5, 'quart'), I(5, 'ida')], motions, 30)), 'base@0 sortieF+2@4 quart@12 base@14', 'the other commands keep their place');
  // The virgula (a key held with the ida's): where the leader's G goes forward from the neutral stance.
  assert.equal(kinds(api.planGuide([I(1, 'sortieG'), V(2, 'ida')], motions, 30)), 'base@0 sortieG+0v@4 base@12');
  assert.equal(kinds(api.planGuide([I(3.9, 'sortieG'), V(5.5, 'ida')], motions, 30)), 'base@0 sortieG+2@4 base@12', 'not offered at this step: a plain touch');
  assert.equal(kinds(api.planGuide([I(1, 'recule'), V(2, 'ida')], motions, 30)), 'base@0 recule+0@4 base@8', 'backwards: no virgula');
  // A style that does not offer the ida e volta has no touch.
  assert.equal(kinds(api.planGuide([I(3.9, 'avance'), I(4.5, 'ida')], motions, 30, { offered: api.guideFiguresFor('kompa') })), 'base@0 avance@4 ida@6 base@14', 'the planner trusts the view to filter the keys');
  // Every offered position is a step of the leader that goes forward or backward, in order.
  for (const [kind, touches] of Object.entries(api.TOUCH_POSITIONS)) {
    assert.ok(touches.every((t, k) => k === 0 || t.at > touches[k - 1].at), `${kind}: positions in order`);
    for (const t of touches) {
      const end = api.GUIDE_FIGURES[kind].end;
      let moved = 0;
      for (let b = t.at; b <= Math.min(end, t.at + 1.2); b += .05) moved = Math.max(moved, Math.abs(api.sampleKind(kind, b, false, rig).feet[t.side].z - api.sampleKind(kind, t.at, false, rig).feet[t.side].z));
      const after = api.sampleKind(kind, Math.min(end, t.at + 1.2), false, rig).feet[t.side].z - api.sampleKind(kind, t.at, false, rig).feet[t.side].z;
      assert.ok(moved > .05 && (after < 0) === t.back, `${kind}@${t.at}: his ${t.side} ${t.back ? 'retreats' : 'advances'} next (${after})`);
    }
  }
}
console.log('PASS aller-retour : la touche de l\'ida transforme le prochain pas possible (figure en cours, sinon figure en attente), 2 temps par aller-retour, virgula, enchaînement compatible');

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
  s.press(1, 'avance'); s.press(1.4, 'avance');
  s.press(5, 'avance'); s.press(5.6, 'avance');
  s.press(9, 'recule'); s.press(9.3, 'idaArrD');
  assert.deepEqual(s.intentions.map(i => [i.beat, i.figure]), [[1, 'double'], [5, 'avance'], [5.6, 'avance'], [9.3, 'idaArrD']]);
  // #140: only a command still waiting is rewritten; one already started, or that changed the sortie, is final.
  const bound = () => { const b = new api.GuideSession(); b.bind(rig); return b; };
  let live = bound(); live.press(4.2, 'avance'); live.press(4.6, 'avance');
  assert.deepEqual(live.intentions.map(i => i.figure), ['double'], 'still waiting: the double');
  live = bound(); live.press(3.8, 'avance'); live.press(4.2, 'avance');
  assert.equal(kinds(live.plan(30)), 'base@0 avance@4 avance@6 base@8', 'the walk has started: a second walk');
  live = bound(); live.press(3.8, 'recule'); live.press(4.3, 'idaArr');
  assert.equal(kinds(live.plan(30)), 'base@0 recule+1@4 base@8', 'the walk backwards has started: the key touches its second step (#144)');
  live = bound(); live.press(3.9, 'sortieF'); live.press(6.8, 'avance'); live.press(7.2, 'avance');
  assert.equal(kinds(live.plan(30)), 'base@0 sortieFG@4 avance@13 base@15', 'the chain is final: the second ↑ is a walk');
  // Kompa, tarraxinha and zouk offer the walks only; kizomba everything.
  for (const k of ['kompa', 'tarraxinha', 'zouk']) assert.deepEqual(api.guideFiguresFor(k), ['avance', 'recule', 'double']);
  assert.deepEqual(api.guideFiguresFor('kizomba'), api.GUIDE_FIGURE_KEYS);
}
console.log('PASS touches par position physique (QWERTY W A Q D = AZERTY Z Q A D), lettres selon la disposition ; flèches : marche, variantes de l\'ida, double');

// 2. #140 — automatic dance (owner: « ça danse tout seul : à chaque position le choix de faire le début
// d'une figure si possible ou de terminer l'actuelle. Toutes les 4 mesures de 8 temps on essaie d'être en
// position neutre mais ce n'est pas obligatoire »).
const AUTO = [{ beat: 0, auto: true }];
const autoPlan = (seed, until, extra = {}) => api.planGuide([], motions, until, { modes: AUTO, seed, ...extra });
{
  const A = api.GUIDE_AUTO;
  assert.equal(A.phrase, 32, 'a phrase: 4 bars of 8 beats');
  // The draw is a pure function of the seed and the beat: same seed, same dance; a longer plan extends it.
  for (const seed of [1, 2, 3, 140]) {
    const long = autoPlan(seed, 320), again = autoPlan(seed, 320), short = autoPlan(seed, 100);
    assert.deepEqual(long, again, `seed ${seed}: deterministic`);
    assert.equal(kinds(long).startsWith(kinds(short).replace(/ [^ ]+$/, '')), true, `seed ${seed}: a longer plan keeps the past`);
  }
  const dances = new Set(Array.from({ length: 20 }, (_, seed) => kinds(autoPlan(seed + 1, 96))));
  assert.ok(dances.size >= 19, `different seeds, different dances (${dances.size}/20)`);
  // It dances by itself: a figure at every neutral position, drawn among those the style offers.
  const seen = new Set();
  for (const styleKey of STYLES) {
    const offered = api.guideFiguresFor(styleKey);
    for (let seed = 1; seed <= 20; seed++) {
      const plan = autoPlan(seed, 320, { offered });
      assert.equal(plan.auto, true);
      assert.deepEqual([plan.segments[0].kind, plan.segments[0].end], ['base', 4], 'the first figure starts at the first neutral position');
      for (const s of plan.segments.slice(1)) {
        assert.ok(offered.includes(s.kind), `${styleKey} seed ${seed}: ${s.kind} is not offered`);
        assert.equal(s.by, 'auto');
        if (styleKey === 'kizomba') seen.add(s.kind);
      }
    }
  }
  assert.deepEqual([...seen].sort(), [...api.GUIDE_FIGURE_KEYS].sort(), 'every figure is drawn, the chain and the insertions included');
  // « Le début d'une figure si possible ou terminer l'actuelle »: at the junctions of a sortie the draw
  // sometimes starts the other figure, sometimes finishes the sortie.
  const count = { sortieF: 0, sortieG: 0, sortieFG: 0, 'aller-retour': 0, virgula: 0, 'figures avec aller-retour': 0 };
  const positions = {};
  let figures = 0, repeats = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const plan = autoPlan(seed, 320);
    plan.segments.slice(1).forEach((s, k) => {
      if (s.kind in count) count[s.kind]++;
      for (const t of s.touches) {
        count['aller-retour']++; if (t.virgula) count.virgula++;
        positions[`${s.kind}@${t.at}`] = (positions[`${s.kind}@${t.at}`] ?? 0) + 1;
        assert.ok(api.TOUCH_POSITIONS[s.kind].some(q => q.at === t.at), `${s.kind}: a touch at ${t.at}`);
      }
      if (s.touches.length) count['figures avec aller-retour']++;
      if (Number.isFinite(s.end)) assert.equal(s.end - s.start, api.segmentBeats(s.kind, s.touches), 'a touch adds 2 beats');
      figures++; if (api.guideFamilyOf(s.kind) === api.guideFamilyOf(plan.segments[k].kind)) repeats++;
    });
  }
  for (const k of Object.keys(count)) assert.ok(count[k] >= 20, `junction choices: ${JSON.stringify(count)}`);
  // #144: every offered position is drawn, and most figures are danced without a touch.
  for (const [kind, touches] of Object.entries(api.TOUCH_POSITIONS)) for (const t of touches) assert.ok(positions[`${kind}@${t.at}`] > 0, `${kind}@${t.at} is never drawn: ${JSON.stringify(positions)}`);
  assert.ok(count['figures avec aller-retour'] / figures > .1 && count['figures avec aller-retour'] / figures < .5, `share of touched figures ${count['figures avec aller-retour']}/${figures}`);
  assert.ok(repeats / figures < 0.2, `a family is seldom danced twice in a row (${repeats}/${figures})`);
  // The phrase: a neutral position on its end (a figure starts there) more often than a draw that ignores
  // it, without it being an obligation.
  const neutral = extra => {
    let ends = 0, hit = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const starts = new Set(autoPlan(seed, 330, extra).segments.map(s => s.start));
      for (let end = A.phrase; end <= 320; end += A.phrase) { ends++; if (starts.has(end)) hit++; }
    }
    return hit / ends;
  };
  const share = neutral({}), plain = neutral({ plain: true });
  assert.ok(share >= 0.7 && share < 1, `phrase ends at the neutral position: ${share}`);
  assert.ok(share >= plain + 0.3, `the phrase preference: ${share} vs ${plain} without it`);
  // The queue first: a command pressed during the automatic dance is danced at the next neutral position,
  // then the draw goes on. Back to listening: the figure under way ends, then the basic step.
  let plan = api.planGuide([I(20.5, 'quart'), I(20.6, 'quart')], motions, 80, { modes: AUTO, seed: 7 });
  const at = plan.segments.findIndex(s => s.by === 'commande');
  assert.deepEqual(plan.segments.slice(at, at + 2).map(s => [s.kind, s.by]), [['quart', 'commande'], ['quart', 'commande']]);
  assert.ok(plan.segments[at].start > 20.6 && plan.segments[at].start === plan.segments[at - 1].end && plan.segments[at + 2].by === 'auto');
  assert.equal(kinds(plan).startsWith(kinds(autoPlan(7, 20))), true, 'the dance before the command is unchanged');
  const back = 43.3;
  plan = api.planGuide([], motions, 120, { modes: [...AUTO, { beat: back, auto: false }], seed: 7 });
  const tail = plan.segments[plan.segments.length - 1], before = plan.segments[plan.segments.length - 2];
  assert.equal(plan.auto, false);
  assert.deepEqual([tail.kind, tail.by], ['base', undefined]);
  assert.ok(before.start <= back && tail.start >= back && tail.start === before.start + api.segmentBeats(before.kind, before.touches), `the figure under way ends: ${kinds(plan)}`);
  assert.equal(kinds(plan).startsWith(kinds(autoPlan(7, before.start)).replace(/ [^ ]+$/, '')), true, 'the dance before the switch is unchanged');
  // Listening again, then automatic again: the draw resumes at the next boundary of the basic step.
  plan = api.planGuide([], motions, 120, { modes: [{ beat: 9, auto: true }, { beat: 30, auto: false }, { beat: 70.5, auto: true }], seed: 3 });
  assert.equal(plan.segments[1].start, 12, 'switched on at 9: the first figure at 12');
  assert.ok(plan.segments.some(s => s.kind === 'base' && s.end - s.start >= 30), `listening: the basic step (${kinds(plan)})`);
  console.log(`PASS danse automatique : graine reproductible, figures offertes par le style (six styles), choix aux jonctions ${JSON.stringify(count)}, fin de phrase en position neutre ${(share * 100).toFixed(0)} % (${(plain * 100).toFixed(0)} % sans préférence), file prioritaire, retour à l'écoute`);
}

// 2b. #152 (owner: « ajoute un peu de contrôle dans le hasard pour ne pas enchaîner trop de fois les mêmes
// figures ou combinaisons de figures »): the draw remembers the figures and the pairs danced lately.
{
  const measure = (variety, styleKey = 'kizomba') => {
    const m = { figures: 0, run: 0, back3: 0, pairs8: 0, abab: 0, ends: 0, neutral: 0 };
    for (let seed = 1; seed <= 40; seed++) {
      const plan = autoPlan(seed, 330, { variety, offered: api.guideFiguresFor(styleKey) });
      const ids = plan.segments.slice(1).map(s => api.guideIdentityOf(s.kind));
      let run = 1;
      ids.forEach((id, i) => {
        m.figures++;
        run = i > 0 && id === ids[i - 1] ? run + 1 : 1; m.run = Math.max(m.run, run);
        if (ids.slice(Math.max(0, i - 3), i).includes(id)) m.back3++;
        if (i > 0) for (let j = Math.max(1, i - 8); j < i; j++) if (ids[j - 1] === ids[i - 1] && ids[j] === id) { m.pairs8++; break; }
        if (i >= 3 && id === ids[i - 2] && ids[i - 1] === ids[i - 3] && id !== ids[i - 1]) m.abab++;
      });
      const starts = new Set(plan.segments.map(s => s.start));
      for (let end = 32; end <= 320; end += 32) { m.ends++; if (starts.has(end)) m.neutral++; }
    }
    return { run: m.run, back3: m.back3 / m.figures, pairs8: m.pairs8 / m.figures, abab: m.abab / m.figures, neutral: m.neutral / m.ends };
  };
  const libre = measure('libre'), tenu = measure('tenu'), strict = measure('strict');
  // The default setting: never three times the same figure in a row, quick returns and repeated pairs rarer.
  assert.deepEqual(measure(undefined), tenu, 'tenu is the default');
  assert.ok(libre.run >= 3 && tenu.run === 2 && strict.run === 1, `longest runs ${libre.run}, ${tenu.run}, ${strict.run}`);
  assert.ok(tenu.back3 < libre.back3 - .08 && strict.back3 < tenu.back3 - .05, `figure danced among the 3 before: ${libre.back3}, ${tenu.back3}, ${strict.back3}`);
  assert.ok(tenu.pairs8 < libre.pairs8 / 2 && strict.pairs8 < tenu.pairs8 / 2, `pair danced among the 8 before: ${libre.pairs8}, ${tenu.pairs8}, ${strict.pairs8}`);
  assert.ok(tenu.abab < libre.abab / 3, `A B A B: ${libre.abab}, ${tenu.abab}`);
  // The phrase preference is kept.
  for (const m of [libre, tenu, strict]) assert.ok(m.neutral >= .7, `phrase ends at the neutral position: ${m.neutral}`);
  // Walk-only styles (three figures): no more long runs of the same walk.
  const walksLibre = measure('libre', 'kompa'), walksTenu = measure('tenu', 'kompa');
  assert.ok(walksLibre.run >= 6 && walksTenu.run === 2, `walks: longest runs ${walksLibre.run}, ${walksTenu.run}`);
  // `libre` is the draw before #152: only the figure before counts. The other settings read the history.
  const offered = api.guideFiguresFor('kizomba'), keys = offered.filter(f => !api.GUIDE_FIGURES[f].chain);
  let differs = 0;
  for (let seed = 1; seed <= 30; seed++) for (let boundary = 4; boundary <= 64; boundary += 4) {
    const before = keys[(seed + boundary) % keys.length], history = [keys[seed % keys.length], before, keys[(seed * 3) % keys.length], before];
    assert.equal(api.autoFigure(seed, boundary, history, offered, false, 'libre'), api.autoFigure(seed, boundary, [before], offered, false, 'libre'));
    if (api.autoFigure(seed, boundary, history, offered, false, 'tenu') !== api.autoFigure(seed, boundary, [before], offered, false, 'tenu')) differs++;
  }
  assert.ok(differs > 20, `the memory changes the draw (${differs} draws)`);
  // Still a pure function: same seed, same setting, same dance; another setting, another dance.
  assert.deepEqual(autoPlan(5, 200, { variety: 'strict' }), autoPlan(5, 200, { variety: 'strict' }));
  assert.notEqual(kinds(autoPlan(5, 200, { variety: 'strict' })), kinds(autoPlan(5, 200, { variety: 'libre' })));
  const pct = v => (v * 100).toFixed(0) + ' %';
  console.log(`PASS hasard tenu (#152) : plus longue série de la même figure ${libre.run} → ${tenu.run} (strict ${strict.run}) ; figure déjà dansée parmi les 3 précédentes ${pct(libre.back3)} → ${pct(tenu.back3)} (${pct(strict.back3)}) ; paire déjà enchaînée parmi les 8 précédentes ${pct(libre.pairs8)} → ${pct(tenu.pairs8)} (${pct(strict.pairs8)}) ; A B A B ${(libre.abab * 100).toFixed(1)} % → ${(tenu.abab * 100).toFixed(1)} % ; fin de phrase neutre ${pct(libre.neutral)} → ${pct(tenu.neutral)} (${pct(strict.neutral)}) ; marche seule : série ${walksLibre.run} → ${walksTenu.run}`);
}

/** The sortie changed at a junction (#90): the sortie it comes from, and the beat of the junction in the figure. */
const JUNCTION = { sortieFG: { host: 'sortieF', at: 3 } };

// 3. Replay: the live session (keys and Space as they come) equals the plan computed at once from the
// same commands and mode changes; a plan never rewrites its past.
{
  const keys = ['ida', 'ida', 'idaD', 'idaArr', 'idaArrD', 'quart', 'sortieG', 'sortieF', 'avance', 'avance', 'recule'];
  let compared = 0, toggles = 0, presses = 0, changed = 0, touched = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const random = lcg(seed * 977), events = [];
    for (let beat = random() * 6; beat < 150; beat += 0.2 + random() * random() * 14)
      events.push(random() < 0.14 ? { beat, toggle: true } : { beat, figure: keys[Math.floor(random() * keys.length)] });
    const session = new api.GuideSession(); session.bind(rig); session.seed = seed; session.reset(seed % 3 === 0);
    const live = [];
    let next = 0;
    for (let beat = 0; beat < 170; beat += 0.0625) {
      // Events arrive live (they invalidate the cache); between them the cached plan is reused.
      while (next < events.length && events[next].beat <= beat) {
        const e = events[next++];
        if (e.toggle) { session.setAuto(e.beat, !session.auto); toggles++; } else { session.press(e.beat, e.figure, random() < .3); presses++; }
      }
      const s = session.sample(beat);
      live.push([s.kind, s.localBeat, s.couple.yaw, s.couple.x, s.couple.z, s.figureBeat, s.touch]);
    }
    const options = { modes: session.modes, seed, offered: session.offered };
    const direct = api.planGuide(session.intentions, motions, 170, options);
    assert.deepEqual(api.planGuide(session.intentions, motions, 170, options), direct);
    live.forEach(([kind, localBeat, yaw, x, z, figureBeat, touch], k) => {
      const beat = k * 0.0625, fixed = api.sampleGuide(direct, beat);
      near(localBeat, fixed.localBeat, 1e-9, `seed ${seed}: local beat at ${beat}`);
      // #144: a touch decided later does not change the dance before it (same beat of the figure, same touch).
      near(figureBeat, fixed.figureBeat, 1e-9, `seed ${seed}: beat of the figure at ${beat}`);
      assert.deepEqual(touch, fixed.touch, `seed ${seed}: touch at ${beat}`);
      if (touch) touched++;
      if (kind !== fixed.kind) {
        // A sortie changed later at its junction: until then its steps are the sortie's (same poses, §4c).
        const junction = JUNCTION[fixed.kind];
        assert.ok(junction && junction.host === kind && figureBeat <= junction.at + 1e-9, `seed ${seed}: ${kind} became ${fixed.kind} at ${beat}`);
        for (const follower of [false, true]) {
          const a = api.sampleKind(kind, figureBeat, follower, rig), b = api.sampleKind(fixed.kind, figureBeat, follower, rig);
          for (const [u, v] of [[a.feet.L, b.feet.L], [a.feet.R, b.feet.R], [a.root, b.root]]) assert.ok(Math.hypot(u.x - v.x, u.z - v.z) < 1e-9, `seed ${seed}: ${kind} and ${fixed.kind} differ at ${beat}`);
        }
        changed++;
      }
      near(yaw, fixed.couple.yaw, 1e-12, `yaw at ${beat}`); near(x, fixed.couple.x, 1e-12, `x at ${beat}`); near(z, fixed.couple.z, 1e-12, `z at ${beat}`);
      compared++;
    });
  }
  assert.ok(changed > 0 && toggles > 20 && presses > 100 && touched > 500);
  console.log(`PASS rejeu : séance en direct = plan calculé d'un coup (${compared} instants, ${presses} appuis, ${toggles} bascules écoute / danse seule, ${touched} instants d'aller-retour, ${changed} instants d'une sortie fille enchaînée ensuite), résultat déterministe`);
}

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
/** Largest joint displacement across a boundary over 1e-6 beat (the motion itself is ≪ 0.01 mm). #203: 0.4 mm (was
 * 0.2): with the knees bent the couple stands 8 cm further apart, and the plexus lean now acts where the chained sortie
 * meets the basic step; the faded trunk residual matches it to 0.3 mm (zouk, chest and head), far below what shows. */
const GUIDE_JUMP = 0.0004;

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
  console.log(`PASS squelette continu aux frontières (six styles, ${(1 + api.GUIDE_FIGURE_KEYS.length) ** 2} enchaînements) : saut max ${(worst.jump * 1000).toFixed(3)} mm sur 1e-6 temps (${worst.styleKey} ${worst.a}→${worst.b}, ${worst.joint}) < ${GUIDE_JUMP * 1000} mm`);
}

// 4c. GLB: a figure changed at a junction keeps its poses up to the junction, and the skeleton is
// continuous where a touch starts and ends (#90: the chained sortie fille; #144: every offered touch).
{
  const joints = ['pelvis', 'hipL', 'hipR', 'kneeL', 'kneeR', 'footL', 'footR', 'chest', 'head'];
  const single = (kind, touches = []) => ({ segments: [{ kind, touches, start: 0, end: Infinity, couple: api.IDENTITY, residual: { leader: { x: 0, z: 0 }, follower: { x: 0, z: 0 } }, previous: null }], outcomes: [] });
  const jointsOf = (plan, beat, follower, styleKey) => {
    const f = { ...fixture(api), cache: new Map() };
    const s = api.sampleGuide(plan, beat); place(f, follower, s.couple);
    api.applyGuidePose(f.r, f.model, s, { styleKey, amp: 1, placement: 'quinconce', contraposition: 1 }, follower, f.cache);
    f.r.root.updateWorldMatrix(true, true);
    return joints.map(n => f.r[n].getWorldPosition(new THREE.Vector3()));
  };
  let worst = { gap: 0 }, jump = { gap: 0 }, poses = 0, touches = 0;
  const widest = (into, a, b, label) => a.forEach((p, k) => { const gap = p.distanceTo(b[k]); if (gap > into.gap) Object.assign(into, { gap, ...label, joint: joints[k] }); });
  for (const styleKey of ['kizomba', 'semba', 'suave']) for (const follower of [false, true]) {
    for (const [kind, { host, at }] of Object.entries(JUNCTION)) for (let beat = 0; beat <= at + 1e-9; beat += .25) {
      widest(worst, jointsOf(single(host), beat, follower, styleKey), jointsOf(single(kind), beat, follower, styleKey), { styleKey, kind, follower, beat }); poses++;
    }
    for (const [kind, list] of Object.entries(api.TOUCH_POSITIONS)) for (const touch of list) {
      const plain = single(kind), touched = single(kind, [touch]), end = api.GUIDE_FIGURES[kind].beats;
      // Before the touch and after it: the figure's own poses.
      for (const beat of [0, touch.at / 2, touch.at]) { widest(worst, jointsOf(plain, beat, follower, styleKey), jointsOf(touched, beat, follower, styleKey), { styleKey, kind, at: touch.at, follower, beat }); poses++; }
      for (const beat of [touch.at, (touch.at + end) / 2, end]) { widest(worst, jointsOf(plain, beat, follower, styleKey), jointsOf(touched, beat + api.TOUCH_BEATS, follower, styleKey), { styleKey, kind, at: touch.at, follower, beat }); poses++; }
      // Where the touch starts and ends: no jump.
      for (const beat of [touch.at, touch.at + api.TOUCH_BEATS]) widest(jump, jointsOf(touched, beat - 1e-6, follower, styleKey), jointsOf(touched, beat + 1e-6, follower, styleKey), { styleKey, kind, at: touch.at, follower, beat });
      touches++;
    }
  }
  assert.ok(worst.gap < GUIDE_JUMP, `a changed figure differs outside its junction ${JSON.stringify(worst)}`);
  assert.ok(jump.gap < GUIDE_JUMP, `joint jump where a touch starts or ends ${JSON.stringify(jump)}`);
  console.log(`PASS figure modifiée à une jonction : poses de la figure hors de l'aller-retour (${poses} poses, écart max ${(worst.gap * 1000).toFixed(4)} mm) ; squelette continu au début et à la fin des ${touches} allers-retours (saut max ${(jump.gap * 1000).toFixed(3)} mm)`);
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
  // #140: the commands are queued, so the figures follow one another without the basic step between them.
  const random = lcg(69);
  for (const styleKey of STYLES) {
    const intentions = [];
    // #62: each style draws from the figures it offers (kompa: the walks only).
    const offered = api.guideFiguresFor(styleKey);
    if (!offered.length) continue; // basic step only (tested above)
    const keys = offered.filter(f => !api.GUIDE_FIGURES[f].chain);
    for (let beat = 2.9; beat < 60; beat += 4) intentions.push(I(beat + random() * .9, keys[Math.floor(random() * keys.length)]));
    if (offered.includes('sortieG')) intentions.push(I(2.5, 'sortieG'));
    const plan = api.planGuide(intentions, motions, 70, { offered });
    const boundaries = plan.segments.slice(1).map(s => s.start);
    assert.ok(new Set(plan.segments.map(s => s.kind)).size >= Math.min(4, keys.length), `${styleKey}: varied session ${kinds(plan)}`);
    const pair = couple();
    for (const boundary of boundaries) for (let beat = boundary - .5; beat <= boundary + api.GUIDE.inertia + .25; beat += .125) {
      pose(pair, api.sampleGuide(plan, beat), { styleKey, amp: 1 });
      clearance(pair, { styleKey, beat, around: boundary }); poses++;
    }
  }
}
console.log('PASS', poses, 'poses du mode jeu : aucun croisement des os des jambes autour des frontières des séances commandées (six styles)');
{
  // #140: the automatic dance (one seed per style): boundaries and junctions of the sorties.
  let autoPoses = 0, boundaries = 0, touchesSeen = 0;
  for (const [index, styleKey] of STYLES.entries()) {
    const offered = api.guideFiguresFor(styleKey), seed = 140 + index;
    const plan = api.planGuide([], motions, offered.length > 3 ? 64 : 16, { modes: [{ beat: 0, auto: true }], seed, offered });
    const pair = couple();
    for (const segment of plan.segments.slice(1)) {
      // The chain's junction, and every touch from its start to its end (#144), on the clock of the segment.
      const windows = segment.touches.map((t, k) => [t.at + api.TOUCH_BEATS * k - .25, t.at + api.TOUCH_BEATS * (k + 1) + .25]);
      if (segment.kind === 'sortieFG') { const at = 3 + api.TOUCH_BEATS * segment.touches.filter(t => t.at < 3).length; windows.push([at - .25, at + .5]); }
      for (const [from, to] of windows) for (let beat = segment.start + from; beat <= segment.start + to; beat += .125) {
        pose(pair, api.sampleGuide(plan, beat), { styleKey, amp: 1 });
        clearance(pair, { styleKey, seed, beat, junction: segment.kind }); autoPoses++;
      }
      touchesSeen += segment.touches.length;
      for (let beat = segment.start - .5; beat <= segment.start + api.GUIDE.inertia + .25; beat += .125) {
        pose(pair, api.sampleGuide(plan, beat), { styleKey, amp: 1 });
        clearance(pair, { styleKey, seed, beat, around: segment.start }); autoPoses++;
      }
      boundaries++;
    }
  }
  assert.ok(touchesSeen >= 3, `touches in the automatic sessions: ${touchesSeen}`);
  console.log('PASS', autoPoses, 'poses de la danse automatique : aucun croisement des os des jambes autour de', boundaries, 'frontières, des jonctions et de', touchesSeen, 'allers-retours (six styles)');
}
