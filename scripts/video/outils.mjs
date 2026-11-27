// Outils communs de la chaîne vidéo (#155, docs/spec-video-pas-de-base.md).
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** Dossier de travail, ignoré par git : voix, plans, habillage, vidéo. */
export const TRAVAIL = join(RACINE, "essais", "video");

export function dossier(...parts) {
  const d = join(TRAVAIL, ...parts);
  mkdirSync(d, { recursive: true });
  return d;
}

/** ffmpeg du système s'il existe (filtres complets), sinon celui du dépôt (ffmpeg-static). */
export const FFMPEG = (() => {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0) return "ffmpeg";
  return require("ffmpeg-static");
})();

export function ffmpeg(args, options = {}) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { maxBuffer: 1 << 28, ...options });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`ffmpeg a rendu ${r.status} : ${String(r.stderr).trim().split("\n").slice(-6).join(" | ")}`);
  return r.stdout;
}

/** ffmpeg qui lit des images sur son entrée standard ; `fin()` attend l'encodage. */
export function ffmpegFlux(args) {
  const p = spawn(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["pipe", "inherit", "inherit"] });
  const termine = new Promise((resolve, reject) => {
    p.on("error", reject);
    p.on("close", code => (code === 0 ? resolve() : reject(new Error(`ffmpeg a rendu ${code}`))));
  });
  return {
    ecrire: buffer => new Promise((resolve, reject) => p.stdin.write(buffer, e => (e ? reject(e) : resolve()))),
    fin: () => { p.stdin.end(); return termine; },
  };
}

/** Durée d'un fichier son ou vidéo, en secondes (lue par ffmpeg, sans ffprobe). */
export function duree(fichier) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-i", fichier, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const times = [...r.stderr.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)];
  if (!times.length) throw new Error(`durée illisible : ${fichier}`);
  const [, h, m, s] = times[times.length - 1];
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/** Niveau intégré d'un son, en LUFS (filtre ebur128). */
export function niveau(fichier) {
  const r = spawnSync(FFMPEG, ["-hide_banner", "-nostats", "-i", fichier, "-af", "ebur128=framelog=quiet", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const m = /I:\s+(-?\d+(?:\.\d+)?) LUFS/.exec(r.stderr.split("Summary:").pop() ?? "");
  return m ? Number(m[1]) : -Infinity;
}

export const empreinte = value => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex").slice(0, 12);

export const lireJson = (fichier, defaut = undefined) => (existsSync(fichier) ? JSON.parse(readFileSync(fichier, "utf8")) : defaut);
export const ecrireJson = (fichier, value) => writeFileSync(fichier, JSON.stringify(value, null, 1) + "\n");

/** Chrome de Playwright : `CHROME_PATH` s'il est donné, sinon celui que Playwright trouve. */
export async function navigateur() {
  const { chromium } = require("playwright");
  return chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    args: ["--no-sandbox", "--ignore-gpu-blocklist", "--enable-webgl", "--hide-scrollbars"],
  });
}

/** Lit `--cle valeur` et `--drapeau` sur la ligne de commande. */
export function arguments_(argv = process.argv.slice(2)) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const cle = argv[i].slice(2);
    o[cle] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  }
  return o;
}
