import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { MailLogEntry } from '@/domain/models/MailPayload';
import { queryKeys } from '@/queries/keys';

/** Visningsnamn för ett utskick — aldrig record-ID, aldrig tomt (Gunilla-princip).
 * utskicksNamn → mailutskickCopy → generisk etikett (namnlösa utskick är legitim data). */
function displayName(entry: MailLogEntry): string {
  return entry.utskicksNamn || entry.mailutskickCopy || 'Namnlöst utskick';
}

/** "Skickat" — createdTime som läsbart sv-SE-datum (Gunilla: aldrig rå ISO).
 * datum (createdTime) är alltid present; Number.isNaN-grenen är ren defensiv robusthet. */
function skickatDatum(entry: MailLogEntry): string | null {
  const t = Date.parse(entry.datum);
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('sv-SE');
}

/**
 * Öppningsgrad som läsbar procent. `oppningsgrad` är en DECIMAL 0–1 (percent-formula);
 * NULL betyder division-by-zero (antalSkickade = 0) → "—", ALDRIG "NaN %"/"null %".
 * Null hanteras FÖRE formatering (kritiskt — annars läcker NaN till UI:t).
 */
function oppningsgradText(entry: MailLogEntry): string {
  if (entry.oppningsgrad == null) return '—';
  return `${Math.round(entry.oppningsgrad * 100)} %`;
}

/** En fält/värde-rad; renderar inte tomma värden (null/''), aldrig "null" i UI:t. */
function Field({ term, value }: { term: string; value: string | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="text-text-muted sm:min-w-32">{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Ett loggat utskick: namn som rubrik + fält/värde-lista. `break-inside-avoid` håller
 * raden samlad över sidbrytning vid utskrift (§4 print-golv — minst läsbar utskrift). */
function MailLogRow({ entry }: { entry: MailLogEntry }) {
  return (
    <li className="flex break-inside-avoid flex-col gap-1 border-text-muted/20 border-b pb-3">
      <span className="font-medium">{displayName(entry)}</span>
      <dl className="flex flex-col gap-0.5 text-small">
        <Field term="Skickat" value={skickatDatum(entry)} />
        <Field term="Mottagare" value={`${entry.antalSkickade} mottagare`} />
        {/* Öppningsgrad visas alltid (även "—" vid 0 skickade) — metriken finns. */}
        <Field term="Öppningsgrad" value={oppningsgradText(entry)} />
        <Field term="Segment/filter" value={entry.filterSnapshot} />
      </dl>
    </li>
  );
}

/**
 * Maillogg-vy (Fas 6e L2 Landning 2) — GLOBAL LÄS-vy över utskicksloggen. Data via
 * `fetchMailLog()` → get-mail-log-EF (router-context-DI, ADR-055), som hämtar HELA
 * Utskickslogg (ingen filter/event-gren) och sorterar createdTime desc → INGEN
 * klient-sortering här. Global lista (inga params).
 *
 * LÄSER bara: ingen write-affordans (mailutskick = L3 send-email, egen slice). Speglar
 * Waitlist/EventRegistrations 11/10-a11y-mönster EXAKT (väg A: datum/metrik som ren text).
 *
 * TOM-TILLSTÅND ÄR DET NORMALA: Utskickslogg fylls först när L3 send-email skickar
 * och loggar utskick. Tom-texten är därför ÄRLIG och icke-alarmerande ("Inga
 * mailutskick har loggats än.") — systemet är nytt, inte trasigt. 4xx → role=alert,
 * ingen retry (klient-fel). Print: semantisk block-layout + `break-inside-avoid`.
 *
 * A11y (11/10, speglar Waitlist):
 * - `<h1>` = "Maillogg"; fokus flyttas dit när data anlänt ([] är giltigt laddat → fokus ändå).
 * - Data-anländning annonseras i `aria-live="polite"`.
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel: `role="alert"` via MessageBox (ingen dubbel-announcer — L138).
 * - `document.title` sätts när laddat.
 * - "Tillbaka till Mer"-länk (→ `/mer`), närvarande i alla tillstånd.
 */
export function MailLog() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: maillog,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.maillog.all,
    queryFn: () => dataSource.fetchMailLog(),
    // 4xx är klient-fel → meningslöst att retrya (speglar Waitlist).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning). [] är ett
  // giltigt laddat tillstånd (tom logg = NORMALT) → fokus flyttas ändå.
  useEffect(() => {
    if (maillog && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Maillogg';
    }
  }, [maillog]);

  const backLink = (
    <Link to="/mer" className="text-small underline">
      ← Tillbaka till Mer
    </Link>
  );

  if (isPending) {
    // Lugnt laddläge (Laddtrappan steg 1, DESIGN-SYSTEM-SPEC §15): skeleton i
    // listans SLUTGEOMETRI (rubrik + tre radplatshållare, Roselli-anatomin) i
    // stället för en naken "Laddar…"-textrad — layout-skift ≈ 0 mot laddat läge.
    return (
      <section className="flex flex-col gap-6 p-4">
        {backLink}
        <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Laddar maillogg…</span>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-28 text-2xl" />
            <Skeleton variant="text" className="w-20 text-small" />
          </div>
          <div className="flex flex-col gap-3">
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4 p-4">
        {backLink}
        <MessageBox intent="error" title="Kunde inte hämta maillogg">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att loggen anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Maillogg laddad.
      </p>

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Maillogg
        </h1>
        {/* Antal som TEXT — översikt, aldrig enbart färg. */}
        <p className="text-small text-text-muted">{`${maillog.length} utskick`}</p>
      </header>

      {maillog.length === 0 ? (
        // TOM = NORMALT (loggen fylls av L3 send-email) → ärlig, icke-alarmerande text.
        <p className="text-small text-text-muted">Inga mailutskick har loggats än.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {maillog.map((entry) => (
            <MailLogRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
