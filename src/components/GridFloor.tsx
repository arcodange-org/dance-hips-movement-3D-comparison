export default function GridFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshStandardMaterial color="#111c33" roughness={1} />
      </mesh>
      <gridHelper args={[6.8, 34, "#243550", "#1a2740"]} />
    </group>
  );
}
