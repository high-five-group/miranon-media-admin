import AxeBuilder from '@axe-core/playwright';
import type { z } from 'zod';
import type { InbetalningSchema, PersonDetailSchema } from '../../src/domain/schemas';
import { expect, type Page, test } from '../support/test-bas';

/**
 * TASK-346.7.1 — Personkortets Betalningar-sektion: bevis för husets
 * retry-policy + Gunilla-klart felläge, som ERSATTE den obundna
 * felläges-friheten orkestrerarens S113-slutvandring mätte (2026-08-31,
 * persondetalj `rec2JwV3Bh0x5qlvl`, `hamta-inbetalningar` 500, ≥16 anrop på
 * ~21 s, sr-only "Laddar inbetalningar ..." kvarstod >14 s utan felläge).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR STAGING-E2E OCH INTE ACCEPTANCE-KLASSEN
 * ═══════════════════════════════════════════════════════════════════════════
 * `VITE_FEATURE_BETALNINGAR` är explicit satt till `'av'` för HELA den delade
 * acceptance/visual/webblasarbeteende/manifest-screenshots-fixturvärlden
 * (`playwright.config.ts`, kommentaren vid `VITE_FEATURE_BETALNINGAR: 'av'`):
 * flaggan på UTAN att samtidigt mocka `JobbLyssnare`s Supabase Realtime-kanal
 * hade fällt VARJE autentiserad test i den delade klassen som
 * `OmockadWebSocketError` (mätt 48/48 innan flaggan sattes av, samma
 * kommentar). Att flippa den delade flaggan för denna enda skiva är exakt den
 * typ av bred, riskfylld ändring TASK-346.7 AC #6 (öppen, egen skiva) äger —
 * inte detta smala fynd.
 *
 * Staging bär redan `VITE_FEATURE_BETALNINGAR=pa` (`.env.staging`), och
 * `chromium-authenticated`-projektet körs mot verklig staging med en verklig
 * inloggad session (`playwright/.auth/user.json`). Denna svit följer
 * `atgarder-betalningar.staging.test.ts`s ETABLERADE mönster för
 * betalningsdomänen: deterministisk via `page.route`, ALDRIG `network.use()`
 * (den senare är acceptance-klassens MSW-mekanism, inte e2e-klassens) —
 * ingen delad staging-data muteras, `get-person`/`hamta-oppna-betalningar`/
 * `hamta-inbetalningar` mockas alla tre lokalt per test.
 */

const PERSON_ID = 'recBETFEL0000001';
// PREFIX-KOLLISIONEN (samma fälla `person-detail.acceptance.test.ts` § docblock
// beskriver för MSW): "get-person" är ett prefix av BÅDE "get-persons" (TabBar-
// prefetchen) och "get-person-notes" (persondetaljens anteckningsblock, anropas
// ovillkorligt). En glob-`*` efter "get-person" hade svalt båda. RegExp med
// literalt `?` (query-string-delimitern get-person ALLTID bär, `{ id }`) håller
// isär dem utan att röra de andra två anropen.
const GET_PERSON = /\/functions\/v1\/get-person\?/;
const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
const HAMTA_INBETALNINGAR = '**/functions/v1/hamta-inbetalningar*';

type PersonDetailMock = z.infer<typeof PersonDetailSchema>;
type InbetalningMock = z.infer<typeof InbetalningSchema>;

/** Minimal, giltig persondetalj — bara det Betalningar-sektionen faktiskt
    läser (`person.id`, `person.motiveringar`, `person.historik`) behöver
    innehåll; resten är schema-krav. */
function personDetail(overrides: Partial<PersonDetailMock> = {}): PersonDetailMock {
  return {
    id: PERSON_ID,
    namn: 'Test Testsson',
    fornamn: 'Test',
    efternamn: 'Testsson',
    email: 'test.testsson@example.test',
    telefon: null,
    ort: [],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: 0,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: null,
    senasteInteraktionDatum: null,
    dagarSedanSenaste: null,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: null,
    anmalningIds: [],
    deltagandeIds: [],
    aterkommande: null,
    nastaEvent: null,
    antalGenomfordaEvent: 0,
    senasteDeltagandeDatum: null,
    antalHamtningar: 0,
    allaHamtningar: [],
    motivering: [],
    hamtningar: [],
    motiveringar: [],
    flagga: null,
    inbjudenCommunity: false,
    skapatKontoCommunity: false,
    historik: [],
    ...overrides,
  };
}

