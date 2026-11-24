/** Barre de lecture de la page principale (#192), contre la scène : lecture, rejouer, pas de la figure,
 * tempo, son ; et ce qui se danse (le pas d'une figure en cinq actions, sinon le compte et la figure). */
import { seekClock, type DanceClock } from "../../clock";
import { transitionAt, type TransitionKey } from "../../transitions";
import { compteDe, figureLabel, nomDuPas, pasAffiche, pasVoisin } from "../../page";
import type { MovementKey } from "../../styles";
import { IconeLecture, IconePause, IconeRejouer, IconeRetour, IconeSon, IconeSonCoupe, IconeSuivant } from "../jeu/icones";
import { BoutonIcone, Curseur, FOCUS, useBattement, useTactile } from "./commun";
import type { Disposition, PageSon } from "./types";

const PAS = 5;

/** Transitions de la figure en cinq actions affichée. */
export const cleDesPas = (movement: MovementKey, deuxiemePas: string): TransitionKey =>
  movement === "sortieF" ? (deuxiemePas === "back" ? "sortieF:back" : "sortieF") : "sortieG";

/** Ce qui se danse : numéro et nom du pas, ou compte et figure ; `phrases` ajoute le guideur et la suiveuse. */
export function EtatPas({ clock, movement, cle, phrases = false, compact = false }: {
  clock: DanceClock; movement: MovementKey;
  /** Figure en cinq actions : ses transitions ; sinon null. */
  cle: TransitionKey | null; phrases?: boolean; compact?: boolean;
}) {
  const beat = useBattement(clock);
  const pas = cle ? pasAffiche(beat, PAS) : 0;
  const transition = cle ? transitionAt(cle, beat) : null;
  const nombre = cle ? (pas > 0 ? pas : "·") : compteDe(beat);
  const titre = cle ? (pas > 0 && transition ? nomDuPas(transition.title) : "Départ") : figureLabel(movement);
  return (
    <div className="flex min-w-0 items-center gap-3" aria-live="off">
      <span aria-label={cle ? "pas" : "compte"} className={`shrink-0 font-bold leading-none tabular-nums text-slate-100 ${compact ? "text-2xl" : "text-3xl"}`}>{nombre}</span>
      <div className="min-w-0">
        <div className={`truncate font-bold text-slate-100 ${compact ? "text-[15px]" : "text-lg"}`}>{titre}</div>
        {phrases && transition && <>
          <p className="truncate text-[13px] leading-snug text-slate-300" title={transition.leader}>
            <b className="font-semibold text-amber-300">Guideur</b> {transition.leader}
          </p>
          <p className="truncate text-[13px] leading-snug text-slate-300" title={transition.follower}>
            <b className="font-semibold text-sky-300">Suiveuse</b> {transition.follower}
          </p>
        </>}
      </div>
    </div>
  );
}

/** Départ et pas 1 à 5 : chacun arrête la lecture sur sa pose. Au téléphone : précédent, « Pas 4 sur 5 », suivant. */
function Pas({ clock, onPose, serre, fleches = false }: { clock: DanceClock; onPose: (pas: number) => void;
  /** Toujours la forme serrée (téléphone) ; sinon elle ne sert que sous 1024 px de large (tablette). */
  serre: boolean;
  /** Téléphone couché : les deux flèches seules, le pas est écrit juste au-dessus, sur la scène. */
  fleches?: boolean }) {
  const tactile = useTactile();
  const beat = useBattement(clock);
  const pas = pasAffiche(beat, PAS);
  const serree = (
      <div role="group" aria-label="Pas de la figure" data-commande="pas" className={`items-center gap-1 ${serre ? "flex" : "flex lg:hidden"}`}>
        <BoutonIcone nom="Pas précédent" disabled={pasVoisin(beat, -1, PAS) === pas && Number.isInteger(beat)} onClick={() => onPose(pasVoisin(beat, -1, PAS))}><IconeRetour /></BoutonIcone>
        {fleches ? <span className="sr-only" aria-live="polite">{pas === 0 ? "Départ" : `Pas ${pas} sur ${PAS}`}</span> : <>
          <span className="hidden w-[5.5rem] text-center text-sm font-semibold text-slate-100 min-[360px]:block" aria-live="polite">{pas === 0 ? "Départ" : `Pas ${pas} sur ${PAS}`}</span>
          <span className="w-11 text-center text-sm font-semibold text-slate-100 min-[360px]:hidden" aria-hidden="true">{pas === 0 ? "Dép." : `${pas} / ${PAS}`}</span>
        </>}
        <BoutonIcone nom="Pas suivant" disabled={pas === PAS && Number.isInteger(beat)} onClick={() => onPose(pasVoisin(beat, 1, PAS))}><IconeSuivant /></BoutonIcone>
      </div>
  );
  if (serre) return serree;
  const taille = tactile ? "h-11 min-w-[44px]" : "h-8 min-w-[32px]";
  const classe = (actif: boolean) => `${taille} select-none rounded-full border text-[13px] font-semibold touch-manipulation ${FOCUS} `
    + (actif ? "border-sky-400 bg-sky-400 text-slate-950" : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800");
  return (<>
    {serree}
    <div role="group" aria-label="Pas de la figure" data-commande="pas" className="hidden items-center gap-1.5 lg:flex">
      <button type="button" aria-current={pas === 0 ? "step" : undefined} onClick={() => onPose(0)} className={`${classe(pas === 0)} px-3`}>Départ</button>
      {Array.from({ length: PAS }, (_, i) => i + 1).map(i => (
        <button key={i} type="button" aria-label={`Pas ${i}`} aria-current={pas === i ? "step" : undefined} onClick={() => onPose(i)} className={classe(pas === i)}>{i}</button>
      ))}
    </div>
  </>);
}

/** Tempo, et le tempo que la musique conseille quand il diffère. */
export function Tempo({ bpm, onBpm, conseille, court = false, className = "" }: {
  bpm: number; onBpm: (bpm: number) => void; conseille: { bpm: number; nom: string; court: string } | null;
  /** Peu de place (téléphone) : « Piste : 102 » au lieu de « Tempo de la piste : 102 ». */
  court?: boolean; className?: string;
}) {
  const tactile = useTactile();
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <Curseur nom="Tempo" commande="tempo" valeur={bpm} min={24} max={140} pas={1} lu={`${bpm} bpm`} onChange={onBpm} className={`flex-1 ${court ? "min-w-[10rem]" : "min-w-[12rem]"}`} />
      {conseille && conseille.bpm !== bpm && (
        <button type="button" data-commande="tempoConseille" onClick={() => onBpm(conseille.bpm)}
          title={`Règle le tempo sur ${conseille.nom} ; la danse suit le même tempo`}
          className={`shrink-0 select-none whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-[13px] text-slate-200 hover:bg-slate-700 touch-manipulation ${FOCUS} ${tactile ? "h-11" : "h-8"}`}>
          {court ? conseille.court : conseille.nom} : {conseille.bpm}
        </button>
      )}
    </div>
  );
}

