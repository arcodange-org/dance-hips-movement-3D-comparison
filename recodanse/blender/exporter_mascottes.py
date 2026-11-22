"""Exporte la tête et les pieds chaussés d'une mascotte de ReCoDanse pour le pont three.js.

    Blender -b <personnage.blend> --python recodanse/blender/exporter_mascottes.py -- <mascottes.json> <nom> <dossier de sortie> [pièces]

Le fichier du personnage n'est JAMAIS enregistré : tout se fait sur des copies temporaires.
Pour chaque pièce : les objets listés sont évalués sans leur coque d'encre (Solidify), leur matière en aplats
(émission, classes par sommet) est cuite dans les couleurs de sommet, le maillage est allégé, puis exporté en GLB
dans un repère canonique : le personnage regarde vers -Y de Blender (+Z du glTF), mètres.
Sortie : <nom>-<pièce>.glb et <nom>.json (ancres : pivot de la tête, chevilles, hauteur du dessous des semelles).
"""
import json
import math
import sys
import time
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:]
config = json.loads(Path(argv[0]).read_text())[argv[1]]
nom, sortie = argv[1], Path(argv[2])
sortie.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 1
scene.render.threads_mode = "FIXED"
scene.render.threads = int(config.get("fils", 2))
journal = []


def dire(*a):
    print("EXPORT", *a, flush=True)
    journal.append(" ".join(str(x) for x in a))


armature = bpy.data.objects[config["squelette"]]
os_ = {b.name: b for b in armature.data.bones}
monde = lambda b, tete=True: armature.matrix_world @ (b.head_local if tete else b.tail_local)
# Repère canonique : le personnage regarde vers -Y. Son avant se lit sur l'os du pied (cheville -> orteils).
pied = os_[config["os"]["piedL"]]
avant = (monde(pied, False) - monde(pied)).to_2d().normalized()
lacet = math.atan2(avant.x, -avant.y)  # angle de -Y vers l'avant, autour de Z
CANON = Matrix.Rotation(lacet, 4, "Z")  # tourne l'avant du personnage sur -Y
gltf = lambda v: [round(v.x, 5), round(v.z, 5), round(-v.y, 5)]  # Blender (x, y, z) -> glTF (x, z, -y)

temp = bpy.data.collections.new("PONT_export")
scene.collection.children.link(temp)
# Rien d'autre que la pièce en cours n'entre dans la cuisson : sans cela chaque cuisson recharge tout le
# personnage (une dizaine de secondes par objet). L'état n'est pas enregistré.
for autre in bpy.data.objects:
    autre.hide_render = True


