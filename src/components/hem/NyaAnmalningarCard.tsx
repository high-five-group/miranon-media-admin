import { useMemo } from 'react';
import type { Registration } from '@/domain/models/Registration';
import { DashboardCard } from './DashboardCard';
import { useDashboardRegistrations } from './useDashboardData';

/** Hur många senaste anmälningar översikten visar. */
const MAX_RADER = 5;

/** Visningsnamn ur de namnfält Airtable kan leverera — aldrig record-ID/tomt (Gunilla). */
function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

/** Inskickad-tid för sort; null/ogiltigt → -Infinity (hamnar sist vid fallande sort). */
function inskickadTid(reg: Registration): number {
  if (!reg.inskickad) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

/** Inskickad som läsbart sv-SE-datum (Gunilla: aldrig rå ISO); null/ogiltigt → null. */
function inskickadDatum(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('sv-SE');
}

/**
 * "Nya anmälningar"-card (Fas 6d L1) — de SENASTE anmälningarna, recency-baserat
 * via `Inskickad`-fältet (dateTime, satt av create-registration), fallande,
 * topp 5. RECENCY, inte `flagga`-fältet ("Ny anmälan"): kortet svarar på "vad
 * har kommit in nyligen", inte på en handläggnings-flagga. Ingen status-blandning
 * (samma temporal-renhet som 6b:s event-filter, T14-disciplinen).
 *
 * Läser: namn (namn ▸ förnamn+efternamn ▸ "Namn saknas"), `eventNamn`, `inskickad`.
 * Tom/null-säkert: tom lista → vänlig tom-text; saknad `inskickad` sorteras sist.
 */
export function NyaAnmalningarCard() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const senaste = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => inskickadTid(b) - inskickadTid(a)).slice(0, MAX_RADER);
  }, [data]);

  return (
    <DashboardCard
      title="Nya anmälningar"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar nya anmälningar…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      {senaste.length === 0 ? (
        <p className="text-small text-text-muted">Inga anmälningar än.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {senaste.map((reg) => {
            const datum = inskickadDatum(reg);
            return (
              <li key={reg.id} className="flex flex-col gap-0.5 border-text-muted/20 border-b pb-2">
                <span className="font-medium">{displayName(reg)}</span>
                <span className="text-small text-text-muted">
                  {[reg.eventNamn, datum].filter(Boolean).join(' · ') || 'Uppgift saknas'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
