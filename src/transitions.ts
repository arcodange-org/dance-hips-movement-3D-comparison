/** What each transition engages and what the partner receives (#94, docs/spec-transitions.md).
 * Pure data, in French (shown as is in the app and the game). Sources: owner rules (R…,
 * docs/regles-proprietaire.md), owner requests (Pr), the frame references (S7, S8, S16,
 * docs/cadre/figures-du-depot.md#références) and the repository issues (#…). No text invents a feeling:
 * when the reception is not sourced, the follower's line says what she does. */
import { CHAIN_BEATS, CHAIN_BRIDGE, CHAIN_FROM, CHAIN_TO } from "./enchainement";
import { INSERTED_BEATS, INSERTION_AT, INSERTION_BEATS, INSERTION_VARIANT } from "./insertion";
import type { IdaVariant } from "./idaPaire";

export interface Transition {
  /** Local beats of the figure where the transition starts and ends. */
  from: number; to: number;
  /** The position reached, in a few words. */
  title: string;
  /** What the leader engages: body part, direction, contact point. */
  leader: string;
  /** What the follower receives and does. */
  follower: string;
  /** Distance and contacts that change. */
  contacts: string;
  sources: string[];
}
type Entry = Omit<Transition, "from" | "to">;
export type TransitionKey = "sortieG" | "sortieF" | "sortieF:back" | "sortieFG" | "sortieFI" | "sortieGI" | "quart"
  | "ida" | "idaD" | "idaArr" | "idaArrD" | "avance" | "recule" | "double";

const MARKA_HOLD = 1;

// Sortie garçon (#110: the follower only walks back; the leader alone makes the room for his exit).
const SORTIE_G: Entry[] = [
  { title: "1 · G du leader en avant, vers son couloir",
    leader: "Son buste avance (compression du plexus), puis son G part plus en avant que de côté, vers le couloir à sa gauche.",
    follower: "Reçoit l'avancée du buste : recule son D, droit, torse face au leader.",
    contacts: "Plexus en compression, main D sur l'omoplate ; le bassin du leader commence à quitter l'axe.",
    sources: ["S16", "Pr", "#110", "R24"] },
  { title: "2 · D du leader hors ligne, flancs droits",
    leader: "Avance son D à l'extérieur du D du suiveur, bassin au-dessus de ce pied ; le buste reste face (contre-corps).",
    follower: "Recule son G, droit : on ne lui guide que la marche arrière.",
    contacts: "Cuisses D au contact sur le côté ; la moitié droite des bustes se fait face ; pieds D à 12 cm environ.",
    sources: ["Pr", "#104", "#110"] },
  { title: "3 · G du leader croisé, retour vers la ligne",
    leader: "Croise son G devant son D et revient vers la ligne en continuant d'avancer ; le contre-corps se relâche.",
    follower: "Recule son D ; son torse revient face.",
    contacts: "Le contact des cuisses se libère ; main D et plexus ramènent le cadre dans l'axe.",
    sources: ["S16", "#110"] },
  { title: "4 · D du leader en face",
    leader: "Ramène son D en face, au neutre par rapport à son G (variante : pas de côté du cadre entier).",
    follower: "S'ajuste en face avec son G (variante : suit le décalage).",
    contacts: "Retour au neutre ; les hanches se cherchent de nouveau.",
    sources: ["R17", "S16"] },
  { title: "5 · Marka",
    leader: "Marka du G sans transfert : il freine son buste et garde le poids à droite.",
    follower: "Pose son D sans transfert.",
    contacts: "Plexus et main D freinent ; le poids reste en place.",
    sources: ["S8"] },
];

// Sortie fille (#105: steps in the owner's units).
const SORTIE_F_1: Entry = { title: "1 · G du leader avance d'un pied",
  leader: "Son buste avance puis se relâche ; sa main D commence à glisser vers sa droite sur le dos du suiveur.",
  follower: "Recule son D d'un pied ; son torse commence à répondre, jamais avant le leader.",
  contacts: "La poitrine se déconnecte légèrement ; l'ouverture du buste s'annonce.",
  sources: ["S8", "#105", "R24"] };
