# Spec — élections de variantes en GIF (#148)

Fil d'Ariane : [docs](./) › **spec élections de variantes** · règles : [règles du propriétaire](regles-proprietaire.md)

## Origine (21 novembre 2026)

Les questions de mouvement en attente du propriétaire se tranchent en lui montrant les variantes en
GIF : il en élit une, avec un commentaire s'il le souhaite.

Une question de mouvement posée en mots (quel pied, quelle direction, quel seuil) se tranche mal
sans la voir. Chaque décision ouverte est donc présentée avec ses candidats **filmés** ; le
propriétaire élit une variante et peut laisser un commentaire.

## Principe

| Étape | Règle |
|---|---|
| Candidat | Un prototype activé seulement par l'URL : `?essai=cle1,cle2` (`src/essais.ts`). Sans ce paramètre, rien ne change. En node, la variable d'environnement `ESSAI` joue le même rôle pour mesurer un candidat ; les tests ne la posent jamais. |
| Témoin | `?essai=temoin` ne change rien : il sert à filmer le comportement actuel image par image hors du mode paire (`sortieBeat` ne vaut sinon qu'en paire). |
| Preuve d'innocuité | Les tests existants restent verts sans qu'on y touche. |
| Film | Un GIF par candidat, avec les muscles, même cadrage et même durée pour tous les candidats d'une question (`docs/elections/<date>/`). `scripts/capture_figure_gif.mjs`, une capture à la fois ; `START=<temps>` filme à partir d'un temps donné. |
| Mesure | Chaque candidat est mesuré sur le vrai GLB avec les outils des tests (`scripts/mesure_essai_*.mjs`) : semelles, os des jambes, inclinaison du pied. Un candidat filmé sans mesure le dit. |
| Page d'élection | Candidats côte à côte, une phrase qui dit ce qui change, les mesures utiles, un choix à cocher (dont « aucune ne convient »), un commentaire optionnel. |
| Neutralité | La page montre et mesure ; elle ne dit pas quelle variante est « la bonne ». |
| Trace | Le choix est consigné dans l'issue concernée ; le commentaire y est reformulé en mots simples, sans citation (règle du 22 novembre : le propriétaire ne veut pas être cité). |
| Suite | La variante élue est implémentée dans une PR propre ; son interrupteur d'essai est retiré. Les candidats non élus disparaissent avec lui. |

Les interrupteurs d'essai ne sont **pas** des options de l'app : ils servent à filmer.

## Premier tour (21 novembre 2026)

Chaque question est posée comme une scène concrète : une figure, un pas, un pied.

### Q1 — Ida e volta en paire : quel pied bouge chez le suiveur ? (#86, #144)

Scène : ida e volta en paire, quinconce, kizomba. Aux temps 1 et 2 le leader avance son pied
**gauche** puis le ramène ; puis gauche derrière, droit devant, droit derrière (pas de 18 cm).

| Candidat | Ce que fait le suiveur (temps 1–2, 3–4, 5–6, 7–8) | Interrupteur |
|---|---|---|
| A (aujourd'hui) | Pied **opposé** : droit derrière, droit devant, gauche derrière, gauche devant | — |
| B | **Même** pied : gauche derrière, gauche devant, droit derrière, droit devant | `idaMemePied` |

Mesures (`scripts/mesure_essai_ida.mjs`, plexus et contraposition comme dans l'app, amplitude 1) :

| Candidat | Semelles des deux danseurs (400 instants) | Os des jambes entre danseurs (64 poses) |
|---|---|---|
| A | aucun recouvrement | aucun croisement |
| B | aucun recouvrement | 19 poses avec croisement (cuisses et tibias) |

B est un prototype brut : seul le pied du suiveur change, les bassins et les genoux gardent leurs
réglages actuels.

### Q2 — Où est la ligne de danse ? (#72)

Scène : sortie garçon, vue plongeante. Le mouvement est le même dans les deux candidats ; seule la
ligne rose change. Aucune mesure : seul le tracé diffère.

| Candidat | Ligne de danse | Interrupteur |
|---|---|---|
| A (aujourd'hui, #64) | Perpendiculaire aux bustes : elle passe entre les deux danseurs | — |
| B | Dans l'axe des bustes : elle passe par les deux danseurs | `ligneBustes` |

La suite de #72 (faire progresser la figure le long de la ligne) dépend de cette réponse ; elle
n'est pas prototypée avant.

### Q3 — Hors figures, le pied marche-t-il à plat ? (#73)

Scène : un danseur seul marche le cercle du corridinho (temps 9 à 16) : chaque pied fait un pas
d'environ 47 cm tous les 2 temps. En paire, la marche hors figure passe par `placePaire` et
`marchePaire`, pas par `plannedFeet` : le candidat ne s'y voit pas, d'où le solo.

| Candidat | Pied | Interrupteur |
|---|---|---|
| A (aujourd'hui) | À plat pendant tout le pas : c'est ce qu'exige l'oracle de la phase 18 | `temoin` (pour filmer) |
| B | Déroulé comme dans les figures (`gaitStep`) : le talon se lève, puis le pied se pose par le talon | `marcheDeroulee` |

Mesures (`scripts/mesure_essai_marche.mjs`, 400 instants) :

| Candidat | Inclinaison du pied | Deux pieds à plat | Os le plus bas |
|---|---|---|---|
| A | 0° | 100 % du temps | au sol |
| B | talon levé jusqu'à 20°, pointe relevée jusqu'à 13° à la pose | 46 % du temps | au sol |

Élire B demande d'amender la convention « pieds plats » et le contrat de l'oracle.

## Questions reportées au second tour

### Croisé de la sortie garçon : pas long du suiveur, ou pas égaux ? (#56)

Aujourd'hui, au pas 3, le leader fait 34 cm et le suiveur 54 cm. L'essai du 20 novembre (G3 à
0,56 de profondeur et −0,10 de côté, 20 cm de chaque côté) donnait 123 chevauchements de pieds et
15 croisements d'os ; son code n'a pas été gardé. Les trois pistes relevées dans l'issue (G3 moins
croisé hors du couloir du suiveur, quinconce plus large pendant la sortie, croisé gardé en
exception) changent la géométrie du couple, pas seulement un pas : chacune demande de régler à
nouveau les bassins et les pas suivants. Filmer l'essai brut aurait faussé le vote.

### Distance bassin-bassin (#67)

C'est un seuil, donc un nombre. Le propriétaire ne choisit pas un chiffre à l'aveugle : il faut la
même figure filmée à plusieurs distances, ce qui demande de régler à nouveau chaque figure.

## Page d'élection

- Un Artifact privé ([page du premier tour](https://claude.ai/artifact/SzBbjQosJqsvLtotRzuRp2), ouvrable par le propriétaire seul) : pour
  chaque question, les GIFs côte à côte, la scène en une phrase, les mesures, un choix à cocher, un
  commentaire optionnel.
- Les réponses sont conservées avec la page (un document par question : `votes/q1`, `votes/q2`,
  `votes/q3`), pour être relues par la session qui porte le chantier.
- La source de la page et les GIFs sont dans le dépôt (`docs/elections/2026-11-21/`, page
  `election.html`) : la décision reste lisible sans la page.

## Critères d'acceptation

1. Sans `?essai=`, le comportement est inchangé : `npm test` passe sans modification des tests.
2. Chaque interrupteur est déclaré dans `src/essais.ts` avec sa question et son issue.
3. Chaque question présentée a un GIF par candidat, même cadrage, avec les muscles.
4. La page d'élection propose « aucune ne convient » et un commentaire pour chaque question.
5. Chaque vote est consigné dans son issue avant toute implémentation (choix, commentaire reformulé sans citation).
6. Une question reportée est nommée, avec sa raison.

## Résultats du premier tour (votes du 21 novembre 2026)

| Question | Variante élue | Commentaire, reformulé | Suite |
|---|---|---|---|
| Q1 — ida e volta en paire, pied du suiveur (#86, #144) | **A, pied opposé** (la figure d'aujourd'hui) | aucun | Rien ne change dans la figure. L'interrupteur `idaMemePied` est retiré. La même question posée dans la PR #153 est tranchée par ce vote. |
| Q2 — ligne de danse (#72) | **B, dans l'axe des bustes** | aucun | En paire, la ligne passe par les deux danseurs : le couple progresse le long de la ligne, le leader en sort sur le côté et y revient. La règle R6 est réécrite : ce vote revient sur la lecture faite en #60 et #64 (ligne perpendiculaire aux bustes). L'interrupteur `ligneBustes` est retiré. |
| Q3 — marche hors figure (#73) | **B, déroulée** | Les deux conviennent, c'est une affaire de style. B est plus naturelle et plus courante. A reste bonne. | La marche déroulée devient la marche par défaut hors figure. La convention « pieds plats » et le contrat de l'oracle sont amendés pour ces marches. L'interrupteur `marcheDeroulee` est retiré. |

Les variantes élues sont implémentées dans une PR empilée sur celle du dossier (#149).

Les questions 4 à 7 ajoutées à la page le 22 novembre (forme, sens et taille du « 8 » des hanches,
kompa) appartiennent à l'élection du ginga : voir #159 et la PR #160.
