/**
 * #225 (docs/spec-pied-sur-la-plante.md): the toes of the anatomical foot, articulated.
 *
 * `public/anatomy.glb` holds the 26 bones of a foot in one mesh (`Foot_R`, `Foot_L`) under the ankle; each bone stays an
 * island of it (no edge joins two bones). The phalanges are the islands that start in the front of the foot: they are
 * moved, bone by bone, into a mesh of their own (`Toes_<side>`) under a node set on the line of the base of the toes
 * (`ToePivot_<side>`, child of the ankle). Copies of the geometries are cut: the GLB and its quantization do not change,
 * and at rest the two meshes are the original foot, vertex for vertex.
 */
import * as THREE from "three";

/** The most the big toe extends from its metatarsal in a dancer's demi-pointe (rad): about 90°, against 60 to 65° outside
 * dance (sources in the spec). The fold of the toes is this, less the extension the GLB's big toe has at rest. */
export const TOE_EXTENSION_MAX = Math.PI / 2;
/** An island that starts in the front 40 % of the foot is a toe bone (phalanges start from 68 % of the foot's length on
 * the GLB, metatarsals and tarsals before 48 %). */
export const TOE_START = 0.6;
/** Length (m) of a metatarsal's head, from its front end, where its centre is measured. */
const HEAD_LENGTH = 0.012;
/** Length (m) of the end of a toe bone where its joint with the next bone is measured. */
const JOINT_BAND = 0.003;

/** Yaw of the heel → ball (forefoot, 15–33 % from the toe) axis of a sole, from +z toward +x (#49). */
export function footAxisYaw(sole: readonly THREE.Vector3[]): number {
  const zs = sole.map(p => p.z), toe = Math.max(...zs), heel = Math.min(...zs), length = toe - heel;
  const centre = (from: number, to: number) => {
    const band = sole.filter(p => p.z <= toe - from * length && p.z >= toe - to * length);
    return { x: band.reduce((a, p) => a + p.x, 0) / band.length, z: band.reduce((a, p) => a + p.z, 0) / band.length };
  };
  const heelCentre = centre(0.8, 1), ball = centre(0.15, 0.33);
  return Math.atan2(ball.x - heelCentre.x, ball.z - heelCentre.z);
}
/** The foot's axis (heel → toes) and its roll axis (horizontal, across the foot: a positive turn about it raises the
 * heel), in ankle coordinates, for a foot turned out by `toeOut`. */
export const footAxes = (toeOut: number) => ({
  along: new THREE.Vector3(Math.sin(toeOut), 0, Math.cos(toeOut)),
  across: new THREE.Vector3(Math.cos(toeOut), 0, -Math.sin(toeOut)),
});

/** Islands of an indexed geometry: vertices joined by a triangle, or at the same place (a quantized GLB splits a vertex
 * along its seams). Each island lists its vertices. */
export function islands(geometry: THREE.BufferGeometry): number[][] {
  const position = geometry.attributes.position as THREE.BufferAttribute, index = geometry.index, n = position.count;
  const parent = Int32Array.from({ length: n }, (_, i) => i);
  const find = (i: number) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const union = (a: number, b: number) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
  const seen = new Map<string, number>(), array = position.array, size = position.itemSize;
  for (let i = 0; i < n; i++) {
    const key = `${array[size * i]},${array[size * i + 1]},${array[size * i + 2]}`;
    const other = seen.get(key);
    if (other === undefined) seen.set(key, i); else union(i, other);
  }
  const count = index ? index.count : n, at = (k: number) => index ? index.getX(k) : k;
  for (let k = 0; k + 2 < count; k += 3) { union(at(k), at(k + 1)); union(at(k + 1), at(k + 2)); }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    let group = groups.get(root);
    if (!group) groups.set(root, group = []);
    group.push(i);
  }
  return [...groups.values()];
}

/** A copy of `geometry` keeping only the vertices `keep` marks, and the triangles made of them. Attributes keep their
 * type and normalization (the quantized GLB), and the vertices their order. */
