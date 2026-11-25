/**
 * Exercices d'isolation seul, pieds posés (#206, lot L441 de ReCoDanse, docs/spec-isolations.md) : le cou, la poitrine
 * ou le bassin bouge seul, en boucle. Module pur (sans three.js) : il dit, à chaque temps, ce que fait la partie du corps
 * nommée, en mots de danseur ; `src/pose.ts` le pose sur le squelette.
 *
 * Élu le 24 novembre 2026 (tour 12) : amplitude moyenne ; chaque exercice enchaîne trois vitesses, du plus lent au plus
 * rapide, deux mesures chacune : deux temps par mouvement, un temps, un demi-temps ; un point marqué est posé puis tenu,
 * et fluide quand la vitesse ne le permet plus (au demi-temps). Un « mouvement » est le passage d'un point de la figure
 * au suivant, le centre compris.
 *
 * Sur la pointe des pieds, et l'exercice des talons (#216, docs/spec-pointes-talons.md) : `pointes` lève les deux talons
 * toute la boucle ; l'exercice `talons` les lève et les baisse. Élu le 25 novembre 2026 (tour 17) : les talons montent à
 * mi-hauteur, et l'exercice des talons suit les trois vitesses des autres exercices.
 *
 * Repère du danseur : il regarde vers l'avant ; « gauche » est sa gauche (+x dans le moteur). Le temps 0 est le temps 1
 * de la musique ; « sur 1 » veut dire « arrivé sur le temps 1 ».
 */

export type IsolationFamily = "cou" | "poitrine" | "bassin" | "pieds";

/** Le chemin d'un exercice dans un plan « devant / côté » sans unité (−1 à 1). */
type Form =
  /** Aller-retour sur un axe, devant (fore +1) ou à gauche (side +1) d'abord, en repassant par le centre. */
  | { kind: "allerRetour"; axis: "fore" | "side" }
  /** Demi-cercle par devant : à gauche, devant, à droite, devant (`sens` −1 : à droite d'abord). */
  | { kind: "demiCercle"; sens: 1 | -1 }
  /** Cercle marqué : devant, centre, côté, centre, derrière, centre, autre côté, centre. */
  | { kind: "cercleMarque"; sens: 1 | -1 }
  /** Cercle lié : devant, côté, derrière, autre côté, sans le centre. */
  | { kind: "cercleLie"; sens: 1 | -1 }
  /** Huit du bassin : centre, gauche, centre, droite ; chaque côté part par devant (`sens` 1) ou par derrière (−1). */
  | { kind: "huit"; sens: 1 | -1 }
  /** Les talons (#216) : en haut (fore 1), puis à plat (0). */
  | { kind: "talons" };

export interface IsolationDef {
  /** Numéro de la fiche 111 § 7 (B7′ : le huit dans l'autre sens ; C6, P7 : les demi-cercles, ajoutés au vote). */
  code: string;
  famille: IsolationFamily;
  /** Ce qu'on voit, en mots de danseur. */
  nom: string;
  form: Form;
  /** Cou, axe de côté : la tête tourne ou penche. */
  tete?: "tourne" | "penche";
}

