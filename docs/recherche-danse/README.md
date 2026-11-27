# Recherche sur la danse, style par style

[Accueil](../../README.md) · [Styles](../styles-de-danse.md) · [Ginga](../ginga-angolana.md) ·
[Musique](../musique/README.md) · [Biomécanique](../recherche-biomecanique/README.md) ·
[Règles du propriétaire](../regles-proprietaire.md)

Ce dossier rassemble ce que des sources extérieures disent du **pas** et du **mouvement du bassin** de chaque
style, quand le dépôt en savait trop peu. La musique a son dossier (`docs/musique/`), la biomécanique le sien.

| Style | Document | Pourquoi |
|---|---|---|
| Kompa | [kompa.md](kompa.md) | Le propriétaire : le kompa du modèle est faux, « c'est le 8 le plus prononcé » (#161). |

## Paroles du propriétaire (22 novembre 2026)

Dites après la troisième version de la vidéo éducative (#155), où chaque style danse son pas de base sur place.

Sur le kompa :

> Le konpa est complètement faux actuellement: c'est le 8 le plus prononcé justement. Complémente les
> connaissances sur ce style.

Sur le semba :

> En semba le 2e rebond est fait comme un chacha en refaisant rapidement un petit rond du "8" de ginga avant
> de reprendre le mouvement de "8" plus grand.

Sur le ginga du couple, au réglage par défaut (« marqué »), filmé en pied :

> Trop discret.

Lecture de l'auteur de ce document, pas ses mots : le « 8 » du semba n'est pas régulier. Un grand « 8 », puis
une petite boucle rapide, celle du second rebond, sur le rythme d'un cha-cha, puis le grand reprend.

Ces paroles s'ajoutent à celles du 21 novembre sur le ginga, qui « fait un 8 » par le relais des genoux
([spec #157](../spec-ginga-couple.md), chantier #159).

### Le même jour, après la quatrième version de la vidéo

Sur la posture :

> Le buste doit etre au dessus et legerement devant les genoux.

Sur ce qui compte le plus :

> Le plus important c'est de ne pas saccader / teleporter subitement et de ne pas avoir un effet relais
> soudain entre gauche et droite: c'est la transition (le transfert de poids) qui est la source du
> jinga/dehanché/ trajectoire des fessiers "en 8".

Sur le double rebond du semba :

> Le double rebond du semba c'est le doublement de transfert vers le meme coté en initiant un transfert vers
> le coté opposé et en re-transferant vers le coté initial a la place

Lecture de l'auteur de ce document, pas ses mots :

- Le « 8 » n'est pas un mouvement ajouté au bassin. C'est la trace que laisse un transfert de poids continu
  d'un pied à l'autre. Un mouvement se juge d'abord à sa continuité au moment du transfert, avant sa forme ou
  sa taille.
- Double rebond du semba : le poids arrive sur un côté, part vers l'autre, n'y va pas jusqu'au bout et
  revient sur le premier. Deux arrivées de suite du même côté. C'est le « petit rond rapide » de sa phrase
  du matin.
- La règle de posture se lit de profil. Mesurée sur le modèle, elle n'est tenue par aucun des six styles
  (tableau plus bas).

## Ce que le modèle fait aujourd'hui : le trajet du bassin, mesuré

Pas de base sur place, danseur seul, huit temps, amplitude 1. Position du bassin relevée image par image en
mode film (`film=1`, `window.__film.pelvis()`, [spec](../spec-video-pas-de-base.md)), le 21 novembre 2026.

| Style | De côté | D'avant en arrière | De haut en bas | Forme vue de dessus |
|---|---|---|---|---|
| Semba | 10,0 cm | 0 cm | 10,2 cm | une ligne droite |
| Kompa | 20,6 cm | 0 cm | 2,5 cm | une ligne droite |
| Kizomba | 14,0 cm | 0 cm | 2,8 cm | une ligne droite |
| Tarraxinha | 6,0 cm | 2,4 cm | 1,3 cm | une petite ellipse |
| Suave | 6,0 cm | 4,4 cm | 1,7 cm | un « 8 » |
| Zouk brésilien | 10,0 cm | 0 cm | 8,1 cm | une ligne droite |

Seul le suave trace un « 8 ». Le kompa, que le propriétaire décrit comme le « 8 » le plus prononcé, est le
style dont le bassin va le plus loin en ligne droite : c'est l'écart le plus grand entre le modèle et sa
parole. Le semba ne trace pas de « 8 » non plus, ni grand ni petit.

Refaire ces mouvements est le chantier du « 8 » (#159) ; ce dossier lui sert d'entrée.

## Ce que le modèle fait aujourd'hui : le buste et les genoux, de profil

Règle du propriétaire : « Le buste doit etre au dessus et legerement devant les genoux. »

Pas de base sur place, danseur seul, huit temps, amplitude 1, modèle complet (GLB, `applyPose`), le
22 novembre 2026. Distances d'avant en arrière ; un nombre négatif veut dire « derrière ». Le buste est le
centre de la cage thoracique, les genoux et les chevilles sont la moyenne des deux côtés.

| Style | Buste par rapport aux genoux | Buste par rapport au bassin | Genoux par rapport aux chevilles |
|---|---|---|---|
| Kizomba | −13,9 cm (de −15,8 à −12,0) | 0 cm | +13,8 cm |
| Semba | −15,7 cm (de −20,8 à −10,4) | 0 cm | +15,1 cm |
| Kompa | −19,7 cm (de −19,8 à −18,2) | 0 cm | +19,6 cm |
| Tarraxinha | −15,3 cm (de −16,8 à −12,4) | 0 cm | +15,2 cm |
| Suave | −14,5 cm (de −18,8 à −10,2) | 0 cm | +14,1 cm |
| Zouk brésilien | −13,9 cm (de −18,5 à −5,0) | 0 cm | +13,8 cm |

Dans les six styles, le buste est à l'aplomb du bassin et des chevilles, et les genoux partent seuls vers
l'avant : le buste se retrouve 14 à 20 cm **derrière** les genoux, là où la règle le veut au-dessus et
légèrement devant. Le kompa est le plus loin de la règle.
