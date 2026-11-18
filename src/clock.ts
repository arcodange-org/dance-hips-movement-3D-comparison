/** Shared transport: mounted rigs read the same beat and never own/reset time. */
export interface DanceClock { beat: number; exportFrame: number | null }
export const createDanceClock = (): DanceClock => ({ beat: 0, exportFrame: null });
export function advanceClock(clock: DanceClock, delta: number, bpm: number, playing: boolean): void {
  if (clock.exportFrame !== null) return;
  if (playing) clock.beat += Math.max(0, Math.min(delta, 0.1)) * bpm / 60;
}
export function cycleBeats(o: { quarts?: boolean; corridinho?: boolean; ida?: boolean; sortie?: boolean; temps3?: boolean }): number {
  // Styles have periods dividing 4; marka steps have period 6.
  const movement = o.quarts || o.corridinho ? 16 : o.ida || o.sortie ? 8 : 4;
  return o.temps3 ? movement * 3 : movement;
}
export function exportBeat(frame: number, fps: number, bpm: number): number {
  return frame * bpm / (60 * fps);
}
