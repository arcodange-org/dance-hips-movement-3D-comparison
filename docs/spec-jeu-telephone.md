# Jeu et vitrine utilisables sur téléphone (#186)

Le mode jeu (`?mode=pair&guidage=1`) et la vitrine (`?vitrine=1`) doivent se regarder et se commander
au doigt, téléphone tenu droit ou couché. Interface seulement : le mouvement ne change pas.

Premier lot de la simplification de la page ; la page principale (comparaison, vue en couple) est un
lot séparé.

## Constat

Mesuré sur `main` (7711678) avec les profils de téléphone de Playwright : écran visible avec les
barres du navigateur, toucher activé (`scripts/mesure_jeu_telephone.mjs`).

| Vue | Profil | Écran sous les panneaux | Plus haute bande de scène libre |
| --- | --- | --- | --- |
| Jeu | iPhone 14, 390 × 664 | 78 % | 56 px |
| Jeu | iPhone SE, 320 × 568 | 83 % | 12 px |
| Jeu | iPhone 14 couché, 750 × 340 | 75 % | 12 px |
| Jeu | Pixel 7, 412 × 839 | 59 % | 264 px |
| Vitrine | iPhone 14, 390 × 664 | 33 % | 364 px |
| Vitrine | iPhone 14 couché, 750 × 340 | 29 % | 134 px |

- Jeu, téléphone couché : les panneaux se chevauchent. Pause, Écoute / Danse seule, Recommencer, Vue
  et Son sont sous le paragraphe des raccourcis clavier : le doigt ne les atteint plus.
- Les 15 commandes du jeu font 24 à 30 px de haut, les 3 de la vitrine 28 px.
- Trois variantes de l'ida e volta (jambe droite, en arrière, les deux) ne se commandent qu'avec une
  flèche maintenue : elles n'existent pas sur un écran tactile. Neuf raccourcis clavier restent affichés.
- Vitrine, téléphone couché : le grand bouton « Lancer la musique » est posé sur les jambes du couple ;
  « Lancer la musique » figure deux fois.
- À l'ordinateur aussi, la rangée de figures passe sur les pieds du couple.
- Pas de choix du style dans le jeu ; « Quitter » est la seule sortie.
- Les deux vues prennent `100vh` : sur un navigateur de téléphone, le bas peut passer sous la barre.
  Non reproduit en émulation, à vérifier sur un vrai téléphone.

## Décisions

### Trois dispositions, choisies d'après la taille de la fenêtre

`hudLayout(largeur, hauteur)` (`src/jeuHud.ts`, pur) :

| Disposition | Condition | Où vont les commandes |
| --- | --- | --- |
| `couche` | plus large que haute, et moins de 500 px de haut | une colonne à gauche (retour, pause, son, plus, état, qui danse, style), les figures en colonne à droite, le couple au milieu |
| `droit` | moins de 640 px de large | deux rangées en haut, les figures dans une bande en bas, le couple entre les deux |
| `large` | le reste (tablette, ordinateur) | état et style en haut à gauche, qui danse et les icônes en haut à droite, les figures en rangée en bas |

Les commandes ne se chevauchent dans aucune des trois : chaque bande a sa place, rien n'est posé sur une
autre bande ni sur le couple.

### Le couple dans la place libre

Les bandes de commandes mesurent leur taille réelle et la donnent à la scène. La projection de la
caméra est décalée et réduite pour que la vue d'origine tienne dans le rectangle libre
(`freeView`, `src/jeuHud.ts`, appliqué par `setViewOffset`) : le couple se voit de la tête aux pieds,
quelle que soit la disposition, en vue du guideur comme en vue libre. La caméra, sa position et son
suivi du couple ne changent pas. La vue `bare=1` des captures n'a pas de bandes : rien n'y change.

### Commandes du jeu

