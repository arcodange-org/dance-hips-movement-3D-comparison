// Le montage (#155) : chaque chapitre reçoit son habillage, ses voix et sa musique ; les chapitres sont
// mis bout à bout et le son est ramené à −16 LUFS.
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FFMPEG, dossier, ecrireJson, empreinte, ffmpeg, lireJson } from "./outils.mjs";
import { RYTHME } from "./calendrier.mjs";
import { COMPARAISON } from "./scenario.mjs";

const FOND = "0x0b1220";
const n3 = x => (Math.round(x * 1000) / 1000).toString();

/** Assemble les douze plans de la comparaison (une rangée de six, puis une grille de six) en un clip. */
export function assemblerComparaison({ ordre, fichiers, largeur, hauteur, ips, sortie }) {
  const entrees = [], filtres = [];
  ordre.forEach(s => entrees.push("-i", fichiers[`comparaison-rangee-${s}`]));
  ordre.forEach(s => entrees.push("-i", fichiers[`comparaison-grille-${s}`]));
  const n = ordre.length, { grille } = COMPARAISON;
  filtres.push(`${ordre.map((_, k) => `[${k}:v]`).join("")}hstack=inputs=${n},pad=${largeur}:${hauteur}:0:${COMPARAISON.haut}:color=${FOND},setsar=1[a]`);
  const disposition = ordre.map((_, k) => `${(k % grille.colonnes) * grille.largeur}_${Math.floor(k / grille.colonnes) * grille.hauteur}`).join("|");
  filtres.push(`${ordre.map((_, k) => `[${n + k}:v]`).join("")}xstack=inputs=${n}:layout=${disposition},pad=${largeur}:${hauteur}:0:${COMPARAISON.haut}:color=${FOND},setsar=1[b]`);
  filtres.push(`[a][b]concat=n=2:v=1:a=0,format=yuv420p[v]`);
  ffmpeg([...entrees, "-filter_complex", filtres.join(";"), "-map", "[v]", "-r", String(ips), "-c:v", "libx264", "-preset", "medium", "-crf", "14", sortie]);
  return sortie;
}

/** Prépare la musique d'un chapitre : part du premier temps, et boucle si le chapitre dépasse la piste. */
export function preparerMusique(piste, dureeChapitre, style) {
  const utile = piste.duree - piste.premierTemps;
  if (dureeChapitre <= utile - 0.2 || !piste.boucle) return { fichier: piste.fichier, depuis: piste.premierTemps, gainDb: piste.gainDb };
  // La boucle (un nombre entier de phrases) est rejouée, puis la piste va jusqu'à sa fin.
  const tours = Math.ceil((dureeChapitre - utile) / piste.boucle);
  const sortie = join(dossier("musique"), `${style}-boucle-${tours}.wav`);
  if (!existsSync(sortie)) {
    const f = 0.03, entrees = [], filtres = [];
    for (let k = 0; k <= tours; k++) entrees.push("-i", piste.fichier);
    for (let k = 0; k < tours; k++) filtres.push(`[${k}:a]atrim=start=${piste.premierTemps}:end=${n3(piste.premierTemps + piste.boucle + f)},asetpts=PTS-STARTPTS[s${k}]`);
    filtres.push(`[${tours}:a]atrim=start=${piste.premierTemps}:end=${n3(piste.duree)},asetpts=PTS-STARTPTS[s${tours}]`);
    let courant = "[s0]";
    for (let k = 1; k <= tours; k++) { filtres.push(`${courant}[s${k}]acrossfade=d=${f}:c1=tri:c2=tri[x${k}]`); courant = `[x${k}]`; }
    ffmpeg([...entrees, "-filter_complex", filtres.join(";"), "-map", courant, "-ar", "48000", "-ac", "2", sortie]);
  }
  return { fichier: sortie, depuis: 0, gainDb: piste.gainDb };
}

/**
 * Monte un chapitre : clip + habillage + voix + musique.
 * @param elements [{type, fichier, debut, fin, fondu, hauteur?}] dans l'ordre de superposition
 * @param voix     [{fichier, debut}]
 * @param musique  {fichier, depuis, gainDb} ou null
 */
