import { musicStyleOf, type Evidence } from "../music/patterns";
import { RECORDING_CREDIT, recordingTempo, type Recording } from "../music/recordings";
import type { MusicSource, SoundStatus } from "../music/useMusic";
import { STYLES } from "../styles";

const EVIDENCE_CLASS: Record<Evidence, string> = {
  documenté: "text-emerald-300",
  faible: "text-amber-300",
  proposition: "text-slate-400",
};

const SOURCES: { key: MusicSource; label: string; title: string }[] = [
  { key: "enregistrement", label: "Enregistrement", title: "Boucle enregistrée, générée par IA (Eleven Music, ElevenLabs)" },
  { key: "synthese", label: "Synthèse", title: "Musique synthétisée dans le navigateur d'après les grilles documentées" },
];

export default function SoundControls({
  status, wanted, onToggle, musicStyleKey, isCompare, musicSide, onMusicSide, styleA, styleB,
  bpm, onBpm, muted, onMuted, volume, onVolume, recording, hasRecording, source, onSource, unavailable, loading,
}: {
  status: SoundStatus;
  /** Lien partagé avec son=1 : l'audio attend un clic. */
  wanted: boolean;
  onToggle: () => void;
  musicStyleKey: string;
  isCompare: boolean;
  musicSide: "A" | "B";
  onMusicSide: (s: "A" | "B") => void;
  styleA: string;
  styleB: string;
  bpm: number;
  onBpm: (v: number) => void;
  muted: string[];
  onMuted: (m: string[]) => void;
  volume: number;
  onVolume: (v: number) => void;
  /** #142 : piste enregistrée jouée pour ce style (absente : synthèse). */
  recording?: Recording;
  /** Le style a une piste enregistrée : le choix de la source est proposé. */
  hasRecording: boolean;
  source: MusicSource;
  onSource: (s: MusicSource) => void;
  /** La piste existe mais n'a pas pu être chargée : la synthèse la remplace. */
  unavailable: boolean;
  loading: boolean;
}) {
  const on = status === "on";
  const music = musicStyleOf(musicStyleKey);
  const slow = bpm < music.bpm.min;
  const fast = bpm > music.bpm.max;
  const advised = recording ? recordingTempo(recording) : music.bpm.default;
  const speed = recording ? Math.round((bpm / recording.bpm) * 100) : 100;
  return (
    <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
      <button
        onClick={onToggle}
        aria-pressed={on}
        title={recording
          ? "Boucle enregistrée (générée par IA) calée sur la danse : l'horloge audio pilote la danse"
          : "Musique synthétisée dans le navigateur (Web Audio), sans enregistrement : l'horloge audio pilote la danse"}
        className={
          "px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors " +
          (on
            ? "bg-violet-500 border-violet-400 text-slate-950"
            : wanted
              ? "bg-slate-800 border-violet-400 text-violet-200 hover:bg-slate-700"
              : "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700")
        }
      >
        {on ? "🔊 Son activé" : status === "starting" ? "… Son" : wanted ? "🔇 Son (cliquer pour activer)" : "🔇 Son"}
      </button>
      {isCompare && (
        <div className="flex items-center gap-1.5" role="group" aria-label="Musique jouée en comparaison">
          Musique
          {(["A", "B"] as const).map((side) => {
            const key = side === "A" ? styleA : styleB;
            const active = musicSide === side;
            return (
              <button
                key={side}
                onClick={() => onMusicSide(side)}
                aria-pressed={active}
                className={
                  "px-2.5 py-1 rounded-lg font-medium border transition-colors " +
                  (active ? "border-transparent text-slate-950" : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700")
                }
                style={active ? { background: STYLES[key]?.color } : undefined}
              >
                {side} · {STYLES[key]?.label ?? key}
              </button>
            );
          })}
        </div>
      )}
      {hasRecording && (
        <div className="flex items-center gap-1.5" role="group" aria-label="Source de la musique">
          Source
          {SOURCES.map((s) => {
            const active = source === s.key;
            return (
              <button
                key={s.key}
                onClick={() => onSource(s.key)}
                aria-pressed={active}
                title={s.title}
                className={
                  "px-2.5 py-1 rounded-lg font-medium border transition-colors " +
                  (active ? "border-violet-400 bg-violet-500 text-slate-950" : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700")
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}
      <label className="flex items-center gap-2">
        Volume
        <input type="range" min="0" max="1" step="0.05" value={volume}
          onChange={(e) => onVolume(Number(e.target.value))} className="accent-violet-400" />
      </label>
      {recording ? (
        <span>
          {music.label} : boucle de {recording.beats} temps à {advised} bpm
          {speed !== 100 && on ? <span className="text-amber-300"> · piste jouée à {speed} % de sa vitesse (hauteur modifiée)</span> : null}
          {loading ? <span role="status"> · chargement de la piste…</span> : null}
        </span>
      ) : (
        <span>
          {music.label} : {music.bpm.min}–{music.bpm.max} bpm, {music.meter}
          {music.swing ? `, swing ${music.swing}` : ""}
          {(slow || fast) && on ? <span className="text-amber-300"> · musique {slow ? "ralentie" : "accélérée"} au tempo du curseur</span> : null}
        </span>
      )}
      {bpm !== advised && (
        <button
          onClick={() => onBpm(advised)}
          className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
          title={recording
            ? "Règle le curseur Tempo sur le tempo de la piste (vitesse et hauteur d'origine) ; la danse suit le même tempo"
            : "Règle le curseur Tempo (réversible) ; la danse suit le même tempo"}
        >
          {recording ? "Tempo de la piste" : "Tempo conseillé"} : {advised} bpm
        </button>
      )}
      {status === "unsupported" && <span role="alert" className="text-amber-300">Web Audio n'est pas disponible dans ce navigateur.</span>}
      {status === "error" && <span role="alert" className="text-amber-300">Impossible de démarrer le son.</span>}
      {unavailable && on && <span role="alert" className="text-amber-300">Enregistrement indisponible : musique synthétisée.</span>}
      {recording ? (
        <p className="basis-full text-[11px] text-slate-500">
          {RECORDING_CREDIT}. Boucle calée sur le temps de la danse ; prompt et mesures dans
          docs/musique/enregistrements.md. Phases de la danse inchangées.
        </p>
      ) : (
        <details className="basis-full">
          <summary className="cursor-pointer select-none">Instruments de la musique ({music.label}) et niveau de preuve</summary>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {music.tracks.map((tr) => (
              <label key={tr.id} className="flex items-center gap-1.5" title={tr.source}>
                <input
                  type="checkbox"
                  checked={!muted.includes(tr.id)}
                  onChange={(e) => onMuted(e.target.checked ? muted.filter((m) => m !== tr.id) : [...muted, tr.id])}
                  className="accent-violet-400"
                />
                {tr.label} <span className={EVIDENCE_CLASS[tr.evidence]}>({tr.evidence})</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Grilles simplifiées d'après docs/musique/ ; timbres synthétisés, aucune œuvre reprise. Phases de la danse
            inchangées.
          </p>
        </details>
      )}
    </div>
  );
}
