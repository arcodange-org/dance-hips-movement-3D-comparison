import { TAU, S1, S2, S4, pos, type RigHandle } from "./anatomy";

export interface StyleDef {
  label: string;
  color: string;
  bullets: string[];
  apply: (r: RigHandle, b: number, a: number) => void;
  // Charge sur le pied DROIT dans [-1, 1] (+1 = plein appui droit, -1 = plein appui gauche).
  // Sert à la visualisation des appuis (pastilles de charge, chaîne pied→genou→hanche).
  // Côté droit du rig à x < 0 : un déplacement root.x > 0 = appui qui passe à gauche.
  support?: (b: number) => number;
}

// Courbes f(temps) issues des sources documentées dans docs/styles-de-danse.md :
// kizomba = « 2 temps » latéral sur place avec marqua (pieds joints), pas ≤ largeur
// du bassin ; kompa = balancier latéral sur place, un transfert de poids par temps,
// hip check sur le temps 4 ; semba = rebond (quick-quick-slow) ; tarraxinha = sur
// place, isolations du bassin ; suave = « 8 » au sol + talon levé + vague L5→tête ;
// zouk = basic sur place (slow-quick-quick) + cambré + ouverture de hanche.
// En mode Face à face, les « sorties garçon / fille » (5 temps, aller-retour latéral)
// sont ajoutées par le rig (voir sortie dans Rig.tsx).

