// _shared/agendapunkter.ts — TASK-309.3, ADR-125 § 2+3. Agendans atomiska
// dags-ersättning, delad av `save-event-text` (förälder: Event, eventets
// EGNA agenda-kopia) och `save-event-content` (förälder: Eventinnehåll,
// STANDARDAGENDAN). "Exakt EN förälder" (ADR-125 § 2) är skrivvägens ansvar
// — basen har ingen invariant som förhindrar en rad med BÅDA länkarna satta;
// denna funktion sätter ALDRIG mer än en av dem per anrop.
//
// ANVÄNDER MEDVETET INTE `buildLinkedRecordFilter` mot Agendapunkter-tabellen
// — T15-KLASS-BUGGEN (samma vägg `get-attendance/index.ts` och
// `get-registrations/index.ts` redan dokumenterar): `ARRAYJOIN({LänkFält})`
// på en `multipleRecordLinks`-kolumn returnerar länkens PRIMÄR-DISPLAY
// (Eventplanerings/Eventinnehålls primärfält), INTE record-ID:t —
// `FIND(parentId, ARRAYJOIN({Event}))` matchar därför NOLL rader oavsett
// hur många som faktiskt är länkade. Mätt skarpt mot staging 2026-08-23
// (TASK-309.3): en "ersätt"-skrivning skapade den nya raden men lämnade de
// gamla ORÖRDA (`deletedIds: []` trots två existerande rader) — se
// slutrapportens § Avvikelser. Fixen speglar `get-document-sources`s
// `fetchAgendapunkterByRecordIds`/`get-attendance`s "RECORD-ID FRÅN
// ÄGAR-HÅLLET"-mönster: läs FÖRÄLDERNS EGEN auto-födda spegelfält
// (`Agendapunkter`, samma namn på BÅDA Eventplanering och Eventinnehåll,
// data-model.md § Bilagornas datamodell) för att få record-ID:n DIREKT,
// batch-hämta dem via `RECORD_ID()=`-OR, filtrera på `Dag` i JS.

import {
  createAirtableRecords,
  deleteAirtableRecords,
  fetchAirtableRecord,
  fetchFromAirtable,
} from './airtable-client.ts';
import { ValidationError } from './errors.ts';
import { findDisallowedField, getOperation } from './field-allowlists.ts';

export const AGENDAPUNKTER_TABLE = 'Agendapunkter';
const AGENDA_OPERATION_KEY = 'save-agendapunkter';

// Förälderns EGEN tabell + spegelfält som bär Agendapunkter-record-ID:n
// (auto-född vid Agendapunkter.<parentField>-skapelsen). Samma fältnamn
// ('Agendapunkter') på BÅDA sidor — se data-model.md § Bilagornas datamodell.
const PARENT_TABLE: Record<AgendaParentField, string> = {
  Event: 'Eventplanering',
  Eventinnehåll: 'Eventinnehåll',
};
const PARENT_MIRROR_FIELD = 'Agendapunkter';

export type AgendaParentField = 'Event' | 'Eventinnehåll';

export interface AgendaRadInput {
  text: string;
  tid?: string;
  meditation?: boolean;
}

export interface ReplaceAgendaResult {
  createdIds: string[];
  deletedIds: string[];
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Batch-hämta Agendapunkter-rader via record-ID (RECORD_ID()=-OR, chunkat
 *  ≤50 — samma mall som get-document-sources/get-attendance). */
async function fetchAgendapunkterByRecordIds(
  ids: readonly string[],
): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  const out: { id: string; fields: Record<string, unknown> }[] = [];
  for (const idChunk of chunk(ids, 50)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = (await fetchFromAirtable(AGENDAPUNKTER_TABLE, {
      filterByFormula,
      fields: ['Dag'],
    })) as { id: string; fields: Record<string, unknown> }[];
    out.push(...records);
  }
  return out;
}

