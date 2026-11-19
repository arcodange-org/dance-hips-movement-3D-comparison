# Cadre leader/suiveur : contacts, intentions, guidage

[Accueil](../../README.md) · **Cadre** · [Points de contact](points-de-contact.md) · [Actions et intentions](actions-et-intentions.md) · [Figures du dépôt](figures-du-depot.md) · [Spécification](spec-implementation.md)

Recherche et spécification du 19 novembre 2026, branche `arcodange/cadre-guidage`. **Aucun code
n'est modifié.** L'implémentation viendra après la validation du propriétaire.

## Pages

| Page | Contenu |
| --- | --- |
| [Points de contact](points-de-contact.md) | dix contacts (main D/dos, avant-bras et coude, aisselle, biceps, mains jointes, bras G du suiveur, poitrine, bassin, cuisses, avant-pieds) ; position neutre par danse ; étreinte fermée ou ouverte |
| [Actions et intentions](actions-et-intentions.md) | ordre buste → cadre → pieds ; catalogue de quinze actions ; règle des hanches ; analyse du geste coude/avant-bras du propriétaire |
| [Figures du dépôt](figures-du-depot.md) | sortie garçon, sortie fille, quarts de tour : tableau temps → contacts → intention → réponse du suiveur |
| [Spécification](spec-implementation.md) | état du code, manques du squelette, modèle de données, IK des bras, visualisation, critères d'acceptation A0 à A14 |

## Méthode

1. Lecture du dépôt : `AGENTS.md`, `CONTEXT.md`, posture et contraposition, notes et specs des
   deux sorties, phases 15 et 16, `src/anatomy.ts`, `src/styles.ts`, `src/pose.ts`,
   `src/rigJoints.ts`, `Rig.tsx`, `ContactViz.tsx`, la fixture GLB et la liste des nœuds des
   deux GLB.
2. Recherche web en anglais, français et portugais : pédagogie de la kizomba, du semba, de la
   tarraxinha, du zouk, du tango, de la salsa et de la danse de salon ; études sur la
   communication haptique. **Seules les sources réellement lues sont citées**, avec leur niveau
   de preuve. Celles qui n'ont pas pu être lues sont listées plus bas.
3. Les précisions du propriétaire (quinconce, hanches, cuisses, pas 1, geste du coude) sont
   marquées **Pr** et priment sur les sources quand elles divergent.
4. Quelques calculs géométriques à partir des constantes du code. Ce sont des estimations, pas
   des sondes du rendu.

## Constats principaux

1. **Une seule mesure de force existe dans les sources lues**, et elle porte sur les mains
   jointes : pics de 10 à 30 N, compression quand on avance et traction quand on recule, dans
   une tâche simplifiée avec des poignées [S1]. Pour la main sur l'omoplate, la poitrine ou le
   bassin, tout est **pédagogique et non mesuré**. Les pressions du catalogue sont donc une
   échelle qualitative de 0 à 3.
2. **Toutes les écoles lues décrivent l'ordre buste → cadre → pieds**, avec des bras dont le
   tonus reste constant : kizomba [S5], tango [S20, S22], salsa [S23], danse de salon [S16,
   S18, S19]. Aucune étude lue ne mesure cet ordre dans le temps.
3. **La sortie fille du propriétaire correspond presque temps pour temps à la « Woman Saída »
   de Garcia** [S8] : poitrine qui se relâche, main D qui glisse vers la droite, torse du leader
   tourné à droite, main G du suiveur qui fait pivoter sa poitrine, contact des cuisses D au
   temps 3, retour du torse au temps 4, marka par décélération. Il y a deux écarts : au temps 2,
   Garcia fait un *balance* là où le dépôt fait un crochet ou un recul ; et le code relâche la
   rotation du thorax pendant le temps 3 au lieu du temps 4.
4. **La sortie garçon correspond à l'« outside partner » de la danse de salon** [S16]. Le pas G
   prépare un pas D à l'extérieur du D du partenaire, avec un contre-corps d'environ 1/8 de tour.
   Les deux sorties aboutissent à la même configuration, flanc D contre flanc D.
5. **Le geste du coude et de l'avant-bras décrit par le propriétaire produit une rotation du
   suiveur vers sa droite.** Le côté G du suiveur vient contre le côté D du leader : c'est la
   géométrie de la promenade [S17] et du passeio [S9]. Les sources divergent sur ce qui amorce
   l'ouverture : l'avant-bras (Pr), le corps qui s'éloigne de la main (danse de salon) ou la main
   G (passeio de Garcia).