// #127: in the hook variant the leader's G1 is a virgula.
const SORTIE_F_1_HOOK: Entry = { title: "1 · G du leader en virgula",
  leader: "Avance son G d'un pied et le pose perpendiculaire, pointe à gauche, talon près de son D : son bassin s'ouvre à gauche, son buste garde sa direction (contraposition) ; sa main D commence à glisser vers sa droite.",
  follower: "Recule son D d'un pied ; son buste reste stable, il ne suit pas le bassin du leader, et commence à répondre, jamais avant le leader.",
  contacts: "La poitrine se déconnecte légèrement ; l'ouverture du buste s'annonce ; le bassin du leader tourne sous un buste qui ne tourne pas.",
  sources: ["Pr", "S8", "#105", "#127", "R24"] };
const SORTIE_F_2_HOOK: Entry = { title: "2 · Crochet du leader, le suiveur sort à gauche",
  leader: "Crochet de son D vers sa droite ; le cadre (bras D) ou le buste, en contraposition, ouvre un couloir à sa droite.",
  follower: "Pas latéral de son G vers sa gauche (une hanche et demie), torse tourné vers le leader.",
  contacts: "Couloir ouvert entre les bassins ; la main G du suiveur décrit un cercle.",
  sources: ["Pr", "S8", "#105"] };
const SORTIE_F_2_BACK: Entry = { title: "2 · Le leader recule, le suiveur sort en diagonale",
  leader: "Recule son D directement, au lieu du crochet ; bras et buste ouvrent comme au crochet.",
  follower: "Avance son G en diagonale vers sa gauche.",
  contacts: "Le plexus recule légèrement ; couloir ouvert à droite du leader.",
  sources: ["Pr", "#105"] };
const SORTIE_F_REST: Entry[] = [
  { title: "3 · Le suiveur avance le long du flanc droit",
    leader: "Recule son G en gardant le torse tourné ; sa main D accompagne le suiveur vers l'avant.",
    follower: "Avance son D en diagonale, à droite du D du leader, et cherche le contact de cuisse.",
    contacts: "Cuisses D au contact (milieu et haut) ; son D s'arrête 15 à 17 cm en retrait de celui du leader.",
    sources: ["S8", "Pr", "#105"] },
  { title: "4 · Reconnexion, retour sur la ligne",
    leader: "Recule son D pour dégager ; son torse revient au neutre, signal de reconnexion.",
    follower: "Croise son G devant son D, torse revenu face.",
    contacts: "Les hanches se cherchent de nouveau ; le cadre revient dans l'axe.",
    sources: ["S8", "R17"] },
  { title: "5 · Marka",
    leader: "Marka du G : il freine et garde le poids du même côté.",
    follower: "Ramène son D sans transfert.",
    contacts: "Décélération ; le poids reste en place.",
    sources: ["S8"] },
];

// Quarter turn (#82: both first feet leave together; R25: pelvis and chest turn with the feet).
const QUART: Entry[] = [
  { title: "Premier pied : la diagonale",
    leader: "Engage buste et bassin avec son G, qui part avec le D du suiveur et se pose talon au bout du D, en angle droit ; le corps est en diagonale, son épaule G en avance.",
    follower: "Son D recule d'abord le long de son chemin puis tourne, posé sur le 1 avec le G du leader ; bassin et buste en diagonale.",
    contacts: "Le cadre tourne d'un bloc, la main D pivote ; cuisses intercalées, genoux presque tendus au croisement.",
    sources: ["R25", "R24", "S16", "S7", "#82", "#106"] },
  { title: "Second pied : le quart",
    leader: "Son D, monté sur sa demi-pointe pendant que le G le porte, contourne le talon du G ; le reste du corps rattrape l'épaule G.",
    follower: "Son G recule et rejoint, posé sur le 3 ; le bassin rattrape le côté déjà tourné.",
    contacts: "Les bassins se réalignent ; le quinconce est retrouvé à la fin du quart.",
    sources: ["R25", "R11", "#106"] },
];

