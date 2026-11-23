import { useLayoutEffect, useRef, type RefObject } from "react";
import { SANS_MARGES, type Marges } from "../../jeuHud";

type Bord = keyof Marges;

/**
 * Mesure la place que prennent les bandes de commandes (#186) : chaque élément marqué
 * `data-marge="top|right|bottom|left"` sous `root` compte pour son bord, à sa taille réelle. Le résultat
 * est donné à `onMarges` quand il change, et remis à zéro quand les commandes disparaissent.
 */
export function useMarges(root: RefObject<HTMLElement | null>, onMarges: (m: Marges) => void, disposition: string): void {
  const last = useRef<Marges>(SANS_MARGES);
  const give = useRef(onMarges);
  give.current = onMarges;
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const publish = (m: Marges) => {
      const l = last.current;
      if (m.top === l.top && m.right === l.right && m.bottom === l.bottom && m.left === l.left) return;
      last.current = m;
      give.current(m);
    };
    const bands = [...el.querySelectorAll<HTMLElement>("[data-marge]")];
    const measure = () => {
      const r = el.getBoundingClientRect();
      const m: Marges = { ...SANS_MARGES };
      for (const band of bands) {
        const b = band.getBoundingClientRect();
        const bord = band.dataset.marge as Bord;
        const taille = bord === "top" ? b.bottom - r.top : bord === "bottom" ? r.bottom - b.top
          : bord === "left" ? b.right - r.left : r.right - b.left;
        m[bord] = Math.max(m[bord], Math.round(taille));
      }
      publish(m);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const band of bands) observer.observe(band);
    return () => { observer.disconnect(); publish(SANS_MARGES); };
  }, [root, disposition]);
}
