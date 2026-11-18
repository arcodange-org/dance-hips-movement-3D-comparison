import * as THREE from "three";

// Repère fixe au sol (origine monde) : anneau + croix à (0,0,0). Toute animation avec
// déplacement (sorties garçon/fille, curseur Déplacement) se lit relativement à ce repère.
export default function OriginMarker({
  visible = true,
  color = "#7dd3fc",
}: {
  visible?: boolean;
  color?: string;
}) {
  return (
    <group visible={visible} position={[0, 0.002, 0]}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.24, 0.3, 40]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <ringGeometry args={[0.05, 0.07, 24]} />
        <meshBasicMaterial
          color="#f8fafc"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0015, 0]}>
        <planeGeometry args={[0.52, 0.022]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0015, 0]}>
        <planeGeometry args={[0.022, 0.52]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
