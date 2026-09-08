import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { EdgeFunctionError } from '@/data/config/EdgeFunctionError';
import { useDataSource } from '@/data/useDataSource';
import type { InbetalningarBatch, Inbetalningslista, OppnaBetalningar } from '@/domain/schemas';
import { betalningarPa } from '@/lib/funktionsflaggor';
import { queryKeys } from '@/queries/keys';

/**
 * [TASK-346.7.1] Husets etablerade EdgeFunctionError-medvetna retry-policy —
 * SAMMA lambda-form som `PersonDetail.tsx`/`EventDetail.tsx`/
 * `EventRegistrations.tsx` m.fl. redan bär, kopierad hit i stället för
 * abstraherad: majoriteten av husets EF-backade queries duplicerar denna
 * exakta form inline (`useDashboardData.ts`s lokala `noRetryOn4xx` är
 * undantaget, inte normen), och att extrahera en delad export här hade varit
 * att uppfinna ett fjärde mönster där tre redan finns.
 *
 * UTAN denna rad ärvde de tre hookarna nedan routerns naiva globala
 * `retry: 3` (router.ts) — som retryar BLINT även på 4xx (ett fel Lotta
 * aldrig kan läka genom att vänta). Fynd: `TASK-346.7.1`, orkestrerarens
 * S113-slutvandring 2026-08-31 (persondetalj `rec2JwV3Bh0x5qlvl`,
 * `hamta-inbetalningar` 500, felläget syntes aldrig inom 14+ s).
 */
const husetsRetryPolicy = (failureCount: number, err: Error): boolean =>
  !(err instanceof EdgeFunctionError && err.status >= 400 && err.status < 500) && failureCount < 3;

/**
 * [TASK-346.7] Läsningarna som de FYRA ytorna utanför inkorgen delar:
 * Hem-kortet, Åtgärds-panelen, anmälans detaljvy och personkortet.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `refetchOnMount: 'always'` PÅ BÅDA, AV SAMMA MÄTTA SKÄL
 * ═══════════════════════════════════════════════════════════════════════════
 * Routerns globala `staleTime` är 5 minuter och hela cachen persistas i 24
 * timmar (`src/router.ts`, ADR-072). Utan raden serveras en betalningsyta
 * HELT ur den persisterade cachen när Lotta öppnar appen igen inom fönstret.
 *
 * Det är inte en teoretisk risk: acceptansvandringen 2026-08-31 (TASK-346.6)
 * mätte att inkorgen visade gamla belopp efter att inbetalningar makulerats -
 * "Saknas 1 500 kr" på en rad där 2 500 saknades. Ett saldo som Lotta
 * registrerar MOT måste vara läst nu, inte för fem minuter sedan.
 *
 * `'always'` OCH INTE `staleTime: 0`: den senare hade gjort varje
 * fönsterfokus till en omhämtning (`refetchOnWindowFocus: true` globalt),
 * alltså en tyst pollare. Denna form hämtar om vid MONTERING och överlåter
 * löpande färskhet åt Realtime (`JobbLyssnare`), som är den mekanism som ska
 * bära den.
 *
 * [TASK-442, ÄRLIGHETSNOT] Raden bär de ytor som monterar sin observer
 * PÅSLAGEN (inkorgen, personkortet, anmälans detaljvy). För eventdetaljens
 * `aktiv`-gatade par är den en NO-OP, och var det redan före förvärmningen:
 * observern monterar med `enabled: false`, och `shouldFetchOnMount` (den enda
 * väg `refetchOnMount` läses) prövas bara på en OMONTERAD observer OCH kräver
 * `enabled !== false` i båda sina led. När `aktiv` sedan slår om är observern
 * redan monterad, så vägen dit går via `shouldFetchOptionally`, som läser
 * `staleTime` — aldrig `refetchOnMount`. Källäst i `@tanstack/query-core`
 * 5.102.2, `build/modern/queryObserver.js`. Raden STÅR KVAR (TASK-442
 * beslut C: läsvägen rörs inte) — den är sann där den har verkan, och att
 * riva den för de andra tre ytornas skull hade varit en annan skiva.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `aktiv` TRÅDAS IN, DEN LÄSES INTE HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * Miljöflaggan gatar hämtningen via React Querys `enabled`, aldrig via ett
 * tidigt `return` hos anroparen: hooks-reglerna förbjuder villkorade
 * hook-anrop. Samma form `useJobbstatus` redan bär.
 *
 * [TASK-442, RÄTTELSE av en preexisterande rad — ADR-083] Här stod tidigare
 * att skälet var "i prod finns varken migrationerna eller de deployade
 * funktionerna ännu (ADR-129 § Negativa och skuld), så ett anrop hade fått
 * 404". Det var sant när ADR-129 skrevs och är FALSKT i dag: samtliga 57
 * EF:er ligger i prod (`TASK-385`, 2026-09-05; omdeployade 2026-09-08
 * 04:28–04:32Z), `TASK-367`:s migration är körd (2026-09-06), och flaggan
 * `VITE_FEATURE_BETALNINGAR` är PÅ i prod via Vercels miljövariabler (mätt i
 * prod-bundeln vid `29a3c16d`, S123). Formen är alltså riktig av det första
 * skälet ensamt (hooks-reglerna); 404-motiveringen är historik och får inte
 * läsas som nuläge. Rättad här i stället för lämnad, eftersom TASK-442 skrev
 * om resten av denna fils docblockar för just den ärligheten och en känt
 * falsk rad kvar i samma fil hade varit sämre än ingen rad alls.
 */

