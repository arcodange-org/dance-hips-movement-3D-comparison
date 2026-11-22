// #148 (élections de variantes) — mesure d'un candidat de l'ida e volta en paire sur le vrai GLB.
// Ce n'est pas un test : il chiffre ce que montre le GIF (kizomba, quinconce, plexus, amplitude 1).
// Depuis le vote du 21 novembre 2026 (pied opposé élu), `ESSAI=idaMemePied` n'a plus d'effet : la mesure du candidat
// « même pied » se refait au commit 06d1a33.
// Usage : node scripts/mesure_essai_ida.mjs                      (figure actuelle)
//         ESSAI=idaMemePied node scripts/mesure_essai_ida.mjs    (candidat « même pied », #86)
// Même montage du couple et mêmes enveloppes de semelles que scripts/test_ida_paire.mjs.
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import { fixture } from "./pose_fixture.mjs";
import { transformedMesh, meshIntersection, footHull, hullGap } from "./mesh_intersections.mjs";

const bundle = new URL("./.mesure-essai-ida-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "styles", "rigJoints", "placement", "idaPaire"]
  .map(n => `export * from "./src/${n}";`).join("\n"), resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href); unlinkSync(bundle);

const dz = api.IDA_PAIR_DZ;
const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const options = i => ({ movement: "ida", ida: true, embrace: true, idaPaire: true, follower: !!i,
  styleKey: "kizomba", amp: 1, placement: "quinconce", plexus: true, contraposition: 1 });
const pose = beat => pair.forEach((f, i) => api.applyPose(f.r, f.model, beat, options(i)));
const hull = (f, side) => footHull(f.model.legs[side].sole.map(p => p.clone().applyMatrix4(f.r["foot" + side].matrixWorld)));
const NAMES = { L: "gauche", R: "droit" };

// 1. Semelles : écart horizontal entre chaque pied du leader et chaque pied du suiveur, sur 8 temps.
const STEP = 0.02;
let samples = 0, overlaps = 0;
const closest = { gap: Infinity };
for (let beat = 0; beat < 8 - 1e-9; beat += STEP) {
  pose(beat); samples++;
  let touching = false;
  for (const a of ["L", "R"]) for (const b of ["L", "R"]) {
    const gap = hullGap(hull(pair[0], a), hull(pair[1], b));
    if (gap < 0) touching = true;
    if (gap < closest.gap) Object.assign(closest, { gap, beat, leader: a, follower: b });
  }
  if (touching) overlaps++;
}

// 2. Os des jambes : croisements entre les deux danseurs.
const bones = ["Femur", "Tibia", "Fibula", "Patella"].flatMap(n => ["L", "R"].map(s => n + "_" + s));
let bonePoses = 0, crossings = 0;
const crossed = new Map();
for (let beat = 0; beat < 8 - 1e-9; beat += 0.125) {
  pose(beat); bonePoses++;
  const meshes = pair.map(f => Object.fromEntries(bones.map(n => [n, transformedMesh(f.r[n])])));
  let any = false;
  for (const a of bones) for (const b of bones) if (meshIntersection(meshes[0][a], meshes[1][b])) {
    any = true;
    const key = `leader ${a} / suiveur ${b}`;
    crossed.set(key, [...(crossed.get(key) ?? []), beat]);
  }
  if (any) crossings++;
}

const cm = v => (v * 100).toFixed(1).replace(".", ",");
console.log(`candidat : ${process.env.ESSAI ?? "figure actuelle"}`);
console.log(`semelles : ${overlaps} recouvrement(s) entre danseurs sur ${samples} instants`);
console.log(closest.gap < 0
  ? `au plus près : semelles superposées dès le temps ${closest.beat.toFixed(2)} (pied ${NAMES[closest.leader]} du leader, pied ${NAMES[closest.follower]} du suiveur)`
  : `au plus près : ${cm(closest.gap)} cm entre le pied ${NAMES[closest.leader]} du leader et le pied ${NAMES[closest.follower]} du suiveur, au temps ${closest.beat.toFixed(2)}`);
console.log(`os des jambes : ${crossings} pose(s) avec croisement entre danseurs sur ${bonePoses}`);
for (const [key, beats] of crossed) console.log(`  ${key} : temps ${beats[0]} à ${beats.at(-1)} (${beats.length} poses)`);
pose(0);
console.log(`au repos (temps 0) : ${["L", "R"].flatMap(a => ["L", "R"].map(b =>
  `${NAMES[a]} du leader / ${NAMES[b]} du suiveur ${cm(hullGap(hull(pair[0], a), hull(pair[1], b)))} cm`)).join(" ; ")}`);
