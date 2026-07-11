import { useMemo } from 'react';
import { PaymentStatus } from '@/domain/types/Status';
import { DashboardCard } from './DashboardCard';
import { useDashboardRegistrations } from './useDashboardData';

/**
 * "Obetalda anmälningsavgifter"-card till K10-facitet (task-4.3 AC #5;
 * designen låst S55 Del 12): BARA antalet, text-3xl semibold, under
 * kortrubriken — namnraden från A-skelettet utgick med facitet (vem som är
 * obetald hör till handläggningsvyerna, översikten svarar bara "hur många").
 * Antalet är TEXT-innehåll under kortets h2-etikett — aldrig enbart färg.
 *
 * Obetald-indikator: `anmalningsavgift === 'Ej mottagen'` (`PaymentStatus.EJ_MOTTAGEN`).
 * Fält-formen verifierad mot `docs/reference/data-model.md:193`: `Anmälningsavgift`
 * är en **singleSelect** (Mottagen / Ej mottagen) — INTE formel/rollup → läs/jämför
 * tryggt. "Ej relevant (för föreläsningar)" räknas EJ som obetald (ingen avgift tas
 * ut). Ingen status-blandning (Avbokad/Inställt filtreras inte bort — samma
 * temporal/status-renhet som övriga cards; en ev. snävning är ett medvetet senare val).
 *
 * Tom-säkert: 0 obetalda → antalet "0" (facit-formen är siffran ensam).
 */
export function ObetaldaCard() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const antal = useMemo(() => {
    if (!data) return 0;
    return data.filter((reg) => reg.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN).length;
  }, [data]);

  return (
    <DashboardCard
      title="Obetalda anmälningsavgifter"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar obetalda avgifter…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      <p className="font-semibold text-3xl">{antal}</p>
    </DashboardCard>
  );
}