/** Le sens 1 des cercles va devant, puis à droite ; le sens −1 devant, puis à gauche. */
export const ISOLATIONS = {
  "cou-tourne": { code: "C1", famille: "cou", nom: "La tête tourne : regarder à gauche, puis à droite", form: { kind: "allerRetour", axis: "side" }, tete: "tourne" },
  "cou-penche": { code: "C2", famille: "cou", nom: "La tête penche : l'oreille vers l'épaule gauche, puis vers la droite", form: { kind: "allerRetour", axis: "side" }, tete: "penche" },
  "cou-hoche": { code: "C3", famille: "cou", nom: "Le menton en bas, puis en haut", form: { kind: "allerRetour", axis: "fore" } },
  "cou-cercle": { code: "C4", famille: "cou", nom: "Le cercle de la tête : devant, à droite, derrière, à gauche", form: { kind: "cercleLie", sens: 1 } },
  "cou-cercle-inverse": { code: "C5", famille: "cou", nom: "Le cercle de la tête dans l'autre sens : devant, à gauche, derrière, à droite", form: { kind: "cercleLie", sens: -1 } },
  "cou-demi-cercle": { code: "C6", famille: "cou", nom: "Le demi-cercle de la tête : l'oreille gauche, le menton en bas, l'oreille droite", form: { kind: "demiCercle", sens: 1 } },
  "poitrine-avant": { code: "P1", famille: "poitrine", nom: "La poitrine devant, puis derrière", form: { kind: "allerRetour", axis: "fore" } },
  "poitrine-cote": { code: "P2", famille: "poitrine", nom: "La poitrine glisse à gauche, puis à droite", form: { kind: "allerRetour", axis: "side" } },
  "poitrine-cercle-marque": { code: "P3", famille: "poitrine", nom: "Le cercle de la poitrine marqué : devant, droite, derrière, gauche, en repassant par le centre", form: { kind: "cercleMarque", sens: 1 } },
  "poitrine-cercle-lie": { code: "P4", famille: "poitrine", nom: "Le cercle de la poitrine lié : devant, droite, derrière, gauche", form: { kind: "cercleLie", sens: 1 } },
  "poitrine-cercle-marque-inverse": { code: "P5", famille: "poitrine", nom: "Le cercle de la poitrine marqué dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleMarque", sens: -1 } },
  "poitrine-cercle-lie-inverse": { code: "P6", famille: "poitrine", nom: "Le cercle de la poitrine lié dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleLie", sens: -1 } },
  "poitrine-demi-cercle": { code: "P7", famille: "poitrine", nom: "Le demi-cercle de la poitrine : à gauche, devant, à droite", form: { kind: "demiCercle", sens: 1 } },
  "bassin-bascule": { code: "B1", famille: "bassin", nom: "Le bassin bascule : avant, puis arrière", form: { kind: "allerRetour", axis: "fore" } },
  "bassin-cote": { code: "B2", famille: "bassin", nom: "Le bassin glisse à gauche, puis à droite, le poids sur les deux pieds", form: { kind: "allerRetour", axis: "side" } },
  "bassin-cercle-marque": { code: "B3", famille: "bassin", nom: "Le cercle du bassin marqué : devant, droite, derrière, gauche, en repassant par le centre", form: { kind: "cercleMarque", sens: 1 } },
  "bassin-cercle-lie": { code: "B4", famille: "bassin", nom: "Le cercle du bassin lié : devant, droite, derrière, gauche", form: { kind: "cercleLie", sens: 1 } },
  "bassin-cercle-marque-inverse": { code: "B5", famille: "bassin", nom: "Le cercle du bassin marqué dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleMarque", sens: -1 } },
  "bassin-cercle-lie-inverse": { code: "B6", famille: "bassin", nom: "Le cercle du bassin lié dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleLie", sens: -1 } },
  "bassin-huit": { code: "B7", famille: "bassin", nom: "Le huit du bassin : chaque côté part par devant et revient par derrière", form: { kind: "huit", sens: 1 } },
  "bassin-huit-inverse": { code: "B7′", famille: "bassin", nom: "Le huit du bassin dans l'autre sens : chaque côté part par derrière et revient par devant", form: { kind: "huit", sens: -1 } },
  // #216 : les mollets et l'équilibre.
  "talons": { code: "T1", famille: "pieds", nom: "Les talons : monter sur la pointe des pieds, puis redescendre à plat", form: { kind: "talons" } },
} satisfies Record<string, IsolationDef>;

export type IsolationId = keyof typeof ISOLATIONS;
export const ISOLATION_IDS = Object.keys(ISOLATIONS) as IsolationId[];

export const isIsolationId = (s: string | null | undefined): s is IsolationId => !!s && Object.prototype.hasOwnProperty.call(ISOLATIONS, s);

/** Les trois vitesses, du plus lent au plus rapide : temps par mouvement (élu le 24 novembre). */
export const ISOLATION_SPEEDS = [2, 1, 0.5] as const;
/** Une vitesse dure deux mesures (huit temps), ou le tour entier de la figure s'il est plus long. */
export const ISOLATION_STAGE_BEATS = 8;
/** Part d'un mouvement tenue sur le point où il arrive, aux vitesses où le point est posé (deux temps, un temps). */
export const ISOLATION_TENUE = 0.35;

