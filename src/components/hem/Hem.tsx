import { CTA } from './CTA';
import { Greeting } from './Greeting';
import { NastaEventCard } from './NastaEventCard';
import { NyaAnmalningarCard } from './NyaAnmalningarCard';
import { ObetaldaCard } from './ObetaldaCard';

/**
 * Hem — K10-facit-strukturen (task-4.2; designen låst S55 Del 12, referens
 * `bb31a12`): header-fri skärm-centrerad kolumn, hälsningskort ("Hej {namn}"
 * utan utropstecken) → Nästa event (primär-tint,
 * helkorts-klickbart) bredvid Obetalda avgifter (antalet stort) →
 * helbredds-listkortet Nya anmälningar → stor helbredds-CTA sist. Vertikal
 * stapling, max två kort i rad (FK-mixen), tonala kortytor utan kantlinjer,
 * generös hörnradie. Data mot BEFINTLIGA read-EF via router-context-DI
 * (ADR-055); poll-lagret (ADR-017 + erratum) bär färskheten ENSAMT — den
 * manuella uppdatera-kontrollen utgick med B5 (ADR-017 Updates-noten).
 *
 * Geometrin mot K10-facitets kolumn (`p-4 pt-6 pb-24 lg:pt-14` på 600-boxen):
 * skalets main bär px-4 + pt-4 + pb-24 → sektionen adderar pt-2 (mobil,
 * totalt pt-6) och lg:pt-10 (desktop, totalt pt-14) och bär ingen egen
 * sidopadding (facitets inset = 16 px, inte A-skelettets dubblerade 32 px).
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
 *
 * K10-facit-avvikelse (ÖPPET bokförd, task-9.3): facitet visar en
 * "Mina sidor"-platshållarknapp i hälsningskortet (task-4 beslut 4), men den
 * är RIVEN — Marcus-kvitterat per T69 Revision S64 punkt 3, sedan
 * "Mina sidor" omdefinierades till hela appen (ORDLISTA) och destinationen
 * upplöstes. Platsen är konceptuellt reserverad för notis-klockan (T77);
 * INGEN ersättare byggs här.
 */

export function Hem() {
  return (
    <section className="flex flex-col gap-3 pt-2 lg:pt-10">
      {/* Hälsningskortet (K10: FK:s namnkort) — h1; platshållar-ytan riven (task-9.3). */}
      <div className="rounded-2xl border border-transparent bg-bg-muted p-6 contrast-more:border-border-strong print:border-border-strong">
        <Greeting />
      </div>

      {/* Max två kort i rad (FK-mixen): Nästa event (primär-tint) | Obetalda. */}
      <div className="grid grid-cols-2 gap-3">
        <NastaEventCard />
        <ObetaldaCard />
      </div>

      <NyaAnmalningarCard />

      <CTA />

      {/* Versionsraden (B-NYTT2): diskret nere till vänster, ENDAST desktop
          (mobilen behåller dagens form); versionen build-injicerad ur
          paketmanifestet — aldrig hårdkodad. */}
      <span className="fixed bottom-4 left-4 hidden text-caption text-text-muted lg:block">
        Miranon Media Admin v{__APP_VERSION__}
      </span>
    </section>
  );
}
