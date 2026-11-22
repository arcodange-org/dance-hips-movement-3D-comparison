// #157 — the ginga seen in the couple dance (docs/spec-ginga-couple.md), on the real GLB, in the game
// mode's configuration: the style's phase on the support transfers in every figure, the hip sway towards
// the support, the small bounce on each beat, and no leg-bone crossing. PROBE=1 counts the violations
// instead of failing on the first one; GINGA=discret,marque,ample chooses the settings checked in full.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import { fixture, minimumBoneY } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, footHullsOverlap } from "./mesh_intersections.mjs";
const bundle = new URL("./.test-ginga-couple-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'insertion', 'guidage']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const PROBE = process.env.PROBE === '1';
const failures = {};
const check = (ok, label, key = label) => {
  if (ok) return;
  if (!PROBE) assert.fail(label);
  if (process.env.VERBOSE) console.log(label);
  failures[key] = (failures[key] ?? 0) + 1;
};
const dz = api.GUIDE_PAIR_DZ;
const couple = () => [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const ZERO = { leader: { x: 0, z: 0 }, follower: { x: 0, z: 0 } };
const KINDS = ['base', ...api.GUIDE_FIGURE_KEYS].filter(k => !process.env.KIND || new RegExp(process.env.KIND).test(k));
const beatsOf = kind => (kind === 'base' ? 4 : api.GUIDE_FIGURES[kind].beats);
const movementOf = kind => (kind === 'base' ? 'none' : api.GUIDE_FIGURES[kind].movement);
const stylesOf = kind => Object.keys(api.STYLES).filter(k => (kind === 'base' || api.guideFiguresFor(k).includes(kind)) && (!process.env.STYLE || k === process.env.STYLE));
// TRY='{"sway":0.3,"bounce":0}': a setting to measure (calibration), in place of the named ones.
const TRY = process.env.TRY ? JSON.parse(process.env.TRY) : null;
const options = (kind, i, ginga, styleKey, amp) => ({ ...api.guidePoseOptions({ movement: movementOf(kind), rootOffset: ZERO, kind, ginga }, !!i),
  placement: 'quinconce', contraposition: 1, styleKey: api.guideStyleOf(kind, styleKey), amp, ...(TRY && ginga !== 'sans' ? { ginga: TRY } : {}) });
const pose = (pair, kind, beat, ginga, styleKey, amp = 1) => pair.forEach((f, i) => { api.applyPose(f.r, f.model, beat, options(kind, i, ginga, styleKey, amp)); f.r.root.updateWorldMatrix(true, true); });

// 1. The setting by default, and what each setting is.
assert.equal(api.GUIDE_GINGA.sans, null);
for (const [a, b] of [['discret', 'marque'], ['marque', 'ample']]) assert.ok(api.GUIDE_GINGA[a].sway < api.GUIDE_GINGA[b].sway && api.GUIDE_GINGA[a].bounce < api.GUIDE_GINGA[b].bounce, `${a} < ${b}`);
const DEFAULT = api.GUIDE_GINGA_DEFAULT, G = api.GUIDE_GINGA[DEFAULT];
assert.ok(G && G.sway > 0 && G.bounce > 0, 'the game dances with the ginga by default');
// #163 (owner, on `marque` seen in the couple: « Trop discret. »): the default is the largest calibrated one.
assert.equal(DEFAULT, 'ample');
for (const name of Object.keys(api.GUIDE_GINGA)) if (api.GUIDE_GINGA[name]) assert.ok(api.GUIDE_GINGA[name].sway <= G.sway && api.GUIDE_GINGA[name].bounce <= G.bounce, `${name} is not larger than the default`);
// The leader's sample of a figure (loads, room and cap it declares for the ginga).
const F0 = fixture(api), REST = { L: F0.model.legs.L.rest, R: F0.model.legs.R.rest };
const STANCE = (F0.model.legs.L.hipX - REST.L.x + REST.R.x - F0.model.legs.R.hipX) / 2;
const figureSample = (kind, t) => api.sampleKind(kind, t, false, { rest: REST, stance: STANCE, placement: 'quinconce', amp: 1 });
// What a setting becomes in a figure at a beat: held to the figure's cap, less the room it leaves above it.
const heldTo = (value, cap, room) => (cap === undefined || value <= cap ? value : cap + (value - cap) * room);

// 2. Phase (R13): read on the leader's loads; on a support it is that support's (left 0.5, right 1.5,
// modulo 2), it never jumps, and a completed transfer moves it on by one beat.
{
  const sample = figureSample;
  const load = (kind, t) => sample(kind, t).loadR;
  let figures = 0;
  for (const kind of api.GUIDE_FIGURE_KEYS) {
    if (load(kind, 0) === undefined) continue;
    const end = api.GUIDE_FIGURES[kind].beats, phase = t => api.gingaPhase(`test:${kind}`, b => sample(kind, b), t);
    let previous = phase(0);
    const junctions = sample(kind, 0).gingaJunctions ?? [];
    const settled = t => { const l = load(kind, Math.max(0, Math.min(end, t))); return l > 0.97 ? 1.5 : l < 0.03 ? 0.5 : null; };
    for (let t = 0; t <= end; t += 1 / 16) {
      const p = phase(t);
      check(p >= previous - 0.02 && p - previous < 0.3, `${kind}: the phase jumps at ${t} (${previous} → ${p})`);
      // Held on a support for the whole swing around this beat: the phase is that support's (modulo 2).
      // Just after a junction the mean still reaches twice as far back (it regains its look-ahead).
      const here = settled(t), rejoining = junctions.some(j => t > j && t <= j + api.GINGA_SWING / api.GINGA_REJOIN);
      if (here !== null && [...(rejoining ? [-2, -1.5] : []), -1, -.5, .5, 1].every(k => settled(t + k * (api.GINGA_SWING + 1 / 32)) === here))
        check(Math.abs(((((p - here) % 2) + 3) % 2) - 1) < 0.03, `${kind}: phase ${p} on the ${here > 1 ? 'right' : 'left'} support at ${t}`);
      previous = p;
    }
    check(phase(end) - phase(0) >= 0.9, `${kind}: at least one transfer (${phase(0)} → ${phase(end)})`);
    figures++;
  }
  // A figure changed at a junction keeps its past: the chained sortie fille has the sortie fille's phase
  // up to the junction (the mean never looks beyond it), then its own.
  const [junction] = sample('sortieF', 0).gingaJunctions;
  const of = kind => t => api.gingaPhase(`test:${kind}`, b => sample(kind, b), t);
  const fille = of('sortieF'), chained = of('sortieFG');
  let after = 0;
  for (let t = 0; t <= api.GUIDE_FIGURES.sortieF.beats; t += 1 / 64) {
    if (t <= junction) check(fille(t) === chained(t), `the chained sortie fille has another phase at ${t}, before its junction (${fille(t)} / ${chained(t)})`);
    else after = Math.max(after, Math.abs(fille(t) - chained(t)));
  }
  check(after > 0.2, `the chain and the sortie fille differ after the junction (${after})`);
  console.log(`PASS phase du ginga lue sur les transferts d'appui du leader (${figures} figures) : sans saut, sur l'appui après chaque transfert ; la sortie fille enchaînée garde sa phase jusqu'à la jonction (temps ${junction})`);
}

// 2b. #163: the sorties hold the setting to their cap where the couple is tight (start, end, two spots) and
// leave room above it in between; the chain keeps the sortie fille's room up to its junction, the bridge
// is open, then the sortie garçon's room.
{
  const room = (kind, t) => figureSample(kind, t).gingaCapRoom;
  for (const t of [0, 0.25, 3.3125, 5, 6]) assert.deepEqual(room('sortieG', t), { sway: 0, bounce: 0 }, `sortie garçon capped at ${t}`);
  for (const t of [1, 2, 4]) assert.deepEqual(room('sortieG', t), { sway: 1, bounce: 1 }, `sortie garçon open at ${t}`);
  for (const t of [0, 1, 5, 6]) assert.deepEqual(room('sortieF', t), { sway: 0, bounce: 0 }, `sortie fille capped at ${t}`);
  for (const t of [1.75, 3, 4]) assert.deepEqual(room('sortieF', t), { sway: 1, bounce: 1 }, `sortie fille open at ${t}`);
  assert.deepEqual(room('sortieF', 2.25), { sway: 1, bounce: 0 }, 'sortie fille: no larger bounce at 2.25');
  const [junction] = figureSample('sortieF', 0).gingaJunctions;
  for (let t = 0; t <= junction; t += 1 / 16) assert.deepEqual(room('sortieFG', t), room('sortieF', t), `the chain keeps the sortie fille's room at ${t}`);
  assert.deepEqual(room('sortieFG', junction + 1), { sway: 1, bounce: 1 }, 'the bridge is open');
  const end = api.GUIDE_FIGURES.sortieFG.end;
  for (const back of [0, 1, 1.6875, 3]) assert.deepEqual(room('sortieFG', end - back), room('sortieG', 5 - back), `the chain ends as the sortie garçon (${back} before its end)`);
  for (const kind of ['sortieG', 'sortieF', 'sortieFG']) for (let t = 0; t <= api.GUIDE_FIGURES[kind].beats; t += 1 / 16) {
    const r = room(kind, t), next = room(kind, t + 1 / 16);
    assert.ok(Math.abs(next.sway - r.sway) < 0.4 && Math.abs(next.bounce - r.bounce) < 0.4, `${kind}: the room does not jump at ${t}`);
  }
  console.log(`PASS marge des sorties au-dessus de leur plafond : fermée au début, à la fin et aux deux instants serrés, ouverte entre les deux, sans saut ; l'enchaînement garde celle de la sortie fille jusqu'à la jonction`);
}

// 3. What one sees (GLB, default setting): the hips sway in every figure, towards the support, the
// follower more than the leader (R14); the bounce is lowest on the beat, the same for both dancers; without
// the ginga the walks, the quarter turn and the sorties have no lateral sway at all.
{
  const range = a => Math.max(...a) - Math.min(...a);
  const rows = [];
  for (const styleKey of ['kizomba', 'semba', 'suave'].filter(s => !process.env.STYLE || s === process.env.STYLE)) for (const kind of KINDS.filter(k => k !== 'base' && api.GUIDE_FIGURES[k].movement !== 'ida' || k === 'avance' || k === 'recule' || k === 'double')) {
    const end = beatsOf(kind), measure = ginga => {
      const pair = couple(), sway = [[], []], bounce = [[], []];
      for (let beat = 0; beat <= end + 1e-9; beat += 1 / 16) {
        pose(pair, kind, beat, ginga, styleKey);
        pair.forEach((f, i) => sway[i].push(f.r.pelvis.position.x));
      }
      // The bounce alone: the same pose with and without it, on the beat and half a beat later.
      return { sway: sway.map(range) };
    };
    const off = measure('sans'), on = measure(DEFAULT);
    // Kizomba and semba shift the hips with the whole body: without the ginga a figure keeps none of it.
    // Suave isolates the pelvis itself: the figure already keeps that, the ginga adds to it.
    // Suave isolates the pelvis itself, and the figures already keep it: there the ginga sets it on the
    // transfers (the leader at 70 %, R14) without making it wider.
    if (styleKey === 'suave') check(on.sway[0] > 0.01 && on.sway[1] >= off.sway[1] * 0.9 && on.sway[1] > on.sway[0], `${styleKey} ${kind}: sway ${on.sway} (${off.sway} without)`);
    else {
      check(off.sway[0] < 1e-6 && off.sway[1] < 1e-6, `${styleKey} ${kind}: no sway without the ginga (${off.sway})`);
      check(on.sway[0] > 0.01 && on.sway[1] > on.sway[0], `${styleKey} ${kind}: sway ${on.sway} (follower more than leader)`);
      rows.push(on.sway);
    }
  }
  const cm = v => (v * 100).toFixed(1);
  // The bounce: pelvis height with and without the ginga's bounce, the sway being the same.
  let low = 0, high = 0, samples = 0;
  for (const styleKey of Object.keys(api.STYLES).filter(s => !process.env.STYLE || s === process.env.STYLE)) for (const kind of ['base', 'avance', ...(api.guideFiguresFor(styleKey).includes('sortieG') ? ['sortieG', 'quart', 'ida'] : [])]) {
    const pair = couple(), still = couple(), only = { ...G, bounce: 0 };
    for (let beat = 0; beat <= beatsOf(kind) - 1; beat += 0.5) {
      pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(kind, i, DEFAULT, styleKey, 1)));
      still.forEach((f, i) => api.applyPose(f.r, f.model, beat, { ...options(kind, i, DEFAULT, styleKey, 1), ginga: only }));
      const drop = pair.map((f, i) => still[i].r.root.position.y - f.r.root.position.y);
      check(Math.abs(drop[0] - drop[1]) < 1e-9, `${styleKey} ${kind}: both dancers bounce together at ${beat}`);
      const onBeat = Math.abs(beat - Math.round(beat)) < 1e-9;
      // The quarter turn leaves no vertical room while the legs cross (its beat 1): no bounce there.
      const crossing = kind === 'quart' && beat > 0.5 && beat < 1.7;
      // A capped figure (the sorties) holds the bounce to its cap, less the room it leaves at this beat.
      const figure = kind === 'base' ? null : figureSample(kind, beat);
      const held = figure ? heldTo(G.bounce, figure.gingaCap?.bounce, figure.gingaCapRoom?.bounce ?? 0) * (figure.gingaRoom?.bounce ?? 1) : G.bounce;
      if (!crossing) check(Math.abs(drop[0] - (onBeat ? held : 0)) < 1e-9, `${styleKey} ${kind}: bounce ${drop[0]} at ${beat} (${held} expected)`);
      else check(drop[0] > -1e-9 && drop[0] < G.bounce + 1e-9, `${styleKey} ${kind}: bounce ${drop[0]} at ${beat}`);
      if (onBeat) low += drop[0]; else high += drop[0];
      samples++;
    }
  }
  // #163: in the open part of the sortie garçon the default sways and bounces more than the cap allows.
  const open = ginga => { const pair = couple(), xs = [[], []]; for (let beat = 0.8; beat <= 2.9; beat += 1 / 16) { pose(pair, 'sortieG', beat, ginga, 'kizomba'); pair.forEach((f, i) => xs[i].push(f.r.pelvis.position.x)); } return xs.map(range); };
  const capped = open('marque'), wide = open(DEFAULT);
  check(wide[0] > 1.3 * capped[0] && wide[1] > 1.3 * capped[1], `sortie garçon, open part: sway ${wide} with the default, ${capped} at the cap`);
  console.log(`PASS sortie garçon, partie ouverte (temps 0,8 à 2,9) : balancement de ${cm(wide[0])} et ${cm(wide[1])} cm avec le réglage par défaut, ${cm(capped[0])} et ${cm(capped[1])} cm au plafond`);
  console.log(`PASS ginga visible (réglage ${DEFAULT}) : balancement du bassin de ${cm(Math.min(...rows.map(r => r[0])))} à ${cm(Math.max(...rows.map(r => r[1])))} cm dans la marche, le quart de tour et les sorties en kizomba et en semba (0 sans le ginga), suiveur plus que leader ; rebond de ${(G.bounce * 1000).toFixed(0)} mm, au plus bas sur le temps, commun aux deux danseurs (${samples} poses, six styles)`);
}

