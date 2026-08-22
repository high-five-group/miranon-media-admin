// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande. Samma
// undantags-mönster som test-pdf-generation/index.ts och
// send-email/index.ts.
//
// test-attachments-storage — TASK-146.3 "Skiva: Privat bucket, path-form
// per event och signerad åtkomst".
//
// STAGING-ONLY testharness-EF, samma mönster som test-pdf-generation/
// test-invite-completion: MEDVETET UTELÄMNAD ur
// .prod-functions-allowlist.conf (får ALDRIG nå produktion, Fas 7-skuld,
// tasks/lessons.md L115). Rör inte den filen för denna funktion.
//
// SYFTE: kortets AC #2, #3 och #4 kräver bevis som är BETEENDE, inte
// konfiguration ("En giltig signerad länk ger filen; en utgången nekas —
// båda prövade som ÅTKOMST, inte som konfiguration"; "Storleksgränserna
// prövade VID gränsen"). Ett Playwright-test kan inte anropa Supabase
// Storage med förhöjd behörighet direkt (SUPABASE_SERVICE_ROLE_KEY finns
// inte i CI-hemligheterna — docs/research/
// task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md dokumenterar
// exakt denna lucka och rekommenderar en scopad, JWT-gated testharness-EF
// i stället, samma väg TASK-146.1 redan valde för PDF-runtime-beviset).
// Varje deployad Edge Function får SUPABASE_SERVICE_ROLE_KEY auto-injicerad
// av plattformen — ingen ny hemlighet krävs, bara requireUser som
// gateway (samma härdning som test-pdf-generation, ingen ADMIN_EMAILS-
// gate: funktionen rör ingen persondata, bara syntetiska testobjekt i ett
// reserverat testnamnrymd, se TEST_EVENT_PREFIX nedan).
//
// EN EF, FYRA ACTIONS (djup modul, samma form som test-invite-completion):
//   - "run_full_proof": skapar ett syntetiskt test-event-ID, laddar upp tre
//     testobjekt under det (ett för åtkomst-provet, ett precis under
//     bucketens fileSizeLimit, ett precis över), skapar två signerade
//     URL:er mot åtkomst-objektet (en normal, en som hinner gå ut innan
//     klienten hinner använda den), och returnerar allt caller behöver för
//     att själv göra de faktiska HTTP-hämtningarna (varje hämtning görs av
//     TESTET, inte av denna funktion — det är vad "prövat som ÅTKOMST"
//     betyder).
//   - "cleanup": river alla objekt under ett givet test-event-prefix.
//     FAIL-CLOSED: prefixet måste börja med TEST_EVENT_PREFIX_MARKER —
//     funktionen vägrar radera något annat, oavsett vad callern skickar in.
//     Endast FLATA prefix (TEST_EVENT_PREFIX_MARKER-namnrymden lägger aldrig
//     objekt i en undermapp) — se `cleanup()` § filhuvud för skillnaden mot
//     "list_prefix"/"remove_paths" nedan.
//
// [TASK-302.3, ADR-124] "list_prefix" OCH "remove_paths" — TVÅ NYA, TUNNA
// actions för `scripts/purge-staging-sentinels.mjs`s Storage-purge av
// `utkast/<eventId>/<typ>.pdf` (ADR-124 § Beslut 2: mängden är bunden per
// konstruktion, men en purge-target skyddar mot framtida test-event-ID:n
// vars Airtable-rad purgas medan Storage-syskonet blir kvar för alltid).
// SAMMA "privilegierad Storage-operation bakom en JWT-gated testharness-EF"-
// mönster som "cleanup" ovan etablerade — INGEN ny hemlighet, bara
// `requireUser` som gateway. Delade i TVÅ (i stället för en enda
// "purge"-action) eftersom ålders-guarden (skydda in-flight testkörningar,
// samma resonemang som `.purge-staging-policy.json`s `minAgeMinutes` för
// Airtable-sentineler) MÅSTE avgöras i det NODE-testbara purge-skriptet
// (`isStorageObjectOldEnough`, pure function, `scripts/
// test-purge-staging-sentinels.mjs`) — inte gömmas inuti denna Deno-EF där
// den inte kan enhetstestas. `list_prefix` returnerar rådata (path +
// updatedAt); purge-skriptet FILTRERAR; `remove_paths` tar bort EXAKT de
// paths skriptet bad om, inget mer.
//
// BÅDA rekursivt-medvetna: `utkast/<eventId>/<typ>.pdf` har ETT extra
// mapp-steg jämfört med TEST_EVENT_PREFIX_MARKER-namnrymdens flata
// `<eventId>/<filnamn>` — `collectObjectPaths()` rekurserar EN nivå när
// Storage `list()` returnerar en mapp-post (`id === null`), vilket bara
// någonsin händer för `utkast`-prefixet (TEST_EVENT_PREFIX_MARKER-vägen har
// inga undermappar och rekurserar därför aldrig i praktiken — samma
// funktion, två anropsformer, ingen beteendeändring för den gamla).
//
// BÅDA FAIL-CLOSED till EXAKT samma tillåtna namnrymder som "cleanup":
// `TEST_EVENT_PREFIX_MARKER` ELLER `UTKAST_PREFIX_MARKER` ('utkast'/
// 'utkast/') — `isAllowedPrefix()`. `remove_paths` kontrollerar VARJE path
// individuellt (inte bara en gemensam prefix-parameter): en anropare kan
// inte smyga in en godtycklig path bredvid en giltig i samma anrop.
//
// STORLEKSGRÄNSEN LÄSES LIVE ur bucketens faktiska konfiguration
// (`storage.getBucket(BUCKET_ID).file_size_limit`) i stället för att
// duplicera provisionerings-skriptets konstant hit. Det gör beviset
// STARKARE, inte svagare: det prövar vad bucketen FAKTISKT är satt till just
// nu, inte ett antagande om vad den borde vara satt till.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse, ValidationError } from '../_shared/errors.ts';

