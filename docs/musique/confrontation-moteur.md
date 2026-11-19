# Confrontation du moteur avec la recherche musicale

Fil d'Ariane : [docs](../) › [musique](README.md) › **confrontation moteur**

Comparaison, style par style, des tempos et des phases de `src/styles.ts` (état de `main` au
2026-11-19) avec la recherche de ce dossier. Aucun code n'a été modifié ; les formules proposées
sont des pistes à valider.

## Rappels sur le moteur

- `b` est le temps musical en temps (beats). `S1(b) = sin(2πb)` (période 1 temps),
  `S2(b) = sin(πb)` (2 temps), `S4(b) = sin(πb/2)` (4 temps) — `src/anatomy.ts`.
- `support(b)` : charge du pied droit dans [−1, 1] (+1 = plein appui droit).
- Tempo **global** : curseur 24–140 bpm, **32 bpm par défaut** (`App.tsx`, `Controls.tsx`), un
  seul tempo pour les deux personnages en comparaison.
- `cycleBeats` : les styles ont des périodes qui divisent 4 temps (`src/clock.ts`).
- `advanceClock` intègre le delta de chaque image, borné à 0,1 s.

Convention adoptée pour juger les phases : **le poids arrive sur le temps** où le pied se pose
(O'Dance Events : le centre se déplace juste avant de poser le pied ; Haitian Music Zone : pas sur
1 et 3 avec transfert complet ; Bath Zouk : pas sur 1, 3, 4).

## Tableau de synthèse

| Style | Tempo moteur | Tempo recherche (défaut proposé) | Phase moteur | Phase recherche | Verdict |
|---|---|---|---|---|---|
| Kizomba | ≈ 90 (bullet et doc) | 80–100 (90) | `−S2` : un transfert par temps, plein appui à `b = 0,5` | pas sur le temps ; si marqua sans poids, un transfert tous les 2 temps | tempo **cohérent** ; phase **à revoir** |
| Semba | ≈ 130 | 100–125, jusqu'à 150 selon une source (120) | `−S2` régulier ; rebond `|S1|` deux fois par temps | « 1-2-3, pause », un rebond par temps | tempo **cohérent** ; phase et rebond **à revoir** |
| Kompa | 110–130 (doc) | 110–130 (120) | `−tanh(2,2·S1)` : deux transferts par temps | pas 1, touche 2, pas 3, touche 4 : un transfert tous les 2 temps | tempo **cohérent** ; phase **à revoir** (×4) |
| Tarraxinha | « lent » | 60–80 ou 80–100 (75) | cercle du bassin en 2 temps | non documenté | **à valider** |
| Suave | ≈ 60 (doc) | aucune source propre (72) | latéral 2 temps, vague 4 temps | « 2 temps par cycle » (spec) | **cohérent** avec la spec ; tempo à valider |
| Zouk brésilien | ≈ 110 (doc) | 60–90, 80–100 selon une source faible (80) | `−S2` régulier | lent-vite-vite : pas sur 1, 3, 4 ; cycle 8 temps | tempo **à revoir** ; phase **à revoir** |

## Détail par style

### Kizomba — [kizomba.md](kizomba.md)

- Tempo : la bullet du semba compare « ≈130 bpm vs ≈90 » ; les sources donnent 80–100,
  centrées sur 85–95. **Cohérent.**
- Phase : `support = −S2(b)` vaut −1 à `b = 0,5` et +1 à `b = 1,5` ; il passe par 0 sur les temps
  entiers. Le plein appui tombe donc **entre** les temps. Le genou d'appui (`pos(s)`) et la
  translation `root.x` ont la même phase.
- Rythme des transferts : la bullet dit « marqua (pieds joints) à chaque temps ». Si la marqua
  est sans poids (cours-kizomba.com), le poids reste deux temps du même côté et le cycle
  gauche-droite dure 4 temps. Si l'on modélise une marche (un pas par temps), la période de
  2 temps convient.
- Piste : décaler d'un demi-temps (`support = −cos(πb)`, ±1 sur les temps entiers) ; ou, pour le
  « 2 temps » avec marqua, une forme de période 4 avec plateaux, par exemple
  `support = −tanh(4·cos(πb/2 − π/4))` (gauche sur les temps 1–2, droite sur 3–4, transfert
  centré un demi-temps avant le pas, à `b = 1,5` et `3,5`).

### Semba — [semba.md](semba.md)

- Tempo : 130 est dans la plage des sources (100–125 pour BeatKey, 90–150 pour Kizomba Seattle).
  **Cohérent**, à condition de compter à la noire.
