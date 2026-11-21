// Analyse de tempo PURE (#142, docs/spec-musique-elevenlabs.md) : d'un signal mono, mesure le
// tempo, l'instant du premier temps de mesure, la longueur de boucle et la dérive. Sans dépendance :
// le décodage (ffmpeg) est fait par scripts/generer_musique.mjs, les tests donnent un signal de
// synthèse (scripts/test_musique_enregistree.mjs).
//
// Le temps 1 d'une phrase de 8 temps est déduit de la STRUCTURE (un morceau commence, change de
// section et se termine sur un temps 1), à défaut de l'accent grave de la mesure. Limite assumée :
// c'est une déduction, pas une écoute — la validation finale se fait à l'oreille.

export const ANALYSIS_RATE = 11025;
const HOP = 64;
const WIN = 256;

/** Passe-bas à un pôle, appliqué deux fois (bande grave : grosse caisse, basse). */
export function lowpass(samples, sampleRate, hz) {
  const a = 1 - Math.exp((-2 * Math.PI * hz) / sampleRate);
  const out = new Float32Array(samples.length);
  let y1 = 0, y2 = 0;
  for (let i = 0; i < samples.length; i++) {
    y1 += a * (samples[i] - y1);
    y2 += a * (y1 - y2);
    out[i] = y2;
  }
  return out;
}

/** Énergie par trame (fenêtre WIN, pas HOP). */
function frameEnergy(samples) {
  const n = Math.max(0, Math.floor((samples.length - WIN) / HOP) + 1);
  const e = new Float32Array(n);
  let acc = 0;
  const sq = new Float64Array(samples.length + 1);
  for (let i = 0; i < samples.length; i++) { acc += samples[i] * samples[i]; sq[i + 1] = acc; }
  for (let k = 0; k < n; k++) e[k] = (sq[k * HOP + WIN] - sq[k * HOP]) / WIN;
  return e;
}

/**
 * Enveloppe d'attaques : hausse du logarithme de l'énergie d'une trame à la suivante.
 * La trame k est datée à la fin de sa fenêtre : c'est là qu'une attaque fait le plus monter le log.
 */
export function onsetEnvelope(samples, sampleRate) {
  const e = frameEnergy(samples);
  let mean = 0;
  for (const v of e) mean += v;
  mean = e.length ? mean / e.length : 0;
  const floor = Math.max(1e-12, mean * 1e-3);
  const o = new Float32Array(e.length);
  let prev = Math.log(e[0] + floor);
  for (let k = 1; k < e.length; k++) {
    const l = Math.log(e[k] + floor);
    o[k] = Math.max(0, l - prev);
    prev = l;
  }
  const frameRate = sampleRate / HOP;
  /** Instant (s) de la trame k (fraction admise). */
  const timeOf = (k) => (k * HOP + WIN - HOP / 2) / sampleRate;
  const frameOf = (t) => (t * sampleRate - WIN + HOP / 2) / HOP;
  return { o, e, frameRate, timeOf, frameOf };
}

const at = (o, x) => {
  if (x < 0 || x >= o.length - 1) return 0;
  const i = Math.floor(x);
  const f = x - i;
  return o[i] * (1 - f) + o[i + 1] * f;
};

/** Pic local de `o` à ± `w` trames de `x` : position affinée (parabole) et hauteur. */
function peakNear(o, x, w) {
  let best = -1, bi = -1;
  const lo = Math.max(1, Math.ceil(x - w)), hi = Math.min(o.length - 2, Math.floor(x + w));
  for (let i = lo; i <= hi; i++) if (o[i] > best) { best = o[i]; bi = i; }
  if (bi < 0 || best <= 0) return null;
  const a = o[bi - 1], b = o[bi], c = o[bi + 1];
  const d = a - 2 * b + c;
  const shift = d < 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / d)) : 0;
  return { pos: bi + shift, height: best };
}

/** Régression pondérée y = α + β·x. */
function fit(points) {
  let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of points) { sw += p.w; sx += p.w * p.x; sy += p.w * p.y; sxx += p.w * p.x * p.x; sxy += p.w * p.x * p.y; }
  const den = sw * sxx - sx * sx;
  if (!(Math.abs(den) > 1e-12)) return null;
  const beta = (sw * sxy - sx * sy) / den;
  return { alpha: (sy - beta * sx) / sw, beta };
}

