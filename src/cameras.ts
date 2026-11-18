// Presets caméra (testables purs) : "default", "hip", "fixed", "wide", "diag", "front", "back".
// En mode paire, la caméra par défaut est "diag" : le couple étant sur la ligne de danse
// (face à face selon z), la vue de face/diago rend la sortie (axe x) visible — un profil
// orthonormé la mettrait en profondeur, invisible.
export interface CamPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export const CAM_PRESETS: Record<string, CamPreset> = {
  default: { position: [0, 1.2, 3.4], target: [0, 0.88, 0] },
  hip: { position: [0, 0.98, 2.35], target: [0, 0.8, 0] },
  fixed: { position: [0, 1.25, 4.0], target: [0, 0.88, 0] },
  wide: { position: [0, 1.35, 4.6], target: [0, 0.88, 0] },
  diag: { position: [3.3, 1.5, 3.3], target: [0, 0.85, 0] },
  front: { position: [4.8, 1.3, 0.4], target: [0, 0.85, 0] },
  back: { position: [-4.8, 1.3, 0.4], target: [0, 0.85, 0] },
};

// Buste plus opaque en capture (`?solid=1`) : on lit des corps, pas des squelettes.
export const SOLID_TORSO_OPACITY = 0.62;

export function resolveCam(preset: string | null, isPair: boolean): CamPreset {
  return CAM_PRESETS[preset ?? (isPair ? "diag" : "default")] ?? CAM_PRESETS.default;
}
