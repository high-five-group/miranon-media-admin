import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * Manuell anmälan-sidan: task-18.12 (skarpa formen) + task-18.18 (eventväljaren).
 *
 * task-18.18 (S83 pass 4-facit, Marcus-låst 2026-07-24): sidan får en EVENTVÄLJARE
 * överst — förvald med djuplänkens event, öppningsbar med sök + månadsgrupperad
 * lista för att byta event. Väljarens stängda läge bär B-formens kontextrad
 * (kursfärgs-prick + namn font-medium + ort + kollapsat datumspann) och ERSÄTTER
 * den råa eventlabel-raden (AC #2: rå eventlabel borta ur UI:t). Route-semantiken
 * (beslut a/13): byte navigerar URL:en till /event/$eventId/ny-anmalan; tomt läge
 * bor på tunna /anmalan/ny (samma komponent). Formulär-state BEHÅLLS vid byte
 * (beslut b/14 — ingen remount vid param-byte).
 *
 * ACCEPTANCE-KLASSEN (task-59.6, ADR-080): filen flyttades hit ur e2e-sviten med
 * hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade. Klassningen är
 * HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 43 restanrop,
 * samtliga typsnitt, noll skarpa. Filen är skivans anropstyngsta.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstren byggs med `EF(namn)`
 * ur handlers-modulen och svaren med `json(...)`, aldrig som handskrivna strängar
 * — en överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler). Att
 * `EF('get-event')` och `EF('get-events')` är två SKILDA mönster är samma
 * diskriminator som bär `get-person`/`get-persons` i normalläget: MSW matchar
 * HELA sista path-segmentet, inte en prefix-substräng.
 *
 * VERBEN ÄR VERIFIERADE mot appens anropsväg, inte antagna: `get-event`/
 * `get-events` går via `callEdgeFunction` (GET), `create-registration` via
 * `postEdgeFunction` (POST). Ett fel verb här hade fallit igenom till normalläget
 * (get-events finns där) eller till vakten (create-registration finns inte där).
 *
 * `create-registration` SKRIVER INTE SKARPT: anropet är avlyssnat, och det som
 * bevisas är klientflödet plus PAYLOADEN appen skickar — fältuppsättningen,
 * eventId-bytet och idempotensnyckelns rotation (ADR-059; F4/F7). Server-write-
 * kontraktet bevisas av `tests/api/create-registration.staging.test.ts` och ligger
 * kvar där — filen är INTE i denna diff. Handlern är AVSIKTLIGT inte i normalläget:
 * en delad skrivväg hade gjort tyst lyckad mutation till default för hela klassen.
 *
 * Listmockens datum ligger i 2099 (events-list-precedenten): kommande-filtret
 * jämför mot klockan — här fixturvärldens frusna FROZEN_NOW (2026-09-15) — och
 * testet får aldrig åldras till rött.
 */

const EVENT_ID = 'recNYANM0000001';
const HOST_ID = 'recNYANMHOST0002';
const FJARR_ID = 'recNYANMFJARR003';

/**
 * Härledda ur schemana, ej beskrivna bredvid dem (TASK-63) — se `acceptance-bas.ts`
 * § fogen. Filen mockar TVÅ EF:er med olika svarsform, så det tidigare gemensamma
 * `Row`-aliaset delas: ett `Record<string, unknown>` kunde bära båda, en härledd
 * typ kan inte — och ska inte.
 */
type EventRow = z.infer<typeof EventSchema>;
type RegRow = z.infer<typeof RegistrationSchema>;

function eventRow(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: EVENT_ID,
    eventlabel: 'RIM 1 (e2e)',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2099-07-31',
    slutdatum: '2099-08-01',
    tidKvarTillEvent: '1 vecka',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 5,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 6,
    status: 'Planerat',
    eventKey: 'Event-21',
    ...overrides,
  };
}

/** Komplett get-events-rad (EF-svarets form — EventSchema .parse:as i adaptern).
    `vantelista` MEDVETET utelämnad: bara get-event aggregerar den (ADR-078
    beslut 2 — listposten är partiell). */
