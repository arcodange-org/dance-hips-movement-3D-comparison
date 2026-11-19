# Sortie fille en paire

[Accueil](../README.md) · [Description du propriétaire](notes-sortie-fille.md) · [Issue #27](https://github.com/arcodange-org/dance-hips-movement-3D-comparison/issues/27)

| Action | Leader | Suiveur | Appuis à l'arrivée |
| --- | --- | --- | --- |
| Départ | G disponible | D disponible | D / G |
| 1 | Avance G | Recule D | G / D |
| 2 | D suit un crochet vers sa droite, rejoint le niveau longitudinal de G. Variante : D recule | Décale G à gauche pour ouvrir le passage de D. Au crochet : latéral. Si D leader recule : avance G en diagonale gauche | D / G |
| 3 | Recule G | Avance D en diagonale directe, au même niveau que le D du leader et à sa droite. Rapprochement des flancs de cuisse D/D | G / D |
| 4 | Recule D pour dégager le passage | Croise G devant D pour retrouver la ligne | D / G |
| 5 | Marka G | Ramène D en marka | D / G |

Dans le repère local du GLB, +x est la gauche et +z l'avant. Le suiveur fait face au leader
avec un lacet de π. Au crochet, D leader prend un couloir latéral puis progresse jusqu'au z de G.
Depuis sa position de départ, D se décale à droite de 17 cm, soit une demi-largeur de bassin.
Le suiveur ouvre un passage suffisant pour que son D avance en ligne droite oblique au troisième pas, côte à côte avec le D du leader. Dans la variante recul, son G
avance aussi de 13 cm. Au quatrième pas, le D du leader recule avant que le G du suiveur
s'engage. Le suiveur avance d'abord dans son couloir extérieur, puis traverse devant son D
porteur. Ce passage demande plus de dégagement en variante recul, où son D s'est posé plus en avant.

Le leader amorce la contraposition du thorax au premier temps. La rotation du thorax du suiveur
répond progressivement à cette ouverture du cadre. Le bassin et les pieds suivent leurs propres
courbes d'appui. Au marka, le bassin du suiveur termine sa rentrée au-dessus de sa base
d'appui. Les dimensions sont calibrées pour illustrer la figure avec ces squelettes.

Au troisième arrêt, les chevilles droites sont au même niveau longitudinal. Le droit du
suiveur reste à droite du droit du leader. Le rapprochement des flancs se mesure avec deux
enveloppes de rayon 8,5 cm le long des segments centraux des fémurs. La géométrie osseuse
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
sur 2 412 poses de couple, avec six styles et trois amplitudes, y compris aux transitions. Les
7 272 poses individuelles contrôlent également la longueur des os, les semelles, les
cibles IK et les appuis, avec et sans isolation basse selon le contrôle.
Les 792 empreintes de référence G/GF proviennent de la base moteur `fa551c3`.
