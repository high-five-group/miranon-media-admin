import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import {
  type ActivityStatementSchema,
  EVENT_ID_EXTENSION_IRI,
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas';
import { FROZEN_NOW } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-201.6 — Aktivitetshistoriken, kärnvyn (A-formen): /mer/aktivitetshistorik.
 *
 * `get-activity-log` LIGGER INTE I NORMALLÄGET (samma skäl som `get-mail-log`,
 * se mer-maillogg.acceptance.test.ts:s filhuvud) — varje test här överskuggar
 * med `network.use(http.get(EF('get-activity-log'), …))`.
 *
 * Täckning: AC #1 (route + vy, dagsgruppering Idag/Igår/långdatum, postform:
 * relativ tid vs klockslag, aktör i medium, händelse i naturligt språk med
 * `·`-separator, post-klick → eventet), AC #3 (tomläge), AC #4 (rubrikstruktur,
 * axe 0 på tom + ifylld), cursor-paginering (`useActivityLogHistory`,
 * TASK-201.5), fel-yta (role=alert).
 *
 * NAVIGATIONSTESTET FÖLJER `hem.acceptance.test.ts`:s precedent (task-62):
 * assertionen är `toHaveURL`, testet navigerar aldrig så långt att
 * eventdetaljsidan hämtar något — ingen `get-event`/`get-registrations`-
 * överskuggning behövs.
 */

type Statement = z.infer<typeof ActivityStatementSchema>;

let idCounter = 0;
/** Deterministisk v4-formad UUID (Zod `.uuid()` kräver giltig UUID-form). */
function testUuid(): string {
  idCounter += 1;
  return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
}

/**
 * Lokal tid N dagar bakåt, på angiven timme — relativt fixturvärldens FRUSNA
 * klocka (`hermetic.ts` § `page.clock.setFixedTime(FROZEN_NOW)`), INTE
 * verklig väggklocka. Komponentens `Date.now()` körs i BROWSERN, som fixerats
 * vid FROZEN_NOW innan testet startar — samma "nu" som
 * `events-list-kalender.acceptance.test.ts` etablerar. Ingen egen
 * `setFixedTime` behövs här.
 */
function lokalTid(dagarBak: number, timme: number, minut = 0): string {
  const d = new Date(FROZEN_NOW);
  d.setDate(d.getDate() - dagarBak);
  d.setHours(timme, minut, 0, 0);
  return d.toISOString();
}

/** N minuter sedan — "Idag"-radens relativa tid, relativt FROZEN_NOW. */
function minuterSedan(n: number): string {
  return new Date(FROZEN_NOW.getTime() - n * 60_000).toISOString();
}

/** Samma formatterings-options som AktivitetsHistorik.tsx:s LANGDATUM — så
 * testets förväntade grupprubrik alltid matchar komponentens, oavsett vilket
 * kalenderdatum CI faktiskt kör på. */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Ett komplett xAPI-statement som passerar ActivityStatementSchema. */
function statement({
  actorName = 'Lotta',
  verbDisplay = 'markerade betalning',
  objectName = 'Anna Andersson (Fjärrskådning 2)',
  timestamp,
  eventId,
}: {
  actorName?: string;
  verbDisplay?: string;
  objectName?: string;
  timestamp: string;
  eventId?: string;
}): Statement {
  return {
    id: testUuid(),
    actor: {
      objectType: 'Agent',
      name: actorName,
      account: { homePage: XAPI_IRI_BASE, name: testUuid() },
    },
    verb: { id: `${XAPI_IRI_BASE}/verbs/test-verb`, display: { 'sv-SE': verbDisplay } },
    object: {
      objectType: 'Activity',
      id: `${XAPI_IRI_BASE}/objects/registrations/rec-test-${idCounter}`,
      definition: {
        name: { 'sv-SE': objectName },
        type: `${XAPI_IRI_BASE}/activity-types/betalning`,
      },
    },
    context: {
      extensions: eventId
        ? { [REQUEST_ID_EXTENSION_IRI]: testUuid(), [EVENT_ID_EXTENSION_IRI]: eventId }
        : { [REQUEST_ID_EXTENSION_IRI]: testUuid() },
    },
    timestamp,
  } satisfies Statement;
}

