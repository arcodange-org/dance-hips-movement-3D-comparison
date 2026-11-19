# Le cadre dans les figures du dépôt

[Accueil](../../README.md) · [Cadre](README.md) · [Points de contact](points-de-contact.md) · [Actions et intentions](actions-et-intentions.md) · **Figures du dépôt** · [Spécification](spec-implementation.md)

Application du catalogue aux trois mouvements en paire : la sortie garçon
([spec](../spec-sortie-garcon.md)), la sortie fille ([spec](../spec-sortie-fille.md),
[notes](../notes-sortie-fille.md)) et les quarts de tour (`quartTurnStep`, `src/styles.ts`).
Les pieds et les appuis sont ceux des specs validées. Ce document leur **ajoute** les contacts
du haut du corps et les intentions. Il ne modifie aucune trajectoire. Le chantier #33, en cours,
peut changer certains détails des sorties (par exemple le pas 1 de la sortie garçon). Les
tableaux devront alors être relus.

Les numéros de contacts renvoient au [catalogue](points-de-contact.md#vue-densemble) : 1 main D
sur le dos, 2 avant-bras et coude D, 5 mains jointes, 6 bras G du suiveur, 7 haut du buste et
plexus, 8 bassin, 9 cuisses, 10 avant-pieds.

## Observation commune aux deux sorties

Les deux figures se terminent par la même configuration relative, **flanc droit contre flanc
droit**, que la danse de salon appelle *outside partner* ou banjo [S16] :

- dans la sortie garçon, c'est le **leader** qui passe à l'extérieur du D du suiveur, du côté gauche du leader ;
- dans la sortie fille, c'est le **suiveur** qui vient à droite du leader [S8].

Dans les deux cas, ce sont les faces extérieures des cuisses droites qui se rapprochent. C'est
cohérent avec la précision du propriétaire (milieu et haut des cuisses D) et avec la sortie
fille de Garcia [S8].

## Sortie garçon (`movement=sortieG`)

État actuel du code : les racines sont à 0,40 m (`SORTIE_GARCON_PAIR_DZ = 0.20`). La rotation du
thorax vaut `chestYaw = −contra × exit`, avec `contra` = 12° par défaut. L'enveloppe `exit`
monte entre 0 et 1, reste à 1 jusqu'au temps 2, puis redescend jusqu'au temps 3. Les deux
partenaires reçoivent le même lacet local. Comme leurs repères diffèrent de π, ils tournent dans
le même sens dans la salle. Les bras restent figés (`applyDanceFrame`). Ils tournent seulement
parce qu'ils sont enfants du thorax.

| Temps | Pieds (spec validée) | Contacts actifs | Intention transmise | Réponse du suiveur | Hanches (H) |
| --- | --- | --- | --- | --- | --- |
| 0 Départ | quinconce, D/G en appui | 1, 2, 5, 6 au neutre ; 7 haut des bustes (Pr) ; 10 avant-pieds (Pr) | connexion, cadre tonique | reste disponible sur le D | recherche : contact |
| 1 | leader G **plus en avant que de côté** (Pr), vers le couloir extérieur ; suiveur recule D | **7** le buste avance (compression) → 1 la main D garde le contact → 5 compression → pied G. Contre-corps : épaules vers la droite, hanches vers la gauche [S16] | **avancer**, et préparer la sortie à gauche du leader | recule le D ; son torse reste face au leader et tourne avec le cadre | début de **répulsion** : le bassin du leader quitte l'axe |
| 2 | leader D contourne le genou D du suiveur ; suiveur recule G | 7 reste face (contre-corps maintenu) ; 1 maintient le suiveur devant le leader (niveau 2) ; **9 milieu et haut des cuisses D** (Pr) | avancer à l'extérieur sans faire tourner le suiveur | recule le G ; flanc de cuisse D contre celui du leader | **répulsion** maximale : bassins décalés latéralement ; le contact passe aux cuisses |
| 3 | leader G croise devant le D, retour sur la ligne ; suiveur recule D | le contre-corps se relâche (`exit` redescend) ; 1 et 7 ramènent le cadre dans l'axe ; 9 se libère | **rentrer sur la ligne** en continuant d'avancer | recule le D ; son torse revient face | fin de répulsion |
| 4 | leader D revient au neutre par rapport à son G ; suiveur ajuste son G en face (variante : le couple se décale à droite du leader) | 7, 1, 5 au neutre ; 8 revient | se replacer ; dans la variante, **pas de côté** du cadre entier | s'ajuste en face | **retour** : le suiveur recherche le contact |
| 5 Marka | marka G leader, D suiveur, sans transfert | 7 et 1 : décélération, le poids reste en place [S8] | **marka** | pose le D sans transfert | recherche : contact |

Points à vérifier dans la sortie garçon :

- **Contre-corps.** En danse de salon, ce sont les hanches qui tournent vers la gauche ; les
  épaules restent face au partenaire [S16]. Dans le dépôt, le bassin ne tourne pas et le thorax
  tourne de 12° vers la droite. Les deux donnent un contre-corps, mais l'orientation du buste
  par rapport au suiveur diffère. Question au propriétaire : au temps 1, le buste du leader
  reste-t-il face au suiveur ou tourne-t-il vers sa droite ?
- **Ordre.** Les deux thorax tournent ensemble, sans écart : le code ne représente pas
  l'ordre buste du leader → buste du suiveur (la sortie fille, elle, introduit un décalage).

## Sortie fille (`movement=sortieF`)

État actuel du code : les racines sont à 0,40 m. Le leader commence à tourner le thorax à
b = 0,47 et le suiveur à b = 0,72, soit un quart de temps plus tard. Le lacet atteint −0,20 rad
(environ −11,5°) vers la droite de chacun, donc dans le même sens dans la salle. Il redescend
entre b = 2,15 et b ≈ 3,25. Les bras restent figés.

La séquence de Garcia [S8], lue en anglais, est très proche de celle du propriétaire. Les
différences sont signalées.

| Temps | Pieds (spec validée) | Contacts actifs | Intention transmise | Réponse du suiveur | Hanches (H) |
| --- | --- | --- | --- | --- | --- |
| 0 Départ | quinconce | 1, 2, 5, 6, 7, 10 | connexion | disponible sur le D | recherche |
| 1 | leader avance G ; suiveur recule D | **7** avance (le suiveur recule) ; puis le leader réduit l'avancée de sa poitrine : 7 se relâche, la poitrine se déconnecte [S8] → **1** la main D commence à glisser vers la droite du leader sur le dos du suiveur [S8] ; le thorax du leader amorce sa rotation à droite (code : b = 0,47) | **avancer**, puis annoncer l'ouverture | recule le D ; son torse commence à répondre (code : b = 0,72) | répulsion amorcée par l'ouverture du buste |
| 2 crochet | leader D en crochet vers sa droite jusqu'au niveau de son G ; suiveur décale G à gauche (latéral pur) | **2 et 1** : ouverture vers la droite du leader. Le cadre (bras droit) ou le buste, avec la contraposition, provoque la sortie (Pr, [notes](../notes-sortie-fille.md)). Variante possible : coude D aux côtes et avant-bras ouvert (Pr), à petite amplitude ; **6** la main G du suiveur décrit un cercle, son torse pivote à sa droite [S8] | **sortie de ligne du suiveur** : ouvrir un couloir à droite du leader | pas latéral du G vers sa gauche ; torse tourné vers sa droite (vers le leader) | **répulsion** : couloir ouvert entre les bassins |
| 2 recul (variante) | leader recule D ; suiveur avance G en diagonale gauche | 7 recule légèrement (le suiveur avance) ; 1 et 2 ouvrent comme au crochet | sortie du suiveur en avançant | G en diagonale vers sa gauche | répulsion |
| 3 | leader recule G ; suiveur avance D en diagonale, à droite du D leader | 7 : le leader recule en **gardant le torse tourné** [S8] ; 1 accompagne le suiveur vers l'avant ; **9 milieu et haut des cuisses D** (Pr ; extérieurs de cuisses selon [S8]) | **faire avancer** le suiveur le long du flanc droit du leader | avance le D ; cherche le contact de cuisse [S8] | le contact passe aux cuisses (flanc contre flanc) |
| 4 | leader recule D pour dégager ; suiveur croise G devant D | 7 : le torse du leader revient au neutre, signal de reconnexion [S8] ; 1 ramène le suiveur sur la ligne | **reconnexion**, retour sur la ligne | croise le G devant le D, torse revenu | **retour** : recherche |
| 5 Marka | marka G leader, D suiveur | décélération ; le leader garde le poids du même côté pour éviter un transfert prématuré [S8] | **marka** | ramène le D sans transfert | contact |

Différences avec Garcia [S8] :

- au temps 2, Garcia fait un **balance** du leader, sans pas, avec un blocage du recul du
  suiveur (frein, niveau 3) ; le dépôt fait un **crochet** ou un **recul** du D du leader ;
- Garcia garde le torse du leader tourné **pendant tout le temps 3** et le ramène au neutre au
  temps 4 ; le code relâche le lacet entre b = 2,15 et b ≈ 3,25, soit pendant le temps 3 ;
- Garcia décrit un contact de cuisses **extérieures** droites ; le propriétaire précise
  **milieu et haut** des cuisses droites. Les deux descriptions sont compatibles.

## Quarts de tour

Rappel du code : `quartTurnStep(b, reverse)` donne un cycle de 16 temps, soit quatre quarts de
quatre temps, chacun en deux demi-pas de deux temps. Au demi-pas 0, le pied G pivote à 90°, talon
au bout du D, et le **haut du corps** (`upperYaw`) suit. Au demi-pas 1, le pied D revient
parallèle et le **bas du corps** (`lowerYaw`) suit. En paire, le suiveur utilise `reverse=true`
(`App.tsx`, `reverseB`) : z est inversé, les lacets sont opposés, et les rôles G/D sont échangés.

| Demi-pas | Leader | Contacts actifs | Intention | Réponse du suiveur attendue (cadre) |
| --- | --- | --- | --- | --- |
| 0 (temps 0–2 du quart) | pied G pivoté à 90° vers la gauche ; le thorax suit le pied G | **7** : le thorax tourne en premier → le cadre tourne d'un bloc [S16] → **1** pivot de la main D [S7] | **quart de tour du couple** vers la gauche du leader | le torse répond d'abord, puis pivot du pied D en angle droit (demande de la phase 14) |
| 1 (temps 2–4) | pied D ramené parallèle ; le bassin rattrape le thorax | 7 et 1 stables ; 8 : les bassins se réalignent | fin de rotation, dissociation résolue | rassemble le G ; le bassin rattrape le torse ; recherche du contact de hanche |

**Constat à confirmer.** C'est un calcul à partir du code (`src/styles.ts` `quartTurnStep`,
`src/pose.ts` l. 215–219, `src/App.tsx` `reverseB`, groupe du suiveur tourné de π), pas une
observation du rendu. Le suiveur prend un lacet local opposé à celui du leader. Son lacet dans la
salle vaut donc π − θ quand celui du leader vaut θ.

