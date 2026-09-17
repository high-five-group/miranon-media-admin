---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Airtables kompromisser i vår arkitektur — kompromissregister och empiriska fynd

> **Proveniens.** Skrivet av research-passet för Jobb 5 i CI-djupgranskningen
> (Session 126), 2026-09-17. Modell: Claude Sonnet 5 (exakt modell-ID
> `claude-sonnet-5`, ur egen systemprompt). Ögonblicksbild: arbetskatalogen
> `.claude/worktrees/s126-ci-djupgranskning`, gren
> `docs/s126-ci-djupgranskning`, commit `2f11a44327e36228a1d6605773626f0b76b14379`.
> Airtable-anropen i detta dokument gick mot **staging-basen**
> (`apphjj8Q7lkXCMsL4`), enbart läsande, via `mcp__airtable__*`
> (Personal-Access-Token-servern). Produktionsbasen rördes aldrig — den är
> dessutom mekaniskt låst för subagenter (`scripts/deny-prod-airtable.sh`).

**Ordlista för den som inte jobbar med detta dagligen:** en *Edge Function*
(förkortas **EF**) är ett litet serverprogram som appen anropar i stället för
att prata direkt med Airtable eller databasen. En *rate limit* är en
hastighetsspärr — "max så här många anrop per sekund". En *transaktion* är en
skrivning som antingen lyckas helt eller inte alls, aldrig till hälften. En
*mutex* eller *semafor* är ett lås som gör att bara EN process i taget får
röra en delad resurs. *Hermetisk* betyder helt isolerad — testet rör aldrig
det riktiga nätverket. En *sentinel* är en testpost med ett igenkännbart namn
(hos oss `ZZ-…`) som ett städ-skript senare kan hitta och radera. *RLS* (Row
Level Security) är databasens egen regel för vem som får läsa och skriva
vilka rader.

## Kort svar

**Airtable tvingar fram tre verkliga, ograverbara väggar** — ingen
per-körnings-kopia av basen, ett delat hastighetstak på 5 anrop/sekund, och
ingen möjlighet att köra Airtable lokalt eller i en container. Dessa tre är
redan grundligt katalogiserade (`docs/reference/airtable-constraints.md`,
posterna P26/P27/P4) och ADR-belagda (`ADR-063` § S91-not), och jag har
**bekräftat att katalogen fortfarande stämmer** för dem. De tre väggarna är
roten till nästan HELA den maskineri-tunga delen av test-arkitekturen: den
globala staging-mutexen, sentinel/purge-mekaniken, och den hermetiska
utbrytningen (`ADR-080`).

**Men en påtaglig del av det jag hittade är INTE Airtables fel** — det är
egna val, eftersläpning, eller en möjlighet som ännu inte utnyttjats:

1. **Skrivvägen mot Airtable har inget omförsök vid 429** (rate-limit-fel) —
   bara läsvägen har det. Verifierat direkt i koden, inte i katalogen.
2. **Betalningsdomänen flyttade redan till Postgres** (`ADR-128`,
   2026-08-30) — men dess tester körs ändå i **samma** delade,
   mutex-skyddade staging-miljö som Airtable-testerna, trots att Postgres
   kan köras lokalt i en container. Möjligheten finns, den används bara
   inte än.
3. **Nattens "kontraktsvakt"** (som ska bevisa att testernas låtsas-svar
   fortfarande liknar verkligheten) bevakar i dag **7 av 18** mockade
   Edge Functions — en täckningsgrad som inte hängt med när mock-lagret
   växte, och filens egen kommentar säger fortfarande "alla sju bevakas"
   som om sju vore hela ytan.
4. Jag hittade en **direkt felaktighet** i den befintliga väggkatalogen:
   den säger att Airtables PAT-verktygsserver är blind för vyer — jag
   frågade den live och fick tillbaka en fullständig vylista.

**Och den viktigaste strukturella nyansen:** Airtable-kostnaden i CI ligger
nästan uteslutande i **efterhandsverifieringen** (post-merge och natt), inte
i det en PR måste vänta på för att få landa. En vanlig PR betalar noll av
detta — `ci.yml` skickar `run_staging: false` ovillkorligt. Det gör inte
kostnaden mindre viktig, men det gör den till ett underhålls- och
robusthets-problem snarare än ett flaskhalsproblem för det dagliga arbetet.

## Vad jag läste först

Jag inventerade `docs/research/` och hittade fem befintliga pass som rör
staging/Airtable-testytan (`merge-queue-mot-staging-mutex-2026-07-26.md`,
`staging-fixturinventering-2026-08-10.md`,
`staging-svitens-tidsbudget-2026-07-26.md`,
`claude-ai-airtable-connector-flera-baser-2026-08-10.md`,
`prodbas-synk-staging-till-prod-2026-08-11.md`) — samtliga är redan
inarbetade i de styrande dokumenten jag läste härnäst, så jag har inte
grävt i dem separat.

Den auktoritativa väggkatalogen, `docs/reference/airtable-constraints.md`
(647 rader, senast uppdaterad 2026-08-26, alltså tre veckor gammal), är
**grundlig och i huvudsak korrekt** — 31 poster (P1–P31), var och en med
`v1-kompensation` och `Fas E-krav`, `fil:rad`-belagda. Jag har läst den i
sin helhet. Jag har **inte** skrivit om den. Mitt bidrag är att pröva ett
urval av dess påståenden mot skarp implementation och staging-data, täcka
uppdragets femton analysytor mot **dagens** kod (som växt betydligt sedan
katalogens senaste räkningar — se § Avvikelser), och registrera det
katalogen missar.

Jag läste också: `docs/reference/data-model.md` § Kända fällor (den
data-instans-specifika systerkatalogen), `docs/reference/airtable-interaction.md`
(app↔Airtable-kontraktet, EF-register, write-allowlist), fyra ADR:er i sin
helhet (`ADR-050` isolerad staging, `ADR-063` Airtable som förstklassig
leverabel, `ADR-128` betalningsdomänen till Postgres, `ADR-110`
aktivitetsloggen till Postgres), lärdomen **L599** (sentinel-drift vid
avbrutet test), `.purge-staging-policy.json`, `.staging-semaphore-policy.conf`,
`tests/global-setup.ts`/`global-teardown.ts`, hela `tests/kontraktsvakt/`,
och källkoden i `supabase/functions/_shared/` (`airtable-client.ts`,
`airtable-retry.ts`, `coerce.ts`) samt adapterlagret i `src/data/`.

