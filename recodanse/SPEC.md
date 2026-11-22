# Pont vers ReCoDanse : Rémi et Corinne dansent avec le moteur (#176)

> État au 22 novembre 2026. Dossier isolé : l'application, ses tests, sa CI et le site publié ne changent pas.

## Ce que fait le pont

La vue du pont ouvre **l'application du moteur telle quelle** et habille chaque danseur :

1. **Haut du corps anatomique.** Les volumes gris du buste, des bras et de la tête laissent la place aux os et aux
   muscles réels (BodyParts3D, comme le bassin et les jambes) : cage thoracique, colonne, cou, crâne, clavicules,
   omoplates, humérus, radius, ulna, mains ; 108 muscles de l'épaule, du bras, de l'avant-bras, de la main et du cou.
2. **Tête et pieds chaussés des mascottes.** Le guideur porte la tête et les souliers vernis de Rémi, la suiveuse la
   tête et les sandales à talon de Corinne. Seul, un danseur est Corinne (`solo=remi` pour Rémi).

Le moteur prime : c'est sa pose qui danse. Le pont ne déplace aucun nœud du moteur ; il ajoute des objets que le
moteur ignore (marqués `anchor`) et masque ce qu'il remplace.

## Pourquoi une évolution du moteur arrive sans report

- La vue importe `src/main.tsx` du moteur. Un greffon de build met `recodanse/src/RigMascotte.tsx` à la place de
  `src/components/Rig.tsx` ; ce composant rend le Rig d'origine et l'habille. Tout mode (comparateur, paire, mode jeu,
  vitrine) et toute figure passent donc par le pont, y compris ceux qui n'existent pas encore.
- La pose du pont est une fonction de la pose du moteur à l'image courante. Rien ne dépend du temps ni d'une figure.
- `MOTEUR=<autre checkout>` fait tourner la vue et le test sur une autre version du moteur.
- `recodanse/scripts/test_contrat.mjs` échoue quand le moteur change ce que le pont lit (liste ci-dessous).

### Ce que le pont lit dans le moteur (le contrat)

| Élément du moteur | Usage |
|---|---|
| `Rig.tsx` : composant par défaut, `RigProps`, publication `pair.current[side].rig` | habiller le rig |
| nœuds `pelvis`, `spine`, `chest`, `head`, `torso`, `armF*`, `foot*` du rig | articulations du tronc, main du moteur, chevilles |
| `userData.part` : `torso` (volumes gris), `muscle`, `anchor` (ignoré par le moteur) | masquer, ne pas fausser les appuis |
| `TORSO_JOINTS`, `ARM_JOINTS` (`rigJoints.ts`) | repos du tronc, point de la main |
| `CADRE_SITES`, `solveArm` (`cadre.ts`) | reconnaître une main posée sur le dos, résoudre le coude |
| `makeMuscleMaterial`, `DRACO_DECODER_PATH` (`muscles.ts`) | même aspect des muscles, décodeur |
| `public/anatomy.glb` : `AnklePivot_*`, `Foot_*`, `Femur_R` | chevilles, semelles, matière des os |

## Les bras et les mains

