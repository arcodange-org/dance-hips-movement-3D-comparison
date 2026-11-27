// #210 — the path of the pelvis in the pair ida e volta, drawn from the real GLB (not in npm test): seen from above and
// from the front, guideur and suiveuse, a whole cycle in regime, in the comparator's pair view (quinconce, plexus
// contact, contraposition 1), the figure's travel kept. The path is coloured by the pelvis's speed (red: under 1 cm per
// beat, the pose held to the eye; then orange, yellow, green), and a dot marks each beat.
//   CHROME_PATH=... node scripts/tracer_bassin_ida.mjs out.png [style] [titre]
import { build } from "esbuild";
import { unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as THREE from "three";
import { fixture } from "./pose_fixture.mjs";
const require = createRequire(import.meta.url);
const [out, styleKey = 'kizomba', title = ''] = process.argv.slice(2);
const root = new URL('../', import.meta.url).pathname;
const bundle = new URL(`./.tracer-bassin-ida-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'idaPaire'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const STEP = 1 / 50, dz = api.IDA_PAIR_DZ;
const pair = [fixture(api, { offset: [0, 0, -dz] }), fixture(api, { rotation: Math.PI, offset: [0, 0, dz] })];
const tracks = pair.map(() => []);
for (let k = 0; k <= 8 / STEP + 1; k++) {
  const beat = 8 + k * STEP;
  pair.forEach((f, i) => { api.applyPose(f.r, f.model, beat, { movement: 'ida', ida: true, idaPaire: true, embrace: true, follower: !!i,
    placement: 'quinconce', styleKey, amp: 1, plexus: true, contraposition: 1 }); f.r.root.updateWorldMatrix(true, true);
    // The dancer's own frame: x to her or his left, z forward, y up (cm).
    const p = f.r.pelvis.getWorldPosition(new THREE.Vector3()), s = i ? -1 : 1;
    tracks[i].push({ beat: beat - 8, x: s * p.x * 100, y: p.y * 100, z: s * (p.z + (i ? -dz : dz)) * 100 }); });
}
const colour = v => (v < 1 ? '#ef4444' : v < 3 ? '#f97316' : v < 6 ? '#eab308' : '#22c55e');
const W = 300, H = 300; // view size (pixels); each view has its own scale (pixels per cm), shown by its bar
const view = (pts, ax, ay, ox, oy, label, axes, SCALE) => {
  const cx = (Math.min(...pts.map(p => p[ax])) + Math.max(...pts.map(p => p[ax]))) / 2, cy = (Math.min(...pts.map(p => p[ay])) + Math.max(...pts.map(p => p[ay]))) / 2;
  const X = p => ox + W / 2 - (p[ax] - cx) * SCALE, Y = p => oy + H / 2 - (p[ay] - cy) * SCALE;
  let svg = `<clipPath id="c${ox}${oy}"><rect x="${ox}" y="${oy}" width="${W}" height="${H}"/></clipPath><rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="#0f172a" stroke="#334155"/><text x="${ox + 8}" y="${oy + 18}" class="l">${label}</text><text x="${ox + 8}" y="${oy + H - 8}" class="s">${axes}</text>`;
  for (let k = 1; k < pts.length - 1; k++) {
    const v = Math.hypot(pts[k + 1].x - pts[k - 1].x, pts[k + 1].y - pts[k - 1].y, pts[k + 1].z - pts[k - 1].z) / (2 * STEP);
    svg += `<line clip-path="url(#c${ox}${oy})" x1="${X(pts[k]).toFixed(1)}" y1="${Y(pts[k]).toFixed(1)}" x2="${X(pts[k + 1]).toFixed(1)}" y2="${Y(pts[k + 1]).toFixed(1)}" stroke="${colour(v)}" stroke-width="3" stroke-linecap="round"/>`;
  }
  // A pelvis held draws no line: a red disc marks where it moves under 1 cm per beat.
  for (let k = 1; k < pts.length - 1; k++) {
    const v = Math.hypot(pts[k + 1].x - pts[k - 1].x, pts[k + 1].y - pts[k - 1].y, pts[k + 1].z - pts[k - 1].z) / (2 * STEP);
    if (v < 1) svg += `<circle cx="${X(pts[k]).toFixed(1)}" cy="${Y(pts[k]).toFixed(1)}" r="9" fill="#ef4444" fill-opacity="0.35"/>`;
  }
  for (const p of pts) if (Math.abs(p.beat - Math.round(p.beat)) < STEP / 2 && p.beat < 7.99)
    svg += `<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="4" fill="#fff"/><text x="${(X(p) + 6).toFixed(1)}" y="${(Y(p) - 6).toFixed(1)}" class="b">${Math.round(p.beat)}</text>`;
  svg += `<line x1="${ox + W - 8 - SCALE}" y1="${oy + H - 12}" x2="${ox + W - 8}" y2="${oy + H - 12}" stroke="#94a3b8" stroke-width="2"/><text x="${ox + W - 8 - SCALE}" y="${oy + H - 18}" class="s">1 cm</text>`;
  return svg;
};
let body = '';
['guideur', 'suiveuse'].forEach((who, i) => {
  // From above: her or his left to the left of the picture, forward up. From the front: left to the left, up up.
  body += view(tracks[i].map(p => ({ ...p, x: -p.x })), 'x', 'z', 10 + i * (W + 10), 60, `${who} · vu de dessus`, 'gauche ← → droite · avant ↑', 14);
  body += view(tracks[i].map(p => ({ ...p, x: -p.x })), 'x', 'y', 10 + i * (W + 10), 70 + H, `${who} · vu de face`, 'haut ↑', 45);
});
const legend = [[10, '#ef4444', 'vitesse : moins de 1 cm par temps (arrêt, disque rouge)'], [330, '#f97316', '1 à 3'], [400, '#eab308', '3 à 6'], [470, '#22c55e', 'plus de 6 cm par temps']]
  .map(([x, c, t]) => `<rect x="${x}" y="${80 + 2 * H}" width="14" height="14" fill="${c}"/><text x="${x + 20}" y="${92 + 2 * H}" class="s">${t}</text>`).join('');
const svg = `<svg id="s" xmlns="http://www.w3.org/2000/svg" width="${2 * W + 30}" height="${110 + 2 * H}" style="background:#020617;font-family:Helvetica,Arial,sans-serif">
<style>.t{fill:#f8fafc;font-size:18px;font-weight:600}.l{fill:#e2e8f0;font-size:13px}.s{fill:#94a3b8;font-size:11px}.b{fill:#f8fafc;font-size:12px}</style>
<text x="10" y="26" class="t">${title || 'Chemin du bassin'}</text><text x="10" y="46" class="s">ida e volta en paire, ${styleKey}, un cycle de 8 temps, mesuré sur le modèle · point blanc : chaque temps</text>${body}${legend}</svg>`;
const { chromium } = require("playwright");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0;background:#020617">${svg}</body></html>`);
writeFileSync(out, await page.locator('#s').screenshot());
await browser.close();
console.log('ok', out);
