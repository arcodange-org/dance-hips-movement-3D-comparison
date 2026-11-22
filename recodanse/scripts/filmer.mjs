#!/usr/bin/env node
// Petit film de la vue du pont : la danse joue en temps réel dans une page, le canevas est lu à cadence fixe.
//   CHROME_PATH=… node recodanse/scripts/filmer.mjs <sortie.mp4|.gif> "<URL>" [secondes=8] [images/s=12]
// Le serveur de la vue doit tourner. Les images des mascottes ne se versent pas dans le dépôt public.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const [sortie, url, secondes = "8", cadence = "12"] = process.argv.slice(2);
const n = Math.round(Number(secondes) * Number(cadence)), dossier = sortie + ".images";
rmSync(dossier, { recursive: true, force: true }); mkdirSync(dossier, { recursive: true });
const cote = Number(process.env.COTE ?? 720);
const navigateur = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl", "--autoplay-policy=no-user-gesture-required"] });
const page = await navigateur.newPage({ viewport: { width: cote, height: cote } });
await page.goto(url, { waitUntil: "load", timeout: 180000 });
await page.waitForFunction(() => !!document.querySelector("canvas") && !/Chargement…/.test(document.body.innerText), null, { timeout: 180000 });
await page.waitForTimeout(Number(process.env.ATTENTE ?? 6000));
// Lecture dans la page, calée sur l'horloge : une image tous les 1/cadence s, lue juste après son rendu.
const images = await page.evaluate(({ n, pas }) => new Promise(res => {
  const canevas = document.querySelector("canvas"), lues = [], t0 = performance.now();
  const tour = () => {
    if (performance.now() - t0 >= lues.length * pas) lues.push(canevas.toDataURL("image/jpeg", 0.92));
    if (lues.length < n) requestAnimationFrame(tour); else res(lues);
  };
  requestAnimationFrame(tour);
}), { n, pas: 1000 / Number(cadence) });
await navigateur.close();
images.forEach((d, i) => writeFileSync(`${dossier}/i${String(i).padStart(4, "0")}.jpg`, Buffer.from(d.split(",")[1], "base64")));
const entree = ["-y", "-loglevel", "error", "-framerate", cadence, "-i", `${dossier}/i%04d.jpg`];
if (sortie.endsWith(".gif")) execFileSync(ffmpeg, [...entree, "-vf", "scale=480:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4", "-loop", "0", sortie]);
else execFileSync(ffmpeg, [...entree, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", sortie]);
rmSync(dossier, { recursive: true, force: true });
console.log("film", sortie, images.length, "images");
