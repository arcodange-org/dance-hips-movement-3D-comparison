#!/usr/bin/env node
// #159 — tracé du chemin des hanches dans les trois vues (dessus, face, profil), mesuré sur le GLB.
// Un pas de marche du mode jeu dansé après le même pas (régime établi) : positions des deux articulations
// de hanche et du centre du bassin d'un danseur, dans son propre repère, déplacement de la figure retiré.
// En couple la pose est celle du mode jeu lui-même (`planGuide`, `applyGuidePose`) : la figure est
// commandée cinq fois de suite et la troisième est mesurée, avec ce que le jeu ajoute aux frontières
// (le résidu de bassin de la figure précédente, effacé en un temps).
// Sortie : un GIF (les chemins, un point qui les parcourt) et les surfaces entourées dans chaque vue ;
// `transfert` : le passage d'un côté à l'autre, brusque ou progressif (`soudain`, 1 = un balancier).
// Usage : CHROME_PATH=... node scripts/tracer_hanches.mjs out.gif <ginga> [suiveur|leader] [figure] [style]
//         … out.gif <variante> seul base <style> : le danseur seul, pas de base sur place du style (4 temps) ;
//         pour le kompa, <variante> est un prototype de son « 8 » (`huit`, `huitGrand`, `huitInverse`) ou `aujourdhui`.
//         MESURES=1 n'écrit pas de GIF : seulement les mesures (JSON sur la sortie standard).
import { buildSync } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";

const [out, ginga = "marque", role = "suiveur", kind = "avance", styleKey = "kizomba"] = process.argv.slice(2);
const bundle = new URL("./.tracer-hanches-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'insertion', 'guidage', 'guidagePose', 'placePaire'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname, define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

const STEPS = 32; // samples per beat
const solo = role === "seul";
const follower = !solo && role !== "leader", dz = api.GUIDE_PAIR_DZ, beats = solo ? 4 : api.GUIDE_FIGURES[kind].beats, movement = solo ? "none" : api.GUIDE_FIGURES[kind].movement;
if (solo) api.setKompaProto(ginga);
const f = { ...fixture(api), cache: new Map() };
const rest = { L: f.model.legs.L.rest, R: f.model.legs.R.rest }, stance = (f.model.legs.L.hipX - rest.L.x + rest.R.x - f.model.legs.R.hipX) / 2;
// The game's own session: the figure commanded five times in a row, the third one measured.
const plan = solo ? null : api.planGuide([0, 0.1, 0.2, 0.3, 0.4].map(beat => ({ beat, figure: kind })), api.guideMotions({ rest, stance, placement: 'quinconce', amp: 1 }), 16 + 5 * beats);
const repeats = solo ? [] : plan.segments.filter(s => s.kind === kind);
if (!solo && repeats.length < 4) throw new Error(`${kind}: the game does not dance it several times in a row (${plan.segments.map(s => s.kind).join(' ')})`);
const start = solo ? 0 : repeats[2].start;
const points = { L: [], R: [], C: [], B: [] }, loads = [], knees = { L: [], R: [] };
for (let i = 0; i < beats * STEPS; i++) {
  const beat = i / STEPS;
  if (solo) api.applyPose(f.r, f.model, beat, { styleKey, amp: 1 });
  else {
    const sample = api.sampleGuide(plan, start + beat, ginga), t = api.compose(sample.couple, api.outerOf(follower));
    f.outer.position.set(t.x, 0, t.z); f.outer.rotation.set(0, t.yaw, 0); f.outer.updateMatrixWorld(true);
    api.applyGuidePose(f.r, f.model, sample, { placement: 'quinconce', contraposition: 1, styleKey, amp: 1 }, follower, f.cache);
  }
  f.r.root.updateWorldMatrix(true, true);
  // In pair the figure's travel (root) is removed; alone on the spot the root itself carries the sway.
  const root = solo ? { x: 0, z: 0 } : f.r.root.position, inverse = f.r.root.parent.matrixWorld.clone().invert();
  // Dancer's own frame: x to the dancer's right, y up, z forward; the figure's travel (root) is removed.
  const local = name => { const p = f.r[name].getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse); return [-(p.x - root.x) * 100, p.y * 100, (p.z - root.z) * 100]; };
  points.L.push(local('hipL')); points.R.push(local('hipR')); points.C.push(local('pelvis')); points.B.push(local('chest'));
  loads.push(solo ? (api.STYLES[styleKey].support(beat - 0.5) + 1) / 2 : api.sampleKind(kind, beat, follower, { rest, stance, placement: 'quinconce', amp: 1 }).loadR);
  // Knee flexion (degrees) after the leg solver: 0 = straight.
  for (const side of ['L', 'R']) knees[side].push(Math.abs(f.r['knee' + side].rotation.x) * 180 / Math.PI);
}

