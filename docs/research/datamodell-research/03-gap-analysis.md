---
namn: Gapanalys — sektion-för-sektion åtgärdsplan för Fas 4
syfte: Konkret instruktion till Code för Fas 4: vad som ska behållas, rättas, utökas, läggas till, omstruktureras
skapad: 2026-04-28
indata: 01-extraction.md (964 r), 02-live-state.md (726 r), nuvarande data-model.md (642 r), nuvarande hur-systemet-funkar.md (282 r)
status: Fas 3 — avvaktar godkännande
operations: BEHÅLL / RÄTTA / UTÖKA / LÄGG TILL / OMSTRUKTURERA
---

# Gapanalys — Fas 3

> **Användning.** Detta dokument är input till Fas 4. För varje sektion i de två levande dokumenten finns en rad operationer. Code utför operationerna i Fas 4. Chat (jag) granskar utfallet.
>
> **Operationsbetydelser:**
>
> - **BEHÅLL** — sektionen är korrekt och fullständig. Ingen ändring.
> - **RÄTTA** — fel data eller inaktuell info. Specifik rättning anges.
> - **UTÖKA** — befintlig sektion behöver mer innehåll. Tillägg specificeras.
> - **LÄGG TILL** — ny sektion eller större tillägg. Designskiss anges.
> - **OMSTRUKTURERA** — sektionsindelning eller ordning ska ändras.
>
> **Källkonvention:** alla operationer som baseras på extraktionen anger källrad i `01-extraction.md` eller `02-live-state.md`.

---

## Innehåll

