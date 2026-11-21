#!/usr/bin/env node
// Vidéo éducative (#155, docs/spec-video-pas-de-base.md) : le point d'entrée de film, le calendrier, le
// scénario et ses faits, les plans, l'habillage, les musiques. Sans navigateur, sans voix, sans réseau :
// la fabrication elle-même (scripts/video/generer_video.mjs) n'est pas exercée ici.
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { RYTHME, adouci, calendrier, coupes } from "./video/calendrier.mjs";
import { DEBIT, FICHE_DUREES, FICHE_FAITS, clePhrase, controlerNarration, faitsDe } from "./video/controle.mjs";
import { DOSSIER_PISTES, FICHE_PISTES, VARIANTE_VIDEO, niveauxDe, partiePleine, pistes, tempoPrevu } from "./video/musique.mjs";
import { ATTRIBUTIONS, COMPARAISON, FILM, PRONONCIATION, SOUS_TITRE_MAX, STYLES, VOIX, caseDe, chapitresDe, decouper, generiqueDe,
  habillageDe, lireNarration, musiqueDe, plansDe, plansDesPhrases, sourcesDe, trajetDe } from "./video/scenario.mjs";
import { ELEMENTS, generiqueHtml } from "./video/habillage.mjs";
import { ATTRIBUTION_VOIX, prononcer } from "./video/voix.mjs";
import { PROMPTS, VARIANTES } from "./musique_prompts.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = new URL("./.test-video-bundle.mjs", import.meta.url);
buildSync({
  stdin: { contents: ["film", "styles", "cameras"].map((n) => `export * from "./src/${n}";`).join("\n"), resolveDir: root },
  bundle: true, packages: "external", platform: "node", format: "esm", outfile: bundle.pathname,
  define: { "import.meta.env.BASE_URL": '"/"' }, logLevel: "silent",
});
const app = await import(bundle.href);
unlinkSync(bundle);
const proche = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

// ---------------------------------------------------------------- 1. filmer image par image
{
  const { filmEnabled, frameTime, frameBeat, filmCamera, filmShiftPixels, posFromView } = app;
  assert.equal(filmEnabled(new URLSearchParams("film=1")), true);
  assert.equal(filmEnabled(new URLSearchParams("film=0&bare=1")), false);
  assert.equal(filmEnabled(new URLSearchParams("")), false, "sans film=1, rien ne change");
  assert.equal(frameTime(50, 25), 2);
  assert.ok(proche(frameBeat(50, 25, 120), 4), "2 s à 120 bpm = 4 temps");
  assert.ok(proche(frameBeat(74, 25, 102), 5.032), "image 74 à 102 bpm (mesuré sur un plan filmé)");
  assert.ok(proche(frameBeat(25, 25, 60, 8), 9), "départ en cours de danse");
  // Même convention que les vues de l'application : azimut 0 = caméra côté +Z, 90 = côté +X.
  const cible = [0, 0.85, 0];
  assert.deepEqual(filmCamera({ az: 0, el: 0, dist: 3 }, cible).map((x) => Math.round(x * 1e6) / 1e6), [0, 0.85, 3]);
  assert.deepEqual(filmCamera({ az: 90, el: 0, dist: 3 }, cible).map((x) => Math.round(x * 1e6) / 1e6), [3, 0.85, 0]);
  for (const [az, el, dist] of [[30, 5, 3.3], [-16, 11, 4.4], [140, 3, 2.3]]) {
    const a = filmCamera({ az, el, dist }, cible), b = posFromView(cible, az, el, dist);
    assert.ok(a.every((x, k) => proche(x, b[k], 1e-9)), `filmCamera = posFromView (${az}°, ${el}°, ${dist} m)`);
    assert.ok(proche(Math.hypot(a[0] - cible[0], a[1] - cible[1], a[2] - cible[2]), dist, 1e-9), "à la distance demandée");
  }
  assert.equal(filmShiftPixels(0.2, 1920), 384);
  assert.equal(filmShiftPixels(undefined, 1920), 0);
  assert.equal(filmShiftPixels(-0.12, 1920), -230);
  // Caméra qui suit l'orientation du couple : par le plus court chemin, sans à-coup.
  const { angleDiff, followAngle, FILM_FOLLOW_TAU } = app;
  assert.ok(proche(angleDiff(0.2, -0.1), 0.3, 1e-12));
  assert.ok(proche(angleDiff(-3, 3), 2 * Math.PI - 6, 1e-12), "de 3 à −3 rad : par le plus court, en avant");
  assert.ok(Math.abs(angleDiff(10 * Math.PI + 0.1, 0) - 0.1) < 1e-9, "les tours entiers ne comptent pas");
  assert.equal(followAngle(1, 2, 0, FILM_FOLLOW_TAU), 2, "première image : sur la cible");
  const apres = followAngle(0, 1, FILM_FOLLOW_TAU, FILM_FOLLOW_TAU);
  assert.ok(proche(apres, 1 - Math.exp(-1), 1e-12), "après une constante de temps, 63 % de l'écart");
  let a = 0;
  for (let i = 0; i < 25 * 20; i++) a = followAngle(a, 1.2, 1 / 25, FILM_FOLLOW_TAU);
  assert.ok(Math.abs(a - 1.2) < 1e-4, "la caméra rejoint l'orientation du couple");
  assert.ok(Math.abs(followAngle(3.1, -3.1, 1 / 25, FILM_FOLLOW_TAU) - 3.1) < 0.01 && followAngle(3.1, -3.1, 1 / 25, FILM_FOLLOW_TAU) > 3.1, "pas de demi-tour au passage de ±π");
  console.log("PASS film : instants, temps de danse, caméra, décalage d'objectif, suivi du couple");
}

