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

> **Description à refaire.** Le propriétaire, le 22 novembre 2026 : « Le konpa est complètement faux
> actuellement: c'est le 8 le plus prononcé justement. » Ce paragraphe, qui vient de la spec d'origine, décrit
> un balancier de côté, et le modèle l'applique. Ce que les sources disent du pas et du bassin est dans
> [la recherche sur la danse kompa](recherche-danse/kompa.md) (#161) ; le mouvement se refera avec le « 8 » (#159).

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

## Nuances des pas de base (sources externes, vérifiées 2026-11)

Cette section ancre les mouvements implémentés dans `src/styles.ts` sur des sources décrivant
les pas réels (et non sur la seule spec biomécanique). Les captures GIF de `docs/gifs/`
(motion design : pastille de style + nuance + pastille de temps) illustrent chaque nuance.

### Kizomba / passado — « 2 temps » latéral sur place + sorties
- **2 temps** : l'homme déplace sa partenaire sur la gauche, vient marquer le sol
  (**marqua**) en joignant les pieds, puis se déplace sur la droite et marque à nouveau
  ([Wikipédia FR — Kizomba](https://fr.wikipedia.org/wiki/Kizomba)). Le « touch » du pied qui
  rejoint se fait **sans poids**, et le pas ne dépasse pas la largeur du bassin
  ([cours-kizomba.com](https://cours-kizomba.com/blog/kizomba-pour-debutant-novice-le-guide-complet)).
- **Sortie garçon (5 temps)** : l'homme avance et **sort de la ligne de danse sur la gauche**,
  puis revient en face de sa partenaire ; **sortie fille (5 temps)** : la partenaire sort de la
  ligne puis y revient (même source Wikipédia). Dans l'app (mode Face à face), la case
  « Sorties garçon / fille » ajoute cet aller-retour latéral de 5 temps sur un cycle de 8,
  le suiveur étant décalé par le retard réglable.
- **Ginga** (filles) : hanche qui dessine un « 8 au sol » — correspond au suave.
  **Banga** (garçons) : mouvement de hanche droite→gauche accentué.
- **Corridinho/koreidinha** : succession de pas formant un cercle au sol (lié au semba).

### Semba
Plus rapide que la kizomba, **rebond marqué** (« allure sautillante ») et changements de
direction nets sur musique vive ([O'Dance Events](https://odanceevents.com/blog/kizomba-semba-urban-kiz)).
Tempo : « semba is bouncy and **mid-tempo** », kizomba « slow (around **60 to 80 BPM**) », kuduro
« fast (around **130 to 145 BPM**) » ([Angola Travel Guide](https://angolatravelguide.com/angola-music-dance/)).
Le pas de base y est cité **verbatim** (§ « Semba dance steps: the basics ») :
> « Semba's basic is a **quick-quick-slow triple step**, often described as **“1-2-3, pause”** with a
> small hip bounce on each beat. Step **in place** with a slight **side-to-side hip motion** on beats
> 1 and 2 ; Take a small forward or back step on beat 3 ; … **let the bounce come from the knees**. »

Déplacements en rond (koreidinha). Dans l'app : rebond vertical marqué ; la « réception sur
l'avant-pied » vient de la **spec biomécanique du handoff**, pas d'une source externe.

Depuis le 23 novembre 2026, le pas de base du danseur seul est celui que le propriétaire a élu (#162,
[élection](elections/ginga-huit.md)) : un rebond par temps (la hanche s'assoit à chaque arrivée du poids) et un double
rebond un temps sur deux, deux arrivées de suite sur chaque pied. Ce motif d'appuis est son choix ; les sources écrites
décrivent « un, deux, trois, pause », qui reste visible par `?semba=pause`.

### Kompa (Haïti)
Balancier latéral **sur place**, un transfert de poids par temps
([Haitian Music Zone](https://haitianmusiczone.com)), hip check / pause marquée sur le temps 4.
**À refaire** : voir l'encadré plus haut et [la recherche sur la danse kompa](recherche-danse/kompa.md) (#161).

Dans l'app, depuis le 23 novembre 2026 : le pas de base, danseur seul, est celui que le propriétaire a élu en neuf
tours de films (#161, [élection](elections/ginga-huit.md)) : la hanche s'assoit quand le poids arrive, les jambes
alternent, le buste suit le bassin et se penche. Ce choix est le sien, pas celui d'une source ; il s'écarte du manuel
cité par *Le Nouvelliste* sur l'ordre avant-arrière de la hanche (voir [la spec](spec-ginga-huit.md)).

Depuis le 24 novembre 2026 (#195, règle R40) : ce pas se danse sur **un temps par appui**, le poids change de pied à
chaque temps ; ce qui se danse « suave » prend deux temps par appui, le kompa n'en fait pas partie. Là encore la règle
est celle du propriétaire : la page pédagogique citée dans [`musique/kompa.md`](musique/kompa.md) décrit un pas puis
une touche sans poids, soit deux temps par appui, que le kompa garde en couple en attendant #187.

### Tarraxinha
**Sur place**, isolations pelviennes (contact bassin à bassin)
([Udansa](https://udansa.com)), haut du corps immobile.

### Suave (kizomba)
« 8 » au sol + **talon levé → fesses montent → on redescend et change de pied**
([cours-kizomba.com](https://cours-kizomba.com/blog/kizomba-pour-debutant-novice-le-guide-complet)) ;
base « 8 temps » ([Emove thérapie](https://emoveretherapie.com)). Transferts partiels, aucun
rise-and-fall.

### Zouk brésilien
**Basic sur place** slow-quick-quick, cambré, body waves, rouleaux de tête
([Get Bailar](https://getbailar.com), [DanceIn NJ](https://danceinnj.com)) ; zouk love : cambré
soutenu ([Inaya Zouk](https://inaya-zouk.com)).

### Appui & transmission (sur place, transfert de poids G/D, genoux/hanches)
C'est le cœur de la visualisation « Appuis & transmission » de l'app (pastilles de charge sous
les pieds, chaîne d'appui pied→cheville→genou→hanche, HUD genoux/bassin) :
- [Angola Travel Guide, § « Semba dance steps: the basics »](https://angolatravelguide.com/angola-music-dance/) :
  « step **in place** », « **side-to-side** hip motion on beats 1 and 2 », « let the bounce come
  from the **knees** ».
- [Wikipédia FR, Kizomba](https://fr.wikipedia.org/wiki/Kizomba) : « En kizomba/semba (passada),
  **le déplacement est du bas vers le haut** » (chaîne sol → genoux → hanches).
- [O'Dance Events, « Débuter la kizomba »](https://odanceevents.com/blog/debuter-la-kizomba) :
  « Tout part de la marche. Des pas **compacts, près du sol**, sans lever les pieds »,
  « **genoux souples** », « le leader déplace son **centre** juste avant de **poser le pied** ».
- Périmètre **samba** (fille du semba), à citer comme tel — [Viens-danser](https://www.viens-danser.fr/apprendre-samba/) :
  « les pieds initient le mouvement, ce sont les **genoux** qui transforment cette impulsion en
  l'énergie qui traverse tout le corps », « l'action **ball-flat des pieds** et la flexion-extension
  des genoux se transmettent naturellement aux **hanches** », « le poids circule d'un pied à l'autre » ;
  [Udansa, « Samba Bounce »](https://udansa.com/fr/guide-de-danse/apprendre-samba/samba-competition/apprendre-samba-bounce) :
  ressort « provenant des **genoux et des chevilles** », poids « contrôlé par la **plante des pieds** ».

## Ressources

- Z-Anatomy (template Blender, modèles dérivés de BodyParts3D, contient Z-Biomechanics.7z
  « human biomechanics as a rig ») : https://github.com/Z-Anatomy/Models-of-human-anatomy
- BodyParts3D (maillages OBJ) : https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Mouvements kizomba (2 temps/marqua, 3 temps, ida et volta, sortie garçon/fille 5 temps,
  ginga « 8 au sol », banga, corridinho) : https://fr.wikipedia.org/wiki/Kizomba
- Guide débutant kizomba (pas ≤ largeur du bassin, « touch » sans poids, suave talon levé,
  exercice de connexion ballon) : https://cours-kizomba.com/blog/kizomba-pour-debutant-novice-le-guide-complet
- Kizomba vs semba (semba plus rapide, rebond, changements de direction) :
  https://odanceevents.com/blog/kizomba-semba-urban-kiz et https://angolatravelguide.com/angola-music-dance/
- Semba : déplacements en rond (koreidinha), lignes de danse kizomba + 3 temps :
  https://soireedanse.com
- Kizomba débutant (pas compacts près du sol, genoux souples, centre déplacé avant de poser le
  pied) : https://odanceevents.com/blog/debuter-la-kizomba
- Appui/transmission sol → genoux → hanches (périmètre samba, fille du semba) :
  https://www.viens-danser.fr/apprendre-samba/ et
  https://udansa.com/fr/guide-de-danse/apprendre-samba/samba-competition/apprendre-samba-bounce
- Kompa : side-to-side sur place, un poids par temps : https://haitianmusiczone.com
- Tarraxinha : sur place, isolations pelviennes, contact des hanches : https://udansa.com
- Base « 8 temps » suave : https://emoveretherapie.com
- Zouk : basic sur place slow-quick-quick, cambré, waves : https://getbailar.com et
  https://danceinnj.com ; zouk love cambré soutenu : https://inaya-zouk.com
