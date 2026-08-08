---
owner: marcus803
updated: 2026-08-08
review_by: 2026-12-21
status: stable
---

# App↔Airtable — interaktions-kontraktet

Detta dok äger **interaktionen** mellan admin-appen och Airtable-basen: hur appen
**frågar** och **skriver** mot basen, fält-för-fält per Edge Function, plus de
fällor som bor SPECIFIKT i interaktionen (T15-klassen: länk-display ≠ record-ID).
Läsare är **Claude Code vid interaktions-bygge** (primärt Fas 6c och framåt) —
en som ska röra ett Airtable-fält via en Edge Function ska kunna slå upp kontraktet
här utan att läsa källkoden själv, och utan att gå i en känd fälla.

**Färskhets-kontraktet bär hela doket** (se §3): varje mekanik-påstående är
`fil:rad`-belagt mot en känd commit och åldras därför synligt; allt som rör
*deployat tillstånd* är markerat och hänvisat till Code-verifiering, aldrig påstått
som fast fakta. Ett interaktions-dok utan den gränsen blir självt en stale-fälla.

> **Mekanik-belägg i detta dok är läst mot commit `e499a89`.** Fas 6c (2026-06-22)
> ändrade exakt fem filer under `supabase/functions/` sedan den förra stämpeln
> `346c386` (git-verifierat): tre EF:er (`get-registrations` väg D, `get-waitlist` NY,
> `create-registration` NY) + två `_shared` (`airtable-client.ts` ny `createAirtableRecord`,
> `field-allowlists.ts` ny `create-registration`-operation). De berörda sektionerna
> (§5–§9) är re-belagda mot HEAD; övriga belägg är git-verifierat oförändrade. När
> EF-källkoden ändras ska berörda `fil:rad`-belägg och denna commit-stämpel uppdateras
> — det är dokets åldrings-signal.
>
> **TASK-161.2-rättelsen (2026-08-08, disk-facit `da654409`):** samtliga `fil:rad`-
> citat i §5–§8 var stale (koden växte kraftigt efter `e499a89` utan att stämpeln
> följdes upp — exakt den drift stämpel-mekanismen ovan finns för att fånga) och är
> nu omverifierade och rättade mot disk. **Känd, kvarstående lucka (ej stängd i denna
> passering):** katalogen dokumenterar fortfarande bara ett delmoment av dagens
> Edge Function-yta — se §5 och §7 för de exakta räknetalen. Tre läs-sidans
> berikningar saknar helt narrativ här: `get-events`s `Bor över`-batch
> (`get-events/index.ts:62-87`), `get-event`s `fetchBelaggning`-batchar
> (`get-event/index.ts:51-107`) och `get-registrations`/`get-registration`s
> `berikaPersonhistorik` (`_shared/registration-read.ts:193-250`). Öppet bokfört
> gap, inte en ny stale-fälla — nästa läsare som behöver dessa kontrakt fil:rad-
> belagda får göra det som eget arbete.

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
(`supabase/functions/_shared/airtable-client.ts:10-16`).

Lager-gränsen — appen når datalagret ENDAST via adaptern, aldrig kringgånget — är
en arkitektonisk invariant ([ADR-057](../decisions/ADR-057-lager-oberoende-fitness-invariant.md));
dess fulla modell och fitness-audit hör till T17, inte hit.

---

## 5. Edge Function-kontrakt-katalog

**28 funktioner finns i dag i `supabase/functions/`** (utöver `_shared/`, disk-
räknat `da654409` 2026-08-08). Denna katalog dokumenterar **11** av dem — de som
fanns byggda t.o.m. Fas 6c (2026-06-22, belägg-commit `e499a89`). De resterande
17 (`compute-segment`, `create-event`, `create-event-note`, `get-event-formats`,
`get-event-notes`, `get-leads`, `get-registration`, `get-segments`, `invite-user`,
`save-segment`, `send-email`, `send-registration-confirmation`,
`test-attachments-storage`, `test-invite-completion`, `test-pdf-generation`,
`update-event`, plus write-ytan i §7) är byggda men INTE katalogiserade här —
öppet bokfört gap (se färskhets-banderollen ovan), inte en dold "elva totalt"-
sanning. `[STABIL MEKANIK]` för de 11 katalogiserade — kontrakten är lästa ur
källkoden; huruvida en given funktion är *deployad* är AKTUELLT TILLSTÅND (se §10).

