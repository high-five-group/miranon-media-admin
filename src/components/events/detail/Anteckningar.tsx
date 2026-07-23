import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { TextArea } from '@/components/primitives/TextArea';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useCreateEventNote } from '@/data/mutations/useCreateEventNote';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { EventNote } from '@/domain/models/EventNote';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp } from './DetaljGrupp';

/**
 * Anteckningar (task-18.11; S73-facit K66–K71, ADR-075) — sidans sista grupp.
 * Tidsstämplad antecknings-STRÖM (CRM-notes-klassen, HubSpot/Pipedrive/Attio):
 * composer överst + nyast först. Varje anteckning bär författare (satt server-side
 * ur den inloggade identiteten — ADR-075) + tidpunkt, och en HÄRLEDD fas-etikett
 * (Under/Efter eventet) ur tidpunkten mot eventets dagar (Innan är omärkt — tysta
 * normen, K67). Skrivrutan är auto-grow-composern (TextArea autoGrow-varianten).
 *
 * Nyskriven mot facit-bilagan (throwaway-kontraktet — prototypkod absorberas aldrig).
 */

/** Full precision, Gunilla-läsbart: "20 juli 2026 18:00" (efter-anteckningar behöver året). */
const ANTECKNING_TID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** sv-SE:s standardformat är ÅÅÅÅ-MM-DD i LOKAL tid → lexikografiskt jämförbart med
    basens datumsträngar (Startdatum/Slutdatum är 'YYYY-MM-DD'). */
const DAGSTAMPEL = new Intl.DateTimeFormat('sv-SE');

/**
 * Fasen på DAGS-granularitet (K67): efter slutdagen = Efter, på eventdagarna = Under
 * (endagsevent: slut = start), FÖRE startdagen = normalfallet → omärkt (tysta normen).
 * Ren funktion — Marcus-framingen kodas i data, inte i inmatningsval.
 */
function anteckningsFas(tidpunktIso: string, event: Event): '' | 'Under eventet' | 'Efter eventet' {
  const start = event.startdatum;
  if (!start) return '';
  const slut = event.slutdatum ?? start;
  const parsad = new Date(tidpunktIso);
  if (Number.isNaN(parsad.getTime())) return '';
  const dag = DAGSTAMPEL.format(parsad);
  if (dag < start) return '';
  if (dag > slut) return 'Efter eventet';
  return 'Under eventet';
}

/**
 * Anteckningskortet — personkortens vita yta; författare + tidpunkt i huvudraden
 * (avsändaren är kontexten som läses först). Fas-etiketten sitter efter tidpunkten
 * (bara vid avvikelse från Innan-normen). Texten bevarar radbrytningar (whitespace-pre-line).
 */
function AnteckningsKort({ note, event }: { note: EventNote; event: Event }) {
  const fas = anteckningsFas(note.tidpunkt, event);
  const tid = ANTECKNING_TID.format(new Date(note.tidpunkt));
  return (
    <article className="flex flex-col gap-1.5 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 contrast-more:border-(--mm-navcard-border-contrast)">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-body">{note.forfattare ?? 'Okänd'}</span>
        <span className="shrink-0 text-caption text-text-muted">
          {tid}
          {fas && ` · ${fas}`}
        </span>
      </div>
      <p className="whitespace-pre-line text-body">{note.text}</p>
    </article>
  );
}

/**
 * Composern (K68–K71): auto-grow-skrivruta + "Lägg till anteckning". Skrivningen är
 * ICKE-optimistisk (useCreateEventNote): pending→bekräftat, strömmen refetchar vid
 * settle. Fel-ytan (role=alert) renderas ur mutationens error. Författaren skickas
 * ALDRIG — EF:en sätter den server-side (ADR-075).
 */
function Composer({ eventId }: { eventId: string }) {
  const [text, setText] = useState('');
  const mutation = useCreateEventNote(eventId);
  const kanSpara = text.trim().length > 0 && !mutation.isPending;

  const laggTill = () => {
    const rensad = text.trim();
    if (!rensad || mutation.isPending) return;
    mutation.mutate(rensad, { onSuccess: () => setText('') });
  };

  return (
    <div className="flex flex-col gap-2 pt-4 pb-3">
      <TextArea
        label="Ny anteckning"
        hideLabel
        size="sm"
        rows={3}
        autoGrow
        placeholder="Skriv en anteckning …"
        value={text}
        onChange={setText}
      />
      {mutation.isError && (
        <MessageBox intent="error" title="Kunde inte spara anteckningen">
          {mutation.error instanceof Error ? mutation.error.message : 'Okänt fel.'}
        </MessageBox>
      )}
      <Button size="sm" onPress={laggTill} isDisabled={!kanSpara} className="self-end">
        Lägg till anteckning
      </Button>
    </div>
  );
}

/**
 * Strömmen — nyast först (EF:en sorterar server-side). Lugnt laddläge (sr-besked, ingen
 * synlig "Laddar…"-textrad utöver status-raden); fel via MessageBox (role=alert); tomt
 * läge som lugn textrad. Delar INTE event-detaljens cache — egen `events.notes`-nyckel
 * (invalideras av useCreateEventNote).
 */
function Strommen({ event }: { event: Event }) {
  const dataSource = useDataSource();
  const {
    data: notes,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.notes(event.id),
    queryFn: () => dataSource.fetchEventNotes(event.id),
    // 4xx är klient-fel → meningslöst att retrya (speglar EventDetail/Narvaro).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  if (isPending) {
    return (
      <p role="status" aria-live="polite" aria-busy="true" className="text-small text-text-muted">
        Laddar anteckningar…
      </p>
    );
  }

  if (isError) {
    return (
      <MessageBox intent="error" title="Kunde inte hämta anteckningarna">
        {error instanceof Error ? error.message : 'Okänt fel.'}
      </MessageBox>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="text-caption text-text-muted">
        Inga anteckningar ännu — det du skriver här sparas med tidpunkt och namn.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {notes.map((note) => (
        <li key={note.id}>
          <AnteckningsKort note={note} event={event} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Anteckningar-gruppen på eventsidan (task-18.11). Composern + strömmen är de TVÅ
 * direkta barnen i DetaljGrupps tonala kort → divide-y ger EN avdelare mellan dem
 * (facit-formen: linje under composern). Grupp-skalet delas med sidans övriga grupper.
 */
export function Anteckningar({ event }: { event: Event }) {
  return (
    <DetaljGrupp id="grupp-anteckningar" rubrik="Anteckningar">
      <Composer eventId={event.id} />
      <div className="pt-3 pb-4">
        <Strommen event={event} />
      </div>
    </DetaljGrupp>
  );
}
