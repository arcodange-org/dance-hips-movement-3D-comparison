# Correction de l’audit — poses finales (#17)

Base : main après phase 16, `3ccdc75`. Une PR regroupe ce chantier ; les phases 17/18 restent
indépendantes. Spécification rédigée avant implémentation.

## Contrat

- Une horloge musicale commune alimente tous les personnages. Monter un second personnage ou
  changer son style ne remet pas sa phase à zéro. La pose est une fonction déterministe du temps
  musical et des options ; elle peut être échantillonnée dans n’importe quel ordre.
- Extraire le moteur de pose du composant React. Le navigateur et les tests utilisent le même
  calcul, le même solveur et les transformations du GLB réel.
- Les longueurs hanche–genou et genou–cheville restent celles du GLB. La hauteur du bassin
  s’adapte à la flexion et à l’atteignabilité des cibles ; les os ne changent pas de longueur.
- Amendement du 18/11/2026 : `root.position.y >= 0` n’est plus un invariant. La racine peut
  descendre sous sa hauteur de repos pour plier les genoux. L’invariant physique porte sur les
  sommets des os et les appuis : sol y=0, tolérance de pénétration numérique 0,1 mm, erreur de
  cible de cheville ≤1 mm pour les configurations testées. La correction par sphères englobantes
  de phase 16 est remplacée par les sommets réels des pieds, sans faire flotter les appuis.
- Les pieds suivent des trajectoires périodiques explicites (appui puis balancement) ;
  transitions, raccords de pas et de cycles sont continus. Les quarts utilisent les positions
  interpolées, jamais une cible future directement comme translation du corps.
- Le corridinho conserve pivot droit, pivot gauche et cercle. Le départ du cercle suit la
  direction du corps (centre à (R,0), passage par l’origine), sans saut de lacet.
- Le HUD est calculé après l’IK. Les pourcentages sont un partage d’appui illustratif, non une
  force mesurée ; un pied levé a une part nulle. L’inclinaison du thorax est mesurée en monde
  et affichée en degrés, à la place d’une promesse de stabilité globale.
- Les marqueurs de genou suivent les KneePivot. Les couleurs indiquent la proximité de
  repères, jamais une preuve de contact entre surfaces. Conserver l’écartement et le lean
  plafonné de phase 16 ; aucune simulation mécanique du guidage n’est revendiquée.
- Un seul HUD est affiché en comparaison. L’export part du temps zéro, avance avec une horloge
  commune dédiée, couvre la période combinée du style et du mouvement, puis restaure la lecture.

## Tests

Charger `public/anatomy.glb` avec GLTFLoader en Node ; construire le buste avec des positions
partagées avec le rendu. Vérifier les matrices monde après application complète :

1. longueurs des os, erreur des cibles et sommets au-dessus du sol, sur six styles et plusieurs
   amplitudes, pas et sens (dont paire) ;
2. flexion effective et modulation du semba ; absence de remplacement systématique par une
   extension quasi totale ;
3. angles du HUD égaux à ceux de la pose, appui nul sur le pied levé, genoux suivis par leurs
   marqueurs ;
4. limites gauche/droite aux frontières des demi-pas et des cycles, tolérance 0,1 mm et 0,1° ;
5. indépendance à l’historique et à l’ordre d’échantillonnage, même phase après montage/changement
   de style ; durée d’export exacte pour les cycles 4/8/12/16 temps.

Les anciennes vérifications de formules sont conservées et amendées quand leur convention a
changé. Les tests d’intégration constituent la preuve des poses finales. Validation visuelle
Solo/Comparaison/Paire, GIFs ciblés, npm test, build et CI de PR. Les tolérances ne valent pas
validation de la technique de danse : revue d’enseignants et calibration humaine restent ouvertes.

## Résultat et domaine vérifié

6 styles × amplitudes 0,5 / 1 / 2 × 11 configurations × 33 temps = 6 534 poses, plus les tests
ciblés de frontières, mode libre et reproductions de revue. Les options combinées couvrent
notamment travel=1 + sortie + quarts/corridinho et le suiveur retourné. Tolérances contrôlées
sur tous les sommets osseux, pas sur une boîte ou un cercle englobant.

La projection horizontale du bassin utilise 60 % du rayon atteignable pour conserver une
marge verticale face aux os saillants (rotule), puis la hauteur est résolue avec les longueurs
réelles. C’est un choix illustratif vérifié sur ce domaine, pas un solveur de dynamique ni une
preuve pour toutes les options futures. Les flexions finales peuvent différer du paramètre
`posture.knee` ; le HUD expose leur valeur géométrique effective.

Les tests de transport/montage purs vérifient l’absence d’état interne au moteur, sans prétendre
monter React. La vérification navigateur complète cette preuve : même HUD pour deux styles
identiques après changement de style et après Solo → Comparaison, exports depuis la pause
puis retour à la pose précédente. Périodes logiques 4/8/12/16 temps (et PPCM des combinaisons) ;
les fichiers MediaRecorder restent soumis à la cadence du navigateur, sans garantie d’encodage
image par image. Mesures locales à 90 bpm : 2,641 s (4 temps) et 10,642 s (16 temps), soit moins
d’une image à 30 fps par rapport aux durées théoriques.
