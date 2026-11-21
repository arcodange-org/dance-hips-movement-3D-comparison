// Pistes enregistrées générées par IA (Eleven Music, ElevenLabs) — spec : docs/spec-musique-elevenlabs.md.
//
// Une piste = un fichier de public/musique/ + ses mesures. `bpm`, `firstBeat` et `beats` sont
// MESURÉS sur le fichier (scripts/tempo.mjs), jamais recopiés du prompt : un générateur respecte
// un tempo demandé à peu près, pas exactement.
import { RECORDING_DATA } from "./recordings.data";

export interface Recording {
  /** Clé du style de danse (kizomba, semba, kompa, tarraxinha, suave, zouk). */
  style: string;
  /** Nom du fichier dans public/musique/. */
  file: string;
  /** Tempo mesuré (bpm). */
  bpm: number;
  /** Instant (s) du temps 1 où commence la boucle. */
  firstBeat: number;
  /** Longueur de la boucle en temps, multiple de 8. */
  beats: number;
  /** Durée du fichier (s). */
  duration: number;
  /** Correction de niveau (dB) vers −16 LUFS, bornée par la crête. */
  gainDb: number;
  prompt: string;
  model: string;
  /** Date de génération (ISO, jour). */
  generatedAt: string;
  /** Qualité de la mesure : dérive maximale (s) des attaques par rapport à la grille, confiance 0–1. */
  measure: { drift: number; confidence: number };
  /** Décalage manuel du temps 1, en temps (validation à l'oreille). */
  shiftBeats?: number;
  /** Longueur de boucle imposée, en temps (validation à l'oreille). */
  loopBeats?: number;
}

/** Mention affichée dans l'app et la documentation. */
export const RECORDING_CREDIT = "Musique générée par IA (Eleven Music, ElevenLabs)";
export const RECORDING_DIR = "musique";
/** Plage du curseur Tempo de l'app. */
export const TEMPO_RANGE = { min: 24, max: 140 } as const;

export const RECORDINGS: Readonly<Record<string, Recording>> =
  Object.fromEntries(RECORDING_DATA.map((r) => [r.style, r]));

export function recordingOf(style: string): Recording | undefined {
  return Object.prototype.hasOwnProperty.call(RECORDINGS, style) ? RECORDINGS[style] : undefined;
}

/** Tempo de la piste arrondi à l'entier, pour le curseur. */
export const recordingTempo = (rec: Recording): number => Math.round(rec.bpm);

export function recordingUrl(rec: Recording, base: string = import.meta.env.BASE_URL): string {
  return `${base.endsWith("/") ? base : base + "/"}${RECORDING_DIR}/${rec.file}`;
}

/** Défauts d'une entrée du registre (vide = entrée valide). Sert aux tests et au script. */
export function recordingProblems(rec: Recording): string[] {
  const p: string[] = [];
  const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
  if (!rec.style) p.push("style manquant");
  if (!/^[\w.-]+\.mp3$/.test(rec.file ?? "")) p.push("fichier : nom .mp3 simple attendu");
  if (!finite(rec.bpm) || rec.bpm <= 0) p.push("tempo invalide");
  else if (recordingTempo(rec) < TEMPO_RANGE.min || recordingTempo(rec) > TEMPO_RANGE.max) p.push("tempo hors de la plage du curseur");
  if (!Number.isInteger(rec.beats) || rec.beats <= 0 || rec.beats % 8 !== 0) p.push("boucle : multiple de 8 temps attendu");
  if (!finite(rec.firstBeat) || rec.firstBeat < 0) p.push("premier temps invalide");
  if (!finite(rec.duration) || rec.duration <= 0) p.push("durée invalide");
  if (finite(rec.bpm) && rec.bpm > 0 && finite(rec.firstBeat) && finite(rec.duration)
    && rec.firstBeat + (rec.beats * 60) / rec.bpm > rec.duration + 1e-6) p.push("la boucle dépasse la fin du fichier");
  if (!finite(rec.gainDb) || rec.gainDb > 12 || rec.gainDb < -40) p.push("gain invalide");
  if (!rec.prompt || rec.prompt.length < 20) p.push("prompt manquant");
  if (!rec.model) p.push("modèle manquant");
  if (!/^\d{4}-\d{2}-\d{2}/.test(rec.generatedAt ?? "")) p.push("date manquante");
  if (!rec.measure || !finite(rec.measure.drift) || !finite(rec.measure.confidence)) p.push("mesure manquante");
  return p;
}
