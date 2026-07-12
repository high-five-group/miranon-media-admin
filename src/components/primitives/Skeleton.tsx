import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// Färger uteslutande via komponent-tokens (--mm-skeleton-*, components.css):
// blocket bär ≥3:1 mot appens ljusa ytor (WCAG 1.4.11) och mörknar under
// prefers-contrast: more; vid utskrift bär border-strong-konturen
// urskiljbarheten (bakgrundsfärger skrivs ofta inte ut) — border-transparent-
// mönstret håller dimensionen identisk i alla lägen (DashboardCard-idiomet).
//
// Shimmern är ett ::after-svep vänster→höger (MUI-vågens mönster) och
// animeras ENDAST via motion-safe: — deklarationen är media-gated bakom
// prefers-reduced-motion: no-preference (WCAG 2.2.2-noten; statiska block
// annars). Keyframes + duration: tailwind.css @theme (Chung-empirin, långsam).
//
// Dimensionerna är lh-baserade så blocken reserverar sina SLUTdimensioner
// i varje typografisk kontext (Lugnt laddläge: layout-skift ≈ 0): en
// textrad = exakt 1 line-box i sin omgivande text-storlek, osv.
const skeletonVariants = cva(
  'relative overflow-hidden border border-transparent bg-(--mm-skeleton-block) after:absolute after:inset-0 after:bg-linear-to-r after:from-transparent after:via-(--mm-skeleton-shimmer) after:to-transparent motion-safe:after:animate-skeleton-shimmer contrast-more:bg-(--mm-skeleton-block-contrast) print:border-border-strong',
  {
    variants: {
      variant: {
        /** Textrad — exakt en line-box (1lh) i omgivande typografi, full radbredd. */
        text: 'block h-[1lh] w-full rounded',
        /** Tal — en line-box hög, ~två siffror bred (ch följer talets typsnitt). */
        number: 'inline-block h-[1lh] w-[2ch] rounded align-top',
        /** Listrad — förenklad rad-yta, tre line-boxar (radie som zebra-radernas). */
        listRow: 'block h-[3lh] w-full rounded-lg',
      },
    },
    defaultVariants: { variant: 'text' },
  },
);

export interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  /** Extra klasser (bredd, text-storlek för lh-skalan) — merge:as efter varianten. */
  className?: string;
}

/**
 * Skeleton — laddblock-primitiv för Lugnt laddläge (ORDLISTA;
 * DESIGN-SYSTEM-SPEC §15, PRD TASK-8 beslut 5–6).
 *
 * Förenklade block-former som reserverar det kommande innehållets
 * slutdimensioner: `text` (en textrad), `number` (ett tal), `listRow`
 * (en listrad). Höjderna är lh-baserade och följer omgivande typografi —
 * ett `number`-block i en `text-3xl`-rad blir talets exakta line-box.
 *
 * Tillgänglighet — Roselli-mönstret (aria-busy honoreras sällan ensam):
 * blocket är ALLTID `aria-hidden` (dekorativt); konsumenten äger
 * innehålls-containern som laddar och sätter `aria-busy` + ett visuellt
 * dolt textbesked på den. Skeleton renderas från första bildrutan —
 * ingen framträdande-fördröjning (task-8.1:s mätlåsta formbeslut).
 *
 * @example
 * ```tsx
 * <div aria-busy={isPending}>
 *   {isPending ? (
 *     <>
 *       <span className="sr-only">Laddar nästa event…</span>
 *       <Skeleton variant="text" />
 *       <Skeleton variant="text" className="w-3/5" />
 *     </>
 *   ) : (
 *     <EventMeta … />
 *   )}
 * </div>
 * ```
 */
export function Skeleton({ variant, className }: SkeletonProps) {
  return <span aria-hidden="true" className={cn(skeletonVariants({ variant }), className)} />;
}
