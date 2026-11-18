import { HIP_WIDTH } from "../anatomy";
import { MODES, STYLES, type ModeKey, type MovementKey } from "../styles";

interface ControlsProps {
  mode: ModeKey;
  onMode: (m: ModeKey) => void;
  styleA: string;
  styleB: string;
  onStyleA: (s: string) => void;
  onStyleB: (s: string) => void;
  playing: boolean;
  onPlaying: (p: boolean) => void;
  travel: number;
  onTravel: (v: number) => void;
  bpm: number;
  onBpm: (v: number) => void;
  amp: number;
  onAmp: (v: number) => void;
  showTorso: boolean;
  onShowTorso: (v: boolean) => void;
  // Phase 15 — « retard du suiveur » supprimé : en paire, le suiveur est le miroir exact du
  // guideur (même style, pas de délai). La comparaison de styles différents = mode compare.
  showContacts: boolean;
  onShowContacts: (v: boolean) => void;
  showMuscles: boolean;
  onShowMuscles: (v: boolean) => void;
  sortie: boolean;
  onSortie: (v: boolean) => void;
  showRepere: boolean;
  onShowRepere: (v: boolean) => void;
  showAppui: boolean;
  onShowAppui: (v: boolean) => void;
  plant: boolean;
  onPlant: (v: boolean) => void;
  movement: MovementKey;
  onMovement: (m: MovementKey) => void;
  showLigne: boolean;
  onShowLigne: (v: boolean) => void;
  iso: boolean;
  onIso: (v: boolean) => void;
  cadre: boolean;
  onCadre: (v: boolean) => void;
  dir: number;
  onDir: (v: number) => void;
  showBoussole: boolean;
  onShowBoussole: (v: boolean) => void;
  onShare: () => void;
  copied: boolean;
  ghostSel: string;
  onGhostSel: (v: string) => void;
  onExport: () => void;
}

