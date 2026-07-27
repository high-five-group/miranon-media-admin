---
owner: marcus803
updated: 2026-07-26
review_by: 2027-01-26
status: stable
---

# Parallell e2e mot en delad, muterbar backend — går det att sharda utan isolering? (Code, 2026-07-26)

> **Proveniens:** avgränsat research-pass (S91), 2026-07-26. Ingen kod rörd —
> passet är läsning plus denna fil. Repo-påståenden är lästa ur arbetsträdet på
> `main` (`playwright.config.ts`, `.github/workflows/ci-suite.yml`,
> `.purge-staging-policy.json`, `tests/`, `supabase/functions/_shared/airtable-client.ts`,
> ADR-050 och ADR-073). Externa påståenden är verifierade mot angiven käll-URL
> samma dag; förstapartskälla är använd där den finns. Precedent-rymden för
> exakt vårt fall är tunn och det deklareras öppet i § Branschpraxis.

---

## Kort svar

**Villkorat ja — isolering är ett tvingande förkrav för oss, men av två skäl som
måste hållas isär, och bara det första är det vanliga.**

Playwright självt ställer inget isoleringskrav: `--shard` delar bara upp
testlistan och verktyget har ingen uppfattning om extern state. Men vår svit har
redan **bevisade, deterministiska kollisioner** när två testmängder rör samma
staging-poster samtidigt (TASK-6-noten i `playwright.config.ts`: sex namngivna
fall). Att sharda utan att först isolera dataområdet skulle multiplicera exakt
den klassen. Så på korrekthets-axeln: **isolering först, alltid.**

Den andra grinden är den som brukar glömmas: **Airtables tak är fem anrop per
sekund per bas**, och det taket är gemensamt för alla shards som pekar på samma
bas. Shardning multiplicerar inte genomströmningen mot Airtable — den
multiplicerar bara antalet klienter som slåss om samma budget, och vår
Airtable-klient sover en sekund vid 429. För den del av sviten som är
Airtable-bunden är shardning alltså verkningslös **även med perfekt isolering**.
Bara latens-bundet arbete (sidladdningar, rendering, auth-rundturer) skalar.

Praktisk konsekvens: **sharda inte staging-sviten nu.** Mät först var de
9,1 minuterna går. Den isoleringsform som är rätt för oss är inte
per-körning-kloning av basen — den vägen är **stängd**, se § Airtable — utan
**att krympa den delade ytan**: flytta läs-tester till den hermetiska,
mockade formen som repot redan bevisat i visual-projektet, och behåll mutexen
över det som genuint måste röra staging.

---

## 1. Playwright `--shard` — den officiella modellen

