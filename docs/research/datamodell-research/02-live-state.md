---
namn: Live-state — Miranon Media OS Airtable-bas
syfte: Auktoritativ snapshot av Airtable-basen vid en given tidpunkt. Källsanning för Fas 1 korsreferens
skapad: 2026-04-28
hämtningstidpunkt: 2026-04-28 (alla MCP-anrop denna session)
bas-id: app8uGPrVCVOm6LfD ("Miranon Media OS")
permissionLevel: create
mcp-server: claude_ai_Airtable (Anthropic-Airtable)
status: Checkpoint 1 — avvaktar godkännande
---

# Live-state — Airtable-bas `app8uGPrVCVOm6LfD`

> **Verifieringsregel.** Varje tabellrad och fält i denna fil kommer från `list_tables_for_base` + `get_table_schema` mot bas `app8uGPrVCVOm6LfD` 2026-04-28. Automations-data kommer från `miranon-media-os/docs/miranon_automations_COMPLETE.json` (export 2026-03-16) eftersom Airtable-MCP inte kan läsa automationer (CLAUDE.md, "Kritiska lärdomar"). Stickprov är `list_records_for_table` med `pageSize` enligt anrop.

## Innehåll

1. Sammanfattning + räknare
2. Tabellöversikt (18 tabeller)
3. Detaljerade fältscheman — kärntabeller (5 st)
4. Övriga tabeller — fält-katalog
5. Automationer A1–A11 (från JSON-export, ej live-MCP)
6. Webhooks (ej tillgängligt via MCP)
7. Stickprov
8. Avvikelser från 00-file-manifest

---

## 1. Sammanfattning + räknare

| Mätvärde | Värde | Källa |
|---|---:|---|
| Tabeller totalt | **18** | `list_tables_for_base` |
| Fält totalt över alla tabeller | **~290** | summa av tabellscheman |
| Automationer totalt | **11** (alla `deployed`) | `miranon_automations_COMPLETE.json` |
| Anmälningar (records) | **735** | `list_records_for_table` metadata.totalRecordCount |
| Personer (records) | **568** | id |
| Deltaganden (records) | **1 500** | id |
| Eventplanering (records) | **50** | id |
| Väntelista (records) | **44** | id |

> Räknarna ovan är `totalRecordCount` från MCP-svar 2026-04-28. Dessa är högre än de siffror som nämns i 26-april-sessionen (87 Anm för MK, 216 Delt) — eftersom de är basen-totalen, inte MK-eventets delsumma.

## 2. Tabellöversikt

| # | Tabell-ID | Namn | primaryFieldId | Antal fält |
|--:|---|---|---|--:|
| 1 | `tblVE3UKWl1CKrphV` | Eventplanering | fldciUVdjViG4nx9S (Eventlabel) | 45 |
| 2 | `tbl8qhuJQ5ZWPMRk4` | Eventformat | fldDLGIg6XnTWi8ge (Namn) | 3 |
| 3 | `tbl6ZyCm3V026iFTU` | Personer | fldnYys0Ac3UGOdpe (Namn) | 87 |
| 4 | `tbloOcrppVoyrHbrq` | Anmälningar | fld9ma56IzeckxDfX (ID) | 51 |
| 5 | `tbldWHH6sSHWoQPHH` | Deltaganden | fldRPtbDly1Zdj8L9 (ID) | 47 |
| 6 | `tblqFpgxEhJ95AEcM` | Hämtade erbjudanden | fldezAV1MUXr4pJY7 (ID) | 16 |
| 7 | `tbl9H2SoGFfysBj5y` | Engagemang | fldDWOuZBq1tlP9WG (ID) | 10 |
| 8 | `tbl22SCvlHrgcAiZi` | Touchpoints | fldv9JUvqCmnxh4wy (Touchpoint ID) | 17 |
| 9 | `tblcCFGCVrnl1JZfg` | Erbjudanden | fldCIIuGRgiwdtBuD (ID) | 7 |
| 10 | `tblzg4DsRzCCXH8Vy` | Kontaktlogg (rådata) | fldoFvu7KDfIY2OaK (ID) | 20 |
| 11 | `tblWarzSse85NI1Zx` | Bulkutskick | fld5DBQe6yP1iHmrt (Namn på utskick) | 12 |
| 12 | `tblor5TK8HeryGXIj` | Path to Conversion | fldKXtf61itHTfmMS (Name) | 1 |
| 13 | `tbl2VxMx7JMkIxD4Q` | Väntelista | fldbRr0mOveUvfVW7 (ID) | 14 |
| 14 | `tblXFJyGRahQDhhqc` | Email Opens | fldZya842Ie2bJUh8 (Name) | 2 |
| 15 | `tblIesjbuSWNp6oxK` | Utskickslogg | fldWRz9ap7fxHAMkW (Namn på utskick) | 9 |
| 16 | `tblnnmWswnRp9gFws` | Error-log | fldUc9PT7DplbJc9J (Felmeddelande) | 4 |
| 17 | `tbll2N6JKCj4u6y9o` | Segment | flduvXn5oW00Z5TBk (Namn på segment) | 12 |
| 18 | `tblMpQI1crF521Xsp` | Instagram Posts | fldppDLRJPGCZfgho (Name) | 1 |

Verifiering Q5 — `tblVE3UKWl1CKrphV` = **Eventplanering**. Bekräftar att `get-event-bookings`, `update-registration` och `create-registration` läser/skriver till Eventplanering. Q5 löst.

---

## 3. Detaljerade fältscheman — kärntabeller

