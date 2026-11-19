# Sortie fille — description reçue, prochaine étape

[Accueil](../README.md) · [Tâches](TASKS.md) · [Chantier oracle](spec-oracle-corrections.md)

Description fournie par le propriétaire le 19 novembre 2026. Voir la [spécification de
la sortie fille en paire](spec-sortie-fille.md) pour sa mise en œuvre.

| Action | Leader | Suiveur |
| --- | --- | --- |
| 1 | Avance G et fait reculer le suiveur | Recule D |
| 2, variante crochet | D dessine un crochet, sans diagonale, pour arriver au même niveau que G ; D est écarté vers la droite d'une demi-distance de hanche | Décale G vers sa gauche : sortie de ligne et couloir pour la diagonale du D |
| 3 | Recule G, fait avancer le suiveur | Avance D en diagonale directe ; D du suiveur côte à côte à droite du D leader, avec contact des flancs de cuisse |
| 4 | Recule D et libère la place | Croise G pour retrouver la ligne |
| 5 | Marka G | Ramène D avec un marka également |

Alternative précisée pour l’action 2 : **D leader recule et G suiveur avance en diagonale
vers sa gauche**. Avec le crochet, G suiveur fait un pas purement latéral.
Ce qui provoque la sortie du suiveur est le cadre : cela peut être le bras droit du cadre
ou le buste, avec la contraposition enclenchée par le leader.

La [spécification](spec-sortie-fille.md) détaille le trajet du crochet, le repère du leader et les instants d’appui.
