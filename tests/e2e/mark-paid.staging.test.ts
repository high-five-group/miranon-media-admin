import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '../support/test-bas';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * task-18.8 — Betalningar-gruppens inline-ARBETSYTA på eventsidan (S73-facit
 * K27–K34). Ersätter Fas 5.5-svitens gamla betalnings-vy-tester — ytan
 * ersattes av arbetsytan (K27: Marcus "stanna på samma sida"); filnamnet
 * behålls som betalnings-flödets e2e-hem.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event + get-registrations +
 * update-record — mark-paid-precedentens split: SERVER-write-kontraktet
 * (allowlist deny-by-default, faktisk mutation, omläsning, restore) bevisas av
 * `tests/api/update-record.staging.test.ts` mot skarp staging; dessa e2e
 * bevisar KLIENTENS form och beteende flak-fritt utan att mutera delad
 * staging-data.
 *
 * Täckning (AC #2 + facit-avprickningen): röda saknas-deltan (minustecknet
 * bär, text-error computed), disclosure-raden, flikarna med live-räknare,
 * deadline-STATUS-BADGEN (start − 14-regeln, LÅST), kryssens optimistiska
 * live-härledning (delta + flik-flytt FÖRE nätverkssvar), noteringens
 * blur-commit, Påminn-mailikonens mailto-ämnesrad + historik-logg,
 * Ej relevant-fallet, fel-väg med rollback, tomlägen, axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const UPDATE_RECORD = '**/functions/v1/update-record';
const EVENT_ID = 'recBETALNING0001';
// Scenario 2-id för tvåscenario-testerna (S75-diagnos 2): ADR-072 persistar
// query-cachen (throttle-synk ~1 s, src/queries/persist.ts) och global
// staleTime är 5 min (router.ts) — en re-goto på SAMMA id hydreras därför ur
// scenario 1:s cache och refetchar aldrig (scenario 2:s mock nås aldrig; CI
// stabilt rött, lokalt lyckoträff). Distinkta id ger distinkta query-nycklar
// (['events','detail',id] + ['registrations', event.id]) → scenario 1-data kan
// per konstruktion aldrig servera scenario 2. OBS: scenario 2:s EVENT-mock
// måste bära id:t — registrations-nyckeln byggs ur SVARETS event.id
// (Betalningar.tsx), inte ur route-parametern.
const EVENT_ID_2 = 'recBETALNING0002';

type Mock = Record<string, unknown>;

/** Facit-koherent event (FACIT-betalningar-arbetsytan: demo-1-klassen). */
function eventMock(overrides: Mock = {}): Mock {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1 – 2026-07-31',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-07-31',
    slutdatum: '2026-08-01',
    tidKvarTillEvent: '1 vecka och 3 dagar',
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
    reserverade: 1,
    manuelltTillagda: 1,
    viaFormular: 8,
    medfoljande: 1,
    vantelista: 0,
    ...overrides,
  };
}

/** Komplett Registration som passerar RegistrationSchema (.parse i adaptern). */
function reg(id: string, namn: string, overrides: Mock = {}): Mock {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: null,
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
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    ...overrides,
  };
}

/**
 * Facit-listan (fiktiva namn — PII-regeln; FACIT-betalningar-arbetsytan):
 * 8 aktiva → 5 av 8 avgifter mottagna (−3), 2 slutbetalningar (−6);
 * Saknar betalning (6) · Klara (2). Eva har avgift-påminnelse 18 juli;
 * Sara har notering + BÅDA påminnelserna 16 juli (K34-demot).
 * En AVBOKAD rad ingår — den ska ALDRIG räknas (basens Är aktiv-regel).
 */
