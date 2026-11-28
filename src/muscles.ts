import * as THREE from "three";

export const MUSCLES_URL = `${import.meta.env.BASE_URL}anatomy_muscles.glb`;
/** #229 : les tendons d'Achille (tendon calcanéen, BodyParts3D), même repère que les muscles (scripts/build_tendons.mjs). */
export const TENDONS_URL = `${import.meta.env.BASE_URL}anatomy_tendons.glb`;
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
  "CalcanealTendon",
];
const TRUNK_SPINE = ["ErectorSpinae", "ExternalOblique", "Trapezius"];
const TRUNK_CHEST = ["PectoralisMajor", "Deltoid"];

/** #173 (owner's rule): when the bones and muscles of the trunk are shown, the grey stylised blocks have no
 * reason to be. The muscle layer covers the trunk (TRUNK_SPINE, TRUNK_CHEST): with it, the stylised trunk
 * blocks (spine, chest, shoulders) are hidden. Head and arms have no muscle mesh and stay. */
export const trunkBlocksVisible = (showMuscles: boolean): boolean => !showMuscles;

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

/** #229 : la couche des muscles est dans le repère de BodyParts3D, dont l'origine est le milieu des centres des boîtes
 * des deux os coxaux ; celle de public/anatomy.glb est ailleurs (mesuré : 4,2 cm plus bas, 0,8 cm plus en avant). Ce
 * point, pris sur les os coxaux du GLB, dans le repère `Skeleton` : un muscle s'y pose en ajoutant cette origine. */
export function muscleFrameOrigin(r: Record<string, any>): THREE.Vector3 {
  const skeleton = r["Skeleton"] as THREE.Object3D;
  skeleton.updateWorldMatrix(true, true);
  const inverse = skeleton.matrixWorld.clone().invert(), v = new THREE.Vector3();
  const centre = (mesh: THREE.Mesh) => {
    const box = new THREE.Box3(), m = inverse.clone().multiply(mesh.matrixWorld), p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) box.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(m));
    return box.getCenter(new THREE.Vector3());
  };
  return centre(r["HipBone_R"]).add(centre(r["HipBone_L"])).multiplyScalar(0.5);
}
/** Les muscles posés sur les os de public/anatomy.glb (bassin et jambes) ; ceux du tronc gardent leur place, réglée sur
 * le buste (et sur le haut du corps anatomique, #176). */
const ON_LEG_BONES = (parentKey: string) => parentKey === "Pelvis" || parentKey.startsWith("HipPivot_") || parentKey.startsWith("KneePivot_");

/** #229 : les muscles dont le tendon passe la cheville et descend dans le pied, et où leur peau passe de la jambe au pied
 * (hauteur au-dessus de la cheville au repos, m) : au-dessus de `leg`, le sommet suit la jambe ; sous `foot`, le pied ;
 * entre les deux, un mélange des deux, sans pli. Le jambier antérieur passe devant la cheville, sur le talus, dès
 * l'interligne (2 cm au-dessus de la cheville) ; le jambier postérieur et les fibulaires tiennent derrière les malléoles
 * jusqu'à leur pointe ; le tendon d'Achille, du soléaire à son attache sur le calcanéum, reste une corde tendue entre les
 * deux. Réglés sur le GLB (scripts/test_cheville.mjs) : le tendon reste contre les os, sans flotter. */
export const ANKLE_CROSSING: Record<string, { leg: number; foot: number }> = {
  TibialisAnterior: { leg: 0.03, foot: 0 },
  FibularisLongus: { leg: 0.012, foot: -0.018 },
  FibularisBrevis: { leg: 0.012, foot: -0.018 },
  TibialisPosterior: { leg: 0.012, foot: -0.018 },
  CalcanealTendon: { leg: 0.045, foot: -0.015 },
};
/** La part du pied (0 à 1) dans la place d'un sommet du muscle `label` à `height` (m) au-dessus de la cheville au repos. */
export function footShare(label: string, height: number): number {
  const span = ANKLE_CROSSING[label];
  if (!span) return 0;
  const t = Math.max(0, Math.min(1, (span.leg - height) / (span.leg - span.foot)));
  return t * t * (3 - 2 * t);
}

/** Greffe la couche des muscles (maillages des GLB de muscles et de tendons, repère BodyParts3D) sur le rig : chaque
 * muscle sous son pivot osseux, posé sur les os (`muscleFrameOrigin`). #229 : un muscle qui passe la cheville devient un
 * maillage pesé entre le genou (la jambe) et la cheville (le pied), qui le suit quand le pied tourne. Rend les maillages
 * greffés. */
export function graftMuscles(r: Record<string, any>, meshes: THREE.Mesh[], material: () => THREE.Material): THREE.Mesh[] {
  const origin = muscleFrameOrigin(r), out: THREE.Mesh[] = [];
  for (const mesh of meshes) {
    const parentKey = muscleParent(mesh.name), parent = parentKey ? (r[parentKey] as THREE.Object3D | undefined) : undefined;
    if (!parentKey || !parent) continue;
    const [, label, side] = /^Muscle_([A-Za-z]+)_([RCL])$/.exec(mesh.name)!;
    const shift = ON_LEG_BONES(parentKey) ? origin : new THREE.Vector3();
    let grafted: THREE.Mesh = mesh;
    if (ANKLE_CROSSING[label] && (side === "R" || side === "L")) {
      // Sommets dans le repère `Skeleton` ; le genou et la cheville, au repos, n'y sont que déplacés (sans rotation).
      mesh.updateMatrix();
      const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix).translate(shift.x, shift.y, shift.z);
      const knee = r["KneePivot_" + side] as THREE.Object3D, ankle = r["AnklePivot_" + side] as THREE.Object3D;
      const kneeRest = parentOffsetSkel("KneePivot_" + side, r), ankleRest = kneeRest.clone().add(ankle.userData.rest ?? ankle.position);
      const p = geometry.attributes.position, index = new Uint16Array(p.count * 4), weight = new Float32Array(p.count * 4);
      for (let i = 0; i < p.count; i++) {
        const w = footShare(label, p.getY(i) - ankleRest.y);
        index.set([0, 1, 0, 0], 4 * i); weight.set([1 - w, w, 0, 0], 4 * i);
      }
      geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(index, 4));
      geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weight, 4));
      const skinned = new THREE.SkinnedMesh(geometry, material());
      skinned.name = mesh.name;
      // Lié dans le repère `Skeleton` : la place du maillage lui-même ne compte pas (liaison attachée).
      skinned.bind(new THREE.Skeleton([knee, ankle] as THREE.Bone[], [kneeRest, ankleRest].map(v => new THREE.Matrix4().makeTranslation(-v.x, -v.y, -v.z))), new THREE.Matrix4());
      skinned.frustumCulled = false;
      grafted = skinned;
    } else {
      mesh.material = material();
      mesh.position.add(shift).sub(parentOffsetSkel(parentKey, r));
    }
    grafted.userData.part = "muscle";
    parent.add(grafted);
    out.push(grafted);
  }
  return out;
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
