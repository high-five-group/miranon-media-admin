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
  // Skapa en manuell anmälan (Fas 6c Leverabel 4, create-registration-EF).
  // Till skillnad mot update-operationerna ovan bygger EF:en `fields` SERVER-SIDE
  // ur typade inputs (fornamn/efternamn/e-post/telefon/eventId) — listan är därför
  // en SSOT-grind mot framtida kod-drift (om EF:en någon gång skulle försöka skriva
  // ett fält utanför listan → findDisallowedField fäller före Airtable-anropet), ej
  // en klient-nåbar deny-yta. Endast skrivbara create-fält (data-model.md § Anmälningar
  // write-fält); formel/rollup (Namn/Normaliserad e-post/Är aktiv) ALDRIG. Länk-fältets
  // NAMN är 'Event' (live-schema fldi3enUaMdbuGSlm, ej "Event-länk"). Person-länk EJ med
  // — den delegeras till A2 (data-model.md rad 204). Tabell per NAMN (ADR-050).
  'create-registration': {
    tableId: 'Anmälningar',
    allowedFields: [
      'Förnamn',
      'Efternamn',
      'E-post',
      'Mobilnummer',
      'Källa',
      'Status',
      'Antal platser',
      'Inskickad',
      'EventKey',
      'Event',
    ],
  },
  // Spara en namngiven segment-regel som en NY rad i Segment-tabellen (Fas 6g L3,
  // ADR-065 — repots första 6g-write). save-segment-EF:en bygger `fields` SERVER-SIDE
  // ur typade inputs (namn/rule/definition) — listan är därför en SSOT-grind mot
  // framtida kod-drift (om EF:en någon gång skulle försöka skriva ett fält utanför
  // listan → findDisallowedField fäller före Airtable-anropet), ej en klient-nåbar
  // deny-yta. Endast de TRE app-skrivbara fälten (live-verifierade skrivbara Session 36
  // pass 3 STEG 0: singleLineText/multilineText — ej formel/rollup/lookup/button/
  // lastModified). Make-LEGACY-fälten (Segmentformel / Antal i segment / Beräkna antal
  // i segment / Mailutskick / Används för utskick) sätts ALDRIG — de ligger MEDVETET
  // utanför listan (Make-vägen, rivs ej mitt-i-flykt; ADR-065 beslut 3). 'App-segmentregel'
  // bär JSON.stringify(rule). Tabell per NAMN (ADR-050 bas-portabilitet).
  'save-segment': {
    tableId: 'Segment',
    allowedFields: ['Namn på segment', 'App-segmentregel', 'Segmentdefinition'],
  },
  // Skapa ett nytt event i Eventplanering (Fas 6f, ADR-066 — repots tredje write-vertikal).
  // create-event-EF:en bygger `fields` SERVER-SIDE ur typade inputs (event/typ/ort/datum/
  // platser/status/eventtyp/idempotensnyckel) — listan är därför en SSOT-grind mot framtida
  // kod-drift (om EF:en någon gång skulle försöka skriva ett fält utanför listan →
  // findDisallowedField fäller före Airtable-anropet), ej en klient-nåbar deny-yta.
  // Endast live-belagda skrivbara create-fält (data-model.md § Eventplanering create-fält);
  // system-genererade (EventKey/Event-nr), formel/rollup/lookup och spegel/länk-fält som sätts
  // från motsatt sida (Anmälningar/Närvaro) sätts ALDRIG. 'Idempotensnyckel' MÅSTE vara med —
  // EF:en skriver det server-side som merge-nyckel för upserten (ADR-066 b3); annars fäller
  // findDisallowedField vår egen skrivning. Tabell per NAMN (ADR-050 bas-portabilitet).
  'create-event': {
    tableId: 'Eventplanering',
    allowedFields: [
      'Event (source)',
      'Typ',
      'Ort',
      'Startdatum',
      'Slutdatum',
      'Månad/år',
      'Max antal platser',
      'Status',
      'Eventtyp',
      'Idempotensnyckel',
    ],
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
