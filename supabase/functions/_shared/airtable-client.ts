import { ValidationError } from './errors.ts';
import { withAirtable429Retry } from './airtable-retry.ts';

// Airtable REST-API-host (samma för alla baser/miljöer — ej prod-bindning).
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

/**
 * Klassar Airtables EGNA valideringsavvisning (TASK-190) — typiskt 422 när
 * `typecast:false` möter ett värde ett fält inte kan acceptera (t.ex. en
 * fri text mot en STÄNGD singleSelect, `create-event`s repro: `Event
 * (source)` med ett värde utanför de sex giltiga alternativen). Utan denna
 * klassning kastar `upsertAirtableRecord` en vanlig `Error` som
 * `_shared/errors.ts`s `mapErrorToResponse` inte känner igen → faller till
 * generisk 500 "Internal error", och anroparen kan inte skilja sitt EGET
 * kontraktsbrott från ett äkta serverfel (exakt vad kortet mätte).
 *
 * Airtables felkuvert är `{ error: { type, message } }` för 4xx (bekräftat
 * mot developers.airtable.com/api/errors, 2026-08-24 — status 422 "Invalid
 * Request" dokumenterat, exakt `type`-strängen för fält-nivå-avvisningar är
 * INTE dokumenterad där och GISSAS alltså inte: vi vidarebefordrar
 * Airtables `message` OFÖRÄNDRAT, vilket i praktiken bär fältnamnet i
 * citattecken). Status LÄSES ur svaret (aldrig hårdkodad) så klassningen
 * håller även om Airtable råkar svara 400 i stället för 422 för samma fel.
 *
 * Oparsbar/annan body (ospårbart 4xx, eller 5xx/nätverksfel) → generisk
 * `Error` (OFÖRÄNDRAT beteende, faller till 500 i mapErrorToResponse) — en
 * klassning vi inte kan BEVISA ur svaret görs aldrig (ADR-083-disciplinen:
 * hellre en ärlig 500 än ett gissat 4xx).
 */
export function classifyAirtableWriteError(method: string, status: number, rawBody: string): Error {
  if (status >= 400 && status < 500) {
    try {
      const parsed = JSON.parse(rawBody) as { error?: { type?: string; message?: string } };
      const airtableMessage = parsed?.error?.message;
      if (typeof airtableMessage === 'string' && airtableMessage.length > 0) {
        const typ = typeof parsed?.error?.type === 'string' ? parsed.error.type : 'unknown';
        return new ValidationError(`Airtable ${method} ${status} (${typ}): ${airtableMessage}`, status);
      }
    } catch {
      // Oparsbar JSON-body — faller igenom till det generiska felet nedan.
    }
  }
  return new Error(`Airtable ${method} ${status}: ${rawBody}`);
}

// Bas-ID läses från env (fail-fast, INGEN hårdkodad prod-fallback) så att samma
// Edge Function kan peka mot prod- eller staging-Airtable-bas via Supabase-secret
// utan kod-ändring — ADR-050:s primära isolerings-spak. En fallback skulle låta
// staging tyst skriva till prod om secreten saknas, exakt det ADR-050 eliminerar.
function getAirtableBaseId(): string {
  const baseId = Deno.env.get('AIRTABLE_BASE_ID');
  if (!baseId) {
    throw new Error('AIRTABLE_BASE_ID not set');
  }
  return baseId;
}

