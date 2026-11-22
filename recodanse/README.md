# Pont ReCoDanse

Rémi et Corinne, les mascottes de ReCoDanse, dansent avec le moteur de ce dépôt : leur tête et leurs pieds chaussés
sur le corps anatomique, dont le buste, les bras et les mains sont complétés en os et en muscles. Le moteur n'est pas
modifié. Détail, mesures et limites : [SPEC.md](SPEC.md) (#176).

## Voir

```bash
npm ci                                  # une fois, à la racine du moteur
npm --prefix recodanse run dev          # la vue : http://localhost:5173/
```

Les adresses sont celles de l'application : `?vitrine=1` (danse automatique en musique), `?mode=pair&guidage=1`
(mode jeu), `?mode=solo&style=kizomba`… Ajouter `pont=0` montre la vue du moteur seule, pour comparer.

Sans les pièces des mascottes (voir [actifs/mascottes/LISEZMOI.md](actifs/mascottes/LISEZMOI.md)), la vue montre le
corps anatomique complet, crâne et pieds compris.

## Vérifier

```bash
npm --prefix recodanse test             # contrat avec le moteur + mesures des bras sur le GLB (1 s, sans navigateur)
npm --prefix recodanse run build        # types + site statique dans recodanse/dist/
```

`MOTEUR=<chemin>` devant l'une de ces commandes fait tourner le pont sur un autre checkout du moteur.
Le test ne fait pas partie de `npm test` du moteur : à lancer après une évolution du moteur qui touche le Rig, le
buste ou le cadre des bras.

Images et film (navigateur sans fenêtre, serveur de la vue lancé) :

```bash
CHROME_PATH=… node recodanse/scripts/capturer.mjs <dossier> nom="http://localhost:5173/?vitrine=1&bare=1&beat=2"
CHROME_PATH=… node recodanse/scripts/filmer.mjs sortie.mp4 "http://localhost:5173/?vitrine=1&bare=1" 10 15
```

Les images qui montrent les mascottes ne se versent pas dans ce dépôt.

## Refaire les actifs

| Actif | Commande | Source |
|---|---|---|
| `actifs/anatomie_haut.glb` + `.json` | `npm --prefix recodanse run anatomie` | BodyParts3D 4.0 : déposer `isa_BP3D_4.0_obj_99.zip`, `isa_parts_list_e.txt`, `isa_element_parts.txt` dans `recodanse/.cache/bp3d/` |
| `actifs/mascottes/*` (hors dépôt) | `recodanse/blender/exporter_mascottes.sh <mascottes.json> <dossier>` | fichiers de personnage de ReCoDanse |

## Fichiers

- `vite.config.ts` : la vue ; le greffon qui met `src/RigMascotte.tsx` à la place du Rig du moteur.
- `src/haut.ts` : haut du corps anatomique (peau, coude, pronation, paume). `src/mascotte.ts` : tête et pieds chaussés.
  three.js pur, testés en node.
- `scripts/construire_haut.mjs`, `scripts/bp3d.mjs` : construction du haut du corps. `scripts/test_contrat.mjs`.
- `blender/exporter_mascottes.py` : export des pièces des mascottes (lecture seule).

## Attribution

Maillages anatomiques : **BodyParts3D v4.0, © DBCLS (The Database Center for Life Science), CC BY-SA 2.1 Japan**.
`actifs/anatomie_haut.glb` en est une œuvre dérivée, sous la même licence. Rémi et Corinne sont des personnages de
ReCoDanse ; leurs maillages ne font pas partie de ce dépôt.
