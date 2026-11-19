// Grilles musicales des six styles, écrites comme DONNÉES (spec : docs/spec-son-synthese.md).
//
// Source de chaque ligne : la « Spécification de synthèse » de la page du style dans
// docs/musique/ (recherche #38). Une grille = 16 pas de double-croche = 4 temps moteur ; le pas 0
// est le temps 1 et tombe sur b = 4·g (g = indice de grille), comme la danse.
//
// Rigueur reprise de RecoDanse (« une clave fausse est pire que pas de clave ») : chaque piste
// garde son NIVEAU DE PREUVE (`documenté`, `faible`, `proposition`) et sa source. Ce sont des
// simplifications pédagogiques : aucune source ne donne de transcription complète sur 16 pas.
// Aucun enregistrement, aucune mélodie ni parole d'œuvre existante.

export type Evidence = "documenté" | "faible" | "proposition";

/** Timbres synthétisés (recettes : docs/musique/README.md, « Timbres de base »). */
export const TIMBRES = [
  "KICK", "KICK_SOFT", "SUB", "RIM", "SNARE", "CLAP", "HAT_C", "HAT_O", "SHAKER", "SCRAPER",
  "COWBELL", "CONGA_L", "CONGA_H", "TANBOU", "NGOMA_L", "NGOMA_H", "FLOOR_TOM",
  "BASS", "PLUCK", "PAD", "BRASS", "EPIANO",
] as const;
export type Timbre = (typeof TIMBRES)[number];

/** Comment une voix accordée choisit ses hauteurs dans l'accord courant. */
export type Voicing = "bass" | "chord" | "dyad" | "arp" | "thirds" | "fifth";

export interface TimbreParams {
  /** Fréquence de coupure du passe-bas (Hz). */
  lowpass?: number;
  /** Décroissance (s). */
  decay?: number;
  /** Attaque (s). */
  attack?: number;
}

export interface Track {
  /** Identifiant de piste (interrupteur par piste, hachage d'humanisation). */
  id: string;
  label: string;
  timbre: Timbre;
  /** 16 jetons séparés ou non par des espaces : X x o . pour les percussions, R 3 5 6 7 - . pour les voix accordées. */
  steps: string;
  evidence: Evidence;
  source: string;
  /** Vélocité par jeton (défauts : X 1, x 0,7, o 0,35, note 0,8). */
  vel?: Partial<Record<"X" | "x" | "o" | "note", number>>;
  /** Vélocité imposée à certains pas (0–15). */
  stepVel?: Record<number, number>;
  voicing?: Voicing;
  /** Décalage d'octave par rapport aux fondamentales de CHORDS (octave 2). */
  octave?: number;
  gainDb?: number;
  pan?: number;
  /** Grilles du cycle (0–3) où la piste joue ; toutes par défaut. */
  grids?: number[];
  params?: TimbreParams;
  /** Variation aléatoire (déterministe) de vélocité, en fraction ; défaut : celle du style. */
  velJitter?: number;
}

export interface Variation {
  note: string;
  evidence: Evidence;
  /** Remplace la ligne d'une piste pour cette grille. */
  set?: Record<string, string>;
  /** Pose un jeton à un pas. */
  add?: Record<string, { step: number; token: string; vel?: number }[]>;
  /** Silence aux pas donnés (un silence coupe aussi une tenue). */
  mute?: Record<string, number[] | "all">;
  /** Silence de toutes les pistes sauf `keep` aux pas donnés (break). */
  muteAllExcept?: { keep: string[]; steps: number[] };
  /** Gain supplémentaire par piste (dB). */
  gainDb?: Record<string, number>;
}

export interface MusicStyle {
  key: string;
  label: string;
  bpm: { default: number; min: number; max: number };
  meter: "4/4" | "2/4";
  /** Retard des doubles-croches impaires, en fraction de double-croche. */
  swing: number;
  /** Humanisation temporelle maximale (ms). */
  humanizeMs: number;
  velJitter: number;
  tonality: string;
  /** Un accord par grille du cycle de 4 ; « A|B » = deux temps chacun. */
  harmony: [string, string, string, string];
  tracks: Track[];
  variations: Partial<Record<0 | 1 | 2 | 3, Variation>>;
  page: string;
}

export interface Chord {
  /** Fondamentale MIDI, octave 2 (sauf B1). */
  root: number;
  /** Intervalles de l'accord pour les voix d'accord. */
  tones: number[];
  /** Intervalle du jeton « 3 » (tierce ou quarte suspendue). */
  third: number;
  /** Intervalle du jeton « 7 ». */
  seventh: number;
}

