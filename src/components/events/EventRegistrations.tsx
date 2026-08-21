import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Registration } from '@/domain/models/Registration';
import { queryKeys } from '@/queries/keys';
import { AddRegistrationModal } from './AddRegistrationModal';

/** Visningsnamn ur de namnfält Airtable kan leverera — aldrig record-ID, aldrig tomt (Gunilla). */
function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

/** Status som läsbar TEXT — färg är aldrig ensam bärare. Ingen status-primitiv finns (väg A);
 * roster renderar status i samma rena-text-form som EventDetail/EventAttendance. */
function statusText(reg: Registration): string {
  return reg.status ?? 'Okänd status';
}

/** Inskickad som läsbart sv-SE-datum (Gunilla: aldrig rå ISO-sträng); null/ogiltigt → null. */
function inskickadDatum(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('sv-SE');
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

/** En anmäld: namn som rubrik + fält/värde-lista. `break-inside-avoid` håller raden
 * samlad över sidbrytning vid utskrift (§4 print-golv — minst läsbar utskrift). */
function RegistrationRow({ reg }: { reg: Registration }) {
  return (
    <li className="flex break-inside-avoid flex-col gap-1 border-text-muted/20 border-b pb-3">
      <span className="font-medium">{displayName(reg)}</span>
      <dl className="flex flex-col gap-0.5 text-small">
        <Field term="Status" value={statusText(reg)} />
        <Field term="Antal platser" value={String(reg.antalPlatser)} />
        <Field term="Inskickad" value={inskickadDatum(reg)} />
        <Field term="E-post" value={reg.email} />
        <Field term="Telefon" value={reg.telefon} />
      </dl>
    </li>
  );
}

/**
 * Anmälda-vy (Fas 6c L2) — LÄS-vy över ett events anmälningar (Anmälningar per event).
 * Data via `fetchRegistrations({ eventId })` → get-registrations-EF (router-context-DI,
 * ADR-055), vars eventId-gren batch-hämtar via `Anmälningar (länkat fält)` (T15 väg D)
 * och sorterar Inskickad-desc serverside → INGEN klient-sortering här.
 *
 * LÄSER bara: ingen "markera som betald"/write-affordans — betalnings-write är
 * betalnings-vyns jobb (RegistrationsList + MarkPaidButton, Fas 5.5). Denna vy
 * speglar EventAttendance:s 11/10-a11y-mönster EXAKT (väg A: status som ren text,
 * ingen status-primitiv byggs).
 *
 * Tom-state (event utan anmälningar) → vänlig tom-text, ej fel. 4xx → role=alert,
 * ingen retry (klient-fel). Print: semantisk block-layout + `break-inside-avoid`
 * per rad ger minst läsbar utskrift (§4 print-golv för anmälningslista).
 *
 * A11y (11/10, speglar EventAttendance/EventDetail):
 * - `<h1>` = "Anmälda"; fokus flyttas dit när data anlänt ([] är giltigt laddat).
 * - Data-anländning annonseras i `aria-live="polite"`.
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel: `role="alert"` via MessageBox (ingen dubbel-announcer).
 * - `document.title` sätts när laddat.
 * - "Tillbaka till eventet"-länk (→ info-vyn `/event/$eventId`).
 * - Status/antal/datum som läsbar text (skärmläsaren får hela bilden).
 */
export function EventRegistrations({ eventId }: { eventId: string }) {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: registrations,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.registrations.byEvent(eventId),
    queryFn: () => dataSource.fetchRegistrations({ eventId }),
    // 4xx är klient-fel → meningslöst att retrya (speglar EventAttendance/EventDetail).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning). [] är ett
  // giltigt laddat tillstånd (event utan anmälningar) → fokus flyttas ändå.
  useEffect(() => {
    if (registrations && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Anmälda';
    }
  }, [registrations]);

  const backLink = (
    <Link to="/event/$eventId" params={{ eventId }} className="text-small underline">
      ← Tillbaka till eventet
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
          <span className="sr-only">Laddar anmälda…</span>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-32 text-2xl" />
            <Skeleton variant="text" className="w-24 text-small" />
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
        <MessageBox intent="error" title="Kunde inte hämta anmälda">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att anmälda anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Anmälda laddade.
      </p>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
            Anmälda
          </h1>
          {/* Antal som TEXT — översikt, aldrig enbart färg. */}
          <p className="text-small text-text-muted">{`${registrations.length} anmälda`}</p>
        </div>
        {/* ADDITIV write-affordans (Fas 6c L4) — rostern ovan förblir read-only;
            modalen skapar via create-registration-EF och invaliderar denna query. */}
        <AddRegistrationModal eventId={eventId} />
      </header>

      {registrations.length === 0 ? (
        <p className="text-small text-text-muted">Inga anmälda för det här eventet än.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {registrations.map((reg) => (
            <RegistrationRow key={reg.id} reg={reg} />
          ))}
        </ul>
      )}
    </section>
  );
}
