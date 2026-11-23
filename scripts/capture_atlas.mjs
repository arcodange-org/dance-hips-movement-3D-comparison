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
//   --variante <id>       image comparative (D14, D15) : la règle de la planche et la variante côte à côte,
//                         dans un seul GIF synchronisé écrit dans docs/gifs/ ; aucune planche n'est écrite
// Environnement : CHROME_PATH (exécutable Chromium), CAPTURE_BASE (serveur déjà lancé ; sinon le
// script sert lui-même `dist/` sur un port libre, pour ne jamais capturer le build d'une autre session).
// Sorties : docs/atlas/mouvements/<id>/ (images, GIF, planche, meta.json, README.md) ; assets servis
// (meta.json, planche.png) copiés dans public/atlas/mouvements/<id>/.
// Spécification : docs/spec-atlas-anatomique.md (D7 à D14).
import { chromium } from "playwright";
import * as THREE from "three";
import ffmpegPath from "ffmpeg-static";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ATLAS_CAPTURE, DOCS_DIR, META_FILE, PLANCHE_FILE, PUBLIC_DIR, README_FILE, ROOT, atlasRepere, buildAtlasMeta, buildPlancheReadme,
  electionFile, frameFile, gifFile, gifSequence, loadAtlasApi, measureMovement, readManifest, serializeMeta, ELECTIONS_DIR,
} from "./atlas_meta.mjs";

/** Image d'élection (D14) : frames, échelle de capture, largeur d'une colonne et couleurs du GIF. */
const ELECTION = { frames: 17, echelle: 2, colonnePx: 320, couleurs: 96 };
const fr = (value, digits = 1) => value.toFixed(digits).replace(".", ",").replace("-", "−");
const entier = (value) => Math.round(value) || 0; // jamais « −0 »

/** Présentation propre à chaque élection (D14, D16) : vues, zone gardée de chaque image (px de la vue),
 * mesures sous chaque colonne, ligne repère de hauteur ou non, légende. */
const PRESENTATIONS = {
  "obliquite-genoux": {
    vues: ["face", "troisQuarts"], zone: { x: 95, y: 170, w: 210, h: 300 }, ligne: true,
    mesures: (m, ctx) => [["genou droit", `${fr(m.genouDeg.R, 0)}°`], ["genou gauche", `${fr(m.genouDeg.L, 0)}°`], ["bassin", `+${fr(m.bassinMm - ctx.basse, 0)} mm`]],
    legende: "<span>- - -</span> hauteur des hanches la plus basse de l'amplitude · « bassin » : hauteur au-dessus de cette ligne.",
  },
  "rotation-buste": {
    vues: ["face", "troisQuarts"], zone: { x: 95, y: 52, w: 210, h: 400 }, ligne: false,
    mesures: (m, ctx) => [["bassin tourné", `${fr(entier(ctx.angle), 0)}°`], ["thorax tourné", `${fr(entier(m.thoraxLacetDeg), 0)}°`],
      ["torsion du dos", `${fr(entier(Math.abs(ctx.angle - m.thoraxLacetDeg)), 0)}°`]],
    legende: "Angles signés, même sens de rotation pour le bassin et le thorax : un signe opposé veut dire « en sens inverse ». « Torsion du dos » : rotation du bassin moins celle du thorax.",
  },
};


function parseArgs(argv) {
  const options = { mouvement: null, frames: null, vues: null, muscles: true, metaSeul: false, variante: null };
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
    else if (arg === "--variante") options.variante = next();
    else throw new Error(`option inconnue : ${arg}`);
  }
  if (!options.mouvement) throw new Error("--mouvement <id> requis (ids : docs/atlas/manifest.json)");
  return options;
}

/** Attente maximale d'une image (signal de rendu, puis capture). Large : en rendu logiciel sur une machine
 * chargée, une image peut mettre plus de 30 s à se stabiliser. */
