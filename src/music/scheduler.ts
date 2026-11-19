// Planification musicale PURE (spec : docs/spec-son-synthese.md) : aucune dépendance au
// navigateur, testée en node (scripts/test_music.mjs).
//
// 1. `gridNotes` / `eventsInWindow` : les notes d'un style dans une fenêtre de temps [de, à).
// 2. `Transport` : l'ancre temps audio ↔ temps musical, b(t) = b0 + (t − t0)·bpm/60.
// 3. `MusicEngine` : programme à l'avance sur un PORT de sortie (Web Audio en vrai, factice en
//    test), annule ce qui est en vol à chaque changement de tempo, de style ou saut, et pilote
//    l'horloge de la danse quand le son est actif.
//
// Méthode reprise de RecoDanse (usePercussionDeLApercu) : le programme est calculable sans
// audio, la sortie est un port remplaçable, et trois raisons d'annuler ne sont jamais
// facultatives (saut, tempo, réglage des instruments).
import type { DanceClock } from "../clock";
import {
  CHORDS, PITCHED_TIMBRES, musicStyleOf, parseSteps,
  type Chord, type MusicStyle, type Timbre, type TimbreParams, type Track,
} from "./patterns";

export const STEPS_PER_GRID = 16;
export const BEATS_PER_GRID = 4;
export const GRIDS_PER_CYCLE = 4;
export const CYCLE_BEATS = BEATS_PER_GRID * GRIDS_PER_CYCLE;
const DEFAULT_VEL = { X: 1, x: 0.7, o: 0.35, note: 0.8 } as const;

/** Une note d'un gabarit de grille (avant placement dans le temps absolu). */
export interface GridNote {
  step: number;
  track: string;
  timbre: Timbre;
  token: string;
  velocity: number;
  durationSteps: number;
  midi: number[];
  gain: number;
  pan: number;
  params: TimbreParams;
  velJitter: number;
}

/** Une note placée dans le temps de la danse (temps moteur, swing compris). */
export interface NoteEvent extends GridNote {
  beat: number;
  /** Indice absolu de grille (peut être négatif). */
  grid: number;
  durationBeats: number;
  /** Décalage d'humanisation, appliqué en secondes à la synthèse (n'affecte pas la fenêtre). */
  offsetMs: number;
}

const dbToGain = (db: number) => Math.pow(10, db / 20);
const mod = (n: number, m: number) => ((n % m) + m) % m;

function chordAt(style: MusicStyle, gridInCycle: number, step: number): Chord {
  const spec = style.harmony[gridInCycle];
  const parts = spec.split("|");
  const name = parts.length === 2 && step >= STEPS_PER_GRID / 2 ? parts[1] : parts[0];
  const c = CHORDS[name];
  if (!c) throw new Error(`accord inconnu ${name} (${style.key})`);
  return c;
}

function chordChanges(style: MusicStyle, gridInCycle: number): number[] {
  return style.harmony[gridInCycle].includes("|") ? [STEPS_PER_GRID / 2] : [];
}

function tokenInterval(token: string, chord: Chord): number {
  switch (token) {
    case "R": return 0;
    case "3": return chord.third;
    case "5": return 7;
    case "6": return 9;
    case "7": return chord.seventh;
    default: return 0;
  }
}

function pitches(track: Track, token: string, chord: Chord, hitIndex: number): number[] {
  const base = chord.root + 12 * (track.octave ?? 0);
  const t = chord.tones;
  switch (track.voicing ?? "bass") {
    case "bass": return [base + tokenInterval(token, chord)];
    case "chord": return t.map((i) => base + i);
    case "dyad": return [base, base + 7];
    case "fifth": return [base + 7];
    case "arp": return [base + t[hitIndex % t.length]];
    case "thirds": {
      const k = hitIndex % t.length;
      const upper = (k + 1) % t.length;
      return [base + t[k], base + t[upper] + (upper <= k ? 12 : 0)];
    }
  }
}

