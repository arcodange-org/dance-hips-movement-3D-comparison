import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ContactViz({
  pair,
}: {
  pair: React.MutableRefObject<Record<string, any>>;
}) {
  const lines = useMemo(() => {
    const mk = (color: string) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
      const l = new THREE.Line(
        g,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
      );
      l.frustumCulled = false;
      return l;
    };
    return { chest: mk("#4ade80"), pelvis: mk("#4ade80"), kneeL: mk("#4ade80"), kneeR: mk("#4ade80") };
  }, []);
  const va = useMemo(() => new THREE.Vector3(), []);
  const vb = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const L = pair.current.leader;
    const F = pair.current.follower;
    if (!L || !F || !L.chest || !F.chest || !L.pelvis || !F.pelvis) return;
    // Face à face : le genou G du guideur touche le genou D du suiveur (miroir rotY π).
    const pairs: Array<[any, any, THREE.Line]> = [
      [L.chest, F.chest, lines.chest],
      [L.pelvis, F.pelvis, lines.pelvis],
      ...(L.kneeL && F.kneeR ? [[L.kneeL, F.kneeR, lines.kneeL]] : []),
      ...(L.kneeR && F.kneeL ? [[L.kneeR, F.kneeL, lines.kneeR]] : []),
    ] as Array<[any, any, THREE.Line]>;
    pairs.forEach(([a, b, line]) => {
      a.getWorldPosition(va);
      b.getWorldPosition(vb);
      const nearby = va.distanceTo(vb) < 0.09;
      const col = nearby ? "#4ade80" : "#f87171";
      (a.material as THREE.MeshBasicMaterial).color.set(col);
      (b.material as THREE.MeshBasicMaterial).color.set(col);
      a.scale.setScalar(nearby ? 1.3 : 1);
      b.scale.setScalar(nearby ? 1.3 : 1);
      const attr = line.geometry.attributes.position as THREE.BufferAttribute;
      attr.setXYZ(0, va.x, va.y, va.z);
      attr.setXYZ(1, vb.x, vb.y, vb.z);
      attr.needsUpdate = true;
      (line.material as THREE.LineBasicMaterial).color.set(nearby ? "#4ade80" : "#475569");
      (line.material as THREE.LineBasicMaterial).opacity = nearby ? 0.8 : 0.3;
    });
  });

  return (
    <>
      <primitive object={lines.chest} />
      <primitive object={lines.pelvis} />
      <primitive object={lines.kneeL} />
      <primitive object={lines.kneeR} />
    </>
  );
}
