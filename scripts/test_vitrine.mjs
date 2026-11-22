#!/usr/bin/env node
// Vitrine (#150, docs/spec-vitrine-danse-auto.md) : réglages déduits de l'URL, tempo de la danse
// automatique, lien de partage. Sans navigateur : l'interface (GuidageApp.tsx) n'est pas exercée ici.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { readFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = new URL("./.test-vitrine-bundle.mjs", import.meta.url);
buildSync({
  stdin: { contents: ["vitrine", "music/recordings", "music/patterns", "styles", "muscles"].map((n) => `export * from "./src/${n}";`).join("\n"), resolveDir: root },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent",
});
const api = await import(bundle.href);
unlinkSync(bundle);
const { vitrineSettings, listenBpm, danceBpm, openingBpm, showcaseLook, vitrineUrl, vitrineEmbed, GUIDE_BPM,
  RECORDINGS, recordingTempo, MUSIC_STYLES, STYLES, trunkBlocksVisible } = api;
const settings = (q) => vitrineSettings(new URLSearchParams(q));

// ---------------------------------------------------------------- 1. réglages déduits de l'URL
{
  const jeu = settings("mode=pair&guidage=1");
  assert.deepEqual(jeu, { vitrine: false, auto: false, muscles: true, leaderView: true, bpm: null }, "mode jeu : écoute, muscles affichés, vue du guideur");
  assert.equal(settings("guidage=1&vue=libre").leaderView, false);
  assert.equal(settings("guidage=1&auto=1").auto, true);
  assert.equal(settings("guidage=1&muscles=1").muscles, true);
  assert.equal(settings("guidage=1&muscles=0").muscles, false, "muscles=0 masque les muscles");

  const vitrine = settings("vitrine=1");
  assert.deepEqual(vitrine, { vitrine: true, auto: true, muscles: true, leaderView: false, bpm: null }, "vitrine : danse automatique, muscles affichés, vue libre");
  assert.equal(settings("vitrine=1&vue=guideur").leaderView, true, "vitrine : vue du guideur sur demande");
  assert.equal(settings("vitrine=0").vitrine, false);

  assert.equal(settings("vitrine=1&bpm=90").bpm, 90);
  for (const bad of ["bpm=abc", "bpm=20", "bpm=500", "bpm="]) assert.equal(settings(`vitrine=1&${bad}`).bpm, null, `${bad} ignoré`);
  console.log("PASS vitrine : réglages déduits de l'URL");
}

// ---------------------------------------------------------------- 2. tempo
{
  const avecPiste = Object.keys(RECORDINGS);
  const sansPiste = Object.keys(STYLES).filter((k) => !RECORDINGS[k]);
  for (const style of avecPiste) {
    const tempo = recordingTempo(RECORDINGS[style]);
    assert.ok(tempo >= GUIDE_BPM.min && tempo <= GUIDE_BPM.max, `${style} : tempo de la piste dans la plage du mode jeu`);
    assert.equal(danceBpm(settings("vitrine=1"), style), tempo, `${style} : la vitrine prend le tempo de la piste`);
    assert.equal(danceBpm(settings("guidage=1&auto=1"), style), tempo, `${style} : la danse automatique du mode jeu aussi`);
    assert.equal(openingBpm(settings("vitrine=1"), style), tempo, `${style} : tempo à l'ouverture de la vitrine`);
    assert.equal(openingBpm(settings("guidage=1"), style), GUIDE_BPM.listen, `${style} : l'écoute garde son tempo`);
    assert.equal(danceBpm(settings("vitrine=1&bpm=90"), style), null, "un bpm= dans l'URL l'emporte");
    assert.equal(openingBpm(settings("vitrine=1&bpm=90"), style), 90);
  }
  for (const style of sansPiste) {
    const conseil = Math.max(GUIDE_BPM.min, Math.min(GUIDE_BPM.max, MUSIC_STYLES[style].bpm.default));
    assert.equal(danceBpm(settings("vitrine=1"), style), conseil, `${style} : sans piste, la vitrine prend le tempo conseillé du style`);
    assert.equal(danceBpm(settings("guidage=1&auto=1"), style), null, `${style} : sans piste, le mode jeu garde son tempo`);
    assert.equal(openingBpm(settings("guidage=1&auto=1"), style), GUIDE_BPM.listen);
  }
  assert.equal(listenBpm(settings("guidage=1&bpm=75")), 75);
  assert.equal(listenBpm(settings("guidage=1")), GUIDE_BPM.listen);
  console.log(`PASS vitrine : tempo de la piste en danse automatique (${avecPiste.length} style(s) avec piste, ${sansPiste.length} sans)`);
}

// ---------------------------------------------------------------- 3. esthétique
{
  // #173 : le mode jeu montre les muscles, en écoute comme en danse automatique, et le tronc n'a plus de bloc gris.
  for (const [q, auto] of [["guidage=1", false], ["guidage=1", true], ["vitrine=1", true], ["guidage=1&muscles=1", false]]) {
    const look = showcaseLook(settings(q), auto);
    assert.deepEqual(look, { muscles: true, solidTorso: false }, `${q}, auto=${auto} : muscles, pas de buste plein`);
    assert.equal(trunkBlocksVisible(look.muscles), false, `${q}, auto=${auto} : aucun bloc gris sur le tronc`);
  }
  // `muscles=0` : le buste stylisé revient, translucide en écoute, lisible en danse automatique.
  assert.deepEqual(showcaseLook(settings("guidage=1&muscles=0"), false), { muscles: false, solidTorso: false });
  assert.deepEqual(showcaseLook(settings("vitrine=1&muscles=0"), true), { muscles: false, solidTorso: true });
  assert.equal(trunkBlocksVisible(false), true, "sans les muscles, les blocs gris du tronc sont dessinés");
  console.log("PASS vitrine : muscles affichés et tronc sans bloc gris dans tout le mode jeu ; muscles=0 rend le buste stylisé");
}

// ---------------------------------------------------------------- 4. lien direct
{
  const url = vitrineUrl("https://exemple.test/app/", { style: "kizomba", graine: 123456 });
  assert.equal(url, "https://exemple.test/app/?vitrine=1&style=kizomba&graine=123456");
  const p = new URL(url).searchParams;
  assert.deepEqual([...p.keys()], ["vitrine", "style", "graine"], "le lien ne porte que la vitrine, le style et la graine");
  assert.deepEqual(vitrineSettings(p), settings("vitrine=1"), "rouvert, le lien donne les réglages de la vitrine");
  assert.equal(vitrineUrl("https://exemple.test/app/?mode=pair&guidage=1&auto=1", { style: "semba", graine: 7.9 }),
    "https://exemple.test/app/?vitrine=1&style=semba&graine=7", "les paramètres du mode jeu ne fuient pas dans le lien");
  const embed = vitrineEmbed(url, "Kizomba en 3D");
  assert.match(embed, /^<iframe src="https:\/\/exemple\.test\/app\/\?vitrine=1&style=kizomba&graine=123456" title="Kizomba en 3D" allow="autoplay"/);
  const spec = readFileSync(new URL("../docs/spec-vitrine-danse-auto.md", import.meta.url), "utf8");
  assert.ok(spec.includes("?vitrine=1") && spec.includes("<iframe"), "la spec donne le lien et le fragment d'intégration");
  console.log("PASS vitrine : lien direct (style et graine), fragment d'intégration");
}