1. [Övergripande designbeslut](#1-övergripande-designbeslut)
2. [data-model.md — sektion för sektion](#2-data-modelmd--sektion-för-sektion)
3. [hur-systemet-funkar.md — sektion för sektion](#3-hur-systemet-funkarmd--sektion-för-sektion)
4. [Master/kopia-fix](#4-masterkopia-fix)
5. [Sammanfattning av nya/ändrade poster](#5-sammanfattning-av-nyändrade-poster)
6. [Implementationsordning för Fas 4](#6-implementationsordning-för-fas-4)

---

## 1. Övergripande designbeslut

Beslut som påverkar flera sektioner. Tas en gång här, gäller överallt.

### D1. UI-gruppering av automationer

Marcus har strukturerat A1–A11 i 3 kategorier i Airtable Automations-UI:t (verifierat via screenshot 2026-04-28):

| Grupp | Antal | Automationer |
|---|---|---|
| **När någon anmäler sig till event** | 3 | A1, A2, A3 |
| **Annat engagemang** | 2 | A4, A5 |
| **Övervakning** | 6 | A6, A7, A8, A9, A10, A11 |

**Beslut:** Använd denna gruppering som strukturerande princip i:

- `data-model.md` §Automationssekvenser — omstrukturera enligt grupperna
- `hur-systemet-funkar.md` — referera till grupperna pedagogiskt

Detta är Marcus mentala modell och blir därmed pedagogiskt korrekt för framtida läsare.

### D2. Schema_reference.md avvecklas

Per beslut B2 från arbetsdokumentet: `schema_reference.md` är stale (saknar 5 april-fält + flera nya options) och uppdateras inte i miranon-media-os. Konsekvenser:

- `data-model.md` ska INTE längre delegera fältlistor till schema_reference
- Pekare till schema_reference ska bytas ut mot pekare till data-model.md self + Airtable MCP
- En ny sektion **"Schema cheat sheet"** med alla operationella fält-IDs läggs till i data-model.md (mål: Discovery-test ska klaras)

### D3. Källspårbarhet i nya dokumentet

Varje nytt påstående om systemet ska kunna spåras till ursprunget. Konvention:

- Påståenden om schema/options/fält-IDs: spårbart till MCP-pull 2026-04-28 (eller senare)
- Påståenden om Edge Functions: spårbart till commit-hash + datum
- Påståenden om automationer: spårbart till `miranon_automations_COMPLETE.json` 2026-03-16 (verifierat oförändrad)
- Påståenden om datakvalitet/incidenter: spårbart till sessionsfil + datum

Spårbarheten dokumenteras i en fotnot eller källangivelse per sektion — INTE inline efter varje mening. Mål: läsbarhet bevaras.

### D4. Data-model.md blir verkligen primär

Per arbetsdokumentet B3 (justerad): Idag säger psionautics-headern att miranon-media-admin är "primär" men i praktiken har psionautics-versionen redigerats senare. Vi rättar detta i Fas 4 genom att:

1. Göra miranon-media-admin/docs/reference/data-model.md till **faktiskt** primär (skriv där först)
2. Synka till psionautics/docs/reference/data-model.md som kopia (header säger "kopia")
3. Samma för hur-systemet-funkar.md

### D5. Datumstämpel + version på alla sektioner

Lägg till "Senast verifierad: 2026-04-28" eller motsvarande i sektioner som innehåller mätbar data (records-räkning, fält-statistik, datakvalitetsstatus). Mål: framtida läsare ska veta hur färska siffrorna är.

---

## 2. data-model.md — sektion för sektion

### 2.1 Header + "Vad det här dokumentet är" (rad 1-29)

| Op | Detalj |
|---|---|
| RÄTTA | Headerblocket (rad 1-8) — psionautics-versionen säger "Primär version: ~/Repon/miranon-media-admin/docs/reference/data-model.md". Detta blir korrekt först efter D4. När miranon-media-admin-versionen är skriven först kan psionautics-kopian peka dit ärligt. |
| RÄTTA | Rad 14 "Version 1. Skapad 2026-04-16" → "Version 2. Skapad 2026-04-16. Senast verifierad 2026-04-28." |
| RÄTTA | Rad 22 — "Människor — Marcus, Roger, Lotta — läser hur-systemet-funkar.md istället" är OK. Men lägg också till: "Detta dokument är AUKTORITATIV för datamodellen. schema_reference.md (miranon-media-os) är arkiverad för historik." |
| RÄTTA | Rad 27 — Principen "Delegera detaljer. Fältlistor, choice-IDs, vyer och formulärkonfigurationer bor i schema_reference.md." → Ändra till: "Detta dokument är primär källa för fält-IDs och options. Vyer och formulär dokumenteras separat (eller delegeras till live MCP-pull)." |

### 2.2 Karta — Var bor vad? (rad 31-43)

| Op | Detalj |
|---|---|
| RÄTTA | Rad 36 — "schema_reference.md (1 682 rader)" är stale. Ersätt med: "Live MCP-pull mot bas `app8uGPrVCVOm6LfD` (alltid aktuell). Senaste extraktion: `docs/research/datamodell-research/02-live-state.md` 2026-04-28." |
| RÄTTA | Rad 37 — "field_lookup.json (153 fält)" — verifiera räknare. Live-state visar ~290 fält (preliminär uppskattning) eller 358 (summa per tabell). Beräkning behövs i Fas 4. |
| RÄTTA | Rad 39 — "AIRTABLE-REFERENS.md (298 rader)" — verifiera storlek. Manifestet säger 12 344 B. Räkna rader. |
| UTÖKA | Lägg till rad: "Källextraktion + datamodell-skuldlista (under projektets gång) → `~/Repon/miranon-media-admin/docs/research/datamodell-research/`" — för spårbarhet av detta projekt. |

### 2.3 Snabbreferens — ID:n och nyckelfält (rad 45-122)

| Op | Detalj |
|---|---|
| UTÖKA | Tabell-ID:n (rad 58-75) listar 16 av 18 tabeller. Lägg till: `Path to Conversion: tblor5TK8HeryGXIj` och `Instagram Posts: tblMpQI1crF521Xsp`. Markera båda som "tom strukturell behållare — 1 fält (Name) bara". Källa: 02-live-state §2 rad 59, 65. |
| UTÖKA | Aktiva event (rad 77-81) — lägg till "Max antal platser: 88 (uppdaterad 2026-04-26 från 70)". Källa: 01-extraction §A.3. |
| UTÖKA | Kritiska länkfält (rad 83-94) — lägg till `From field: Medföljande till` (Anmälningar.fldlP4z8Dirq00nqq, multipleRecordLinks, auto-skapat inverse). Källa: 01-extraction §A.1. |
| RÄTTA | Rad 104 — fält-ID `fldRfc4i7HHfc1dFU` ("Genomfört event (1 rad per event)"). **Verifiera** att fältet existerar i basen via MCP. Det listas inte explicit i 02-live-state §3.4 (där 31 av 47 Deltaganden-fält detaljeras). Om fältet existerar → behåll. Om inte → undersök varför det är listat som lynchpin. |
| LÄGG TILL | Ny undersektion "Snabbreferens / Status-värden / Anmälningar.Status" — listar alla 6 nuvarande val med option-IDs. Källa: 01-extraction §A.4 rad 71-77. |
| LÄGG TILL | Ny undersektion "Snabbreferens / Status-värden / Eventplanering.Status" — listar alla 4 val med option-IDs (inklusive nya "Inställt"). Källa: 01-extraction §A.4 rad 107-108. |
| LÄGG TILL | Ny undersektion "Snabbreferens / Status-värden / Anmälningar.Källa" — listar 3 val + tom. Källa: 01-extraction §A.4 rad 79-83. |
| UTÖKA | Deltaganden.Status (rad 113-122) — lägg till "Avbröt" och "Deltog online" (existerar i basen, inte dokumenterade). Källa: 01-extraction §A.4 rad 125-131. |
| LÄGG TILL | Ny undersektion "Snabbreferens / Schema cheat sheet" — operationella fält-IDs grupperade per kategori. Mål: Discovery-test (PATCH/POST utan att slå upp). Innehåll (förslag): |

#### Schema cheat sheet — designskiss (LÄGG TILL)

```text
### Schema cheat sheet — operationella fält-IDs

För Edge Functions, scripts, manuella PATCH-ops. Listar fält som
ofta skrivs till + alla relevanta options.

#### Anmälningar — write-fält
| Syfte                         | Fält-ID              | Typ           | Options |
|-------------------------------|----------------------|---------------|---------|
| Status                        | fldWr5cCPNx9HEKtL    | singleSelect  | (lista) |
| Anmälningsavgift              | fldJtKQ3qLxRKOvR6    | singleSelect  | Mottagen, Ej mottagen |
| Slutbetalning                 | fldIImadnJUZHr5Qh    | singleSelect  | Mottagen, Ej mottagen, Ej relevant |
| Källa                         | fldwk2sl7CkBv9epw    | singleSelect  | Manuell, +1, Väntelista, *(tom)* |
| Medföljande till              | fld39KEXJxyulXfsN    | multipleRecordLinks (self) | – |
| Bekräftelse skickad           | fld0jnbkIbuFAumgG    | dateTime      | – |
| Betalningspåminnelse skickad  | fldE0cR4r9vI0rKiL    | dateTime      | – |
| Plus-one förfrågan skickad    | fld9BkFY8K5pF0xJ2    | dateTime      | – |
| Deltagarinfo skickad          | fld3WBS0QQrqLpYtK    | dateTime      | – |
| Person (länk)                 | fldQekqRlLfup8x5K    | multipleRecordLinks → Personer | – |
| Event (länk)                  | fldi3enUaMdbuGSlm    | multipleRecordLinks → Eventplanering | – |

#### Väntelista — write-fält
| Syfte                         | Fält-ID              | Typ           |
|-------------------------------|----------------------|---------------|
| Flyttad till anmälan          | fldqMpSW5UJIhNdgm    | checkbox      |
| Informationsmail 1 skickad    | fldsUxLmHR0NQDiwH    | dateTime (UTC)|

#### Eventplanering — write-fält
| Syfte                         | Fält-ID              | Typ           |
|-------------------------------|----------------------|---------------|
| Status                        | fld2nXlS1UG0aOHLt    | singleSelect  |
| Max antal platser             | fldbyEz8djcxCBO5r    | number        |
| Manuella platser              | fld8pUb6x2G3YIovs    | number        |
| Extra platser                 | fldIHwVr8Wq5tp4o6    | number        |
| Markera alla närvarande       | fldN20OexhRJQr9XY    | checkbox      |
| Markera alla närvarande (alla)| fldF5atXm9lV2nAeq    | checkbox      |

#### Deltaganden — write-fält
| Syfte                         | Fält-ID              | Typ           |
|-------------------------------|----------------------|---------------|
| Status                        | fldRFOzNqVswqZ1mN    | singleSelect  |
| Session                       | fldBPZnsDL0bNIRHx    | singleSelect  |
| Anmälan (länk)                | fldwQdDpRK8vByNhb    | multipleRecordLinks |
| Event (länk)                  | fldaj5mbpU3yPw2np    | multipleRecordLinks |

#### Personer — write-fält
| Syfte                         | Fält-ID              | Typ           |
|-------------------------------|----------------------|---------------|
| Förnamn                       | fldx4jrCJDOtWUk4O    | multilineText |
| Efternamn                     | fldjcYkSmJBLRhwsO    | multilineText |
| E-post                        | fldcd5HnYooVZY4Ts    | multilineText (typ-skuld — DQ5) |
| AI-flagga                     | fldgB9iHDTAqd30Uf    | singleSelect  |
| Anteckningar                  | fldWGlNr3ujRHo85w    | multilineText |
```

Källa: 01-extraction §A.4 + §I (Edge Function-kontrakt) + 02-live-state §3.

### 2.4 Grundarkitektur — Airtable-basen (rad 124-162)

| Op | Detalj |
|---|---|
| BEHÅLL | Strukturen, kärntabells-diagrammet (rad 134-149) |
| UTÖKA | Rad 130-132 — verifiera "10 Zapier-zaps", "2 Make.com-scenarier". Om inte verifierbara just nu, markera som [HYPOTES — EJ VERIFIERAD] eller flytta till "Luckor". |
| RÄTTA | Rad 162 — "Se schema_reference.md rad 7–30 för full tabellöversikt" → ersätt med: "Se §Snabbreferens / Tabell-ID:n ovan. Live-pull i `docs/research/datamodell-research/02-live-state.md`." |
| UTÖKA | Övriga tabeller (rad 153-162) — lägg till Path to Conversion + Instagram Posts (markerade "tom strukturell behållare"). |

### 2.5 Psionautics-tillägg (rad 164-184)

OMSTRUKTURERA hela sektionen. Den heter "Psionautics-tillägg" eftersom den listade fält som ännu inte var i schema_reference.md. Med D2 (schema_reference avvecklas) finns inte längre den distinktionen. Föreslagen ny rubrik: **"Fält tillagda i april 2026"** eller integrera helt i §Snabbreferens / Schema cheat sheet ovan.

| Op | Detalj |
|---|---|
| OMSTRUKTURERA | Byt rubriknamn. Föreslagen: "Fält tillagda i april 2026". Eller integrera hela innehållet i Schema cheat sheet. |
| UTÖKA | Lägg till `From field: Medföljande till` (auto-skapat inverse). |
| UTÖKA | Lägg till `Status="Inställt"` på Anmälningar (skapad 2026-04-26). |
| UTÖKA | Lägg till `Status="Inställt"` på Eventplanering. |
| UTÖKA | Lägg till `RIM 3 ×` (Personer.fld93OrTArvdkkYmk) — rollup tillagt 2026-04-26. |
| UTÖKA | Lägg till `RIM 3 eventkey` (Deltaganden.fldL0YfWmdkOuxgsH) — formula tillagt 2026-04-26. |
| UTÖKA | Lägg till `Antal genomförda event` (Personer.flddy8JND3YnlgZxe) — konverterat från rollup till formula 2026-04-26. |
| UTÖKA | Lägg till `Antal genomförda event (gammal)` (Personer.flddymQaYJGVCInzq) — markerad för borttagning efter MK 2026-05-03. |
| UTÖKA | Lägg till `Status="Avbröt"` och `Status="Deltog online"` på Deltaganden (existerar, inte dokumenterade). |
| UTÖKA | Lägg till `Backfill (historisk)` som nytt val på Anmälningar.Från formulär. |
| RÄTTA | TODO-raden "synka till schema_reference.md nästa gång det dokumentet rörs" — TA BORT. Schema_reference avvecklas (D2). |

Källa: 01-extraction §A.1, §A.2, §A.3, §A.4.

### 2.6 Den kritiska distinktionen — två datakällor (rad 187-220)

| Op | Detalj |
|---|---|
| BEHÅLL | Strukturen och pedagogiken — Spår 1/Spår 2-distinktionen är guld. |
| UTÖKA | Spår 2-tabellen (rad 203-213) — lägg till `RIM 3 ×` (fld93OrTArvdkkYmk) som ny rad. |
| RÄTTA | Rad 208 — `Antal genomförda event` listas med `flddymQaYJGVCInzq` (gammal rollup). Uppdatera till `flddy8JND3YnlgZxe` (ny formula) + nämn att gammal rollup `flddymQaYJGVCInzq` parallellt finns men markerad för borttagning. |
| RÄTTA | Rad 220 — "Per 2026-04-16: 487 av 517 Deltaganden-poster har Status = 'Ej avstämt' (94.2%)" är inaktuellt. Live-state visar 1 500 Deltaganden 2026-04-28. Code räknar om aktuell distribution från live-state och uppdaterar siffran. |
| UTÖKA | Lägg till en kort not (1-2 meningar): "Backfill av historisk närvaro genomförd 2026-04-19. 459 historiska Anmälningar + 924 historiska Deltaganden importerade. Se §Backfill — historik." |

### 2.7 Insiktskedjan (rad 222-315)

| Op | Detalj |
|---|---|
| BEHÅLL | Hela DAG:en + förklaringen — exceptionellt bra pedagogik. |
| UTÖKA | DAG:en (rad 228-255) — lägg till RIM 3-grenen parallellt med RIM 1, RIM 2, Fjärrskådning. |
| UTÖKA | "Varje steg i klartext" rad 268-271 — lägg till RIM 3 eventkey-formel. |
| BEHÅLL | "Erfarenhetsnivå-tabellen" (rad 286-294) och "Erfarenhetsbadge-tabellen" (rad 298-306). |
| BEHÅLL | "Kända buggar i insiktskedjan" (rad 308-314) — Erfarenhetsbadge dead branches dokumentation är korrekt. |
| LÄGG TILL | Ny not i "Kända buggar"-sektionen: "RIM 3-tillägget 2026-04-26 påverkar inte Erfarenhetsnivå-formeln — RIM 3 ingår inte ännu i klassificeringen." (Verifieras i Fas 4 — om Erfarenhetsnivå-formeln har uppdaterats för RIM 3, bortse.) |

Källa: 01-extraction §A.3 + 02-live-state §3.4.

### 2.8 Anmälningskedjan (rad 317-369)

| Op | Detalj |
|---|---|
| BEHÅLL | Strukturen + pedagogiken |
| UTÖKA | Diagrammet rad 323-351 — lägg till en explicit not om A2:s 4 grenar. |
| LÄGG TILL | Ny undersektion **"A2:s 4 grenar — beslutsväg"** efter rad 351: |

#### A2:s 4 grenar — designskiss (LÄGG TILL)

```text
### A2:s decision — 4 grenar

A2 söker Person via två separata FIND_RECORDS, sedan väljs gren 
baserat på resultaten:

| Gren | Villkor                          | Action                                      |
|------|----------------------------------|---------------------------------------------|
| 1    | length(STEG_2) = 1               | UPDATE Personer (uppdatera namn på namnlös) |
| 2    | length(STEG_1) = 1               | UPDATE Anmälningar (koppla till Person)     |
| 3    | length(STEG_1) > 1               | CREATE Error-log (dubblett)                 |
| 4    | default                          | CREATE Personer (skapa ny + koppla)         |

[HYPOTES — EJ VERIFIERAD]: Om en namnlös Person finns för 
trigger-mailen kan Gren 1 matcha och Gren 2 hoppas över → 
Anmälan-Person-länken förblir tom, bara Personens namn uppdateras. 
Konsekvenser i reverse-flow är dokumenterade i §Kända fällor #21.

Verifieringsplan: skapa testanmälan med email-adress som matchar 
en känd namnlös Person; verifiera Anmälan.Person efter A2.
```

Källa: 01-extraction §B.A2.

| Op | Detalj |
|---|---|
| BEHÅLL | "Återkommande?" missvisande-noten (rad 353-365) |
| BEHÅLL | "Självrapporterade tidigare kurser" (rad 367-369) |

### 2.9 Automationssekvenser (rad 371-468)

OMSTRUKTURERA hela sektionen enligt D1. Nuvarande indelning är 3 sekvenser ("Ny anmälan", "Närvaromarkering", "Lead-magnet") + "Övriga". Den nya indelningen följer Marcus UI-gruppering.

#### Förslag på ny struktur (OMSTRUKTURERA)

```text
## Automationssekvenser

A1–A11 är grupperade i 3 kategorier i Airtable Automations-UI:t. 
Vi följer samma struktur här för att matcha Marcus mentala modell.

### Grupp 1: När någon anmäler sig till event (A1, A2, A3)

[Sekvens 1 — Ny anmälan, befintligt innehåll, MEN:]
- Lägg till explicit hänvisning till §A2:s 4 grenar
- Beskriv tydligare att A11 ligger i "Övervakning"-gruppen 
  men kedjas på A3:s creates

### Grupp 2: Annat engagemang (A4, A5)

[Sekvens 3 — Lead-magnet, befintligt innehåll, BEHÅLL]

### Grupp 3: Övervakning (A6, A7, A8, A9, A10, A11)

#### A6 — Event fullbokat
[befintligt + verifiera triggervillkor — markera [HYPOTES] om ej verifierat]

#### A7 — Synka ej mottagna slutbetalningar
[befintligt + utöka — uppdaterar Eventplanering vid varje 
Anmälningar-uppdatering, kostsamt vid massuppdateringar]

#### A8 — Tidstämpel vid närvarostatus-ändring
[befintligt + lägg till "<60s latens, verifierat 26-april"]

#### A9 / A10 — Markera närvaro
[Sekvens 2 — Närvaromarkering, befintligt innehåll, BEHÅLL]

#### A11 — Koppla deltagande till person
[utöka — kedjas på A3:s creates]
```

| Op | Detalj |
|---|---|
| OMSTRUKTURERA | Hela sektionen enligt skissen ovan. |
| BEHÅLL | Sekvens 1, 2, 3 innehåll — strukturen ska bara grupperas om |
| RÄTTA | A6 villkor "Anmäld beläggning (%) = 1" — markera som [HYPOTES — EJ VERIFIERAD] eller verifiera via JSON-extrakt (`fld...beläggning`-villkoret). Källa: 01-extraction §B.A6. |
| UTÖKA | A7 — lägg till "OBS: triggas vid VARJE uppdatering, inte bara betalningsändring" (det finns redan, behåll). |
| UTÖKA | A8 — lägg till "verifierad latens <60s (session-26-fortsattning §Punkt 4-rättning)" |

### 2.10 Edge Functions (rad 470-487)

| Op | Detalj |
|---|---|
| OMSTRUKTURERA | Nuvarande tabell är minimal. Ersätt med detaljerade kontrakt per funktion enligt 01-extraction §I. |
| LÄGG TILL | Per funktion: endpoint, request body schema, write-paths, hårdkodade värden, 422/409-fall, antaganden om kaskad. Källa: 01-extraction §I.1–I.7. |
| LÄGG TILL | Specialundersektion "send-email — patchAfterSend / patchWaitlistAfterSend / patchByType-dispatcher" + TEMPLATE_MAP (5 entries). Källa: 01-extraction §I.7 + §J.1. |
| RÄTTA | Rad 484 — `generate-template-image` "ScreenshotOne PNG-export" — verifiera om denna fortfarande används. Manifestet säger inga Airtable-IDs. Kan vara kvar som metadata-funktion. |
| RÄTTA | Rad 486 — "create-admin-user — Skapar admin-konton" — OK men markera "Ej Airtable-skrivande". |
| LÄGG TILL | Avslut: "8 planerade Edge Functions för Miranon Media-appen — se `miranon-media-admin/src/data/adapters/AirtableAdapter.ts` (TODO)." (existerar redan, behåll). |

### 2.11 Kända fällor (rad 489-548)

UTÖKA från 22 fällor till uppskattningsvis 30 — vi har 9 nya från 01-extraction §D + ev. Mail-fällor från §J.

| Op | Detalj |
|---|---|
| BEHÅLL | Fällor 1-15 (rad 495-525) — alla fortsatt giltiga |
| BEHÅLL | Fälla 16 (rad 525) — manuella rader |
| BEHÅLL | Fällor 17-20 (rad 527-533) — Airtable-tekniska fällor |
| UTÖKA | Fälla 21-22 (rad 535-546) — namnlösa Personer. Innehållet är bra. Kanske utöka med "live-stickprov 2026-04-28: 2 namnlösa Personer skapade 26-april via lead-process" (DQ6). |
| LÄGG TILL | Fälla 23: **RECORD_ID()-formler returnerar fel record-ID** (DS6/DQ7). Källa: 01-extraction §D.1. Komplett text behövs — förklarar att "Anmälan (ID)" och "Event (ID)" på Deltaganden returnerar Deltagandets eget ID, inte länkat record's. RECORD_ID() accepterar inga argument. Konsumenter måste använda `fldGC2MziEfqIPeZP Eventkey (lookup)` istället. |
| LÄGG TILL | Fälla 24: **`Vill anmäla sig till` har case-dubletter** (DQ1). "Resor i medvetandet 1" vs "Resor i Medvetandet 1" som separata options. Påverkar A1-matchning, segmentering, statistik. Källa: 01-extraction §D.2. |
| LÄGG TILL | Fälla 25: **Tomma singleSelects** — `Manuella flagga` (Personer.fldNtwQt6tOCIdf4f) och `Systemkälla` (Touchpoints.fldSXO9yRrxVceBkp) har choices=[]. Källa: 01-extraction §D.3. |
| LÄGG TILL | Fälla 26: **SHA256-hashar i Hämtade erbjudanden.Källa** — `fldF9SgJS1Zv5kmtr` har två 64-tecken hash-strängar som options. Sannolikt webhook-källa-IDs. [HYPOTES — EJ VERIFIERAD]: behöver mappas till läsbara namn. Källa: 01-extraction §D.4. |
| LÄGG TILL | Fälla 27: **`Är aktiv (1/0)` exkluderar inte "Inställt"** (DS1). Mia Hasselgren #2 + Daniel Finnhult #28 räknas som aktiva trots Inställt-Status. Åtgärd: uppdatera formeln till `IF(OR(Status="Avbokad/Ombokad", Status="Inställt"), 0, 1)`. Källa: 01-extraction §D.6. |
| LÄGG TILL | Fälla 28: **Två parallella `Antal genomförda event`-formler** (DS5/DQ7). `flddymQaYJGVCInzq` (gammal rollup) + `flddy8JND3YnlgZxe` (ny formula). Gamla markerad för borttagning efter MK 2026-05-03. Risk: konsumenter som pekar på gamla får data utan RIM 3. Källa: 01-extraction §D.7. |
| LÄGG TILL | Fälla 29: **Mail-PATCH-misslyckande är osynligt** (DQ8). `send-email` Edge Function returnerar ok-status även om `patchAfterSend` failar — mail går iväg, UI visar inte timestamp. Felsökning: Cloud → Edge functions → Logs. Källa: 01-extraction §F.3. |
| LÄGG TILL | Fälla 30: **Väntelista→Anmälningar-flytt: dubblettsrisk** (DQ9). Om PATCH `Flyttad till anmälan = true` misslyckas → person både på väntelistan och i Anmälningar. Felhantering oklar — verifiera. Källa: 01-extraction §F.4. |
| BEHÅLL | Resend-fällor från 01-extraction §J.3 hör hemma i en ny **§Mail-flöden**-sektion, inte i Kända fällor (annars riskerar listan bli övergroddad). |

### 2.12 Datakvalitetsstatus (rad 550-588)

| Op | Detalj |
|---|---|
| RÄTTA | Hela sektionen är från 2026-04-16. Inaktuell. |
| RÄTTA | Code räknar om Deltaganden-distribution från live-state 2026-04-28 (1 500 records). Uppdatera tabellen. |
| RÄTTA | "Medveten Kontakt"-sektionen (rad 568-575) — uppdatera till aktuella siffror (87 anmälda 2026-04-28, 216 deltaganden, max=88). |
| RÄTTA | "De 30 verifierade Närvarande-posterna" (rad 579-583) — verifiera om antalet ändrats efter backfillen. |
| RÄTTA | "~285 Ej avstämt på genomförda event" (rad 585-587) — detta är förbackfill-volym. Backfillen löste detta. Uppdatera till "Pre-backfill: ~285 saknade. Post-backfill: löst — se §Backfill — historik." |

### 2.13 Backfill-strategier (rad 590-614)

OMSTRUKTURERA. Sektionen är skriven i "att göra"-tonläge. Backfillen är klar 2026-04-19 (verifierad 2026-04-24, åtgärdssession 2026-04-26).

| Op | Detalj |
|---|---|
| OMSTRUKTURERA | Byt rubrik från "Backfill-strategier" till "Backfill — historik". |
| RÄTTA | Inledningen (rad 592) — "För att kurshistorik-rollups ska få meningsfulla värden retroaktivt" → "Backfillen kördes 2026-04-19 enligt Scenario B (batch-markering). Detaljer i `psionautics/docs/backfill/`." |
| BEHÅLL | Scenario A/B/C/Hybrid-beskrivningarna — pedagogiskt värdefulla att behålla för referens. Markera "Genomfört val: Scenario B." |
| LÄGG TILL | Ny undersektion "Resultat" — 459 backfill-Anmälningar + 924 backfill-Deltaganden importerade. 22 nya Eventplanering-records. Verifierad 2026-04-24. Pekare till `psionautics/docs/backfill/verifieringsrapport.md`. |
| LÄGG TILL | Ny undersektion "Lärdomar från backfillen" — kort sammanfattning eller pekare till `psionautics/tasks/sessions/retrospektiv-2026-04-19-backfill.md`. |

### 2.14 Luckor (rad 616-633)

| Op | Detalj |
|---|---|
| BEHÅLL | Lucka 1 (Touchpoints-konsumenter) |
| BEHÅLL | Lucka 2 (Make.com-scenarier i detalj) |
| BEHÅLL | Lucka 3 (Zapier-zaps i produktionskontext) |
| BEHÅLL | Lucka 4 (Path to Conversion-syfte) |
| BEHÅLL | Lucka 5 (Instagram Posts-syfte) |
| BEHÅLL | Lucka 6 (Miranon Media Admin — utbytbar datakälla) |
| BEHÅLL | Lucka 7 (Datamodell-research för världsklass) |
| LÄGG TILL | Lucka 8: **Webhooks i Airtable-basen** — kan inte läsas via MCP. Kräver HAR-export eller Airtable Web API direkt. Källa: 02-live-state §6 + Q9. |
| LÄGG TILL | Lucka 9: **A2-grenordnings-hypotesen** — om namnlös Person finns och Gren 1 matchar, körs Gren 2 aldrig → Anmälan-Person-länken förblir tom. Kvarstår som hypotes. Verifieringsplan: testanmälan med matchande email mot känd namnlös Person. Källa: 01-extraction §B.A2 + Q3/O1. |
| LÄGG TILL | Lucka 10: **EventKey-format-bug i Huvudformulär** — orsaken till "EventKey='11'" istället för "Event-11" är inte verifierad. 5 affected records sanerade men källa-buggen kvarstår. Granskning av HTML-formulärets template-kod på psionautics.se behövs. Källa: 01-extraction §F.2 + Q4/O5. |
| LÄGG TILL | Lucka 11: **Hämtade erbjudanden.Källa SHA256-hashar** — vad är de? Sannolikt webhook-källa-IDs men ej verifierat. Kräver mappningstabell hash → läsbart namn. Källa: 01-extraction §D.4 + O4. |

### 2.15 Ändringslogg (rad 637-641)

| Op | Detalj |
|---|---|
| LÄGG TILL | Ny rad: "2026-04-28 — Version 2. Schema cheat sheet tillagd. Psionautics-tillägg integrerat. RIM 3-tillägg dokumenterat. 8 nya kända fällor (23-30). Backfill-historik integrerad. Insiktskedjan utökad med RIM 3. Datakvalitetsstatus uppdaterad till live-state 2026-04-28. UI-gruppering av automationer adopterad. Edge Functions-kontrakt detaljerade." |

### 2.16 Nya sektioner att lägga till

#### Ny sektion: Mail-flöden (Resend) — LÄGG TILL

Plats: efter §Edge Functions, före §Kända fällor (eller separat).

Innehåll: Mall-katalog (5 mallar), avsändare/reply-to, skarpa skick-historik, Resend-fällor (variabel-case-känslighet, markdown-länkar URL-encodas, bucket-permissions), mail-prickar i admin-tabell.

Källa: 01-extraction §J.

#### Ny sektion: Reverse-flow-scenarier — LÄGG TILL

Plats: efter §Anmälningskedjan, före §Automationssekvenser.

Innehåll: 4 scenarier från 01-extraction §F:

- F.1 Backfill-flödet (kontra A2:s primära designflöde)
- F.2 EventKey-format-bug i Huvudformulär (öppet)
- F.3 Mail-flödet (frontend → Edge Function → Airtable + Resend)
- F.4 Väntelista → Anmälningar-flytt

Källa: 01-extraction §F.

---

## 3. hur-systemet-funkar.md — sektion för sektion

### 3.1 Header (rad 1-7) + Snabbfakta (rad 9-21)

| Op | Detalj |
|---|---|
| RÄTTA | Versionsstämpel "Version 2 · 2026-04-16" → "Version 3 · 2026-04-28" |
| BEHÅLL | Snabbfakta-tabell — verifiera att alla siffror stämmer (18 tabeller, 11 automationer, 7 formulär) |

### 3.2 Ordlista (rad 23-37)

| Op | Detalj |
|---|---|
| BEHÅLL | Alla termer |

### 3.3 Systemöversikt (rad 39-57)

| Op | Detalj |
|---|---|
| BEHÅLL | Diagrammet är pedagogiskt |

### 3.4 De tre kärntabellerna (rad 59-65)

| Op | Detalj |
|---|---|
| BEHÅLL | Tabellen + viktig distinktion-noten |

### 3.5 Scenario 1 — En person anmäler sig (rad 73-91)

| Op | Detalj |
|---|---|
| BEHÅLL | Strukturen och stegen |
| RÄTTA | Steg 4 — säg "Deltaganden-rader skapas (en per session enligt Sessionsmall)" istället för "(en per sessionsdag)". Fångar att Föreläsning/Bonuspass etc. också är sessioner. |

### 3.6 Scenario 2 — Eventet blir fullbokat (rad 93-99)

| Op | Detalj |
|---|---|
<!-- markdownlint-disable-next-line MD056 -->  <!-- tabell-cell-överskott (Vue-referens-doc, frusen) -->
| BEHÅLL |

### 3.7 Scenario 3 — En person går kursen (rad 101-141)

| Op | Detalj |
|---|---|
| BEHÅLL | Hela strukturen |
| RÄTTA | "Nuläge (2026-04-16): 487 av 517 Deltaganden-rader är 'Ej avstämt'" — uppdatera till live-state 2026-04-28. |

### 3.8 Scenario 4 — "Vilka har gått kurs tidigare?" (rad 143-149)

| Op | Detalj |
|---|---|
| RÄTTA | "Lösning: Backfill — gå igenom genomförda kurser, markera närvaro retroaktivt" → "Backfill genomförd 2026-04-19. 924 historiska Deltaganden importerade. Se data-model.md §Backfill — historik." |

### 3.9 Scenario 5 — Lead-magnet (rad 151-159)

| Op | Detalj |
|---|---|
<!-- markdownlint-disable-next-line MD056 -->  <!-- tabell-cell-överskott (Vue-referens-doc, frusen) -->
| BEHÅLL |

### 3.10 Personens tillstånd — vad namnlös Person betyder (rad 161-178)

| Op | Detalj |
|---|---|
| BEHÅLL | Hela sektionen — utmärkt pedagogik |

### 3.11 Vanliga missförstånd (rad 180-188)

| Op | Detalj |
|---|---|
| BEHÅLL | Tabellen |
| KAN UTÖKA | Lägg till en rad: "'Anmälan (ID)' på Deltaganden visar Anmälans ID" → "Nej. RECORD_ID()-formler är buggar — de visar Deltagandets eget ID. Använd Eventkey (lookup) istället." (Möjligen för teknisk för icke-tekniska läsare. Diskutera om vi tar in eller skjuter till data-model.md.) |

**Förslag:** Ta inte in i hur-systemet-funkar.md (för teknisk). Behåll den i data-model.md §Kända fällor 23.

### 3.12 Vad kan gå fel (rad 190-200)

| Op | Detalj |
|---|---|
| UTÖKA | Lägg till rad: "Mail skickades men UI visar inte timestamp" → "PATCH till Airtable misslyckades efter mail-skick. Kolla Cloud → Edge functions → Logs." |
| UTÖKA | Lägg till rad: "Inställt-anmälan visas som aktiv i rapporter" → "Datamodell-skuld i 'Är aktiv'-formeln. Se data-model.md §Kända fällor 27." |

### 3.13 Hur man rättar vanliga fel (rad 202-225)

| Op | Detalj |
|---|---|
| BEHÅLL | Alla 3 procedurer |

### 3.14 Vägen framåt (rad 227-235)

| Op | Detalj |
|---|---|
| RÄTTA | "Backfill av historisk närvaro: Ska köras före deltagarinsikter-rapporten" → "**Klar 2026-04-19.** 924 historiska Deltaganden importerade." |
| RÄTTA | Uppdatera "Miranon Media-admin: Under uppbyggnad" till aktuellt status. |

### 3.15 Ändringslogg (rad 245-249)

| Op | Detalj |
|---|---|
| LÄGG TILL | Ny rad: "2026-04-28 — Version 3. Snabbfakta uppdaterad. Datakvalitetsstatus uppdaterad. Backfillen markerad som klar. Kortare not om Inställt-skulden." |

---

## 4. Master/kopia-fix

Per D4. Två filer i två repon. Idag inkonsistent (psionautics-version har senare edits, men säger sig vara kopia).

### Operationsplan

| Steg | Operation |
|---|---|
| 1 | Skriv ny version av `data-model.md` direkt i `~/Repon/miranon-media-admin/docs/reference/data-model.md`. |
| 2 | Headern på den ska säga: "Primär version. Senast uppdaterad 2026-04-28 (Marcus + Claude)." |
| 3 | Kopiera till `~/Repon/psionautics/docs/reference/data-model.md`. |
| 4 | Headern på psionautics-kopian ska säga: "Kopia för psionautics-projektets Claude-chatt. Primär version: ~/Repon/miranon-media-admin/docs/reference/data-model.md. Senast synkad 2026-04-28." |
| 5 | Samma steg 1–4 för `hur-systemet-funkar.md`. |
| 6 | I miranon-media-admin: skapa `docs/CHANGELOG.md` om den inte finns, lägg till entry för 2026-04-28-revisionen. |

---

## 5. Sammanfattning av ny/ändrade poster

### Per dokument

| Dokument | BEHÅLL | RÄTTA | UTÖKA | LÄGG TILL | OMSTRUKTURERA |
|---|---:|---:|---:|---:|---:|
| `data-model.md` | 8 sektioner | 12 punkter | 14 punkter | 16 punkter (inkl. 8 nya fällor + 4 nya luckor + 2 hela sektioner) | 4 sektioner |
| `hur-systemet-funkar.md` | 9 sektioner | 4 punkter | 2 punkter | 1 punkt | 0 sektioner |

### Beräknad ny storlek

- `data-model.md`: 642 → uppskattningsvis ~900-1000 rader (ökar främst pga Schema cheat sheet, 8 nya fällor, Mail-flöden-sektionen, Reverse-flow-scenarier)
- `hur-systemet-funkar.md`: 282 → uppskattningsvis ~290-300 rader (mestadels mindre ändringar)

### Datamodell-skulder (DS) som dokumenteras i Fas 4

| ID | Skuld | Hamnar i |
|---|---|---|
| DS1 | "Är aktiv" exkluderar inte Inställt | data-model §Kända fällor 27 |
| DS2 | "Återkommande?" missvisande | data-model §Anmälningskedjan (befintligt) + §Kända fällor 5 (befintligt) |
| DS3 | Erfarenhetsbadge dead branches | data-model §Insiktskedjan §Kända buggar (befintligt) + §Kända fällor 6 (befintligt) |
| DS4 | "Totala deltaganden (gammal)" missar RIM 3 | data-model §Snabbreferens + §Kända fällor 28 |
| DS5 | "Antal genomförda event (gammal)" → borttagning | data-model §Kända fällor 28 |
| DS6 | RECORD_ID-bug i Deltaganden | data-model §Kända fällor 23 |

### Datakvalitetsfynd (DQ) som dokumenteras i Fas 4

| ID | Fynd | Hamnar i |
|---|---|---|
| DQ1 | Vill anmäla sig till — case-dubletter | data-model §Kända fällor 24 |
| DQ2 | Manuella flagga choices=[] | data-model §Kända fällor 25 |
| DQ3 | Systemkälla choices=[] | data-model §Kända fällor 25 |
| DQ4 | SHA256-hashar i Hämtade erbjudanden.Källa | data-model §Kända fällor 26 + §Luckor 11 |
| DQ5 | E-post Personer multilineText | data-model §Snabbreferens (typ-skuldsanmärkning) |
| DQ6 | Namnlösa Personer från lead-process | data-model §Kända fällor 21-22 (befintligt, utöka med stickprov) |
| DQ7 | RECORD_ID-bug | data-model §Kända fällor 23 |
| DQ8 | Mail-PATCH-misslyckande osynligt | data-model §Kända fällor 29 |
| DQ9 | Väntelista→Anmälningar-flytt: dubblettsrisk | data-model §Kända fällor 30 |

---

## 6. Implementationsordning för Fas 4

Föreslagen ordning för Code att skriva. Varje steg är en logisk enhet — kontrollera utfallet med Chat innan nästa steg.

| Steg | Vad | Estimat | Beroenden |
|---|---|---|---|
| 4.1 | Master/kopia-fix (skapa miranon-media-admin/docs/reference/data-model.md som primär, kopiera psionautics) | 15 min | – |
| 4.2 | Header + Vad det här dokumentet är + Karta — RÄTTA + uppdatera referens till schema_reference | 20 min | 4.1 |
| 4.3 | **Schema cheat sheet** — ny stor sektion under Snabbreferens | 60 min | 4.1, 02-live-state §3 |
| 4.4 | Snabbreferens — UTÖKA tabell-IDs (Path/Instagram), MK Max=88, kritiska länkfält | 20 min | 4.3 |
| 4.5 | Psionautics-tillägg → "Fält tillagda i april 2026" — OMSTRUKTURERA + UTÖKA | 30 min | 4.3 |
| 4.6 | Den kritiska distinktionen — RÄTTA datum + UTÖKA RIM 3 + uppdatera 487/517-siffror | 25 min | 4.5 |
| 4.7 | Insiktskedjan — UTÖKA RIM 3 i DAG:en + klartext-formler | 30 min | 4.6 |
| 4.8 | Anmälningskedjan — LÄGG TILL "A2:s 4 grenar"-undersektion | 25 min | 4.7 |
| 4.9 | **Reverse-flow-scenarier** — ny stor sektion | 45 min | 4.8 |
| 4.10 | Automationssekvenser — OMSTRUKTURERA enligt UI-grupperna | 60 min | 4.9 |
| 4.11 | Edge Functions — OMSTRUKTURERA + LÄGG TILL detaljerade kontrakt | 60 min | 4.10 |
| 4.12 | **Mail-flöden (Resend)** — ny sektion | 30 min | 4.11 |
| 4.13 | Kända fällor — UTÖKA från 22 → 30 (8 nya: 23-30) | 60 min | 4.12 |
| 4.14 | Datakvalitetsstatus — RÄTTA till live-state 2026-04-28 (kräver Code MCP-anrop för ny distribution) | 30 min | 4.13 |
| 4.15 | Backfill — historik — OMSTRUKTURERA + RÄTTA tonläge | 25 min | 4.14 |
| 4.16 | Luckor — UTÖKA med Lucka 8-11 (webhooks, A2-grenordning, EventKey-bug, SHA256) | 20 min | 4.15 |
| 4.17 | Ändringslogg + commit av data-model.md | 15 min | 4.16 |
| 4.18 | hur-systemet-funkar.md — alla operationer (mestadels små) | 45 min | 4.17 |
| 4.19 | Synk till psionautics-kopior + commit | 15 min | 4.18 |
| 4.20 | **Fas 4 reviewbar leverans** | – | 4.1–4.19 |

**Total estimat:** 9 timmar fokuserat skrivarbete. Delas lämpligen på 2-3 sessioner.

---

## 7. Validering av Fas 4-utfallet — checklista

När Fas 4 är klar ska Chat granska mot:

| # | Test | Hur |
|---|---|---|
| 1 | **Discovery-test.** Code ska kunna utföra valfri PATCH/POST utan get_table_schema. | Plocka 5 random fält från Schema cheat sheet — verifiera att alla relevanta options finns dokumenterade. |
| 2 | **Reverse-flow-test.** Läsare ska förstå A1–A11:s antaganden + bryta-fall. | Plocka 3 reverse-scenarier — verifiera att de adresseras i §Reverse-flow-scenarier eller §Kända fällor. |
| 3 | **Onboarding-test.** Ny utvecklare/Lotta ska förstå systemet utan extern hjälp. | Sätt mig i läsläge — har jag frågor som inte besvaras av dokumenten? |
| 4 | **Källspårbarhet.** Varje påstående ska vara spårbart. | Stickprov 10 påståenden — leta källangivelse eller tydligt fundament. |
| 5 | **Master/kopia-konsistens.** | Diff:a miranon-media-admin- och psionautics-versionerna — endast headers ska skilja. |

---

*Avvaktar Marcus godkännande av Fas 3 innan Fas 4 startar.*
