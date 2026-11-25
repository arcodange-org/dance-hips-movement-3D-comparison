/**
 * #213, #214 (rule R45, docs/spec-sorties-geste.md): the hip carries the step in the pair figures, as in the « 1 2 »
 * (#209, src/umDois.ts). Elected for the « 1 2 » on 25 Nov. 2026 (the hip first) and applied to the sorties: the
 * pelvis starts towards the next landing before the foot leaves, and the foot follows the pelvis's way. Each step
 * keeps the instant it lands (calibrated against the partner's legs), and the weight passes as before. Pure.
 * - `head`: beats by which the pelvis's way towards a landing starts before its step leaves;
 * - `follow`: the foot's way follows the pelvis's (1) instead of its own walking ease (0).
 * `ancien` (both zero) is the former timing: a step, then the hip. `?geste=ancien` shows it.
 */
export interface FigureGesture { head: number; follow: number }
export const FIGURE_GESTURES: Record<string, FigureGesture> = {
  ancien: { head: 0, follow: 0 },
  hancheDabord: { head: 0.3, follow: 1 },
};
export const FIGURE_GESTURE_ELECTED = "hancheDabord";
export const FIGURE_GESTURE = { v: FIGURE_GESTURES[FIGURE_GESTURE_ELECTED] };
export const setFigureGesture = (name?: string | null) => { FIGURE_GESTURE.v = (name && FIGURE_GESTURES[name]) || FIGURE_GESTURES[FIGURE_GESTURE_ELECTED]; };

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
/** Share (0 to 1) of the way from `from` to `to` (beats) at `at`. */
export const figureWay = (at: number, from: number, to: number) => smooth((at - from) / Math.max(1e-6, to - from));
/** The foot's progress along its path, `ease` its own walking progress at `at`, when it follows the pelvis's way
 * `way` (a function of the beat) between its leaving `leave` and its landing `land`. */
export function followWay(ease: number, at: number, leave: number, land: number, way: (beat: number) => number): number {
  const follow = FIGURE_GESTURE.v.follow;
  if (follow <= 0 || at <= leave) return ease;
  const w0 = way(leave), w1 = way(land);
  return ease + (smooth((way(at) - w0) / Math.max(1e-6, w1 - w0)) - ease) * follow;
}
