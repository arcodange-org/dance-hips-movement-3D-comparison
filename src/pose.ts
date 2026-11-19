import * as THREE from "three";
import { resetRig, groundDip, type RigHandle } from "./anatomy";
import {
  STYLES, supportOf, travelOffset, corridinhoPath, reversePath, quartTurnStep,
  idaEVoltaStep, idaContra, sortieEnvelope, sortieActive, lockUpperTrunk,
  applyDanceFrame, applyFollowerFrame, swingLift, type MovementKey,
} from "./styles";
import { solveLeg3D } from "./ik";
import { facingSector } from "./directions";
import { sampleSortieGarcon, DEFAULT_SORTIE_CONTRA, type SortieVariant } from "./sortieGarcon";

import { sampleSortieFille, type SortieFilleVariant } from "./sortieFille";

export type Side = "L" | "R";
const SIDES: Side[] = ["L", "R"];
const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
const angleDelta = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export interface PoseOptions {
  styleKey: string; amp: number; travel: number; dir: number;
  plant: boolean; iso: boolean; cadre: boolean;
  quarts: boolean; corridinho: boolean; ida: boolean; temps3: boolean;
  sortie: boolean; embrace: boolean; reverse: boolean; follower: boolean;
  movement: MovementKey; // phase 17 : option exclusive (sortieG/sortieF/sortieGF incluse)
  sortieFilleVariant: SortieFilleVariant; sortieVariant: SortieVariant; sortieContra: number;
}
export const DEFAULT_POSE: PoseOptions = {
  styleKey: "kizomba", amp: 1, travel: 0, dir: 1, plant: true, iso: true, cadre: true,
  quarts: false, corridinho: false, ida: false, temps3: false, sortie: false,
  embrace: false, reverse: false, follower: false, movement: "none",
  sortieFilleVariant: "hook", sortieVariant: "line", sortieContra: DEFAULT_SORTIE_CONTRA,
};
interface Leg {
  length1: number; length2: number; f0: THREE.Vector3; t0: THREE.Vector3;
  hip: THREE.Vector3; rest: THREE.Vector3; sole: THREE.Vector3[];
}
export interface PoseModel {
  legs: Record<Side, Leg>;
  targets: Record<Side, THREE.Vector3>;
  lift: Record<Side, number>;
}
export interface PoseStats {
  beat: number; loadR: number; loadL: number; kneeR: number; kneeL: number;
  roll: number; trunkTilt: number; facing: number; posX: number; posZ: number;
}
export function bindSkeleton(r: RigHandle, skeleton: THREE.Object3D): void {
  skeleton.traverse(o => { if (o.name) r[o.name] = o; });
  for (const s of SIDES) {
    r["hip" + s] = r["HipPivot_" + s];
    r["knee" + s] = r["KneePivot_" + s];
    r["foot" + s] = r["AnklePivot_" + s];
  }
}

/** Cache actual sole vertices in ankle coordinates, including quantized GLB transforms. */
function solePoints(foot: THREE.Object3D): THREE.Vector3[] {
  foot.updateWorldMatrix(true, true);
  const inverse = foot.matrixWorld.clone().invert();
  const points: THREE.Vector3[] = [];
  foot.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.part === "muscle" || mesh.userData.part === "anchor") return;
    const positions = mesh.geometry.attributes.position;
    const matrix = inverse.clone().multiply(mesh.matrixWorld);
    for (let i = 0; i < positions.count; i++)
      points.push(new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(matrix));
  });
  return points;
}
export function createPoseModel(r: RigHandle): PoseModel {
  resetRig(r);
  r.root.updateWorldMatrix(true, true);
  const legs = {} as Record<Side, Leg>;
  for (const s of SIDES) {
    const hip = r["hip" + s] as THREE.Object3D;
    const knee = r["knee" + s] as THREE.Object3D;
    const foot = r["foot" + s] as THREE.Object3D;
    const rest = r.root.parent!.worldToLocal(foot.getWorldPosition(new THREE.Vector3()));
    legs[s] = {
      length1: knee.position.length(), length2: foot.position.length(),
      f0: knee.position.clone().normalize(), t0: foot.position.clone().normalize(),
      hip: hip.position.clone(), rest, sole: solePoints(foot),
    };
  }
  return { legs, targets: { L: new THREE.Vector3(), R: new THREE.Vector3() }, lift: { L: 0, R: 0 } };
}

