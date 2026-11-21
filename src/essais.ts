/**
 * Variantes d'ESSAI pour les élections de GIFs (docs/spec-elections-variantes.md).
 *
 * Une variante n'est active que si l'URL la demande : `?essai=cle1,cle2`. Sans ce paramètre — et dans
 * les tests en node, qui n'ont pas de fenêtre — rien ne change. Ces interrupteurs servent à FILMER des
 * candidats pour que le propriétaire en élise un ; ils ne sont pas des options de l'app. Une fois la
 * question tranchée, la variante élue devient le comportement et son interrupteur disparaît.
 */
export const ESSAIS = {
  /** #86 : dans l'ida e volta en paire, le suiveur bouge le MÊME pied que le leader (au lieu du pied opposé). */
  idaMemePied: "ida e volta en paire : le suiveur recule le même pied que le leader",
  /** #72 : la ligne de danse est dessinée dans l'axe des bustes (au lieu de leur être perpendiculaire). */
  ligneBustes: "ligne de danse dessinée dans l'axe des bustes",
  /** #73 : hors figures, la marche déroule le pied (talon qui se lève, attaque du talon) au lieu de rester à plat. */
  marcheDeroulee: "marche hors figures avec le déroulé du pied",
} as const;
export type Essai = keyof typeof ESSAIS;

const actifs: ReadonlySet<string> = new Set(
  typeof window === "undefined" ? [] : (new URLSearchParams(window.location.search).get("essai") ?? "").split(",").filter(Boolean));

export const essai = (cle: Essai): boolean => actifs.has(cle);