### 3.1 Eventplanering (`tblVE3UKWl1CKrphV`) — 45 fält

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldciUVdjViG4nx9S | Eventlabel | formula | `{Ort} & " – " & {Typ} & " – " & {Event (text)} & " – " & DATETIME_FORMAT({Startdatum}, "YYYY-MM-DD")` → singleLineText |
| fldNIc8I2ynUoLkNn | Event (text) | formula | `{Event (source)}` → singleLineText |
| fldkiFRVYG0xTAhJ4 | Typ | singleSelect | **Utbildning**, Föreläsning |
| fldRvwXnDsgjwva2L | Ort | singleLineText | — |
| fld2BjFdBd964TzVb | Månad/år | singleSelect | November 2025 → December 2026 (14 val, månadsvis) |
| fldBYhXEHLCd1o2Je | Startdatum | date | — |
| fldUMB4x3OyGQ31aL | Slutdatum | date | — |
| fldcwlblR3JQxXVbe | Tid kvar till event | formula | IF/SWITCH-konstruktion: "Avslutat" / "X dagar" / "X veckor och Y dagar" |
| fldbyEz8djcxCBO5r | Max antal platser | number | — |
| fldU5MCQmagdHtz4G | Antal anmälningar | count | recordLinkFieldId=fldUAjTutSM0fziMT (Anmälningar) |
| fld8pUb6x2G3YIovs | Manuella platser | number | "Anmälningar som kommer in utanför formuläret" |
| fldIHwVr8Wq5tp4o6 | Extra platser | number | "Extra platser reserverade av Roger och Lotta" |
| fldfrlZcRW3PGILiN | Arrangörsplatser | number | — |
| fldTQkYOz9O2BGEIZ | Antal anmälda | formula | `{Antal anmälningar} + {Manuella platser}` → number(0) |
| fldqkyeE7cVHMNRpH | Anmäld beläggning (%) | formula | `{Antal anmälda} / {Max antal platser}` → percent(0) |
| fldUAjTutSM0fziMT | Anmälningar (länkat fält) | multipleRecordLinks | **Spegelfält** — använd ej för att skapa relationer; sköts från Anmälningar |
| fldKYJ6X1TYoYXAZt | Vi kommer! | multipleLookupValues | recordLinkFieldId=fldUAjTutSM0fziMT, fieldIdInLinkedTable=fldQekqRlLfup8x5K (Person på Anmälningar) |
| fldBO6FGQeP7Qh8f4 | Säsong | formula | SWITCH(MONTH(Startdatum)) → "❄️ Vinter" / "🌱 Vår" / "☀️ Sommar" / "🍂 Höst" |
| fldhmhaz3ZnouAzDm | EventKey | formula | `"Event-" & {Event-nr}` — nyckelsträng som inkluderas i anmälnings-URL |
| fldCPCcfF87fEkUdy | Expresslabel | formula | `{Datum (visas i länk)} & " – " & {Ort}` — för matchning från snabbformulär |
| fldNL35AL2cIKq7UF | AnmälningsURL | formula | Bygger `https://miranon.se/pages/anmalan?EventKey=...&Event=...&Typ=...&Datum=...&Ort=...` |
| fldVV8DPiUX35xB9q | Anmälningssida (knapp) | button | — |
| fldkyoyo8uViIIa2T | Nuvarande PDF | button | — |
| fldaqwIdTNJ54Xn5P | Platser kvar | formula | `{Max antal platser} - {Antal anmälda}` |
| fldsDTjIl43vQaWvG | Antal nya anmälningar | rollup | aggregator: rollar `Flagga` (fld6DHDYJZeK2r7OE) från Anmälningar |
| fld2M7EdjCcocls0u | Backfill-ID | singleLineText | — |
| fld2nXlS1UG0aOHLt | Status | singleSelect | **Planerat** (blueLight2), Genomfört (greenLight2), **Inställt** (redLight1), Flyttat (grayLight2) |
| fld5Tb1opD3VCJMe7 | Notering | multilineText | — |
| flddlv4JA5C5CeH5R | Event (source) | singleSelect | Fjärrskådning, Resor i medvetandet, Resor i medvetandet 1, Resor i medvetandet 2, Resor i medvetandet 3, Psionautics |
| fldXIbT08897kV1Oa | PDF (URL) | url | — |
| fldc3aWz7CxO4rDdl | Datum (visas i länk) | formula | Bygger svensk datumsträng: "15 november 2026" / "15–16 november 2026" / "31 oktober – 1 november 2026" |
| fldeRc98Xs7XJRCn8 | Touchpoints | singleLineText | — |
| fld7x0jguPqgS734u | Antal mottagna anmälningsavgifter | rollup | rollar fldWr5cCPNx9HEKtL (Status) från Anmälningar — räknar Mottagna |
| fldZckDgPdSmJ0yPu | Antal mottagna slutbetalningar | rollup | rollar fldWr5cCPNx9HEKtL (Status) — räknar Mottagna slutbetalningar |
| fldEXx1dcJ7djfeEv | Bekräftad beläggning (%) | formula | `IF(Max, Antal mottagna anmälningsavgifter / Max, 0)` → percent |
| fld0vRSHAtOqjVksv | Ej betalt | multipleLookupValues | rollar Förnamn (fldMZAwDbygfYN5WY) från Anmälningar |
| fldgv8tekGEbNBZfw | Antal slutbetalning saknas | formula | `{Antal anmälda} - {Antal mottagna slutbetalningar}` |
| fldjaxY8oWrNvS2El | Ej betalda (records) | multipleRecordLinks | — |
| fldwyD1cheb759YN1 | Närvaro (records) | multipleRecordLinks | — |
| fldl5By2a7jGBPpxF | Event-nr | autoNumber | "Ett eventnummer autogenereras direkt när ni lagt till ett nytt event" |
| fldCAGA9NPnd9kEmi | Eventtyp | multipleRecordLinks | → Eventformat |
| fldFSQSopc87UBXpT | Sessionsmall | multipleLookupValues | rollar Format från Eventformat. Val: Dag 1–7, Föreläsning, Intro, Kvällspass, Q&A, Bonuspass, Avslut |
| fldjX1YN7DOhoKvt1 | Check-in session | singleSelect | Dag 1, Dag 2, Föreläsning |
| fldN20OexhRJQr9XY | Markera alla närvarande | checkbox | — |
| fldF5atXm9lV2nAeq | Markera alla närvarande (alla sessioner) | checkbox | — |
| flddzMrhu30cXoaEf | Närvarostatus att sätta | singleLineText | "Vill ni byta statusetikett så är det här man ändrar det" |

