/** Share URL → app state (#31): pure, so the restore is tested end to end with `buildShareUrl`
 * (scripts/test_share_params.mjs). Only the parameters present and valid are returned; App applies them. */
import { STYLES, movementOf, type ModeKey, type MovementKey } from "./styles";
import { placementOf, type CouplePlacement } from "./placement";
import { sortieFilleBeat, sortieFilleVariantOf, type SortieFilleVariant } from "./sortieFille";
import { sortieGarconSettings, type SortieVariant } from "./sortieGarcon";

const MODES: ModeKey[] = ["solo", "observe", "compare", "pair"];
const MOVEMENT_PARAMS = ["corridinho", "quarts", "temps3", "ida", "sortie", "sortieG", "sortieF", "sortieGF"];

export interface ShareParams {
  mode?: ModeKey; styleA?: string; styleB?: string; bpm?: number; travel?: number; amp?: number;
  playing?: boolean; torso?: boolean; muscles?: boolean; repere?: boolean; appui?: boolean; plant?: boolean;
  movement?: MovementKey; sortieFilleVariant?: SortieFilleVariant; placement?: CouplePlacement; contraposition?: 0 | 1;
  sortieVariant?: SortieVariant; sortieContra?: number;
  /** Beat the clock seeks to (pair figures, `sortieBeat`). */
  seek?: number;
  ligne?: boolean; iso?: boolean; cadre?: boolean; dir?: 1 | -1; boussole?: boolean; ghost?: string; contacts?: boolean;
  musique?: "A" | "B"; son?: boolean;
  /** #142: source of the music; absent = the recorded loop when the style has one. */
  source?: "enregistrement" | "synthese";
  /** #128: the leader's virgula in the pair ida e volta (`virgula=1`). */
  virgula?: boolean;
}

/** `current`: the state the URL is applied to (the seek depends on the mode and movement in force). */
export function parseShareParams(p: URLSearchParams, current: { mode: ModeKey; movement: MovementKey }): ShareParams {
  const s: ShareParams = {};
  const num = (k: string) => (p.has(k) ? Number(p.get(k)) : null);
  const on = (k: string) => p.get(k) !== "0";
  const flag = (k: keyof ShareParams, key: string = k) => { if (p.has(key)) (s as Record<string, unknown>)[k] = on(key); };
  const mode = p.get("mode");
  if (mode && (MODES as string[]).includes(mode)) s.mode = mode as ModeKey;
  const style = p.get("style"); if (style && STYLES[style]) s.styleA = style;
  const styleB = p.get("styleB"); if (styleB && STYLES[styleB]) s.styleB = styleB;
  const b = num("bpm"); if (b !== null && b >= 24 && b <= 140) s.bpm = b;
  const tr = num("travel"); if (tr !== null && tr >= 0 && tr <= 1) s.travel = tr;
  const am = num("amp"); if (am !== null && am >= 0.5 && am <= 2) s.amp = am;
  flag("playing"); flag("torso"); flag("muscles"); flag("repere"); flag("appui"); flag("plant");
  // Exclusive options: when several are present, one is kept (movementOf). `sortie=1` (legacy) is the
  // sortie garçon; `sortieF=1` the sortie fille; `sortieGF=1` the historical combined figure.
  if (MOVEMENT_PARAMS.some(k => p.has(k))) {
    const set = (k: string) => p.has(k) && on(k);
    s.movement = movementOf({ corridinho: set("corridinho"), quarts: set("quarts"), temps3: set("temps3"), ida: set("ida"),
      sortieG: set("sortie") || set("sortieG"), sortieF: set("sortieF"), sortieGF: set("sortieGF") });
  }
  if (p.has("sortieFilleVariant")) s.sortieFilleVariant = sortieFilleVariantOf(p.get("sortieFilleVariant"));
  if (p.has("placement")) s.placement = placementOf(p.get("placement"));
  if (p.has("contra")) s.contraposition = p.get("contra") === "0" ? 0 : 1;
  const figure = sortieGarconSettings(p);
  if (p.has("sortieVariant")) s.sortieVariant = figure.variant;
  if (p.has("sortieContra")) s.sortieContra = figure.contra;
  const urlMode = s.mode ?? current.mode, urlMovement = s.movement ?? current.movement;
  if (p.has("sortieBeat") && urlMode === "pair") {
    const raw = Number(p.get("sortieBeat"));
    if (urlMovement === "sortieG") s.seek = figure.beat;
    else if (urlMovement === "sortieF") s.seek = sortieFilleBeat(raw);
    // Frame-by-frame captures of the pair figures (scripts/capture_figure_gif.mjs).
    else if ((urlMovement === "quarts" || urlMovement === "ida" || urlMovement === "none") && Number.isFinite(raw) && raw >= 0) s.seek = raw;
  }
  flag("ligne"); flag("iso"); flag("cadre"); flag("virgula");
  if (p.has("dir")) { const d = num("dir"); if (d === 1 || d === -1) s.dir = d; }
  flag("boussole");
  // `delay` (follower delay) was removed in phase 15: ignored when present.
  const ghost = p.get("ghost"); if (ghost && ["none", "A", "B"].includes(ghost)) s.ghost = ghost;
  flag("contacts");
  const musique = p.get("musique"); if (musique === "A" || musique === "B") s.musique = musique;
  if (p.get("son") === "1") s.son = true;
  const source = p.get("source"); if (source === "enregistrement" || source === "synthese") s.source = source;
  return s;
}
