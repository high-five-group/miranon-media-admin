---
owner: marcus803
updated: 2026-06-21
review_by: 2026-12-21
status: stable
---

# App↔Airtable — interaktions-kontraktet

Detta dok äger **interaktionen** mellan admin-appen och Airtable-basen: hur appen
**frågar** och **skriver** mot basen, fält-för-fält per Edge Function, plus de
fällor som bor SPECIFIKT i interaktionen (T15-klassen: länk-display ≠ record-ID).
Läsare är **Claude Chat/Code vid interaktions-bygge** (primärt Fas 6c och framåt) —
en som ska röra ett Airtable-fält via en Edge Function ska kunna slå upp kontraktet
här utan att läsa källkoden själv, och utan att gå i en känd fälla.

**Färskhets-kontraktet bär hela doket** (se §3): varje mekanik-påstående är
`fil:rad`-belagt mot en känd commit och åldras därför synligt; allt som rör
*deployat tillstånd* är markerat och hänvisat till Code-verifiering, aldrig påstått
som fast fakta. Ett interaktions-dok utan den gränsen blir självt en stale-fälla.

> **Mekanik-belägg i detta dok är läst mot commit `346c386`** (`supabase/functions/`
> oförändrad sedan dess). När EF-källkoden ändras ska berörda `fil:rad`-belägg och
> denna commit-stämpel uppdateras — det är dokets åldrings-signal.

---

## 1. Innehåll

1. Innehåll (denna)
2. Vad detta dok är / inte är
3. Färskhets-kontraktet (STABIL MEKANIK vs AKTUELLT TILLSTÅND)
4. Interaktions-arkitektur (översikt)
5. Edge Function-kontrakt-katalog
6. Filter-mönster-kontraktet (+ T15-asymmetrin)
7. Write-kontraktet (field-allowlists)
8. Helper-API:t (`_shared`)
9. Planerade-men-ej-byggda kontrakt (föreskrivande)
10. Vad detta dok INTE garanterar
11. Ändringslogg

---

## 2. Vad detta dok är / inte är

Detta dok äger app↔Airtable-KONTRAKTET: vilka fält varje Edge Function läser och skriver, mappningarna, filter-mönstren, write-allowlisten, helper-API:t (_shared), och fällorna SPECIFIKT i interaktionen. Det fyller interaktions-nischen vid sidan av de tre befintliga reference-ytorna — det river ingen och dubblerar ingen:

- `data-model.md` = schema + datakvalitet (vad fälten ÄR, fält-IDs, formler, §Kända fällor).
- `airtable-constraints.md` = plattformens strukturella väggar (vad Airtable inte kan; T15-klassens ROT bor i P7–P9).
- `hur-systemet-funkar.md` = mänsklig affärslogik (Gunilla-nivå berättelse, inga fält-/kod-kontrakt).
- `airtable-interaction.md` (detta) = hur appen FRÅGAR och SKRIVER mot basen + fällorna i interaktionen.

GRÄNS MOT T17 (system-/arbetssätts-dok, ej byggt än): detta dok äger interaktions-KONTRAKTET; T17 äger den bredare arkitekturen (lager-modell, adapter-swappbarhet, deploy, hub/spoke, skills) och REFERERAR hit. Testet: "hur rör appen ett Airtable-fält och vilken fälla lurar där" → detta dok. "hur är systemet byggt runt interaktionen" → T17. Låt inte detta dok svälla in i T17:s territorium (SSOT: en kunskap, en ägare, pekare ej överlapp).

---

## 3. Färskhets-kontraktet

Detta dok skiljer två klasser av påståenden och får ALDRIG blanda ihop dem:

