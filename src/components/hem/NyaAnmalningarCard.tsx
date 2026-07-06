import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  displayName,
  inskickadDatum,
  inskickadTid,
} from '@/components/registrations/registration-display';
import { DashboardCard } from './DashboardCard';
import { useDashboardRegistrations } from './useDashboardData';

/** Hur många senaste anmälningar översikten visar. */
const MAX_RADER = 5;

/**
 * "Nya anmälningar"-card — A-skelettets helbredds-listkort (task-1.3):
 * etikett-över-värde-rader med TUNNA AVDELARE mellan raderna, och varje rad
 * med event-koppling är en LÄNK till det eventets anmälda-vy (AC #3;
 * `Registration.eventId` bärs redan av läs-modellen, TASK-1 beslut 4). Rad
 * utan event-koppling renderas OLÄNKAD med fallback-texten "Utan event" —
 * uppgiften saknas synligt i stället för en död länk eller tom lucka.
 *
 * Raderna är de SENASTE anmälningarna, recency-baserat via `Inskickad`-fältet
 * (dateTime, satt av create-registration), fallande, topp 5. RECENCY, inte
 * `flagga`-fältet ("Ny anmälan"): kortet svarar på "vad har kommit in
 * nyligen", inte på en handläggnings-flagga. Ingen status-blandning (samma
 * temporal-renhet som 6b:s event-filter, T14-disciplinen).
 *
 * Läser: namn (namn ▸ förnamn+efternamn ▸ "Namn saknas"), `eventNamn`,
 * `inskickad`, `eventId` (länkmålet). Tom/null-säkert: tom lista → vänlig
 * tom-text; saknad `inskickad` sorteras sist.
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
        <ul className="mt-2 flex flex-col">
          {senaste.map((reg, i) => {
            const datum = inskickadDatum(reg);
            return (
              <li
                key={reg.id}
                className={
                  i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
                }
              >
                {reg.eventId ? (
                  <Link
                    to="/event/$eventId/anmalda"
                    params={{ eventId: reg.eventId }}
                    className="group flex flex-col gap-0.5 py-2"
                  >
                    <span className="font-medium group-hover:underline">{displayName(reg)}</span>
                    <span className="text-small text-text-muted">
                      {[reg.eventNamn, datum].filter(Boolean).join(' · ') || 'Uppgift saknas'}
                    </span>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-0.5 py-2">
                    <span className="font-medium">{displayName(reg)}</span>
                    <span className="text-small text-text-muted">
                      {['Utan event', datum].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
