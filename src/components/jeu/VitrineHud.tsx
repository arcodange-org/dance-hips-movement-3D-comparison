/** Commandes de la vitrine (#150, #186, docs/spec-jeu-telephone.md) : le compte, la figure, un seul
 * bouton pour la musique, le lien de partage. Rien n'est posé sur le couple, téléphone tenu droit ou couché. */
import { useRef } from "react";
import type { Marges } from "../../jeuHud";
import { COLONNE } from "./JeuHud";
import { useHudLayout } from "../../hooks/useHudLayout";
import { useMarges } from "./useMarges";
import { IconeLecture, IconePartager, IconeSon } from "./icones";

const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";
const ICO = `pointer-events-auto inline-flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 hover:bg-slate-800 touch-manipulation ${FOCUS}`;
const BOUTON = `pointer-events-auto inline-flex h-12 select-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 text-[15px] font-semibold touch-manipulation ${FOCUS}`;

export interface VitrineHudProps {
  styleLabel: string;
  auto: boolean;
  bpm: number;
  count: number;
  figure: string;
  touch: string | null;
  soundOn: boolean;
  /** La musique est coupée et la danse tourne : le bouton « Lancer la musique » est proposé. */
  proposeMusique: boolean;
  onSound: () => void;
  shared: string | null;
  onShare: () => void;
  /** Adresse du mode jeu dans le même style. */
  jeuHref: string;
  /** Attribution de l'anatomie et, quand une piste enregistrée joue, crédit de la musique. */
  credit: string;
  onMarges: (m: Marges) => void;
}

export default function VitrineHud(p: VitrineHudProps) {
  const { layout } = useHudLayout();
  const root = useRef<HTMLDivElement>(null);
  useMarges(root, p.onMarges, layout);
  const couche = layout === "couche";
  const large = layout === "large";
  // Colonne étroite d'un téléphone couché : le libellé peut passer sur deux lignes.
  const serre = couche ? "!whitespace-normal !px-2 text-center !text-sm leading-tight" : "";

  const etat = (
    <div className="pointer-events-auto flex h-[52px] min-w-0 items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-950/90 px-3">
      <span aria-label="compte" className="text-3xl font-semibold leading-none tabular-nums text-slate-100">{p.count}</span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold text-slate-100">{p.figure}{p.touch && <span className="font-normal text-amber-300"> · {p.touch}</span>}</span>
        <h1 className="truncate text-xs font-normal text-slate-300">{p.styleLabel}{p.auto ? "" : " · écoute"} · {p.bpm} bpm</h1>
      </span>
    </div>
  );
  const icones = <>
    {p.soundOn && <button type="button" aria-label="Couper le son" title="Couper le son" aria-pressed onClick={p.onSound}
      className={`${ICO} !border-violet-300 !bg-violet-400 !text-slate-950`}><IconeSon /></button>}
    <button type="button" aria-label="Partager cette danse" title="Copie le lien direct de cette vitrine : il rouvre la même danse"
      onClick={p.onShare} className={ICO}><IconePartager /></button>
  </>;
  const musique = p.proposeMusique && (
    <button type="button" onClick={p.onSound} className={`${BOUTON} shrink-0 bg-violet-400 text-slate-950 shadow-lg shadow-violet-900/40 hover:bg-violet-300 ${large ? "flex-1" : ""} ${serre}`}>
      <IconeLecture />Lancer la musique
    </button>
  );
  const prendre = (
    <a href={p.jeuHref} title="Ouvre le mode jeu : vous guidez la suiveuse figure par figure"
      className={`${BOUTON} shrink-0 border border-slate-700 bg-slate-900/90 text-slate-100 hover:bg-slate-800 ${serre}`}>Prendre la main</a>
  );
  const lien = p.shared && (
    <div className="pointer-events-auto flex flex-col gap-1">
      <span role="status" className="text-xs text-slate-200">Lien copié</span>
      <input readOnly value={p.shared} aria-label="Lien direct de la vitrine" onFocus={e => e.currentTarget.select()}
        className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200" />
    </div>
  );

  return (
    <div ref={root} data-hud={layout} className="pointer-events-none absolute inset-0">
      {couche ? <>
        {/* Téléphone couché : l'état et les crédits à gauche, le partage et les boutons à droite, le couple au milieu. */}
        <div data-marge="left" className="absolute inset-y-0 left-0 flex flex-col justify-between gap-2 py-2 pr-2"
          style={{ width: COLONNE.gauche, paddingLeft: "max(0.5rem, env(safe-area-inset-left))" }}>
          {etat}
          <p className="text-[11px] leading-snug text-slate-400">{p.credit}</p>
        </div>
        <div data-marge="right" className="absolute inset-y-0 right-0 flex flex-col items-end justify-between gap-2 py-2 pl-2"
          style={{ width: COLONNE.droite, paddingRight: "max(0.5rem, env(safe-area-inset-right))" }}>
          <div className="flex gap-1.5">{icones}</div>
          <div className="flex w-full flex-col gap-1.5">{lien}{musique}{prendre}</div>
        </div>
      </> : <>
        <div data-marge="top" className="absolute inset-x-0 top-0 flex items-start justify-between gap-1.5 px-2.5 pb-1.5"
          style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
          {etat}<div className="flex gap-1.5">{icones}</div>
        </div>
        <div data-marge="bottom" className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-2.5 pt-2"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
          <div className="flex w-full max-w-md flex-col gap-2">
            {lien}
            {/* Téléphone tenu droit : l'un sous l'autre, sur toute la largeur. Écran large : côte à côte. */}
            <div className={large ? "flex gap-2" : "flex flex-col gap-2"}>{musique}{prendre}</div>
          </div>
          <p className="self-stretch text-[11px] leading-snug text-slate-400">{p.credit}</p>
        </div>
      </>}
    </div>
  );
}
