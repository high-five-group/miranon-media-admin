import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';
import { useDashboardEvents, useDashboardRegistrations } from '../useDashboardData';

/**
 * [PROTOTYPE] Variant C — "Agenda först" (hero-event + handlingsstack).
 *
 * Struktur: kompakt hälsningsrad → HERO-kort för nästa event (primär-tint,
 * stort namn, beläggning som outlined badge — FK: Utbetald-badgen) →
 * handlingsstacken DIREKT därefter (två stora helbredds-knappar, FK: de dubbla
 * gröna Ansök-knapparna) → resten kompakt i 2-i-rad sist. Hierarkin är
 * händelse-driven: vad händer härnäst + vad kan jag GÖRA, före detaljerna.
 */

function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

function inskickadTid(reg: Registration): number {
  if (!reg.inskickad) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

function inskickadDatum(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('sv-SE');
}

export function VariantC({ namn }: { namn: string }) {
  const events = useDashboardEvents();
  const regs = useDashboardRegistrations();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: queryKeys.dashboard.all }) > 0;

  const nasta = useMemo<Event | null>(() => {
    if (!events.data) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const kommande = events.data
      .filter((e) => startTid(e) >= now.getTime())
      .sort((a, b) => startTid(a) - startTid(b));
    return kommande[0] ?? null;
  }, [events.data]);

  const senaste = useMemo(() => {
    if (!regs.data) return [];
    return [...regs.data].sort((a, b) => inskickadTid(b) - inskickadTid(a)).slice(0, 3);
  }, [regs.data]);

  const obetalda = useMemo(() => {
    if (!regs.data) return [];
    return regs.data.filter((r) => r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN);
  }, [regs.data]);

  const uppdatera = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    alertScreenReader('Översikten uppdaterad.');
  };

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-3 p-4 pb-24">
      <h1 className="p-2 font-semibold text-2xl">Hej {namn}!</h1>

      {events.isPending || regs.isPending ? (
        <p role="status" className="p-2 text-text-muted">
          Laddar översikten…
        </p>
      ) : events.isError || regs.isError ? (
        <p className="p-2 text-text-muted">Kunde inte hämta översikten. Prova att uppdatera.</p>
      ) : (
        <>
          {/* HERO: nästa event i primär-tint med outlined beläggnings-badge */}
          <div className="flex flex-col gap-2 rounded-2xl bg-primary-tint p-6">
            <span className="text-small text-text-muted">Nästa event</span>
            {nasta == null ? (
              <span className="font-semibold text-2xl">Inga kommande event</span>
            ) : (
              <>
                <Link
                  to="/event/$eventId"
                  params={{ eventId: nasta.id }}
                  className="font-semibold text-3xl underline-offset-2 hover:underline"
                >
                  {eventName(nasta)}
                </Link>
                <span>
                  {[nasta.startdatum, nasta.ort].filter(Boolean).join(' · ') || 'Datum ej satt'}
                </span>
                <span className="w-fit rounded-full border border-border-strong px-3 py-0.5 text-small">
                  {nasta.maxPlatser == null
                    ? `${nasta.antalAnmalda} anmälda`
                    : `${nasta.antalAnmalda} av ${nasta.maxPlatser} platser`}
                </span>
              </>
            )}
          </div>

          {/* Handlingsstacken direkt efter hero (FK: dubbla Ansök-knappar) */}
          <div className="flex flex-col gap-2">
            <Link
              to="/event"
              className="text-(color:--mm-btn-cta-text) flex min-h-14 items-center justify-between rounded-2xl bg-(--mm-btn-cta-bg) px-6 py-4 font-semibold text-lg transition-colors hover:bg-(--mm-btn-cta-hover)"
            >
              Visa alla event
              <span aria-hidden="true">›</span>
            </Link>
            <button
              type="button"
              disabled={isFetching}
              onClick={uppdatera}
              className="flex min-h-14 items-center justify-between rounded-2xl border border-border bg-surface px-6 py-4 font-semibold text-lg transition-colors hover:bg-bg-muted disabled:opacity-60"
            >
              {isFetching ? 'Uppdaterar…' : 'Uppdatera översikt'}
              <span aria-hidden="true">↻</span>
            </button>
          </div>

          {/* Resten kompakt: 2-i-rad sist */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-2xl bg-bg-muted p-4">
              <span className="text-small text-text-muted">Nya anmälningar</span>
              {senaste.length === 0 ? (
                <span className="text-small">Inga än.</span>
              ) : (
                <ul className="flex flex-col gap-1">
                  {senaste.map((reg) => (
                    <li key={reg.id} className="flex flex-col">
                      <span className="font-medium text-small">{displayName(reg)}</span>
                      <span className="text-caption text-text-muted">
                        {inskickadDatum(reg) ?? 'Datum saknas'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-bg-muted p-4">
              <span className="text-small text-text-muted">Obetalda avgifter</span>
              <span className="font-semibold text-3xl">{obetalda.length}</span>
              <span className="text-caption text-text-muted">
                {obetalda.length === 0
                  ? 'Allt är betalt'
                  : obetalda
                      .slice(0, 2)
                      .map((r) => displayName(r))
                      .join(', ') + (obetalda.length > 2 ? ' …' : '')}
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