### 5.1 Läs-EF (Airtable → app)

**`get-events`** — alla event. Tabell `Eventplanering` (`get-events/index.ts:9`).
Ingen filter; full `fetchFromAirtable` (`:146`). Mappning `mapEvent` (`:90`) —
formel/rollup-fält via `scalarNumber` (NaN→null), singleSelect via `selectName`.
Inget write, inget länkfilter → ingen T15-exponering. Sedan task-17.5 gör
funktionen även en record-ID-batch mot `Anmälningar` (`fetchBorOverAntalByEvent`,
`:62-87`) för `Bor över`-summeringen per event — batchen är record-ID-baserad
(ej länkfilter), T15-slutsatsen ovan står oförändrad.

**`get-event`** — ett event via `?id`. Tabell `Eventplanering` (`get-event/index.ts:10`).
Single-get `fetchAirtableRecord` (`:212`); null → 404. Mappning `mapEvent` (`:114`).
Bas-fälten är identiska med get-events, men sedan task-18.2 bär `get-event`
DESSUTOM beläggningens innehållsmodell (`fetchBelaggning`, `:75-107`) — två
extra record-ID-batchar (mot `Anmälningar` för Källa/Bor över, mot `Väntelista`
för Flyttad till anmälan) som ger `viaFormular`/`medfoljande`/`vantelista` utöver
`borOverAntal`. Claimet "identisk för EN rad" gäller alltså INTE längre
funktionens fulla output — bara bas-fälten. Ingen filter → ingen T15-exponering
(record-ID-batch, ej länkfilter).

**`get-persons`** — personer, sökbara + paginerade. Tabell `Personer`
(`get-persons/index.ts:18`). Sök via `buildSearchAcrossFieldsFilter` över
`Namn`/`E-post`/`Telefon`/`Ort` (`:107`); cursor-paginering via `fetchAirtablePage`
(`:121`), sort `Namn` asc (`:123`), pageSize default 50 / max 100. SEARCH-mönster,
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
`fetchAirtableRecord` (`:143`); läser dess `Närvaro (records)`-länk och batch-hämtar
Deltaganden via **record-ID-batch** `OR(RECORD_ID()='…')` (`:90`); andra batchen
berikar namn ur `Personer.Namn`. Länkar mappas till första record-ID via
`firstLinkedId` (`:54`). **Kringgår T15 medvetet** (kommentar citerar klassen).

