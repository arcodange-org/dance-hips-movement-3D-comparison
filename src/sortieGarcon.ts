/** Validated five-action figure. GLB coordinates: left +x, forward +z. */
import { gaitStep } from "./gait";
import { FIGURE_GESTURE, figureWay, followWay } from "./gesteHanche";
import { COUPLE_DZ, placementOffset, startCoupling, endCoupling, type CouplePlacement, type PlacementOffset } from "./placement";
export type FigureFoot = "L" | "R";
export type SortieVariant = "line" | "right";
export interface FootPoint { x: number; z: number }
export interface FigureFootPose extends FootPoint { yaw: number; lift: number;
  /** #49: rolling foot (src/gait.ts). */
  pitch?: number; pivot?: "ball" | "heel" | null }
export const SORTIE_GARCON_BEATS = 5;
// The couple's half-spacing, shared by the pair figures (#203: `COUPLE_DZ`).
export const SORTIE_GARCON_PAIR_DZ = COUPLE_DZ;
export const SORTIE_GARCON_ACTIONS = [
  "Départ · gauche disponible", "1 · Gauche en avant à gauche",
  "2 · Droit en avant, hors ligne", "3 · Gauche croisé devant",
  "4 · Droit, retour en face", "5 · Marka gauche, sans transfert",
] as const;
export const DEFAULT_SORTIE_CONTRA = 12;
const STEP1_LEAD = 0.1;
/** Lateral geometry of the exit (#50, #110, calibrated on the GLB): offsets in the leader's frame from his
 * rest ankles. #110: the leader alone makes the room for his exit. #130: his D2 lands close to the
 * follower's D (0.26 m, 0.34 before) after a 3 cm arc to his left in flight (`aside`), clear of her D. */
export const SORTIE_GARCON_EXIT = { step1X: 0.28, step2X: 0.26, body0X: 0.15, body1X: 0.40, aside: 0.03, back: 0.05 };
/** #104 (owner, 20 Nov.: « la hanche est au dessus du pied : contact cuisse cuisse ») and #110 (« le suiveur
 * ne fait que des marche arrière sans être dérangé par le leader qui est le seul à sortir puis revenir sur
 * la ligne de danse. C'est au leader de gérer l'espace de son décalage à gauche pour être le plus proche
 * possible sans gêner le suiveur »): at position 2 the leader's pelvis stands over his D, and he makes
 * the room himself: his G1 opens 0.28 m (and goes 0.42 m forward, more forward than sideways in every placement), his
 * D2 lands 0.34 m to the left of his rest ankle. The follower walks straight back: D1 `d1`, G2 `g2` (his
 * D2's length, R22). `pass`: on his way over his D the leader's pelvis passes this much to his left
 * mid-step.
 * #130 (owner, 21 Nov.: « avoir le pied (voire le genou) en contact possible (donc très proche) sur D2 est
 * important, quitte à reculer légèrement le bassin ») settles R9 against #104: the D feet come first. At
 * position 2 his pelvis stands `back` behind his D and `inward` to his left of it, instead of over it:
 * no frontal contact of the pelvises. Measured on the GLB: D feet 3.8 cm apart (11.7 before), right knees
 * 11.1 cm (15.9 before), right thighs side by side (envelopes 6.1 cm into each other), no leg-bone
 * crossing. With his pelvis over his D, feet that close put the right femurs through each other. */
export const SORTIE_GARCON_POS2 = { d1: 0.16, g2: 0.25, pass: 0.05, back: 0.06, inward: 0.08 };
const STEP3_LEAD = 0.2;
/** #213: share of the hip's head start (`FIGURE_GESTURE`) kept at the crossing (action 3). */
export const SORTIE_GARCON_CROSS_HEAD = 0.5;
/** #56: progression of the couple along the line after each action (m, validated figure), and the
 * share of it kept. Steps of about one foot length: only the common translation shrinks, the
 * relative geometry (D/D contact, crossing, neutral end) is unchanged. */