// Surface the closed path goes around (cm²), whatever the sense of each lobe: cells of a 0.25 mm grid with
// a nonzero winding number. A path that returns the way it came encloses none; a loop or an « 8 » does.
const around = (pts, a, b) => {
  const xs = pts.map(p => p[a]), ys = pts.map(p => p[b]), x0 = Math.min(...xs), y0 = Math.min(...ys), h = 0.025;
  const ny = Math.ceil((Math.max(...ys) - y0) / h) + 1;
  let cells = 0;
  for (let j = 0; j < ny; j++) {
    const y = y0 + (j + 0.5) * h, crossings = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if ((p[b] <= y) !== (q[b] <= y)) crossings.push([p[a] + (y - p[b]) * (q[a] - p[a]) / (q[b] - p[b]), q[b] > p[b] ? 1 : -1]);
    }
    crossings.sort((u, v) => u[0] - v[0]);
    let winding = 0;
    for (let k = 0; k + 1 < crossings.length; k++) { winding += crossings[k][1]; if (winding !== 0) cells += (crossings[k + 1][0] - crossings[k][0]) / h; }
  }
  return cells * h * h;
};
const range = (pts, a) => Math.max(...pts.map(p => p[a])) - Math.min(...pts.map(p => p[a]));
// Longest time (beats) during which a point moves less than 1 mm per sixteenth of a beat (« arrêt »).
const still = pts => { let longest = 0, run = 0; for (let i = 0; i < 2 * pts.length; i++) { const p = pts[i % pts.length], q = pts[(i + 2) % pts.length]; run = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 0.1 ? run + 1 : 0; longest = Math.max(longest, run); } return Math.min(pts.length, longest) / STEPS; };
const measures = Object.fromEntries(['L', 'R', 'C'].map(k => [k, { largeur: range(points[k], 0), hauteur: range(points[k], 1), profondeur: range(points[k], 2),
  dessus: around(points[k], 0, 2), face: around(points[k], 0, 1), profil: around(points[k], 2, 1), arret: still(points[k]) }]));
// The knees. The owner elected « genoux chevauchés » for the dance (atlas #132, 21 Nov.): the two knees move
// in opposite senses over the whole swing, and when the pelvis passes the centre both are bent by the same
// angle. Measured here: `sensInverse`, share of the cycle where one knee bends while the other straightens
// (each by more than 0.5° per sixteenth of a beat); `auCentre`, the two flexions (degrees) when the pelvis
// crosses the middle of its lateral path.
const kneeRange = side => [Math.min(...knees[side]), Math.max(...knees[side])];
const total = knees.L.length, step = 2;
let opposite = 0;
for (let i = 0; i < total; i++) {
  const dL = knees.L[(i + step) % total] - knees.L[i], dR = knees.R[(i + step) % total] - knees.R[i];
  if (dL * dR < 0 && Math.abs(dL) > 0.5 && Math.abs(dR) > 0.5) opposite++;
}
const round = v => Math.round(v * 100) / 100;
const middle = (Math.max(...points.C.map(p => p[0])) + Math.min(...points.C.map(p => p[0]))) / 2;
const crossings = points.C.map((p, i) => i).filter(i => (points.C[i][0] - middle) * (points.C[(i + 1) % total][0] - middle) <= 0);
// `ecart`: the largest difference between the two knees (degrees). `appui`: the flexion of the supporting leg
// (the one carrying more than 60 % of the weight), lowest and highest, and `libre`: of the other leg meanwhile.
const carried = knees.L.map((_, i) => loads[i] > 0.6 ? ['R', 'L'] : loads[i] < 0.4 ? ['L', 'R'] : null).map((pair, i) => pair && [knees[pair[0]][i], knees[pair[1]][i]]).filter(Boolean);
const span = values => values.length ? [round(Math.min(...values)), round(Math.max(...values))] : null;
const genoux = { gauche: kneeRange('L').map(round), droit: kneeRange('R').map(round), sensInverse: round(opposite / total),
  ecart: round(Math.max(...knees.L.map((v, i) => Math.abs(v - knees.R[i])))), appui: span(carried.map(c => c[0])), libre: span(carried.map(c => c[1])),
  // `appuiPlusPlie`: share of the cycle during which the supporting leg is the more bent of the two (by over 2°).
  appuiPlusPlie: round(carried.filter(c => c[0] > c[1] + 2).length / total),
  auCentre: crossings.map(i => [round(knees.L[i]), round(knees.R[i])]) };
