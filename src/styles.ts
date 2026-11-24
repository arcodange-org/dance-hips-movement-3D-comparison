import { TAU, S1, S2, S4, pos, HIP_WIDTH, type RigHandle } from "./anatomy";
import { TORSO_JOINTS } from "./rigJoints";

export interface StyleDef {
  label: string;
  color: string;
  bullets: string[];
  // Phase 15 — posture propre à la danse (sources docs/posture-contraposition.md) :
  // lean = inclinaison du buste vers l'avant (rad, négatif = cambré/arrière), knee = flexion
  // de base des genoux (rad). Kizomba/tarraxinha : buste légèrement en avant + genoux bien
  // fléchis (« lean slightly forward », « slightly bent knees », SOS Dance) ; zouk = cambré.
  posture: { lean: number; knee: number };
  /** `w` (#42): beat of the slow 4-beat waves (suave, zouk), kept on the clock when the ginga drives `b`.
   * `base` (#161, #162): the dancer dances the style's basic step alone, on the spot, feet planted; there
   * the kompa and the semba dance the step elected on 23 Nov. 2026, elsewhere (figures in pair, travel, the
   * rendering without the leg solver) the model of before the votes. */
  apply: (r: RigHandle, b: number, a: number, w?: number, base?: boolean) => void;
  // Charge sur le pied DROIT dans [-1, 1] (+1 = plein appui droit, -1 = plein appui gauche).
  // Sert à la visualisation des appuis (pastilles de charge, chaîne pied→genou→hanche).
  // Côté droit du rig à x < 0 : un déplacement root.x > 0 = appui qui passe à gauche.
  support?: (b: number, base?: boolean) => number;
}

// Courbes f(temps) issues des sources documentées dans docs/styles-de-danse.md :
// kizomba = « 2 temps » latéral sur place avec marqua (pieds joints), pas ≤ largeur
// du bassin ; kompa = sur place, un appui par temps (#195), la hanche
// qui s'assoit (pas élu, #161) ; semba = un rebond par temps et son double rebond (pas
// élu, #162) ; en couple et en déplacement, leurs modèles d'avant ; tarraxinha = sur
// place, isolations du bassin ; suave = « 8 » au sol + talon levé + vague L5→tête ;
// zouk = basic sur place (slow-quick-quick) + cambré + ouverture de hanche.
// En mode Face à face, les « sorties garçon / fille » (5 temps, aller-retour latéral)
// sont ajoutées par le rig (voir sortie dans Rig.tsx).


/** #62: kompa support (+1 = full right), period 4 beats: the weight moves to the left foot over the
 * 0.4 beat before beat 1, holds through the touch on 2, moves to the right foot before beat 3 and holds
 * through 4. `b` is the motion beat (clock − 0,5). */
export const KOMPA = { transition: 0.4 };
/** #161, #159 (owner, 22 Nov.: « Le konpa est complètement faux actuellement: c'est le 8 le plus prononcé
 * justement » ; docs/spec-ginga-huit.md): PROTOTYPES of the kompa's « 8 », to elect, off by default
 * (`?kompa=huit|huitGrand|huitInverse`). Source (Jasmin's teachers' manual, quoted by Le Nouvelliste, see
 * docs/recherche-danse/kompa.md on the research branch): at the slow rhythm, « on dessine un demi 8 avec
 * le bassin sur chaque appui », the hip going from the front to the back by the side.
 * `depth` (m): how far the pelvis goes forward then back on each support; `round` (0 to 1): the lateral
 * path leaves the hold-then-cross of today for a continuous swing; `sense` (−1: back first).
 * `knees` (vote of 22 Nov.: K2 « looks like skiing », the knees bend in turn and overlap as in the other
 * dances): the free leg's knee bends while the supporting one straightens (`swing` rad on top of today's
 * flexion), `lag` (share of the 4-beat cycle) after the lateral swing; the pelvis tilts with them (`tilt`
 * rad of roll per rad of difference between the knees), instead of tilting with the swing. Measured on the
 * model (23 Nov.): a POSITIVE `tilt` lifts the hip of the leg asked to bend, so the leg solver straightens
 * that leg and bends the supporting one instead (`genoux` to `profilFort`, as filmed and voted: both knees
 * past 45°, the supporting leg the more bent); a NEGATIVE `tilt` drops the hip of the bent knee, which is
 * what the legs need to alternate.
 * `glide` (third round, vote: still « skiing », the « 8 » seen from the front must be larger than seen from
 * above): share of today's lateral glide of the whole body kept (1 = today); the hips then carry the 8.
 * Fifth round (vote for KG3: now the « 8 » seen from the side; too much knee; the buttocks also go a little
 * back; the lower body more isolated from the upper body). `depthLag` (share of the cycle): the
 * forward-and-back follows the hips' rise and fall, so that each hip draws an « 8 » seen from the side
 * (without it the two cancel into an arc). `back`: the pelvis sits back by `reach` (m) and tips forward by
 * up to `pitch` (rad), most when it is at the back. `iso` (0 to 1): share of the pelvis's travel (sideways
 * and forward-and-back) the spine takes up, leaning one way while the chest leans back, so the chest stays
 * above the feet and level. `lift` (m): the pelvis rides higher, the knees bend less.
 * Sixth round (vote for KG3 again: the legs must visibly alternate, one bent, the other straighter, both
 * still a little bent). `knees.base` (rad, in place of today's 0.28): flexion of the straighter leg on top
 * of the posture's; with a negative `tilt` and the pelvis at its full height (`lift` 0.06) the supporting
 * leg straightens to about 20° while the free one bends to 50° or more. `knees.heel` (rad): the free
 * foot's heel rises as its knee bends (it rests on the ball of the foot), so the pelvis rolls less.
 * `lag` 0 (`alterneDirect`): the knees cross as the weight does, the supporting leg is always the
 * straighter one, and each hip then goes up and down the same line seen from the front.
 * Seventh round (vote: none of them; the lifted free heel is right but must rise less; the attack of
 * `alterneDirect` with the return of `hanches`: the hip finishes the transfer and does not start it). Three
 * readings, all with `heel` 0.2 and `lag` 0, the phase of knees and hips bent along the cycle:
 * `knees.late` (rad, `hancheFinit`): they are behind the weight by that much as it passes the centre and in
 * step with it as it reaches the side, so the hip waits while the pelvis leaves and the weight passes, then
 * swings through and arrives with it; seen from the front each hip goes round again.
 * `knees.settle` (rad): in step from the centre to the side (the attack of `alterneDirect`), then, on the
 * way back to the centre, behind (< 0, `hancheTenue`: the hip stays up and catches up before the weight
 * passes) or ahead (> 0, `hancheAssise`: the hip sits at once and comes back low).
 * `knees.after` (rad, `hancheApres`, added once the owner said he leans towards `alterneDirect`): in step
 * with the weight as it passes the centre (knees cross with it, as in `alterneDirect`), behind it by that
 * much at the side: the hip is still finishing after the pelvis has arrived (the late finish of `hanches`),
 * and is back in step for the next passage.
 * Eighth round (vote: `hancheApres` for its flow, but the hip of the earlier rounds owed too much to
 * bachata, where it rises over a straightened leg; the kompa's hip sits). `sit`, with `lag` 0.3 so that each
 * knee is most bent on the beat its leg receives the weight: `skew` (< 0: the knee bends quickly into the
 * sit and straightens slowly, the same for the pelvis going back); `pivot` (rad): the pelvis turns, the
 * sitting hip back, under a spine that turns back by as much (the chest keeps facing front); `back` (m):
 * the pelvis goes back with each sit; `around` (rad of the cycle): the hip is furthest back that long after
 * the sit, already rising, so that it goes round seen from the side. The free heel rises only while its
 * side carries no weight. With both feet flat a knee difference of 36° would need a 30° roll of the pelvis:
 * `swing` 0.5 keeps the roll near 18° (knees from 23° to 45°).
 * Ninth round (vote: `assisMarque`; the bust may follow the pelvis, upright: it moves sideways with it and
 * pivots by a few degrees towards the hip that carries it; and it leans slightly forward, the knees must
 * not pass the bust seen from the side, rule R33). `sit.follow` (0 to 1): share of the pelvis's pivot the
 * trunk follows; `iso` 0.5: the chest travels half-way with the pelvis; `lean` (rad): forward lean of the
 * trunk from the waist; `ahead` (m): the pelvis stands forward over the feet. Measured (`posture` of
 * `scripts/tracer_hanches.mjs`, the measure of issue #166): the bust is 19 cm behind the knees today, 12.5
 * in `assisMarque`, 5 in `assisBuste` (the front of the chest level with the front of the knees), 0.6 in
 * `assisBusteAvant` (the bust above the knees). */
