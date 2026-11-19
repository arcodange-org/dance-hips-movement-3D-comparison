# Genou, hanche et hauteur du bassin

[Accueil du dépôt](../../README.md) · [Recherche biomécanique](README.md) · [Confrontation au modèle](confrontation-modele.md)

Dans le dépôt, la flexion de genou sert de posture de style (`posture.knee` de 0,12 à 0,34 rad
dans `src/styles.ts`). Elle est plafonnée à 0,45 rad (≈ 26°) en figure de couple et à 1,2 rad
hors figure (`src/pose.ts`). La hauteur du bassin découle de la portée des jambes résolue par IK.

## 1. Flexion du genou en appui : marche et danse

- **Marche et vitesse** : une méta-analyse sur l'effet de la vitesse trouve, chez l'adulte jeune,
  une baisse nette de l'angle de flexion du genou quand la vitesse diminue (effet de grande
  taille) [1]. Une marche lente fléchit donc moins le genou en appui qu'une marche rapide. La
  méta-analyse ne donne pas de valeur absolue de référence.
- **Tango** : chez 17 danseurs avancés en rôle de guide, la marche tango s'accompagne d'une
  flexion du genou plus grande pendant tout l'appui que la marche spontanée, à vitesse égale.
  Les différences se concentrent sur certaines phases de l'appui [2]. Le coût métabolique
  augmente d'environ 50 % sans hausse proportionnelle du travail mécanique [2].
- **Danse orientale** : une posture basse, genoux plus fléchis, favorise l'amplitude de
  l'oscillation frontale du bassin [3].
- **Kizomba et semba** : la flexion légère et relâchée des genoux est décrite comme essentielle.
  Cette consigne vient de sources pédagogiques déjà citées dans le dépôt
  ([ginga-angolana.md](../ginga-angolana.md), [posture-contraposition.md](../posture-contraposition.md)),
  pas d'études mesurées. Aucune valeur angulaire publiée n'a été trouvée.
- Des références cinématiques de la marche normale existent [4, 5]. Leurs valeurs angulaires
  n'ont pas pu être vérifiées dans le texte intégral (articles payants ou tableaux illisibles).
  Aucune n'est donc reprise ici.

## 2. Flexion de genou et cheville

Un genou fléchi avec le pied à plat exige de la flexion dorsale de cheville. À la marche, la
cheville atteint environ 7° de flexion dorsale en milieu d'appui et environ 14,5° en fin d'appui
[6]. Le modèle garde le pied à plat (`foot.rotation.x = -(hip.x + knee.x)`) : il impose
implicitement cette flexion dorsale. La flexion dorsale passive maximale fait l'objet d'études
normatives [7, 8]. Leurs chiffres n'ont pas été relevés (texte intégral non consulté).

## 3. Amplitudes normales de hanche et de genou

- Des données normatives d'amplitude active de hanche et de genou existent en population
  générale, à partir de l'enquête NHANES I (1 683 sujets analysés). Elles s'écartent des valeurs
  des manuels de 18° au maximum et baissent avec l'âge, surtout en extension de hanche [9].
