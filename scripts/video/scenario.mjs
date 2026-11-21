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
  rangee: { colonnes: 6, lignes: 1, largeur: 320, hauteur: 860, ecart: 0 },
  grille: { colonnes: 3, lignes: 2, largeur: 640, hauteur: 420, ecart: 20 },
};
export const caseDe = (forme, k) => ({
  x: (k % forme.colonnes) * forme.largeur, y: COMPARAISON.haut + Math.floor(k / forme.colonnes) * (forme.hauteur + forme.ecart),
  largeur: forme.largeur, hauteur: forme.hauteur,
});

/** Plan montré pendant chaque phrase d'un chapitre de style : le bassin en gros plan sur la première phrase
 * de la voix « geste », le profil sur les suivantes (on y lit le buste), le corps entier de face sinon. */
export function plansDesPhrases(chapitre) {
  const premierGeste = chapitre.phrases.findIndex(p => p.voix === "geste");
  return chapitre.phrases.map((p, i) => (p.voix !== "geste" ? "pied" : i === premierGeste ? "bassin" : "profil"));
}

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
  const simple = (url, cadrage, extra = {}) => ({
    plans: [{ id: chapitre.id, url, largeur: L, hauteur: H, ips, images: N, cadrage }],
    composition: { type: "simple", plan: chapitre.id, ...extra },
  });

  if (chapitre.type === "ouverture") {
    // Du bassin au corps entier : on montre d'abord ce qu'on va regarder.
    const a = { ...BASSIN, az: 24, shift: -0.27 }, b = { ...PIED, az: -6, shift: -0.2 };
    return simple(solo("kizomba", bpm), (i, t) => melange(a, b, adouci((t - 1.2) / Math.max(4, D * 0.4))));
  }

  if (chapitre.type === "style") {
    // Un plan par phrase ; la coupe tombe un quart de seconde avant la phrase.
    const plans = plansDesPhrases(chapitre);
    const debuts = cal.phrases.map((ph, i) => (i === 0 ? 0 : ph.debut - 0.25));
    const segments = plans.map((plan, i) => ({ plan, debut: debuts[i], fin: debuts[i + 1] ?? D }));
    return simple(solo(chapitre.style, bpm), (i, t) => {
      const seg = segments.findLast(x => t >= x.debut) ?? segments[0], u = (t - seg.debut) / Math.max(0.1, seg.fin - seg.debut);
      // Le gros plan est fixe et de face, le même pour les six styles : ce qui tourne à l'image, c'est le bassin.
      if (seg.plan === "bassin") return { ...BASSIN, az: 0, shift: -0.24 };
      if (seg.plan === "profil") return { ...PIED, az: entre(80, 92, u), shift: -0.12 };
      return { ...PIED, az: entre(-14, 10, t / D), shift: -0.12 };
    }, { segments });
  }

  if (chapitre.type === "comparaison") {
    // Une rangée de six corps entiers, puis une grille de six bassins ; les six dansent au même tempo.
    // La grille commence sur la phrase marquée `"plan": "grille"` ; à défaut, un peu après la moitié.
    const marque = chapitre.phrases.findIndex(p => p.plan === "grille");
    const coupe = marque > 0 ? cal.phrases[marque].debut - 0.25 : coupes(cal, [0.56])[0];
    const n1 = Math.round(coupe * ips), n2 = N - n1;
    const { rangee, grille } = COMPARAISON;
    const plans = [];
    for (const style of ordre) {
      plans.push({ id: `comparaison-rangee-${style}`, url: solo(style, bpm, { repere: 0 }), largeur: rangee.largeur, hauteur: rangee.hauteur, ips, images: n1,
        cadrage: (i, t) => ({ az: entre(-8, 10, t / coupe), el: 4, dist: 3.4, fov: 32, target: [0, 0.9, 0] }) });
      // De près, de face, sans dérive : le bassin remplit la case.
      plans.push({ id: `comparaison-grille-${style}`, url: solo(style, bpm, { repere: 0 }), largeur: grille.largeur, hauteur: grille.hauteur, ips, images: n2, avance: n1,
        cadrage: () => ({ az: 0, el: 3, dist: 2.3, fov: 15, target: [0, 0.83, 0] }) });
    }
    return { plans, composition: { type: "comparaison", ordre, coupe, n1, n2 } };
  }

  if (chapitre.type === "limites") {
    // Le squelette seul : ce qu'on regarde est un modèle.
    return simple(solo("kizomba", bpm, { muscles: 0, torso: 0, solid: 0 }), (i, t) => ({ ...PIED, az: entre(18, 62, t / D), shift: -0.2 }));
  }

  if (chapitre.type === "final") {
    // Le couple en danse automatique, vu de côté : la caméra suit son orientation (`relative`), pour que l'un
    // ne cache pas l'autre. Au générique, il glisse vers la gauche de l'image.
    const t0 = cal.credits.debut;
    return simple(`?vitrine=1&style=kizomba&graine=${GRAINE_FINAL}&bare=1&bpm=${bpm}`,
      (i, t) => ({ az: 90 + 14 * Math.sin(2 * Math.PI * t / 38), relative: true, el: 10, dist: 3.7, fov: 40, shift: 0.23 * adouci((t - (t0 - 1.5)) / 3) }));
  }
  throw new Error(`type de chapitre inconnu : ${chapitre.type}`);
}

