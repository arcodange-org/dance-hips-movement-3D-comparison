# Spec — le pas de base « 1 2 » de la kizomba et du semba (#196)

Issue : #196. Règle du propriétaire : R42 ([`regles-proprietaire.md`](regles-proprietaire.md)), 24 novembre 2026.
Suite de l'élection des pas de base ([`spec-ginga-huit.md`](spec-ginga-huit.md), #161, #162).

## La règle

Le pas de base de la kizomba et du semba est le « 1 2 ». C'est une figure nouvelle dans le modèle.

| Temps | Pieds | Poids | Bassin |
|---|---|---|---|
| **1** | La jambe libre s'écarte de l'autre, de presque une largeur de hanches : le danseur change de ligne | Il passe sur la jambe qui vient de s'écarter | Le transfert se fait en ginga : la hanche s'assoit quand le poids arrive |
| **2** | L'autre jambe rejoint la première et marque (marca), sans prendre le poids | Il reste sur la première jambe | Le « 8 » ne s'interrompt pas : le bassin refait un petit rond, l'effet « cha-cha » du semba, d'où le double rebond |
| **3** | La jambe qui vient de marquer, restée libre, s'écarte de l'autre côté | Il passe sur elle | Comme au temps 1, en miroir |
| **4** | L'autre jambe la rejoint et marque | Il reste | Comme au temps 2, en miroir |

Sur quatre temps le danseur part d'un côté et revient à sa place.

## Ce que le modèle a déjà

- Le pas élu du semba (`parCote`, #162) a exactement ces appuis : deux arrivées de suite sur chaque pied, la
  seconde faite d'un petit rond rapide du bassin (`smallRound`), sans à-coup. Il se danse pieds plantés.
- La kizomba sur place change de pied à chaque temps, pieds plantés, bassin en va-et-vient (14 cm, aucune surface
  entourée vue de dessus). Ses textes parlent déjà de « 2 temps » et de marca, que les pieds ne font pas.
- Aucune figure n'écarte un pied puis ramène l'autre en marca.

Le « 1 2 » est donc : **la hanche du pas élu du semba, avec des pieds qui se déplacent**.

## Le modèle

### Les temps

Le « 1 » est le premier temps de la mesure : le temps 0 de l'horloge (le compte « 1 » de la page, la première
grosse caisse de la musique synthétisée). Le poids arrive :

| Compte | Temps de l'horloge | Arrivée |
|---|---|---|
| 1 | 0 | pied gauche, qui s'est écarté |
| 2 | 1 | pied gauche encore (double rebond) ; le pied droit marque |
| 3 | 2 | pied droit, qui s'est écarté |
| 4 | 3 | pied droit encore (double rebond) ; le pied gauche marque |

### Les pieds

