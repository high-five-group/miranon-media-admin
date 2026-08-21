import type { CalendarDate } from '@internationalized/date';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { AntalFalt } from '@/components/events/detail/AntalFalt';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';
import { DatumFalt } from '@/components/primitives/DatumFalt';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { SlideToConfirm } from '@/components/primitives/SlideToConfirm';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useCreateEvent } from '@/data/mutations/useCreateEvent';
import { useDataSource } from '@/data/useDataSource';
import { eventformatEtikett } from '@/lib/eventformat-etikett';
import { queryKeys } from '@/queries/keys';

/** Distinkta, sorterade icke-tomma värden (för options härledda ur befintliga event). */
function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))].sort((a, b) =>
    a.localeCompare(b, 'sv'),
  );
}

/* MiranonSe-komponenten RIVEN (review-våg 5, Marcus punkt 15): armerade
   texten är bara "Publiceras" — destinationen är självklar (ingen annan
   sajt kopplas hit) och bärs av aria-labeln. K81-sagan (mono → medium →
   riven) stängd; domänen förekommer inte längre i skapa-sidans UI. */

/**
 * Skapa nytt event — event-familjens skapa-sida i FAMILJENS FORMKLASS
 * (task-19.3 mot S73-facit-utökningen, bilagan FACIT-skapa-sidan.png).
 * HEMVIST: /event/skapa (hemvist-flytten task-19.2; Mer-ingången riven).
 *
 * FORMKLASSEN (K75–K84, samma grammatik som eventsidans grupper): stor rund
 * chevron + h1 med avgränsande linje · grupprubriker UTANFÖR de tonala korten
 * (DetaljGrupp) · label-över-fält · datum som RAC DateRangePicker (DatumFalt)
 * och platser som RAC NumberField (AntalFalt) — samma fält-primitiver som
 * eventsidans Ändra-morf, aldrig text-Inputs · publicerings-handtaget
 * (SlideToConfirm) i eget avsnitt · grön "Skapa event" + "Avbryt".
 *
 * INGA OBLIGATORISK-MARKERINGAR (K84, Marcus: allt på sidan krävs → markera
 * undantag, inte normen). `isRequired` behålls på fälten för skärmläsare;
 * ingen visuell asterisk/"(obligatorisk)"-text finns i primitiverna.
 *
 * SPRÅKET (ORDLISTA + PRD task-19 beslut 4): UI:t säger **Event** (kursen) och
 * **Eventtyp** (Utbildning/Föreläsning). Basens namnkrock hålls EXPLICIT i
 * mappningen, aldrig implicit: UI-Event → basens `Event (source)`,
 * UI-Eventtyp → basens `Typ`, UI-Eventformat → basens `Eventtyp` (LÄNKEN till
 * Eventformat som driver Sessionsmall). Formatens etiketter ("2 dagar"/"1 dag")
 * mappas i `eventformatEtikett` ur den befintliga format-läsningen.
 *
 * PUBLICERINGEN (task-19.4): handtagets armerade läge skickas som `publicera`
 * till create-event, som sätter det additiva bas-fältet `Publicerad på
 * miranon.se`. OARMERAT skickas ALDRIG som `false` — nyckeln utelämnas hela
 * vägen ned (adaptern), eftersom EF:ens fields-map är tät och ett skrivet
 * `false` skulle SÄTTA fältet. Vad flaggan STYR på miranon.se (kalender-
 * synlighet, anmälningsformulär, event-sida) är T79:s kontrakt, inte detta
 * korts — här armeras den bara.
 *
 * KONTRAKTET (ADR-066, oförändrat — ingen ny operation): server-side-byggd
 * fält-shape, allowlist-SSOT, Airtable-nativ upsert-idempotens på en KLIENT-
 * genererad nyckel som skapas EN gång per formulär-öppning (lazy useState) och
 * bevaras över alla retries av detta event — aldrig per knapptryck.
 *
 * PESSIMISTISK UI (ADR-066 b4): submit → knappen låst + pending → server-OK
 * (201 created ELLER 200 idempotent replay, BÅDA framgång) → invalidera
 * event-cachen → BEKRÄFTELSELÄGE (PRD-berättelse 8: nästa steg ett klick bort);
 * fel → inline-meddelande, knappen åter aktiv, FORMULÄRVÄRDEN BEVARADE.
 */
