import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * task-18.4 — Anmälda deltagare som ARBETSKÖ (S73-facit K35–K58): summeringsrader
 * med klickfilter, kategori-flikar, Obekräftade/Bekräftade-accordions och
 * eventinfo-signalens alltid reserverade slot.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event + get-registrations —
 * samma split som 18.1/18.8: SERVER-kontraktet (deltagar-shapens fält-mappning,
 * Källa-semantiken, person-batchen) bevisas av
 * `tests/api/get-registrations.staging.test.ts` mot skarp staging; dessa e2e
 * bevisar KLIENTENS form och beteende flak-fritt utan delad staging-data.
 *
 * Täckning: summeringsradernas ordning + värden (AC #2), klickfiltret med
 * Rensa filtret, accordion-grupperingen med äldst-först/senast-först (AC #2),
 * kategori-flikarna, signal-slottens båda lägen utan geometri-hopp (AC #3),
 * avbokade räknas bort, axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const EVENT_ID = 'recDELTAGARE0001';

/** YYYY-MM-DD `n` dagar från idag. Assertionerna nedan är MEDVETET toleranta mot
 *  ±1 dags TZ-drift mellan Node och browsern (T27-klassen) — datumen ligger med
 *  bred marginal inne i respektive fönster. */
function omDagar(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Json = Record<string, unknown>;

function eventDetail(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    // Långt fram = utanför tvåveckorsfönstret → signal-slotten står TOM.
    startdatum: omDagar(60),
    slutdatum: omDagar(61),
    tidKvarTillEvent: '8 veckor',
    maxPlatser: 12,
    antalAnmalda: 4,
    platserKvar: 8,
    anmaldBelaggning: 0.33,
    bekraftadBelaggning: 0.17,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 2,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 4,
    status: 'Planerat',
    eventKey: 'Event-99',
    reserverade: 0,
    manuelltTillagda: 1,
    viaFormular: 2,
    medfoljande: 1,
    vantelista: 0,
    ...overrides,
  };
}

function registrering(overrides: Json): Json {
  return {
    id: 'recX',
    namn: null,
    fornamn: null,
    efternamn: null,
    email: null,
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: null,
    ...overrides,
  };
}

/**
 * Fyra AKTIVA anmälningar + en avbokad (som ska räknas bort överallt):
 *   Bertil  Obekräftad  06-20 (äldst av kön)   Källa Manuell
 *   Anna    Obekräftad  07-01
 *   Cecilia Bekräftad   07-05 (senast av arkivet)  bekräftelse skickad
 *   David   Bekräftad   06-25  Källa +1 · bekräftelse + eventinfo + påminnelse
 *   Eva     Avbokad/Ombokad — aldrig med i någon räkning eller lista
 */
const DELTAGARE: Json[] = [
  registrering({
    id: 'recAnna',
    namn: 'Anna Ek',
    inskickad: '2026-07-01T09:00:00.000Z',
  }),
  registrering({
    id: 'recBertil',
    namn: 'Bertil Sund',
    inskickad: '2026-06-20T09:00:00.000Z',
    kalla: 'Manuell',
  }),
  registrering({
    id: 'recCecilia',
    namn: 'Cecilia Lund',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-07-05T09:00:00.000Z',
    bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
  }),
  registrering({
    id: 'recDavid',
    namn: 'David Nord',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-06-25T09:00:00.000Z',
    kalla: '+1',
    medfoljandeTill: 'recCecilia',
    bekraftelseSkickad: '2026-06-26T09:00:00.000Z',
    deltagarinfoSkickad: '2026-07-10T09:00:00.000Z',
    betalningspaminnelseSkickad: '2026-07-08T09:00:00.000Z',
    antalGenomfordaEvent: 3,
  }),
  registrering({
    id: 'recEva',
    namn: 'Eva Sten',
    status: 'Avbokad/Ombokad',
    inskickad: '2026-06-10T09:00:00.000Z',
  }),
];

async function mocka(page: Page, event: Json, registrations: Json[] = DELTAGARE): Promise<void> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  await page.route(GET_EVENT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations }),
    });
  });
}

/** Deltagar-gruppen (rubriken står utanför kortet — sektionen bär båda). */
function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

async function oppnaEventsidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
}

