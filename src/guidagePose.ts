/** Guide mode (#69): applies a guide sample to one dancer with `applyPose`, inertializing the pelvis
 * height at the boundaries. The pair figures bound knee flexion differently (`kneeCap`), so the pelvis
 * height found by the leg reach, and the pelvis's own pose (caps, coupling, sway), can differ between
 * the end of a figure and the start of the next one (measured: up to 3 cm at the knees). The residual is
 * measured once per transition on the rig itself (same GLB, style, amplitude) and faded with the planar
 * residual, before the leg IK; the feet keep their targets. #219: with its speed too (the end of one segment's
 * against the start of the next), so that the pelvis keeps its speed across the boundary. */
import { applyPose, type PoseModel, type PoseOptions, type PoseStats } from "./pose";
import type { RigHandle } from "./anatomy";
import { aheadSpeed, backSpeed, guidePoseOptions, guideStyleOf, inertialize, movementOf, segmentBeats, GUIDE_GINGA_DEFAULT, JUNCTION_STEP, type GuideGinga, type GuideKind, type GuideSample, type RootOffset } from "./guidage";
import type { Touch } from "./insertion";

export type GuidePoseBase = Partial<Pick<PoseOptions, "styleKey" | "amp" | "iso" | "cadre" | "placement" | "contraposition">>;
/** #219: residual of the pelvis pose at a boundary (`at`) and its speed per beat (`speed`), channel by channel. */
export interface PelvisJunction { at: number[]; speed: number[] }
/** Pelvis residuals by transition, style, amplitude and role (pure in those keys). */
export type PelvisCache = Map<string, PelvisJunction>;

type Offset = RootOffset;
const STILL: Offset = { x: 0, z: 0, yaw: 0 };

function poseAt(r: RigHandle, model: PoseModel, kind: GuideKind, beat: number, base: GuidePoseBase, follower: boolean,
  planar: Offset = STILL, pelvis: number[] | null = null, blendFrom: GuideKind | null = null, touches: Touch[] = [], ginga: GuideGinga = GUIDE_GINGA_DEFAULT) {
  const offsets = follower ? { leader: STILL, follower: planar } : { leader: planar, follower: STILL };
  const styleKey = guideStyleOf(kind, base.styleKey ?? "kizomba");
  const stats = applyPose(r, model, beat, {
    ...base, styleKey, styleBlend: blendFrom ? { key: guideStyleOf(blendFrom, base.styleKey ?? "kizomba"), weight: 1 } : null,
    ...guidePoseOptions({ kind, movement: movementOf(kind), rootOffset: offsets, touches, ginga, previous: blendFrom }, follower),
    pelvisOffset: pelvis ? { position: [pelvis[1], pelvis[2], pelvis[3]], rotation: [pelvis[4], pelvis[5], pelvis[6]] } : null,
    trunkOffset: pelvis ? pelvis.slice(7, 16) : null,
  });
  const p = r.pelvis.position, q = r.pelvis.rotation;
  return [r.root.position.y, p.x, p.y, p.z, q.x, q.y, q.z, ...stats.trunk];
}

/** Residual (end of `from` − start of `to`) of the pelvis pose, measured on the rig, cached:
 * [root height, pelvis x, y, z, pelvis Euler x, y, z, spine, chest and head Euler x, y, z]. The upper
 * trunk joins it with the ginga (#42): the style phase it drives differs from the clock's at a boundary. The pelvis's own pose is compared as the styles
 * produce it; the height is measured again with the planar and pelvis residuals applied, since
 * they move the pelvis height the leg reach finds (exact at the boundary, where the fade is 1).
 * #219: each channel with its speed, from three poses on each side of the boundary (`JUNCTION_STEP` apart); the height
 * and the trunk with the planar and pelvis residuals as they go at the start of their fade (`planarSpeed`). */
