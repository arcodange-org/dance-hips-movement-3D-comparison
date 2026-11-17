#!/usr/bin/env python3
"""Construit public/anatomy_muscles.glb : couche musculaire réelle BodyParts3D
(membres inférieurs + tronc), même bake LPS->Y-up `(x, z, -y) * 0,001` et même
origine (centre du bassin) que public/anatomy.glb, pour pouvoir être greffée
sur les nœuds de pivots par nom dans l'app (src/muscles.ts).

Note : dans isa_element_parts.txt, le côté gauche a souvent l'id `<FJ droit>M`
(ex. FJ1418M = left gluteus maximus) : ne jamais faire rstrip("M") sur les ids.

Les maillages sont exportés à plat (espace Skeleton) avec des noms
`Muscle_<Nom>` ; le mapping nom -> nœud parent est dans src/muscles.ts.

Usage :
  pip install trimesh numpy
  python scripts/build_muscles.py --zip /tmp/bp3d_obj_99.zip --out public/anatomy_muscles.glb

Licence : BodyParts3D v4.0, (c) DBCLS, CC BY-SA 2.1 Japan
https://dbarchive.biosciencedbc.jp/en/bodyparts3d/license.html
"""

import argparse
import io
import json
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
import trimesh

DATA = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/"
ZIP_URL = DATA + "isa_BP3D_4.0_obj_99.zip"
PARTS_URL = DATA + "isa_parts_list_e.txt"
ELEMENTS_URL = DATA + "isa_element_parts.txt"

# (nom affichage, parent app, [noms anatomiques parts_list à résoudre R/L + bilatéral])
MUSCLES = [
    ("GluteusMaximus", ["gluteus maximus"]),
    ("GluteusMedius", ["gluteus medius"]),
    ("PsoasMajor", ["psoas major"]),
    ("Iliacus", ["iliacus"]),
    ("Piriformis", ["piriformis"]),
    ("RectusFemoris", ["rectus femoris"]),
    ("VastusLateralis", ["vastus lateralis"]),
    ("VastusMedialis", ["vastus medialis"]),
    ("VastusIntermedius", ["vastus intermedius"]),
    ("BicepsFemoris", ["long head of biceps femoris", "short head of biceps femoris"]),
    ("Semitendinosus", ["semitendinosus"]),
    ("Semimembranosus", ["semimembranosus"]),
    ("Sartorius", ["sartorius"]),
    ("Gracilis", ["gracilis"]),
    ("AdductorMagnus", ["adductor magnus"]),
    ("AdductorLongus", ["adductor longus"]),
    ("TensorFasciaeLatae", ["tensor fasciae latae"]),
    ("Gastrocnemius", ["medial head of gastrocnemius", "lateral head of gastrocnemius"]),
    ("Soleus", ["soleus"]),
    ("TibialisAnterior", ["tibialis anterior"]),
    ("FibularisLongus", ["fibularis longus"]),
    ("FibularisBrevis", ["fibularis brevis"]),
    ("TibialisPosterior", ["tibialis posterior"]),
    ("ErectorSpinae", ["iliocostalis", "longissimus", "spinalis"]),
    ("ExternalOblique", ["external oblique"]),
    ("PectoralisMajor", ["clavicular part of pectoralis major", "sternocostal part of pectoralis major", "abdominal part of pectoralis major"]),
    ("Trapezius", ["ascending part of trapezius", "transverse part of trapezius", "descending part of trapezius"]),
    ("Deltoid", ["clavicular part of deltoid", "acromial part of deltoid", "spinal part of deltoid"]),
]