export const CHORDS: Record<string, Chord> = {
  Dm7: { root: 38, tones: [0, 3, 7, 10], third: 3, seventh: 10 },
  Gm7: { root: 43, tones: [0, 3, 7, 10], third: 3, seventh: 10 },
  A7: { root: 45, tones: [0, 4, 7, 10], third: 4, seventh: 10 },
  C: { root: 36, tones: [0, 4, 7], third: 4, seventh: 11 },
  G7: { root: 43, tones: [0, 4, 7, 10], third: 4, seventh: 10 },
  C7: { root: 36, tones: [0, 4, 7, 10], third: 4, seventh: 10 },
  F: { root: 41, tones: [0, 4, 7], third: 4, seventh: 11 },
  Am: { root: 45, tones: [0, 3, 7], third: 3, seventh: 10 },
  E: { root: 40, tones: [0, 4, 7], third: 4, seventh: 10 },
  Am9: { root: 45, tones: [0, 3, 10, 14], third: 3, seventh: 10 },
  Fmaj7: { root: 41, tones: [0, 4, 7, 11], third: 4, seventh: 11 },
  Dm9: { root: 38, tones: [0, 3, 10, 14], third: 3, seventh: 10 },
  E7sus4: { root: 40, tones: [0, 5, 7, 10], third: 5, seventh: 10 },
  E7: { root: 40, tones: [0, 4, 7, 10], third: 4, seventh: 10 },
  Em: { root: 40, tones: [0, 3, 7], third: 3, seventh: 10 },
  B7: { root: 35, tones: [0, 4, 7, 10], third: 4, seventh: 10 },
};

export const PERC_TOKENS = ["X", "x", "o", "."] as const;
export const PITCH_TOKENS = ["R", "3", "5", "6", "7", "-", "."] as const;
export const PITCHED_TIMBRES: readonly Timbre[] = ["SUB", "BASS", "PLUCK", "PAD", "BRASS", "EPIANO"];

/** Découpe une ligne de grille en 16 jetons (les espaces sont ignorés). */
export function parseSteps(line: string): string[] {
  return line.replace(/\s+/g, "").split("");
}

// ------------------------------------------------------------------------------------------
// Les six styles. Les grilles reprennent docs/musique/<style>.md, § « Grilles » (même ordre de
// lignes, mêmes positions) ; les vélocités, gains et variations : § « Accents » et « Variations ».
// ------------------------------------------------------------------------------------------

const kizomba: MusicStyle = {
  key: "kizomba", label: "Kizomba", page: "docs/musique/kizomba.md",
  bpm: { default: 90, min: 80, max: 100 }, meter: "4/4", swing: 0, humanizeMs: 4, velJitter: 0.08,
  tonality: "ré mineur", harmony: ["Dm7", "Gm7", "A7", "Dm7"],
  tracks: [
    // temps forts 1 et 3 — faible (Melodigging)
    { id: "KICK_SOFT", label: "Grosse caisse douce", timbre: "KICK_SOFT", steps: "X . . . . . . . x . . . . . . .",
      evidence: "faible", source: "Melodigging (temps forts)", vel: { X: 0.9, x: 0.6 } },
    // 3-3-2 hérité du zouk — proposition ; pas 6 et 14 plus forts (closent le 3-3-2)
    { id: "RIM", label: "Rimshot 3-3-2", timbre: "RIM", steps: "x . . x . . x . x . . x . . x .",
      evidence: "proposition", source: "3-3-2 du zouk (docs/musique/kizomba.md)", vel: { x: 0.5 }, stepVel: { 6: 0.6, 14: 0.6 } },
    // 2 et 4, léger — faible (BeatKey, Angola Travel Guide) ; ne jamais dépasser la grosse caisse
    { id: "CLAP", label: "Claquement 2 et 4", timbre: "CLAP", steps: ". . . . x . . . . . . . x . . .",
      evidence: "faible", source: "BeatKey, Angola Travel Guide", vel: { x: 0.45 } },
    // contretemps de croche — proposition
    { id: "HAT_C", label: "Charleston contretemps", timbre: "HAT_C", steps: ". . x . . . x . . . x . . . x .",
      evidence: "proposition", source: "docs/musique/kizomba.md", vel: { x: 0.5 } },
    // doubles-croches, accent sur les paires — faible (BeatKey)
    { id: "SHAKER", label: "Shaker", timbre: "SHAKER", steps: "o x o x o x o x o x o x o x o x",
      evidence: "faible", source: "BeatKey" },
    // fondamentale, quinte, levée — faible (BeatKey) ; glissando de 30 ms non rendu
    { id: "BASS", label: "Basse", timbre: "BASS", steps: "R - - - - - . . 5 - - - . . . 5",
      evidence: "faible", source: "BeatKey", voicing: "bass", params: { lowpass: 400 } },
    // nappes : instrument documenté ; accords Dm7 Gm7 A7 Dm7 à −14 dB — proposition
    { id: "PAD", label: "Nappe", timbre: "PAD", steps: "R - - - - - - - - - - - - - - -",
      evidence: "proposition", source: "nappes (Wikipédia EN) ; voicing : proposition", voicing: "chord", octave: 1, gainDb: -14 },
    // guitare claire en arpèges sur 2, 6, 10, 14 à −18 dB — proposition
    { id: "PLUCK", label: "Guitare arpèges", timbre: "PLUCK", steps: ". . R . . . R . . . R . . . R .",
      evidence: "proposition", source: "docs/musique/kizomba.md", voicing: "arp", octave: 2, gainDb: -18 },
  ],
  variations: {
    2: { note: "A7 : la basse ajoute la tierce (do dièse) au pas 12", evidence: "proposition",
      add: { BASS: [{ step: 12, token: "3" }] } },
    3: { note: "respiration : ni charleston ni shaker sur 12–15, rim au pas 15", evidence: "proposition",
      mute: { HAT_C: [12, 13, 14, 15], SHAKER: [12, 13, 14, 15] }, add: { RIM: [{ step: 15, token: "x" }] } },
  },
};

