import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useActivityLogHistory } from '@/data/queries/useActivityLog';
import {
  type ActivityStatement,
  EVENT_ID_EXTENSION_IRI,
  PERSON_ID_EXTENSION_IRI,
} from '@/domain/schemas';

/**
 * Aktivitetshistoriken — kärnvyn (TASK-201.6, A-formen). En HEL yta utan
 * filterrad (filterraden är TASK-201.8, additiv skiva; S105 Del 2 beslut 1
 * — "en hel mellanstation" om dag 1-klockan tar slut). Data via
 * `useActivityLogHistory()` (TASK-201.5, cursor-paginerad `useInfiniteQuery`,
 * `src/data/queries/useActivityLog.ts`) → `fetchActivityLog` (adaptern) →
 * `get-activity-log`-EF:en, samma åtkomstprecedens som `PersonsList`/`MailLog`.
 *
 * ORDLISTA (S105-grillningen): "Aktivitetslogg" är DATAN (Supabase
 * `activity_log`), "Aktivitetshistorik" är Lottas VY över den — hem-spaltens
 * högerspalt (K10-facit, TASK-201.7, OBYGGD) och DENNA fulla historikvy.
 * Undvik "logg" i UI-text.
 */

/** Klockslag "14:22" — raden i grupper ÄLDRE än idag (dagen är redan sagd av gruppens h2). */
const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

/** Långdatum "3 april 2026" — gruppetiketten för dagar äldre än igår (samma
 * options som EventsList.tsx:71:s LANGDATUM_IDAG, modul-privat där precis
 * som här — ingen delad export finns att återanvända). */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Lokal dagsstart (midnatt) — kalenderdags-diffens referenspunkt (speglar NyaAnmalningarCard.tsx). */
function dagsStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Dagsgruppens etikett: "Idag" / "Igår" / långdatum. Kalenderdags-diff, inte 24h-fönster
 * (DST-säkert via Math.round, speglar NyaAnmalningarCard.tsx:relativTid). */
export function dagsEtikett(iso: string, nuMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'Okänt datum';
  const dagar = Math.round((dagsStart(nuMs) - dagsStart(t)) / 86_400_000);
  if (dagar === 0) return 'Idag';
  if (dagar === 1) return 'Igår';
  return LANGDATUM.format(t);
}

/**
 * Gruppera den redan server-sorterade listan (occurred_at fallande,
 * `get-activity-log`-EF:ens kontrakt) per kalenderdag. Rubrikerna läggs
 * OVANPÅ ordningen — de sorterar aldrig om (speglar `manadsgrupp.ts`s
 * `groupByMonth` EXAKT, bara dagsgranulär i stället för månadsgranulär).
 */
export function grupperaPerDag(
  statements: ActivityStatement[],
  nuMs: number,
): { label: string; statements: ActivityStatement[] }[] {
  const groups: { label: string; statements: ActivityStatement[] }[] = [];
  for (const s of statements) {
    const label = dagsEtikett(s.timestamp, nuMs);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.statements.push(s);
    } else {
      groups.push({ label, statements: [s] });
    }
  }
  return groups;
}

/**
 * Radens tid — AC #1: "relativ tid respektive klockslag" (PRD användarberättelse
 * 5: "relativ tid nyss, klockslag/datum längre bak"). Inom "Idag"-gruppen:
 * relativ ("nyss" / "för N min sedan" / "för N tim sedan") — dagen är redan
 * sagd av grupphuvudet. I ÄLDRE grupper: klockslag ensamt (dagen står redan i
 * h2:n, ett andra datum vore brus).
 */
export function radensTid(iso: string, grupp: string, nuMs: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  if (grupp !== 'Idag') return KLOCKSLAG.format(t);
  const minuter = Math.floor((nuMs - t) / 60_000);
  if (minuter < 1) return 'nyss';
  if (minuter < 60) return `för ${minuter} min sedan`;
  return `för ${Math.floor(minuter / 60)} tim sedan`;
}

/** xAPI Language Map → sv-SE-strängen (vi emitterar alltid endast den, se
 * ActivityStatement.schema.ts:63), med en defensiv fallback till första
 * närvarande nyckel — Lotta ska aldrig möta en tom rad. */
