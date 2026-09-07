// preview-receipt — "Förhandsgranska alla N" — STAGING-SKARPBEVIS (TASK-370.3,
// PRD TASK-370 § Testbeslut, testskarv 2: "samma skarv som dagens
// preview-receipt-test i staging").
//
// ═══════════════════════════════════════════════════════════════════════════
// EGEN FIL, INTE EN NY test() I preview-receipt.staging.test.ts — VARFÖR
// ═══════════════════════════════════════════════════════════════════════════
// "Samma skarv" (testskarv 2 i PRD:n) betyder samma GENRE av bevis (skarp
// HTTP mot deployad staging-EF, riktig DocRaptor, riktig Storage) — inte
// bokstavligen samma fil. Den kombinerade grenen (`inbetalningIds`) kräver
// EGNA, permanenta Postgres-sideeffekter (två fixtur-`inbetalningar`-rader
// skapas och raderas per körning, se nedan) som den befintliga filens
// `eventId`/typexempel-svit inte har eller behöver — att bunta ihop dem hade
// gjort BÅDA svitens setup svårare att läsa. Samma "en fil per feature-yta"-
// konvention som resten av `tests/api/*.staging.test.ts` redan följer
// (`betalningsdomanen-rls.staging.test.ts`, `get-document-sources.staging.
// test.ts`, m.fl. — inga två obesläktade EF-grenar delar fil bara för att de
// råkar vara samma EF).
//
// ═══════════════════════════════════════════════════════════════════════════
// FIXTURERNA — VARFÖR TVÅ NYA PERMANENTA ANMÄLNINGAR, INTE EN BEFINTLIG
// ═══════════════════════════════════════════════════════════════════════════
// `hamtaRiktigtUnderlag` (preview-receipt/index.ts) kräver en RIKTIG
// `inbetalningar`-rad i Postgres, som i sin tur kräver en RIKTIG Airtable-
// anmälan med ett event-länk (annars kastar EF:en "Anmälan saknar event").
// Ingen befintlig fixtur i denna fil kunde återanvändas UTAN RISK:
//   - BELAGGNING_/ARBETSKO_/EVENTMATCHNING-eventen bär HÅRDKODADE rollup-
//     facit (`BELAGGNING_EXPECTED.antalAnmalda` m.fl.) som en NY länkad
//     anmälan hade förskjutit — att skriva en inbetalning mot en av deras
//     BEFINTLIGA anmälningar hade å andra sidan tillfälligt ändrat samma
//     anmälans SPEGELFÄLT (`Summa inbetalt (kr)`), vilket ingen av dessa
//     fixturers dokumenterade kontrakt utlovar är stabilt.
//   - CHECKIN_-fixturens båda anmälningar är dokumenterade för EN annan
//     domän (närvaro-WRITE-conformance) — att låna dem för betalnings-
//     domänen hade gjort deras docstring missvisande för nästa läsare.
// Lösningen matchar i stället etablerad konvention (ZZ-belaggning-/
// ZZ-arbetsko-/ZZ-Checkin-/ZZ-TASK-284.1-fixturerna): en EGEN, dedikerad
// event+anmälningar-fixtur (`FORHANDSGRANSKA_ALLA_*`, `tests/api/
// fixtures.ts`), skapad via Airtable MCP 2026-09-03. Se fixtures.ts-
// docblocket för STÄDA-INTE-varningen och mutate-and-restore-kontraktet.
//
// Själva Postgres-RADEN (`inbetalningar`) är TRANSIENT och skapas/raderas
// PER TESTKÖRNING (`registrera-inbetalning` → `preview-receipt` →
// `hantera-inbetalning atgard=radera`, i ett `try/finally`) — exakt det
// "skapa och städa egna" uppdraget efterfrågar. `radera` (inte `makulera`)
// väljs medvetet: raden har per definition inget `kvitto_id` (förhands-
// granskningen är sidoeffektsfri, se preview-receipt/index.ts:s filhuvud),
// så `radera` TAR BORT raden helt i stället för att lämna en `makulerad`
// rad kvar för evigt i staging-ledgern — en nattlig körning ska inte
// balonga betalningsledgern med en ny makulerad rad varje natt.
//
// ═══════════════════════════════════════════════════════════════════════════
// VERIFIERINGSMETOD — pdfjs-dist, INTE pdfinfo/pdftotext/pdffonts (bokfört val)
// ═══════════════════════════════════════════════════════════════════════════
// Uppdraget bad om `pdfinfo`/`pdffonts`/`pdftotext -bbox` (poppler-utils).
// VERIFIERAT (2026-09-03, `grep -rn poppler .github/workflows/`): poppler-
// utils installeras ALDRIG i `ci.yml`/`ci-suite.yml` — `scripts/mall-pdf.mjs`
// (den ENDA konsumenten av dessa binärer i repot) är ett LOKALT dev-verktyg,
// aldrig CI-wirat. `test-staging`-jobbet (`ci-suite.yml`) kör `npx playwright
// install chromium` men ingen `apt-get install poppler-utils`. Ett test som
// `spawnSync('pdfinfo', …)` i CI hade alltså failat med ENOENT varje natt.
//
// I stället: SAMMA `pdfjs-dist`-metod som `preview-receipt.staging.test.ts`
// redan etablerat (ren JS, inget systembinär-beroende, se den filens § FÖR
// VARFÖR pdfjs-dist). Sidantal = `doc.numPages` (ersätter `pdfinfo`);
// inbäddat typsnitt = `/FontFile[23]?\b/`-regex på råa byten (ersätter
// `pdffonts … emb=yes` — samma "Carlito"-tolkning som sibling-filen: ingen
// av de två testerna grep:ar bokstavligen fontNAMNET, båda bevisar att ETT
// typsnitt är INBÄDDAT, inte bara refererat, vilket är den faktiskt
// verifierbara premissen givet Prince/DocRaptors PDF-struktur).
//
// "INGEN ÖVERLAPPNING VID SIDBRYTNINGARNA" — bevisas här som SIDSEPARATION,
// inte som pixel-/bbox-överlapp: text extraheras PER SIDA (`getPage(n)`,
// inte hela dokumentet i en sträng som sibling-filen gör för sitt
// endasidiga typexempel), och varje sidas innehåll verifieras att vara
// EXAKT den personens data — INGEN av den andra personens text får synas
// på fel sida. Om `kombineraFylldaKvittoSidor`s `break-before: page`-
// injektion (`_shared/kvitto-kombination.ts`) någonsin skulle brista och
// låta ett kvitto svämma över på fel sida, hade DEN personens namn/belopp
// dykt upp på en sida där det inte hör hemma — vilket denna kontroll fäller.
// Pixel-exakt bbox-överlapp INOM en sida (Prince-layouten brister för ett
// enskilt, ovanligt LÅNGT kvitto) är en ANNAN fråga — mätpunkt 3 i PRD:ns
// research-underlag, mätt separat med poppler LOKALT (`npm run mall:pdf`),
// eftersom den mätningen är en ENGÅNGSHÄNDELSE inför denna skiva, inte ett
// permanent CI-test (kortets AC #3 om det artificiellt långa kvittot).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan
// creds; skarpa beviset körs i CI (STAGING_REQUIRED=1, `test-staging`-jobbet,
// `npm run test:api:staging`) — se ci-suite.yml § test-staging.

