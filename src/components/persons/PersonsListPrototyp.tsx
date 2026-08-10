/**
 * [PROTOTYPE] S90 — KONVERGENS-PASS på Personer-listan. KASTBAR KOD.
 *
 * FRÅGAN (throwaway-kontraktets klausul i):
 *
 *   "Hur ska Personer-listan se ut när den talar samma visuella språk som
 *    resten av appen efter facit-vågen?"
 *
 * Formen: EN variant (nyckel `a`, ADR-074 beslut 1), flera STEG. Steg 1 är en
 * EXAKT KOPIA av `PersonsList.tsx` — annars bedöms förfiningarna mot fel
 * baslinje (prototype-skillen § Tvåfas-arbetsformen punkt 2). Varje fryst steg
 * snapshot:as till `tasks/sessions/bilagor/s90-personlistan-konvergens/`;
 * stegen adresseras ALDRIG i URL:en (ADR-074 beslut 1) — den här filen bär
 * bara det SENASTE steget, historiken bor i PNG:erna.
 *
 * Kastbar från första dagen: prototypkod befordras ALDRIG till skarp
 * implementation (klausul iv). Rivning = `git rm` på denna fil + återställ
 * prototyp-grenen i `src/routes/_authenticated/personer/index.tsx`. Ingen
 * annan fil bär prototyp-kod.
 *
 * DEV-grindad via routens `import.meta.env.DEV`-gren (ADR-044-mekaniken).
 * Datavägen ÄRVS oförändrad (`useDataSource`, ADR-055/057) — read-only.
 */
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRight, X } from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button as AriaButton, Input as AriaInput, SearchField } from 'react-aria-components';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { Person } from '@/domain/models/Person';
import { queryKeys } from '@/queries/keys';

/**
 * [PROTOTYPE] FORKEN i steg k03 är AVGJORD (Marcus, S103 2026-08-10:
 * *"Skrota Zebra-grejen"*). Kortytan är TONAL — en tonal kortyta för hela
 * listan med `divide-y`-avdelare mellan raderna (DetaljGrupp.tsx:29-36 +
 * :63-71, eventsidans facit). Zebra-grenen (varannan rad tintad utan
 * avdelare, NyaAnmalningarCard.tsx:163-169) är riven; den bor kvar som
 * historik i `k03b-*` och `slutlage-zebra-*` i bilagemappen.
 *
 * Valet är oberoende belagt två gånger: Marcus öga, och ett research-pass
 * (`docs/research/personlista-scanlista-branschmonster-2026-08-10.md`) där
 * fem designsystem bygger en-kolumns scanlistor med avdelare och aldrig
 * zebra — zebra hör till tabellklassen, vars motiv (horisontell spårning
 * över kolumner) den här listan saknar. A11y pekade åt samma håll: vår
 * zebra-variant bar radseparationen enbart i bakgrundstinten, utan
 * kompensation under `prefers-contrast: more` eller forced-colors.
 *
 * Vinnaren behåller sin nyckel (`?variant=a`, ADR-074 beslut 1).
 *
 * Aldrig 50 fristående kort per person: den formen bär 3-12 poster (EventCard),
 * inte en scanlista som ska tåla 200 rader (Marcus-lås).
 */

/** Sidstorlek per cursor-sida (ADR-056). EF:n klampar mot Airtables tak (≤100). */
const PAGE_SIZE = 50;

/**
 * [PROTOTYPE] STEG 6 (k06) — skeleton-radernas antal OCH namnbredder.
 *
 * Tio rader = "en trolig sida" i den frusna fixturvärlden, och ungefär två
 * mobila vyportar. ÄRLIG SPÄNNING: skarp `PAGE_SIZE` är 50, så exakt
 * slutgeometri för en hel sida är omöjlig utan en 3 000 px skeleton-vägg —
 * §15:s "lika många rader" tolkas här som "lika många rader man faktiskt ser".
 * Byggkrav till skarpt utförande: bekräfta talet mot verklig sidhöjd.
 *
 * Bredderna varieras deterministiskt så laddläget läses som en LISTA av namn,
 * inte som en streckkod — men aldrig slumpat (snapshots måste vara stabila).
 */
