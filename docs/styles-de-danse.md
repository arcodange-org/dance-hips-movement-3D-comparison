# Différences biomécaniques entre les six styles

Source : spec biomécanique chiffrée du projet (`SPEC.md` du handoff, résumée ici). L'app anime
un rig paramétrique par courbes f(temps) issues de cette spec — pas de mocap.

## Cadre d'analyse commun

Le « déhanché » se décompose en **4 leviers** :

1. translation latérale du bassin,
2. bascule sagittale (tilt antérieur/postérieur),
3. rotation axiale (yaw),
4. dissociation thoraco-pelvienne.

L'ancrage se juge sur **3 paramètres** : flexion de genou, roulé de pied (talon → plat →
avant-pied), complétude du transfert de poids.

## Tableau comparatif

| Levier | Kizomba | Semba | Kompa | Tarraxinha | Suave | Zouk brésilien |
|---|---|---|---|---|---|---|
| Bassin | neutre, sous-produit du transfert | pas d'isolation, déhanché amplifié | translation latérale pure + drop côté appui | isolation maximale : cercles et « 8 » (roulis ±0,16 rad, tilt ±0,14, yaw ±0,12) | « 8 couché » centimétrique, sur place | yaw d'ouverture ±0,20 rad sur les grandes foulées |
| Haut du corps | suit le bassin | dressé/athlétique | quasi immobile | strictement immobile | vague séquentielle L5→dorsales→tête | retard élastique (catch tardif), cambré, contre-balance |
| Genoux | flexion légère absorbante ≈ 0,10 rad | pompage fort (bounce) ≈ 0,15–0,50 rad | fléchis en continu ≈ 0,28 rad | souples, niveau bas constant | 0,14 ± 0,10 rad | 0,12–0,42 rad, variations de niveau (rise and fall, dips) |
| Pieds | pas courts, transferts 100 %, réception douce | ressort, quittent le sol | glissés plein appui, silencieux | statiques, plein appui | talons au sol, transferts partiels 60/40 | appui avant-pied, pression continue, foulées longues |
| Niveau | constant | rebond vertical dominant | bas constant | bas constant | bas constant, aucun rise-and-fall | le plus variable des six |
| Pattern | pauses longues sur place | changements de direction nets | « pas, rassembler, pas, pause » (hip check temps 4) | pas < longueur de pied, déplacement quasi nul | 2 temps par cycle | catch retardé du temps |
| Tempo | ≈ 90 bpm | ≈ 130 bpm | 110–130 bpm (accents 2 et 4) | lent | lent (~60 bpm) | ≈ 110 bpm |

## Par style

### Kizomba (traditionnelle)
Bassin neutre : le mouvement pelvien est un sous-produit du transfert de poids, pas une
isolation. Pas courts (une longueur de pied), transferts complets (100 % du poids par pas),
réception douce avant-pied → plein pied, pauses longues. Niveau constant, genoux légèrement
fléchis et absorbants (≈ 0,10 rad). Roulis du bassin ≈ ±0,045 rad suivant les pas ; marche lente.
Urban kiz : cadre plus tendu, arrêts nets, encore moins de mouvement pelvien.

### Semba
Rebond vertical dominant (bounce) par pompage des genoux et chevilles ; réception sur
l'avant-pied, pieds « ressort » qui quittent le sol. Posture dressée/athlétique, déplacements
amples, changements de direction nets. Déhanché de marche amplifié (inclinaison latérale côté
appui), aucune isolation. Tempo ≈ 130 bpm (vs ≈ 90 pour la kizomba).

### Kompa (konpa haïtien)
Translation latérale pure du bassin en balancier + inclinaison (pelvic drop) côté appui. Pattern
« pas, rassembler, pas, pause » avec pause marquée sur le temps 4 et micro-balancement (hip
check). Genoux fléchis en continu (≈ 0,28 rad), niveau bas constant. Pieds glissés plein appui,
réception silencieuse. Épaules et buste quasi immobiles : tout le mouvement visible est sous la
ceinture. Tempo 110–130 bpm, accents sur les temps 2 et 4.

### Tarraxinha
Isolation pelvienne volontaire maximale : cercles et « 8 » (tilt + translation + rotation).
Roulis ≈ ±0,16 rad, tilt ≈ ±0,14 rad, yaw ≈ ±0,12 rad. Haut du corps strictement immobile
(dissociation thoraco-pelvienne maximale). Pieds statiques largeur de bassin, plein appui, pas <
longueur du pied, déplacement quasi nul. Genoux légèrement fléchis en permanence. Guidage par
contact des hanches.

### Suave (kizomba)
Balancement lent sur place : le bassin dessine un « 8 couché » (translation + bascule +
rotation, amplitude centimétrique). Vague corporelle séquentielle L5 → dorsales → tête
(flexion lombaire puis extension thoracique) : pas une isolation, une transmission. Transferts
de poids partiels oscillants (≈ 60/40). Talons au sol, plein appui, niveau bas constant, aucun
rise-and-fall. Position d'équilibre entre ginga (trop passive) et tarraxinha (trop isolée) ;
souvent 2 temps par cycle.

### Zouk brésilien
Déhanché généré par l'amplitude des pas + transfert retardé (« catch » tardif du temps,
élasticité). Rotation d'ouverture de hanche sur les grandes foulées (yaw ≈ ±0,20 rad). Cambré
(extension lombaire contrôlée), body waves, contre-balance tête/bassin. Le plus de variations
de niveau des six styles (élévations, descentes, dips). Appui avant-pied, pression continue dans
le sol, foulées longues. Zouk antillais (zouk love) : base latérale « 3 temps + pause », petits
pas glissés, déhanché balancier — biomécaniquement plus proche du kompa.

## Ressources

- Z-Anatomy (template Blender, modèles dérivés de BodyParts3D, contient Z-Biomechanics.7z
  « human biomechanics as a rig ») : https://github.com/Z-Anatomy/Models-of-human-anatomy
- BodyParts3D (maillages OBJ) : https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
