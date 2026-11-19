import { seekClock, type DanceClock } from "../clock";
import { PLACEMENT_LABELS, placementOf, type CouplePlacement } from "../placement";

/** Couple placement of the five-action figures (docs/spec-placements-couple.md). */
export default function PlacementControl({ clock, placement, onPlacement, onPlaying, quarts = false,
  contraposition = 1, onContraposition }: {
  clock: DanceClock;
  /** #51: plexus-to-plexus contact, chest facing the partner (1) or aligned with the pelvis (0). */
  contraposition?: number;
  onContraposition?: (value: number) => void;
  /** Pair quarter turns (#37): the placement is found again at the end of each quarter. */
  quarts?: boolean;
  placement: CouplePlacement;
  onPlacement: (value: CouplePlacement) => void;
  onPlaying: (value: boolean) => void;
}) {
  return <section aria-label="Placement du couple" className="mt-4 min-w-0 max-w-full space-y-2 text-sm">
    <label className="grid min-w-0 max-w-full gap-1">Placement du couple
      <select className="w-full min-w-0 max-w-full bg-slate-800 border border-slate-600 rounded p-2" value={placement}
        onChange={event => {
          onPlacement(placementOf(event.target.value));
          // Like a variant change: restart the figure from its (new) initial pose.
          seekClock(clock, 0); onPlaying(false);
        }}>
        {(Object.keys(PLACEMENT_LABELS) as CouplePlacement[]).map(key =>
          <option key={key} value={key}>{PLACEMENT_LABELS[key]}</option>)}
      </select>
    </label>
    {onContraposition && <label className="grid min-w-0 max-w-full gap-1">Plexus contre plexus
      <select className="w-full min-w-0 max-w-full bg-slate-800 border border-slate-600 rounded p-2"
        value={contraposition ? "1" : "0"} onChange={event => onContraposition(event.target.value === "0" ? 0 : 1)}>
        <option value="1">Avec contraposition (buste face au partenaire)</option>
        <option value="0">Sans contraposition (buste aligné sur le bassin)</option>
      </select>
    </label>}
    <p className="text-xs text-slate-400">
      En quinconce, les demi-pointes se touchent, les genoux droits se croisent et le bassin du suiveur
      suit celui du leader. {quarts
        ? "Pendant les quarts de tour, le couple tourne autour du leader et retrouve le quinconce à la fin de chaque quart."
        : "Les pas suivants rejoignent la figure validée avant l’arrivée D/D."} Le rapprochement est
      complet jusqu’à l’amplitude 1, puis diminue jusqu’à l’amplitude 2.
    </p>
  </section>;
}