function sprakText(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

/**
 * Navigeringsmålet — PRD användarberättelse 8: "klicka på en post och komma
 * till personen eller eventet det gällde". Object-IRI:t
 * (`objects/registrations/{id}`) bär i sig INGEN separat person-/
 * event-identitet att parsa fram (`activityTypes.ts`s `registrationObjectId`)
 * — en registrering saknar egen detaljsida (`/event/$eventId/anmalan/
 * $registrationId` kräver BÅDA parametrarna) — navigeringsmålet läses därför
 * ALLTID ur `context.extensions`, aldrig ur `object.id`.
 *
 * Denna funktion läser extensionen defensivt: finns den (skrivvägen,
 * `TASK-201.4`, landad) blir raden en riktig länk till EVENTET — precis som
 * `NyaAnmalningarCard`s etablerade "registrering → händelsens event"-
 * precedent. Saknas den renderas raden olänkad för den delen, ärligt — INGEN
 * gissning via namnmatchning mot en cachad personlista (Gunilla-fientligt vid
 * namnkollision).
 */
export function aktivitetensEventId(statement: ActivityStatement): string | null {
  const raw = statement.context.extensions[EVENT_ID_EXTENSION_IRI];
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null;
}

/**
 * Person-halvan av samma navigeringsmål (`TASK-201.12`, stänger det gap
 * denna funktions systerfunktion `aktivitetensEventId` ovan tidigare
 * dokumenterade som obyggt: "ingen mutation/statement-typ sätter någon
 * person-identifierande extension i dag"). EXAKT samma läsdisciplin —
 * defensiv, `.trim() !== ''`, aldrig en gissning.
 *
 * PRIORITETSORDNING i `AktivitetsRad` nedan: eventId FÖRE personId när båda
 * finns (t.ex. en betalningsrad för en registrering i ett event bär BÅDA
 * efter `TASK-201.12`) — bevarar `NyaAnmalningarCard`-precedentets
 * "registrering → händelsens event"-mål oförändrat för de statement-typer
 * som redan länkade dit. personId är alltså ett TILLÄGG som aktiverar
 * navigering för de statement-typer som ALDRIG hade ett eventId att länka
 * mot (person-flagga, person-anteckning skapa/uppdatera — objektet ÄR redan
 * personen) snarare än en omprioritering av redan fungerande rader.
 */
export function aktivitetensPersonId(statement: ActivityStatement): string | null {
  const raw = statement.context.extensions[PERSON_ID_EXTENSION_IRI];
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null;
}

/**
 * En aktivitetsrad — "spaltens postform" (`useActivityLog.ts`s filhuvud:
 * PRD § Vy-form "samma postkomponent bär spalt och vy"). Hem-spalten
 * (TASK-201.7, K10-facit-låst, OBYGGD) är en ANNAN, egen komponent —
 * extraheras hit vid FAKTISK andra konsument (över-engineering-vakten; jfr
 * `PersonMiniKort`s "konsolideras vid andra konsumenten"-precedent,
 * PersonsList.tsx). Formen (rad 1: aktör medium + händelse + · + objekt i
 * naturligt språk; rad 2: tid) är den delen TASK-201.7 sannolikt återvinner.
 *
 * MITTPUNKT (·), ALDRIG LÅNGT TANKSTRECK — Marcus-order 2026-08-12: grinden
 * `check-langa-streck` fäller "—"/"–" i användarsynlig text
 * (`.langa-streck-policy.json`). ORDLISTA.md:s illustrativa exempel ("Lotta
 * markerade betalning — …") är EJ facit för separatorn.
 */
function AktivitetsRad({
  statement,
  grupp,
  nuMs,
}: {
  statement: ActivityStatement;
  grupp: string;
  nuMs: number;
}) {
  const eventId = aktivitetensEventId(statement);
  // Läses bara när eventId saknas — se aktivitetensPersonId's
  // prioritetskommentar (eventId vinner när båda finns).
  const personId = eventId ? null : aktivitetensPersonId(statement);
  const tid = radensTid(statement.timestamp, grupp, nuMs);
  const handelse = sprakText(statement.verb.display);
  const objekt = sprakText(statement.object.definition.name);

  const innehall = (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="truncate text-body">
        <span className="font-medium">{statement.actor.name}</span> {handelse}
        {' · '}
        {objekt}
      </p>
      <p className="text-caption text-text-muted">{tid}</p>
    </div>
  );

  return (
    <li>
      {eventId ? (
        <Link
          to="/event/$eventId"
          params={{ eventId }}
          className="group flex items-center justify-between gap-3 px-2 py-3 hover:bg-bg-emphasized"
        >
          {innehall}
          <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
        </Link>
      ) : personId ? (
        <Link
          to="/personer/$personId"
          params={{ personId }}
          className="group flex items-center justify-between gap-3 px-2 py-3 hover:bg-bg-emphasized"
        >
          {innehall}
          <ChevronRight aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-2 py-3">{innehall}</div>
      )}
    </li>
  );
}

/** Lugnt laddläge (DESIGN-SYSTEM-SPEC §15 — "Laddar…"-textrader och spinners
 * används inte, app-brett). Skeleton-block i listans SLUTGEOMETRI (samma
 * `divide-y`-container som det laddade läget) så inget hoppar när data landar. */
function LaddLage() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <span className="sr-only">Laddar aktivitetshistorik…</span>
      <Skeleton variant="text" className="w-24 text-small" />
      <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1.5 py-3">
            <Skeleton variant="text" className="w-2/5 text-body" />
            <Skeleton variant="text" className="w-16 text-caption" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Aktivitetshistoriken (TASK-201.6) — GLOBAL, cursor-paginerad LÄS-vy.
 * Nås via Mer (mobil/platta, AC #2 — `/mer/`-index) och via länk/route på
 * desktop (hem-spaltens "Se all aktivitetshistorik", TASK-201.7, OBYGGD —
 * routen är redan reachable oavsett, `/mer/aktivitetshistorik`).
 *
 * A11y (11/10, speglar MailLog/PersonsList):
 * - `<h1>` = "Aktivitetshistorik"; fokus dit när data anlänt ([] är giltigt
 *   laddat → fokus ändå, AC #3).
 * - Dagsgrupper som RIKTIGA `<h2>`-rubriker (rubrikstruktur, AC #4) —
 *   speglar `EventsList.tsx`s månadsgruppering.
 * - Landmärket är skalets `<main>` (AppShell) — ingen egen inre landmark
 *   uppfinns ovanpå den (samma val som MailLog/PersonsList).
 * - Data-anländning + "Ladda fler"-tillskott annonseras i `aria-live="polite"`.
 * - Fel: `role="alert"` via MessageBox.
 * - "Tillbaka till Mer"-länk, närvarande i alla tillstånd.
 */
export function AktivitetsHistorik() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);

  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useActivityLogHistory();

  const statements = data?.pages.flatMap((page) => page.statements) ?? [];

  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const loadMoreTriggered = useRef(false);
  const prevCountRef = useRef(0);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (data && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Aktivitetshistorik';
    }
  }, [data]);

  // "Ladda fler"-round-tripens fokus-behållning + aria-live-antalsbesked
  // (speglar PersonsList.tsx EXAKT).
  useEffect(() => {
    if (isFetchingNextPage) return;
    if (!loadMoreTriggered.current) {
      prevCountRef.current = statements.length;
      return;
    }
    const added = statements.length - prevCountRef.current;
    prevCountRef.current = statements.length;
    loadMoreTriggered.current = false;
    if (added > 0) {
      setAnnouncement(
        `${added} fler ${added === 1 ? 'post' : 'poster'} laddade, ${statements.length} totalt.`,
      );
      if (loadMoreRef.current) loadMoreRef.current.focus();
      else statusRef.current?.focus();
    }
  }, [isFetchingNextPage, statements.length]);

  const backLink = (
    <Link to="/mer" className="text-small underline">
      ← Tillbaka till Mer
    </Link>
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" data-testid="aktivitetshistorik-yta">
        {backLink}
        <LaddLage />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4" data-testid="aktivitetshistorik-yta">
        {backLink}
        <MessageBox intent="error" title="Kunde inte hämta aktivitetshistoriken">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>
    );
  }

  const nuMs = Date.now();
  const grupper = grupperaPerDag(statements, nuMs);
  const total = statements.length;

  return (
    <div className="flex flex-col gap-6" data-testid="aktivitetshistorik-yta">
      {backLink}

      <p className="sr-only" role="status" aria-live="polite">
        Aktivitetshistorik laddad.
      </p>

      <header className="flex flex-col gap-1">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Aktivitetshistorik
        </h1>
      </header>

      {total === 0 ? (
        // AC #3 — TOMLÄGE FÖRSTA GÅNGEN: vänligt, på Lotta-språket (Gunilla-
        // principen). Systemet är nytt, inte trasigt (speglar MailLog/
        // PersonsList k11). Ett kolon ersätter det illustrativa långa
        // tankstrecket i den ursprungliga FEATURE-ACTIVITY-LOG.md-copyn —
        // samma check-langa-streck-skäl som radens "·"-separator ovan.
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-1 py-12 text-center"
        >
          <p className="font-medium text-body">Ingen aktivitet ännu</p>
          <p className="max-w-md text-small text-text-muted">
            Här kommer du snart se allt du gör i appen: betalningar, bekräftelser, mail och mer.
            Allt sparas automatiskt, så du aldrig behöver undra vad som hände.
          </p>
        </div>
      ) : (
        <>
          <p
            ref={statusRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="px-2 text-small text-text-muted"
          >
            {`Visar ${total} ${total === 1 ? 'post' : 'poster'}${hasNextPage ? ' (fler finns)' : ''}.`}
          </p>

          {/* Dold live-region ENDAST för "Ladda fler"-tillskottet — status-
              raden ovan bär redan den INLEDANDE aria-live-rollen. */}
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>

          <div className="flex flex-col gap-6">
            {grupper.map((grupp) => (
              <section key={grupp.label} className="flex flex-col gap-2">
                <h2 className="px-2 font-semibold text-small text-text-secondary">{grupp.label}</h2>
                <ul
                  aria-label={`Aktiviteter, ${grupp.label.toLowerCase()}`}
                  className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
                >
                  {grupp.statements.map((s) => (
                    <AktivitetsRad key={s.id} statement={s} grupp={grupp.label} nuMs={nuMs} />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <AriaButton
                ref={loadMoreRef}
                aria-busy={isFetchingNextPage}
                isDisabled={isFetchingNextPage}
                onPress={() => {
                  loadMoreTriggered.current = true;
                  fetchNextPage();
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized data-[disabled]:opacity-60 motion-safe:transition-colors"
              >
                Ladda fler
              </AriaButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
