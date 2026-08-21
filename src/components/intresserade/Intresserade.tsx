import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Intresserad } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * Visningsnamn ur namnfälten — aldrig record-ID, aldrig tomt (Gunilla-princip).
 * Speglar PersonDetail:s fallback EXAKT: namn → fornamn+efternamn → e-post-
 * särskiljd etikett → generisk. Namnlösa leads är LEGITIM data (data-model
 * Fälla 22) — en lead kan ha hämtat något utan att ha fyllt i namn.
 */
function displayName(person: Intresserad): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  if (composed) return composed;
  // Namnlös lead → e-post särskiljer (unika rad-etiketter för skärmläsare);
  // utan e-post faller vi tillbaka på den generiska etiketten.
  return person.email ? `Namnlös person - ${person.email}` : 'Namnlös person';
}

/**
 * "Vad de nappat på" — `allaHamtningar` är FLER-VÄRT (rollup över Touchpoints,
 * string[]) → läsbar kommaseparerad lista. Tom array → null (Field renderar inte
 * tomt). ALDRIG [object Object], ALDRIG krasch.
 */
function nappatPa(person: Intresserad): string | null {
  return person.allaHamtningar.length > 0 ? person.allaHamtningar.join(', ') : null;
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

/** En intresserad: namn som rubrik + fält/värde-lista. `break-inside-avoid` håller
 * raden samlad över sidbrytning vid utskrift (§4 print-golv — minst läsbar utskrift). */
function IntresseradRow({ person }: { person: Intresserad }) {
  return (
    <li className="flex break-inside-avoid flex-col gap-1 border-text-muted/20 border-b pb-3">
      <span className="font-medium">{displayName(person)}</span>
      <dl className="flex flex-col gap-0.5 text-small">
        <Field term="Nappat på" value={nappatPa(person)} />
        <Field term="Antal hämtningar" value={String(person.antalHamtningar)} />
        <Field term="Senaste interaktion" value={person.senasteInteraktion} />
      </dl>
    </li>
  );
}

/**
 * Intresserade-vy (Fas 6e L1 Landning 3) — GLOBAL LÄS-vy över leads. Data via
 * `fetchIntresserade()` → get-leads-EF (router-context-DI, ADR-055), som
 * serverside-filtrerar den STRIKTA lead-formeln (`AND({Totalt antal
 * hämtningar (erbjudande)} > 0, {Antal anmälningar (totalt)} = 0)` — Läsning
 * 2; fältet TASK-277 AC #6 pekade om från `{Antal hämtningar}`, fälla 47)
 * och sorterar 'Senaste interaktion (datum)' desc → INGEN klient-sortering
 * här. Global lista (inga params).
 *
 * LÄSER bara: ingen write-affordans (mailutskick m.m. = L2/L3, egna slices).
 * Speglar Waitlist/EventRegistrations 11/10-a11y-mönster EXAKT (väg A: status/fält
 * som ren text, ingen status-primitiv byggs).
 *
 * Tom lista (0 intresserade) → vänlig tom-text, ej fel. 4xx → role=alert, ingen
 * retry (klient-fel). Print: semantisk block-layout + `break-inside-avoid` per rad.
 *
 * A11y (11/10, speglar Waitlist):
 * - `<h1>` = "Intresserade"; fokus flyttas dit när data anlänt ([] är giltigt laddat).
 * - Data-anländning annonseras i `aria-live="polite"`.
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel: `role="alert"` via MessageBox (ingen dubbel-announcer — L138).
 * - `document.title` sätts när laddat.
 * - "Tillbaka till Mer"-länk (→ `/mer`, varifrån vyn nås), närvarande i alla tillstånd.
 */
export function Intresserade() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: intresserade,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.intresserade.all,
    queryFn: () => dataSource.fetchIntresserade(),
    // 4xx är klient-fel → meningslöst att retrya (speglar Waitlist).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning). [] är ett
  // giltigt laddat tillstånd (inga intresserade) → fokus flyttas ändå.
  useEffect(() => {
    if (intresserade && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Intresserade';
    }
  }, [intresserade]);

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
          <span className="sr-only">Laddar intresserade…</span>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-40 text-2xl" />
            <Skeleton variant="text" className="w-32 text-small" />
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
        <MessageBox intent="error" title="Kunde inte hämta intresserade">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att listan anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Intresserade laddade.
      </p>

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Intresserade
        </h1>
        {/* Antal som TEXT — översikt, aldrig enbart färg. */}
        <p className="text-small text-text-muted">{`${intresserade.length} intresserade`}</p>
      </header>

      {intresserade.length === 0 ? (
        <p className="text-small text-text-muted">Inga intresserade än.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {intresserade.map((person) => (
            <IntresseradRow key={person.id} person={person} />
          ))}
        </ul>
      )}
    </section>
  );
}
