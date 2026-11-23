#!/usr/bin/env node
// Jeu et vitrine sur téléphone (#186, docs/spec-jeu-telephone.md) : mesure l'interface réelle dans un
// navigateur, avec les profils de téléphone de Playwright (écran visible avec les barres du navigateur,
// toucher activé), et refuse si un critère de la spec n'est pas tenu.
//
// Usage : CHROME_PATH=... node scripts/mesure_jeu_telephone.mjs <adresse de l'app> [dossier des captures]
//   ex.   node scripts/mesure_jeu_telephone.mjs http://localhost:5173/ docs/captures/jeu-telephone
// Hors `npm test` (il faut un navigateur et un serveur). Code de sortie 1 si un critère échoue.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(process.cwd() + "/");
const { chromium, devices } = require("playwright");
const [base, shots] = process.argv.slice(2);
if (!base) { console.error("Usage : node scripts/mesure_jeu_telephone.mjs <adresse de l'app> [dossier des captures]"); process.exit(2); }
if (shots) mkdirSync(shots, { recursive: true });

const TOUCH_MIN = 44;
const PROFILS = {
  "iphone14-droit": devices["iPhone 14"],
  "iphone14-couche": devices["iPhone 14 landscape"],
  "iphoneSE-droit": devices["iPhone SE"],
  "iphoneSE-couche": devices["iPhone SE landscape"],
  "pixel7-droit": devices["Pixel 7"],
  ordinateur: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};
const VUES = { jeu: "?mode=pair&guidage=1", vitrine: "?vitrine=1", "jeu-kompa": "?mode=pair&guidage=1&style=kompa" };

