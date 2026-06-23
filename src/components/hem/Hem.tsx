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
 * Containern äger sid-identiteten (`<h1>Hem</h1>`) och komponerar delarna; varje
 * card bär sin egen data + pending/empty/error-yta (logiken bor i komponenten,
 * speglar 6a/6c). NyaAnmalningar- och Obetalda-cardet delar samma registrerings-
 * query (`queryKeys.dashboard.registrations`) → dedupas till EN fetch.
 *
 * A11y (vy-ribba 11/10/10, Tillgänglighet 11):
 * - `<h1>` = "Hem". INGEN programmatisk h1-fokus vid montering — /hem är
 *   default-landningsytan, så fokus-stöld skulle slå ut app-skalets skip-länk
 *   (skip-link-först-tab-ordning). Skal-navigations-a11y bärs i stället av
 *   RouteAnnouncer + `staticData.title` (speglar EventsList, som inte heller
 *   auto-fokuserar h1). Sub-detalj-vyer (Waitlist/EventRegistrations) flyttar fokus
 *   eftersom de NÅS via navigation; landningsytan ska inte stjäla fokus.
 * - Rubrik-hierarki h1 → h2 (varje card är en `<section>` med egen `<h2>`).
 * - Varje cards laddnings-/fel-tillstånd annonseras via `role=status`/`role=alert`
 *   inifrån DashboardCard.
 * - Cards-rutnätet kollapsar till en kolumn på små skärmar (responsivt, tangentbord
 *   + skärmläsare ser samma semantik oavsett bredd).
 */
export function Hem() {
  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl">Hem</h1>
        <Greeting />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NyaAnmalningarCard />
        <NastaEventCard />
        <ObetaldaCard />
      </div>

      <CTA />
    </section>
  );
}
