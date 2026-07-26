# Check-in skarpt — förarbete som inte kräver prototyp-valet (Code, 2026-07-26)

> **Proveniens.** Skrivet som förarbete inför det skarpa check-in-bygget (T97), på
> väg ut ur S90:s divergens-pass. Allt som påstås om fält, EF-kontrakt, allowlist
> och automationer är läst ur källan och citerat med `fil:rad` eller live-verifierat
> mot basen samma dag. Ingenting här förutsätter att Marcus valt variant — det som
> ÄR variant-beroende är markerat som sådant.
>
> **Nytt fynd i detta pass:** `Avstämt`-ägarskapet (öppen fråga 5 i
> divergens-README:n) är inte längre öppet. Det är LIVE-VERIFIERAT mot prod-basen.
> Se avsnitt 3.

---

## Sammanfattning av besluten

| Fråga | Svar |
|---|---|
| Ny Edge Function eller generisk `update-record`? | **Generisk `update-record`.** Ingen ny EF. |
| Allowlist-post | `set-attendance-status` → `{ tableId: 'Deltaganden', allowedFields: ['Status'] }` |
| Nya bas-fält som krävs | **Noll**, om attribuering väg (a) väljs |
| Attribuering | **Väg (a) — acceptera och dokumentera** (rekommendation, avsnitt 2) |
| `Avstämt` | **A8 äger fältet.** Appen skriver det ALDRIG. Live-verifierat, avsnitt 3 |
| Läs-vägens gap | Utöka `get-attendance` med en tredje record-ID-batch mot Anmälningar |
| Config-ändringar | `update-record` klar. `get-attendance` + `get-event` saknas i prod-allowlisten |

---

## 1. Write-vertikalens exakta form

### 1.1 Utgångsläget, verifierat

`supabase/functions/_shared/field-allowlists.ts` bär 13 operationer
(`field-allowlists.ts:29-268`). **Noll** av dem rör `Deltaganden`. Kontraktet är:

```ts
export interface OperationDef {
  tableId: string;
  allowedFields: readonly string[];
}
```

— `field-allowlists.ts:18-25`. Grinden är `findDisallowedField`
(`field-allowlists.ts:280-289`), som returnerar första fältnamn utanför listan;
`update-record` tolkar det som 400 (`update-record/index.ts:81-95`).

Klientsidan är redan byggd och väntar bara på posten:

- `src/data/adapters/DataSourceAdapter.ts:97` — `updateAttendance(operationKey, id, status)`
- `src/data/adapters/AirtableAdapter.ts:207-209` — implementerad: `this.updateRecord(operationKey, id, { Status: status })`
- `src/data/adapters/SupabaseAdapter.ts:82` — stub (dubbel-källa-kravet uppfyllt)

Med andra ord: hela adapter-vägen finns, med noll callers. Det enda som saknas
mellan appen och basen är en rad i allowlisten och en redeploy.

### 1.2 Den exakta raden

Klistras in i `OPERATIONS`-objektet i `supabase/functions/_shared/field-allowlists.ts`,
efter `create-event-note`-posten (`field-allowlists.ts:264-267`):

```ts
  // Sätt närvarostatus på ett Deltagande (check-in-vertikalen, T97). Dörrens BINÄRA
  // toggle (Ej avstämt ↔ Närvarande) OCH registrets fyra övriga statusvärden går
  // genom SAMMA operation — allowlisten gatar FÄLTET, inte VÄRDET (samma princip
  // som set-registration-lodging kryssar både i och ur, och som bär teardownen i
  // testet). EXAKT ETT fält: 'Status' (fldRFOzNqVswqZ1mN, singleSelect med sex
  // options), LIVE-VERIFIERAT mot staging-schemat (describe_table tbldWHH6sSHWoQPHH,
  // base apphjj8Q7lkXCMsL4, 2026-07-26, L294) INNAN posten låstes.
  // 'Avstämt' (fld61tbzc2fqqf116) ligger MEDVETET utanför listan: automation A8
  // (wfl1iYPrEmlKpEsRU, deployed) triggar på ÄNDRING AV JUST Status och sätter
  // fältet själv — två skribenter på samma fält vore en kapplöpning appen inte kan
  // vinna. Identitets-/strukturfälten (Anmälan, Event, Session, Person (länk)) är
  // skrivbara men ligger utanför: de ÄGS av A3/A11 och att skriva dem vore att
  // om-föräldra raden, inte att checka in någon. 'Noteringar' är skrivbart men hör
  // till registret, inte dörren — läggs till när en yta faktiskt skriver det.
  // Tabell per NAMN (ADR-050 bas-portabilitet).
  'set-attendance-status': {
    tableId: 'Deltaganden',
    allowedFields: ['Status'],
  },
```

### 1.3 Varför exakt ett fält

`Deltaganden` har sju skrivbara fält (schema-bilagan, `deltaganden-schema-live-2026-07-26.md`
rad 10-18). Fyra av dem hade kunnat motiveras och alla fyra är avvisade:

