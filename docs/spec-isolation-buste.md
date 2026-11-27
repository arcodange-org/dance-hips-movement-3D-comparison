# Au-dessus du nombril, le buste reste stable (#223, règle R46)

Règle du propriétaire (27 novembre 2026, déjà donnée le 25 pour la tarraxinha, valable pour toutes les danses) : les
hanches bougent sans arrêt avec le transfert de poids ; tout ce qui est au-dessus du nombril reste stable. Le buste ne
part pas de côté avec les hanches, ne roule pas, ne pique pas, ne tourne pas avec le bassin. Restent le déplacement de
la figure, sa rotation d'ensemble (quart de tour) et la contraposition voulue du guideur. C'est la taille, sous le
nombril, qui absorbe. Partout : seul et en couple, six styles, pas de base et figures du mode jeu, vitrine.

## Constat (`main`, avant ce chantier)

Mesure de l'issue : le haut du buste (`chest`) dans le repère de chaque danseur, chaque trajet comparé à sa moyenne
glissante sur 4 temps (ce qui retire le déplacement de la figure), crête à crête. Kizomba, quinconce, amplitude 1.

| où | bassin : côté / roulis / lacet / tangage | haut du buste : côté / roulis / lacet / tangage |
| --- | --- | --- |
| couple, pas de base (guideur) | 5,9 cm / 3,4° / 0° / 5,8° | **5,6 cm / 4,2° / 0,5° / 16,4°** (suiveuse : tangage 17,2°) |
| couple, ida e volta | 4,5 / 6,4 / 18,3 / 4,0 | **3,6 / 1,6 / 7,9 / 9,9** |
| couple, marche (avance) | 3,3 / 3,1 / 1,9 / 4,0 | **2,7 / 2,3 / 1,9 / 9,8** |
| seul, tarraxinha | 5,9 / 9,1 / 25,2 / 15,5 | 4,7 / 1,8 / **24,7** / 0,4 |
| seul, zouk | 9,9 / 5,7 / 20,5 / 7,8 | 9,1 / 0,7 / **20,4 / 8,1** |
| seul, suave | 6,1 / 3,5 / 0 / 5,8 | 5,6 / 0 / 0,2 / **18,8** |
| seul, kompa | 11,6 / 35 / 22,6 / 0 | **8,8** / 1,1 / **5,9** / 0,2 |

Trois causes :

1. Le verrou du buste (`lockUpperTrunk`, `iso=1`) ne retirait que le roulis et le tangage du bassin : son lacet et son
   balancement propre (`pelvis.position`) passaient au buste, qui est son enfant.
2. Des styles faisaient bouger le buste eux-mêmes : la vague du suave (colonne, buste et tête qui piquent et se
   relèvent, 19°), le cambré qui respire et le buste qui tourne du zouk, le petit roulis du buste du kompa. Le pas de
   base du couple, dansé comme le suave quand le style n'en a pas (kizomba, semba), portait cette vague : d'où les 16 à
   17° de tangage du pas de base en couple.
3. Le kompa et le « 1 2 » de la kizomba et du semba : par vote (23 et 24 novembre), le buste suit la moitié du
   balancement du bassin et 35 % de son pivot.

## La taille absorbe (`isolateWaist`, `src/pose.ts`)

Le bassin garde tout son mouvement. Le haut du tronc est posé comme le style le pose sur un bassin immobile : droit,
penché vers l'avant de ce que veut le style, face au cap de la racine (celui de la figure), au-dessus du bassin au repos.
La colonne (`spine`, dont le pied est juste sous le nombril) se plie depuis son pied pour que le haut du buste reste
où il serait ; le buste se redresse d'autant. La colonne garde sa longueur, le buste sa hauteur au-dessus du pied de
la colonne.

