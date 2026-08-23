import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-147.3 — "Skicka betalningspåminnelse", "Skicka deltagarinformation" och
 * "Skicka mail" (fritt) skarpt ände-till-ände (åtgärd 2–4 på samma sändväg
 * TASK-147.2 etablerade för åtgärd 1, "Skicka bekräftelsemail").
 *
 * VAD DENNA FIL BEVISAR, OCH VAD DEN INTE GÖR — samma gräns som `atgarder-
 * bekraftelsemail-send.acceptance.test.ts` (147.2) drar, inte upprepad i
 * fullt resonemang här: att ÅTGÄRDS-SIDAN, givet ett svar av send-action-
 * email-EF:ens egen form, (1) sänder en VERKLIG POST med rätt body-kontrakt
 * PER ÅTGÄRDSTYP, (2) att urvalsfiltret (`obetald` för påminnelse; INGET
 * filter för eventinfo/fritt, per `ATGARDER`-definitionen i AtgardsSida.tsx)
 * faktiskt biter — inte bara råkar sammanfalla med markeringen, (3) att
 * REDIGERAD ämnesrad/brödtext går ut i stället för mallen, och (4) att
 * platshållarna i förhandsvisningen fylls ur den redigerade texten. Att
 * EF:en SJÄLV producerar rätt idempotens/delutfall/fält-skrivning är
 * TASK-147.1s bevis (`tests/api/send-action-email.test.ts`) — inte upprepat
 * här.
 *
 * FIXTUREN ÅTERANVÄNDS OFÖRÄNDRAD (`VISUAL_EVENT_ID`, delade `get-events`/
 * `get-registrations`-handlers) — samma "Utbildning Skövde"-event som 147.2:s
 * fil. De fyra SEEDADE mottagarna (obekräftade eller obetalda) är Anna,
 * Björn, Cecilia och Filip — `recVisualReg000001/000002/000003/000006`, INTE
 * `...001`–`...004` i följd: David (`...004`) är fullt betald OCH bekräftad
 * och ligger alltså UTANFÖR seedet (verifierat mot `REGISTRATIONS_RESPONSE`,
 * `tests/support/fixturvarld/fixture-data.ts`, inte antaget).
 *
 * `send-action-email` är MEDVETET INTE i normalläget (`handlers.ts`) — samma
 * skäl som 147.2:s fil: en delad skrivväg hade gjort tyst lyckad sändning
 * till default för hela klassen.
 */

const ANNA = 'recVisualReg000001';
const BJORN = 'recVisualReg000002';
const CECILIA = 'recVisualReg000003';
const FILIP = 'recVisualReg000006';

const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

async function oppnaMottagarlista(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /deltagare markerade/ }).click();
}

/** Öppnar en namngiven åtgärd (utan att gå vidare till granskningen). */
async function oppnaAtgard(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
}

/** Armerar SlideToConfirm via tangentbord (samma väg som promoverings-grinden/147.2). */
async function armera(page: import('@playwright/test').Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
  await vaxel.focus();
  await vaxel.press('Enter');
}

async function axeNoll(page: import('@playwright/test').Page) {
  const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
  expect(
    resultat.violations,
    resultat.violations.map((v) => `[${v.impact ?? 'utan impact'}] ${v.id}: ${v.help}`).join('\n'),
  ).toEqual([]);
}

test.describe('Skicka betalningspåminnelse — verklig sändväg, urvalsfiltret biter (TASK-147.3 AC #1)', () => {
  test('urvalsfiltret (obetald) utesluter en fullt betald mottagare ur sändningen', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({
          status: 'sent',
          requested: 4,
          attempted: 4,
          completed: [ANNA, BJORN, CECILIA, FILIP],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoAtgarder(page);

    // Plocka in David (fullt betald OCH bekräftad, alltså utanför seedet) som
    // mottagare — bevisar sedan att urvalsfiltret verkligen UTESLUTER honom,
    // inte bara råkar sammanfalla med det redan seedade fyra-urvalet.
    await page.getByRole('button', { name: 'Lägg till fler personer från eventet' }).click();
    await page.getByRole('button', { name: 'Lägg till David Dahl som mottagare' }).click();
    await oppnaMottagarlista(page);
    await expect(page.getByText('5 av 5 deltagare markerade')).toBeVisible();

    await oppnaAtgard(page, 'Skicka betalningspåminnelse');
    // Badgen "4 av 5" på åtgärdsraden — filtret biter, David räknas inte in.
    await expect(page.getByText('4 av 5')).toBeVisible();

    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka betalningspåminnelse\s+till\s+4\s+personer/)).toBeVisible();
    await expect(page.getByText('David Dahl')).toHaveCount(0);

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 4 personer' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    // Body-kontraktet: rätt åtgärdstyp, EXAKT de fyra urvalsfiltrerade — inte
    // femman inklusive David.
    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.actionType).toBe('paminnelse');
    expect(body.eventId).toBe(VISUAL_EVENT_ID);
    expect(body.registrationIds).toEqual([ANNA, BJORN, CECILIA, FILIP]);
    expect(body.amne).toBe('Påminnelse om betalning');
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    await axeNoll(page);
  });
});