// ------------------------------------------------------------------------------------------ habillage
const FONDU = 0.3;
/** Longueur visée d'un carton de sous-titre : deux lignes au plus. */
export const SOUS_TITRE_MAX = 104;

/** Coupe un texte en cartons de sous-titre : aux fins de phrase d'abord, puis aux virgules si une phrase est longue. */
export function decouper(texte, max = SOUS_TITRE_MAX) {
  const phrases = texte.split(/(?<=[.!?…])\s+(?=[\p{Lu}«])/u);
  const morceaux = phrases.flatMap(ph => {
    if (ph.length <= max) return [ph];
    // Une phrase longue se coupe à la virgule, au deux-points ou au point-virgule le plus proche de son milieu.
    const coupes = [...ph.matchAll(/[,;:]\s+/g)].map(m => m.index + m[0].length).filter(k => k > 20 && k < ph.length - 20);
    if (!coupes.length) return [ph];
    const k = coupes.reduce((a, c) => (Math.abs(c - ph.length / 2) < Math.abs(a - ph.length / 2) ? c : a));
    return [ph.slice(0, k).trim(), ph.slice(k).trim()];
  });
  // Les morceaux courts qui se suivent tiennent sur le même carton.
  const cartons = [];
  for (const m of morceaux) {
    if (cartons.length && cartons.at(-1).length + 1 + m.length <= max) cartons[cartons.length - 1] += " " + m;
    else cartons.push(m);
  }
  return cartons;
}

/** Trajet du bassin vu de dessus, en centimètres autour de son centre, et amplitude de sa hauteur. */
export function trajetDe(positions) {
  if (!positions?.length) return null;
  const milieu = k => { const v = positions.map(p => p[k]); return (Math.min(...v) + Math.max(...v)) / 2; };
  const cx = milieu(0), cz = milieu(2), ys = positions.map(p => p[1]);
  return {
    points: positions.map(p => [Math.round((p[0] - cx) * 1000) / 10, Math.round((p[2] - cz) * 1000) / 10]),
    hauteur_rebond: Math.round((Math.max(...ys) - Math.min(...ys)) * 1000) / 10,
  };
}

/** Images qui couvrent `temps` temps de danse à partir du temps `depuis` (le trajet se referme sur un cycle). */
const fenetre = (positions, bpm, ips, depuis, temps) => {
  const a = Math.round(depuis * 60 / bpm * ips), n = Math.round(temps * 60 / bpm * ips);
  return positions.length >= a + n ? positions.slice(a, a + n + 1) : positions;
};

/**
 * Les éléments d'habillage d'un chapitre, dans l'ordre où ils se superposent.
 * Chaque élément : {type, donnees, debut, fin, fondu} (instants en secondes dans le chapitre).
 * @param bassins  positions du bassin relevées pendant la capture, par plan (`{ [idDuPlan]: [[x, y, z], …] }`)
 * @param bpm      tempo du chapitre
 */