6. **Le contact des bassins est le point le plus divergent** : espace volontaire en kizomba
   [S6, S11], contact en zouk [S14, S15] et en danse de salon [S19], semba décrit tantôt avec
   contact des ventres, tantôt plus séparé [S11, S12]. La règle du propriétaire (les hanches se
   cherchent, le leader les repousse) réunit ces descriptions en deux états.
7. **Les bras actuels ne forment pas un cadre** (estimation à confirmer). La main D du leader
   part vers sa droite, à environ 0,49 m du dos du suiveur, et les mains jointes restent à
   environ 0,23 m l'une de l'autre. Avec des racines à 0,40 m, les bras primitifs (0,50 m jusqu'au
   centre de la main) devraient être presque tendus pour atteindre l'omoplate.
8. **Les quarts de tour en paire ne sont pas une rotation de couple** (calcul à partir du code,
   à confirmer). Le suiveur tourne en sens inverse du leader dans la salle (lacet π − θ). Après un
   quart, les deux regardent dans la même direction. Un cadre fermé ne pourrait pas se maintenir.
9. Le manuel SOS Dance cité dans [posture-contraposition](../posture-contraposition.md) est un
   manuel de fitness en solo, avec les bras le long du corps. Il convient pour la posture, pas
   pour le cadre.

## Ce qui manque au squelette

- `anatomy.glb` ne contient **aucun os au-dessus du bassin** : ni vertèbres, ni côtes, ni
  omoplates, ni clavicules, ni humérus, ni os de l'avant-bras ou de la main. L'omoplate,
  l'aisselle, les côtes et le plexus n'ont pas de surface osseuse.
- Les bras sont des **groupes JSX** (cylindres et sphère), sans poignet, sans pronation et sans
  omoplate mobile. Leurs constantes ne sont pas partagées avec la fixture de test, qui ne peut
  donc pas mesurer les mains.
- Les muscles du haut du corps (pectoral, trapèze, deltoïde, oblique) sont accrochés au thorax ou
  au rachis. Le deltoïde ne suit pas le bras.
- Le calage du contact (phase 16) exclut les bras. Aucune collision bras/corps n'est contrôlée.

