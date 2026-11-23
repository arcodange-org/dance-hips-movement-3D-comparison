# Obliquité du bassin (roulis)

[Atlas](../../README.md) · [Manifeste](../../manifest.json) · [Spécification](../../../spec-atlas-anatomique.md) · [Recherche biomécanique](../../../recherche-biomecanique/README.md)

> Page générée par `scripts/capture_atlas.mjs` à partir de [`meta.json`](meta.json). Ne pas la modifier à la main.

*Pelvic obliquity (roll)* · nœud `Pelvis`, axe local `z` · priorité 1 · 9 images de −10° à +10°, 5 vues.

![Planche : Obliquité du bassin (roulis)](planche.png)

## Lecture

- Convention de signe : angle positif : la hanche gauche monte, l'autre descend (rotation directe autour de l'axe monde).
- Thorax : il garde l'orientation de la pose neutre sur toute la course (rotation maximale 0,0°, tous axes confondus).
- Provenance : Généré paramétriquement sur squelette réel : ni capture de mouvement, ni photo de modèle, ni relecture par un professeur d'anatomie.
- Niveau de preuve : documenté pour la marche : 6 à 9° crête à crête, soit ±3 à ±4,5° (docs/recherche-biomecanique/bassin-et-dissociation.md, tableau 1) ; proposition au-delà, jusqu'à ±10°.

## Mesures sur le squelette

Mesures prises sur le GLB réel posé par le moteur de l'application, hors navigateur
(angle signé du quaternion monde du nœud Pelvis, relatif à la pose neutre (angle 0), autour de l'axe monde). ROM mesurée : −10° à +10°.

| Image | Angle commandé | Angle mesuré | Hanche gauche − droite | Genou droit | Genou gauche | Thorax | Hauteur du bassin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | −10° | −10° | −28,4 mm | 6,9° | 31,4° | 0,0° | 867,3 mm |
| 2 | −7,5° | −7,5° | −21,1 mm | 12,8° | 29,4° | 0,0° | 867,3 mm |
| 3 | −5° | −5° | −13,8 mm | 16,7° | 27,4° | 0,0° | 867,3 mm |
| 4 | −2,5° | −2,5° | −6,5 mm | 19,9° | 25,1° | 0,0° | 867,3 mm |
| 5 | 0° | 0° | 0,9 mm | 22,7° | 22,7° | 0,0° | 867,3 mm |
| 6 | +2,5° | +2,5° | 8,2 mm | 25,1° | 20,0° | 0,0° | 867,3 mm |
| 7 | +5° | +5° | 15,5 mm | 27,4° | 16,8° | 0,0° | 867,3 mm |
| 8 | +7,5° | +7,5° | 22,8 mm | 29,4° | 12,9° | 0,0° | 867,3 mm |
| 9 | +10° | +10° | 30,1 mm | 31,4° | 7,2° | 0,0° | 867,3 mm |

Hanche : écart de hauteur des centres articulaires. Genou : flexion, 0° = jambe tendue. Thorax : inclinaison par rapport à la verticale.

## Règle de pose et variante

- Règle de la planche : **genoux chevauchés** (B). Bassin tenu à sa hauteur la plus basse : les deux genoux fléchissent ensemble au centre.
- Variante : genoux en relais (A). Bassin le plus haut que les jambes permettent : un genou fléchit après l'autre. Dans l'application : `?atlas=bassin-obliquite&vue=face&frame=4&frames=9&muscles=1&variante=relais`.
- Pour la danse : la même règle, élue par le propriétaire.
- Choix du propriétaire : [élection](../../../../docs/elections/obliquite-genoux.md).

![Obliquité du bassin : le genou opposé attend-il son tour ?](../../../../docs/gifs/election-obliquite-genoux.gif)

## Vues animées

| Face | Trois-quarts avant gauche | Profil gauche | Trois-quarts arrière gauche | Dos |
| --- | --- | --- | --- | --- |
| ![face](face.gif) | ![trois-quarts avant gauche](troisQuarts.gif) | ![profil gauche](profil.gif) | ![trois-quarts arrière gauche](troisQuartsDos.gif) | ![dos](dos.gif) |

Images fixes : [face](face-04.png), [trois-quarts avant gauche](troisQuarts-04.png), [profil gauche](profil-04.png), [trois-quarts arrière gauche](troisQuartsDos-04.png), [dos](dos-04.png) (une par image de la séquence, `<vue>-<nn>.png`).
Vue en direct dans l'application : `?atlas=bassin-obliquite&vue=face&frame=4&frames=9&muscles=1`.

## Limites

- Illustratif : aucune validation médicale ni chorégraphique.
- Pose neutre du moteur : pieds à l'écartement et à l'ouverture natifs du squelette, genoux fléchis d'au moins 0,12 rad par l'IK (jambe jamais verrouillée).
- Bassin en chaîne fermée, pieds plantés : la hanche qui descend fait fléchir son genou. D'autres stratégies (demi-pointe, translation du bassin) ne sont pas montrées.
- Hauteur du bassin : tenue constante, à sa hauteur la plus basse de l'amplitude (colonne « Hauteur du bassin »). Les deux genoux fléchissent ensemble au passage par le centre : aucune jambe n'y est presque tendue. C'est un choix de modèle, élu par le propriétaire pour la danse ; la variante « genoux en relais », où le bassin remonte au centre, est montrée dans la section « Règle de pose et variante ».
- Tête et bras : volumes stylisés, pas un maillage anatomique ; bras en cadre de danse. Tronc : montré par ses muscles (BodyParts3D), sans les volumes gris du rig. Le haut du tronc compense le bassin (iso=1).

## Licences

- Squelette et muscles : BodyParts3D v4.0, © DBCLS, CC BY-SA 2.1 Japan (attribution obligatoire).
- Planche, images et mesures générées : CC BY-SA 4.0.
- Format inspiré d'anatobase.com (planches multi-angles + fiches muscle par muscle) sans copier ni marque ni contenu.

## Régénérer

```bash
npm run build && node scripts/capture_atlas.mjs --mouvement bassin-obliquite
```