/** Dans la page : commandes, bandes, place libre. */
const mesurer = (min) => {
  const vw = innerWidth, vh = innerHeight;
  const rect = e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  const nom = e => (e.innerText || e.getAttribute("aria-label") || e.getAttribute("type") || e.tagName).trim().replace(/\s+/g, " ").slice(0, 28);
  const visibles = sel => [...document.querySelectorAll(sel)].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
  const commandes = visibles("[data-hud] button, [data-hud] a[href], [data-hud] select, [data-hud] input").map(e => ({ e, nom: nom(e), ...rect(e) }));
  const petites = commandes.filter(c => c.w < min - 0.5 || c.h < min - 0.5).map(c => `${c.nom} ${Math.round(c.w)}×${Math.round(c.h)}`);
  const horsEcran = commandes.filter(c => c.x < -0.5 || c.y < -0.5 || c.x + c.w > vw + 0.5 || c.y + c.h > vh + 0.5).map(c => c.nom);
  // Atteignable : ce qui est sous le doigt, au centre de la commande, est bien la commande.
  const cachees = commandes.filter(c => { const t = document.elementFromPoint(c.x + c.w / 2, c.y + c.h / 2); return !(t && (t === c.e || c.e.contains(t))); }).map(c => c.nom);
  const chevauchements = [];
  for (let i = 0; i < commandes.length; i++) for (let j = i + 1; j < commandes.length; j++) {
    const a = commandes[i], b = commandes[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const lx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), ly = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (lx > 0.5 && ly > 0.5) chevauchements.push(`${a.nom} / ${b.nom}`);
  }
  // Ce qui est posé sur la scène : commandes et textes ; et la place réservée : les bandes de commandes.
  const contenus = [...commandes, ...visibles("[data-hud] p, [data-hud] h1, [data-hud] [aria-label='compte']").map(rect)];
  const poses = [...contenus, ...visibles("[data-hud] [data-marge]").map(rect)];
  const libre = (taille, debut, fin) => { // plus longue plage sans rien de posé, le long d'un axe
    let best = 0, run = 0;
    for (let k = 0; k < taille; k++) { run = poses.some(p => k >= debut(p) - 0.5 && k < fin(p) - 0.5) ? 0 : run + 1; best = Math.max(best, run); }
    return best;
  };
  const surface = (() => { let pris = 0, total = 0;
    for (let y = 2; y < vh; y += 4) for (let x = 2; x < vw; x += 4) { total++; if (contenus.some(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h)) pris++; }
    return pris / total; })();
  const credit = visibles("[data-hud] p").some(e => /BodyParts3D/.test(e.innerText) && /CC BY-SA 2\.1 Japan/.test(e.innerText) && /DBCLS/.test(e.innerText)
    && e.getBoundingClientRect().bottom <= vh + 0.5);
  return { vw, vh, disposition: document.querySelector("[data-hud]")?.dataset.hud ?? null, commandes: commandes.length,
    petites, horsEcran, cachees, chevauchements, couvert: Math.round(surface * 100),
    bandeHorizontale: libre(vh, p => p.y, p => p.y + p.h), bandeVerticale: libre(vw, p => p.x, p => p.x + p.w),
    raccourcis: visibles("[data-hud] kbd").length, credit };
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl"] });
const echecs = [];
console.log("vue · profil | écran | disposition | commandes | couvert | bande libre | résultat");
for (const [profil, device] of Object.entries(PROFILS)) {
  for (const [vue, query] of Object.entries(VUES)) {
    if (vue === "jeu-kompa" && profil !== "iphone14-droit") continue;
    const { defaultBrowserType, ...options } = device;
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const erreurs = [];
    page.on("pageerror", e => erreurs.push("erreur de page : " + String(e).slice(0, 120)));
    const refus = [];
    try {
      await page.goto(base + query, { waitUntil: "load", timeout: 120000 });
      await page.waitForSelector("[data-hud]", { timeout: 120000 });
      await page.waitForSelector("canvas", { timeout: 120000 });
      await page.waitForTimeout(Number(process.env.ATTENTE ?? 9000));
      const m = await page.evaluate(mesurer, TOUCH_MIN);
      const tactile = !!device.hasTouch;
      if (m.petites.length) refus.push(`moins de ${TOUCH_MIN} px : ${m.petites.join(", ")}`);
      if (m.horsEcran.length) refus.push(`hors de l'écran : ${m.horsEcran.join(", ")}`);
      if (m.cachees.length) refus.push(`hors d'atteinte : ${m.cachees.join(", ")}`);
      if (m.chevauchements.length) refus.push(`se chevauchent : ${m.chevauchements.join(" ; ")}`);
      if (tactile && m.raccourcis) refus.push(`${m.raccourcis} raccourcis clavier affichés sur un écran tactile`);
      if (!m.credit) refus.push("attribution BodyParts3D absente de l'écran");
      // Place du couple : une bande libre sur toute la largeur (tenu droit, écran large) ou sur toute la hauteur (couché).
      const bande = m.disposition === "couche" ? `${m.bandeVerticale} px de large` : `${m.bandeHorizontale} px de haut`;
      if (m.disposition === "couche" ? m.bandeVerticale < 0.55 * m.vh : m.bandeHorizontale < 0.5 * m.vh) refus.push(`place libre insuffisante : ${bande}`);
      if (shots) await page.screenshot({ path: join(shots, `${vue}-${profil}.jpg`), type: "jpeg", quality: 85, timeout: 180000 });

      // Les commandes répondent au doigt (à la souris sur l'ordinateur).
      const appuyer = async cible => (tactile ? cible.tap({ timeout: 10000 }) : cible.click({ timeout: 10000 }));
      if (vue === "jeu") {
        await appuyer(page.getByRole("button", { name: /^Sortie fille/ }));
        await page.waitForFunction(() => /Sortie fille/.test(document.querySelector("[data-hud]")?.innerText ?? ""), null, { timeout: 15000 })
          .catch(() => refus.push("« Sortie fille » touchée : ni en file ni dansée"));
        await appuyer(page.getByRole("button", { name: "Pause" }));
        await page.getByRole("button", { name: "Reprendre" }).waitFor({ timeout: 5000 }).catch(() => refus.push("Pause sans effet"));
        await appuyer(page.getByRole("button", { name: "Reprendre" }));
        await appuyer(page.getByRole("button", { name: "Danse seule" }));
        if (await page.getByRole("button", { name: "Danse seule" }).getAttribute("aria-pressed") !== "true") refus.push("« Danse seule » sans effet");
        await appuyer(page.getByRole("button", { name: "Plus de commandes" }));
        await page.getByRole("dialog", { name: "Plus" }).waitFor({ timeout: 5000 }).catch(() => refus.push("panneau « Plus » absent"));
        const plus = await page.evaluate(mesurer, TOUCH_MIN);
        if (plus.petites.length) refus.push(`panneau « Plus », moins de ${TOUCH_MIN} px : ${plus.petites.join(", ")}`);
        if (plus.horsEcran.length) refus.push(`panneau « Plus », hors de l'écran : ${plus.horsEcran.join(", ")}`);
        if (shots) await page.screenshot({ path: join(shots, `${vue}-${profil}-plus.jpg`), type: "jpeg", quality: 85, timeout: 180000 });
      }
      if (vue === "vitrine") {
        const musique = await page.getByRole("button", { name: /Lancer la musique/ }).count();
        if (musique !== 1) refus.push(`${musique} boutons « Lancer la musique »`);
      }
      refus.push(...erreurs);
      console.log(`${vue} · ${profil} | ${m.vw}×${m.vh} | ${m.disposition} | ${m.commandes} | ${m.couvert} % | ${bande} | ${refus.length ? "REFUSÉ" : "ok"}`);
    } catch (e) {
      refus.push(String(e).slice(0, 200));
      console.log(`${vue} · ${profil} | REFUSÉ`);
    }
    for (const r of refus) { console.log(`    ${r}`); echecs.push(`${vue} · ${profil} : ${r}`); }
    await context.close();
  }
}
await browser.close();
console.log(echecs.length ? `\n${echecs.length} critère(s) non tenu(s)` : "\nTous les critères sont tenus");
process.exit(echecs.length ? 1 : 0);
