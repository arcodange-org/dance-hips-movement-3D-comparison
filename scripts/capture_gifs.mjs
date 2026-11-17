#!/usr/bin/env node
// Capture des GIFs de démonstration depuis l'app buildée (vite preview en loopback).
// Usage : npm run build && npm run capture   (PLAYWRIGHT_BROWSERS_PATH par défaut)
// Les GIFs sont écrits dans docs/gifs/ et référencés depuis le README.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ffmpegPath = require("ffmpeg-static");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs", "gifs");
const tmpDir = "/tmp/danse-captures";
const base = process.env.CAPTURE_BASE || "http://127.0.0.1:4173/";

const CAPTURES = [
  { file: "kizomba", label: "Kizomba", query: "bare=1&mode=solo&style=kizomba&bpm=90&travel=0.6" },
  { file: "semba", label: "Semba", query: "bare=1&mode=solo&style=semba&bpm=130&travel=0.8" },
  { file: "kompa", label: "Kompa", query: "bare=1&mode=solo&style=kompa&bpm=120&travel=0.4" },
  { file: "tarraxinha", label: "Tarraxinha", query: "bare=1&mode=solo&style=tarraxinha&bpm=100&travel=0" },
  { file: "suave", label: "Suave", query: "bare=1&mode=solo&style=suave&bpm=60&travel=0" },
  { file: "zouk", label: "Zouk brésilien", query: "bare=1&mode=solo&style=zouk&bpm=110&travel=0.8" },
  { file: "face-a-face", label: "Face à face (kizomba vs zouk)", query: "bare=1&mode=pair&style=kizomba&styleB=zouk&bpm=90&delay=0.5" },
];

const WARMUP_S = 2.5; // secondes ignorées au début (chargement GLB)
const DUR_S = 4; // durée du GIF
const FPS = 10;
const WIDTH = 440;

async function captureOne(browser, cap) {
  const context = await browser.newContext({
    viewport: { width: 960, height: 640 },
    recordVideo: { dir: tmpDir, size: { width: 960, height: 640 } },
  });
  const page = await context.newPage();
  await page.goto(base + "?" + cap.query, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(3500); // laisse le GLB charger et l'anim démarrer
  const video = page.video();
  await page.waitForTimeout(DUR_S * 1000 + 500);
  await context.close();
  const webm = await video.path();
  const gif = join(outDir, cap.file + ".gif");
  const vf = `fps=${FPS},scale=${WIDTH}:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4`;
  execFileSync(ffmpegPath, [
    "-y", "-ss", String(WARMUP_S), "-t", String(DUR_S), "-i", webm,
    "-vf", vf, "-loop", "0", gif,
  ], { stdio: "pipe" });
  console.log(`GIF ${cap.file}.gif <- ${webm}`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  for (const cap of CAPTURES) await captureOne(browser, cap);
  await browser.close();
  for (const f of readdirSync(tmpDir)) if (f.endsWith(".webm")) rmSync(join(tmpDir, f));
  console.log("GIFs écrits dans docs/gifs/:", readdirSync(outDir).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