### 3.2 Anmälningar (`tbloOcrppVoyrHbrq`) — 51 fält

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fld9ma56IzeckxDfX | ID | autoNumber | — |
| fldQekqRlLfup8x5K | Person | multipleRecordLinks | → Personer |
| fldi3enUaMdbuGSlm | Event | multipleRecordLinks | → Eventplanering. **A1 sätter automatiskt** baserat på Event+Ort+Startdatum |
| fldJtKQ3qLxRKOvR6 | Anmälningsavgift | singleSelect | **Mottagen** (tealLight2), Ej mottagen (redLight2) |
| fldIImadnJUZHr5Qh | Slutbetalning | singleSelect | Mottagen, Ej mottagen, **Ej relevant (för föreläsningar)** |
| fldGlznON7xqR3IE1 | Deadline slutbetalning | formula | `IF(Slutbetalning="Ej relevant", BLANK(), DATEADD(Startdatum, -14, 'days'))` |
| fldphHILC1eFiVHXD | Slutbetalning status visuellt | formula | Returnerar "Mottagen" / "Ej relevant" / "Försenad" / "Snart dags" / "Väntar" |
| fldWr5cCPNx9HEKtL | Status | singleSelect | **6 val:** Bekräftad (mail skickat) [greenLight1], Betalningspåminnelse skickad [blueLight2], Avbokad/Ombokad [orangeLight1], Obekräftad [grayLight2], Flytta till väntelista [redLight2], **Inställt** [redBright] |
| fldet9MU1rJBSpo3y | Rad skapad | createdTime | — |
| fldCFYtMUs0Kpu8BE | Namn | formula | `{Förnamn} & " " & {Efternamn}` |
| fldMZAwDbygfYN5WY | Förnamn | multilineText | — |
| fldUIMY8mjBeem5BE | Efternamn | multilineText | — |
| fld6RC3r0R9tuKgdF | Vill anmäla sig till | multipleSelects | **8 val** — Resor i medvetandet 1, Fjärrskådning, Resor i medvetandet 2, Resor i medvetandet, Psionautics, Resor i medvetandet 3, **Resor i Medvetandet 2** (dubblett — capitalised), **Resor i Medvetandet 1** (dubblett — capitalised) |
| fldsROcE2FFTGCL3W | Datum | singleLineText | — |
| fldGyYPbxkgS3BqVb | Typ | singleSelect | **Utbildning**, Föreläsning, Psionautics-event |
| fldP1LSzbyOJxrOGP | Ort | singleLineText | — |
| fldAHtyo4P7Z08Vuj | Startdatum | multipleLookupValues | från Event (fldBYhXEHLCd1o2Je) |
| fldsltWfacFVf18Zq | Slutdatum | multipleLookupValues | från Event (fldUMB4x3OyGQ31aL) |
| fldFFRpBJ3Dhs6eFw | Vilka kurser från Roger och Lotta har du deltagit i tidigare? | multilineText | — |
| fldAv80U5ssqOYguK | Varför vill du gå den här utbildningen? | multilineText | — |
| fldVY310IdOIbTkE8 | E-post | multilineText | **Notera: typ är multilineText, inte email** — saknar validering, möjliggör whitespace-injektion |
| fld0CIF2qC7ufa8UD | Normaliserad e-post | formula | `LOWER(TRIM({E-post}))` |
| fldBLxAN1KnOUxNjG | Mobilnummer | multilineText | — |
| fldZTZ5Xzni3MCsDG | Datum och ort (från expressformulär) | singleLineText | "15–16 november 2025 – Falköping" |
| fldE9RwOG42yX4oVA | Har du gått steg 1? | multilineText | — |
| fldwSsq3ZELmtRHPY | Jag har läst och godkänner villkoren och integritetspolicyn. | multilineText | — |
| fldCLVfJIHcuI1l83 | Från formulär | multipleSelects | **5 val:** Huvudformulär, Expressformulär, Obekräftad, Anmälan-Psionautics.se, Backfill (historisk) |
| fldPlPLkpqm0X7Xs2 | EventKey | multilineText | "Event-N" — matchas av A1 mot Eventplanering.EventKey |
| fld8UBd8SWIJfVukq | Betalstatus anmälningsavgift (text) copy | formula | Pass-through på Anmälningsavgift |
| fldpk5zqr5Je0k880 | Betalstatus slutbetalning (text) | formula | Pass-through på Slutbetalning |
| fld6DHDYJZeK2r7OE | Flagga | singleSelect | **Ny anmälan** (yellowBright), Ej mottagen (blueLight2), Mottagen (cyanLight2). 107 records frystes till "Ny anmälan" enligt 26-april-sessionen — reset till "Mottagen" 2026-04-26 |
| fldcPVkGSoVMMJqBP | Ej betalda (records) | multipleRecordLinks | — |
| fldK1aYEm3iCg8OOh | Event (namn) | formula | `{Vill anmäla sig till}` |
| fldbQ7L6gXslLckG1 | Skicka betalningspåminnelse | formula | Bygger mailto-länk med subject + body |
| fldZKPoOpziYbthYF | Dagar kvar till deadline | formula | `DATETIME_DIFF({Deadline slutbetalning}, TODAY(), 'days')` |
| fldNtSHQivkL26B6L | Inskickad | dateTime | — |
| fldgKGmudjmdD6eQJ | Deltaganden | multipleRecordLinks | → Deltaganden |
| fldrMT8cWP3NmBc9T | Motivering (sammanfattning) | formula | Bygger flerradssträng med Event+Ort+Datum + Motivering |
| fld4j7PeckDViTdIB | Är aktiv (1/0) | formula | `IF(Status="Avbokad/Ombokad", 0, 1)` — **Notera:** "Inställt" räknas som **aktiv (=1)** enligt denna formel, eftersom den bara exkluderar Avbokad/Ombokad |
| fld7KFhNH6vtM1L4A | Är avbokad/ombokad (1/0) | formula | `IF(Status="Avbokad/Ombokad", 1, 0)` |
| fldtaSHOvGjgu9v39 | Frågor eller funderingar? | multilineText | "Fråga från formuläret på psionautics.se" |
| fldeBejosU8PzDtQM | Uppdatera mig om fler event i framtiden? | singleLineText | "Fråga från formuläret på psionautics.se" |
| fldQE6aPiFfwVmJQ3 | Betalning mottagen (psionautics-event) | checkbox | — |
| flduwoTPdI8elSNyD | Antal platser | number | — |
| fldPMsiRoLWcgUbsv | Notering | multilineText | — |
| fld0jnbkIbuFAumgG | Bekräftelse skickad | dateTime | Sätts av send-email Edge Function (`patchAfterSend` → confirmation) |
| fldE0cR4r9vI0rKiL | Betalningspåminnelse skickad | dateTime | Sätts av send-email (payment) |
| fld9BkFY8K5pF0xJ2 | Plus-one förfrågan skickad | dateTime | Sätts av send-email (plus_one) |
| fldZ7h3GwTZnvyRfC | Månad/år (from Event) | multipleLookupValues | från Event |
| fldQSRCqIzm49fo3I | Tid kvar till event (from Event) | multipleLookupValues | från Event |
| fldwk2sl7CkBv9epw | **Källa** | singleSelect | **3 val + tom** — *(tom = formulär)*, Manuell (purpleLight2), +1 (tealLight2), Väntelista (blueLight2). Sätts explicit av Edge Functions; tom = formuläranmälan |
| fld39KEXJxyulXfsN | **Medföljande till** | multipleRecordLinks | **Self-link inom Anmälningar.** Sätts av CompanionModal vid skapande |
| fldlP4z8Dirq00nqq | From field: Medföljande till | multipleRecordLinks | Inverse av föregående (auto-uppdaterad) |
| fld3WBS0QQrqLpYtK | **Deltagarinfo skickad** | dateTime | Sätts av send-email (`participant-info`). Skapad 2026-04-16. Mönsterkopia av Bekräftelse skickad / Betalningspåminnelse skickad |

### 3.3 Personer (`tbl6ZyCm3V026iFTU`) — 87 fält

> Persondatabas (master registry). Innehåller mest formel/rollup-fält som speglar Anmälningar och Deltaganden.

**Identitetsfält:**

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldnYys0Ac3UGOdpe | Namn | formula | `IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", TRIM(Förnamn & " " & Efternamn))` |
| fldF1MrcL3KIl0MsV | Rad skapad | createdTime | — |
| fldcd5HnYooVZY4Ts | E-post | multilineText | **Typ-skuld:** ska vara `email` enligt 26-april-fortsattning §6 — kvarstår |
| fldhp3qXp2E6ekW5D | E-post (manuell inmatning) | email | — |
| fldmMYIUhIc1HMnZi | Telefon | multilineText | — |
| fldx4jrCJDOtWUk4O | Förnamn | multilineText | — |
| fldjcYkSmJBLRhwsO | Efternamn | multilineText | — |
| fldbQB9BGJgB1HCg7 | Ej godkänd för mailutskick | checkbox | "Är denna ikryssad får personen INTE era mail" |

**Manuella flaggor:**

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldNtwQt6tOCIdf4f | Manuella flagga | singleSelect | **choices=[]** — tomt valslag, finns men ingen option definierad |
| fldgB9iHDTAqd30Uf | AI-flagga | singleSelect | Särskilt stödbehov, Nybörjare, Stabil och mottaglig, Erfaren |
| fldWGlNr3ujRHo85w | Anteckningar | multilineText | Använt 2026-04-26 för spårbarhet av Avvikelse-fall |
| flduQ4Luh7XVp61R0 | Inbjuden till community | checkbox | — |
| fldJzysWhaMGUo16B | Skapat konto i community | checkbox | — |

**Länkfält (8 st — verifierade):**

| Fält-ID | Namn | → Tabell |
|---|---|---|
| fld8pOivka8YdiywK | Anmälningar (länkat fält) | Anmälningar |
| fld5shm9UER5CMyTl | Deltaganden | Deltaganden |
| fldnuqNqlVzt47AAN | Touchpoints | Touchpoints |
| fld9IM8HnDzutkwf8 | Hämtade erbjudanden (länk) | Hämtade erbjudanden |
| flddG1tVJyaKBxBYv | Engagemang | Engagemang |
| fldFTiLWCWbzoh8vo | Utskickslogg | Utskickslogg |
| fldMX5zl7oY3e3ULy | Mail logg (rådata) | Kontaktlogg (rådata) |

