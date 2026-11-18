import { useEffect, useState } from "react";

// Habillage "motion design" des captures automatisées (scripts/capture_gifs.mjs) :
// activé en mode bare via ?demo=<clé> — pastille de style, légende de la nuance
// et pastille de temps synchronisée sur le tempo demandé.

export interface DemoDef {
  chip: string;
  color: string;
  captions: string[];
  beat: number; // durée d'un temps en secondes
}

export const DEMOS: Record<string, DemoDef> = {
  kizomba: {
    chip: "Kizomba · « 2 temps »",
    color: "#2dd4bf",
    captions: ["« 2 temps » latéral, sur place", "marqua : pieds joints à chaque temps"],
    beat: 60 / 90,
  },
  semba: {
    chip: "Semba",
    color: "#fb923c",
    captions: ["rebond quick-quick-slow « 1-2-3, pause »", "réception sur l'avant-pied"],
    beat: 60 / 130,
  },
  kompa: {
    chip: "Kompa",
    color: "#f87171",
    captions: ["balancier latéral sur place", "un transfert de poids par temps · hip check t4"],
    beat: 60 / 120,
  },
  tarraxinha: {
    chip: "Tarraxinha",
    color: "#c084fc",
    captions: ["isolations du bassin sur place", "« 8 », blocages nets, haut du corps fixe"],
    beat: 60 / 100,
  },
  suave: {
    chip: "Suave",
    color: "#4ade80",
    captions: ["« 8 » au sol + talon levé → on change de pied", "vague séquentielle L5 → dorsales → tête"],
    beat: 60 / 60,
  },
  zouk: {
    chip: "Zouk brésilien",
    color: "#38bdf8",
    captions: ["basic sur place (slow-quick-quick)", "cambré + ouverture de hanche"],
    beat: 60 / 110,
  },
  "sortie-garcon-fille": {
    chip: "Sorties garçon / fille",
    color: "#2dd4bf",
    captions: ["guideur sort à gauche (5 temps sur 8)", "repère fixe au sol · suiveur en retard = « sortie fille »"],
    beat: 60 / 90,
  },
  "kizomba-muscles": {
    chip: "Kizomba sur place + muscles",
    color: "#2dd4bf",
    captions: ["sur place · transfert de poids G/D", "couche musculaire BodyParts3D © DBCLS — CC BY-SA 2.1 Japan"],
    beat: 60 / 90,
  },
  appui: {
    chip: "Appuis & transmission",
    color: "#fbbf24",
    captions: ["charge transmise du sol vers le genou", "chaîne pied → cheville → genou → hanche"],
    beat: 60 / 32,
  },
  "comparatif-appuis": {
    chip: "Comparatif d'appuis",
    color: "#fbbf24",
    captions: ["kizomba vs kompa, sur place", "jauge G/D par corps (appui transmis du sol)"],
    beat: 60 / 90,
  },
  corridinho: {
    chip: "Corridinho",
    color: "#f472b6",
    captions: ["1/4 tour D, 1/4 tour G, puis cercle au sol", "cercle autour du repère fixe (ligne de danse)"],
    beat: 60 / 140,
  },
  "iso-ginga": {
    chip: "Isolation basse · ginga",
    color: "#2dd4bf",
    captions: ["buste verrouillé au-dessus du bassin, vertical", "bassin/genoux actifs · transfert de poids G/D · cadre de bras"],
    beat: 60 / 90,
  },
  fessiers: {
    chip: "Fessiers — vue de dos",
    color: "#b91c1c",
    captions: ["muscles des fessiers qui travaillent (BodyParts3D © DBCLS)", "le bassin roule, le haut du tronc reste vertical · ce sont les genoux qui fléchissent"],
    beat: 60 / 90,
  },
};

export default function DemoOverlay({ demo }: { demo: DemoDef }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(true);
    const id = setInterval(() => setOn((v) => !v), demo.beat * 300);
    return () => clearInterval(id);
  }, [demo]);
  return (
    <>
      <div className="absolute top-3 left-3 pointer-events-none">
        <span
          className="px-2.5 py-1 rounded-md text-[13px] font-bold text-slate-950 shadow-lg"
          style={{ background: demo.color }}
        >
          {demo.chip}
        </span>
      </div>
      <div className="absolute bottom-4 left-3 pointer-events-none space-y-0.5">
        {demo.captions.map((c) => (
          <div
            key={c}
            className="text-[13px] text-white font-medium"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)" }}
          >
            {c}
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 right-3 pointer-events-none">
        <span
          className="block w-3 h-3 rounded-full bg-white shadow"
          style={{ opacity: on ? 0.95 : 0.15, transition: "opacity 80ms linear" }}
        />
      </div>
    </>
  );
}
