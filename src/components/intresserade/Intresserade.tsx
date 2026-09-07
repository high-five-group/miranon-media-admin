/**
 * Intresserade — GLOBAL LÄS-vy över leads (Fas 6e L1 Landning 3),
 * `/mer/intresserade`. Data via `fetchIntresserade()` → get-leads-EF
 * (router-context-DI, ADR-055), som serverside-filtrerar den STRIKTA
 * lead-formeln (`AND({Totalt antal hämtningar (erbjudande)} > 0, {Antal
 * anmälningar (totalt)} = 0)`) och sorterar 'Senaste interaktion (datum)'
 * desc — ingen klient-sortering av GRUNDORDNINGEN (sorteringskontrollen
 * nedan är ett explicit VAL, default = serverns ordning).
 *
 * [PROMOVERING SLUTFÖRD, TASK-374.4, ADR-103 B2 steg 4] Formen föddes som en
 * S114-prototyp (Del 3, K1–K3-varven; det tidigare exportnamnet syns via
 * `git log --follow` på DENNA fil), promoverades i TASK-374.2 (git-mv ur den
 * dåvarande prototypmappen), och Marcus godkände den promoverade ytan i
 * TASK-374.3 (2026-09-03, kvittens: "Den promoverade ytan är identisk med
 * facit i läge fylld; det som rivs är växlar och villkor, aldrig formen") —
 * manifestet `tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json`
 * (sha b391dffe) förblir det ursprungliga stämpel-kvittot. Prototyp-
 * substratet (fyllnadsfabriken, den tidigare `data`-frågeparametern för
 * fyllnadsläget, samtliga prototyp-markeringar) är rivet i denna skiva — se
 * `git log --follow` för fullständig historik (K1-scaffold, K2 husets
 * Select, K3 radanatomin, 374.1s härdning, 374.2s flipp, 374.4s rivning).
 * Formen:
 *   (a) personlistans rad-anatomi (namn + e-post som identitetsblock,
 *       "N dagar sedan · handling" som aktivitetsrad, hämtnings-badge som
 *       egen högerkolumn, tre höjdreserverade rader — se KonvergensRad)
 *   (b) sök + sorteringskontroll (senaste interaktion desc default,
 *       namn A-Ö som växel; ingen bokstavsrad)
 *   (c) "Namnlös intresserad" — aldrig initialer ur platshållarsträngen
 *   (d) ingen utskicks-affordans (6h-kroken byggs inte här)
 *
 * Datavägen är OFÖRÄNDRAD (underform A): `fetchIntresserade()` via
 * `useDataSource` — ingen egen adapter, inga mutationer.
 */
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { Intresserad } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/** Formens yttersta element — samma `<domän>-yta`-konvention som
 * `AnmalningarSida.tsx`s `YTANS_ANKARE` (rad ~86). Ett attribut, ingen ny
 * DOM-nod eller ARIA-roll: `data-testid` syns aldrig i `ariaSnapshot`, så
 * ankaret ändrar inte formen (TASK-374.1 AC #1/#2). Namnet följer den
 * skarpa ytans plats (satt redan i 374.1, INNAN 374.2s rename existerade)
 * — inte prototypfilens dåvarande eget namn. */
const YTANS_ANKARE = 'intresserade-yta';

/** Sökradens ankare (TASK-416.8 AC #2) — samma `data-testid`-konvention som
 * `YTANS_ANKARE`: ett attribut, ingen ny DOM-nod eller ARIA-roll, syns
 * aldrig i `ariaSnapshot`. Låter mätningen (boundingBox) peka på EXAKT
 * samma nod oavsett vilken av de tre grenarna (laddläge/fel/laddat) som
 * renderar den delade `sokRad`-konstanten. */
const SOKRAD_ANKARE = 'intresserade-sokrad';

/** Listkroppens ankare (TASK-416.8 AC #2) — sätts på BÅDA representationerna
 * (skeleton-radernas wrapper i laddläget, `<ul>` i laddat läge) så
 * `:scope > *`-barnet (första raden, skeleton respektive verklig) kan mätas
 * med samma selector oavsett tillstånd. */
const LISTKROPP_ANKARE = 'intresserade-listkropp';

/** Sorteringslägen — konvergensens (b): interaktion (serverns ordning) | namn. */
type Sortering = 'interaktion' | 'namn';

/** Som skarpa vyns displayName, men riktning (c): ordlistans term, aldrig
 * "person" och aldrig initialer ur platshållaren (avatarn särbehandlas). */
