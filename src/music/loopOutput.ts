// Port Web Audio de la boucle enregistrée (spec : docs/spec-musique-elevenlabs.md).
//
// Une piste = un AudioBuffer décodé, joué par un AudioBufferSourceNode en boucle entre
// `firstBeat` et la fin de la boucle. Le départ est programmé sur l'horloge audio avec un
// décalage dans le fichier : calage à l'échantillon près. Le tempo du curseur règle la vitesse
// de lecture (la hauteur suit, comme un vinyle).
//
// La piste ne passe PAS par le compresseur de la synthèse : elle est déjà mixée.
import { advancePosition, crossfadeLoop, loopEnd, type LoopOutput } from "./loop";
import type { Recording } from "./recordings";
import { audibleTime } from "./synth";

export interface LoopVoice { src: AudioBufferSourceNode; gain: GainNode }

const FADE_IN_S = 0.015;
const FADE_OUT_S = 0.04;

export class WebAudioLoopOutput implements LoopOutput<LoopVoice> {
  private readonly master: GainNode;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly loading = new Map<string, Promise<void>>();

  constructor(readonly ctx: BaseAudioContext, volume = 0.7) {
    this.master = ctx.createGain();
    this.master.gain.value = volume;
    this.master.connect(ctx.destination);
  }

  now(): number { return this.ctx.currentTime; }
  audibleNow(): number { return audibleTime(this.ctx); }

  has(rec: Recording): boolean { return this.buffers.has(rec.file); }

  /** Télécharge et décode la piste (une seule fois), puis rend son raccord de boucle continu. */
  load(rec: Recording, url: string): Promise<void> {
    if (this.buffers.has(rec.file)) return Promise.resolve();
    let pending = this.loading.get(rec.file);
    if (!pending) {
      pending = (async () => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`piste ${rec.file} : HTTP ${res.status}`);
        const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
        if (loopEnd(rec) > buffer.duration + 0.05) throw new Error(`piste ${rec.file} : boucle plus longue que le fichier`);
        for (let c = 0; c < buffer.numberOfChannels; c++) {
          crossfadeLoop(buffer.getChannelData(c), buffer.sampleRate, rec.firstBeat, loopEnd(rec));
        }
        this.buffers.set(rec.file, buffer);
      })();
      this.loading.set(rec.file, pending);
      // Un échec n'est pas mis en cache : une nouvelle activation réessaie.
      pending.catch(() => { this.loading.delete(rec.file); });
    }
    return pending;
  }

  start(rec: Recording, position: number, when: number, rate: number): LoopVoice {
    const buffer = this.buffers.get(rec.file);
    if (!buffer) throw new Error(`piste ${rec.file} non chargée`);
    const ctx = this.ctx;
    const t = Math.max(when, ctx.currentTime + 0.001);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopStart = rec.firstBeat;
    src.loopEnd = Math.min(loopEnd(rec), buffer.duration);
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.pow(10, rec.gainDb / 20), t + FADE_IN_S);
    src.connect(gain);
    gain.connect(this.master);
    // Départ en retard (boucle de rendu chargée) : la position avance d'autant, le calage tient.
    src.start(t, t > when ? advancePosition(rec, position, t - when, rate) : position);
    return { src, gain };
  }

  setRate(v: LoopVoice, rate: number, when: number): void {
    v.src.playbackRate.setValueAtTime(rate, Math.max(when, this.ctx.currentTime));
  }

  stop(v: LoopVoice): void {
    const t = this.ctx.currentTime;
    try {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setValueAtTime(v.gain.gain.value, t);
      v.gain.gain.linearRampToValueAtTime(0, t + FADE_OUT_S);
      v.src.stop(t + FADE_OUT_S + 0.01);
    } catch { /* déjà arrêtée */ }
    setTimeout(() => { try { v.gain.disconnect(); } catch { /* déjà fait */ } }, 200);
  }

  setVolume(v: number): void {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), t, 0.02);
  }
}
