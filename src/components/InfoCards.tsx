import { STYLES } from "../styles";

export function InfoCard({ styleKey, position, sortieGarcon = false, figureSteps }: { styleKey: string; position: string; sortieGarcon?: boolean; figureSteps?: string }) {
  const st = STYLES[styleKey];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: st.color }} />
        <span className="font-semibold">{st.label}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{position}</span>
      </div>
      <ul className="space-y-1.5">
        {(figureSteps ? [figureSteps] : st.bullets).map((bl, i) => (
          <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
            <span style={{ color: st.color }}>▸</span>
            <span>{sortieGarcon && bl.includes("sorties garçon / fille") ? "Sortie garçon : progression, sortie à gauche, rentrée et marka sans transfert" : bl}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PairInfoCard({ sortieGarcon = false, sortieFille = false }: { sortieGarcon?: boolean; sortieFille?: boolean }) {
  if (sortieFille) return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
    <div className="font-semibold">Cuisses droites · sortie fille</div>
    <p className="text-xs text-slate-300">Au troisième arrêt, le droit de la suiveuse se pose à côté du droit du guideur, à sa droite.</p>
    <p className="text-xs text-slate-400">Le bleu indique la proximité de deux enveloppes de cuisse.
      Les repères représentent une distance illustrative.</p>
  </div>;

  if (sortieGarcon) return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
    <div className="font-semibold">Cuisses droites · sortie garçon</div>
    <p className="text-xs text-slate-300">Au deuxième arrêt, le contact recherché est latéral, cuisse droite contre cuisse droite.</p>
    <p className="text-xs text-slate-400">Bleu : enveloppes illustratives proches ; gris : éloignées.
      Ces repères ne mesurent pas le contact de la peau ni les forces.</p>
  </div>;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="font-semibold">Repères de proximité</span>
      </div>
      <ul className="space-y-1.5">
        <li className="text-xs text-slate-300 leading-relaxed flex gap-2">
          <span className="text-emerald-400">▸</span>
          <span>Buste : connexion de guidage (kizomba, suave)</span>
        </li>
        <li className="text-xs text-slate-300 leading-relaxed flex gap-2">
          <span className="text-emerald-400">▸</span>
          <span>Bassin/hanches : tarraxinha, kompa en balancier</span>
        </li>
        <li className="text-xs text-slate-300 leading-relaxed flex gap-2">
          <span className="text-emerald-400">▸</span>
          <span>Bras : le cadre se referme en face à face (emboîtement)</span>
        </li>
        <li className="text-xs text-slate-300 leading-relaxed flex gap-2">
          <span className="text-emerald-400">▸</span>
          <span>
            Vert = repères proches (moins de 9 cm), rouge = repères éloignés. Ces couleurs
            ne mesurent ni le contact des surfaces ni la transmission des forces.
          </span>
        </li>
      </ul>
    </div>
  );
}
