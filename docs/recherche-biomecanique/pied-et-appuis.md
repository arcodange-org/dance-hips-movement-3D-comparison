# Pied, appuis et longueur de pas

[Accueil du dépôt](../../README.md) · [Recherche biomécanique](README.md) · [Confrontation au modèle](confrontation-modele.md)

Cette page réunit ce que la littérature dit des dimensions du pied, de son ouverture, de la base
de sustentation, du déroulé et de la longueur des pas. Elle compare ces valeurs aux mesures
faites sur le squelette du dépôt (`public/anatomy.glb`).

## 1. Le squelette du dépôt et sa stature de référence

- BodyParts3D décrit un modèle 3D du corps entier d'un homme adulte [1]. Une page
  encyclopédique sur Anatomography indique que ses polygones proviennent du jeu IRM « TARO »
  du NICT, en voxels de 2 mm [2]. Ce lien vient d'une source secondaire : le résumé de
  BodyParts3D ne nomme pas TARO.
- Le NICT donne pour TARO une taille de 172,8 cm et une masse de 65,0 kg [3]. Une autre page
  du NICT, vue seulement dans un résultat de recherche, mentionne 173,2 cm. La stature exacte
  reste donc incertaine d'environ 0,5 cm.
- Mesures faites sur le GLB avec un script Python ad hoc qui lit les sommets quantifiés. Ce
  script n'est pas versionné :
  - Pied osseux : environ 21,2 cm le long de l'axe avant-arrière du modèle (du talon à
    l'orteil le plus avancé), environ 22 cm le long de l'axe propre du pied. L'avant-pied
    mesure environ 9 cm de large au niveau des têtes métatarsiennes, et la boîte englobante
    12,4 cm.
  - Centre de cheville à 5,4 cm au-dessus de la semelle osseuse.
  - Centres des chevilles écartés de 14,2 cm au repos. Les centres des talons sont à environ
    13 cm l'un de l'autre.
  - Ouverture native de chaque pied (lacet 0) : de 14° à 21° vers l'extérieur selon la
    définition de l'axe. 14° pour la ligne talon → point le plus avancé, 21° pour la ligne
    centre du talon → centre de l'avant-pied.

## 2. Dimensions du pied vivant

- Sur 250 hommes de 18 à 23 ans (New Delhi), la taille moyenne est de 167,08 cm, la longueur
  du pied de 24,89 cm et la largeur de 9,59 cm [4]. Le pied fait donc environ 14,9 % de la
  stature, et sa largeur environ 0,39 fois sa longueur.
- Les rapports entre dimensions du pied et stature changent nettement avec l'âge et le sexe.
  Une proportion unique n'est donc pas une norme [5].
- Le pied du GLB représente environ 12,7 % de la stature TARO (22 / 172,8). L'écart avec un
  pied vivant s'explique au moins en partie par l'absence de tissus mous dans le modèle :
  coussinet du talon et pulpe des orteils. L'épaisseur du coussinet talonnier se mesure en
  échographie. Elle est plus forte chez les hommes et augmente avec la masse corporelle [6, 7].
  Ces résumés ne donnent pas de valeur moyenne exploitable ici.

## 3. Ouverture du pied et base de sustentation

- **Station debout libre** : sur 262 sujets de 19 à 97 ans, la position préférée place les
  centres des talons à 0,17 m l'un de l'autre, avec 14° entre les axes longitudinaux des deux
  pieds. Cela fait environ 7° par pied. La variabilité entre individus est grande [8].
- **Marche** : chez 98 adultes thaïlandais en bonne santé, la progression du pied reste en
  rotation externe sur tout le cycle. Elle vaut environ 8 à 12° par pied pendant l'appui et
  jusqu'à 22° en phase oscillante. Les hommes ont environ 5° de rotation externe de plus que
  les femmes [9]. Les auteurs relèvent aussi que les références du logiciel OrthoTrak
  diffèrent de leurs valeurs : ces normes dépendent de la population et de la méthode.