/** Alla öppna betalningar över alla event. Delas av Hem, panelen och ytorna. */
export function useOppnaBetalningar(aktiv = true) {
  const dataSource = useDataSource();
  return useQuery<OppnaBetalningar>({
    queryKey: queryKeys.betalningar.oppna,
    queryFn: () => dataSource.fetchOppnaBetalningar(),
    enabled: aktiv,
    refetchOnMount: 'always',
    retry: husetsRetryPolicy,
  });
}

/**
 * Inbetalningarna och kvittona för EN anmälan.
 *
 * HÄMTNINGEN ÄR LAT MED AVSIKT. Åtgärds-panelen kan visa tjugo personer, och
 * en läsning per person vid öppning hade blivit tjugo Edge Function-anrop -
 * var och en med en Airtable-läsning i sig, mot ett tak som DELAS med Lottas
 * egna klick och automationerna A1-A11 (ADR-063 § S91-not). Anroparen sätter
 * `aktiv` först när raden faktiskt fälls ut.
 */
export function useInbetalningarPerAnmalan(anmalanRecordId: string, aktiv: boolean) {
  const dataSource = useDataSource();
  return useQuery<Inbetalningslista>({
    queryKey: queryKeys.betalningar.perAnmalan(anmalanRecordId),
    queryFn: () => dataSource.fetchInbetalningar({ anmalanRecordId }),
    enabled: aktiv,
    refetchOnMount: 'always',
    retry: husetsRetryPolicy,
  });
}

/**
 * Personens inbetalningar över ALLA anmälningar (PRD berättelse 24).
 *
 * EF:en löser person till anmälningar server-side, så personkortet behöver
 * inte känna sina egna anmälnings-ID:n för DENNA läsning - bara för urvalet
 * av öppna betalningar (`personOversikt`, `panel-harledningar.ts`).
 */
export function useInbetalningarPerPerson(personId: string, aktiv: boolean) {
  const dataSource = useDataSource();
  return useQuery<Inbetalningslista>({
    queryKey: queryKeys.betalningar.perPerson(personId),
    queryFn: () => dataSource.fetchInbetalningar({ personId }),
    enabled: aktiv,
    refetchOnMount: 'always',
    retry: husetsRetryPolicy,
  });
}

/**
 * [TASK-437] ALLA inbetalningar för ETT HELT EVENTS anmälningar, i ETT anrop
 * (eventdetaljens logg). Klienten skickar batchen av anmälnings-record-ID:n
 * den redan känner (`useRegistrations`/eventvyn) — EF:en gör INGEN Airtable-
 * uppslagning, till skillnad från `useInbetalningarPerAnmalan` ovan, som är
 * EN läsning PER anmälan (rätt val där raden fälls ut lat, fel val för en
 * hel logg som visar allt på en gång).
 *
 * `enabled` kräver BÅDE `aktiv` och en icke-tom lista: en tom batch behöver
 * inget nätverksanrop — EF:en hade ändå svarat `{ grupper: [] }`.
 *
 * `spegel` ingår INTE per grupp i svaret — se `InbetalningarBatchGruppSchema`
 * (`Betalningar.schema.ts`) för skälet.
 */
export function useInbetalningarForEvent(
  eventId: string,
  anmalanRecordIds: string[],
  aktiv: boolean,
) {
  const dataSource = useDataSource();
  return useQuery<InbetalningarBatch>({
    queryKey: queryKeys.betalningar.perEvent(eventId, anmalanRecordIds),
    queryFn: () => dataSource.fetchInbetalningarBatch({ anmalanRecordIds }),
    enabled: aktiv && anmalanRecordIds.length > 0,
    refetchOnMount: 'always',
    retry: husetsRetryPolicy,
  });
}

