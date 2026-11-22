// #132 — Atlas anatomique ouvert : pose et mesure d'un mouvement articulaire du manifeste sur le rig
// réel, par le moteur de l'application (src/pose.ts). Module pur (aucun accès au DOM), partagé par la
// vue de capture, scripts/capture_atlas.mjs et scripts/test_atlas_planches.mjs.
// Le manifeste lui-même est lu par src/atlasManifest.ts (vue) ou sur le disque (scripts) : ce module
// reste hors du chargement de l'application principale. Spécification : docs/spec-atlas-anatomique.md (D7 à D14).
import * as THREE from "three";
import { applyPose, type PoseModel, type PoseStats } from "./pose";
import type { RigHandle } from "./anatomy";
import { ATLAS_VIEWS, type AtlasVue } from "./cameras";

export type AtlasAxis = "x" | "y" | "z";
export type AtlasCote = "R" | "L" | "les deux";
export interface AtlasMouvement {
  id: string; label: string; labelEn: string;
  rig: "glb" | "buste"; articulation: string; axeLocal: AtlasAxis;
  romDeg: [number, number]; cote: AtlasCote; priorite: number; preuve: string; notes: string;
}
export interface AtlasManifest {
  atlas: string; version: number; date: string; issue: number;
  licence: { assetsGeneres: string; maillages: string; textesAnatomiques: string; note: string };
  source: string; niveauDePreuve: string; views: AtlasVue[]; mouvements: AtlasMouvement[];
}
export const ATLAS_FRAMES = 9;
export const ATLAS_FRAMES_MAX = 61;

/** Angles (degrés) régulièrement espacés sur la ROM, bornes incluses. */
export function atlasAngles(m: Pick<AtlasMouvement, "romDeg">, frames = ATLAS_FRAMES): number[] {
  if (!Number.isInteger(frames) || frames < 2) throw new RangeError("atlas : au moins 2 frames");
  const [min, max] = m.romDeg;
  return Array.from({ length: frames }, (_, i) => min + (max - min) * i / (frames - 1));
}

/** D7 : une règle de pose existe-t-elle pour ce mouvement ? Sinon, la raison du refus. */
export function atlasSupport(m: Pick<AtlasMouvement, "rig" | "articulation" | "id">): { ok: true } | { ok: false; raison: string } {
  if (m.rig === "glb" && m.articulation === "Pelvis") return { ok: true };
  return { ok: false, raison: `règle de pose non écrite pour « ${m.articulation} » (${m.rig === "buste"
    ? "buste stylisé" : "chaîne ouverte"}) : seuls les mouvements du bassin sont posés pour l'instant (docs/TASKS.md, #132)` };
}

/** D14, D15 : élection d'une règle de pose. Chaque règle candidate a sa lettre ; la règle retenue pose la
 * planche, les autres restent visibles comme variantes (`?variante=<id>`). Le vote lui-même vit dans
 * docs/elections/<id>.md. */
export interface AtlasRegle { id: string; lettre: string; label: string; regle: string }
/** `retenue` pose la planche ; `danse` est la règle que le propriétaire retient pour la danse (D17), qui peut
 * différer de celle de la planche. */