export interface KompaEight { depth: number; round: number; sense: number; knees?: { swing: number; lag: number; tilt: number; base?: number; heel?: number; settle?: number; late?: number; after?: number }; glide?: number;
  depthLag?: number; back?: { reach: number; pitch: number }; iso?: number; lift?: number;
  sit?: { skew: number; pivot: number; back: number; around: number; follow?: number }; lean?: number; ahead?: number }
export const KOMPA_EIGHTS: Record<string, KompaEight> = {
  huit: { depth: 0.03, round: 1, sense: 1 },
  huitGrand: { depth: 0.05, round: 1, sense: 1 },
  huitInverse: { depth: 0.03, round: 1, sense: -1 },
  genoux: { depth: 0.05, round: 1, sense: 1, knees: { swing: 0.3, lag: 0, tilt: 0.5 } },
  genouxRond: { depth: 0.05, round: 1, sense: 1, knees: { swing: 0.3, lag: 0.125, tilt: 0.5 } },
  hanches: { depth: 0.02, round: 1, sense: 1, knees: { swing: 0.45, lag: 0.125, tilt: 0.9 }, glide: 0.5 },
  hanchesFortes: { depth: 0.02, round: 1, sense: 1, knees: { swing: 0.55, lag: 0.125, tilt: 1.2 }, glide: 0.35 },
  profil: { depth: 0.03, round: 1, sense: 1, knees: { swing: 0.3, lag: 0.125, tilt: 1.3 }, glide: 0.5, depthLag: 0.125, back: { reach: 0.03, pitch: 0.1 }, iso: 1, lift: 0.04 },
  profilFort: { depth: 0.045, round: 1, sense: 1, knees: { swing: 0.3, lag: 0.125, tilt: 1.3 }, glide: 0.5, depthLag: 0.125, back: { reach: 0.045, pitch: 0.16 }, iso: 1, lift: 0.04 },
  alterne: { depth: 0.015, round: 1, sense: 1, knees: { base: 0.08, swing: 0.6, lag: 0.125, tilt: -0.65 }, glide: 0.5, lift: 0.06 },
  alterneTalon: { depth: 0.015, round: 1, sense: 1, knees: { base: 0.08, swing: 0.7, lag: 0.125, tilt: -0.4, heel: 0.4 }, glide: 0.5, lift: 0.06 },
  alterneDirect: { depth: 0.015, round: 1, sense: 1, knees: { base: 0.08, swing: 0.6, lag: 0, tilt: -0.65 }, glide: 0.5, lift: 0.06 },
  hancheFinit: { depth: 0.015, round: 1, sense: 1, knees: { base: 0.08, swing: 0.65, lag: 0, tilt: -0.52, heel: 0.2, late: 0.785 }, glide: 0.5, lift: 0.06 },
  hancheTenue: { depth: 0.015, round: 1, sense: 1, knees: { base: 0.08, swing: 0.65, lag: 0, tilt: -0.52, heel: 0.2, settle: -0.4 }, glide: 0.5, lift: 0.06 },
  hancheAssise: { depth: 0.015, round: 1, sense: 1, knees: { base: 0.08, swing: 0.65, lag: 0, tilt: -0.52, heel: 0.2, settle: 0.4 }, glide: 0.5, lift: 0.06 },
  hancheApres: { depth: 0.015, round: 1, sense: 1, knees: { base: 0.08, swing: 0.65, lag: 0, tilt: -0.52, heel: 0.2, after: 0.785 }, glide: 0.5, lift: 0.06 },
  assis: { depth: 0, round: 1, sense: 1, knees: { base: 0.08, swing: 0.5, lag: 0.3, tilt: -0.69, heel: 0.1 }, glide: 0.5, lift: 0.06, iso: 1, sit: { skew: -0.5, pivot: 0.12, back: 0.025, around: 0.6 } },
  assisMarque: { depth: 0, round: 1, sense: 1, knees: { base: 0.08, swing: 0.5, lag: 0.3, tilt: -0.69, heel: 0.1 }, glide: 0.5, lift: 0.06, iso: 1, sit: { skew: -0.6, pivot: 0.2, back: 0.035, around: 0.6 } },
  assisBuste: { depth: 0, round: 1, sense: 1, knees: { base: 0.08, swing: 0.5, lag: 0.3, tilt: -0.69, heel: 0.1 }, glide: 0.5, lift: 0.06, iso: 0.5, sit: { skew: -0.6, pivot: 0.2, back: 0.035, around: 0.6, follow: 0.35 }, lean: 0.2, ahead: 0.03 },
  assisBusteAvant: { depth: 0, round: 1, sense: 1, knees: { base: 0.08, swing: 0.5, lag: 0.3, tilt: -0.69, heel: 0.1 }, glide: 0.5, lift: 0.06, iso: 0.5, sit: { skew: -0.6, pivot: 0.2, back: 0.035, around: 0.6, follow: 0.35 }, lean: 0.3, ahead: 0.06 },
};
/** The step elected for the kompa's basic step (nine rounds of votes, 22 and 23 Nov. 2026). */
export const KOMPA_ELECTED = "assisBuste";
/** The variant asked for by the address (`?kompa=`): undefined, none, the basic step is the elected one;
 * null (`ancien`), the model of before the votes; else one of `KOMPA_EIGHTS`. Read by the kompa style. */
export const KOMPA_PROTO: { eight: KompaEight | null | undefined } = { eight: undefined };
export const setKompaProto = (name: string | null | undefined) => {
  KOMPA_PROTO.eight = name === "ancien" ? null : name === "deuxTemps" ? KOMPA_EIGHTS[KOMPA_ELECTED] : (name && KOMPA_EIGHTS[name]) || undefined;
};
/** #195 (rule of 24 Nov. 2026, R40): the kompa is danced one beat per support, not two. Beats per weight
 * arrival of the basic step: the elected step, voted at two beats per support, keeps its poses and runs
 * twice as fast. `?kompa=deuxTemps` shows it as voted; the other variants and `ancien` keep their two beats,
 * and so does the kompa in pair and in travel (#187). */
export const KOMPA_BEATS = 1;
/** The beat on which the kompa's step is read. The step voted on 23 Nov. lands its weight on the clock's
 * beats 1 and 3 (motion beats 0.5 and 2.5); at one beat per support it is read at `2c − 1` for the clock's
 * beat `c`: the weight lands on every beat, on the left foot on the odd ones. `b`: motion beat (clock − 0.5). */
export const kompaBeat = (b: number, base?: boolean): number =>
  base && KOMPA_PROTO.eight === undefined ? 0.5 + (b - 0.5) * 2 / KOMPA_BEATS : b;
const kompaStep = (base: boolean | undefined): KompaEight | null => base ? (KOMPA_PROTO.eight === undefined ? KOMPA_EIGHTS[KOMPA_ELECTED] : KOMPA_PROTO.eight) : null;
export function kompaSupport(b: number): number {
  const c = ((((b + 0.5) % 4) + 4) % 4), d = KOMPA.transition;
  const s = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
  const toLeft = s((c - 1 + d) / d), toRight = s((c - 3 + d) / d);
  return 1 - 2 * toLeft + 2 * toRight;
}

