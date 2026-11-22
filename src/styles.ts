import { TAU, S1, S2, S4, pos, HIP_WIDTH, type RigHandle } from "./anatomy";

export interface StyleDef {
  label: string;
  color: string;
  bullets: string[];
  // Phase 15 — posture propre à la danse (sources docs/posture-contraposition.md) :
  // lean = inclinaison du buste vers l'avant (rad, négatif = cambré/arrière), knee = flexion
  // de base des genoux (rad). Kizomba/tarraxinha : buste légèrement en avant + genoux bien
  // fléchis (« lean slightly forward », « slightly bent knees », SOS Dance) ; zouk = cambré.
  posture: { lean: number; knee: number };
  /** `w` (#42): beat of the slow 4-beat waves (suave, zouk), kept on the clock when the ginga drives `b`. */
  apply: (r: RigHandle, b: number, a: number, w?: number) => void;
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


/** #62: kompa support (+1 = full right), period 4 beats: the weight moves to the left foot over the
 * 0.4 beat before beat 1, holds through the touch on 2, moves to the right foot before beat 3 and holds
 * through 4. `b` is the motion beat (clock − 0,5). */
export const KOMPA = { transition: 0.4 };
/** #161, #159 (owner, 22 Nov.: « Le konpa est complètement faux actuellement: c'est le 8 le plus prononcé
 * justement » ; docs/spec-ginga-huit.md): PROTOTYPES of the kompa's « 8 », to elect, off by default
 * (`?kompa=huit|huitGrand|huitInverse`). Source (Jasmin's teachers' manual, quoted by Le Nouvelliste, see
 * docs/recherche-danse/kompa.md on the research branch): at the slow rhythm, « on dessine un demi 8 avec
 * le bassin sur chaque appui », the hip going from the front to the back by the side.
 * `depth` (m): how far the pelvis goes forward then back on each support; `round` (0 to 1): the lateral
 * path leaves the hold-then-cross of today for a continuous swing; `sense` (−1: back first). */
export const KOMPA_EIGHTS: Record<string, { depth: number; round: number; sense: number }> = {
  huit: { depth: 0.03, round: 1, sense: 1 },
  huitGrand: { depth: 0.05, round: 1, sense: 1 },
  huitInverse: { depth: 0.03, round: 1, sense: -1 },
};
/** The prototype in use (null: the model of today). Set once from the address, read by the kompa style. */
export const KOMPA_PROTO: { eight: { depth: number; round: number; sense: number } | null } = { eight: null };
export const setKompaProto = (name: string | null | undefined) => { KOMPA_PROTO.eight = (name && KOMPA_EIGHTS[name]) || null; };
export function kompaSupport(b: number): number {
  const c = ((((b + 0.5) % 4) + 4) % 4), d = KOMPA.transition;
  const s = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
  const toLeft = s((c - 1 + d) / d), toRight = s((c - 3 + d) / d);
  return 1 - 2 * toLeft + 2 * toRight;
}

export const STYLES: Record<string, StyleDef> = {
  kizomba: {
    label: "Kizomba",
    color: "#2dd4bf",
    posture: { lean: 0.1, knee: 0.3 },
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
    posture: { lean: 0.06, knee: 0.24 },
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
    posture: { lean: 0.08, knee: 0.2 },
    bullets: [
      "Balancier latéral sur place : pas sur 1 et 3, touche sans poids sur 2 et 4 (un transfert tous les deux temps)",
      "Hip check / pause marquée sur le temps 4",
      "Genoux fléchis en continu, niveau bas, pieds glissés plein appui",
      "Tout le mouvement sous la ceinture, épaules immobiles",
    ],
    // #62 (R21; docs/musique/kompa.md, Haitian Music Zone: step 1, touch 2, step 3, touch 4): one
    // transfer every two beats, the weight landing on 1 and 3 (motion beats 0,5 and 2,5, see ON_BEAT_SHIFT).
    support: (b) => kompaSupport(b),
    apply: (r, b, a) => {
      // Prototype of the « 8 »: the lateral swing never waits (its zeros are the support's, at motion beats
      // 0.3 and 2.3), and the pelvis goes forward as it leaves for the support, back as it returns.
      const eight = KOMPA_PROTO.eight, turn = 2 * Math.PI * (b - (0.5 - KOMPA.transition / 2)) / 4;
      const held = -kompaSupport(b), w = eight ? held + (Math.sin(turn) - held) * eight.round : held;
      if (eight) r.root.position.z = eight.depth * eight.sense * Math.sin(2 * turn) * a;
      const sw = 0.9 * w;
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
      // Hip check on the touch (2 and 4).
      if (((b + 0.5) % 2 + 2) % 2 >= 1.5) r.pelvis.position.x += 0.008 * S1(b) * a;
    },
  },
  tarraxinha: {
    label: "Tarraxinha",
    color: "#c084fc",
    posture: { lean: 0.14, knee: 0.34 },
    bullets: [
      "Sur place : isolations du bassin (8, cercles), blocages nets",
      "Haut du corps strictement immobile, guidage par contact des hanches",
      "Pas quasi nuls, plein appui, genoux souples",
      "La plus « collé-serré » (« kolé séré » en créole antillais) des variantes kizomba",
    ],
    support: (b) => -0.5 * S2(b),
    apply: (r, b, a) => {
      r.root.position.y = -0.03;
      // #61 (owner): the hip's intention goes forward, then the hip comes back opening slightly to its
      // side, which lets the opposite hip go forward. Yaw leads (one hip forward), the lateral shift
      // follows in quadrature (the returning hip opens to its side); roll stays secondary.
      r.pelvis.rotation.z = 0.08 * S2(b) * a;
      r.pelvis.rotation.x = 0.14 * Math.sin((TAU * b) / 2 + 1.3) * a;
      r.pelvis.rotation.y = 0.22 * Math.cos((TAU * b) / 2) * a;
      r.pelvis.position.x = 0.03 * S2(b) * a;
      r.pelvis.position.z = 0.012 * Math.cos((TAU * b) / 2) * a;
      r.kneeL.rotation.x = (0.12 + 0.06 * S2(b)) * a;
      r.kneeR.rotation.x = (0.12 - 0.06 * S2(b)) * a;
    },
  },
  suave: {
    label: "Suave",
    color: "#4ade80",
    posture: { lean: 0.02, knee: 0.14 },
    bullets: [
      "« 8 » du bassin au sol, sur place (ginga)",
      "Talon levé → fesses montent → on redescend et change de pied",
      "Vague séquentielle L5 → dorsales → tête",
      "Transferts partiels 60/40, talons au sol, aucun rise-and-fall",
    ],
    support: (b) => -0.2 * S2(b),
    apply: (r, b, a, w = b) => {
      r.root.position.y = -0.035;
      r.pelvis.position.x = 0.03 * S2(b) * a;
      r.pelvis.position.z = 0.022 * S4(w) * a;
      r.pelvis.rotation.x = 0.05 * Math.sin((TAU * w) / 4 + 1.57) * a;
      r.pelvis.rotation.z = 0.03 * S2(b) * a;
      r.spine.rotation.x = 0.09 * Math.sin((TAU * w) / 4 - 0.5) * a;
      r.lumbar.rotation.x = 0.1 * Math.sin((TAU * w) / 4 - 0.9) * a;
      r.thoracic.rotation.x = 0.1 * Math.sin((TAU * w) / 4 - 1.4) * a;
      r.chest.rotation.x = 0.08 * Math.sin((TAU * w) / 4 - 1.1) * a;
      r.head.rotation.x = 0.06 * Math.sin((TAU * w) / 4 - 1.7) * a;
      r.kneeL.rotation.x = (0.14 + 0.1 * S2(b)) * a;
      r.kneeR.rotation.x = (0.14 - 0.1 * S2(b)) * a;
      r.extraL = 0.15 * pos(S1(b)) * a;
      r.extraR = 0.15 * pos(-S1(b)) * a;
    },
  },
  zouk: {
    label: "Zouk brésilien",
    color: "#38bdf8",
    posture: { lean: -0.1, knee: 0.12 }, // cambré : buste en arrière
    bullets: [
      "Basic sur place (slow-quick-quick), pas de déplacement forcé",
      "Ouverture de hanche (yaw) sur les grandes foulées",
      "Cambré contrôlé + vague du tronc + rouleaux de tête",
      "En couple : sorties et variations de niveau (rise and fall)",
    ],
    support: (b) => -S2(b),
    apply: (r, b, a, w = b) => {
      const s = S2(b);
      r.root.position.x = 0.05 * s * a;
      r.root.position.y = (-0.03 + 0.03 * S4(w)) * a;
      r.pelvis.rotation.y = 0.18 * s * a;
      r.pelvis.rotation.x = 0.07 * s * a;
      r.pelvis.rotation.z = 0.05 * s * a;
      r.hipL.rotation.x = -0.45 * s * a;
      r.hipR.rotation.x = 0.45 * s * a;
      r.kneeL.rotation.x = (0.12 + 0.28 * pos(s)) * a;
      r.kneeR.rotation.x = (0.12 + 0.28 * pos(-s)) * a;
      r.chest.rotation.y = 0.14 * Math.sin((TAU * b) / 2 - 1.0) * a;
      r.chest.rotation.x = -0.14 * (0.5 + 0.5 * S4(w)) * a;
      r.lumbar.rotation.x = -0.1 * (0.5 + 0.5 * S4(w)) * a;
      r.thoracic.rotation.x = -0.08 * (0.5 + 0.5 * S4(w + 0.5)) * a;
      r.head.rotation.x = -0.08 * (0.5 + 0.5 * Math.sin((TAU * w) / 4 - 0.8)) * a;
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
    x: CORRIDINHO_RADIUS * (1 - Math.cos(phi)),
    z: CORRIDINHO_RADIUS * Math.sin(phi),
    ry: phi,
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
  // #40: armUL/armFL are now the anatomical left arm (+x side); the historical angles were tuned on
  // the swapped names, so each value goes to the same physical arm as before.
  if (r.armUR) r.armUR.rotation.set(DANCE_FRAME.upperArm.x, DANCE_FRAME.upperArm.y, DANCE_FRAME.upperArm.z);
  if (r.armUL) r.armUL.rotation.set(DANCE_FRAME.upperArm.x, DANCE_FRAME.upperArm.y, -DANCE_FRAME.upperArm.z);
  if (r.armFR) r.armFR.rotation.set(DANCE_FRAME.forearmLeft.x, DANCE_FRAME.forearmLeft.y, DANCE_FRAME.forearmLeft.z);
  if (r.armFL) r.armFL.rotation.set(DANCE_FRAME.forearmRight.x, DANCE_FRAME.forearmRight.y, DANCE_FRAME.forearmRight.z);
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
  // Same physical arms as before the #40 renaming (see applyDanceFrame).
  if (r.armUR) r.armUR.rotation.set(DANCE_FRAME_FOLLOWER.upperLeft.x, DANCE_FRAME_FOLLOWER.upperLeft.y, DANCE_FRAME_FOLLOWER.upperLeft.z);
  if (r.armFR) r.armFR.rotation.set(DANCE_FRAME_FOLLOWER.foreLeft.x, DANCE_FRAME_FOLLOWER.foreLeft.y, DANCE_FRAME_FOLLOWER.foreLeft.z);
  if (r.armUL) r.armUL.rotation.set(DANCE_FRAME_FOLLOWER.upperRight.x, DANCE_FRAME_FOLLOWER.upperRight.y, DANCE_FRAME_FOLLOWER.upperRight.z);
  if (r.armFL) r.armFL.rotation.set(DANCE_FRAME_FOLLOWER.foreRight.x, DANCE_FRAME_FOLLOWER.foreRight.y, DANCE_FRAME_FOLLOWER.foreRight.z);
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

// Phase 11 — vírgula (docs/virgula.md) : sur un quart de tour le pied pivote sur la boule du
// pied avec le corps (contact sol constant) -> correction de lacet LOCAL à ajouter à
// foot.rotation.y pour que le lacet monde du pied rejoigne le lacet monde du corps (root).
// Renvoie le delta dans ]-π, π]. Hors mouvement de tour : delta 0 (pied inchangé).
export function virgulaFootYawDelta(footWorldYaw: number, bodyWorldYaw: number): number {
  let d = bodyWorldYaw - footWorldYaw;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

// Phase 16 — espacement du couple en mode face à face (z = ∓PAIR_DZ) : recalé sur la surface
// ventrale RÉELLE du CORPS (sans les bras, demande 2026-11-19) mesurée par sonde sommets :
// front max local ≈ 0.17 m avec lean ; à 0.125 les ventres se croisaient de ~0.21 m, à 0.15
// encore ~1.6 cm. 0.175 = pire cas mesuré (0.174) + marge. Les marqueurs de contact sont
// posés sur cette surface : poitrine z=0.16, bassin z=0.14, genoux z=0.135
// (écarts 0.03 / 0.07 / 0.08 < 0.09 m → contact vert).
export const PAIR_DZ = 0.175;

// Phase 14 — les déplacements sont des options NON combinables (radio, pas checkbox).
// Phase 17 — la sortie garçon/fille devient aussi une option exclusive (radio), avec le
// combiné G→F (docs/spec-phase17-sortie-exclusive.md).
export type MovementKey = "none" | "corridinho" | "quarts" | "temps3" | "ida" | "sortieG" | "sortieF" | "sortieGF";

// Priorité d'exclusivité si plusieurs flags sont positionnés (ex. URL artisanale).
/** Owner (20 Nov.): « on peut laisser le style konpa faire uniquement le sur place et le avant /
 * arrière (pas de marka en konpa) », then « gère tarraxinha et zouk comme avec le konpa » (focus on
 * kizomba and semba). Styles listed here only offer these movements. */
export const STYLE_MOVEMENTS: Partial<Record<string, MovementKey[]>> = {
  kompa: ["none", "ida"], tarraxinha: ["none", "ida"], zouk: ["none", "ida"],
};
export function movementAllowed(styleKey: string, movement: MovementKey): boolean {
  const allowed = STYLE_MOVEMENTS[styleKey];
  return !allowed || allowed.includes(movement);
}
/** Lateral travel (« Déplacement ») is not « sur place » nor « avant / arrière »: not offered in kompa,
 * whose lateral balance is the style itself. */
export const travelAllowed = (styleKey: string): boolean => !STYLE_MOVEMENTS[styleKey];

export function movementOf(o: { corridinho?: boolean; quarts?: boolean; temps3?: boolean; ida?: boolean; sortieG?: boolean; sortieF?: boolean; sortieGF?: boolean }): MovementKey {
  if (o.corridinho) return "corridinho";
  if (o.quarts) return "quarts";
  if (o.temps3) return "temps3";
  if (o.ida) return "ida";
  if (o.sortieG) return "sortieG";
  if (o.sortieF) return "sortieF";
  if (o.sortieGF) return "sortieGF";
  return "none";
}

// Un seul flag à true ("none" -> tous false) : garantit la non-combinabilité.
export function movementFlags(m: MovementKey): { corridinho: boolean; quarts: boolean; temps3: boolean; ida: boolean; sortieG: boolean; sortieF: boolean; sortieGF: boolean } {
  return {
    corridinho: m === "corridinho", quarts: m === "quarts", temps3: m === "temps3", ida: m === "ida",
    sortieG: m === "sortieG", sortieF: m === "sortieF", sortieGF: m === "sortieGF",
  };
}

// Phase 17 — enveloppe de sortie par danseur et par option (0..1) :
// - "sortieG" : le guideur sort (cycle 8), le suiveur reste sur la ligne ;
// - "sortieF" : le suiveur sort, le guideur reste ;
// - "sortieGF" (combiné) : cycle 16 — guideur sur les temps 0–7, suiveur sur 8–15 (enchaînement).
// Hors paire (embrace false) ou autre mouvement : 0 (géré par l'appelant).
export function sortieActive(side: "leader" | "follower", m: MovementKey, b: number): number {
  if (m === "sortieG") return side === "leader" ? sortieEnvelope(b) : 0;
  if (m === "sortieF") return side === "follower" ? sortieEnvelope(b) : 0;
  if (m === "sortieGF") {
    const p = ((b % 16) + 16) % 16;
    if (side === "leader") return p < 8 ? sortieEnvelope(p) : 0;
    return p >= 8 ? sortieEnvelope(p - 8) : 0;
  }
  return 0;
}

// Phase 14 — quarts de tour avec vrais pivots (vírgula pas à pas, demande 2026-11-18).
// Cycle 16 temps = 4 quarts x 4 temps, 2 demi-pas de 2 temps par quart ; quart à gauche =
// anti-horaire = yaw +π/2. Demi-pas 0 : talon du pied G au bout du pied D, pied G orienté à
// 90° vers la gauche, le HAUT du corps (upperYaw) suit le pied G ; demi-pas 1 : pied D ramené
// parallèle au pied G, le BAS du corps (lowerYaw) suit le pied D. Les pieds tracent un petit
// carré autour de l'origine (retour ~ position initiale après 4 quarts = 2π).
export interface QuartStep {
  q: number; // quart courant 0..3
  half: 0 | 1; // demi-pas courant
  stepSide: "L" | "R"; // pied qui bouge à ce demi-pas
  upperYaw: number; // lacet monde du haut du corps (suit le pied G)
  lowerYaw: number; // lacet monde du bas du corps / root (suit le pied D)
  footL: { x: number; z: number; yaw: number }; // cible monde pied G (position + lacet)
  footR: { x: number; z: number; yaw: number }; // cible monde pied D
}

const QH = 0.084; // demi inter-hanches : pieds sous les hanches
const QF = 0.09; // pieds légèrement en avant du bassin
// Talon du pied G AU BOUT du pied D (bout du pied D à z = QF + ~0.11) — demande 2026-11-18 :
// « le pied gauche va plus à l'avant (le bout du pied droit), actuellement il s'arrête à la
// moitié à tort » : la cible z du pied G = QF + QTOE = bout du pied D.
const QTOE = 0.11;
const QD = 2 * QH; // écart entre les pieds quand ils sont parallèles

export function quartTurnStep(b: number, reverse = false): QuartStep {
  const p = ((b % 16) + 16) % 16;
  const q = Math.min(3, Math.floor(p / 4));
  const half = (Math.floor(p / 2) % 2) as 0 | 1;
  const ph = (p % 2) / 2; // progression dans le demi-pas, [0, 1)
  const rot = (x: number, z: number, th: number) => ({
    x: x * Math.cos(th) + z * Math.sin(th),
    z: -x * Math.sin(th) + z * Math.cos(th),
  });
  // état des pieds en simulant les quarts précédents (positions/lacets monde)
  let l = { x: QH, z: QF, yaw: 0 };
  let r = { x: -QH, z: QF, yaw: 0 };
  const applyQuarter = (qq: number) => {
    const th0 = (qq * Math.PI) / 2;
    const th1 = ((qq + 1) * Math.PI) / 2;
    const d0 = rot(0, QTOE, th0);
    l = { x: r.x + d0.x, z: r.z + d0.z, yaw: th1 }; // talon G au bout du D, pied G à 90°
    const d1 = rot(-QD, 0, th1);
    r = { x: l.x + d1.x, z: l.z + d1.z, yaw: th1 }; // pied D parallèle au pied G
  };
  for (let qq = 0; qq < q; qq++) applyQuarter(qq);
  const th0 = (q * Math.PI) / 2;
  const th1 = ((q + 1) * Math.PI) / 2;
  // au demi-pas 1 du quart courant, le pied G a déjà bougé au demi-pas 0 du même quart
  if (half === 1) {
    const d0 = rot(0, QTOE, th0);
    l = { x: r.x + d0.x, z: r.z + d0.z, yaw: th1 };
  }
  let out: QuartStep;
  if (half === 0) {
    const d0 = rot(0, QTOE, th0);
    out = {
      q,
      half,
      stepSide: "L",
      upperYaw: th0 + ph * (Math.PI / 2), // haut du corps suit le pied G
      lowerYaw: th0, // bas du corps attend le pied D
      footL: { x: r.x + d0.x, z: r.z + d0.z, yaw: th0 + Math.PI / 2 },
      footR: r,
    };
  } else {
    const d1 = rot(-QD, 0, th1);
    out = {
      q,
      half,
      stepSide: "R",
      upperYaw: th1,
      lowerYaw: th0 + ph * (Math.PI / 2), // bas du corps suit le pied D
      footL: l,
      footR: { x: l.x + d1.x, z: l.z + d1.z, yaw: th1 },
    };
  }
  if (reverse) {
    // Suiveur en paire (marche arrière) : trajectoire miroir (z -> -z, lacets opposés) ET
    // rôles G/D échangés — le suiveur RECULE et pivote d'abord son pied DROIT en angle droit
    // (gros orteil D à 90° du gros orteil G), puis rassemble son pied G
    // (demande 2026-11-18).
    out = {
      ...out,
      stepSide: out.stepSide === "L" ? "R" : "L",
      upperYaw: -out.upperYaw,
      lowerYaw: -out.lowerYaw,
      footL: { x: out.footR.x, z: -out.footR.z, yaw: -out.footR.yaw },
      footR: { x: out.footL.x, z: -out.footL.z, yaw: -out.footL.yaw },
    };
  }
  return out;
}

// Déplacement latéral le long de la ligne de danse ; dir = -1 → marche arrière.
export function travelOffset(travel: number, dir: number, b: number): number {
  return (dir < 0 ? -1 : 1) * travel * (HIP_WIDTH / 2) * Math.tanh(2.2 * S2(b));
}

// Marke « 3 temps » : un pas tous les 3 temps au lieu de chaque temps.
export function swingBeat(b: number, temps3: boolean): number {
  return Math.floor(b / (temps3 ? 3 : 1));
}

// Hauteur de balancement du pied pendant un pas (cloche sin(π·t) >= 0 : le pied ne descend
// jamais sous le sol pendant la phase d'appui aérienne ; contact sol garanti par plantBlend).
export function swingLift(t: number, lift: number): number {
  return 0.05 * lift * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, t))));
}

// Ida e volta (aller-retour, seul ou à 2 face à face) sur un cycle de 8 temps :
// pied gauche avant puis arrière (temps 0-3), pied droit avant puis arrière (temps 4-7).
export function idaEVoltaStep(b: number): { side: "L" | "R"; dir: 1 | -1 } {
  const p = ((b % 8) + 8) % 8;
  const side: "L" | "R" = Math.floor(p / 4) % 2 === 0 ? "L" : "R";
  const dir: 1 | -1 = Math.floor(p / 2) % 2 === 0 ? 1 : -1;
  return { side, dir };
}

// Phase 15 — contraposition (tango, docs/posture-contraposition.md) pendant l'ida e volta :
// pendant chaque pas de 2 temps, le BAS du corps (lowerYaw) pivote vers le pied qui avance et
// le HAUT du corps (upperYaw) du côté opposé ("if you're stepping forward with your right
// foot, your left shoulder will come forward to oppose this motion", Tango Topics), en cloche
// sin(π·ph). Retombe à 0 entre les pas.
export function idaContra(b: number): { upperYaw: number; lowerYaw: number } {
  const p = ((b % 8) + 8) % 8;
  const st = idaEVoltaStep(b);
  const s = st.side === "L" ? 1 : -1;
  const ph = (p % 2) / 2; // progression dans le pas de 2 temps, [0, 1)
  const bell = Math.sin(Math.PI * ph);
  return { lowerYaw: 0.08 * s * bell, upperYaw: -0.1 * s * bell };
}