Le moteur pose une main (un point au bout de l'avant-bras) ; le pont y amène **le centre de la paume** d'un bras aux
longueurs anatomiques, depuis l'articulation réelle de l'épaule.

| | Moteur | Anatomie (BodyParts3D) |
|---|---|---|
| Épaule | (±19 ; 42 ; 0) cm au-dessus du bassin | (±16,5 ; 46 ; 0,6) cm, soit 4,8 cm d'écart |
| Bras | 26 cm | 28,0 cm |
| Coude → main | 24 cm | poignet 23,6 cm, paume 29,3 cm |

- **Coude** : deux segments, résolus par `solveArm` du moteur, le coude pliant du côté du coude du moteur.
- **Avant-bras** : le radius tourne autour de l'ulna (pronation), de −10° à 170° depuis la position anatomique. La paume
  se tourne vers le dos du partenaire (main posée sur l'omoplate), vers la paume de l'autre (mains jointes), sinon vers
  le corps. Les muscles de l'avant-bras suivent cette torsion en cinq paliers.
- **Peau des muscles** : chaque sommet est pesé une fois, à la construction, sur les os qu'il longe (thorax, humérus,
  ulna, radius, main). Pendant la danse rien n'est déformé à la main.

Mesuré sur le GLB du moteur (`test_contrat.mjs`, seizième de temps, kizomba) :

| Figure | Écart paume / main du moteur | Angle au coude | Saut du coude entre deux échantillons (celui du moteur) |
|---|---|---|---|
| Sortie garçon | 0 mm | 32° à 124° | 3,6 cm (4,1) |
| Sortie fille | 0 mm | 31° à 143° | 32 cm (34,1) : la main lâche le dos, comme dans le moteur |
| Quarts de tour | 0 mm | 27° à 88° | 2,0 cm (1,9) |
| Ida e volta | 0 mm | 31° à 89° | 2,5 cm (2,5) |
| Sur place | 0 mm | 31° à 87° | 0,4 cm (0,4) |

## Les mascottes

- **Source** : les fichiers de personnage de ReCoDanse (Blender). `blender/exporter_mascottes.py` travaille sur des
  copies temporaires, sans enregistrer le fichier (empreinte vérifiée avant et après). Il retire la coque d'encre, cuit
  les aplats du personnage dans les couleurs de sommet, allège et exporte en GLB.
- **Hors dépôt** : les pièces exportées vivent du côté de ReCoDanse et se copient dans `actifs/mascottes/` (ignoré par
  git). Sans elles, la vue montre le crâne et les pieds anatomiques.
- **Tête** : son articulation sur le cou vient sur le nœud `head` du moteur, à l'échelle 1 (les mascottes sont déjà
  aux proportions de BodyParts3D).
- **Port de tête** : face à face à 24 cm, le museau de Rémi et le bec de Corinne se traversent (un crâne nu se touche
  déjà). Quand les têtes sont à moins de 55 cm, chacun tourne la sienne vers sa gauche, jusqu'à 42° à 34 cm et en deçà :
  joue contre joue. C'est un réglage du pont (`PORT_DE_TETE`, `regard=0` pour l'éteindre), à valider à l'œil.
- **Pieds chaussés** : le dessous de la semelle vient dans le plan de la semelle anatomique ; un pied à plat pour le
  moteur est une chaussure à plat. Les os du pied restent dans le moteur (ses appuis en dépendent), ils ne sont plus
  dessinés. Les appuis du moteur ne changent pas (vérifié).
- **Talons de Corinne** : le moteur danse pieds à plat (cheville à 5,4 cm du sol), la cheville de Corinne en talons est
  à 10,8 cm. La tige de sa jambe suit le tibia, sa chaussure suit le pied, et le tibia anatomique s'arrête dans la tige.
  Le corps n'est pas rehaussé : la hauteur des talons n'existe pas dans le moteur.

## Paramètres d'URL du pont

Ceux du moteur restent les siens. `pont=0` (vue du moteur seule), `haut=0`, `mascottes=0`, `tete=0`, `pieds=0`,
`pieds=<jeu>` (autre jeu de pieds exporté, ex. `pieds=v31`), `regard=0`, `solo=remi|corinne`.

## Limites connues

- Doigts raides (main ouverte) ; poignet droit ; omoplates et clavicules fixes sur le thorax.
- Coude jusqu'à 27° : les bras anatomiques sont plus longs que ceux du moteur, ils plient davantage.
- La pronation bute sur son amplitude dans certaines poses : la paume ne regarde alors pas exactement où il faudrait.
- BodyParts3D 4.0 ne liste pas le grand dorsal.
- La crête de Corinne est rigide (sa physique reste dans Blender). Les mains, les ailes et la queue des mascottes ne
  sont pas reprises.
- Le mode fantôme et la surbrillance des appuis du moteur ne s'appliquent pas aux pièces du pont.

## À proposer au propriétaire, hors de ce chantier

1. Bras du moteur aux longueurs anatomiques (`ARM_JOINTS`) : le pont n'aurait plus à résoudre le coude.
2. Talons dans le moteur : laisser la semelle de la chaussure entrer dans le calcul des appuis.
3. Doigts articulés (prises des mains), omoplate qui glisse avec le bras.
4. Projection vers Blender pour les films : cuire une séance du moteur en animation glTF, la rejouer sur ce même corps.
5. Où héberger la vitrine avec les mascottes (pas sur le site public tant que leurs maillages restent privés).
