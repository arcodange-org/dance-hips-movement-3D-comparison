/** Fiche « À propos » de la page principale (#192) : ce que la page montre, la figure choisie, les styles
 * affichés, les réserves, l'attribution complète et le crédit de la musique. */
import { useEffect, useRef } from "react";
import { RECORDING_CREDIT } from "../../music/recordings";
import type { MovementKey } from "../../styles";
import type { Onglet } from "../../page";
import { InfoCard, PairInfoCard } from "../InfoCards";
import { IconeFermer } from "../jeu/icones";
import { BoutonIcone } from "./commun";

const FIGURE: Partial<Record<MovementKey, string[]>> = {
  sortieG: [
    "Sortie garçon : le guideur avance et sort à sa gauche, puis rentre par un croisé ; la suiveuse recule.",
    "Cinq actions, quatre transferts de poids : le marka final laisse le gauche du guideur disponible. La lecture s'arrête sur la pose finale.",
    "La contraposition est un réglage d'illustration, sans valeur imposée par style.",
  ],
  sortieF: [
    "Sortie fille : le buste du guideur ouvre le cadre pour guider le pas gauche de la suiveuse hors de la ligne.",
    "Au troisième pas, le droit de la suiveuse avance en diagonale et se place à côté du droit du guideur ; le guideur libère ensuite le passage au croisé.",
    "Au marka, le guideur reste sur son droit et la suiveuse sur son gauche.",
  ],
};
const PAS_FILLE = {
  hook: ["Virgula G (posé perpendiculaire), crochet D, recul G puis D, marka G.", "Recul D, sortie G à gauche, diagonale D, croisé G, marka D."],
  back: ["Avance G, recul D, recul G puis D, marka G.", "Recul D, avance G en diagonale gauche, diagonale D, croisé G, marka D."],
} as const;

export default function APropos({ onFermer, onglet, movement, styleA, styleB, deuxiemePas }: {
  onFermer: () => void; onglet: Onglet; movement: MovementKey; styleA: string; styleB: string; deuxiemePas: "hook" | "back";
}) {
  const fermer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer(); };
    window.addEventListener("keydown", key);
    fermer.current?.querySelector("button")?.focus();
    return () => window.removeEventListener("keydown", key);
  }, [onFermer]);
  const couple = onglet === "couple", comparer = onglet === "comparer";
  const sortieG = couple && movement === "sortieG", sortieF = couple && movement === "sortieF";
  const figure = couple ? FIGURE[movement] : undefined;
  const pasFille = sortieF ? PAS_FILLE[deuxiemePas] : null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 sm:p-6">
      <button type="button" tabIndex={-1} aria-label="Fermer" onClick={onFermer} className="fixed inset-0 cursor-default" />
      <div role="dialog" aria-modal="true" aria-label="À propos" className="relative flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200 sm:p-5">
        <div ref={fermer} className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-100">À propos</h2>
          <BoutonIcone nom="Fermer" onClick={onFermer}><IconeFermer /></BoutonIcone>
        </div>
        <p className="leading-relaxed text-slate-300">
          Six styles de danse en couple, vus par le bas du corps : le bassin, les genoux, les pieds. L'anatomie du bassin au pied est réelle
          (BodyParts3D) ; l'animation est paramétrique et illustrative, sans validation chorégraphique. Le tracé coloré montre le chemin du
          centre du bassin.
        </p>
        {figure && <div className="space-y-1.5">
          <h3 className="font-semibold text-slate-100">La figure</h3>
          {figure.map(texte => <p key={texte} className="leading-relaxed text-slate-300">{texte}</p>)}
        </div>}
        <div className={`grid gap-3 ${couple || comparer ? "sm:grid-cols-2" : ""}`}>
          <InfoCard styleKey={styleA} sortieGarcon={sortieG} figureSteps={pasFille?.[0]} position={couple ? "guideur" : comparer ? "à gauche" : ""} />
          {(couple || comparer) && <InfoCard styleKey={couple ? styleA : styleB} sortieGarcon={sortieG} figureSteps={pasFille?.[1]}
            position={couple ? "suiveuse" : "à droite"} />}
          {couple && <div className="sm:col-span-2"><PairInfoCard sortieGarcon={sortieG} sortieFille={sortieF} /></div>}
        </div>
        <div className="space-y-1.5 text-xs leading-relaxed text-slate-400">
          <p>
            Anatomie réelle du bassin au pied : os coxaux, sacrum, fémurs, patellas, tibias, fibulas et les 52 os des pieds, d'après
            BodyParts3D (réduction polygonale 99 %), © The Database Center for Life Science (DBCLS), licence CC BY-SA 2.1 Japan
            (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/license.html). Buste stylisé en transparence au-dessus du sacrum ; couche
            musculaire optionnelle issue du même jeu de données BodyParts3D (même attribution CC BY-SA 2.1 Japan © DBCLS).
          </p>
          <p>{RECORDING_CREDIT} pour les pistes enregistrées ; les autres musiques sont synthétisées dans le navigateur.</p>
          <p>Les réglages sont gardés dans ce navigateur. « Partager » copie un lien qui les contient tous, avec l'angle de la caméra.</p>
        </div>
      </div>
    </div>
  );
}
