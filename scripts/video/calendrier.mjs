// Le calendrier du film (#155) : pur, sans fichier ni horloge. À partir du scénario et de la durée de
// chaque phrase dite, il place les phrases, donne la durée de chaque chapitre et les coupes de caméra.

/** Silences, en secondes. `avant` et `apres` : musique et image seules, en tête et en queue de chapitre. */
export const RYTHME = {
  avant: { ouverture: 3.2, style: 2.8, comparaison: 2.4, limites: 1.2, final: 1.6 },
  apres: { ouverture: 1.0, style: 1.4, comparaison: 1.6, limites: 1.0, final: 0 },
  /** Entre deux phrases de la même voix, puis quand la voix change. */
  entre: 0.42, entreVoix: 0.7,
  /** Final : danse seule après la dernière phrase, avant les crédits. */
  danseAvantCredits: 6,
  /** Vitesse du générique, en pixels par seconde (image de 1080 lignes), et temps tenu en fin de défilement. */
  vitesseCredits: 78, finCredits: 3.5, margeCredits: 140,
  /** Fondu au noir à chaque bord de chapitre. */
  fondu: 0.4,
};

const arrondi = x => Math.round(x * 1000) / 1000;

/**
 * @param {Array<{id: string, type: string, phrases: Array<{voix: string, pause?: number}>}>} chapitres dans l'ordre du film
 * @param {(chapitre: string, index: number) => number} dureeDe durée de la phrase dite, en secondes
 * @param {{ips: number, hauteurCredits?: number, rythme?: typeof RYTHME}} options
 */
export function calendrier(chapitres, dureeDe, { ips, hauteurCredits = 0, rythme = RYTHME }) {
  let t = 0;
  const out = [];
  for (const c of chapitres) {
    let local = rythme.avant[c.type] ?? 2;
    const phrases = c.phrases.map((p, i) => {
      if (i > 0) local += (p.voix === c.phrases[i - 1].voix ? rythme.entre : rythme.entreVoix);
      local += p.pause ?? 0;
      const d = dureeDe(c.id, i);
      if (!(d > 0)) throw new Error(`durée manquante : ${c.id} phrase ${i + 1}`);
      const debut = local;
      local += d;
      return { index: i, debut: arrondi(debut), fin: arrondi(local) };
    });
    let credits = null;
    if (c.type === "final") {
      const debutCredits = local + rythme.danseAvantCredits;
      // Le générique monte depuis le bas et s'arrête quand sa dernière ligne est à l'écran (marge de
      // 140 lignes sous elle), puis l'image tient avant le noir.
      const defilement = (hauteurCredits + rythme.margeCredits) / rythme.vitesseCredits;
      credits = { debut: arrondi(debutCredits), defilement: arrondi(defilement) };
      local = debutCredits + defilement + rythme.finCredits;
    } else local += rythme.apres[c.type] ?? 1;
    // Une durée entière en images : le plan filmé et le son ont la même longueur.
    const images = Math.ceil(local * ips);
    const duree = images / ips;
    out.push({ id: c.id, type: c.type, debut: arrondi(t), duree, images, phrases, ...(credits ? { credits } : {}) });
    t += duree;
  }
  return { chapitres: out, duree: arrondi(t), images: out.reduce((n, c) => n + c.images, 0) };
}

/** Instants de coupe d'un chapitre : les débuts de phrase les plus proches des fractions demandées. */
export function coupes(chapitre, fractions) {
  const debuts = chapitre.phrases.map(p => p.debut - 0.25).filter(t => t > 1.5 && t < chapitre.duree - 1.5);
  const prises = [];
  for (const f of fractions) {
    const cible = f * chapitre.duree;
    const libres = debuts.filter(t => !prises.includes(t));
    const t = libres.length ? libres.reduce((a, b) => (Math.abs(b - cible) < Math.abs(a - cible) ? b : a)) : cible;
    prises.push(t);
  }
  return prises.sort((a, b) => a - b).map(arrondi);
}

/** Interpolation douce entre deux valeurs (0 ≤ u ≤ 1). */
export const adouci = u => { const x = Math.min(1, Math.max(0, u)); return x * x * (3 - 2 * x); };
export const entre = (a, b, u) => a + (b - a) * u;
