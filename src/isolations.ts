/**
 * Exercices d'isolation seul, pieds posés (#206, lot L441 de ReCoDanse, docs/spec-isolations.md) : le cou, la poitrine
 * ou le bassin bouge seul, sur un huit (8 temps) qui boucle. Module pur (sans three.js) : il dit, à chaque temps, ce que
 * fait la partie du corps nommée, en mots de danseur ; `src/pose.ts` le pose sur le squelette.
 *
 * Repère du danseur : il regarde vers l'avant ; « gauche » est sa gauche (+x dans le moteur). Le temps 0 est le temps 1
 * de la musique ; « sur 1 » veut dire « arrivé sur le temps 1 ».
 */

export type IsolationFamily = "cou" | "poitrine" | "bassin";

/** Le chemin d'un exercice dans un plan « devant / côté » sans unité (−1 à 1). */
type Form =
  /** Aller-retour sur un axe, `first` d'abord (devant = fore +1, gauche = side +1). */
  | { kind: "allerRetour"; axis: "fore" | "side" }
  /** Cercle marqué : devant, centre, côté, centre, derrière, centre, autre côté, centre (un point par temps). */
  | { kind: "cercleMarque"; sens: 1 | -1 }
  /** Cercle lié : un tour par huit, devant sur 1, côté sur 3, derrière sur 5, autre côté sur 7. */
  | { kind: "cercleLie"; sens: 1 | -1 }
  /** Huit du bassin, un par huit : chaque côté part par devant (`sens` 1) ou par derrière (−1). */
  | { kind: "huit"; sens: 1 | -1 };

export interface IsolationDef {
  /** Numéro de la fiche 111 § 7 (B7′ : le huit dans l'autre sens). */
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
  "poitrine-avant": { code: "P1", famille: "poitrine", nom: "La poitrine devant, puis derrière", form: { kind: "allerRetour", axis: "fore" } },
  "poitrine-cote": { code: "P2", famille: "poitrine", nom: "La poitrine glisse à gauche, puis à droite", form: { kind: "allerRetour", axis: "side" } },
  "poitrine-cercle-marque": { code: "P3", famille: "poitrine", nom: "Le cercle de la poitrine marqué : devant, droite, derrière, gauche, en repassant par le centre", form: { kind: "cercleMarque", sens: 1 } },
  "poitrine-cercle-lie": { code: "P4", famille: "poitrine", nom: "Le cercle de la poitrine lié : devant, droite, derrière, gauche", form: { kind: "cercleLie", sens: 1 } },
  "poitrine-cercle-marque-inverse": { code: "P5", famille: "poitrine", nom: "Le cercle de la poitrine marqué dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleMarque", sens: -1 } },
  "poitrine-cercle-lie-inverse": { code: "P6", famille: "poitrine", nom: "Le cercle de la poitrine lié dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleLie", sens: -1 } },
  "bassin-bascule": { code: "B1", famille: "bassin", nom: "Le bassin bascule : avant, puis arrière", form: { kind: "allerRetour", axis: "fore" } },
  "bassin-cote": { code: "B2", famille: "bassin", nom: "Le bassin glisse à gauche, puis à droite, le poids sur les deux pieds", form: { kind: "allerRetour", axis: "side" } },
  "bassin-cercle-marque": { code: "B3", famille: "bassin", nom: "Le cercle du bassin marqué : devant, droite, derrière, gauche, en repassant par le centre", form: { kind: "cercleMarque", sens: 1 } },
  "bassin-cercle-lie": { code: "B4", famille: "bassin", nom: "Le cercle du bassin lié : devant, droite, derrière, gauche", form: { kind: "cercleLie", sens: 1 } },
  "bassin-cercle-marque-inverse": { code: "B5", famille: "bassin", nom: "Le cercle du bassin marqué dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleMarque", sens: -1 } },
  "bassin-cercle-lie-inverse": { code: "B6", famille: "bassin", nom: "Le cercle du bassin lié dans l'autre sens : devant, gauche, derrière, droite", form: { kind: "cercleLie", sens: -1 } },
  "bassin-huit": { code: "B7", famille: "bassin", nom: "Le huit du bassin : chaque côté part par devant et revient par derrière", form: { kind: "huit", sens: 1 } },
  "bassin-huit-inverse": { code: "B7′", famille: "bassin", nom: "Le huit du bassin dans l'autre sens : chaque côté part par derrière et revient par devant", form: { kind: "huit", sens: -1 } },
} satisfies Record<string, IsolationDef>;

export type IsolationId = keyof typeof ISOLATIONS;
export const ISOLATION_IDS = Object.keys(ISOLATIONS) as IsolationId[];
/** Un exercice dure un huit. */
export const ISOLATION_BEATS = 8;

