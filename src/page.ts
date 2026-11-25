// Page principale : la scène toujours visible, les réglages dans un panneau (#192,
// docs/spec-page-scene-panneau.md). Onglets, figures offertes, inventaire des commandes et de leur place,
// pas affiché d'une figure, repère au centre, préréglage « Hanches au ralenti ».
// Fonctions PURES, testées en node (docs/features/page-scene-panneau.feature).
import { STYLES, movementAllowed, travelAllowed, type ModeKey, type MovementKey } from "./styles";

/** Ce qu'on regarde : un danseur, deux styles côte à côte, le couple. Le jeu est un lien. */
export type Onglet = "seul" | "comparer" | "couple";
export const ONGLETS: readonly { key: Onglet; label: string; mode: ModeKey }[] = [
  { key: "seul", label: "Seul", mode: "solo" },
  { key: "comparer", label: "Comparer", mode: "compare" },
  { key: "couple", label: "En couple", mode: "pair" },
];
/** `observe` (hanches au ralenti) est un préréglage de l'onglet « Seul ». */
export const ongletOf = (mode: ModeKey): Onglet => (mode === "compare" ? "comparer" : mode === "pair" ? "couple" : "seul");
export const modeOf = (onglet: Onglet): ModeKey => ONGLETS.find(o => o.key === onglet)!.mode;
/** Adresse du mode jeu, dans le style affiché. */
export const jeuHref = (style: string): string => `?mode=pair&guidage=1&style=${encodeURIComponent(style)}`;

export interface Figure { key: MovementKey; label: string; aide: string }
export const FIGURES: readonly Figure[] = [
  { key: "none", label: "Pas de base", aide: "Le pas de base du style ; en kizomba et en semba, le « 1 2 »" },
  { key: "surPlace", label: "Sur place", aide: "Kizomba et semba : le pas sur place, pieds plantés, d'avant le « 1 2 »" },
  { key: "corridinho", label: "Corridinho", aide: "Un quart de tour à droite puis à gauche, puis un cercle autour du repère" },
  { key: "quarts", label: "Quarts de tour", aide: "Quatre quarts font un tour complet, pivots en virgula" },
  { key: "temps3", label: "3 temps", aide: "Marka en trois temps, avec la largeur du pas" },
  { key: "ida", label: "Ida e volta", aide: "Aller-retour en 8 temps" },
  { key: "sortieG", label: "Sortie garçon", aide: "En couple, cinq actions : le guideur sort à sa gauche et rentre par un croisé" },
  { key: "sortieF", label: "Sortie fille", aide: "En couple, cinq actions : la suiveuse sort de la ligne" },
];
/** Figure historique, rangée sous « Mise au point ». */
export const SORTIE_COMBINEE: Figure = { key: "sortieGF", label: "Sortie combinée", aide: "Figure historique en 16 temps : sortie garçon puis sortie fille" };
const EN_COUPLE: readonly MovementKey[] = ["sortieG", "sortieF"];
/** #196 : le « Sur place » de la kizomba et du semba se danse seul ; en couple, le pas de base est déjà sur place. */
const SEUL: readonly MovementKey[] = ["surPlace"];
/** Figures qui ont leur bouton dans l'onglet : les sorties ne se dansent qu'en couple, le « Sur place » que seul. */
export const figuresOf = (onglet: Onglet): Figure[] => FIGURES.filter(f => onglet === "couple" ? !SEUL.includes(f.key) : !EN_COUPLE.includes(f.key));
export const figureLabel = (movement: MovementKey): string =>
  (movement === SORTIE_COMBINEE.key ? SORTIE_COMBINEE : FIGURES.find(f => f.key === movement) ?? FIGURES[0]).label;
/** Noms des styles affichés qui n'offrent pas la figure (vide : elle est offerte). */
export const stylesSansFigure = (styles: readonly string[], movement: MovementKey): string[] =>
  styles.filter(s => !movementAllowed(s, movement)).map(s => STYLES[s]?.label ?? s);
/** Noms des styles affichés qui ne se déplacent pas de côté. */
export const stylesSurPlace = (styles: readonly string[]): string[] =>
  styles.filter(s => !travelAllowed(s)).map(s => STYLES[s]?.label ?? s);

