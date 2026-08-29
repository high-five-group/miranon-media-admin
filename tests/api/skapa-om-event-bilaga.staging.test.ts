// skapa-om-event-bilaga — TASK-309.6, ADR-125 § 3+5: bevisar HASH-PARITETEN
// mellan klient och server, och hela livscykeln AC #5 kräver: skapa → ändra
// block → adaptern härleder INAKTUELL → skapa om (ersatt-läget) → samma
// Bilagor-rad, aktuell igen.
//
// MINIMALTESTET (mission-kravet, körd FÖRE listan byggdes på hash-
// jämförelsen): steg 1–2 nedan bevisar att klientens `berakaAktuellKallhash`
// (`src/data/adapters/mallKallhash.ts`) räknar ut EXAKT samma hash som
// `generate-event-attachment/index.ts` faktiskt skrev till `Källhash` —
// mot RIKTIGT, EF-skrivet data, inte en handrullad fixtur. Delar
// klient/server SAMMA `_shared/mall-hash.ts`/`mall-data.ts`-kod (import,
// ingen omimplementation) är parametern strukturellt garanterad att hålla
// — det detta test FAKTISKT bevisar är att importvägen/typ-casten
// (`as unknown as DocumentSourcesResult`, mallKallhash.ts § filhuvud) inte
// tyst tappar eller döper om ett fält på vägen.
//
// FIXTUR: DOKUMENTUNDERLAG_EVENT_ID (tests/api/fixtures.ts, permanent,
// delad med get-document-sources.staging.test.ts/generate-event-attachment.
// staging.test.ts). Detta test MUTERAR fältet `Anmälningsavgift
// (bilagetext)` (ETT fält ingen annan staging-test-fil asserterar på — se
// grep-verifiering i skivans slutrapport) och ÅTERSTÄLLER det till `null`
// (tillbaka till standarden) i EN `finally`-sektion, oavsett testutfall —
// samma "mutera och återställ"-disciplin mission-texten föreskriver för den
// permanenta fixturen. Den skapade/regenererade Bilagor-raden STÄDAS INTE
// bort (samma "bounded ackumulering tolererad"-avgränsning som
// generate-event-attachment.staging.test.ts § filhuvud — purge-policyn
// (`.purge-staging-policy.json`) täcker redan detta namnmönster).
//
// [TASK-340.1] STEG 1 GÅR NU ERSÄTT-VÄGEN AV SIG SJÄLV. PRD `TASK-340` § E
// lät EF:en välja ersätt-vägen när eventet redan bär en Event-mallad rad för
// mallen, vilket den permanenta fixturen gör — så det "första" anropet nedan
// regenererar en befintlig rad i stället för att skapa en ny, och svarar 200
// i stället för 201. LIVSCYKELN TESTET BEVISAR ÄR OFÖRÄNDRAD (skapa/uppdatera
// → ändra block → INAKTUELL → skapa om → aktuell igen); det enda som
// justerats är statuskodens assertion, som nu binder koden till UTFALLET
// (`ersatte`) i stället för till anropets form. Se `generate`-hjälparen.
//
// Auth via getValidUserJWT — samma mönster som syskonfilerna.

import { type APIRequestContext, expect, test } from '@playwright/test';
import { berakaAktuellKallhash } from '../../src/data/adapters/mallKallhash';
import { DocumentSourcesSchema } from '../../src/domain/schemas';
import { DOKUMENTUNDERLAG_EVENT_ID } from './fixtures';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

const DOCUMENT_SOURCES_ENDPOINT = '/functions/v1/get-document-sources';
const GENERATE_ENDPOINT = '/functions/v1/generate-event-attachment';
const SAVE_EVENT_TEXT_ENDPOINT = '/functions/v1/save-event-text';

interface GenerateResponse {
  attachment: { id: string; kallhash: string | null };
  /** [TASK-340.1, PRD `TASK-340` § E] Sant när skrivningen gick ersätt-vägen
   *  — antingen på klientens EXPLICITA `ersatt` (steg 5 nedan) eller på
   *  EF:ens EGET uppslag (steg 1, eftersom fixturen redan bär rader). */
  ersatte: boolean;
}

