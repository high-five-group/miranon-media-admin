import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';
import { KopplaTillEventDialog } from './KopplaTillEventDialog';
import {
  atgardskoText,
  behoverAtgard,
  displayName,
  inskickadDatum,
  inskickadTid,
} from './registration-display';
import { StatusBadge } from './StatusBadge';

/**
 * Samlade anmälningslistan (task-1.4) — GLOBAL LÄS-vy över ALLA anmälningar
 * under Mer (/mer/anmalningar), FK-listmönstret: ETT KORT PER RAD (tonala
 * ytor, A-skelettets formspråk), de senaste först, namn + event + datum per
 * rad (PRD beslut 6). Rad med event-koppling är LÄNK till det eventets
 * anmälda-vy — samma väg som på Hem; rad utan visas OLÄNKAD med "Utan event"
 * (beslut 4). Hems CTA pekar hit (beslut 7).
 *
 * EVENTLÄNKENS VAKT — markören OCH resolutionen (task-284.1/284.3; ADR-122
 * beslut 3+7, § 22 Åtgärdskön): en rad vars `eventmatchning === 'Avviker'`
 * (formelfältet `Anmälningar.Eventmatchning` — anmälans egen formulärtext
 * stämmer INTE med det länkade eventets facit) får en `StatusBadge`
 * (ikon+ord, AC 8: bär ALDRIG betydelse enbart genom färg — WCAG 1.4.1).
 * BÅDE 'Avviker'- och 'Utan event'-rader får en `KopplaTillEventDialog`-
 * knapp (task-284.3, AC 4–6): eventväljaren visar anmälans egna uppgifter
 * intill valet, och en genomförd koppling sätter `Eventmatchning` till 'OK'
 * (formelfält, räknas om synkront) — markören/länken/köns filtrering
 * uppdateras vid nästa refetch (mutationens `onSettled`), utan någon
 * separat klientberäkning. Knappen ligger UTANFÖR `<Link>`-kortet (aldrig
 * nästlad interaktivitet i en anchor — axe `nested-interactive`) — det är
 * kortets EGET syskon i `<li>`. Radens `behoverKoppling` läser SAMMA delade
 * predikat som köns filtrering/räknare (`behoverAtgard`, se ÅTGÄRDSKÖNS
 * INGÅNG nedan) — ALDRIG en egen tolkning av "behöver hanteras"
 * (TASK-284.4 AC #3s krav). Kön på Hem (`Bevakningsrad`, TASK-284.4) är
 * landad; denna vy bär markören och resolutionen, de två sista av
 * åtgärdsköns tre delar.
 *
 * Data via `fetchRegistrations()` utan filter = get-registrations EVENT-LÖSA
 * gren (router-context-DI, ADR-055) — read-only, ingen ny EF, ingen
 * allowlist-ändring. Query-nyckeln är `registrations.all` (global lista) —
 * MEDVETET inte dashboard-grenen: 60s-pollingen är scopad till Hem
 * (ADR-017; dashboard-nycklarnas kommentar i keys.ts), listvyn hämtar per
 * besök med global staleTime. Klient-sort på Inskickad fallande (EF:ns
 * globala gren garanterar ingen ordning — samma sort som Hem-kortet).
 *
 * ÅTGÄRDSKÖNS INGÅNG (`visaAtgardskon`, TASK-284.4 AC #4) — HELA listan
 * hämtas ALLTID (samma query, samma `senasteForst`-bas); filtreringen är ett
 * RENDRINGS-STEG ovanpå den, aldrig ett eget nätverksanrop. Prop:en sätts av
 * routen (`anmalningar.tsx`) ur `?visa=atgardskon`, som Hem-vyns
 * åtgärdskö-bevakningsrad navigerar till (`Bevakningsrad.tsx`
 * `AtgardskoRadLink`). Predikatet är `behoverAtgard` (`registration-
 * display.ts`) — SAMMA delade funktion Hem-vyns räknare använder
 * (`hem-derivations.ts` `atgardskoRad`), så de två ytorna aldrig kan
 * divergera om vad "behöver hanteras" betyder (AC #3s krav, upprepat här
 * för denna sidan). Klientsidig filtrering av en redan hämtad lista är INTE
 * "en klientberäkning av räknaren" i AC #3s förbjudna mening — den
 * omtolkar inte fältet, den väljer bara VILKA redan-korrekt-flaggade rader
 * som visas.
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
export function AnmalningarList({
  visaAtgardskon = false,
}: {
  /** [TASK-284.4 AC #4] `true` ⇒ listan visar ENDAST rader som `behoverAtgard`
      flaggar (`eventmatchning` `'Avviker'`/`'Utan event'`) — åtgärdsköns
      förfiltrerade läge. `false` (default) = obefintlig ändring mot
      task-1.4-formen. */
  visaAtgardskon?: boolean;
} = {}) {
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
    const bas = visaAtgardskon ? registrations.filter(behoverAtgard) : registrations;
    return [...bas].sort((a, b) => inskickadTid(b) - inskickadTid(a));
  }, [registrations, visaAtgardskon]);

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
        {/* Antal som TEXT — översikt, aldrig enbart färg. [TASK-284.4 AC #4]
            Filtrerat läge bär EGEN copy (räknad ur `senasteForst`, som redan
            är den behoverAtgard-filtrerade listan när visaAtgardskon). */}
        <p className="text-small text-text-muted">
          {visaAtgardskon
            ? atgardskoText(senasteForst.length)
            : `${senasteForst.length} ${senasteForst.length === 1 ? 'anmälan' : 'anmälningar'}`}
        </p>
        {/* [TASK-284.4] Väg TILLBAKA ur filtret — utan denna är
            åtgärdskö-ingången en återvändsgränd för allt utom just de
            flaggade raderna. `search={{ visa: undefined }}` (inte ett
            `to`-anrop utan `search`) för att uttryckligen NOLLSTÄLLA
            parametern, aldrig implicit bevara den. */}
        {visaAtgardskon && (
          <Link
            to="/mer/anmalningar"
            search={{ visa: undefined }}
            className="self-start text-small underline"
          >
            Visa alla anmälningar
          </Link>
        )}
      </header>

      {senasteForst.length === 0 ? (
        <p className="text-small text-text-muted">
          {visaAtgardskon ? 'Inga anmälningar behöver kopplas om.' : 'Inga anmälningar än.'}
        </p>
      ) : (
        <ul aria-label="Anmälningar" className="flex flex-col gap-2">
          {senasteForst.map((reg) => {
            const datum = inskickadDatum(reg);
            const kortYta =
              'flex break-inside-avoid flex-col gap-0.5 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong';
            // Eventlänkens vakt (task-284.1/284.3/284.4): SAMMA delade
            // predikat som köns filtrering/räknare (`behoverAtgard`,
            // `registration-display.ts`, TASK-284.4 AC #3) — ALDRIG en egen
            // tolkning av "behöver hanteras" här.
            const behoverKoppling = behoverAtgard(reg);
            return (
              <li key={reg.id} className="flex flex-col items-start gap-1.5">
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
                {/* Resolutionen (task-284.3, AC 4–6): UTANFÖR <Link>-kortet —
                    aldrig en knapp nästlad i en anchor (axe nested-interactive). */}
                {behoverKoppling && <KopplaTillEventDialog registration={reg} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
