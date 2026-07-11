import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * Hem-vyn (task-1.3 A-skelettet → task-4.2 K10-facit-strukturen → task-4.3
 * facit-korten → task-4.4 anmälningslistan). Uppifrån och ned: hälsningskort
 * (h1 "Hej {namn}" utan utropstecken; återbesök i sessionen visar bara namnet
 * [B2]; "Mina sidor"-platshållarknapp ersätter uppdatera-kontrollen [B5]) →
 * Nästa event (primär-tint, HELA kortet klickbart till eventets detaljsida;
 * dagar-kvar-pill, metagrupp med ikoner, beläggningsstapel) bredvid Obetalda
 * anmälningsavgifter (BARA antalet, task-4.3) → helbredds-listkortet "Nya
 * anmälningar att hantera" (koppar-kontur + varningsikon; ~25 senaste i
 * rullbar zebra-lista; raden bär namn / joinad event-identitet / relativ tid;
 * rad-klick → EVENTETS sida [B1]; rad utan event olänkad med "Utan event") →
 * stor helbredds-CTA sist. INGEN separat "Hem"-rubrik (AC #6): hälsningen ÄR
 * sidans h1 → h1-assertions matchar /^Hej/ (miljö-neutralt: namn-delen styrs
 * av sessionens display-namn, task-1.1).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av EF:erna. Regex-matchare som inte
 * kolliderar: `get-registrations` och `get-events` är unika delsträngar
 * (get-events matchar inte get-event, get-registrations matchar inte
 * create-registration); `get-event\?` (klick-testet) matchar inte get-events.
 * Mockarna speglar EF-svaren `{ registrations: [...] }` / `{ events: [...] }`
 * (Registration.schema / Event.schema-rader → adapterns `.parse()` passerar).
 *
 * Täckning: A-skelettets rendering (senaste anmälningar recency-sorterat,
 * nästa event temporalt, obetalda-antal stort), hälsnings-h1, klick-ytorna
 * (helkorts-klick AC #2, rad-klick + "Utan event" AC #3), CTA→/event,
 * tom-state per card, fel (4xx role=alert, no-retry), axe 0. INGEN
 * h1-auto-fokus-assertion: /hem är default-landningsytan → containern flyttar
 * INTE fokus (skip-link-först-tab-ordning, speglar EventsList; se Hem.tsx +
 * shell DoD 2).
 */

const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations/;
const GET_EVENTS = /\/functions\/v1\/get-events/;
const GET_EVENT = /\/functions\/v1\/get-event\?/;

/** Sidrubriken = hälsningen (AC #6) — namn-delen är miljöberoende → prefix-match. */
const H1_HALSNING = /^Hej/;

type Row = Record<string, unknown>;

/** En komplett Registration-rad (EF-svarets form, Registration.schema). */
function reg(overrides: Row = {}): Row {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent1',
    personId: 'recPerson1',
    ...overrides,
  };
}

/** En komplett Event-rad (EF-svarets form, Event.schema). */
function ev(overrides: Row = {}): Row {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'RIM1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

async function mock(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  {
    registrations = [],
    events = [],
    regStatus = 200,
    eventStatus = 200,
  }: { registrations?: Row[]; events?: Row[]; regStatus?: number; eventStatus?: number } = {},
) {
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: regStatus,
      contentType: 'application/json',
      body: regStatus === 200 ? JSON.stringify({ registrations }) : JSON.stringify({ error: 'x' }),
    });
  });
  await page.route(GET_EVENTS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: eventStatus,
      contentType: 'application/json',
      body: eventStatus === 200 ? JSON.stringify({ events }) : JSON.stringify({ error: 'x' }),
    });
  });
}

