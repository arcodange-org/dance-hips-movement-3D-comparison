// #132 — Atlas anatomique : le manifeste (docs/atlas/manifest.json, source de vérité) tel que la vue
// `?atlas=` le lit. Séparé de src/atlas.ts pour que l'application principale ne l'embarque pas.
import manifestJson from "../docs/atlas/manifest.json";
import type { AtlasManifest, AtlasMouvement } from "./atlas";

export const ATLAS_MANIFEST = manifestJson as AtlasManifest;

export const atlasMouvement = (id: string | null): AtlasMouvement | undefined =>
  ATLAS_MANIFEST.mouvements.find(m => m.id === id);
