# Spec #95 — ontologie des figures : positions, transitions, intentions, contacts

[Accueil](../README.md) · [Règles du propriétaire](regles-proprietaire.md) · [Cadre](cadre/spec-implementation.md) ·
[Mode guidage](spec-mode-guidage-poc.md) · Issues #94 (expliquer les transitions), #90 et #91 (enchaînements)

> Usage concret : [ADR 004](adr/004-ontologie-source-des-figures.md) (données typées lues par l'app, les tests
> et le mode jeu).
>
> Statut : **proposition à relire par le propriétaire** (barrière de compréhension). Les étapes 2 et 3
> sont codées : `src/ontologie.ts` (positions, guidages, équivalence, insertions) et `src/transitions.ts`
> (textes, #94), vérifiés par `scripts/test_ontologie.mjs` et `scripts/test_transitions.mjs`. Chaque
> entrée porte le statut « à valider », affiché dans l'app, jusqu'à la relecture du propriétaire.
> L'exemple de la sortie garçon ci-dessous date d'avant #104 et #110 ; les données à jour sont dans le code.

## Demandes du propriétaire (20 novembre 2026)

- « Au-delà de la géométrie on peut essayer d'associer de l'ontologie. »
- « Ce qui est utile c'est entre chaque transition de position pouvoir expliquer la raison du
  mouvement : ce que le leader a engagé et ce que le suiveur a reçu. »
- « Le fait de pouvoir relier les figures entre elles doit aider à comprendre les distances et points
  de contact. »
- « La position 2 de la sortie garçon est la configuration de la position 5 de la sortie fille si le
  leader ne demande pas à la fille de reprendre la ligne mais d'avancer tout simplement. »
- « Le leader peut guider un ida e volta en milieu de figure. »

## Pourquoi un modèle au-dessus des trajectoires

Aujourd'hui chaque figure est une fonction du temps (`sampleSortieGarcon`, `sampleQuartsPaire`…) :
elle sait **où** sont les pieds, pas **pourquoi** ils y vont. Pour enchaîner des figures, expliquer une
transition ou vérifier une règle, il faut nommer ce qui reste vrai entre deux instants : une
**position** (qui porte le poids, où sont les pieds, quels contacts), et ce qui fait passer de l'une à
l'autre : une **transition** (ce que le leader engage, ce que le suiveur reçoit).

## Les notions

| Notion | Définition | Ce qu'elle porte | D'où elle vient aujourd'hui |
|---|---|---|---|
| **Position** | Un état du couple où les deux danseurs sont posés | appuis (pied porteur de chacun), pieds libres, placement relatif (face à face, quinconce, décalé), distances (bassins, poitrines), **contacts** actifs | fin d'action des figures (`SORTIE_*_ACTIONS`), neutre en quinconce (#48) |
| **Contact** | Un point où les corps se touchent ou se guident | paire de sites (main D du leader / omoplate G du suiveur, cuisses D/D, bords externes des pieds D, plexus…), état (actif, relâché) | sites du cadre (`CADRE_SITES`, #40), contacts de pieds (#50), cuisses (#28) |
| **Transition** | Le passage d'une position à la suivante, sur un nombre de temps | **engagement** du leader → **réception** du suiveur ; pieds qui bougent ; transferts d'appui (sur les temps, #62) | actions des figures |
| **Engagement** | Ce que le leader propose | partie du corps (buste, bassin, main du cadre, pied), direction, moment (il précède ou accompagne, jamais après : R22, #88) | à écrire |
| **Réception** | Ce que le suiveur reçoit et fait | ce qu'elle sent (pression, ouverture, rotation du cadre), sa réponse (pied, direction), retard admis (simultané ou très léger, jamais en avance : #88) | à écrire |
| **Figure** | Une suite nommée de positions et de transitions | début et fin (positions), variantes (pied gauche ou droit, en avant ou en arrière : #89) | modules de figures |
| **Équivalence** | Deux positions de figures différentes qui sont la même configuration | permet de passer d'une figure à l'autre (#90) et d'insérer une figure (#91) | à écrire |
| **Règle** | Une consigne vérifiable | élément contraint (position, transition, contact), critère, test | `docs/regles-proprietaire.md` |

## Exemple : la sortie garçon, transition par transition (à valider)

| De → à | Engagement du leader | Réception du suiveur | Contacts, distances |
|---|---|---|---|
| Neutre → 1 | Intention vers l'avant par le buste et le cadre ; G en avant à gauche | Recule D (16 cm) : elle reçoit l'avancée par le cadre | cadre fermé, plexus proche |
| 1 → 2 | D en avant, hors ligne ; le bord externe de son pied D vient au contact du sien | Recule G (22 cm) ; son D reste au contact | **bords externes des pieds D**, **milieu des cuisses D** (R9) |
| 2 → 3 | G croisé devant son D, dans son couloir ; le cadre l'invite à libérer la place | Recule D, qui sort du contact D/D puis recule | contact D/D relâché ; elle doit reculer plus qu'il n'avance (#56) |
| 3 → 4 | D, retour en face | G : retour sur la ligne | face à face |
| 4 → 5 | Marka G sans transfert | Marka D | quinconce neutre (R1) |

## Exemple : équivalence et enchaînement (#90)

Sortie fille, position 3 : le D du suiveur est au niveau du D du leader, à sa droite, cuisses D/D en
contact. La figure prévoit ensuite que le suiveur **croise G pour reprendre la ligne** (position 4).
Si le leader l'engage plutôt à **avancer tout simplement**, la position atteinte est celle de la
**position 2 de la sortie garçon** (pieds D bord à bord, cuisses D en contact, couple décalé). Le leader
peut alors finir par les transitions 2 → 3 → 4 → 5 de la sortie garçon.

```
sortieF.pos3 --(leader : « avance » / suiveur : avance D… à préciser)--> ≡ sortieG.pos2 --> sortieG.pos3 → 4 → 5
```

Ce que l'équivalence apprend au danseur : la même configuration (distances, contacts) sert de carrefour
entre deux figures ; c'est l'engagement du leader qui choisit la suite.

## Exemple : insertion d'un ida e volta (#91)

- Sortie fille, entre les positions 3 et 4 : ida e volta jambe gauche, **en arrière en premier**.
- Sortie garçon, entre les positions 2 et 3 : ida e volta jambe gauche, **en avant en premier**.

Condition d'insertion : la position de départ de l'ida (pied libre, appui, contacts) doit être
compatible avec la position de la figure où l'on s'insère ; à la fin de l'ida, on revient à la même
position, et la figure reprend.

## Forme des données (proposition)

```ts
type Side = "L" | "R";
interface Contact { a: string; b: string; state: "actif" | "relâché" }          // sites nommés (CADRE_SITES…)
interface Position { id: string; support: { leader: Side; follower: Side }; free: { leader: Side; follower: Side };
  placement: "face" | "quinconce" | "décalé"; contacts: Contact[]; pelvisGap?: number }
interface Transition { from: string; to: string; beats: number;
  engagement: { part: "buste" | "bassin" | "cadre" | "pied"; direction: string; text: string };
  reception: { feels: string; does: string; text: string; delay: "simultané" | "léger retard" } }
interface Figure { id: string; positions: string[]; transitions: Transition[]; variants?: string[] }
interface Equivalence { a: string; b: string; note: string }                     // ex. sortieF.pos3+avance ≡ sortieG.pos2
```

- Les **positions** sont mesurables sur le GLB : un test vérifie que la pose d'une figure à la fin d'une
  action correspond à la position déclarée (appuis, contacts, distances).
- Les **transitions** donnent le texte affiché dans l'app et le mode jeu (#94), et les règles
  temporelles (R22, #88) deviennent des tests sur `engagement` et `reception`.
- Les **équivalences** donnent au mode jeu les enchaînements permis (#90, #91).

## Ce qui est codé (étapes 2 et 3)

- **Positions** (29) : sortie garçon, sortie fille (crochet et recul), quart de tour, ida e volta. Chacune
  déclare les appuis (charge > 0,9), la disposition (quinconce : décalage latéral des bassins < 12 cm ;
  décalé : > 14 cm) et le contact des cuisses D (enveloppes au contact, ou écartées d'au moins 2 cm).
  En quinconce, les cuisses D sont intercalées : leur contact ne suffit pas à reconnaître les flancs
  droits, c'est le décalage des bassins qui le fait.
- **Guidages** (17, R24) : dans chaque transition, le pied du suiveur part avec ou après le pied du
  leader qui le provoque. Aucun guidage n'est déclaré pour la marka (le leader seul) ni pour le second
  pied du quart : le G du suiveur répond au cadre qui tourne (il part à 1,45, le D du leader à 1,8).
- **Équivalence** #90 : `sortieF.3` (alias « position 5 » du propriétaire) ≡ `sortieG.2`. C'est la même
  configuration, mais avec les appuis inversés, d'où le pont de 2 temps de l'enchaînement.
- **Insertions** #91 : à `sortieG.2` et à `sortieF.2`, l'ida part du pied libre du leader. L'insertion
  de la sortie fille est en position 2 dans le code (la proposition ci-dessus disait entre 3 et 4).
- Le test échantillonne chaque position sur le GLB réel (quinconce, kizomba) et vérifie que les
  constantes de #90 et #91 (`CHAIN_FROM`, `CHAIN_TO`, `INSERTION_AT`, `INSERTION_VARIANT`) sont celles
  des données. L'étape 4 (le mode jeu lit les données) reste à faire.

## Étapes proposées

1. Relecture de cette spec par le propriétaire : vocabulaire, exemples, textes d'engagement et de
   réception.
2. Données pour la sortie garçon, la sortie fille, les quarts et l'ida ; affichage du texte de la
   transition en cours (#94).
3. Tests : positions déclarées = poses mesurées ; règles temporelles.
4. Mode jeu : enchaînements par équivalence (#90) et insertions (#91).
