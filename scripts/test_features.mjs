#!/usr/bin/env node
// Runner Gherkin minimal (zéro dépendance) : exécute les scénarios de docs/features/*.feature
// contre les fonctions pures de src/styles.ts + src/anatomy.ts (bundle esbuild, comme
// test_styles.mjs). Les scénarios tagués @wip sont sautés (fonctionnalité pas encore livrée).
// Usage : npm test   (test_styles.mjs puis test_features.mjs)
import { createRequire } from "node:module";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "scripts", ".test-features-bundle.mjs");
esbuild.buildSync({
  stdin: {
    contents: 'export * from "../src/styles"; export * from "../src/anatomy"; export * from "../src/cameras"; export * from "../src/share"; export * from "../src/directions"; export * from "../src/sortieGarcon"; export * from "../src/sortieFille"; export * from "../src/idaPaire"; export * from "../src/gait"; export * from "../src/music/patterns"; export * from "../src/music/scheduler"; export * as guidage from "../src/guidage"; export * as insertion from "../src/insertion"; export { gingaPhase } from "../src/pose"; export * from "../src/music/loop"; export * from "../src/vitrine"; export * from "../src/music/recordings";',
    resolveDir: join(root, "scripts"),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundle,
  logLevel: "silent",
  define: { "import.meta.env.BASE_URL": '"/"' },
});
const mod = await import(pathToFileURL(bundle).href + "?t=" + Date.now());
rmSync(bundle, { force: true });
const { STYLES, supportOf, sortieEnvelope, sortieOffset, plantBlend, corridinhoPath, quartsPath, reversePath, travelOffset, swingBeat, idaEVoltaStep, idaContra, virgulaFootYawDelta, movementOf, movementFlags, sortieActive, quartTurnStep, PAIR_DZ, HIP_WIDTH, HIP_Y, S2, clampSolY, swingLift, CAM_PRESETS, resolveCam, resolveView, viewAnglesOf, posFromView, SOLID_TORSO_OPACITY, lockUpperTrunk, residualRoll, upperStability, DANCE_FRAME, DANCE_FRAME_FOLLOWER, parseVec3, buildShareUrl, DIR_LABELS, facingSector, isDiagonal, relToLineOfDance } = mod;
const { Group } = await import(
  pathToFileURL(join(root, "node_modules", "three", "build", "three.module.js")).href
);

/** #140: couple motions of the game mode figures, on a rest stance close to the GLB's. */
let guideMotionsCache = null;
const guideRig = () => ({ rest: { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } }, stance: 0.02, placement: "quinconce", amp: 1 });
const guideMotionsOf = () => guideMotionsCache ??= mod.guidage.guideMotions(guideRig());
/** A plan as text: figure, positions of its touches (#144), start. */
const jeuText = plan => plan.segments.map(s => `${s.kind}${(s.touches ?? []).map(t => `+${t.at}`).join("")}@${s.start}`).join(" ");

// ---------- parsing Gherkin ----------
function parseFeature(text) {
  const lines = text.split("\n");
  const scenarios = [];
  let tags = [];
  let cur = null;
  let inExamples = false;
  let exampleRows = [];
  let exampleHeader = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("@")) {
      tags.push(line.slice(1).trim());
      continue;
    }
    const mS = /^(Scenario Outline|Scenario):\s*(.*)$/.exec(line);
    if (mS) {
      if (cur) scenarios.push(cur);
      cur = { outline: mS[1] === "Scenario Outline", name: mS[2], tags: [...tags], steps: [], examples: null };
      tags = [];
      inExamples = false;
      continue;
    }
    if (/^Examples:/.test(line)) {
      inExamples = true;
      exampleRows = [];
      continue;
    }
    if (inExamples && line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (!exampleHeader) exampleHeader = cells;
      else exampleRows.push(cells);
      continue;
    }
    if (/^\|/.test(line) && cur && !inExamples) continue;
    const mStep = /^(Given|When|Then|And|But)\s+(.*)$/.exec(line);
    if (mStep && cur) {
      cur.steps.push(mStep[2]);
      continue;
    }
    if (line && !line.startsWith("#") && cur && !mStep) {
      // texte libre de description
    }
  }
  if (cur) scenarios.push(cur);
  for (const sc of scenarios) {
    if (sc.outline && exampleHeader) {
      sc.examples = exampleRows.map((row) => {
        const map = {};
        exampleHeader.forEach((h, i) => (map[h] = row[i]));
        return map;
      });
    }
  }
  return scenarios;
}

// ---------- maquette de rig ----------
function mockRig() {
  return {
    root: new Group(), pelvis: new Group(), spine: new Group(), lumbar: new Group(),
    thoracic: new Group(), chest: new Group(), head: new Group(),
    hipL: new Group(), hipR: new Group(), kneeL: new Group(), kneeR: new Group(),
    extraL: 0, extraR: 0,
  };
}
function allFinite(r) {
  for (const o of [r.root, r.pelvis, r.spine, r.lumbar, r.thoracic, r.chest, r.head, r.hipL, r.hipR, r.kneeL, r.kneeR]) {
    for (const v of [...o.position.toArray(), o.rotation.x, o.rotation.y, o.rotation.z]) {
      if (!Number.isFinite(v)) return false;
    }
  }
  return Number.isFinite(r.extraL) && Number.isFinite(r.extraR);
}
function ampMax(travel) {
  let m = 0;
  for (let b = 0; b <= 800; b += 0.01) m = Math.max(m, Math.abs(Math.tanh(2.2 * S2(b))));
  return travel * (HIP_WIDTH / 2) * m;
}

