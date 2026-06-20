import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Attendance } from '@/domain/models/Attendance';
import { AttendanceSession, AttendanceStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';

// Sessioner i visnings-ordning. Ett event har bara VISSA sessioner (t.ex. enbart
// Föreläsning) — vi renderar bara grupper som har deltaganden, men alltid i denna
// ordning. Single source: AttendanceSession (Status.ts), aldrig hårdkodade strängar.
const SESSION_ORDER = [
  AttendanceSession.DAG_1,
  AttendanceSession.DAG_2,
  AttendanceSession.FORELASNING,
] as const;

// "Närvarande" i kurshistorik-mening = samma lynchpin som Deltaganden.Närvaropoäng
// (1 om Status ∈ {Närvarande, Deltog online}). Identisk mängd som basens formel —
// vyn får aldrig räkna närvaro annorlunda än rollup-kedjan.
const NARVARANDE_STATUSAR: ReadonlySet<string> = new Set([
  AttendanceStatus.NARVARANDE,
  AttendanceStatus.DELTOG_ONLINE,
]);

function isNarvarande(row: Attendance): boolean {
  return row.status != null && NARVARANDE_STATUSAR.has(row.status);
}

/** Läsbart namn — aldrig ett record-ID, aldrig tomt (Gunilla-princip). */
function personNamn(row: Attendance): string {
  return row.personNamn ?? 'Namn saknas';
}

/** Status som läsbar TEXT (skärmläsare får hela bilden; färg är aldrig ensam bärare). */
function statusText(row: Attendance): string {
  return row.status ?? 'Ej avstämt';
}

/** En sessions-grupp: rubrik + närvaro-sammanfattning + person-lista (NAMN + status-text). */
function SessionGroup({ session, rows }: { session: string; rows: Attendance[] }) {
  const narvarande = rows.filter(isNarvarande).length;
  const id = `narvaro-session-${session.replace(/\s+/g, '-')}`;

  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="font-semibold text-lg">
        {session}
      </h2>
      {/* Närvaro-räkning som TEXT — bärs aldrig av färg. */}
      <p className="text-small text-text-muted">{`${narvarande} av ${rows.length} närvarande`}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="text-small sm:min-w-64">{personNamn(row)}</span>
            <span className="text-small text-text-muted">{statusText(row)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Närvaro-vy (Fas 6b L3) — SESSIONS-GRUPPERAD LÄS-vy över ett events Deltaganden.
 * Data via `fetchAttendance` → get-attendance-EF (router-context-DI, ADR-055), som
 * berikar varje rad med läsbart `personNamn` (batch ur Personer.Namn).
 *
 * LÄSER bara: ingen markera-närvarande-knapp, ingen write/mutation. Närvaro-
 * markering är en framtida slice (egna deny/allow-test, som betalnings-write i 5.5).
 *
 * SESSIONS-GRUPPERAD, inte platt: varje anmäld person har EN Deltaganden-rad per
 * session (Dag 1 / Dag 2 / Föreläsning) — en platt lista skulle visa samma person
 * flera gånger. Grupperas per session (i fast ordning; bara sessioner med rader
 * renderas). Per grupp: "{n} av {total} närvarande" (lynchpin = Närvaropoäng-mängden).
 *
 * KOMMANDE vs PASSERAT: en kommande-event-vy är full av "Ej avstämt" — det är
 * FÖRVÄNTAT TILLSTÅND, inte fel (visas rakt av, ingen varnings-yta). Passerat event
 * = facit. Tomt event (inga deltaganden) → vänlig tom-text, ej fel.
 *
 * A11y (11/10, speglar EventDetail/PersonDetail):
 * - `<h1>` = "Närvaro"; fokus flyttas dit när data anlänt.
 * - Data-anländning annonseras i `aria-live="polite"`.
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel: `role="alert"` via MessageBox (ingen dubbel-announcer).
 * - `document.title` sätts när laddat.
 * - "Tillbaka till eventet"-länk (→ info-vyn `/event/$eventId`, varifrån vyn nås).
 * - Sessions-grupper som tillgängliga regioner (h2 under h1), status som läsbar text.
 */
export function EventAttendance({ eventId }: { eventId: string }) {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: attendance,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.events.attendance(eventId),
    queryFn: () => dataSource.fetchAttendance({ eventId }),
    // 4xx är klient-fel → meningslöst att retrya (speglar EventDetail/fetchPerson).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning). [] är ett
  // giltigt laddat tillstånd (tomt event) → fokus flyttas ändå.
  useEffect(() => {
    if (attendance && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Närvaro — Miranon Media Admin';
    }
  }, [attendance]);

  const backLink = (
    <Link to="/event/$eventId" params={{ eventId }} className="text-small underline">
      ← Tillbaka till eventet
    </Link>
  );

  if (isPending) {
    return (
      <section className="flex flex-col gap-4 p-4" aria-busy="true">
        {backLink}
        <p role="status" aria-live="polite">
          Laddar närvaro…
        </p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4 p-4">
        {backLink}
        <MessageBox intent="error" title="Kunde inte hämta närvaron">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </section>
    );
  }

  // Gruppera per session i fast ordning; bara sessioner med rader renderas.
  const groups = SESSION_ORDER.map((session) => ({
    session,
    rows: attendance.filter((row) => row.session === session),
  })).filter((g) => g.rows.length > 0);

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att närvaron anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Närvaro laddad.
      </p>

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Närvaro
        </h1>
      </header>

      {groups.length === 0 ? (
        <p className="text-small text-text-muted">
          Inga deltaganden registrerade för det här eventet än.
        </p>
      ) : (
        groups.map((g) => <SessionGroup key={g.session} session={g.session} rows={g.rows} />)
      )}
    </section>
  );
}
