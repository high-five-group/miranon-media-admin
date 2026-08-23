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
  // Spara Lottas fritext-flagga på en Person (S103, Marcus 2026-08-10 GO —
  // ordagrant: "det ska vara en flagga som Lotta själv skriver i fritext, som
  // sedan blir en flaggikon på personen då möjligtvis"). Skrivbart singleLineText
  // -fält 'Flagga' (staging fldCXSGQJEVlf1Sa7, prod fldsNDwACc8hWDPeA) — NYTT
  // 2026-08-10, LIVE-VERIFIERAT via describe_table INNAN posten låstes (L294).
  // Ersätter 'Manuella flagga' (fldNtwQt6tOCIdf4f, singleSelect med choices=[] —
  // kunde aldrig sättas, data-model.md §Kända fällor 25); det gamla fältet rörs
  // ALDRIG av denna operation och lämnas kvar tomt (Airtables Meta-API kan varken
  // ändra fälttyp eller radera fält). Tabell per NAMN (ADR-050 bas-portabilitet).
  'update-person-flag': {
    tableId: 'Personer',
    allowedFields: ['Flagga'],
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
  // 'Kursfamilj'/'Kursnivå' (TASK-249.4, ADR-115) — basdimensionerna som stänger den
  // dokumenterade skapelseväg-kanten (data-model.md § "Staging- och prodbasens additiva
  // tillskott 2026-08-17" — "skapelsevägarna sätter INTE fälten än"). BÅDA fälten
  // ADDITIVA singleSelect, skapade staging FÖRST och därefter prod (samma leverans som
  // backfillen, LIVE-VERIFIERADE via mcp__airtable__list_records 2026-08-17 INNAN denna
  // post låstes). EF:en härleder dem SERVER-SIDE ur kursnamnet via
  // `_shared/course-dimensions.ts`s kursnamnsmappning (EXAKT samma mappning som
  // backfillens källa, prototypens KURS_KARTA) — klienten skickar dem ALDRIG. Kursnivå
  // UTELÄMNAS för nivålösa familjer (Fjärrskådning/Psionautics) OCH för okänt kursnamn
  // (öppet, aldrig gissat — modulens docblock).
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
      'Kursfamilj',
      'Kursnivå',
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
  // Skapa en anteckning i PERSONENS ström (S103, T97-bygg-spåret) — ADR-075:s
  // tabell UTÖKAD med ett Person-länkfält (staging fldXvBRt7OE9tem4o, prod
  // fldJiWGXe2Hv612H0; NYTT 2026-08-10, LIVE-VERIFIERAT via describe_table).
  // create-person-note-EF:en speglar create-event-note:s SÄKERHET OCH ATTRIBUTION
  // exakt (server-side FÖRFATTARE ur JWT:ns user_metadata.display_name — ADR-075,
  // aldrig klient-buren) mot SAMMA additiva tabell, bara med Person i stället för
  // Event. INVARIANTEN (kritisk, testad): en Anteckningar-rad bär Event ELLER
  // Person, ALDRIG båda — denna operation sätter ENDAST Person, aldrig Event.
  // EXAKT de tre skrivbara fälten: 'Författare' (singleLineText, primär),
  // 'Anteckning' (multilineText), 'Person' (multipleRecordLinks → Personer).
  // Tidpunkten sätts av Airtables createdTime (aldrig ett skrivet fält). ⚠️ Den
  // omvända länken på Personer heter 'Anteckningar 2' — INTE 'Anteckningar' —
  // eftersom Personer redan bar ett fält med det namnet (fldWGlNr3ujRHo85w, det
  // gamla odelade fritext-fältet); Airtable döper kollisionen om automatiskt
  // (staging fldgz1pFKGs0a3np0, prod fldkEnLpYjB9tsAtQ, LIVE-VERIFIERAT). Läses
  // av get-person-notes (som konsumerar just 'Anteckningar 2'). ⚠️ PROD-fältet
  // Person finns (skapat 2026-08-10), men PROD-EF-deployen av get-person-notes/
  // create-person-note är en SEPARAT Marcus-auktoriserad handling (samma ordning
  // som create-event-note). Tabell per NAMN (ADR-050 bas-portabilitet).
  'create-person-note': {
    tableId: 'Anteckningar',
    allowedFields: ['Författare', 'Anteckning', 'Person'],
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
  // 'Lagringsnyckel' (TASK-147.5, additiv) — storage-objektets leaf-namn,
  // skrivet av upload-attachment/finalize-attachment-upload/generate-event-
  // attachment vid radskapelse. Server-internt (aldrig i den publika
  // Attachment-domänformen); krävs för att den bilage-bärande sändvägen ska
  // kunna hämta rätt bytes tillbaka (Namn ensamt är tvetydigt — se
  // scripts/create-bilagor-table.mjs § Lagringsnyckel för instansen).
  // 'Dokumentklass' (TASK-147.12, additiv singleSelect, staging
  // fldr2CwboZ3M4USCX) — upload-attachment/finalize-attachment-upload
  // skriver 'Uppladdad' (klass A), generate-event-attachment skriver
  // 'Event-mallad' (klass B). Optionsnamnen speglas i
  // src/domain/types/Status.ts AttachmentClass OCH i
  // _shared/attachments.ts ATTACHMENT_CLASS_* (Deno↔Vite-dubblering, samma
  // mönster som BILAGOR_BUCKET_ID) — skrivande EF:er importerar dessa
  // konstanter, skriver aldrig en bokstavlig sträng inline.
  // 'Räckvidd'/'Kursfamilj'/'Kursnivå' (TASK-275.2, ADR-118, additiva
  // singleSelect — staging fldU6i9Ju5HRwSRBf/fldiJnZk66jlkUiX8/
  // fldep25m32Q3Cjh41, prod fldsEltfGx3y63hhF/fld8Mc23OdJXFSBEx/
  // fldMAGsqnQ4ddFmaI, task-275.1, LIVE-VERIFIERADE mot BÅDA baserna INNAN
  // denna post låstes — data-model.md § "Staging- och prodbasens additiva
  // tillskott 2026-08-17 (task-275.1...)"). upload-attachment/finalize-
  // attachment-upload bygger dem SERVER-SIDE ur `_shared/attachments.ts`s
  // `buildScopeFields`, redan strikt Zod-validerade
  // (AttachmentScopeInputSchema) INNAN de når `fields` — listan är därför
  // en SSOT-grind mot framtida kod-drift, ej en klient-nåbar deny-yta,
  // exakt samma form som 'Dokumentklass' ovan. `Event` FÖRBLIR satt även
  // för Kurstyp/Alla event-räckvidd (medveten avgränsning, TASK-275.2 §
  // slutrapport — bär storage-path-ankaret och delete-attachment/get-
  // attachment-download-urls befintliga ägarskaps-mekanik oförändrade;
  // olycksskyddet mot radering ur eventkontext avgörs av `Räckvidd`, inte
  // av `Event`s när/om-satthet).
  'create-attachment': {
    tableId: 'Bilagor',
    allowedFields: [
      'Namn',
      'Storlek (bytes)',
      'Skapad',
      'Event',
      'Lagringsnyckel',
      'Dokumentklass',
      'Räckvidd',
      'Kursfamilj',
      'Kursnivå',
      // [TASK-309.4, ADR-125 § Beslut 3] Mall-genererade bilagor (Event-
      // mallad) bär numera VILKEN mall som byggde dem och en hash av
      // ifyllnadsunderlaget (härledd inaktualitet). Samma operationsnyckel
      // återanvänds för ersatt-läget (updateAirtableRecord PATCH) — en
      // OperationDef gatar FÄLTET, inte om anropet är POST eller PATCH.
      'Mall',
      'Källhash',
    ],
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
  // Kvittoserien (TASK-147.7, ADR-109) — send-receipt-email-EF:en bygger `fields`
  // SERVER-SIDE i TVÅ steg mot SAMMA rad, båda gated av DENNA operation
  // (samma "en operation, unionen av vad den kan skriva över sin livscykel"-
  // form som 'send-action-email' ovan): (1) reservationen
  // (`_shared/receipt-numbering.ts` § allocateReceiptNumber, ENDAST
  // 'Kvittonummer'/'Löpnummer'/'År' — allokeringen känner ännu inte till
  // mottagaren), (2) finaliseringen EFTER accepterad sändning
  // (`_shared/send-receipt.ts` § ReceiptFinalizer, resten av unionen). En
  // FÖRLORAD allokerings-kandidat (samtidighets-racet) och en AVVISAD
  // sändning lämnar BÅDA en rad med ENDAST steg 1:s tre fält satta — det är
  // den öppet accepterade konsekvensen (ADR-109 § Öppna punkter), inte ett
  // fel. Additiv tabell (staging tblk8fZcArXPpRYnX, skapad additivt via
  // Airtable MCP 2026-08-10, deklarativ hemvist
  // scripts/create-kvitton-table.mjs — samma mönster som
  // scripts/create-bilagor-table.mjs). ⚠️ PROD-tabellen är INTE skapad —
  // hård prod-deploy-förutsättning (tabell FÖRE EF, per miljö; ADR-050/
  // ADR-063). Tabell per NAMN (ADR-050 bas-portabilitet).
  'create-receipt': {
    tableId: 'Kvitton',
    allowedFields: [
      'Kvittonummer',
      'Löpnummer',
      'År',
      'Anmälan',
      'Betalning',
      'Belopp',
      'Betalsätt',
      'Kundnamn',
      'Event',
      'Skickad',
      'Lagringsnyckel',
    ],
  },
  // Sätt närvarostatus på ett Deltagande (check-in-vertikalen, TASK-214.1). Dörrens BINÄRA
  // toggle (Ej avstämt ↔ Närvarande) OCH registrets fyra övriga statusvärden går
  // genom SAMMA operation — allowlisten gatar FÄLTET, inte VÄRDET (samma princip
  // som set-registration-lodging kryssar både i och ur, och som bär teardownen i
  // testet). EXAKT ETT fält: 'Status' (fldRFOzNqVswqZ1mN, singleSelect med sex
  // options), LIVE-VERIFIERAT mot staging-schemat (describe_table tbldWHH6sSHWoQPHH,
  // base apphjj8Q7lkXCMsL4, 2026-08-14, TASK-214.1) INNAN posten låstes.
  // 'Avstämt' (fld61tbzc2fqqf116) ligger MEDVETET utanför listan: automation A8
  // (wfl1iYPrEmlKpEsRU, deployed) triggar på ÄNDRING AV JUST Status och sätter
  // fältet själv — två skribenter på samma fält vore en kapplöpning appen inte kan
  // vinna. Identitets-/strukturfälten (Anmälan, Event, Session, Person (länk)) är
  // skrivbara men ligger utanför: de ÄGS av A3/A11 och att skriva dem vore att
  // om-föräldra raden, inte att checka in någon. 'Noteringar' är skrivbart men hör
  // till registret, inte dörren — läggs till när en yta faktiskt skriver det.
  // Tabell per NAMN (ADR-050 bas-portabilitet). Förarbete: S90-bilagan
  // (tasks/sessions/bilagor/s90-checkin-forarbete/skarpt-underlag.md § 1.2).
  'set-attendance-status': {
    tableId: 'Deltaganden',
    allowedFields: ['Status'],
  },
  // Skapa en Deltaganden-rad atomärt när dörren möter en anmälan utan förskapad
  // rad (TASK-214.1, PRD task-214 — backup-vägen för dörr-ögonblicket; rotorsaken
  // (anmälningar utan Person-länk) läks i basen via task-213.12, en separat skiva).
  // create-attendance-EF:en bygger `fields` SERVER-SIDE ur typade inputs
  // (anmalanId/eventId/session) — listan är därför en SSOT-grind mot framtida
  // kod-drift (findDisallowedField fäller ett fält utanför listan före Airtable-
  // anropet), ej en klient-nåbar deny-yta. EXAKT de fyra write-fälten
  // (data-model.md § Deltaganden write-fält): 'Anmälan' (fldwQdDpRK8vByNhb, länk),
  // 'Event' (fldaj5mbpU3yPw2np, länk), 'Session' (fldBPZnsDL0bNIRHx, singleSelect)
  // och 'Status' (fldRFOzNqVswqZ1mN, EF:en sätter alltid 'Närvarande' — check-in
  // är den enda anledningen denna EF finns). 'Person (länk)' sätts ALDRIG här —
  // den ägs av automationen A11 (samma avgränsning som set-attendance-status ovan).
  // 'Avstämt' MEDVETET utanför listan av samma skäl (A8 äger fältet). Tabell per
  // NAMN (ADR-050 bas-portabilitet).
  'create-attendance': {
    tableId: 'Deltaganden',
    allowedFields: ['Anmälan', 'Event', 'Session', 'Status'],
  },
  // Eventlänkens vakt — resolution (TASK-284.3, ADR-122 beslut 7). Kopplar om
  // en anmälan vars `Eventmatchning` är 'Avviker' eller 'Utan event' till rätt
  // event, direkt i appen. EXAKT DE TVÅ fälten skrivs i SAMMA skrivning:
  // 'Event' (fldi3enUaMdbuGSlm, multipleRecordLinks → Eventplanering) OCH
  // 'EventKey' (fldPlPLkpqm0X7Xs2, multilineText, "Event-N") — matchningssteget
  // (A1, TASK-284.2) kör vid varje radskapande och kan annars nollställa en
  // länk satt på annat håll; att skriva båda gör operationen idempotent
  // (samma form som create-registration redan använder för samma par).
  // Klienten bär `EventKey`-STRÄNGEN (get-events levererar `eventKey`, task-18.1)
  // — update-record är en generisk pass-through-EF utan server-side härledning
  // (till skillnad från create-registration/create-event), så allowlisten
  // gatar FÄLTEN, inte källan till värdet. BÅDA fälten LIVE-VERIFIERADE mot
  // staging-schemat (describe_table tbloOcrppVoyrHbrq, 2026-08-21) och
  // rundturs-provade (skriv → Eventmatchning blev 'OK' synkront → Event:[]/
  // EventKey:null återställde exakt ursprungsraden) INNAN posten låstes.
  // Tabell per NAMN (ADR-050 bas-portabilitet).
  'relink-registration': {
    tableId: 'Anmälningar',
    allowedFields: ['Event', 'EventKey'],
  },
  // Bilagornas skrivvägar (TASK-309.3, ADR-125 § 2–3). Fyra operationer,
  // tre EF:er — `save-place-standard` skriver TVÅ tabeller i samma request
  // (Platser-raden + Eventplanerings länk/kopia-rensning) och registrerar
  // därför TVÅ operationer, en per tabell, i stället för att låta EN
  // OperationDef (som bär exakt ETT tableId) täcka två.
  //
  // Eventets EGNA (bilagetext)-kopia (AC #1, `save-event-text`). EXAKT de
  // 17 (bilagetext)-fälten (data-model.md § Bilagornas datamodell, ADR-125
  // § 2) — LIVE-VERIFIERADE staging-fält-ID:n står i den tabellen, inte
  // upprepade här. `null` i write-inputen RENSAR (text → '', datumet →
  // `null` direkt) — se `save-event-text/index.ts` för rensnings-formen.
  'save-event-text': {
    tableId: 'Eventplanering',
    allowedFields: [
      'Tid (bilagetext)',
      'Pris (bilagetext)',
      'Anmälningsavgift (bilagetext)',
      'Resterande belopp (bilagetext)',
      'Sista betalningsdag (bilagetext)',
      'Beskrivning (bilagetext)',
      'Förberedelser (bilagetext)',
      'Tag med (bilagetext)',
      'För dig som röker (bilagetext)',
      'Parfym och kosmetika (bilagetext)',
      'Mat/fika (bilagetext)',
      'Övernattning (bilagetext)',
      'Utrustning (bilagetext)',
      'Adress (bilagetext)',
      'Parkering (bilagetext)',
      'Transport (bilagetext)',
      'Kläder (bilagetext)',
    ],
  },
  // "Spara som platsens standard" (AC #2, Del 2 § D beslut 6) — Platser-
  // radens EGNA fyra fält (utan (bilagetext)-suffix). `Namn` sätts ENDAST
  // vid FÖDELSEN av en ny Platser-rad (Ort-namnet saknade en) — se
  // `save-place-standard/index.ts`.
  'save-place-standard-plats': {
    tableId: 'Platser',
    allowedFields: ['Namn', 'Adress', 'Parkering', 'Transport', 'Kläder'],
  },
  // "Spara som platsens standard", eventsidan (AC #2) — länkar eventets
  // `Plats` till den (ev. nyfödda) Platser-raden OCH rensar (sätter '')
  // eventets EGEN (bilagetext)-kopia för EXAKT de block som sparades som
  // standard (beslut 6: "så standarden gäller"). `Ort` ligger MEDVETET
  // UTANFÖR — beslut 8: "Ort rörs aldrig".
  'save-place-standard-event': {
    tableId: 'Eventplanering',
    allowedFields: [
      'Plats',
      'Adress (bilagetext)',
      'Parkering (bilagetext)',
      'Transport (bilagetext)',
      'Kläder (bilagetext)',
    ],
  },
  // Eventinnehållets standardtexter (AC #3, `save-event-content`) — de TOLV
  // egna textfälten PLUS `Namn` (plattformsväggen, data-model.md §
  // Bilagornas datamodell: `Namn` är singleLineText, inte en levande
  // formel — skrivvägen sätter `Namn = "<Event> · <Typ>"` VID VARJE
  // skrivning, ADR-125 § Updates 2026-08-23). `Event`/`Typ` ligger MEDVETET
  // UTANFÖR — de är radens fasta identitet (singleSelect, Meta-API-satta
  // vid seedningen) och redigeras aldrig via denna operation.
  'save-event-content': {
    tableId: 'Eventinnehåll',
    allowedFields: [
      'Namn',
      'Tid',
      'Pris',
      'Anmälningsavgift',
      'Resterande belopp',
      'Beskrivning',
      'Förberedelser',
      'Tag med',
      'För dig som röker',
      'Parfym och kosmetika',
      'Mat/fika',
      'Övernattning',
      'Utrustning',
    ],
  },
  // Agendapunkter-radernas skrivning (AC #1 + AC #3, delad av BÅDA EF:erna
  // via `_shared/agendapunkter.ts` § replaceAgendaForDag — SSOT-kontrollen
  // körs EN gång där, inte duplicerad i varje EF). `Event`/`Eventinnehåll`
  // står BÅDA här eftersom operationen är delad — varje ENSKILT anrop
  // sätter bara EN av dem (ADR-125 § 2: "hör till EXAKT EN förälder"); den
  // invarianten vaktas av skrivvägens kod (`replaceAgendaForDag`s
  // `parentField`-parameter), inte av allowlisten (som bara gatar FÄLTEN,
  // inte kombinationer av dem — samma princip som `set-attendance-status`
  // ovan).
  'save-agendapunkter': {
    tableId: 'Agendapunkter',
    allowedFields: ['Text', 'Dag', 'Ordning', 'Tid', 'Meditation', 'Eventinnehåll', 'Event'],
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
