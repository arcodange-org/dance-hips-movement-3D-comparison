// Prompts versionnés des pistes enregistrées (#142, docs/spec-musique-elevenlabs.md).
//
// Le prompt de la kizomba est celui du propriétaire, MOT POUR MOT. Les autres reprennent sa
// structure (tempo strict, ni changement de tempo ni break, mixage sec, instrumental) avec
// l'instrumentation documentée dans docs/musique/<style>.md. Aucun prompt ne nomme d'artiste, de
// titre ni d'œuvre : les conditions d'Eleven Music l'interdisent.
//
// `bpm` : tempo demandé (le tempo réel est MESURÉ sur le fichier). `beats` : boucle visée.
// `seconds` : durée demandée = boucle + marge pour une entrée et une fin.

export const MODELE = "music_v2_5";
/**
 * Crédits par minute générée, MESURÉS sur le compteur de l'abonnement le 21 novembre 2026 :
 * 775 crédits pour 62 s, 564 pour trois extraits de 15 s (la grille tarifaire publique annonçait 900).
 */
export const CREDITS_PAR_MINUTE = 750;

const COMMUN = "no tempo changes, no breakdown, dry and punchy studio mix, high transient clarity, instrumental only, no vocals";

export const PROMPTS = {
  kizomba: {
    bpm: 102, beats: 96, seconds: 62,
    prompt: "Authentic Angolan Kizomba and Semba fusion instrumental, 102 BPM, strictly quantized steady tempo, prominent syncopated kick drum, crisp rimshot snare, dikanza scraper percussion, deep warm round bassline, clean melodic acoustic guitar riffs, subtle atmospheric synth pad, clear 1-2-3 rhythmic pulse, no tempo changes, no breakdown, dry and punchy studio mix, high transient clarity, instrumental only, no vocals",
  },
  semba: {
    bpm: 120, beats: 128, seconds: 68,
    prompt: `Authentic Angolan Semba instrumental, 120 BPM, strictly quantized steady tempo, lively two-beat feel, low ngoma hand drum accenting every first beat, high ngoma hand drum answering, dikanza scraper percussion in continuous sixteenth notes, bright interlocking rhythm guitar, melodic lead acoustic guitar riffs, bouncing round bassline, clear pulse for dancers, ${COMMUN}`,
  },
  kompa: {
    bpm: 120, beats: 128, seconds: 68,
    prompt: `Authentic Haitian Kompa instrumental, 120 BPM, strictly quantized steady tempo, kick drum on beats one and three, tanbou hand drum on beats two and four, steady cowbell, graj scraper percussion, floor tom pickups, walking bassline, bright continuous rhythm guitar picking, short warm brass section stabs, clear even pulse for dancers, ${COMMUN}`,
  },
  tarraxinha: {
    bpm: 75, beats: 64, seconds: 56,
    prompt: `Angolan Tarraxinha instrumental, 75 BPM, strictly quantized steady tempo, slow sparse and hypnotic, deep sustained sub bass, heavy sparse kick drum, half-time clap on beat three, sparse syncopated rimshot, dark minimal synth pad, lots of space between hits, clear slow pulse for dancers, ${COMMUN}`,
  },
  suave: {
    bpm: 72, beats: 64, seconds: 58,
    prompt: `Slow gentle Angolan Kizomba instrumental, 72 BPM, strictly quantized steady tempo, calm and smooth, soft round kick drum, soft rimshot, light clap, occasional shaker, long sustained warm bassline, warm atmospheric synth pad, sparse electric piano chords, clear slow pulse for dancers, ${COMMUN}`,
  },
  zouk: {
    bpm: 80, beats: 64, seconds: 52,
    prompt: `Romantic slow Zouk instrumental for Brazilian Zouk dancing, 80 BPM, strictly quantized steady tempo, boom chick-chick drum pattern with kick drum on beat one and rimshot on beats three and four, hi-hat in a three-three-two pattern, soft shaker, warm round bassline, lush sustained strings, gentle nylon guitar arpeggios, clear slow pulse for dancers, ${COMMUN}`,
  },
};

// ------------------------------------------------------------------------------------------
// Variantes (plans de composition) — deuxième tentative.
//
// La prise 1 de la kizomba (prompt ci-dessus) a été refusée à l'écoute par le propriétaire le
// 21 novembre 2026 : « ça ressemble plus à de la techno qu'à de la kizomba semba angolaise ».
// Mesure : grosse caisse d'égale force sur les quatre temps, presque aucune syncope. Le prompt ne
// donnait ni époque ni type de production, et « dry and punchy studio mix » pousse vers
// l'électronique. Un plan de composition permet de dire aussi ce qu'on NE veut PAS.
//
// Chaque variante vient de la recherche du dépôt (docs/musique/kizomba.md, semba.md) : rythmique
// héritée du zouk en 3-3-2, grosse caisse douce sur les temps forts seulement, basse ronde et
// forte, guitares, peu de densité (kizomba) ; ngomas, dikanza en doubles-croches, deux guitares,
// accordéon, mesure à deux temps rebondissante (semba). Aucun artiste, titre ni œuvre nommé.
// ------------------------------------------------------------------------------------------

/** Ce qu'une prise ne doit pas être. */
export const A_EVITER = [
  "techno", "house", "EDM", "trance", "club dance music", "four-on-the-floor kick drum", "kick drum on every beat",
  "hard punchy electronic kick", "sidechain compression", "synth lead", "aggressive synthesizers",
  "vocals", "lyrics", "tempo changes", "breakdown", "drum fill pauses",
];

