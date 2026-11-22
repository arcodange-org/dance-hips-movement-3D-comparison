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
