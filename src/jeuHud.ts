// Commandes du mode jeu et de la vitrine sur tous les écrans (#186, docs/spec-jeu-telephone.md) :
// disposition selon la taille de la fenêtre, place laissée au couple, pavé des figures au toucher.
// Fonctions PURES, testées en node (docs/features/jeu-telephone.feature).
import { GUIDE_FIGURES, figureOfCode, type GuideFigure } from "./guidage";

/** Plus petite commande qu'un doigt atteint sans viser, en px (hauteur et largeur). */
export const TOUCH_MIN = 44;

/** `couche` : téléphone couché ; `droit` : téléphone tenu droit ; `large` : tablette, ordinateur. */
export type HudLayout = "couche" | "droit" | "large";
export const HUD_BREAK = { coucheMaxHeight: 500, droitMaxWidth: 640 } as const;

export function hudLayout(width: number, height: number): HudLayout {
  if (width > height && height < HUD_BREAK.coucheMaxHeight) return "couche";
  if (width < HUD_BREAK.droitMaxWidth) return "droit";
  return "large";
}

/** Place prise par les bandes de commandes sur chaque bord de la scène, en px. */
export interface Marges { top: number; right: number; bottom: number; left: number }
export const SANS_MARGES: Marges = { top: 0, right: 0, bottom: 0, left: 0 };

/** Part de la hauteur de la vue d'origine que le couple occupe, marge comprise : en hauteur (tête et
 * pieds) et en largeur (bras du cadre compris). Le reste de la vue n'est que du sol et du fond. */
export const SUJET = { hauteur: 0.86, largeur: 0.55 } as const;

export interface FreeView { scale: number; fullWidth: number; fullHeight: number; offsetX: number; offsetY: number }
/**
 * Vue d'origine (celle de la caméra sur toute la scène) ramenée dans le rectangle que les commandes
 * laissent libre : centrée dessus, et réduite juste assez pour que le couple y tienne. Les valeurs sont
 * celles de `PerspectiveCamera.setViewOffset(fullWidth, fullHeight, offsetX, offsetY, width, height)`.
 * Sans marge, ou sans place libre : null (la vue reste telle quelle).
 */
export function freeView(width: number, height: number, m: Marges): FreeView | null {
  if (!(width > 0 && height > 0)) return null;
  if (!m.top && !m.right && !m.bottom && !m.left) return null;
  const freeW = width - m.left - m.right, freeH = height - m.top - m.bottom;
  if (freeW <= 0 || freeH <= 0) return null;
  const scale = Math.min(1, freeH / (SUJET.hauteur * height), freeW / (SUJET.largeur * height));
  const fullWidth = width * scale, fullHeight = height * scale;
  const cx = m.left + freeW / 2, cy = m.top + freeH / 2;
  return { scale, fullWidth, fullHeight, offsetX: fullWidth / 2 - cx, offsetY: fullHeight / 2 - cy };
}

/** Bascules du pavé : elles modifient le prochain « Ida e volta » (au clavier : → et ↓ maintenues). */
export interface PadMods { jambeDroite: boolean; enArriere: boolean }
export interface Pad {
  /** Figures qui ont leur bouton, dans l'ordre du jeu. */
  figures: GuideFigure[];
  /** Bascules proposées : seulement pour les styles qui offrent l'ida e volta et ses variantes. */
  virgula: boolean; jambeDroite: boolean; enArriere: boolean;
}
export function padOf(offered: readonly GuideFigure[]): Pad {
  return {
    figures: offered.filter(f => !GUIDE_FIGURES[f].ida && !GUIDE_FIGURES[f].chain),
    virgula: offered.includes("ida"), jambeDroite: offered.includes("idaD"), enArriere: offered.includes("idaArr"),
  };
}
/** Nombre de boutons du pavé, bascules comprises. */
export const padSize = (pad: Pad): number => pad.figures.length + Number(pad.virgula) + Number(pad.jambeDroite) + Number(pad.enArriere);
/** Colonnes du pavé d'un téléphone tenu droit : deux rangées au plus, cinq colonnes au plus. */
export const padColumns = (count: number): number => Math.max(1, count <= 5 ? count : Math.min(5, Math.ceil(count / 2)));

/** Figure commandée par un bouton du pavé : l'ida e volta prend la variante des bascules, par la même
 * règle que les flèches maintenues du clavier (`figureOfCode`). */
export function padFigure(figure: GuideFigure, mods: PadMods): GuideFigure {
  if (figure !== "ida") return figure;
  return figureOfCode(GUIDE_FIGURES.ida.code, { right: mods.jambeDroite, down: mods.enArriere }) ?? "ida";
}

/** Adresse de la même vue dans un autre style : seul `style` change, les autres paramètres restent. */
export function styleSearch(search: string, style: string): string {
  const p = new URLSearchParams(search);
  p.set("style", style);
  return `?${p.toString()}`;
}
