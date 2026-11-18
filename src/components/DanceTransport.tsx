import { useFrame } from "@react-three/fiber";
import { advanceClock, type DanceClock } from "../clock";

export default function DanceTransport({ clock, bpm, playing }: {
  clock: DanceClock; bpm: number; playing: boolean;
}) {
  // Run before both rigs, regardless of their mount order. Negative priority keeps
  // React Three Fiber's automatic renderer enabled.
  useFrame((_, delta) => advanceClock(clock, delta, bpm, playing), -100);
  return null;
}
