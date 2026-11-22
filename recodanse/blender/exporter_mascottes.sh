#!/bin/zsh
# Exporte les pièces des mascottes (tête, pieds chaussés) depuis les fichiers de personnage de ReCoDanse.
#   recodanse/blender/exporter_mascottes.sh <mascottes.json> <dossier de sortie> [nom…]
#   PIECES=piedL,piedR … : ne refaire que ces pièces.
# Lecture seule : l'empreinte de chaque .blend est vérifiée avant et après. Priorité basse (nice 19).
set -u
ici=${0:A:h}
config=${1:?mascottes.json} ; sortie=${2:?dossier de sortie} ; shift 2
noms=(${@:-corinne remi})
blender=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
mkdir -p "$sortie"
for nom in $noms; do
  fichier=$(python3 -c "import json,os,sys; print(os.path.expanduser(json.load(open(sys.argv[1]))[sys.argv[2]]['fichier']))" "$config" "$nom")
  avant=$(shasum -a 256 "$fichier" | cut -d' ' -f1)
  nice -n 19 "$blender" -b "$fichier" --python "$ici/exporter_mascottes.py" -- "$config" "$nom" "$sortie" ${PIECES:+"$PIECES"} > "$sortie/$nom-export.log" 2>&1
  code=$?
  apres=$(shasum -a 256 "$fichier" | cut -d' ' -f1)
  echo "$nom : code $code, fichier d'origine intact : $([ "$avant" = "$apres" ] && echo oui || echo NON)"
  grep "^EXPORT" "$sortie/$nom-export.log"
done
