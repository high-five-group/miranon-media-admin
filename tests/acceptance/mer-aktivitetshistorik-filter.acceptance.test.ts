import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { delay, http } from 'msw';
import type { z } from 'zod';
import {
  type ActivityStatementSchema,
  type EventSchema,
  REQUEST_ID_EXTENSION_IRI,
  XAPI_IRI_BASE,
} from '../../src/domain/schemas';
import { EVENTS_RESPONSE } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-201.8 — Filterraden (B-målet): kategori + event (Select-primitiven) +
 * tidsperiod (ToggleButtonGroup) ovanpå TASK-201.6:s kärnvy.
 *
 * `get-events` LIGGER I NORMALLÄGET (`tests/support/fixturvarld/handlers.ts`
 * rad ~79) — event-dropdownens tre alternativ (Skövde/Göteborg/Varberg,
 * `EVENTS_RESPONSE`) kräver ingen egen överskuggning. `get-activity-log`
 * ligger UTANFÖR normalläget (samma skäl som
 * `mer-aktivitetshistorik.acceptance.test.ts`s filhuvud) — varje test här
 * överskuggar med `mockActivityLog`.
 *
 * Täckning: AC #1 (filterrad ovanför listan, kategori/event/tidsperiod
 * skickas som EF-query-params — SERVER-SIDE, se AktivitetsHistorik.tsx:s
 * egen "ÖPPET BOKFÖRD AVVIKELSE"-kommentar för varför INTE klientfiltrering),
 * AC #2 (filtrerat tomläge skilt från förstagångs-tomläget + Rensa filter),
 * AC #3 (axe 0, tangentbordsväg, fokus-behållning under filterbyte), AC #4
 * (URL-delbarhet + Back-knapp), samt "filterbyte mitt i paginering" —
 * ett filterbyte EFTER en "Ladda fler"-hämtning startar om cursorn (ingen
 * gammal sida blandas in i den nya filtermängden).
 *
 * TASK-201.17 (fynd, S105:s QA-vandring) — event-dropdownens ETIKETT: se
 * beskrivningen längst ner i filen, vid testblocket "event-dropdownens
 * etikett kvalificerar…". `SKOVDE.eventNamn`-assertionen i det ÄLDRE
 * event-filter-testet nedan bytt till den fulla kvalificerade etiketten
 * ("Utbildning Skövde · Skövde · 26 sep") — bar `eventNamn` hade efter
 * TASK-201.17 inte längre matchat den faktiskt renderade options-texten.
 */

type Statement = z.infer<typeof ActivityStatementSchema>;

let idCounter = 0;
/** Deterministisk v4-formad UUID (Zod `.uuid()` kräver giltig UUID-form). */
function testUuid(): string {
  idCounter += 1;
  return `00000000-0000-4000-8000-${String(idCounter).padStart(12, '0')}`;
}

/** N minuter sedan — REDAN TZ-säker (`getTime()`/`toISOString()`, ingen
 * lokal Date-metod inblandad; speglar mer-aktivitetshistorik.acceptance.test.ts). */
function minuterSedan(n: number): string {
  return new Date(Date.now() - n * 60_000).toISOString();
}

/** Ett komplett xAPI-statement som passerar ActivityStatementSchema (trimmad
 * kopia av mer-aktivitetshistorik.acceptance.test.ts:s `statement()` — ingen
 * delad export finns, se den filens filhuvud för samma val). */
function statement({
  objectName,
  timestamp,
}: {
  objectName: string;
  timestamp: string;
}): Statement {
  return {
    id: testUuid(),
    actor: {
      objectType: 'Agent',
      name: 'Lotta',
      account: { homePage: XAPI_IRI_BASE, name: testUuid() },
    },
    verb: { id: `${XAPI_IRI_BASE}/verbs/test-verb`, display: { 'sv-SE': 'markerade betalning' } },
    object: {
      objectType: 'Activity',
      id: `${XAPI_IRI_BASE}/objects/registrations/rec-test-${idCounter}`,
      definition: {
        name: { 'sv-SE': objectName },
        type: `${XAPI_IRI_BASE}/activity-types/betalning`,
      },
    },
    context: { extensions: { [REQUEST_ID_EXTENSION_IRI]: testUuid() } },
    timestamp,
  } satisfies Statement;
}

/** Överskuggar `get-activity-log` och (valfritt) samlar in varje anropad URL
 * för param-assertioner (`requests`-arrayen, om given). */
