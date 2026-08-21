import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
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
 * Composern (K68–K71, rev. review-våg 3 2026-07-23): auto-grow-skrivruta +
 * "Spara" + sekundär "Rensa" som visas först när fältet har innehåll
 * (CRM-notes-klassens form — progressive disclosure av sekundärhandlingen).
 * Rensa tömmer fältet och återför fokus till skrivrutan (knappen försvinner —
 * fokus får aldrig tappas till body). Skrivningen är ICKE-optimistisk
 * (useCreateEventNote): pending→bekräftat, strömmen refetchar vid settle.
 * Fel-ytan (role=alert) renderas ur mutationens error. Författaren skickas
 * ALDRIG — EF:en sätter den server-side (ADR-075).
 *
 * [RIVEN, TASK-145.6] `protoDataMode` (`?data=proto`, review-fix-våg 2)
 * stubbade skrivrutan i hållplats-prototypens fixturläge — se
 * `Deltagare.tsx`/`Betalningar.tsx` för motsvarande rivning. Skarpa vyn
 * (denna funktion) var alltid skrivbar; ingen gren rörs.
 */
function Composer({ eventId, eventNamn }: { eventId: string; eventNamn: string | null }) {
  const [text, setText] = useState('');
  const rutaRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useCreateEventNote(eventId, eventNamn);
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
      {/* COMPOSERN VÄXER (S93 våg 20, Marcus 2026-08-06: "göra anteckningsrutan,
          inmatningsrutan större, typ dubbelt så hög. Jag tycker den ser lite
          fjuttig ut").

          `size="sm"` gav `min-h-16` = 64 px, DOM-mätt — och `rows={3}` bar
          ingenting, eftersom min-höjden ur `size` överskuggar den så länge
          `field-sizing-content` håller rutan på sitt minimum.

          Steget till `size="md"` (`min-h-28` = 112 px) är primitivens EGET
          nästa steg — inte ett handrullat `min-h-32`. Samma disciplin som
          T125/T127 slår fast för knappar och pillar: använd skalan, minta inte
          ett värde bredvid den. Det ger 1,75× i stället för exakt 2×, och
          "typ dubbelt" är precis den precision begäran bar.

          `md` byter dessutom `text-small` mot `text-body`, vilket är rätt för
          en yta där Lotta skriver prosa och inte läser data. `rows={4}` är
          reserven för webbläsare utan `field-sizing` (Firefox/äldre Safari) —
          uppdaterad från 3 så fallbacken matchar den nya min-höjden. */}
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
      <Composer eventId={event.id} eventNamn={event.eventNamn} />
      <div className="pt-3 pb-4">
        <Strommen event={event} />
      </div>
    </DetaljGrupp>
  );
}
