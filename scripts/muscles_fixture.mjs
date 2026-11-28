// La couche des muscles (public/anatomy_muscles.glb et public/anatomy_tendons.glb, compressées en Draco) chargée dans
// node, et greffée sur un rig de pose_fixture.mjs comme le fait l'app (src/components/Rig.tsx, `graftMuscles`).
// Le décodeur est celui que l'app sert (public/draco/gltf/draco_decoder.js, en JavaScript, sans WebAssembly).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// public/ est sous "type": "module" : le décodeur (CommonJS) s'évalue avec son propre `module`.
const source = readFileSync(new URL("../public/draco/gltf/draco_decoder.js", import.meta.url), "utf8");
const cjs = { exports: {} };
new Function("module", "exports", "require", "__filename", "__dirname", source)(cjs, cjs.exports, createRequire(import.meta.url), "draco_decoder.js", ".");
const draco = await cjs.exports();

/** Ce que GLTFLoader attend d'un DRACOLoader, décodé sur place. */
const dracoLoader = {
  preload() { return this; },
  decodeDracoFile(buffer, done, attributeIDs, _types, _colorSpace, fail) {
    try {
      const decoder = new draco.Decoder(), array = new Int8Array(buffer), mesh = new draco.Mesh();
      const status = decoder.DecodeArrayToMesh(array, array.byteLength, mesh);
      if (!status.ok()) throw new Error(status.error_msg());
      const geometry = new THREE.BufferGeometry(), count = mesh.num_faces() * 3, at = draco._malloc(count * 4);
      decoder.GetTrianglesUInt32Array(mesh, count * 4, at);
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(draco.HEAPU32.buffer, at, count).slice(), 1));
      draco._free(at);
      for (const name in attributeIDs) {
        const attribute = decoder.GetAttributeByUniqueId(mesh, attributeIDs[name]), size = attribute.num_components();
        const n = mesh.num_points() * size, data = draco._malloc(n * 4);
        decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, draco.DT_FLOAT32, n * 4, data);
        geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(draco.HEAPF32.buffer, data, n).slice(), size));
        draco._free(data);
      }
      draco.destroy(mesh); draco.destroy(decoder);
      done(geometry);
    } catch (error) { fail(error); }
  },
};

const parse = async file => {
  const bytes = readFileSync(new URL(`../public/${file}`, import.meta.url));
  return (await new GLTFLoader().setDRACOLoader(dracoLoader).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")).scene;
};
export const musclesScene = await parse("anatomy_muscles.glb");
/** #229 : les tendons d'Achille (scripts/build_tendons.mjs). */
export const tendonsScene = await parse("anatomy_tendons.glb");

/** Greffe une copie des muscles et des tendons sur le rig `r` (après bindSkeleton), comme l'app (`graftMuscles`) ;
 * rend les maillages greffés. */
export function graft(api, r) {
  const meshes = [];
  for (const scene of [musclesScene, tendonsScene]) scene.clone(true).traverse(o => { if (o.isMesh) meshes.push(o); });
  return api.graftMuscles(r, meshes, () => new THREE.MeshBasicMaterial());
}