const BUCKET_ID = 'bilagor';

// Reserverad testnamnrymd — matchar repots etablerade ZZ-prefix-konvention
// för sentinel-/testdata (ZZ-GRANSKNING-*, ZZ-create-event-test, se
// .purge-staging-policy.json). "cleanup" vägrar radera något som inte
// matchar detta prefix.
const TEST_EVENT_PREFIX_MARKER = 'ZZ-TEST-EVENT-';

// [TASK-302.3] Den ANDRA tillåtna namnrymden — `_shared/utkast.ts`s
// deterministiska `utkast/<eventId>/<typ>.pdf`-form. "list_prefix"/
// "remove_paths" vägrar röra något annat (samma fail-closed-disciplin som
// TEST_EVENT_PREFIX_MARKER för "cleanup"). Denna EF:s "cleanup"-action
// rör INTE denna namnrymd — se "list_prefix"/"remove_paths" nedan.
const UTKAST_PREFIX_MARKER = 'utkast';

/** Fail-closed-guarden delad av "list_prefix"/"remove_paths": exakt de TVÅ
 * reserverade namnrymderna, ingenting annat. */
function isAllowedPrefix(prefix: string): boolean {
  return (
    prefix.startsWith(TEST_EVENT_PREFIX_MARKER) ||
    prefix === UTKAST_PREFIX_MARKER ||
    prefix.startsWith(`${UTKAST_PREFIX_MARKER}/`)
  );
}

// Signerad-URL-livslängder. VALID_TTL_SECONDS ska räcka för att testet
// hinner göra sin första hämtning. EXPIRING_TTL_SECONDS är medvetet extremt
// kort — testet väntar ut den innan det gör sin andra hämtning.
const VALID_TTL_SECONDS = 30;
const EXPIRING_TTL_SECONDS = 1;

// Marginal från den faktiska bucket-gränsen vid gräns-proven (AC #4: "VID
// gränsen, inte i mitten"). 1 KB är gott och väl inom "vid gränsen" och
// långt ifrån "i mitten" för en 25 MB-gräns.
const BOUNDARY_MARGIN_BYTES = 1024;

// Storleken på det fristående åtkomst-provs-objektet (AC #3). Litet och
// oberoende av gräns-proven (AC #4) med avsikt — de två proven ska inte
// dela objekt, så ett fel i det ena aldrig kan maskera eller färga det andra.
const ACCESS_TEST_OBJECT_BYTES = 2048;