function authHeaders(jwt: string): Record<string, string> {
  return { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' };
}

async function fetchSources(request: APIRequestContext, config: ApiConfig, jwt: string) {
  const res = await request.get(
    `${config.baseUrl}${DOCUMENT_SOURCES_ENDPOINT}?eventId=${DOKUMENTUNDERLAG_EVENT_ID}`,
    { headers: authHeaders(jwt) },
  );
  expect(res.status(), `get-document-sources misslyckades: ${await res.text()}`).toBe(200);
  return DocumentSourcesSchema.parse(await res.json());
}

async function saveAnmalningsavgift(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  varde: string | null,
) {
  const res = await request.post(`${config.baseUrl}${SAVE_EVENT_TEXT_ENDPOINT}`, {
    headers: authHeaders(jwt),
    data: { eventId: DOKUMENTUNDERLAG_EVENT_ID, falt: { anmalningsavgift: varde } },
  });
  expect(res.status(), `save-event-text misslyckades: ${await res.text()}`).toBe(200);
}

async function generate(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string,
  ersatt?: string,
): Promise<GenerateResponse> {
  const res = await request.post(`${config.baseUrl}${GENERATE_ENDPOINT}`, {
    headers: authHeaders(jwt),
    data: {
      eventId: DOKUMENTUNDERLAG_EVENT_ID,
      mall: 'bekraftelse',
      ...(ersatt ? { ersatt } : {}),
    },
  });
  const raw = await res.text();
  // [TASK-340.1] Statuskoden är INTE längre `ersatt ? 200 : 201`. Sedan PRD
  // `TASK-340` § E väljer EF:en ersätt-vägen SJÄLV när eventet redan har en
  // Event-mallad rad för mallen — och den permanenta fixturen har det — så
  // även ett anrop UTAN `ersatt` svarar 200. Invarianten som håller i båda
  // fallen: `201 ⇔ ersatte === false`. Den är starkare än den gamla raden,
  // som band koden till ANROPETS form i stället för till UTFALLET.
  expect([200, 201], `generate-event-attachment misslyckades: ${raw}`).toContain(res.status());
  const body = JSON.parse(raw) as GenerateResponse;
  expect(res.status(), `statuskoden måste följa ersatte-flaggan: ${raw}`).toBe(
    body.ersatte ? 200 : 201,
  );
  // Ett EXPLICIT `ersatt` måste ALLTID landa i ersätt-vägen.
  if (ersatt) expect(body.ersatte).toBe(true);
  return body;
}

test.describe('skapa-om-event-bilaga — hash-paritet + livscykel (TASK-309.6, ADR-125 § 3+5)', () => {
  test('skapa → hash-paritet (minimaltestet) → ändra block → INAKTUELL → skapa om → samma rad, aktuell', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    // Nollställ fältet (ren startpunkt oavsett tidigare körningars städning).
    await saveAnmalningsavgift(request, config, jwt, null);

    try {
      // ── STEG 1: Skapa bilagan ur DAGENS underlag ──
      const forstaGenerering = await generate(request, config, jwt);
      const attachmentId = forstaGenerering.attachment.id;
      const forstaKallhash = forstaGenerering.attachment.kallhash;
      expect(forstaKallhash, 'EF:en måste skriva ett Källhash-värde').not.toBeNull();
      expect(forstaKallhash).toMatch(/^[0-9a-f]{64}$/);

      // ── STEG 2 (MINIMALTESTET): klientens hash == EF:ens Källhash ──
      // Samma underlag EF:en just läste (ingen skrivning skett mellan de
      // två anropen) — om detta INTE håller är klient/server-hashen inte
      // i paritet, och adapterns INAKTUELL-härledning (AC #5) vore meningslös.
      const sourcesInnan = await fetchSources(request, config, jwt);
      const klientHashInnan = await berakaAktuellKallhash('bekraftelse', sourcesInnan);
      expect(klientHashInnan, 'Klientens hash måste matcha EF:ens Källhash exakt').toBe(
        forstaKallhash,
      );

      // ── STEG 3: Ändra ett block (eventets egen kopia) ──
      await saveAnmalningsavgift(request, config, jwt, 'ZZ-TASK-309.6-ny-avgift');

      // ── STEG 4: Adaptern skulle nu härleda INAKTUELL — bevisat direkt: ──
      const sourcesEfter = await fetchSources(request, config, jwt);
      expect(sourcesEfter.kopior.anmalningsavgift.kopia).toBe('ZZ-TASK-309.6-ny-avgift');
      const klientHashEfter = await berakaAktuellKallhash('bekraftelse', sourcesEfter);
      expect(
        klientHashEfter,
        'Ändrat block måste ge en ANNAN hash — annars skulle ingen rad någonsin bli INAKTUELL',
      ).not.toBe(forstaKallhash);

      // ── STEG 5: "Skapa om" — ersatt-läget, SAMMA rad ──
      const omGenerering = await generate(request, config, jwt, attachmentId);
      expect(omGenerering.attachment.id, 'Skapa om måste behålla SAMMA attachmentId').toBe(
        attachmentId,
      );
      const nyKallhash = omGenerering.attachment.kallhash;
      expect(nyKallhash).not.toBeNull();
      expect(nyKallhash).not.toBe(forstaKallhash);

      // ── STEG 6: Efter regenerering — dagens hash == det NYA Källhash ──
      // (samma underlag som just skrevs, oförändrat sedan steg 5).
      const klientHashEfterOmgenerering = await berakaAktuellKallhash('bekraftelse', sourcesEfter);
      expect(
        klientHashEfterOmgenerering,
        'Efter "Skapa om" måste raden vara AKTUELL igen enligt samma härledning',
      ).toBe(nyKallhash);
    } finally {
      // Återställ den permanenta fixturen — mission-kravet ("mutera och
      // ÅTERSTÄLL") — oavsett om testet passerade eller föll.
      await saveAnmalningsavgift(request, config, jwt, null);
    }
  });
});
