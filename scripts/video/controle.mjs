#!/usr/bin/env node
// Contrôle du scénario (#155) : structure, faits cités, attributions, durée estimée. Pur (hors ligne de
// commande) : sert au test (scripts/test_video.mjs) et aux rédacteurs.
//   node scripts/video/controle.mjs [narration.json]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { calendrier } from "./calendrier.mjs";
import { ATTRIBUTIONS, FILM, STYLES, VOIX, chapitresDe } from "./scenario.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
export const FICHE_FAITS = join(ICI, "..", "..", "docs", "video", "faits-pas-de-base.md");
export const FICHE_DUREES = join(ICI, "durees.json");

/** Débit mesuré de chaque voix Phonon, en caractères par seconde (phrases d'essai du 21 novembre 2026). */
export const DEBIT = { guide: 14.7, histoire: 19.2, geste: 19.2 };
export const LIMITES = { phrase: 200, repere: 44, point: 90, liens: 0.15, hauteurGenerique: 3600 };

/** Identifiants de faits présents dans la fiche. */
export const faitsDe = texte => new Set([...texte.matchAll(/^- \*\*(F\d{3})\*\*/gm)].map(m => m[1]));

/** Clé d'une phrase dite : son texte et sa voix (les durées mesurées sont rangées sous cette clé). */
export const clePhrase = p => `${p.voix}|${p.dit ?? p.texte}`;

/**
 * @param narration objet de `narration.json`
 * @param faits     texte de la fiche de faits
 * @param durees    {phrases: {clé: secondes}, generique: {hauteur}} mesurées, si elles existent
 * @returns {{erreurs: string[], avertissements: string[], estimation: object}}
 */