def copie_evaluee(source, cible_sommets):
    """Copie temporaire d'un objet : modificateurs appliqués sauf la coque d'encre, couleurs cuites, allégée."""
    t0 = time.time()
    c = source.copy()
    temp.objects.link(c)
    c.hide_viewport = False
    c.hide_render = False
    c.hide_set(False)
    for m in list(c.modifiers):
        if m.type == "SOLIDIFY":
            c.modifiers.remove(m)
        else:
            m.show_viewport = True
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(c.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    o = bpy.data.objects.new("PONT_" + source.name, me)
    temp.objects.link(o)
    o.matrix_world = c.matrix_world.copy()
    o.hide_render = False
    bpy.data.objects.remove(c)
    # Cuisson de l'émission (les aplats du personnage) dans une couleur par sommet. Les couleurs déjà peintes
    # (« Pigment ») restent en place pendant la cuisson : la matière peut les lire.
    pigment = next((n.layer_name for s in o.material_slots if s.material and s.material.use_nodes
                    for n in s.material.node_tree.nodes if n.type == "VERTEX_COLOR" and n.layer_name in me.color_attributes), None)
    col = me.color_attributes.new(name="PontCol", type="FLOAT_COLOR", domain="POINT")
    me.color_attributes.active_color = col
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    cuit = "non"
    if any(s.material for s in o.material_slots):
        try:
            bpy.ops.object.bake(type="EMIT", target="VERTEX_COLORS", use_clear=True)
            cuit = "émission"
        except RuntimeError as e:
            cuit = "ECHEC " + str(e).strip().splitlines()[-1][:120]
    n = len(me.vertices)
    valeurs = [0.0] * (n * 4)
    col = me.color_attributes["PontCol"]
    col.data.foreach_get("color", valeurs)
    pas = max(1, n // 2000)
    clarte = sum(valeurs[i * 4] + valeurs[i * 4 + 1] + valeurs[i * 4 + 2] for i in range(0, n, pas)) / (3 * len(range(0, n, pas)))
    if cuit != "émission" or clarte < 0.004:
        if pigment:
            # Matière que Cycles ne sait pas cuire (paliers calculés par EEVEE) : le pigment peint, tel quel.
            src = me.color_attributes[pigment]
            if src.domain == "POINT":
                src.data.foreach_get("color", valeurs)
            else:
                coins = [0.0] * (len(me.loops) * 4)
                src.data.foreach_get("color", coins)
                for l in me.loops:
                    valeurs[l.vertex_index * 4:l.vertex_index * 4 + 4] = coins[l.index * 4:l.index * 4 + 4]
            cuit = f"pigment « {pigment} »"
        else:
            d = next((s.material.diffuse_color for s in o.material_slots if s.material), (0.8, 0.8, 0.8, 1))
            valeurs = list(d) * n
            cuit = "couleur d'affichage de la matière"
        col.data.foreach_set("color", valeurs)
    for a in [a for a in me.color_attributes if a.name != "PontCol"]:
        me.color_attributes.remove(a)
    col = me.color_attributes["PontCol"]
    me.color_attributes.active_color = col
    me.color_attributes.render_color_index = 0
    n0 = len(me.vertices)
    if n0 > cible_sommets:
        m = o.modifiers.new("alleger", "DECIMATE")
        m.ratio = cible_sommets / n0
        bpy.ops.object.modifier_apply(modifier=m.name)
    o.hide_render = True
    # Position monde appliquée, puis repère canonique.
    o.data.transform(CANON @ o.matrix_world)
    o.matrix_world = Matrix.Identity(4)
    o.data.update()
    dire(f"{source.name}: {n0} -> {len(o.data.vertices)} sommets, couleurs {cuit}, {time.time() - t0:.1f} s")
    return o


def boite(objets):
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    for o in objets:
        for v in o.data.vertices:
            for k in range(3):
                lo[k] = min(lo[k], v.co[k])
                hi[k] = max(hi[k], v.co[k])
    return lo, hi


def exporter(objets, fichier):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objets:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objets[0]
    options = dict(filepath=str(fichier), export_format="GLB", use_selection=True, export_yup=True, export_apply=False,
                   export_animations=False, export_skins=False, export_morph=False, export_texcoords=False, export_normals=True,
                   export_materials="PLACEHOLDER", export_vertex_color="ACTIVE", export_all_vertex_colors=False,
                   export_active_vertex_color_when_no_material=True,
                   export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                   export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_color_quantization=10)
    while True:
        try:
            bpy.ops.export_scene.gltf(**options)
            break
        except TypeError as e:  # option inconnue de cette version de Blender : on la retire
            inconnue = next((k for k in options if k in str(e)), None)
            if not inconnue:
                raise
            dire("option d'export ignorée :", inconnue)
            del options[inconnue]


manifeste = {"nom": nom, "source": bpy.data.filepath, "date": time.strftime("%Y-%m-%d %H:%M"), "blender": bpy.app.version_string,
             "repere": "glTF : mètres, +y haut, +z vers l'avant du personnage", "echelle": config.get("echelle", 1),
             "encre": config.get("encre", 0.0016), "pieces": {}, "mesures": {}}
seules = argv[3].split(",") if len(argv) > 3 else None  # pièces à refaire ; les autres gardent leur fichier
ancien = sortie / f"{nom}.json"
if seules and ancien.exists():
    manifeste["pieces"] = json.loads(ancien.read_text()).get("pieces", {})
    manifeste["mesures"] = json.loads(ancien.read_text()).get("mesures", {})
for cle, piece in config["pieces"].items():
    if seules and cle not in seules:
        continue
    absents = [n for n in piece["objets"] if n not in bpy.data.objects]
    if absents:
        dire(f"pièce {cle} : objets absents {absents}, pièce sautée")
        continue
    objets = [copie_evaluee(bpy.data.objects[n], piece.get("sommets", {}).get(n, piece.get("cible", 30000))) for n in piece["objets"]]
    lo, hi = boite(objets)
    decl = {"glb": f"{nom}-{cle}.glb", "boite": [gltf(lo), gltf(hi)], "objets": piece["objets"]}
    if "pivot" in piece:  # articulation de la tête sur le cou
        decl["pivot"] = gltf(CANON @ monde(os_[piece["pivot"]]))
    if "cheville" in piece:
        if piece["cheville"] == "coupe":  # pièce hors squelette : le centre de la jambe à la hauteur de la cheville
            h = piece["hauteurCheville"]
            pts = [v.co for o in objets for v in o.data.vertices if abs(v.co.z - lo.z - h) < 0.012]
            c = sum(pts, Vector()) / len(pts)
            decl["cheville"] = gltf(Vector((c.x, c.y, lo.z + h)))
        else:  # la cheville du squelette : le bas du tibia
            decl["cheville"] = gltf(CANON @ monde(os_[piece["cheville"]], False))
        decl["sol"] = round(lo.z, 5)
        manifeste["mesures"][cle + "_hauteurCheville"] = round(decl["cheville"][1] - lo.z, 4)
        manifeste["mesures"][cle + "_longueur"] = round(hi.y - lo.y, 4)
    exporter(objets, sortie / decl["glb"])
    decl["octets"] = (sortie / decl["glb"]).stat().st_size
    decl["sommets"] = sum(len(o.data.vertices) for o in objets)
    manifeste["pieces"][cle] = decl
    dire(f"pièce {cle} : {decl['sommets']} sommets, {decl['octets'] / 1e6:.2f} Mo")
tete = os_[config["os"]["tete"]]
manifeste["mesures"]["sommetDuCrane"] = round(monde(tete, False).z, 4)
manifeste["journal"] = journal
(sortie / f"{nom}.json").write_text(json.dumps(manifeste, ensure_ascii=False, indent=1))
dire("manifeste écrit", sortie / f"{nom}.json")
