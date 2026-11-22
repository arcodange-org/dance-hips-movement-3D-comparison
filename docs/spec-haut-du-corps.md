# Haut du corps anatomique : buste, bras et mains en os et en muscles (#176)

> État au 22 novembre 2026. Option `haut=1` : sans elle, l'application ne change pas.

## Ce que montre l'option

Avec `haut=1`, les volumes gris du buste, des bras et de la tête laissent la place aux os et aux muscles réels de
BodyParts3D, comme le bassin et les jambes : cage thoracique, colonne, cou, crâne, clavicules, omoplates, humérus,
ulna, radius, mains ; 108 muscles de l'épaule, du bras, de l'avant-bras, de la main et du cou.

![Seul : sans l'option, avec (muscles), avec (os)](haut-du-corps/seul-sans-puis-avec.png)

![En couple : sans l'option, avec](haut-du-corps/couple-sans-puis-avec.png)

L'option vaut dans toutes les vues (comparateur, paire, mode jeu, vitrine) : `?mode=solo&haut=1`,
`?vitrine=1&haut=1`. Les muscles suivent le réglage « Muscles » de la vue ; le buste masqué masque aussi ces os.

## Principe

Les figures gardent le dernier mot. Le bassin, la colonne, le thorax et la tête sont les nœuds du rig ; la main
anatomique vient où le rig pose la sienne. La couche ne déplace aucun nœud du rig, et sa pose est une fonction de la
pose du rig à l'image courante : rien ne dépend du temps ni d'une figure.

| Fichier | Rôle |
|---|---|
| `public/anatomy_upper.glb` (1,9 Mo) | 16 pièces osseuses et 108 muscles pesés sur 18 articulations (peau glTF standard) ; son manifeste (articulations au repos, axes, mesures, pièces) est l'`extras` de sa scène |
| `scripts/build_upper_body.mjs`, `scripts/bp3d.mjs` | construction depuis BodyParts3D 4.0 (les trois fichiers source dans `extracted/bp3d/`) |
| `src/upperBody.ts` | three.js pur : peau, coude, pronation, paume, port de tête |
| `src/components/UpperBodyLayer.tsx` | pose la couche sur un rig ; morceau à part, chargé avec son GLB seulement si l'option est demandée |
| `scripts/test_upper_body.mjs` | dans `npm test` |

Le rig publie la couche dans `rig.upperBody` (articulations des bras, nœud qui porte la tête) pour qui veut poser
autre chose sur le corps.

## Les bras et les mains

Le rig pose une main : un point au bout de l'avant-bras. La couche y amène **le centre de la paume** d'un bras aux
longueurs anatomiques, depuis l'articulation réelle de l'épaule.

| | Rig | Anatomie (BodyParts3D) |
|---|---|---|
| Épaule | (±19 ; 42 ; 0) cm au-dessus du centre du bassin | (±16,5 ; 46 ; 0,6) cm, soit 4,8 cm d'écart |
| Bras | 26 cm | 28,0 cm |
| Coude → main | 24 cm | poignet 23,6 cm, paume 29,3 cm |

- **Coude** : deux segments résolus par `solveArm` (`src/cadre.ts`), le coude pliant du côté du coude du rig.
- **Avant-bras** : le radius tourne autour de l'ulna (pronation), de −10° à 170° depuis la position anatomique
  (`PRONATION`). La paume se tourne vers le dos du partenaire (main posée sur l'omoplate), vers la paume de l'autre
  (mains jointes), sinon vers le corps. Les muscles de l'avant-bras suivent la torsion en cinq paliers.
- **Peau** : chaque sommet est pesé une fois, à la construction, sur les os qu'il longe (thorax, humérus, ulna,
  radius, main ; colonne et cou par la hauteur). Pendant la danse rien n'est déformé à la main.
- **Port de tête** : face à face à 24 cm, deux crânes se touchent. Quand les têtes sont à moins de 55 cm, chacun
  tourne la sienne vers sa gauche, jusqu'à 42° à 34 cm et en deçà (`HEAD_CARRIAGE`). Réglage à valider à l'œil.

Ces amplitudes sont des paramètres de ce modèle, pas des normes cliniques ni des angles déduits des sources.

## Mesures (`scripts/test_upper_body.mjs`, GLB réel, seizième de temps, kizomba)

| Figure | Écart paume / main du rig | Angle au coude | Saut du coude entre deux échantillons (celui du rig) | Port de tête |
|---|---|---|---|---|
| Sortie garçon | 0 mm | 32° à 124° | 3,6 cm (4,1) | 36° à 42° |
| Sortie fille | 0 mm | 31° à 143° | 32 cm (34,1) : la main lâche le dos, comme dans le rig | 8° à 42° |
| Quarts de tour | 0 mm | 27° à 88° | 2,0 cm (1,9) | 42° |
| Ida e volta | 0 mm | 31° à 89° | 2,5 cm (2,5) | 42° |
| Sur place | 0 mm | 31° à 87° | 0,4 cm (0,4) | 42° |

Seul, dans les six styles : écart de paume 0 mm, tête de face. `dispose()` rend le rig intact.

## Limites

- Doigts raides (main ouverte), poignet droit, omoplates et clavicules fixes sur le thorax.
- Coude jusqu'à 27° : les bras anatomiques sont plus longs que ceux du rig, ils plient davantage.
- La pronation bute sur son amplitude dans certaines poses : la paume ne regarde alors pas exactement où il faudrait.
- BodyParts3D 4.0 ne liste pas le grand dorsal.
- La surbrillance des appuis ne touche pas ces pièces ; le lien « Partager » ne porte pas `haut=1`.
- Ces mesures ne constituent pas une validation chorégraphique.

## Suites possibles

1. Bras du rig aux longueurs anatomiques (`ARM_JOINTS`) : la couche n'aurait plus à résoudre le coude.
2. Doigts articulés (prises des mains), omoplate qui glisse avec le bras.
3. L'option par défaut, quand elle aura été regardée.

## Refaire le fichier

```bash
# déposer isa_BP3D_4.0_obj_99.zip, isa_parts_list_e.txt et isa_element_parts.txt dans extracted/bp3d/
# (https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/)
node scripts/build_upper_body.mjs
```

Maillages : **BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan**.
