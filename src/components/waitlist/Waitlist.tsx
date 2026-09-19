import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { MessageBox } from '@/components/primitives/MessageBox';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { WaitlistEntry } from '@/domain/models/WaitlistEntry';
import { queryKeys } from '@/queries/keys';
import { husetsRetryPolicy } from '@/queries/retry-policy';

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

/** En väntande: initialcirkel + namn som rubrikrad, fält/värde-lista under
 * (TASK-299.7 — primitiv-komponenten `InitialAvatar`, ingen inline-kopia).
 * `break-inside-avoid` håller raden samlad över sidbrytning vid utskrift
 * (§4 print-golv — minst läsbar utskrift). Fälten och deras inbördes ordning
 * är OFÖRÄNDRADE (Marcus beslut 2026-08-22, alternativ B) — `dl`:n är
 * byte-identisk mot före, bara indragen `pl-12` för att fluktlinjera under
 * namntexten (cirkelns `size-9` + radens `gap-3` = 48 px, samma tal). */
function WaitlistRow({ entry }: { entry: WaitlistEntry }) {
  const namn = displayName(entry);
  return (
    <li className="flex break-inside-avoid flex-col gap-2 border-text-muted/20 border-b pb-3 contrast-more:border-border-strong">
      <div className="flex items-center gap-3">
        <InitialAvatar namn={namn} />
        <span className="font-medium">{namn}</span>
      </div>
      <dl className="flex flex-col gap-0.5 pl-12 text-small">
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
 * Fält-platshållarens ANATOMI matchar `Field`s egen responsiva wrapper
 * (TASK-416.17 runda 2 — review-fynd PR #2408, samma fynd som `MailLog.tsx`
 * eftersom `Field` här är byggd identiskt): staplar `dt` ovanpå `dd` under
 * `sm:` (`flex-col`, två line-boxar) och lägger dem sida vid sida däröver
 * (`sm:flex-row`, EN line-box). En platshållare med en enda Skeleton-rad
 * per fält matchade bara desktop-formen — mobilviewporten (375×812) var
 * OMÄTT och föll: den riktiga raden blir DUBBELT så hög per fält under
 * 640 px. Denna platshållare bär SAMMA `flex flex-col gap-0.5 sm:flex-row
 * sm:gap-2`-klasser som `Field` och TVÅ Skeleton-block (dt-/dd-motsvarighet).
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
 * Skeletonradens anatomi är IDENTISK med `WaitlistRow` (TASK-416.17 —
 * review-fynd på PR #2397, S123): `InitialAvatar`-cirkeln som ett
 * `size-9 rounded-full`-block (FAST höjd — dominerar radens
 * `items-center`-höjd oavsett ambient textmetrik, precis som den riktiga
 * cirkeln gör), namnet som textblock bredvid (ingen text-storleks-klass —
 * ärver samma ambienta storlek som `<span className="font-medium">`), och
 * EXAKT fyra `pl-12`-indragna `FieldSkeleton`-rader för fältlistan (`Field`-
 * radernas antal i `WaitlistRow` — samtliga fyra visas alltid, ingen är
 * nullable). Fältraderna ärver `text-small` från samma wrapper-klass som
 * den riktiga `<dl>` bär.
 *
 * Innan denna skiva var raden ETT generiskt `listRow`-block (`h-[3lh]`) —
 * 225 px för lågt vid tre rader jämfört med den riktiga anatomin (avatar +
 * namn + fyra fältrader). Mätt (boundingBox, `toEqual`, ±0 px, desktop OCH
 * mobil): `mer-vantelista-laddlage.acceptance.test.ts`.
 */
function WaitlistSkeletonRow() {
  return (
    <div
      data-testid="vantelista-skeleton-rad"
      className="flex break-inside-avoid flex-col gap-2 border-text-muted/20 border-b pb-3 contrast-more:border-border-strong"
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="text" className="size-9 shrink-0 rounded-full" />
        <Skeleton variant="text" className="w-2/5" />
      </div>
      <div className="flex flex-col gap-0.5 pl-12 text-small">
        <FieldSkeleton ddWidth="w-1/3" />
        <FieldSkeleton ddWidth="w-1/2" />
        <FieldSkeleton ddWidth="w-1/3" />
        <FieldSkeleton ddWidth="w-2/5" />
      </div>
    </div>
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
 * SIDKROM (TASK-299.7, PRD `TASK-299` beslut 2–3+5, omfattning låst
 * 2026-08-22 — bara sidkromet, rubriken lever kvar i sidan): husets delade
 * `SidRam`-primitiv (kant-i-kant, `mx-4`-indragen chevron) ersätter den gamla
 * textlänken "← Tillbaka till Mer". Sidans egen `p-4` är riven — den
 * dubblerade sidmarginalen (`<main>`s `px-4 py-4` PLUS sidans egen `p-4`)
 * är därmed borta; text-bärande element (rubrikblock, radlista) tar sin egen
 * `px-4` för att fluktlinjera med chevronens indrag, medan self-contained
 * boxar (`MessageBox`) står odekorerat kant-i-kant, samma mönster som
 * `AktivitetsHistorik.tsx`/`DokumentYta.tsx`.
 *
 * A11y (11/10, speglar EventRegistrations):
 * - `<h1>` = "Väntelista"; fokus flyttas dit när data anlänt ([] är giltigt laddat).
 * - Data-anländning annonseras i `aria-live="polite"`.
 * - Loading: `aria-busy` + synlig + sr-only status.
 * - Fel: `role="alert"` via MessageBox (ingen dubbel-announcer).
 * - `document.title` sätts när laddat.
 * - Sidkromets chevron bär tillgängligt namn "Tillbaka till Mer" (→ `/mer`).
 * - Datum/status som läsbar text (skärmläsaren får hela bilden).
 * - Initialcirkeln är dekorativ (`aria-hidden`, `InitialAvatar`s eget
 *   kontrakt) — namnet bärs av den synliga textraden bredvid.
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
    retry: husetsRetryPolicy,
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

  const sidRam = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  if (isPending) {
    // Lugnt laddläge (Laddtrappan steg 1, DESIGN-SYSTEM-SPEC §15): skeleton i
    // listans SLUTGEOMETRI (rubrik + tre radplatshållare) i stället för en
    // naken "Laddar…"-textrad — layout-skift ≈ 0 mot laddat läge. Rubrik- och
    // radplatshållarna är SYSKON direkt under sektionens egen gap-6 (samma
    // idiom som live-regionen i laddat läge nedan) — INTE buntade i ett eget
    // gap-4-block, som gav 16 px mellanrum där laddat läge har 24 (TASK-416.9).
    // px-4 flyttas ned till varje block för att bevara samma horisontella
    // indrag som den tidigare gemensamma wrappern gav. Radplatshållarna bär
    // WaitlistRow:s EGEN anatomi (`WaitlistSkeletonRow`, TASK-416.17) — inte
    // längre Skeleton-primitivens generiska `listRow`-block, som mätte 225 px
    // för lågt vid samma radantal (review-fynd PR #2397). Rubrik-skelettet bär
    // INGEN egen breddklass (Skeleton-primitivens default `w-full`): en
    // explicit bredd hade gett en SMALARE box än det riktiga `<h1>`, som
    // (block-element utan breddklass i en `flex-col`-förälder) sträcker sig
    // till hela tvärled-bredden — samma `align-items: stretch`-mekanik som
    // Skeleton-primitivens `w-full` redan ger. `toEqual`-mätningen kräver
    // bredd-identitet, inte bara höjd/position
    // (`mer-vantelista-laddlage.acceptance.test.ts`).
    return (
      <section data-testid="vantelista-yta" className="flex flex-col gap-6">
        {sidRam}
        <p className="sr-only" role="status" aria-live="polite" aria-busy="true">
          Laddar väntelistan…
        </p>
        <div data-testid="vantelista-skeleton-titelblock" className="flex flex-col gap-1 px-4">
          <Skeleton variant="text" className="text-2xl" />
          <Skeleton variant="text" className="w-40 text-small" />
        </div>
        <div className="flex flex-col gap-3 px-4">
          <WaitlistSkeletonRow />
          <WaitlistSkeletonRow />
          <WaitlistSkeletonRow />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section data-testid="vantelista-yta" className="flex flex-col gap-4">
        {sidRam}
        <MessageBox intent="error" title="Kunde inte hämta väntelistan">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
        </MessageBox>
      </section>
    );
  }

  return (
    <section data-testid="vantelista-yta" className="flex flex-col gap-6">
      {sidRam}

      {/* aria-live: bekräftar för skärmläsare att väntelistan anlänt. */}
      <p className="sr-only" role="status" aria-live="polite">
        Väntelistan laddad.
      </p>

      <header className="flex flex-col gap-1 px-4">
        <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-2xl">
          Väntelista
        </h1>
        {/* Antal som TEXT — översikt, aldrig enbart färg. */}
        <p className="text-small text-text-muted">{`${waitlist.length} på väntelistan`}</p>
      </header>

      {waitlist.length === 0 ? (
        <p className="px-4 text-small text-text-muted">Väntelistan är tom.</p>
      ) : (
        <ul className="flex flex-col gap-3 px-4">
          {waitlist.map((entry) => (
            <WaitlistRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