export interface AtlasElection { id: string; question: string; regles: AtlasRegle[]; retenue: string; danse: string }
export const ATLAS_ELECTIONS: Record<string, AtlasElection> = {
  "bassin-obliquite": {
    id: "obliquite-genoux",
    question: "Obliquité du bassin : le genou opposé attend-il son tour ?",
    regles: [
      { id: "relais", lettre: "A", label: "genoux en relais", regle: "bassin le plus haut que les jambes permettent : un genou fléchit après l'autre" },
      { id: "chevauchement", lettre: "B", label: "genoux chevauchés", regle: "bassin tenu à sa hauteur la plus basse : les deux genoux fléchissent ensemble au centre" },
    ],
    // Vote du propriétaire, 21 novembre 2026 : « pour la danse on veut B ».
    retenue: "chevauchement",
    danse: "chevauchement",
  },
  "bassin-rotation": {
    id: "rotation-buste",
    question: "Rotation du bassin : le buste tourne-t-il avec lui ?",
    regles: [
      { id: "thorax-face", lettre: "A", label: "thorax de face", regle: "la colonne contre-tourne : thorax, tête et bras restent face au partenaire" },
      { id: "solidaire", lettre: "B", label: "buste solidaire", regle: "pas de contre-rotation : tout le haut du corps tourne avec le bassin" },
      { id: "oppose", lettre: "C", label: "thorax à l'opposé", regle: "la colonne tourne deux fois l'angle : le thorax tourne d'autant dans l'autre sens" },
    ],
    // Vote du propriétaire, 22 novembre 2026 (D17) : « pour mettre en evidence la rotation du bassin le mieux
    // c'est A. Pour la logique de la dance en contraposition ce serait C ».
    retenue: "thorax-face",
    danse: "oppose",
  },
};
/** La règle de pose demandée : la règle retenue sans variante, la règle nommée sinon ; ou la raison du refus.
 * `regle` vaut `null` pour un mouvement sans élection ; `variante` dit si elle diffère de la règle retenue. */
export function atlasRegle(m: Pick<AtlasMouvement, "id">, id: string | null | undefined):
  { ok: true; regle: AtlasRegle | null; variante: boolean } | { ok: false; raison: string } {
  const election = ATLAS_ELECTIONS[m.id];
  if (!election) {
    return id ? { ok: false, raison: `variante « ${id} » inconnue pour ${m.id} (ce mouvement n'a pas de variante)` }
      : { ok: true, regle: null, variante: false };
  }
  const regle = election.regles.find(r => r.id === (id || election.retenue));
  if (!regle) return { ok: false, raison: `variante « ${id} » inconnue pour ${m.id} (règles : ${election.regles.map(r => r.id).join(", ")})` };
  return { ok: true, regle, variante: regle.id !== election.retenue };
}

const AXIS = { x: 0, y: 1, z: 2 } as const;
const UNIT: Record<AtlasAxis, [number, number, number]> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/** Pose le rig à `angleDeg` du mouvement, depuis la pose neutre anatomique du moteur (D7).
 * Bassin : chaîne fermée, pieds plantés ; les jambes suivent par IK et le thorax garde son orientation
 * neutre (D13). L'isolation du moteur (`iso`) compense le roulis et le tangage du bassin, pas le lacet :
 * pour l'axe `y`, la colonne contre-tourne du même angle.
 * Hauteur du bassin : la plus haute que les jambes permettent, sauf règle `chevauchement` (D14, retenue
 * pour l'obliquité en D15), qui le tient à sa hauteur la plus basse de la ROM, donc à hauteur constante.
 * `variante` nomme une règle de l'élection du mouvement ; absente, c'est la règle retenue. */
export function applyAtlasPose(r: RigHandle, model: PoseModel, m: AtlasMouvement, angleDeg: number, variante: string | null = null): PoseStats {
  const support = atlasSupport(m);
  if (!support.ok) throw new Error(`atlas ${m.id} : ${support.raison}`);
  const choix = atlasRegle(m, variante);
  if (!choix.ok) throw new Error(`atlas ${m.id} : ${choix.raison}`);
  const pose = (deg: number, abaissement = 0) => {
    const rotation: [number, number, number] = [0, 0, 0];
    const radians = deg * Math.PI / 180;
    rotation[AXIS[m.axeLocal]] = radians;
    return applyPose(r, model, 0, {
      neutral: true, amp: 0, travel: 0, plant: true, iso: true, cadre: true,
      pelvisOffset: { position: [0, 0, 0], rotation },
      trunkOffset: m.axeLocal === "y" && choix.regle?.id !== "solidaire"
        ? [0, (choix.regle?.id === "oppose" ? -2 : -1) * radians, 0, 0, 0, 0, 0, 0, 0] : null,
      rootOffset: abaissement ? { x: 0, z: 0, y: abaissement } : null,
    });
  };
  if (choix.regle?.id !== "chevauchement") return pose(angleDeg);
  // Le moteur écrit la hauteur du bassin dans `root.position.y` et y ajoute `rootOffset.y` tel quel.
  const hauteur = (deg: number) => { pose(deg); return r.root.position.y; };
  const basse = Math.min(...m.romDeg.map(hauteur));
  return pose(angleDeg, basse - hauteur(angleDeg));
}

