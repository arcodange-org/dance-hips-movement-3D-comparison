// Synthèse Web Audio des timbres (recettes : docs/musique/README.md, « Timbres de base », valeurs
// indicatives). Tout est synthétisé : oscillateurs, bruit blanc généré, filtres, enveloppes.
// Aucun échantillon ni enregistrement.
//
// `WebAudioOutput` implémente le port `MusicOutput` du moteur (src/music/scheduler.ts) :
// planification sur `AudioContext.currentTime`, annulation des notes futures, gain maître,
// coupure en fondu court. Il accepte aussi un `OfflineAudioContext` (rendu de contrôle).
import type { MusicOutput, NoteEvent } from "./scheduler";
import type { Timbre } from "./patterns";

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const EPS = 0.0001;

/**
 * Niveau de base par timbre (équilibre du mélange, proposition) : réglé sur les RMS d'un rendu
 * hors ligne (OfflineAudioContext) pour que la pulsation (grosse caisse, claquement, racleur)
 * reste au-dessus des nappes et de la basse ; à valider à l'oreille.
 */
const LEVEL: Record<Timbre, number> = {
  KICK: 0.9, KICK_SOFT: 0.95, SUB: 0.6, RIM: 0.45, SNARE: 0.5, CLAP: 1.0, HAT_C: 0.3, HAT_O: 0.22,
  SHAKER: 0.35, SCRAPER: 1.2, COWBELL: 1.1, CONGA_L: 0.55, CONGA_H: 0.5, TANBOU: 0.6, NGOMA_L: 0.8,
  NGOMA_H: 0.55, FLOOR_TOM: 0.5, BASS: 0.3, PLUCK: 1.4, PAD: 0.6, BRASS: 0.6, EPIANO: 1.2,
};

/** Enveloppe percussive : montée exponentielle puis décroissance exponentielle vers ~0. */
function perc(p: AudioParam, t: number, peak: number, attack: number, decay: number): number {
  const a = Math.max(peak, EPS * 2);
  p.setValueAtTime(EPS, t);
  p.exponentialRampToValueAtTime(a, t + Math.max(attack, 0.001));
  p.exponentialRampToValueAtTime(EPS, t + Math.max(attack, 0.001) + decay);
  return t + attack + decay;
}

/** Enveloppe tenue : attaque, maintien jusqu'à `until`, relâchement. */
function hold(p: AudioParam, t: number, peak: number, attack: number, until: number, release: number, sustain = 1): number {
  const a = Math.max(peak, EPS * 2);
  const end = Math.max(until, t + attack + 0.01);
  p.setValueAtTime(EPS, t);
  p.exponentialRampToValueAtTime(a, t + attack);
  p.exponentialRampToValueAtTime(Math.max(a * sustain, EPS * 2), end);
  p.exponentialRampToValueAtTime(EPS, end + release);
  return end + release;
}

/** Une note : ses sources (à arrêter si on l'annule) et son gain de sortie. */
class Voice {
  readonly out: GainNode;
  private readonly tail: AudioNode;
  private readonly sources: AudioScheduledSourceNode[] = [];
  private lastSource: AudioScheduledSourceNode | null = null;
  private lastEnd = -Infinity;
  private done = false;

  constructor(private ctx: BaseAudioContext, dest: AudioNode, pan: number, private noiseBuf: AudioBuffer) {
    this.out = ctx.createGain();
    if (pan && typeof ctx.createStereoPanner === "function") {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      this.out.connect(p);
      p.connect(dest);
      this.tail = p;
    } else {
      this.out.connect(dest);
      this.tail = this.out;
    }
  }

  osc(type: OscillatorType, freq: number, t: number, end: number, detune = 0): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (detune) o.detune.setValueAtTime(detune, t);
    o.start(t); o.stop(end + 0.05);
    this.track(o, end);
    return o;
  }

  noise(t: number, end: number): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.start(t, (t * 7.31) % 1); s.stop(end + 0.05);
    this.track(s, end);
    return s;
  }

  filter(type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    return f;
  }

  /** Saturation douce (WaveShaper, courbe tanh). */
  shaper(drive: number): WaveShaperNode {
    const ws = this.ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(drive * x) / Math.tanh(drive);
    }
    ws.curve = curve;
    return ws;
  }

  gain(v = 1): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = v;
    return g;
  }

  private track(src: AudioScheduledSourceNode, end: number): void {
    this.sources.push(src);
    if (end >= this.lastEnd) { this.lastEnd = end; this.lastSource = src; }
  }

  /** Libère les nœuds quand la source qui finit le plus tard s'arrête. */
  seal(): this {
    if (this.lastSource) this.lastSource.onended = () => this.dispose();
    return this;
  }

  cancel(): void {
    for (const s of this.sources) { try { s.stop(); } catch { /* déjà arrêtée */ } }
    this.dispose();
  }

  private dispose(): void {
    if (this.done) return;
    this.done = true;
    try { this.out.disconnect(); this.tail.disconnect(); } catch { /* déjà déconnecté */ }
  }
}

