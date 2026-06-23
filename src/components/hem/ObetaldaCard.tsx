import { useMemo } from 'react';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus } from '@/domain/types/Status';
import { DashboardCard } from './DashboardCard';
import { useDashboardRegistrations } from './useDashboardData';

/** Hur många obetalda översikten listar med namn (resten sammanfattas i antalet). */
const MAX_RADER = 5;

/** Visningsnamn ur de namnfält Airtable kan leverera — aldrig record-ID/tomt (Gunilla). */
function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

/**
 * "Obetalda avgifter"-card (Fas 6d L1) — anmälningar med obetald anmälningsavgift.
 *
 * Obetald-indikator: `anmalningsavgift === 'Ej mottagen'` (`PaymentStatus.EJ_MOTTAGEN`).
 * Fält-formen verifierad mot `docs/reference/data-model.md:193`: `Anmälningsavgift`
 * är en **singleSelect** (Mottagen / Ej mottagen) — INTE formel/rollup → läs/jämför
 * tryggt. "Ej relevant (för föreläsningar)" räknas EJ som obetald (ingen avgift tas
 * ut). Ingen status-blandning (Avbokad/Inställt filtreras inte bort i L1 — samma
 * temporal/status-renhet som övriga cards; en ev. snävning är ett medvetet senare val).
 *
 * Visar antal som TEXT (översikt, aldrig enbart färg) + topp 5 namn. Tom-säkert.
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
      {obetalda.length === 0 ? (
        <p className="text-small text-text-muted">Inga obetalda avgifter.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-small text-text-muted">
            {`${obetalda.length} ${obetalda.length === 1 ? 'obetald avgift' : 'obetalda avgifter'}`}
          </p>
          <ul className="flex flex-col gap-2">
            {obetalda.slice(0, MAX_RADER).map((reg) => (
              <li key={reg.id} className="flex flex-col gap-0.5 border-text-muted/20 border-b pb-2">
                <span className="font-medium">{displayName(reg)}</span>
                {reg.eventNamn ? (
                  <span className="text-small text-text-muted">{reg.eventNamn}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardCard>
  );
}