**Åldersbedömning:** väggkatalogen och ADR:erna är substantiellt sant vad
gäller plattformens EGNA gränser (de förändras inte snabbt — Airtables API
har inte ändrat rate limits eller pageSize sedan citaten skrevs, vilket jag
verifierade mot Airtables egen dokumentation i dag). Det som HAR åldrats är
räkningar av VÅR EGEN kod: Edge Function-antalet, vilka Edge Functions som
är mockade, och hur många av dem nattens kontraktsvakt bevakar. Det är
exakt den typ av drift `airtable-interaction.md`s eget färskhets-kontrakt
varnar för — och det har hunnit hända igen sedan senaste rättelsen
(2026-08-08).

## Metod

Jag läste källkod och styrande dokument direkt (ingen gissning). För de
delar som går att pröva säkert gjorde jag **nio läsande MCP-anrop** mot
staging-basen (`list_tables` ×1, `describe_table` ×1, `list_records` ×7) —
långt under den beviljade ramen på ~40 — plus fem `WebFetch`-anrop mot
Airtables egen utvecklardokumentation för att belägga rate limits,
`pageSize`, sorteringskontrakt och token-scoping mot **primärkällan**,
inte mot vår egen tolkning av den. Inga skrivningar, inga schemaändringar,
ingen belastning av det delade hastighetstaket.

## Fynd

### Kompromissregistret

| ID | Analysyta | Airtable begränsar | Vår lösning | Klass | Kan minskas? |
|---|---|---|---|---|---|
| K1 | Auktorisering | Personal-Access-Token (PAT) kan bara begränsas till bas/arbetsyta + typ av API-anrop — **ingen tabell- eller fältnivå** | Egen deny-by-default-grind i appkoden (`field-allowlists.ts`, 13 operationer) ovanpå ett bas-brett skrivbehörigt token | **NÖDVÄNDIG** | Nej, inte utan Postgres+RLS |
| K2 | Auktorisering/felkoder | `403` betyder BÅDE "ingen behörighet" och "finns inte" (P18) | Mappa båda till `null` | **NÖDVÄNDIG** | Nej |
| K3 | Rate limits | 5 anrop/sekund per bas, **delat** av alla samtidiga klienter (P4) | Global mutex + semafor + serialiserad staging-svit | **NÖDVÄNDIG** | Nej (utan Fas E) |
| K3b | Felhantering/retries | — (ingen plattformsvägg; vår egen kod) | Läsvägen har Airtable-konform 429-omförsök; **skrivvägen har det INTE** | **SJÄLVVALD (lucka)** | Ja |
| K4 | Pagination | `pageSize` ≤ 100, opak `offset`-token, inget sidhopp (P5, P6) | Full-walk-loop respektive cursor-wrapper | **NÖDVÄNDIG** | Nej (utan Fas E) |
| K5 | Filtrering | `filterByFormula`: escaping krävs (P19), längdgräns (P20), länk-ID matchar aldrig via `ARRAYJOIN` (P7–P9), `!=BLANK()` ger falska positiva på array-fält (P22) | Escaping-wrapper, chunkning, record-ID-batch i stället för länkfilter | **NÖDVÄNDIG** | Nej |
| K6 | Testisolering | Ingen bas-duplicering via API, ingen radering av bas utan enterprise (P26) | Global mutex, en enda delad staging-bas | **NÖDVÄNDIG** | Nej (utan Fas E) |
| K7 | Emulator/lokal körning | Ej självhostbar, ingen emulator (P27) | Hermetisk utbrytning av 74 % av sviten (`ADR-080`); resten mot skarp staging | **NÖDVÄNDIG** (roten) men se K7b | — |
| K7b | Emulator, Postgres-domänen | — (Postgres ÄR självhostbar) | Betalningsdomänen (redan i Postgres, `ADR-128`) körs ändå i SAMMA delade mutex-skyddade staging-Supabase | **SJÄLVVALD** | Ja, är redan möjligt |
| K8 | Transaktioner/atomicitet | Ingen transaktion, ingen allt-eller-inget-skrivning över flera poster (P2, "tyst korruption") | Kompenserande logik, idempotensnycklar | **NÖDVÄNDIG** (Airtable-domänen) / **REDAN UTLÖST** (betalning, `ADR-128`) | Delvis redan gjort |
| K9 | Idempotens | Ingen unique-constraint på skrivbart fält + inga transaktioner ⇒ server-side idempotens omöjlig (P1, P3) | Klient-dedup, `upsertAirtableRecord` (ADR-066) | **NÖDVÄNDIG** (Airtable-domänen) / **REDAN UTLÖST** (betalning/kvitto) | Delvis redan gjort |
| K10 | Samtidighet/race | Ingen transaktionell mutation+rollback | Sentinel-mönster + `finally`-restore | **NÖDVÄNDIG** (rot) men motmedel **SJÄLVVALT och obyggt** (L599) | Ja, känt men ej byggt |
| K11 | Testisolering, mekanik | (samma rot som K6) | Global mutex + ADR-073-semafor + preflight-sond mot GitHubs körnings-API | **NÖDVÄNDIG** (rot) / implementation **SJÄLVVALD** | Delvis |
| K12 | Fixtures/städning | (samma rot som K6) | `.purge-staging-policy.json`, 14 named targets, ålders-guard, länk-guard, "efter-körning"-läge | **NÖDVÄNDIG** (rot) / utformning **SJÄLVVALD** | Delvis |
| K13 | Staging vs prod | Ingen schema-diff, ingen migrations (P25); ingen garanti att en duplicerad bas behåller ID:n | Manuell duplicering (råkade bevara ID:n), mekaniskt prod-lås i verktygen | **NÖDVÄNDIG** (schema-delen) / prod-låset **SJÄLVVALT** | Delvis |
| K14 | Schemaförändringar | Inget schema-as-code (P25) | Manuell point-in-time-verifiering | **NÖDVÄNDIG** | Nej (utan Fas E) |
| K15 | Observability | Automation-körningar rapporterar "lyckades" trots tyst uteblivet delresultat (P16) | Verifiera sidoeffekt direkt, aldrig run-status | **NÖDVÄNDIG** | Nej |
| K16 | Prestanda | Kallstart måste hämta varje flik sekventiellt under det delade taket (P31) | Blockerande startvärmningsskärm (`ADR-112`) | **NÖDVÄNDIG** | Nej (utan Fas E) |
| K17 | Mocks vs verklighet | Ej testbart hermetiskt utan att bygga egna mockar (följd av K7) | `fixturvarld` (18 mockade EF:er) + nattlig `kontraktsvakt` | **NÖDVÄNDIG** (att ha mockar alls) / **täckningsgrad SJÄLVVALD/eftersläpande** | Ja |