export function habillageDe(chapitre, cal, narration, ordre, composition, bassins = {}, bpm = 100) {
  const D = cal.duree, out = [];
  const style = chapitre.style ? STYLES[chapitre.style] : null;
  const numero = chapitre.style ? `${narration.ordre.indexOf(chapitre.style) + 1} / ${narration.ordre.length}` : "";
  const premiere = cal.phrases[0], derniere = cal.phrases[cal.phrases.length - 1];
  const element = (type, donnees, debut, fin, fondu = FONDU) => out.push({ type, donnees, debut: Math.max(0, debut), fin: Math.min(D, fin), fondu });
  const vignette = (positions, depuis, extra) => {
    const t = trajetDe(fenetre(positions ?? [], bpm, FILM.ips, depuis, 8));
    return t ? { ...t, ...extra } : null;
  };

  if (chapitre.type === "comparaison") {
    const { rangee, grille } = COMPARAISON;
    for (const [forme, a, b] of [[rangee, 0, composition.coupe], [grille, composition.coupe, D]]) {
      const cases = ordre.map((s, k) => ({ ...caseDe(forme, k), style: s }));
      // Accent : les styles dont parle la phrase sont encadrés ; les autres passent sous un voile, sauf
      // `"voile": false` (on compare alors les six, cadres seuls).
      chapitre.phrases.forEach((p, i) => {
        const ph = cal.phrases[i];
        if (!p.accent?.length || ph.debut < a - 0.01 || ph.debut >= b) return;
        element("accent", {
          // Le voile d'une case du haut monte jusqu'au bord de l'image.
          voiles: p.voile === false ? [] : cases.filter(c => !p.accent.includes(c.style))
            .map(c => (c.y === COMPARAISON.haut ? { ...c, y: 0, hauteur: c.hauteur + COMPARAISON.haut } : c)),
          liseres: cases.filter(c => p.accent.includes(c.style)).map(c => ({ ...c, couleur: STYLES[c.style].couleur })),
        }, ph.debut, Math.min(b, ph.fin + 0.2), 0.2);
      });
      // Les noms, par-dessus le voile : on lit toujours de qui on parle.
      for (let ligne = 0; ligne < forme.lignes; ligne++) {
        const noms = cases.slice(ligne * forme.colonnes, (ligne + 1) * forme.colonnes)
          .map(c => ({ x: c.x, largeur: c.largeur, nom: STYLES[c.style].nom, couleur: STYLES[c.style].couleur, detail: "" }));
        element("etiquettes", { cases: noms, y: caseDe(forme, ligne * forme.colonnes).y + (forme === rangee ? 10 : 14), gauche: forme === grille }, a + 0.2, b - (b === D ? 0 : 0.05));
      }
      // Dans la grille, le trajet de chaque bassin vu de dessus, à la même échelle.
      if (forme === grille) {
        const vignettes = cases.map(c => vignette(bassins[`comparaison-grille-${c.style}`], 0,
          { x: c.x + c.largeur - 212, y: c.y + c.hauteur - 172, largeur: 200, hauteur: 160, echelle: 9, couleur: STYLES[c.style].couleur })).filter(Boolean);
        if (vignettes.length) element("traces", { vignettes, legende: "vu de dessus" }, a + 0.4, b);
      }
    }
  }

  if (chapitre.type === "final") element("degrade", { bandes: true }, cal.credits.debut - 1.2, D, 1.2);
  if (premiere) element("bande", {}, premiere.debut - 0.4, derniere.fin + 0.5, 0.4);

  if (chapitre.type === "ouverture")
    element("titre", { sur: narration.surTitre, titre: narration.titre, sous: narration.sousTitre, pied: narration.piedTitre }, 0.5, Math.max(4.5, premiere.fin - 0.2), 0.5);

  // La comparaison et le final s'annoncent, comme les chapitres de style.
  if ((chapitre.type === "comparaison" || chapitre.type === "final") && chapitre.titre && premiere.debut > 1.2)
    element("intertitre", { texte: chapitre.titre }, 0.3, premiere.debut - 0.15, 0.3);

  if (chapitre.type === "style") {
    const c = chapitre.cartouche ?? {};
    const finCarte = premiere.debut + 0.5;
    element("chapitre", { numero, nom: style.nom, ou: [c.lieu, c.epoque].filter(Boolean).join(", "), couleur: style.couleur }, 0.25, finCarte, 0.35);
    element("cartouche", { nom: style.nom, infos: [[c.lieu, c.epoque].filter(Boolean).join(" · "), c.tempo].filter(Boolean), couleur: style.couleur }, finCarte + 0.1, D - 0.3);
    // Pendant le gros plan, le trajet du bassin vu de dessus : c'est là que se lisent le « 8 », le cercle, l'écart.
    const k = plansDesPhrases(chapitre).indexOf("bassin");
    const v = k >= 0 ? vignette(bassins[chapitre.id], 4, { x: 100, y: 492, largeur: 460, hauteur: 320, echelle: 16, couleur: style.couleur }) : null;
    if (v) element("traces", { vignettes: [v], legende: "Trajet du bassin, vu de dessus", detail: true }, cal.phrases[k].debut + 0.2, (cal.phrases[k + 1]?.debut ?? D) - 0.3);
  }

  if (chapitre.type === "limites") {
    // Les points s'ajoutent un à un, chacun avec la phrase qui le dit.
    const avecPoint = chapitre.phrases.map((p, i) => ({ point: p.point, t: cal.phrases[i].debut })).filter(x => x.point);
    avecPoint.forEach((x, k) => element("points", { titre: chapitre.titre ?? "Les limites", points: avecPoint.slice(0, k + 1).map(y => y.point) },
      x.t - 0.1, k + 1 < avecPoint.length ? avecPoint[k + 1].t - 0.1 : D - 0.3, k === 0 ? 0.3 : 0.12));
  }

  // Repères (mot-clé à l'écran pendant la phrase) et sous-titres, en cartons de deux lignes au plus.
  chapitre.phrases.forEach((p, i) => {
    const ph = cal.phrases[i], v = VOIX[p.voix];
    if (p.repere && chapitre.type !== "comparaison" && chapitre.type !== "limites")
      element("repere", { texte: p.repere, couleur: style?.couleur ?? "#5eead4" }, ph.debut + 0.1, ph.fin + 0.3);
    const cartons = decouper(p.texte), total = cartons.reduce((n, c) => n + c.length, 0);
    let t = ph.debut;
    cartons.forEach((texte, k) => {
      const fin = k + 1 < cartons.length ? t + (ph.fin - ph.debut) * texte.length / total : ph.fin;
      element("soustitre", { role: v.role, texte, couleur: v.couleur }, t - 0.05, fin + (k + 1 < cartons.length ? 0 : 0.25), 0.12);
      t = fin;
    });
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