Deux places pour les deux pieds : la place de droite (les pieds au repos, sous les hanches) et la place de gauche (la
même, décalée de l'écart `E` vers la gauche du danseur).

| Pied | De … à … (temps de l'horloge) | Ce qu'il fait |
|---|---|---|
| Gauche | 3,05 → 3,5 | quitte sa marca et s'écarte de `E` ; posé à plat avant que le poids n'arrive |
| Gauche | 3,5 → 6,1 | à plat, porte le poids des comptes 1 et 2, le rend pendant le temps suivant |
| Gauche | 5,6 → 6,1 | son talon se lève : le pied roule sur sa plante, là où il est, pendant que le poids le quitte |
| Gauche | 6,1 → 6,8 | rejoint le pied droit (retour de `E`), près du sol, sur la plante |
| Gauche | 6,8 → 7,05 | marque : posé sur la plante, talon levé de 5 cm, sans poids, sur le compte 4 |
| Droit | les mêmes, deux temps plus tôt | |

Le pied qui s'écarte se pose avant le milieu du transfert : pendant la seconde moitié du temps, les deux pieds
sont au sol et le poids passe de l'un à l'autre.

### Le corps

- Le bassin est porté d'une place à l'autre pendant le temps du transfert, d'un mouvement sans à-coup (une
  demi-onde par temps) ; il est à mi-chemin, entre les deux pieds, au milieu du temps.
- Par-dessus, la hanche du pas élu : elle s'assoit à chaque arrivée du poids, le bassin pivote, le buste suit et
  se penche ; au temps de la marca, le bassin fait son petit rond et revient s'asseoir sur le même pied.
- Le poids (jauges de la page) : entier sur le pied à chaque temps. Il passe d'un pied à l'autre pendant la seconde
  moitié du temps du transfert, les deux pieds au sol ; pendant le temps de la marca il reste entier sur le pied
  d'appui (le pied qui marque ne porte rien).
- La hauteur du bassin est celle que donne la hanche du pas élu, comme si les pieds étaient sous les hanches : ses
  assises et son rebond, rien de plus. Une jambe dont le pied est loin (laissée en arrière, ou tendue vers le côté)
  ne fait que la borner par ce qu'elle peut atteindre tendue, depuis sa plante quand le talon est levé. Sans cela
  le bassin plongeait de 6,6 cm à chaque arrivée, tiré par la jambe restée en arrière.

### Dans le code (prototype)

- `src/umDois.ts` (pur) : les places, le calendrier des pieds (`umDoisFoot`, `UM_DOIS_TIMES`), le port du corps
  (`umDoisCarry`).
- `src/styles.ts` : la hanche du pas élu du semba devient une fonction partagée (`applySit`) ; la kizomba la reçoit
  pour cette figure. Candidats : `UM_DOIS` (`large`, `court`, `doux`), `setUmDoisProto`, `umDoisOf`.
- `src/pose.ts` : la figure remplace le pas de base quand elle est demandée, danseur seul, pieds plantés
  (`umDoisFeet`, hauteur du bassin).
- `scripts/test_um_dois.mjs` (dans `npm test`), `scripts/tracer_hanches.mjs <candidat> seul unDeux <style>`.
- Tant que le propriétaire n'a pas vu les films, la figure ne s'affiche que par l'adresse :
  `?style=kizomba&unDeux=<candidat>` et `?style=semba&unDeux=<candidat>`. Sans ce paramètre rien ne change.

## Ce qui reste à trancher sur film

Films, mesures et propositions : [`docs/elections/pas-de-base-1-2/`](elections/pas-de-base-1-2/README.md).
Chaque question est montrée par des films côte à côte, une scène par question.

1. **L'écart.** « Presque une largeur de hanches » (34 cm sur le modèle) : le pied se déplace-t-il d'autant
   (candidat `large`, 28 cm), ou s'écarte-t-il jusqu'à ce que les deux pieds soient à une largeur de hanches l'un de
   l'autre (candidat `court`, 16 cm de déplacement) ?
2. **La kizomba.** La hanche du semba élu, au tempo de la kizomba, ou une hanche plus douce (moins de rebond) ?
3. **La page.** Ce pas devient-il celui que la page montre pour la kizomba et le semba, danseur seul, l'ancien
   « sur place » restant accessible ?

## À vérifier (tests)

- Appuis : poids entier sur le pied gauche aux comptes 1 et 2, sur le droit aux comptes 3 et 4 ; quatre transferts
  en huit temps (R21, R39).
- Marca : le pied qui marque ne porte pas le poids (un quart au plus), il est posé sur la plante.
- Écart : déplacement mesuré du pied, 34 cm au plus (R8) ; retour à la place de départ tous les quatre temps.
- Pieds : semelles au sol, jamais dessous ; un pied ne se déplace que lorsqu'il ne porte pas ; les deux pieds ne se
  touchent pas.
- Continuité (R34) : accélération du bassin, passage d'un côté à l'autre, aucun arrêt ; hauteur du bassin (R3).
- Posture (R33) : le buste au-dessus des genoux.
- Sans le paramètre d'adresse, poses identiques à celles de `main`.

## Hors périmètre

- Le couple : figure du mode jeu, suiveuse en miroir (#187).
- L'entrée de la figure dans la page et le partage d'adresse : après le vote.
- Le kompa (#195) et les autres styles.