- Rebond : `root.y = 0,055·|S1(b)| − 0,055` a une période d'un **demi-temps** (bas à `b = 0 ;
  0,5`). À 130 bpm : 4,3 rebonds par seconde. Angola Travel Guide décrit un rebond **par temps**,
  venant des genoux. Piste : `root.y = −0,055·(1 + cos 2πb)/2`, bas sur chaque temps.
- Pas : « 1-2-3, pause » (trois transferts puis une tenue) n'est pas représenté ; `−S2` fait un
  transfert régulier. Le motif complet (A-B-A-pause, B-A-B-pause) dure **8 temps**, au-delà de la
  limite actuelle de 4 temps de `cycleBeats` pour les styles.
- Pieds : `extraL/extraR` (bascule du pied) suivent `pos(±S1)`, une fois par pied et par temps,
  alors que les pas changent de pied à chaque temps. Incohérence interne mineure.

### Kompa — [kompa.md](kompa.md)

- Tempo : 110–130 dans le dépôt comme chez Haitian Music Zone. **Cohérent.**
- Phase : `support = −tanh(2,2·S1(b))` a une période d'**un temps** : plein appui gauche vers
  `b = 0,25`, droit vers `b = 0,75`. Haitian Music Zone décrit pas (1), touche sans poids (2),
  pas (3), touche (4) : un transfert tous les deux temps. À tempo égal, le moteur va **quatre
  fois trop vite** ; à 120 bpm, quatre transferts par seconde au lieu d'un.
- La doc du dépôt (« un transfert de poids par temps ») cite Haitian Music Zone ; la page
  pédagogique de ce site ne le confirme pas (elle ne décrit pas non plus de pause sur le
  temps 4).
- Le hip check `if (b % 4 >= 3)` ajoute `0,008·S1(b)` sans suspendre le balancier : la « pause »
  du temps 4 n'existe pas dans le mouvement.
- Hanches : la source les accentue sur 2 et 4 (temps de touche) ; le moteur n'a pas d'accent lié
  aux temps.
- Piste : période de 4 temps avec plateaux (même forme que la kizomba avec marqua), accent de
  bassin sur `b = 1` et `b = 3`.

### Tarraxinha — [tarraxinha.md](tarraxinha.md)

- Tempo : « lent » dans la doc ; sources : 60–80 (BeatKey) ou 80–100 (Kizomba Seattle).
- Phase : cercle ou « 8 » du bassin en 2 temps, `support = −0,5·S2(b)`. À 75 bpm, un cercle
  dure 1,6 s. Aucune source ne fixe la durée d'un cercle par rapport aux temps. **À valider.**
- Si la musique est jouée en demi-tempo (claquement sur le temps 3 seulement, proposition), un
  cercle de 4 temps serait plus lisible.

### Suave — [suave.md](suave.md)

- Le suave n'est pas un genre musical ; la valeur de 60 bpm de la spec n'a pas de source
  externe. Proposition de défaut : 72 bpm.
- Phase : latéral `S2`, avant-arrière `S4`, vague du tronc sur 4 temps, `support = −0,2·S2` :
  **cohérent** avec « 2 temps par cycle ».
- Talons (`extraL/extraR`) en `S1` : un soulèvement par pied et par temps, plus rapide que les
  transferts. À vérifier contre « talon levé → fesses montent → on redescend et change de pied ».

### Zouk brésilien — [zouk-bresilien.md](zouk-bresilien.md)

- Tempo : la doc dit ≈ 110 bpm ; Bath Zouk donne 60–90, BeatKey 80–100. 110 correspond plutôt à
  un zouk antillais ralenti. **À revoir** (proposition : 80).
- Phase : `−S2` fait un transfert régulier par temps. Le basic lent-vite-vite pose le pied sur 1
  (tenu 2 temps), 3 et 4, puis 5, 7, 8 de l'autre côté : cycle de **8 temps**. Le niveau (`S4`)
  et le cambré ne posent pas de problème.
- Piste : table d'images clés (pas aux temps 0, 2, 3, 4, 6, 7) interpolée en `smoothstep`, plutôt
  qu'une sinusoïde.

## Points transversaux

1. **Tempo par style.** À l'activation du son, régler le tempo sur la valeur par défaut du style
   (kizomba 90, semba 120, kompa 120, tarraxinha 75, suave 72, zouk brésilien 80). La plage du
   curseur (24–140) couvre tout, sauf le haut du zouk antillais (145).
2. **Comparaison.** Une seule horloge : avec la musique du style A, le style B danse au tempo de
   A. Il n'existe pas de rapport simple entre la plupart des tempos (90 contre 120, par exemple).
3. **Mode Observation (32 bpm).** Une musique synthétisée à 32 bpm n'a plus de caractère. Options :
   couper le son, ou jouer la musique à son tempo et réserver le ralenti à l'image sans son.
4. **Phase.** Fixer une convention unique : `support = ±1` sur le temps où le pied porte le poids.
   Aujourd'hui, kizomba, semba et zouk ont le plein appui sur les demi-temps.
5. **Cycles de 8 temps.** Semba (1-2-3-pause des deux côtés) et zouk brésilien (lent-vite-vite des
   deux côtés) demandent 8 temps ; `cycleBeats` limite les styles à 4.
6. **Horloge audio maîtresse.** Calculer `b` depuis `AudioContext.currentTime`, planifier les
   notes 100 ms à l'avance. Avec l'horloge actuelle (delta borné à 0,1 s), une image lente
   ralentit l'animation mais pas le son, et l'écart s'accumule.

## À faire valider par le propriétaire

1. Les tempos par défaut proposés, surtout zouk brésilien (80 au lieu de 110) et suave (72 au
   lieu de 60).
2. Kizomba : la marqua porte-t-elle le poids (période 2 temps) ou non (période 4 temps) ?
3. Kompa : pas-touche sur 4 temps (Haitian Music Zone), un transfert par temps (doc actuelle) ou
   « pas, rassembler, pas, pause » (spec du handoff) ?
4. Semba : compter à la noire à environ 120, avec un rebond par temps et le « 1-2-3, pause » ?
5. Tarraxinha : un cercle de bassin en 2 temps ou en 4 temps ?
6. Le choix de la musique en comparaison, et le comportement du son en mode Observation.
7. Les grilles de [README.md](README.md) et des pages de style sont des simplifications : une
   écoute de validation est nécessaire, idéalement avec la méthode de Fanfant (2007) pour le
   zouk et le kompa, et avec un musicien angolais pour le semba (Amadeu Amorim lui-même note
   qu'il n'existe pas de manière unique de le jouer).

## Références

Les références sont détaillées dans chaque page de style. Sources des pas citées ici :
Haitian Music Zone (2025), Bath Zouk (non daté), Angola Travel Guide (2026), et
[`docs/styles-de-danse.md`](../styles-de-danse.md) pour cours-kizomba.com et O'Dance Events.