function listRow(o: {
  id: string;
  namn: string;
  ort?: string | null;
  startdatum: string | null;
  slutdatum?: string | null;
  typ?: string | null;
  // Bunden till schemat, inte till `string` (TASK-63): EventSchema.status är en
  // z.enum över EventStatus, så ett stavfel här fälls av typcheckaren.
  status?: EventRow['status'];
}): EventRow {
  return {
    id: o.id,
    eventlabel: `${o.namn} (label)`,
    eventNamn: o.namn,
    typ: o.typ !== undefined ? o.typ : 'Utbildning',
    ort: o.ort !== undefined ? o.ort : 'Skövde',
    startdatum: o.startdatum,
    slutdatum: o.slutdatum ?? o.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: o.status ?? 'Planerat',
    borOverAntal: 0,
  };
}

/** Väljarlistan: djuplänkens event (juli/aug 2099) + två bytesmål + ett
    passerat event (2000) som kommande-filtret ska sålla bort. */
const LIST_EVENTS: EventRow[] = [
  listRow({
    id: EVENT_ID,
    namn: 'Resor i medvetandet 1',
    startdatum: '2099-07-31',
    slutdatum: '2099-08-01',
  }),
  listRow({
    id: FJARR_ID,
    namn: 'Fjärrskådning',
    startdatum: '2099-08-15',
    slutdatum: '2099-08-16',
  }),
  listRow({
    id: HOST_ID,
    namn: 'Höstretreat',
    ort: 'Mullsjö',
    startdatum: '2099-09-12',
    slutdatum: '2099-09-13',
  }),
  listRow({ id: 'recGAMMAL0000004', namn: 'Passerat event', startdatum: '2000-01-15' }),
];

function registrationRow(overrides: Partial<RegRow> = {}): RegRow {
  return {
    id: 'recANMSKAPAD0001',
    namn: 'Ny Manuell',
    fornamn: 'Ny',
    efternamn: 'Manuell',
    email: 'ny@example.se',
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: null,
    slutbetalning: null,
    betalningspaminnelseSkickad: null,
    inskickad: '2026-07-23T09:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 3,
    notering: 'Ringde in — betalar via faktura.',
    eventId: EVENT_ID,
    personId: null,
    ...overrides,
  };
}

interface MockOptions {
  createStatus?: number;
  eventOverrides?: Partial<EventRow>;
}

function mockEndpoints(
  network: NetworkFixture,
  { createStatus = 201, eventOverrides = {} }: MockOptions = {},
): {
  /** Senaste POST-kroppen mot create-registration (null = aldrig nådd). */
  senaste: () => Record<string, unknown> | null;
  /** Samtliga POST-kroppar i ordning (nyckelrotations-beviset, F7). */
  alla: () => Record<string, unknown>[];
} {
  const createBodies: Record<string, unknown>[] = [];

  network.use(
    http.get(EF('get-event'), ({ request }) => {
      // Sammanfattningens detalj-svar per event-ID (bytet hämtar NYTT id).
      const id = new URL(request.url).searchParams.get('id');
      const rad =
        id === HOST_ID
          ? listRow({
              id: HOST_ID,
              namn: 'Höstretreat',
              ort: 'Mullsjö',
              startdatum: '2099-09-12',
              slutdatum: '2099-09-13',
            })
          : eventRow(eventOverrides);
      return json({ event: rad });
    }),

    http.get(EF('get-events'), () => json({ events: LIST_EVENTS })),

    http.post(EF('create-registration'), async ({ request }) => {
      createBodies.push((await request.json()) as Record<string, unknown>);
      if (createStatus === 201) {
        const created = registrationRow();
        return json({ registration: created, record: { id: created.id, fields: {} } }, 201);
      }
      return json(
        {
          error: 'Personen är redan anmäld till eventet',
          existingName: 'Ny Manuell',
          requestId: 'req_test_409',
        },
        createStatus,
      );
    }),
  );

  return {
    senaste: () => createBodies[createBodies.length - 1] ?? null,
    alla: () => createBodies,
  };
}

/** Väljarens trigger — accessibla namnet bär "Välj event" (Select-etiketten). */
function valjarTrigger(page: Page) {
  return page.getByRole('button', { name: /Välj event/ });
}