1. **`Avstämt` (`fld61tbzc2fqqf116`, dateTime)** — A8 äger fältet. Se avsnitt 3.
   Detta är listans skarpaste deny-yta och också dess bästa test-fall.
2. **`Noteringar` (`fldpCVTUC0C47ci0S`, multilineText)** — frestande för
   "varför var hen inte här". Men ingen av de tre prototyp-varianterna skriver en
   notering, och den dubbelriktade över-engineering-vakten är entydig: ingen
   abstraktion utan en faktisk nuvarande användare. Läggs till additivt när en yta
   faktiskt bär inmatningen.
3. **`Session` (`fldBPZnsDL0bNIRHx`, singleSelect)** — att skriva den flyttar
   deltagandet till en annan dag. Det är en rättning i registret, inte en
   incheckning, och den ändrar `Närvaropoäng`-kedjans betydelse tyst
   (`data-model.md`: Dag 1 och Föreläsning räknar mot kurshistoriken, Dag 2 inte).
   Hör hemma i en egen operation med egen motivering, om den någonsin behövs.
4. **Länkfälten `Anmälan` / `Event` / `Person (länk)`** — ägs av A3 (förskapar
   deltaganden) och A11 (kopplar person). Live-verifierat: A11 (`wflIHsSbUvoc4BmP5`,
   deployed) triggar på `Anmälan` isNotEmpty AND `Person (länk)` isEmpty. En
   app-skrivning här skulle konkurrera med en automation om samma fält — samma
   klass av fel som `Avstämt`.

Kvar: `Status`. Ett fält, sex kända värden, en formel som konsumerar det.

### 1.4 Ny Edge Function eller generisk `update-record`

**Svar: generisk `update-record`. Ingen ny Edge Function.**

ADR-066 valde uttryckligen motsatsen för create-event — `ADR-066:89` säger "ny EF
`create-event` (egen katalog + `index.ts` `Deno.serve`, ej generisk `update-record`)".
Det var rätt där och fel här, och skälen är avläsbara i vad `create-event/index.ts`
faktiskt gör:

- **Server-side fält-härledning.** `deriveManadAr()` (`create-event/index.ts:76-80`)
  bygger `Månad/år` ur `Startdatum`. Check-in härleder ingenting — status är ett
  värde användaren väljer.
- **Typade inputs i stället för rå `fields`-map** (`create-event/index.ts:198-209`).
  Motiverat när nio fält ska byggas ihop. Vid ETT fält med sex möjliga värden är
  det ceremonin utan innehållet.
- **Idempotens via Airtable-nativ upsert** (`create-event/index.ts:239`,
  `ADR-066` beslut 3). Detta är den avgörande skillnaden: **ADR-066:s hela
  idempotens-driver saknar motsvarighet här.** En dubblerad POST skapar en andra
  event-rad — datakorruption. En dubblerad `PATCH Status='Närvarande'` skapar
  ingenting; den skriver samma värde igen. Check-in är **idempotent av
  konstruktion**, inte genom en mekanism. Ingen `Idempotency-Key`, ingen
  merge-nyckel, inget nytt bas-fält, ingen upsert.

Batch-behovet, som är den enda återstående invändningen, håller inte heller vid
granskning:

- **Dörren behöver ingen batch.** Den skriver en post per person, spridd över
  minuter medan folk kommer in. Airtables tak är 5 anrop/sekund per bas
  (`docs/reference/airtable-constraints.md:82-94`) — dörren ligger flera
  storleksordningar under.
- **Variant A:s "markera alla" är inte heller en batch.** Den är ETT
  checkbox-write på `Eventplanering` som triggar A9 eller A10. En skrivning.
