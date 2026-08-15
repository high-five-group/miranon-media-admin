import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { decodeCursor, encodeCursor } from '../_shared/cursor.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Cursor-paginering (ADR-056, samma codec som get-persons — `_shared/cursor.ts`s
// egen kommentar förutsäger EXAKT detta: "Fas E:s Postgres-impl återanvänder
// samma codec med sin keyset-cursor i samma envelope"). get-persons packar en
// Airtable-OFFSET i token-strängen; activity_log är den FÖRSTA riktiga
// keyset-cursorn — token-strängen bär `${occurred_at}|${id}` (se
// `parseCursorToken`/`buildCursor` nedan), inte en enkel offset.
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const TABLE_NAME = 'activity_log';

// Speglar `EVENT_ID_EXTENSION_IRI` i
// `src/domain/schemas/ActivityStatement.schema.ts` BYTE FÖR BYTE. Deno Edge
// Functions importerar inte över `src/`-gränsen (ingen precedent i repot för
// det — varje EF adresserar sin Airtable-tabell/Postgres-kolumn med egna
// lokala konstanter, se t.ex. `TABLE_NAME` ovan/i systerfunktionerna) — denna
// sträng hålls därför identisk MANUELLT. Ändras den ena sidan måste den andra
// ändras i samma landning; `tests/api/get-activity-log.staging.test.ts`
// dokumenterar värdet så en divergens är sökbar.
const EVENT_ID_EXTENSION_IRI = 'https://admin.miranon.dev/xapi/extensions/eventId';

// UUID v4-formen räcker inte generellt (kolumnen är bara `uuid`, inte
// specifikt v4) — matcha den generiska 8-4-4-4-12 hex-formen i stället.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CursorToken {
  occurredAt: string;
  id: string;
}

/**
 * Packar en rads `(occurred_at, id)`-par till cursor-tokenen. `occurred_at`
 * kommer alltid ur PostgREST:s EGEN serialisering av `timestamptz`-kolumnen
 * (aldrig ur `statement.timestamp`-strängen i jsonb-blobben) — de två KAN
 * skilja sig i exakt textformat (t.ex. `Z`-suffix kontra `+00:00`, eller
 * millisekund-precision) trots att de representerar samma instant; cursorn
 * måste vara den SERIALISERING som `ORDER BY`/jämförelsen faktiskt körs mot,
 * annars riskerar sid-gränsen att tappa eller dubblera en rad.
 */
function buildCursor(row: { occurred_at: string; id: string }): string {
  return encodeCursor(`${row.occurred_at}|${row.id}`);
}

/**
 * Packar upp en klient-cursor till `{ occurredAt, id }`. Kastar vid
 * felformad indata — callern mappar det till 400 (klient-fel), samma
 * kontrakt som `decodeCursor` självt.
 *
 * FÖRSVAR-I-DJUPLED (inte en korrekthets-nödvändighet): `occurredAt`/`id`
 * vävs in RÅTT i en PostgREST `.or()`-filtersträng nedan (se
 * `applyKeysetFilter`) eftersom `.or()` inte har någon parametriserad form i
 * postgrest-js (till skillnad mot `.eq()`/`.gte()`/`.contains()`, som ALLA
 * är säkert URL-kodade av biblioteket). En cursor är klient-kontrollerad
 * (base64-JSON, `decodeCursor` validerar bara ENVELOPEN, inte innehållet) —
 * utan denna extra validering skulle ett handbyggt `o`-fält kunna injicera
 * ytterligare OR-predikat i filtersträngen. Tabellen har ingen per-användare
 * radscopning (alla autentiserade användare ser samma logg), så värsta
 * tänkbara utfall vore en förvrängd resultatmängd för DEN egna requesten —
 * ändå stängs vägen här i stället för att lita på att den aldrig utnyttjas.
 */
