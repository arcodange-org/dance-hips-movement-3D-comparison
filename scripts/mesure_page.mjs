#!/usr/bin/env node
// Page principale : scène toujours visible, réglages dans un panneau (#192, docs/spec-page-scene-panneau.md).
// Mesure l'interface réelle dans un navigateur, à l'ordinateur et avec les profils de téléphone de
// Playwright (écran visible avec les barres du navigateur, toucher activé), et refuse si un critère de la
// spec n'est pas tenu.
//
// Usage : CHROME_PATH=... node scripts/mesure_page.mjs <adresse de l'app> [dossier des captures]
//   ex.   node scripts/mesure_page.mjs http://localhost:5173/ docs/captures/page-scene-panneau
// Hors `npm test` (il faut un navigateur et un serveur). Code de sortie 1 si un critère échoue.
import { createRequire } from "node:module";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(process.cwd() + "/");
const { chromium, devices } = require("playwright");
const esbuild = require("esbuild");
const [base, shots] = process.argv.slice(2);
if (!base) { console.error("Usage : node scripts/mesure_page.mjs <adresse de l'app> [dossier des captures]"); process.exit(2); }
if (shots) mkdirSync(shots, { recursive: true });

// L'inventaire des commandes est celui du code (src/page.ts) : la page est comparée à lui.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "scripts", ".mesure-page-bundle.cjs");
esbuild.buildSync({
  stdin: { contents: 'export * from "../src/page"; export { recordingOf, recordingTempo } from "../src/music/recordings"; export { musicStyleOf } from "../src/music/patterns";',
    resolveDir: join(root, "scripts"), loader: "ts" },
  bundle: true, format: "cjs", platform: "node", outfile: bundle, logLevel: "silent", define: { "import.meta.env.BASE_URL": '"/"' },
});
const page_ = require(bundle);
rmSync(bundle, { force: true });