function StylePicker({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(STYLES).map(([key, st]) => {
          const active = key === value;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              disabled={disabled}
              className={
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors " +
                (disabled ? "opacity-40 cursor-not-allowed " : "") +
                (active
                  ? "border-transparent text-slate-950"
                  : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700")
              }
              style={active ? { background: st.color } : undefined}
            >
              {st.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Controls(props: ControlsProps) {
  const {
    mode,
    onMode,
    styleA,
    styleB,
    onStyleA,
    onStyleB,
    playing,
    onPlaying,
    travel,
    onTravel,
    bpm,
    onBpm,
    amp,
    onAmp,
    showTorso,
    onShowTorso,

    showContacts,
    onShowContacts,
    showMuscles,
    onShowMuscles,
    sortie,
    onSortie,
    showRepere,
    onShowRepere,
    showAppui,
    onShowAppui,
    plant,
    onPlant,
    movement,
    onMovement,
    showLigne,
    onShowLigne,
    iso,
    onIso,
    cadre,
    onCadre,
    dir,
    onDir,
    showBoussole,
    onShowBoussole,
    onShare,
    copied,
    ghostSel,
    onGhostSel,
    onExport,
  } = props;
  const isPair = mode === "pair";
  const isCompare = mode === "compare";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => onMode(m.key)}
            className={
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors " +
              (mode === m.key
                ? "bg-sky-500 border-sky-400 text-slate-950"
                : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700")
            }
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <StylePicker
          label={isPair ? "Guideur (corps A)" : "Style A (gauche)"}
          value={styleA}
          onChange={onStyleA}
        />
        <StylePicker
          label={isPair ? "Suiveur = miroir du guideur (style A)" : isCompare ? "Style B (droite)" : "Style B (inactif)"}
          value={isPair ? styleA : styleB}
          onChange={isPair ? onStyleA : onStyleB}
          disabled={isPair}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          onClick={() => onPlaying(!playing)}
          className={
            "px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors " +
            (playing
              ? "bg-emerald-500 border-emerald-400 text-slate-950"
              : "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700")
          }
        >
          {playing ? "⏸ Pause" : "▶ Lecture"}
        </button>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Déplacement
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={travel}
            onChange={(e) => onTravel(Number(e.target.value))}
            className="accent-sky-400"
          />
          <span className="text-slate-200 font-mono w-20">
            {travel < 0.03
              ? "sur place"
              : `±${Math.round(travel * (HIP_WIDTH / 2) * 100)} cm · ${Math.round(travel * 100)}%`}
          </span>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Tempo
          <input
            type="range"
            min="24"
            max="140"
            step="1"
            value={bpm}
            onChange={(e) => onBpm(Number(e.target.value))}
            className="accent-sky-400"
          />
          <span className="text-slate-200 font-mono w-14">{bpm} bpm</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Amplitude
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.05"
            value={amp}
            onChange={(e) => onAmp(Number(e.target.value))}
            className="accent-amber-400"
          />
          <span className="text-slate-200 font-mono w-12">{Math.round(amp * 100)}%</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={showTorso}
            onChange={(e) => onShowTorso(e.target.checked)}
            className="accent-sky-400"
          />
          Buste stylisé
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="En sur place (Déplacement 0), les pieds restent plantés au sol ; petit pivot sur la plante (semi-pointe) autorisé. plant=0 = ancien comportement glissé">
          <input
            type="checkbox"
            checked={plant}
            onChange={(e) => onPlant(e.target.checked)}
            className="accent-emerald-400"
          />
          Pieds plantés (sur place)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Isolation du bas du corps (objectif premier) : au-dessus du bassin, le haut du tronc reste stable et vertical pendant que bassin/genoux/pieds travaillent ; métrique « stabilité buste % » dans le HUD. iso=0 = ancien buste libre">
          <input
            type="checkbox"
            checked={iso}
            onChange={(e) => onIso(e.target.checked)}
            className="accent-teal-400"
          />
          Isolation basse (buste verrouillé, vertical)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Cadre de bras de danseur : coudes pliés, bras vers l'avant, avant-bras gauche vers le haut (paume à droite), avant-bras droit vers la gauche (paume vers le buste). cadre=0 = bras le long du corps">
          <input
            type="checkbox"
            checked={cadre}
            onChange={(e) => onCadre(e.target.checked)}
            className="accent-teal-400"
          />
          Cadre de bras de danseur
        </label>
        <fieldset className="border border-slate-700/60 rounded px-2 py-1">
          <legend className="text-[11px] text-slate-400 px-1">Déplacement (options exclusives)</legend>
          {(
            [
              ["none", "Aucun (sur place)"],
              ["corridinho", "Corridinho (1/4 tour D puis G, puis cercle au repère)"],
              ["quarts", "Quarts de tour (4 = tour complet, pivots vírgula)"],
              ["temps3", "Marka « 3 temps » (avec Déplacement)"],
              ["ida", "Ida e volta (aller-retour, 8 temps)"],
            ] as [MovementKey, string][]
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-xs text-slate-400" title={label}>
              <input
                type="radio"
                name="movement"
                checked={movement === k}
                onChange={() => onMovement(k)}
                className="accent-fuchsia-400"
              />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Marche arrière : inverse le sens du Déplacement le long de la ligne de danse (dir=-1)">
          <input
            type="checkbox"
            checked={dir < 0}
            onChange={(e) => onDir(e.target.checked ? -1 : 1)}
            className="accent-fuchsia-400"
          />
          Marche arrière (dir=-1)
        </label>
        {isPair && (
          <label className="flex items-center gap-2 text-xs text-slate-400" title="Ligne de danse (axe x au repère fixe) : la sortie est perpendiculaire à la ligne, aller-retour">
            <input
              type="checkbox"
              checked={showLigne}
              onChange={(e) => onShowLigne(e.target.checked)}
              className="accent-pink-400"
            />
            Ligne de danse
          </label>
        )}
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Repère fixe au sol (origine) : les déplacements (sorties, Déplacement) se lisent relativement à ce repère">
          <input
            type="checkbox"
            checked={showRepere}
            onChange={(e) => onShowRepere(e.target.checked)}
            className="accent-sky-400"
          />
          Repère fixe (origine)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Pastilles de charge sous les pieds + chaîne d'appui pied→genou→hanche (sur place) + HUD genoux/bassin">
          <input
            type="checkbox"
            checked={showAppui}
            onChange={(e) => onShowAppui(e.target.checked)}
            className="accent-amber-400"
          />
          Appuis &amp; transmission
        </label>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1" title="Vue squelette simple, ou avec la couche musculaire/tissus (BodyParts3D CC BY-SA 2.1 Japan © DBCLS) greffée sur les pivots osseux ; la chaîne d'appui sol→genoux→hanches reste visible dans les deux vues">
            Vue
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => onShowMuscles(false)}
              className={
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors " +
                (!showMuscles
                  ? "bg-red-500 border-red-400 text-slate-950"
                  : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700")
              }
            >
              Squelette
            </button>
            <button
              onClick={() => onShowMuscles(true)}
              className={
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors " +
                (showMuscles
                  ? "bg-red-500 border-red-400 text-slate-950"
                  : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700")
              }
            >
              + Muscles (tissus)
            </button>
          </div>
        </div>
        {isPair && (
          <label className="flex items-center gap-2 text-xs text-slate-400" title="Sortie garçon (guideur) puis sortie fille (suiveur) : aller-retour latéral de 5 temps sur un cycle de 8">
            <input
              type="checkbox"
              checked={sortie}
              onChange={(e) => onSortie(e.target.checked)}
              className="accent-teal-400"
            />
            Sorties garçon / fille
          </label>
        )}
        <button
          onClick={onExport}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          ⬇ Exporter un cycle (WebM)
        </button>
        <button
          onClick={onShare}
          title="Copie l'URL de la vue courante (tous les paramètres + angle de la caméra campos=/camtgt=) dans le presse-papiers et met à jour la barre d'adresse"
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-sky-700 bg-sky-900/60 text-sky-200 hover:bg-sky-800 transition-colors"
        >
          {copied ? "✓ Lien copié !" : "🔗 Partager la vue (URL)"}
        </button>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Boussole 8 directions au repère fixe (4 cardinales + 4 diago ; E-W = ligne de danse) ; la direction du buste et la position relative au repère s'affichent dans le HUD">
          <input
            type="checkbox"
            checked={showBoussole}
            onChange={(e) => onShowBoussole(e.target.checked)}
            className="accent-sky-400"
          />
          Boussole 8 directions
        </label>
        {isPair && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showContacts}
              onChange={(e) => onShowContacts(e.target.checked)}
              className="accent-emerald-400"
            />
            Points de contact
          </label>
        )}
        {(isCompare || isPair) && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Isolation
            <select
              value={ghostSel}
              onChange={(e) => onGhostSel(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-200"
            >
              <option value="none">Les deux corps</option>
              <option value="A">
                {isPair ? "Guideur seul (B transparent)" : "Corps A seul (B transparent)"}
              </option>
              <option value="B">
                {isPair ? "Suiveur seul (A transparent)" : "Corps B seul (A transparent)"}
              </option>
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
