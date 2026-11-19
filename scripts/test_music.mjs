#!/usr/bin/env node
// Son synthétisé (#44, docs/spec-son-synthese.md) : grilles, accents par style, fenêtres de
// planification, humanisation, transport audio → temps de la danse, moteur sur sortie factice.
// Sans navigateur : la synthèse Web Audio (src/music/synth.ts) n'est pas exercée ici.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";

const bundle = new URL("./.test-music-bundle.mjs", import.meta.url);
buildSync({
  stdin: { contents: ["music/patterns", "music/scheduler", "clock", "styles"].map((n) => `export * from "./src/${n}";`).join("\n"),
    resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent",
});
const api = await import(bundle.href);
unlinkSync(bundle);
const { MUSIC_STYLES, TIMBRES, CHORDS, PITCHED_TIMBRES, parseSteps, gridNotes, gridLines, eventsInWindow, stepBeat,
  createTransport, beatAt, timeOfBeat, playAt, pauseAt, retempoAt, seekAt, MusicEngine, LOOKAHEAD_S, MAX_LATE_S,
  createDanceClock, seekClock, advanceClock, stepTransport, STYLES } = api;

const near = (a, b, tol = 1e-9, msg = "") => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} != ${b} (tol ${tol})`);
const key = (e) => `${e.track}@${e.beat.toFixed(6)}`;

// ---------------------------------------------------------------- 1. grilles bien formées
assert.deepEqual(Object.keys(MUSIC_STYLES).sort(), Object.keys(STYLES).sort(), "une musique par style de danse");
const EVIDENCE = new Set(["documenté", "faible", "proposition"]);
for (const st of Object.values(MUSIC_STYLES)) {
  const where = (t) => `${st.key}/${t}`;
  assert.ok(st.bpm.min <= st.bpm.default && st.bpm.default <= st.bpm.max, where("tempo conseillé dans sa plage"));
  assert.ok(st.bpm.default >= 24 && st.bpm.default <= 140, where("tempo conseillé dans la plage du curseur"));
  assert.ok(st.swing >= 0 && st.swing < 1, where("swing"));
  assert.equal(st.harmony.length, 4, where("harmonie sur 4 grilles"));
  for (const h of st.harmony) for (const c of h.split("|")) assert.ok(CHORDS[c], where(`accord ${c}`));
  const ids = new Set();
  for (const tr of st.tracks) {
    assert.ok(!ids.has(tr.id), where(`piste ${tr.id} unique`)); ids.add(tr.id);
    assert.ok(TIMBRES.includes(tr.timbre), where(`timbre connu ${tr.timbre}`));
    assert.ok(EVIDENCE.has(tr.evidence), where(`${tr.id} : niveau de preuve`));
    assert.ok(tr.source && tr.source.length > 3, where(`${tr.id} : source`));
    const pitched = PITCHED_TIMBRES.includes(tr.timbre);
    const lines = [tr.steps, ...Object.values(st.variations).map((v) => v.set?.[tr.id]).filter(Boolean)];
    for (const line of lines) {
      const toks = parseSteps(line);
      assert.equal(toks.length, 16, where(`${tr.id} : 16 pas`));
      const allowed = pitched ? ["R", "3", "5", "6", "7", "-", "."] : ["X", "x", "o", "."];
      toks.forEach((t, i) => {
        assert.ok(allowed.includes(t), where(`${tr.id} : jeton ${t} au pas ${i}`));
        if (t === "-") assert.ok(i > 0 && toks[i - 1] !== ".", where(`${tr.id} : tenue précédée d'une note au pas ${i}`));
      });
    }
    let hits = 0;
    for (let g = 0; g < 4; g++) hits += gridNotes(st, g).filter((n) => n.track === tr.id).length;
    assert.ok(hits > 0, where(`${tr.id} joue au moins une fois par cycle`));
  }
  for (const [g, v] of Object.entries(st.variations)) {
    assert.ok(EVIDENCE.has(v.evidence) && v.note, where(`variation ${g} : note et niveau de preuve`));
    for (const id of [...Object.keys(v.set ?? {}), ...Object.keys(v.add ?? {}), ...Object.keys(v.mute ?? {}),
      ...Object.keys(v.gainDb ?? {}), ...(v.muteAllExcept?.keep ?? [])]) assert.ok(ids.has(id), where(`variation ${g} : piste ${id}`));
    for (const adds of Object.values(v.add ?? {})) for (const a of adds) assert.ok(a.step >= 0 && a.step < 16, where("pas ajouté"));
  }
  for (let g = 0; g < 4; g++) for (const n of gridNotes(st, g)) {
    assert.ok(n.velocity > 0 && n.velocity <= 1, where(`vélocité ${n.track}`));
    assert.ok(n.durationSteps >= 1 && n.step + n.durationSteps <= 16, where(`durée ${n.track}`));
    if (PITCHED_TIMBRES.includes(n.timbre)) assert.ok(n.midi.length > 0 && n.midi.every((m) => m >= 24 && m <= 96), where(`hauteurs ${n.track}`));
  }
}
console.log("PASS music: six grilles bien formées (16 pas, timbres connus, niveau de preuve et source par piste)");

