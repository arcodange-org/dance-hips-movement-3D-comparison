/** Dance frame (#40, docs/cadre/spec-implementation.md, option A): the arms reach contact sites on the
 * partner instead of fixed angles. Pure geometry: two-segment analytic IK per arm with an elbow pole;
 * lengths are constant, a target out of reach is clamped on the line to the shoulder (logged), no
 * force moves a dancer. Feet, pelvises and chests stay those of the figures.
 * Frames: GLB, +x left, +y up, +z forward, in each dancer's own chest frame for the sites. */
import * as THREE from "three";
import { ARM_JOINTS } from "./rigJoints";
import { essai } from "./essais";

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
  scapulaL: [0.15, 0.03, -0.1] as Vec3,
  /** Follower's left hand on the leader's right shoulder blade (same reasoning). */
  scapulaR: [-0.15, 0.03, -0.1] as Vec3,
  /** #180: follower's left hand on the leader's right shoulder, against its front and its side. */
  shoulderR: [-0.215, 0.125, 0.04] as Vec3,
  /** #180: where the follower's left elbow seeks the leader's right arm: under his shoulder, on its outer side. */
  armR: [-0.27, -0.2, 0.04] as Vec3,
  /** Leader's right elbow kept towards his right ribs (owner gesture: elbow to the ribs). */
  ribsR: [-0.15, -0.10, 0] as Vec3,
};
/** Proposals to validate by eye: height of the joined hands below the shoulders' mean (m), poles. */
export const CADRE = {
  handsDrop: 0.06, slack: 0.005, slide: 0.2, torso: [0.15, 0.13, 0.09] as Vec3,
  /** #178: where the leader's right hand waits once it has left the follower's back, in his chest frame:
   * the arm stays in frame, forearm raised, never along his body. In front first, then wider. */
  openFrame: [[-0.22, -0.06, 0.26], [-0.34, -0.06, 0.16], [-0.42, -0.04, 0.02]] as Vec3[],
  /** #178: how deep (m) his arm would enter her torso, aimed at her back, for the hand to have fully left it.
   * Below that depth the hand is on its way: no jump between the back and the open frame. */
  leave: 0.05,
  /** #179 (election, `?essai=`): the joined hands carried to the couple's side instead of between the two
   * chests. `out`: metres outwards from the shoulders' midpoint; `drop`: metres lower than `handsDrop`. */
  handsSide: { out: 0.2, drop: 0 }, handsLow: { out: 0.14, drop: 0.14 },
};

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
  // #179: candidates of the election, inert without `?essai=`.
  const carried = essai("mainsCote") ? CADRE.handsSide : essai("mainsBasses") ? CADRE.handsLow : null;
  if (carried) {
    const centre = leaderRig.chest.getWorldPosition(new THREE.Vector3()).add(followerRig.chest.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    joined.addScaledVector(joined.clone().sub(centre).setY(0).normalize(), carried.out);
    joined.y -= carried.drop;
  }
  const down = (rig: ArmRig, s: "L" | "R", out: number, drop: number) =>
    site(rig, [(s === "L" ? 1 : -1) * out, drop, 0]);
  const arms = follower ? {
    // Follower (#180): left hand on the leader's right shoulder, against its front and side; her left elbow
    // seeks his right arm, on which she leans when he lifts her. Right hand in the leader's left hand, elbow down.
    // (The pole is under his right shoulder, on the outer side, where his upper arm hangs: her forearm lies on
    // his arm, outside his torso. It does not follow his forearm, so her elbow never swings with it.)
    L: { target: site(partner, CADRE_SITES.shoulderR), pole: site(partner, CADRE_SITES.armR) },
    R: { target: joined, pole: down(own, "R", 0.25, -0.35) },
  } : {
    // Leader: right hand on the follower's left shoulder blade, elbow towards his right ribs; left hand
    // holding hers, elbow down and outwards.
    R: { target: site(partner, CADRE_SITES.scapulaL), pole: site(own, CADRE_SITES.ribsR) },
    L: { target: joined, pole: down(own, "L", 0.30, -0.35) },
  };
  const result = {} as Record<"L" | "R", { target: THREE.Vector3; hand: THREE.Vector3; elbow: THREE.Vector3; clamped: boolean; released: boolean }>;
  // #93: in an open position the chest no longer turns fully to the partner: a hand reaching for the
  // shoulder blade would cross her torso. The hand then slides along the partner's back towards her
  // side, up to `CADRE.slide`, until the arm passes outside her torso (box of the torso markers).
  const inside = (p: THREE.Vector3) => {
    const q = partner.chest.worldToLocal(p.clone());
    return Math.abs(q.x) < CADRE.torso[0] && Math.abs(q.y) < CADRE.torso[1] && Math.abs(q.z) < CADRE.torso[2];
  };
  const crosses = (S: THREE.Vector3, elbow: THREE.Vector3, hand: THREE.Vector3) => {
    for (let k = 1; k < 20; k++) {
      const a = S.clone().lerp(elbow, k / 20), b = elbow.clone().lerp(hand, k / 20);
      if ((a.distanceTo(hand) > 0.04 && inside(a)) || (b.distanceTo(hand) > 0.04 && inside(b))) return true;
    }
    return false;
  };
  /** How deep the arm enters the partner's torso box (m; 0 when it stays outside). */
  const depth = (S: THREE.Vector3, elbow: THREE.Vector3, hand: THREE.Vector3) => {
    let deep = 0;
    for (let k = 1; k < 20; k++) for (const p of [S.clone().lerp(elbow, k / 20), elbow.clone().lerp(hand, k / 20)]) {
      if (p.distanceTo(hand) <= 0.04) continue;
      const q = partner.chest.worldToLocal(p);
      deep = Math.max(deep, Math.min(CADRE.torso[0] - Math.abs(q.x), CADRE.torso[1] - Math.abs(q.y), CADRE.torso[2] - Math.abs(q.z)));
    }
    return deep;
  };
  for (const s of ["L", "R"] as const) {
    const S = shoulder(own, s);
    let solved = solveArm(S, arms[s].target, upper, fore, arms[s].pole);
    const back = !follower && s === "R" ? CADRE_SITES.scapulaL : null;
    if (back) for (let d = 0.01; d <= CADRE.slide + 1e-9 && crosses(S, solved.elbow, solved.hand); d += 0.01) {
      const slid = site(partner, [back[0] + Math.sign(back[0]) * d, back[1], back[2]]);
      solved = solveArm(S, slid, upper, fore, arms[s].pole);
      arms[s].target = slid;
    }
    // Still across her torso (she passes beside him): the hand lets go (the contact is released, the frame
    // opens).
    let released = false;
    if (crosses(S, solved.elbow, solved.hand)) {
      if (!follower && s === "R") {
        // #178: the leader's right arm is never lowered. It stays in frame, forearm raised, on the first
        // place that keeps the arm out of her torso. The hand goes there little by little, as the arm
        // aimed at her back would enter her torso: nothing jumps.
        const last = arms[s].target, pole = site(own, CADRE_SITES.ribsR);
        const places = CADRE.openFrame.map(p => {
          const target = site(own, p), arm = solveArm(S, target, upper, fore, pole);
          return { target, free: !crosses(S, arm.elbow, arm.hand) };
        });
        const place = (places.find(p => p.free) ?? places[0]).target;
        const t = Math.min(1, depth(S, solved.elbow, solved.hand) / CADRE.leave), gone = t * t * (3 - 2 * t);
        arms[s].target = last.clone().lerp(place, gone);
        solved = solveArm(S, arms[s].target, upper, fore, pole);
      } else {
        // The other arms come back along the dancer's own side.
        const side = site(own, [(s === "L" ? 1 : -1) * 0.22, -0.42, 0.06]);
        solved = solveArm(S, side, upper, fore, down(own, s, 0.1, -0.2));
        arms[s].target = side;
      }
      released = true;
    }
    const { elbow, hand, clamped } = solved;
    orientArm(s === "L" ? own.armUL : own.armUR, s === "L" ? own.armFL : own.armFR, elbow, hand);
    result[s] = { target: arms[s].target, hand, elbow, clamped, released };
  }
  return result;
}
