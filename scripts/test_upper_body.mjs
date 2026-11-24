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
  // #179: the bones of a hand and of its forearm as segments thickened by the bone's radius (m), and the play
  // between two of them (negative: one bone goes through the other).
  const handBones = (u, s) => {
    const J = n => u.joints.get(n + s), at = o => o.getWorldPosition(new THREE.Vector3()), segs = [{ a: at(J("fore0")), b: at(J("hand")), r: 0.011, fore: true }];
    for (const f of ["thumb", "index", "middle", "ring", "little"]) {
      const tip = J(f + "3").localToWorld(new THREE.Vector3(...manifest.axes[s].tips[f]).sub(new THREE.Vector3(...manifest.rest[`${f}3${s}`])));
      const P = [at(J("hand")), at(J(f + "1")), at(J(f + "2")), at(J(f + "3")), tip];
      for (let k = 0; k < 4; k++) segs.push({ a: P[k], b: P[k + 1], r: k === 0 ? 0.007 : f === "thumb" ? 0.006 : 0.005 });
    }
    return segs;
  };
  const play = (A, B) => {
    const d1 = A.b.clone().sub(A.a), d2 = B.b.clone().sub(B.a), r = A.a.clone().sub(B.a), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
    let s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0, t = (b * s + f) / e;
    if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
    return A.a.clone().addScaledVector(d1, s).distanceTo(B.a.clone().addScaledVector(d2, t)) - A.r - B.r;
  };
  // #185: the body of the left shoulder blade in the chest frame (m), measured on the anatomical model: 6 to 13 cm
  // from the spine, 2 to 10 cm above the chest's origin. And the least the follower's left arm keeps over the
  // leader's right arm: her elbow above his, the axes of the two arms apart (two arms' half-thicknesses).
  const BLADE = { x: [0.06, 0.13], y: [0.02, 0.10] }, ARMS = { elbows: 0.03, gap: 0.09, open: 0.04 };
  // #199: the tray: his palm at most this far from the sky, his thumb this far outwards (and not under the level), the
  // angle between his forearm and his hand within this range (rad), his palm off the rig's point by at most this much
  // when the wrist runs out of range (m); her elbow at least this far under her wrist (m).
  const TRAY = { sky: 0.44, thumb: 0.3, angle: [1.83, 2.53], miss: 0.01 }, HER_DROP = 0.08;
  const nearest = (a0, a1, b0, b1) => {
    const d1 = a1.clone().sub(a0), d2 = b1.clone().sub(b0), r = a0.clone().sub(b0), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
    let s = den > 1e-12 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0, t = (b * s + f) / e;
    if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
    return [a0.clone().addScaledVector(d1, s), b0.clone().addScaledVector(d2, t)];
  };
  // #199: the hold chosen on 24 November (`ciel`: his hand like a waiter's tray, her elbow dropped), then
  // the hold on the side kept as an option (`cote`).
  for (const tenue of ["ciel", "cote"]) for (const [label, dz, beats, opt] of cases) {
    api.TENUE.current = tenue;
    const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
    const uppers = pair.map(f => new api.UpperBody(f.r, model, options));
    const seen = { error: 0, bent: [Infinity, 0], bentWrist: 0, bentMiss: 0, sky: 0, thumbOut: Infinity, herDrop: Infinity, holds: { back: 0, hands: 0, free: 0 }, elbow: [Infinity, 0], pronation: [Infinity, -Infinity], jump: 0, rigJump: 0, yaw: [Infinity, 0],
      grip: 0, wrist: 0, facing: 0, crossed: [Infinity, 0], play: Infinity, thumbUp: Infinity, upright: Infinity,
      blade: { n: 0, off: 0, elbows: Infinity, gap: Infinity, over: Infinity, wrist: 0 } };
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
          seen.holds[e.hold]++;
          // #179: the follower's hand that takes the leader's is placed from his hand, not on the rig's point:
          // its palm stays against his, facing it, across it (her fingers towards his index).
          if (i && e.hold === "hands") {
            const his = uppers[0].hand("L"), hers = u.hand(s);
            seen.grip = Math.max(seen.grip, hers.palm.distanceTo(his.palm)); seen.wrist = Math.max(seen.wrist, e.wrist);
            seen.facing = Math.max(seen.facing, Math.PI - hers.normal.angleTo(his.normal));
            const across = hers.fingers.angleTo(his.radial);
            seen.crossed = [Math.min(seen.crossed[0], across), Math.max(seen.crossed[1], across)];
            assert(e.wrist <= api.GRIP.upright.wrist + 1e-9, `${label} ${b}: wrist bent beyond the range of this hold`);
            // The owner's hold (23 November 2026): his thumb to the sky, her hand standing, no bone through another.
            // #199: his thumb stays up when his wrist bends; her elbow drops under her wrist.
            seen.thumbUp = Math.min(seen.thumbUp, his.radial.y); seen.upright = Math.min(seen.upright, hers.fingers.y);
            seen.herDrop = Math.min(seen.herDrop, world(u.joints.get("hand" + s)).y - world(u.joints.get("fore0" + s)).y);
            for (const A of handBones(u, s)) for (const B of handBones(uppers[0], "L")) if (!(A.fore && B.fore)) seen.play = Math.min(seen.play, play(A, B));
          } else if (!i && s === "L" && e.hold === "hands" && tenue === "ciel") {
            // #199: the tray: his palm almost level, facing the sky; his thumb in sight, outwards (not towards his chest);
            // the hand bent back from the forearm by about 60°; the palm on the rig's point while the wrist has range.
            const h = u.hand("L"), angle = C.clone().sub(world(u.joints.get("handL"))).angleTo(h.fingers);
            const outwards = new THREE.Vector3(1, 0, 0).transformDirection(r.chest.matrixWorld).setY(0).normalize();
            seen.bent = [Math.min(seen.bent[0], angle), Math.max(seen.bent[1], angle)]; seen.sky = Math.max(seen.sky, h.normal.angleTo(new THREE.Vector3(0, 1, 0)));
            seen.thumbOut = Math.min(seen.thumbOut, h.radial.dot(outwards), h.radial.y + 0.2);
            seen.bentWrist = Math.max(seen.bentWrist, e.wrist); seen.bentMiss = Math.max(seen.bentMiss, e.error);
          } else seen.error = Math.max(seen.error, e.error);
          seen.elbow = [Math.min(seen.elbow[0], flexion), Math.max(seen.elbow[1], flexion)];
          seen.pronation = [Math.min(seen.pronation[0], e.pronation), Math.max(seen.pronation[1], e.pronation)];
          // Continuity: the elbow, seen from the chest, from one sample to the next, against the rig's own.
          const own = r.chest.worldToLocal(C.clone()), rigs = r.chest.worldToLocal(world(r["armF" + s]));
          if (before[i][s]) { seen.jump = Math.max(seen.jump, own.distanceTo(before[i][s][0])); seen.rigJump = Math.max(seen.rigJump, rigs.distanceTo(before[i][s][1])); }
          before[i][s] = [own, rigs];
        }
      });
      // #185: while the leader's right hand is on its place on the follower's back (not slid along it, #93), his
      // palm lies on her left shoulder blade and her left arm passes over his right arm.
      const hisR = uppers[0].state.R, herChest = pair[1].r.chest;
      if (hisR.hold === "back" && herChest.worldToLocal(hisR.target.clone()).distanceTo(new THREE.Vector3(...api.CADRE_SITES.scapulaL)) < 0.03) {
        const p = herChest.worldToLocal(uppers[0].hand("R").palm.clone()), B = seen.blade;
        const arm = (u, s) => ["arm", "fore0", "hand"].map(n => world(u.joints.get(n + s))), his = arm(uppers[0], "R"), hers = arm(uppers[1], "L");
        B.n++; B.off = Math.max(B.off, BLADE.x[0] - p.x, p.x - BLADE.x[1], BLADE.y[0] - p.y, p.y - BLADE.y[1]);
        B.elbows = Math.min(B.elbows, hers[1].y - his[1].y); B.wrist = Math.max(B.wrist, hisR.wrist);
        // Where the two arms are closest: how far apart, and how much higher hers is there.
        let near = null;
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
          const [q, r] = nearest(hers[i], hers[i + 1], his[j], his[j + 1]), d = q.distanceTo(r);
          if (!near || d < near.d) near = { d, over: q.y - r.y };
        }
        B.gap = Math.min(B.gap, near.d); B.over = Math.min(B.over, near.over);
      }
    }
    if (seen.blade.n) {
      const B = seen.blade;
      assert(B.off < 0.001, `${label}: the leader's right palm leaves the body of the follower's shoulder blade by ${(B.off * 100).toFixed(1)} cm (#185)`);
      assert(B.wrist <= api.BACK.wrist + 1e-9, `${label}: the leader's right wrist bends beyond its range on her back (#185)`);
      // Closed position: her elbow above his, the two arms further apart than their thickness. While the couple
      // opens (the sorties) his arm stretches and his elbow rises: her arm stays above his where they are closest.
      const closed = !label.startsWith("sortie");
      assert(B.over > 0 && B.gap > (closed ? ARMS.gap : ARMS.open) && (!closed || B.elbows > ARMS.elbows),
        `${label}: the follower's left arm does not pass over the leader's right arm (where they are closest hers is ${(B.over * 100).toFixed(1)} cm higher, ${(B.gap * 100).toFixed(1)} cm away; her elbow ${(B.elbows * 100).toFixed(1)} cm above his) (#185)`);
    }
    assert(seen.error < 0.001, `${label}: the palm misses the rig's hand by ${(seen.error * 1000).toFixed(1)} mm`);
    assert(seen.grip < 0.06, `${label}: the follower's palm is ${(seen.grip * 100).toFixed(1)} cm from the leader's (#179)`);
    assert(seen.play > -0.001, `${label}: bones of the two joined hands go through each other by ${(-seen.play * 1000).toFixed(1)} mm (#179)`);
    assert(seen.facing < 0.3, `${label}: the palms face each other within ${Math.round(seen.facing * 180 / Math.PI)}° only (#179)`);
    if (tenue === "cote") assert(seen.thumbUp > 0.7 && seen.upright > 0.85, `${label}: the leader's thumb (${seen.thumbUp.toFixed(2)}) or the follower's fingers (${seen.upright.toFixed(2)}) leave the vertical (#179)`);
    else {
      assert(seen.sky < TRAY.sky && seen.thumbOut > TRAY.thumb, `${label}: the leader's palm leans ${Math.round(seen.sky * 180 / Math.PI)}° from the sky, his thumb ${seen.thumbOut.toFixed(2)} outwards (#199)`);
      assert(seen.bent[0] > TRAY.angle[0] && seen.bent[1] < TRAY.angle[1] && seen.bentWrist <= api.SKYWARD.wrist + 1e-9 && seen.bentMiss < TRAY.miss,
        `${label}: the leader's hand makes ${seen.bent.map(x => Math.round(x * 180 / Math.PI)).join(" to ")}° with his forearm, his wrist ${Math.round(seen.bentWrist * 180 / Math.PI)}°, his palm ${(seen.bentMiss * 1000).toFixed(1)} mm from the rig's point (#199)`);
      assert(seen.herDrop > HER_DROP, `${label}: the follower's elbow only ${(seen.herDrop * 100).toFixed(1)} cm under her wrist (#199)`);
    }
    // The elbow never jumps more than the rig's own elbow does (a released hand jumps in the rig too).
    assert(seen.jump < seen.rigJump + 0.02, `${label}: elbow jump ${(seen.jump * 100).toFixed(1)} cm, rig ${(seen.rigJump * 100).toFixed(1)} cm`);
    table.push({ tenue, figure: label, "écart paume (mm)": +(seen.error * 1000).toFixed(2), "main / avant-bras guideur (°)": tenue === "ciel" ? seen.bent.map(x => Math.round(x * 180 / Math.PI)).join(" à ") : "—",
      "coude suiveuse sous son poignet (cm)": +(seen.herDrop * 100).toFixed(1), "angle au coude (°)": seen.elbow.map(x => Math.round(x)).join(" à "),
      "pronation (°)": seen.pronation.map(x => Math.round(x * 180 / Math.PI)).join(" à "), "saut du coude (cm)": +(seen.jump * 100).toFixed(1),
      "celui du rig (cm)": +(seen.rigJump * 100).toFixed(1), "port de tête (°)": seen.yaw.map(x => Math.round(x * 180 / Math.PI)).join(" à "),
      "mains : dos / jointes / libres": `${seen.holds.back} / ${seen.holds.hands} / ${seen.holds.free}`,
      "prise : paumes (cm)": +(seen.grip * 100).toFixed(1), "poignet (°)": Math.round(seen.wrist * 180 / Math.PI),
      "paumes face à face (°)": Math.round(seen.facing * 180 / Math.PI), "doigts / index du guideur (°)": seen.crossed.map(x => Math.round(x * 180 / Math.PI)).join(" à "), "jeu entre os (mm)": +(seen.play * 1000).toFixed(1),
      "main au dos : poses": seen.blade.n, "coude d'elle au-dessus du sien (cm)": seen.blade.n ? +(seen.blade.elbows * 100).toFixed(1) : "—", "écart des deux bras (cm)": seen.blade.n ? +(seen.blade.gap * 100).toFixed(1) : "—", "elle plus haut, au plus près (cm)": seen.blade.n ? +(seen.blade.over * 100).toFixed(1) : "—", "son poignet (°)": Math.round(seen.blade.wrist * 180 / Math.PI) });
    uppers.forEach(u => u.dispose());
  }
  api.TENUE.current = "ciel";
  console.table(table);
  console.log("PASS haut du corps en paire (tenue choisie et tenue sur le côté) : paume sur la main du rig (au dos : sur l'omoplate, le bras de la suiveuse par-dessus, #185), longueurs constantes, pronation et port de tête dans leur amplitude");
}