const VALID_ACTIONS = ['run_full_proof', 'cleanup', 'list_prefix', 'remove_paths'] as const;
type Action = (typeof VALID_ACTIONS)[number];

function isValidAction(action: unknown): action is Action {
  return typeof action === 'string' && (VALID_ACTIONS as readonly string[]).includes(action);
}

/** Bygger en minimal, storlekskontrollerad PDF-liknande byte-sekvens. Ingen
 * riktig PDF-struktur krävs (inget test parsar innehållet) — bara en
 * %PDF-magisk header (för god tro mot ett ev. framtida content-sniffande
 * filter) och en exakt total längd. */
function buildPseudoPdf(totalBytes: number): Uint8Array {
  const header = new TextEncoder().encode('%PDF-1.4\n%');
  const footer = new TextEncoder().encode('\n%%EOF');
  if (totalBytes < header.length + footer.length) {
    throw new Error(`totalBytes (${totalBytes}) för litet för header+footer`);
  }
  const buffer = new Uint8Array(totalBytes);
  buffer.set(header, 0);
  buffer.fill(0x41, header.length, totalBytes - footer.length); // 'A'-fyllnad
  buffer.set(footer, totalBytes - footer.length);
  return buffer;
}

interface RunFullProofResult {
  ok: true;
  requestId: string;
  bucket: { id: string; public: boolean; fileSizeLimitBytes: number };
  eventId: string;
  accessTest: {
    path: string;
    validUrl: string;
    validUrlExpiresInSec: number;
    expiringUrl: string;
    expiringUrlExpiresInSec: number;
  };
  sizeLimit: {
    configuredBytes: number;
    marginBytes: number;
    under: { path: string; bytes: number; ok: boolean; error: string | null };
    over: { path: string; bytes: number; ok: boolean; error: string | null; persistedAfterRejection: boolean };
  };
}

async function runFullProof(
  supabaseAdmin: ReturnType<typeof createClient>,
  requestId: string,
): Promise<RunFullProofResult> {
  // 1. Bucketens faktiska tillstånd — läs live, anta ingenting (se fil-
  //    header § STORLEKSGRÄNSEN LÄSES LIVE).
  const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket(BUCKET_ID);
  if (bucketError || !bucket) {
    throw new Error(
      `Bucket "${BUCKET_ID}" kunde inte läsas (${bucketError?.message ?? 'okänt fel'}) — ` +
        'har scripts/provision-attachments-bucket.mjs körts mot detta projekt?',
    );
  }
  if (typeof bucket.file_size_limit !== 'number') {
    throw new Error(
      `Bucket "${BUCKET_ID}" saknar file_size_limit — provisionerings-skriptet ` +
        'har inte satt en gräns, eller den har rubbats utanför skriptet.',
    );
  }

  const eventId = `${TEST_EVENT_PREFIX_MARKER}${crypto.randomUUID()}`;

  // 2. Åtkomst-provet (AC #3) — eget, litet, oberoende objekt.
  const accessTestPath = `${eventId}/${crypto.randomUUID()}-access-test.pdf`;
  const accessBytes = buildPseudoPdf(ACCESS_TEST_OBJECT_BYTES);
  const { error: accessUploadError } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .upload(accessTestPath, accessBytes, { contentType: 'application/pdf' });
  if (accessUploadError) {
    throw new Error(`Åtkomst-provets uppladdning misslyckades: ${accessUploadError.message}`);
  }

  const { data: validSigned, error: validSignError } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .createSignedUrl(accessTestPath, VALID_TTL_SECONDS);
  if (validSignError || !validSigned) {
    throw new Error(`createSignedUrl (giltig) misslyckades: ${validSignError?.message}`);
  }

  const { data: expiringSigned, error: expiringSignError } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .createSignedUrl(accessTestPath, EXPIRING_TTL_SECONDS);
  if (expiringSignError || !expiringSigned) {
    throw new Error(`createSignedUrl (utgående) misslyckades: ${expiringSignError?.message}`);
  }

  // 3. Gräns-provet (AC #4) — VID gränsen, båda sidor, mot bucketens
  //    FAKTISKA fileSizeLimit.
  const configuredBytes = bucket.file_size_limit;
  const underBytes = configuredBytes - BOUNDARY_MARGIN_BYTES;
  const overBytes = configuredBytes + BOUNDARY_MARGIN_BYTES;

  const underPath = `${eventId}/${crypto.randomUUID()}-under-limit.pdf`;
  const { error: underError } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .upload(underPath, buildPseudoPdf(underBytes), { contentType: 'application/pdf' });

  const overPath = `${eventId}/${crypto.randomUUID()}-over-limit.pdf`;
  const { error: overError } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .upload(overPath, buildPseudoPdf(overBytes), { contentType: 'application/pdf' });

  // Verifiera att ett avvisat "over"-objekt faktiskt INTE ligger kvar —
  // "begripligt fel innan uppladdningen påbörjas" ska betyda att ingenting
  // skrevs, inte bara att svaret var ett fel.
  const { data: listing, error: listError } = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .list(eventId);
  if (listError) {
    throw new Error(`list("${eventId}") misslyckades: ${listError.message}`);
  }
  const overFilename = overPath.slice(eventId.length + 1);
  const overPersisted = (listing ?? []).some((entry) => entry.name === overFilename);

  return {
    ok: true,
    requestId,
    bucket: {
      id: bucket.id,
      public: bucket.public,
      fileSizeLimitBytes: configuredBytes,
    },
    eventId,
    accessTest: {
      path: accessTestPath,
      validUrl: validSigned.signedUrl,
      validUrlExpiresInSec: VALID_TTL_SECONDS,
      expiringUrl: expiringSigned.signedUrl,
      expiringUrlExpiresInSec: EXPIRING_TTL_SECONDS,
    },
    sizeLimit: {
      configuredBytes,
      marginBytes: BOUNDARY_MARGIN_BYTES,
      under: { path: underPath, bytes: underBytes, ok: !underError, error: underError?.message ?? null },
      over: {
        path: overPath,
        bytes: overBytes,
        ok: !overError,
        error: overError?.message ?? null,
        persistedAfterRejection: overPersisted,
      },
    },
  };
}

