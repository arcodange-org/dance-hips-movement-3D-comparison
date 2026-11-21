# Jeux de rythme et de danse : fenêtres de temps, latence, retours

[Hub de la recherche](README.md) · [Guidage et commande](guidage-et-commande.md) · [Mode guidage](mode-guidage.md) · [Son synthétisé](../spec-son-synthese.md)

Ce que les jeux de rythme et de danse enseignent pour juger une action « sur le temps » dans un
navigateur, et pour donner un retour qui apprend sans décourager. Recherche du 20 novembre 2026.

Légende : **lu** = page ouverte et lue ; **recherche** = vu seulement dans un résultat de recherche ;
**communauté** = source de joueurs, sans base officielle.

> [!IMPORTANT]
> **En bref.** (1) **Mesurer la latence**, ne jamais s'y fier : audio, image et saisie ont chacune la
> leur, et chacune peut dépasser une fenêtre de ±100 ms. (2) Dans les danses lentes, les fenêtres se
> comptent **en fraction de temps**. (3) Comme *Hi-Fi Rush*, **l'action tombe toujours sur le
> temps** ; seule la pression est notée. (4) Indulgent pour passer, exigeant pour briller. (5)
> Enseigner comme un professeur de danse (*Dance Central*).

## Fenêtres de jugement

| Jeu | Fenêtres | Source |
| --- | --- | --- |
| *Dance Dance Revolution* | Marvelous ≈ 1 image (16,7 ms), Perfect ≈ 2 images ; valeurs officielles introuvables | communauté |
| *Rock Band* (Harmonix) | Fenêtre de ±100 ms autour de la barre | lu |
| *osu!* | Une difficulté OD règle tout : 80 − 6·OD, 140 − 8·OD, 200 − 10·OD ms ; OD 5 → ±50 / ±100 / ±150 ms | lu |
| *Crypt of the NecroDancer* | Premier prototype : 20 % d'un temps (±100 ms à 120 bpm) ; élargi jusqu'à **100 %** d'un temps, ce qui plaisait le plus | lu |
| *Hi-Fi Rush* | Aucune valeur publiée ; une pression hors temps n'est pas refusée, l'animation est accélérée pour tomber sur un temps | lu (compte rendu CEDEC, résumé GDC) |

**Pour le comparateur.** Le tempo par défaut va de 72 à 120 bpm selon le style (`src/music/patterns.ts`) :
un temps dure 500 à 830 ms. À 90 bpm (kizomba), ±50 / ±100 / ±150 ms ne font que 7 à 22 % d'un
temps. Des fenêtres en fraction de temps (avec un plafond en ms) suivent mieux les danses lentes.

Sources :
- J. Fleming, *Rock Band 10th Anniversary Blogs*, Harmonix, 2017 —
  https://www.harmonixmusic.com/blog/rock-band-10th-anniversary-blogs-james-fleming (lu).
- osu! wiki, *Overall difficulty* — https://osu.ppy.sh/wiki/en/Beatmap/Overall_difficulty (lu).
- R. Clark, *Game Design Deep Dive: Finding the beat in Crypt of the NecroDancer*, Game Developer,
  2014 — https://www.gamedeveloper.com/audio/game-design-deep-dive-finding-the-beat-in-i-crypt-of-the-necrodancer-i- (lu).
- RemyWiki, *DDR Glossary* — https://remywiki.com/DDR_Glossary (recherche, communauté).

## Le monde calé sur le tempo : *Hi-Fi Rush*

Animations, décors et interface suivent le tempo du morceau. Une pression sur le temps joue
l'animation prévue ; une pression décalée **n'est pas refusée** : le jeu ajuste l'animation pour que
le coup tombe sur un temps. Les coups portent un ou deux temps après la pression, et chaque impact
annonce l'entrée suivante : un mauvais placement ne casse jamais l'enchaînement.

**Pour le comparateur : le meilleur modèle.** La pression du joueur est une **intention** ; le
transfert d'appui du suiveur est **toujours rendu sur le temps** ; le jugement ne note que la
pression. La danse reste musicale quand le joueur est en retard, ce qui compte puisque l'animation
est une fonction de l'horloge des temps. Le guidage en couple se fait aussi **avant** le pas : on
appuie, la figure s'exécute au temps suivant.

