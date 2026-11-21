import { useEffect, useState } from "react";
import { seekClock, type DanceClock } from "../clock";
import { SORTIE_FILLE_ACTIONS, sortieFilleBeat, sortieFilleVariantOf, type SortieFilleVariant } from "../sortieFille";
import { transitionAt } from "../transitions";
import TransitionCard from "./TransitionCard";

export default function SortieFilleControls({ clock, variant, onVariant, onPlaying }: {
  clock: DanceClock;
  variant: SortieFilleVariant;
  onVariant: (value: SortieFilleVariant) => void;
  onPlaying: (value: boolean) => void;
}) {
  const [beat, setBeat] = useState(sortieFilleBeat(clock.beat));
  useEffect(() => {
    const timer = setInterval(() => setBeat(sortieFilleBeat(clock.beat)), 100);
    return () => clearInterval(timer);
  }, [clock]);
  const seek = (value: number, playing: boolean) => {
    seekClock(clock, value);
    setBeat(value);
    onPlaying(playing);
  };
  return <section aria-label="Séquence sortie fille" className="mt-4 min-w-0 max-w-full space-y-3 text-sm">
    <div className="flex min-w-0 max-w-full flex-wrap items-end gap-3">
      <label className="grid min-w-0 max-w-full gap-1">Pose de la sortie fille
        <select className="w-full min-w-0 max-w-full bg-slate-800 border border-slate-600 rounded p-2" value={Number.isInteger(beat) ? beat : "progress"}
          onChange={event => seek(Number(event.target.value), false)}>
          <option value="progress" disabled>En cours · action {Math.ceil(beat)}</option>
          {SORTIE_FILLE_ACTIONS.map((action, index) => <option key={index} value={index}>
            {index === 2 && variant === "back" ? "2 · Recul D leader / Diagonale avant G suiveur" : action}
          </option>)}
        </select>
      </label>
      <button className="bg-slate-800 border border-slate-600 rounded px-3 py-2" onClick={() => seek(0, true)}>
        Rejouer la sortie fille
      </button>
      <label className="grid min-w-0 max-w-full gap-1">Deuxième pas du leader
        <select className="w-full min-w-0 max-w-full bg-slate-800 border border-slate-600 rounded p-2" value={variant}
          onChange={event => { onVariant(sortieFilleVariantOf(event.target.value)); seek(0, false); }}>
          <option value="hook">Crochet du droit</option>
          <option value="back">Recul du droit</option>
        </select>
      </label>
    </div>
    <TransitionCard transition={transitionAt(variant === "back" ? "sortieF:back" : "sortieF", beat)} />
    <p className="text-xs text-slate-400">
      Au deuxième pas, le cadre transmet l’ouverture amorcée par le buste du leader.
      Les repères D/D indiquent la proximité de deux enveloppes illustratives de cuisse.
      Au marka, le leader reste sur D et le suiveur sur G.
    </p>
  </section>;
}
