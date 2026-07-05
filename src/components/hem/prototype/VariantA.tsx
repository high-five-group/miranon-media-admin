import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus } from '@/domain/types/Status';
import { RefreshButton } from '../RefreshButton';
import { useDashboardEvents, useDashboardRegistrations } from '../useDashboardData';

/**
 * [PROTOTYPE] Variant A — "FK-hemmet" (trogen FK:s Hem-arrangemang).
 *
 * Struktur: hälsningsKORT överst (stort namn + refresh, som FK:s namnkort med
 * klockan) → 2-i-rad infokort med etikett-över-fetstilt-värde (Nästa event |
 * Obetalda) → helbredds-listkort (Nya anmälningar, dividers) → stor
 * helbredds-CTA med chevron sist. Tonala ytor utan borders (FK-känslan),
 * generös hörnradie. Allt via tokens.
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

export function VariantA({ namn }: { namn: string }) {
  const events = useDashboardEvents();
  const regs = useDashboardRegistrations();

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
    return [...regs.data].sort((a, b) => inskickadTid(b) - inskickadTid(a)).slice(0, 5);
  }, [regs.data]);

  const obetalda = useMemo(() => {
    if (!regs.data) return [];
    return regs.data.filter((r) => r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN);
  }, [regs.data]);

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-3 p-4 pb-24">
      {/* Hälsningskortet (FK: namnkortet med klockan) */}
      <div className="flex items-center justify-between rounded-2xl bg-bg-muted p-6">
        <h1 className="font-semibold text-3xl">Hej {namn}!</h1>
        <RefreshButton />
      </div>

      {events.isPending || regs.isPending ? (
        <p role="status" className="p-2 text-text-muted">
          Laddar översikten…
        </p>
      ) : events.isError || regs.isError ? (
        <p className="p-2 text-text-muted">Kunde inte hämta översikten. Prova att uppdatera.</p>
      ) : (
        <>
          {/* 2-i-rad: etikett över fetstilt värde (FK: Nästa utbetalning | Föräldrasidan) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-2xl bg-bg-muted p-4">
              <span className="text-small text-text-muted">Nästa event</span>
              {nasta == null ? (
                <span className="font-semibold text-lg">Inga kommande</span>
              ) : (
                <>
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: nasta.id }}
                    className="font-semibold text-lg underline-offset-2 hover:underline"
                  >
                    {eventName(nasta)}
                  </Link>
                  <span className="text-small">
                    {[nasta.startdatum, nasta.ort].filter(Boolean).join(' · ') || 'Datum ej satt'}
                  </span>
                  <span className="text-small text-text-muted">
                    {nasta.maxPlatser == null
                      ? `${nasta.antalAnmalda} anmälda`
                      : `${nasta.antalAnmalda} av ${nasta.maxPlatser} platser`}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-bg-muted p-4">
              <span className="text-small text-text-muted">Obetalda avgifter</span>
              <span className="font-semibold text-3xl">{obetalda.length}</span>
              <span className="text-small text-text-muted">
                {obetalda.length === 0
                  ? 'Allt är betalt'
                  : obetalda
                      .slice(0, 2)
                      .map((r) => displayName(r))
                      .join(', ') + (obetalda.length > 2 ? ' …' : '')}
              </span>
            </div>
          </div>

          {/* Helbredds-listkort (FK: Mina barn-kortet) */}
          <div className="flex flex-col gap-3 rounded-2xl bg-bg-muted p-4">
            <h2 className="text-small text-text-muted">Nya anmälningar</h2>
            {senaste.length === 0 ? (
              <p className="text-small">Inga anmälningar än.</p>
            ) : (
              <ul className="flex flex-col">
                {senaste.map((reg, i) => (
                  <li
                    key={reg.id}
                    className={`flex flex-col gap-0.5 py-2 ${i > 0 ? 'border-border-light border-t' : ''}`}
                  >
                    <span className="font-medium">{displayName(reg)}</span>
                    <span className="text-small text-text-muted">
                      {[reg.eventNamn, inskickadDatum(reg)].filter(Boolean).join(' · ') ||
                        'Uppgift saknas'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Stor helbredds-CTA med chevron (FK: Ansök om vab) */}
      <Link
        to="/event"
        className="text-(color:--mm-btn-cta-text) flex min-h-14 items-center justify-between rounded-2xl bg-(--mm-btn-cta-bg) px-6 py-4 font-semibold text-lg transition-colors hover:bg-(--mm-btn-cta-hover)"
      >
        Visa alla event
        <span aria-hidden="true">›</span>
      </Link>
    </section>
  );
}
