import type { ComponentType } from 'react';

/**
 * Ikon-kontraktet är strukturellt (size/aria-hidden/className) — inte låst
 * till lucide-react (NavCardIcon-disciplinen; återanvändbarhet 11).
 */
export type TidslinjeIkon = ComponentType<{
  size?: number;
  'aria-hidden'?: boolean;
  className?: string;
}>;

export interface TidslinjeHandelse {
  /** Stabil list-nyckel (t.ex. `${tidpunkt}-${slag}`). */
  id: string;
  /** Händelsetexten — bäraren (ikonen är dekor). */
  text: string;
  /** FORMATERAD tidpunkt (callern äger formatet — komponenten formaterar inte). */
  tid: string;
  /** Nodens ikon (aria-hidden). */
  ikon: TidslinjeIkon;
}

/**
 * [BIBLIOTEKS-KANDIDAT] Tidslinje — aktivitetslogg i branschledar-formen
 * (task-18.17 byggkrav 11; Shopify/Stripe activity): genomgående linje,
 * ikon-noder i cirklar; texten bär, tiden mutad under. Nyskriven mot facit
 * (throwaway-kontraktet); promoveras till primitives/ vid andra konsumenten.
 *
 * ORDNINGEN ÄGS AV CALLERN (renderas som given): "senast överst" är
 * anmälningsvyns beslut, inte komponentens — en annan konsument kan behöva
 * kronologisk ordning. Komponenten är ren presentation: ingen sortering,
 * ingen datumtolkning (11 återanvändbarhet).
 *
 * A11y (11): en <ol> (händelserna ÄR ordnade); den genomgående linjen och
 * ikon-cirklarna är aria-hidden (dekor) — varje list-post läses som
 * "text, tid". Inga interaktiva element — ren läsyta.
 */
export function Tidslinje({ handelser }: { handelser: readonly TidslinjeHandelse[] }) {
  return (
    <ol className="relative my-0 flex list-none flex-col py-3 pl-0">
      <span aria-hidden="true" className="absolute top-5 bottom-5 left-[15px] w-px bg-border" />
      {handelser.map((h) => {
        const Ikon = h.ikon;
        return (
          // isolate på <li> (INTE <ol>, TASK-439 fix B): PR #2457 ändrar
          // <ol>-raden ovan (lägger aria-label) — en ändring på samma rad
          // hade gett merge-konflikt i kön. isolate håller ikon-nodens
          // z-10 (nedan) INOM denna post i stället för att läcka ut i
          // rot-staplingskontexten och konkurrera med sidkromet
          // (TabBar.tsx, z-30 — se dess docblock för hela lagerskalan).
          <li key={h.id} className="relative isolate flex items-start gap-3 pb-5 last:pb-1">
            <span
              aria-hidden="true"
              className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface"
            >
              <Ikon aria-hidden size={14} className="text-text-secondary" />
            </span>
            <span className="flex min-w-0 flex-col pt-1">
              <span className="text-body">{h.text}</span>
              <span className="text-caption text-text-muted">{h.tid}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
