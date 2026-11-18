# .vibe/ — harness du projet (pour toute session Mistral)

Ce dossier décrit **comment adopter et continuer d'améliorer ce projet en continu, et comment y
contribuer agentiquement**, indépendamment de la session qui lit ces fichiers.

- [`HARNESS.md`](HARNESS.md) — **harnais de session** : démarrage, méthode anti-amnésie
  (multi-campaign / cross-session), état, sandbox, secrets.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — **contribuer agentiquement** : cycle phase (spec-first →
  code → Gherkin → captures → PR → ff-merge → CI → site live → checkpoint), rétrospectives M4.
- [`CONVENTIONS.md`](CONVENTIONS.md) — conventions verrouillées (ne pas casser) + référence des
  paramètres d'URL.

Point d'entrée racine : [`../AGENTS.md`](../AGENTS.md). État courant : [`../CONTEXT.md`](../CONTEXT.md).
Tâches : [`../docs/TASKS.md`](../docs/TASKS.md).

> Règle de maintenance : quand le harness évolue (nouveau process, nouvelle commande), mettre à
> jour ces fichiers **dans le même commit** que le changement, et garder `AGENTS.md` racine en
> synchro (voir sa section « Maintenance de ce fichier »).