interface AirtableOptions {
  fields?: string[];
  filterByFormula?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  maxRecords?: number;
  view?: string;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

export async function fetchFromAirtable(
  tableIdOrName: string,
  options: AirtableOptions = {},
): Promise<AirtableRecord[]> {
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    // tableIdOrName url-encodas — Airtable accepterar tabell-namn i path
    // (namn och id utbytbara), och namn kan innehålla icke-ASCII (t.ex. "Anmälningar").
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}`);

    if (options.fields) {
      for (const field of options.fields) {
        url.searchParams.append('fields[]', field);
      }
    }
    if (options.filterByFormula) {
      url.searchParams.set('filterByFormula', options.filterByFormula);
    }
    if (options.sort) {
      for (let i = 0; i < options.sort.length; i++) {
        url.searchParams.set(`sort[${i}][field]`, options.sort[i].field);
        url.searchParams.set(`sort[${i}][direction]`, options.sort[i].direction);
      }
    }
    if (options.maxRecords) {
      url.searchParams.set('maxRecords', String(options.maxRecords));
    }
    if (options.view) {
      url.searchParams.set('view', options.view);
    }
    if (offset) {
      url.searchParams.set('offset', offset);
    }

    // 429 → Airtable-konform backoff (>= 30s, tak på omförsöken) i _shared/airtable-retry.ts.
    // Uttömt tak returnerar 429-svaret → faller genom !res.ok nedan och kastar som vanligt.
    const res = await withAirtable429Retry(() =>
      fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable ${res.status}: ${body}`);
    }

    const data: AirtableResponse = await res.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

interface AirtablePageOptions {
  fields?: string[];
  filterByFormula?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  pageSize?: number;
  offset?: string;
}

/**
 * Hämtar EN sida (cursor-paginering, ADR-056) — till skillnad mot
 * `fetchFromAirtable` som walk:ar hela settet. Gör exakt ETT Airtable-listanrop
 * och returnerar Airtables nästa `offset` (eller `null` på sista sidan) så att
 * callern kan wrappa den till en opak klient-cursor. Lägger TILL bredvid
 * full-walk-varianten — get-events/get-registrations rörs inte.
 *
 * 5 req/sek respekteras automatiskt (ett anrop per sida). 429 → Airtable-konform
 * backoff (>= 30s, ändligt tak) via `_shared/airtable-retry.ts` — samma mekanism
 * som full-walk och single-get delar, så alla tre kan inte glida isär.
 */
export async function fetchAirtablePage(
  tableIdOrName: string,
  options: AirtablePageOptions = {},
): Promise<{ records: AirtableRecord[]; nextOffset: string | null }> {
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}`);

  if (options.fields) {
    for (const field of options.fields) {
      url.searchParams.append('fields[]', field);
    }
  }
  if (options.filterByFormula) {
    url.searchParams.set('filterByFormula', options.filterByFormula);
  }
  if (options.sort) {
    for (let i = 0; i < options.sort.length; i++) {
      url.searchParams.set(`sort[${i}][field]`, options.sort[i].field);
      url.searchParams.set(`sort[${i}][direction]`, options.sort[i].direction);
    }
  }
  if (options.pageSize) {
    url.searchParams.set('pageSize', String(options.pageSize));
  }
  if (options.offset) {
    url.searchParams.set('offset', options.offset);
  }

  // Den tidigare `for(;;)`-loopen fanns ENBART för 429-omförsöken; retry-modulen äger den nu.
  const res = await withAirtable429Retry(() =>
    fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }),
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }

  const data: AirtableResponse = await res.json();
  return { records: data.records, nextOffset: data.offset ?? null };
}

/**
 * Hämtar EN record via dess record-ID (Airtable GET /{table}/{recordId}) —
 * single-get-mallen för detalj-EF:er (get-person nu; 6b get-event ärver).
 *
 * Till skillnad mot list-endpointen (som returnerar tom array för ett
 * icke-existerande ID) signalerar record-endpointen "finns inte" → vi
 * returnerar `null` så callern kan mappa det till sitt eget 404-kontrakt (ej
 * 500/tomt 200). Airtable använder TVÅ statusar för det: 404 (NOT_FOUND) OCH
 * 403 `INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND` — record-GET konflerar medvetet
 * "saknas" och "ingen behörighet" till 403 (läcker inte existens). Eftersom
 * token-scopet redan ger bas-access (verifierat L4/L5b) betyder en 403 med den
 * typen i praktiken "record saknas" → null. Andra fel kastas. 429 → Airtable-konform
 * backoff (>= 30s, ändligt tak) via `_shared/airtable-retry.ts`.
 */
export async function fetchAirtableRecord(
  tableIdOrName: string,
  recordId: string,
): Promise<AirtableRecord | null> {
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}/${recordId}`;

  // Den tidigare `for(;;)`-loopen fanns ENBART för 429-omförsöken; retry-modulen äger den nu.
  const res = await withAirtable429Retry(() =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }),
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const body = await res.text();
    // 403 med model-not-found-typen = record saknas (se doc ovan) → null.
    if (res.status === 403 && body.includes('INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND')) {
      return null;
    }
    throw new Error(`Airtable ${res.status}: ${body}`);
  }

  return (await res.json()) as AirtableRecord;
}

