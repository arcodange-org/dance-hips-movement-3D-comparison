#!/usr/bin/env node
// Génère les pistes enregistrées avec Eleven Music (ElevenLabs), les mesure et met à jour le
// registre (#142, docs/spec-musique-elevenlabs.md).
//
//   node scripts/generer_musique.mjs --plan                 prompts, durées, coût estimé (aucun réseau)
//   node scripts/generer_musique.mjs --abonnement           offre et crédits restants (appel gratuit)
//   node scripts/generer_musique.mjs --styles kizomba       génère les pistes manquantes de la liste
//   node scripts/generer_musique.mjs --refaire --styles …   régénère (écrase : chaque prise coûte des crédits)
//   node scripts/generer_musique.mjs --analyse              re-mesure les fichiers présents (aucun réseau)
//   node scripts/generer_musique.mjs --essais kizomba       extraits courts des variantes du style, hors dépôt (essais/musique/)
//   … --variante kizomba=C                                  prise complète à partir de la variante choisie à l'oreille
//   … --decaler kizomba=4                                   décale le temps 1 de 4 temps (validation à l'oreille)
//   … --temps kizomba=32                                    impose la longueur de la boucle (multiple de 8 temps)
//
// La clé est lue dans la variable d'environnement ELEVENLABS_API_KEY. Elle n'est JAMAIS écrite :
// ni journal, ni fichier, ni URL. Pour la lire d'un fichier d'environnement sans l'afficher :
//   node --env-file=/chemin/.env.local scripts/generer_musique.mjs …
// Besoin de ffmpeg pour le décodage et la mesure du niveau.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CREDITS_PAR_MINUTE, DUREE_ESSAI, MODELE, PROMPTS, VARIANTES, coutEstime, creditsPour, planDe, texteDe } from "./musique_prompts.mjs";
import { ANALYSIS_RATE, analyseTempo } from "./tempo.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DOSSIER = join(root, "public", "musique");
/** Extraits d'essai : jamais publiés (dossier ignoré par git). */
export const ESSAIS = join(root, "essais", "musique");
export const REGISTRE = join(root, "src", "music", "recordings.data.ts");
export const PAGE = join(root, "docs", "musique", "enregistrements.md");
const API = "https://api.elevenlabs.io";
/** Niveau visé (LUFS intégrés) et crête maximale après correction (dBFS). */
const NIVEAU = -16;
const CRETE = -1;
/** Au-delà, la piste est à refaire ou à valider à l'oreille. */
export const SEUILS = { tempo: 0.04, derive: 0.015, confiance: 0.3, tempsEgaux: 0.75 };

// ------------------------------------------------------------------------------------------ registre
const MARQUES = [/\/\* <pistes> \*\/([\s\S]*?)\/\* <\/pistes> \*\//, /<!-- pistes -->([\s\S]*?)<!-- \/pistes -->/];

export function lireRegistre(fichier = REGISTRE) {
  const m = readFileSync(fichier, "utf8").match(MARQUES[0]);
  if (!m) throw new Error(`marqueurs <pistes> introuvables dans ${fichier}`);
  return JSON.parse(m[1]);
}

export function ecrireRegistre(pistes, fichier = REGISTRE) {
  const ordre = Object.keys(PROMPTS);
  const tri = [...pistes].sort((a, b) => ordre.indexOf(a.style) - ordre.indexOf(b.style));
  const src = readFileSync(fichier, "utf8");
  writeFileSync(fichier, src.replace(MARQUES[0], () => `/* <pistes> */ ${JSON.stringify(tri, null, 2)} /* </pistes> */`));
  return tri;
}

/** Tableau de provenance de docs/musique/enregistrements.md, entre ses marqueurs. */
export function tableauProvenance(pistes) {
  if (!pistes.length) return "Aucune piste n'est publiée pour l'instant.";
  const lignes = pistes.map((p) =>
    `| ${p.style} | \`public/musique/${p.file}\` | ${p.bpm.toFixed(2)} bpm | ${p.beats} temps | ${p.model} | ${p.generatedAt} |`);
  const prompts = pistes.map((p) => `- **${p.style}** : « ${p.prompt} »`);
  return ["| Style | Fichier | Tempo mesuré | Boucle | Modèle | Date |", "|---|---|---|---|---|---|", ...lignes, "", "Prompts :", "", ...prompts].join("\n");
}

function ecrirePage(pistes) {
  const src = readFileSync(PAGE, "utf8");
  if (!MARQUES[1].test(src)) throw new Error(`marqueurs <!-- pistes --> introuvables dans ${PAGE}`);
  writeFileSync(PAGE, src.replace(MARQUES[1], () => `<!-- pistes -->\n${tableauProvenance(pistes)}\n<!-- /pistes -->`));
}

// ------------------------------------------------------------------------------------------ mesure
function ffmpeg(args, options = {}) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", ...args], { maxBuffer: 1 << 28, ...options });
  if (r.error) throw new Error(`ffmpeg introuvable ou en échec : ${r.error.message}`);
  return r;
}