// ---------------------------------------------------------------- 2. calendrier
{
  const chapitres = [
    { id: "ouverture", type: "ouverture", phrases: [{ voix: "guide" }, { voix: "guide" }, { voix: "geste" }] },
    { id: "semba", type: "style", phrases: [{ voix: "histoire" }, { voix: "geste", pause: 0.5 }] },
    { id: "final", type: "final", phrases: [{ voix: "guide" }] },
  ];
  const cal = calendrier(chapitres, () => 4, { ips: 25, hauteurCredits: 2000 });
  const [o, s, f] = cal.chapitres;
  assert.equal(o.phrases[0].debut, RYTHME.avant.ouverture);
  assert.ok(proche(o.phrases[1].debut - o.phrases[0].fin, RYTHME.entre, 1e-6), "même voix : silence court");
  assert.ok(proche(o.phrases[2].debut - o.phrases[1].fin, RYTHME.entreVoix, 1e-6), "la voix change : silence plus long");
  assert.ok(proche(s.phrases[1].debut - s.phrases[0].fin, RYTHME.entreVoix + 0.5, 1e-6), "une pause s'ajoute au silence");
  for (const c of cal.chapitres) {
    assert.ok(Number.isInteger(c.images) && proche(c.duree, c.images / 25), `${c.id} : durée entière en images`);
    assert.ok(c.phrases.every((p) => p.debut >= 0 && p.fin <= c.duree + 1e-9), `${c.id} : aucune phrase ne déborde`);
    assert.ok(c.duree >= c.phrases.at(-1).fin, `${c.id} : la dernière phrase se termine avant la fin`);
  }
  assert.ok(proche(s.debut, o.duree, 1e-3) && proche(f.debut, o.duree + s.duree, 1e-3), "les chapitres se suivent");
  assert.ok(proche(cal.duree, o.duree + s.duree + f.duree, 1e-3));
  // Final : la danse seule, puis le générique monte, puis l'image tient.
  assert.ok(proche(f.credits.debut, f.phrases[0].fin + RYTHME.danseAvantCredits, 1e-3));
  assert.ok(proche(f.credits.defilement, (2000 + RYTHME.margeCredits) / RYTHME.vitesseCredits, 1e-3));
  assert.ok(f.duree >= f.credits.debut + f.credits.defilement + RYTHME.finCredits);
  assert.throws(() => calendrier(chapitres, () => 0, { ips: 25 }), /durée manquante/);
  // Coupes : sur des débuts de phrase, dans l'ordre, jamais collées aux bords.
  const long = calendrier([{ id: "x", type: "style", phrases: Array.from({ length: 6 }, () => ({ voix: "geste" })) }], () => 4, { ips: 25 }).chapitres[0];
  const [t1, t2] = coupes(long, [0.36, 0.7]);
  assert.ok(t1 < t2 && t1 > 1.5 && t2 < long.duree - 1.5);
  assert.ok(long.phrases.some((p) => proche(p.debut - 0.25, t1, 1e-3)) && long.phrases.some((p) => proche(p.debut - 0.25, t2, 1e-3)), "coupes sur des débuts de phrase");
  assert.deepEqual([adouci(-1), adouci(0.5), adouci(2)], [0, 0.5, 1]);
  console.log("PASS calendrier : phrases, silences, durées en images, générique, coupes");
}