// Ida e volta (#107): one out-and-back per 2 beats; slots in the default order.
const IDA_SLOTS: Entry[] = [
  { title: "Avant G et retour",
    leader: "Avance son G d'un pied environ, poids posé sur le temps, puis le rend et revient au neutre ; buste en contraposition.",
    follower: "Recule son D de la même longueur, parti avec le pied du leader ; il dégage le couloir le premier, puis revient.",
    contacts: "Les bustes gardent le contact par la contraposition ; même longueur de pas pour les deux.",
    sources: ["R22", "R24", "R4", "#107"] },
  { title: "Arrière G et retour",
    leader: "Recule son G, poids posé sur le temps, puis revient ; buste en contraposition.",
    follower: "Avance son D de la même longueur, parti juste après le pied du leader, puis revient.",
    contacts: "Les bustes gardent le contact par la contraposition ; même longueur de pas pour les deux.",
    sources: ["R22", "R24", "R4", "#107"] },
  { title: "Avant D et retour",
    leader: "Avance son D d'un pied environ, poids posé sur le temps, puis le rend et revient au neutre ; buste en contraposition.",
    follower: "Recule son G de la même longueur, parti avec le pied du leader ; il dégage le couloir le premier, puis revient.",
    contacts: "Les bustes gardent le contact par la contraposition ; même longueur de pas pour les deux.",
    sources: ["R22", "R24", "R4", "#107"] },
  { title: "Arrière D et retour",
    leader: "Recule son D, poids posé sur le temps, puis revient ; buste en contraposition.",
    follower: "Avance son G de la même longueur, parti juste après le pied du leader, puis revient.",
    contacts: "Les bustes gardent le contact par la contraposition ; même longueur de pas pour les deux.",
    sources: ["R22", "R24", "R4", "#107"] },
];
/** The 4 slots of an ida variant (#89: a variant starts the same cycle further on). */
const idaSlots = (v: IdaVariant): Entry[] => {
  const shift = (v.side === "R" ? 2 : 0) + (v.back ? 1 : 0);
  return [0, 1, 2, 3].map(i => IDA_SLOTS[(i + shift) % 4]);
};

// Game walks (#89: « haut = avancer (PG puis PD) ; bas = reculer » ; double « PG + PD en 1 temps + marka »).
const AVANCE: Entry[] = [
  { title: "PG en avant",
    leader: "Avance son G d'un pied ; le buste porte l'intention.",
    follower: "Recule son D en miroir, parti avec le pied du leader.",
    contacts: "Distance des bassins inchangée ; même longueur de pas.",
    sources: ["Pr", "#89", "R22", "R24"] },
  { title: "PD fermé, retour au quinconce",
    leader: "Avance son D et le ferme à côté du G.",
    follower: "Recule son G et le ferme à côté du D.",
    contacts: "Retour au quinconce.",
    sources: ["Pr", "#89"] },
];
const RECULE: Entry[] = [
  { title: "PG en arrière",
    leader: "Recule son G d'un pied ; le buste recule avec lui.",
    follower: "Avance son D en miroir, parti juste après le pied du leader.",
    contacts: "Distance des bassins inchangée ; même longueur de pas.",
    sources: ["Pr", "#89", "R22", "R24"] },
  { title: "PD fermé, retour au quinconce",
    leader: "Recule son D et le ferme à côté du G.",
    follower: "Avance son G et le ferme à côté du D.",
    contacts: "Retour au quinconce.",
    sources: ["Pr", "#89"] },
];
const DOUBLE: Entry[] = [
  { title: "Double : PG et PD en un temps",
    leader: "Avance G puis D, deux demi-temps.",
    follower: "Recule D puis G en miroir.",
    contacts: "Distance des bassins inchangée.",
    sources: ["Pr", "#89"] },
  { title: "Marka du leader",
    leader: "Marka sans transfert, sur place : il freine et garde le poids à droite.",
    follower: "Reste en appui ; pas de marka de son côté.",
    contacts: "Le poids reste en place ; les genoux ne se touchent pas.",
    sources: ["Pr", "#89"] },
];

