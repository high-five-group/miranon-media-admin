import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';
import { I18nProvider } from 'react-aria-components';
import { AntalFalt } from '@/components/events/detail/AntalFalt';
import { DetaljGrupp } from '@/components/events/detail/DetaljGrupp';
import { datumSpannText } from '@/components/events/detail/datumSpann';
// [PROTOTYPE] S83 pass 4 (TASK-18.18) — kastbar import, rivs med passet.
import { EventValjarePrototyp } from '@/components/events/EventValjarePrototyp';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { TextArea } from '@/components/primitives/TextArea';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useCreateRegistration } from '@/data/mutations/useCreateRegistration';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';

// Samma format-grind som EF:en/modalen (medvetet enkel — servern är slutgiltig
// validator). Ersätter prototypens `includes('@')` med samma regex som skarpa vägen.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Manuell anmälan-sidan — SKARP (task-18.12; S73-facit K17/K18, bilagan
 * ManuellAnmalanPrototype). Ersätter prototypens no-op-sida: skapar en riktig
 * Anmälan via create-registration-vertikalen med Källa="Manuell" och server-satt
 * event-koppling (EventKey + Event-länk härleds server-side, klienten skickar bara
 * eventId ur routen). Vägen in för anmälningar utanför formuläret (telefon/mail).
 *
 * FORMKLASSEN (samma familje-grammatik som eventsidans grupper + CreateEventForm,
 * K75–K84): stor rund chevron + h1 med avgränsande linje + kontextrad (vilket event
 * anmälan gäller) · grupprubriker UTANFÖR de tonala korten (DetaljGrupp) · label-över-
 * fält · Antal platser som RAC NumberField (AntalFalt) i stället för text-Input ·
 * Notering som TextArea · fel visas först vid Spara-försöket, inte medan man skriver.
 * Facit-formens SEX fält = basens Anmälningar write-fält: Förnamn · Efternamn · E-post ·
 * Mobilnummer · Antal platser · Notering (Källa/EventKey/Event sätts av systemet).
 *
 * KONTRAKTET (befintlig create-registration-operation, ADR-059/ADR-066-form):
 * server-side-byggd fält-shape, allowlist-SSOT, idempotens på en KLIENT-genererad
 * nyckel som skapas EN gång per sid-öppning (lazy useState) och bevaras över retries.
 *
 * MÄRKNINGS-REGELN (K84, review-våg 7 — Marcus-frågan i omgransknings-protokollet
 * avgjord på delegerad senior-order): normen är att fältet krävs → markera
 * UNDANTAGEN, inte normen. CreateEventForm följer samma regel i sin ytterlighet
 * (allt krävs ⇒ ingen märkning alls); här bär de två frivilliga fälten
 * "(valfritt)" och de tre obligatoriska står omärkta. Familjen får därmed EN
 * regel i stället för två konventioner. `isRequired` står kvar på de tre — det
 * är plattformens semantik som bär a11y-golvet (skärmläsaren annonserar
 * "obligatorisk"), inte etikett-texten; Antal platser är omärkt eftersom det
 * alltid bär ett värde (default 1) och därför inte är ett undantag.
 *
 * BEKRÄFTELSE-COPYN (samma order): texten säger vad som HÄNDE i domänens ord —
 * platserna är RESERVERADE (ORDLISTA "Reserverad plats") och anmälan står
 * OBEKRÄFTAD tills bekräftelsen skickas (ORDLISTA Obekräftad/Bekräftad), vilket
 * kopplar bekräftelseläget till beläggnings-modellen i stället för att bara
 * kvittera en lyckad skrivning. Den interna fält-jargongen "källan Manuell" är
 * borttagen: Källa är spårbarhet och syns där den hör hemma — som pillen
 * "Manuellt tillagd" på personkortet i arbetskön.
 *
 * PESSIMISTISK UI (create kan 409:a — en rad ska aldrig blinka fram och försvinna,
 * useCreateRegistration-noten): submit → knappen låst + pending → 201 → aria-live +
 * roster-invalidering (i hooken) → BEKRÄFTELSELÄGE (nästa steg ett klick bort). 409
 * (dubblett) → inline affärs-fel, formuläret kvar med värden; övriga fel → MessageBox,
 * knappen åter aktiv, inmatningen bevarad.
 */
export function ManuellAnmalanForm({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bekraftelseRef = useRef<HTMLDivElement>(null);
  // [PROTOTYPE] S83 pass 4 (TASK-18.18): DEV-grindad väljar-gren.
  const [variantParam] = useQueryState('variant');
  const valjarProto = import.meta.env.DEV && variantParam === 'k';

  // Idempotens-nyckel: en per sid-öppning (remount), bevarad över retries (ADR-059).
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [fornamn, setFornamn] = useState('');
  const [efternamn, setEfternamn] = useState('');
  const [epost, setEpost] = useState('');
  const [mobil, setMobil] = useState('');
  const [antal, setAntal] = useState<number | null>(1);
  const [notering, setNotering] = useState('');
  const [visaFel, setVisaFel] = useState(false); // true efter första Spara-försöket

  const mutation = useCreateRegistration(eventId);
  const skapad = mutation.isSuccess ? mutation.data : null;

  // Kontextraden: vilket event anmälan gäller. Samma cache-nyckel som eventsidan →
  // normalt varm vid navigering från Åtgärder. 4xx retryas ej (CreateEventForm-formen).
  const eventQuery = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });
  const event = eventQuery.data;

  useEffect(() => {
    headingRef.current?.focus();
    document.title = 'Lägg till manuell anmälan — Miranon Media Admin';
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

  const tillbaka = () => navigate({ to: '/event/$eventId', params: { eventId } });

  function handleSubmit() {
    setVisaFel(true);
    if (harFel || mutation.isPending) return;
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

  // Fel-klassning (modal-precedent): 409 = affärs-dubblett (inline); övrigt = oväntat.
  const err = mutation.error;
  const isDuplicate = err instanceof EdgeFunctionError && err.status === 409;
  const otherError = mutation.isError && !isDuplicate ? err : null;

  const rubrik = (
    <>
      {/* Toppraden: samma stora runda chevron som eventsidan (familjens form). */}
      <Link
        to="/event/$eventId"
        params={{ eventId }}
        aria-label="Tillbaka till eventet"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>
      <header className="flex flex-col gap-2.5 border-border border-b px-4 pb-5">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
          Lägg till manuell anmälan
        </h1>
        {/* [PROTOTYPE] S83 pass 4 (18.18): `?variant=k` ersätter den låsta
            kontextraden med EVENTVÄLJAREN (förvald från djuplänken, bytbar —
            bytet navigerar URL:en; ifyllda fält behålls per rek b eftersom
            komponenterna inte remountas). Utan variant = skarpa raden orörd.
            Rivs med passet (klausul iv). */}
        {valjarProto ? (
          <div className="self-start">
            <EventValjarePrototyp
              eventId={eventId}
              to="/event/$eventId/ny-anmalan"
              form="kontextrad"
            />
          </div>
        ) : (
          event && (
            <p className="text-small text-text-secondary">
              {(event.eventlabel ?? event.eventNamn) && `${event.eventlabel ?? event.eventNamn} · `}
              {datumSpannText(event)}
            </p>
          )
        )}
      </header>
    </>
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
            {otherError instanceof Error ? otherError.message : 'Okänt fel.'}
          </MessageBox>
        )}
      </div>
    </section>
  );
}
