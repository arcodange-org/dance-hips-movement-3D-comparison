// Hook React du son synthétisé (spec : docs/spec-son-synthese.md).
//
// ⚠ Le GESTE déclenche : l'AudioContext n'est créé et réveillé que dans `toggle()`, appelé par le
// gestionnaire du clic sur « Son » — jamais au montage (aucun navigateur ne laisse démarrer
// l'audio sans interaction). Son coupé : aucun contexte audio, `driver` vaut null et
// DanceTransport garde exactement son comportement (advanceClock).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClockDriver, DanceClock } from "../clock";
import { MusicEngine } from "./scheduler";
import { WebAudioOutput } from "./synth";

export type SoundStatus = "off" | "starting" | "on" | "unsupported" | "error";

export type { ClockDriver };

export interface MusicInputs {
  clock: DanceClock;
  styleKey: string;
  bpm: number;
  playing: boolean;
  muted: readonly string[];
  volume: number;
}

const SCHEDULER_INTERVAL_MS = 25;

export function useMusic({ clock, styleKey, bpm, playing, muted, volume }: MusicInputs) {
  const ctxRef = useRef<AudioContext | null>(null);
  const outRef = useRef<WebAudioOutput | null>(null);
  const engineRef = useRef<MusicEngine | null>(null);
  const settings = { style: styleKey, bpm, playing, muted };
  const latest = useRef(settings);
  latest.current = settings;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const [status, setStatus] = useState<SoundStatus>("off");

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    const ctx = ctxRef.current;
    // Laisser le fondu de coupure se terminer avant de suspendre le contexte.
    if (ctx) setTimeout(() => { if (!engineRef.current && ctx.state === "running") void ctx.suspend(); }, 200);
    setStatus("off");
  }, []);

  /** À appeler DANS le gestionnaire du clic. */
  const toggle = useCallback(async () => {
    if (engineRef.current) { stop(); return; }
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (!AC) { setStatus("unsupported"); return; }
    try {
      setStatus("starting");
      if (!ctxRef.current) ctxRef.current = new AC({ latencyHint: "interactive" });
      const ctx = ctxRef.current;
      const resumed = ctx.resume(); // appelé de façon synchrone dans le geste
      if (!outRef.current) outRef.current = new WebAudioOutput(ctx, volumeRef.current);
      await resumed;
      outRef.current.setVolume(volumeRef.current);
      engineRef.current = new MusicEngine(outRef.current, latest.current, clock);
      setStatus("on");
    } catch {
      engineRef.current = null;
      setStatus("error");
    }
  }, [clock, stop]);

  const mutedKey = muted.join(",");
  useEffect(() => {
    engineRef.current?.update(latest.current, clock);
  }, [styleKey, bpm, playing, mutedKey, clock, status]);

  useEffect(() => { outRef.current?.setVolume(volume); }, [volume]);

  // Boucle de planification : indépendante des images (rAF ralentit quand le rendu est lourd).
  useEffect(() => {
    if (status !== "on") return;
    const id = setInterval(() => { engineRef.current?.schedule(); }, SCHEDULER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => () => {
    engineRef.current?.stop();
    engineRef.current = null;
    void ctxRef.current?.close();
  }, []);

  const driver = useMemo<ClockDriver | null>(() => status === "on" ? {
    drive(c, endBeat) {
      const engine = engineRef.current;
      if (!engine) return false;
      engine.syncClock(c, endBeat);
      engine.schedule();
      return true;
    },
  } : null, [status]);

  return { status, toggle, driver };
}
