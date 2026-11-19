#!/usr/bin/env node
// Comparable views for docs/spec-placements-couple.md (validated = deployed site, placements =
// local dev server on :5182). CHROME_PATH may point to an installed Chromium.
import { chromium } from "playwright";
const out = new URL("../docs/placements/", import.meta.url).pathname;
const views = { dessus: "campos=0,2.1,0.001&camtgt=0,0,0", profil: "campos=2.0,0.55,0&camtgt=0,0.42,0" };
const figures = { garcon: { flag: "sortieG", beats: [0, 1] }, fille: { flag: "sortieF", beats: [0, 1, 2] } };
const sources = { reference: "https://arcodange-org.github.io/dance-hips-movement-3D-comparison/", quinconce: "http://localhost:5182/", face: "http://localhost:5182/" };
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
for (const [placement, base] of Object.entries(sources)) for (const [name, fig] of Object.entries(figures)) for (const beat of fig.beats) for (const [view, cam] of Object.entries(views)) {
  const q = `bare=1&mode=pair&${fig.flag}=1&sortieBeat=${beat}&playing=0&style=kizomba&amp=1&appui=0&ligne=1&${cam}` + (placement === "reference" ? "" : `&placement=${placement}`);
  await page.goto(base + "?" + q, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.locator("canvas").first().screenshot({ path: `${out}${name}-b${beat}-${view}-${placement}.png` });
  console.log("captured", name, beat, view, placement);
}
await browser.close();
