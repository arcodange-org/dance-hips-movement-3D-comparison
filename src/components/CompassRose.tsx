import * as THREE from "three";
import { useMemo } from "react";
import { Text } from "@react-three/drei";
import { DIR_LABELS } from "../directions";

// Boussole 8 directions au repère fixe (origine) : 4 cardinales + 4 diago. L'axe E-W (x) est la
// ligne de danse. Étiquettes en DejaVu embarquée (pas de CDN).
const FONT_URL = `${import.meta.env.BASE_URL}fonts/DejaVuSans-Bold-latin.ttf`;

export default function CompassRose({
  visible = true,
  radius = 0.5,
  labelRadius = 0.78,
}: {
  visible?: boolean;
  radius?: number;
  labelRadius?: number;
}) {
  const spokes = useMemo(() => {
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4; // k=0 -> +z (S)
      const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const cardinal = k % 2 === 0;
      const len = cardinal ? 0.2 : 0.12;
      const mat = new THREE.MeshBasicMaterial({
        color: cardinal ? "#cbd5e1" : "#64748b",
        transparent: true,
        opacity: cardinal ? 0.95 : 0.7,
      });
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(len, 0.005, 0.022);
      m.position.copy(dir).multiplyScalar(radius + len / 2);
      m.rotation.y = a - Math.PI / 2;
      g.add(m);
    }
    return g;
  }, [radius]);
  if (!visible) return null;
  return (
    <group position={[0, 0.006, 0]}>
      <primitive object={spokes} />
      {DIR_LABELS.map((label, k) => {
        const a = (k * Math.PI) / 4;
        const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
        const cardinal = k % 2 === 0;
        return (
          <Text
            key={label}
            position={dir.clone().multiplyScalar(labelRadius).toArray() as [number, number, number]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.055}
            color={cardinal ? "#e2e8f0" : "#94a3b8"}
            font={FONT_URL}
            anchorX="center"
            anchorY="middle"
          >
            {label}
          </Text>
        );
      })}
    </group>
  );
}
