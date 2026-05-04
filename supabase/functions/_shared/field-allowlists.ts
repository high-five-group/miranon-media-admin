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
  // Airtable table-ID som operationen får skriva till.
  tableId: string;
  // Lista över fältnamn som operationen får sätta.
  // Tomt eller saknad → ingen field skrivbar (deny-by-default).
  allowedFields: readonly string[];
}

// Operations-registret. Tomt tills första UI-flow byggs i Fas 5.5+.
const OPERATIONS: Readonly<Record<string, OperationDef>> = {
  // Format när första operation läggs till:
  //
  // 'registration.set-status': {
  //   tableId: 'tbloOcrppVoyrHbrq', // Anmälningar
  //   allowedFields: ['Status'],
  // },
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
