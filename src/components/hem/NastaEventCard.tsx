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
 * "Nästa event"-card — det närmast kommande eventet, i A-skelettets
 * primär-tint (variant C-mixen, TASK-1 beslut 3) och klickbart i sin HELHET
 * till eventets detaljsida (AC #2): länken är eventnamnet, klick-ytan
 * sträcks över hela kortet via `after:inset-0` mot DashboardCards
 * `relative` — EN länk-yta, inga nästlade länkar, och skärmläsare får ett
 * rent länknamn (eventnamnet) i stället för hela kortets text. I pending-/
 * fel-/tom-läge finns ingen länk → kortet är då inte klickbart (korrekt:
 * det finns inget mål).
 *
 * "Nästa kommande" avgörs TEMPORALT: tidigaste `startdatum` ≥ idag
 * (dagsstart), INTE via `status`-enumet (Planerat/Genomfört/Inställt/Flyttat
 * är planeringstillstånd, inte temporalt). Detta speglar EXAKT 6b:s
 * dokumenterade filter-beslut (EventsList: "upcoming härleds ur startdatum
 * vs idag — INTE ur status-enumet") → ingen NY T14-krock införs. Event utan
 * startdatum räknas aldrig som "nästa" (startTid → Infinity, sist).
 *
 * Läser: namn, `startdatum`, `ort`, beläggning (`antalAnmalda`/`maxPlatser`).
 * Tom-säkert: inga kommande event → vänlig tom-text.
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
      tone="primary"
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
            className="font-semibold text-lg underline-offset-2 after:absolute after:inset-0 hover:underline"
          >
            {eventName(nasta)}
          </Link>
          <span className="text-small">
            {[nasta.startdatum, nasta.ort].filter(Boolean).join(' · ') || 'Datum ej satt'}
          </span>
          <span className="text-small text-text-muted">{belaggningText(nasta)}</span>
        </div>
      )}
    </DashboardCard>
  );
}
