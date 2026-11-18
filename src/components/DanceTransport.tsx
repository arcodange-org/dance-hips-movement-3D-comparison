import { useFrame } from "@react-three/fiber";
import { advanceClock, type DanceClock } from "../clock";

export default function DanceTransport({ clock, bpm, playing, endBeat = Infinity, onEnd }: {
  clock: DanceClock; bpm: number; playing: boolean; endBeat?: number; onEnd?: () => void;
}) {
  // Run before both rigs, regardless of their mount order. Negative priority keeps
  // React Three Fiber's automatic renderer enabled.
  useFrame((_, delta) => {
    advanceClock(clock, delta, bpm, playing, endBeat);
    if (playing && clock.exportFrame === null && clock.beat >= endBeat) onEnd?.();
  }, -100);
  return null;
}