/** Décode en mono 11 025 Hz (ffmpeg retire le délai d'encodage du mp3). */
export function decoder(fichier) {
  const r = ffmpeg(["-v", "error", "-i", fichier, "-ac", "1", "-ar", String(ANALYSIS_RATE), "-f", "f32le", "-"]);
  if (r.status !== 0) throw new Error(`décodage de ${fichier} : ${r.stderr.toString().trim()}`);
  const buf = r.stdout;
  return new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4)).slice();
}

/** Niveau intégré (LUFS) et crête (dBFS) : filtre ebur128 de ffmpeg. */
export function niveau(fichier) {
  const r = ffmpeg(["-v", "info", "-i", fichier, "-af", "ebur128=peak=sample", "-f", "null", "-"]);
  const texte = r.stderr.toString();
  const resume = texte.slice(texte.lastIndexOf("Summary:"));
  const lufs = Number(resume.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
  const crete = Number(resume.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]);
  if (!Number.isFinite(lufs)) throw new Error(`niveau de ${fichier} illisible`);
  return { lufs, crete: Number.isFinite(crete) ? crete : 0 };
}

/** Mesure un fichier : entrée de registre + avertissements. */
export function mesurer(style, fichier, base = {}, decalage = 0, temps = 0) {
  const demande = PROMPTS[style];
  const samples = decoder(fichier);
  const m = analyseTempo(samples, ANALYSIS_RATE, { hint: demande.bpm, shiftBeats: decalage, loopBeats: temps });
  const n = niveau(fichier);
  const gainDb = Math.round(Math.min(NIVEAU - n.lufs, CRETE - n.crete) * 10) / 10;
  const piste = {
    style, file: `${style}.mp3`,
    bpm: Math.round(m.bpm * 1000) / 1000,
    firstBeat: Math.round(m.firstBeat * 10000) / 10000,
    beats: m.beats,
    duration: Math.round(m.duration * 1000) / 1000,
    gainDb,
    prompt: base.prompt ?? demande.prompt,
    model: base.model ?? MODELE,
    generatedAt: base.generatedAt ?? new Date().toISOString().slice(0, 10),
    measure: { drift: Math.round(m.drift * 10000) / 10000, confidence: Math.round(m.confidence * 100) / 100 },
    ...(base.variant ? { variant: base.variant } : {}),
    ...(decalage ? { shiftBeats: decalage } : {}),
    ...(temps ? { loopBeats: temps } : {}),
  };
  const alertes = [];
  if (Math.abs(m.bpm - demande.bpm) / demande.bpm > SEUILS.tempo) alertes.push(`tempo mesuré ${m.bpm.toFixed(2)} bpm, demandé ${demande.bpm}`);
  if (m.drift > SEUILS.derive) alertes.push(`dérive ${(m.drift * 1000).toFixed(0)} ms`);
  if (m.confidence < SEUILS.confiance) alertes.push(`sur un quart du morceau, seulement ${(m.confidence * 100).toFixed(0)} % des temps portent une attaque (tempo instable ?)`);
  if (m.rhythm.evenLow >= SEUILS.tempsEgaux) alertes.push(`attaque grave d'égale force sur les quatre temps (${m.rhythm.evenLow.toFixed(2)}) : pulsation de musique électronique de danse, à vérifier à l'oreille`);
  if (m.beats < 32) alertes.push(`boucle courte : ${m.beats} temps`);
  if (m.beats === 0) alertes.push("aucune boucle de 8 temps ne tient dans le fichier");
  return { piste, alertes, mesure: m };
}

