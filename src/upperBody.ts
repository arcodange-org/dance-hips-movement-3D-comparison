/** Anatomical upper body (#176, docs/spec-haut-du-corps.md): rib cage, spinal column, neck, skull, shoulder
 * girdle, arms, forearms and hands — bones and muscles of BodyParts3D (public/anatomy_upper.glb), in place of
 * the stylised grey volumes. Pure three.js, no React: the same code serves the view and the node tests.
 *
 * The figures keep the last word: the pelvis, spine, chest and head are the rig's own nodes, and the anatomical
 * hand comes where the rig puts its hand. This module adds what the rig does not describe: the elbow with the
 * anatomical lengths, the pronation of the forearm (the radius turns around the ulna) and where the palm faces.
 * Nothing here depends on time: the pose is a function of the rig's pose. */
import * as THREE from "three";
import type { RigHandle } from "./anatomy";
import { ARM_JOINTS, TORSO_JOINTS } from "./rigJoints";
import { CADRE_SITES, solveArm } from "./cadre";

export const UPPER_BODY_URL = `${import.meta.env.BASE_URL}anatomy_upper.glb`;

export type ArmSide = "L" | "R";
type V3 = [number, number, number];
/** The `extras` of the GLB's scene, written by scripts/build_upper_body.mjs. */
export interface UpperBodyManifest {
  attribution: string;
  joints: string[];
  engine: Record<"pelvis" | "spine" | "chest" | "head", V3>;
  rest: Record<string, V3>;
  axes: Record<ArmSide, { arm: V3; hinge: V3; pronation: V3; radialHead: V3; palm: V3; palmNormal: V3; fingers: V3; middleTip: V3 }>;
  measures: Record<ArmSide, { arm: number; forearm: number; elbowToPalm: number }>;
  pieces: { name: string; kind: "bone" | "muscle"; group: string; side: ArmSide | "C" }[];
}
export interface UpperBodyPiece { name: string; kind: "bone" | "muscle"; group: string; side: ArmSide | "C"; geometry: THREE.BufferGeometry }
export interface UpperBodyModel { manifest: UpperBodyManifest; pieces: UpperBodyPiece[] }

/** Reads the pieces of a loaded GLB scene (GLTFLoader): weighted geometries, shared between dancers. */
export function readUpperBody(scene: THREE.Object3D): UpperBodyModel {
  const manifest = scene.userData as UpperBodyManifest;
  const pieces: UpperBodyPiece[] = [];
  scene.traverse(o => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isMesh || !m.geometry.getAttribute("skinIndex")) return;
    const declared = manifest.pieces.find(p => p.name === m.name);
    if (declared) pieces.push({ ...declared, geometry: m.geometry });
  });
  return { manifest, pieces };
}

/** Pronation range kept (rad, from the anatomical position, palm forward): an animation parameter of this
 * model, not a clinical limit. */
export const PRONATION = { min: -0.17, max: 2.97 };
/** Head carriage in a close embrace (animation parameters, to validate by eye): when the two heads are close,
 * each dancer turns theirs to their left, cheek to cheek; beyond `far`, they face each other. Face to face at
 * 24 cm, two skulls already touch. */
export const HEAD_CARRIAGE = { angle: 0.73, near: 0.34, far: 0.55 };
/** Yaw of the head (rad, to the dancer's left) for a distance between the two heads (m). */
export function headCarriage(distance: number): number {
  const t = Math.max(0, Math.min(1, (distance - HEAD_CARRIAGE.near) / (HEAD_CARRIAGE.far - HEAD_CARRIAGE.near)));
  return HEAD_CARRIAGE.angle * (1 - t * t * (3 - 2 * t));
}
/** Muscles the rig mounts rigidly on the trunk (public/anatomy_muscles.glb) and this layer replaces, weighted. */
export const REPLACED_MUSCLES = /^Muscle_(Deltoid|Trapezius|PectoralisMajor)_[RL]$/;

const HAND = new THREE.Vector3(...ARM_JOINTS.hand);
const v = (a: V3) => new THREE.Vector3(...a);
const OTHER: Record<ArmSide, ArmSide> = { L: "R", R: "L" };