const SKELETON_NAMNBREDD = [
  'w-2/5',
  'w-1/2',
  'w-1/3',
  'w-2/5',
  'w-1/2',
  'w-1/3',
  'w-2/5',
  'w-1/2',
  'w-1/3',
  'w-2/5',
];

/** Fördröjning innan en sökterm skrivs till URL:en + utlöser server-sökning. */
const SEARCH_DEBOUNCE_MS = 250;

/** Sammansatt visningsnamn ur de namnfält Airtable kan leverera. */
function displayName(person: Person): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  return composed || 'Okänt namn';
}

/** Kontaktrad — e-post och/eller telefon, det som finns. */
function contactLine(person: Person): string | null {
  const parts = [person.email, person.telefon].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * [PROTOTYPE] STEG 7 (k07) — INSTANT. Osynlig i bild, störst kännbar effekt.
 *
 * Värmer persondetaljen på AVSIKT (ADR-078 beslut 3): hover/fokus är den
 * tidigaste ärliga signalen om att en rad ska öppnas, så `get-person` startar
 * där i stället för vid klicket. `get-person` batch-hämtar hela kurshistoriken
 * och är EF-familjens tyngre anrop — utan värmningen hinner den aldrig bli
 * instant. Idempotent: React Query dedupar och `staleTime` gör upprepad avsikt
 * gratis.
 *
 * `useCallback`-memoiseringen är LOAD-BEARING (EventCard.tsx:44, byggunderlagets
 * R8): utan stabil identitet re-avfyras avsikten vid varje omrendering utan ny
 * användarsignal. Deps är `[dataSource, queryClient]` — inget annat.
 */
function useForberedPersonDetalj(): (personId: string) => void {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  return useCallback(
    (personId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.persons.detail(personId),
        queryFn: () => dataSource.fetchPerson(personId),
        staleTime: 30_000,
      });
    },
    [dataSource, queryClient],
  );
}

/**
 * [PROTOTYPE] STEG 4 (k04) — anmälningarna som SPRÅK, inte som fältetikett.
 * `Anmälningar (totalt): 1` är basens kolumnnamn, inte svenska. Talet bär
 * `tabular-nums` så siffrorna står i kolumn när ögat scannar nedåt.
 */
function anmalningarText(antal: number): string {
  if (antal === 0) return 'Inga anmälningar';
  return antal === 1 ? '1 anmälan' : `${antal} anmälningar`;
}

/**
 * [PROTOTYPE] STEG 4 (k04) — pill-formen ur `Gruppdynamik.tsx:106-112`.
 * `bg-surface` (inte `bg-bg-muted`) eftersom pillen sitter INUTI den tonala
 * kortytan — en pill i kortets egen ton hade varit osynlig.
 */