test.describe('Hem — A-skelettet (task-1.3)', () => {
  test('A-skelettet renderas: hälsnings-h1, kort med data, CTA', async ({ page }) => {
    await mock(page, {
      registrations: [
        reg({ fornamn: 'Carl', efternamn: 'Carlsson', inskickad: '2026-06-22T10:00:00.000Z' }),
        reg({ fornamn: 'Bo', efternamn: 'Bengtsson', inskickad: '2026-06-21T10:00:00.000Z' }),
        reg({
          fornamn: 'Disa',
          efternamn: 'Dahl',
          inskickad: '2026-06-20T10:00:00.000Z',
          anmalningsavgift: 'Ej mottagen',
        }),
      ],
      events: [
        ev({ eventNamn: 'Förbi-event', startdatum: '2020-01-01' }), // dåtid → ej "nästa"
        ev({ id: 'recEvent1', eventNamn: 'Resor i medvetandet 1', startdatum: '2099-06-01' }),
      ],
    });
    await page.goto('/hem');

    // <h1> = hälsningen (AC #6 — ingen separat "Hem"-rubrik). Ingen
    // fokus-assertion: landningsytan stjäl inte fokus.
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hem' })).toHaveCount(0);

    // Nya anmälningar: senaste namn (recency via Inskickad); raden är en LÄNK
    // till EVENTETS sida (B1, task-4.4) och metaraden bär den JOINADE
    // event-identiteten "kurs · ort · kortdatum" ur eventlistan (B4) — inte
    // längre radens råa Inskickad-datum.
    await expect(page.getByRole('link', { name: /Carl Carlsson/ })).toBeVisible();
    await expect(page.getByText('Resor i medvetandet 1 · Skövde · 1 jun').first()).toBeVisible();

    // Nästa event: temporalt valt (kommande, ej dåtids-eventet); namn-länk.
    // exact: true — rad-länkarnas accessible name INNEHÅLLER eventnamnet
    // (substräng-default hade gett strict-mode-dubbelträff mot raderna).
    await expect(
      page.getByRole('link', { name: 'Resor i medvetandet 1', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Förbi-event')).toHaveCount(0);

    // Obetalda: en rad har "Ej mottagen" → antalet stort och ENSAMT
    // (K10-facit, task-4.3 — namnraden utgick). Region-scope bevisar att
    // siffran ligger i RÄTT card (strict-mode-säkert mot andra siffror).
    const obetalda = page.getByRole('region', { name: 'Obetalda anmälningsavgifter' });
    await expect(obetalda.getByText('1', { exact: true })).toBeVisible();

    // CTA → samlade anmälningslistan (task-1.4 AC #2; chevronen är
    // aria-hidden → rent namn). Eventlistan nås via tabbaren (beslut 7).
    await expect(page.getByRole('link', { name: 'Visa alla anmälningar' })).toHaveAttribute(
      'href',
      '/mer/anmalningar',
    );

    // Mina sidor-platshållaren ersätter uppdatera-kontrollen (B5, task-4.2;
    // poll-lagret bär färskheten ensamt — ADR-017 Updates-noten).
    await expect(page.getByRole('button', { name: 'Mina sidor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Uppdatera översikt' })).toHaveCount(0);
  });

  test('AC 2 — klick var som helst på Nästa event-kortet → eventets detaljsida', async ({
    page,
  }) => {
    await mock(page, {
      registrations: [reg()],
      events: [ev({ id: 'recEventNasta', eventNamn: 'Resor i medvetandet 1' })],
    });
    // Detaljsidan hämtar get-event vid landning → mocka för deterministisk render.
    await page.route(GET_EVENT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: ev({ id: 'recEventNasta' }) }),
      });
    });
    await page.goto('/hem');

    const kort = page.getByRole('region', { name: 'Nästa event' });
    // Klicka i kortets övre vänstra hörn — INTE på länktexten — för att bevisa
    // att HELA kort-ytan är länk-yta (stretched link, AC #2).
    await kort.click({ position: { x: 12, y: 12 } });
    await expect(page).toHaveURL(/\/event\/recEventNasta/);
  });

  test('task-4.4 AC 2 — klick på anmälningsrad → EVENTETS sida (B1)', async ({ page }) => {
    // B1 (öppen revidering av TASK-1 beslut 4/G1a): radklicket landar på
    // eventets DETALJSIDA — inte anmälda-undervyn.
    await mock(page, {
      registrations: [reg({ fornamn: 'Carl', efternamn: 'Carlsson', eventId: 'recEvent1' })],
      events: [ev({ id: 'recEvent1' })],
    });
    // Detaljsidan hämtar get-event vid landning → mocka för deterministisk render.
    await page.route(GET_EVENT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: ev({ id: 'recEvent1' }) }),
      });
    });
    await page.goto('/hem');

    await page.getByRole('link', { name: /Carl Carlsson/ }).click();
    await expect(page).toHaveURL(/\/event\/recEvent1$/);
  });

  test('task-1.4 AC 2 — Hem-CTA:n landar på samlade anmälningslistan', async ({ page }) => {
    await mock(page, { registrations: [reg()], events: [ev()] });
    await page.goto('/hem');

    await page.getByRole('link', { name: 'Visa alla anmälningar' }).click();
    await expect(page).toHaveURL(/\/mer\/anmalningar$/);
    // Listan renderar mot samma get-registrations-mock (delad event-lös gren).
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
  });

  test('task-4.4 AC 2 — rad utan event-koppling är olänkad och visar "Utan event"', async ({
    page,
  }) => {
    await mock(page, {
      registrations: [reg({ fornamn: 'Eva', efternamn: 'Ek', eventId: null, eventNamn: null })],
      events: [ev()],
    });
    await page.goto('/hem');

    const lista = page.getByRole('region', { name: 'Nya anmälningar att hantera' });
    await expect(lista.getByText('Eva Ek')).toBeVisible();
    await expect(lista.getByText(/Utan event/)).toBeVisible();
    await expect(lista.getByRole('link')).toHaveCount(0);
  });

  test('tomma listor → vänliga tom-texter per card, inga fel', async ({ page }) => {
    await mock(page, { registrations: [], events: [] });
    await page.goto('/hem');

    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
    await expect(page.getByText('Inga kommande event.')).toBeVisible();
    // Obetalda-facitet (task-4.3): tomt = antalet "0" ensamt — ingen undertext.
    await expect(
      page.getByRole('region', { name: 'Obetalda anmälningsavgifter' }).getByText('0', {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('endast dåtida event → "Inga kommande event"', async ({ page }) => {
    await mock(page, {
      registrations: [reg()],
      events: [ev({ startdatum: '2020-01-01' })],
    });
    await page.goto('/hem');
    await expect(page.getByText('Inga kommande event.')).toBeVisible();
  });

  test('get-registrations 4xx → fel-UI (role=alert) i anmälnings-cards, event-card opåverkat', async ({
    page,
  }) => {
    // 4xx = klient-fel → no-retry-grenen (speglar 6c). Båda anmälnings-cards delar
    // queryn → båda visar alert; event-cardet (separat query, 200) renderar fint.
    await mock(page, { regStatus: 404, events: [ev({ eventNamn: 'Resor i medvetandet 1' })] });
    await page.goto('/hem');

    await expect(page.getByRole('alert').first()).toContainText('Kunde inte hämta anmälningar');
    await expect(page.getByRole('link', { name: 'Resor i medvetandet 1' })).toBeVisible();
  });

  test('axe 0 violations på den renderade Hem-vyn', async ({ page }) => {
    await mock(page, {
      registrations: [reg({ anmalningsavgift: 'Ej mottagen' }), reg()],
      events: [ev()],
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

/**
 * Hälsningen (task-1.1 — namnkällan): display-namnet läses ur inloggnings-
 * kontots user_metadata (Supabase-sessionen i localStorage, seedad av
 * auth.setup via storageState). Hermetiskt via addInitScript-patch av den
 * lagrade sessionen — assertionerna är oberoende av staging-kontots faktiska
 * metadata (T26-klassen: miljö-beroende assertions är sköra). Patchen körs
 * FÖRE app-boot, så getSession() läser det patchade värdet.
 */
function patchStoredDisplayName(page: Page, displayName: string | null) {
  return page.addInitScript((name) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (!session?.user) continue;
      session.user.user_metadata = { ...session.user.user_metadata };
      if (name === null) delete session.user.user_metadata.display_name;
      else session.user.user_metadata.display_name = name;
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, displayName);
}

test.describe('Hälsningen (task-1.1 — namnkällan ur kontots metadata)', () => {
  test('display-namn i sessionen → h1 "Hej {namn}"', async ({ page }) => {
    // 'Lotta' speglar staging-kontots faktiska display-namn — en (osannolik)
    // mitt-i-testet token-refresh, där server-sanningen ersätter patchen, kan
    // då inte flippa texten. Hälsningen är sidans h1 (task-1.3 AC #6);
    // UTAN utropstecken sedan K10-facitet (task-4.2).
    await patchStoredDisplayName(page, 'Lotta');
    await mock(page);
    await page.goto('/hem');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hej Lotta', exact: true }),
    ).toBeVisible();
  });

  test('utan display-namn → neutral hälsning, aldrig e-postadressen', async ({ page }) => {
    await patchStoredDisplayName(page, null);
    await mock(page);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: 'Hej', exact: true })).toBeVisible();
    // E-posten är ALDRIG fallback (AC 2, Gunilla-principen). auth.setup
    // hard-failar utan TEST_USER_EMAIL → tom sträng här är ett riggfel.
    const email = process.env.TEST_USER_EMAIL ?? '';
    expect(email).not.toBe('');
    await expect(page.getByText(email)).toHaveCount(0);
  });
});

test.describe('Hem polling (Fas 6d L2 — ADR-017 + erratum)', () => {
  // RefreshButton-invalidate-testet borttaget med kontrollen (B5, task-4.2):
  // manuella uppdatera-vägen finns inte längre — poll-lagret (testet nedan)
  // är färskhetens enda bärare (ADR-017 Updates-noten).

  test('refetchInterval (60s) triggar polling-refetch — falsk klocka', async ({ page }) => {
    // page.clock fakar timers → vi kan avancera förbi 60s-intervallet deterministiskt
    // utan att vänta i realtid. refetchIntervalInBackground:false pausar bara när
    // fliken är dold; i testet är document synligt → intervallet är aktivt.
    await page.clock.install();
    let evCalls = 0;
    await page.route(GET_REGISTRATIONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [reg()] }),
      });
    });
    await page.route(GET_EVENTS, async (route) => {
      evCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [ev()] }),
      });
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect.poll(() => evCalls).toBe(1); // initial hämtning

    // Avancera förbi 60s → refetchInterval fyrar en polling-refetch.
    await page.clock.fastForward(61_000);
    await expect.poll(() => evCalls).toBeGreaterThan(1);
  });
});

