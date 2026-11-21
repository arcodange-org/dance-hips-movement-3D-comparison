// Le film en données (#155, docs/spec-video-pas-de-base.md) : ordre des chapitres, voix, plans et
// cadrages, habillage. Le texte dit vit dans `narration.json` ; ici, ce qu'on voit.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { adouci, coupes, entre } from "./calendrier.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));

export const FILM = { ips: 25, largeur: 1920, hauteur: 1080, dureeMin: 240, dureeMax: 390 };

/** Les six styles, avec les couleurs de l'application (src/styles.ts ; scripts/test_video.mjs le vérifie). */
export const STYLES = {
  kizomba: { nom: "Kizomba", couleur: "#2dd4bf" },
  semba: { nom: "Semba", couleur: "#fb923c" },
  kompa: { nom: "Kompa", couleur: "#f87171" },
  tarraxinha: { nom: "Tarraxinha", couleur: "#c084fc" },
  suave: { nom: "Suave", couleur: "#4ade80" },
  zouk: { nom: "Zouk brésilien", couleur: "#38bdf8" },
};

/** Les voix : un rôle par voix Phonon. `role` s'affiche au-dessus du sous-titre. */
export const VOIX = {
  guide: { voix: "Hélène", role: "", couleur: "#f8fafc" },
  histoire: { voix: "Lucien", role: "Histoire", couleur: "#fbbf24" },
  geste: { voix: "Noémie", role: "Le geste", couleur: "#5eead4" },
};

/** Mots que la voix lirait mal : écriture phonétique pour la synthèse (les sous-titres gardent l'orthographe). */
export const PRONONCIATION = {
  semba: "sém-ba", tarraxinha: "tarachigna", ginga: "jinga", bpm: "battements par minute",
};

/** Graine de la danse automatique du final : même graine, même danse. */
export const GRAINE_FINAL = 7;

export const lireNarration = (fichier = join(ICI, "narration.json")) => JSON.parse(readFileSync(fichier, "utf8"));

/** Les chapitres dans l'ordre du film : ouverture, les six styles dans l'ordre de la narration, comparaison, limites, final. */
export function chapitresDe(narration) {
  const ordre = ["ouverture", ...narration.ordre, "comparaison", "limites", "final"];
  return ordre.map(id => {
    const c = narration.chapitres[id];
    if (!c) throw new Error(`chapitre absent de la narration : ${id}`);
    return { id, type: STYLES[id] ? "style" : id, ...(STYLES[id] ? { style: id } : {}), ...c };
  });
}

/** Style dont la musique accompagne un chapitre. */
export const musiqueDe = chapitre => chapitre.style ?? "kizomba";

// ------------------------------------------------------------------------------------------ cadrages
const PIED = { el: 5, dist: 3.3, fov: 38, target: [0, 0.72, 0] };
const BASSIN = { el: 3, dist: 2.3, fov: 22, target: [0, 0.84, 0] };
const melange = (a, b, u) => ({
  az: entre(a.az, b.az, u), el: entre(a.el, b.el, u), dist: entre(a.dist, b.dist, u), fov: entre(a.fov, b.fov, u),
  target: a.target.map((x, k) => entre(x, b.target[k], u)), shift: entre(a.shift ?? 0, b.shift ?? 0, u),
});

/** Adresse du danseur seul, sur place, avec muscles et buste ; `options` remplace des paramètres. */
const solo = (style, bpm, options = {}) => "?" + new URLSearchParams({
  mode: "solo", style, bare: 1, muscles: 1, torso: 1, solid: 1, travel: 0, amp: 1, playing: 1, repere: 1, boussole: 0,
  ligne: 0, appui: 0, bpm, ...options }).toString();

/** Géométrie du plan de comparaison : six cases, une rangée puis une grille, au-dessus de la bande des textes. */
export const COMPARAISON = {
  haut: 30, hauteur: 860,
  rangee: { colonnes: 6, lignes: 1, largeur: 320, hauteur: 860 },
  grille: { colonnes: 3, lignes: 2, largeur: 640, hauteur: 430 },
};
export const caseDe = (forme, k) => ({
  x: (k % forme.colonnes) * forme.largeur, y: COMPARAISON.haut + Math.floor(k / forme.colonnes) * forme.hauteur,
  largeur: forme.largeur, hauteur: forme.hauteur,
});

/**
 * Les plans à filmer pour un chapitre.
 * @param chapitre  chapitre du scénario (id, type, style, phrases)
 * @param cal       son calendrier (duree, images, phrases, credits)
 * @param bpm       tempo de sa musique
 * @param ordre     ordre des six styles (comparaison)
 * @returns {{plans: object[], composition: object}} `composition` dit comment assembler les plans en un clip du chapitre
 */