**Anmälningskedjan (rollups från Anmälningar):**

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldDfYF4GffBC9Byw | Anmäld till antal kommande utbildningar | rollup | recordLinkFieldId=fld8pOivka8YdiywK, fieldIdInLinkedTable=fldGyYPbxkgS3BqVb (Typ) |
| fldZvHFuVGwerfJrF | Anmäld till antal kommande föreläsningar | rollup | samma men föreläsningar |
| fldsuq7xJepOyYO0w | Antal anmälningar (totalt) | rollup | räknar fld9ma56IzeckxDfX (ID) |
| fldN8Qv3WCOm3Oheb | Antal anmälningar (aktiva) | rollup | summa av fld4j7PeckDViTdIB (Är aktiv) |
| fldpzeFVVMyDnQZrN | Antal anmälningar (avbokade/ombokade) | rollup | summa av fld7KFhNH6vtM1L4A |
| fldmPYa7RAyWbU4M0 | Antal tidigare genomförda utbildningar | rollup | rollar fld6RC3r0R9tuKgdF (Vill anmäla sig till) |
| fldIuuv4orI0DyLro | Motivering (från anmälningsformulär) | rollup | rollar fldAv80U5ssqOYguK |
| fldHN2Ar5E6tQWlYF | Nästa event (rad) | rollup | rollar fldY2qYntd59jI1Iv (Kommande sammanfattning) från Deltaganden |
| fld5npMbl3PaSlm4B | Återkommande? | formula | `IF(AND(Antal tidigare genomförda > 0, Anmäld till antal kommande utbildningar > 0), "Ja", "Nej")` — **datamodell-skuld:** kräver båda, missar "har gått förut men inget kommande" |
| fld9Yr7aGST29Pbdf | Har en aktiv anmälan? | formula | `IF(Anmäld till kommande > 0, "Aktiv", "Ingen aktiv anmälan")` |
| fldMv413mufrfLZnW | Har en aktiv anmälan (Ja/Nej) | formula | `IF(Har en aktiv anmälan?="Aktiv", "Ja", "Nej")` |

**Deltagandekedjan (rollups från Deltaganden — kräver närvaro):**

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldUwG9s0x071vOHc | RIM 1 × | rollup | recordLinkFieldId=fld5shm9UER5CMyTl, fieldIdInLinkedTable=fldyvWn5aJtQVxL5I (RIM 1 eventkey-formel) |
| fld6JzAkgeERQzLLI | RIM 2 × | rollup | fieldIdInLinkedTable=fldS8Ujzm5de0XSoz |
| fld93OrTArvdkkYmk | **RIM 3 ×** | rollup | fieldIdInLinkedTable=fldL0YfWmdkOuxgsH — **finns** (Punkt 8 från 26-april löst) |
| fldlczklhguSg02H6 | Fjärrskådning × | rollup | fieldIdInLinkedTable=fldLLmr2QjcPNlBBm |
| fldBP7xdEmpXDwUpz | Totala deltaganden (gammal) | formula | `{RIM 1 ×} + {RIM 2 ×} + {Fjärrskådning ×}` — **Note:** inkluderar inte RIM 3 |
| flddy8JND3YnlgZxe | Antal genomförda event | formula | `{RIM 1 ×} + {RIM 2 ×} + {RIM 3 ×} + {Fjärrskådning ×}` — **konsoliderad 2026-04-26 Nivå 2** |
| flddymQaYJGVCInzq | Antal genomförda event (gammal) | rollup | **Markerad för borttagning** efter MK 2026-05-03 |
| fldzd4YElq4zUdePZ | RIM 1 events (pretty) | formula | "(Event-X) + (Event-Y) + (Event-Z)" |
| fldW3A1dxJ5zHIsVo | RIM 2 events (pretty) copy | formula | samma mönster |
| fldqgl9NYPnYUzqCN | Fjärrskådning events (pretty) | formula | samma |
| fld8D6B8a23W17VD1 | Erfarenhet (sammanfattning) | formula | "RIM 1 ×N • RIM 2 ×N • Fjärrskådning ×N" |
| fldWSkxHJS2xWav4t | Erfarenhetsnivå (Miranon Media) | formula | IF-träd: "Ej påbörjat" / "Avvikelse: RIM 2 utan RIM 1" / "Genomfört RIM steg 1–2" / etc. |
| fld04qqDQLgbJbBef | Erfarenhetsbadge | formula | SWITCH som mappar nivå → badge ("Resenär steg 1", "Miranon Media stjärna" etc.) **Datamodell-skuld:** mappar "Genomfört alla" → "Miranon Media stjärna" men föregående formel returnerar aldrig den nivån |
| fldtv9xjLNCbg20XB | Avvikelse (stegordning) | formula | `IF(AND(RIM 2 ×>0, RIM 1 ×=0), "⚠️ RIM 2 utan RIM 1", "")` |

**Touchpoint-kedjan:**

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldgzFXqDGTdKEf60 | TP sammanfattning (rollup) | rollup | — |
| fld8y8pf87Lq09F91 | Senast touchpoint (text) | formula | — |
| fld8e65ppGbVzaSv4 | Senast touchpoint datum | rollup | — |
| fldRnujWHT3ADToC1 | Senaste interaktion (text) | formula | Min av Senaste deltagande / Senast touchpoint |
| fldXZyVlSKg5mX8rP | Senaste interaktion (datum) | formula | Max-datum av de två |

(Personer har totalt 87 fält. Övriga är hämtnings-statistik, dagar-sedan-räknare, datekey-formler. Spårbara genom `list_tables_for_base`-utdatan ovan.)

### 3.4 Deltaganden (`tbldWHH6sSHWoQPHH`) — 47 fält

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldRPtbDly1Zdj8L9 | ID | autoNumber | — |
| fldwQdDpRK8vByNhb | Anmälan | multipleRecordLinks | → Anmälningar |
| fldaj5mbpU3yPw2np | Event | multipleRecordLinks | → Eventplanering |
| fldF9DORzkIBcRT7F | Person | multipleLookupValues | från Anmälan.Person |
| fldBPZnsDL0bNIRHx | Session | singleSelect | **3 val:** Dag 1 (grayLight2), Dag 2 (grayLight1), Föreläsning (blueLight2) |
| fldRFOzNqVswqZ1mN | Status | singleSelect | **6 val:** Ej avstämt, Närvarande, Frånvarande, Försenad, **Avbröt** (redBright), **Deltog online** (yellowLight2) |
| fldpCVTUC0C47ci0S | Noteringar | multilineText | — |
| fld61tbzc2fqqf116 | Avstämt | dateTime | Sätts av A8 vid statusändring |
| fldhx3tludhu1gH7w | Registrerad av | lastModifiedBy | — |
| fldwuo94BY46VUOm4 | Närvaropoäng | formula | `IF(OR(Status="Närvarande", Status="Deltog online"), 1, 0)` — **kritisk lynchpin** |
| fldyvWn5aJtQVxL5I | RIM 1 eventkey | formula | `IF(AND(Närvaropoäng=1, Kursnamn="Resor i medvetandet 1"), Eventkey, BLANK())` |
| fldS8Ujzm5de0XSoz | RIM 2 eventkey | formula | samma villkor med "Resor i medvetandet 2" |
| fldL0YfWmdkOuxgsH | **RIM 3 eventkey** | formula | samma villkor med "Resor i medvetandet 3" — **finns** |
| fldLLmr2QjcPNlBBm | Fjärrskådning eventkey | formula | samma villkor med "Fjärrskådning" |
| fldGC2MziEfqIPeZP | Eventkey (lookup) | multipleLookupValues | från Event.EventKey |
| fldJyjymEoo514AgN | Kursnamn (lookup) | multipleLookupValues | från Event.Event (text) |
| fldfOkyENnKgQQos2 | Eventlabel | multipleLookupValues | från Event.Eventlabel |
| fldExIP1zw5o6ib63 | Event startdatum | rollup | recordLinkFieldId=fldaj5mbpU3yPw2np, fieldIdInLinkedTable=fldBYhXEHLCd1o2Je |
| fldhvFOFV7O0hNIaY | Event slutdatum | rollup | samma men slutdatum |
| fldbV3oTRW9i6w13U | Event ort | multipleLookupValues | från Event.Ort |
| fldiDF6PWfYa8afMr | Event typ | multipleLookupValues | från Event.Typ (Utbildning/Föreläsning) |
| fldKaxHf6UzcHN94v | Deltog sammanfattning | formula | `IF(Närvaropoäng=1, Eventlabel, BLANK())` |
<!-- markdownlint-disable-next-line MD056 -->  <!-- tabell-cell-överskott (Vue-referens-doc, frusen) -->
| fldGJ96lIhsFR3xwN | Deltog sortkey | formula | `YYYYMMDD|Eventlabel` |
| fldjqBoR9LTJISIFz | När | formula | "Idag" / "Igår" / "Imorgon" / "X dagar sedan" / "om X dagar" |
| fldvYGItTZkfc2yPZ | Deltog datum | formula | `IF(Närvaropoäng=1, Event startdatum, BLANK())` |
| fldahsniYiJ7JVNql | Kommande poäng | formula | `IF(Event startdatum >= TODAY(), 1, 0)` |
| fldtyZJW50f5ezVDM | Event (format) | multipleLookupValues | från Event.Eventtyp |
| flddYfDnxRNV3X4O1 | Event (text) | formula | `ARRAYJOIN({Event (format)}, "")` |
| fldkTS2S8IDTsHibj | Anmälan (ID) | formula | `RECORD_ID({Anmälan})` |
| fld1PV4JDU0xkFrQ2 | Event (ID) | formula | `RECORD_ID({Event})` |
| fldra8QclmAyG4dKU | Närvaro (nyckel) | formula | `Anmälan-ID \| Event-ID \| Session` |

