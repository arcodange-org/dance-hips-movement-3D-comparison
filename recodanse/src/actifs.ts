// Chargement des actifs du pont : le haut du corps anatomique (versé dans le dépôt) et les pièces des
// mascottes (locales, hors dépôt : actifs/mascottes/, produites par blender/exporter_mascottes.py).
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { DRACO_DECODER_PATH } from "@moteur/muscles";
import hautUrl from "../actifs/anatomie_haut.glb?url";
import manifesteHaut from "../actifs/anatomie_haut.json";
import { lireModele, type ManifesteHaut, type ModeleHaut } from "./haut";
import type { ManifesteMascotte, ModeleMascotte } from "./mascotte";
import type { NomMascotte } from "./reglages";

const draco = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH);
const gltf = new GLTFLoader().setDRACOLoader(draco);

let haut: Promise<ModeleHaut> | null = null;
export const chargerHaut = () => (haut ??= gltf.loadAsync(hautUrl).then(g => lireModele(g.scene, manifesteHaut as unknown as ManifesteHaut)));

// Les fichiers présents au moment du build : une mascotte absente n'est pas une erreur, le danseur garde
// son crâne et ses pieds anatomiques.
const locaux = import.meta.glob("../actifs/mascottes/*.{glb,json}", { query: "?url", import: "default", eager: true }) as Record<string, string>;
const url = (fichier: string) => locaux[`../actifs/mascottes/${fichier}`];
const mascottes = new Map<NomMascotte, Promise<ModeleMascotte | null>>();
export function chargerMascotte(nom: NomMascotte): Promise<ModeleMascotte | null> {
  if (!mascottes.has(nom)) mascottes.set(nom, (async () => {
    const m = url(`${nom}.json`);
    if (!m) return null;
    const manifeste = await (await fetch(m)).json() as ManifesteMascotte;
    const pieces: Record<string, THREE.Object3D> = {};
    for (const [cle, piece] of Object.entries(manifeste.pieces)) {
      const u = piece ? url(piece.glb) : undefined;
      if (u) pieces[cle] = (await gltf.loadAsync(u)).scene;
    }
    return { manifeste, pieces };
  })().catch(e => { console.warn(`pont : mascotte ${nom} illisible`, e); return null; }));
  return mascottes.get(nom)!;
}
export const mascottesPresentes = (): NomMascotte[] => (["remi", "corinne"] as NomMascotte[]).filter(n => !!url(`${n}.json`));
