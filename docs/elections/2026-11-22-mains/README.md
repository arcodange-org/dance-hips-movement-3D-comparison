# La main droite de la suiveuse dans la main gauche du guideur (#179)

Fil d'Ariane : [docs](../../) › [cadre](../../cadre/spec-implementation.md) › **prise des mains en position fermée**

Position fermée : bustes face à face, pieds proches. Dossier ouvert le 22 novembre 2026.

## Ce que le propriétaire a précisé (22 novembre 2026)

- Il n'y a pas une seule place pour ces mains : plusieurs postures et attitudes existent, selon la hauteur du coude et
  l'ouverture (mains ouvertes vers l'extérieur, ou gardées près de l'épaule). Les candidats ci-dessous sont donc des
  **attitudes** à garder ou non, pas un vainqueur unique à désigner.
- **La prise** :
  - les phalanges sont serrées, le pouce ouvert, presque à angle droit ;
  - la main de la suiveuse est posée contre, dans la main du guideur, en opposition ; le bas de sa paume vient au
    bord droit de la main du guideur ;
  - les phalanges de la suiveuse se referment autour de l'**index** du guideur ;
  - les deux pouces se croisent : l'index et le pouce de la suiveuse entourent le pouce du guideur ;
  - modèle des doigts : ceux de la suiveuse dans le tour de salsa du projet Blender de ReCoDanse, où ils se
    referment autour du majeur du guideur ; ici, autour de son index.

## Trois attitudes filmables

Kizomba, sur place, 90 bpm, haut du corps anatomique (`haut=1`), muscles affichés. Les interrupteurs `?essai=` sont
inertes sans le paramètre : l'application ne change pas.

| A — aujourd'hui | B — `?essai=mainsCote` | C — `?essai=mainsBasses` |
|---|---|---|
| ![A](mains-A-entre-les-poitrines.gif) | ![B](mains-B-sur-le-cote.gif) | ![C](mains-C-sur-le-cote-plus-bas.gif) |
| ![A](mains-A-entre-les-poitrines.png) | ![B](mains-B-sur-le-cote.png) | ![C](mains-C-sur-le-cote-plus-bas.png) |
| Entre les deux épaules, 6 cm sous elles : mains cachées entre les cages thoraciques, coudes repliés jusqu'à 27°, doigts dans les côtes du partenaire. | 20 cm vers l'extérieur du couple, à la même hauteur : mains visibles devant les épaules. | 14 cm vers l'extérieur, 14 cm plus bas : mains à hauteur de taille, avant-bras presque horizontaux, coudes détendus. |

Refaire les films (serveur de l'application lancé, navigateur sans fenêtre) :

```bash
GPU=1 BPM=90 node scripts/capture_figure_gif.mjs docs/elections/2026-11-22-mains/mains-B-sur-le-cote.gif \
  "http://localhost:5173/?mode=pair&bare=1&haut=1&muscles=1&campos=1.9,1.45,1.2&camtgt=0.15,1.2,0&essai=mainsCote" 4 12
```

(`essai=temoin` pour A, `essai=mainsBasses` pour C.)

## Ce qui manque pour la prise décrite

1. **Poignet** : la main est aujourd'hui dans l'axe de l'avant-bras. Pour poser la main de la suiveuse en travers de
   celle du guideur, le poignet doit s'articuler (flexion, inclinaison), dans son amplitude.
2. **Doigts** : la main anatomique est une seule pièce. Il faut articuler les phalanges (serrées, refermées autour de
   l'index du guideur) et le pouce (ouvert, croisé).
3. **Relation entre les deux mains** : la main de la suiveuse se place par rapport à celle du guideur (bas de la paume
   au bord de sa main, doigts vers son index), au lieu de viser le même point que lui.

## À trancher par le propriétaire

- Quelles attitudes garder (A, B, C, d'autres), et laquelle par défaut en kizomba.
- La prise, une fois posée : à juger sur des gros plans.
