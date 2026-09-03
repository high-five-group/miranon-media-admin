/**
 * [PROTOTYPE] IntresseradeKonvergens — B3-konvergenspasset (S114 Del 3
 * beslut 5-6, Marcus-kvitterad riktning 2026-08-31).
 *
 * FRÅGAN SOM BESVARAS: exakt vilken form av Intresserade-sidan är Marcus
 * helt nöjd med?
 *
 * Konvergens-only (divergensen överhoppad öppet — riktningen är redan
 * kvitterad): filen föddes som EXAKT kopia av ../Intresserade.tsx
 * (K0-baslinjen är skarpa vyn på ?variant=null i växlaren), och K-stegen
 * itererar mot riktningen:
 *   (a) personlistans rad-anatomi (namn + e-post som identitetsblock,
 *       4 px-gap, "N dagar sedan · handling" som aktivitetsrad,
 *       hämtnings-badge som egen högerkolumn)
 *   (b) sök + sorteringskontroll (senaste interaktion desc default,
 *       namn A-Ö som växel; INGEN bokstavsrad)
 *   (c) "Namnlös intresserad" — aldrig initialer ur platshållarsträngen
 *   (d) ingen utskicks-affordans (6h-kroken byggs inte här)
 *
 * Kastbar VÄXEL-kod (throwaway-kontraktet ii): formen promoveras vid
 * Marcus stämpel (ADR-102/103/104); det som rivs efteråt är denna
 * variant-gren och fyllnadsläget, aldrig formen.
 *
 * Datavägen ärvs (underform A): fetchIntresserade() via useDataSource —
 * ingen egen adapter, inga mutationer. Fyllnadsläget (?data=fyll) är
 * DEV-lokal minnesdata för FORMBEDÖMNING (staging bär endast 2 leads,
 * mätt i TASK-350) — skalprovs-precedentets form: syntetiska rader med
 * @exempel.invalid + varningsruta som inte går att missa.
 */
import { useQuery } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InitialAvatar } from '@/components/primitives/InitialAvatar';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Select, SelectItem } from '@/components/primitives/Select';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { Intresserad } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

/** Formens yttersta element — samma `<domän>-yta`-konvention som
 * `AnmalningarSida.tsx`s `YTANS_ANKARE` (rad ~86). Ett attribut, ingen ny
 * DOM-nod eller ARIA-roll: `data-testid` syns aldrig i `ariaSnapshot`, så
 * ankaret ändrar inte formen (TASK-374.1 AC #1/#2). Namnet följer den
 * skarpa ytans framtida plats efter promoveringen (`374.2`s rename), inte
 * prototypfilens eget namn — ingen kollision mätt mot `src/`/`tests/`. */
const YTANS_ANKARE = 'intresserade-yta';

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

/** "N dagar sedan"-texten — medvetet enkel (prototyp; personlistans exakta
 * form ärvs vid promoveringen). */
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

/** DEV-fyllnadsdata för formbedömning (skalprovs-precedentet): 60 syntetiska
 * intresserade, varav var femte namnlös; deterministisk, ren minnesdata. */
const FYLL_NAMN = [
  'Eva Lindqvist',
  'Johan Bergström',
  'Maria Sandell',
  'Per Åkesson',
  'Karin Holm',
  'Lars Öberg',
  'Sofia Ek',
  'Anders Nyström',
  'Helena Falk',
  'Mats Ljung',
  'Åsa Vinter',
  'Erik Sundin',
];
const FYLL_ERBJUDANDEN = [
  'Pyramidernas Vajrar',
  'Meditation för nybörjare',
  'Fjärrskådningsguiden',
  'Introduktion till RIM',
];

function byggFyllnadsdata(): Intresserad[] {
  return Array.from({ length: 60 }, (_, i) => {
    const namnlos = i % 5 === 4;
    const namn = namnlos ? null : `${FYLL_NAMN[i % FYLL_NAMN.length]}`;
    const erbjudande = FYLL_ERBJUDANDEN[i % FYLL_ERBJUDANDEN.length];
    const antal = (i % 6) + 1;
    const dagar = Math.floor(i * 5.2);
    // Typriktig konstruktion (TASK-374.1 AC #5): `satisfies Intresserad`
    // kräver varje fält `IntresseradSchema` (= `PersonSchema.extend({
    // antalHamtningar, allaHamtningar })`) deklarerar, till skillnad från den
    // rivna `as unknown as Intresserad` som gav bort typkontrollen helt.
    // Fälten under är UTANFÖR `KonvergensRad`s läsmängd (namn, fornamn,
    // efternamn, email, senasteInteraktion, dagarSedanSenaste,
    // antalHamtningar — se komponenten ovan) och ändrar därför inte
    // renderingen; de är leads per definition (`antalAnmalningar: 0`, se
    // `Intresserad.schema.ts`s docblock) och bär i övrigt PersonSchemas
    // null-golv.
    return {
      id: `fyll-${i}`,
      namn,
      fornamn: null,
      efternamn: null,
      // Alla bär e-post — speglar prod (0 av 112 intresserade saknar e-post,
      // mätt 2026-09-03); den degenererade raden utan bådadera formbedöms inte.
      email: `fyll-${i}@exempel.invalid`,
      telefon: null,
      ort: [],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 0,
      antalDeltaganden: 0,
      erfarenhetsniva: null,
      erfarenhetsbadge: null,
      senasteInteraktion: `Hämtade ${erbjudande}`,
      senasteInteraktionDatum: null,
      dagarSedanSenaste: dagar,
      harAktivAnmalan: null,
      ejGodkandMail: false,
      radSkapad: null,
      anmalningIds: [],
      deltagandeIds: [],
      antalHamtningar: antal,
      allaHamtningar: [erbjudande],
    } satisfies Intresserad;
  });
}

