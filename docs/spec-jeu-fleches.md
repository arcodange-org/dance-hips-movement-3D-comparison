# Spec #89 — mode jeu : flèches directionnelles

[Accueil](../README.md) · [Mode guidage](spec-mode-guidage-poc.md) · [Ida en paire](spec-ida-paire.md) ·
[Règles du propriétaire](regles-proprietaire.md) (R22, R24)

## Demande du propriétaire (20 novembre 2026)

- « Gauche ou droite + figure compatible = figure adaptée (Ida e volta + droite = ida e volta jambe
  droite (par défaut jambe gauche) ; ida e volta + arrière : on commence en arrière ; ida e volta +
  arrière + droite : on commence en arrière avec la jambe droite). »
- « Haut = avancer (PG puis PD) ; bas = reculer (PG puis PD) (la règle absolue est de bouger la jambe où
  le poids n'est pas transféré : important quand on avance ou recule sans être en position
  neutre/initiale). »
- « Haut + haut successif rapidement (double clic) : PG + PD en 1 temps + marka 1 temps (le marka permet
  de poser le pied gauche tout en gardant le poids à droite pour pouvoir repartir pied gauche). »

## Ce que le joueur fait

| Touches | Ce que le leader guide | Temps |
|---|---|---|
| ↑ | **Avancer** : PG puis PD, le suiveur recule (PD puis PG) | 2 |
| ↓ | **Reculer** : PG puis PD en arrière, le suiveur avance | 2 |
| ↑ ↑ (deux appuis en moins d'un demi-temps) | **Double** : PG + PD en 1 temps, puis marka du PG 1 temps (poids gardé à droite) | 2 |
| touche de l'ida (Z/W) | Ida e volta jambe gauche, en avant d'abord (inchangé) | 8 |
| → maintenue + ida | Ida e volta **jambe droite** | 8 |
| ↓ maintenue + ida | Ida e volta **en arrière d'abord** (le leader recule, le suiveur avance) | 8 |
| ↓ et → maintenues + ida | Ida e volta en arrière d'abord, jambe droite | 8 |

Les flèches maintenues modifient la figure guidée au moment de l'appui ; seules les figures compatibles
(l'ida e volta) ont des variantes. Une flèche seule (sans touche de figure) guide la marche.

Depuis #140 ([spec](spec-jeu-file-auto.md)), chaque appui est une commande de la file. Le second ↑ ne
transforme la marche en double, et la touche de l'ida ne remplace le ↓ qui la précède, que si cette
première commande attend encore dans la file. Une marche déjà commencée reste une marche : l'appui
suivant est une commande à part.

## Modèle

- **Toujours par le quinconce neutre** (architecture du mode jeu, #69) : chaque segment commence et
  finit au neutre. La marche ferme donc le second pas à côté du premier : PG en avant d'un pas, puis PD
  en avant d'un pas jusqu'au neutre translaté. Le couple avance (ou recule) d'un pas, comme un bloc.
  *Hypothèse à valider* : le propriétaire parle d'avancer « sans être en position neutre/initiale » ;
  des pas qui se croisent (marche continue sans fermer) demandent de suivre le pied porteur d'un segment
  à l'autre, ce qui est un chantier à part (voir « Hors périmètre »).
- **Pied libre** (« bouger la jambe où le poids n'est pas transféré ») : au neutre, le pas de base du mode
  jeu est entre deux appuis aux frontières ; la marche part du PG, comme l'ida e volta. Après la marche,
  le poids est sur le PD (second pas) ; après le double, sur le PD aussi (la marka du PG ne prend pas le
  poids), ce qui laisse le PG libre pour repartir.
- **Marche avant** (leader) : PG en avant, posé sur le 1 ; PD en avant, posé sur le 2. Le suiveur fait
  le pas symétrique (pied opposé, en arrière, même couloir, même longueur : R22). Le pied qui recule
  libère la place sans partir avant le leader (R24, #88) : les deux pieds d'une paire partent ensemble,
  celui du suiveur se pose plus tôt. Le bassin suit l'appui ; le couple avance d'un bloc.
- **Marche arrière** : le leader recule (son pied part le premier), le suiveur avance et suit.
- **Double** : PG puis PD en un temps (demi-temps chacun), puis marka : le PG du leader touche le sol à
  côté du PD sans poids et revient, le poids reste à droite. Le suiveur fait le miroir (PD, PG, marka du
  PD).
- **Pas** : celui de l'ida e volta en paire (`IDA_PAIR.step`, 18 cm, longueur du pied environ).
- **Ida e volta jambe droite** : le même cycle de 8 temps commencé au temps 4 (pas du PD d'abord) ; le
  neutre est retrouvé aux temps 0, 4 et 8, donc la variante est continue et a les mêmes poses.
- **Ida e volta en arrière d'abord** : à l'aller le leader recule, le suiveur avance ; au retour l'inverse.
  Le pied qui recule part le premier (leader à l'aller : il est en avance, permis).
- **Styles** : la marche est proposée dans tous les styles, y compris kompa, tarraxinha et zouk (« le
  konpa ne propose rien à part avancer et reculer »). Le pas de base reste en suave sauf dans ces trois
  styles (#85).

## Tests

- `scripts/test_marche_paire.mjs` : directions (leader en avant, suiveur en arrière), même longueur,
  pied du suiveur jamais parti avant celui du leader, appuis posés sur les temps, neutre translaté à la
  fin, pied porteur immobile, poses GLB (sommets au-dessus du sol), aucun croisement d'os des jambes
  (quinconce, styles proposés, amplitudes 0,5 à 2).
- `scripts/test_ida_paire.mjs` : variantes jambe droite (cycle décalé de 4 temps) et en arrière d'abord
  (directions inversées, mêmes garanties).
- `scripts/test_guidage.mjs` : touches et flèches → figures, double appui, continuité du squelette à toutes
  les frontières avec les nouvelles figures.

## Démonstration

`?mode=pair&guidage=1&demo=fleches` : avancer, double et marka, reculer, puis ida e volta en arrière
d'abord, jambe droite (vue du guideur, avec les muscles) : [GIF](gifs/jeu-fleches.gif).

## Hors périmètre

- Marche continue sans fermer les pas (le pied porteur passe d'un segment à l'autre).
- Flèches gauche et droite seules (déplacement latéral) : non demandées.