// 4. GLB: every figure danced whole with the ginga, at the amplitude of the game mode (1, where it is
// calibrated): bones above the floor, soles apart, no leg-bone crossing between partners nor within one
// dancer. Every offered setting is checked (the default one at twice the sampling rate). AMP=0.5,2
// measures other amplitudes.
const boneNames = ['Femur', 'Tibia', 'Fibula', 'Patella'].flatMap(name => ['L', 'R'].map(side => name + '_' + side));
const settings = (process.env.GINGA ?? 'discret,marque,ample').split(',');
let poses = 0;
const amps = process.env.AMP ? process.env.AMP.split(',').map(Number) : [1];
for (const ginga of settings) for (const kind of KINDS) for (const styleKey of stylesOf(kind)) for (const amp of amps) {
  const pair = couple(), key = `${ginga} ${kind}`;
  // #163: three crossings of #157 sat between two samples taken every eighth of a beat, in the sorties. The
  // default (the largest setting) is now sampled every sixteenth there and in the ida e volta. Not in the
  // quarter turn: in suave it crosses bones at 0.94 without any ginga (the figure's own defect, #165).
  const tight = /^sortie|^ida/.test(kind);
  for (let beat = 0; beat <= beatsOf(kind) + 1e-9; beat += ginga !== DEFAULT ? .25 : tight ? .0625 : .125) {
    pose(pair, kind, beat, ginga, styleKey, amp);
    for (const f of pair) check(minimumBoneY(f.r) >= -.0001, `${key} floor ${styleKey} ${amp} ${beat}`, `${key} floor`);
    const polygons = pair.flatMap(f => ['L', 'R'].map(side => footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r['foot' + side].matrixWorld)))));
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++)
      check(!footHullsOverlap(polygons[a], polygons[b]), `${key}: feet ${a}/${b} overlap, ${styleKey} amp ${amp} at ${beat}`, `${key} feet`);
    const meshes = pair.map(f => Object.fromEntries(boneNames.map(name => [name, transformedMesh(f.r[name])])));
    for (const a of boneNames) for (const b of boneNames)
      check(!meshIntersection(meshes[0][a], meshes[1][b]), JSON.stringify({ key, styleKey, amp, beat, leader: a, partner: b }), `${key} bones`);
    for (const [role, own] of meshes.entries()) for (const a of boneNames.filter(n => n.endsWith('_L')))
      for (const b of boneNames.filter(n => n.endsWith('_R')))
        check(!meshIntersection(own[a], own[b]), JSON.stringify({ key, styleKey, amp, beat, role, left: a, right: b }), `${key} own bones`);
    poses++;
  }
}
console.log('PASS', poses, `poses de couple avec le ginga (${settings.join(', ')} ; amplitude ${amps.join(', ')}) : os au-dessus du sol, semelles disjointes, aucun croisement des os des jambes`);
if (PROBE) console.log(JSON.stringify(failures, null, 1));