/** La vue affichée, pour savoir quelles commandes y servent. */
export interface Vue {
  onglet: Onglet;
  movement: MovementKey;
  /** Styles affichés : un, ou deux en comparaison. */
  styles: readonly string[];
  /** Le style écouté a une piste enregistrée (le choix de la source est proposé). */
  piste: boolean;
  /** La musique jouée est de synthèse (ses instruments se règlent). */
  synthese: boolean;
  /** Le tempo n'est pas celui que la musique conseille. */
  tempoDiffere: boolean;
}
/** Sortie garçon ou sortie fille en couple : cinq actions, une pose par pas. */
export const cinqActions = (v: Pick<Vue, "onglet" | "movement">): boolean => v.onglet === "couple" && EN_COUPLE.includes(v.movement);
/** Le couple a un placement (quinconce ou face à face) dans toutes ses figures, sauf la sortie combinée. */
export const aPlacement = (v: Pick<Vue, "onglet" | "movement">): boolean => v.onglet === "couple" && v.movement !== "sortieGF";

export type Place = "bandeau" | "lecture" | "panneau" | "figure" | "corps" | "mouvement" | "reperes" | "son" | "detail" | "miseAuPoint";
export const PLACES: Record<Place, string> = {
  bandeau: "Bandeau", lecture: "Barre de lecture", panneau: "Panneau", figure: "Sous la figure", corps: "Corps",
  mouvement: "Mouvement", reperes: "Repères au sol", son: "Son", detail: "Ce pas en détail", miseAuPoint: "Mise au point",
};
/** Tiroirs du panneau, dans l'ordre. */
export const TIROIRS: readonly Place[] = ["corps", "mouvement", "reperes", "son", "detail", "miseAuPoint"];

