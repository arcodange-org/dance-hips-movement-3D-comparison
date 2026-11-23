/** Commandes du mode jeu (#186, docs/spec-jeu-telephone.md) : trois dispositions (téléphone tenu droit,
 * téléphone couché, écran large). Aucune commande n'est posée sur le couple ni sur une autre, et toutes
 * font au moins 44 px. Le mouvement et le clavier restent ceux de GuidageApp. */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { STYLES } from "../../styles";
import { GUIDE_FIGURES, type GuideFigure } from "../../guidage";
import { GUIDE_BPM } from "../../vitrine";
import { padColumns, padFigure, padOf, padSize, styleSearch, type Marges } from "../../jeuHud";
import { useHudLayout } from "../../hooks/useHudLayout";
import { CREDIT, RESERVE } from "../credit";
import { useMarges } from "./useMarges";
import { IconeFermer, IconeLecture, IconePause, IconePlus, IconeRetour, IconeSon, IconeSonCoupe } from "./icones";

export { CREDIT, RESERVE };

const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";
/** Téléphone couché : largeur des deux colonnes, plus étroites sur un petit écran pour laisser le milieu au couple. */
export const COLONNE = { gauche: "clamp(204px, 27vw, 210px)", droite: "clamp(186px, 28vw, 222px)" } as const;
const ICO = `pointer-events-auto inline-flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 hover:bg-slate-800 touch-manipulation ${FOCUS}`;
const SEG = (on: boolean, serre = false) => `h-11 flex-1 select-none whitespace-nowrap touch-manipulation ${serre ? "px-1.5 text-[13px]" : "px-3 text-sm"} ${FOCUS} ${on ? "bg-sky-400 font-semibold text-slate-950" : "text-slate-200 hover:bg-slate-800"}`;
const LIGNE = `flex min-h-[44px] w-full select-none items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/70 px-3 text-left text-sm text-slate-100 hover:bg-slate-800 touch-manipulation ${FOCUS}`;
const FIG = `pointer-events-auto flex min-h-[44px] select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 text-center leading-[1.15] text-slate-100 hover:bg-slate-800 disabled:opacity-50 touch-manipulation ${FOCUS}`;
const MOD = (on: boolean) => `pointer-events-auto flex min-h-[44px] select-none items-center justify-center rounded-xl border border-dashed text-center leading-[1.15] disabled:opacity-50 touch-manipulation ${FOCUS} ${on ? "border-amber-300 bg-amber-300 font-semibold text-slate-950" : "border-amber-600 bg-slate-900/90 text-amber-200 hover:bg-slate-800"}`;

export interface JeuHudProps {
  styleKey: string;
  /** Danse seule (le simulateur choisit) ou écoute des commandes. */
  auto: boolean;
  onAuto: (time: number) => void;
  playing: boolean;
  onPlaying: () => void;
  soundOn: boolean;
  onSound: () => void;
  /** Compte de 1 à 8, figure en cours, aller-retour en cours, suite des figures commandées. */
  count: number;
  figure: string;
  touch: string | null;
  queue: string;
  /** Fiche de la transition en cours (guideur, suiveuse, contacts), ou null pendant le pas de base. */
  fiche: ReactNode | null;
  offered: GuideFigure[];
  /** Lettre ou flèche du clavier de chaque figure, d'après la disposition du clavier. */
  keys: Partial<Record<GuideFigure, string>>;
  onLead: (figure: GuideFigure, time: number) => void;
  virgula: boolean;
  onVirgula: () => void;
  leaderView: boolean;
  onLeaderView: (leader: boolean) => void;
  bpm: number;
  onBpm: (bpm: number) => void;
  onRestart: () => void;
  shared: string | null;
  onShare: () => void;
  /** Adresse de la vue en couple, d'où l'on vient. */
  quitHref: string;
  aide: string;
  onMarges: (m: Marges) => void;
}

