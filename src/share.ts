// Partage de la vue par URL : tous les paramètres d'état + l'angle de la caméra
// (position + cible de l'OrbitControls), sérialisés en query params `campos=`/`camtgt=`.

export function parseVec3(s: string | null | undefined): [number, number, number] | null {
  if (!s) return null;
  const p = s.split(",").map((x) => Number(x.trim()));
  if (p.length !== 3 || p.some((x) => !Number.isFinite(x))) return null;
  return [p[0], p[1], p[2]];
}

export function formatVec3(v: [number, number, number] | { x: number; y: number; z: number }): string {
  const a = Array.isArray(v) ? v : [v.x, v.y, v.z];
  return a.map((x) => +x.toFixed(2)).join(",");
}

export function buildShareUrl(
  base: string,
  state: Record<string, string | number | boolean | undefined>,
  camPos: [number, number, number] | null,
  camTgt: [number, number, number] | null,
  view?: { angle: number; zoom: number } | null
): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) {
    if (v === undefined || v === "") continue;
    p.set(k, typeof v === "boolean" ? (v ? "1" : "0") : String(v));
  }
  if (camPos) p.set("campos", formatVec3(camPos));
  if (camTgt) p.set("camtgt", formatVec3(camTgt));
  // Angle et zoom de vue lisibles dans l'URL (en plus de campos/camtgt exacts).
  if (view) {
    p.set("angle", String(+view.angle.toFixed(1)));
    p.set("zoom", String(+view.zoom.toFixed(2)));
  }
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}
