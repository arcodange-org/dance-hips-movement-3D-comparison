// #31 — share URL restore tested end to end: the state App writes (buildShareUrl) is the state it reads
// back (parseShareParams), including the clock seek of the pair figures (sortieBeat).
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
const bundle = new URL("./.test-share-params-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['share', 'shareParams', 'sortieFille', 'sortieGarcon'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const parse = (url, current = { mode: 'solo', movement: 'none' }) => api.parseShareParams(new URL(url, 'https://x.test').searchParams, current);
const share = state => api.buildShareUrl('https://x.test/', state, null, null);

// 1. Round trip of the state App writes (same keys as App's share button).
const state = { mode: 'pair', style: 'semba', styleB: 'kizomba', bpm: 90, travel: 0.4, amp: 1.5, playing: false,
  torso: true, muscles: false, repere: true, appui: false, sortieG: true, sortieVariant: 'right', sortieContra: 18,
  placement: 'face', contra: 0, sortieBeat: 2, plant: true, corridinho: false, ligne: true, iso: true, cadre: false,
  quarts: false, temps3: false, ida: false, dir: -1, ghost: 'B', boussole: false, contacts: true };
const s = parse(share(state));
assert.deepEqual({ mode: s.mode, styleA: s.styleA, styleB: s.styleB, bpm: s.bpm, travel: s.travel, amp: s.amp, playing: s.playing,
  torso: s.torso, muscles: s.muscles, repere: s.repere, appui: s.appui, movement: s.movement, sortieVariant: s.sortieVariant,
  sortieContra: s.sortieContra, placement: s.placement, contraposition: s.contraposition, seek: s.seek, plant: s.plant,
  ligne: s.ligne, iso: s.iso, cadre: s.cadre, dir: s.dir, ghost: s.ghost, boussole: s.boussole, contacts: s.contacts },
  { mode: 'pair', styleA: 'semba', styleB: 'kizomba', bpm: 90, travel: 0.4, amp: 1.5, playing: false, torso: true, muscles: false,
    repere: true, appui: false, movement: 'sortieG', sortieVariant: 'right', sortieContra: 18, placement: 'face', contraposition: 0,
    seek: 2, plant: true, ligne: true, iso: true, cadre: false, dir: -1, ghost: 'B', boussole: false, contacts: true });
const fille = parse(share({ ...state, sortieG: undefined, sortieF: true, sortieFilleVariant: 'back', sortieBeat: 3.5 }));
assert.equal(fille.movement, 'sortieF'); assert.equal(fille.sortieFilleVariant, 'back'); assert.equal(fille.seek, api.sortieFilleBeat(3.5));
console.log('PASS partage : l’état écrit par buildShareUrl est relu à l’identique (sortie garçon, sortie fille, pose en cours)');

// 2. The seek follows the mode and the movement, from the URL or from the current state.
assert.equal(parse('/?mode=pair&sortie=1&sortieBeat=4').movement, 'sortieG', 'legacy sortie=1');
assert.equal(parse('/?mode=pair&sortie=1&sortieBeat=4').seek, api.sortieGarconBeat(4));
assert.equal(parse('/?mode=solo&sortieG=1&sortieBeat=2').seek, undefined, 'no seek outside the pair mode');
assert.equal(parse('/?sortieG=1&sortieBeat=2', { mode: 'pair', movement: 'none' }).seek, 2, 'current mode pair');
assert.equal(parse('/?mode=pair&quarts=1&sortieBeat=3').seek, 3);
assert.equal(parse('/?mode=pair&ida=1&sortieBeat=-1').seek, undefined, 'negative beat ignored');
assert.equal(parse('/?mode=pair&sortieBeat=1.5', { mode: 'pair', movement: 'none' }).seek, 1.5, 'pair without figure');
assert.equal(parse('/?mode=pair&corridinho=1&sortieBeat=2').seek, undefined, 'no seek for the corridinho');
console.log('PASS partage : pose reprise en paire seulement, selon la figure de l’URL ou celle en cours');

// 3. Invalid values are ignored; exclusive movements keep one.
const bad = parse('/?mode=dance&style=salsa&bpm=500&amp=3&travel=2&dir=2&ghost=C&musique=Z&son=0');
assert.deepEqual(bad, {}, `invalid values ignored: ${JSON.stringify(bad)}`);
assert.equal(parse('/?quarts=1&ida=1').movement, parse('/?ida=1&quarts=1').movement, 'one exclusive movement, order-independent');
assert.equal(parse('/?quarts=0').movement, 'none', 'a movement switched off');
assert.equal(parse('/?musique=B&son=1').musique, 'B'); assert.equal(parse('/?son=1').son, true);
assert.equal(parse('/?source=synthese').source, 'synthese'); assert.equal(parse('/?source=radio').source, undefined);
console.log('PASS partage : valeurs invalides ignorées, mouvements exclusifs');
