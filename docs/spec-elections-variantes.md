# Spec — élections de variantes en GIF (#148)

Fil d'Ariane : [docs](./) › **spec élections de variantes** · règles : [règles du propriétaire](regles-proprietaire.md)

## Demande du propriétaire (21 novembre 2026)

> pour trancher tes questions le mieux c'est de présenter les différents variants en GIF et de me
> les faire élire avec un commentaire optionnel

Une question de mouvement posée en mots (quel pied, quelle direction, quel seuil) se tranche mal
sans la voir. Chaque décision ouverte est donc présentée avec ses candidats **filmés** ; le
propriétaire élit une variante et peut laisser un commentaire.

## Principe

| Étape | Règle |
|---|---|
| Candidat | Un prototype activé seulement par l'URL : `?essai=cle1,cle2` (`src/essais.ts`). Sans ce paramètre, et dans les tests en node, rien ne change. |
| Preuve d'innocuité | Les tests existants restent verts sans qu'on y touche. |
| Film | Un GIF par candidat, avec les muscles, même cadrage et même durée pour tous les candidats d'une question (`docs/elections/<date>/`). |
| Page d'élection | Candidats côte à côte, une phrase qui dit ce qui change, les mesures utiles, un choix à cocher (dont « aucune ne convient »), un commentaire optionnel. |
| Neutralité | La page montre et mesure ; elle ne dit pas quelle variante est « la bonne ». |
| Trace | Le choix et le commentaire sont recopiés **mot pour mot** dans l'issue concernée. |
| Suite | La variante élue est implémentée dans une PR propre ; son interrupteur d'essai est retiré. Les candidats non élus disparaissent avec lui. |

Les interrupteurs d'essai ne sont **pas** des options de l'app : ils servent à filmer.

## Premier tour (21 novembre 2026)

Chaque question est posée comme une scène concrète : une figure, un pas, un pied.

### Q1 — Ida e volta en paire : quel pied recule chez le suiveur ? (#86, #144)

Scène : ida e volta en paire, quinconce. Le leader avance son pied **gauche**.

| Candidat | Ce que fait le suiveur | Interrupteur |
|---|---|---|
| A (aujourd'hui) | Il recule son pied **droit** : le pied opposé, dans le même couloir que le gauche du leader | — |
| B | Il recule son pied **gauche** : le même pied que le leader ; son droit reste en appui dans le couloir où avance le leader | `idaMemePied` |

Mesure à donner : recouvrement des semelles entre le gauche du leader et le droit du suiveur.

### Q2 — Où est la ligne de danse ? (#72)

Scène : sortie garçon, vue plongeante. Le mouvement est le même dans les deux candidats ; seule la
ligne rose change.

| Candidat | Ligne de danse | Interrupteur |
|---|---|---|
| A (aujourd'hui, #64) | Perpendiculaire aux bustes : elle passe entre les deux danseurs | — |
| B | Dans l'axe des bustes : elle passe par les deux danseurs | `ligneBustes` |

La suite de #72 (faire progresser la figure le long de la ligne) dépend de cette réponse ; elle
n'est pas prototypée avant.

### Q3 — Hors figures, le pied marche-t-il à plat ? (#73)

Scène : une marche hors figure, à choisir là où le pied se lit de profil.

| Candidat | Pied | Interrupteur |
|---|---|---|
| A (aujourd'hui) | À plat pendant tout le pas : c'est ce qu'exige l'oracle de la phase 18 | — |
| B | Déroulé comme dans les figures : le talon se lève, puis le pied se pose | `marcheDeroulee` |

Élire B demande d'amender la convention « pieds plats » et le contrat de l'oracle.

### Q4 — Croisé de la sortie garçon : pas long du suiveur, ou pas égaux ? (#56)

Scène : sortie garçon, pas 3 : le gauche du leader croise devant son droit (G3), le droit du
suiveur recule (D3).

| Candidat | Pas au croisé (leader / suiveur) | Interrupteur |
|---|---|---|
| A (aujourd'hui) | 34 cm / 54 cm : le suiveur fait un grand pas | — |
| B | 20 cm / 20 cm : le G3 se pose à droite du D2, au même niveau | `croiseEgal` |

Mesure à donner : chevauchements de pieds et croisements d'os de B (relevés dans #56 : 123
chevauchements et 15 os sur l'essai du 20 novembre).

### Q5 — Distance bassin-bassin (#67)

C'est un seuil, donc un nombre. Le propriétaire ne choisit pas un chiffre à l'aveugle : il faut des
candidats qui se voient. État au 21 novembre : **à étudier** ; la question est reportée à un second
tour si aucun candidat « plus proche » ne se prototype sans casser les figures.

## Page d'élection

- Un Artifact privé : pour chaque question, les GIFs côte à côte, la scène en une phrase, les
  mesures, un choix à cocher, un commentaire optionnel.
- Les réponses sont conservées avec la page, pour être relues par la session qui porte le chantier.
- Les GIFs sont aussi dans le dépôt (`docs/elections/2026-11-21/`) : la décision reste lisible sans
  la page.

## Critères d'acceptation

1. Sans `?essai=`, le comportement est inchangé : `npm test` passe sans modification des tests.
2. Chaque interrupteur est déclaré dans `src/essais.ts` avec sa question et son issue.
3. Chaque question présentée a un GIF par candidat, même cadrage, avec les muscles.
4. La page d'élection propose « aucune ne convient » et un commentaire pour chaque question.
5. Chaque vote est recopié mot pour mot dans son issue avant toute implémentation.
6. Une question reportée est nommée, avec sa raison.

## Résultats

À remplir après les votes.