function facitRegistrations(): Mock[] {
  return [
    reg('recBET000000eva1', 'Eva Lindqvist', {
      paminnelseAnmalningsavgiftSkickad: '2026-07-18T09:00:00.000Z',
      personId: 'recPERSONeva0001',
    }),
    reg('recBET00000johan', 'Johan Berg'),
    reg('recBET000000sara', 'Sara Nyström', {
      noteringAnmalningsavgift: 'Lovade betala efter lönen',
      paminnelseAnmalningsavgiftSkickad: '2026-07-16T09:00:00.000Z',
      paminnelseSlutbetalningSkickad: '2026-07-16T09:05:00.000Z',
    }),
    reg('recBET00000peter', 'Peter Åkesson', {
      anmalningsavgift: 'Mottagen',
      noteringAnmalningsavgift: 'Swishade 30/6',
    }),
    reg('recBET00000maria', 'Maria Holm', { anmalningsavgift: 'Mottagen' }),
    reg('recBET0000anders', 'Anders Ek', { anmalningsavgift: 'Mottagen' }),
    reg('recBET00000karin', 'Karin Sjögren', {
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Mottagen',
      noteringAnmalningsavgift: 'Swishade 12/6',
      noteringSlutbetalning: 'Swishade 12/7',
    }),
    reg('recBET000000lars', 'Lars Öhman', {
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Mottagen',
    }),
    // Avbokad — utanför Är aktiv: syns aldrig i räkningar eller flikar.
    reg('recBET0000avbokd', 'Avbokad Person', { status: 'Avbokad/Ombokad' }),
  ];
}

async function mockSidan(
  page: Page,
  {
    event = eventMock(),
    registrations = facitRegistrations(),
  }: { event?: Mock; registrations?: Mock[] } = {},
) {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  await page.route(GET_EVENT, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event }),
    }),
  );
  await page.route(GET_REGISTRATIONS, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      // Servertrohet: get-registrations?eventId=X returnerar X:s anmälningar —
      // stämpla fixturernas eventId ur eventets id (no-op för EVENT_ID-fallen,
      // håller EVENT_ID_2-scenarierna koherenta utan call-site-brus).
      body: JSON.stringify({
        registrations: registrations.map((r) => ({ ...r, eventId: event.id })),
      }),
    }),
  );
}