/** #162 (the semba's double bounce; rule on the semba of 22 Nov.: a weight transfer doubled towards the same
 * side, begun towards the other side and taken back; the second bounce « like a cha-cha », a quick small
 * round of the « 8 » before the larger one resumes), built on the hip elected for the kompa on 23 Nov. (#161,
 * `assisBuste`): PROTOTYPES to elect, off by default (`?style=semba&semba=pause|parCote`).
 * The hip sits as the weight lands, on every beat (the semba's bounce: lowest on the beat), back and outwards
 * with a pivot of the pelvis; the leg then straightens slowly and the hip rises round; the bust follows the
 * pelvis and leans forward (same parameters and meaning as `KompaEight`: `swing`, `base`, `tilt`, `heel`,
 * `skew`, `pivot`, `back`, `around`, `follow`, `iso`, `lean`, `ahead`).
 * `pattern`: one entry per beat, from one sit to the next: "T" a transfer to the other foot, "D" the double
 * bounce: the weight leaves towards the other foot, does not get there and lands again on the same one, a
 * small round within the beat (see `smallRound`): the pelvis goes on to its side, comes back to about the
 * centre and turns; the other knee bends by the share `short` half-way; the leg of the bounce straightens by
 * the share `rise` only between its two landings.
 * `sway` (m): lateral travel of the pelvis each way; `dip` (rad): both knees bend that much more on each sit. */
export interface SembaSit { pattern: ("T" | "D")[]; short: number; rise: number; sway: number; dip: number; swing: number; base: number; tilt: number; heel: number;
  skew: number; pivot: number; back: number; around: number; follow: number; iso: number; lean: number; ahead: number }
const SEMBA_SIT = { short: 0.35, rise: 0.6, sway: 0.045, dip: 0.12, swing: 0.4, base: 0.08, tilt: -0.75, heel: 0.1, skew: -0.4, pivot: 0.14, back: 0.02, around: 0.6,
  follow: 0.35, iso: 0.5, lean: 0.2, ahead: 0.03 };
export const SEMBA_SITS: Record<string, SembaSit> = {
  // « one, two, three, pause » (Angola Travel Guide, docs/musique/semba.md): three transfers, then the double
  // bounce on the foot of the third step; eight beats to come back to the same foot.
  pause: { ...SEMBA_SIT, pattern: ["T", "T", "D", "T", "T", "T", "D", "T"] },
  // Two landings on each foot: every second beat is a double bounce; four beats.
  parCote: { ...SEMBA_SIT, pattern: ["D", "T", "D", "T"] },
  // No double bounce: one transfer per beat, as today, with the hip that sits.
  simple: { ...SEMBA_SIT, pattern: ["T", "T"] },
};
/** The step elected for the semba's basic step (vote of 23 Nov. 2026). */
export const SEMBA_ELECTED = "parCote";
/** The variant asked for by the address (`?semba=`), as `KOMPA_PROTO`. Read by the semba style. */
export const SEMBA_PROTO: { sit: SembaSit | null | undefined } = { sit: undefined };
export const setSembaProto = (name: string | null | undefined) => { SEMBA_PROTO.sit = name === "ancien" ? null : (name && SEMBA_SITS[name]) || undefined; };
const sembaStep = (base: boolean | undefined): SembaSit | null => base ? (SEMBA_PROTO.sit === undefined ? SEMBA_SITS[SEMBA_ELECTED] : SEMBA_PROTO.sit) : null;
/** The sit comes this long (rad of the swing) after the weight has passed the centre: as elected for the kompa. */
const SIT_AFTER = 2 * Math.PI * 0.3 - Math.PI / 2;
/** Where the semba prototype is at motion beat `b` (the sits land on the beats of the music, motion beats
 * 0,5 ; 1,5 ; …). Outside a double bounce, `theta`: the phase of the swing, half a turn per beat (the left
 * foot's sits at `SIT_AFTER` + whole turns, the pelvis furthest left at a quarter turn). Inside one, `bounce`:
 * how far through the beat (`v`, 0 to 1) and on which foot (`side`, +1 left). */
export function sembaPhase(p: SembaSit, b: number): { theta: number; bounce: { v: number; side: number } | null } {
  const n = p.pattern.length, t = (((b - 0.5) % n) + n) % n, i = Math.floor(t), v = t - i;
  let side = 1;
  for (let k = 0; k < i; k++) if (p.pattern[k] === "T") side = -side;
  return p.pattern[i] === "D" ? { theta: 0, bounce: { v, side } } : { theta: SIT_AFTER + (side > 0 ? 0 : Math.PI) + Math.PI * v, bounce: null };
}
/** The small round of a double bounce, for a signal that swings to +1 on the side of the bounce: it leaves the
 * sit with the value `s0` and the speed `d0` (per beat) it has there in the plain swing, reaches +1 once, comes
 * back part of the way and is at the sit again one beat later with the same value and speed: one sine of one
 * beat, so that nothing jolts where the bounce joins the swing. */
const smallRound = (s0: number, d0: number, v: number) => {
  const phi = 2 * Math.atan2(2 * Math.PI * (1 - s0), d0), e = d0 / (2 * Math.PI * Math.sin(phi));
  return 1 - e + e * Math.cos(2 * Math.PI * v - phi);
};
/** Load of the semba prototype (+1 = full right, as `StyleDef.support`): the weight is whole on the foot of each
 * sit, on the beat (rule R21, the beats of the music are the weight's arrivals); a transfer takes the 0.2
 * beat before its beat (the pelvis passes the centre in its middle, as in the kompa); inside a double bounce
 * the weight stays on its foot, three quarters of it at the least, half-way: the transfer that does not happen. */
export function sembaSupport(p: SembaSit, b: number): number {
  const n = p.pattern.length, t = (((b - 0.5) % n) + n) % n, i = Math.floor(t), v = t - i, into = 0.2;
  let side = 1;
  for (let k = 0; k < i; k++) if (p.pattern[k] === "T") side = -side;
  if (p.pattern[i] === "D") return -side * (1 - 0.5 * Math.sin(Math.PI * v) ** 2);
  const x = Math.max(0, Math.min(1, (v - (1 - into)) / into)), moved = x * x * (3 - 2 * x);
  return -side * (1 - 2 * moved);
}
/** Lateral position of the pelvis of the semba prototype, −1 (right) to +1 (left). */
export function sembaSwing(p: SembaSit, b: number): number {
  const { theta, bounce } = sembaPhase(p, b);
  return bounce ? bounce.side * smallRound(Math.sin(SIT_AFTER), Math.PI * Math.cos(SIT_AFTER), bounce.v) : Math.sin(theta);
}