/** Nœud dont l'orientation monde mesure le mouvement : le nœud GLB nommé par le manifeste. */
export function atlasNode(r: RigHandle, m: Pick<AtlasMouvement, "articulation">): THREE.Object3D {
  const node = r[m.articulation] as THREE.Object3D | undefined;
  if (!node) throw new Error(`atlas : nœud « ${m.articulation} » absent du rig`);
  return node;
}

export interface AtlasReference { quaternion: THREE.Quaternion; axe: THREE.Vector3; thorax: THREE.Quaternion }

/** Référence de mesure : orientation monde du nœud à la pose neutre (angle 0), axe monde attendu
 * (l'axe local du manifeste porté par cette orientation) et orientation monde du thorax. */
export function atlasReference(r: RigHandle, model: PoseModel, m: AtlasMouvement): AtlasReference {
  applyAtlasPose(r, model, m, 0);
  r.root.updateWorldMatrix(true, true);
  const quaternion = atlasNode(r, m).getWorldQuaternion(new THREE.Quaternion());
  return {
    quaternion, axe: new THREE.Vector3(...UNIT[m.axeLocal]).applyQuaternion(quaternion).normalize(),
    thorax: r.chest.getWorldQuaternion(new THREE.Quaternion()),
  };
}

export interface AtlasMesure {
  /** Angle signé (°) du quaternion monde du nœud, relatif à la pose neutre, autour de l'axe attendu. */
  angleDeg: number;
  /** Écart (°) entre l'axe de rotation mesuré et l'axe attendu ; 0 à la pose neutre. */
  horsAxeDeg: number;
  /** Hauteur du centre de hanche gauche moins celle du droit (mm). */
  ecartHanchesMm: number;
  /** Vecteur monde du centre de hanche droit vers le gauche (m). */
  hanches: [number, number, number];
  /** Vecteur monde du milieu des centres de hanche vers le centre du sacrum (m). */
  sacrum: [number, number, number];
  /** Flexion des genoux (°), 0 = jambe tendue. */
  genouDeg: { R: number; L: number };
  /** Inclinaison monde du thorax par rapport à la verticale (°). */
  thoraxDeg: number;
  /** Rotation (°) du thorax par rapport à la pose neutre, tous axes confondus. */
  thoraxRotationDeg: number;
  /** Lacet signé (°) du thorax autour de la verticale monde, par rapport à la pose neutre (D16). */
  thoraxLacetDeg: number;
  /** Hauteur monde du centre du bassin (mm). */
  bassinMm: number;
}

/** Mesures sur le rig tel que posé par `applyAtlasPose` (matrices monde finales). */
export function measureAtlasPose(r: RigHandle, m: AtlasMouvement, reference: AtlasReference, stats: PoseStats): AtlasMesure {
  r.root.updateWorldMatrix(true, true);
  const thorax = r.chest.getWorldQuaternion(new THREE.Quaternion());
  const relative = atlasNode(r, m).getWorldQuaternion(new THREE.Quaternion()).multiply(reference.quaternion.clone().invert());
  if (relative.w < 0) relative.set(-relative.x, -relative.y, -relative.z, -relative.w);
  const v = new THREE.Vector3(relative.x, relative.y, relative.z);
  const angle = 2 * Math.atan2(v.length(), relative.w) * 180 / Math.PI;
  const along = v.lengthSq() > 1e-24 ? v.clone().normalize().dot(reference.axe) : 1;
  const hipR = (r.hipR as THREE.Object3D).getWorldPosition(new THREE.Vector3());
  const hipL = (r.hipL as THREE.Object3D).getWorldPosition(new THREE.Vector3());
  const sacrum = atlasNode(r, { articulation: "Sacrum" }).getWorldPosition(new THREE.Vector3())
    .sub(hipR.clone().add(hipL).multiplyScalar(0.5));
  return {
    angleDeg: angle * Math.sign(along),
    horsAxeDeg: Math.acos(Math.min(1, Math.abs(along))) * 180 / Math.PI,
    ecartHanchesMm: (hipL.y - hipR.y) * 1000,
    hanches: [hipL.x - hipR.x, hipL.y - hipR.y, hipL.z - hipR.z],
    sacrum: [sacrum.x, sacrum.y, sacrum.z],
    genouDeg: { R: stats.kneeR, L: stats.kneeL },
    thoraxDeg: stats.trunkTilt,
    thoraxRotationDeg: thorax.angleTo(reference.thorax) * 180 / Math.PI,
    thoraxLacetDeg: (() => {
      const q = thorax.clone().multiply(reference.thorax.clone().invert());
      return 2 * Math.atan2(q.y, q.w) * 180 / Math.PI;
    })(),
    bassinMm: (r.pelvis as THREE.Object3D).getWorldPosition(new THREE.Vector3()).y * 1000,
  };
}