function inbetalning(overrides: Partial<InbetalningMock> = {}): InbetalningMock {
  return {
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    anmalanRecordId: 'recANM0000000001',
    ogonblicksbildNamn: 'Test Testsson',
    ogonblicksbildEvent: 'Resor i medvetandet 1',
    ogonblicksbildEventdatum: '2026-06-01',
    belopp: 1500,
    betalsatt: 'Swish',
    betalningsdatum: '2026-05-20',
    typ: 'inbetalning',
    status: 'aktiv',
    makuleradSkal: null,
    makuleradNar: null,
    bankreferens: null,
    kvittoId: null,
    notering: null,
    skapadAv: 'test@example.test',
    skapadNar: '2026-05-20T10:00:00.000Z',
    ...overrides,
  };
}

/** `section[aria-labelledby="proto-d-betalningar"]` — Sektion-primitivens
    egen `aria-labelledby`-form (`PersonDetail.tsx` § `Sektion`), samma
    lokator-stil som `atgarder-betalningar.staging.test.ts` § `betalningsPanel`. */
function betalningsSektion(page: Page) {
  return page.locator('section[aria-labelledby="proto-d-betalningar"]');
}

async function mockGetPerson(page: Page): Promise<void> {
  await page.route(GET_PERSON, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ person: personDetail() }),
    });
  });
}

async function mockOppnaBetalningarTom(page: Page): Promise<void> {
  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: [], forfallna: 0 }),
    });
  });
}

