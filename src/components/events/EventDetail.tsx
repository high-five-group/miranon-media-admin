import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';
import { Anteckningar } from './detail/Anteckningar';
import { AtgarderKort, CheckInKort, SkrivUtKort } from './detail/Atgarder';
import { Belaggning } from './detail/Belaggning';
import { Deltagare } from './detail/Deltagare';
import { Gruppdynamik } from './detail/Gruppdynamik';
import { Narvaro } from './detail/Narvaro';
import { OmEventet } from './detail/OmEventet';
import { useForberedEventDetalj } from './EventCard';
import { EventValjare } from './EventValjare';

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
 *   Sedan task-18.19 är h1:an OCKSÅ eventväljarens trigger (variant A —
 *   rubrik-semantiken orörd: accessibla namnet är exakt eventnamnet; se
 *   EventValjare). Vid byte följer document.title med; fokus återvänder till
 *   triggern via React Arias fokus-retur, aldrig ett nytt fokus-hopp.
 * - Data-anländning annonseras i aria-live; Lugnt laddläge: skeleton i
 *   slutgeometri (aria-busy + sr-besked — ingen synlig "Laddar…"-textrad).
 * - Fel OCH 404 via MessageBox (role=alert); document.title = eventnamnet.
 */
export function EventDetail({ eventId }: { eventId: string }) {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const harFokuserat = useRef(false);

  const {
    data: event,
    isPending,
    isError,
    error,
    isPlaceholderData,
  } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
    // Seedning ur listcachen: get-events bär identiteten och taket (typ · ort ·
    // datum · maxPlatser · platserKvar · status), så sidhuvudet och Om eventet
    // står direkt i stället för att vänta ut get-event (~1,1 s mätt). Det är
    // `placeholderData` och inte `initialData` med avsikt — listposten är
    // PARTIELL och får aldrig persisteras som om den vore hel.
    //
    // Beläggnings-aggregaten (viaFormular · manuelltTillagda · medfoljande ·
    // reserverade · vantelista) finns BARA i get-event, och Belaggning läser
    // dem med `?? 0`. Sektionen hålls därför i skeleton tills riktiga data
    // landat — utan det hade mätaren ritat en sekund av falska nollor.
    placeholderData: () =>
      queryClient.getQueryData<Event[]>(queryKeys.events.list)?.find((e) => e.id === eventId),
    // 4xx (inkl. 404) är klient-fel → meningslöst att retrya (speglar fetchPerson).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const notFound = error instanceof EdgeFunctionError && error.status === 404;

  // Fokus → <h1> vid FÖRSTA dataanländningen (en gång per sidbesök). Väljar-
  // bytet (task-18.19) remountar inte komponenten och flyttar INTE fokus om:
  // React Aria returnerar fokus till rubrik-triggern när popovern stängs,
  // och den fokus-kontinuiteten ska inte brytas.
  useEffect(() => {
    if (event && !harFokuserat.current) {
      harFokuserat.current = true;
      headingRef.current?.focus();
    }
  }, [event]);

  // document.title följer eventNAMNET (nyckeln är titel-STRÄNGEN — `event`-
  // objektet byter identitet per render när placeholdern räknas om, och en
  // objekt-nycklad effekt hade avbrutit sin egen frame i cleanupen).
  const titel = event ? eventName(event) : null;
  const titelRef = useRef<string | null>(null);
  useEffect(() => {
    titelRef.current = titel;
    if (titel != null) document.title = titel;
  }, [titel]);

  // Väljar-bytet (task-18.19): RouteAnnouncer skriver den generiska route-
  // titeln ("Event") vid varje klient-navigation — dess onResolved landar
  // EFTER sidans effekt när INSTANT-placeholdern gör datat omedelbart
  // (empiriskt: även efter en rAF ur effekten). Sidan re-assertar därför
  // eventnamnet i SAMMA signal, en frame efter announcerns synkrona
  // skrivning. Pathname-vakten hindrar läckage: när navigationen lämnat
  // sidan re-assertas ingenting.
  const router = useRouter();
  useEffect(() => {
    return router.subscribe('onResolved', () => {
      const titelNu = titelRef.current;
      if (titelNu == null) return;
      if (router.state.location.pathname.replace(/\/$/, '') !== `/event/${eventId}`) return;
      requestAnimationFrame(() => {
        document.title = titelNu;
      });
    });
  }, [router, eventId]);

  /** Prefetch på avsikt (ADR-078 beslut 3): hover/virtuell fokus på en
      väljar-rad värmer bytesmålets båda queries via delade
      useForberedEventDetalj (EventCards form, PR #163 — review-pilotens F1:
      en värmning, inte två kopior). */
  const varmDetalj = useForberedEventDetalj();
  const varmBytesmal = useCallback(
    (id: string) => {
      if (id === eventId) return; // sidans eget event är redan hämtat/hämtas
      varmDetalj(id);
    },
    [eventId, varmDetalj],
  );

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
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
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

      {/* Toppraden (S73-facit K7–K10 + task-18.19 variant A): identiteten UR
          korten — sidhuvud på ren bakgrund; placeringen ÄR lås-signalen.
          h1 = eventnamnet OCH väljar-triggern (väljaren ÄR rubriken —
          pogo-sticking-elimineringen: byt event här, detaljerna laddas direkt
          utan omväg via listan; Stripe-/Linear-/Airtable-precedenten).
          EventKey-pillen som titel-metadata till höger (liten mot titeln);
          tid kvar-raden under; tunn avdelare.
          RUBRIKEN FÅR RADENS UTRYMME (Marcus våg 2-fix 2026-07-25: "Resor i
          medvetandet 3" SKA rymmas på EN rad — "annars faller hela konceptet
          med Eventnamnet som rubrik"): på smal yta (< sm) viker EventKey-
          pillen deterministiskt UNDER rubriken (basis-full på wrappern +
          flex-wrap på raden) så h1-raden får hela innehållsbredden; på ≥ sm
          står pillen kvar till höger som förr. Deterministisk brytpunkt i
          stället för intrinsic-wrap: truncate-kedjans min-w-0 gör att flex
          hellre krymper rubriken än viker syskonet — ellipsis-formen står
          kvar ENBART som yttersta skyddsnät för extremnamn, aldrig för
          verkliga kursnamn (längsta verkliga = RIM 3, mäts i e2e). */}
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <EventValjare
            form="rubrik"
            valtEventId={eventId}
            valtEvent={event}
            rubrikRef={headingRef}
            // Bytet navigerar routen (18.18 beslut a, ärvt): /event/$eventId
            // med behållna sökparametrar — URL:en alltid sann och delbar.
            onByte={(id) =>
              navigate({ to: '/event/$eventId', params: { eventId: id }, search: (prev) => prev })
            }
            onAvsikt={varmBytesmal}
          />
          {event.eventKey && (
            // Wrappern bär radbeteendet (basis-full = egen rad under rubriken
            // på smal yta; pill-bakgrunden får aldrig full bredd — därför
            // ligger den på inner-spannet, inte på flex-itemet).
            <span className="flex basis-full sm:basis-auto">
              <span className="shrink-0 rounded-full bg-bg-muted px-3 py-1 font-medium text-small text-text-secondary">
                {event.eventKey}
              </span>
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

      {/* Check-in-ingången + genvägar-ytan (task-18.3; S73-facit K19–K26;
          PROMOVERAD TASK-162.2, ADR-103 B2 steg 1): check-in som rubrikfritt
          kort ÖVER genvägar-ytan, ytan före datagrupperna. `AtgarderKort`
          ("Gå till åtgärder") + `SkrivUtKort` (fristående "Skriv ut") är
          sedan denna commit den OVILLKORLIGA formen — den gamla rubricerade
          Åtgärder-gruppen (`Atgarder`, tidigare renderad här när
          `variantParam` INTE var satt) är riven; git bevarar den (senast i
          main före denna commit).
          [TASK-147.8, NAMNBYTE] MARCUS-BESLUT 2026-08-10 (S102,
          namnkollisionen — kortets Implementation Notes): två ytor bar
          namnet "Åtgärder" — DENNA lilla kortkedja (genvägar UT till andra
          sidor) och den riktiga Åtgärds-sidan
          (`components/events/atgarder/AtgardsSida.tsx`). Beslutet: sidan
          behåller "Åtgärder"; denna ytas informella namn (kommentarer,
          testtitlar — ALDRIG en synlig rubrik, se nästa stycke) är nu
          "genvägar-ytan". INGEN NY RUBRIK LADES TILL: `AtgarderKort` +
          `SkrivUtKort` är SYSKON utan gemensamt DOM-skal
          (eventsida-promoverings-grind.spec.ts's docblock — en ny
          inneslutande div/rubrik hade varit exakt den formändring
          regressionslåset finns för att förhindra), så namnbytet syns bara
          i koden och testerna, aldrig för Lotta.
          [TASK-147.8, KOPPLAD] `AtgarderKort`s länkmåls-interim är stängt:
          kortet navigerar nu skarpt till `/event/$eventId/atgarder` (samma
          `HandlingsLank`-mekanik som `CheckInKort`), därav `eventId`-propen
          nedan. Se Atgarder.tsx § AtgarderKort för hela historiken —
          urvalet från registret medförs INTE än (TASK-171.6 AC #1s scope).
          [RIVEN, TASK-145.6] `variantParam`/`isHallplatsVariant`/prototyp-
          railen som stod nedan är rivna (ADR-103 B2 steg 4, efter Marcus
          godkännande) — registret i Deltagare.tsx behåller sin promoverade
          form oförändrad. */}
      <CheckInKort eventId={eventId} />
      <AtgarderKort eventId={eventId} />
      <SkrivUtKort />

      <OmEventet event={event} />

      {/* Beläggningen (task-18.2): K16-innehållsmodellen + segmenterad mätare +
          Ändra-morfen — ersätter 18.1:s interim-rader.
          Skeleton medan sidan står på listcachens placeholder (se queryn):
          höjden är DOM-mätt mot sektionens slutgeometri, 336 px mot 337 —
          Lugnt laddläge kräver slutgeometri, annars byts en falsk mätare mot
          ett layouthopp. Höjden är typfallet; mätarens kategoriantal varierar
          något. */}
      {isPlaceholderData ? (
        <div role="status" aria-busy="true" className="flex min-w-0 flex-col gap-2">
          <span className="sr-only">Laddar beläggning…</span>
          <Skeleton variant="text" className="mx-4 w-32 text-lg" />
          <Skeleton variant="listRow" className="h-[303px] rounded-2xl" />
        </div>
      ) : (
        <Belaggning event={event} />
      )}

      {/* Anmälda deltagare som ARBETSKÖ (task-18.4; K35–K58): summeringsrader
          med filter + kategori-flikar + en FAST Obekräftade-kö och ett fällbart
          Bekräftade-arkiv — ersätter 18.1:s interim-länk till den gamla
          anmälda-vyn. Personkorten (18.5), hantera-flödet (18.6) och Bor
          över-raden (18.7) växer in i samma skelett.

          Accordion-PARET är rivet 2026-07-26 (task-48 review-våg 2): kön är en
          yta som ska tömmas och rymmer ändå bara ~3 kort, arkivet växer mot
          hela deltagarlistan. Bara det senare tjänar på att gå att fälla. */}
      <Deltagare event={event} />

      {/* [TASK-145.4] Betalningar som TOPPNIVÅ-block är RIVET (AC #1; PRD
          TASK-145 § Implementationsbeslut, "Betalnings-toppblocket
          försvinner"). Arbetsytan (`BetalningsDetaljer`, deadline-badgen
          inkluderad) är inflyttad som fällbar LÄSYTA under registret — se
          `Deltagare.tsx`s `ArbetsKo` ("Öppna detaljer"). [RIVEN, TASK-145.6]
          `Betalningar`/`BetalningsInnehall` (Betalningar.tsx) stod kvar som
          overkallad, vestigial kod (deras enda live-referens var hållplats-
          prototypens `protoAktiv`-läsning) — rivna helt i samma skiva som
          variant-maskineriet, ej bara bokförda: AC #5. */}

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
