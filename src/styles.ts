import { TAU, S1, S2, S4, pos, HIP_WIDTH, type RigHandle } from "./anatomy";

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

// Corridinho (tâche 11) : séquence de 16 temps — 1/4 de tour à DROITE (temps 0–3),
// 1/4 de tour à GAUCHE (4–7), puis cercle au sol de rayon R autour du repère fixe
// (origine) pendant 8–15, en avançant (le danseur décrit le cercle). Source : Wikipédia FR
// Kizomba (« corridinho : succession de pas qui forme un cercle au sol » ; « 1/4 de tour,
// en 3 temps avec un marqua »).
export const CORRIDINHO_RADIUS = 0.3;
export function corridinhoPath(b: number): { x: number; z: number; ry: number } {
  const p = ((b % 16) + 16) % 16;
  if (p < 4) {
    const t = p / 4;
    return { x: 0, z: 0, ry: (Math.PI / 2) * t };
  }
  if (p < 8) {
    const t = (p - 4) / 4;
    return { x: 0, z: 0, ry: (Math.PI / 2) * (1 - t) };
  }
  const phi = (TAU * (p - 8)) / 8;
  return {
    x: CORRIDINHO_RADIUS * Math.sin(phi),
    z: CORRIDINHO_RADIUS * (1 - Math.cos(phi)),
    ry: phi + Math.PI / 2,
  };
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

// ---------------------------------------------------------------------------
// Phase 7 — isolation du bas du corps (objectif premier, 2026-11-18) : au-dessus du bassin,
// le haut du tronc doit rester stable et vertical pendant que bassin/genoux/pieds travaillent.
// Sources : docs/ginga-angolana.md §2 (« the movements hips down are the dominant ones [...], not
// the upper body movements » — Eddy Vents ; « Keep the shoulder line level and do not pitch or
// sway the entire body » — SOS Dance Footwork Manual ; « the upper body remains stable and calm
// in the connection » — udansa).
// ---------------------------------------------------------------------------

export interface RotLike {
  x: number;
  y: number;
  z: number;
}

// Verrouillage du haut du tronc quand iso = true : la colonne (spine) contre-rotate le
// roll/pitch du pelvis (le thorax reste vertical en monde), et le buste (chest) + la tête ne
// basculent plus latéralement (y/z remis à 0). Le pitch (x) est conservé : posture, cambré du
// zouk et vague du suave passent par la chaîne vertébrale sagittale (spine/lumbar/thoracic).
export function lockUpperTrunk(
  t: { spine: RotLike; chest: RotLike; head: RotLike },
  pelvis: RotLike,
  iso: boolean
): void {
  if (!iso) return;
  t.spine.x -= pelvis.x;
  t.spine.z -= pelvis.z;
  t.chest.y = 0;
  t.chest.z = 0;
  t.head.y = 0;
  t.head.z = 0;
}

// Roll résiduel (monde, approx.) du thorax : somme des rotations z pelvis + spine + chest.
export function residualRoll(t: { spine: RotLike; chest: RotLike }, pelvis: RotLike): number {
  return pelvis.z + t.spine.z + t.chest.z;
}

// Stabilité du buste ∈ [0,1] : 1 = thorax parfaitement vertical, 0 = bascule ≥ 0.3 rad.
export function upperStability(t: { spine: RotLike; chest: RotLike }, pelvis: RotLike): number {
  const roll = Math.abs(residualRoll(t, pelvis));
  return Math.max(0, Math.min(1, 1 - roll / 0.3));
}

// Cadre de bras de danseur (demande 2026-11-18) : coudes pliés, bras vers l'avant,
// avant-bras gauche vers le haut paume vers la droite, avant-bras droit vers la gauche
// paume vers le buste. sxi = -1 côté gauche (x < 0), +1 côté droit.
export const DANCE_FRAME = {
  upperArm: { x: -1.15, y: 0, z: 0.22 }, // bras vers l'avant, légère ouverture (z = -z*sxi)
  forearmLeft: { x: 0, y: Math.PI / 2, z: Math.PI }, // avant-bras G vers le haut, paume → droite
  forearmRight: { x: Math.PI, y: 0, z: -Math.PI / 2 }, // avant-bras D vers la gauche, paume → buste
} as const;

interface Rotatable {
  rotation: RotLike & { set(x: number, y: number, z: number): void };
}

export function applyDanceFrame(
  r: { armUL?: Rotatable; armUR?: Rotatable; armFL?: Rotatable; armFR?: Rotatable },
  cadre: boolean
): void {
  if (!cadre) return;
  if (r.armUL) r.armUL.rotation.set(DANCE_FRAME.upperArm.x, DANCE_FRAME.upperArm.y, DANCE_FRAME.upperArm.z);
  if (r.armUR) r.armUR.rotation.set(DANCE_FRAME.upperArm.x, DANCE_FRAME.upperArm.y, -DANCE_FRAME.upperArm.z);
  if (r.armFL) r.armFL.rotation.set(DANCE_FRAME.forearmLeft.x, DANCE_FRAME.forearmLeft.y, DANCE_FRAME.forearmLeft.z);
  if (r.armFR) r.armFR.rotation.set(DANCE_FRAME.forearmRight.x, DANCE_FRAME.forearmRight.y, DANCE_FRAME.forearmRight.z);
}

// Cadre de la SUIVEUSE en paire (demande 2026-11-18, non prioritaire) : coude gauche levé à
// hauteur d'épaule, son avant-bras en contact avec le dos du danseur d'en face ; coude droit
// baissé, main droite en contact avec la main gauche du danseur.
export const DANCE_FRAME_FOLLOWER = {
  upperLeft: { x: -1.45, y: 0, z: 0.15 }, // bras gauche ~ horizontal, hauteur d'épaule
  foreLeft: { x: -0.35, y: 0, z: 0 }, // avant-bras vers l'avant (dos du guideur)
  upperRight: { x: -0.45, y: 0, z: 0.55 }, // coude droit baissé, bras écarté
  foreRight: { x: -1.35, y: 0, z: -0.3 }, // avant-bras ramené, main D vers la main G du guideur
} as const;

export function applyFollowerFrame(
  r: { armUL?: Rotatable; armUR?: Rotatable; armFL?: Rotatable; armFR?: Rotatable },
  cadre: boolean
): void {
  if (!cadre) return;
  if (r.armUL) r.armUL.rotation.set(DANCE_FRAME_FOLLOWER.upperLeft.x, DANCE_FRAME_FOLLOWER.upperLeft.y, DANCE_FRAME_FOLLOWER.upperLeft.z);
  if (r.armFL) r.armFL.rotation.set(DANCE_FRAME_FOLLOWER.foreLeft.x, DANCE_FRAME_FOLLOWER.foreLeft.y, DANCE_FRAME_FOLLOWER.foreLeft.z);
  if (r.armUR) r.armUR.rotation.set(DANCE_FRAME_FOLLOWER.upperRight.x, DANCE_FRAME_FOLLOWER.upperRight.y, DANCE_FRAME_FOLLOWER.upperRight.z);
  if (r.armFR) r.armFR.rotation.set(DANCE_FRAME_FOLLOWER.foreRight.x, DANCE_FRAME_FOLLOWER.foreRight.y, DANCE_FRAME_FOLLOWER.foreRight.z);
}

// ---------------------------------------------------------------------------
// Phase 8 — déplacements : quarts de tour, marche avant/arrière + marka « 3 temps », ida e volta.
// ---------------------------------------------------------------------------

// Quarts de tour (mouvement séparé du corridinho, demande 2026-11-18) : 4 quarts de tour sur 16
// temps = un tour complet (2π). Le suiveur en paire peut le faire en marche arrière (reverse).
export function quartsPath(b: number): { ry: number } {
  const p = ((b % 16) + 16) % 16;
  return { ry: (Math.PI / 2) * (p / 4) };
}

// Inversion d'une trajectoire (marche arrière du suiveur en paire) : z miroir, ry opposé.
export function reversePath<T extends { x?: number; z?: number; ry?: number }>(cp: T): T {
  return { ...cp, x: cp.x ?? 0, z: -(cp.z ?? 0), ry: -(cp.ry ?? 0) };
}

// Déplacement latéral le long de la ligne de danse ; dir = -1 → marche arrière.
export function travelOffset(travel: number, dir: number, b: number): number {
  return (dir < 0 ? -1 : 1) * travel * (HIP_WIDTH / 2) * Math.tanh(2.2 * S2(b));
}

// Marke « 3 temps » : un pas tous les 3 temps au lieu de chaque temps.
export function swingBeat(b: number, temps3: boolean): number {
  return Math.floor(b / (temps3 ? 3 : 1));
}

// Ida e volta (aller-retour, seul ou à 2 face à face) sur un cycle de 8 temps :
// pied gauche avant puis arrière (temps 0-3), pied droit avant puis arrière (temps 4-7).
export function idaEVoltaStep(b: number): { side: "L" | "R"; dir: 1 | -1 } {
  const p = ((b % 8) + 8) % 8;
  const side: "L" | "R" = Math.floor(p / 4) % 2 === 0 ? "L" : "R";
  const dir: 1 | -1 = Math.floor(p / 2) % 2 === 0 ? 1 : -1;
  return { side, dir };
}
