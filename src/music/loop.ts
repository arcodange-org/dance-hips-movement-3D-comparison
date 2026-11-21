// Boucle enregistrée calée sur la danse (spec : docs/spec-musique-elevenlabs.md) : fonctions PURES,
// sans dépendance au navigateur, testées en node (scripts/test_musique_enregistree.mjs).
//
// 1. `positionOfBeat` : où lire dans le fichier pour un temps de la danse.
// 2. `crossfadeLoop` : fondu enchaîné au point de raccord, appliqué au tampon décodé.
// 3. `LoopEngine` : pilote une source en boucle sur un PORT de sortie (Web Audio en vrai, factice
//    en test) et l'horloge de la danse. Même transport que la synthèse (scheduler.ts) :
//    b(t) = b0 + (t − t0)·bpm/60, ancré sur l'horloge audio.
import type { DanceClock } from "../clock";
import type { Recording } from "./recordings";
import { beatAt, createTransport, pauseAt, playAt, retempoAt, seekAt, type Transport } from "./scheduler";

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Durée de la boucle dans le fichier (s). */
export const loopSeconds = (rec: Recording): number => (rec.beats * 60) / rec.bpm;
/** Fin de la boucle dans le fichier (s). */
export const loopEnd = (rec: Recording): number => rec.firstBeat + loopSeconds(rec);
/** Vitesse de lecture pour que la piste suive le tempo du curseur. */
export const rateOf = (rec: Recording, bpm: number): number => bpm / rec.bpm;

/**
 * Position de lecture (s dans le fichier) du temps `beat` de la danse. Périodique de période
 * `rec.beats` ; comme c'est un multiple de 8, le temps 1 de la boucle tombe sur un temps 1 du
 * compte de 8 de la danse.
 */
export function positionOfBeat(rec: Recording, beat: number): number {
  return rec.firstBeat + (mod(beat, rec.beats) * 60) / rec.bpm;
}

/** Position atteinte `seconds` plus tard à la vitesse `rate`, repliée dans la boucle. */
export function advancePosition(rec: Recording, position: number, seconds: number, rate: number): number {
  return rec.firstBeat + mod(position - rec.firstBeat + seconds * rate, loopSeconds(rec));
}

export const LOOP_FADE_S = 0.03;
/** Marge minimale avant le début de boucle pour un fondu « avant » raccourci. */
export const LOOP_MIN_FADE_S = 0.008;
export type LoopSeam = "avant" | "après" | "bords";

/**
 * Rend le raccord de boucle continu, EN PLACE, sur un canal décodé. La lecture saute de `end` à
 * `start` : sans traitement, la forme d'onde est discontinue et l'on entend un clic.
 *
 * - « avant » : les `fade` secondes avant `end` glissent vers celles qui précèdent `start` ; au
 *   raccord, le signal continue exactement sur `start`. Avec une marge courte (au moins 8 ms), le
 *   fondu est raccourci : l'attaque du temps 1 reste intacte.
 * - « après » (pas de marge avant `start`) : les `fade` secondes après `start` partent de ce qui
 *   suit `end`.
 * - « bords » (aucune marge) : fondu court vers zéro de part et d'autre du raccord.
 */
export function crossfadeLoop(channel: Float32Array, sampleRate: number, start: number, end: number, fade = LOOP_FADE_S): LoopSeam {
  const a = Math.round(start * sampleRate);
  const b = Math.min(channel.length, Math.round(end * sampleRate));
  const n = Math.max(1, Math.min(Math.round(fade * sampleRate), Math.floor((b - a) / 4)));
  // Puissance constante : les deux contenus ne sont pas corrélés.
  const out = (i: number) => Math.cos((Math.PI / 2) * ((i + 1) / (n + 1)));
  const into = (i: number) => Math.sin((Math.PI / 2) * ((i + 1) / (n + 1)));
  if (a >= Math.min(n, Math.round(LOOP_MIN_FADE_S * sampleRate))) {
    const m = Math.min(n, a);
    const fadeOut = (i: number) => Math.cos((Math.PI / 2) * ((i + 1) / (m + 1)));
    const fadeIn = (i: number) => Math.sin((Math.PI / 2) * ((i + 1) / (m + 1)));
    for (let i = 0; i < m; i++) channel[b - m + i] = channel[b - m + i] * fadeOut(i) + channel[a - m + i] * fadeIn(i);
    return "avant";
  }
  if (b + n <= channel.length) {
    for (let i = 0; i < n; i++) channel[a + i] = channel[b + i] * out(i) + channel[a + i] * into(i);
    return "après";
  }
  const m = Math.max(1, Math.min(n, Math.round(0.005 * sampleRate)));
  for (let i = 0; i < m; i++) {
    const g = i / m;
    channel[a + i] *= g;
    channel[b - 1 - i] *= g;
  }
  return "bords";
}

// ------------------------------------------------------------------------------------------
// Moteur : une source en boucle sur un port de sortie.
// ------------------------------------------------------------------------------------------

