// Hook React du son (specs : docs/spec-son-synthese.md, docs/spec-musique-elevenlabs.md).
//
// Deux sources, une seule horloge : la boucle enregistrée du style quand elle existe (défaut),
// sinon la musique synthétisée — repli aussi quand la piste ne se charge pas.
//
// ⚠ Le GESTE déclenche : l'AudioContext n'est créé et réveillé que dans `toggle()`, appelé par le
// gestionnaire du clic sur « Son » — jamais au montage (aucun navigateur ne laisse démarrer
// l'audio sans interaction). Son coupé : aucun contexte audio, aucun téléchargement, `driver`
// vaut null et DanceTransport garde exactement son comportement (advanceClock).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClockDriver, DanceClock } from "../clock";
import { LoopEngine } from "./loop";
import { WebAudioLoopOutput } from "./loopOutput";
import { recordingOf, recordingUrl, type Recording } from "./recordings";
import { MusicEngine } from "./scheduler";
import { WebAudioOutput } from "./synth";

export type SoundStatus = "off" | "starting" | "on" | "unsupported" | "error";
export type MusicSource = "enregistrement" | "synthese";

export type { ClockDriver };

export interface MusicInputs {
  clock: DanceClock;
  styleKey: string;
  bpm: number;
  playing: boolean;
  muted: readonly string[];
  volume: number;
  /** Source préférée ; « enregistrement » retombe sur la synthèse si le style n'a pas de piste. */
  source?: MusicSource;
}

const SCHEDULER_INTERVAL_MS = 25;

interface Active {
  engine: MusicEngine | LoopEngine;
  /** Fichier de la piste jouée, ou null pour la synthèse. */
  file: string | null;
}

export function useMusic({ clock, styleKey, bpm, playing, muted, volume, source = "enregistrement" }: MusicInputs) {
  const ctxRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<WebAudioOutput | null>(null);
  const loopRef = useRef<WebAudioLoopOutput | null>(null);
  const activeRef = useRef<Active | null>(null);
  const [status, setStatus] = useState<SoundStatus>("off");
  /** Pistes qui n'ont pas pu être chargées : la synthèse les remplace. */
  const [failed, setFailed] = useState<readonly string[]>([]);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const wanted: Recording | undefined = source === "enregistrement" ? recordingOf(styleKey) : undefined;
  const recording = wanted && !failed.includes(wanted.file) ? wanted : undefined;
  const settings = { style: styleKey, bpm, playing, muted, recording };
  const latest = useRef(settings);
  latest.current = settings;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  /** (Re)crée le moteur de la source voulue ; le contexte audio existe déjà. */
  const build = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const s = latest.current;
    activeRef.current?.engine.stop();
    const rec = s.recording;
    if (!rec) {
      if (!synthRef.current) synthRef.current = new WebAudioOutput(ctx, volumeRef.current);
      activeRef.current = { engine: new MusicEngine(synthRef.current, s, clock), file: null };
      return;
    }
    if (!loopRef.current) loopRef.current = new WebAudioLoopOutput(ctx, volumeRef.current);
    const out = loopRef.current;
    const engine = new LoopEngine(out, rec, s, clock, out.has(rec));
    activeRef.current = { engine, file: rec.file };
    if (out.has(rec)) return;
    // Pendant le chargement, l'horloge audio pilote déjà la danse, en silence.
    setLoadingFile(rec.file);
    out.load(rec, recordingUrl(rec)).then(
      () => { if (activeRef.current?.engine === engine) engine.setReady(); },
      () => setFailed((f) => (f.includes(rec.file) ? f : [...f, rec.file])),
    ).finally(() => setLoadingFile((f) => (f === rec.file ? null : f)));
  }, [clock]);

  const stop = useCallback(() => {
    activeRef.current?.engine.stop();
    activeRef.current = null;
    const ctx = ctxRef.current;
    // Laisser le fondu de coupure se terminer avant de suspendre le contexte.
    if (ctx) setTimeout(() => { if (!activeRef.current && ctx.state === "running") void ctx.suspend(); }, 200);
    setStatus("off");
  }, []);

  /** À appeler DANS le gestionnaire du clic. */
  const toggle = useCallback(async () => {
    if (activeRef.current) { stop(); return; }
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (!AC) { setStatus("unsupported"); return; }
    try {
      setStatus("starting");
      if (!ctxRef.current) ctxRef.current = new AC({ latencyHint: "interactive" });
      const ctx = ctxRef.current;
      const resumed = ctx.resume(); // appelé de façon synchrone dans le geste
      if (!synthRef.current) synthRef.current = new WebAudioOutput(ctx, volumeRef.current);
      await resumed;
      synthRef.current.setVolume(volumeRef.current);
      loopRef.current?.setVolume(volumeRef.current);
      // Une piste qui a échoué est retentée à chaque activation : au rendu suivant, l'effet
      // ci-dessous voit la piste de nouveau voulue et remplace le moteur.
      setFailed([]);
      build();
      setStatus("on");
    } catch {
      activeRef.current = null;
      setStatus("error");
    }
  }, [build, stop]);

  const mutedKey = muted.join(",");
  const recordingFile = recording?.file ?? null;
  useEffect(() => {
    const active = activeRef.current;
    if (!active) return;
    // Changement de source (style, côté A/B, choix, repli) : nouveau moteur, ancré sur le temps affiché.
    if (active.file !== recordingFile) build();
    else active.engine.update(latest.current, clock);
  }, [styleKey, bpm, playing, mutedKey, clock, status, recordingFile, build]);

  useEffect(() => {
    synthRef.current?.setVolume(volume);
    loopRef.current?.setVolume(volume);
  }, [volume]);

  // Boucle de planification : indépendante des images (rAF ralentit quand le rendu est lourd).
  useEffect(() => {
    if (status !== "on") return;
    const id = setInterval(() => { activeRef.current?.engine.schedule(); }, SCHEDULER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => () => {
    activeRef.current?.engine.stop();
    activeRef.current = null;
    void ctxRef.current?.close();
  }, []);

  const driver = useMemo<ClockDriver | null>(() => status === "on" ? {
    drive(c, endBeat) {
      const engine = activeRef.current?.engine;
      if (!engine) return false;
      engine.syncClock(c, endBeat);
      engine.schedule();
      return true;
    },
  } : null, [status]);

  return {
    status, toggle, driver,
    /** Piste enregistrée jouée pour ce style (undefined : synthèse). */
    recording,
    /** Une piste existe pour ce style mais n'a pas pu être chargée : la synthèse la remplace. */
    unavailable: wanted !== undefined && recording === undefined,
    /** La piste est en cours de téléchargement. */
    loading: status === "on" && loadingFile !== null && loadingFile === recordingFile,
  };
}