Sources : J. Johanas, *Developing Hi-Fi RUSH Backwards…*, GDC 2024 —
https://gdcvault.com/play/1034256/Developing-Hi-Fi-RUSH-Backwards (lu, résumé) ; T. Kasai, compte rendu
CEDEC 2023, GameBusiness.jp — https://www.gamebusiness.jp/article/2023/08/30/22144.html (lu).

## Latence dans un navigateur

- **Deux horloges** (Chris Wilson) : `AudioContext.currentTime` est précise ; `setTimeout` et
  `Date.now()` dérivent de dizaines de ms. Le son synthétisé du comparateur suit déjà ce schéma
  (planification 120 ms à l'avance, [spec du son](../spec-son-synthese.md)).
- **`getOutputTimestamp()`** donne une paire (temps audio, `performance.now()`) : on convertit
  l'horodatage d'une touche en temps audio.
- **`event.timeStamp`** est arrondi (0,1 ms dans Chrome, 1 ms dans Safari et Firefox, 16,7 ms avec
  la protection anti-empreinte de Firefox) : suffisant pour des fenêtres de 50 ms et plus.
- **Manette** : l'API Gamepad se lit à chaque image, sans événement ; jusqu'à une image de retard
  (environ 16 ms à 60 Hz).
- **Latence mesurée** (J. Kaufman, 2021, boucle micro) : environ 67 ms dans Chrome et 55 ms dans
  Firefox par défaut. Les valeurs que donne le navigateur la sous-estiment ; le Bluetooth est bien pire.
- **Calibration** (devlog de *Rhythm Quest*) : un test de frappe mélange toujours la latence de
  saisie avec celle du son ou de l'image. *Rhythm Doctor* aligne d'abord son et image à l'œil, puis
  fait un test de frappe. *Rock Band 4* calibre le son et l'image séparément.
- Les humains frappent en général **un peu avant** le temps, de quelques dizaines de ms (Repp,
  recherche) : centrer « parfait » un peu en avance, ou laisser la calibration absorber ce biais.

Sources : C. Wilson, *Scheduling web audio with precision* — https://web.dev/articles/audio-scheduling
(lu) ; MDN, *AudioContext.outputLatency* —
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency (lu) ; MDN,
*AudioContext.getOutputTimestamp()* —
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp (lu) ; MDN,
*Event.timeStamp* — https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp (lu) ; MDN,
*Gamepad.timestamp* — https://developer.mozilla.org/en-US/docs/Web/API/Gamepad/timestamp (lu) ;
J. Kaufman, *Browser audio latency*, 2021 — https://jefftkaufman.substack.com/p/browser-audio-latency
(lu) ; *Rhythm Quest* devlog 10, 2021 — https://rhythmquestgame.com/devlog/10.html (lu) ;
A. Thresher, *Rock Band 4: Calibration How To*, Harmonix, 2015 —
https://www.harmonixmusic.com/blog/how-to-calibrate (lu) ; B. Repp, Y.-H. Su, 2013 —
https://link.springer.com/article/10.3758/s13423-012-0371-2 (recherche).

## Retours : indulgence et exigence

- ***Thumper*** : un bonus de « virage parfait » récompense la précision par-dessus une base
  indulgente (lu).
- ***Beat Saber*** : jusqu'à 115 points par cube, selon l'amplitude du geste avant et après et le
  centrage de la coupe ; un raté **divise par deux** le multiplicateur au lieu de le remettre à zéro (lu).
- ***Sayonara Wild Hearts*** : la musique ne s'arrête jamais ; après plusieurs échecs, le jeu propose
  de passer la section (lu).
- ***Rhythm Heaven*** : on juge à l'oreille ; un son confirme le bon placement (recherche).

**Pour le comparateur.** Noter **comment**, pas seulement **quand** : la préparation (guider assez tôt),
l'engagement (tenir le cadre pendant le transfert) et le placement. Un raté ne fige jamais le couple :
la suiveuse garde ou reprend le pas de base, la musique continue. Un petit son de pas à l'arrivée du
poids confirme le temps sans encombrer la vue 3D.

Sources : A. Wawro, *How Thumper got its turns on track*, Game Developer, 2016 —
https://www.gamedeveloper.com/design/how-i-thumper-i-got-its-turns-on-track (lu) ; BSMG wiki,
*Ranking & Scoring Guide* — https://bsmg.wiki/ranking-guide.html (lu) ; Wikipédia, *Sayonara Wild
Hearts* — https://en.wikipedia.org/wiki/Sayonara_Wild_Hearts (lu).

## Jeux de danse

- ***Just Dance*** (Ubisoft) : on note chaque **mouvement entier** (X, OK, Good, Super, Perfect), avec
  des « Gold Moves » signalés à l'avance et une série « On Fire ». En duo, chaque joueur a sa partie,
  mais rien ne modélise un guidage de l'un vers l'autre (recherche).
- ***Dance Central*** (Harmonix, Kinect) : membres fautifs entourés de rouge ; le mode **Break It
  Down** est calqué sur un cours : récapitulatifs, ralentis, consignes d'un mot (« Cross ! Back ! »),
  boucle sur un mouvement, aide proposée après trois ou quatre échecs de suite (lu).
- **Danse de couple** : aucun jeu trouvé ne **note le guidage lui-même** (le moment du signal par
  rapport au pas du suiveur). Des applications de réalité virtuelle (*Dance Guru*, *Trip the Light*)
  enseignent les rôles leader et suiveur séparément ; elles signalent qu'on ne sent pas la connexion
  sans toucher (recherche). Le mode guidage semble **nouveau** : une ouverture, et un risque, faute de
  modèle à copier.

**Pour le comparateur.** Un mode **répétition** : tempo à 60–80 %, boucle d'une figure, consignes d'un
mot (« Gauche ! », « Transfert ! »), pied qui doit recevoir le poids mis en évidence, aide après trois
ratés. Un moment « or » par phrase (le poids qui arrive au temps 1).

Sources : M. Flury et al., *Postmortem: Harmonix's Dance Central*, Game Developer Magazine, 2011 —
https://www.gamedeveloper.com/production/postmortem-harmonix-s-dance-central-2010- (lu) ; Harmonix,
*Dance Central 2 Design Blog: Break It Down*, 2011 —
https://www.harmonixmusic.com/blog/dance-central-2-design-blog-break-it-down (lu) ; Ubisoft, *New era,
new scoring*, 2023 —
https://ubisoft.com/en-ca/game/just-dance/2025/news-updates/6JSYL277Jds6As65yqtAvr/new-era-new-scoring
(recherche) ; NPR, 11 juillet 2026, applications de danse en réalité virtuelle —
https://www.npr.org/2026/07/11/nx-s1-5882228/dance-virtual-reality-vr-app-augmented-world-expo-weddings (recherche).

## Proposition : fenêtres et calibration

À valider par le propriétaire ; `b` = durée d'un temps.

| Note | Fenêtre | À 90 bpm |
| --- | --- | --- |
| Parfait | ±min(50 ms ; 0,08 b) | ±50 ms |
| Bien | ±min(100 ms ; 0,15 b) | ±100 ms |
| Juste | ±min(160 ms ; 0,25 b) | ±160 ms |
| Raté | au-delà, ou aucune pression avant la fin du temps | — |

- Un curseur « exigence » met toutes les fenêtres à l'échelle (0,6 × à 1,5 ×), comme l'OD d'*osu!* ;
  le mode répétition élargit jusqu'à ±0,5 temps, comme *NecroDancer*.
- **Guidage anticipé** : une intention donnée dans le demi-temps **avant** le temps visé est valide ;
  le transfert du suiveur tombe toujours sur le temps.
- **Calibration** une fois par appareil, avec un bouton pour la refaire : (1) 8 à 12 frappes sur un
  clic au tempo du style, médiane de l'écart = décalage de saisie ; (2) un éclair dans la scène (ou la
  pose du pied du suiveur) aligné sur le clic avec un curseur par pas de 5 ms = décalage d'image ;
  (3) correction lente en cours de jeu (moyenne glissante des écarts, plafonnée à ±60 ms), comme
  *NecroDancer* ; (4) avertir si la sortie audio semble Bluetooth.
- Son coupé, l'horloge des temps reste maîtresse ; seul le décalage de saisie s'applique
  (comportement actuel du transport inchangé).
