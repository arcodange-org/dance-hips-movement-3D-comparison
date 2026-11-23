// Vitrine (#150, docs/spec-vitrine-danse-auto.md) : la danse automatique du mode jeu, en musique, par un
// lien direct. Fonctions PURES, testées en node (scripts/test_vitrine.mjs).
//
// Demande du propriétaire : « Utiliser la musique d'elevenlab et son BPM en mode auto, afficher les
// muscles (le buste aussi) pour plus d'esthétisme. Permettre de partager le lien direct vers ce mode-ci ».
import { musicStyleOf } from "./music/patterns";
import { recordingOf, recordingTempo } from "./music/recordings";

/** Plage du champ bpm du mode jeu. */
export const GUIDE_BPM = { min: 40, max: 130, listen: 60 } as const;
const clampBpm = (v: number) => Math.max(GUIDE_BPM.min, Math.min(GUIDE_BPM.max, Math.round(v)));

export interface VitrineSettings {
  /** `vitrine=1` : la vue s'ouvre en vitrine (interface réduite, vue libre qui tourne). */
  vitrine: boolean;
  /** La vue s'ouvre en danse automatique (`vitrine=1` ou `auto=1`). */
  auto: boolean;
  /** Couche des muscles : affichée par défaut dans le mode jeu, en écoute comme en danse automatique (#173) ;
   * `muscles=0` la masque. */
  muscles: boolean;
  /** Point de vue du guideur (défaut du mode jeu) ou vue libre (défaut de la vitrine). */
  leaderView: boolean;
  /** Tempo imposé par l'URL (`bpm=`), sinon null. */
  bpm: number | null;
}

export function vitrineSettings(p: URLSearchParams): VitrineSettings {
  const vitrine = p.get("vitrine") === "1";
  const raw = Number(p.get("bpm"));
  return {
    vitrine,
    auto: vitrine || p.get("auto") === "1",
    muscles: p.get("muscles") !== "0",
    leaderView: vitrine ? p.get("vue") === "guideur" : p.get("vue") !== "libre",
    bpm: p.has("bpm") && Number.isFinite(raw) && raw >= GUIDE_BPM.min && raw <= GUIDE_BPM.max ? raw : null,
  };
}

/** Tempo du mode jeu en écoute : celui de l'URL, sinon le tempo d'écoute par défaut. */
export const listenBpm = (s: VitrineSettings): number => s.bpm ?? GUIDE_BPM.listen;

/**
 * Tempo de la danse automatique, ou null si le tempo d'écoute doit rester :
 * - un `bpm=` dans l'URL l'emporte (null : rien à changer) ;
 * - sinon le tempo de la piste enregistrée du style ;
 * - sans piste : le tempo conseillé du style en vitrine, le tempo d'écoute dans le mode jeu.
 */
export function danceBpm(s: VitrineSettings, styleKey: string): number | null {
  if (s.bpm !== null) return null;
  const rec = recordingOf(styleKey);
  if (rec) return clampBpm(recordingTempo(rec));
  return s.vitrine ? clampBpm(musicStyleOf(styleKey).bpm.default) : null;
}

/** Tempo à l'ouverture de la vue. */
export const openingBpm = (s: VitrineSettings, styleKey: string): number =>
  (s.auto ? danceBpm(s, styleKey) : null) ?? listenBpm(s);

/** Le mode jeu montre les muscles, et avec eux plus aucun bloc gris sur le tronc (#173, `trunkBlocksVisible`
 * dans src/muscles.ts). Sans les muscles (`muscles=0`), le buste stylisé revient : translucide en écoute,
 * lisible comme un corps en danse automatique. */
export const showcaseLook = (s: VitrineSettings, auto: boolean) => ({ muscles: s.muscles, solidTorso: auto && !s.muscles });

/** Lien direct de la vitrine : le style et la graine, pour rouvrir la même danse. */
export function vitrineUrl(base: string, o: { style: string; graine: number }): string {
  const p = new URLSearchParams({ vitrine: "1", style: o.style, graine: String(Math.trunc(o.graine)) });
  return `${base.split("?")[0]}?${p.toString()}`;
}

/** Fragment à coller dans une autre page pour y intégrer la vitrine. */
export function vitrineEmbed(url: string, title = "Danse en 3D"): string {
  return `<iframe src="${url}" title="${title}" allow="autoplay" loading="lazy" style="width:100%;aspect-ratio:16/9;border:0"></iframe>`;
}
