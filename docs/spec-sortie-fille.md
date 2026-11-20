# Sortie fille en paire

[Accueil](../README.md) · [Description du propriétaire](notes-sortie-fille.md) · [Issue #27](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/27)

| Action | Leader | Suiveur | Appuis à l'arrivée |
| --- | --- | --- | --- |
| Départ | G disponible | D disponible | D / G |
| 1 | Avance G | Recule D | G / D |
| 2 | D suit un crochet vers sa droite, rejoint le niveau longitudinal de G. Variante : D recule | Décale G à gauche pour ouvrir le passage de D. Au crochet : latéral. Si D leader recule : avance G en diagonale gauche | D / G |
| 3 | Recule G | Avance D en diagonale directe, au même niveau que le D du leader et à sa droite. Contact du haut des cuisses D/D | G / D |
| 4 | Recule D pour dégager le passage | Croise G devant D pour retrouver la ligne | D / G |
| 5 | Marka G | Ramène D en marka | D / G |

Dans le repère local du GLB, +x est la gauche et +z l'avant. Le suiveur fait face au leader
avec un lacet de π. Au crochet, D leader prend un couloir latéral puis progresse jusqu'au z de G.
Depuis sa position de départ, D se décale à droite de 17 cm, soit une demi-largeur de bassin.
Le recul du D du suiveur au premier pas est de 55 cm en crochet et de 42 cm en recul, avec
un biais de 7 cm vers sa gauche. Au deuxième pas, son G se décale de 55 cm en crochet et de
34 cm en recul. Dans la variante recul, ce G avance aussi de 13 cm. Ces amplitudes ouvrent le
passage du D, dont la cheville suit une diagonale rectiligne au troisième pas. La pointe du pied
libre pivote jusqu’à 55° vers la diagonale en vol pour dégager la semelle opposée puis revient
parallèle à l'arrivée. Au quatrième pas, le D du leader recule avant que le G du suiveur s'engage. Le D du leader revient légèrement vers sa gauche pendant le recul pour libérer le
croisé des genoux. Le suiveur avance d’abord dans son couloir extérieur, puis traverse devant
son D porteur. Au cinquième pas, les pieds libres reviennent dans la largeur de départ.

Le leader amorce la contraposition du thorax au premier temps. La rotation du thorax du suiveur
répond progressivement à cette ouverture du cadre. Le bassin et les pieds suivent leurs propres
courbes d'appui. Au marka, le bassin du suiveur revient vers sa base d’appui. Les deux racines
sont à 40 cm l’une de l’autre au départ. Les distances et angles illustrent la figure avec ces squelettes. Les diagonales du troisième pas sont
longues à partir de ce placement fixe (98 cm en crochet et 93 cm en recul). Au deuxième
arrêt, la racine du bassin du suiveur reste à 32 cm ou 23 cm horizontalement de sa cheville
gauche, selon la variante. Les charges affichées décrivent la succession des appuis prescrits.
Leur géométrie seule ne mesure ni le centre de masse ni l’équilibre dynamique. La comparaison
de placements initiaux resserrés face à face et en quinconce est suivie séparément. [Issue #28](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/28).

Au troisième arrêt, les chevilles droites sont au même niveau longitudinal. Le droit du
suiveur reste à droite du droit du leader. L’écart latéral des chevilles est de 28 cm en crochet
et de 22 cm en recul. **Contact du haut des cuisses** (demande du propriétaire du 19 novembre,
#28) : le bassin du suiveur se rapproche de 2 cm en crochet et de 3 cm en recul. En kizomba à
amplitude 1, les enveloppes de rayon 8,5 cm autour des fémurs se touchent (+0,9 mm en crochet,
−0,5 mm en recul) sur le haut des cuisses. Ce contact est complet jusqu'à l'amplitude 1, puis il
revient progressivement à l'arrivée précédente (19,5 et 27,4 mm) à l'amplitude 2. La direction du rapprochement
a une composante x de −0,98 dans le repère du leader pour les deux variantes. La géométrie osseuse
et les pieds font l’objet de contrôles séparés. Le modèle ne simule ni les forces, ni les
surfaces de peau, ni les collisions de bras ou de tissus mous.

En paire, la lecture dure cinq temps et conserve le dernier état d'appui. Les six poses, la
variante crochet/recul, le rejeu, la pause, le partage et l'export utilisent la même horloge.
Le partage utilise `sortieF=1&sortieFilleVariant=hook|back&sortieBeat=0..5`.
Le calage final et le marka sont conservés dans l'export WebM. Les traces de la sortie garçon et du
combiné sont protégées sur la base fa551c3. Les cellules F de l'oracle historique restent
lisibles comme référence à l'ancienne animation et ne servent pas à valider la nouvelle figure.

Les tests vérifient directions, phases du crochet, décalage de hanche, croisé, quatre transferts
puis marka sans transfert, dégagement en cours de trajet, semelles au sol, cibles atteintes et
longueurs constantes. Les os sont vérifiés par triangles transformés. L'interface affiche
les actions des deux partenaires et l'amorce de la sortie par le cadre.

Les empreintes horizontales des pieds sont comparées sur 1 002 poses de couple. Les triangles
du fémur, tibia, péroné et de la rotule sont comparés entre les jambes et les partenaires
sur 2 628 poses de couple, avec six styles et trois amplitudes, y compris aux transitions. Les
7 272 poses individuelles contrôlent également la longueur des os, les semelles, les
cibles IK et les appuis, avec et sans isolation basse selon le contrôle.
Les 792 empreintes de référence G/GF proviennent de la base moteur `fa551c3`.

Les exports de contrôle sur navigateur ont enregistré les deux variantes en kizomba (60 bpm,
amplitude 1), sur environ cinq secondes chacun. La pose et la pause d'origine ont été
restaurées après chaque export. Les GIFs montrent le [crochet](gifs/sortie-fille-crochet.gif)
et le [recul](gifs/sortie-fille-recul.gif).
[Rétrospective M4](retrospective-sortie-fille.md).

## Règle ajoutée le 20 novembre 2026 (#67)

Distance bassin-bassin quasi constante une fois le décalage latéral retiré, et pas de « monter-descendre » permanent : voir [règles du propriétaire](regles-proprietaire.md) (R2, R3). Critère à mesurer sur le GLB pour cette figure.

## Le suiveur ne part jamais avant le leader (#88, 20 novembre 2026)

Avant : départs du leader 0 · 1,14 · 2 · 3 · 4, du suiveur 0 · 1 · 2 · 3,24 · 4. Son G2 « ouvrait le
passage » avant le crochet du leader (`sortieFilleHookLead`), ce qui la mettait en avance. Désormais
son G2 part avec le crochet et se pose plus tôt (`SORTIE_FILLE_SYNC.g2touchdown` = 0,5 du temps au lieu
de 0,68) : il libère la place à temps, en quinconce compris. Son G4 (3,24) reste un léger retard, permis.
