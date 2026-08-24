// create-event — skarp conformance mot deployad staging-EF (Fas 6f L1, ADR-066).
//
// create-event SKRIVER (POST → ny Eventplanering-rad). Repots TREDJE write-vertikal;
// speglar create-registration/save-segment:s säkerhets-kontrakt men för CREATE av ett
// event. Bevisar mot SKARP staging-data:
//   1. allow: giltig create → 201 + SKRIV-BEVIS ur råa record.fields — EF:en satte
//      Event(source)/Typ/Ort/datum/platser/Status/Eventtyp + Idempotensnyckel, HÄRLEDDE
//      Månad/år ur Startdatum (ADR-066 b6), och de system-genererade EventKey/Event-nr
//      FÖDDES (formel-på-autoNumber) utan att vi satte dem.
//   2. IDEMPOTENS-INTEGRATION (kärnan, ADR-066 b3): färsk UUID → createdRecords (nytt event,
//      201); SAMMA UUID + samma payload → updatedRecords (idempotent replay, 200, SAMMA
//      record-ID, noll dubblett). Bevisar att upsert mot tomt-på-alla-rader-merge-fält SKAPAR
//      (ej matchar en tom rad) + att retry är idempotent (L189).
//   3. INVARIANT: saknad idempotencyKey → 400; malformad (ej UUID v4) → 400.
//   4. deny: ogiltig eventtyp-form → 400 (klient-nåbar input-deny; create:s `fields` byggs
//      server-side, så field-allowlisten är en SSOT-grind mot kod-drift, ej en klient-deny-yta —
//      samma mönster som create-registration deny-testet).
//   5. anon (ingen JWT) → 401 (delad gateway/requireUser).
//   6. PUBLICERINGSFLAGGAN (task-19.4): `publicera: true` → checkbox-fältet `Publicerad på
//      miranon.se` SATT i råa record.fields; utelämnad ELLER explicit `false` → fältet OSATT
//      (EF:en utelämnar det ur fields-mapen — ett skrivet false skulle sätta checkboxen);
//      närvarande men av fel typ → 400. Bas-fältet är ADDITIVT och finns ENDAST i staging.
//
// EVENTFORMAT-ANKARE: eventtyp KRÄVS vid create (ADR-066 b5, GREN A) → driver Sessionsmall.
// Staging Eventformat var TOMT vid bygget (Session 38) → en permanent sentinel-fixtur seedades
// (`ZZ-create-event-test-format`) och dess record-ID injiceras via TEST_EVENTFORMAT_RECORD_ID
// (samma seedat-ankare-mönster som TEST_REGISTRATION_RECORD_ID). Robustare än ett hårdkodat ID
// (duplicerad bas, ADR-050).
//
// SENTINEL (ADR-060): events skapas med Ort `ZZ-create-event-test` (ZZ-prefix → markerat
// syntetiskt, speglar befintliga staging-fixturer) + per-anrop UUID-nyckel. setup-purge är
// manuell/schemalagd (CI saknar Airtable-creddad seed-fas) — bounded sentinel-ackumulering
// tolereras, ADR-060. Lokalt städas de via Airtable-MCP efter körning (Code-session).
//
// Auth via getValidUserJWT (api-token-setup T24-b). Lokalt skip:as utan creds; skarpa
// beviset körs i CI (STAGING_REQUIRED=1).

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, type APIResponse, expect, test } from '@playwright/test';
import { registreraKastbarPost } from '../support/kastbara-poster';
import { type ApiConfig, classify401Body, getApiConfig, getValidUserJWT } from './helpers';

const ENDPOINT = '/functions/v1/create-event';
const SENTINEL_ORT = 'ZZ-create-event-test';

interface CreateBody {
  event?: string;
  typ?: string;
  ort?: string;
  startdatum?: string;
  slutdatum?: string;
  maxPlatser?: number;
  status?: string;
  eventtyp?: string;
  idempotencyKey?: string;
  publicera?: unknown;
}

// Publiceringsflaggan (task-19.4) — EXAKT Airtable-fältnamnet i Eventplanering
// (staging `fldyJKnJCP1brHwL6`, checkbox, additivt skapat 2026-07-22). Airtable
// utelämnar en OMARKERAD checkbox ur `fields` → `undefined` ÄR "osatt".
const PUBLICERINGSFALT = 'Publicerad på miranon.se';

function postCreate(
  request: APIRequestContext,
  config: ApiConfig,
  jwt: string | undefined,
  body: CreateBody,
): Promise<APIResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return request.post(`${config.baseUrl}${ENDPOINT}`, { headers, data: body });
}