export const STYLES: Record<string, StyleDef> = {
  kizomba: {
    label: "Kizomba",
    color: "#2dd4bf",
    posture: { lean: 0.1, knee: 0.3 },
    bullets: [
      "« 2 temps » latéral sur place : marqua (pieds joints) à chaque temps",
      "Pas ≤ largeur du bassin, « touch » sans poids, transfert complet côté appui",
      "Bassin souple, sous-produit de la marche — haut du corps calme",
      "En couple : sorties garçon / fille (5 temps, aller-retour hors de la ligne)",
    ],
    support: (b) => -S2(b),
    apply: (r, b, a) => {
      const s = S2(b);
      r.root.position.x = 0.07 * s * a;
      r.root.position.y = -0.02 + 0.01 * S1(b) * a;
      r.pelvis.rotation.z = 0.05 * s * a;
      r.pelvis.rotation.y = 0.03 * s * a;
      r.pelvis.rotation.x = 0.02 * S1(b) * a;
      r.hipL.rotation.x = -0.24 * s * a;
      r.hipR.rotation.x = 0.24 * s * a;
      r.kneeL.rotation.x = (0.1 + 0.14 * pos(s)) * a;
      r.kneeR.rotation.x = (0.1 + 0.14 * pos(-s)) * a;
    },
  },
  semba: {
    label: "Semba",
    color: "#fb923c",
    posture: { lean: 0.06, knee: 0.24 },
    bullets: [
      "Un rebond par temps : la hanche s'assoit à chaque arrivée du poids",
      "Double rebond : deux arrivées de suite sur chaque pied, le poids repart vers l'autre sans y arriver",
      "Déplacements en rond (koreidinha), changements de direction nets",
      "Plus rapide et ludique que la kizomba (≈130 bpm vs ≈90)",
    ],
    support: (b, base) => { const sit = sembaStep(base); return sit ? sembaSupport(sit, b) : -S2(b); },
    apply: (r, b, a, _w, base) => {
      const sit = sembaStep(base);
      if (sit) {
        const { theta, bounce } = sembaPhase(sit, b), u = theta - SIT_AFTER;
        const bump = (v: number) => (1 + Math.cos(v + sit.skew * (1 - Math.cos(v)))) / 2;
        // The plain swing: each knee bends quickly as its leg receives the weight and straightens slowly, both
        // bend a little more on every sit (the bounce); the pelvis pivots, the sitting hip back, and goes back
        // with each sit.
        let swing = Math.sin(theta), bendL = bump(u), bendR = bump(u - Math.PI), dip = bump(2 * u);
        let turn = Math.cos(u - sit.around), sat = bump(2 * (u - sit.around));
        if (bounce) {
          // The double bounce: the same foot lands again one beat later. The pelvis goes on to its side, comes
          // back to about the centre and turns (`smallRound`); the leg of the bounce straightens by the share
          // `rise` only and bends again; the other knee bends by the share `short` half-way, the transfer that
          // does not happen; one bounce, one recoil of the pelvis per landing.
          const { v, side } = bounce, half = (1 - Math.cos(2 * Math.PI * v)) / 2, own = 1 - sit.rise * half, step = 1e-4;
          // The other knee leaves and comes back with the bend and the speed it has at a sit in the plain swing.
          const far0 = bump(-Math.PI), farSpeed = (bump(Math.PI * step - Math.PI) - bump(-Math.PI * step - Math.PI)) / (2 * step);
          const far = far0 + farSpeed * Math.sin(2 * Math.PI * v) / (2 * Math.PI) + (sit.short - far0) * half;
          swing = side * smallRound(Math.sin(SIT_AFTER), Math.PI * Math.cos(SIT_AFTER), v);
          turn = side * smallRound(Math.cos(sit.around), Math.PI * Math.sin(sit.around), v);
          sat = smallRound(bump(-2 * sit.around), (bump(2 * (Math.PI * step - sit.around)) - bump(2 * (-Math.PI * step - sit.around))) / (2 * step), v);
          bendL = side > 0 ? own : far; bendR = side > 0 ? far : own; dip = own;
        }
        r.root.position.x = sit.sway * swing * a;
        r.kneeL.rotation.x = (sit.base + sit.swing * bendL + sit.dip * dip) * a;
        r.kneeR.rotation.x = (sit.base + sit.swing * bendR + sit.dip * dip) * a;
        r.pelvis.rotation.z = sit.tilt * (r.kneeL.rotation.x - r.kneeR.rotation.x);
        r.extraL = sit.heel * pos(-swing) ** 2 * a; r.extraR = sit.heel * pos(swing) ** 2 * a;
        const yaw = sit.pivot * turn * a;
        r.pelvis.rotation.y = yaw;
        r.root.position.z = -sit.back * sat * a;
        // The trunk: upright, following a share of the pivot, leaning forward (as elected for the kompa).
        const facing = r.spine.rotation.clone().set(sit.lean * a, sit.follow * yaw, 0, "YXZ");
        r.spine.quaternion.copy(r.pelvis.quaternion.clone().invert().multiply(r.spine.quaternion.clone().setFromEuler(facing)));
        r.spine.rotation.x += r.pelvis.rotation.x; r.spine.rotation.z += r.pelvis.rotation.z;
        r.head.rotation.x = -0.5 * sit.lean * a;
        const lean = (d: number) => Math.asin(Math.max(-0.9, Math.min(0.9, sit.iso * d / TORSO_JOINTS.chest[1])));
        r.isoLean = { side: lean(r.root.position.x - TORSO_JOINTS.spine[1] * Math.sin(r.pelvis.rotation.z)), fore: lean(r.root.position.z) };
        r.root.position.z += sit.ahead * a;
        return;
      }
      const s = S2(b);
      r.root.position.x = 0.05 * s * a;
      r.root.position.y = (0.055 * Math.abs(S1(b)) - 0.055) * a;
      r.pelvis.rotation.z = 0.09 * s * a;
      r.pelvis.rotation.x = 0.04 * S1(b) * a;
      r.hipL.rotation.x = -0.4 * s * a;
      r.hipR.rotation.x = 0.4 * s * a;
      r.kneeL.rotation.x = (0.15 + 0.3 * pos(s)) * a;
      r.kneeR.rotation.x = (0.15 + 0.3 * pos(-s)) * a;
      r.extraL = 0.25 * pos(S1(b)) * a;
      r.extraR = 0.25 * pos(-S1(b)) * a;
      r.chest.rotation.x = -0.08;
      r.head.rotation.x = -0.04;
    },
  },
  kompa: {
    label: "Kompa",
    color: "#f87171",
    posture: { lean: 0.08, knee: 0.2 },
    bullets: [
      "Sur place : un appui par temps, le poids change de pied à chaque temps",
      "La hanche s'assoit quand le poids arrive, vers l'arrière et l'extérieur, puis remonte en tournant",
      "Jambes en alternance : celle qui reçoit le poids plie, puis se tend ; talon du pied libre à peine levé",
      "Buste légèrement penché en avant, qui suit le bassin",
    ],
    // #62 (R21; docs/musique/kompa.md, Haitian Music Zone: step 1, touch 2, step 3, touch 4): one
    // transfer every two beats, the weight landing on 1 and 3 (motion beats 0,5 and 2,5, see ON_BEAT_SHIFT).
    // #195: the basic step danced alone lands its weight on every beat (`kompaBeat`); in pair and in
    // travel the two beats per support stay.
    support: (b, base) => kompaSupport(kompaBeat(b, base)),
    apply: (r, clock, a, _w, base) => {
      const b = kompaBeat(clock, base);
      // The « 8 »: the lateral swing never waits (its zeros are the support's, at motion beats 0.3 and 2.3),
      // and the pelvis goes forward as it leaves for the support, back as it returns.
      const eight = kompaStep(base), turn = 2 * Math.PI * (b - (0.5 - KOMPA.transition / 2)) / 4;
      const held = -kompaSupport(b), w = eight ? held + (Math.sin(turn) - held) * eight.round : held;
      const deep = eight ? eight.sense * Math.sin(2 * (turn - 2 * Math.PI * (eight.depthLag ?? 0))) : 0;
      if (eight) r.root.position.z = eight.depth * deep * a;
      const sw = 0.9 * w;
      r.root.position.x = 0.09 * sw * a * (eight?.glide ?? 1);
      r.root.position.y = (-0.06 + (eight?.lift ?? 0)) * a;
      r.pelvis.position.x = 0.02 * sw * a;
      r.pelvis.rotation.z = 0.1 * sw * a;
      r.pelvis.rotation.y = 0.02 * S2(b) * a;
      r.hipL.rotation.x = -0.05;
      r.hipR.rotation.x = -0.05;
      r.kneeL.rotation.x = (0.28 + 0.08 * pos(w)) * a;
      r.kneeR.rotation.x = (0.28 + 0.08 * pos(-w)) * a;
      if (eight?.knees) {
        // The knees lead: the free knee is asked to bend as the weight leaves it, overlapping the other; the
        // pelvis rolls with their difference (see `tilt` for which hip rises).
        // `settle`: from the centre to the side (the attack) knees and hips keep the weight's own phase; from
        // the side back to the centre their phase runs ahead (> 0: the hip sits at once) or behind (< 0: it
        // stays up and comes down late), and is back in step when the weight passes.
        const k = eight.knees, phase = turn - 2 * Math.PI * k.lag, half = ((phase % Math.PI) + Math.PI) % Math.PI;
        // `late`: knees and hips are behind the weight by that much as it passes the centre, and in step with
        // it as it reaches the side: the hip waits while the pelvis leaves, then arrives with it.
        // `after`: the reverse; in step with the weight as it passes the centre, behind it by that much at the
        // side: the hip is still finishing when the pelvis has arrived, and is back in step for the next passage.
        const c = Math.sin(phase + (k.settle && half > Math.PI / 2 ? k.settle * Math.sin(2 * half) ** 2 : 0) - (k.late ?? 0) * Math.cos(phase) ** 2 - (k.after ?? 0) * Math.sin(phase) ** 2);
        const base = k.base ?? 0.28, sit = eight.sit;
        let bendL = (1 - c) / 2, bendR = (1 + c) / 2;
        // `sit`: each leg sits as it receives the weight (with `lag` 0.3 its knee is most bent on the beat the
        // weight lands), bending quickly and straightening slowly (`skew` < 0); `u` is 0 when the left leg sits.
        const u = phase + Math.PI / 2, bump = (v: number) => (1 + Math.cos(v + (sit?.skew ?? 0) * (1 - Math.cos(v)))) / 2;
        if (sit) { bendL = bump(u); bendR = bump(u - Math.PI); }
        r.kneeL.rotation.x = (base + k.swing * bendL) * a;
        r.kneeR.rotation.x = (base + k.swing * bendR) * a;
        r.pelvis.rotation.z = k.tilt * (r.kneeL.rotation.x - r.kneeR.rotation.x);
        // The free foot's heel: with `sit` it rises only while its side carries no weight (the pelvis on the
        // other side) and is down again when the weight passes.
        if (k.heel && sit) { r.extraL = k.heel * pos(-Math.sin(turn)) ** 2 * a; r.extraR = k.heel * pos(Math.sin(turn)) ** 2 * a; }
        else if (k.heel) { r.extraL = k.heel * bendL * bendL * a; r.extraR = k.heel * bendR * bendR * a; }
        if (sit) {
          // The sitting hip goes back and outwards: the pelvis pivots (that hip back, most `around` rad after
          // the sit) while the spine turns back by as much (the chest stays facing front), and the whole
          // pelvis goes back with each sit, quickly, then comes forward slowly as the hip rises.
          const yaw = sit.pivot * Math.cos(u - sit.around) * a;
          r.pelvis.rotation.y = yaw;
          r.root.position.z -= sit.back * bump(2 * (u - sit.around)) * a;
          if (sit.follow === undefined && !eight.lean) r.spine.rotation.y = -yaw; // `assis`, `assisMarque`, as filmed
          else {
            // The trunk above the pelvis: upright, facing front but for the share of the pivot it follows
            // (`follow`), leaning forward by `lean`. The spine takes exactly what the pelvis's roll and pivot
            // would otherwise give it (three rotations do not undo each other angle by angle); the trunk lock
            // of the pose then takes the pelvis's pitch and roll off again, hence their addition here.
            const facing = r.spine.rotation.clone().set((eight.lean ?? 0) * a, (sit.follow ?? 0) * yaw, 0, "YXZ");
            r.spine.quaternion.copy(r.pelvis.quaternion.clone().invert().multiply(r.spine.quaternion.clone().setFromEuler(facing)));
            r.spine.rotation.x += r.pelvis.rotation.x; r.spine.rotation.z += r.pelvis.rotation.z;
          }
        }
      }
      r.chest.rotation.z = -0.035 * sw * a;
      if (eight?.back) {
        r.root.position.z -= eight.back.reach * a;
        r.pelvis.rotation.x = eight.back.pitch * (1 - deep) / 2 * a;
      }
      if (eight?.iso) {
        // The chest stays where it was: the spine leans against the pelvis's travel and the chest leans back
        // by as much (no net rotation), over the height between them; the roll of the pelvis also carries the foot
        // of the spine sideways. Applied by the pose after the trunk lock.
        const lean = (d: number) => Math.asin(Math.max(-0.9, Math.min(0.9, eight.iso! * d / TORSO_JOINTS.chest[1])));
        r.isoLean = { side: lean(r.root.position.x + r.pelvis.position.x - TORSO_JOINTS.spine[1] * Math.sin(r.pelvis.rotation.z)), fore: lean(r.root.position.z) };
      }
      // `lean` (rad): the trunk leans forward from the waist (the head half-way back, the eyes stay level);
      // `ahead` (m): the pelvis stands that far forward over the feet (after `iso`, which follows its sway only).
      if (eight?.lean) { if (!eight.sit) r.spine.rotation.x += eight.lean * a; r.head.rotation.x -= 0.5 * eight.lean * a; }
      if (eight?.ahead) r.root.position.z += eight.ahead * a;
      // Hip check on the touch (2 and 4). At one beat per support (#195) there is no touch left, hence no check.
      if (b === clock && ((b + 0.5) % 2 + 2) % 2 >= 1.5) r.pelvis.position.x += 0.008 * S1(b) * a;
    },
  },
  tarraxinha: {
    label: "Tarraxinha",
    color: "#c084fc",
    posture: { lean: 0.14, knee: 0.34 },
    bullets: [
      "Sur place : isolations du bassin (8, cercles), blocages nets",
      "Haut du corps strictement immobile, guidage par contact des hanches",
      "Pas quasi nuls, plein appui, genoux souples",
      "La plus « collé-serré » (« kolé séré » en créole antillais) des variantes kizomba",
    ],
    support: (b) => -0.5 * S2(b),
    apply: (r, b, a) => {
      r.root.position.y = -0.03;
      // #61 (owner): the hip's intention goes forward, then the hip comes back opening slightly to its
      // side, which lets the opposite hip go forward. Yaw leads (one hip forward), the lateral shift
      // follows in quadrature (the returning hip opens to its side); roll stays secondary.
      r.pelvis.rotation.z = 0.08 * S2(b) * a;
      r.pelvis.rotation.x = 0.14 * Math.sin((TAU * b) / 2 + 1.3) * a;
      r.pelvis.rotation.y = 0.22 * Math.cos((TAU * b) / 2) * a;
      r.pelvis.position.x = 0.03 * S2(b) * a;
      r.pelvis.position.z = 0.012 * Math.cos((TAU * b) / 2) * a;
      r.kneeL.rotation.x = (0.12 + 0.06 * S2(b)) * a;
      r.kneeR.rotation.x = (0.12 - 0.06 * S2(b)) * a;
    },
  },
  suave: {
    label: "Suave",
    color: "#4ade80",
    posture: { lean: 0.02, knee: 0.14 },
    bullets: [
      "« 8 » du bassin au sol, sur place (ginga)",
      "Talon levé → fesses montent → on redescend et change de pied",
      "Vague séquentielle L5 → dorsales → tête",
      "Transferts partiels 60/40, talons au sol, aucun rise-and-fall",
    ],
    support: (b) => -0.2 * S2(b),
    apply: (r, b, a, w = b) => {
      r.root.position.y = -0.035;
      r.pelvis.position.x = 0.03 * S2(b) * a;
      r.pelvis.position.z = 0.022 * S4(w) * a;
      r.pelvis.rotation.x = 0.05 * Math.sin((TAU * w) / 4 + 1.57) * a;
      r.pelvis.rotation.z = 0.03 * S2(b) * a;
      r.spine.rotation.x = 0.09 * Math.sin((TAU * w) / 4 - 0.5) * a;
      r.lumbar.rotation.x = 0.1 * Math.sin((TAU * w) / 4 - 0.9) * a;
      r.thoracic.rotation.x = 0.1 * Math.sin((TAU * w) / 4 - 1.4) * a;
      r.chest.rotation.x = 0.08 * Math.sin((TAU * w) / 4 - 1.1) * a;
      r.head.rotation.x = 0.06 * Math.sin((TAU * w) / 4 - 1.7) * a;
      r.kneeL.rotation.x = (0.14 + 0.1 * S2(b)) * a;
      r.kneeR.rotation.x = (0.14 - 0.1 * S2(b)) * a;
      r.extraL = 0.15 * pos(S1(b)) * a;
      r.extraR = 0.15 * pos(-S1(b)) * a;
    },
  },
  zouk: {
    label: "Zouk brésilien",
    color: "#38bdf8",
    posture: { lean: -0.1, knee: 0.12 }, // cambré : buste en arrière
    bullets: [
      "Basic sur place (slow-quick-quick), pas de déplacement forcé",
      "Ouverture de hanche (yaw) sur les grandes foulées",
      "Cambré contrôlé + vague du tronc + rouleaux de tête",
      "En couple : sorties et variations de niveau (rise and fall)",
    ],
    support: (b) => -S2(b),
    apply: (r, b, a, w = b) => {
      const s = S2(b);
      r.root.position.x = 0.05 * s * a;
      r.root.position.y = (-0.03 + 0.03 * S4(w)) * a;
      r.pelvis.rotation.y = 0.18 * s * a;
      r.pelvis.rotation.x = 0.07 * s * a;
      r.pelvis.rotation.z = 0.05 * s * a;
      r.hipL.rotation.x = -0.45 * s * a;
      r.hipR.rotation.x = 0.45 * s * a;
      r.kneeL.rotation.x = (0.12 + 0.28 * pos(s)) * a;
      r.kneeR.rotation.x = (0.12 + 0.28 * pos(-s)) * a;
      r.chest.rotation.y = 0.14 * Math.sin((TAU * b) / 2 - 1.0) * a;
      r.chest.rotation.x = -0.14 * (0.5 + 0.5 * S4(w)) * a;
      r.lumbar.rotation.x = -0.1 * (0.5 + 0.5 * S4(w)) * a;
      r.thoracic.rotation.x = -0.08 * (0.5 + 0.5 * S4(w + 0.5)) * a;
      r.head.rotation.x = -0.08 * (0.5 + 0.5 * Math.sin((TAU * w) / 4 - 0.8)) * a;
    },
  },
};