function mockActivityLog(
  network: NetworkFixture,
  respond: (url: URL) => { statements: Statement[]; nextCursor: string | null },
  requests?: URL[],
): void {
  network.use(
    http.get(EF('get-activity-log'), ({ request }) => {
      const url = new URL(request.url);
      requests?.push(url);
      return json(respond(url));
    }),
  );
}

const SKOVDE = EVENTS_RESPONSE.events[0];

/** Härledd ur EventSchema (TASK-63-mönstret, se events-list-kalender.
 * acceptance.test.ts:s identiska val) — ej beskriven bredvid det. */
type EventRow = z.infer<typeof EventSchema>;

/** Minimal, giltig event-rad för TASK-201.17-testerna nedan — bara de fält
 * `eventFilterEtikett`/sorteringen faktiskt läser (namn/ort/startdatum)
 * varieras per anrop; resten är schema-krävda konstanter utan betydelse för
 * dessa test (trimmad kopia av events-list-kalender.acceptance.test.ts:s
 * `ev()`, ingen delad export finns — samma isolering som produktionskodens
 * egen `eventVisningsNamn`/`eventFilterEtikett`). */
function ev(o: { id: string; namn: string; ort: string; startdatum: string }): EventRow {
  return {
    id: o.id,
    eventlabel: o.namn,
    eventNamn: o.namn,
    typ: 'Kurs',
    ort: o.ort,
    startdatum: o.startdatum,
    slutdatum: o.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: null,
    antalAnmalda: 0,
    platserKvar: null,
    anmaldBelaggning: null,
    bekraftadBelaggning: null,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
  };
}

/** Överskuggar `get-events` (mönster: events-list-kalender.acceptance.test.ts:s
 * `mockEvents` — samma isolering, ingen delad export). */
function mockEvents(network: NetworkFixture, events: EventRow[]): void {
  network.use(http.get(EF('get-events'), () => json({ events })));
}

