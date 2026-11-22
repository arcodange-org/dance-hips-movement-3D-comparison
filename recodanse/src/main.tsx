// Entrée de la vue du pont : l'application du moteur, sans changement, puis le bandeau du pont.
import "@moteur/main";
import { mascottesPresentes } from "./actifs";
import { reglages } from "./reglages";
import manifesteHaut from "../actifs/anatomie_haut.json";

const bandeau = document.getElementById("pont");
if (bandeau) {
  const presentes = mascottesPresentes();
  const etat = !reglages.pont ? "pont coupé (pont=0)"
    : [reglages.haut ? "haut du corps anatomique" : null,
      presentes.length ? `mascottes : ${presentes.join(", ")}` : "mascottes absentes (actifs/mascottes/)"].filter(Boolean).join(" · ");
  bandeau.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:50;font:11px/1.4 system-ui,sans-serif;color:#cbd5e1;background:rgba(2,6,23,.72);border:1px solid #334155;border-radius:6px;padding:4px 8px;max-width:60vw;pointer-events:none";
  bandeau.textContent = `Pont ReCoDanse — ${etat}. ${manifesteHaut.attribution}.`;
}