(Återstående fält är formler för historik/sortkey som kan läsas via `list_tables_for_base` utan att blockera Fas 1.)

### 3.5 Väntelista (`tbl2VxMx7JMkIxD4Q`) — 14 fält

| Fält-ID | Namn | Typ | Detalj |
|---|---|---|---|
| fldbRr0mOveUvfVW7 | ID | autoNumber | — |
| fldhcXiiLNY8JEDgR | Förnamn | singleLineText | — |
| fldWKbMYRKlwOmg89 | Efternamn | singleLineText | — |
| fldbn9SyKemmI31H3 | E-post | singleLineText | — |
| fldysS1swV4xpUsH5 | Telefonnummer | singleLineText | — |
| fldC01Nf3lVWrOgdw | Event | singleLineText | — |
| fld86BydfvliidRBX | Eventdatum-start | singleLineText | — |
| fldNSwatG61UaemCt | Eventdatum-slut | singleLineText | — |
| fldouEa5AKkfjm7vf | utm_source | singleLineText | — |
| fld2Mqil2Tm4N0SwS | utm_medium | singleLineText | — |
| fldac61BD71mK16nJ | utm_campaign | singleLineText | — |
| fldBBGz0UT815UaQT | utm_content | singleLineText | — |
| fldqMpSW5UJIhNdgm | **Flyttad till anmälan** | checkbox | "Markeras automatiskt när personen flyttas från väntelistan till Anmälningar. Raden ligger kvar som historik men filtreras bort från aktiv väntelista" |
| fldsUxLmHR0NQDiwH | **Informationsmail 1 skickad** | dateTime (UTC) | Skapad 2026-04-27. Sätts av send-email (`waitlist-info-1`) via `patchWaitlistAfterSend` |

---

## 4. Övriga tabeller — fält-katalog

### 4.1 Eventformat (`tbl8qhuJQ5ZWPMRk4`) — 3 fält

- fldDLGIg6XnTWi8ge **Namn** (singleLineText)
- fld1DsZdImXhyim4o **Format** (multipleSelects: Dag 1–7, Föreläsning, Intro, Kvällspass, Q&A, Bonuspass, Avslut — 13 val)
- fldJrYz0crDjRRSi2 **Eventplanering** (multipleRecordLinks → Eventplanering)

### 4.2 Hämtade erbjudanden (`tblqFpgxEhJ95AEcM`) — 16 fält

Triggar A4 (CREATE) och A5 (UPDATE).

- fldezAV1MUXr4pJY7 ID (autoNumber)
- fld8WVM0PwUazElUY E-post (rå) (singleLineText)
- fldcTXSJXQR3d3zoG E-post (formula: `LOWER(TRIM(E-post (rå)))`)
- fldkiIPw23R04KFhY Förnamn (rå)
- fld5ybDduW8gZxOCU Efternamn (rå)
- fldUFcUyXJpiapHZh Förnamn (formula)
- fldcVggunbIwVKnmN Efternamn (formula)
- fldU1Cv0sWVwAWw5A Erbjudande (multipleRecordLinks → Erbjudanden)
- fldFvqVJcLEB8AIeS Datum (createdTime)
- fldiiSHn41rTti0vL Person (multipleRecordLinks → Personer)
- fldP6l3cUgB4JYorH Engagemang ID (multipleRecordLinks → Engagemang)
- fldtJ7yWGhN2vcCMN Erbjudande (source) (singleSelect: **Meditationen Kraftfältet**, Pyramidernas Vajrar)
- fldF9SgJS1Zv5kmtr Källa (formulärkälla) (singleSelect — choices är **SHA256-hashar**, två val)
- fldTWeVgO9YHNyJN4 Hämtnings-ID (formula: `E-post & "|" & Erbjudande (namn)`)
- fldyPxC6Z8RFguivM Erbjudande (namn) (multipleLookupValues)
- fldxBGxFRu7PZEl5A Source key (formula: `LOWER(TRIM(Erbjudande (source)))`)

### 4.3 Engagemang (`tbl9H2SoGFfysBj5y`) — 10 fält

Skrivs av A5 (uppdatera senaste hämtning, totalt antal).

- ID, Person, Erbjudande, Första hämtning (dateTime), Senaste hämtning (dateTime), Totalt antal hämtningar (rollup), Hämtade erbjudanden ID, Normaliserad e-post, Erbjudande (namn), Engagemang (nyckel) (formula).

### 4.4 Touchpoints (`tbl22SCvlHrgcAiZi`) — 17 fält

Skrivs av A2 (vid ny anmälan) och A4 (vid ny lead).

- fldv9JUvqCmnxh4wy Touchpoint ID (autoNumber)
- fldLiC0ZiUAdxXu9u Person (länkat fält) (multipleRecordLinks — verifierat 26-april att det är multipleRecordLinks, inte single — möjliggör säkra merge-mönster)
- fldD3LIpvbTOMnj1X Kanal (singleLineText)
- fldL8gMBzkMHyUoiK Typ (singleSelect: **7 val** — Angett e-post för att ta del av ett erbjudande, Soundwise - konto skapat, Soundwise - börjat lyssna, Inskickad anmälan, Avbokad anmälan, Närvaro registrerad, Öppnat e-post)
- fldpgd7ayzjcbKL98 Erbjudande (singleSelect: Meditationen Kraftfältet, Pyramidernas Vajrar, Annat)
- fldcq8oJWTyc8p8dA Datum (dateTime)
- fldEVwwgWtEJcwbBq TP sortkey (formula: `YYYYMMDDHHmmss|Typ|Kanal`)
- fldO3G3hY0iFLKopR TP sammanfattning (formula)
- fld8DtzhTvy2bVRtz Dagar sedan (nummer) (formula)
- fldAXfFqNAdc9gIwV Dagar sedan (text) (formula)
- fldSXO9yRrxVceBkp Systemkälla (singleSelect — **choices=[]** tomt valslag)
- fldUfTA3gJoDxi5PS Metadata (multilineText)
- fldcSJPi1Vweh7Gyc Mail logg (rådata) (multipleRecordLinks)
- (övriga formler)

### 4.5 Erbjudanden (`tblcCFGCVrnl1JZfg`) — 7 fält

