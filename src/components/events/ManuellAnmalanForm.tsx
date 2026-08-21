import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { AntalFalt } from '@/components/events/detail/AntalFalt';
import { DetaljGrupp, EtikettVardeRad } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useCreateRegistration } from '@/data/mutations/useCreateRegistration';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { EventStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { BelaggningsStapel } from './EventCard';
import { EventValjare } from './EventValjare';

// Samma format-grind som EF:en/modalen (medvetet enkel — servern är slutgiltig
// validator). Ersätter prototypens `includes('@')` med samma regex som skarpa vägen.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Avslöjnings-avsikten (facit punkt 7) bärs i NAVIGERINGENS history-state:
 * tomma lägets val sätter `mmAvsloja` i navigate-anropet, valda lägets mount
 * läser den → formuläret glider in ENDAST vid tomt→valt-övergången, aldrig
 * vid djuplänk (Marcus: "hopp i layouten är absolut förbjudet"). Router-state
 * i stället för modulskopad flagga (review-pilotens F2): StrictMode
 * dubbel-invokerar state-initialiserare, så en konsumerande initialiserare
 * vore opålitlig exakt i dev-läget där browser-verifieringen sker. Kvarvarande
 * mikrobeteende (bokfört, ompasseringens F8): history-posten bär avsikten och
 * överlever både Back OCH reload (webbläsaren bevarar history.state vid F5),
 * så båda vägarna in i posten efter en tomt→valt-övergång spelar
 * 200 ms-glidningen igen — motion-safe-gated och utan layoutpåverkan.
 */
declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Avslöjnings-avsikten (task-18.18 punkt 7): satt av tomma lägets val. */
    mmAvsloja?: boolean;
  }
}

/**
 * Manuell anmälan-sidan — SKARP (task-18.12 + eventväljaren task-18.18; S73-facit
 * K17/K18 + S83 pass 4-facit, Marcus-låst 2026-07-24). Skapar en riktig Anmälan
 * via create-registration-vertikalen med Källa="Manuell" och server-satt
 * event-koppling (EventKey + Event-länk härleds server-side, klienten skickar bara
 * eventId ur routen). Vägen in för anmälningar utanför formuläret (telefon/mail).
 *
 * TVÅ TILLSTÅND, INTE TVÅ SIDOR (18.18 punkt 7+13): skillnaden mellan
 * ingångarna är om eventet är känt — efter valet är vyerna identiska.
 * - VALT LÄGE (`/event/$eventId/ny-anmalan`): Eventet-blocket FÖRST (punkt 1 —
 *   "är detta rätt event?" är Lottas första fråga vid djuplänk), sedan
 *   formuläret. Eventbyte navigerar URL:en till samma route med nytt ID
 *   (beslut a/13 — URL:en alltid sann/delbar; Linear/Rails-precedenten);
 *   param-byte remountar INTE komponenten → ifyllda fält BEHÅLLS (beslut b/14).
 * - TOMT LÄGE (`/anmalan/ny`, tunn route): väljaren står FRISTÅENDE som sidans
 *   enda handling; resten av formuläret RENDERAS INTE (progressive
 *   disclosure-regeln — disabled-fält prövades och REVS). Valet navigerar in
 *   i den nästlade routen; avslöjandet glider in (mm-avsloj, motion-safe).
 *
 * EVENTET-BLOCKET (punkt 2–6): rubrikfritt kort i CheckInKort-formen (väljaren
 * säger själv vad blocket är; ingen egen mx — DetaljGrupp-breddpariteten är
 * DOM-mätt). Väljaren överst, VIT på den grå kortytan. Sammanfattningen bär
 * bara det som påverkar HANDLINGEN: Typ · Platser kvar (med listkortets enkla
 * beläggningsstapel) · Status (endast ≠ Planerat — normen är tyst, samma
 * grammatik som Källa-pillen) · Väntelista (villkorad). Rå eventlabel aldrig
 * i UI:t (punkt 11-fyndet — väljaren bär identiteten). Sekundär navigering
 * längst ned: "Gå till eventdetaljer" i navigeringens nedtonade vikt
 * (text-small/text-secondary, 7,25:1 mätt = AAA), aldrig handlings-formen.
 *
 * INSTANT (ADR-078 beslut 1–2): sammanfattningen seedas ur listcachen med
 * `placeholderData` (ALDRIG initialData — listposten är partiell och får inte
 * persisteras som hel; TanStacks list→detalj-anvisning). Enda fält som saknas
 * i listposten är `vantelista` (bara get-event aggregerar) — den raden ligger
 * därför SIST (punkt 11: det som styr handlingen står stilla; rader ovanför
 * flyttas aldrig av att den landar) och glider in mjukt när detalj-datat
 * landat med värde > 0; en placeholder får ALDRIG rita falska nollor.
 *
 * FORMKLASSEN (K75–K84): stor rund chevron + h1 med avgränsande linje ·
 * grupprubriker UTANFÖR de tonala korten (DetaljGrupp) · label-över-fält ·
 * RAC-primitiver · fel visas först vid Spara-försöket · knappraden primär
 * först. MÄRKNINGS-REGELN (K84): markera UNDANTAGEN, inte normen —
 * frivilliga fält bär "(valfritt)", `isRequired` bär a11y-golvet.
 *
 * KONTRAKTET (befintlig create-registration-operation, ADR-059/ADR-066-form):
 * server-side-byggd fält-shape, allowlist-SSOT, idempotens på en KLIENT-
 * genererad nyckel per skapa-INTENTION: en per sid-öppning, ROTERAD vid
 * eventbyte (samma nyckel mot ett annat event vore en felklassad replay);
 * bevarad över retries. Mutations-utfallet nollställs vid byte — ett
 * bekräftelseläge för event A får aldrig visas för event B.
 *
 * PESSIMISTISK UI (create kan 409:a): submit → knappen låst + pending → 201 →
 * aria-live + roster-invalidering (i hooken) → BEKRÄFTELSELÄGE. 409 (dubblett)
 * → inline affärs-fel, formuläret kvar med värden; övriga fel → MessageBox.
 */
