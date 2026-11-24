/** Ce que la page principale (#192) reçoit d'`App` : l'état affiché, de quoi le changer, le son. */
import type { ModeKey, MovementKey } from "../../styles";
import type { SortieVariant } from "../../sortieGarcon";
import type { SortieFilleVariant } from "../../sortieFille";
import type { CouplePlacement } from "../../placement";
import type { MusicSource, SoundStatus } from "../../music/useMusic";
import type { Recording } from "../../music/recordings";
import type { HudLayout } from "../../jeuHud";

export interface PageEtat {
  mode: ModeKey;
  styleA: string;
  styleB: string;
  /** Figure dansée (celle choisie, ou sur place quand un style affiché ne l'offre pas). */
  movement: MovementKey;
  playing: boolean;
  bpm: number;
  amp: number;
  travel: number;
  dir: number;
  showTorso: boolean;
  showMuscles: boolean;
  showAppui: boolean;
  ghostSel: string;
  showRepere: boolean;
  showBoussole: boolean;
  showLigne: boolean;
  showContacts: boolean;
  plant: boolean;
  iso: boolean;
  cadre: boolean;
  sortieVariant: SortieVariant;
  sortieContra: number;
  sortieFilleVariant: SortieFilleVariant;
  placement: CouplePlacement;
  contraposition: number;
  idaVirgula: boolean;
}
export type PageActions = { [K in keyof PageEtat]: (valeur: PageEtat[K]) => void };

export interface PageSon {
  status: SoundStatus;
  /** Lien partagé avec `son=1` : l'audio attend un geste. */
  wanted: boolean;
  toggle: () => void;
  /** Style dont on entend la musique. */
  styleKey: string;
  side: "A" | "B";
  onSide: (side: "A" | "B") => void;
  muted: string[];
  onMuted: (muted: string[]) => void;
  volume: number;
  onVolume: (volume: number) => void;
  /** Piste enregistrée jouée (absente : musique de synthèse). */
  recording?: Recording;
  /** Le style a une piste enregistrée. */
  hasRecording: boolean;
  source: MusicSource;
  onSource: (source: MusicSource) => void;
  unavailable: boolean;
  loading: boolean;
}

/** Mesures d'un danseur publiées par son rig (poids sur chaque pied, genoux, bassin). */
export type Mesures = Record<string, number> | null;

export type Disposition = HudLayout;