| Aujourd'hui | Devient |
| --- | --- |
| Paragraphe d'explication, affiché en permanence | Dans le panneau « Plus », sous « Comment jouer » |
| « Écoute » / « Danse seule » (un bouton qui dit l'état) | Deux positions côte à côte, « Je guide » et « Danse seule » ; Espace bascule toujours |
| Pause / Reprendre, Son actif / coupé | Icônes, avec leur nom pour les lecteurs d'écran |
| Recommencer, Vue : guideur / libre, bpm, Partager | Panneau « Plus » : Recommencer, Caméra, Tempo, Partager cette danse |
| Quitter | Flèche de retour vers la vue en couple, même adresse qu'avant |
| (absent) | Choix du style : recharge la vue avec `style=`, les autres paramètres conservés |
| « File : … » | « Ensuite : … » |
| Deux lignes de raccourcis clavier | Dans « Plus », sous « Au clavier », seulement quand il y a un clavier |
| Boutons de figures de 30 px | 44 px au moins ; la lettre du clavier ne s'affiche pas sur un écran tactile |
| Virgula (bouton à bascule) | Inchangé, rangé avec deux autres bascules |
| Flèche → maintenue : ida e volta jambe droite | Bascule « Jambe droite » |
| Flèche ↓ maintenue : ida e volta en arrière | Bascule « En arrière » |

Les trois bascules modifient le prochain « Ida e volta » touché ou cliqué, comme les flèches
maintenues modifient la touche du clavier (`figureOfCode`, inchangé). Elles restent enfoncées jusqu'à
ce qu'on les relâche. Elles ne s'affichent que pour les styles qui proposent l'ida e volta. Le clavier
garde ses flèches maintenues et Maj : rien n'y change.

La fiche de la transition en cours (guideur, suiveuse, contacts) reste visible à l'ordinateur ; au
téléphone elle s'ouvre en touchant l'état, pour laisser la place au couple.

### Commandes de la vitrine

- L'état en une boîte : le compte, la figure, puis le style, « danse seule » et le tempo.
- Un seul bouton pour la musique : « Lancer la musique » tant qu'elle est coupée, puis une icône
  « Couper le son » en haut.
- « Partager » en icône ; « Prendre la main » à côté du bouton de musique.
- Téléphone couché : les boutons vont en bas à droite, hors du couple.

### Hauteur de l'écran

La vue prend `100dvh` quand le navigateur le connaît (sinon `100vh`, comme avant) : la hauteur
réellement visible, barres du navigateur comprises. Les bandes ajoutent les marges des bords arrondis
et de l'encoche (`env(safe-area-inset-*)`).

## Ce qui ne change pas

- Le mouvement : `src/pose.ts`, `src/guidage.ts` et les autres modules de danse ne sont pas modifiés.
- Les paramètres d'URL et leur sens : `style`, `auto`, `graine`, `hasard`, `ginga`, `vue`, `bpm`,
  `muscles`, `haut`, `demo`, `beat`, `sortieBeat`, `bare`, `vitrine`, `guidage`.
- La vue `bare=1` (captures, GIF, film).
- Le clavier : mêmes touches, mêmes flèches maintenues, Espace, Maj.
- L'attribution BodyParts3D (CC BY-SA 2.1 Japan © DBCLS), visible dans les trois dispositions, et le
  crédit de la musique enregistrée dans la vitrine.

## Fichiers

- `src/jeuHud.ts` (pur) : `hudLayout`, `freeView`, `padOf`, `idaOf`, `styleSearch`, `TOUCH_MIN`.
- `src/hooks/useHudLayout.ts` : taille de la fenêtre, présence d'un clavier.
- `src/components/jeu/` : `JeuHud.tsx`, `VitrineHud.tsx`, `CadreLibre.tsx`, `icones.tsx`.
- `src/components/GuidageApp.tsx` : le bloc des panneaux appelle ces composants ; le reste du fichier
  n'est pas réécrit, pour ne pas croiser les chantiers en cours (#156, #160).
- `src/index.css` : hauteur visible.

## Vérification

- `docs/features/jeu-telephone.feature`, dans `npm test` : disposition par profil de téléphone,
  rectangle libre, composition du pavé par style, bascules de l'ida e volta, adresse du changement de
  style.
- `scripts/mesure_jeu_telephone.mjs` (navigateur, hors `npm test`) : ouvre le jeu et la vitrine sur
  les profils iPhone 14 droit et couché, iPhone SE et Pixel 7, puis mesure et refuse si :
  - une commande fait moins de 44 px de haut ou de large ;
  - une commande en recouvre une autre, ou n'est pas atteignable à son centre ;
  - le couple n'a pas, dans le jeu, une bande libre d'au moins la moitié de la hauteur (téléphone tenu
    droit) ou de toute la hauteur sur au moins 280 px de large (téléphone couché) ;
  - un raccourci clavier est affiché sur un écran tactile ;
  - l'attribution n'est pas à l'écran.
- À l'ordinateur (1280 × 800) : le jeu se commande au clavier comme avant ; la rangée de figures ne
  passe plus sur les pieds.

## Hors périmètre

- La page principale : sur téléphone, la scène retient le doigt et empêche de faire défiler la page
  (0 px mesuré). À traiter avec sa refonte.
- Les onglets communs entre les vues (seul, comparer, en couple, jeu) : ils viendront avec la page
  principale ; d'ici là, le jeu garde une flèche de retour.
- Un vrai téléphone : l'émulation ne montre ni la barre du navigateur sur une vue en `100vh`, ni la
  fluidité, ni le déblocage du son. À essayer sur l'appareil du propriétaire.