const semba: MusicStyle = {
  key: "semba", label: "Semba", page: "docs/musique/semba.md",
  // 2/4 : une grille = deux mesures de 2/4 ; comptage à la noire.
  bpm: { default: 120, min: 100, max: 135 }, meter: "2/4", swing: 0.15, humanizeMs: 4, velJitter: 0.08,
  tonality: "do majeur", harmony: ["C", "G7", "C", "G7"],
  tracks: [
    // ngoma grave sur chaque premier temps de 2/4 — documenté (Baratti) ; 2e temps discret (AML)
    { id: "NGOMA_L", label: "Ngoma grave", timbre: "NGOMA_L", steps: "X . . . o . . . X . . . o . . .",
      evidence: "documenté", source: "Baratti 2020 ; Arquivo da Música Luandense", vel: { X: 1, o: 0.35 } },
    // dikanza sur toutes les doubles-croches — documenté (Baratti) ; accents « galop » : proposition
    { id: "SCRAPER", label: "Dikanza (racleur)", timbre: "SCRAPER", steps: "X o o x x o o x X o o x x o o x",
      evidence: "documenté", source: "Baratti 2020 (densité) ; accents : proposition",
      vel: { X: 0.9, x: 0.9, o: 0.35 }, velJitter: 0.1, gainDb: -12, pan: 0.3 },
    // ngoma aiguë qui double les accents de la dikanza — documenté (Baratti : renforce la cellule)
    { id: "NGOMA_H", label: "Ngoma aiguë", timbre: "NGOMA_H", steps: "x . . x x . . x x . . x x . . x",
      evidence: "documenté", source: "Baratti 2020", vel: { x: 0.6 }, velJitter: 0, pan: -0.3 },
    // guitare rythmique en contretemps de croche, sons étouffés — proposition
    { id: "PLUCK", label: "Guitare rythmique", timbre: "PLUCK", steps: ". . R . . . R . . . R . . . R .",
      evidence: "proposition", source: "docs/musique/semba.md", voicing: "chord", octave: 1, gainDb: -16, params: { decay: 0.12 } },
    // guitare soliste en tierces parallèles, pas 0–7 des grilles 2 et 4 — proposition
    { id: "PLUCK_SOLO", label: "Guitare soliste", timbre: "PLUCK", steps: "R R R R R R R R . . . . . . . .",
      evidence: "proposition", source: "couleur congolaise des années 1970 (docs/musique/semba.md)",
      voicing: "thirds", octave: 2, gainDb: -18, grids: [1, 3], params: { lowpass: 4000, decay: 0.15 } },
    // basse (version années 1970 et après) — proposition
    { id: "BASS", label: "Basse", timbre: "BASS", steps: "R - - . 5 - - . R - - . 5 - . 5",
      evidence: "proposition", source: "docs/musique/semba.md", voicing: "bass" },
  ],
  variations: {
    2: { note: "dikanza improvisée : accents déplacés sur les pas 2 et 6", evidence: "proposition",
      set: { SCRAPER: "x o X x x o X x x o o x x o o x" } },
    3: { note: "break : seule la ngoma grave sur les pas 12–15", evidence: "proposition",
      muteAllExcept: { keep: ["NGOMA_L"], steps: [12, 13, 14, 15] } },
  },
};