export const MODES = [
  { key: "solo", label: "Solo (mouvement isolé)" },
  { key: "observe", label: "Observation hanche (lent)" },
  { key: "compare", label: "Comparaison côte à côte" },
  { key: "pair", label: "Face à face (symétrie)" },
];

export type ModeKey = (typeof MODES)[number]["key"];

// Enveloppe de « sortie » (5 temps sur un cycle de 8) : sortie latérale puis retour,
// utilisée en mode Face à face (sortie garçon côté guideur, sortie fille côté
// suiveur — le retard du suiveur décale la seconde). Sources : voir docs/styles-de-danse.md.
// Charge pied droit (bornée [-1,1]) : courbe du style si définie, sinon déduite de root.x.
export function supportOf(styleKey: string, r: RigHandle, b: number, base = true): number {
  const st = STYLES[styleKey];
  const v = st && st.support ? st.support(b, base) : -r.root.position.x / 0.09;
  return Math.max(-1, Math.min(1, v));
}

// Blend IK : travel > 0 -> IK de pas progressif ; travel = 0 -> pieds plantés si plant,
// sinon ancien comportement glissé (convention handoff, plant=0).
export function plantBlend(travel: number, plant: boolean): number {
  return travel > 0.001 ? Math.min(1, travel / 0.2) : plant ? 1 : 0;
}

