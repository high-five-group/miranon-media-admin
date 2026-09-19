import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * TASK-455 — Svepets bilageväljare per event-grupp (AC #1/#2/#4/#5).
 *
 * VAD DENNA FIL BEVISAR: (1) varje event-grupp i svepet har sin EGEN
 * bilageväljare, urvalet är SCOPAT per grupp (bläddra bort och tillbaka
 * bevarar valet, en oberörd grupp förblir "Inga valda") — AC #1; (2)
 * `svepSend`s POST-kroppar bär `attachmentIds` PER grupp — den grupp Lotta
 * valde bilagor för skickar dem, den andra skickar en TOM lista (ADR-067 D9,
 * batch-vägen oförändrad) — AC #2 (klient-halva, samma gräns som
 * `atgarder-bilageval-send.acceptance.test.ts`s egen docblock drar: att
 * bilagan faktiskt ANLÄNDER provas i api-staging, inte här); (3) den
 * teknikfria "tar längre tid"-noten syns bara för en grupp med minst en
 * vald bilaga — AC #4; (4) tangentbordsväg + axe — AC #5.
 *
 * ÅTERANVÄNDER samma delade `BilageValjare`-komponent
 * `atgarder-bilageval-send.acceptance.test.ts` redan bevisar i grunden
 * (kryssruta/namn/storlek/"Inga valda"-läge) — denna fil upprepar INTE de
 * assertionerna, bara det som är NYTT för svepets per-grupp-form.
 *
 * FIXTUREN ÄR EGEN, samma mönster som `svep-bekraftelse-send.acceptance.
 * test.ts` (under samtidig omskrivning-risk motiverar en egen kopia, se den
 * filens docblock).
 *
 * [TASK-455-ITERATION, S127] SISTA `test.describe`-blocket bevisar
 * BILAGE-FÖRVÄRMNINGEN (Marcus efter stämplingspasset: "jag gillar inte att
 * bilagorna laddar när jag växlar mellan eventgrupp") — en EGEN, tre-grupps
 * fixtur (`EVENT_A3`/`EVENT_B3`/`EVENT_C3`), eftersom filens övriga fixtur
 * bara har två event-grupper och ordningsdeterminismen (senast-inskickad-
 * först, `svep-urval.ts`s docblock) kräver distinkta `inskickad`-tider.
 * Nätverks-BEVISET använder `page.waitForRequest` (Playwrights eget
 * nätverkslager), INTE en MSW-handler-räknare — samma disciplin
 * `acceptance-bas.ts` § VAD KLASSEN BEVISAR kräver ("aldrig att en handler
 * anropades... det vore att testa fixturen") och samma mönster
 * `mer-aktivitetshistorik-filter.acceptance.test.ts` och
 * `prefetch-avsikt-regression.acceptance.test.ts` (ADR-078 beslut 3s egen
 * regressionsgrind) redan etablerat.
 */

type RegRow = z.infer<typeof RegistrationSchema>;
type EventRow = z.infer<typeof EventSchema>;

function reg(overrides: Partial<RegRow> = {}): RegRow {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Sommarkurs i akvarell',
    ort: 'Uppsala',
    status: 'Obekräftad',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-09-01T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEventA',
    personId: 'recPersonA',
    ...overrides,
  };
}

function ev(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'EVT',
    eventNamn: 'Sommarkurs i akvarell',
    typ: 'Kurs',
    ort: 'Uppsala',
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

const EVENT_A = 'recEventA0001';
const EVENT_B = 'recEventB0002';
const REG_A1 = 'recRegA0000001';
const REG_B1 = 'recRegB0000001';

const EVENTS = [
  ev({ id: EVENT_A, eventNamn: 'Sommarkurs i akvarell', ort: 'Uppsala' }),
  ev({ id: EVENT_B, eventNamn: 'Hantverkshelg', ort: 'Falun' }),
];

const REGISTRATIONS = [
  reg({
    id: REG_A1,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    eventId: EVENT_A,
    eventNamn: 'Sommarkurs i akvarell',
    personId: 'recPersonA1',
  }),
  reg({
    id: REG_B1,
    fornamn: 'Björn',
    efternamn: 'Ahlgren',
    email: 'bjorn@example.se',
    eventId: EVENT_B,
    eventNamn: 'Hantverkshelg',
    personId: 'recPersonB1',
  }),
];

// Samma fältform som `atgarder-bilageval-send.acceptance.test.ts`s
// `BILAGA_INFO` (AttachmentSchema kräver dokumentklass/rackvidd/kursfamilj/
// kursniva nullable-men-närvarande, TASK-147.12/TASK-275.2).
const BILAGA_INFO = {
  id: 'recBilagaSvep0001',
  namn: 'Deltagarinformation.pdf',
  storlekBytes: 188_416,
  skapad: '2026-08-01T10:00:00.000Z',
  eventId: EVENT_A,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Event',
  kursfamilj: null,
  kursniva: null,
  plats: null,
};

function mockDashboard(network: { use: (...h: ReturnType<typeof http.get>[]) => void }) {
  network.use(
    http.get(EF('get-registrations'), () => json({ registrations: REGISTRATIONS })),
    http.get(EF('get-events'), () => json({ events: EVENTS })),
    http.get(EF('get-event-attachments'), () => json({ attachments: [BILAGA_INFO] })),
  );
}

async function gotoHemOchOppnaSvepet(page: Page) {
  await page.goto('/hem');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Bekräfta alla', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bekräfta alla', exact: true })).toBeVisible();
}