interface FootPlan { x: number; z: number; yaw: number; lift: number }
// Phase 17 — enveloppe de sortie effective pour ce rig : option exclusive `movement`
// (sortieG/sortieF/sortieGF selon le côté leader/follower), sinon legacy `sortie` (les deux
// danseurs en même temps). Hors embrace : 0.
function sortieEnv(b: number, o: PoseOptions): number {
  if (!o.embrace) return 0;
  if (o.movement !== "none") return sortieActive(o.follower ? "follower" : "leader", o.movement, b);
  return o.sortie ? sortieEnvelope(b) : 0;
}
function bodyPath(b: number, o: PoseOptions) {
  const cp = o.corridinho ? corridinhoPath(b) : { x: 0, z: 0, ry: 0 };
  const p = o.reverse ? reversePath(cp) : cp;
  return { x: p.x + travelOffset(o.travel, o.dir, b) + 0.22 * sortieEnv(b, o) * o.amp, z: p.z, ry: p.ry };
}
function plannedFeet(b: number, o: PoseOptions, m: PoseModel): Record<Side, FootPlan> {
  const feet = {} as Record<Side, FootPlan>;
  if (o.quarts) {
    const start = Math.floor(b / 2) * 2;
    const current = quartTurnStep(b, o.reverse);
    const previous = quartTurnStep(start - 1e-7, o.reverse);
    const t = Math.max(0, Math.min(1, (b - start) / 1.2));
    for (const s of SIDES) {
      const to = s === "L" ? current.footL : current.footR;
      const from = s === "L" ? previous.footL : previous.footR;
      const e = s === current.stepSide ? smooth(t) : 1;
      feet[s] = { x: from.x + (to.x - from.x) * e, z: from.z + (to.z - from.z) * e,
        yaw: from.yaw + angleDelta(from.yaw, to.yaw) * e,
        lift: s === current.stepSide ? swingLift(t, 0.04) : 0 };
    }
    return feet;
  }
  const walking = o.travel > 0 || o.ida || o.corridinho || sortieEnv(b, o) > 0;
  const length = o.ida ? 2 : o.temps3 ? 3 : 1;
  const index = Math.floor(b / length);
  const stepSide = (i: number): Side => o.ida ? idaEVoltaStep(i * length).side : ((i % 2 + 2) % 2 === 0 ? "L" : "R");
  const landing = (s: Side, i: number): FootPlan => {
    const rest = m.legs[s].rest;
    if (o.ida) return { x: rest.x, z: rest.z + idaEVoltaStep(i * length).dir * 0.09, yaw: 0, lift: 0 };
    const p = bodyPath((i + 0.6) * length, o);
    return { x: p.x + rest.x * Math.cos(p.ry) + rest.z * Math.sin(p.ry),
      z: p.z - rest.x * Math.sin(p.ry) + rest.z * Math.cos(p.ry), yaw: p.ry, lift: 0 };
  };
  for (const s of SIDES) {
    if (!walking) {
      feet[s] = { x: m.legs[s].rest.x, z: m.legs[s].rest.z, yaw: 0, lift: 0 };
      continue;
    }
    let last = index - 1;
    while (stepSide(last) !== s) last--;
    const from = landing(s, last);
    if (stepSide(index) !== s) { feet[s] = from; continue; }
    const to = landing(s, index);
    const t = Math.max(0, Math.min(1, (b / length - index) / 0.6));
    const e = smooth(t);
    feet[s] = { x: from.x + (to.x - from.x) * e, z: from.z + (to.z - from.z) * e,
      yaw: from.yaw + angleDelta(from.yaw, to.yaw) * e,
      lift: swingLift(t, o.travel || (o.ida ? 0.5 : 0.4)) };
  }
  return feet;
}

function soleHeight(points: THREE.Vector3[], q: THREE.Quaternion): number {
  let min = Infinity;
  const v = new THREE.Vector3();
  for (const p of points) min = Math.min(min, v.copy(p).applyQuaternion(q).y);
  return Number.isFinite(min) ? -min : 0;
}

/** Markers remain JSX children of pelvis but follow the animated knee frame. */
export function updateKneeMarkers(r: RigHandle): void {
  r.root.updateWorldMatrix(true, true);
  for (const s of SIDES) {
    const marker = r["contactKnee" + s] as THREE.Object3D | undefined;
    if (!marker) continue;
    const knee = r["knee" + s] as THREE.Object3D;
    marker.position.copy(marker.parent!.worldToLocal(knee.localToWorld(new THREE.Vector3(0, 0, 0.05))));
    marker.quaternion.copy(marker.parent!.getWorldQuaternion(new THREE.Quaternion()).invert()
      .multiply(knee.getWorldQuaternion(new THREE.Quaternion())));
  }
}
function kneeAngle(r: RigHandle, s: Side): number {
  const hip = r["hip" + s].getWorldPosition(new THREE.Vector3());
  const knee = r["knee" + s].getWorldPosition(new THREE.Vector3());
  const foot = r["foot" + s].getWorldPosition(new THREE.Vector3());
  return knee.sub(hip).angleTo(foot.sub(r["knee" + s].getWorldPosition(new THREE.Vector3()))) * 180 / Math.PI;
}