export function controlerNarration(narration, faits, durees = {}) {
  const erreurs = [], avertissements = [];
  const ids = faitsDe(faits), styles = Object.keys(STYLES);
  for (const k of ["surTitre", "titre", "sousTitre"]) if (!narration[k]?.trim()) erreurs.push(`« ${k} » manquant`);
  if (!Array.isArray(narration.ordre) || [...narration.ordre].sort().join() !== [...styles].sort().join())
    erreurs.push(`« ordre » doit ranger les six styles (${styles.join(", ")})`);
  let chapitres = [];
  try { chapitres = chapitresDe(narration); } catch (e) { erreurs.push(e.message); return { erreurs, avertissements, estimation: null }; }

  const citer = (liste, ou, obligatoire = true) => {
    if (!Array.isArray(liste)) { erreurs.push(`${ou} : « faits » manquant`); return; }
    if (obligatoire && !liste.length) erreurs.push(`${ou} : aucun fait cité`);
    for (const id of liste) if (!ids.has(id)) erreurs.push(`${ou} : fait inconnu ${id}`);
  };
  let phrases = 0, liens = 0;
  for (const c of chapitres) {
    if (!Array.isArray(c.phrases) || !c.phrases.length) { erreurs.push(`${c.id} : aucune phrase`); continue; }
    c.phrases.forEach((p, i) => {
      const ou = `${c.id} phrase ${i + 1}`;
      phrases++;
      if (!VOIX[p.voix]) erreurs.push(`${ou} : voix inconnue « ${p.voix} »`);
      if (!p.texte?.trim()) erreurs.push(`${ou} : texte vide`);
      else if (p.texte.length > LIMITES.phrase) erreurs.push(`${ou} : ${p.texte.length} caractères (au plus ${LIMITES.phrase})`);
      if (p.lien) { liens++; citer(p.faits ?? [], ou, false); } else citer(p.faits, ou);
      if (p.repere && p.repere.length > LIMITES.repere) erreurs.push(`${ou} : repère de ${p.repere.length} caractères (au plus ${LIMITES.repere})`);
      if (p.accent && (c.type !== "comparaison" || p.accent.some(s => !STYLES[s]))) erreurs.push(`${ou} : accent invalide`);
      if (p.voile !== undefined && (p.voile !== false || !p.accent?.length)) erreurs.push(`${ou} : « voile » ne vaut que false, avec « accent »`);
      const planPermis = (c.type === "comparaison" && p.plan === "grille") || (c.type === "final" && p.plan === "hanches");
      if (p.plan && (!planPermis || i === 0)) erreurs.push(`${ou} : « plan » ne vaut que "grille" dans la comparaison ou "hanches" dans le final, après la première phrase`);
      if (p.point && p.point.length > LIMITES.point) erreurs.push(`${ou} : point de ${p.point.length} caractères (au plus ${LIMITES.point})`);
      if (/\d/.test(p.dit ?? p.texte ?? "") && !p.dit) avertissements.push(`${ou} : chiffres dans le texte dit (écrire « dit » en toutes lettres)`);
    });
    if (c.type === "style") {
      const k = c.cartouche;
      if (!k?.lieu || !k?.epoque || !k?.tempo) erreurs.push(`${c.id} : cartouche incomplet (lieu, epoque, tempo)`);
      citer(k?.faits, `${c.id} cartouche`);
      if (c.phrases.length < 3) erreurs.push(`${c.id} : au moins trois phrases`);
      for (const role of ["histoire", "geste"]) if (!c.phrases.some(p => p.voix === role)) erreurs.push(`${c.id} : aucune phrase de la voix « ${role} »`);
    }
    if (c.type === "comparaison") {
      if (c.phrases.length < 4) erreurs.push("comparaison : au moins quatre phrases");
      if (c.phrases.filter(p => p.accent?.length).length < 2) erreurs.push("comparaison : au moins deux phrases avec « accent »");
    }
    if (c.type === "limites" && c.phrases.filter(p => p.point).length < 3) erreurs.push("limites : au moins trois points");
    if ((c.type === "comparaison" || c.type === "final") && c.titre !== undefined && !(typeof c.titre === "string" && c.titre.length <= 40))
      erreurs.push(`${c.id} : « titre » de 40 caractères au plus`);
  }
  if (phrases && liens / phrases > LIMITES.liens) erreurs.push(`${liens} phrases de liaison sur ${phrases} : trop (au plus ${LIMITES.liens * 100} %)`);

  const g = narration.generique;
  if (!g?.titre || !g?.accroche || !g?.fin || !Array.isArray(g?.blocs)) erreurs.push("générique incomplet (titre, accroche, blocs, fin)");
  else {
    const texte = JSON.stringify(g);
    for (const a of ATTRIBUTIONS) if (!a.test(texte)) erreurs.push(`générique : attribution manquante ${a}`);
  }

  // Durée : mesurée quand la phrase a déjà été dite, sinon estimée par le débit de sa voix.
  let mesurees = 0;
  const dureeDe = (id, i) => {
    const p = chapitres.find(c => c.id === id).phrases[i];
    const connue = durees.phrases?.[clePhrase(p)];
    if (connue) { mesurees++; return connue; }
    return Math.max(0.6, (p.dit ?? p.texte ?? "").length / (DEBIT[p.voix] ?? 16));
  };
  let estimation = null;
  if (!erreurs.length) {
    const cal = calendrier(chapitres, dureeDe, { ips: FILM.ips, hauteurCredits: durees.generique?.hauteur ?? LIMITES.hauteurGenerique });
    estimation = { duree: cal.duree, mesurees, phrases, chapitres: Object.fromEntries(cal.chapitres.map(c => [c.id, c.duree])) };
    if (cal.duree < FILM.dureeMin || cal.duree > FILM.dureeMax)
      erreurs.push(`durée ${cal.duree.toFixed(0)} s hors de ${FILM.dureeMin}–${FILM.dureeMax} s`);
    for (const c of cal.chapitres.filter(c => c.type === "style"))
      if (c.duree < 20 || c.duree > 42) avertissements.push(`${c.id} : ${c.duree.toFixed(0)} s (visé : 24 à 36 s)`);
  }
  return { erreurs, avertissements, estimation };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fichier = process.argv[2] ?? join(ICI, "narration.json");
  let durees = {};
  try { durees = JSON.parse(readFileSync(FICHE_DUREES, "utf8")); } catch { /* pas encore mesurées */ }
  const r = controlerNarration(JSON.parse(readFileSync(fichier, "utf8")), readFileSync(FICHE_FAITS, "utf8"), durees);
  for (const e of r.erreurs) console.log(`ERREUR  ${e}`);
  for (const a of r.avertissements) console.log(`à voir  ${a}`);
  if (r.estimation) {
    console.log(`Durée : ${(r.estimation.duree / 60).toFixed(2)} min (${r.estimation.mesurees}/${r.estimation.phrases} phrases mesurées, les autres estimées)`);
    for (const [id, d] of Object.entries(r.estimation.chapitres)) console.log(`  ${id.padEnd(12)} ${d.toFixed(1)} s`);
  }
  console.log(r.erreurs.length ? `${r.erreurs.length} erreur(s)` : "Scénario conforme");
  process.exit(r.erreurs.length ? 1 : 0);
}
