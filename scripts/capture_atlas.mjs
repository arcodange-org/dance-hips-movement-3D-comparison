#!/usr/bin/env node
// #132 — Atlas anatomique : génère la planche d'un mouvement du manifeste (docs/atlas/manifest.json).
// Pour chaque vue et chaque frame de la ROM, la page `?atlas=` de l'app buildée pose le rig réel par
// le moteur (src/atlas.ts → src/pose.ts) ; le script capture l'image, puis assemble un GIF par vue et
// une planche composite. `meta.json` est calculé hors navigateur sur le GLB (scripts/atlas_meta.mjs).
//
// Usage : npm run build && node scripts/capture_atlas.mjs --mouvement bassin-obliquite
//   --frames 9            nombre de frames sur la ROM (impair : passe par la pose neutre)
//   --vues face,profil    sous-ensemble des vues du manifeste
//   --sans-muscles        squelette seul (par défaut la couche musculaire est affichée)
//   --meta-seul           ne recalcule que meta.json (aucun navigateur)
// Environnement : CHROME_PATH (exécutable Chromium), CAPTURE_BASE (serveur déjà lancé ; sinon le
// script sert lui-même `dist/` sur un port libre, pour ne jamais capturer le build d'une autre session).
// Sorties : docs/atlas/mouvements/<id>/ (images, GIF, planche, meta.json, README.md) ; assets servis
// (meta.json, planche.png) copiés dans public/atlas/mouvements/<id>/.
// Spécification : docs/spec-atlas-anatomique.md (D7 à D12).
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ATLAS_CAPTURE, DOCS_DIR, META_FILE, PLANCHE_FILE, PUBLIC_DIR, README_FILE, ROOT, buildAtlasMeta, buildPlancheReadme,
  frameFile, gifFile, gifSequence, loadAtlasApi, readManifest, serializeMeta,
} from "./atlas_meta.mjs";

function parseArgs(argv) {
  const options = { mouvement: null, frames: null, vues: null, muscles: true, metaSeul: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i], next = () => {
      if (i + 1 >= argv.length) throw new Error(`valeur manquante après ${arg}`);
      return argv[++i];
    };
    if (arg === "--mouvement") options.mouvement = next();
    else if (arg === "--frames") options.frames = Number(next());
    else if (arg === "--vues") options.vues = next().split(",").map(v => v.trim()).filter(Boolean);
    else if (arg === "--sans-muscles") options.muscles = false;
    else if (arg === "--meta-seul") options.metaSeul = true;
    else throw new Error(`option inconnue : ${arg}`);
  }
  if (!options.mouvement) throw new Error("--mouvement <id> requis (ids : docs/atlas/manifest.json)");
  return options;
}

const freePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const { port } = server.address(); server.close(() => resolve(port)); });
});

/** Sert `dist/` sur un port libre ; renvoie l'URL et la fonction d'arrêt (par PID, jamais pkill). */
async function servePreview() {
  if (!existsSync(join(ROOT, "dist", "index.html"))) throw new Error("dist/ absent : lancer `npm run build` d'abord");
  const port = await freePort();
  const child = spawn(process.execPath, [join(ROOT, "node_modules/vite/bin/vite.js"), "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    { cwd: ROOT, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}/`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error("vite preview s'est arrêté au démarrage");
    try { if ((await fetch(base)).ok) return { base, stop: () => child.kill() }; } catch { /* pas encore prêt */ }
    await new Promise(r => setTimeout(r, 200));
  }
  child.kill();
  throw new Error("vite preview ne répond pas");
}

const ffmpeg = (args) => execFileSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });

function writeGif(dir, vue, frames, scratch) {
  const sequence = gifSequence(frames);
  const work = mkdtempSync(join(scratch, vue + "-"));
  sequence.forEach((frame, k) => copyFileSync(join(dir, frameFile(vue, frame)), join(work, `s${String(k).padStart(3, "0")}.png`)));
  ffmpeg(["-framerate", String(ATLAS_CAPTURE.gifImagesParSeconde), "-i", join(work, "s%03d.png"),
    "-vf", "split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
    "-loop", "0", join(dir, gifFile(vue))]);
}