export function CreateEventForm() {
  const dataSource = useDataSource();
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bekraftelseRef = useRef<HTMLDivElement>(null);

  // Idempotens-nyckel: en per formulär-öppning (remount), bevarad över retries.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Formulärvärden (bevaras vid fel — ingen tappad inmatning).
  const [event, setEvent] = useState('');
  const [eventtyp, setEventtyp] = useState('');
  const [ort, setOrt] = useState('');
  const [datum, setDatum] = useState<{ start: CalendarDate; end: CalendarDate } | null>(null);
  const [maxPlatser, setMaxPlatser] = useState<number | null>(null);
  const [format, setFormat] = useState('');
  // Publicerings-handtaget: armerat läge skickas som `publicera` till create-event (19.4).
  const [publicera, setPublicera] = useState(false);
  const [visaFel, setVisaFel] = useState(false); // true efter första Skapa-försöket

  // Eventformat-options — fetch, ingen hårdkodad lista (ADR-066 b5).
  const formats = useQuery({
    queryKey: queryKeys.events.formats,
    queryFn: () => dataSource.getEventFormats(),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Befintliga event → härled Event- + Eventtyp-options (självväxande, ingen stale-lista).
  const events = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const eventOptions = useMemo(
    () => distinct((events.data ?? []).map((e) => e.eventNamn)),
    [events.data],
  );
  const eventtypOptions = useMemo(
    () => distinct((events.data ?? []).map((e) => e.typ)),
    [events.data],
  );

  // Mutationen extraherad till `useCreateEvent` (TASK-201.15, hemvistsluckan
  // — se hookens docblock). Beteendet oförändrat: samma onSuccess-kontrakt
  // (201/200-replay → invalidera events-cachen), nu plus fire-and-forget
  // aktivitetsloggning.
  const mutation = useCreateEvent();
  const skapat = mutation.isSuccess ? mutation.data : null;

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Skapa nytt event';
  }, []);

  // Bekräftelseläget tar fokus när det ersätter formuläret (fokus får aldrig
  // falla till <body> när knappen som trycktes försvinner).
  useEffect(() => {
    if (skapat) bekraftelseRef.current?.focus();
  }, [skapat]);

  const fel = {
    event: event === '',
    eventtyp: eventtyp === '',
    ort: ort.trim() === '',
    datum: datum == null,
    maxPlatser: maxPlatser == null || maxPlatser < 0,
    format: format === '',
  };
  const harFel = Object.values(fel).some(Boolean);

  const tillListan = () => navigate({ to: '/event' });

  function handleSubmit() {
    setVisaFel(true);
    if (harFel || datum == null || maxPlatser == null || mutation.isPending) return;
    mutation.mutate({
      event,
      typ: eventtyp,
      ort: ort.trim(),
      startdatum: datum.start.toString(),
      slutdatum: datum.end.toString(),
      maxPlatser,
      eventtyp: format,
      idempotencyKey,
      // Publiceringsflaggan (19.4): armerat läge armerar bas-fältet. Oarmerat
      // utelämnas hela vägen ned — adaptern skickar aldrig ett `false`.
      publicera,
    });
  }

  const rubrik = (
    <>
      {/* Toppraden: samma stora runda chevron som eventsidan (familjens form). */}
      <Link
        to="/event"
        aria-label="Tillbaka till event"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Skapa nytt event
        </h1>
      </header>
    </>
  );

  // BEKRÄFTELSELÄGET (PRD-berättelse 8): eventet är skapat — nästa steg är ett
  // klick bort (till eventet eller tillbaka till listan). Ersätter formuläret;
  // ingen automatisk omdirigering (skapandet ska KVITTERAS, inte bara hända).
  if (skapat) {
    return (
      <section className="flex flex-col gap-6 pt-2 lg:pt-10">
        {rubrik}
        <div
          ref={bekraftelseRef}
          tabIndex={-1}
          data-testid="bekraftelse"
          className="flex flex-col items-start gap-4 px-4 outline-none"
        >
          <MessageBox intent="success" title="Eventet är skapat">
            {skapat.eventlabel ?? skapat.eventNamn ?? 'Eventet'} finns nu i eventlistan.
          </MessageBox>
          <div className="flex items-center gap-2">
            <Button
              intent="success"
              onPress={() => navigate({ to: '/event/$eventId', params: { eventId: skapat.id } })}
            >
              Till eventet
            </Button>
            <Button intent="secondary" onPress={tillListan}>
              Till eventlistan
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {rubrik}

      {formats.isError && (
        <div className="px-4">
          <MessageBox intent="error" title="Kunde inte hämta eventformat">
            {formats.error instanceof Error ? formats.error.message : 'Inget felmeddelande angavs.'}{' '}
            Eventformat krävs för att skapa ett event - försök ladda om sidan.
          </MessageBox>
        </div>
      )}

      <DetaljGrupp id="skapa-event-om" rubrik="Om eventet">
        <div className="flex flex-col gap-4 py-4">
          {/* UI-Event → basens `Event (source)` (kursen). */}
          <div data-testid="falt-event">
            <Select
              label="Event"
              placeholder="Välj event"
              selectedKey={event || null}
              onSelectionChange={(k) => setEvent(String(k))}
              isRequired
              isDisabled={mutation.isPending}
              isInvalid={visaFel && fel.event}
              errorMessage="Välj ett event"
            >
              {eventOptions.map((o) => (
                <SelectItem key={o} id={o}>
                  {o}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* UI-Eventtyp → basens `Typ` (Utbildning/Föreläsning) — INTE basens
              fält som HETER Eventtyp (det är Eventformat-länken nedan). */}
          <div data-testid="falt-eventtyp">
            <Select
              label="Eventtyp"
              placeholder="Välj eventtyp"
              selectedKey={eventtyp || null}
              onSelectionChange={(k) => setEventtyp(String(k))}
              isRequired
              isDisabled={mutation.isPending}
              isInvalid={visaFel && fel.eventtyp}
              errorMessage="Välj en eventtyp"
            >
              {eventtypOptions.map((o) => (
                <SelectItem key={o} id={o}>
                  {o}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Input
            label="Ort"
            value={ort}
            onChange={setOrt}
            isRequired
            isDisabled={mutation.isPending}
            isInvalid={visaFel && fel.ort}
            errorMessage="Ange en ort"
          />

          {/* Datumspannet i familjens form (synlig etikett över fältet;
              DatumFalt bär aria-label). Felraden manuell: RAC-pickern har
              ingen errorMessage-slot i vår rad-form. */}
          <div className="flex flex-col gap-1" data-testid="falt-datum">
            <span className="text-(color:--mm-input-label-text) text-small">Datum</span>
            <I18nProvider locale="sv-SE">
              <DatumFalt value={datum} onChange={setDatum} />
            </I18nProvider>
            {visaFel && fel.datum && (
              <p className="text-(color:--mm-input-error-text) text-caption">
                Välj start- och slutdatum
              </p>
            )}
          </div>
        </div>
      </DetaljGrupp>

      <DetaljGrupp id="skapa-event-platser" rubrik="Platser och format">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1" data-testid="falt-platser">
            <span className="text-(color:--mm-input-label-text) text-small">Max antal platser</span>
            <I18nProvider locale="sv-SE">
              {/* Fältbredd speglar förväntat svar (GOV.UK-formregeln). */}
              <div className="w-32">
                <AntalFalt
                  label="Max antal platser"
                  value={maxPlatser}
                  min={0}
                  onChange={setMaxPlatser}
                />
              </div>
            </I18nProvider>
            {visaFel && fel.maxPlatser && (
              <p className="text-(color:--mm-input-error-text) text-caption">
                Ange antal platser (0 eller fler)
              </p>
            )}
          </div>

          {/* UI-Eventformat → basens `Eventtyp`-LÄNK (Eventformat-posten som
              driver Sessionsmall-lookupen). Etiketterna talar Lottas språk. */}
          <div data-testid="falt-eventformat">
            <Select
              label="Eventformat"
              placeholder={formats.isPending ? 'Laddar format…' : 'Välj eventformat'}
              selectedKey={format || null}
              onSelectionChange={(k) => setFormat(String(k))}
              isRequired
              isDisabled={mutation.isPending || formats.isPending}
              isInvalid={visaFel && fel.format}
              errorMessage="Välj ett eventformat"
            >
              {(formats.data ?? []).map((f) => (
                <SelectItem key={f.id} id={f.id}>
                  {eventformatEtikett(f)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>
      </DetaljGrupp>

      <DetaljGrupp id="skapa-event-publicering" rubrik="Publicering">
        <div className="py-4">
          {/* Handtaget renderas per facit men har ÄNNU ingen verkan: flaggan
              finns inte i basen och `publicera` skickas ALDRIG till
              create-event. task-19.4 wirar den (additivt bas-fält + allowlist). */}
          {/* Båda lägenas texter utan destination och i samma vikt (review-
              våg 5, punkt 15): "Dra för att publicera" / "Publiceras" —
              destinationen är självklar och bärs av aria-labeln. */}
          <SlideToConfirm
            label="Publicera på miranon.se"
            prompt="Dra för att publicera"
            confirmedLabel="Publiceras"
            isSelected={publicera}
            onChange={setPublicera}
          />
        </div>
      </DetaljGrupp>

      {/* Knappraden: primär först (formklassen); px-4 = kortens inner-inset.
          Intenten följer publicerings-läget (dynamiska grön-regeln, review-
          våg 5): oarmerat når skapandet inget utomstående → primary; armerat
          publiceras eventet → success. K77:s statiska grön-form riven. */}
      <div className="flex items-center gap-2 px-4">
        <Button
          intent={publicera ? 'success' : 'primary'}
          onPress={handleSubmit}
          isDisabled={mutation.isPending}
        >
          {mutation.isPending ? 'Skapar…' : 'Skapa event'}
        </Button>
        <Button intent="secondary" onPress={tillListan} isDisabled={mutation.isPending}>
          Avbryt
        </Button>
      </div>

      {/* Mutations-utfall — annonseras för skärmläsare. Vid fel: värden bevarade,
          knappen åter aktiv. */}
      <div aria-live="polite" aria-busy={mutation.isPending} className="px-4">
        {mutation.isPending && <p className="text-small text-text-muted">Skapar eventet…</p>}

        {mutation.isError && !mutation.isPending && (
          <MessageBox intent="error" title="Kunde inte skapa eventet">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Inget felmeddelande angavs.'}
          </MessageBox>
        )}
      </div>
    </section>
  );
}