`--shard=x/y` delar testlistan i `y` delar och kör del `x`. Varje shard är en
**egen `playwright test`-process**, normalt på en egen maskin, och rapporterna
slås ihop i efterhand via `blob`-reportern plus Playwrights `merge-reports`-kommando
([Playwright — Sharding](https://playwright.dev/docs/test-sharding)).

**Granulariteten hänger på `fullyParallel`:**

| Läge | Vad shardas | Följd |
|---|---|---|
| `fullyParallel: true` | enskilda tester | "ensuring each shard receives an even distribution of tests" |
| default (vår config) | hela testfiler | filstorleken styr balansen |

Playwright rekommenderar `fullyParallel: true` "when aiming for balanced
distribution across shards"
([test-sharding-js.md](https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/test-sharding-js.md)).

**Vad shards delar:** ingenting i processen — separata OS-processer, separata
webbläsarkontext, separata worker-pooler.
**Vad de delar ändå:** allt utanför processen. Databasen, SaaS-basen,
inloggnings-kontot, rate-limit-budgeten.

**Vad dokumentationen säger om delad muterbar state mellan shards:
ingenting.** Detta är verifierat genom att läsa båda källdokumenten
([test-sharding-js.md](https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/test-sharding-js.md),
[test-parallel-js.md](https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/test-parallel-js.md))
— shardnings-sidan behandlar distribution och rapport-sammanslagning, inte
state. Frånvaron är i sig ett fynd: den officiella modellen **antar** att
backend är shard-säker och säger inte hur man kommer dit.

**Den vägledning som faktiskt finns** ligger på parallellitets-sidan, och den
handlar om workers inom en körning, inte om shards:

> "You can leverage `process.env.TEST_WORKER_INDEX` or `testInfo.workerIndex` to
> isolate user data in the database between tests running on different workers."

Mönstret är en worker-scopad fixtur som skapar `user-${test.info().workerIndex}`
en gång per worker och river den efteråt
([test-parallel](https://playwright.dev/docs/test-parallel)). Det är
förstapartsmönstret för kontopool mot delad databas — men det är skrivet för
**en** körning, och skalar inte automatiskt över shards (nästa avsnitt).

---

## 2. Går det att sharda på dataområde?

**Tekniskt ja. Men Playwright ger dig inte nyckeln färdig — du måste komponera
den, och det finns inget skrivet förstapartsmönster för det.**

### Vad som faktiskt finns, exakt

| Yta | Garanti (förstapartskälla) |
|---|---|
| `testInfo.parallelIndex` / `TEST_PARALLEL_INDEX` | "The index of the worker between `0` and `workers - 1`. It is guaranteed that workers running at the same time have a different `parallelIndex`." Behålls när en worker startar om. |
| `testInfo.workerIndex` / `TEST_WORKER_INDEX` | Unikt per worker-**process**; en omstartad worker får ett **nytt** index. |
| `testInfo.config.shard` (`FullConfig.shard`) | `null` eller `{ total, current }`, där `current` är **ettbaserat**. |

Källor: [class-testinfo](https://playwright.dev/docs/api/class-testinfo),
[class-fullconfig](https://playwright.dev/docs/api/class-fullconfig),
[class-testconfig](https://playwright.dev/docs/api/class-testconfig).

### Den avgörande detaljen: `parallelIndex` kolliderar över shards

Garantin ovan gäller "workers running at the same time" — underförstått: inom
**samma** runner-process. Källkoden bekräftar det direkt: dispatchern skapar
`workers` stycken slottar i en lokal lista och tilldelar `parallelIndex` ur
slot-indexet, utan någon referens till shard-konfigurationen
([dispatcher.ts](https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright/src/runner/dispatcher.ts)).

Kör du fyra shards med fyra workers vardera får du alltså **fyra workers med
`parallelIndex === 0`** som lever samtidigt. Ett dataområde nycklat enbart på
`parallelIndex` är därför osäkert precis i det scenario shardning skapar.

### Den globalt unika nyckeln måste komponeras

Eftersom `config.shard` är läsbar i runtime går det att bygga en unik slott:

```text
slot = (config.shard.current - 1) * config.workers + testInfo.parallelIndex
```

Detta är **vår** komposition, inte Playwrights. Två villkor måste hålla:
`workers` måste vara identiskt över alla shards, och `config.shard` måste vara
satt (den är `null` vid oshardad körning, så uttrycket behöver en gren för
`shard === null`).

**Skrivet mönster eller ad hoc?** Ad hoc. Förstapartsdokumentationen beskriver
kontopool per worker och stannar där. Shard-medveten namnrymd förekommer i
tredjeparts-material men inte i Playwrights egen dokumentation — behandla det
som ett mönster vi i så fall får äga och testa själva, inte som något
branschstött vi kan luta oss mot.

---

## 3. Branschpraxis för delad muterbar testmiljö

**Ärlig räkning först:** jag hittar **två starkt jämförbara** precedent, **ett
lärorikt motexempel**, och **ett förstaparts-ramverksmönster**. Jag hittar
**noll** projekt som shardar Playwright mot en SaaS-bas som inte går att klona.
Precedent-rymden för exakt vårt fall är genuint tunn, och det beror på att
nästan alla som löser det här problemet löser det genom att **göra backend
billig att duplicera** — vilket är just det Airtable förvägrar oss.

GitLab övervägdes som tredje precedent (nattliga pipelines mot delad staging med
resurs-fabricering). Jag lyckades **inte** få fram förstapartscitat som knyter
"delad live-miljö" till uttryckliga parallell-säkerhetsregler ur deras
testguide-sidor, och räknar den därför **inte**. Hellre två belagda än tre
uppblåsta.

### Starkt jämförbar 1 — Terraform-providrarnas acceptanstester (HashiCorp)

Den närmaste analogin som finns: tester mot ett **riktigt SaaS-API**, delat
konto, inga transaktioner, kvoter och kostnad per skapad resurs.

Deras lösning är fyra samverkande delar, samtliga förstaparts-dokumenterade
([Terraform AWS Provider contributor guide](https://hashicorp.github.io/terraform-provider-aws/running-and-writing-acceptance-tests/)):

1. **Parallellt som default:** "Tests should use `acctest.ParallelTest` instead
   of `acctest.Test` except where serialized testing is absolutely required."
2. **Slumpade namn är obligatoriska:** "For AWS resources that require unique
   naming, the tests should implement a randomized name" via
   `acctest.RandomWithPrefix`. Namnrymden **är** isoleringen.
3. **Selektiv serialisering där kvoten tvingar:** när tjänsten tillåter en
   instans per region serialiseras just de testerna — resten fortsätter
   parallellt.
4. **Sweepers för läckage:** "To prevent lingering resources from consuming
   quota or causing unexpected billing, the Terraform Plugin SDK supports the
   test sweeper framework."

Dokumentationen är också uttrycklig om priset: "Our acceptance test suite
creates real resources, and as a result, they cost real money to run."
Testmönstret erkänner alltså att rollback inte existerar och kompenserar med
namndisciplin plus städning.

**Mot vår begränsning:** direkt tillämpligt på namn-axeln — och vi gör redan
halva saken (`randomUUID()`-sentineller i `create-registration`,
`create-event-note`, `create-event`; purge-skriptet som sweeper). Punkt 3 är
värd att notera: **deras svar på en kvot är att serialisera just den delen**,
inte att sharda runt den. Det är exakt vår situation med fem anrop per sekund.

### Starkt jämförbar 2 — Kubernetes e2e-ramverket

Delad, långlivad, muterbar backend (ett kluster) utan rollback, testad
parallellt med Ginkgo. Isoleringen är **namnrymd per test**: ramverket skapar en
egen namespace i `BeforeEach` med basnamn plus slumpsuffix
(`fmt.Sprintf("%s-%08x", f.BaseName, rand.Int31())`), river den i `AfterEach`
styrt av `delete-namespace`- och `delete-namespace-on-failure`-flaggorna, och
låter `SynchronizedBeforeSuite` se till att bara den första parallella noden
städar gamla namespaces
([framework.go](https://raw.githubusercontent.com/kubernetes/kubernetes/master/test/e2e/framework/framework.go)).

**Mot vår begränsning:** halvt tillämpligt, och gränsen är viktig. Kubernetes har
en **äkta namnrymds-primitiv** — allt inuti en namespace är osynligt utifrån.
Airtable har ingen. Vår motsvarighet blir en namnkonvention plus
`filterByFormula`, vilket isolerar skrivningar men **inte** läsningar som går
förbi filtret: listvyer utan prefix-villkor, antals-assertions, och rollups som
per konstruktion aggregerar över hela tabellen.

### Lärorikt motexempel — Cal.com

Det mest citerade Playwright-shardnings-exemplet, och det säger något annat än
man tror. Deras e2e-workflow kör en åttadelad matris
(`yarn e2e --shard=${{ matrix.shard }}/${{ strategy.job-total }}`) — men varje
matrisjobb startar **sin egen** `postgres:18` som service-container
([e2e.yml](https://raw.githubusercontent.com/calcom/cal.com/main/.github/workflows/e2e.yml)).
Deras `playwright.config.ts` sätter `fullyParallel: true` och `workers` till
antalet CPU-kärnor, utan ett ord om datadelning
([Cal.com Playwright-config](https://raw.githubusercontent.com/calcom/cal.com/main/playwright.config.ts)).

**Slutsatsen är själva poängen:** de shardar inte mot en delad backend — de
shardar för att backend är gratis att duplicera per shard. Sharding-vinsten är
byggd ovanpå isolering som redan är löst, inte i stället för den.

### Förstaparts-ramverksmönster — Playwrights kontopool per worker

Worker-scopad fixtur som äger ett konto per worker-slott och återanvänder det
för alla tester i den workern ([test-parallel](https://playwright.dev/docs/test-parallel)).

**Mot vår begränsning:** användbart, med en fälla. Dokumentationens exempel
nycklar på `workerIndex`, som får ett **nytt** värde när en worker startar om
efter fel — i en poolmodell betyder det att en omstart kräver ett nytt konto
i stället för att återta det gamla. `parallelIndex` är det stabila slott-numret
och är det man vill ha för en pool med fast storlek.

### Sammanställning mot vår begränsning

| Mönster | Fungerar för Supabase-halvan | Fungerar för Airtable-halvan |
|---|---|---|
| Efemär namnrymd per körning | ja | delvis — skrivningar isoleras, breda läsningar och rollups läcker |
| Per-PR-miljöer | ja, se § Supabase | nej — ingen kloning finns |
| Transaktionell rollback | i princip, men datat vi testar bor inte där | nej — REST-API utan transaktioner |
| Seedad isolering per körning | ja | delvis — redan halvbyggt hos oss |
| Lokal backend i stället för delad | ja (`supabase start`) | nej — ingen self-hosted Airtable; däremot **mockning**, som vi redan gör |

---

## 4. Supabase branching

**Vad det är och omfattar.** Isolerade preview-miljöer per pull request. Deploy-
flödet på en branch kör migrationer, Edge Functions, tjänstekonfiguration
(Auth, API, Database, Storage, Realtime), Vault-secrets och seed-data
([Supabase — Branching](https://supabase.com/docs/guides/deployment/branching)).
Branchar skapas antingen via GitHub-integrationen eller som persistenta branchar
i dashboarden.

**Vad som uttryckligen inte följer med:** "New branches do not start with any
data from your main project. This is meant to better protect your sensitive
production data." Det är alltså en **tom** miljö plus seed, inte en kopia.

**Kostnad.** Debiteras som moderprojektet för Compute, Disk Size, Egress och
Storage. En branch på Micro-compute börjar på **0,01344 USD per timme**, alltså
ungefär 0,32 USD per dygn. Compute-krediter gäller **inte** för branch-compute —
det posteras separat som "Branching Compute Hours"
([manage-your-usage/branching](https://supabase.com/docs/guides/platform/manage-your-usage/branching)).

**Löser det halva problemet?** Mindre än halva, och det är den viktiga
nyanseringen. En branch ger isolerad Postgres och isolerade Edge Functions —
men **vårt data of record för event, anmälningar och personer bor i Airtable**,
och Edge-funktionerna når det via `AIRTABLE_BASE_ID`. En branchad EF pekar på
samma enda staging-bas. Kollisionsrisken ligger i Airtable-lagret, och den
flyttar sig inte en millimeter av branching.

**Forensisk not (viktig för alla förslag härifrån):** ADR-050 utvärderade redan
branching som "Väg C" och avvisade den **som primär staging** — vi ville ha en
långlivad, konstant prod-spegel med deployad EF. Samma ADR lämnar dörren öppen
med ordagrant "Kan adderas senare för PR-previews." Ett branching-förslag är
alltså inte en rivning av ADR-050; det är den redan bokförda fortsättningen. Men
det är **inte** en shardnings-enabler.

---

## 5. Airtable-specifikt — kan vi isolera per körning?

**Nej. Den vägen är stängd, och den är stängd två gånger om.**

### Finns förstapartsstöd för att duplicera en bas via API?

Nej. Ändringsloggen för webb-API:t visar exakt tre bas-endpoints, samtliga från
2022-11-15: **Create base**, **List bases** och **Delete base**. Ingen
duplicerings-, kopierings- eller mall-endpoint har någonsin skeppats
([changelog](https://airtable.com/developers/web/api/changelog)).

### Spärr 1 — den skapade basen skulle sakna hela beräkningslagret

`Create base` tar `name`, `workspaceId` och en `tables`-array, och bygger tabeller
från grunden ([create-base](https://airtable.com/developers/web/api/create-base)).
Men fälttyps-modellen visar att de beräknade typerna saknar skrivformat och är
markerade read-only ([field-model](https://airtable.com/developers/web/api/field-model)):

- `formula`, `rollup`, `multipleLookupValues`, `count`
- `autoNumber`, `createdTime`, `lastModifiedTime`, `button`

En API-skapad "klon" av vår bas vore alltså strukturellt **icke-ekvivalent** —
hela formel- och rollup-lagret skulle fattas. Vår bas är rollup-tung nog att
CLAUDE.md pekar ut permanenta rollup-fixturer som en yta som aldrig får röras.
Att testa mot en bas utan dem vore att testa något annat än produkten.

### Spärr 2 — vi skulle inte kunna städa upp efter oss

`Delete base` är enligt ändringsloggen "available to enterprise users on
request." Utan enterprise-åtkomst kan vi skapa baser men inte ta bort dem
programmatiskt — per-körning-kloning skulle läcka en bas per CI-körning in i
workspacet. Det är ett självförstörande mönster.

### Kvot och tid

- **Fem anrop per sekund per bas.** Vid överskridande: 429, och "you will need
  to wait 30 seconds before subsequent requests will succeed"
  ([rate-limits](https://airtable.com/developers/web/api/rate-limits)).
- **50 anrop per sekund** totalt för en personal access token över allt.
- Vår klient hanterar 429 med en fast sekunds väntan och omförsök
  (`supabase/functions/_shared/airtable-client.ts`, tre ställen), alltså
  **inte** de 30 sekunder dokumentationen anger. Det är en egen observation
  värd en tråd, oberoende av shardningsfrågan.

Att 50-taket ligger över 5-taket betyder att **fler baser** faktiskt skulle höja
den samlade genomströmningen — vilket är precis den utväg spärr 1 och 2 stänger.

### Vad som faktiskt fungerade

ADR-050 dokumenterar att staging-basen skapades genom **duplicering i
gränssnittet**, utan records — och Session 36 verifierade live att
dupliceringen **bevarade tabell- och fält-ID:n** (Segment-tabellen är
`tbll2N6JKCj4u6y9o` på båda baserna). Manuell duplicering är alltså en fungerande
metod för ett fåtal långlivade baser, och den bevarar den ID-adressering vår kod
bygger på. Den är däremot oanvändbar per körning: den är manuell, och varje
schema-ändring måste sedan replikeras för hand till varje kopia.

---

## Vad det betyder för OSS

**1. Mutexen är inte försiktighet — den är en dokumenterad reparation.**
`playwright.config.ts` bär TASK-6-noten: när `api-staging` och
`chromium-authenticated` kör samtidigt uppstår **sex deterministiska
kollisioner** (create-registration 89/129/160, get-registrations 86/132,
update-record 92), eftersom e2e-flödena skriver mot samma staging-poster som
API-testernas idempotens- och ordnings-assertions läser. Det är kollisionsklassen
vi skulle mångfaldiga genom att sharda. `concurrency: staging-tests` med
`queue: max` i `ci-suite.yml` är samma invariant på CI-nivå, förstärkt av
ADR-073:s semafor.

**2. Två grindar, inte en.** Korrekthet kräver disjunkta dataområden. Utdelning
kräver dessutom att flaskhalsen är latens, inte Airtable-kvoten. Passerar vi
bara den första grinden får vi en svit som är korrekt, parallell och **precis
lika långsam** — plus fler 429-sömnar.

**3. Vår shard-granularitet vore dålig som configen står idag.** Vi sätter inte
`fullyParallel`, så shardning skulle ske per fil. Filerna är extremt ojämna:
`event-detail.staging.test.ts` bär 56 tester, `events-list` 25, `hem` 28 — medan
`css-cascade` bär 1 och `airtable-filter` 1. En fyrdelad shardning skulle
balanseras av slumpen. Och `fullyParallel: true` är i sig det farligare
alternativet mot delad muterbar data, eftersom det upphäver garantin att tester i
samma fil kör i ordning i samma worker.

**4. Vi äger redan halva vokabulären.** Sentinel-UUID:er, `ZZ-`-prefix,
`.purge-staging-policy.json` med exakt-match-mönster och `linkGuard`, samt
`seed-review-fixture.mjs` med ort-prefix. Det är i praktiken Terraform-mönstret:
slumpat namn plus sweeper. Det som fattas är **shard-medvetenhet** och friheten
från delade ankare.

**5. Det delade ankaret är den hårda knuten.** `TEST_REGISTRATION_RECORD_ID` är
**en** post som muteras av `update-record`, `send-registration-confirmation` och
`create-registration`-testerna, och e2e:s `mark-paid` rör samma klass. Att ge
varje shard egna nyskapade poster är görbart. Att göra assertions **blinda för
andra shards poster** är det svåra: varje antals-kontroll, varje "första raden i
listan", varje rollup-summa är global state förklädd till lokal.

**6. Airtable-kvoten är delad oavsett hur många shards vi startar.** Nio minuter
vid fem anrop per sekund är ett tak på cirka 2 700 Airtable-anrop för hela
körningen. Vi vet inte var vi ligger mot det. Det är den enskilt viktigaste
osäkra siffran i hela frågan.

---

## Rangordnade alternativ

### Rang 1 — Mät först, sharda inte. Kostnad: låg

Kör sviten med en reporter som ger per-test-varaktighet och räkna Airtable-anrop
i EF-loggarna. Utfallet delar frågan i två: är sviten latens-bunden finns det
något att vinna på parallellitet; är den kvot-bunden är shardning bevisat
verkningslös och frågan är avslutad.
**Låser upp:** ett faktabaserat beslut i stället för ett arkitektur-åtagande på
gissning. **Detta är enda alternativet jag rekommenderar att göra härnäst.**

### Rang 2 — Krymp den delade ytan i stället för att dela upp den. Kostnad: medel

Flytta de e2e-tester som bara **läser** till den hermetiska formen repot redan
har bevisat: `tests/visual/` mockar allt nätverk mot
`tests/visual/support/fixture-data.ts` och har noll staging-beroende. Den
mängden kan sedan shardas fritt, `fullyParallel` och allt, eftersom den inte har
någon delad backend alls. Staging-sviten krymper till de tester som genuint bär
integrationsbevis — och blir snabbare under mutexen på köpet.
**Låser upp:** äkta parallellitet för majoriteten av vy-testerna, utan en enda
ny isoleringsmekanism. **Precedent finns i repot självt**, vilket gör det till
den billigaste vägen till 11/10.

### Rang 3 — Shard-medveten dataområdes-isolering på staging. Kostnad: hög

Slott-prefix enligt formeln i § 2, per-slott-ankare i stället för det delade
`TEST_REGISTRATION_RECORD_ID`, prefix-blinda assertions, och en purge-policy som
förstår slott-prefix.
**Låser upp:** parallell staging-svit — men bara upp till 5 anrop per sekund.
**Rekommenderas inte** innan rang 1 visat att sviten är latens-bunden, och även
då efter rang 2, eftersom rang 2 minskar mängden som behöver isoleras.

### Rang 4 — Supabase branching för PR-previews. Kostnad: ~0,32 USD per branch och dygn plus arbete

ADR-050:s redan öppna dörr ("Kan adderas senare för PR-previews").
**Låser upp:** isolerad EF- och migrations-verifiering per PR.
**Löser inte** Airtable-kollisionen och är därför **ingen shardnings-enabler**.
Värderas på sina egna meriter, i sitt eget beslut — inte som svar på denna fråga.

### Rang 5 — Flera långlivade Airtable-baser. Kostnad: hög och löpande

Två till fyra UI-duplicerade shard-baser skulle höja taket till 5 anrop per
sekund gånger antalet baser.
**Avvisas som default:** ingen API-duplicering finns, så varje schema-ändring
måste replikeras för hand till varje bas. Schema-drift mellan baser är ett
tystnande fel — testerna blir gröna mot fel struktur. Det står dessutom i direkt
spänning med ADR-063, som gör basen till en förstklassig leverabel som ska maxas,
inte fyrdubblas.

### Rang 6 — Bas per körning via API. Kostnad: irrelevant

**Stängd väg, med belägg.** Beräknade fälttyper kan inte skapas via API:t, så
klonen vore strukturellt icke-ekvivalent; och `Delete base` är enterprise-only,
så varje körning skulle läcka en bas. Bokförs här så att den inte behöver
utredas igen.

---

## Öppna frågor

1. **Var går de 9,1 minuterna?** Ingen mätning finns i repot. Utan den är varje
   parallelliserings-beslut en gissning. Detta är rang 1.
2. **Hur många Airtable-anrop gör sviten?** Ligger vi nära 2 700 är vi redan vid
   kvot-taket och shardning är bevisat verkningslös.
3. **Hur många av de ~340 e2e-testerna är rena läs-tester?** Det talet avgör hur
   mycket rang 2 är värt.
4. **Vad händer med `fullyParallel: true` inom EN oshardad körning?** Det är det
   billigaste isolerings-experimentet som finns: det avslöjar kollisionerna
   lokalt, utan att röra CI, mutex eller shard-infrastruktur.
5. **Är rollup-fixturerna oundvikligt globala?** Om en rollup går att göra
   per-slott faller den svåraste invändningen mot rang 3.
6. **Bör Airtable-klientens 429-backoff vara 30 sekunder i stället för 1?**
   Dokumentationen anger 30. Fyndet är oberoende av shardningsfrågan och hör
   hemma i sitt eget spår.

---

## Källförteckning

### Förstapart — Playwright

- [Sharding](https://playwright.dev/docs/test-sharding) — `--shard`, granularitet, `merge-reports`. Läst 2026-07-26.
- [test-sharding-js.md (källa)](https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/test-sharding-js.md) — verifiering av att state inte behandlas.
- [Parallelism](https://playwright.dev/docs/test-parallel) — workers, `fullyParallel`, kontopool per worker.
- [test-parallel-js.md (källa)](https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/test-parallel-js.md) — `user-${workerIndex}`-exemplet.
- [class-testinfo](https://playwright.dev/docs/api/class-testinfo) — `parallelIndex`- och `workerIndex`-garantierna.
- [class-testconfig](https://playwright.dev/docs/api/class-testconfig) — `shard`, `fullyParallel`, `workers`.
- [class-fullconfig](https://playwright.dev/docs/api/class-fullconfig) — `shard` är läsbar i runtime.
- [dispatcher.ts](https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright/src/runner/dispatcher.ts) — källkodsbevis: `parallelIndex` tilldelas ur lokala worker-slottar utan shard-referens.

### Förstapart — Supabase

- [Branching](https://supabase.com/docs/guides/deployment/branching) — omfattning, "do not start with any data".
- [Manage Branching usage](https://supabase.com/docs/guides/platform/manage-your-usage/branching) — 0,01344 USD/timme, compute-krediter gäller inte.

### Förstapart — Airtable

- [Changelog](https://airtable.com/developers/web/api/changelog) — Create/List/Delete base 2022-11-15; ingen duplicerings-endpoint; Delete base enterprise-only.
- [Create base](https://airtable.com/developers/web/api/create-base) — `name`, `workspaceId`, `tables`.
- [Field model](https://airtable.com/developers/web/api/field-model) — beräknade fälttyper är read-only.
- [Rate limits](https://airtable.com/developers/web/api/rate-limits) — 5 per sekund per bas, 50 per token, 30 sekunders väntan efter 429.

### Förstapart — precedent-projekt

- [Terraform AWS Provider — Acceptance Tests](https://hashicorp.github.io/terraform-provider-aws/running-and-writing-acceptance-tests/) — `ParallelTest`, `RandomWithPrefix`, sweepers, selektiv serialisering vid kvot.
- [Terraform Plugin Testing — Testing Patterns](https://developer.hashicorp.com/terraform/plugin/testing/testing-patterns) — slumpade namn "to avoid collisions from multiple concurrent tests", `CheckDestroy`.
- [Kubernetes e2e framework.go](https://raw.githubusercontent.com/kubernetes/kubernetes/master/test/e2e/framework/framework.go) — namnrymd per test, städning, `SynchronizedBeforeSuite`.
- [Cal.com e2e.yml](https://raw.githubusercontent.com/calcom/cal.com/main/.github/workflows/e2e.yml) — åtta shards, egen `postgres:18` per shard.
- [Cal.com — Playwright-config](https://raw.githubusercontent.com/calcom/cal.com/main/playwright.config.ts) — `fullyParallel: true`, workers per CPU-kärna.

### Internt (läst, ej ändrat)

- `playwright.config.ts` — TASK-6-noten med de sex kollisionerna; frånvaron av `fullyParallel`.
- `.github/workflows/ci-suite.yml` — `concurrency: staging-tests`, `queue: max`.
- `.purge-staging-policy.json` — sentinel-mönster, `linkGuard`, strypning till 250 ms.
- `supabase/functions/_shared/airtable-client.ts` — 429-hantering med en sekunds väntan.
- [ADR-050](../decisions/ADR-050-isolerad-staging-miljo.md) — branching avvisad som primär staging, öppen för PR-previews; UI-duplicering bevarade ID:n.
- [ADR-073](../decisions/ADR-073-parallella-batch-pipelines.md) — staging-semaforen och mutex-invarianten.
