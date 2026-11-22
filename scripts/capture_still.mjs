#!/usr/bin/env node
// Image fixe du canvas pour contrôler une variante avant de capturer un GIF (élections de variantes).
// Usage : CHROME_PATH=... node scripts/capture_still.mjs sortie.png "<URL de l'app avec bare=1&playing=0&sortieBeat=…>"
// usage: node still.mjs out.png "<url>" [width height]
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/");
const { chromium } = require("playwright");
const [out, url, w, h] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: Number(w ?? 560), height: Number(h ?? 600) } });
await page.goto(url, { waitUntil: "load" }); await page.waitForSelector("canvas"); await page.waitForTimeout(4500);
await page.locator("canvas").first().screenshot({ path: out });
await browser.close(); console.log("ok", out);