// #90: the chain's bridge (sortie fille position 3 → sortie garçon position 2).
const CHAIN_BRIDGE_ENTRY: Entry = { title: "Pont : le suiveur avance en position 2 de la sortie garçon",
  leader: "Garde son D planté, y met le poids puis pose son G : il ne demande pas la reprise de ligne, seulement d'avancer.",
  follower: "Pose son D avec le G du leader, jamais avant, puis avance son G, poids posé sur le temps.",
  contacts: "Flancs droits ensemble : c'est la position 2 de la sortie garçon ; la sortie garçon reprend à son action 3.",
  sources: ["Pr", "#90", "R24"] };

/** Consecutive transitions, one beat each from `start`, the last one stretched to `end`. */
const span = (entries: Entry[], start: number, beat: number, end?: number): Transition[] =>
  entries.map((e, i) => ({ ...e, from: start + i * beat, to: i === entries.length - 1 && end !== undefined ? end : start + (i + 1) * beat }));

const sortieF = (variant: "hook" | "back") => variant === "back" ? [SORTIE_F_1, SORTIE_F_2_BACK, ...SORTIE_F_REST] : [SORTIE_F_1_HOOK, SORTIE_F_2_HOOK, ...SORTIE_F_REST];
const SORTIE_BEATS = 5 + MARKA_HOLD;

const TABLE: Record<TransitionKey, Transition[]> = {
  sortieG: span(SORTIE_G, 0, 1, SORTIE_BEATS),
  sortieF: span(sortieF("hook"), 0, 1, SORTIE_BEATS),
  "sortieF:back": span(sortieF("back"), 0, 1, SORTIE_BEATS),
  sortieFG: [
    ...span(sortieF("hook").slice(0, CHAIN_FROM), 0, 1),
    { ...CHAIN_BRIDGE_ENTRY, from: CHAIN_FROM, to: CHAIN_FROM + CHAIN_BRIDGE.beats },
    ...span(SORTIE_G.slice(CHAIN_TO), CHAIN_FROM + CHAIN_BRIDGE.beats, 1, CHAIN_BEATS + MARKA_HOLD),
  ],
  sortieFI: inserted(sortieF("hook"), INSERTION_VARIANT.sortieF),
  sortieGI: inserted(SORTIE_G, INSERTION_VARIANT.sortieG),
  quart: [{ ...QUART[0], from: 0, to: 1 }, { ...QUART[1], from: 1, to: 4 }],
  ida: span(idaSlots({ side: "L", back: false }), 0, 2),
  idaD: span(idaSlots({ side: "R", back: false }), 0, 2),
  idaArr: span(idaSlots({ side: "L", back: true }), 0, 2),
  idaArrD: span(idaSlots({ side: "R", back: true }), 0, 2),
  avance: span(AVANCE, 0, 1),
  recule: span(RECULE, 0, 1),
  double: span(DOUBLE, 0, 1),
};
/** #91: the sortie up to its position 2, the ida's first slot, then the sortie's actions 3 to 5. */
function inserted(sortie: Entry[], variant: IdaVariant): Transition[] {
  return [
    ...span(sortie.slice(0, INSERTION_AT), 0, 1),
    { ...idaSlots(variant)[0], from: INSERTION_AT, to: INSERTION_AT + INSERTION_BEATS },
    ...span(sortie.slice(INSERTION_AT), INSERTION_AT + INSERTION_BEATS, 1, INSERTED_BEATS + MARKA_HOLD),
  ];
}

export const TRANSITION_KEYS = Object.keys(TABLE) as TransitionKey[];
export function transitionsOf(key: TransitionKey): Transition[] { return TABLE[key]; }
/** The transition in progress at `beat`, or the one that has just reached its position (intervals are
 * closed at their end: the pose shown at beat 2 is explained by the transition that reached it); the
 * first one at the start, the last one after the end. */
export function transitionAt(key: TransitionKey, beat: number): Transition {
  const list = TABLE[key], b = Number.isFinite(beat) ? beat : 0;
  return list.find(t => b > t.from && b <= t.to) ?? (b <= list[0].from ? list[0] : list[list.length - 1]);
}
