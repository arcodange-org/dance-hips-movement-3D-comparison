// #94 — transition explanations (docs/spec-transitions.md): coverage, fields, sources, consistency.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
const bundle = new URL("./.test-transitions-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['transitions', 'guidage'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const rules = new Set([...readFileSync(new URL('../docs/regles-proprietaire.md', import.meta.url), 'utf8').matchAll(/^\| (R\d+) \|/gm)].map(m => m[1]));
const refs = new Set([...readFileSync(new URL('../docs/cadre/figures-du-depot.md', import.meta.url), 'utf8').matchAll(/^- \[(S\d+)\]/gm)].map(m => m[1]));

// 1. Every game figure (but the basic step) is covered from 0 to its length, without gap or overlap.
const keys = new Set(api.TRANSITION_KEYS);
for (const figure of api.GUIDE_FIGURE_KEYS) {
  assert(keys.has(figure), `transitions for ${figure}`);
  const list = api.transitionsOf(figure);
  assert.equal(list[0].from, 0, `${figure} starts at 0`);
  for (let i = 1; i < list.length; i++) assert.equal(list[i].from, list[i - 1].to, `${figure} contiguous at ${i}`);
  assert.equal(list[list.length - 1].to, api.GUIDE_FIGURES[figure].beats, `${figure} covers its ${api.GUIDE_FIGURES[figure].beats} beats`);
}
console.log('PASS transitions : chaque figure du mode jeu couverte de 0 à sa fin, sans trou ni chevauchement');

// 2. Fields and sources.
let count = 0;
for (const key of api.TRANSITION_KEYS) for (const t of api.transitionsOf(key)) {
  for (const field of ['title', 'leader', 'follower', 'contacts']) assert(t[field] && t[field].trim().length > (field === 'title' ? 3 : 10), `${key} ${t.title} ${field}`);
  assert(t.sources.length > 0, `${key} ${t.title} sources`);
  for (const s of t.sources) {
    if (/^R\d+$/.test(s)) assert(rules.has(s), `${key}: rule ${s} exists`);
    else if (/^S\d+$/.test(s)) assert(refs.has(s), `${key}: reference ${s} exists`);
    else assert(s === 'Pr' || /^#\d+$/.test(s), `${key}: source ${s} format`);
  }
  // 4. The follower never leaves before the leader (R24).
  assert(!/avant le guideur\b(?!, jamais)|anticipe/.test(t.follower.replace('jamais avant le guideur', '')), `${key} ${t.title}: no anticipation`);
  // 6. #194: the texts say « guideur » and « suiveuse », never the former words.
  for (const field of ['title', 'leader', 'follower', 'contacts']) assert(!/\b(leader|suiveur)\b/i.test(t[field]), `${key} ${t.title} ${field}: « guideur » et « suiveuse »`);
  count++;
}
console.log(`PASS ${count} transitions : titre, guideur, suiveuse, contacts et sources (règles et références existantes) ; ni « leader » ni « suiveur »`);

// 3. transitionAt.
for (const key of api.TRANSITION_KEYS) {
  const list = api.transitionsOf(key);
  for (const t of list) {
    assert.equal(api.transitionAt(key, (t.from + t.to) / 2), t, `${key} at the middle of ${t.title}`);
    assert.equal(api.transitionAt(key, t.to), t, `${key}: the pose at ${t.to} is explained by ${t.title}`);
  }
  assert.equal(api.transitionAt(key, 0), list[0], `${key} at 0`);
  assert.equal(api.transitionAt(key, list[list.length - 1].to + 3), list[list.length - 1], `${key} after the end`);
  assert.equal(api.transitionAt(key, -1), list[0], `${key} before 0`);
}
console.log('PASS transitionAt : transition en cours, la dernière après la fin');

// 4. Consistency with the decisions.
const g = api.transitionsOf('sortieG');
for (const i of [0, 1]) assert.match(g[i].follower, /[Rr]ecule/, `sortie garçon action ${i + 1}: the follower walks back (#110)`);
for (const key of ['sortieG', 'sortieF', 'sortieF:back']) assert.match(api.transitionsOf(key).at(-1).follower, /sans transfert/, `${key}: marka without transfer`);
assert.match(api.transitionsOf('quart')[0].leader, /diagonale/, 'quart: the diagonal (R25)');
console.log('PASS cohérence : suiveuse qui recule dans la sortie garçon, markas sans transfert, diagonale des quarts');

// 5. Composite figures reuse the simple ones word for word.
const text = t => [t.title, t.leader, t.follower, t.contacts].join('|');
const same = (a, b, label) => assert.equal(text(a), text(b), label);
const f = api.transitionsOf('sortieF'), fg = api.transitionsOf('sortieFG');
for (let i = 0; i < 3; i++) same(fg[i], f[i], `sortieFG ${i}: sortie fille action ${i + 1}`);
for (let i = 2; i < 5; i++) same(fg[i + 2], g[i], `sortieFG: sortie garçon action ${i + 1}`);
const gi = api.transitionsOf('sortieGI'), fi = api.transitionsOf('sortieFI');
same(gi[2], api.transitionsOf('ida')[0], 'sortieGI: forward G ida slot');
same(fi[2], api.transitionsOf('idaArr')[0], 'sortieFI: backward G ida slot');
for (let i = 2; i < 5; i++) { same(gi[i + 1], g[i], `sortieGI action ${i + 1}`); same(fi[i + 1], f[i], `sortieFI action ${i + 1}`); }
same(api.transitionsOf('idaD')[0], api.transitionsOf('ida')[2], 'idaD starts with the forward D slot');
console.log('PASS figures composées : entrées reprises mot pour mot des figures simples');
