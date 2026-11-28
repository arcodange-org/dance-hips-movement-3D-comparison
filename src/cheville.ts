/**
 * #229 (docs/spec-pied-sur-la-plante.md, « La cheville et le raccord à la jambe ») : la cheville du squelette.
 *
 * Le talus est dans la pince que forment le tibia et la fibula. Quand le pied se tend (le talon monte), un talus qui
 * tourne seulement autour de la cheville heurte le devant du tibia au-delà d'une vingtaine de degrés (mesuré sur le GLB,
 * `scripts/test_cheville.mjs`) ; aucun centre de rotation fixe ne l'évite. Une vraie cheville roule et glisse : en se
 * tendant, le talus recule dans la pince. Le pied glisse donc d'autant vers l'arrière et un peu vers le bas, dans le
 * repère de la jambe : le talus reste dans la pince sans y entrer, et la jambe prend ce glissement à son compte (le pied
 * reste où il est posé).
 */
import * as THREE from "three";
import { islands } from "./orteils";

const DEG = Math.PI / 180;

/** Le glissement du talus dans la pince (mesuré sur le GLB, à l'exercice) : nul jusqu'à `from` de flexion de la cheville
 * (pied tendu, rad), puis `perRad` (m par rad) au-delà, vers l'arrière de la jambe, incliné de `down` (rad) vers le bas.
 * Mesuré : 1 mm suffit à 25° (la mi-hauteur), 2 mm à 45°, 4 mm à 70° (la demi-pointe complète). */
export const ANKLE_GLIDE = { from: 12 * DEG, perRad: 0.00008 / DEG, down: 40 * DEG } as const;

/** De combien (rad) la rotation `q` (le pied dans le repère de la jambe) tourne autour de l'axe de la cheville `axis`
 * (unitaire) : la part de flexion, positive pied tendu (talon levé). */
export function ankleFlexion(q: THREE.Quaternion, axis: THREE.Vector3): number {
  return 2 * Math.atan2(axis.x * q.x + axis.y * q.y + axis.z * q.z, q.w);
}

/** Le glissement du talus (m, repère de la jambe au repos : +z devant) pour une cheville tendue de `flexion` (rad). */
export function ankleGlide(flexion: number, out = new THREE.Vector3()): THREE.Vector3 {
  const length = Math.max(0, flexion - ANKLE_GLIDE.from) * ANKLE_GLIDE.perRad;
  return out.set(0, -Math.sin(ANKLE_GLIDE.down) * length, -Math.cos(ANKLE_GLIDE.down) * length);
}

/** Les sommets du talus dans le maillage du pied (`Foot_<côté>`) : l'os du pied le plus haut, sous le tibia. */
export function talusOf(foot: THREE.Mesh): number[] {
  const p = foot.geometry.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  foot.updateMatrix();
  const top = (group: number[]) => Math.max(...group.map(i => v.fromBufferAttribute(p, i).applyMatrix4(foot.matrix).y));
  return islands(foot.geometry).filter(group => group.length > 50).reduce((best, group) => top(group) > top(best) ? group : best);
}
