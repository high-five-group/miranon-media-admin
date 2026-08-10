/**
 * [PROTOTYPE] S104 divergens — VARIANT C: SEGMENT SOM ENTITET. KASTBAR KOD.
 *
 * SVARET DENNA VARIANT GER: "segment är SAKER du äger och återanvänder, som
 * event." Den primära handlingen är att VÄLJA ETT SEGMENT OCH AGERA PÅ DET.
 * Sparade segment är sidan; att bygga nytt och att skicka är egna flöden.
 *
 * Detta är den variant som prövar det snitt Marcus redan satt precedens för:
 * `TASK-145.3` rev batch-bekräftelsen ur eventsidan med motiveringen "allt som
 * VERKSTÄLLER något bor på Åtgärds-sidan", och `TASK-145.4` konsoliderade
 * betalningar in i registret. Bygga ≠ verkställa.
 *
 * Fullständig märkning, frågan och det bindande premissunderlaget:
 * `src/components/segment/SegmentPrototyp.tsx` +
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md`.
 */
export function VariantC() {
  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <p className="px-4 text-text-muted">Variant C — segment som entitet. Ej byggd än.</p>
    </section>
  );
}