/**
 * Ersätter EN dags Agendapunkter-rader ATOMÄRT för en given förälder
 * (Event ELLER Eventinnehåll). VALD ORDNING (bokförd, TASK-309.3-uppdraget
 * kräver det explicit): hämta befintliga → SKAPA NYA → TA BORT GAMLA —
 * ALDRIG omvänt. Airtable saknar transaktioner
 * (docs/reference/airtable-constraints.md), så ett avbrott MELLAN create
 * och delete är det enda ofrånkomliga felfönstret; denna ordning gör att
 * ett sådant avbrott lämnar TVÅ uppsättningar (dubblerat innehåll,
 * upptäckbart och ofarligt att städa) i stället för NOLL (en tom agenda i
 * en genererad bilaga — den värsta möjliga tysta förlusten, ADR-125 § 3:s
 * "aldrig tyst regenerering"-anda tillämpad på skrivsidan).
 *
 * `rader: []` är en giltig, avsiktlig "töm den här dagens kopia"-anrop —
 * befintliga rader raderas, noll nya skapas. Anropar man detta för BÅDA
 * dagarna blir totalen noll egna rader, vilket får läsvägen
 * (`get-document-sources`s `eventHarEgenAgenda`) att falla tillbaka till
 * standarden för BÅDA dagarna (ADR-125 beslut 1 — "tomt kopia-fält =
 * standarden gäller", tillämpat på agendans hela-agendan-eller-inget-form).
 */
export async function replaceAgendaForDag(params: {
  parentField: AgendaParentField;
  parentId: string;
  dag: 1 | 2;
  rader: readonly AgendaRadInput[];
}): Promise<ReplaceAgendaResult> {
  const { parentField, parentId, dag, rader } = params;

  // Läs FÖRÄLDERNS spegelfält för att hitta BÅDA dagarnas Agendapunkter-
  // record-ID:n, filtrera sedan på `Dag` i JS (se filhuvudets T15-not).
  const parentRecord = await fetchAirtableRecord(PARENT_TABLE[parentField], parentId);
  const allAgendaIds = Array.isArray(parentRecord?.fields[PARENT_MIRROR_FIELD])
    ? (parentRecord.fields[PARENT_MIRROR_FIELD] as string[])
    : [];
  const allAgendaRows = allAgendaIds.length > 0 ? await fetchAgendapunkterByRecordIds(allAgendaIds) : [];
  const existing = allAgendaRows.filter((r) => r.fields['Dag'] === dag);

  const nyaFalt = rader.map((rad, index) => ({
    Text: rad.text,
    Dag: dag,
    Ordning: index,
    Tid: rad.tid ?? '',
    Meditation: rad.meditation ?? false,
    [parentField]: [parentId],
  }));

  // Allowlist-SSOT (AC #5): kontrolleras EN gång här — delad av BÅDA
  // callarna (save-event-text/save-event-content) i stället för dubblerad
  // i varje EF. `findDisallowedField` körs per rad (samma fältnamns-
  // uppsättning för alla rader i denna batch, men defense-in-depth är
  // billig och matchar övriga EF:ers per-write-check).
  const operation = getOperation(AGENDA_OPERATION_KEY);
  if (!operation) {
    throw new ValidationError(`Unknown operation: ${AGENDA_OPERATION_KEY}`);
  }
  for (const falt of nyaFalt) {
    const disallowed = findDisallowedField(operation, falt);
    if (disallowed !== null) {
      throw new ValidationError(
        `Field "${disallowed}" not allowed for operation "${AGENDA_OPERATION_KEY}"`,
      );
    }
  }

  // SKAPA FÖRST (se filhuvudets ordnings-motivering).
  const created = await createAirtableRecords(AGENDAPUNKTER_TABLE, nyaFalt);
  const deletedIds = existing.map((r) => r.id);
  // TA BORT SEDAN.
  await deleteAirtableRecords(AGENDAPUNKTER_TABLE, deletedIds);

  return { createdIds: created.map((r) => r.id), deletedIds };
}