| b | Leader (lacet dans la salle) | Suiveur (lacet dans la salle) |
| --- | --- | --- |
| 0 | 0° | 180° |
| 3,99 | 90° | 90° |
| 7,99 | 180° | 0° |

Après un quart, les deux danseurs regardent dans la même direction au lieu de se faire face. Le
suiveur est un **miroir gauche-droite** du leader ; il ne tourne pas avec lui autour d'un axe
commun. Ce choix est cohérent avec la règle de la phase 15 (le suiveur est le miroir exact du
leader). Mais un cadre fermé ne peut pas se maintenir pendant un tel mouvement : les mains et les
bustes se sépareraient.

Pour garder le cadre, le couple devrait tourner dans le même sens (lacet π + θ pour le suiveur),
avec des pieds symétriques par rapport au centre du couple. **À faire valider par le
propriétaire avant toute implémentation.** Les tests de l'oracle protègent le comportement
actuel.

## Références

- [S7] Garcia J. *Kizomba Disciplines.* Sans date. <https://jonnygarcia.netlify.app/kizomba-disciplines>
- [S8] Garcia J. *Kiz - Woman Saída.* Sans date. <https://jonnygarcia.netlify.app/kiz-woman-saida>
- [S16] West K. (10 mars 2026). *Improve Leading with an Effective Dance Frame.* CSULB. <https://home.csulb.edu/~kwest/wido/articles/dance-frame.pdf>
- Documents du dépôt : [spec sortie garçon](../spec-sortie-garcon.md), [spec sortie fille](../spec-sortie-fille.md), [notes sortie fille](../notes-sortie-fille.md), [phase 14](../spec-phase14-options-pivots.md), [phase 15](../spec-phase15-paire.md).
