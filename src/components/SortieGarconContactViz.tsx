import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { thighProximity } from "../sortieGarconContact";

/** Two lateral thigh-envelope markers for sortieG only; no mechanical-contact claim. */
export default function SortieGarconContactViz({ pair }: {
  pair: React.MutableRefObject<Record<string, any>>;
}) {
  const a = useRef<THREE.Mesh>(null), b = useRef<THREE.Mesh>(null);
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const result = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#38bdf8' }));
    result.frustumCulled = false;
    return result;
  }, []);
  useFrame(() => {
    const leader = pair.current.leader, follower = pair.current.follower;
    if (!leader?.hipR || !follower?.hipR || !a.current || !b.current) return;
    const position = (node: THREE.Object3D) => node.getWorldPosition(new THREE.Vector3());
    const contact = thighProximity(position(leader.hipR), position(leader.femurKneeR),
      position(follower.hipR), position(follower.femurKneeR));
    const nearby = Math.abs(contact.gap) < 0.03;
    const color = nearby ? '#38bdf8' : '#64748b';
    a.current.position.copy(contact.surfaceA); b.current.position.copy(contact.surfaceB);
    (a.current.material as THREE.MeshBasicMaterial).color.set(color);
    (b.current.material as THREE.MeshBasicMaterial).color.set(color);
    const points = line.geometry.attributes.position as THREE.BufferAttribute;
    points.setXYZ(0, contact.surfaceA.x, contact.surfaceA.y, contact.surfaceA.z);
    points.setXYZ(1, contact.surfaceB.x, contact.surfaceB.y, contact.surfaceB.z);
    points.needsUpdate = true;
    (line.material as THREE.LineBasicMaterial).color.set(color);
  });
  return <>
    <mesh ref={a}><sphereGeometry args={[0.018, 12, 8]} /><meshBasicMaterial color="#38bdf8" /></mesh>
    <mesh ref={b}><sphereGeometry args={[0.018, 12, 8]} /><meshBasicMaterial color="#38bdf8" /></mesh>
    <primitive object={line} />
  </>;
}
