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
 * Bras du cadre (#185) : le coude levé de la suiveuse choisi le 23 novembre 2026 ; `coudeBas` retiré (#190).
 * Tenue des mains (#199) : `paumeCiel` choisie le 24 novembre 2026, devenue la tenue des mains jointes et retirée ;
 * la tenue sur le côté reste une option de l'app (`?tenue=cote`, `TENUE` dans src/upperBody.ts).
 * Exercices d'isolation (#206) : votes des 24 et 25 novembre 2026 (amplitude moyenne ; trois vitesses, posé puis fluide ;
 * le huit qui alterne glisse et tourne, une mesure chacun) devenus le comportement ; leurs interrupteurs retirés.
 * Pointes et talons (#216) : votes du 25 novembre 2026 (talons à mi-hauteur ; l'exercice des talons aux trois vitesses)
 * devenus le comportement ; `talonsBas` et `talonsTenue` retirés.
 * Le pied sur la plante (#225) : `hautTroisQuarts` et `hautDemiPointe` attendent leur vote ; `piedBloc` remet le pied
 * d'un bloc des exercices (il tient sur le bout des orteils), pour filmer l'avant.
 */
export const ESSAIS = {
  /** Témoin : ne change rien. Sert à filmer le comportement actuel image par image hors du mode paire. */
  temoin: "témoin : comportement actuel",
  /** #179 : les mains jointes sur le côté du couple, plus bas et plus près, coudes détendus, avec la prise du
   * 22 novembre (l'attitude choisie les tient au niveau des épaules, emboîtées). */
  mainsBasses: "mains jointes sur le côté du couple, plus bas",
  /** #225 : les talons des exercices montent aux trois quarts (le pied bascule de 45°). */
  hautTroisQuarts: "talons aux trois quarts",
  /** #225 : les talons des exercices montent en demi-pointe complète, la cheville à l'aplomb de la plante (69°). */
  hautDemiPointe: "talons en demi-pointe complète",
  /** #225 : le pied d'un bloc des exercices, avant ce lot (talon levé, il tient sur le bout des orteils). */
  piedBloc: "pied d'un bloc, sur le bout des orteils (avant #225)",
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
