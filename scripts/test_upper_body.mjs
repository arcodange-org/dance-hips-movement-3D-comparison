// #176 (docs/spec-haut-du-corps.md): the anatomical upper body on the real GLB, without a browser.
// The asset matches the engine's joints, the palm comes where the rig puts its hand, bone lengths are kept,
// the pronation stays in its range, and the rig is left intact.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-upper-body-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ["pose", "anatomy", "styles", "rigJoints", "muscles", "quartsPaire", "sortieGarcon", "sortieFille", "idaPaire", "placePaire", "cadre", "upperBody"]
  .map(n => `export * from "./src/${n}";`).join("\n"), resolveDir: new URL("../", import.meta.url).pathname },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent" });
const api = await import(bundle.href); unlinkSync(bundle);
const glb = readFileSync(new URL("../public/anatomy_upper.glb", import.meta.url));
const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
const manifest = gltf.scenes[0].extras;
const near = (a, b, eps = 1e-6) => a.every((x, i) => Math.abs(x - b[i]) < eps);
const world = o => o.getWorldPosition(new THREE.Vector3());

// The file: its skin follows the manifest, every piece is there, the attribution is carried.
{
  assert.deepEqual(gltf.skins[0].joints.map(j => gltf.nodes[j].name.replace(/^joint_/, "")), manifest.joints, "skin joints order");
  const meshes = new Set(gltf.nodes.filter(n => n.mesh !== undefined).map(n => n.name));
  for (const p of manifest.pieces) assert(meshes.has(p.name), `piece ${p.name} missing in the GLB`);
  assert(/BodyParts3D/.test(gltf.asset.copyright) && /CC BY-SA 2\.1/.test(manifest.attribution), "BodyParts3D attribution");
  const bones = manifest.pieces.filter(p => p.kind === "bone").length;
  console.log(`PASS fichier anatomique : ${bones} pièces osseuses, ${manifest.pieces.length - bones} muscles, ${manifest.joints.length} articulations`);
}

// The trunk joints copied at build time are still the engine's (the column and the neck are weighted on them).
{
  const { spine, chest, head } = api.TORSO_JOINTS;
  const c = spine.map((x, i) => x + chest[i]), h = c.map((x, i) => x + head[i]);
  assert(near(manifest.engine.spine, spine) && near(manifest.engine.chest, c) && near(manifest.engine.head, h),
    "TORSO_JOINTS changed: run scripts/build_upper_body.mjs again");
  const m = manifest.measures.L, shoulder = c.map((x, i) => x + api.ARM_JOINTS.shoulderL[i]);
  const gap = Math.hypot(...manifest.rest.armL.map((x, i) => x - shoulder[i]));
  console.log("PASS articulations du tronc : celles du moteur");
  console.log(`INFO bras : épaule du rig à ${(gap * 100).toFixed(1)} cm de l'articulation anatomique ; bras ${(-api.ARM_JOINTS.elbow[1] * 100).toFixed(0)} cm (anatomie ${(m.arm * 100).toFixed(1)}) ; coude→main ${(-api.ARM_JOINTS.hand[1] * 100).toFixed(0)} cm (anatomie : poignet ${(m.forearm * 100).toFixed(1)}, paume ${(m.elbowToPalm * 100).toFixed(1)})`);
}

// Kinematics need no mesh: the model is the manifest alone.
const model = { manifest, pieces: [] };
const options = { boneMaterial: new THREE.MeshBasicMaterial(), muscleMaterial: () => new THREE.MeshBasicMaterial() };

