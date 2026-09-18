---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# Batch 1 (get-events, get-registrations) — mätpass mot STAGING, task-451.6

**Pass:** MÄTPASS, ENDAST STAGING (`apphjj8Q7lkXCMsL4` / `pqtshyierkdgwdnxuirz`).
Prod (`app8uGPrVCVOm6LfD` / `lvjsfnphlauldxqlncpl`) är mekaniskt spärrad för
agenter (`TASK-419`) och rördes inte. Ingen produktkod ändrad i detta pass —
enda skrivningen är denna fil + minta backlog-kort.

**Modell:** Sonnet 5 (`claude-sonnet-5`) — se slutrapporten för den exakta
citerade raden.

---

## 0. Dom

**Latensen är INTE en ren Airtable-vägg (P31) — den är till stor del en
ARKITEKTURFRÅGA i `get-events` själv.** `get-events` gör flera SEKVENTIELLA
Airtable-anrop internt (paginering + en chunkad batch-hämtning körd i en
`for`-loop, inte parallellt), och den kostnaden är oberoende av om
Edge Function-isolatet är varmt eller kallt. `get-registrations` (den gren
startvärmningen faktiskt anropar) gör däremot BARA en paginerad hämtning och
är genomgående snabbare i mina mätningar.

Det betyder inte att P31 (kallstartslatensen, delat 5 req/s-tak) är fel —
den är fortfarande grunden till varför "en hämtning" i denna kodbas ofta blir
"flera sekventiella hämtningar". Men "kallstart" i meningen "EF-isolatet
behövde starta om" kunde jag varken bekräfta eller utesluta i detta pass:
`get-events`/`get-registrations` loggar inga steg internt (§ 3.4), så jag kan
bara mäta EXTERN väggtid, inte dela upp den i kallstart/auth/Airtable-sidor
som AC #1 efterfrågar. Det är därför `TASK-459` (instrumentering) mintas i
stället för gissad uppdelning.

**Starkaste enskilda beläggen för arkitektur-domen, tillagda efter en andra,
stabil mätomgång (§ 4):** vid EXAKT samma datamängd, uppmätt tre gånger i
rad utan förändring (218 event / 194 registreringar), gav `get-events`
2 259,9–2 331,6 ms (spann 72 ms) och `get-registrations` 1 062,7–1 132,6 ms
(spann 70 ms) — kvot **≈ 2,1×**, tätt och reproducerbart. Om latensen vore
dominerad av EF-kallstart hade jag väntat mig MER spridning mellan tre
anrop tagna 5–15 s ifrån varandra (kallstart är en engångskostnad per
isolat-cykel, inte en stabil per-anrop-avgift). Den tighta spridningen
pekar mot att BÅDA EF:erna redan var varma i denna delserie, och att hela
2,1×-differensen är strukturell (antal sekventiella Airtable-anrop,
§ 4.3) — inte kallstart.

**Ett konkret, kod-belagt åtgärdsförslag finns och är mintat: `TASK-458`** —
parallellisera `get-events`s chunkade batch-hämtning, exakt det mönster
`TASK-416.12` (Done) redan bevisade fungerar för en syskon-EF i samma
kodbas (16,8 % median-besparing, mätt i staging).

---

## 1. Metod

### 1.1 Vad som mättes, och varför just detta

Startvärmningens batch 1 (`src/data/warmup/startvarmningen.ts` rad 242–252,
258–263, `BATCH_SIZE = 2`, rad ~115) anropar `dataSource.fetchEvents()` och
`dataSource.fetchRegistrations()` **utan argument** — verifierat mot
`src/data/adapters/AirtableAdapter.ts:143–158`. Det mappar till:

- `GET /functions/v1/get-events` — inga query-params.
- `GET /functions/v1/get-registrations` — inga query-params (den
  **event-lösa grenen**, `supabase/functions/get-registrations/index.ts`
  rad 135–179, INTE eventId-grenen — warmup skickar aldrig `eventId`).

Jag mätte EXAKT dessa två anrop, samma form, mot staging — ingen syntetisk
last, ingen egen fixtur.

