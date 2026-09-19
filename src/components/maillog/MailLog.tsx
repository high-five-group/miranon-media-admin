import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { MailLogEntry } from '@/domain/models/MailPayload';
import { queryKeys } from '@/queries/keys';
import { husetsRetryPolicy } from '@/queries/retry-policy';

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
    <li className="flex break-inside-avoid flex-col gap-1 border-text-muted/20 border-b pb-3 contrast-more:border-border-strong">
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
 * Fält-platshållarens ANATOMI matchar `Field`s egen responsiva wrapper
 * (TASK-416.17 runda 2 — review-fynd PR #2408): `Field` staplar `dt` ovanpå
 * `dd` under `sm:` (`flex-col`, två line-boxar) och lägger dem sida vid sida
 * däröver (`sm:flex-row`, EN line-box). En platshållare med en enda Skeleton-
 * rad per fält matchade bara desktop-formen — mobilviewporten (375×812,
 * samma bredd som `tests/visual/maillogg-visual.spec.ts`s etablerade
 * `visual-mobile`-projekt) var OMÄTT och föll: den riktiga raden blir
 * DUBBELT så hög per fält under 640 px. Denna platshållare bär SAMMA
 * `flex flex-col gap-0.5 sm:flex-row sm:gap-2`-klasser som `Field` och TVÅ
 * Skeleton-block (dt-/dd-motsvarighet) — stackar identiskt på mobil, radar
 * identiskt på desktop.
 */
function FieldSkeleton({ ddWidth }: { ddWidth: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <Skeleton variant="text" className="w-20 sm:min-w-32" />
      <Skeleton variant="text" className={ddWidth} />
    </div>
  );
}

/**
 * Skeletonradens anatomi är IDENTISK med `MailLogRow` (TASK-416.17 —
 * review-fynd på PR #2397, S123): samma yttre klasser (`border-b`/`pb-3`/
 * `gap-1`/`break-inside-avoid`), namnraden som ETT textblock (ingen
 * text-storleks-klass — ärver samma ambienta storlek som den riktiga
 * `<span className="font-medium">`), och EXAKT fyra `FieldSkeleton`-rader
 * för fältlistan (`Field`-radernas MAX-antal — send-email/index.ts sätter
 * `filterSnapshot` OVILLKORAT (`segmentIds: …`) för varje utskick, så alla
 * fyra fält är i praktiken TYPRADEN framåt, inte bara ett defensivt
 * över-antagande — review-fynd PR #2408). Fältraderna ärver `text-small`
 * från samma wrapper-klass som den riktiga `<dl>` bär, i stället för att
 * upprepa storleken på varje `Skeleton` (samma `1lh`-mekanik som
 * `Skeleton.tsx`s filhuvud dokumenterar).
 *
 * Innan denna skiva var raden ETT generiskt `listRow`-block (`h-[3lh]`) —
 * 108 px för lågt vid tre rader jämfört med den riktiga anatomin (namn +
 * upp till fyra fältrader). Mätt (boundingBox, `toEqual`, ±0 px, desktop OCH
 * mobil): `mer-maillogg-laddlage.acceptance.test.ts`.
 */
function MailLogSkeletonRow() {
  return (
    <div
      data-testid="maillog-skeleton-rad"
      className="flex break-inside-avoid flex-col gap-1 border-text-muted/20 border-b pb-3 contrast-more:border-border-strong"
    >
      <Skeleton variant="text" className="w-2/5" />
      <div className="flex flex-col gap-0.5 text-small">
        <FieldSkeleton ddWidth="w-3/5" />
        <FieldSkeleton ddWidth="w-1/3" />
        <FieldSkeleton ddWidth="w-1/4" />
        <FieldSkeleton ddWidth="w-1/2" />
      </div>
    </div>
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
 *
 * SIDKROM (TASK-299.9, PRD `TASK-299` § OMFATTNINGEN LÅST): husets delade
 * `SidRam`-primitiv (kant-i-kant-dialekten) ersätter den äldre textlänken
 * ("← Tillbaka till Mer", `text-small underline`) som satt i en `p-4`-sektion
 * med DUBBLERAD sidmarginal (main:s egen `px-4 py-4` plus sektionens egen
 * `p-4`). Ingen egen sidopadding kvar på sektionen — `<header>` tar `px-4`
 * för att matcha chevronens `mx-4`-indrag (SidRam-docstringen: kortytan/
 * innehållsytan som följer stannar kant i kant mot `<main>`s egen padding,
 * ingen extra inramning läggs på). Listan/tom-texten/felrutan har därför
 * INGEN egen horisontell padding — de sitter flush mot main. Bara sidkromet
 * (chevron), aldrig rubrikblocket (PRD beslut, ägandeskapsaxeln avgjord till
 * den smalare omfattningen).
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
    retry: husetsRetryPolicy,
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

  const kromKnapp = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  if (isPending) {
    // Lugnt laddläge (Laddtrappan steg 1, DESIGN-SYSTEM-SPEC §15): skeleton i
    // listans SLUTGEOMETRI (rubrik + tre radplatshållare) i stället för en
    // naken "Laddar…"-textrad — layout-skift ≈ 0 mot laddat läge. Rubrik-
    // skelettets `px-4` matchar det riktiga `<header>`s indrag (nedan) så
    // övergången till laddat läge inte skiftar layouten sidledes. Rubrik-
    // och radplatshållarna är SYSKON direkt under sektionens egen gap-6 (samma
    // idiom som live-regionen i laddat läge nedan) — INTE buntade i ett eget
    // gap-4-block, som gav 16 px mellanrum där laddat läge har 24 (TASK-416.9).
    // Radplatshållarna bär MailLogRow:s EGEN anatomi (`MailLogSkeletonRow`,
    // TASK-416.17) — inte längre Skeleton-primitivens generiska `listRow`-
    // block, som mätte 108 px för lågt vid samma radantal (review-fynd PR
    // #2397). Rubrik-skelettet bär INGEN egen breddklass (Skeleton-primitivens
    // default `w-full`): en explicit bredd (t.ex. `w-28`) hade gett en SMALARE
    // box än det riktiga `<h1>`, som (block-element utan breddklass i en
    // `flex-col`-förälder) sträcker sig till hela tvärled-bredden — samma
    // `align-items: stretch`-mekanik som Skeleton-primitivens `w-full` redan
    // ger. `toEqual`-mätningen kräver bredd-identitet, inte bara höjd/position
    // (`mer-maillogg-laddlage.acceptance.test.ts`).
    return (
      <section className="flex flex-col gap-6">
        {kromKnapp}
        <p className="sr-only" role="status" aria-live="polite" aria-busy="true">
          Laddar maillogg…
        </p>
        <div data-testid="maillog-skeleton-titelblock" className="flex flex-col gap-1 px-4">
          <Skeleton variant="text" className="text-2xl" />
          <Skeleton variant="text" className="w-20 text-small" />
        </div>
        <div className="flex flex-col gap-3">
          <MailLogSkeletonRow />
          <MailLogSkeletonRow />
          <MailLogSkeletonRow />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        {kromKnapp}
        <MessageBox intent="error" title="Kunde inte hämta maillogg">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {kromKnapp}

      {/* aria-live: bekräftar för skärmläsare att loggen anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Maillogg laddad.
      </p>

      <header className="flex flex-col gap-1 px-4">
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