- **Det enda äkta batch-fallet** är variant A:s task-48-grammatik (markera N
  personer → sätt gemensam status), och det fallet är helt variant-beroende. Att
  bygga en batch-EF nu vore att bygga "ifall" — precis vad researchen redan
  förkastade (mönster-researchen §Write-forken: "Batch-EF (fork C) är spekulativ
  komplexitet i dag"). Om A vinner: mät först med begränsad klient-parallellism
  (≤4 samtidiga mot 5/s-taket), bygg batch-EF bara om mätningen kräver det.

**Priset, ärligt redovisat.** `update-record` tar emot en klient-byggd `fields`-map
(`update-record/index.ts:38`), till skillnad från de server-byggda EF:erna.
Allowlisten kan därför gata fältet men inte värdet — en dörr-klient kan tekniskt
skicka `{ Status: 'Avbröt' }`. Det är acceptabelt eftersom det inte finns någon
privilegie-gräns mellan dörr och register: samma autentiserade administratör
(Lotta) får legitimt sätta alla sex värdena. Vore värdegräns per yta någonsin
önskad krävs en dedikerad EF — registreras som kandidat, byggs inte nu.

**Följdbeslut:** en enda operation, inte två. En separat `check-in-attendee` med
`allowedFields: ['Status']` mot samma tabell skulle ha exakt identisk deny-yta och
alltså ge noll extra säkerhet. Den enda skillnaden vore log-dimensionen i
`[update-record] ALLOW | operationKey=…` (`update-record/index.ts:97-99`) — för
tunt för att bära en andra post i en SSOT-lista.

### 1.5 Deny/allow-testparet

**Fil:** `tests/api/update-record.staging.test.ts` — ny `test.describe`-block sist
i filen. **Mall:** bor över-vertikalen, `update-record.staging.test.ts:486-597`.
Den är närmast i form: ett enda fält, toggle åt båda håll, samma operation bär
teardownen, och blocket bär en explicit field-isolerings-not (`:493-495`).

**Deny-testet ska bevisa** att ett ÄKTA, SKRIVBART `Deltaganden`-fält som ligger
medvetet utanför listan fälls före Airtable-anropet — inte bara att okända fält
fälls. Det starkaste valet är `Avstämt`, eftersom det är A8:s fält:

```ts
data: {
  operationKey: 'set-attendance-status',
  recordId: 'recAAAAAAAAAAAAA',
  fields: { 'Avstämt': '2026-07-26T10:00:00.000Z' },
}
// → 400, body.error matchar /not allowed for operation/
```

Samma form som `update-record.staging.test.ts:335-355` (gamla odelade
`Betalningspåminnelse skickad`). Det format-giltiga fake-ID:t passerar
rec-prefix-checken (`update-record/index.ts:73`) så fält-grinden verkligen prövas.

**Allow-testet ska bevisa** att `Status` sätts, läses tillbaka och kan togglas
tillbaka genom samma operation — vilket samtidigt kontraktstestar dörrens
ångra-väg:

1. Läs nuvarande status via `get-attendance?eventId=…` (befintlig EF, ingen
   Airtable-direktåtkomst i testet — samma disciplin som `readSeededBorOver`,
   `update-record.staging.test.ts:498-514`).
2. PATCH `{ Status: 'Närvarande' }` → 200, läs tillbaka.
3. PATCH `{ Status: 'Ej avstämt' }` → 200, läs tillbaka (ångra-vägen bevisad).
4. `finally`: skriv tillbaka ursprungsvärdet.

**Två hårda räcken för testets utformning:**

- **Assertera ALDRIG på `Avstämt`.** A8 är verifierad i PROD, inte i staging (se
  avsnitt 3.3). Ett test som väntar sig en tidsstämpel skulle vara rött i staging
  och grönt i verkligheten — den värsta sortens falsk signal.
- **Rör INTE ZZ-History Person 01:s tre Deltaganden.**
  `tests/api/get-attendance.staging.test.ts:103` asserterar
  `personRow?.status === 'Närvarande'` på just den fixturen. En parallell
  mutation där kolliderar systematiskt (TASK-6-klassen). Fixtur-valet är därför ett
  litet men obligatoriskt förarbete i skivan: härled ett Deltagande som ingen annan
  staging-test asserterar på, hellre än att hårdkoda ett record-ID (ADR-060:s
  uttalade preferens, återgiven i TASK-14:s implementation notes). Räcker inte
  befintlig data, seeda EN permanent `ZZ-Checkin`-fixtur en gång — aldrig per körning.

**Ingen purge-target behövs.** Testet muterar och restaurerar, det skapar inga
rader. Jämför `.purge-staging-policy.json`, vars tre targets alla är
create-sentineler. Det är ett självständigt argument för mutate-and-restore-formen
framför en seed-per-körning: den återackumulering som fällde TASK-14 kan inte
uppstå.

### 1.6 `supabase/config.toml` och `.prod-functions-allowlist.conf`

**Write-vägen kräver ingenting.** `update-record` står redan i båda:
`.prod-functions-allowlist.conf` (raden `update-record`) och `supabase/config.toml`
(`[functions.update-record] verify_jwt = true`). Allowlist-posten är en
källkodsändring i en redan deployad, redan prod-godkänd funktion.

**Läs-vägen kräver två rader.** Mätt mot disk 2026-07-26:

- `.prod-functions-allowlist.conf` saknar 10 skarpa funktioner (plus `test-auth`,
  medvetet). Check-in behöver **`get-attendance`** och **`get-event`** tillagda.
  Utan dem är hela närvaro-läsningen fail-closed mot prod — divergens-README:n
  fångade halva detta (punkt 5), `get-event` är den andra halvan. Filen är
  alfabetiskt sorterad; posterna hör före `get-event-formats`.
- `supabase/config.toml` listar 10 av 23 funktioner. Saknade: `compute-segment`,
  `create-event`, `create-registration`, `get-attendance`, `get-event`,
  `get-event-formats`, `get-mail-log`, `get-person`, `get-segments`, `get-waitlist`,
  `save-segment`, `send-email`, `send-registration-confirmation`, `update-event`.
  Det är TASK-33:s drift, och den har vuxit sedan kortet skrevs ("~7 av ~20").
  Supabase-default `verify_jwt = true` gör utelämnandet **säkert** — men filen
  påstår sig vara deploy-tid-konfig per funktion och är det inte.

**Rekommendation:** lägg `[functions.get-attendance]` och `[functions.get-event]`
med `verify_jwt = true` i samma skiva som prod-allowlist-raderna, och lös
resterande drift som TASK-33 (helst grenen "grind som asserterar att varje
`supabase/functions/*/`-katalog har en post"). Check-in ska inte bära hela
TASK-33 — men den ska inte heller öka driften.

---

## 2. Attribuerings-frågan

`Registrerad av` (`fldhx3tludhu1gH7w`) är av typen `lastModifiedBy`. Fältet är
varken skrivbart eller styrbart; Airtable sätter det till den som senast ändrade
posten, och vid API-skrivning är det **token-ägaren**, inte den inloggade Lotta.

### 2.1 Väg (a) — acceptera och dokumentera

Appen skriver bara `Status`. `Registrerad av` blir integrationskontot för varje
app-skriven incheckning. Konsekvensen bokförs i `data-model.md` §Kända fällor som
en ny post, och i ADR:n som ett medvetet val.

- **Kostnad:** noll bas-ändringar, noll prod-förutsättningar, noll ny EF.
- **Vad som förloras:** ingen kan i efterhand se VEM som checkade in. Fältet blir
  dessutom aktivt vilseledande — det ser ut som en attribuering men är det inte.
  Det är den verkliga skadan, och den mildras bara av att den dokumenteras.
- **Vad som bevaras:** `Avstämt` (satt av A8) bär fortfarande NÄR. Vid dörren är
  det den fråga som faktiskt ställs i efterhand.

### 2.2 Väg (b) — additivt eget fält "Incheckad av" per ADR-063

Ett nytt skrivbart `singleLineText` på `Deltaganden`, satt server-side ur den
verifierade JWT:ns `user_metadata.display_name` — exakt ADR-075:s mekanik
(`create-event-note/index.ts:37-57`, `readDisplayNameFromJwt`).

- **Kostnad, och den är strukturell:** server-side attribuering kan per definition
  inte gå via generiska `update-record`, eftersom klienten där bygger `fields`-mapen
  själv och ett klient-buret författarnamn kan förfalskas. Väg (b) **tvingar fram en
  dedikerad EF** — och river därmed hela avsnitt 1.4:s slutsats. Därtill: nytt
  fält i staging, nytt fält i prod, och en hård prod-deploy-ordning (fält FÖRE EF,
  per miljö — `data-model.md` §Kända fällor 37).
- **Vad som vinns:** äkta per-användar-attribuering.

### 2.3 Väg (c) — skippa attribuering helt

Ingen attribuering, ingen dokumentation av `Registrerad av`. Avvisas direkt: det är
väg (a) minus kvittot, och kvittot är det enda som gör väg (a) försvarbar. Ett
fält som ser ut att svara på "av vem" men svarar fel, utan att någonstans stå
noterat, är en tyst felkälla — precis den klass CLAUDE.md:s triage-regel säger ska
registreras, aldrig tigas ihjäl.

### 2.4 Rekommendation

**Väg (a) — acceptera och dokumentera.**

Motivet är att kravbilden skiljer sig från ADR-075:s. Där var "av vem" **kravets
kärna**, ordagrant från Marcus (K66: anteckningar sparas "som kommentarer så man
ser när den är gjord och av vem"). ADR-075 förkastade Airtable record comments
**just på attributionen** — samma fälla som här — och betalade priset: en additiv
tabell, server-side JWT-läsning, en dedikerad EF.

Vid dörren finns inget motsvarande krav. Ingen av de tre prototyp-varianterna
visar vem som checkade in någon; ingen av de fem undersökta produkterna i
mönster-researchen (Eventbrite, Luma, Cvent, Splash, Sched) exponerar det heller.
Och i det faktiska driftläget står EN person i dörren — Lotta. Attribuering
besvarar en fråga som inte ställs.

Att välja (b) ändå skulle kosta: en dedikerad EF i stället för noll ny
server-kod, två bas-fält över två miljöer, och en hård prod-deploy-ordning med
egen fälla-post. Det är en betydande kostnad för att lösa ett problem som ännu
inte visat sig. Den dubbelriktade över-engineering-vakten pekar entydigt.

**Vad som gör (a) reverserbart, vilket är hela poängen:** väg (b) är rent additiv.
Skulle Roger och Lotta någon gång arbeta i dörren samtidigt kan fältet läggas till
då, med ADR-075:s mekanik färdigt beprövad i repot. Beslutet stänger ingen dörr —
det skjuter upp en kostnad tills behovet finns. Det förutsätter att villkoret
skrivs ned: **utlösande signal är att fler än en person checkar in på samma event.**

---

## 3. `Avstämt`-ägarskapet — STÄNGT, live-verifierat

Detta var öppen fråga 5 i divergens-README:n och fynd 2 i schema-bilagan, båda
korrekt flaggade som referens-grundade eftersom CLAUDE.md:s guard säger att
Airtable-MCP:n inte kan se automationer.

**Guarden gäller `mcp__airtable__*`-servern. Den gäller inte claude.ai-Airtable-
connectorn**, som exponerar `list_automations` och `get_automation`. Verifieringen
är därmed utförd, read-only, mot prod-basen `app8uGPrVCVOm6LfD` 2026-07-26.

### 3.1 Vad A8 faktiskt är

Automation `wfl1iYPrEmlKpEsRU`, "A8 - Sätt tidstämpel när närvarostatus ändras",
`deploymentStatus: deployed`, `deploymentError: null`.

- **Trigger:** `recordUpdated` på `tbldWHH6sSHWoQPHH` (Deltaganden), med
  `watchFields: ["fldRFOzNqVswqZ1mN"]` — alltså ENBART `Status`.
- **Action:** en nod (`wacZsF7yXgiRyJlhK`), `updateRecord` på samma tabell,
  `rowId` = triggerns egen post, fält
  `fld61tbzc2fqqf116` (`Avstämt`) = `getWorkflowExecutionIsoDateTime()`.

**Konsekvens:** referensen (`data-model.md:896-902`) stämmer exakt. **Appen ska
aldrig skriva `Avstämt`.** Allowlist-posten i avsnitt 1.2 är därmed låst med
live-grund, inte med dokumentations-grund.

Två precisioner som referensen inte bar och som är byggbara:

1. **Triggern är fält-scopad till `Status`.** En framtida operation som skriver
   `Noteringar` ensam kommer alltså INTE att flytta `Avstämt`. Bra — men det
   betyder också att en notering utan statusändring blir otidsstämplad.
2. **Tidsstämpeln är exekveringstidpunkten**, inte skrivtidpunkten. Med A8:s
   verifierade latens `<60 s` (`data-model.md:902`) kan dörren aldrig visa
   `Avstämt` direkt efter en incheckning. Vyn måste därför läsa sin
   incheckad-markör ur `Status`, aldrig ur `Avstämt`. Det stödjer forskningens
   slutsats att optimistisk write med rollback är golv.

### 3.2 A9, A10 och A11 — samma pass, samma metod

| Automation | ID | Status | Trigger-villkor (live) |
|---|---|---|---|
| A9 markera vald session | `wflgIhQ6Qo0zV50NH` | deployed | `fldN20OexhRJQr9XY = true` **AND** `fldjX1YN7DOhoKvt1` isNotEmpty |
| A10 markera alla sessioner | `wfl4rswJuGt9hVqF3` | deployed | `fldF5atXm9lV2nAeq = true` |
| A11 koppla deltagande till person | `wflIHsSbUvoc4BmP5` | deployed | `fldwQdDpRK8vByNhb` isNotEmpty **AND** `fldiU06kbTxSafkm4` isEmpty |

**A9:s andra villkor är nytt och byggbart.** Referensen (`data-model.md:906`) angav
bara checkboxen. Live visar att A9 inte triggar alls om `Check-in session`
(`fldjX1YN7DOhoKvt1`) är tom. En A9-baserad skrivväg måste alltså sätta
sessionsfältet i samma eller föregående PATCH — annars kryssar man i rutan och
ingenting händer, tyst.

**A11 förklarar dörrens namnlösa rader.** Orphan-Deltaganden utan `Anmälan`-länk
uppfyller aldrig A11:s första villkor, får därför aldrig `Person (länk)`, och
kommer ut ur `get-attendance` med `personId: null` och `personNamn: null`
(`get-attendance/index.ts:174-176`). Det är fälla 41 (`data-model.md:1188`, 44
orphans live-bekräftade på Event-17) sedd från appens håll.

### 3.3 Det som fortfarande INTE är verifierat

Ärlighet om verifieringens gränser:

1. **Staging-pariteten.** Connectorn ser bara prod-basen; `search_bases` returnerar
   `app8uGPrVCVOm6LfD` ensam, och `list_automations` mot staging
   (`apphjj8Q7lkXCMsL4`) svarar `INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`. Det
   **bevisar inte frånvaro** — det bevisar bara att den här token saknar åtkomst.
   Staging duplicerades utan records (ADR-050 beslut 2); om automationerna följde
   med är okänt. Detta är skälet till att testet i avsnitt 1.5 inte får assertera
   på `Avstämt`.
2. **A9/A10:s script-kroppar.** API:t exponerar nodernas TYP (`customScript`), inte
   deras kod. Att A9 resettar checkboxen och läser `Närvarostatus att sätta`
   (`flddzMrhu30cXoaEf`) är fortfarande referens-grundat. Behövs det skarpt —
   alltså om registret går A9/A10-vägen — krävs HAR-export eller skärmdump av
   scripteditorn för `wflgIhQ6Qo0zV50NH` respektive `wfl4rswJuGt9hVqF3`.

### 3.4 Om verifieringen hade gått åt andra hållet

Beskrivs för fullständighet, eftersom ordern efterfrågade båda utfallen. Hade A8
**inte** satt `Avstämt` skulle appen behöva göra det, och det hade förändrat
vertikalen på tre sätt: `'Avstämt'` in i `allowedFields`; deny-testets fält hade
behövt bytas mot något annat äkta-men-utanför (rimligen `Noteringar`); och
klienten hade behövt generera tidsstämpeln, med den klassiska följdfrågan om
klientklockan får bära en server-sanning. Ingen av dessa konsekvenser är aktuell.
Utfallet gick åt det billiga hållet.

### 3.5 Vad Marcus behöver göra

**För `Avstämt` i prod: ingenting.** Frågan är stängd.

**Om staging-pariteten ska stängas** (rekommenderas före skarp deploy, men det
blockerar inte bygget) — två vägar, i stigande kostnad:

1. **Empirisk sond, 2 minuter.** PATCH `Status` på ett staging-Deltagande via
   `update-record`, vänta 60 s, läs `avstamt` via `get-attendance`. Ändrad
   tidsstämpel ⇒ A8 finns i staging. Detta är ett skarpt verifieringssteg som
   muterar staging och hör därför hemma som ett namngivet steg i write-skivan,
   inte som ett sidoexperiment.
2. **Skärmdump.** Staging-basen → `Automations` i vänsterkanten → listan över
   automationer. En bild av listan räcker för att avgöra om A8-A11 följde med
   duplikeringen. HAR-export behövs bara om script-kropparna ska läsas.

---

## 4. Läs-vägens gap

### 4.1 Vad som saknas i shapen

`get-attendance` hämtar åtta fält (`get-attendance/index.ts:16-28`) och returnerar
tio (`mapAttendance`, `get-attendance/index.ts:66-80`): `id`, `anmalanId`,
`eventId`, `personId`, `personNamn`, `session`, `status`, `noteringar`, `avstamt`,
`narvaropoang`.

Dörren behöver två saker till, och prototypen löste båda med en klient-join mot
`get-registrations` (divergens-README §Vad som SAKNADES, punkt 2-3):

1. **Anmälans status**, för att avbokade inte ska visas som incheckningsbara.
   Ingen automation raderar deltagandet vid avbokning.
2. **E-post**, för att skilja två personer med samma namn åt vid dörren.

### 4.2 En nödvändig korrigering av latens-premissen

Ordern anger `~31 s` som TASK-14:s mätning. Den siffran får inte bäras vidare som
en egenskap hos systemet. **TASK-14 är `Done`.** Kortets implementation notes
belägger rotorsaken: staging-secreten `REGISTRATIONS_BATCH_SIZE=2` × 354
ackumulerade test-sentineler ⇒ 180 sekventiella Airtable-anrop × ~177 ms EU-RTT.
Efter städningen: **1,30 / 1,39 / 1,31 s.** De 31 sekunderna var en
staging-konfigurations-artefakt, inte en läsvägs-kostnad.

Det strukturella argumentet överlever ändå, och det är det som bär: både
`get-attendance` och `get-registrations` gör `1 + ceil(N/batch)` **sekventiella**
anrop. Två EF-anrop är två sådana kedjor efter varandra, och båda är dessutom
utsatta för samma amplifiering nästa gång staging ackumulerar (TASK-16:s horisont).
Argumentet mot klient-joinen är alltså inte "31 sekunder" utan "två seriella
kedjor där en räcker".

### 4.3 Vad utökningen ska innehålla

**En tredje record-ID-batch mot Anmälningar**, i exakt samma form som de två
befintliga (`fetchByRecordIds`, `get-attendance/index.ts:83-98`):

1. Samla unika `anmalanId` ur de mappade raderna — samma mönster som
   `uniquePersonIds` (`get-attendance/index.ts:165-167`).
2. `fetchByRecordIds('Anmälningar', unikaAnmalanIds, ['E-post', 'Status'])`.
3. Fäst två nya fält på varje rad:
   - `epost: string | null` — ur `E-post` (`fldVY310IdOIbTkE8`, multilineText).
   - `anmalanStatus: string | null` — ur `Status` (`fldWr5cCPNx9HEKtL`,
     singleSelect; `Avbokad/Ombokad` är värdet dörren filtrerar på).

**Kostnad:** `+ceil(A/batch)` anrop, där A är antalet unika anmälningar. För
MK-eventet (87 anmälda, 218 deltaganden) betyder det +2 anrop vid prod-batch 50.
Det ersätter ett helt EF-varv som i sig gör `1 + ceil(N/50)` anrop och returnerar
~30 fält per anmälan varav två används.

### 4.4 Är det rätt väg? Ja — och av mer än prestandaskäl

**1. Korrekthet hör hemma serverside.** Att dörren visar avbokade som
incheckningsbara är en dataintegritetsfråga, inte en presentationspreferens. En
klient-join gör korrektheten till en egenskap hos varje vy som råkar minnas att
göra joinen. Registret (`Narvaro.tsx`) gör den inte i dag.

**2. Källan är rätt.** `E-post` ska hämtas från **Anmälningar**, inte från Personer,
trots att Personer-batchen redan finns och ett extra fält där vore gratis.
`Personer.E-post` (`fldcd5HnYooVZY4Ts`) är tomt för varje person som skapats via
A2 gren 4 från en e-postlös anmälan (fälla 42, `data-model.md:1190`, två live-
bekräftade instanser). Anmälans adress är den personen faktiskt anmälde sig med.
Samma batch ger dessutom `Status` — ett anrop, två svar.

**3. Fält, inte filter.** EF:en ska returnera `anmalanStatus` och låta vyn bestämma
policy. Serverside-bortfiltrering skulle bryta registret (som behöver se allt) och
göra räknaren "X av Y incheckade" tvetydig — Y skulle betyda olika saker i olika
vyer. Det matchar också EF:ens befintliga stil: råa select-namn ut, tolkning i vyn.

**4. Orphan-fallet blir explicit.** Rader utan `Anmälan`-länk (fälla 41) får
`anmalanId: null` ⇒ både `epost` och `anmalanStatus` blir `null`, samtidigt som
`personId`/`personNamn` redan är `null` via A11-luckan. Dörren kan då rendera dem
som vad de är — trasiga rader — i stället för som namnlösa personer.

**Följdarbete som hör till samma skiva:** `AttendanceSchema` i
`src/domain/schemas` utökas (ADR-026 datagräns-validering), och
`get-attendance.staging.test.ts` får conformance på de två nya fälten. Bägge
korrigeringarna är deploy-bundna: testerna är röda tills EF:en är omdeployad —
samma kända ordning som betalnings-vertikalens läs-shape
(`update-record.staging.test.ts:243-245`).

---

## 5. Fas- och kort-kartan

Kartan är skriven så att den håller oavsett vilken variant som vinner. Nästa lediga
toppnivå-nummer är **52** (`ls backlog/tasks/` 2026-07-26, högsta i bruk är 51).
Beroendeordning uppifrån och ned.

### 5.1 Förkrav utanför denna PRD

- **TASK-46** — dynamisk sidtitel i route-lagret. T97: bör landa innan
  check-in-routen föds.
- **TASK-48** — markera-läget i Anmälda deltagare. T97: bygg check-in EFTER, så
  grammatiken återanvänds i stället för att uppfinnas två gånger.
- **TASK-25** — globala `*:focus-visible` klipper kapselradier. Syns tydligast på
  variant C:s autofokuserade sökfält (natt-chefens granskningsnot 1). Blockerar
  inte, men bör landa före QA-kortet så defekten inte bokförs som check-ins.

### 5.2 Korten

| # | Kort | En mening | Variant-beroende |
|---|---|---|---|
| 0 | **PRD: Check-in vid dörren och närvaro-write-vägen** | Föräldrakortet som bär grillningens samsyn, variantvalet och de sju öppna frågorna ur divergens-README:n. | Nej |
| 0b | **ADR: närvaro-write-vägen — ytan äger skrivvägen** | Mintas i PRD-kortets grillning: dörren skriver per post via `set-attendance-status`, registret via A9/A10, och skälet till att samma tabell har två skrivvägar. | Nej (innehållet formas av valet) |
| 1 | **Skiva: Närvaro-write-vertikalen (`set-attendance-status`)** | Allowlist-posten, redeploy av `update-record` mot staging, deny/allow-paret och staging-sonden för A8-pariteten. | **Nej** |
| 2 | **Skiva: Läs-shapen bär e-post och anmälningsstatus** | Tredje record-ID-batchen mot Anmälningar i `get-attendance`, två nya fält i shapen och schemat, conformance på båda. | **Nej** |
| 3 | **Skiva: Prod-grinden för närvaro-läsningen** | `get-attendance` och `get-event` in i `.prod-functions-allowlist.conf` plus deras `config.toml`-poster, utan att öka TASK-33:s drift. | **Nej** |
| 4 | **Skiva: Check-in-routen och sidskelettet** | Egen route `/event/$eventId/checkin` med sidtitel, sessionsvalet alltid explicit visat och överstyrbart, tomläge och felläge. | Delvis — routen är oberoende, innehållet inte |
| 5 | **Skiva: Dörr-ytan skarp (vinnande varianten)** | Den valda variantens yta nyskriven genom leverans-grindarna, med B:s framstegsstapel och "N kvar" inlyfta om C vinner. | **JA — helt** |
| 6 | **Skiva: Optimistisk write med rollback och ångra-vägen** | Mutationen med optimistisk uppdatering, rollback vid fel, `alertScreenReader`-kvitto och ångra i den form varianten kräver. | Delvis — mekaniken nej, ångra-formen JA |
| 7 | **Skiva: Registret till flertillstånd och massmarkeringen** | `Narvaro.tsx` från ren läsvy till redigerbart register med alla sex statusvärdena och "markera alla" via A9/A10. | **JA — blir dörrytan om A vinner, egen yta annars** |
| 8 | **Skiva: Rivningen av check-in-prototypsubstratet** | `CheckinPrototyp.tsx`, routens `?variant`-gren och det gamla `/narvaro`-länkmålet rivs enligt task-18.13:s mönster. | **Nej** |
| 9 | **QA: Manuell browser-testplan — check-in vid dörren** | Marcus verifierar i browser på 430 px: träffytor ≥44 px, tangentbordsflöde, skärmläsarkvitto, ångra åt båda håll, avbokade osynliga, orphan-rader begripliga. | Delvis — planens struktur nej, stegen JA |

### 5.3 Två saker om ordningen

**Kort 1-3 kan börja omedelbart.** De är helt variant-oberoende, de har noll
beroenden till varandra utöver att 2 och 3 hör ihop, och de utgör hela
infrastrukturen under dörren. Det är den egentliga poängen med detta förarbete:
när Marcus valt variant ska bygget starta på kort 4, inte på kort 1.

**Kort 7 är kartans gångjärn.** Vinner A blir kort 7 dörrytan och kort 5 bortfaller
i sin nuvarande form. Vinner B eller C blir kort 7 den separata registeryta som
både researchen (§c) och bygg-agenten (§"Och A ska byggas — men inte här")
rekommenderar. Kortet finns i båda världarna — bara dess plats i ordningen skiftar.

---

## 6. Vad som INTE går att förbereda

Ärlig lista. Allt nedan kräver antingen Marcus beslut eller ett skarpt
verifieringssteg som inte kan tas i förväg.

1. **Variant-valet.** Kort 4-7 i kartan hänger på det. Ingen mängd förarbete kan
   ersätta det.
2. **Divergens-README:ns sju öppna frågor.** Särskilt fråga 1 (nollställs sökningen
   efter incheckning), fråga 2 (är dörrens objekt personen eller deltagandet) och
   fråga 6 (egen route). De är interaktionsbeslut, inte tekniska val, och de hör
   till grillningen.
3. **Natt-chefens fråga 3** — ska "Checka in"-etiketten bli en riktig knapp-yta
   eller försvinna helt. Prototypen svarar inte, och svaret påverkar radens
   a11y-semantik direkt.
4. **Attribueringen.** Avsnitt 2 rekommenderar väg (a), men det är Marcus beslut.
   Väljs (b) faller avsnitt 1.4:s slutsats om generisk `update-record` — det blir
   då en dedikerad EF, två bas-fält över två miljöer och en hård prod-ordning.
   **Detta är den enda av mina rekommendationer som kan rivas av ett annat val.**
5. **Staging-pariteten för A8-A11.** Kan inte verifieras med tillgänglig åtkomst
   (avsnitt 3.3). Sonden är beskriven och billig, men den muterar staging och hör
   därför hemma som ett namngivet steg i kort 1, inte som förarbete.
6. **A9/A10:s script-kroppar.** Läsbara bara via HAR-export eller skärmdump. Behövs
   först om kort 7 går A9/A10-vägen — alltså inte alls om massmarkeringen visar
   sig kunna vänta.
7. **Fixtur-valet för allow-testet.** Kräver en live-titt på staging-Deltaganden för
   att hitta en rad som ingen annan test asserterar på. Mekaniskt, men inte
   gissningsbart — ZZ-History Person 01:s tre rader är uteslutna
   (`get-attendance.staging.test.ts:103`).
8. **Om `Noteringar` ska in i allowlisten.** Beror helt på om någon vald yta faktiskt
   skriver en notering. Kan inte avgöras före variantvalet, och ska inte förutses.
9. **Prestandabudgeten för variant A:s batch.** Kan inte mätas innan ytan finns.
   Rekommendationen är begränsad klient-parallellism först, batch-EF bara om
   mätningen kräver det — men mätningen förutsätter kort 5 eller 7.

---

## Källor lästa i detta pass

- `supabase/functions/_shared/field-allowlists.ts` (hela), `update-record/index.ts`,
  `create-event/index.ts`, `create-event-note/index.ts`, `get-attendance/index.ts`
- `tests/api/update-record.staging.test.ts`, `tests/api/get-attendance.staging.test.ts`
- `src/data/adapters/{DataSourceAdapter,AirtableAdapter,SupabaseAdapter}.ts`
- `.prod-functions-allowlist.conf`, `supabase/config.toml`, `.purge-staging-policy.json`
- `docs/decisions/ADR-050`, `ADR-063`, `ADR-066`, `ADR-075`
- `docs/reference/data-model.md` (§Deltaganden-status, §Eventplanering write-fält,
  §Grupp 3-automationerna, §Kända fällor 37/40/41/42),
  `docs/reference/airtable-constraints.md` §P4
- `docs/research/checkin-monsterklassen-2026-07-26.md`,
  `tasks/sessions/bilagor/s90-checkin-divergens/README.md`,
  `tasks/sessions/bilagor/s90-checkin-forarbete/deltaganden-schema-live-2026-07-26.md`
- `backlog/tasks/` — TASK-14, TASK-16, TASK-33, TASK-18.13, TASK-18.9
- **Live, read-only mot prod-basen `app8uGPrVCVOm6LfD` 2026-07-26:**
  `list_automations` (A1-A11) och `get_automation` (`wfl1iYPrEmlKpEsRU`)
