import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-275.3 — Dokument-ytan utbyggd: räckviddsval, gemensamt läge, badges
 * (PRD task-275, ADR-118).
 *
 * VAD DENNA FIL BEVISAR (acceptance-bas.ts § VAD KLASSEN BEVISAR): att
 * DokumentYta.tsx renderar rätt GIVET ett EF-svar av rätt form — inte att
 * staging faktiskt returnerar den formen (det är api-staging-sviternas jobb,
 * `tests/api/*.staging.test.ts`, se `upload-attachment.staging.test.ts` §
 * TASK-275.3-tillägget m.fl. för den skarpa halvan).
 *
 * TÄCKNING:
 *   AC #1 — uppladdningsflödet bär räckviddsval (radio: Detta event/En
 *     kurstyp/Alla event; Kurstyp visar Kursfamilj-select + Kursnivå-select
 *     BARA för en nivåbärande familj, RIM).
 *   AC #2 — Dokument-sidan har ett läge UTAN valt event som visar gemensamma
 *     dokument (räckviddsläget); "Detta event" är avstängd där (inget event
 *     att koppla mot).
 *   AC #4 — Ersätt/Radera är INTE tillgängliga i eventkontext för en
 *     GEMENSAM bilaga (badgen bär förklaringen i stället) men ÄR
 *     tillgängliga i räckviddsläget (samma bilaga, samma id).
 *   AC #5 — axe 0 violations i BÅDA lägena (eventläge + räckviddsläge).
 *
 * `get-event-attachments` grenar på `?eventId=` (samma sätt som
 * `get-registrations` redan gör i `handlers.ts`) — EN handler, delad mellan
 * alla test i filen: MED `eventId` = eventlägets union (egen + gemensam),
 * UTAN = räckviddslägets lista (bara gemensam, EXAKT så servern beter sig
 * sedan TASK-275.3, se `get-event-attachments/index.ts` § filhuvudet).
 */

const BILAGA_EGEN = {
  id: 'recBilagaEgen00001',
  namn: 'Programöversikt.pdf',
  storlekBytes: 102_400,
  skapad: '2026-08-10T09:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Event',
  kursfamilj: null,
  kursniva: null,
} as const;

const BILAGA_GEMENSAM = {
  id: 'recBilagaGemensam01',
  namn: 'Hörlursinformation.pdf',
  storlekBytes: 51_200,
  skapad: '2026-08-05T09:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Kurstyp',
  kursfamilj: 'RIM',
  kursniva: null,
} as const;

function bilagorHandler() {
  return http.get(EF('get-event-attachments'), ({ request }) => {
    const eventId = new URL(request.url).searchParams.get('eventId');
    if (eventId) return json({ attachments: [BILAGA_EGEN, BILAGA_GEMENSAM] });
    return json({ attachments: [BILAGA_GEMENSAM] });
  });
}

async function gotoEventlage(page: import('@playwright/test').Page) {
  await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
  await expect(page.getByText(BILAGA_GEMENSAM.namn)).toBeVisible();
}

async function gotoRackviddslage(page: import('@playwright/test').Page) {
  await page.goto('/mer/dokument');
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
  await expect(page.getByText(BILAGA_GEMENSAM.namn)).toBeVisible();
}

