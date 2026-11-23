import type { Transition } from "../transitions";

/** #94: what the leader (« guideur ») engages and what the follower (« suiveuse ») receives, for the transition in progress. */
export default function TransitionCard({ transition, compact = false }: { transition: Transition; compact?: boolean }) {
  const row = "flex gap-2", label = "w-16 shrink-0";
  return <div className={compact ? "space-y-0.5 text-[11px] leading-snug" : "space-y-1 text-sm"} aria-live="polite">
    <p className="font-semibold text-slate-100">{transition.title}</p>
    <p className={row}><span className={label + " text-amber-300"}>Guideur</span><span className="text-slate-200">{transition.leader}</span></p>
    <p className={row}><span className={label + " text-sky-300"}>Suiveuse</span><span className="text-slate-200">{transition.follower}</span></p>
    <p className={row}><span className={label + " text-slate-400"}>Contacts</span><span className="text-slate-300">{transition.contacts}</span></p>
    {!compact && <p className="text-xs text-slate-500">Sources : {transition.sources.join(", ")}
      {" "}(règles R : propriétaire ; S : références du cadre ; Pr : demande du propriétaire). Sans validation chorégraphique.</p>}
  </div>;
}