/** Varifrån hon kom. Styr ENBART tillbaka-pilens mål — se routens docblock. */
export type NyAnmalanUrsprung = 'atgarder';

export function ManuellAnmalanForm({
  eventId,
  fran,
}: {
  eventId?: string;
  fran?: NyAnmalanUrsprung;
}) {
  return eventId != null ? <ValtLage eventId={eventId} fran={fran} /> : <TomtLage />;
}

/** Sidhuvudet — delat mellan lägena: stor rund chevron + h1 med avgränsande
    linje. Ingen kontextrad: eventidentiteten bor i VÄLJAREN (punkt 3), den
    gamla råa eventlabel-raden är riven (punkt 11-fyndet). */
function Sidhuvud({
  headingRef,
  tillbakaLank,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  tillbakaLank: ReactNode;
}) {
  return (
    <>
      {tillbakaLank}
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Lägg till manuell anmälan
        </h1>
      </header>
    </>
  );
}

/** Tomma läget (punkt 7, route /anmalan/ny — hem-vy-ingången): väljaren
    fristående som sidans enda handling; formuläret finns inte i DOM:en. */
function TomtLage() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Lägg till manuell anmälan';
  }, []);

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Sidhuvud
        headingRef={headingRef}
        tillbakaLank={
          <Link
            to="/hem"
            aria-label="Tillbaka"
            className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
          >
            <ChevronLeft aria-hidden="true" size={26} />
          </Link>
        }
      />
      <EventValjare
        onByte={(id) =>
          navigate({
            to: '/event/$eventId/ny-anmalan',
            params: { eventId: id },
            // Avslöjnings-avsikten i history-state (F2): spridningen bevarar
            // routerns interna nycklar.
            state: (prev) => ({ ...prev, mmAvsloja: true }),
          })
        }
      />
    </section>
  );
}

/** Valda läget: Eventet-blocket först, sedan formuläret (identiskt oavsett
    ingång — punkt 7). */
