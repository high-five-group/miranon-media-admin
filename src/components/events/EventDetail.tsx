import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** Beläggning som TEXT (färg aldrig ensam bärare). Null-säker: osatt tak → ingen NaN. */
function belaggningText(e: Event): string {
  if (e.maxPlatser == null) return `${e.antalAnmalda} anmälda (platser ej satt)`;
  return `${e.antalAnmalda} av ${e.maxPlatser} platser`;
}

/** Fullt = inga platser kvar. `platserKvar` null (okänt tak) → ej "fullt". */
function isFull(e: Event): boolean {
  return e.platserKvar != null && e.platserKvar <= 0;
}

/** Beläggnings-procent (andel) som text, eller null när taket saknas. */
function percentText(e: Event): string | null {
  if (e.anmaldBelaggning == null) return null;
  return `${Math.round(e.anmaldBelaggning * 100)} %`;
}

/** En rad i en fält/värde-lista; hoppar tomma värden (renderar inte null). */
function DescRow({ term, children }: { term: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="text-small text-text-muted sm:min-w-48">{term}</dt>
      <dd className="text-small">{children}</dd>
    </div>
  );
}

/**
 * Event-detalj — Info-vy (Fas 6b L2). BERIKAD OPERATIONS-ÖVERSIKT: eventets
 * identitet + beläggnings-överblick + betalnings-/närvaro-SAMMANFATTNING (siffror
 * + länkar till detaljytorna), INTE duplicerade rådata-listor. get-event speglar
 * get-events-mappningen för EN rad (ingen aggregering). Data via `fetchEvent` →
 * get-event-EF (router-context-DI, ADR-055).
 *
 * Panel-pekar-in-i-motorrummet: info-vyn är ÖVERSIKTEN; betalning/närvaro/anmälda
 * är detaljytorna. Ingen redundans — sammanfattande siffror + länkar, ej listorna.
 *
 * A11y (11/10, speglar PersonDetail):
 * - `<h1>` = eventnamn; fokus flyttas dit när data anlänt (namnlöst → fallback,
 *   aldrig krasch).
 * - Data-anländning annonseras i `aria-live="polite"`.
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel OCH 404-ej-funnen: `role="alert"` via MessageBox (ingen dubbel-announcer).
 * - `document.title` = eventnamn när laddat.
 * - "Tillbaka till event-listan"-länk alltid närvarande.
 * - Beläggnings-/betalnings-siffror som läsbar text (skärmläsaren får hela bilden).
 */
export function EventDetail({ eventId }: { eventId: string }) {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: event,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
    // 4xx (inkl. 404) är klient-fel → meningslöst att retrya (speglar fetchPerson).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const notFound = error instanceof EdgeFunctionError && error.status === 404;

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning).
  useEffect(() => {
    if (event && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = `${eventName(event)} — Miranon Media Admin`;
    }
  }, [event]);

  const backLink = (
    <Link to="/event" className="text-small underline">
      ← Tillbaka till event-listan
    </Link>
  );

  if (isPending) {
    return (
      <section className="flex flex-col gap-4 p-4" aria-busy="true">
        {backLink}
        <p role="status" aria-live="polite">
          Laddar event…
        </p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4 p-4">
        {backLink}
        {notFound ? (
          <MessageBox intent="error" title="Eventet hittades inte">
            Inget event med det ID:t finns. Det kan ha tagits bort, eller så är länken felaktig.
          </MessageBox>
        ) : (
          <MessageBox intent="error" title="Kunde inte hämta eventet">
            {error instanceof Error ? error.message : 'Okänt fel.'}
          </MessageBox>
        )}
      </section>
    );
  }

  const datumspann = [event.startdatum, event.slutdatum]
    .filter(Boolean)
    .filter((d, i, arr) => arr.indexOf(d) === i) // start === slut → visa en gång
    .join(' – ');
  const percent = percentText(event);
  const full = isFull(event);

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att eventet anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Event ${eventName(event)} laddat.`}
      </p>

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          {eventName(event)}
        </h1>
        {event.tidKvarTillEvent && (
          <p className="text-small text-text-muted">{event.tidKvarTillEvent}</p>
        )}
      </header>

      <section aria-labelledby="sektion-identitet" className="flex flex-col gap-2">
        <h2 id="sektion-identitet" className="font-semibold text-lg">
          Om eventet
        </h2>
        <dl className="flex flex-col gap-1">
          <DescRow term="Typ">{event.typ}</DescRow>
          <DescRow term="Ort">{event.ort}</DescRow>
          <DescRow term="Datum">{datumspann || null}</DescRow>
          <DescRow term="Status">{event.status}</DescRow>
        </dl>
      </section>

      <section aria-labelledby="sektion-belaggning" className="flex flex-col gap-2">
        <h2 id="sektion-belaggning" className="font-semibold text-lg">
          Beläggning
        </h2>
        {/* Beläggning bärs av TEXT; "Fullt" + procent gör bilden begriplig. */}
        <p className="text-small">
          {belaggningText(event)}
          {full ? ' · Fullt' : ''}
          {percent ? ` · ${percent} fullt` : ''}
        </p>
        <dl className="flex flex-col gap-1">
          <DescRow term="Platser kvar">
            {event.platserKvar != null ? String(event.platserKvar) : null}
          </DescRow>
        </dl>
      </section>

      <section aria-labelledby="sektion-betalning" className="flex flex-col gap-2">
        <h2 id="sektion-betalning" className="font-semibold text-lg">
          Betalningar
        </h2>
        <p className="text-small">
          {`${event.antalAnmalningsavgifter} av ${event.antalAnmalda} har betalat anmälningsavgift.`}
        </p>
        <p className="text-small">
          {`Slutbetalningar: ${event.antalSlutbetalningar} mottagna` +
            (event.antalSlutbetalningFelande > 0
              ? `, ${event.antalSlutbetalningFelande} saknas.`
              : '.')}
        </p>
        <Link to="/event/$eventId/betalning" params={{ eventId }} className="text-small underline">
          Öppna betalnings-vyn →
        </Link>
      </section>

      <section aria-labelledby="sektion-narvaro" className="flex flex-col gap-2">
        <h2 id="sektion-narvaro" className="font-semibold text-lg">
          Närvaro
        </h2>
        {/* Ingen närvaro-siffra i get-event-shapen — gissa inte fält; länka bara. */}
        <Link to="/event/$eventId/narvaro" params={{ eventId }} className="text-small underline">
          Öppna närvaro-vyn →
        </Link>
      </section>

      <section aria-labelledby="sektion-anmalda" className="flex flex-col gap-2">
        <h2 id="sektion-anmalda" className="font-semibold text-lg">
          Anmälda
        </h2>
        {/* 6c ej byggd → ingen död länk; kort not (utelämnad ingång). */}
        <p className="text-small text-text-muted">Anmälda-listan kommer i Fas 6c.</p>
      </section>
    </section>
  );
}
