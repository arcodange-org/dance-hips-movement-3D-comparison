/** Dance frame (#40, docs/cadre/spec-implementation.md, option A): the arms reach contact sites on the
 * partner instead of fixed angles. Pure geometry: two-segment analytic IK per arm with an elbow pole;
 * lengths are constant, a target out of reach is clamped on the line to the shoulder (logged), no
 * force moves a dancer. Feet, pelvises and chests stay those of the figures.
 * Frames: GLB, +x left, +y up, +z forward, in each dancer's own chest frame for the sites. */
import * as THREE from "three";
import { ARM_JOINTS } from "./rigJoints";

type Vec3 = [number, number, number];
interface ArmRig {
  chest: THREE.Object3D; armUL: THREE.Object3D; armUR: THREE.Object3D; armFL: THREE.Object3D; armFR: THREE.Object3D;
}
/** A rig whose arms may not be mounted yet (React refs). */
export type MaybeArmRig = { chest?: THREE.Object3D; armUL?: THREE.Object3D; armUR?: THREE.Object3D; armFL?: THREE.Object3D; armFR?: THREE.Object3D };
export const hasArms = (r: MaybeArmRig | null | undefined): r is ArmRig =>
  !!(r && r.chest && r.armUL && r.armUR && r.armFL && r.armFR);

/** Contact sites in the owner's chest frame (spec table « Sites proposés », starting values). */
export const CADRE_SITES = {
  /** Leader's right hand on the follower's left shoulder blade, at the edge of her back: reached from
   * the side, the forearm lies along her flank instead of going through her torso (measured: at most
   * 1.4 cm into the torso box, against 5.7 cm on the middle of the shoulder blade). */
  scapulaL: [0.14, 0.03, -0.1] as Vec3,
  /** Follower's left hand on the leader's right shoulder blade (same reasoning). */
  scapulaR: [-0.14, 0.03, -0.1] as Vec3,
  /** Leader's right elbow kept towards his right ribs (owner gesture: elbow to the ribs). */
  ribsR: [-0.15, -0.10, 0] as Vec3,
};
/** Proposals to validate by eye: height of the joined hands below the shoulders' mean (m), poles. */
export const CADRE = { handsDrop: 0.06, slack: 0.005 };

const Y_DOWN = new THREE.Vector3(0, -1, 0);
const v = (a: Vec3) => new THREE.Vector3(...a);

/** Two-segment IK: shoulder S, target T, lengths a (upper) and b (fore), pole P (the elbow bends
 * towards it). Returns the elbow position, the reached hand position and whether T was clamped. */
export function solveArm(S: THREE.Vector3, T: THREE.Vector3, a: number, b: number, P: THREE.Vector3) {
  const toT = T.clone().sub(S);
  const raw = toT.length();
  const d = Math.max(Math.abs(a - b) + 1e-6, Math.min(a + b - CADRE.slack, raw));
  const u = raw > 1e-9 ? toT.divideScalar(raw) : Y_DOWN.clone();
  const hand = S.clone().addScaledVector(u, d);
  // Elbow on the circle of the shoulder-hand axis, on the pole's side.
  const along = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a * a - along * along));
  const side = P.clone().sub(S); side.addScaledVector(u, -side.dot(u));
  if (side.lengthSq() < 1e-12) side.copy(new THREE.Vector3(0, -1, 0).addScaledVector(u, -u.y));
  side.normalize();
  const elbow = S.clone().addScaledVector(u, along).addScaledVector(side, h);
  return { elbow, hand, clamped: raw > a + b - CADRE.slack + 1e-9 };
}

/** Orient one arm (upper group parented to the chest, fore group to the upper) so that its segments
 * go shoulder → elbow → hand. The arm groups hang along their local -y. */
function orientArm(upper: THREE.Object3D, fore: THREE.Object3D, elbow: THREE.Vector3, hand: THREE.Vector3) {
  const S = upper.getWorldPosition(new THREE.Vector3());
  const parentQ = upper.parent!.getWorldQuaternion(new THREE.Quaternion());
  const upperWorld = new THREE.Quaternion().setFromUnitVectors(Y_DOWN, elbow.clone().sub(S).normalize());
  upper.quaternion.copy(parentQ.clone().invert().multiply(upperWorld));
  upper.updateWorldMatrix(false, true);
  const foreWorld = new THREE.Quaternion().setFromUnitVectors(Y_DOWN, hand.clone().sub(elbow).normalize());
  fore.quaternion.copy(upperWorld.clone().invert().multiply(foreWorld));
  fore.updateWorldMatrix(false, true);
}

const site = (rig: ArmRig, local: Vec3) => rig.chest.localToWorld(v(local));

/** Solve this dancer's two arms against the partner's chest (both already posed). Returns the reached
 * hand positions and the targets, for tests and visualisation. */
export function solveFrame(own: ArmRig, partner: ArmRig, follower: boolean) {
  own.chest.updateWorldMatrix(true, true); partner.chest.updateWorldMatrix(true, true);
  const upper = -ARM_JOINTS.elbow[1], fore = -ARM_JOINTS.hand[1];
  const shoulder = (rig: ArmRig, s: "L" | "R") => site(rig, s === "L" ? ARM_JOINTS.shoulderL : ARM_JOINTS.shoulderR);
  // Joined hands: the leader's left and the follower's right meet between their shoulders, a little
  // below them (same point for both dancers: computed from both chests).
  const leaderRig = follower ? partner : own, followerRig = follower ? own : partner;
  const joined = shoulder(leaderRig, "L").add(shoulder(followerRig, "R")).multiplyScalar(0.5);
  joined.y -= CADRE.handsDrop;
  const down = (rig: ArmRig, s: "L" | "R", out: number, drop: number) =>
    site(rig, [(s === "L" ? 1 : -1) * out, drop, 0]);
  const arms = follower ? {
    // Follower: left hand on the leader's right shoulder blade, elbow raised outwards; right hand in
    // the leader's left hand, elbow down.
    L: { target: site(partner, CADRE_SITES.scapulaR), pole: down(own, "L", 0.45, 0.10) },
    R: { target: joined, pole: down(own, "R", 0.25, -0.35) },
  } : {
    // Leader: right hand on the follower's left shoulder blade, elbow towards his right ribs; left hand
    // holding hers, elbow down and outwards.
    R: { target: site(partner, CADRE_SITES.scapulaL), pole: site(own, CADRE_SITES.ribsR) },
    L: { target: joined, pole: down(own, "L", 0.30, -0.35) },
  };
  const result = {} as Record<"L" | "R", { target: THREE.Vector3; hand: THREE.Vector3; elbow: THREE.Vector3; clamped: boolean }>;
  for (const s of ["L", "R"] as const) {
    const S = shoulder(own, s);
    const { elbow, hand, clamped } = solveArm(S, arms[s].target, upper, fore, arms[s].pole);
    orientArm(s === "L" ? own.armUL : own.armUR, s === "L" ? own.armFL : own.armFR, elbow, hand);
    result[s] = { target: arms[s].target, hand, elbow, clamped };
  }
  return result;
}