function ValtLage({ eventId, fran }: { eventId: string; fran?: NyAnmalanUrsprung }) {
  const navigate = useNavigate();
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bekraftelseRef = useRef<HTMLDivElement>(null);

  // Avslöjningen (punkt 7): glider in ENDAST vid tomt→valt-övergången —
  // avsikten läses ur history-staten (F2); ren initialiserare (StrictMode-
  // säker), fångad EN gång per mount så senare byten inte animerar om.
  const mmAvsloja = useLocation({ select: (l) => l.state.mmAvsloja === true });
  const [avsloja] = useState(() => mmAvsloja);

  // Idempotens-nyckel: en per skapa-intention (ADR-059) — ny vid mount,
  // ROTERAD vid eventbyte (se effekten nedan), bevarad över retries.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const [fornamn, setFornamn] = useState('');
  const [efternamn, setEfternamn] = useState('');
  const [epost, setEpost] = useState('');
  const [mobil, setMobil] = useState('');
  const [antal, setAntal] = useState<number | null>(1);
  const [notering, setNotering] = useState('');
  const [visaFel, setVisaFel] = useState(false); // true efter första Spara-försöket

  const mutation = useCreateRegistration(eventId);

  // Mutations-utfallet gäller ETT mål-event (review-pilotens F4): utfall från
  // event A får aldrig målas under event B:s URL — inte ens den frame som
  // hinner FÖRE reset-effekten (back/forward-fallet). Refen sätts vid mutate
  // och gatingen är SYNKRON i render; effekten nedan städar (reset + rotation)
  // efter paint.
  const mutationEventIdRef = useRef<string | null>(null);
  const mutationGallerEventet = mutationEventIdRef.current === eventId;
  const skapad = mutationGallerEventet && mutation.isSuccess ? mutation.data : null;

  // Eventbyte utan remount (beslut b/14): fälten överlever, men mutations-
  // utfallet och idempotensnyckeln hör till FÖRRA målet — nollställ/rotera
  // (samma nyckel mot ett annat event vore en felklassad replay, ADR-059).
  const prevEventId = useRef(eventId);
  const resetMutation = mutation.reset;
  useEffect(() => {
    if (prevEventId.current === eventId) return;
    prevEventId.current = eventId;
    resetMutation();
    setIdempotencyKey(crypto.randomUUID());
  }, [eventId, resetMutation]);

  // Sammanfattningen: samma cache-nyckel som eventsidan — varm vid navigering
  // från Åtgärder. INSTANT (ADR-078 beslut 1): seedas ur listcachen med
  // placeholderData (aldrig initialData — listposten är partiell). 4xx retryas
  // ej (CreateEventForm-formen).
  const eventQuery = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
    placeholderData: () =>
      queryClient.getQueryData<Event[]>(queryKeys.events.list)?.find((e) => e.id === eventId),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });
  const event = eventQuery.data;
  const arPlaceholder = eventQuery.isPlaceholderData;

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Lägg till manuell anmälan';
  }, []);

  // Bekräftelseläget tar fokus när det ersätter formuläret (fokus får aldrig falla
  // till <body> när knappen som trycktes försvinner).
  useEffect(() => {
    if (skapad) bekraftelseRef.current?.focus();
  }, [skapad]);

  const email = epost.trim();
  const fel = {
    fornamn: fornamn.trim() === '',
    efternamn: efternamn.trim() === '',
    epost: email === '' || !EMAIL_RE.test(email),
  };
  const harFel = fel.fornamn || fel.efternamn || fel.epost;

  /* TILLBAKA-VÄGEN FÖLJER VÄGEN IN (Marcus 2026-08-07): kom hon hit från
     åtgärds-sidans "Lägg till en person manuellt" ska pilen — och bekräftelse-
     lägets Klar-knapp — lämna henne DÄR hon var, inte på eventdetaljen. Utan
     `fran` är målet oförändrat, så varje befintlig väg in beter sig som förut.

     Ett objekt och inte två grenar på användningsstället: målet läses av BÅDA
     bärarna nedan (chevronen i sidhuvudet + `tillbaka()` efter sparad anmälan),
     och två separata villkor hade kunnat glida isär vid nästa ändring. */
  const tillbakaMal =
    fran === 'atgarder'
      ? { to: '/event/$eventId/atgarder' as const, etikett: 'Tillbaka till åtgärderna' }
      : { to: '/event/$eventId' as const, etikett: 'Tillbaka till eventet' };

  const tillbaka = () => navigate({ to: tillbakaMal.to, params: { eventId } });

  function handleSubmit() {
    setVisaFel(true);
    if (harFel || mutation.isPending) return;
    mutationEventIdRef.current = eventId; // utfalls-gatingens mål (F4)
    mutation.mutate({
      fornamn: fornamn.trim(),
      efternamn: efternamn.trim(),
      email,
      telefon: mobil.trim() || null,
      antalPlatser: antal ?? 1,
      notering: notering.trim() || null,
      idempotencyKey,
    });
  }

  // Fel-klassning (modal-precedent): 409 = affärs-dubblett (inline); övrigt =
  // oväntat. Samma F4-gating som skapad: fel från förra målet visas aldrig.
  const err = mutationGallerEventet ? mutation.error : null;
  const isDuplicate = err instanceof EdgeFunctionError && err.status === 409;
  const otherError = mutationGallerEventet && mutation.isError && !isDuplicate ? err : null;

  const rubrik = (
    <Sidhuvud
      headingRef={headingRef}
      tillbakaLank={
        <Link
          to={tillbakaMal.to}
          params={{ eventId }}
          aria-label={tillbakaMal.etikett}
          className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </Link>
      }
    />
  );

  // Status-avvikelsen (punkt 4): endast ≠ Planerat får ett märke — normen är
  // tyst (samma grammatik som Källa-pillen). Färgen förstärker, texten bär.
  const status = event?.status ?? null;
  const statusAvvikelse = status != null && status !== EventStatus.PLANERAT ? status : null;
  const statusKlass =
    status === EventStatus.INSTALLT
      ? 'text-error'
      : status === EventStatus.FLYTTAT
        ? 'text-warning'
        : '';

  // Väntelistan (punkt 4+11): finns BARA i get-event — en placeholder får
  // aldrig rita falska nollor (ADR-078 beslut 2), så raden renderas först
  // när riktig detalj-data landat med värde > 0.
  const vantelista = !arPlaceholder && event != null ? (event.vantelista ?? 0) : 0;

  // Eventet-blocket (punkt 1–6): rubrikfritt kort i CheckInKort-formen,
  // ingen egen mx (DetaljGrupp-breddpariteten, DOM-mätt 0-diff).
  const eventBlock = (
    <div
      data-testid="eventet-block"
      className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
    >
      <div className="py-4">
        <EventValjare
          valtEventId={eventId}
          valtEvent={event ?? undefined}
          onByte={(id) => navigate({ to: '/event/$eventId/ny-anmalan', params: { eventId: id } })}
          isDisabled={mutation.isPending}
        />
      </div>
      {event != null ? (
        // EN dl = EN grammatik för hela sammanfattningen (review-pilotens F5):
        // Platser kvar-raden är en giltig dt+dd+dd-grupp (HTML tillåter flera
        // dd per grupp; stapeln är andra-dd:n) — skärmläsaren möter en
        // sammanhållen lista, inte tre syskonstrukturer.
        <dl className="divide-y divide-border">
          <EtikettVardeRad term="Typ">{event.typ}</EtikettVardeRad>
          <PlatserKvarRad event={event} />
          {statusAvvikelse != null ? (
            <EtikettVardeRad term="Status">
              <span className={statusKlass}>{statusAvvikelse}</span>
            </EtikettVardeRad>
          ) : null}
          {/* SIST bland sammanfattningsraderna (punkt 11 vinner över punkt 4:s
              uppräkningsordning — rationalet är att inga rader ovanför flyttas
              när den landar): glider in mjukt, stum vid reduced motion. */}
          {vantelista > 0 ? (
            <div className="flex items-center justify-between gap-4 py-3 motion-safe:animate-mm-avsloj">
              <dt className="text-small text-text-muted">Väntelista</dt>
              <dd className="text-right text-body">{vantelista}</dd>
            </div>
          ) : null}
        </dl>
      ) : eventQuery.isPending ? (
        // Kall djuplänk utan listcache: skeleton i sammanfattningens
        // SLUTGEOMETRI (två rader + stapel — ADR-078 beslut 4; Roselli-
        // anatomin: role=status + sr-besked, blocken är dekor).
        <div role="status" aria-busy="true" className="flex flex-col gap-1 py-3">
          <span className="sr-only">Laddar event…</span>
          <div className="flex items-center justify-between gap-4 py-1">
            <Skeleton variant="text" className="w-10 text-small" />
            <Skeleton variant="text" className="w-24 text-body" />
          </div>
          <div className="flex items-center justify-between gap-4 py-1">
            <Skeleton variant="text" className="w-20 text-small" />
            <Skeleton variant="text" className="w-16 text-body" />
          </div>
          <Skeleton variant="text" className="h-1.5 rounded-full" />
        </div>
      ) : null}
      {/* Sekundär navigering (punkt 6): navigeringens nedtonade vikt —
          text-small/text-secondary (7,25:1 mätt mot kortytan = AAA), ALDRIG
          åtgärdsradernas handlings-form (font-medium/text-body) och inte
          text-muted (etikett-färgen läses inte som klickbar). Chevron 16 px. */}
      <div className="flex flex-col py-1.5">
        <Link
          to="/event/$eventId"
          params={{ eventId }}
          className="-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left text-small text-text-secondary hover:bg-bg-emphasized motion-safe:transition-colors"
        >
          Gå till eventdetaljer
          <ChevronRight aria-hidden="true" size={16} className="ml-auto shrink-0" />
        </Link>
      </div>
    </div>
  );

  // BEKRÄFTELSELÄGET: anmälan är skapad — nästa steg ett klick bort. Ersätter
  // formuläret; ingen automatisk omdirigering (skapandet ska KVITTERAS).
  if (skapad) {
    const namn =
      skapad.namn ?? ([skapad.fornamn, skapad.efternamn].filter(Boolean).join(' ') || 'anmälan');
    // Platsantalet ur SVARET (serverns sanning), inte ur formulärets state —
    // bekräftelsen ska kvittera vad som faktiskt skrevs. Saknas fältet (äldre
    // EF-svar) faller vi tillbaka på det som skickades, aldrig på en gissning.
    const platser = skapad.antalPlatser ?? antal ?? 1;
    return (
      <section className="flex flex-col gap-6 pt-2 lg:pt-10">
        {rubrik}
        <div
          ref={bekraftelseRef}
          tabIndex={-1}
          data-testid="bekraftelse"
          className="flex flex-col items-start gap-4 px-4 outline-none"
        >
          <MessageBox intent="success" title="Anmälan sparad">
            {namn} är anmäld och har {platser} {platser === 1 ? 'plats' : 'platser'} reserverad
            {platser === 1 ? '' : 'e'}. Anmälan är obekräftad tills du skickar bekräftelsen från
            eventsidan.
          </MessageBox>
          <Button intent="primary" onPress={tillbaka}>
            Tillbaka till eventet
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {rubrik}

      {/* Eventet-blocket FÖRST — före Deltagare (punkt 1). */}
      {eventBlock}

      {/* Formuläret — glider in vid tomt→valt-övergången (punkt 7). */}
      <div className={`flex flex-col gap-6 ${avsloja ? 'motion-safe:animate-mm-avsloj' : ''}`}>
        <DetaljGrupp id="ny-anmalan-deltagare" rubrik="Deltagare">
          <div className="flex flex-col gap-4 py-4">
            <Input
              label="Förnamn"
              value={fornamn}
              onChange={setFornamn}
              isRequired
              isInvalid={visaFel && fel.fornamn}
              errorMessage="Fyll i förnamn"
              autoComplete="given-name"
              isDisabled={mutation.isPending}
            />
            <Input
              label="Efternamn"
              value={efternamn}
              onChange={setEfternamn}
              isRequired
              isInvalid={visaFel && fel.efternamn}
              errorMessage="Fyll i efternamn"
              autoComplete="family-name"
              isDisabled={mutation.isPending}
            />
            <Input
              label="E-post"
              type="email"
              value={epost}
              onChange={setEpost}
              isRequired
              isInvalid={visaFel && fel.epost}
              errorMessage="Fyll i en giltig e-postadress"
              autoComplete="email"
              isDisabled={mutation.isPending}
            />
            <Input
              label="Mobilnummer (valfritt)"
              type="tel"
              value={mobil}
              onChange={setMobil}
              autoComplete="tel"
              isDisabled={mutation.isPending}
            />
          </div>
        </DetaljGrupp>

        <DetaljGrupp id="ny-anmalan-anmalan" rubrik="Anmälan">
          <div className="flex flex-col gap-4 py-4">
            {/* Antal platser i rad-stepparens form (K14-arvet); synlig etikett över
                fältet (formklassen) — AntalFalt bär samma namn som aria-label. */}
            <div className="flex flex-col gap-1">
              <span className="text-(color:--mm-input-label-text) text-small">Antal platser</span>
              <I18nProvider locale="sv-SE">
                <div className="w-32">
                  <AntalFalt label="Antal platser" value={antal} min={1} onChange={setAntal} />
                </div>
              </I18nProvider>
            </div>
            <TextArea
              label="Notering (valfritt)"
              value={notering}
              onChange={setNotering}
              isDisabled={mutation.isPending}
            />
          </div>
        </DetaljGrupp>

        {/* Knappraden: primär först (formklassen); px-4 = kortens inner-inset. */}
        <div className="flex items-center gap-2 px-4">
          <Button intent="primary" onPress={handleSubmit} isDisabled={mutation.isPending}>
            {mutation.isPending ? 'Sparar…' : 'Spara anmälan'}
          </Button>
          <Button intent="secondary" onPress={tillbaka} isDisabled={mutation.isPending}>
            Avbryt
          </Button>
        </div>

        {/* Mutations-utfall — annonseras för skärmläsare. Vid fel: värden bevarade,
            knappen åter aktiv. */}
        <div aria-live="polite" aria-busy={mutation.isPending} className="px-4">
          {mutation.isPending && <p className="text-small text-text-muted">Sparar anmälan…</p>}

          {/* 409: inline affärs-fel (role=alert via MessageBox). */}
          {isDuplicate && !mutation.isPending && (
            <MessageBox intent="error" title="Redan anmäld">
              Personen är redan anmäld till det här eventet.
            </MessageBox>
          )}

          {/* Övriga fel: requestId bärs i meddelandet (EdgeFunctionError). */}
          {otherError && !mutation.isPending && (
            <MessageBox intent="error" title="Kunde inte skapa anmälan">
              {otherError instanceof Error ? otherError.message : 'Inget felmeddelande angavs.'}
            </MessageBox>
          )}
        </div>
      </div>
    </section>
  );
}

/** Platser kvar-raden (punkt 4+5): "X av Y" + listkortets EGEN enkla
    beläggningsstapel under — DELADE BelaggningsStapel (EventCard-formen,
    review-pilotens F6; INTE eventsidans segmenterade mätare, den hör hemma
    där man arbetar med beläggningen). Stapeln är aria-hidden dekor; siffran
    bär (WCAG 1.4.1). Giltig dl-grupp: dt + värde-dd + stapel-dd (F5) —
    grid-placeringen ger stapeln full radbredd under termparet. */
function PlatserKvarRad({ event: e }: { event: Event }) {
  const max = e.maxPlatser;
  const kvar = e.platserKvar;
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 py-3">
      <dt className="text-small text-text-muted">Platser kvar</dt>
      <dd className="text-right text-body">
        {kvar != null && max != null ? `${kvar} av ${max}` : '-'}
      </dd>
      <dd className="col-span-2">
        <BelaggningsStapel event={e} />
      </dd>
    </div>
  );
}
