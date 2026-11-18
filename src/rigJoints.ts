/** Shared by JSX and the GLB integration fixture; offsets are in metres. */
export const TORSO_JOINTS = {
  spine: [0, 0.08, 0], lumbar: [0, 0.05, 0], thoracic: [0, 0.13, 0],
  chest: [0, 0.24, 0], head: [0, 0.28, 0],
} satisfies Record<string, [number, number, number]>;