function displayName(person: Intresserad): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  if (composed) return composed;
  return 'Namnlös intresserad';
}

function arNamnlos(person: Intresserad): boolean {
  return !person.namn && !person.fornamn && !person.efternamn;
}

/** Primärraden: namnet när det finns, annars e-posten — mailklienternas regel.
 * Mätt i prod 2026-09-03 (EF:ens lead-filter, read-only): 63 av 112
 * intresserade saknar namn, 0 saknar e-post. Platshållaren nås bara av den
 * degenererade raden utan både namn och e-post. */
function primarText(person: Intresserad): string {
  if (!arNamnlos(person)) return displayName(person);
  return person.email ?? 'Namnlös intresserad';
}

/** Sekundärraden: e-posten under ett namn; "Namnlös intresserad" dämpat under
 * en e-post (Del 2 (c) i underordnad plats i stället för som rubrik); tom men
 * höjdreserverad när inget av dem finns. */
function sekundarText(person: Intresserad): string {
  if (!arNamnlos(person)) return person.email ?? '';
  return person.email ? 'Namnlös intresserad' : '';
}

/** "N dagar sedan"-texten — medvetet enkel form, oförändrad av 374.2s rename. */
function dagarText(dagar: number): string {
  if (dagar === 0) return 'i dag';
  if (dagar === 1) return 'i går';
  return `${dagar} dagar sedan`;
}

/** En intresserad i personlistans anatomi (riktning a): identitetsblock +
 * aktivitetsrad + hämtnings-badge som fast högerkolumn. */
function KonvergensRad({ person }: { person: Intresserad }) {
  const namn = displayName(person);
  const namnlos = arNamnlos(person);
  return (
    <li className="flex break-inside-avoid items-center gap-3 border-text-muted/20 border-b pb-3 contrast-more:border-border-strong">
      {namnlos ? (
        // Samma 36 px som InitialAvatar (size-9) — 40 px här gav namnlösa rader
        // fyra pixlar mer höjd än namngivna (Marcus varv 2).
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-muted text-text-muted"
        >
          <UserRound className="size-5" />
        </span>
      ) : (
        <InitialAvatar namn={namn} />
      )}
      {/* Enhetlig anatomi (Marcus varv 2): exakt tre rader per intresserad,
          var och en höjdreserverad med min-h-[1lh] och trunkerad — tomt
          innehåll eller lång text kan aldrig ändra radhöjden (samma grepp som
          B2-ytans min-h-[2lh]). Ingen fast pixelhöjd behövs: alla rader har
          samma antal reserverade rader och samma avatar. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="min-h-[1lh] truncate font-medium">{primarText(person)}</span>
        <span className="min-h-[1lh] truncate text-small text-text-muted">
          {sekundarText(person)}
        </span>
        <span className="mt-1 min-h-[1lh] truncate text-caption">
          {person.senasteInteraktion ? (
            <>
              {person.dagarSedanSenaste != null && (
                <span className="font-medium text-text-secondary tabular-nums">
                  {dagarText(person.dagarSedanSenaste)}
                  {' · '}
                </span>
              )}
              <span className="text-text-muted">{person.senasteInteraktion}</span>
            </>
          ) : null}
        </span>
      </div>
      {/* Fast bredd: den osynliga storleksgivaren "00 hämtningar" ligger i samma
          grid-cell som texten, så alla pills blir lika breda för en- och
          tvåsiffriga tal (tabular-nums gör siffrorna lika breda); en tresiffrig
          siffra växer cellen i stället för att klippas. */}
      <span className="grid shrink-0 rounded-full bg-bg-muted px-2.5 py-0.5 text-caption text-text-secondary tabular-nums">
        <span aria-hidden className="invisible col-start-1 row-start-1">
          00 hämtningar
        </span>
        <span className="col-start-1 row-start-1 text-center">
          {person.antalHamtningar === 1 ? '1 hämtning' : `${person.antalHamtningar} hämtningar`}
        </span>
      </span>
    </li>
  );
}