/**
 * [TASK-442] FÖRVÄRMNINGEN av eventdetaljens "Öppna detaljer" (ADR-078
 * beslut 3, förvärmningsdoktrinen). Marcus 2026-09-08 (S124 resume 1), efter
 * ögonmätning av TASK-438: "inbetalningsraderna kommer förvärmas när man går
 * in på eventdetalj-sidan eller något sådant eller? Så man inte behöver vänta
 * på att de laddas när man öppnar detaljerna?" och, på rekommendationen:
 * "Kör på din rek, gör det branschledarmässigt och ordentligt!!"
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD DEN VÄRMER, OCH VARFÖR EXAKT DESSA TVÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * `BetalningsDetaljer` (`events/detail/Betalningar.tsx`) ställer BÅDA
 * frågorna nedan först när Lotta fällt ut disclosuren (`aktiv`), och båda
 * kostar ett Edge Function-anrop var. Callbacken ställer SAMMA två frågor i
 * förväg, med SAMMA nycklar och SAMMA queryFn som `useOppnaBetalningar` och
 * `useInbetalningarForEvent` ovan. Två cache-poster för samma data hade varit
 * det enda sättet att göra saken värre än att inte förvärma alls, så
 * nyckel-identiteten är inte en konvention här: `queryKeys.betalningar
 * .perEvent` NORMALISERAR id-ordningen själv (`[...ids].sort()`), så
 * anroparens sortering kan inte skapa en andra post ens om den avviker.
 *
 * INGEN EGEN `staleTime` (till skillnad från husets avsikts-prefetchar
 * `useForberedAtgardsBilagor`/`EventCard.tsx`, som sätter 30 s): värdet ärvs
 * från routerns globala 5 minuter (`src/router.ts`), vilket är EXAKT samma
 * tröskel observern själv använder när `aktiv` slår om. Symmetrin är
 * poängen. Källäst i `@tanstack/query-core` 5.102.2 (installerad version,
 * `build/modern/queryObserver.js`): en `enabled`-flip på en REDAN MONTERAD
 * observer går via `setOptions` → `shouldFetchOptionally(query, prevQuery,
 * options, prevOptions)`, vars sista led är `isStale(query, options)` =
 * `query.isStaleByTime(resolveStaleTime(options.staleTime, query))`. Hoppade
 * prefetchen över hämtningen (datan färsk nog) gör alltså observern det
 * också, och öppningen kostar noll anrop. En egen kortare `staleTime` hade
 * betalat ett extra anrop i just det ögonblick Lotta klickar, mot ett
 * Airtable-tak som delas med hennes egna klick och automationerna
 * (`ADR-063` § S91-not) — precis den kostnadssida doktrinens § Dom väger.
 * Samma val som `EventDetail.tsx`s `varmNarvaro` (TASK-416.16) redan gjorde
 * för sin mount-prefetch.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * GATINGEN BOR HÄR, INTE HOS ANROPARNA
 * ═══════════════════════════════════════════════════════════════════════════
 * Två anropsplatser delar callbacken (sidmontering och avsikt,
 * `Deltagare.tsx`s `ArbetsKo`), och en gating som bara den ena bar hade varit
 * en regel som kan glömmas. Därför:
 *
 *   1. `betalningarPa()` — miljöflaggan (`lib/funktionsflaggor.ts`).
 *      **Flaggan är PÅ i prod**, satt i Vercels miljövariabler och därför
 *      osynlig i `.env.production` (mätt i prod-bundeln vid `29a3c16d`,
 *      S123; bekräftat S124: "flaggan `VITE_FEATURE_BETALNINGAR` är PÅ i
 *      prod via Vercel"). Förvärmningen KÖRS alltså i prod — det är hela
 *      poängen med denna skiva. Raden är därmed ingen prod-spärr utan två
 *      andra saker: den håller fixturklasserna rena (acceptance-, visual-
 *      och webblasarbeteende-webServern byggs med
 *      `VITE_FEATURE_BETALNINGAR: 'av'`, `playwright.config.ts`), och den är
 *      en vakt för det fall flaggan någon gång stängs igen.
 *
 *      HISTORIK, inte nuläge: `ADR-129` § Negativa och skuld beskriver ett
 *      läge där prod saknade migrationerna och EF:erna, så att ett anrop
 *      hade fått 404. Så var det när ADR:n skrevs. I dag ligger samtliga 57
 *      EF:er i prod (`TASK-385`, 2026-09-05; omdeployade 2026-09-08
 *      04:28–04:32Z) och `TASK-367`:s migration är körd (2026-09-06). Läs
 *      aldrig den ADR-raden som en beskrivning av dagens prod.
 *
 *      ASYMMETRIN MOT RENDERINGEN står kvar och bokförs öppet:
 *      `Deltagare.tsx` monterar `DetaljRad`/`BetalningsDetaljer`
 *      OVILLKORLIGT (bara `aktiva.length > 0` gatar dem, TASK-145.4 AC #2),
 *      alltså utan flaggan. Med flaggan PÅ i prod är de två vägarna i fas
 *      där det räknas; skulle flaggan stängas av skulle knappen finnas kvar
 *      medan förvärmningen tystnade, och klicket falla tillbaka på den lata
 *      hämtningen. Att i stället flagg-gata renderingen är ett eget beslut
 *      om en yta denna skiva inte äger (TASK-442 § F: minimalt scope), inte
 *      något som ska smygas in via en prefetch.
 *   2. Tom id-lista — EF:en hade svarat `{ grupper: [] }` och batch-frågan är
 *      ändå avstängd i det läget (`enabled` ovan). Inkorgsfrågan värms inte
 *      heller: utan anmälningar finns ingen betalningsyta att öppna.
 *
 * Listan är anroparens `aktiva` (`lib/aktiv-anmalan.ts`), samma mängd
 * `BetalningsDetaljer` får som prop — aldrig de avbokade, som inte har någon
 * rad i arbetsytan att vänta på.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KOSTNADEN, RÄKNAD ÖPPET (doktrinens § Dom: ETT event, inte alla)
 * ═══════════════════════════════════════════════════════════════════════════
 * Ett eventsidbesök betalar hädanefter ETT batch-anrop (`hamta-inbetalningar`
 * POST, hela eventets anmälningar i en begäran sedan TASK-437) plus det
 * DELADE inkorgsanropet (`hamta-oppna-betalningar`, samma nyckel som
 * inkorgen/personkortet/anmälans detaljvy — redan varmt om Lotta passerat
 * någon av dem inom fönstret; det ingår INTE i startvärmningens sju
 * datamängder, `data/warmup/startvarmningen.ts`, så första besöket i en
 * session betalar det). Kostnaden är proportionerlig mot vad Lotta FAKTISKT
 * gör — hon har öppnat DET eventet — aldrig mot eventregistrets bredd. Det
 * är precis den distinktion `docs/research/forvarma-allt-branschmonster-
 * 2026-09-06.md` § 5(b) punkt 2–3 drar, och § Dom avvisar motsatsen
 * ("förvärm allt") på vår egen bas: 7–8× den kvitterade väntebudgeten redan
 * vid 57 event.
 *
 * `prefetchQuery`, ALDRIG `ensureQueryData` (doktrinens § 5(b) punkt 4,
 * ADR-078 beslut 1): fire-and-forget, ingen loader, ingenting som kan
 * blockera navigeringen. Ett misslyckat förvärmningsanrop är osynligt — den
 * riktiga hämtningen sker då vid klick precis som före denna skiva, med
 * `BetalningsDetaljer`s egna skelett och felrutor.
 *
 * `retry: husetsRetryPolicy` PÅ BÅDA, av exakt samma skäl som hookarna ovan
 * bär den (TASK-346.7.1): `prefetchQuery` ärver annars routerns naiva globala
 * `retry: 3` (`src/router.ts`), som retryar BLINT även på 4xx — tre extra
 * anrop mot det delade taket för ett fel som aldrig kan läka av att man
 * väntar, och det i en väg Lotta inte ens bett om. En förvärmning som
 * misslyckas ska misslyckas tyst och EN gång.
 */
export function useForberedEventBetalningar(): (
  eventId: string,
  anmalanRecordIds: readonly string[],
) => void {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  return useCallback(
    (eventId: string, anmalanRecordIds: readonly string[]) => {
      if (!betalningarPa() || anmalanRecordIds.length === 0) return;
      // Kopian skyddar mot att anroparens array muteras efter anropet:
      // queryFn:ns payload läses först när hämtningen faktiskt körs.
      const ids = [...anmalanRecordIds];
      queryClient.prefetchQuery({
        queryKey: queryKeys.betalningar.oppna,
        queryFn: () => dataSource.fetchOppnaBetalningar(),
        retry: husetsRetryPolicy,
      });
      queryClient.prefetchQuery({
        queryKey: queryKeys.betalningar.perEvent(eventId, ids),
        queryFn: () => dataSource.fetchInbetalningarBatch({ anmalanRecordIds: ids }),
        retry: husetsRetryPolicy,
      });
    },
    [dataSource, queryClient],
  );
}
