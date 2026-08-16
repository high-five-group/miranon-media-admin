import type { QueryClient } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';
import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';
import { HEM_SENASTE_AKTIVITET_ANTAL, queryKeys } from '@/queries/keys';

/**
 * Startvärmningsmotorn (TASK-218.1, ADR-112, ORDLISTA.md "Startvärmningen").
 *
 * Ren modul, ingen UI — Förberedelseskärmen (TASK-218.2) och gate-
 * integrationen (TASK-218.3) bygger ovanpå kontraktet `starta()` exponerar
 * här. Körs EN gång per auth-resolution (ADR-112 beslut 5), triggad av
 * `InnerApp` (`src/main.tsx`) EFTER både `auth.isLoading === false` och
 * `PersistQueryClientProvider`s `onSuccess` — den ordningen ägs av 218.3,
 * inte av denna modul.
 *
 * `dataSource` är ett OBLIGATORISKT injicerat beroende (`starta(qc,
 * { dataSource })`), INTE ett modul-scope statiskt importerat singleton —
 * en MEDVETEN avvikelse från research-passets skiss (som föreslog statisk
 * import inuti warmup-modulen, med `router.ts` som precedent). Skälet är
 * konkret, inte stilistiskt: `src/data/dataSource.ts` importerar
 * `AirtableAdapter` → `src/data/config/supabase-client.ts` → `src/env.ts`,
 * som läser `import.meta.env` vid modul-load. `tests/`-projektets egna
 * `tsconfig.tests.json` sätter medvetet `"types": ["node"]` (etablerat
 * TASK-201.3, se den filens kommentar) — INGEN `vite/client`-typning. En
 * hermetisk test (AC #4) som importerar denna modul hade därför transitivt
 * dragit in `src/env.ts` i TESTS-projektets typkontroll och fällt
 * `TS2339: Property 'env' does not exist on type 'ImportMeta'` — mätt
 * konkret vid bygget (`npm run typecheck`), inte en teoretisk risk.
 * Lösningen speglar `src/data/activityLog/recordActivity.ts`s ETABLERADE
 * DI-mönster (obligatorisk `dataSource`+`queryClient`, motiverat där som
 * "typkontrollen blir grinden") snarare än `router.ts`s statiska import.
 * `router.ts`/`main.tsx`-lagret (TASK-218.3s ingreppspunkt) importerar
 * fortfarande `dataSource` STATISKT precis som idag och skickar den in —
 * den "kör före router-context"-verkligheten research-passet identifierade
 * är alltjämt sann, den statiska importen bor bara ETT STEG UPPÅT (hos
 * anroparen, inte inuti denna ren-modul). Se TASK-218.1s slutrapport för
 * den fullständiga motiveringen av avvikelsen från uppdragets skiss.
 * `isOnline`/`timeoutMs` förblir valfria med produktionsdefaults —
 * samma seam-mönster som `supabase/functions/_shared/airtable-retry.ts`s
 * injicerbara `sleep`.
 *
 * ## Skyddsräckena (ADR-112 beslut 3, research § 5.3/5.5)
 *
 * 1. **Online-gate FÖRE start.** En `ensureQueryData`-promise för en query
 *    UTAN cachad data under `networkMode: 'online'` (global default,
 *    `src/router.ts`) resolvar ALDRIG offline — den pausar för evigt
 *    (`fetchStatus: 'paused'`, verifierat mot TanStack Query-källkoden,
 *    `retryer.ts` `canStart()` → `pause().then(run)`). Är enheten offline
 *    VID START görs därför NOLL `ensureQueryData`-anrop — inte ens ett
 *    startat och sedan avbrutet. Släppet sker direkt, synkront i samma
 *    mikrotask-kedja.
 * 2. **Hård timeout (8–10 s).** Täcker BÅDE en seg men online Airtable-
 *    kallstart OCH enheten som blir offline MITT I en redan startad
 *    startvärmning (samma mekanism löser båda — se ADR-112 beslut 3).
 *    Släpper med delresultatet (`klara` vid timeout-ögonblicket); de
 *    pågående hämtningarna avbryts INTE (inget `AbortController`) — de får
 *    landa i cachen som vanligt om/när de settlar, men `slutlöfte` väntar
 *    inte in dem.
 * 3. **`slutlöfte` kastar ALDRIG.** `Promise.allSettled` fångar varje
 *    enskild hämtnings fel — en trasig datamängd sänker aldrig hela
 *    startvärmningen (samma fire-and-forget-anda som
 *    `src/data/activityLog/recordActivity.ts`, fast för LÄSNING i stället
 *    för skrivning).
 *
 * ## Hämta en gång, dela (ADR-112 beslut 4)
 *
 * `src/queries/keys.ts` rad 124–134 dokumenterar MEDVETET dubblerade
 * globala nycklar för identisk data: `dashboard.events`/`dashboard.
 * registrations` (Hem-kortens 60s-poll-scope, ADR-017) pekar på samma
 * underliggande `dataSource.fetchEvents()`/`fetchRegistrations()`-anrop som
 * `events.list`/`registrations.all` (list-vyerna). PAYLOAD-IDENTITETEN är
 * verifierad statiskt, inte antagen: `src/components/events/EventsList.tsx`
 * rad 197 och `src/components/hem/useDashboardData.ts` rad 71 anropar BÅDA
 * `dataSource.fetchEvents()` UTAN argument; `src/components/registrations/
 * AnmalningarList.tsx` rad 50 och `useDashboardData.ts` rad 60 anropar BÅDA
 * `dataSource.fetchRegistrations()` UTAN argument. Ingen av de fyra
 * anropsplatserna skickar ett filter-argument — payloaden kan därför inte
 * divergera (samma nollställda funktionssignatur, inget att divergera
 * PÅ), inte bara "sannolikt samma". Öppen fallback till dubbelhämtning
 * (ADR-112 beslut 4:s reträttväg) behövs alltså INTE för dessa två par —
 * bokfört öppet i TASK-218.1s notes i stället för en tyst gissning.
 *
 * Konsekvens: warmup-motorn hämtar events/registrations EN gång mot
 * list-nyckelfamiljen (`events.list`/`registrations.all` — global
 * `staleTime` 5 min, INGEN dashboard-specifik 30s-poll-staleTime) via
 * `ensureQueryData`, och SEEDAR resultatet in i systernyckeln
 * (`dashboard.events`/`dashboard.registrations`) via `setQueryData`.
 * ADR-017:s poll-SCOPE (vilken nyckel som pollar) är helt orört — bara
 * cache-INNEHÅLLET delas, inte poll-konfigurationen.
 *
 * Övriga fem datamängder (waitlist/intresserade/maillog/segment/
 * activityLog) har bara EN nyckelfamilj var — ingen delning behövs, bara
 * en enkel `ensureQueryData` per nyckel.
 *
 * ## Rate-limit-respekterande sekvensering (research § 5.1/§ 6)
 *
 * Airtables 5 req/s/bas-tak är DELAT mellan alla samtidiga klienter och
 * OKÖAT hos oss (`docs/reference/airtable-constraints.md` § P4) — sju
 * anrop i ett naket `Promise.all` riskerar att träffa taket redan vid EN
 * användares kallstart, med ett straff (30–60 s lockout) som är mycket
 * dyrare än vinsten. Batchas därför i grupper om `BATCH_SIZE` (2) med
 * `await` mellan grupperna.
 */