// ---------------------------------------------------------------- 2. accents conformes à docs/musique/
const steps = (style, track, grid = 0) => gridNotes(MUSIC_STYLES[style], grid).filter((n) => n.track === track).map((n) => n.step);
const velAt = (style, track, step, grid = 0) => gridNotes(MUSIC_STYLES[style], grid).find((n) => n.track === track && n.step === step)?.velocity;

// Kompa : grosse caisse 1 et 3, tanbou 2 et 4, cloche en croches accentuée sur les temps, basse en marche.
assert.deepEqual(steps("kompa", "KICK"), [0, 8]);
assert.deepEqual(steps("kompa", "TANBOU"), [4, 12]);
assert.deepEqual(steps("kompa", "COWBELL"), [0, 2, 4, 6, 8, 10, 12, 14]);
assert.ok(velAt("kompa", "COWBELL", 4) > velAt("kompa", "COWBELL", 6));
assert.deepEqual(gridNotes(MUSIC_STYLES.kompa, 0).filter((n) => n.track === "BASS").map((n) => n.midi[0] - 36), [0, 4, 7, 9], "C7 : R 3 5 6");
assert.deepEqual(steps("kompa", "BRASS", 0), []); assert.deepEqual(steps("kompa", "BRASS", 1), [0]);
assert.deepEqual(steps("kompa", "FLOOR_TOM", 3), [7, 13, 14, 15]);
// Kizomba : temps forts 1 (0,9) et 3 (0,6), claquement 2 et 4 sous la grosse caisse, rim 3-3-2.
assert.deepEqual(steps("kizomba", "KICK_SOFT"), [0, 8]);
near(velAt("kizomba", "KICK_SOFT", 0), 0.9); near(velAt("kizomba", "KICK_SOFT", 8), 0.6);
assert.deepEqual(steps("kizomba", "CLAP"), [4, 12]);
assert.ok(velAt("kizomba", "CLAP", 4) < velAt("kizomba", "KICK_SOFT", 8), "le claquement ne dépasse jamais la grosse caisse");
assert.deepEqual(steps("kizomba", "RIM"), [0, 3, 6, 8, 11, 14]);
assert.deepEqual(steps("kizomba", "SHAKER", 3).filter((s) => s >= 12), [], "respiration grille 4");
assert.ok(steps("kizomba", "RIM", 3).includes(15));
near(gridNotes(MUSIC_STYLES.kizomba, 2).find((n) => n.track === "BASS" && n.step === 12).midi[0], 45 + 4, 0, "A7 : do dièse");
// Semba (2/4) : ngoma grave sur chaque premier temps de 2/4, dikanza sur toutes les doubles-croches, break.
assert.equal(MUSIC_STYLES.semba.meter, "2/4");
assert.deepEqual(steps("semba", "NGOMA_L"), [0, 4, 8, 12]);
near(velAt("semba", "NGOMA_L", 0), 1); near(velAt("semba", "NGOMA_L", 8), 1); near(velAt("semba", "NGOMA_L", 4), 0.35);
assert.deepEqual(steps("semba", "SCRAPER"), [...Array(16).keys()]);
assert.ok(MUSIC_STYLES.semba.swing > 0);
assert.deepEqual(gridNotes(MUSIC_STYLES.semba, 3).filter((n) => n.step >= 12).map((n) => n.track), ["NGOMA_L"], "break de la grille 4");
// Tarraxinha : claquement demi-tempo sur le temps 3 seulement, suspension de la grille 4.
assert.deepEqual(steps("tarraxinha", "CLAP"), [8]);
assert.deepEqual(steps("tarraxinha", "KICK"), [0, 10]);
for (const g of [0, 1, 3]) assert.deepEqual(steps("tarraxinha", "HAT_C", g), []);
assert.deepEqual(steps("tarraxinha", "HAT_C", 2), [2, 6, 10, 14]);
const t3 = gridNotes(MUSIC_STYLES.tarraxinha, 3);
assert.ok(t3.every((n) => n.track === "SUB" || n.step + n.durationSteps <= 12), "silence sur 12–15 sauf la basse");
assert.ok(t3.some((n) => n.track === "SUB" && n.step + n.durationSteps === 16), "basse tenue jusqu'à la reprise");
near(gridNotes(MUSIC_STYLES.tarraxinha, 0).find((n) => n.track === "SUB").midi[0], 33, 0, "Am : A1 = 55 Hz");
// Suave : grosse caisse 1 et pas 10, rim retiré en grille 3, accord coupé en deux en grille 4.
assert.deepEqual(steps("suave", "KICK_SOFT"), [0, 10]);
assert.deepEqual(steps("suave", "RIM", 2), []);
assert.deepEqual(steps("suave", "KICK_SOFT", 3), [0]);
const pads = gridNotes(MUSIC_STYLES.suave, 3).filter((n) => n.track === "PAD");
assert.deepEqual(pads.map((n) => [n.step, n.durationSteps]), [[0, 8], [8, 8]], "E7sus4 puis E7");
assert.notDeepEqual(pads[0].midi, pads[1].midi);
// Zouk brésilien : boom (1), chick-chick (3 et 4) ; tresillo en grille 3 ; pas de grosse caisse en grille 4.
assert.deepEqual(steps("zouk", "KICK"), [0]);
assert.deepEqual(steps("zouk", "RIM"), [8, 12]);
near(velAt("zouk", "RIM", 8), 0.65); near(velAt("zouk", "RIM", 12), 0.55);
assert.deepEqual(steps("zouk", "RIM", 2), [6, 12]);
assert.deepEqual(steps("zouk", "HAT_C"), [0, 3, 6, 8, 11, 14]);
assert.deepEqual(steps("zouk", "KICK", 3), []);
// Tous les styles : la frappe grave la plus forte de la première grille est sur le temps 1.
for (const st of Object.values(MUSIC_STYLES)) {
  const low = gridNotes(st, 0).filter((n) => ["KICK", "KICK_SOFT", "NGOMA_L"].includes(n.timbre));
  const max = Math.max(...low.map((n) => n.velocity));
  assert.equal(low.find((n) => n.velocity === max).step, 0, `${st.key} : accent grave sur le temps 1`);
}
console.log("PASS music: accents par style conformes à docs/musique (kompa 1-3/2-4, semba 2/4, zouk boom-chick-chick…)");

