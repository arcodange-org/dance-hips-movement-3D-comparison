# ADR 004 — L'ontologie des figures comme données typées, lues par l'app, les tests et le mode jeu

Date : 2026-11-20. Statut : proposé (à relire par le propriétaire). Spec : [ontologie des figures](../spec-ontologie-figures.md)
(#95). Liée à #90 (enchaînements), #91 (insertions), #94 (expliquer les transitions).

## Contexte

- Le propriétaire demande « au-delà de la géométrie, de l'ontologie ». Il veut aussi, à chaque
  transition, « ce que le leader a engagé et ce que le suiveur a reçu ». Puis : « l'ontologie, comment
  s'en servir concrètement ? ».
- Aujourd'hui chaque figure est une fonction du temps (`sampleSortieGarcon`…). Le savoir sur les figures
  est éparpillé en constantes :
  - `CHAIN_FROM = 3` / `CHAIN_TO = 2` pour l'enchaînement (#90) ;
  - `INSERTION_AT = 2` pour l'ida inséré (#91) ;
  - les fenêtres du mode jeu ;
  - des commentaires (« son G reprend la ligne ») et des règles (R22, R24) codées test par test.
- Rien ne dit qu'une position nommée dans une spec est bien celle que l'échantillonneur produit. C'est
  ainsi que « position 5 » (propriétaire) et « position 3 » (code) ont pu désigner la même chose sans
  que rien ne le vérifie.

## Décision

**Une seule source : `src/ontologie.ts`, des données TypeScript typées (la forme proposée par la spec #95)
que trois consommateurs lisent.** Pas de moteur d'inférence, pas d'OWL ni de RDF : des tableaux
relus par le propriétaire et vérifiés par les tests.

```ts
// Une position = un instant d'un échantillonneur, nommé et décrit.
{ id: "sortieF.3", figure: "sortieF", beat: 3, label: "D/D côte à côte, avant qu'elle ne reprenne la ligne",
  support: { leader: "L", follower: "R" }, placement: "décalé",
  contacts: [{ a: "leader.footR.outer", b: "follower.footR.outer", state: "actif" }, { a: "leader.thighR", b: "follower.thighR", state: "actif" }] }
// Une transition = ce que le leader engage, ce que le suiveur reçoit.
{ from: "sortieF.2", to: "sortieF.3", engagement: { part: "pied", text: "son G recule, le cadre l'invite à passer" },
  reception: { feels: "le cadre s'ouvre", does: "son D vient au niveau du sien", delay: "simultané" }, statut: "à valider" }
// Une équivalence et une insertion = ce que le mode jeu a le droit d'enchaîner.
{ from: "sortieF.3", via: "avance", to: "sortieG.2", key: "↑", note: "#90" }
{ at: "sortieG.2", insert: "ida.gauche.avant", key: "ida", note: "#91" }
```

### Les trois usages

1. **App et mode jeu : le texte des transitions (#94).** Pendant une figure, le HUD affiche la
   transition en cours : « Leader : son G recule, le cadre l'invite à passer. Suiveur : sent le cadre
   s'ouvrir, son D vient au niveau du sien. » Les textes vivent dans les données, au même endroit que
   leur statut (« à valider » ou « validé » par le propriétaire).
2. **Tests : déclaré = mesuré.** `scripts/test_ontologie.mjs` échantillonne chaque position déclarée
   sur le GLB réel, puis vérifie :
   - les appuis (charge > 0,9 sur le pied porteur) ;
   - les contacts déclarés (distance de cuisses et de bords de pied sous un seuil) ;
   - le placement.
   Sur chaque transition, il vérifie les règles temporelles et de longueur : R24 (le pied du suiveur ne
   part jamais avant celui du leader) et R22 (même pas). Une spec qui nomme une position et un
   échantillonneur qui ne la produit pas échouent ensemble.
3. **Mode jeu : enchaînements et insertions lus, pas codés.** `planGuide` ne connaît plus
   `CHAIN_FROM` ni `INSERTION_AT`. Il lit, pour la figure en cours, les équivalences et insertions
   partant d'une position atteinte, avec leur touche et leur fenêtre. Ajouter un enchaînement validé
   par le propriétaire, c'est ajouter une ligne de données (et son pont s'il faut un pont) ; les tests
   de continuité du mode jeu le couvrent alors sans code de plus.

### Ce qui ne change pas

Les échantillonneurs restent la vérité géométrique. L'ontologie les nomme et les décrit, elle ne
calcule aucune pose. Les invariants (os, semelles, sol) restent dans les tests des figures.

## Conséquences

- Le propriétaire relit et corrige un seul fichier en français (positions, textes d'engagement et de
  réception, statuts) ; les écarts de numérotation se règlent dans les données (`label`, `alias` :
  « position 5 » du propriétaire ↔ `sortieF.3`).
- Les constantes de #90 et #91 deviennent des lignes de données ; leur refactoring suit la fusion de
  ces deux PR.
- Coût : un module de données, un test, un panneau du HUD. Pas de dépendance nouvelle.
- Risque : des textes inventés présentés comme du savoir. Garde : tout texte non relu porte le statut
  « à valider », et le HUD l'affiche en italique avec ce statut.

## Étapes

1. `src/ontologie.ts` : positions et transitions de la sortie garçon, de la sortie fille, des quarts et
   de l'ida ; équivalence #90 et insertions #91 (statut « à valider »).
2. `scripts/test_ontologie.mjs` dans `npm test` (déclaré = mesuré, R22, R24).
3. HUD du mode jeu : transition en cours (#94).
4. `planGuide` lit les équivalences et insertions ; les constantes de #90 et #91 disparaissent.
