// #95, ADR 004 — the figures' ontology: declared = measured on the real GLB (docs/spec-ontologie-figures.md).
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-ontologie-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'sortieGarconContact', 'ontologie', 'transitions', 'enchainement', 'insertion']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const world = (f, name) => f.r[name].getWorldPosition(new THREE.Vector3());
const pair = [fixture(api, { offset: [0, 0, -0.2] }), fixture(api, { rotation: Math.PI, offset: [0, 0, 0.2] })];
const OPTIONS = {
  sortieG: { movement: 'sortieG' },
  sortieF: { movement: 'sortieF', sortieFilleVariant: 'hook' },
  'sortieF:back': { movement: 'sortieF', sortieFilleVariant: 'back' },
  quart: { movement: 'quarts', quarts: true, quartsPaire: true },
  ida: { movement: 'ida', ida: true, idaPaire: true },
};
const pose = (figure, beat) => pair.map((f, i) => api.applyPose(f.r, f.model, beat,
  { ...OPTIONS[figure], embrace: true, placement: 'quinconce', styleKey: 'kizomba', follower: !!i }));
const other = s => (s === 'L' ? 'R' : 'L');

// 0. Structure: unique ids, every entry « à valider » or « validé ».
const ids = new Set();
for (const p of api.POSITIONS) {
  assert(!ids.has(p.id), `unique id ${p.id}`); ids.add(p.id);
  assert.equal(p.id, `${p.figure}.${p.beat}`, `id ${p.id}`);
  assert(['à valider', 'validé'].includes(p.statut), `${p.id} statut`);
}
for (const list of [api.LEADS, api.EQUIVALENCES, api.INSERTIONS]) for (const e of list) assert(['à valider', 'validé'].includes(e.statut));
for (const key of api.TRANSITION_KEYS) for (const t of api.transitionsOf(key)) assert(['à valider', 'validé'].includes(t.statut), `${key} ${t.title} statut`);
console.log(`PASS ontologie : ${api.POSITIONS.length} positions, ${api.LEADS.length} guidages, ${api.EQUIVALENCES.length} équivalence, ${api.INSERTIONS.length} insertions, statuts présents`);

// 1. Declared = measured: supports (load > 0.9), pelvis layout and right-thigh contact.
for (const p of api.POSITIONS) {
  const stats = pose(p.figure, p.beat);
  for (const [i, role] of [[0, 'leader'], [1, 'follower']]) {
    const load = stats[i]['load' + p.support[role]];
    assert(load > 0.9, `${p.id}: ${role} on ${p.support[role]} (load ${load.toFixed(2)})`);
  }
  const r0 = world(pair[0], 'root'), r1 = world(pair[1], 'root');
  const yaw = new THREE.Euler().setFromQuaternion(pair[0].r.root.getWorldQuaternion(new THREE.Quaternion()), 'YXZ').y;
  const lateral = Math.abs((r1.x - r0.x) * Math.cos(yaw) - (r1.z - r0.z) * Math.sin(yaw));
  if (p.layout === 'quinconce') assert(lateral < 0.12, `${p.id}: quinconce (lateral ${lateral.toFixed(3)} m)`);
  else assert(lateral > 0.14, `${p.id}: offset (lateral ${lateral.toFixed(3)} m)`);
  const gap = api.thighProximity(world(pair[0], 'hipR'), world(pair[0], 'kneeR'), world(pair[1], 'hipR'), world(pair[1], 'kneeR')).gap;
  if (p.thighs === 'contact') assert(gap <= 0.003, `${p.id}: right thighs in contact (gap ${(gap * 1000).toFixed(0)} mm)`);
  else assert(gap >= 0.02, `${p.id}: right thighs apart (gap ${(gap * 1000).toFixed(0)} mm)`);
}
console.log('PASS déclaré = mesuré : appuis, quinconce ou décalé, contact des cuisses D, à chaque position (GLB, quinconce, kizomba)');

// 2. Every transition of a simple figure starts at a declared position.
for (const figure of Object.keys(OPTIONS)) for (const t of api.transitionsOf(figure))
  assert(ids.has(`${figure}.${t.from}`), `${figure}: transition « ${t.title} » starts at a declared position (${t.from})`);
console.log('PASS chaque transition des figures simples part d’une position déclarée');

// 3. Leads (R24): the follower's foot leaves with or after the leader's foot that provokes it.
const departure = (figure, from, to, role, side) => {
  const f = pair[role];
  const t0 = Math.max(0, from - 0.5);
  pose(figure, t0); const start = world(f, 'foot' + side);
  for (let t = t0; t <= to + 1e-9; t += 0.01) {
    pose(figure, t);
    if (world(f, 'foot' + side).distanceTo(start) > 0.002) return t;
  }
  return Infinity;
};
for (const l of api.LEADS) {
  const his = departure(l.figure, l.from, l.to, 0, l.leader), hers = departure(l.figure, l.from, l.to, 1, l.follower);
  assert(Number.isFinite(his) && Number.isFinite(hers), `${l.figure} ${l.from}→${l.to}: both feet move`);
  assert(hers >= his - 0.015, `${l.figure} ${l.from}→${l.to}: her ${l.follower} (${hers.toFixed(2)}) leaves with or after his ${l.leader} (${his.toFixed(2)}) — R24`);
}
console.log(`PASS R24 sur ${api.LEADS.length} guidages : le pied du suiveur part avec ou après celui du leader`);

// 4. Equivalences (#90): same configuration, the bridge resolves the supports; the chain reads them.
for (const e of api.EQUIVALENCES) {
  const a = api.positionById(e.from), b = api.positionById(e.to);
  assert(a && b, `${e.from} ≡ ${e.to}: declared positions`);
  assert.equal(a.layout, b.layout, `${e.from} ≡ ${e.to}: layout`);
  assert.equal(a.thighs, b.thighs, `${e.from} ≡ ${e.to}: thighs`);
  const sameSupports = a.support.leader === b.support.leader && a.support.follower === b.support.follower;
  assert(sameSupports || e.bridge > 0, `${e.from} ≡ ${e.to}: a bridge when the supports differ`);
}
assert.deepEqual(api.EQUIVALENCES.map(e => [e.from, e.to, e.bridge]), [[`sortieF.${api.CHAIN_FROM}`, `sortieG.${api.CHAIN_TO}`, api.CHAIN_BRIDGE.beats]]);
console.log('PASS équivalence #90 : même configuration, pont de 2 temps pour les appuis ; constantes de l’enchaînement cohérentes');

// 5. Insertions (#91): the ida's foot is the leader's free foot at the position, the figure's constants agree.
for (const ins of api.INSERTIONS) {
  const p = api.positionById(ins.at);
  assert(p, `${ins.at}: declared position`);
  assert.equal(other(p.support.leader), ins.ida.side, `${ins.at}: the ida's foot (${ins.ida.side}) is the leader's free foot`);
  assert.equal(p.beat, api.INSERTION_AT, `${ins.at}: INSERTION_AT`);
  assert.deepEqual(ins.ida, api.INSERTION_VARIANT[p.figure], `${ins.at}: INSERTION_VARIANT`);
}
console.log('PASS insertions #91 : le pied de l’ida est le pied libre du leader ; constantes de l’insertion cohérentes');