export const isIsolationId = (s: string | null | undefined): s is IsolationId => !!s && Object.prototype.hasOwnProperty.call(ISOLATIONS, s);

const DEG = Math.PI / 180;
/** Amplitudes moyennes (rad, m), à élire (docs/spec-isolations.md) ; jamais montrées au danseur. */
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
    /** Huit : glissé de côté et en profondeur ; candidat « tourne » : la hanche de devant mène. */
    eightSide: 0.05, eightFore: 0.03, eightTurn: 10 * DEG,
  },
} as const;
/** Petit, moyen, grand : facteurs de l'amplitude moyenne (candidats à élire). */
export const AMPLITUDE_LEVELS = { petit: 0.6, moyen: 1, grand: 1.5 } as const;
/** La tête penche et hoche autour de la base du cou, à cette distance (m) sous le nœud de la tête (le haut du cou) ;
 * elle tourne en haut du cou. */
export const NECK_PIVOT = 0.07;
/** Genoux souples pendant un exercice (rad) : ni tendus, ni pliés en danse. */
export const ISOLATION_KNEE = 0.2;

export interface IsolationSettings {
  /** Facteur de l'amplitude moyenne, par famille. */
  amplitude: Record<IsolationFamily, number>;
  /** Allers-retours de la poitrine et du bassin : un point par temps en repassant par le centre (`centre`), deux temps
   * par point (`deuxTemps`), ou un côté par temps sans s'arrêter au centre (`continu`). Le cou garde deux temps par point. */
  rythme: "centre" | "deuxTemps" | "continu";
  /** Part du temps tenue sur un point marqué, avant de partir vers le suivant (0 : fluide). */
  tenue: number;
  /** Huit du bassin : il glisse, ou il tourne aussi (la hanche de devant mène). */
  huit: "glisse" | "tourne";
  /** Gauche et droite échangés : l'exercice vu comme dans le miroir d'un studio. */
  miroir: boolean;
}
export const ISOLATION_TENUE = 0.35;
export const ISOLATION_DEFAULT: IsolationSettings = {
  amplitude: { cou: 1, poitrine: 1, bassin: 1 }, rythme: "centre", tenue: ISOLATION_TENUE, huit: "glisse", miroir: false,
};

/** Les interrupteurs d'essai des candidats (src/essais.ts), à retirer après le vote. */
export const ISOLATION_ESSAIS = [
  "isoCouPetit", "isoCouGrand", "isoPoitrinePetit", "isoPoitrineGrand", "isoBassinPetit", "isoBassinGrand",
  "isoDeuxTemps", "isoContinu", "isoFluide", "isoHuitTourne",
] as const;
export type IsolationEssai = typeof ISOLATION_ESSAIS[number];

/** Les réglages d'un exercice : la proposition, sauf les candidats demandés par `?essai=`. */
export function isolationSettings(active: (essai: IsolationEssai) => boolean, miroir = false): IsolationSettings {
  const level = (petit: IsolationEssai, grand: IsolationEssai) =>
    active(petit) ? AMPLITUDE_LEVELS.petit : active(grand) ? AMPLITUDE_LEVELS.grand : AMPLITUDE_LEVELS.moyen;
  return {
    amplitude: { cou: level("isoCouPetit", "isoCouGrand"), poitrine: level("isoPoitrinePetit", "isoPoitrineGrand"), bassin: level("isoBassinPetit", "isoBassinGrand") },
    rythme: active("isoDeuxTemps") ? "deuxTemps" : active("isoContinu") ? "continu" : "centre",
    tenue: active("isoFluide") ? 0 : ISOLATION_TENUE,
    huit: active("isoHuitTourne") ? "tourne" : "glisse",
    miroir,
  };
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
  /** Le chemin sans unité (−1 à 1) : devant et côté (+ = gauche). Sert aux tests et aux légendes. */
  path: { fore: number; side: number };
}

const mod = (x: number, n: number) => ((x % n) + n) % n;
const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);

type P = { fore: number; side: number };
const C: P = { fore: 0, side: 0 };
/** Sur des points visités tous les `step` temps : arrivé sur le point au temps, tenu `tenue` du pas, puis on part vers le
 * suivant sans à-coup (vitesse et accélération nulles aux points). */
function waypoints(beat: number, points: P[], step: number, tenue: number): P {
  const t = mod(beat, points.length * step) / step, k = Math.floor(t), u = t - k;
  const from = points[k], to = points[(k + 1) % points.length];
  const e = u <= tenue ? 0 : smoother((u - tenue) / (1 - tenue));
  return { fore: from.fore + (to.fore - from.fore) * e, side: from.side + (to.side - from.side) * e };
}

