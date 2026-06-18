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