// #183: a dancer's own hold. With `grip` on the follower's layer her palm stands further from his; without it,
// the engine's hold comes back exactly.
{
  const pair = [fixture(api, { offset: [0, 0, -api.PLACE_PAIR_DZ] }), fixture(api, { rotation: Math.PI, offset: [0, 0, api.PLACE_PAIR_DZ] })];
  const uppers = pair.map(f => new api.UpperBody(f.r, model, options));
  const pose = () => {
    pair.forEach((f, i) => api.applyPose(f.r, f.model, 2, { movement: "none", placePaire: true, embrace: true, placement: "quinconce", follower: !!i, styleKey: "kizomba", amp: 1, plexus: true }));
    pair.forEach((f, i) => api.solveFrame(f.r, pair[1 - i].r, !!i));
    for (let k = 0; k < 2; k++) uppers.forEach((u, i) => u.update(pair[1 - i].r, !!i));
    return uppers[1].hand("R").palm.distanceTo(uppers[0].hand("L").palm);
  };
  const engine = pose(), at = api.GRIP.upright.at;
  uppers[1].grip = { at: [at[0], at[1], at[2] + 0.02] };
  const wider = pose();
  assert(wider > engine + 0.012, `a dancer's own hold: the palms are ${(wider * 100).toFixed(1)} cm apart, ${(engine * 100).toFixed(1)} cm without it (#183)`);
  delete uppers[1].grip;
  assert(Math.abs(pose() - engine) < 1e-9, "without a dancer's own hold, the engine's hold comes back (#183)");
  uppers.forEach(u => u.dispose());
  console.log(`PASS prise par danseur : paumes à ${(engine * 100).toFixed(1)} cm avec la prise du moteur, ${(wider * 100).toFixed(1)} cm avec une prise élargie de 2 cm`);
}

