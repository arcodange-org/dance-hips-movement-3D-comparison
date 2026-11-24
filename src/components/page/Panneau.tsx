/** Panneau de la page principale (#192) : le style, la figure et ses réglages, puis les tiroirs (Corps,
 * Mouvement, Repères au sol, Son, Ce pas en détail, Mise au point) et l'export. Une commande n'apparaît que
 * là où elle sert (`commandeVisible`, src/page.ts). */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HIP_WIDTH } from "../../anatomy";
import { seekClock, type DanceClock } from "../../clock";
import { musicStyleOf, type Evidence } from "../../music/patterns";
import { RECORDING_CREDIT, recordingTempo } from "../../music/recordings";
import { PLACEMENT_LABELS, type CouplePlacement } from "../../placement";
import { sortieFilleVariantOf } from "../../sortieFille";
import { STYLES, type MovementKey } from "../../styles";
import { transitionAt, type TransitionKey } from "../../transitions";
import {
  COMMANDES, MONTRER, REPERES, SORTIE_COMBINEE, commandeVisible, figuresOf, nomCourtDuStyle, repereFlags, repereOf, stylesSansFigure,
  stylesSurPlace, tiroirVisible, type Place, type Vue,
} from "../../page";
import TransitionCard from "../TransitionCard";
import { CREDIT } from "../credit";
import { Choix, Curseur, Etiquette, FOCUS, Interrupteur, Ligne, Segments, Tiroir, useBattement, useTactile } from "./commun";
import type { Disposition, PageActions, PageEtat, PageSon } from "./types";

const PREUVE: Record<Evidence, string> = { documenté: "text-emerald-300", faible: "text-amber-300", proposition: "text-slate-400" };
const liste = (noms: string[]) => noms.join(", ");
/** Noms courts des commandes, pour le résumé d'un tiroir fermé. */
const COURT: Record<string, string> = {
  poids: "poids", montrer: "corps montrés", largeurPas: "largeur du pas", ligne: "ligne", repere: "repère", proximite: "proximité",
  source: "source", musiqueCote: "musique",
};

