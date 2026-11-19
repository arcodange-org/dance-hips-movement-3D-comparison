import { useEffect, useState } from "react";
import { seekClock, type DanceClock } from "../clock";
import { SORTIE_GARCON_ACTIONS, sortieGarconBeat, type SortieVariant } from "../sortieGarcon";

export default function SortieGarconControls({ clock, variant, onVariant, contra, onContra, onPlaying }: {
  clock: DanceClock; variant: SortieVariant; onVariant: (value: SortieVariant) => void;
  contra: number; onContra: (value: number) => void; onPlaying: (value: boolean) => void;
}) {
  const [beat, setBeat] = useState(clock.beat);
  useEffect(() => {
    const id = setInterval(() => setBeat(sortieGarconBeat(clock.beat)), 100);
    return () => clearInterval(id);
  }, [clock]);
  const seek = (value: number) => { seekClock(clock, value); setBeat(value); onPlaying(false); };
  return <section aria-label="Séquence sortie garçon" className="mt-4 space-y-3 text-sm">
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1">Pose de la sortie garçon
        <select className="bg-slate-800 border border-slate-600 rounded p-2" value={Number.isInteger(beat) ? beat : 'progress'}
          onChange={event => seek(Number(event.target.value))}>
          <option value="progress" disabled>En cours · action {Math.ceil(beat)}</option>
          {SORTIE_GARCON_ACTIONS.map((label, i) => <option value={i} key={i}>{label}</option>)}
        </select>
      </label>
      <button className="bg-slate-800 border border-slate-600 rounded px-3 py-2" onClick={() => {
        seek(0); onPlaying(true);
      }}>Rejouer la sortie garçon</button>
      <label className="grid gap-1">Fin de la sortie garçon
        <select className="bg-slate-800 border border-slate-600 rounded p-2" value={variant}
          onChange={event => { onVariant(event.target.value as SortieVariant); seek(0); }}>
          <option value="line">Retour sur la ligne</option>
          <option value="right">Décalage commun à droite</option>
        </select>
      </label>
      <label className="grid gap-1">Contraposition sortie garçon : {contra}°
        <input aria-label="Contraposition sortie garçon" type="range" min="0" max="30" step="1"
          value={contra} onChange={event => onContra(Number(event.target.value))} />
      </label>
    </div>
    <p className="text-slate-300" aria-live="polite">{beat >= 5
      ? "Marka : appui droit du leader, gauche de la partenaire. Gauche du leader disponible."
      : "Leader G–D–G croisé–D–marka G ; partenaire D–G–D–G–marka D."}</p>
    <p className="text-xs text-slate-400">Cinq actions, quatre transferts. La lecture conserve la pose finale.
      La contraposition est un réglage d’illustration, sans valeur imposée par style.
      Les repères bleus des cuisses droites montrent une proximité d’enveloppes illustratives.</p>
  </section>;
}