import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { RegistreraInbetalningResultSchema, UtkastResultatSchema } from '../../src/domain/schemas';
import { formatBelopp } from '../../supabase/functions/_shared/receipt-content';
import {
  FORHANDSGRANSKA_ALLA_ANMALAN_A_ID,
  FORHANDSGRANSKA_ALLA_ANMALAN_B_ID,
  FORHANDSGRANSKA_ALLA_EPOST_A,
  FORHANDSGRANSKA_ALLA_EPOST_B,
  FORHANDSGRANSKA_ALLA_NAMN_A,
  FORHANDSGRANSKA_ALLA_NAMN_B,
} from './fixtures';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const PREVIEW_ENDPOINT = '/functions/v1/preview-receipt';
const REGISTRERA_ENDPOINT = '/functions/v1/registrera-inbetalning';
const HANTERA_ENDPOINT = '/functions/v1/hantera-inbetalning';

/** Kronbeloppen — MEDVETET OLIKA så "rätt belopp på rätt sida" är ett skarpt
 *  prov (identiska belopp hade inte kunnat skilja en omkastad sidordning
 *  från en korrekt). */
const BELOPP_A = 500;
const BELOPP_B = 750;
const SUMMA = BELOPP_A + BELOPP_B; // 1250 — "SEK 1 250,00" (byggForsattsbladData)