// --- Vue de capture `?atlas=` (D10) : état lu dans l'URL, clé du signal de rendu, libellés. ---

export interface AtlasState { id: string; vue: AtlasVue; frame: number; frames: number; muscles: boolean; variante?: string | null }

export function parseAtlasParams(params: URLSearchParams): AtlasState {
  const integer = (name: string, fallback: number) => {
    const value = Number(params.get(name));
    return params.has(name) && Number.isInteger(value) ? value : fallback;
  };
  const frames = Math.max(2, Math.min(ATLAS_FRAMES_MAX, integer("frames", ATLAS_FRAMES)));
  const vue = params.get("vue");
  return {
    id: params.get("atlas") ?? "",
    vue: vue !== null && vue in ATLAS_VIEWS ? vue as AtlasVue : "face",
    // Par défaut la frame du milieu : la pose neutre quand la ROM est symétrique.
    frame: Math.max(0, Math.min(frames - 1, integer("frame", (frames - 1) >> 1))),
    frames,
    muscles: params.get("muscles") !== "0",
    variante: params.get("variante") || null,
  };
}

/** Valeur de `data-atlas-rendu` quand cet état est posé et rendu. */
export const atlasKey = (s: Pick<AtlasState, "id" | "vue" | "frame" | "frames" | "variante">): string =>
  `${s.id}|${s.vue}|${s.frame}/${s.frames}${s.variante ? "|" + s.variante : ""}`;

/** Sans variante, l'URL est celle des planches versionnées (règle retenue), inchangée. */
export const atlasQuery = (s: AtlasState): string =>
  `atlas=${encodeURIComponent(s.id)}&vue=${s.vue}&frame=${s.frame}&frames=${s.frames}&muscles=${s.muscles ? 1 : 0}${
    s.variante ? "&variante=" + encodeURIComponent(s.variante) : ""}`;

export function atlasVueLabel(vue: AtlasVue, cote: AtlasCote): string {
  const lateral = cote === "R" ? "droit" : "gauche";
  return { face: "face", troisQuarts: `trois-quarts avant ${lateral}`, profil: `profil ${lateral}`,
    troisQuartsDos: `trois-quarts arrière ${lateral}`, dos: "dos" }[vue];
}

/** « +7,5° », « −10° », « 0° » : signe explicite, virgule décimale. */
export function atlasAngleLabel(angleDeg: number): string {
  const rounded = Math.round(angleDeg * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${String(Math.abs(rounded)).replace(".", ",")}°`;
}

/** Hauteur (px) des bandes de légende au-dessus et au-dessous du rendu 3D dans la vue de capture. */
export const ATLAS_BANDES = { hautPx: 38, basPx: 28 };

export const ATLAS_ATTRIBUTION = "Squelette et muscles : BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan";
export const ATLAS_PROVENANCE = "Généré paramétriquement sur squelette réel : ni capture de mouvement, ni photo de modèle, ni relecture par un professeur d'anatomie.";