// ---------------------------------------------------------------- 3. fenêtres [de, à)
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32);
for (const st of Object.keys(MUSIC_STYLES)) {
  const whole = eventsInWindow(st, 0, 64);
  const keys = whole.map(key);
  assert.equal(new Set(keys).size, keys.length, `${st} : pas de doublon`);
  for (let trial = 0; trial < 20; trial++) {
    const cuts = [0];
    while (cuts[cuts.length - 1] < 64) cuts.push(Math.min(64, cuts[cuts.length - 1] + rand() * 1.3));
    const parts = [];
    for (let i = 0; i < cuts.length - 1; i++) parts.push(...eventsInWindow(st, cuts[i], cuts[i + 1]));
    assert.deepEqual(parts.map(key), keys, `${st} : partition aléatoire ${trial} sans doublon ni oubli`);
    assert.deepEqual(parts.map((e) => e.offsetMs), whole.map((e) => e.offsetMs), `${st} : humanisation stable par fenêtre`);
  }
  // Bornes semi-ouvertes : une note exactement sur 4 appartient à [4, 8), pas à [0, 4).
  assert.ok(!eventsInWindow(st, 0, 4).some((e) => e.beat >= 4));
  assert.ok(eventsInWindow(st, 4, 8).some((e) => e.beat === 4));
  // Boucle de 16 temps, et temps négatifs (modulo).
  const strip = (es, shift) => es.map((e) => `${e.track}@${(e.beat - shift).toFixed(6)}:${e.midi.join("/")}:${e.velocity.toFixed(4)}`);
  const base = strip(eventsInWindow(st, 0, 16, { humanize: false }), 0);
  assert.deepEqual(strip(eventsInWindow(st, 16, 32, { humanize: false }), 16), base, `${st} : boucle de 16 temps`);
  assert.deepEqual(strip(eventsInWindow(st, -16, 0, { humanize: false }), -16), base, `${st} : temps négatifs`);
  // Pistes coupées.
  assert.ok(!eventsInWindow(st, 0, 16, { muted: ["BASS", "PAD"] }).some((e) => e.track === "BASS" || e.track === "PAD"));
  // Fenêtres vides ou invalides.
  assert.deepEqual(eventsInWindow(st, 3, 3), []); assert.deepEqual(eventsInWindow(st, 5, 2), []); assert.deepEqual(eventsInWindow(st, NaN, 2), []);
}
// Swing : la double-croche impaire est retardée d'une fraction de double-croche.
near(stepBeat(0, 1, 0.15), (1 + 0.15) / 4); near(stepBeat(2, 8, 0.15), 8 + 2); near(stepBeat(-1, 3, 0), -4 + 0.75);
assert.ok(eventsInWindow("semba", 0, 4).some((e) => Math.abs(e.beat - 1.15 / 4) < 1e-9), "semba swingué");
console.log("PASS music: fenêtres semi-ouvertes sans doublon ni oubli (partitions aléatoires, boucle, temps négatifs, swing)");

