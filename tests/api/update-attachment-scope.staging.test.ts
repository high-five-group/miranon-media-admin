// update-attachment-scope — skarp conformance mot deployad staging-EF
// (TASK-338.4, ADR-125 § Beslut 1). Lottas "Ändra räckvidd": en redan
// uppladdad delad bilaga byter axlar utan att filen laddas upp igen
// (PRD TASK-338 berättelse 8). Bevisar mot SKARP staging-data:
//
//   1. allow: axellös gemensam ("alla event") → Plats Rönninge. Svaret bär
//      `plats: { id, namn }` med namnet ur `Platsnamn`-lookupen, och en
//      efterföljande get-event-attachments-listning ser SAMMA länk — alltså
//      att raden FAKTISKT ändrades, inte bara att svaret såg rätt ut.
//   2. allow: TILLBAKA till axellös. TOMMA AXLAR RENSAS — `plats` är `null`
//      efteråt, inte kvarstående. Detta är fallet en PATCH lätt får fel:
//      Airtable lämnar ett UTELÄMNAT fält orört, så en fältbyggare som
//      återanvände `buildScopeFields` (CREATE-formen) hade svarat 200 med
//      platsen kvar. Se `buildScopeUpdateFields` § VARFÖR EN EGEN FUNKTION.
//   3. allow: familj + plats tillsammans (RIM · Rönninge) — OCH-kombinationen
//      skrivs som två fält, inte som ett.
//   4. allow: legacy-målräckvidden 'Alla event' normaliseras till Gemensam
//      och TÖMMER axlarna (installerade PWA-klienter, samma tolerans som
//      skrivvägen).
//   5. deny: en EVENT-egen bilaga → 403 (`ej-gemensam`).
//   6. deny: okänt plats-ID (rec-format, finns ej) → 404.
//   7. deny: målräckvidd 'Event' → 400 — en delad bilaga kan inte göras
//      event-egen här (storage-ankaret, se EF:ens filhuvud).
//   8. deny: ANKAR-FLYTTEN → 409. En familjebunden bilaga (`kurstyp/rim`)
//      kan inte bli axellös (`alla-event`), eftersom bytesen ligger kvar
//      under det gamla prefixet.
//   9. okänt attachmentId (rec-format, finns ej) → 404.
//  10. deny: ogiltig attachmentId-FORM → 400.
//  11. anon (ingen JWT) → 401.
//  12. CORS preflight (tillåten origin) → 200 + speglad origin.
//  13. fel HTTP-metod (GET) → 405.
//
// (11)+(12)+(13) = deny-triple-klass-beviset, samma tre icke-lyckade-vägar
// som delete-attachment/upload-attachment bär för samma bevisklass.
//
// VAD DENNA SVIT INTE KAN BEVISA, öppet bokfört: hindret `fel-dokumentklass`
// (en gemensam bilaga som är mall-genererad → 403). Ingen skrivväg vi har
// producerar den kombinationen — `generate-event-attachment` skriver
// `Dokumentklass: Event-mallad` men aldrig något `Räckvidd`, så en sådan rad
// fälls redan av `ej-gemensam` och testet hade bevisat FEL vakt medan det
// såg grönt ut. Vakten bevisas i stället deterministiskt i
// `tests/api/rackvidds-byte.test.ts`; se den filens huvud.
//
// ALLOW-RIKTNINGEN AV FÄLT-ALLOWLISTEN bevisas av fall 1–4: en lyckad
// ändring betyder per konstruktion att alla fyra fälten passerade
// `findDisallowedField` (ett saknat fält i listan hade gett 400, inte 200).
// Deny-riktningen bevisas i `rackvidds-byte.test.ts` § field-allowlists —
// se den filens resonemang för varför den inte kan bevisas härifrån.
//
// PLATS-FIXTUREN: `Rönninge` (`rec17l2c64foUy6WU`) — LIVE-LÄST ur stagings
// `Platser` 2026-08-29, samma rad `rackvidd-matchning.test.ts` (TASK-338.2)
// redan namnger. PRD:ns egen ort, inte en påhittad.
//
// SENTINEL + TEARDOWN: setup-uppladdningarna återanvänder EXAKT
// upload-attachment.staging.test.ts:s filnamnsmönster
// (`ZZ-attachment-test-<uuid>.pdf`), så `.purge-staging-policy.json`:s
// befintliga target `upload-attachment-sentineler` fångar raderna — INGEN
// ny purge-target behövs. Varje test raderar dessutom sin egen rad via
// delete-attachment (testet äter sin egen disk-data), samma disciplin som
// delete-attachment.staging.test.ts.
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { parsaAttachment } from '../../src/domain/schemas';
import { BELAGGNING_EVENT_ID } from './fixtures';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const UPLOAD_ENDPOINT = '/functions/v1/upload-attachment';
const DELETE_ENDPOINT = '/functions/v1/delete-attachment';
const SCOPE_ENDPOINT = '/functions/v1/update-attachment-scope';