// Sortie garçon/fille : déplacement latéral local (axe x, perpendiculaire à la ligne de
// danse) d'amplitude 0,22 m * amplitude, aller-retour de 5 temps sur un cycle de 8.
export function sortieOffset(b: number, amp: number): number {
  return 0.22 * sortieEnvelope(b) * amp;
}

// Corridinho (tâche 11) : séquence de 16 temps — 1/4 de tour à DROITE (temps 0–3),
// 1/4 de tour à GAUCHE (4–7), puis cercle au sol de rayon R autour du repère fixe
// (origine) pendant 8–15, en avançant (le danseur décrit le cercle). Source : Wikipédia FR
// Kizomba (« corridinho : succession de pas qui forme un cercle au sol » ; « 1/4 de tour,
// en 3 temps avec un marqua »).
export const CORRIDINHO_RADIUS = 0.3;
export function corridinhoPath(b: number): { x: number; z: number; ry: number } {
  const p = ((b % 16) + 16) % 16;
  if (p < 4) {
    const t = p / 4;
    return { x: 0, z: 0, ry: (Math.PI / 2) * t };
  }
  if (p < 8) {
    const t = (p - 4) / 4;
    return { x: 0, z: 0, ry: (Math.PI / 2) * (1 - t) };
  }
  const phi = (TAU * (p - 8)) / 8;
  return {
    x: CORRIDINHO_RADIUS * (1 - Math.cos(phi)),
    z: CORRIDINHO_RADIUS * Math.sin(phi),
    ry: phi,
  };
}

export function sortieEnvelope(b: number): number {
  const p = ((b % 8) + 8) % 8;
  let e = 0;
  if (p < 1) e = p;
  else if (p < 3) e = 1;
  else if (p < 5) e = (5 - p) / 2;
  else e = 0;
  return e * e * (3 - 2 * e);
}

// ---------------------------------------------------------------------------
// Phase 7 — isolation du bas du corps (objectif premier, 2026-11-18) : au-dessus du bassin,
// le haut du tronc doit rester stable et vertical pendant que bassin/genoux/pieds travaillent.
// Sources : docs/ginga-angolana.md §2 (« the movements hips down are the dominant ones [...], not
// the upper body movements » — Eddy Vents ; « Keep the shoulder line level and do not pitch or
// sway the entire body » — SOS Dance Footwork Manual ; « the upper body remains stable and calm
// in the connection » — udansa).
// ---------------------------------------------------------------------------

export interface RotLike {
  x: number;
  y: number;
  z: number;
}

// Verrouillage du haut du tronc quand iso = true : la colonne (spine) contre-rotate le
// roll/pitch du pelvis (le thorax reste vertical en monde), et le buste (chest) + la tête ne
// basculent plus latéralement (y/z remis à 0). Le pitch (x) est conservé : posture, cambré du
// zouk et vague du suave passent par la chaîne vertébrale sagittale (spine/lumbar/thoracic).
export function lockUpperTrunk(
  t: { spine: RotLike; chest: RotLike; head: RotLike },
  pelvis: RotLike,
  iso: boolean
): void {
  if (!iso) return;
  t.spine.x -= pelvis.x;
  t.spine.z -= pelvis.z;
  t.chest.y = 0;
  t.chest.z = 0;
  t.head.y = 0;
  t.head.z = 0;
}

// Roll résiduel (monde, approx.) du thorax : somme des rotations z pelvis + spine + chest.
export function residualRoll(t: { spine: RotLike; chest: RotLike }, pelvis: RotLike): number {
  return pelvis.z + t.spine.z + t.chest.z;
}

// Stabilité du buste ∈ [0,1] : 1 = thorax parfaitement vertical, 0 = bascule ≥ 0.3 rad.
export function upperStability(t: { spine: RotLike; chest: RotLike }, pelvis: RotLike): number {
  const roll = Math.abs(residualRoll(t, pelvis));
  return Math.max(0, Math.min(1, 1 - roll / 0.3));
}

// Cadre de bras de danseur (demande 2026-11-18) : coudes pliés, bras vers l'avant,
// avant-bras gauche vers le haut paume vers la droite, avant-bras droit vers la gauche
// paume vers le buste. sxi = -1 côté gauche (x < 0), +1 côté droit.
export const DANCE_FRAME = {
  upperArm: { x: -1.15, y: 0, z: 0.22 }, // bras vers l'avant, légère ouverture (z = -z*sxi)
  forearmLeft: { x: 0, y: Math.PI / 2, z: Math.PI }, // avant-bras G vers le haut, paume → droite
  forearmRight: { x: Math.PI, y: 0, z: -Math.PI / 2 }, // avant-bras D vers la gauche, paume → buste
} as const;

interface Rotatable {
  rotation: RotLike & { set(x: number, y: number, z: number): void };
}

