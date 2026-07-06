import { CTA } from './CTA';
import { Greeting } from './Greeting';
import { NastaEventCard } from './NastaEventCard';
import { NyaAnmalningarCard } from './NyaAnmalningarCard';
import { ObetaldaCard } from './ObetaldaCard';
import { RefreshButton } from './RefreshButton';

/**
 * Hem — A-skelettet (task-1.3; prototypvinnaren S52 Del 4, referens `bf705f2`):
 * hälsningskort (stort "Hej {namn}" + uppdatera-kontroll) → Nästa event
 * (primär-tint, helkorts-klickbart) bredvid Obetalda avgifter (antalet stort)
 * → helbredds-listkortet Nya anmälningar (rad-länkar till eventets anmälda-vy)
 * → stor helbredds-CTA sist. Vertikal stapling, max två kort i rad (FK-mixen),
 * tonala kortytor utan kantlinjer, generös hörnradie. Data mot BEFINTLIGA
 * read-EF via router-context-DI (ADR-055); poll-lagret (ADR-017 + erratum)
 * återanvänds oförändrat i `useDashboardData`/RefreshButton (TASK-1 beslut 9).
 *
 * A11y (vy-ribba 11/10/10, Tillgänglighet 11):
 * - `<h1>` = hälsningen (AC #6 — ingen "Hem"-rubrik). INGEN programmatisk
 *   h1-fokus vid montering — /hem är default-landningsytan, så fokus-stöld
 *   skulle slå ut app-skalets skip-länk (skip-link-först-tab-ordning).
 *   Skal-navigations-a11y bärs av RouteAnnouncer + `staticData.title` ("Hem").
 * - Rubrik-hierarki h1 → h2 (varje card är en `<section>` med egen `<h2>`).
 * - Varje cards laddnings-/fel-tillstånd annonseras via `role=status`/`role=alert`
 *   inifrån DashboardCard.
 * - Tonala ytor utan kantlinjer får synlig gräns under `prefers-contrast: more`
 *   och vid utskrift (border-transparent-mönstret — layoutstabilt).
 */
export function Hem() {
  return (
    <section className="flex flex-col gap-3 p-4">
      {/* Hälsningskortet (A-skelettet: FK:s namnkort) — h1 + manuell refresh
          (ADR-017 §2 per erratum; poll-lagret håller datan färsk automatiskt). */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-bg-muted p-6 contrast-more:border-border-strong print:border-border-strong">
        <Greeting />
        <RefreshButton />
      </div>

      {/* Max två kort i rad (FK-mixen): Nästa event (primär-tint) | Obetalda. */}
      <div className="grid grid-cols-2 gap-3">
        <NastaEventCard />
        <ObetaldaCard />
      </div>

      <NyaAnmalningarCard />

      <CTA />
    </section>
  );
}
