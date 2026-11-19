import { useFrame } from "@react-three/fiber";
import { stepTransport, type ClockDriver, type DanceClock } from "../clock";

export default function DanceTransport({ clock, bpm, playing, endBeat = Infinity, onEnd, driver = null }: {
  clock: DanceClock; bpm: number; playing: boolean; endBeat?: number; onEnd?: () => void;
  /** Son actif : l'horloge audio pilote le temps (docs/spec-son-synthese.md). Absent : inchangé. */
  driver?: ClockDriver | null;
}) {
  // Run before both rigs, regardless of their mount order. Negative priority keeps
  // React Three Fiber's automatic renderer enabled.
  useFrame((_, delta) => {
    stepTransport(clock, delta, bpm, playing, endBeat, driver);
    if (playing && clock.exportFrame === null && clock.beat >= endBeat) onEnd?.();
  }, -100);
  return null;
}