const DEG = Math.PI / 180;
/** Amplitudes (rad, m), élues moyennes le 24 novembre ; jamais montrées au danseur. */
export const ISOLATION_AMPLITUDES = {
  cou: { turn: 50 * DEG, tilt: 30 * DEG, down: 30 * DEG, up: 20 * DEG, circleDown: 25 * DEG, circleSide: 25 * DEG, circleUp: 15 * DEG },
  poitrine: { fore: 0.05, back: 0.04, side: 0.05 },
  bassin: {
    /** Bascule : le pubis avance (avant), les fesses sortent (arrière). */
    forward: 10 * DEG, back: 12 * DEG,
    /** Glissé de côté, et la hanche du côté où va le bassin qui remonte. */
    side: 0.05, hike: 4 * DEG,
    /** Cercles : glissé devant et derrière, avec la bascule. */
    circleFore: 0.04, circleForward: 8 * DEG, circleBack: 10 * DEG,
    /** Huit : glissé de côté et en profondeur ; quand il tourne, la hanche de devant mène. */
    eightSide: 0.05, eightFore: 0.03, eightTurn: 10 * DEG,
  },
} as const;
/** La tête penche et hoche autour de la base du cou, à cette distance (m) sous le nœud de la tête (le haut du cou) ;
 * elle tourne en haut du cou. */
export const NECK_PIVOT = 0.07;
/** #216 : la rotation du pied (rad) quand les talons sont levés, autour de l'avant-pied : à mi-hauteur (talon à 9 cm du
 * sol), élue le 25 novembre 2026. Le pied du squelette est d'un bloc : au-delà de la mi-hauteur il tiendrait sur le bout
 * des orteils. */
export const ISOLATION_HEEL = 25 * DEG;
/** Genoux souples pendant un exercice (rad) : ni tendus, ni pliés en danse. Le plancher de flexion de toutes les danses
 * (#203, règle R43 : 30°, `KNEE_FLOOR` dans src/pose.ts) le relève : les genoux tiennent ce minimum. */
export const ISOLATION_KNEE = 0.2;

export interface IsolationSettings {
  /** Huit du bassin : élu le 25 novembre 2026, il alterne, une mesure où il glisse, une mesure où il tourne aussi (la
   * hanche de devant mène), en commençant par glisser. `glisse` et `tourne` : l'un des deux seulement. */
  huit: "alterne" | "glisse" | "tourne";
  /** Gauche et droite échangés : l'exercice vu comme dans le miroir d'un studio. */
  miroir: boolean;
  /** #216 : l'exercice sur la pointe des pieds, les deux talons levés toute la boucle (sans effet sur l'exercice des
   * talons, qui les lève et les baisse de lui-même). */
  pointes: boolean;
}
export const ISOLATION_DEFAULT: IsolationSettings = { huit: "alterne", miroir: false, pointes: false };

/** Les réglages d'un exercice depuis l'adresse : le comportement élu, le miroir, la pointe des pieds. */
export function isolationSettings(asked: { miroir?: boolean; pointes?: boolean } = {}): IsolationSettings {
  return { ...ISOLATION_DEFAULT, miroir: !!asked.miroir, pointes: !!asked.pointes };
}

/** Points (mouvements) d'un tour de la figure. */
const POINTS: Record<Form["kind"], number> = { allerRetour: 4, demiCercle: 4, cercleMarque: 8, cercleLie: 4, huit: 4, talons: 2 };
const formOf = (id: IsolationId): Form => (ISOLATIONS[id] as IsolationDef).form;

/** Durée (temps) de chaque vitesse d'un exercice : deux mesures, ou un tour entier de la figure s'il est plus long ;
 * toujours un nombre entier de tours, pour que chaque vitesse commence au premier point de la figure. */
export function isolationStages(id: IsolationId): number[] {
  const n = POINTS[formOf(id).kind];
  return ISOLATION_SPEEDS.map(speed => speed * n * Math.ceil(ISOLATION_STAGE_BEATS / (speed * n)));
}
/** Durée de la boucle d'un exercice (temps) : ses trois vitesses. */
export const isolationBeats = (id: IsolationId): number => isolationStages(id).reduce((a, b) => a + b, 0);

const mod = (x: number, n: number) => ((x % n) + n) % n;

