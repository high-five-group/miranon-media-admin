// Betalningsdomänen + jobbmotorn — RLS-, GRANT- och kontraktsbevis mot skarp
// staging (TASK-346.3, AC #3 och AC #4).
//
// Formen är ärvd rakt av från `activity-log-rls.staging.test.ts` (ADR-110-
// prejudikatet): tabellerna har ingen Edge Function framför sig ännu
// (skrivvägen är TASK-346.4), så testerna anropar PostgREST DIREKT — samma
// väg en framtida service_role-EF eller en felkonfigurerad klient skulle ta.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SOM SKILJER MOT ACTIVITY_LOG — OCH VARFÖR
// ═══════════════════════════════════════════════════════════════════════════
// `activity_log` är deny-all för BÅDA klientrollerna. Betalningsdomänen är
// det inte: `authenticated` LÄSER, och det är ett krav, inte en uppmjukning.
// Realtime Postgres Changes levererar bara rader som prenumeranten får
// SELECT:a under RLS (ADR-129 beslut 8) — utan läsrättighet får klienten
// aldrig en push, och jobbstatusen tickar aldrig live (användarberättelse
// 10). Kortets AC #3 formulerar det som "autentiserad admin läser; skrivning
// endast via service_role". Divergensen mot ADR-128 beslut 3:s ordalydelse
// ("deny-all för anon och authenticated") är bokförd i migrationens filhuvud.
//
// Testet bevisar därför FYRA saker, inte två:
//   1. `anon` når ingenting alls (401, Postgres 42501).
//   2. `authenticated` LÄSER (200) — och läsningen bär hela kolumnkontraktet.
//   3. `authenticated` SKRIVER INTE (403, 42501) — insert, update, delete.
//   4. Server-side-funktionerna (kvittoallokeringen, kö-wrappers) är
//      OÅTKOMLIGA för en klient — allokeringen är server-side, uteslutande
//      (ADR-109 beslut 4, ADR-129 beslut 5).
//
// ═══════════════════════════════════════════════════════════════════════════
// KONTRAKT-MOT-TOM: KOLUMNERNA BEVISAS UTAN EN ENDA RAD
// ═══════════════════════════════════════════════════════════════════════════
// `?select=<varje kolumn>&limit=1` mot en TOM tabell ger 200 om alla
// kolumner finns och 400 (`42703 column ... does not exist`) om någon
// saknas. Kontraktet är alltså fullt bevisbart utan seedad fixtur — samma
// "kontrakt-mot-tom, ingen seedad fixtur"-disciplin som
// `get-activity-log.staging.test.ts` och `get-mail-log.staging.test.ts`
// redan etablerat, men skarpare: här bevisas varje kolumn vid namn.
// Negativ kontroll ingår (en påhittad kolumn MÅSTE ge 400), annars vore
// 200-svaret förenligt med att PostgREST ignorerar select-listan.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD DENNA FIL INTE TÄCKER (medvetet, källmärkt gap)
// ═══════════════════════════════════════════════════════════════════════════
// `service_role`-halvan — att skrivningen GÅR IGENOM, att sekvensen är tät
// och startar på golvet, och att en andra insättning mot samma
// `inbetalning_id` FÄLLER — kräver `SUPABASE_SERVICE_ROLE_KEY` eller
// `postgres`-rollen. Ingendera är en CI-secret (verifierat i
// `supabase/migrations/README.md` § RLS-beviset), och ett rutinmässigt
// CI-committat insert-test skulle dessutom lämna rader i staging vid varje
// körning. Den halvan är i stället en ENGÅNGS, manuellt städad mätning via
// `npx supabase db query --linked` — SQL:en ligger färdig i
// `scripts/task-346-3-staging-verifiering.sql` och körs av orkestreraren
// efter `db push`. Exakt samma "hämta engångs, kör, kasta"-mönster som
// TASK-201.2 och TASK-201.5 redan etablerat.
//
// ═══════════════════════════════════════════════════════════════════════════
// KÖRBARHET: DESSA FALL KRÄVER ATT MIGRATIONEN ÄR APPLICERAD
// ═══════════════════════════════════════════════════════════════════════════
// Före `db push` mot staging existerar ingen av tabellerna, och PostgREST
// svarar `PGRST205` ("Could not find the table ... in the schema cache")
// i stället för `42501`. Filen är då RÖD — medvetet. En skip-vakt hade gjort
// den falskt grön och dolt exakt det den finns för att bevisa.

import { randomUUID } from 'node:crypto';
import { type APIRequestContext, expect, test } from '@playwright/test';
import { type ApiConfig, getApiConfig, getValidUserJWT } from './helpers';

// ── Kolumnkontrakten (AC #1). Varje namn här är ett löfte till TASK-346.4. ──

