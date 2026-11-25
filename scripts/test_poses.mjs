import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture, minimumBoneY, snapshot } from "./pose_fixture.mjs";
const bundle = new URL("./.test-poses-bundle.mjs", import.meta.url);
buildSync({
  stdin: { contents: 'export * from "./src/pose"; export * from "./src/anatomy"; export * from "./src/styles"; export * from "./src/clock"; export * from "./src/rigJoints";',
    resolveDir: new URL("../", import.meta.url).pathname, loader: "ts" },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent",
});
const api = await import(bundle.href);
unlinkSync(bundle);
let checks = 0;
const near = (a, b, tolerance, label) => {
  assert.ok(Math.abs(a - b) <= tolerance, label + ": " + a + " vs " + b);
  checks++;
};
const configs = [
  {}, { travel: 0.4 }, { travel: 1, dir: -1 }, { quarts: true },
  { corridinho: true }, { ida: true }, { temps3: true, travel: 0.8 },
  { sortie: true, embrace: true },
  { quarts: true, travel: 1, sortie: true, embrace: true },
  { corridinho: true, travel: 1, sortie: true, embrace: true },
  { quarts: true, embrace: true, reverse: true, follower: true },
];
let maxFootError = 0, minY = Infinity, poseCount = 0;
for (const styleKey of Object.keys(api.STYLES)) for (const amp of [0.5, 1, 2]) for (const config of configs) {
  const f = fixture(api, config.follower ? { rotation: Math.PI, offset: [0, 0, api.PAIR_DZ] } : {});
  for (let b = 0; b <= 16; b += 0.5) {
    const stats = api.applyPose(f.r, f.model, b, { styleKey, amp, ...config });
    for (const v of snapshot(f.r)) assert.ok(Number.isFinite(v), "finite final matrices");
    for (const s of ["L", "R"]) {
      const hip = f.r["hip" + s].getWorldPosition(new THREE.Vector3());
      const knee = f.r["knee" + s].getWorldPosition(new THREE.Vector3());
      const foot = f.r["foot" + s].getWorldPosition(new THREE.Vector3());
      const leg = f.model.legs[s];
      near(hip.distanceTo(knee), leg.length1, 1e-9, "femur length");
      near(knee.distanceTo(foot), leg.length2, 1e-9, "tibia length");
      const error = foot.distanceTo(f.outer.localToWorld(f.model.targets[s].clone()));
      maxFootError = Math.max(maxFootError, error);
      assert.ok(error <= 0.001, JSON.stringify({ styleKey, amp, config, b, s, error }));
      const angle = knee.clone().sub(hip).angleTo(foot.clone().sub(knee)) * 180 / Math.PI;
      near(stats["knee" + s], angle, 1e-8, "HUD final knee angle");
      if (f.model.lift[s] > 1e-6) near(stats["load" + s], 0, 1e-12, "airborne support");
      const marker = f.r["contactKnee" + s].getWorldPosition(new THREE.Vector3());
      near(marker.distanceTo(f.r["knee" + s].localToWorld(new THREE.Vector3(0, 0, 0.05))), 0, 1e-9, "marker follows knee");
    }
    const ground = minimumBoneY(f.r);
    minY = Math.min(minY, ground);
    assert.ok(ground >= -0.0001, JSON.stringify({ styleKey, amp, config, b, ground }));
    poseCount++;
  }
}
console.log("PASS final GLB poses:", poseCount, "max ankle error", maxFootError, "min vertex Y", minY);

for (const config of [{ quarts: true }, { corridinho: true }, { ida: true },
  { quarts: true, reverse: true, follower: true }, { travel: 1 }, { temps3: true, travel: 1 },
  { corridinho: true, travel: 1, sortie: true, embrace: true, amp: 2 }]) {
  const f = fixture(api);
  for (let b = 0; b <= 32; b++) {
    api.applyPose(f.r, f.model, b - 1e-7, config);
    const before = snapshot(f.r);
    api.applyPose(f.r, f.model, b + 1e-7, config);
    snapshot(f.r).forEach((x, i) => near(x, before[i], 0.0001, "continuous final matrix at beat " + b));
  }
}
console.log("PASS final-pose continuity at steps and cycle seams");