/** La vitesse jouée au temps `beat` : son rang (0 lent, 1, 2 rapide), son début, sa durée, ses temps par mouvement, et
 * le nombre de mouvements faits depuis son début. */
export function isolationStage(id: IsolationId, beat: number) {
  const stages = isolationStages(id), t = mod(beat, isolationBeats(id));
  let start = 0, k = 0;
  while (k < stages.length - 1 && t >= start + stages[k]) { start += stages[k]; k++; }
  const speed = ISOLATION_SPEEDS[k];
  return { stage: k, start, beats: stages[k], speed, moves: (t - start) / speed };
}

const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
type P = { fore: number; side: number };
const C: P = { fore: 0, side: 0 };
/** Sur des points visités un par mouvement : arrivé sur le point, tenu `tenue` du mouvement, puis on part vers le
 * suivant sans à-coup (vitesse et accélération nulles aux points). */
function waypoints(moves: number, points: P[], tenue: number): P {
  const t = mod(moves, points.length), k = Math.floor(t), u = t - k;
  const from = points[k], to = points[(k + 1) % points.length];
  const e = u <= tenue ? 0 : smoother((u - tenue) / (1 - tenue));
  return { fore: from.fore + (to.fore - from.fore) * e, side: from.side + (to.side - from.side) * e };
}

/** Le chemin sans unité d'un exercice au temps `beat` (avant le miroir). Aux vitesses lentes chaque point est posé puis
 * tenu ; au demi-temps le mouvement est fluide : il passe par les points sans s'y arrêter. */
export function isolationPath(id: IsolationId, beat: number): P {
  const f = formOf(id), { speed, moves } = isolationStage(id, beat);
  const fluid = speed < 1;
  switch (f.kind) {
    case "allerRetour":
    case "demiCercle": {
      // u : +1 au premier point, 0 au centre (ou devant, pour le demi-cercle), −1 à l'autre point.
      const u = fluid ? Math.cos(Math.PI * moves / 2)
        : waypoints(moves, [{ fore: 1, side: 0 }, C, { fore: -1, side: 0 }, C], ISOLATION_TENUE).fore;
      if (f.kind === "demiCercle") {
        const a = (Math.PI / 2) * u * f.sens;
        return { fore: Math.cos(a), side: Math.sin(a) };
      }
      return f.axis === "fore" ? { fore: u, side: 0 } : { fore: 0, side: u };
    }
    case "cercleMarque": {
      const side = -f.sens, dirs: P[] = [{ fore: 1, side: 0 }, { fore: 0, side }, { fore: -1, side: 0 }, { fore: 0, side: -side }];
      if (!fluid) return waypoints(moves, [dirs[0], C, dirs[1], C, dirs[2], C, dirs[3], C], ISOLATION_TENUE);
      // Fluide : chaque point est un aller-retour depuis le centre, sans arrêt ni au point ni au centre.
      const q = mod(moves + 1, 8), k = Math.floor(q / 2), w = q - 2 * k, a = Math.sin(Math.PI * w / 2);
      return { fore: dirs[k].fore * a, side: dirs[k].side * a };
    }
    case "cercleLie": {
      const phase = 2 * Math.PI * moves / 4;
      return { fore: Math.cos(phase), side: -f.sens * Math.sin(phase) };
    }
    case "huit": {
      const phase = 2 * Math.PI * moves / 4;
      return { fore: f.sens * Math.sin(2 * phase), side: Math.sin(phase) };
    }
    case "talons": {
      // En haut sur 1, à plat sur 3 (deux temps par mouvement) ; au demi-temps, sans s'arrêter.
      const u = fluid ? (1 + Math.cos(Math.PI * moves)) / 2 : waypoints(moves, [{ fore: 1, side: 0 }, C], ISOLATION_TENUE).fore;
      return { fore: u, side: 0 };
    }
  }
}