function chain(...nodes: AudioNode[]): void {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
}

/** Dessine un timbre dans `v` à l'instant t ; a = amplitude, dur = durée de la note (s). */
function render(v: Voice, ev: NoteEvent, t: number, a: number, dur: number, stepDur: number): void {
  const p = ev.params;
  switch (ev.timbre) {
    case "KICK": case "KICK_SOFT": {
      const soft = ev.timbre === "KICK_SOFT";
      const decay = p.decay ?? (soft ? 0.45 : 0.35);
      const end = t + decay + 0.01;
      const o = v.osc("sine", soft ? 110 : 150, t, end);
      o.frequency.exponentialRampToValueAtTime(soft ? 48 : 50, t + (soft ? 0.08 : 0.06));
      const g = v.gain(0);
      perc(g.gain, t, a, 0.002, decay);
      if (soft) chain(o, v.filter("lowpass", p.lowpass ?? 200), g, v.out);
      else chain(o, g, v.out);
      break;
    }
    case "SUB": {
      const f = midiHz(ev.midi[0] ?? 33);
      const until = t + Math.min(Math.max(dur, 0.3), 1.2);
      const o = v.osc("sine", f, t, until + 0.2);
      const shaper = v.shaper(2);
      const g = v.gain(0);
      hold(g.gain, t, a, 0.005, until, 0.15, 0.35);
      chain(o, shaper, v.filter("lowpass", p.lowpass ?? 180), g, v.out);
      break;
    }
    case "RIM": {
      const decay = p.decay ?? 0.04;
      const end = t + decay + 0.01;
      const g = v.gain(0);
      perc(g.gain, t, a, 0.001, decay);
      const tri = v.osc("triangle", 1700, t, end);
      const sin = v.osc("sine", 800, t, end);
      const n = v.noise(t, end);
      chain(tri, g); chain(sin, g); chain(n, v.filter("bandpass", 2500, 3), g);
      g.connect(v.out);
      break;
    }
    case "SNARE": {
      const gn = v.gain(0); perc(gn.gain, t, a, 0.001, 0.18);
      const gt = v.gain(0); perc(gt.gain, t, a * 0.6, 0.001, 0.08);
      chain(v.noise(t, t + 0.2), v.filter("highpass", 900), gn, v.out);
      chain(v.osc("triangle", 190, t, t + 0.1), gt, v.out);
      break;
    }
    case "CLAP": {
      const g = v.gain(0);
      const pk = Math.max(a, EPS * 2);
      g.gain.setValueAtTime(EPS, t);
      for (let i = 0; i < 3; i++) {
        const ti = t + i * 0.01;
        g.gain.exponentialRampToValueAtTime(pk, ti + 0.001);
        g.gain.exponentialRampToValueAtTime(pk * 0.2, ti + 0.009);
      }
      g.gain.exponentialRampToValueAtTime(pk * 0.7, t + 0.031);
      g.gain.exponentialRampToValueAtTime(EPS, t + 0.18);
      chain(v.noise(t, t + 0.2), v.filter("bandpass", 1200, 1.5), g, v.out);
      break;
    }
    case "HAT_C": case "HAT_O": {
      const decay = p.decay ?? (ev.timbre === "HAT_C" ? 0.04 : 0.25);
      const g = v.gain(0); perc(g.gain, t, a, 0.001, decay);
      chain(v.noise(t, t + decay + 0.01), v.filter("highpass", 7000), g, v.out);
      break;
    }
    case "SHAKER": {
      const g = v.gain(0); perc(g.gain, t, a, 0.008, p.decay ?? 0.07);
      chain(v.noise(t, t + 0.09), v.filter("bandpass", 6000, 1), g, v.out);
      break;
    }
    case "SCRAPER": {
      // Racleur (dikanza, graj) : bruit passe-bande modulé en amplitude par un carré à 35 Hz.
      const until = t + Math.max(stepDur, 0.04);
      const am = v.gain(0.5);
      const depth = v.gain(0.5);
      chain(v.osc("square", 35, t, until + 0.04), depth);
      depth.connect(am.gain);
      const g = v.gain(0); hold(g.gain, t, a, 0.005, until, 0.03);
      chain(v.noise(t, until + 0.04), v.filter("bandpass", 3500, 2), am, g, v.out);
      break;
    }
    case "COWBELL": {
      const decay = p.decay ?? 0.25;
      const g = v.gain(0); perc(g.gain, t, a, 0.001, decay);
      const bp = v.filter("bandpass", 2600, 1.2);
      chain(v.osc("square", 540, t, t + decay), bp); chain(v.osc("square", 800, t, t + decay), bp);
      chain(bp, g, v.out);
      break;
    }
    case "CONGA_L": case "CONGA_H": case "TANBOU": {
      const f = ev.timbre === "CONGA_L" ? 220 : 330;
      const decay = p.decay ?? 0.18;
      const o = v.osc("sine", f, t, t + decay);
      o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.03);
      const g = v.gain(0); perc(g.gain, t, a, 0.001, decay);
      chain(o, g, v.out);
      if (ev.timbre === "TANBOU") { // claqué : 30 ms de bruit passe-bande 1,5 kHz
        const gs = v.gain(0); perc(gs.gain, t, a * 0.8, 0.001, 0.03);
        chain(v.noise(t, t + 0.04), v.filter("bandpass", 1500, 1.5), gs, v.out);
      }
      break;
    }
    case "NGOMA_L": case "NGOMA_H": {
      const low = ev.timbre === "NGOMA_L";
      const decay = p.decay ?? (low ? 0.25 : 0.12);
      const g = v.gain(0); perc(g.gain, t, a, 0.002, decay);
      chain(v.osc("sine", low ? 120 : 260, t, t + decay), g, v.out);
      const gn = v.gain(0); perc(gn.gain, t, a * 0.5, 0.001, 0.005);
      chain(v.noise(t, t + 0.01), v.filter("bandpass", low ? 900 : 1800, 1), gn, v.out);
      break;
    }
    case "FLOOR_TOM": {
      const decay = p.decay ?? 0.35;
      const o = v.osc("sine", 95, t, t + decay);
      o.frequency.exponentialRampToValueAtTime(95 * 0.85, t + 0.06);
      const g = v.gain(0); perc(g.gain, t, a, 0.002, decay);
      chain(o, g, v.out);
      break;
    }
    case "BASS": {
      const f = midiHz(ev.midi[0] ?? 36);
      const until = t + Math.max(dur - 0.02, 0.05);
      const lp = v.filter("lowpass", p.lowpass ?? 600);
      const saw = v.gain(0.25); // −12 dB
      chain(v.osc("triangle", f, t, until + 0.1), lp);
      chain(v.osc("sawtooth", f, t, until + 0.1), saw, lp);
      const g = v.gain(0);
      // ADSR 5 ms / 250 ms / 0,6 / 100 ms
      const pk = Math.max(a, EPS * 2);
      g.gain.setValueAtTime(EPS, t);
      g.gain.exponentialRampToValueAtTime(pk, t + 0.005);
      g.gain.exponentialRampToValueAtTime(pk * 0.6, Math.min(t + 0.255, until));
      g.gain.setValueAtTime(pk * 0.6, until);
      g.gain.exponentialRampToValueAtTime(EPS, until + 0.1);
      chain(lp, g, v.out);
      break;
    }
    case "PLUCK": {
      const decay = p.decay ?? 0.3;
      const n = Math.max(1, ev.midi.length);
      for (const m of ev.midi) {
        const lp = v.filter("lowpass", p.lowpass ?? 3000);
        lp.frequency.setValueAtTime(p.lowpass ?? 3000, t);
        lp.frequency.exponentialRampToValueAtTime(800, t + 0.15);
        const g = v.gain(0); perc(g.gain, t, a / Math.sqrt(n), 0.002, decay);
        chain(v.osc("sawtooth", midiHz(m), t, t + decay), lp, g, v.out);
      }
      break;
    }
    case "PAD": {
      const attack = p.attack ?? 0.4;
      const until = t + Math.max(dur, attack + 0.05);
      const n = Math.max(1, ev.midi.length);
      const lp = v.filter("lowpass", p.lowpass ?? 1200);
      const g = v.gain(0); hold(g.gain, t, a / Math.sqrt(n), attack, until, 1.0);
      for (const m of ev.midi) {
        for (const d of [-7, 7]) chain(v.osc("sawtooth", midiHz(m), t, until + 1.0, d), lp);
      }
      chain(lp, g, v.out);
      break;
    }
    case "BRASS": {
      const until = t + Math.max(dur - 0.05, 0.1);
      const n = Math.max(1, ev.midi.length);
      const lp = v.filter("lowpass", 600);
      lp.frequency.setValueAtTime(600, t);
      lp.frequency.exponentialRampToValueAtTime(3000, t + 0.04);
      lp.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
      const g = v.gain(0); hold(g.gain, t, a / Math.sqrt(n), 0.02, until, 0.3, 0.7);
      for (const m of ev.midi) for (const d of [-5, 5]) chain(v.osc("sawtooth", midiHz(m), t, until + 0.3, d), lp);
      chain(lp, g, v.out);
      break;
    }
    case "EPIANO": {
      const decay = Math.min(Math.max(dur, 0.6), 1.4);
      const n = Math.max(1, ev.midi.length);
      const trem = v.gain(0.8);
      const lfoDepth = v.gain(0.2);
      chain(v.osc("sine", 4, t, t + decay), lfoDepth);
      lfoDepth.connect(trem.gain);
      const g = v.gain(0); perc(g.gain, t, a / Math.sqrt(n), 0.005, decay);
      for (const m of ev.midi) {
        chain(v.osc("sine", midiHz(m), t, t + decay), trem);
        const oct = v.gain(0.3);
        chain(v.osc("sine", midiHz(m + 12), t, t + decay), oct, trem);
      }
      chain(trem, g, v.out);
      break;
    }
  }
}