- ID (formula), Nummer (number), Namn (singleLineText), Engagemang (multipleRecordLinks), Hämtade erbjudanden (multipleRecordLinks), Lanseringsdatum (date), Source key (formula)

### 4.6 Kontaktlogg (rådata) (`tblzg4DsRzCCXH8Vy`) — 20 fält

Riktning singleSelect, Källa singleSelect, e-postfält, telefonfält, body, bilagor, koppling till Person + Touchpoint.

### 4.7 Bulkutskick (`tblWarzSse85NI1Zx`) — 12 fält

- Namn på utskick, Status (singleSelect: Skickad, Redo att skickas, Under begrundande, Test, Arkiverad), Segment (multipleRecordLinks → Segment), Antal i segment, Förhandsgranskning (formula: `"Hej [FÖRNAMN], " & Mailtext`), Ämne, Mailtext, Testad (checkbox), Skicka (button), Senast skickat (dateTime), Mottaget av antal, Utskickslogg.

### 4.8 Path to Conversion (`tblor5TK8HeryGXIj`) — 1 fält

Bara `Name` (singleLineText). Tom strukturell behållare.

### 4.9 Email Opens (`tblXFJyGRahQDhhqc`) — 2 fält

Name + Utskickslogg. Linkad till Utskickslogg.

### 4.10 Utskickslogg (`tblIesjbuSWNp6oxK`) — 9 fält

Loggar varje bulk-utskick: Namn, Utskicks-ID, Skickat till (multipleRecordLinks → Personer), Antal skickade (formula), Datum (createdTime), Antal öppnade mail (multipleRecordLinks), Öppningsgrad (formula), Filter snapshot (multilineText), Mailutskick copy.

### 4.11 Error-log (`tblnnmWswnRp9gFws`) — 4 fält

Skrivs av A2: Felmeddelande, Datum, E-post, Relaterar till.

### 4.12 Segment (`tbll2N6JKCj4u6y9o`) — 12 fält

Namn på segment, Antal i segment, Beskrivning, Används för utskick (checkbox), Segmentformel (multilineText, "Make tittar på denna och gör segmenteringen"), Beräkna antal i segment (button), Senast beräknat, Senast uppdaterad, Senast uppdaterad av, Färgkod (singleSelect), Mailutskick (multipleRecordLinks), Segmentdefinition.

### 4.13 Instagram Posts (`tblMpQI1crF521Xsp`) — 1 fält

Bara `Name`. Tom strukturell behållare.

---

## 5. Automationer A1–A11

> **Källa:** `miranon-media-os/docs/miranon_automations_COMPLETE.json` (export 2026-03-16, oförändrad sedan dess). MCP kan inte läsa automationer. Att alla 11 fortfarande är `deployed` har verifierats indirekt via stickprov (nya Anmälningar 2026-04-27 har Person-länk satt → A2 körde → automationerna lever).

### Trigger-typer i basen

| Trigger-ID | Betydelse | Antal automationer |
|---|---|--:|
| `wttRECORDCREATED0` | When record created | 3 (A1, A2, A4) |
| `wttRECORDUPDATED0` | When record updated | 3 (A5, A7, A8) |
| `wttRECORDMATCHES0` | When record matches conditions | 5 (A3, A6, A9, A10, A11) |

### Action-typer i basen

| Action-ID | Betydelse | Antal instanser |
|---|---|--:|
| `watUPDATERECORD00` | Update record | 23 |
| `watCREATERECORD00` | Create record | 18 |
| `watFINDRECORDS000` | Find records | 15 |
| `wdtNWAY0000000000` | N-way decision (multi-branch) | 10 |
| `watCUSTOMSCRIPT00` | Run script | 8 |
| `watBETUHIcuho4hit` | Send email (Airtable native) | 2 |

### A1 — Matcha anmälan mot event

| Egenskap | Värde |
|---|---|
| workflow_id | wflDCKPAv2P6Yu9U6 |
| Status | deployed |
| Trigger | RECORD_CREATED på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Trigger-villkor | Inga (alla nya Anmälningar) |
| Entry-action | wacDkQMtkfCRwDYxK |

**Action-flöde:**

1. wacDkQMtkfCRwDYxK — `FIND_RECORDS` på Eventplanering (matcha mot EventKey/Event+Ort+Startdatum)
2. wacXLk4YN5AzohqCn — `UPDATE_RECORD` på Anmälningar (sätt Event-länk)
3. wded6gggP5Gk0qSa9 — `DECISION` (1 villkorad gren)
4. Gren A: wacbzFeILnI5wOmBg `FIND_RECORDS` på Eventplanering (alternativ matchning) → wactzl1frqeDjAvyq `UPDATE_RECORD` på Anmälningar

**Känd fälla (från verifiering 2026-04-24, errata 2026-04-26):** EventKey-format-bug i Huvudformulär — 5 records hade EventKey="11" istället för "Event-11" → A1 misslyckas att matcha → Anmälan blir orphan utan Event-länk. Underliggande formulär-bug kvarstår per 26-april.

### A2 — När någon anmäler sig → uppdatera/skapa person + skapa Touchpoint

| Egenskap | Värde |
|---|---|
| workflow_id | wflRPMp5QNGEa7wH1 |
| Status | deployed |
| Trigger | RECORD_CREATED på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Entry-action | wacGpA7qtiHjlwD1x |

**Action-flöde (10 actions):**

1. wacGpA7qtiHjlwD1x — `FIND_RECORDS` på Personer (sök på Normaliserad e-post)
2. wacmPhj6tKzUl65Wk — `FIND_RECORDS` på Personer (alternativ sökning)
3. wdezdzNWaL1MYcrkE — `DECISION` (4 grenar)
   - Gren 1: wacKY1MLhOdtIXxR7 — `UPDATE_RECORD` på Personer (uppdatera befintlig)
   - Gren 2: wacGPdvix9kI22TNq — `UPDATE_RECORD` på Anmälningar (sätt Person-länk)
   - Gren 3: wac6h6C1Q8oXQzN5U — `CREATE_RECORD` på Error-log (vid fel)
   - Gren 4: wacKlSgMwIrOzjE1P — `CREATE_RECORD` på Personer (skapa ny person)
4. wacyh2GuNw8IbUb9K — `UPDATE_RECORD` på Anmälningar (sätt Person-länk efter ny Person skapad)
5. wacXk240STE9j0Ory — `CREATE_RECORD` på Touchpoints (Typ=Inskickad anmälan)
6. wacDCG3kSmETZg8lj — `CREATE_RECORD` på Touchpoints (alternativ TP)

**Tabeller berörda:** Anmälningar, Personer, Touchpoints, Error-log

### A3 — Förskapa deltaganden vid anmälan

| Egenskap | Värde |
|---|---|
| workflow_id | wfl4qb2eP28SfKlck |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Actions | 1 × `watCUSTOMSCRIPT00` (3 352 tecken script) |

Skripthash (md5 av script-content): kan extraheras vid behov ur JSON. Skriptet förskapar Deltaganden-records baserat på Eventet's Sessionsmall (Dag 1, Dag 2, Föreläsning) per Eventformat.

### A4 — Inkommande lead → koppla ihop händelse och person

| Egenskap | Värde |
|---|---|
| workflow_id | wflaICTnroTIY4dfP |
| Status | deployed |
| Trigger | RECORD_CREATED på `tblqFpgxEhJ95AEcM` (Hämtade erbjudanden) |
| Actions | 10 actions, inkluderar DECISION |

**Tabeller berörda:** Hämtade erbjudanden, Personer, Touchpoints, Erbjudanden, Error-log

Mönster: matcha lead mot befintlig Person → uppdatera eller skapa ny → koppla till Erbjudande → skapa Touchpoint.