export function applyDanceFrame(
  r: { armUL?: Rotatable; armUR?: Rotatable; armFL?: Rotatable; armFR?: Rotatable },
  cadre: boolean
): void {
  if (!cadre) return;
  // #40: armUL/armFL are now the anatomical left arm (+x side); the historical angles were tuned on
  // the swapped names, so each value goes to the same physical arm as before.
  if (r.armUR) r.armUR.rotation.set(DANCE_FRAME.upperArm.x, DANCE_FRAME.upperArm.y, DANCE_FRAME.upperArm.z);
  if (r.armUL) r.armUL.rotation.set(DANCE_FRAME.upperArm.x, DANCE_FRAME.upperArm.y, -DANCE_FRAME.upperArm.z);
  if (r.armFR) r.armFR.rotation.set(DANCE_FRAME.forearmLeft.x, DANCE_FRAME.forearmLeft.y, DANCE_FRAME.forearmLeft.z);
  if (r.armFL) r.armFL.rotation.set(DANCE_FRAME.forearmRight.x, DANCE_FRAME.forearmRight.y, DANCE_FRAME.forearmRight.z);
}

// Cadre de la SUIVEUSE en paire (demande 2026-11-18, non prioritaire) : coude gauche levé à
// hauteur d'épaule, son avant-bras en contact avec le dos du danseur d'en face ; coude droit
// baissé, main droite en contact avec la main gauche du danseur.
export const DANCE_FRAME_FOLLOWER = {
  upperLeft: { x: -1.45, y: 0, z: 0.15 }, // bras gauche ~ horizontal, hauteur d'épaule
  foreLeft: { x: -0.35, y: 0, z: 0 }, // avant-bras vers l'avant (dos du guideur)
  upperRight: { x: -0.45, y: 0, z: 0.55 }, // coude droit baissé, bras écarté
  foreRight: { x: -1.35, y: 0, z: -0.3 }, // avant-bras ramené, main D vers la main G du guideur
} as const;

export function applyFollowerFrame(
  r: { armUL?: Rotatable; armUR?: Rotatable; armFL?: Rotatable; armFR?: Rotatable },
  cadre: boolean
): void {
  if (!cadre) return;
  // Same physical arms as before the #40 renaming (see applyDanceFrame).
  if (r.armUR) r.armUR.rotation.set(DANCE_FRAME_FOLLOWER.upperLeft.x, DANCE_FRAME_FOLLOWER.upperLeft.y, DANCE_FRAME_FOLLOWER.upperLeft.z);
  if (r.armFR) r.armFR.rotation.set(DANCE_FRAME_FOLLOWER.foreLeft.x, DANCE_FRAME_FOLLOWER.foreLeft.y, DANCE_FRAME_FOLLOWER.foreLeft.z);
  if (r.armUL) r.armUL.rotation.set(DANCE_FRAME_FOLLOWER.upperRight.x, DANCE_FRAME_FOLLOWER.upperRight.y, DANCE_FRAME_FOLLOWER.upperRight.z);
  if (r.armFL) r.armFL.rotation.set(DANCE_FRAME_FOLLOWER.foreRight.x, DANCE_FRAME_FOLLOWER.foreRight.y, DANCE_FRAME_FOLLOWER.foreRight.z);
}

// ---------------------------------------------------------------------------
// Phase 8 — déplacements : quarts de tour, marche avant/arrière + marka « 3 temps », ida e volta.
// ---------------------------------------------------------------------------

// Quarts de tour (mouvement séparé du corridinho, demande 2026-11-18) : 4 quarts de tour sur 16
// temps = un tour complet (2π). Le suiveur en paire peut le faire en marche arrière (reverse).
export function quartsPath(b: number): { ry: number } {
  const p = ((b % 16) + 16) % 16;
  return { ry: (Math.PI / 2) * (p / 4) };
}

// Inversion d'une trajectoire (marche arrière du suiveur en paire) : z miroir, ry opposé.
export function reversePath<T extends { x?: number; z?: number; ry?: number }>(cp: T): T {
  return { ...cp, x: cp.x ?? 0, z: -(cp.z ?? 0), ry: -(cp.ry ?? 0) };
}

