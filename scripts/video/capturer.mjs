// Filme l'application image par image (#155, docs/spec-video-pas-de-base.md).
//
// L'application est construite puis servie par ce script (aucun port supposé libre). Chaque plan ouvre
// une page avec `film=1` : la scène n'avance que quand on lui demande une image (`window.__film`,
// src/components/FilmDriver.tsx), au pas fixe d'une image. Les images vont droit dans ffmpeg.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { RACINE, dossier, ecrireJson, empreinte, ffmpegFlux, lireJson, navigateur } from "./outils.mjs";

/** Construit l'application dans le dossier de travail et la sert ; rend l'adresse et `fermer()`. */
export async function servirApplication({ reconstruire = true } = {}) {
  const { build, preview } = await import("vite");
  const outDir = dossier("site");
  if (reconstruire || !existsSync(join(outDir, "index.html")))
    await build({ root: RACINE, logLevel: "warn", build: { outDir, emptyOutDir: true } });
  const serveur = await preview({ root: RACINE, logLevel: "warn", build: { outDir }, preview: { port: 5290, strictPort: false, host: "127.0.0.1" } });
  const adresse = serveur.resolvedUrls.local[0];
  return { adresse, fermer: () => new Promise(resolve => serveur.httpServer.close(() => resolve())) };
}

/** Attend que les modèles 3D soient chargés : le nombre de maillages ne grandit plus. */
async function attendreModeles(page) {
  await page.waitForFunction(() => Boolean(window.__film), null, { timeout: 60_000 });
  let stable = 0, dernier = -1;
  for (let essai = 0; essai < 120 && stable < 4; essai++) {
    await page.waitForTimeout(250);
    const n = await page.evaluate(() => window.__film.meshes());
    stable = n > 20 && n === dernier ? stable + 1 : 0;
    dernier = n;
  }
  if (stable < 4) throw new Error(`modèles 3D non chargés (${dernier} maillages)`);
  return dernier;
}

/**
 * Filme un plan.
 * @param {object} plan
 * @param {string} plan.id          nom du fichier de sortie
 * @param {string} plan.url         paramètres d'URL de l'application (sans `film=1`)
 * @param {number} plan.images      nombre d'images
 * @param {number} plan.ips         images par seconde
 * @param {number} plan.largeur
 * @param {number} plan.hauteur
 * @param {number} [plan.avance]   images de danse à passer avant d'enregistrer (le plan commence en cours de danse)
 * @param {(i: number, t: number) => object} [plan.cadrage] cadrage de l'image i (voir FilmView, src/film.ts)
 * @returns {Promise<{fichier: string, images: number, temps: number, neuf: boolean}>} `temps` : temps de danse atteint
 */
export async function filmer(plan, { adresse, navigateurOuvert, refaire = false, journal = () => {} }) {
  const dir = dossier("plans");
  const fichier = join(dir, `${plan.id}.mp4`), fiche = join(dir, `${plan.id}.json`);
  // Le cadrage est une fonction : son empreinte est celle des cadrages qu'elle rend.
  const cadrages = Array.from({ length: plan.images }, (_, i) => plan.cadrage?.(i, i / plan.ips) ?? null);
  const avance = plan.avance ?? 0;
  const cle = empreinte({ url: plan.url, images: plan.images, avance, ips: plan.ips, l: plan.largeur, h: plan.hauteur, cadrages, version: plan.version ?? 0 });
  const connu = lireJson(fiche);
  if (!refaire && connu?.cle === cle && existsSync(fichier)) return { fichier, images: plan.images, temps: connu.temps, neuf: false };

  const page = await navigateurOuvert.newPage({ viewport: { width: plan.largeur, height: plan.hauteur }, deviceScaleFactor: 1 });
  try {
    const sep = plan.url.includes("?") ? "&" : "?";
    await page.goto(`${adresse}${plan.url}${sep}film=1`, { waitUntil: "load" });
    const maillages = await attendreModeles(page);
    // Deux images à l'instant 0 : la pose et la caméra se posent, l'horloge ne bouge pas.
    for (let k = 0; k < 2; k++) await page.evaluate(v => { window.__film.frame(0, v ?? undefined); }, cadrages[0]);
    const sortie = ffmpegFlux(["-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(plan.ips), "-i", "-",
      "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", "-r", String(plan.ips), fichier]);
    const debut = Date.now();
    // Images passées sans être enregistrées : la danse avance au même pas, par paquets.
    for (let j = 1; j < avance; j += 50)
      await page.evaluate(([a, b, ips, v]) => { for (let k = a; k < b; k++) window.__film.frame(k / ips, v ?? undefined, 0.1); }, [j, Math.min(avance, j + 50), plan.ips, cadrages[0]]);
    for (let i = 0; i < plan.images; i++) {
      const url = await page.evaluate(([t, v]) => window.__film.frame(t, v ?? undefined), [(avance + i) / plan.ips, cadrages[i]]);
      await sortie.ecrire(Buffer.from(url.slice(url.indexOf(",") + 1), "base64"));
      if (i % 100 === 0) journal(`  ${plan.id} : image ${i}/${plan.images}`);
    }
    await sortie.fin();
    const temps = await page.evaluate(() => window.__film.beat());
    ecrireJson(fiche, { cle, url: plan.url, images: plan.images, ips: plan.ips, temps, maillages, secondes: (Date.now() - debut) / 1000 });
    return { fichier, images: plan.images, temps, neuf: true };
  } finally {
    await page.close();
  }
}

// Essai direct : node scripts/video/capturer.mjs "<url>" <secondes> [largeur] [hauteur]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [url = "?mode=solo&style=kizomba&bare=1&muscles=1&bpm=102", secondes = "2", largeur = "1920", hauteur = "1080"] = process.argv.slice(2);
  const site = await servirApplication();
  const chrome = await navigateur();
  try {
    const r = await filmer({ id: "essai", url, images: Math.round(Number(secondes) * 25), ips: 25, largeur: Number(largeur), hauteur: Number(hauteur) },
      { adresse: site.adresse, navigateurOuvert: chrome, refaire: true, journal: console.log });
    console.log(r);
  } finally {
    await chrome.close();
    await site.fermer();
  }
}