/** Se § "Hård timeout" ovan — mittpunkt av ADR-112:s 8–10 s-fönster. */
const DEFAULT_TIMEOUT_MS = 9000;

/** Se § "Rate-limit-respekterande sekvensering" ovan. */
const BATCH_SIZE = 2;

/**
 * Hem-spaltens "Senaste aktivitet" (`src/components/hem/SenasteAktivitet.tsx`)
 * läser `queryKeys.activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL)` — INTE
 * hookens egen default (`LATEST_DEFAULT_LIMIT = 5` i
 * `src/data/queries/useActivityLog.ts`). `limit` är DEL av query-nyckeln
 * (`['activityLog', 'latest', limit]`), så en warmup-seedning med fel tal
 * skriver en cache-post ingen konsument någonsin läser — teknisk framgång,
 * noll faktisk nytta för just den kortkomponenten.
 *
 * TIDIGARE (TASK-218.1) var talet HÅRDKODAT och speglat härifrån, med en
 * bokförd ÖPPEN kopplingsrisk: ändrades komponentens egen konstant utan att
 * detta tal följde med, seedade warmup fel nyckel utan att något test fångade
 * det. TASK-218.3 LÖSER driften: `HEM_SENASTE_AKTIVITET_ANTAL` exporteras nu
 * från `@/queries/keys` (datalagret, INTE komponenten — motorn får aldrig
 * importera UI) och BÅDA konsumenterna importerar samma export.
 */