/** Ce que fait le corps à un temps : seule la partie de l'exercice est non nulle. */
export interface IsolationPose {
  /** Tête (rad), par rapport à la poitrine : `nod` + = menton en bas ; `turn` + = regarder à gauche ; `tilt` + = oreille
   * vers l'épaule gauche. */
  head: { nod: number; turn: number; tilt: number };
  /** Cage thoracique (m), glissée sans tourner : `fore` + = devant ; `side` + = à gauche. */
  chest: { fore: number; side: number };
  /** Bassin : glissé (m, `fore` devant, `side` à gauche) ; `tilt` (rad) + = le pubis avance, − = les fesses sortent ;
   * `hike` (rad) + = la hanche gauche remonte ; `turn` (rad) + = le bassin tourne vers la gauche. */
  pelvis: { fore: number; side: number; tilt: number; hike: number; turn: number };
  /** #216 : les deux pieds tournent autour de leur avant-pied, talon levé (rad, 0 à plat). */
  heel: number;
  /** Le chemin sans unité (−1 à 1) : devant et côté (+ = gauche). Sert aux tests et aux légendes. */
  path: { fore: number; side: number };
}

/** Le maximum de côté × profondeur sur le huit (sin φ · sin 2φ), pour que la rotation du huit qui tourne atteigne
 * son amplitude. */
const EIGHT_TURN_MAX = 4 / (3 * Math.sqrt(3));

/** Ce que fait le corps au temps `beat` de l'exercice `id`, en boucle (`isolationBeats(id)` temps). */
export function isolationAt(id: IsolationId, beat: number, s: IsolationSettings = ISOLATION_DEFAULT): IsolationPose {
  const def: IsolationDef = ISOLATIONS[id];
  const raw = isolationPath(id, beat);
  const path = { fore: raw.fore + 0, side: s.miroir ? -raw.side + 0 : raw.side + 0 };
  const pose: IsolationPose = {
    head: { nod: 0, turn: 0, tilt: 0 }, chest: { fore: 0, side: 0 },
    pelvis: { fore: 0, side: 0, tilt: 0, hike: 0, turn: 0 }, path, heel: 0,
  };
  const { fore, side } = path;
  const signed = (v: number, plus: number, minus: number) => (v >= 0 ? plus : minus) * v;
  const f = def.form;
  if (def.famille === "cou") {
    const A = ISOLATION_AMPLITUDES.cou;
    if (f.kind === "cercleLie" || f.kind === "demiCercle") {
      pose.head.nod = signed(fore, A.circleDown, A.circleUp);
      // Sur le côté droit du cercle, l'oreille droite descend vers l'épaule droite.
      pose.head.tilt = A.circleSide * side;
    } else if (def.tete === "tourne") pose.head.turn = A.turn * side;
    else if (def.tete === "penche") pose.head.tilt = A.tilt * side;
    else pose.head.nod = signed(fore, A.down, A.up);
  } else if (def.famille === "poitrine") {
    const A = ISOLATION_AMPLITUDES.poitrine;
    pose.chest = { fore: signed(fore, A.fore, A.back), side: A.side * side };
  } else if (def.famille === "pieds") {
    pose.heel = ISOLATION_HEEL * fore;
  } else {
    const A = ISOLATION_AMPLITUDES.bassin;
    if (f.kind === "allerRetour" && f.axis === "fore") pose.pelvis.tilt = signed(fore, A.forward, A.back);
    else if (f.kind === "allerRetour") pose.pelvis = { ...pose.pelvis, side: A.side * side, hike: A.hike * side };
    else if (f.kind === "huit") {
      pose.pelvis = { ...pose.pelvis, side: A.eightSide * side, fore: A.eightFore * fore, hike: A.hike * side };
      // La hanche de devant mène : à gauche et devant, la hanche gauche avance (le bassin tourne vers la droite) ; à
      // gauche et derrière, elle recule. En alternance, une mesure sur deux (la deuxième) : chaque mesure commence et
      // finit au centre, où la rotation et sa vitesse sont nulles, le passage d'une manière à l'autre est donc sans à-coup.
      const turning = s.huit === "tourne" || (s.huit === "alterne" && Math.floor(mod(beat, isolationBeats(id)) / 4) % 2 === 1);
      if (turning) pose.pelvis.turn = -A.eightTurn * side * fore / EIGHT_TURN_MAX;
    } else {
      pose.pelvis = { fore: A.circleFore * fore, side: A.side * side, tilt: signed(fore, A.circleForward, A.circleBack),
        hike: A.hike * side, turn: 0 };
    }
  }
  // #216 : sur la pointe des pieds, les talons levés toute la boucle.
  if (s.pointes && def.famille !== "pieds") pose.heel = ISOLATION_HEEL;
  return pose;
}
