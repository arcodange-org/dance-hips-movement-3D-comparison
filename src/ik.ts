import * as THREE from "three";

export interface LegSolution {
  qHip: THREE.Quaternion;
  beta: number;
  reach: number;
  clamped: boolean;
}
const clamp1 = (v: number) => Math.min(1, Math.max(-1, v));

/** Exact two-link solve with GLB rest vectors and a local-X knee hinge.
 * Lengths never change; the pelvis must move when a target is unreachable. */
export function solveLeg3D(
  H: THREE.Vector3, A: THREE.Vector3, L1: number, L2: number,
  f0: THREE.Vector3, t0: THREE.Vector3
): LegSolution {
  const v = A.clone().sub(H);
  const rawD = v.length();
  const u = rawD > 1e-9 ? v.divideScalar(rawD) : new THREE.Vector3(0, -1, 0);
  // f0 · Rx(beta)t0 = c + a cos(beta) + b sin(beta).
  const a = f0.y * t0.y + f0.z * t0.z;
  const b = f0.z * t0.y - f0.y * t0.z;
  const c = f0.x * t0.x;
  const radius = Math.hypot(a, b);
  const maxD = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * (c + radius));
  const minD = Math.sqrt(Math.max(0, L1 * L1 + L2 * L2 + 2 * L1 * L2 * (c - radius)));
  const d = Math.max(minD + 1e-8, Math.min(maxD - 1e-8, rawD));
  const cosine = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const beta = Math.atan2(b, a) + Math.acos(clamp1((cosine - c) / radius));
  const end = f0.clone().multiplyScalar(L1)
    .add(t0.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), beta).multiplyScalar(L2));
  const qHip = new THREE.Quaternion().setFromUnitVectors(end.normalize(), u);
  const knee = f0.clone().applyQuaternion(qHip);
  knee.addScaledVector(u, -knee.dot(u));
  const pole = new THREE.Vector3(0, 0, 1).addScaledVector(u, -u.z);
  if (knee.lengthSq() > 1e-12 && pole.lengthSq() > 1e-12) {
    knee.normalize(); pole.normalize();
    const twist = Math.atan2(u.dot(knee.clone().cross(pole)), clamp1(knee.dot(pole)));
    qHip.premultiply(new THREE.Quaternion().setFromAxisAngle(u, twist));
  }
  return { qHip, beta, reach: d, clamped: Math.abs(d - rawD) > 1e-7 };
}