/** Signature rythmique lisible : force des attaques graves sur les quatre temps, syncope 3-3-2. */
export function signature(m) {
  const temps = [0, 4, 8, 12].map((i) => m.rhythm.low[i].toFixed(2)).join(" ");
  return `grave sur les temps 1 à 4 : ${temps} ; syncope 3-3-2 dans l'aigu : ${m.rhythm.tresillo.toFixed(2)}`;
}

// ------------------------------------------------------------------------------------------ API
async function appel(chemin, cle, init = {}) {
  // La clé ne voyage que dans l'en-tête ; aucun message n'affiche les en-têtes.
  return fetch(API + chemin, { ...init, headers: { "xi-api-key": cle, ...(init.headers ?? {}) } });
}

async function creditsRestants(cle) {
  const r = await appel("/v1/user/subscription", cle);
  if (!r.ok) throw new Error(`abonnement illisible : HTTP ${r.status}`);
  const a = await r.json();
  return { offre: a.tier, reste: (a.character_limit ?? 0) - (a.character_count ?? 0) };
}

/** Corps de la requête : prompt du style, ou plan de composition d'une variante (sans paramètres réservés au prompt). */
export function corpsRequete(style, modele, variante = null, seconds = PROMPTS[style].seconds) {
  if (variante) return { composition_plan: planDe(style, variante, seconds), model_id: modele };
  return { prompt: PROMPTS[style].prompt, music_length_ms: seconds * 1000, model_id: modele, force_instrumental: true };
}

async function generer(style, cle, modele, variante = null, seconds = PROMPTS[style].seconds) {
  const r = await appel("/v1/music?output_format=mp3_44100_128", cle, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpsRequete(style, modele, variante, seconds)),
  });
  if (!r.ok) {
    let detail = "";
    try { detail = JSON.stringify((await r.json()).detail ?? {}).slice(0, 600); } catch { /* corps non JSON */ }
    throw new Error(`génération ${style} : HTTP ${r.status} ${detail}`);
  }
  return Buffer.from(await r.arrayBuffer());
}

// ------------------------------------------------------------------------------------------ CLI
export function lireArguments(argv) {
  const o = { plan: false, analyse: false, refaire: false, styles: Object.keys(PROMPTS), decaler: {}, temps: {}, variante: {}, modele: MODELE };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--plan") o.plan = true;
    else if (a === "--abonnement") o.abonnement = true;
    else if (a === "--analyse") o.analyse = true;
    else if (a === "--refaire") o.refaire = true;
    else if (a === "--styles") o.styles = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--modele") o.modele = argv[++i];
    else if (a === "--essais") o.essais = argv[++i];
    else if (a === "--duree") o.duree = Number(argv[++i]);
    else if (a === "--variante") {
      const [style, v] = argv[++i].split("=");
      if (!VARIANTES[style]?.[v]) throw new Error(`variante inconnue ${style}=${v}`);
      o.variante[style] = v;
    }
    else if (a === "--decaler" || a === "--temps") {
      const [style, n] = argv[++i].split("=");
      const cible = a === "--decaler" ? o.decaler : o.temps;
      cible[style] = Number(n);
      if (!Number.isFinite(cible[style])) throw new Error(`${a} ${style}=<nombre de temps>`);
    } else throw new Error(`option inconnue ${a}`);
  }
  for (const s of [...o.styles, ...Object.keys(o.decaler), ...Object.keys(o.temps)]) if (!PROMPTS[s]) throw new Error(`style inconnu ${s} (${Object.keys(PROMPTS).join(", ")})`);
  if (o.essais !== undefined && !VARIANTES[o.essais]) throw new Error(`pas de variantes pour ${o.essais} (${Object.keys(VARIANTES).join(", ")})`);
  if (o.duree !== undefined && !(o.duree >= 5 && o.duree <= 60)) throw new Error("--duree : entre 5 et 60 secondes");
  return o;
}