// ---------------------------------------------------------------- 3. scénario : structure et faits
const faits = readFileSync(FICHE_FAITS, "utf8");
const narration = lireNarration();
const durees = existsSync(FICHE_DUREES) ? JSON.parse(readFileSync(FICHE_DUREES, "utf8")) : {};
{
  const ids = faitsDe(faits);
  assert.ok(ids.size >= 300, `fiche de faits : ${ids.size} faits numérotés`);
  assert.equal(new Set([...ids].map((x) => x.length)).size, 1, "identifiants de même forme");
  const r = controlerNarration(narration, faits, durees);
  assert.deepEqual(r.erreurs, [], "scénario conforme");
  assert.ok(r.estimation.duree >= FILM.dureeMin && r.estimation.duree <= FILM.dureeMax,
    `durée ${r.estimation.duree.toFixed(0)} s entre ${FILM.dureeMin} et ${FILM.dureeMax} s`);

  const chapitres = chapitresDe(narration);
  assert.deepEqual(chapitres.map((c) => c.type), ["ouverture", ...Array(6).fill("style"), "comparaison", "limites", "final"]);
  assert.deepEqual([...narration.ordre].sort(), Object.keys(STYLES).sort(), "les six styles, une fois chacun");
  const phrases = chapitres.flatMap((c) => c.phrases.map((p) => ({ ...p, chapitre: c.id })));
  // Chaque phrase cite des faits qui existent ; les phrases de liaison restent l'exception.
  for (const p of phrases) {
    assert.ok(p.lien || p.faits.length > 0, `${p.chapitre} : « ${p.texte.slice(0, 40)}… » cite un fait`);
    for (const id of p.faits ?? []) assert.ok(ids.has(id), `${p.chapitre} : ${id} existe dans la fiche`);
  }
  assert.ok(phrases.filter((p) => p.lien).length / phrases.length <= 0.15, "peu de phrases de liaison");
  // Plusieurs voix, chacune avec son rôle ; ce que la voix dit n'a ni chiffre ni sigle.
  assert.deepEqual([...new Set(phrases.map((p) => p.voix))].sort(), Object.keys(VOIX).sort(), "les trois voix parlent");
  assert.equal(new Set(Object.values(VOIX).map((v) => v.voix)).size, Object.keys(VOIX).length, "une voix Phonon par rôle");
  for (const p of phrases) {
    const dit = prononcer(p.dit ?? p.texte, PRONONCIATION);
    assert.ok(!/\d/.test(dit), `${p.chapitre} : pas de chiffre dans le texte dit (« ${dit.slice(0, 50)}… »)`);
    assert.ok(!/\bbpm\b/i.test(dit), `${p.chapitre} : « bpm » se dit en toutes lettres`);
  }
  // Les limites sont dites, et affichées.
  const limites = chapitres.find((c) => c.id === "limites");
  assert.ok(limites.phrases.filter((p) => p.point).length >= 3, "au moins trois limites affichées");
  // La comparaison oppose ou rapproche des styles nommés.
  const comparaison = chapitres.find((c) => c.id === "comparaison");
  const accents = comparaison.phrases.filter((p) => p.accent?.length);
  assert.ok(accents.length >= 2 && accents.every((p) => p.accent.every((s) => STYLES[s]) && p.accent.length < 6));
  // Générique : attributions obligatoires, et toutes les sources de la fiche.
  const generique = generiqueDe(narration, faits);
  const texte = JSON.stringify(generique);
  for (const a of ATTRIBUTIONS) assert.match(texte, a, `générique : ${a}`);
  assert.ok(texte.includes(ATTRIBUTION_VOIX), "attribution de la voix, mot pour mot");
  const sources = sourcesDe(faits);
  assert.equal(sources.length, 5, "cinq thèmes de sources");
  const nombre = sources.reduce((n, b) => n + b.flux.length, 0);
  assert.ok(nombre >= 140, `${nombre} sources au générique`);
  assert.ok(sources.every((b) => b.flux.every((x) => x.length > 3 && !/https?:|`/.test(x))), "ni adresse ni renvoi au dépôt dans une mention");
  assert.equal((faits.match(/^### 7\.[2-6] /gm) ?? []).length, 5);
  assert.equal(nombre, faits.slice(faits.indexOf("### 7.2"), faits.indexOf("### 7.7")).split("\n").filter((l) => l.startsWith("- ")).length, "aucune source oubliée");
  assert.match(generiqueHtml(generique), /class="flux"/);
  console.log(`PASS scénario : ${phrases.length} phrases, faits cités, trois voix, limites, comparaison, ${nombre} sources au générique`);
}

// ---------------------------------------------------------------- 4. styles, voix, prononciation
{
  assert.deepEqual(Object.keys(STYLES), Object.keys(app.STYLES), "les styles de l'application, dans le même ordre");
  for (const [k, s] of Object.entries(STYLES)) {
    assert.equal(s.couleur, app.STYLES[k].color, `${k} : couleur de l'application`);
    assert.equal(s.nom, app.STYLES[k].label, `${k} : nom de l'application`);
  }
  assert.deepEqual(Object.keys(DEBIT).sort(), Object.keys(VOIX).sort(), "un débit par voix");
  assert.equal(prononcer("Le semba et la tarraxinha.", PRONONCIATION), "Le sém-ba et la tarachigna.");
  assert.equal(prononcer("Semba, sembas", { semba: "sém-ba" }), "sém-ba, sembas", "mot entier seulement, sans tenir compte de la casse");
  assert.equal(prononcer("120 bpm", PRONONCIATION), "120 battements par minute");
  assert.equal(clePhrase({ voix: "guide", texte: "a", dit: "b" }), "guide|b");
  console.log("PASS styles et voix : couleurs de l'application, prononciation");
}

// ---------------------------------------------------------------- 5. plans et habillage
{
  const chapitres = chapitresDe(narration);
  const cal = calendrier(chapitres, (id, i) => {
    const p = chapitres.find((c) => c.id === id).phrases[i];
    return durees.phrases?.[clePhrase(p)] ?? Math.max(0.6, (p.dit ?? p.texte).length / DEBIT[p.voix]);
  }, { ips: FILM.ips, hauteurCredits: durees.generique?.hauteur ?? 3600 });
  const fini = (v) => ["az", "el", "dist", "fov"].every((k) => Number.isFinite(v[k])) && (v.target ?? []).every(Number.isFinite) && Number.isFinite(v.shift ?? 0);
  for (const c of chapitres) {
    const k = cal.chapitres.find((x) => x.id === c.id);
    const { plans, composition } = plansDe(c, k, 100, narration.ordre);
    for (const plan of plans) {
      assert.match(plan.url, /^\?/, `${plan.id} : paramètres d'URL`);
      assert.ok(!/film=/.test(plan.url), `${plan.id} : film=1 est ajouté par la capture`);
      assert.ok(plan.images > 0 && plan.ips === FILM.ips);
      for (const i of [0, Math.floor(plan.images / 2), plan.images - 1]) {
        const v = plan.cadrage(i, i / plan.ips);
        assert.ok(fini(v), `${plan.id} : cadrage fini à l'image ${i}`);
        assert.ok(v.dist >= 1.8 && v.dist <= 7 && v.fov >= 15 && v.fov <= 50, `${plan.id} : distance et champ dans les limites de la vue`);
      }
    }
    if (c.type === "comparaison") {
      assert.equal(plans.length, 12, "six rangées et six grilles");
      assert.equal(composition.n1 + composition.n2, k.images, "la rangée puis la grille couvrent le chapitre");
      assert.ok(plans.filter((p) => p.avance).every((p) => p.avance === composition.n1), "la grille reprend la danse là où la rangée s'arrête");
      assert.deepEqual(plans.filter((p) => !p.avance).map((p) => p.url.match(/style=(\w+)/)[1]), narration.ordre, "dans l'ordre du film");
      assert.ok(plans.every((p) => /travel=0/.test(p.url) && /bpm=100/.test(p.url)), "sur place, au même tempo");
    } else {
      assert.equal(plans.length, 1);
      assert.equal(plans[0].images, k.images, `${c.id} : le plan a la longueur du chapitre`);
      assert.deepEqual([plans[0].largeur, plans[0].hauteur], [FILM.largeur, FILM.hauteur]);
    }
    if (c.type === "style") assert.match(plans[0].url, new RegExp(`mode=solo&style=${c.style}&.*muscles=1.*travel=0`), `${c.id} : seul, sur place, avec les muscles`);
    if (c.type === "final") assert.match(plans[0].url, /vitrine=1&style=kizomba&graine=\d+/, "final : danse automatique, graine fixée");
    if (c.type === "limites") assert.match(plans[0].url, /muscles=0/, "limites : le squelette seul");
    // Habillage : chaque élément tient dans le chapitre ; chaque phrase a ses cartons de sous-titre.
    // Trajet de bassin factice (un « 8 » de 6 cm sur 2 cm, 1 cm de rebond) pour chaque plan filmé.
    const huit = (n) => Array.from({ length: n }, (_, i) => { const u = 2 * Math.PI * i / 60; return [0.03 * Math.sin(u), 0.9 + 0.005 * Math.sin(2 * u), 0.01 * Math.sin(2 * u)]; });
    const bassins = Object.fromEntries(plans.map((plan) => [plan.id, huit(plan.images)]));
    const elements = habillageDe(c, k, narration, narration.ordre, composition, bassins, 100);
    for (const e of elements) {
      assert.ok(ELEMENTS[e.type], `${c.id} : élément connu (${e.type})`);
      assert.ok(e.debut >= 0 && e.fin <= k.duree + 1e-9 && e.fin - e.debut > 0.2, `${c.id} ${e.type} : ${e.debut} → ${e.fin}`);
      assert.ok(typeof ELEMENTS[e.type](e.donnees) === "string");
    }
    const cartons = elements.filter((e) => e.type === "soustitre");
    assert.ok(cartons.length >= c.phrases.length, `${c.id} : au moins un carton de sous-titre par phrase`);
    assert.equal(cartons.map((e) => e.donnees.texte).join(" "), c.phrases.map((p) => p.texte).join(" "), `${c.id} : les cartons redonnent le texte, dans l'ordre`);
    assert.ok(cartons.every((e) => e.donnees.texte.length <= SOUS_TITRE_MAX + 12), `${c.id} : cartons de deux lignes au plus`);
    for (let i = 1; i < cartons.length; i++) assert.ok(cartons[i].debut >= cartons[i - 1].debut, `${c.id} : cartons dans l'ordre du temps`);
    if (c.type === "style") {
      assert.ok(elements.some((e) => e.type === "chapitre") && elements.some((e) => e.type === "cartouche"));
      // Un plan par phrase : le premier geste en gros plan de face, les suivants de profil, le reste en pied.
      const vus = plansDesPhrases(c);
      assert.equal(vus.filter((x) => x === "bassin").length, 1, `${c.id} : un seul gros plan du bassin`);
      assert.ok(c.phrases.every((p, i) => (p.voix === "geste") === (vus[i] !== "pied")), `${c.id} : l'histoire se raconte sur le corps entier`);
      composition.segments.forEach((seg, i) => {
        const v = plans[0].cadrage(0, (seg.debut + seg.fin) / 2);
        if (seg.plan === "bassin") assert.ok(v.az === 0 && v.fov < 30, `${c.id} : gros plan fixe et de face`);
        if (seg.plan === "profil") assert.ok(v.az >= 78 && v.az <= 94, `${c.id} : profil`);
        if (seg.plan === "pied") assert.ok(Math.abs(v.az) <= 16 && v.fov > 30, `${c.id} : en pied, de face`);
        assert.ok(i === 0 ? seg.debut === 0 : proche(seg.debut, k.phrases[i].debut - 0.25, 1e-9), `${c.id} : coupe juste avant la phrase`);
      });
      // Le trajet du bassin s'affiche pendant le gros plan.
      const trace = elements.find((e) => e.type === "traces"), gros = k.phrases[vus.indexOf("bassin")];
      assert.ok(trace && trace.debut >= gros.debut && trace.donnees.vignettes.length === 1 && trace.donnees.detail, `${c.id} : trajet du bassin pendant le gros plan`);
    }
    if (c.type === "comparaison") {
      const traces = elements.filter((e) => e.type === "traces");
      assert.equal(traces.length, 1, "comparaison : les six trajets, dans la grille");
      assert.equal(traces[0].donnees.vignettes.length, 6);
      assert.equal(new Set(traces[0].donnees.vignettes.map((v) => v.echelle)).size, 1, "comparaison : même échelle pour les six");
      assert.ok(traces[0].debut >= composition.coupe, "comparaison : pas de trajet pendant la rangée");
      // Les noms passent par-dessus le voile.
      const ordreTypes = elements.map((e) => e.type);
      assert.ok(ordreTypes.lastIndexOf("etiquettes") > ordreTypes.lastIndexOf("accent"), "comparaison : noms lisibles sous l'accent");
      assert.ok(elements.some((e) => e.type === "accent" && e.donnees.voiles.length === 0 && e.donnees.liseres.length === 2), "comparaison : cadres seuls quand on compare les six");
    }
    if (c.type === "comparaison" || c.type === "final") assert.ok(elements.some((e) => e.type === "intertitre" && e.donnees.texte === c.titre), `${c.id} : le chapitre s'annonce`);
    if (c.type === "final") assert.ok(plans[0].cadrage(0, 5).relative === true, "final : la caméra suit l'orientation du couple");
    if (c.type === "limites") assert.equal(elements.filter((e) => e.type === "points").at(-1).donnees.points.length, c.phrases.filter((p) => p.point).length);
    assert.ok(PROMPTS[musiqueDe(c)], `${c.id} : musique d'un style connu`);
  }
  // Géométrie de la comparaison : les cases couvrent la largeur, au-dessus de la bande des textes.
  for (const forme of [COMPARAISON.rangee, COMPARAISON.grille]) {
    assert.equal(forme.colonnes * forme.largeur, FILM.largeur);
    assert.equal(forme.lignes * forme.hauteur + (forme.lignes - 1) * forme.ecart, COMPARAISON.hauteur);
    const derniere = caseDe(forme, 5);
    assert.equal(derniere.x + derniere.largeur, FILM.largeur);
    assert.ok(derniere.y + derniere.hauteur <= FILM.hauteur - 180, "la bande des sous-titres reste libre");
  }
  // Sous-titres : coupés aux fins de phrase, puis à la ponctuation d'une phrase longue ; rien ne se perd.
  const long = "Dans le modèle, le poids change de pied à chaque temps. Le bassin suit : sept centimètres de chaque côté, à peine incliné. D'après une source, le poids resterait deux temps du même côté.";
  const morceaux = decouper(long);
  assert.equal(morceaux.join(" "), long);
  assert.ok(morceaux.length >= 2 && morceaux.every((m) => m.length <= SOUS_TITRE_MAX), "cartons courts");
  assert.deepEqual(decouper("Une phrase courte."), ["Une phrase courte."]);
  assert.deepEqual(decouper("Port-au-Prince, années 1950 : le saxophoniste Nemours Jean-Baptiste crée le kompa."), ["Port-au-Prince, années 1950 : le saxophoniste Nemours Jean-Baptiste crée le kompa."], "pas de coupe dans un nom ni après une abréviation");
  // Trajet du bassin : centré, en centimètres ; le rebond est l'amplitude de la hauteur.
  const trajet = trajetDe([[0.10, 0.90, 0.00], [0.16, 0.92, 0.02], [0.13, 0.91, -0.02]]);
  assert.deepEqual(trajet.points, [[-3, 0], [3, 2], [0, -2]]);
  assert.equal(trajet.hauteur_rebond, 2);
  assert.equal(trajetDe([]), null);
  console.log("PASS plans et habillage : un plan par phrase, comparaison synchronisée, trajets du bassin, sous-titres en cartons");
}

// ---------------------------------------------------------------- 6. musiques
{
  const P = pistes();
  assert.ok(P.kizomba && P.kizomba.boucle > 50, "la kizomba réutilise la piste de l'application, avec sa boucle");
  const fiche = JSON.parse(readFileSync(FICHE_PISTES, "utf8"));
  for (const style of Object.keys(STYLES).filter((s) => s !== "kizomba")) {
    assert.ok(VARIANTES[style]?.[VARIANTE_VIDEO], `${style} : plan de composition de la vidéo`);
    const p = fiche[style];
    assert.ok(p?.fichier, `${style} : provenance de l'extrait versionnée (le fichier son reste hors du dépôt)`);
    assert.ok(Math.abs(p.bpm - tempoPrevu(style)) / tempoPrevu(style) < 0.04, `${style} : tempo mesuré ${p.bpm} proche du tempo demandé`);
    assert.ok(p.derive < 0.015 && p.confiance >= 0.3, `${style} : tempo stable`);
    assert.ok(p.lufs > -40, `${style} : pas une prise silencieuse`);
    assert.ok(p.depuis >= 0 && p.jusque - p.depuis >= 24, `${style} : au moins 24 s de partie pleine`);
    assert.ok(p.modele && p.genereLe && p.demande.styles.length > 5 && p.demande.aEviter.includes("techno"), `${style} : provenance`);
    // Sur une machine qui a les extraits, le film n'en utilise que la partie pleine ; ailleurs, le style est filmé en silence.
    if (existsSync(`${DOSSIER_PISTES}/${p.fichier}`)) assert.deepEqual([P[style].premierTemps, P[style].duree], [p.depuis, p.jusque], `${style} : partie pleine`);
    else assert.equal(P[style], undefined, `${style} : pas de piste sans fichier`);
  }
  // Partie pleine : une entrée faible et une fin qui s'éteint sont écartées ; le départ tombe sur un début de phrase.
  const niveaux = [...Array(16).fill(-30), ...Array(60).fill(-15), ...Array(8).fill(-40)];
  const pleine = partiePleine(niveaux, 0.5, 120, 1.5);
  assert.ok(pleine.depuis >= 7.5 && pleine.depuis <= 11.5, `départ dans la partie pleine (${pleine.depuis})`);
  assert.ok(proche(((pleine.depuis - 1.5) / 4) % 1, 0, 1e-6), "sur un début de phrase de 8 temps");
  assert.ok(pleine.jusque >= 37 && pleine.jusque <= 39.5, `fin avant l'extinction (${pleine.jusque})`);
  assert.ok(pleine.boucle > 0 && proche((pleine.boucle / 8) % 1, 0, 1e-6) && pleine.depuis + pleine.boucle <= pleine.jusque, "boucle de 16 temps dans la partie pleine");
  assert.equal(partiePleine(Array(40).fill(-15), 0.5, 80, 0.8).depuis, 0.8, "un extrait plein part de son premier temps");
  const sinus = Float32Array.from({ length: 11025 * 4 }, (_, i) => (i < 11025 * 2 ? 0 : 0.5 * Math.sin(i / 5)));
  const n = niveauxDe(sinus, 11025);
  assert.ok(n[0] < -100 && n.at(-1) > -12, "niveaux : silence puis son");
  // Les fichiers son générés pour la vidéo ne sont pas versionnés (conditions d'Eleven Music).
  assert.match(readFileSync(new URL("../.gitignore", import.meta.url), "utf8"), /^scripts\/video\/pistes\/\*\.mp3$/m, "extraits hors du dépôt");
  console.log("PASS musiques : provenance des extraits, tempo, partie pleine, fichiers son hors du dépôt");
}