/**
 * [TASK-302.3] Listar en NAMNGIVEN prefix REKURSIVT en nivå (mapp-poster,
 * `id === null`, expanderas till sina egna barn — se fil-header) och
 * returnerar VARJE objekts fulla path + `updated_at`. Rå data, ingen
 * ålders-filtrering här (den bor pure/testbart i purge-skriptet).
 */
async function collectObjectEntries(
  supabaseAdmin: ReturnType<typeof createClient>,
  prefix: string,
): Promise<{ path: string; updatedAt: string | null }[]> {
  const { data: listing, error } = await supabaseAdmin.storage.from(BUCKET_ID).list(prefix);
  if (error) {
    throw new Error(`list("${prefix}") misslyckades: ${error.message}`);
  }
  const out: { path: string; updatedAt: string | null }[] = [];
  for (const entry of listing ?? []) {
    const entryPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      // Mapp-post (t.ex. `utkast/<eventId>`) — rekursera EN nivå. Ingen
      // djupare nästling förekommer i denna bucket (`utkast/<eventId>/
      // <typ>.pdf` är strukturens fulla djup, `_shared/utkast.ts` §
      // `laggUtkast`).
      const nested = await collectObjectEntries(supabaseAdmin, entryPath);
      out.push(...nested);
    } else {
      out.push({ path: entryPath, updatedAt: entry.updated_at ?? null });
    }
  }
  return out;
}

/** [TASK-302.3] action "list_prefix" — rå listning, fail-closed till `isAllowedPrefix`. */
async function listPrefix(
  supabaseAdmin: ReturnType<typeof createClient>,
  prefix: string,
): Promise<{ entries: { path: string; updatedAt: string | null }[] }> {
  if (!isAllowedPrefix(prefix)) {
    throw new ValidationError(
      `prefix måste börja med "${TEST_EVENT_PREFIX_MARKER}" eller "${UTKAST_PREFIX_MARKER}" — ` +
        'vägrar lista utanför de reserverade namnrymderna',
    );
  }
  const entries = await collectObjectEntries(supabaseAdmin, prefix);
  return { entries };
}

