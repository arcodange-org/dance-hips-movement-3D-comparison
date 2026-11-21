#!/usr/bin/env node
// Les musiques du film (#155) : un extrait par style, généré par Eleven Music (ElevenLabs), mesuré.
//
// La kizomba réutilise la piste de l'application (public/musique/kizomba.mp3, #142). Les autres styles ont
// un extrait dans scripts/video/pistes/, versionné avec sa provenance : remonter la vidéo ne rachète rien.
//
// RIEN n'est généré sans `--generer` : chaque seconde coûte des crédits (accord du propriétaire).
//   node scripts/video/musique.mjs                          état des pistes
//   node --env-file=<fichier> scripts/video/musique.mjs --generer semba,kompa --durees semba=38,kompa=36
// La clé `ELEVENLABS_API_KEY` vient de l'environnement ; elle n'est jamais écrite ni affichée.
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ANALYSIS_RATE, analyseTempo } from "../tempo.mjs";
import { SILENCE, decoder, lireRegistre, niveau as niveauPiste } from "../generer_musique.mjs";
import { CREDITS_PAR_MINUTE, MODELE, PROMPTS, VARIANTES, planContinu } from "../musique_prompts.mjs";
import { RACINE, arguments_, dossier, ecrireJson, lireJson } from "./outils.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
export const DOSSIER_PISTES = join(ICI, "pistes");
export const FICHE_PISTES = join(DOSSIER_PISTES, "pistes.json");
/** Variante (plan de composition) retenue pour la vidéo, par style. */
export const VARIANTE_VIDEO = "V";

/** Les pistes disponibles : style → {fichier, bpm, premierTemps, duree, gainDb, boucle?}. */
export function pistes() {
  const out = {};
  const kizomba = lireRegistre().find(p => p.style === "kizomba");
  if (kizomba) out.kizomba = {
    fichier: join(RACINE, "public", "musique", kizomba.file), bpm: kizomba.bpm, premierTemps: kizomba.firstBeat,
    duree: kizomba.duration, gainDb: kizomba.gainDb, boucle: kizomba.beats * 60 / kizomba.bpm,
  };
  for (const [style, p] of Object.entries(lireJson(FICHE_PISTES, {}))) {
    const fichier = join(DOSSIER_PISTES, p.fichier);
    if (existsSync(fichier)) out[style] = { fichier, bpm: p.bpm, premierTemps: p.premierTemps, duree: p.duree, gainDb: p.gainDb };
  }
  return out;
}

/** Tempo à défaut de piste : celui que la génération demandera. */
export const tempoPrevu = style => PROMPTS[style].bpm;

/** Mesure un extrait : tempo, premier temps, niveau, signature rythmique. */
export function mesurer(style, fichier) {
  const m = analyseTempo(decoder(fichier), ANALYSIS_RATE, { hint: PROMPTS[style].bpm });
  const n = niveauPiste(fichier);
  return {
    bpm: Math.round(m.bpm * 1000) / 1000, premierTemps: Math.round(m.firstBeat * 10000) / 10000,
    duree: Math.round(m.duration * 1000) / 1000, lufs: n.lufs, crete: n.crete,
    gainDb: Math.round(Math.min(-16 - n.lufs, -1 - n.crete) * 10) / 10,
    derive: Math.round(m.drift * 10000) / 10000, confiance: Math.round(m.confidence * 100) / 100,
    tempsEgaux: Math.round(m.rhythm.evenLow * 100) / 100, tresillo: Math.round((m.rhythm.tresillo ?? 0) * 100) / 100,
  };
}

async function generer(style, secondes, cle) {
  const corps = { composition_plan: planContinu(style, VARIANTE_VIDEO, secondes), model_id: MODELE };
  const r = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    method: "POST", headers: { "Content-Type": "application/json", "xi-api-key": cle }, body: JSON.stringify(corps),
  });
  if (!r.ok) {
    let detail = "";
    try { detail = JSON.stringify((await r.json()).detail ?? {}).slice(0, 500); } catch { /* corps non JSON */ }
    throw new Error(`génération ${style} : HTTP ${r.status} ${detail}`);
  }
  return { son: Buffer.from(await r.arrayBuffer()), corps };
}

async function credits(cle) {
  const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": cle } });
  if (!r.ok) return null;
  const s = await r.json();
  return s.character_limit - s.character_count;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = arguments_();
  if (!args.generer) {
    for (const [style, p] of Object.entries(pistes()))
      console.log(`${style.padEnd(11)} ${p.bpm.toFixed(2).padStart(7)} bpm  ${p.duree.toFixed(1).padStart(5)} s  premier temps ${p.premierTemps.toFixed(3)} s`);
    process.exit(0);
  }
  const cle = process.env.ELEVENLABS_API_KEY;
  if (!cle) { console.error("ELEVENLABS_API_KEY absente de l'environnement (node --env-file=<fichier> …)"); process.exit(2); }
  const durees = Object.fromEntries(String(args.durees ?? "").split(",").filter(Boolean).map(x => { const [s, d] = x.split("="); return [s, Number(d)]; }));
  const styles = String(args.generer).split(",").filter(s => PROMPTS[s] && VARIANTES[s]?.[VARIANTE_VIDEO]);
  mkdirSync(DOSSIER_PISTES, { recursive: true });
  const fiche = lireJson(FICHE_PISTES, {});
  const avant = await credits(cle);
  console.log(`crédits avant : ${avant}`);
  for (const style of styles) {
    const secondes = durees[style];
    if (!(secondes >= 8)) { console.error(`${style} : durée absente (--durees ${style}=NN)`); continue; }
    const prevu = planContinu(style, VARIANTE_VIDEO, secondes).chunks.reduce((n, c) => n + c.duration_ms, 0) / 1000;
    console.log(`${style} : ${secondes} s demandées, ${prevu.toFixed(1)} s en blocs entiers, environ ${Math.ceil(prevu / 60 * CREDITS_PAR_MINUTE)} crédits`);
    const { son, corps } = await generer(style, secondes, cle);
    const fichier = join(DOSSIER_PISTES, `${style}.mp3`);
    const neuf = join(dossier("musique"), `${style}-${Date.now()}.mp3`);
    writeFileSync(neuf, son);
    const lufs = niveauPiste(neuf).lufs;
    if (!(lufs > SILENCE)) { console.error(`${style} : prise SILENCIEUSE (${lufs} LUFS), gardée dans ${neuf}, non retenue`); continue; }
    const m = mesurer(style, neuf);
    renameSync(neuf, fichier);
    fiche[style] = {
      fichier: `${style}.mp3`, ...m, modele: MODELE, variante: VARIANTE_VIDEO, nom: VARIANTES[style][VARIANTE_VIDEO].nom,
      demande: { secondes, blocs: corps.composition_plan.chunks.length, styles: corps.composition_plan.chunks[0].positive_styles,
        aEviter: corps.composition_plan.chunks[0].negative_styles },
      genereLe: new Date().toISOString().slice(0, 10),
    };
    ecrireJson(FICHE_PISTES, fiche);
    console.log(`  ${m.bpm} bpm (demandé ${PROMPTS[style].bpm}), premier temps ${m.premierTemps} s, ${m.duree} s, ${m.lufs.toFixed(1)} LUFS, dérive ${m.derive}, confiance ${m.confiance}, temps égaux ${m.tempsEgaux}`);
  }
  const apres = await credits(cle);
  console.log(`crédits après : ${apres} (dépensé ${avant !== null && apres !== null ? avant - apres : "?"})`);
}