function parseCursorToken(raw: string): CursorToken {
  const decoded = decodeCursor(raw); // kastar 'Invalid cursor' vid trasig envelope
  const separatorIndex = decoded.indexOf('|');
  if (separatorIndex <= 0 || separatorIndex === decoded.length - 1) {
    throw new Error('Invalid cursor');
  }
  const occurredAt = decoded.slice(0, separatorIndex);
  const id = decoded.slice(separatorIndex + 1);
  if (!UUID_RE.test(id)) {
    throw new Error('Invalid cursor');
  }
  if (Number.isNaN(Date.parse(occurredAt))) {
    throw new Error('Invalid cursor');
  }
  // PostgREST .or()-filtersträngens metatecken — en giltig ISO-timestamp
  // eller UUID innehåller aldrig något av dem, så en träff här är alltid
  // ett manipulerat/felformat värde.
  if (/[,()]/.test(occurredAt) || /[,()]/.test(id)) {
    throw new Error('Invalid cursor');
  }
  return { occurredAt, id };
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * get-activity-log — läsvägen för Aktivitetsloggen (`TASK-201.5`, PRD `TASK-201`
 * användarberättelse #2/#3/#7/#13). Läser DIREKT ur Postgres-tabellen
 * `activity_log` (`ADR-110`) via `service_role` (auto-injicerad i varje
 * deployad Edge Function — denna funktion hämtar/hanterar ALDRIG nyckeln
 * själv) — INGEN Airtable-interaktion, till skillnad mot resten av
 * `AirtableAdapter`s EF-anrop. RLS nekar anon/authenticated helt
 * (`tests/api/activity-log-rls.staging.test.ts`); `service_role` har
 * `select, insert` (aldrig `update`/`delete` — append-only på grant-nivå,
 * `supabase/migrations/20260812143131_grant_service_role_activity_log.sql`).
 *
 * SVARSFORMEN ÅTERANVÄNDER xAPI-schemat rakt av (`ActivityStatementSchema`,
 * `TASK-201.1`) — INGEN parallell "flat"-typ uppfinns här. Varje rads
 * `statement`-kolumn ÄR redan exakt xAPI-formen (actor/verb/object/context/
 * timestamp); denna EF returnerar den kolumnen oförändrad per rad.
 * Zod-VALIDERING sker klient-side i adaptern (`src/domain/schemas`s egen
 * barrel-kommentar: "valideras vid systemgränsen") — SAMMA gräns-disciplin
 * som `get-events`/`get-persons`/övriga läs-EF:er, som inte heller Zod-
 * validerar server-side. `TASK-201.3`s skrivväg är den som Zod-validerar
 * VID SKRIVTILLFÄLLET (AC #2 där) — denna EF litar på att en rad som redan
 * ligger i tabellen en gång passerade den kontrollen.
 *
 * PAGINERING: keyset (`occurred_at DESC, id DESC`) — INTE offset (stort och
 * växande register; en offset degraderar linjärt). Cursor-token
 * `${occurred_at}|${id}` via samma opaka codec som `get-persons`
 * (`_shared/cursor.ts`, vars egen kommentar förutsäger detta återbruk för
 * Fas E:s Postgres-implementationer).
 *
 * FILTER (AC #1 — kategori/eventId/tidsintervall i kontraktet):
 *   - `category` → equality mot `object_type`-kolumnen (redan dokumenterad i
 *     migrationsfilen som "filterradens kategori-axel").
 *   - `from`/`to` → ISO 8601, range mot den indexerade `occurred_at`-kolumnen
 *     (`activity_log_occurred_at_idx`).
 *   - `eventId` → `statement`-kolumnens `cs` (contains, Postgres `@>`) mot
 *     `{ context: { extensions: { [EVENT_ID_EXTENSION_IRI]: eventId } } }`
 *     (`src/domain/schemas/ActivityStatement.schema.ts`). ÖPPEN
 *     KOORDINERINGS-SKULD, källmärkt: skrivvägen (`TASK-201.3`/`TASK-201.4`,
 *     byggs PARALLELLT med denna skiva) emitterar ÄNNU INGEN
 *     `eventId`-nyckel i `context.extensions` — filtret är ett korrekt,
 *     manuellt verifierat KONTRAKT (se `supabase/migrations/README.md` §
 *     "get-activity-log — läsvägens paginerings-/filterbevis" för den
 *     fullständiga seed-/verifierings-loggen mot skarp staging) men
 *     returnerar `[]` mot RIKTIGA rader tills skrivvägen antar samma
 *     nyckel. Ingen `object_type`-
 *     eller `eventId`-täckande INDEX läggs till spekulativt här — samma
 *     "lägg till mot en mätt query-plan"-hållning som migrationsfilens egen
 *     kommentar redan uttalar för `object_type`/`verb_id`; tabellen är i
 *     praktiken tom vid denna skivas landning.
 *
 * FEL-KONTRAKT: `{ error }` för 400/401/405 (klient-fel), `{ error,
 * requestId }` för 500 — samma konvention som `get-persons`/`get-attendance`.
 */
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);

  // pageSize: default 50, klamp till [1, 100], ignorera skräp (get-persons-mönstret).
  const rawPageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '', 10);
  const pageSize = Number.isFinite(rawPageSize)
    ? Math.min(Math.max(rawPageSize, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  // cursor: opak klient-token → { occurredAt, id }. Felformad → 400.
  const rawCursor = url.searchParams.get('cursor');
  let cursorToken: CursorToken | undefined;
  if (rawCursor) {
    try {
      cursorToken = parseCursorToken(rawCursor);
    } catch {
      return badRequest('Invalid cursor', corsHeaders);
    }
  }

  const category = url.searchParams.get('category') || undefined;
  const eventId = url.searchParams.get('eventId') || undefined;

  const rawFrom = url.searchParams.get('from');
  if (rawFrom && Number.isNaN(Date.parse(rawFrom))) {
    return badRequest('Invalid "from" — expected ISO 8601', corsHeaders);
  }
  const rawTo = url.searchParams.get('to');
  if (rawTo && Number.isNaN(Date.parse(rawTo))) {
    return badRequest('Invalid "to" — expected ISO 8601', corsHeaders);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server not configured', requestId }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // pageSize + 1 (probe-rad): avgör hasNextPage utan ett separat COUNT-anrop.
    let query = supabaseAdmin
      .from(TABLE_NAME)
      .select('id, occurred_at, statement')
      .order('occurred_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(pageSize + 1);

    if (category) query = query.eq('object_type', category);
    if (rawFrom) query = query.gte('occurred_at', rawFrom);
    if (rawTo) query = query.lte('occurred_at', rawTo);
    if (eventId) {
      // `.contains()` (Postgres `@>`) — se filhuvudets FILTER-avsnitt.
      // JSON.stringify:as korrekt av postgrest-js, ingen arrow-path-quoting
      // (samma säkra parametrisering som .eq()/.gte()/.lte()).
      query = query.contains('statement', {
        context: { extensions: { [EVENT_ID_EXTENSION_IRI]: eventId } },
      });
    }
    if (cursorToken) {
      // Keyset: (occurred_at, id) < (cursor.occurredAt, cursor.id), DESC-ordning.
      // occurredAt/id är validerade fria från PostgREST-filtersträngens
      // metatecken (`parseCursorToken`) innan de vävs in här.
      query = query.or(
        `occurred_at.lt.${cursorToken.occurredAt},and(occurred_at.eq.${cursorToken.occurredAt},id.lt.${cursorToken.id})`,
      );
    }

    // TASK-225.2: totalen för HELA filtermängden — samma filter som
    // huvudqueryn men UTAN cursor (cursorn skär mängden per sida, totalen
    // avser mängden) och utan rader (head-count, `count: 'exact'` — exakt
    // radräkning i Postgres, billig mot indexerade occurred_at-filter).
    // ADDITIVT svarsfält: befintliga konsumenter läser {statements,
    // nextCursor} och är obrutna.
    let countQuery = supabaseAdmin
      .from(TABLE_NAME)
      .select('id', { count: 'exact', head: true });
    if (category) countQuery = countQuery.eq('object_type', category);
    if (rawFrom) countQuery = countQuery.gte('occurred_at', rawFrom);
    if (rawTo) countQuery = countQuery.lte('occurred_at', rawTo);
    if (eventId) {
      countQuery = countQuery.contains('statement', {
        context: { extensions: { [EVENT_ID_EXTENSION_IRI]: eventId } },
      });
    }

    const [{ data, error }, { count, error: countError }] = await Promise.all([query, countQuery]);
    if (error) {
      throw new Error(`activity_log query failed: ${error.message}`);
    }
    if (countError) {
      throw new Error(`activity_log count failed: ${countError.message}`);
    }

    const rows = (data ?? []) as { id: string; occurred_at: string; statement: unknown }[];
    const hasNextPage = rows.length > pageSize;
    const page = hasNextPage ? rows.slice(0, pageSize) : rows;
    const nextCursor =
      hasNextPage && page.length > 0 ? buildCursor(page[page.length - 1]) : null;

    return new Response(
      JSON.stringify({ statements: page.map((row) => row.statement), nextCursor, total: count ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-activity-log',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
