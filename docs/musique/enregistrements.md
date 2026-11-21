# Pistes enregistrées (générées par IA)

Fil d'Ariane : [docs](../) › [musique](README.md) › **enregistrements** · spec : [musique ElevenLabs (#142)](../spec-musique-elevenlabs.md)

Les boucles jouées par le bouton « Son » sont **générées par IA** avec Eleven Music (ElevenLabs), à
partir des prompts versionnés dans `scripts/musique_prompts.mjs`. Ce ne sont ni des œuvres existantes
ni des enregistrements de musiciens. Les grilles sourcées de ce dossier restent la référence
documentaire des rythmes ; elles alimentent la synthèse, qui sert de repli.

## Pistes publiées

Ce tableau est réécrit par le script de génération à partir du registre
`src/music/recordings.data.ts` (style, fichier, tempo mesuré, longueur de la boucle, modèle, date,
prompt). Un style absent du tableau garde la synthèse. Chaque nouvelle piste demande l'accord du
propriétaire : une prise coûte des crédits (voir la spec, « Points ouverts »).

<!-- pistes -->
| Style | Fichier | Tempo mesuré | Boucle | Modèle | Date |
|---|---|---|---|---|---|
| kizomba | `public/musique/kizomba.mp3` | 101.99 bpm | 96 temps | music_v2_5 | 2026-11-21 |

Prompts :

- **kizomba** : « Authentic Angolan Kizomba and Semba fusion instrumental, 102 BPM, strictly quantized steady tempo, prominent syncopated kick drum, crisp rimshot snare, dikanza scraper percussion, deep warm round bassline, clean melodic acoustic guitar riffs, subtle atmospheric synth pad, clear 1-2-3 rhythmic pulse, no tempo changes, no breakdown, dry and punchy studio mix, high transient clarity, instrumental only, no vocals »
<!-- /pistes -->

## Refaire une piste

```bash
node scripts/generer_musique.mjs --plan
```

La commande affiche les prompts, les durées et le coût estimé, sans appel réseau. La génération lit
la clé dans la variable d'environnement `ELEVENLABS_API_KEY`, qui ne doit jamais être écrite dans le
dépôt, dans un journal ni dans une URL. Pour la lire d'un fichier d'environnement sans l'afficher :

```bash
node --env-file=/chemin/vers/.env.local scripts/generer_musique.mjs --abonnement
```

| Commande | Effet |
|---|---|
| `--plan` | prompts, durées, coût estimé ; aucun réseau |
| `--abonnement` | offre et crédits restants ; appel gratuit |
| `--styles kizomba,semba` | génère les pistes manquantes de la liste, puis les mesure |
| `--refaire --styles kizomba` | régénère une piste existante (une prise coûte des crédits) |
| `--analyse` | re-mesure les fichiers présents ; aucun réseau |
| `--decaler kizomba=4` | décale le temps 1 de la boucle de 4 temps (validation à l'oreille) |
| `--temps kizomba=32` | impose la longueur de la boucle, multiple de 8 temps (ne garder qu'une section) |

La mesure demande `ffmpeg`. Une piste dont le tempo est instable est signalée : elle est à refaire ou
à valider à l'oreille.