export const SORTIE_GARCON_LINE = [0, 0.17, 0.34, 0.66, 0.70, 0.70];
export const SORTIE_GARCON_TRAVEL = { share: 0.7, leader: [2, 2, 2, 4, 5], follower: [2, 2, 2, 4, 5], behind: 0.015 };
const STEP4_LEAD = 0.2;
/** #88: the follower's delay after the leader's step (beats) and the share of it taken from her flight
 * (1: she lands as before). #110: the leader's D4 leaves 0.25 beat into its action (`step4`, 0.2 before):
 * from his wider exit, earlier it brushes its knee behind his G3 shin; her G4 leaves with it. */
export const SORTIE_GARCON_SYNC = { lag: 0, keepLanding: 1, step4: 0.25, d4: "aside" as "aside" | "back" | "diagonal", g4span: 0.3 };
/** #220 (owner, 27 Nov. 2026: on « 1 » the follower steps straight back; the couple's rotation starts when the leader's
 * D leaves the floor for « 2 »). PROTOTYPES, to elect on films (`?sortieTour=<nom>`, nothing changes without it):
 * - `straight`: her D1 goes straight back from where it stands (it slid 2.7 cm to her right to the reference lane), her
 *   pelvis too; the right feet are as much further apart at position 2 (his D2 following her, the right thighs met in
 *   suave with the game's ginga);
 * - `angle` (rad, negative: clockwise, towards the leader's right, the follower turning towards him), from `from` to
 *   `until` (beats), about `centre` (`suiveuse`: her pelvis at position 2; `couple`: the middle of the two pelvises
 *   there): each foot lands where the figure puts it in the couple turned as far as at its landing; the foot that
 *   carries the weight pivots on its ball meanwhile; the pelvis goes round the centre with the turn. Every foot lands
 *   again after `until` (his D4 at 3.65, her G4 at 3.55, the markas): the figure ends rigidly turned by `angle`. */
export interface SortieTour { straight: boolean; angle: number; from: number; until: number; centre: "suiveuse" | "couple" }
const DEG = Math.PI / 180;
export const SORTIE_TOURS: Record<string, SortieTour> = {
  sansTour: { straight: true, angle: 0, from: 1, until: 3.5, centre: "couple" },
  tour45: { straight: true, angle: -45 * DEG, from: 1, until: 3.5, centre: "couple" },
  tour45Trois: { straight: true, angle: -45 * DEG, from: 1, until: 3, centre: "couple" },
  tour45Suiveuse: { straight: true, angle: -45 * DEG, from: 1, until: 3.5, centre: "suiveuse" },
  tour60: { straight: true, angle: -60 * DEG, from: 1, until: 3.5, centre: "couple" },
};
export const SORTIE_TOUR: { v: SortieTour | null } = { v: null };
export const setSortieTour = (name: string | null | undefined) => { SORTIE_TOUR.v = (name && SORTIE_TOURS[name]) || null; };
/** #220: where a right foot pivots, its ball, from the ankle (own frame, foot yaw 0; measured on the GLB, #208). */
/** #220: the couple turn a flying foot's path is drawn in, per role: `mix`, from the one it left in to the one it lands
 * in, as the foot goes; `now`, the couple's turn at that instant. Measured on the GLB soles (quinconce, amplitude 1): the
 * follower's D3, which goes back past her G2, needs `mix` (with `now` it brushes her G2's heel); the leader's D4, which
 * comes back round his G3 landed late in the turn, needs `now` (with `mix` it brushes his G3). */
export const SORTIE_TOUR_PATH: Record<"leader" | "follower", "mix" | "now"> = { leader: "now", follower: "mix" };
/** R34 (#220): beats over which a foot that leaves lets go of the pelvis height. */
export const SORTIE_REACH_HOLD = 0.6;
export const SORTIE_BALL: FootPoint = { x: -0.01684, z: 0.11664 };
const ease5 = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * t * (10 - 15 * t + 6 * t * t); };
/** Positive angle: yaw towards the left (anticlockwise), as in src/quartsPaire.ts. */
const rotate = (p: FootPoint, th: number): FootPoint => ({ x: p.x * Math.cos(th) + p.z * Math.sin(th), z: -p.x * Math.sin(th) + p.z * Math.cos(th) });
const about = (c: FootPoint, p: FootPoint, th: number): FootPoint => { const v = rotate({ x: p.x - c.x, z: p.z - c.z }, th); return { x: c.x + v.x, z: c.z + v.z }; };
const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const interpolate = (a: FootPoint, b: FootPoint, t: number): FootPoint => ({ x: mix(a.x, b.x, t), z: mix(a.z, b.z, t) });

