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
import { essai } from "./essais";

export const UPPER_BODY_URL = `${import.meta.env.BASE_URL}anatomy_upper.glb`;

export type ArmSide = "L" | "R";
export const FINGERS = ["thumb", "index", "middle", "ring", "little"] as const;
export type Finger = typeof FINGERS[number];
/** A hand's shape (#179), in radians. `fingers`: flexion of the three joints of the four fingers, from the
 * knuckle outwards. `thumb`: angle between the thumb and the index, then flexion of its two phalanges. */
export interface HandShape { fingers: [number, number, number]; thumb: [number, number, number] }
/** Shapes by what the hand does. In the closed-position hold the leader's fingers stay together and his thumb
 * opens, almost at a right angle; the follower's fingers close around his index (flexion read on the follower's
 * fingers of ReCoDanse's salsa turn), her thumb around his. */
export const HAND_SHAPES = {
  relaxed: { fingers: [0.3, 0.38, 0.22], thumb: [0.45, 0.15, 0.15] },
  flat: { fingers: [0.16, 0.18, 0.12], thumb: [0.6, 0.1, 0.1] },
  offers: { fingers: [0.14, 0.16, 0.1], thumb: [1.4, 0.05, 0.1] },
  closes: { fingers: [0.78, 0.84, 0.64], thumb: [0.9, 0.5, 0.45] },
} satisfies Record<string, HandShape>;
type V3 = [number, number, number];
/** The `extras` of the GLB's scene, written by scripts/build_upper_body.mjs. */
export interface UpperBodyManifest {
  attribution: string;
  joints: string[];
  engine: Record<"pelvis" | "spine" | "chest" | "head", V3>;
  rest: Record<string, V3>;
  parents: Record<string, string>;
  axes: Record<ArmSide, {
    arm: V3; hinge: V3; pronation: V3; radialHead: V3; palm: V3; palmNormal: V3; fingers: V3; middleTip: V3;
    /** Per finger, the axes of its three joints: a positive rotation closes it towards the palm; the thumb's
     * first joint opens it away from the index. */
    flexion: Record<Finger, [V3, V3, V3]>;
    tips: Record<Finger, V3>;
  }>;
  measures: Record<ArmSide, { arm: number; forearm: number; elbowToPalm: number; thumbToIndex: number }>;
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
/** Flexion the elbow allows (rad; 0: the arm straight). Past it, a rig's hand asks for a fold no elbow gives (#182). */
export const ELBOW_MAX = 2.53;
/** A free hand the rig folds past that range (its frame alone, #182), in the chest's frame: where the forearm
 * rises from the rig's elbow (outwards, up, forwards) and where the palm faces (inwards, up, forwards). Clear of
 * the face, a wide mascot's head included. Animation parameters, to validate by eye. */
export const RAISED = { forearm: [0.35, 0.8, 0.45] as V3, palm: [1, 0, 0.5] as V3 };
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
  /** Wrist (#179): from the elbow at rest, the palm's centre from the wrist, the fingers' direction. */
  wrist: THREE.Vector3; palmFromWrist: THREE.Vector3; fingers: THREE.Vector3;
}
/** Closed-position hold (#179): the follower's right hand lies across the leader's left palm, the heel of her
 * palm at the edge of his hand, her knuckles at his index (her fingers close around it), her thumb towards his.
 * `shift`: her palm from his, towards his index (m); `gap`: between the two palms (m); `wrist`: how far her wrist
 * may bend away from the forearm's axis (rad); `swivel`: how far her hand may turn on his palm, away from the
 * line to his index, towards where her forearm comes from (rad). */