function subset(geometry: THREE.BufferGeometry, keep: Uint8Array): THREE.BufferGeometry {
  const remap = new Int32Array(keep.length).fill(-1);
  let n = 0;
  for (let i = 0; i < keep.length; i++) if (keep[i]) remap[i] = n++;
  const out = new THREE.BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes) as [string, THREE.BufferAttribute][]) {
    const size = attribute.itemSize, source = attribute.array as THREE.TypedArray;
    const array = new (source.constructor as new (length: number) => THREE.TypedArray)(n * size);
    for (let i = 0; i < keep.length; i++) if (keep[i]) for (let c = 0; c < size; c++) array[remap[i] * size + c] = source[i * size + c];
    out.setAttribute(name, new THREE.BufferAttribute(array, size, attribute.normalized));
  }
  const index = geometry.index!, triangles: number[] = [];
  for (let k = 0; k + 2 < index.count; k += 3) {
    const a = index.getX(k), b = index.getX(k + 1), c = index.getX(k + 2);
    if (keep[a] && keep[b] && keep[c]) triangles.push(remap[a], remap[b], remap[c]);
  }
  out.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(triangles, 1) : new THREE.Uint16BufferAttribute(triangles, 1));
  out.computeBoundingBox(); out.computeBoundingSphere();
  return out;
}

/** One toe and its metatarsal: the centre of the metatarsal head (ankle coordinates), where the toe joins the foot, and
 * the islands (bones) of the toe. */
export interface ToeRay { head: THREE.Vector3; islands: number[][] }

/** Long axis of a bone, given as points: its centre and its principal axis, pointing forward (along `along`). */
function principalAxis(points: THREE.Vector3[], along: THREE.Vector3): { centre: THREE.Vector3; axis: THREE.Vector3 } {
  const centre = new THREE.Vector3();
  for (const p of points) centre.add(p);
  centre.divideScalar(points.length);
  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0], d = new THREE.Vector3();
  for (const p of points) {
    d.copy(p).sub(centre);
    const v = [d.x, d.y, d.z];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) m[3 * a + b] += v[a] * v[b];
  }
  let v: number[] = along.toArray();
  for (let k = 0; k < 64; k++) {
    const w = [0, 1, 2].map(a => m[3 * a] * v[0] + m[3 * a + 1] * v[1] + m[3 * a + 2] * v[2]);
    const l = Math.hypot(w[0], w[1], w[2]);
    v = w.map(x => x / l);
  }
  const axis = new THREE.Vector3(v[0], v[1], v[2]);
  if (axis.dot(along) < 0) axis.negate();
  return { centre, axis };
}

/** Splits the bones of a foot (points in ankle coordinates, grouped by island) into the toes and the rest, and measures
 * the fold line, the five toes (each with its metatarsal head) and the big toe at rest. `medial`: +1 when the inside of
 * the foot is on `across`, -1 otherwise. */
export function measureToes(points: THREE.Vector3[], groups: number[][], toeOut: number, medial: number) {
  const { along, across } = footAxes(toeOut);
  const a = points.map(p => p.dot(along)), back = Math.min(...a), length = Math.max(...a) - back;
  const bones = groups.map(vertices => {
    const start = Math.min(...vertices.map(i => a[i])), end = Math.max(...vertices.map(i => a[i]));
    const side = vertices.reduce((s, i) => s + points[i].dot(across), 0) / vertices.length * medial;
    return { vertices, start, end, side, toe: start > back + TOE_START * length };
  });
  // Metatarsals: the bones behind the toes that reach the front of the foot, from the big toe's (the most medial). Their
  // heads: the centre of the front `HEAD_LENGTH`, half its height back from the end and up from the bottom.
  const metatarsals = bones.filter(b => !b.toe && b.end > back + TOE_START * length).sort((p, q) => q.side - p.side);
  const heads = metatarsals.map(b => {
    const head = b.vertices.filter(i => a[i] > b.end - HEAD_LENGTH).map(i => points[i]);
    const low = Math.min(...head.map(p => p.y)), high = Math.max(...head.map(p => p.y)), radius = (high - low) / 2;
    const side = head.reduce((s, p) => s + p.dot(across), 0) / head.length;
    return along.clone().multiplyScalar(b.end - radius).addScaledVector(across, side).setY(low + radius);
  });
  // The fold line passes through the most forward head: nothing of the foot behind it goes under the floor as it turns.
  const hinge = heads.reduce((best, h) => h.dot(along) > best.dot(along) ? h : best, heads[0]).clone();
  // Each toe bone joins the bone whose front end is nearest to its back end: a proximal phalanx joins its metatarsal's
  // head, a middle phalanx its proximal one, a distal phalanx the one before it. Taken from the back of the foot forwards.
  const endOf = (vertices: number[], at: number) => {
    const c = new THREE.Vector3(), near = vertices.filter(i => Math.abs(a[i] - at) < JOINT_BAND);
    for (const i of near) c.add(points[i]);
    return c.divideScalar(near.length);
  };
  const rays: ToeRay[] = heads.map(head => ({ head, islands: [] }));
  const joints = heads.map((head, k) => ({ at: head, ray: k }));
  for (const bone of bones.filter(b => b.toe).sort((p, q) => p.start - q.start)) {
    const back = endOf(bone.vertices, bone.start);
    const joint = joints.reduce((best, j) => j.at.distanceTo(back) < best.at.distanceTo(back) ? j : best, joints[0]);
    rays[joint.ray].islands.push(bone.vertices);
    joints.push({ at: endOf(bone.vertices, bone.end), ray: joint.ray });
  }
  // The big toe: its proximal phalanx is the bone of the first toe that starts furthest back.
  const hallux = bones.filter(b => b.toe && rays[0].islands.includes(b.vertices) && b.vertices.length > 20).sort((p, q) => p.start - q.start)[0];
  const slope = (vertices: number[]) => Math.asin(-principalAxis(vertices.map(i => points[i]), along).axis.y);
  const restExtension = slope(metatarsals[0].vertices) - slope(hallux.vertices);
  return { toes: bones.filter(b => b.toe).map(b => b.vertices), rays, hinge, restExtension };
}

