// Operations-allowlist för update-record (M4).
//
// Operations läggs till här när Fas 5.5+ (produktionsslice) faktiskt
// anropar dem från UI. Hypotes-listan från Gate A1 fråga 6 finns
// dokumenterad i §F som referens men deployas inte preliminärt.
//
// Anledning: Discovery 2026-05-04 visade att inga UI-callers finns
// idag (Vue + React båda placeholders). Lottas skrivande sker via
// Airtable Interface direkt + Zapier-ingest, inte via dessa Edge
// Functions. Att lägga till operations utan empirisk användning är
// onödig attack-yta.
//
// K7-respekt: hårdkodad operations-mapp är pre-S-track-bridge.
// Operations migreras till `integration_source_configs.config_values
// .write_allowlist` post-S-track (06b §B4). Strukturen `{ tableId,
// allowedFields }` matchar target-schemat så migration blir mekanisk.

export interface OperationDef {
  // Airtable-tabell operationen får skriva till — tabell-NAMN eller tbl-id
  // (utbytbara i API:t). Namn föredras för bas-portabilitet prod↔staging (ADR-050).
  tableId: string;
  // Lista över fältnamn som operationen får sätta.
  // Tomt eller saknad → ingen field skrivbar (deny-by-default).
  allowedFields: readonly string[];
}

// Operations-registret. Första operation registrerad i Fas 5.5
// (vertikal write-slice, Session 18 K1).
const OPERATIONS: Readonly<Record<string, OperationDef>> = {
  // Markera anmälningsavgiften som mottagen. Target-fält valt per
  // ADR-049 (Anmälningsavgift, INTE Status — Status saknar betald-värde;
  // ADR-016:s Status-kodexempel var pre-Fas-2.5-drift). Synk-gate
  // 2-handshakad mot 06a-status 2026-06-13 (inget rename i target-shapen).
  // Namnet lämnar rum åt en framtida slutbetalnings-operation.
  'mark-registration-fee-paid': {
    // Tabell per NAMN (ej tbl-id) — bas-portabelt prod↔staging (ADR-050).
    tableId: 'Anmälningar',
    allowedFields: ['Anmälningsavgift'],
  },
  // Spara fri-text-anteckning på en Person (Fas 6a L6, Session 23). Skrivbart
  // multilineText-fält (fldWGlNr3ujRHo85w, data-model.md § Personer — write-fält);
  // Synk-gate 2 beviljad av Marcus. Tabell per NAMN (ADR-050 bas-portabilitet);
  // Airtable-fält-NAMN 'Anteckningar' (versal A).
  'update-person-note': {
    tableId: 'Personer',
    allowedFields: ['Anteckningar'],
  },
};

// Returnerar OperationDef om operationKey är känd, annars null.
// Caller (update-record) tolkar null som "okänd operation → 400".
export function getOperation(operationKey: string): OperationDef | null {
  return OPERATIONS[operationKey] ?? null;
}

// Verifierar att alla nycklar i `fields` är i operationens
// allowedFields. Returnerar första oväntade fältet, eller null
// om allt är tillåtet. Caller kan tolka null som "OK", string som
// "fält X utanför allowlist → 400".
export function findDisallowedField(
  operation: OperationDef,
  fields: Record<string, unknown>,
): string | null {
  const allowed = new Set(operation.allowedFields);
  for (const key of Object.keys(fields)) {
    if (!allowed.has(key)) return key;
  }
  return null;
}
