/** Page principale (#192, docs/spec-page-scene-panneau.md) : la scène toujours visible, sa barre de lecture,
 * et les réglages dans un panneau. Trois dispositions (`hudLayout`) : écran large, téléphone couché,
 * téléphone tenu droit ; la scène est le même élément dans les trois (tourner le téléphone ne la recharge
 * pas). L'état, la lecture de l'adresse et la scène restent dans `App`. */
import { useEffect, useState, type ReactNode } from "react";
import type { DanceClock } from "../../clock";
import { DIR_LABELS, isDiagonal } from "../../directions";
import { useHudLayout } from "../../hooks/useHudLayout";
import { usePersistentState } from "../../hooks/usePersistentState";
import { musicStyleOf } from "../../music/patterns";
import { recordingTempo } from "../../music/recordings";
import { STYLES } from "../../styles";
import { ONGLETS, cinqActions, jeuHref, modeOf, ongletOf, quitterRalenti, type Onglet, type Ralenti, type Vue } from "../../page";
import { IconeInfo, IconePartager } from "../jeu/icones";
import APropos from "./APropos";
import BarreLecture, { EtatPas, Tempo, cleDesPas } from "./BarreLecture";
import Panneau from "./Panneau";
import { BoutonIcone, FOCUS, TactileProvider, useTactile } from "./commun";
import type { Mesures, PageActions, PageEtat, PageSon } from "./types";

export interface PageProps {
  /** La scène 3D (le `Canvas` d'`App`). */
  scene: ReactNode;
  clock: DanceClock;
  etat: PageEtat;
  on: PageActions;
  son: PageSon;
  /** Mesures des deux rigs, relues par `App` quand « Poids sur chaque pied » est affiché. */
  mesures: Mesures;
  mesuresB: Mesures;
  onShare: () => void;
  copied: boolean;
  onExport: () => void;
  exporting: boolean;
  exportError: string;
}

function Onglets({ onglet, onOnglet, style, serre = false, className = "" }: {
  onglet: Onglet; onOnglet: (o: Onglet) => void; style: string;
  /** Panneau étroit (téléphone couché) : texte plus petit. */
  serre?: boolean; className?: string;
}) {
  const tactile = useTactile();
  // Chaque onglet prend la largeur de son nom, puis sa part de la place qui reste.
  const taille = `flex-auto ${tactile ? `h-11 min-w-[44px] ${serre ? "px-1 text-[13px]" : "px-1.5 text-sm"}` : "h-9 px-3 text-[13px]"}`;
  return (
    <nav aria-label="Ce qu'on regarde" data-commande="onglets" className={`flex overflow-hidden rounded-lg border border-slate-700 bg-slate-900 ${className}`}>
      {ONGLETS.map(o => (
        <button key={o.key} type="button" aria-current={o.key === onglet ? "page" : undefined} onClick={() => onOnglet(o.key)}
          className={`select-none whitespace-nowrap touch-manipulation ${FOCUS} ${taille} `
            + (o.key === onglet ? "bg-sky-400 font-semibold text-slate-950" : "text-slate-200 hover:bg-slate-800")}>
          {o.label}
        </button>
      ))}
      <a href={jeuHref(style)} data-commande="jeu" title="Le mode jeu : vous guidez la suiveuse, figure par figure"
        className={`flex select-none items-center justify-center whitespace-nowrap text-slate-200 hover:bg-slate-800 touch-manipulation ${FOCUS} ${taille}`}>
        Jeu
      </a>
    </nav>
  );
}

const pct = (v: number | undefined) => Math.round((v ?? 0) * 100);
const deg = (v: number | undefined, chiffres = 0) => (v ?? 0).toFixed(chiffres);
const signe = (v: number | undefined) => `${(v ?? 0) >= 0 ? "+" : ""}${(v ?? 0).toFixed(2)}`;

function Jauge({ nom, couleur, m }: { nom: string; couleur: string; m: Record<string, number> }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] font-semibold" style={{ color: couleur }}>{nom}</div>
      <div className="flex h-2.5 w-44 overflow-hidden rounded border border-slate-600">
        <div style={{ width: `${m.loadL * 100}%`, background: couleur, opacity: 0.95 }} title="poids sur le gauche" />
        <div style={{ width: `${m.loadR * 100}%`, background: couleur, opacity: 0.45 }} title="poids sur le droit" />
      </div>
      <div className="font-mono text-[10px] text-slate-200">
        G {pct(m.loadL)} % · D {pct(m.loadR)} % · genoux {deg(m.kneeL)}°/{deg(m.kneeR)}° · bassin {deg(m.roll, 1)}° · buste {deg(m.trunkTilt, 1)}°
      </div>
    </div>
  );
}