export function plan(styles) {
  const lignes = styles.map((s) => {
    const d = PROMPTS[s];
    return `${s.padEnd(11)} ${String(d.bpm).padStart(3)} bpm  boucle visée ${String(d.beats).padStart(3)} temps  ${d.seconds} s\n  ${d.prompt}`;
  });
  const { seconds, credits } = coutEstime(styles);
  const variantes = styles.filter((s) => VARIANTES[s]).map((s) => {
    const noms = Object.entries(VARIANTES[s]).map(([cle, v]) => `  ${cle} — ${v.nom}`);
    const n = noms.length;
    return `Variantes de ${s} (plans de composition) :\n${noms.join("\n")}\n  Essais : ${n} extraits de ${DUREE_ESSAI} s, environ ${creditsPour(n * DUREE_ESSAI)} crédits (--essais ${s}) ; prise complète : --variante ${s}=<lettre>.`;
  });
  return `${lignes.join("\n")}\n\nTotal : ${seconds} s (${(seconds / 60).toFixed(1)} min), environ ${credits} crédits à ${CREDITS_PAR_MINUTE} crédits par minute.${variantes.length ? "\n\n" + variantes.join("\n") : ""}`;
}

/** Extraits courts de chaque variante d'un style, écrits hors dépôt, avec leur signature rythmique. */
async function essais(style, seconds, modele) {
  const cle = cleRequise();
  const lettres = Object.keys(VARIANTES[style]);
  const credits = creditsPour(lettres.length * seconds);
  const { offre, reste } = await creditsRestants(cle);
  console.log(`Offre ${offre} : ${reste} crédits restants ; ${lettres.length} extraits de ${seconds} s, environ ${credits} crédits.`);
  if (credits > reste) throw new Error("crédits insuffisants : rien n'a été généré");
  mkdirSync(ESSAIS, { recursive: true });
  for (const lettre of lettres) {
    const fichier = join(ESSAIS, `${style}-${lettre}.mp3`);
    console.log(`${style} ${lettre} — ${VARIANTES[style][lettre].nom} : génération (${seconds} s)…`);
    writeFileSync(fichier, await generer(style, cle, modele, lettre, seconds));
    try {
      const m = analyseTempo(decoder(fichier), ANALYSIS_RATE, { hint: PROMPTS[style].bpm });
      console.log(`  ${fichier.replace(root + "/", "")} : ${m.bpm.toFixed(1)} bpm ; ${signature(m)}`);
      if (m.rhythm.evenLow >= SEUILS.tempsEgaux) console.log("  ⚠ attaque grave d'égale force sur les quatre temps");
    } catch (e) { console.log(`  ${fichier.replace(root + "/", "")} : mesure impossible (${e.message})`); }
  }
  console.log("Extraits à écouter ; ils ne sont pas publiés. Prise complète : --variante " + style + "=<lettre>.");
}

function cleRequise() {
  const cle = process.env.ELEVENLABS_API_KEY;
  if (!cle) throw new Error("ELEVENLABS_API_KEY absente de l'environnement (voir docs/musique/enregistrements.md)");
  return cle;
}