const kompa: MusicStyle = {
  key: "kompa", label: "Kompa", page: "docs/musique/kompa.md",
  bpm: { default: 120, min: 100, max: 130 }, meter: "4/4", swing: 0, humanizeMs: 2, velJitter: 0.08,
  tonality: "fa majeur", harmony: ["C7", "F", "C7", "F"],
  tracks: [
    // grosse caisse sur 1 et 3 — faible (Haitian Music Zone)
    { id: "KICK", label: "Grosse caisse 1 et 3", timbre: "KICK", steps: "X . . . . . . . X . . . . . . .",
      evidence: "faible", source: "Haitian Music Zone", vel: { X: 0.9 } },
    // caisse ou tanbou sur 2 et 4 — faible (HMZ) ; timbre conga claquée conseillé
    { id: "TANBOU", label: "Tanbou 2 et 4", timbre: "TANBOU", steps: ". . . . X . . . . . . . X . . .",
      evidence: "faible", source: "Haitian Music Zone", vel: { X: 0.75 } },
    // cloche en croches — faible (HMZ) ; accents sur les temps : proposition
    { id: "COWBELL", label: "Cloche", timbre: "COWBELL", steps: "X . x . X . x . X . x . X . x .",
      evidence: "faible", source: "Haitian Music Zone ; accents : proposition", vel: { X: 0.7, x: 0.45 }, gainDb: -14, pan: 0.4 },
    // graj en doubles-croches légères — proposition (graj attesté, motif non)
    { id: "SCRAPER", label: "Graj", timbre: "SCRAPER", steps: "x o x o x o x o x o x o x o x o",
      evidence: "proposition", source: "graj attesté (docs/musique/kompa.md), motif proposé", vel: { x: 0.5, o: 0.25 }, gainDb: -10 },
    // tom basse — proposition pure (le « gong » n'est pas documenté)
    { id: "FLOOR_TOM", label: "Tom basse", timbre: "FLOOR_TOM", steps: ". . . . . . . x . . . . . . . x",
      evidence: "proposition", source: "docs/musique/kompa.md", vel: { x: 0.6 } },
    // basse en marche — documenté (WXPN) ; notes exactes : proposition
    { id: "BASS", label: "Basse en marche", timbre: "BASS", steps: "R - - - 3 - - - 5 - - - 6 - - -",
      evidence: "documenté", source: "WXPN (basse en marche) ; notes : proposition", voicing: "bass" },
    // guitare étouffée répétitive sur la quinte, accent sur les contretemps — proposition
    { id: "PLUCK", label: "Guitare kite'l maché", timbre: "PLUCK", steps: "R R R R R R R R R R R R R R R R",
      evidence: "proposition", source: "docs/musique/kompa.md", voicing: "fifth", octave: 2, gainDb: -16,
      stepVel: { 0: 0.35, 2: 0.35, 4: 0.35, 6: 0.35, 8: 0.35, 10: 0.35, 12: 0.35, 14: 0.35 }, vel: { note: 0.7 }, params: { decay: 0.09 } },
    // cuivres tenus sur les mesures 2 et 4 — proposition
    { id: "BRASS", label: "Cuivres", timbre: "BRASS", steps: "R - - - - - - - - - - - - - - -",
      evidence: "proposition", source: "docs/musique/kompa.md", voicing: "chord", octave: 1, gainDb: -14, grids: [1, 3] },
  ],
  variations: {
    3: { note: "tom basse en appel aux pas 13 et 14", evidence: "proposition",
      add: { FLOOR_TOM: [{ step: 13, token: "x" }, { step: 14, token: "x" }] } },
  },
};

