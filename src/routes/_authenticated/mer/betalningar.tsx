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
 * en delad länk eller en gissad URL hade nått ytan i prod. [TASK-446] Här
 * stod tidigare "där varken migrationerna, Vault-hemligheten eller
 * cron-posten finns än (ADR-129 § Negativa och skuld)" — sant när ADR-129
 * skrevs (2026-08-30), FALSKT sedan prod-driftsättningen 2026-09-02
 * (`tasks/todo.md` S113: "PROD-DRIFTSÄTTNINGEN KÖRD") och migrationen
 * `TASK-367` (prod 2026-09-07): samtliga 57 EF:er, migrationerna,
 * Vault-hemligheten och cron-posten finns i prod i dag. Vakten kvarstår av
 * ett annat skäl: en gissad adress ska aldrig läcka en yta som är av avsikt
 * bakom flaggan, oavsett om infrastrukturen råkar finnas.
 *
 * `beforeLoad` och inte ett tidigt `return null` i komponenten: en redirect
 * körs FÖRE route-chunken hämtas, så en klient med flaggan av aldrig ens
 * laddar koden.
 *
 * `throw redirect` till `/mer` och inte en 404: ytan EXISTERAR. [TASK-446]
 * "inte påslagen än" var sant vid skrivtillfället men är falskt sedan S123:
 * `VITE_FEATURE_BETALNINGAR` är PÅ i prod via Vercel (källa:
 * `src/lib/funktionsflaggor.ts` § KONSEKVENSEN FÖR PROD), så redirecten
 * körs bara om flaggan någon gång stängs av igen. Att skicka Lotta till
 * menyn hon kom ifrån är fortfarande det enda begripliga svaret på en
 * adress som inte gäller när flaggan är av.
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