const a = fixture(api), b = fixture(api);
const clock = api.createDanceClock();
api.advanceClock(clock, 0.05, 90, true);
for (const t of [3.37, 0, 16, 1.25, 11.73]) {
  clock.beat = t;
  api.applyPose(a.r, a.model, clock.beat, { styleKey: "zouk", quarts: true });
  api.applyPose(a.r, a.model, clock.beat, { styleKey: "kizomba" });
  api.applyPose(b.r, b.model, clock.beat, { styleKey: "kizomba" });
  snapshot(a.r).forEach((x, i) => near(x, snapshot(b.r)[i], 1e-9, "mount/style/seek independence"));
}
const before = clock.beat; api.advanceClock(clock, 0.1, 90, false); near(clock.beat, before, 0, "pause");
clock.exportFrame = 0; api.advanceClock(clock, 0.1, 90, true); near(clock.beat, before, 0, "export transport");
console.log("PASS shared phase and history-independent poses");

for (const styleKey of Object.keys(api.STYLES)) {
  const free = fixture(api);
  for (let t = 0; t <= 4; t += 0.25) {
    const stats = api.applyPose(free.r, free.model, t, { styleKey, amp: 2, plant: false, iso: false });
    assert.ok(minimumBoneY(free.r) >= -0.0001, "free-foot mode still respects the floor");
    for (const s of ["L", "R"]) {
      let min = Infinity;
      free.r["foot" + s].traverse(mesh => {
        if (!mesh.isMesh) return;
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++)
          min = Math.min(min, new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).y);
      });
      if (min > 0.0001) near(stats["load" + s], 0, 0, "free-mode airborne support");
    }
  }
}
const walk = fixture(api);
// #62: the on-the-spot motion runs ON_BEAT_SHIFT behind the clock (weight on the beat).
const walkStats = api.applyPose(walk.r, walk.model, 0.3 + api.ON_BEAT_SHIFT, { travel: 1 });
near(walk.model.lift.L, 0.05, 1e-10, "regression: lifted left foot");
near(walkStats.loadL, 0, 0, "regression: no 90% load on lifted foot");
console.log("PASS legacy free-foot floor and audited airborne-load regression");

for (const [styleKey, config, beat] of [
  ["kompa", { quarts: true }, 2.25], ["kizomba", { corridinho: true }, 8.8],
  ["kompa", { corridinho: true }, 10.2], ["kompa", { corridinho: true, reverse: true, follower: true }, 3.9],
]) {
  const composed = fixture(api);
  api.applyPose(composed.r, composed.model, beat, {
    styleKey, amp: 2, travel: 1, sortie: true, embrace: true, ...config,
  });
  assert.ok(minimumBoneY(composed.r) >= -0.0001, "composed options cannot put bones underground");
  for (const s of ["L", "R"])
    near(composed.r["foot" + s].getWorldPosition(new THREE.Vector3()).distanceTo(composed.model.targets[s]), 0, 0.001, "composed target reachable");
}

const f = fixture(api), knees = [], levels = [];
for (let t = 0; t < 2; t += 0.05) {
  const stats = api.applyPose(f.r, f.model, t, { styleKey: "semba" });
  knees.push(stats.kneeL, stats.kneeR); levels.push(f.r.root.position.y);
}
assert.ok(Math.min(...knees) > 8, "semba knees must not collapse to straight legs");
assert.ok(Math.max(...knees) - Math.min(...knees) > 8, "semba knee modulation");
// #209 (the hip first, elected on 25 Nov. 2026): the weight passes later and quicker in the « 1 2 », the pelvis's
// height varies by 1.96 cm instead of 2.12; it still rises and sinks.
assert.ok(Math.max(...levels) - Math.min(...levels) > 0.018, "semba vertical modulation");
for (const [options, duration] of [[{}, 4], [{ ida: true }, 8], [{ quarts: true }, 16],
  [{ corridinho: true }, 16], [{ temps3: true }, 12], [{ sortie: true }, 8]]) {
  near(api.cycleBeats(options), duration, 0, "full export cycle");
  near(api.exportBeat(duration * 60 * 30 / 90, 30, 90), duration, 1e-12, "export end");
}
console.log("PASS preserved knee modulation, levels and export periods;", checks, "assertions");