const tarraxinha: MusicStyle = {
  key: "tarraxinha", label: "Tarraxinha", page: "docs/musique/tarraxinha.md",
  bpm: { default: 75, min: 60, max: 100 }, meter: "4/4", swing: 0, humanizeMs: 2, velJitter: 0.08,
  tonality: "la mineur", harmony: ["Am", "Am", "F", "E"],
  tracks: [
    // grosse caisse sèche — proposition
    { id: "KICK", label: "Grosse caisse", timbre: "KICK", steps: "X . . . . . . . . . x . . . . .",
      evidence: "proposition", source: "docs/musique/tarraxinha.md", vel: { X: 1, x: 0.6 }, params: { decay: 0.25 } },
    // sub qui suit la grosse caisse, ponctué — faible (Kizomba Seattle : basse lourde) ; A1 = 55 Hz
    { id: "SUB", label: "Basse sub", timbre: "SUB", steps: "R - - - - - - - . . R - - - - -",
      evidence: "faible", source: "Kizomba Seattle (basse électronique lourde)", voicing: "bass", octave: -1, gainDb: -6, params: { lowpass: 180 } },
    // claquement demi-tempo sur le temps 3 — proposition
    { id: "CLAP", label: "Claquement demi-tempo", timbre: "CLAP", steps: ". . . . . . . . X . . . . . . .",
      evidence: "proposition", source: "docs/musique/tarraxinha.md", vel: { X: 0.8 } },
    // reste du 3-3-2, clairsemé — proposition
    { id: "RIM", label: "Rimshot clairsemé", timbre: "RIM", steps: ". . . x . . x . . . . . . . x .",
      evidence: "proposition", source: "docs/musique/tarraxinha.md", vel: { x: 0.4 } },
    // charleston vide sauf en grille 3 (variation) — proposition
    { id: "HAT_C", label: "Charleston", timbre: "HAT_C", steps: ". . . . . . . . . . . . . . . .",
      evidence: "proposition", source: "docs/musique/tarraxinha.md", vel: { x: 0.3 } },
    // nappe sombre de deux sons (fondamentale et quinte) à −20 dB — proposition
    { id: "PAD", label: "Nappe sombre", timbre: "PAD", steps: "R - - - - - - - - - - - - - - -",
      evidence: "proposition", source: "docs/musique/tarraxinha.md", voicing: "dyad", octave: 1, gainDb: -20, params: { lowpass: 700 } },
  ],
  variations: {
    2: { note: "charleston sur 2, 6, 10, 14 (vélocité 0,3)", evidence: "proposition",
      set: { HAT_C: ". . x . . . x . . . x . . . x ." } },
    3: { note: "suspension : silence sur 12–15 sauf la basse tenue", evidence: "proposition",
      muteAllExcept: { keep: ["SUB"], steps: [12, 13, 14, 15] } },
  },
};

const suave: MusicStyle = {
  key: "suave", label: "Suave", page: "docs/musique/suave.md",
  // Le « suave » n'est pas un genre musical : kizomba allégée façon ghetto zouk (proposition).
  bpm: { default: 72, min: 60, max: 85 }, meter: "4/4", swing: 0.05, humanizeMs: 4, velJitter: 0.08,
  tonality: "la mineur", harmony: ["Am9", "Fmaj7", "Dm9", "E7sus4|E7"],
  tracks: [
    { id: "KICK_SOFT", label: "Grosse caisse douce", timbre: "KICK_SOFT", steps: "X . . . . . . . . . x . . . . .",
      evidence: "proposition", source: "docs/musique/suave.md", vel: { X: 0.8, x: 0.56 } },
    // 3-3-2 tronqué, doux — proposition
    { id: "RIM", label: "Rimshot doux", timbre: "RIM", steps: ". . . x . . x . . . . . . . . .",
      evidence: "proposition", source: "docs/musique/suave.md", vel: { x: 0.35 } },
    // demi-tempo très léger — proposition
    { id: "CLAP", label: "Claquement léger", timbre: "CLAP", steps: ". . . . . . . . x . . . . . . .",
      evidence: "proposition", source: "docs/musique/suave.md", vel: { x: 0.3 } },
    { id: "SHAKER", label: "Shaker rare", timbre: "SHAKER", steps: ". . o . . . o . . . o . . . o .",
      evidence: "proposition", source: "docs/musique/suave.md", vel: { o: 0.25 } },
    { id: "BASS", label: "Basse tenue", timbre: "BASS", steps: "R - - - - - - - 5 - - - - - - -",
      evidence: "proposition", source: "docs/musique/suave.md", voicing: "bass", params: { lowpass: 350 } },
    // nappe R&B de 4 sons, attaque 600 ms — proposition (influence R&B : Discovering Kizomba)
    { id: "PAD", label: "Nappe", timbre: "PAD", steps: "R - - - - - - - - - - - - - - -",
      evidence: "proposition", source: "influence R&B (Discovering Kizomba) ; voicing : proposition",
      voicing: "chord", octave: 1, gainDb: -14, params: { attack: 0.6 } },
    // piano électrique sur les pas 0 et 10 — proposition
    { id: "EPIANO", label: "Piano électrique", timbre: "EPIANO", steps: "R . . . . . . . . . R . . . . .",
      evidence: "proposition", source: "docs/musique/suave.md", voicing: "chord", octave: 1, gainDb: -18 },
  ],
  variations: {
    2: { note: "on retire le rimshot", evidence: "proposition", mute: { RIM: "all" } },
    3: { note: "pas de grosse caisse au pas 10 ; la nappe tient la fin", evidence: "proposition", mute: { KICK_SOFT: [10] } },
  },
};

