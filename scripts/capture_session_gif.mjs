#!/usr/bin/env node
// GIF du mode jeu à partir d'UN SEUL chargement de page (#159). La page est ouverte en mode capture
// (`sortieBeat`, horloge à l'arrêt) ; l'horloge de danse partagée est retrouvée par les fibres React et
// placée sur le temps de chaque image. Chaque image est donc la pose que l'app montre à ce temps : vérifié,
// en rendu logiciel l'image est identique à l'octet près à celle de `capture_figure_gif.mjs`, qui recharge
// la page à chaque image (une minute par image sur une machine chargée, contre une seconde ici).
// Rendu par la carte graphique par défaut ; SOFTWARE=1 pour le rendu logiciel (SwiftShader).
// Usage : CHROME_PATH=... BPM=90 node scripts/capture_session_gif.mjs out.gif "<URL sans sortieBeat>" <temps de départ> <temps> [images/s]
//   Mode jeu : l'URL du mode jeu (la page ajoute `sortieBeat`, qui met l'horloge à l'arrêt).
//   App de comparaison (danseur seul) : ajouter `playing=0` à l'URL.
//   HEAVY=<octets> : poids de la première image attendue (60 000 par défaut ; plus bas pour une vue légère, os seuls).
//   CHECK=temps,chemin.png enregistre aussi l'image de ce temps (à comparer à une image prise avec sortieBeat=temps).
// Fragile par nature (structure interne de React) : quand le mode `film=1` (#155) sera fusionné, préférer
// son interface `window.__film`.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ffmpegPath = require("ffmpeg-static");
const [out, url, fromArg, beatsArg, fpsArg] = process.argv.slice(2);
const from = Number(fromArg), beats = Number(beatsArg), fps = Number(fpsArg ?? 6), bpm = Number(process.env.BPM ?? 90);
const dir = out + '.frames'; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: process.env.SOFTWARE ? ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl", "--hide-scrollbars"] });
const page = await browser.newPage({ viewport: { width: 560, height: 600 } });
page.setDefaultTimeout(300000);
await page.goto(`${url}&sortieBeat=${from.toFixed(4)}`, { waitUntil: "load", timeout: 300000 });
await page.waitForSelector("canvas");
const shot = () => page.locator("canvas").first().screenshot();
const settled = async (heavy = 0) => { let previous = null; for (let k = 0; k < 400; k++) { await page.waitForTimeout(150); const png = await shot(); if (previous && png.equals(previous) && png.length > heavy) return png; previous = png; } throw new Error('never settled'); };
// The first image is taken once the models are drawn: an image this heavy (bytes). A light view (bones alone, in
// profile) is lighter: HEAVY=<bytes> lowers it.
await settled(Number(process.env.HEAVY ?? 60000));
// The shared dance clock ({ beat, exportFrame, revision }) lives in a hook of a component above the canvas.
const found = await page.evaluate(() => {
  const isClock = v => v && typeof v === 'object' && typeof v.beat === 'number' && typeof v.revision === 'number' && 'exportFrame' in v;
  const dom = document.querySelector('canvas');
  const key = Object.keys(dom).find(k => k.startsWith('__reactFiber$'));
  for (let fiber = dom[key]; fiber; fiber = fiber.return) {
    for (let hook = fiber.memoizedState, n = 0; hook && typeof hook === 'object' && n < 200; hook = hook.next, n++) {
      const m = hook.memoizedState;
      // The clock is kept by `useMemo` (a [value, deps] pair) in the game view, by `useRef` in the solo app.
      for (const v of [m, m?.current, ...(Array.isArray(m) ? m : [])]) if (isClock(v)) { window.__captureClock = v; return v.beat; }
    }
  }
  return null;
});
if (found === null) throw new Error('dance clock not found');
console.log('clock found at beat', found);
const seek = async beat => {
  await page.evaluate(b => new Promise(resolve => { const c = window.__captureClock; c.beat = b; c.revision++;
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); }), beat);
  return settled();
};
const n = Math.round(beats * 60 / bpm * fps);
const check = process.env.CHECK?.split(',');
if (check) writeFileSync(check[1], await seek(Number(check[0])));
for (let i = 0; i <= n; i++) {
  const beat = from + Math.min(beats, i * beats / n);
  writeFileSync(`${dir}/f${String(i).padStart(3, '0')}.png`, await seek(beat));
  if (i % 8 === 0) console.log('frame', i, '/', n, 'beat', beat.toFixed(3));
}
for (let k = 1; k <= fps; k++) execFileSync('cp', [`${dir}/f${String(n).padStart(3, '0')}.png`, `${dir}/f${String(n + k).padStart(3, '0')}.png`]);
await browser.close();
execFileSync(ffmpegPath, ["-y", "-framerate", String(fps), "-i", `${dir}/f%03d.png`, "-vf", "scale=440:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4", "-loop", "0", out], { stdio: "ignore" });
rmSync(dir, { recursive: true, force: true });
console.log('ok', out, n + 1, 'frames');