// ---------- registre de steps ----------
const steps = [
  // Son synthétisé (#44, docs/spec-son-synthese.md)
  [/^la musique "(\w+)"$/, (c, m) => {
    if (!mod.MUSIC_STYLES[m[1]]) throw new Error("musique inconnue " + m[1]);
    c.music = mod.MUSIC_STYLES[m[1]];
  }],
  [/^la piste "(\w+)" frappe aux pas ([\d, ]+) de la grille (\d)$/, (c, m) => {
    const got = mod.gridNotes(c.music, Number(m[3]) - 1).filter((n) => n.track === m[1]).map((n) => n.step).join(",");
    const want = m[2].split(",").map((x) => x.trim()).join(",");
    if (got !== want) throw new Error(`${m[1]} : pas ${got}, attendu ${want}`);
  }],
  [/^la piste "(\w+)" est accentuée aux pas ([\d, ]+) de la grille (\d)$/, (c, m) => {
    const notes = mod.gridNotes(c.music, Number(m[3]) - 1).filter((n) => n.track === m[1]);
    const max = Math.max(...notes.map((n) => n.velocity));
    const got = notes.filter((n) => n.velocity === max).map((n) => n.step).join(",");
    const want = m[2].split(",").map((x) => x.trim()).join(",");
    if (got !== want) throw new Error(`${m[1]} : accents ${got}, attendu ${want}`);
  }],
  [/^les fenêtres \[([\d.]+), ([\d.]+)\) et \[([\d.]+), ([\d.]+)\) donnent les mêmes notes que \[([\d.]+), ([\d.]+)\)$/, (c, m) => {
    const [a, b, b2, d, e, f] = m.slice(1).map(Number);
    const k = (es) => es.map((x) => `${x.track}@${x.beat}`).join(" ");
    const parts = [...mod.eventsInWindow(c.music, a, b), ...mod.eventsInWindow(c.music, b2, d)];
    if (k(parts) !== k(mod.eventsInWindow(c.music, e, f))) throw new Error("fenêtres incohérentes");
  }],
  [/^un transport audio parti du temps ([\d.]+) à (\d+) bpm$/, (c, m) => {
    c.tr = mod.createTransport(0, Number(m[1]), Number(m[2]), true);
  }],
  [/^([\d.]+) s plus tard le temps de la danse vaut ([\d.]+)$/, (c, m) => {
    const b = mod.beatAt(c.tr, Number(m[1]));
    if (Math.abs(b - Number(m[2])) > 1e-9) throw new Error(`temps ${b}, attendu ${m[2]}`);
  }],
  [/^après un passage à (\d+) bpm à ([\d.]+) s, ([\d.]+) s plus tard le temps de la danse vaut ([\d.]+)$/, (c, m) => {
    const tr = mod.retempoAt(c.tr, Number(m[2]), Number(m[1]));
    const b = mod.beatAt(tr, Number(m[2]) + Number(m[3]));
    if (Math.abs(b - Number(m[4])) > 1e-9) throw new Error(`temps ${b}, attendu ${m[4]}`);
  }],
  // Vitrine (#150, docs/spec-vitrine-danse-auto.md)
  [/^on ouvre l'adresse "\?([^"]*)"$/, (c, m) => { c.vitrine = mod.vitrineSettings(new URLSearchParams(m[1])); }],
  [/^la vue s'ouvre en (danse automatique|écoute)$/, (c, m) => {
    if (c.vitrine.auto !== (m[1] === "danse automatique")) throw new Error(`auto=${c.vitrine.auto}`);
  }],
  [/^les muscles sont (affichés|masqués) et le buste est (lisible|translucide)$/, (c, m) => {
    const look = mod.showcaseLook(c.vitrine, c.vitrine.auto);
    if (look.muscles !== (m[1] === "affichés") || look.solidTorso !== (m[2] === "lisible")) throw new Error(JSON.stringify(look));
  }],
  [/^le tempo d'ouverture du style "(\w+)" est (celui de sa piste enregistrée|le tempo d'écoute|(\d+) bpm)$/, (c, m) => {
    const got = mod.openingBpm(c.vitrine, m[1]);
    const rec = mod.RECORDINGS[m[1]];
    const want = m[3] ? Number(m[3]) : m[2].startsWith("celui") ? (rec ? mod.recordingTempo(rec) : null) : mod.GUIDE_BPM.listen;
    if (want === null) throw new Error(`pas de piste enregistrée pour ${m[1]}`);
    if (got !== want) throw new Error(`tempo ${got}, attendu ${want}`);
  }],
  [/^le lien de partage du style "(\w+)" avec la graine (\d+) est "([^"]+)"$/, (c, m) => {
    const got = mod.vitrineUrl("https://exemple.test/app/", { style: m[1], graine: Number(m[2]) });
    if (got !== m[3]) throw new Error(got);
  }],
  // Musique enregistrée (#142, docs/spec-musique-elevenlabs.md)
  [/^une piste enregistrée à ([\d.]+) bpm dont le temps 1 est à ([\d.]+) s et la boucle fait (\d+) temps$/, (c, m) => {
    c.rec = { style: "kizomba", file: "kizomba.mp3", bpm: Number(m[1]), firstBeat: Number(m[2]), beats: Number(m[3]) };
  }],
  [/^le temps (-?[\d.]+) de la danse se lit à ([\d.]+) s dans le fichier$/, (c, m) => {
    const p = mod.positionOfBeat(c.rec, Number(m[1]));
    if (Math.abs(p - Number(m[2])) > 5e-4) throw new Error(`position ${p}, attendu ${m[2]}`);
  }],
  [/^au tempo (\d+) la piste est jouée à ([\d.]+) fois sa vitesse$/, (c, m) => {
    const r = mod.rateOf(c.rec, Number(m[1]));
    if (Math.abs(r - Number(m[2])) > 5e-4) throw new Error(`vitesse ${r}, attendu ${m[2]}`);
  }],
  [/^la boucle dure ([\d.]+) s dans le fichier$/, (c, m) => {
    const d = mod.loopSeconds(c.rec);
    if (Math.abs(d - Number(m[1])) > 5e-4) throw new Error(`durée ${d}, attendu ${m[1]}`);
  }],
  [/^on construit l'URL de partage avec son=true et source=synthese$/, (c) => {
    c.url = buildShareUrl("/app/", { mode: "pair", son: true, source: "synthese" }, null, null);
  }],
  [/^l'URL contient son=1 et source=synthese$/, (c) => {
    const q = new URL(c.url, "https://exemple.test").searchParams;
    if (q.get("son") !== "1" || q.get("source") !== "synthese") throw new Error(c.url);
  }],
  [/^on construit l'URL de partage avec son=true et musique=B$/, (c) => {
    c.url = buildShareUrl("/app/", { mode: "compare", son: true, musique: "B" }, null, null);
  }],
  [/^l'URL contient son=1 et musique=B$/, (c) => {
    const q = new URL(c.url, "https://exemple.test").searchParams;
    if (q.get("son") !== "1" || q.get("musique") !== "B") throw new Error(c.url);
  }],
  [/^on échantillonne la sortie fille au deuxième pas en variante "(hook|back)"$/, (c, m) => {
    const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
    const pose = (beat, follower) => mod.sampleSortieFille(beat, follower, rest, m[1]);
    // #49: the corner of the hook is reached half-way through the swing of the (reduced) walking roll.
    const roll = mod.SORTIE_FILLE_FIRST_ROLL, push = mod.GAIT.push * roll, land = 1 - (1 - mod.GAIT.land) * roll;
    c.fille = { start: pose(1, false), corner: pose(1 + mod.sortieFilleHookLead({ x: 0, z: 0 }) + (.68 - mod.sortieFilleHookLead({ x: 0, z: 0 })) * (push + .5 * (land - push)), false), end: pose(2, false),
      followerStart: pose(1, true), followerEnd: pose(2, true) };
  }],
  [/^le droit du leader prend un crochet et le gauche du suiveur sort latéralement$/, (c) => {
    const { start, corner, end, followerStart, followerEnd } = c.fille;
    if (Math.abs(corner.feet.R.x - start.feet.R.x + HIP_WIDTH / 2) > 1e-9
      || Math.abs(corner.feet.R.z - start.feet.R.z) > 1e-9
      || Math.abs(end.feet.R.z - end.feet.L.z) > 1e-9
      || followerEnd.feet.L.x - followerStart.feet.L.x < HIP_WIDTH - 1e-9
      || Math.abs(followerEnd.feet.L.z - followerStart.feet.L.z + .06) > 1e-9) {
      throw new Error("crochet et sortie latérale attendus");
    }
  }],
  // #127: the leader's G1 of the hook variant is a virgula (docs/spec-sortie-fille.md).
  [/^on échantillonne la sortie fille au premier pas en variante "(hook|back)"$/, (c, m) => {
    const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
    const pose = (beat, follower, virgula) => mod.sampleSortieFille(beat, follower, rest, m[1], "reference", 1, 0, virgula);
    c.virgula = { rest, on: pose(1, false, true), off: pose(1, false, false), back: pose(3, false, true),
      follower: [0, .25, .5, .75, 1, 1.5, 2, 3].map(beat => [pose(beat, true, true), pose(beat, true, false)]) };
  }],
  [/^le gauche du leader se pose perpendiculaire, aussi loin en avant que le pas droit$/, (c) => {
    const { on, off, back } = c.virgula;
    if (Math.abs(on.feet.L.yaw - Math.PI / 2) > 1e-9) throw new Error(`lacet du G ${on.feet.L.yaw}, attendu π/2`);
    if (Math.abs(on.feet.L.z - off.feet.L.z) > 1e-9) throw new Error("même profondeur attendue que le pas droit");
    if (Math.abs(back.feet.L.yaw) > 1e-9) throw new Error("le G doit revenir pointé vers l'avant à la position 3");
  }],
  [/^le bassin du leader s'ouvre à gauche sans que son buste le suive$/, (c) => {
    const { on, off } = c.virgula;
    if (!(on.rootYaw > .1)) throw new Error(`ouverture du bassin ${on.rootYaw}`);
    // The chest yaw is relative to the pelvis: the pelvis opening is taken back from it.
    if (Math.abs(on.rootYaw + on.chestYaw - off.chestYaw) > 1e-9) throw new Error("le buste doit garder sa direction");
  }],
  [/^le suiveur fait les mêmes pas qu'avec le pas droit$/, (c) => {
    for (const [on, off] of c.virgula.follower)
      if (JSON.stringify(on) !== JSON.stringify(off)) throw new Error("le suiveur ne doit pas changer");
  }],
  [/^le gauche du leader reste pointé vers l'avant$/, (c) => {
    const { on, off } = c.virgula;
    if (on.feet.L.yaw !== 0 || JSON.stringify(on) !== JSON.stringify(off)) throw new Error("la variante recul ne doit pas changer");
  }],
  // #140: game mode, command queue and automatic dance (docs/spec-jeu-file-auto.md).
  [/^le joueur commande "([^"]*)" aux temps "([^"]*)"$/, (c, m) => {
    const figures = m[1].split(",").map(f => f.trim()).filter(Boolean), beats = m[2].split(",").map(b => b.trim()).filter(Boolean).map(Number);
    c.jeu = { plan: mod.guidage.planGuide(figures.map((figure, k) => ({ beat: beats[k], figure })), guideMotionsOf(), 60) };
  }],
  [/^les segments du mode jeu sont "([^"]*)"$/, (c, m) => {
    if (jeuText(c.jeu.plan) !== m[1]) throw new Error(`segments ${jeuText(c.jeu.plan)}`);
  }],
  [/^aucune commande n'est refusée ni perdue$/, (c) => {
    const { outcomes, queue } = c.jeu.plan;
    if (queue.length || !outcomes.every(o => o.status === "dansée")) throw new Error(JSON.stringify(outcomes.map(o => o.status)));
  }],
  [/^le couple danse seul pendant (\d+) temps avec la graine (\d+)$/, (c, m) => {
    const auto = seed => mod.guidage.planGuide([], guideMotionsOf(), Number(m[1]), { modes: [{ beat: 0, auto: true }], seed });
    c.jeu = { plan: auto(Number(m[2])), again: auto(Number(m[2])), other: auto(Number(m[2]) + 1) };
  }],
  [/^chaque segment après le pas de base du début est une figure choisie par le simulateur$/, (c) => {
    const [first, ...rest] = c.jeu.plan.segments;
    if (first.kind !== "base" || first.end !== 4) throw new Error(`début ${first.kind} jusqu'à ${first.end}`);
    if (rest.length < 30) throw new Error(`${rest.length} figures seulement`);
    for (const s of rest) if (s.by !== "auto" || !mod.guidage.GUIDE_FIGURE_KEYS.includes(s.kind)) throw new Error(`${s.kind} par ${s.by} au temps ${s.start}`);
    rest.forEach((s, k) => { if (s.start !== (k ? rest[k - 1].end : 4)) throw new Error(`trou avant le temps ${s.start}`); });
  }],
  [/^la même graine redonne la même danse, une autre graine une autre danse$/, (c) => {
    if (jeuText(c.jeu.plan) !== jeuText(c.jeu.again)) throw new Error("même graine, danse différente");
    if (jeuText(c.jeu.plan) === jeuText(c.jeu.other)) throw new Error("deux graines, même danse");
  }],
  [/^le couple danse seul pendant (\d+) temps avec les graines (\d+) à (\d+)$/, (c, m) => {
    const until = Number(m[1]), phrase = mod.guidage.GUIDE_AUTO.phrase;
    let ends = 0, neutral = 0;
    for (let seed = Number(m[2]); seed <= Number(m[3]); seed++) {
      const starts = new Set(mod.guidage.planGuide([], guideMotionsOf(), until + 10, { modes: [{ beat: 0, auto: true }], seed }).segments.map(s => s.start));
      for (let end = phrase; end <= until; end += phrase) { ends++; if (starts.has(end)) neutral++; }
    }
    c.jeu = { share: neutral / ends };
  }],
  // #152: the draw remembers the figures and the pairs danced lately.
  [/^le couple danse seul pendant (\d+) temps avec les graines (\d+) à (\d+) et le hasard "(\w+)"$/, (c, m) => {
    let figures = 0, longest = 0, pairs = 0;
    for (let seed = Number(m[2]); seed <= Number(m[3]); seed++) {
      const plan = mod.guidage.planGuide([], guideMotionsOf(), Number(m[1]), { modes: [{ beat: 0, auto: true }], seed, variety: m[4] });
      const ids = plan.segments.slice(1).map(s => mod.guidage.guideIdentityOf(s.kind));
      let run = 1;
      ids.forEach((id, i) => {
        figures++; run = i > 0 && id === ids[i - 1] ? run + 1 : 1; longest = Math.max(longest, run);
        if (i > 0) for (let j = Math.max(1, i - 8); j < i; j++) if (ids[j - 1] === ids[i - 1] && ids[j] === id) { pairs++; break; }
      });
    }
    c.jeu = { longest, pairs: pairs / figures };
  }],
  [/^la plus longue série de la même figure est de (\d+) au plus$/, (c, m) => {
    if (c.jeu.longest > Number(m[1])) throw new Error(`série de ${c.jeu.longest}`);
  }],
  [/^une paire de figures déjà enchaînée parmi les 8 précédentes revient moins d'une fois sur (\d+)$/, (c, m) => {
    if (!(c.jeu.pairs < 1 / Number(m[1]))) throw new Error(`part ${c.jeu.pairs}`);
  }],
  [/^une position neutre tombe sur plus de (\d+) % des fins de phrase, et pas sur toutes$/, (c, m) => {
    if (!(c.jeu.share > Number(m[1]) / 100 && c.jeu.share < 1)) throw new Error(`part ${c.jeu.share}`);
  }],
  [/^le couple danse seul avec la graine (\d+) et le joueur commande "([^"]*)" au temps ([\d.]+)$/, (c, m) => {
    const options = { modes: [{ beat: 0, auto: true }], seed: Number(m[1]) };
    c.jeu = { beat: Number(m[3]), figure: m[2],
      plan: mod.guidage.planGuide([{ beat: Number(m[3]), figure: m[2] }], guideMotionsOf(), 80, options),
      alone: mod.guidage.planGuide([], guideMotionsOf(), 80, options) };
  }],
  [/^la commande est dansée à la position neutre qui suit, puis le simulateur reprend$/, (c) => {
    const { plan, alone, beat, figure } = c.jeu;
    const at = plan.segments.findIndex(s => s.by === "commande");
    const s = plan.segments[at], before = plan.segments[at - 1], after = plan.segments[at + 1];
    if (!s || s.kind !== figure) throw new Error("commande non dansée");
    if (!(before.start <= beat && s.start === before.end && s.start >= beat)) throw new Error(`commande au temps ${s.start}`);
    if (after?.by !== "auto") throw new Error("le tirage ne reprend pas");
    for (let k = 0; k < at; k++) if (plan.segments[k].kind !== alone.segments[k].kind) throw new Error("la danse d'avant a changé");
  }],
  // #157: the ginga of the couple dance (docs/spec-ginga-couple.md).
  [/^on lit la phase du ginga sur les appuis du leader dans chaque figure du mode jeu$/, (c) => {
    const rig = guideRig();
    c.ginga = mod.guidage.GUIDE_FIGURE_KEYS.filter(kind => mod.guidage.sampleKind(kind, 0, false, rig).loadR !== undefined).map(kind => {
      const end = mod.guidage.GUIDE_FIGURES[kind].beats, phases = [];
      for (let t = 0; t <= end + 1e-9; t += 1 / 16) phases.push(mod.gingaPhase(`feature:${kind}`, b => mod.guidage.sampleKind(kind, b, false, rig), t));
      return { kind, phases };
    });
    if (c.ginga.length < 8) throw new Error(`${c.ginga.length} figures seulement`);
  }],
  [/^la phase ne recule pas et ne saute pas$/, (c) => {
    for (const { kind, phases } of c.ginga) phases.forEach((p, k) => {
      if (k && !(p >= phases[k - 1] - 0.02 && p - phases[k - 1] < 0.3)) throw new Error(`${kind} : phase ${phases[k - 1]} → ${p}`);
    });
  }],
  [/^chaque figure fait avancer la phase d'au moins un transfert$/, (c) => {
    for (const { kind, phases } of c.ginga) if (!(phases[phases.length - 1] - phases[0] >= 0.9)) throw new Error(`${kind} : ${phases[0]} → ${phases[phases.length - 1]}`);
  }],
  [/^on lit les réglages du ginga du mode jeu$/, (c) => { c.reglages = mod.guidage.GUIDE_GINGA; c.defaut = mod.guidage.GUIDE_GINGA_DEFAULT; }],
  [/^le réglage par défaut balance les hanches et fait rebondir le bassin$/, (c) => {
    const g = c.reglages[c.defaut];
    if (!(g && g.sway > 0 && g.bounce > 0 && g.bounce <= 0.02)) throw new Error(JSON.stringify(g));
  }],
  [/^les réglages vont du plus discret au plus ample, et "sans" l'éteint$/, (c) => {
    const { sans, discret, marque, ample } = c.reglages;
    if (sans !== null) throw new Error("sans n'éteint pas le ginga");
    if (!(discret.sway < marque.sway && marque.sway < ample.sway && discret.bounce < marque.bounce && marque.bounce < ample.bounce)) throw new Error("réglages non ordonnés");
  }],
  // #144: a touch before any step that goes forward or backward (docs/spec-ida-partout.md).
  [/^on échantillonne chaque aller-retour proposé par le mode jeu$/, (c) => {
    const rig = guideRig();
    c.touches = Object.entries(mod.insertion.TOUCH_POSITIONS).flatMap(([kind, touches]) => touches.map(touch => ({ kind, touch,
      sample: (beat, follower) => mod.guidage.sampleSegment(kind, [touch], beat, follower, rig),
      plain: (beat, follower) => mod.guidage.sampleKind(kind, beat, follower, rig) })));
    if (c.touches.length < 12) throw new Error(`${c.touches.length} allers-retours seulement`);
  }],
  [/^le pied part dans le sens de son pas et revient où il était$/, (c) => {
    for (const { kind, touch, sample } of c.touches) for (const follower of [false, true]) {
      const side = (touch.side === "L") !== follower ? "L" : "R", way = (touch.back ? -1 : 1) * (follower ? -1 : 1);
      const held = sample(touch.at, follower).feet[side], out = sample(touch.at + 1, follower).feet[side], back = sample(touch.at + mod.insertion.TOUCH_BEATS, follower).feet[side];
      if (!((out.z - held.z) * way > 0.1)) throw new Error(`${kind}@${touch.at} ${follower ? "suiveur" : "leader"} : le pied ${side} bouge de ${out.z - held.z}`);
      if (Math.hypot(back.x - held.x, back.z - held.z) > 1e-6) throw new Error(`${kind}@${touch.at} : le pied ne revient pas`);
    }
  }],
  [/^le poids est sur l'autre pied au début et à la fin, et la figure reprend avec le même pied$/, (c) => {
    for (const { kind, touch, sample, plain } of c.touches) for (const follower of [false, true]) {
      const side = (touch.side === "L") !== follower ? "L" : "R", end = touch.at + mod.insertion.TOUCH_BEATS;
      const onOther = s => (side === "L" ? s.loadR : 1 - s.loadR);
      for (const beat of [touch.at, end]) {
        const s = sample(beat, follower);
        if (s.loadR !== undefined && !(onOther(s) > 0.95)) throw new Error(`${kind}@${touch.at} ${follower ? "suiveur" : "leader"} : poids ${onOther(s)} au temps ${beat}`);
      }
      // After the touch the figure dances the step it had planned, with the same foot.
      for (const d of [0.3, 0.6, 1]) {
        const a = sample(end + d, follower).feet[side], b = plain(touch.at + d, follower).feet[side];
        if (Math.hypot(a.x - b.x, a.z - b.z) > 1e-9) throw new Error(`${kind}@${touch.at} : la figure ne reprend pas son pas`);
      }
    }
  }],
  // #128: the virgula as a style effect in the pair ida e volta (docs/spec-ida-paire.md).
  [/^on échantillonne l'ida e volta en paire avec la virgula du leader$/, (c) => {
    const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
    const sample = (beat, follower, virgula) => mod.sampleIdaPaire(beat, follower, rest, "quinconce", 0, { side: "L", back: false, virgula });
    const beats = Array.from({ length: 81 }, (_, i) => i / 10);
    c.ida = { leader: beats.map(b => [b, sample(b, false, true), sample(b, false, false)]), follower: beats.map(b => [sample(b, true, true), sample(b, true, false)]) };
  }],
  [/^le gauche du leader est perpendiculaire quand il est sorti en avant, et droit le reste du cycle$/, (c) => {
    for (const [b, on, off] of c.ida.leader) {
      if (b >= mod.IDA_PAIR.out[1] && b <= mod.IDA_PAIR.ret[0] && Math.abs(on.feet.L.yaw - Math.PI / 2) > 1e-9) throw new Error(`lacet ${on.feet.L.yaw} au temps ${b}`);
      if (b >= 2 && JSON.stringify(on) !== JSON.stringify(off)) throw new Error(`leader changé au temps ${b}`);
      if (Math.abs(on.feet.L.z - off.feet.L.z) > 1e-12) throw new Error(`pas changé au temps ${b}`);
    }
  }],
  [/^le suiveur fait les mêmes pas que sans virgula$/, (c) => {
    for (const [on, off] of c.ida.follower) if (JSON.stringify(on) !== JSON.stringify(off)) throw new Error("le suiveur ne doit pas changer");
  }],
  [/^le droit du leader recule et le gauche du suiveur avance en diagonale$/, (c) => {
    const { start, end, followerStart, followerEnd } = c.fille;
    if (!(end.feet.R.z < start.feet.R.z && end.feet.R.x === start.feet.R.x
      && followerEnd.feet.L.z > followerStart.feet.L.z
      && followerEnd.feet.L.x > followerStart.feet.L.x)) {
      throw new Error("recul D et avancée G en diagonale attendus");
    }
  }],
  [/^la sortie garçon est évaluée à la fin des cinq actions$/, (c) => {
    const rest = { L: { x: .071, z: .0017 }, R: { x: -.071, z: .0011 } };
    c.figure = [false, true].map(follower => Array.from({ length: 6 }, (_, beat) => mod.sampleSortieGarcon(beat, follower, rest)));
  }],
  [/^les appuis du leader sont D G D G D D et ceux de la partenaire sont G D G D G G$/, (c) => {
    const expected = [[1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 0, 0]];
    c.figure.forEach((poses, role) => poses.forEach((p, beat) => {
      if (p.loadR !== expected[role][beat]) throw new Error(`appui incorrect rôle ${role}, action ${beat}`);
    }));
  }],
  [/^le gauche du leader croise devant le droit puis le marka reste déchargé$/, (c) => {
    const cross = c.figure[0][3], final = c.figure[0][5];
    if (!(cross.feet.L.x < cross.feet.R.x && cross.feet.L.z > cross.feet.R.z)) throw new Error("croisé avant absent");
    if (final.loadL !== 0 || final.feet.L.lift > 1e-8) throw new Error("marka gauche incorrect");
    // #56: the couple progresses 49 cm (70 % of the validated 70 cm) along the line.
    if (!(final.root.z > .4 && c.figure[1][5].root.z < -.4)) throw new Error("progression du couple perdue");
  }],
  [/^le style "([^"]+)"$/, (c, m) => { if (!STYLES[m[1]]) throw new Error("style inconnu: " + m[1]); c.style = m[1]; }],
  [/^on applique le style sur (\d+) temps à amplitude ([\d.]+) sans déplacement$/, (c, m) => {
    const n = Number(m[1]), amp = Number(m[2]);
    const r = mockRig();
    c.run = { finite: true, minY: Infinity, supportBad: false, minExtra: Infinity, maxExtra: -Infinity };
    for (let b = 0; b <= n; b += 0.05) {
      STYLES[c.style].apply(r, b, amp);
      if (!allFinite(r)) c.run.finite = false;
      r.root.position.y = clampSolY(r.root.position.y, -0.02); // clamp sol du Rig (sommet de pied simulé à -2 cm)
      c.run.minY = Math.min(c.run.minY, r.root.position.y);
      const s = supportOf(c.style, r, b);
      if (!Number.isFinite(s) || s < -1 - 1e-9 || s > 1 + 1e-9) c.run.supportBad = true;
      c.run.minExtra = Math.min(c.run.minExtra, r.extraL, r.extraR);
      c.run.maxExtra = Math.max(c.run.maxExtra, r.extraL, r.extraR);
    }
  }],
  [/^toutes les positions et rotations sont finies$/, (c) => { if (!c.run.finite) throw new Error("valeurs non finies"); }],
  [/^root\.position\.y est superieur ou egal à 0 après le clamp sol$/, (c) => { if (c.run.minY < -1e-12) throw new Error("clamp sol violé: " + c.run.minY); }],
  [/^la charge du pied droit \(support\) reste dans \[-1, 1\]$/, (c) => { if (c.run.supportBad) throw new Error("support hors [-1,1]"); }],
  [/^le pivot sur la plante \(extra\) reste dans \[-0\.05, 0\.35\] rad$/, (c) => { if (c.run.minExtra < -0.05 - 1e-9 || c.run.maxExtra > 0.35 + 1e-9) throw new Error(`extra hors plage: [${c.run.minExtra}, ${c.run.maxExtra}]`); }],
  [/^travel = ([\d.]+)$/, (c, m) => { c.travel = Number(m[1]); }],
  [/^l'amplitude latérale max est 0 m$/, (c) => { if (Math.abs(ampMax(c.travel)) > 1e-12) throw new Error("amplitude non nulle: " + ampMax(c.travel)); }],
  [/^l'amplitude latérale max est entre ([\d.]+) et ([\d.]+) m$/, (c, m) => { const a = ampMax(c.travel); if (a < Number(m[1]) - 1e-9 || a > Number(m[2]) + 1e-9) throw new Error(`amplitude ${a} hors [${m[1]}, ${m[2]}]`); }],
  [/^on évalue sortieOffset pour b de 0 à (\d+) à amplitude ([\d.]+)$/, (c, m) => {
    const n = Number(m[1]), amp = Number(m[2]);
    c.sortie = [];
    for (let b = 0; b <= n; b += 0.01) c.sortie.push({ b, e: sortieEnvelope(b), off: sortieOffset(b, amp) });
  }],
  [/^l'enveloppe est pleine entre les temps 1 et 3 du cycle$/, (c) => {
    for (const s of c.sortie) { const p = ((s.b % 8) + 8) % 8; if (p >= 1 && p <= 3 && Math.abs(s.e - 1) > 1e-9) throw new Error("enveloppe non pleine à p=" + p); }
  }],
  [/^l'enveloppe est nulle à partir du temps 5 du cycle$/, (c) => {
    for (const s of c.sortie) { const p = ((s.b % 8) + 8) % 8; if (p >= 5 && s.e > 1e-9) throw new Error("enveloppe non nulle à p=" + p); }
  }],
  [/^l'enveloppe est périodique de 8 temps$/, (c) => {
    for (let b = 0; b <= 8; b += 0.01) {
      if (Math.abs(sortieEnvelope(b) - sortieEnvelope(b + 8)) > 1e-9) throw new Error("non périodique à b=" + b);
    }
  }],
  [/^sortieOffset est borné entre 0 et ([\d.]+) m$/, (c, m) => {
    for (const s of c.sortie) { if (!Number.isFinite(s.off) || s.off < -1e-9 || s.off > Number(m[1]) + 1e-9) throw new Error("sortieOffset hors [0," + m[1] + "]: " + s.off); }
  }],
  [/^travel = ([\d.]+) et plant = (true|false)$/, (c, m) => { c.travel = Number(m[1]); c.plant = m[2] === "true"; }],
  [/^plantBlend vaut ([\d.]+)$/, (c, m) => { const v = plantBlend(c.travel, c.plant); if (Math.abs(v - Number(m[1])) > 1e-9) throw new Error(`plantBlend=${v}, attendu ${m[1]}`); }],
  [/^on applique chaque style sur (\d+) temps à amplitude ([\d.]+)$/, (c, m) => {
    const n = Number(m[1]), amp = Number(m[2]);
    c.all = { minExtra: Infinity, maxExtra: -Infinity, supportBad: false };
    for (const key of Object.keys(STYLES)) {
      const r = mockRig();
      for (let b = 0; b <= n; b += 0.05) {
        STYLES[key].apply(r, b, amp);
        c.all.minExtra = Math.min(c.all.minExtra, r.extraL, r.extraR);
        c.all.maxExtra = Math.max(c.all.maxExtra, r.extraL, r.extraR);
        const sv = supportOf(key, r, b);
        if (!Number.isFinite(sv) || sv < -1 - 1e-9 || sv > 1 + 1e-9) c.all.supportBad = true;
      }
    }
  }],
  [/^extraL et extraR restent dans \[-0\.05, 0\.35\] rad$/, (c) => { if (c.all.minExtra < -0.05 - 1e-9 || c.all.maxExtra > 0.35 + 1e-9) throw new Error(`extra hors plage: [${c.all.minExtra}, ${c.all.maxExtra}]`); }],
  [/^la charge de chaque pied \(load G\/D\) reste dans \[0, 1\]$/, (c) => { if (c.all.supportBad) throw new Error("charge hors [0,1]"); }],
  [/^les presets cam (.+) sont définis$/, (c, m) => {
    const names = m[1].split(",").map((x) => x.trim().replace(/"/g, ""));
    for (const n of names) if (!CAM_PRESETS[n]) throw new Error("preset cam inconnu: " + n);
  }],
  [/^le mode pair sans preset cam$/, (c) => { c.preset = null; c.isPair = true; }],
  [/^la caméra par défaut est le preset (\w+)$/, (c, m) => {
    const r = resolveCam(c.preset, c.isPair);
    if (JSON.stringify(r) !== JSON.stringify(CAM_PRESETS[m[1]])) throw new Error("défaut != " + m[1]);
  }],
  [/^le paramètre solid = 1$/, (c) => { c.solid = true; }],
  [/^torsoOpacity vaut ([\d.]+)$/, (c, m) => { if (Math.abs(SOLID_TORSO_OPACITY - Number(m[1])) > 1e-9) throw new Error("SOLID_TORSO_OPACITY=" + SOLID_TORSO_OPACITY); }],
  [/^la séquence corridinho sur (\d+) temps$/, (c, m) => { c.n = Number(m[1]); }],
  [/^on évalue la trajectoire de root$/, (c) => {
    c.path = [];
    for (let b = 0; b <= c.n; b += 0.05) { const p = corridinhoPath(b); c.path.push({ b, ...p, finite: [p.x, p.z, p.ry].every(Number.isFinite) }); }
  }],
  [/^les temps 0 à 3 font un quart de tour à droite/, (c) => {
    const pts = c.path.filter((p) => { const q = ((p.b % 16) + 16) % 16; return q < 4; });
    if (pts[0].ry > 0.05) throw new Error("ry initial non nul: " + pts[0].ry);
    const last = pts[pts.length - 1];
    if (Math.abs(last.ry - Math.PI / 2) > 0.06) throw new Error("fin pivot droit ry=" + last.ry);
  }],
  [/^les temps 4 à 7 font un quart de tour à gauche/, (c) => {
    const pts = c.path.filter((p) => { const q = ((p.b % 16) + 16) % 16; return q >= 4 && q < 8; });
    if (Math.abs(pts[0].ry - Math.PI / 2) > 0.06) throw new Error("début pivot gauche ry=" + pts[0].ry);
    if (Math.abs(pts[pts.length - 1].ry) > 0.06) throw new Error("fin pivot gauche ry=" + pts[pts.length - 1].ry);
  }],
  [/^les temps 8 à 15 décrivent un cercle de rayon entre ([\d.]+) et ([\d.]+) m autour du point \(([\d.]+), 0\), en passant par le repère fixe$/, (c, m) => {
    const cx = Number(m[3]), cz = 0;
    for (const p of c.path) {
      const q = ((p.b % 16) + 16) % 16;
      if (q < 8 || q >= 16) continue;
      const d = Math.hypot(p.x - cx, p.z - cz);
      if (Math.abs(d - Number(m[3])) > 0.02) throw new Error("pas sur le cercle à b=" + p.b + " d=" + d);
    }
    if (!(Number(m[1]) <= Number(m[3]) && Number(m[3]) <= Number(m[2]))) throw new Error("rayon hors plage");
  }],
  [/^la trajectoire reste finie$/, (c) => {
    const rows = c.quarts || c.path || [];
    for (const r of rows) if (!r.finite) throw new Error("non fini à b=" + r.b);
  }],
  [/^la trajectoire reste finie et le rayon est borné$/, (c) => {
    for (const p of c.path) if (!p.finite) throw new Error("trajectoire non finie à b=" + p.b);
  }],
  [/^on applique le style puis lockUpperTrunk avec iso = (true|false) sur (\d+) temps à amplitude ([\d.]+)$/, (c, m) => {
    const iso = m[1] === "true", n = Number(m[2]), amp = Number(m[3]);
    const r = mockRig();
    c.isoRun = { maxRes: 0, maxPelvisRoll: 0, minKnee: Infinity, minStab: Infinity };
    for (let b = 0; b <= n; b += 0.05) {
      r.root.position.set(0, 0, 0); r.root.rotation.set(0, 0, 0);
      r.pelvis.position.set(0, HIP_Y, 0); r.pelvis.rotation.set(0, 0, 0);
      r.spine.rotation.set(0, 0, 0); r.lumbar.rotation.set(0, 0, 0); r.thoracic.rotation.set(0, 0, 0);
      r.chest.rotation.set(0, 0, 0); r.head.rotation.set(0, 0, 0);
      r.hipL.rotation.set(0, 0, 0); r.hipR.rotation.set(0, 0, 0);
      r.kneeL.rotation.set(0, 0, 0); r.kneeR.rotation.set(0, 0, 0);
      STYLES[c.style].apply(r, b, amp);
      lockUpperTrunk({ spine: r.spine.rotation, chest: r.chest.rotation, head: r.head.rotation }, r.pelvis.rotation, iso);
      c.isoRun.maxRes = Math.max(c.isoRun.maxRes, Math.abs(residualRoll({ spine: r.spine.rotation, chest: r.chest.rotation }, r.pelvis.rotation)));
      c.isoRun.maxPelvisRoll = Math.max(c.isoRun.maxPelvisRoll, Math.abs(r.pelvis.rotation.z));
      c.isoRun.minKnee = Math.min(c.isoRun.minKnee, r.kneeL.rotation.x, r.kneeR.rotation.x);
      c.isoRun.minStab = Math.min(c.isoRun.minStab, upperStability({ spine: r.spine.rotation, chest: r.chest.rotation }, r.pelvis.rotation));
    }
  }],
  [/^le roll résiduel du thorax reste inférieur à ([\d.]+) rad$/, (c, m) => { if (c.isoRun.maxRes > Number(m[1]) + 1e-9) throw new Error("roll résiduel=" + c.isoRun.maxRes); }],
  [/^le pelvis roule d'au moins ([\d.]+) rad$/, (c, m) => { if (c.isoRun.maxPelvisRoll < Number(m[1]) - 1e-9) throw new Error("pelvis roll=" + c.isoRun.maxPelvisRoll); }],
  [/^les genoux restent fléchis d'au moins ([\d.]+) rad$/, (c, m) => { if (c.isoRun.minKnee < Number(m[1]) - 1e-9) throw new Error("knee min=" + c.isoRun.minKnee); }],
  [/^la stabilité du buste vaut au moins ([\d.]+)$/, (c, m) => { if (c.isoRun.minStab < Number(m[1]) - 1e-9) throw new Error("stabilité min=" + c.isoRun.minStab); }],
  [/^le roll résiduel du thorax n'est pas corrigé \(supérieur au cas iso=1\)$/, (c) => { if (!(c.isoRun.maxRes > 0.03)) throw new Error("iso=false: roll résiduel encore faible: " + c.isoRun.maxRes); }],
  [/^le cadre de bras a les bras vers l'avant et les coudes pliés$/, () => {
    if (!(DANCE_FRAME.upperArm.x < -1)) throw new Error("bras pas vers l'avant: " + DANCE_FRAME.upperArm.x);
    if (!(Math.abs(DANCE_FRAME.forearmLeft.z) > 1.5 && Math.abs(DANCE_FRAME.forearmRight.z) > 1.5)) throw new Error("coudes pas pliés");
  }],
  [/^l'avant-bras gauche est vers le haut$/, () => { if (Math.abs(DANCE_FRAME.forearmLeft.z - Math.PI) > 1e-9) throw new Error("avant-bras G pas en haut: " + DANCE_FRAME.forearmLeft.z); }],
  [/^l'avant-bras droit est vers la gauche, paume vers le buste$/, () => {
    if (!(Math.abs(DANCE_FRAME.forearmRight.z + Math.PI / 2) < 1e-9 && Math.abs(DANCE_FRAME.forearmRight.x - Math.PI) < 1e-9)) throw new Error("avant-bras D mal orienté: " + JSON.stringify(DANCE_FRAME.forearmRight));
  }],
  [/^la séquence quarts de tour sur (\d+) temps$/, (c, m) => { c.n = Number(m[1]); }],
  [/^on évalue quartsPath de 0 à (\d+)$/, (c, m) => {
    c.quarts = [];
    for (let b = 0; b <= Number(m[1]); b += 0.05) { const q = quartsPath(b); c.quarts.push({ b, ry: q.ry, finite: Number.isFinite(q.ry) }); }
  }],
  [/^ry croît de 0 à 2π \(tour complet\)$/, (c) => {
    const first = c.quarts[0], last = c.quarts[c.quarts.length - 1];
    if (Math.abs(first.ry) > 1e-9) throw new Error("ry initial=" + first.ry);
    if (Math.abs(last.ry - 2 * Math.PI) > 0.1) throw new Error("ry final=" + last.ry + " (attendu ~2π)");
    for (let i = 1; i < c.quarts.length; i++) if (c.quarts[i].ry < c.quarts[i - 1].ry - 1e-9) throw new Error("ry non monotone à b=" + c.quarts[i].b);
  }],
  [/^on inverse la trajectoire du corridinho \(reversePath\)$/, (c) => {
    c.rev = [];
    for (let b = 0; b <= 16; b += 0.05) {
      const p = corridinhoPath(b); const q = reversePath(p);
      c.rev.push({ b, x: q.x, z: q.z, ry: q.ry, ok: Math.abs(q.z + p.z) < 1e-9 && Math.abs(q.ry + p.ry) < 1e-9 });
    }
  }],
  [/^z est miroir et ry opposé, et le cercle passe encore par le repère \(0, 0\)$/, (c) => {
    for (const r of c.rev) if (!r.ok) throw new Error("reverse incorrect à b=" + r.b);
    const onCircle = c.rev.filter((r) => { const p = ((r.b % 16) + 16) % 16; return p >= 8 && p < 16; });
    const origin = onCircle.find((r) => Math.abs(r.x) < 0.31 && Math.abs(r.z) < 0.31 && Math.hypot(r.x, r.z) < 0.02 + 0.0001);
    if (!origin) throw new Error("le cercle inversé ne passe pas par le repère (0,0)");
  }],
  [/^on évalue travelOffset avec travel = ([\d.]+), dir = (-?\d+) puis dir = (-?\d+) sur (\d+) temps$/, (c, m) => {
    c.trav = { t: Number(m[1]), d1: Number(m[2]), d2: Number(m[3]), n: Number(m[4]), rows: [] };
    for (let b = 0; b <= c.trav.n; b += 0.05) c.trav.rows.push([travelOffset(c.trav.t, c.trav.d1, b), travelOffset(c.trav.t, c.trav.d2, b)]);
  }],
  [/^travelOffset\(dir=-1\) est l'opposé de travelOffset\(dir=1\) à chaque temps$/, (c) => {
    for (const [a, bb] of c.trav.rows) if (Math.abs(a + bb) > 1e-9) throw new Error("dir=-1 pas opposé: " + a + " vs " + bb);
  }],
  [/^swingBeat avec temps3 a une période de 3 temps$/, () => {
    for (let b = 0; b <= 12; b += 0.25) if (swingBeat(b, true) !== Math.floor(b / 3)) throw new Error("période != 3 à b=" + b);
  }],
  [/^swingBeat sans temps3 a une période de 1 temps$/, () => {
    for (let b = 0; b <= 12; b += 0.25) if (swingBeat(b, false) !== Math.floor(b)) throw new Error("période != 1 à b=" + b);
  }],
  [/^on évalue idaEVoltaStep sur (\d+) temps$/, (c, m) => {
    c.ida = [];
    for (let b = 0; b < Number(m[1]); b += 0.5) c.ida.push({ b, ...idaEVoltaStep(b) });
  }],
  [/^la séquence est L avant, L arrière, R avant, R arrière$/, (c) => {
    const exp = [["L", 1], ["L", -1], ["R", 1], ["R", -1]];
    for (let k = 0; k < 4; k++) {
      const rows = c.ida.filter((r) => Math.floor(((r.b % 8) + 8) % 8 / 2) === k);
      if (!rows.length) throw new Error("pas de lignes pour k=" + k);
      for (const r of rows) if (r.side !== exp[k][0] || r.dir !== exp[k][1]) throw new Error(`b=${r.b}: ${r.side}${r.dir}, attendu ${exp[k]}`);
    }
  }],
  [/^l'état mode=(\w+), style=(\w+), bpm=(\d+), travel=([\d.]+), iso=(true|false), quarts=(true|false), dir=(-?\d+)$/, (c, m) => {
    c.share = { mode: m[1], style: m[2], bpm: Number(m[3]), travel: Number(m[4]), iso: m[5] === "true", quarts: m[6] === "true", dir: Number(m[7]) };
  }],
  [/^on construit l'URL de partage avec la caméra campos=([-\d.,]+) et camtgt=([-\d.,]+)$/, (c, m) => {
    c.url = buildShareUrl("https://example.test/app/", c.share, parseVec3(m[1]), parseVec3(m[2]));
  }],
  [/^l'URL contient (.+)$/, (c, m) => {
    const url = new URL(c.url);
    for (const pair of m[1].split(" et ")) {
      const eq = pair.indexOf("=");
      const k = pair.slice(0, eq), v = pair.slice(eq + 1);
      if (url.searchParams.get(k) !== v) throw new Error(`param ${k}=${url.searchParams.get(k)}, attendu ${v}`);
    }
  }],
  [/^parseVec3\("([^"]*)"\) vaut (\[[^\]]*\]|null)$/, (c, m) => {
    const got = parseVec3(m[1]);
    const exp = m[2] === "null" ? null : JSON.parse(m[2]);
    if (JSON.stringify(got) !== JSON.stringify(exp)) throw new Error(`parseVec3("${m[1]}")=${JSON.stringify(got)}, attendu ${m[2]}`);
  }],
  [/^le danseur à ry = ([-\d.]+) fait face à "(\w+)"( \(diago\))?$/, (c, m) => {
    const s = facingSector(Number(m[1]));
    if (DIR_LABELS[s] !== m[2]) throw new Error(`ry=${m[1]} → ${DIR_LABELS[s]}, attendu ${m[2]}`);
    if ((m[3] !== undefined) !== isDiagonal(s)) throw new Error(`diago mal détecté pour ${m[2]}`);
  }],
  [/^relToLineOfDance\(x=([-\d.]+), z=([-\d.]+)\) donne along=([-\d.]+), across=([-\d.]+)$/, (c, m) => {
    const r = relToLineOfDance(Number(m[1]), Number(m[2]));
    if (Math.abs(r.along - Number(m[3])) > 1e-9 || Math.abs(r.across - Number(m[4])) > 1e-9) throw new Error(JSON.stringify(r));
  }],
  [/^le cadre de la suiveuse a le coude gauche levé et le coude droit baissé$/, () => {
    if (!(DANCE_FRAME_FOLLOWER.upperLeft.x < -1.3)) throw new Error("coude G pas levé: " + DANCE_FRAME_FOLLOWER.upperLeft.x);
    if (!(DANCE_FRAME_FOLLOWER.upperRight.x > -0.8)) throw new Error("coude D pas baissé: " + DANCE_FRAME_FOLLOWER.upperRight.x);
    if (!(DANCE_FRAME_FOLLOWER.foreRight.x < -1.0)) throw new Error("avant-bras D pas ramené vers la main G du guideur");
  }],
  // Phase 11 — vírgula (pied en angle sur les quarts de tour) + URL angle/zoom
  [/^on évalue virgulaFootYawDelta pour foot=([-\d.]+) et corps=([-\d.]+)$/, (c, m) => {
    c.vy = { foot: Number(m[1]), corps: Number(m[2]), delta: virgulaFootYawDelta(Number(m[1]), Number(m[2])) };
  }],
  [/^virgulaFootYawDelta\(foot=([-\d.]+), corps=([-\d.]+)\) vaut ([-\d.]+)$/, (c, m) => {
    const got = virgulaFootYawDelta(Number(m[1]), Number(m[2]));
    if (Math.abs(got - Number(m[3])) > 1e-4) throw new Error(`delta=${got}, attendu ${m[3]}`);
  }],
  [/^après correction le lacet du pied rejoint celui du corps modulo 2π$/, (c) => {
    let d = c.vy.foot + c.vy.delta - c.vy.corps;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (Math.abs(d) > 1e-9) throw new Error(`foot+delta-corps=${d} (mod 2π)`);
  }],
  [/^le cadre danseur a l'avant-bras gauche vers le haut et la paume vers la droite$/, () => {
    const f = DANCE_FRAME.forearmLeft;
    if (Math.abs(f.y - Math.PI / 2) > 1e-9) throw new Error("avant-bras G pas vers le haut: y=" + f.y);
    if (Math.abs(f.z - Math.PI) > 1e-9) throw new Error("paume G pas vers la droite: z=" + f.z);
    const fr = DANCE_FRAME.forearmRight;
    if (Math.abs(fr.x - Math.PI) > 1e-9 || Math.abs(fr.z + Math.PI / 2) > 1e-9) throw new Error("avant-bras D: " + JSON.stringify(fr));
  }],
  [/^le preset caméra "(\w+)"$/, (c, m) => {
    c.preset = CAM_PRESETS[m[1]];
    if (!c.preset) throw new Error("preset inconnu: " + m[1]);
  }],
  [/^resolveView sans override retourne le preset inchangé$/, (c) => {
    if (resolveView(c.preset, null, null) !== c.preset) throw new Error("preset modifié sans override");
  }],
  [/^resolveView avec angle=([-\d.]+) remplace l'azimut et garde la distance$/, (c, m) => {
    const v = resolveView(c.preset, Number(m[1]), null);
    const va = viewAnglesOf(v.position, v.target);
    const exp = ((Number(m[1]) % 360) + 360) % 360;
    if (Math.abs(va.az - exp) > 1e-6) throw new Error(`az=${va.az}, attendu ${exp}`);
    const d0 = viewAnglesOf(c.preset.position, c.preset.target).dist;
    if (Math.abs(va.dist - d0) > 1e-9) throw new Error(`dist=${va.dist}, attendu ${d0}`);
  }],
  [/^resolveView avec zoom=([\d.]+) remplace la distance et garde l'azimut$/, (c, m) => {
    const v = resolveView(c.preset, null, Number(m[1]));
    const va = viewAnglesOf(v.position, v.target);
    if (Math.abs(va.dist - Number(m[1])) > 1e-9) throw new Error(`dist=${va.dist}, attendu ${m[1]}`);
    const az0 = viewAnglesOf(c.preset.position, c.preset.target).az;
    if (Math.abs(va.az - az0) > 1e-9) throw new Error(`az=${va.az}, attendu ${az0}`);
  }],
  [/^viewAnglesOf\(pos=([-\d.,]+), tgt=([-\d.,]+)\) donne az=([-\d.]+), el=([-\d.]+), dist=([-\d.]+)$/, (c, m) => {
    const va = viewAnglesOf(parseVec3(m[1]), parseVec3(m[2]));
    for (const [k, exp] of [["az", m[3]], ["el", m[4]], ["dist", m[5]]]) {
      if (Math.abs(va[k] - Number(exp)) > 0.01) throw new Error(`${k}=${va[k]}, attendu ${exp}`);
    }
    c.va = va;
    c.tgt = parseVec3(m[2]);
  }],
  [/^posFromView est l'inverse de viewAnglesOf$/, (c) => {
    const p = posFromView(c.tgt, c.va.az, c.va.el, c.va.dist);
    const va2 = viewAnglesOf(p, c.tgt);
    if (Math.abs(va2.az - c.va.az) > 1e-6 || Math.abs(va2.el - c.va.el) > 1e-6 || Math.abs(va2.dist - c.va.dist) > 1e-9)
      throw new Error(JSON.stringify({ va2, va: c.va }));
  }],
  [/^on construit l'URL de partage avec campos=([-\d.,]+) camtgt=([-\d.,]+) et la vue courante$/, (c, m) => {
    const cp = parseVec3(m[1]);
    const ct = parseVec3(m[2]);
    const va = viewAnglesOf(cp, ct);
    c.url = buildShareUrl("https://example.test/app/", c.share, cp, ct, { angle: va.az, zoom: va.dist });
    c.va = va;
  }],
  [/^l'URL a des params angle et zoom cohérents avec la caméra$/, (c) => {
    const url = new URL(c.url);
    const a = Number(url.searchParams.get("angle"));
    const z = Number(url.searchParams.get("zoom"));
    if (!Number.isFinite(a) || !Number.isFinite(z)) throw new Error("angle/zoom absents de l'URL");
    if (Math.abs(a - c.va.az) > 0.05) throw new Error(`angle=${a}, attendu ~${c.va.az}`);
    if (Math.abs(z - c.va.dist) > 0.005) throw new Error(`zoom=${z}, attendu ~${c.va.dist}`);
  }],
  // Phase 14 — options de déplacement exclusives + quarts de tour à pas détaillés (vírgula)
  [/^avec corridinho=(\w+), quarts=(\w+), temps3=(\w+), ida=(\w+), movementOf vaut "(\w+)"$/, (c, m) => {
    const got = movementOf({ corridinho: m[1] === "true", quarts: m[2] === "true", temps3: m[3] === "true", ida: m[4] === "true" });
    if (got !== m[5]) throw new Error(`movementOf=${got}, attendu ${m[5]}`);
  }],
  [/^movementFlags\("(\w+)"\) n'active que (\w+)$/, (c, m) => {
    const f = movementFlags(m[1]);
    const n = Object.values(f).filter(Boolean).length;
    if (n !== 1 || !f[m[2]]) throw new Error(`movementFlags(${m[1]})=${JSON.stringify(f)}, attendu uniquement ${m[2]}`);
  }],
  [/^movementFlags\("none"\) n'active aucune option$/, (c) => {
    if (Object.values(movementFlags("none")).some(Boolean)) throw new Error("none doit tout désactiver");
  }],
  [/^movementOf\(movementFlags\("(\w+)"\)\) vaut "(\w+)"$/, (c, m) => {
    if (movementOf(movementFlags(m[1])) !== m[2]) throw new Error("roundtrip flags->movementOf");
  }],
  // Phase 17 — sorties en options exclusives (sortieActive)
  [/^on évalue sortieActive pour le côté "(leader|follower)" et le mouvement "(\w+)" sur (\d+) temps$/, (c, m) => {
    c.sa = { side: m[1], movement: m[2], n: Number(m[3]), vals: [] };
    for (let b = 0; b <= c.sa.n; b += 0.05) c.sa.vals.push({ b, v: sortieActive(c.sa.side, c.sa.movement, b) });
  }],
  [/^sortieActive reste dans \[0, 1\]$/, (c) => {
    for (const { v } of c.sa.vals) if (!Number.isFinite(v) || v < -1e-12 || v > 1 + 1e-12) throw new Error("sortieActive hors [0,1]: " + v);
  }],
  [/^sortieActive est pleine \(1\) entre les temps 1 et 3$/, (c) => {
    for (const { b, v } of c.sa.vals) { const p = ((b % 8) + 8) % 8; if (p >= 1 && p <= 3 && Math.abs(v - 1) > 1e-9) throw new Error("pas pleine à b=" + b); }
  }],
  [/^sortieActive est nulle à partir du temps 5 du cycle de 8$/, (c) => {
    for (const { b, v } of c.sa.vals) { const p = ((b % 8) + 8) % 8; if (p >= 5 && v > 1e-12) throw new Error("non nulle à b=" + b); }
  }],
  [/^sortieActive vaut 0 pour l'autre danseur$/, (c) => {
    for (const { v } of c.sa.vals) if (v > 1e-12) throw new Error("l'autre danseur ne doit pas sortir: " + v);
  }],
  [/^sortieActive du combiné vaut 0 hors de la fenêtre de ce côté$/, (c) => {
    const win = c.sa.side === "leader" ? [0, 8] : [8, 16];
    for (const { b, v } of c.sa.vals) { const p = ((b % 16) + 16) % 16; if (!(p >= win[0] && p < win[1]) && v > 1e-12) throw new Error("combiné: actif hors fenêtre à b=" + b); }
  }],
  [/^sortieActive du combiné est périodique de 16 temps$/, (c) => {
    for (let b = 0; b <= 16; b += 0.05) {
      if (Math.abs(sortieActive(c.sa.side, c.sa.movement, b) - sortieActive(c.sa.side, c.sa.movement, b + 16)) > 1e-9) throw new Error("non périodique 16 à b=" + b);
    }
  }],
  [/^on évalue quartTurnStep sur (\d+) temps$/, (c, m) => {
    const n = Number(m[1]);
    c.qs = [];
    c.qsRev = [];
    for (let b = 0; b <= n + 1e-9; b += 0.125) {
      c.qs.push({ b, ...quartTurnStep(b, false) });
      c.qsRev.push({ b, ...quartTurnStep(b, true) });
    }
  }],
  [/^lowerYaw croît de 0 à ~2π \(tour complet\) et stepSide alterne L, R, L, R$/, (c) => {
    const first = c.qs[0];
    const end = c.qs.filter((r) => r.b > 15.8 && r.b < 16).pop();
    if (Math.abs(first.lowerYaw) > 1e-9) throw new Error("lowerYaw initial=" + first.lowerYaw);
    if (Math.abs(end.lowerYaw - 2 * Math.PI) > 0.2) throw new Error("lowerYaw final=" + end.lowerYaw);
    for (let i = 1; i < c.qs.length; i++) if (c.qs[i].b < 16 && c.qs[i].lowerYaw < c.qs[i - 1].lowerYaw - 1e-9) throw new Error("lowerYaw non monotone à b=" + c.qs[i].b);
    for (let k = 0; k < 8; k++) {
      const rows = c.qs.filter((r) => Math.floor(r.b / 2) === k);
      if (!rows.length || rows[0].stepSide !== (k % 2 === 0 ? "L" : "R")) throw new Error(`stepSide au demi-pas ${k}: ${rows[0] && rows[0].stepSide}`);
    }
  }],
  [/^pendant le demi-pas 0 la dissociation upperYaw-lowerYaw atteint ~π\/2 en fin de demi-pas$/, (c) => {
    const maxD = Math.max(...c.qs.filter((r) => r.half === 0).map((r) => r.upperYaw - r.lowerYaw));
    if (Math.abs(maxD - Math.PI / 2) > 0.12) throw new Error("max dissociation demi-pas 0 = " + maxD + " (attendu ~π/2=" + (Math.PI / 2) + ")");
  }],
  [/^pendant le demi-pas 1 lowerYaw rattrape upperYaw \(dissociation retombe à 0 en fin de quart\)$/, (c) => {
    const fins = c.qs.filter((r) => r.half === 1 && (r.b % 4) > 3.8);
    for (const r of fins) if (Math.abs(r.upperYaw - r.lowerYaw) > 0.12) throw new Error(`dissociation non nulle en fin de quart b=${r.b}: ${r.upperYaw - r.lowerYaw}`);
  }],
  [/^le pied G a un lacet de th0\+π\/2 pendant chaque demi-pas 0$/, (c) => {
    for (const r of c.qs.filter((x) => x.half === 0)) {
      const th0 = (r.q * Math.PI) / 2;
      if (Math.abs(r.footL.yaw - (th0 + Math.PI / 2)) > 1e-9) throw new Error(`b=${r.b}: footL.yaw=${r.footL.yaw}, attendu ${th0 + Math.PI / 2}`);
    }
  }],
  [/^après 4 quarts les pieds retrouvent leur position initiale \(tol ([\d.]+)\)$/, (c, m) => {
    const tol = Number(m[1]);
    const last = c.qs.filter((r) => r.b > 15.8 && r.b < 16).pop();
    if (Math.abs(last.footL.x - 0.084) > tol || Math.abs(last.footL.z - 0.09) > tol)
      throw new Error("footL final=" + JSON.stringify(last.footL) + " (attendu ~(0.084, 0.09))");
    if (Math.abs(last.footR.x + 0.084) > tol || Math.abs(last.footR.z - 0.09) > tol)
      throw new Error("footR final=" + JSON.stringify(last.footR) + " (attendu ~(-0.084, 0.09))");
  }],
  [/^en reverse lowerYaw est l'opposé et z des pieds est miroir$/, (c) => {
    for (let i = 0; i < c.qs.length; i++) {
      const a = c.qs[i];
      const b2 = c.qsRev[i];
      if (Math.abs(b2.lowerYaw + a.lowerYaw) > 1e-9) throw new Error("lowerYaw reverse à b=" + a.b);
      // rôles G/D échangés en reverse : footL(reverse) = miroir de footR(normal)
      if (Math.abs(b2.footL.z + a.footR.z) > 1e-9 || Math.abs(b2.footL.yaw + a.footR.yaw) > 1e-9) throw new Error("footL reverse à b=" + a.b);
      if (Math.abs(b2.footR.z + a.footL.z) > 1e-9) throw new Error("footR reverse à b=" + a.b);
    }
  }],
  [/^au demi-pas 0 du premier quart footL\.z - footR\.z vaut ~([\d.]+)/, (c, m) => {
    const r = c.qs.find((x) => x.q === 0 && x.half === 0);
    const d = r.footL.z - r.footR.z;
    if (Math.abs(d - Number(m[1])) > 0.01) throw new Error(`footL.z-footR.z=${d}, attendu ~${m[1]} (bout du pied D)`);
  }],
  [/^en reverse le demi-pas 0 est du pied R \(et le demi-pas 1 du pied L\)$/, (c) => {
    const h0 = c.qsRev.filter((r) => r.half === 0);
    const h1 = c.qsRev.filter((r) => r.half === 1);
    if (!h0.length || h0.every((r) => r.stepSide !== "R")) throw new Error("demi-pas 0 reverse pas pied R");
    if (!h1.length || h1.every((r) => r.stepSide !== "L")) throw new Error("demi-pas 1 reverse pas pied L");
  }],
  // Phase 15 — contacts de la paire, posture par style, contraposition ida (spec-phase15-paire.md)
  [/^en paire \(PAIR_DZ\) les points de contact frontaux \(z=([\d.]+), ([\d.]+), ([\d.]+)\) sont à moins de ([\d.]+) m$/, (c, m) => {
    for (const z of [Number(m[1]), Number(m[2]), Number(m[3])]) {
      const gap = 2 * (PAIR_DZ - z); // leader à -PAIR_DZ, suiveur (miroir rotY π) à +PAIR_DZ
      if (Math.abs(gap) >= Number(m[4])) throw new Error(`écart=${gap} pour marqueur z=${z} (>= ${m[4]})`);
    }
  }],
  [/^les 6 styles ont une posture finie dans les bornes$/, () => {
    for (const [k, s] of Object.entries(STYLES)) {
      const p = s.posture;
      if (!p || !Number.isFinite(p.lean) || !Number.isFinite(p.knee)) throw new Error(`${k}: posture manquante`);
      if (p.knee < 0 || p.knee > 0.5) throw new Error(`${k}: knee=${p.knee} hors [0, 0.5]`);
      if (p.lean < -0.3 || p.lean > 0.3) throw new Error(`${k}: lean=${p.lean} hors [-0.3, 0.3]`);
    }
  }],
  [/^tarraxinha\.knee > kizomba\.knee > zouk\.knee et zouk\.lean < 0$/, () => {
    if (!(STYLES.tarraxinha.posture.knee > STYLES.kizomba.posture.knee)) throw new Error("tarraxinha.knee <= kizomba.knee");
    if (!(STYLES.kizomba.posture.knee > STYLES.zouk.posture.knee)) throw new Error("kizomba.knee <= zouk.knee");
    if (!(STYLES.zouk.posture.lean < 0)) throw new Error("zouk.lean >= 0 (cambré attendu < 0)");
  }],
  [/^on évalue idaContra sur (\d+) temps$/, (c, m) => {
    c.ic = [];
    for (let b = 0; b <= Number(m[1]) + 1e-9; b += 0.125) c.ic.push({ b, ...idaContra(b) });
  }],
  [/^pendant chaque pas upperYaw et lowerYaw sont de signes opposés$/, (c) => {
    for (const r of c.ic) {
      const ph = (r.b % 2) / 2;
      if (ph > 0.05 && ph < 0.95 && r.upperYaw * r.lowerYaw >= 0)
        throw new Error(`pas d'opposition à b=${r.b}: upper=${r.upperYaw} lower=${r.lowerYaw}`);
    }
  }],
  [/^entre les pas upperYaw et lowerYaw retombent à 0$/, (c) => {
    for (const r of c.ic) {
      const ph = (r.b % 2) / 2;
      if ((ph < 0.05 || ph > 0.95) && (Math.abs(r.upperYaw) > 0.02 || Math.abs(r.lowerYaw) > 0.02))
        throw new Error(`non nul entre les pas à b=${r.b}: ${JSON.stringify(r)}`);
    }
  }],
  // Phase 12 — os du genou bien placés et symétriques (docs/spec-phase12-os-genou.md)
  [/^on lit le GLB anatomy\.glb$/, (c) => {
    const buf = readFileSync(join(root, "public", "anatomy.glb"));
    const clen = buf.readUInt32LE(12);
    c.glb = JSON.parse(buf.subarray(20, 20 + clen).toString("utf8"));
    c.byName = Object.fromEntries(c.glb.nodes.map((n) => [n.name, n]));
  }],
  [/^les paires R\/L sont symétriques en translation \(tolérance ([\d.]+)\)$/, (c, m) => {
    const tol = Number(m[1]);
    for (const base of ["HipPivot", "HipBone", "Femur", "KneePivot", "AnklePivot", "Tibia", "Fibula", "Patella", "Foot"]) {
      const r = c.byName[`${base}_R`];
      const l = c.byName[`${base}_L`];
      if (!r || !l) throw new Error(`paire manquante: ${base}`);
      const tr = r.translation || [0, 0, 0];
      const tl = l.translation || [0, 0, 0];
      if (Math.abs(tr[0] + tl[0]) > tol || Math.abs(tr[1] - tl[1]) > tol || Math.abs(tr[2] - tl[2]) > tol)
        throw new Error(`${base}: t_R=${tr} vs t_L=${tl} (miroir x attendu)`);
    }
  }],
  [/^les tibias ont un maillage long \(y > ([\d.]+)\) au mi-tibia \(t\.y < -([\d.]+)\)$/, (c, m) => {
    for (const sd of ["R", "L"]) {
      const n = c.byName[`Tibia_${sd}`];
      if (2 * n.scale[1] <= Number(m[1])) throw new Error(`Tibia_${sd} maillage trop petit: ${n.scale}`);
      if (!(n.translation[1] < -Number(m[2]))) throw new Error(`Tibia_${sd} pas au mi-tibia: ${n.translation}`);
    }
  }],
  [/^les patellas ont un petit maillage \(y < ([\d.]+)\) au front du genou \(t\.y > -([\d.]+), t\.z > ([\d.]+)\)$/, (c, m) => {
    for (const sd of ["R", "L"]) {
      const n = c.byName[`Patella_${sd}`];
      if (!(2 * n.scale[1] < Number(m[1]))) throw new Error(`Patella_${sd} maillage trop gros: ${n.scale}`);
      if (!(n.translation[1] > -Number(m[2]) && n.translation[2] > Number(m[3])))
        throw new Error(`Patella_${sd} pas au front du genou: ${n.translation}`);
    }
  }],
  [/^les fibulas ont un maillage long \(y > ([\d.]+)\) côté externe \(\|t\.x\| > ([\d.]+)\) au mi-tibia \(t\.y < -([\d.]+)\)$/, (c, m) => {
    for (const sd of ["R", "L"]) {
      const n = c.byName[`Fibula_${sd}`];
      if (!(2 * n.scale[1] > Number(m[1]))) throw new Error(`Fibula_${sd} maillage trop petit: ${n.scale}`);
      if (!(Math.abs(n.translation[0]) > Number(m[2]) && n.translation[1] < -Number(m[3])))
        throw new Error(`Fibula_${sd} pas côté externe mi-tibia: ${n.translation}`);
    }
  }],
  [/^le GLB place patella et fibula au niveau du genou$/, () => {
    const buf = readFileSync(join(root, "public", "anatomy.glb"));
    const clen = buf.readUInt32LE(12);
    const gltf = JSON.parse(buf.subarray(20, 20 + clen).toString("utf8"));
    const nodes = gltf.nodes;
    const byName = Object.fromEntries(nodes.map((n) => [n.name, n]));
    for (const sd of ["R", "L"]) {
      const knee = byName[`KneePivot_${sd}`];
      const kids = knee.children.map((i) => nodes[i]);
      const shin = kids.find((n) => n.translation && Math.abs(n.translation[1]) > 0.15);
      const patella = kids.find((n) => n.translation && n.translation[1] > -0.05 && n.translation[2] > 0.02);
      const fibula = kids.find((n) => n.name.startsWith("Fibula"));
      if (!shin) throw new Error(`pas de tibia long sous KneePivot_${sd}`);
      if (!patella) throw new Error(`pas de patella au genou sous KneePivot_${sd}: ` + JSON.stringify(kids.map((k) => k.translation)));
      if (!fibula || Math.abs(fibula.translation[0]) > 0.05) throw new Error(`fibula ${sd} trop latérale: ` + JSON.stringify(fibula && fibula.translation));
    }
  }],
  [/^clampSolY\(([-\d.]+), ([-\d.]+)\) vaut ([-\d.]+)$/, (c, m) => {
    const v = clampSolY(Number(m[1]), Number(m[2]));
    if (Math.abs(v - Number(m[3])) > 1e-9) throw new Error(`clampSolY(${m[1]}, ${m[2]}) = ${v}, attendu ${m[3]}`);
  }],
  [/^on \u00e9value swingLift pour t de 0 \u00e0 1 \u00e0 lift ([\d.]+)$/, (c, m) => {
    c.sw = [];
    for (let t = 0; t <= 1; t += 0.005) c.sw.push(swingLift(t, Number(m[1])));
  }],
  [/^swingLift reste superieur ou egal \u00e0 0$/, (c) => {
    for (const v of c.sw) if (v < -1e-12) throw new Error("swingLift n\u00e9gatif: " + v);
  }],
];