/** Poids sur chaque pied, genoux, bassin : mesures indicatives posées sur la scène. */
function Poids({ deux, noms, couleurs, a, b }: { deux: boolean; noms: [string, string]; couleurs: [string, string]; a: Mesures; b: Mesures }) {
  if (!a) return null;
  const cadre = "pointer-events-none absolute right-3 top-12 max-w-[92%] rounded-md bg-slate-900/80 px-2 py-1";
  if (deux) {
    if (!b) return null;
    return <div className={`${cadre} space-y-1.5`}><Jauge nom={noms[0]} couleur={couleurs[0]} m={a} /><Jauge nom={noms[1]} couleur={couleurs[1]} m={b} /></div>;
  }
  return (
    <div className={`${cadre} space-y-0.5 font-mono text-[11px] text-slate-100`}>
      <div>poids · G {pct(a.loadL)} % · D {pct(a.loadR)} %</div>
      <div>genoux · G {deg(a.kneeL)}° · D {deg(a.kneeR)}°</div>
      <div>bassin {deg(a.roll, 1)}° · buste {deg(a.trunkTilt, 1)}°</div>
      <div>regarde vers {DIR_LABELS[a.facing ?? 0]}{isDiagonal(a.facing ?? 0) ? " (diagonale)" : ""}</div>
      <div>sur la ligne {signe(a.posX)} m · en travers {signe(a.posZ)} m</div>
    </div>
  );
}