interface Arm {
  sign: number;
  arm: THREE.Object3D; fore: THREE.Object3D[]; hand: THREE.Object3D;
  restArm: THREE.Vector3; hinge: THREE.Vector3; axis: THREE.Vector3; pivot: THREE.Vector3;
  palm: THREE.Vector3; palmNormal: THREE.Vector3; length: number;
}
export interface ArmState {
  target: THREE.Vector3; palm: THREE.Vector3; elbow: THREE.Vector3; pronation: number; error: number;
  /** What the hand holds: the partner's back, the partner's hand, or nothing. */
  hold: "back" | "hands" | "free";
}
export interface UpperBodyOptions {
  /** Material of the bones (the rig's bone material, for the same look). */
  boneMaterial: THREE.Material;
  /** Factory of the muscles' material (the rig's). */
  muscleMaterial: () => THREE.Material;
}

export class UpperBody {
  readonly group = new THREE.Group();
  readonly bones: THREE.SkinnedMesh[] = [];
  readonly muscles: THREE.SkinnedMesh[] = [];
  /** Joint nodes by name (`manifest.joints`): the rig's own nodes and the arms' nodes added here. */
  readonly joints = new Map<string, THREE.Object3D>();
  /** Carries the head: child of the rig's `head` node, at its origin; the head carriage turns it. */
  readonly headCarrier = new THREE.Object3D();
  readonly state = {} as Record<ArmSide, ArmState>;
  private readonly arms = {} as Record<ArmSide, Arm>;
  private readonly added: THREE.Object3D[] = [];
  private readonly byGroup = new Map<string, THREE.SkinnedMesh[]>();

  constructor(private readonly r: RigHandle, readonly model: UpperBodyModel, options: UpperBodyOptions) {
    const { manifest: m } = model, A = m.rest;
    // Rest of the rig's nodes in the skeleton frame (that of the `pelvis` group), read on the rig's constants.
    const spine = v(TORSO_JOINTS.spine as V3), chest = spine.clone().add(v(TORSO_JOINTS.chest as V3)), head = chest.clone().add(v(TORSO_JOINTS.head as V3));
    const rest = new Map<string, THREE.Vector3>([["pelvis", new THREE.Vector3()], ["spine", spine], ["chest", chest], ["head", head]]);
    this.headCarrier.name = "upper_headCarrier";
    r.head.add(this.headCarrier); this.added.push(this.headCarrier);
    for (const [name, node] of [["pelvis", r.pelvis], ["spine", r.spine], ["chest", r.chest], ["head", this.headCarrier]] as [string, THREE.Object3D][]) this.joints.set(name, node);
    const child = (name: string, parent: THREE.Object3D, local: THREE.Vector3) => {
      const o = new THREE.Object3D();
      o.name = `upper_${name}`; o.position.copy(local);
      parent.add(o); this.added.push(o); this.joints.set(name, o);
      return o;
    };
    for (const s of ["L", "R"] as ArmSide[]) {
      const E = v(A["arm" + s]), C = v(A["fore0" + s]), R = v(A["fore1" + s]), W = v(A["hand" + s]), ax = m.axes[s];
      const arm = child("arm" + s, r.chest, E.clone().sub(chest));
      const fore0 = child("fore0" + s, arm, C.clone().sub(E));
      const fore = [fore0, ...[1, 2, 3, 4].map(k => child(`fore${k}${s}`, fore0, R.clone().sub(C)))];
      const hand = child("hand" + s, fore[4], W.clone().sub(R));
      rest.set("arm" + s, E); rest.set("hand" + s, W);
      fore.forEach((_, k) => rest.set(`fore${k}${s}`, k ? R : C));
      const restArm = C.clone().sub(E).normalize(), hinge = v(ax.hinge);
      hinge.addScaledVector(restArm, -hinge.dot(restArm)).normalize();
      this.arms[s] = {
        sign: s === "L" ? 1 : -1, arm, fore, hand, restArm, hinge, axis: v(ax.pronation).normalize(), pivot: R.clone().sub(C),
        palm: v(ax.palm).sub(C), palmNormal: v(ax.palmNormal).normalize(), length: C.distanceTo(E),
      };
    }
    const nodes = m.joints.map(n => this.joints.get(n)!);
    const inverses = m.joints.map(n => new THREE.Matrix4().makeTranslation(rest.get(n)!.clone().negate()));
    const skeleton = new THREE.Skeleton(nodes as THREE.Bone[], inverses);
    for (const p of model.pieces) {
      const mesh = new THREE.SkinnedMesh(p.geometry, p.kind === "bone" ? options.boneMaterial : options.muscleMaterial());
      mesh.name = p.name;
      // Muscles follow the rig's muscle rules (ghost opacity); neither kind is under a foot or the GLB skeleton,
      // so the supports and the floor clamp do not see them.
      if (p.kind === "muscle") mesh.userData.part = "muscle";
      mesh.frustumCulled = false;
      mesh.bind(skeleton, new THREE.Matrix4());
      (p.kind === "bone" ? this.bones : this.muscles).push(mesh);
      if (!this.byGroup.has(p.group)) this.byGroup.set(p.group, []);
      this.byGroup.get(p.group)!.push(mesh);
      this.group.add(mesh);
    }
    this.group.name = "upper_body";
    r.pelvis.add(this.group);
  }