/** Se filhuvudets § "Äkta settled-räkning". */
export interface StartvarmningForlopp {
  klara: number;
  totalt: number;
}

/**
 * `klar` — samtliga datamängder settlade (var för sig lyckade eller
 * misslyckade, se `Promise.allSettled`) inom tidsfönstret.
 * `offline` — enheten var offline VID START; noll hämtningar startades.
 * `timeout` — hård timeout löste ut innan alla datamängder settlat;
 * `forlopp.klara` bär hur många som hann bli klara.
 */
export type StartvarmningUtfall = 'klar' | 'offline' | 'timeout';

export interface StartvarmningResultat {
  utfall: StartvarmningUtfall;
  forlopp: StartvarmningForlopp;
}

export interface StartvarmningHandle {
  /**
   * Prenumerera på förloppsuppdateringar. Lyssnaren får ett OMEDELBART
   * snapshot vid prenumereringen (så en sent monterad konsument aldrig
   * behöver vänta in nästa settle för att veta var startvärmningen står),
   * därefter en uppdatering per faktiskt query-avslut. Returnerar en
   * avprenumereringsfunktion.
   */
  forloppsprenumeration(lyssnare: (forlopp: StartvarmningForlopp) => void): () => void;
  /**
   * Resolvar EXAKT en gång, ALDRIG `rejected` — se filhuvudets § "Hård
   * timeout"/"slutlöfte kastar aldrig".
   */
  slutlofte: Promise<StartvarmningResultat>;
}

/** `dataSource` OBLIGATORISK — se filhuvudets § om varför (hermetisk
 * testbarhet, AC #4). `isOnline`/`timeoutMs` valfria med produktionsdefaults. */
export interface StartvarmningBeroenden {
  dataSource: DataSourceAdapter;
  /** Default: `onlineManager.isOnline()` (samma källa som `OfflineIndicator.tsx`). */
  isOnline?: () => boolean;
  /** Default: `DEFAULT_TIMEOUT_MS` (9000). Tester sätter ett litet värde. */
  timeoutMs?: number;
}

interface WarmupItemContext {
  qc: QueryClient;
  ds: DataSourceAdapter;
}

interface WarmupItem {
  /** Diagnostik-etikett — aldrig användarvänd text. */
  namn: string;
  kor(ctx: WarmupItemContext): Promise<void>;
}

/**
 * Warmup-setet (research § 6-tabellen, sju kärn-EF:er). Medvetet exkluderat:
 * `persons.search` (parametriserad på söktext, ingen naturlig "kärn"-fråga)
 * och alla `detail`/`byEvent`-grenar (per-post, samma resonemang som
 * ADR-078 avvisade för registrerings-detaljer).
 */