const ATTENTE_MS = 180000;

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
    `à ${api.atlasAngleLabel(f.angleDeg)}, ${atlasRepere(meta).phrase(f)}, genou droit fléchi de ${
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
      ${meta.regle ? `<div><b>Règle de pose :</b> ${escapeHtml(meta.regle.label)} (${escapeHtml(meta.regle.description)}). Variante « ${
        escapeHtml(meta.regle.variantes.map(v => v.label).join(" », « "))} » : page de la planche.</div>` : ""}
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
      await rendered(s, ATTENTE_MS);
      await page.locator("[data-atlas-cadre]").screenshot({ path: join(dir, frameFile(vue.id, frame)), timeout: ATTENTE_MS });
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

/** Rangée d'image (px de la vue) où se projette un point monde, pour la caméra de la vue. */
function rangeeImage(api, mouvement, vue, point) {
  const view = api.atlasView(vue, mouvement.cote), { hautPx, basPx } = api.ATLAS_BANDES;
  const hauteur = ATLAS_CAPTURE.hauteurPx - hautPx - basPx;
  const camera = new THREE.PerspectiveCamera(api.ATLAS_FOV, ATLAS_CAPTURE.largeurPx / hauteur, 0.1, 100);
  camera.position.fromArray(view.position);
  camera.lookAt(...view.target);
  camera.updateMatrixWorld();
  return hautPx + (1 - point.clone().project(camera).y) / 2 * hauteur;
}

/** Une image du GIF comparatif : les règles côte à côte, une rangée par vue, mesures de l'image en cours. */
function electionHtml(api, mouvement, election, regles, vues, index, reperes, dataUri) {
  const presentation = PRESENTATIONS[election.id], { zone } = presentation, { colonnePx } = ELECTION, k = colonnePx / zone.w;
  const basse = Math.min(...regles.flatMap(r => r.samples.map(s => s.mesure.bassinMm)));
  const angle = regles[0].samples[index].angleDeg;
  const colonne = (r) => {
    const m = r.samples[index].mesure, mesures = presentation.mesures(m, { basse, angle });
    return `<section>
      <h2><b class="${r.retenue ? "retenue" : ""}">${r.lettre}</b> ${escapeHtml(r.label)} <span>${r.retenue ? "règle de la planche" : "variante"}</span></h2>
      <p class="regle">${escapeHtml(r.regle)}</p>
      ${vues.map(vue => `<div class="cell"><img src="${dataUri(r, vue, index)}" alt="">
        ${reperes ? `<i style="top:${((reperes[vue] - zone.y) * k).toFixed(1)}px"></i>` : ""}<small>${escapeHtml(api.atlasVueLabel(vue, mouvement.cote))}</small></div>`).join("")}
      <table><tr>${mesures.map(([label]) => `<td>${escapeHtml(label)}</td>`).join("")}</tr>
        <tr>${mesures.map(([, valeur]) => `<th>${valeur}</th>`).join("")}</tr></table>
    </section>`;
  };
  return `<!doctype html><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #0b1220; color: #e2e8f0; font: 13px/1.35 -apple-system, "Segoe UI", "DejaVu Sans", Arial, sans-serif; }
    #election { display: inline-block; padding: 12px 14px 10px; width: ${regles.length * colonnePx + (regles.length - 1) * 10 + 28}px; }
    h1 { margin: 0; font-size: 17px; font-weight: 650; }
    .sub { margin: 1px 0 8px; color: #94a3b8; font-size: 12.5px; }
    .sub b { color: #5eead4; font-weight: 600; font-variant-numeric: tabular-nums; }
    .cols { display: flex; gap: 10px; }
    section { width: ${colonnePx}px; }
    h2 { margin: 0; font-size: 15px; font-weight: 600; }
    h2 b { display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 4px; background: #64748b; color: #0b1220; margin-right: 4px; }
    h2 b.retenue { background: #5eead4; }
    h2 span { font-size: 11.5px; font-weight: 400; color: #94a3b8; margin-left: 2px; }
    .regle { margin: 3px 0 5px; color: #94a3b8; font-size: 11.5px; height: 31px; overflow: hidden; }
    .cell { position: relative; width: ${colonnePx}px; height: ${(zone.h * k).toFixed(1)}px; overflow: hidden; border-radius: 4px; margin-bottom: 4px; }
    .cell img { position: absolute; left: ${(-zone.x * k).toFixed(1)}px; top: ${(-zone.y * k).toFixed(1)}px; width: ${(ATLAS_CAPTURE.largeurPx * k).toFixed(1)}px; }
    .cell i { position: absolute; left: 0; right: 0; border-top: 1px dashed #fbbf24; opacity: .9; }
    .cell small { position: absolute; left: 6px; bottom: 4px; color: #94a3b8; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; text-align: center; }
    td { color: #94a3b8; font-size: 11.5px; padding: 2px 0 0; }
    th { font-size: 19px; font-weight: 650; font-variant-numeric: tabular-nums; padding: 0; }
    footer { margin-top: 7px; color: #64748b; font-size: 10.5px; }
    footer span { color: #fbbf24; }
  </style><div id="election">
    <h1>${escapeHtml(election.question)}</h1>
    <p class="sub">${escapeHtml(mouvement.label)} · bassin à <b>${escapeHtml(api.atlasAngleLabel(angle))}</b> · même caméra et même angle de bassin ${regles.length === 2 ? "des deux côtés" : "dans chaque colonne"}</p>
    <div class="cols">${regles.map(colonne).join("")}</div>
    <footer>${presentation.legende}<br>
      ${escapeHtml(api.ATLAS_ATTRIBUTION)}. Généré paramétriquement : pas une mesure sur une personne.</footer>
  </div>`;
}

/** D14, D15 : capture la règle de la planche et la variante, assemble un seul GIF synchronisé (colonnes dans
 * l'ordre des lettres de l'élection). */
async function election(api, manifest, options) {
  const mouvement = manifest.mouvements.find(m => m.id === options.mouvement);
  if (!mouvement) throw new Error(`mouvement « ${options.mouvement} » absent du manifeste`);
  const support = api.atlasSupport(mouvement);
  if (!support.ok) throw new Error(support.raison);
  // `--variante b,c` : plusieurs variantes, une colonne chacune à côté de la règle de la planche (D16).
  const noms = options.variante.split(",").map(v => v.trim()).filter(Boolean);
  for (const nom of noms) {
    const choix = api.atlasRegle(mouvement, nom);
    if (!choix.ok) throw new Error(choix.raison);
    if (!choix.variante) throw new Error(`« ${nom} » est la règle de la planche ${mouvement.id} : rien à comparer`);
  }
  const election = api.ATLAS_ELECTIONS[mouvement.id], presentation = PRESENTATIONS[election.id];
  if (!presentation) throw new Error(`élection ${election.id} : pas de présentation dans capture_atlas.mjs (PRESENTATIONS)`);
  const frames = options.frames ?? ELECTION.frames, vues = options.vues ?? presentation.vues;
  if (!Number.isInteger(frames) || frames < 2 || frames > api.ATLAS_FRAMES_MAX) throw new Error(`--frames entre 2 et ${api.ATLAS_FRAMES_MAX}`);
  const inconnues = vues.filter(v => !manifest.views.includes(v));
  if (inconnues.length) throw new Error(`vues inconnues : ${inconnues.join(", ")}`);
  const regles = election.regles.filter(r => r.id === election.retenue || noms.includes(r.id))
    .map(r => ({ ...r, retenue: r.id === election.retenue, ...measureMovement(api, mouvement, frames, r.id) }));
  // Ligne fixe : le centre du bassin à sa hauteur la plus basse, projeté par la caméra de chaque vue.
  const bas = regles.flatMap(r => r.samples).reduce((a, b) => (b.mesure.bassinMm < a.mesure.bassinMm ? b : a));
  api.applyAtlasPose(regles[0].fixture.r, regles[0].fixture.model, mouvement, bas.angleDeg);
  regles[0].fixture.r.root.updateWorldMatrix(true, true);
  const centre = regles[0].fixture.r.pelvis.getWorldPosition(new THREE.Vector3());
  const reperes = presentation.ligne ? Object.fromEntries(vues.map(vue => [vue, rangeeImage(api, mouvement, vue, centre)])) : null;

  const server = process.env.CAPTURE_BASE ? { base: process.env.CAPTURE_BASE, stop: () => {} } : await servePreview();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const scratch = mkdtempSync(join(tmpdir(), "atlas-election-"));
  try {
    const page = await browser.newPage({ viewport: { width: ATLAS_CAPTURE.largeurPx, height: ATLAS_CAPTURE.hauteurPx }, deviceScaleFactor: ELECTION.echelle });
    const errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    page.on("console", m => { if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) errors.push(m.text()); });
    const state = (r, vue, frame) => ({ id: mouvement.id, vue, frame, frames, muscles: options.muscles, variante: r.id });
    const rendered = (s, timeout) => page.waitForFunction(key => document.documentElement.dataset.atlasRendu === key, api.atlasKey(s), { timeout })
      .catch(() => { throw new Error(`pas de signal de rendu pour ${api.atlasKey(s)} : dist/ périmé (relancer \`npm run build\`) ou page en erreur ${JSON.stringify(errors.slice(0, 3))}`); });
    const file = (r, vue, frame) => join(scratch, `${r.lettre}-${frameFile(vue, frame)}`);
    const first = state(regles[0], vues[0], 0);
    await page.goto(server.base + "?" + api.atlasQuery(first), { waitUntil: "load", timeout: 60000 });
    await rendered(first, 90000);
    await page.evaluate(() => document.fonts.ready.then(() => true));
    for (const r of regles) for (const vue of vues) for (let frame = 0; frame < frames; frame++) {
      const s = state(r, vue, frame);
      await page.evaluate(query => { history.replaceState(null, "", "?" + query); window.dispatchEvent(new PopStateEvent("popstate")); }, api.atlasQuery(s));
      await rendered(s, ATTENTE_MS);
      await page.locator("[data-atlas-cadre]").screenshot({ path: file(r, vue, frame), timeout: ATTENTE_MS });
    }
    if (errors.length) throw new Error("erreurs console pendant la capture : " + JSON.stringify(errors.slice(0, 5)));
    const dataUri = (r, vue, frame) => "data:image/png;base64," + readFileSync(file(r, vue, frame)).toString("base64");
    const sheet = await browser.newPage({ viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 1 });
    for (let frame = 0; frame < frames; frame++) {
      await sheet.setContent(electionHtml(api, mouvement, election, regles, vues, frame, reperes, dataUri), { waitUntil: "load" });
      await sheet.locator("#election").screenshot({ path: join(scratch, `c${String(frame).padStart(3, "0")}.png`) });
    }
    gifSequence(frames).forEach((frame, k) => copyFileSync(join(scratch, `c${String(frame).padStart(3, "0")}.png`), join(scratch, `s${String(k).padStart(3, "0")}.png`)));
    mkdirSync(ELECTIONS_DIR, { recursive: true });
    const out = join(ELECTIONS_DIR, electionFile(election));
    ffmpeg(["-framerate", String(ATLAS_CAPTURE.gifImagesParSeconde), "-i", join(scratch, "s%03d.png"),
      "-vf", `split[a][b];[a]palettegen=max_colors=${ELECTION.couleurs}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      "-loop", "0", out]);
    console.log(`élection ${election.id} (${mouvement.id}) : ${regles.map(r => `${r.lettre} ${r.id}`).join(", ")} ; ${frames} frames × ${vues.length} vues × ${regles.length} règles`);
    console.log(`  docs/gifs/${electionFile(election)} : ${(statSync(out).size / 1024).toFixed(0)} Ko, ${gifSequence(frames).length} images`);
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
  if (options.variante) {
    if (options.metaSeul) throw new Error("--variante et --meta-seul ne vont pas ensemble : une variante n'a pas de meta.json");
    return election(api, manifest, options);
  }
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