### Fördjupning per delfråga

#### Autentisering och behörigheter (K1, K2)

Jag prövade detta mot Airtables egen dokumentation för Personal Access
Tokens (`airtable.com/developers/web/guides/personal-access-tokens`,
hämtad 2026-09-17): access kan ges per **scope** (vilka API-ytor som är
tillåtna) och per **bas/arbetsyta** — "*The token will only be able to
read and write data within the bases and workspaces that have been
assigned to it*". Ingenting i dokumentationen medger begränsning till en
enskild tabell eller ett enskilt fält. **Detta betyder att den enda
spärren mot att en trasig eller manipulerad Edge Function skriver till
FEL FÄLT i hela basen är vår egen kod** — `field-allowlists.ts`s
`getOperation`/`findDisallowedField`, "deny-by-default" (`airtable-interaction.md`
§7). Airtable ger ingen server-side backstop om den koden har en bugg.

Det här är, mig veterligen, **inte katalogiserat någonstans** i
`airtable-constraints.md` (jag sökte efter "token", "PAT", "fältnivå" —
noll träffar). Det är samma klass av begränsning som P1–P3 (Airtable kan
inte uttrycka en viss garanti strukturellt) men på behörighets-axeln i
stället för data-axeln. **Rekommenderar** att det läggs till som en
formell post av den som äger katalogen.

**403-tvetydigheten** (P18: samma statuskod för "ingen behörighet" och
"finns inte") är redan korrekt katalogiserad och koden hanterar den
konsekvent (`fetchAirtableRecord`, `airtable-client.ts:250-260`).

*Märkning: verifierad (K1, via primärkälla + kod), verifierad (K2, kod
läst direkt).*

#### API-begränsningar och rate limits (K3, K3b)

Airtables egen sida (`airtable.com/developers/web/api/rate-limits`, hämtad
2026-09-17) säger ordagrant: *"The API is limited to 5 requests per second
per base"*, *"If you exceed these rates, you will receive a 429 status
code"*, *"will need to wait 30 seconds before subsequent requests will
succeed"*. Detta är EXAKT vad `airtable-retry.ts` bygger på, med ett
härlett tak på 2 omförsök (motiverat av Supabase Edge Functions 150s
idle-timeout — matematiken står i modulens filhuvud och håller).

**Men jag läste igenom hela `airtable-client.ts` rad för rad och fann en
asymmetri som inte står i katalogen:** `withAirtable429Retry` används i
`fetchFromAirtable`, `fetchAirtablePage` och `fetchAirtableRecord` — de tre
LÄSFUNKTIONERNA. Den används **INTE** i `updateAirtableRecord`,
`createAirtableRecord`, `upsertAirtableRecord`, `deleteAirtableRecord`,
`createAirtableRecords` eller `deleteAirtableRecords` — samtliga
SKRIVFUNKTIONER. En skrivning som träffar det delade hastighetstaket
kastar alltså direkt (`Airtable PATCH 429: …`) i stället för att vänta ut
Airtables dokumenterade 30-sekunderslockout och försöka igen.

Detta är **inte** en plattformsvägg — det är en lucka i vår egen kod.
Retry-modulens filhuvud motiverar varför just LÄS-anropen är säkra att
göra om (de är idempotenta GET:ar); en motsvarande analys för skrivvägen
är inte gjord, men är fullt möjlig — `create-registration` har redan en
idempotensnyckel, `upsertAirtableRecord` är redan konstruerad för säker
omkörning (match-or-create). Jag klassar detta som **SJÄLVVALD (en
lucka)**, inte nödvändig, och den kan täppas till med måttlig insats.

*Märkning: verifierad (rate limit-siffrorna, via primärkälla 2026-09-17
och egen kod); verifierad (skriv/läs-asymmetrin, direkt kodläsning,
`supabase/functions/_shared/airtable-client.ts` hela filen läst).*

#### Datamodell (K4, K5)

Redan grundligt katalogiserat (P7–P13, P30). Jag testade två av de mest
konkreta påståendena live mot staging (se § Empiriska prov nedan) och
båda höll exakt.

#### Transaktioner och atomicitet (K8)