export interface Commande {
  /** Nom stable, porté par l'élément de la page (`data-commande`). */
  id: string;
  nom: string;
  place: Place;
  /** Paramètres d'URL que la commande règle. */
  params: readonly string[];
  quand: (v: Vue) => boolean;
}
const toujours = () => true;
const enCouple = (v: Vue) => v.onglet === "couple";
const horsSeul = (v: Vue) => v.onglet !== "seul";
/** Chaque commande de la page principale et sa place (docs/spec-page-scene-panneau.md, « Inventaire »). */
export const COMMANDES: readonly Commande[] = [
  { id: "onglets", nom: "Seul, Comparer, En couple", place: "bandeau", params: ["mode"], quand: toujours },
  { id: "jeu", nom: "Jeu", place: "bandeau", params: ["guidage"], quand: toujours },
  { id: "partager", nom: "Partager", place: "bandeau", params: [], quand: toujours },
  { id: "apropos", nom: "À propos", place: "bandeau", params: [], quand: toujours },
  { id: "lecture", nom: "Lecture, pause", place: "lecture", params: ["playing"], quand: toujours },
  { id: "rejouer", nom: "Rejouer", place: "lecture", params: [], quand: toujours },
  { id: "pas", nom: "Départ et pas 1 à 5", place: "lecture", params: ["sortieBeat"], quand: cinqActions },
  { id: "tempo", nom: "Tempo", place: "lecture", params: ["bpm"], quand: toujours },
  { id: "tempoConseille", nom: "Tempo de la piste, tempo conseillé", place: "lecture", params: [], quand: v => v.tempoDiffere },
  { id: "son", nom: "Son", place: "lecture", params: ["son"], quand: toujours },
  { id: "style", nom: "Style", place: "panneau", params: ["style"], quand: toujours },
  { id: "styleB", nom: "Style de droite", place: "panneau", params: ["styleB"], quand: v => v.onglet === "comparer" },
  { id: "figure", nom: "Figure", place: "panneau", params: ["corridinho", "quarts", "temps3", "ida", "sortieG", "sortieF", "surPlace"], quand: toujours },
  { id: "fin", nom: "Fin de la sortie garçon", place: "figure", params: ["sortieVariant"], quand: v => enCouple(v) && v.movement === "sortieG" },
  { id: "deuxiemePas", nom: "Deuxième pas du guideur", place: "figure", params: ["sortieFilleVariant"], quand: v => enCouple(v) && v.movement === "sortieF" },
  { id: "virgula", nom: "Virgula du guideur", place: "figure", params: ["virgula"], quand: v => enCouple(v) && v.movement === "ida" },
  { id: "placement", nom: "Placement du couple", place: "figure", params: ["placement"], quand: aPlacement },
  { id: "muscles", nom: "Squelette ou muscles", place: "corps", params: ["muscles"], quand: toujours },
  { id: "buste", nom: "Buste", place: "corps", params: ["torso"], quand: toujours },
  { id: "poids", nom: "Poids sur chaque pied", place: "corps", params: ["appui"], quand: toujours },
  { id: "montrer", nom: "Corps montrés", place: "corps", params: ["ghost"], quand: horsSeul },
  { id: "ralenti", nom: "Hanches au ralenti", place: "corps", params: [], quand: v => v.onglet === "seul" },
  { id: "amplitude", nom: "Amplitude", place: "mouvement", params: ["amp"], quand: toujours },
  { id: "largeurPas", nom: "Largeur du pas", place: "mouvement", params: ["travel"], quand: v => !cinqActions(v) && stylesSurPlace(v.styles).length === 0 },
  { id: "reculer", nom: "Reculer", place: "mouvement", params: ["dir"], quand: v => !cinqActions(v) },
  { id: "ligne", nom: "Ligne de danse", place: "reperes", params: ["ligne"], quand: horsSeul },
  { id: "repere", nom: "Repère au centre", place: "reperes", params: ["repere", "boussole"], quand: toujours },
  { id: "proximite", nom: "Repères de proximité", place: "reperes", params: ["contacts"], quand: enCouple },
  { id: "source", nom: "Source de la musique", place: "son", params: ["source"], quand: v => v.piste },
  { id: "volume", nom: "Volume", place: "son", params: [], quand: toujours },
  { id: "musiqueCote", nom: "Musique de gauche ou de droite", place: "son", params: ["musique"], quand: v => v.onglet === "comparer" },
  { id: "instruments", nom: "Instruments", place: "son", params: [], quand: v => v.synthese },
  { id: "detailPas", nom: "Ce pas en détail", place: "detail", params: [], quand: cinqActions },
  { id: "export", nom: "Exporter une vidéo", place: "panneau", params: [], quand: toujours },
  { id: "piedsPlantes", nom: "Pieds plantés", place: "miseAuPoint", params: ["plant"], quand: v => !cinqActions(v) },
  { id: "isolationBasse", nom: "Isolation basse", place: "miseAuPoint", params: ["iso"], quand: toujours },
  { id: "cadre", nom: "Cadre de bras", place: "miseAuPoint", params: ["cadre"], quand: toujours },
  { id: "contraSortie", nom: "Contraposition de la sortie garçon", place: "miseAuPoint", params: ["sortieContra"], quand: v => enCouple(v) && v.movement === "sortieG" },
  { id: "plexus", nom: "Plexus contre plexus", place: "miseAuPoint", params: ["contra"], quand: aPlacement },
  { id: "sortieCombinee", nom: "Sortie combinée", place: "miseAuPoint", params: ["sortieGF"], quand: enCouple },
];
/** Paramètres d'URL sans commande sur la page : captures, film, pages de vote, liens. */
export const PAR_ADRESSE: readonly string[] = ["cam", "angle", "zoom", "campos", "camtgt", "bare", "demo", "solid", "haut", "essai", "kompa", "semba", "unDeux", "flexion", "idaPoids",
  // #206 : les exercices d'isolation (docs/spec-isolations.md), filmés par le pont des mascottes.
  "isolation", "miroir"];