/** Instant dont le son sort maintenant : horodatage de sortie si disponible, sinon latence. */
export function audibleTime(context: BaseAudioContext): number {
  const ctx = context as AudioContext;
  if (typeof ctx.getOutputTimestamp === "function" && typeof performance !== "undefined") {
    const ts = ctx.getOutputTimestamp();
    if (ts.contextTime && ts.performanceTime) {
      const t = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
      if (t > 0 && t <= ctx.currentTime + 0.05) return t;
    }
  }
  const latency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
  return ctx.currentTime - latency;
}

export class WebAudioOutput implements MusicOutput<Voice> {
  private readonly master: GainNode;
  private bus: GainNode;
  private readonly noiseBuf: AudioBuffer;

  constructor(readonly ctx: BaseAudioContext, volume = 0.7) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 4;
    comp.attack.value = 0.003; comp.release.value = 0.15;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = volume;
    this.master.connect(comp);
    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    // Bruit blanc généré (1 s), déterministe.
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let s = 0x2545f491;
    for (let i = 0; i < d.length; i++) {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      d[i] = ((s >>> 0) / 0xffffffff) * 2 - 1;
    }
  }

  now(): number { return this.ctx.currentTime; }

  audibleNow(): number { return audibleTime(this.ctx); }

  play(ev: NoteEvent, when: number, secondsPerBeat: number): Voice {
    const t = Math.max(when, this.ctx.currentTime + 0.001);
    const v = new Voice(this.ctx, this.bus, ev.pan, this.noiseBuf);
    const a = ev.velocity * ev.gain * LEVEL[ev.timbre];
    render(v, ev, t, a, ev.durationBeats * secondsPerBeat, secondsPerBeat / 4);
    return v.seal();
  }

  cancel(v: Voice): void { v.cancel(); }

  silence(): void {
    const old = this.bus;
    const t = this.ctx.currentTime;
    old.gain.cancelScheduledValues(t);
    old.gain.setValueAtTime(old.gain.value, t);
    old.gain.linearRampToValueAtTime(0, t + 0.04);
    setTimeout(() => { try { old.disconnect(); } catch { /* déjà fait */ } }, 120);
    this.bus = this.ctx.createGain();
    this.bus.connect(this.master);
  }

  setVolume(v: number): void {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), t, 0.02);
  }
}