P2 ("TYST KORRUPTION") är korrekt och allvarligt: Airtable kan inte skriva
flera poster allt-eller-inget. `ADR-128` (2026-08-30) är det konkreta
beviset på att detta är en **verklig, löst kompromiss** för den domän där
det gjorde mest ont — betalningar. Jag läste `ADR-128` i sin helhet:
skälet till flytten är uttryckligen P1+P2+P3 tillsammans
(*"En bokföringsserie som kräver atomär numrering och en unik nyckel kan
därför inte maxas fram"*), och jag verifierade i källkoden
(`src/data/adapters/AirtableAdapter.ts`) att metoder som `recordActivity`
och hela betalningsdomänen (`betalningsportar`-modulen) i dag faktiskt
anropar Postgres-backade Edge Functions, inte Airtable. **Namnet
`AirtableAdapter` är alltså delvis missvisande i dag** — klassen fronterar
BÅDA datakällorna beroende på vilken metod som anropas, medan den separata
`SupabaseAdapter`-klassen (som skulle ta över helt i en framtida Fas E)
fortfarande kastar `NOT_IMPLEMENTED` och inte är i drift.

*Märkning: verifierad (ADR läst i sin helhet + kod läst direkt).*

#### Samtidighet och race conditions (K9, K10)

P1+P2+P3 gör server-side idempotens strukturellt omöjlig i Airtable — även
detta redan löst för betalningsdomänen (`ADR-128` § Beslut 4: en riktig
databassekvens + en unik nyckel ersätter `ADR-109`s
läs-verifiera-retry-protokoll).

**Det konkreta, mätta race-problemet som KVARSTÅR** är lärdomen **L599**
(`tasks/lessons/vol-08.md`): ett staging-test som muterar en delad
fixtur-rad och återställer den i ett `finally`-block är bara atomärt om
körningen slutförs. Avbryts processen (mutex-timeout, avbrutet CI-jobb)
MELLAN mutationen och återställningen står sentinel-värdet kvar — och
**fäller sedan ett HELT ANNAT test**, deterministiskt, i varje efterföljande
körning tills någon städar för hand. Detta har hänt **tre gånger**: 2026-08-17
(S104), en gång till (S112 resume 1) och 2026-09-07 (S123 resume 1) — tredje
gången fällde det tre landningar i rad. Lärdomens egen text säger uttryckligen:
*"Motmedel (a) är fortfarande inte byggt"* (sentinel-städning i setup-purgen).

Det här är en NÖDVÄNDIG konsekvens av att Airtable inte kan
transaktions-skydda en mutation (roten är plattformsvägen), men **motmedlet
är känt, billigt (lärdomens egen bedömning: "billigast") och medvetet
obyggt** — det gör den kvarstående kostnaden SJÄLVVALD i praktiken, inte
tvingad.

*Märkning: verifierad (L599 läst i sin helhet, tre instanser med datum och
körnings-ID:n dokumenterade i lärdomen själv).*

#### Testisolering, staging kontra produktion (K6, K7, K7b, K11, K13)

Roten är P26 (ingen bas-duplicering via API, ingen radering utan
enterprise-avtal) och P27 (ej självhostbar). Jag läste `ADR-050` i sin
helhet: staging är en **manuellt** duplicerad Airtable-bas som av ren tur
råkade behålla samma tabell- och fält-ID:n som prod (Session 36-korrigeringen
i ADR:n själv säger detta rakt ut — det var INTE en garanti, det var en
uppmätt bieffekt av duplicerings-metoden).

**Den nyans jag lade till genom att läsa koden, inte bara dokumentationen:**
`playwright.config.ts` visar att Playwright-projektet `api-staging` matchar
**alla** filer med mönstret `**/*.staging.test.ts` — och det mönstret
omfattar i dag BÅDE de klassiska Airtable-testerna OCH de nya
betalningsdomän-testerna mot Postgres
(`tests/api/hamta-inbetalningar-batch.staging.test.ts`,
`tests/api/hamta-oppna-betalningar-kvitto-avbojt.staging.test.ts`). Alla
körs under SAMMA globala mutex (`concurrency: group: staging-tests`).

Det betyder: även om `ADR-063`s S91-not räknar med att "samtliga tre
tvång upphävs av Supabase" när en domän flyttar dit — *"Postgres är
självhostbar (docker i CI), klonbar och seedbar per körning"* — har den
möjligheten **ännu inte utnyttjats** för den domän som faktiskt redan
flyttat. Betalningstesterna körs mot samma delade, långlivade
Supabase-projekt som allt annat, serialiserade av samma mutex som
Airtable-testerna. Det är en giltig, medveten avvägning (enklare att
underhålla EN staging-miljö), men det är ett **eget val**, inte något
Postgres-flytten i sig tvingade fram — och det nyanserar `ADR-063`s
"Fas E-kopplingen"-resonemang: kapaciteten finns, den är bara inte byggd.

Prod-basen är dessutom mekaniskt låst för subagenter
(`scripts/deny-prod-airtable.sh`, `TASK-419`) — det är **vårt eget
skyddslager**, eftersom Airtable inte kan ge ett token en
"skrivskyddad mot just den här basen"-egenskap utöver att peka det mot en
annan bas helt och hållet (samma vägg som K1).

*Märkning: verifierad (ADR läst i sin helhet, `playwright.config.ts` läst
direkt, filnamn på disk verifierade).*

#### Fixtures och återställning av testdata (K12)

`.purge-staging-policy.json` (läst i sin helhet) har i dag **14 targets** i
Airtable-basen plus en separat `postgresTargets`-sektion för
betalningsdomänen (en Postgres-funktion `purga_testrader`, eftersom
skriptet saknar en service-role-nyckel och därför inte kan radera direkt).
Varje target har ett exakt regex-mönster, en ålders-guard
(`minAgeMinutes: 60`), och en valfri "länk-guard" som hellre rapporterar
än raderar en rad med oväntade kopplingar. Kommentarerna i policyfilen
dokumenterar **minst tre separata, mätta fällor** av typen "en rad blir
opurgbar för alltid" (t.ex. `update-event-uppdaterad-sentineler`,
uppmätt: två rader 26,9 och 32,3 dygn gamla innan motmedlet byggdes).

Detta maskineri existerar EXKLUSIVT för att kompensera K6/K7 (en enda
delad, permanent bas som aldrig kan nollställas). Men **hur** det löses
— en handskriven JSON-policy med 14 poster som växer för varje ny
skriv-EF — är ett eget designval. Det är rimligt hantverk, men det är
inte den enda tänkbara lösningen (t.ex. en TTL inbyggd i själva
skrivvägen skulle kunna minska antalet handskrivna targets) — jag har
inte underbyggt det alternativet tillräckligt för att rekommendera det,
bara noterat att policyns tillväxttakt är en synlig underhållskostnad.

*Märkning: verifierad (policyfilen läst i sin helhet).*

#### Schemaförändringar (K14)