// ---------------------------------------------------------------- 4. humanisation déterministe et bornée
for (const st of Object.values(MUSIC_STYLES)) {
  const a = eventsInWindow(st.key, 0, 32, { seed: 7 });
  const b = eventsInWindow(st.key, 0, 32, { seed: 7 });
  assert.deepEqual(a, b, `${st.key} : déterministe`);
  const plain = eventsInWindow(st.key, 0, 32, { humanize: false });
  a.forEach((e, i) => {
    assert.ok(Math.abs(e.offsetMs) <= st.humanizeMs + 1e-9, `${st.key} : décalage borné`);
    assert.ok(Math.abs(e.velocity / plain[i].velocity - 1) <= e.velJitter + 1e-9 || e.velocity === 1, `${st.key} : vélocité bornée`);
  });
  assert.ok(a.some((e) => e.offsetMs !== 0), `${st.key} : humanisation active`);
  const c = eventsInWindow(st.key, 0, 32, { seed: 8 });
  assert.notDeepEqual(c.map((e) => e.offsetMs), a.map((e) => e.offsetMs), `${st.key} : la graine change le tirage`);
}
assert.ok(MUSIC_STYLES.kompa.humanizeMs <= 2 && MUSIC_STYLES.tarraxinha.humanizeMs <= 2, "régularité kompa/tarraxinha");
console.log("PASS music: humanisation déterministe (graine) et bornée (±4 ms, ±2 ms kompa et tarraxinha)");