const COMMANDE_PAR_ID = new Map(COMMANDES.map(c => [c.id, c]));
export function commandeVisible(id: string, v: Vue): boolean {
  const c = COMMANDE_PAR_ID.get(id);
  if (!c) throw new Error(`commande inconnue : ${id}`);
  return c.quand(v);
}
/** Commandes que la page montre pour une vue, tiroirs ouverts. */
export const commandesAttendues = (v: Vue): string[] => COMMANDES.filter(c => c.quand(v)).map(c => c.id);
/** Un tiroir n'apparaît que s'il contient une commande pour la vue. */
export const tiroirVisible = (place: Place, v: Vue): boolean => COMMANDES.some(c => c.place === place && c.quand(v));
/** Commande qui règle un paramètre d'URL, ou null (paramètre réglé par l'adresse seulement). */
export const commandeDuParam = (param: string): string | null => COMMANDES.find(c => c.params.includes(param))?.id ?? null;

const borne = (beat: number, total: number) => (Number.isFinite(beat) ? Math.max(0, Math.min(total, beat)) : 0);
/** Pas affiché d'une figure en cinq actions : la pose quand l'horloge est sur un pas (0 = départ), sinon le
 * pas en train de se faire. */
export function pasAffiche(beat: number, total = 5): number {
  const b = borne(beat, total);
  return Number.isInteger(b) ? b : Math.ceil(b);
}
/** Pose précédente (-1) ou suivante (+1) : toujours un pas entier, entre le départ et le dernier pas. */
export function pasVoisin(beat: number, sens: -1 | 1, total = 5): number {
  const b = borne(beat, total);
  return sens > 0 ? Math.min(total, Math.floor(b) + 1) : Math.max(0, Math.ceil(b) - 1);
}
/** Compte de 1 à 8 de la musique, pour une figure sans pas nommés. */
export const compteDe = (beat: number): number => (Number.isFinite(beat) ? ((Math.floor(beat) % 8) + 8) % 8 + 1 : 1);
/** « 4 · Droit, retour en face » : le numéro est affiché à part, le nom seul reste. */
export const nomDuPas = (label: string): string => label.replace(/^\s*(Départ|\d+)\s*·\s*/, "");

/** Repère au centre de la piste : rien, le point, ou le point et sa boussole (`repere=`, `boussole=`). */
export type Repere = "masque" | "point" | "boussole";
export const REPERES: readonly { key: Repere; label: string }[] = [
  { key: "masque", label: "Masqué" }, { key: "point", label: "Point" }, { key: "boussole", label: "Boussole" },
];
export const repereOf = (repere: boolean, boussole: boolean): Repere => (!repere ? "masque" : boussole ? "boussole" : "point");
/** Masquer le repère garde le choix de la boussole, pour le retrouver. */
export const repereFlags = (choix: Repere, boussole: boolean): { repere: boolean; boussole: boolean } =>
  choix === "masque" ? { repere: false, boussole } : { repere: true, boussole: choix === "boussole" };

/** Réglages que « Hanches au ralenti » change. */
export interface Ralenti { bpm: number; torso: boolean; travel: number; appui: boolean }
/** Tempo lent, buste masqué, sur place, poids sur chaque pied affiché. */
export const RALENTI: Ralenti = { bpm: 32, torso: false, travel: 0, appui: true };
/** Réglages à remettre en quittant le ralenti : ceux d'avant ; sans eux (page ouverte déjà au ralenti),
 * buste affiché et poids masqué, le tempo et la largeur du pas restent. */
export function quitterRalenti(avant: Ralenti | null, maintenant: Ralenti): Ralenti {
  return avant ?? { bpm: maintenant.bpm, torso: true, travel: maintenant.travel, appui: false };
}

/** Nom d'un style sur un bouton du panneau : « Zouk » pour « Zouk brésilien », dont le nom entier ne tient pas dans
 * une colonne étroite (le nom entier reste sur la scène et dans l'info-bulle). */
export const nomCourtDuStyle = (label: string): string => label.replace(/^Zouk\b.*$/, "Zouk");

/** Qui est montré quand un seul corps reste opaque (`ghost=`). */
export const MONTRER: Record<"comparer" | "couple", readonly { key: string; label: string }[]> = {
  comparer: [{ key: "none", label: "Les deux" }, { key: "A", label: "Gauche" }, { key: "B", label: "Droite" }],
  couple: [{ key: "none", label: "Les deux" }, { key: "A", label: "Guideur" }, { key: "B", label: "Suiveuse" }],
};