- STABIL MEKANIK — härlett ur kod på en känd commit (fält-mappningar, filter-mönster, write-allowlist, helper-API). Dokumenterbart sant. Varje sådant påstående beläggs `fil:rad` + commit-sha så det är granskningsbart och åldras synligt.
- AKTUELLT TILLSTÅND — vad som är deployat just nu, vilka secrets/bas-ID som är inkopplade, och om live-Airtable-schemat fortfarande matchar mappningarna. Detta är per projektets "index ≠ live-HEAD"-princip ALDRIG dokumenterbart som sanning här. Sådana påståenden MARKERAS `[AKTUELLT TILLSTÅND — VERIFIERAS VIA CODE]` med pekare till verifierings-vägen (Code/MCP/Supabase), aldrig som fast fakta.

Ett interaktions-dok utan denna gräns blir självt en stale-fälla — samma klass som EF-sektionen Session 27 tömde. Markör-konventionen speglar data-model.md:s `[HYPOTES — EJ VERIFIERAD]`.

---

## 4. Interaktions-arkitektur (översikt)

Dataflödet är enkelriktat genom ett adapter-lager:

```text
React-app  →  DataSourceAdapter  →  callEdgeFunction  →  Edge Function (Deno)
                                                              │
                                                       _shared/-helpers
                                                              │
                                                       Airtable REST  (api.airtable.com/v0)
```

Edge Functions adresserar Airtable-tabeller per **NAMN**, inte tbl-id, så samma
funktion kör mot prod- eller staging-bas utan kod-ändring (bas-portabilitet,
ADR-050). Bas-ID läses fail-fast ur env `AIRTABLE_BASE_ID` utan hårdkodad fallback
(`supabase/functions/_shared/airtable-client.ts:8`).

Lager-gränsen — appen når datalagret ENDAST via adaptern, aldrig kringgånget — är
en arkitektonisk invariant ([ADR-057](../decisions/ADR-057-lager-oberoende-fitness-invariant.md));
dess fulla modell och fitness-audit hör till T17, inte hit.

---

## 5. Edge Function-kontrakt-katalog

Nio funktioner i `supabase/functions/` (utöver `_shared/`). Belägg mot commit
`346c386`. `[STABIL MEKANIK]` hela sektionen — kontrakten är lästa ur källkoden;
huruvida en given funktion är *deployad* är AKTUELLT TILLSTÅND (se §10).

### 5.1 Läs-EF (Airtable → app)

**`get-events`** — alla event. Tabell `Eventplanering` (`get-events/index.ts:9`).
Ingen filter; full `fetchFromAirtable` (`:51`). Mappning `mapEvent` (`:12`) —
formel/rollup-fält via `scalarNumber` (NaN→null), singleSelect via `selectName`.
Inget write, inget länkfilter → ingen T15-exponering.

**`get-event`** — ett event via `?id`. Tabell `Eventplanering` (`get-event/index.ts:10`).
Single-get `fetchAirtableRecord` (`:75`); null → 404. Mappning `mapEvent` (`:16`),
identisk med get-events för EN rad. Ingen filter → ingen T15-exponering.

**`get-persons`** — personer, sökbara + paginerade. Tabell `Personer`
(`get-persons/index.ts:18`). Sök via `buildSearchAcrossFieldsFilter` över
`Namn`/`E-post`/`Telefon`/`Ort` (`:100`); cursor-paginering via `fetchAirtablePage`
(`:114`), sort `Namn` asc (`:116`), pageSize default 50 / max 100. SEARCH-mönster,
ingen länk-ID-match → ingen T15-exponering. `Ort` (rollup) bevaras som array via
`stringArray`.

**`get-person`** — en person + kurshistorik (aggregerande). Tabeller `Personer` +
`Deltaganden` (`get-person/index.ts:9-10`). Person via `fetchAirtableRecord` (`:172`,
null→404); historik via **record-ID-batch** `OR(RECORD_ID()='…')` chunkad över
`personRecord.fields['Deltaganden']` (`:196`). **Ej T15-exponerad** — record-ID-batch
matchar exakt record-ID, inte länk-display. (Kommentaren motiverar batchen med
formel-/URL-längd + historik-fullständighet, `:26-38`/`:182-188`, INTE explicit T15;
mönstret kringgår klassen oavsett motiv.)

