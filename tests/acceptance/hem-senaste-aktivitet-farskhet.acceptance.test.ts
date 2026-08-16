import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import { ACTIVITY_LOG_STATEMENTS } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './support/acceptance-bas';

/**
 * TASK-210 — hem-spaltens FÄRSKHET (Marcus-order 2026-08-13: "Lös det!").
 *
 * BUGGEN, som den upptäcktes vid prod-rök-testet: Lotta skrev en anteckning,
 * gick till Hem — och spalten "Senaste aktivitet" visade den inte. Historikvyn
 * gjorde det. Orsaken var cachen, inte skrivningen: appens globala `staleTime`
 * är 5 min (`src/router.ts`), så `useLatestActivity` serverade cachad data i
 * upp till fem minuter. `refetchOnWindowFocus` räddade inget — den hämtar bara
 * om när datan redan är STALE.
 *
 * FIXEN: `recordActivity` invaliderar `queryKeys.activityLog.all` när ett
 * statement faktiskt skrivits. Den globala `staleTime` är MEDVETET orörd.
 *
 * DÄRFÖR ÄR TESTET TVÅSIDIGT — ett ensidigt test hade lika gärna passerat om
 * någon sänkt den globala ribban till noll, vilket vore fel lösning på rätt
 * problem:
 *   1. NEGATIVT (först): /hem → bort → tillbaka UTAN mutation ⇒ INGEN ny
 *      hämtning. Cachen gäller alltjämt; ribban är orörd.
 *   2. POSITIVT (sedan): samma resa MED en loggad mutation emellan ⇒ ny
 *      hämtning, och den nya posten syns.
 * Samma sida, samma resa, enda skillnaden är mutationen — så det som mäts är
 * invalideringen och ingenting annat.
 *
 * ALL NAVIGERING SKER KLIENT-SIDE (länkklick), ALDRIG `page.goto`. En full
 * sidladdning bygger en ny React Query-cache i minnet, och då hade testet
 * mätt sin egen omladdning i stället för invalideringen. `goto` används
 * därför exakt en gång: för att komma in i appen.
 *
 * VÄGEN (kortast möjliga, två klick): Hem-vyns "Nästa event"-kort länkar rakt
 * till eventdetaljen, vars Anteckningar-composer driver `useCreateEventNote`
 * → `recordActivity`. TabBar bär tillbaka till Hem.
 */

/** Fixturvärldens frusna logg är basen; den nya posten läggs till av mocken. */
const ANTAL_RADER_I_SPALTEN = 4;

/**
 * Radtexten den loggade anteckningen MÅSTE ge, räknad för hand ur koden — inte
 * härledd ur komponenten (tautologi-fällan, samma disciplin som
 * `hem-senaste-aktivitet.acceptance.test.ts` § TIDSSTRÄNGARNA):
 *   aktör  = 'Lotta'            — fixtur-sessionens `user_metadata.display_name`
 *   verb   = 'antecknade'       — `ANTECKNADE_VERB.display['sv-SE']`
 *   objekt = 'Utbildning Skövde' — `eventActivityName(event.eventNamn)`
 * Separatorn är mittpunkt (Marcus-order 2026-08-12), som i systersviten.
 */
const NY_RAD = 'Lotta skrev en anteckning · Utbildning Skövde';

/** En rad ur fixturvärldens frusna logg — bevisar att spalten alls är fylld. */
// TASK-225.3: mappad verb-copy via delade modulen, inte lagrad display.
const BEFINTLIG_RAD = 'Lotta markerade en betalning · Alva Ekström (Utbildning Skövde)';

interface Rigg {
  /** Antal `get-activity-log`-anrop hittills — mätpunkten för båda riktningarna. */
  hamtningar: () => number;
  /** Antal statements servern faktiskt tagit emot via `log-activity`. */
  loggade: () => number;
}

