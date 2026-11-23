import { useEffect, useState } from "react";
import { hudLayout, type HudLayout } from "../jeuHud";

/** Écran tactile sans souris : pas de clavier à annoncer (#186). */
const TACTILE = "(hover: none), (pointer: coarse)";

interface HudScreen { layout: HudLayout; clavier: boolean }
const read = (): HudScreen => ({
  layout: hudLayout(window.innerWidth, window.innerHeight),
  clavier: !window.matchMedia(TACTILE).matches,
});

/** Disposition des commandes du jeu selon la fenêtre, et présence probable d'un clavier. */
export function useHudLayout(): HudScreen {
  const [screen, setScreen] = useState(read);
  useEffect(() => {
    const update = () => setScreen(s => { const n = read(); return n.layout === s.layout && n.clavier === s.clavier ? s : n; });
    const tactile = window.matchMedia(TACTILE);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    tactile.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      tactile.removeEventListener("change", update);
    };
  }, []);
  return screen;
}
