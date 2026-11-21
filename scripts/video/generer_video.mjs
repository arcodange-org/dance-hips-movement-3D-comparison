#!/usr/bin/env node
// Génère la vidéo « le pas de base sur place d'un style à l'autre » (#155, docs/spec-video-pas-de-base.md).
//
//   node scripts/video/generer_video.mjs                    tout : voix, plans, habillage, montage
//   node scripts/video/generer_video.mjs --besoins           durée de musique nécessaire par style, puis arrêt
//   node scripts/video/generer_video.mjs --chapitres semba   ne refait que ces chapitres (pas de film complet)
//   node scripts/video/generer_video.mjs --refaire plans     ignore le cache d'une étape (voix, plans, habillage, montage, tout)
//   node scripts/video/generer_video.mjs --narration <fichier.json> --sortie <fichier.mp4>
//
// Rien n'est acheté ici : les musiques viennent du dépôt (scripts/video/musique.mjs les génère sur demande).
// Un style sans musique est filmé à son tempo prévu, en silence, et le rapport le signale.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { calendrier } from "./calendrier.mjs";
import { filmer, servirApplication } from "./capturer.mjs";
import { rendre } from "./habillage.mjs";
import { assemblerComparaison, master, monterChapitre, preparerMusique } from "./monter.mjs";
import { pistes, tempoPrevu } from "./musique.mjs";
import { TRAVAIL, arguments_, dossier, duree, ecrireJson, ffmpeg, navigateur, niveau } from "./outils.mjs";
import { readFileSync, readdirSync, rmSync } from "node:fs";
import { FICHE_DUREES, FICHE_FAITS, clePhrase } from "./controle.mjs";
import { FILM, PRONONCIATION, VOIX, chapitresDe, generiqueDe, habillageDe, lireNarration, musiqueDe, plansDe } from "./scenario.mjs";
import { dire, prononcer } from "./voix.mjs";

/**
 * Images de contrôle du film monté : la carte de chaque chapitre, une image au milieu de chaque phrase, et le
 * générique toutes les douze secondes. Elles servent à relire le film sans le regarder en entier.
 */
export function planches(film, cal) {
  const dir = dossier("planches");
  for (const f of readdirSync(dir)) if (f.endsWith(".jpg")) rmSync(join(dir, f));
  const prises = [];
  cal.chapitres.forEach((c, i) => {
    const n = String(i + 1).padStart(2, "0");
    prises.push([c.debut + Math.min(1.6, c.duree / 4), `${n}-${c.id}-0-carte`]);
    c.phrases.forEach((p, k) => prises.push([c.debut + (p.debut + p.fin) / 2, `${n}-${c.id}-${k + 1}`]));
    if (c.credits) for (let t = c.credits.debut + 4, k = 1; t < c.duree - 1; t += 12, k++) prises.push([c.debut + t, `${n}-${c.id}-generique-${k}`]);
  });
  for (const [t, nom] of prises) ffmpeg(["-ss", t.toFixed(2), "-i", film, "-frames:v", "1", "-vf", "scale=1280:-1", "-q:v", "4", join(dir, `${nom}.jpg`)]);
  return prises.map(([t, nom]) => ({ t: Math.round(t * 100) / 100, fichier: join(dir, `${nom}.jpg`) }));
}

