/**
 * #196 (rule R42 of 24 Nov. 2026; docs/spec-pas-de-base-1-2.md): the « 1 2 », basic step of the kizomba and of
 * the semba, danced alone. Pure: where the two feet are and how far the body has travelled, at a beat of the
 * clock. The hip (the sits, the double bounce, the load) is the style's (`applySit`, src/styles.ts).
 *
 * Counts and clock: the « 1 » is the first beat of the bar, the clock's beat 0 (the count the page shows, the
 * first kick of the synthesized music). The weight lands on the left foot on 1 and 2 (clock 0 and 1), on the
 * right foot on 3 and 4 (clock 2 and 3).
 *
 * Two places for the pair of feet: the right place (the feet at rest, under the hips) and the left place (the
 * same, `ecart` further to the dancer's left). During the beat before 1 the left foot leaves its marka, steps
 * aside and lands flat half-way through the beat; the weight then passes onto it, both feet on the floor, and
 * is whole on it on 1. During the next beat the right foot joins it, close to the floor, and marks on 2: on the
 * ball of the foot, heel up, without weight. Then the right foot steps back aside for 3, and the left one joins
 * and marks on 4.
 */

export type UmDoisSide = "L" | "R";
/** One foot of the « 1 2 »: `place` 0 (right place) to 1 (left place), `lift` (m) above the floor, `pitch`
 * (rad, heel up) about the ball of the foot, `air`: the foot is off the floor or only touching it (no weight). */
export interface UmDoisFoot { place: number; lift: number; pitch: number; air: boolean }

/** Calendar of a foot within the four beats, counted from the beat on which it marks (its marka on 0):
 * it leaves its marka at `leave`, lands aside at `land`, carries the weight, leaves again at `close[0]` once
 * the weight has left it, is back beside the other foot at `close[1]` and marks until the next `leave`.
 * From `peel` its heel rises, the foot rolling onto its ball where it stands while the weight leaves it and the
 * body is carried away: the leg left behind reaches further that way, and the foot stays on its ball to close
 * and to mark.
 * `step`, `glide` (m): height of the foot in the step aside and in the return; `heel` (rad): the heel's rise
 * on the marka. */
export const UM_DOIS_TIMES = { leave: 0.05, land: 0.5, peel: 2.6, close: [3.1, 3.8] as const, step: 0.025, glide: 0.012, heel: 0.35 };

const smooth = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
const mod4 = (x: number) => ((x % 4) + 4) % 4;
const wave = (v: number) => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, v)))) / 2;

/** #209 (owner, 24 Nov. 2026; docs/spec-un-deux-geste.md): the hip's ginga carries the step aside, one gesture
 * instead of a foot set down and then the hip. Prototype to elect on film (`?geste=<name>`); nothing changes without
 * the parameter:
 * - `land`: beat into the step at which the stepping foot lands (today 0.5); the weight passes onto it from there to
 *   the count;
 * - `lead`: share of a beat by which the body starts across before the step's beat (today 0: it goes over the beat);
 * - `follow`: the foot's way across follows the body's (1) instead of its own quicker ease (0, today);
 * - `join`: the beats, counted from the foot's marka as in `UM_DOIS_TIMES.close`, over which the other foot joins
 *   it for the marca (today [3.1, 3.8]). */
export interface UmDoisGesture { land: number; lead: number; follow: number; join: readonly [number, number] }
export const UM_DOIS_GESTURE_TODAY: UmDoisGesture = { land: 0.5, lead: 0, follow: 0, join: [3.1, 3.8] };
export const UM_DOIS_GESTURES: Record<string, UmDoisGesture> = {
  ensemble: { land: 0.8, lead: 0, follow: 1, join: [3.0, 3.95] },
  hancheDabord: { land: 0.85, lead: 0.3, follow: 1, join: [3.0, 3.95] },
  hancheFinit: { land: 0.6, lead: 0, follow: 0.5, join: [3.0, 3.95] },
};
export const UM_DOIS_GESTURE = { v: UM_DOIS_GESTURE_TODAY };
export const setUmDoisGesture = (name?: string | null) => { UM_DOIS_GESTURE.v = (name && UM_DOIS_GESTURES[name]) || UM_DOIS_GESTURE_TODAY; };
/** Share of the body's way across, at `x` beats into the step's beat (from −`lead` to 1). */
const bodyWay = (x: number) => { const lead = UM_DOIS_GESTURE.v.lead; return wave((x + lead) / (1 + lead)); };

/** The foot `side` at the clock's beat `clock`. `body` (#209): where the body is across at a clock's beat, 0 (right
 * place) to 1 (left place), its sway included; a foot that follows the body (`UM_DOIS_GESTURE.v.follow`) follows
 * that way (by default the body's travel alone, `umDoisCarry`). */
export function umDoisFoot(side: UmDoisSide, clock: number, body: (clock: number) => number = umDoisCarry): UmDoisFoot {
  const T = UM_DOIS_TIMES, G = UM_DOIS_GESTURE.v, land = G.land, close = G.join;
  // Beats since this foot's marka: the left foot marks on the count 4 (clock 3), the right one on 2 (clock 1).
  const p = mod4(clock - (side === "L" ? 3 : 1));
  // `out`: 0 beside the other foot (where it marks), 1 stepped aside.
  let out: number, lift = 0, pitch: number, air: boolean;
  if (p < T.leave) { out = 0; pitch = T.heel; air = true; }
  else if (p < land) {
    const t = (p - T.leave) / (land - T.leave);
    // #209: the foot's way may follow the body's, from where the body is when the foot leaves to where it is when
    // the foot lands.
    out = smooth(t);
    if (G.follow > 0) {
      const c0 = clock - p, span = body(c0 + 1) - body(c0);
      const way = (x: number) => (body(c0 + x) - body(c0)) / (Math.abs(span) > 1e-6 ? span : 1);
      const from = way(T.leave), to = way(land), along = smooth((way(p) - from) / Math.max(1e-6, to - from));
      out += (along - out) * G.follow;
    }
    lift = T.step * Math.sin(Math.PI * t) ** 2; pitch = T.heel * (1 - smooth(t)); air = true;
  } else if (p < close[0]) { out = 1; pitch = T.heel * smooth((p - T.peel) / (close[0] - T.peel)); air = false; }
  else if (p < close[1]) {
    const t = (p - close[0]) / (close[1] - close[0]);
    out = 1 - smooth(t); lift = T.glide * Math.sin(Math.PI * t) ** 2; pitch = T.heel; air = true;
  } else { out = 0; pitch = T.heel; air = true; }
  // The left foot steps aside to the left place and marks at the right place; the right foot, the reverse.
  return { place: side === "L" ? out : 1 - out, lift, pitch, air };
}

/** How far the body has travelled, 0 (right place) to 1 (left place): carried across during the beat of each
 * transfer, half a wave per beat (no jolt), half-way between the two places at the middle of the beat. */
export function umDoisCarry(clock: number): number {
  // #209: with a `lead` the body starts across before the step's beat (its way is the same wave, longer).
  const p = mod4(clock), lead = UM_DOIS_GESTURE.v.lead;
  return p < 1 - lead ? 1 : p < 2 ? 1 - bodyWay(p - 1) : p < 3 - lead ? 0 : bodyWay(p - 3);
}