**`get-attendance`** — närvaro per event (aggregerande). Tabeller
`Eventplanering`, `Deltaganden`, `Personer` (`get-attendance/index.ts:9-11`). Event via
`fetchAirtableRecord` (`:138`); läser dess `Närvaro (records)`-länk och batch-hämtar
Deltaganden via **record-ID-batch** `OR(RECORD_ID()='…')` (`:85`); andra batchen
berikar namn ur `Personer.Namn`. Länkar mappas till första record-ID via
`firstLinkedId` (`:50`). **Kringgår T15 medvetet** (kommentar citerar klassen).

**`get-registrations`** — anmälningar per event/status/flagga. Tabell `Anmälningar`
(`get-registrations/index.ts:14`). Filter: **`buildLinkedRecordFilter('Event', eventId)`**
(`:67`) + `buildEqualsFilter` på `Status` (`:70`) / `Flagga` (`:73`), kombinerade med
`combineWithAnd` (`:75`); sort `Inskickad` desc (`:89`). Mappning `mapRegistration`
(`:16`) läser länkfält `Event`/`Person` → första record-ID (`:38-39`).
**⚠ Bär den latenta T15-buggen** — `buildLinkedRecordFilter` mot ett länkfält
matchar länkens primär-display, inte record-ID (se §6).

### 5.2 Skriv-EF (app → Airtable)

**`update-record`** — operations-baserad write (M4). POST `{ operationKey, recordId,
fields }`. `getOperation(operationKey)` (`update-record/index.ts:61`) → okänd op
400; `findDisallowedField` (`:81`) → fält utanför allowlist 400; `recordId` måste
börja på `rec`; därefter `updateAirtableRecord(operation.tableId, …)` (`:102`).
Deny-by-default på alla nivåer. Write-kontraktet (vilka operationer/fält) → §7.

### 5.3 Icke-Airtable-EF

**`create-admin-user`** — skapar en Supabase **Auth**-user (rör INTE Airtable).
Caller-allowlist via env `ADMIN_EMAILS` (`create-admin-user/index.ts:18`);
`supabaseAdmin.auth.admin.createUser` (`:88`) med service-role-key. Tas med för
fullständighet — den frågar/skriver aldrig mot basen.

**`test-auth`** — minimal endpoint som bara kör `requireUser` och returnerar
`{ ok, userId }`. Test-prefix → når aldrig prod-deploy-pipen. Ingen Airtable-kontakt.

---

## 6. Filter-mönster-kontraktet

Fyra mönster når Airtables `filterByFormula`. Tre är builders i
`supabase/functions/_shared/airtable-filter.ts`; det fjärde är en inline-konstruktion
i callern.

| Mönster | Var | Formel | När-använd | Fälla |
|---|---|---|---|---|
| `buildLinkedRecordFilter` | `airtable-filter.ts:127` | `FIND("rec…", ARRAYJOIN({Fält}))` | filtrera på ett **länkfält** | **T15** — `ARRAYJOIN` ger länkens primär-DISPLAY, inte record-ID |
| `buildEqualsFilter` | `airtable-filter.ts:136` | `{Fält} = "värde"` | exakt-match på skalärt fält (Status/Flagga) | inga (skalär, escaped) |
| `buildSearchAcrossFieldsFilter` | `airtable-filter.ts:149` | `OR(SEARCH(LOWER("term"), LOWER(…)))` | fritext-sök över flera fält | inga (SEARCH, ej ID-match) |
| record-ID-batch | inline: `get-person:196`, `get-attendance:85` | `OR(RECORD_ID()='rec…', …)` | hämta kända records via deras ID, chunkat ≤50 | inga — record-ID är exakt nyckel |

Alla user-värden går genom `escapeFormulaValue` (`airtable-filter.ts:63`,
formula-injection-skydd); fältnamn är hårdkodade i callern.

### T15-asymmetrin (dokets centrala tes)