export function sortieGarconBeat(beat: number): number {
  return Number.isFinite(beat) ? Math.max(0, Math.min(SORTIE_GARCON_BEATS, beat)) : 0;
}
export function sortieGarconSettings(params: URLSearchParams): { variant: SortieVariant; contra: number; beat: number } {
  const raw = params.get("sortieContra");
  const contra = raw !== null && raw.trim() !== "" ? Number(raw) : DEFAULT_SORTIE_CONTRA;
  return { variant: params.get("sortieVariant") === "right" ? "right" : "line",
    contra: Number.isFinite(contra) ? Math.max(0, Math.min(30, contra)) : DEFAULT_SORTIE_CONTRA,
    beat: sortieGarconBeat(Number(params.get("sortieBeat") ?? 0)) };
}

/** #157 (docs/spec-ginga-couple.md): the most ginga the sorties leave room for (share of the style's hip
 * sway, bounce in metres), measured on the GLB: beyond, the right thighs meet where the couple is in
 * quinconce (start and end), and the leader's right thigh meets the follower's left leg in semba. */
export const SORTIE_GINGA_CAP = { sway: 0.3, bounce: 0.009 };
/** #163 (owner: « Trop discret. »): where the sortie garçon leaves room above that cap (beats). Measured on
 * the GLB with the cap ignored and the `ample` setting: the leg bones only cross at the start (up to 0.25),
 * once around 3.31 and from 4.88 on. The room opens over `from`, closes over `notch` (down, held, up) and
 * for good over `until`. */
export const SORTIE_GARCON_GINGA_ROOM = { from: [0.4, 0.8], notch: [2.95, 3.2, 3.42, 3.67], until: [4.2, 4.6] };
/** #163: two spots where the sortie garçon leaves no room for the ginga at all, found at a sixteenth of a
 * beat (the checks of #157 sampled every eighth): at 0.19 the two right femurs meet with the sway of
 * `marque` (kizomba), and at 3.31 the leader's left tibia meets his own right kneecap with any ginga
 * (suave). The sway opens over `swayFrom`; sway and bounce close over `notch` (down, held, up). */
export const SORTIE_GARCON_GINGA = { swayFrom: [0.15, 0.5], notch: [3.0, 3.2, 3.42, 3.62] };
/** Smooth window: 0 before `a`, 1 from `b`. */
const rise = (x: number, [a, b]: number[]) => smooth((x - a) / (b - a));
/** Room (0 to 1) of a profile `{ from, notch?, until }` at a beat. */
export const gingaWindow = (x: number, w: { from: number[]; notch?: number[]; until: number[] }) =>
  rise(x, w.from) * (1 - rise(x, w.until)) * (w.notch ? 1 - rise(x, w.notch.slice(0, 2)) * (1 - rise(x, w.notch.slice(2))) : 1);