export default function PagePrincipale(p: PageProps) {
  const { etat, on, son } = p;
  const { layout, clavier } = useHudLayout();
  const large = layout === "large", couche = layout === "couche", droit = layout === "droit";
  const hauteur = clavier ? "h-10" : "h-11";
  const [apropos, setApropos] = useState(false);

  const onglet = ongletOf(etat.mode);
  const comparer = onglet === "comparer", couple = onglet === "couple";
  const musique = musicStyleOf(son.styleKey);
  const conseille = son.recording ? { bpm: recordingTempo(son.recording), nom: "Tempo de la piste", court: "Piste" }
    : { bpm: musique.bpm.default, nom: "Tempo conseillé", court: "Conseillé" };
  const vue: Vue = {
    onglet, movement: etat.movement, styles: comparer ? [etat.styleA, etat.styleB] : [etat.styleA],
    piste: son.hasRecording, synthese: !son.recording, tempoDiffere: conseille.bpm !== etat.bpm,
  };
  const cle = cinqActions(vue) ? cleDesPas(etat.movement, etat.sortieFilleVariant) : null;

  // « Hanches au ralenti » : `App` applique le préréglage en entrant dans le mode ; la page garde les
  // réglages d'avant pour les remettre en le quittant, par le tiroir ou par un autre onglet.
  const ralenti = etat.mode === "observe";
  const [avant, setAvant] = usePersistentState<Ralenti | null>("ralentiAvant", null);
  useEffect(() => { if (!ralenti && avant) setAvant(null); }, [ralenti, avant, setAvant]);
  const reglage = (): Ralenti => ({ bpm: etat.bpm, torso: etat.showTorso, travel: etat.travel, appui: etat.showAppui });
  const quitter = () => {
    const r = quitterRalenti(avant, reglage());
    on.bpm(r.bpm); on.showTorso(r.torso); on.travel(r.travel); on.showAppui(r.appui);
    setAvant(null);
  };
  const onRalenti = (actif: boolean) => {
    if (actif === ralenti) return;
    if (actif) { setAvant(reglage()); on.mode("observe"); } else { quitter(); on.mode("solo"); }
  };
  const onOnglet = (o: Onglet) => {
    if (o === onglet) return;
    if (ralenti) quitter();
    on.mode(modeOf(o));
  };

  const styleA = STYLES[etat.styleA], styleB = STYLES[couple ? etat.styleA : etat.styleB];
  const pastille = "pointer-events-none absolute top-3 rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-950";
  const partager = large ? (
    <button type="button" data-commande="partager" onClick={p.onShare} title="Copie un lien vers cette vue : tous les réglages et l'angle de la caméra"
      className={`inline-flex ${hauteur} select-none items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 hover:bg-slate-700 touch-manipulation ${FOCUS}`}>
      <IconePartager /><span aria-live="polite">{p.copied ? "Lien copié" : "Partager"}</span>
    </button>
  ) : (
    <span className="relative inline-flex">
      <BoutonIcone nom="Partager cette vue" commande="partager" discret onClick={p.onShare}><IconePartager /></BoutonIcone>
      {p.copied && <span role="status" className="absolute right-0 top-full z-30 mt-1 whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-950">Lien copié</span>}
    </span>
  );
  const info = large ? (
    <button type="button" data-commande="apropos" aria-haspopup="dialog" onClick={() => setApropos(true)}
      className={`inline-flex ${hauteur} select-none items-center rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 hover:bg-slate-700 touch-manipulation ${FOCUS}`}>
      À propos
    </button>
  ) : <BoutonIcone nom="À propos" commande="apropos" discret onClick={() => setApropos(true)}><IconeInfo /></BoutonIcone>;

  return (
    <TactileProvider value={!clavier}>
      <div data-page={layout} className={`flex flex-col bg-slate-950 text-slate-100 ${droit ? "min-h-screen" : "h-screen overflow-hidden"}`}>
        {!couche && (
          <header className={`flex shrink-0 items-center justify-between gap-4 ${large ? "h-14 border-b border-slate-800 px-5" : "h-12 pl-4 pr-1.5"}`}>
            <h1 className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
              <span className="text-[17px] font-bold">Comparateur 3D</span>
              {large && <span className="hidden truncate text-[13px] text-slate-400 xl:inline">des danses en couple</span>}
            </h1>
            {large && <Onglets onglet={onglet} onOnglet={onOnglet} style={etat.styleA} className="min-w-0 max-w-[440px] flex-1" />}
            <div className="flex shrink-0 items-center gap-2">{partager}{info}</div>
          </header>
        )}
        {droit && <Onglets onglet={onglet} onOnglet={onOnglet} style={etat.styleA} className="mx-3 mb-2.5 shrink-0" />}

        <div className={droit ? "flex flex-col" : "flex min-h-0 flex-1"}>
          <div className={droit ? "contents" : "flex min-w-0 flex-1 flex-col"}>
            <section aria-label="Scène 3D" data-scene className={`relative overflow-hidden bg-[#0b1220] ${droit ? "sticky top-0 z-20 h-[clamp(240px,45dvh,420px)] shrink-0" : "min-h-0 flex-1"}`}>
              <div className="absolute inset-0">{p.scene}</div>
              <span className={`${pastille} left-3`} style={{ background: styleA.color }}>{styleA.label}</span>
              {comparer && <span className={`${pastille} right-3`} style={{ background: styleB.color }}>{styleB.label}</span>}
              {etat.showAppui && <Poids deux={comparer || cle !== null} a={p.mesures} b={p.mesuresB}
                noms={cle ? ["Guideur", "Suiveuse"] : [`Gauche · ${styleA.label}`, `Droite · ${styleB.label}`]} couleurs={[styleA.color, styleB.color]} />}
              {large && <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-slate-400">
                {clavier ? "Glisser pour tourner, molette pour zoomer" : "Glisser pour tourner, pincer pour zoomer"}
              </div>}
              {!large && <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-slate-950/90 px-3 py-1.5">
                <EtatPas clock={p.clock} movement={etat.movement} cle={cle} compact />
              </div>}
              {p.exporting && <p role="status" className="absolute inset-x-0 top-10 mx-auto w-fit rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-950">Export de la vidéo en cours…</p>}
            </section>
            <fieldset disabled={p.exporting} className="m-0 min-w-0 shrink-0 border-0 p-0">
              <BarreLecture clock={p.clock} disposition={layout} movement={etat.movement} cle={cle} playing={etat.playing} onPlaying={on.playing}
                bpm={etat.bpm} onBpm={on.bpm} conseille={conseille} son={son} />
            </fieldset>
          </div>

          <aside aria-label="Réglages" style={couche ? { width: "clamp(272px, 42vw, 340px)" } : undefined}
            className={droit ? "px-4 pb-8 pt-2" : `shrink-0 overflow-y-auto border-l border-slate-800 bg-[#0b1120] ${large ? "w-[clamp(300px,32vw,360px)] p-5" : "p-3"}`}>
            {couche && <div className="mb-3 flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <Onglets onglet={onglet} onOnglet={onOnglet} style={etat.styleA} serre className="min-w-0 flex-1" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-bold">Comparateur 3D</span>
                <div className="flex items-center">{partager}{info}</div>
              </div>
              <Tempo bpm={etat.bpm} onBpm={on.bpm} conseille={conseille} court />
            </div>}
            <Panneau clock={p.clock} disposition={layout} vue={vue} cle={cle} etat={etat} on={on} son={son}
              ralenti={ralenti} onRalenti={onRalenti} onExport={p.onExport} exporting={p.exporting} exportError={p.exportError} />
          </aside>
        </div>

        {apropos && <APropos onFermer={() => setApropos(false)} onglet={onglet} movement={etat.movement}
          styleA={etat.styleA} styleB={etat.styleB} deuxiemePas={etat.sortieFilleVariant === "back" ? "back" : "hook"} />}
      </div>
    </TactileProvider>
  );
}