  /** Shows or hides the bones, the muscles, and whole groups (« skull », « neck »…). */
  show(bones: boolean, muscles: boolean, hidden: readonly string[] = []) {
    for (const m of this.bones) m.visible = bones;
    for (const m of this.muscles) m.visible = muscles;
    for (const g of hidden) for (const m of this.byGroup.get(g) ?? []) m.visible = false;
  }

  /** Poses the head carriage and both arms from the rig's current pose. `partner`: their rig, if any;
   * `follower`: this dancer is the follower; `carriage`: turn the head in a close embrace. */
  update(partner: RigHandle | null, follower: boolean, carriage = true) {
    const r = this.r;
    r.chest.updateWorldMatrix(true, false);
    this.headCarrier.rotation.y = carriage && partner?.head
      ? headCarriage(r.head.getWorldPosition(new THREE.Vector3()).distanceTo(partner.head.getWorldPosition(new THREE.Vector3()))) : 0;
    for (const s of ["L", "R"] as ArmSide[]) {
      const armF = r["armF" + s] as THREE.Object3D | undefined;
      if (!armF) continue;
      armF.updateWorldMatrix(true, false);
      const target = armF.localToWorld(HAND.clone()), rigElbow = armF.getWorldPosition(new THREE.Vector3());
      const { hold, normal } = this.palmFacing(s, target, partner, follower);
      this.state[s] = { ...this.pose(this.arms[s], target, rigElbow, normal), hold };
    }
  }

  /** Where the palm turns, from what the rig's hand touches. */
  private palmFacing(s: ArmSide, target: THREE.Vector3, partner: RigHandle | null, follower: boolean) {
    const axis = (o: THREE.Object3D, x: number, y: number, z: number) => new THREE.Vector3(x, y, z).transformDirection(o.matrixWorld);
    const sign = s === "L" ? 1 : -1;
    if (partner?.chest) {
      partner.chest.updateWorldMatrix(true, false);
      // Hand on the partner's shoulder blade (or slid along the back, #93): the palm faces the back.
      const site = partner.chest.localToWorld(v((s === "R" ? CADRE_SITES.scapulaL : CADRE_SITES.scapulaR) as V3));
      const slid = partner.chest.worldToLocal(target.clone());
      if (s === (follower ? "L" : "R") && (site.distanceTo(target) < 0.03 || (Math.abs(slid.z + 0.1) < 0.02 && Math.abs(slid.y - 0.03) < 0.02)))
        return { hold: "back" as const, normal: axis(partner.chest, 0, 0, 1) };
      // Joined hands: the leader's palm faces the partner, a little up and inwards; the follower's faces it.
      const other = partner["armF" + OTHER[s]] as THREE.Object3D | undefined;
      if (other && s === (follower ? "R" : "L")) {
        other.updateWorldMatrix(true, false);
        if (other.localToWorld(HAND.clone()).distanceTo(target) < 0.04) {
          const n = axis(follower ? partner.chest : this.r.chest, -0.3, 0.45, 0.75).normalize();
          return { hold: "hands" as const, normal: follower ? n.negate() : n };
        }
      }
    }
    // Free hand: the palm towards the body.
    return { hold: "free" as const, normal: axis(this.r.chest, -0.7 * sign, 0, -0.7).normalize() };
  }

