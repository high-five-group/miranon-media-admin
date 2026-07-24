import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useRef } from 'react';
// [PROTOTYPE] S83 pass 4 (TASK-18.19) — kastbar import, rivs med passet.
import { EventValjarePrototyp } from '@/components/events/EventValjarePrototyp';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';
import { Anteckningar } from './detail/Anteckningar';
import { Atgarder, CheckInKort } from './detail/Atgarder';
import { Belaggning } from './detail/Belaggning';
import { Betalningar } from './detail/Betalningar';
import { Deltagare } from './detail/Deltagare';
import { Gruppdynamik } from './detail/Gruppdynamik';
import { Narvaro } from './detail/Narvaro';
import { OmEventet } from './detail/OmEventet';

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/**
 * Eventsidan — S73-facitets grundform (task-18.1). Toppraden bär identiteten
 * (stor chevron ensam + h1 = eventnamnet + EventKey-pill + tid kvar-raden);
 * innehållet är GRUPPER med rubrik utanför tonala kort (DetaljGrupp).
 *
 * 18.1:s snitt: sidstrukturen + Om eventet med Ändra-morfen (uppdatera-event-
 * vertikalen). 18.2: Beläggningen till facit (K16-innehållsmodellen + mätaren +
 * Ändra-morfen). 18.3: check-in-ingången + Åtgärds-gruppen + chevron-koherensen.
 * Anmälda deltagare/Betalningar/Närvaro står som INTERIM-grupper
 * i facit-ordningen — befintlig data i grupp-grammatiken + länkar till dagens
 * detaljytor; deras facit-innehåll byggs i 18.4/18.8/18.9
 * (Gruppdynamik/Anteckningar 18.10/18.11).
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
  // [PROTOTYPE] S83 pass 4 (TASK-18.19): `?variant=a` = väljaren ÄR rubriken
  // (Stripe-formen) · `?variant=b` = kompakt kontroll ovanför H1:an.
  // DEV-grindad; utan variant = skarpa vyn orörd. Rivs med passet.
  const [variantParam] = useQueryState('variant');
  const valjarVariant =
    import.meta.env.DEV && (variantParam === 'a' || variantParam === 'b') ? variantParam : null;

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
        {/* [PROTOTYPE] 18.19 B: kompakt väljar-kontroll OVANFÖR H1:an. */}
        {valjarVariant === 'b' ? (
          <div className="self-start pb-1">
            <EventValjarePrototyp eventId={eventId} to="/event/$eventId" form="kontextrad" />
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          {/* [PROTOTYPE] 18.19 A: väljaren ÄR rubriken (namnet som trigger). */}
          {valjarVariant === 'a' ? (
            <h1 ref={headingRef} tabIndex={-1} className="min-w-0">
              <EventValjarePrototyp eventId={eventId} to="/event/$eventId" form="rubrik" />
            </h1>
          ) : (
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="min-w-0 break-words font-semibold text-3xl"
            >
              {eventName(event)}
            </h1>
          )}
          {event.eventKey && (
            <span className="shrink-0 rounded-full bg-bg-muted px-3 py-1 font-medium text-small text-text-secondary">
              {event.eventKey}
            </span>
          )}
        </div>
        {/* Nedräkningsformerna får suffixet "kvar till eventet" (review-
            våg 1, Marcus 2026-07-22). Basens formel (fldcwlblR3JQxXVbe,
            läst 2026-07-22) har exakt tre utfall: "Avslutat" | "N dagar" |
            "N vecka/veckor [och M dagar]" — Avslutat är enda icke-
            nedräknaren och lämnas rå (aldrig "Avslutat kvar till eventet"). */}
        {event.tidKvarTillEvent && (
          <p className="text-small text-text-muted">
            {event.tidKvarTillEvent === 'Avslutat'
              ? event.tidKvarTillEvent
              : `${event.tidKvarTillEvent} kvar till eventet`}
          </p>
        )}
      </header>

      {/* Check-in-ingången + Åtgärder (task-18.3; S73-facit K19–K26): check-in
          som rubrikfritt kort ÖVER Åtgärds-gruppen, gruppen före datagrupperna.
          Länkmåls- och kopplingsinterimen är öppet bokförda i Atgarder.tsx. */}
      <CheckInKort eventId={eventId} />
      <Atgarder eventId={eventId} />

      <OmEventet event={event} />

      {/* Beläggningen (task-18.2): K16-innehållsmodellen + segmenterad mätare +
          Ändra-morfen — ersätter 18.1:s interim-rader. */}
      <Belaggning event={event} />

      {/* Anmälda deltagare som ARBETSKÖ (task-18.4; K35–K58): summeringsrader
          med filter + kategori-flikar + Obekräftade/Bekräftade-accordions —
          ersätter 18.1:s interim-länk till den gamla anmälda-vyn. Personkorten
          (18.5), hantera-flödet (18.6) och Bor över-raden (18.7) växer in i
          samma skelett. */}
      <Deltagare event={event} />

      {/* Betalningar (task-18.8): röda saknas-deltan + inline-ARBETSYTAN
          (K27–K34) — ersätter 18.1:s interim-rader och den gamla
          betalnings-vyn (K27: Marcus "stanna på samma sida"). Deltan och
          grupper härleds LIVE ur anmälnings-cachen, inte event-aggregaten. */}
      <Betalningar event={event} />

      {/* Närvaro-registret (task-18.9; K60): genomfört event → LMS-register
          (rader × sessioner, Total närvaro %); kommande event → lugnt läge.
          REN LÄSNING (närvaro-write bor på check-in-sidan). Fetchar närvaron
          ENDAST för genomförda event (kommande event anropar aldrig EF:en). */}
      <Narvaro event={event} />

      {/* Gruppdynamik (task-18.10; K63–K65): erfarenhetsmixen (summeringsrad +
          sekventiell mätare + nivå-accordions med per-person-kurshistorik) +
          motiveringarna som vita kort. Delar registrations.byEvent-cachen med
          arbetskön (Deltagare) — React Query dedupar till EN fetch. Anteckningar
          (18.11) blir sidans sista grupp EFTER denna. */}
      <Gruppdynamik event={event} />

      {/* Anteckningar (task-18.11; K66–K71, ADR-075): sidans SISTA grupp —
          tidsstämplad ström (composer överst, nyast först) med server-satt författare
          och härledd Under/Efter-fas. Egen get-event-notes-fetch (events.notes-cachen). */}
      <Anteckningar event={event} />
    </>,
  );
}