/**
 * task-4.3 — Nästa event + Obetalda till K10-facit (S55 Del 12). Renderad
 * verifiering per L246: computed-style/boxmätning, aldrig enbart klass-närvaro.
 * Facit-formerna: dagar-kvar som VIT pill topp-höger med tre EXAKTA former;
 * metagrupp text-small med kartnåls-/kalenderikon och långdatum; kortrubrik
 * text-xl semibold mörk; beläggningsstapel (vit track, primär-dämpad fyllnad)
 * vars andel matchar X/Y; Obetalda anmälningsavgifter BARA antalet text-3xl.
 */
test.describe('Nästa event + Obetalda till facit (task-4.3)', () => {
  test('AC 1 — dagar-kvar-pillen: tre exakta former, vit pill topp-höger', async ({ page }) => {
    // Fast klocka (setFixedTime): "idag" pinnas → datum-aritmetiken kan inte
    // glida över midnatt mitt i testet (TASK-3-klassen: inga lastkänsliga
    // tidsfönster). Timers löper vidare — bara Date.now/new Date() pinnas.
    const nu = new Date();
    await page.clock.setFixedTime(nu);
    const datumOmDagar = (dagar: number): string => {
      const d = new Date(nu);
      d.setDate(d.getDate() + dagar);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    };

    const fall = [
      { dagar: 71, text: '71 dagar kvar' },
      { dagar: 1, text: '1 dag kvar' },
      { dagar: 0, text: 'Idag' },
    ] as const;

    for (const { dagar, text } of fall) {
      // Senast registrerade route vinner → varje varv styr sitt eget EF-svar.
      await mock(page, { registrations: [], events: [ev({ startdatum: datumOmDagar(dagar) })] });
      await page.goto('/hem');
      const kort = page.getByRole('region', { name: 'Nästa event' });
      const pill = kort.getByText(text, { exact: true });
      await expect(pill).toBeVisible();

      // Renderad facit-verifiering (L246): VIT pill (--mm-surface), rundad,
      // i kortets övre högra hörn (top-4/right-4 = 16 px inset).
      const stil = await pill.evaluate((el) => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, radie: s.borderRadius };
      });
      expect(stil.bg).toBe('rgb(255, 255, 255)');
      expect(stil.radie).not.toBe('0px');
      const kortBox = await kort.boundingBox();
      const pillBox = await pill.boundingBox();
      if (!kortBox || !pillBox) throw new Error('boundingBox saknas för pill-mätningen');
      expect(Math.abs(pillBox.y - (kortBox.y + 16))).toBeLessThanOrEqual(1.5);
      const kortHogerInner = kortBox.x + kortBox.width - 16;
      expect(Math.abs(kortHogerInner - (pillBox.x + pillBox.width))).toBeLessThanOrEqual(1.5);
    }
  });

  test('AC 2+3 — metagrupp med ikoner + långdatum; EN länk-yta; kortrubriken text-xl semibold mörk RENDERAT', async ({
    page,
  }) => {
    await mock(page, {
      registrations: [],
      events: [
        ev({
          eventNamn: 'Fjärrskådning',
          ort: 'Skövde',
          startdatum: '2099-09-15',
          antalAnmalda: 5,
          maxPlatser: 20,
        }),
      ],
    });
    await page.goto('/hem');
    const kort = page.getByRole('region', { name: 'Nästa event' });

    // Kortrubriken RENDERAT (computed-style, AC #3): text-xl (20px) semibold
    // (600), mörk (--mm-text #242424), sentence case utan text-transform.
    const rubrik = kort.getByRole('heading', { level: 2, name: 'Nästa event' });
    const rubrikStil = await rubrik.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, vikt: s.fontWeight, farg: s.color, transform: s.textTransform };
    });
    expect(rubrikStil).toEqual({
      storlek: '20px',
      vikt: '600',
      farg: 'rgb(36, 36, 36)',
      transform: 'none',
    });

    // Metagruppen (text-small): eventnamnet är länken i medium — 14px/500.
    const namn = kort.getByRole('link', { name: 'Fjärrskådning', exact: true });
    await expect(namn).toBeVisible();
    const namnStil = await namn.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, vikt: s.fontWeight };
    });
    expect(namnStil).toEqual({ storlek: '14px', vikt: '500' });

    // Orten med kartnålsikon och långdatumet ("15 september 2099") med
    // kalenderikon — renderade svg-ikoner, aria-dolda (texten bär infon).
    const ort = kort.getByText('Skövde', { exact: true });
    await expect(ort).toBeVisible();
    await expect(ort.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    const datum = kort.getByText('15 september 2099', { exact: true });
    await expect(datum).toBeVisible();
    await expect(datum.locator('svg[aria-hidden="true"]')).toHaveCount(1);

    // Korrekt länksemantik (AC #2): EN länk-yta — inga nästlade länkar.
    await expect(kort.getByRole('link')).toHaveCount(1);
  });

  test('AC 4 — "X av Y platser bokade" + beläggningsstapelns fyllnadsandel matchar X/Y (renderad mätning)', async ({
    page,
  }) => {
    await mock(page, {
      registrations: [],
      events: [
        ev({
          eventNamn: 'Fjärrskådning',
          startdatum: '2099-09-15',
          antalAnmalda: 5,
          maxPlatser: 20,
        }),
      ],
    });
    await page.goto('/hem');
    const kort = page.getByRole('region', { name: 'Nästa event' });

    // Caption-texten är informationsbäraren (stapeln aldrig ensam): 12px
    // (text-caption) i secondary (--mm-text-secondary #525151).
    const caption = kort.getByText('5 av 20 platser bokade', { exact: true });
    await expect(caption).toBeVisible();
    const captionStil = await caption.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, farg: s.color };
    });
    expect(captionStil).toEqual({ storlek: '12px', farg: 'rgb(82, 81, 81)' });

    // Stapeln RENDERAD (L246-boxmätning): fyllnadsbredd / trackbredd == 5/20.
    // Track = kortets enda aria-dolda div (ikonerna är svg, pillen span).
    const track = kort.locator('div[aria-hidden="true"]');
    await expect(track).toHaveCount(1);
    const fyllnad = track.locator('div');
    const trackBox = await track.boundingBox();
    const fyllnadBox = await fyllnad.boundingBox();
    if (!trackBox || !fyllnadBox) throw new Error('boundingBox saknas för stapel-mätningen');
    expect(fyllnadBox.width / trackBox.width).toBeGreaterThan(0.23);
    expect(fyllnadBox.width / trackBox.width).toBeLessThan(0.27);

    // Färgerna renderade: vit track (--mm-surface), primär-dämpad fyllnad
    // (--mm-primary-muted #c4a840) — tokensystemet, inga hårdkodade färger.
    const farger = await track.evaluate((el) => {
      const fill = el.firstElementChild;
      if (!fill) throw new Error('fyllnadselementet saknas');
      return {
        track: getComputedStyle(el).backgroundColor,
        fyllnad: getComputedStyle(fill).backgroundColor,
      };
    });
    expect(farger).toEqual({ track: 'rgb(255, 255, 255)', fyllnad: 'rgb(196, 168, 64)' });
  });

  test('AC 5 — Obetalda anmälningsavgifter visar ENDAST antalet, text-3xl semibold', async ({
    page,
  }) => {
    await mock(page, {
      registrations: [
        reg({ fornamn: 'Disa', efternamn: 'Dahl', anmalningsavgift: 'Ej mottagen' }),
        reg({ fornamn: 'Egon', efternamn: 'Ek', anmalningsavgift: 'Ej mottagen' }),
        reg(), // Mottagen → räknas inte
      ],
      events: [ev()],
    });
    await page.goto('/hem');

    // Facit-rubriken "Obetalda anmälningsavgifter" (region via aria-labelledby).
    const region = page.getByRole('region', { name: 'Obetalda anmälningsavgifter' });
    const antal = region.getByText('2', { exact: true });
    await expect(antal).toBeVisible();

    // RENDERAT (computed-style): text-3xl (30px) semibold (600).
    const stil = await antal.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, vikt: s.fontWeight };
    });
    expect(stil).toEqual({ storlek: '30px', vikt: '600' });

    // ENDAST antalet under rubriken — inga namn/undertexter (facit; \s* täcker
    // normaliserings-varianter mellan blockelementen).
    await expect(region).toHaveText(/^Obetalda anmälningsavgifter\s*2$/);
  });
});