  /** Two-segment arm with the anatomical lengths: the palm comes on `target`, the elbow bends on the side of
   * the rig's elbow, the radius turns to present the palm towards `normal`. */
  private pose(b: Arm, target: THREE.Vector3, pole: THREE.Vector3, normal: THREE.Vector3): Omit<ArmState, "hold"> {
    const S = b.arm.getWorldPosition(new THREE.Vector3());
    const parent = b.arm.parent!.getWorldQuaternion(new THREE.Quaternion());
    const basis = (x: THREE.Vector3, y: THREE.Vector3) => new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
    // Rotation taking direction d0 to d and, around it, h0 to h.
    const from = (d0: THREE.Vector3, h0: THREE.Vector3, d: THREE.Vector3, h: THREE.Vector3) => {
      const hp = h0.clone().addScaledVector(d0, -h0.dot(d0)).normalize(), hq = h.clone().addScaledVector(d, -h.dot(d)).normalize();
      return new THREE.Quaternion().setFromRotationMatrix(basis(d, hq).multiply(basis(d0, hp).transpose()));
    };
    let phi = b.sign * 1.4, elbow = new THREE.Vector3();
    const turn = new THREE.Quaternion(), TURNS = 4;
    for (let k = 0; k < TURNS; k++) {
      // The palm at rest, turned by phi around the pronation axis, in the elbow's frame.
      const q = b.palm.clone().sub(b.pivot).applyQuaternion(turn.setFromAxisAngle(b.axis, phi)).add(b.pivot);
      const solution = solveArm(S, target, b.length, q.length(), pole);
      elbow = solution.elbow;
      const u = elbow.clone().sub(S).normalize(), f = solution.hand.clone().sub(elbow).normalize();
      // Normal of the arm's plane: the forearm flexes around it, towards the front of the humerus.
      const side = pole.clone().sub(S), toHand = solution.hand.clone().sub(S).normalize();
      side.addScaledVector(toHand, -side.dot(toHand));
      const n = side.lengthSq() > 1e-10 ? side.cross(toHand).normalize() : b.hinge.clone().applyQuaternion(parent);
      const upper = from(b.restArm, b.hinge, u, n), fore = from(q.clone().normalize(), b.hinge, f, n);
      b.arm.quaternion.copy(parent.clone().invert().multiply(upper));
      b.fore[0].quaternion.copy(upper.clone().invert().multiply(fore));
      for (let i = 1; i <= 4; i++) b.fore[i].quaternion.setFromAxisAngle(b.axis, (phi * i) / 4);
      // The last turn poses the arm with the pronation found: the palm is then exactly on the target.
      if (k === TURNS - 1) break;
      // Pronation: the angle turning the palm's normal towards the wanted direction, within the range.
      const t = normal.clone().applyQuaternion(fore.clone().invert());
      const n0 = b.palmNormal.clone().addScaledVector(b.axis, -b.palmNormal.dot(b.axis)), t0 = t.addScaledVector(b.axis, -t.dot(b.axis));
      if (t0.lengthSq() > 1e-6) {
        let angle = Math.atan2(new THREE.Vector3().crossVectors(n0, t0).dot(b.axis), n0.dot(t0)) * b.sign;
        // Out of range: the nearest bound (the angle is taken in ]-π, π]).
        if (angle < (PRONATION.min + PRONATION.max) / 2 - Math.PI) angle += 2 * Math.PI;
        phi = b.sign * Math.max(PRONATION.min, Math.min(PRONATION.max, angle));
      }
    }
    b.arm.updateWorldMatrix(false, true);
    const palm = b.fore[4].localToWorld(b.palm.clone().sub(b.pivot));
    return { target, palm, elbow, pronation: phi * b.sign, error: palm.distanceTo(target) };
  }

  dispose() {
    this.group.removeFromParent();
    for (const o of this.added) o.removeFromParent();
    for (const m of this.muscles) (m.material as THREE.Material).dispose();
  }
}
