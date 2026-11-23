/** #176 (docs/spec-haut-du-corps.md): mounts the anatomical upper body on a rig. A chunk of its own, loaded
 * with its GLB only when the option is on (`haut=1`). It runs after every rig's pose and arm frame (priority
 * -9 against -10), reads the rig and never moves one of its nodes. */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { RigHandle } from "../anatomy";
import { DRACO_DECODER_PATH, MUSCLE_OPACITY, makeMuscleMaterial } from "../muscles";
import { REPLACED_MUSCLES, UPPER_BODY_URL, UpperBody, readUpperBody } from "../upperBody";

export interface UpperBodyLayerProps {
  rig: RigHandle;
  pair: React.MutableRefObject<Record<string, any>> | null;
  side: "leader" | "follower" | null;
  showBones: boolean;
  showMuscles: boolean;
  ghost: boolean;
  /** Head carriage of the couple in a close embrace (on by default). */
  carriage?: boolean;
}
interface Mounted { upper: UpperBody; blocks: THREE.Mesh[]; replaced: THREE.Mesh[]; bone: THREE.MeshStandardMaterial; ghost: boolean | null }

export default function UpperBodyLayer({ rig, pair, side, showBones, showMuscles, ghost, carriage = true }: UpperBodyLayerProps) {
  const { scene } = useGLTF(UPPER_BODY_URL, DRACO_DECODER_PATH);
  const model = useMemo(() => readUpperBody(scene), [scene]);
  const mounted = useRef<Mounted | null>(null);
  useEffect(() => () => {
    const m = mounted.current;
    if (!m) return;
    m.upper.dispose(); m.bone.dispose();
    for (const b of m.blocks) b.visible = true;
    delete rig.upperBody;
    mounted.current = null;
  }, [model, rig]);

  useFrame(() => {
    if (!rig.chest || !rig.torso || !rig.Femur_R) return;
    if (!mounted.current) {
      // The stylised volumes (trunk, arms, head) and the three muscles the rig mounts rigidly give way.
      const blocks: THREE.Mesh[] = [], replaced: THREE.Mesh[] = [];
      (rig.torso as THREE.Object3D).traverse(o => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (mesh.userData.part === "torso") blocks.push(mesh);
        else if (mesh.userData.part === "muscle" && REPLACED_MUSCLES.test(mesh.name)) replaced.push(mesh);
      });
      const bone = ((rig.Femur_R as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
      bone.emissive?.set(0);
      const upper = new UpperBody(rig, model, { boneMaterial: bone, muscleMaterial: makeMuscleMaterial });
      rig.upperBody = upper;
      mounted.current = { upper, blocks, replaced, bone, ghost: null };
    }
    const m = mounted.current;
    for (const b of m.blocks) b.visible = false;
    for (const b of m.replaced) b.visible = false;
    m.upper.show(showBones, showBones && showMuscles);
    if (m.ghost !== ghost) {
      m.ghost = ghost;
      m.bone.transparent = ghost; m.bone.opacity = ghost ? 0.1 : 1;
      for (const mesh of m.upper.muscles) (mesh.material as THREE.Material).opacity = ghost ? 0.06 : MUSCLE_OPACITY;
    }
    const partner = pair && side ? (pair.current[side === "leader" ? "follower" : "leader"]?.rig as RigHandle | undefined) : undefined;
    m.upper.update(partner ?? null, side === "follower", carriage);
  }, -9);
  return null;
}
