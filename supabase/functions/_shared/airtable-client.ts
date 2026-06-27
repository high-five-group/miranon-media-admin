// Airtable REST-API-host (samma för alla baser/miljöer — ej prod-bindning).
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

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

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      console.warn('Airtable rate limit hit — waiting 1s');
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

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
 * 5 req/sek respekteras automatiskt (ett anrop per sida). 429 → vänta 1s och
 * försök igen (samma backoff-form som full-walk, men utan att gå vidare).
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

  for (;;) {
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

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      console.warn('Airtable rate limit hit — waiting 1s');
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable ${res.status}: ${body}`);
    }

    const data: AirtableResponse = await res.json();
    return { records: data.records, nextOffset: data.offset ?? null };
  }
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
 * typen i praktiken "record saknas" → null. Andra fel kastas. 429 → vänta 1s.
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

  for (;;) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      console.warn('Airtable rate limit hit — waiting 1s');
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }

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
    throw new Error(`Airtable upsert ${res.status}: ${body}`);
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