// The passage from one side to the other (rule R34, 22 Nov.: no sudden relay between left and right).
// `soudain`: peak lateral speed of the pelvis over that of a pendulum (a sine) of the same
// width and period: 1 = as smooth as a pendulum, 2 = twice as sudden. `passage`: time (beats) the pelvis
// takes to cross the middle half of its lateral path, the slowest crossing of the cycle; `periode`: beats
// per side-to-side cycle.
const lateral = points.C.map(p => p[0]), width = Math.max(...lateral) - Math.min(...lateral), cycles = Math.max(1, Math.round(crossings.length / 2)), periode = beats / cycles;
const peak = Math.max(...lateral.map((x, i) => Math.abs(lateral[(i + 1) % total] - x) * STEPS));
const lowest = Math.min(...lateral);
const inMiddle = lateral.map(x => (x - lowest) / width > 0.25 && (x - lowest) / width < 0.75);
let passage = 0, run = 0;
for (let i = 0; i < 2 * total; i++) { run = inMiddle[i % total] ? run + 1 : 0; passage = Math.max(passage, Math.min(run, total)); }
const transfert = width < 0.1 ? null : { soudain: round(peak / (Math.PI * width / periode)), passage: round(passage / STEPS), periode: round(periode), largeur: round(width) };
// The pelvis's acceleration (m/s², at 90 bpm, 99th percentile over the cycle, the figure's travel removed) and
// the share of time it is still (under 2 cm/s): the same measures as the film's (session of #155), so that the
// ginga can be judged by whether the pelvis never stops and its speed changes without jolts.
const dt = 60 / 90 / STEPS, pelvisM = points.C.map(p => p.map(v => v / 100));
const speed = pelvisM.map((p, i) => { const q = pelvisM[(i + 1) % total]; return [0, 1, 2].map(k => (q[k] - p[k]) / dt); });
const accel = speed.map((v, i) => { const w = speed[(i + 1) % total]; return Math.hypot(...[0, 1, 2].map(k => (w[k] - v[k]) / dt)); }).sort((a, b) => a - b);
const fluidite = { acceleration99: round(accel[Math.floor(0.99 * (total - 1))]), arretPart: round(speed.filter(v => Math.hypot(...v) < 0.02).length / total) };
// The chest (rule: everything happens below the belt): how far it travels sideways and forward-and-back (cm).
const buste = { largeur: round(range(points.B, 0)), profondeur: round(range(points.B, 2)), hauteur: round(range(points.B, 1)) };
console.log(JSON.stringify({ ginga, role, kind, styleKey, genoux, buste, transfert, fluidite, mesures: Object.fromEntries(Object.entries(measures).map(([k, m]) => [k, Object.fromEntries(Object.entries(m).map(([n, v]) => [n, round(v)]))])) }));
if (process.env.MESURES === '1' || !out) process.exit(0);