test.describe('Hem-strukturen till K10-facit (task-4.2)', () => {
  test('hälsningen utan utropstecken; återbesök i sessionen visar bara namnet (B2)', async ({
    page,
  }) => {
    await mock(page);
    await page.goto('/hem');
    const h1 = page.getByRole('heading', { level: 1 });
    // Första renderingen per session: "Hej {namn}" — UTAN utropstecken (facit).
    await expect(h1).toHaveText(H1_HALSNING);
    await expect(h1).not.toContainText('!');
    // Återbesök (sessionStorage överlever reload i samma flik): bara namnet.
    // Staging-TEST_USER bär display-namn (task-1.1) → h1 utan Hej-prefix.
    await page.reload();
    await expect(h1).toBeVisible();
    await expect(h1).not.toHaveText(H1_HALSNING);
    await expect(h1).not.toHaveText('');
  });

  test('kolumnen 600 px skärm-centrerad på desktop; headern borta (AC 1–2)', async ({ page }) => {
    await mock(page);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('header')).toHaveCount(0);
    const box = await page.locator('main#main').boundingBox();
    if (!box) throw new Error('main saknar boundingBox');
    // Renderad mätning (L246): 600-boxen + skärm-centrering (viewport 1280).
    expect(box.width).toBe(600);
    expect(Math.abs(box.x - (1280 - 600) / 2)).toBeLessThanOrEqual(1);
  });

  test('versionsraden nere till vänster endast desktop och matchar paketmanifestet (AC 5)', async ({
    page,
  }) => {
    // Versionen läses ur paketmanifestet — ALDRIG hårdkodad i assertionen
    // (kortets AC: asserterad mot manifestet).
    const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
    await mock(page);
    await page.goto('/hem');
    const rad = page.getByText(`Miranon Media Admin v${version}`, { exact: true });
    await expect(rad).toBeVisible();
    // Mobil (< lg): versionsraden dold — mobilen behåller dagens form.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(rad).toBeHidden();
  });
});