/** pdfjs-dist (ren JS) — se filhuvudets § VERIFIERINGSMETOD. */
async function extraheraTextPerSida(pdfBytes: Buffer): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(pdfBytes) }).promise;
  const sidor: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    sidor.push(content.items.map((item) => ('str' in item ? item.str : '')).join(''));
  }
  return sidor;
}

/** `/FontFile2` (TrueType) eller `/FontFile3` (CFF/OpenType) i den råa
 *  byteströmmen — bevisar att typsnittet FAKTISKT bäddades in. Samma
 *  teknik som preview-receipt.staging.test.ts/generate-event-attachment.
 *  staging.test.ts. */
function harInbaddatTypsnitt(pdfBytes: Buffer): boolean {
  const raw = pdfBytes.toString('latin1');
  return /\/FontFile[23]?\b/.test(raw);
}

function postJson(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  path: string,
  data: Record<string, unknown>,
): Promise<APIResponse> {
  return request.post(`${config.baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    data,
  });
}

/** Registrerar en TRANSIENT inbetalning mot en av de permanenta
 *  fixtur-anmälningarna. Returnerar `inbetalning.id` (UUID) — vad
 *  `preview-receipt`s `inbetalningIds` och `hantera-inbetalning`s
 *  `inbetalningId` båda konsumerar.
 *
 *  `belopp` skickas som STRÄNG, inte tal — `registrera-inbetalning` kör den
 *  genom `normaliseraBelopp` (`_shared/betalningsbelopp.ts`), som EXPLICIT
 *  kräver `typeof ratext === 'string'` (Lottas råa banktext, "2 500,00") och
 *  ger `null`/400 för allt annat, en riktig person-fällning mätt lokalt
 *  innan denna kommentar skrevs. */
async function registreraFixturInbetalning(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  anmalanRecordId: string,
  belopp: number,
): Promise<string> {
  const res = await postJson(request, config, jwt, REGISTRERA_ENDPOINT, {
    anmalanRecordId,
    belopp: String(belopp),
    betalsatt: 'Swish',
    typ: 'inbetalning',
    // [TASK-367 review runda 1, FYND 2] `medKvitto` är sedan denna skiva
    // OBLIGATORISKT (`registrera-inbetalning` svarar 400 utan det) — `true`
    // är korrekt här, sviten registrerar EXAKT för att sedan förhandsgranska
    // kvitton.
    medKvitto: true,
  });
  const raw = await res.text();
  // 201 Created — POST:ar en NY rad. (Mätt lokalt, TASK-370.3: EF:en svarar
  // 201, inte 200, som varje annan CREATE i denna kodbas.)
  expect(res.status(), `registrera-inbetalning (${anmalanRecordId}): ${raw}`).toBe(201);
  const body = RegistreraInbetalningResultSchema.parse(JSON.parse(raw));
  return body.inbetalning.id;
}

/** RADERAR (inte makulerar — se filhuvudet) en fixtur-inbetalning. Anropas
 *  ALLTID i ett `finally`, oavsett testutfall — annars läcker en
 *  Postgres-rad OCH en förskjuten Airtable-spegel in i nästa körning. Sväljer
 *  aldrig tyst: ett fallerat städförsök loggas till konsolen (synligt i
 *  CI-loggen) i stället för att bara returnera. */
async function raderaFixturInbetalning(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  inbetalningId: string,
): Promise<void> {
  const res = await postJson(request, config, jwt, HANTERA_ENDPOINT, {
    atgard: 'radera',
    inbetalningId,
  });
  if (res.status() !== 200) {
    // eslint-disable-next-line no-console -- synlig städ-varning, se docblock
    console.error(
      `[TASK-370.3] STÄDNING MISSLYCKADES för inbetalning ${inbetalningId}: ` +
        `${res.status()} ${await res.text().catch(() => '(kunde inte läsa body)')} — ` +
        'raden kan ha läckt in i nästa körning, kontrollera staging-ledgern manuellt.',
    );
  }
}

test.describe('preview-receipt — "Förhandsgranska alla N" (TASK-370.3, PRD TASK-370)', () => {
  test('allow: två riktiga inbetalningar → EN PDF med exakt tre sidor (försättsblad + 2 kvitton), inbäddat typsnitt, rätt namn/belopp per sida utan sidöverlapp, summan stämmer', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // SKAPADE (inte [inbetalningA, inbetalningB]) — trackar VARJE lyckad
    // registrering allteftersom den sker, så ett kast mellan de två
    // anropen (eller i en assertion efteråt) ändå städar den ENA raden som
    // faktiskt skapades. Ett try/finally som bara omslöt anropen EFTER båda
    // registreringarna hade läckt person A:s rad om person B:s registrering
    // kastade — mätt skarpt (TASK-370.3, en fel-status-assertion läckte
    // exakt denna rad under byggsessionen, städad manuellt).
    const skapade: string[] = [];
    try {
      const inbetalningA = await registreraFixturInbetalning(
        request,
        config,
        jwt,
        FORHANDSGRANSKA_ALLA_ANMALAN_A_ID,
        BELOPP_A,
      );
      skapade.push(inbetalningA);
      const inbetalningB = await registreraFixturInbetalning(
        request,
        config,
        jwt,
        FORHANDSGRANSKA_ALLA_ANMALAN_B_ID,
        BELOPP_B,
      );
      skapade.push(inbetalningB);

      // ── Anropet: BÅDA i visningsordning (PRD användarberättelse 8) ──────
      const res = await postJson(request, config, jwt, PREVIEW_ENDPOINT, {
        inbetalningIds: [inbetalningA, inbetalningB],
      });
      const raw = await res.text();
      expect(res.status(), raw).toBe(200);
      const body = UtkastResultatSchema.parse(JSON.parse(raw));
      expect(new Date(body.utgar).getTime()).toBeGreaterThan(Date.now());
      // Egen lagringsnyckel (ADR-124 § Updates) — INTE `utkast/<eventId>/…`.
      expect(new URL(body.url).pathname).toContain('utkast/kombinerat/');

      const head = await request.head(body.url);
      expect(head.status(), 'signerad URL gav inte 200 på HEAD').toBe(200);
      expect(head.headers()['content-type']).toMatch(/^application\/pdf/);

      const pdfResponse = await request.get(body.url);
      const pdfBytes = Buffer.from(await pdfResponse.body());
      expect(pdfBytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      expect(
        harInbaddatTypsnitt(pdfBytes),
        'PDF:en saknar ett inbäddat typsnitt (/FontFile2|3) — Carlito bäddades inte in',
      ).toBe(true);

      const sidor = await extraheraTextPerSida(pdfBytes);

      // ── AC #1: EXAKT tre sidor (ersätter pdfinfo, se filhuvudet) ────────
      expect(
        sidor.length,
        `förväntade 3 sidor (försättsblad + 2 kvitton), fick ${sidor.length}`,
      ).toBe(3);
      const [forsattsblad, kvittoA, kvittoB] = sidor;

      // ── Sida 1: försättsbladet — BÅDA raderna + korrekt summa ───────────
      expect(forsattsblad).toContain('Förhandsgranskning');
      expect(forsattsblad).toContain(
        'Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat.',
      );
      expect(forsattsblad).toContain(FORHANDSGRANSKA_ALLA_NAMN_A);
      expect(forsattsblad).toContain(FORHANDSGRANSKA_ALLA_EPOST_A);
      expect(forsattsblad).toContain(FORHANDSGRANSKA_ALLA_NAMN_B);
      expect(forsattsblad).toContain(FORHANDSGRANSKA_ALLA_EPOST_B);
      expect(forsattsblad).toContain(`SEK ${formatBelopp(BELOPP_A)}`);
      expect(forsattsblad).toContain(`SEK ${formatBelopp(BELOPP_B)}`);
      // AC #1: "summan på försättsbladet stämmer" — 500 + 750 = 1250.
      expect(forsattsblad).toContain(`SEK ${formatBelopp(SUMMA)}`);
      // Försättsbladet visar ALDRIG platshållaren — det är inte ett kvitto.
      expect(forsattsblad).not.toContain('FÖRHANDSVISNING');

      // ── Sida 2: kvitto A — ENDAST persson A:s data, INGET av B:s ────────
      expect(kvittoA).toContain('FÖRHANDSVISNING');
      expect(kvittoA).toContain(FORHANDSGRANSKA_ALLA_NAMN_A);
      expect(kvittoA).toContain(FORHANDSGRANSKA_ALLA_EPOST_A);
      expect(kvittoA).toContain(formatBelopp(BELOPP_A));
      expect(kvittoA, 'sidöverlapp: kvitto A:s sida innehåller person B:s namn').not.toContain(
        FORHANDSGRANSKA_ALLA_NAMN_B,
      );
      expect(kvittoA, 'sidöverlapp: kvitto A:s sida innehåller person B:s e-post').not.toContain(
        FORHANDSGRANSKA_ALLA_EPOST_B,
      );
      expect(kvittoA, 'sidöverlapp: kvitto A:s sida bär försättsbladets rubrik').not.toContain(
        'Förhandsgranskning',
      );

      // ── Sida 3: kvitto B — ENDAST person B:s data, INGET av A:s ─────────
      expect(kvittoB).toContain('FÖRHANDSVISNING');
      expect(kvittoB).toContain(FORHANDSGRANSKA_ALLA_NAMN_B);
      expect(kvittoB).toContain(FORHANDSGRANSKA_ALLA_EPOST_B);
      expect(kvittoB).toContain(formatBelopp(BELOPP_B));
      expect(kvittoB, 'sidöverlapp: kvitto B:s sida innehåller person A:s namn').not.toContain(
        FORHANDSGRANSKA_ALLA_NAMN_A,
      );
      expect(kvittoB, 'sidöverlapp: kvitto B:s sida innehåller person A:s e-post').not.toContain(
        FORHANDSGRANSKA_ALLA_EPOST_A,
      );
      expect(kvittoB, 'sidöverlapp: kvitto B:s sida bär försättsbladets rubrik').not.toContain(
        'Förhandsgranskning',
      );
    } finally {
      // Mutate-and-restore (se filhuvudet + fixtures.ts-docblocket): VARJE
      // rad som faktiskt SKAPADES raderas oavsett testutfall — `skapade`
      // kan bära 0, 1 eller 2 poster beroende på VAR ett kast inträffade.
      for (const inbetalningId of skapade) {
        await raderaFixturInbetalning(request, config, jwt, inbetalningId);
      }
    }
  });
});