export function Intresserade() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);
  /** [TASK-416.8, RUNDA 3] Ankaret fokus-effekten frågar INNAN den flyttar
   * fokus till `<h1>` — se effekten nedan för varför. */
  const sokRadRef = useRef<HTMLDivElement>(null);
  const [sok, setSok] = useState('');
  const [sortering, setSortering] = useState<Sortering>('interaktion');

  // [TASK-420] Ingen egen `retry` här — policyn (aldrig retry på 4xx, max 3
  // försök annars) bor på NYCKELN via `setQueryDefaults`
  // (`registreraIntresseradeRetryPolicy`, `src/router.ts`), delad med
  // startvärmningens `ensureQueryData`-anrop mot samma nyckel. En egen
  // `retry` här hade skuggat den delade defaulten (anropsställets options
  // vinner alltid över `setQueryDefaults`) och återinfört exakt den
  // dubbelpolicy denna skiva tar bort.
  const {
    data: hamtade,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.intresserade.all,
    queryFn: () => dataSource.fetchIntresserade(),
  });

  const intresserade = useMemo(() => hamtade ?? [], [hamtade]);

  const laddat = !isPending;

  const synliga = useMemo(() => {
    const term = sok.trim().toLocaleLowerCase('sv');
    const traffar = term
      ? intresserade.filter((p) =>
          `${primarText(p)} ${p.email ?? ''}`.toLocaleLowerCase('sv').includes(term),
        )
      : intresserade;
    if (sortering === 'namn') {
      const collator = new Intl.Collator('sv');
      // Sorterar på primärraden (namn eller e-post) — namnlösa hamnar efter sin
      // adress i stället för i en "Namnlös intresserad"-klump.
      return [...traffar].sort((a, b) => collator.compare(primarText(a), primarText(b)));
    }
    return traffar;
  }, [intresserade, sok, sortering]);

  /** [TASK-416.8, RUNDA 3] Fokusflytten till `<h1>` sker BARA vid en
   * GENUINT lyckad laddning (`laddat && !isError`), och BARA om användaren
   * inte redan har fokus inuti `sokRad` (kollen mot `document.activeElement`
   * nedan). Två skäl, båda review-fynd:
   *
   * 1. `isError` i villkoret: runda 2 löste h1-fokus-stölden i fel-läge
   *    genom att INTE montera `<h1>` alls där (`rubrik = isError ? null :
   *    …`). Runda 3s fynd: det bröt tillgänglighetsgolvet (11, inga
   *    undantag) å ANNAT håll — sidan saknade sin ENDA rubrik i fel-läge,
   *    en ny asymmetri mot syskonytorna (EventsList/PersonsList har h1
   *    ovillkorligt) som `axe` aldrig fångar (best-practice-taggen
   *    `page-has-heading-one` ingår inte i WCAG-taggsviten testerna kör).
   *    `<h1>` är nu ALLTID monterad (se `rubrik` nedan) — problemet flyttas
   *    hit, till EFFEKTEN som bestämmer NÄR den får ta fokus, i stället för
   *    att lösas genom att gömma rubriken.
   * 2. `sokRadRef.current?.contains(document.activeElement)`-kollen:
   *    skyddar INTE bara isPending→isError (härledningen ovan) utan även
   *    isPending→laddat — om Lotta hinner börja skriva i sökfältet INNAN
   *    datan landar ska den FÖRSTA framgångsrika laddningen inte rycka
   *    fokus från henne heller. `sokRadRef` sitter på `sokRad`s egen
   *    container (se nedan); `.contains()` täcker både `<input>` och
   *    `Select`-triggern.
   *
   * `announceRef` håller kvar sin gamla roll: hela blocket (fokus + titel)
   * kör EXAKT en gång per genuint lyckad laddning — en isError→laddat-
   * återhämtning räknas första gången `laddat && !isError` blir sant,
   * oavsett att `laddat` redan varit sant under fel-fasen. */
  useEffect(() => {
    if (laddat && !isError && !announceRef.current) {
      announceRef.current = true;
      const harFokusISokRad = sokRadRef.current?.contains(document.activeElement) ?? false;
      if (!harFokusISokRad) {
        headingRef.current?.focus();
      }
      document.title = 'Intresserade';
    }
  }, [laddat, isError]);

  const sidRam = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  /** [TASK-416.8, HÄRDAD RUNDA 2] Sökraden — EN delad JSX-nod monterad på
   * EN FAST POSITION i EN ENDA returträdet nedan (inte tre separata
   * `return`, som runda 1 skrev det). Skälet är inte stilistiskt:
   * review-grinden (runda 1, Marcus mandat) visade att `sokRad`s
   * position bland sina syskon skilde sig mellan grenarna
   * (isPending index 2/4, isError index 0/2, laddat index 2/4) — Reacts
   * keyless reconciliation matchar barn POSITIONELLT, så DOM-identitet
   * (och därmed webbläsarfokus + otippad text i sökfältet) bevarades
   * bara för isPending→laddat, inte för isPending→isError eller
   * isError→laddat. Ett `key`-lapp hade dolt symptomet utan att laga
   * orsaken; ETT returträd med `sokRad` på en FAST plats bland sina
   * syskon (se det enda returträdet nedan) tar bort problemet
   * strukturellt — sokRad jämförs alltid mot sig själv, oavsett vilket
   * tillstånd grannarna representerar. */
  const sokRad = (
    <div
      ref={sokRadRef}
      data-testid={SOKRAD_ANKARE}
      className="flex flex-col gap-3 px-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <label className="flex w-full max-w-xs flex-col gap-1">
        <span className="text-small text-text-muted">Sök intresserad</span>
        <input
          type="search"
          value={sok}
          onChange={(e) => setSok(e.target.value)}
          placeholder="Namn eller e-post"
          className="rounded-lg border border-border-strong/40 bg-bg px-3 py-2 text-body focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        />
      </label>
      <Select
        label="Sortera efter"
        selectedKey={sortering}
        onSelectionChange={(k) => setSortering(k as Sortering)}
        className="shrink-0 sm:w-56"
      >
        <SelectItem id="interaktion">Senaste interaktion</SelectItem>
        <SelectItem id="namn">Namn A till Ö</SelectItem>
      </Select>
    </div>
  );

  /** Rubriken — `<header>` med `<h1>` ALLTID monterad, i ALLA tre
   * query-tillstånd (PRD TASK-416s regel; tillgänglighetsgolvet är 11 utan
   * undantag). Bara TRÄFFANTALS-raden under `<h1>` växlar: skeleton i
   * laddläge, INGEN rad i fel-läge (ingen pålitlig siffra att visa när
   * hämtningen misslyckats — samma "antal okänt"-princip som
   * `AnmalningarSida.tsx`, TASK-416.4), äkta räknartext i laddat läge.
   *
   * [RUNDA 3, review-fynd] Runda 2 löste h1-fokus-stölden i fel-läge genom
   * att INTE montera `<header>`/`<h1>` där alls (`rubrik = isError ? null
   * : …`). Det bytte ett fel mot ett annat: sidan saknade sin ENDA rubrik i
   * fel-läge — en ny asymmetri mot isPending (som redan fick en riktig
   * `<h1>` i runda 2) och mot syskonytorna EventsList/PersonsList (h1
   * ovillkorligt på ruttnivå). `axe` fångade det aldrig — `page-has-
   * heading-one`-best-practice-taggen ingår inte i WCAG-taggsviten
   * testerna kör (`wcag2a/2aa/21a/21aa/22aa`), så en h1-lös sida är osynlig
   * för den grinden.
   *
   * Lösningen flyttas hit-ELLER-DIT en gång till, nu till rätt plats:
   * `<h1>` är ALLTID monterad (denna konst), och fokus-EFFEKTEN (ovan,
   * `useEffect([laddat, isError])`) är den som numera vet NÄR den får ta
   * fokus — `laddat && !isError`, plus en kontroll att användaren inte
   * redan skriver i `sokRad`. Se den effektens egen kommentar för hela
   * resonemanget; `rubrik` behöver inte känna till fokuslogiken alls
   * längre, bara rendera formen. */
  const rubrik = (
    <header className="flex flex-col gap-1 px-4">
      <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
        Intresserade
      </h1>
      {!laddat ? (
        <Skeleton variant="text" className="w-32 text-small" />
      ) : isError ? null : (
        // TRÄFFANTALET SOM ARTIG LIVE-REGION (TASK-374.1 AC #3). Formen är
        // `DokumentYta.tsx`s "aria-live + aria-atomic UTAN role=status"
        // (§ SAMMANFATTNINGEN, rad ~3436): `role="status"` implicerar SAMMA
        // politeness och att sätta båda är den kända
        // dubbelannonserings-fällan. Räknaren är redan en `<p>` (ARIA-roll
        // "paragraph") — att LÅTA den rollen stå orörd och bara lägga till
        // attributen håller `ariaSnapshot` byte-identisk (aria-live/
        // aria-atomic renderas inte i Playwrights ariaSnapshot-yaml,
        // verifierat mot samtliga incheckade referenser: noll
        // `[live]`-annoteringar i `tests/visual/__aria__/`), medan
        // skärmläsare ändå annonserar ändringen — `aria-live` fungerar
        // oavsett roll (WAI-ARIA; samma tekniks precedent:
        // `SegmentMailCompose.tsx` rad ~306).
        <p className="text-small text-text-muted" aria-live="polite" aria-atomic="true">
          {sok.trim()
            ? `${synliga.length} träffar av ${intresserade.length} intresserade`
            : `${intresserade.length} intresserade`}
        </p>
      )}
    </header>
  );

  /** Den sr-only-annonseringen — EN fast syskon-position, innehållet
   * (element-typ span/p, eller inget alls) får variera fritt: ingen
   * fokus- eller inmatningsstat att bevara här, till skillnad från
   * `sokRad`. */
  const annonsering = !laddat ? (
    <span className="sr-only">Laddar intresserade…</span>
  ) : isError ? null : (
    <p className="sr-only" role="status" aria-live="polite">
      Intresserade laddade.
    </p>
  );

  /** Datakroppen — DEN ENDA delen som växlar mellan tillstånden
   * (review-beslutet, runda 2): skeleton / felbesked / tomt-läge / lista,
   * alla på SAMMA fasta syskon-position sist i returträdet nedan. */
  const datakropp = !laddat ? (
    // h-20 (80 px, INTE variantens generiska 3lh = 72 px): mätt mot
    // `KonvergensRad`s faktiska höjd (avatar + tre textrader olika
    // typografiskala + `pb-3` + kantlinje summerar till 80 px, inte tre
    // generiska line-boxar) — samma etablerade mönster som
    // `PersonDetail.tsx`/`EventDetail.tsx`/`AnmalanDetail.tsx`s
    // `h-XX`-överskrivningar av `listRow`-varianten. Utan denna rad växer
    // VARJE rad 8 px vid datalandning och skjuter alla rader under den
    // nedåt — boundingBox-beviset (TASK-416.8 AC #2) i Final Summary visar
    // 72→80 px innan denna rad fanns.
    <div data-testid={LISTKROPP_ANKARE} className="flex flex-col gap-3 px-4">
      <Skeleton variant="listRow" className="h-20" />
      <Skeleton variant="listRow" className="h-20" />
      <Skeleton variant="listRow" className="h-20" />
    </div>
  ) : isError ? (
    <div className="px-4">
      <MessageBox intent="error" title="Kunde inte hämta intresserade">
        {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
      </MessageBox>
    </div>
  ) : synliga.length === 0 ? (
    <p className="px-4 text-small text-text-muted">
      {sok.trim() ? 'Inga träffar på sökningen.' : 'Inga intresserade än.'}
    </p>
  ) : (
    <ul data-testid={LISTKROPP_ANKARE} className="flex flex-col gap-3 px-4">
      {synliga.map((person) => (
        <KonvergensRad key={person.id} person={person} />
      ))}
    </ul>
  );

  return (
    <section className="flex flex-col gap-6">
      {sidRam}

      {/* ETT returträd, EN behållare — sidkromet (sidRam) står kvar som
          SYSKON utanför den, precis som `AnmalningarSida.tsx`s
          `YTANS_ANKARE`-kommentar föreskriver: en granskare som scopar sin
          `ariaSnapshot` hit ska mäta FORMEN, aldrig sidkromet. Behållaren
          är en ren `<div>` (ARIA-roll "generic") — den syns aldrig i
          `ariaSnapshot` (verifierat mot samtliga incheckade referenser
          under `tests/visual/__aria__/`: noll "generic"-noder).
          `role`/`aria-live`/`aria-busy` sätts bara i laddläget (Roselli-
          mönstret: containern ÄR statuszonen då) — i fel-/laddat läge bär
          i stället den inre `annonsering`-noden (eller `MessageBox`s
          `role="alert"`) beskedet, så ingen dubbelannonsering uppstår.
          De FYRA barnen nedan (`annonsering`, `rubrik`, `sokRad`,
          `datakropp`) är FASTA SYSKON-POSITIONER som alltid finns med i
          samma ordning — det är den strukturen, inte en `key`, som håller
          `sokRad`s DOM-identitet (och därmed fokus + skriven text) intakt
          genom VARJE tillståndsövergång (TASK-416.8 runda 2). */}
      <div
        data-testid={YTANS_ANKARE}
        role={!laddat ? 'status' : undefined}
        aria-live={!laddat ? 'polite' : undefined}
        aria-busy={!laddat ? true : undefined}
        className="flex flex-col gap-6"
      >
        {annonsering}
        {rubrik}
        {sokRad}
        {datakropp}
      </div>
    </section>
  );
}
