/**
 * [PROTOTYPE] — kastbar kod, levereras ALDRIG (throwaway-kontraktet,
 * prototype-skillen; klausul i+ii).
 *
 * FRÅGAN (nedskriven, styr formen): Hur ska EVENTSIDAN (detaljvyn
 * `/event/$eventId`) se ut i familje-grammatiken — konvergens från EXAKT
 * kopia av faktiska vyn tills Marcus låser facit?
 *
 * Konvergens-pass (T66 fas 2, fjärde instansen; S73). Divergens-överhoppet
 * är Marcus-beslutat vid S73-starten ("vi går direkt på konvergensen") —
 * S72-samsynens grund-arv täcker designbesluten; mönsterbesluten från
 * event-listans facit (S72 K1–K14) ärvs som utgångsläge. Underform A:
 * monteras på riktiga /event/$eventId-routen bakom `?variant=`, DEV-grindad.
 *
 * K1 = EXAKT kopia av EventDetail (render-strukturen + hjälparna kopierade
 * därifrån, INTE delade — prototypen ska vara fri att kasta sin form utan
 * att röra skarp kod). Enda avsteget är DATA-vägen: demo-data är
 * familje-default (S72 K2) via DEMO_EVENTS (samma substrat som listan —
 * lista→detalj-flödet landar på samma demo-event); `?data=verklig` är
 * opt-in och ärver befintlig dataväg (router-context-DI → staging i dev
 * per ADR-061). Inga writes (read-only-regeln).
 *
 * K2 (grund-arvet, Marcus-order): APP-REGLERNA appliceras — synlig h1
 * "Eventdetaljer" 30/600 (rubrikpolicyn S64; Marcus-vald sidrubrik),
 * eventnamnet = dominant innehåll under h1, Mer-rytmens topp-luft utan
 * egen sidopadding (main bär 16 px-inset), tonala sektionsytor per
 * DashboardCard-MÖNSTRET (etikett inne i kortet — kopierad form, ej delad
 * komponent), etikett-över-värde, långdatum aldrig rå ISO (Gunilla),
 * Lugnt laddläge-skeleton i slutgeometri. EVENT-KORTENS anatomi
 * (dagar-kvar-pill, 3-raders form, stapel) ärvs INTE — det är
 * list-materia, Marcus-klargjort vid K2-ordern.
 *
 * Iterationssteg K1… bokförs i sessionsdok S73; skarpt bygge sker
 * NYSKRIVET genom leverans-grindarna (klausul iv — denna kod absorberas
 * aldrig).
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import type { PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';
import { DEMO_EVENTS, type ProtoEvent } from './EventsListPrototype';

/**
 * Detaljsidans konvergens har (ännu) ingen divergens-axel: EN variant 'K'.
 * Familje-flödet lista→detalj bär listans variant-värde (A/B) i URL:en —
 * routen aliasar därför A/B/K → 'K' (delade växlarens alias-kontrakt).
 */
export const DETAIL_PROTO_VARIANTS: PrototypeVariant[] = [
  { key: 'K', label: 'Prototypen', steg: 1, stegLabel: 'K2 — grund-arvet (app-reglerna)' },
];

/* ── Hjälpare (kopierade ur EventDetail — medvetet odelade) ── */

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** Beläggning som TEXT (färg aldrig ensam bärare). Null-säker: osatt tak → ingen NaN. */
function belaggningText(e: Event): string {
  if (e.maxPlatser == null) return `${e.antalAnmalda} anmälda (platser ej satt)`;
  return `${e.antalAnmalda} av ${e.maxPlatser} platser`;
}

/** Fullt = inga platser kvar. `platserKvar` null (okänt tak) → ej "fullt". */
function isFull(e: Event): boolean {
  return e.platserKvar != null && e.platserKvar <= 0;
}

/** Beläggnings-procent (andel) som text, eller null när taket saknas. */
function percentText(e: Event): string | null {
  if (e.anmaldBelaggning == null) return null;
  return `${Math.round(e.anmaldBelaggning * 100)} %`;
}

/** En rad i en fält/värde-lista; hoppar tomma värden (renderar inte null).
    K2: etikett-ÖVER-värde (FK-mönstret, grund-arvet) — alltid staplad. */
function DescRow({ term, children }: { term: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-text-muted">{term}</dt>
      <dd className="text-body">{children}</dd>
    </div>
  );
}

/** Långdatum-spann per K10-facit — sv-SE, aldrig rå ISO (Gunilla). En dag →
    "31 juli 2026"; spann inom samma år → "31 juli – 2 augusti 2026"; över
    årsskifte → båda med år. Ogiltigt/saknat → "Datum ej satt". */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const DAGMANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });
function datumSpannText(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return 'Datum ej satt';
  if (!e.slutdatum || e.slutdatum === e.startdatum) return LANGDATUM.format(start);
  const end = new Date(e.slutdatum);
  if (Number.isNaN(end.getTime())) return LANGDATUM.format(start);
  return start.getFullYear() === end.getFullYear()
    ? `${DAGMANAD.format(start)} – ${LANGDATUM.format(end)}`
    : `${LANGDATUM.format(start)} – ${LANGDATUM.format(end)}`;
}

/** Tonal sektionsyta per DashboardCard-mönstret (grund-arvet: tonala ytor,
    h2-etikett INNE i kortet, text-xl semibold) — kopierad form, ej delad
    komponent (prototypen fri att kasta sin form). */
function ProtoSektion({
  id,
  etikett,
  children,
}: {
  id: string;
  etikett: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex min-w-0 flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong"
    >
      <h2 id={id} className="font-semibold text-xl">
        {etikett}
      </h2>
      {children}
    </section>
  );
}

