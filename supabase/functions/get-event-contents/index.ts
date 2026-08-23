// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-konsumerande EF:er.
//
// get-event-contents — TASK-309.7 AC #2, ADR-125 § 7. GLOBAL läs-lista över
// SAMTLIGA Eventinnehåll-rader (de sju Event×Typ-kombinationerna,
// data-model.md § Bilagornas datamodell) för Mer-sidans Eventinnehåll-yta —
// listan Lotta väljer en standardtext-kombination ur, INTE ett enskilt
// events ifyllnadsunderlag (det är `get-document-sources`s jobb).
//
// SPEGLAR get-document-sources FÖR AGENDAN, inte "kopia av standard/kopia-
// formen": denna EF returnerar EGNA fältvärden rakt av (ingen event-kontext
// att falla tillbaka mot), plus radens EGEN agenda uppdelad per dag — samma
// `RECORD-ID FRÅN ÄGAR-HÅLLET`-mönster (T15-klass-bugg-undvikande, se
// `_shared/agendapunkter.ts` § filhuvud) som `get-document-sources` redan
// använder, EN kopia per EF (samma konvention den filen själv etablerar).
//
// LÄSER bara — ingen skrivning, ingen allowlist-grind behövs.

import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { EVENTINNEHALL_FALT_KEYS, EVENT_TEXT_BASFALT } from '../_shared/eventinnehall-falt.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

const EVENTINNEHALL_TABLE = 'Eventinnehåll';
const AGENDAPUNKTER_TABLE = 'Agendapunkter';
const AGENDA_LINK_FIELD = 'Agendapunkter';

type Fields = Record<string, unknown>;
type AirtableRow = { id: string; fields: Fields };

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Batch-hämta Agendapunkter-rader via record-ID (samma
 *  get-document-sources-mall — RECORD_ID()=-OR, chunkat ≤50). */
async function fetchAgendapunkterByRecordIds(ids: readonly string[]): Promise<AirtableRow[]> {
  const out: AirtableRow[] = [];
  for (const idChunk of chunk(ids, 50)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = (await fetchFromAirtable(AGENDAPUNKTER_TABLE, {
      filterByFormula,
      fields: ['Text', 'Dag', 'Ordning', 'Tid', 'Meditation'],
    })) as AirtableRow[];
    out.push(...records);
  }
  return out;
}

type AgendaRad = { text: string; tid: string; meditation: boolean };

/** Mappa + sortera (Ordning) + dela upp Agendapunkter-rader per dag (1/2). */
function splitAgendaByDag(rows: AirtableRow[]): { dag1: AgendaRad[]; dag2: AgendaRad[] } {
  const sorted = [...rows].sort((a, b) => {
    const oa = typeof a.fields['Ordning'] === 'number' ? (a.fields['Ordning'] as number) : 0;
    const ob = typeof b.fields['Ordning'] === 'number' ? (b.fields['Ordning'] as number) : 0;
    return oa - ob;
  });
  const toRad = (r: AirtableRow): AgendaRad => ({
    text: scalarString(r.fields['Text']) ?? '',
    tid: scalarString(r.fields['Tid']) ?? '',
    meditation: r.fields['Meditation'] === true,
  });
  return {
    dag1: sorted.filter((r) => r.fields['Dag'] === 1).map(toRad),
    dag2: sorted.filter((r) => r.fields['Dag'] === 2).map(toRad),
  };
}

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

  try {
    const rows = (await fetchFromAirtable(EVENTINNEHALL_TABLE, {
      fields: [
        'Namn',
        'Event',
        'Typ',
        ...EVENTINNEHALL_FALT_KEYS.map((k) => EVENT_TEXT_BASFALT[k]),
        AGENDA_LINK_FIELD,
      ],
      sort: [{ field: 'Namn', direction: 'asc' }],
    })) as AirtableRow[];

    const eventinnehall = await Promise.all(
      rows.map(async (row) => {
        const agendaIds = Array.isArray(row.fields[AGENDA_LINK_FIELD])
          ? (row.fields[AGENDA_LINK_FIELD] as string[])
          : [];
        const agendaRows =
          agendaIds.length > 0 ? await fetchAgendapunkterByRecordIds(agendaIds) : [];

        const falt = Object.fromEntries(
          EVENTINNEHALL_FALT_KEYS.map((k) => [k, scalarString(row.fields[EVENT_TEXT_BASFALT[k]])]),
        );

        return {
          id: row.id,
          namn: scalarString(row.fields['Namn']) ?? '',
          event: selectName(row.fields['Event']),
          typ: selectName(row.fields['Typ']),
          falt,
          agenda: splitAgendaByDag(agendaRows),
        };
      }),
    );

    return new Response(JSON.stringify({ eventinnehall }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-event-contents',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
