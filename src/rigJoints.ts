/** Shared by JSX and the GLB integration fixture; offsets are in metres. */
export const TORSO_JOINTS = {
  spine: [0, 0.08, 0], lumbar: [0, 0.05, 0], thoracic: [0, 0.13, 0],
  chest: [0, 0.24, 0], head: [0, 0.28, 0],
} satisfies Record<string, [number, number, number]>;

/** #40: arms of the dance frame, shared by JSX and the GLB fixture (m). Shoulders in the chest frame,
 * elbow in the upper-arm frame, centre of the hand in the forearm frame (segments hang along -y). */
export const ARM_JOINTS = {
  shoulderL: [0.19, 0.1, 0], shoulderR: [-0.19, 0.1, 0], elbow: [0, -0.26, 0], hand: [0, -0.24, 0],
} satisfies Record<string, [number, number, number]>;

