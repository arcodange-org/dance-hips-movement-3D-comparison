/** The figures' ontology (#95, ADR 004, docs/spec-ontologie-figures.md): named positions, the leads a
 * transition carries (R24), and the equivalences and insertions the game may chain. Pure data, checked
 * against the samplers on the real GLB by scripts/test_ontologie.mjs (declared = measured). The samplers
 * stay the geometric truth: this module names and describes, it computes no pose. The transition texts
 * live in src/transitions.ts (#94). Every entry is « à valider » until the owner has read it. */
import { CHAIN_BRIDGE, CHAIN_FROM, CHAIN_TO } from "./enchainement";
import { INSERTION_AT, INSERTION_VARIANT } from "./insertion";
import type { IdaVariant } from "./idaPaire";

export type Side = "L" | "R";
export type Statut = "à valider" | "validé";
export type OntologyFigure = "sortieG" | "sortieF" | "sortieF:back" | "quart" | "ida";

/** A couple state where both dancers stand: an instant of a sampler, named and described. */
export interface Position {
  id: string; figure: OntologyFigure; beat: number; label: string;
  /** Other names for the same position (the owner's numbering may differ from the code's). */
  alias?: string[];
  /** Weighted foot of each dancer (load > 0.9). */
  support: { leader: Side; follower: Side };
  /** Pelvises in quinconce (lateral offset < 12 cm) or offset (> 14 cm), in the couple's frame (the line of
   * dance; the leader's feet axis in the quarter turn, the only figure that turns the couple). */
  layout: "quinconce" | "décalé";
  /** Right thighs: envelopes in contact (gap ≤ 3 mm) or apart (≥ 2 cm). In quinconce they interleave. */
  thighs: "contact" | "libres";
  statut: Statut;
}
/** R24 within a transition: the follower's foot leaves with or after the leader's foot that provokes it. */
export interface Lead { figure: OntologyFigure; from: number; to: number; leader: Side; follower: Side; statut: Statut }
/** Two positions of different figures with the same configuration (#90): the game may continue with
 * the other figure, through a bridge when the supports differ. */
export interface Equivalence { from: string; to: string; via: "avance"; key: string; bridge: number; note: string; statut: Statut }
/** An ida e volta led from a position (#91): its free foot is the ida's foot, the figure resumes after. */
export interface Insertion { at: string; ida: IdaVariant; key: string; note: string; statut: Statut }

const v: Statut = "à valider";
const pos = (figure: OntologyFigure, beat: number, label: string, leader: Side, follower: Side,
  layout: Position["layout"], thighs: Position["thighs"], alias?: string[]): Position =>
  ({ id: `${figure}.${beat}`, figure, beat, label, support: { leader, follower }, layout, thighs, statut: v, ...(alias ? { alias } : {}) });