/** Resolva en tokens computed-färg (probe-mönstret — token-kedjan, ej hårdkod). */
async function tokenColor(page: Page, cssVar: string): Promise<string> {
  return page.evaluate((v) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${v})`;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, cssVar);
}

// Referensklockan är BROWSERNS tidszon (playwright.config.ts: timezoneId
// 'Europe/Stockholm'), aldrig Node-processens (UTC i CI) — all datumaritmetik
// och formattering förankras därför explicit i Europe/Stockholm (S75-diagnosen:
// Node-lokal "idag" kan vara en annan kalenderdag än browserns).
const TIDSZON = 'Europe/Stockholm';

const DAGMANAD = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  timeZone: TIDSZON,
});

/** Dagens datumdelar i Europe/Stockholm — oberoende av Node-processens TZ. */
function stockholmIdag(): { ar: number; manad: number; dag: number } {
  const delar = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIDSZON,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const del = (typ: string) => Number(delar.find((p) => p.type === typ)?.value);
  return { ar: del('year'), manad: del('month'), dag: del('day') };
}

/** Startdatum `dagar` dagar från idag (Stockholm-kalenderdag) som ISO-datum. */
function startdatumOmDagar(dagar: number): { iso: string; deadlineText: string } {
  const idag = stockholmIdag();
  // Kalenderaritmetiken görs i UTC-rummet (Date.UTC normaliserar överslag);
  // UTC-midnatt formatterad i Stockholm (alltid UTC+1/+2) är samma kalenderdag.
  const start = new Date(Date.UTC(idag.ar, idag.manad - 1, idag.dag + dagar));
  const iso = start.toISOString().slice(0, 10);
  const deadline = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() - 14),
  );
  return { iso, deadlineText: DAGMANAD.format(deadline) };
}

function betalningsGrupp(page: Page) {
  return page.locator('section[aria-labelledby="grupp-betalningar"]');
}

/** Klicka ett RAC-kryss via dess LABEL (inputen är visuellt gömd — labeln är
    den verkliga träffytan; hit-target-checken fäller klick på inputen). */
async function klickaKryss(page: Page, namn: string) {
  await betalningsGrupp(page)
    .getByRole('checkbox', { name: namn })
    .locator('xpath=ancestor::label[1]')
    .click();
}

async function oppnaDetaljer(page: Page) {
  await betalningsGrupp(page).getByRole('button', { name: 'Öppna detaljer' }).click();
}

test.describe('Betalningar — kortet med saknas-deltan (task-18.8, K27)', () => {
  test('räkneraderna härleds ur anmälningarna; röda deltan med minustecken (text-error computed); avbokad räknas aldrig', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);

    const grupp = betalningsGrupp(page);
    // 8 aktiva (avbokade raden UTANFÖR): 5 avgifter mottagna, 2 slutbetalningar.
    await expect(grupp).toContainText('5 av 8 mottagna');
    await expect(grupp).toContainText('2 mottagna');

    // Deltan: minustecknet är bäraren (U+2212), rött förstärker (aldrig färg ensam).
    const deltaAvgifter = grupp.getByTestId('delta-avgifter');
    const deltaSlut = grupp.getByTestId('delta-slutbetalningar');
    await expect(deltaAvgifter).toHaveText('−3');
    await expect(deltaSlut).toHaveText('−6');

    const errorColor = await tokenColor(page, '--mm-error');
    await expect(deltaAvgifter).toHaveCSS('color', errorColor);
    await expect(deltaSlut).toHaveCSS('color', errorColor);
  });

  test('inga deltan när inget saknas; tomläge utan anmälningar saknar disclosure', async ({
    page,
  }) => {
    const klara = [
      reg('recBET00000karin', 'Karin Sjögren', {
        anmalningsavgift: 'Mottagen',
        slutbetalning: 'Mottagen',
      }),
    ];
    await mockSidan(page, { registrations: klara });
    await page.goto(`/event/${EVENT_ID}`);

    const grupp = betalningsGrupp(page);
    await expect(grupp).toContainText('1 av 1 mottagna');
    await expect(grupp.getByTestId('delta-avgifter')).toHaveCount(0);
    await expect(grupp.getByTestId('delta-slutbetalningar')).toHaveCount(0);

    // Utan anmälningar: räkneraderna kvar (0-form), ingen "Öppna detaljer".
    // DISTINKT eventId — scenario-isoleringen (se EVENT_ID_2-kommentaren):
    // re-goto på samma id hade hydrerats ur scenario 1:s persistade cache.
    await page.unrouteAll();
    await mockSidan(page, { event: eventMock({ id: EVENT_ID_2 }), registrations: [] });
    await page.goto(`/event/${EVENT_ID_2}`);
    await expect(betalningsGrupp(page)).toContainText('0 av 0 mottagna');
    await expect(betalningsGrupp(page).getByRole('button', { name: 'Öppna detaljer' })).toHaveCount(
      0,
    );
  });
});

test.describe('Betalningar — arbetsytan (task-18.8, K29–K34)', () => {
  test('disclosure öppnar arbetsytan (aria-expanded/controls); flikar med räknare; växling filtrerar', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);

    const grupp = betalningsGrupp(page);
    const toggle = grupp.getByRole('button', { name: 'Öppna detaljer' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const regionId = await toggle.getAttribute('aria-controls');
    expect(regionId).toBeTruthy();

    await toggle.click();
    const stang = grupp.getByRole('button', { name: 'Stäng detaljer' });
    await expect(stang).toHaveAttribute('aria-expanded', 'true');

    // Flikarna i familje-kapseln (radiogroup-semantik) med facit-räknarna.
    const flikar = grupp.getByRole('radiogroup', { name: 'Visa betalningar' });
    const saknarFlik = flikar.getByRole('radio', { name: 'Saknar betalning (6)' });
    const klaraFlik = flikar.getByRole('radio', { name: 'Klara (2)' });
    await expect(saknarFlik).toHaveAttribute('aria-checked', 'true');

    // Saknar-fliken: de sex med minst en obetald linje; klara syns inte.
    await expect(grupp.getByText('Eva Lindqvist')).toBeVisible();
    await expect(grupp.getByText('Peter Åkesson')).toBeVisible();
    await expect(grupp.getByText('Karin Sjögren')).toHaveCount(0);

    await klaraFlik.click();
    await expect(klaraFlik).toHaveAttribute('aria-checked', 'true');
    await expect(grupp.getByText('Karin Sjögren')).toBeVisible();
    await expect(grupp.getByText('Lars Öhman')).toBeVisible();
    await expect(grupp.getByText('Eva Lindqvist')).toHaveCount(0);
  });

  test('deadline-badgen bär start-minus-14-regeln (AC #2): lugnt läge + passerad i error', async ({
    page,
  }) => {
    // Lugnt: start om 20 dagar → deadline om 6 dagar, neutral färg.
    const lugn = startdatumOmDagar(20);
    await mockSidan(page, { event: eventMock({ startdatum: lugn.iso }) });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const badge = betalningsGrupp(page).getByTestId('betalning-deadline');
    await expect(badge).toHaveText(`Deadline ${lugn.deadlineText} · om 6 dagar`);

    // Passerad: start om 3 dagar → deadline 11 dagar sedan, error-färg.
    // DISTINKT eventId — scenario-isoleringen (se EVENT_ID_2-kommentaren):
    // re-goto på samma id hade hydrerats ur scenario 1:s persistade cache.
    await page.unrouteAll();
    const passerad = startdatumOmDagar(3);
    await mockSidan(page, { event: eventMock({ id: EVENT_ID_2, startdatum: passerad.iso }) });
    await page.goto(`/event/${EVENT_ID_2}`);
    await oppnaDetaljer(page);

    const badge2 = betalningsGrupp(page).getByTestId('betalning-deadline');
    await expect(badge2).toHaveText(`Deadline passerad · ${passerad.deadlineText}`);
    await expect(badge2).toHaveCSS('color', await tokenColor(page, '--mm-error'));
  });

  test('kryssets optimistiska live-härledning (AC #2): delta, flik-räknare och grupp-flytt FÖRE nätverkssvar; payload; aria-live', async ({
    page,
  }) => {
    await mockSidan(page);
    let releaseUpdate: () => void = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });
    let updatePayload: Record<string, unknown> | null = null;
    await page.route(UPDATE_RECORD, async (route) => {
      updatePayload = route.request().postDataJSON() as Record<string, unknown>;
      await updateGate; // flippen måste synas UTAN att vänta på svaret
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    const grupp = betalningsGrupp(page);

    // Peter: avgift klar, slut saknas → slut-krysset flyttar honom till Klara.
    await klickaKryss(page, 'Slutbetalning för Peter Åkesson');

    // FÖRE nätverkssvaret (gaten hålls): deltat 6→5, flikarna 6→5 resp. 2→3,
    // Peter borta ur Saknar-fliken — hela härledningen är live ur cachen.
    await expect(grupp.getByTestId('delta-slutbetalningar')).toHaveText('−5');
    await expect(grupp.getByRole('radio', { name: 'Saknar betalning (5)' })).toBeVisible();
    await expect(grupp.getByRole('radio', { name: 'Klara (3)' })).toBeVisible();
    await expect(grupp.getByText('Peter Åkesson')).toHaveCount(0);

    // Payload: rätt operation + serverns fält-shape.
    expect(updatePayload).toMatchObject({
      operationKey: 'mark-final-payment-paid',
      recordId: 'recBET00000peter',
      fields: { Slutbetalning: 'Mottagen' },
    });

    releaseUpdate();
    await expect(page.locator('[data-mm-announcer]')).toContainText(
      'Slutbetalning markerad som mottagen för Peter Åkesson',
    );
  });

  test('av-bock skriver Ej mottagen via avgifts-operationen och flyttar tillbaka till Saknar', async ({
    page,
  }) => {
    await mockSidan(page);
    let releaseUpdate: () => void = () => {};
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });
    let updatePayload: Record<string, unknown> | null = null;
    await page.route(UPDATE_RECORD, async (route) => {
      updatePayload = route.request().postDataJSON() as Record<string, unknown>;
      await updateGate; // återflytten måste synas UTAN att vänta på svaret
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    const grupp = betalningsGrupp(page);

    await grupp.getByRole('radio', { name: 'Klara (2)' }).click();
    await klickaKryss(page, 'Anmälningsavgift för Karin Sjögren');

    // FÖRE nätverkssvaret (gaten hålls): återflytten 2→1 och deltat −3→−4 är
    // live ur cachen. Tillståndet är TRANSIENT — onSettled-refetchen mot den
    // statiska mocken återställer pre-mutations-facit, så gaten är det enda
    // deterministiska assert-fönstret (S75-diagnosen, grann-testets mönster).
    await expect(grupp.getByRole('radio', { name: 'Klara (1)' })).toBeVisible();
    await expect(grupp.getByTestId('delta-avgifter')).toHaveText('−4');

    expect(updatePayload).toMatchObject({
      operationKey: 'mark-registration-fee-paid',
      recordId: 'recBET00000karin',
      fields: { Anmälningsavgift: 'Ej mottagen' },
    });

    releaseUpdate();
    await expect(page.locator('[data-mm-announcer]')).toContainText(
      'Anmälningsavgift markerad som ej mottagen för Karin Sjögren',
    );
  });

  test('noteringen sparas på blur via noterings-operationen med betalningens EGET fält', async ({
    page,
  }) => {
    await mockSidan(page);
    let updatePayload: Record<string, unknown> | null = null;
    await page.route(UPDATE_RECORD, async (route) => {
      updatePayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    const grupp = betalningsGrupp(page);

    const falt = grupp.getByRole('textbox', {
      name: 'Notering slutbetalning för Johan Berg',
    });
    await falt.fill('Betalar via faktura vecka 32');
    await falt.blur();

    await expect(page.locator('[data-mm-announcer]')).toContainText(
      'Notering för slutbetalning sparad för Johan Berg',
    );
    expect(updatePayload).toMatchObject({
      operationKey: 'update-registration-payment-note',
      recordId: 'recBET00000johan',
      fields: { 'Notering slutbetalning': 'Betalar via faktura vecka 32' },
    });

    // Befintlig notering renderas ur läs-shapen (facit: Sara/Lovade betala…).
    await expect(
      grupp.getByRole('textbox', { name: 'Notering anmälningsavgift för Sara Nyström' }),
    ).toHaveValue('Lovade betala efter lönen');
  });

  test('Påminn: ikon endast på obetalda linjer, mailto med betalningen i ämnesraden, klick loggar historik-rad direkt', async ({
    page,
  }) => {
    await mockSidan(page);
    let updatePayload: Record<string, unknown> | null = null;
    await page.route(UPDATE_RECORD, async (route) => {
      updatePayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    const grupp = betalningsGrupp(page);

    // K34-historiken ur läs-shapen: Eva (avgift 18 juli) + Sara (båda 16 juli).
    await expect(grupp.getByText('Påminnelse om anmälningsavgift skickad 18 juli')).toBeVisible();
    await expect(grupp.getByText('Påminnelse om slutbetalning skickad 16 juli')).toBeVisible();

    // Peters avgift är mottagen → ingen påminn-ikon på den linjen;
    // hans obetalda slutbetalning har en (ikonen följer linjen, inte personen).
    await expect(
      grupp.getByRole('link', { name: 'Påminn Peter Åkesson om anmälningsavgift via mail' }),
    ).toHaveCount(0);
    const peterSlut = grupp.getByRole('link', {
      name: 'Påminn Peter Åkesson om slutbetalning via mail',
    });
    await expect(peterSlut).toHaveAttribute(
      'href',
      `mailto:peter.åkesson@example.com?subject=${encodeURIComponent(
        'Påminnelse: slutbetalning för Resor i medvetandet 1',
      )}`,
    );

    // Klicket loggar tidsstämpeln (optimistiskt — raden syns direkt).
    await peterSlut.click();
    await expect(
      grupp.getByText(`Påminnelse om slutbetalning skickad ${DAGMANAD.format(new Date())}`),
    ).toBeVisible();
    expect(updatePayload).toMatchObject({
      operationKey: 'log-payment-reminder',
      recordId: 'recBET00000peter',
    });
    const fields = (updatePayload as { fields?: Record<string, unknown> } | null)?.fields ?? {};
    expect(typeof fields['Påminnelse slutbetalning skickad']).toBe('string');
  });

  test('Ej relevant slutbetalning: stilla textrad utan kryss/notering/påminn; räknas som klar', async ({
    page,
  }) => {
    const lista = [
      reg('recBET0000forela', 'Föreläsnings Person', {
        anmalningsavgift: 'Mottagen',
        slutbetalning: 'Ej relevant (för föreläsningar)',
      }),
      reg('recBET00000johan', 'Johan Berg'),
    ];
    await mockSidan(page, { registrations: lista });
    await page.goto(`/event/${EVENT_ID}`);

    const grupp = betalningsGrupp(page);
    // Slutbetalnings-deltat räknar INTE Ej relevant: bara Johan saknas (−1).
    await expect(grupp.getByTestId('delta-slutbetalningar')).toHaveText('−1');

    await oppnaDetaljer(page);
    await grupp.getByRole('radio', { name: 'Klara (1)' }).click();
    await expect(grupp.getByText('Föreläsnings Person')).toBeVisible();
    await expect(grupp.getByText('Slutbetalning · Ej relevant (föreläsning)')).toBeVisible();
    await expect(
      grupp.getByRole('checkbox', { name: 'Slutbetalning för Föreläsnings Person' }),
    ).toHaveCount(0);
    await expect(
      grupp.getByRole('link', { name: 'Påminn Föreläsnings Person om slutbetalning via mail' }),
    ).toHaveCount(0);
  });

  test('fel-väg: update-record 500 → rollback av delta/flik + MessageBox med Fel-ID', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.route(UPDATE_RECORD, (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal', requestId: 'req-18-8-test' }),
      }),
    );

    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    const grupp = betalningsGrupp(page);

    await klickaKryss(page, 'Slutbetalning för Peter Åkesson');

    // Rollback: deltat åter −6, Peter kvar i Saknar-fliken; felet synligt med Fel-ID.
    const alertBox = grupp.getByRole('alert').filter({ hasText: 'Kunde inte uppdatera' });
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText('req-18-8-test');
    await expect(grupp.getByTestId('delta-slutbetalningar')).toHaveText('−6');
    await expect(grupp.getByRole('radio', { name: 'Saknar betalning (6)' })).toBeVisible();
    // exact: felrubriken bär också namnet — här avses radens namn-element.
    await expect(grupp.getByText('Peter Åkesson', { exact: true })).toBeVisible();
  });

  test('tomläge i fliken: alla har betalat', async ({ page }) => {
    const klara = [
      reg('recBET00000karin', 'Karin Sjögren', {
        anmalningsavgift: 'Mottagen',
        slutbetalning: 'Mottagen',
      }),
    ];
    await mockSidan(page, { registrations: klara });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const grupp = betalningsGrupp(page);
    await expect(grupp.getByRole('radio', { name: 'Saknar betalning (0)' })).toBeVisible();
    await expect(grupp.getByText('Alla anmälda har betalat.')).toBeVisible();
  });

  test('axe 0 på öppen arbetsyta (nya mönster: kryss, flikar, badge, historik)', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    await expect(betalningsGrupp(page).getByRole('radiogroup')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
