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

/** The foot `side` at the clock's beat `clock`. */
export function umDoisFoot(side: UmDoisSide, clock: number): UmDoisFoot {
  const T = UM_DOIS_TIMES;
  // Beats since this foot's marka: the left foot marks on the count 4 (clock 3), the right one on 2 (clock 1).
  const p = mod4(clock - (side === "L" ? 3 : 1));
  // `out`: 0 beside the other foot (where it marks), 1 stepped aside.
  let out: number, lift = 0, pitch: number, air: boolean;
  if (p < T.leave) { out = 0; pitch = T.heel; air = true; }
  else if (p < T.land) {
    const t = (p - T.leave) / (T.land - T.leave);
    out = smooth(t); lift = T.step * Math.sin(Math.PI * t) ** 2; pitch = T.heel * (1 - smooth(t)); air = true;
  } else if (p < T.close[0]) { out = 1; pitch = T.heel * smooth((p - T.peel) / (T.close[0] - T.peel)); air = false; }
  else if (p < T.close[1]) {
    const t = (p - T.close[0]) / (T.close[1] - T.close[0]);
    out = 1 - smooth(t); lift = T.glide * Math.sin(Math.PI * t) ** 2; pitch = T.heel; air = true;
  } else { out = 0; pitch = T.heel; air = true; }
  // The left foot steps aside to the left place and marks at the right place; the right foot, the reverse.
  return { place: side === "L" ? out : 1 - out, lift, pitch, air };
}

/** How far the body has travelled, 0 (right place) to 1 (left place): carried across during the beat of each
 * transfer, half a wave per beat (no jolt), half-way between the two places at the middle of the beat. */
export function umDoisCarry(clock: number): number {
  const p = mod4(clock), wave = (v: number) => (1 - Math.cos(Math.PI * v)) / 2;
  return p < 1 ? 1 : p < 2 ? 1 - wave(p - 1) : p < 3 ? 0 : wave(p - 3);
}