`buildLinkedRecordFilter` bygger `FIND(recordId, ARRAYJOIN({Event}))`. `ARRAYJOIN`
över ett länkfält exponerar den länkade radens **primär-display** (eventlabel), inte
dess record-ID — så `FIND("recABC…", "Miranon Höst 2026")` matchar **aldrig** mot
skarp länk-data. Enhetstest av formel-SYNTAX bevisar inte match-SEMANTIK mot riktig
data ([[L153]]). Roten är en plattform-vägg, inte en bugg i vår kod —
`airtable-constraints.md` **P7–P9** (`#### P7` rad 120: ARRAYJOIN exponerar display;
`#### P8` rad 137: `RECORD_ID({länk})` ignorerar argumentet; `#### P9` rad 150:
lookup ger ID-array, inte primärvärde). Förklaringen bor där — duplicera den inte.

**Asymmetrin i källkoden:**

- **`get-registrations` har buggen i källan** (`get-registrations/index.ts:67`) — den
  enda kvarvarande `buildLinkedRecordFilter`-mot-länkfält-callern. Latent tills filtret
  körs mot skarp länk-data (smäller i 6c:s "Anmälda per event"). Huruvida denna källa är
  deployad är `[AKTUELLT TILLSTÅND — VERIFIERAS VIA CODE]` (se §10).
