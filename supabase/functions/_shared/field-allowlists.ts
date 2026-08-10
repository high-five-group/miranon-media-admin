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
  // Markera slutbetalningen (task-18.8, PRD task-18 beslut 9 — betalnings-
  // arbetsytans andra kryss; namnet som mark-registration-fee-paid lämnade rum
  // för). Target-fält 'Slutbetalning' (fldIImadnJUZHr5Qh, singleSelect
  // Mottagen/Ej mottagen/'Ej relevant (för föreläsningar)') — skrivbarheten
  // LIVE-VERIFIERAD mot staging-schemat (describe_table tbloOcrppVoyrHbrq
  // 2026-07-22, L294) INNAN posten låstes. Allowlisten gatar FÄLTET, inte
  // värdet — samma operation togglar tillbaka till 'Ej mottagen' (kryssets
  // av-bock + test-teardown). Tabell per NAMN (ADR-050 bas-portabilitet).
  'mark-final-payment-paid': {
    tableId: 'Anmälningar',
    allowedFields: ['Slutbetalning'],
  },
  // Notering per BETALNING (task-18.8; ADR-063 additiva fält — påminnelse-/
  // noterings-vägvalet öppet bokfört i kortet). EXAKT de två additiva
  // multilineText-fälten (staging: fldy4fFMx0iOjZVpi/fldQIV1mOyjTtJWDn,
  // skapade additivt 2026-07-22 — skrivbara per konstruktion, L294); gamla
  // odelade 'Notering' (fldPMsiRoLWcgUbsv) ligger MEDVETET utanför listan —
  // den rörs aldrig av appen (bas-maximeringen T16 äger ev. migrering).
  // Tabell per NAMN (ADR-050 bas-portabilitet).
  'update-registration-payment-note': {
    tableId: 'Anmälningar',
    allowedFields: ['Notering anmälningsavgift', 'Notering slutbetalning'],
  },
  // Påminnelselogg per BETALNING (task-18.8): senaste påminnelse-tidsstämpeln
  // per betalning — basens utskicks-grammatik (Bekräftelse skickad-klassen).
  // EXAKT de två additiva dateTime-fälten (staging: fldohZk9EAp59XbMf/
  // fld49lOLga7U0WWYR, skapade additivt 2026-07-22 — skrivbara per
  // konstruktion, L294); gamla odelade 'Betalningspåminnelse skickad'
  // (fldE0cR4r9vI0rKiL) MEDVETET utanför listan (samma T16-avgränsning som
  // noteringen). null-värde RENSAR fältet (Airtable-PATCH-semantik) —
  // teardown-vägen för test-fixturer. Tabell per NAMN (ADR-050).
  'log-payment-reminder': {
    tableId: 'Anmälningar',
    allowedFields: ['Påminnelse anmälningsavgift skickad', 'Påminnelse slutbetalning skickad'],
  },
  // Bekräfta en anmälan (task-18.6, PRD task-18 beslut 7) — bekräftelsemailet (mail 1)
  // OCH status-flippen är EN operation server-side. send-registration-confirmation-EF:en
  // bygger `fields` SERVER-SIDE ur den UPPLÄSTA anmälan (klienten skickar bara record-ID:n)
  // — listan är därför en SSOT-grind mot framtida kod-drift, ej en klient-nåbar deny-yta.
  // EXAKT två fält: 'Status' (fldWr5cCPNx9HEKtL, singleSelect → 'Bekräftad (mail skickat)')
  // och 'Bekräftelse skickad' (fld0jnbkIbuFAumgG, dateTime) — BÅDA befintliga och
  // LIVE-VERIFIERADE mot staging-schemat (describe_table tbloOcrppVoyrHbrq 2026-07-22, L294)
  // INNAN posten låstes; INGA nya bas-fält behövdes för denna vertikal. Betalfälten och
  // gamla odelade 'Notering' ligger MEDVETET utanför listan. Tabell per NAMN (ADR-050).
  'send-registration-confirmation': {
    tableId: 'Anmälningar',
    allowedFields: ['Status', 'Bekräftelse skickad'],
  },
  // Bor över-markeringen per anmälan (task-18.7, PRD task-18 beslut 8 —
  // eventsidans kryss-läge). EXAKT ett fält: 'Bor över' (fldGYYNnQi7XlfbhP,
  // checkbox), ADDITIVT skapat i STAGING 2026-07-22 och skrivbarheten
  // LIVE-VERIFIERAD (PATCH + läs-tillbaka) INNAN posten låstes (L294).
  // Allowlisten gatar FÄLTET, inte värdet — samma operation kryssar i och ur
  // (och är därmed test-teardownens väg). Eventets bor över-ANTAL härleds
  // ALLTID ur dessa kryss; något lagrat räknefält finns medvetet inte och kan
  // därför inte heller skrivas. ⚠️ PROD-fältet är INTE skapat — hård
  // prod-deploy-förutsättning (fält FÖRE EF, per miljö; data-model.md §Kända
  // fällor 37). Tabell per NAMN (ADR-050 bas-portabilitet).
  'set-registration-lodging': {
    tableId: 'Anmälningar',
    allowedFields: ['Bor över'],
  },
  // Spara fri-text-anteckning på en Person (Fas 6a L6, Session 23). Skrivbart
  // multilineText-fält (fldWGlNr3ujRHo85w, data-model.md § Personer — write-fält);
  // Synk-gate 2 beviljad av Marcus. Tabell per NAMN (ADR-050 bas-portabilitet);
  // Airtable-fält-NAMN 'Anteckningar' (versal A).
  'update-person-note': {
    tableId: 'Personer',
    allowedFields: ['Anteckningar'],
  },
  // Skapa en manuell anmälan (Fas 6c Leverabel 4, create-registration-EF; facit-
  // formen kompletterad till SEX fält i task-18.12 — 'Antal platser' + 'Notering').
  // Till skillnad mot update-operationerna ovan bygger EF:en `fields` SERVER-SIDE
  // ur typade inputs (fornamn/efternamn/e-post/telefon/antalPlatser/notering/eventId)
  // — listan är därför en SSOT-grind mot framtida kod-drift (om EF:en någon gång skulle
  // försöka skriva ett fält utanför listan → findDisallowedField fäller före Airtable-
  // anropet), ej en klient-nåbar deny-yta. Endast skrivbara create-fält (data-model.md
  // § Anmälningar write-fält); formel/rollup (Namn/Normaliserad e-post/Är aktiv) ALDRIG.
  // Länk-fältets NAMN är 'Event' (live-schema fldi3enUaMdbuGSlm, ej "Event-länk"). Person-
  // länk EJ med — den delegeras till A2 (data-model.md rad 204). 'Antal platser'
  // (flduwoTPdI8elSNyD, number) + 'Notering' (fldPMsiRoLWcgUbsv, multilineText) är
  // BEFINTLIGA skrivbara fält, LIVE-VERIFIERADE mot staging-schemat (describe_table
  // tbloOcrppVoyrHbrq, base apphjj8Q7lkXCMsL4, 2026-07-23, L294) INNAN posten låstes —
  // inga nya bas-fält behövdes. Tabell per NAMN (ADR-050).
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
      'Notering',
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
  // 'Publicerad på miranon.se' (task-19.4, ADR-066-tillägget) är PUBLICERINGSFLAGGAN som
  // skapa-sidans dra-till-bekräfta-handtag armerar. ADDITIVT checkbox-fält, live-verifierat
  // mot STAGING-schemat (tblVE3UKWl1CKrphV, fält `fldyJKnJCP1brHwL6`, skapat 2026-07-22 —
  // skrivbart per konstruktion, L294) INNAN posten låstes; namnet är EXAKT Airtable-fältnamnet.
  // ⚠️ PROD-fältet är INTE skapat — hård prod-deploy-förutsättning (fält FÖRE EF, per miljö;
  // samma ordning som 'Idempotensnyckel', data-model.md §Kända fällor 37). EF:en skriver
  // fältet ENDAST när flaggan är ARMERAD; oarmerat utelämnas det ur fields-mapen (ett skrivet
  // `false` skulle SÄTTA checkboxen till omarkerad — utelämnande är formen för "osatt").
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
      'Publicerad på miranon.se',
      'Idempotensnyckel',
    ],
  },
  // Uppdatera ett BEFINTLIGT event i Eventplanering (task-18.1, PRD task-18 beslut 2–3 —
  // eventsidans Om eventet-Ändra; Beläggningens Ändra [task-18.2] återanvänder operationen
  // för K16-modellens tre skrivbara: maxPlatser + reserverade/'Extra platser' +
  // manuelltTillagda/'Manuella platser').
  // update-event-EF:en bygger `fields` SERVER-SIDE ur typade inputs (typ/ort/startdatum/
  // slutdatum/status/maxPlatser/reserverade/manuelltTillagda) — listan är därför en SSOT-grind
  // mot framtida kod-drift (om EF:en någon gång skulle försöka skriva ett fält utanför listan →
  // findDisallowedField fäller före Airtable-anropet), ej en klient-nåbar deny-yta.
  // Skrivbarheten LIVE-VERIFIERAD mot staging-schemat (tblVE3UKWl1CKrphV) 2026-07-21 INNAN
  // posterna låstes (L294; 18.1-passet + 18.2:s describe_table-pull): Typ/Status singleSelect ·
  // Ort singleLineText · Startdatum/Slutdatum date · Max antal platser number · Extra platser
  // number (fldIHwVr8Wq5tp4o6) · Manuella platser number (fld8pUb6x2G3YIovs) · Månad/år
  // singleSelect — inga formel-/rollup-fält. 'Månad/år' sätts ALDRIG av klienten:
  // den OMHÄRLEDS server-side ur nya Startdatum (ADR-066 b6-arvet — en datum-edit får inte
  // drifta basens manuella Månad/år). System-genererade (EventKey/Event-nr) + formel/rollup/
  // lookup + spegel/länk-fält sätts ALDRIG. Tabell per NAMN (ADR-050 bas-portabilitet).
  'update-event': {
    tableId: 'Eventplanering',
    allowedFields: [
      'Typ',
      'Ort',
      'Startdatum',
      'Slutdatum',
      'Månad/år',
      'Max antal platser',
      'Extra platser',
      'Manuella platser',
      'Status',
      // Auto-utskickets två ADDITIVA fält (task-18.6, PRD task-18 beslut 14; ADR-063):
      // 'Deltagarinfo schemalagd' (fldB4rk2VZcm4GdxY, date ISO) + 'Deltagarinfo
      // auto-utskick avstängt' (fldPrSKNUTJpJqctw, checkbox) — skapade additivt i
      // STAGING 2026-07-22 och skrivbarheten LIVE-VERIFIERAD (PATCH + rensning) INNAN
      // posterna låstes (L294). Basens ord 'Deltagarinfo' (UI-ordet är eventinfo,
      // ORDLISTA). null på date-fältet RENSAR (Airtable-PATCH-semantik) — krysset
      // styr dem, utskicks-MOTORN ligger utanför kortet.
      'Deltagarinfo schemalagd',
      'Deltagarinfo auto-utskick avstängt',
    ],
  },
  // Bulk-mail på segment → revisionsrad i Utskickslogg (Fas 6h, ADR-067 D7 — repots
  // fjärde write-vertikal). send-email-EF:en bygger `fields` SERVER-SIDE ur typade inputs
  // (amne/mailtext/accepterade Personers record-ID/filter-snapshot/jobId) — listan är en
  // SSOT-grind mot framtida kod-drift, ej en klient-nåbar deny-yta. Endast live-introspekterade
  // skrivbara fält (data-model.md § Utskickslogg, L0): 'Namn på utskick' (singleLineText),
  // 'Skickat till' (multipleRecordLinks → Personer), 'Filter snapshot' (multilineText),
  // 'Mailutskick copy' (singleLineText), 'Utskicks-ID' (valfri länk → Bulkutskick; ej satt i
  // 6h-scope men allowlistad). 'Idempotensnyckel' (fldgB4EWDIksNCvN2, L2a-skapad) MÅSTE vara
  // med — EF:en skriver det server-side som merge-nyckel för upserten (ADR-067 D4b); annars
  // fäller findDisallowedField vår egen skrivning. Formel/auto (Antal skickade/Datum/Antal
  // öppnade mail/Öppningsgrad) ALDRIG. Tabell per NAMN (ADR-050 bas-portabilitet).
  'send-email': {
    tableId: 'Utskickslogg',
    allowedFields: [
      'Namn på utskick',
      'Skickat till',
      'Filter snapshot',
      'Mailutskick copy',
      'Utskicks-ID',
      'Idempotensnyckel',
    ],
  },
  // Skapa en anteckning i eventets ström (task-18.11, PRD task-18 beslut 13; ADR-075 —
  // egen ADR: attribuerings-avvägningen additiv tabell vs Airtable record comments).
  // create-event-note-EF:en bygger `fields` SERVER-SIDE ur typad input (text) plus
  // FÖRFATTAREN ur den verifierade JWT:ns user_metadata.display_name (aldrig klient-
  // buren — spoof-säker attribution) och Event-länken ur eventId — listan är därför en
  // SSOT-grind mot framtida kod-drift (findDisallowedField fäller ett fält utanför
  // listan före Airtable-anropet), ej en klient-nåbar deny-yta. EXAKT de tre skrivbara
  // fälten i den ADDITIVA Anteckningar-tabellen (staging tbl87a23xDv19Mb6R, skapad
  // additivt 2026-07-23; skrivbarheten LIVE-VERIFIERAD via create+läs-tillbaka+radera
  // INNAN posten låstes, L294): 'Författare' (singleLineText, primär), 'Anteckning'
  // (multilineText), 'Event' (multipleRecordLinks → Eventplanering). Tidpunkten sätts av
  // Airtables createdTime (aldrig ett skrivet fält). ⚠️ PROD-tabellen är INTE skapad —
  // hård prod-deploy-förutsättning (tabell FÖRE EF, per miljö; ADR-050/ADR-063).
  // Tabell per NAMN (ADR-050 bas-portabilitet).
  'create-event-note': {
    tableId: 'Anteckningar',
    allowedFields: ['Författare', 'Anteckning', 'Event'],
  },
  // Skapa en bilage-metadatarad (TASK-146.4, PRD task-146 "Bilage-fundamentet";
  // ADR-057 lager-oberoendet). upload-attachment-EF:en (mönster 1) och
  // finalize-attachment-upload-EF:en (mönster 2) bygger BÅDA `fields`
  // SERVER-SIDE ur bytes/lagringens FAKTISKA tillstånd (Namn/'Storlek (bytes)'
  // ur den verifierade filen, ALDRIG ett klient-påstått tal; Skapad ur
  // `new Date().toISOString()`; Event ur det redan event-existens-verifierade
  // `eventId`) — listan är därför en SSOT-grind mot framtida kod-drift, ej en
  // klient-nåbar deny-yta. EXAKT de fyra fälten i den ADDITIVA Bilagor-tabellen
  // (staging tblFamrna53MVf1nG, skapad additivt av
  // scripts/create-bilagor-table.mjs, TASK-146.2 #855; skrivbarheten är
  // konstruktions-given — tabellen skapades FÖR denna skrivning, ingen
  // separat live-verifiering behövdes): 'Namn' (singleLineText, primär),
  // 'Storlek (bytes)' (number), 'Skapad' (dateTime — manuellt satt, INTE
  // Airtables createdTime, se scripts/create-bilagor-table.mjs § "Skapad"),
  // 'Event' (multipleRecordLinks → Eventplanering). ⚠️ PROD-tabellen är INTE
  // skapad — hård prod-deploy-förutsättning (tabell FÖRE EF, per miljö;
  // ADR-050/ADR-063, samma mönster som create-event-note). Tabell per NAMN
  // (ADR-050 bas-portabilitet).
  'create-attachment': {
    tableId: 'Bilagor',
    allowedFields: ['Namn', 'Storlek (bytes)', 'Skapad', 'Event'],
  },
  // Åtgärdsutskickens sändväg (TASK-147.1, ADR-067-revisionen — repots sjunde
  // write-vertikal, tredje mail-vertikal). send-action-email-EF:en bygger `fields`
  // SERVER-SIDE ur den UPPLÄSTA anmälan + den fasta per-åtgärdstyp-mappningen i
  // _shared/send-action-email.ts:s `stampFieldsFor` (klienten skickar bara
  // registration-ID:n) — listan är därför en SSOT-grind mot framtida kod-drift, ej
  // en klient-nåbar deny-yta. UNIONEN av allt de FYRA åtgärdstyperna kan skriva:
  // 'Status' + 'Bekräftelse skickad' (bekräftelse — EXAKT send-registration-
  // confirmations par, ORDLISTA: Bekräftad ⟺ bekräftelsen skickad), 'Deltagarinfo
  // skickad' (eventinfo, fld3WBS0QQrqLpYtK — samma fält AtgardsSida.tsx redan
  // LÄSER som `reg.deltagarinfoSkickad`), 'Påminnelse anmälningsavgift skickad' +
  // 'Påminnelse slutbetalning skickad' (paminnelse — de TVÅ additiva fälten
  // task-18.8 skapade; src/data/mutations/registrationPayments.ts:s
  // `useLogPaymentReminder`-docblock pekar UTTRYCKLIGEN ut dem som målet för "ett
  // framtida server-side-utskick" — detta ÄR den ersättningen, mailto-vägen rörs
  // inte här). 'fritt' skriver INGET fält (mailet ensamt är hela handlingen).
  // Gamla odelade 'Betalningspåminnelse skickad' rörs MEDVETET aldrig (samma
  // T16-avgränsning som log-payment-reminder ovan). Tabell per NAMN (ADR-050).
  'send-action-email': {
    tableId: 'Anmälningar',
    allowedFields: [
      'Status',
      'Bekräftelse skickad',
      'Deltagarinfo skickad',
      'Påminnelse anmälningsavgift skickad',
      'Påminnelse slutbetalning skickad',
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
