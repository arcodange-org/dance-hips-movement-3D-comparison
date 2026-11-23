/**
 * Variantes d'ESSAI pour les élections de GIFs (docs/spec-elections-variantes.md).
 *
 * Une variante n'est active que si l'URL la demande : `?essai=cle1,cle2`. Sans ce paramètre — et dans
 * les tests en node, qui ne posent jamais la variable ESSAI — rien ne change. Ces interrupteurs servent à FILMER des
 * candidats pour que le propriétaire en élise un ; ils ne sont pas des options de l'app. Une fois la
 * question tranchée, la variante élue devient le comportement et son interrupteur disparaît.
 *
 * Premier tour (votes du 21 novembre 2026) : `idaMemePied` (#86), `ligneBustes` (#72) et `marcheDeroulee`
 * (#73) ont été retirés ; le témoin reste, pour les prochains tours.
 * Tour des mains (#179) : `mainsCote` choisie le 23 novembre 2026, devenue le comportement et retirée ;
 * `mainsBasses` reste filmable.
 */
export const ESSAIS = {
  /** Témoin : ne change rien. Sert à filmer le comportement actuel image par image hors du mode paire. */
  temoin: "témoin : comportement actuel",
  /** #179 : les mains jointes sur le côté du couple, plus bas et plus près, coudes détendus, avec la prise du
   * 22 novembre (l'attitude choisie les tient au niveau des épaules, emboîtées). */
  mainsBasses: "mains jointes sur le côté du couple, plus bas",
} as const;
export type Essai = keyof typeof ESSAIS;

// Dans le navigateur : `?essai=`. En node (mesures d'un candidat) : variable d'environnement ESSAI,
// que les tests ne posent jamais.
const demande = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("essai")
  : (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.ESSAI;
const actifs: ReadonlySet<string> = new Set((demande ?? "").split(",").filter(Boolean));

export const essai = (cle: Essai): boolean => actifs.has(cle);
/** Une capture d'élection est en cours : l'avance image par image (`sortieBeat`) vaut dans tous les modes. */
export const essaiEnCours = (): boolean => actifs.size > 0;
