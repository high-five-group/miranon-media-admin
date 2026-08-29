import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-147.5 — Bilageväljaren skarp (verkligt fundament) + grenvalet till
 * den bilage-bärande sändvägen.
 *
 * VAD DENNA FIL BEVISAR, OCH VAD DEN INTE GÖR (acceptance-bas.ts § VAD KLASSEN
 * BEVISAR): att bilageväljaren (1) läser VERKLIGA bilagor via
 * `get-event-attachments` i stället för den rivna hårdkodade stubben, (2) BÄR
 * INGEN FÖRVALS-LOGIK (AC #4 — noll bilagor förkryssade när listan landar),
 * (3) skickar de VALDA bilagornas record-ID:n som `attachmentIds` i POST-
 * kroppen mot `send-action-email` (AC #1s klient-halva — servern äger själva
 * grenvalet, `_shared/send-action-email.ts` § `runActionSend`, api-pure-
 * bevisat i tests/api/send-action-email.test.ts, INTE upprepat här), och (4)
 * att ett utskick UTAN vald bilaga fortsatt skickar en TOM/frånvarande
 * attachmentIds-lista — regressionsskydd för den oförändrade batchgrenen.
 *
 * AC #2 (bilagan bevisad FRAMME i mottaget mail) provas INTE här — hermetiska
 * MSW-mockar kan per konstruktion inte bevisa att ett riktigt mail med en
 * riktig bilaga anlände. Det kravet är kortets api-staging-bevis (se
 * PR-bodyn/kortets notes för den skulden).
 *
 * FIXTUREN ÅTERANVÄNDS OFÖRÄNDRAD (`VISUAL_EVENT_ID`, delade `get-events`/
 * `get-registrations`-handlers) — samma "Utbildning Skövde"-event och samma
 * fyra seedade mottagare som `atgarder-bekraftelsemail-send.acceptance.test.ts`
 * redan etablerat. `get-event-attachments` är MEDVETET INTE i normalläget för
 * ICKE-TOM data (handlers.ts:s delade default är TOM, `EVENT_ATTACHMENTS_
 * RESPONSE`) — detta test överskuggar med en egen, namngiven fixtur, per
 * filhuvudets egen regel i handlers.ts.
 */

const ANNA = 'recVisualReg000001';
const BJORN = 'recVisualReg000002';

// dokumentklass (TASK-147.12) + rackvidd/kursfamilj/kursniva (TASK-275.2):
// AttachmentSchema.parse() kräver alla fyra (nullable, inte optional) —
// mockresponsen måste bära dem eller klienten kraschar vid parse. Värdena
// är REPRESENTATIVA (klass A/B, matchar respektive filnamns verkliga
// uppkomst; räckvidd Event — dagens koppling, samma som ADR-118:s
// migrerade default) men INTE vad DE FLESTA testen i denna fil bevisar (se
// filhuvudets "VAD DENNA FIL BEVISAR" — den generella dokumentklass-/
// räckviddsvisningen provas i DokumentYta.tsx:s egen svit,
// `dokument-rackviddsval.acceptance.test.ts`). [UTBYGGD, TASK-275.3, ändrad
// TASK-339] EN EGEN gemensam-bilaga-fixtur (`BILAGA_GEMENSAM` nedan) finns
// HÄR specifikt för AC #3 ("Åtgärdssidans bilageväljare visar unionen —
// event-egen + delad bilaga — och kan bifoga gemensamma bilagor, UTAN
// räckviddspill sedan TASK-339"). Badgen (RackviddBadge) TOGS BORT ur denna
// yta av TASK-339 (Marcus prod-röktest 2026-08-29, "blir inte snyggt") —
// den positiva badge-bevisningen bor numera bara i Dokument-ytans egen
// svit (`dokument-rackviddsval.acceptance.test.ts` AC #4).
const BILAGA_INFO = {
  id: 'recBilagaInfo0001',
  namn: 'Hörlursinformation.pdf',
  storlekBytes: 188_416,
  skapad: '2026-08-01T10:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Event',
  kursfamilj: null,
  kursniva: null,
};
const BILAGA_DELTAGARINFO = {
  id: 'recBilagaDelt0001',
  namn: 'Deltagarinformation – Utbildning Skövde.pdf',
  storlekBytes: 1_292,
  skapad: '2026-08-05T10:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Event-mallad',
  rackvidd: 'Event',
  kursfamilj: null,
  kursniva: null,
};
// [TASK-275.3, ADR-118] Gemensam bilaga (räckvidd Alla event) — union-
// medlem sedan TASK-275.2. Bar badge i denna väljare TASK-275.3–TASK-339
// (badgen togs bort härifrån av TASK-339, se filhuvudet).
const BILAGA_GEMENSAM = {
  id: 'recBilagaGemensam02',
  namn: 'Menyalternativ.pdf',
  storlekBytes: 45_056,
  skapad: '2026-08-03T10:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Alla event',
  kursfamilj: null,
  kursniva: null,
};

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

/** Öppnar en namngiven åtgärd UTAN att gå vidare till granskningen — så
    bilageväljarens LEVANDE checkbox-lista kan nås. */
async function oppnaAtgard(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
}

async function armera(page: import('@playwright/test').Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
  await vaxel.focus();
  await vaxel.press('Enter');
}

/**
 * RAC-kryssets `<Checkbox>` renderar en `<input>` VISUELLT täckt av sitt eget
 * dekorativa `<span>`/`<svg>` (samma `group-data-[selected]` hover-fria form
 * som `KRYSSRUTA_KLASS`, AtgardsSida.tsx) — ett direkt `.click()` på
 * `getByRole('checkbox')` hit-testar då mot det täckande elementet och
 * timeoutar. Etablerat repo-mönster (mark-paid.staging.test.ts rad ~375,
 * atgarder-betalningar.staging.test.ts § `klicka`): klicka ANCESTOR-`<label>`
 * i stället — `getByRole('checkbox', …)` används ändå för att HITTA/verifiera
 * elementet, bara inte för att trigga klicket.
 */
function klickaKryss(kryss: import('@playwright/test').Locator): Promise<void> {
  return kryss.locator('xpath=ancestor::label[1]').click();
}

test.describe('Bilageväljaren skarp — verkligt fundament (TASK-147.5)', () => {
  test('AC #4: bilagorna listas verkliga, men INGEN är förvald', async ({ page, network }) => {
    network.use(
      http.get(EF('get-event-attachments'), () =>
        json({ attachments: [BILAGA_INFO, BILAGA_DELTAGARINFO] }),
      ),
    );

    await gotoAtgarder(page);
    await oppnaAtgard(page, 'Skicka bekräftelsemail');

    // Verkliga namn+storlek renderade — stubbens fyra hårdkodade rader
    // (a1/a2/b1/c1) finns inte längre; DETTA är namnen från EF-svaret.
    const infoKryss = page.getByRole('checkbox', { name: 'Bifoga Hörlursinformation.pdf' });
    const deltagarKryss = page.getByRole('checkbox', {
      name: 'Bifoga Deltagarinformation – Utbildning Skövde.pdf',
    });
    await expect(infoKryss).toBeVisible();
    await expect(deltagarKryss).toBeVisible();

    // AC #4, bokstavligt: ingen bilaga förkryssad — verifierat, inte antaget.
    await expect(infoKryss).not.toBeChecked();
    await expect(deltagarKryss).not.toBeChecked();
    await expect(page.getByText('Inga valda')).toBeVisible();

    // Storleken visas nu ALLTID (real data — se BilageValjare-docblocken).
    await expect(page.getByText('0.2 MB')).toBeVisible();
  });

  test('tomt event (INGEN bilaga uppladdad) — ärligt tomt-läge, inte en krasch', async ({
    page,
  }) => {
    // Handlers.ts:s DELADE default (EVENT_ATTACHMENTS_RESPONSE = tom lista) —
    // ingen överskuggning behövs, detta ÄR normalläget.
    await gotoAtgarder(page);
    await oppnaAtgard(page, 'Skicka bekräftelsemail');

    await expect(page.getByText('Inga bilagor tillgängliga för det här eventet.')).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('AC #1 (klient-halva): vald bilaga ⇒ dess record-ID i POST-kroppens attachmentIds', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.get(EF('get-event-attachments'), () => json({ attachments: [BILAGA_INFO] })),
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({
          status: 'sent',
          requested: 2,
          attempted: 2,
          completed: [ANNA, BJORN],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoAtgarder(page);
    await oppnaAtgard(page, 'Skicka bekräftelsemail');

    await klickaKryss(page.getByRole('checkbox', { name: 'Bifoga Hörlursinformation.pdf' }));
    await expect(page.getByText('1 valda')).toBeVisible();

    await page.getByRole('button', { name: 'Granska och skicka' }).click();

    // Granskningens "Bilagor"-rad visar den valda bilagans namn (valdaBilagor,
    // GranskningsSida) — den läser nu SAMMA cache-nyckel som väljaren, inte
    // längre den rivna stubben.
    await expect(page.getByText('Hörlursinformation.pdf')).toBeVisible();

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.attachmentIds).toEqual([BILAGA_INFO.id]);
  });

  test('regressionsskydd: INGEN bilaga vald ⇒ attachmentIds TOM — den oförändrade batchgrenens body', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.get(EF('get-event-attachments'), () => json({ attachments: [BILAGA_INFO] })),
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({
          status: 'sent',
          requested: 2,
          attempted: 2,
          completed: [ANNA, BJORN],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoAtgarder(page);
    await oppnaAtgard(page, 'Skicka bekräftelsemail');
    // Bilagan finns i listan men RÖRS INTE — detta är precis vad "ingen
    // förvals-logik" i praktiken innebär: en synlig, tillgänglig bilaga som
    // Lotta ändå aktivt måste välja.
    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.attachmentIds).toEqual([]);
  });

  // [TASK-339] AC #3 (denna skiva): "Åtgärdssidans bilageväljare visar
  // unionen — event-egen + delad bilaga — UTAN räckviddspill, och en delad
  // bilaga kan bifogas och skickas med." Unionen SJÄLV kommer redan från
  // servern (TASK-275.2, oförändrad här — `BILAGA_GEMENSAM` ligger bara i
  // EF-svaret precis som en riktig gemensam bilaga hade gjort). Badgen
  // (RackviddBadge, TASK-275.3) TOGS BORT ur denna yta av TASK-339 (Marcus
  // prod-röktest 2026-08-29, "blir inte snyggt") — den negativa
  // räckviddspill-assertionen nedan är regressionsskyddet mot att den
  // återinförs här. Den positiva sidan (badgen SYNS i Dokument-ytan) bevisas
  // av `dokument-rackviddsval.acceptance.test.ts` AC #4, inte duplicerad
  // här.
  test('AC #3: unionen (event-egen + delad bilaga) syns UTAN räckviddspill, delad bilaga kan bifogas och skickas', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.get(EF('get-event-attachments'), () =>
        json({ attachments: [BILAGA_INFO, BILAGA_GEMENSAM] }),
      ),
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({
          status: 'sent',
          requested: 2,
          attempted: 2,
          completed: [ANNA, BJORN],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoAtgarder(page);
    await oppnaAtgard(page, 'Skicka bekräftelsemail');

    // UNIONEN: både event-egen (BILAGA_INFO) och delad (BILAGA_GEMENSAM)
    // listas.
    const egenKryss = page.getByRole('checkbox', { name: `Bifoga ${BILAGA_INFO.namn}` });
    const gemensamKryss = page.getByRole('checkbox', { name: `Bifoga ${BILAGA_GEMENSAM.namn}` });
    await expect(egenKryss).toBeVisible();
    await expect(gemensamKryss).toBeVisible();

    // [TASK-339] INGEN räckviddspill i väljaren — varken för räckvidd Event
    // (aldrig haft badge) eller för Alla event (BILAGA_GEMENSAM, bar badgen
    // fram till denna skiva). "Alla event" förekommer ingen annanstans på
    // Åtgärds-sidan (verifierat i källan), så frånvaron här bevisar att
    // badgen inte läcker tillbaka.
    await expect(page.getByText('Alla event')).toHaveCount(0);

    // BIFOGBARHETEN: samma klick-mekanik som en vanlig bilaga (klickaKryss-
    // mönstret, se filhuvudets docblock för varför ancestor-label klickas).
    await klickaKryss(gemensamKryss);
    await expect(gemensamKryss).toBeChecked();
    await expect(page.getByText('1 valda')).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);

    // SÄNDNING MED DEN DELADE BILAGAN BIFOGAD: dess record-ID ska nå
    // `send-action-email`-kroppens attachmentIds — samma mekanism som AC #1
    // (klient-halva) bevisar generellt, här specifikt för en GEMENSAM rad.
    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(BILAGA_GEMENSAM.namn)).toBeVisible();
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.attachmentIds).toEqual([BILAGA_GEMENSAM.id]);
  });
});
