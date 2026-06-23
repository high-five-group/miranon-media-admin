import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { Event } from '@/domain/models/Event';
import { DashboardCard } from './DashboardCard';
import { useDashboardEvents } from './useDashboardData';

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** Startdatum-tid; null/ogiltigt → Infinity (sorteras sist, räknas aldrig som "nästa"). */
function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Beläggning som TEXT (färg aldrig ensam bärare). Null-säker (speglar EventsList). */
function belaggningText(e: Event): string {
  if (e.maxPlatser == null) return `${e.antalAnmalda} anmälda (platser ej satt)`;
  return `${e.antalAnmalda} av ${e.maxPlatser} platser`;
}

/**
 * "Nästa event"-card (Fas 6d L1) — det närmast kommande eventet.
 *
 * "Nästa kommande" avgörs TEMPORALT: tidigaste `startdatum` ≥ idag (dagsstart),
 * INTE via `status`-enumet (Planerat/Genomfört/Inställt/Flyttat är
 * planeringstillstånd, inte temporalt). Detta speglar EXAKT 6b:s dokumenterade
 * filter-beslut (EventsList: "upcoming härleds ur startdatum vs idag — INTE ur
 * status-enumet") → ingen NY T14-krock införs; samma medvetna temporal-renhet.
 * Event utan startdatum räknas aldrig som "nästa" (startTid → Infinity, sist).
 *
 * Läser: namn, `startdatum`, `ort`, beläggning (`antalAnmalda`/`maxPlatser`).
 * Tom-säkert: inga kommande event → vänlig tom-text. Länk till eventets info-vy.
 */
export function NastaEventCard() {
  const { data, isPending, isError, error } = useDashboardEvents();

  const nasta = useMemo<Event | null>(() => {
    if (!data) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();
    const kommande = data
      .filter((e) => startTid(e) >= todayStart) // Infinity (null) → aldrig "kommande"
      .sort((a, b) => startTid(a) - startTid(b));
    return kommande[0] ?? null;
  }, [data]);

  return (
    <DashboardCard
      title="Nästa event"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar nästa event…"
      errorTitle="Kunde inte hämta event"
    >
      {nasta == null ? (
        <p className="text-small text-text-muted">Inga kommande event.</p>
      ) : (
        <div className="flex flex-col gap-1">
          <Link
            to="/event/$eventId"
            params={{ eventId: nasta.id }}
            className="font-medium underline"
          >
            {eventName(nasta)}
          </Link>
          <span className="text-small text-text-muted">
            {[nasta.startdatum, nasta.ort].filter(Boolean).join(' · ') || 'Datum ej satt'}
          </span>
          <span className="text-small">{belaggningText(nasta)}</span>
        </div>
      )}
    </DashboardCard>
  );
}