// Phase 11 — vírgula (docs/virgula.md) : sur un quart de tour le pied pivote sur la boule du
// pied avec le corps (contact sol constant) -> correction de lacet LOCAL à ajouter à
// foot.rotation.y pour que le lacet monde du pied rejoigne le lacet monde du corps (root).
// Renvoie le delta dans ]-π, π]. Hors mouvement de tour : delta 0 (pied inchangé).
export function virgulaFootYawDelta(footWorldYaw: number, bodyWorldYaw: number): number {
  let d = bodyWorldYaw - footWorldYaw;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

// Phase 16 — espacement du couple en mode face à face (z = ∓PAIR_DZ) : recalé sur la surface
// ventrale RÉELLE du CORPS (sans les bras, demande 2026-11-19) mesurée par sonde sommets :
// front max local ≈ 0.17 m avec lean ; à 0.125 les ventres se croisaient de ~0.21 m, à 0.15
// encore ~1.6 cm. 0.175 = pire cas mesuré (0.174) + marge. Les marqueurs de contact sont
// posés sur cette surface : poitrine z=0.16, bassin z=0.14, genoux z=0.135
// (écarts 0.03 / 0.07 / 0.08 < 0.09 m → contact vert).
export const PAIR_DZ = 0.175;

// Phase 14 — les déplacements sont des options NON combinables (radio, pas checkbox).
// Phase 17 — la sortie garçon/fille devient aussi une option exclusive (radio), avec le
// combiné G→F (docs/spec-phase17-sortie-exclusive.md).
export type MovementKey = "none" | "corridinho" | "quarts" | "temps3" | "ida" | "sortieG" | "sortieF" | "sortieGF";

// Priorité d'exclusivité si plusieurs flags sont positionnés (ex. URL artisanale).
/** Owner (20 Nov.): « on peut laisser le style konpa faire uniquement le sur place et le avant /
 * arrière (pas de marka en konpa) », then « gère tarraxinha et zouk comme avec le konpa » (focus on
 * kizomba and semba). Styles listed here only offer these movements. */
export const STYLE_MOVEMENTS: Partial<Record<string, MovementKey[]>> = {
  kompa: ["none", "ida"], tarraxinha: ["none", "ida"], zouk: ["none", "ida"],
};
export function movementAllowed(styleKey: string, movement: MovementKey): boolean {
  const allowed = STYLE_MOVEMENTS[styleKey];
  return !allowed || allowed.includes(movement);
}
/** Lateral travel (« Déplacement ») is not « sur place » nor « avant / arrière »: not offered in kompa,
 * whose lateral balance is the style itself. */
export const travelAllowed = (styleKey: string): boolean => !STYLE_MOVEMENTS[styleKey];

export function movementOf(o: { corridinho?: boolean; quarts?: boolean; temps3?: boolean; ida?: boolean; sortieG?: boolean; sortieF?: boolean; sortieGF?: boolean }): MovementKey {
  if (o.corridinho) return "corridinho";
  if (o.quarts) return "quarts";
  if (o.temps3) return "temps3";
  if (o.ida) return "ida";
  if (o.sortieG) return "sortieG";
  if (o.sortieF) return "sortieF";
  if (o.sortieGF) return "sortieGF";
  return "none";
}

// Un seul flag à true ("none" -> tous false) : garantit la non-combinabilité.
export function movementFlags(m: MovementKey): { corridinho: boolean; quarts: boolean; temps3: boolean; ida: boolean; sortieG: boolean; sortieF: boolean; sortieGF: boolean } {
  return {
    corridinho: m === "corridinho", quarts: m === "quarts", temps3: m === "temps3", ida: m === "ida",
    sortieG: m === "sortieG", sortieF: m === "sortieF", sortieGF: m === "sortieGF",
  };
}

// Phase 17 — enveloppe de sortie par danseur et par option (0..1) :
// - "sortieG" : le guideur sort (cycle 8), le suiveur reste sur la ligne ;
// - "sortieF" : le suiveur sort, le guideur reste ;
// - "sortieGF" (combiné) : cycle 16 — guideur sur les temps 0–7, suiveur sur 8–15 (enchaînement).
// Hors paire (embrace false) ou autre mouvement : 0 (géré par l'appelant).
export function sortieActive(side: "leader" | "follower", m: MovementKey, b: number): number {
  if (m === "sortieG") return side === "leader" ? sortieEnvelope(b) : 0;
  if (m === "sortieF") return side === "follower" ? sortieEnvelope(b) : 0;
  if (m === "sortieGF") {
    const p = ((b % 16) + 16) % 16;
    if (side === "leader") return p < 8 ? sortieEnvelope(p) : 0;
    return p >= 8 ? sortieEnvelope(p - 8) : 0;
  }
  return 0;
}

// Phase 14 — quarts de tour avec vrais pivots (vírgula pas à pas, demande 2026-11-18).
// Cycle 16 temps = 4 quarts x 4 temps, 2 demi-pas de 2 temps par quart ; quart à gauche =
// anti-horaire = yaw +π/2. Demi-pas 0 : talon du pied G au bout du pied D, pied G orienté à
// 90° vers la gauche, le HAUT du corps (upperYaw) suit le pied G ; demi-pas 1 : pied D ramené
// parallèle au pied G, le BAS du corps (lowerYaw) suit le pied D. Les pieds tracent un petit
// carré autour de l'origine (retour ~ position initiale après 4 quarts = 2π).
export interface QuartStep {
  q: number; // quart courant 0..3
  half: 0 | 1; // demi-pas courant
  stepSide: "L" | "R"; // pied qui bouge à ce demi-pas
  upperYaw: number; // lacet monde du haut du corps (suit le pied G)
  lowerYaw: number; // lacet monde du bas du corps / root (suit le pied D)
  footL: { x: number; z: number; yaw: number }; // cible monde pied G (position + lacet)
  footR: { x: number; z: number; yaw: number }; // cible monde pied D
}

const QH = 0.084; // demi inter-hanches : pieds sous les hanches
const QF = 0.09; // pieds légèrement en avant du bassin
// Talon du pied G AU BOUT du pied D (bout du pied D à z = QF + ~0.11) — demande 2026-11-18 :
// « le pied gauche va plus à l'avant (le bout du pied droit), actuellement il s'arrête à la
// moitié à tort » : la cible z du pied G = QF + QTOE = bout du pied D.
const QTOE = 0.11;
const QD = 2 * QH; // écart entre les pieds quand ils sont parallèles

export function quartTurnStep(b: number, reverse = false): QuartStep {
  const p = ((b % 16) + 16) % 16;
  const q = Math.min(3, Math.floor(p / 4));
  const half = (Math.floor(p / 2) % 2) as 0 | 1;
  const ph = (p % 2) / 2; // progression dans le demi-pas, [0, 1)
  const rot = (x: number, z: number, th: number) => ({
    x: x * Math.cos(th) + z * Math.sin(th),
    z: -x * Math.sin(th) + z * Math.cos(th),
  });
  // état des pieds en simulant les quarts précédents (positions/lacets monde)
  let l = { x: QH, z: QF, yaw: 0 };
  let r = { x: -QH, z: QF, yaw: 0 };
  const applyQuarter = (qq: number) => {
    const th0 = (qq * Math.PI) / 2;
    const th1 = ((qq + 1) * Math.PI) / 2;
    const d0 = rot(0, QTOE, th0);
    l = { x: r.x + d0.x, z: r.z + d0.z, yaw: th1 }; // talon G au bout du D, pied G à 90°
    const d1 = rot(-QD, 0, th1);
    r = { x: l.x + d1.x, z: l.z + d1.z, yaw: th1 }; // pied D parallèle au pied G
  };
  for (let qq = 0; qq < q; qq++) applyQuarter(qq);
  const th0 = (q * Math.PI) / 2;
  const th1 = ((q + 1) * Math.PI) / 2;
  // au demi-pas 1 du quart courant, le pied G a déjà bougé au demi-pas 0 du même quart
  if (half === 1) {
    const d0 = rot(0, QTOE, th0);
    l = { x: r.x + d0.x, z: r.z + d0.z, yaw: th1 };
  }
  let out: QuartStep;
  if (half === 0) {
    const d0 = rot(0, QTOE, th0);
    out = {
      q,
      half,
      stepSide: "L",
      upperYaw: th0 + ph * (Math.PI / 2), // haut du corps suit le pied G
      lowerYaw: th0, // bas du corps attend le pied D
      footL: { x: r.x + d0.x, z: r.z + d0.z, yaw: th0 + Math.PI / 2 },
      footR: r,
    };
  } else {
    const d1 = rot(-QD, 0, th1);
    out = {
      q,
      half,
      stepSide: "R",
      upperYaw: th1,
      lowerYaw: th0 + ph * (Math.PI / 2), // bas du corps suit le pied D
      footL: l,
      footR: { x: l.x + d1.x, z: l.z + d1.z, yaw: th1 },
    };
  }
  if (reverse) {
    // Suiveur en paire (marche arrière) : trajectoire miroir (z -> -z, lacets opposés) ET
    // rôles G/D échangés — le suiveur RECULE et pivote d'abord son pied DROIT en angle droit
    // (gros orteil D à 90° du gros orteil G), puis rassemble son pied G
    // (demande 2026-11-18).
    out = {
      ...out,
      stepSide: out.stepSide === "L" ? "R" : "L",
      upperYaw: -out.upperYaw,
      lowerYaw: -out.lowerYaw,
      footL: { x: out.footR.x, z: -out.footR.z, yaw: -out.footR.yaw },
      footR: { x: out.footL.x, z: -out.footL.z, yaw: -out.footL.yaw },
    };
  }
  return out;
}

// Déplacement latéral le long de la ligne de danse ; dir = -1 → marche arrière.
export function travelOffset(travel: number, dir: number, b: number): number {
  return (dir < 0 ? -1 : 1) * travel * (HIP_WIDTH / 2) * Math.tanh(2.2 * S2(b));
}

// Marke « 3 temps » : un pas tous les 3 temps au lieu de chaque temps.
export function swingBeat(b: number, temps3: boolean): number {
  return Math.floor(b / (temps3 ? 3 : 1));
}

// Hauteur de balancement du pied pendant un pas (cloche sin(π·t) >= 0 : le pied ne descend
// jamais sous le sol pendant la phase d'appui aérienne ; contact sol garanti par plantBlend).
export function swingLift(t: number, lift: number): number {
  return 0.05 * lift * Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, t))));
}

// Ida e volta (aller-retour, seul ou à 2 face à face) sur un cycle de 8 temps :
// pied gauche avant puis arrière (temps 0-3), pied droit avant puis arrière (temps 4-7).
export function idaEVoltaStep(b: number): { side: "L" | "R"; dir: 1 | -1 } {
  const p = ((b % 8) + 8) % 8;
  const side: "L" | "R" = Math.floor(p / 4) % 2 === 0 ? "L" : "R";
  const dir: 1 | -1 = Math.floor(p / 2) % 2 === 0 ? 1 : -1;
  return { side, dir };
}

// Phase 15 — contraposition (tango, docs/posture-contraposition.md) pendant l'ida e volta :
// pendant chaque pas de 2 temps, le BAS du corps (lowerYaw) pivote vers le pied qui avance et
// le HAUT du corps (upperYaw) du côté opposé ("if you're stepping forward with your right
// foot, your left shoulder will come forward to oppose this motion", Tango Topics), en cloche
// sin(π·ph). Retombe à 0 entre les pas.
export function idaContra(b: number): { upperYaw: number; lowerYaw: number } {
  const p = ((b % 8) + 8) % 8;
  const st = idaEVoltaStep(b);
  const s = st.side === "L" ? 1 : -1;
  const ph = (p % 2) / 2; // progression dans le pas de 2 temps, [0, 1)
  const bell = Math.sin(Math.PI * ph);
  return { lowerYaw: 0.08 * s * bell, upperYaw: -0.1 * s * bell };
}
