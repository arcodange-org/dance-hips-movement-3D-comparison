/** Validated five-action figure. GLB coordinates: left +x, forward +z. */
import { gaitStep } from "./gait";
import { placementOffset, startCoupling, endCoupling, type CouplePlacement, type PlacementOffset } from "./placement";
export type FigureFoot = "L" | "R";
export type SortieVariant = "line" | "right";
export interface FootPoint { x: number; z: number }
export interface FigureFootPose extends FootPoint { yaw: number; lift: number;
  /** #49: rolling foot (src/gait.ts). */
  pitch?: number; pivot?: "ball" | "heel" | null }
export const SORTIE_GARCON_BEATS = 5;
// Half-spacing calibrated for this figure's real leg meshes; other pair figures retain PAIR_DZ.
export const SORTIE_GARCON_PAIR_DZ = 0.20;
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

export function sampleSortieGarcon(beat: number, follower: boolean, rest: Record<FigureFoot, FootPoint>,
  variant: SortieVariant = "line", contraDegrees = DEFAULT_SORTIE_CONTRA,
  placement: CouplePlacement | "reference" | PlacementOffset = "reference", contact = 1, stance = 0) {
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
  const shiftOf: Record<FigureFoot, number> = { L: 1, R: 1 };
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
  let support: FigureFoot = follower ? "L" : "R";
  let body: FootPoint = { x: 0, z: 0 };
  for (let i = 0; i < index; i++) {
    const [side, offset] = steps[i];
    positions[side] = target(i, side, offset);
    shiftOf[side] = shifted[i] || neutral[i] ? 1 : 0;
    if (i < 4) { support = side; body = bodyAfter(i, offset); }
  }
  const [moving, offset] = steps[index];
  const from = positions[moving];
  const to = target(index, moving, offset);
  // The pelvis follows the shift of the support foot, so it is validated whenever the dancer
  // stands on a validated landing (the D/D arrival in particular).
  const weightBefore = shiftOf[support];
  const weightAfter = index < 4 ? (shifted[index] || neutral[index] ? 1 : 0) : weightBefore;
  const shiftedBody = (point: FootPoint, weight: number): FootPoint =>
    ({ x: point.x + o.x * weight, z: point.z + o.z * weight });
  // The leader's forward intention starts in the frame: his G1 (and pelvis) leave 0.1 beat after the
  // partner's D1, so his knee never meets her thigh before she retreats (face-à-face placement).
  // #50: the leader's G3 crosses once the follower's D3 has stepped out of the D/D foot contact; at
  // 0.2 beat his G shin passes in front of his D knee once the pelvis has made room (six styles).
  // #88 (owner: « le suiveur est soit en même temps que le leader soit très légèrement en retard, il ne
  // peut pas être en avance »): the follower's step leaves when the leader's does, `SORTIE_GARCON_SYNC`
  // later (her span is shortened by as much, so she still lands on time).
  const leaderLead = index === 0 ? STEP1_LEAD : index === 2 ? STEP3_LEAD : index === 3 ? SORTIE_GARCON_SYNC.step4 : 0;
  const lead = follower ? leaderLead + SORTIE_GARCON_SYNC.lag : leaderLead;
  // D4 returns behind the planted G once the partner's G4 has left (same 0.65 touchdown).
  const span = !follower && index === 3 ? 0.65 - SORTIE_GARCON_SYNC.step4
    : follower && index === 3 && SORTIE_GARCON_SYNC.g4span > 0 ? SORTIE_GARCON_SYNC.g4span
    : follower ? Math.max(0.3, 0.6 - lead * SORTIE_GARCON_SYNC.keepLanding) : 0.6;
  const flight = Math.max(0, Math.min(1, (t - lead) / span));
  // #49: a walking step (heel rise, swing, heel strike or ball landing); the marka only touches.
  // Crossing (G3 in front of D) and uncrossing (D4) roll little: a heel strike with the toes up would
  // bring the leader's G shin against his D thigh, a full heel rise his D knee into his G leg. The D2
  // closes into the D/D foot contact: it is placed flat, not rolled (the rolling knee would cross the
  // partner's D thigh). The partner's D1 leaves at once, before the leader's G1 heel rise reaches her;
  // #56: with her shorter D1 his G1 rolls little too (a full heel rise pushes his knee into her thigh).
  const gait = gaitStep(flight, { x: to.x - from.x, z: to.z - from.z }, 0, !follower && (index === 0 || index === 2 || index === 3) || follower && index === 0 ? 0.3 : !follower && index === 1 ? 0 : 1);
  const along = index === 4 ? flight : gait.progress;
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
  const root = index < 4
    ? interpolate(shiftedBody(body, weightBefore), shiftedBody(bodyAfter(index, offset), weightAfter),
      smooth((t - lead) / (1 - lead)))
    : shiftedBody(body, weightBefore);
  // #104: on his way to stand over his D, the leader's pelvis passes a little to his left while the
  // follower's pelvis opens with her G2 (face to face, straight ahead it meets her right thigh mid-step).
  if (!follower && index === 1) root.x += SORTIE_GARCON_POS2.pass * Math.sin(Math.PI * Math.max(0, Math.min(1, (t - lead) / (1 - lead)))) ** 2;
  // Same local yaw for both partners, whose outer frames differ by π.
  const exit = b < 1 ? smooth(b) : b < 2 ? 1 : b < 3 ? 1 - smooth(b - 2) : 0;
  const contra = Number.isFinite(contraDegrees) ? Math.max(0, Math.min(30, contraDegrees)) : DEFAULT_SORTIE_CONTRA;
  return { beat: b, action: Math.ceil(b), moving, feet, root, loadR, loadL: 1 - loadR,
    chestYaw: -contra * Math.PI / 180 * exit, coupling: Math.max(startCoupling(b, o), endCoupling(b, o)), gingaCap: SORTIE_GINGA_CAP };
}
