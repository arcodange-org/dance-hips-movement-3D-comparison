#!/usr/bin/env node
// #159 — tracé du chemin des hanches dans les trois vues (dessus, face, profil), mesuré sur le GLB.
// Un pas de marche du mode jeu dansé après le même pas (régime établi) : positions des deux articulations
// de hanche et du centre du bassin d'un danseur, dans son propre repère, déplacement de la figure retiré.
// Sortie : un GIF (les chemins, un point qui les parcourt) et les surfaces entourées dans chaque vue.
// Usage : CHROME_PATH=... node scripts/tracer_hanches.mjs out.gif <ginga> [suiveur|leader] [figure] [style]
//         MESURES=1 n'écrit pas de GIF : seulement les mesures (JSON sur la sortie standard).
import { buildSync } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";

const [out, ginga = "marque", role = "suiveur", kind = "avance", styleKey = "kizomba"] = process.argv.slice(2);
const bundle = new URL("./.tracer-hanches-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'insertion', 'guidage'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname, define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);

const STEPS = 32; // samples per beat
const follower = role !== "leader", dz = api.GUIDE_PAIR_DZ, beats = api.GUIDE_FIGURES[kind].beats, movement = api.GUIDE_FIGURES[kind].movement;
const f = follower ? fixture(api, { rotation: Math.PI, offset: [0, 0, dz] }) : fixture(api, { offset: [0, 0, -dz] });
const rest = { L: f.model.legs.L.rest, R: f.model.legs.R.rest }, stance = (f.model.legs.L.hipX - rest.L.x + rest.R.x - f.model.legs.R.hipX) / 2;
const ZERO = { leader: { x: 0, z: 0 }, follower: { x: 0, z: 0 } };
const points = { L: [], R: [], C: [] }, loads = [], knees = { L: [], R: [] };
for (let i = 0; i < beats * STEPS; i++) {
  const beat = i / STEPS;
  api.applyPose(f.r, f.model, beat, { ...api.guidePoseOptions({ movement, rootOffset: ZERO, kind, ginga, previous: kind }, follower), placement: 'quinconce', contraposition: 1, styleKey: api.guideStyleOf(kind, styleKey), amp: 1 });
  f.r.root.updateWorldMatrix(true, true);
  const root = f.r.root.position, inverse = f.r.root.parent.matrixWorld.clone().invert();
  // Dancer's own frame: x to the dancer's right, y up, z forward; the figure's travel (root) is removed.
  const local = name => { const p = f.r[name].getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse); return [-(p.x - root.x) * 100, p.y * 100, (p.z - root.z) * 100]; };
  points.L.push(local('hipL')); points.R.push(local('hipR')); points.C.push(local('pelvis'));
  loads.push(api.sampleKind(kind, beat, follower, { rest, stance, placement: 'quinconce', amp: 1 }).loadR);
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
const genoux = { gauche: kneeRange('L').map(round), droit: kneeRange('R').map(round), sensInverse: round(opposite / total),
  auCentre: crossings.map(i => [round(knees.L[i]), round(knees.R[i])]) };
console.log(JSON.stringify({ ginga, role, kind, styleKey, genoux, mesures: Object.fromEntries(Object.entries(measures).map(([k, m]) => [k, Object.fromEntries(Object.entries(m).map(([n, v]) => [n, round(v)]))])) }));
if (process.env.MESURES === '1' || !out) process.exit(0);

// Drawing: three panels at the same scale (true distances), centred on the mean position of the pelvis.
const mean = a => points.C.reduce((s, p) => s + p[a], 0) / points.C.length, centre = [mean(0), mean(1), mean(2)];
const SCALE = 21, W = 560, H = 600;
const panels = [
  { title: "Vu de dessus", hint: "avant ↑", a: 0, b: 2, cx: W / 2, cy: 150 },
  { title: "Vu de face", hint: "haut ↑", a: 0, b: 1, cx: W / 2, cy: 334 },
  { title: "De profil", hint: "avant →  haut ↑", a: 2, b: 1, cx: 150, cy: 512 },
];
const at = (panel, p) => [panel.cx + (p[panel.a] - centre[panel.a]) * SCALE, panel.cy - (p[panel.b] - centre[panel.b]) * SCALE];
const path = (panel, pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${at(panel, p).map(v => v.toFixed(1)).join(' ')}`).join(' ') + ' Z';
const COLORS = { L: '#fb923c', R: '#22d3ee', C: '#94a3b8' };
const label = { marque: 'aller-retour (aujourd’hui)', huit: '« 8 » anguleux', huitRond: '« 8 » arrondi', huitInverse: '« 8 » arrondi, autre sens', huitAmple: '« 8 » arrondi, ample' }[ginga] ?? ginga;
const fixed = panels.map(panel => `
  <text x="16" y="${panel.cy - 70}" class="t">${panel.title}</text><text x="16" y="${panel.cy - 52}" class="h">${panel.hint}</text>
  ${['C', 'L', 'R'].map(k => `<path d="${path(panel, points[k])}" fill="none" stroke="${COLORS[k]}" stroke-width="${k === 'C' ? 1 : 2}" stroke-opacity="${k === 'C' ? 0.5 : 0.85}"/>`).join('')}`).join('');
const html = `<!doctype html><html><body style="margin:0;background:#0b1220"><svg id="s" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:system-ui,sans-serif">
  <style>.t{fill:#e2e8f0;font-size:15px;font-weight:600}.h{fill:#64748b;font-size:11px}.n{fill:#cbd5e1;font-size:12px}</style>
  <rect width="${W}" height="${H}" fill="#0b1220"/>
  <text x="16" y="26" class="t">Chemin des hanches — ${label}</text>
  <text x="16" y="44" class="h">${follower ? 'suiveuse' : 'leader'}, marche en ${styleKey}, déplacement de la figure retiré · mesuré sur le modèle</text>
  ${fixed}
  <g id="dots"></g>
  <line x1="${W - 16 - SCALE}" y1="${H - 22}" x2="${W - 16}" y2="${H - 22}" stroke="#e2e8f0" stroke-width="2"/><text x="${W - 16 - SCALE / 2}" y="${H - 28}" class="n" text-anchor="middle">1 cm</text>
  <circle cx="330" cy="${H - 130}" r="5" fill="${COLORS.L}"/><text x="342" y="${H - 126}" class="n">hanche gauche</text>
  <circle cx="330" cy="${H - 108}" r="5" fill="${COLORS.R}"/><text x="342" y="${H - 104}" class="n">hanche droite</text>
  <line x1="322" y1="${H - 86}" x2="338" y2="${H - 86}" stroke="${COLORS.C}" stroke-width="1"/><text x="342" y="${H - 82}" class="n">centre du bassin</text>
  <text id="appui" x="330" y="${H - 56}" class="n"></text>
</svg></body></html>`;
const frames = panels.length && Array.from({ length: beats * STEPS / 2 }, (_, n) => {
  const i = n * 2;
  const dots = panels.map(panel => {
    const [l, r, c] = ['L', 'R', 'C'].map(k => at(panel, points[k][i]));
    return `<line x1="${l[0]}" y1="${l[1]}" x2="${r[0]}" y2="${r[1]}" stroke="#e2e8f0" stroke-width="1.5" stroke-opacity="0.7"/>
      <circle cx="${c[0]}" cy="${c[1]}" r="3" fill="${COLORS.C}"/><circle cx="${l[0]}" cy="${l[1]}" r="6" fill="${COLORS.L}"/><circle cx="${r[0]}" cy="${r[1]}" r="6" fill="${COLORS.R}"/>`;
  }).join('');
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