### 1.2 Autentisering

Login mot staging Supabase Auth REST API
(`POST {TEST_SUPABASE_URL}/auth/v1/token?grant_type=password` med
`apikey: {TEST_SUPABASE_ANON_KEY}` och `.env.test`s `TEST_USER_EMAIL`/
`TEST_USER_PASSWORD`) — samma mönster som `tests/api/helpers.ts` sin
`loginUser`. Access-token skickades sedan som `Authorization: Bearer …` på
varje EF-anrop, identiskt med vad `src/data/config/supabase-client.ts`s
`getAuthHeader()`/`callEdgeFunction` gör (ingen `apikey`-header skickas av
klienten — bekräftat i källan, så jag skickade ingen heller).

### 1.3 Semafor/preflight — repots skyddsmekanism, respekterad

`scripts/staging-semaphore.sh acquire/preflight/release` användes runt varje
mätomgång (`docs/reference/staging-verifiering-runbook.md` § Staging-
preflighten, `CONTRIBUTING.md` § Staging-preflighten). Detta ÄR anledningen
till att mätpasset har TVÅ separata mätomgångar i stället för en: mitt i
passet fällde preflighten på en levande `post-merge.yml`-körning
(`Staging (API + E2E)`, run `35337578276`) — jag väntade ut den i stället för
att mäta mot en bas som samtidigt kördes av CI:s egen staging-svit (exakt det
scenario preflighten finns för att förhindra: *"en lokal körning nu kan ge
ett falskt rött på det landade trädet"*).

### 1.4 Mätmetod

Node 24 (`fetch`, inbyggd), `performance.now()` runt varje `fetch`-anrop
(inklusive `res.text()` + JSON-parse av kroppen, så mätningen omfattar HELA
väggtiden en klient upplever — inte bara TTFB). Skript:
`login.mjs` + `mat.mjs`, körda i sessionens scratchpad (utanför repot).
Varje rad loggad till en JSONL-fil med `label`, `fn`, `startedAt` (ISO),
`ms`, `status`, `recordCount`.

### 1.5 "Kallt" — hur jag försökte få EF:en kall, och begränsningen

Uppdraget förbjuder mig att FRAMKALLA kyla via väntetid eller omdeploy utan
att stanna och fråga. Jag gjorde ingetdera. Det enda jag hade var
**opportunistisk kyla**: den första hämtningen i min session, mätt precis
efter att preflighten sagt att inget känt staging-rörande CI-jobb var igång
(§ 2.1). Jag kan INTE bevisa att detta var ett kallt Edge Function-isolat i
Deno Deploy-mening — jag kan bara visa att det var det FÖRSTA anropet i mitt
mätfönster, klart långsammare än de följande, och att ingen känd CI-körning
var igång enligt preflighten vid den tidpunkten. Se § 2.3 för den ärliga
gränsen: samtidig icke-CI-spårad skrivaktivitet i basen gör en ren
kall-vs-varm-tolkning omöjlig att försvara ensam.

---

## 2. Rådata — mätomgång 1 (kontaminerad av samtidig flotta-aktivitet)

### 2.1 Kontext vid start

- `git fetch` + `bash scripts/staging-semaphore.sh preflight …` →
  **PREFLIGHT OK** kl. 11:00:31 UTC (2026-09-18) — inget känt staging-rörande
  CI-jobb (`post-merge.yml`/`nightly.yml`) pågick enligt policyn i
  `.staging-semaphore-policy.conf`.
- Senaste kända `post-merge.yml`-körning före detta hade redan slutförts
  (`conclusion: success`, `createdAt: 2026-09-18T10:54:56Z`) — alltså ~6 min
  innan min första mätning, gott om marginal för att dess egen
  `Staging (API + E2E)`-svit (om den körde EF-anrop) skulle ha svalnat.

### 2.2 Rådata (n=6 per funktion, `label`/`fn`/`ms`/`status`/`recordCount`)

| Ordning | Tid (UTC) | Funktion | ms | status | recordCount |
|---|---|---|---|---|---|
| 1 | 11:00:33.881 | get-events | **14 087,8** | 200 | 180 |
| 2 | 11:00:47.969 | get-registrations | 1 381,6 | 200 | 178 |
| 3 | 11:00:55.354 | get-events | 8 370,4 | 200 | 186 |
| 4 | 11:01:03.725 | get-registrations | 1 644,5 | 200 | 181 |
| 5 | 11:01:05.446 | get-events | 4 962,6 | 200 | 190 |
| 6 | 11:01:10.409 | get-registrations | 1 442,2 | 200 | 182 |
| 7 | 11:01:11.930 | get-events | 3 163,9 | 200 | 191 |
| 8 | 11:01:15.095 | get-registrations | 1 092,4 | 200 | 182 |
| 9 | 11:01:16.273 | get-events | 2 501,6 | 200 | 191 |
| 10 | 11:01:18.775 | get-registrations | 1 106,4 | 200 | 182 |
| 11 | 11:01:19.955 | get-events | 2 476,2 | 200 | 191 |
| 12 | 11:01:22.432 | get-registrations | 1 739,6 | 200 | 182 |

Alla 200, noll fel, noll 429 (ingen retry-inblandning i mätningen — det jag
ser är genuin väggtid, inte backoff).

**get-events: 14 087,8 / 8 370,4 / 4 962,6 / 3 163,9 / 2 501,6 / 2 476,2 ms**
— tydligt fallande serie, aldrig under ~2,5 s.

**get-registrations: 1 381,6 / 1 644,5 / 1 442,2 / 1 092,4 / 1 106,4 /
1 739,6 ms** — betydligt jämnare, 1,1–1,7 s, ingen tydlig trend.

### 2.3 Ärlig kant: `recordCount` VÄXTE under mätningen — basen var inte i vila

`Eventplanering` gick 180 → 191 rader och `Anmälningar` 178 → 182 rader
UNDER de ~49 sekunder mätomgången tog — **innan** den CI-körning jag senare
detekterade (§ 1.3) ens hade startat (dess `Staging (API + E2E)`-jobb
startade `11:02:25Z`, efter att hela mätomgång 1 redan var klar `11:01:22Z`).
Något ANNAT skrev alltså till staging-basen samtidigt med min mätning, utan
att synas i `scripts/staging-semaphore.sh`s bevakade jobbnamn — troligen
en annan agents/sessions direkta Airtable-aktivitet (seed/backfill/en annan
lokal testkörning) i den DELADE basen (`airtable-constraints.md` P26/P27).

**Detta är inte en isolerad slump i detta pass** — samma fenomen är redan
dokumenterat en gång i denna kodbas: `TASK-416.12`s Implementation Notes
(Done) skriver ordagrant *"fixturen har vuxit av annan pågående
flotta-aktivitet under mätfönstret 2026-09-06"* om precis samma
mät-mot-delad-staging-situation.

**Konsekvens för tolkningen:** jag kan INTE ensam attribuera den fallande
serien (14,1 s → 2,5 s) till "EF-kallstart svalnade av". Ett minst lika
rimligt HYPOTES-alternativ: det DELADE 5 req/s-taket (P4) var mer belastat
tidigt i fönstret av den okända samtidiga skrivaktiviteten, och avlastades
efter hand. Sannolikt är det EN BLANDNING av båda — men jag kan inte separera
dem utan server-side instrumentering (`TASK-459`).

---

## 3. Kod-nivå: sekventiella Airtable-anrop per körning (räknat, inte gissat)

Räkningen nedan är statisk källkodsläsning, oberoende av mätfönstrets
kontaminering — den håller oavsett vad som pågick samtidigt i basen.

### 3.1 `get-events` (`supabase/functions/get-events/index.ts`)

1. **`fetchFromAirtable('Eventplanering')`** (rad 136) — full paginering,
   `do…while(offset)` i `_shared/airtable-client.ts:76–133`. Airtables
   `pageSize` ≤ 100 (P5) ⇒ `ceil(antal event / 100)` SEKVENTIELLA sidanrop
   (offset-kedjan är per definition serialiserad, P6).
2. **Parallellt** (`Promise.all`, rad 141–144):
   - **`fetchBorOverAntalByEvent`** (rad 66–91) samlar VARJE events länkade
     `Anmälningar (länkat fält)`-ID:n, deduplicerar, och batch-hämtar dem via
     `fetchByRecordIds` (rad 39–51) — en chunkad `OR(RECORD_ID()=…)`-formel,
     `BATCH_SIZE = 50` (rad 21). **Chunkarna körs i en `for`-loop med
     `await` (rad 45) — SEKVENTIELLT, inte `Promise.all`.** `ceil(antal
     unika länkade Anmälnings-ID:n / 50)` sekventiella anrop.
   - **`hamtaStandardpriser`** (`_shared/eventpris.ts:66–` ) — högst ETT
     anrop mot `Eventinnehåll` (7 rader i basen), och NOLL om varje eventrad
     redan har ett eget pris (`standardprisNycklar`, tomt urval ⇒ tidig
     retur, `eventpris.ts` rad 74).

**Totalt, sekventiellt-dominerande:** `ceil(N_events/100)` (steg 1) +
`max(ceil(N_länkade_reg/50), 1)` (steg 2, den långsammare av de två
parallella grenarna) — vid mätfönstrets ~190 event / ~180–191 länkade
registrerings-ID:n: **2 sidor + 4 chunkar ≈ 6 sekventiella Airtable-
rundresor**, plus 0–1 för prisuppslaget (i luften parallellt, döljs bakom
chunkarna om de är fler).

### 3.2 `get-registrations`, event-lösa grenen (rad 135–179)

**ETT anrop-familj:** `fetchFromAirtable(TABLE_NAME, { filterByFormula:
undefined, sort })` — full paginering av `Anmälningar`, `ceil(N_reg/100)`
sekventiella sidor. Ingen chunkad batch, ingen `berikaPersonhistorik` (den
funktionen används BARA i `eventId`-grenen — läst i
`_shared/registration-read.ts`, bekräftat: warmup skickar aldrig `eventId`).
Vid ~180 registreringar: **2 sekventiella sidor.**

### 3.3 Varför det här förklarar mätningens FORM, inte bara dess storlek

`get-registrations` gör konsekvent ~2 sekventiella anrop och mättes till
1,1–1,7 s ⇒ **~0,5–0,85 s per Airtable-rundresa** i detta fönster.
`get-events` gör (vid samma datavolym) ~6, och 6 × 0,5–0,85 s = **3,0–5,1 s**
— vilket täcker MITTEN av min uppmätta `get-events`-serie (2,5–8,4 s) väl.
De extrema punkterna (14,1 s första anropet, 8,4 s andra) ligger utanför
den räkningen och pekar mot ANNAT som lades ovanpå tidigt i fönstret — se
§ 2.3.

### 3.4 Instrumentering — finns INTE, byggs INTE i detta pass

`grep -n "console\.|performance.now|Date.now|execution_time"` mot
`get-events/index.ts`, `get-registrations/index.ts`,
`_shared/airtable-client.ts`, `_shared/eventpris.ts`,
`_shared/registration-read.ts`, `_shared/errors.ts` gav noll timing-rader
(enda träffarna: `eventpris.ts:89` ett `console.warn` vid fallerat
prisuppslag, `errors.ts:110/112` `console.info`/`console.error` vid FEL).
Det finns alltså ingen serverlogg som kan dela upp väggtiden i
kallstart/auth/Airtable-sidor/serialisering. Per uppdragets instruktion
föreslås instrumenteringen som åtgärdskort (`TASK-459`) i stället för att
byggas här.

---

## 4. Rådata — mätomgång 2 (efter att CI:s staging-körning släppt basen)

### 4.1 Vänte-kvitto — hur länge basen faktiskt var upptagen

Preflighten fällde första gången kl. **11:02:25 UTC** (`post-merge.yml`-
körning `35337578276`, jobbet `Staging (API + E2E)` startade då). Jag körde
INGEN mätning mot staging under tiden den var upptagen — bara läs- och
skriv-arbete i repot (kod-räkningen i § 3, kortmintning, denna fil). Kl.
**11:18:52 UTC** svarade preflighten OK igen — **16 min 27 s** total väntan.
`gh run view` vid det laget visade `Staging (API + E2E)`: `completed/
success` OCH `Staging sentinel purge (efter körning)`: `completed/success`
— alltså exakt den ordning `CONTRIBUTING.md` § Efter-körning-purgen
beskriver (E2E-svit, sedan purge av det den själv skapade).

### 4.2 Rådata (n=5 per funktion)

| Ordning | Tid (UTC) | Funktion | ms | status | recordCount |
|---|---|---|---|---|---|
| 1 | 11:18:59.314 | get-events | 2 557,8 | 200 | 242 |
| 2 | 11:19:01.880 | get-registrations | 1 081,0 | 200 | 194 |
| 3 | 11:19:24.516 | get-events | 2 480,0 | 200 | 218 |
| 4 | 11:19:26.997 | get-registrations | 1 109,4 | 200 | 194 |
| 5 | 11:19:32.455 | get-events | 2 331,6 | 200 | 218 |
| 6 | 11:19:34.801 | get-registrations | 1 132,6 | 200 | 194 |
| 7 | 11:19:39.965 | get-events | 2 259,9 | 200 | 218 |
| 8 | 11:19:42.226 | get-registrations | 1 062,7 | 200 | 194 |
| 9 | 11:19:46.498 | get-events | 2 291,8 | 200 | 218 |
| 10 | 11:19:48.791 | get-registrations | 1 091,3 | 200 | 194 |

Alla 200, noll fel, noll 429.

**Fortfarande INTE en vilande bas:** `recordCount` för `get-events` gick
242 → 218 → 218 → 218 → 218 (den efter-körning-purgen som just avslutats
enligt § 4.1 verkar ha tagit några sekunder till innan resultatet syntes i
mina anrop) — men de SISTA TRE mätningarna (rad 5–10, kl. 11:19:32–11:19:48) är
mätta mot en STABIL bas: 218 event / 194 registreringar i alla tre,
identiskt. **Detta är den renaste delserien i hela passet:**

- **get-events (stabil delserie):** 2 331,6 / 2 259,9 / 2 291,8 ms — spann
  **72 ms** över tre anrop. Extremt tätt.
- **get-registrations (stabil delserie):** 1 132,6 / 1 062,7 / 1 091,3 ms —
  spann **70 ms**.

Kvoten get-events/get-registrations i den stabila delserien: **≈ 2,1×**.

### 4.3 Härledd (INTE mätt) uppdelning fast/per-anrop, från den stabila delserien

Detta är en HÄRLEDNING ur två ekvationer, inte en mätning — se § 3.4 för
varför ingen server-side uppdelning finns. Vid den stabila bas-storleken
(218 event, 194 registreringar): `get-registrations` gör `ceil(194/100) = 2`
sekventiella Airtable-sidor; `get-events` gör `ceil(218/100) = 3` sidor +
`ceil(194/50) = 4` Bor-över-chunkar (den långsammare av de två parallella
grenarna, § 3.1) = **7** sekventiella Airtable-rundresor i sin kritiska väg.

Med medelvärdena 1 095,5 ms (get-registrations, 2 anrop) och 2 294,4 ms
(get-events, 7 anrop), och modellen `tid = FAST + antal_anrop × PER_ANROP`:

```text
FAST + 2·PER_ANROP = 1 095,5
FAST + 7·PER_ANROP = 2 294,4
⇒ PER_ANROP ≈ 240 ms, FAST ≈ 616 ms
```

**Tolkning, uttryckligen som hypotes:** ~600 ms verkar vara en FAST kostnad
som inte beror på antalet Airtable-anrop (troligen auth-kontrollen i
`requireUser` mot Supabase Auth, gateway-routing till Edge Function-
regionen, JSON-serialisering) — och varje YTTERLIGARE sekventiell
Airtable-rundresa kostar därefter ~240 ms i detta fönster. Två ekvationer,
två okända, ingen tredje datapunkt att verifiera linjäriteten mot — modellen
är en RIKTNING, inte ett kalibrerat instrument. `TASK-459` (instrumentering)
är vägen till en riktig uppdelning.

---

## 5. MÄTT vs HYPOTES — sammanfattning

| Påstående | Klass | Källa |
|---|---|---|
| `get-events` tog 14 087,8 ms vid FÖRSTA anropet i mätfönstret, mot staging | **MÄTT** | § 2.2, rad 1 |
| `get-events` varm-serie, mätomgång 1 (anrop 2–6): 2 476–8 370 ms | **MÄTT** | § 2.2 |
| `get-events`, STABIL bas (218/194 rader oförändrat tre anrop i rad), mätomgång 2: 2 259,9–2 331,6 ms — spann 72 ms | **MÄTT** | § 4.2 |
| `get-registrations` (event-lösa grenen), STABIL bas: 1 062,7–1 132,6 ms — spann 70 ms | **MÄTT** | § 4.2 |
| `get-events` gör ~7 sekventiella Airtable-rundresor vid 218 event/194 länkade regs; `get-registrations` gör ~2 | **MÄTT** (statisk kodläsning, fil:rad-belagd) | § 3.1–3.2, § 4.3 |
| ~600 ms fast overhead + ~240 ms per sekventiellt Airtable-anrop | **HÄRLEDNING** ur två datapunkter (linjär tvåvariabelmodell) — riktningsgivande, inte kalibrerad | § 4.3 |
| Den fallande serien i mätomgång 1 (§ 2.2) berodde HELT eller DELVIS på EF-kallstart | **HYPOTES, overifierad** — mätomgång 2:s stabila delserie (§ 4.2) visar att SAMMA bas-storlek ger samma latens oavsett hur "varmt" anropet är i tid räknat, vilket stärker att § 2.2:s fallande kurva till STOR del var den samtidiga skrivaktivitetens/rate-limit-delningens effekt (§ 2.3), inte enbart EF-uppvärmning — men en äkta kallstart-komponent OVANPÅ detta är inte utesluten | Ingen server-instrumentering fanns att skilja dem åt (§ 3.4) |
| I PROD skulle `get-events`s Bor-över-batch göra FLER sekventiella chunkar än i staging (fler historiska Anmälningar länkade över events) | **HYPOTES**, riktningen är kod-logiskt sund (fler länkade ID:n ⇒ fler `ceil(N/50)`-chunkar) men OVERIFIERAD — prod är förbjuden mark för agenter (`TASK-419`) | § 6 |
| Sentry-timeouten 2026-09-18 berodde specifikt på `get-events`/`get-registrations` | **HYPOTES** — uppdragets premiss (källmärkt Marcus/Sentry-chatten), stärkt av `startvarmningen.ts` BATCH_SIZE=2 ⇒ batch 1 = get-events+get-registrations, men jag har INTE läst Sentry själv i detta pass | § 7 (Marcus verifierar i prod) |
| Staging är ett HÅRT belastat, kontinuerligt muterat delat resurs just denna session (16 min 27 s väntan på EN CI-körning, plus okänd fleet-skrivaktivitet utanför CI) | **MÄTT** | § 2.3, § 4.1 |

---

## 6. Staging har MINDRE data än prod — skala resonemanget ärligt

Mätfönstrets staging-bas: **~180–191 rader i `Eventplanering`, ~178–182 i
`Anmälningar`** (§ 2.2, växande under mätningen — se § 2.3 för varför).

Prod, källmärkta punktmätningar (INTE från detta pass — härledda ur
tidigare research/data-model, med datum, eftersom prod är förbjuden mark
för mig):

- **`Eventplanering`: 57 rader** (40 Genomfört + 14 Planerat + 3 Inställt),
  mätt LIVE 2026-09-06 via Airtable MCP mot prod-basen —
  `docs/research/forvarma-allt-branschmonster-2026-09-06.md` § 4. Samma
  dokument noterar att detta var en **5× tillväxt på sex veckor** (11 event
  2026-07-24 → 57 2026-09-06) — talet är alltså **redan tolv dagar gammalt**
  vid detta mätpass och sannolikt högre i dag.
- **`Anmälningar`: minst 816 rader** (365 av 816 saknar namn — fälla 43,
  Session 60, 2026-07-09) — **över två månader gammalt**, garanterat
  betydligt fler i dag (`Anmälningar` växer monotont, till skillnad från
  `Eventplanering` som också krymper via Inställt/arkivering).

**Den ärliga skalningen, i båda riktningarna:**

- **`Eventplanering`-paginering** (steg 1 i § 3.1): prod (57 rader, senast
  mätt) ryms sannolikt på **1** sida (< 100) mot stagings **2** — där är
  staging (just nu, med sin ackumulerade test-fixtur-skuld) alltså
  DYRARE än prod, inte billigare. Detta är en känd, öppet bokförd egenhet:
  staging samlar `ZZ-`-fixturer mellan städningar (`CONTRIBUTING.md` §
  Efter-körning-purgen); prods 57 är den "riktiga" affärsvolymen.
- **Bor-över-batchens chunkar** (steg 2 i § 3.1): beror på antalet UNIKA
  `Anmälningar`-ID:n länkade från VARJE event i `Eventplanering` — alltså
  över HELA bassen historik, inte bara "Planerat". Med 816+ registreringar
  fördelade över (rimligen) merparten av de 57 eventen, är det troligt att
  prod chunkar BETYDLIGT fler än stagings 4 — men jag har INTE mätt hur
  många unika ID:n som faktiskt är länkade i prod, så antalet chunkar i
  prod är en **HYPOTES**, inte en räkning.
- **`get-registrations`s paginering** (§ 3.2): prod (816+) kräver
  **`ceil(816/100) = 9`** sekventiella sidor mot stagings **2** — detta ÄR
  en direkt räkning (P5:s 100-tak är plattformsfakta, inte gissning), och
  den pekar entydigt åt att **`get-registrations` är SNABBARE i staging än
  den rimligen är i prod**, oavsett EF-kallstart. Denna siffra (9 sidor) är
  en HYPOTES bara i meningen att jag inte vet dagens EXAKTA radantal — själva
  räknemetoden (100-per-sida) är MÄTT plattformsfakta (P5).

**Slutsats:** staging underskattar sannolikt `get-registrations`s prod-kostnad
rejält (fler sidor i prod), och underskattar sannolikt även `get-events`s
Bor-över-batch (fler unika länkade ID:n i prod) — MEN staging råkar just nu
överskatta `get-events`s ren paginering (fler ZZ-rader i staging än
riktiga event i prod). Nettot pekar mot att **prod-latensen för batch 1 är
åtminstone i samma härad som stagings, sannolikt värre för
`get-registrations`** — men detta ÄR en hypotes tills Marcus kör § 7.

---

## 7. Prod-mätningar Marcus behöver göra — körklara kommandon

Jag kan inte röra prod (`TASK-419`, mekaniskt spärrad för agenter). Detta är
vad JAG hade kört om spärren inte fanns, skrivet så Marcus kan köra det
direkt.

### 7.1 Primär väg: Supabase Dashboard, per-funktion Logs

1. Öppna Supabase Dashboard → projektet `lvjsfnphlauldxqlncpl` (prod) →
   **Edge Functions** → `get-events` → fliken **Logs**.
2. Filtrera tidsintervallet till incidentfönstret (2026-09-18, tiden du
   öppnade appen efter en veckas vila).
3. Upprepa för `get-registrations`.
4. Varje rad visar tidsstämpel, status och varaktighet (ms) per anrop — leta
   efter anrop nära eller över **9 000 ms** (warmup-gatens hårda tak,
   `startvarmningen.ts:112`).

### 7.2 Fältnamn för en egen SQL-fråga i Logs Explorer

Verifierat mot Supabases EGEN dokumentation (`supabase.com/docs/guides/
observability/log-field-reference`, hämtad 2026-09-18) — tabellen
`function_edge_logs`, fälten:

- `metadata.execution_time_ms` — varaktighet i millisekunder.
- `metadata.response.status_code` — HTTP-status.
- `metadata.function_id` — vilken funktion.
- `metadata.deployment_id` / `metadata.version` — vilken deploy.

Jag har INTE ett verbatim-verifierat exempel på den fullständiga
`cross join unnest`-frågesyntaxen Logs Explorer använder (Supabases egna
docs-sidor jag nådde beskrev fälten men inte en komplett frågeexempel) — så
istället för att gissa en syntax: öppna Logs Explorer, filtrera på
Edge Functions, och Dashboardens egen UI bygger frågan; fälten ovan är vad
du letar efter i resultatet/kolumnväljaren.

### 7.3 CLI — INTE tillgängligt i denna installation

`supabase functions --help` (CLI **2.75.0**, installerad i detta repo)
saknar en `logs`-subkommando helt (verifierat: `Available Commands: delete
deploy download list new serve` — ingen `logs`). En nyare CLI-version
(**2.117.0**) finns tillgänglig men jag har INTE verifierat om den lade till
`functions logs` — påstå det inte förrän det är verifierat. Dashboard-vägen
(§ 7.1) är den verifierat fungerande vägen just nu.

### 7.4 Räkna faktiska Bor-över-chunkar i prod (om Marcus vill bekräfta § 6)

Read-only via `mcp__claude_ai_Airtable__*` (claude.ai-connectorn, prod
tillåten för huvudsessionen per `CLAUDE.md` § Verktygsfakta,
`TASK-419`-beslut `419 A`): räkna unika record-ID:n i `Eventplanering.
Anmälningar (länkat fält)` över SAMTLIGA rader, dividera med 50, `ceil()` —
det talet är exakt antalet sekventiella chunk-anrop `fetchBorOverAntalByEvent`
gör i prod i dag.

---

## 8. Källor och filer lästa i detta pass

**Kod:** `supabase/functions/get-events/index.ts` ·
`supabase/functions/get-registrations/index.ts` ·
`supabase/functions/_shared/airtable-client.ts` ·
`supabase/functions/_shared/airtable-retry.ts` ·
`supabase/functions/_shared/eventpris.ts` ·
`supabase/functions/_shared/registration-read.ts` ·
`supabase/functions/_shared/event-map.ts` (utdrag) ·
`supabase/functions/_shared/auth.ts` ·
`supabase/functions/get-event/index.ts` (utdrag, jämförelse) ·
`supabase/functions/get-event-attachments/index.ts` (utdrag,
`withConcurrencyLimit`-precedentet) ·
`src/data/warmup/startvarmningen.ts` (utdrag) ·
`src/data/adapters/AirtableAdapter.ts` (utdrag) ·
`src/data/config/supabase-client.ts` · `tests/api/helpers.ts` ·
`tests/api/auth.setup.ts` · `supabase/config.toml` (utdrag).

**Dokument:** `docs/research/kallstarten-diagnoskarta-2026-09-18.md` §
1.7–1.8, § 4 H-C, § 10 · `docs/reference/airtable-constraints.md` (P4, P5,
P6, P26, P27, P31) · `docs/reference/staging-verifiering-runbook.md` ·
`CONTRIBUTING.md` § Staging-preflighten + § Efter-körning-purgen ·
`docs/reference/data-model.md` §Kända fällor 43 ·
`docs/research/forvarma-allt-branschmonster-2026-09-06.md` §4 ·
`tasks/todo.md` (S123-avsnittet, bilage-EF-latensen 1,0–1,6 s varm /
10,3 s kall) · `backlog/tasks/task-416.12` (Implementation Notes,
`withConcurrencyLimit`-mätserien).

**Externt (verifierat, citerat):** `supabase.com/docs/guides/telemetry/logs`
(`function_edge_logs`/`function_logs`-distinktionen) ·
`supabase.com/docs/guides/observability/log-field-reference`
(`metadata.execution_time_ms` m.fl., hämtat 2026-09-18).

**Verktyg körda:** `scripts/staging-semaphore.sh acquire/preflight/release` ·
`gh run list`/`gh run view` (CI-läge, ingen mutation) · Supabase Auth REST
API (login) · rå `fetch` mot deployade EF:er (GET, samma header-form som
appen).
