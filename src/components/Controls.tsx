import { HIP_WIDTH } from "../anatomy";
import { MODES, STYLES, type ModeKey } from "../styles";

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
  followDelay: number;
  onFollowDelay: (v: number) => void;
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
  corridinho: boolean;
  onCorridinho: (v: boolean) => void;
  showLigne: boolean;
  onShowLigne: (v: boolean) => void;
  iso: boolean;
  onIso: (v: boolean) => void;
  cadre: boolean;
  onCadre: (v: boolean) => void;
  quarts: boolean;
  onQuarts: (v: boolean) => void;
  temps3: boolean;
  onTemps3: (v: boolean) => void;
  ida: boolean;
  onIda: (v: boolean) => void;
  dir: number;
  onDir: (v: number) => void;
  ghostSel: string;
  onGhostSel: (v: string) => void;
  onExport: () => void;
}

function StylePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
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
              className={
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors " +
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
    followDelay,
    onFollowDelay,
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
    corridinho,
    onCorridinho,
    showLigne,
    onShowLigne,
    iso,
    onIso,
    cadre,
    onCadre,
    quarts,
    onQuarts,
    temps3,
    onTemps3,
    ida,
    onIda,
    dir,
    onDir,
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
          label={isPair ? "Suiveur (corps B)" : isCompare ? "Style B (droite)" : "Style B (inactif)"}
          value={styleB}
          onChange={onStyleB}
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
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Corridinho : 1/4 de tour à droite puis à gauche, puis cercle au sol autour du repère fixe (16 temps)">
          <input
            type="checkbox"
            checked={corridinho}
            onChange={(e) => onCorridinho(e.target.checked)}
            className="accent-fuchsia-400"
          />
          Corridinho (après 1/4 tour D puis G)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Quarts de tour (mouvement séparé du corridinho) : 4 quarts de tour sur 16 temps = un tour complet ; en paire, le suiveur le fait en marche arrière (quarts=1)">
          <input
            type="checkbox"
            checked={quarts}
            onChange={(e) => onQuarts(e.target.checked)}
            className="accent-fuchsia-400"
          />
          Quarts de tour (4 = tour complet)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Marka « 3 temps » : un pas tous les 3 temps au lieu de chaque temps pendant le Déplacement (temps3=1)">
          <input
            type="checkbox"
            checked={temps3}
            onChange={(e) => onTemps3(e.target.checked)}
            className="accent-fuchsia-400"
          />
          Marke « 3 temps » (avec Déplacement)
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Ida e volta (aller-retour), seul ou à 2 face à face : pied gauche avant/arrière puis pied droit avant/arrière, cycle de 8 temps (ida=1)">
          <input
            type="checkbox"
            checked={ida}
            onChange={(e) => onIda(e.target.checked)}
            className="accent-fuchsia-400"
          />
          Ida e volta (aller-retour, 8 temps)
        </label>
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
        <label className="flex items-center gap-2 text-xs text-slate-400" title="Couche musculaire réelle BodyParts3D (CC BY-SA 2.1 Japan © DBCLS), greffée sur les pivots osseux">
          <input
            type="checkbox"
            checked={showMuscles}
            onChange={(e) => onShowMuscles(e.target.checked)}
            className="accent-red-400"
          />
          Couche musculaire
        </label>
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
        {isPair && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Retard du suiveur
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={followDelay}
              onChange={(e) => onFollowDelay(Number(e.target.value))}
              className="accent-emerald-400"
            />
            <span className="text-slate-200 font-mono w-10">{followDelay.toFixed(1)} t</span>
          </label>
        )}
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