const WARMUP_ITEMS: WarmupItem[] = [
  {
    namn: 'events',
    async kor({ qc, ds }) {
      const events = await qc.ensureQueryData({
        queryKey: queryKeys.events.list,
        queryFn: () => ds.fetchEvents(),
        revalidateIfStale: true,
      });
      // Hämta en gång, dela (ADR-112 beslut 4) — se filhuvudet.
      qc.setQueryData(queryKeys.dashboard.events, events);
    },
  },
  {
    namn: 'registrations',
    async kor({ qc, ds }) {
      const registrations = await qc.ensureQueryData({
        queryKey: queryKeys.registrations.all,
        queryFn: () => ds.fetchRegistrations(),
        revalidateIfStale: true,
      });
      qc.setQueryData(queryKeys.dashboard.registrations, registrations);
    },
  },
  {
    namn: 'waitlist',
    async kor({ qc, ds }) {
      await qc.ensureQueryData({
        queryKey: queryKeys.waitlist.all,
        queryFn: () => ds.fetchWaitlist(),
        revalidateIfStale: true,
      });
    },
  },
  {
    namn: 'intresserade',
    async kor({ qc, ds }) {
      await qc.ensureQueryData({
        queryKey: queryKeys.intresserade.all,
        queryFn: () => ds.fetchIntresserade(),
        revalidateIfStale: true,
      });
    },
  },
  {
    namn: 'maillog',
    async kor({ qc, ds }) {
      await qc.ensureQueryData({
        queryKey: queryKeys.maillog.all,
        queryFn: () => ds.fetchMailLog(),
        revalidateIfStale: true,
      });
    },
  },
  {
    namn: 'segment',
    async kor({ qc, ds }) {
      await qc.ensureQueryData({
        queryKey: queryKeys.segment.saved,
        queryFn: () => ds.listSegments(),
        revalidateIfStale: true,
      });
    },
  },
  {
    namn: 'activityLog',
    async kor({ qc, ds }) {
      await qc.ensureQueryData({
        queryKey: queryKeys.activityLog.latest(HEM_SENASTE_AKTIVITET_ANTAL),
        queryFn: () => ds.fetchActivityLog({ pageSize: HEM_SENASTE_AKTIVITET_ANTAL }),
        revalidateIfStale: true,
      });
    },
  },
];

/**
 * Varm/kall-avgörandet (ADR-112 beslut 5): en icke-tom query-cache räknas
 * som varm — restore ÅTERSTÄLLDE faktisk data ELLER en tidigare gate redan
 * hann varma den. EXPORTERAD (TASK-227) så BÅDA ingångspunkterna delar
 * exakt samma predikat i stället för två divergerbara kopior:
 * `InnerApp` (`src/main.tsx`, kall APPSTART med befintlig session, TASK-218.3)
 * och app-yta-gaten (`src/routes/_authenticated.tsx`, aktiv inloggning på en
 * redan monterad router, TASK-227). Ren läsning, inget tillstånd — ett andra
 * anrop mot samma `qc` är alltid billigt och side-effect-fritt.
 */
export function arCacheVarm(qc: QueryClient): boolean {
  return qc.getQueryCache().getAll().length > 0;
}

/** sessionStorage-nyckeln {@link lasVarmningTimeoutOverride} läser. Egen
 * konstant (inte inline-strängad på båda anropsställena) så nyckeln inte
 * kan glida isär mellan skrivaren (Playwright-testerna) och läsaren. */
const E2E_TIMEOUT_OVERRIDE_NYCKEL = 'e2eVarmningTimeoutMs';

/**
 * TASK-236 varv 2 — per-sidladdnings timeoutMs-override för startvärmningen,
 * läst från `sessionStorage` (satt via Playwrights `page.addInitScript()`
 * i enskilda tester som vill OBSERVERA riktig warmup-progression, t.ex.
 * `persist-cache.staging.test.ts`:s Kallstart- och TASK-227-block).
 *
 * `sessionStorage` i stället för en URL-query-param: DELAT predikat
 * (samma skäl som `arCacheVarm` ovan) mellan BÅDA `starta()`-anropsställena
 * — `main.tsx`:s bootgate (kör vid en fräsch sidladdning, URL:en är
 * testets egen `page.goto()`-mål) och `_authenticated.tsx`:s app-yta-gate
 * (TASK-227, kör efter en KLIENT-SIDES omdirigering post-login, där
 * `window.location` redan hunnit bli destinations-URL:en — en query-param
 * satt på `/login` hade tappats i den redirecten). `sessionStorage`
 * överlever klient-sides navigation inom samma flik oavsett URL, så samma
 * mekanism täcker båda ingångspunkterna utan att de behöver känna till
 * VARFÖR läsplatsen skiljer sig.
 *
 * `try/catch`: sessionStorage kan kasta i låst/privat browserläge — en
 * startvärmning ska ALDRIG krascha appen för en diagnostik-läsning.
 */