/**
 * [TASK-309.15] Registrera den skapade raden i ägar-manifestet
 * (`tests/support/kastbara-poster.ts`) så att
 * `purge-staging-sentinels.mjs --efter-korning` kan radera EXAKT denna
 * körnings rader direkt efteråt. Setup-purgen är kvar som andra
 * försvarslinje — detta stänger fönstret MELLAN körningarna, där 61
 * `ZZ-create-event-test`-event låg kvar som KOMMANDE event i appens
 * eventväljare (mätt 2026-08-24).
 *
 * Tar RÅTEXTEN testet redan läst — läser aldrig `APIResponse` en andra gång.
 * Deny-vägarnas svar bär ingen `record.id` och blir därför en no-op, vilket
 * gör anropet säkert att lägga efter VARJE `.text()` i filen.
 */
function registreraSkapadRad(raw: string, vad: string): void {
  try {
    const id = (JSON.parse(raw) as { record?: { id?: unknown } })?.record?.id;
    if (typeof id === 'string') registreraKastbarPost(id, `create-event/${vad}`);
  } catch {
    // Icke-JSON-kropp (t.ex. gateway-401) — ingen rad skapades, inget att registrera.
  }
}

// Seedat Eventformat-ankare (eventtyp-länkens mål). Staging Eventformat var TOMT vid bygget
// (Session 38 L1) → en permanent sentinel-fixtur seedades (`ZZ-create-event-test-format`,
// Format=[Dag 1, Dag 2]) som dokumenterat staging-ankare. TEST_EVENTFORMAT_RECORD_ID kan
// override:a (om basen någon gång re-seedas); annars används det seedade ID:t direkt → CI
// behöver ingen ny secret (till skillnad mot TEST_REGISTRATION_RECORD_ID-vägen). Fixturen är
// ZZ-markerad → ADR-060 sentinel-tolerans (purgeas ej).
const SEEDED_EVENTFORMAT_ID = 'recclDd7hUQsfxoVs';

function eventformatId(): string {
  return process.env.TEST_EVENTFORMAT_RECORD_ID || SEEDED_EVENTFORMAT_ID;
}

/** Giltig create-payload med färsk idempotensnyckel. Startdatum i Månad/år-options-range. */
function validBody(eventtyp: string, idempotencyKey: string): CreateBody {
  return {
    event: 'Fjärrskådning',
    typ: 'Utbildning',
    ort: SENTINEL_ORT,
    startdatum: '2026-09-15',
    slutdatum: '2026-09-16',
    maxPlatser: 20,
    eventtyp,
    idempotencyKey,
  };
}

