import { useEffect, useRef } from 'react';
import { CTA } from './CTA';
import { Greeting } from './Greeting';
import { NastaEventCard } from './NastaEventCard';
import { NyaAnmalningarCard } from './NyaAnmalningarCard';
import { ObetaldaCard } from './ObetaldaCard';

/**
 * Hem-aggregering (Fas 6d L1) — översiktsvyn på `/hem`. STATISK hämtning: greeting
 * + tre översikts-cards (nya anmälningar / nästa event / obetalda avgifter) + CTA,
 * alla mot BEFINTLIGA read-EF via router-context-DI (ADR-055). Poll-lagret
 * (refetchInterval 60s + visibility-trigger + pull-to-refresh, ADR-017) är L2 —
 * byggs INTE här.
 *
 * Containern äger sid-identiteten (`<h1>Hem</h1>` + `document.title`) och komponerar
 * delarna; varje card bär sin egen data + pending/empty/error-yta (logiken bor i
 * komponenten, speglar 6a/6c). NyaAnmalningar- och Obetalda-cardet delar samma
 * registrerings-query (`queryKeys.dashboard.registrations`) → dedupas till EN fetch.
 *
 * A11y (vy-ribba 11/10/10, Tillgänglighet 11):
 * - `<h1>` = "Hem", fokus flyttas dit vid montering (greeting är statisk → ingen
 *   väntan på data); `document.title` sätts samtidigt.
 * - Rubrik-hierarki h1 → h2 (varje card är en `<section>` med egen `<h2>`).
 * - Varje cards laddnings-/fel-tillstånd annonseras via `role=status`/`role=alert`
 *   inifrån DashboardCard.
 * - Cards-rutnätet kollapsar till en kolumn på små skärmar (responsivt, tangentbord
 *   + skärmläsare ser samma semantik oavsett bredd).
 */
export function Hem() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Hem — Miranon Media Admin';
  }, []);

  return (
    <section className="flex flex-col gap-6 p-4">
      <header className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Hem
        </h1>
        <Greeting />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NyaAnmalningarCard />
        <NastaEventCard />
        <ObetaldaCard />
      </div>

      <CTA />
    </section>
  );
}
