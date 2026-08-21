import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';
import { displayName, inskickadDatum, inskickadTid } from './registration-display';
import { StatusBadge } from './StatusBadge';

/**
 * Samlade anmälningslistan (task-1.4) — GLOBAL LÄS-vy över ALLA anmälningar
 * under Mer (/mer/anmalningar), FK-listmönstret: ETT KORT PER RAD (tonala
 * ytor, A-skelettets formspråk), de senaste först, namn + event + datum per
 * rad (PRD beslut 6). Rad med event-koppling är LÄNK till det eventets
 * anmälda-vy — samma väg som på Hem; rad utan visas OLÄNKAD med "Utan event"
 * (beslut 4). Hems CTA pekar hit (beslut 7).
 *
 * EVENTLÄNKENS VAKT — markören (task-284.1; ADR-122 beslut 3+7, § 22
 * Åtgärdskön): en rad vars `eventmatchning === 'Avviker'` (formelfältet
 * `Anmälningar.Eventmatchning` — anmälans egen formulärtext stämmer INTE med
 * det länkade eventets facit) får en `StatusBadge` (ikon+ord, AC 8: bär
 * ALDRIG betydelse enbart genom färg — WCAG 1.4.1). Kön (`Bevakningsrad` på
 * Hem) och resolutionen (`relink-registration`) är UTBRUTNA till 284.2–284.4;
 * denna vy bär bara markören, den tredje av åtgärdsköns tre delar.
 *
 * Data via `fetchRegistrations()` utan filter = get-registrations EVENT-LÖSA
 * gren (router-context-DI, ADR-055) — read-only, ingen ny EF, ingen
 * allowlist-ändring. Query-nyckeln är `registrations.all` (global lista) —
 * MEDVETET inte dashboard-grenen: 60s-pollingen är scopad till Hem
 * (ADR-017; dashboard-nycklarnas kommentar i keys.ts), listvyn hämtar per
 * besök med global staleTime. Klient-sort på Inskickad fallande (EF:ns
 * globala gren garanterar ingen ordning — samma sort som Hem-kortet).
 * Sök/filter är utanför omfattningen (enkel lista i denna version).
 *
 * A11y (11/10, speglar Waitlist-mönstret EXAKT):
 * - `<h1>` = "Anmälningar"; fokus flyttas dit när data anlänt (vyn NÅS via
 *   navigation, till skillnad från landningsytan Hem; [] är giltigt laddat).
 * - Data-anländning annonseras i `aria-live="polite"`; `document.title` sätts.
 * - Loading: `aria-busy` + synlig status. Fel: `role="alert"` via MessageBox.
 * - "Tillbaka till Mer"-länk (→ `/mer`, varifrån vyn nås).
 * - `<ul>` bär `aria-label` så listan är ett namngivet landmärke för
 *   skärmläsare och testbar via list-rollen.
 * - Rad-korten får synlig gräns under `prefers-contrast: more` + utskrift
 *   (border-transparent-mönstret); `break-inside-avoid` per rad (print-golv).
 */
export function AnmalningarList() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const {
    data: registrations,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.registrations.all,
    queryFn: () => dataSource.fetchRegistrations(),
    // 4xx är klient-fel → meningslöst att retrya (speglar Waitlist/Hem).
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const senasteForst = useMemo(() => {
    if (!registrations) return [];
    return [...registrations].sort((a, b) => inskickadTid(b) - inskickadTid(a));
  }, [registrations]);

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning).
  useEffect(() => {
    if (registrations && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Anmälningar';
    }
  }, [registrations]);

  const backLink = (
    <Link to="/mer" className="text-small underline">
      ← Tillbaka till Mer
    </Link>
  );

  if (isPending) {
    // Lugnt laddläge (Laddtrappan steg 1, DESIGN-SYSTEM-SPEC §15): skeleton i
    // listans SLUTGEOMETRI (rubrik + tre kortplatshållare i radens EGEN
    // kortYta-geometri, Roselli-anatomin) i stället för en naken
    // "Laddar…"-textrad — layout-skift ≈ 0 mot laddat läge.
    return (
      <section className="flex flex-col gap-4 p-4">
        {backLink}
        <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Laddar anmälningarna…</span>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-32 text-2xl" />
            <Skeleton variant="text" className="w-24 text-small" />
          </div>
          <div className="flex flex-col gap-2">
            {['a', 'b', 'c'].map((k) => (
              <div
                key={k}
                className="flex flex-col gap-0.5 rounded-2xl border border-transparent bg-bg-muted p-4"
              >
                <Skeleton variant="text" className="w-2/5" />
                <Skeleton variant="text" className="w-3/5 text-small" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4 p-4">
        {backLink}
        <MessageBox intent="error" title="Kunde inte hämta anmälningarna">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att listan anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Anmälningarna laddade.
      </p>

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Anmälningar
        </h1>
        {/* Antal som TEXT — översikt, aldrig enbart färg. */}
        <p className="text-small text-text-muted">
          {`${senasteForst.length} ${senasteForst.length === 1 ? 'anmälan' : 'anmälningar'}`}
        </p>
      </header>

      {senasteForst.length === 0 ? (
        <p className="text-small text-text-muted">Inga anmälningar än.</p>
      ) : (
        <ul aria-label="Anmälningar" className="flex flex-col gap-2">
          {senasteForst.map((reg) => {
            const datum = inskickadDatum(reg);
            const kortYta =
              'flex break-inside-avoid flex-col gap-0.5 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong';
            return (
              <li key={reg.id}>
                {reg.eventId ? (
                  <Link
                    to="/event/$eventId/anmalda"
                    params={{ eventId: reg.eventId }}
                    className={`group ${kortYta}`}
                  >
                    <span className="font-medium group-hover:underline">{displayName(reg)}</span>
                    <span className="text-small text-text-muted">
                      {[reg.eventNamn, datum].filter(Boolean).join(' · ') || 'Uppgift saknas'}
                    </span>
                    {reg.eventmatchning === 'Avviker' && (
                      <span className="mt-0.5 self-start">
                        <StatusBadge ton="warning" storlek="sm">
                          Avviker från eventet
                        </StatusBadge>
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className={kortYta}>
                    <span className="font-medium">{displayName(reg)}</span>
                    <span className="text-small text-text-muted">
                      {['Utan event', datum].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
