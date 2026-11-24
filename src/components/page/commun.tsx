/** Petites commandes de la page principale (#192) : boutons, choix, interrupteurs, curseurs, tiroirs.
 * Sur un écran tactile chacune fait au moins 44 px ; à la souris elles sont plus serrées. */
import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";
import type { DanceClock } from "../../clock";

export const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

/** Écran tactile : commandes de 44 px au moins. */
const Tactile = createContext(false);
export const TactileProvider = Tactile.Provider;
export const useTactile = () => useContext(Tactile);

/** Battement de l'horloge commune, relu dix fois par seconde (l'horloge n'est pas un état React). */
export function useBattement(clock: DanceClock): number {
  const [beat, setBeat] = useState(clock.beat);
  useEffect(() => {
    const lire = () => setBeat(b => (Math.abs(b - clock.beat) < 1e-4 ? b : clock.beat));
    lire();
    const id = setInterval(lire, 100);
    return () => clearInterval(id);
  }, [clock]);
  return beat;
}

export function Etiquette({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</div>;
}

/** Bouton d'un choix parmi plusieurs (style, figure). `couleur` : fond du bouton choisi. */
export function Choix({ actif, couleur, disabled, title, onClick, children, large = false }: {
  actif: boolean; couleur?: string; disabled?: boolean; title?: string; onClick: () => void; children: ReactNode;
  /** Garde sa largeur de texte dans une rangée qui défile (téléphone). */
  large?: boolean;
}) {
  const tactile = useTactile();
  return (
    <button type="button" aria-pressed={actif} disabled={disabled} title={title} onClick={onClick}
      style={actif && couleur ? { background: couleur, borderColor: couleur } : undefined}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg border font-medium touch-manipulation ${FOCUS} `
        + `${tactile ? "h-11 text-sm" : "h-8 text-[13px]"} ${large ? "shrink-0 px-4" : tactile ? "min-w-0 px-2.5" : "min-w-0 px-2"} `
        + (actif ? "border-sky-400 bg-sky-400 font-semibold text-slate-950"
          : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-800")}>
      {children}
    </button>
  );
}

/** Deux ou trois valeurs côte à côte, une seule choisie. Chaque valeur prend la largeur de son nom, puis sa part de
 * la place qui reste ; faute de place, les noms sont coupés plutôt que de dépasser. */
export function Segments<T extends string>({ nom, valeur, options, onChange, commande, className = "" }: {
  nom: string; valeur: T; options: readonly { key: T; label: string; title?: string }[]; onChange: (v: T) => void;
  commande?: string; className?: string;
}) {
  const tactile = useTactile();
  return (
    <div role="group" aria-label={nom} data-commande={commande}
      className={`flex overflow-hidden rounded-lg border border-slate-700 bg-slate-900 ${className}`}>
      {options.map(o => (
        <button key={o.key} type="button" aria-pressed={o.key === valeur} title={o.title} onClick={() => onChange(o.key)}
          className={`flex-auto select-none truncate touch-manipulation ${FOCUS} ${tactile ? "h-11 min-w-[44px] px-2 text-sm" : "h-8 min-w-0 px-2.5 text-[13px]"} `
            + (o.key === valeur ? "bg-sky-400 font-semibold text-slate-950" : "text-slate-200 hover:bg-slate-800")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Une ligne « nom … commande » d'un tiroir. */
export function Ligne({ nom, aide, children }: { nom: string; aide?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
      <span className="text-sm text-slate-200" title={aide}>{nom}</span>
      {children}
    </div>
  );
}

/** Oui ou non : toute la ligne se touche. */
export function Interrupteur({ nom, aide, valeur, onChange, commande, disabled }: {
  nom: string; aide?: string; valeur: boolean; onChange: (v: boolean) => void; commande: string; disabled?: boolean;
}) {
  const tactile = useTactile();
  return (
    <button type="button" role="switch" aria-checked={valeur} data-commande={commande} disabled={disabled} title={aide}
      onClick={() => onChange(!valeur)}
      className={`flex w-full select-none items-center justify-between gap-3 rounded-lg text-left text-sm text-slate-200 touch-manipulation disabled:opacity-40 ${FOCUS} ${tactile ? "min-h-[44px]" : "min-h-[32px]"}`}>
      <span>{nom}</span>
      <span aria-hidden="true" className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${valeur ? "bg-sky-400" : "bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${valeur ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** Une valeur sur une plage : le nom, le curseur, la valeur lue. */
export function Curseur({ nom, aide, valeur, min, max, pas, lu, onChange, commande, className = "" }: {
  nom: string; aide?: string; valeur: number; min: number; max: number; pas: number; lu: string;
  onChange: (v: number) => void; commande: string; className?: string;
}) {
  const tactile = useTactile();
  const id = useId();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 text-sm ${className}`} title={aide}>
      <label htmlFor={id} className="text-slate-300">{nom}</label>
      <div className="flex min-w-[8rem] flex-1 items-center gap-3">
        <input id={id} type="range" data-commande={commande} min={min} max={max} step={pas} value={valeur}
          onChange={e => onChange(Number(e.target.value))}
          className={`min-w-[4rem] flex-1 accent-sky-400 touch-manipulation ${tactile ? "h-11" : "h-6"}`} />
        <span className="shrink-0 text-right tabular-nums text-slate-100">{lu}</span>
      </div>
    </div>
  );
}