const KOLUMNER = {
  inbetalningar: [
    'id',
    'anmalan_record_id',
    'ogonblicksbild_namn',
    'ogonblicksbild_event',
    'ogonblicksbild_eventdatum',
    'belopp',
    'betalsatt',
    'betalningsdatum',
    'typ',
    'status',
    'makulerad_skal',
    'makulerad_nar',
    'bankreferens',
    'kvitto_id',
    'skapad_av',
    'skapad_nar',
  ],
  kvitton: [
    'id',
    'kvittonummer',
    'ar',
    'lopnummer',
    'inbetalning_id',
    'lagringsnyckel',
    'skickad_nar',
    'mottagare',
    'typ',
    'original_kvitto_id',
    'status',
    'skapad_nar',
  ],
  jobb: ['id', 'jobbtyp', 'status', 'skapad_av', 'skapad_nar', 'avslutad_nar'],
  jobb_rad: [
    'id',
    'jobb_id',
    'jobbtyp',
    'objekt_id',
    'status',
    'skal',
    'forsok',
    'skapad_nar',
    'paborjad_nar',
    'avslutad_nar',
    'uppdaterad_nar',
  ],
} as const;

/** Tabeller `authenticated` ska kunna LÄSA (Realtime-kravet, ADR-129 beslut 8). */
const LASBARA = ['inbetalningar', 'kvitton', 'jobb', 'jobb_rad'] as const;

/**
 * `kvittoserie_golv` är INFRASTRUKTUR, inte domändata — ingen klient har
 * ärende till den, så den bär varken grant eller policy för `authenticated`
 * (migrationens § 4). Den prövas separat, med motsatt förväntan.
 */
const INFRASTRUKTUR_TABELL = 'kvittoserie_golv';

interface PostgrestErrorBody {
  code?: string;
  message?: string;
}

/**
 * PROBKOLUMNEN PER TABELL — en kolumn som FAKTISKT finns.
 *
 * Deny-proberna frågar `?select=<kolumn>&limit=1`. PostgREST löser
 * kolumnnamnet FÖRE behörighetsprövningen, så en kolumn som inte existerar
 * ger `400 / 42703 column ... does not exist` i stället för det `42501` som
 * deny-beviset vilar på — provet når då aldrig sin egen regel och kan varken
 * bli grönt av rätt skäl eller rött av rätt skäl.
 *
 * Det var precis vad som hände: proben frågade `id` för ALLA tabeller, men
 * `kvittoserie_golv` har ingen `id` — dess primärnyckel är `ar` (migration
 * 20260830195728 rad 334). Två fall föll på 42703 i den första skarpa
 * körningen efter `db push` (orkestreraren, 2026-08-30, 27/29 gröna).
 *
 * Korsläst mot migrationerna 2026-08-30: `inbetalningar`, `kvitton`, `jobb`
 * och `jobb_rad` bär alla `id uuid primary key`; `kvittoserie_golv` bär
 * `ar integer primary key` och ingenting som heter `id`.
 */
const PROB_KOLUMN: Record<string, string> = {
  inbetalningar: 'id',
  kvitton: 'id',
  jobb: 'id',
  jobb_rad: 'id',
  kvittoserie_golv: 'ar',
};

/**
 * Fail-loud på den vanligaste framtida glidningen: en ny tabell läggs till i
 * LASBARA utan att få en probkolumn. Utan detta hade `undefined` hamnat i
 * URL:en och gett ännu ett 42703 som ser ut som ett RLS-fel.
 */
function probKolumn(tabell: string): string {
  const kolumn = PROB_KOLUMN[tabell];
  if (kolumn === undefined) {
    throw new Error(
      `betalningsdomanen-rls: ingen probkolumn deklarerad för "${tabell}". ` +
        'Lägg till den i PROB_KOLUMN — en kolumn som FAKTISKT finns i tabellen.',
    );
  }
  return kolumn;
}

function url(config: ApiConfig, tabell: string, query?: string): string {
  const fraga = query ?? `?select=${probKolumn(tabell)}&limit=1`;
  return `${config.baseUrl}/rest/v1/${tabell}${fraga}`;
}

/**
 * Ett `42501` bevisar TVÅ saker samtidigt, och båda behövs: att tabellen
 * FINNS (en saknad tabell ger `PGRST205`, inte `42501`) och att rollen är
 * utestängd av GRANT-/RLS-lagret. Assertionen är därför skriven mot koden,
 * aldrig bara mot HTTP-statusen.
 */
