#!/usr/bin/env node
// Musique enregistrée générée par IA (#142, docs/spec-musique-elevenlabs.md) : position dans la
// boucle, fondu de raccord, moteur de boucle sur sortie factice, registre des pistes, analyse de
// tempo sur un signal de synthèse, prompts et script de génération (sans réseau).
// Sans navigateur : le port Web Audio (src/music/loopOutput.ts) n'est pas exercé ici.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { buildSync } from "esbuild";
import { existsSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { A_EVITER, BLOC_MAX_S, CREDITS_PAR_MINUTE, DUREE_ESSAI, MODELE, PROMPTS, TEMPS_PAR_SECTION, VARIANTES, coutEstime, creditsPour, planDe, texteDe } from "./musique_prompts.mjs";
import { ANALYSIS_RATE, analyseTempo } from "./tempo.mjs";
import { SEUILS, corpsRequete, ecrireRegistre, lireArguments, lireRegistre, plan, signature, tableauProvenance } from "./generer_musique.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = new URL("./.test-musique-enregistree-bundle.mjs", import.meta.url);
buildSync({
  stdin: { contents: ["music/recordings", "music/recordings.data", "music/loop", "music/scheduler", "music/patterns", "clock", "shareParams", "share"].map((n) => `export * from "./src/${n}";`).join("\n"),
    resolveDir: root },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/app/"' }, logLevel: "silent",
});
const api = await import(bundle.href);
unlinkSync(bundle);
const { RECORDINGS, RECORDING_DATA, RECORDING_CREDIT, recordingOf, recordingProblems, recordingTempo, recordingUrl,
  positionOfBeat, advancePosition, loopSeconds, loopEnd, rateOf, crossfadeLoop, LoopEngine, LOOP_FADE_S,
  beatAt, MUSIC_STYLES, createDanceClock, seekClock, parseShareParams, buildShareUrl } = api;

const near = (a, b, tol = 1e-9, msg = "") => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} != ${b} (tol ${tol})`);

/** Piste d'essai : tempo non entier, temps 1 décalé, comme une piste réelle. */
const REC = {
  style: "kizomba", file: "kizomba.mp3", bpm: 101.7, firstBeat: 0.371, beats: 96, duration: 62, gainDb: -3,
  prompt: PROMPTS.kizomba.prompt, model: MODELE, generatedAt: "2026-11-21", measure: { drift: 0.001, confidence: 0.99 },
};

// ---------------------------------------------------------------- 1. position dans la boucle
{
  const spb = 60 / REC.bpm;
  near(loopSeconds(REC), 96 * spb, 1e-12, "durée de la boucle");
  near(loopEnd(REC), REC.firstBeat + 96 * spb, 1e-12, "fin de la boucle");
  for (const b of [0, 96, -96, 960]) near(positionOfBeat(REC, b), REC.firstBeat, 1e-9, `temps ${b} : début de boucle`);
  near(positionOfBeat(REC, 8), REC.firstBeat + 8 * spb, 1e-12, "temps 8");
  near(positionOfBeat(REC, -1), REC.firstBeat + 95 * spb, 1e-9, "temps négatif replié");
  for (let b = -200; b < 400; b += 0.37) {
    const p = positionOfBeat(REC, b);
    assert.ok(p >= REC.firstBeat && p < loopEnd(REC), `position dans la boucle au temps ${b}`);
    near(positionOfBeat(REC, b + 96), p, 1e-9, "périodique de période 96 temps");
  }
  // Continue sur un tour : un petit pas de temps donne un petit pas de position.
  for (let b = 0; b < 95.9; b += 0.05) near(positionOfBeat(REC, b + 0.05) - positionOfBeat(REC, b), 0.05 * spb, 1e-9, "continuité");
  near(rateOf(REC, 90), 90 / 101.7, 1e-12, "vitesse au tempo du curseur");
  near(advancePosition(REC, loopEnd(REC) - 0.1, 0.3, 1), REC.firstBeat + 0.2, 1e-9, "avance repliée dans la boucle");
  console.log("PASS boucle : position périodique, continue, temps 1 sur un multiple de 8 temps");
}

// ---------------------------------------------------------------- 2. fondu de raccord
{
  const sr = 8000;
  const make = () => { const x = new Float32Array(sr * 4); for (let i = 0; i < x.length; i++) x[i] = Math.sin(i * 0.0137) * 0.5 + (i % 97) / 400; return x; };
  // Marge avant le début : la fin de boucle glisse vers ce qui précède le début.
  {
    const x = make(), ref = make();
    const start = 1, end = 3, n = Math.round(LOOP_FADE_S * sr);
    assert.equal(crossfadeLoop(x, sr, start, end), "avant");
    const a = start * sr, b = end * sr;
    for (let i = 0; i < x.length; i++) if (i < b - n || i >= b) assert.equal(x[i], ref[i], `échantillon ${i} inchangé hors du fondu`);
    // Au raccord, le dernier échantillon joué (b − 1) rejoint celui qui précède le début (a − 1).
    near(x[b - 1], ref[a - 1], 0.02, "raccord continu vers le début");
    near(x[b - n], ref[b - n], 0.02, "entrée du fondu continue");
    const before = Math.abs(ref[b - 1] - ref[a]), after = Math.abs(x[b - 1] - x[a]);
    assert.ok(after < 0.02 && before > 0.1, `saut au raccord réduit (${before.toFixed(3)} → ${after.toFixed(3)})`);
  }
  // Marge courte avant le début (piste qui commence presque sur le temps 1) : fondu raccourci,
  // l'attaque du temps 1 n'est pas touchée.
  {
    const x = make(), ref = make();
    const a = Math.round(0.02 * sr), b = 3 * sr;
    assert.equal(crossfadeLoop(x, sr, 0.02, 3), "avant");
    for (let i = 0; i < x.length; i++) if (i < b - a || i >= b) assert.equal(x[i], ref[i], `échantillon ${i} inchangé hors du fondu raccourci`);
    near(x[b - 1], ref[a - 1], 0.02, "raccord continu vers le début (fondu raccourci)");
  }
  // Pas de marge avant le début : le début de boucle part de ce qui suit la fin.
  {
    const x = make(), ref = make();
    const n = Math.round(LOOP_FADE_S * sr), b = 3 * sr;
    assert.equal(crossfadeLoop(x, sr, 0, 3), "après");
    for (let i = n; i < x.length; i++) assert.equal(x[i], ref[i], `échantillon ${i} inchangé hors du fondu`);
    near(x[0], ref[b], 0.02, "raccord continu depuis la fin");
  }
  // Aucune marge : fondu court vers zéro des deux côtés.
  {
    const x = make();
    assert.equal(crossfadeLoop(x, sr, 0, 4), "bords");
    assert.ok(x[0] === 0 && x[x.length - 1] === 0, "zéro de part et d'autre du raccord");
  }
  console.log("PASS boucle : fondu de raccord continu, tampon inchangé ailleurs");
}

// ---------------------------------------------------------------- 3. moteur sur sortie factice
class FakeOut {
  constructor(latency = 0.045) { this.t = 10; this.latency = latency; this.voices = []; }
  now() { return this.t; }
  audibleNow() { return this.t - this.latency; }
  start(rec, position, when, rate) {
    const v = { rec, when, position, rates: [{ at: when, rate }], stopped: null };
    this.voices.push(v);
    return v;
  }
  setRate(v, rate, when) { v.rates.push({ at: when, rate }); }
  stop(v) { v.stopped = this.t; }
  advance(dt) { this.t += dt; }
  live() { return this.voices.filter((v) => v.stopped === null); }
  /** Position de lecture de la voix à l'instant d'émission T (intégrale de la vitesse). */
  positionAt(v, T) {
    let p = v.position, t = v.when;
    for (let i = 0; i < v.rates.length; i++) {
      const until = Math.min(T, i + 1 < v.rates.length ? v.rates[i + 1].at : Infinity);
      if (until > t) { p += (until - t) * v.rates[i].rate; t = until; }
    }
    return REC.firstBeat + (((p - REC.firstBeat) % loopSeconds(REC)) + loopSeconds(REC)) % loopSeconds(REC);
  }
}
/** Écart (s, replié sur la boucle) entre ce qui s'entend et la position du temps affiché. */
function misalignment(out, engine) {
  const live = out.live();
  assert.equal(live.length, 1, "une seule source en vol");
  const T = out.audibleNow();
  if (T < live[0].when) return null; // la source n'a pas encore commencé à s'entendre
  const L = loopSeconds(REC);
  const d = Math.abs(out.positionAt(live[0], T) - positionOfBeat(REC, engine.beatNow()));
  return Math.min(d, L - d);
}
const run = (out, engine, clock, seconds, check = true, step = 1 / 60) => {
  let worst = 0, last = engine.beatNow();
  const frames = Math.round(seconds / step);
  for (let i = 0; i < frames; i++) {
    out.advance(seconds / frames);
    engine.syncClock(clock);
    const b = engine.beatNow();
    assert.ok(b >= last - 1e-9, "le temps ne recule pas");
    last = b;
    if (check) { const m = misalignment(out, engine); if (m !== null) worst = Math.max(worst, m); }
  }
  return worst;
};

{
  // Activation en lecture au temps 5, curseur à 90 bpm.
  const out = new FakeOut(), clock = createDanceClock();
  clock.beat = 5;
  const engine = new LoopEngine(out, REC, { bpm: 90, playing: true }, clock);
  assert.equal(out.voices.length, 1, "une source au démarrage");
  near(engine.beatNow(), 5, 1e-9, "temps affiché continu à l'activation");
  near(out.voices[0].rates[0].rate, 90 / 101.7, 1e-12, "vitesse = tempo du curseur / tempo de la piste");
  assert.ok(out.voices[0].when > out.now(), "départ programmé dans le futur");
  assert.ok(run(out, engine, clock, 2) < 1e-3, "ce qui s'entend correspond au temps affiché (< 1 ms)");
  near(clock.beat, 5 + 2 * 90 / 60, 1e-6, "l'horloge audio pilote le temps de la danse");

  // Changement de tempo : pas de relance, temps continu, calage conservé.
  const before = engine.beatNow();
  engine.update({ bpm: 120, playing: true }, clock);
  assert.equal(out.voices.length, 1, "changement de tempo : la source n'est pas relancée");
  assert.equal(out.voices[0].rates.length, 2, "une seule consigne de vitesse");
  near(engine.beatNow(), before, 1e-9, "temps continu au changement de tempo");
  assert.ok(run(out, engine, clock, 3) < 1e-3, "calage conservé après le changement de tempo");

  // Curseur glissé : plusieurs changements rapprochés (16 ms).
  for (const bpm of [118, 114, 109, 104, 102]) { out.advance(0.016); engine.update({ bpm, playing: true }, clock); engine.syncClock(clock); }
  assert.equal(out.voices.length, 1, "curseur glissé : toujours la même source");
  assert.ok(run(out, engine, clock, 2) < 1e-3, "calage conservé après un glissé du curseur");
  // Pendant un glissé, le temps reste continu d'une image à l'autre.
  let prev = engine.beatNow();
  for (const bpm of [90, 60, 130, 75, 102]) {
    engine.update({ bpm, playing: true }, clock);
    for (let i = 0; i < 6; i++) { out.advance(0.004); const b = engine.beatNow(); assert.ok(b - prev >= 0 && b - prev < 0.004 * 140 / 60 + 1e-9, "pas de saut de temps"); prev = b; }
  }

  // Pause : la source s'arrête, le temps est figé ; reprise au temps affiché.
  engine.update({ bpm: 102, playing: false }, clock);
  assert.equal(out.live().length, 0, "pause : plus de source");
  const frozen = engine.beatNow();
  out.advance(1.5); engine.syncClock(clock);
  near(engine.beatNow(), frozen, 1e-12, "temps figé en pause");
  engine.update({ bpm: 90, playing: false }, clock);
  near(engine.beatNow(), frozen, 1e-12, "changement de tempo en pause : temps inchangé");
  assert.equal(out.live().length, 0, "changement de tempo en pause : pas de source");
  clock.beat = frozen;
  engine.update({ bpm: 90, playing: true }, clock);
  assert.equal(out.live().length, 1, "reprise : une source");
  near(engine.beatNow(), frozen, 1e-9, "reprise sans saut de temps");
  assert.ok(run(out, engine, clock, 2) < 1e-3, "calage après la reprise");

  // Saut : nouvelle source à la position du nouveau temps.
  seekClock(clock, 37.25);
  engine.syncClock(clock);
  assert.equal(out.live().length, 1, "saut : une seule source en vol");
  near(engine.beatNow(), 37.25, 1e-9, "saut : temps affiché");
  assert.ok(run(out, engine, clock, 2) < 1e-3, "calage après le saut");

  // Raccord de boucle : la position reste calée en passant la fin de la boucle.
  seekClock(clock, 95.5);
  engine.syncClock(clock);
  assert.ok(run(out, engine, clock, 3) < 1e-3, "calage en traversant le raccord de boucle");
  assert.ok(engine.beatNow() > 96, "le temps continue au-delà d'un tour de boucle");

  // Fin de figure et export.
  const end = Math.floor(clock.beat) + 1;
  out.advance(5); engine.syncClock(clock, end);
  assert.equal(clock.beat, end, "le temps ne dépasse pas la fin de figure");
  clock.exportFrame = 3; clock.beat = 1.25;
  out.advance(1); engine.syncClock(clock);
  assert.equal(clock.beat, 1.25, "export : l'horloge audio ne touche pas au temps");
  clock.exportFrame = null;
  engine.stop();
  assert.equal(out.live().length, 0, "arrêt : plus de source");
  console.log("PASS moteur de boucle : démarrage, tempo sans relance, pause, reprise, saut, raccord, fin de figure, export");
}
{
  // Piste en cours de chargement : l'horloge tourne en silence, puis la source rejoint le temps courant.
  const out = new FakeOut(), clock = createDanceClock();
  const engine = new LoopEngine(out, REC, { bpm: 102, playing: true }, clock, false);
  assert.equal(out.voices.length, 0, "pas de source tant que la piste n'est pas chargée");
  out.advance(0.8); engine.syncClock(clock);
  near(clock.beat, 0.8 * 102 / 60, 1e-9, "l'horloge avance pendant le chargement");
  engine.setReady();
  assert.equal(out.voices.length, 1, "la source démarre à l'arrivée de la piste");
  assert.ok(run(out, engine, clock, 2) < 1e-3, "calage dès l'arrivée de la piste");
  engine.setReady();
  assert.equal(out.voices.length, 1, "setReady est idempotent");

  // Activation en pause : aucune source avant la lecture.
  const out2 = new FakeOut(), clock2 = createDanceClock();
  clock2.beat = 12;
  const paused = new LoopEngine(out2, REC, { bpm: 90, playing: false }, clock2);
  assert.equal(out2.voices.length, 0, "en pause : pas de source");
  out2.advance(1); paused.syncClock(clock2);
  assert.equal(clock2.beat, 12, "en pause : le temps ne bouge pas");
  paused.update({ bpm: 90, playing: true }, clock2);
  assert.equal(out2.live().length, 1, "lecture : une source");
  assert.ok(run(out2, paused, clock2, 1) < 1e-3, "calage après la mise en lecture");
  console.log("PASS moteur de boucle : chargement en silence, activation en pause");
}

// ---------------------------------------------------------------- 4. registre des pistes
{
  assert.deepEqual(recordingProblems(REC), [], "piste d'essai valide");
  assert.ok(recordingProblems({ ...REC, beats: 60 }).length, "boucle non multiple de 8 refusée");
  assert.ok(recordingProblems({ ...REC, firstBeat: 10 }).length, "boucle qui dépasse le fichier refusée");
  assert.ok(recordingProblems({ ...REC, bpm: 200 }).length, "tempo hors du curseur refusé");
  assert.ok(recordingProblems({ ...REC, file: "../ailleurs.mp3" }).length, "nom de fichier avec chemin refusé");
  assert.ok(recordingProblems({ ...REC, prompt: "" }).length, "prompt manquant refusé");
  assert.equal(recordingTempo(REC), 102, "tempo de la piste arrondi pour le curseur");
  assert.equal(recordingUrl(REC), "/app/musique/kizomba.mp3", "URL sous la base du site");
  assert.equal(recordingUrl(REC, "/x"), "/x/musique/kizomba.mp3");
  assert.equal(recordingOf("toString"), undefined, "clé héritée : pas de piste");
  assert.match(RECORDING_CREDIT, /IA/, "la mention dit que la musique est générée par IA");

  const dossier = join(root, "public", "musique");
  const fichiers = existsSync(dossier) ? readdirSync(dossier).filter((f) => f.endsWith(".mp3")).sort() : [];
  assert.deepEqual(lireRegistre(), JSON.parse(JSON.stringify(RECORDING_DATA)), "le script lit le même registre que l'app");
  assert.deepEqual(RECORDING_DATA.map((r) => r.file).sort(), fichiers, "registre et fichiers de public/musique/ identiques");
  const page = readFileSync(join(root, "docs", "musique", "enregistrements.md"), "utf8");
  assert.match(page, /<!-- pistes -->[\s\S]*<!-- \/pistes -->/, "marqueurs du tableau de provenance");
  assert.ok(page.includes(tableauProvenance(JSON.parse(JSON.stringify(RECORDING_DATA)))), "page de provenance à jour avec le registre");
  const styles = new Set();
  for (const rec of RECORDING_DATA) {
    assert.deepEqual(recordingProblems(rec), [], `${rec.style} : entrée de registre valide`);
    assert.ok(MUSIC_STYLES[rec.style], `${rec.style} : style connu`);
    assert.ok(!styles.has(rec.style), `${rec.style} : une seule piste par style`); styles.add(rec.style);
    assert.equal(rec.file, `${rec.style}.mp3`);
    assert.equal(RECORDINGS[rec.style], rec);
    assert.ok(rec.measure.drift <= SEUILS.derive && rec.measure.confidence >= SEUILS.confiance,
      `${rec.style} : tempo régulier (dérive ${rec.measure.drift} s, confiance ${rec.measure.confidence})`);
  }
  console.log(`PASS registre : ${RECORDING_DATA.length} piste(s), fichiers et page de provenance cohérents`);
}

// ---------------------------------------------------------------- 5. analyse de tempo
function signal({ bpm, first, seconds, ramp = 0, fadeIn = 0 }) {
  const sr = ANALYSIS_RATE, x = new Float32Array(Math.round(seconds * sr));
  let seed = 12345;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 0xffffffff) * 2 - 1; };
  for (let i = 0; i < x.length; i++) x[i] = 0.004 * rnd();
  const add = (t, fn, len) => { const a = Math.round(t * sr); for (let i = 0; i < len * sr && a + i < x.length; i++) if (a + i >= 0) x[a + i] += fn(i / sr); };
  let t = first, k = 0;
  while (t < seconds) {
    const spb = 60 / (bpm + ramp * k), g = fadeIn > 0 ? Math.min(1, t / fadeIn) : 1;
    const amp = (k % 4 === 0 ? 0.9 : k % 4 === 2 ? 0.55 : 0.4) * g;
    add(t, (u) => amp * Math.sin(2 * Math.PI * 60 * u) * Math.exp(-u / 0.06), 0.25); // grosse caisse, accent sur le temps 1
    if (k % 4 === 1 || k % 4 === 3) add(t, (u) => 0.35 * g * rnd() * Math.exp(-u / 0.02), 0.08); // caisse claire
    add(t + spb / 2, (u) => 0.2 * g * rnd() * Math.exp(-u / 0.008), 0.03); // charleston à contretemps
    t += spb; k++;
  }
  return x;
}
{
  for (const c of [
    { bpm: 101.7, first: 0.371, seconds: 62, hint: 102, beats: 96 },
    { bpm: 120.3, first: 0.05, seconds: 68, hint: 120, beats: 128 },
    { bpm: 74.6, first: 1.2, seconds: 56, hint: 75, beats: 64 },
  ]) {
    const r = analyseTempo(signal(c), ANALYSIS_RATE, { hint: c.hint });
    near(r.bpm, c.bpm, 0.05, `tempo mesuré (demandé ${c.hint})`);
    near(r.firstBeat, c.first, 0.005, "premier temps de mesure");
    assert.equal(r.beats, c.beats, "longueur de boucle : plus grand multiple de 32 temps");
    assert.ok(r.drift < 0.005, `dérive nulle (${r.drift})`);
    assert.ok(r.confidence > 0.95, `confiance (${r.confidence})`);
    assert.ok(r.firstBeat + r.beats * 60 / r.bpm <= r.duration, "la boucle tient dans le fichier");
    // Décalage manuel d'une mesure (validation à l'oreille).
    const s = analyseTempo(signal(c), ANALYSIS_RATE, { hint: c.hint, shiftBeats: 4 });
    near(s.firstBeat, c.first + 4 * 60 / c.bpm, 0.005, "décalage manuel de 4 temps");
  }
  // Tempo qui accélère : la mesure le signale (dérive ou trop peu de temps portés par une attaque).
  const wobble = analyseTempo(signal({ bpm: 100, first: 0.3, seconds: 60, ramp: 0.03 }), ANALYSIS_RATE, { hint: 102 });
  assert.ok(wobble.drift > SEUILS.derive || wobble.confidence < SEUILS.confiance, `tempo instable détecté (dérive ${wobble.drift}, confiance ${wobble.confidence})`);
  // Entrée en fondu : la boucle commence quand la musique est pleine.
  const faded = analyseTempo(signal({ bpm: 90.2, first: 0.2, seconds: 64, fadeIn: 6 }), ANALYSIS_RATE, { hint: 90 });
  near(faded.bpm, 90.2, 0.05, "tempo malgré le fondu");
  assert.ok(faded.firstBeat > 2 && faded.firstBeat < 8, `la boucle commence après le fondu (${faded.firstBeat})`);
  const k = (faded.firstBeat - 0.2) / (60 / 90.2);
  near(k, Math.round(k), 0.02, "le début reste sur un temps");
  assert.equal(Math.round(k) % 4, 0, "le début reste sur un premier temps de mesure");
  console.log("PASS analyse de tempo : tempo ± 0,05 bpm, premier temps ± 5 ms, dérive détectée, entrée en fondu écartée");
}
/**
 * Morceau structuré, SANS accent de mesure (grosse caisse égale sur tous les temps, comme la piste
 * kizomba réelle) : `pickup` temps d'anacrouse, une section légère de `light` temps, une section
 * pleine de `fullBeats` temps (plus forte, avec charleston), puis un accord final qui résonne.
 */
function piece({ bpm, first, pickup = 0, light, fullBeats, tail = 5 }) {
  const sr = ANALYSIS_RATE, spb = 60 / bpm, total = pickup + light + fullBeats;
  const x = new Float32Array(Math.round((first + total * spb + tail) * sr));
  let seed = 4242;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 0xffffffff) * 2 - 1; };
  for (let i = 0; i < x.length; i++) x[i] = 0.0005 * rnd();
  const add = (t, fn, len) => { const a = Math.round(t * sr); for (let i = 0; i < len * sr && a + i < x.length; i++) if (a + i >= 0) x[a + i] += fn(i / sr); };
  for (let k = 0; k < total; k++) {
    const t = first + k * spb, loud = k >= pickup + light;
    add(t, (u) => (loud ? 0.8 : 0.4) * Math.sin(2 * Math.PI * 60 * u) * Math.exp(-u / 0.06), 0.25);
    add(t, (u) => (loud ? 0.3 : 0.15) * Math.sin(2 * Math.PI * 220 * u) * Math.exp(-u / 0.2), spb); // basse tenue
    if (loud) add(t + spb / 2, (u) => 0.3 * rnd() * Math.exp(-u / 0.01), 0.04); // charleston à contretemps
  }
  // Accord final sur le temps qui suit la dernière phrase, puis résonance.
  add(first + total * spb, (u) => 0.7 * Math.sin(2 * Math.PI * 110 * u) * Math.exp(-u / 0.7), tail);
  return x;
}
{
  // Début franc, changement de section au temps 33, accord final : la boucle va du temps 1 à la fin
  // de la dernière phrase, et laisse la résonance dehors.
  const a = analyseTempo(piece({ bpm: 101.99, first: 0.03, light: 32, fullBeats: 32 }), ANALYSIS_RATE, { hint: 102 });
  near(a.bpm, 101.99, 0.05, "morceau structuré : tempo");
  near(a.firstBeat, 0.03, 0.005, "morceau structuré : temps 1 au début de la musique");
  assert.equal(a.beats, 64, "morceau structuré : boucle = le morceau sans l'accord final");
  assert.deepEqual(a.structure.votes.map((v) => v.kind).sort(), ["changement de section", "début", "fin"], "trois indices de structure");
  near(a.firstBeat + a.beats * 60 / a.bpm, 0.03 + 64 * 60 / 101.99, 0.01, "la boucle s'arrête avant l'accord final");
  assert.ok(a.drift < 0.005 && a.confidence > 0.9, "morceau structuré : tempo régulier");

  // Anacrouse de 2 temps : le début ne tombe pas sur un temps 1, mais le changement de section et
  // la fin s'accordent et l'emportent.
  const spb = 60 / 90.4;
  const b = analyseTempo(piece({ bpm: 90.4, first: 0.05, pickup: 2, light: 32, fullBeats: 32 }), ANALYSIS_RATE, { hint: 90 });
  near(b.firstBeat, 0.05 + 2 * spb, 0.005, "anacrouse : le temps 1 est après les deux temps de levée");
  assert.equal(b.beats, 64, "anacrouse : boucle de 64 temps");

  // Longueur imposée : ne boucler que la section pleine (réglage à l'oreille, sans nouvelle prise).
  const c = analyseTempo(piece({ bpm: 101.99, first: 0.03, light: 32, fullBeats: 32 }), ANALYSIS_RATE, { hint: 102, shiftBeats: 32, loopBeats: 32 });
  near(c.firstBeat, 0.03 + 32 * 60 / 101.99, 0.005, "section pleine : début décalé de 32 temps");
  assert.equal(c.beats, 32, "section pleine : 32 temps");
  assert.throws(() => analyseTempo(piece({ bpm: 101.99, first: 0.03, light: 32, fullBeats: 32 }), ANALYSIS_RATE, { hint: 102, loopBeats: 20 }), /multiple de 8/);
  assert.throws(() => analyseTempo(piece({ bpm: 101.99, first: 0.03, light: 32, fullBeats: 32 }), ANALYSIS_RATE, { hint: 102, loopBeats: 128 }), /disponibles/);
  console.log("PASS analyse de structure : temps 1 par le début, le changement de section et la fin ; accord final hors boucle ; anacrouse ; boucle imposée");
}

/**
 * Deux batteries au même tempo : « égale » pose la grosse caisse sur les quatre temps (pulsation
 * des musiques électroniques de danse) ; « kizomba » suit la grille documentée du dépôt
 * (docs/musique/kizomba.md) : grosse caisse sur 1 et 3, claquement sur 2 et 4, rimshot en 3-3-2.
 */
function drums(kind, { bpm = 96, first = 0.04, bars = 24 } = {}) {
  const sr = ANALYSIS_RATE, step = 15 / bpm;
  const x = new Float32Array(Math.round((first + bars * 16 * step + 0.5) * sr));
  let seed = 777;
  const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 0xffffffff) * 2 - 1; };
  for (let i = 0; i < x.length; i++) x[i] = 0.0005 * rnd();
  const add = (t, fn, len) => { const a = Math.round(t * sr); for (let i = 0; i < len * sr && a + i < x.length; i++) if (a + i >= 0) x[a + i] += fn(i / sr); };
  let previous = 0;
  const bright = () => { const v = rnd(); const out = v - previous; previous = v; return out; }; // bruit sans grave
  const kick = (t) => add(t, (u) => 0.8 * Math.sin(2 * Math.PI * 55 * u) * Math.exp(-u / 0.07), 0.3);
  const clap = (t) => add(t, (u) => 0.3 * bright() * Math.exp(-u / 0.03), 0.1);
  const rim = (t) => add(t, (u) => 0.35 * bright() * Math.exp(-u / 0.012), 0.05);
  const shaker = (t) => add(t, (u) => 0.05 * bright() * Math.exp(-u / 0.01), 0.03);
  for (let bar = 0; bar < bars; bar++) {
    for (let i = 0; i < 16; i++) {
      const t = first + (bar * 16 + i) * step;
      shaker(t);
      if (kind === "égale") { if (i % 4 === 0) { kick(t); clap(t); } if (i % 4 === 2) rim(t); }
      else {
        if (i === 0 || i === 8) kick(t);
        if (i === 4 || i === 12) clap(t);
        if ([0, 3, 6, 8, 11, 14].includes(i)) rim(t);
      }
    }
  }
  return x;
}
{
  const even = analyseTempo(drums("égale"), ANALYSIS_RATE, { hint: 96 });
  const kiz = analyseTempo(drums("kizomba"), ANALYSIS_RATE, { hint: 96 });
  near(even.bpm, 96, 0.05); near(kiz.bpm, 96, 0.05);
  near(kiz.firstBeat, 0.04, 0.005, "batterie kizomba : temps 1");
  assert.ok(even.rhythm.evenLow >= SEUILS.tempsEgaux, `quatre temps égaux signalés (${even.rhythm.evenLow.toFixed(2)})`);
  assert.ok(kiz.rhythm.evenLow < 0.4, `grosse caisse sur 1 et 3 seulement : pas de signalement (${kiz.rhythm.evenLow.toFixed(2)})`);
  assert.ok(kiz.rhythm.low[0] > 0.8 && kiz.rhythm.low[8] > 0.8 && kiz.rhythm.low[4] < 0.3 && kiz.rhythm.low[12] < 0.3, "grave sur les temps 1 et 3");
  assert.ok(kiz.rhythm.tresillo > 0.5 && even.rhythm.tresillo < 0.3, `syncope 3-3-2 reconnue (${kiz.rhythm.tresillo.toFixed(2)} contre ${even.rhythm.tresillo.toFixed(2)})`);
  assert.match(signature(kiz), /grave sur les temps 1 à 4 : .* ; syncope 3-3-2 dans l'aigu : /);
  console.log("PASS signature rythmique : quatre temps égaux signalés, grille kizomba documentée reconnue");
}

// ---------------------------------------------------------------- 6. prompts et script
{
  assert.deepEqual(Object.keys(PROMPTS).sort(), Object.keys(MUSIC_STYLES).sort(), "un prompt par style de danse");
  const spec = readFileSync(join(root, "docs", "spec-musique-elevenlabs.md"), "utf8");
  assert.ok(spec.includes(PROMPTS.kizomba.prompt), "kizomba : prompt du propriétaire, mot pour mot");
  for (const [style, d] of Object.entries(PROMPTS)) {
    assert.ok(d.prompt.includes(`${d.bpm} BPM`), `${style} : tempo dans le prompt`);
    assert.ok(d.prompt.includes("strictly quantized steady tempo"), `${style} : tempo strict`);
    assert.ok(d.prompt.endsWith("instrumental only, no vocals"), `${style} : instrumental`);
    assert.equal(d.beats % 32, 0, `${style} : boucle visée multiple de 32 temps`);
    const loop = d.beats * 60 / d.bpm;
    assert.ok(d.seconds >= loop + 3 && d.seconds <= loop + 8, `${style} : durée demandée = boucle + marge (${loop.toFixed(1)} s → ${d.seconds} s)`);
    assert.ok(d.bpm >= 24 && d.bpm <= 140, `${style} : tempo dans la plage du curseur`);
  }
  const tout = coutEstime(Object.keys(PROMPTS));
  assert.equal(tout.seconds, Object.values(PROMPTS).reduce((s, d) => s + d.seconds, 0));
  assert.equal(tout.credits, Math.ceil(tout.seconds / 60 * CREDITS_PAR_MINUTE));
  assert.match(plan(["kizomba"]), /102 bpm[\s\S]*Total : 62 s/, "plan lisible");

  assert.deepEqual(lireArguments(["--styles", "kizomba,semba", "--refaire", "--decaler", "kizomba=4", "--temps", "semba=32", "--variante", "kizomba=C"]),
    { plan: false, analyse: false, refaire: true, styles: ["kizomba", "semba"], decaler: { kizomba: 4 }, temps: { semba: 32 }, variante: { kizomba: "C" }, modele: MODELE });
  assert.equal(lireArguments(["--essais", "kizomba", "--duree", "20"]).duree, 20);
  assert.throws(() => lireArguments(["--variante", "kizomba=Z"]), /variante inconnue/);
  assert.throws(() => lireArguments(["--essais", "salsa"]), /pas de variantes/);
  assert.throws(() => lireArguments(["--essais", "kizomba", "--duree", "300"]), /entre 5 et 60/);

  // Variantes (plans de composition) : deuxième tentative après le refus de la prise 1 à l'écoute.
  for (const [style, variantes] of Object.entries(VARIANTES)) {
    assert.ok(PROMPTS[style], `${style} : variantes d'un style connu`);
    for (const [lettre, v] of Object.entries(variantes)) {
      const where = `${style} ${lettre}`;
      assert.ok(v.nom.length > 5, `${where} : nom`);
      assert.ok(v.styles.includes(`${PROMPTS[style].bpm} BPM`), `${where} : tempo du style`);
      assert.ok(v.styles.includes("instrumental") && v.styles.includes("strictly steady tempo"), `${where} : instrumental, tempo strict`);
      assert.ok(/Angolan/.test(v.styles[0]), `${where} : le premier style donne le genre`);
      assert.ok(v.styles.some((x) => /19\d0s/.test(x)), `${where} : époque de production`);
      const chunk = planDe(style, lettre, 15).chunks[0];
      assert.equal(planDe(style, lettre, 15).chunks.length, 1);
      assert.equal(chunk.duration_ms, 15000);
      assert.ok(chunk.positive_styles.length <= 50 && chunk.negative_styles.length <= 50, `${where} : 50 styles au plus`);
      for (const banni of ["techno", "four-on-the-floor kick drum", "kick drum on every beat", "vocals", "lyrics"]) {
        assert.ok(chunk.negative_styles.includes(banni), `${where} : « ${banni} » à éviter`);
      }
      assert.ok(!chunk.positive_styles.some((x) => chunk.negative_styles.includes(x)), `${where} : pas de style à la fois voulu et exclu`);
      assert.ok(chunk.text.length <= 200 && /^\[\w+\] \{.*\}$/.test(chunk.text), `${where} : consigne d'une ligne`);
      assert.match(texteDe(style, lettre), new RegExp(`variante ${lettre} .*Styles : .*À éviter : .*techno`), `${where} : texte de provenance`);
    }
  }
  assert.ok(A_EVITER.length >= 10);
  // Une prise issue d'une variante envoie un plan, sans les paramètres réservés au prompt.
  const avecPlan = corpsRequete("kizomba", MODELE, "A", 15);
  assert.deepEqual(Object.keys(avecPlan).sort(), ["composition_plan", "model_id"], "plan : ni prompt, ni durée, ni force_instrumental");
  const avecPrompt = corpsRequete("kizomba", MODELE);
  assert.deepEqual(Object.keys(avecPrompt).sort(), ["force_instrumental", "model_id", "music_length_ms", "prompt"]);
  assert.equal(avecPrompt.music_length_ms, 62000);
  assert.equal(creditsPour(3 * DUREE_ESSAI), Math.ceil(3 * DUREE_ESSAI / 60 * CREDITS_PAR_MINUTE));
  assert.match(plan(["kizomba"]), new RegExp(`Variantes de kizomba[\\s\\S]*A — [\\s\\S]*Essais : 3 extraits de 15 s, environ ${creditsPour(45)} crédits`), "plan : variantes et coût des essais");
  // Morceau entier : sections de 32 temps (un bloc unique de 62 s a rendu du silence), puis une fin.
  assert.ok(DUREE_ESSAI <= BLOC_MAX_S, "un extrait tient en un bloc");
  for (const [style, variantes] of Object.entries(VARIANTES)) {
    for (const lettre of Object.keys(variantes)) {
      const d = PROMPTS[style], entier = planDe(style, lettre, d.seconds).chunks;
      const section = Math.round(TEMPS_PAR_SECTION * 60000 / d.bpm);
      assert.equal(entier.length, d.beats / TEMPS_PAR_SECTION + 1, `${style} ${lettre} : une section par 32 temps de boucle, plus la fin`);
      for (const c of entier.slice(0, -1)) assert.equal(c.duration_ms, section, `${style} ${lettre} : section de 32 temps`);
      assert.equal(entier.reduce((sum, c) => sum + c.duration_ms, 0), d.seconds * 1000, `${style} ${lettre} : durée totale demandée`);
      for (const c of entier) {
        assert.ok(c.duration_ms >= 3000 && c.duration_ms <= BLOC_MAX_S * 1000, `${style} ${lettre} : bloc de 3 à ${BLOC_MAX_S} s (${c.duration_ms} ms)`);
        assert.ok(c.text.length <= 200 && c.negative_styles.includes("techno"));
        assert.deepEqual(c.positive_styles, entier[0].positive_styles, `${style} ${lettre} : mêmes styles d'un bout à l'autre (groove constant)`);
      }
      assert.match(entier.at(-1).text, /^\[Ending\]/, `${style} ${lettre} : la fin est une section à part, hors boucle`);
    }
  }
  assert.throws(() => lireArguments(["--styles", "salsa"]), /style inconnu/);
  assert.throws(() => lireArguments(["--force"]), /option inconnue/);

  // Le registre s'écrit entre ses marqueurs, trié dans l'ordre des styles, et se relit.
  const tmp = join(mkdtempSync(join(tmpdir(), "registre-")), "recordings.data.ts");
  writeFileSync(tmp, readFileSync(join(root, "src", "music", "recordings.data.ts"), "utf8"));
  const semba = { ...REC, style: "semba", file: "semba.mp3" };
  ecrireRegistre([semba, REC], tmp);
  assert.deepEqual(lireRegistre(tmp).map((p) => p.style), ["kizomba", "semba"], "registre trié et relu");
  assert.match(readFileSync(tmp, "utf8"), /export const RECORDING_DATA: readonly Recording\[\] = \/\* <pistes> \*\/ \[/, "le fichier reste du TypeScript valide");
  assert.match(tableauProvenance([REC]), /kizomba \| `public\/musique\/kizomba\.mp3` \| 101\.70 bpm \| 96 temps/, "ligne de provenance");

  // --plan : aucun réseau, et la clé n'apparaît jamais dans la sortie.
  const secret = "sentinelle-ne-jamais-afficher";
  const r = spawnSync(process.execPath, [join(root, "scripts", "generer_musique.mjs"), "--plan"],
    { env: { ...process.env, ELEVENLABS_API_KEY: secret }, encoding: "utf8" });
  assert.equal(r.status, 0, `--plan : ${r.stderr}`);
  assert.ok(!(r.stdout + r.stderr).includes(secret), "la clé n'est jamais affichée");
  assert.match(r.stdout, /Total : \d+ s/, "--plan affiche le coût estimé");
  const source = readFileSync(join(root, "scripts", "generer_musique.mjs"), "utf8");
  assert.ok(!/console\.(log|error)\([^)]*\bcle\b/.test(source), "aucun message n'affiche la clé");
  assert.ok(!/[?&](xi-api-key|api_key|key)=/.test(source), "la clé ne voyage jamais dans une URL");
  console.log("PASS génération : prompts par style, plan et coût sans réseau, registre réécrit entre marqueurs, clé jamais affichée");
}

// ---------------------------------------------------------------- 7. partage d'URL
{
  const parse = (q) => parseShareParams(new URLSearchParams(q), { mode: "solo", movement: "none" });
  assert.equal(parse("source=synthese").source, "synthese");
  assert.equal(parse("source=enregistrement").source, "enregistrement");
  assert.equal(parse("source=radio").source, undefined, "source inconnue ignorée");
  const url = buildShareUrl("/app/", { son: true, source: "synthese" }, null, null);
  assert.equal(parse(url.split("?")[1]).source, "synthese", "aller-retour par l'URL");
  console.log("PASS partage : source de la musique dans l'URL");
}
