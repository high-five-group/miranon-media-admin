import { createFileRoute } from '@tanstack/react-router';
import { VariantD } from '@/components/segment/prototyp/VariantD';

export const Route = createFileRoute('/_authenticated/mer/segment')({
  staticData: { title: 'Segment' },
  component: SegmentPage,
});

/**
 * Mer — Segment-byggar-yta (Fas 6g L2, promoverad TASK-249.5): /mer/segment.
 * Bygger med/utan-predikat över event-domänens taxonomi + basdimensionerna
 * (Kursfamilj/Kursnivå) och räknar matchande personer via compute-segment-EF:s
 * DNF-stöd (ADR-115). Formen bor i VariantD; routen håller bara montering.
 * <Outlet/> bärs av _authenticated via AppShell.
 *
 * DIVERGENS-PASSETS STÄLLNING ÄR RIVEN (TASK-249.6, ADR-103): varianterna
 * a/b/c, `SegmentPrototyp`-växeln och dess `?variant=`-nyckel samt
 * rail-monteringen togs bort när den godkända formen väl var den skarpa
 * ytan. Det som revs var FLAGGOR OCH VÄXLAR — aldrig formen: `VariantD`
 * renderas här ovillkorligt, exakt som flippen lämnade den, och
 * promoverings-grindens ariaSnapshot-referenser
 * (`tests/visual/segment-promoverings-grind.spec.ts`) är beviset för att
 * ytan står oförändrad genom rivningen.
 */
function SegmentPage() {
  return <VariantD />;
}