- **`get-attendance` kringgår T15 medvetet** — dess kommentar citerar klassen
  explicit (`get-attendance/index.ts:100-101`: *"ANVÄNDER MEDVETET INTE
  buildLinkedRecordFilter — den matchar länkens primär-display (eventlabel), inte
  record-ID (T15-klass-bugg). Record-ID = enda tillförlitliga nyckeln"*).
  **`get-person` är mekaniskt icke-exponerad** via samma record-ID-batch-mönster
  (motiverat av längd/fullständighet, ej explicit T15). Det är den certifierade
  fix-mallen ([[L154]] — "väg D"): record-ID-batch från BÅDA hållen av en relation
  återanvänder en bevisad mall i stället för det display-matchande länkfiltret.

Fixen av `get-registrations` (väg D via `Anmälningar (länkat fält)`) är planerad,
inte byggd → §9.

---

## 7. Write-kontraktet

All write går via `update-record` + en operations-allowlist i
`supabase/functions/_shared/field-allowlists.ts`. Registret `OPERATIONS` (`:29`)
bär i dag **två** operationer:

| operationKey | tableId | allowedFields | fil:rad |
|---|---|---|---|
| `mark-registration-fee-paid` | `Anmälningar` | `['Anmälningsavgift']` | `field-allowlists.ts:35-38` |
| `update-person-note` | `Personer` | `['Anteckningar']` | `field-allowlists.ts:44-46` |

Mekaniken: klient skickar `{ operationKey, recordId, fields }` → `getOperation`
(`:52`) slår upp registret (okänd → 400) → `findDisallowedField` (`:60`) avvisar
varje fält utanför `allowedFields` (→ 400). **Deny-by-default**: tom/okänd operation
eller fält utanför listan skrivs aldrig. Tabell per namn (bas-portabilitet, ADR-050).

> **⚠ Färskhets-exempel — kod slår kommentar.** `update-record/index.ts:14`
> påstår *"Operations-registret är tomt idag (Discovery 2026-05-04 …)"*. Det är
> **stale** — registret bär 2 operationer (Fas 5.5 `mark-registration-fee-paid` +
> Session 23 `update-person-note`). Källan för write-kontraktet är
> `field-allowlists.ts`, **aldrig** EF-headern. Detta är exakt den drift §3:s gräns
> finns för: koden är STABIL MEKANIK, EF-headerns prosa åldrades osynligt.

---

## 8. Helper-API:t (`_shared`)

Exporterad yta per fil (belägg `fil:rad`, commit `346c386`):

| Fil | Roll | Exports (rad) |
|---|---|---|
| `airtable-filter.ts` | Säker `filterByFormula`-konstruktion (injection-skydd) | `escapeFormulaValue` (63), `parseAirtableString` (75), `buildLinkedRecordFilter` (127), `buildEqualsFilter` (136), `buildSearchAcrossFieldsFilter` (149), `combineWithAnd` (168), `SearchField` (144) |
| `field-allowlists.ts` | Write-allowlist för `update-record` | `getOperation` (52), `findDisallowedField` (60), `OperationDef` |
| `coerce.ts` | Airtable-typ → ren API-form | `selectName` (30), `scalarString` (41), `scalarNumber` (65), `stringArray` (82) |
| `airtable-client.ts` | Airtable REST-anrops-lager | `fetchFromAirtable` (35), `fetchAirtablePage` (121), `fetchAirtableRecord` (191), `updateAirtableRecord` (234); bas-ID via env `AIRTABLE_BASE_ID` (8) |
| `auth.ts` | `requireUser` — auth-gate per EF | `requireUser` |
| `cors.ts` | CORS-headers + preflight | `corsHeadersFor`, `handleCors` |
| `errors.ts` | requestId + felmappning | `generateRequestId`, `mapErrorToResponse` |
| `cursor.ts` | Opak cursor ↔ Airtable-offset | `encodeCursor`, `decodeCursor` |

Coercion-reglerna (varför `scalarNumber` finns, NaN-objekt etc.) är plattform-fällor
— de bor i `airtable-constraints.md` (P10–P13), inte här.

---

## 9. Planerade-men-ej-byggda kontrakt (föreskrivande)

Följande interaktions-kontrakt är PLANERADE för Fas 6c men finns INTE på disk i denna commit. De beskrivs här föreskrivande så 6c bygger mot en karta — varje post markeras `[AKTUELLT TILLSTÅND — VERIFIERAS VIA CODE]` (ej byggt) och blir STABIL MEKANIK först när EF:en finns och beläggs fil:rad.

**`create-registration` (write, idempotent)** — `[AKTUELLT TILLSTÅND — VERIFIERAS
VIA CODE]` (ej på disk; bekräftat tom grep i `supabase/`). Skapar en anmälan
idempotent. **Det hårdkodade event-värdet `'Event-17'` / `recQ2TPsY69fQXA8a` bor
i forsknings-extraktionen mot det HISTORISKA systemet, INTE i detta repos kod** —
data-model.md nämner `create-registration` som källa för `Källa`-fältet
(`data-model.md:323`), men ingen sådan EF finns ännu. När den byggs avgörs det
faktiska event-värdet då. Idempotens-lagringen är defererad till **Fas E**
([ADR-059](../decisions/ADR-059-idempotens-lagring-defer-fas-e.md)); ingen
`Idempotency Keys`-tabell finns i prod/staging (Session 26 §C1).

**`get-waitlist` (läs)** — `[AKTUELLT TILLSTÅND — VERIFIERAS VIA CODE]` (ej på
disk). Läser egna `Väntelista`-tabellen (`tbl2VxMx7JMkIxD4Q`), aktiv-filtrerad via
`Flyttad till anmälan` (checkbox, `fldqMpSW5UJIhNdgm`).
**Ingen T15-exponering på event-fältet:** `Väntelista.Event` (`fldC01Nf3lVWrOgdw`) är
ett `singleLineText`-KONSTANTFÄLT, INTE ett länkfält (live-verifierat MCP-pull
2026-06-21 mot prod `app8uGPrVCVOm6LfD`: typ `singleLineText`, samma värde
"Psionautics" på alla rader). Ett text-konstantfält bär varken T15-länk-display-
klassen eller kan fungera som per-event-diskriminator — det är alltid samma värde.
**Verifierat nuläge:** väntelistan är de facto GLOBAL idag — ett brand ("Psionautics"),
ett event, `singleLineText`-konstant i `Event`-fältet → ingen per-event-distinktion
finns i datan. Strukturen är byggd att kunna växa (fler Psionautics-event; en
Miranon Media-väntelista är planerad men EJ använd ännu), men behovet av
per-event-filtrering existerar INTE i basen idag.
**Event-filtreringen förblir därför en ÖPPEN design-fråga** (Session 26 §B1, `:223-224`):
behöver get-waitlist event-filtrering alls, eller är väntelistan global
(Mer-flik-konvertering, ej per-event)? Den som bygger get-waitlist i 6c avgör mot
DÅ-aktuell datamodell, inte mot en antagen distinktion — inget filter-kontrakt
föreskrivs här.

> Forensisk not: en tidigare sido-hypotes (Session 26 `:96-97`) antog `Väntelista.Event`
> vara ett länkfält → "samma T15-klass". Live-verifiering 2026-06-21 visar `singleLineText`
> (konstant), i linje med `data-model.md:221`. Denna karta är auktoritativ över den
> pausade sessionsdokens sido-watch på den punkten.

**`get-registrations` T15-fix (väg D)** — `[AKTUELLT TILLSTÅND — VERIFIERAS VIA
CODE]` (ej applicerad; `:67` bär ännu buggen). Fix-vägen är verifierad: record-ID-
batch från event-hållet via `Eventplanering.Anmälningar (länkat fält)`
(`fldUAjTutSM0fziMT`, read-only spegel av `Anmälningar.Event`), exakt analogt med
`Närvaro (records)` som get-attendance redan använder.

Detaljerna (fält-IDs, idempotens-strategi, fix-mall) bor i **Session 26-doket §B1**
samt ADR-059 — duplicera dem inte hit.

---

## 10. Vad detta dok INTE garanterar

Tre tillstånds-klasser ligger utanför vad någon `fil:rad`-belägg kan fastställa.
Alla är `[AKTUELLT TILLSTÅND — VERIFIERAS VIA CODE]`:

| Klass | Frågan | Verifieras via |
|---|---|---|
| **Deployment-status** | Matchar den deployade EF-bundlen denna commit? Är en given EF överhuvudtaget deployad? | Supabase (Edge Functions-listan + deploy-logg); `supabase functions list` |
| **Secrets / bas-ID** | Vilket `AIRTABLE_BASE_ID` är inkopplat (prod `app8uGPrVCVOm6LfD` vs staging `apphjj8Q7lkXCMsL4`)? Är `ADMIN_EMAILS` satt? | Supabase secret-panelen; ej läsbart ur repo |
| **Live-schema-drift** | Matchar fältnamnen i mappningarna fortfarande live-basens schema? | Airtable MCP / `get_table_schema` (T16:s domän, `data-model.md`) |

Koden är fail-fast utan prod-fallback (`airtable-client.ts:8-13`), men *vilket*
bas-ID som är inkopplat är runtime-tillstånd, inte kod.

---

## 11. Ändringslogg

| Datum | Ändring |
|---|---|
| 2026-06-21 | **Skapad** (Session 28, T19). Initial/föreskrivande version, belägg-bas commit `346c386`. Fyller interaktions-nischen vid sidan av de tre befintliga reference-ytorna; byggd FÖRE Fas 6c som karta för första write-flödet. 6c validerar och fyller §9 när EF:erna landar. |
| 2026-06-21 | **Pass 2-rättelse** (Session 28, T19). §9 get-waitlist: `Väntelista.Event` (`fldC01Nf3lVWrOgdw`) live-verifierat `singleLineText`-konstant (ej länkfält; MCP-pull mot prod) → ingen T15-exponering, event-filtrering återställd till ÖPPEN design-fråga (Session 26 `:223-224`) i stället för föreskrivet kontrakt. §5/§6 get-person: rättat över-attribuering — `get-person` är mekaniskt icke-T15-exponerad men citerar inte klassen; explicit T15-citat tillhör `get-attendance:100-101`. §6: skilde källkods-mekanik (`:67`) från deploy-tillstånd. |
| 2026-06-21 | **§9-berikning** (Session 28, T19). get-waitlist: verifierat nuläge inlagt — väntelistan de facto global idag (ett brand "Psionautics", ett event, `singleLineText`-konstant); per-event-behov finns ej i basen; öppna design-frågan intakt. Samordnad med `data-model.md:221`-fix (brand-värde "Psionautics", ej event-namn). |