P25 håller: inget schema-as-code, ingen diff, ingen automatiserad
schema-deploy för Airtable. Jag verifierade INTE live om staging och prod
fortfarande har identiskt schema (det hade krävt breda skrivbehöriga
jämförelser jag inte fick mandat för) — det är redan bokfört som en öppen
disciplin-lucka i katalogen själv (O2-underraden till P25) och jag har
inget nytt att tillföra där.

#### Pagination och filtrering (K4, K5) — empiriskt prövat

Se § Empiriska prov: `pageSize`-taket på 100, `filterByFormula`s
blank-check-fälla och Airtables egen sorteringsdokumentation är alla
prövade nedan, inte bara citerade.

#### Felhantering och retries (K3b, K15)

Utöver K3b (skriv-429-luckan): `classifyAirtableWriteError`
(`airtable-client.ts:30-44`, TASK-190) är en egen, medveten härdning —
Airtable dokumenterar INTE exakt vilken `error.type`-sträng som kommer
tillbaka för fält-nivå-avvisningar (koden citerar detta explicit: *"exakt
`type`-strängen ... är INTE dokumenterad"*), så koden vidarebefordrar
Airtables `message` ordagrant i stället för att gissa. Det är god
disciplin (ADR-083: hellre en ärlig 500 än ett gissat 4xx), men det är
också ett tecken på att Airtables felkontrakt för skrivavvisningar är
**ofullständigt dokumenterat** — jag försökte verifiera detta mot
Airtables egen error-dokumentation men gick inte djupare (se § Osäkerheter).

P16 (automationer rapporterar "Ran successfully" trots uteblivet
delresultat) är korrekt katalogiserad och allvarlig — den delar
"tyst korruption"-klassen med P2.

#### Prestanda (K16)

P31 (kallstartslatens, ~6-7s) är korrekt och färskt (mätt 2026-08-15). Jag
har inget nytt att tillföra utöver att bekräfta att den blockerande
startvärmningsskärmen (`ADR-112`) fortfarande är den v1-kompensation som
gäller.

#### Observability (K15, delvis)

Airtable ger ingen central logg över våra egna API-anrop mot den — all
observability (`generateRequestId`, `mapErrorToResponse` i
`_shared/errors.ts`) är egenbyggd på EF-sidan. Jag hittade ingen
produktionsmätning av 429-frekvens eller Airtable-anropslatens i det jag
läste (kan finnas i Supabase-loggarna utan att synas i repot) — detta är
**ej verifierbart** av mig utan åtkomst till Supabase-loggpanelen (se
§ Osäkerheter).

#### Lokala emulatorer eller avsaknad (K7, K7b, K18)

Se ovan (K7b) — den mest substantiella nyansen jag hittade i hela passet.
Airtable har ingen emulator och kan inte köras lokalt (P27, verifierat
tidigare pass, jag har inte omprövat detta). Postgres HAR den förmågan
(`supabase start` kör hela stacken i Docker) och den förmågan används
redan i repot för migrations-utveckling — men INTE för att ge
betalningsdomänens tester en engångs-instans per körning. Jag sökte
`ci.yml`/`ci-suite.yml` efter `supabase start`/`db reset`-mönster och
fick noll träffar.

*Märkning: verifierad (grep mot båda workflow-filerna, noll träffar;
filnamnen på `.staging.test.ts`-nivå verifierade separat).*

#### Hur väl motsvarar mocks och simuleringar verkligheten? (K17)

Detta är den mest konkreta, mätbara luckan jag hittade. Mekaniken finns
och är genomtänkt:

+ `tests/support/fixturvarld/handlers.ts` mockar Edge Functions hermetiskt
  (inget nätverksanrop alls) för de tester som inte behöver en verklig
  backend.
+ `tests/kontraktsvakt/` kör NATTLIGEN (aldrig i en PR, aldrig
  blockerande — filens eget huvud är explicit om detta) och jämför formen
  på en mockad fixtur mot ett skarpt anrop mot samma Edge Function, via
  SAMMA zod-schema på båda sidor. Divergerar de, fälls nattjobbet med ett
  namngivet larm. Detta är, mig veterligen, **exakt svaret** på uppdragets
  fråga "hur vet vi att mockarna fortfarande liknar verkligheten" — och
  det är ett genuint bra mönster (samma disciplin som ett API-kontraktstest
  hos t.ex. Pact eller ett snapshot-diff mot en riktig sandbox).

**Men täckningen har inte hängt med.** Jag räknade distinkta Edge
Function-mockar i `handlers.ts` i dag: **18 stycken** (inklusive
`get-activity-log`, `log-activity` och `hamta-oppna-betalningar` — alltså
även Postgres-domänen mockas nu). Jag räknade sedan entries i
`KONTRAKTSFALL` (den lista `kontraktsvakt` faktiskt bevakar): **7
stycken**, exakt samma sju som filens egen kommentar hänvisar till från
`TASK-68` (*"ALLA SJU FIXTURHANDLERS BEVAKAS"*). Den kommentaren var sann
när den skrevs — då var sju hela universum. I dag bevakar kontraktsvakten
**7 av 18 (39 %)** av de mockade Edge Functions'en, och filens egen text
har inte uppdaterats för att säga det.

Filens huvud är för övrigt själv medvetet om att detta INTE är en grind:
*"DEN PARITETEN ÄR I DAG EN KONVENTION, INTE EN GRIND ... Inget test
binder listan nedan till handler-listan, så en åttonde handler kan
tillkomma utan att något fäller."* Det gör detta till en känd, öppet
bokförd designgräns snarare än ett dolt hål — men själva TALET (7/18) är
mitt fynd, inte något jag hittade redan uttalat.

*Märkning: verifierad (räknat direkt mot `handlers.ts` och
`kontraktsfall.ts` på disk, 2026-09-17).*

### Avvikelser mellan `airtable-constraints.md`/`airtable-interaction.md` och implementationen

1. **P24 (PAT-servern är blind för vyer) — delvis FALSIFIERAD.** Katalogen
   säger att `mcp__airtable__*` (PAT-servern) inte kan se vyer, formulär,
   automationer osv — bara `claude.ai`-connectorn kan det. Jag anropade
   `mcp__airtable__describe_table` med `detailLevel: "full"` mot
   `Personer`-tabellen i staging och fick tillbaka en fullständig
   `views`-array (11 vyer, med `id`/`name`/`type` för var och en — t.ex.
   `"Alla personer"`, `"Har en aktiv anmälan"`). **PAT-servern kan alltså
   visa GRUNDLÄGGANDE vy-existens (namn/id/typ) via `describe_table`** —
   den kan bara inte visa vyns FILTER/SORTERING eller läsa dess
   `list_records_for_page`-motsvarighet. Katalogens formulering ("vyer …
   är osynliga") är för bred; en mer exakt formulering vore "PAT-servern
   ser att en vy finns men inte vad den gör". *(Märkning: verifierad,
   live-anrop 2026-09-17.)*
2. **`airtable-interaction.md` §5.0 — "28 funktioner" är stale.** Talet
   var disk-verifierat 2026-08-08. Jag räknade katalogerna under
   `supabase/functions/` i dag (2026-09-17, exklusive `_shared`): **61**.
   Hela betalningsdomänen (`registrera-inbetalning`, `hantera-inbetalning`,
   `koa-kvitton`, `hamta-kvittolank`, `jobb-konsument`, m.fl.) och flera
   bilage-/aktivitetslogg-funktioner tillkom efter den senaste räkningen.
   Doket har ett eget, medvetet färskhets-kontrakt som förutsäger exakt
   den här sortens drift — men numret självt har inte fångats om ännu.
3. **`kontraktsvakt`s "alla sju" — stale**, se § Mocks ovan (7/18 i dag).
4. **Inget P-nummer täcker skrivvägens saknade 429-omförsök** (K3b) eller
   **PAT:ens avsaknad av fält-/tabellnivå-behörighet** (K1) — två genuina
   luckor i en i övrigt mycket grundlig katalog.
5. **`ADR-063`s "Fas E-kopplingen"** (*"samtliga tre tvång upphävs av
   Supabase"*) är sant för PLATTFORMENS väggar men nyanseras av K7b: när en
   domän faktiskt flyttar (betalningar) har den ÄNNU inte fått den
   ephemera per-körnings-isolering ADR-notens resonemang förutspår —
   möjligheten finns, den är bara inte byggd för den domänen. Detta river
   inget beslut; det är en observation om VAD SOM ÅTERSTÅR att göra även
   efter en migrering.

### Empiriska prov jag genomförde

Samtliga mot staging (`apphjj8Q7lkXCMsL4`), enbart läsande, 2026-09-17.

| # | Prov | Resultat | Vad det belägger |
|---|---|---|---|
| 1 | `describe_table` (full) på `Personer` | Returnerade en `views`-array med 11 vyer | Motsäger P24:s "vyer är osynliga för PAT-servern" i sin nuvarande bredd |
| 2 | `list_records`, 3 poster, blandade rollup/formel-fält | Tom rollup (`Ort`) kom tillbaka som `[]`; tom formel (`Motivering (text)`) UTELÄMNADES helt ur svaret; en fylld rollup (`TP sammanfattning`) kom som ren sträng, inte array | Bekräftar P10/P11 exakt, OCH visar att "tom" hanteras OLIKA beroende på fälttyp — rollup ger `[]`, formel ger utelämning. Vår `scalarString`/`scalarNumber` (`coerce.ts`) hanterar redan båda korrekt. |
| 3 | `list_records`, sortering på `Namn` asc, samma anrop upprepat två gånger | Identisk radordning bland fyra poster med exakt samma namn ("Astrid Almqvist") båda gångerna | Svag men positiv indikation på att Airtables tie-break är deterministisk vid oförändrad data — **Airtables egen dokumentation garanterar dock INTE detta** (se prov 5) |
| 4 | `filterByFormula: {Ort} != BLANK()` | Gav träffar där `Ort` faktiskt var `[]` (tom) | Bekräftar P22 exakt: `!=BLANK()` ger falska positiva på array-fält |
| 5 | `filterByFormula: SEARCH("Åsa", {Namn}) > 0` | Matchade korrekt en post med "Å" | Svenska tecken hanteras korrekt av Airtables formelmotor via detta verktyg |
| 6 | `list_records` med `maxRecords: 250` mot en tabell större än 100 rader | 214 poster returnerades i ETT logiskt anrop (verktyget paginerar internt) | Bekräftar att `pageSize`-taket på 100 (P5) är verkligt på API-nivå, men transparent för en klient som redan implementerar walk-loopen (vilket vår kod gör) |
| 7 | `filterByFormula: IS_AFTER({Startdatum}, "2026-01-01")` | Korrekt filtrerade Eventplanering-poster | ISO-datumjämförelser fungerar som väntat |
| 8 | WebFetch mot `airtable.com/developers/web/api/rate-limits` | *"5 requests per second per base"*, *"429"*, *"wait 30 seconds"* | Ordagrant bekräftar vad `airtable-retry.ts` redan antar |
| 9 | WebFetch mot `airtable.com/developers/web/api/list-records` | *"Must be less than or equal to 100"* (pageSize); ingen garanti om stabil sortering vid lika värden | Bekräftar P5; **nyanserar** prov 3 — determinismen är observerad, inte garanterad |
| 10 | WebFetch mot `airtable.com/developers/web/guides/personal-access-tokens` | Access ges per scope + bas/arbetsyta; ingen tabell-/fältnivå nämns | Underbygger K1 |

### Provspecifikationer för skrivprov (EJ utförda — beslutsunderlag åt Marcus)

Följande kräver skrivning och gjordes INTE i detta pass. Var och en är
avgränsad till staging, sentinel-prefixad, och tänkt att köras och städas
i samma andetag.

**A. Atomicitet vid batchskapande (10-postersgränsen, `createAirtableRecords`).**

+ Tabell: en kastbar tabell eller `Personer` med sentinel-prefix
  `ZZ-J5-batch-<uuid>-N` (N=1..11) på `Förnamn`.
+ Skriv: ETT rått POST-anrop (utanför vår egen chunkning) med 11 poster i
  `records`-arrayen mot Airtables riktiga gräns.
+ Mät: exakt statuskod och felkropp; om <10 lyckas, vilka och i vilken
  ordning; om hela anropet avvisas atomärt.
+ Städ: `deleteAirtableRecords` på samtliga sentinel-ID:n omedelbart efter
  mätning, oavsett utfall.
+ Risk: **låg** — påverkar bara nyskapade, egna sentinel-rader; ingen
  koppling till skarp data.

**B. Race mellan två samtidiga skrivare på samma post.**

+ Skapa EN sentinel-post (`ZZ-J5-race-<uuid>`).
+ Skriv: två nästan-samtidiga `PATCH`-anrop mot SAMMA fält med olika
  värden (t.ex. `"A"` och `"B"`), skickade parallellt.
+ Mät: vilket värde vinner, om något fel returneras, om Airtable
  serialiserar internt (svarstider för de två anropen).
+ Städ: radera posten direkt efter mätning.
+ Risk: **låg**, men kräver två samtidiga processer/skript — bör köras av
  Marcus eller ett skript utanför agent-sandlådan.

**C. Vad händer med länkade poster vid radering.**

+ Skapa två länkade sentinel-poster (t.ex. ett `Eventplanering`-event
  `ZZ-J5-link-event-<uuid>` och en `Anmälningar`-rad som länkar till det).
+ Radera event-posten.
+ Mät: blir Anmälningar-radens länkfält tomt, eller kastar Airtable ett
  fel, eller blir länken en "spöklänk"? (P13/spegelfälts-beteende antyder
  att länken bara tystnar, men detta är inte prövat vid RADERING, bara vid
  skrivning från "fel sida".)
+ Städ: radera kvarvarande sentinel-poster.
+ Risk: **medel** — berör Airtables egen kaskad-logik för länkade fält;
  gör det på en tabell/rad som garanterat inte har andra beroenden.

**D. 10-poster-gränsen för radering (`deleteAirtableRecords`).**

+ Skapa 11 sentinel-poster, försök radera alla 11 i ETT rått
  DELETE-anrop (utanför vår chunkning).
+ Mät: exakt felkod/kropp.
+ Städ: radera återstoden i en andra, korrekt chunkad omgång.
+ Risk: **låg**.

### Hur stor del av CI-arkitekturens komplexitet är en FÖLJD av Airtable-valet?

Ärligt svar, i två delar:

**Del 1 — det som redan är MÄTT (`ADR-063` § S91-not):** av
staging-sviten på totalt 555 sekunder (9,25 min) är **410 sekunder (74 %)**
redan hermetiskt utbrutna (`ADR-080`) — den delen kostar inte längre
Airtable något extra utöver att mockarna behöver underhållas (se K17).
Kvar står **145 sekunder (26 %, ~2,4 min)** som GENUINT kräver en levande
backend under mutexen. Den siffran, 26 %, är den mest exakta kvantifiering
som finns av "hur mycket av staging-kostnaden Airtable orsakar direkt",
och den är redan i katalogen — jag har bara läst och bekräftat den, inte
räknat om den.

**Del 2 — det jag lägger till, kvalitativt:** merparten av det
HANTVERKSTUNGA maskineriet i test-arkitekturen — den globala mutexen,
`ADR-073`-semaforen med sin GitHub-run-preflight-sond, hela
sentinel/purge-policyn (14+ targets och växande), `TASK-76`s
idempotenta-radera-race-hantering, och nattens kontraktsvakt — existerar
**uteslutande** för att kompensera K6/K7 (ingen bas-duplicering, ingen
självhostning). Det är en betydande, verifierbar andel av vad som finns
i `scripts/` och `tests/` riktat mot just staging-hantering. **Men** denna
kostnad är medvetet **inlåst i post-merge och natt** — `ci.yml` skickar
`run_staging: false` ovillkorligt för varje PR (`TASK-70.3`), vilket jag
verifierade genom att grep:a samtliga fyra workflow-filer. En vanlig PR
väntar aldrig på mutexen. Kostnaden är alltså real och påtaglig för
**underhåll och robusthet** (L599-klassen, den växande purge-policyn), men
den är **inte** en flaskhals i den loop en utvecklare eller agent möter
varje dag.

Slutsats: **Airtable-valet förklarar en stor majoritet av
test-INFRASTRUKTURENS särart** (mutex, sentinel, kontraktsvakt, hermetisk
utbrytning) men en **liten och avgränsad del av CI:ns TOTALA yta** — resten
(typkontroll, lint, a11y, bygge, visuell regression, review-grinden) är
obesläktat med datakällan och skulle se likadant ut oavsett vilken
databas som låg bakom.

## Osäkerheter och vad jag inte kunde belägga

+ **Produktionsmätning av Airtable-anropslatens/429-frekvens.** Jag hittade
  ingen sådan i repot. Den kan finnas i Supabase-loggpanelen, som jag inte
  har åtkomst till i detta pass. **Krävs för att stänga luckan:** åtkomst
  till Supabase Edge Function-loggarna för prod, eller en dashboard-export.
+ **Airtables exakta felformat (`error.type`-strängar) för olika typer av
  skrivavvisningar.** Koden citerar själv att detta inte är fullt
  dokumenterat av Airtable. Jag gjorde inte en uttömmande genomgång av
  `developers.airtable.com/api/errors` mot varje felkod vi hanterar.
+ **Provspecifikationerna A–D är obekräftade** — de är förslag, inte
  mätningar. Jag vet därför INTE om `createAirtableRecords`-batchen
  verkligen är icke-atomär för fält utan bilagor (WebFetch-svaren om
  `partialSuccess` gällde specifikt bilage-uppladdningsfel, inte vanliga
  fält — det kan mycket väl vara så att en batch UTAN bilagor ÄR atomär).
  Detta ska INTE tolkas som att batchen är beprövat icke-atomär för vårt
  bruk (vi skickar aldrig bilagor via `createAirtableRecords`).
+ **Om `Kvitton`-tabellen i Airtable (som jag såg finns kvar i staging via
  `list_tables`) fortfarande skrivs till** efter `ADR-128`s flytt till
  Postgres, eller om den bara ligger kvar orörd. Jag läste inte dess
  innehåll eller sökte efter skrivningar mot den i koden — utanför
  scope för detta pass, men värt att notera som en öppen fråga.
+ **Om sorteringsstabiliteten** (prov 3) håller vid SAMTIDIG skrivning
  mot tabellen (t.ex. under en pågående staging-testkörning). Mina två
  anrop skedde mot en i övrigt stilla bas. Airtables dokumentation ger
  ingen garanti, så detta är **osäkert**, inte bara opröv.
+ **Hela "17 EF fixturvärlden inte mockar"-påståendet** i
  `kontraktsfall.ts`s egen kommentar räknade jag inte om mot dagens 61
  Edge Functions — kommentaren själv verkar också vara skriven vid ett
  tidigare EF-antal. Jag rapporterar bara vad jag SJÄLV räknade (18 mockade,
  7 bevakade av kontraktsvakten), inte kommentarens egen delsumma.

## Risker

+ **K3b (skriv-429-luckan)** kan vara en outredd bidragsorsak till
  sporadisk staging-testflakighet under samtidig skriv/läs-belastning —
  jag har INTE bevisat detta, bara identifierat mekanismen som skulle
  kunna orsaka det.
+ **K10/L599-klassen** kommer att hända igen tills motmedlet byggs — det
  är redan hänt tre gånger med stigande kostnad (från "ett test föll" till
  "tre landningar i rad föll").
+ **K17 (kontraktsvakt-täckning)** betyder att 11 av 18 mockade
  Edge Functions kan glida från verkligheten UTAN att något nattligt jobb
  märker det — precis den risk `TASK-52`s historiska defekt (i `get-person`,
  ETT anrop, längst ner i "svansen") redan visat kan bita, fast då i en
  mindre mock-yta än dagens.
+ **K1 (ingen fältnivå-behörighet)** betyder att hela skrivsäkerheten
  vilar på EN kodfil (`field-allowlists.ts`) utan plattforms-backstop —
  en bugg i den filen kan i teorin skriva till vilket fält som helst i
  hela basen.

## Rekommendationer

*Markerade som rekommendationer — inga beslut fattas här.*

1. **Täpp till K3b.** Ge skrivfunktionerna samma `withAirtable429Retry`
   som läsfunktionerna, efter en idempotens-genomgång per funktion (flera,
   som `create-registration` och `upsertAirtableRecord`, är redan säkra
   att göra om).
2. **Uppdatera `airtable-constraints.md`** med K1 (PAT saknar fält-/tabellnivå)
   som en ny post, och rätta P24:s formulering om vyer till att spegla att
   PAT-servern KAN se vy-existens (namn/id/typ) via `describe_table`, bara
   inte vy-konfiguration.
3. **Räkna om EF-antalet i `airtable-interaction.md`** (28 → 61) vid
   nästa naturliga touch-punkt, i linje med dokumentets eget
   färskhets-kontrakt.
4. **Antingen utöka `KONTRAKTSFALL` till fler av de 18 mockade
   Edge Functions, eller uppdatera kommentaren** så den inte längre
   påstår att "alla sju" är hela ytan — det senare är billigt och bör
   göras oavsett vad som beslutas om det förra.
5. **Bygg L599:s motmedel (a)** — sentinel-städning i staging-CI:ns
   setup-purge — innan det biter en fjärde gång.
6. **Överväg (öppen fråga, ej underbyggd av mig) om betalningsdomänens
   staging-tester ska separeras från Airtable-testernas mutex**, eftersom
   Postgres-domänen strukturellt INTE bär P26/P27-väggarna — men det är en
   avvägning mellan enkelhet (en miljö) och isolering (två) som förtjänar
   sin egen grillning, inte ett beslut som följer automatiskt av detta
   fynd.
7. **Kör provspecifikation A eller D** (de lägst-risk) vid tillfälle, för
   att stänga den enda genuint oprövade luckan i katalogen: om vår
   10-postersgräns i `createAirtableRecords`/`deleteAirtableRecords` är en
   defensiv marginal eller matchar en verklig, hård Airtable-gräns exakt.

## Källor

**Interna (repot):**

+ `docs/reference/airtable-constraints.md` (31 poster, senast 2026-08-26)
+ `docs/reference/data-model.md` § Kända fällor
+ `docs/reference/airtable-interaction.md`
+ `docs/decisions/ADR-050-isolerad-staging-miljo.md`
+ `docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md`
+ `docs/decisions/ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md`
+ `docs/decisions/ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md`
+ `tasks/lessons/vol-08.md` (L599)
+ `.purge-staging-policy.json`, `.staging-semaphore-policy.conf`
+ `tests/kontraktsvakt/kontraktsfall.ts`, `tests/kontraktsvakt/kontraktsvakt.staging.test.ts`
+ `tests/support/fixturvarld/handlers.ts`
+ `supabase/functions/_shared/airtable-client.ts`, `airtable-retry.ts`, `coerce.ts`
+ `src/data/dataSource.ts`, `src/data/adapters/AirtableAdapter.ts`, `src/data/adapters/SupabaseAdapter.ts`
+ `playwright.config.ts`, `.github/workflows/ci.yml`, `.github/workflows/post-merge.yml`, `.github/workflows/ci-suite.yml`

**Externa (Airtables egen dokumentation, samtliga hämtade 2026-09-17):**

+ <https://airtable.com/developers/web/api/rate-limits>
+ <https://airtable.com/developers/web/api/list-records>
+ <https://airtable.com/developers/web/api/create-records>
+ <https://airtable.com/developers/web/api/introduction>
+ <https://airtable.com/developers/web/api/update-multiple-records>
+ <https://airtable.com/developers/web/guides/personal-access-tokens>

**Empiriska data:** nio läsande `mcp__airtable__*`-anrop mot staging-basen
`apphjj8Q7lkXCMsL4`, 2026-09-17 (redovisade i sin helhet i § Empiriska prov).
