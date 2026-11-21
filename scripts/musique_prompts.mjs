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
/** Tarif relevé le 21 novembre 2026 : crédits par minute générée. */
export const CREDITS_PAR_MINUTE = 900;

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

/** Coût estimé (crédits) d'une liste de styles. */
export function coutEstime(styles) {
  const seconds = styles.reduce((sum, s) => sum + PROMPTS[s].seconds, 0);
  return { seconds, credits: Math.ceil((seconds / 60) * CREDITS_PAR_MINUTE) };
}