/** Articulates the toes of a foot: they move under `ToePivot_<side>`, set on the fold line (the toes' joint with the
 * foot). Each toe hangs from it at the head of its metatarsal (`ToeRay<k>_<side>`, k = 1 for the big toe), its bones in
 * `Toes<k>_<side>`. Idempotent; nothing happens to a foot without its mesh `Foot_<side>`. Returns the toe node. */
export function articulateToes(ankle: THREE.Object3D, side: "L" | "R"): THREE.Object3D | null {
  const existing = ankle.getObjectByName(`ToePivot_${side}`);
  if (existing) return existing;
  const foot = ankle.getObjectByName(`Foot_${side}`) as THREE.Mesh | undefined;
  if (!foot?.isMesh || !foot.geometry.index || foot.parent !== ankle) return null;
  foot.updateMatrix();
  const position = foot.geometry.attributes.position as THREE.BufferAttribute;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < position.count; i++) points.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(foot.matrix));
  const groups = islands(foot.geometry);
  // The right foot is at x < 0: its inside is towards +x, on `across` (the roll axis); the left foot's inside is the other way.
  const { toes, rays, hinge, restExtension } = measureToes(points, groups, footAxisYaw(points), side === "R" ? 1 : -1);
  const isToe = new Uint8Array(position.count);
  for (const island of toes) for (const i of island) isToe[i] = 1;
  const pivot = new THREE.Object3D();
  pivot.name = `ToePivot_${side}`;
  pivot.position.copy(hinge);
  pivot.userData.restExtension = restExtension;
  for (const [k, ray] of rays.entries()) {
    const node = new THREE.Object3D();
    node.name = `ToeRay${k + 1}_${side}`;
    node.position.copy(ray.head).sub(hinge);
    node.userData.rest = node.position.clone();
    const keep = new Uint8Array(position.count);
    for (const island of ray.islands) for (const i of island) keep[i] = 1;
    if (ray.islands.length) {
      const mesh = new THREE.Mesh(subset(foot.geometry, keep), foot.material);
      mesh.name = `Toes${k + 1}_${side}`;
      mesh.userData = { ...foot.userData, name: mesh.name };
      // The toe keeps the foot's own transform, seen from the head of its metatarsal.
      new THREE.Matrix4().makeTranslation(-ray.head.x, -ray.head.y, -ray.head.z).multiply(foot.matrix).decompose(mesh.position, mesh.quaternion, mesh.scale);
      node.add(mesh);
    }
    pivot.add(node);
  }
  foot.geometry = subset(foot.geometry, new Uint8Array(position.count).map((_, i) => 1 - isToe[i]));
  ankle.add(pivot);
  return pivot;
}
