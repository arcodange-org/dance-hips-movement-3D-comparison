import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { freeView, type Marges } from "../../jeuHud";

/** #186 : garde la vue de la caméra dans la place que les commandes laissent libre (le couple se voit de
 * la tête aux pieds). Seule la projection est décalée : la caméra, sa position et son suivi ne changent
 * pas. Sans marge (vue `bare`, captures), rien n'est modifié. */
export default function CadreLibre({ marges }: { marges: Marges }) {
  const camera = useThree(s => s.camera) as PerspectiveCamera;
  const width = useThree(s => s.size.width);
  const height = useThree(s => s.size.height);
  const invalidate = useThree(s => s.invalidate);
  const { top, right, bottom, left } = marges;
  useEffect(() => {
    if (!camera.isPerspectiveCamera) return;
    const view = freeView(width, height, { top, right, bottom, left });
    if (!view) return;
    camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX, view.offsetY, width, height);
    invalidate();
    return () => { camera.clearViewOffset(); invalidate(); };
  }, [camera, width, height, top, right, bottom, left, invalidate]);
  return null;
}
