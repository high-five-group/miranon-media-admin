import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { BetalningsInkorg } from '@/components/betalningar/BetalningsInkorg';
import { betalningarPa } from '@/lib/funktionsflaggor';

/**
 * FILTER-AXLARNA DEKLARERAS EXPLICIT — samma kontrakt som
 * `/mer/anmalningar` (TASK-299.5), av samma skäl fast i förebyggande form.
 *
 * Inkorgens list-filtrering bär fyra axlar via `nuqs`
 * (`?period`/`?typ`/`?ort`/`?event`), och `nuqs` skriver dem genom ROUTERN
 * (`NuqsAdapter` från `nuqs/adapters/tanstack-router` i `__root.tsx`), inte
 * direkt mot `window.location`. TanStack Router använder `validateSearch`s
 * RETURVÄRDE som sidans search-state, och `z.object()` STRIPPAR okända
 * nycklar — så på anmälningssidan dog varje filterval i samma andetag det
 * gjordes, tills axlarna deklarerades.
 *
 * SKILLNADEN HÄR, ÖPPET SAGD: denna route hade INGEN `validateSearch` alls
 * före denna ändring, så ingenting ströps — nuqs hade fungerat utan
 * schemat. Deklarationen tillför alltså inget beteende i dag; den gör
 * kontraktet EXPLICIT och gör en framtida parameter på denna route säker att
 * lägga till. Att i stället införa schemat vid det tillfället är precis den
 * ordning som kostade anmälningssidan en felsökning.
 *
 * `z.string()` och inte snävare typer: värderymden ägs av `FilterRad`/
 * `EventValjare` och härleds ur DATAN (eventens typ/ort, record-ID:n), inte
 * av routen. Ett okänt värde är redan inert i komponenten — det matchar ingen
 * rad — så en andra, duplicerad validering här hade bara kunnat glida isär
 * från den första.
 */
const betalningarSearchSchema = z.object({
  period: z.string().optional(),
  typ: z.string().optional(),
  ort: z.string().optional(),
  event: z.string().optional(),
});

/**
 * [TASK-346.6 AC #1] Inkorgen: `/mer/betalningar`, BAKOM MILJÖFLAGGAN.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FLAGGAN GATAR ROUTEN, INTE BARA LÄNKEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Att bara dölja raden i Mer-listan hade lämnat adressen öppen: ett bokmärke,
 * en delad länk eller en gissad URL hade nått ytan i prod, där varken
 * migrationerna, Vault-hemligheten eller cron-posten finns än (ADR-129 §
 * Negativa och skuld). Vyn hade då inte varit halvfärdig utan trasig - exakt
 * det PRD:ns användarberättelse 36 finns för att förhindra.
 *
 * `beforeLoad` och inte ett tidigt `return null` i komponenten: en redirect
 * körs FÖRE route-chunken hämtas, så prod laddar aldrig ens koden.
 *
 * `throw redirect` till `/mer` och inte en 404: ytan EXISTERAR, den är bara
 * inte påslagen än. Att skicka Lotta till menyn hon kom ifrån är det enda
 * begripliga svaret på en adress som inte gäller för henne.
 *
 * Rivs av TASK-346.12 tillsammans med resten av flaggan - se
 * `src/lib/funktionsflaggor.ts` § RIVNINGSNOT punkt 4.
 */
export const Route = createFileRoute('/_authenticated/mer/betalningar')({
  staticData: { title: 'Betalningar' },
  validateSearch: betalningarSearchSchema,
  beforeLoad: () => {
    if (!betalningarPa()) throw redirect({ to: '/mer' });
  },
  component: BetalningarPage,
});

function BetalningarPage() {
  return <BetalningsInkorg />;
}
