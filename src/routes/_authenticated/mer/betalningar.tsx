import { createFileRoute, redirect } from '@tanstack/react-router';
import { BetalningsInkorg } from '@/components/betalningar/BetalningsInkorg';
import { betalningarPa } from '@/lib/funktionsflaggor';

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
  beforeLoad: () => {
    if (!betalningarPa()) throw redirect({ to: '/mer' });
  },
  component: BetalningarPage,
});

function BetalningarPage() {
  return <BetalningsInkorg />;
}