/** `Platser`-raden Rönninge i staging — live-läst 2026-08-29. */
const RONNINGE_PLATS_ID = 'rec17l2c64foUy6WU';
/** rec-FORMAT men existerar inte — för plats-existenskontrollens deny-fall. */
const OKAND_PLATS_ID = 'recZZZZZZZZZZZZZZ';
/** rec-FORMAT men existerar inte — för radens 404-fall. */
const OKAND_ATTACHMENT_ID = 'recYYYYYYYYYYYYYY';

interface ScopeBody {
  attachmentId?: string;
  rackvidd?: string;
  kursfamilj?: string;
  kursniva?: string;
  plats?: string;
}

function postScope(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: ScopeBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${SCOPE_ENDPOINT}`, { headers, data: body });
}

/** Per-körning-unikt sentinel-filnamn — purge-target `upload-attachment-sentineler`. */
function sentinelFilnamn(): string {
  return `ZZ-attachment-test-${randomUUID()}.pdf`;
}

/** Minimal PDF-liknande base64 — samma teknik som syskonsviterna. */
function buildPseudoPdfBase64(totalBytes: number): string {
  const header = '%PDF-1.4\n%';
  const footer = '\n%%EOF';
  return Buffer.from(header + 'A'.repeat(totalBytes - header.length - footer.length) + footer, 'utf8').toString(
    'base64',
  );
}

/**
 * Skapar en RIKTIG bilaga via upload-attachment-EF:en. `eventId` utelämnas
 * för en GENUINT event-lös gemensam bilaga (räckviddslägets egen väg,
 * ADR-118 beslut 5) — det är formen "Ändra räckvidd" arbetar på.
 */
async function skapaBilaga(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  scope: { rackvidd?: string; kursfamilj?: string; kursniva?: string; plats?: string },
  eventId?: string,
): Promise<string> {
  const res = await request.post(`${config.baseUrl}${UPLOAD_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: {
      ...(eventId ? { eventId } : {}),
      filnamn: sentinelFilnamn(),
      contentType: 'application/pdf',
      bytesBase64: buildPseudoPdfBase64(2048),
      ...scope,
    },
  });
  const raw = await res.text();
  expect(res.status(), `setup-uppladdning misslyckades: ${raw}`).toBe(201);
  return parsaAttachment((JSON.parse(raw) as { attachment: unknown }).attachment).id;
}

/** Teardown — raderar raden i räckviddsläge (inget eventId). */
async function stadaGemensam(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  attachmentId: string,
): Promise<void> {
  const res = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data: { attachmentId },
  });
  expect(res.status(), await res.text()).toBe(200);
}