/**
 * task-4.4 — Anmälningslistan till K10-facit (S55 Del 12). Renderad
 * verifiering per L246: computed-style/boxmätning, aldrig enbart klass-närvaro.
 * Facit-formerna: koppar-kontur runt kortet + koppar-varningsikon (20) vid
 * rubriken "Nya anmälningar att hantera"; ~25 senaste i inline-rullbar lista
 * (maxhöjd, tunn centrerad rundad scrollmarkör, luft mot innehållet); zebra
 * varannan rad (rundad, INGA avdelare); rad = namn (16 semibold) / JOINAD
 * event-identitet "kurs · ort · kortdatum" (14, B4 — ur eventlistan, inte
 * radens lookups) / relativ tid (12 muted); rullningsområdet
 * tangentbordsfokuserbart med begripligt tillgängligt namn (B6).
 */
test.describe('Anmälningslistan till facit (task-4.4)', () => {
  /** ISO-tidpunkt `offsetMs` före `nu` — mockarnas Inskickad-värden. */
  const isoFore = (nu: Date, offsetMs: number): string =>
    new Date(nu.getTime() - offsetMs).toISOString();

  test('AC 1 — raden: namn 16/600, joinad "kurs · ort · kortdatum" 14, relativ tid 12 muted (renderat, fast klocka)', async ({
    page,
  }) => {
    // Fast klocka på ETT kontrollerat klockslag (idag 15:00 i RUNNERNS zon):
    // "för 2 tim sedan" kan inte glida över en dagsgräns oavsett när testet
    // körs (TASK-3-klassen: inga lastkänsliga/kalenderkänsliga tidsfönster).
    const nu = new Date();
    nu.setHours(15, 0, 0, 0);
    await page.clock.setFixedTime(nu);

    const igar1402 = new Date(nu);
    igar1402.setDate(igar1402.getDate() - 1);
    igar1402.setHours(14, 2, 0, 0);
    // Igår-formens FÖRVÄNTADE klockslag formateras i BROWSERNS konfigurerade
    // zon (playwright.config use.timezoneId), inte runnerns: lokalt är
    // zonerna samma men CI-runnern kör UTC → Node-konstruerade "14:02"
    // renderas där som 16:02 av appen (CI-run 29149331316-fyndet).
    // Kalenderdags-etiketten "igår" håller för runner-zoner UTC…Stockholm
    // (våra två körmiljöerna); klockslags-delen härleds alltid ur samma
    // absoluta ögonblick som mocken skickar.
    const igarKlockslag = new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Stockholm',
    }).format(igar1402);

    // Join-beviset (B4): radens EGNA lookup-fält (eventNamn) divergerar
    // medvetet från eventlistans post — renderas eventlistans identitet är
    // joinen dataflödets källa, inte lookupen.
    await mock(page, {
      registrations: [
        reg({
          fornamn: 'Anna',
          efternamn: 'Andersson',
          eventId: 'recEventJoin',
          eventNamn: 'Lookup-namnet (fel källa)',
          inskickad: isoFore(nu, 2 * 3_600_000),
        }),
        reg({
          fornamn: 'Erik',
          efternamn: 'Lindqvist',
          eventId: 'recEventJoin',
          eventNamn: null,
          inskickad: isoFore(nu, 10 * 60_000),
        }),
        reg({
          fornamn: 'Johan',
          efternamn: 'Berg',
          eventId: 'recEventJoin',
          eventNamn: null,
          inskickad: igar1402.toISOString(),
        }),
        reg({
          fornamn: 'Karin',
          efternamn: 'Ek',
          eventId: 'recEventJoin',
          eventNamn: null,
          inskickad: isoFore(nu, 3 * 86_400_000),
        }),
      ],
      events: [
        ev({
          id: 'recEventJoin',
          eventNamn: 'Fjärrskådning 2',
          ort: 'Skövde',
          startdatum: '2026-09-15',
        }),
      ],
    });
    await page.goto('/hem');
    const lista = page.getByRole('region', { name: 'Nya anmälningar att hantera' });

    // Namnet: 16 px semibold (600) RENDERAT.
    const namn = lista.getByText('Anna Andersson', { exact: true });
    await expect(namn).toBeVisible();
    const namnStil = await namn.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, vikt: s.fontWeight };
    });
    expect(namnStil).toEqual({ storlek: '16px', vikt: '600' });

    // Metaraden: JOINAD identitet "kurs · ort · kortdatum" ur EVENTLISTAN —
    // kortdatum i facit-formen "15 sep" (sv-SE, utan punkt); 14 px RENDERAT.
    const meta = lista.getByText('Fjärrskådning 2 · Skövde · 15 sep', { exact: true }).first();
    await expect(meta).toBeVisible();
    expect(await meta.evaluate((el) => getComputedStyle(el).fontSize)).toBe('14px');
    // Lookup-fältet renderas ALDRIG som identitet (join-beviset).
    await expect(lista.getByText(/Lookup-namnet/)).toHaveCount(0);

    // Relativa tidens fyra facit-former mot den fasta klockan.
    await expect(lista.getByText('för 2 tim sedan', { exact: true })).toBeVisible();
    await expect(lista.getByText('för 10 min sedan', { exact: true })).toBeVisible();
    await expect(lista.getByText(`igår ${igarKlockslag}`, { exact: true })).toBeVisible();
    await expect(lista.getByText('för 3 dagar sedan', { exact: true })).toBeVisible();

    // Relativ tid: 12 px i muted (--mm-text-muted #6b6b6b) RENDERAT.
    const tid = lista.getByText('för 2 tim sedan', { exact: true });
    const tidStil = await tid.evaluate((el) => {
      const s = getComputedStyle(el);
      return { storlek: s.fontSize, farg: s.color };
    });
    expect(tidStil).toEqual({ storlek: '12px', farg: 'rgb(107, 107, 107)' });
  });

  test('AC 4 — koppar-kontur runt kortet + koppar-varningsikon (20) vid rubriken (renderat)', async ({
    page,
  }) => {
    await mock(page, { registrations: [reg()], events: [ev()] });
    await page.goto('/hem');
    const kort = page.getByRole('region', { name: 'Nya anmälningar att hantera' });
    await expect(kort).toBeVisible();

    // Konturens renderade färg = --mm-accent (koppar #a3491c) runt HELA
    // kortet — och kortytan är fortfarande den tonala (bg-muted #f5f5f3).
    const kontur = await kort.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        topp: s.borderTopColor,
        hoger: s.borderRightColor,
        botten: s.borderBottomColor,
        vanster: s.borderLeftColor,
        bredd: s.borderTopWidth,
        bg: s.backgroundColor,
      };
    });
    expect(kontur).toEqual({
      topp: 'rgb(163, 73, 28)',
      hoger: 'rgb(163, 73, 28)',
      botten: 'rgb(163, 73, 28)',
      vanster: 'rgb(163, 73, 28)',
      bredd: '1px',
      bg: 'rgb(245, 245, 243)',
    });

    // Varningsikonen: renderad svg VID rubriken (inne i h2:n), aria-dold
    // (texten bär informationen), 20×20, i koppar.
    const rubrik = kort.getByRole('heading', { level: 2, name: 'Nya anmälningar att hantera' });
    const ikon = rubrik.locator('svg[aria-hidden="true"]');
    await expect(ikon).toHaveCount(1);
    const ikonBox = await ikon.boundingBox();
    if (!ikonBox) throw new Error('boundingBox saknas för ikon-mätningen');
    expect(ikonBox.width).toBe(20);
    expect(ikonBox.height).toBe(20);
    const ikonFarg = await ikon.evaluate((el) => getComputedStyle(el).color);
    expect(ikonFarg).toBe('rgb(163, 73, 28)');
  });

  test('AC 3 — zebra varannan rad utan skiljelinjer, rundade rader (renderat)', async ({
    page,
  }) => {
    await mock(page, {
      registrations: [
        reg({ fornamn: 'Anna', efternamn: 'Andersson', inskickad: '2026-06-23T10:00:00.000Z' }),
        reg({ fornamn: 'Bo', efternamn: 'Bengtsson', inskickad: '2026-06-22T10:00:00.000Z' }),
        reg({ fornamn: 'Carl', efternamn: 'Carlsson', inskickad: '2026-06-21T10:00:00.000Z' }),
        reg({ fornamn: 'Disa', efternamn: 'Dahl', inskickad: '2026-06-20T10:00:00.000Z' }),
      ],
      events: [ev({ id: 'recEvent1' })],
    });
    await page.goto('/hem');
    const lista = page.getByRole('region', { name: 'Nya anmälningar att hantera' });
    const rader = lista.getByRole('listitem');
    await expect(rader).toHaveCount(4);

    // Zebra RENDERAT: varannan rad (index 1, 3) tonad i --mm-bg-emphasized
    // (#edeee9) med rundade hörn; övriga genomskinliga; INGEN rad bär en
    // skiljelinje (border 0 runt om — avdelar-mönstret från task-1.3 utgick).
    const stilar = await rader.evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          radie: s.borderRadius,
          border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
        };
      }),
    );
    for (const [i, stil] of stilar.entries()) {
      expect(stil.border, `rad ${i} ska sakna skiljelinjer`).toEqual(['0px', '0px', '0px', '0px']);
      if (i % 2 === 1) {
        expect(stil.bg, `rad ${i} ska vara zebra-tonad`).toBe('rgb(237, 238, 233)');
        expect(stil.radie, `rad ${i} ska vara rundad`).not.toBe('0px');
      } else {
        expect(stil.bg, `rad ${i} ska vara genomskinlig`).toBe('rgba(0, 0, 0, 0)');
      }
    }
  });

  test('AC 5 — ~25 rader i rullbar lista: maxhöjd, tunn centrerad rundad scrollmarkör, luft mot innehållet (renderat)', async ({
    page,
  }) => {
    // 30 mockade anmälningar → listan cappas till de 25 SENASTE.
    const manga = Array.from({ length: 30 }, (_, i) =>
      reg({
        fornamn: `Person${String(i).padStart(2, '0')}`,
        efternamn: 'Testsson',
        inskickad: new Date(Date.UTC(2026, 5, 1, 12, 0, 0) - i * 3_600_000).toISOString(),
      }),
    );
    await mock(page, { registrations: manga, events: [ev({ id: 'recEvent1' })] });
    await page.goto('/hem');
    const lista = page.getByRole('region', { name: 'Nya anmälningar att hantera' });
    await expect(lista.getByRole('listitem')).toHaveCount(25);
    // Recency-cappen: de 25 senaste (Person00–24) — äldst (Person25–29) föll.
    await expect(lista.getByText('Person00 Testsson')).toBeVisible();
    await expect(lista.getByText('Person25 Testsson')).toHaveCount(0);

    // Rullningsområdet RENDERAT: maxhöjd 320 px (max-h-80) och faktiskt
    // rullbart (innehållet överstiger höjden); markören tunn (thin) och
    // token-färgad (--mm-border-strong på genomskinlig track = centrerad
    // fri markör), gutter stabil; pr-3 = 12 px luft markör ↔ innehåll.
    const scroll = lista.getByRole('list');
    const stil = await scroll.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        maxHojd: s.maxHeight,
        klientHojd: el.clientHeight,
        scrollHojd: el.scrollHeight,
        bredd: s.scrollbarWidth,
        farg: s.scrollbarColor,
        gutter: s.scrollbarGutter,
        luft: s.paddingRight,
        overflowY: s.overflowY,
      };
    });
    expect(stil.maxHojd).toBe('320px');
    expect(stil.klientHojd).toBeLessThanOrEqual(320);
    expect(stil.scrollHojd).toBeGreaterThan(stil.klientHojd);
    expect(stil.overflowY).toBe('auto');
    expect(stil.bredd).toBe('thin');
    expect(stil.farg).toBe('rgb(196, 196, 194) rgba(0, 0, 0, 0)');
    expect(stil.gutter).toBe('stable');
    expect(stil.luft).toBe('12px');
  });

  test('AC 6 — rullningsområdet tangentbordsfokuserbart med begripligt namn; piltangent rullar; axe 0 med full lista', async ({
    page,
  }) => {
    // Full lista (> maxhöjden) så axe:s scrollable-region-focusable-regel
    // prövas på riktigt OCH kb-rullningen har något att rulla.
    const manga = Array.from({ length: 30 }, (_, i) =>
      reg({
        fornamn: `Person${String(i).padStart(2, '0')}`,
        efternamn: 'Testsson',
        inskickad: new Date(Date.UTC(2026, 5, 1, 12, 0, 0) - i * 3_600_000).toISOString(),
        // Varannan rad utan event-koppling: olänkade rader nås INTE med Tab —
        // regionens egen fokuserbarhet är enda tangentbordsvägen till dem (B6).
        eventId: i % 2 === 0 ? 'recEvent1' : null,
      }),
    );
    await mock(page, { registrations: manga, events: [ev({ id: 'recEvent1' })] });
    await page.goto('/hem');
    const lista = page.getByRole('region', { name: 'Nya anmälningar att hantera' });
    const scroll = lista.getByRole('list', { name: 'Senaste anmälningarna' });

    // Begripligt tillgängligt namn + fokuserbarhet (B6): tabindex 0 gör
    // rullningsytan till ett riktigt tab-stopp (axe scrollable-region-
    // focusable); namnet säger vad stoppet är.
    await expect(scroll).toHaveAttribute('tabindex', '0');
    await scroll.focus();
    await expect(scroll).toBeFocused();

    // Tangentbordsmanövrerbart RENDERAT: ArrowDown rullar området.
    expect(await scroll.evaluate((el) => el.scrollTop)).toBe(0);
    await page.keyboard.press('ArrowDown');
    await expect.poll(async () => await scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

    // Axe-0 på Hem med fullt rullbar lista (AC #6).
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
