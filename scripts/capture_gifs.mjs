#!/usr/bin/env node
// Capture des GIFs de démonstration depuis l'app buildée (vite preview en loopback).
// L'habillage "motion design" (pastille de style, légende de la nuance, pastille de
// temps) est rendu par la page elle-même en mode bare via ?demo=<clé> (src/components/
// DemoOverlay.tsx) et donc enregistré directement dans la vidéo ; ffmpeg ne fait que
// le recadrage éventuel, le rééchantillonnage et la palette GIF.
//
// Usage : npm run build && npm run capture
//   CAPTURE_BASE=http://127.0.0.1:4173/ npm run capture
// Les GIFs sont écrits dans docs/gifs/ et référencés depuis le README.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ffmpegPath = require("ffmpeg-static");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs", "gifs");
const tmpDir = "/tmp/danse-captures";
const base = process.env.CAPTURE_BASE || "http://127.0.0.1:4173/";

// Chromium headless sans root : libs extraites localement (paquets .deb de Debian)
const DEB_LIBS = "/tmp/debs/root/usr/lib/x86_64-linux-gnu";
if (existsSync(DEB_LIBS)) {
  process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
    ? DEB_LIBS + ":" + process.env.LD_LIBRARY_PATH
    : DEB_LIBS;
}
// Police système pour le rendu du texte (sinon aucun glyphe n'est rendu en headless)
const FONTCONF = "/tmp/fontconfig/fonts.conf";
if (existsSync(FONTCONF)) process.env.FONTCONFIG_FILE = FONTCONF;

// Toutes les captures sont volontairement "sur place" (travel=0) pour mettre en
// avant les nuances de hanche ; la sortie garçon/fille est un mode Face à face.
// demo = clé dans DEMOS (DemoOverlay.tsx), crop = recadrage hanche {w,h,x,y} sur la
// vidéo 960x640 (cadrée sur le bassin et les jambes).
const CAPTURES = [
  {
    file: "kizomba-muscles-sur-place",
    query: "bare=1&demo=kizomba-muscles&cam=hip&mode=solo&style=kizomba&bpm=90&travel=0&muscles=1&appui=1",
    dur: 4.5,
  },
  {
    file: "kizomba",
    query: "bare=1&demo=kizomba&cam=hip&mode=solo&style=kizomba&bpm=90&travel=0&solid=1",
  },
  { file: "semba", query: "bare=1&demo=semba&mode=solo&style=semba&bpm=130&travel=0&solid=1" },
  {
    file: "kompa",
    query: "bare=1&demo=kompa&cam=hip&mode=solo&style=kompa&bpm=120&travel=0&solid=1",
  },
  {
    file: "tarraxinha",
    query: "bare=1&demo=tarraxinha&cam=hip&mode=solo&style=tarraxinha&bpm=100&travel=0&solid=1",
  },
  { file: "suave", query: "bare=1&demo=suave&mode=solo&style=suave&bpm=60&travel=0&solid=1" },
  { file: "zouk", query: "bare=1&demo=zouk&mode=solo&style=zouk&bpm=110&travel=0&solid=1" },
  {
    file: "sortie-garcon-fille",
    query: "bare=1&demo=sortie-garcon-fille&cam=diag&mode=pair&style=kizomba&styleB=kizomba&bpm=90&sortie=1&delay=2&solid=1&ligne=1&repere=1",
    dur: 5.5,
  },
  {
    file: "appui-transmission",
    query: "bare=1&demo=appui&cam=hip&mode=observe&style=kizomba&bpm=32&travel=0&torso=0&appui=1&muscles=1",
  },
  {
    file: "comparatif-appuis",
    query: "bare=1&demo=comparatif-appuis&cam=wide&mode=compare&style=kizomba&styleB=kompa&bpm=90&travel=0&appui=1&solid=1&ligne=1&repere=1",
  },
  {
    file: "corridinho",
    query: "bare=1&demo=corridinho&cam=fixed&mode=solo&style=kizomba&bpm=140&travel=0&corridinho=1&solid=1&ligne=1&repere=1",
    dur: 6.5,
  },
  {
    file: "isolation-ginga",
    query: "bare=1&demo=iso-ginga&cam=diag&mode=solo&style=kizomba&bpm=90&travel=0&muscles=1&appui=1&solid=1&iso=1&cadre=1",
  },
  {
    file: "fessiers-muscles",
    query: "bare=1&demo=fessiers&cam=back&mode=solo&style=kizomba&bpm=90&travel=0&muscles=1&solid=1&iso=1&cadre=1",
  },
  {
    file: "quarts-de-tour",
    query: "bare=1&demo=quarts-de-tour&cam=fixed&mode=solo&style=kizomba&bpm=140&travel=0&quarts=1&solid=1&ligne=1&repere=1",
    dur: 7,
  },
  {
    file: "virgula-quarts",
    query: "bare=1&demo=virgula&cam=top&mode=solo&style=kizomba&bpm=140&travel=0&quarts=1&solid=1&ligne=1&repere=1&boussole=1",
    dur: 7,
  },
  {
    file: "corridinho-paire",
    query: "bare=1&demo=corridinho-paire&cam=wide&mode=pair&style=kizomba&styleB=kizomba&bpm=140&corridinho=1&solid=1&ligne=1&repere=1",
    dur: 6.5,
  },
  {
    file: "marche-3temps",
    query: "bare=1&demo=marche-3temps&cam=fixed&mode=solo&style=kizomba&bpm=90&travel=0.8&temps3=1&dir=1&solid=1&ligne=1&repere=1",
    dur: 5,
  },
  {
    file: "marche-arriere",
    query: "bare=1&demo=marche-arriere&cam=fixed&mode=solo&style=kizomba&bpm=90&travel=0.8&temps3=1&dir=-1&solid=1&ligne=1&repere=1",
    dur: 5,
  },
  {
    file: "ida-e-volta",
    query: "bare=1&demo=ida-e-volta&cam=diag&mode=pair&style=kizomba&styleB=kizomba&bpm=90&travel=0&ida=1&solid=1&ligne=1&repere=1",
    dur: 6,
  },
];