- Ce que la taille reprend : le roulis, le tangage et le lacet du bassin (par quaternions, exactement) ; son
  balancement propre (`pelvis.position`, où le mode jeu met aussi la part du style et du ginga gardée dans les
  figures) ; le balancement du style porté par la racine hors des figures (de côté : `root.position.x` après le style ;
  d'avant en arrière : `swayFore`, déclaré par la hanche assise du kompa, du semba et du « 1 2 »).
- Ce qui reste, ajouté après : les tours du buste (contraposition vers le partenaire, quart de tour, ida e volta seul,
  sorties), la posture (`posture.lean`), l'appui vers le partenaire (`leanTowards`, plexus), le cadre des bras, le
  haut du corps anatomique (`haut=1`) qui suit le squelette. Le buste tourne autour de la verticale puis se penche là
  où il fait face (angles lus dans l'ordre YXZ) : sinon un buste penché qui tourne pour guider roule.
- Les vagues des styles s'arrêtent (`wave`, `src/styles.ts`) : suave, zouk (le cambré tient à mi-chemin, sans suivre
  l'amplitude que le ginga module dans les figures), roulis du buste du kompa. Le kompa et le « 1 2 » ne suivent plus
  le pivot ni le balancement de leur bassin.
- Mode jeu : le pas de base, dansé comme le suave, tient le buste comme le style choisi (sa posture `lean` et la
  hauteur du buste de son `apply`, option `trunkStyle`) : le buste ne bascule plus à chaque début et fin de figure
  (4,6° entre le pas de base et les figures de la kizomba et du semba).
- Ida e volta en couple : les hanches tournent jusqu'à 9° d'un côté pendant que le buste fait face au partenaire, à
  13° de l'axe en quinconce ; le buste isolé peut s'écarter de 22° des hanches (`IDA_FACING`) au lieu de 17°
  (`PLEXUS.facing`, gardé ailleurs : les sorties en dépendent, #220).
- L'appui vers le partenaire lit l'inclinaison du tronc depuis le pied de la colonne dépliée (`trunkFoot`) et non plus
  depuis le bassin, qui se balance sous le buste.
- Hors de la règle : les exercices d'isolation (#206) posent leur tronc eux-mêmes.

## Après (même mesure)

| où | haut du buste : côté / roulis / lacet / tangage |
| --- | --- |
| couple, pas de base, ida e volta, marches, six styles, deux danseurs | 0 cm / 0° / 0° / 0° (0,22° au plus, jonctions comprises) |
| couple, quart de tour | rotation du quart gardée ; roulis 0°, tangage 1,7° (3,7 et 9,3 avant) |
| couple, sorties | le guideur tourne pour guider (lacet gardé, #220) ; roulis 0,6 à 1,3°, tangage 1,6 à 2,4° (2,9 à 3,9 et 11 à 13 avant) |
| seul, six styles | 0 cm / 0° / 0° / 0° ; le « 1 2 » de la kizomba et du semba change de place (28 cm, son déplacement) |

Le bassin n'a pas changé (mêmes valeurs qu'avant, colonnes bassin). Sous la taille rien ne bouge : racine, bassin,
jambes, pieds, appuis et genoux des sorties historiques sont identiques au bit près (`test_sortie_garcon`).

Ce que coûte la taille, seul, au plus fort (angle entre la colonne et le bassin, avant → après) : kizomba 22 → 28°,
semba 27 → 36°, kompa 32 → 44° (dont ses 16° de penché en avant et ±17° de roulis du bassin), tarraxinha 8 → 14°,
suave 7 → 9°, zouk 5 → 10°. La colonne gardant sa longueur, le buste descend un peu quand la taille plie le plus : il
monte et descend de 2,4 à 3 cm au lieu de 1,5 à 2,4 (mesure `buste.hauteur` de `scripts/tracer_hanches.mjs`). Vu de
profil, le buste reste à l'aplomb des genoux (R33) : kompa 4,9 cm derrière leur milieu (6,2 avant), même inclinaison.

## Écart avec les votes : `?buste=elu`

La règle tire contre deux votes : le kompa du 23 novembre (`assisBuste` : le buste va de côté avec le bassin à moitié,
suit 35 % de son pivot, droit) et le « 1 2 » du 24 (mêmes valeurs). Par défaut le buste est isolé partout ;
`?buste=elu` montre le tronc d'avant ce chantier, tel qu'il a été voté pour le kompa et le « 1 2 » (et partout ailleurs
tel qu'il était). Proposition : le buste isolé. Films à faire élire (procédure #148) : kompa seul, `?style=kompa` et
`?style=kompa&buste=elu` ; « 1 2 » de la kizomba, `?style=kizomba` et `?style=kizomba&buste=elu` ; mode jeu et vitrine
(`?guidage=1`, `?vitrine=1`, qui lisent aussi `buste`), pas de base et ida e volta, avec et sans `buste=elu`. Le
mesureur de hanches suit le même réglage (`BUSTE=elu`).

## Gardes

- `scripts/test_isolation_buste.mjs` (dans `npm test`) : seul, six styles, le haut du buste ne roule, ne pique ni ne
  tourne (moins de 0,3°), ne part ni de côté ni en avant (moins de 0,3 cm ; sauf le déplacement du « 1 2 ») et le
  bassin garde son mouvement ; en couple, mode jeu, six styles, pas de base et chaque figure sauf le quart et les
  sorties, deux danseurs, jonctions comprises : moins de 0,3° et 0,3 cm ; `?buste=elu` garde le kompa voté.
- `test_oracle_final` : l'oracle indépendant tourne avec les deux troncs ; tronc isolé, le lacet du buste sur la racine
  est le lacet nominal de l'oracle et son lacet dans le monde la somme nominale (le bassin n'y arrive plus). Les
  mutations du buste et du monde sont toujours rejetées (tronc d'avant).
- `test_sortie_garcon` : poses historiques avec le tronc d'avant ; tronc isolé, mêmes jambes.
- `test_ginga_huit` : ce que les votes du kompa et du semba ont vu (le buste qui suit) se mesure avec le tronc d'avant ;
  isolé, ce buste reste en place.
- `test_plexus` (« danseurs, pas lutteurs », 20 novembre) : l'inclinaison du tronc se lit depuis le pied de la colonne
  dépliée (4,8° au plus). Les 18° bornent maintenant la contraposition, le buste contre la direction de la figure (17,6°
  au plus ; 23° dans l'ida e volta, où le buste fait face au partenaire pendant que les hanches tournent) : avant, le
  buste suivait les hanches et s'écartait jusqu'à 24,7° de la direction de la figure (tarraxinha, zouk). Contre le
  bassin, qui tourne sous lui, le buste va jusqu'à 24,4° (borné à 25°).
- `test_guidage` : le saut du squelette aux jonctions sur un millionième de temps passe de 0,31 à 0,41 mm (tête, zouk,
  sortie garçon puis quart de tour ; l'appui vers le partenaire s'applique après le résidu du tronc) ; borne 0,45 mm.