export const POSITIONS: Position[] = [
  pos("sortieG", 0, "Départ, quinconce", "R", "L", "quinconce", "contact"),
  pos("sortieG", 1, "G du leader en avant vers son couloir, D du suiveur en arrière", "L", "R", "décalé", "contact"),
  pos("sortieG", 2, "Flancs droits : pieds D tout près, bassin du leader légèrement en arrière de son D, cuisses D côte à côte", "R", "L", "décalé", "contact"),
  pos("sortieG", 3, "G du leader croisé, retour vers la ligne", "L", "R", "décalé", "libres"),
  pos("sortieG", 4, "D du leader en face", "R", "L", "quinconce", "libres"),
  pos("sortieG", 5, "Marka, quinconce", "R", "L", "quinconce", "contact"),
  pos("sortieF", 0, "Départ, quinconce", "R", "L", "quinconce", "contact"),
  pos("sortieF", 1, "G du leader en virgula (posé perpendiculaire), D du suiveur en arrière", "L", "R", "quinconce", "libres"),
  pos("sortieF", 2, "Crochet du leader, G du suiveur sorti à sa gauche", "R", "L", "décalé", "libres"),
  pos("sortieF", 3, "D/D côte à côte, avant qu'il ne reprenne la ligne", "L", "R", "décalé", "contact", ["position 5 (propriétaire)"]),
  pos("sortieF", 4, "G du suiveur croisé, retour sur la ligne", "R", "L", "décalé", "libres"),
  pos("sortieF", 5, "Marka, quinconce", "R", "L", "quinconce", "contact"),
  pos("sortieF:back", 0, "Départ, quinconce", "R", "L", "quinconce", "contact"),
  pos("sortieF:back", 1, "G du leader en avant, D du suiveur en arrière", "L", "R", "quinconce", "libres"),
  pos("sortieF:back", 2, "D du leader en arrière, G du suiveur en diagonale avant", "R", "L", "décalé", "libres"),
  pos("sortieF:back", 3, "D/D côte à côte, avant qu'il ne reprenne la ligne", "L", "R", "décalé", "contact"),
  pos("sortieF:back", 4, "G du suiveur croisé, retour sur la ligne", "R", "L", "décalé", "libres"),
  pos("sortieF:back", 5, "Marka, quinconce", "R", "L", "quinconce", "contact"),
  pos("quart", 0, "Départ du quart, quinconce", "R", "L", "quinconce", "contact"),
  pos("quart", 1, "Premier pied posé : diagonale", "L", "R", "quinconce", "libres"),
  pos("quart", 3, "Second pied posé : le quart, quinconce", "R", "L", "quinconce", "contact"),
  pos("ida", 0, "Neutre, D du leader porteur", "R", "L", "quinconce", "contact"),
  pos("ida", 1, "Avant G du leader posé, arrière D du suiveur", "L", "R", "quinconce", "libres"),
  pos("ida", 2, "Neutre", "R", "L", "quinconce", "contact"),
  pos("ida", 3, "Arrière G du leader posé, avant D du suiveur", "L", "R", "quinconce", "contact"),
  pos("ida", 4, "Neutre, G du leader porteur (son D est libre)", "L", "R", "quinconce", "contact"),
  pos("ida", 5, "Avant D du leader posé, arrière G du suiveur", "R", "L", "quinconce", "contact"),
  pos("ida", 6, "Neutre, G du leader porteur", "L", "R", "quinconce", "contact"),
  pos("ida", 7, "Arrière D du leader posé, avant G du suiveur", "R", "L", "quinconce", "libres"),
];

const lead = (figure: OntologyFigure, from: number, to: number, leader: Side, follower: Side): Lead =>
  ({ figure, from, to, leader, follower, statut: v });
/** The marka is the leader's alone; in the quarter turn her G answers the turning frame, not his D (it
 * leaves at 1.45, his D at 1.8): no lead is declared for it. */
export const LEADS: Lead[] = [
  ...(["sortieG", "sortieF", "sortieF:back"] as const).flatMap(f => [
    lead(f, 0, 1, "L", "R"), lead(f, 1, 2, "R", "L"), lead(f, 2, 3, "L", "R"), lead(f, 3, 4, "R", "L")]),
  lead("quart", 0, 1, "L", "R"),
  lead("ida", 0, 2, "L", "R"), lead("ida", 2, 4, "L", "R"), lead("ida", 4, 6, "R", "L"), lead("ida", 6, 8, "R", "L"),
];

export const EQUIVALENCES: Equivalence[] = [
  { from: `sortieF.${CHAIN_FROM}`, to: `sortieG.${CHAIN_TO}`, via: "avance", key: "↑", bridge: CHAIN_BRIDGE.beats,
    note: "#90 : « la position 2 de la sortie garçon est la configuration de la position 5 de la sortie fille si le leader ne demande pas à la fille de reprendre la ligne mais d'avancer tout simplement ». Mêmes flancs droits et cuisses D au contact ; appuis inversés, d'où le pont.", statut: v },
];
export const INSERTIONS: Insertion[] = [
  { at: `sortieG.${INSERTION_AT}`, ida: INSERTION_VARIANT.sortieG, key: "W", note: "#91 : jambe gauche, en avant en premier (la direction de son pas suivant).", statut: v },
  { at: `sortieF.${INSERTION_AT}`, ida: INSERTION_VARIANT.sortieF, key: "W", note: "#91 : jambe gauche, en arrière en premier (la direction de son pas suivant).", statut: v },
];

export const positionById = (id: string): Position | undefined => POSITIONS.find(p => p.id === id);
