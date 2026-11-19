import { seekClock, type DanceClock } from "../clock";
import { PLACEMENT_LABELS, placementOf, type CouplePlacement } from "../placement";

/** Couple placement of the five-action figures (docs/spec-placements-couple.md). */
export default function PlacementControl({ clock, placement, onPlacement, onPlaying }: {
  clock: DanceClock;
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
    <p className="text-xs text-slate-400">
      Le couple part rapproché. Les pas suivants rejoignent la figure validée avant l’arrivée D/D.
      Le rapprochement est complet jusqu’à l’amplitude 1, puis diminue jusqu’à l’écartement validé
      à l’amplitude 2, pour que les os des genoux ne se croisent pas.
    </p>
  </section>;
}