async function kravPermissionDenied(
  res: { status: () => number; json: () => Promise<unknown> },
  forvantadStatus: number,
  tabell: string,
): Promise<void> {
  const body = (await res.json()) as PostgrestErrorBody;
  expect(
    res.status(),
    `${tabell}: förväntade ${forvantadStatus} (permission denied), fick ${res.status()} med ${JSON.stringify(body)}`,
  ).toBe(forvantadStatus);
  expect(
    body.code,
    `${tabell}: förväntade Postgres 42501. PGRST205 här betyder att MIGRATIONEN ` +
      `INTE ÄR APPLICERAD — inte att RLS är trasig. Body: ${JSON.stringify(body)}`,
  ).toBe('42501');
  expect(body.message).toMatch(new RegExp(`permission denied for table ${tabell}`));
}

/**
 * En strukturellt trovärdig rad. Innehållet spelar ingen roll för deny-halvan
 * — permission-nekandet sker i GRANT-/RLS-lagret INNAN kolumn- eller
 * typvalidering. Unikt per anrop, så att ett regressionsbrott (permission
 * börjar oväntat SLÄPPA IGENOM) inte maskeras som en `409 conflict` på en
 * primärnyckel i stället för det verkliga "201 skulle aldrig ha hänt".
 */
function denyProbeInbetalning(): Record<string, unknown> {
  return {
    id: randomUUID(),
    anmalan_record_id: 'recZZZZZZZZZZZZZZ',
    ogonblicksbild_namn: `ZZ-TASK-346.3-deny-probe-${randomUUID()}`,
    ogonblicksbild_event: 'ZZ-TASK-346.3 deny-probe',
    belopp: '1.00',
    betalsatt: 'Swish',
    typ: 'inbetalning',
    skapad_av: 'ZZ-TASK-346.3 deny-probe',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — anon når ingenting (AC #3)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('betalningsdomänen — anon är helt utestängd', () => {
  for (const tabell of [...LASBARA, INFRASTRUKTUR_TABELL]) {
    test(`anon: läsning av ${tabell} nekas (401)`, async ({
      request,
    }: {
      request: APIRequestContext;
    }) => {
      const config = getApiConfig();
      const res = await request.get(url(config, tabell), {
        headers: { apikey: config.anonKey },
      });
      await kravPermissionDenied(res, 401, tabell);
    });
  }

  test('anon: skrivning mot inbetalningar nekas (401)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const config = getApiConfig();
    const res = await request.post(`${config.baseUrl}/rest/v1/inbetalningar`, {
      headers: { apikey: config.anonKey },
      data: denyProbeInbetalning(),
    });
    await kravPermissionDenied(res, 401, 'inbetalningar');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — authenticated LÄSER, och läsningen bär hela kolumnkontraktet (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('betalningsdomänen — authenticated läser (kontrakt-mot-tom)', () => {
  for (const tabell of LASBARA) {
    test(`authenticated: ${tabell} går att läsa och bär varje kolumn i kontraktet`, async ({
      request,
    }: {
      request: APIRequestContext;
    }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const select = KOLUMNER[tabell].join(',');

      const res = await request.get(url(config, tabell, `?select=${select}&limit=1`), {
        headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
      });

      const body = await res.json();
      expect(
        res.status(),
        `${tabell}: en 400 här betyder att en kolumn i kontraktet SAKNAS ` +
          `(42703). Body: ${JSON.stringify(body)}`,
      ).toBe(200);
      expect(Array.isArray(body), `${tabell}: PostgREST ska svara med en array`).toBe(true);
    });
  }

  test('NEGATIV KONTROLL: en påhittad kolumn MÅSTE ge 400 (42703)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    // Utan detta fall vore 200-svaren ovan förenliga med att PostgREST
    // ignorerar select-listan — och då bevisar de ingenting om kolumnerna.
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.get(
      url(config, 'inbetalningar', '?select=id,denna_kolumn_finns_inte&limit=1'),
      { headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` } },
    );

    expect(res.status()).toBe(400);
    const body = (await res.json()) as PostgrestErrorBody;
    expect(body.code, `förväntade 42703, fick ${JSON.stringify(body)}`).toBe('42703');
  });

  test('infrastrukturtabellen kvittoserie_golv är stängd även för authenticated (403)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.get(url(config, INFRASTRUKTUR_TABELL), {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
    });
    await kravPermissionDenied(res, 403, INFRASTRUKTUR_TABELL);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — authenticated skriver ALDRIG (AC #3: "skrivning endast via service_role")
// ═══════════════════════════════════════════════════════════════════════════

test.describe('betalningsdomänen — authenticated kan inte skriva', () => {
  test('authenticated: INSERT mot inbetalningar nekas (403)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);
    const res = await request.post(`${config.baseUrl}/rest/v1/inbetalningar`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
      data: denyProbeInbetalning(),
    });
    await kravPermissionDenied(res, 403, 'inbetalningar');
  });

  // FILTRET `?id=eq.<slumpat uuid>` är en SÄKERHETSSPÄRR, inte kosmetika —
  // samma resonemang som activity-log-rls.staging.test.ts skriver ut: skulle
  // permission-lagret oväntat SLÄPPA IGENOM träffar satsen noll rader i
  // stället för att ändra eller tömma en bokföringstabell. Ett ofiltrerat
  // UPDATE/DELETE hade gjort testet självt till den värsta regressionen.
  for (const tabell of LASBARA) {
    test(`authenticated: UPDATE mot ${tabell} nekas (403)`, async ({
      request,
    }: {
      request: APIRequestContext;
    }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const res = await request.patch(url(config, tabell, `?id=eq.${randomUUID()}`), {
        headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
        data: { status: 'ZZ-TASK-346.3-ska-aldrig-skrivas' },
      });
      await kravPermissionDenied(res, 403, tabell);
    });

    test(`authenticated: DELETE mot ${tabell} nekas (403)`, async ({
      request,
    }: {
      request: APIRequestContext;
    }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);
      const res = await request.delete(url(config, tabell, `?id=eq.${randomUUID()}`), {
        headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
      });
      await kravPermissionDenied(res, 403, tabell);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — server-side-funktionerna är oåtkomliga för en klient
// ═══════════════════════════════════════════════════════════════════════════
//
// ADR-109 beslut 4: kvittonummer-allokeringen är server-side, UTESLUTANDE.
// ADR-129 beslut 5: kö-wrappers är konsumentens väg, inte klientens.
// Båda är `security definer` — utan ett revoke från PUBLIC hade varje
// inloggad kunnat bränna kvittonummer och köa jobb via PostgREST-RPC.

test.describe('server-side-funktioner — inte anropbara av en klient', () => {
  const RPC_ANROP: readonly { namn: string; kropp: Record<string, unknown> }[] = [
    { namn: 'allokera_kvittonummer', kropp: { p_ar: 2026 } },
    { namn: 'jobb_ko_skicka', kropp: { p_jobbtyp: 'kvitto', p_rad_id: randomUUID() } },
    { namn: 'jobb_ko_las', kropp: { p_antal: 1, p_synlighet_sekunder: 1 } },
    { namn: 'jobb_ko_radera', kropp: { p_msg_id: 1 } },
    { namn: 'jobb_ko_arkivera', kropp: { p_msg_id: 1 } },
    { namn: 'jobb_cron_tick', kropp: {} },
  ];

  for (const { namn, kropp } of RPC_ANROP) {
    test(`authenticated: rpc/${namn} går inte att anropa`, async ({
      request,
    }: {
      request: APIRequestContext;
    }) => {
      const config = getApiConfig();
      const jwt = await getValidUserJWT(request, config);

      const res = await request.post(`${config.baseUrl}/rest/v1/rpc/${namn}`, {
        headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
        data: kropp,
      });

      const body = (await res.json()) as PostgrestErrorBody;

      // Det AVGÖRANDE är att anropet inte lyckas. PostgREST kan svara 404
      // (funktionen är inte i den roll-synliga schema-cachen, PGRST202)
      // eller 403 (`42501 permission denied for function`) beroende på hur
      // cachen byggts — båda betyder samma sak här, och båda är ett
      // godkänt utfall. Ett 2xx betyder att revoke-raden i migrationen
      // saknas eller inte tog.
      expect(
        res.status(),
        `rpc/${namn} svarade ${res.status()} — ett lyckat anrop betyder att ` +
          `revoke execute ... from public saknas. Body: ${JSON.stringify(body)}`,
      ).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });
  }

  test('purga_testrader ÄR anropbar av authenticated — och rör noll rader utan sentineler', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    // Motsatt förväntan mot de övriga: purge-vägen MÅSTE nås av
    // scripts/purge-staging-sentinels.mjs test-admin-JWT (migration
    // 20260830200100:s filhuvud). Anropet är ofarligt att köra i ett test —
    // sentinel-mönstret och 10-minutersgolvet är hårdkodade i funktionen, så
    // det kan per konstruktion inte röra något som inte är en gammal
    // ZZ-TASK-346-testrad.
    const config = getApiConfig();
    const jwt = await getValidUserJWT(request, config);

    const res = await request.post(`${config.baseUrl}/rest/v1/rpc/purga_testrader`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${jwt}` },
      data: { p_min_alder_minuter: 60 },
    });

    const body = await res.json();
    expect(res.status(), `purga_testrader svarade ${JSON.stringify(body)}`).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    for (const rad of body as { tabell: string; raderade: number }[]) {
      expect(typeof rad.tabell).toBe('string');
      expect(Number.isInteger(rad.raderade)).toBe(true);
      expect(rad.raderade).toBeGreaterThanOrEqual(0);
    }
  });
});