const CONSIGNE = "[Groove] {the full band plays the steady groove from the very first beat, no intro, no breakdown, no pauses, clear pulse for dancers}";
const CONSIGNE_SUITE = "[Groove continues] {the same steady groove with the same instruments, no break, no pause, clear pulse for dancers}";
const CONSIGNE_FIN = "[Ending] {one final chord on the downbeat, let it ring out}";
/** Au-delà, le morceau est découpé en sections (les extraits d'un seul bloc de 15 s fonctionnent). */
export const BLOC_MAX_S = 20;
/** Une section = 32 temps = quatre phrases de 8 temps : les changements tombent sur un temps 1. */
export const TEMPS_PAR_SECTION = 32;

export const VARIANTES = {
  kizomba: {
    A: {
      nom: "Kizomba de groupe, Luanda, années 1990",
      styles: [
        "Angolan kizomba", "early 1990s Luanda studio recording", "live band with real instruments", "102 BPM",
        "strictly steady tempo", "4/4, relaxed, sensual, romantic, laid-back", "zouk-derived syncopated drum groove",
        "soft kick drum on beats one and three only", "cross-stick rimshot playing a three-three-two tresillo pattern",
        "light shaker in sixteenth notes", "congas", "deep warm round legato bass guitar, louder than the drums",
        "clean electric guitar with chorus playing arpeggios", "melodic acoustic guitar riffs",
        "soft warm keyboard pad far in the background", "minor key", "warm analog sound, lots of space between the drum hits",
        "instrumental",
      ],
      eviter: [],
    },
    B: {
      nom: "Semba de groupe, Luanda, années 1970",
      styles: [
        "Angolan semba", "1970s Luanda live band recording", "102 BPM", "strictly steady tempo",
        "bouncy two-beat feel, galloping syncopation, festive and joyful", "low hand drum accenting the first beat of each bar",
        "congas and high hand drum", "dikanza bamboo scraper in constant sixteenth notes", "interlocking rhythm electric guitar",
        "bright melodic lead guitar in the Congolese style", "accordion", "melodic bass guitar",
        "major key, tonic and dominant chords", "acoustic, organic, live room sound", "instrumental",
      ],
      eviter: ["drum machine", "synthesizer", "zouk beat"],
    },
    C: {
      nom: "Fusion kizomba et semba",
      styles: [
        "Angolan kizomba and semba fusion", "Luanda live band, warm 1990s studio recording", "102 BPM", "strictly steady tempo",
        "relaxed but danceable, sensual, organic", "soft kick drum on beats one and three, never on every beat",
        "cross-stick rimshot in a three-three-two pattern", "dikanza scraper in sixteenth notes", "congas",
        "semba-style interlocking guitars with a clean melodic lead guitar", "accordion phrases", "deep warm round bass guitar",
        "subtle keyboard pad in the background", "minor key", "acoustic instruments in front, warm analog sound", "instrumental",
      ],
      eviter: [],
    },
  },
};

/** Durée d'un extrait d'essai (s) : assez pour juger la couleur, quatre fois moins cher qu'une prise. */
export const DUREE_ESSAI = 15;

/**
 * Plan de composition (modèles music_v2 et music_v2_5) d'une variante, pour une durée donnée.
 *
 * Un extrait court tient en un bloc. Un morceau entier est découpé en sections de 32 temps, puis
 * une fin : le 21 novembre 2026, un bloc unique de 62 s a rendu un fichier SILENCIEUX (775 crédits
 * perdus), alors que le planificateur de l'API (`POST /v1/music/plan`, gratuit) découpe lui-même
 * 62 s en quatre sections de 15 à 16 s.
 */
export function planDe(style, variante, seconds) {
  const v = VARIANTES[style]?.[variante];
  if (!v) throw new Error(`variante inconnue ${style}=${variante}`);
  const bloc = (text, ms) => ({ text, duration_ms: Math.round(ms), positive_styles: v.styles,
    negative_styles: [...A_EVITER, ...v.eviter], context_adherence: "high" });
  if (seconds <= BLOC_MAX_S) return { chunks: [bloc(CONSIGNE, seconds * 1000)] };
  const section = (TEMPS_PAR_SECTION * 60000) / PROMPTS[style].bpm;
  const sections = Math.max(1, Math.min(Math.floor(PROMPTS[style].beats / TEMPS_PAR_SECTION), Math.floor((seconds * 1000 - 3000) / section)));
  const chunks = [];
  for (let i = 0; i < sections; i++) chunks.push(bloc(i === 0 ? CONSIGNE : CONSIGNE_SUITE, section));
  const reste = seconds * 1000 - chunks.reduce((sum, c) => sum + c.duration_ms, 0);
  chunks.push(bloc(CONSIGNE_FIN, Math.max(3000, reste)));
  return { chunks };
}

/** Texte de provenance d'une variante, consigné dans le registre à la place d'un prompt. */
export function texteDe(style, variante) {
  const plan = planDe(style, variante, DUREE_ESSAI).chunks[0];
  return `Plan de composition, variante ${variante} (${VARIANTES[style][variante].nom}). Styles : ${plan.positive_styles.join(", ")}. À éviter : ${plan.negative_styles.join(", ")}. Consigne : ${plan.text}`;
}

/** Coût estimé (crédits) d'une durée en secondes. */
export const creditsPour = (seconds) => Math.ceil((seconds / 60) * CREDITS_PAR_MINUTE);

/** Coût estimé (crédits) d'une liste de styles. */
export function coutEstime(styles) {
  const seconds = styles.reduce((sum, s) => sum + PROMPTS[s].seconds, 0);
  return { seconds, credits: Math.ceil((seconds / 60) * CREDITS_PAR_MINUTE) };
}
