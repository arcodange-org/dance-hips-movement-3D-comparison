import * as THREE from "three";

export interface LegSolution {
  qHip: THREE.Quaternion;
  beta: number;
  reach: number;
  clamped: boolean;
}

const clamp1 = (v: number) => Math.min(1, Math.max(-1, v));
const X_AXIS = new THREE.Vector3(1, 0, 0);
const POLE = new THREE.Vector3(0, 0, 1);
const TMP_A = new THREE.Vector3();
const TMP_B = new THREE.Vector3();
const TMP_C = new THREE.Vector3();

function anklePos(
  H: THREE.Vector3,
  qHip: THREE.Quaternion,
  beta: number,
  L1: number,
  L2: number,
  f0: THREE.Vector3,
  t0: THREE.Vector3,
  out: THREE.Vector3
): THREE.Vector3 {
  const f = TMP_A.copy(f0).applyQuaternion(qHip);
  const K = TMP_B.copy(H).addScaledVector(f, L1);
  const t = TMP_C.copy(t0).applyEuler(new THREE.Euler(beta, 0, 0)).applyQuaternion(qHip);
  return out.copy(K).addScaledVector(t, L2);
}

/**
 * IK deux segments (hanche -> genou -> cheville) avec genou charnière (axe x
 * local). H : hanche dans l'espace du Skeleton, A : cible de la cheville dans le
 * même espace, L1/L2 : longueurs, f0/t0 : directions de repos du fémur et du
 * tibia. Initialisation par pôle +z (genou vers l'avant) puis raffinement CCD
 * (hanche 3 DDL, genou 1 DDL charnière) : la cheville atteint A au millimètre
 * près quand la cible est atteignable. Retourne le quaternion de la hanche
 * (espace Skeleton) et la flexion du genou (rotation.x locale).
 */
export function solveLeg3D(
  H: THREE.Vector3,
  A: THREE.Vector3,
  L1: number,
  L2: number,
  f0: THREE.Vector3,
  t0: THREE.Vector3
): LegSolution {
  const toA = A.clone().sub(H);
  const rawD = toA.length();
  const maxD = (L1 + L2) * 0.9995;
  const minD = Math.abs(L1 - L2) + 1e-4;
  const clamped = rawD > maxD || rawD < minD;
  const d = Math.min(Math.max(rawD, minD), maxD);
  const u = rawD > 1e-6 ? toA.clone().multiplyScalar(1 / rawD) : new THREE.Vector3(0, -1, 0);

  // init : fémur dans le plan (u, pôle +z)
  const e2 = POLE.clone().addScaledVector(u, -POLE.dot(u));
  if (e2.lengthSq() < 1e-8) e2.set(1, 0, 0);
  e2.normalize();
  const cosA = clamp1((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const fInit = u.clone().multiplyScalar(cosA).addScaledVector(e2, sinA);
  const qHip = new THREE.Quaternion().setFromUnitVectors(f0, fInit);
  let beta = 0;

  // raffinement CCD
  const ankle = new THREE.Vector3();
  for (let i = 0; i < 16; i++) {
    anklePos(H, qHip, beta, L1, L2, f0, t0, ankle);
    const err = TMP_A.copy(A).sub(ankle);
    if (err.length() < 1e-5) break;

    // genou : tourner autour de l'axe charnière (qHip * x) pour aligner le tibia sur (A - K)
    const f = TMP_B.copy(f0).applyQuaternion(qHip);
    const K = H.clone().addScaledVector(f, L1);
    const axisK = TMP_C.copy(X_AXIS).applyQuaternion(qHip).normalize();
    const tCur = t0.clone().applyEuler(new THREE.Euler(beta, 0, 0)).applyQuaternion(qHip);
    const tDes = A.clone().sub(K).normalize();
    const cosK = clamp1(tCur.dot(tDes));
    const sinK = new THREE.Vector3().crossVectors(tCur, tDes).dot(axisK);
    beta += Math.atan2(sinK, cosK);

    // hanche : tourner qHip pour aligner (ankle - H) sur (A - H)
    anklePos(H, qHip, beta, L1, L2, f0, t0, ankle);
    const v = ankle.clone().sub(H).normalize();
    const w = A.clone().sub(H).normalize();
    const axisH = new THREE.Vector3().crossVectors(v, w);
    const s = axisH.length();
    if (s > 1e-8) {
      axisH.multiplyScalar(1 / s);
      const ang = Math.atan2(s, clamp1(v.dot(w)));
      qHip.premultiply(new THREE.Quaternion().setFromAxisAngle(axisH, ang));
    }
  }

  return { qHip, beta, reach: d, clamped };
}