// Alone: every style with the rig's arm frame; then the rig is given back intact.
{
  const f = fixture(api), u = new api.UpperBody(f.r, model, options);
  let worst = 0, fold = 0;
  for (const styleKey of Object.keys(api.STYLES)) for (let b = 0; b <= 8; b += 0.125) {
    api.applyPose(f.r, f.model, b, { styleKey, amp: 1, cadre: true });
    u.update(null, false);
    assert.equal(u.headCarrier.rotation.y, 0, "alone: the head faces forward");
    for (const s of ["L", "R"]) {
      assert(Number.isFinite(u.state[s].error), `${styleKey} ${b} ${s}`); worst = Math.max(worst, u.state[s].error);
      // #182: the rig's frame folds its raised forearm flat on the arm; the bones keep within the elbow's range.
      const at = n => u.joints.get(n + s).getWorldPosition(new THREE.Vector3());
      fold = Math.max(fold, at("fore0").sub(at("arm")).angleTo(at("hand").sub(at("fore0"))));
    }
  }
  assert(worst < 0.001, `alone: the palm misses its place by ${(worst * 1000).toFixed(1)} mm`);
  assert(fold <= api.ELBOW_MAX + 0.05, `alone: an elbow folds by ${Math.round(fold * 180 / Math.PI)}°, past the joint's ${Math.round(api.ELBOW_MAX * 180 / Math.PI)}° (#182)`);
  u.dispose();
  const left = [];
  f.r.root.traverse(o => { if (o.name.startsWith("upper_")) left.push(o.name); });
  assert.deepEqual(left, [], "dispose() removes everything the layer added");
  console.log(`PASS haut du corps seul : ${Object.keys(api.STYLES).length} styles, écart de paume maximal ${(worst * 1000).toFixed(2)} mm, coude plié de ${Math.round(fold * 180 / Math.PI)}° au plus ; le rig est rendu intact`);
}
