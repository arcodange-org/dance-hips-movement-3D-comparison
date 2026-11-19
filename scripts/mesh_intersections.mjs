import * as THREE from "three";

// fromBufferAttribute handles normalized integer KHR_mesh_quantization attributes.
// geometry.boundingBox/setFromObject is not used: those boxes were observed at micrometre scale.
export function transformedMesh(mesh) {
  const p = mesh.geometry.attributes.position, vertices = [];
  for (let i = 0; i < p.count; i++) vertices.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld));
  const ix = mesh.geometry.index, count = ix ? ix.count : p.count, triangles = [];
  for (let i = 0; i < count; i += 3) {
    const points = [0, 1, 2].map(d => vertices[ix ? ix.getX(i + d) : i + d]);
    triangles.push({ points, box: new THREE.Box3().setFromPoints(points) });
  }
  return { vertices, triangles, box: new THREE.Box3().setFromPoints(vertices) };
}
const EPS = 1e-7;
function crossingEdgeTriangle(start, end, triangle) {
  const dir = end.clone().sub(start), length = dir.length();
  if (length < EPS) return null;
  const ray = new THREE.Ray(start, dir.divideScalar(length));
  const hit = ray.intersectTriangle(...triangle, false, new THREE.Vector3());
  if (!hit) return null;
  const d = hit.distanceTo(start);
  return d > EPS && d < length - EPS ? hit : null;
}
function inside(point, triangles) {
  const ray = new THREE.Ray(point, new THREE.Vector3(1, .312, .157).normalize()), distances = [];
  for (const triangle of triangles) {
    const hit = ray.intersectTriangle(...triangle.points, false, new THREE.Vector3());
    if (!hit) continue;
    const d = hit.distanceTo(point);
    if (d > EPS && !distances.some(x => Math.abs(x - d) < EPS)) distances.push(d);
  }
  return distances.length % 2 === 1;
}
export function meshIntersection(a, b) {
  if (!a.box.intersectsBox(b.box)) return null;
  for (const ta of a.triangles) for (const tb of b.triangles) {
    if (!ta.box.intersectsBox(tb.box)) continue;
    for (const [edges, target] of [[ta.points, tb.points], [tb.points, ta.points]]) for (let i = 0; i < 3; i++) {
      const hit = crossingEdgeTriangle(edges[i], edges[(i + 1) % 3], target);
      if (hit) return { type: 'triangle-crossing', point: hit.toArray() };
    }
  }
  // Also cover complete containment, which surface intersection alone would miss.
  for (const [source, target] of [[a, b], [b, a]]) for (const v of source.vertices) {
    if (target.box.containsPoint(v) && inside(v, target.triangles)) return { type: 'interior-vertex', point: v.toArray() };
  }
  return null;
}


// Actual foot convex hulls: conservative horizontal clearance, even when the swing is airborne.
export function footHull(points) {
  const sorted = points.map(p => [p.x, p.z]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = rows => { const h = []; for (const p of rows) { while (h.length > 1 && cross(h.at(-2), h.at(-1), p) <= 0) h.pop(); h.push(p); } return h; };
  return [...half(sorted).slice(0, -1), ...half([...sorted].reverse()).slice(0, -1)];
}
export function footHullsOverlap(a, b) {
  for (const polygon of [a, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length];
    const axis = [q[1] - p[1], p[0] - q[0]], length = Math.hypot(...axis);
    const project = v => (v[0] * axis[0] + v[1] * axis[1]) / length;
    const pa = a.map(project), pb = b.map(project);
    if (Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb)) <= .0001) return false;
  }
  return true;
}
