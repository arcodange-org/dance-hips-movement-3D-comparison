import { STYLES } from "../styles";

export function InfoCard({ styleKey, position }: { styleKey: string; position: string }) {
  const st = STYLES[styleKey];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: st.color }} />
        <span className="font-semibold">{st.label}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{position}</span>
      </div>
      <ul className="space-y-1.5">
        {st.bullets.map((bl, i) => (
          <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
            <span style={{ color: st.color }}>▸</span>
            <span>{bl}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PairInfoCard() {
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
