# Pistes enregistrées (générées par IA)

Fil d'Ariane : [docs](../) › [musique](README.md) › **enregistrements** · spec : [musique ElevenLabs (#142)](../spec-musique-elevenlabs.md)

Les boucles jouées par le bouton « Son » sont **générées par IA** avec Eleven Music (ElevenLabs), à
partir des prompts versionnés dans `scripts/musique_prompts.mjs`. Ce ne sont ni des œuvres existantes
ni des enregistrements de musiciens. Les grilles sourcées de ce dossier restent la référence
documentaire des rythmes ; elles alimentent la synthèse, qui sert de repli.

## Pistes publiées

Aucune piste n'est publiée pour l'instant : la génération attend la clé ElevenLabs et l'accord du
propriétaire (voir la spec, « Points ouverts »). Le registre `src/music/recordings.data.ts` est vide.

Quand une piste est publiée, le script de génération ajoute ici une ligne : style, fichier, tempo
mesuré, longueur de la boucle, modèle, date et prompt.

## Refaire une piste

```bash
node scripts/generer_musique.mjs --plan
```

La commande affiche les prompts, les durées et le coût estimé, sans appel réseau. La génération lit
la clé dans la variable d'environnement `ELEVENLABS_API_KEY`, qui ne doit jamais être écrite dans le
dépôt, dans un journal ni dans une URL.