function Pill({ ton = 'neutral', children }: { ton?: 'neutral' | 'aktiv'; children: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 font-medium text-caption ${
        ton === 'aktiv' ? 'bg-primary-tint text-text' : 'bg-surface text-text-secondary'
      }`}
    >
      {children}
    </span>
  );
}

/**
 * [PROTOTYPE] Personlistan — konvergens-passets SENASTE steg (k11).
 *
 * Filen började som EXAKT KOPIA av `PersonsList` (2026-07-26, steg k01: sju
 * element klonade byte-för-byte per byggunderlagets §1.3-tabell — bevisat
 * exakt, samma SHA-256 som skarpa vyns skärmdump i båda bredderna). Varje
 * efterföljande steg ändrade EN sak, frystes med ett snapshot-par och
 * ändrades sedan vidare i samma fil.
 *
 * Stegen och deras motiv (fulltext + bilder:
 * `tasks/sessions/bilagor/s90-personlistan-konvergens/README.md`):
 *
 *   k01 exakt kopia · k02 sid-insetens dubbelkant (i routen) · k03 kortanatomin
 *   (FORK: AVGJORD, tonal) · k04 metadata-grammatiken · k05 helradslänk + chevron ·
 *   k06 lugnt laddläge · k07 prefetch på avsikt · k08 sökfältets form ·
 *   k09 räknar-raden som meta · k10 "Ladda fler" som kapsel · k11 tomläget.
 *
 * Det som INTE byggdes, medvetet: bokstavsgruppering (Marcus-beslut; cursor-
 * pagineringen skär grupper mitt itu vid sidgränsen).
 *
 * Datahämtning, sök-debounce, cursor-paginering, fokus-behållning och
 * aria-live-annonsering är OFÖRÄNDRADE ur skarpa komponenten — passet handlar
 * om formen, inte om mekaniken.
 */
export function PersonsListPrototyp() {
  const dataSource = useDataSource();
  // [PROTOTYPE] STEG 7 (k07) — värmning av persondetaljen på avsikt.
  const varmDetalj = useForberedPersonDetalj();
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));

  const [searchInput, setSearchInput] = useState(() => q);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== q) setQ(searchInput || null);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, q, setQ]);

  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.persons.search({ q }),
      queryFn: ({ pageParam }) =>
        dataSource.listPersons({
          search: q || undefined,
          cursor: pageParam ?? undefined,
          pageSize: PAGE_SIZE,
        }),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor,
    });

  const persons = data?.pages.flatMap((page) => page.persons) ?? [];

  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const loadMoreTriggered = useRef(false);
  const prevCountRef = useRef(0);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (isFetchingNextPage) return;
    if (!loadMoreTriggered.current) {
      prevCountRef.current = persons.length;
      return;
    }
    const added = persons.length - prevCountRef.current;
    prevCountRef.current = persons.length;
    loadMoreTriggered.current = false;
    if (added > 0) {
      setAnnouncement(
        `${added} fler ${added === 1 ? 'person' : 'personer'} laddade, ${persons.length} totalt.`,
      );
      if (loadMoreRef.current) loadMoreRef.current.focus();
      else statusRef.current?.focus();
    }
  }, [isFetchingNextPage, persons.length]);

  // [PROTOTYPE] STEG 8 (k08) — SÖKFÄLTETS FORM.
  // Appens enda faktiska sökfälts-facit är eventväljarens (EventValjare.tsx:398-423,
  // Marcus-beslut 2026-07-25 våg 3); ingen spec-paragraf finns (0 träffar på
  // "Sökfält" i DESIGN-SYSTEM-SPEC). Formen: `min-h-10` i stället för `size="lg"`
  // (min-h-12 px-4 text-lg — sökfältet slutar dominera sidan), samma
  // input-tokens, native webkit-krysset släckt och ersatt av RAC:s clear-Button
  // i appens grå ikonform (X 16, muted → text vid hover).
  //
  // ÄRLIG NOT till Marcus: `mm-fokusring-vid-fokus` följer med ur den citerade
  // raden, men klassens RATIONALE är overlay-specifik (ringen ska synas vid
  // MUS-öppning av en autofokuserad popover, base.css:119-127). Ett sidfält
  // fokuseras inte automatiskt, så här hade globala `:focus-visible` räckt.
  // Behållen för att låset sa "inklusive" — flagga för skarpt bygge.
  //
  // INGEN `autoFocus`: sidladdnings-autofokus är a11y-golv, inte stil
  // (EventValjare bär propen just för att den ÖPPNAS på användarens handling).
  const searchField = (
    <SearchField
      aria-label="Sök person"
      value={searchInput}
      onChange={setSearchInput}
      className="group flex flex-col"
    >
      <div className="relative">
        <AriaInput
          placeholder="Sök på namn, e-post, telefon eller ort"
          className="text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) mm-fokusring-vid-fokus min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 pr-10 text-body [&::-webkit-search-cancel-button]:[-webkit-appearance:none]"
        />
        <AriaButton
          aria-label="Rensa sökningen"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:text-text group-data-[empty]:hidden"
        >
          <X aria-hidden="true" size={16} className="shrink-0" />
        </AriaButton>
      </div>
    </SearchField>
  );

  // [PROTOTYPE] STEG 6 (k06) — LUGNT LADDLÄGE (spec §15).
  // "Laddar personer…" är ordagrant förbjudet (spec:1078: "'Laddar…'-textrader
  // och spinners används inte"). Sökfältet är statiskt känd chrome och ritas
  // direkt; ENDAST datakropparna blir skeleton-block, i radernas SLUTgeometri
  // (samma padding, samma gap, samma tre textnivåer) så inget hoppar när data
  // landar. Beskedet bärs av `aria-busy` + ett visuellt dolt sr-only-besked på
  // containern; Skeleton-primitiven är alltid `aria-hidden` (Roselli-mönstret).
  // Mall: EventsList.tsx:505-532. Ingen e2e-assertion hänger i den gamla texten
  // (till skillnad från persondetaljens, byggunderlagets R2).
  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {searchField}
        <div role="status" aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Laddar personer…</span>
          <Skeleton variant="text" className="w-40 text-small" />
          <div className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
            {SKELETON_NAMNBREDD.map((bredd, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: fast skeleton-rad, ingen identitet
                key={i}
                className="flex items-center gap-3 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="text-body">
                    <Skeleton variant="text" className={`${bredd} text-body`} />
                  </div>
                  <Skeleton variant="text" className="w-3/5 text-small" />
                  <Skeleton variant="text" className="w-2/5 text-caption" />
                </div>
                {/* Chevronens plats reserveras (18 px) utan att rita en
                    affordans till en rad som ännu inte finns. */}
                <span aria-hidden="true" className="size-[18px] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {searchField}
        <MessageBox intent="error" title="Kunde inte hämta personer">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>
    );
  }

  const total = persons.length;

  return (
    <div className="flex flex-col gap-4">
      {searchField}

      {/* Dold aria-live-region som annonserar antal nya rader vid "Ladda fler". */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* [PROTOTYPE] STEG 11 (k11) — TOMLÄGET.
          `Inga träffar för "zzz".` som en grå metarad är ingen upplevelse: den
          ser ut som om sidan gick sönder tyst. Strukturerat, centrerat tomläge
          i facitets form (EventsList.tsx:559-570): en bärande rad + en dämpad
          förklaring, `py-12` luft. Rollen `status`/`aria-live` FLYTTAR MED hit
          så beskedet fortfarande annonseras — annars vore tomläget tyst för en
          skärmläsare.

          Byggkrav: `persons-list.staging.test.ts:121` asserterar den gamla
          strängen ordagrant och migreras i samma landning (R3). */}
      {total === 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-1 py-12 text-center"
        >
          <p className="font-medium text-body">{q ? 'Inga träffar' : 'Inga personer ännu'}</p>
          <p className="text-small text-text-muted">
            {q
              ? `Ingen person matchar "${q}".`
              : 'Personer dyker upp här när någon anmäler sig eller lämnar sin e-post.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* [PROTOTYPE] STEG 9 (k09) — RÄKNAR-RADEN BLIR META.
              Placeringen: direkt ovanför kortet med kortets inner-inset
              (`px-4`) och `gap-2` till det — samma rytm som eventsidans
              grupprubriker (DetaljGrupp.tsx:26) och månadsrubrikerna
              (EventsList.tsx:575). Färg-trappan blir max tre steg
              (rubrik → meta → kortets text).

              Copyn: "laddade" är maskin-svenska (Gunilla-principen), och
              grammatikbuggen `1 person laddade` (PersonsList.tsx:164)
              försvinner genom konstruktion när verbet inte längre böjs efter
              antalet.

              VARNING till skarpt bygge (byggunderlagets R3): SJU
              e2e-assertions hänger i den gamla copyn
              (persons-list.staging.test.ts rad 88, 97, 104, 109, 114, 121,
              127 — rad 114 asserterar just buggen). De ska migreras i SAMMA
              landning, aldrig lämnas röda. Prototypen rör dem inte: e2e kör
              den skarpa vyn utan `?variant=`. */}
          <p
            ref={statusRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className="px-4 text-small text-text-muted"
          >
            {`Visar ${total} ${total === 1 ? 'person' : 'personer'}${q ? ` för "${q}"` : ''}${
              hasNextPage ? ' (fler finns)' : ''
            }.`}
          </p>

          {/* [PROTOTYPE] STEG 3 (k03) — KORTANATOMIN. Raden slutade vara ett
          `border-b`-fragment och blev en YTA.

          Defekten som revs: `border-b` bar ingen färgklass, och `tailwind.css:12`
          nollställer `--color-*` (Tailwind v4:s default blir currentColor) →
          avdelaren ritades i TEXTFÄRG. Det var den svarta linjen under varje
          rad i k01/k02.

          Formen är facitets kortgrammatik: rundad tonal yta, transparent kant
          som blir synlig under `prefers-contrast: more`, inner-inset px-4 =
          "där rundningen slutar" (DetaljGrupp.tsx:29-36).

          `<ul aria-label="Personer">` BEHÅLLS oförändrad — sex e2e-assertions
          hänger i `getByRole('list', { name: 'Personer' })` och strukturen ska
          överleva till skarpt bygge (byggunderlagets R4). */}
          <ul
            aria-label="Personer"
            className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
          >
            {persons.map((person) => {
              const contact = contactLine(person);
              return (
                // [PROTOTYPE] STEG 5 (k05) — HELA RADEN ÄR KLICKYTAN.
                // `relative` här + `after:absolute after:inset-0` på namnlänken:
                // EN länk, rent länknamn, hela raden träffbar (EventCard.tsx:186
                // + :200, NastaEventCard-precedenten; L303). Chevronen sitter
                // höger och är `aria-hidden` — etiketten bär namnet ensam
                // (§14-regeln efter rivningen 2026-07-21: chevron BETYDER att
                // raden leder vidare).
                <li
                  key={person.id}
                  onMouseEnter={() => varmDetalj(person.id)}
                  onFocusCapture={() => varmDetalj(person.id)}
                  className="relative flex items-center gap-3 py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* [PROTOTYPE] STEG 4 (k04) — METADATA-GRAMMATIKEN.
                    `·`-kedjan delas i tre nivåer med egen typografi: namnet
                    bär raden (`font-semibold text-body`, EventCard.tsx:200),
                    kontakten är dämpad följdinformation, och statusen bärs av
                    PILLAR i stället för fältetiketter.

                    HÄR SYNS DEFEKT M4: `harAktivAnmalan` är en formel som ger
                    "Aktiv" ELLER "Ingen aktiv anmälan" — den är ALDRIG falsy.
                    Dagens truthiness-gren (PersonsList.tsx:189) renderar därför
                    bokstavligen "Aktiv anmälan: Ingen aktiv anmälan" (syns i
                    k01–k03). Pillen jämför mot STRÄNGVÄRDET och tiger när det
                    inte finns någon aktiv anmälan — tystnad är rätt besked. */}
                    <Link
                      to="/personer/$personId"
                      params={{ personId: person.id }}
                      className="font-semibold text-body underline-offset-2 after:absolute after:inset-0 hover:underline"
                    >
                      {displayName(person)}
                    </Link>
                    {contact && <span className="text-small text-text-muted">{contact}</span>}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {person.erfarenhetsbadge && <Pill>{person.erfarenhetsbadge}</Pill>}
                      {person.harAktivAnmalan === 'Aktiv' && <Pill ton="aktiv">Aktiv anmälan</Pill>}
                      <span className="text-caption text-text-muted tabular-nums">
                        {anmalningarText(person.antalAnmalningar)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-text-secondary"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* [PROTOTYPE] STEG 10 (k10) — "LADDA FLER" SOM KAPSEL.
          Formen är väljarnas mjuka kapsel (EventsList.tsx:464) i stället för
          primitivens `secondary md` — spec §19: solid fyllnad hör inte hemma
          i/under en kortyta, och en sekundär rad-handling bär text + mjuk ton.

          STABILT TILLGÄNGLIGT NAMN: dagens label-växling `Laddar…`/`Ladda fler`
          (PersonsList.tsx:211) BYTER namn på ett element som behåller fokus →
          skärmläsaren omannonserar knappen mitt i handlingen. Namnet står nu
          still; laddningen bärs av `aria-busy` + dämpningen. Fokus-behållningen
          (raderna 103-105) är oförändrad — den är hela skälet till att knappen
          finns i stället för oändlig scroll. */}
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
    </div>
  );
}
