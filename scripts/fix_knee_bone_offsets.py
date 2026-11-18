#!/usr/bin/env python3
"""Corrige les translations locales des os sous les KneePivot dans public/anatomy.glb.

Contexte (bug remonté 2026-11-18) : avec "pieds plantés" décoché, on voyait 2 os flottants
(rotule genou gauche, sous le fémur droit). Mesure runtime (sonde world positions) :
- Fibula_R rendait à +0,154 m en x du KneePivot_R (os lateral flottant),
- Fibula_L à -0,176 m en x,
- Patella_L à y=-0,206 sous le KneePivot_L (au milieu du tibia au lieu du genou).
Les autres os (Femur, Tibia, HipBone, Foot, Sacrum, pivots) sont correctement placés
(node translation = centre du maillage dans l'espace du parent, échelle = demi-extent, vertices
quantizés int16 [-32767, 32767] via KHR_mesh_quantization).

Convention de placement (espace KneePivot : -y = vers la cheville, +z = avant, +x = côté gauche
car le côté droit est à x < 0) :
- tibia (gros maillage ~0,38 m) : centre mi-tibia  t ~ [0, -0,189, 0,006]
- patella (petit maillage ~4 cm, devant le genou) : t ~ [0, +0,008, +0,035]
- fibula (petit maillage, côté externe mi-tibia) : t ~ [∓0,028, -0,19, 0,005]

Le gros maillage de droite est porté par le nœud nommé Patella_R (déjà bien placé) et le petit
par Tibia_R (bien placé au genou) : on ne renomme rien, on ne corrige que les 3 translations
fautives (Patella_L, Fibula_R, Fibula_L).
"""
import json
import struct
import sys

PATH = "public/anatomy.glb"

# nom -> nouvelle translation locale (espace parent KneePivot)
FIXES = {
    "Patella_L": [-0.001, 0.008, 0.035],   # au genou, devant (comme Tibia_R côté droit)
    "Fibula_R": [-0.028, -0.190, 0.005],   # côté externe droit (x < 0), mi-tibia
    "Fibula_L": [0.028, -0.190, 0.005],    # côté externe gauche (x > 0), mi-tibia
}


def main() -> None:
    with open(PATH, "rb") as f:
        data = f.read()
    magic, version, length = struct.unpack("<III", data[:12])
    assert magic == 0x46546C67, "pas un GLB"
    clen, ctype = struct.unpack("<II", data[12:20])
    assert ctype == 0x4E4F534A, "premier chunk pas JSON"
    gltf = json.loads(data[20 : 20 + clen])
    changed = []
    for node in gltf["nodes"]:
        name = node.get("name", "")
        if name in FIXES:
            node["translation"] = FIXES[name]
            changed.append(name)
    if sorted(changed) != sorted(FIXES):
        sys.exit(f"nœuds non trouvés: {set(FIXES) - set(changed)}")
    js = json.dumps(gltf, separators=(",", ":")).encode()
    pad = (4 - len(js) % 4) % 4
    js += b" " * pad
    body = struct.pack("<II", len(js), 0x4E4F534A) + js + data[20 + clen :]
    with open(PATH, "wb") as f:
        f.write(struct.pack("<III", magic, version, 12 + len(body)) + body)
    print("translations corrigées:", ", ".join(changed))


if __name__ == "__main__":
    main()