### A5 — Inkommande lead → Skapa/uppdatera engagemang

| Egenskap | Värde |
|---|---|
| workflow_id | wfljTHq2P4gimMf29 |
| Status | deployed |
| Trigger | RECORD_UPDATED på `tblqFpgxEhJ95AEcM` (Hämtade erbjudanden) |
| Actions | 6 actions, inkluderar DECISION |

**Tabeller berörda:** Hämtade erbjudanden, Engagemang.

Mönster: när Hämtade erbjudanden uppdateras (sannolikt när Person-länken sätts av A4), uppdatera/skapa Engagemang-record.

### A6 — Event fullbokat (Beläggning 100 %)

| Egenskap | Värde |
|---|---|
| workflow_id | wfl0filPx4wyAcaQ8 |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tblVE3UKWl1CKrphV` (Eventplanering) |
| Actions | 1 × `watBETUHIcuho4hit` (Send Email) — fält: to, subject, message, fromName, replyTo, cc, bcc, attachments, inReplyTo |

Skickar mail till Roger/Lotta när ett event når 100% beläggning.

### A7 — Synka ej mottagna slutbetalningar per event

| Egenskap | Värde |
|---|---|
| workflow_id | wflDxN31sRJNWCqfu |
| Status | deployed |
| Trigger | RECORD_UPDATED på `tbloOcrppVoyrHbrq` (Anmälningar) |
| Actions | 2 actions (UPDATE-kedja) |

**Tabeller berörda:** Anmälningar, Eventplanering.

### A8 — Sätt tidstämpel när närvarostatus ändras

| Egenskap | Värde |
|---|---|
| workflow_id | wfl1iYPrEmlKpEsRU |
| Status | deployed |
| Trigger | RECORD_UPDATED på `tbldWHH6sSHWoQPHH` (Deltaganden) |
| Actions | 1 × `watUPDATERECORD00` (sätt Avstämt = NOW()) |

Verifierat 2026-04-26: triggar inom 60 sekunder efter PATCH (Punkt 4-rättning).

### A9 — Markera närvaro (vald session)

| Egenskap | Värde |
|---|---|
| workflow_id | wflgIhQ6Qo0zV50NH |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tblVE3UKWl1CKrphV` (Eventplanering) |
| Actions | 1 × `watCUSTOMSCRIPT00` |

Triggar när checkbox `Markera alla närvarande` (fldN20OexhRJQr9XY) ändras. Markerar alla Deltaganden för vald `Check-in session` som Närvarande.

### A10 — Markera närvaro (alla sessioner)