export default function BarreLecture({ clock, disposition, movement, cle, playing, onPlaying, bpm, onBpm, conseille, son }: {
  clock: DanceClock; disposition: Disposition; movement: MovementKey;
  cle: TransitionKey | null; playing: boolean; onPlaying: (playing: boolean) => void;
  bpm: number; onBpm: (bpm: number) => void; conseille: { bpm: number; nom: string; court: string } | null; son: PageSon;
}) {
  const large = disposition === "large";
  const sonActif = son.status === "on";
  const poser = (pas: number) => { seekClock(clock, pas); onPlaying(false); };
  const lecture = (
    <BoutonIcone nom={playing ? "Pause" : "Lecture"} commande="lecture" actif={playing} onClick={() => onPlaying(!playing)}>
      {playing ? <IconePause /> : <IconeLecture />}
    </BoutonIcone>
  );
  const rejouer = (
    <BoutonIcone nom="Rejouer depuis le début" commande="rejouer" onClick={() => { seekClock(clock, 0); onPlaying(true); }}><IconeRejouer /></BoutonIcone>
  );
  const boutonSon = (
    <button type="button" data-commande="son" aria-pressed={sonActif} onClick={son.toggle}
      aria-label={sonActif ? "Couper le son" : "Activer le son"} title={sonActif ? "Couper le son" : son.wanted ? "Le lien demande le son : touchez pour l'activer" : "Activer le son"}
      className={`inline-flex h-11 shrink-0 select-none items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium touch-manipulation ${FOCUS} `
        + (sonActif ? "border-violet-300 bg-violet-400 text-slate-950"
          : son.wanted ? "border-violet-400 bg-slate-800 text-violet-200 hover:bg-slate-700" : "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700")}>
      {sonActif ? <IconeSon /> : <IconeSonCoupe />}
      {large && <span>{son.status === "starting" ? "…" : "Son"}</span>}
    </button>
  );
  return (
    <div className={`flex shrink-0 flex-col border-t border-slate-800 bg-slate-950 ${large ? "gap-3 px-5 py-3.5" : "gap-1 px-3 py-2"}`}>
      {large && <EtatPas clock={clock} movement={movement} cle={cle} phrases />}
      <div className={`flex items-center ${large ? "flex-wrap gap-x-4 gap-y-2" : "justify-between gap-2"}`}>
        <div className="flex items-center gap-2">{lecture}{rejouer}</div>
        {cle && <Pas clock={clock} onPose={poser} serre={!large} fleches={disposition === "couche"} />}
        {large && <Tempo bpm={bpm} onBpm={onBpm} conseille={conseille} className="order-last basis-full xl:order-none xl:basis-0 xl:flex-1" />}
        <div className={large ? "ml-auto xl:ml-0" : undefined}>{boutonSon}</div>
      </div>
      {disposition === "droit" && <Tempo bpm={bpm} onBpm={onBpm} conseille={conseille} court />}
    </div>
  );
}