test.describe('Skicka deltagarinformation — verklig sändväg, redigerad text går ut (TASK-147.3 AC #1-#2)', () => {
  test('ingen urvalsfilter-begränsning; redigerad ämnesrad/brödtext sänds, platshållare fyllda i förhandsvisningen', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({
          status: 'sent',
          requested: 4,
          attempted: 4,
          completed: [ANNA, BJORN, CECILIA, FILIP],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoAtgarder(page);

    // Ingen badge på RADEN — `eventinfo` har inget `urvalsfilter` i ATGARDER-
    // definitionen, alla fyra markerade är relevanta. Namnet scopar till
    // DENNA rad: "Skicka bekräftelsemail" bär en egen "2 av 4"-badge (dess
    // `obekraftad`-filter) som en osccopad sida-bred sökning hade fångat.
    await expect(
      page.getByRole('button', { name: 'Skicka deltagarinformation', exact: true }),
    ).toBeVisible();

    await oppnaAtgard(page, 'Skicka deltagarinformation');

    // Redigera texten (AC #2, första ledet): "Ändra"-raden växlar in fälten.
    await page.getByRole('button', { name: 'Ändra' }).click();
    await page.getByRole('textbox', { name: 'Ämne' }).fill('Viktig info inför helgen');
    await page
      .getByRole('textbox', { name: 'Meddelandetext' })
      .fill('Hej {förnamn},\n\nGlöm inte parkeringen i {ort}.\n\nRoger och Lotta');
    await page.getByRole('button', { name: 'Klar med texten' }).click();

    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka deltagarinformation\s+till\s+4\s+personer/)).toBeVisible();

    // Förhandsvisningen visar den REDIGERADE texten med platshållare fyllda
    // (AC #2, andra ledet) — mallens ursprungliga ämnesrad syns inte längre.
    await expect(page.getByText('Viktig info inför helgen')).toBeVisible();
    await expect(page.getByText(/Glöm inte parkeringen i Skövde\./)).toBeVisible();
    await expect(page.getByText('Information inför')).toHaveCount(0);

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 4 personer' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    // Body-kontraktet: den RÅA (ofyllda) REDIGERADE mallen går ut — servern
    // fyller platshållare per mottagare (TASK-147.1); klienten skickar mallen
    // som den redigerades, inte den ursprungliga systemkonstanten.
    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.actionType).toBe('eventinfo');
    expect(body.registrationIds).toEqual([ANNA, BJORN, CECILIA, FILIP]);
    expect(body.amne).toBe('Viktig info inför helgen');
    expect(body.mailtext).toBe(
      'Hej {förnamn},\n\nGlöm inte parkeringen i {ort}.\n\nRoger och Lotta',
    );

    await axeNoll(page);
  });
});

test.describe('Skicka mail (fritt) — verklig sändväg, delutfall (TASK-147.3 AC #1-#2)', () => {
  test('fritt utskick utan mall-grund sänder den skrivna texten; ärligt delutfall, fallen kvar markerad', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({
          status: 'partial',
          requested: 4,
          attempted: 4,
          completed: [ANNA, BJORN, CECILIA],
          skipped: [],
          failed: [{ registrationId: FILIP, reason: 'E-postadressen studsade (bounced)' }],
        });
      }),
    );

    await gotoAtgarder(page);
    await oppnaAtgard(page, 'Skicka mail');

    // "Skicka mail" (fritt) startar REDIGERAD (`redigerar = nyckel ===
    // 'fritt'`, tom mall) — inget att växla in, bara skriva.
    await expect(page.getByRole('button', { name: 'Ändra' })).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Ämne' }).fill('Hej från Miranon Media');
    await page
      .getByRole('textbox', { name: 'Meddelandetext' })
      .fill('Hej {förnamn},\n\nEtt fritt meddelande.\n\nRoger och Lotta');

    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka mail\s+till\s+4\s+personer/)).toBeVisible();

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 4 personer' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    const utfallStatus = page.getByRole('status').filter({ hasText: 'Utskicket lyckades delvis' });
    await expect(utfallStatus).toContainText('3 av 4 personer fick mailet.');
    await expect(page.getByText('E-postadressen studsade (bounced)')).toBeVisible();

    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.actionType).toBe('fritt');
    expect(body.registrationIds).toEqual([ANNA, BJORN, CECILIA, FILIP]);
    expect(body.amne).toBe('Hej från Miranon Media');
    expect(body.mailtext).toBe('Hej {förnamn},\n\nEtt fritt meddelande.\n\nRoger och Lotta');

    // AC #3-arvet (samma avmarkerings-regel som 147.2): Filip (fallen) kvar
    // markerad, de tre lyckade avmarkerade. Nämnaren är 5 (Skövde-eventets
    // samtliga registreringar) oavsett markering.
    await page.locator('button', { hasText: 'Tillbaka till åtgärderna' }).click();
    await oppnaMottagarlista(page);
    await expect(page.getByText('1 av 5 deltagare markerade')).toBeVisible();
    const filipKryss = page.getByRole('checkbox', { name: /Filip Forsberg/ });
    await expect(filipKryss).toBeChecked();
    const annaKryss = page.getByRole('checkbox', { name: /Anna Andersson/ });
    await expect(annaKryss).not.toBeChecked();

    await axeNoll(page);
  });
});