// ---------------------------------------------------------------- 5. transport : horloge audio → temps
{
  let tr = createTransport(10, 2, 120, true);
  near(beatAt(tr, 10), 2); near(beatAt(tr, 11.5), 5); near(timeOfBeat(tr, 5), 11.5);
  tr = retempoAt(tr, 11, 60); near(beatAt(tr, 11), 4, 1e-12, "tempo : temps continu"); near(beatAt(tr, 12), 5);
  tr = pauseAt(tr, 12.5); near(beatAt(tr, 12.5), 5.5); near(beatAt(tr, 99), 5.5, 0, "pause : temps figé");
  tr = playAt(tr, 20, 5.5); near(beatAt(tr, 21), 6.5, 1e-12, "reprise au temps affiché");
  tr = seekAt(tr, 30, 0); near(beatAt(tr, 30), 0); near(beatAt(tr, 30.5), 0.5);
  for (let i = 0; i < 200; i++) { // ré-ancrages aléatoires : b(t) continu et linéaire par morceaux
    const t = 30 + i * 0.1, before = beatAt(tr, t);
    tr = retempoAt(tr, t, 24 + Math.floor(rand() * 117));
    near(beatAt(tr, t), before, 1e-9, "continuité au changement de tempo");
  }
}
// stepTransport : sans pilote, advanceClock strictement inchangé ; avec pilote actif, l'horloge audio.
{
  const a = createDanceClock(), b = createDanceClock();
  for (const [d, bpm, play] of [[0.016, 90, true], [0.5, 120, true], [0.02, 32, false], [0.03, 140, true]]) {
    advanceClock(a, d, bpm, play, 7); stepTransport(b, d, bpm, play, 7, null);
    assert.deepEqual(b, a, "son coupé : comportement identique");
    stepTransport(b, 0, bpm, play, 7, { drive: () => false }); assert.deepEqual(b, a);
  }
  const c = createDanceClock();
  stepTransport(c, 0.016, 90, true, Infinity, { drive: (clock) => { clock.beat = 3.25; return true; } });
  near(c.beat, 3.25, 0, "son actif : temps fourni par l'horloge audio");
}
console.log("PASS music: transport audio (lecture, pause, tempo continu, saut) et repli advanceClock son coupé");

// ---------------------------------------------------------------- 6. moteur sur sortie factice
function fakeOutput(latency = 0.02) {
  const o = { t: 0, latency, plays: [], silences: 0 };
  o.now = () => o.t;
  o.audibleNow = () => o.t - o.latency;
  o.play = (ev, when, spb) => { const h = { ev, when, spb, at: o.t, cancelled: false }; o.plays.push(h); return h; };
  o.cancel = (h) => { assert.ok(!h.cancelled, "annulation unique"); h.cancelled = true; };
  o.silence = () => { o.silences++; for (const p of o.plays) if (p.when >= o.t - 5) p.silenced = true; };
  return o;
}
const live = (o) => o.plays.filter((p) => !p.cancelled && !p.silenced);

