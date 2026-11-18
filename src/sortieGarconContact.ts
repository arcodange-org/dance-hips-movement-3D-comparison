import * as THREE from "three";

/** Closest points on the middle 80% of two femurs, excluding the knee/hip joints. */
export function thighProximity(hipA: THREE.Vector3, kneeA: THREE.Vector3, hipB: THREE.Vector3, kneeB: THREE.Vector3) {
  const a = hipA.clone().lerp(kneeA, 0.1), b = hipB.clone().lerp(kneeB, 0.1);
  const u = kneeA.clone().lerp(hipA, 0.1).sub(a), v = kneeB.clone().lerp(hipB, 0.1).sub(b);
  const w = a.clone().sub(b);
  const A = u.dot(u), B = u.dot(v), C = u.dot(w), D = v.dot(v), E = v.dot(w);
  const clamp = (t: number) => Math.max(0, Math.min(1, t));
  const denominator = A * D - B * B;
  let s = denominator > 1e-12 ? clamp((B * E - C * D) / denominator) : 0;
  let t = D > 1e-12 ? (B * s + E) / D : 0;
  if (t < 0) { t = 0; s = A > 1e-12 ? clamp(-C / A) : 0; }
  else if (t > 1) { t = 1; s = A > 1e-12 ? clamp((B - C) / A) : 0; }
  const centerA = a.addScaledVector(u, s), centerB = b.addScaledVector(v, t);
  const direction = centerB.clone().sub(centerA);
  const distance = direction.length();
  direction.normalize();
  // Illustrative soft-tissue envelope, not a skin-mesh collision or a force model.
  const radius = 0.085;
  return { centerA, centerB, distance, direction, gap: distance - 2 * radius,
    surfaceA: centerA.clone().addScaledVector(direction, radius),
    surfaceB: centerB.clone().addScaledVector(direction, -radius) };
}
