import { Link } from '@tanstack/react-router';
import { CircleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { DashboardCard } from './DashboardCard';
import { useDashboardEvents, useDashboardRegistrations } from './useDashboardData';

/** Hur många senaste anmälningar översikten visar (K10-facit: ~25 i rullbar lista). */
const MAX_RADER = 25;

/** Kortdatum per K10-facit ("15 sep") — sv-SE utan avslutande punkt; null-säkert. */
const KORTDATUM = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
function kortDatum(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : KORTDATUM.format(t).replace(/\.$/, '');
}

/** Klockslag "14:02" — igår-formens tidsdel. */
const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

/** Lokal dagsstart (midnatt) — kalenderdags-diffens referenspunkt. */
function dagsStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Relativ inskickad-tid per K10-facitets former: "för N min sedan" →
 * "för N tim sedan" (samma kalenderdag) → "igår HH:MM" (gårdagens
 * kalenderdag) → "för N dagar sedan" (kalenderdiff — Math.round absorberar
 * DST-skiftenas 23/25-timmarsdygn). Under minuten: "nyss" (facit-exemplen
 * börjar vid 10 min; ev. framtida klockskev clampas hit — aldrig negativt).
 * "för 1 dagar sedan" kan inte uppstå: dagsdiff 1 är alltid igår-formen.
 */
function relativTid(inskickadMs: number, nuMs: number): string {
  const minuter = Math.floor((nuMs - inskickadMs) / 60_000);
  if (minuter < 1) return 'nyss';
  if (minuter < 60) return `för ${minuter} min sedan`;
  const dagar = Math.round((dagsStart(nuMs) - dagsStart(inskickadMs)) / 86_400_000);
  if (dagar === 0) return `för ${Math.floor(minuter / 60)} tim sedan`;
  if (dagar === 1) return `igår ${KLOCKSLAG.format(inskickadMs)}`;
  return `för ${dagar} dagar sedan`;
}

/**
 * Radens event-identitet "kurs · ort · kortdatum" (K10-facit) via
 * KLIENT-SIDE-JOIN mot den redan hämtade eventlistan (B4, PRD-beslut 9:
 * samma poll-lager, ingen ny EF, read-only orört; joinen bor OVANPÅ
 * adaptern — ADR-057). Utan event-koppling: "Utan event" (uppgiften saknas
 * synligt). Join-miss (kopplat event utanför hämtade listan, t.ex. raderat):
 * ärlig degradering till radens eget lookup-namn — aldrig en tom lucka.
 */
function eventIdentitet(reg: Registration, event: Event | undefined): string {
  if (!reg.eventId) return 'Utan event';
  if (!event) return reg.eventNamn ?? 'Uppgift saknas';
  const namn = event.eventNamn ?? event.eventlabel ?? 'Namnlöst event';
  return [namn, event.ort, kortDatum(event.startdatum)].filter(Boolean).join(' · ');
}

/**
 * "Nya anmälningar att hantera"-card till K10-facitet (task-4.4; designen
 * låst S55 Del 12, referens `bb31a12`): de senaste anmälningarna där varje
 * rad bär namn (16 semibold) / joinad event-identitet "kurs · ort ·
 * kortdatum" (14, B4) / relativ inskickad-tid (12 muted) — och radklicket
 * landar på EVENTETS sida `/event/$eventId` (B1, öppen revidering av TASK-1
 * beslut 4/G1a: anmälda-undervyn utgick som mål). Rad utan event-koppling
 * renderas OLÄNKAD med "Utan event".
 *
 * Raderna är de SENASTE anmälningarna, recency-baserat via `Inskickad`-fältet
 * (dateTime, satt av create-registration), fallande. RECENCY, inte
 * `flagga`-fältet ("Ny anmälan"): kortet svarar på "vad har kommit in
 * nyligen", inte på en handläggnings-flagga (T14-disciplinen).
 *
 * Datatillstånd: kortets laddläge väntar på BÅDA hämtningarna (anmälningar +
 * eventlistan) så metaraden aldrig flashar från lookup-fallback till joinad
 * identitet; fel-ytan följer ANMÄLNINGS-hämtningen ensam (kortets kärndata) —
 * fel i eventlistan degraderar bara joinen (lookup-fallback), Nästa event-
 * cardet bär det felets alert. `nuMs` läses per render: relativa tider följer
 * klockan i poll-takten (ADR-017) utan egen timer.
 */
export function NyaAnmalningarCard() {
  const registrations = useDashboardRegistrations();
  const events = useDashboardEvents();

  const eventsById = useMemo(() => {
    const m = new Map<string, Event>();
    for (const e of events.data ?? []) m.set(e.id, e);
    return m;
  }, [events.data]);

  const senaste = useMemo(() => {
    if (!registrations.data) return [];
    return [...registrations.data]
      .sort((a, b) => inskickadTid(b) - inskickadTid(a))
      .slice(0, MAX_RADER);
  }, [registrations.data]);

  const nuMs = Date.now();

  return (
    <DashboardCard
      title="Nya anmälningar att hantera"
      titleIcon={<CircleAlert aria-hidden="true" size={20} className="shrink-0 text-accent" />}
      tone="accent"
      isPending={registrations.isPending || events.isPending}
      isError={registrations.isError}
      error={registrations.error}
      loadingLabel="Laddar nya anmälningar…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      {senaste.length === 0 ? (
        <p className="text-small text-text-muted">Inga anmälningar än.</p>
      ) : (
        // Rullningsytans a11y (B6, AC #6): tabindex 0 gör området till ett
        // riktigt tab-stopp (axe scrollable-region-focusable — olänkade rader
        // nås annars aldrig med tangentbord) och piltangenterna rullar det
        // fokuserade området natively; aria-label ger stoppet ett begripligt
        // namn (list-rollen stödjer author-namngivning).
        <ul
          // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable).
          tabIndex={0}
          aria-label="Senaste anmälningarna"
          className="scrollbar-inline mt-2 flex max-h-80 flex-col overflow-y-auto pr-3"
        >
          {senaste.map((reg, i) => {
            const tidMs = inskickadTid(reg);
            const tid = Number.isFinite(tidMs) ? relativTid(tidMs, nuMs) : null;
            const identitet = eventIdentitet(
              reg,
              reg.eventId ? eventsById.get(reg.eventId) : undefined,
            );
            const rad = (
              <>
                <span className="truncate font-semibold group-hover:underline">
                  {displayName(reg)}
                </span>
                <span className="truncate text-small">{identitet}</span>
                {tid ? <span className="text-caption text-text-muted">{tid}</span> : null}
              </>
            );
            return (
              // Zebra varannan rad (K10-facit): dämpad ton + rundade hörn,
              // INGA skiljelinjer (avdelar-mönstret från task-1.3 utgick).
              <li key={reg.id} className={i % 2 === 1 ? 'rounded-lg bg-bg-emphasized' : undefined}>
                {reg.eventId ? (
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: reg.eventId }}
                    className="group flex flex-col gap-0.5 px-2 py-2"
                  >
                    {rad}
                  </Link>
                ) : (
                  <div className="flex flex-col gap-0.5 px-2 py-2">{rad}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
