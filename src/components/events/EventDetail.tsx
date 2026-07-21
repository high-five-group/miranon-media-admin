import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp, EtikettVardeRad } from './detail/DetaljGrupp';
import { OmEventet } from './detail/OmEventet';

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** Länk-rad i kortform — interim-ingång till en befintlig detaljyta. */
function LankRad({
  to,
  eventId,
  children,
}: {
  to: '/event/$eventId/anmalda' | '/event/$eventId/betalning' | '/event/$eventId/narvaro';
  eventId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3">
      <Link to={to} params={{ eventId }} className="text-body underline">
        {children}
      </Link>
    </div>
  );
}

/**
 * Eventsidan — S73-facitets grundform (task-18.1). Toppraden bär identiteten
 * (stor chevron ensam + h1 = eventnamnet + EventKey-pill + tid kvar-raden);
 * innehållet är GRUPPER med rubrik utanför tonala kort (DetaljGrupp).
 *
 * 18.1:s snitt: sidstrukturen + Om eventet med Ändra-morfen (uppdatera-event-
 * vertikalen). Beläggning/Anmälda deltagare/Betalningar/Närvaro står som
 * INTERIM-grupper i facit-ordningen — befintlig data i grupp-grammatiken +
 * länkar till dagens detaljytor; deras facit-innehåll byggs i 18.2/18.4/18.8/
 * 18.9 (Åtgärder + check-in är 18.3; Gruppdynamik/Anteckningar 18.10/18.11).
 *
 * A11y (11/10):
 * - Chevronen ensam bär "detta är en undersida" (44 px rund länk,
 *   aria-label "Tillbaka till event"); h1 = eventnamnet, fokus dit vid laddning.
 * - Data-anländning annonseras i aria-live; Lugnt laddläge: skeleton i
 *   slutgeometri (aria-busy + sr-besked — ingen synlig "Laddar…"-textrad).
 * - Fel OCH 404 via MessageBox (role=alert); document.title = eventnamnet.
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

  // Sid-chromen står ALLTID i slutgeometri — bara innehållsytan växlar mellan
  // ladd/fel/laddat (Lugnt laddläge). Chevronen i rubrikstorlek (44 px-knapp,
  // touch-target-golvet) är sidans enda navigations-krom upptill.
  const sidRam = (innehall: React.ReactNode) => (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Link
        to="/event"
        aria-label="Tillbaka till event"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>
      {innehall}
    </section>
  );

  if (isPending) {
    // Lugnt laddläge: skeleton i slutgeometri — identitetsblocket + tonala
    // kortytor; besked endast för skärmläsare (ingen synlig textrad).
    return sidRam(
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">Laddar event…</span>
        <Skeleton variant="text" className="mx-4 w-3/5 text-3xl" />
        <Skeleton variant="listRow" className="h-44 rounded-2xl" />
        <Skeleton variant="listRow" className="h-32 rounded-2xl" />
        <Skeleton variant="listRow" className="h-36 rounded-2xl" />
      </div>,
    );
  }

  if (isError) {
    return sidRam(
      notFound ? (
        <MessageBox intent="error" title="Eventet hittades inte">
          Inget event med det ID:t finns. Det kan ha tagits bort, eller så är länken felaktig.
        </MessageBox>
      ) : (
        <MessageBox intent="error" title="Kunde inte hämta eventet">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      ),
    );
  }

  return sidRam(
    <>
      {/* aria-live: bekräftar för skärmläsare att eventet anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Event ${eventName(event)} laddat.`}
      </p>

      {/* Toppraden (S73-facit K7–K10): identiteten UR korten — sidhuvud på ren
          bakgrund; placeringen ÄR lås-signalen. h1 = eventnamnet (rubrikpolicyn);
          EventKey-pillen som titel-metadata till höger (liten mot titeln);
          tid kvar-raden under; tunn avdelare. */}
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 ref={headingRef} tabIndex={-1} className="min-w-0 break-words font-semibold text-3xl">
            {eventName(event)}
          </h1>
          {event.eventKey && (
            <span className="shrink-0 rounded-full bg-bg-muted px-3 py-1 font-medium text-small text-text-secondary">
              {event.eventKey}
            </span>
          )}
        </div>
        {event.tidKvarTillEvent && (
          <p className="text-small text-text-muted">{event.tidKvarTillEvent}</p>
        )}
      </header>

      <OmEventet event={event} />

      {/* INTERIM (18.2 äger innehållsmodellen + morfen): befintliga beläggnings-
          värden i grupp-grammatiken. */}
      <DetaljGrupp id="grupp-belaggning" rubrik="Beläggning">
        <dl className="divide-y divide-border">
          <EtikettVardeRad term="Max antal platser">
            {event.maxPlatser != null ? String(event.maxPlatser) : null}
          </EtikettVardeRad>
          <EtikettVardeRad term="Anmälda deltagare">{String(event.antalAnmalda)}</EtikettVardeRad>
          <EtikettVardeRad term="Platser kvar">
            {event.platserKvar != null ? String(event.platserKvar) : null}
          </EtikettVardeRad>
        </dl>
      </DetaljGrupp>

      {/* INTERIM (18.4 bygger arbetskön): ingången till dagens anmälda-yta. */}
      <DetaljGrupp id="grupp-anmalda" rubrik="Anmälda deltagare">
        <LankRad to="/event/$eventId/anmalda" eventId={eventId}>
          Öppna anmälda-vyn
        </LankRad>
      </DetaljGrupp>

      {/* INTERIM (18.8 bygger arbetsytan): räknerader + ingången till betalnings-ytan. */}
      <DetaljGrupp id="grupp-betalningar" rubrik="Betalningar">
        <dl className="divide-y divide-border">
          <EtikettVardeRad term="Anmälningsavgifter">
            {`${event.antalAnmalningsavgifter} av ${event.antalAnmalda} mottagna`}
          </EtikettVardeRad>
          <EtikettVardeRad term="Slutbetalningar">
            {`${event.antalSlutbetalningar} mottagna`}
          </EtikettVardeRad>
        </dl>
        <LankRad to="/event/$eventId/betalning" eventId={eventId}>
          Öppna betalnings-vyn
        </LankRad>
      </DetaljGrupp>

      {/* INTERIM (18.9 bygger registret): ingången till dagens närvaro-yta. */}
      <DetaljGrupp id="grupp-narvaro" rubrik="Närvaro">
        <LankRad to="/event/$eventId/narvaro" eventId={eventId}>
          Öppna närvaro-vyn
        </LankRad>
      </DetaljGrupp>
    </>,
  );
}