/**
 * [TASK-302.3] action "remove_paths" — tar bort EXAKT de paths som anges,
 * INGEN prefix-parameter (till skillnad från "cleanup"): varje path
 * kontrolleras INDIVIDUELLT mot `isAllowedPrefix` så en anropare inte kan
 * smyga in en godtycklig path bredvid en giltig i samma anrop.
 */
async function removePaths(
  supabaseAdmin: ReturnType<typeof createClient>,
  paths: string[],
): Promise<{ deleted: string[] }> {
  const disallowed = paths.find((p) => !isAllowedPrefix(p));
  if (disallowed !== undefined) {
    throw new ValidationError(
      `path "${disallowed}" ligger utanför de reserverade namnrymderna ("${TEST_EVENT_PREFIX_MARKER}"/"${UTKAST_PREFIX_MARKER}") — vägrar radera`,
    );
  }
  if (paths.length === 0) {
    return { deleted: [] };
  }
  const { error } = await supabaseAdmin.storage.from(BUCKET_ID).remove(paths);
  if (error) {
    throw new Error(`remove(${paths.length} objekt) misslyckades: ${error.message}`);
  }
  return { deleted: paths };
}

async function cleanup(
  supabaseAdmin: ReturnType<typeof createClient>,
  prefix: string,
): Promise<{ deleted: string[] }> {
  if (!prefix.startsWith(TEST_EVENT_PREFIX_MARKER)) {
    // FAIL-CLOSED: se fil-header § EN EF, FYRA ACTIONS. Detta är funktionens
    // viktigaste spärr — utan den vore "cleanup" en godtycklig
    // radera-vad-som-helst-i-bucketen-primitiv.
    throw new ValidationError(
      `prefix måste börja med "${TEST_EVENT_PREFIX_MARKER}" — vägrar radera utanför testnamnrymden`,
    );
  }

  const { data: listing, error: listError } = await supabaseAdmin.storage.from(BUCKET_ID).list(prefix);
  if (listError) {
    throw new Error(`list("${prefix}") misslyckades: ${listError.message}`);
  }
  const paths = (listing ?? []).map((entry) => `${prefix}/${entry.name}`);
  if (paths.length === 0) {
    return { deleted: [] };
  }

  const { error: removeError } = await supabaseAdmin.storage.from(BUCKET_ID).remove(paths);
  if (removeError) {
    throw new Error(`remove(${paths.length} objekt) misslyckades: ${removeError.message}`);
  }
  return { deleted: paths };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const action = body?.action;

    if (!isValidAction(action)) {
      throw new ValidationError(`action is required and must be one of: ${VALID_ACTIONS.join(', ')}`);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (action === 'run_full_proof') {
      console.log(`[test-attachments-storage] ALLOW(run_full_proof) caller_user_id=${user.id}`);
      const result = await runFullProof(supabaseAdmin, requestId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list_prefix') {
      const prefix = body?.prefix;
      if (typeof prefix !== 'string' || prefix.trim().length === 0) {
        throw new ValidationError('prefix is required for list_prefix and must be a non-empty string');
      }
      console.log(
        `[test-attachments-storage] ALLOW(list_prefix) caller_user_id=${user.id} prefix=${prefix}`,
      );
      const result = await listPrefix(supabaseAdmin, prefix.trim());
      return new Response(JSON.stringify({ ok: true, requestId, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'remove_paths') {
      const paths = body?.paths;
      if (!Array.isArray(paths) || paths.some((p) => typeof p !== 'string' || p.trim().length === 0)) {
        throw new ValidationError('paths is required for remove_paths and must be a non-empty string array');
      }
      console.log(
        `[test-attachments-storage] ALLOW(remove_paths) caller_user_id=${user.id} count=${paths.length}`,
      );
      const result = await removePaths(supabaseAdmin, paths as string[]);
      return new Response(JSON.stringify({ ok: true, requestId, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action === 'cleanup'
    const prefix = body?.prefix;
    if (typeof prefix !== 'string' || prefix.trim().length === 0) {
      throw new ValidationError('prefix is required for cleanup and must be a non-empty string');
    }
    console.log(`[test-attachments-storage] ALLOW(cleanup) caller_user_id=${user.id} prefix=${prefix}`);
    const result = await cleanup(supabaseAdmin, prefix.trim());
    return new Response(JSON.stringify({ ok: true, requestId, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'test-attachments-storage',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
