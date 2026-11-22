// Le Rig du moteur, habillé. Le greffon de vite.config.ts met ce composant à la place de
// `components/Rig` partout dans l'application du moteur : chaque mode (comparateur, paire, mode jeu,
// vitrine) et chaque évolution du mouvement arrivent ici sans report.
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Rig, { type RigProps } from "@moteur/components/Rig.tsx?moteur";
import type { RigHandle } from "@moteur/anatomy";
import { makeMuscleMaterial } from "@moteur/muscles";
import { Haut, portDeTete, type ModeleHaut } from "./haut";
import { Mascotte, type ModeleMascotte } from "./mascotte";
import { chargerHaut, chargerMascotte } from "./actifs";
import { mascotteDe, reglages } from "./reglages";

export type { RigProps };

/** Muscles du tronc que le moteur pose rigides et que le haut du corps du pont remplace, pesés. */
const REMPLACES = /^Muscle_(Deltoid|Trapezius|PectoralisMajor)_[RL]$/;

interface Habit { rig: RigHandle; haut: Haut | null; mascotte: Mascotte | null; blocs: THREE.Mesh[]; doublons: THREE.Mesh[]; tete: THREE.Mesh[]; porteTete: THREE.Object3D }

function habiller(rig: RigHandle, modele: ModeleHaut | null, mascotte: ModeleMascotte | null): Habit {
  const blocs: THREE.Mesh[] = [], doublons: THREE.Mesh[] = [], tete: THREE.Mesh[] = [];
  (rig.torso as THREE.Object3D).traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.userData.part === "torso") (mesh.parent === rig.head ? tete : blocs).push(mesh);
    else if (mesh.userData.part === "muscle" && REMPLACES.test(mesh.name)) doublons.push(mesh);
  });
  const os = ((rig.Femur_R as THREE.Mesh | undefined)?.material as THREE.Material | undefined)?.clone() ?? new THREE.MeshStandardMaterial({ color: "#e8e2d0", roughness: 0.6 });
  // Le port de tête du couple se pose sur ce nœud : le crâne, le cou et la tête de mascotte le suivent.
  const porteTete = new THREE.Object3D();
  porteTete.name = "pont_porte_tete";
  rig.head.add(porteTete);
  return {
    rig, blocs, doublons, tete, porteTete,
    haut: modele && reglages.haut ? new Haut(rig, modele, { matiereOs: os, matiereMuscle: makeMuscleMaterial, porteTete }) : null,
    mascotte: mascotte && (reglages.tete || reglages.pieds) ? new Mascotte(rig, mascotte, { tete: reglages.tete, pieds: reglages.pieds, jeuPieds: reglages.jeuPieds, porteTete }) : null,
  };
}

export default function RigMascotte(props: RigProps) {
  // Hors paire, le moteur ne publie pas son rig : un registre privé le reçoit (le rôle « leader » ne change
  // rien à la pose d'un danseur seul).
  const prive = useRef<Record<string, any>>({});
  const pair = props.pair ?? prive, side = props.side ?? "leader";
  const [modele, setModele] = useState<ModeleHaut | null>(null);
  const [mascotte, setMascotte] = useState<ModeleMascotte | null>(null);
  const habit = useRef<Habit | null>(null);
  const nom = mascotteDe(props.side);
  // Les tibias s'arrêtent dans la tige des pieds de mascotte : plans de coupe par matière.
  const gl = useThree(s => s.gl);
  useEffect(() => { if (reglages.pont) gl.localClippingEnabled = true; }, [gl]);
  useEffect(() => {
    if (!reglages.pont) return;
    let actif = true;
    chargerHaut().then(m => actif && setModele(m), e => console.warn("pont : haut du corps illisible", e));
    chargerMascotte(nom).then(m => actif && setMascotte(m));
    return () => { actif = false; };
  }, [nom]);
  const defaire = () => { habit.current?.haut?.liberer(); habit.current?.mascotte?.liberer(); habit.current?.porteTete.removeFromParent(); habit.current = null; };
  useEffect(() => defaire, [modele, mascotte]);

  useFrame(() => {
    if (!reglages.pont) return;
    const rig = pair.current[side]?.rig as RigHandle | undefined;
    if (!rig?.chest || !rig.footL || !rig.torso) return;
    if (habit.current && habit.current.rig !== rig) defaire();
    if (!habit.current && (modele || mascotte)) habit.current = habiller(rig, modele, mascotte);
    const h = habit.current;
    if (!h) return;
    const montrer = props.showTorso !== false;
    const autre = props.pair ? (props.pair.current[side === "leader" ? "follower" : "leader"]?.rig as RigHandle | undefined) : undefined;
    // Port de tête : fonction de la seule distance entre les deux têtes (rien ne dépend du temps).
    h.porteTete.rotation.y = autre?.head && reglages.regard
      ? portDeTete(rig.head.getWorldPosition(new THREE.Vector3()).distanceTo(autre.head.getWorldPosition(new THREE.Vector3()))) : 0;
    if (h.haut) {
      // Les volumes gris du moteur et ses trois muscles rigides laissent la place au haut du corps anatomique.
      for (const m of h.blocs) m.visible = false;
      for (const m of h.doublons) m.visible = false;
      for (const m of h.tete) m.visible = false;
      h.haut.afficher(montrer, montrer && !!props.showMuscles, h.mascotte?.tete ? ["crane"] : []);
      h.haut.maj(autre ?? null, side === "follower");
    } else if (h.mascotte?.tete) for (const m of h.tete) m.visible = false;
    if (h.mascotte?.tete) h.mascotte.tete.visible = montrer;
    h.mascotte?.maj();
  }, -9);

  return <Rig {...props} pair={pair} side={side} />;
}