export const STYLES: Record<string, StyleDef> = {
  kizomba: {
    label: "Kizomba",
    color: "#2dd4bf",
    bullets: [
      "« 2 temps » latéral sur place : marqua (pieds joints) à chaque temps",
      "Pas ≤ largeur du bassin, « touch » sans poids, transfert complet côté appui",
      "Bassin souple, sous-produit de la marche — haut du corps calme",
      "En couple : sorties garçon / fille (5 temps, aller-retour hors de la ligne)",
    ],
    support: (b) => -S2(b),
    apply: (r, b, a) => {
      const s = S2(b);
      r.root.position.x = 0.07 * s * a;
      r.root.position.y = -0.02 + 0.01 * S1(b) * a;
      r.pelvis.rotation.z = 0.05 * s * a;
      r.pelvis.rotation.y = 0.03 * s * a;
      r.pelvis.rotation.x = 0.02 * S1(b) * a;
      r.hipL.rotation.x = -0.24 * s * a;
      r.hipR.rotation.x = 0.24 * s * a;
      r.kneeL.rotation.x = (0.1 + 0.14 * pos(s)) * a;
      r.kneeR.rotation.x = (0.1 + 0.14 * pos(-s)) * a;
    },
  },
  semba: {
    label: "Semba",
    color: "#fb923c",
    bullets: [
      "Rebond marqué (knee pulse), rythme quick-quick-slow « 1-2-3, pause »",
      "Réception sur l'avant-pied, pieds ressort",
      "Déplacements en rond (koreidinha), changements de direction nets",
      "Plus rapide et ludique que la kizomba (≈130 bpm vs ≈90)",
    ],
    support: (b) => -S2(b),
    apply: (r, b, a) => {
      const s = S2(b);
      r.root.position.x = 0.05 * s * a;
      r.root.position.y = (0.055 * Math.abs(S1(b)) - 0.055) * a;
      r.pelvis.rotation.z = 0.09 * s * a;
      r.pelvis.rotation.x = 0.04 * S1(b) * a;
      r.hipL.rotation.x = -0.4 * s * a;
      r.hipR.rotation.x = 0.4 * s * a;
      r.kneeL.rotation.x = (0.15 + 0.3 * pos(s)) * a;
      r.kneeR.rotation.x = (0.15 + 0.3 * pos(-s)) * a;
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
      "Balancier latéral sur place : un transfert de poids par temps",
      "Hip check / pause marquée sur le temps 4",
      "Genoux fléchis en continu, niveau bas, pieds glissés plein appui",
      "Tout le mouvement sous la ceinture, épaules immobiles",
    ],
    support: (b) => -Math.tanh(2.2 * S1(b)),
    apply: (r, b, a) => {
      const w = S1(b);
      const sw = 0.9 * Math.tanh(2.2 * w);
      r.root.position.x = 0.09 * sw * a;
      r.root.position.y = -0.06 * a;
      r.pelvis.position.x = 0.02 * sw * a;
      r.pelvis.rotation.z = 0.1 * sw * a;
      r.pelvis.rotation.y = 0.02 * S2(b) * a;
      r.hipL.rotation.x = -0.05;
      r.hipR.rotation.x = -0.05;
      r.kneeL.rotation.x = (0.28 + 0.08 * pos(w)) * a;
      r.kneeR.rotation.x = (0.28 + 0.08 * pos(-w)) * a;
      r.chest.rotation.z = -0.035 * sw * a;
      if (b % 4 >= 3) r.pelvis.position.x += 0.008 * S1(b) * a;
    },
  },
  tarraxinha: {
    label: "Tarraxinha",
    color: "#c084fc",
    bullets: [
      "Sur place : isolations du bassin (8, cercles), blocages nets",
      "Haut du corps strictement immobile, guidage par contact des hanches",
      "Pas quasi nuls, plein appui, genoux souples",
      "La plus « collée serr yakın » des variantes kizomba",
    ],
    support: (b) => -0.5 * S2(b),
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
      "« 8 » du bassin au sol, sur place (ginga)",
      "Talon levé → fesses montent → on redescend et change de pied",
      "Vague séquentielle L5 → dorsales → tête",
      "Transferts partiels 60/40, talons au sol, aucun rise-and-fall",
    ],
    support: (b) => -S2(b),
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
      r.extraL = 0.15 * pos(S1(b)) * a;
      r.extraR = 0.15 * pos(-S1(b)) * a;
    },
  },
  zouk: {
    label: "Zouk brésilien",
    color: "#38bdf8",
    bullets: [
      "Basic sur place (slow-quick-quick), pas de déplacement forcé",
      "Ouverture de hanche (yaw) sur les grandes foulées",
      "Cambré contrôlé + vague du tronc + rouleaux de tête",
      "En couple : sorties et variations de niveau (rise and fall)",
    ],
    support: (b) => -S2(b),
    apply: (r, b, a) => {
      const s = S2(b);
      r.root.position.x = 0.05 * s * a;
      r.root.position.y = (-0.03 + 0.03 * S4(b)) * a;
      r.pelvis.rotation.y = 0.18 * s * a;
      r.pelvis.rotation.x = 0.07 * s * a;
      r.pelvis.rotation.z = 0.05 * s * a;
      r.hipL.rotation.x = -0.45 * s * a;
      r.hipR.rotation.x = 0.45 * s * a;
      r.kneeL.rotation.x = (0.12 + 0.28 * pos(s)) * a;
      r.kneeR.rotation.x = (0.12 + 0.28 * pos(-s)) * a;
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

// Enveloppe de « sortie » (5 temps sur un cycle de 8) : sortie latérale puis retour,
// utilisée en mode Face à face (sortie garçon côté guideur, sortie fille côté
// suiveur — le retard du suiveur décale la seconde). Sources : voir docs/styles-de-danse.md.
// Charge pied droit (bornée [-1,1]) : courbe du style si définie, sinon déduite de root.x.
export function supportOf(styleKey: string, r: RigHandle, b: number): number {
  const st = STYLES[styleKey];
  const v = st && st.support ? st.support(b) : -r.root.position.x / 0.09;
  return Math.max(-1, Math.min(1, v));
}

// Blend IK : travel > 0 -> IK de pas progressif ; travel = 0 -> pieds plantés si plant,
// sinon ancien comportement glissé (convention handoff, plant=0).
export function plantBlend(travel: number, plant: boolean): number {
  return travel > 0.001 ? Math.min(1, travel / 0.2) : plant ? 1 : 0;
}

// Sortie garçon/fille : déplacement latéral local (axe x, perpendiculaire à la ligne de
// danse) d'amplitude 0,22 m * amplitude, aller-retour de 5 temps sur un cycle de 8.
export function sortieOffset(b: number, amp: number): number {
  return 0.22 * sortieEnvelope(b) * amp;
}

export function sortieEnvelope(b: number): number {
  const p = ((b % 8) + 8) % 8;
  let e = 0;
  if (p < 1) e = p;
  else if (p < 3) e = 1;
  else if (p < 5) e = (5 - p) / 2;
  else e = 0;
  return e * e * (3 - 2 * e);
}