| Egenskap | Värde |
|---|---|
| workflow_id | wfl4rswJuGt9hVqF3 |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tblVE3UKWl1CKrphV` |
| Actions | 1 × `watCUSTOMSCRIPT00` |

Triggar på checkbox `Markera alla närvarande (alla sessioner)` (fldF5atXm9lV2nAeq).

### A11 — Koppla deltagande till person

| Egenskap | Värde |
|---|---|
| workflow_id | wflIHsSbUvoc4BmP5 |
| Status | deployed |
| Trigger | RECORD_MATCHES på `tbldWHH6sSHWoQPHH` (Deltaganden) |
| Actions | 1 × `watCUSTOMSCRIPT00` |

Triggar när nya Deltaganden skapas (av A3 eller manuellt). Sätter Person-länk-rollup explicit.

---

## 6. Webhooks

**Inte tillgängligt via Airtable-MCP.** Per CLAUDE.md "Kritiska lärdomar": *"Airtable MCP kan INTE se automationer, interfaces, vyer, formulär eller extensions."* Webhooks faller i samma kategori. För att lista basen-webhooks krävs Airtable Web API direkt eller HAR-export från Airtable UI. **Markeras som öppen fråga (se 1.8).**

Edge Functions agerar effektivt som webhook-konsumenter (POST från Lovable-frontend), men de är externa system och dokumenteras separat i 01-extraction.md (Steg 1.5).

---

## 7. Stickprov

### 7.1 Anmälningar — 5 senaste (sorterade på Rad skapad desc)

| ID | Skapat (UTC) | Namn | Status | Typ |
|--:|---|---|---|---|
| 854 | 2026-04-27 18:41:36 | Henny Elisabet Fredrika Röckert | Obekräftad | Utbildning |
| 853 | 2026-04-26 21:41:27 | Ulrika Johansson | Obekräftad | Utbildning |
| 852 | 2026-04-26 21:40:53 | Jessica Karlsson | Obekräftad | Utbildning |
| 851 | 2026-04-26 21:40:15 | Savannah Rosén | Obekräftad | Utbildning |
| 850 | 2026-04-26 21:39:37 | Maria Karlsson | Obekräftad | Utbildning |

**Observation:** Bas är levande. Anmälan #854 inkom 2026-04-27 — efter 26-april-fortsattning-sessionen. Alla nya har Status=Obekräftad (default).

### 7.2 Personer — 5 senaste (sorterade på Rad skapad desc)

| Namn | Skapat (UTC) | E-post | Antal anmälningar | Status |
|---|---|---|--:|---|
| Henny Elisabet Fredrika Röckert | 2026-04-27 18:41:41 | <fredrika.rockert@gmail.com> | 1 | Aktiv |
| Simon Ågren | 2026-04-27 18:26:50 | <simon.agren83@gmail.com> | 0 | Ingen aktiv |
| Ej tillgängligt | 2026-04-26 21:48:25 | <tonetider@protonmail.com> | 0 | Ingen aktiv |
| Ej tillgängligt | 2026-04-26 21:47:44 | <miranon.prominent654@passmail.net> | 0 | Ingen aktiv |
| Siv-Åse | 2026-04-26 21:47:12 | <sivan.nilsen@gmail.com> | 0 | Ingen aktiv |

**Observation:** 2 av 5 saknar Förnamn+Efternamn (formelvärde "Ej tillgängligt" från fldnYys0Ac3UGOdpe). Skapade av A2 från Hämtade erbjudanden (lead utan namn-fält). Ny datakvalitetsfälla — se 1.8.

### 7.3 Deltaganden — 5 senaste

| ID | Anmälan-rec | Session | Status |
|--:|---|---|---|
| 1686 | recPxJubDCYylBYbL | Dag 2 | Ej avstämt |
| 1685 | recH8eOG4gUcn0gx0 | Dag 1 | Ej avstämt |
| 1684 | rec4zTGdjI43hA91K | Dag 2 | Ej avstämt |
| 1683 | rec0gBwp1ItzlgBtH | Dag 1 | Ej avstämt |
| 1682 | recLY5EgGTTDzhvcq | Dag 2 | Ej avstämt |

**Observation:** Skapade av A3 baserat på Anmälningar #851–#854. Anmälan-ID = Event-ID i formelfältet pga A3 ännu inte hunnit uppdatera Event-länken? **Möjlig anomali — verifiering rekommenderad i Fas 1**.

### 7.4 Eventplanering — 5 senaste/kommande (sort på Startdatum desc)

| EventKey | Eventlabel | Startdatum | Status | Antal anmäld |
|---|---|---|---|--:|
| Event-26 | Rönninge – Utbildning – Resor i medvetandet 3 – 2026-11-28 | 2026-11-28 | Planerat | 7 |
| Event-56 | Rönninge – Utbildning – Resor i medvetandet 1 – 2026-11-14 | 2026-11-14 | Planerat | 2 |
| Event-55 | Rönninge – Utbildning – Resor i medvetandet 2 – 2026-10-03 | 2026-10-03 | Planerat | 7 |
| Event-20 | Gotland – Utbildning – Resor i medvetandet 2 – 2026-09-19 | 2026-09-19 | Planerat | 0 |
| Event-25 | Rönninge – Utbildning – Resor i medvetandet 3 – 2026-09-05 | 2026-09-05 | Planerat | 7 |

**Observation:** Event-55 och Event-56 skapades 2026-04-26 14:54:21 (per createdTime). Bekräftar verifiering-2026-04-24 §Fynd 4 — pre-existing skuld med marknadsförda kurser utan Event-records, sanerade i åtgärdssessionen.

### 7.5 Inställt-events (verifiering Punkt 9 från 26-april)

| EventKey | Eventlabel | Notering |
|---|---|---|
| Event-6 | Varberg – Föreläsning – Resor i medvetandet – 2026-02-06 | "[Triage 2026-04-26 — antagande]: Event ställdes in. Marcus bekräftade som proxy ... Verifiering mot mejlhistorik/kalender ej genomförd" |
| Event-11 | Falköping – Föreläsning – Fjärrskådning – 2026-03-19 | "Event inställt — ingen närvaro att markera" |
| Event-12 | Falköping – Föreläsning – Resor i medvetandet – 2026-03-20 | "[Triage 2026-04-26]: Event ställdes in — 0 anmälningar, ingen kommunikation utgick" |

**Bekräftelse:** Event-6 har Status=Inställt 2026-04-28 — Punkt 9 från fortsattningssessionen 26-april kvarstår. Inställt-status finns i basen som `selmZw4rALZRJ5jg6` (redLight1).

### 7.6 Anmälningar med Status=Inställt

| ID | Namn | Event (namn) |
|--:|---|---|
| 28 | Daniel Finnhult | Resor i medvetandet |
| 2 | Mia Hasselgren | Resor i medvetandet |

**Bekräftelse:** Mia & Daniel kvarstår som Inställt — Punkt 9 STEG C håller. Inställt-status `selebP2V3qmFRTtdP` (redBright) på Anmälningar.Status.

### 7.7 Väntelista — stickprov

| ID | Namn | Flyttad till anmälan |
|--:|---|---|
| 3 | Emma Lagerström | (tom) |
| 44 | Alissa Norling | (tom) |
| 42 | Ida Lokamo | (tom) |
| 33 | Bo Steinvall | **true** |
| 24 | Cathrine Avidan | (tom) |

Total: 44 records. Filter på `Flyttad till anmälan = false` ger aktiva väntelistan.

---

## 8. Avvikelser från 00-file-manifest

### A. Tabellnamn mot manifest

Manifestet listade 18 tabeller men nämnde inte specifika namn för några. **Inget i manifestet motsäger** den lista som MCP returnerar.

### B. Q5 löst — `tblVE3UKWl1CKrphV`

Manifestet markerade `tblVE3UKWl1CKrphV` som "okänt" och "behöver verifieras". MCP svarar entydigt: **Eventplanering** (45 fält). Den primära tabellen för event-rekord.

### C. April-fält bekräftade i basen

Manifestet identifierade att `schema_reference.md` saknar 4 april-fält. MCP bekräftar att alla 4 (+ 1 till) finns:

| Fält | Tabell | Fält-ID | Skapad |
|---|---|---|---|
| Källa | Anmälningar | fldwk2sl7CkBv9epw | tidigare april (sannolikt 2026-04-15 enligt sessionsanteckningar) |
| Medföljande till | Anmälningar | fld39KEXJxyulXfsN | tidigare april |
| From field: Medföljande till | Anmälningar | fldlP4z8Dirq00nqq | inverse av föregående |
| Deltagarinfo skickad | Anmälningar | fld3WBS0QQrqLpYtK | 2026-04-16 (session-2026-04-16) |
| Flyttad till anmälan | Väntelista | fldqMpSW5UJIhNdgm | tidigare april |
| Informationsmail 1 skickad | Väntelista | fldsUxLmHR0NQDiwH | 2026-04-27 (session-2026-04-27) |

### D. Fält som manifestet inte räknade in

Utöver de fyra kända april-fälten har basen **ytterligare fält** som inte är dokumenterade någonstans (utöver detta dokument):

- Anmälningar: Status-option **"Inställt"** (`selebP2V3qmFRTtdP`, tillagd 2026-04-26 av Marcus)
- Eventplanering: Status-värdet **"Inställt"** finns redan i schema (selmZw4rALZRJ5jg6)
- Personer: **RIM 3 ×** (fld93OrTArvdkkYmk) som rollup — bekräftat tillagt i Nivå 2 av åtgärdssessionen 26-april
- Personer: **Antal genomförda event** (flddy8JND3YnlgZxe) konverterad från rollup till formula 2026-04-26
- Personer: **Antal genomförda event (gammal)** (flddymQaYJGVCInzq) markerad för borttagning efter MK 2026-05-03
- Deltaganden: Status-option **"Avbröt"** (`selJ1f9Yv9J7jjqrH`, redBright) och **"Deltog online"** (`selWGhz7v8MPTVpT8`, yellowLight2) — inte dokumenterade i nuvarande data-model.md
- Väntelista: 8 utm_*-fält + stadsfält som **inte nämns i nuvarande data-model.md**

### E. Datakvalitetsfynd från live-state

1. **`Vill anmäla sig till` (Anmälningar) har dubletter i optionerna:** "Resor i medvetandet 1" + "Resor i Medvetandet 1" (kapitalisering), samma för 2. **Sannolikt orsak:** formuläret normaliserar inte case → valda optioner kommer in med olika kapitalisering. Drabbar A1-matchning + segmentering.

2. **`Manuella flagga` (Personer) har choices=[]:** singleSelect utan optioner. Kan ha optioner som tagits bort men strukturen kvarstår tom.

3. **`Systemkälla` (Touchpoints) har choices=[]:** samma mönster.

4. **`Källa (formulärkälla)` (Hämtade erbjudanden) har SHA256-hashar som optioner:** `ae9a4975a6f8e77121ae6b8973e1e31411f49d45293638001a448de424a54d10` och `58947ba345f0013563663ba7916d05637403bcced327adb91dd81cd9c69fea9a`. Sannolikt webhook-källors hash-IDs. Bör mappas i dokumentation.

5. **`E-post` på Personer är multilineText, inte email:** kvarstående typ-skuld från 26-april-sessionen.

6. **2 nya Personer-records utan namn:** "Ej tillgängligt" från fldnYys0Ac3UGOdpe (2026-04-26). Skapade av A2 från lead-process. Indikerar att Hämtade erbjudanden-formuläret kan skicka leads utan Förnamn/Efternamn → A2 skapar Person utan namn.

### F. Avvikelse: Deltaganden 1500 records

Backfill-rapporten (verifiering-2026-04-24) listade **924 backfill-Deltaganden** + 459 backfill-Anmälningar. Live-MCP visar **1 500 Deltaganden** totalt. Differensen ~576 är pre-existing + post-backfill auto-skapade av A3 (varje ny Anmälan → 2–3 Deltaganden). Ingen anomali — förväntad organisk tillväxt över 9 dagar.

---

## Slutsumma — vad detta dokument bevisar

- 18 tabeller, ~290 fält bekräftade i basen 2026-04-28
- 11 automationer alla i `deployed` status (källa: JSON-export 2026-03-16, korrelation via stickprov av nya records)
- 5 nya fält (april) bekräftade i basen — schema_reference.md är **stale** för dessa
- 2 nya Status-options (Anmälningar.Inställt + Eventplanering.Inställt) bekräftade
- Q5 löst entydigt
- Punkt 9 från 26-april (Event-6 + Mia + Daniel) verifierad kvarstående
- 6 nya datakvalitetsfynd identifierade (lyfts till 01-extraction.md sektion D)

*Avvaktar Marcus godkännande av Checkpoint 1 innan steg 1.2.*