const zouk: MusicStyle = {
  key: "zouk", label: "Zouk brésilien", page: "docs/musique/zouk-bresilien.md",
  // Danse sur musique de type zouk love ; le zouk antillais rapide (120–145) n'est pas joué.
  bpm: { default: 80, min: 60, max: 100 }, meter: "4/4", swing: 0, humanizeMs: 4, velJitter: 0.08,
  tonality: "mi mineur", harmony: ["Em", "C", "Am", "B7"],
  tracks: [
    // « boom » sur le temps 1 — documenté (Bath Zouk)
    { id: "KICK", label: "Grosse caisse « boom »", timbre: "KICK", steps: "X . . . . . . . . . . . . . . .",
      evidence: "documenté", source: "Bath Zouk (boom-chick-chick)", vel: { X: 0.9 } },
    // « chick-chick » sur 3 et 4 — documenté (Bath Zouk)
    { id: "RIM", label: "Rimshot « chick-chick »", timbre: "RIM", steps: ". . . . . . . . x . . . x . . .",
      evidence: "documenté", source: "Bath Zouk (boom-chick-chick)", vel: { x: 0.65 }, stepVel: { 12: 0.55 } },
    // 3-3-2 en doubles-croches — faible (Britannica lu via extraits, à vérifier)
    { id: "HAT_C", label: "Charleston 3-3-2", timbre: "HAT_C", steps: "x . . x . . x . x . . x . . x .",
      evidence: "faible", source: "Britannica « Zouk » (extraits), Wikipédia « Tresillo »", vel: { x: 0.4 } },
    // shak-shak continu, accent sur les contretemps — proposition
    { id: "SHAKER", label: "Shak-shak", timbre: "SHAKER", steps: "o o x o o o x o o o x o o o x o",
      evidence: "proposition", source: "docs/musique/zouk-bresilien.md", vel: { x: 0.5, o: 0.3 } },
    // basse qui suit le boom-chick-chick — proposition
    { id: "BASS", label: "Basse", timbre: "BASS", steps: "R - - - - - - - 5 - - - R - - -",
      evidence: "proposition", source: "docs/musique/zouk-bresilien.md", voicing: "bass" },
    // cordes (nappe) attaque 700 ms, passe-bas 2 kHz — proposition
    { id: "PAD", label: "Cordes", timbre: "PAD", steps: "R - - - - - - - - - - - - - - -",
      evidence: "proposition", source: "docs/musique/zouk-bresilien.md", voicing: "chord", octave: 1, gainDb: -14,
      params: { attack: 0.7, lowpass: 2000 } },
    // guitare nylon en arpèges de croches sur les contretemps — proposition
    { id: "PLUCK", label: "Guitare nylon", timbre: "PLUCK", steps: ". . R . . . R . . . R . . . R .",
      evidence: "proposition", source: "docs/musique/zouk-bresilien.md", voicing: "arp", octave: 2, gainDb: -18,
      params: { lowpass: 2500 } },
  ],
  variations: {
    2: { note: "variante tresillo (lent-lent-vite)", evidence: "documenté",
      set: { RIM: ". . . . . . x . . . . . x . . .", BASS: "R - - - - - 5 - - - - - R - - -" } },
    3: { note: "pas de grosse caisse ; cordes +3 dB (cambré ou vague)", evidence: "proposition",
      mute: { KICK: "all" }, gainDb: { PAD: 3 } },
  },
};

export const MUSIC_STYLES: Record<string, MusicStyle> = { kizomba, semba, kompa, tarraxinha, suave, zouk };

export function musicStyleOf(key: string): MusicStyle {
  return MUSIC_STYLES[key] ?? kizomba;
}