export function plansDe(chapitre, cal, bpm, ordre) {
  const { largeur: L, hauteur: H, ips } = FILM;
  const N = cal.images, D = cal.duree;
  const simple = (url, cadrage) => ({
    plans: [{ id: chapitre.id, url, largeur: L, hauteur: H, ips, images: N, cadrage }],
    composition: { type: "simple", plan: chapitre.id },
  });

  if (chapitre.type === "ouverture") {
    // Du bassin au corps entier : on montre d'abord ce qu'on va regarder.
    const a = { ...BASSIN, az: 24, shift: -0.27 }, b = { ...PIED, az: -6, shift: -0.2 };
    return simple(solo("kizomba", bpm), (i, t) => melange(a, b, adouci((t - 1.2) / Math.max(4, D * 0.55))));
  }

  if (chapitre.type === "style") {
    const [t1, t2] = coupes(cal, [0.36, 0.7]);
    return simple(solo(chapitre.style, bpm), (i, t) => {
      if (t < t1) return { ...PIED, az: entre(-16, 12, t / t1), shift: -0.12 };
      if (t < t2) return { ...BASSIN, az: entre(30, -6, (t - t1) / (t2 - t1)), shift: -0.12 };
      return { ...PIED, az: entre(52, 30, (t - t2) / (D - t2)), shift: -0.12 };
    });
  }

  if (chapitre.type === "comparaison") {
    // Une rangée de six corps entiers, puis une grille de six bassins ; les six dansent au même tempo.
    const [coupe] = coupes(cal, [0.56]);
    const n1 = Math.round(coupe * ips), n2 = N - n1;
    const { rangee, grille } = COMPARAISON;
    const plans = [];
    for (const style of ordre) {
      plans.push({ id: `comparaison-rangee-${style}`, url: solo(style, bpm, { repere: 0 }), largeur: rangee.largeur, hauteur: rangee.hauteur, ips, images: n1,
        cadrage: (i, t) => ({ az: entre(-8, 10, t / coupe), el: 4, dist: 3.4, fov: 32, target: [0, 0.9, 0] }) });
      plans.push({ id: `comparaison-grille-${style}`, url: solo(style, bpm, { repere: 0 }), largeur: grille.largeur, hauteur: grille.hauteur, ips, images: n2, avance: n1,
        cadrage: (i, t) => ({ ...BASSIN, fov: 20, az: entre(-4, 22, t / (D - coupe)) }) });
    }
    return { plans, composition: { type: "comparaison", ordre, coupe, n1, n2 } };
  }

  if (chapitre.type === "limites") {
    // Le squelette seul : ce qu'on regarde est un modèle.
    return simple(solo("kizomba", bpm, { muscles: 0, torso: 0, solid: 0 }), (i, t) => ({ ...PIED, az: entre(18, 62, t / D), shift: -0.2 }));
  }

  if (chapitre.type === "final") {
    // Le couple en danse automatique ; au générique, il glisse vers la gauche de l'image.
    const t0 = cal.credits.debut;
    return simple(`?vitrine=1&style=kizomba&graine=${GRAINE_FINAL}&bare=1&bpm=${bpm}`,
      (i, t) => ({ az: 28 + 4.5 * t, el: 11, dist: 3.8, fov: 40, shift: 0.2 * adouci((t - (t0 - 1.5)) / 3) }));
  }
  throw new Error(`type de chapitre inconnu : ${chapitre.type}`);
}

// ------------------------------------------------------------------------------------------ habillage
const FONDU = 0.3;

/**
 * Les éléments d'habillage d'un chapitre, dans l'ordre où ils se superposent.
 * Chaque élément : {type, donnees, debut, fin, fondu} (instants en secondes dans le chapitre).
 */
