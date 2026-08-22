// test-docraptor-render — utkast-leveransvägen (TASK-302.1, PRD TASK-302,
// ADR-124). Skarp conformance mot deployad staging-EF — samma disciplin som
// syskonsviterna (get-attachment-download-url.staging.test.ts m.fl.):
// bevisar mot RIKTIG staging-infrastruktur, inte en mockad approximation.
//
// Minimaltest (CLAUDE.md: minimalt test före full implementation) för TVÅ
// beteenden:
//
//   1. `leverans: 'utkast'` (kräver eventId + typ) skriver PDF-bytesen som
//      ett TRANSIENT utkast till Storage och svarar { url, utgar } — en
//      signerad URL, inte rå PDF-bytes. HEAD mot url ger 200,
//      accept-ranges: bytes, content-type: application/pdf (AC #1 + #3,
//      "mätt i testet, inte antaget" — se _shared/attachments.ts §
//      SIGNED_DOWNLOAD_URL_TTL_SECONDS och den redan mätta förkravs-raden
//      i tasks/sessions/2026-08-20-session-108.md Del 10 § C).
//   2. Ett ANDRA anrop för SAMMA eventId+typ skapar INGET NYTT objekt
//      (`upsert: true`, deterministisk path `utkast/<eventId>/<typ>.pdf`).
//      BEVISET: Supabase Storages signerade URL är formad
//      `.../storage/v1/object/sign/<bucket>/<path>?token=...` — path-delen
//      (allt FÖRE frågetecknet) är alltså den DETERMINISTISKA
//      objektnyckeln. Två anrop för samma eventId/typ måste därför ge
//      IDENTISK pathname trots olika token/signatur — annars vore det
//      bevisligen två olika objekt. Ingen service-role-nyckel behövs för
//      detta bevis (testerna får aldrig Airtable/Storage-admin-creds,
//      ADR-060) — det är synligt i den PUBLIKA URL-strukturen själv.
//
// AC #2 (default-beteendet oförändrat): en snabb regressionskontroll utan
// `leverans` (default 'bytes') visar att ADR-119 beslut 7:s ursprungliga
// kontrakt (rå application/pdf-bytes) inte rörts av denna skivas tillägg.
//
// DENY-fallen (leverans/eventId/typ-valideringen, `_shared/utkast.ts` §
// laggUtkast + index.ts:s närvaro-kontroll) prövas i båda riktningar —
// "bevis i båda riktningar", uppdragets egen formulering.
//
// SENTINEL/STÄDNING: `utkast/<eventId>/<typ>.pdf` är per konstruktion
// BUNDEN (upsert — högst en fil per event och typ, TASK-302 §
// Designbeslut) — denna svit lämnar högst EN kvarvarande liten PDF per
// (eventId, typ)-kombination den använder, återanvänd/överskriven av
// nästa körning. Ingen ny purge-target krävs av DENNA skiva (TASK-302.3
// äger prod/staging-städningen av utkast-namnrymden som helhet).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { UtkastResultatSchema } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/test-docraptor-render';

/** Liten, giltig self-contained HTML — inget CSS/typsnitt att bädda in
 * krävs för detta pass (mät-djupet i pdftotext/pdffonts hör till
 * ADR-119 beslut 7:s EGET minimaltest, `scripts/docraptor-minimaltest.mjs`;
 * denna svit bevisar leveransVÄGEN, inte renderingskvaliteten). */
function html(text: string): string {
  return `<html><body><p>${text}</p></body></html>`;
}

async function renderUtkast(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  body: Record<string, unknown>,
) {
  return request.post(`${config.baseUrl}${ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: body,
  });
}

test.describe('test-docraptor-render — utkast-leveransvägen (TASK-302.1)', () => {
  test('allow: leverans utkast svarar { url, utgar }; HEAD ger 200/accept-ranges/pdf; andra anropet återanvänder SAMMA path (upsert)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res1 = await renderUtkast(request, config, jwt, {
      html: html('TASK-302.1 utkast-test åäö körning 1'),
      namn: 'TASK-302.1 utkasttest',
      leverans: 'utkast',
      eventId: BELAGGNING_EVENT_ID,
      typ: 'bilaga',
    });
    const raw1 = await res1.text();
    expect(res1.status(), raw1).toBe(200);
    const body1 = UtkastResultatSchema.parse(JSON.parse(raw1));
    expect(body1.url).toMatch(/^https:\/\//);
    expect(new Date(body1.utgar).getTime()).toBeGreaterThan(Date.now());

    // ÅTKOMST-BEVISET: URL:en prövas faktiskt, inte bara plausibel form.
    // HEAD utan Authorization-header — den signerade URL:en bär sin egen
    // token (samma disciplin som get-attachment-download-url.staging.test.ts).
    const head1 = await request.head(body1.url);
    expect(head1.status(), 'signerad URL gav inte 200 på HEAD').toBe(200);
    expect(head1.headers()['accept-ranges']).toBe('bytes');
    expect(head1.headers()['content-type']).toMatch(/^application\/pdf/);

    const path1 = new URL(body1.url).pathname;
    expect(path1).toContain(`utkast/${BELAGGNING_EVENT_ID}/bilaga.pdf`);

    // UPSERT-BEVISET: andra anropet, SAMMA eventId/typ, ANNAT html-innehåll
    // (annan renderad PDF) — måste ändå ge IDENTISK objekt-path.
    const res2 = await renderUtkast(request, config, jwt, {
      html: html('TASK-302.1 utkast-test åäö körning 2, annat innehåll'),
      namn: 'TASK-302.1 utkasttest',
      leverans: 'utkast',
      eventId: BELAGGNING_EVENT_ID,
      typ: 'bilaga',
    });
    const raw2 = await res2.text();
    expect(res2.status(), raw2).toBe(200);
    const body2 = UtkastResultatSchema.parse(JSON.parse(raw2));
    const path2 = new URL(body2.url).pathname;

    expect(path2, 'andra anropet skapade ett NYTT objekt i stället för upsert').toBe(path1);

    const head2 = await request.head(body2.url);
    expect(head2.status()).toBe(200);
    expect(head2.headers()['accept-ranges']).toBe('bytes');
    expect(head2.headers()['content-type']).toMatch(/^application\/pdf/);
  });

  test('regression: leverans utelämnad (default bytes) — oförändrat rå application/pdf-svar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await renderUtkast(request, config, jwt, {
      html: html('TASK-302.1 regressionstest åäö'),
      namn: 'TASK-302.1 regressionstest',
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/^application\/pdf/);
    const bytes = await res.body();
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  test('deny: leverans utkast utan eventId → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await renderUtkast(request, config, jwt, {
      html: html('deny-test'),
      namn: 'deny-test',
      leverans: 'utkast',
      typ: 'bilaga',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: leverans utkast med ogiltig typ → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await renderUtkast(request, config, jwt, {
      html: html('deny-test'),
      namn: 'deny-test',
      leverans: 'utkast',
      eventId: BELAGGNING_EVENT_ID,
      typ: 'ogiltig-typ',
    });
    expect(res.status()).toBe(400);
  });

  test('deny: ogiltigt leverans-värde → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await renderUtkast(request, config, jwt, {
      html: html('deny-test'),
      namn: 'deny-test',
      leverans: 'ogiltig',
    });
    expect(res.status()).toBe(400);
  });
});
