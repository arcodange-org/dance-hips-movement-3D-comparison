// #132 — Atlas anatomique ouvert : pose et mesure d'un mouvement articulaire du manifeste sur le rig
// réel, par le moteur de l'application (src/pose.ts). Module pur (aucun accès au DOM), partagé par la
// vue de capture, scripts/capture_atlas.mjs et scripts/test_atlas_planches.mjs.
// Le manifeste lui-même est lu par src/atlasManifest.ts (vue) ou sur le disque (scripts) : ce module
// reste hors du chargement de l'application principale. Spécification : docs/spec-atlas-anatomique.md (D7 à D12).
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

const AXIS = { x: 0, y: 1, z: 2 } as const;
const UNIT: Record<AtlasAxis, [number, number, number]> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

/** Pose le rig à `angleDeg` du mouvement, depuis la pose neutre anatomique du moteur (D7).
 * Bassin : chaîne fermée, pieds plantés ; les jambes suivent par IK et le haut du tronc compense. */
export function applyAtlasPose(r: RigHandle, model: PoseModel, m: AtlasMouvement, angleDeg: number): PoseStats {
  const support = atlasSupport(m);
  if (!support.ok) throw new Error(`atlas ${m.id} : ${support.raison}`);
  const rotation: [number, number, number] = [0, 0, 0];
  rotation[AXIS[m.axeLocal]] = angleDeg * Math.PI / 180;
  return applyPose(r, model, 0, {
    neutral: true, amp: 0, travel: 0, plant: true, iso: true, cadre: true,
    pelvisOffset: { position: [0, 0, 0], rotation },
  });
}

/** Nœud dont l'orientation monde mesure le mouvement : le nœud GLB nommé par le manifeste. */
export function atlasNode(r: RigHandle, m: Pick<AtlasMouvement, "articulation">): THREE.Object3D {
  const node = r[m.articulation] as THREE.Object3D | undefined;
  if (!node) throw new Error(`atlas : nœud « ${m.articulation} » absent du rig`);
  return node;
}

export interface AtlasReference { quaternion: THREE.Quaternion; axe: THREE.Vector3 }

/** Référence de mesure : orientation monde du nœud à la pose neutre (angle 0) et axe monde attendu
 * (l'axe local du manifeste porté par cette orientation). */
export function atlasReference(r: RigHandle, model: PoseModel, m: AtlasMouvement): AtlasReference {
  applyAtlasPose(r, model, m, 0);
  r.root.updateWorldMatrix(true, true);
  const quaternion = atlasNode(r, m).getWorldQuaternion(new THREE.Quaternion());
  return { quaternion, axe: new THREE.Vector3(...UNIT[m.axeLocal]).applyQuaternion(quaternion).normalize() };
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
  /** Flexion des genoux (°), 0 = jambe tendue. */
  genouDeg: { R: number; L: number };
  /** Inclinaison monde du thorax par rapport à la verticale (°). */
  thoraxDeg: number;
  /** Hauteur monde du centre du bassin (mm). */
  bassinMm: number;
}

/** Mesures sur le rig tel que posé par `applyAtlasPose` (matrices monde finales). */
export function measureAtlasPose(r: RigHandle, m: AtlasMouvement, reference: AtlasReference, stats: PoseStats): AtlasMesure {
  r.root.updateWorldMatrix(true, true);
  const relative = atlasNode(r, m).getWorldQuaternion(new THREE.Quaternion()).multiply(reference.quaternion.clone().invert());
  if (relative.w < 0) relative.set(-relative.x, -relative.y, -relative.z, -relative.w);
  const v = new THREE.Vector3(relative.x, relative.y, relative.z);
  const angle = 2 * Math.atan2(v.length(), relative.w) * 180 / Math.PI;
  const along = v.lengthSq() > 1e-24 ? v.clone().normalize().dot(reference.axe) : 1;
  const hipR = (r.hipR as THREE.Object3D).getWorldPosition(new THREE.Vector3());
  const hipL = (r.hipL as THREE.Object3D).getWorldPosition(new THREE.Vector3());
  return {
    angleDeg: angle * Math.sign(along),
    horsAxeDeg: Math.acos(Math.min(1, Math.abs(along))) * 180 / Math.PI,
    ecartHanchesMm: (hipL.y - hipR.y) * 1000,
    hanches: [hipL.x - hipR.x, hipL.y - hipR.y, hipL.z - hipR.z],
    genouDeg: { R: stats.kneeR, L: stats.kneeL },
    thoraxDeg: stats.trunkTilt,
    bassinMm: (r.pelvis as THREE.Object3D).getWorldPosition(new THREE.Vector3()).y * 1000,
  };
}

// --- Vue de capture `?atlas=` (D10) : état lu dans l'URL, clé du signal de rendu, libellés. ---

export interface AtlasState { id: string; vue: AtlasVue; frame: number; frames: number; muscles: boolean }

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
  };
}

/** Valeur de `data-atlas-rendu` quand cet état est posé et rendu. */
export const atlasKey = (s: Pick<AtlasState, "id" | "vue" | "frame" | "frames">): string =>
  `${s.id}|${s.vue}|${s.frame}/${s.frames}`;

export const atlasQuery = (s: AtlasState): string =>
  `atlas=${encodeURIComponent(s.id)}&vue=${s.vue}&frame=${s.frame}&frames=${s.frames}&muscles=${s.muscles ? 1 : 0}`;

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