/** Le chemin sans unité d'un exercice au temps `beat` (avant le miroir). */
export function isolationPath(id: IsolationId, beat: number, s: IsolationSettings = ISOLATION_DEFAULT): P {
  const def: IsolationDef = ISOLATIONS[id];
  const f = def.form;
  const phase = 2 * Math.PI * mod(beat, ISOLATION_BEATS) / ISOLATION_BEATS;
  switch (f.kind) {
    case "allerRetour": {
      const a: P = f.axis === "fore" ? { fore: 1, side: 0 } : { fore: 0, side: 1 };
      const b: P = { fore: -a.fore, side: -a.side };
      const rythme = def.famille === "cou" ? "deuxTemps" : s.rythme;
      if (rythme === "continu") {
        const c = Math.cos(Math.PI * beat);
        return { fore: a.fore * c, side: a.side * c };
      }
      return waypoints(beat, [a, C, b, C], rythme === "deuxTemps" ? 2 : 1, s.tenue);
    }
    case "cercleMarque": {
      const side = -f.sens;
      return waypoints(beat, [{ fore: 1, side: 0 }, C, { fore: 0, side }, C, { fore: -1, side: 0 }, C, { fore: 0, side: -side }, C], 1, s.tenue);
    }
    case "cercleLie":
      return { fore: Math.cos(phase), side: -f.sens * Math.sin(phase) };
    case "huit":
      return { fore: f.sens * Math.sin(2 * phase), side: Math.sin(phase) };
  }
}

/** Le maximum de côté × profondeur sur le huit (sin φ · sin 2φ), pour que la rotation du candidat « tourne » atteigne
 * son amplitude. */
const EIGHT_TURN_MAX = 4 / (3 * Math.sqrt(3));

/** Ce que fait le corps au temps `beat` de l'exercice `id`. Fonction de période 8 temps. */
export function isolationAt(id: IsolationId, beat: number, s: IsolationSettings = ISOLATION_DEFAULT): IsolationPose {
  const def: IsolationDef = ISOLATIONS[id];
  const raw = isolationPath(id, beat, s);
  const path = { fore: raw.fore + 0, side: s.miroir ? -raw.side + 0 : raw.side + 0 };
  const pose: IsolationPose = {
    head: { nod: 0, turn: 0, tilt: 0 }, chest: { fore: 0, side: 0 },
    pelvis: { fore: 0, side: 0, tilt: 0, hike: 0, turn: 0 }, path,
  };
  const k = s.amplitude[def.famille];
  const { fore, side } = path;
  const signed = (v: number, plus: number, minus: number) => (v >= 0 ? plus : minus) * v;
  if (def.famille === "cou") {
    const A = ISOLATION_AMPLITUDES.cou;
    if (def.form.kind === "cercleLie") {
      pose.head.nod = k * signed(fore, A.circleDown, A.circleUp);
      // Sur le côté droit du cercle, l'oreille droite descend vers l'épaule droite.
      pose.head.tilt = k * A.circleSide * side;
    } else if (def.tete === "tourne") pose.head.turn = k * A.turn * side;
    else if (def.tete === "penche") pose.head.tilt = k * A.tilt * side;
    else pose.head.nod = k * signed(fore, A.down, A.up);
  } else if (def.famille === "poitrine") {
    const A = ISOLATION_AMPLITUDES.poitrine;
    pose.chest = { fore: k * signed(fore, A.fore, A.back), side: k * A.side * side };
  } else {
    const A = ISOLATION_AMPLITUDES.bassin;
    const f = def.form;
    if (f.kind === "allerRetour" && f.axis === "fore") pose.pelvis.tilt = k * signed(fore, A.forward, A.back);
    else if (f.kind === "allerRetour") pose.pelvis = { ...pose.pelvis, side: k * A.side * side, hike: k * A.hike * side };
    else if (f.kind === "huit") {
      pose.pelvis = { ...pose.pelvis, side: k * A.eightSide * side, fore: k * A.eightFore * fore, hike: k * A.hike * side };
      // La hanche de devant mène : à gauche et devant, la hanche gauche avance (le bassin tourne vers la droite) ; à
      // gauche et derrière, elle recule.
      if (s.huit === "tourne") pose.pelvis.turn = -k * A.eightTurn * side * fore / EIGHT_TURN_MAX;
    } else {
      pose.pelvis = { fore: k * A.circleFore * fore, side: k * A.side * side, tilt: k * signed(fore, A.circleForward, A.circleBack),
        hike: k * A.hike * side, turn: 0 };
    }
  }
  return pose;
}
