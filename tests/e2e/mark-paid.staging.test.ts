import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '../support/test-bas';
import { mockTommaAnteckningar } from './helpers/tomma-anteckningar';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * TASK-145.4 — Betalningsytan: blockets rivning, inflytten och läsyte-formen.
 *
 * Ersätter task-18.8:s svit för samma arbetsyta. Filnamnet behålls
 * ("mark-paid") som betalnings-flödets e2e-hem, men SUBJEKTET har flyttat på
 * TVÅ sätt sedan förra formen:
 *
 * 1. Betalningar är INTE längre ett eget toppnivå-block
 *    (`section[aria-labelledby="grupp-betalningar"]`, PRD TASK-145 § AC #1)
 *    — arbetsytan är inflyttad som fällbar LÄSYTA under registret, inuti
 *    "Anmälda deltagare" (`section[aria-labelledby="grupp-deltagare"]`).
 * 2. Ytan är INTE längre skrivbar. PRD TASK-145 § Implementationsbeslut
 *    river K27-anden öppet ("Lotta lämnar inte sidan för avprickning"):
 *    "en halv redigerbarhet (kryssa ja, skriva nej) är en sämre gräns än
 *    ingen alls." BÅDA betalnings-kryssen, noteringsredigeringen och
 *    Påminn-knappen flyttar till Åtgärds-sidan (TASK-147, ej byggd).
 *    Följaktligen är de gamla SKRIV-testerna (kryssets optimistiska
 *    live-härledning, av-bock, notering-blur-save, Påminn+mailto+historik-
 *    logg, fel-väg-rollback) INTE uppdaterade till nya lokatorer — de är
 *    KONVERTERADE till sin motsats: mekaniska bevis att ytan INTE kan
 *    skriva (DoD #7). Att låtsas testa ett skrivflöde som inte längre
 *    existerar vore otillförlitligt, inte bevarad täckning.
 *
 * "Betalningar — kortet med saknas-deltan"-sviten (de gamla `delta-avgifter`/
 * `delta-slutbetalningar`-testid-testerna mot `BetalningsInnehall`s egen
 * `<dl>`) är RIVEN i sin helhet, inte konverterad: den underliggande summan
 * (avgifter/slutbetalningar mottagna, röda deltan, avbokad-exkludering) är
 * SAMMA formel (`betalningsSplit()`, delad) som TASK-145.1/145.2:s
 * summeringsblock (`HallplatsToppA`) redan renderar ovillkorligt på
 * produktionens eventsida och redan har täckning för
 * (`tests/e2e/event-bor-over.staging.test.ts`, `Anmälningsavgifter…mottagna`-
 * assertionen). Ett duplicerat test mot ett element som inte längre
 * existerar (`BetalningsInnehall`s `<dl>`, borta med toppblocket) hade
 * bevisat samma sanning en gång till, inte utökat täckningen.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt). Deterministisk via
 * `page.route`-mock av get-event + get-registrations + update-record —
 * SERVER-write-kontraktet prövas mot skarp staging i
 * `tests/api/update-record.staging.test.ts`; dessa e2e bevisar klientens
 * form och beteende flak-fritt utan att mutera delad staging-data.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const UPDATE_RECORD = '**/functions/v1/update-record';
const EVENT_ID = 'recBETALNING0001';
// Scenario 2-id för tvåscenario-testerna (S75-diagnos 2): ADR-072 persistar
// query-cachen (throttle-synk ~1 s, src/queries/persist.ts) och global
// staleTime är 5 min (router.ts) — en re-goto på SAMMA id hydreras därför ur
// scenario 1:s cache och refetchar aldrig. Distinkta id ger distinkta
// query-nycklar (['events','detail',id] + ['registrations', event.id]) →
// scenario 1-data kan per konstruktion aldrig servera scenario 2.
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

/** Komplett Registration som passerar RegistrationSchema (.parse i adaptern).
    Samtliga status='Bekräftad (mail skickat)' som DEFAULT — registrets steg-
    hinkar (TASK-145.1) sorterar annars obekräftade överst, vilket är
    korrekt men ovidkommande brus för denna sviten fokus (betalningsytan). */
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
    status: 'Bekräftad (mail skickat)',
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
 * Saknar betalning (6) · Klara (2). Sara har notering (K34-demot: läs-
 * texten). En AVBOKAD rad ingår — den ska ALDRIG räknas (basens Är
 * aktiv-formel) och ska aldrig synas i "Öppna detaljer"-listan.
 */
function facitRegistrations(): Mock[] {
  return [
    reg('recBET000000eva1', 'Eva Lindqvist', { personId: 'recPERSONeva0001' }),
    reg('recBET00000johan', 'Johan Berg'),
    reg('recBET000000sara', 'Sara Nyström', {
      noteringAnmalningsavgift: 'Lovade betala efter lönen',
    }),
    reg('recBET00000peter', 'Peter Åkesson', { anmalningsavgift: 'Mottagen' }),
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
    // Avbokad — utanför Är aktiv: syns aldrig i räkningar, register eller arbetsyta.
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
  // Anteckningar-gruppen (task-18.11) fetchar get-event-notes för VARJE event —
  // stubbas tom via delade sömmen (TASK-47, tidigare TASK-205/TASK-212) så
  // eventsidans övriga sviter förblir deterministiska.
  await mockTommaAnteckningar(page);
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

/** "Anmälda deltagare"-gruppen — arbetsytan är nu INFLYTTAD häri (AC #1/#2),
    inte längre ett eget `grupp-betalningar`-toppblock. */
function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

/** Den fällbara betalnings-arbetsytan SPECIFIKT (Deltagare.tsx:s
    `#deltagare-betalningsdetaljer`) — scopar bort registrets EGNA kort/namn
    så en persons namn i registret inte förväxlas med samma namn i
    arbetsytans egen person-rad. */
function arbetsytan(page: Page) {
  return page.locator('#deltagare-betalningsdetaljer');
}

async function oppnaDetaljer(page: Page) {
  await gruppen(page).getByRole('button', { name: 'Öppna detaljer' }).click();
}

/** En persons EGEN rad inuti den öppna arbetsytan. */
function personRad(page: Page, namn: string) {
  return arbetsytan(page).locator('li').filter({ hasText: namn });
}

test.describe('Betalningsytan — disclosure, flikar, deadline (TASK-145.4 AC #2/#3)', () => {
  test('disclosure öppnar arbetsytan (aria-expanded/controls); flikar med räknare; växling filtrerar', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);

    const grupp = gruppen(page);
    const toggle = grupp.getByRole('button', { name: 'Öppna detaljer' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const regionId = await toggle.getAttribute('aria-controls');
    expect(regionId).toBe('deltagare-betalningsdetaljer');

    await toggle.click();
    const stang = grupp.getByRole('button', { name: 'Stäng detaljer' });
    await expect(stang).toHaveAttribute('aria-expanded', 'true');

    // Flikarna i familje-kapseln (radiogroup-semantik) med facit-räknarna.
    const flikar = arbetsytan(page).getByRole('radiogroup', { name: 'Visa betalningar' });
    const saknarFlik = flikar.getByRole('radio', { name: 'Saknar betalning (6)' });
    const klaraFlik = flikar.getByRole('radio', { name: 'Klara (2)' });
    await expect(saknarFlik).toHaveAttribute('aria-checked', 'true');

    // Saknar-fliken: de sex med minst en obetald linje; klara syns inte.
    await expect(personRad(page, 'Eva Lindqvist')).toBeVisible();
    await expect(personRad(page, 'Peter Åkesson')).toBeVisible();
    await expect(personRad(page, 'Karin Sjögren')).toHaveCount(0);

    await klaraFlik.click();
    await expect(klaraFlik).toHaveAttribute('aria-checked', 'true');
    await expect(personRad(page, 'Karin Sjögren')).toBeVisible();
    await expect(personRad(page, 'Lars Öhman')).toBeVisible();
    await expect(personRad(page, 'Eva Lindqvist')).toHaveCount(0);

    // Avbokad Person syns ALDRIG i arbetsytan (Är aktiv-formeln, oförändrad).
    await expect(arbetsytan(page).getByText('Avbokad Person')).toHaveCount(0);
  });

  test('deadline-badgen bär start-minus-14-regeln: lugnt läge + passerad i error', async ({
    page,
  }) => {
    // Lugnt: start om 20 dagar → deadline om 6 dagar, neutral färg.
    const lugn = startdatumOmDagar(20);
    await mockSidan(page, { event: eventMock({ startdatum: lugn.iso }) });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const badge = arbetsytan(page).getByTestId('betalning-deadline');
    await expect(badge).toHaveText(`Deadline ${lugn.deadlineText} · om 6 dagar`);

    // Passerad: start om 3 dagar → deadline 11 dagar sedan, error-färg.
    await page.unrouteAll();
    const passerad = startdatumOmDagar(3);
    await mockSidan(page, { event: eventMock({ id: EVENT_ID_2, startdatum: passerad.iso }) });
    await page.goto(`/event/${EVENT_ID_2}`);
    await oppnaDetaljer(page);

    const badge2 = arbetsytan(page).getByTestId('betalning-deadline');
    await expect(badge2).toHaveText(`Deadline passerad · ${passerad.deadlineText}`);
    await expect(badge2).toHaveCSS('color', await tokenColor(page, '--mm-error'));
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

    await expect(
      arbetsytan(page).getByRole('radio', { name: 'Saknar betalning (0)' }),
    ).toBeVisible();
    await expect(arbetsytan(page).getByText('Alla anmälda har betalat.')).toBeVisible();
  });

  test('utan aktiva anmälningar: ingen "Öppna detaljer" (arbetsytan har inget att visa)', async ({
    page,
  }) => {
    await mockSidan(page, { event: eventMock({ id: EVENT_ID_2 }), registrations: [] });
    await page.goto(`/event/${EVENT_ID_2}`);
    await expect(gruppen(page).getByRole('button', { name: 'Öppna detaljer' })).toHaveCount(0);
  });
});

test.describe('Betalningsytan — LÄSYTA, mekaniskt bevisad (TASK-145.4 AC #5/#9/#10, DoD #7)', () => {
  test('kryssen är ALLTID inaktiverade — DoD #7: noll skriv-affordanser', async ({ page }) => {
    await mockSidan(page);
    let updateCalled = false;
    await page.route(UPDATE_RECORD, async (route) => {
      updateCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    // Samtliga kryssrutor på ytan (bägge flikarna) är `isDisabled` — mekaniskt
    // bevisat, inte antaget: en RAC Checkbox med isDisabled sätter native
    // `disabled` på sin underliggande input (Playwrights `toBeDisabled()`).
    const kryssenSaknar = arbetsytan(page).getByRole('checkbox');
    const antalSaknar = await kryssenSaknar.count();
    expect(antalSaknar).toBeGreaterThan(0);
    for (let i = 0; i < antalSaknar; i++) {
      await expect(kryssenSaknar.nth(i)).toBeDisabled();
    }

    // Det andra, STARKARE beviset (samma metod README:s review-fix-våg redan
    // etablerade för proto-läget): Playwright VÄGRAR klicka ett disabled
    // element — ett genuint klickförsök timeoutar i stället för att lyckas.
    let klicketTimeoutade = false;
    try {
      await arbetsytan(page)
        .getByRole('checkbox', { name: 'Anmälningsavgift för Peter Åkesson' })
        .locator('xpath=ancestor::label[1]')
        .click({ timeout: 2000 });
    } catch {
      klicketTimeoutade = true;
    }
    expect(klicketTimeoutade).toBe(true);

    // Klara-fliken (den andra av-prickningsformen — "Ej relevant" har inget
    // kryss alls, se eget test) bär samma egenskap.
    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    const kryssenKlara = arbetsytan(page).getByRole('checkbox');
    const antalKlara = await kryssenKlara.count();
    expect(antalKlara).toBeGreaterThan(0);
    for (let i = 0; i < antalKlara; i++) {
      await expect(kryssenKlara.nth(i)).toBeDisabled();
    }

    expect(updateCalled).toBe(false);
  });

  test('noteringen renderas som LÄSTEXT — inget redigerbart fält finns (AC #5)', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    // De arton tomma <Input>-fälten (våg 10) är rivna för gott — noll
    // textboxar kvar på hela ytan, i BÅDA flikarna.
    await expect(arbetsytan(page).getByRole('textbox')).toHaveCount(0);
    await expect(
      personRad(page, 'Sara Nyström').getByText('Lovade betala efter lönen'),
    ).toBeVisible();

    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    await expect(arbetsytan(page).getByRole('textbox')).toHaveCount(0);
    await expect(personRad(page, 'Karin Sjögren').getByText('Swishade 12/6')).toBeVisible();
    await expect(personRad(page, 'Karin Sjögren').getByText('Swishade 12/7')).toBeVisible();
  });

  test('Påminn-ikonen/mailto-länken finns inte längre — utskicket flyttar till Åtgärds-sidan', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    // Ingen mailto:-länk kvar NÅGONSTANS på ytan (BÅDA flikarna) — Påminn
    // (K33-slotten) är riven ur läsyte-formen, inte bara dolt.
    await expect(arbetsytan(page).locator('a[href^="mailto:"]')).toHaveCount(0);
    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    await expect(arbetsytan(page).locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('Mottagen-pillen visar ordet UTAN datum — Väg C (AC #10): domänmodellen bär ännu inget mottagen-datum-fält', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();

    // Karin har BÅDA betalningarna mottagna — pillen renderar exakt
    // "Mottagen" (inget datum-suffix; PROTO_MOTTAGEN_DATUM är riven, och
    // TASK-147 äger det riktiga fältet). EXAKT text, inte ett substrings-
    // match, så ett smugglat datum hade fällt testet.
    const karin = personRad(page, 'Karin Sjögren');
    await expect(karin.getByText('Mottagen', { exact: true })).toHaveCount(2);
  });

  test('höger-slotten ("Saknas"/plain "Mottagen" som EGEN redundant rad) finns inte — krysset bär statusen (AC #9)', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    // "Saknas" som ord förekommer INGENSTANS på ytan — den gamla höger-
    // slotten sa det, krysset (obockat) säger det nu ensamt.
    await expect(arbetsytan(page).getByText('Saknas', { exact: true })).toHaveCount(0);

    // Obetalda personer bär INGEN "Mottagen"-pill (bara krysset, obockat).
    await expect(personRad(page, 'Eva Lindqvist').getByText('Mottagen')).toHaveCount(0);
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
    await oppnaDetaljer(page);

    await arbetsytan(page).getByRole('radio', { name: 'Klara (1)' }).click();
    const rad = personRad(page, 'Föreläsnings Person');
    await expect(rad).toBeVisible();
    await expect(rad.getByText('Slutbetalning · Ej relevant (föreläsning)')).toBeVisible();
    await expect(
      rad.getByRole('checkbox', { name: 'Slutbetalning för Föreläsnings Person' }),
    ).toHaveCount(0);
  });

  test('axe 0 på öppen arbetsyta (bägge flikarna)', async ({ page }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);
    await expect(
      arbetsytan(page).getByRole('radiogroup', { name: 'Visa betalningar' }),
    ).toBeVisible();

    const resultsSaknar = await new AxeBuilder({ page }).analyze();
    expect(resultsSaknar.violations).toEqual([]);

    await arbetsytan(page).getByRole('radio', { name: 'Klara (2)' }).click();
    const resultsKlara = await new AxeBuilder({ page }).analyze();
    expect(resultsKlara.violations).toEqual([]);
  });
});

test.describe('Utskickshistoriken som Tidslinje (TASK-145.4 AC #8)', () => {
  test('utskicken renderas som Tidslinje med KLOCKSLAG — inte som klump i en värde-slot', async ({
    page,
  }) => {
    const lista = [
      reg('recBET000000eva1', 'Eva Lindqvist', {
        status: 'Bekräftad (mail skickat)',
        paminnelseAnmalningsavgiftSkickad: '2026-07-18T09:15:00.000Z',
      }),
    ];
    await mockSidan(page, { registrations: lista });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    const eva = personRad(page, 'Eva Lindqvist');
    // Text och tid är SKILDA noder (Tidslinje.tsx) — texten bär, tiden mutad
    // under, med klockslag (inte bara dag+månad som registrets kort).
    await expect(eva.getByText('Påminnelse om anmälningsavgift', { exact: true })).toBeVisible();
    // sv-SE Intl-formatet lägger "kl." mellan datum och klockslag ("18 juli
    // kl. 11:15") — mätt i renderad DOM, inte antaget.
    await expect(eva.getByText(/18 juli kl\. \d{2}:\d{2}/)).toBeVisible();
  });

  test('tom logg: frånvaron sägs rakt ut, ingen klump-rad', async ({ page }) => {
    const lista = [reg('recBET00000johan', 'Johan Berg', { status: 'Bekräftad (mail skickat)' })];
    await mockSidan(page, { registrations: lista });
    await page.goto(`/event/${EVENT_ID}`);
    await oppnaDetaljer(page);

    await expect(
      personRad(page, 'Johan Berg').getByText(
        'Utskickslogg visas här - inget skickat ännu till denna person',
      ),
    ).toBeVisible();
  });
});