- Des mesures passives (goniomètre, techniques de l'AAOS) sur 210 hanches, 180 genoux et
  192 chevilles d'hommes de 30 à 40 ans diffèrent aussi des références antérieures [7].
- Kinésithérapeutes formés, 674 sujets de 2 à 69 ans : les femmes ont plus d'amplitude que les
  hommes, et les amplitudes diminuent avec l'âge [8].
- Les résumés lus ne donnent pas les moyennes. Ce relevé ne cite donc aucune valeur maximale.
  Les flexions du modèle (≤ 26° en figure, ≤ 69° hors figure) restent qualitativement loin des
  limites articulaires du genou. La question de pertinence porte sur la consigne de style,
  pas sur l'amplitude articulaire.

## 4. Muscles de la hanche dans le contrôle du bassin

- Une revue de kinésiologie de la hanche distingue les actions « fémur sur bassin » et « bassin
  sur fémur ». En appui, le bassin tourne sur la tête fémorale, ce qui fait intervenir les
  muscles du tronc en coactivation [10]. C'est exactement le cas des isolations du bassin pieds
  plantés.
- Pendant la marche, la chute du bassin du côté non porteur est associée à une activité moindre
  des abducteurs de hanche (moyen fessier). Porter une charge d'un seul côté augmente l'activité
  des abducteurs du côté opposé [11].
- En appui unipodal, les abducteurs de hanche dominent l'équilibre frontal du haut du corps
  pendant la marche [12].

## 5. Hauteur du bassin

- Le dépôt laisse descendre le bassin (style, flexion de genou), avec des longueurs osseuses
  constantes. La hauteur de hanche du GLB vaut 0,8835 m, soit environ 51 % de la stature TARO
  de 172,8 cm (voir [pied-et-appuis.md](pied-et-appuis.md)).
- Aucune étude ne donne de hauteur de bassin ou d'abaissement du centre de masse mesurés en
  kizomba ou semba. La marche tango modifie la trajectoire du centre de masse : moins
  d'oscillation latérale en milieu d'appui, trajectoire antéro-postérieure différente [2].

## Références

1. Fukuchi CA, Fukuchi RK, Duarte M (2019). Effects of walking speed on gait biomechanics in healthy participants: a systematic review and meta-analysis. *Syst Rev* 8:153. https://doi.org/10.1186/s13643-019-1063-z (texte intégral via PMC).
2. Torres C, Minetti AE, Biancardi CM, Fábrica G (2026). Energetics, kinematics, and physiologic aspects of tango walking in the leader role. *PeerJ* 14:e21581. https://doi.org/10.7717/peerj.21581 (texte intégral via PMC).
3. Tournillon A, Siegler IA (2021). Voluntary control of pelvic frontal rotations in belly dance experts. *Hum Mov Sci* 77:102791. https://doi.org/10.1016/j.humov.2021.102791 (résumé).
4. Kadaba MP, Ramakrishnan HK, Wootten ME (1990). Measurement of lower extremity kinematics during level walking. *J Orthop Res* 8(3):383-92. https://doi.org/10.1002/jor.1100080310 (résumé).
5. Öberg T, Karsznia A, Öberg K (1994). Joint angle parameters in gait: reference data for normal subjects, 10-79 years of age. *J Rehabil Res Dev* 31(3):199-213. PMID 7965878 (résumé ; tableaux non lus).
6. Klaewkasikum K, Patathong T, Angsanuntsukh C, Woratanarat T, Sanguantrakul J, Woratanarat P (2022). The ankle kinematic reference of normal gait pattern in Thai adults. *Front Surg* 9:915090. https://doi.org/10.3389/fsurg.2022.915090 (texte intégral).
7. Roaas A, Andersson GB (1982). Normal range of motion of the hip, knee and ankle joints in male subjects, 30-40 years of age. *Acta Orthop Scand* 53(2):205-8. https://doi.org/10.3109/17453678208992202 (résumé).
8. Soucie JM, Wang C, Forsyth A, Funk S, Denny M, Roach KE *et al.* (2011). Range of motion measurements: reference values and a database for comparison studies. *Haemophilia* 17(3):500-7. https://doi.org/10.1111/j.1365-2516.2010.02399.x (résumé).
9. Roach KE, Miles TP (1991). Normal hip and knee active range of motion: the relationship to age. *Phys Ther* 71(9):656-65. https://doi.org/10.1093/ptj/71.9.656 (résumé).
10. Neumann DA (2010). Kinesiology of the hip: a focus on muscular actions. *J Orthop Sports Phys Ther* 40(2):82-94. https://doi.org/10.2519/jospt.2010.3025 (résumé).
11. Graber KA, Loverro KL, Baldwin M, Nelson-Wong E, Tanor J, Lewis CL (2021). Hip and trunk muscle activity and mechanics during walking with and without unilateral weight. *J Appl Biomech* 37(4):351-358. https://doi.org/10.1123/jab.2020-0273 (résumé).
12. Winter DA, MacKinnon CD, Ruder GK, Wieman C (1993). An integrated EMG/biomechanical model of upper body balance and posture during human gait. *Prog Brain Res* 97:359-67. https://doi.org/10.1016/s0079-6123(08)62295-5 (résumé).