export function sampleSortieGarcon(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  variant: SortieVariant = "line", contraDegrees = DEFAULT_SORTIE_CONTRA,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0,
  tour: SortieTour | null = SORTIE_TOUR.v): SortieGarconSample {
  const b = sortieGarconBeat(beat);
  const index = Math.min(4, Math.floor(b));
  const t = b - index;
  const shift = variant === "right" ? 0.10 : 0;
  // Owner requests (19 Nov.):
  // - Step 1 is more forward than sideways (36 cm forward, 30 cm left): the leader's forward
  //   intention makes the partner retreat (D1: 16 cm). With the feet pointing forward, G1 must stay
  //   9 cm clear of D2 laterally. This holds at every amplitude.
  // - At action 2 the middle of the right thighs touch. The partner's G2 retreats 22 cm (not 40) and
  //   the leader's D2 goes 46 cm (not 40): the pelvises are 16 cm apart along the line instead of 40.
  //   The leader's pelvis sits 2.5 cm inside his D, which stays out for the partner's D3 to pass,
  //   and moves 7 cm further during the crossing so that G clears D. `contact` (1 up to amplitude 1,
  //   0 at amplitude 2) returns to the earlier, looser arrival where large style motion would make
  //   the femurs cross.
  const touch = Number.isFinite(contact) ? Math.max(0, Math.min(1, contact)) : 1;
  // Absolute offsets from the initial ankle positions, in each dancer's local frame.
  // The follower retreats with D/G/D/G; it never copies the leader's exit or crossing.
  const steps: [FigureFoot, FootPoint][] = follower ? [
    ["R", { x: 0, z: -SORTIE_GARCON_POS2.d1 }], ["L", { x: 0, z: mix(-0.40, -SORTIE_GARCON_POS2.g2, touch) }],
    ["R", { x: 0, z: -0.70 }], ["L", { x: shift, z: -0.70 }],
    ["R", { x: shift, z: -0.70 }],
  ] : [
    ["L", { x: mix(0.30, SORTIE_GARCON_EXIT.step1X, touch), z: 0.42 }], ["R", { x: mix(0.34, SORTIE_GARCON_EXIT.step2X, touch), z: mix(0.40, 0.46, touch) }],
    ["L", { x: 0, z: 0.70 }], ["R", { x: -shift, z: 0.70 }],
    ["L", { x: -shift, z: 0.70 }],
  ];
  // Couple placement (docs/spec-placements-couple.md): both feet start shifted by o. A landing
  // either keeps o (same step amplitude) or lands on the validated target; the relative arrival
  // (D/D at action 2) and everything after it are validated, so the figure ends unchanged.
  const o = placementOffset(placement);
  // The D/D arrival comes right after the first step: keeping G1's amplitude would raise the
  // leader's pelvis (its height depends on the free foot) and open the thigh gap past the 3 cm
  // proximity threshold. Every landing is therefore validated; each foot absorbs o on its first step.
  const shifted = [false, false, false, false, false];
  // #48: the neutral position is the quinconce. Once the couple is back face to face on the line (D4
  // and marka G5 of the leader, G4 and marka D5 of the follower), the landings are neutral again:
  // shift o, feet under the hips and the right foot's stagger, as at the start.
  const neutral = [false, false, false, true, true];
  // Initial/neutral stance: each foot `stance` further out (feet under the hips), absorbed on its first step.
  const widen = Number.isFinite(stance) ? stance : 0;
  const stagger = (o.stagger ?? 0) / 2;
  // #56: each landing of action i takes back (1 - share) of the couple's progression along the
  // line (forward for the leader, backward in the follower's own frame): planted feet never slide.
  // Which progression each landing takes (measured on the GLB, six styles, three placements): the
  // follower's D1 and the leader's G1 that of action 2 (her D and his D2 keep their edge-to-edge
  // contact, his G knee clears her D thigh), his crossing G3 that of his D2 (it still crosses in
  // front of it); the couple then progresses at action 4.
  const lineIndex = follower ? SORTIE_GARCON_TRAVEL.follower : SORTIE_GARCON_TRAVEL.leader;
  const progression = (at: number) => {
    const k = Math.min(SORTIE_GARCON_LINE.length - 2, Math.floor(at));
    return SORTIE_GARCON_LINE[k] + (SORTIE_GARCON_LINE[k + 1] - SORTIE_GARCON_LINE[k]) * (at - k);
  };
  const line = (i: number) => (follower ? 1 : -1) * (1 - SORTIE_GARCON_TRAVEL.share) * progression(lineIndex[i]);
  const target = (i: number, side: FigureFoot, offset: FootPoint): FootPoint => {
    const shift = shifted[i] || neutral[i] ? 1 : 0, home = neutral[i] ? 1 : 0;
    return { x: rest[side].x + offset.x + o.x * shift + (side === "L" ? widen : -widen) * home,
      z: rest[side].z + offset.z + o.z * shift + (side === "R" ? stagger : 0) * home + line(i) };
  };
  const positions = { L: { x: rest.L.x + widen + o.x, z: rest.L.z + o.z }, R: { x: rest.R.x - widen + o.x, z: rest.R.z + o.z + stagger } };
  // #220 (`straight`): her D1 keeps its lane (o and the stance). His D2 does not follow it (as close as before, the right
  // thighs met in suave with the game's ginga): the right feet are 2.7 cm further apart at position 2.
  const dd = tour?.straight ? o.x - widen : 0;
  const landing = (i: number, side: FigureFoot, offset: FootPoint): FootPoint => {
    const p = target(i, side, offset);
    return follower && i === 0 && dd ? { x: positions.R.x, z: p.z } : p;
  };
  // At the crossing the pelvis stays between the feet; returning it to x=0 before
  // D follows would over-stretch that leg and force G's knee into the partner.
  const bodyAt = (action: number, offset: FootPoint): FootPoint =>
    !follower && action === 0 ? { x: SORTIE_GARCON_EXIT.body0X, z: 0.18 }
    // #130: at position 2 the pelvis stands a little behind his D and to his left of it (#104 had it
    // over the D): the D feet and knees come close without a frontal contact of the pelvises.
    : !follower && action === 1 ? { x: rest.R.x + SORTIE_GARCON_EXIT.step2X + SORTIE_GARCON_POS2.inward, z: offset.z - SORTIE_GARCON_POS2.back }
    : !follower && action === 2 ? { x: 0.17, z: mix(0.55, 0.62, touch) }
    // #56: closer to the leader after the shorter progression, the partner's pelvis stays 1.5 cm behind
    // her G4: over it, her G thigh meets his D thigh in the interleaved quinconce (right variant).
    : follower && action === 3 ? { x: offset.x, z: offset.z - SORTIE_GARCON_TRAVEL.behind } : offset;
  const bodyAfter = (action: number, offset: FootPoint): FootPoint => {
    const point = bodyAt(action, offset);
    return { x: point.x, z: point.z + line(action) };
  };
  const shiftedBody = (point: FootPoint, weight: number): FootPoint =>
    ({ x: point.x + o.x * weight, z: point.z + o.z * weight });
  // #213: where the pelvis stands after each action (P[0] before the first). The pelvis follows the shift of the
  // support foot, so it is validated whenever the dancer stands on a validated landing (the D/D arrival in particular).
  const P: FootPoint[] = [shiftedBody({ x: 0, z: 0 }, 1)];
  for (let i = 0; i < 4; i++) P.push(shiftedBody(bodyAfter(i, steps[i][1]), shifted[i] || neutral[i] ? 1 : 0));
  // #220 (`straight`): her pelvis goes straight back over her D1.
  if (follower && dd) P[1] = { x: P[0].x, z: P[1].z };
  let support: FigureFoot = follower ? "L" : "R";
  for (let i = 0; i < index; i++) {
    const [side, offset] = steps[i];
    positions[side] = landing(i, side, offset);
    if (i < 4) support = side;
  }
  const [moving, offset] = steps[index];
  const from = positions[moving];
  const to = landing(index, moving, offset);
  const positionsBefore = { ...positions }, landingNow = to;
  // The leader's forward intention starts in the frame: his G1 (and pelvis) leave 0.1 beat after the
  // partner's D1, so his knee never meets her thigh before she retreats (face-à-face placement).
  // #50: the leader's G3 crosses once the follower's D3 has stepped out of the D/D foot contact; at
  // 0.2 beat his G shin passes in front of his D knee once the pelvis has made room (six styles).
  // #88 (owner: « le suiveur est soit en même temps que le leader soit très légèrement en retard, il ne
  // peut pas être en avance »): the follower's step leaves when the leader's does, `SORTIE_GARCON_SYNC`
  // later (her span is shortened by as much, so she still lands on time).
  const leadOf = (i: number) => (i === 0 ? STEP1_LEAD : i === 2 ? STEP3_LEAD : i === 3 ? SORTIE_GARCON_SYNC.step4 : 0) + (follower ? SORTIE_GARCON_SYNC.lag : 0);
  const lead = leadOf(index);
  // #213 (R45): the pelvis's way towards each landing, from `head` beats before the step leaves to the beat; the ways of
  // two actions overlap, so the pelvis never stops. Without `head` each way starts when its step leaves (as before).
  // At the crossing (action 3) the pelvises start half as early: sooner, the follower's D3 leaving the D/D contact
  // brings her right femur against his while his G3 crosses (suave, with the game's ginga; measured on the GLB).
  const G = FIGURE_GESTURE.v;
  const wayStart = (i: number) => Math.max(0, i + leadOf(i) - G.head * (i === 2 ? SORTIE_GARCON_CROSS_HEAD : 1));
  const way = (i: number, at: number) => figureWay(at, wayStart(i), i + 1);
  // D4 returns behind the planted G once the partner's G4 has left (same 0.65 touchdown).
  const spanOf = (i: number) => !follower && i === 3 ? 0.65 - SORTIE_GARCON_SYNC.step4
    : follower && i === 3 && SORTIE_GARCON_SYNC.g4span > 0 ? SORTIE_GARCON_SYNC.g4span
    : follower ? Math.max(0.3, 0.6 - leadOf(i) * SORTIE_GARCON_SYNC.keepLanding) : 0.6;
  const span = spanOf(index);
  const flight = Math.max(0, Math.min(1, (t - lead) / span));
  // #49: a walking step (heel rise, swing, heel strike or ball landing); the marka only touches.
  // Crossing (G3 in front of D) and uncrossing (D4) roll little: a heel strike with the toes up would
  // bring the leader's G shin against his D thigh, a full heel rise his D knee into his G leg. The D2
  // closes into the D/D foot contact: it is placed flat, not rolled (the rolling knee would cross the
  // partner's D thigh). The partner's D1 leaves at once, before the leader's G1 heel rise reaches her;
  // #56: with her shorter D1 his G1 rolls little too (a full heel rise pushes his knee into her thigh).
  const gait = gaitStep(flight, { x: to.x - from.x, z: to.z - from.z }, 0, !follower && (index === 0 || index === 2 || index === 3) || follower && index === 0 ? 0.3 : !follower && index === 1 ? 0 : 1);
  const along = index === 4 ? flight : followWay(gait.progress, b, index + lead, index + lead + span, at => way(index, at));
  let point = interpolate(from, to, smooth(along));
  // D2 slides sideways past the partner's right knee, then advances; G crosses in front of the planted D.
  // From the interleaved quinconce start, the partner's first two steps retreat before sliding back
  // to the validated lane, so a foot in contact with the leader's never slides into it.
  // #50: at action 2 the right feet meet outer edge to outer edge. Their wide forefeet must not slide
  // past each other: the leader's D2 goes round, advances, then closes sideways into the contact; the
  // follower's D3 first steps sideways out of it before retreating.
  // The detour widens only with the contact: the looser arrival keeps its narrower path past G1.
  const aside = mix(0.03, SORTIE_GARCON_EXIT.aside, touch);
  const vias: FootPoint[] = follower && index < 2 && Math.abs(to.x - from.x) > 1e-6 ? [{ x: from.x, z: to.z }]
    // #56: with the shorter progression the partner's D1 is only 11 cm back: his D2 first steps 5 cm
    // back so that the forefeet clear each other while it goes round.
    : !follower && index === 1 ? [{ x: from.x, z: from.z - SORTIE_GARCON_EXIT.back }, { x: to.x + aside, z: from.z - SORTIE_GARCON_EXIT.back }, { x: to.x + aside, z: to.z }]
    : follower && index === 2 ? [{ x: from.x + aside, z: mix(from.z, to.z, 0.3) }]
    : !follower && index === 2 ? [{ x: from.x, z: to.z }]
    : !follower && index === 3 ? (SORTIE_GARCON_SYNC.d4 === "back" ? [{ x: from.x, z: to.z }] : SORTIE_GARCON_SYNC.d4 === "diagonal" ? [] : [{ x: to.x, z: from.z }])
    // #48: into the neutral quinconce the marka feet move sideways first, then slide along their own
    // axis into the interleave (forefeet side by side).
    : index === 4 && Math.abs(to.x - from.x) > 1e-6 ? [{ x: to.x, z: from.z }] : [];
  if (vias.length) {
    const path = [from, ...vias, to], segments = path.length - 1;
    const k = Math.min(segments - 1, Math.floor(along * segments));
    point = interpolate(path[k], path[k + 1], smooth(along * segments - k));
  }
  const lift = index === 4 ? 0.005 * Math.sin(Math.PI * flight) ** 2 : gait.lift;
  const feet: Record<FigureFoot, FigureFootPose> = {
    L: { ...positions.L, yaw: 0, lift: 0 }, R: { ...positions.R, yaw: 0, lift: 0 },
  };
  feet[moving] = { ...point, yaw: 0, lift, ...(index === 4 ? {} : { pitch: gait.pitch, pivot: gait.pivot }) };
  const transfer = index < 4 ? smooth((t - 0.65) / 0.35) : 0;
  const oldR = support === "R" ? 1 : 0;
  const loadR = mix(oldR, moving === "R" ? 1 : 0, transfer);
  const root = { ...P[0] };
  for (let i = 0; i < 4; i++) { const w = way(i, b); root.x += (P[i + 1].x - P[i].x) * w; root.z += (P[i + 1].z - P[i].z) * w; }
  // #104: on his way to stand over his D, the leader's pelvis passes a little to his left while the
  // follower's pelvis opens with her G2 (face to face, straight ahead it meets her right thigh mid-step).
  if (!follower) root.x += SORTIE_GARCON_POS2.pass * Math.sin(Math.PI * Math.max(0, Math.min(1, (b - wayStart(1)) / (2 - wayStart(1))))) ** 2;
  // Same local yaw for both partners, whose outer frames differ by π.
  const exit = b < 1 ? smooth(b) : b < 2 ? 1 : b < 3 ? 1 - smooth(b - 2) : 0;
  const contra = Number.isFinite(contraDegrees) ? Math.max(0, Math.min(30, contraDegrees)) : DEFAULT_SORTIE_CONTRA;
  const N = SORTIE_GARCON_GINGA.notch, notchRoom = 1 - rise(b, N.slice(0, 2)) * (1 - rise(b, N.slice(2)));
  // R34 (#220): the moving foot keeps bounding the pelvis from where it left, letting go over `SORTIE_REACH_HOLD` beats
  // from its departure (past its landing if need be): leaving a far place (her G4, 45 cm in front of her D3), it let
  // the pelvis jump up 11 cm within a twelfth of a beat.
  const letGo = smooth((t - lead) / SORTIE_REACH_HOLD);
  const reachFrom = index < 4 && letGo < 1 ? { side: moving, x: from.x, z: from.z, release: letGo } : undefined;
  const sample: SortieGarconSample = { beat: b, action: Math.ceil(b), moving, feet, root, loadR, loadL: 1 - loadR,
    chestYaw: -contra * Math.PI / 180 * exit, coupling: Math.max(startCoupling(b, o), endCoupling(b, o)), gingaCap: SORTIE_GINGA_CAP,
    gingaRoom: { sway: rise(b, SORTIE_GARCON_GINGA.swayFrom) * notchRoom, bounce: notchRoom },
    gingaCapRoom: { sway: gingaWindow(b, SORTIE_GARCON_GINGA_ROOM), bounce: gingaWindow(b, SORTIE_GARCON_GINGA_ROOM) },
    ...(reachFrom ? { reachFrom } : {}) };
  if (!tour || !tour.angle) return sample;
  // #220: the couple turns. Centre in this dancer's own frame (the leader's frame is the couple frame moved by dz, the
  // follower's is also turned by π: a turn about a point keeps its angle in both).
  const dz = SORTIE_GARCON_PAIR_DZ, toCouple = (p: FootPoint, f: boolean) => (f ? { x: -p.x, z: dz - p.z } : { x: p.x, z: p.z - dz });
  const pelvisAt2 = (f: boolean) => toCouple(f === follower ? { x: P[2].x, z: P[2].z } : sampleSortieGarcon(2, f, rest, variant, contraDegrees, placement, contact, stance, { ...tour, angle: 0 }).root, f);
  const her = pelvisAt2(true), centre = tour.centre === "suiveuse" ? her : (() => { const him = pelvisAt2(false); return { x: (her.x + him.x) / 2, z: (her.z + him.z) / 2 }; })();
  const c = follower ? { x: -centre.x, z: dz - centre.z } : { x: centre.x, z: centre.z + dz };
  const theta = (time: number) => tour.angle * ease5((time - tour.from) / (tour.until - tour.from));
  const landAt = (i: number) => (i < 0 ? 0 : i + leadOf(i) + spanOf(i));
  const lastOf = (side: FigureFoot, before: number) => { for (let i = before - 1; i >= 0; i--) if (steps[i][0] === side) return i; return -1; };
  const ball = (side: FigureFoot, yaw: number) => rotate(side === "R" ? SORTIE_BALL : { x: -SORTIE_BALL.x, z: SORTIE_BALL.z }, yaw);
  // A foot placed by action k lands turned as far as the couple then; it carries the weight until the other foot lands
  // (no transfer at the marka) and pivots on its ball meanwhile.
  const placed = (side: FigureFoot, k: number) => {
    const at = theta(landAt(k)), release = k + 1 <= 3 ? landAt(k + 1) : Infinity;
    const yaw = theta(Math.max(landAt(k), Math.min(b, release)));
    return { at, yaw, shift: { x: ball(side, at).x - ball(side, yaw).x, z: ball(side, at).z - ball(side, yaw).z } };
  };
  // Where a foot placed by action k stands now: landed in its turned couple, then pivoted on its ball.
  const standing = (side: FigureFoot, k: number, unturned: FootPoint) => {
    const p = placed(side, k), q = about(c, unturned, p.at);
    return { ...p, ankle: { x: q.x + p.shift.x, z: q.z + p.shift.z } };
  };
  const unturned = { L: { ...feet.L }, R: { ...feet.R } };
  for (const side of ["L", "R"] as FigureFoot[]) {
    const foot = unturned[side];
    if (side !== moving || b >= landAt(index)) {
      const now = standing(side, side === moving ? index : lastOf(side, index), foot);
      feet[side] = { ...foot, x: now.ankle.x, z: now.ankle.z, yaw: foot.yaw + now.yaw };
    } else {
      // The flying foot: its path in the couple turned as far as now, from where it left (its last place, turned and
      // pivoted) to where it lands in the couple turned as far as at its landing.
      const k = lastOf(side, index), from = standing(side, k, positionsBefore[side]);
      const land = theta(landAt(index)), s = smooth(along), at = about(c, landingNow, land);
      // The path is turned as far as `now`; at both ends it is put back where the foot left and where it lands.
      const mode = SORTIE_TOUR_PATH[follower ? "follower" : "leader"], leave = index + leadOf(index);
      const now = mode === "now" ? theta(b) : mix(from.at, land, s);
      const path = about(c, foot, now), start = about(c, positionsBefore[side], mode === "now" ? theta(leave) : from.at), end = about(c, landingNow, land);
      feet[side] = { ...foot, x: path.x + (1 - s) * (from.ankle.x - start.x) + s * (at.x - end.x), z: path.z + (1 - s) * (from.ankle.z - start.z) + s * (at.z - end.z),
        yaw: foot.yaw + mix(from.yaw, land, s) };
    }
  }
  const turned = theta(b), r = about(c, root, turned);
  return { ...sample, root: { x: r.x, z: r.z }, rootYaw: turned };
}
/** A sortie garçon sample, in the dancer's own frame. */
export interface SortieGarconSample {
  beat: number; action: number; moving: FigureFoot; feet: Record<FigureFoot, FigureFootPose>; root: FootPoint;
  /** #220: the couple's turn (0 without `?sortieTour=`). */
  rootYaw?: number;
  /** R34 (#220): the moving foot's departure, which still bounds the pelvis height while it lets go (src/pose.ts). */
  reachFrom?: { side: FigureFoot; x: number; z: number; release: number };
  loadR: number; loadL: number; chestYaw: number; coupling: number; gingaCap: { sway: number; bounce: number };
  gingaRoom: { sway: number; bounce: number }; gingaCapRoom: { sway: number; bounce: number };
}