export async function generer(args = {}) {
  const journal = (...m) => console.log(...m);
  const refaire = etape => args.refaire === "tout" || args.refaire === etape;
  const narration = lireNarration(args.narration);
  const chapitres = chapitresDe(narration);
  const { ips, largeur, hauteur } = FILM;

  // 1. Les voix : chaque phrase, sa durée.
  journal("Voix (Phonon)…");
  const sons = {};
  for (const c of chapitres) {
    sons[c.id] = [];
    for (const p of c.phrases) {
      const role = VOIX[p.voix];
      if (!role) throw new Error(`voix inconnue « ${p.voix} » (${c.id})`);
      sons[c.id].push(await dire(prononcer(p.dit ?? p.texte, PRONONCIATION), role.voix, { refaire: refaire("voix") }));
    }
  }

  // 2. Les musiques disponibles et le tempo de chaque chapitre.
  const P = pistes();
  const bpmDe = c => P[musiqueDe(c)]?.bpm ?? tempoPrevu(musiqueDe(c));
  const sansMusique = [...new Set(chapitres.map(musiqueDe))].filter(s => !P[s]);

  const chrome = await navigateur();
  let site = null;
  try {
    // 3. Le générique donne sa hauteur, donc sa durée ; puis le calendrier.
    const generique = await rendre(chrome, { type: "generique", donnees: generiqueDe(narration, readFileSync(FICHE_FAITS, "utf8")), largeur, hauteur }, { refaire: refaire("habillage") });
    const cal = calendrier(chapitres, (id, i) => sons[id][i].duree, { ips, hauteurCredits: generique.hauteur });
    // Les durées mesurées sont versionnées : le test du scénario vérifie la durée du film sans redire les phrases.
    if (!args.narration) ecrireJson(FICHE_DUREES, {
      phrases: Object.fromEntries(chapitres.flatMap(c => c.phrases.map((p, i) => [clePhrase(p), Math.round(sons[c.id][i].duree * 100) / 100]))),
      generique: { hauteur: generique.hauteur },
    });
    const calDe = Object.fromEntries(cal.chapitres.map(c => [c.id, c]));
    journal(`Durée du film : ${(cal.duree / 60).toFixed(2)} min (${cal.duree.toFixed(1)} s)`);
    for (const c of cal.chapitres) journal(`  ${c.id.padEnd(12)} ${c.debut.toFixed(1).padStart(6)} s  + ${c.duree.toFixed(1).padStart(5)} s  ${chapitres.find(x => x.id === c.id).phrases.length} phrases`);
    if (args.besoins) {
      journal("Musique nécessaire (durée du chapitre + 2 s) :");
      for (const c of chapitres.filter(c => c.type === "style")) journal(`  ${c.id}=${Math.ceil(calDe[c.id].duree + 2)}${P[c.id] ? `   (piste présente : ${P[c.id].duree.toFixed(1)} s)` : ""}`);
      return { cal };
    }

    const voulus = args.chapitres ? String(args.chapitres).split(",") : chapitres.map(c => c.id);
    site = await servirApplication({ reconstruire: !args["sans-construire"] });
    const montes = [];
    for (const c of chapitres.filter(c => voulus.includes(c.id))) {
      const k = calDe[c.id], bpm = bpmDe(c);
      // 4. Les plans, filmés au tempo de la musique.
      const { plans, composition } = plansDe(c, k, bpm, narration.ordre);
      const fichiers = {};
      for (const plan of plans) {
        const r = await filmer(plan, { adresse: site.adresse, version: site.version, navigateurOuvert: chrome, refaire: refaire("plans"), journal });
        fichiers[plan.id] = r.fichier;
        if (r.neuf) journal(`  plan ${plan.id} : ${plan.images} images`);
      }
      let clip = fichiers[c.id];
      if (composition.type === "comparaison")
        clip = assemblerComparaison({ ordre: composition.ordre, fichiers, largeur, hauteur, ips, sortie: join(dossier("plans"), `${c.id}.mp4`) });
      // 5. L'habillage.
      const elements = [];
      for (const e of habillageDe(c, k, narration, narration.ordre, composition)) {
        const image = await rendre(chrome, { type: e.type, donnees: e.donnees, largeur, hauteur }, { refaire: refaire("habillage") });
        elements.push({ type: e.type, fichier: image.fichier, debut: e.debut, fin: e.fin, fondu: e.fondu });
      }
      if (c.type === "final") elements.push({ type: "generique", fichier: generique.fichier, hauteur: generique.hauteur, debut: k.credits.debut });
      // 6. Le montage du chapitre.
      const piste = P[musiqueDe(c)];
      const r = monterChapitre({
        id: c.id, clip, cal: k, elements, largeur, hauteur, ips, refaire: refaire("montage") || refaire("plans"),
        voix: sons[c.id].map((s, i) => ({ fichier: s.fichier, debut: k.phrases[i].debut })),
        musique: piste ? preparerMusique(piste, k.duree, musiqueDe(c)) : null,
      });
      journal(`Chapitre ${c.id} : ${k.duree.toFixed(1)} s à ${bpm} bpm${r.neuf ? "" : " (inchangé)"}`);
      montes.push(r.fichier);
    }
    if (args.chapitres) return { cal, chapitres: montes };

    // 7. Le film, puis son contrôle.
    const sortie = args.sortie ?? join(TRAVAIL, "pas-de-base.mp4");
    const m = master(montes, sortie);
    const images = planches(sortie, cal);
    const rapport = {
      fichier: sortie, duree: duree(sortie), dureePrevue: cal.duree, lufs: niveau(sortie), lufsAvantNiveau: m.avant,
      sansMusique, images: images.length,
      chapitres: cal.chapitres.map(c => ({ id: c.id, debut: c.debut, duree: c.duree, bpm: bpmDe(chapitres.find(x => x.id === c.id)),
        phrases: c.phrases.map(p => ({ debut: p.debut, fin: p.fin })), ...(c.credits ? { credits: c.credits } : {}) })),
    };
    ecrireJson(join(TRAVAIL, "rapport.json"), rapport);
    journal(`Film : ${sortie}`);
    journal(`  ${rapport.duree.toFixed(1)} s, ${rapport.lufs.toFixed(1)} LUFS${sansMusique.length ? `, SANS MUSIQUE pour : ${sansMusique.join(", ")}` : ""}`);
    return { cal, rapport };
  } finally {
    await chrome.close();
    await site?.fermer();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await generer(arguments_());