export function IntresseradeKonvergens() {
  const dataSource = useDataSource();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef(false);
  const [dataMode] = useQueryState('data');
  const [sok, setSok] = useState('');
  const [sortering, setSortering] = useState<Sortering>('interaktion');

  const fyllnad = import.meta.env.DEV && dataMode === 'fyll';

  const {
    data: hamtade,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.intresserade.all,
    queryFn: () => dataSource.fetchIntresserade(),
    enabled: !fyllnad,
    retry: (failureCount, err) =>
      !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) &&
      failureCount < 3,
  });

  const intresserade = useMemo(
    () => (fyllnad ? byggFyllnadsdata() : (hamtade ?? [])),
    [fyllnad, hamtade],
  );

  const laddat = fyllnad || !isPending;

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

  useEffect(() => {
    if (laddat && !announceRef.current) {
      announceRef.current = true;
      headingRef.current?.focus();
      document.title = 'Intresserade';
    }
  }, [laddat]);

  const sidRam = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  if (!laddat) {
    return (
      <section className="flex flex-col gap-6">
        {sidRam}
        <div
          data-testid={YTANS_ANKARE}
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="flex flex-col gap-4 px-4"
        >
          <span className="sr-only">Laddar intresserade…</span>
          <div className="flex flex-col gap-1">
            <Skeleton variant="text" className="w-40 text-3xl" />
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

  if (!fyllnad && isError) {
    return (
      <section className="flex flex-col gap-4">
        {sidRam}
        <div data-testid={YTANS_ANKARE} className="px-4">
          <MessageBox intent="error" title="Kunde inte hämta intresserade">
            {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
          </MessageBox>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {sidRam}

      {/* Ankaret sitter på en NY, ren behållare — sidkromet (sidRam) står
          kvar som SYSKON utanför den, precis som `AnmalningarSida.tsx`s
          `YTANS_ANKARE`-kommentar föreskriver: en granskare som scopar sin
          `ariaSnapshot` hit ska mäta FORMEN, aldrig sidkromet. Behållaren är
          en ren `<div>` (ARIA-roll "generic") — den syns aldrig i
          `ariaSnapshot` (verifierat mot samtliga incheckade referenser under
          `tests/visual/__aria__/`: noll "generic"-noder), och `gap-6` här
          reproducerar exakt den rytm den ENDA tidigare flex-behållaren gav,
          eftersom `role="status"`-raden nedan redan låg utanför flödet
          (`sr-only` ⇒ `position: absolute`) och därför aldrig konsumerade en
          egen gap-rad. Nästlingen ändrar alltså varken form eller layout —
          se Final Summary för det uppmätta ariaSnapshot-beviset. */}
      <div data-testid={YTANS_ANKARE} className="flex flex-col gap-6">
        <p className="sr-only" role="status" aria-live="polite">
          Intresserade laddade.
        </p>

        {fyllnad ? (
          <div className="px-4">
            <MessageBox intent="warning" title="Fyllnadsdata för formbedömning">
              60 syntetiska intresserade (@exempel.invalid) visas i stället för verklig data. Växla
              dataläget i prototyp-växlaren för verkliga rader.
            </MessageBox>
          </div>
        ) : null}

        <header className="flex flex-col gap-1 px-4">
          <h1 ref={headingRef} tabIndex={-1} className="font-semibold text-3xl">
            Intresserade
          </h1>
          {/* TRÄFFANTALET SOM ARTIG LIVE-REGION (TASK-374.1 AC #3). Formen
              är `DokumentYta.tsx`s "aria-live + aria-atomic UTAN role=status"
              (§ SAMMANFATTNINGEN, rad ~3436): `role="status"` implicerar
              SAMMA politeness och att sätta båda är den kända
              dubbelannonserings-fällan. Räknaren är redan en `<p>` (ARIA-roll
              "paragraph") — att LÅTA den rollen stå orörd och bara lägga till
              attributen håller `ariaSnapshot` byte-identisk (aria-live/
              aria-atomic renderas inte i Playwrights ariaSnapshot-yaml,
              verifierat mot samtliga incheckade referenser: noll
              `[live]`-annoteringar i `tests/visual/__aria__/`), medan
              skärmläsare ändå annonserar ändringen — `aria-live` fungerar
              oavsett roll (WAI-ARIA; samma tekniks precedent:
              `SegmentMailCompose.tsx` rad ~306). Formen ändras alltså inte
              (AC #1); annonseringen är ett rent DOM-attributtillägg. */}
          <p className="text-small text-text-muted" aria-live="polite" aria-atomic="true">
            {sok.trim()
              ? `${synliga.length} träffar av ${intresserade.length} intresserade`
              : `${intresserade.length} intresserade`}
          </p>
        </header>

        <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-end sm:justify-between">
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

        {synliga.length === 0 ? (
          <p className="px-4 text-small text-text-muted">
            {sok.trim() ? 'Inga träffar på sökningen.' : 'Inga intresserade än.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3 px-4">
            {synliga.map((person) => (
              <KonvergensRad key={person.id} person={person} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
