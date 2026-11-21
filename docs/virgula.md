# Recherche — la « vírgula » (kizomba / semba angolais)

Demande 2026-11-18 : « Le pied doit faire un angle sur quart de tours. Renseigne-toi sur la
« virgula ». » Sources collectées en FR / ES / PT / EN / DE, citations verbatim.

## Qu'est-ce que la vírgula

- **aprendekizomba.com.es** (ES, « Pasos y técnicas de giro »,
  https://aprendekizomba.com.es/pasos-y-tecnicas-de-giro/) :
  > « **Vírgula ('coma' en portugués) es un cambio de dirección hacia la izquierda (más común) o
  > hacia la derecha y puede realizarse con diferentes grados de rotación: 1/4 de vuelta (giro de
  > 90 grados): generalmente llamado simplemente 1/4 de vuelta a derecha o izquierda.** »
  et « Base cuarto de giro a izquierda (vírgula) y derecha en avance ».
- **LovesKizomba** (cours « Kizomba Básico #4. Vírgula 90º »,
  https://loveskizomba.com/cursos-online/curso-de-kizomba-basico/kizomba-basico-4-virgula-90o/) :
  > « Concretamente veremos la Vírgula en la que **cada conjunto completo de tres pasos giramos
  > 90º el sentido de nuestra posición**… »
- **viens-danser.fr** (FR, « Apprendre à danser la kizomba »,
  https://www.viens-danser.fr/apprendre-kizomba/) :
  > « Son nom signifie « virgule » en portugais, ce qui décrit parfaitement sa forme : **un
  > déplacement en courbe, comme une virgule tracée au sol**. Le couple part d'une position
  > fermée. Le guide initie un léger pivot du buste qui invite la partenaire à sortir de l'axe,
  > puis à décrire un demi-cercle autour de lui. »
- **Kizomba-Lexikon, kizomba-freiburg.com** (DE) :
  > « **Virgula: Platzwechsel mit Básico. 1,2, wechselschritt, dabei drehen**, das ganze zwischen
  > Basicfiguren. » (changement de place avec le pas basique, pas alterné en tournant).

## Le pied pivote (appui sur la boule du pied)

- **Wikipedia EN, « Pivot turn »** (https://en.wikipedia.org/wiki/Pivot_turn) :
  > « a **pivot turn** … is a general classification for dance turns in which the performer's body
  > rotates about its vertical axis without traveling. The performer may be supported by one or
  > both feet, **which swivel in place during the pivot turn**. »
  > « in ballet, a pirouette is a type of pivot turn **on one foot**. »
- **countryroad.fr, lexique des danses** (http://www.countryroad.fr/danses/LEXIQUE.pdf) :
  > « **La pointe du pied tourne à l'extérieur, en pivotant sur le talon** et retour au centre » ;
  > « A Droite : **1/4 de tour sur le premier pas, demi tour sur le deuxième et quart de tour sur le
  > troisième** en tournant vers la droite ».

## Implications pour l'app (spec-phase11)

1. La vírgula = **changement de direction par quarts de tour (90°)** intégrés au pas de base
   (3 temps) : le corps tourne de 90° par ensemble de 3 pas, à gauche (plus commun) ou à droite.
2. Pendant le quart de tour, **les pieds pivotent sur place** (appui sur la boule du pied /
   swivel) : le **lacet (yaw) du pied suit le lacet du corps** — c'est « le pied fait l'angle ».
   Le contact au sol reste constant (cohérent avec la règle « pieds plantés » : petit pivot
   autorisé sur la boule du pied).
3. Implémentation : `quarts=1` (4 quarts de tour = tour complet) applique désormais
   `virgulaFootYawDelta(footWorldYaw, bodyWorldYaw)` au lacet local de chaque pied pour que le
   lacet monde du pied suive celui du root. Idem pendant les pivots du corridinho.
4. Visualisation : preset caméra `top` (vue plongeante) + boussole pour lire l'angle du pied
   par rapport aux directions fixes ; GIF `virgula-quarts.gif`.

## Définition du propriétaire (21 novembre 2026)

« Le fait d'aller vers l'avant avec le pied gauche perpendiculaire s'appelle une virgula. » C'est le
premier pas du quart de tour du leader : son G avance et se pose à angle droit, pointe vers sa gauche.

Emplois dans l'app :

- quarts de tour en paire : talon du G au bout du D ([spec](spec-quarts-paire.md)) ;
- sortie fille, variante crochet : G1 du leader, avec le buste qui ne suit pas le bassin
  (contraposition), pour que le buste du suiveur reste stable
  ([spec, #127](spec-sortie-fille.md#virgula-du-leader-au-premier-temps-variante-crochet-127-21-novembre-2026)) ;
- ida e volta en paire : effet de style du leader, en option (`virgula=1`), quand son G avance
  ([spec, #128](spec-ida-paire.md#virgula-du-leader-effet-de-style-128-21-novembre-2026)).