/**
 * Demo-uppslaget: samma event som list-prototypens kort (per id). Okänt id
 * (t.ex. direkt-URL med verkligt id i demo-läge) → första kommande
 * demo-eventet som representativ bild — aldrig 404 i demo-läget (Marcus
 * ska aldrig mötas av en vägg i konvergensen).
 */
function demoEventById(eventId: string): ProtoEvent {
  return DEMO_EVENTS.find((e) => e.id === eventId) ?? DEMO_EVENTS[0];
}

/* ── Prototypen ── */

export function EventDetailPrototype({ eventId, useDemo }: { eventId: string; useDemo: boolean }) {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: fetched,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => dataSource.fetchEvent(eventId),
    enabled: !useDemo,
    // 4xx (inkl. 404) är klient-fel → meningslöst att retrya (speglar fetchPerson).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const event: ProtoEvent | undefined = useDemo ? demoEventById(eventId) : fetched;
  const notFound = error instanceof EdgeFunctionError && error.status === 404;

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning).
  useEffect(() => {
    if (event && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = `${eventName(event)} — Miranon Media Admin`;
    }
  }, [event]);

  const backLink = (
    // search-genomslaget: variant/data följer med tillbaka till list-prototypen.
    <Link to="/event" search={(prev) => prev} className="text-small underline">
      ← Tillbaka till event-listan
    </Link>
  );

  // K2: sid-chromen (h1 + topp-luft) står ALLTID i slutgeometri — bara
  // innehållsytan växlar mellan ladd/fel/laddat (Lugnt laddläge §15).
  const sidRam = (innehall: React.ReactNode) => (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {backLink}
      <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
        Eventdetaljer
      </h1>
      {innehall}
    </section>
  );

  if (!useDemo && isPending) {
    // Lugnt laddläge (grund-arvet, §15): skeleton i slutgeometri — identitets-
    // blocket + tre tonala kortytor; Roselli-anatomin (status + busy + sr-besked).
    return sidRam(
      <div role="status" aria-busy="true" className="flex flex-col gap-6">
        <span className="sr-only">Laddar event…</span>
        <Skeleton variant="text" className="w-3/5 text-2xl" />
        <Skeleton variant="listRow" className="h-44 rounded-2xl" />
        <Skeleton variant="listRow" className="h-32 rounded-2xl" />
        <Skeleton variant="listRow" className="h-36 rounded-2xl" />
      </div>,
    );
  }

  if (!useDemo && isError) {
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

  if (!event) return null; // nås ej: demo är synkron, verklig täcks ovan

  const percent = percentText(event);
  const full = isFull(event);

  return sidRam(
    <>
      {/* aria-live: bekräftar för skärmläsare att eventet anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Event ${eventName(event)} laddat.`}
      </p>

      {/* Identitetsblocket: eventnamnet är sidans dominanta innehåll under
          h1 (Marcus K2: sidrubriken är "Eventdetaljer", namnet är materian). */}
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold text-2xl">{eventName(event)}</h2>
        {event.tidKvarTillEvent && (
          <p className="text-small text-text-muted">{event.tidKvarTillEvent}</p>
        )}
      </header>

      <ProtoSektion id="proto-sektion-identitet" etikett="Om eventet">
        <dl className="flex flex-col gap-3">
          <DescRow term="Typ">{event.typ}</DescRow>
          <DescRow term="Ort">{event.ort}</DescRow>
          <DescRow term="Datum">{datumSpannText(event)}</DescRow>
          <DescRow term="Status">{event.status}</DescRow>
        </dl>
      </ProtoSektion>

      <ProtoSektion id="proto-sektion-belaggning" etikett="Beläggning">
        {/* Beläggning bärs av TEXT; "Fullt" + procent gör bilden begriplig. */}
        <p className="text-small">
          {belaggningText(event)}
          {full ? ' · Fullt' : ''}
          {percent ? ` · ${percent} fullt` : ''}
        </p>
        <dl className="flex flex-col gap-3">
          <DescRow term="Platser kvar">
            {event.platserKvar != null ? String(event.platserKvar) : null}
          </DescRow>
        </dl>
      </ProtoSektion>

      <ProtoSektion id="proto-sektion-betalning" etikett="Betalningar">
        <p className="text-small">
          {`${event.antalAnmalningsavgifter} av ${event.antalAnmalda} har betalat anmälningsavgift.`}
        </p>
        <p className="text-small">
          {`Slutbetalningar: ${event.antalSlutbetalningar} mottagna` +
            (event.antalSlutbetalningFelande > 0
              ? `, ${event.antalSlutbetalningFelande} saknas.`
              : '.')}
        </p>
        <Link to="/event/$eventId/betalning" params={{ eventId }} className="text-small underline">
          Öppna betalnings-vyn →
        </Link>
      </ProtoSektion>

      <ProtoSektion id="proto-sektion-narvaro" etikett="Närvaro">
        {/* Ingen närvaro-siffra i get-event-shapen — gissa inte fält; länka bara. */}
        <Link to="/event/$eventId/narvaro" params={{ eventId }} className="text-small underline">
          Öppna närvaro-vyn →
        </Link>
      </ProtoSektion>

      <ProtoSektion id="proto-sektion-anmalda" etikett="Anmälda">
        {/* Ingen anmälda-siffra i get-event-shapen — gissa inte fält; länka bara
            (speglar närvaro-sektionens form). */}
        <Link to="/event/$eventId/anmalda" params={{ eventId }} className="text-small underline">
          Öppna anmälda-vyn →
        </Link>
      </ProtoSektion>
    </>,
  );
}