export function monterChapitre({ id, clip, cal, elements, voix, musique, largeur, hauteur, ips, refaire = false }) {
  const D = cal.duree, F = RYTHME.fondu;
  const sortie = join(dossier("chapitres"), `${id}.mp4`), fiche = join(dossier("chapitres"), `${id}.json`);
  const cle = empreinte({ clip: lireJson(clip.replace(/\.mp4$/, ".json"))?.cle ?? clip, cal, elements, voix, musique, largeur, hauteur, ips, version: 3 });
  if (!refaire && lireJson(fiche)?.cle === cle && existsSync(sortie)) return { fichier: sortie, neuf: false };

  const entrees = ["-i", clip], filtres = [];
  let courant = "[0:v]", index = 1;
  elements.forEach((e, k) => {
    if (e.type === "generique") {
      // Le générique monte depuis le bas, puis s'arrête quand sa dernière ligne est à l'écran.
      const arret = hauteur - e.hauteur - RYTHME.margeCredits;
      entrees.push("-loop", "1", "-framerate", String(ips), "-t", n3(D - e.debut), "-itsoffset", n3(e.debut), "-i", e.fichier);
      filtres.push(`[${index}:v]format=rgba[o${k}]`);
      filtres.push(`${courant}[o${k}]overlay=x=0:y='max(${arret},${hauteur}-(t-${n3(e.debut)})*${RYTHME.vitesseCredits})':eof_action=pass:enable='gte(t,${n3(e.debut)})'[v${k}]`);
    } else {
      const a = e.debut, b = e.fin, f = Math.min(e.fondu, (b - a) / 2);
      entrees.push("-loop", "1", "-framerate", String(ips), "-t", n3(b - a), "-itsoffset", n3(a), "-i", e.fichier);
      filtres.push(`[${index}:v]format=rgba,fade=t=in:st=${n3(a)}:d=${n3(f)}:alpha=1,fade=t=out:st=${n3(b - f)}:d=${n3(f)}:alpha=1[o${k}]`);
      filtres.push(`${courant}[o${k}]overlay=0:0:eof_action=pass:enable='between(t,${n3(a)},${n3(b)})'[v${k}]`);
    }
    courant = `[v${k}]`; index++;
  });
  filtres.push(`${courant}fade=t=in:st=0:d=${F},fade=t=out:st=${n3(D - F)}:d=${F},format=yuv420p[vout]`);

  // Son : les voix à leur instant ; la musique part du premier temps et s'efface sous la voix.
  const pistesVoix = [];
  voix.forEach((p, k) => {
    entrees.push("-i", p.fichier);
    filtres.push(`[${index}:a]aresample=48000,adelay=${Math.round(p.debut * 1000)}:all=1[p${k}]`);
    pistesVoix.push(`[p${k}]`); index++;
  });
  const silence = `anullsrc=r=48000:cl=stereo,atrim=duration=${n3(D)}[sil]`;
  filtres.push(silence);
  if (pistesVoix.length) filtres.push(`${pistesVoix.join("")}amix=inputs=${pistesVoix.length}:normalize=0:duration=longest,aformat=channel_layouts=stereo,apad,atrim=duration=${n3(D)},asplit=2[vx][cle]`);
  let melange = pistesVoix.length ? "[vx][sil]" : "[sil]", pistes = pistesVoix.length ? 2 : 1;
  if (musique) {
    entrees.push(...(musique.depuis > 0 ? ["-ss", n3(musique.depuis)] : []), "-i", musique.fichier);
    const fin = `afade=t=out:st=${n3(D - 1.0)}:d=1.0`;
    filtres.push(`[${index}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${n3(musique.gainDb - 4)}dB,apad,atrim=duration=${n3(D)},afade=t=in:st=0:d=0.15,${fin}[mus]`);
    if (pistesVoix.length) filtres.push(`[mus][cle]sidechaincompress=threshold=0.02:ratio=5:attack=40:release=650:makeup=1[bas]`);
    melange += pistesVoix.length ? "[bas]" : "[mus]"; pistes++; index++;
  } else if (pistesVoix.length) filtres.push(`[cle]anullsink`);
  filtres.push(`${melange}amix=inputs=${pistes}:normalize=0:duration=first,alimiter=limit=0.89[aout]`);

  // Le graphe est gardé à côté du chapitre, pour le relire en cas d'erreur.
  writeFileSync(join(dossier("chapitres"), `${id}.filtre.txt`), filtres.join(";\n"));
  ffmpeg([...entrees, "-filter_complex", filtres.join(";"), "-map", "[vout]", "-map", "[aout]", "-t", n3(D), "-r", String(ips),
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", sortie]);
  ecrireJson(fiche, { cle });
  return { fichier: sortie, neuf: true };
}

/** Met les chapitres bout à bout et ramène le son au niveau visé (deux passes : mesure, puis gain linéaire). */
export function master(chapitres, sortie, { lufs = -16 } = {}) {
  const liste = join(dossier("chapitres"), "liste.txt");
  writeFileSync(liste, chapitres.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
  const brut = join(dossier("chapitres"), "bout-a-bout.mp4");
  ffmpeg(["-f", "concat", "-safe", "0", "-i", liste, "-c", "copy", brut]);
  const mesure = spawnSync(FFMPEG, ["-hide_banner", "-nostats", "-i", brut, "-af", `loudnorm=I=${lufs}:TP=-1.5:LRA=11:print_format=json`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const debut = mesure.stderr.lastIndexOf("{"), fin = mesure.stderr.indexOf("}", debut);
  if (debut < 0 || fin < 0) throw new Error(`mesure du niveau illisible : ${mesure.stderr.trim().split("\n").slice(-3).join(" | ")}`);
  const m = JSON.parse(mesure.stderr.slice(debut, fin + 1));
  const filtre = `loudnorm=I=${lufs}:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  ffmpeg(["-i", brut, "-c:v", "copy", "-af", filtre, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", sortie]);
  return { fichier: sortie, avant: Number(m.input_i) };
}