/** The single final-pose pipeline used by React and GLB integration tests. */
export function applyPose(r: RigHandle, model: PoseModel, beat: number, options: Partial<PoseOptions>): PoseStats {
  const o = { ...DEFAULT_POSE, ...options };
  const rest = { L: model.legs.L.rest, R: model.legs.R.rest };
  const figure = !o.embrace ? null
    : o.movement === "sortieG" ? sampleSortieGarcon(beat, o.follower, rest, o.sortieVariant, o.sortieContra)
    : o.movement === "sortieF" ? sampleSortieFille(beat, o.follower, rest, o.sortieFilleVariant)
    : null;
  if (figure) beat = figure.beat;
  resetRig(r);
  for (const s of SIDES) r["foot" + s].rotation.set(0, 0, 0);
  // A marka moves the free foot without starting another body's weight oscillation.
  STYLES[o.styleKey].apply(r, figure ? Math.min(beat, 4) : beat, o.amp);
  if (figure) {
    // The on-the-spot isolations need a smaller envelope while feet follow a fixed
    // close-couple path. Preserve their proportions, with a geometric clearance cap.
    const rotation = r.pelvis.rotation;
    const scale = Math.min(1, 0.12 / Math.max(1e-12, Math.abs(rotation.x), Math.abs(rotation.y), Math.abs(rotation.z)));
    rotation.set(rotation.x * scale, rotation.y * scale, rotation.z * scale);
  }
  // The close-couple figure limits extra bounce/flexion; generic deep pulses can put
  // two opposing knees through one another. Leg reach still determines pelvis height.
  const styleY = figure ? Math.max(-0.008, r.root.position.y * 0.25) : r.root.position.y;
  const desiredKnee = { L: r.kneeL.rotation.x, R: r.kneeR.rotation.x };
  const posture = STYLES[o.styleKey].posture;
  const feet = figure?.feet ?? plannedFeet(beat, o, model);
  if (figure) {
    r.root.position.x = figure.root.x; r.root.position.z = figure.root.z;
    r.extraL = 0; r.extraR = 0;
  } else {
    const path = bodyPath(beat, o);
    r.root.position.x += path.x; r.root.position.z += path.z; r.root.rotation.y = path.ry;
  }
  lockUpperTrunk({ spine: r.spine.rotation, chest: r.chest.rotation, head: r.head.rotation }, r.pelvis.rotation, o.iso);
  const se = figure ? 0 : sortieEnv(beat, o);
  if (se > 0) r.chest.rotation.y -= 0.22 * se * o.amp;
  if (figure) r.chest.rotation.y += figure.chestYaw;
  if (o.quarts && !figure) {
    const qs = quartTurnStep(beat, o.reverse);
    r.root.rotation.y = qs.lowerYaw;
    r.chest.rotation.y += qs.upperYaw - qs.lowerYaw;
    r.root.position.x += (feet.L.x + feet.R.x) / 2;
    r.root.position.z += (feet.L.z + feet.R.z) / 2 - (o.reverse ? -0.09 : 0.09);
  }
  r.chest.rotation.x += o.embrace ? Math.min(posture.lean, 0.1) : posture.lean;
  if (o.ida && !figure) {
    const ic = idaContra(beat);
    r.root.rotation.y += ic.lowerYaw;
    r.chest.rotation.y += ic.upperYaw - ic.lowerYaw;
  }
  applyDanceFrame(r, o.cadre);
  if (o.follower) applyFollowerFrame(r, o.cadre);
  const activeIK = !!figure || o.plant || o.travel > 0 || o.quarts || o.ida || o.corridinho;
  const footOrientations = {} as Record<Side, THREE.Quaternion>;
  for (const s of SIDES) {
    const extra = s === "L" ? r.extraL : r.extraR;
    const q = new THREE.Quaternion().setFromAxisAngle(Y, feet[s].yaw)
      .multiply(new THREE.Quaternion().setFromAxisAngle(X, extra));
    footOrientations[s] = q;
    model.lift[s] = feet[s].lift;
    model.targets[s].set(feet[s].x, soleHeight(model.legs[s].sole, q) + feet[s].lift, feet[s].z);
  }
  if (activeIK) {
    r.root.position.y = 0;
    r.root.updateWorldMatrix(true, true);
    const bounds = SIDES.map(s => {
      const leg = model.legs[s];
      const hip = r.root.parent!.worldToLocal(r["hip" + s].getWorldPosition(new THREE.Vector3()));
      const flex = Math.max(0.12, Math.min(figure ? 0.45 : 1.2, posture.knee + desiredKnee[s]));
      const reach2 = leg.length1 ** 2 + leg.length2 ** 2 + 2 * leg.length1 * leg.length2 * Math.cos(flex);
      return { s, hipOffset: hip.sub(r.root.position), reach2 };
    });
    // Composed translations can ask the pelvis to leave both legs' reachable area.
    // Project into the intersection of horizontal reach discs; reserve vertical room
    // so the shins cannot be laid flat through the floor. Projection is continuous.
    for (let iteration = 0; iteration < 24; iteration++) for (const { s, hipOffset, reach2 } of bounds) {
      const centerX = model.targets[s].x - hipOffset.x;
      const centerZ = model.targets[s].z - hipOffset.z;
      const dx = r.root.position.x - centerX, dz = r.root.position.z - centerZ;
      const distance = Math.hypot(dx, dz);
      // 60% horizontal leaves at least 80% vertical reach before the style's
      // level offset, keeping the patella clear in the supported amplitude range.
      const radius = Math.sqrt(reach2) * 0.6;
      if (distance > radius) {
        r.root.position.x = centerX + dx * radius / distance;
        r.root.position.z = centerZ + dz * radius / distance;
      }
    }
    let height = Infinity;
    for (const { s, hipOffset, reach2 } of bounds) {
      const hip = hipOffset.clone().add(r.root.position);
      const target = model.targets[s];
      const horizontal2 = (target.x - hip.x) ** 2 + (target.z - hip.z) ** 2;
      height = Math.min(height, target.y + Math.sqrt(Math.max(0, reach2 - horizontal2)) - hip.y);
    }
    r.root.position.y = height + Math.min(0, styleY);
    r.root.updateWorldMatrix(true, true);
    const skeleton = r["Skeleton"] as THREE.Object3D;
    const outerQ = r.root.parent!.getWorldQuaternion(new THREE.Quaternion());
    for (const s of SIDES) {
      const leg = model.legs[s];
      const target = skeleton.worldToLocal(r.root.parent!.localToWorld(model.targets[s].clone()));
      const solution = solveLeg3D(leg.hip, target, leg.length1, leg.length2, leg.f0, leg.t0);
      r["hip" + s].quaternion.copy(solution.qHip);
      r["knee" + s].rotation.x = solution.beta;
      r["knee" + s].updateWorldMatrix(true, true);
      const foot = r["foot" + s] as THREE.Object3D;
      foot.quaternion.copy(foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert()
        .multiply(outerQ).multiply(footOrientations[s]));
    }
  } else {
    for (const s of SIDES) {
      r["knee" + s].rotation.x += posture.knee;
      r["foot" + s].rotation.x = -(r["hip" + s].rotation.x + r["knee" + s].rotation.x);
    }
    r.root.position.y += groundDip(r["Skeleton"]);
  }
  r.root.updateWorldMatrix(true, true);
  updateKneeMarkers(r);
  const grounded = {} as Record<Side, boolean>;
  for (const s of SIDES) {
    const foot = r["foot" + s] as THREE.Object3D;
    foot.updateWorldMatrix(true, false);
    let lowest = Infinity;
    const v = new THREE.Vector3();
    for (const p of model.legs[s].sole)
      lowest = Math.min(lowest, v.copy(p).applyMatrix4(foot.matrixWorld).y);
    grounded[s] = lowest <= 0.0001;
  }
  const prescribedR = figure?.loadR ?? (supportOf(o.styleKey, r, beat) + 1) / 2;
  const loadR = grounded.R ? (grounded.L ? prescribedR : 1) : 0;
  const loadL = grounded.L ? (grounded.R ? 1 - prescribedR : 1) : 0;
  const chestQ = r.chest.getWorldQuaternion(new THREE.Quaternion());
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(chestQ);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(chestQ);
  const pos = r.root.getWorldPosition(new THREE.Vector3());
  return { beat, loadR, loadL, kneeL: kneeAngle(r, "L"), kneeR: kneeAngle(r, "R"),
    roll: r.pelvis.rotation.z * 180 / Math.PI,
    trunkTilt: Math.acos(Math.max(-1, Math.min(1, up.y))) * 180 / Math.PI,
    facing: facingSector(Math.atan2(forward.x, forward.z)), posX: pos.x, posZ: pos.z };
}
