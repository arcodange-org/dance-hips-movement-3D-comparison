/** Guide mode (#69): applies a guide sample to one dancer with `applyPose`, inertializing the pelvis
 * height at the boundaries. The pair figures bound knee flexion differently (`kneeCap`), so the pelvis
 * height found by the leg reach, and the pelvis's own pose (caps, coupling, sway), can differ between
 * the end of a figure and the start of the next one (measured: up to 3 cm at the knees). The residual is
 * measured once per transition on the rig itself (same GLB, style, amplitude) and faded with the planar
 * residual, before the leg IK; the feet keep their targets. */
import { applyPose, type PoseModel, type PoseOptions, type PoseStats } from "./pose";
import type { RigHandle } from "./anatomy";
import { guidePoseOptions, guideStyleOf, movementOf, segmentBeats, type GuideKind, type GuideSample } from "./guidage";
import type { Touch } from "./insertion";

export type GuidePoseBase = Partial<Pick<PoseOptions, "styleKey" | "amp" | "iso" | "cadre" | "placement" | "contraposition">>;
/** Pelvis residuals by transition, style, amplitude and role (pure in those keys). */
export type PelvisCache = Map<string, number[]>;

type Offset = { x: number; z: number };
const STILL = { x: 0, z: 0 };

function poseAt(r: RigHandle, model: PoseModel, kind: GuideKind, beat: number, base: GuidePoseBase, follower: boolean,
  planar: Offset = STILL, pelvis: number[] | null = null, blendFrom: GuideKind | null = null, touches: Touch[] = []) {
  const offsets = follower ? { leader: STILL, follower: planar } : { leader: planar, follower: STILL };
  const styleKey = guideStyleOf(kind, base.styleKey ?? "kizomba");
  const stats = applyPose(r, model, beat, {
    ...base, styleKey, styleBlend: blendFrom ? { key: guideStyleOf(blendFrom, base.styleKey ?? "kizomba"), weight: 1 } : null,
    ...guidePoseOptions({ kind, movement: movementOf(kind), rootOffset: offsets, touches }, follower),
    pelvisOffset: pelvis ? { position: [pelvis[1], pelvis[2], pelvis[3]], rotation: [pelvis[4], pelvis[5], pelvis[6]] } : null,
    trunkOffset: pelvis ? pelvis.slice(7, 16) : null,
  });
  const p = r.pelvis.position, q = r.pelvis.rotation;
  return [r.root.position.y, p.x, p.y, p.z, q.x, q.y, q.z, ...stats.trunk];
}

/** Residual (end of `from` − start of `to`) of the pelvis pose, measured on the rig, cached:
 * [root height, pelvis x, y, z, pelvis Euler x, y, z, spine, chest and head Euler x, y, z]. The upper
 * trunk joins it with the ginga (#42): the style phase it drives differs from the clock's at a boundary. The pelvis's own pose is compared as the styles
 * produce it; the height is measured again with the planar and pelvis residuals applied in full, since
 * they move the pelvis height the leg reach finds (exact at the boundary, where the fade is 1). */
export function pelvisResidual(r: RigHandle, model: PoseModel, from: GuideKind, to: GuideKind, base: GuidePoseBase,
  follower: boolean, planar: Offset, cache: PelvisCache, fromTouches: Touch[] = []): number[] {
  // #144: the touches of `from` lengthen it; its last pose is the figure's, at a later time of the style.
  const key = `${from}+${fromTouches.length}>${to}:${base.styleKey}:${base.amp}:${base.placement}:${base.contraposition}:${base.iso}:${base.cadre}:${follower}`;
  let residual = cache.get(key);
  if (!residual) {
    // The style change itself is blended (#85): the residual only carries the figures' difference.
    const a = poseAt(r, model, from, segmentBeats(from, fromTouches), base, follower, STILL, null, null, fromTouches), b = poseAt(r, model, to, 0, base, follower, STILL, null, from);
    residual = a.map((v, k) => v - b[k]);
    const withOffsets = poseAt(r, model, to, 0, base, follower, planar, residual, from);
    residual[0] = a[0] - withOffsets[0];
    // The chest turns towards the partner (contraposition) and the trunk counters the pelvis: both
    // depend on the planar and pelvis residuals, measured with them like the height.
    for (let k = 7; k < 16; k++) residual[k] = a[k] - withOffsets[k];
    cache.set(key, residual);
  }
  return residual;
}

export function applyGuidePose(r: RigHandle, model: PoseModel, sample: GuideSample, base: GuidePoseBase, follower: boolean,
  cache: PelvisCache): PoseStats {
  const role = follower ? "follower" : "leader";
  const previous = sample.segment.previous;
  const w = previous !== null ? sample.inertia : 0;
  const d = w > 0 ? pelvisResidual(r, model, previous!, sample.kind, base, follower, sample.segment.residual[role], cache, sample.segment.previousTouches ?? []).map(v => v * w) : null;
  const styleKey = guideStyleOf(sample.kind, base.styleKey ?? "kizomba");
  const blendKey = previous !== null ? guideStyleOf(previous, base.styleKey ?? "kizomba") : null;
  return applyPose(r, model, sample.localBeat, {
    ...base, styleKey, styleBlend: blendKey && blendKey !== styleKey && w > 0 ? { key: blendKey, weight: w } : null,
    ...guidePoseOptions(sample, follower),
    rootOffset: { ...sample.rootOffset[role], y: d ? d[0] : 0 },
    pelvisOffset: d ? { position: [d[1], d[2], d[3]], rotation: [d[4], d[5], d[6]] } : null,
    trunkOffset: d ? d.slice(7, 16) : null,
  });
}
