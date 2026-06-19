import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { PersonDetail as PersonDetailType, PersonHistoryEntry } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/**
 * Sammansatt visningsnamn. Namnlös person (lead utan ifyllt namn) → tydlig
 * fallback, ALDRIG krasch eller "Okänd-som-korrupt" (data-model.md: namnlösa
 * Personer är legitima leads, inte trasig data).
 */
function displayName(person: PersonDetailType): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  if (composed) return composed;
  // Namnlös lead → e-post särskiljer (unika h1/flik-titlar för skärmläsare);
  // utan e-post faller vi tillbaka på den generiska etiketten.
  return person.email ? `Namnlös person — ${person.email}` : 'Namnlös person';
}

/** En rad i fält/värde-listan; hoppar tomma värden (renderar inte null). */
function DescRow({ term, children }: { term: string; children: React.ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="text-small text-text-muted sm:min-w-48">{term}</dt>
      <dd className="text-small">{children}</dd>
    </div>
  );
}

/** En kurshistorik-post som tillgänglig list-item. */
function HistoryItem({ entry }: { entry: PersonHistoryEntry }) {
  const title = entry.eventLabel ?? entry.kursnamn ?? 'Okänt event';
  const meta = [
    entry.datum,
    entry.session,
    entry.ort,
    entry.status,
    entry.narvaro ? 'Närvarande' : 'Ej närvaro',
  ].filter(Boolean);
  return (
    <li className="flex flex-col gap-0.5 border-b pb-2">
      <span className="font-medium">{title}</span>
      <span className="text-small text-text-muted">{meta.join(' · ')}</span>
    </li>
  );
}

/**
 * Persondetalj (Fas 6a L5a) — aggregerande full-historik-vy.
 *
 * Realiserar byggplan §6a:s kravbild: full kurshistorik (event-för-event ur
 * Deltaganden), kontakt, engagemangs-summa, leads/engagemang, flaggor och
 * anteckningar (READ-ONLY i L5; strukturerad för L6:s edit-affordans). Data via
 * `fetchPerson` → get-person-EF (router-context-DI, ADR-055). Klient-a11y för
 * cursor-listan dupliceras inte här — denna vy täcker detalj-renderingen.
 *
 * A11y (11/10):
 * - `<h1>` = displayName; fokus flyttas dit när data anlänt (async-navigering
 *   ska inte lämna fokus kvar på en försvunnen knapp).
 * - Data-anländning annonseras i en `aria-live="polite"`-region (utöver den
 *   globala route-announcern som annonserar sidtiteln).
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel OCH 404-ej-funnen: `role="alert"` via MessageBox (assertiv; ingen
 *   separat announcer staplas — MessageBox `error` ÄR redan role=alert).
 * - `document.title` sätts till personnamnet när det laddats.
 * - "Tillbaka till listan"-länk alltid närvarande.
 */
