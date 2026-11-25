import * as THREE from "three";
import { resetRig, groundDip, type RigHandle } from "./anatomy";
import {
  STYLES, supportOf, umDoisOf, travelOffset, travelAllowed, corridinhoPath, reversePath, quartTurnStep,
  idaEVoltaStep, idaContra, sortieEnvelope, sortieActive, lockUpperTrunk,
  applyDanceFrame, applyFollowerFrame, swingLift, type MovementKey,
} from "./styles";
import { solveLeg3D } from "./ik";
import { facingSector } from "./directions";
import { sampleSortieGarcon, DEFAULT_SORTIE_CONTRA, type SortieVariant } from "./sortieGarcon";

import { sampleSortieFille, type SortieFilleVariant } from "./sortieFille";
import { sampleQuartsPaire, QUARTS_PAIR_DZ } from "./quartsPaire";
import { sampleIdaPaire, IDA_PAIR_DZ, IDA_DEFAULT, IDA_GINGA, type IdaVariant } from "./idaPaire";
import { sampleMarchePaire, type MarcheKind } from "./marchePaire";
import { sampleSortieFG } from "./enchainement";
import { sampleInserted, sampleTouched, type Touch } from "./insertion";
import { samplePlacePaire, PLACE_PAIR_DZ } from "./placePaire";
import { SORTIE_GARCON_PAIR_DZ } from "./sortieGarcon";
import { SORTIE_FILLE_PAIR_DZ } from "./sortieFille";
import { placementOffset, placementScale, type CouplePlacement } from "./placement";
import { gaitStep, GAIT } from "./gait";
import { umDoisFoot, umDoisCarry } from "./umDois";

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
  /** #127: the leader's G1 of the sortie fille's hook variant is a virgula (false: the straight step, for tests). */
  sortieVirgula: boolean;
  // Couple placement of the five-action figures; "reference" = validated spacing (tests).
  placement: CouplePlacement | "reference";
  /** #37: pair quarter turns around the leader (docs/spec-quarts-paire.md); off = phase 14 model. */
  quartsPaire: boolean;
  /** #54: pair ida e volta (docs/spec-ida-paire.md): leader forward / follower back, natural walk,
   * neutral quinconce at each return; off = phase 8 model (both dancers mirror the same step). */
  idaPaire: boolean;
  /** #89: ida e volta variant (starting leg, backwards first) and, in its place, a walk in pair. */
  idaVariant: IdaVariant;
  marche: MarcheKind | null;
  /** #90: the sortie fille chained into the end of the sortie garçon (game mode). */
  sortieChain: boolean;
  /** #91: an ida e volta (the leader's G, go and return) inserted at the sortie's position 2 (game mode). */
  sortieInsert: boolean;
  /** #144: touches (a foot's go-and-return before one of the figure's steps, docs/spec-ida-partout.md). */
  touches: Touch[];
  /** #157 (docs/spec-ginga-couple.md): the ginga seen in the couple dance. `sway`: share of the style's
   * lateral hip shift added to the pelvis in every pair figure, with the style's phase driven by the
   * figure's support transfers; `bounce` (m): a small vertical pulse, lowest on each beat of the music. */
  ginga: { sway: number; bounce: number; free?: boolean; eight?: GingaEight } | null;
  /** #167: the pair figure danced just before (its pose options, its length in beats): the phase of the
   * ginga continues from its last transfers instead of starting settled on the support. */
  gingaFrom: (Partial<PoseOptions> & { beats: number }) | null;
  /** #61: in pair on the spot, the couple dances in the neutral quinconce (opt-in, set by the app). */
  placePaire: boolean;
  /** #62: false keeps the on-the-spot motion on the clock's phase (guide mode). */
  onBeat?: boolean;
  /** #85: blend towards another style (`weight` 1 = entirely the other one). */
  styleBlend?: { key: string; weight: number } | null;
  /** #51: in pair figures the upper bodies keep plexus-to-plexus contact (lean towards the partner). */
  plexus: boolean;
  /** #51: 1 = the chest faces the partner while the pelvis follows the feet (contraposition), 0 = the
   * chest stays aligned with the pelvis. */
  contraposition: number;
  /** #69 guide mode: offset (own frame, m) added to the figure's pelvis root, e.g. the residual of a
   * transition being inertialized; `y` is added to the pelvis height found by the leg reach. The feet
   * keep their targets (the leg IK absorbs it). */
  rootOffset: { x: number; z: number; y?: number } | null;
  /** #69 guide mode: residual of the pelvis's own pose (position m, Euler rad) at a boundary being
   * inertialized; added after the figure's bounds and before the leg IK. */
  pelvisOffset: { position: [number, number, number]; rotation: [number, number, number] } | null;
  /** Guide mode (#69, #42): Euler offsets added to the spine, chest and head (9 values), faded residual
   * of the upper trunk between two segments. */
  trunkOffset: number[] | null;
  /** #69: the partner's `rootOffset` (its own frame), for the plexus lean towards the partner. */
  partnerRootOffset: { x: number; z: number } | null;
}
export const DEFAULT_POSE: PoseOptions = {
  styleKey: "kizomba", amp: 1, travel: 0, dir: 1, plant: true, iso: true, cadre: true,
  quarts: false, corridinho: false, ida: false, temps3: false, sortie: false,
  embrace: false, reverse: false, follower: false, movement: "none",
  sortieFilleVariant: "hook", sortieVariant: "line", sortieContra: DEFAULT_SORTIE_CONTRA, sortieVirgula: true,
  placement: "reference", quartsPaire: false, idaPaire: false, idaVariant: IDA_DEFAULT, marche: null, sortieChain: false, sortieInsert: false, touches: [], ginga: null, gingaFrom: null, placePaire: false, plexus: false, contraposition: 1,
  rootOffset: null, partnerRootOffset: null, pelvisOffset: null, trunkOffset: null,
};
/** Plexus-to-plexus contact (#51): chest-marker gap targeted between partners (m) and the largest
 * lean of the upper body towards the partner (rad). */
// pelvisPull 0: pulling the pelvises together (even down to 45 cm apart) or lowering the couple
// together makes the leg bones of the partners cross (measured on the GLB, six styles): only the
// upper body leans towards the partner.
/** #51, revised (owner, 20 Nov.: « la contraposition et l'inclinaison vers l'avant en permanence ont été
 * mal interprétées (on dirait des lutteurs de sumo et non des danseurs parfois) ») : the upper body leans
 * at most `maxLean` towards the partner, and only in a close couple: the lean fades out between `open`
 * and `open + fade` of missing distance (an open position does not chase the plexus contact). The chest
 * turns towards the partner by at most `facing` (rad). The lean stops once the trunk (pelvis → head, the
 * style's own posture included) is `maxTrunk` (rad) from the vertical. #203: `gap` 0.05 (was 0.08): with the knees
 * bent the couple stands 8 cm further apart (`COUPLE_DZ`), and the chests aim 3 cm closer to keep their contact
 * (the owner's 6 cm) with a trunk still under 8° from the vertical. */
