import * as THREE from "three";

export const TAU = Math.PI * 2;
export const S1 = (b: number) => Math.sin(TAU * b);
export const S2 = (b: number) => Math.sin((TAU * b) / 2);
export const S4 = (b: number) => Math.sin((TAU * b) / 4);
export const pos = (x: number) => Math.max(0, x);
export const TRAIL_MAX = 320;

// Clamp sol renforcé (demande 2026-11-19) : aucun os sous le sol. rootY corrigé pour que
// l'os le plus bas (décalage local boneMinY relatif au root) reste à y >= 0, et root >= 0.
export function clampSolY(rootY: number, boneMinY: number): number {
  return Math.max(0, rootY, -boneMinY);
}

// Correction du mode libre (plant=0) sur les sommets réels : une sphère englobante
// surévalue la semelle et ferait flotter le personnage. Le mode planté résout chaque pied.
export function groundDip(root: THREE.Object3D): number {
  root.updateWorldMatrix(true, true);
  let minY = Infinity;
  const v = new THREE.Vector3();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.part === "anchor" || mesh.userData.part === "muscle") return;
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++)
      minY = Math.min(minY, v.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).y);
  });
  return minY < 0 ? -minY : 0;
}

export const ANATOMY_URL = `${import.meta.env.BASE_URL}anatomy.glb`;
export const HIP_Y = 0.8835;
export const HIP_WIDTH = 0.34;

export type RigHandle = {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  head: THREE.Group;
  lumbar: THREE.Group;
  thoracic: THREE.Group;
  hipL: THREE.Object3D;
  hipR: THREE.Object3D;
  kneeL: THREE.Object3D;
  kneeR: THREE.Object3D;
  footL: THREE.Object3D;
  footR: THREE.Object3D;
  armUL?: THREE.Group;
  armUR?: THREE.Group;
  armFL?: THREE.Group;
  armFR?: THREE.Group;
  contactChest?: THREE.Mesh;
  contactPelvis?: THREE.Mesh;
  extraL: number;
  extraR: number;
  [key: string]: any;
};

export function resetRig(r: RigHandle): void {
  r.root.position.set(0, 0, 0);
  r.root.rotation.set(0, 0, 0);
  r.pelvis.position.set(0, HIP_Y, 0);
  r.pelvis.rotation.set(0, 0, 0);
  r.spine.rotation.set(0, 0, 0);
  r.lumbar.rotation.set(0, 0, 0);
  r.thoracic.rotation.set(0, 0, 0);
  r.chest.rotation.set(0, 0, 0);
  r.head.rotation.set(0, 0, 0);
  r.hipL.rotation.set(0, 0, 0);
  r.hipR.rotation.set(0, 0, 0);
  r.kneeL.rotation.set(0, 0, 0);
  r.kneeR.rotation.set(0, 0, 0);
  // #40: armUL is the anatomical left arm (+x); same physical rest angles as before the renaming.
  if (r.armUL) r.armUL.rotation.set(0, 0, -0.12);
  if (r.armUR) r.armUR.rotation.set(0, 0, 0.12);
  if (r.armFL) r.armFL.rotation.set(0, 0, 0);
  if (r.armFR) r.armFR.rotation.set(0, 0, 0);
  r.isoLean = undefined;
  r.swayFore = undefined;
  r.extraL = 0;
  r.extraR = 0;
}

export function makeTrail(color: string): THREE.Line {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
  geom.setDrawRange(0, 0);
  const line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color }));
  line.frustumCulled = false;
  return line;
}

export const BODY = "#94a3b8";
export const BODY_DARK = "#64748b";
export const TORSO_OPACITY = 0.22;