function Panneau({ titre, position, onFermer, children }: { titre: string; position: string; onFermer: () => void; children: ReactNode }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onFermer]);
  return <>
    <button type="button" tabIndex={-1} aria-label="Fermer" onClick={onFermer} className="pointer-events-auto absolute inset-0 cursor-default bg-slate-950/50" />
    <div role="dialog" aria-label={titre} className={`pointer-events-auto absolute z-10 flex max-h-[calc(100%-1rem)] flex-col gap-3 overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200 ${position}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-100">{titre}</h2>
        <button type="button" aria-label="Fermer" onClick={onFermer} className={ICO}><IconeFermer /></button>
      </div>
      {children}
    </div>
  </>;
}

export default function JeuHud(p: JeuHudProps) {
  const { layout, clavier } = useHudLayout();
  const root = useRef<HTMLDivElement>(null);
  useMarges(root, p.onMarges, layout);
  const [plus, setPlus] = useState(false);
  const [ficheOuverte, setFicheOuverte] = useState(false);
  // Bascules de l'ida e volta, comme les flèches maintenues du clavier.
  const [jambeDroite, setJambeDroite] = useState(false);
  const [enArriere, setEnArriere] = useState(false);
  const pad = padOf(p.offered);
  const large = layout === "large";
  const taille = large ? "px-4 text-sm" : layout === "couche" ? "px-1 text-xs" : "h-12 px-0.5 text-xs";
  const clampBpm = (v: number) => Math.max(GUIDE_BPM.min, Math.min(GUIDE_BPM.max, Math.round(v) || GUIDE_BPM.listen));

  const touche = (label: string | undefined) => clavier && label ? <kbd className="ml-1.5 font-mono text-xs opacity-70">{label}</kbd> : null;
  const figures = pad.figures.map(f => {
    const lead = (time: number) => p.onLead(padFigure(f, { jambeDroite, enArriere }), time);
    return (
      // Au doigt et à la souris : dès l'appui. Au clavier (Entrée sur le bouton) : au clic.
      <button key={f} type="button" disabled={p.auto} className={`${FIG} ${taille}`}
        onPointerDown={e => lead(e.timeStamp)} onClick={e => { if (e.detail === 0) lead(e.timeStamp); }}>
        <span>{GUIDE_FIGURES[f].label}</span>{touche(p.keys[f])}
      </button>
    );
  });
  const bascule = (label: string, on: boolean, toggle: () => void, key: string, title: string) => (
    <button key={label} type="button" aria-pressed={on} disabled={p.auto} title={title} onClick={toggle} className={`${MOD(on)} ${taille}`}>
      <span>{label}</span>{touche(key)}
    </button>
  );
  const bascules = [
    ...(pad.virgula ? [bascule("Virgula", p.virgula, p.onVirgula, "Maj", "Le prochain aller-retour se fait en virgula (pied gauche posé perpendiculaire), quand le pas le permet")] : []),
    ...(pad.jambeDroite ? [bascule("Jambe droite", jambeDroite, () => setJambeDroite(v => !v), "→", "Le prochain ida e volta part de la jambe droite")] : []),
    ...(pad.enArriere ? [bascule("En arrière", enArriere, () => setEnArriere(v => !v), "↓", "Le prochain ida e volta commence en arrière")] : []),
  ];
  const pave = [...figures, ...bascules];

  const retour = <a href={p.quitHref} aria-label="Retour à la vue en couple" title="Retour à la vue en couple" className={ICO}><IconeRetour /></a>;
  const pause = (
    <button type="button" aria-label={p.playing ? "Pause" : "Reprendre"} title={p.playing ? "Pause" : "Reprendre"} onClick={p.onPlaying} className={ICO}>
      {p.playing ? <IconePause /> : <IconeLecture />}
    </button>
  );
  const son = (
    <button type="button" aria-label={p.soundOn ? "Couper le son" : "Activer le son"} title={p.soundOn ? "Couper le son" : "Activer le son"}
      aria-pressed={p.soundOn} onClick={p.onSound} className={`${ICO} ${p.soundOn ? "!border-violet-300 !bg-violet-400 !text-slate-950" : ""}`}>
      {p.soundOn ? <IconeSon /> : <IconeSonCoupe />}
    </button>
  );
  const boutonPlus = (
    <button type="button" aria-label="Plus de commandes" title="Recommencer, caméra, tempo, partager, aide" aria-expanded={plus}
      onClick={() => setPlus(v => !v)} className={ICO}><IconePlus /></button>
  );
  const quiDanse = (extra = "") => (
    <div role="group" aria-label="Qui danse" className={`pointer-events-auto flex overflow-hidden rounded-xl border border-slate-700 bg-slate-900/90 ${extra}`}>
      <button type="button" aria-pressed={!p.auto} className={SEG(!p.auto, !large)}
        onClick={e => { if (p.auto) p.onAuto(e.timeStamp); }}>Je guide</button>
      <button type="button" aria-pressed={p.auto} className={SEG(p.auto, !large)}
        onClick={e => { if (!p.auto) p.onAuto(e.timeStamp); }}>Danse seule</button>
    </div>
  );
  const style = (extra = "") => (
    <select aria-label="Style de danse" value={p.styleKey} style={{ background: STYLES[p.styleKey].color }}
      onChange={e => { window.location.search = styleSearch(window.location.search, e.target.value); }}
      className={`pointer-events-auto h-11 min-w-0 rounded-xl border-0 px-3 text-sm font-semibold text-slate-950 touch-manipulation ${FOCUS} ${extra}`}>
      {Object.entries(STYLES).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
    </select>
  );
  const etat = (
    <>
      <span aria-label="compte" className="text-2xl font-semibold leading-none tabular-nums text-slate-100">{p.count}</span>
      <span className="flex min-w-0 flex-col text-left leading-tight">
        <span className="truncate text-[13px] font-semibold text-slate-100">{p.figure}{p.touch && <span className="font-normal text-amber-300"> · {p.touch}</span>}</span>
        <span aria-live="polite" aria-label="file de commandes" className="truncate text-xs text-sky-300">{p.queue}</span>
      </span>
    </>
  );
  // Au téléphone, l'état ouvre la fiche de la transition en cours : elle ne reste pas sur la scène.
  const etatBouton = (extra = "") => (
    <button type="button" aria-expanded={ficheOuverte} title="Voir la transition en cours" onClick={() => setFicheOuverte(v => !v)}
      className={`pointer-events-auto flex h-11 min-w-0 select-none items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-950/90 px-2.5 touch-manipulation ${FOCUS} ${extra}`}>
      {etat}
    </button>
  );

  const position = large ? "right-3 top-[4.25rem] w-80" : "inset-x-2 top-2";
  // Téléphone couché : l'écran est court (280 px avec la barre d'onglets de Safari), les commandes du panneau
  // se rangent sur deux colonnes pour tenir sans défilement.
  const rangees = layout === "couche" ? "grid grid-cols-1 items-center gap-x-4 gap-y-2 sm:grid-cols-2" : "contents";
  const keyIda = p.keys.ida ?? "Z";

  return (
    <div ref={root} data-hud={layout} className="pointer-events-none absolute inset-0">
      {layout === "droit" && <>
        <div data-marge="top" className="absolute inset-x-0 top-0 flex flex-col gap-1.5 px-2.5 pb-1.5" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
          {/* Sur un téléphone étroit l'état garde la largeur ; le style, rarement changé, est dans « Plus ». */}
          <div className="flex items-center gap-1.5">{retour}{etatBouton("flex-1")}{boutonPlus}</div>
          <div className="flex items-center gap-1.5">{quiDanse("flex-1")}{pause}{son}</div>
        </div>
        <div data-marge="bottom" className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col gap-1.5 rounded-t-2xl border-t border-slate-700 bg-slate-950 px-2.5 pt-2.5"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${padColumns(padSize(pad))}, minmax(0, 1fr))` }}>{pave}</div>
          <p className="px-0.5 text-[11px] leading-snug text-slate-400">{CREDIT}</p>
        </div>
      </>}

      {layout === "couche" && <>
        <div data-marge="left" className="absolute left-0 top-0 flex flex-col gap-1.5 py-2 pr-2" style={{ width: COLONNE.gauche, paddingLeft: "max(0.5rem, env(safe-area-inset-left))" }}>
          <div className="flex justify-between gap-1">{retour}{pause}{son}{boutonPlus}</div>
          {etatBouton()}
          {quiDanse()}
          {style("w-full")}
        </div>
        <p className="absolute bottom-2 text-[11px] leading-snug text-slate-400" style={{ width: `calc(${COLONNE.gauche} - 1rem)`, left: "max(0.5rem, env(safe-area-inset-left))" }}>{CREDIT}</p>
        <div data-marge="right" className="absolute right-0 top-0 grid grid-cols-2 gap-1.5 py-2 pl-2" style={{ width: COLONNE.droite, paddingRight: "max(0.5rem, env(safe-area-inset-right))" }}>{pave}</div>
      </>}

      {large && <>
        <div className="absolute left-3 top-3 flex max-w-md flex-col items-start gap-2">
          <div className="flex items-center gap-2">{retour}{style()}</div>
          <div className="pointer-events-auto rounded-2xl border border-slate-800 bg-slate-900/85 px-4 py-3">
            <div className="flex items-center gap-3">{etat}</div>
            {p.fiche && <div className="mt-2 border-t border-slate-800 pt-2">{p.fiche}</div>}
          </div>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2">{quiDanse("w-64")}{pause}{son}{boutonPlus}</div>
        <div data-marge="bottom" className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-3 pb-2 pt-2">
          <div className="flex flex-wrap justify-center gap-1.5">{figures}</div>
          {bascules.length > 0 && <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="mr-1 text-xs text-slate-400">Pour le prochain ida e volta</span>{bascules}
          </div>}
          <p className="text-center text-[11px] text-slate-400">{CREDIT} {RESERVE}</p>
        </div>
      </>}

      {!large && ficheOuverte && (
        <Panneau titre="Transition en cours" position={position} onFermer={() => setFicheOuverte(false)}>
          {p.fiche ?? <p className="text-slate-300">Pas de base : aucune transition en cours.</p>}
        </Panneau>
      )}

      {plus && (
        <Panneau titre="Plus" position={position} onFermer={() => setPlus(false)}>
          <div className={rangees}>
          {layout === "droit" && <div className="flex items-center justify-between gap-3"><span>Style</span>{style("max-w-[60%]")}</div>}
          <button type="button" className={LIGNE} onClick={() => { p.onRestart(); setPlus(false); }}>Recommencer</button>
          <div className="flex items-center justify-between gap-3">
            <span>Caméra</span>
            <div role="group" aria-label="Caméra" className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-900/90">
              <button type="button" aria-pressed={p.leaderView} className={SEG(p.leaderView)} onClick={() => p.onLeaderView(true)}>Guideur</button>
              <button type="button" aria-pressed={!p.leaderView} className={SEG(!p.leaderView)} onClick={() => p.onLeaderView(false)}>Libre</button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="jeu-tempo">Tempo</label>
            <div className="flex items-center gap-1.5">
              <button type="button" aria-label="Moins vite" className={ICO} onClick={() => p.onBpm(clampBpm(p.bpm - 5))}>−</button>
              <input id="jeu-tempo" type="number" inputMode="numeric" min={GUIDE_BPM.min} max={GUIDE_BPM.max} value={p.bpm}
                onChange={e => p.onBpm(clampBpm(Number(e.target.value)))}
                className={`h-11 w-16 rounded-xl border border-slate-700 bg-slate-800 px-2 text-center text-slate-100 ${FOCUS}`} />
              <span className="text-slate-400">bpm</span>
              <button type="button" aria-label="Plus vite" className={ICO} onClick={() => p.onBpm(clampBpm(p.bpm + 5))}>+</button>
            </div>
          </div>
          {p.auto && <button type="button" className={LIGNE} onClick={p.onShare}
            title="Copie le lien direct de la vitrine : la même danse, en musique, sans les commandes">
            {p.shared ? "Lien copié" : "Partager cette danse"}
          </button>}
          {p.shared && <input readOnly value={p.shared} aria-label="Lien direct de la vitrine" onFocus={e => e.currentTarget.select()}
            className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-xs text-slate-200" />}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-100">Comment jouer</h3>
            <p className="text-slate-300">{p.aide}</p>
          </div>
          {clavier && <div className="space-y-1">
            <h3 className="font-semibold text-slate-100">Au clavier</h3>
            <p className="text-slate-300">
              Espace : je guide ou danse seule. → ou ↓ maintenue + {keyIda} : ida e volta jambe droite, en arrière d'abord.
              ↑ ↑ : double et marka. ↑ pendant la sortie fille : fin de la sortie garçon. Maj + {keyIda} : en virgula.
            </p>
          </div>}
          <p className="text-[11px] leading-snug text-slate-400">{CREDIT} {RESERVE}</p>
        </Panneau>
      )}
    </div>
  );
}
