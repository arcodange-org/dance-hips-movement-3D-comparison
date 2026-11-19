# Actions et intentions de guidage

[Accueil](../../README.md) · [Cadre](README.md) · [Points de contact](points-de-contact.md) · **Actions et intentions** · [Figures du dépôt](figures-du-depot.md) · [Spécification](spec-implementation.md)

Pour chaque action : quels contacts portent l'intention, dans quel ordre, et comment le suiveur
répond. Les codes de preuve (M, P, Pr, H) et l'échelle de pression sont ceux des
[points de contact](points-de-contact.md#comment-lire-ce-catalogue).

## Ordre de transmission : buste, puis cadre, puis pieds

Plusieurs sources pédagogiques, de danses différentes, décrivent le même ordre. L'intention part
du centre du leader (poids, rotation du thorax). Le cadre, dont le tonus reste constant, la
transmet. Les pieds viennent ensuite.

- **Corps avant bras.** On parle de guidage par le corps quand le transfert de poids du leader
  met les bras en mouvement. Un guidage par les seuls bras, sans mouvement du corps, est présenté
  comme une marque d'inexpérience [S19]. Même idée en danse de salon [S18], en tango (un
  guidage par les bras tendus produit un effet d'accordéon) [S20] et en salsa (le torse guide, les
  bras suivent parce qu'ils lui sont attachés) [S23].
- **Le cadre d'un seul bloc.** Kaye West compare le cadre à un cerceau : les angles des épaules,
  des coudes et des poignets restent stables, et le haut du corps tourne d'un bloc. Elle l'écrit
  ainsi : « The entire frame of the upper bodies turn as a single unit » [S16]. Garcia demande
  aussi un cadre constant quel que soit le mouvement, et peu de mouvement du haut du corps [S5].
- **Rotation.** En tango, le leader amorce le pivot des ochos par le torse et les hanches, et
  l'étreinte le transmet. Le suiveur reprend la rotation du torse puis pivote sur sa jambe d'appui
  [S22]. Une salida de tango marque le croisé du suiveur « principalement par dissociation du
  buste dès le 2eme pas » [S25].
- **Intention, signal, direction.** Garcia demande, pour chaque mouvement, une intention claire,
  un signal physique (ce que le suiveur perçoit) et une direction [S7].

Ce que disent les études, avec leurs limites :

- Les forces aux mains, petites, semblent indiquer au partenaire « what to do and when to do it ».
  Elles sont déjà présentes pendant l'initiation [S1]. Les auteurs n'ont **pas** analysé leur
  évolution dans le temps : l'ordre buste → cadre → pieds n'est donc pas démontré par cette étude.
- En imagerie, la compétence du leader est décrite comme la transmission de forces, celle du
  suiveur comme la réponse aux indices de force (mains seulement, en IRMf) [S2].
- En rumba experte, la coordination est intermittente et l'asymétrie entre leader et suiveur
  change selon les phases [S27]. Le suiveur n'est donc pas une copie retardée du leader. Cela
  rejoint la règle du propriétaire : les hanches du suiveur *se cherchent*.
- Avec un leader robotique purement haptique en swing, les suiveurs s'appuient sur un vocabulaire
  de figures connues pour anticiper [S3]. Le contexte de la figure compte autant que le signal.
- Le travail de Kimmel souligne l'importance du réglage préalable de la posture et du tonus
  musculaire (communiqué de presse, pas l'article) [S4].

**Ordre retenu pour la modélisation (H)** :

1. **Buste** : déplacement ou rotation du thorax du leader, poids sur l'avant-pied.
2. **Cadre** : le tonus reste constant. Un contact actif varie (pression de la main droite,
   avant-bras, mains jointes, cuisse).
3. **Pieds** : le pas du leader, puis le pas ou le pivot du suiveur.

Côté suiveur, la réponse se fait dans le même ordre : son torse répond, puis son bassin, puis
ses pieds [S22]. Le délai n'est pas un paramètre fixe : il découle du signal (voir
[spécification](spec-implementation.md#ordre-et-délais)).

## Règles du propriétaire

| Règle | Conséquence pour le modèle |
| --- | --- |
| Quinconce de départ : jambes droites intercalées, avant-pieds en contact, haut des bustes qui peut se toucher | contacts 7 et 10 actifs à l'état neutre |
| Les hanches se cherchent (suiveur) et se repoussent à l'initiative du leader | voir [règle des hanches](#règle-des-hanches) |
| Au temps 2 de la sortie garçon et au temps 3 de la sortie fille, le milieu et le haut des cuisses droites se touchent | contact 9 actif à ces arrêts |
| Le pas 1 de la sortie garçon va plus en avant que de côté ; l'intention vers l'avant fait reculer le suiveur | intention « avancer » au temps 1 |
| Le coude droit rapproché des côtes et l'avant-bras droit ouvert vers la droite ouvrent le suiveur sur un quart de tour ou plus | voir [l'exemple](#exemple-du-propriétaire--coude-droit-et-avant-bras-ouvert) |
| La sortie fille est provoquée par le cadre : bras droit ou buste, avec la contraposition enclenchée par le leader ([notes](../notes-sortie-fille.md)) | intention « sortie du suiveur » |

## Règle des hanches

Proposition de modèle (H), à valider :

| État | Qui décide | Effet sur les bassins | Exemple dans les figures |
| --- | --- | --- | --- |
| **Recherche** (par défaut) | suiveur | le bassin du suiveur tend vers celui du leader, jusqu'au contact (marqueurs `contactPelvis`) | départ, marka |
| **Répulsion** | leader | le leader éloigne ou tourne son bassin, ce qui ouvre un espace ou un couloir ; le suiveur ne compense pas pendant la fenêtre | sortie garçon, temps 1–2 (le bassin du leader part à l'extérieur) ; sortie fille, temps 2 (crochet ou recul du droit) |
| **Retour** | suiveur, après la fin de la répulsion | la recherche reprend ; le contact revient progressivement | sortie garçon, temps 4 ; sortie fille, temps 4–5 |

Les sources sur l'espace volontaire entre les bassins (kizomba [S6]) et celles sur le contact
(zouk [S15], danse de salon [S19]) deviennent ainsi deux états d'une même règle. En tarraxinha,
la jambe, la hanche ou le bras du leader peut amorcer le mouvement de hanche [S12]. Le geste du
poignet sur le dos, qu'une source compare à un tournevis, accompagne la hanche du suiveur [S13].

## Catalogue des actions

Le sens des flèches suit l'ordre de transmission. Les contacts sont numérotés comme dans
[points de contact](points-de-contact.md#vue-densemble).

| Action | Intention et contacts émetteurs, dans l'ordre | Réponse du suiveur | Variations, divergences | Preuve |
| --- | --- | --- | --- | --- |
| **Avancer** (le leader avance) | buste vers l'avant (7, légère compression) → la main D garde le contact, le suiveur y laisse un peu de poids (1) → mains jointes en compression (5) → pied du leader | recule ; depuis le quinconce, pied D en kizomba | forces aux mains en compression pendant la phase « forward » [S1] | M (mains), P [S19], Pr |
| **Reculer** (le leader recule) | buste vers l'arrière → la main D presse doucement le dos (1) → mains jointes en traction (5) → pied | avance | en passeio, la main G et le recul de la poitrine signalent la marche arrière [S9] | M (mains) [S1], P [S7] |
| **Pas de côté** | le centre se déplace latéralement → le cadre bouge d'un bloc → pied | pas latéral, miroir | — | P [S16, S23] |
| **Sortie de ligne du leader** (dehors, à droite) | pas G : les hanches tournent d'environ 1/8 de tour vers la gauche, les épaules d'environ 1/8 vers la droite pour rester face au partenaire (contre-corps) → pied D à l'extérieur du D du partenaire | reste face au leader et recule ; flancs de cuisses D/D | dans le dépôt, le bassin ne tourne pas et le thorax tourne de −12° (voir [figures](figures-du-depot.md)) | P [S16], Pr |
| **Sortie de ligne du suiveur** | le leader réduit l'avancée de la poitrine (7 se relâche) → la main D glisse vers sa droite sur le dos du suiveur (1) → le leader bloque le recul, son torse pivote à droite → il recule ensuite en gardant le torse tourné | la main G décrit un cercle sur le dos du leader (6), la poitrine pivote à droite vers le leader, le pied D avance à droite du leader, contact des cuisses D extérieures (9) | Garcia : temps 2 en *balance* sans pas ; le dépôt : crochet ou recul du D leader | P [S8], Pr |
| **Ouverture** (vers une position côte à côte) | (a) **propriétaire** : coude D aux côtes, avant-bras D ouvert vers la droite (2) ; (b) **danse de salon** : la main D reste en place, le corps s'en éloigne, la main G indique la direction (5) ; (c) **kizomba, passeio** : la main G repousse (5), la poitrine du leader tourne de 90° à gauche | rotation vers sa droite ; son côté G vient contre le côté D du leader ; la tête suit le buste | quel segment amorce : avant-bras D (Pr), corps (P [S17]), main G (P [S9]) | Pr, P |
| **Fermeture** | bouts des doigts de la main D sur le dos (1), pas du leader vers sa droite | pivote vers le leader (180° en passeio), puis reprend le basique | — | P [S9] |
| **Quart de tour du couple** | rotation du thorax du leader (7) → le cadre tourne d'un bloc → pivot de la main D (1) → pieds (vírgula) | pivote sur l'appui, torse d'abord, bassin ensuite ; même sens de rotation dans la salle que le leader | à vérifier dans le dépôt : en paire, le suiveur tourne en sens inverse (voir [figures](figures-du-depot.md#quarts-de-tour)) | P [S7, S16, S22], H |
| **Tour du suiveur** (plus d'un quart) | ouverture prolongée (avant-bras D ou main) → pivot de la main D [S7] ; en salsa, rotation du torse et retournement du poignet [S23] | tourne sur son axe, retrouve le contact ensuite | — | P, Pr |
| **Arrêt, frein** | le buste s'arrête → la main D retient (1, niveau 3) ; elle peut empêcher le changement d'appui [S25] | s'arrête ; peut être ramené vers l'avant sans pas [S8] | — | P |
| **Marka** | décélération du mouvement ; le poids du leader reste sur le même pied | pose le pied sans transfert | Garcia : poids gardé à droite pour éviter un transfert prématuré [S8] | P, dépôt |
| **Dissociation bassin/buste** | le thorax tourne par rapport au bassin, le cadre suit le thorax | le torse du suiveur suit le cadre, son bassin garde sa propre trajectoire | contre-corps d'environ 1/8 de tour en danse de salon [S16, S17] ; torsion en tango [S22] | P |
| **Contraposition** | rotation du haut du corps opposée au pas (voir [posture-contraposition](../posture-contraposition.md)) | rotation du torse dans le même sens dans la salle | amplitude illustrative dans le dépôt (12° par défaut) | P, dépôt |
| **Hanches : recherche / répulsion** | répulsion : bassin ou hanche du leader (8) ; recherche : bassin du suiveur | voir [règle des hanches](#règle-des-hanches) | sources divergentes | Pr, P |
| **Guidage par la cuisse** | contact 9 actif pendant un pas | la jambe du suiveur suit la cuisse du leader | technique citée, non détaillée [S10] | P |

## Exemple du propriétaire : coude droit et avant-bras ouvert

**Geste.** Le coude droit du leader, fléchi, vient contre ses côtes droites. Son avant-bras
s'ouvre ensuite vers l'extérieur, dans un plan presque horizontal, en pivotant autour du coude.
Anatomiquement, cela correspond à une rotation externe de l'épaule avec le bras collé au corps
(H, à faire confirmer).

**Effet sur le suiveur** (géométrie, H) :

1. La main droite, posée sur l'omoplate gauche du suiveur, décrit un arc vers la droite du
   leader et légèrement vers lui.
2. Le côté gauche du suiveur est ramené vers le flanc droit du leader. Son épaule gauche avance
   par rapport à la droite, et il **tourne vers sa droite** (sens horaire vu du dessus).
3. Vers 90°, le côté gauche du suiveur touche le côté droit du leader, et tous deux regardent
   vers la gauche du leader. C'est la géométrie de la promenade [S17] et du passeio [S9].
4. Si l'ouverture continue, le quart devient un tour vers la droite du suiveur.

**Concordance avec les sources.**

- En danse de salon, le passage en promenade produit la même trajectoire de main. Kaye West
  l'attribue au corps qui s'éloigne d'une main restée fixe : « But it is the forearm that
  moves » [S17]. L'angle d'épaule augmente sans que le coude passe derrière le dos. Le suiveur
  tourne vers sa droite et son côté gauche vient contre le côté droit du leader [S17].
- Dans la sortie fille de Garcia, la poitrine du suiveur pivote aussi vers sa droite. L'amplitude
  est plus petite, et le signal vient du glissement de la main droite et du torse du leader [S8].
- Divergence : pour le passeio, Garcia attribue l'ouverture à une poussée de la **main gauche**
  et à une rotation de 90° de la poitrine du leader vers sa gauche [S9].

**Ordre proposé (H)** :

1. Buste du leader : il se stabilise ou tourne légèrement (à préciser par le propriétaire).
2. Coude contre les côtes : la connexion se ferme. Le levier de l'avant-bras est ancré au tronc,
   si bien que la rotation part du centre et non d'une traction du bras. C'est l'interprétation
   proposée ici.
3. Ouverture de l'avant-bras : guidage en rotation. Le niveau 2 donne un petit angle, un niveau
   maintenu donne un quart ou plus.
4. Réponse du suiveur : torse vers sa droite, puis bassin, puis pivot sur l'appui ou pas du pied
   droit.

**Questions au propriétaire** :

- Le thorax du leader tourne-t-il en même temps vers sa gauche, comme dans le passeio, ou reste-t-il face au suiveur ?
- La main gauche participe-t-elle à l'ouverture ?
- Pour un quart de tour, le suiveur pivote-t-il sur place ou fait-il un pas ?

## Références

- [S1] Sawers A., Bhattacharjee T., McKay J. L., Hackney M. E., Kemp C. C., Ting L. H. (2017). *Small forces that differ with prior motor experience can communicate movement goals during human-human physical interaction.* J. NeuroEng. Rehabil., 14:8. [doi:10.1186/s12984-017-0217-2](https://doi.org/10.1186/s12984-017-0217-2). Mesuré.
- [S2] Chauvigné L. A. S., Brown S. (2018). *Role-Specific Brain Activations in Leaders and Followers During Joint Action.* Frontiers in Human Neuroscience, 12:401. [doi:10.3389/fnhum.2018.00401](https://doi.org/10.3389/fnhum.2018.00401). Mesuré (IRMf, mouvements des mains).
- [S3] Gentry S., Murray-Smith R. (2003). *Haptic dancing: human performance at haptic decoding with a vocabulary.* IEEE International Conference on Systems, Man and Cybernetics, p. 3432–3437. <https://www.dcs.gla.ac.uk/~rod/publications/GenMur03.pdf>. Résumé et introduction lus.
- [S4] Austrian Science Fund (FWF), via Medical Xpress (29 décembre 2015). *The workings of human interaction and improvisation.* Communiqué sur les travaux de M. Kimmel. <https://medicalxpress.com/news/2015-12-human-interaction.amp>
- [S5] Garcia J. *Kiz - Frame.* Sans date. <https://jonnygarcia.netlify.app/kiz-frame>
- [S6] Garcia J. *Kiz - Connection Points.* Sans date. <https://jonnygarcia.netlify.app/kiz-connection-points>
- [S7] Garcia J. *Kizomba Disciplines.* Sans date. <https://jonnygarcia.netlify.app/kizomba-disciplines>
- [S8] Garcia J. *Kiz - Woman Saída.* Sans date. <https://jonnygarcia.netlify.app/kiz-woman-saida>
- [S9] Garcia J. *Kiz - Passeio.* Sans date. <https://jonnygarcia.netlify.app/kiz-passeio>
- [S10] Garcia J. *Kizomba Framework.* Sans date. <https://jonnygarcia.netlify.app/kizomba-framework>
- [S12] Kizomba Seattle (2014, mis à jour en 2016). *How to recognize tarraxinha, kizomba and semba.* <https://kizombaseattle.blogspot.com/2014/10/how-to-recognize-tarraxinha-kizomba-and.html>
- [S13] Discovering Kizomba (18 mars 2024). *What are Tarraxinha, Tarraxa, Tarraxo?* <https://discoveringkizomba.com/tarraxinha-tarraxa-difference-to-kizomba/>
- [S15] Machado B., Shigunov V. *Dança zouk: contribuição da flexibilidade na performance.* FIEP Bulletin, vol. 86 (année non indiquée). <https://ojs.fiepbulletin.net/fiepbulletin/article/download/86.a1.42/11994/15374>
- [S16] West K. (10 mars 2026). *Improve Leading with an Effective Dance Frame.* CSULB. <https://home.csulb.edu/~kwest/wido/articles/dance-frame.pdf>
- [S17] West K., Caves L. (15 juillet 2025). *Harmonious Movement – Semi-Closed / Promenade.* CSULB. <https://home.csulb.edu/~kwest/wido/articles/harmony-semi.pdf>
- [S18] Ballroom Pages (2026). *Ballroom Dance Frame and Posture Guide.* <https://www.ballroompages.com/ballroom-technique/frame-and-posture/>
- [S19] Wikipedia. *Lead and follow* (consulté le 19 novembre 2026). <https://en.wikipedia.org/wiki/Lead_and_follow>
- [S20] Tanguito (Emma) (9 avril 2025). *Getting the frame right.* <https://tanguito.co.uk/blog/getting-the-frame-right/>
- [S22] Flejter A. (19 avril 2024). *All You Need To Know About Ochos.* Ultimate Tango. <https://red-daisy-tpf5.squarespace.com/blog/all-you-need-to-know-about-ochos>
- [S23] Campbell R. (16 juin 2024). *The Torso Technique All Pro Salsa Dancers Use.* Dance Dojo. <https://thedancedojo.com/blog/torso-lead-technique-salsa/>
- [S25] Anonyme. *Quatre « SALIDAS »*. Google Docs, tango, sans date. <https://docs.google.com/document/d/10dScuOVU5drQc-cA--O1ZPlfO50rfrcP>
- [S27] Matsuoka-Hatsuda K., Shimizu D. (2026). *Dynamic reorganization of leader–follower coordination in expert Latin American dance.* Proceedings of the 48th Annual Conference of the Cognitive Science Society. <https://escholarship.org/uc/item/1j5502mb>. Résumé lu.
