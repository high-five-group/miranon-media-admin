import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin } from 'lucide-react';
import { MessageBox, Skeleton } from '@/components/primitives';
import type { Event } from '@/domain/models/Event';
import { belaggningAndel, dagarKvarText } from './hem-derivations';
import type { useDashboardEvents } from './useDashboardData';

/**
 * "Nästa event" — Morgonkollens hero-block, fullbredd, tonal `primary-tint`-
 * yta (TASK-243.1, promoverad ur `dev/hem-prototyp/VariantRo.tsx`, facit
 * "hem-vyn V1 Lugna morgonen"). Dagar-kvar-formen står som en egen rad under
 * eventnamnet (INTE en positionerad pill — det var K10-facitets form, riven
 * med `NastaEventCard.tsx`).
 */
export function NastaEvent({
  eventsQuery,
  nasta,
  idagStart,
}: {
  eventsQuery: ReturnType<typeof useDashboardEvents>;
  nasta: Event | null;
  idagStart: number;
}) {
  const belagda = nasta?.antalAnmalda ?? 0;
  const maxPlatser = nasta?.maxPlatser ?? null;
  const andel = belaggningAndel(belagda, maxPlatser);

  return (
    <section
      aria-labelledby="hem-nasta-event"
      // Hover = en aning mörkare guld (samma color-mix-teknik som
      // PersonDetail.tsx redan etablerat för en yta med egen tonal bakgrund):
      // appens 6 %-steg blandas in i --mm-primary-tint i stället för att
      // ersätta det med --mm-state-hover som ett lager ovanpå.
      className="flex min-w-0 flex-col gap-4 rounded-3xl border border-transparent bg-primary-tint p-8 hover:bg-[color-mix(in_srgb,var(--mm-text)_6%,var(--mm-primary-tint))] motion-safe:transition-colors contrast-more:border-border-strong print:border-border-strong"
    >
      <h2
        id="hem-nasta-event"
        className="font-medium text-caption text-text-secondary uppercase tracking-wide"
      >
        Nästa event
      </h2>
      {eventsQuery.isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Laddar nästa event…</span>
          <Skeleton variant="text" className="w-3/4 text-3xl" />
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="h-1.5 w-full rounded-full" />
        </div>
      ) : eventsQuery.isError ? (
        <MessageBox intent="error" title="Kunde inte hämta event">
          {eventsQuery.error instanceof Error
            ? eventsQuery.error.message
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      ) : nasta == null ? (
        <p className="text-body text-text-secondary">Inga kommande event just nu.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Link
              to="/event/$eventId"
              params={{ eventId: nasta.id }}
              className="font-semibold text-3xl underline-offset-4 hover:underline"
            >
              {nasta.eventNamn ?? nasta.eventlabel ?? 'Namnlöst event'}
            </Link>
            <span className="font-medium text-body text-text-secondary">
              {nasta.startdatum
                ? dagarKvarText(new Date(nasta.startdatum).getTime(), idagStart)
                : null}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-body text-text-secondary">
            {nasta.ort ? (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" size={16} className="shrink-0" />
                {nasta.ort}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={16} className="shrink-0" />
              {nasta.startdatum
                ? new Intl.DateTimeFormat('sv-SE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(nasta.startdatum))
                : 'Datum ej satt'}
            </span>
          </div>
          {maxPlatser != null ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-caption text-text-secondary">
                {belagda} av {maxPlatser} platser reserverade
              </span>
              <div aria-hidden="true" className="h-1.5 rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary-muted"
                  style={{ width: `${andel}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