const median = (values) => {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/**
 * Grille régulière la mieux alignée sur une enveloppe d'attaques : période et phase en trames,
 * et les attaques retenues (une par temps, quand il y en a une assez nette).
 */
function fitGrid(o, frameRate, hint, tolerance) {
  // Peigne : tempo et phase qui alignent le mieux une grille régulière sur les attaques.
  let best = { score: -1, bpm: hint, phase: 0 };
  for (let bpm = hint * (1 - tolerance); bpm <= hint * (1 + tolerance) + 1e-9; bpm += 0.05) {
    const period = (60 / bpm) * frameRate;
    const count = Math.floor((o.length - 1) / period);
    if (count < 8) continue;
    for (let phase = 0; phase < period; phase += 0.5) {
      let sum = 0;
      for (let k = 0; k < count; k++) sum += at(o, phase + k * period);
      sum /= count;
      if (sum > best.score) best = { score: sum, bpm, phase };
    }
  }
  // Régression sur les attaques proches de chaque temps prédit (trois passes).
  const window = 0.035 * frameRate;
  let period = (60 / best.bpm) * frameRate;
  let phase = best.phase;
  let hits = [], floor = 0;
  for (let pass = 0; pass < 3; pass++) {
    const count = Math.floor((o.length - 2 - phase) / period) + 1;
    const found = [];
    for (let k = 0; k < count; k++) {
      const peak = peakNear(o, phase + k * period, window);
      if (peak) found.push({ x: k, y: peak.pos, w: peak.height });
    }
    floor = 0.3 * median(found.map((h) => h.w));
    hits = found.filter((h) => h.w >= floor);
    const line = fit(hits);
    if (!line || !(line.beta > 0)) break;
    period = line.beta;
    phase = line.alpha;
  }
  return { period, phase, hits, window, floor };
}

/**
 * @param {Float32Array} samples signal mono
 * @param {number} sampleRate
 * @param {{ hint: number, tolerance?: number, shiftBeats?: number, loopBeats?: number }} options
 *   `hint` : tempo demandé ; recherche à ± `tolerance` (défaut 12 %). `shiftBeats` : décalage manuel
 *   du premier temps (en temps, fraction admise). `loopBeats` : longueur de boucle imposée (multiple
 *   de 8 temps), pour ne boucler qu'une section choisie à l'oreille.
 */
export function analyseTempo(samples, sampleRate, options) {
  const { hint, tolerance = 0.12, shiftBeats = 0, loopBeats = 0 } = options;
  const duration = samples.length / sampleRate;
  const full = onsetEnvelope(samples, sampleRate);
  const low = onsetEnvelope(lowpass(samples, sampleRate, 150), sampleRate);
  const { o, frameRate, timeOf } = full;
  if (o.length < frameRate * 4) throw new Error("signal trop court pour mesurer un tempo");

  // 1 et 2. Tempo et phase sur le morceau entier.
  const grid = fitGrid(o, frameRate, hint, tolerance);
  const { period, window } = grid;
  // Phase ramenée dans [0, période) : l'indice des temps se décale d'autant.
  const turns = Math.floor(grid.phase / period);
  const phase = grid.phase - turns * period;
  const hits = grid.hits.map((h) => ({ ...h, x: h.x + turns }));
  const beatSeconds = period / frameRate;
  const bpm = 60 / beatSeconds;
  const origin = timeOf(phase);
  /** Instant du temps k de la grille (k = 0 : premier temps repéré dans le fichier). */
  const beatTime = (k) => origin + k * beatSeconds;
  // Un temps peut tomber tout au début du fichier, avant la première trame d'analyse.
  const k0 = beatTime(-1) >= -0.015 ? -1 : 0;
  const kN = Math.floor((duration - origin) / beatSeconds + 1e-9);

  // Niveau par temps (dB) sur trois bandes : tout, grave (< 150 Hz), aigu (> 2 kHz).
  const mid = lowpass(samples, sampleRate, 2000);
  const high = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) high[i] = samples[i] - mid[i];
  const bands = [samples, lowpass(samples, sampleRate, 150), high].map((sig) => {
    const cum = new Float64Array(sig.length + 1);
    for (let i = 0; i < sig.length; i++) cum[i + 1] = cum[i] + sig[i] * sig[i];
    return (from, to) => {
      const a = Math.max(0, Math.round(from * sampleRate)), b = Math.min(sig.length, Math.round(to * sampleRate));
      return 10 * Math.log10((b > a ? (cum[b] - cum[a]) / (b - a) : 0) + 1e-12);
    };
  });
  const level = (band, k) => bands[band](beatTime(k), beatTime(k + 1));
  const span = (band, from, to) => { let sum = 0; for (let k = from; k < to; k++) sum += level(band, k); return sum / (to - from); };
  const all = [];
  for (let k = k0; k < kN; k++) all.push(level(0, k));
  const typicalLevel = median(all);
  const alive = (k) => k >= k0 && k < kN && level(0, k) >= typicalLevel - 12;

  // Début et fin de la musique.
  let kStart = k0;
  while (kStart < kN - 1 && !alive(kStart)) kStart++;
  /** Début franc (pas une entrée en fondu) : le premier temps audible est déjà au niveau du morceau. */
  const abruptStart = level(0, kStart) >= typicalLevel - 4;
  const hitBeats = hits.map((h) => h.x).filter((k) => k >= k0);
  /**
   * Fin de la musique. Deux repères :
   * - `kDecay` : le premier temps à partir duquel le niveau reste au moins 5 dB sous celui des
   *   quatre temps précédents et finit par s'éteindre (borne haute : un accord final sonore
   *   tient son niveau un temps ou deux avant de retomber) ;
   * - `kLastAttack` : le dernier temps où quelque chose est encore joué (une attaque, sur le temps
   *   ou à contretemps) ; la résonance qui suit n'en contient plus.
   * La musique se termine sur un temps 1 : soit l'accord final, soit le premier temps de silence.
   * Les candidats votent pour le temps 1 (étape 3), qui en retour désigne la fin.
   */
  let kDecay = kN;
  for (let k = kStart + 8; k <= kN - 2; k++) {
    const ceiling = span(0, k - 4, k) - 5;
    let quiet = true;
    for (let j = k; j < kN && quiet; j++) quiet = level(0, j) <= ceiling;
    if (quiet && level(0, kN - 1) <= typicalLevel - 15) { kDecay = k; break; }
  }
  const ending = kDecay < kN;
  const played = (k) => {
    const from = Math.max(1, Math.round(phase + k * period - window)), to = Math.min(o.length - 1, Math.round(phase + (k + 1) * period - window));
    for (let i = from; i < to; i++) if (o[i] >= grid.floor) return true;
    return false;
  };
  let kLastAttack = Math.min(kDecay, kN - 1);
  while (kLastAttack > kStart && !played(kLastAttack)) kLastAttack--;
  const endCandidates = ending ? [...new Set([kLastAttack, kLastAttack + 1, kDecay])].filter((k) => k <= kDecay) : [];
  /** Corps du morceau : du début de la musique à sa fin (accord final exclu). */
  const bodyEnd = ending ? Math.min(kDecay, kLastAttack) : kN;

  // Dérive : tendance des écarts (moyenne glissante sur 8 temps) ; gigue : écart type résiduel.
  const residuals = hits.map((h) => ({ k: h.x, r: (h.y - (phase + h.x * period)) / frameRate }));
  let drift = 0;
  for (let i = 0; i < residuals.length; i++) {
    let sum = 0, n = 0;
    for (let j = i; j < residuals.length && residuals[j].k < residuals[i].k + 8; j++) { sum += residuals[j].r; n++; }
    if (n >= 4) drift = Math.max(drift, Math.abs(sum / n));
  }
  const jitter = Math.sqrt(residuals.reduce((acc, h) => acc + h.r * h.r, 0) / Math.max(1, residuals.length));
  // Dérive, deuxième mesure : la grille recalculée sur chaque tiers du morceau doit retomber sur
  // la grille d'ensemble (écart replié sur un demi-temps : un tiers peut s'accrocher au contretemps).
  const bodyFrames = [Math.max(0, Math.round(phase + kStart * period)), Math.min(o.length, Math.round(phase + bodyEnd * period))];
  const third = Math.floor((bodyFrames[1] - bodyFrames[0]) / 3);
  if (third > frameRate * 8) {
    for (let i = 0; i < 3; i++) {
      const from = bodyFrames[0] + i * third;
      const local = fitGrid(o.subarray(from, from + third), frameRate, bpm, 0.03);
      const centre = from + third / 2;
      const onLocal = from + local.phase + Math.round((centre - from - local.phase) / local.period) * local.period;
      const half = period / 2;
      let gap = (onLocal - phase) % half;
      if (gap > half / 2) gap -= half;
      if (gap < -half / 2) gap += half;
      drift = Math.max(drift, Math.abs(gap) / frameRate);
    }
  }
  // Confiance : part des temps portés par une attaque, dans le quart du morceau où elle est la plus
  // faible. Une musique syncopée reste régulière d'un quart à l'autre ; un tempo qui glisse fait
  // perdre la grille sur une partie du morceau.
  const quarter = Math.max(1, Math.ceil((bodyEnd - kStart) / 4));
  let confidence = 1;
  for (let from = kStart; from < bodyEnd; from += quarter) {
    const to = Math.min(bodyEnd, from + quarter);
    if (to - from < 4) continue;
    confidence = Math.min(confidence, hitBeats.filter((k) => k >= from && k < to).length / (to - from));
  }

  // 3. Temps 1 d'une phrase de 8 temps. Trois indices, du plus sûr au moins sûr :
  //    a. la structure : un morceau commence, change de section et se termine sur un temps 1 ;
  //    b. l'accent grave : la mesure de 4 temps dont le premier temps porte le plus d'énergie grave.
  const votes = [];
  if (abruptStart) votes.push({ beat: kStart, weight: 1, kind: "début" });
  // La fin vote par ses candidats : un seul peut tomber sur le temps 1 d'une phrase donnée.
  for (const k of endCandidates) votes.push({ beat: k, weight: 1, kind: "fin" });
  // Une entrée en fondu n'est pas un changement de section : on ne cherche qu'une fois la musique installée.
  let kFull = kStart;
  while (kFull < bodyEnd - 1 && level(0, kFull) < typicalLevel - 4) kFull++;
  const novelty = [];
  for (let k = kFull + 4; k + 4 <= bodyEnd; k++) {
    let d = 0;
    for (let band = 0; band < 3; band++) d += Math.abs(span(band, k, k + 4) - span(band, k - 4, k));
    novelty.push({ k, d });
  }
  for (const n of novelty) {
    if (n.d < 10) continue;
    if (novelty.some((m) => Math.abs(m.k - n.k) <= 4 && (m.d > n.d || (m.d === n.d && m.k < n.k)))) continue;
    votes.push({ beat: n.k, weight: Math.min(1, n.d / 30), kind: "changement de section" });
  }
  const bar = [0, 0, 0, 0];
  for (let k = Math.max(0, kStart); k < bodyEnd; k++) {
    const peak = peakNear(low.o, low.frameOf(beatTime(k)), window);
    if (peak) bar[k % 4] += peak.height;
  }
  const barMean = (bar[0] + bar[1] + bar[2] + bar[3]) / 4 || 1;
  const mod8 = (k) => ((k % 8) + 8) % 8;
  let down = 0, bestScore = -Infinity;
  for (let phrase = 0; phrase < 8; phrase++) {
    // L'accent grave départage quand la structure ne dit rien ; il pèse toujours moins qu'un indice
    // de structure (un morceau peut appuyer son grave sur le temps 3 : prise du 21 novembre 2026).
    let score = Math.max(-0.9, Math.min(0.9, 2 * ((bar[phrase % 4] - barMean) / barMean)));
    for (const v of votes) {
      const gap = mod8(v.beat - phrase);
      score += gap === 0 ? v.weight : gap === 4 ? v.weight / 2 : 0;
    }
    if (score > bestScore + 1e-9) { bestScore = score; down = phrase; }
  }

  // 4. Boucle : part du premier temps 1 de phrase « plein » (pas une entrée en fondu) et prend le
  //    plus grand multiple de 32 temps (à défaut 16, puis 8) avant la fin de la musique.
  const barEnergy = (k) => Math.pow(10, bands[0](beatTime(k), beatTime(k + 4)) / 10);
  const starts = [];
  for (let k = down - 8; k + 4 <= bodyEnd; k += 8) if (k >= k0) starts.push(k);
  // « Plein » : la mesure n'est ni du silence ni une entrée en fondu (la suivante n'est pas deux
  // fois plus forte). Une section plus légère qu'une autre reste un début valable.
  const audible = Math.pow(10, (typicalLevel - 12) / 10);
  const settled = (k) => barEnergy(k) >= audible && barEnergy(k) >= 0.5 * barEnergy(k + 4);
  const first = starts.find((k) => k >= kStart && settled(k)) ?? starts[0] ?? down;
  const shifted = first + shiftBeats;
  const firstBeat = Math.max(0, beatTime(shifted));
  const margin = 0.05;
  // Fin retenue : le candidat qui tombe sur un temps 1 de phrase, à défaut la borne haute.
  const kEnd = endCandidates.find((k) => mod8(k - down) === 0) ?? kDecay;
  const room = ending ? kEnd - shifted : Math.floor((duration - margin - firstBeat) / beatSeconds + 1e-9);
  let beats = 0;
  if (loopBeats) {
    if (loopBeats % 8 !== 0 || loopBeats > room) throw new Error(`boucle imposée de ${loopBeats} temps : multiple de 8 attendu, ${room} temps disponibles`);
    beats = loopBeats;
  }
  for (const unit of beats ? [] : [32, 16, 8]) {
    let n = Math.floor(room / unit) * unit;
    // Une fin en fondu ne fait pas partie de la boucle : la dernière mesure tient son niveau.
    const fading = (k) => barEnergy(k) < audible || barEnergy(k) < 0.5 * barEnergy(k - 4);
    while (n > unit && fading(Math.round(shifted) + n - 4)) n -= unit;
    if (n >= unit) { beats = n; break; }
  }
  const structure = { start: kStart, abruptStart, end: ending ? kEnd : null,
    votes: votes.filter((v) => v.kind !== "fin" || v.beat === kEnd) };

  // 5. Signature rythmique : attaques par double-croche, repliées sur une mesure de 4 temps à
  //    partir du temps 1 (grave : grosse caisse et basse ; aigu : rimshot, charleston, racleur).
  //    Elle ne juge pas la musique, mais une grosse caisse d'égale force sur les quatre temps
  //    (la pulsation des musiques électroniques de danse) se voit ici avant toute écoute.
  const highEnv = onsetEnvelope(high, sampleRate);
  const fold = (env) => {
    const sum = new Array(16).fill(0);
    let bars = 0;
    for (let k = Math.round(shifted); k + 4 <= bodyEnd; k += 4, bars++) {
      for (let step = 0; step < 16; step++) {
        const peak = peakNear(env.o, env.frameOf(beatTime(k + step / 4)), 0.025 * frameRate);
        // L'enveloppe d'attaques est logarithmique : pondérée par l'amplitude, un coup léger
        // (racleur, shaker) ne pèse pas autant qu'un coup fort.
        if (peak) sum[step] += peak.height * Math.sqrt(env.e[Math.min(env.e.length - 1, Math.round(peak.pos) + 2)]);
      }
    }
    const top = Math.max(...sum, 1e-9);
    return sum.map((v) => v / top);
  };
  const lowSteps = fold(low), highSteps = fold(highEnv);
  const onBeats = [0, 4, 8, 12].map((i) => lowSteps[i]);
  const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
  const rhythm = {
    /** Force des attaques graves et aiguës sur les 16 doubles-croches de la mesure (0 à 1). */
    low: lowSteps, high: highSteps,
    /** 1 : attaque grave d'égale force sur les quatre temps ; proche de 0 : temps sans grave. */
    evenLow: Math.min(...onBeats) / Math.max(...onBeats, 1e-9),
    /**
     * Syncope de la figure 3-3-2 : force de l'aigu sur les pas 3 et 11 (la double-croche qui
     * précède les temps 2 et 4), de 0 à 1. Les pas 6 et 14 de la figure tombent sur un contretemps
     * ordinaire et ne la distinguent pas.
     */
    tresillo: mean([3, 11].map((i) => highSteps[i])),
  };
  return { bpm, firstBeat, beats, duration, drift, jitter, confidence, barScores: bar, downbeat: down, beatSeconds, structure, rhythm };
}
