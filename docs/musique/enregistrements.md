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
| kizomba | `public/musique/kizomba.mp3` | 102.00 bpm | 96 temps | music_v2_5 | 2026-11-21 |

Prompts :

- **kizomba** : « Plan de composition, variante C (Fusion kizomba et semba). Styles : Angolan kizomba and semba fusion, Luanda live band, warm 1990s studio recording, 102 BPM, strictly steady tempo, relaxed but danceable, sensual, organic, soft kick drum on beats one and three, never on every beat, cross-stick rimshot in a three-three-two pattern, dikanza scraper in sixteenth notes, congas, semba-style interlocking guitars with a clean melodic lead guitar, accordion phrases, deep warm round bass guitar, subtle keyboard pad in the background, minor key, acoustic instruments in front, warm analog sound, instrumental. À éviter : techno, house, EDM, trance, club dance music, four-on-the-floor kick drum, kick drum on every beat, hard punchy electronic kick, sidechain compression, synth lead, aggressive synthesizers, vocals, lyrics, tempo changes, breakdown, drum fill pauses. Consigne : [Groove] {the full band plays the steady groove from the very first beat, no intro, no breakdown, no pauses, clear pulse for dancers} »
<!-- /pistes -->

La piste kizomba (variante C, fusion kizomba et semba) a été validée à l'écoute par le propriétaire
le 21 novembre 2026.

## Prises refusées ou en échec

- **Kizomba, prise 1** (21 novembre 2026, prompt du propriétaire mot pour mot) : refusée à l'écoute —
  « ça ressemble plus à de la techno qu'à de la kizomba semba angolaise ». Mesure : grosse caisse
  d'égale force sur les quatre temps. Retirée de la branche ; analyse dans la
  [spec](../spec-musique-elevenlabs.md).

- **Kizomba, variante C, première prise complète** (21 novembre 2026) : l'API a rendu un fichier
  silencieux pour un plan en un seul bloc de 62 s. Échec de génération, pas une question de goût ;
  les prises complètes sont depuis demandées en sections de 32 temps.

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
| `--essais kizomba` | extraits de 15 s de chaque variante du style, écrits hors dépôt dans `essais/musique/` |
| `--variante kizomba=C` | avec `--styles kizomba` : prise complète à partir de la variante choisie à l'oreille |
| `--decaler kizomba=4` | décale le temps 1 de la boucle de 4 temps (validation à l'oreille) |
| `--temps kizomba=32` | impose la longueur de la boucle, multiple de 8 temps (ne garder qu'une section) |

La mesure demande `ffmpeg`. Une piste dont le tempo est instable est signalée : elle est à refaire ou
à valider à l'oreille.
