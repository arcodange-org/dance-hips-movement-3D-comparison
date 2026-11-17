import { TAU, S1, S2, S4, pos, type RigHandle } from "./anatomy";

export interface StyleDef {
  label: string;
  color: string;
  bullets: string[];
  apply: (r: RigHandle, b: number, a: number) => void;
}

export const STYLES: Record<string, StyleDef> = {
  kizomba: {
    label: "Kizomba",
    color: "#2dd4bf",
    bullets: [
      "Bassin neutre : mouvement sous-produit du transfert de poids",
      "Transferts complets (100 % du poids), pas courts d'une longueur de pied",
      "Réception douce avant-pied puis plein pied, pauses longues",
      "Niveau constant, genoux légèrement fléchis et absorbants",
    ],
    apply: (r, b, a) => {
      const s = S2(b);
      r.root.position.y = -0.02 + 0.012 * S1(b) * a;
      r.pelvis.rotation.z = 0.045 * s * a;
      r.pelvis.rotation.y = 0.03 * s * a;
      r.pelvis.rotation.x = 0.02 * S1(b) * a;
      r.hipL.rotation.x = -0.28 * s * a;
      r.hipR.rotation.x = 0.28 * s * a;
      r.kneeL.rotation.x = (0.1 + 0.16 * pos(s)) * a;
      r.kneeR.rotation.x = (0.1 + 0.16 * pos(-s)) * a;
    },
  },
  semba: {
    label: "Semba",
    color: "#fb923c",
    bullets: [
      "Rebond vertical par pompage des genoux et des chevilles",
      "Réception sur l'avant-pied, pieds ressort qui quittent le sol",
      "Buste dressé, déplacements amples et rapides",
      "Déhanché de marche amplifié, aucune isolation",
    ],
    apply: (r, b, a) => {
      const s = S2(b);
      r.root.position.y = (0.05 * Math.abs(S1(b)) - 0.06) * a;
      r.pelvis.rotation.z = 0.09 * s * a;
      r.pelvis.rotation.x = 0.04 * S1(b) * a;
      r.hipL.rotation.x = -0.45 * s * a;
      r.hipR.rotation.x = 0.45 * s * a;
      r.kneeL.rotation.x = (0.15 + 0.35 * pos(s)) * a;
      r.kneeR.rotation.x = (0.15 + 0.35 * pos(-s)) * a;
      r.extraL = 0.25 * pos(S1(b)) * a;
      r.extraR = 0.25 * pos(-S1(b)) * a;
      r.chest.rotation.x = -0.08;
      r.head.rotation.x = -0.04;
    },
  },
  kompa: {
    label: "Kompa",
    color: "#f87171",
    bullets: [
      "Balancier latéral : translation pelvienne pure avec drop côté appui",
      "Pause marquée sur le temps 4 (hip check)",
      "Genoux fléchis en continu, niveau bas et constant",
      "Pieds glissés plein appui, épaules immobiles",
    ],
    apply: (r, b, a) => {
      const w = S4(b);
      const sw = 0.9 * Math.tanh(2.2 * w);
      r.root.position.x = 0.1 * sw * a;
      r.root.position.y = -0.06 * a;
      r.pelvis.position.x = 0.02 * sw * a;
      r.pelvis.rotation.z = 0.1 * sw * a;
      r.pelvis.rotation.y = 0.02 * S2(b) * a;
      r.hipL.rotation.x = -0.05;
      r.hipR.rotation.x = -0.05;
      r.kneeL.rotation.x = (0.28 + 0.1 * pos(w)) * a;
      r.kneeR.rotation.x = (0.28 + 0.1 * pos(-w)) * a;
      r.chest.rotation.z = -0.35 * 0.1 * sw * a;
      if (b % 4 >= 3) r.pelvis.position.x += 0.008 * S1(b) * a;
    },
  },
  tarraxinha: {
    label: "Tarraxinha",
    color: "#c084fc",
    bullets: [
      "Isolation pelvienne maximale : cercles et 8 amples",
      "Haut du corps strictement immobile",
      "Pieds statiques plein appui, déplacement quasi nul",
      "Genoux souples, toute l'énergie dans le bassin",
    ],
    apply: (r, b, a) => {
      r.root.position.y = -0.03;
      r.pelvis.rotation.z = 0.16 * S2(b) * a;
      r.pelvis.rotation.x = 0.14 * Math.sin((TAU * b) / 2 + 1.3) * a;
      r.pelvis.rotation.y = 0.12 * Math.cos((TAU * b) / 2) * a;
      r.pelvis.position.x = 0.015 * S2(b) * a;
      r.pelvis.position.z = 0.012 * Math.cos((TAU * b) / 2) * a;
      r.kneeL.rotation.x = (0.12 + 0.06 * S2(b)) * a;
      r.kneeR.rotation.x = (0.12 - 0.06 * S2(b)) * a;
    },
  },
  suave: {
    label: "Suave",
    color: "#4ade80",
    bullets: [
      "Bassin dessinant un 8 couché, sur place",
      "Vague montante L5 vers dorsales vers tête",
      "Transferts partiels oscillants (60/40), talons au sol",
      "Niveau bas et constant, aucun rise-and-fall",
    ],
    apply: (r, b, a) => {
      r.root.position.y = -0.035;
      r.pelvis.position.x = 0.03 * S2(b) * a;
      r.pelvis.position.z = 0.022 * S4(b) * a;
      r.pelvis.rotation.x = 0.05 * Math.sin((TAU * b) / 4 + 1.57) * a;
      r.pelvis.rotation.z = 0.03 * S2(b) * a;
      r.spine.rotation.x = 0.09 * Math.sin((TAU * b) / 4 - 0.5) * a;
      r.lumbar.rotation.x = 0.1 * Math.sin((TAU * b) / 4 - 0.9) * a;
      r.thoracic.rotation.x = 0.1 * Math.sin((TAU * b) / 4 - 1.4) * a;
      r.chest.rotation.x = 0.08 * Math.sin((TAU * b) / 4 - 1.1) * a;
      r.head.rotation.x = 0.06 * Math.sin((TAU * b) / 4 - 1.7) * a;
      r.kneeL.rotation.x = (0.14 + 0.1 * S2(b)) * a;
      r.kneeR.rotation.x = (0.14 - 0.1 * S2(b)) * a;
    },
  },
  zouk: {
    label: "Zouk brésilien",
    color: "#38bdf8",
    bullets: [
      "Foulées longues, rotation d'ouverture de hanche",
      "Retard élastique du buste (catch tardif du temps)",
      "Cambré et variations de niveau (rise and fall)",
      "Pression continue dans le sol sur l'avant-pied",
    ],
    apply: (r, b, a) => {
      const s = S2(b);
      r.root.position.y = (-0.03 + 0.045 * S4(b)) * a;
      r.pelvis.rotation.y = 0.2 * s * a;
      r.pelvis.rotation.x = 0.07 * s * a;
      r.pelvis.rotation.z = 0.05 * s * a;
      r.hipL.rotation.x = -0.5 * s * a;
      r.hipR.rotation.x = 0.5 * s * a;
      r.kneeL.rotation.x = (0.12 + 0.3 * pos(s)) * a;
      r.kneeR.rotation.x = (0.12 + 0.3 * pos(-s)) * a;
      r.chest.rotation.y = 0.14 * Math.sin((TAU * b) / 2 - 1.0) * a;
      r.chest.rotation.x = -0.14 * (0.5 + 0.5 * S4(b)) * a;
      r.lumbar.rotation.x = -0.1 * (0.5 + 0.5 * S4(b)) * a;
      r.thoracic.rotation.x = -0.08 * (0.5 + 0.5 * S4(b + 0.5)) * a;
      r.head.rotation.x = -0.08 * (0.5 + 0.5 * Math.sin((TAU * b) / 4 - 0.8)) * a;
    },
  },
};

export const MODES = [
  { key: "solo", label: "Solo (mouvement isolé)" },
  { key: "observe", label: "Observation hanche (lent)" },
  { key: "compare", label: "Comparaison côte à côte" },
  { key: "pair", label: "Face à face (symétrie)" },
];

export type ModeKey = (typeof MODES)[number]["key"];