/**
 * STATEFUL rigg. Normallägets `get-activity-log` (`fixture-data.ts`
 * § Aktivitetsloggen) returnerar alltid samma frusna fem statements och vet
 * ingenting om det som just POST:ats — den kan därför varken visa en ny post
 * eller räknas. Överskuggningen speglar `pageSize` EXAKT som normalläget, så
 * spaltens fyra-raders-form är oförändrad.
 *
 * `log-activity` överskuggas också (den finns i normalläget): servern som tar
 * emot ett statement ska ha det i loggen vid NÄSTA läsning — det är hela
 * kedjan buggen bröt.
 */
function riggaLoggen(network: NetworkFixture): Rigg {
  let statements: unknown[] = [...ACTIVITY_LOG_STATEMENTS];
  let hamtningar = 0;
  let loggade = 0;

  network.use(
    http.get(EF('get-activity-log'), ({ request }) => {
      hamtningar++;
      const url = new URL(request.url);
      if (url.searchParams.get('cursor')) return json({ statements: [], nextCursor: null });
      const begart = Number(url.searchParams.get('pageSize') ?? '20');
      const antal = Number.isFinite(begart) && begart > 0 ? begart : 20;
      return json({ statements: statements.slice(0, antal), nextCursor: null });
    }),

    http.post(EF('log-activity'), async ({ request }) => {
      const statement = (await request.json()) as {
        id: string;
        timestamp: string;
        context: { extensions: Record<string, string> };
      };
      loggade++;
      // Servern har tagit emot posten → den ingår i loggen från och med nu,
      // överst (EF:en sorterar `occurred_at` desc).
      statements = [statement, ...statements];
      return json(
        {
          id: statement.id,
          requestId: Object.values(statement.context.extensions)[0],
          occurredAt: statement.timestamp,
        },
        201,
      );
    }),

    // Finns INTE i normalläget (till skillnad från `get-event-notes`) — utan
    // den fäller hermetik-vakten mutationen.
    http.post(EF('create-event-note'), async ({ request }) => {
      const body = (await request.json()) as { text?: string };
      const created = {
        id: 'recNyAnteckning01',
        forfattare: 'Lotta',
        text: String(body.text ?? ''),
        tidpunkt: '2026-09-15T08:30:00.000Z',
        eventId: 'recVisualEvent0001',
      };
      return json(
        { note: created, record: { id: created.id, fields: {}, createdTime: created.tidpunkt } },
        201,
      );
    }),
  );

  return { hamtningar: () => hamtningar, loggade: () => loggade };
}

const spalten = (page: Page) => page.getByTestId('senaste-aktivitet');