/** Les lignes effectives (16 jetons par piste) d'une grille du cycle, variations appliquées. */
export function gridLines(style: MusicStyle, gridInCycle: number): Record<string, string[]> {
  const v = style.variations[gridInCycle as 0 | 1 | 2 | 3];
  const lines: Record<string, string[]> = {};
  for (const tr of style.tracks) {
    let line = parseSteps(v?.set?.[tr.id] ?? tr.steps);
    if (tr.grids && !tr.grids.includes(gridInCycle)) line = line.map(() => ".");
    for (const a of v?.add?.[tr.id] ?? []) line[a.step] = a.token;
    const m = v?.mute?.[tr.id];
    if (m === "all") line = line.map(() => ".");
    else if (m) for (const s of m) line[s] = ".";
    if (v?.muteAllExcept && !v.muteAllExcept.keep.includes(tr.id)) for (const s of v.muteAllExcept.steps) line[s] = ".";
    lines[tr.id] = line;
  }
  return lines;
}

const templateCache = new WeakMap<MusicStyle, GridNote[][]>();

/** Les notes d'une grille du cycle (0–3), triées par pas, gabarit mis en cache. */
export function gridNotes(style: MusicStyle, gridInCycle: number): GridNote[] {
  let cached = templateCache.get(style);
  if (!cached) { cached = []; templateCache.set(style, cached); }
  if (cached[gridInCycle]) return cached[gridInCycle];
  const v = style.variations[gridInCycle as 0 | 1 | 2 | 3];
  const lines = gridLines(style, gridInCycle);
  const changes = chordChanges(style, gridInCycle);
  const notes: GridNote[] = [];
  for (const tr of style.tracks) {
    const line = lines[tr.id];
    const pitched = PITCHED_TIMBRES.includes(tr.timbre);
    const gain = dbToGain((tr.gainDb ?? 0) + (v?.gainDb?.[tr.id] ?? 0));
    const addVel = new Map((v?.add?.[tr.id] ?? []).filter((a) => a.vel !== undefined).map((a) => [a.step, a.vel!]));
    let hit = 0;
    for (let s = 0; s < STEPS_PER_GRID; s++) {
      const tok = line[s];
      if (tok === "." || tok === "-") continue;
      let dur = 1;
      // Une tenue s'arrête au prochain jeton, à la fin de la grille ou à un changement d'accord.
      while (s + dur < STEPS_PER_GRID && line[s + dur] === "-" && !(pitched && changes.includes(s + dur))) dur++;
      const tokenVel = pitched ? tr.vel?.note ?? DEFAULT_VEL.note : tr.vel?.[tok as "X" | "x" | "o"] ?? DEFAULT_VEL[tok as "X" | "x" | "o"];
      const velocity = addVel.get(s) ?? tr.stepVel?.[s] ?? tokenVel;
      const midi = pitched ? pitches(tr, tok, chordAt(style, gridInCycle, s), hit) : [];
      notes.push({ step: s, track: tr.id, timbre: tr.timbre, token: tok, velocity, durationSteps: dur, midi,
        gain, pan: tr.pan ?? 0, params: tr.params ?? {}, velJitter: tr.velJitter ?? style.velJitter });
      hit++;
      // Tenue coupée par un changement d'accord : la note reprend sur le nouvel accord.
      if (pitched && changes.includes(s + dur) && line[s + dur] === "-") line[s + dur] = tok;
    }
  }
  notes.sort((a, b) => a.step - b.step || a.track.localeCompare(b.track));
  cached[gridInCycle] = notes;
  return notes;
}

/** Temps moteur du pas `step` de la grille absolue `grid`, swing compris. */
export function stepBeat(grid: number, step: number, swing: number): number {
  return grid * BEATS_PER_GRID + (step + (step % 2 === 1 ? swing : 0)) / 4;
}