test.describe('Dokument-ytan — räckviddsval, gemensamt läge, badges (TASK-275.3)', () => {
  test('AC #1: uppladdningsflödet bär räckviddsval — radio Detta event/En kurstyp/Alla event, Kursfamilj-select vid Kurstyp', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);

    const radioGroup = page.getByRole('radiogroup', { name: 'Räckvidd' });
    await expect(radioGroup).toBeVisible();
    const dettaEvent = radioGroup.getByRole('radio', { name: 'Detta event' });
    const enKurstyp = radioGroup.getByRole('radio', { name: 'En kurstyp' });
    const allaEvent = radioGroup.getByRole('radio', { name: 'Alla event' });
    await expect(dettaEvent).toBeChecked();
    await expect(enKurstyp).toBeVisible();
    await expect(allaEvent).toBeVisible();
    // I eventläget är "Detta event" INTE avstängd (ett event ÄR valt).
    await expect(dettaEvent).toBeEnabled();

    // Ingen Kursfamilj-select innan Kurstyp är valt.
    await expect(page.getByLabel('Kursfamilj')).toHaveCount(0);

    // RAC:s `<Radio>` renderar (som `<Checkbox>`, se klickaKryss-mönstret i
    // atgarder-bilageval-send.acceptance.test.ts) sin `<input>` VISUELLT
    // täckt av ett eget dekorativt `<span>` — ett direkt `.click()` på
    // rollen hit-testar mot spannet och timeoutar. Klicka ANCESTOR-`<label>`
    // i stället (samma etablerade repo-mönster).
    await enKurstyp.locator('xpath=ancestor::label[1]').click();
    await expect(page.getByLabel('Kursfamilj')).toBeVisible();
    // Kursnivå-selecten syns INTE förrän en nivåbärande familj är vald.
    await expect(page.getByLabel('Kursnivå')).toHaveCount(0);

    await page.getByLabel('Kursfamilj').click();
    await page.getByRole('option', { name: 'RIM', exact: true }).click();
    await expect(page.getByLabel('Kursnivå')).toBeVisible();

    // Byte till en nivålös familj (Fjärrskådning) döljer Kursnivå-selecten
    // igen (ADR-118 beslut 1: nivålösa familjer lämnar alltid nivån tom).
    await page.getByLabel('Kursfamilj').click();
    await page.getByRole('option', { name: 'Fjärrskådning', exact: true }).click();
    await expect(page.getByLabel('Kursnivå')).toHaveCount(0);
  });

  test('AC #2: räckviddsläget (utan valt event) visar gemensamma dokument, "Detta event" avstängd', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);

    // Event-scopade bilagor ("Programöversikt.pdf") hör INTE hemma i
    // räckviddsläget — bara den gemensamma bilagan listas.
    await expect(page.getByText(BILAGA_EGEN.namn)).toHaveCount(0);

    const radioGroup = page.getByRole('radiogroup', { name: 'Räckvidd' });
    await expect(radioGroup.getByRole('radio', { name: 'Detta event' })).toBeDisabled();
    await expect(radioGroup.getByRole('radio', { name: 'En kurstyp' })).toBeChecked();
  });

  test('AC #4: gemensam bilaga — Ersätt/Radera SAKNAS i eventläget (badge bär förklaringen), men FINNS i räckviddsläget', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);

    const gemensamRadEventlage = page
      .getByTestId('dokument-fil')
      .filter({ hasText: BILAGA_GEMENSAM.namn });
    await expect(gemensamRadEventlage).toBeVisible();
    await expect(gemensamRadEventlage.getByText('RIM · alla nivåer')).toBeVisible();
    await expect(gemensamRadEventlage.getByRole('button', { name: 'Ersätt' })).toHaveCount(0);
    await expect(gemensamRadEventlage.getByRole('button', { name: 'Radera' })).toHaveCount(0);

    // SAMMA bilaga (samma id/namn), i räckviddsläget: BÅDA knapparna finns.
    await gotoRackviddslage(page);
    const gemensamRadRackviddslage = page
      .getByTestId('dokument-fil')
      .filter({ hasText: BILAGA_GEMENSAM.namn });
    await expect(gemensamRadRackviddslage.getByRole('button', { name: 'Ersätt' })).toBeVisible();
    await expect(gemensamRadRackviddslage.getByRole('button', { name: 'Radera' })).toBeVisible();
  });

  test('AC #5: eventläget är axe-rent (badge + räckviddsval synliga)', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('AC #5: räckviddsläget är axe-rent', async ({ page, network }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
