// get-mail-log — kontrakt-conformance mot deployad staging-EF (Fas 6e L2 Landning 1).
//
// get-mail-log är en GLOBAL läs-lista (Utskickslogg — varje rad = ett verkligt
// mailutskick, INGET aktiv-filter, INGEN event-gren, INGEN cursor, INGEN 404). EF:en
// hämtar hela tabellen och sorterar createdTime desc (JS-side).
//
// ── MEDVETET VAL: KONTRAKT-MOT-TOM, INGEN SEEDAD FIXTUR ──────────────────────────
// Till skillnad från get-waitlist-gaten (som seedar aktiva/Flyttad-rader för att bevisa
// aktiv-filtrets conformance) seedar denna gate INGENTING. Skälen:
//   1. Utskickslogg är EMPIRISKT TOM i både prod och staging (Session 33 L2 STEG 1,
//      live-verifierat) — vår enda skrivare är L3 send-email, som inte finns än.
//   2. get-mail-log har INGET filter/ingen event-gren att bevisa conformance på — den
//      är ren global hämtning. Det finns ingen filter-invariant att seeda emot.
//   3. Att seeda syntetiska Utskickslogg-rader vore FALSK utskickshistorik i en logg
//      som ska spegla VERKLIGA mail → vi seedar aldrig låtsas-utskick.
// Skarp data-conformance (oppningsgrad decimal-0–1, länk-array-form, createdTime-sort
// över kända rader) bevisas i L3 när send-email skriver den FÖRSTA riktiga raden.
//
// Vad denna gate ÄRLIGT bevisar mot tom tabell:
//   1. AUTH: anon (ingen JWT) → 401 (classify401Body-mönstret).
//   2. KONTRAKT: autentiserad GET → 200 + svar har `{ maillog: [...] }`-form;
//      z.array(MailLogEntrySchema).parse(body.maillog) PASSERAR (tom array parsar rent
//      → bevisar att schema-formen är giltig OCH att wrapper-nyckeln stämmer).
//   3. CORS: tillåten origin speglas i Access-Control-Allow-Origin.
// (INGEN rad-identitet, INGEN sort-assertion mot kända rader — det finns inga rader.)
//
// Auth via getValidUserJWT → persisterad api-token-artefakt (T24-b: api-setup loggar
// in EN gång, sviten läser artefakten — ingen GoTrue-429-burst). Lokalt skip:as utan
// staging-creds; kontrakt-beviset körs i CI (STAGING_REQUIRED=1).

import { type APIRequestContext, expect, test } from '@playwright/test';
import { z } from 'zod';
import { MailLogEntrySchema } from '../../src/domain/schemas';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

type MailLogEntry = z.infer<typeof MailLogEntrySchema>;

const ALLOWED_ORIGIN = 'http://localhost:5173'; // per CORS_ALLOWED_ORIGINS i staging

async function fetchMailLog(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  origin?: string,
): Promise<{ status: number; maillog: MailLogEntry[]; headers: Record<string, string> }> {
  const headers: Record<string, string> = { Authorization: `Bearer ${jwt}` };
  if (origin) headers.Origin = origin;
  const res = await request.get(`${config.baseUrl}/functions/v1/get-mail-log`, { headers });
  if (res.status() !== 200) return { status: res.status(), maillog: [], headers: res.headers() };
  // .parse() PÅ klienten: bevisar att EF-svaret matchar MailLogEntrySchema-formen.
  // Tom array parsar rent → schema-form + wrapper-nyckel verifierade.
  const maillog = z
    .array(MailLogEntrySchema)
    .parse(((await res.json()) as { maillog: unknown }).maillog);
  return { status: 200, maillog, headers: res.headers() };
}

test.describe('get-mail-log — kontrakt-conformance (Fas 6e L2, global läs-lista, tom tabell)', () => {
  test('kontrakt: autentiserad GET → 200 + { maillog: [...] }, schema-parse passerar', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, maillog } = await fetchMailLog(request, config, jwt);
    expect(status).toBe(200);
    // maillog är en array (tom i praktiken — Utskickslogg är tom tills L3). Parse i
    // fetchMailLog har redan passerat → schema-formen + wrapper-nyckeln är bevisade.
    expect(Array.isArray(maillog), 'svaret ska bära en maillog-array').toBe(true);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}/functions/v1/get-mail-log`);
    await classify401Body(res);
  });

  test('CORS: tillåten origin speglas i Access-Control-Allow-Origin', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const { status, headers } = await fetchMailLog(request, config, jwt, ALLOWED_ORIGIN);
    expect(status).toBe(200);
    expect(headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });
});
