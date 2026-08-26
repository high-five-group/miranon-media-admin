---
owner: marcus803
updated: 2026-08-26
review_by: 2027-02-07
status: stable
---

# Airtable — strukturella begränsningar (plattform)

> **Äger:** Airtable-plattformens strukturella väggar (P1–P31), varje posts
> v1-kompensation och Fas E-migrationskrav. **Kartlägger:**
> `docs/reference/data-model.md` §Kända fällor (avgränsning: fält-specifika
> fällor bor där, plattforms-generella väggar bor här — se avgränsningsraden
> nedan). **Vid konflikt vinner:** detta dokument för plattforms-väggar
> (`ADR-100` §1 domän 5-undantag); koden (`DataSourceAdapter`-kontraktet,
> `ADR-057`) för om en vägg fortfarande gäller idag.

Auktoritativ katalog över Airtables **strukturella** begränsningar i detta projekt.
Airtable-basen (`app8uGPrVCVOm6LfD`) är ett **medvetet valt v1-prototyp-datalager**
bakom `DataSourceAdapter`-kontraktet ([ADR-057](../decisions/ADR-057-lager-oberoende-fitness-invariant.md))
— noll arkitektonisk inlåsning. Dokumentet är **levande**: nya väggar läggs till när de
upptäcks, det är inte en engångsinventering. Grundskörden: Session 26 Pass 1 (45 verifierade,
fil:rad-belagda poster); sektion F tillkom S91, sektion G tillkom `TASK-146.1`.
Se ändringsloggen sist för utvidgningarna.

Dubbla syftet: (1) stenkoll på exakt vad vi medvetet betalar i v1; (2) **migrations-kravspec**
för Supabase-adaptern — varje plattform-posts *Fas E-krav* är ett krav på Postgres-vägen, inte
ett löst hopp. **Avgränsning mot [`data-model.md`](./data-model.md) §Kända fällor:** detta dokument
= plattform-begränsningar (strukturella, migreras bort med Postgres). §Kända fällor = data-instans-
fällor (smutsig data i denna bas, städas bort vid bas-sanering). En post kan ha en motsvarighet i
bägge — *rot* här, *instans* där; sådana korsrefereras explicit.

Varje plattform-post har fyra delar: **Begränsning** (vad Airtable strukturellt inte kan) ·
**Kostnad/manifestation** (hur den bitit oss, med fil:rad-källor) · **v1-kompensation** (hur vi
hanterar den i Airtable-eran — det Supabase-adaptern ska *ersätta*, inte återimplementera) ·
**Fas E-krav** (hur Postgres löser det skarpt, skrivet som krav på adaptern).

---

## Plattform-begränsningar (migreras bort med Postgres)

### A. Integritet och constraints

#### P1 · Ingen unique-constraint på skrivbart fält

- **Begränsning.** Airtable kan inte påtvinga en unik-constraint på ett skrivbart fält. Endast det
  auto-genererade record-ID:t är garanterat unikt — och det är inte skrivbart.
- **Kostnad/manifestation.** ADR-014:s race-skydd vilade på en unique-constraint på idempotens-
  nyckelfältet → strukturellt oförmöget att ge race-säkerheten ADR-014:s egen DoD krävde. Källor:
  [ADR-059](../decisions/ADR-059-idempotens-lagring-defer-fas-e.md) (Kontext, rad ~16);
  ADR-014 §Erratum (rad ~38, ~42); [Session 26](../../tasks/sessions/archive/2026-06/2026-06-20-session-26.md) Del 2
  (falsifiering); 04-research DQ1.
- **v1-kompensation.** Klient-skydd: TanStack `mutationKey`-dedup + disabled submit under `isPending`;
  klient-UUIDv7-nyckel bevaras i request-kontraktet och loggas. Smalt multi-session-race-fönster
  accepterat öppet (single-admin-golv).
- **Fas E-krav.** Supabase-adaptern MÅSTE lägga en `UNIQUE`-constraint på idempotens-nyckeln i
  Postgres; reservation blir då atomär och race-fönstret stängs. Den bevarade klient-nyckeln gör
  aktiveringen additiv (ingen kontraktsändring).

#### P2 · Inga transaktioner / ingen atomär multi-record-skrivning ⚠️ TYST KORRUPTION

- **Begränsning.** Airtable saknar transaktioner. Det finns inget sätt att skriva flera records
  allt-eller-inget; varje record-operation lyckas eller misslyckas oberoende.
- **Kostnad/manifestation.** Väntelista→Anmälningar-flytt är POST `create-registration` följt av
  PATCH på Väntelista-raden, utan rollback: lyckas steg 1 men inte steg 2 → personen finns i BÅDA
  tabellerna (dubblett, tyst). Källor: [`data-model.md`](./data-model.md) §Kända fällor 30 +
  §Reverse-flow F.4; ADR-059 (distribuerad-transaktions-felmod); 04-research C13;
  byggplan-revision-p1 rad 181 (F.4-dubblettbugg aktiv i psionautics). **Relaterad tyst manifestation:**
  `send-email` returnerar ok-status även när post-send-PATCH failar → mail går iväg via Resend men
  UI:t visar ingen timestamp → Lotta skickar om → mottagaren får dubbletter (§Kända fällor 29).
- **v1-kompensation.** Kompenserande logik per flöde (idempotens-nyckel, manuell PATCH-ordning i
  backfill-script, fel loggas till Cloud-loggar). Ingen verklig atomicitet — risken accepteras öppet.
- **Fas E-krav.** Supabase-adaptern MÅSTE wrappa multi-tabell-skrivningar (flytt, mail+statusskrivning)
  i en Postgres-transaktion. Partiell skrivning rullas tillbaka allt-eller-inget; den föräldralösa-
  record-klassen försvinner.

#### P3 · Server-side idempotens är omöjlig i Airtable

- **Begränsning.** Kombinationen P1 (ingen unique-constraint) + P2 (inga transaktioner) + P25
  (inget schema-as-code) gör en race-säker idempotens-nyckel-tabell strukturellt omöjlig att bygga
  i Airtable.
- **Kostnad/manifestation.** Hela ADR-014:s lagrings-mekanism superseded. Källor: ADR-014 §Erratum;
  ADR-059 (huvudbeslut, Alt Y).
- **v1-kompensation.** Idempotens-*kravet* hålls giltigt men *lagringen* defereras; interimt
  klient-skydd (se P1).
- **Fas E-krav.** Supabase-adaptern MÅSTE bära idempotens-lagringen i Postgres (UNIQUE-reservation +
  transaktion, P1+P2 lösta tillsammans). Detta är den enskilt starkaste drivaren bakom Fas E-flytten.

### B. Frågekraft och paginering

#### P4 · Rate-limit 5 requests/sekund/bas

- **Begränsning.** Airtable tillåter 5 API-anrop per sekund per bas; översvämning → HTTP 429 + 30s
  lockout. Ingen förhandling, fast straff.
