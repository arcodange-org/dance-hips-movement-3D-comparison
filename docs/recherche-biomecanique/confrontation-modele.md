# Confrontation du modèle à la littérature

[Accueil du dépôt](../../README.md) · [Recherche biomécanique](README.md)

Le dépôt présente déjà ses distances et ses angles comme un calibrage du modèle, pas comme une
norme de danse. Ce tableau indique, paramètre par paramètre, si la littérature trouvée conforte
ce calibrage, le contredit ou ne dit rien.

Verdicts :

- **cohérent** : la valeur tombe dans les ordres de grandeur publiés, ou une description publiée
  la soutient qualitativement ;
- **à revoir** : la valeur s'écarte des données publiées sans justification documentée ;
- **non documenté** : aucune donnée publiée vérifiée.

Les mesures du GLB citées ici viennent d'un script Python ad hoc qui lit les sommets de
`public/anatomy.glb`. Ce script n'est pas versionné. Les numéros entre crochets renvoient aux
références de cette page.

## Tableau

| Paramètre du dépôt | Valeur dans le code | Valeurs de la littérature | Verdict | Sources |
| --- | --- | --- | --- | --- |
| Largeur de hanche `HIP_WIDTH` (`src/anatomy.ts`) : amplitude latérale (±17 cm) et déport des sorties | 0,34 m. Bassin osseux du GLB : environ 29 cm (os iliaques), environ 30 cm (fémurs) | Aucune norme anthropométrique de largeur de hanche vérifiée (ANSUR II, NHANES non accessibles ou sans cette mesure). Les consignes de « pas ≤ largeur du bassin » sont pédagogiques | non documenté | — |
| Écart des chevilles au repos (`anatomy_meta.json`) | 14,2 cm entre les centres des chevilles, environ 13 cm entre les talons | Station libre : 17 cm entre les centres des talons en moyenne, grande variabilité | cohérent (un peu plus étroit que la moyenne) | [1] |
| Dimensions du pied (os du GLB) | Environ 21-22 cm de long, environ 9 cm de large à l'avant-pied, soit 12,7 % de la stature TARO (172,8 cm) | Pied vivant : 24,9 × 9,6 cm pour une taille de 167 cm (environ 14,9 %). Le rapport à la stature varie avec l'âge et le sexe | cohérent pour un pied osseux ; à revoir si l'enveloppe du pied sert d'empreinte (tissus mous absents) | [2, 3, 4] |
| Ouverture native du pied (toe-out), lacet 0 dans les figures | 14 à 21° par pied, soit 28 à 42° entre les axes | Station libre : 14° entre les axes (environ 7° par pied). Marche : 8 à 12° de rotation externe par pied en appui, environ 5° de plus chez l'homme | à revoir | [1, 5] |
| Hauteur de cheville et semelle osseuse au sol | Centre de cheville à 5,4 cm ; os du pied posés sur y = 0 | Le coussinet talonnier sépare le calcanéum du sol. Son épaisseur se mesure en échographie (valeurs non relevées) | non documenté (biais probable : squelette légèrement trop bas) | [6] |
| Amplitudes de pas, sortie garçon (`src/sortieGarcon.ts`) | Guide : 37 cm au pas 1 (34 latéral, 14 avant), puis 52, 66 et 45 cm. PR #33 : pas 1 de 43 cm (34 avant, 26 à gauche). Suiveur : 14, 40, 56 et 30 cm | Foulée de marche : 1,2 m à 1,1 m/s, 1,24 m à environ 1 m/s. Valse : 0,38 à 1,11 m entre les chevilles. Aucune mesure en kizomba | cohérent avec des « pas compacts » (≈ 30-55 % d'une foulée) ; rapport avant/côté du pas 1 non documenté | [5, 7, 8] |
| Amplitudes de pas, sortie fille (`docs/spec-sortie-fille.md`) | Diagonales du pas 3 : 98 cm (crochet) et 93 cm (recul). Reculs de 42 à 55 cm | Environ 75 à 82 % d'une foulée de marche à environ 1 m/s | à revoir (long pour une danse lente « près du sol ») | [5, 7] |
| Plafond de flexion du genou (`src/pose.ts`) | 0,45 rad (≈ 26°) en figure ; 1,2 rad hors figure ; posture de style de 0,12 à 0,34 rad | Le tango fléchit plus le genou en appui que la marche. Une posture basse augmente l'amplitude pelvienne en danse orientale. La marche lente fléchit moins le genou. Aucune valeur pour la kizomba | non documenté (valeur) ; cohérent qualitativement avec une « flexion légère » | [7, 9, 10] |
| Contraposition du thorax, sortie garçon | 12° par défaut (réglable de 0 à 30°) | Thorax à la marche : environ 4,6° crête à crête en transverse. Valse : cage thoracique/bassin de 7,1° à −10,7°. Rotation maximale T1/L1 : 24,9° par côté | cohérent | [11, 12, 13] |
| Isolation du haut du tronc `iso=1` (`lockUpperTrunk`) | Roulis du bassin entièrement compensé, buste vertical | Couplage systématique bassin–ceinture scapulaire en frontal et en transverse, même chez des expertes | à revoir (idéalisation assumée à documenter) | [14, 15] |
| Écartement du couple (`PAIR_DZ`, `SORTIE_GARCON_PAIR_DZ`) | Racines à 35 cm (0,175 m par danseur) et à 40 cm dans les sorties (0,20 m) | Aucune distance publiée. Salon en position fermée : bassin et cuisses en contact | non documenté | [16, 17] |
| Rapprochement en quinconce (PR #33) | Décalage latéral relatif de 7,2 cm, rapprochement de 3,5 cm par danseur jusqu'à l'amplitude 1 | Position fermée de salon : seules les moitiés droites se superposent. Décalage non chiffré | cohérent qualitativement ; valeur non documentée | [16, 17] |
| Contact des cuisses droites (PR #33 et sorties) | Enveloppes illustratives de rayon 8,5 cm autour des fémurs ; contact voulu au milieu ou en haut de la cuisse | Cuisses en contact en position fermée de salon. Cuisses et genoux cités parmi les contacts de l'abrazo de kizomba | cohérent qualitativement ; rayon non documenté | [16, 18] |
| Roulis du bassin, kizomba et suave | ±0,05 rad (±2,9°) et ±0,03 rad (±1,7°) | Obliquité à la marche : 6 à 9° crête à crête (±3 à ±4,5°) | cohérent (« sous-produit de la marche ») | [11] |
| Roulis du bassin, semba et kompa | ±0,09 rad (±5,2°) et ±0,088 rad (±5,0°) | Légèrement au-dessus de l'obliquité de marche | non documenté (plausible pour un déhanché amplifié) | [11] |
| Roulis, tilt et lacet, tarraxinha | Roulis ±0,16 rad (±9,2°), tilt ±0,14 rad (±8,0°), lacet ±0,12 rad (±6,9°) | Environ deux fois l'obliquité de marche ; tilt de marche de 2 à 4° crête à crête. Isolation volontaire non chiffrée. Les expertes de danse orientale ont moins d'amplitude que les novices | non documenté | [11, 14, 15] |
| Lacet du bassin, zouk | ±0,18 rad (±10,3°), soit 20,6° crête à crête | Rotation à la marche : 4 à 17° crête à crête selon les études ; elle augmente avec la vitesse | non documenté (haut de fourchette) | [11] |
| Plafond des rotations du bassin en figure (`src/pose.ts`) | 0,12 rad (≈ 6,9°) sur chaque axe | Dans la fourchette de la marche pour l'obliquité ; contrainte de dégagement géométrique, pas une norme | cohérent | [11] |
| Forces de guidage | Aucune simulation de forces ; appuis illustratifs | Forces d'interaction aux mains de 10 à 30 N, interprétées comme des indices de guidage | cohérent | [19] |

## Contradictions et incertitudes

1. **Isolation parfaite et réalité motrice.** Les sources pédagogiques du dépôt
   ([ginga-angolana.md](../ginga-angolana.md)) demandent des épaules immobiles. Elles ont guidé
   le choix `iso=1`. La seule étude cinématique d'isolation volontaire trouvée montre au contraire
   un couplage inévitable entre bassin et ceinture scapulaire, même chez des expertes [14, 15].
   Le modèle montre donc l'intention pédagogique, pas un mouvement mesuré.
2. **Vitesse lente et contre-rotation.** À vitesse lente, la marche coordonne plutôt le bassin et
   le thorax en phase. La contre-rotation n'apparaît qu'en marche rapide [20]. Une dissociation
   franche dans une danse lente est donc un geste appris. Aucune étude ne l'a mesurée en kizomba.
3. **Normes de marche transposées à la danse.** Presque toutes les valeurs du tableau viennent de
   la marche à environ 1 m/s, de la danse orientale ou de la danse de salon. Aucune ne porte sur
   la kizomba, le semba, le kompa, la tarraxinha, le suave ou le zouk.
4. **Variabilité des études de référence.** La rotation du bassin à la marche varie de 4 à 17°
   crête à crête selon le laboratoire, le support et la méthode [11]. Les normes de progression
   du pied dépendent aussi de la population, et le logiciel OrthoTrak donne d'autres valeurs [5].
5. **Mesure de l'ouverture du pied.** La valeur de 14 à 21° dépend de l'axe choisi sur un pied
   osseux sans repère cutané. Elle doit être confirmée par une mesure contrôlée, par exemple
   l'axe talon → deuxième métatarsien.
6. **Stature de référence.** BodyParts3D est rattaché au jeu TARO par une source secondaire. Le
   NICT donne 172,8 cm [3]. Une autre page du NICT, vue seulement dans un résultat de recherche,
   indiquerait 173,2 cm.
7. **Amplitude et expertise.** En danse orientale, les expertes produisent moins d'amplitude
   pelvienne que les novices [15]. Augmenter l'amplitude d'un style ne le rend donc pas plus
   « juste ».
8. **Contact et enveloppes.** Les enveloppes de 8,5 cm et l'écartement de 40 cm sont des choix
   géométriques. Aucune source ne fournit de rayon de cuisse vérifié ni d'écartement mesuré dans
   un couple de kizomba.

## Points à faire valider par le propriétaire

1. **Ouverture des pieds** : garder l'ouverture native du GLB (environ 14 à 21° par pied) ou
   appliquer un lacet de pied pour se rapprocher de 7 à 12° par pied ? Quelle ouverture observe-t-il
   chez les danseurs de kizomba ?
2. **Pied osseux et empreinte** : faut-il ajouter une marge de tissus mous (talon, orteils) dans
   les contrôles de dégagement des pieds, et un léger rehaussement du squelette pour le coussinet
   talonnier ?
3. **Isolation** : garder une compensation complète (`iso=1`), présentée comme une idéalisation
   pédagogique, ou proposer un couplage résiduel réglable entre bassin et buste ?
4. **Sortie fille** : les diagonales de 93 à 98 cm lui paraissent-elles réalistes en kizomba, ou
   faut-il resserrer le placement de départ ?
5. **Pas 1 de la sortie garçon** : confirmer sur vidéo le rapport avant/côté (34 cm avant, 26 cm
   à gauche selon la PR #33).
6. **Contact des cuisses** : confirmer la hauteur de contact (milieu ou haut de la cuisse droite)
   et accepter le rayon de 8,5 cm comme approximation de la peau.
7. **Écartement selon le style** : faut-il un écartement plus serré pour la tarraxinha (contact
   des hanches) que pour la kizomba (espace sous les hanches) ?
8. **Flexion des genoux** : le plafond de 0,45 rad en figure donne-t-il visuellement la « légère
   flexion » attendue ?
9. **Semba sur l'avant-pied** : la réception sur l'avant-pied vient de la spécification du handoff.
   Le propriétaire la confirme-t-il ?

## Références

1. McIlroy WE, Maki BE (1997). Preferred placement of the feet during quiet stance: development of a standardized foot placement for balance testing. *Clin Biomech* 12(1):66-70. https://doi.org/10.1016/S0268-0033(96)00040-X
2. Singh JP, Rani Y, Meena MC, Murari A, Sharma GK (2013). Stature estimation from the dimensions of foot in males. *İnsanbilim Dergisi* 2(1):15-20. https://dergipark.org.tr/en/download/article-file/98111
3. NICT, modèles voxel TARO/HANAKO, page « Information on the provision ». https://emc.nict.go.jp/bio/en-data-offer/information-on-the-provision.html
4. Atamturk D, Duyar I (2008). Age-related factors in the relationship between foot measurements and living stature and body weight. *J Forensic Sci* 53(6):1296-300. https://doi.org/10.1111/j.1556-4029.2008.00856.x
5. Klaewkasikum K, Patathong T, Angsanuntsukh C, Woratanarat T, Sanguantrakul J, Woratanarat P (2022). The ankle kinematic reference of normal gait pattern in Thai adults. *Front Surg* 9:915090. https://doi.org/10.3389/fsurg.2022.915090
6. Uzel M, Cetinus E, Ekerbicer HC, Karaoguz A (2006). Heel pad thickness and athletic activity in healthy young adults: a sonographic study. *J Clin Ultrasound* 34(5):231-6. https://doi.org/10.1002/jcu.20230
7. Torres C, Minetti AE, Biancardi CM, Fábrica G (2026). Energetics, kinematics, and physiologic aspects of tango walking in the leader role. *PeerJ* 14:e21581. https://doi.org/10.7717/peerj.21581
8. Yoshida Y, Bizokas A, Demidova K, Nakai S, Nakai R, Nishimura T (2022). What are the kinematic characteristics of the world champion couple in competitive ballroom dance during the waltz's spin movement? *Front Sports Act Living* 4:941042. https://doi.org/10.3389/fspor.2022.941042
9. Tournillon A, Siegler IA (2021). Voluntary control of pelvic frontal rotations in belly dance experts. *Hum Mov Sci* 77:102791. https://doi.org/10.1016/j.humov.2021.102791
10. Fukuchi CA, Fukuchi RK, Duarte M (2019). Effects of walking speed on gait biomechanics in healthy participants: a systematic review and meta-analysis. *Syst Rev* 8:153. https://doi.org/10.1186/s13643-019-1063-z
11. Fang X, Jiang Z (2020). Three-dimensional thoracic and pelvic kinematics and arm swing maximum velocity in older adults using inertial sensor system. *PeerJ* 8:e9329. https://doi.org/10.7717/peerj.9329 (synthèse de Whittle et Levine 1999, Staszkiewicz *et al.* 2012, Crosbie *et al.* 1997, Stokes *et al.* 1989).
12. Yoshida *et al.* (2022), voir [8] : angle cage thoracique/bassin, tableau 5.
13. Fujimori T, Iwasaki M, Nagamoto Y, Ishii T, Kashii M, Murase T *et al.* (2012). Kinematics of the thoracic spine in trunk rotation: in vivo 3-dimensional analysis. *Spine* 37(21):E1318-28. https://doi.org/10.1097/BRS.0b013e318267254b
14. Tournillon et Siegler (2021), voir [9].
15. Tournillon A (2021). *Effet de l'expertise en danse orientale sur le contrôle et les coordinations du tronc lors de mouvements rythmiques du bassin*. Thèse, Université Paris-Saclay. https://theses.fr/2021UPASW012
16. Yoshida *et al.* (2022), voir [8] : description de la position fermée.
17. Vaczi M, Tekus E, Atlasz T, Cselko A, Pinter G, Balatincz D *et al.* (2016). Ballroom dancing is more intensive for the female partners due to their unique hold technique. *Physiol Int* 103(3):392-401. https://doi.org/10.1556/2060.103.2016.3.11
18. Pollock T (2018). Desiring connection: affect in the embodied experience of kizomba dance. *Capacious* 1(2). https://doi.org/10.22387/CAP2018.12
19. Sawers A, Bhattacharjee T, McKay JL, Hackney ME, Kemp CC, Ting LH (2017). Small forces that differ with prior motor experience can communicate movement goals during human-human physical interaction. *J Neuroeng Rehabil* 14:8. https://doi.org/10.1186/s12984-017-0217-2
20. Lamoth CJ, Meijer OG, Wuisman PI, van Dieën JH, Levin MF, Beek PJ (2002). Pelvis-thorax coordination in the transverse plane during walking in persons with nonspecific low back pain. *Spine* 27(4):E92-9. https://doi.org/10.1097/00007632-200202150-00016