**`get-registrations`** — anmälningar per event/status/flagga. Tabell `Anmälningar`
(sedan task-18.17: `REGISTRATIONS_TABLE`-konstanten flyttad till
`_shared/registration-read.ts:11`, importerad som alias `TABLE_NAME`
`get-registrations/index.ts:20`). **eventId-grenen använder VÄG D**
(`:85-133`, landad Fas 6c): event via `fetchAirtableRecord` (`:88`), läser dess
`Anmälningar (länkat fält)`-länk (`:99`, read-only spegel av `Anmälningar.Event`) och
batch-hämtar via **record-ID-batch** `OR(RECORD_ID()='…')` (`fetchByRecordIds`,
flyttad till `_shared/registration-read.ts:67` sedan task-18.17); status/flagga
filtreras JS-side, sort `Inskickad` desc JS-side (`byInskickadDesc` `:24`,
nulls sist); okänt event → 404. Den **event-lösa grenen** (`:135-179`) är oförändrad —
serverside `buildEqualsFilter` på `Status`/`Flagga` + `combineWithAnd`, sort `Inskickad`
desc. Mappning `mapRegistration` (flyttad till `_shared/registration-read.ts:107`)
läser länkfält `Event`/`Person` → första record-ID (`_shared/registration-read.ts:164-165`).
**Kringgår T15 medvetet** (`get-registrations/index.ts:39`: *"ANVÄNDER MEDVETET INTE
buildLinkedRecordFilter"*) — exakt analogt med `get-attendance`/`get-person` (se §6).
**Odokumenterat här innan TASK-161.2:** eventId-grenen berikar sedan task-18.4/18.10
dessutom varje anmälan med personens gruppdynamik-data via en TREDJE och FJÄRDE
record-ID-batch (`berikaPersonhistorik`, `_shared/registration-read.ts:193-250`) —
`antalGenomfordaEvent`/`erfarenhetsbadge`/`kurshistorik`. Fullt kontrakt ej
narrativt beskrivet här (öppet gap, se färskhets-banderollen).

**`get-waitlist`** — väntelistan som GLOBAL läs-lista (NY, Fas 6c Leverabel 3). Tabell
`Väntelista` (`get-waitlist/index.ts:10`). Serverside-filter `NOT({Flyttad till anmälan})`
(`ACTIVE_FILTER` `:16` — aktiva rader) + valfritt `?event=`-by-name (`buildEqualsFilter`
`:89`); `fetchFromAirtable` (`:101`); sort `createdTime` desc JS-side (`byCreatedTimeDesc`
`:48`, createdTime är record-metadata, ej sorterbart Airtable-fält). Mappning
`mapWaitlistEntry` (`:32`). **GLOBAL design:** `Väntelista.Event` är `singleLineText`-konstant
(ej länkfält) → ingen record-ID-batch, ingen T15-exponering, ingen per-event-distinktion;
vy-konsumenten passar inga filters → de facto global. INGEN 404 (tom lista = giltigt
tillstånd). LÄSER bara.

**`get-mail-log`** — utskicksloggen som GLOBAL läs-lista (NY, Fas 6e L2). Tabell
`Utskickslogg` (`get-mail-log/index.ts:9`). INGET serverside-filter (varje rad = ett
verkligt mailutskick, ingen aktiv-/event-gren); full `fetchFromAirtable` utan options
(`:72`); sort `createdTime` desc JS-side (`byCreatedTimeDesc` `:42`, createdTime är
record-metadata). Mappning `mapMailLogEntry` (`:24`) — länkfält `Utskicks-ID`→Bulkutskick
och `Skickat till`→Personer bevaras som record-ID-ARRAYER (aldrig skalär-reducerade),
`Antal skickade` (formula COUNTA) via `scalarNumber ?? 0`, `Öppningsgrad (%)` (percent-
formula) via `scalarNumber` → decimal 0–1 / null vid 0/0. **GLOBAL design:** ingen
cursor (liten volym → get-waitlist-mönstret, ej get-leads), ingen länk-ID-filter → ingen
T15-exponering, INGEN 404 (tom lista = giltigt tillstånd; Utskickslogg är de facto tom
tills L3 send-email skriver första raden). LÄSER bara — inga formula-fält skrivs.

### 5.2 Skriv-EF (app → Airtable)

**`update-record`** — operations-baserad write (M4). POST `{ operationKey, recordId,
fields }`. `getOperation(operationKey)` (`update-record/index.ts:61`) → okänd op
400; `findDisallowedField` (`:81`) → fält utanför allowlist 400; `recordId` måste
börja på `rec`; därefter `updateAirtableRecord(operation.tableId, …)` (`:102`).
Deny-by-default på alla nivåer. Write-kontraktet (vilka operationer/fält) → §7.

**`create-registration`** — skapar en manuell anmälan (NY, Fas 6c Leverabel 4). Tabell
`Anmälningar` via `create-registration`-operationen (§7). POST→405, `requireUser`→401
(`create-registration/index.ts:113`). **INVARIANT:** `Idempotency-Key` (header eller body)
krävs — saknas → 400 + nyckeln loggas, lagras EJ (`:129-137`, ADR-059). Bygger write-`fields`
SERVER-SIDE (ej klient-`fields`-map): `EventKey` härleds via `fetchAirtableRecord('Eventplanering', eventId)`
→ `EventKey`-formelfältet (`:186-197`), `Event`-länk = `[eventId]`, `Källa="Manuell"`,
`Status="Obekräftad"`, `Inskickad`=ISO. **409** vid dubblett (`:200-226`): `combineWithAnd` av
`Normaliserad e-post` (`LOWER(TRIM)`, replikerad) + `EventKey`-STRÄNG via `buildEqualsFilter`
— ALDRIG på `Event`-länken (T15). `findDisallowedField`-SSOT-grind på de server-byggda fälten,
sedan `createAirtableRecord(operation.tableId, fields)` (`:269`) → 201 `{ registration, record }`.
**Person-länk sätts INTE** — delegeras till automation A2 (`personId` nullable). Sentinel-test:
[ADR-060](../decisions/ADR-060-sentinel-setup-purge-create-conformance.md).

### 5.3 Icke-Airtable-EF

**`create-admin-user`** — skapar en Supabase **Auth**-user (rör INTE Airtable).
Caller-allowlist via env `ADMIN_EMAILS` (`create-admin-user/index.ts:18`);
`supabaseAdmin.auth.admin.createUser` (`:98`) med service-role-key. Tas med för
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
| `buildLinkedRecordFilter` | `airtable-filter.ts:127` | `FIND("rec…", ARRAYJOIN({Fält}))` | **ingen live-caller** (väg D ersatte sista i 6c; dormant kod) | **T15** — `ARRAYJOIN` ger länkens primär-DISPLAY, inte record-ID |
| `buildEqualsFilter` | `airtable-filter.ts:136` | `{Fält} = "värde"` | exakt-match på skalärt fält (Status/Flagga) | inga (skalär, escaped) |
| `buildSearchAcrossFieldsFilter` | `airtable-filter.ts:149` | `OR(SEARCH(LOWER("term"), LOWER(…)))` | fritext-sök över flera fält | inga (SEARCH, ej ID-match) |
| record-ID-batch | inline: `get-person:196`, `get-attendance:90`, `_shared/registration-read.ts:74` (get-registrations/get-registration, sedan task-18.17) | `OR(RECORD_ID()='rec…', …)` | hämta kända records via deras ID, chunkat ≤50 | inga — record-ID är exakt nyckel |

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

- **`get-registrations` är FIXAD via väg D** (`get-registrations/index.ts:85-133`,
  landad Fas 6c) — eventId-grenen använder record-ID-batch via `Anmälningar (länkat fält)`
  (`:99`), ANVÄNDER MEDVETET INTE `buildLinkedRecordFilter` (`:39`). Den bar tidigare den
  latenta buggen i källan (`:67` pre-6c, historisk referens som föregår commit `e499a89`);
  efter väg D har `buildLinkedRecordFilter` **noll live-callers** (grep-verifierat —
  endast dess definition + syntax-enhetstester återstår). **T15-tråden är därmed stängd**
  (`tasks/threads/README.md` T15).
- **`get-attendance` kringgår T15 medvetet** — dess kommentar citerar klassen
  explicit (`get-attendance/index.ts:104-106`: *"ANVÄNDER MEDVETET INTE
  buildLinkedRecordFilter — den matchar länkens primär-display (eventlabel), inte
  record-ID (T15-klass-bugg). Record-ID = enda tillförlitliga nyckeln"*).
  **`get-person` är mekaniskt icke-exponerad** via samma record-ID-batch-mönster
  (motiverat av längd/fullständighet, ej explicit T15). Det är den certifierade
  fix-mallen ([[L154]] — "väg D"): record-ID-batch från BÅDA hållen av en relation
  återanvänder en bevisad mall i stället för det display-matchande länkfiltret.

Fixen av `get-registrations` (väg D via `Anmälningar (länkat fält)`) är **landad i
Fas 6c** (se §5-entryn + bullet ovan). `buildLinkedRecordFilter` kvarstår som dormant
kod utan live-caller.

---

## 7. Write-kontraktet

All write går via `update-record` (PATCH), `create-registration` (POST) eller en av
de nyare write-EF:erna (`create-event`, `update-event`, `save-segment`, `send-email`,
`create-event-note` — se §5:s öppna gap, dessa saknar egen §5-katalogpost) + en
operations-allowlist i `supabase/functions/_shared/field-allowlists.ts`.
**Sanningskällan är koden, inte tabellen nedan** — [SECURITY-SPEC §6.1](../specs/SECURITY-SPEC.md)
säger det redan rakt av: *"Operations-registret (`field-allowlists.ts`) är den enda
sanningskällan för 'vad får skrivas av vem.'"* Tabellen här är en underhållen
SPEGLING för uppslag utan att läsa källkoden (§2:s syfte med detta dok) — inte en
konkurrerande andra källa; vid minsta osäkerhet om den fortfarande stämmer vinner
`OPERATIONS`/`getOperation` i koden alltid (ADR-100 §2, karta-aldrig-kopia). Registret
`OPERATIONS` (`:29`) bär i dag **13** operationer (TASK-161.2-rättelse — dokumenterat
som "tre" fram till 2026-08-08; disk-facit `da654409`):

| operationKey | tableId | allowedFields | fil:rad |
|---|---|---|---|
| `mark-registration-fee-paid` | `Anmälningar` | `['Anmälningsavgift']` | `field-allowlists.ts:35-39` |
| `mark-final-payment-paid` | `Anmälningar` | `['Slutbetalning']` | `field-allowlists.ts:48-51` |
| `update-registration-payment-note` | `Anmälningar` | `['Notering anmälningsavgift','Notering slutbetalning']` | `field-allowlists.ts:59-62` |
| `log-payment-reminder` | `Anmälningar` | `['Påminnelse anmälningsavgift skickad','Påminnelse slutbetalning skickad']` | `field-allowlists.ts:71-74` |
| `send-registration-confirmation` | `Anmälningar` | `['Status','Bekräftelse skickad']` | `field-allowlists.ts:84-87` |
| `set-registration-lodging` | `Anmälningar` | `['Bor över']` | `field-allowlists.ts:98-101` |
| `update-person-note` | `Personer` | `['Anteckningar']` | `field-allowlists.ts:106-109` |
| `create-registration` | `Anmälningar` | `['Förnamn','Efternamn','E-post','Mobilnummer','Källa','Status','Antal platser','Notering','Inskickad','EventKey','Event']` | `field-allowlists.ts:124-139` |
| `save-segment` | `Segment` | `['Namn på segment','App-segmentregel','Segmentdefinition']` | `field-allowlists.ts:151-154` |
| `create-event` | `Eventplanering` | `['Event (source)','Typ','Ort','Startdatum','Slutdatum','Månad/år','Max antal platser','Status','Eventtyp','Publicerad på miranon.se','Idempotensnyckel']` | `field-allowlists.ts:173-188` |
| `update-event` | `Eventplanering` | `['Typ','Ort','Startdatum','Slutdatum','Månad/år','Max antal platser','Extra platser','Manuella platser','Status','Deltagarinfo schemalagd','Deltagarinfo auto-utskick avstängt']` | `field-allowlists.ts:205-227` |
| `send-email` | `Utskickslogg` | `['Namn på utskick','Skickat till','Filter snapshot','Mailutskick copy','Utskicks-ID','Idempotensnyckel']` | `field-allowlists.ts:239-249` |
| `create-event-note` | `Anteckningar` | `['Författare','Anteckning','Event']` | `field-allowlists.ts:264-267` |

Mekaniken: `getOperation` (`:272`) slår upp registret (okänd → 400) → `findDisallowedField`
(`:280`) avvisar varje fält utanför `allowedFields` (→ 400). **Deny-by-default**: tom/okänd
operation eller fält utanför listan skrivs aldrig. Tabell per namn (bas-portabilitet,
ADR-050). **Skillnad i deny-yta:** `update-record` tar en klient-`fields`-map (allowlisten
är en klient-nåbar deny), medan de server-byggda operationerna (`create-registration`,
`save-segment`, `create-event`, `update-event`, `send-email`, `create-event-note`) bygger
`fields` SERVER-SIDE ur typade inputs → allowlisten är där en SSOT-grind mot framtida
kod-drift, ej en klient-deny-yta. Operationernas fulla motivering (vägval, live-
verifieringar, ADR-koppling) står som kod-kommentarer i `field-allowlists.ts` ovanför
varje post — inte duplicerad här.

> **⚠ Färskhets-exempel — kod slår kommentar.** `update-record/index.ts:14`
> påstår *"Operations-registret är tomt idag (Discovery 2026-05-04 …)"*. Det är
> **stale** — registret bär 13 operationer (Fas 5.5 t.o.m. task-18.11, se tabellen
> ovan). Källan för write-kontraktet är `field-allowlists.ts`, **aldrig** EF-headern.
> Detta är exakt den drift §3:s gräns finns för: koden är STABIL MEKANIK, EF-headerns
> prosa åldrades osynligt — och samma sak hände doket här (§7:s "tre"-påstående var
> självt STABIL-MEKANIK-prosa som åldrats osynligt, rättat TASK-161.2).

---

## 8. Helper-API:t (`_shared`)

Exporterad yta per fil (belägg `fil:rad`, commit `e499a89`):

| Fil | Roll | Exports (rad) |
|---|---|---|
| `airtable-filter.ts` | Säker `filterByFormula`-konstruktion (injection-skydd) | `escapeFormulaValue` (63), `parseAirtableString` (75), `buildLinkedRecordFilter` (127), `buildEqualsFilter` (136), `buildSearchAcrossFieldsFilter` (149), `combineWithAnd` (168), `SearchField` (144) |
| `field-allowlists.ts` | Write-allowlist för samtliga skriv-EF:er (§7) | `getOperation` (272), `findDisallowedField` (280), `OperationDef` |
| `coerce.ts` | Airtable-typ → ren API-form | `selectName` (30), `scalarString` (41), `scalarNumber` (65), `stringArray` (82) |
| `airtable-client.ts` | Airtable REST-anrops-lager | `fetchFromAirtable` (37), `fetchAirtablePage` (122), `fetchAirtableRecord` (188), `updateAirtableRecord` (226), `createAirtableRecord` (268), `upsertAirtableRecord` (313, ADR-066 — TASK-161.2: saknades helt i denna tabell); bas-ID via env `AIRTABLE_BASE_ID` (10-16) |
| `registration-read.ts` | Delad läs-kärna för Anmälningar (task-18.17, TASK-161.2: saknades helt i denna tabell) | `mapRegistration` (107), `berikaPersonhistorik` (193), `fetchByRecordIds` (67), `REGISTRATIONS_TABLE` (11) |
| `auth.ts` | `requireUser` — auth-gate per EF | `requireUser` |
| `cors.ts` | CORS-headers + preflight | `corsHeadersFor`, `handleCors` |
| `errors.ts` | requestId + felmappning | `generateRequestId`, `mapErrorToResponse` |
| `cursor.ts` | Opak cursor ↔ Airtable-offset | `encodeCursor`, `decodeCursor` |

Coercion-reglerna (varför `scalarNumber` finns, NaN-objekt etc.) är plattform-fällor
— de bor i `airtable-constraints.md` (P10–P13), inte här.

---

## 9. Planerade-men-ej-byggda kontrakt (föreskrivande)

Denna sektion bär interaktions-kontrakt som är PLANERADE men ännu inte på disk —
beskrivna föreskrivande så bygget har en karta, markerade `[AKTUELLT TILLSTÅND —
VERIFIERAS VIA CODE]` (ej byggt) tills EF:en finns och beläggs fil:rad i §5.

> **Alla tre 6c-kontrakten är byggda (2026-06-22)** och har flyttats hit-ut till
> §5-katalogen som STABIL MEKANIK: `get-registrations` väg D (§5.1), `get-waitlist`
> (§5.1, NY), `create-registration` (§5.2, NY). §9 bär därför inga 6c-poster längre.

**Inga planerade-men-ej-byggda kontrakt katalogiserade just nu.** Nästa väntade
poster hör till Fas 6e (Mer-fliken): `send-email` (write, Resend-direkt — ADR-015),
`get-leads` och `get-mail-log` (läs). De beskrivs här föreskrivande när 6e-bygget
inleds; tills dess är adapter-stubbarna `throw 'Not deployed yet — see Fas 6e'`
([`src/data/adapters/AirtableAdapter.ts`](../../src/data/adapters/AirtableAdapter.ts)).

---

## 10. Vad detta dok INTE garanterar

Tre tillstånds-klasser ligger utanför vad någon `fil:rad`-belägg kan fastställa.
Alla är `[AKTUELLT TILLSTÅND — VERIFIERAS VIA CODE]`:

| Klass | Frågan | Verifieras via |
|---|---|---|
| **Deployment-status** | Matchar den deployade EF-bundlen denna commit? Är en given EF överhuvudtaget deployad? | Supabase (Edge Functions-listan + deploy-logg); `supabase functions list` |
| **Secrets / bas-ID** | Vilket `AIRTABLE_BASE_ID` är inkopplat (prod `app8uGPrVCVOm6LfD` vs staging `apphjj8Q7lkXCMsL4`)? Är `ADMIN_EMAILS` satt? | Supabase secret-panelen; ej läsbart ur repo |
| **Live-schema-drift** | Matchar fältnamnen i mappningarna fortfarande live-basens schema? | Airtable MCP / `get_table_schema` (T16:s domän, `data-model.md`) |

Koden är fail-fast utan prod-fallback (`airtable-client.ts:10-16`), men *vilket*
bas-ID som är inkopplat är runtime-tillstånd, inte kod.

---

## 11. Ändringslogg

| Datum | Ändring |
|---|---|
| 2026-06-21 | **Skapad** (Session 28, T19). Initial/föreskrivande version, belägg-bas commit `346c386`. Fyller interaktions-nischen vid sidan av de tre befintliga reference-ytorna; byggd FÖRE Fas 6c som karta för första write-flödet. 6c validerar och fyller §9 när EF:erna landar. |
| 2026-06-21 | **Pass 2-rättelse** (Session 28, T19). §9 get-waitlist: `Väntelista.Event` (`fldC01Nf3lVWrOgdw`) live-verifierat `singleLineText`-konstant (ej länkfält; MCP-pull mot prod) → ingen T15-exponering, event-filtrering återställd till ÖPPEN design-fråga (Session 26 `:223-224`) i stället för föreskrivet kontrakt. §5/§6 get-person: rättat över-attribuering — `get-person` är mekaniskt icke-T15-exponerad men citerar inte klassen; explicit T15-citat tillhör `get-attendance:100-101`. §6: skilde källkods-mekanik (`:67`) från deploy-tillstånd. |
| 2026-06-21 | **§9-berikning** (Session 28, T19). get-waitlist: verifierat nuläge inlagt — väntelistan de facto global idag (ett brand "Psionautics", ett event, `singleLineText`-konstant); per-event-behov finns ej i basen; öppna design-frågan intakt. Samordnad med `data-model.md:221`-fix (brand-värde "Psionautics", ej event-namn). |
| 2026-06-22 | **§9 → STABIL MEKANIK** (Session 26-fortsättning, 6c-completion, L4). Alla tre §9-kontrakt byggda i Fas 6c → markörerna ersatta med fil:rad-belagda kontrakt i §9. (Supersederad samma dag av nästa rad — kontrakten flyttades till §5.) |
| 2026-06-22 | **Full stamp-honest reconciliation** (Session 26-fortsättning, L5, väg X). En §9-ensam edit (raden ovan) bröt §5↔§9-koherensen — self-review fångade. KOMPLETT fix: **stämpel `346c386` → `e499a89`** (git-verifierat 5 ändrade filer: 3 EF + 2 `_shared`). §5 (EF-katalog): `get-registrations` → väg D `:128-170`; **NYA** `get-waitlist` + `create-registration` katalogiserade; "Nio" → "Elva funktioner". §6: `:67`-T15-buggen → väg D landad, `buildLinkedRecordFilter` noll live-callers (**T15 stängd**), record-ID-batch-raden + dormant-markering. §7: "två" → "tre" operationer (create-registration-rad), `getOperation`/`findDisallowedField` rad-skift 52/60→76/84. §8: `createAirtableRecord` (276) tillagd, belägg-commit → HEAD. §9: tömd på 6c-poster (flyttade till §5), åter "planerade-men-ej-byggda" (nästa: 6e). Doket nu internt konsistent + SANT vid HEAD. Återstår: T19 Pass 2 bredare prosa-granskning (ej 6c-fotavtrycket). |
| 2026-08-08 | **TASK-161.2-rättelsen (styrande-docs-auditen, disk-facit `da654409`).** Radreferenserna hade åldrats osynligt sedan `e499a89` (2026-06-22) utan att stämpeln följdes upp — exakt den drift §3 finns för att fånga. Samtliga ~50 `fil:rad`-citat i §4–§8 omverifierade mot HEAD och rättade (`get-events`, `get-event`, `get-persons`, `get-attendance`, `get-registrations`, `get-mail-log`, `create-registration`, `create-admin-user`, `airtable-client.ts`, `field-allowlists.ts`). **Räknetal rättade:** §5 "Elva funktioner" → 28 på disk / 11 katalogiserade (öppet gap bokfört, resten ej dokumenterade i denna passering); §7 "tre operationer" → 13 (tabellen fylld fullständigt, källan är `field-allowlists.ts` direkt). **Strukturell drift korrigerad:** `get-registrations`s läs-kärna (`mapRegistration`, `berikaPersonhistorik`, `fetchByRecordIds`) flyttade till `_shared/registration-read.ts` i task-18.17 — doket citerade fortfarande de gamla `get-registrations/index.ts`-raderna. **Sakligt felaktigt claim rättat:** "`get-event` identisk med get-events för EN rad" — `get-event` bär sedan task-18.2 dessutom `fetchBelaggning`. **Ny export tillagd i §8:** `upsertAirtableRecord` (ADR-066) saknades helt. **Kvarstående, öppet bokfört gap (ej stängt denna passering):** tre läs-sidans berikningar (get-events Bor-över-batch, get-event Beläggning-batch, get-registrations/get-registration Personhistorik-berikning) och 8 write-EF:er som §7:s fulla operations-tabell avslöjade (`create-event`, `update-event`, `save-segment`, `send-email`, `create-event-note` m.fl.) saknar §5-katalogpost — flaggat, inte skrivet, för att hålla denna rättelse till mätt drift (räkning + referenser) i stället för att föda ny onarrativt verifierad text (elimination/disk-synk-principen, TASK-161 § Implementationsbeslut). |