/** Bouton carré d'une icône : le nom est dans `aria-label`. */
export function BoutonIcone({ nom, actif = false, onClick, commande, children, disabled, discret = false }: {
  nom: string; actif?: boolean; onClick: () => void; commande?: string; children: ReactNode; disabled?: boolean; discret?: boolean;
}) {
  const tactile = useTactile();
  return (
    <button type="button" aria-label={nom} title={nom} data-commande={commande} disabled={disabled} onClick={onClick}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-xl border touch-manipulation disabled:opacity-40 ${FOCUS} ${tactile ? "h-11 w-11" : "h-10 w-10"} `
        + (actif ? "border-emerald-400 bg-emerald-400 text-slate-950"
          : discret ? "border-transparent text-slate-100 hover:bg-slate-800" : "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700")}>
      {children}
    </button>
  );
}

/** Tiroir du panneau : son titre et ce qu'il contient en quelques mots ; `extra` reste visible tiroir fermé. */
export function Tiroir({ id, titre, resume, extra, ouvert, onOuvert, children }: {
  id: string; titre: string; resume: string; extra?: ReactNode; ouvert: boolean; onOuvert: (v: boolean) => void; children: ReactNode;
}) {
  const tactile = useTactile();
  const zone = useId();
  return (
    <section className="border-t border-slate-800">
      <div className="flex flex-wrap items-center gap-x-2">
        <button type="button" data-tiroir={id} aria-expanded={ouvert} aria-controls={zone} onClick={() => onOuvert(!ouvert)}
          className={`flex flex-1 select-none items-center justify-between gap-2 text-left touch-manipulation ${FOCUS} ${extra ? "min-w-[6.5rem]" : "min-w-0"} ${tactile ? "min-h-[48px]" : "min-h-[40px]"}`}>
          <span className="shrink-0 text-sm font-medium text-slate-100">{titre}</span>
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
            {!extra && <span className="truncate">{resume}</span>}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className={`shrink-0 transition-transform ${ouvert ? "rotate-90" : ""}`}><path d="M9 6l6 6-6 6" /></svg>
          </span>
        </button>
        {extra && <div className="mb-1.5 min-w-[11rem] flex-1 sm:mb-0">{extra}</div>}
      </div>
      {ouvert && <div id={zone} className="space-y-2.5 pb-3 pt-1">{children}</div>}
    </section>
  );
}