export const GRIP = { shift: 0.012, gap: 0.004, wrist: 1.0, swivel: 0.7,
  /** Hands held up at the couple's side (#179; the owner's choice, 23 November 2026).
   * As in a ballroom hold (reference photograph, see the election's README): the leader's thumb points to the sky,
   * his fingers go forwards, raised by `lift` (rad), and close in one block round the edge of the follower's hand,
   * onto its back; `palm`: where his palm is asked to face, in his chest frame (the palm's normal leans 9° towards
   * the fingers: measured, it faces halfway between his right and the follower). The follower's hand stands up
   * against his palm, her four fingers between his thumb and his index, closed around the web of his thumb, palm
   * against palm, her thumb under his: no bone goes through another (found by search on the two hands' bones,
   * scripts/search_prise_mains.mjs; scripts/mesure_essai_mains.mjs measures it).
   * In the frame of his hand (R towards his thumb, U along his fingers, N out of his palm): `across`: her
   * fingers from U towards R (rad); `at`: her palm's centre from his, along R, U, N (m); `roll`, `pitch`: her
   * hand around her own fingers, then her fingers into his palm (rad). `his`, `hers`: the two hands' shapes.
   * `elbow`: where the leader's elbow tends, from his shoulder, in his chest frame (x away from the midline);
   * `drop`: how far under the line of her hand the follower's elbow tends (m); `wrist`: how far her wrist may bend
   * in this hold (rad): the hands are close to both bodies, her forearm comes steeply to her hand. */
  upright: {
    palm: [-1, 0, 0.73] as V3, across: 1.373, at: [0.013, -0.01, 0.025] as V3, roll: 0.12, pitch: -0.116,
    lift: 0.5,
    his: { fingers: [1.35, 0.437, 0.913], thumb: [1.55, 0.35, 0.35] } as HandShape,
    hers: { fingers: [1, 1.011, 0.306], thumb: [0.459, 0, 0.573] } as HandShape,
    elbow: [0.25, -1, 0.1] as V3, drop: 0.1, wrist: 1.25,
  } };