test.describe('Manuell anmälan-sidan — skarp (task-18.12)', () => {
  test('renderar per facit: formklassen + sex fält + väljaren i stället för eventlabel-raden', async ({
    page,
    network,
  }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // h1 = sidrubriken (fokuserad efter mount).
    const heading = page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' });
    await expect(heading).toBeVisible();

    // Väljarens stängda läge bär eventets identitet (B-formens kontextrad);
    // den RÅA eventlabeln är borta ur UI:t (task-18.18 AC #2, punkt 11-fyndet).
    await expect(valjarTrigger(page)).toContainText('Resor i medvetandet 1');
    await expect(page.getByText('RIM 1 (e2e)')).toHaveCount(0);

    // Chevron tillbaka till eventet.
    const back = page.getByRole('link', { name: 'Tillbaka till eventet' });
    await expect(back).toHaveAttribute('href', `/event/${EVENT_ID}`);

    // Grupprubrikerna (DetaljGrupp).
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Anmälan' })).toBeVisible();

    // Facit-formens sex fält. MÄRKNINGS-REGELN (K84, review-våg 7): normen är
    // att fältet krävs → markera UNDANTAGEN, inte normen.
    await expect(page.getByLabel('Förnamn', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Efternamn', { exact: true })).toBeVisible();
    await expect(page.getByLabel('E-post', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Mobilnummer (valfritt)')).toBeVisible();
    await expect(page.getByLabel('Antal platser')).toBeVisible();
    await expect(page.getByLabel('Notering (valfritt)')).toBeVisible();

    // Ingen "(obligatorisk)"-text får finnas kvar någonstans på sidan.
    await expect(page.getByText('(obligatorisk)')).toHaveCount(0);

    // Knappraden: primär först.
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avbryt' })).toBeVisible();
  });

  test('fyll → submit 201 → bekräftelseläge (POST bär antalPlatser + notering)', async ({
    page,
    network,
  }) => {
    const skapade = mockEndpoints(network, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    await page.getByLabel('E-post', { exact: true }).fill('ny@example.se');
    await page.getByLabel('Mobilnummer (valfritt)').fill('070-1234567');
    // Antal platser: default 1 → öka till 3 via stepparen (RAC NumberField).
    await page.getByRole('button', { name: 'Öka' }).click();
    await page.getByRole('button', { name: 'Öka' }).click();
    await page.getByLabel('Notering (valfritt)').fill('Ringde in — betalar via faktura.');

    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    // Bekräftelseläget ersätter formuläret.
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeHidden();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();
    await expect(page.getByText('Anmälan sparad')).toBeVisible();

    // BEKRÄFTELSE-COPYN MOT BELÄGGNINGS-MODELLEN (review-våg 7): domänens ord —
    // platserna RESERVERADE, anmälan OBEKRÄFTAD tills bekräftelsen skickas.
    await expect(
      page.getByText('Ny Manuell är anmäld och har 3 platser reserverade.', { exact: false }),
    ).toBeVisible();
    await expect(page.getByText(/obekräftad tills du skickar bekräftelsen/i)).toBeVisible();
    await expect(page.getByText('källan Manuell')).toHaveCount(0);

    await expect(page.getByRole('button', { name: 'Tillbaka till eventet' })).toBeVisible();

    // POST-kroppen bar de nya fälten (Källa/EventKey/Event sätts server-side, ej i kroppen).
    const body = skapade.senaste();
    expect(body?.fornamn).toBe('Ny');
    expect(body?.efternamn).toBe('Manuell');
    expect(body?.email).toBe('ny@example.se');
    expect(body?.antalPlatser).toBe(3);
    expect(body?.notering).toBe('Ringde in — betalar via faktura.');
    expect(typeof body?.idempotencyKey).toBe('string');
  });

  test('409 (dubblett) → inline-fel, formuläret kvar', async ({ page, network }) => {
    mockEndpoints(network, { createStatus: 409 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    await page.getByLabel('E-post', { exact: true }).fill('ny@example.se');
    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    await expect(page.getByRole('alert')).toContainText('redan anmäld');
    // Formuläret kvar (ingen bekräftelse).
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    await expect(page.getByTestId('bekraftelse')).toBeHidden();
  });

  test('required-validering: tom e-post → fält-fel, ingen submit', async ({ page, network }) => {
    const skapade = mockEndpoints(network, { createStatus: 201 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    // E-post lämnas tom.
    await page.getByRole('button', { name: 'Spara anmälan' }).click();

    await expect(page.getByText('Fyll i en giltig e-postadress')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toBeVisible();
    // create-registration aldrig nådd.
    expect(skapade.senaste()).toBeNull();
  });

  test('axe 0 violations på den skarpa formen', async ({ page, network }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('Eventväljaren på manuell anmälan-sidan (task-18.18)', () => {
  test('förval från djuplänken: Eventet-blocket FÖRST med kontextrad + sammanfattning', async ({
    page,
    network,
  }) => {
    mockEndpoints(network, { eventOverrides: { vantelista: 3 } });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // Väljaren är FÖRVALD med djuplänkens event: kontextraden bär namn +
    // ort + KOLLAPSAT datumspann (B-formen). Rå eventlabel aldrig i UI:t.
    const trigger = valjarTrigger(page);
    await expect(trigger).toContainText('Resor i medvetandet 1');
    await expect(trigger).toContainText('Skövde');
    await expect(trigger).toContainText('31 juli - 1 augusti 2099');
    await expect(page.getByText('RIM 1 (e2e)')).toHaveCount(0);

    // Eventet-blocket ligger FÖRE Deltagare (facit punkt 1: "är detta rätt
    // event?" är Lottas första fråga vid djuplänk).
    const block = page.getByTestId('eventet-block');
    await expect(block).toBeVisible();
    const blockBox = await block.boundingBox();
    const deltagareBox = await page
      .getByRole('heading', { level: 2, name: 'Deltagare' })
      .boundingBox();
    expect(blockBox).not.toBeNull();
    expect(deltagareBox).not.toBeNull();
    expect((blockBox?.y ?? 0) + (blockBox?.height ?? 0)).toBeLessThan(deltagareBox?.y ?? 0);

    // Breddpariteten (facit punkt 2): kortet har INGEN egen mx — samma bredd
    // som DetaljGrupps kort (renderad verifiering, DOM-mätt 0-diff).
    const gruppBox = await page.getByTestId('grupp-kort').first().boundingBox();
    expect(blockBox?.width).toBe(gruppBox?.width);

    // Sammanfattningen bär bara det som påverkar handlingen (punkt 4):
    // Typ · Platser kvar. Status TYST när Planerat (normen får inget märke).
    await expect(block.getByText('Typ')).toBeVisible();
    await expect(block.getByText('Utbildning')).toBeVisible();
    await expect(block.getByText('Platser kvar')).toBeVisible();
    await expect(block.getByText('4 av 12')).toBeVisible();
    await expect(block.getByText('Status')).toHaveCount(0);

    // Beläggningsstapeln (punkt 5): listkortets enkla form, aria-hidden dekor,
    // bredd = antalAnmalda/maxPlatser (8/12 → 67%).
    const fyllnad = block.locator('[data-slot="belaggning-fyllnad"]');
    await expect(fyllnad).toHaveAttribute('style', /width: 67%/);

    // Väntelistan (villkorad, punkt 4+11): bara get-event aggregerar den —
    // raden ligger SIST bland sammanfattningsraderna och renderas när
    // detalj-datat landat med värde > 0.
    await expect(block.getByText('Väntelista')).toBeVisible();
    await expect(block.getByText('3', { exact: true })).toBeVisible();

    // Sekundär navigering längst ned (punkt 6): nedtonad vikt — text-small
    // (14 px) + INTE font-medium (renderad verifiering av navigerings-vikten).
    const detaljLank = block.getByRole('link', { name: /Gå till eventdetaljer/ });
    await expect(detaljLank).toHaveAttribute('href', `/event/${EVENT_ID}`);
    const lankStil = await detaljLank.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, fontWeight: s.fontWeight };
    });
    expect(lankStil.fontSize).toBe('14px');
    expect(Number(lankStil.fontWeight)).toBeLessThan(500);
  });

  test('fast bredd (facit-komplettering, Marcus-beslut 2026-07-25): stängda triggern spänner över hela blocket med symmetriska marginaler', async ({
    page,
    network,
  }) => {
    // Bredden var aldrig låst i S83-facitet — triggern växte med innehållet.
    // Beslutet: full blockbredd, samma inset höger som vänster (kortets px-4);
    // chevronen står vid triggerns högerkant (ml-auto).
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    const trigger = valjarTrigger(page);
    await expect(trigger).toContainText('Resor i medvetandet 1');
    const blockBox = await page.getByTestId('eventet-block').boundingBox();
    const triggerBox = await trigger.boundingBox();
    expect(blockBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();

    const vanster = (triggerBox?.x ?? 0) - (blockBox?.x ?? 0);
    const hoger =
      (blockBox?.x ?? 0) +
      (blockBox?.width ?? 0) -
      ((triggerBox?.x ?? 0) + (triggerBox?.width ?? 0));
    // Kortets inner-inset på VÄNSTER (px-4 = 16 px + kortets 1 px
    // transparenta kant som ingår i boundingBox = 17) — och SAMMA på höger
    // (symmetrin ÄR Marcus-beslutet).
    expect(vanster).toBeCloseTo(17, 0);
    expect(hoger).toBeCloseTo(vanster, 0);

    // Chevronen vid högerkanten: triggerns px-4 (16 px) + triggerns egen
    // 1 px-kant i boundingBox = 17 — SAMMA inset som vänster (`vanster` ovan),
    // sedan EventValjare bytte default till 'fristaende' och rev
    // 'kontextrad' (TASK-394, Marcus 2026-09-04: "Vi har infört den 'stora'
    // på typ alla ställen, eller det SKA vara den stora på alla ställen.").
    // Talet var 15 (kontextradens px-3.5 = 14 px + 1) fram till stämpeln
    // 2026-09-05 ("Eventväljaren ser bra ut.") — se
    // tasks/sessions/bilagor/s111-anmalningssidan-konvergens/AMENDERING-2026-09-05-eventvaljarens-stora-form.md.
    const chevronBox = await trigger.locator('svg.lucide-chevrons-up-down').boundingBox();
    expect(
      (triggerBox?.x ?? 0) +
        (triggerBox?.width ?? 0) -
        ((chevronBox?.x ?? 0) + (chevronBox?.width ?? 0)),
    ).toBeCloseTo(17, 0);
  });

  test('sökfältet får fokus på BÅDA öppningsvägarna (Marcus våg 2-regression 2026-07-25): mus-klick och tangentbord', async ({
    page,
    network,
  }) => {
    // Prototyp-regressionen: skarpa byggets rAF-fokus var ett race mot RAC:s
    // egen öppnings-fokusering (grönt i e2e, fokus-tapp i verkligheten).
    // Läkt med autoFocus-propen på SearchField (React Arias dokumenterade
    // Select+Autocomplete-form) — här låses BÅDA interaktionsvägarna.
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // Musvägen.
    await valjarTrigger(page).click();
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();

    // RING-DETERMINISMEN (Marcus våg 3 2026-07-25): fokusringen ska SYNAS
    // instant vid mus-öppning — inte bero på modalitets-heuristiken (tre
    // samverkande base.css-regler gav "ibland ring"-flimret; läkt med
    // .mm-fokusring-vid-fokus, specificitets-placerad över alla tre).
    // Computed-bevis i personsökrutans exakta form: 2px solid --mm-focus-ring.
    await expect(sok).toHaveCSS('outline-style', 'solid');
    await expect(sok).toHaveCSS('outline-color', 'rgb(27, 73, 101)');

    // Grå rensa-krysset (Marcus våg 3): RAC:s clear-Button i appens ikonform
    // — native webkit-blå kryss undanstyrt; knappen dold vid tomt fält,
    // synlig + text-muted-grå med innehåll.
    const rensa = page.getByRole('button', { name: 'Rensa sökningen' });
    await expect(rensa).toBeHidden();
    await sok.fill('resor');
    await expect(rensa).toBeVisible();
    await expect(rensa).toHaveCSS('color', 'rgb(107, 107, 107)');
    await rensa.click();
    await expect(sok).toHaveValue('');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('event-valjare-popover')).toHaveCount(0);

    // Tangentbordsvägen: fokus på triggern (RAC:s fokus-retur efter Escape)
    // → Enter öppnar → fältet har fokus — och ringen står även här.
    await expect(valjarTrigger(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(sok).toBeFocused();
    await expect(sok).toHaveCSS('outline-style', 'solid');
  });

  test('popovern matchar den fasta full-bredds-triggern (form B, Marcus 2026-07-25): bredd och vänsterkant', async ({
    page,
    network,
  }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    const trigger = valjarTrigger(page);
    await expect(trigger).toContainText('Resor i medvetandet 1');
    const trigBox = await trigger.boundingBox();
    await trigger.click();

    // width = var(--trigger-width) (> min-w-golvet här: triggern är full
    // blockbredd sedan våg 1) + placement="bottom start" ⇒ popovern ligger
    // exakt under triggern, aldrig högerförskjuten utanför innehållet.
    const popover = page.getByTestId('event-valjare-popover');
    await expect(popover).toBeVisible();
    const popBox = await popover.boundingBox();
    expect(Math.abs((popBox?.x ?? 0) - (trigBox?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(popBox?.width ?? 0).toBeCloseTo(trigBox?.width ?? 0, 0);
  });

  test('status ≠ Planerat får sitt märke; väntelista-raden borta vid 0', async ({
    page,
    network,
  }) => {
    mockEndpoints(network, { eventOverrides: { status: 'Flyttat' } });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    const block = page.getByTestId('eventet-block');
    await expect(block.getByText('Status')).toBeVisible();
    await expect(block.getByText('Flyttat')).toBeVisible();
    // Ingen väntelista i detalj-svaret → ingen rad (aldrig falsk nolla ur
    // placeholder — ADR-078 beslut 2).
    await expect(block.getByText('Väntelista')).toHaveCount(0);
  });

  test('öppna väljaren: sökfältet får fokus, listan är månadsgrupperad kommande (närmast först)', async ({
    page,
    network,
  }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await valjarTrigger(page).click();

    // Fokus flyttas till sökfältet när listan öppnas (facit punkt 8 —
    // programmatiskt, aldrig autoFocus-attributet).
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();

    // Månadsgruppering i EventsLists EGEN form (punkt 9): "Juli 2099" —
    // versal först, ALDRIG ALL CAPS (S83 pass 4-fångst #1).
    await expect(page.getByText('Juli 2099', { exact: true })).toBeVisible();
    await expect(page.getByText('Augusti 2099', { exact: true })).toBeVisible();
    await expect(page.getByText('September 2099', { exact: true })).toBeVisible();

    // Kommande event, närmast först (punkt 10); passerade sållas bort.
    const options = page.getByRole('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toContainText('Resor i medvetandet 1');
    await expect(options.nth(1)).toContainText('Fjärrskådning');
    await expect(options.nth(2)).toContainText('Höstretreat');
    await expect(page.getByRole('option', { name: /Passerat event/ })).toHaveCount(0);

    // Alternativraden bär B-formens kontextrad: kollapsat spann inom månaden.
    await expect(options.nth(1)).toContainText('15-16 augusti 2099');
  });

  test('sök matchar namn ELLER ort', async ({ page, network }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);
    await valjarTrigger(page).click();

    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    // Ort-träff ("mullsjö", skiftlägesokänsligt) → bara Höstretreat kvar.
    await sok.pressSequentially('mullsjö');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option').first()).toContainText('Höstretreat');

    // Namn-träff.
    await sok.clear();
    await sok.pressSequentially('Fjärr');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option').first()).toContainText('Fjärrskådning');
  });

  test('byte navigerar URL:en och BEHÅLLER ifyllda personfält (beslut a + b)', async ({
    page,
    network,
  }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    // Fyll persondata FÖRE bytet — samma person till annat event är ett
    // verkligt flöde (beslut b: BEHÅLL; rensa är ett knapptryck).
    await page.getByLabel('Förnamn', { exact: true }).fill('Lotta');
    await page.getByLabel('E-post', { exact: true }).fill('lotta@example.se');

    await valjarTrigger(page).click();
    await page.getByRole('option', { name: /Höstretreat/ }).click();

    // Route-semantiken (beslut a/13): URL:en alltid sann och delbar.
    await expect(page).toHaveURL(`/event/${HOST_ID}/ny-anmalan`);

    // Väljaren bär nu det nya eventets identitet.
    await expect(valjarTrigger(page)).toContainText('Höstretreat');
    await expect(valjarTrigger(page)).toContainText('Mullsjö');

    // Formulär-staten överlevde bytet (ingen remount vid param-byte).
    await expect(page.getByLabel('Förnamn', { exact: true })).toHaveValue('Lotta');
    await expect(page.getByLabel('E-post', { exact: true })).toHaveValue('lotta@example.se');
  });

  test('tangentbordsvägen: pil ned + Enter väljer (AT-skärpan, punkt 8)', async ({
    page,
    network,
  }) => {
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await valjarTrigger(page).click();
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();
    await sok.pressSequentially('Höst');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(`/event/${HOST_ID}/ny-anmalan`);
    await expect(valjarTrigger(page)).toContainText('Höstretreat');
  });

  test('AT-kontraktet: virtuell fokus — DOM-fokus i fältet, aria-activedescendant pekar på det aktiva alternativet (punkt 8)', async ({
    page,
    network,
  }) => {
    // Mekaniska delen av facitets AT-krav (USWDS-fyndens riskyta är exakt
    // aria-activedescendant-wiringen — axe ser den inte). Det MANUELLA
    // VoiceOver-passet är bokfört som Marcus-moment på kortet.
    mockEndpoints(network);
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await valjarTrigger(page).click();
    const sok = page.getByRole('searchbox', { name: 'Sök event eller ort' });
    await expect(sok).toBeFocused();

    await page.keyboard.press('ArrowDown');
    // DOM-fokus står KVAR i sökfältet (virtuell fokus, inte fokusflytt).
    await expect(sok).toBeFocused();
    // Det virtuella fokuset annonseras via aria-activedescendant. Startpunkten
    // är det VALDA alternativet (combobox-mönstret) → första pil ned landar på
    // NÄSTA kommande event efter djuplänkens.
    //
    // ASSERTIONEN GÅR MOT DET VÄNTADE ALTERNATIVETS ID (task-64) — inte mot att
    // "något id finns". Skillnaden är hela poängen: `aria-activedescendant` är
    // MÄTT SATT REDAN FÖRE pil ned (det pekar då på djuplänkens eget alternativ),
    // så en `getAttribute` direkt efter tangenttrycket hinner läsa FÖREGÅENDE
    // värde — och en ren närvaro-koll (t.ex. mot /.+/) hade passerat på det gamla
    // värdet utan att vänta in att wiringen flyttat. Bara en assertion mot det
    // väntade id:t retryar tills flytten faktiskt skett.
    //
    // Id:t LÄSES av, gissas inte: React Aria genererar det. Läsningen är säker
    // eftersom listan redan är öppen och alternativet asserterat synligt — och
    // skulle den ändå ge fel värde kan jämförelsen nedan bara bli RÖD, aldrig
    // falskt grön. (Playwright: använd toHaveAttribute framför getAttribute.)
    const fjarrAlternativ = page.getByRole('option', { name: /Fjärrskådning/ });
    await expect(fjarrAlternativ).toBeVisible();
    const fjarrId = (await fjarrAlternativ.getAttribute('id')) ?? '';
    expect(fjarrId).toBeTruthy();
    await expect(sok).toHaveAttribute('aria-activedescendant', fjarrId);

    // Pil ned igen → nästa alternativ (wiringen följer med).
    await page.keyboard.press('ArrowDown');
    const hostAlternativ = page.getByRole('option', { name: /Höstretreat/ });
    await expect(hostAlternativ).toBeVisible();
    const hostId = (await hostAlternativ.getAttribute('id')) ?? '';
    expect(hostId).toBeTruthy();
    // Värdet FLYTTADE — samma påstående som den tidigare id-jämförelsen bar.
    expect(hostId).not.toBe(fjarrId);
    await expect(sok).toHaveAttribute('aria-activedescendant', hostId);
  });

  test('bytet nollställer mutations-utfall och roterar idempotensnyckeln (ADR-059; F4/F7)', async ({
    page,
    network,
  }) => {
    const skapade = mockEndpoints(network, { createStatus: 409 });
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);

    await page.getByLabel('Förnamn', { exact: true }).fill('Ny');
    await page.getByLabel('Efternamn', { exact: true }).fill('Manuell');
    await page.getByLabel('E-post', { exact: true }).fill('ny@example.se');
    await page.getByRole('button', { name: 'Spara anmälan' }).click();
    await expect(page.getByRole('alert')).toContainText('redan anmäld');

    // Byt event → utfallet från event A får inte stå kvar under event B.
    await valjarTrigger(page).click();
    await page.getByRole('option', { name: /Höstretreat/ }).click();
    await expect(page).toHaveURL(`/event/${HOST_ID}/ny-anmalan`);
    await expect(page.getByRole('alert')).toHaveCount(0);

    // Ny submit mot B: kroppen bär B:s eventId och en NY idempotensnyckel
    // (en nyckel per skapa-intention — samma nyckel mot annat event vore en
    // felklassad replay).
    await page.getByRole('button', { name: 'Spara anmälan' }).click();
    await expect(page.getByRole('alert')).toContainText('redan anmäld');
    const alla = skapade.alla();
    expect(alla).toHaveLength(2);
    expect(alla[0]?.eventId).toBe(EVENT_ID);
    expect(alla[1]?.eventId).toBe(HOST_ID);
    expect(typeof alla[1]?.idempotencyKey).toBe('string');
    expect(alla[1]?.idempotencyKey).not.toBe(alla[0]?.idempotencyKey);
  });

  test('tomt läge (/anmalan/ny): väljaren står FRISTÅENDE, formuläret renderas INTE (punkt 7 + 13)', async ({
    page,
    network,
  }) => {
    mockEndpoints(network);
    await page.goto('/anmalan/ny');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Lägg till manuell anmälan' }),
    ).toBeVisible();

    // Progressive disclosure: en kontroll som inte är tillämplig förrän ett
    // val gjorts DÖLJS — resten av formuläret finns inte i DOM:en.
    await expect(valjarTrigger(page)).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toHaveCount(0);
    await expect(page.getByLabel('Förnamn', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Spara anmälan' })).toHaveCount(0);

    // Välj event → navigerar in i den nästlade routen och avslöjar formuläret.
    await valjarTrigger(page).click();
    await page.getByRole('option', { name: /Fjärrskådning/ }).click();
    await expect(page).toHaveURL(`/event/${FJARR_ID}/ny-anmalan`);
    await expect(page.getByRole('heading', { level: 2, name: 'Deltagare' })).toBeVisible();
    await expect(page.getByLabel('Förnamn', { exact: true })).toBeVisible();
  });

  test('axe 0 violations: öppen väljare (scopat) + tomt läge (helsides)', async ({
    page,
    network,
  }) => {
    mockEndpoints(network);

    // Tomt läge — helsidesskan.
    await page.goto('/anmalan/ny');
    await expect(valjarTrigger(page)).toBeVisible();
    const tomt = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(tomt.violations).toEqual([]);

    // Öppen väljare — scopad skan (ComboBox-mönstermallens scope-not: RAC:s
    // ariaHideOutside ger helsides-false-positive på aria-hidden-focus för
    // icke-modala popovers; det interaktiva skannas i stället).
    await page.goto(`/event/${EVENT_ID}/ny-anmalan`);
    await valjarTrigger(page).click();
    await expect(page.getByRole('searchbox', { name: 'Sök event eller ort' })).toBeFocused();
    const oppen = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[data-testid="eventet-block"]')
      .include('[data-testid="event-valjare-popover"]')
      .analyze();
    expect(oppen.violations).toEqual([]);
  });
});