// In the pair figures (quinconce, plexus and arm frame as in the app), every sixteenth of a beat.
{
  const cases = [
    ["sortie garçon", api.SORTIE_GARCON_PAIR_DZ, 5, { movement: "sortieG" }],
    ["sortie fille", api.SORTIE_FILLE_PAIR_DZ, 5, { movement: "sortieF" }],
    ["quarts de tour", api.QUARTS_PAIR_DZ, 16, { movement: "quarts", quarts: true, quartsPaire: true }],
    ["ida e volta", api.IDA_PAIR_DZ, 8, { movement: "ida", ida: true, idaPaire: true }],
    ["sur place", api.PLACE_PAIR_DZ, 4, { movement: "none", placePaire: true }],
  ];
  const table = [];
  for (const [label, dz, beats, opt] of cases) {
    const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
    const uppers = pair.map(f => new api.UpperBody(f.r, model, options));
    const seen = { error: 0, holds: { back: 0, hands: 0, free: 0 }, elbow: [Infinity, 0], pronation: [Infinity, -Infinity], jump: 0, rigJump: 0, yaw: [Infinity, 0] };
    const before = [{}, {}];
    for (let b = 0; b <= beats; b += 1 / 16) {
      pair.forEach((f, i) => api.applyPose(f.r, f.model, b, { ...opt, embrace: true, placement: "quinconce", follower: !!i, styleKey: "kizomba", amp: 1, plexus: true }));
      pair.forEach((f, i) => api.solveFrame(f.r, pair[1 - i].r, !!i));
      uppers.forEach((u, i) => {
        u.update(pair[1 - i].r, !!i);
        const yaw = u.headCarrier.rotation.y;
        assert(yaw >= 0 && yaw <= api.HEAD_CARRIAGE.angle + 1e-9, `${label} ${b}: head carriage out of range`);
        seen.yaw = [Math.min(seen.yaw[0], yaw), Math.max(seen.yaw[1], yaw)];
        for (const s of ["L", "R"]) {
          const e = u.state[s], r = pair[i].r;
          const S = world(u.joints.get("arm" + s)), C = world(u.joints.get("fore0" + s));
          assert([e.palm, e.elbow].every(p => Number.isFinite(p.x + p.y + p.z)) && Number.isFinite(e.pronation), `${label} ${b} ${s}: undefined pose`);
          assert(Math.abs(S.distanceTo(C) - manifest.measures[s].arm) < 2e-4, `${label} ${b} ${s}: arm length`);
          assert(e.pronation >= api.PRONATION.min - 1e-9 && e.pronation <= api.PRONATION.max + 1e-9, `${label} ${b} ${s}: pronation out of range`);
          const flexion = Math.acos(Math.max(-1, Math.min(1, S.clone().sub(C).normalize().dot(e.palm.clone().sub(C).normalize())))) * 180 / Math.PI;
          seen.error = Math.max(seen.error, e.error); seen.holds[e.hold]++;
          seen.elbow = [Math.min(seen.elbow[0], flexion), Math.max(seen.elbow[1], flexion)];
          seen.pronation = [Math.min(seen.pronation[0], e.pronation), Math.max(seen.pronation[1], e.pronation)];
          // Continuity: the elbow, seen from the chest, from one sample to the next, against the rig's own.
          const own = r.chest.worldToLocal(C.clone()), rigs = r.chest.worldToLocal(world(r["armF" + s]));
          if (before[i][s]) { seen.jump = Math.max(seen.jump, own.distanceTo(before[i][s][0])); seen.rigJump = Math.max(seen.rigJump, rigs.distanceTo(before[i][s][1])); }
          before[i][s] = [own, rigs];
        }
      });
    }
    assert(seen.error < 0.001, `${label}: the palm misses the rig's hand by ${(seen.error * 1000).toFixed(1)} mm`);
    // The elbow never jumps more than the rig's own elbow does (a released hand jumps in the rig too).
    assert(seen.jump < seen.rigJump + 0.02, `${label}: elbow jump ${(seen.jump * 100).toFixed(1)} cm, rig ${(seen.rigJump * 100).toFixed(1)} cm`);
    table.push({ figure: label, "écart paume (mm)": +(seen.error * 1000).toFixed(2), "angle au coude (°)": seen.elbow.map(x => Math.round(x)).join(" à "),
      "pronation (°)": seen.pronation.map(x => Math.round(x * 180 / Math.PI)).join(" à "), "saut du coude (cm)": +(seen.jump * 100).toFixed(1),
      "celui du rig (cm)": +(seen.rigJump * 100).toFixed(1), "port de tête (°)": seen.yaw.map(x => Math.round(x * 180 / Math.PI)).join(" à "),
      "mains : dos / jointes / libres": `${seen.holds.back} / ${seen.holds.hands} / ${seen.holds.free}` });
    uppers.forEach(u => u.dispose());
  }
  console.table(table);
  console.log("PASS haut du corps en paire : paume sur la main du rig, longueurs constantes, pronation et port de tête dans leur amplitude");
}

// Alone: every style with the rig's arm frame; then the rig is given back intact.
{
  const f = fixture(api), u = new api.UpperBody(f.r, model, options);
  let worst = 0;
  for (const styleKey of Object.keys(api.STYLES)) for (let b = 0; b <= 8; b += 0.125) {
    api.applyPose(f.r, f.model, b, { styleKey, amp: 1, cadre: true });
    u.update(null, false);
    assert.equal(u.headCarrier.rotation.y, 0, "alone: the head faces forward");
    for (const s of ["L", "R"]) { assert(Number.isFinite(u.state[s].error), `${styleKey} ${b} ${s}`); worst = Math.max(worst, u.state[s].error); }
  }
  assert(worst < 0.001, `alone: the palm misses the rig's hand by ${(worst * 1000).toFixed(1)} mm`);
  u.dispose();
  const left = [];
  f.r.root.traverse(o => { if (o.name.startsWith("upper_")) left.push(o.name); });
  assert.deepEqual(left, [], "dispose() removes everything the layer added");
  console.log(`PASS haut du corps seul : ${Object.keys(api.STYLES).length} styles, écart de paume maximal ${(worst * 1000).toFixed(2)} mm ; le rig est rendu intact`);
}