export async function updateAirtableRecord(
  tableIdOrName: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}/${recordId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable PATCH ${res.status}: ${body}`);
  }

  return await res.json();
}

/**
 * Skapar EN ny record i en tabell (Airtable POST /{table} med `{ fields }`) —
 * write-mallens create-motsvarighet till `updateAirtableRecord` (PATCH). Speglar
 * dess form exakt: injektions-säker (callern bygger `fields` med fält-NAMN, ingen
 * user-styrd path/query interpoleras), bas-ID ur env (fail-fast, ingen prod-fallback,
 * ADR-050), table-namn url-encodas (icke-ASCII-säkert, t.ex. "Anmälningar").
 *
 * Airtables single-create-form `{ fields }` returnerar den skapade raden direkt
 * (`{ id, fields, createdTime }`) inkl. beräknade formel-/lookup-fält. INGEN
 * `typecast` — callern skickar exakta singleSelect-NAMN som redan finns i schemat
 * (verifierat mot data-model.md), så Airtable behöver inte coerce:a.
 */
export async function createAirtableRecord(
  tableIdOrName: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable POST ${res.status}: ${body}`);
  }

  return await res.json();
}

/**
 * Upsert via Airtable PATCH /{table} med `performUpsert.fieldsToMergeOn` — match-or-create
 * i ETT atomiskt server-anrop (ADR-066:s idempotens-mekanism). Till skillnad mot en klient-
 * eller EF-intern check-then-create flyttas atomiciteten till Airtable: noll merge-träffar →
 * ny rad SKAPAS; en träff → den raden patchas (last-write-wins); flera träffar → Airtable
 * felar (kastas). Returnerar raden + `created` (true = createdRecords, false = updatedRecords)
 * så callern kan skilja ett nytt event från en idempotent replay (retry av samma nyckel).
 *
 * `typecast: false` EXPLICIT — ett ogiltigt singleSelect-värde ska FELA (→ kastas → 500),
 * ALDRIG tyst skapa en ny option i schemat. Speglar `createAirtableRecord`:s injektions-
 * säkerhet (callern bygger `fields` med fält-NAMN, ingen user-styrd path/query interpoleras),
 * env-fail-fast (ingen prod-fallback, ADR-050) och icke-ASCII-säkra table-encoding.
 *
 * Merge-fält får per Airtable-API:t inte vara beräknade (formel/lookup/rollup) — det är
 * callerns ansvar att `fieldsToMergeOn` pekar på ett skrivbart fält (ADR-066: `Idempotensnyckel`).
 */
export async function upsertAirtableRecord(
  tableIdOrName: string,
  fields: Record<string, unknown>,
  fieldsToMergeOn: string[],
): Promise<{ record: AirtableRecord; created: boolean }> {
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn },
      records: [{ fields }],
      typecast: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    // TASK-190: Airtables egen valideringsavvisning (t.ex. typecast:false mot en
    // stängd singleSelect) klassas till ValidationError/4xx med fältnamnet kvar
    // i meddelandet — se classifyAirtableWriteError-filhuvudet ovan.
    throw classifyAirtableWriteError('upsert', res.status, body);
  }

  const data = (await res.json()) as {
    records: AirtableRecord[];
    createdRecords?: string[];
    updatedRecords?: string[];
  };
  const record = data.records[0];
  // createdRecords listar de record-ID:n som SKAPADES (vs updatedRecords som patchades).
  const created = Array.isArray(data.createdRecords) && data.createdRecords.includes(record.id);
  return { record, created };
}

