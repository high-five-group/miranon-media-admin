import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useCreatePersonNote } from '@/data/mutations/useCreatePersonNote';
import { useDataSource } from '@/data/useDataSource';
import type { PersonNote } from '@/domain/models/PersonNote';
import { queryKeys } from '@/queries/keys';

/**
 * Personens antecknings-STRÖM (S103, T97-bygg-spåret) — speglar eventsidans
 * `Anteckningar`-grupp (`src/components/events/detail/Anteckningar.tsx`,
 * task-18.11/ADR-075) EXAKT i form: composer överst + nyast först, författare
 * satt server-side ur den inloggade identiteten (ADR-075). SKILLNAD mot
 * event-varianten: ingen fas-etikett (Under/Efter) — den härleds ur eventets
 * dagar, ett begrepp personen inte har; person-anteckningar bär bara
 * författare + tidpunkt.
 *
 * SKILD FRÅN `Personer.Anteckningar` (det gamla odelade fritext-fältet, se
 * `PersonNoteEditor`) — de två ytorna lever BREDVID varandra (samma additiva
 * Anteckningar-tabell som event-strömmen, `ADR-075` utökad med ett Person-
 * länkfält 2026-08-10). Migrering av det gamla fältets innehåll till strömmen
 * är INTE denna komponents ansvar.
 *
 * Återanvändbar bibliotekskomponent (11/11/11) — monteras INTE här; konsument
 * äger placeringen (kort/sektion-skal) i persondetaljens D-variant.
 */

/** Full precision, Gunilla-läsbart: "20 juli 2026 18:00". */
const ANTECKNING_TID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Anteckningskortet — speglar `AnteckningsKort` (events/detail/Anteckningar.tsx)
 * minus fas-etiketten (personer har ingen eventdags-referens att härleda den ur).
 */
function AnteckningsKort({ note }: { note: PersonNote }) {
  const tid = ANTECKNING_TID.format(new Date(note.tidpunkt));
  return (
    <article className="flex flex-col gap-1.5 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 contrast-more:border-(--mm-navcard-border-contrast)">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-body">{note.forfattare ?? 'Okänd'}</span>
        <span className="shrink-0 text-caption text-text-muted">{tid}</span>
      </div>
      <p className="whitespace-pre-line text-body">{note.text}</p>
    </article>
  );
}

/**
 * Composern — speglar events/detail/Anteckningar.tsx:s `Composer` EXAKT
 * (auto-grow-skrivruta + "Spara" + sekundär "Rensa" som visas först vid
 * innehåll, CRM-notes-formen). ICKE-optimistisk (`useCreatePersonNote`):
 * pending→bekräftat, strömmen refetchar vid settle. Författaren skickas
 * ALDRIG — EF:en sätter den server-side (ADR-075).
 */
function Composer({ personId, personNamn }: { personId: string; personNamn: string | null }) {
  const [text, setText] = useState('');
  const rutaRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useCreatePersonNote(personId, personNamn);
  const kanSpara = text.trim().length > 0 && !mutation.isPending;

  const spara = () => {
    const rensad = text.trim();
    if (!rensad || mutation.isPending) return;
    mutation.mutate(rensad, { onSuccess: () => setText('') });
  };

  const rensa = () => {
    setText('');
    rutaRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2 pt-4 pb-3">
      <TextArea
        ref={rutaRef}
        label="Ny anteckning"
        hideLabel
        size="md"
        rows={4}
        autoGrow
        placeholder="Skriv en anteckning …"
        value={text}
        onChange={setText}
      />
      {mutation.isError && (
        <MessageBox intent="error" title="Kunde inte spara anteckningen">
          {mutation.error instanceof Error ? mutation.error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      )}
      <div className="flex items-center justify-end gap-2">
        {text.length > 0 && (
          <Button intent="ghost" size="sm" onPress={rensa}>
            Rensa
          </Button>
        )}
        <Button size="sm" onPress={spara} isDisabled={!kanSpara}>
          Spara
        </Button>
      </div>
    </div>
  );
}

/**
 * Strömmen — nyast först (EF:en sorterar server-side). Lugnt laddläge (sr-besked,
 * ingen synlig "Laddar…"-textrad utöver status-raden); fel via MessageBox
 * (role=alert); tomt läge som lugn textrad. Egen `persons.notes`-nyckel
 * (invalideras av `useCreatePersonNote`) — delar INTE persondetaljens cache.
 */
function Strommen({ personId }: { personId: string }) {
  const dataSource = useDataSource();
  const {
    data: notes,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.persons.notes(personId),
    queryFn: () => dataSource.fetchPersonNotes(personId),
    // 4xx är klient-fel → meningslöst att retrya (speglar event-strömmens val).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  if (isPending) {
    // Lugnt laddläge (Laddtrappan steg 1, DESIGN-SYSTEM-SPEC §15): skeleton i
    // AnteckningsKort-kortets EGEN geometri (Roselli-anatomin) i stället för en
    // naken "Laddar…"-textrad.
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-2.5">
        <span className="sr-only">Laddar anteckningar…</span>
        <div className="flex flex-col gap-1.5 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 contrast-more:border-(--mm-navcard-border-contrast)">
          <Skeleton variant="text" className="w-2/5" />
          <Skeleton variant="text" className="w-4/5" />
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 contrast-more:border-(--mm-navcard-border-contrast)">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-3/5" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <MessageBox intent="error" title="Kunde inte hämta anteckningarna">
        {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
      </MessageBox>
    );
  }

  if (notes.length === 0) {
    return <p className="text-caption text-text-muted">Inga anteckningar ännu</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {notes.map((note) => (
        <li key={note.id}>
          <AnteckningsKort note={note} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Personens anteckningar — composer + strömmen är de TVÅ direkta barnen.
 * Ingen omslutande sektions-/kort-skal (till skillnad mot event-varianten,
 * som bär `DetaljGrupp`): den skalen är event-detaljsidans EGEN grammatik
 * (`src/components/events/detail/DetaljGrupp.tsx`), inte en delad primitiv —
 * konsumenten (persondetaljens D-variant) väljer sitt eget kort-/sektions-skal
 * runt denna komponent.
 *
 * `personNamn` (TASK-201.4, AKTIVITETSLOGGEN): trådas vidare till `Composer`
 * — se `useCreatePersonNote`s docblock för varför den behövs här och inte
 * kan härledas ur EF-svaret.
 */
export function PersonAnteckningar({
  personId,
  personNamn,
}: {
  personId: string;
  personNamn: string | null;
}) {
  return (
    <div className="flex flex-col divide-y divide-border">
      <Composer personId={personId} personNamn={personNamn} />
      <div className="pt-3 pb-4">
        <Strommen personId={personId} />
      </div>
    </div>
  );
}
