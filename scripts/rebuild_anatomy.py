#!/usr/bin/env python3
"""Régénère une anatomie bassin->pied plus fine à partir de BodyParts3D 4.0.

Extrait le sous-ensemble d'os listé par FJ ID depuis l'archive OBJ de BodyParts3D,
le fusionne par partie, applique le bake LPS->Y-up (x, z, -y) * 0,001 (origine au
centre du bassin, os droits a x negatif) et exporte un GLB avec la hierarchie de
pivots attendue par l'app :

  Skeleton -> Pelvis (HipBone_R/L, Sacrum)
  Skeleton -> HipPivot_R/L -> KneePivot_R/L -> (Tibia, Fibula, Patella) + AnklePivot -> Foot

Usage :
  pip install trimesh numpy
  python scripts/rebuild_anatomy.py \
      --source https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip \
      --out public/anatomy_hq.glb
  npx --yes @gltf-transform/cli draco public/anatomy_hq.glb public/anatomy_hq.glb

Licence des maillages : BodyParts3D v4.0, (c) DBCLS, CC BY-SA 2.1 Japan.
https://dbarchive.biosciencedbc.jp/en/bodyparts3d/license.html
"""

import argparse
import io
import json
import struct
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
import trimesh

# FJ IDs BodyParts3D 4.0 (voir README). Pieds : talus, calcaneus, naviculaire + le
# reste des 26 os du pied fusionnes dans le maillage "Foot" existant si absent.
FJ = {
    "HipBone_R": ["FJ3152"],
    "HipBone_L": ["FJ3288"],
    "Sacrum": ["FJ3393"],
    "Femur_R": ["FJ3365"],
    "Femur_L": ["FJ3259"],
    "Patella_R": ["FJ3381"],
    "Patella_L": ["FJ3275"],
    "Tibia_R": ["FJ3387"],
    "Tibia_L": ["FJ3282"],
    "Fibula_R": ["FJ3366"],
    "Fibula_L": ["FJ3260"],
    "Talus_R": ["FJ3385"],
    "Talus_L": ["FJ3280"],
    "Calcaneus_R": ["FJ3360"],
    "Calcaneus_L": ["FJ3256"],
    "Navicular_R": ["FJ3308"],
    "Navicular_L": ["FJ3307"],
}

# Repere LPS BodyParts3D -> Y-up (m), bake applique aux sommets.
def bake_lps(v: np.ndarray) -> np.ndarray:
    return np.stack([v[:, 0], -v[:, 2], v[:, 1]], axis=1) * 0.001


def load_fj_meshes(source: str, ids: list[str], zf: zipfile.ZipFile | None, cache_dir: Path):
    meshes = []
    for fj in ids:
        candidates = [n for n in (zf.namelist() if zf else []) if fj in Path(n).name and n.lower().endswith(".obj")]
        if zf and candidates:
            data = zf.read(candidates[0])
            m = trimesh.load(io.BytesIO(data), file_type="obj", process=False)
        else:
            f = cache_dir / f"{fj}.obj"
            if not f.exists():
                raise SystemExit(f"OBJ {fj} introuvable dans {source} (ni dans {cache_dir})")
            m = trimesh.load(f, file_type="obj", process=False)
        if isinstance(m, trimesh.Scene):
            m = trimesh.util.concatenate(m.dump())
        meshes.append(m)
    return meshes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default="https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip")
    ap.add_argument("--out", default="public/anatomy_hq.glb")
    ap.add_argument("--keep-zip", default=None, help="chemin local du zip deja telecharge")
    args = ap.parse_args()

    with tempfile.TemporaryDirectory() as td:
        cache = Path(td)
        zf = None
        zip_path = args.keep_zip
        if zip_path is None:
            zip_path = cache / "bp3d.zip"
            print(f"telechargement de {args.source} ...")
            urllib.request.urlretrieve(args.source, zip_path)
        zf = zipfile.ZipFile(zip_path)

        parts = {}
        for name, ids in FJ.items():
            ms = load_fj_meshes(args.source, ids, zf, cache)
            merged = trimesh.util.concatenate(ms)
            merged.vertices = bake_lps(np.asarray(merged.vertices))  # mm -> m + LPS -> Y-up
            parts[name] = merged
            print(f"{name}: {len(merged.vertices)} sommets, {len(merged.faces)} faces")

        # origine au centre du bassin : milieu des centres des os coxaux
        cR = parts["HipBone_R"].bounds.mean(axis=0)
        cL = parts["HipBone_L"].bounds.mean(axis=0)
        origin = (cR + cL) / 2
        for m in parts.values():
            m.vertices = m.vertices - origin
        scene = trimesh.Scene()
        for name, m in parts.items():
            scene.add_geometry(m, node_name=name, geom_name=name)
        scene.export(args.out, file_type="glb")
        print(f"GLB ecrit: {args.out}")
        print("Attribution requise: BodyParts3D v4.0, (c) DBCLS, CC BY-SA 2.1 Japan")


if __name__ == "__main__":
    main()
