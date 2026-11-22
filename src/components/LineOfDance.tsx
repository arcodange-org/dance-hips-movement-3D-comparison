import { useMemo } from "react";
import * as THREE from "three";

// Ligne de danse : axe x monde passant par le repère fixe (origine). Le couple en mode
// paire est placé SUR cette ligne (face à face selon z) ; la sortie est perpendiculaire
// à la ligne (axe x) : sortir de la ligne puis revenir dessus. Elle reste perpendiculaire aux
// bustes dans toutes les vues, figures comprises (#60).
// Rendu en rubans (boxes) et non en THREE.Line : les lignes WebGL font 1 px et
// disparaissent au rééchantillonnage des GIFs ; les boxes restent lisibles.
export default function LineOfDance({
  visible = true,
  color = "#f472b6",
  halfLength = 1.3,
  axis = "x",
}: {
  visible?: boolean;
  color?: string;
  halfLength?: number;
  /** Trial #72 (`?essai=ligneBustes`, src/essais.ts): "z" draws the line along the busts' axis. */
  axis?: "x" | "z";
}) {
  const dashes = useMemo(() => {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const dash = 0.09;
    const gap = 0.06;
    const depth = 0.035;
    for (let x = -halfLength; x < halfLength; x += dash + gap) {
      const len = Math.min(dash, halfLength - x);
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(len, 0.006, depth);
      m.position.set(x + len / 2, 0.003, 0);
      g.add(m);
    }
    if (axis === "z") g.rotation.y = Math.PI / 2;
    return g;
  }, [color, halfLength, axis]);
  if (!visible) return null;
  return <primitive object={dashes} />;
}