export function PersonDetail({ personId }: { personId: string }) {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);
  const historyHeadingId = useId();

  const {
    data: person,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.persons.detail(personId),
    queryFn: () => dataSource.fetchPerson(personId),
    // 4xx (inkl. 404 ej-funnen) är klient-fel → meningslöst att retrya
    // (speglar fetchWithRetry/data utils-policyn); 5xx/nätverk retryas.
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const notFound = error instanceof EdgeFunctionError && error.status === 404;

  // Fokus → <h1> + document.title när data anlänt (en gång per laddning).
  useEffect(() => {
    if (person && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = `${displayName(person)} — Miranon Media Admin`;
    }
  }, [person]);

  const backLink = (
    <Link to="/personer" className="text-small underline">
      ← Tillbaka till listan
    </Link>
  );

  if (isPending) {
    return (
      <section className="flex flex-col gap-4 p-4" aria-busy="true">
        {backLink}
        <p role="status" aria-live="polite">
          Laddar persondetaljer…
        </p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4 p-4">
        {backLink}
        {notFound ? (
          <MessageBox intent="error" title="Personen hittades inte">
            Ingen person med det ID:t finns. Den kan ha tagits bort, eller så är länken felaktig.
          </MessageBox>
        ) : (
          <MessageBox intent="error" title="Kunde inte hämta persondetaljer">
            {error instanceof Error ? error.message : 'Okänt fel.'}
          </MessageBox>
        )}
      </section>
    );
  }

  const contact = [person.email, person.telefon].filter(Boolean);
  const flaggor = [
    person.aiFlagga ? `AI-flagga: ${person.aiFlagga}` : null,
    person.manuellFlagga ? `Manuell flagga: ${person.manuellFlagga}` : null,
    person.ejGodkandMail ? 'Ej godkänd för mailutskick' : null,
    person.inbjudenCommunity ? 'Inbjuden till community' : null,
    person.skapatKontoCommunity ? 'Konto i community' : null,
  ].filter(Boolean);

  return (
    <section className="flex flex-col gap-6 p-4">
      {backLink}

      {/* aria-live: bekräftar för skärmläsare att detaljerna anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Persondetaljer för ${displayName(person)} laddade.`}
      </p>

      <header className="flex flex-col gap-1">
        {/* tabIndex=-1 → programmatiskt fokuserbar utan att hamna i tab-ordningen. */}
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          {displayName(person)}
        </h1>
        {person.erfarenhetsbadge && (
          <p className="text-small text-text-muted">{person.erfarenhetsbadge}</p>
        )}
      </header>

      <section aria-labelledby="sektion-kontakt" className="flex flex-col gap-2">
        <h2 id="sektion-kontakt" className="font-semibold text-lg">
          Kontakt
        </h2>
        {/* <dl> renderas ENBART när minst en rad finns — ett tomt <dl>, eller en
            empty-state-<p> som direkt dl-barn, bryter definition-list-strukturen
            (axe `only-dlitems`). Empty-state blir syskon utanför <dl>. */}
        {contact.length > 0 || person.ort.length > 0 ? (
          <dl className="flex flex-col gap-1">
            <DescRow term="E-post">{person.email}</DescRow>
            <DescRow term="Telefon">{person.telefon}</DescRow>
            {/* ort är string[] (fler-värt) → alla orter visas, ingen tappas. */}
            <DescRow term="Ort">{person.ort.length > 0 ? person.ort.join(' · ') : null}</DescRow>
          </dl>
        ) : (
          <p className="text-small text-text-muted">Inga kontaktuppgifter registrerade.</p>
        )}
      </section>

      <section aria-labelledby="sektion-engagemang" className="flex flex-col gap-2">
        <h2 id="sektion-engagemang" className="font-semibold text-lg">
          Engagemang
        </h2>
        <dl className="flex flex-col gap-1">
          <DescRow term="Erfarenhetsnivå">{person.erfarenhetsniva}</DescRow>
          <DescRow term="Återkommande?">{person.aterkommande}</DescRow>
          <DescRow term="Antal anmälningar (totalt)">{person.antalAnmalningar}</DescRow>
          <DescRow term="Genomförda event">{person.antalGenomfordaEvent}</DescRow>
          <DescRow term="Totala deltaganden">{person.antalDeltaganden}</DescRow>
          <DescRow term="Aktiv anmälan">{person.harAktivAnmalan}</DescRow>
          <DescRow term="Nästa event">{person.nastaEvent}</DescRow>
          <DescRow term="Senaste deltagande">{person.senasteDeltagandeDatum}</DescRow>
          <DescRow term="Senaste interaktion">{person.senasteInteraktion}</DescRow>
        </dl>
      </section>

      <section aria-labelledby={historyHeadingId} className="flex flex-col gap-2">
        <h2 id={historyHeadingId} className="font-semibold text-lg">
          Kurshistorik
        </h2>
        {person.historik.length > 0 ? (
          <ul aria-label="Kurshistorik, senaste först" className="flex flex-col gap-2">
            {person.historik.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </ul>
        ) : (
          <p className="text-small text-text-muted">Ingen registrerad kurshistorik.</p>
        )}
      </section>

      <section aria-labelledby="sektion-leads" className="flex flex-col gap-2">
        <h2 id="sektion-leads" className="font-semibold text-lg">
          Leads &amp; erbjudanden
        </h2>
        <dl className="flex flex-col gap-1">
          <DescRow term="Antal hämtningar">{person.antalHamtningar}</DescRow>
          {/* allaHamtningar är string[] (fler-värt) → alla värden visas. */}
          <DescRow term="Hämtade erbjudanden">
            {person.allaHamtningar.length > 0 ? person.allaHamtningar.join(' · ') : null}
          </DescRow>
          <DescRow term="Motivering">{person.motivering}</DescRow>
        </dl>
        {/* empty-state som syskon UTANFÖR <dl> (a11y: dl får bara dt/dd/div).
            dl:n är aldrig tom — "Antal hämtningar" (number) renderar alltid. */}
        {person.antalHamtningar === 0 &&
          person.allaHamtningar.length === 0 &&
          !person.motivering && (
            <p className="text-small text-text-muted">Inga lead-magnet-hämtningar registrerade.</p>
          )}
      </section>

      <section aria-labelledby="sektion-flaggor" className="flex flex-col gap-2">
        <h2 id="sektion-flaggor" className="font-semibold text-lg">
          Flaggor
        </h2>
        {flaggor.length > 0 ? (
          <ul aria-label="Flaggor" className="flex flex-col gap-1">
            {flaggor.map((flagga) => (
              <li key={flagga} className="text-small">
                {flagga}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-text-muted">Inga flaggor satta.</p>
        )}
      </section>

      <section aria-labelledby="sektion-anteckningar" className="flex flex-col gap-2">
        <h2 id="sektion-anteckningar" className="font-semibold text-lg">
          Anteckningar
        </h2>
        {/* READ-ONLY i L5a — L6 lägger till edit (write `Personer.Anteckningar`).
            Strukturerad som egen sektion så edit-affordansen kan adderas in-place. */}
        {person.anteckningar ? (
          <p className="whitespace-pre-wrap text-small">{person.anteckningar}</p>
        ) : (
          <p className="text-small text-text-muted">Inga anteckningar.</p>
        )}
      </section>
    </section>
  );
}