/** Rangée de choix : sur un téléphone tenu droit elle défile de côté et garde le choix en vue. */
function Rangee({ nom, commande, defile, colonnes, children, choisi }: {
  nom: string; commande: string; defile: boolean; colonnes?: number; children: ReactNode; choisi: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const boite = ref.current;
    const bouton = boite?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!defile || !boite || !bouton) return;
    boite.scrollLeft = bouton.offsetLeft - (boite.clientWidth - bouton.clientWidth) / 2;
  }, [defile, choisi]);
  return (
    <div ref={ref} role="group" aria-label={nom} data-commande={commande}
      className={defile ? "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
        : colonnes ? "grid gap-2" : "flex flex-wrap gap-2"}
      style={!defile && colonnes ? { gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))` } : undefined}>
      {children}
    </div>
  );
}

function Styles({ nom, commande, valeur, onChange, defile }: { nom: string; commande: string; valeur: string; onChange: (s: string) => void; defile: boolean }) {
  return (
    <Rangee nom={nom} commande={commande} defile={defile} colonnes={3} choisi={valeur}>
      {Object.entries(STYLES).map(([key, st]) => (
        <Choix key={key} actif={key === valeur} couleur={st.color} large={defile} title={st.label} onClick={() => onChange(key)}>{nomCourtDuStyle(st.label)}</Choix>
      ))}
    </Rangee>
  );
}

/** Fiche du pas en cours : guideur, suiveuse, contacts, sources. */
function DetailPas({ clock, cle }: { clock: DanceClock; cle: TransitionKey }) {
  const beat = useBattement(clock);
  return <div data-commande="detailPas"><TransitionCard transition={transitionAt(cle, beat)} /></div>;
}

export default function Panneau({ clock, disposition, vue, cle, etat, on, son, ralenti, onRalenti, onExport, exporting, exportError }: {
  clock: DanceClock; disposition: Disposition; vue: Vue; cle: TransitionKey | null;
  etat: PageEtat; on: PageActions; son: PageSon;
  ralenti: boolean; onRalenti: (actif: boolean) => void;
  onExport: () => void; exporting: boolean; exportError: string;
}) {
  const tactile = useTactile();
  const [ouverts, setOuverts] = useState<Partial<Record<Place, boolean>>>({});
  const montre = (id: string) => commandeVisible(id, vue);
  const defile = disposition === "droit";
  const couple = vue.onglet === "couple";
  const comparer = vue.onglet === "comparer";
  // Changer une variante ou le placement repart de la pose de départ, lecture arrêtée.
  const auDepart = () => { seekClock(clock, 0); on.playing(false); };

  const musique = musicStyleOf(son.styleKey);
  const sonActif = son.status === "on";
  const vitesse = son.recording ? Math.round((etat.bpm / son.recording.bpm) * 100) : 100;
  const lent = etat.bpm < musique.bpm.min, vite = etat.bpm > musique.bpm.max;

  // Tiroir fermé : les deux premières commandes qu'il contient pour la vue.
  const resume = (place: Place) => COMMANDES.filter(c => c.place === place && c.quand(vue)).slice(0, 2).map(c => COURT[c.id] ?? c.nom.toLowerCase()).join(", ");
  const tiroir = (place: Place, titre: string, contenu: ReactNode, extra?: ReactNode, dit?: string) => tiroirVisible(place, vue) && (
    <Tiroir key={place} id={place} titre={titre} resume={dit ?? resume(place)} extra={extra} ouvert={!!ouverts[place]}
      onOuvert={v => setOuverts(o => ({ ...o, [place]: v }))}>{contenu}</Tiroir>
  );
  const reglagesFigure = ["fin", "deuxiemePas", "virgula", "placement"].some(montre);
  const sansLargeur = stylesSurPlace(vue.styles);

  return (
    <fieldset disabled={exporting} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
      <div className="flex flex-col gap-2">
        <Etiquette>{comparer ? "Style de gauche" : "Style"}</Etiquette>
        <Styles nom={comparer ? "Style de gauche" : "Style"} commande="style" valeur={etat.styleA} onChange={on.styleA} defile={defile} />
        {montre("styleB") && <>
          <Etiquette>Style de droite</Etiquette>
          <Styles nom="Style de droite" commande="styleB" valeur={etat.styleB} onChange={on.styleB} defile={defile} />
        </>}
      </div>

      <div className="flex flex-col gap-2">
        <Etiquette>Figure</Etiquette>
        <Rangee nom="Figure" commande="figure" defile={defile} choisi={etat.movement}>
          {figuresOf(vue.onglet).map(f => {
            const sans = stylesSansFigure(vue.styles, f.key);
            return (
              <Choix key={f.key} actif={etat.movement === f.key} large={defile} disabled={sans.length > 0}
                title={sans.length ? `${f.label} : pas en ${liste(sans)} (sur place et ida e volta seulement)` : f.aide}
                onClick={() => on.movement(f.key)}>{f.label}</Choix>
            );
          })}
        </Rangee>
        {reglagesFigure && (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
            {montre("fin") && <Ligne nom="Fin" aide="Fin de la sortie garçon : retour sur la ligne, ou décalage commun à droite">
              <Segments nom="Fin de la sortie garçon" commande="fin" valeur={etat.sortieVariant} className="min-w-[13rem] flex-auto"
                options={[{ key: "line", label: "Sur la ligne" }, { key: "right", label: "À droite" }]}
                onChange={v => { on.sortieVariant(v); auDepart(); }} />
            </Ligne>}
            {montre("deuxiemePas") && <Ligne nom="Deuxième pas du guideur" aide="Crochet du droit, ou recul du droit">
              <Segments nom="Deuxième pas du guideur" commande="deuxiemePas" valeur={etat.sortieFilleVariant} className="min-w-[11rem] flex-auto"
                options={[{ key: "hook", label: "Crochet" }, { key: "back", label: "Recul" }]}
                onChange={v => { on.sortieFilleVariant(sortieFilleVariantOf(v)); auDepart(); }} />
            </Ligne>}
            {montre("virgula") && <Interrupteur nom="Virgula du guideur" commande="virgula" valeur={etat.idaVirgula} onChange={on.idaVirgula}
              aide="Effet de style : quand son gauche avance, il se pose perpendiculaire, pointe à gauche, talon près du droit ; son bassin s'ouvre et son buste garde sa direction" />}
            {montre("placement") && <Ligne nom="Placement" aide="En quinconce, les demi-pointes se touchent et les genoux droits se croisent">
              <Segments nom="Placement du couple" commande="placement" valeur={etat.placement} className="min-w-[13rem] flex-auto"
                options={(Object.keys(PLACEMENT_LABELS) as CouplePlacement[]).map(key => ({ key, label: key === "quinconce" ? "Quinconce" : "Face à face", title: PLACEMENT_LABELS[key] }))}
                onChange={v => { on.placement(v); auDepart(); }} />
            </Ligne>}
          </div>
        )}
      </div>

      <div className="flex flex-col border-b border-slate-800">
        {tiroir("corps", "Corps", <>
          <Interrupteur nom="Buste" commande="buste" valeur={etat.showTorso} onChange={on.showTorso} aide="Buste stylisé, en transparence au-dessus du bassin" />
          <Interrupteur nom="Poids sur chaque pied" commande="poids" valeur={etat.showAppui} onChange={on.showAppui}
            aide="Pastilles de charge sous les pieds, chaîne d'appui du pied à la hanche, et mesures sur la scène (indicatif)" />
          {montre("montrer") && <Ligne nom="Montrer" aide="L'autre corps devient transparent">
            <Segments nom="Corps montrés" commande="montrer" valeur={etat.ghostSel} options={MONTRER[couple ? "couple" : "comparer"]}
              onChange={on.ghostSel} className="min-w-[14rem] flex-auto" />
          </Ligne>}
          {montre("ralenti") && <Interrupteur nom="Hanches au ralenti" commande="ralenti" valeur={ralenti} onChange={onRalenti}
            aide="Tempo lent, buste masqué, sur place, poids sur chaque pied : pour suivre le bassin temps par temps. Le quitter remet les réglages d'avant" />}
        </>, <Segments nom="Corps affiché" commande="muscles" valeur={etat.showMuscles ? "muscles" : "squelette"}
          options={[{ key: "squelette", label: "Squelette" }, { key: "muscles", label: "Muscles", title: "Couche musculaire BodyParts3D, CC BY-SA 2.1 Japan © DBCLS" }]}
          onChange={v => on.showMuscles(v === "muscles")} />)}

        {tiroir("mouvement", "Mouvement", <>
          <Curseur nom="Amplitude" commande="amplitude" valeur={etat.amp} min={0.5} max={2} pas={0.05} lu={`${Math.round(etat.amp * 100)} %`} onChange={on.amp} />
          {montre("largeurPas") && <Curseur nom="Largeur du pas" commande="largeurPas" valeur={etat.travel} min={0} max={1} pas={0.05} onChange={on.travel}
            lu={etat.travel < 0.03 ? "sur place" : `±${Math.round(etat.travel * (HIP_WIDTH / 2) * 100)} cm`}
            aide="De sur place à une largeur de hanche : les pieds marchent dès que le pas s'élargit" />}
          {montre("reculer") && <Interrupteur nom="Reculer" commande="reculer" valeur={etat.dir < 0} onChange={v => on.dir(v ? -1 : 1)}
            aide="Inverse le sens du déplacement le long de la ligne de danse" />}
          {cle && <p className="text-xs text-slate-400">Pendant une sortie, les pas sont ceux de la figure.</p>}
          {!cle && sansLargeur.length > 0 && <p className="text-xs text-slate-400">{liste(sansLargeur)} : sur place et ida e volta seulement.</p>}
        </>)}

        {tiroir("reperes", "Repères au sol", <>
          {montre("ligne") && <Interrupteur nom="Ligne de danse" commande="ligne" valeur={etat.showLigne} onChange={on.showLigne}
            aide={couple ? "Elle passe par les deux danseurs ; le couple progresse le long de la ligne" : "La ligne le long de laquelle on se déplace"} />}
          <Ligne nom="Repère au centre" aide="Point fixe au sol d'où se lisent les déplacements ; sa boussole donne huit directions">
            <Segments nom="Repère au centre" commande="repere" valeur={repereOf(etat.showRepere, etat.showBoussole)} options={REPERES} className="min-w-[14rem] flex-auto"
              onChange={choix => { const f = repereFlags(choix, etat.showBoussole); on.showRepere(f.repere); on.showBoussole(f.boussole); }} />
          </Ligne>
          {montre("proximite") && <Interrupteur nom="Repères de proximité" commande="proximite" valeur={etat.showContacts} onChange={on.showContacts}
            aide="Repères proches ou éloignés entre les deux corps : une distance illustrative, pas un contact mesuré" />}
        </>)}

        {tiroir("son", "Son", <>
          {montre("source") && <Ligne nom="Source">
            <Segments nom="Source de la musique" commande="source" valeur={son.source} onChange={son.onSource} className="min-w-[14rem] flex-auto"
              options={[{ key: "enregistrement", label: "Enregistrement", title: "Boucle enregistrée, générée par IA (Eleven Music, ElevenLabs)" },
                { key: "synthese", label: "Synthèse", title: "Musique synthétisée dans le navigateur d'après les grilles documentées" }]} />
          </Ligne>}
          <Curseur nom="Volume" commande="volume" valeur={son.volume} min={0} max={1} pas={0.05} lu={`${Math.round(son.volume * 100)} %`} onChange={son.onVolume} />
          {montre("musiqueCote") && <Ligne nom="Musique" aide="En comparaison, la musique est celle d'un des deux styles">
            <Segments nom="Musique jouée en comparaison" commande="musiqueCote" valeur={son.side} onChange={son.onSide} className="min-w-[14rem] flex-auto"
              options={[{ key: "A", label: `Gauche · ${nomCourtDuStyle(STYLES[etat.styleA]?.label ?? etat.styleA)}` },
                { key: "B", label: `Droite · ${nomCourtDuStyle(STYLES[etat.styleB]?.label ?? etat.styleB)}` }]} />
          </Ligne>}
          <p className="text-xs leading-relaxed text-slate-400">
            {son.recording
              ? <>{musique.label} : boucle de {son.recording.beats} temps à {recordingTempo(son.recording)} bpm.
                {vitesse !== 100 && sonActif && <span className="text-amber-300"> Piste jouée à {vitesse} % de sa vitesse : sa hauteur change.</span>}
                {son.loading && <span role="status"> Chargement de la piste…</span>}</>
              : <>{musique.label} : {musique.bpm.min} à {musique.bpm.max} bpm, {musique.meter}{musique.swing ? `, swing ${musique.swing}` : ""}.
                {(lent || vite) && sonActif && <span className="text-amber-300"> Musique {lent ? "ralentie" : "accélérée"} au tempo choisi.</span>}</>}
          </p>
          {son.status === "unsupported" && <p role="alert" className="text-xs text-amber-300">Le son n'est pas disponible dans ce navigateur.</p>}
          {son.status === "error" && <p role="alert" className="text-xs text-amber-300">Impossible de démarrer le son.</p>}
          {son.unavailable && sonActif && <p role="alert" className="text-xs text-amber-300">Enregistrement indisponible : musique synthétisée.</p>}
          {montre("instruments") && <div role="group" aria-label="Instruments" data-commande="instruments" className="space-y-1">
            <Etiquette>Instruments, et leur niveau de preuve</Etiquette>
            {musique.tracks.map(piste => (
              <label key={piste.id} title={piste.source} className={`flex cursor-pointer items-center gap-2.5 text-sm text-slate-200 ${tactile ? "min-h-[44px]" : "min-h-[28px]"}`}>
                <input type="checkbox" className={`accent-violet-400 ${tactile ? "h-5 w-5" : ""}`} checked={!son.muted.includes(piste.id)}
                  onChange={e => son.onMuted(e.target.checked ? son.muted.filter(m => m !== piste.id) : [...son.muted, piste.id])} />
                <span>{piste.label} <span className={PREUVE[piste.evidence]}>({piste.evidence})</span></span>
              </label>
            ))}
          </div>}
          <p className="text-[11px] leading-relaxed text-slate-500">
            {son.recording ? `${RECORDING_CREDIT}. Boucle calée sur le temps de la danse.`
              : "Grilles simplifiées d'après la documentation du dépôt ; timbres synthétisés, aucune œuvre reprise."} Le son ne change pas la danse.
          </p>
        </>)}

        {cle && tiroir("detail", "Ce pas en détail", <DetailPas clock={clock} cle={cle} />, undefined, "guideur, suiveuse, contacts")}

        {tiroir("miseAuPoint", "Mise au point", <>
          {montre("piedsPlantes") && <Interrupteur nom="Pieds plantés" commande="piedsPlantes" valeur={etat.plant} onChange={on.plant}
            aide="Sur place, les pieds restent au sol ; un petit pivot sur la plante est permis" />}
          <Interrupteur nom="Isolation basse" commande="isolationBasse" valeur={etat.iso} onChange={on.iso}
            aide="Le roulis du bassin est compensé par la colonne : le buste reste stable au-dessus des hanches" />
          <Interrupteur nom="Cadre de bras" commande="cadre" valeur={etat.cadre} onChange={on.cadre}
            aide="Bras en cadre de danseur ; sinon le long du corps" />
          {montre("contraSortie") && <Curseur nom="Contraposition de la sortie garçon" commande="contraSortie" valeur={etat.sortieContra} min={0} max={30} pas={1}
            lu={`${etat.sortieContra}°`} onChange={on.sortieContra} aide="Réglage d'illustration, sans valeur imposée par style" />}
          {montre("plexus") && <Ligne nom="Plexus contre plexus" aide="Le buste fait face au partenaire (contraposition), ou reste aligné sur le bassin">
            <Segments nom="Plexus contre plexus" commande="plexus" valeur={etat.contraposition ? "1" : "0"} className="min-w-[14rem] flex-auto"
              options={[{ key: "1", label: "Avec contraposition", title: "Le buste fait face au partenaire" }, { key: "0", label: "Sans", title: "Le buste reste aligné sur le bassin" }]}
              onChange={v => on.contraposition(v === "0" ? 0 : 1)} />
          </Ligne>}
          {montre("sortieCombinee") && <Interrupteur nom={SORTIE_COMBINEE.label} commande="sortieCombinee" aide={SORTIE_COMBINEE.aide}
            valeur={etat.movement === SORTIE_COMBINEE.key} onChange={v => on.movement((v ? SORTIE_COMBINEE.key : "none") as MovementKey)} />}
        </>)}
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" data-commande="export" onClick={onExport}
          title="Enregistre un cycle complet de la danse dans un fichier vidéo (WebM)"
          className={`select-none rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 hover:bg-slate-700 touch-manipulation ${FOCUS} ${tactile ? "h-11" : "h-9"}`}>
          Exporter une vidéo
        </button>
        {exportError && <p role="alert" className="text-xs text-amber-300">{exportError}</p>}
        <p className="text-[11px] leading-relaxed text-slate-400">{CREDIT}</p>
      </div>
    </fieldset>
  );
}
