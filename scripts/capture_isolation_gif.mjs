#!/usr/bin/env node
// GIF en boucle d'un exercice d'isolation (#206, docs/spec-isolations.md) : un huit, sans image tenue à la fin (la
// dernière image enchaîne sur la première), le compte des temps (1 à 8) écrit en bas, le temps en cours allumé.
// Plusieurs adresses : les candidats côte à côte, même caméra, même temps, une lettre au-dessus de chacun.
// Une seule page chargée par adresse : l'horloge de danse est retrouvée par les fibres React (comme
// scripts/capture_session_gif.mjs) et placée sur le temps de chaque image. Rendu par la carte graphique.
// Usage : CHROME_PATH=... BPM=96 FPS=10 node scripts/capture_isolation_gif.mjs sortie.gif "<adresse sans sortieBeat>" ["<adresse 2>" ...]
//   LABELS="A|B|C" : lettres au-dessus des colonnes. WIDTH=400 : largeur d'une colonne dans le GIF.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ffmpegPath = require("ffmpeg-static");
const [out, ...urls] = process.argv.slice(2);
const bpm = Number(process.env.BPM ?? 96), fps = Number(process.env.FPS ?? 10), width = Number(process.env.WIDTH ?? 400);
const labels = process.env.LABELS ? process.env.LABELS.split("|") : [];
const n = Math.round(8 * 60 / bpm * fps);
const font = fileURLToPath(new URL("../public/fonts/DejaVuSans-Bold-latin.ttf", import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl", "--hide-scrollbars"] });
const dirs = [];
for (const [k, url] of urls.entries()) {
  const dir = `${out}.frames${k}`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); dirs.push(dir);
  const page = await browser.newPage({ viewport: { width: 560, height: 600 } });
  page.setDefaultTimeout(300000);
  await page.goto(`${url}&sortieBeat=0`, { waitUntil: "load", timeout: 300000 });
  await page.waitForSelector("canvas");
  const shot = () => page.locator("canvas").first().screenshot();
  const settled = async (heavy = 0) => { let previous = null; for (let i = 0; i < 400; i++) { await page.waitForTimeout(120); const png = await shot(); if (previous && png.equals(previous) && png.length > heavy) return png; previous = png; } throw new Error("never settled"); };
  await settled(60000);
  const found = await page.evaluate(() => {
    const isClock = v => v && typeof v === "object" && typeof v.beat === "number" && typeof v.revision === "number" && "exportFrame" in v;
    const dom = document.querySelector("canvas");
    const key = Object.keys(dom).find(k => k.startsWith("__reactFiber$"));
    for (let fiber = dom[key]; fiber; fiber = fiber.return)
      for (let hook = fiber.memoizedState, i = 0; hook && typeof hook === "object" && i < 200; hook = hook.next, i++) {
        const m = hook.memoizedState;
        for (const v of [m, m?.current, ...(Array.isArray(m) ? m : [])]) if (isClock(v)) { window.__captureClock = v; return v.beat; }
      }
    return null;
  });
  if (found === null) throw new Error("dance clock not found");
  for (let i = 0; i < n; i++) {
    await page.evaluate(b => new Promise(resolve => { const c = window.__captureClock; c.beat = b; c.revision++;
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); }), i * 8 / n);
    writeFileSync(`${dir}/f${String(i).padStart(3, "0")}.png`, await settled());
  }
  await page.close();
  console.log("frames", k + 1, "/", urls.length, n);
}
await browser.close();
// Colonnes côte à côte, puis le compte des temps : « 1 2 3 4 5 6 7 8 », le temps en cours en clair.
const inputs = dirs.flatMap(d => ["-framerate", String(fps), "-i", `${d}/f%03d.png`]);
// Chaque chiffre à sa place, éteint ; celui du temps en cours allumé par-dessus (pas de mesure de police).
const size = 22, pitch = 26, total = width * urls.length, x0 = Math.round((total - 7 * pitch - 14) / 2);
const scaled = dirs.map((_, k) => `[${k}:v]scale=${width}:-2:flags=lanczos${labels[k] ? `,drawtext=fontfile=${font}:text=${labels[k]}:fontsize=26:fontcolor=white:x=14:y=12` : ""}[c${k}]`).join(";");
const stacked = dirs.length > 1 ? `${dirs.map((_, k) => `[c${k}]`).join("")}hstack=inputs=${dirs.length}[s]` : "[c0]null[s]";
const digit = (i, on) => `drawtext=fontfile=${font}:text=${i + 1}:fontsize=${size}:fontcolor=${on ? "0xf8fafc" : "0x475569"}:x=${x0 + i * pitch}:y=14`
  + (on ? `:enable='eq(floor(n*8/${n}),${i})'` : "");
const counts = `[s]${[...Array(8).keys()].flatMap(i => [digit(i, false), digit(i, true)]).join(",")}[t]`;
execFileSync(ffmpegPath, ["-y", ...inputs, "-filter_complex", `${scaled};${stacked};${counts};[t]split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, "-loop", "0", out], { stdio: "ignore" });
if (!process.env.KEEP) for (const d of dirs) rmSync(d, { recursive: true, force: true });
console.log("ok", out, n, "images par boucle");
