#!/usr/bin/env node
// Images fixes de la vue du pont : une page, un rendu du canevas lu par toDataURL (carte graphique).
//   CHROME_PATH=… node recodanse/scripts/capturer.mjs <dossier de sortie> <nom>=<URL> [<nom>=<URL>…]
// Le serveur de la vue doit tourner (npm --prefix recodanse run dev). LARGEUR, HAUTEUR, ATTENTE (ms) : réglages.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [dossier, ...vues] = process.argv.slice(2);
mkdirSync(dossier, { recursive: true });
const largeur = Number(process.env.LARGEUR ?? 900), hauteur = Number(process.env.HAUTEUR ?? 900);
const navigateur = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
const erreurs = [];
page.on("pageerror", e => erreurs.push(String(e)));
for (const vue of vues) {
  const i = vue.indexOf("="), nom = vue.slice(0, i), url = vue.slice(i + 1);
  await page.goto(url, { waitUntil: "load", timeout: 180000 });
  // La scène est prête quand le canevas existe et que le texte d'attente a disparu ; puis le pont habille.
  await page.waitForFunction(() => !!document.querySelector("canvas") && !/Chargement…/.test(document.body.innerText), null, { timeout: 180000 });
  await page.waitForTimeout(Number(process.env.ATTENTE ?? 4000));
  // Lu dans la même image que le rendu : le tampon du canevas n'est pas conservé d'une image à l'autre.
  const png = await page.evaluate(() => new Promise(res => requestAnimationFrame(() => res(document.querySelector("canvas").toDataURL("image/png")))));
  writeFileSync(path.join(dossier, `${nom}.png`), Buffer.from(png.split(",")[1], "base64"));
  console.log("image", nom);
}
await navigateur.close();
if (erreurs.length) { console.log("ERREURS DE PAGE :\n" + [...new Set(erreurs)].join("\n")); process.exitCode = 1; }