/** PNG en couleurs indexées (256) : trois à quatre fois plus léger, pour des planches versionnées. */
function indexPng(path, scratch) {
  const out = join(scratch, "indexed.png");
  ffmpeg(["-i", path, "-vf", "split[a][b];[a]palettegen=max_colors=256:stats_mode=single[p];[b][p]paletteuse=dither=sierra2_4a", "-pix_fmt", "pal8", out]);
  copyFileSync(out, path);
}

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Planche composite : une ligne par vue, une colonne par frame, en-têtes et attribution lisibles.
 * Mise en page HTML rendue par le navigateur (ffmpeg-static n'a pas drawtext). */
function plancheHtml(api, meta, dir) {
  // Image réduite de moitié ; les bandes de légende de chaque image sont rognées (les en-têtes de la
  // planche les remplacent).
  const { largeurPx, hauteurPx } = meta.capture, { hautPx, basPx } = api.ATLAS_BANDES;
  const cell = { w: largeurPx / 2, h: hauteurPx / 2, top: hautPx / 2, bottom: basPx / 2 }, head = 132;
  const width = head + meta.frames.length * (cell.w + 2);
  const dataUri = (file) => "data:image/png;base64," + readFileSync(join(dir, file)).toString("base64");
  const fr = (value, digits = 1) => value.toFixed(digits).replace(".", ",").replace("-", "−");
  const columns = meta.frames.map(f => `<th>${escapeHtml(api.atlasAngleLabel(f.angleDeg))}</th>`).join("");
  const rows = meta.vues.map(v => `<tr><th class="vue">${escapeHtml(v.label)}<small>azimut ${v.azimutDeg}°</small></th>${
    meta.fichiers.images[v.id].map(file => `<td><div class="cell"><img src="${dataUri(file)}" alt=""></div></td>`).join("")}</tr>`).join("");
  const resume = [meta.frames[0], meta.frames[meta.frames.length - 1]].map(f =>
    `à ${api.atlasAngleLabel(f.angleDeg)}, hanche gauche ${fr(f.mesure.ecartHanchesMm)} mm par rapport à la droite, genou droit fléchi de ${
      fr(f.mesure.genouDeg.R)}°, gauche de ${fr(f.mesure.genouDeg.L)}°`).join(" ; ");
  const thorax = Math.max(...meta.frames.map(f => f.mesure.thoraxDeg));
  return `<!doctype html><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #0b1220; color: #e2e8f0; font: 13px/1.4 -apple-system, "Segoe UI", "DejaVu Sans", Arial, sans-serif; }
    #planche { display: inline-block; padding: 18px 20px 16px; }
    #planche > * { max-width: ${width}px; }
    h1 { margin: 0; font-size: 22px; font-weight: 650; }
    .sub { margin: 2px 0 10px; color: #94a3b8; }
    table { border-collapse: collapse; }
    th { font-weight: 600; color: #5eead4; font-size: 13px; padding: 2px 0 4px; font-variant-numeric: tabular-nums; }
    th.vue { color: #e2e8f0; text-align: left; padding: 0 12px 0 0; width: ${head}px; }
    th.vue small { display: block; color: #64748b; font-weight: 400; font-size: 11px; }
    td { padding: 1px; }
    .cell { width: ${cell.w}px; height: ${cell.h - cell.top - cell.bottom}px; overflow: hidden; border-radius: 3px; }
    .cell img { display: block; width: ${cell.w}px; height: ${cell.h}px; margin-top: -${cell.top}px; }
    footer { margin-top: 10px; color: #94a3b8; font-size: 11.5px; }
    footer div + div { margin-top: 2px; }
    footer b { color: #cbd5e1; font-weight: 600; }
  </style><div id="planche">
    <h1>${escapeHtml(meta.mouvement.label)}</h1>
    <p class="sub">${escapeHtml(meta.mouvement.labelEn)} · nœud ${escapeHtml(meta.articulation.noeud)}, axe ${escapeHtml(meta.articulation.axeLocal)} ·
      ${escapeHtml(api.atlasAngleLabel(meta.romDeg.manifeste[0]))} à ${escapeHtml(api.atlasAngleLabel(meta.romDeg.manifeste[1]))} en ${meta.frames.length} images ·
      ${escapeHtml(meta.articulation.signe)}</p>
    <table><tr><th></th>${columns}</tr>${rows}</table>
    <footer>
      <div><b>Mesuré sur le squelette :</b> ${escapeHtml(resume)}. Inclinaison du thorax : ${fr(thorax)}° au plus (le haut du tronc compense).</div>
      <div><b>Provenance :</b> ${escapeHtml(meta.generation)} Niveau de preuve : ${escapeHtml(meta.niveauDePreuve)}.</div>
      <div><b>Licences :</b> ${escapeHtml(meta.licence.attribution)}. Planche : ${escapeHtml(meta.licence.assetsGeneres)}. Atlas anatomique ouvert, issue #${meta.issue}.</div>
    </footer>
  </div>`;
}

async function capture(api, meta, options, dir) {
  const { id } = meta.mouvement, frames = meta.frames.length;
  const server = process.env.CAPTURE_BASE ? { base: process.env.CAPTURE_BASE, stop: () => {} } : await servePreview();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const scratch = mkdtempSync(join(tmpdir(), "atlas-capture-"));
  try {
    const page = await browser.newPage({ viewport: { width: ATLAS_CAPTURE.largeurPx, height: ATLAS_CAPTURE.hauteurPx }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    // Une ressource en échec est rapportée avec son URL ; l'écho anonyme de la console est écarté.
    page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    page.on("console", m => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text()); });
    const state = (vue, frame) => ({ id, vue, frame, frames, muscles: options.muscles });
    const rendered = (s, timeout) => page.waitForFunction(key => document.documentElement.dataset.atlasRendu === key, api.atlasKey(s), { timeout })
      .catch(() => { throw new Error(`pas de signal de rendu pour ${api.atlasKey(s)} : dist/ périmé (relancer \`npm run build\`) ou page en erreur ${JSON.stringify(errors.slice(0, 3))}`); });
    const first = state(meta.vues[0].id, 0);
    await page.goto(server.base + "?" + api.atlasQuery(first), { waitUntil: "load", timeout: 60000 });
    await rendered(first, 90000); // premier passage : chargement des deux GLB
    await page.evaluate(() => document.fonts.ready.then(() => true));
    for (const vue of meta.vues) for (let frame = 0; frame < frames; frame++) {
      const s = state(vue.id, frame);
      // L'URL est l'interface de la vue : on change d'état sans recharger la page.
      await page.evaluate(query => { history.replaceState(null, "", "?" + query); window.dispatchEvent(new PopStateEvent("popstate")); }, api.atlasQuery(s));
      await rendered(s, 30000);
      await page.locator("[data-atlas-cadre]").screenshot({ path: join(dir, frameFile(vue.id, frame)) });
    }
    if (errors.length) throw new Error("erreurs console pendant la capture : " + JSON.stringify(errors.slice(0, 5)));
    for (const vue of meta.vues) writeGif(dir, vue.id, frames, scratch);
    const sheet = await browser.newPage({ viewport: { width: 2400, height: 1600 }, deviceScaleFactor: 1 });
    await sheet.setContent(plancheHtml(api, meta, dir), { waitUntil: "load" });
    await sheet.locator("#planche").screenshot({ path: join(dir, PLANCHE_FILE) });
    for (const vue of meta.vues) for (const file of meta.fichiers.images[vue.id]) indexPng(join(dir, file), scratch);
    indexPng(join(dir, PLANCHE_FILE), scratch);
  } finally {
    await browser.close();
    server.stop();
    rmSync(scratch, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const api = await loadAtlasApi();
  const manifest = readManifest();
  const meta = buildAtlasMeta(api, manifest, options.mouvement, {
    frames: options.frames ?? api.ATLAS_FRAMES, vues: options.vues ?? manifest.views, muscles: options.muscles,
  });
  const dir = join(DOCS_DIR, options.mouvement), served = join(PUBLIC_DIR, options.mouvement);
  mkdirSync(dir, { recursive: true });
  mkdirSync(served, { recursive: true });
  if (!options.metaSeul) {
    // Les images d'une génération précédente (autre nombre de frames, autres vues) ne doivent pas rester.
    for (const file of readdirSync(dir)) if (/\.(png|gif)$/.test(file)) rmSync(join(dir, file));
    await capture(api, meta, options, dir);
  }
  writeFileSync(join(dir, META_FILE), serializeMeta(meta));
  writeFileSync(join(dir, README_FILE), buildPlancheReadme(api, meta));
  // public/ ne contient que les assets servis, à l'identique : rien d'une génération précédente n'y reste.
  for (const file of readdirSync(served)) if (!meta.fichiers.servis.includes(file)) rmSync(join(served, file));
  for (const file of meta.fichiers.servis) {
    if (!existsSync(join(dir, file))) throw new Error(`${file} absent de docs/ : relancer sans --meta-seul`);
    copyFileSync(join(dir, file), join(served, file));
  }
  const size = (folder) => readdirSync(folder).reduce((total, file) => total + statSync(join(folder, file)).size, 0);
  console.log(`atlas ${options.mouvement} : ROM mesurée ${meta.romDeg.mesuree.join(" à ")}° (manifeste ${meta.romDeg.manifeste.join(" à ")}°), ${
    meta.frames.length} frames × ${meta.vues.length} vues${options.metaSeul ? " — meta.json seul" : ""}`);
  console.log(`  docs/atlas/mouvements/${options.mouvement}/ : ${readdirSync(dir).length} fichiers, ${(size(dir) / 1024).toFixed(0)} Ko`);
  console.log(`  public/atlas/mouvements/${options.mouvement}/ : ${readdirSync(served).length} fichiers, ${(size(served) / 1024).toFixed(0)} Ko`);
}

main().catch(e => { console.error(String(e?.message ?? e)); process.exit(1); });