export function habillageDe(chapitre, cal, narration, ordre, composition) {
  const D = cal.duree, out = [];
  const style = chapitre.style ? STYLES[chapitre.style] : null;
  const numero = chapitre.style ? `${narration.ordre.indexOf(chapitre.style) + 1} / ${narration.ordre.length}` : "";
  const premiere = cal.phrases[0], derniere = cal.phrases[cal.phrases.length - 1];
  const element = (type, donnees, debut, fin, fondu = FONDU) => out.push({ type, donnees, debut: Math.max(0, debut), fin: Math.min(D, fin), fondu });

  if (chapitre.type === "comparaison") {
    const { rangee, grille } = COMPARAISON;
    for (const [forme, a, b] of [[rangee, 0, composition.coupe], [grille, composition.coupe, D]]) {
      // Étiquettes : sous la rangée, ou en haut de chaque case de la grille.
      for (let ligne = 0; ligne < forme.lignes; ligne++) {
        const cases = ordre.slice(ligne * forme.colonnes, (ligne + 1) * forme.colonnes).map((s, k) => ({
          x: k * forme.largeur, largeur: forme.largeur, nom: STYLES[s].nom, couleur: STYLES[s].couleur,
          detail: narration.chapitres[s].cartouche?.tempo ?? "" }));
        const y = forme === rangee ? COMPARAISON.haut + 10 : COMPARAISON.haut + ligne * forme.hauteur + 14;
        element("etiquettes", { cases, y, gauche: forme === grille }, a + 0.2, b - (b === D ? 0 : 0.05));
      }
      // Accent : les styles dont parle la phrase restent clairs, les autres passent sous un voile.
      chapitre.phrases.forEach((p, i) => {
        const ph = cal.phrases[i];
        if (!p.accent?.length || ph.debut < a - 0.01 || ph.debut >= b) return;
        const cases = ordre.map((s, k) => ({ ...caseDe(forme, k), style: s }));
        element("accent", {
          voiles: cases.filter(c => !p.accent.includes(c.style)),
          liseres: cases.filter(c => p.accent.includes(c.style)).map(c => ({ ...c, couleur: STYLES[c.style].couleur })),
        }, ph.debut, Math.min(b, ph.fin + 0.2), 0.2);
      });
    }
  }

  if (chapitre.type === "final") element("degrade", {}, cal.credits.debut - 1.2, D, 1.2);
  if (premiere) element("bande", {}, premiere.debut - 0.4, derniere.fin + 0.5, 0.4);

  if (chapitre.type === "ouverture")
    element("titre", { sur: narration.surTitre, titre: narration.titre, sous: narration.sousTitre, pied: narration.piedTitre }, 0.5, Math.max(4.5, premiere.fin - 0.2), 0.5);

  if (chapitre.type === "style") {
    const c = chapitre.cartouche ?? {};
    const finCarte = premiere.debut + 0.5;
    element("chapitre", { numero, nom: style.nom, ou: [c.lieu, c.epoque].filter(Boolean).join(", "), couleur: style.couleur }, 0.25, finCarte, 0.35);
    element("cartouche", { nom: style.nom, infos: [c.lieu, c.epoque, c.tempo].filter(Boolean), couleur: style.couleur }, finCarte + 0.1, D - 0.3);
  }

  if (chapitre.type === "limites") {
    // Les points s'ajoutent un à un, chacun avec la phrase qui le dit.
    const avecPoint = chapitre.phrases.map((p, i) => ({ point: p.point, t: cal.phrases[i].debut })).filter(x => x.point);
    avecPoint.forEach((x, k) => element("points", { titre: chapitre.titre ?? "Les limites", points: avecPoint.slice(0, k + 1).map(y => y.point) },
      x.t - 0.1, k + 1 < avecPoint.length ? avecPoint[k + 1].t - 0.1 : D - 0.3, k === 0 ? 0.3 : 0.12));
  }

  // Repères (mot-clé à l'écran pendant la phrase) et sous-titres.
  chapitre.phrases.forEach((p, i) => {
    const ph = cal.phrases[i], v = VOIX[p.voix];
    if (p.repere && chapitre.type !== "comparaison" && chapitre.type !== "limites")
      element("repere", { mot: v.role, texte: p.repere, couleur: style?.couleur ?? "#5eead4" }, ph.debut + 0.1, ph.fin + 0.3);
    element("soustitre", { role: v.role, texte: p.texte, couleur: v.couleur }, ph.debut - 0.05, ph.fin + 0.25, 0.15);
  });
  return out;
}

/**
 * Les sources externes de la fiche de faits (sections 7.2 à 7.6), par thème : « Auteur. Titre. » sans
 * l'adresse ni les renvois au dépôt. Le générique les cite toutes ; les liens restent dans la fiche.
 */
export function sourcesDe(faits) {
  const blocs = [];
  let courant = null, entree = null;
  const fermer = () => {
    if (!entree || !courant) return;
    const texte = entree.replace(/\s+/g, " ").replace(/\s*https?:\/\/.*$/, "").replace(/\s*\(`.*$/, "")
      .replace(/[.,;]?\s*[^.]*:\s*$/, "").replace(/[\s.]+$/, "");
    if (texte) courant.flux.push(texte);
    entree = null;
  };
  for (const ligne of faits.split("\n")) {
    const titre = /^### 7\.(\d) (.*)$/.exec(ligne);
    if (titre || /^## /.test(ligne)) {
      fermer();
      const n = titre ? Number(titre[1]) : 0;
      courant = n >= 2 && n <= 6 ? { titre: titre[2].replace(/^Sources externes : /, "Sources : "), flux: [] } : null;
      if (courant) blocs.push(courant);
    } else if (courant && ligne.startsWith("- ")) { fermer(); entree = ligne.slice(2); }
    else if (courant && entree !== null && ligne.startsWith("  ")) entree += " " + ligne.trim();
    else if (courant && !ligne.trim()) fermer();
  }
  fermer();
  return blocs.filter(b => b.flux.length);
}

/** Le générique complet : les blocs écrits dans la narration, puis toutes les sources de la fiche. */
export function generiqueDe(narration, faits) {
  const g = narration.generique;
  return { ...g, blocs: [...g.blocs, ...sourcesDe(faits)] };
}

/** Les attributions que le générique doit porter (docs/spec-video-pas-de-base.md). */
export const ATTRIBUTIONS = [
  /BodyParts3D/, /CC BY-SA 2\.1 Japan/, /DBCLS|Database Center for Life Science/,
  /Voice: Phonon by Gradium — gradium\.ai/, /CC BY-NC 4\.0/, /Eleven Music/, /ElevenLabs/,
];
