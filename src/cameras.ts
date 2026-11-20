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
  // Vue plongeante légèrement de côté : pour lire le lacet des pieds (vírgula) par rapport
  // à la boussole fixe au repère.
  top: { position: [0.9, 4.4, 1.6], target: [0, 0.35, 0] },
  // #87 : point de vue du guideur, derrière son épaule gauche (+x), regardant la suiveuse (paire : le
  // guideur en z < 0, face à +z). Pour les GIF des figures en paire (`?cam=guideur`).
  guideur: { position: [0.45, 1.95, -2.8], target: [0, 0.75, 0.3] },
};

// Buste plus opaque en capture (`?solid=1`) : on lit des corps, pas des squelettes.
export const SOLID_TORSO_OPACITY = 0.62;

export function resolveCam(preset: string | null, isPair: boolean): CamPreset {
  return CAM_PRESETS[preset ?? (isPair ? "diag" : "default")] ?? CAM_PRESETS.default;
}

// Phase 11 — angle + zoom de vue explicites en URL (`?angle=&zoom=`) :
// az = azimut en degrés autour de la cible (0 = caméra côté +Z, 90 = côté +X = E/ligne de
// danse), el = élévation en degrés, dist = distance caméra→cible en mètres.
export interface ViewAngles {
  az: number;
  el: number;
  dist: number;
}

type Vec3Like = [number, number, number] | { x: number; y: number; z: number };

function asArr(v: Vec3Like): [number, number, number] {
  return Array.isArray(v) ? v : [v.x, v.y, v.z];
}

export function viewAnglesOf(pos: Vec3Like, tgt: Vec3Like): ViewAngles {
  const p = asArr(pos);
  const t = asArr(tgt);
  const dx = p[0] - t[0];
  const dy = p[1] - t[1];
  const dz = p[2] - t[2];
  return {
    az: (Math.atan2(dx, dz) * 180) / Math.PI,
    el: (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI,
    dist: Math.hypot(dx, dy, dz),
  };
}

// Inverse de viewAnglesOf : position de la caméra pour (az, el, dist) autour de tgt.
export function posFromView(
  tgt: Vec3Like,
  azDeg: number,
  elDeg: number,
  dist: number
): [number, number, number] {
  const t = asArr(tgt);
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  return [
    t[0] + dist * Math.cos(el) * Math.sin(az),
    t[1] + dist * Math.sin(el),
    t[2] + dist * Math.cos(el) * Math.cos(az),
  ];
}

// Applique les overrides URL sur un preset : sans angle/zoom -> preset inchangé ; angle=
// remplace l'azimut (normalisé 0–360) ; zoom= remplace la distance (clamp 0.5–20 m) ;
// l'élévation du preset est conservée. `campos`/`camtgt` restent prioritaires au chargement.
export function resolveView(
  preset: CamPreset,
  angleDeg?: number | null,
  zoom?: number | null
): CamPreset {
  const hasA = angleDeg !== null && angleDeg !== undefined && Number.isFinite(angleDeg);
  const hasZ = zoom !== null && zoom !== undefined && Number.isFinite(zoom) && zoom > 0;
  if (!hasA && !hasZ) return preset;
  const va = viewAnglesOf(preset.position, preset.target);
  const az = hasA ? (((angleDeg as number) % 360) + 360) % 360 : va.az;
  const dist = hasZ ? Math.min(20, Math.max(0.5, zoom as number)) : va.dist;
  return { position: posFromView(preset.target, az, va.el, dist), target: preset.target };
}
