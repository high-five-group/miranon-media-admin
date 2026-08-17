// Airtable-kopplad segment-UPPLÖSNING (Fas 6h L2b — extraherad ur compute-segment
// så BÅDE compute-segment OCH send-email konsumerar EN väg, ej två). Den PURA
// algebra-/regel-delen (computeMembership, parseSegmentRule) bor i segment-membership.ts
// och rörs ej; HÄR bor I/O-vägen: Deltaganden-källwalk → AttendanceRow, Personer-
// berikning, och saved-segment-läsning by-id (App-segmentregel, ADR-065).
//
// SegmentMember-formen ägs av den PURA prepare-bulk-send.ts (L1, Node-importerbar utan
// Deno) och återexporteras här för ergonomi — denna modul importerar den, aldrig tvärtom,
// så den pura modulen förblir beroende-fri (ingen airtable-client-transitiv-import i
// api-pure-testet).
//
// Tabeller per NAMN (ej tbl-id) → samma kod prod+staging (ADR-050).

import { fetchFromAirtable } from './airtable-client.ts';
import { scalarString } from './coerce.ts';
import type { SegmentMember } from './prepare-bulk-send.ts';
import {
  type AttendanceRow,
  computeMembership,
  computeMembershipVia,
  InvalidSegmentRuleError,
  isModalitet,
  type Par,
  parseSegmentRule,
  type SegmentRule,
} from './segment-membership.ts';

export type { SegmentMember };

/**
 * compute-segments svars-medlem: `SegmentMember` (namn/e-post/consent) plus
 * VILKA par som gjorde personen medlem (ADR-115 EF-krav 1, `via: Par[]`).
 * Endast `resolveRuleMembers` (compute-segment) producerar detta — send-
 * email-unionen (`resolveSegmentMembers`) förblir vid ren `SegmentMember`
 * (ADR-067:s kontrakt, orört).
 */
export type SegmentMemberWithVia = SegmentMember & { via: Par[] };

const DELTAGANDEN_TABLE = 'Deltaganden';
const PERSONER_TABLE = 'Personer';
const SEGMENT_TABLE = 'Segment';

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

// App-sparad regel-fält (ADR-065); en legacy-Make-rad har TOMT fält → ej upplösbar.
const SEGMENT_RULE_FIELD = 'App-segmentregel';

type Fields = Record<string, unknown>;

/** Ett begärt segmentId saknas eller bär ingen giltig app-regel (legacy/oparsbar). */
export class SegmentNotResolvableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SegmentNotResolvableError';
  }
}

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

/** ALLA Närvaropoäng=1-rader (full-walk) koercerade till AttendanceRow. */
export async function fetchAttendanceRows(): Promise<AttendanceRow[]> {
  const records = await fetchFromAirtable(DELTAGANDEN_TABLE, {
    filterByFormula: NARVARO_FILTER,
    fields: SOURCE_FIELDS,
  });
  return records.map(toAttendanceRow).filter((r): r is AttendanceRow => r !== null);
}

/**
 * En regel → berikade medlemmar MED `via` (ADR-115 EF-krav 1 + 3): källa →
 * algebra (computeMembershipVia, ger både medlemskap OCH vilka par som
 * kvalificerade var och en) → namn/e-post/consent-berikning. `via` bärs med
 * på svars-medlemmen så fördelningen (vilken kurs/grupp gjorde personen
 * medlem) kräver ingen andra fråga — precis den klient-genväg ADR-115 skarpt
 * avskaffar (S104 Del 3: klient-snittet över flera compute-segment-anrop får
 * aldrig promoveras).
 */
export async function resolveRuleMembers(rule: SegmentRule): Promise<SegmentMemberWithVia[]> {
  const rows = await fetchAttendanceRows();
  const hits = computeMembershipVia(rule, rows);
  const members = await enrichMembers(hits.map((hit) => hit.personId));
  const viaByPersonId = new Map(hits.map((hit) => [hit.personId, hit.via]));
  return members.map((member) => ({ ...member, via: viaByPersonId.get(member.id) ?? [] }));
}

/**
 * Saved-segment-läsning by-id → Map<segmentId, regel>. Endast rader med en GILTIG
 * app-regel (App-segmentregel parsbar) kommer med; legacy-/oparsbara hoppas (callern
 * upptäcker dem som saknade och felar distinkt). Chunkad RECORD_ID()-batch (≤50).
 */
async function fetchSavedRulesByIds(
  segmentIds: readonly string[],
): Promise<Map<string, SegmentRule>> {
  const byId = new Map<string, SegmentRule>();
  for (const idChunk of chunk(segmentIds, PERSON_BATCH_SIZE)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = await fetchFromAirtable(SEGMENT_TABLE, {
      filterByFormula,
      fields: [SEGMENT_RULE_FIELD],
    });
    for (const r of records) {
      const raw = scalarString(r.fields[SEGMENT_RULE_FIELD]);
      if (raw === null) continue; // legacy Make-rad (ingen app-regel)
      try {
        byId.set(r.id, parseSegmentRule(JSON.parse(raw)));
      } catch (error) {
        // Oparsbar/ogiltig app-regel: hoppa (callern felar distinkt på saknad id).
        const reason = error instanceof InvalidSegmentRuleError ? error.message : 'oparsbar JSON';
        console.warn(`[segment-resolution] hoppar segment ${r.id}: App-segmentregel ${reason}`);
      }
    }
  }
  return byId;
}

/**
 * segmentIds → union av berikade medlemmar (send-email-vägen). Läser sparade
 * regler by-id, beräknar medlemskap per regel mot EN delad Deltaganden-walk, och
 * UNIONERAR på person (record-ID — dedup på person, EJ e-post; e-post-dedup hör
 * prepareBulkSend till). Ett begärt segmentId utan giltig app-regel → distinkt fel
 * (fail-closed: en oåterkallelig sändning litar aldrig på en halv-upplöst mängd).
 */
export async function resolveSegmentMembers(
  segmentIds: readonly string[],
): Promise<SegmentMember[]> {
  if (segmentIds.length === 0) return [];

  const ruleById = await fetchSavedRulesByIds(segmentIds);
  const missing = segmentIds.filter((id) => !ruleById.has(id));
  if (missing.length > 0) {
    throw new SegmentNotResolvableError(
      `Segment saknar giltig app-regel (okänt eller legacy-Make-segment): ${missing.join(', ')}`,
    );
  }

  const rows = await fetchAttendanceRows();
  const unionIds: string[] = [];
  const seen = new Set<string>();
  for (const id of segmentIds) {
    const rule = ruleById.get(id);
    if (!rule) continue; // omöjligt efter missing-grinden; typ-narrow
    for (const personId of computeMembership(rule, rows)) {
      if (!seen.has(personId)) {
        seen.add(personId);
        unionIds.push(personId);
      }
    }
  }
  return enrichMembers(unionIds);
}