async function main() {
  const o = lireArguments(process.argv.slice(2));
  if (o.plan) { console.log(plan(o.styles)); return; }
  if (o.abonnement) {
    const { offre, reste } = await creditsRestants(cleRequise());
    const { credits } = coutEstime(o.styles);
    console.log(`Offre ${offre} : ${reste} crédits restants ; une prise de ${o.styles.join(", ")} coûte environ ${credits} crédits.`);
    return;
  }
  if (o.essais !== undefined) { await essais(o.essais, o.duree ?? DUREE_ESSAI, o.modele); return; }
  let registre = lireRegistre();
  const entree = (style) => registre.find((p) => p.style === style);
  const fichier = (style) => join(DOSSIER, `${style}.mp3`);

  if (!o.analyse) {
    const aFaire = o.styles.filter((s) => o.refaire || !existsSync(fichier(s)));
    for (const s of o.styles) if (!aFaire.includes(s)) console.log(`${s} : piste déjà présente, conservée (--refaire pour la régénérer)`);
    if (aFaire.length) {
      const cle = cleRequise();
      const { credits } = coutEstime(aFaire);
      const { offre, reste } = await creditsRestants(cle);
      console.log(`Offre ${offre} : ${reste} crédits restants ; coût estimé ${credits} crédits pour ${aFaire.join(", ")}.`);
      if (credits > reste) throw new Error("crédits insuffisants : rien n'a été généré");
      mkdirSync(DOSSIER, { recursive: true });
      for (const s of aFaire) {
        const variante = o.variante[s] ?? null;
        console.log(`${s} : génération (${PROMPTS[s].seconds} s, ${o.modele}${variante ? `, variante ${variante}` : ""})…`);
        writeFileSync(fichier(s), await generer(s, cle, o.modele, variante));
        registre = registre.filter((p) => p.style !== s);
        registre.push({ style: s, prompt: variante ? texteDe(s, variante) : PROMPTS[s].prompt, model: o.modele,
          generatedAt: new Date().toISOString().slice(0, 10), ...(variante ? { variant: variante } : {}) });
      }
    }
  }

  let alerte = false;
  const mesurees = [];
  for (const s of Object.keys(PROMPTS)) {
    if (!existsSync(fichier(s))) continue;
    const ancienne = entree(s) ?? {};
    // Hors de la liste demandée : l'entrée est conservée telle quelle.
    if (!o.styles.includes(s) && !(s in o.decaler) && !(s in o.temps) && ancienne.bpm) { mesurees.push(ancienne); continue; }
    const decalage = s in o.decaler ? o.decaler[s] : ancienne.shiftBeats ?? 0;
    const temps = s in o.temps ? o.temps[s] : ancienne.loopBeats ?? 0;
    const { piste, alertes, mesure } = mesurer(s, fichier(s), ancienne, decalage, temps);
    mesurees.push(piste);
    console.log(`${s} : ${piste.bpm} bpm, temps 1 à ${piste.firstBeat} s, boucle de ${piste.beats} temps, gain ${piste.gainDb} dB`);
    const indices = mesure.structure.votes.map((v) => `${v.kind} au temps ${v.beat + 1}`).join(", ");
    console.log(`  temps 1 déduit de : ${indices || "l'accent grave de la mesure"}`);
    console.log(`  ${signature(mesure)}`);
    for (const a of alertes) { alerte = true; console.log(`  ⚠ ${a}`); }
  }
  const ecrites = ecrireRegistre(mesurees);
  ecrirePage(ecrites);
  console.log(`Registre : ${ecrites.length} piste(s) — ${REGISTRE.replace(root + "/", "")}`);
  if (alerte) { console.log("Des pistes sont à refaire ou à valider à l'oreille."); process.exitCode = 2; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(`Erreur : ${e.message}`); process.exit(1); });
}
