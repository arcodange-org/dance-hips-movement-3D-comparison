#!/usr/bin/env node
// Frame-by-frame GIF of a five-action figure (deterministic: one page load per `sortieBeat`).
// Usage: CHROME_PATH=... BPM=90 node scripts/capture_figure_gif.mjs out.gif "<app URL with bare=1&sortieG=1…>" <beats> [fps]
// The in-app « Exporter un cycle » records in real time, which a slow headless renderer truncates.
// START=<beat> (default 0) films `beats` beats from that beat, e.g. the second half of a 16-beat cycle.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";
const [out, base, beatsArg, fpsArg] = process.argv.slice(2);
const beats = Number(beatsArg), fps = Number(fpsArg ?? 10), bpm = Number(process.env.BPM ?? 90);
const start = Number(process.env.START ?? 0);
const n = Math.round(beats * 60 / bpm * fps);
const dir = out + '.frames'; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 560, height: 600 } });
for (let i = 0; i <= n; i++) {
  const beat = start + Math.min(beats, i * beats / n);
  await page.goto(`${base}&sortieBeat=${beat.toFixed(4)}`, { waitUntil: "load" });
  await page.waitForSelector("canvas"); await page.waitForTimeout(i === 0 ? 4000 : 1200);
  await page.locator("canvas").first().screenshot({ path: `${dir}/f${String(i).padStart(3, '0')}.png` });
}
// Hold the final pose for one second.
for (let k = 1; k <= fps; k++) execFileSync('cp', [`${dir}/f${String(n).padStart(3, '0')}.png`, `${dir}/f${String(n + k).padStart(3, '0')}.png`]);
await browser.close();
execFileSync(ffmpegPath, ["-y", "-framerate", String(fps), "-i", `${dir}/f%03d.png`, "-vf", "scale=440:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4", "-loop", "0", out], { stdio: "ignore" });
console.log('ok', out, n + 1, 'frames');