const TOUCH_MIN = 44;
/** Tempo de la page à sa première ouverture (rien de gardé dans le navigateur). */
const TEMPO = 32;
const PROFILS = {
  ordinateur: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  "petit-ordinateur": { viewport: { width: 1024, height: 640 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  tablette: devices["iPad Mini"],
  "iphone14-droit": devices["iPhone 14"],
  "iphoneSE-droit": devices["iPhone SE"],
  "pixel7-droit": devices["Pixel 7"],
  "iphone14-couche": devices["iPhone 14 landscape"],
  "iphoneSE-couche": devices["iPhone SE landscape"],
  // Safari couché avec sa barre d'onglets : la page ne fait plus que 280 px de haut (#186).
  "iphone-couche-onglets": { ...devices["iPhone 14 landscape"], viewport: { width: 750, height: 280 } },
};
const VUES = {
  seul: { query: "?mode=solo&style=kizomba", onglet: "seul", movement: "none", styles: ["kizomba"] },
  comparer: { query: "?mode=compare&style=kizomba&styleB=semba", onglet: "comparer", movement: "none", styles: ["kizomba", "semba"] },
  couple: { query: "?mode=pair&style=kizomba", onglet: "couple", movement: "none", styles: ["kizomba"] },
  // Ouverte en pause sur le pas 2, pour essayer les pas.
  "couple-sortie": { query: "?mode=pair&style=kizomba&sortieG=1&muscles=1&playing=0&sortieBeat=2", onglet: "couple", movement: "sortieG", styles: ["kizomba"] },
  "seul-kompa": { query: "?mode=solo&style=kompa&ida=1", onglet: "seul", movement: "ida", styles: ["kompa"] },
};
/** Commandes que la page doit montrer, tiroirs ouverts, à sa première ouverture (son coupé, source par défaut). */
function attendues(vue) {
  const style = vue.styles[0];
  const piste = page_.recordingOf(style);
  const conseille = piste ? page_.recordingTempo(piste) : page_.musicStyleOf(style).bpm.default;
  return page_.commandesAttendues({ onglet: vue.onglet, movement: vue.movement, styles: vue.styles,
    piste: piste !== undefined, synthese: piste === undefined, tempoDiffere: conseille !== TEMPO });
}

/** Dans la page : la scène, les commandes, leur taille. */
const mesurer = (min) => {
  const vw = innerWidth, vh = innerHeight;
  const rect = e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  const nom = e => (e.getAttribute("aria-label") || e.innerText || e.getAttribute("data-commande") || e.getAttribute("type") || e.tagName).trim().replace(/\s+/g, " ").slice(0, 30);
  const visibles = sel => [...document.querySelectorAll(sel)].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
  // Une rangée qui défile de côté (styles, figures au téléphone) dépasse l'écran par construction.
  const defile = e => { for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === "auto" || o === "scroll") && p.scrollWidth > p.clientWidth + 1) return true; } return false; };
  const scene = document.querySelector("[data-scene]");
  // Une case à cocher se touche par sa ligne (son étiquette).
  const cible = e => (e.matches("input[type=checkbox]") && e.closest("label")) || e;
  const commandes = visibles("[data-page] button, [data-page] a[href], [data-page] select, [data-page] input").map(e => ({ e, nom: nom(e), ...rect(cible(e)) }));
  const petites = commandes.filter(c => c.w < min - 0.5 || c.h < min - 0.5).map(c => `${c.nom} ${Math.round(c.w)}×${Math.round(c.h)}`);
  const horsLargeur = commandes.filter(c => !defile(c.e) && (c.x < -0.5 || c.x + c.w > vw + 0.5)).map(c => c.nom);
  // Atteignable : au centre de la commande, c'est bien elle qui est sous le doigt (commandes à l'écran seulement).
  const cachees = commandes.filter(c => {
    const x = c.x + c.w / 2, y = c.y + c.h / 2;
    if (x < 0 || x >= vw || y < 0 || y >= vh) return false;
    const t = document.elementFromPoint(x, y), k = cible(c.e);
    return !(t && (t === k || k.contains(t) || t.contains(k)));
  }).map(c => c.nom);
  const texte = document.querySelector("[data-page]")?.innerText ?? "";
  return { vw, vh, disposition: document.querySelector("[data-page]")?.dataset.page ?? null,
    scene: scene ? rect(scene) : null, defilement: { x: document.documentElement.scrollWidth - vw, y: document.documentElement.scrollHeight - vh, top: scrollY },
    ids: [...new Set(visibles("[data-commande]").map(e => e.dataset.commande))], commandes: commandes.length,
    petites, horsLargeur, cachees, credit: /BodyParts3D/.test(texte) && /CC BY-SA 2\.1 Japan/.test(texte) && /DBCLS/.test(texte),
    mots: texte.split(/\s+/).filter(Boolean).length };
};
const ouvrirTiroirs = () => { for (const b of document.querySelectorAll('[data-tiroir][aria-expanded="false"]')) b.click(); };

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl"] });
const echecs = [];
console.log("vue · profil | écran | disposition | scène à l'ouverture | commandes | mots | résultat");
for (const [profil, device] of Object.entries(PROFILS)) {
  for (const [nomVue, vue] of Object.entries(VUES)) {
    if (nomVue === "seul-kompa" && profil !== "ordinateur" && profil !== "iphone14-droit") continue;
    const { defaultBrowserType, ...options } = device;
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const erreurs = [];
    page.on("pageerror", e => erreurs.push("erreur de page : " + String(e).slice(0, 120)));
    const refus = [];
    const tactile = !!device.hasTouch;
    const appuyer = async cible => (tactile ? cible.tap({ timeout: 10000 }) : cible.click({ timeout: 10000 }));
    try {
      await page.goto(base + vue.query, { waitUntil: "load", timeout: 120000 });
      await page.waitForSelector("[data-page]", { timeout: 120000 });
      await page.waitForSelector("canvas", { timeout: 120000 });
      await page.waitForTimeout(Number(process.env.ATTENTE ?? 7000));

      // 1. À l'ouverture : la scène est entière dans le premier écran.
      const m = await page.evaluate(mesurer, TOUCH_MIN);
      const s = m.scene;
      if (!s) refus.push("pas de scène");
      else {
        if (s.y < -0.5 || s.y + s.h > m.vh + 0.5) refus.push(`la scène dépasse le premier écran : de ${Math.round(s.y)} à ${Math.round(s.y + s.h)} px sur ${m.vh}`);
        if (s.h < 0.4 * m.vh) refus.push(`scène trop petite : ${Math.round(s.h)} px sur ${m.vh}`);
      }
      if (m.cachees.length) refus.push(`hors d'atteinte : ${m.cachees.join(", ")}`);
      if (m.defilement.x > 1) refus.push(`défilement horizontal de ${m.defilement.x} px`);
      if (m.disposition !== "droit" && m.defilement.y > 1) refus.push(`la page défile de ${m.defilement.y} px alors que seul le panneau doit défiler`);
      if (shots) await page.screenshot({ path: join(shots, `${nomVue}-${profil}.jpg`), type: "jpeg", quality: 85, timeout: 180000 });

      // 2. Tiroirs ouverts : les commandes sont celles de l'inventaire, à la bonne taille, dans la largeur.
      await page.evaluate(ouvrirTiroirs);
      await page.waitForTimeout(300);
      const o = await page.evaluate(mesurer, TOUCH_MIN);
      const voulues = attendues(vue);
      const manquent = voulues.filter(id => !o.ids.includes(id)), enTrop = o.ids.filter(id => !voulues.includes(id));
      if (manquent.length) refus.push(`commandes absentes : ${manquent.join(", ")}`);
      if (enTrop.length) refus.push(`commandes en trop : ${enTrop.join(", ")}`);
      if (tactile && o.petites.length) refus.push(`moins de ${TOUCH_MIN} px : ${o.petites.join(", ")}`);
      if (o.horsLargeur.length) refus.push(`dépassent en largeur : ${o.horsLargeur.join(", ")}`);
      if (o.defilement.x > 1) refus.push(`tiroirs ouverts, défilement horizontal de ${o.defilement.x} px`);
      if (!o.credit) refus.push("attribution BodyParts3D absente de la page");
      if (shots && (nomVue === "couple-sortie" || nomVue === "seul"))
        await page.screenshot({ path: join(shots, `${nomVue}-${profil}-tiroirs.jpg`), type: "jpeg", quality: 85, timeout: 180000, fullPage: m.disposition === "droit" });

      // 3. Téléphone tenu droit : le doigt posé sous la scène fait défiler la page, et la scène reste à l'écran.
      if (m.disposition === "droit" && tactile) {
        // Un doigt posé près du bord gauche, sous la scène, qui remonte de 260 px.
        const cdp = await context.newCDPSession(page);
        const x = 14, y0 = m.vh - 30;
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
        for (let k = 1; k <= 13; k++) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 - 20 * k }] });
          await page.waitForTimeout(16);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.waitForTimeout(500);
        const d = await page.evaluate(mesurer, TOUCH_MIN);
        if (d.defilement.top < 100) refus.push(`la page ne défile pas sous le doigt (${Math.round(d.defilement.top)} px)`);
        if (!d.scene || d.scene.y < -0.5 || d.scene.y > 0.5 || d.scene.y + d.scene.h > d.vh) refus.push(`après défilement, la scène n'est plus en haut de l'écran (${d.scene ? Math.round(d.scene.y) : "absente"} px)`);
        if (shots && nomVue === "couple-sortie") await page.screenshot({ path: join(shots, `${nomVue}-${profil}-defile.jpg`), type: "jpeg", quality: 85, timeout: 180000 });
        await page.evaluate(() => scrollTo(0, 0));
      }

      // 4. Les commandes répondent, au doigt comme à la souris.
      if (nomVue === "couple-sortie") {
        // Écran assez large : un bouton par pas ; sinon pas précédent et pas suivant.
        const parPas = await page.getByRole("button", { name: "Pas 4", exact: true }).count() === 1;
        const voulu = parPas ? "4" : "3";
        await appuyer(page.getByRole("button", { name: parPas ? "Pas 4" : "Pas suivant", exact: true }));
        await page.waitForFunction(v => document.querySelector('[aria-label="pas"]')?.textContent?.trim() === v, voulu, { timeout: 8000 })
          .catch(() => refus.push(`le pas ${voulu} choisi ne s'affiche pas`));
        if (await page.getByRole("button", { name: "Lecture" }).count() !== 1) refus.push("choisir un pas n'arrête pas la lecture");
        await appuyer(page.getByRole("button", { name: "Rejouer depuis le début" }));
        await page.getByRole("button", { name: "Pause" }).waitFor({ timeout: 5000 }).catch(() => refus.push("« Rejouer » ne relance pas la lecture"));
      }
      if (nomVue === "seul") {
        await page.evaluate(() => scrollTo(0, 0));
        const ralenti = page.getByRole("switch", { name: "Hanches au ralenti" });
        await ralenti.scrollIntoViewIfNeeded();
        const buste = page.getByRole("switch", { name: "Buste" });
        await appuyer(ralenti);
        if (await buste.getAttribute("aria-checked") !== "false") refus.push("« Hanches au ralenti » ne masque pas le buste");
        if (!/mode=observe/.test(await page.evaluate(() => { document.querySelector('[data-commande="partager"]').click(); return location.search; }))) refus.push("« Hanches au ralenti » : le lien partagé ne dit pas mode=observe");
        await appuyer(ralenti);
        if (await buste.getAttribute("aria-checked") !== "true") refus.push("quitter « Hanches au ralenti » ne remet pas le buste");
        await page.evaluate(() => scrollTo(0, 0));
        const comparer = page.getByRole("button", { name: "Comparer", exact: true });
        await comparer.scrollIntoViewIfNeeded();
        await appuyer(comparer);
        await page.locator('[data-commande="styleB"]').waitFor({ timeout: 5000 }).catch(() => refus.push("l'onglet « Comparer » ne montre pas le style de droite"));
      }
      refus.push(...erreurs);
      console.log(`${nomVue} · ${profil} | ${m.vw}×${m.vh} | ${m.disposition} | ${s ? `${Math.round(s.y)} à ${Math.round(s.y + s.h)} px (${Math.round(100 * s.h / m.vh)} %)` : "absente"} | ${o.ids.length} | ${m.mots} | ${refus.length ? "REFUSÉ" : "ok"}`);
    } catch (e) {
      refus.push(String(e).slice(0, 240));
      console.log(`${nomVue} · ${profil} | REFUSÉ`);
    }
    for (const r of refus) { console.log(`    ${r}`); echecs.push(`${nomVue} · ${profil} : ${r}`); }
    await context.close();
  }
}
await browser.close();
console.log(echecs.length ? `\n${echecs.length} critère(s) non tenu(s)` : "\nTous les critères sont tenus");
process.exit(echecs.length ? 1 : 0);