export const PLEXUS = { gap: 0.05, maxLean: 0.08, maxTrunk: 0.13, open: 0.06, fade: 0.08, facing: 0.3, marker: 0.16, pelvisDistance: 0.34, pelvisPull: 0 };
interface Leg {
  length1: number; length2: number; f0: THREE.Vector3; t0: THREE.Vector3;
  hip: THREE.Vector3; rest: THREE.Vector3; sole: THREE.Vector3[];
  /** Native toe-out of the GLB foot: yaw of the heel → ball axis in ankle coordinates (+x = left). */
  toeOut: number;
  /** Hip joint x in the rig's outer frame at rest: "feet under the hips" stance. */
  hipX: number;
  /** #49: sole points a rolling foot pivots on (ankle coordinates): ball of the foot and heel. */
  ball: THREE.Vector3; heel: THREE.Vector3;
}
export interface PoseModel {
  legs: Record<Side, Leg>;
  targets: Record<Side, THREE.Vector3>;
  lift: Record<Side, number>;
}
export interface PoseStats {
  beat: number; loadR: number; loadL: number; kneeR: number; kneeL: number;
  roll: number; trunkTilt: number; facing: number; posX: number; posZ: number;
  /** Spine, chest and head Euler angles where `trunkOffset` adds to them (guide mode residuals). */
  trunk: number[];
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
/** #49: ball of the foot (forefoot band 15–33 % from the toe) and heel (rear 12 %) contact points,
 * centroids of the lowest sole points of each band along the functional axis. */
function rollPoints(sole: THREE.Vector3[], toeOut: number): { ball: THREE.Vector3; heel: THREE.Vector3 } {
  const axis = new THREE.Vector3(Math.sin(toeOut), 0, Math.cos(toeOut));
  const along = sole.map(p => p.dot(axis)), toe = Math.max(...along), back = Math.min(...along), length = toe - back;
  const low = Math.min(...sole.map(p => p.y)) + 0.012;
  const centroid = (from: number, to: number) => {
    const band = sole.filter((p, i) => p.y <= low && along[i] >= back + from * length && along[i] <= back + to * length);
    const c = new THREE.Vector3();
    for (const p of band) c.add(p);
    return band.length ? c.divideScalar(band.length) : new THREE.Vector3(0, low, back + (from + to) / 2 * length);
  };
  return { ball: centroid(0.67, 0.85), heel: centroid(0, 0.12) };
}
/** Yaw of the heel → ball (forefoot, 15–33 % from the toe) axis of a sole, from +z toward +x. */
function footAxisYaw(sole: THREE.Vector3[]): number {
  const zs = sole.map(p => p.z), toe = Math.max(...zs), heel = Math.min(...zs), length = toe - heel;
  const centre = (from: number, to: number) => {
    const band = sole.filter(p => p.z <= toe - from * length && p.z >= toe - to * length);
    return { x: band.reduce((a, p) => a + p.x, 0) / band.length, z: band.reduce((a, p) => a + p.z, 0) / band.length };
  };
  const heelCentre = centre(0.8, 1), ball = centre(0.15, 0.33);
  return Math.atan2(ball.x - heelCentre.x, ball.z - heelCentre.z);
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
    const sole = solePoints(foot);
    legs[s] = {
      length1: knee.position.length(), length2: foot.position.length(),
      f0: knee.position.clone().normalize(), t0: foot.position.clone().normalize(),
      hip: hip.position.clone(), rest, sole, toeOut: footAxisYaw(sole),
      hipX: r.root.parent!.worldToLocal(hip.getWorldPosition(new THREE.Vector3())).x,
      ball: new THREE.Vector3(), heel: new THREE.Vector3(),
    };
    Object.assign(legs[s], rollPoints(sole, legs[s].toeOut));
  }
  return { legs, targets: { L: new THREE.Vector3(), R: new THREE.Vector3() }, lift: { L: 0, R: 0 } };
}

interface FootPlan { x: number; z: number; yaw: number; lift: number;
  /** #49: rolling foot — pitch (+ = heel up) and the sole point kept fixed on the floor. */
  pitch?: number; pivot?: "ball" | "heel" | null;
  /** #73: share of the pitched ankle's rise that may hold the pelvis up (rolled walk outside the figures). */
  bear?: number }
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
/** Horizontal move of the ankle when a foot pitched by `pitch` keeps one sole point where it is when flat
 * (the same pivot rule `applyPose` applies to a rolling foot, #49). */
function pivotShift(leg: PoseModel["legs"][Side], yaw: number, pitch: number, pivot: "ball" | "heel"): { x: number; z: number } {
  const flat = new THREE.Quaternion().setFromAxisAngle(Y, yaw);
  const axis = new THREE.Vector3(Math.cos(leg.toeOut), 0, -Math.sin(leg.toeOut));
  const q = flat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis, pitch));
  const shift = leg[pivot].clone().applyQuaternion(flat).sub(leg[pivot].clone().applyQuaternion(q));
  return { x: shift.x, z: shift.z };
}
/** #73: the rolled walk outside the figures (corridinho). Calibrated on the GLB against the flat walk it
 * replaces, so that the pelvis moves no more abruptly (R34, docs/spec-marche-naturelle.md):
 * `flight`: share of the beat the step takes, push-off and landing included (the flat step took 0.6);
 * `bear`, `bearBack`: share of the heel's rise at push-off that holds the pelvis up, for a step forwards and
 * for a step backwards; it fades as the foot flies, and a foot in the air or landing bends its knee
 * instead of lifting the pelvis. */
export const ROLLED_WALK = { flight: 0.75, bear: 0.75, bearBack: 1 };
/** #196: the feet of the « 1 2 » (src/umDois.ts): each at its rest place, moved aside by its share of `ecart`;
 * a foot whose heel is up (left behind, closing, marking) stands on its ball, and its leg reaches from there. */
/** #196, #203: softness (m) of the smooth minimum that hands the pelvis height of the « 1 2 » from one bound to the
 * other. 0.007 with nearly straight legs; with the minimum flexion of R43 the far leg reaches less and binds sooner,
 * and the pelvis dipped as the stepping foot landed (6.8 m/s² for the kizomba): it now lowers over the whole step. */
