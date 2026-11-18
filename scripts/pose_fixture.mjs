import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const bytes = readFileSync(new URL("../public/anatomy.glb", import.meta.url));
const { scene } = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), ""
);

export function fixture(api, { rotation = 0, offset = [0, 0, 0] } = {}) {
  const r = { extraL: 0, extraR: 0 };
  for (const n of ["root", "pelvis", "torso", "spine", "lumbar", "thoracic", "chest", "head",
    "contactKneeL", "contactKneeR", "contactChest", "contactPelvis", "armUL", "armUR", "armFL", "armFR"])
    r[n] = new THREE.Group();
  const outer = new THREE.Group();
  outer.position.fromArray(offset); outer.rotation.y = rotation;
  outer.add(r.root); r.root.add(r.pelvis); r.pelvis.position.y = api.HIP_Y;
  const skel = scene.clone(true);
  r.pelvis.add(skel, r.torso, r.contactPelvis, r.contactKneeL, r.contactKneeR);
  r.torso.add(r.spine); r.spine.add(r.lumbar, r.thoracic, r.chest);
  r.chest.add(r.head, r.contactChest, r.armUL, r.armUR); r.armUL.add(r.armFL); r.armUR.add(r.armFR);
  for (const [name, p] of Object.entries(api.TORSO_JOINTS)) r[name].position.fromArray(p);
  r.contactChest.position.set(0, 0, 0.16); r.contactPelvis.position.set(0, 0, 0.14);
  api.bindSkeleton(r, skel);
  return { r, outer, model: api.createPoseModel(r) };
}

export function minimumBoneY(r) {
  r.root.updateWorldMatrix(true, true);
  let y = Infinity;
  const v = new THREE.Vector3();
  r.Skeleton.traverse(o => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++)
      y = Math.min(y, v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).y);
  });
  return y;
}

export function snapshot(r) {
  r.root.updateWorldMatrix(true, true);
  return ["root", "pelvis", "hipL", "hipR", "kneeL", "kneeR", "footL", "footR", "chest", "head"]
    .flatMap(n => r[n].matrixWorld.toArray());
}