// ---------- exécution ----------
const featuresDir = join(root, "docs", "features");
const files = readdirSync(featuresDir).filter((f) => f.endsWith(".feature")).sort();
let pass = 0, fail = 0, skip = 0;
for (const f of files) {
  const scenarios = parseFeature(readFileSync(join(featuresDir, f), "utf8"));
  for (const sc of scenarios) {
    const expanded = sc.examples
      ? sc.examples.map((ex) => ({ ...sc, name: Object.entries(ex).reduce((acc, [k, v]) => acc.replaceAll(`<${k}>`, v), sc.name), steps: sc.steps.map((s) => Object.entries(ex).reduce((a, [k, v]) => a.replaceAll(`<${k}>`, v), s)) }))
      : [sc];
    for (const ex of expanded) {
      const label = `${f} :: ${ex.name}`;
      if (ex.tags.includes("wip")) {
        skip++;
        console.log(`[SKIP @wip] ${label}`);
        continue;
      }
      const ctx = {};
      try {
        for (const stepText of ex.steps) {
          const hit = steps.find(([re]) => re.test(stepText));
          if (!hit) throw new Error("step non reconnu: " + stepText);
          hit[1](ctx, hit[0].exec(stepText));
        }
        pass++;
        console.log(`[PASS] ${label}`);
      } catch (e) {
        fail++;
        console.error(`[FAIL] ${label}\n       ${e.message}`);
      }
    }
  }
}
console.log(`\nGherkin: ${pass} PASS, ${fail} FAIL, ${skip} SKIP (@wip) sur ${files.length} fichiers`);
process.exit(fail ? 1 : 0);