const WARMUP_S = 2.5; // secondes ignorées au début (chargement GLB)
const FPS = 12;
const WIDTH = 520;

async function captureOne(browser, cap) {
  const dur = cap.dur || 4;
  const context = await browser.newContext({
    viewport: { width: 960, height: 640 },
    recordVideo: { dir: tmpDir, size: { width: 960, height: 640 } },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(base + "?" + cap.query, { waitUntil: "load", timeout: 30000 });
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(3500); // laisse le GLB charger et l'anim démarrer
  const video = page.video();
  await page.waitForTimeout(dur * 1000 + 500);
  await context.close();
  if (errors.length) console.warn(`  [${cap.file}] erreurs console:`, errors.slice(0, 3));
  const webm = await video.path();
  const gif = join(outDir, cap.file + ".gif");
  // sonde la durée réelle (la vidéo peut être plus courte que prévu si la page rame)
  let ss = WARMUP_S;
  try {
    const probe = execFileSync(ffmpegPath, ["-i", webm], { stdio: ["pipe", "pipe", "pipe"] }).toString();
    const m = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(probe);
    if (m) {
      const total = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      ss = Math.max(0, Math.min(WARMUP_S, total - dur - 0.4));
    }
  } catch { /* sonde best-effort : on garde WARMUP_S */ }
  const crop = cap.crop ? `crop=${cap.crop.w}:${cap.crop.h}:${cap.crop.x}:${cap.crop.y},` : "";
  const vf =
    `fps=${FPS},${crop}scale=${WIDTH}:-2:flags=lanczos,split[s0][s1];` +
    `[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4`;
  execFileSync(
    ffmpegPath,
    ["-y", "-ss", String(ss), "-t", String(dur), "-i", webm, "-vf", vf, "-loop", "0", gif],
    { stdio: "pipe" }
  );
  console.log(`GIF ${cap.file}.gif <- ${webm} (ss=${ss.toFixed(2)}s)`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  rmSync(tmpDir, { recursive: true, force: true });
  mkdirSync(tmpDir, { recursive: true });
  // CAPTURE_ONLY=virgula-quarts,quarts-de-tour : ne rejouer qu'une sélection (itération rapide).
  const only = process.env.CAPTURE_ONLY ? process.env.CAPTURE_ONLY.split(",").map((s) => s.trim()) : null;
  const list = only ? CAPTURES.filter((c) => only.includes(c.file)) : CAPTURES;
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  for (const cap of list) await captureOne(browser, cap);
  await browser.close();
  for (const f of readdirSync(tmpDir)) if (f.endsWith(".webm")) rmSync(join(tmpDir, f));
  console.log(
    "GIFs écrits dans docs/gifs/:",
    readdirSync(outDir).filter((f) => f.endsWith(".gif")).join(", ")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