export function lasVarmningTimeoutOverride(): number | undefined {
  try {
    const rått = sessionStorage.getItem(E2E_TIMEOUT_OVERRIDE_NYCKEL);
    if (rått === null) return undefined;
    const parsed = Number(rått);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Startar startvärmningen. Se filhuvudet för hela kontraktet.
 *
 * @param qc Query-clienten samtliga hämtningar seedas till.
 * @param beroenden `{ dataSource }` obligatoriskt (anroparen — TASK-218.3s
 *   `InnerApp`-integration — importerar den riktiga singletonen statiskt
 *   från `@/data/dataSource`, samma sätt `src/router.ts` redan gör);
 *   `isOnline`/`timeoutMs` valfria, se `StartvarmningBeroenden`.
 */
export function starta(qc: QueryClient, beroenden: StartvarmningBeroenden): StartvarmningHandle {
  const ds = beroenden.dataSource;
  const isOnline = beroenden.isOnline ?? (() => onlineManager.isOnline());
  const timeoutMs = beroenden.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const totalt = WARMUP_ITEMS.length;
  let klara = 0;
  const lyssnare = new Set<(forlopp: StartvarmningForlopp) => void>();

  function emit(): void {
    const snapshot: StartvarmningForlopp = { klara, totalt };
    for (const l of lyssnare) l(snapshot);
  }

  function forloppsprenumeration(lyssnarFn: (forlopp: StartvarmningForlopp) => void): () => void {
    lyssnare.add(lyssnarFn);
    lyssnarFn({ klara, totalt }); // omedelbart snapshot, se JSDoc ovan
    return () => {
      lyssnare.delete(lyssnarFn);
    };
  }

  // Online-gate FÖRE start (AC #2, ADR-112 beslut 3, research § 5.3) — NOLL
  // startade hämtningar om enheten är offline vid startvärmningens start.
  if (!isOnline()) {
    const resultat: StartvarmningResultat = {
      utfall: 'offline',
      forlopp: { klara: 0, totalt },
    };
    return { forloppsprenumeration, slutlofte: Promise.resolve(resultat) };
  }

  async function korAlla(): Promise<void> {
    for (let i = 0; i < WARMUP_ITEMS.length; i += BATCH_SIZE) {
      const batch = WARMUP_ITEMS.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((item) =>
          item.kor({ qc, ds }).finally(() => {
            klara += 1;
            emit();
          }),
        ),
      );
    }
  }

  const slutlofte = new Promise<StartvarmningResultat>((resolve) => {
    let avgjort = false;
    const avgorMed = (utfall: StartvarmningUtfall): void => {
      if (avgjort) return;
      avgjort = true;
      resolve({ utfall, forlopp: { klara, totalt } });
    };

    const timer = setTimeout(() => avgorMed('timeout'), timeoutMs);

    korAlla()
      // `Promise.allSettled` fångar varje enskilt hämtningsfel — `korAlla()`
      // kan strukturellt inte reject:a. Skyddsnätet nedan är ändå aldrig fel:
      // slutlöftet ska ALDRIG kunna hänga eller kasta, se filhuvudets kontrakt.
      .catch(() => {})
      .then(() => {
        clearTimeout(timer);
        avgorMed('klar');
      });
  });

  return { forloppsprenumeration, slutlofte };
}
