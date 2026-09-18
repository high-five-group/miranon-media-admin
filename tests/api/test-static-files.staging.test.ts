// test-static-files — TASK-309.1 "Skiva 0: minimaltest — bundlade
// mallfiler i en Edge Function via staging-deploy (static_files)".
//
// Skarp conformance mot deployad staging-EF — samma disciplin som
// syskonsviterna (t.ex. generate-event-attachment.staging.test.ts):
// bevisar mot RIKTIG staging-infrastruktur, inte en mockad approximation.
// [TASK-309.4] test-docraptor-render-utkast.staging.test.ts — den tidigare
// syskonsviten kommentaren pekade på — är RIVEN tillsammans med
// test-docraptor-render/index.ts (ADR-125 § Beslut 5).
//
// REGRESSIONSVAKT (AC #3 — behållen, inte riven): CLI/plattforms-uppdateringar
// kan tyst ändra vilken bundlingsväg som faktiskt fungerar i denna miljö
// (ingen Docker på deploy-maskinen → API-bundling). Detta test låser fastnat
// FAKTISKT, mätt beteende (2026-08-23, Supabase CLI 2.115.0) för BÅDA
// vägarna EF:en mäter — inte ett antagande om vad som BORDE fungera:
//
//   (a) static_files + `Deno.readFile` — FALLERAR i denna miljö
//       (`NotFound`, filen placeras inte i den körande instansens
//       filsystem trots att CLI:t laddar upp den vid deploy).
//   (c) genererade TS-strängmoduler (`minimaltest.text.ts`,
//       `carlito-regular.base64.ts`) — FUNGERAR (ren ES-modul-import).
//
// Fallback (b), text-import `with { type: 'text' }`, testades i
// byggsessionen men kunde inte ens DEPLOYAS (bundlaren nekar import-
// attribut, 400 Bad Request) — koden för det försöket finns inte kvar i
// EF:en (en trasig import stoppar hela bundeln). Verbatim CLI-fel +ADR-125
// § Updates.
//
// Facit (ADR-086-disciplin — mätt, inte antaget, TASK-309.1-byggsessionen):
//   - minimaltest.html: 291 bytes, första raden "<!doctype html>"
//     (`wc -c` + `head -1` på källfilen).
//   - Carlito-Regular.ttf: 628032 bytes, sfnt-magic "00 01 00 00"
//     (`wc -c` + `xxd`/`head -c 4` på `public/fonts/bilagor/Carlito-
//     Regular.ttf` — byte-identisk kopia, se ADR-125 § Beslut 4).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1) EFTER att EF:en
// deployats till staging.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/test-static-files';

const FORVANTAD_HTML_BYTES = 291;
const FORVANTAD_HTML_FORSTA_RAD = '<!doctype html>';
const FORVANTAD_TTF_BYTES = 628032;
const FORVANTAD_TTF_MAGIC = '00 01 00 00';

interface VagResultat {
  ok: boolean;
  html?: { bytes: number; forstaRad: string };
  ttf?: { bytes: number; magic: string } | string;
  errorName?: string;
  errorMessage?: string;
}

async function anropaTestStaticFiles(request: APIRequestContext, config: ApiConfig, jwt: string) {
  return request.get(`${config.baseUrl}${ENDPOINT}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
}

test.describe('test-static-files — bundlingsvägarnas regressionsvakt (TASK-309.1)', () => {
  test('allow: static_files FALLERAR (NotFound) — TS-strängmodul-fallback (c) FUNGERAR med exakta bytes + facit', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await anropaTestStaticFiles(request, config, jwt);
    const raw = await res.text();
    expect(res.status(), raw).toBe(200);

    const body = JSON.parse(raw) as {
      staticFiles: VagResultat;
      tsStrangmodul: VagResultat;
    };

    // (a) static_files — LÅST FALLERANDE beteende i denna miljö. Går detta
    // grönt (ok: true) i en framtida körning är det en ÄKTA regression att
    // fira, inte ett fel att tysta ner — CLI:t eller plattformen har löst
    // begränsningen, och ADR-125 § Updates ska uppdateras därefter.
    expect(body.staticFiles.ok, JSON.stringify(body.staticFiles)).toBe(false);
    expect(body.staticFiles.errorName).toBe('NotFound');

    // (c) TS-strängmoduler — det FAKTISKT fungerande facit-kontraktet.
    expect(body.tsStrangmodul.ok, JSON.stringify(body.tsStrangmodul)).toBe(true);
    expect(body.tsStrangmodul.html?.bytes).toBe(FORVANTAD_HTML_BYTES);
    expect(body.tsStrangmodul.html?.forstaRad).toBe(FORVANTAD_HTML_FORSTA_RAD);
    const ttf = body.tsStrangmodul.ttf as { bytes: number; magic: string };
    expect(ttf.bytes).toBe(FORVANTAD_TTF_BYTES);
    expect(ttf.magic).toBe(FORVANTAD_TTF_MAGIC);
  });

  test('deny: saknad Authorization-header ger 401 (samma gateway-försvar som syskon-EF:erna)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const res = await request.get(`${config.baseUrl}${ENDPOINT}`);
    expect(res.status()).toBe(401);
  });
});