test.describe('update-attachment-scope — skarp conformance (TASK-338.4)', () => {
  test('allow: axellös gemensam → Plats Rönninge; svaret bär plats {id, namn} och raden ÄR ändrad', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, { rackvidd: 'Gemensam' });

    const res = await postScope(request, config, jwt, {
      attachmentId,
      rackvidd: 'Gemensam',
      plats: RONNINGE_PLATS_ID,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);

    // SVARET är i SAMMA form som get-event-attachments (mapAttachmentRecord),
    // så klienten kan skriva rakt in i sin cache — det är hela skälet att
    // EF:en svarar med raden i stället för `{ ok: true }`.
    const efter = parsaAttachment(JSON.parse(raw).attachment);
    expect(efter.id).toBe(attachmentId);
    expect(efter.rackvidd).toBe('Gemensam');
    expect(efter.plats?.id).toBe(RONNINGE_PLATS_ID);
    // Namnet kommer ur `Platsnamn`-lookupen i SAMMA PATCH-svar (mätt mot
    // staging 2026-08-29) — inte ur ett extra uppslag.
    expect(efter.plats?.namn).toBe('Rönninge');
    expect(efter.kursfamilj).toBeNull();

    // EFFEKT-BEVIS: en oberoende LÄSNING ser samma länk. Ett grönt svar är
    // inte samma sak som en ändrad rad.
    const lista = await request.get(
      // RÄCKVIDDSLÄGET ANROPAS UTAN `eventId` (ADR-118 beslut 5) — samma
      // form get-event-attachments.staging.test.ts § hamtaAllaGemensamma bär.
      `${config.baseUrl}/functions/v1/get-event-attachments`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    expect(lista.status(), await lista.text()).toBe(200);
    const rader = (JSON.parse(await lista.text()) as { attachments: unknown[] }).attachments.map(
      (a) => parsaAttachment(a),
    );
    const traff = rader.find((r) => r.id === attachmentId);
    expect(traff, 'den ändrade raden ska finnas i räckviddslistan').toBeDefined();
    expect(traff?.plats?.id).toBe(RONNINGE_PLATS_ID);

    await stadaGemensam(request, config, jwt, attachmentId);
  });

  test('allow: TILLBAKA till axellös — tomma axlar RENSAS, plats blir null', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, {
      rackvidd: 'Gemensam',
      plats: RONNINGE_PLATS_ID,
    });

    const res = await postScope(request, config, jwt, { attachmentId, rackvidd: 'Gemensam' });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);

    const efter = parsaAttachment(JSON.parse(raw).attachment);
    // KÄRNAN I FALLET: platsen är BORTA, inte kvar. En PATCH som utelämnat
    // fältet hade lämnat Rönninge-länken orörd och svarat 200 ändå.
    expect(efter.plats).toBeNull();
    expect(efter.rackvidd).toBe('Gemensam');

    await stadaGemensam(request, config, jwt, attachmentId);
  });

  test('allow: familj OCH plats tillsammans (RIM · Rönninge)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    // Skapas REDAN familjebunden: annars flyttar familje-tillägget
    // storage-ankaret och fälls korrekt av 409 (se det testet nedan).
    const attachmentId = await skapaBilaga(request, config, jwt, {
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
    });

    const res = await postScope(request, config, jwt, {
      attachmentId,
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      plats: RONNINGE_PLATS_ID,
    });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);

    const efter = parsaAttachment(JSON.parse(raw).attachment);
    expect(efter.kursfamilj).toBe('RIM');
    expect(efter.plats?.id).toBe(RONNINGE_PLATS_ID);
    expect(efter.kursniva).toBeNull();

    await stadaGemensam(request, config, jwt, attachmentId);
  });

  test('allow: legacy-målräckvidden "Alla event" normaliseras till Gemensam och tömmer axlarna', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, {
      rackvidd: 'Gemensam',
      plats: RONNINGE_PLATS_ID,
    });

    // En installerad PWA-klient som ännu skickar det gamla värdet ska
    // fungera — samma tolerans som skrivvägen bär (bokförd rivningsskuld).
    const res = await postScope(request, config, jwt, { attachmentId, rackvidd: 'Alla event' });
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);

    const efter = parsaAttachment(JSON.parse(raw).attachment);
    expect(efter.rackvidd).toBe('Gemensam');
    expect(efter.plats).toBeNull();

    await stadaGemensam(request, config, jwt, attachmentId);
  });

  test('deny: en EVENT-egen bilaga → 403 (ej-gemensam)', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, {}, BELAGGNING_EVENT_ID);

    const res = await postScope(request, config, jwt, {
      attachmentId,
      rackvidd: 'Gemensam',
      plats: RONNINGE_PLATS_ID,
    });
    expect(res.status(), await res.text()).toBe(403);

    // RADEN ORÖRD — guarden BLOCKERADE, den svarade inte bara fel medan
    // skrivningen skedde ändå.
    const kvar = await request.get(
      `${config.baseUrl}/functions/v1/get-event-attachments?eventId=${BELAGGNING_EVENT_ID}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    const rader = (JSON.parse(await kvar.text()) as { attachments: unknown[] }).attachments.map(
      (a) => parsaAttachment(a),
    );
    const traff = rader.find((r) => r.id === attachmentId);
    expect(traff?.rackvidd).toBe('Event');
    expect(traff?.plats).toBeNull();

    // Teardown: event-egen rad kräver eventId (delete-attachments kontrakt).
    const del = await request.post(`${config.baseUrl}${DELETE_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      data: { eventId: BELAGGNING_EVENT_ID, attachmentId },
    });
    expect(del.status()).toBe(200);
  });

  test('deny: okänt plats-ID (rec-format, finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, { rackvidd: 'Gemensam' });

    const res = await postScope(request, config, jwt, {
      attachmentId,
      rackvidd: 'Gemensam',
      plats: OKAND_PLATS_ID,
    });
    expect(res.status(), await res.text()).toBe(404);

    // RADEN ORÖRD — och detta är fallet som gör vakten nödvändig: Airtable
    // TYSTAR ett okänt record-ID i ett länkfält, så utan `platsFinns` hade
    // raden blivit PLATS-LÖS (= synlig på alla event) i stället för att
    // anropet nekades. En tyst uppvidgning är värre än ett 4xx.
    const res2 = await postScope(request, config, jwt, { attachmentId, rackvidd: 'Gemensam' });
    expect(parsaAttachment(JSON.parse(await res2.text()).attachment).plats).toBeNull();

    await stadaGemensam(request, config, jwt, attachmentId);
  });

  test('deny: målräckvidd "Event" → 400 — en delad bilaga kan inte göras event-egen här', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const attachmentId = await skapaBilaga(request, config, jwt, { rackvidd: 'Gemensam' });

    const res = await postScope(request, config, jwt, { attachmentId, rackvidd: 'Event' });
    expect(res.status(), await res.text()).toBe(400);

    await stadaGemensam(request, config, jwt, attachmentId);
  });

  test('deny: ANKAR-FLYTTEN — familjebunden kan inte bli axellös → 409', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    // `kurstyp/rim` som storage-anker (event-lös + kursfamilj).
    const attachmentId = await skapaBilaga(request, config, jwt, {
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
    });

    // Att ta bort familjen skulle flytta ankaret till `alla-event` medan
    // bytesen ligger kvar under `kurstyp/rim` — filen hade blivit tyst
    // oöppningsbar OCH oraderbar. 409, inte 400: anropet är välformat, det
    // är radens lagringsläge som står i vägen.
    const res = await postScope(request, config, jwt, {
      attachmentId,
      rackvidd: 'Gemensam',
      plats: RONNINGE_PLATS_ID,
    });
    expect(res.status(), await res.text()).toBe(409);

    // MOTPROVET: samma rad FÅR lägga till platsen så länge familjen står
    // kvar — ankaret är då oförändrat. Utan detta hade 409:an lika gärna
    // kunnat betyda "plats fungerar aldrig med familj".
    const okRes = await postScope(request, config, jwt, {
      attachmentId,
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      plats: RONNINGE_PLATS_ID,
    });
    expect(okRes.status(), await okRes.text()).toBe(200);

    await stadaGemensam(request, config, jwt, attachmentId);
  });

  test('okänt attachmentId (rec-format, finns ej) → 404', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postScope(request, config, jwt, {
      attachmentId: OKAND_ATTACHMENT_ID,
      rackvidd: 'Gemensam',
    });
    expect(res.status()).toBe(404);
  });

  test('deny: ogiltig attachmentId-FORM → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await postScope(request, config, jwt, {
      attachmentId: 'inte-ett-record-id',
      rackvidd: 'Gemensam',
    });
    expect(res.status()).toBe(400);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${SCOPE_ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: { attachmentId: OKAND_ATTACHMENT_ID, rackvidd: 'Gemensam' },
    });
    await classify401Body(res);
  });

  test('CORS preflight: tillåten origin → 200 + Access-Control-Allow-Origin speglar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.fetch(`${config.baseUrl}${SCOPE_ENDPOINT}`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('fel HTTP-metod (GET) → 405', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(`${config.baseUrl}${SCOPE_ENDPOINT}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(res.status()).toBe(405);
  });
});
