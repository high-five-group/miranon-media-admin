import { useMemo } from 'react';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus } from '@/domain/types/Status';
import { DashboardCard } from './DashboardCard';
import { useDashboardRegistrations } from './useDashboardData';

/** Hur många obetalda som namnges under antalet (resten sammanfattas med "…"). */
const MAX_NAMN = 2;

/** Visningsnamn ur de namnfält Airtable kan leverera — aldrig record-ID/tomt (Gunilla). */
function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

/**
 * "Obetalda avgifter"-card — A-skelettets etikett-över-värde-form (task-1.3,
 * berättelse 4): ANTALET stort och tydligt, de första namnen under (resten
 * antyds med "…"). Antalet är TEXT-innehåll under kortets h2-etikett —
 * översikt, aldrig enbart färg.
 *
 * Obetald-indikator: `anmalningsavgift === 'Ej mottagen'` (`PaymentStatus.EJ_MOTTAGEN`).
 * Fält-formen verifierad mot `docs/reference/data-model.md:193`: `Anmälningsavgift`
 * är en **singleSelect** (Mottagen / Ej mottagen) — INTE formel/rollup → läs/jämför
 * tryggt. "Ej relevant (för föreläsningar)" räknas EJ som obetald (ingen avgift tas
 * ut). Ingen status-blandning (Avbokad/Inställt filtreras inte bort — samma
 * temporal/status-renhet som övriga cards; en ev. snävning är ett medvetet senare val).
 *
 * Tom-säkert: 0 obetalda → stort "0" + vänlig text under.
 */
export function ObetaldaCard() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const obetalda = useMemo(() => {
    if (!data) return [];
    return data.filter((reg) => reg.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN);
  }, [data]);

  return (
    <DashboardCard
      title="Obetalda avgifter"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar obetalda avgifter…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-3xl">{obetalda.length}</p>
        <p className="text-small text-text-muted">
          {obetalda.length === 0
            ? 'Inga obetalda avgifter.'
            : obetalda
                .slice(0, MAX_NAMN)
                .map((reg) => displayName(reg))
                .join(', ') + (obetalda.length > MAX_NAMN ? ' …' : '')}
        </p>
      </div>
    </DashboardCard>
  );
}