export function pelvisResidual(r: RigHandle, model: PoseModel, from: GuideKind, to: GuideKind, base: GuidePoseBase,
  follower: boolean, planar: Offset, cache: PelvisCache, fromTouches: Touch[] = [], ginga: GuideGinga = GUIDE_GINGA_DEFAULT,
  planarSpeed: Offset = STILL, toTouches: Touch[] = []): PelvisJunction {
  // #144: the touches of `from` lengthen it; its last pose is the figure's, at a later time of the style. #219: those of
  // `to` (one at its position 0) change how it starts moving.
  const opening = toTouches.filter(t => t.at === 0);
  const key = `${ginga}:${from}+${fromTouches.length}>${to}${opening.length ? JSON.stringify(opening) : ""}:${base.styleKey}:${base.amp}:${base.placement}:${base.contraposition}:${base.iso}:${base.cadre}:${follower}`;
  let junction = cache.get(key);
  if (!junction) {
    const H = JUNCTION_STEP, end = segmentBeats(from, fromTouches), steps = [0, 1, 2];
    // The style change itself is blended (#85): the residual only carries the figures' difference.
    const a = steps.map(k => poseAt(r, model, from, end - k * H, base, follower, STILL, null, null, fromTouches, ginga));
    const b = steps.map(k => poseAt(r, model, to, k * H, base, follower, STILL, null, from, opening, ginga));
    const out = a[0].map((_, i) => backSpeed(a[0][i], a[1][i], a[2][i])), into = b[0].map((_, i) => aheadSpeed(b[0][i], b[1][i], b[2][i]));
    const at = a[0].map((v, k) => v - b[0][k]), speed = out.map((v, k) => v - into[k]);
    // The chest turns towards the partner (contraposition) and the trunk counters the pelvis: both
    // depend on the planar and pelvis residuals, measured with them like the height.
    const fadedAt = (t: number): [Offset, number[]] => [
      { x: inertialize(planar.x, planarSpeed.x, t), z: inertialize(planar.z, planarSpeed.z, t), yaw: inertialize(planar.yaw, planarSpeed.yaw, t) },
      at.map((x0, k) => inertialize(x0, speed[k], t))];
    const w = steps.map(k => poseAt(r, model, to, k * H, base, follower, ...fadedAt(k * H), from, opening, ginga));
    for (const k of [0, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
      at[k] = a[0][k] - w[0][k];
      speed[k] = out[k] - aheadSpeed(w[0][k], w[1][k], w[2][k]);
    }
    junction = { at, speed };
    cache.set(key, junction);
  }
  return junction;
}

export function applyGuidePose(r: RigHandle, model: PoseModel, sample: GuideSample, base: GuidePoseBase, follower: boolean,
  cache: PelvisCache): PoseStats {
  const role = follower ? "follower" : "leader";
  const previous = sample.segment.previous;
  const w = previous !== null ? sample.inertia : 0;
  // #219: each channel of the pelvis residual fades with its speed.
  const residual = sample.segment.residual[role], speed = sample.segment.speed?.[role] ?? STILL;
  const j = w > 0 ? pelvisResidual(r, model, previous!, sample.kind, base, follower, { ...residual, yaw: 0 }, cache, sample.segment.previousTouches ?? [], sample.ginga, speed, sample.touches) : null;
  const d = j ? j.at.map((x0, k) => inertialize(x0, j.speed[k], sample.localBeat)) : null;
  const styleKey = guideStyleOf(sample.kind, base.styleKey ?? "kizomba");
  const blendKey = previous !== null ? guideStyleOf(previous, base.styleKey ?? "kizomba") : null;
  return applyPose(r, model, sample.localBeat, {
    ...base, styleKey, styleBlend: blendKey && blendKey !== styleKey && w > 0 ? { key: blendKey, weight: w } : null,
    ...guidePoseOptions({ ...sample, previous }, follower),
    rootOffset: { ...sample.rootOffset[role], y: d ? d[0] : 0 },
    pelvisOffset: d ? { position: [d[1], d[2], d[3]], rotation: [d[4], d[5], d[6]] } : null,
    trunkOffset: d ? d.slice(7, 16) : null,
  });
}