def bake(v: np.ndarray) -> np.ndarray:
    return np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1) * 0.001


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", default="/tmp/bp3d_obj_99.zip")
    ap.add_argument("--out", default="public/anatomy_muscles.glb")
    args = ap.parse_args()

    zpath = Path(args.zip)
    if not zpath.exists():
        print("telechargement du zip BodyParts3D (~136 Mo)...")
        urllib.request.urlretrieve(ZIP_URL, zpath)
    zf = zipfile.ZipFile(zpath)

    parts = urllib.request.urlopen(PARTS_URL, timeout=30).read().decode().splitlines()[1:]
    name2fma = {}
    fma2name = {}
    for line in parts:
        p = line.split("\t")
        if len(p) >= 3:
            name2fma.setdefault(p[2].lower(), []).append(p[0])
            fma2name[p[0]] = p[2].lower()
    elements = urllib.request.urlopen(ELEMENTS_URL, timeout=30).read().decode().splitlines()[1:]
    fma2fj = {}
    for line in elements:
        p = line.split("\t")
        if len(p) >= 3:
            fma2fj.setdefault(p[0], []).append(p[2])

    def fjmap_for(anat_names):
        """Retourne {'R': [...], 'L': [...], 'C': [...]} de FJ ids par côté.
        Gère 'right <n>', '<n> right', 'medial head of right <n>'..."""
        import re
        out = {"R": [], "L": [], "C": []}
        seen = set()
        norm2 = []
        for key, fmas in name2fma.items():
            side = "R" if re.search(r"\bright\b", key) else ("L" if re.search(r"\bleft\b", key) else "C")
            norm = re.sub(r"\b(right|left)\b", " ", key)
            norm = re.sub(r"\s+", " ", norm).strip()
            for fma in fmas:
                norm2.append((norm, fma, side))
        for n in anat_names:
            buckets = {"R": [], "L": [], "C": []}
            for norm, fma, side in norm2:
                if norm == n:
                    buckets[side].extend(fma2fj.get(fma, []))
            chosen = buckets["R"] or buckets["L"] or buckets["C"]
            side = "R" if buckets["R"] else ("L" if buckets["L"] else "C")
            # si les deux côtés existent, garder les deux
            if buckets["R"] and buckets["L"]:
                side = None
            for f in (chosen if side else buckets["R"] + buckets["L"]):
                if f not in seen:
                    seen.add(f)
                    out[side if side else ("R" if f in buckets["R"] else "L")].append(f)
        return out

    def load_obj(fj):
        name = next(n for n in zf.namelist() if n.endswith(f"/{fj}.obj"))
        m = trimesh.load(io.BytesIO(zf.read(name)), file_type="obj", process=False)
        if isinstance(m, trimesh.Scene):
            m = trimesh.util.concatenate(m.dump())
        return m

    # origine = milieu des centres des os coxaux (identique au GLB os)
    hipR = load_obj("FJ3152")
    hipL = load_obj("FJ3288")
    for m in (hipR, hipL):
        m.vertices = bake(np.asarray(m.vertices))
    origin = (hipR.bounds.mean(axis=0) + hipL.bounds.mean(axis=0)) / 2

    scene = trimesh.Scene()
    total = 0
    for label, anat in MUSCLES:
        sides = fjmap_for(anat)
        if not any(sides.values()):
            print(f"!! {label}: aucun FJ trouvé pour {anat}")
            continue
        for side, fjs in sides.items():
            if not fjs:
                continue
            meshes = []
            for fj in fjs:
                m = load_obj(fj)
                m.vertices = bake(np.asarray(m.vertices)) - origin
                meshes.append(m)
            merged = trimesh.util.concatenate(meshes)
            node = f"Muscle_{label}_{side}"
            scene.add_geometry(merged, node_name=node, geom_name=node)
            total += 1
            print(f"{node}: {len(fjs)} FJ, {len(merged.vertices)} sommets")
    scene.export(args.out, file_type="glb")
    print(f"GLB muscles ecrit: {args.out} ({total} groupes)")
    print("Attribution requise: BodyParts3D v4.0, (c) DBCLS, CC BY-SA 2.1 Japan")


if __name__ == "__main__":
    main()