// Drawing: three panels at the same scale (true distances), centred on the mean position of the pelvis.
const mean = a => points.C.reduce((s, p) => s + p[a], 0) / points.C.length, centre = [mean(0), mean(1), mean(2)];
// True distances, the same scale in the three panels: 21 px per cm, less when the path is wider than the panel.
const extent = a => Math.max(...['L', 'R', 'C'].flatMap(k => points[k].map(p => p[a]))) - Math.min(...['L', 'R', 'C'].flatMap(k => points[k].map(p => p[a])));
const W = 560, H = 750, SCALE = Math.min(21, 500 / extent(0), 120 / Math.max(extent(1), extent(2)));
const panels = [
  { title: "Vu de dessus", hint: "avant ↑", a: 0, b: 2, cx: W / 2, cy: 150 },
  { title: "Vu de face", hint: "haut ↑", a: 0, b: 1, cx: W / 2, cy: 334 },
  { title: "De profil", hint: "avant →  haut ↑", a: 2, b: 1, cx: 150, cy: 512 },
];
const at = (panel, p) => [panel.cx + (p[panel.a] - centre[panel.a]) * SCALE, panel.cy - (p[panel.b] - centre[panel.b]) * SCALE];
const path = (panel, pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${at(panel, p).map(v => v.toFixed(1)).join(' ')}`).join(' ') + ' Z';
const COLORS = { L: '#fb923c', R: '#22d3ee', C: '#94a3b8' };
const label = solo ? ({ huit: '« 8 »', huitGrand: '« 8 » plus grand', huitInverse: '« 8 », autre sens', genoux: 'genoux alternés', genouxRond: 'genoux alternés, une demi-temps après', hanches: 'hanches qui mènent', hanchesFortes: 'hanches qui mènent, plus fort', profil: '« 8 » de profil, fessiers en arrière', profilFort: '« 8 » de profil, plus fort', alterne: 'jambe d’appui tendue, jambe libre fléchie', alterneTalon: 'jambes alternées, talon libre levé', alterneDirect: 'jambes alternées, genoux avec le poids', hancheFinit: 'la hanche attend, puis arrive avec le poids', hancheTenue: 'la hanche reste haute, puis rattrape', hancheAssise: 'la hanche s’assoit dès l’arrivée', hancheApres: 'la hanche finit après l’arrivée du bassin' }[ginga] ?? 'aujourd’hui') : { marque: 'aller-retour (aujourd’hui)', huit: '« 8 » anguleux', huitRond: '« 8 » arrondi', huitInverse: '« 8 » arrondi, autre sens', huitAmple: '« 8 » arrondi, ample', huitGrand: '« 8 » arrondi, très ample', genoux: 'genoux qui mènent, en même temps (G1)', genouxQuart: 'genoux qui mènent, un quart de temps après (G2)', genouxRond: 'genoux qui mènent, une demi-temps après (G3)' }[ginga] ?? ginga;
const fixed = panels.map(panel => `
  <text x="16" y="${panel.cy - 70}" class="t">${panel.title}</text><text x="16" y="${panel.cy - 52}" class="h">${panel.hint}</text>
  ${['C', 'L', 'R'].map(k => `<path d="${path(panel, points[k])}" fill="none" stroke="${COLORS[k]}" stroke-width="${k === 'C' ? 1 : 2}" stroke-opacity="${k === 'C' ? 0.5 : 0.85}"/>`).join('')}`).join('');
// The knees' flexion over the cycle (after the leg solver, 0° = straight leg): which leg is bent, which is straighter.
const KNEE = { x0: 64, x1: W - 16, bottom: 716, top: 644, max: 90 };
const kx = i => KNEE.x0 + (KNEE.x1 - KNEE.x0) * i / total, ky = v => KNEE.bottom - (KNEE.bottom - KNEE.top) * Math.min(v, KNEE.max) / KNEE.max;
const kneeChart = `
  <text x="16" y="620" class="t">Genoux</text><text x="84" y="620" class="h">flexion au fil des temps · 0° = jambe tendue</text>
  ${[0, 30, 60, 90].map(v => `<line x1="${KNEE.x0}" y1="${ky(v)}" x2="${KNEE.x1}" y2="${ky(v)}" stroke="#334155" stroke-width="1"/><text x="${KNEE.x0 - 8}" y="${ky(v) + 4}" class="h" text-anchor="end">${v}°</text>`).join('')}
  ${Array.from({ length: beats }, (_, k) => `<text x="${kx(k * STEPS)}" y="${KNEE.bottom + 16}" class="h" text-anchor="middle">${k + 1}</text>`).join('')}
  ${['L', 'R'].map(k => `<path d="${knees[k].map((v, i) => `${i ? 'L' : 'M'}${kx(i).toFixed(1)} ${ky(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${COLORS[k]}" stroke-width="2" stroke-opacity="0.85"/>`).join('')}
  <circle cx="${W - 200}" cy="616" r="4" fill="${COLORS.L}"/><text x="${W - 190}" y="620" class="n">gauche</text><circle cx="${W - 120}" cy="616" r="4" fill="${COLORS.R}"/><text x="${W - 110}" y="620" class="n">droit</text>`;
const html = `<!doctype html><html><body style="margin:0;background:#0b1220"><svg id="s" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:system-ui,sans-serif">
  <style>.t{fill:#e2e8f0;font-size:15px;font-weight:600}.h{fill:#64748b;font-size:11px}.n{fill:#cbd5e1;font-size:12px}</style>
  <rect width="${W}" height="${H}" fill="#0b1220"/>
  <text x="16" y="26" class="t">Chemin des hanches — ${label}</text>
  <text x="16" y="44" class="h">${solo ? `danseur seul, pas de base du ${styleKey} sur place` : `${follower ? 'suiveuse' : 'leader'}, marche en ${styleKey}, déplacement de la figure retiré`} · mesuré sur le modèle</text>
  ${fixed}
  ${kneeChart}
  <g id="dots"></g>
  <line x1="${W - 16 - SCALE}" y1="578" x2="${W - 16}" y2="578" stroke="#e2e8f0" stroke-width="2"/><text x="${W - 16 - SCALE / 2}" y="572" class="n" text-anchor="middle">1 cm</text>
  <circle cx="330" cy="470" r="5" fill="${COLORS.L}"/><text x="342" y="474" class="n">hanche gauche</text>
  <circle cx="330" cy="492" r="5" fill="${COLORS.R}"/><text x="342" y="496" class="n">hanche droite</text>
  <line x1="322" y1="514" x2="338" y2="514" stroke="${COLORS.C}" stroke-width="1"/><text x="342" y="518" class="n">centre du bassin</text>
  <text id="appui" x="330" y="544" class="n"></text>
</svg></body></html>`;
const frames = panels.length && Array.from({ length: beats * STEPS / 2 }, (_, n) => {
  const i = n * 2;
  const dots = panels.map(panel => {
    const [l, r, c] = ['L', 'R', 'C'].map(k => at(panel, points[k][i]));
    return `<line x1="${l[0]}" y1="${l[1]}" x2="${r[0]}" y2="${r[1]}" stroke="#e2e8f0" stroke-width="1.5" stroke-opacity="0.7"/>
      <circle cx="${c[0]}" cy="${c[1]}" r="3" fill="${COLORS.C}"/><circle cx="${l[0]}" cy="${l[1]}" r="6" fill="${COLORS.L}"/><circle cx="${r[0]}" cy="${r[1]}" r="6" fill="${COLORS.R}"/>`;
  }).join('') + `<line x1="${kx(i)}" y1="${KNEE.top}" x2="${kx(i)}" y2="${KNEE.bottom}" stroke="#e2e8f0" stroke-width="1" stroke-opacity="0.5"/>
      <circle cx="${kx(i)}" cy="${ky(knees.L[i])}" r="5" fill="${COLORS.L}"/><circle cx="${kx(i)}" cy="${ky(knees.R[i])}" r="5" fill="${COLORS.R}"/>`;
  const support = loads[i] > 0.6 ? 'pied droit' : loads[i] < 0.4 ? 'pied gauche' : 'entre les deux';
  return { dots, appui: `temps ${(i / STEPS + 1).toFixed(2).replace('.', ',')} · poids : ${support}` };
});

const { createRequire } = await import("node:module");
const require = createRequire(import.meta.url);
const { chromium } = require("playwright"), ffmpegPath = require("ffmpeg-static");
const dir = out + '.frames'; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html);
for (let n = 0; n < frames.length; n++) {
  await page.evaluate(({ dots, appui }) => { document.getElementById('dots').innerHTML = dots; document.getElementById('appui').textContent = appui; }, frames[n]);
  writeFileSync(`${dir}/f${String(n).padStart(3, '0')}.png`, await page.locator('#s').screenshot());
}
await browser.close();
// 16 images par temps : à 90 bpm, 24 images par seconde (le GIF tourne en boucle sur le cycle).
execFileSync(ffmpegPath, ["-y", "-framerate", "24", "-i", `${dir}/f%03d.png`, "-vf", "split[s0][s1];[s0]palettegen=max_colors=32[p];[s1][p]paletteuse=dither=none", "-loop", "0", out], { stdio: "ignore" });
rmSync(dir, { recursive: true, force: true });
console.error('ok', out, frames.length, 'images');
