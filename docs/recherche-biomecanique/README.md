# Recherche biomécanique : ce que dit la littérature

[Accueil du dépôt](../../README.md) · [Styles de danse](../styles-de-danse.md) · [Ginga angolaise](../ginga-angolana.md) · [Posture et contraposition](../posture-contraposition.md)

Recherche documentaire menée le 19 novembre 2026, en anglais et en français. Elle confronte les
choix du comparateur 3D (pieds, bassin, genoux, couple) à la littérature scientifique. Elle ne
modifie pas le code. Les valeurs du dépôt restent un calibrage du modèle, pas une norme de danse.

> [!IMPORTANT]
> **Constats principaux**
>
> - Aucune étude biomécanique revue par les pairs n'a été trouvée sur la kizomba, le semba, le
>   kompa, la tarraxinha, le suave ou le zouk. Les seuls travaux académiques sur la kizomba
>   relèvent des sciences sociales. Toutes les comparaisons passent par la marche, la danse
>   orientale, le tango ou la danse de salon.
> - Le roulis du bassin de la kizomba (±2,9°) correspond à l'obliquité de la marche (6 à 9° crête
>   à crête). Les amplitudes de la tarraxinha (±9° en roulis, ±8° en tilt) et du lacet du zouk
>   (±10°) dépassent nettement la marche : elles sont plausibles pour des isolations volontaires,
>   mais aucune mesure ne les documente.
> - L'isolation complète du haut du tronc (`iso=1`) est une idéalisation. Même des expertes de
>   danse orientale ne découplent pas le bassin de la ceinture scapulaire, et elles bougent moins
>   le bassin que les novices.
> - La contraposition de 12° est cohérente. Elle reste sous la rotation thoracique maximale
>   (environ 25° par côté entre T1 et L1) et rejoint les 7 à 11° mesurés entre cage thoracique et
>   bassin en valse.
> - Le pied du GLB est un pied osseux. Il est plus court qu'un pied vivant (environ 13 % contre
>   15 % de la stature) et plus ouvert que l'angle de pas habituel (14 à 21° par pied contre 7 à
>   12°).
> - La position fermée de danse de salon superpose les moitiés droites des partenaires, avec
>   bassin et cuisses en contact. Cela soutient qualitativement la quinconce et le contact des
>   cuisses droites de la PR #33. Aucune distance ni aucun décalage ne sont publiés.
> - Le guidage en couple passe par des forces faibles (10 à 30 N aux mains). L'absence de
>   simulation de forces reste donc cohérente avec un guidage informatif.
> - Les sorties garçon (37 à 66 cm par pied) correspondent à des « pas compacts ». Les diagonales
>   de 93 à 98 cm de la sortie fille approchent une foulée de marche et méritent un examen.

## Pages

- [Pied, appuis et longueur de pas](pied-et-appuis.md) : dimensions et ouverture du pied,
  base de sustentation, déroulé, appui sur l'avant-pied et longueurs de pas comparés au GLB.
- [Bassin et dissociation](bassin-et-dissociation.md) : amplitudes du bassin à la marche,
  coordination bassin–thorax, isolation volontaire en danse orientale et contre-rotation en
  danse de salon.
- [Genou et hanche](genou-et-hanche.md) : flexion du genou en appui selon la vitesse, le tango
  et la posture, amplitudes normatives et rôle des abducteurs de hanche.
- [Danse de couple](danse-de-couple.md) : état de la recherche sur les danses afro-diasporiques,
  position fermée, forces de guidage et confrontation aux constats de la PR #33.
- [Kinésithérapie, ostéopathie et sources francophones](kine-osteo-fr.md) : amplitudes du rachis,
  muscles des isolations (moyen fessier, carré des lombes, obliques) et inventaire des sources
  françaises.
- [Confrontation au modèle](confrontation-modele.md) : tableau paramètre par paramètre avec
  verdicts, contradictions et points à faire valider par le propriétaire.

## Méthode

1. **Sources interrogées** : PubMed via les E-utilities du NCBI (titres, auteurs, résumés, DOI) ;
   textes intégraux en libre accès via PMC (`efetch db=pmc`) et Europe PMC ; vérification de DOI
   avec Crossref ; theses.fr pour les thèses françaises ; recherche web générale pour les revues
   (Frontiers, PeerJ, EMC, JDMS) et les notices de manuels.
2. **Mots-clés** : kizomba, zouk, semba, kompa, tarraxinha ; tango, salsa, ballroom, partnered
   dance, belly dance ; foot progression angle, stance width, heel pad ; pelvic obliquity,
   pelvis–thorax coordination, contrary body movement ; knee flexion stance, range of motion ;
   gluteus medius, quadratus lumborum, obliques. Équivalents français : angle du pas, moyen
   fessier, danse de couple, thèse STAPS.
3. **Règle de citation** : une source n'est citée que si son titre, ses auteurs, son année et sa
   revue ont été vérifiés. Chaque référence indique ce qui a été lu (résumé ou texte intégral).
   Les valeurs reprises d'une étude citée dans une autre sont signalées comme telles.
4. **Mesures du squelette** : longueur, largeur et ouverture du pied, écart des chevilles et
   largeur osseuse du bassin ont été mesurés sur `public/anatomy.glb` avec un script Python
   ad hoc qui décode les sommets quantifiés. Ce script n'est pas versionné. Ces mesures dépendent
   de la définition des axes.
5. **Limites** :
   - Textes intégraux payants : Kadaba 1990, Öberg 1993-1994, Roach et Miles 1991,
     Soucie 2011, Kuliś et Gajewski 2022, Tournillon et Siegler 2021, EMC.
   - Tableaux ANSUR II et NHANES inaccessibles ou sans la mesure voulue.
   - PMC protégé par un captcha en navigation. Europe PMC parfois indisponible.
   - Documents HAL de l'Université de Reims illisibles (certificat expiré).
   - Aucune valeur n'a été déduite de ces sources non lues.

## Droits d'auteur

Les pages paraphrasent les sources. Elles contiennent au plus une citation courte (moins de
15 mots, entre guillemets, attribuée) par source.
