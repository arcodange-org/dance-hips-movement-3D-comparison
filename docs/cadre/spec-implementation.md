# Spécification d'implémentation du cadre (sans code)

[Accueil](../../README.md) · [Cadre](README.md) · [Points de contact](points-de-contact.md) · [Actions et intentions](actions-et-intentions.md) · [Figures du dépôt](figures-du-depot.md) · **Spécification**

Proposition à valider avant tout code. Contraintes : ne pas modifier les trajectoires des pieds,
des bassins ni des appuis validés (sortie garçon, sortie fille, oracle) ; respecter les
conventions verrouillées (`.vibe/CONVENTIONS.md`) ; ne simuler aucune force réelle.

## 1. État actuel

### Ce qui existe

| Élément | Où | Nature |
| --- | --- | --- |
| Bras du leader et du suiveur | `Rig.tsx`, groupes `armUL/armUR` (épaule) et `armFL/armFR` (coude), enfants de `chest` | primitives JSX : cylindre de bras 0,26 m, cylindre d'avant-bras 0,22 m, sphère de main de rayon 0,04 m centrée à 0,24 m du coude ; épaules à `chest + (±0,19 ; 0,10 ; 0)` |
| Pose des bras | `applyDanceFrame`, `applyFollowerFrame` (`src/styles.ts`), appelées dans `applyPose` (`src/pose.ts` l. 227–228) | angles d'Euler **fixes**, identiques pour les six styles, indépendants du partenaire et de la figure |
| Torse | `Rig.tsx` : boîte 0,30 × 0,26 × 0,18 m au `chest`, cylindres pour le rachis, sphère pour la tête ; décalages dans `TORSO_JOINTS` (`src/rigJoints.ts`) | primitives ; seul le torse partage ses constantes avec la fixture GLB |
| Muscles du haut du corps | `anatomy_muscles.glb`, `src/muscles.ts` : `PectoralisMajor` et `Deltoid` sous `chest` ; `Trapezius`, `ErectorSpinae` et `ExternalOblique` sous `spine` | maillages BodyParts3D ; le deltoïde ne suit pas le bras |
| Repères de contact | `contactChest` (z = 0,16), `contactPelvis` (z = 0,14), `contactKneeL/R` (`Rig.tsx`) ; `ContactViz.tsx` : vert si distance < 0,09 m | sphères de position seulement |
| Proximité des cuisses D/D | `thighProximity` (`src/sortieGarconContact.ts`) : enveloppes de 8,5 cm autour du segment central des fémurs ; `SortieGarconContactViz` : vert si l'écart est inférieur à 3 cm | géométrie illustrative |
| Rotation du thorax dans les figures | `figure.chestYaw` (`sortieGarcon.ts`, `sortieFille.ts`), `quartTurnStep().upperYaw`, `idaContra` | les bras suivent parce qu'ils sont enfants du thorax |

### Ce que donnent les angles actuels (estimation)

Calcul de cinématique directe fait **à partir des constantes JSX**, en supposant l'ordre d'Euler
par défaut de three.js (`XYZ`), avec `lean` = 0,10 rad et des racines à 0,40 m (sorties). Ce
n'est pas une sonde du rendu : à confirmer par une capture ou une sonde.

