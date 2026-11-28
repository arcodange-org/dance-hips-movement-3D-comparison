#!/usr/bin/env node
// Gros plans immobiles (PNG) de la cheville et du pied, os et muscles (#229) : une image par adresse, à un temps donné,
// puis une planche (une ligne par vue, une colonne par adresse), chaque image titrée.
// Une seule page chargée par adresse ; l'horloge de danse est retrouvée par les fibres React (comme
// scripts/capture_isolation_gif.mjs) et placée sur le temps voulu.
// Usage : CHROME_PATH=... node scripts/capture_cheville.mjs planche.png COLS "titre|adresse|temps" ["titre|adresse|temps" ...]
//   COLS : images par ligne. WIDTH=360 : largeur d'une image dans la planche. KEEP=1 garde les images une à une.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ffmpegPath = require("ffmpeg-static");
const [out, colsArg, ...shots] = process.argv.slice(2);
const cols = Number(colsArg), width = Number(process.env.WIDTH ?? 360);
const font = fileURLToPath(new URL("../public/fonts/DejaVuSans-Bold-latin.ttf", import.meta.url));
const dir = `${out}.images`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl", "--hide-scrollbars"] });
const files = [];
for (const [k, shot] of shots.entries()) {
  const [title, url, beat] = shot.split("|");
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  page.setDefaultTimeout(300000);
  await page.goto(`${url}&sortieBeat=0`, { waitUntil: "load", timeout: 300000 });
  await page.waitForSelector("canvas");
  const canvas = () => page.locator("canvas").first().screenshot();
  const settled = async (heavy = 0) => { let previous = null; for (let i = 0; i < 400; i++) { await page.waitForTimeout(150); const png = await canvas(); if (previous && png.equals(previous) && png.length > heavy) return png; previous = png; } throw new Error("never settled"); };
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
  await page.evaluate(b => new Promise(resolve => { const c = window.__captureClock; c.beat = b; c.revision++;
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); }), Number(beat ?? 0));
  const file = `${dir}/i${String(k).padStart(2, "0")}.png`;
  writeFileSync(file, await settled());
  files.push({ file, title });
  await page.close();
  console.log("image", k + 1, "/", shots.length, title);
}
await browser.close();
const rows = Math.ceil(files.length / cols);
const inputs = files.flatMap(f => ["-i", f.file]);
const titled = files.map((f, k) => `[${k}:v]scale=${width}:-2:flags=lanczos,drawtext=fontfile=${font}:text='${f.title.replace(/'/g, "’").replace(/:/g, "\\:")}':fontsize=18:fontcolor=white:box=1:boxcolor=0x0b1220@0.7:boxborderw=6:x=10:y=10[c${k}]`).join(";");
const row = r => { const ks = [...Array(cols).keys()].map(c => r * cols + c).filter(k => k < files.length); return ks.length > 1 ? `${ks.map(k => `[c${k}]`).join("")}hstack=inputs=${ks.length}[r${r}]` : `[c${ks[0]}]null[r${r}]`; };
const grid = rows > 1 ? `${[...Array(rows).keys()].map(r => `[r${r}]`).join("")}vstack=inputs=${rows}[g]` : "[r0]null[g]";
execFileSync(ffmpegPath, ["-y", ...inputs, "-filter_complex", `${titled};${[...Array(rows).keys()].map(row).join(";")};${grid}`, "-map", "[g]", "-frames:v", "1", out], { stdio: "ignore" });
if (!process.env.KEEP) rmSync(dir, { recursive: true, force: true });
console.log("ok", out);