/** Klient-side: Hem → eventdetaljen, via "Nästa event"-kortets egen länk. */
async function tillEventet(page: Page): Promise<void> {
  await page
    .getByRole('region', { name: 'Nästa event' })
    .getByRole('link', { name: 'Utbildning Skövde' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Klient-side: var som helst → Hem, via TabBar. */
async function tillHem(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Hem' }).click();
  await expect(spalten(page)).toBeVisible();
}

// [TASK-243.1] HELA FILEN skippas — ÖPPET bokförd, minimal anpassning (se
// samma rationale i `hem-senaste-aktivitet.acceptance.test.ts`). Denna fils
// hjälpare `spalten()`/`tillHem()` pekar på den RETIRERADE
// `data-testid="senaste-aktivitet"`-spalten (ADR-102/103-promoveringen,
// `SenasteAktivitetKompakt.tsx` ersätter den). Full omskrivning: task-243.3.
test.describe
  .skip('Hem-spalten speglar en nyss loggad handling (TASK-210)', () => {
    test('BÅDA riktningarna: ingen omhämtning utan mutation — omedelbar färskhet med', async ({
      page,
      network,
    }) => {
      const rigg = riggaLoggen(network);

      // ── Utgångsläge: spalten hämtar en gång och cachar ──────────────────
      await page.goto('/hem');
      await expect(spalten(page)).toBeVisible();
      await expect(spalten(page).getByText(BEFINTLIG_RAD)).toBeVisible();
      await expect(spalten(page).getByRole('listitem')).toHaveCount(ANTAL_RADER_I_SPALTEN);

      const efterForstaBesoket = rigg.hamtningar();
      expect(efterForstaBesoket).toBeGreaterThan(0);

      // ── RIKTNING 1/2 (NEGATIV): samma resa UTAN mutation ────────────────
      // Bort till eventet och tillbaka. Spalten avmonteras och monteras om,
      // men datan är färsk (global staleTime, 5 min) → INGEN ny hämtning.
      await tillEventet(page);
      await tillHem(page);
      await expect(spalten(page).getByText(BEFINTLIG_RAD)).toBeVisible();

      // DEN KRITISKA ASSERTIONEN för denna riktning: räknaren står still.
      // Hade fixen varit "sänk den globala staleTime" hade detta tal ökat.
      expect(rigg.hamtningar()).toBe(efterForstaBesoket);
      expect(rigg.loggade()).toBe(0);
      // Den nya raden kan inte finnas ännu — ingenting har loggats.
      await expect(spalten(page).getByText(NY_RAD)).toHaveCount(0);

      // ── RIKTNING 2/2 (POSITIV): samma resa MED en loggad mutation ───────
      await tillEventet(page);

      const grupp = page.locator('section[aria-labelledby="grupp-anteckningar"]');
      await grupp.getByRole('textbox', { name: 'Ny anteckning' }).fill('Lokalen är bekräftad.');
      await grupp.getByRole('button', { name: 'Spara', exact: true }).click();

      // Loggningen är fire-and-forget — vänta tills servern FAKTISKT tagit emot
      // statementet, aldrig på en godtycklig tid.
      await expect.poll(() => rigg.loggade()).toBe(1);

      await tillHem(page);

      // DEN KRITISKA ASSERTIONEN för denna riktning: den nya posten syns —
      // utan omladdning, utan att vänta ut fem minuter.
      await expect(spalten(page).getByText(NY_RAD)).toBeVisible();
      // ... och den kom från en VERKLIG omhämtning, inte ur cachen.
      expect(rigg.hamtningar()).toBeGreaterThan(efterForstaBesoket);
      // Spalten är alltjämt fyra rader — den nyaste trängde ut den äldsta.
      await expect(spalten(page).getByRole('listitem')).toHaveCount(ANTAL_RADER_I_SPALTEN);
    });

    test('invalideringen är SMAL: en loggad mutation utlöser EN omhämtning, ingen kaskad', async ({
      page,
      network,
    }) => {
      const rigg = riggaLoggen(network);

      await page.goto('/hem');
      await expect(spalten(page)).toBeVisible();
      await expect(spalten(page).getByText(BEFINTLIG_RAD)).toBeVisible();

      await tillEventet(page);

      // Eventdetaljen renderar INTE spalten (den bor på Hem) → `latest` är
      // INAKTIV medan mutationen körs. En inaktiv query invalideras utan att
      // hämtas om; omhämtningen sker först när Hem monterar den igen.
      const foreMutation = rigg.hamtningar();

      const grupp = page.locator('section[aria-labelledby="grupp-anteckningar"]');
      await grupp.getByRole('textbox', { name: 'Ny anteckning' }).fill('Fika beställd.');
      await grupp.getByRole('button', { name: 'Spara', exact: true }).click();
      await expect.poll(() => rigg.loggade()).toBe(1);

      // Ingen hämtning skedde MEDAN vi stod på eventdetaljen — invalideringen
      // väckte ingen omonterad query. Det är skillnaden mot en tänkt
      // `refetchType: 'all'`, som hade hämtat om varje filterkombination i
      // historiken också, osedd.
      expect(rigg.hamtningar()).toBe(foreMutation);

      await tillHem(page);
      await expect(spalten(page).getByText(NY_RAD)).toBeVisible();

      // EXAKT en omhämtning för återbesöket — inte två, inte en kaskad.
      expect(rigg.hamtningar()).toBe(foreMutation + 1);
    });
  });