// 6a. Lecture continue à travers des changements de tempo, de style et de pistes : chaque note jouée une fois,
// à l'instant prévu par le tempo de son segment, jamais dans le passé.
for (const st of Object.keys(MUSIC_STYLES)) {
  const out = fakeOutput();
  const clock = createDanceClock(); clock.beat = 1.5;
  const settings = { style: st, bpm: 90, playing: true, muted: [] };
  const eng = new MusicEngine(out, settings, clock, 3);
  near(eng.beatNow(), 1.5, 1e-12, "activation : temps affiché continu");
  const segments = [{ ...eng.transport }];
  let changed = 0;
  while (out.t < 12) {
    out.t += 0.01 + rand() * 0.03;
    if (changed === 0 && out.t > 3) { eng.update({ ...settings, bpm: 124 }, clock); segments.push({ ...eng.transport }); changed++; }
    if (changed === 1 && out.t > 6) { eng.update({ ...settings, bpm: 124, muted: ["SHAKER"] }, clock); changed++; }
    if (changed === 2 && out.t > 8) { eng.update({ ...settings, bpm: 124, muted: [] }, clock); changed++; }
    eng.schedule();
    eng.syncClock(clock);
    near(clock.beat, beatAt(eng.transport, out.t - out.latency), 1e-9, "temps de la danse = temps entendu");
  }
  const eff = live(out);
  const effKeys = eff.map((p) => key(p.ev));
  assert.equal(new Set(effKeys).size, effKeys.length, `${st} : aucune note doublée`);
  const end = beatAt(eng.transport, out.t + LOOKAHEAD_S); // curseur après la dernière planification
  // Hors de la fenêtre où SHAKER était coupé, toutes les notes de [1,5 ; fin) sont jouées exactement une fois.
  const expected = eventsInWindow(st, 1.5, end, { seed: 3 });
  const expKeys = new Set(expected.map(key));
  for (const k of effKeys) assert.ok(expKeys.has(k), `${st} : note inattendue ${k}`);
  const missing = expected.filter((e) => !effKeys.includes(key(e)));
  assert.ok(missing.every((e) => e.track === "SHAKER"), `${st} : seules les notes de la piste coupée manquent`);
  if (st === "kizomba") assert.ok(missing.length > 0, "la piste coupée s'est tue");
  for (const p of eff) {
    const seg = p.ev.beat >= segments[1].anchorBeat ? segments[1] : segments[0];
    near(p.when - p.ev.offsetMs / 1000, timeOfBeat(seg, p.ev.beat), 1e-9, `${st} : instant au tempo du segment`);
    near(p.spb, 60 / seg.bpm, 1e-12);
    assert.ok(p.when >= p.at - out.latency - 0.005 - 1e-9, `${st} : jamais programmée dans le passé (hors latence de départ)`);
    assert.ok(p.when <= p.at + LOOKAHEAD_S + 0.005, `${st} : avance bornée`);
  }
}
// 6b. Saut (seekClock incrémente clock.revision) : coupure, ré-ancrage, le temps fort d'arrivée sonne.
{
  const out = fakeOutput(0.015);
  const clock = createDanceClock();
  const eng = new MusicEngine(out, { style: "kompa", bpm: 120, playing: true }, clock);
  for (let i = 0; i < 100; i++) { out.t += 0.02; eng.schedule(); eng.syncClock(clock); }
  seekClock(clock, 8);
  const before = out.plays.length, silences = out.silences;
  eng.syncClock(clock);
  assert.equal(out.silences, silences + 1, "saut : coupure");
  near(clock.beat, 8, 1e-12, "saut : temps de la danse au point d'arrivée");
  const afterSeek = out.plays.slice(before).map((p) => p.ev);
  assert.ok(afterSeek.some((e) => e.track === "KICK" && e.beat === 8), "le temps fort d'arrivée (grosse caisse, temps 1) sonne");
  assert.ok(afterSeek.every((e) => e.beat >= 8), "rien d'avant le point d'arrivée");
  for (let i = 0; i < 100; i++) { out.t += 0.02; eng.schedule(); eng.syncClock(clock); }
  const eff = live(out).map((p) => key(p.ev));
  assert.equal(new Set(eff).size, eff.length, "saut : aucune note doublée");
  assert.deepEqual(eff, eventsInWindow("kompa", 8, beatAt(eng.transport, out.t + LOOKAHEAD_S)).map(key).filter((k) => eff.includes(k)));
  // Fin d'une figure en cinq actions : le temps est borné par endBeat.
  eng.syncClock(clock, 9); near(clock.beat, 9, 0, "endBeat respecté");
}
// 6c. Pause et reprise : le temps reste figé, la reprise part du temps affiché.
{
  const out = fakeOutput(0.02);
  const clock = createDanceClock();
  const s = { style: "zouk", bpm: 80, playing: true };
  const eng = new MusicEngine(out, s, clock);
  for (let i = 0; i < 50; i++) { out.t += 0.02; eng.schedule(); eng.syncClock(clock); }
  const paused = clock.beat;
  eng.update({ ...s, playing: false }, clock);
  const n = out.plays.length;
  for (let i = 0; i < 50; i++) { out.t += 0.02; eng.schedule(); eng.syncClock(clock); }
  near(clock.beat, paused, 0, "pause : temps figé");
  assert.equal(out.plays.length, n, "pause : rien n'est programmé");
  eng.update({ ...s, playing: true }, clock);
  near(eng.beatNow(), paused, 1e-12, "reprise continue");
  // Tempo changé pendant la pause : pris en compte à la reprise.
  eng.update({ ...s, playing: false }, clock); eng.update({ ...s, playing: false, bpm: 100 }, clock);
  eng.update({ ...s, playing: true, bpm: 100 }, clock);
  out.t += 0.6; eng.syncClock(clock);
  near(clock.beat, paused + 1, 1e-9, "reprise au nouveau tempo (0,6 s à 100 bpm = 1 temps)");
}
// 6d. Trou de la boucle (onglet masqué) : pas de rafale de notes passées.
{
  const out = fakeOutput(0);
  const clock = createDanceClock();
  const eng = new MusicEngine(out, { style: "semba", bpm: 120, playing: true }, clock);
  out.t = 2; const n = out.plays.length; eng.schedule();
  assert.ok(out.plays.slice(n).every((p) => p.when >= out.t - MAX_LATE_S), "notes trop anciennes sautées");
}
console.log("PASS music: moteur (tempo/pistes sans doublon ni oubli, saut, pause, endBeat, trou de boucle) sur sortie factice");