export interface ArmState {
  target: THREE.Vector3; palm: THREE.Vector3; elbow: THREE.Vector3; pronation: number; error: number;
  /** Bend of the wrist away from the forearm's axis (rad): 0 unless the hand takes the partner's hand. */
  wrist: number;
  /** What the hand holds: the partner's back or shoulder, the partner's hand, or nothing. */
  hold: "back" | "hands" | "free";
  /** The shape of the hand's fingers. */
  shape: HandShape;
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
        wrist: W.clone().sub(C), palmFromWrist: v(ax.palm).sub(W), fingers: v(ax.fingers).normalize(),
      };
    }
    // Fingers (#179): three joints each, chained from the hand.
    for (const name of m.joints) if (!this.joints.has(name)) {
      const parent = m.parents[name], at = v(A[name]);
      child(name, this.joints.get(parent)!, at.clone().sub(rest.get(parent)!));
      rest.set(name, at);
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
    // Published on the rig: the partner's layer reads it (the hand that takes this one), and so does whoever
    // dresses the dancer.
    r.upperBody = this;
  }

  /** Shows or hides the bones, the muscles, and whole groups (« skull », « neck »…). */
  show(bones: boolean, muscles: boolean, hidden: readonly string[] = []) {
    for (const m of this.bones) m.visible = bones;
    for (const m of this.muscles) m.visible = muscles;
    for (const g of hidden) for (const m of this.byGroup.get(g) ?? []) m.visible = false;
  }

  /** #183: this dancer's own hold of the joined hands, in place of `GRIP.upright` (any of its fields). The engine's
   * hold is fitted on the bones of a human hand; whoever dresses the dancer with fleshier hands gives here the hold
   * fitted on their volumes (scripts/search_prise_mains.mjs searches it from two hands' descriptions). The leader's
   * layer reads his palm, lift, elbow and shape from his own; the follower's reads her place on his hand, her
   * shape, her elbow and her wrist's range from hers. */
  grip?: Partial<typeof GRIP.upright>;

  /** Poses the head carriage and both arms from the rig's current pose. `partner`: their rig, if any;
   * `follower`: this dancer is the follower; `carriage`: turn the head in a close embrace. */
  update(partner: RigHandle | null, follower: boolean, carriage = true) {
    const r = this.r, G = this.grip ? { ...GRIP.upright, ...this.grip } : GRIP.upright;
    r.chest.updateWorldMatrix(true, false);
    this.headCarrier.rotation.y = carriage && partner?.head
      ? headCarriage(r.head.getWorldPosition(new THREE.Vector3()).distanceTo(partner.head.getWorldPosition(new THREE.Vector3()))) : 0;
    for (const s of ["L", "R"] as ArmSide[]) {
      const armF = r["armF" + s] as THREE.Object3D | undefined;
      if (!armF) continue;
      armF.updateWorldMatrix(true, false);
      const target = armF.localToWorld(HAND.clone()), rigElbow = armF.getWorldPosition(new THREE.Vector3());
      const { hold, normal } = this.palmFacing(s, target, partner, follower);
      // Flexion the rig asks of the elbow: the angle from the line of its arm to its forearm.
      const armU = r["armU" + s] as THREE.Object3D | undefined;
      const folded = !!armU && rigElbow.clone().sub(armU.getWorldPosition(new THREE.Vector3())).angleTo(target.clone().sub(rigElbow)) > ELBOW_MAX;
      // #179: the joined hands held up, the follower's hand fitted into the leader's (the lower candidate
      // `?essai=mainsBasses` keeps the hold of 22 November).
      const upright = hold === "hands" && !essai("mainsBasses");
      const shape = hold === "hands" ? (upright ? (follower ? G.hers : G.his) : follower ? HAND_SHAPES.closes : HAND_SHAPES.offers)
        : hold === "back" ? HAND_SHAPES.flat : HAND_SHAPES.relaxed;
      // #179: the follower's hand takes the leader's, as his is posed (his layer of this image or of the last).
      const his = hold === "hands" && follower ? (partner?.upperBody as UpperBody | undefined)?.hand("L") : undefined;
      const low = () => this.arms[s].arm.getWorldPosition(new THREE.Vector3())
        .add(new THREE.Vector3((s === "L" ? 1 : -1) * G.elbow[0], G.elbow[1], G.elbow[2]).transformDirection(r.chest.matrixWorld));
      let posed: Omit<ArmState, "hold" | "shape">;
      if (his && upright) {
        // Her hand across his palm, in the frame of his hand: her fingers through the gap between his thumb and
        // his index, her palm against his. Her elbow tends behind her hand, a little lower: the wrist stays in range.
        const U = his.fingers, R = his.radial, N = new THREE.Vector3().crossVectors(U, R).normalize();
        const d = U.clone().multiplyScalar(Math.cos(G.across)).addScaledVector(R, Math.sin(G.across));
        const side = new THREE.Vector3().crossVectors(d, N).normalize();
        const n = N.clone().negate().applyAxisAngle(d, G.roll).applyAxisAngle(side, G.pitch);
        d.applyAxisAngle(side, G.pitch);
        const at = his.palm.clone().addScaledVector(R, G.at[0]).addScaledVector(U, G.at[1]).addScaledVector(N, G.at[2]);
        posed = this.take(this.arms[s], at, n, d, at.clone().addScaledVector(d, -0.3).add(new THREE.Vector3(0, -G.drop, 0)), G.wrist);
      } else if (his) {
        // Her fingers go towards his index; her hand may turn on his palm towards the line of her own forearm.
        const facing = his.normal.clone().negate(), forearm = target.clone().sub(rigElbow);
        const natural = forearm.addScaledVector(facing, -forearm.dot(facing));
        const swivel = natural.lengthSq() > 1e-8
          ? Math.max(-GRIP.swivel, Math.min(GRIP.swivel, Math.atan2(new THREE.Vector3().crossVectors(his.radial, natural).dot(facing), his.radial.dot(natural)))) : 0;
        const along = his.radial.clone().applyAxisAngle(facing, swivel);
        posed = this.take(this.arms[s], his.palm.clone().addScaledVector(his.radial, GRIP.shift).addScaledVector(his.normal, GRIP.gap), facing, along, rigElbow);
      } else if (upright && !follower) {
        // The leader's hand: the palm on the rig's point, facing between his right and her; his thumb to the sky, his
        // fingers forwards (a left hand: fingers = thumb's side × palm's normal), raised by `lift`.
        const facing = new THREE.Vector3(...G.palm).transformDirection(r.chest.matrixWorld).setY(0).normalize();
        const sky = new THREE.Vector3(0, 1, 0), lift = G.lift;
        const along = new THREE.Vector3().crossVectors(sky, facing).normalize().multiplyScalar(Math.cos(lift)).addScaledVector(sky, Math.sin(lift));
        posed = this.take(this.arms[s], target, facing, along, low());
      } else if (hold === "free" && folded) {
        // #182: the rig's frame, alone, folds its raised forearm flat on the arm, the hand on the shoulder. No elbow
        // does that: the forearm rises from the rig's elbow, as the frame means it, the palm inwards.
        const out = s === "L" ? 1 : -1, chest = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).transformDirection(r.chest.matrixWorld);
        const rise = chest(out * RAISED.forearm[0], RAISED.forearm[1], RAISED.forearm[2]);
        posed = this.pose(this.arms[s], rigElbow.clone().addScaledVector(rise, HAND.length()), rigElbow, chest(-out * RAISED.palm[0], RAISED.palm[1], RAISED.palm[2]));
      } else posed = this.pose(this.arms[s], target, rigElbow, normal);
      this.state[s] = { ...posed, target, hold, shape };
      this.shape(s, shape);
    }
  }

  /** A hand as it is posed, in the world: centre of the palm, its normal (out of the palm), the fingers'
   * direction and the radial direction (towards the thumb's side). Undefined before the first update. */
  hand(s: ArmSide) {
    const b = this.arms[s];
    if (!this.state[s]) return undefined;
    b.hand.updateWorldMatrix(true, false);
    const normal = b.palmNormal.clone().transformDirection(b.hand.matrixWorld), fingers = b.fingers.clone().transformDirection(b.hand.matrixWorld);
    const radial = s === "L" ? normal.clone().cross(fingers) : fingers.clone().cross(normal);
    return { palm: b.hand.localToWorld(b.palmFromWrist.clone()), normal, fingers, radial: radial.normalize() };
  }

  /** Poses the fingers of a hand. */
  shape(s: ArmSide, shape: HandShape) {
    const ax = this.model.manifest.axes[s], open = shape.thumb[0] - this.model.manifest.measures[s].thumbToIndex;
    for (const f of FINGERS) for (let k = 0; k < 3; k++) {
      const angle = f === "thumb" ? (k ? shape.thumb[k] : open) : shape.fingers[k];
      this.joints.get(`${f}${k + 1}${s}`)!.quaternion.setFromAxisAngle(v(ax.flexion[f][k]), angle);
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
      // #180: the follower's left hand on the leader's right shoulder: the palm faces the shoulder.
      if (follower && s === "L" && partner.chest.localToWorld(v(CADRE_SITES.shoulderR as V3)).distanceTo(target) < 0.03)
        return { hold: "back" as const, normal: partner.chest.localToWorld(v(ARM_JOINTS.shoulderR as V3)).sub(target).normalize() };
      // Joined hands: the leader's palm faces the partner and inwards, upright (her hand lies across it);
      // the follower's faces it.
      const other = partner["armF" + OTHER[s]] as THREE.Object3D | undefined;
      if (other && s === (follower ? "R" : "L")) {
        other.updateWorldMatrix(true, false);
        if (other.localToWorld(HAND.clone()).distanceTo(target) < 0.04) {
          const n = axis(follower ? partner.chest : this.r.chest, -0.5, 0.1, 0.85).normalize();
          return { hold: "hands" as const, normal: follower ? n.negate() : n };
        }
      }
    }
    // Free hand: the palm towards the body.
    return { hold: "free" as const, normal: axis(this.r.chest, -0.7 * sign, 0, -0.7).normalize() };
  }

  /** Two-segment arm with the anatomical lengths: the palm comes on `target`, the elbow bends on the side of
   * the rig's elbow, the radius turns to present the palm towards `normal`. */
  private pose(b: Arm, target: THREE.Vector3, pole: THREE.Vector3, normal: THREE.Vector3): Omit<ArmState, "hold" | "shape"> {
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
      b.hand.quaternion.identity();
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
    return { target, palm, elbow, pronation: phi * b.sign, error: palm.distanceTo(target), wrist: 0 };
  }

  /** The hand takes a given place (#179): the palm's centre on `P`, the palm facing `n`, the fingers along `d`.
   * The wrist comes where that hand needs it, the elbow bends on the side of `pole`, the radius turns as far as
   * it can and the wrist bends for the rest, within `limit` (`GRIP.wrist` unless the hold says otherwise). */
  private take(b: Arm, P: THREE.Vector3, n: THREE.Vector3, d: THREE.Vector3, pole: THREE.Vector3, limit = GRIP.wrist): Omit<ArmState, "hold" | "shape"> {
    const S = b.arm.getWorldPosition(new THREE.Vector3());
    const parent = b.arm.parent!.getWorldQuaternion(new THREE.Quaternion());
    const basis = (x: THREE.Vector3, y: THREE.Vector3) => new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
    const from = (d0: THREE.Vector3, h0: THREE.Vector3, d1: THREE.Vector3, h1: THREE.Vector3) => {
      const hp = h0.clone().addScaledVector(d0, -h0.dot(d0)).normalize(), hq = h1.clone().addScaledVector(d1, -h1.dot(d1)).normalize();
      return new THREE.Quaternion().setFromRotationMatrix(basis(d1, hq).multiply(basis(d0, hp).transpose()));
    };
    // The hand wanted, as a rotation from its rest; the wrist that carries it.
    const hand = from(b.fingers, b.palmNormal, d.clone().normalize(), n), reached = hand.clone(), wristAt = new THREE.Vector3();
    let phi = b.sign * 1.4, elbow = new THREE.Vector3(), bend = 0;
    const turn = new THREE.Quaternion(), fore = new THREE.Quaternion();
    for (let k = 0; k < 6; k++) {
      // The wrist carries the hand as it could be turned at the last pass: the palm stays on its place even
      // when the wrist cannot give the whole turn.
      wristAt.copy(P).sub(b.palmFromWrist.clone().applyQuaternion(reached));
      // The wrist at rest, turned by phi around the pronation axis, in the elbow's frame.
      const q = b.wrist.clone().sub(b.pivot).applyQuaternion(turn.setFromAxisAngle(b.axis, phi)).add(b.pivot);
      const solution = solveArm(S, wristAt, b.length, q.length(), pole);
      elbow = solution.elbow;
      const u = elbow.clone().sub(S).normalize(), f = solution.hand.clone().sub(elbow).normalize();
      const side = pole.clone().sub(S), toHand = solution.hand.clone().sub(S).normalize();
      side.addScaledVector(toHand, -side.dot(toHand));
      const plane = side.lengthSq() > 1e-10 ? side.cross(toHand).normalize() : b.hinge.clone().applyQuaternion(parent);
      const upper = from(b.restArm, b.hinge, u, plane);
      fore.copy(from(q.clone().normalize(), b.hinge, f, plane));
      b.arm.quaternion.copy(parent.clone().invert().multiply(upper));
      b.fore[0].quaternion.copy(upper.clone().invert().multiply(fore));
      // What the hand still has to turn, seen from the forearm: its part around the pronation axis goes to the
      // radius (within its range), the rest to the wrist.
      const rest = fore.clone().invert().multiply(hand), along = new THREE.Vector3(rest.x, rest.y, rest.z).dot(b.axis);
      let angle = 2 * Math.atan2(along, rest.w) * b.sign;
      if (angle < (PRONATION.min + PRONATION.max) / 2 - Math.PI) angle += 2 * Math.PI;
      if (angle > (PRONATION.min + PRONATION.max) / 2 + Math.PI) angle -= 2 * Math.PI;
      phi = b.sign * Math.max(PRONATION.min, Math.min(PRONATION.max, angle));
      for (let i = 1; i <= 4; i++) b.fore[i].quaternion.setFromAxisAngle(b.axis, (phi * i) / 4);
      const wrist = turn.setFromAxisAngle(b.axis, phi).clone().invert().multiply(rest);
      bend = 2 * Math.acos(Math.min(1, Math.abs(wrist.w)));
      if (bend > limit) wrist.copy(new THREE.Quaternion().slerp(wrist, limit / bend));
      b.hand.quaternion.copy(wrist);
      reached.copy(fore).multiply(turn.setFromAxisAngle(b.axis, phi)).multiply(wrist);
    }
    b.arm.updateWorldMatrix(false, true);
    const palm = b.hand.localToWorld(b.palmFromWrist.clone());
    return { target: P, palm, elbow, pronation: phi * b.sign, error: palm.distanceTo(P), wrist: Math.min(bend, limit) };
  }

  dispose() {
    if (this.r.upperBody === this) delete this.r.upperBody;
    this.group.removeFromParent();
    for (const o of this.added) o.removeFromParent();
    for (const m of this.muscles) (m.material as THREE.Material).dispose();
  }
}