- **Kostnad/manifestation.** Polling-kadens och full-walk-hämtningar måste hålla sig under taket.
  Källor: [ADR-056](../decisions/ADR-056-list-paginerings-port-cursor-dubbel-kalla.md) (rad ~26);
  gap-analysis rad 72; byggplan-revision-p1 rad 349 (60s-polling = 75× marginal);
  [`airtable-client.ts:81`](../../supabase/functions/_shared/airtable-client.ts#L81)
  (429-hanteringen flyttad till `airtable-retry.ts` i `TASK-53` — radnumret uppdaterat därefter).
  - **Andra manifestationen (S91, 2026-07-27) — taket är DELAT, vilket gör test-parallellisering
    verkningslös.** 5 req/s gäller per bas, alltså för alla samtidiga klienter tillsammans.
    Playwright-shardning multiplicerar antalet klienter som slåss om samma budget, inte
    genomströmningen. För den Airtable-bundna delen av sviten är shardning därför verkningslös
    **även med perfekt dataområdes-isolering** — en oberoende grind utöver P26. Källa:
    [`parallell-e2e-mot-delad-backend-2026-07-26.md`](../research/parallell-e2e-mot-delad-backend-2026-07-26.md)
    §5 + §Vad det betyder för OSS punkt 2 och 6.
  - **✅ Avvikelsen mot dokumentationen är ÅTGÄRDAD (`TASK-53`, commit `123dbca`, 2026-07-31).**
    Airtable anger att
    man efter 429 måste *"wait 30 seconds before subsequent requests will succeed"*. Klienten
    väntade **1 sekund** på tre ställen — 30× för kort, så omförsöken föll inom lockout-fönstret
    och förlängde lockouten i stället för att invänta den. Loopen saknade dessutom tak.
    Backoffen bor nu i [`_shared/airtable-retry.ts`](../../supabase/functions/_shared/airtable-retry.ts)
    som **en** mekanism för alla tre call-sites: exponentiellt från 30 s (30 s → 60 s) med
    **additiv** jitter (0–25 % uppåt, aldrig under golvet — subtraktiv jitter hade återinfört
    defekten) och tak på 2 omförsök. Taket är härlett, inte valt: värsta totala väntan 112,5 s
    ryms i Supabase Edge Functions `Request idle timeout: 150s`, medan ett tredje omförsök hade
    gett 262,5 s → 504 i stället för ett ärligt fel. Verifierad med mockat 429-enhetstest som
    mäter den faktiska väntetiden ([`tests/api/airtable-retry.test.ts`](../../tests/api/airtable-retry.test.ts),
    10 fall) — skarp 429-framkallning valdes bort eftersom den bränner den DELADE kvoten för alla
    parallella körningar (se andra manifestationen ovan + P26).
- **v1-kompensation.** Synkron backoff enligt Airtables dokumenterade kontrakt: 429 → vänta
  >= 30 s (exponentiellt, jitter uppåt) → försök igen, tak 2 omförsök
  ([`airtable-retry.ts`](../../supabase/functions/_shared/airtable-retry.ts); call-sites
  [`airtable-client.ts`](../../supabase/functions/_shared/airtable-client.ts) `fetchFromAirtable`,
  `fetchAirtablePage`, `fetchAirtableRecord`); polling-kadens 60s.
- **Fas E-krav.** Postgres har ingen jämförbar per-bas-throttle; Supabase-adaptern MÅSTE inte
  längre kadens-budgetera mot 5 req/s. Connection-pool-gränser ersätter rate-limit-disciplinen.
  Test-parallellisering blir därmed en fråga om maskinresurser, inte om en leverantörskvot.

#### P5 · pageSize ≤ 100 records per svar

- **Begränsning.** Ett list-anrop kan inte returnera mer än 100 records, oavsett bas-storlek.
- **Kostnad/manifestation.** Tvingar minst 6 sekventiella anrop för dagens ~568 records.
  Källor: ADR-056 (rad ~27); [`get-persons/index.ts`](../../supabase/functions/get-persons/index.ts)
  (`MAX_PAGE_SIZE = 100`, "Airtables tak").
- **v1-kompensation.** Full-walk loopar tills `offset` tar slut; cursor-EF gör ett anrop per sida.
- **Fas E-krav.** Supabase-adaptern MÅSTE använda Postgres keyset-paginering med valfri sidstorlek;
  100-record-taket försvinner.

#### P6 · Offset-only paginering — opak token, inget sid-hopp, instabil under skrivning

- **Begränsning.** Pagineringen är en opak `offset`-token (ingen numerisk offset, ingen totalräkning).
  Sid-hopp till N finns inte i API:t; offset blir instabil om records ändras mellan anrop.
- **Kostnad/manifestation.** Klient-slice-paginering trunkerar tyst bortom fetch-taket; numeriskt
  sid-hopp måste emuleras genom walk 1→N (anti-mönster mot Airtables design). Källor: ADR-056
  (rad ~28–37, ~68–71); [`cursor.ts`](../../supabase/functions/_shared/cursor.ts) (opak `{o}`-wrapper);
  [`airtable-client.ts:32`](../../supabase/functions/_shared/airtable-client.ts#L32);
  [STATE-STRATEGY.md](../specs/STATE-STRATEGY.md) (rad ~72).
- **v1-kompensation.** Airtables `offset` wrappas i en opak `nextCursor` (base64 `{o}`); klienten ser
  aldrig en Airtable-formad token → backend-swap fri.
- **Fas E-krav.** Supabase-adaptern MÅSTE byta cursor-interna till Postgres keyset/seek (stabil under
  samtidiga skrivningar) bakom samma opaka `nextCursor`-kontrakt. Klient och frontend är oförändrade.

#### P7 · Länkfält-filter: `ARRAYJOIN` exponerar primär-display, inte record-ID

- **Begränsning.** `FIND(recordId, ARRAYJOIN({Länkfält}))` matchar aldrig på ID: `ARRAYJOIN` av ett
  länkfält exponerar länkens PRIMÄR-DISPLAY (eventlabel-strängen), inte record-ID. Klass-bugg, inte
  instans — trasigt var helst ett länk-ID-filter byggs.
- **Kostnad/manifestation.** Conformance mot skarp data returnerade noll rader; latent även i
  deployade `get-registrations` (smäller i 6c "Anmälda per event"). Enhetstesterna verifierar formel-
  SYNTAX, aldrig match-SEMANTIK mot riktig data. Källor:
  [`lessons.md`](../../tasks/lessons.md) L153; [`airtable-filter.ts:125`](../../supabase/functions/_shared/airtable-filter.ts#L125);
  [`get-attendance/index.ts:99`](../../supabase/functions/get-attendance/index.ts#L99) ("ANVÄNDER MEDVETET INTE");
  [threads T15](../../tasks/threads/README.md) (rad 41, 57); session-25 rad ~256.
- **v1-kompensation.** Väg D: record-ID-batch från relationens motsatta länkfält (`Närvaro (records)` /
  `Anmälningar (länkat fält)`) → chunkad `OR(RECORD_ID()=…)`. Record-ID = enda tillförlitliga
  matchnyckeln mot Airtable-länkar (display/label/formel/lookup är alla sköra).
- **Fas E-krav.** Supabase-adaptern MÅSTE filtrera på äkta foreign-keys med `WHERE event_id = $1`;
  länk-display-skörheten och record-ID-batch-omvägen försvinner helt.

#### P8 · `RECORD_ID({länk})` ignorerar argumentet — inget ID-exakt formelfält på länk

- **Begränsning.** `RECORD_ID()` accepterar inga argument enligt formula-specen — den returnerar
  alltid current record's ID. `RECORD_ID({Event})` ger Deltaganden-radens EGNA id, inte eventets.
- **Kostnad/manifestation.** Det finns inget ID-exakt formelfält att filtrera Deltaganden på per event
  (förvärrar P7). Verifierat: Deltagande #1683 → båda formelfälten returnerar radens eget ID. Källor:
  [`data-model.md`](./data-model.md) §Kända fällor 23; lessons.md L153 (sido-fynd); arkiv
  datamodell-research-plan rad 324, 581, 588 (DS6/DQ7/H4 "RECORD_ID-bug").
- **v1-kompensation.** Ignorera formelfälten som sanning; använd record-ID-batch (P7 väg D).
  Konkreta städnings-objekt: se data-instans-raden för Deltaganden-formelfälten.
- **Fas E-krav.** Postgres ger äkta foreign-keys; inga `RECORD_ID()`-surrogat behövs. Supabase-adaptern
  MÅSTE exponera relationen via FK, inte via formel-härledda ID-fält.

#### P9 · `lookup` över ett länkfält ger record-ID:n, inte primärvärdet

- **Begränsning.** En lookup på ett länkfält returnerar de länkade radernas record-ID:n, inte deras
  primärvärde (t.ex. namn).
- **Kostnad/manifestation.** Deltaganden-vyns person-namn kräver en separat batch-hämtning +
  `Map<personId, namn>`. Källa: session-23 rad ~242–245.
- **v1-kompensation.** Andra record-ID-batchen mot Personer berikar med läsbara namn (Gunilla-princip:
  rå record-ID:n exponeras aldrig i vyn).
- **Fas E-krav.** Supabase-adaptern MÅSTE `JOIN` mot persontabellen och projicera namnet direkt;
  ID→namn-berikningssteget försvinner.

#### P30 · Formler når bara länkade tabeller — och länkfältet kan inte fyllas av en formel

- **Begränsning.** En formel kan bara läsa fält i sin EGEN rad; för att nå en annan tabell krävs ett
  länkfält, och lookup/rollup kan bara gå via ett sådant. Airtables egen dokumentation säger det rakt
  ut: *"Lookup fields can only pull data from tables that are already connected via a linked record
  field"* (`support.airtable.com/v1/docs/lookup-field-overview`, hämtad 2026-08-10). Länkfältet i sin
  tur går inte att beräkna: *"There is no built-in way to have a linked record field computed
  automatically by a formula"* (`support.airtable.com/v1/docs/linked-record-field`, samma datum).
  Paret gör relationen till ett **skrivet** faktum: den kan bara fyllas av en människa, en automation
  eller en API-skrivning — aldrig härledas.
- **Kostnad/manifestation.** `TASK-184` skulle ge `Personer.Senaste interaktion (text)` kurs och ort
  för anmälningsgrenen. `Touchpoints` har bara två länkfält (`Person (länkat fält)`
  `fldLiC0ZiUAdxXu9u`, `Mail logg (rådata)` `fldcSJPi1Vweh7Gyc`) och ingen väg till `Anmälningar`
  eller `Eventplanering`, så touchpointen kan strukturellt inte bära uppgiften. Ett nytt länkfält
  hade fötts tomt på samtliga befintliga rader och krävt backfill — och backfillen var dessutom inte
  härledbar: kardinaliteten anmälningar↔touchpointer är inte 1:1 (12 mätta prod-personer med ≥4
  anmälningar: 4 lika, 5 färre, 3 fler). Källa:
  [`touchpoint-kurs-och-ort-2026-08-10.md`](../research/touchpoint-kurs-och-ort-2026-08-10.md)
  §Vägarna som prövades 1 + 5.
- **v1-kompensation.** Läs grenen från den tabell som REDAN har relationen i stället för att bygga en
  ny. `TASK-184` löste hela behovet över den befintliga länken `Personer.Anmälningar (länkat fält)`
  (`fld8pOivka8YdiywK`) med enbart beräknade fält — lookup, formel, rollup — som får värde på alla
  befintliga rader i samma ögonblick de skapas. Noll backfill. Kostnaden är att grenen läses från
  anmälan i stället för från touchpointen; touchpointen behåller sin roll som logg.
- **Fas E-krav.** Supabase-adaptern MÅSTE kunna `JOIN`:a över godtyckliga nycklar utan att relationen
  först materialiseras som en lagrad länk — en främmande nyckel räcker, och en vy kan härleda den ur
  data som redan finns. Hela klassen "relationen måste skrivas innan den kan läsas" försvinner, och
  därmed också backfill-kravet vid varje ny relation.

#### P19 · `filterByFormula` kräver applikations-side escaping

- **Begränsning.** Airtable filtrerar via en formelsträng i query-strängen; user-supplied värden måste
  escapas på applikationssidan (ordning `\\` före `\"`), annars bryter de ut ur formeln (injektionsyta).
- **Kostnad/manifestation.** Drev fram säkerhets-härdning M5: alla user-supplied filtervärden går genom
  en escaping-wrapper; ogiltig input → 400 (klient-fel). Källor:
  [`airtable-filter.ts:40`](../../supabase/functions/_shared/airtable-filter.ts#L40) (`escapeFormulaValue`,
  FORBIDDEN_CHARS-regex); [SECURITY-SPEC.md](../specs/SECURITY-SPEC.md) §6.4 (deny-by-default).
- **v1-kompensation.** `escapeFormulaValue` + round-trip-validerad `parseAirtableString`; control/zero-
  width/bidi-tecken blockeras.
- **Fas E-krav.** Supabase-adaptern MÅSTE använda parametriserade queries (Postgres bind-parametrar) —
  värdet når aldrig query-språket som text, så hela escaping-apparaten försvinner.

#### P20 · Formel-/URL-längdgräns på `filterByFormula`

- **Begränsning.** En `filterByFormula` (och därmed URL:en) har en längdgräns; en
  `OR(RECORD_ID()=…)` över godtyckligt många ID:n spränger den.
- **Kostnad/manifestation.** Tvingar chunkning av ID-listor i batchar (≤50 IDs ≈ ~1.5 kB). Källor:
  [`get-person/index.ts:28`](../../supabase/functions/get-person/index.ts#L28);
  [`get-attendance/index.ts:26`](../../supabase/functions/get-attendance/index.ts#L26).
- **v1-kompensation.** `HISTORY_BATCH_SIZE` / `ATTENDANCE_BATCH_SIZE` = 50, ceil(N/50) anrop, noll
  trunkering; post-merge-sort i JS (per-chunk-sort räcker inte över chunk-gränser).
- **Fas E-krav.** Supabase-adaptern MÅSTE använda `WHERE id = ANY($1::uuid[])` (array-bind) eller en
  JOIN; chunkningen och post-merge-sorten försvinner.

#### P21 · Rollup med IF-filter inuti aggregeringen är opålitlig

- **Begränsning.** En rollup som filtrerar via IF inuti aggregerings-formeln
  (`COUNTALL(IF(...))`) är opålitlig; man måste använda Airtables inbyggda "conditions"-filter +
  COUNTA istället.
- **Kostnad/manifestation.** Felaktig rollup-data om mönstret används. Källor:
  [`lessons.md`](../../tasks/lessons.md) L107; [`data-model.md`](./data-model.md) rad ~107.
- **v1-kompensation.** Använd inbyggt linked-record-conditions-filter + COUNTA.
- **Fas E-krav.** Supabase-adaptern MÅSTE räkna aggregat via `COUNT(...) FILTER (WHERE ...)` /
  materialiserade vyer; formel-rollup-skörheten försvinner.

#### P22 · Hård `z.enum` på live-läsväg knäcker på legacy-/raderade option-värden

- **Begränsning.** Airtable behåller raderade option-värden på befintliga records; en hård enum-
  validering (`z.enum` + `.parse()`) på live-läsvägen knäcker hela listan om EN record bär ett värde
  utanför den nuvarande option-listan. `{Fält}!=BLANK()` ger dessutom false-positives på tomma fält.
- **Kostnad/manifestation.** En enda avvikande record sänker `z.array(...).parse()` → list-laddningen
  kraschar. Källa: [`lessons.md`](../../tasks/lessons.md) L84.
- **v1-kompensation.** Outlier-svep mot ALL data före enum-härdning; robust blank-check `{Fält}&""!=""`.
- **Fas E-krav.** Postgres `CHECK`-constraints / enum-typer hindrar att otillåtna värden ens skrivs;
  Supabase-adaptern läser från en källa där option-driften inte kan uppstå.

#### P31 · Kallstartslatensen — sekventiella EF-hämtningar under det delade 5 req/s-taket

- **Begränsning.** En kall appstart (tom/stale persist-cache) måste hämta samtliga flikars
  kärndata som separata EF-anrop under P4:s delade rate-tak — total kallstartstid ~6–7 s mätt
  (Marcus, S102 Lotta-vandringen 2026-08-15). Ingen bulk-/bootstrap-endpoint finns i Airtable
  som kunde hämta allt i ett anrop.
- **Kostnad/manifestation.** 6–7 s skeleton-regn vid första öppning per enhet/dag — exakt den
  väntetidsklass där skeleton per NN/g är fel indikatorform. Källa:
  [`app-startup-warmup-splash-2026-08-15.md`](../research/app-startup-warmup-splash-2026-08-15.md).
- **v1-kompensation.** Förberedelseskärmen med blockerande startvärmning och determinate bar
  ([ADR-112](../decisions/ADR-112-forberedelseskarmen-blockerande-startvarmning.md)):
  hämta-en-gång-dela mellan nyckelfamiljerna, tyst vid varm start, offline-gate + tyst
  timeout-släpp.
- **Fas E-krav.** Med Postgres-latens (tiotals ms) blir startvärmningen självdöende via
  tyst-vid-varmt-regeln; ADR-112:s blockerande form OMPRÖVAS då öppet mot den progressiva
  branschriktningen (Linear/Figma-mönstret) i stället för att ärvas.

### C. Typning och coercion

#### P10 · lookup/rollup/multipleSelect returneras alltid som ARRAY — även 1→1

- **Begränsning.** Airtable levererar lookup/rollup/multipleSelect som arrayer; ett 1→1-lookup ger en
  1-element-array, ett 1→många-rollup ger N element.
- **Kostnad/manifestation.** Rå `firstString` på ett flervärt fält (Ort) gav tyst dataförlust
  (L5b-regression i deployad get-person). Källor:
  [`coerce.ts:3`](../../supabase/functions/_shared/coerce.ts#L3); lessons.md L140 / L5b / L7 (session-23);
  alla get-*-EF:er.
- **v1-kompensation.** Aritets-namngiven coerce-familj: `scalarString` / `scalarNumber` (1-element →
  värde; >1 loggas som data-form-avvikelse, aldrig tyst) + `stringArray` (bevarar ALLA värden).
- **Fas E-krav.** Postgres ger skalärer som skalärer och arrayer som arrayer (typade kolumner);
  Supabase-adaptern MÅSTE inte längre coerca array↔skalär — domäntypen är källans typ.

#### P11 · Formel-/procentfält som blir NaN/Infinity returneras som OBJEKT

- **Begränsning.** Ett formel-/procentfält som beräknas till NaN/Infinity (0/0, osatt operand)
  returneras som OBJEKT `{ specialValue: "NaN" | "Infinity" | "-Infinity" }`, inte som tal.
- **Kostnad/manifestation.** Rå `f[...] ?? null`/`?? 0` släppte objektet rakt genom → `z.number()`-parse
  avvisade det → ETT event sänkte hela list-`.parse()` → list-laddningen kraschade. Latent i deployad
  get-events (smoke-test som aldrig `.parse()`:ade skarp data). Källor:
  [`lessons.md`](../../tasks/lessons.md) L152; [`coerce.ts:55`](../../supabase/functions/_shared/coerce.ts#L55);
  get-event / get-events.
- **v1-kompensation.** `scalarNumber` (specialValue/icke-ändligt → null; non-nullable-fält:
  `scalarNumber(v) ?? 0`), applicerad i båda mappningarna.
- **Fas E-krav.** Postgres returnerar `NULL` eller äkta numeriska värden, aldrig ett specialValue-objekt;
  Supabase-adaptern MÅSTE inte längre detektera NaN-objekt.

#### P12 · Formelfält går inte att skriva till

- **Begränsning.** Formelfält (`Namn`, `Normaliserad e-post`, `Erfarenhetsnivå` m.fl.) är computed och
  kan inte skrivas direkt.
- **Kostnad/manifestation.** Skrivning måste gå till källfälten; härlett tillstånd kan inte korrigeras
  in-place. Källa: [`data-model.md`](./data-model.md) §Kända fällor 2.
- **v1-kompensation.** Skriv alltid till källfälten (Förnamn, Efternamn, E-post …) och låt formeln räkna.
- **Fas E-krav.** Supabase-adaptern kan välja: behåll härlett som generated columns/vyer (read-only,
  avsiktligt) eller materialisera där skrivning krävs. Begränsningen blir ett designval, inte en vägg.

#### P13 · Spegelfält / inverse-länk är read-only

- **Begränsning.** Auto-skapade inverse-/spegelfält (`From field: Medföljande till`,
  `Eventplanering.Anmälningar (länkat fält)`) är read-only och skapar inga relationer — de speglar
  länkar skapade från ägar-sidan.
- **Kostnad/manifestation.** Skrivning måste alltid ske från ägar-sidan. Källor:
  [`data-model.md`](./data-model.md) §Kända fällor 3; data-model rad ~104.
- **v1-kompensation.** Skriv alltid från ägar-sidans länkfält.
- **Fas E-krav.** Postgres FK är riktningslös på läs-sidan (JOIN åt båda håll); Supabase-adaptern MÅSTE
  inte längre hålla reda på en "ägar-sida" för läsning.

#### P18 · `403` är tvetydigt — både "ingen behörighet" och "record finns inte"

- **Begränsning.** Airtable returnerar `403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND` för BÅDE saknad
  behörighet OCH icke-existerande record (avsiktlig obfuskering — läcker inte existens).
- **Kostnad/manifestation.** `fetchAirtableRecord` kan inte skilja "finns inte" från "ingen behörighet".
  Källor: session-23 rad ~264–268; [`airtable-client.ts:189`](../../supabase/functions/_shared/airtable-client.ts#L189).
- **v1-kompensation.** Mappa både 403 och 404 → null (accepterat för read-only admin-vyer).
- **Fas E-krav.** Postgres/PostgREST ger distinkta felkoder (RLS-deny vs 0-rader); Supabase-adaptern
  MÅSTE skilja "saknas" från "nekad" och kan ge precisa felmeddelanden.

### D. Automationer och timing

#### P14 · Formel-beräkningsfördröjning (~30s) efter automation-create

- **Begränsning.** Just-skapade rader (av automation) kan returnera tomt eller fel värde från formelfält
  i upp till ~30s innan Airtable hunnit beräkna.
- **Kostnad/manifestation.** Läs ALDRIG formel-värden omedelbart efter automation-triggad create.
  Källa: [`data-model.md`](./data-model.md) §Kända fällor 17.
- **v1-kompensation.** Poll-med-timeout, eller läs länkfältet direkt istället för formelfältet.
- **Fas E-krav.** Postgres beräknar generated columns synkront i samma transaktion; Supabase-adaptern
  MÅSTE inte längre poll-vänta på eventuell konsistens.

#### P15 · Lookup-fält uppdateras snabbare än formelfält

- **Begränsning.** Lookup-fält har en egen, snabbare uppdateringskedja än formelfält.
- **Kostnad/manifestation.** Vid programmatisk matchning på länkad data är formelfältet opålitligt först.
  Källa: [`data-model.md`](./data-model.md) §Kända fällor 18.
- **v1-kompensation.** Föredra lookup framför formula vid matchning på länkad data.
- **Fas E-krav.** Postgres har ingen sådan flerhastighets-beräkningskedja; Supabase-adaptern MÅSTE inte
  längre välja fälttyp efter uppdateringslatens.

#### P16 · Automation-run-status opålitlig — "Ran successfully" trots saknade delresultat ⚠️ TYST KORRUPTION

- **Begränsning.** A1–A11 är async och rapporterar "Ran successfully" även när action-steg inte
  slutförde sidoeffekter. Run-history bekräftar att triggern kördes, inte att alla steg lyckades.
- **Kostnad/manifestation.** En automation kan se grön ut medan en länk/skrivning tyst saknas →
  nedströms-kaskaden bryts utan synligt fel. Källa: [`data-model.md`](./data-model.md) §Kända fällor 19.
- **v1-kompensation.** Verifiera sidoeffekter DIREKT (t.ex. länkfältet på mål-recordet), aldrig via
  run-status.
- **Fas E-krav.** Supabase-adaptern MÅSTE ersätta automation-kedjorna med transaktionell server-logik
  där ett fel är ett fel (kastas, rullas tillbaka) — inte en grön körning med tyst lucka.

#### P23 · Trigger-granularitet — går ej att begränsa till en specifik fält-ändring

- **Begränsning.** En automation-trigger kan inte skopas till en enskild fält-ändring: A7 triggas vid
  VARJE Anmälningar-uppdatering (inte bara betalningsfält); A1 triggas vid varje create.
- **Kostnad/manifestation.** Kostsamt vid massuppdateringar (A7); A1 kan nollställa en redan-satt
  Event-länk. Källor: [`data-model.md`](./data-model.md) §Kända fällor 10 + 9. **Korsreferens:** den
  konkreta manifestationen i denna bas (A2:s grenordning som bryter reverse-flow) bor som data-instans-
  fälla — se D-sektionens A2-rad. P23 = roten (varför möjligt; försvinner med Postgres); A2-wiringen =
  instansen (hur det bet här; försvinner med omkonfiguration). Olika klass, olika försvinnande-tillfälle.
- **v1-kompensation.** Idempotenta skrivningar (sätt EventKey OCH Event direkt = A1 matchar samma värde);
  verifiera sidoeffekter direkt.
- **Fas E-krav.** Postgres-triggers/server-logik kan villkoras på exakt kolumn (`WHEN (OLD.x IS DISTINCT
  FROM NEW.x)`); Supabase-adaptern MÅSTE styra exakt vad som körs och när.

### E. Schema och operationellt

#### P17 · Restore skapar en KOPIA, ersätter inte in-place

- **Begränsning.** Airtable Restore skapar en kopia av basen, ersätter inte in-place. Original-basen är
  oförändrad.
- **Kostnad/manifestation.** Rollback av en delvis skrivning kräver manuell radering i original-basen.
  Källa: [`data-model.md`](./data-model.md) §Kända fällor 20.
- **v1-kompensation.** Disaster recovery-rutin förutsätter manuell städning i originalet.
- **Fas E-krav.** Postgres ger point-in-time recovery och transaktionell rollback; Supabase-adaptern
  MÅSTE inte längre förlita sig på kopia-baserad restore.

#### P24 · MCP/API-blindhet för automationer, vyer, formulär, extensions, webhooks (RÄTTAD, TASK-200)

- **Begränsning — RÄTTAD mot uppmätt verklighet 2026-08-11, katalogen ej synkad förrän nu.**
  Ursprungsformuleringen ("Airtable-MCP exponerar bara baser, tabeller, fält, records — automationer,
  vyer, formulär, extensions och webhooks är osynliga") gäller ENDAST PAT-servern
  (`mcp__airtable__*`). claude.ai-connectorn (`mcp__claude_ai_Airtable__*`) exponerar
  `list_automations`/`get_automation`/`list_pages_for_base`/`list_views_for_table` och läser dem
  DIREKT, inklusive fullständiga triggers och `watchFields` — falsifierat av bas-diff-passet
  2026-08-11, som läste samtliga 11 prod-automationer live på detta sätt (§ "Oväntade fynd" 1).
  Global CLAUDE.md § Verktygsfakta bokför korrigeringen sedan S90; endast denna väggkatalog hade
  inte följt med. **Caveat, oförändrad:** connectorn är interaktivt autentiserad och kan saknas i
  headless-/cron-körningar; den nådde i det citerade passet endast PROD — pariteten mot staging
  förblir overifierad och får aldrig antas. Formulär/extensions/webhooks är inte omprövade av detta
  fynd (passet läste bara automationer + sidlistning) och kvarstår som obekräftat osynliga tills
  någon faktiskt prövar dem via connectorn.
- **Kostnad/manifestation.** Läsning är alltså inte längre blockerad (via connectorn, med caveaten
  ovan) — men SKRIVNING/versionering av automationer via API är fortsatt oprövad, och `field-
  allowlists.ts` underhålls fortfarande för hand. A1–A11 kan fortfarande inte CI-testas eller
  git-versioneras. Källor: global CLAUDE.md §Verktygsfakta ("Airtable-MCP:erna är TVÅ, med olika
  räckvidd"); `docs/research/prodbas-synk-staging-till-prod-2026-08-11.md` § Metod +
  § Oväntade fynd 1; [`field-allowlists.ts:12`](../../supabase/functions/_shared/field-allowlists.ts#L12).
- **v1-kompensation.** claude.ai-connectorn för READ-ONLY-verifiering (trigger/watchFields-läsning
  inför en bas-ändring, se prodbas-synk-forskningspasset för ett skarpt exempel); extern HAR-export
  kvarstår som fallback när connectorn saknas (headless/cron) eller för write/versionering.
  `field-allowlists.ts` underhålls fortsatt för hand i synk med automationerna.
- **Fas E-krav.** Postgres-logik (triggers, funktioner, RLS) lever som schema-as-code i git och
  CI-testas; Supabase-adaptern MÅSTE inte längre lita på UI-logik som saknar versionering och
  CI-täckning — detta krav STÅR KVAR trots rättelsen ovan, eftersom connectorn löser LÄSBARHET,
  inte git-versionering eller CI-testbarhet.

#### P25 · Airtable saknar schema-as-code / migrations

- **Begränsning.** Bas-strukturen lever bara i Airtable-UI:t. Det finns inget versionerat schema-as-code,
  ingen diff, ingen automatiserad schema-deploy.
- **Kostnad/manifestation.** Schema-ändringar kan inte spåras i git eller granskas i PR. Källor:
  [ADR-050](../decisions/ADR-050-isolerad-staging-miljo.md) (rad ~84); session-23 rad ~223–226 (L115).
  - **O2 (underrad — konsekvens):** staging↔prod schema-sync saknar en pågående disciplin. Staging-basen
    (`apphjj8Q7lkXCMsL4`) verifierades point-in-time mot prod (L115 CLEAN), men det finns ingen löpande
    kadens/mekanism — prod-schema-ändringar riskerar drift. Transitionellt: försvinner när Postgres är
    primär.
- **v1-kompensation.** Manuell point-in-time schema-verifiering vid behov (L115-metoden).
- **Fas E-krav.** Supabase-adaptern MÅSTE backas av `supabase/migrations/` (versionerat schema-as-code);
  staging-sync blir en migration-apply, inte manuell replikering. Schemat hamnar i git — en länge saknad grund.

### F. Testbarhet och miljö-isolering

> Tillagd S91 (2026-07-27) på Marcus order: *"dokumentet måste ha ALLA begränsningar och
> kompromisser som Airtable som datakälla har tvingat oss till i appen."* Klassen saknades helt —
> beläggen fanns i tre research-pass men hade ingen katalogpost. Fullt beslutsunderlag och
> gränsdragningen tvång/eget val: [ADR-063 § S91-not](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md).

#### P26 · Ingen bas-duplicering via API — per-körning-isolering är strukturellt omöjlig

- **Begränsning.** Webb-API:t har exakt tre bas-endpoints — `Create base`, `List bases`,
  `Delete base` — samtliga från 2022-11-15. Ingen duplicerings-, kopierings- eller mall-endpoint
  har någonsin skeppats. Två oberoende spärrar stänger vägen var för sig:
  **(a)** `Create base` tar `name`, `workspaceId` och en `tables`-array och bygger från grunden,
  men de beräknade fälttyperna (`formula`, `rollup`, `multipleLookupValues`, `count`,
  `autoNumber`, `createdTime`, `lastModifiedTime`, `button`) saknar skrivformat och är read-only
  — en API-klon av vår rollup-tunga bas vore strukturellt **icke-ekvivalent**, alltså skulle man
  testa något annat än produkten. **(b)** `Delete base` är *"available to enterprise users on
  request"* — utan det kan vi skapa baser men inte ta bort dem programmatiskt, så varje CI-körning
  skulle läcka en bas in i workspacet.
- **Kostnad/manifestation.** Hela staging-sviten delar **en** bas och måste därför serialiseras
  under en global mutex (`concurrency: group: staging-tests, queue: max` i `ci-suite.yml`,
  förstärkt av ADR-073:s semafor). Uppmätt: **9,25 min per körning**, varav E2E-steget är 84 %
  (466 s), API-steget 11,7 % (65 s) och allt övrigt 4,3 % (24 s). Kollisionsklassen är bevisad,
  inte teoretisk: `playwright.config.ts` § KÖRFORM (TASK-6) dokumenterar **sex deterministiska
  kollisioner** när `api-staging` och `chromium-authenticated` kör samtidigt
  (create-registration 89/129/160 · get-registrations väg D 86/132 · update-record 92). Den
  formen — delad muterbar testmiljö — är **lägst rankad i Googles SUT-ranking och HOLD-listad hos
  Thoughtworks**. Manuell UI-duplicering fungerar (ADR-050; S36 verifierade att tabell- och
  fält-ID:n bevaras) men är oanvändbar per körning: den är manuell och varje schema-ändring måste
  replikeras för hand — vilket dessutom kolliderar med P25.
- **v1-kompensation.** Tre lager. **(1)** Global mutex + ADR-073-semaforen håller invarianten
  "aldrig två samtidiga staging-rörande körningar". **(2)** Sentinel-UUID:er, `ZZ-`-prefix,
  `.purge-staging-policy.json` med exakt-match och `linkGuard` ger namnrymd och städning inom den
  delade basen — i praktiken Terraform-providrarnas mönster (slumpat namn + sweeper). **(3)**
  [ADR-080](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md) krymper den delade
  ytan i stället för att dela upp den: **410 s (74 %)** bärs av tester som redan mockar sina Edge
  Functions och flyttas till hermetisk acceptance-form, medan **~145 s (2,4 min)** genuint behöver
  en verklig backend. Det är branschmönstret, inte en kompromiss — Ghost kör 81 hermetiska filer i
  eget jobb plus 82 skarpa med en 418-vakt.
- **Fas E-krav.** Supabase-adaptern MÅSTE kunna backas av en **per-körning-instansierad** databas:
  Postgres klonas och seedas per CI-körning (schemat finns redan som schema-as-code, se P25:s
  Fas E-krav), alternativt via Supabase branching för PR-previews — ADR-050:s redan öppna dörr
  (*"kan adderas senare för PR-previews"*). När det är på plats **avvecklas den globala mutexen**
  (T85 våg 3) och shardning blir meningsfull. Notera ordningen: branching ensamt räcker INTE så
  länge Airtable är data of record, eftersom en branchad Edge Function pekar på samma enda
  Airtable-bas — isoleringen måste omfatta datakällan, inte bara Postgres-lagret.

#### P27 · Airtable är inte självhostbar — efemär backend är otillgänglig

- **Begränsning.** Airtable kan inte köras lokalt, i container eller i CI. Det finns ingen
  self-hosted-utgåva och ingen emulator. Branschens standardsvar på deterministisk e2e — att göra
  backend **efemär** per körning — är därmed strukturellt otillgängligt för oss, oberoende av P26.
- **Kostnad/manifestation.** Vi kan inte köpa determinism på det sätt jämförbara projekt gör.
  Ghost, Supabase och cal.com kan alla duplicera sin backend gratis eftersom de äger den; vi kan
  inte. Research-passet slår fast att **precedent för efemär backend mot icke-självhostbar SaaS är
  genuint tom** — vi ärver alltså ingens mönster för just detta och deklarerar tomheten öppet i
  stället för att fylla ut räkningen. Följdkostnaden är att den skarpa restmängden permanent måste
  köras mot en delad, långlivad miljö, med allt vad P26 beskriver.
- **v1-kompensation.** Samma som P26 lager 3 — krymp den skarpa ytan till det som genuint bär
  integrationsbevis, och acceptera mutexen över resten öppet. Kontraktsvakten i ADR-080 är
  villkoret som gör krympningen försvarbar: den fångar när en mock driftar från verkligt
  API-kontrakt, vilket är den enda äkta risken med hermetisering.
- **Fas E-krav.** Postgres **är** självhostbar — `supabase start` kör hela stacken i docker, och
  CI kan resa en färsk instans per jobb. Supabase-adaptern MÅSTE därmed kunna peka på en
  container-lokal instans utan kodändring (adaptern är redan swappbar per ADR-057). Först då är
  branschens efemär-backend-mönster tillgängligt för oss överhuvudtaget, och den lägst rankade
  SUT-formen kan lämnas helt.

### G. Bilagor och filhantering

> Tillagd `TASK-146.1` (2026-08-07). Kandidat-poster identifierade men medvetet
> INTE landade av forskningspasset
> [`utskicks-bilage-arkitektur-2026-08-03.md`](../research/utskicks-bilage-arkitektur-2026-08-03.md)
> § Delfråga 4 ("katalogen ändras EJ av detta pass") — PRD-kortet
> [TASK-146](../../backlog/tasks/task-146%20-%20PRD-Bilage-fundamentet-%E2%80%94-delad-hemvist-tre-dokumentklasser-och-PDF-generering-inom-plattformen.md)
> gav grind-skivan `TASK-146.1` uttrycklig DoD-instruktion att landa dem här
> ("Att lämna dem oförda vore att låta ett belagt fynd dö med sitt dokument").

#### P28 · Attachment-URL:er utgår efter 2 timmar (sedan 2022-11-08)

- **Begränsning.** [`support.airtable.com/docs/airtable-attachment-url-behavior`](https://support.airtable.com/docs/airtable-attachment-url-behavior),
  ordagrant: *"On November 8, 2022, Airtable introduced expiring attachment
  URLs across our product surface areas to help increase attachment
  security."* Giltighetstid: *"we will ensure that download URLs stay active
  for at least 2 hours after receiving them"* — Airtable reserverar sig för
  att ändra exakt fönster, men golvet är 2 timmar. Ingen förnyelsemekanism
  dokumenteras utöver att hämta record igen (ny URL följer med ett nytt
  API-svar). Airtables egen rekommendation för persistent åtkomst är
  uttryckligen: *"use an external hosting service or integration — like
  Zapier, Workato, or your code — to store a copy of the attachment
  separately from Airtable."*
- **Kostnad/manifestation.** En server-genererad PDF (brev, kvitto) som ska
  kunna refereras långt efter 2 timmar — t.ex. från en framtida
  Utskickslogg, eller vid omsändning — kan inte luta sig mot att Airtables
  egen attachment-URL fortfarande fungerar vid det tillfället. Ingen
  manifestation i DENNA kodbas ännu (bilage-fundamentet, TASK-146, är
  grönfält) — posten är FRAMÅTRIKTAD: den är skälet till att TASK-146
  medvetet valde bort Airtable-native attachment-fält som hemvist för
  bytesen, dokumenterat i research-passet § Delfråga 4 ("Vad detta faktiskt
  underbygger").
- **v1-kompensation.** **Ej tillämplig i vår arkitektur.** `Bilagor`-tabellen
  (TASK-146.2) håller metadata och eventkoppling, inte bytesen själva —
  Bilagor-tabellen är alltså inte i vägen för denna vägg, men väggen är
  SKÄLET till att den designades så. Ingen kompensationsmekanism byggs mot
  P28 eftersom Airtable aldrig blir den enda hemvisten för en genererad
  fil.
- **Fas E-krav.** Postgres/Supabase Storage har ingen motsvarande
  utgångstid på server-side läsning (`.download()` med service-role-nyckel,
  se research-passet § Delfråga 2) — endast signerade URL:er, vars
  giltighetstid VI väljer vid utfärdandet, inte plattformen.

#### P29 · Upload Attachment-API:t är kapat till 5 MB direkt-byte-uppladdning

- **Begränsning.** [`airtable.com/developers/web/api/upload-attachment`](https://airtable.com/developers/web/api/upload-attachment):
  `POST /v0/{baseId}/{recordId}/{attachmentFieldIdOrName}/uploadAttachment`,
  body `{ contentType, file (base64), filename }` — ordagrant: *"Upload an
  attachment up to 5 MB to an attachment cell via the file bytes
  directly."* Större filer måste gå via den andra vägen: sätta fältet till
  `[{ url: "…" }]` vid record-create/update, där Airtable själv hämtar och
  lagrar filen (Airtable blir den hämtande parten — samma mönster som
  Resends `path`-fält, research-passet § Delfråga 1). Generellt
  per-fil-tak ([`support.airtable.com/docs/attachment-field`](https://support.airtable.com/docs/attachment-field)):
  *"Airtable supports individual attachments up to 5GB in size"* (1 GB på
  Free-plan) via URL-baserad attach; per-bas total lagringsgräns per plan
  (Team-planen, vårt abonnemang, sekundärkälla `tasks/lessons.md` rad
  ~2054): 20 GB.
- **Kostnad/manifestation.** Samma relevans som P28: skälet TASK-146 aldrig
  seriöst övervägde bytes-i-basen. Ett server-side flöde som ville POSTa
  en genererad fil direkt in i ett Airtable attachment-fält skulle antingen
  tvingas stanna under 5 MB (direkt-byte) eller gå via URL-baserad attach —
  vilket kräver att bytesen REDAN ligger någon annanstans, cirkulärt om
  Airtable vore den enda hemvisten. Ingen manifestation i denna kodbas
  ännu (grönfält, samma skäl som P28).
- **v1-kompensation.** **Ej tillämplig** — samma skäl som P28. Bilagornas
  bytes går aldrig via Airtables upload-API i vår arkitektur.
- **Fas E-krav.** Supabase Storage har ett separat, mycket högre tak
  ([`supabase.com/docs/guides/storage/uploads/file-limits`](https://supabase.com/docs/guides/storage/uploads/file-limits):
  50 MB-golv på Free-plan, upp till 500 GB Pro/Team) hanterat av vår egen
  bucket-konfiguration, inte en leverantörs fasta API-gräns.

---

## Allvarlighets-axel — synliga fel vs tyst korruption

De flesta plattform-begränsningarna ger **synliga** fel: en krasch, en tom lista, ett 400/403. De är
besvärliga men självavslöjande — testet rödmarkerar, vyn visar inget, någon märker det.

Tre poster är i en farligare klass: **⚠️ tyst korruption** — data blir tyst fel utan att något larmar.
De är de starkaste Fas E-argumenten, eftersom ingen synlig signal fångar dem i v1:

| Post | Tyst fel | Varför inget larmar |
|---|---|---|
| **P2** — inga transaktioner | Partiell flytt → personen i BÅDA tabellerna (dubblett) | Båda anropen "lyckas" var för sig; ingen ser inkonsistensen |
| **P16** — automation-run-status | "Ran successfully" trots saknad länk/skrivning | Run-history är grön; sidoeffekten saknas tyst |
| **send-email / §Kända fällor 29** | Mail skickat men status-PATCH failar → mottagaren får dubbletter | EF returnerar ok; felet bara i Cloud-loggar (manifestation av P2) |

Synliga fel kan man jaga med tester och röda vyer. Tyst korruption kräver att man *vet att leta* — och
det är precis vad transaktioner och server-logik i Fas E gör onödigt. Prioritera dessa tre i Fas E-planen.

---

## Data-instans-fällor (städas bort med bas-sanering)

Dessa är **inte** plattform-begränsningar — de är smutsig data eller konfigurations-artefakter i DENNA
bas som försvinner när basen städas (de migreras inte bort, de *saneras* bort). De bor primärt i
[`data-model.md`](./data-model.md) §Kända fällor; här bara en pekande sammanfattning. Läs data-model för
detalj, åtgärds-rekommendation och live-stickprov.

| Fälla | Källa (detalj i data-model) |
|---|---|
| EventKey-format-bug ("11" vs "Event-11"), 5 records sanerade, källa öppen | §Reverse-flow F.2 + §Luckor 10 |
| Case-dubletter i `Vill anmäla sig till` ("…medvetandet 1" vs "…Medvetandet 1") | §Kända fällor 24 |
| Tomma singleSelect `choices=[]` (Manuella flagga, Systemkälla) — kan ej sättas | §Kända fällor 25 |
| SHA256-hashar som option-namn i `Källa (formulärkälla)` | §Kända fällor 26 + §Luckor 11 |
| `Är aktiv (1/0)` exkluderar Avbokad/Ombokad men inte Inställt | §Kända fällor 27 |
| Två parallella `Antal genomförda event`-fält (gammal rollup utan RIM 3) | §Kända fällor 28 |
| E-post lagrad som `multilineText` (typ-skuld, borde vara `email`) | data-model write-fält-tabeller (rad ~189, ~259) |
| Namnlösa Person-records (legitim lead-state) | §Kända fällor 21–22 |
| Döda SWITCH-grenar i Erfarenhetsbadge ("Genomfört alla" nås aldrig) | §Kända fällor 6 + 8 |
| `Källa` saknar "Arrangör"-option → dead frontend-filter | §Kända fällor 15 |
| Psionautics-event räknas ej in i RIM/FS-rollups (namn ≠ formel-filter) | §Kända fällor 4 |
| `Återkommande?` — missvisande namn | §Kända fällor 5 |
| RECORD_ID-formelfälten i Deltaganden (`Anmälan (ID)`, `Event (ID)`) ger fel data — **instans av P8** | §Kända fällor 23 |
| Manuella rader (Deltaganden/Anmälningar) auto-länkas inte utan Sessionsmall/EventKey | §Kända fällor 11 + 16 |
| A2:s grenordning bryter reverse-flow (Gren 1 uppdaterar namn men länkar ej Anmälan) — **instans av P23**. Den fördjupande mekanismen är `[HYPOTES — EJ VERIFIERAD]` (Marcus markerade aldrig-verifierad) | §Reverse-flow F.1 + §Kända fällor 12 + §Luckor 9 |

---

## Ändringslogg

| Datum | Ändring |
|---|---|
| 2026-06-21 | **Session 26 — initial skörd.** Dokumentet skapat ur Pass 1-råskörden (45 verifierade, fil:rad-belagda poster): 25 plattform-poster (grupperade A–E) + 15 data-instans-fällor (sammanfattade, pekar till data-model) + allvarlighets-axel (3 tyst-korruption-poster märkta). Klassningsbeslut applicerade: O1 + O3 utelämnade, O2 → underrad P25, O4 → data-instans (hypotes-flagga bevarad), O5 → P19 ("kräver escaping"). |
| 2026-07-27 | **Session 91 — sektion F, testbarhet och miljö-isolering** (Marcus order: dokumentet ska bära ALLA Airtable-tvingade kompromisser). Två nya plattform-poster: **P26** (ingen bas-duplicering via API — per-körning-isolering strukturellt omöjlig; två oberoende spärrar) och **P27** (icke-självhostbar — efemär backend otillgänglig; precedent-rymden tom). **P4 utvidgad** med två manifestationer: att 5 req/s-taket är DELAT och därmed gör test-shardning verkningslös även med perfekt isolering, samt en ⚠️ **öppen avvikelse** — klienten väntar 1 s efter 429 där dokumentationen kräver 30 s (tre ställen i `airtable-client.ts`; ej åtgärdad, ej trådförd). Beläggen fanns sedan 2026-07-26 i tre research-pass men saknade katalogpost; gränsdragningen tvång kontra eget val bor i [ADR-063 § S91-not](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md). Plattform-poster nu 27, grupperade A–F. |
| 2026-07-31 | **`TASK-53` (commit `123dbca`) — P4:s öppna avvikelse STÄNGD.** 1 s-backoffen efter 429 ersatt av Airtable-konform väntan i en egen mekanism ([`_shared/airtable-retry.ts`](../../supabase/functions/_shared/airtable-retry.ts)), delad av alla tre call-sites: exponentiellt från 30 s med additiv jitter och tak på 2 omförsök (härlett ur Supabase Edge Functions 150 s idle timeout — ett tredje omförsök hade gett 504). Verifierad med mockat 429-enhetstest som mäter faktisk väntetid; skarp framkallning valdes bort eftersom kvoten är delad (P26). Posten är därmed den första i katalogen som gått från öppen avvikelse till åtgärdad — noten behålls som historik, inte som skuld. |
| 2026-08-07 | **`TASK-146.1` — sektion G, bilagor och filhantering.** Två nya plattform-poster landade från kandidaterna forskningspasset [`utskicks-bilage-arkitektur-2026-08-03.md`](../research/utskicks-bilage-arkitektur-2026-08-03.md) § Delfråga 4 medvetet lämnade olandade: **P28** (attachment-URL:er utgår efter 2 timmar, sedan 2022-11-08 — v1-kompensation ej tillämplig, `Bilagor`-tabellen håller bara metadata) och **P29** (Upload Attachment-API kapat till 5 MB direkt-byte-uppladdning — v1-kompensation ej tillämplig, samma skäl). Båda är FRAMÅTRIKTADE: grönfält i denna kodbas, ingen manifestation ännu — de är skälet TASK-146 valde delad hemvist (bytes i Supabase Storage) i stället för Airtable-native attachment-fält, inte en åtgärdad brist. Plattform-poster nu 29, grupperade A–G. |
| 2026-08-10 | **`TASK-184` — P30, formlernas räckvidd över tabellgränsen.** En post som saknades i katalogen trots att den är en av de mest styrande väggarna: en formel når bara sin egen rad, lookup kräver ett befintligt länkfält, och länkfältet kan inte beräknas. Två förstapartscitat (`lookup-field-overview` + `linked-record-field`, båda hämtade 2026-08-10). Väggen upptäcktes när `TASK-184` skulle ge anmälningsgrenen i `Senaste interaktion (text)` kurs och ort: touchpointen kan strukturellt inte bära uppgiften, och ett nytt länkfält hade krävt en backfill som dessutom inte var härledbar. v1-kompensationen blev att läsa grenen över den relation som redan finns (`Personer.Anmälningar`), med enbart beräknade fält och noll backfill. Närliggande men skild från **P9** (som handlar om vad en lookup RETURNERAR, inte om vad den kan NÅ). Plattform-poster nu 30, grupperade A–G. |
| 2026-08-15 | **S102 Lotta-vandringen — P31, kallstartslatensen.** Kall appstart hämtar samtliga flikars kärndata sekventiellt under det delade 5 req/s-taket (P4) — ~6–7 s mätt skeleton-regn, väntetidsklassen där skeleton per NN/g är fel indikatorform. v1-kompensationen är Förberedelseskärmen med blockerande startvärmning ([ADR-112](../decisions/ADR-112-forberedelseskarmen-blockerande-startvarmning.md)); Fas E-kravet är en ÖPPEN omprövning av den blockerande formen mot den progressiva branschriktningen när Postgres-latensen gjort startvärmningen självdöende. Grillad samsyn S102 Del 7; research-belägg i [`app-startup-warmup-splash-2026-08-15.md`](../research/app-startup-warmup-splash-2026-08-15.md). Plattform-poster nu 31, grupperade A–G. |
