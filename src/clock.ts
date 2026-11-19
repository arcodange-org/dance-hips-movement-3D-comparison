/** Shared transport: mounted rigs read the same beat and never own/reset time. */
export interface DanceClock { beat: number; exportFrame: number | null; revision: number }
export const createDanceClock = (): DanceClock => ({ beat: 0, exportFrame: null, revision: 0 });
export function seekClock(clock: DanceClock, beat: number): void {
  clock.beat = beat; clock.revision++;
}
export function advanceClock(clock: DanceClock, delta: number, bpm: number, playing: boolean, endBeat = Infinity): void {
  if (clock.exportFrame !== null) return;
  if (playing) clock.beat = Math.min(endBeat, clock.beat + Math.max(0, Math.min(delta, 0.1)) * bpm / 60);
}
export function cycleBeats(o: { movement?: string; quarts?: boolean; corridinho?: boolean; ida?: boolean; sortie?: boolean; temps3?: boolean }): number {
  if (o.movement === "sortieG" || o.movement === "sortieF") return 5;
  // Styles have periods dividing 4; marka steps have period 6.
  // Phase 17 : sortie combinée G→F = cycle de 16 temps (guideur 0–7, suiveur 8–15).
  const base = o.movement === "sortieGF" ? 16
    : o.quarts || o.corridinho ? 16 : o.ida || o.sortie ? 8 : 4;
  return o.temps3 ? base * 3 : base;
}
export function exportBeat(frame: number, fps: number, bpm: number): number {
  return frame * bpm / (60 * fps);
}