- Le pied du GLB s'ouvre de 14 à 21° par pied, soit 28 à 42° entre les axes. C'est plus que
  la station libre (14° entre les axes) et que la plupart des valeurs d'appui en marche. Voir
  [la confrontation](confrontation-modele.md).
- **Pied du danseur classique** : la danse classique place le pied « en dehors », à 90° du plan
  sagittal [10]. Cette convention n'a rien à voir avec les danses afro-diasporiques étudiées
  ici. Aucune source ne documente l'ouverture des pieds en kizomba, semba, kompa ou zouk.

## 4. Équilibre médio-latéral et transfert de poids

- Pendant la marche, l'équilibre médio-latéral du corps entier dépend surtout de l'endroit où
  le pied se pose latéralement. En appui unipodal, les abducteurs de hanche dominent le
  contrôle frontal du haut du corps [11].
- Debout, pieds côte à côte, le centre de pression est contrôlé en médio-latéral par un
  mécanisme de charge et décharge des abducteurs et adducteurs de hanche. En antéro-postérieur,
  ce sont les fléchisseurs plantaires et dorsaux de cheville [12].
- Ces deux résultats soutiennent la lecture du dépôt : en transfert latéral, le poids passe
  d'un pied à l'autre par les hanches. Le dépôt n'en simule pas les forces.

## 5. Déroulé du pied et appui sur l'avant-pied

- Marche : la cheville est près du neutre à l'attaque du talon (environ 1° de flexion dorsale).
  Elle atteint environ 7° de flexion dorsale en milieu d'appui et environ 14,5° en fin d'appui
  [9]. Ces valeurs indiquent la flexion dorsale nécessaire pour garder le pied à plat sous un
  genou fléchi.
- Danse classique : en demi-pointe, les danseuses formées oscillent moins et leur cinématique
  rachis-bassin varie moins que chez des non-danseuses [13]. Pour la danse irlandaise, la
  chaussure modifie la charge plantaire. L'avant-pied est le plus chargé avec le chausson souple
  [14]. En rumba et cha-cha-cha, la force verticale au sol et son taux de charge diminuent avec
  l'expérience, surtout en pas arrière et vers la gauche [15].
- Aucune mesure de pression plantaire ou de déroulé n'existe pour la kizomba, le semba, le kompa,
  la tarraxinha ou le zouk. La « réception sur l'avant-pied » du semba, dans
  [styles-de-danse.md](../styles-de-danse.md), vient de la spécification du handoff. Aucune
  source scientifique ne la confirme.

## 6. Longueur de pas

- Adultes en bonne santé (taille moyenne 165,6 cm) : à 1,1 m/s, le pas mesure 0,6 m et la
  foulée 1,2 m [9].
- Danseurs de tango avancés (rôle de guide, milonga) : la foulée vaut 1,24 m en marche normale
  et 1,36 m en marche tango, à vitesse égale (environ 1 m/s). La différence n'est pas
  significative. La marche tango réduit l'oscillation latérale du centre de masse en milieu
  d'appui. Les auteurs l'attribuent probablement à un pas plus étroit, sans l'avoir mesuré [16].
- Valse de compétition : la distance entre les chevilles pendant un pivot varie de 0,38 à
  1,11 m. Normalisée, elle représente 43 à 117 % de la longueur de jambe, avec des pas plus longs
  pour le couple champion [17].
- Aucune longueur de pas mesurée n'existe pour la kizomba ou le semba. Les consignes de « pas
  compacts » et de « pas ≤ largeur du bassin », citées dans [styles-de-danse.md](../styles-de-danse.md),
  sont pédagogiques.

## Références

1. Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K (2009). BodyParts3D: 3D structure database for anatomical concepts. *Nucleic Acids Res* 37(Database issue):D782-5. https://doi.org/10.1093/nar/gkn613 (résumé et page PMC lus).
2. Anatomography (page encyclopédique, source secondaire), sur reference.org. https://reference.org/facts/Anatomography/Kf1JMqGh
3. NICT, « Information on the provision » des modèles voxel TARO/HANAKO (tableau de comparaison physique moyenne / modèle). https://emc.nict.go.jp/bio/en-data-offer/information-on-the-provision.html ; modèle décrit dans Nagaoka T *et al.* (2004) *Phys Med Biol* 49(1):1-15. https://doi.org/10.1088/0031-9155/49/1/001
4. Singh JP, Rani Y, Meena MC, Murari A, Sharma GK (2013). Stature estimation from the dimensions of foot in males. *İnsanbilim Dergisi* 2(1):15-20. https://dergipark.org.tr/en/download/article-file/98111 (texte intégral lu).
5. Atamturk D, Duyar I (2008). Age-related factors in the relationship between foot measurements and living stature and body weight. *J Forensic Sci* 53(6):1296-300. https://doi.org/10.1111/j.1556-4029.2008.00856.x (résumé).
6. Taş S (2018). Effect of gender on mechanical properties of the plantar fascia and heel fat pad. *Foot Ankle Spec* 11(5):403-409. https://doi.org/10.1177/1938640017735891 (résumé).
7. Uzel M, Cetinus E, Ekerbicer HC, Karaoguz A (2006). Heel pad thickness and athletic activity in healthy young adults: a sonographic study. *J Clin Ultrasound* 34(5):231-6. https://doi.org/10.1002/jcu.20230 (résumé).
8. McIlroy WE, Maki BE (1997). Preferred placement of the feet during quiet stance: development of a standardized foot placement for balance testing. *Clin Biomech* 12(1):66-70. https://doi.org/10.1016/S0268-0033(96)00040-X (résumé).
9. Klaewkasikum K, Patathong T, Angsanuntsukh C, Woratanarat T, Sanguantrakul J, Woratanarat P (2022). The ankle kinematic reference of normal gait pattern in Thai adults. *Front Surg* 9:915090. https://doi.org/10.3389/fsurg.2022.915090 (texte intégral).
10. Thiescé A (1999). Pied et danse classique. *EMC Podologie* [27-140-A-65], Elsevier. https://www.em-consulte.com/article/1168/pied-et-danse-classique (résumé ; texte intégral payant).
11. Winter DA, MacKinnon CD, Ruder GK, Wieman C (1993). An integrated EMG/biomechanical model of upper body balance and posture during human gait. *Prog Brain Res* 97:359-67. https://doi.org/10.1016/s0079-6123(08)62295-5 (résumé).
12. Termoz N, Halliday SE, Winter DA, Frank JS, Patla AE, Prince F (2008). The control of upright stance in young, elderly and persons with Parkinson's disease. *Gait Posture* 27(3):463-70. https://doi.org/10.1016/j.gaitpost.2007.05.015 (résumé).
13. Fujii E, Yoshida Y, Kuno-Mizumura M, Maeda N, Sasadai J, Urabe Y (2025). Ballet-trained individuals demonstrate reduced postural sway and less variation of spinopelvic kinematics compared with an age-matched untrained group during demi-pointe standing. *Med Probl Perform Art* 40(4):145-154. https://doi.org/10.21091/mppa.2025.04016 (résumé).
14. Trégouët P, Merland F (2013). The effects of different shoes on plantar forces in Irish dance. *J Dance Med Sci* 17(1):41-6. https://doi.org/10.12678/1089-313x.17.1.41 (résumé).
15. Wells MD, Hackney ME, Yang F (2026). Effect of dance experience on loading patterns among ballroom dancers. *J Dance Med Sci* 30(3):333-346. https://doi.org/10.1177/1089313X251359492 (résumé).
16. Torres C, Minetti AE, Biancardi CM, Fábrica G (2026). Energetics, kinematics, and physiologic aspects of tango walking in the leader role. *PeerJ* 14:e21581. https://doi.org/10.7717/peerj.21581 (texte intégral via PMC).
17. Yoshida Y, Bizokas A, Demidova K, Nakai S, Nakai R, Nishimura T (2022). What are the kinematic characteristics of the world champion couple in competitive ballroom dance during the waltz's spin movement? *Front Sports Act Living* 4:941042. https://doi.org/10.3389/fspor.2022.941042 (texte intégral).
