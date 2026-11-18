#!/usr/bin/env python3
"""Corrige l'assignation maillage -> nom d'os sous les KneePivot de public/anatomy.glb.

Bug remonté 2026-11-18 (vue rapprochée du bassin, ida=1) : un os mal placé au genou.
Diagnostic (taille = 2 x node.scale, côté via moyenne x des sommets quantizés) :
- Tibia_R portait le PETIT maillage de rotule (0.042 x 0.039 x 0.022) au front du genou,
- Patella_R portait le GROS maillage de tibia (0.074 x 0.380 x 0.063) au mi-tibia,
- Patella_L portait une fibula (0.036 x 0.384 x 0.030, côté droit d'après les sommets) au front
  du genou -> longue fibule qui "pointe" vers l'avant au genou gauche,
- Fibula_R portait l'autre petite rotule, flottant au mi-tibia externe droit.

Correction : réassignation des mesh indices (cycle à 4) + 2 translations :
- Tibia_R.mesh <- Patella_R.mesh   (gros tibia)   t -> [+0.001, -0.189, +0.006]
- Patella_R.mesh <- Fibula_R.mesh  (petite rotule) t -> [+0.001, +0.008, +0.035]
- Fibula_R.mesh <- Patella_L.mesh  (fibula droite)
- Patella_L.mesh <- Tibia_R.mesh   (petite rotule)
Tibia_L / Fibula_L gardent leur maillage et leur translation (déjà corrects).

Convention (espace KneePivot : -y = vers la cheville, +z = avant, côté droit à x < 0) :
tibia au mi-tibia t ~ [0, -0.189, +0.006], patella au front du genou t ~ [0, +0.008, +0.035],
fibula côté externe mi-tibia t ~ [∓0.028, -0.190, +0.005].
"""
import json
import struct
import sys

PATH = "public/anatomy.glb"

# cycle de réassignation des mesh : nouveau contenu <- ancien contenu de
MESH_CYCLE = {
    "Tibia_R": "Patella_R",
    "Patella_R": "Fibula_R",
    "Fibula_R": "Patella_L",
    "Patella_L": "Tibia_R",
}

# translations corrigées (les autres sont déjà bonnes)
FIX_T = {
    "Tibia_R": [0.001, -0.189, 0.006],
    "Patella_R": [0.001, 0.008, 0.035],
}


def main() -> None:
    with open(PATH, "rb") as f:
        data = f.read()
    magic, version, length = struct.unpack("<III", data[:12])
    assert magic == 0x46546C67, "pas un GLB"
    clen, ctype = struct.unpack("<II", data[12:20])
    assert ctype == 0x4E4F534A, "premier chunk pas JSON"
    gltf = json.loads(data[20 : 20 + clen])
    by_name = {n.get("name", ""): n for n in gltf["nodes"]}
    for name in list(MESH_CYCLE) + list(FIX_T):
        if name not in by_name or "mesh" not in by_name[name]:
            sys.exit(f"nœud sans mesh introuvable: {name}")
    # le maillage est normalisé [-1,1] (KHR_mesh_quantization) : node.scale = demi-extent du
    # maillage -> il faut transférer mesh ET scale ; la translation reste celle du nœud
    # destination (déjà correcte) sauf si listée dans FIX_T.
    old = {dst: (by_name[src]["mesh"], by_name[src].get("scale", [1, 1, 1])) for dst, src in MESH_CYCLE.items()}
    for dst, src in MESH_CYCLE.items():
        by_name[dst]["mesh"], by_name[dst]["scale"] = old[dst]
    for name, t in FIX_T.items():
        by_name[name]["translation"] = t
    # sanity : classe de taille par nom (2 x scale.y)
    for n in gltf["nodes"]:
        name = n.get("name", "")
        if name.startswith("Tibia_") and 2 * n["scale"][1] < 0.30:
            sys.exit(f"{name} n'a toujours pas le gros maillage de tibia")
        if name.startswith("Patella_") and 2 * n["scale"][1] > 0.08:
            sys.exit(f"{name} n'a toujours pas le petit maillage de rotule")
        if name.startswith("Fibula_") and 2 * n["scale"][1] < 0.30:
            sys.exit(f"{name} n'a toujours pas le maillage long de fibula")
    js = json.dumps(gltf, separators=(",", ":")).encode()
    pad = (4 - len(js) % 4) % 4
    js += b" " * pad
    body = struct.pack("<II", len(js), 0x4E4F534A) + js + data[20 + clen :]
    with open(PATH, "wb") as f:
        f.write(struct.pack("<III", magic, version, 12 + len(body)) + body)
    print("mesh réassignés:", ", ".join(f"{d}<-{s}" for d, s in MESH_CYCLE.items()))
    print("translations corrigées:", ", ".join(FIX_T))


if __name__ == "__main__":
    main()
