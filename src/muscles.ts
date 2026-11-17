import * as THREE from "three";

export const MUSCLES_URL = `${import.meta.env.BASE_URL}anatomy_muscles.glb`;
export const DRACO_DECODER_PATH = `${import.meta.env.BASE_URL}draco/gltf/`;

export const MUSCLE_COLOR = "#b91c1c";
export const MUSCLE_OPACITY = 0.5;

// Nom de nœud parent (dans le rig) pour chaque groupe musculaire.
// _R/_L → pivot du côté concerné ; _C → nœud central (Pelvis / spine / chest du buste stylisé).
const LIMB_HIP = ["GluteusMaximus", "GluteusMedius", "PsoasMajor", "Iliacus", "Piriformis"];
const LIMB_THIGH = [
  "RectusFemoris",
  "VastusLateralis",
  "VastusMedialis",
  "VastusIntermedius",
  "BicepsFemoris",
  "Semitendinosus",
  "Semimembranosus",
  "Sartorius",
  "Gracilis",
  "AdductorMagnus",
  "AdductorLongus",
  "TensorFasciaeLatae",
];
const LIMB_LEG = [
  "Gastrocnemius",
  "Soleus",
  "TibialisAnterior",
  "FibularisLongus",
  "FibularisBrevis",
  "TibialisPosterior",
];
const TRUNK_SPINE = ["ErectorSpinae", "ExternalOblique", "Trapezius"];
const TRUNK_CHEST = ["PectoralisMajor", "Deltoid"];

export function muscleParent(meshName: string): string | null {
  const m = /^Muscle_([A-Za-z]+)_([RCL])$/.exec(meshName);
  if (!m) return null;
  const [, label, side] = m;
  if (TRUNK_SPINE.includes(label)) return "spine";
  if (TRUNK_CHEST.includes(label)) return "chest";
  if (side === "R" || side === "L") {
    if (LIMB_HIP.includes(label)) return "Pelvis";
    if (LIMB_THIGH.includes(label)) return `HipPivot_${side}`;
    if (LIMB_LEG.includes(label)) return `KneePivot_${side}`;
    return "Pelvis";
  }
  return "Pelvis";
}

// Position du parent dans l'espace du Skeleton (repère os, repos) pour
// convertir les sommets du GLB muscles (espace Skeleton) en local du parent.
export function parentOffsetSkel(parentKey: string, r: Record<string, any>): THREE.Vector3 {
  switch (parentKey) {
    case "Pelvis":
      return new THREE.Vector3(0, 0, 0);
    case "HipPivot_R":
      return (r["HipPivot_R"] as THREE.Object3D).position.clone();
    case "HipPivot_L":
      return (r["HipPivot_L"] as THREE.Object3D).position.clone();
    case "KneePivot_R":
      return (r["HipPivot_R"] as THREE.Object3D).position
        .clone()
        .add((r["KneePivot_R"] as THREE.Object3D).position);
    case "KneePivot_L":
      return (r["HipPivot_L"] as THREE.Object3D).position
        .clone()
        .add((r["KneePivot_L"] as THREE.Object3D).position);
    case "spine":
      return new THREE.Vector3(0, 0.08, 0);
    case "chest":
      return new THREE.Vector3(0, 0.08 + 0.24, 0);
    default:
      return new THREE.Vector3();
  }
}

export function makeMuscleMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: MUSCLE_COLOR,
    roughness: 0.55,
    metalness: 0.05,
    transparent: true,
    opacity: MUSCLE_OPACITY,
    depthWrite: false,
  });
}