test.describe('create-event — skarp conformance (Fas 6f L1)', () => {
  test('allow: giltig create → 201 + skriv-bevis (Månad/år härlett, Eventtyp satt, system-fält födda)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const res = await postCreate(request, config, jwt, validBody(eventtyp, randomUUID()));
    const raw = await res.text();
    registreraSkapadRad(raw, 'allow');
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as {
      event: Record<string, unknown>;
      record: { id: string; fields: Record<string, unknown> };
      created: boolean;
    };

    // (i) SKRIV-BEVIS ur råa record.fields — EF:en satte fälten i Airtable.
    expect(body.created).toBe(true);
    expect(body.record.id.startsWith('rec')).toBe(true);
    expect(body.record.fields['Event (source)']).toBe('Fjärrskådning');
    expect(body.record.fields['Typ']).toBe('Utbildning');
    expect(body.record.fields['Ort']).toBe(SENTINEL_ORT);
    expect(body.record.fields['Startdatum']).toBe('2026-09-15');
    expect(body.record.fields['Status']).toBe('Planerat'); // default
    // Månad/år HÄRLETT ur Startdatum (ADR-066 b6) — ej skickat av klienten.
    expect(body.record.fields['Månad/år']).toBe('September 2026');
    // Eventtyp-länk satt → single-element array med ankar-ID.
    expect(body.record.fields['Eventtyp']).toEqual([eventtyp]);
    // Idempotensnyckel skrevs (merge-nyckeln).
    expect(typeof body.record.fields['Idempotensnyckel']).toBe('string');
    // System-genererade fält FÖDDES utan att vi satte dem.
    expect(body.record.fields['EventKey']).toMatch(/^Event-\d+$/);
    expect(typeof body.record.fields['Event-nr']).toBe('number');
    // BASDIMENSIONERNA (TASK-249.4): 'Fjärrskådning' är en KÄND, nivålös familj —
    // Kursfamilj SATT, Kursnivå UTELÄMNAD (TOMT per design, ej en lucka). Detta ÄR
    // instansen av den dokumenterade kanten (data-model.md § 2026-08-17: "Ett
    // CI-skapat ZZ-event föddes MITT UNDER backfillen och fångades av
    // blank-verifikatet") — samma kursnamn ('Fjärrskådning') och samma väg
    // (create-event), nu med fältet stängt.
    expect(body.record.fields['Kursfamilj']).toBe('Fjärrskådning');
    expect(body.record.fields['Kursnivå']).toBeUndefined();

    // (ii) Domän-envelope (adapterns parse-väg byggs i L2) — bär system-tilldelningen.
    expect(body.event.eventNamn).toBe('Fjärrskådning');
    expect(body.event.eventKey).toMatch(/^Event-\d+$/);
  });

  test('BASDIMENSIONERNA (TASK-249.4): RIM-kurs med nivå → Kursfamilj RIM + Kursnivå satt', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const res = await postCreate(request, config, jwt, {
      ...validBody(eventtyp, randomUUID()),
      event: 'Resor i medvetandet 2',
    });
    const raw = await res.text();
    registreraSkapadRad(raw, 'basdimensioner');
    expect(res.status(), raw).toBe(201);
    const body = JSON.parse(raw) as { record: { fields: Record<string, unknown> } };

    // Live-verifierat mot staging (mcp__airtable__list_records, 2026-08-17): exakt
    // denna mappning bär de befintliga "Resor i medvetandet 2"-raderna redan.
    expect(body.record.fields['Kursfamilj']).toBe('RIM');
    expect(body.record.fields['Kursnivå']).toBe('Nivå 2');
  });

  // "Okänt kursnamn → Kursfamilj/Kursnivå UTELÄMNADE" (create-event/index.ts:s
  // else-gren) är MEDVETET INTE prövat mot LIVE staging här: `Event (source)`
  // är en STÄNGD singleSelect (data-model.md rad 404, `flddlv4JA5C5CeH5R`) med
  // EXAKT de sex värden `_shared/course-dimensions.ts`s KURS_KARTA täcker —
  // `typecast:false` (airtable-client.ts) FÄLLER varje värde utanför den
  // listan REDAN på Airtable-anropet (nu klassat 4xx, TASK-190 nedan — INTE
  // vår mapping-gren). Scenariot blir alltså skarpt reproducerbart först den
  // dag Marcus lägger till en ny singleSelect-option (t.ex. "RIM 4") UTAN att
  // uppdatera kartan — exakt berättelse 15:s (PRD task-249) beskrivna kant.
  // Lookup-logiken för ett okänt namn är däremot fullt bevisad i
  // `course-dimensions.test.ts` ("okänt kursnamn → null") — den prövar exakt
  // samma gren utan att förutsätta ett Airtable-schema-tillstånd som inte
  // finns i staging idag.

  // TASK-190: Airtables EGEN valideringsavvisning (typecast:false mot den
  // STÄNGDA `Event (source)`-singleSelecten ovan) svarade tidigare generisk
  // 500 "Internal error" — anroparen kunde inte skilja sitt eget
  // kontraktsbrott (ett värde utanför de sex giltiga) från ett äkta
  // serverfel. Repro: ett `event`-värde som INTE är någon av de sex kända
  // singleSelect-optionerna. Ingen rad skapas (Airtable avvisar FÖRE
  // persistering) → ingen sentinel-städning krävs.
  test('deny: ogiltigt Event (source)-värde (utanför den stängda singleSelecten) → 4xx DIAGNOSTISERBART, ALDRIG 500', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();
    const ogiltigtVarde = 'Ett-värde-som-inte-finns-i-singleSelecten-xyz';

    const res = await postCreate(request, config, jwt, {
      ...validBody(eventtyp, randomUUID()),
      event: ogiltigtVarde,
    });
    const raw = await res.text();
    // Klassat klientfel (Airtables egen 4xx vidarebefordrad, se
    // classifyAirtableWriteError) — ALDRIG 500. LIVE-VERIFIERAT mot staging
    // (2026-08-24): Airtables faktiska svar för DENNA feltyp är 422
    // INVALID_MULTIPLE_CHOICE_OPTIONS — INTE INVALID_VALUE_FOR_COLUMN som
    // kortets ursprungliga hypotes antog, och meddelandet bär den AVVISADE
    // VÄRDET, INTE fältnamnet ("Event (source)" saknas i Airtables egen
    // text). Testet asserterar därför mot vad Airtable FAKTISKT svarar —
    // aldrig en gissad textform — men kärnkravet står kvar: felet är
    // klassat och DIAGNOSTISERBART (typ + avvisat värde synligt), i
    // stället för den tidigare opaka 500:an.
    expect(res.status(), raw).toBeGreaterThanOrEqual(400);
    expect(res.status(), raw).toBeLessThan(500);
    const body = JSON.parse(raw) as { error?: string };
    expect(body.error).toContain('INVALID_MULTIPLE_CHOICE_OPTIONS');
    expect(body.error).toContain(ogiltigtVarde);
  });

  test('IDEMPOTENS: färsk UUID → 201 created; samma UUID → 200 replay, samma record-ID, noll dubblett', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();
    const key = randomUUID();

    // (1) Färsk nyckel → SKAPAR (createdRecords).
    const first = await postCreate(request, config, jwt, validBody(eventtyp, key));
    const firstRaw = await first.text();
    registreraSkapadRad(firstRaw, 'idempotens');
    expect(first.status(), firstRaw).toBe(201);
    const firstBody = JSON.parse(firstRaw) as { record: { id: string }; created: boolean };
    expect(firstBody.created).toBe(true);
    const firstId = firstBody.record.id;

    // (2) SAMMA nyckel + samma payload → MATCHAR (updatedRecords), idempotent replay.
    const second = await postCreate(request, config, jwt, validBody(eventtyp, key));
    const secondRaw = await second.text();
    expect(second.status(), secondRaw).toBe(200);
    const secondBody = JSON.parse(secondRaw) as { record: { id: string }; created: boolean };
    expect(secondBody.created).toBe(false);
    // SAMMA record-ID → ingen dubblett skapades (upsert matchade på Idempotensnyckel).
    expect(secondBody.record.id).toBe(firstId);
  });

  test('PUBLICERINGSFLAGGAN: armerad create → flaggan SATT; oarmerad create → flaggan OSATT', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    // (1) ARMERAT: publicera=true → EF:en lägger fältet i fields-mapen → checkboxen satt.
    const armerad = await postCreate(request, config, jwt, {
      ...validBody(eventtyp, randomUUID()),
      publicera: true,
    });
    const armeradRaw = await armerad.text();
    registreraSkapadRad(armeradRaw, 'publicering-armerad');
    expect(armerad.status(), armeradRaw).toBe(201);
    const armeradBody = JSON.parse(armeradRaw) as {
      record: { id: string; fields: Record<string, unknown> };
    };
    expect(armeradBody.record.fields[PUBLICERINGSFALT]).toBe(true);

    // (2) OARMERAT: publicera utelämnas helt → fältet UTELÄMNAS ur fields-mapen.
    // Ett `false`/`undefined` som SKRIVS in skulle SÄTTA fältet — utelämnande är
    // enda korrekta formen för "lämnar flaggan osatt" (kortets FAS-direktiv).
    const oarmerad = await postCreate(
      request,
      config,
      jwt,
      validBody(eventtyp, randomUUID()), // ingen publicera-nyckel alls
    );
    const oarmeradRaw = await oarmerad.text();
    registreraSkapadRad(oarmeradRaw, 'publicering-oarmerad');
    expect(oarmerad.status(), oarmeradRaw).toBe(201);
    const oarmeradBody = JSON.parse(oarmeradRaw) as {
      record: { id: string; fields: Record<string, unknown> };
    };
    expect(oarmeradBody.record.fields[PUBLICERINGSFALT]).toBeUndefined();

    // (3) EXPLICIT false → samma osatta utfall (klienten ska utelämna, men en
    // explicit oarmerad flagga får ALDRIG bli en satt checkbox).
    const explicitFalse = await postCreate(request, config, jwt, {
      ...validBody(eventtyp, randomUUID()),
      publicera: false,
    });
    const explicitRaw = await explicitFalse.text();
    registreraSkapadRad(explicitRaw, 'publicering-explicit-false');
    expect(explicitFalse.status(), explicitRaw).toBe(201);
    const explicitBody = JSON.parse(explicitRaw) as {
      record: { fields: Record<string, unknown> };
    };
    expect(explicitBody.record.fields[PUBLICERINGSFALT]).toBeUndefined();
  });

  test('deny: publicera av fel typ (ej boolean) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const res = await postCreate(request, config, jwt, {
      ...validBody(eventtyp, randomUUID()),
      publicera: 'ja',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/publicera/i);
  });

  test('INVARIANT: saknad idempotencyKey → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const body = validBody(eventtyp, '');
    body.idempotencyKey = undefined;
    const res = await postCreate(request, config, jwt, body);
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/Idempotency-Key/i);
  });

  test('INVARIANT: malformad idempotencyKey (ej UUID v4) → 400', async ({ request }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const eventtyp = eventformatId();

    const res = await postCreate(request, config, jwt, validBody(eventtyp, 'inte-en-uuid'));
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/UUID/i);
  });

  test('deny: ogiltig eventtyp-form → 400 (input-deny; allowlist är SSOT-grind mot kod-drift)', async ({
    request,
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await postCreate(request, config, jwt, {
      ...validBody('rec-ankare-ersätts', randomUUID()),
      eventtyp: 'inteEttRecordId',
    });
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { error?: string }).error).toMatch(/eventtyp/i);
  });

  test('anon (ingen JWT) → 401', async ({ request }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}${ENDPOINT}`, {
      headers: { 'Content-Type': 'application/json' },
      data: validBody('recANY', randomUUID()),
    });
    await classify401Body(res);
  });
});