test.describe('Anmälda deltagare — arbetsköns skelett (task-18.4)', () => {
  test('summeringsraderna står i Lottas utskicksordning med räknade värden (avbokade borträknade)', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // K42: bekräftelse (mail 1) → betalningspåminnelse → eventinfo (mail 2).
    // Bor över-raden SIST sedan task-18.7 (bas-fältet föddes där; denna fixtur
    // sätter ingen borOver → 0). Dess kryss-läge har egen svit event-bor-over.
    const rader = gruppen(page).locator('button[aria-pressed="false"]');
    const etiketter = await gruppen(page).locator('button[aria-pressed]').allTextContents();
    expect(etiketter).toEqual([
      'Obekräftade anmälningar2',
      'Anmälningsbekräftelse skickad2 av 4−2',
      'Betalningspåminnelse skickad1',
      'Eventinfo skickad1 av 4−3',
      'Bor över0',
    ]);
    // Alla fem står otryckta i grundläget (inget filter aktivt).
    await expect(rader).toHaveCount(5);

    // Eva (Avbokad/Ombokad) syns aldrig i kön — 4 aktiva, inte 5.
    await expect(gruppen(page).getByText('Eva Sten')).toHaveCount(0);
  });

  test('accordions: Obekräftade ÖPPEN äldst först, Bekräftade STÄNGD senast först', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const obekraftade = gruppen(page).getByRole('button', { name: 'Obekräftade (2)' });
    const bekraftade = gruppen(page).getByRole('button', { name: 'Bekräftade (2)', exact: true });

    // Inbox-fokus (K40): kön i ansiktet, arkivet ett klick bort.
    await expect(obekraftade).toHaveAttribute('aria-expanded', 'true');
    await expect(bekraftade).toHaveAttribute('aria-expanded', 'false');

    // ÄLDST FÖRST i kön: Bertil (06-20) före Anna (07-01).
    const koPanelId = await obekraftade.getAttribute('aria-controls');
    const ko = page.locator(`#${koPanelId}`);
    expect(await ko.getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
      'Anna Ek',
    ]);

    // SENAST FÖRST i arkivet: Cecilia (07-05) före David (06-25) — panelen är
    // dold tills accordionen öppnas.
    const arkivPanelId = await bekraftade.getAttribute('aria-controls');
    const arkiv = page.locator(`#${arkivPanelId}`);
    await expect(arkiv).toBeHidden();
    await bekraftade.click();
    await expect(bekraftade).toHaveAttribute('aria-expanded', 'true');
    expect(await arkiv.getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Cecilia Lund',
      'David Nord',
    ]);

    // Toggle tillbaka — accordionen stänger igen.
    await bekraftade.click();
    await expect(arkiv).toBeHidden();
  });

  test('summeringsradens klick FILTRERAR till flat lista + Rensa filtret; klick igen rensar', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const obekraftadeRad = gruppen(page).getByRole('button', {
      name: /^Obekräftade anmälningar/,
    });
    await obekraftadeRad.click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'true');

    // Accordion-rubrikerna är borta — urvalet står som flat lista.
    await expect(gruppen(page).getByRole('button', { name: 'Obekräftade (2)' })).toHaveCount(0);
    expect(await gruppen(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Anna Ek',
      'Bertil Sund',
    ]);
    const rensa = gruppen(page).getByRole('button', { name: 'Rensa filtret' });
    await expect(rensa).toBeVisible();

    // Eventinfo-raden filtrerar på dem som SAKNAR eventinfo (det åtgärdbara):
    // alla utom David.
    await gruppen(page)
      .getByRole('button', { name: /^Eventinfo skickad/ })
      .click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'false');
    expect(await gruppen(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Anna Ek',
      'Bertil Sund',
      'Cecilia Lund',
    ]);

    // Rensa filtret → accordions tillbaka.
    await rensa.click();
    await expect(gruppen(page).getByRole('button', { name: 'Obekräftade (2)' })).toBeVisible();

    // Klick på en AKTIV rad rensar också (toggle-semantiken).
    await obekraftadeRad.click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'true');
    await obekraftadeRad.click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'false');
    await expect(gruppen(page).getByRole('button', { name: 'Obekräftade (2)' })).toBeVisible();
  });

  test('kategori-flikarna filtrerar listorna; summeringarna räknar ALLTID hela eventet', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const flikar = gruppen(page).getByRole('radiogroup', { name: 'Visa deltagare' });
    await expect(flikar.getByRole('radio', { name: 'Alla (4)' })).toBeChecked();
    await expect(flikar.getByRole('radio', { name: 'Manuella (1)' })).toBeVisible();
    await expect(flikar.getByRole('radio', { name: 'Medföljande (1)' })).toBeVisible();

    // Manuella → bara Bertil (Källa 'Manuell'), och han bär sin pill.
    await flikar.getByRole('radio', { name: 'Manuella (1)' }).click();
    expect(await gruppen(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
    ]);
    await expect(gruppen(page).getByText('Manuellt tillagd')).toBeVisible();
    // Summeringarna står kvar på hela eventet (K38) — flikvalet rör bara listan.
    await expect(gruppen(page).getByRole('button', { name: /^Anmälningsbekräftelse/ })).toHaveText(
      'Anmälningsbekräftelse skickad2 av 4−2',
    );

    // Medföljande → bara David (Källa '+1'), i Bekräftade-gruppen.
    await flikar.getByRole('radio', { name: 'Medföljande (1)' }).click();
    const bekraftade = gruppen(page).getByRole('button', { name: 'Bekräftade (1)', exact: true });
    await expect(bekraftade).toBeVisible();
    await bekraftade.click();
    expect(await gruppen(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'David Nord',
    ]);
    await expect(gruppen(page).getByText('Medföljande', { exact: true })).toBeVisible();
    // Kön är tom i denna kategori — positiv rad i stället för accordion.
    await expect(gruppen(page).getByText('Inga obekräftade — alla är bekräftade.')).toBeVisible();
  });

  test('AC #3: signal-slotten renderar i BÅDA lägena med identisk geometri (badge / tom reserv)', async ({
    page,
  }) => {
    // TVÅ event-ID:n i stället för route-byte + reload: persist-hydreringen
    // serverar annars scenario 1-data under samma query-nyckel efter en reload
    // (TASK-28-fyndets klass). Skilda ID:n ⇒ skilda nycklar ⇒ inget överlapp.
    const UTANFOR = EVENT_ID;
    const INNE = 'recDELTAGARE0002';
    const perEvent: Record<string, Json> = {
      [UTANFOR]: eventDetail(),
      [INNE]: eventDetail({
        id: INNE,
        startdatum: omDagar(7),
        slutdatum: omDagar(8),
      }),
    };
    await page.route(GET_EVENT, async (route) => {
      const id = new URL(route.request().url()).searchParams.get('id') ?? UTANFOR;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: perEvent[id] ?? perEvent[UTANFOR] }),
      });
    });
    await page.route(GET_REGISTRATIONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: DELTAGARE }),
      });
    });

    // Läge 1 — utanför tvåveckorsfönstret (start om 60 dagar): TOM RESERV.
    await oppnaEventsidan(page);
    const slotTom = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slotTom).toHaveCount(1);
    await expect(gruppen(page).getByText(/Dags att skicka/)).toHaveCount(0);
    const hojdTom = (await slotTom.boundingBox())?.height;
    expect(hojdTom).toBeGreaterThan(0);

    // Läge 2 — inne i fönstret (start om 7 dagar): BADGEN tänds.
    await page.goto(`/event/${INNE}`);
    await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
    const slotBadge = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slotBadge.getByText(/^Dags att skicka/)).toBeVisible();
    const hojdBadge = (await slotBadge.boundingBox())?.height;

    // Geometrin får ALDRIG hoppa mellan lägena (L303: slotten alltid reserverad).
    expect(hojdBadge).toBe(hojdTom);

    // Slotten ligger UTANFÖR filter-knappen — interaktivt i interaktivt är förbjudet.
    const knappIslot = await slotBadge.locator('button').count();
    expect(knappIslot).toBe(0);
  });

  test('signalen tystnar när ALLA fått eventinfo, även inne i fönstret', async ({ page }) => {
    const allaFatt = DELTAGARE.map((r) =>
      r.status === 'Avbokad/Ombokad'
        ? r
        : { ...r, deltagarinfoSkickad: '2026-07-10T09:00:00.000Z' },
    );
    await mocka(page, eventDetail({ startdatum: omDagar(7), slutdatum: omDagar(8) }), allaFatt);
    await oppnaEventsidan(page);

    await expect(gruppen(page).getByRole('button', { name: /^Eventinfo skickad/ })).toHaveText(
      'Eventinfo skickad4 av 4',
    );
    await expect(gruppen(page).getByText(/Dags att skicka/)).toHaveCount(0);
    // Slotten står kvar reserverad även när signalen är släckt.
    await expect(gruppen(page).getByTestId('eventinfo-signal-slot')).toHaveCount(1);
  });

  test('tomt event: inga anmälda → lugn text, inga accordions', async ({ page }) => {
    await mocka(page, eventDetail(), []);
    await oppnaEventsidan(page);

    await expect(
      gruppen(page).getByRole('button', { name: /^Obekräftade anmälningar/ }),
    ).toHaveText('Obekräftade anmälningar0');
    await expect(gruppen(page).getByText('Inga deltagare i denna kategori.')).toBeVisible();
  });

  test('axe 0 i grundläget, i filtrerat läge och med båda accordions öppna', async ({ page }) => {
    await mocka(page, eventDetail({ startdatum: omDagar(7), slutdatum: omDagar(8) }));
    await oppnaEventsidan(page);

    const kor = async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .include('section[aria-labelledby="grupp-deltagare"]')
        .analyze();
      expect(
        results.violations,
        results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    };

    await kor();
    await gruppen(page).getByRole('button', { name: 'Bekräftade (2)', exact: true }).click();
    await kor();
    await gruppen(page)
      .getByRole('button', { name: /^Obekräftade anmälningar/ })
      .click();
    await kor();
  });
});