test.describe('Aktivitetshistoriken — filterraden (TASK-201.8, B-målet)', () => {
  test('AC #1 — filterraden renderas ovanför listan med labelade kontroller i nolläge', async ({
    page,
    network,
  }) => {
    const requests: URL[] = [];
    mockActivityLog(
      network,
      () => ({
        statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
        nextCursor: null,
      }),
      requests,
    );

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    const filterrad = page.getByTestId('aktivitetshistorik-filterrad');
    await expect(filterrad).toBeVisible();
    await expect(filterrad.getByRole('button', { name: 'Kategori' })).toBeVisible();
    await expect(filterrad.getByRole('button', { name: 'Event' })).toBeVisible();
    const tidsperiodGrupp = filterrad.getByRole('radiogroup', { name: 'Tidsperiod' });
    await expect(tidsperiodGrupp).toBeVisible();
    await expect(tidsperiodGrupp.getByRole('radio', { name: 'Allt' })).toBeChecked();

    // Nolläget skickar INGA filter-params (samma request som TASK-201.6:s
    // ursprungliga, ofiltrerade anrop).
    const sista = requests.at(-1);
    expect(sista?.searchParams.has('category')).toBe(false);
    expect(sista?.searchParams.has('eventId')).toBe(false);
    expect(sista?.searchParams.has('from')).toBe(false);
  });

  test('kategori-filtret skickar den fulla activity-type-IRI:n som `category`-param', async ({
    page,
    network,
  }) => {
    const requests: URL[] = [];
    mockActivityLog(
      network,
      (url) => {
        if (url.searchParams.get('category') === `${XAPI_IRI_BASE}/activity-types/betalning`) {
          return {
            statements: [statement({ objectName: 'Betalning-post', timestamp: minuterSedan(1) })],
            nextCursor: null,
          };
        }
        return {
          statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
          nextCursor: null,
        };
      },
      requests,
    );

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    await page.getByRole('button', { name: 'Kategori' }).click();
    await page.getByRole('option', { name: 'Betalning' }).click();

    await expect(page.getByText('Betalning-post')).toBeVisible();
    await expect(page).toHaveURL(/[?&]kategori=betalning(&|$)/);
    expect(requests.at(-1)?.searchParams.get('category')).toBe(
      `${XAPI_IRI_BASE}/activity-types/betalning`,
    );
  });

  test('event-filtret skickar valt event-ID som `eventId`-param (Select-alternativen ur get-events)', async ({
    page,
    network,
  }) => {
    const requests: URL[] = [];
    mockActivityLog(
      network,
      (url) => {
        if (url.searchParams.get('eventId') === SKOVDE.id) {
          return {
            statements: [statement({ objectName: 'Skovde-post', timestamp: minuterSedan(1) })],
            nextCursor: null,
          };
        }
        return {
          statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
          nextCursor: null,
        };
      },
      requests,
    );

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    const eventTrigger = page.getByRole('button', { name: 'Event' });
    await expect(eventTrigger).toBeEnabled();
    await eventTrigger.click();
    // TASK-201.17: options-etiketten är "Namn · Ort · datum", inte bar
    // `eventNamn` — se testblocket längre ner i filen för fyndet i sin helhet.
    await page.getByRole('option', { name: 'Utbildning Skövde · Skövde · 26 sep' }).click();

    await expect(page.getByText('Skovde-post')).toBeVisible();
    expect(requests.at(-1)?.searchParams.get('eventId')).toBe(SKOVDE.id);
  });

  test('tidsperiod-filtret räknar `from` som ett rullande fönster ("7 dagar"/"30 dagar") och en kalenderdag ("Idag") — oberoende omräknat, ej härlett ur komponentens egen formatterare', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, () => ({
      statements: [statement({ objectName: 'Startrad', timestamp: minuterSedan(1) })],
      nextCursor: null,
    }));

    await page.goto('/mer/aktivitetshistorik');
    // "Startrad" (INTE "Post") — undviker strict-mode-krock med statusradens
    // egen "Visar 1 post."-text (getByText matchar substräng, skiftlägesokänsligt).
    await expect(page.getByText('Startrad')).toBeVisible();

    // Fixturvärldens FROZEN_NOW = 2026-09-15T10:00:00+02:00 = 08:00:00.000Z.
    // Värdena är räknade separat med Date.UTC-aritmetik (verifierat via
    // `node -e` innan de skrevs in här) — INTE härledda ur
    // AktivitetsHistorik.tsx:s `tidsperiodFran` (tautologi-fällan).
    const forvantat: [etikett: string, urlNyckel: string, isoFran: string][] = [
      ['Idag', 'idag', '2026-09-14T22:00:00.000Z'], // lokal midnatt Stockholm 2026-09-15
      ['7 dagar', '7dagar', '2026-09-08T08:00:00.000Z'],
      ['30 dagar', '30dagar', '2026-08-16T08:00:00.000Z'],
    ];

    // page.waitForRequest registreras FÖRE klicket (Promise.all) så att inga
    // tidigare (redan upplösta) anrop av misstag matchar — varje varv väntar
    // på just DEN periodens `from`-värde, oavsett svarstext (mocken varierar
    // aldrig innehållet, så en textbaserad väntan hade inte kunnat skilja
    // varven åt).
    for (const [etikett, urlNyckel, isoFran] of forvantat) {
      const [request] = await Promise.all([
        page.waitForRequest(
          (req) =>
            req.url().includes('/functions/v1/get-activity-log') &&
            new URL(req.url()).searchParams.get('from') === isoFran,
        ),
        page.getByRole('radio', { name: etikett }).click(),
      ]);
      expect(new URL(request.url()).searchParams.get('from')).toBe(isoFran);
      await expect(page).toHaveURL(new RegExp(`[?&]tidsperiod=${urlNyckel}(&|$)`));
    }

    // "Allt" (default) → rensad URL, inget `from`-param. INGEN
    // `waitForRequest` här (till skillnad från loopen ovan): "Allt" har
    // SAMMA queryKey som sidans ALLRA FÖRSTA, redan varma hämtning
    // (`{category: undefined, eventId: undefined, from: undefined}` hashar
    // identiskt med `{}` — `JSON.stringify` utelämnar `undefined`-nycklar).
    // React Query serverar då ur cachen UTAN nytt nätverksanrop (korrekt,
    // önskat beteende — INTE en bugg) eftersom datat inte hunnit bli stale;
    // ett `waitForRequest` här skulle vänta för evigt. Verifiera i stället
    // URL:en + att INNEHÅLLET (cachat eller ej) är det ofiltrerade.
    await page.getByRole('radio', { name: 'Allt' }).click();
    await expect(page).not.toHaveURL(/tidsperiod=/);
    await expect(page.getByText('Startrad')).toBeVisible();
  });

  test('AC #2 — filtrerat nollresultat visar ett ANNAT tomläge än förstagångs-tomläget, och Rensa filter återställer', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, (url) => {
      if (url.searchParams.get('category')) {
        return { statements: [], nextCursor: null };
      }
      return {
        statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
        nextCursor: null,
      };
    });

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    await page.getByRole('button', { name: 'Kategori' }).click();
    await page.getByRole('option', { name: 'Mail' }).click();

    await expect(page.getByText('Inga träffar med det filtret')).toBeVisible();
    await expect(page.getByText('Ingen aktivitet ännu')).toHaveCount(0);
    // Filterraden är KVAR under tomläget (AC #1 — alltid ovanför listan).
    await expect(page.getByTestId('aktivitetshistorik-filterrad')).toBeVisible();

    await page.getByRole('button', { name: 'Rensa filter' }).click();

    await expect(page.getByText('Ofiltrerad post')).toBeVisible();
    await expect(page).toHaveURL(/\/mer\/aktivitetshistorik$/);
    // Fokus-behållning: Rensa filter flyttar fokus till den stabila h1:an
    // (ingen tratt-knapp i denna raden, se AktivitetsHistorik.tsx:s
    // `rensaFilter`-kommentar).
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeFocused();
  });

  test('filterbyte mitt i paginering: cursorn startar om, ingen gammal sida blandas in i den nya filtermängden', async ({
    page,
    network,
  }) => {
    const requests: URL[] = [];
    const sida1 = [
      statement({ objectName: 'Post 1', timestamp: minuterSedan(1) }),
      statement({ objectName: 'Post 2', timestamp: minuterSedan(2) }),
    ];
    const sida2 = [statement({ objectName: 'Post 3', timestamp: minuterSedan(3) })];
    const mailTraff = [statement({ objectName: 'Mail-post', timestamp: minuterSedan(1) })];

    // Bygger handlern direkt (inte `mockActivityLog`-hjälparen): den
    // FILTRERADE grenen fördröjs medvetet (`delay`, msw) — utan en riktig
    // fördröjning hade skenet av "filterraden stannar monterad" kunnat vara
    // sant av ren tur (svaret hinner alltid landa innan en assertion körs).
    // Med fördröjningen HINNER testet fråga "är filterraden/den GAMLA
    // listan fortfarande där just NU, mitt i hämtningen" — ett verkligt
    // falsifierbart test av `keepPreviousData` (useActivityLog.ts), inte
    // bara ett facit-test av SLUTRESULTATET.
    network.use(
      http.get(EF('get-activity-log'), async ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const kategori = url.searchParams.get('category');
        const cursor = url.searchParams.get('cursor');
        if (kategori === `${XAPI_IRI_BASE}/activity-types/mail`) {
          // Filtrerad gren: ENDAST nåbar UTAN cursor (bevisar att ett
          // filterbyte alltid startar om vid sidan 1 — en gammal `sida2`-
          // cursor skulle aldrig träffa denna gren).
          if (cursor) throw new Error('Filtrerat anrop bar felaktigt en gammal cursor');
          await delay(400);
          return json({ statements: mailTraff, nextCursor: null });
        }
        if (!cursor) return json({ statements: sida1, nextCursor: 'c1' });
        if (cursor === 'c1') return json({ statements: sida2, nextCursor: null });
        return json({ statements: [], nextCursor: null });
      }),
    );

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Visar de 2 senaste posterna · fler finns.')).toBeVisible();

    await page.getByRole('button', { name: 'Ladda fler' }).click();
    await expect(page.getByText('Post 3')).toBeVisible();
    await expect(page.getByText('Visar alla 3 poster.')).toBeVisible();

    await page.getByRole('button', { name: 'Kategori' }).click();
    await page.getByRole('option', { name: 'Mail' }).click();

    // MITT I den 400 ms-fördröjda hämtningen (Mail-post har INTE landat
    // än): filterraden och den GAMLA listan ska fortfarande stå kvar
    // (`keepPreviousData` — se useActivityLog.ts). Utan den mekanismen hade
    // `isPending` blivit sant här och slagit om till den bara LaddLage-
    // grenen (ingen filterrad, ingen gammal lista).
    //
    // OMEDELBARA, ICKE-ÅTERFÖRSÖKANDE avläsningar (`.isVisible()`/`.count()`
    // — INTE `expect(locator).toBeVisible()`, som hade kunnat "rädda" ett
    // trasigt test genom att polla FÖRBI hela fördröjningen och hitta
    // filterraden EFTER att den kommit tillbaka; ett sådant test hade varit
    // grönt oavsett om `keepPreviousData` fanns eller ej).
    const mailPostRedanSynlig = await page.getByText('Mail-post').count();
    const filterradSynligMittIFlodet = await page
      .getByTestId('aktivitetshistorik-filterrad')
      .isVisible();
    const gammalListaKvarMittIFlodet = await page.getByText('Post 3').isVisible();
    const laddLageSynligtMittIFlodet = await page
      .getByText('Laddar aktivitetshistorik…')
      .isVisible();

    expect(mailPostRedanSynlig).toBe(0); // hämtningen är INTE klar än
    expect(filterradSynligMittIFlodet).toBe(true); // aldrig unmountad
    expect(gammalListaKvarMittIFlodet).toBe(true); // gammal data orörd under tyst omhämtning
    expect(laddLageSynligtMittIFlodet).toBe(false); // ingen flimrande LaddLage

    await expect(page.getByText('Mail-post')).toBeVisible();
    // De gamla, ackumulerade sidorna är BORTA — inte kvarhängande under den
    // nya filtermängden.
    await expect(page.getByText('Post 1')).toHaveCount(0);
    await expect(page.getByText('Post 2')).toHaveCount(0);
    await expect(page.getByText('Post 3')).toHaveCount(0);
    await expect(page.getByText('Visar alla 1 post.')).toBeVisible();

    // Det senaste anropet bar INGEN cursor (fräsch sida 1 för den nya
    // filterkombinationen) — mock-handlern hade annars kastat ovan.
    expect(requests.at(-1)?.searchParams.has('cursor')).toBe(false);
  });

  test('AC #4 — filtervalen är URL-burna: delbara och back-bara', async ({ page, network }) => {
    mockActivityLog(network, (url) => {
      if (url.searchParams.get('category') === `${XAPI_IRI_BASE}/activity-types/betalning`) {
        return {
          statements: [statement({ objectName: 'Betalning-post', timestamp: minuterSedan(1) })],
          nextCursor: null,
        };
      }
      return {
        statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
        nextCursor: null,
      };
    });

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    await page.getByRole('button', { name: 'Kategori' }).click();
    await page.getByRole('option', { name: 'Betalning' }).click();
    await expect(page).toHaveURL(/kategori=betalning/);
    await expect(page.getByText('Betalning-post')).toBeVisible();

    await page.goBack();
    await expect(page).not.toHaveURL(/kategori=betalning/);
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();
  });

  test('AC #3 — axe 0 violations med filterraden synlig (nolläge och ifylld)', async ({
    page,
    network,
  }) => {
    mockActivityLog(network, () => ({
      statements: [statement({ objectName: 'Aktivitet', timestamp: minuterSedan(2) })],
      nextCursor: null,
    }));
    await page.goto('/mer/aktivitetshistorik');
    // Vänta in ifylld vy via rad 1 (aktör + händelse) — TIDSOBEROENDE:
    // metaradens tidsform (relativ/klockslag) beror på klock-frysningen,
    // och bar "Aktivitet" substring-matchar h1:an (strict-krock, S106).
    await expect(page.getByText('Lotta markerade betalning')).toBeVisible();
    await expect(page.getByTestId('aktivitetshistorik-filterrad')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('AC #3 — tangentbordsväg: kategori-filtret väljs utan mus', async ({ page, network }) => {
    mockActivityLog(network, (url) => {
      if (url.searchParams.get('category') === `${XAPI_IRI_BASE}/activity-types/bekraftelse`) {
        return {
          statements: [statement({ objectName: 'Bekraftelse-post', timestamp: minuterSedan(1) })],
          nextCursor: null,
        };
      }
      return {
        statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
        nextCursor: null,
      };
    });

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    const kategoriTrigger = page.getByRole('button', { name: 'Kategori' });
    await kategoriTrigger.focus();
    await expect(kategoriTrigger).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Bekräftelse' })).toBeVisible();
    await page.keyboard.press('Enter');

    await expect(page.getByText('Bekraftelse-post')).toBeVisible();
  });

  test('TASK-201.17 — event-dropdownens etikett kvalificerar med ort + datum, skiljer åt identiskt namngivna event', async ({
    page,
    network,
  }) => {
    // Fyndets exakta scenario (TASK-201.17-kortet, källmärkt mot staging-
    // Airtable): SAMMA kursnamn ("Fjärrskådning") körs på flera orter/datum —
    // en ÄKTA, återkommande verksamhetsform. Bar `eventNamn` gjorde dessa
    // OMÖJLIGA att skilja åt i dropdownen (32+ identiska options i staging).
    // FÄLLNINGSBEVIS: om etiketten regredierar till bar `eventNamn` matchar
    // BÅDA `getByRole('option', …)`-anropen nedan samma text — Playwrights
    // strict mode fäller testet med en "resolved to 2 elements"-krasch i
    // stället för att tyst råka klicka fel alternativ.
    mockEvents(network, [
      ev({
        id: 'rec-fjarr-skovde',
        namn: 'Fjärrskådning',
        ort: 'Skövde',
        startdatum: '2026-09-15',
      }),
      ev({
        id: 'rec-fjarr-varberg',
        namn: 'Fjärrskådning',
        ort: 'Varberg',
        startdatum: '2026-08-22',
      }),
    ]);
    mockActivityLog(network, (url) => {
      if (url.searchParams.get('eventId') === 'rec-fjarr-varberg') {
        return {
          statements: [statement({ objectName: 'Varberg-post', timestamp: minuterSedan(1) })],
          nextCursor: null,
        };
      }
      return {
        statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
        nextCursor: null,
      };
    });

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    await page.getByRole('button', { name: 'Event' }).click();
    // Båda options SKA vara synliga och SKILDA — den positiva halvan av
    // fällningsbeviset (bar `eventNamn` hade gett EN dubblerad, ej två unika,
    // accessible names).
    await expect(
      page.getByRole('option', { name: 'Fjärrskådning · Skövde · 15 sep' }),
    ).toBeVisible();
    await expect(
      page.getByRole('option', { name: 'Fjärrskådning · Varberg · 22 aug' }),
    ).toBeVisible();

    // Väljer Varberg-alternativet SPECIFIKT (inte bara "ett Fjärrskådning-
    // alternativ") och verifierar att RÄTT event-ID skickas till EF:en —
    // bevisar att etiketten inte bara är kosmetiskt unik utan faktiskt
    // navigerar till det event Lotta pekade på.
    await page.getByRole('option', { name: 'Fjärrskådning · Varberg · 22 aug' }).click();
    await expect(page.getByText('Varberg-post')).toBeVisible();
  });

  test('TASK-201.17 — identiskt namngivna event sorteras kronologiskt sinsemellan (sekundär tie-break)', async ({
    page,
    network,
  }) => {
    // Namn-sorteringen (oförändrad, primär nyckel) grupperar de tre
    // "Fjärrskådning"-alternativen ihop; utan tie-breaken hade Airtables
    // GODTYCKLIGA radordning avgjort deras inbördes ordning. Datumen läggs
    // avsiktligt OSORTERADE i mock-svaret (senast → tidigast → mitten) så
    // testet falsifierar en utebliven tie-break i stället för att råka
    // stämma med källdatats egen ordning.
    mockEvents(network, [
      ev({ id: 'rec-c', namn: 'Fjärrskådning', ort: 'Falköping', startdatum: '2026-10-01' }),
      ev({ id: 'rec-a', namn: 'Fjärrskådning', ort: 'Skövde', startdatum: '2026-08-01' }),
      ev({ id: 'rec-b', namn: 'Fjärrskådning', ort: 'Varberg', startdatum: '2026-08-22' }),
    ]);
    mockActivityLog(network, () => ({
      statements: [statement({ objectName: 'Ofiltrerad post', timestamp: minuterSedan(1) })],
      nextCursor: null,
    }));

    await page.goto('/mer/aktivitetshistorik');
    await expect(page.getByText('Ofiltrerad post')).toBeVisible();

    await page.getByRole('button', { name: 'Event' }).click();
    const etiketter = await page.getByRole('option').allTextContents();
    const fjarrEtiketter = etiketter.filter((t) => t.startsWith('Fjärrskådning'));
    expect(fjarrEtiketter).toEqual([
      'Fjärrskådning · Skövde · 1 aug',
      'Fjärrskådning · Varberg · 22 aug',
      'Fjärrskådning · Falköping · 1 okt',
    ]);
  });
});