// Hachage entier déterministe (FNV-1a + mélange) pour l'humanisation.
function hash32(seed: number, ...parts: (string | number)[]): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (const p of parts) {
    if (typeof p === "number") {
      h ^= p | 0; h = Math.imul(h, 16777619);
    } else {
      for (let i = 0; i < p.length; i++) { h ^= p.charCodeAt(i); h = Math.imul(h, 16777619); }
    }
    h ^= h >>> 15;
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
/** Valeur déterministe dans [−1, 1]. */
export function humanizeUnit(seed: number, ...parts: (string | number)[]): number {
  return (hash32(seed, ...parts) / 0xffffffff) * 2 - 1;
}

export interface WindowOptions {
  muted?: Iterable<string>;
  seed?: number;
  /** false : ni décalage ni variation de vélocité (défaut true). */
  humanize?: boolean;
}

/**
 * Notes du style dont le temps (swing compris) est dans l'intervalle semi-ouvert [from, to).
 * Deux fenêtres contiguës ne dupliquent ni ne perdent aucune note.
 */
export function eventsInWindow(styleKey: string | MusicStyle, from: number, to: number, opts: WindowOptions = {}): NoteEvent[] {
  const style = typeof styleKey === "string" ? musicStyleOf(styleKey) : styleKey;
  if (!(to > from) || !Number.isFinite(from) || !Number.isFinite(to)) return [];
  const muted = new Set(opts.muted ?? []);
  const seed = opts.seed ?? 0;
  const human = opts.humanize !== false;
  const out: NoteEvent[] = [];
  const g0 = Math.floor(from / BEATS_PER_GRID) - 1;
  const g1 = Math.floor(to / BEATS_PER_GRID);
  for (let g = g0; g <= g1; g++) {
    for (const n of gridNotes(style, mod(g, GRIDS_PER_CYCLE))) {
      if (muted.has(n.track)) continue;
      const beat = stepBeat(g, n.step, style.swing);
      if (beat < from || beat >= to) continue;
      const abs = g * STEPS_PER_GRID + n.step;
      const offsetMs = human ? humanizeUnit(seed, style.key, n.track, abs, 1) * style.humanizeMs : 0;
      const jitter = human ? 1 + humanizeUnit(seed, style.key, n.track, abs, 2) * n.velJitter : 1;
      out.push({ ...n, beat, grid: g, durationBeats: n.durationSteps / 4, offsetMs,
        velocity: Math.min(1, Math.max(0.01, n.velocity * jitter)) });
    }
  }
  return out;
}

// ------------------------------------------------------------------------------------------
// Transport : ancre (t0, b0, bpm). t est en secondes d'horloge audio.
// ------------------------------------------------------------------------------------------

export interface Transport { anchorTime: number; anchorBeat: number; bpm: number; playing: boolean }

export const createTransport = (t: number, beat: number, bpm: number, playing: boolean): Transport =>
  ({ anchorTime: t, anchorBeat: beat, bpm, playing });
export function beatAt(tr: Transport, t: number): number {
  return tr.playing ? tr.anchorBeat + ((t - tr.anchorTime) * tr.bpm) / 60 : tr.anchorBeat;
}
export function timeOfBeat(tr: Transport, beat: number): number {
  return tr.anchorTime + ((beat - tr.anchorBeat) * 60) / tr.bpm;
}
export const playAt = (tr: Transport, t: number, beat: number): Transport => ({ ...tr, anchorTime: t, anchorBeat: beat, playing: true });
export const pauseAt = (tr: Transport, t: number): Transport => ({ ...tr, anchorTime: t, anchorBeat: beatAt(tr, t), playing: false });
/** Changement de tempo : ré-ancrage à (t, b(t)), donc b continu. */
export const retempoAt = (tr: Transport, t: number, bpm: number): Transport => ({ ...tr, anchorTime: t, anchorBeat: beatAt(tr, t), bpm });
export const seekAt = (tr: Transport, t: number, beat: number): Transport => ({ ...tr, anchorTime: t, anchorBeat: beat });

// ------------------------------------------------------------------------------------------
// Moteur : planification à l'avance sur un port de sortie.
// ------------------------------------------------------------------------------------------

/** Port de sortie : Web Audio (src/music/synth.ts) ou factice (tests). */
export interface MusicOutput<H = unknown> {
  /** Horloge de planification (AudioContext.currentTime). */
  now(): number;
  /** Instant (même unité) dont le son sort des haut-parleurs maintenant : now() − latence. */
  audibleNow(): number;
  /** Programme une note à l'instant `when` (horloge de planification). */
  play(ev: NoteEvent, when: number, secondsPerBeat: number): H;
  /** Annule une note programmée (qu'elle ait commencé ou non). */
  cancel(handle: H): void;
  /** Coupe tout ce qui sonne ou est programmé, en fondu court. */
  silence(): void;
}

export const LOOKAHEAD_S = 0.12;
/** Au-delà de ce retard de la boucle (onglet en arrière-plan), les notes passées sont sautées. */
export const MAX_LATE_S = 0.25;

export interface MusicSettings { style: string; bpm: number; playing: boolean; muted?: readonly string[] }

export class MusicEngine<H = unknown> {
  transport: Transport;
  private settings: Required<MusicSettings>;
  private cursor: number;
  private pending: { beat: number; handle: H }[] = [];
  private seenRevision: number;
  readonly seed: number;

  constructor(private out: MusicOutput<H>, s: MusicSettings, clock: Pick<DanceClock, "beat" | "revision">, seed = 0) {
    this.settings = { muted: [], ...s };
    this.seed = seed;
    this.seenRevision = clock.revision;
    // L'ancre est prise sur le temps AUDIBLE : le temps affiché reste continu à l'activation.
    this.transport = createTransport(out.audibleNow(), clock.beat, s.bpm, s.playing);
    this.cursor = clock.beat;
    if (s.playing) this.schedule();
  }

  get style(): string { return this.settings.style; }

  /** Temps musical audible maintenant. */
  beatNow(): number { return beatAt(this.transport, this.out.audibleNow()); }

  private cancelFrom(beat: number): void {
    const keep: { beat: number; handle: H }[] = [];
    for (const p of this.pending) {
      if (p.beat >= beat) this.out.cancel(p.handle);
      else keep.push(p);
    }
    this.pending = keep;
    this.cursor = beat;
  }

  private silenceAll(): void {
    this.out.silence();
    this.pending = [];
  }

  /** Réconcilie les réglages (rendu React) : lecture/pause, tempo, style, pistes coupées. */
  update(s: MusicSettings, clock: Pick<DanceClock, "beat" | "revision">): void {
    const prev = this.settings;
    const next: Required<MusicSettings> = { muted: [], ...s };
    this.settings = next;
    const now = this.out.now();
    if (next.bpm !== prev.bpm) {
      this.transport = retempoAt(this.transport, now, next.bpm);
      if (prev.playing && next.playing) this.cancelFrom(beatAt(this.transport, now));
    }
    if (next.playing !== prev.playing) {
      if (next.playing) this.start(clock);
      else { this.transport = pauseAt(this.transport, this.out.audibleNow()); this.silenceAll(); }
      return;
    }
    if (next.playing && (next.style !== prev.style || next.muted.join() !== prev.muted.join())) {
      this.cancelFrom(beatAt(this.transport, now));
    }
    if (next.playing) this.schedule();
  }

  /** Reprise : on repart du temps affiché par la danse. */
  private start(clock: Pick<DanceClock, "beat" | "revision">): void {
    this.seenRevision = clock.revision;
    this.transport = playAt(this.transport, this.out.audibleNow(), clock.beat);
    this.cursor = clock.beat;
    this.schedule();
  }

  /** Saut : coupure, ré-ancrage, reprise de la planification au nouveau temps. */
  seek(beat: number): void {
    this.silenceAll();
    this.transport = seekAt(this.transport, this.out.audibleNow(), beat);
    this.cursor = beat;
    if (this.settings.playing) this.schedule();
  }

  /** Programme les notes jusqu'à now + LOOKAHEAD_S ; renvoie le nombre de notes remises. */
  schedule(): number {
    if (!this.settings.playing) return 0;
    const tr = this.transport;
    const now = this.out.now();
    const nowBeat = beatAt(tr, now);
    // Un trou plus long que MAX_LATE_S (onglet masqué) : on ne joue pas un paquet de notes passées.
    const lateBeats = (MAX_LATE_S * tr.bpm) / 60;
    const from = this.cursor < nowBeat - lateBeats ? nowBeat : this.cursor;
    const to = beatAt(tr, now + LOOKAHEAD_S);
    if (!(to > from)) return 0;
    const spb = 60 / tr.bpm;
    const evs = eventsInWindow(this.settings.style, from, to, { muted: this.settings.muted, seed: this.seed });
    for (const ev of evs) {
      const when = timeOfBeat(tr, ev.beat) + ev.offsetMs / 1000;
      this.pending.push({ beat: ev.beat, handle: this.out.play(ev, when, spb) });
    }
    this.cursor = to;
    if (this.pending.length > 256) this.pending = this.pending.filter((p) => p.beat >= nowBeat - 4);
    return evs.length;
  }

  /**
   * Horloge audio maîtresse : appelé à chaque image par DanceTransport quand le son est actif.
   * Un saut (`seekClock` incrémente `clock.revision`) ré-ancre le transport ; en lecture, le
   * temps de la danse est celui que l'on entend.
   */
  syncClock(clock: DanceClock, endBeat = Infinity): void {
    if (clock.exportFrame !== null) return;
    if (clock.revision !== this.seenRevision) {
      this.seenRevision = clock.revision;
      this.seek(clock.beat);
    }
    if (!this.settings.playing) return;
    clock.beat = Math.min(endBeat, this.beatNow());
  }

  stop(): void { this.silenceAll(); }
}
