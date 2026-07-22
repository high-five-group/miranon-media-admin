import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { CreateEventInput } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

const STATUS_DEFAULT = 'Planerat';

/** Distinkta, sorterade icke-tomma värden (för options härledda ur befintliga event). */
function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v))].sort((a, b) =>
    a.localeCompare(b, 'sv'),
  );
}

/**
 * Skapa-nytt-event-formulär (Fas 6f L2, ADR-066) — appens create-event-vertikal klient-side.
 * Speglar SegmentBuilder (6g L2): fält-primitiver + a11y + pessimistisk mutation.
 * HEMVIST: event-familjens /event/skapa (hemvist-flytten task-19.2; back-länken går till
 * event-listan). Formens innehåll mot S73-facit-utökningen ägs av task-19.3.
 *
 * PESSIMISTISK UI (ADR-066 b4): submit → knapp disabled + pending → server-OK (201 created
 * ELLER 200 idempotent replay, BÅDA framgång) → invalidera event-listan + navigera till det
 * skapade eventet → fel → inline {error}, knapp åter aktiv, FORMULÄRVÄRDEN BEVARADE. Ingen
 * optimistisk cache-insert / temp-id (servern tilldelar EventKey/Event-nr).
 *
 * IDEMPOTENCY-KEY (ADR-066 b3): genereras EN gång när formuläret öppnas (lazy useState) och
 * bevaras över alla submit-retries av DETTA event (knapp-spam, nätverks-retry). En ny nyckel
 * uppstår först vid remount (nytt event) — ALDRIG per knapptryck.
 *
 * Eventtyp (REQUIRED, ADR-066 b5) hämtas ur get-event-formats (ingen hårdkodad options-lista).
 * Event(source)/Typ-options härleds ur befintliga event (get-events, självväxande) — ingen
 * stale options-spegel. a11y: fokus→<h1> + document.title vid laddning; required-fält annoterade.
 */