async function armera(page: Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta bekräftelsesvepet' });
  await vaxel.focus();
  await vaxel.press('Enter');
}

const BILAGA_KRYSS_NAMN = `Bifoga ${BILAGA_INFO.namn}`;

test.describe('Svepets bilageväljare — per event-grupp, ingen förvalslogik (TASK-455 AC #1)', () => {
  test('grupp 1: ingen förvald bilaga; väljer man en syns valet — grupp 2: opåverkad', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    await gotoHemOchOppnaSvepet(page);

    // Grupp 1 (Sommarkurs i akvarell) visas först (svep-urvalets ordning).
    const kryss = page.getByRole('checkbox', { name: BILAGA_KRYSS_NAMN });
    await expect(kryss).toBeVisible();
    await expect(kryss).not.toBeChecked();
    await expect(page.getByText('Inga valda')).toBeVisible();
    // "Tar längre tid"-noten (AC #4) syns INTE innan något är valt.
    await expect(page.getByText('Den här gruppen har bilagor')).toHaveCount(0);

    // KEYBOARD-VÄGEN (AC #5): fokusera kryssrutan och tryck Space — RAC:s
    // egen tangentbordshantering, samma väg `SlideToConfirm`/`armera()` ovan
    // redan litar på för sin `switch`-roll.
    await kryss.focus();
    await kryss.press(' ');
    await expect(kryss).toBeChecked();
    await expect(page.getByText('1 valda')).toBeVisible();
    await expect(
      page.getByText('Den här gruppen har bilagor och tar lite längre tid'),
    ).toBeVisible();

    // BLÄDDRA TILL GRUPP 2 (Hantverkshelg): EGEN, opåverkad bilageväljare —
    // samma checkbox-instans (DOM-identiteten), men urvalet är scopat per
    // event-grupp, inte globalt.
    await page.getByRole('button', { name: 'Nästa event' }).click();
    await expect(page.getByText('Hantverkshelg', { exact: true })).toBeVisible();
    await expect(kryss).not.toBeChecked();
    await expect(page.getByText('Inga valda')).toBeVisible();
    await expect(page.getByText('Den här gruppen har bilagor')).toHaveCount(0);

    // BLÄDDRA TILLBAKA: grupp 1:s val ÖVERLEVER (state ägs av `SvepOverlay`,
    // inte av `Forhandsvisning`s lokala bläddrings-state).
    await page.getByRole('button', { name: 'Föregående event' }).click();
    await expect(kryss).toBeChecked();
    await expect(page.getByText('1 valda')).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});

test.describe('Svepets sändning bär attachmentIds PER grupp (TASK-455 AC #2, klient-halva)', () => {
  test('gruppen med vald bilaga skickar attachmentIds; gruppen utan skickar tom lista', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    const sentBodies: Array<{ eventId: string; attachmentIds?: string[] }> = [];
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        const body = (await request.json()) as { eventId: string; attachmentIds?: string[] };
        sentBodies.push(body);
        return json({
          status: 'sent',
          requested: 1,
          attempted: 1,
          completed: [body.eventId === EVENT_A ? REG_A1 : REG_B1],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoHemOchOppnaSvepet(page);

    // Väljer en bilaga ENBART för grupp 1 (Sommarkurs i akvarell) — grupp 2
    // (Hantverkshelg) rörs aldrig, exakt "ingen förvalslogik".
    const kryss = page.getByRole('checkbox', { name: BILAGA_KRYSS_NAMN });
    await kryss.focus();
    await kryss.press(' ');
    await expect(kryss).toBeChecked();

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Utskicket lyckades' })).toBeVisible();

    expect(sentBodies).toHaveLength(2);
    const perEvent = new Map(sentBodies.map((b) => [b.eventId, b]));
    expect(perEvent.get(EVENT_A)?.attachmentIds).toEqual([BILAGA_INFO.id]);
    // ADR-067 D9: en grupp utan valda bilagor skickar en TOM lista, aldrig
    // `undefined` — batch-vägen oförändrad server-side.
    expect(perEvent.get(EVENT_B)?.attachmentIds).toEqual([]);
  });
});

// ─── Bilage-FÖRVÄRMNING (TASK-455-ITERATION, S127) ────────────────────────
//
// EGEN tre-grupps fixtur — filens övriga fixtur (EVENTS/REGISTRATIONS ovan)
// har bara två event-grupper, och denna sviten behöver minst tre (uppdragets
// egen ordalydelse) för att kunna skilja "grupp 2" från "grupp 3" i beviset.
// `inskickad` är DISTINKT och FALLANDE (A senast, C tidigast) — grupp-
// ORDNINGEN i svepet är senast-inskickad-först (`svep-urval.ts`s docblock,
// ärvd av `obekraftadeAnmalningar`), så utan distinkta tider vore ordningen
// odeterministisk och testet flakigt.

const EVENT_A3 = 'recEventA3grupp0001';
const EVENT_B3 = 'recEventB3grupp0002';
const EVENT_C3 = 'recEventC3grupp0003';
const REG_A3 = 'recRegA3grupp00001';
const REG_B3 = 'recRegB3grupp00001';
const REG_C3 = 'recRegC3grupp00001';

const EVENTS_TRE = [
  ev({ id: EVENT_A3, eventNamn: 'Höstkurs i keramik', ort: 'Örebro' }),
  ev({ id: EVENT_B3, eventNamn: 'Vinterkurs i vävning', ort: 'Karlstad' }),
  ev({ id: EVENT_C3, eventNamn: 'Vårkurs i smide', ort: 'Västerås' }),
];

const REGISTRATIONS_TRE = [
  reg({
    id: REG_A3,
    eventId: EVENT_A3,
    eventNamn: 'Höstkurs i keramik',
    personId: 'recPersA3grupp0001',
    inskickad: '2026-09-03T10:00:00.000Z', // senast → grupp 1
  }),
  reg({
    id: REG_B3,
    eventId: EVENT_B3,
    eventNamn: 'Vinterkurs i vävning',
    personId: 'recPersB3grupp0001',
    inskickad: '2026-09-02T10:00:00.000Z', // grupp 2
  }),
  reg({
    id: REG_C3,
    eventId: EVENT_C3,
    eventNamn: 'Vårkurs i smide',
    personId: 'recPersC3grupp0001',
    inskickad: '2026-09-01T10:00:00.000Z', // tidigast → grupp 3
  }),
];

/** Samma fältform som `BILAGA_INFO` ovan (AttachmentSchema-kraven), en
 *  bilaga per event, namngiven efter eventId så ett fel i eventId-routing
 *  syns direkt i ett assertion-diff i stället för att tystas av att alla
 *  tre event råkar dela namn. */
function bilagaFor(eventId: string) {
  return {
    id: `recBilaga-${eventId}`,
    namn: `Info-${eventId}.pdf`,
    storlekBytes: 100_000,
    skapad: '2026-08-01T10:00:00.000Z',
    eventId,
    dokumentklass: 'Uppladdad',
    rackvidd: 'Event',
    kursfamilj: null,
    kursniva: null,
    plats: null,
  };
}

function mockDashboardTre(network: { use: (...h: ReturnType<typeof http.get>[]) => void }) {
  network.use(
    http.get(EF('get-registrations'), () => json({ registrations: REGISTRATIONS_TRE })),
    http.get(EF('get-events'), () => json({ events: EVENTS_TRE })),
    http.get(EF('get-event-attachments'), ({ request }) => {
      const eventId = new URL(request.url).searchParams.get('eventId');
      return json({ attachments: eventId ? [bilagaFor(eventId)] : [] });
    }),
  );
}

test.describe('Svepets bilage-förvärmning — alla gruppers bilagor hämtas vid öppning (TASK-455-iteration, S127)', () => {
  test('grupp 2/3s bilageanrop avfyras INNAN bläddring dit; ingen skeleton vid växling', async ({
    page,
    network,
  }) => {
    mockDashboardTre(network);

    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Registrerade FÖRE knappklicket som öppnar overlayen — kedjan startar
    // vid `SvepOverlay`s MOUNT (samma render som knappklicket utlöser), så
    // lyssnarna måste finnas på plats innan klicket sker. Kort timeout
    // (5 s, inte default 30 s): på ORÖRD kod (192c5287) avfyras dessa anrop
    // ALDRIG förrän man faktiskt bläddrar dit — testet ska falla SNABBT, inte
    // hänga i en hel svit-timeout.
    const grupp2Anrop = page.waitForRequest(
      (req) =>
        req.url().includes('/functions/v1/get-event-attachments') &&
        new URL(req.url()).searchParams.get('eventId') === EVENT_B3,
      { timeout: 5000 },
    );
    const grupp3Anrop = page.waitForRequest(
      (req) =>
        req.url().includes('/functions/v1/get-event-attachments') &&
        new URL(req.url()).searchParams.get('eventId') === EVENT_C3,
      { timeout: 5000 },
    );

    await page.getByRole('button', { name: 'Bekräfta alla', exact: true }).click();
    // Overlayens EGEN dialogruta — scopad hädanefter (`dialog`), eftersom
    // Hem-sidans bakomliggande eventlista länkar SAMMA eventnamn
    // ("Höstkurs i keramik" m.fl.) som synliga länktexter: en oscopad
    // `getByText` matchar då BÅDA och ger ett strict-mode-fel.
    const dialog = page.getByRole('dialog', { name: 'Bekräfta alla' });
    await expect(dialog.getByRole('heading', { name: 'Bekräfta alla', exact: true })).toBeVisible();

    // BEVIS 1 (uppdragets "avfyrades FÖRE växlingen"): grupp 2:s och grupp
    // 3:s bilageanrop har redan avfyrats — INNAN något "Nästa event"-klick
    // någonsin skett i detta test.
    await grupp2Anrop;
    await grupp3Anrop;

    // Grupp 1 (Höstkurs i keramik, senast inskickad) är synlig direkt.
    await expect(dialog.getByText('Höstkurs i keramik', { exact: true })).toBeVisible();

    // BEVIS 2 (uppdragets "ingen skeleton"): byt till grupp 2 — datan var
    // redan hämtad (BEVIS 1), så `BilageValjare` går aldrig igenom sitt
    // `laddar`-läge för den här växlingen.
    await dialog.getByRole('button', { name: 'Nästa event' }).click();
    await expect(dialog.getByText('Vinterkurs i vävning', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Hämtar bilagor…')).toHaveCount(0);
    await expect(
      dialog.getByRole('checkbox', { name: `Bifoga Info-${EVENT_B3}.pdf` }),
    ).toBeVisible();

    // BEVIS 3: samma sak för grupp 3.
    await dialog.getByRole('button', { name: 'Nästa event' }).click();
    await expect(dialog.getByText('Vårkurs i smide', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Hämtar bilagor…')).toHaveCount(0);
    await expect(
      dialog.getByRole('checkbox', { name: `Bifoga Info-${EVENT_C3}.pdf` }),
    ).toBeVisible();
  });
});
