// #209 — survey (not in npm test) of rule R45, « le ginga se fond dans le mouvement »: in every step of the figures, does the
// pelvis go with the foot (one gesture) or after it (a step, then the hip)? Real GLB, kizomba, amplitude 1, the couple in
// quinconce, each dancer in turn; and the « 1 2 » danced alone (kizomba, semba). The measure: `geste_hanche_mesure.mjs`.
// GESTE=<name> for another timing (`?geste=`: `ancien`, the step then the hip).
//   node scripts/sonde_geste_hanche.mjs [figure regexp]
import { build } from "esbuild";
import { unlinkSync } from "node:fs";
import { gestureSteps, gestureFigures } from "./geste_hanche_mesure.mjs";
const root = new URL('../', import.meta.url).pathname;
const bundle = new URL(`./.sonde-geste-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: ['pose', 'anatomy', 'styles', 'rigJoints', 'placement', 'quartsPaire', 'idaPaire', 'marchePaire', 'sortieGarcon', 'sortieFille', 'placePaire', 'umDois', 'gesteHanche']
  .map(n => `export * from "./src/${n}";`).join('\n'), resolveDir: root },
  bundle: true, packages: 'external', platform: 'node', format: 'esm', outfile: bundle.pathname,
  define: { 'import.meta.env.BASE_URL': '"/"' }, logLevel: 'silent' });
const api = await import(bundle.href); unlinkSync(bundle);
if (process.env.GESTE) { api.setUmDoisGesture(process.env.GESTE); api.setFigureGesture(process.env.GESTE); }
const ONLY = process.argv[2] ? new RegExp(process.argv[2]) : null;
const BEFORE = Number(process.env.AVANT ?? 0), AFTER = Number(process.env.APRES ?? 0.5);
const FIGURES = gestureFigures(api).filter(f => !ONLY || ONLY.test(f.name));
// AVANT/APRES (#213): the window opens `AVANT` beats before the foot leaves (0 by default) and closes `APRES` after it
// lands (0.5): a pelvis that starts before the foot is then seen.
for (const figure of FIGURES) for (const r of gestureSteps(api, figure, { before: BEFORE, after: AFTER })) console.log(JSON.stringify(r));
