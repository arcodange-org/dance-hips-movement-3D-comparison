# Pièces des mascottes (hors dépôt)

Ce dossier reçoit, en local, la tête et les pieds chaussés de Rémi et de Corinne. Seule cette notice est versée :
les maillages des mascottes appartiennent à ReCoDanse.

Fichiers attendus : `remi.json`, `remi-tete.glb`, `remi-piedL.glb`, `remi-piedR.glb`, `corinne.json`,
`corinne-tete.glb`, `corinne-piedL.glb`, `corinne-piedR.glb` (et d'autres jeux de pieds : `…-piedL_<jeu>.glb`).

Les produire, depuis les fichiers de personnage de ReCoDanse (Blender, lecture seule, une minute par personnage) :

```bash
recodanse/blender/exporter_mascottes.sh <mascottes.json> <dossier de sortie>   # puis copier ici les .glb et .json
```

`<mascottes.json>` dit, pour chaque personnage, son fichier, son squelette et les objets de chaque pièce :
voir `recodanse/blender/mascottes.exemple.json`. Le manifeste écrit à côté des pièces donne les ancres (pivot de la
tête, chevilles, hauteur du dessous des semelles), dans le repère du glTF.
