/** Icônes des commandes du jeu, de la vitrine (#186) et de la page principale (#192) : tracées au trait,
 * décoratives (le bouton porte le nom). */
import type { ReactNode } from "react";

const Trait = ({ children, width = 2 }: { children: ReactNode; width?: number }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={width}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const IconeRetour = () => <Trait><path d="M15 6l-6 6 6 6" /></Trait>;
export const IconePause = () => <Trait width={2.6}><path d="M8 5v14M16 5v14" /></Trait>;
export const IconeLecture = () => <Trait><path d="M7 5l12 7-12 7z" fill="currentColor" /></Trait>;
export const IconeSon = () => <Trait><path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7" /></Trait>;
export const IconeSonCoupe = () => <Trait><path d="M4 9v6h4l5 4V5L8 9H4zM16 9.5l5 5M21 9.5l-5 5" /></Trait>;
export const IconePartager = () => (
  <Trait><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Trait>
);
export const IconeFermer = () => <Trait><path d="M6 6l12 12M18 6L6 18" /></Trait>;
export const IconePlus = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
  </svg>
);
export const IconeRejouer = () => <Trait><path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5" /></Trait>;
export const IconeSuivant = () => <Trait><path d="M9 6l6 6-6 6" /></Trait>;
export const IconeInfo = () => <Trait><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></Trait>;
