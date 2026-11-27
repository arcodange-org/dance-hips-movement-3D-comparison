// La narration : chaque phrase dite par Phonon 40m français, en local (#155).
//
// Phonon tourne dans l'ollama de la machine (`http://127.0.0.1:11434`, modèle `phonon:40m-fr`) : aucune
// phrase ne sort d'ici. Licence CC BY-NC 4.0, attribution obligatoire « Voice: Phonon by Gradium —
// gradium.ai » (docs/spec-video-pas-de-base.md). Chaque phrase est gardée en cache par son texte et sa voix.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dossier, duree, ecrireJson, empreinte, ffmpeg, lireJson } from "./outils.mjs";

export const PHONON = { adresse: process.env.PHONON_URL ?? "http://127.0.0.1:11434", modele: process.env.PHONON_MODELE ?? "phonon:40m-fr" };
export const ATTRIBUTION_VOIX = "Voice: Phonon by Gradium — gradium.ai";

/** Chaîne de traitement : silences de bord retirés, grave coupé, léger éclaircissement, compression douce. */
const CHAINE = [
  "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05", "areverse",
  "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12", "areverse",
  "highpass=f=75", "equalizer=f=300:t=q:w=1.2:g=-2", "equalizer=f=3400:t=q:w=1:g=2",
  "acompressor=threshold=-20dB:ratio=2.5:attack=10:release=150:makeup=2",
  "loudnorm=I=-18:TP=-2:LRA=7", "aresample=48000",
].join(",");

/** Remplace les mots que la voix lirait mal par leur écriture phonétique (les sous-titres gardent l'orthographe). */
export function prononcer(texte, dictionnaire = {}) {
  let t = texte;
  for (const [mot, dit] of Object.entries(dictionnaire))
    t = t.replace(new RegExp(`(?<![\\p{L}])${mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "giu"), dit);
  return t;
}

async function synthese(texte, voix) {
  const reponse = await fetch(`${PHONON.adresse}/v1/audio/speech`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: PHONON.modele, input: texte, voice: voix, response_format: "wav" }),
  });
  if (!reponse.ok) throw new Error(`Phonon a répondu ${reponse.status} : ${(await reponse.text()).slice(0, 200)}`);
  return Buffer.from(await reponse.arrayBuffer());
}

/**
 * Dit une phrase ; rend le fichier (48 kHz mono) et sa durée. Le cache évite de redire une phrase inchangée.
 * @param {string} texte  texte à dire (déjà passé par `prononcer`)
 * @param {string} voix   voix Phonon (`ollama show phonon:40m-fr`)
 */
export async function dire(texte, voix, { refaire = false } = {}) {
  const dir = dossier("voix");
  const cle = empreinte({ texte, voix, modele: PHONON.modele, chaine: CHAINE });
  const fichier = join(dir, `${cle}.wav`), fiche = join(dir, `${cle}.json`);
  const connu = lireJson(fiche);
  if (!refaire && connu && existsSync(fichier)) return { fichier, duree: connu.duree, neuf: false };
  const brut = join(dir, `${cle}.brut.wav`);
  writeFileSync(brut, await synthese(texte, voix));
  ffmpeg(["-i", brut, "-af", CHAINE, "-ar", "48000", "-ac", "1", fichier]);
  const d = duree(fichier);
  ecrireJson(fiche, { texte, voix, duree: d });
  return { fichier, duree: d, neuf: true };
}

// Essai direct : node scripts/video/voix.mjs "<phrase>" Voix1,Voix2
if (import.meta.url === `file://${process.argv[1]}`) {
  const [texte = "Le pas de base sur place, c'est le poids du corps qui passe d'un pied à l'autre.", voix = "Hélène"] = process.argv.slice(2);
  for (const v of voix.split(",")) {
    const r = await dire(texte, v, { refaire: true });
    console.log(v.padEnd(10), r.duree.toFixed(2), "s", r.fichier);
  }
}