| Quantité, repère du leader (+x à gauche, +z vers l'avant) | Valeur estimée | Lecture |
| --- | --- | --- |
| Main D du leader | (−0,48 ; 1,20 ; 0,19) m | la main part **vers la droite du leader**, loin du dos du suiveur (≈ 0,49 m) ; le commentaire du code annonce pourtant un avant-bras « vers la gauche » |
| Main G du leader | (0,19 ; 1,29 ; 0,03) m | main ramenée à hauteur de sa propre épaule, sans aller vers le suiveur |
| Main D du suiveur | (0,09 ; 1,10 ; 0,08) m | devant la poitrine du leader, en bas |
| Distance entre les mains jointes | ≈ 0,23 m | les mains **ne se rejoignent pas** |
| Main G du suiveur / omoplate D du leader (arrière de la boîte de torse) | ≈ 0,17 m | le bras G du suiveur entoure à peu près le leader |
| Épaule D du leader / omoplate G du suiveur | 0,44 m (`PAIR_DZ` 0,175) ; 0,49 m (0,20) | la portée du bras jusqu'au centre de la main est de 0,50 m : il faudrait un **bras presque tendu** pour atteindre l'omoplate |

## 2. Ce qui manque au squelette

1. **Aucun os du haut du corps dans le GLB.** `anatomy.glb` contient 21 nœuds : bassin, sacrum,
   os iliaques, fémurs, rotules, tibias, péronés et pieds. Il n'a ni vertèbres, ni côtes, ni
   sternum, ni clavicules, ni omoplates, ni humérus, ni radius, ni cubitus, ni os de la main.
   Les contacts du cadre (omoplate, aisselle, côtes, plexus) n'ont donc **aucune surface osseuse
   réelle**. Les seules surfaces disponibles sont celles de la boîte de torse et des muscles
   `PectoralisMajor`, `Trapezius`, `Deltoid`, `ExternalOblique`.
2. **Les bras sont de simples groupes.** Il n'y a pas d'axe de pronation ni de poignet, pas
   d'orientation de la paume, pas de glissement de l'omoplate, et le coude n'a pas de charnière
   contrainte. Les longueurs (0,26 m, puis 0,24 m jusqu'au centre de la main) n'ont pas été
   comparées à une référence anthropométrique. On sait seulement que la portée paraît courte
   pour envelopper le partenaire à 0,40 m (voir l'estimation ci-dessus).
3. **Les constantes des bras ne sont pas partagées avec la fixture.** `scripts/pose_fixture.mjs`
   crée les groupes `armU*` et `armF*` sans leur donner de position. Contrairement à
   `TORSO_JOINTS`, les décalages d'épaule et de coude n'existent que dans le JSX. Aucun test GLB
   ne peut donc mesurer les mains.
4. **Les bras sont exclus du calage du contact.** La phase 16 cale `PAIR_DZ` sur les corps sans
   les bras. Aucune collision bras/corps n'est contrôlée.
5. **Le deltoïde est accroché au thorax**, pas au bras : il reste en place quand le bras se lève.

Pistes, par ordre de coût :

- (A) garder les primitives, partager leurs constantes (`ARM_JOINTS` dans `src/rigJoints.ts`),
  recaler leurs longueurs et ajouter une IK ;
- (B) exporter les os du membre supérieur et de la ceinture scapulaire depuis BodyParts3D, avec
  le même pipeline que les jambes (`scripts/rebuild_anatomy.py`). Leur disponibilité dans le jeu
  de données utilisé reste à vérifier.

L'option A suffit pour les premiers critères. L'option B serait nécessaire pour mesurer les
contacts sur l'omoplate ou les côtes osseuses.

## 3. Modèle de données

Nouveau module pur, par exemple `src/cadre.ts` (à créer plus tard), sans dépendance au rendu.

```ts
type Dancer = "leader" | "follower";
type ContactRole = "connexion" | "guidage" | "frein" | "appui";
type Level = 0 | 1 | 2 | 3;               // échelle illustrative, jamais des newtons
type Evidence = "M" | "P" | "Pr" | "H";

/** Un site sur un danseur, exprimé dans le repère local d'un nœud du rig. */
interface ContactSite {
  id: string;                              // "L.handR", "F.scapulaL", ...
  dancer: Dancer;
  parent: "chest" | "spine" | "pelvis" | "armUL" | "armUR" | "armFL" | "armFR"
        | "HipPivot_L" | "HipPivot_R" | "KneePivot_L" | "KneePivot_R" | "AnklePivot_L" | "AnklePivot_R";
  local: [number, number, number];         // m, dans le repère du parent
  normal: [number, number, number];        // normale sortante de la surface
  radius: number;                          // tolérance du site (m)
  surface: string;                         // "paume", "pli du coude", "omoplate G", ...
}

/** Une paire de sites qui peut entrer en contact, avec son rôle par danse. */
interface ContactPair {
  id: string;                              // "mainD-omoplate", "cuissesD", ...
  a: string; b: string;                    // ids de ContactSite
  role: ContactRole;
  neutral: Partial<Record<StyleKey, { active: boolean; level: Level; evidence: Evidence }>>;
}

/** Une intention transmise pendant une fenêtre de temps d'une figure. */
interface CueEvent {
  figure: "sortieG" | "sortieF" | "quarts" | "neutre";
  variant?: string;                        // "hook" | "back" | "line" | "right"
  beatStart: number; beatEnd: number;      // horloge commune (clock.beat)
  stage: "buste" | "cadre" | "pieds";
  pair: string;                            // id de ContactPair émetteur
  intention: "avancer" | "reculer" | "lateral" | "sortieLeader" | "sortieSuiveur"
           | "ouverture" | "fermeture" | "rotation" | "frein" | "marka"
           | "hanchesRepousse" | "hanchesCherche";
  direction?: [number, number, number];    // repère du leader, si translation
  yaw?: number;                            // rad, signe du repère du dépôt, si rotation
  level: Level;
  response: string;                        // texte affiché : réponse du suiveur
  evidence: Evidence;
}
```

Les figures déclarent leurs `CueEvent` dans des tableaux de données, à partir des tableaux de
[figures du dépôt](figures-du-depot.md). Le moteur ne lit ces événements que pour les **bras**,
la **visualisation** et les **contrôles**. Les pieds et les bassins restent ceux des figures
validées.

### Sites proposés

Les positions sont des valeurs de départ prises sur les primitives JSX. Il faudra les recaler
par sonde sur les surfaces musculaires (Pectoralis, Trapezius, ExternalOblique) ; voir le
critère A0.

| id | Parent | Local (m) | Surface |
| --- | --- | --- | --- |
| `L.handR`, `F.handL`, `L.handL`, `F.handR` | `armF*` | (0 ; −0,24 ; 0) | paume, centre de la sphère de main |
| `L.forearmR` | `armFR` | (0 ; −0,11 ; 0) | face interne de l'avant-bras |
| `L.elbowR` | `armFR` | (0 ; 0 ; 0) | pli du coude |
| `L.bicepsR` | `armUR` | (0 ; −0,13 ; +0,03) | biceps (prise de la main G du suiveur) |
| `L.ribsR` | `chest` | (−0,15 ; −0,10 ; 0) | côtes droites (cible du coude dans l'ouverture) |
| `L.scapulaR` / `F.scapulaL` | `chest` | (∓0,09 ; +0,05 ; −0,09) | omoplate (arrière de la boîte) |
| `F.backMid` | `chest` | (0 ; −0,05 ; −0,09) | milieu du dos (kizomba [S6]) |
| `F.flankL` | `chest` | (+0,15 ; −0,10 ; 0) | flanc G (contact du pli du coude [S5]) |
| `F.armpitL` | `chest` | (+0,16 ; +0,02 ; 0) | aisselle G (variante de danse de salon [S16]) |
| `F.waistL` | `spine` | (+0,10 ; +0,02 ; −0,05) | taille ou bas du dos (tarraxinha [S12]) |
| `*.chestUpper` | `chest` | (0 ; +0,08 ; 0,16) | haut de la poitrine (Pr) |
| `*.plexus` | `chest` | (0 ; −0,08 ; 0,16) | plexus |
| `*.pelvisFront` | `pelvis` | (0 ; 0 ; 0,14) | existe déjà : `contactPelvis` |
| `*.thighR` | fémur D | point de `thighProximity` | milieu et haut de la cuisse D (Pr) |
| `*.forefootR` | `AnklePivot_R` | avant de la semelle | avant-pied (quinconce, Pr) |

## 4. Animation

### Principe

Ce qui est géométrique (positions des mains et des coudes) se calcule. Ce qui est intentionnel
(pression, direction) ne se montre que par des repères, **sans dynamique**. Aucune force ne
déplace un danseur.

### Étapes

1. **Constantes partagées.** Ajouter `ARM_JOINTS` (épaules, coude, main, longueurs) dans
   `src/rigJoints.ts`, utilisées par le JSX et par `pose_fixture.mjs`, comme `TORSO_JOINTS`.
2. **Cibles dans le repère du partenaire.** La cible de la main D du leader est un site du
   suiveur (`F.scapulaL`, `F.backMid` ou `F.waistL` selon la danse), plus un glissement donné
   par les `CueEvent` (par exemple la main qui glisse vers la droite du leader au temps 1 de la
   sortie fille [S8]). Les mains jointes visent un point commun entre les deux poitrines, à une
   hauteur qui dépend de la danse (à valider : épaule en zouk [S14], plus bas en kizomba [S6]).
3. **IK à deux segments pour chaque bras.** Le solveur est analytique et la charnière du coude
   se trouve sur l'axe X local, comme `solveLeg3D` (`src/ik.ts`). Les longueurs restent
   constantes. Un **pôle** choisit le plan du coude :
   - coude D du leader : vers `L.ribsR`, vers le bas et l'arrière, jamais derrière le plan du dos [S16, S17] ;
   - coude G du leader : vers le bas et l'extérieur ;
   - coude G du suiveur : relevé vers l'extérieur, à hauteur d'épaule (intention actuelle de `DANCE_FRAME_FOLLOWER`) ;
   - coude D du suiveur : vers le bas.
4. **Cible hors de portée.** On ne tend jamais un os. La cible glisse sur la surface du
   partenaire vers l'épaule de celui qui guide (de l'omoplate vers le flanc), et le cas est
   journalisé (`clamped`), comme pour les jambes.
5. **Geste du propriétaire.** Le coude reste épinglé à `L.ribsR` (distance plafonnée). L'avant-bras
   s'ouvre d'un angle `θ_open(b)` donné par le `CueEvent` (rotation autour de l'axe du bras),
   et la main entraîne la cible sur le dos du suiveur. La rotation du **torse du suiveur** reste
   celle que scripte la figure. Le geste du bras doit être **cohérent** avec elle (critère A11),
   mais il ne la calcule pas.
6. **Coordination entre partenaires.** Chaque `Rig` calcule sa pose seul. Deux options :
   - un composant de paire (`PairFrame`) qui tourne après les deux `Rig` dans `useFrame`, lit
     `pair.current`, résout les quatre bras et écrit leurs rotations ;
   - un calcul pur à partir des deux matrices de thorax, pour que la fixture GLB puisse le tester
     sans React (`solveFrame(leaderChest, followerChest, cues, style)`).

   Recommandation : le calcul pur, appelé par `PairFrame` dans le rendu et par la fixture dans
   les tests.
7. **Repli.** Hors paire, ou avec `cadre=0`, le comportement actuel est conservé. Les empreintes
   de régression (`snapshot` dans `pose_fixture.mjs`) couvrent `root`, `pelvis`, hanches, genoux,
   pieds, `chest` et `head`, mais pas les bras. Elles doivent rester identiques.

### Ordre et délais

- Le délai entre l'intention du leader et la réponse du suiveur n'est **pas un paramètre
  global**. La phase 15 a supprimé le « retard du suiveur ». Le délai découle des fenêtres
  `CueEvent` : le `beatStart` du stade `buste` précède ou égale celui du stade `cadre`, qui
  précède ou égale celui du stade `pieds`. La réponse du suiveur commence au plus tôt au début
  de l'intention.
- La sortie fille encode déjà un tel décalage (thorax du leader à b = 0,47, suiveur à 0,72).
  La sortie garçon n'en a pas. L'ajouter changerait `chest`, donc les empreintes : il faut une
  décision du propriétaire.

### Règle des hanches

Première étape : la règle n'est que **lue et contrôlée** (critère A9), sans modifier les
bassins. Si le propriétaire veut ensuite la voir agir, on proposera un décalage borné du bassin
du suiveur vers le contact, désactivé pendant les fenêtres `hanchesRepousse`. Ce serait une
nouvelle spec, avec des empreintes mises à jour.

## 5. Visualisation

| Élément | Rendu proposé | Paramètre |
| --- | --- | --- |
| Site de contact | petit disque orienté par la normale. **Couleur = rôle** : connexion bleu ardoise, guidage ambre, frein rouge, appui violet. **Taille = niveau** 0–3 | `cadreViz=1` |
| Contact géométrique confirmé | anneau autour du disque quand la distance entre les surfaces est sous la tolérance. Le vert et le rouge de `ContactViz` restent réservés au mode de contrôle géométrique | `cadreViz=2` |
| Intention de translation | flèche droite partant du site émetteur, dans la direction du `CueEvent`, de longueur proportionnelle au niveau | `cadreViz≥1` |
| Intention de rotation | flèche courbe autour de l'axe vertical du danseur concerné (quart de tour, ouverture) ou autour du thorax (contraposition) | `cadreViz≥1` |
| Ordre buste → cadre → pieds | bandeau de trois pastilles sous les actions ; la pastille du stade actif s'allume, et les pieds reprennent les traces et appuis existants | panneau |
| Hanches | trait entre les deux `contactPelvis` : plein en recherche, pointillé en répulsion | `cadreViz≥1` |
| Texte | pour le temps courant : contacts actifs, intention, réponse du suiveur (tableaux de [figures](figures-du-depot.md)) | panneau des actions existant |

Les flèches sont des **intentions illustratives**. La légende doit le dire. Aucune valeur en
newtons n'est affichée.

## 6. Critères d'acceptation testables (GLB réel)

À implémenter dans un futur `scripts/test_cadre.mjs`, inclus dans `npm test`. Les mesures se
font sur la fixture GLB (`pose_fixture.mjs`), avec les constantes `ARM_JOINTS` partagées et les
muscles du haut du corps chargés. Les seuils marqués (cal.) sont à fixer après la sonde A0 et à
faire valider. Les autres découlent des règles.

| # | Critère | Mesure | Seuil |
| --- | --- | --- | --- |
| A0 | Sonde de calage | positions des surfaces du Trapezius, du Pectoralis et de l'ExternalOblique dans le repère `chest`, pour les deux danseurs ; mise à jour des sites | rapport versionné |
| A1 | Longueurs constantes | épaule–coude et coude–main après IK, toutes poses | écart < 1e-6 m |
| A2 | Main D du leader sur le dos du suiveur | distance entre la surface de la sphère de main et la surface du dos du suiveur, au neutre, 6 styles, 3 amplitudes | ∈ [−0,005 ; 0,015] m (cal.) |
| A2b | Main dans la bonne région | position de la main dans le repère `chest` du suiveur : région omoplate (kizomba : centre du dos ; tarraxinha : taille) | boîte par style (cal.) |
| A3 | Coude D près des côtes | distance entre `L.elbowR` et `L.ribsR` : au neutre, puis pendant une fenêtre `ouverture` | neutre ≤ 0,08 m (cal.) ; ouverture ≤ 0,05 m (cal.) |
| A3b | Ouverture de l'avant-bras | angle de l'avant-bras D projeté au sol, mesuré depuis l'avant du leader, pendant `ouverture` | croît de façon monotone vers la droite du leader (−x) ; amplitude ≥ θ du `CueEvent` − 2° |
| A4 | Mains jointes | distance entre les centres des sphères de main G du leader et D du suiveur | ∈ [0,07 ; 0,09] m (sphères de 0,04 m qui se touchent) |
| A5 | Bras G du suiveur sur le bras D du leader | distance entre le segment de l'avant-bras G du suiveur et celui du bras D du leader, moins les rayons | ∈ [−0,005 ; 0,02] m (cal.) |
| A6 | Non-interpénétration des bras | distances capsule–capsule entre les huit segments des deux danseurs, et entre chaque segment et le torse du partenaire (boîte + muscles) ; le contact voulu (coude–côtes) est exclu | ≥ −0,005 m |
| A7 | Coude jamais derrière le dos | composante z du coude dans le repère `chest`, pour chaque bras | ≥ −0,02 m (cal.) |
| A8 | Haut des bustes | écart entre les surfaces au niveau de `chestUpper`, au neutre | ∈ [0 ; 0,03] m, sans pénétration (cohérent avec la phase 16) |
| A9 | Règle des hanches | distance entre les `contactPelvis` : hors fenêtre `hanchesRepousse`, elle reste sous le seuil de contact ; dans la fenêtre, elle augmente ; après, elle revient | seuils (cal.) ; signes et ordre vérifiés |
| A10 | Cuisses D/D | `thighProximity` aux arrêts du temps 2 de la sortie garçon et du temps 3 de la sortie fille ; le point de proximité est sur le milieu ou le haut du fémur | écart ≤ 0,03 m ; paramètre le long du fémur dans [0,1 ; 0,6] depuis la hanche (cal.) |
| A11 | Ordre des intentions | pour chaque figure, `beatStart(buste) ≤ beatStart(cadre) ≤ beatStart(pieds)` ; la rotation du torse du suiveur commence au plus tôt avec l'intention du leader ; même sens de rotation dans la salle | booléens |
| A12 | Quarts en paire | signe de la variation du lacet dans la salle, leader et suiveur | même signe, **si le propriétaire le valide** |
| A13 | Continuité | variation des angles de bras entre deux pas de 1/240 de temps, transitions comprises ; accès direct par temps identique à l'accès séquentiel | < 0,05 rad (cal.) ; égalité |
| A14 | Non-régression | empreintes existantes de sortieG, sortieF, sortieGF et de l'oracle | identiques |

## 7. Phasage proposé

1. **Sonde et constantes** : `ARM_JOINTS` partagé, sonde A0, rapport des estimations de la
   section 1 confirmées ou corrigées. Aucun changement visuel.
2. **Sites et visualisation** : `ContactSite` et `ContactPair`, rendu `cadreViz` des sites et
   du trait des hanches, tests A8 à A10 en lecture seule.
3. **IK des bras au neutre** : critères A1 à A7 et A13 sur les six styles.
4. **Intentions des figures** : `CueEvent` des sorties, flèches, panneau ; A3b, A9, A11.
5. **Quarts en couple** : seulement si le propriétaire valide la rotation commune ; nouvelle
   spec, car l'oracle est touché.

## 8. Risques

- Afficher des flèches de « force » pourrait être pris pour une mesure. La légende doit le
  dire, et les niveaux restent de 0 à 3.
- L'IK des bras dépend des deux danseurs : il faut garantir le déterminisme quel que soit
  l'ordre des `useFrame` (calcul pur recommandé).
- Avec des racines à 0,40 m, la portée des bras primitifs est à la limite. Recaler les
  longueurs des bras ou l'écart entre les bustes touche aux décisions des phases 15 et 16.

## Références

- [S5] Garcia J. *Kiz - Frame.* <https://jonnygarcia.netlify.app/kiz-frame>
- [S6] Garcia J. *Kiz - Connection Points.* <https://jonnygarcia.netlify.app/kiz-connection-points>
- [S8] Garcia J. *Kiz - Woman Saída.* <https://jonnygarcia.netlify.app/kiz-woman-saida>
- [S12] Kizomba Seattle (2014, mis à jour en 2016). *How to recognize tarraxinha, kizomba and semba.* <https://kizombaseattle.blogspot.com/2014/10/how-to-recognize-tarraxinha-kizomba-and.html>
- [S14] Bath Zouk. *Different Holds & Embraces.* <https://bathzouk-astro.pages.dev/library/fundamentals/concepts/different-holds>
- [S16] West K. (10 mars 2026). *Improve Leading with an Effective Dance Frame.* CSULB. <https://home.csulb.edu/~kwest/wido/articles/dance-frame.pdf>
- [S17] West K., Caves L. (15 juillet 2025). *Harmonious Movement – Semi-Closed / Promenade.* CSULB. <https://home.csulb.edu/~kwest/wido/articles/harmony-semi.pdf>
- Code et documents du dépôt lus : `src/anatomy.ts`, `src/styles.ts`, `src/pose.ts`, `src/rigJoints.ts`, `src/muscles.ts`, `src/ik.ts`, `src/sortieGarcon.ts`, `src/sortieFille.ts`, `src/sortieGarconContact.ts`, `src/components/Rig.tsx`, `src/components/ContactViz.tsx`, `scripts/pose_fixture.mjs`, `public/anatomy.glb` (liste des nœuds), [phase 15](../spec-phase15-paire.md), [phase 16](../spec-phase16-contact-fit.md).

## Implémentation, option A (20 novembre 2026)

Demande du propriétaire : « si la recherche a été faite il est temps de le matérialiser : ces points de
contact vont ajouter des contraintes qui vont aider à converger vers les bons mouvements de danse ».

- **Constantes partagées** : `ARM_JOINTS` (`src/rigJoints.ts`), utilisées par le JSX et par la fixture
  GLB, qui place désormais les bras. Les noms sont rendus anatomiques : `armUL`/`armFL` est le bras
  gauche (côté +x) ; les angles historiques de `applyDanceFrame` et `applyFollowerFrame` sont reportés
  sur les mêmes bras physiques, donc le rendu hors paire est inchangé.
- **IK des bras** (`src/cadre.ts`) : `solveArm` (deux segments analytiques, longueurs constantes, pôle
  du coude, cible hors de portée bornée sur la ligne de l'épaule et signalée `clamped`) ; `solveFrame`
  résout les deux bras d'un danseur contre la poitrine du partenaire, déjà posée.
- **Sites et pôles** : main D du leader sur l'omoplate G du suiveur, au bord du dos (`scapulaL`), coude
  vers ses côtes D ; main G du suiveur sur l'omoplate D du leader (`scapulaR`), coude relevé vers
  l'extérieur ; mains jointes au milieu des épaules G du leader et D du suiveur, 6 cm plus bas. Visée au
  milieu de l'omoplate, l'avant-bras traversait le torse du partenaire (5,7 cm) ; au bord du dos, il
  longe son flanc.
- **Rendu** : chaque `Rig` résout ses bras après sa pose, avec la poitrine du partenaire de sa dernière
  pose (au plus une image de décalage) ; hors paire ou avec `cadre=0`, rien ne change.
- **Mesures** (`scripts/test_cadre.mjs`, quinconce, plexus) : mains sur leurs sites quand elles sont à
  portée ; bras bornés 1/84 (sortie garçon), 7/84 (sortie fille, le couple s'ouvre), 0 (quarts, ida,
  sur place) ; avant-bras au plus 1,4 cm dans la boîte de torse du partenaire (sur place, où le style
  balance les bassins ; 0,5 à 0,8 cm dans les figures) ; pose du corps (pieds, bassins, poitrines)
  inchangée par le cadre. Les omoplates sont visées à 15 cm de l'axe, au bord du dos : à 14 cm,
  l'avant-bras entrait de 2 cm sur place.

Suite : les contacts comme **contraintes** sur les bustes et les bassins (le cadre qui retient ou
transmet), les `CueEvent` des figures et la visualisation des intentions.


## Buste droit, cadre qui s'ouvre (#93, 20 novembre 2026)

Retour du propriétaire : « la contraposition et l'inclinaison vers l'avant en permanence ont été mal
interprétées (on dirait des lutteurs de sumo et non des danseurs parfois) (très accentué lors de la
sortie fille) ».

- **Inclinaison du contact plexus** (`PLEXUS`, `src/pose.ts`) : au plus 0,08 rad, et seulement en couple
  rapproché. Elle s'efface quand il manque plus de 6 à 14 cm pour que les plexus se touchent (position
  ouverte). Avant : jusqu'à 2 × 0,35 rad. Elle s'arrête quand le tronc (bassin → tête, posture du style
  comprise) atteint 0,13 rad (7,5°) : le suave, déjà penché par son style (6,6°), s'incline à peine
  (sortie fille : 10,8° → 7,4°).
- **Buste tourné vers le partenaire** : au plus 0,3 rad (avant : tout le buste, jusqu'à 90°).
- Mesures (kizomba, plexus, quinconce) :

  | Figure | Tronc max (avant → après) | Buste contre bassin (avant → après) |
  |---|---|---|
  | sortie garçon | 15,0° → 6,6° | 68° → 17° |
  | sortie fille | 18,4–20,3° → 6,8° | 90° → 17° |
  | quarts, ida, sur place | ≤ 8,4° → ≤ 6,8° | 18–30° → 17° |

- **Cadre** : sans buste tourné, la main qui vise l'omoplate traverserait le torse du partenaire.
  - Elle glisse le long de son dos vers son côté, jusqu'à 20 cm.
  - Si le bras la traverse encore (elle passe à côté de lui), la main lâche et le bras revient le long
    du corps du danseur : le contact est relâché, le cadre s'ouvre.
  - Sorties : bras tendus jusqu'à 25 %, mains lâchées jusqu'à 20 %, au plus 3 cm dans le torse.
  - Quarts, ida, sur place : contacts gardés, au plus 1,5 cm.
- Tests : `test_plexus.mjs` (tronc ≤ 8°, buste ≤ 18° dans toutes les figures en paire),
  `test_cadre.mjs`.
- GIF de profil (kizomba, quinconce) : [sortie fille, danseurs droits](../gifs/sortie-fille-droits.gif).


## Le bras droit du guideur ne se baisse pas (#178, 22 novembre 2026)

Règle du propriétaire : le bras droit du guideur ne se baisse pas.

Depuis #93, quand la main droite du guideur ne pouvait plus rester sur le dos de la suiveuse (elle passe à
côté de lui, dans la sortie fille), elle lâchait et le bras revenait le long du corps, main à hauteur de
hanche : le bras tombait puis remontait, d'un seul coup.

- **Cadre ouvert** (`CADRE.openFrame`, `src/cadre.ts`) : hors du dos, la main droite du guideur attend devant
  son flanc droit, avant-bras levé, coude vers ses côtes ; si ce bras traversait la suiveuse, plus à
  l'extérieur. Le bras ne revient plus le long du corps.
- **Sans saut** (`CADRE.leave`) : la main quitte le dos peu à peu, à mesure que le bras qui vise le dos
  entrerait dans le torse de la suiveuse (de 0 à 5 cm). La pose reste une fonction de la pose : rien ne dépend
  du temps.
- Le bras gauche de la suiveuse n'est pas concerné : hors du dos du guideur il revient le long de son corps,
  comme avant (cela n'arrive dans aucune des cinq figures mesurées).
- Mesures (kizomba, quinconce, plexus) :

  | | Avant | Après |
  |---|---|---|
  | Main droite du guideur, au plus bas (repère de sa poitrine, épaule à +10 cm) | −42 cm (hanche) | −3 cm (sortie fille) ; +3 à +6 cm ailleurs |
  | Saut du coude entre deux seizièmes de temps, sortie fille (`test_upper_body.mjs`) | 31 cm (34 pour le bras du rig) | 9,4 cm (9,9) |
  | Avant-bras dans le torse de la suiveuse, sortie fille | au plus 3 cm (tolérance) | 1,9 cm |

- Test : `scripts/test_cadre.mjs` (dans chaque figure en paire, la main droite du guideur ne descend jamais sous
  −15 cm dans le repère de sa poitrine).

## Les mains jointes : attitudes et prise (#179, ouvert le 22 novembre 2026)

Les mains jointes visent aujourd'hui le milieu des deux épaules, 6 cm plus bas : entre les deux poitrines. Avec
le haut du corps anatomique (#176) on voit que les avant-bras s'y replient (coude à 27°), que les mains sont
cachées entre les cages thoraciques et que les doigts entrent dans les côtes du partenaire.

Le propriétaire a précisé qu'il existe plusieurs attitudes (hauteur du coude, mains ouvertes vers l'extérieur ou
gardées près de l'épaule) et il a décrit la prise : phalanges serrées, pouce ouvert, main de la suiveuse posée en
travers de celle du guideur, ses phalanges refermées autour de l'index du guideur, pouces croisés. Deux autres
attitudes sont filmables (`?essai=mainsCote`, `?essai=mainsBasses`, inertes sans le paramètre) ; l'application ne
change pas tant qu'il n'a pas tranché : [dossier](../elections/2026-11-22-mains/README.md).

Précision du 23 novembre 2026 pour l'attitude sur le côté (`mainsCote`, `CADRE.handsSide`) : les mains se lèvent
légèrement au-dessus de l'épaule, leur milieu à hauteur d'épaule. Le point des mains jointes est donc 1 cm sous la
moyenne des deux épaules (le centre de la paume ; le milieu de la main est plus haut), 20 cm vers l'extérieur du
couple. L'orientation des mains (pouce du guideur vers le ciel, paume à mi-chemin entre sa droite et la suiveuse) et
leur emboîtement relèvent du haut du corps
anatomique : [spec](../spec-haut-du-corps.md).

## La main gauche de la suiveuse sur l'épaule droite du guideur (#180, 22 novembre 2026)

Règle du propriétaire : l'avant-bras ou la main gauche de la suiveuse est posé sur l'épaule droite du guideur, contre
le devant ou le côté de l'épaule ; son coude gauche cherche le contact avec le bras droit du guideur, sur lequel elle
s'appuie quand il l'élève par l'épaule ou l'aisselle.

- **Avant** : sa main visait l'omoplate droite du guideur, dans son dos, coude relevé vers l'extérieur.
- **Site** (`CADRE_SITES.shoulderR`) : devant et côté de l'épaule droite du guideur. **Coude** (`CADRE_SITES.armR`) :
  sous cette épaule, du côté extérieur, là où pend le bras du guideur ; l'avant-bras de la suiveuse repose sur ce
  bras, hors du torse du guideur. Le coude ne suit pas l'avant-bras du guideur : il ne se balance pas avec lui.
- Mesures (`scripts/test_cadre.mjs`) : main sur son site quand elle est à portée ; coude de la suiveuse à 10,6 à
  11,4 cm de l'axe du bras droit du guideur en moyenne (les deux bras ont 4 à 5 cm de rayon) ; aucune main lâchée
  hors des sorties. Haut du corps anatomique : la paume se tourne vers l'épaule.
- Reste à faire : l'appui lui-même, quand le guideur élève la suiveuse.