Détails et pistes : [spécification, section 2](spec-implementation.md#2-ce-qui-manque-au-squelette).

## Points à faire valider par le propriétaire

1. **Main D du leader** : centre du dos, omoplate ou plus bas, selon la danse ? Le contact
   poignet/aisselle de la danse de salon s'applique-t-il ?
2. **Mains jointes** : quelle hauteur par danse (épaule en zouk, plus bas en kizomba) ?
3. **Geste d'ouverture** : pendant que l'avant-bras s'ouvre, le thorax du leader tourne-t-il
   vers sa gauche ? La main G participe-t-elle ? Pour un quart, le suiveur pivote-t-il ou fait-il
   un pas ?
4. **Sortie garçon, temps 1** : le buste du leader reste-t-il face au suiveur (hanches tournées,
   comme en danse de salon) ou tourne-t-il à droite de 12° (code actuel) ?
5. **Sortie fille** : le torse du leader reste-t-il tourné pendant tout le temps 3, comme chez
   Garcia ? Le temps 2 de Garcia (balance, frein) est-il une variante à ajouter ?
6. **Ordre dans la sortie garçon** : faut-il un décalage entre le buste du leader et celui du
   suiveur, comme dans la sortie fille ? Cela changerait les empreintes.
7. **Quarts de tour en paire** : le couple doit-il tourner ensemble autour d'un axe commun ?
   Cela touche l'oracle.
8. **Hanches** : le modèle « recherche par défaut, répulsion décidée par le leader, retour »
   (fenêtres des [figures](figures-du-depot.md)) est-il juste ? Faut-il seulement le contrôler,
   ou aussi le voir agir sur les bassins ?
9. **Kompa et semba** : aucune source lue ne décrit leur prise en couple de façon fiable.
   Le propriétaire peut-il décrire leurs contacts neutres ?
10. **Visualisation** : couleurs par rôle, flèches d'intention sans valeur en newtons, bandeau
    buste → cadre → pieds ; ces choix conviennent-ils ?

## Ce qui n'a pas pu être vérifié

- Les estimations géométriques (constats 7 et 8, section 1 de la spécification) viennent des
  constantes et des fonctions du code, pas d'une sonde du rendu ni d'une capture.
- Sources repérées mais **non lues**, donc non citées : Kimmel (2012), *Intersubjectivity at
  Close Quarters* (refus du serveur de l'éditeur) ; Kimmel et Preuschl, *Dynamic coordination
  patterns in tango argentino* (titre seulement) ; Takeda, Hirata et Kosuge (2007), robot
  partenaire de valse (PDF refusé, 403) ; prépublication Research Square sur la marche en tango
  (titre seulement) ; page wikiHow sur le kompa (erreur serveur).
- Pour [S2], [S3] et [S27], seuls le résumé et une partie du texte ont été lus.
- Aucune source portugaise lue ne décrit précisément la main D en kizomba. La seule source
  portugaise technique utilisée porte sur le zouk [S15].

## Références principales

La liste complète figure en bas de chaque page. Sources les plus utilisées :

- [S1] Sawers A. et al. (2017). *Small forces that differ with prior motor experience can communicate movement goals during human-human physical interaction.* J. NeuroEng. Rehabil., 14:8. [doi:10.1186/s12984-017-0217-2](https://doi.org/10.1186/s12984-017-0217-2)
- [S2] Chauvigné L. A. S., Brown S. (2018). *Role-Specific Brain Activations in Leaders and Followers During Joint Action.* Front. Hum. Neurosci., 12:401. [doi:10.3389/fnhum.2018.00401](https://doi.org/10.3389/fnhum.2018.00401)
- [S3] Gentry S., Murray-Smith R. (2003). *Haptic dancing: human performance at haptic decoding with a vocabulary.* IEEE SMC, p. 3432–3437. <https://www.dcs.gla.ac.uk/~rod/publications/GenMur03.pdf>
- [S5]–[S10] Garcia J. *Kiz - Frame*, *Kiz - Connection Points*, *Kizomba Disciplines*, *Kiz - Woman Saída*, *Kiz - Passeio*, *Kizomba Framework.* Sans date. <https://jonnygarcia.netlify.app/>
- [S11] Pollock T. (2018). *Desiring Connection: Affect in the Embodied Experience of Kizomba Dance.* Capacious, 1(2). [doi:10.22387/CAP2018.12](https://doi.org/10.22387/CAP2018.12)
- [S12] Kizomba Seattle (2014, mis à jour en 2016). *How to recognize tarraxinha, kizomba and semba.* <https://kizombaseattle.blogspot.com/2014/10/how-to-recognize-tarraxinha-kizomba-and.html>
- [S14] Bath Zouk. *Different Holds & Embraces.* <https://bathzouk-astro.pages.dev/library/fundamentals/concepts/different-holds>
- [S15] Machado B., Shigunov V. *Dança zouk: contribuição da flexibilidade na performance.* FIEP Bulletin, vol. 86. <https://ojs.fiepbulletin.net/fiepbulletin/article/download/86.a1.42/11994/15374>
- [S16] West K. (2026). *Improve Leading with an Effective Dance Frame.* CSULB. <https://home.csulb.edu/~kwest/wido/articles/dance-frame.pdf>
- [S17] West K., Caves L. (2025). *Harmonious Movement – Semi-Closed / Promenade.* CSULB. <https://home.csulb.edu/~kwest/wido/articles/harmony-semi.pdf>
- [S18] Ballroom Pages (2026). *Ballroom Dance Frame and Posture Guide.* <https://www.ballroompages.com/ballroom-technique/frame-and-posture/>
- [S19] Wikipedia. *Lead and follow* (consulté le 19 novembre 2026). <https://en.wikipedia.org/wiki/Lead_and_follow>
- [S20] Tanguito (2025). *Getting the frame right.* <https://tanguito.co.uk/blog/getting-the-frame-right/>
- [S21], [S22] Flejter A. (2022, 2024). *Close Embrace and Open Embrace* ; *All You Need To Know About Ochos.* Ultimate Tango. <https://red-daisy-tpf5.squarespace.com/blog/>
- [S23], [S24] Campbell R. (2024). *The Torso Technique All Pro Salsa Dancers Use* ; *The Secrets to Arm Connection for Salsa & Bachata.* Dance Dojo. <https://thedancedojo.com/blog/>
- [S25] Anonyme. *Quatre « SALIDAS »* (tango, en français), sans date. <https://docs.google.com/document/d/10dScuOVU5drQc-cA--O1ZPlfO50rfrcP>
- [S27] Matsuoka-Hatsuda K., Shimizu D. (2026). *Dynamic reorganization of leader–follower coordination in expert Latin American dance.* Proc. CogSci 48. <https://escholarship.org/uc/item/1j5502mb>