/**
 * Tar bort EN record (Airtable DELETE /{table}/{recordId}) — repots FÖRSTA
 * delete-operation (TASK-147.7, `_shared/receipt-numbering.ts` §
 * `LedgerRemover`). Radera en FÖRLORAD kvittonummer-allokerings-kandidat
 * (samtidighets-racet, aldrig ett utfärdat kvitto — se receipt-numbering.ts
 * filhuvud) är den ENDA konsumenten i dag; ingen annan skrivvertikal raderar
 * poster. Speglar de övriga funktionernas form: env-fail-fast (ingen
 * prod-fallback, ADR-050), bas-ID ur env, table-namn url-encodas.
 * Idempotent mot en redan borttagen rad (404 tolkas som "borta, målet nått" —
 * INTE ett fel, samma "get som redan är null"-linje `fetchAirtableRecord`
 * drar, eftersom `allocateReceiptNumber`s retry-loop i teorin skulle kunna
 * anropa remove för samma id två gånger under ovanlig omschemaläggning).
 */
export async function deleteAirtableRecord(
  tableIdOrName: string,
  recordId: string,
): Promise<void> {
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}/${recordId}`;

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) return;

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable DELETE ${res.status}: ${body}`);
  }
}

/**
 * Skapar FLERA records i en batch (Airtable POST /{table} med `{ records:
 * [...] }`) — TASK-309.3: agendans atomiska dags-ersättning
 * (`_shared/agendapunkter.ts`) kan behöva skapa upp mot ~15 rader i ETT
 * svep. Airtable tillåter max 10 records per anrop; denna funktion
 * chunk:ar och POST:ar en chunk i taget, SEKVENTIELLT (ingen
 * parallellisering — samma throttle-försiktighet som `fetchFromAirtable`s
 * sid-loop; `purge-staging-sentinels.mjs` delar samma chunk-storlek för
 * sin DELETE-batchning, se den filens filhuvud). `typecast: false`
 * EXPLICIT (samma disciplin som `upsertAirtableRecord`) — Text/Tid är fria
 * strängar utan singleSelect-risk, men principen hålls konsekvent.
 */
export async function createAirtableRecords(
  tableIdOrName: string,
  fieldsList: readonly Record<string, unknown>[],
): Promise<AirtableRecord[]> {
  if (fieldsList.length === 0) return [];
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}`;

  const created: AirtableRecord[] = [];
  for (let i = 0; i < fieldsList.length; i += 10) {
    const chunkFields = fieldsList.slice(i, i + 10);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: chunkFields.map((fields) => ({ fields })),
        typecast: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable batch POST ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { records: AirtableRecord[] };
    created.push(...data.records);
  }
  return created;
}

/**
 * Tar bort FLERA records i en batch (Airtable DELETE /{table}?records[]=…).
 * Max 10 id:n per anrop (samma Airtable-gräns som create) — chunk:as
 * sekventiellt. TILL SKILLNAD MOT `deleteAirtableRecord` (per-ID-tolerant
 * mot 404 — "redan borta, målet nått") kastar denna OFÖRÄNDRAT vid ett
 * batch-404: agendans ersättnings-flöde (`_shared/agendapunkter.ts`) läser
 * ID:na att ta bort OMEDELBART innan detta anrop, i samma request — ett
 * 404 här signalerar ett genuint oväntat tillstånd (radering i en annan
 * process mitt i samma sekund) och SKA fälla (→ 500 via
 * `mapErrorToResponse`), inte sväljas tyst.
 */
export async function deleteAirtableRecords(
  tableIdOrName: string,
  recordIds: readonly string[],
): Promise<void> {
  if (recordIds.length === 0) return;
  const token = Deno.env.get('AIRTABLE_TOKEN');
  if (!token) {
    throw new Error('AIRTABLE_TOKEN not set');
  }
  const baseId = getAirtableBaseId();

  for (let i = 0; i < recordIds.length; i += 10) {
    const chunkIds = recordIds.slice(i, i + 10);
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableIdOrName)}`);
    for (const id of chunkIds) url.searchParams.append('records[]', id);

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable batch DELETE ${res.status}: ${body}`);
    }
  }
}