function mockActivityLog(
  network: NetworkFixture,
  respond: (
    url: URL,
  ) => { statements: Statement[]; nextCursor: string | null } | { status: number },
): void {
  network.use(
    http.get(EF('get-activity-log'), ({ request }) => {
      const url = new URL(request.url);
      const out = respond(url);
      if ('status' in out) {
        return json({ error: 'Internal error', requestId: 'req-aktivitet-500' }, out.status);
      }
      return json(out);
    }),
  );
}

test.describe('Aktivitetshistoriken — kärnvyn (TASK-201.6, A-formen)', () => {
  test('AC #3 — tomläge första gången: vänlig, ej alarmerande text; fokus → h1', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, () => ({ statements: [], nextCursor: null }));
    await page.goto('/mer/aktivitetshistorik');

    const heading = page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    await expect(page.getByText('Ingen aktivitet ännu')).toBeVisible();
    await expect(page.getByText(/Här kommer du snart se allt du gör i appen/)).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    // Tomläget bär inga dagsgrupper.
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
  });

  test('AC #1 — dagsgruppering (Idag/Igår/långdatum) + postform (aktör medium, · -separator, relativ tid/klockslag)', async ({
    page,
    network,
  }) => {
    const idagIso = minuterSedan(12);
    const igarIso = lokalTid(1, 14, 30);
    const aldreIso = lokalTid(6, 9, 15);
    const aldreLabel = LANGDATUM.format(new Date(aldreIso));

    mockActivityLog(network, () => ({
      statements: [
        statement({
          actorName: 'Lotta',
          verbDisplay: 'markerade betalning',
          objectName: 'Anna Andersson (Fjärrskådning 2)',
          timestamp: idagIso,
        }),
        statement({
          actorName: 'Roger',
          verbDisplay: 'bekräftade anmälan',
          objectName: 'Erik Holm (Medveten Kontakt)',
          timestamp: igarIso,
        }),
        statement({
          actorName: 'Marcus',
          verbDisplay: 'skickade bekräftelsemail',
          objectName: 'Sara Björk (Medveten Kontakt)',
          timestamp: aldreIso,
        }),
      ],
      nextCursor: null,
    }));

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();

    // Tre dagsgrupper, riktiga h2:or, i server-sorterad ordning (fallande).
    const grupper = page.getByRole('heading', { level: 2 });
    await expect(grupper).toHaveText(['Idag', 'Igår', aldreLabel]);

    // "Idag"-raden: relativ tid.
    await expect(page.getByText('för 12 min sedan')).toBeVisible();
    // "Igår"-raden: klockslag, INTE relativ tid.
    await expect(page.getByText('14:30')).toBeVisible();
    // Äldre rad: klockslag också (dagen står redan i h2:n).
    await expect(page.getByText('09:15')).toBeVisible();

    // Naturligt språk med MITTPUNKT-separator (Marcus-order 2026-08-12) —
    // ALDRIG långt tankstreck.
    await expect(
      page.getByText('markerade betalning · Anna Andersson (Fjärrskådning 2)'),
    ).toBeVisible();
    await expect(page.getByText(/—/)).toHaveCount(0);

    // Aktören bär font-medium (500) — computed, inte bara klass-närvaro.
    const aktorSpan = page.locator('span.font-medium', { hasText: 'Lotta' }).first();
    await expect(aktorSpan).toHaveText('Lotta');
    const vikt = await aktorSpan.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(vikt).toBe('500');
  });

  test('AC #1 — post-klick navigerar till eventet när eventId-extensionen finns; olänkad utan den', async ({
    page,
    network,
  }) => {
    const idagIso = minuterSedan(3);
    mockActivityLog(network, () => ({
      statements: [
        statement({
          actorName: 'Lotta',
          verbDisplay: 'bekräftade anmälan',
          objectName: 'Länkad Person (Test-event)',
          timestamp: idagIso,
          eventId: 'recEventTest123',
        }),
        statement({
          actorName: 'Lotta',
          verbDisplay: 'markerade betalning',
          objectName: 'Olänkad Person (Test-event)',
          timestamp: minuterSedan(4),
        }),
      ],
      nextCursor: null,
    }));

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();

    // Raden UTAN eventId-extension är INTE en länk (ärlig degradering — se
    // AktivitetsHistorik.tsx:s aktivitetensEventId-filhuvud för koordinerings-
    // skulden mot TASK-201.4).
    const olankadRad = page.getByRole('listitem').filter({ hasText: 'Olänkad Person' });
    await expect(olankadRad.getByRole('link')).toHaveCount(0);
    await expect(olankadRad).toBeVisible();

    // Raden MED eventId-extension navigerar (INGEN get-event-överskuggning —
    // toHaveURL-precedenten från hem.acceptance.test.ts, testet navigerar
    // aldrig så långt att detaljsidan hämtar något).
    await page.getByRole('link', { name: /Länkad Person/ }).click();
    await expect(page).toHaveURL(/\/event\/recEventTest123$/);
  });

  test('cursor-round-trip via "Ladda fler" (TASK-201.5:s useInfiniteQuery)', async ({
    page,
    network,
  }) => {
    const sida1 = [
      statement({ objectName: 'Post 1', timestamp: minuterSedan(1) }),
      statement({ objectName: 'Post 2', timestamp: minuterSedan(2) }),
    ];
    const sida2 = [statement({ objectName: 'Post 3', timestamp: minuterSedan(3) })];

    mockActivityLog(network, (url) => {
      const cursor = url.searchParams.get('cursor');
      if (!cursor) return { statements: sida1, nextCursor: 'c1' };
      if (cursor === 'c1') return { statements: sida2, nextCursor: null };
      return { statements: [], nextCursor: null };
    });

    await page.goto('/mer/aktivitetshistorik');
    const loadMore = page.getByRole('button', { name: 'Ladda fler' });

    await expect(page.getByText('Visar 2 poster (fler finns).')).toBeVisible();
    await expect(loadMore).toBeVisible();

    await loadMore.click();
    await expect(page.getByText('Post 3')).toBeVisible();
    await expect(page.getByText('Visar 3 poster.')).toBeVisible();
    // A11y: aria-live annonserar antalet nya rader (speglar PersonsList.tsx).
    await expect(page.getByText('1 fler post laddade, 3 totalt.')).toHaveCount(1);
    // Sista sidan (nextCursor null) → knappen försvinner.
    await expect(loadMore).toHaveCount(0);
    // A11y: fokus tappas inte vid knappens försvinnande.
    await expect(page.getByText('Visar 3 poster.')).toBeFocused();
  });

  test('fel (500) → felytan via role=alert, ingen falsk tom lista', async ({ page, network }) => {
    mockActivityLog(network, () => ({ status: 500 }));
    await page.goto('/mer/aktivitetshistorik');

    // Default QueryClient-retry (router.ts: retry 3, retryDelay 200/400/800 ms)
    // — samma härledning som persons-list.acceptance.test.ts:s läs-fel-test
    // (ingen egen 4xx-undantagsgren i useActivityLogHistory). Rundlig marginal.
    const alert = page
      .getByRole('alert')
      .filter({ hasText: 'Kunde inte hämta aktivitetshistoriken' });
    await expect(alert).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Ingen aktivitet ännu')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
  });

  test('axe 0 violations på TOM vy', async ({ page, network }) => {
    mockActivityLog(network, () => ({ statements: [], nextCursor: null }));
    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ingen aktivitet ännu')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på IFYLLD vy (grupperad, klickbara + olänkade rader)', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, () => ({
      statements: [
        statement({ timestamp: minuterSedan(5), eventId: 'recEventAxe1' }),
        statement({ objectName: 'Rad utan länk', timestamp: lokalTid(1, 10, 0) }),
      ],
      nextCursor: null,
    }));
    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Igår' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