export function CreateEventForm() {
  const dataSource = useDataSource();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  // Idempotency-nyckel: en per formulär-öppning (remount), bevarad över retries.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Formulärvärden (bevaras vid fel — ingen tappad inmatning).
  const [event, setEvent] = useState('');
  const [typ, setTyp] = useState('');
  const [ort, setOrt] = useState('');
  const [startdatum, setStartdatum] = useState('');
  const [slutdatum, setSlutdatum] = useState('');
  const [maxPlatser, setMaxPlatser] = useState('');
  const [eventtyp, setEventtyp] = useState('');
  const [submitted, setSubmitted] = useState(false); // true efter första submit-försöket → visa fel

  // Eventformat-options (Eventtyp-dropdown) — fetch, ingen hårdkodning (ADR-066 b5).
  const formats = useQuery({
    queryKey: queryKeys.events.formats,
    queryFn: () => dataSource.getEventFormats(),
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Befintliga event → härled Event(source)- + Typ-options (självväxande, ingen stale-lista).
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
  const typOptions = useMemo(() => distinct((events.data ?? []).map((e) => e.typ)), [events.data]);

  const mutation = useMutation({
    mutationFn: (input: CreateEventInput) => dataSource.createEvent(input),
    onSuccess: (created) => {
      // 201 (created) OCH 200 (replay) → samma framgång. Invalidera listan + navigera
      // till det skapade eventet (samma destination även vid idempotent replay).
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      navigate({ to: '/event/$eventId', params: { eventId: created.id } });
    },
  });

  useEffect(() => {
    if ((formats.data || events.data) && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Skapa nytt event — Miranon Media Admin';
    }
  }, [formats.data, events.data]);

  const maxPlatserNum = Number(maxPlatser);
  const maxPlatserValid =
    maxPlatser.trim() !== '' && Number.isFinite(maxPlatserNum) && maxPlatserNum >= 0;
  const eventtypMissing = eventtyp === '';
  const canSubmit =
    event !== '' &&
    typ !== '' &&
    ort.trim() !== '' &&
    startdatum !== '' &&
    slutdatum !== '' &&
    maxPlatserValid &&
    !eventtypMissing;

  function handleSubmit() {
    setSubmitted(true);
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate({
      event,
      typ,
      ort: ort.trim(),
      startdatum,
      slutdatum,
      maxPlatser: maxPlatserNum,
      eventtyp,
      idempotencyKey,
    });
  }

  const backLink = (
    <Link to="/event" className="text-small underline">
      ← Tillbaka till Event
    </Link>
  );

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Skapa nytt event
        </h1>
        <p className="text-small text-text-muted">
          Fyll i uppgifterna för det nya eventet. Eventnummer och anmälningslänk skapas automatiskt.
          Status sätts till <strong>{STATUS_DEFAULT}</strong>.
        </p>
      </header>

      {formats.isError && (
        <MessageBox intent="error" title="Kunde inte hämta eventformat">
          {formats.error instanceof Error ? formats.error.message : 'Okänt fel.'} Eventtyp krävs för
          att skapa ett event — försök ladda om sidan.
        </MessageBox>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Select
          label="Kurs (eventnamn)"
          placeholder="Välj kurs"
          selectedKey={event || null}
          onSelectionChange={(k) => setEvent(String(k))}
          isRequired
          isDisabled={mutation.isPending}
          isInvalid={submitted && event === ''}
          errorMessage="Välj en kurs."
        >
          {eventOptions.map((o) => (
            <SelectItem key={o} id={o}>
              {o}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Typ"
          placeholder="Välj typ"
          selectedKey={typ || null}
          onSelectionChange={(k) => setTyp(String(k))}
          isRequired
          isDisabled={mutation.isPending}
          isInvalid={submitted && typ === ''}
          errorMessage="Välj en typ."
        >
          {typOptions.map((o) => (
            <SelectItem key={o} id={o}>
              {o}
            </SelectItem>
          ))}
        </Select>

        <Input
          label="Ort"
          value={ort}
          onChange={setOrt}
          isRequired
          isDisabled={mutation.isPending}
          isInvalid={submitted && ort.trim() === ''}
          errorMessage="Ange en ort."
        />

        <Input
          label="Startdatum"
          type="date"
          value={startdatum}
          onChange={setStartdatum}
          isRequired
          isDisabled={mutation.isPending}
          isInvalid={submitted && startdatum === ''}
          errorMessage="Ange ett startdatum."
        />

        <Input
          label="Slutdatum"
          type="date"
          value={slutdatum}
          onChange={setSlutdatum}
          isRequired
          isDisabled={mutation.isPending}
          isInvalid={submitted && slutdatum === ''}
          errorMessage="Ange ett slutdatum."
        />

        <Input
          label="Max antal platser"
          type="number"
          value={maxPlatser}
          onChange={setMaxPlatser}
          isRequired
          isDisabled={mutation.isPending}
          isInvalid={submitted && !maxPlatserValid}
          errorMessage="Ange ett antal platser (0 eller fler)."
        />

        <Select
          label="Eventformat"
          placeholder={formats.isPending ? 'Laddar format…' : 'Välj eventformat'}
          selectedKey={eventtyp || null}
          onSelectionChange={(k) => setEventtyp(String(k))}
          isRequired
          isDisabled={mutation.isPending || formats.isPending}
          isInvalid={submitted && eventtypMissing}
          errorMessage="Eventformat krävs — det styr sessionsstrukturen."
        >
          {(formats.data ?? []).map((f) => (
            <SelectItem key={f.id} id={f.id}>
              {f.namn ?? f.id}
            </SelectItem>
          ))}
        </Select>

        {/* onPress (ej type="submit") — react-aria Button submittar inte ett vanligt
            <form> tillförlitligt (usePress); kodbas-idiomet är onPress (jfr SegmentBuilder).
            <form onSubmit> behålls för Enter-tangent-submit; button är type="button" (default). */}
        <Button
          intent="primary"
          onPress={handleSubmit}
          isDisabled={mutation.isPending || (submitted && !canSubmit)}
        >
          {mutation.isPending ? 'Skapar…' : 'Skapa event'}
        </Button>
      </form>

      {/* Mutations-utfall — annonseras för skärmläsare. Vid fel: värden bevarade, knapp åter aktiv. */}
      <div aria-live="polite" aria-busy={mutation.isPending}>
        {mutation.isPending && <p className="text-small text-text-muted">Skapar eventet…</p>}

        {mutation.isError && !mutation.isPending && (
          <MessageBox intent="error" title="Kunde inte skapa eventet">
            {mutation.error instanceof Error ? mutation.error.message : 'Okänt fel.'}
          </MessageBox>
        )}
      </div>
    </section>
  );
}
