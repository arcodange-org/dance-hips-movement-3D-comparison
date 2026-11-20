# Spec #62 — les temps de la musique sur les transferts d'appui

[Accueil](../README.md) · [Règles du propriétaire](regles-proprietaire.md) (R21) · [Son synthétisé](spec-son-synthese.md) · [Confrontation moteur / musique](musique/confrontation-moteur.md)

## Demande du propriétaire (20 novembre 2026)

« Il faut que le BPM de la musique mais surtout les beats correspondent aux transferts de poids des
danseurs (qui se « balancent » en 1 ou 2 temps). »

Convention du dépôt : **le poids arrive sur le temps** où le pied se pose
([confrontation](musique/confrontation-moteur.md)). La musique joue ses temps sur les temps entiers
de l'horloge (`src/music/scheduler.ts`).

## Constat (audit du 20 novembre)

| Mouvement | Arrivée du poids | Verdict |
|---|---|---|
| Sur place (kizomba, semba, zouk, tarraxinha, suave : appui `−S2`) | plein appui à x,5 | sur le « et » |
| Sur place kompa (`−tanh(2,2·S1)`) | deux transferts par temps | 4 × trop rapide (pas 1, touche 2, pas 3, touche 4) |
| Sorties garçon et fille | appui plein sur chaque temps entier | conforme |
| Quarts en paire | à la pose d'un pied : 1,41 et 2,91 (leader), 1,47 et 3,13 (suiveur) | 0,09 à 0,47 temps d'écart |
| Ida e volta en paire | 1,5 · 1,95 · 3,5 · 5,5 · 5,95 · 7,5 | 4 sur 6 sur le « et » |

## Ce qui change (ce lot)

- **Sur place** (solo, paire, déplacement latéral, temps3) : le mouvement tourne un demi-temps
  (`ON_BEAT_SHIFT` = 0,5) derrière l'horloge. Le plein appui du style tombe sur chaque
  temps, le transfert à mi-chemin entre deux temps. C'est un décalage dans le temps du même
  mouvement : les poses sont les mêmes, donc aucun croisement d'os nouveau. Les figures gardent
  leur propre calendrier d'appuis, et la sortie combinée historique (`sortie`) aussi (oracle).
- **Kompa** : un transfert tous les deux temps. Le poids arrive sur 1 et 3 et reste pendant la touche
  sans poids sur 2 et 4 ; il passe sur l'autre pied dans les 0,4 temps qui précèdent le pas
  (`kompaSupport`). Le hip check se fait sur la touche.
- **Kompa, sur place et avant-arrière seulement** (demande du propriétaire du 20 novembre : « on peut
  laisser le style konpa faire uniquement le sur place et le avant / arrière (pas de marka en konpa) ») :
  en kompa, l'app ne propose que « sur place » et l'ida e volta (`STYLE_MOVEMENTS`) ; les sorties
  (qui finissent par une marka), les quarts, le corridinho et la marka en 3 temps sont grisés, de même
  que le déplacement latéral (son balancement latéral est le style lui-même) ; un réglage enregistré
  retombe sur « sur place ». Les tests des figures ne parcourent plus le kompa
  là où il n'est pas proposé. Avec son nouveau rythme, il croisait les fémurs dans la sortie fille
  (14 poses sur 918).

## Reste à faire (même issue)

- **Ida e volta en paire** : poser le poids sur les temps veut dire raccourcir le vol des pas
  (1,2 temps aujourd'hui) et recalibrer le couple rapproché. Le ginga (#42), piloté par les
  transferts, suivra.
- **Quarts en paire** : aligner les poses de pieds (1,41, 2,91…) sur les temps, avec recalibrage de la
  chorégraphie des appuis.
- **Semba** (« 1-2-3, pause ») et **zouk** (lent-vite-vite) : rythmes propres, à traiter avec leurs
  styles.

## Tests

`scripts/test_temps_transferts.mjs` (dans `npm test`) :
- sur place, solo et paire : appui plein sur chaque temps, pieds alternés, transfert à mi-chemin, pour
  cinq styles ;
- kompa : pied gauche plein sur 1 et 2, droit sur 3 et 4, quatre transferts en 8 temps ;
- sorties garçon et fille : appui plein sur chaque temps.