const UM_DOIS_SOFT = 0.025;
function umDoisFeet(clock: number, ecart: number, m: PoseModel): Record<Side, FootPlan> {
  const feet = {} as Record<Side, FootPlan>;
  for (const s of SIDES) {
    const foot = umDoisFoot(s, clock), rest = m.legs[s].rest;
    feet[s] = { x: rest.x + ecart * foot.place, z: rest.z, yaw: 0, lift: foot.lift, pitch: foot.pitch, pivot: foot.pitch > 0 ? "ball" : null, bear: 1 };
  }
  return feet;
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
  // #73 (elected 2026-11-21): the walk outside the figures, the corridinho, rolls the foot like the
  // figures do (src/gait.ts): the heel rises, the leg passes, the foot lands heel first, or on the ball
  // when it goes backwards. Both feet then carry a pitch (0 on the support foot) and the gait replaces
  // the style's own foot rock, an on-the-spot device. Elsewhere the feet do not travel: the lateral
  // « Déplacement » sways the body between two feet that mark time where they are, and the solo ida e
  // volta and the historical sorties keep the flat step the oracle describes (docs/spec-phase18-oracle.md).
  const rolls = !!o.corridinho && !o.ida;
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
    if (stepSide(index) !== s) { feet[s] = rolls ? { ...from, pitch: 0, pivot: null } : from; continue; }
    const to = landing(s, index);
    const t = Math.max(0, Math.min(1, (b / length - index) / (rolls ? ROLLED_WALK.flight : 0.6)));
    if (!rolls) {
      const e = smooth(t);
      feet[s] = { x: from.x + (to.x - from.x) * e, z: from.z + (to.z - from.z) * e,
        yaw: from.yaw + angleDelta(from.yaw, to.yaw) * e,
        lift: swingLift(t, o.travel || (o.ida ? 0.5 : 0.4)) };
      continue;
    }
    const travel = { x: to.x - from.x, z: to.z - from.z };
    const roll = gaitStep(t, travel, to.yaw);
    // The two ends of the flight: toe-off (heel up, on the ball) and touch-down (heel first when the step
    // goes forwards, ball first otherwise).
    const off = gaitStep(GAIT.push, travel, to.yaw), on = gaitStep(GAIT.land, travel, to.yaw);
    // R34: the foot leaves the floor and reaches it without a sudden start or stop. On these long steps
    // the pelvis height follows the legs' reach: a foot that left at full speed pulled it up at once.
    const e = smooth(roll.progress);
    feet[s] = { x: from.x + travel.x * e, z: from.z + travel.z * e,
      yaw: from.yaw + angleDelta(from.yaw, to.yaw) * e,
      lift: roll.lift, pitch: roll.pitch, pivot: roll.pivot, bear: (on.pivot === "heel" ? ROLLED_WALK.bear : ROLLED_WALK.bearBack) * (1 - e) };
    // R34 (no jerk): at toe-off the ankle is where the push-off left it (the foot pitched about its
    // ball), and it must arrive where the landing takes it (pitched about the heel or the ball). In the
    // air there is no pivot: carry the ankle from the first of these offsets to the second.
    if (t > 0 && t < 1 && roll.pivot === null) {
      const leg = m.legs[s];
      const a = pivotShift(leg, from.yaw, off.pitch, "ball"), c = on.pivot ? pivotShift(leg, to.yaw, on.pitch, on.pivot) : { x: 0, z: 0 };
      feet[s].x += a.x + (c.x - a.x) * e; feet[s].z += a.z + (c.z - a.z) * e;
    }
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

/** #51: tilt the spine towards the partner until this dancer's plexus marker reaches the middle of the
 * couple (minus half the contact gap). Both partners do the same, so their plexus markers meet. */
function leanTowards(r: RigHandle, partner: { x: number; z: number }): void {
  const outer = r.root.parent!;
  const spine = r.spine as THREE.Object3D, chest = r.chest as THREE.Object3D;
  const marker = (): THREE.Vector3 => {
    r.root.updateWorldMatrix(true, true);
    const forward = new THREE.Vector3(0, 0, PLEXUS.marker).applyQuaternion(chest.getWorldQuaternion(new THREE.Quaternion()));
    return outer.worldToLocal(chest.getWorldPosition(new THREE.Vector3()).add(forward));
  };
  let leaned = 0, fadeOut = 1;
  for (let iteration = 0; iteration < 2; iteration++) {
    const own = r.root.position, plexus = marker();
    const dx = partner.x - own.x, dz = partner.z - own.z, distance = Math.hypot(dx, dz);
    if (distance < 1e-6) return;
    const ux = dx / distance, uz = dz / distance;
    // Where this plexus should be: half-way between the pelvises, half the contact gap short of it.
    const reach = distance / 2 - PLEXUS.gap / 2;
    const ahead = (plexus.x - own.x) * ux + (plexus.z - own.z) * uz;
    const missing = reach - ahead;
    if (missing <= 1e-4) return;
    if (iteration === 0) {
      const t = Math.max(0, Math.min(1, (missing - PLEXUS.open) / PLEXUS.fade)); fadeOut = 1 - t * t * (3 - 2 * t);
      // Style posture first: a style already leaning forward (suave) keeps less room for the lean.
      const trunk = r.head.getWorldPosition(new THREE.Vector3()).sub(r.pelvis.getWorldPosition(new THREE.Vector3()));
      fadeOut = Math.min(fadeOut, Math.max(0, PLEXUS.maxTrunk - trunk.angleTo(new THREE.Vector3(0, 1, 0))) / PLEXUS.maxLean);
    }
    const pivot = outer.worldToLocal(spine.getWorldPosition(new THREE.Vector3()));
    const arm = Math.max(0.1, plexus.distanceTo(pivot));
    const angle = Math.min(PLEXUS.maxLean * fadeOut - leaned, Math.asin(Math.min(1, missing / arm)));
    if (angle <= 1e-6) return;
    leaned += angle;
    // Rotate the spine in world space about (up × towards-partner), expressed in the outer frame.
    const axisLocal = new THREE.Vector3(uz, 0, -ux);
    const outerQ = outer.getWorldQuaternion(new THREE.Quaternion());
    const axis = axisLocal.applyQuaternion(outerQ).normalize();
    const tilt = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    const parentQ = spine.parent!.getWorldQuaternion(new THREE.Quaternion());
    const world = tilt.multiply(spine.getWorldQuaternion(new THREE.Quaternion()));
    spine.quaternion.copy(parentQ.invert().multiply(world));
  }
}

/** #85: the local transforms a style sets (positions, rotations, knee extras), to blend two styles. */
const STYLE_NODES = ["root", "pelvis", "spine", "lumbar", "thoracic", "chest", "head", "hipL", "hipR", "kneeL", "kneeR"] as const;
function styleState(r: RigHandle) {
  return { nodes: STYLE_NODES.map(n => [r[n].position.clone(), r[n].rotation.clone()] as const), extraL: r.extraL, extraR: r.extraR };
}
function mixStyleState(r: RigHandle, a: ReturnType<typeof styleState>, b: ReturnType<typeof styleState>, w: number) {
  STYLE_NODES.forEach((n, k) => {
    const [pa, ra] = a.nodes[k], [pb, rb] = b.nodes[k];
    r[n].position.lerpVectors(pa, pb, w);
    r[n].rotation.set(ra.x + (rb.x - ra.x) * w, ra.y + (rb.y - ra.y) * w, ra.z + (rb.z - ra.z) * w);
  });
  r.extraL = a.extraL + (b.extraL - a.extraL) * w; r.extraR = a.extraR + (b.extraR - a.extraR) * w;
}

/** The single final-pose pipeline used by React and GLB integration tests. */
/** #62 (R21, owner: « les beats correspondent aux transferts de poids ») : the styles put full weight on
 * a foot at phase x,5 (support = −S2). On the spot (solo, in pair, with lateral travel or temps3) the
 * motion runs half a beat behind the clock, so that the weight arrives on the music's beat. The figures
 * keep their own timing (aligning them is the rest of #62), and so do the legacy combined sortie
 * (oracle) and the guide mode's basic step, which must join the figures. */
export const ON_BEAT_SHIFT = 0.5;
/** #203 (rule R43, 24 Nov. 2026: in every dance no leg straightens, both knees always keep some flexion, so the
 * dancers stand a little lower; docs/spec-flexion-minimale.md): the least flexion (rad) a leg that sets the pelvis
 * height may ask for: 30°, chosen by the owner on film on 24 Nov. 2026 (vote round 13, against 7°, the former floor,
 * and 20°). `?flexion=<degrés>` (7 to 40) shows another minimum. */
export const KNEE_FLOOR_ELECTED = 30;
export const KNEE_FLOOR = { rad: KNEE_FLOOR_ELECTED * Math.PI / 180 };
export const setKneeFloor = (degrees: string | null | undefined) => {
  const d = Number(degrees);
  KNEE_FLOOR.rad = (degrees && Number.isFinite(d) && d >= 7 && d <= 40 ? d : KNEE_FLOOR_ELECTED) * Math.PI / 180;
};
// In node (measures of another minimum with the existing tests), the environment variable FLEXION, which the tests
// never set; in the browser, the address (`?flexion=`, src/App.tsx).
setKneeFloor((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.FLEXION);
/** #203: the floor is reached smoothly (softplus of width `KNEE_FLOOR_SOFT`, rad): a knee that would straighten past
 * it slows down as it nears it instead of stopping dead, and the pelvis it holds does not jerk (the kompa alone, whose
 * straighter leg came down to 23°, and the walks). Above the floor by twice the width, the flexion is as asked. */
export const KNEE_FLOOR_SOFT = 0.1;
const kneeFloor = (flex: number) => KNEE_FLOOR.rad + KNEE_FLOOR_SOFT * Math.log1p(Math.exp((flex - KNEE_FLOOR.rad) / KNEE_FLOOR_SOFT));
export const onBeatShift = (o: { movement: MovementKey; sortie?: boolean; embrace?: boolean; onBeat?: boolean }): number =>
  // Solo, a selected sortie is the dance on the spot (the sorties exist only in pair). The guide mode
  // (`onBeat: false`) keeps the clock's phase: its basic step must join the figures, which keep theirs.
  o.onBeat !== false && (o.movement === "none" || o.movement === "temps3" || !o.embrace && o.movement.startsWith("sortie")) && !o.sortie ? ON_BEAT_SHIFT : 0;

/** #157: phase of the style's hip pattern along a figure, read on the leader's own loads (R13: « le ginga
 * déclenché à chaque alternance droite/gauche »). The style puts the full weight on the left foot at
 * phase 0.5 and on the right at 1.5: on a support, the phase is that support's plus the share of the
 * weight already gone to the other foot; a completed transfer moves it on by one beat. A rock that comes
 * back (a touch) takes the hips part of the way and back. The figures transfer the weight in a fifth of a
 * beat: the phase is averaged over `GINGA_SWING` beats on each side, so that the hips swing like a
 * pendulum around each transfer instead of snapping across. #167: half a beat on each side (a quarter
 * before), so that the passage takes the whole interval between two supports (the hips waited on the
 * support, then crossed twice as suddenly as a pendulum), and the table looks back on the loads of the
 * figure danced before (`before`, `GINGA_BEFORE`): the swing goes on from one figure to the next.
 *
 * A figure may be changed at a junction (`gingaJunctions`, beats: the sortie fille chained at its
 * position 3) and must keep its past: before a junction the mean never looks beyond it. After it the
 * look-ahead grows back at `GINGA_REJOIN` beat per beat, and the window keeps its far end until it has
 * its full width again: the phase stays continuous and unhurried even when the changed figure shifts the
 * weight at once (the chain's bridge, an eighth of a beat). The figure and its changed form then share
 * the same phase up to the junction. Tabulated once per figure (`key`). */
const GINGA_STEP = 1 / 64, GINGA_BEATS = 12, GINGA_SETTLED = 0.03;
/** Vertical room (m, negative) a pair figure leaves by default under the pelvis (`dip`). */
const GINGA_ROOM = -0.008;
/** Beats over which the ginga fades out when a touch starts, and back in when it ends. */
const GINGA_TOUCH_FADE = 0.25;
const smoothstep = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
export const GINGA_SWING = 0.5;
/** Beats of look-ahead regained per beat after a junction. */
export const GINGA_REJOIN = 0.5;
/** #159 (prototype, docs/spec-ginga-huit.md): the « 8 » of the hips. In #157 the pelvis turns (roll, yaw)
 * in time with its lateral shift, so each hip goes and returns on a line. Here the roll and the yaw are
 * read later in the cycle (`rollLag`, `yawLag`, beats), on a phase that keeps moving between two transfers
 * (`GINGA_WIDE`), and scaled by `turn`: each hip goes round. `depth` (m) moves the pelvis forward and back
 * once per transfer (`depthLag`, beats), `bounceLag` (beats) delays the bounce after the beat. `round`
 * (0 to 1) lets the lateral shift follow that moving phase too: the hips then never wait on the support. */
export interface GingaEight { turn: number; rollLag: number; yawLag: number; depth: number; depthLag: number; bounceLag: number; round?: number;
  /** #159 (prototype, vote of 22 Nov.: the « 8 » led by the knees' overlapping alternation, atlas rule B
   * « genoux chevauchés »). The knees are the input: the free leg's knee bends while the supporting one
   * straightens, `base` + `swing` (rad) at most, the two curves overlapping (both bent by `base` +
   * `swing`/2 at the centre), `lag` beats after the wide phase. Each hip then sits where its own leg puts
   * it: the pelvis height is their mean and its roll their difference, instead of the pelvis rising as
   * high as the straighter leg allows. */
  knees?: { base: number; swing: number; lag: number } }
/** Beats on each side over which the phase of the « 8 » is averaged: it then moves all along the beat. */
export const GINGA_WIDE = 0.5;
/** #167: beats of the figure danced before that the phase table looks back on, so that the hips' swing
 * continues from one figure to the next instead of starting settled on the support. */
const GINGA_BEFORE = 1;
const gingaTables = new Map<string, Float32Array | null>();
export function gingaPhase(key: string, leader: (beat: number) => { loadR?: number; gingaJunctions?: readonly number[] } | null, beat: number, swing = GINGA_SWING,
  before: ((beat: number) => { loadR?: number } | null) | null = null): number | null {
  key = `${key}|${swing}`;
  let table = gingaTables.get(key);
  if (table === undefined) {
    // The table starts GINGA_BEFORE beats before the figure: `before` gives there the loads of the figure
    // danced before (#159, negative beats); without it the figure's first loads are held (the phase then
    // starts settled, as in #157). `leader` is only asked for the figure's own beats.
    const start = leader(0), past = Math.round(GINGA_BEFORE / GINGA_STEP), n = Math.round(GINGA_BEATS / GINGA_STEP) + past;
    const loadAt = (b: number) => (b < 0 ? (before ? before(b)?.loadR : start?.loadR) : leader(b)?.loadR);
    const first = loadAt(-GINGA_BEFORE) ?? start?.loadR;
    if (first === undefined || start?.loadR === undefined) table = null;
    else {
      const raw = new Float32Array(n + 1);
      let right = first >= 0.5, base = right ? 1.5 : 0.5, load = first;
      for (let k = 0; k <= n; k++) {
        load = loadAt((k - past) * GINGA_STEP) ?? load;
        const gone = right ? 1 - load : load;
        if (gone >= 1 - GINGA_SETTLED) { right = !right; base += 1; raw[k] = base - (1 - gone); }
        else raw[k] = base + gone;
      }
      // Running mean over ±GINGA_SWING beats (the ends repeat the first and the last value). The window
      // never looks beyond the next junction, and looks ahead no further than the distance from the last.
      const half = Math.round(swing / GINGA_STEP), sums = new Float64Array(n + 2);
      for (let k = 0; k <= n; k++) sums[k + 1] = sums[k] + raw[k];
      const sumTo = (k: number) => (k < 0 ? (k + 1) * raw[0] : k > n ? sums[n + 1] + (k - n) * raw[n] : sums[k + 1]);
      const junctions = (start?.gingaJunctions ?? []).map(j => Math.round(j / GINGA_STEP) + past);
      table = new Float32Array(n + 1);
      for (let k = 0; k <= n; k++) {
        let ahead = half, from = k - half;
        for (const j of junctions) ahead = Math.min(ahead, j >= k ? j - k : Math.floor((k - j) * GINGA_REJOIN));
        for (const j of junctions) if (j < k) from = Math.min(from, Math.max(j - half, k + ahead - 2 * half));
        table[k] = (sumTo(k + ahead) - sumTo(from - 1)) / (k + ahead - from + 1);
      }
    }
    gingaTables.set(key, table);
  }
  if (!table) return null;
  const x = Math.max(0, Math.min(table.length - 1, ((Number.isFinite(beat) ? beat : 0) + GINGA_BEFORE) / GINGA_STEP)), k = Math.min(table.length - 2, Math.floor(x));
  return table[k] + (table[k + 1] - table[k]) * (x - k);
}

export function applyPose(r: RigHandle, model: PoseModel, clockBeat: number, options: Partial<PoseOptions>): PoseStats {
  // #196: the figure « Sur place » of the kizomba and of the semba is the basic step without the « 1 2 ».
  const surPlace = options.movement === "surPlace";
  const o = { ...DEFAULT_POSE, ...options, ...(surPlace ? { movement: "none" as const } : {}) };
  // + 24 beats (a multiple of every on-the-spot period: styles 4, temps3 12, the semba prototypes 8, #162)
  // keeps the motion beat positive for the styles' `b % n` without changing the pose.
  const shift = onBeatShift(o);
  let beat = shift ? clockBeat - shift + 24 : clockBeat;
  const rest = { L: model.legs.L.rest, R: model.legs.R.rest };
  // Owner request (19 Nov.): in the five-action figures the feet point forward along the knees'
  // axis (the GLB foot is natively turned out by ≈25°), and the initial/neutral stance has the
  // feet under the hips; each foot joins the validated path on its first step.
  const stance = (model.legs.L.hipX - rest.L.x + rest.R.x - model.legs.R.hipX) / 2;
  const hostOf = (o: Required<Omit<PoseOptions, never>> | typeof DEFAULT_POSE) => (beat: number, follower: boolean) => !o.embrace ? null
    : o.movement === "sortieG" ? sampleSortieGarcon(beat, follower, rest, o.sortieVariant, o.sortieContra, placementOffset(o.placement, o.amp), placementScale(o.amp), stance)
    : o.movement === "sortieF" && o.sortieChain ? sampleSortieFG(beat, follower, rest, placementOffset(o.placement, o.amp), placementScale(o.amp), stance, o.sortieContra)
    : o.movement === "sortieF" ? sampleSortieFille(beat, follower, rest, o.sortieFilleVariant, placementOffset(o.placement, o.amp), placementScale(o.amp), stance, o.sortieVirgula)
    // #37: in pair the couple turns rigidly around a centre on the leader's side (docs/spec-quarts-paire.md).
    : o.movement === "quarts" && o.quartsPaire ? sampleQuartsPaire(beat, follower, rest, placementOffset(o.placement, o.amp), stance)
    // #54: in pair the leader steps forward while the follower steps back (docs/spec-ida-paire.md).
    // #89: the game mode's walks share the ida's couple and lanes.
    : o.movement === "ida" && o.idaPaire && o.marche ? sampleMarchePaire(beat, follower, rest, placementOffset(o.placement, o.amp), stance, o.marche)
    : o.movement === "ida" && o.idaPaire ? sampleIdaPaire(beat, follower, rest, placementOffset(o.placement, o.amp), stance, o.idaVariant)
    // #61, #71: in pair without a figure the couple stays in the neutral quinconce (temps3 without
    // travel is on the spot); the pair corridinho is the validated couple turn of #37, a circle on the
    // floor in 16 beats (docs/spec-paire-sans-figure.md).
    : (o.movement === "none" || o.movement === "temps3") && o.placePaire ? samplePlacePaire(beat, follower, rest, placementOffset(o.placement, o.amp), stance,
      { travel: travelAllowed(o.styleKey) ? o.travel : 0, dir: o.dir, length: o.movement === "temps3" ? 3 : 1 })
    : o.movement === "corridinho" && o.placePaire ? sampleQuartsPaire(beat, follower, rest, placementOffset(o.placement, o.amp), stance)
    : null;
  const hostFigure = hostOf(o);
  // #144: touches go on top of whichever pair figure is danced; #91's inserted ida is their first case.
  const sampleFigure = (follower: boolean) => !o.embrace ? null
    : (o.movement === "sortieG" || o.movement === "sortieF") && o.sortieInsert ? sampleInserted(o.movement, beat, follower, rest, placementOffset(o.placement, o.amp), placementScale(o.amp), stance, o.sortieContra)
    : o.touches.length && hostFigure(0, follower) ? sampleTouched(b => hostFigure(b, follower)!, o.touches, beat, follower, rest, placementOffset(o.placement, o.amp), stance)
    : hostFigure(beat, follower);
  const figure = sampleFigure(o.follower);
  // #51: the partner's pelvis, in this dancer's outer frame (partners face each other 2·dz apart).
  const pairDz = o.movement === "sortieG" ? SORTIE_GARCON_PAIR_DZ : o.movement === "sortieF" ? SORTIE_FILLE_PAIR_DZ
    : o.movement === "ida" ? IDA_PAIR_DZ
    : o.movement === "none" || o.movement === "temps3" ? PLACE_PAIR_DZ : QUARTS_PAIR_DZ;
  const partnerFigure = figure && o.plexus ? sampleFigure(!o.follower) : null;
  const partnerOffset = o.partnerRootOffset ?? { x: 0, z: 0 };
  const partnerRoot = partnerFigure ? { x: -(partnerFigure.root.x + partnerOffset.x), z: 2 * pairDz - (partnerFigure.root.z + partnerOffset.z) } : null;
  // Quarter turns loop: the style keeps dancing; the five-action figures hold after their marka.
  const cyclic = !!figure && "cyclic" in figure;
  if (figure) {
    beat = figure.beat;
    for (const s of SIDES) figure.feet[s] = { ...figure.feet[s], yaw: figure.feet[s].yaw - model.legs[s].toeOut };
  }
  // #157: room a figure leaves for the ginga at this beat (sway and bounce, 1 by default): a figure
  // declares its tight spots (`gingaRoom`), and a touch (#144), calibrated to the centimetre on the pose
  // of the figure, is danced without it (it fades over a quarter of a beat at each end).
  const gingaRoom = { sway: 1, bounce: 1 };
  // The most ginga the figure leaves room for (the sorties declare it): the setting is held to it.
  // #163: the cap holds where the figure is tight (the start and the end of the sorties); in between the
  // figure declares the room it leaves above the cap (`gingaCapRoom`, 0 to 1) and the setting rises towards
  // its own value. `free` (calibration only) ignores the caps, to measure where that room is.
  const capped = figure as { gingaCap?: { sway: number; bounce: number }; gingaCapRoom?: { sway: number; bounce: number } } | null;
  const gingaCap = o.ginga?.free ? undefined : capped?.gingaCap, capRoom = capped?.gingaCapRoom ?? { sway: 0, bounce: 0 };
  const held = (value: number, cap: number | undefined, room: number) => (cap === undefined || value <= cap ? value : cap + (value - cap) * Math.max(0, Math.min(1, room)));
  const gingaSet = o.ginga ? { sway: held(o.ginga.sway, gingaCap?.sway, capRoom.sway), bounce: held(o.ginga.bounce, gingaCap?.bounce, capRoom.bounce) } : null;
  if (figure && o.ginga) {
    const declared = (figure as { gingaRoom?: { sway: number; bounce: number } }).gingaRoom;
    const touch = (figure as { inserted?: boolean; touchBeat?: number });
    const t = touch.inserted ? touch.touchBeat ?? 0 : null;
    const outside = t === null ? 1 : 1 - smoothstep(t / GINGA_TOUCH_FADE) * (1 - smoothstep((t - (2 - GINGA_TOUCH_FADE)) / GINGA_TOUCH_FADE));
    gingaRoom.sway = (declared?.sway ?? 1) * outside; gingaRoom.bounce = (declared?.bounce ?? 1) * outside;
  }
  // #157: the ginga in every pair figure, as in the ida e volta (#42): the style's phase follows the
  // leader's transfers, the follower dances it mirrored (her own phase would cross the thighs), and a share
  // of the style's lateral hip shift goes to the pelvis. The basic step keeps its own sway; a figure that
  // gives its phase (the ida e volta) keeps its calibration.
  if (figure && o.ginga && o.ginga.sway > 0 && !("gingaBeat" in figure) && o.movement !== "none" && o.movement !== "temps3") {
    const own = [o.movement, o.sortieChain, o.marche, o.sortieVariant, o.sortieFilleVariant, o.sortieVirgula, o.quartsPaire, o.placement, o.amp, stance.toFixed(4)].join("|");
    // #167: the loads before the figure are those of the figure danced before: the swing goes on. Only
    // after a figure whose swing is this same phase: the ida e volta gives its own (`gingaBeat`, #42), and
    // a phase read on its loads would not continue what it showed (measured on the GLB: femurs meet at the
    // start of a chained sortie fille danced after it). After it the figure starts settled, as before.
    const before0 = o.gingaFrom ? hostOf({ ...o, ...o.gingaFrom, touches: [] }) : null, last = before0?.(0, false);
    const from = last && !("gingaBeat" in last) ? o.gingaFrom : null, previous = from ? before0 : null;
    const loads = (b: number) => hostFigure(b, false) as { loadR?: number; gingaJunctions?: readonly number[] } | null;
    const before = previous ? (b: number) => previous(from!.beats + b, false) as { loadR?: number } | null : null;
    const key = (from ? [from.movement, from.sortieChain, from.marche, from.idaVariant ? JSON.stringify(from.idaVariant) : "", from.beats].join("|") + ">" : "") + own;
    const narrow = gingaPhase(key, loads, beat, GINGA_SWING, before);
    // #159 (prototype): the « 8 » reads its roll, yaw and depth on a phase that moves all along the beat.
    const wide = o.ginga.eight ? gingaPhase(key, loads, beat, GINGA_WIDE, before) : null;
    const phase = narrow !== null && wide !== null ? narrow + (wide - narrow) * (o.ginga.eight?.round ?? 0) : narrow;
    if (phase !== null) Object.assign(figure, { gingaBeat: phase, gingaAmp: o.follower ? IDA_GINGA.follower : IDA_GINGA.leader, gingaOwn: false,
      gingaWide: wide ?? undefined,
      // The style's hip shift grows with the amplitude: beyond 1 the share shrinks, the sway stays.
      gingaSway: (o.follower ? -1 : 1) * gingaSet!.sway * gingaRoom.sway / Math.max(1, o.amp) });
  }
  resetRig(r);
  for (const s of SIDES) r["foot" + s].rotation.set(0, 0, 0);
  // A marka moves the free foot without starting another body's weight oscillation.
  // #107: a cyclic figure started later in its cycle (the ida e volta's variants) gives its offset, so that
  // the style runs in phase with the cycle: the variants are then the cycle's own poses.
  const styleTime = figure && !cyclic ? Math.min(beat, 4) : beat + ((figure as { styleOffset?: number } | null)?.styleOffset ?? 0);
  // #42: a figure that drives the ginga gives the style its phase (one beat per support transfer) and
  // the dancer's share of it; otherwise the style runs on the clock.
  // Kompa's own rhythm (one transfer every two beats, #62) is not the period-2 pattern the ginga phase maps.
  type Ginga = { gingaBeat?: number; gingaAmp?: number; gingaSway?: number } | null;
  const gingaOf = (key: typeof o.styleKey): Ginga => (key === "kompa" ? null : figure as Ginga);
  const ginga = gingaOf(o.styleKey);
  // The slow 4-beat waves stay on the clock (styleTime): the guide mode restarts a figure's local beat
  // every cycle.
  // #161, #162: the style's basic step, alone (no partner) on the spot with planted feet; there the kompa
  // and the semba dance their elected step (see `StyleDef.apply`).
  // Alone, a selected sortie (a pair figure) is the dance on the spot too (see `onBeatShift`).
  const base = !figure && !o.embrace && !o.follower && o.plant && (o.movement === "none" || o.movement.startsWith("sortie")) && !(o.travel > 0) && !o.sortie;
  // #196 (elected on 24 Nov. 2026): in place of that basic step the kizomba and the semba dance the « 1 2 », unless
  // the figure « Sur place » is chosen; the feet and the travel of the body are this figure's (src/umDois.ts), the
  // hip is the style's.
  const umDois = base && !surPlace ? umDoisOf(o.styleKey) : null, step = umDois ? "umDois" as const : base;
  const applyStyle = (key: typeof o.styleKey) => {
    const g = gingaOf(key);
    STYLES[key].apply(r, g?.gingaBeat ?? styleTime, o.amp * (g?.gingaAmp ?? 1), styleTime, key === o.styleKey ? step : base);
    // #157: where the figure leaves no room for the ginga (a tight spot, a touch), the style goes back to
    // the figure's own time and full amplitude: there the pose is the one the figure was calibrated with.
    if (g?.gingaBeat !== undefined && (figure as { gingaOwn?: boolean }).gingaOwn === false && gingaRoom.sway < 1) {
      const swung = styleState(r);
      resetRig(r);
      for (const s of SIDES) r["foot" + s].rotation.set(0, 0, 0);
      STYLES[key].apply(r, styleTime, o.amp, styleTime);
      mixStyleState(r, swung, styleState(r), 1 - gingaRoom.sway);
    }
  };
  applyStyle(o.styleKey);
  // #85: blend towards another style's pose (the guide mode changes style at a boundary: the basic step
  // in suave, the figures in the chosen style); `weight` 1 = the other style entirely.
  const blend = o.styleBlend && o.styleBlend.weight > 0 && STYLES[o.styleBlend.key] && o.styleBlend.key !== o.styleKey ? o.styleBlend : null;
  if (blend) {
    const mine = styleState(r);
    resetRig(r);
    for (const s of SIDES) r["foot" + s].rotation.set(0, 0, 0);
    applyStyle(blend.key);
    mixStyleState(r, mine, styleState(r), blend.weight);
  }
  // #159 (prototype): the « 8 ». The roll and the yaw of the pelvis are those of the style later in the
  // cycle, on the phase that keeps moving between two transfers; they fade where the figure leaves no room.
  const eight = o.ginga?.eight, wide = (figure as { gingaWide?: number } | null)?.gingaWide;
  let kneeLed: { share: number; L: number; R: number } | null = null;
  if (eight && wide !== undefined && ginga) {
    const main = styleState(r);
    const turned = (phase: number) => {
      resetRig(r);
      for (const s of SIDES) r["foot" + s].rotation.set(0, 0, 0);
      STYLES[o.styleKey].apply(r, phase, o.amp * (ginga.gingaAmp ?? 1), styleTime);
      return r.pelvis.rotation.clone();
    };
    const roll = turned(wide - eight.rollLag).z * eight.turn, yaw = turned(wide - eight.yawLag).y * eight.turn;
    mixStyleState(r, main, main, 0);
    const share = gingaRoom.sway * (1 - (blend?.weight ?? 0));
    r.pelvis.rotation.z += (roll - r.pelvis.rotation.z) * share;
    r.pelvis.rotation.y += (yaw - r.pelvis.rotation.y) * share;
    if (eight.knees) {
      // Weight on the left at phase 0.5, on the right at 1.5: the free knee is the most bent there.
      const c = Math.cos(Math.PI * (wide - 0.5 - eight.knees.lag));
      // Where the figure tightens the knees (`kneeCap` down to 0.12) the led knees give way, as the ginga does
      // where it has no room.
      // The quarter turn keeps its own knees altogether: its legs interleave all along (measured on the GLB: led
      // knees there bring the femurs together, about ninety poses).
      const tight = o.movement === "quarts" ? 0 : Math.max(0, Math.min(1, (((figure as { kneeCap?: number } | null)?.kneeCap ?? 0.45) - 0.12) / 0.1));
      kneeLed = { share: share * tight, L: eight.knees.base + eight.knees.swing * (1 - c) / 2, R: eight.knees.base + eight.knees.swing * (1 + c) / 2 };
    }
  }
  // #61: a figure may keep a share of the style's lateral hip shift on top of its own pelvis path;
  // #42: the ginga's shift towards the support joins it.
  const styleRootX = r.root.position.x;
  if (figure) {
    // The on-the-spot isolations need a smaller envelope while feet follow a fixed
    // close-couple path. Preserve their proportions, with a geometric clearance cap.
    const rotation = r.pelvis.rotation;
    const scale = Math.min(1, ((figure as { rotationCap?: number }).rotationCap ?? 0.12) / Math.max(1e-12, Math.abs(rotation.x), Math.abs(rotation.y), Math.abs(rotation.z)));
    rotation.set(rotation.x * scale, rotation.y * scale, rotation.z * scale);
    // Coupled pelvises (owner request, 19 Nov.): while the couple starts in contact, the follower's
    // pelvis follows the leader's instead of dancing on its own: the follower's hips seek the
    // leader's, who pushes them away. Both apply the same style in their own frames, which face each
    // other: the follower's local rotations and sway are mirrored (measured on the GLB, mirroring the
    // yaw too keeps the interleaved right thighs clear; a same-sign yaw turns both pelvises about
    // two centres 24 cm apart and swings the central thighs into each other).
    // `coupling` fades out as the first action opens the position.
    const coupling = o.follower ? figure.coupling : 0;
    if (coupling > 0) {
      const mirror = 1 - 2 * coupling;
      rotation.set(rotation.x * mirror, rotation.y * mirror, rotation.z * mirror);
      r.pelvis.position.x *= mirror; r.pelvis.position.z *= mirror;
    }
    // Pair quarter turns: the style's pelvis sway is reduced while the couple turns interleaved.
    const sway = (figure as { sway?: number }).sway ?? 1;
    r.pelvis.position.x *= sway; r.pelvis.position.z *= sway;
  }
  if (o.pelvisOffset) {
    const { position: p, rotation: q } = o.pelvisOffset;
    r.pelvis.position.x += p[0]; r.pelvis.position.y += p[1]; r.pelvis.position.z += p[2];
    r.pelvis.rotation.x += q[0]; r.pelvis.rotation.y += q[1]; r.pelvis.rotation.z += q[2];
  }
  // The close-couple figure limits extra bounce/flexion; generic deep pulses can put
  // two opposing knees through one another. Leg reach still determines pelvis height.
  const styleY = figure ? Math.max((figure as { dip?: number }).dip ?? -0.008, r.root.position.y * 0.25) : r.root.position.y;
  const desiredKnee = { L: r.kneeL.rotation.x, R: r.kneeR.rotation.x };
  const ownPosture = STYLES[o.styleKey].posture, otherPosture = blend ? STYLES[blend.key].posture : ownPosture, bw = blend?.weight ?? 0;
  const posture = { lean: ownPosture.lean + (otherPosture.lean - ownPosture.lean) * bw, knee: ownPosture.knee + (otherPosture.knee - ownPosture.knee) * bw };
  const feet = figure?.feet ?? (umDois ? umDoisFeet(clockBeat, umDois.ecart, model) : plannedFeet(beat, o, model));
  if (figure) {
    // The coupled follower mirrors it like her pelvis: the couple sways together in the world.
    const coupledSway = o.follower ? 1 - 2 * figure.coupling : 1;
    // The kept sway goes to the pelvis (the hips hang from it): the guide mode's pelvis inertialization
    // (#69) then smooths it across segment boundaries, like the rest of the pelvis pose.
    const kept = ((figure as { styleSway?: number }).styleSway ?? 0) * coupledSway + (ginga?.gingaSway ?? 0);
    r.root.position.x = figure.root.x;
    r.pelvis.position.x += styleRootX * kept;
    // #159 (prototype): forward as the weight arrives, back before it leaves; the couple moves together.
    if (eight && wide !== undefined) r.pelvis.position.z += (o.follower ? -1 : 1) * eight.depth * gingaRoom.sway * Math.sin(2 * Math.PI * (wide - eight.depthLag));
    r.root.position.z = figure.root.z;
    if (o.rootOffset) { r.root.position.x += o.rootOffset.x; r.root.position.z += o.rootOffset.z; }
    const rootYaw = (figure as { rootYaw?: number }).rootYaw;
    if (rootYaw !== undefined) r.root.rotation.y = rootYaw;
    // #51: the pelvises seek each other: each closes half the gap beyond the plexus distance (the leg
    // reach projection below keeps the pelvis above its feet).
    if (partnerRoot && PLEXUS.pelvisPull > 0) {
      const dx = partnerRoot.x - r.root.position.x, dz = partnerRoot.z - r.root.position.z, d = Math.hypot(dx, dz);
      const close = PLEXUS.pelvisPull * Math.max(0, d - PLEXUS.pelvisDistance) / 2;
      if (d > 1e-6) { r.root.position.x += dx / d * close; r.root.position.z += dz / d * close; }
    }
    r.extraL = 0; r.extraR = 0;
  } else {
    const path = bodyPath(beat, o);
    r.root.position.x += path.x; r.root.position.z += path.z; r.root.rotation.y = path.ry;
    if (umDois) r.root.position.x += umDois.ecart * umDoisCarry(clockBeat);
  }
  lockUpperTrunk({ spine: r.spine.rotation, chest: r.chest.rotation, head: r.head.rotation }, r.pelvis.rotation, o.iso);
  // #161 (prototype): a style may ask the spine to take up the pelvis's travel (`isoLean`, see KompaEight.iso).
  if (r.isoLean) {
    r.spine.rotation.z += r.isoLean.side; r.chest.rotation.z -= r.isoLean.side;
    r.spine.rotation.x -= r.isoLean.fore; r.chest.rotation.x += r.isoLean.fore;
  }
  const se = figure ? 0 : sortieEnv(beat, o);
  if (se > 0) r.chest.rotation.y -= 0.22 * se * o.amp;
  // #51: with plexus contact the chest turns towards the partner (contraposition share) instead of
  // the figure's own chest yaw; the lean towards the partner is applied once the frame is set.
  const facing = partnerRoot ? Math.atan2(partnerRoot.x - r.root.position.x, partnerRoot.z - r.root.position.z) : 0;
  if (figure && partnerRoot) r.chest.rotation.y += o.contraposition * Math.max(-PLEXUS.facing, Math.min(PLEXUS.facing, angleDelta(r.root.rotation.y, facing)));
  else if (figure) r.chest.rotation.y += figure.chestYaw;
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
  const trunk = [r.spine, r.chest, r.head].flatMap(n => [n.rotation.x, n.rotation.y, n.rotation.z]);
  if (o.trunkOffset) {
    const t = o.trunkOffset;
    [r.spine, r.chest, r.head].forEach((node, k) => { node.rotation.x += t[3 * k]; node.rotation.y += t[3 * k + 1]; node.rotation.z += t[3 * k + 2]; });
  }
  applyDanceFrame(r, o.cadre);
  if (o.follower) applyFollowerFrame(r, o.cadre);
  if (partnerRoot) leanTowards(r, partnerRoot);
  const activeIK = !!figure || o.plant || o.travel > 0 || o.quarts || o.ida || o.corridinho;
  const footOrientations = {} as Record<Side, THREE.Quaternion>;
  // Height of the ankle that bounds the pelvis height (the ankle target itself, except in a rolled walk).
  const bearingY = {} as Record<Side, number>;
  for (const s of SIDES) {
    // #73: outside the figures, the feet of a rolled walk carry a pitch from `plannedFeet` and roll like
    // figure feet; feet without a pitch (on the spot, solo ida, historical sorties) keep the style's rock.
    const rolled = !!figure || feet[s].pitch !== undefined;
    const extra = rolled ? feet[s].pitch ?? 0 : s === "L" ? r.extraL : r.extraR;
    const flat = new THREE.Quaternion().setFromAxisAngle(Y, feet[s].yaw);
    // #49: a figure foot rolls about its functional transverse axis (the GLB foot is turned out by
    // `toeOut`: rolling about the ankle's own x axis would also tip it sideways).
    const toeOut = model.legs[s].toeOut;
    const rollAxis = rolled ? new THREE.Vector3(Math.cos(toeOut), 0, -Math.sin(toeOut)) : X;
    const q = flat.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rollAxis, extra));
    footOrientations[s] = q;
    model.lift[s] = feet[s].lift;
    // #49: a rolling foot pivots on its ball or heel: that sole point stays where it is when flat.
    let x = feet[s].x, z = feet[s].z;
    // #73: outside figures the style's own foot rock (`extraL`, `extraR`) also pivots on a ground point,
    // the ball when the heel rises, the heel when the toes rise: the support foot no longer slides.
    const pivot = rolled ? feet[s].pivot : extra > 0 ? "ball" : extra < 0 ? "heel" : null;
    if (pivot && extra !== 0) {
      const point = model.legs[s][pivot];
      const shift = point.clone().applyQuaternion(flat).sub(point.clone().applyQuaternion(q));
      x += shift.x; z += shift.z;
    }
    model.targets[s].set(x, soleHeight(model.legs[s].sole, q) + feet[s].lift, z);
    // #73, R34: in a rolled walk outside the figures, a foot in the air or landing bends its knee instead
    // of lifting the pelvis, and the heel rising at push-off holds the pelvis up by a share only (`bear`).
    // On these long steps the pelvis otherwise jumped up as the trailing heel rose.
    if (!figure && feet[s].pitch !== undefined) {
      const flatY = soleHeight(model.legs[s].sole, flat);
      bearingY[s] = flatY + ((feet[s] as FootPlan).bear ?? 0) * (soleHeight(model.legs[s].sole, q) - flatY);
    } else bearingY[s] = model.targets[s].y;
  }
  if (activeIK) {
    r.root.position.y = 0;
    r.root.updateWorldMatrix(true, true);
    const bounds = SIDES.map(s => {
      const leg = model.legs[s];
      const hip = r.root.parent!.worldToLocal(r["hip" + s].getWorldPosition(new THREE.Vector3()));
      const cap = figure ? (figure as { kneeCap?: number }).kneeCap ?? 0.45 : 1.2;
      // A figure's cap under the floor leaves the floor itself: figures joined in the game mode keep one pose.
      const own = Math.max(KNEE_FLOOR.rad, Math.min(cap, kneeFloor(posture.knee + desiredKnee[s])));
      // #159 (prototype): the knees lead; where the figure leaves no room, its own flexion comes back.
      // #203: never below the floor, whatever leads them.
      const flex = kneeLed ? kneeFloor(own + (kneeLed[s] - own) * kneeLed.share) : own;
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
    // #196: in the « 1 2 » the feet travel. The pelvis keeps the height the hip's own step gives it, as if both
    // feet stood under the hips (the sits and the bounce of the elected step); a leg whose foot is far, left
    // behind or reaching aside, only bounds it by what it can reach straight, from where its foot stands (on its
    // ball when the heel is up). A smooth minimum hands the height from one bound to the other without a kink.
    const reaches: number[] = [];
    for (const { s, hipOffset, reach2 } of bounds) {
      const hip = hipOffset.clone().add(r.root.position);
      const target = model.targets[s];
      const horizontal2 = (target.x - hip.x) ** 2 + (target.z - hip.z) ** 2;
      if (umDois) {
        // #203: « straight » is the least flexion of the rule.
        const leg = model.legs[s], straight2 = leg.length1 ** 2 + leg.length2 ** 2 + 2 * leg.length1 * leg.length2 * Math.cos(KNEE_FLOOR.rad);
        const flatY = soleHeight(leg.sole, new THREE.Quaternion().setFromAxisAngle(Y, feet[s].yaw));
        reaches.push(flatY + Math.sqrt(reach2) - hip.y, bearingY[s] + Math.sqrt(Math.max(0, straight2 - horizontal2)) - hip.y);
      } else height = Math.min(height, bearingY[s] + Math.sqrt(Math.max(0, reach2 - horizontal2)) - hip.y);
    }
    if (umDois) {
      const lowest = Math.min(...reaches);
      height = lowest - UM_DOIS_SOFT * Math.log(reaches.reduce((sum, v) => sum + Math.exp(-(v - lowest) / UM_DOIS_SOFT), 0));
    }
    // #157: the small bounce, one per beat of the music: lowest on the beat, where the weight arrives.
    // A figure that leaves no room to lower the pelvis (`dip` 0: the quarter turn while the legs cross)
    // gets none there: lowering it bends the knees into the partner's.
    const room = Math.max(0, Math.min(1, ((figure as { dip?: number } | null)?.dip ?? GINGA_ROOM) / GINGA_ROOM));
    // #163: calibrated at amplitude 1 (the game's); beyond, the bounce shrinks as the sway's share does.
    const bounce = gingaSet ? -gingaSet.bounce / Math.max(1, o.amp) * room * gingaRoom.bounce * (0.5 + 0.5 * Math.cos(2 * Math.PI * (clockBeat - (o.ginga?.eight?.bounceLag ?? 0)))) : 0;
    if (kneeLed) {
      // Each foot on the floor puts its hip where its leg reaches at its own flexion: the pelvis takes the
      // height and the tilt that satisfy both (the left hip is on +x: a positive roll lifts it). A foot that
      // leaves gives up its say; its hip then follows the knees' difference in leg length.
      const each = {} as Record<Side, number>, free = {} as Record<Side, number>, length = {} as Record<Side, number>;
      for (const { hipOffset, reach2, s } of bounds) {
        const hip = hipOffset.clone().add(r.root.position), target = model.targets[s];
        each[s] = target.y + Math.sqrt(Math.max(0, reach2 - (target.x - hip.x) ** 2 - (target.z - hip.z) ** 2)) - hip.y;
        // A foot that leaves (its heel rising, no weight on it) gives up its say before it lifts.
        const load = s === "R" ? (figure as { loadR?: number } | null)?.loadR ?? 0.5 : 1 - ((figure as { loadR?: number } | null)?.loadR ?? 0.5);
        free[s] = Math.max(smoothstep(feet[s].lift / 0.03), (1 - load) * smoothstep(Math.abs(feet[s].pitch ?? 0) / 0.05));
        length[s] = Math.sqrt(reach2);
      }
      const halfHip = (model.legs.L.hipX - model.legs.R.hipX) / 2, clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));
      const solved = clamp((each.L - each.R) / (2 * halfHip)), fromKnees = clamp((length.L - length.R) / (2 * halfHip));
      const lifted = Math.max(free.L, free.R), sin = solved + (fromKnees - solved) * lifted;
      const wL = 1 - free.L + 1e-6, wR = 1 - free.R + 1e-6;
      const led = (wL * (each.L - halfHip * sin) + wR * (each.R + halfHip * sin)) / (wL + wR);
      height += (led - height) * kneeLed.share;
      r.pelvis.rotation.z += Math.asin(sin) * kneeLed.share;
    }
    r.root.position.y = height + Math.min(0, styleY) + bounce + (o.rootOffset?.y ?? 0);
    r.root.updateWorldMatrix(true, true);
    const skeleton = r["Skeleton"] as THREE.Object3D;
    const outerQ = r.root.parent!.getWorldQuaternion(new THREE.Quaternion());
    for (const s of SIDES) {
      const leg = model.legs[s];
      const target = skeleton.worldToLocal(r.root.parent!.localToWorld(model.targets[s].clone()));
      // #84: a figure may keep the knees from following its own pelvis yaw (`kneeYaw`, rad): the knee
      // pole turns back by that much, so the knees stay over the feet instead of swinging sideways.
      // #127: `kneeYawSide` adds to it per leg (a turned-out foot takes its knee with it).
      const kneeYaw = figure ? ((figure as { kneeYaw?: number }).kneeYaw ?? 0) + ((figure as { kneeYawSide?: Record<Side, number> }).kneeYawSide?.[s] ?? 0) : 0;
      const pole = kneeYaw !== 0 ? new THREE.Vector3(-Math.sin(kneeYaw), 0, Math.cos(kneeYaw)) : undefined;
      const solution = solveLeg3D(leg.hip, target, leg.length1, leg.length2, leg.f0, leg.t0, pole);
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
  const prescribedR = (figure as { loadR?: number } | null)?.loadR ?? (supportOf(o.styleKey, r, beat, step) + 1) / 2;
  const loadR = grounded.R ? (grounded.L ? prescribedR : 1) : 0;
  const loadL = grounded.L ? (grounded.R ? 1 - prescribedR : 1) : 0;
  const chestQ = r.chest.getWorldQuaternion(new THREE.Quaternion());
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(chestQ);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(chestQ);
  const pos = r.root.getWorldPosition(new THREE.Vector3());
  return { trunk, beat: figure ? beat : clockBeat, loadR, loadL, kneeL: kneeAngle(r, "L"), kneeR: kneeAngle(r, "R"),
    roll: r.pelvis.rotation.z * 180 / Math.PI,
    trunkTilt: Math.acos(Math.max(-1, Math.min(1, up.y))) * 180 / Math.PI,
    facing: facingSector(Math.atan2(forward.x, forward.z)), posX: pos.x, posZ: pos.z };
}
