// #132 — Atlas anatomique ouvert : vue de capture d'une planche « mouvement »
// (`?atlas=<id>&vue=<vue>&frame=<n>&frames=<N>&muscles=0|1`, docs/spec-atlas-anatomique.md D10).
// Un seul rig, posé par le moteur de l'application depuis la pose neutre ; la légende est rendue par
// la page, dans deux bandes hors du rendu 3D (ffmpeg-static n'a pas drawtext). Socle du futur viewer :
// ni navigation ni contrôle de caméra.
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Rig from "./Rig";
import GridFloor from "./GridFloor";
import { createDanceClock } from "../clock";
import { ATLAS_FOV, atlasView, type CamPreset } from "../cameras";
import {
  ATLAS_ATTRIBUTION, ATLAS_BANDES, atlasAngleLabel, atlasAngles, atlasKey, atlasSupport, atlasVueLabel, parseAtlasParams,
} from "../atlas";
import { ATLAS_MANIFEST, atlasMouvement } from "../atlasManifest";

const readState = () => parseAtlasParams(new URLSearchParams(window.location.search));
// Constante : la caméra n'est créée qu'une fois ; AtlasCamera la place à chaque changement de vue.
const CAMERA = { fov: ATLAS_FOV };

function AtlasCamera({ view }: { view: CamPreset }) {
  const camera = useThree(s => s.camera);
  useLayoutEffect(() => {
    camera.position.fromArray(view.position);
    camera.lookAt(...view.target);
    camera.updateProjectionMatrix();
  }, [camera, view]);
  return null;
}

/** Signal de rendu : `data-atlas-rendu` reçoit la clé de l'état une fois le rig posé et une image
 * complète rendue avec cet état (le rig pose en priorité −10, ce composant passe après lui). */
function RenduSignal({ cle, stats }: { cle: string; stats: React.RefObject<unknown> }) {
  const seen = useRef({ cle: "", images: 0 });
  useFrame(() => {
    const root = document.documentElement;
    if (seen.current.cle !== cle) {
      seen.current = { cle, images: 0 };
      delete root.dataset.atlasRendu;
    }
    if (!stats.current) return;
    if (++seen.current.images === 2) root.dataset.atlasRendu = cle;
  });
  useEffect(() => () => { delete document.documentElement.dataset.atlasRendu; }, []);
  return null;
}

export default function AtlasApp() {
  const [state, setState] = useState(readState);
  // L'URL est l'interface : le script de capture change de frame et de vue sans recharger la page.
  useEffect(() => {
    const onChange = () => setState(readState());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  const clock = useMemo(createDanceClock, []);
  const stats = useRef<unknown>(null);
  const mouvement = atlasMouvement(state.id);
  const support = mouvement ? atlasSupport(mouvement) : null;
  const view = useMemo(() => atlasView(state.vue, mouvement?.cote), [state.vue, mouvement?.cote]);

  if (!mouvement || !support?.ok) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-4 text-sm space-y-2">
        <p className="font-semibold">Atlas anatomique</p>
        <p>
          {mouvement && support && !support.ok
            ? `« ${mouvement.label} » : ${support.raison}.`
            : `Mouvement inconnu : « ${state.id} ».`}
        </p>
        <p className="text-slate-400">
          Mouvements du manifeste : {ATLAS_MANIFEST.mouvements.map(m => m.id).join(", ")}.
        </p>
      </div>
    );
  }

  const angleDeg = atlasAngles(mouvement, state.frames)[state.frame];
  return (
    <div data-atlas-cadre className="flex flex-col w-screen h-screen overflow-hidden bg-[#0b1220]">
      <div className="shrink-0 px-2 pt-1.5 overflow-hidden" style={{ height: ATLAS_BANDES.hautPx }}>
        <p className="text-[13px] font-semibold text-slate-100 leading-tight truncate">{mouvement.label}</p>
        <p className="text-[11.5px] text-slate-300 leading-tight truncate">
          vue de {atlasVueLabel(state.vue, mouvement.cote)} ·{" "}
          <span className="font-mono text-teal-300">{atlasAngleLabel(angleDeg)}</span>
          <span className="text-slate-500"> · image {state.frame + 1}/{state.frames}</span>
        </p>
      </div>
      <div className="relative flex-1 min-h-0">
        <Canvas camera={CAMERA} dpr={[1, 2]}>
          <AtlasCamera view={view} />
          <color attach="background" args={["#0b1220"]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[3, 5, 4]} intensity={1.3} />
          <directionalLight position={[-3, 2, -3]} intensity={0.4} color="#93c5fd" />
          <GridFloor />
          <Suspense fallback={null}>
            <Rig
              styleKey="kizomba"
              bpm={90}
              clock={clock}
              amp={0}
              playing={false}
              offset={[0, 0, 0]}
              pair={null}
              side={null}
              showMuscles={state.muscles}
              stats={stats}
              atlas={{ mouvement, angleDeg }}
            />
          </Suspense>
          <RenduSignal cle={atlasKey(state)} stats={stats} />
        </Canvas>
      </div>
      <div className="shrink-0 px-2 pt-0.5 overflow-hidden text-[9.5px] leading-[1.25] text-slate-400" style={{ height: ATLAS_BANDES.basPx }}>
        <p className="truncate">{ATLAS_ATTRIBUTION}</p>
        <p className="truncate">Généré paramétriquement : ni capture de mouvement, ni photo de modèle</p>
      </div>
    </div>
  );
}
