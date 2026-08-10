/**
 * [PROTOTYPE] S104 divergens — VARIANT B: PUBLIKEN FÖRST. KASTBAR KOD.
 *
 * SVARET DENNA VARIANT GER: "du tittar på MÄNNISKOR hela tiden; filtret formar
 * vilka." Den primära handlingen är att SE OCH BESKÄRA PUBLIKEN. Listan av
 * personer ÄR sidan; regeln är ett filter över den.
 *
 * Detta är den variant som prövar funktionsfyndet STRUKTURELLT: handplockning
 * blir inte ett undantag utan formens naturliga konsekvens. Den är därmed den
 * starkaste prövningen av om en ADR-064-revision är värd att göra.
 *
 * Fullständig märkning, frågan och det bindande premissunderlaget:
 * `src/components/segment/SegmentPrototyp.tsx` +
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md`.
 */
export function VariantB() {
  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <p className="px-4 text-text-muted">Variant B — publiken först. Ej byggd än.</p>
    </section>
  );
}
