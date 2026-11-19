# Sortie garçon — séquence validée

[Accueil](../README.md) · [Tâches](TASKS.md) · [Issue #21](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/21) · [Éditeur envisagé](spec-editeur-figures.md)

## Périmètre et validation

Séquence validée par Gabriel le 18 novembre 2026 après recherche FR/PT/EN. La comparaison
« ni en face ni en quinconce » porte sur les pieds du leader **par rapport à ceux de sa
partenaire**. Les axes des deux pieds du leader restent parallèles ; son droit est plus avancé.
Cette livraison change uniquement `movement=sortieG` en paire. La sortie fille, le combiné et
l'ancienne option interne `sortie` gardent leurs trajectoires et périodes historiques.

| Action | Leader | Partenaire | Appui final leader / partenaire |
| --- | --- | --- | --- |
| Départ | G disponible | D disponible | D / G |
| 1 | G surtout en avant, un peu à gauche : l'intention vers l'avant fait reculer la partenaire | D recule | G / D |
| 2 | D avance autour du genou D de la partenaire ; milieu des cuisses D au contact | G recule (moins) | D / G |
| 3 | G croise devant D pour rentrer sur la ligne | D recule | G / D |
| 4 | D retrouve sa position neutre relative au G | G s'ajuste en face | D / G |
| 5 | Marka G en position neutre, sans transfert | Marka D, sans transfert | D / G |

Variante : action 4, D se pose davantage à droite et le couple se translate vers la droite
du leader / gauche de la partenaire ; le marka retrouve le placement neutre relatif à ce D.
La rentrée conserve l'avancée du couple, pas les coordonnées initiales dans la salle.

## Modèle et lecture

- Plan déterministe à cinq actions, calculé séparément pour chacun. Repère GLB : gauche
  locale = +x, avant = +z ; le groupe partenaire est tourné de π. Un changement de repère
  ne change pas le nom anatomique d'un pied.
- Les positions initiales proviennent des chevilles du GLB. Déport extérieur d'environ une
  largeur de bassin, enjambées et arc de contournement calibrés sur cette anatomie. Les
  dimensions sont des paramètres d'illustration, sans prétention de mesure universelle.
- Interpolation continue des pieds avec phase de vol, pose, puis transfert ; le pied porteur
  conserve sa cible. Le marka pose le pied mais ne lui donne aucun appui.
- Bassin placé par la progression de l'appui, IK avec longueurs constantes, sol contrôlé sur
  les sommets. Les styles gardent leur modulation verticale ; la marche générique ne remplace
  pas les trajectoires de la figure. `travel` et `dir` ne déforment pas cette séquence validée.
- Contraposition ajustable du thorax, distincte des pieds et du bassin. Pas de norme angulaire
  inventée par style ; le réglage proposé est illustratif.
- Lecture finie 0→5 : arrêt sur la pose finale, sans retour automatique à l'origine. Choix
  des poses finales 0…5 et bouton Rejouer. Le transport partagé conserve la synchronisation.
  Le pied G libre et le déplacement final constituent l'état de sortie pour un futur enchaînement.
- URL/partage : variante et contraposition propres à sortieG, pose choisie partageable.
  Export de cinq temps avec conservation de la pose et de la pause d'origine.
- La ligne affichée suit ici l'avant du leader (+z). Les autres mouvements gardent leur repère.

## Vérifications prévues

Plan : directions anatomiques, partenaires synchronisés sans copie miroir des pas, croisé,
variante commune, quatre transferts, marka déchargé, pose finale conservée.
GLB final : cibles atteintes, longueurs constantes, semelles au sol, pied d'appui immobile,
orientation des pieds, ordre longitudinal, stabilité numérique aux frontières, accès direct
à une pose indépendant de l'historique. Mesurer la proximité D/D et le dégagement du genou
avec une géométrie explicitée ; ne pas confondre marqueur vert et preuve de contact de peau.
Régression : empreintes des matrices finales et appuis de sortieF/sortieGF comparées à la base.
Interface : cinq actions, pause/reprise/rejeu, variante, partage/rechargement et export.

## Sources et limites

- [Lourenço Marques, français, 1:01–1:30](https://www.youtube.com/watch?v=vpb--jaDoPQ&t=61s) :
  sortie, avancée, rentrée puis touché ; partenaire en base reculante.
- [Salsaventura, anglais, seconde version, 2:10–2:39](https://www.youtube.com/watch?v=x7_2xeqGQuo&t=130s) :
  G devant D au troisième, retour au quatrième, marka au cinquième ; 6–8 est une extension.
- [Morkiz, portugais, 0:27 et 4:04–4:34](https://www.youtube.com/watch?v=jUDfv_HfFh0&t=244s) :
  cinq actions et déplacement commun à droite en fin de figure.
- [Discovering Kizomba, dissociation](https://discoveringkizomba.com/dissociation-in-kizomba-just-westerners-or-also-angolans/) :
  témoignage pédagogique sur la variabilité des explications et des usages, sans angles normatifs.

Les précisions de contact cuisse D/D et de contournement viennent du propriétaire.

**Pas 1 plus en avant que de côté** (demande du 19 novembre, #28). Le G1 du leader avance de 34 cm et
s'écarte de 26 cm à gauche, au lieu de 14 cm en avant et 34 cm à gauche. La partenaire recule son D1
de 16 cm au lieu de 14. Le D2 glisse ensuite latéralement à hauteur de son départ, puis avance droit
pour se poser à l'extérieur du D de la partenaire. Le G1 ne peut pas être moins latéral : le D2 doit
se poser à environ 27 cm à gauche de l'axe pour le contact hanche contre hanche, et un G1 trop proche
de l'axe ferait passer le D2 par-dessus le G. Ce pas vaut à toutes les amplitudes.

**Contact du milieu des cuisses à l'action 2** (demande du 19 novembre, #28). Avant ce changement,
les bassins restaient à 40 cm l'un de l'autre dans l'axe de la danse : les cuisses se croisaient en X
et ne se rapprochaient qu'au genou (2,3 cm). Désormais, le G2 de la partenaire recule de 25 cm au lieu
de 40, et le D2 du leader avance de 46 cm au lieu de 40. Son bassin reste 2,5 cm à l'intérieur de son D,
ce qui laisse passer le D3 de la partenaire, puis avance de 7 cm de plus pendant le croisé pour que G
dégage D. Les bassins ne sont plus qu'à 19 cm l'un de l'autre, et les enveloppes des cuisses se
touchent (+0,4 mm) à 65 % et 69 % de la longueur des fémurs, au milieu des cuisses. Ce contact est complet jusqu'à
l'amplitude 1, puis il décroît jusqu'à l'arrivée précédente à l'amplitude 2, où l'ampleur des styles
ferait se croiser les fémurs. La progression totale de 70 cm et la pose finale sont inchangées. Les vidéos
et transcriptions ne fournissent pas une reconstruction 3D ni une simulation de forces.

## Calibrage du modèle et preuves de livraison

L'écartement des racines propre à cette sortie est de 0,40 m. Le bassin du leader reste entre
ses pieds pendant la préparation et le croisé ; il termine son avancée sur le droit aux
second et quatrième arrêts. Une rentrée immédiate de tout le bassin au troisième provoquait
une flexion forcée et une collision de genoux, malgré des cibles de pieds correctes.
Le marka conserve la phase corporelle de l'action 4 et effectue un touché de 5 mm sans transfert.
Les modulations supplémentaires du style sont bornées pour cette marche en couple ; voir
[les conventions](../.vibe/CONVENTIONS.md#sortie-garçon-validée--amendement-21-18-novembre-2026).

Les repères D/D utilisent des enveloppes illustratives de 8,5 cm autour des segments centraux
des fémurs. Leur proximité latérale ne remplace pas un contact de peau. Les tests des os
utilisent leurs sommets et triangles transformés, pas les boîtes précalculées du GLB quantifié.
La vérification des pieds emploie leurs enveloppes convexes horizontales, y compris en vol.
Les bras et les collisions de tous les tissus musculaires restent hors du modèle de contact.

Le chantier #27 prolonge la régression avec 504 empreintes sortieG
de `fa551c3` et conserve les 288 empreintes historiques sortieGF de `2621e59`. Le nouveau
rendu sortieF est décrit dans [sa spécification](spec-sortie-fille.md). [Rétrospective](retrospective-sortie-garcon.md).
