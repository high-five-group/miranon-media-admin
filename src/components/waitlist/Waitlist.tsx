import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { WaitlistEntry } from '@/domain/models/WaitlistEntry';
import { queryKeys } from '@/queries/keys';

/** Visningsnamn ur namnfälten — aldrig record-ID, aldrig tomt (Gunilla-princip). */
function displayName(entry: WaitlistEntry): string {
  const composed = [entry.fornamn, entry.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

/** "Ställde sig" — createdTime som läsbart sv-SE-datum (Gunilla: aldrig rå ISO). */
function stalldeSig(entry: WaitlistEntry): string | null {
  const t = Date.parse(entry.createdTime);
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('sv-SE');
}

/**
 * Informationsmail-1-status som läsbar TEXT (väg A — ingen status-primitiv). "Ej
 * skickat" är meningsfull info, inte tomt → visas alltid (till skillnad från
 * null-gömmande fält). Satt dateTime → "Skickat <sv-SE-datum>".
 */
function infomailStatus(entry: WaitlistEntry): string {
  if (!entry.informationsmail1Skickad) return 'Ej skickat';
  const t = Date.parse(entry.informationsmail1Skickad);
  return Number.isNaN(t) ? 'Skickat' : `Skickat ${new Date(t).toLocaleDateString('sv-SE')}`;
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

/** En väntande: namn som rubrik + fält/värde-lista. `break-inside-avoid` håller raden
 * samlad över sidbrytning vid utskrift (§4 print-golv — minst läsbar utskrift). */
function WaitlistRow({ entry }: { entry: WaitlistEntry }) {
  return (
    <li className="flex break-inside-avoid flex-col gap-1 border-text-muted/20 border-b pb-3">
      <span className="font-medium">{displayName(entry)}</span>
      <dl className="flex flex-col gap-0.5 text-small">
        <Field term="Ställde sig" value={stalldeSig(entry)} />
        <Field term="E-post" value={entry.email} />
        <Field term="Telefon" value={entry.telefon} />
        {/* Informationsmail-status visas alltid ("Ej skickat" är meningsfullt). */}
        <Field term="Informationsmail 1" value={infomailStatus(entry)} />
      </dl>
    </li>
  );
}

/**
 * Väntelista-vy (Fas 6c Leverabel 3) — GLOBAL LÄS-vy över den aktiva väntelistan.
 * Data via `fetchWaitlist()` → get-waitlist-EF (router-context-DI, ADR-055), som
 * serverside-filtrerar NOT({Flyttad till anmälan}) och sorterar createdTime desc
 * (senaste-först) → INGEN klient-sortering här. Global lista (inget eventId).
 *
 * LÄSER bara: ingen flytta-till-anmälan/write-affordans (waitlist.convert-to-
 * registration är en framtida write-slice, egen allowlist). Speglar
 * EventRegistrations/EventAttendance:s 11/10-a11y-mönster EXAKT (väg A: status som
 * ren text, ingen status-primitiv byggs).
 *
 * Tom väntelista → vänlig tom-text, ej fel. 4xx → role=alert, ingen retry
 * (klient-fel). Print: semantisk block-layout + `break-inside-avoid` per rad.
 *
 * A11y (11/10, speglar EventRegistrations):
 * - `<h1>` = "Väntelista"; fokus flyttas dit när data anlänt ([] är giltigt laddat).
 * - Data-anländning annonseras i `aria-live="polite"`.
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel: `role="alert"` via MessageBox (ingen dubbel-announcer).
 * - `document.title` sätts när laddat.
 * - "Tillbaka till Mer"-länk (→ `/mer`, varifrån vyn nås).
 * - Datum/status som läsbar text (skärmläsaren får hela bilden).
 */
export function Waitlist() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: waitlist,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.waitlist.all,
    queryFn: () => dataSource.fetchWaitlist(),
    // 4xx är klient-fel → meningslöst att retrya (speglar EventRegistrations).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning). [] är ett
  // giltigt laddat tillstånd (tom väntelista) → fokus flyttas ändå.
  useEffect(() => {
    if (waitlist && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Väntelista';
    }
  }, [waitlist]);

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
          <span className="sr-only">Laddar väntelistan…</span>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-32 text-2xl" />
            <Skeleton variant="text" className="w-40 text-small" />
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
        <MessageBox intent="error" title="Kunde inte hämta väntelistan">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att väntelistan anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Väntelistan laddad.
      </p>

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Väntelista
        </h1>
        {/* Antal som TEXT — översikt, aldrig enbart färg. */}
        <p className="text-small text-text-muted">{`${waitlist.length} på väntelistan`}</p>
      </header>

      {waitlist.length === 0 ? (
        <p className="text-small text-text-muted">Väntelistan är tom.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {waitlist.map((entry) => (
            <WaitlistRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
