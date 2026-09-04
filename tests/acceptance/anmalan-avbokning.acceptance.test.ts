import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { RegistrationDetailSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-368.3 — "Avboka anmälan" och "Återta avbokning" på anmälans sida.
 *
 * FÖRLAGA: `anmalan-detalj.acceptance.test.ts` (samma sida, samma hermetiska
 * fixturvärld, samma `EF(namn)`/`json(...)`-mönster och samma
 * TILLSTÅNDSBÄRANDE mock-form). Egen fil, inte ett tillägg där: den filen
 * bevisar S83-facits SHAPE grupp för grupp, denna bevisar en HANDLING över
 * tid. Att blanda dem hade gjort båda svårare att läsa, och facit-filens
 * fixturer är dessutom låsta till k04-bilagorna.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SOM BEVISAS EXTERNT — OCH VAD SOM INTE GÅR ATT BEVISA HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * Klassens regel (`acceptance-bas.ts`): externt beteende, aldrig att en
 * handler anropades. Skälets väg genom systemet är därför bevisad DÄR LOTTA
 * SER DEN: mocken speglar serverns Notering-append
 * (`_shared/cancel-registration.ts` § `byggNoteringsrad`), och testet
 * asserterar den datumstämplade raden i gruppen "Interna noteringar" på
 * sidan. Payload-fångsten finns vid sidan av den, av samma skäl som
 * förlagans `confirmCalls`: den prövar KONTRAKTET (att ett tomt skäl inte
 * skickas som en tom `skal`-nyckel), vilket inte har någon annan yta.
 *
 * BETALLÄGET I STEGET TESTAS INTE HÄR, och det är en mätt gräns, inte en
 * glömska: `playwright.config.ts` sätter `VITE_FEATURE_BETALNINGAR: 'av'`
 * för HELA den delade acceptance-webServern (dess egen kommentar: utan
 * raden öppnar `JobbLyssnare` en Realtime-WebSocket som WebSocket-vakten
 * fäller, mätt 48 av 48 tester i `hem.acceptance.test.ts`). Fixturvärlden
 * bär inga betalnings-EF-mockar. Betalläget och den direkta vägen till
 * "Registrera återbetalning" ligger därför bakom flaggan och saknar
 * acceptans-täckning tills den raden flippas — samma öppna läge som
 * `AnmalansBetalningar` (TASK-346.7) redan står i.
 *
 * `cancel-registration` SKRIVER INTE SKARPT: anropet är avlyssnat.
 * Serverkontraktet (övergångstabellen, Notering-appendens exakta form,
 * idempotensen) bor i TASK-368.2:s egna tester och ligger kvar där.
 */

const EVENT_ID = 'recAVBOKNING00001';
const ANNA = 'recAvbokAnna';

type DetaljRow = z.infer<typeof RegistrationDetailSchema>;
type CancelBody = { registrationId: string; atgard: 'avboka' | 'aterta'; skal?: string };

/** Bekräftad anmälan med en befintlig notering (så appendet syns som append). */
function detalj(overrides: Partial<DetaljRow> = {}): DetaljRow {
  return {
    id: ANNA,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna.andersson@example.se',
    telefon: '070-123 45 67',
    eventNamn: 'Resor i medvetandet 2',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-30T12:32:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: 'Vill sitta nära dörren.',
    eventId: EVENT_ID,
    personId: 'recPersonAvbok01',
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: '2026-07-01T07:15:00.000Z',
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: 1,
    borOver: false,
    erfarenhetsbadge: null,
    kurshistorik: null,
    anmalanId: 247,
    franFormular: 'Huvudformulär',
    franFormularId: 'selQyiMaRVXuu7Nm5',
    fragorFunderingar: null,
    villkorOk: true,
    eventTyp: 'Utbildning',
    eventOrt: 'Skövde',
    startdatum: '2026-08-10',
    slutdatum: '2026-08-12',
    tidKvar: '2 veckor och 3 dagar',
    eventKey: 'Event-31',
    deadlineSlutbetalning: '2026-07-27',
    dagarKvarTillDeadline: 3,
    plusOneForfraganSkickad: null,
    medfoljandeTillNamn: null,
    plusEttor: [],
    sidUrl: null,
    utm: null,
    ...overrides,
  };
}

/**
 * TILLSTÅNDSBÄRANDE mock (förlagans 18.6-mönster): `cancel-registration`
 * muterar den detalj `get-registration` serverar, och SPEGLAR serverns
 * Notering-append. Utan den speglingen hade sidan visat gammal notering efter
 * omhämtningen och beviset för skälet fallit tillbaka på payloaden ensam.
 */
function mocka(
  network: NetworkFixture,
  { detaljer, avvisaMed = null }: { detaljer: DetaljRow[]; avvisaMed?: string | null },
): { cancelCalls: CancelBody[] } {
  const cancelCalls: CancelBody[] = [];
  const perId = new Map(detaljer.map((d) => [d.id, d]));

  // BARA de EF:er anmälans egen route faktiskt anropar. `get-event` och
  // `get-event-notes` hör till EVENTSIDAN och registrerades först här — båda
  // fälldes av överskuggnings-vakten som döda registreringar (mätt
  // 2026-09-03, 9 av 9 tester registrerade dem, 0 använde dem). De är
  // borttagna i stället för märkta: de bevisade ingenting.
  network.use(
    http.get(EF('get-registrations'), () => json({ registrations: [] })),
    http.get(EF('get-registration'), ({ request }) => {
      const id = new URL(request.url).searchParams.get('id');
      const hit = id ? perId.get(id) : undefined;
      return hit ? json({ registration: hit }) : json({ error: 'Not found' }, 404);
    }),
    http.post(EF('cancel-registration'), async ({ request }) => {
      const body = (await request.json()) as CancelBody;
      cancelCalls.push(body);

      if (avvisaMed !== null) {
        return json({ error: avvisaMed, requestId: 'req-test-cancel' }, 409);
      }

      const d = perId.get(body.registrationId);
      if (!d) return json({ error: 'Not found' }, 404);

      const nyStatus: DetaljRow['status'] =
        body.atgard === 'avboka'
          ? 'Avbokad/Ombokad'
          : d.bekraftelseSkickad
            ? 'Bekräftad (mail skickat)'
            : 'Obekräftad';

      const etikett = body.atgard === 'avboka' ? 'Avbokad' : 'Avbokning återtagen';
      const bas = `[${etikett} 2026-09-03 av Test Testsson]`;
      const rad = body.skal ? `${bas} ${body.skal}` : bas;
      const notering = d.notering ? `${d.notering}\n${rad}` : rad;

      perId.set(body.registrationId, { ...d, status: nyStatus, notering });
      return json({
        atgard: body.atgard,
        registrationId: body.registrationId,
        status: nyStatus,
        notering,
      });
    }),
  );

  return { cancelCalls };
}

const AVBOKA_KNAPP = { name: 'Avboka anmälan' } as const;
const ATERTA_KNAPP = { name: 'Återta avbokning' } as const;

test.describe('Avboka anmälan på anmälans sida (TASK-368.3)', () => {
  test('avboka MED skäl: steget öppnas med fokus i skälfältet, Avbryt först, och skälet landar i noteringen', async ({
    page,
    network,
  }) => {
    const { cancelCalls } = mocka(network, { detaljer: [detalj()] });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);

    // Gruppen finns för en aktiv anmälan (AC #2).
    await expect(page.getByRole('heading', { level: 2, name: 'Avbokning' })).toBeVisible();
    const trigger = page.getByRole('button', AVBOKA_KNAPP);
    await expect(trigger).toBeVisible();
    await trigger.click();

    // Bekräftelsesteget är en NAMNGIVEN grupp (fieldset + sr-only legend).
    const steg = page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });
    await expect(steg).toBeVisible();

    // Fokus landar i skälfältet (AC #2).
    const skalfalt = steg.getByRole('textbox', { name: 'Skäl (frivilligt)' });
    await expect(skalfalt).toBeFocused();

    // "Avbryt som standardknapp": den står FÖRST i knappraden, alltså den
    // första knappen i steget efter fältet.
    const knappar = steg.getByRole('button');
    await expect(knappar.nth(0)).toHaveText('Avbryt');
    await expect(knappar.nth(1)).toHaveText('Avboka anmälan');

    await skalfalt.fill('Sjuk, kan inte komma.');
    await steg.getByRole('button', AVBOKA_KNAPP).click();

    // Statusen på sidan blir Avbokad, och knappen ersätts av Återta (AC #3).
    await expect(page.locator('header').getByText('Avbokad/Ombokad')).toBeVisible();
    await expect(page.getByRole('button', ATERTA_KNAPP)).toBeVisible();
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toHaveCount(0);

    // Tangentbordskontinuitet: fokus följer med till den knapp som tog över.
    await expect(page.getByRole('button', ATERTA_KNAPP)).toBeFocused();

    // Skälet syns som datumstämplad rad i anmälans notering, APPENDAT efter
    // den befintliga texten (PRD berättelse 4).
    const noteringar = page.locator('section[aria-labelledby="grupp-noteringar"]');
    await expect(noteringar).toContainText('Vill sitta nära dörren.');
    await expect(noteringar).toContainText(
      '[Avbokad 2026-09-03 av Test Testsson] Sjuk, kan inte komma.',
    );

    // Kontraktet: skälet skickas TRIMMAT, en gång.
    expect(cancelCalls).toEqual([
      { registrationId: ANNA, atgard: 'avboka', skal: 'Sjuk, kan inte komma.' },
    ]);
  });

  test('avboka UTAN skäl: nyckeln utelämnas helt och noteringsraden står utan skältext', async ({
    page,
    network,
  }) => {
    const { cancelCalls } = mocka(network, { detaljer: [detalj({ notering: null })] });
    await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);

    await page.getByRole('button', AVBOKA_KNAPP).click();
    const steg = page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });
    await steg.getByRole('button', AVBOKA_KNAPP).click();

    await expect(page.locator('header').getByText('Avbokad/Ombokad')).toBeVisible();
    const noteringar = page.locator('section[aria-labelledby="grupp-noteringar"]');
    await expect(noteringar).toContainText('[Avbokad 2026-09-03 av Test Testsson]');

    expect(cancelCalls).toEqual([{ registrationId: ANNA, atgard: 'avboka' }]);
  });

  test('ett skäl med bara blanksteg räknas som inget skäl', async ({ page, network }) => {
    const { cancelCalls } = mocka(network, { detaljer: [detalj({ notering: null })] });
    await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);

    await page.getByRole('button', AVBOKA_KNAPP).click();
    const steg = page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });
    await steg.getByRole('textbox', { name: 'Skäl (frivilligt)' }).fill('   ');
    await steg.getByRole('button', AVBOKA_KNAPP).click();

    await expect(page.locator('header').getByText('Avbokad/Ombokad')).toBeVisible();
    expect(cancelCalls).toEqual([{ registrationId: ANNA, atgard: 'avboka' }]);
  });

  test('återta avbokning: statusen härleds av servern och Avboka-knappen återkommer', async ({
    page,
    network,
  }) => {
    const { cancelCalls } = mocka(network, {
      detaljer: [detalj({ status: 'Avbokad/Ombokad' })],
    });
    await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);

    await expect(page.getByRole('button', AVBOKA_KNAPP)).toHaveCount(0);
    await page.getByRole('button', ATERTA_KNAPP).click();

    // Bekräftelsedatumet är satt i fixturen ⇒ serverns härledning är
    // "Bekräftad (mail skickat)", och headern visar den gröna badgen igen.
    await expect(page.locator('header').getByText('Bekräftad', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeVisible();
    await expect(page.getByRole('button', ATERTA_KNAPP)).toHaveCount(0);
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeFocused();

    expect(cancelCalls).toEqual([{ registrationId: ANNA, atgard: 'aterta' }]);
  });

  test('återta en OBEKRÄFTAD avbokning ger Obekräftad tillbaka, inte en falsk bekräftelse', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj({ status: 'Avbokad/Ombokad', bekraftelseSkickad: null })],
    });
    await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);

    await page.getByRole('button', ATERTA_KNAPP).click();
    await expect(page.locator('header').getByText('Obekräftad', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeVisible();
  });

  test('knappens synlighet per status: tre aktiva bär Avboka, Inställt och väntelista bär ingen alls', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [
        detalj({ id: 'recObek', status: 'Obekräftad', bekraftelseSkickad: null, anmalanId: 1 }),
        detalj({ id: 'recBekr', status: 'Bekräftad (mail skickat)', anmalanId: 2 }),
        detalj({ id: 'recPam', status: 'Betalningspåminnelse skickad', anmalanId: 3 }),
        detalj({ id: 'recAvbok', status: 'Avbokad/Ombokad', anmalanId: 4 }),
        detalj({ id: 'recInst', status: 'Inställt', anmalanId: 5 }),
        detalj({ id: 'recVant', status: 'Flytta till väntelista', anmalanId: 6 }),
      ],
    });

    for (const id of ['recObek', 'recBekr', 'recPam']) {
      await page.goto(`/event/${EVENT_ID}/anmalan/${id}`);
      await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeVisible();
      await expect(page.getByRole('button', ATERTA_KNAPP)).toHaveCount(0);
    }

    await page.goto(`/event/${EVENT_ID}/anmalan/recAvbok`);
    await expect(page.getByRole('button', ATERTA_KNAPP)).toBeVisible();
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toHaveCount(0);

    // S83-regeln står kvar för de övriga avvikande statusarna: ingen knapp,
    // och ingen tom "Avbokning"-rubrik heller.
    for (const id of ['recInst', 'recVant']) {
      await page.goto(`/event/${EVENT_ID}/anmalan/${id}`);
      await expect(page.getByText('Anmälan #')).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Avbokning' })).toHaveCount(0);
      await expect(page.getByRole('button', AVBOKA_KNAPP)).toHaveCount(0);
      await expect(page.getByRole('button', ATERTA_KNAPP)).toHaveCount(0);
    }
  });

  test('Avbryt och Escape stänger steget utan att röra anmälan, och fokus går tillbaka till knappen', async ({
    page,
    network,
  }) => {
    const { cancelCalls } = mocka(network, { detaljer: [detalj()] });
    await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);

    const trigger = page.getByRole('button', AVBOKA_KNAPP);
    const steg = page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });

    await trigger.click();
    await expect(steg).toBeVisible();
    await steg.getByRole('button', { name: 'Avbryt' }).click();
    await expect(steg).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(steg).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(steg).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await expect(page.locator('header').getByText('Bekräftad', { exact: true })).toBeVisible();
    expect(cancelCalls).toEqual([]);
  });

  test('serverfel: begriplig text inline och annonserad, status oförändrad, steget kvar med skälet', async ({
    page,
    network,
  }) => {
    mocka(network, { detaljer: [detalj()], avvisaMed: 'Anmälan är redan avbokad.' });
    await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);

    await page.getByRole('button', AVBOKA_KNAPP).click();
    const steg = page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });
    const skalfalt = steg.getByRole('textbox', { name: 'Skäl (frivilligt)' });
    await skalfalt.fill('Ringde och avbokade.');
    await steg.getByRole('button', AVBOKA_KNAPP).click();

    // Felet annonseras (role="alert") och bär SERVERNS mening, utan
    // Edge Function-höljet och utan requestId.
    const fel = page.getByRole('alert');
    await expect(fel).toBeVisible();
    await expect(fel).toContainText('Anmälan är redan avbokad.');
    await expect(fel).toContainText('Anmälan är oförändrad.');
    await expect(fel).not.toContainText('Edge Function');
    await expect(fel).not.toContainText('requestId');

    // Statusen står oförändrad tills servern bekräftat (AC #4), och det
    // halvskrivna skälet är kvar.
    await expect(page.locator('header').getByText('Bekräftad', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', ATERTA_KNAPP)).toHaveCount(0);
    await expect(skalfalt).toHaveValue('Ringde och avbokade.');
  });

  test('axe 0 violations i BÅDA lägena, desktop och iPad-bredd', async ({ page, network }) => {
    mocka(network, {
      detaljer: [detalj(), detalj({ id: 'recAvbok', status: 'Avbokad/Ombokad', anmalanId: 4 })],
    });

    for (const bredd of [1280, 768]) {
      await page.setViewportSize({ width: bredd, height: 1024 });

      // Läge 1: aktiv anmälan med bekräftelsesteget ÖPPET (fältet, texten och
      // knapparna är det som är nytt och behöver prövas).
      await page.goto(`/event/${EVENT_ID}/anmalan/${ANNA}`);
      await page.getByRole('button', AVBOKA_KNAPP).click();
      await expect(
        page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' }),
      ).toBeVisible();
      const oppetSteg = await new AxeBuilder({ page }).analyze();
      expect(oppetSteg.violations).toEqual([]);

      // Läge 2: avbokad anmälan med återtagandet.
      await page.goto(`/event/${EVENT_ID}/anmalan/recAvbok`);
      await expect(page.getByRole('button', ATERTA_KNAPP)).toBeVisible();
      const avbokatLage = await new AxeBuilder({ page }).analyze();
      expect(avbokatLage.violations).toEqual([]);
    }
  });
});
