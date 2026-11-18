// Repères directionnels (demande 2026-11-18) : 4 directions cardinales + 4 « diago ».
// Le buste/les épaules font face à la direction du mouvement. Axes monde : E = +x = ligne de
// danse, W = -x, N = -z, S = +z (face à la caméra par défaut). Le danseur fait face à +z à
// root.rotation.y = 0.
export const DIR_LABELS = ["S", "SE", "E", "NE", "N", "NW", "W", "SW"] as const;

export function facingSector(ry: number): number {
  const k = Math.round(ry / (Math.PI / 4));
  return ((k % 8) + 8) % 8;
}

export function facingLabel(ry: number): string {
  return DIR_LABELS[facingSector(ry)];
}

export function isDiagonal(sector: number): boolean {
  return sector % 2 === 1;
}

// Position relative au repère fixe (origine) et à la ligne de dance (axe x) :
// along = déplacement le long de la ligne, across = perpendiculaire à la ligne.
export function relToLineOfDance(x: number, z: number): { along: number; across: number } {
  return { along: x, across: z };
}