test.describe('Personkortets Betalningar-sektion — felläge (TASK-346.7.1)', () => {
  test('500 från hamta-inbetalningar → felläget renderas, retry:erna är begränsade (16 anrop, inte evigt)', async ({
    page,
  }) => {
    await mockGetPerson(page);
    await mockOppnaBetalningarTom(page);

    let antalAnrop = 0;
    await page.route(HAMTA_INBETALNINGAR, async (route) => {
      antalAnrop += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: `req-test-fel-${antalAnrop}` }),
      });
    });

    await page.goto(`/personer/${PERSON_ID}`);
    const sektion = betalningsSektion(page);
    await expect(sektion.getByRole('heading', { name: 'Betalningar' })).toBeVisible();

    // Felläget måste hinna fram INNAN retryerna är klara. TIMING, MÄTT INTE
    // GISSAD: React Querys retry-policy (failureCount < 3 ⇒ 4 queryFn-försök,
    // retryDelay 200/400/800 ms) är EN nivå — men `callEdgeFunction`
    // (supabase-client.ts) anropar `fetchWithRetry` under huven, som SJÄLV
    // retryar 5xx internt (maxRetries=3 ⇒ ännu 4 råa HTTP-anrop, delay
    // 200/400/800 ms+jitter, PER queryFn-försök). De två nivåerna
    // MULTIPLICERAR: 4 × 4 = UPP TILL 16 råa HTTP-anrop innan felläget nås —
    // exakt den storm orkestrerarens vandring mätte (≥16 på ~21 s). Denna
    // skiva river INTE den multiplikationen (fetchWithRetry/callEdgeFunction
    // är repo-brett, används av VARJE EF-anrop — se fynd-kortets § SCOPE);
    // den ser till att antalet ÄNDÅ är begränsat (inte evigt) och att
    // felläget faktiskt syns och är Gunilla-klart när det till slut nås.
    // 30 s ger marginal mot både multiplikationen och verklig staging-latens.
    const fel = sektion.getByRole('alert');
    await expect(fel).toBeVisible({ timeout: 30_000 });
    await expect(fel).toContainText('Inbetalningarna kunde inte hämtas');
    await expect(fel).toContainText('Kontrollera att du är uppkopplad och försök igen.');
    // ALDRIG rå felsträng (T177-klassen) — "Edge Function" / "500" får inte
    // synas i den renderade felytan.
    await expect(fel).not.toContainText('Edge Function');
    await expect(fel).not.toContainText('500');

    // Försök igen-knappen sitter i MessageBox `actions`-slotten (husmönstret,
    // SectionError.tsx/AtgardsSida.tsx), inte egenplacerad bredvid rutan.
    await expect(fel.getByRole('button', { name: 'Försök igen' })).toBeVisible();

    // sr-only-laddtexten är BORTA — query lämnade pending när felläget kom.
    await expect(sektion.getByText(/^Laddar/)).toHaveCount(0);

    // KÄRNBEVISET: BEGRÄNSAT, ALDRIG EVIGT. Exakt 16 (4 queryFn-försök × 4
    // fetchWithRetry-försök vardera) med DAGENS fetchWithRetry-konstant
    // (maxRetries=3, `src/data/utils.ts`) — kopplingen till den konstanten är
    // medveten och dokumenterad, inte en slump: ändras den siffran där ska
    // detta tal följa med, för det är precis vad "begränsat" betyder här. Ett
    // intervall (inte bara en övre gräns) bevisar BÅDA hälfterna: att retries
    // faktiskt SKER (> 1, inte en tyst engångs-miss) och att de TAR SLUT
    // (begränsat värde, aldrig fortsatt växande — se `expect.poll` nedan för
    // den aktiva "växer den fortfarande?"-kontrollen).
    expect(antalAnrop).toBe(16);

    // Klick på Försök igen startar en HELT NY queryFn-cykel (refetch nollar
    // failureCount) — bevisar att knappen faktiskt triggar en ny query, inte
    // en no-op. Väntar bara in att räkningen PASSERAT 16 (bevisar start),
    // inte hela den nya 16-cykeln (samma bevispoäng till halva väntetiden).
    await fel.getByRole('button', { name: 'Försök igen' }).click();
    await expect.poll(() => antalAnrop, { timeout: 15_000 }).toBeGreaterThan(16);
    await expect(fel).toBeVisible();

    // Axe 0 på det renderade felläget — role=alert + Försök igen-knappen ska
    // vara fullt tillgängliga, inte bara visuellt korrekta.
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="proto-d-betalningar"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('403 från hamta-inbetalningar → INGEN retry (1 anrop) — bevisar 4xx-spärren, inte bara 5xx-boundedness', async ({
    page,
  }) => {
    await mockGetPerson(page);
    await mockOppnaBetalningarTom(page);

    let antalAnrop = 0;
    await page.route(HAMTA_INBETALNINGAR, async (route) => {
      antalAnrop += 1;
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden', requestId: 'req-test-403' }),
      });
    });

    await page.goto(`/personer/${PERSON_ID}`);
    const sektion = betalningsSektion(page);
    await expect(sektion.getByRole('alert')).toBeVisible({ timeout: 10_000 });

    // Ett klientfel läks aldrig genom att vänta — husets EdgeFunctionError-
    // medvetna retry-policy (samma lambda-form som PersonDetail.tsx/
    // EventDetail.tsx) kortsluter retryn helt vid 4xx. FÖRE denna skiva ärvde
    // hooken routerns naiva `retry: 3` (router.ts), som INTE gör den
    // åtskillnaden — differensen 1 vs 4 anrop är precis vad fixen ändrade.
    expect(antalAnrop).toBe(1);
  });

  test('lyckat svar → sektionen renderar data, ingen laddningstext kvarstår', async ({ page }) => {
    await mockGetPerson(page);
    await mockOppnaBetalningarTom(page);

    await page.route(HAMTA_INBETALNINGAR, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inbetalningar: [inbetalning()],
          kvitton: [],
          spegel: { summaPostgres: 1500, summaBasen: 1500, iFas: true },
        }),
      });
    });

    await page.goto(`/personer/${PERSON_ID}`);
    const sektion = betalningsSektion(page);
    await expect(sektion.getByRole('heading', { name: 'Betalningar' })).toBeVisible();

    // Raden renderas sedan bank-anatomin (2026-09-01 pass 14,
    // `InbetalningsLista.tsx` § RADENS ANATOMI) i TRE kolumner: betalsättet
    // som titelled, datum · kvittostatus som sekundärt svep, och beloppet i
    // en egen högerkolumn. `inbetalningsText` lever kvar — men som radens
    // TILLGÄNGLIGA namn (⋯-menyns etikett), inte som dess synliga form.
    //
    // LEDEN PRÖVAS VAR FÖR SIG, OCH DET ÄR NU ETT KRAV: den tidigare
    // assertionen `getByText(/Swish.*2026-05-20/)` förutsatte att betalsätt
    // och datum låg i SAMMA nod. De ligger i två noder sedan pass 14, så
    // regexen kan aldrig matcha igen — den hade fällt på en korrekt yta.
    await expect(sektion.getByText('1 500 kr', { exact: true })).toBeVisible();
    await expect(sektion.getByText('Swish', { exact: true })).toBeVisible();
    await expect(sektion.getByText(/2026-05-20/)).toBeVisible();

    // INGEN sr-only-laddtext kvarstår, och inget felläge visas.
    await expect(sektion.getByText(/^Laddar/)).toHaveCount(0);
    await expect(sektion.getByRole('alert')).toHaveCount(0);
  });
});