/** Port de sortie : Web Audio (src/music/loopOutput.ts) ou factice (tests). */
export interface LoopOutput<H = unknown> {
  /** Horloge de planification (AudioContext.currentTime). */
  now(): number;
  /** Instant (même unité) dont le son sort des haut-parleurs maintenant : now() − latence. */
  audibleNow(): number;
  /** Démarre la boucle de `rec` à l'instant `when`, à `position` secondes dans le fichier. */
  start(rec: Recording, position: number, when: number, rate: number): H;
  /** Change la vitesse de lecture à l'instant `when`. */
  setRate(handle: H, rate: number, when: number): void;
  /** Arrête la source en fondu court. */
  stop(handle: H): void;
}

/** Délai entre la décision et le départ de la source (le temps de la programmer). */
export const LOOP_START_DELAY_S = 0.03;
/** Un changement de vitesse est programmé à cet horizon, et le transport ré-ancré au même instant. */
export const LOOP_RATE_DELAY_S = 0.02;

export interface LoopSettings { bpm: number; playing: boolean }

export class LoopEngine<H = unknown> {
  transport: Transport;
  private settings: LoopSettings;
  private handle: H | null = null;
  private seenRevision: number;
  /** Transports encore valables pour le son déjà parti : { jusqu'à, transport }. */
  private history: { until: number; transport: Transport }[] = [];

  /** `ready` : le tampon de la piste est chargé (sinon l'horloge tourne en silence). */
  constructor(private out: LoopOutput<H>, private rec: Recording, s: LoopSettings,
    clock: Pick<DanceClock, "beat" | "revision">, private ready = true) {
    this.settings = { bpm: s.bpm, playing: s.playing };
    this.seenRevision = clock.revision;
    // L'ancre est prise sur le temps AUDIBLE : le temps affiché reste continu à l'activation.
    this.transport = createTransport(out.audibleNow(), clock.beat, s.bpm, s.playing);
    this.startSource();
  }

  get recording(): Recording { return this.rec; }
  get sounding(): boolean { return this.handle !== null; }

  private transportAt(t: number): Transport {
    while (this.history.length && this.history[0].until <= t) this.history.shift();
    return this.history.length ? this.history[0].transport : this.transport;
  }

  /** Temps musical audible maintenant. */
  beatNow(): number {
    const t = this.out.audibleNow();
    return beatAt(this.transportAt(t), t);
  }

  private stopSource(): void {
    if (this.handle !== null) this.out.stop(this.handle);
    this.handle = null;
  }

  private startSource(): void {
    this.stopSource();
    if (!this.ready || !this.settings.playing) return;
    const when = this.out.now() + LOOP_START_DELAY_S;
    const beat = beatAt(this.transport, when);
    this.handle = this.out.start(this.rec, positionOfBeat(this.rec, beat), when, rateOf(this.rec, this.transport.bpm));
  }

  /** Le tampon de la piste vient d'arriver : la source démarre à la position du temps courant. */
  setReady(): void {
    if (this.ready) return;
    this.ready = true;
    this.startSource();
  }

  /** Réconcilie les réglages (rendu React) : lecture/pause, tempo. */
  update(s: LoopSettings, clock: Pick<DanceClock, "beat" | "revision">): void {
    const prev = this.settings;
    this.settings = { bpm: s.bpm, playing: s.playing };
    if (s.bpm !== prev.bpm) {
      if (this.handle !== null && prev.playing && s.playing) {
        // Source en vol : la vitesse change à un instant futur, le transport est ré-ancré au même
        // instant. Le temps reste continu et la source n'est pas relancée.
        const at = Math.max(this.out.now() + LOOP_RATE_DELAY_S, this.transport.anchorTime);
        this.history.push({ until: at, transport: this.transport });
        this.transport = retempoAt(this.transport, at, s.bpm);
        this.out.setRate(this.handle, rateOf(this.rec, s.bpm), at);
      } else {
        const t = this.out.audibleNow();
        this.transport = retempoAt(this.transportAt(t), t, s.bpm);
        this.history = [];
      }
    }
    if (s.playing !== prev.playing) {
      if (s.playing) {
        // Reprise : on repart du temps affiché par la danse.
        this.seenRevision = clock.revision;
        this.history = [];
        this.transport = playAt(this.transport, this.out.audibleNow(), clock.beat);
        this.startSource();
      } else {
        const t = this.out.audibleNow();
        this.transport = pauseAt(this.transportAt(t), t);
        this.history = [];
        this.stopSource();
      }
    }
  }

  /** Saut : coupure, ré-ancrage, nouvelle source à la position du nouveau temps. */
  seek(beat: number): void {
    this.history = [];
    this.transport = seekAt(this.transport, this.out.audibleNow(), beat);
    this.startSource();
  }

  /** Même interface que le moteur de synthèse : une boucle n'a rien à planifier. */
  schedule(): number { return 0; }

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

  stop(): void { this.stopSource(); }
}
