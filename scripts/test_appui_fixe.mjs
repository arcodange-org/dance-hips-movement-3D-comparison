// #73 — the support foot does not slide on the spot: the style's foot rock (extraL, extraR) pivots on the
// ball when the heel rises and on the heel when the toes rise (as the figures' walking roll, #49).
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { unlinkSync } from "node:fs";
import { fixture } from "./pose_fixture.mjs";
const bundle = new URL("./.test-appui-fixe-bundle.mjs", import.meta.url);
buildSync({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement'].map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
const f = fixture(api, {});
const point = (side, name) => f.model.legs[side][name].clone().applyMatrix4(f.r['foot' + side].matrixWorld);
let samples = 0, rocking = 0, worst = 0;
for (const styleKey of Object.keys(api.STYLES)) for (const amp of [0.5, 1, 2]) {
  const flat = {};
  for (let i = 0; i <= 256; i++) {
    const b = i / 32;
    // #196: alone, the kizomba and the semba dance the « 1 2 », whose feet travel (checked by test_um_dois.mjs); their
    // step on the spot, feet planted, is the figure « Sur place ».
    const stats = api.applyPose(f.r, f.model, b, { styleKey, amp, movement: api.movementAllowed(styleKey, 'surPlace') ? 'surPlace' : 'none', plant: true });
    for (const side of ['L', 'R']) {
      const extra = side === 'L' ? f.r.extraL : f.r.extraR;
      if (Math.abs(extra) < 1e-9 && !flat[side]) flat[side] = { ball: point(side, 'ball'), heel: point(side, 'heel') };
    }
    for (const side of ['L', 'R']) {
      const extra = side === 'L' ? f.r.extraL : f.r.extraR;
      if (stats['load' + side] <= 0.05 || Math.abs(extra) < 1e-9 || !flat[side]) continue;
      const name = extra > 0 ? 'ball' : 'heel', now = point(side, name), ref = flat[side][name];
      const slide = Math.hypot(now.x - ref.x, now.z - ref.z);
      worst = Math.max(worst, slide);
      assert(slide < 1e-3, `${styleKey} amp ${amp} b${b}: ${side} ${name} stays on the floor where it was (slides ${(slide * 1000).toFixed(1)} mm)`);
      rocking++;
    }
    samples++;
  }
}
console.log(`PASS appui fixe sur place : ${rocking} poses où le pied d'appui bascule, demi-pointe ou talon immobile (au plus ${(worst * 1000).toFixed(2)} mm ; six styles, amplitudes 0,5 à 2, ${samples} poses)`);
