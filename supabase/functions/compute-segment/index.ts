import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import {
  type AttendanceRow,
  computeMembership,
  InvalidSegmentRuleError,
  isModalitet,
  parseSegmentRule,
  type SegmentRule,
} from '../_shared/segment-membership.ts';

// compute-segment — beräknat segment-medlemskap från KÄLLAN (Deltaganden),
// strikt Närvaropoäng=1, regel-utvärderad (ADR-064). Repots första POST-LÄS-
// only-EF: regeln (include[]/exclude[] över taxonomin) ryms ej i query-params.
// LÄSER bara Airtable — ingen skrivning, ingen field-allowlists.ts-post (det
// hör L3 "spara" till). Consent FILTRERAS EJ — ejGodkandMail bärs med (L4).
//
// Tabeller per NAMN (ej tbl-id) → samma kod prod+staging (ADR-050).
const DELTAGANDEN_TABLE = 'Deltaganden';
const PERSONER_TABLE = 'Personer';

// Källfråga-fält — STEG-0 live-bekräftade NAMN (Session 35 pre-pass). 'Person (länk)'
// (fldiU06kbTxSafkm4): 0 tomma bland Närvaropoäng=1 (verifierat live), samma
// gruppfält som get-attendance. 'Kursnamn (lookup)' (fldJyjymEoo514AgN) +
// 'Event typ' (fldiDF6PWfYa8afMr, lookup→singleSelect {Utbildning, Föreläsning}).
const SOURCE_FIELDS = ['Person (länk)', 'Kursnamn (lookup)', 'Event typ'];

// Strikt närvaro-golv (ADR-064 beslut 1) — identisk mängd som rollup-kedjans
// lynchpin (Status ∈ {Närvarande, Deltog online}, EventAttendance.tsx).
const NARVARO_FILTER = '{Närvaropoäng}=1';

// Personer-namn-berikningens chunk-tak (get-attendance-mall): ≤50 record-ID per
// `OR(RECORD_ID()=…)` → ceil(N/50) listanrop, NOLL N+1, noll trunkering.
const PERSON_BATCH_SIZE = 50;

const PERSON_FIELDS = ['Namn', 'E-post', 'Ej godkänd för mailutskick'];

type Fields = Record<string, unknown>;

type SegmentMember = {
  id: string;
  namn: string | null;
  email: string | null;
  ejGodkandMail: boolean;
};

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Person-länk (record-ID-array → Personer) → enda record-ID. Varnar vid >1
 * (data-form-avvikelse, ALDRIG tyst array-drop — scalarString-disciplinen).
 * 'Person (länk)' är prefersSingleRecordLink=true och 100% enkel-värd i prod
 * (live-verifierat); varningen fångar en framtida regression.
 */
function singleLinkedId(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  if (value.length > 1) {
    console.warn(
      `singleLinkedId: förväntade enkel Person-länk men fick ${value.length} värden — tar första (data-form-avvikelse)`,
    );
  }
  return value.length > 0 && typeof value[0] === 'string' ? value[0] : null;
}

/**
 * Deltaganden-rad → AttendanceRow. Lookups koerceras defensivt till skalär
 * (scalarString varnar vid >1). En rad utan ifylld person/kurs eller utan
 * giltig modalitet hör inte till taxonomin (live-verifierat 0 sådana bland
 * Närvaropoäng=1) → null (hoppas, ej tyst förvanskad).
 */
function toAttendanceRow(record: { fields: Fields }): AttendanceRow | null {
  const f = record.fields;
  const personId = singleLinkedId(f['Person (länk)']);
  const kurs = scalarString(f['Kursnamn (lookup)']);
  const modalitet = scalarString(f['Event typ']);
  if (personId === null || kurs === null || !isModalitet(modalitet)) {
    return null;
  }
  return { personId, kurs, modalitet };
}

/**
 * Berikar kvalificerade person-ID:n med namn/e-post/consent (get-attendance-
 * mall): chunkad record-ID-batch mot Personer → Map → behåller medlemskaps-
 * ordningen. Personer.Namn = formel-primärfält → scalarString (skalär).
 */
async function enrichMembers(ids: readonly string[]): Promise<SegmentMember[]> {
  if (ids.length === 0) return [];
  const byId = new Map<string, Fields>();
  for (const idChunk of chunk(ids, PERSON_BATCH_SIZE)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = await fetchFromAirtable(PERSONER_TABLE, {
      filterByFormula,
      fields: PERSON_FIELDS,
    });
    for (const r of records) byId.set(r.id, r.fields);
  }
  return ids.map((id) => {
    const f = byId.get(id) ?? {};
    return {
      id,
      namn: scalarString(f['Namn']), // formel-primärfält → skalär
      email: scalarString(f['E-post']), // text → skalär (defensivt)
      ejGodkandMail: f['Ej godkänd för mailutskick'] === true, // checkbox (consent bärs, ej filtrerat)
    };
  });
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

  // Regel-parsning + validering. BÅDE felformad JSON OCH ogiltig regel-form →
  // 400 (klient-fel), skilt från Airtable-fel (→ 500 via mapErrorToResponse).
  let rule: SegmentRule;
  try {
    rule = parseSegmentRule(await req.json());
  } catch (error) {
    const message =
      error instanceof InvalidSegmentRuleError ? error.message : 'Invalid JSON body';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Källa: ALLA Närvaropoäng=1-rader (full-walk), bara läs-fälten.
    const records = await fetchFromAirtable(DELTAGANDEN_TABLE, {
      filterByFormula: NARVARO_FILTER,
      fields: SOURCE_FIELDS,
    });
    const rows = records
      .map(toAttendanceRow)
      .filter((r): r is AttendanceRow => r !== null);

    // 2) Ren medlemskaps-algebra (ADR-064): include OR / exclude NOT-any.
    const memberIds = computeMembership(rule, rows);

    // 3) Namn/e-post/consent-berikning (Person-lookup ger record-ID, ej namn).
    const members = await enrichMembers(memberIds);

    return new Response(JSON.stringify({ members, count: members.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'compute-segment',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
