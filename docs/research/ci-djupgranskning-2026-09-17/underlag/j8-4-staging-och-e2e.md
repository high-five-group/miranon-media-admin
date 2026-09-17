---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J8.4 — Staging och E2E: en delad miljö, en städrutin, och en svit som bara kör EFTER landning

> **Proveniens:** agent-uppdrag J8.4 i CI-djupgranskningen (Session 126),
> 2026-09-17. Modell: Sonnet 5 (`claude-sonnet-5`). Kört i worktreen
> `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s126-ci-djupgranskning`,
> gren `docs/s126-ci-djupgranskning`. Ögonblicksbilden för kod och git-historik
> är `origin/main` på `eeca8c72` (2026-09-08) — verifierat live mot GitHub i
> detta pass (`gh api repos/high-five-group/miranon-media-admin/commits/main`
> gav samma SHA och datum 2026-09-17), så `main` har **inte rört sig på nio
> dagar** trots att repot normalt landar 20–30 PR:er/dygn (se § Oväntat fynd).
> `gh run list`/`gh issue list` i detta dokument är däremot **live-frågor mot
> GitHub**, inte begränsade till ögonblicksbilden — de går bakåt i tiden från
> dagens datum och är därför aktuella mätningar, inte historik ur en frusen
> checkout.

## Kort svar

**Ja på båda de svåra frågorna: miljön delas, och den KAN förstöras av en
annan körning — det har hänt, upprepade gånger, senast för elva dagar sedan,
och motmedlet är fortfarande inte byggt.** Purgen är en välbyggd,
idempotent, fail-closed städrutin med tydliga skyddsräcken — den är inte
problemet. Problemet är att en delad, muterbar Airtable-rad kan bli
kvarlämnad i ett **inkonsekvent** tillstånd (inte "för mycket data", utan
"fel VÄRDE på ett fält en helt annan testfil läser"), och ingen mekanism
läker det förrän en människa läser om det manuellt.

**"Bara efter landning" är rätt avvägning för PR-ytan, men det andra
skyddslagret (post-merge) har en mätt täckningslucka och en obevisad
larmkedja.** Sviten testar riktig autentisering, riktig Postgres och en
riktig Airtable-bas — men frontend körs i Vite **dev-läge** (inte
produktionsbygget Vercel serverar), Edge Functions på staging deployas
**manuellt** och kan avvika tyst från den commit som testas, och PDF-motorn
körs i leverantörens egna **testläge** (vattenstämplad). Under de senaste
åtta dagarna med data (2026-08-31–2026-09-08, 211 post-merge-körningar) var
**100 % av alla röda och avbrutna körningar** (59 av 211, 28 %) i EXAKT ett
jobb: `Staging (API + E2E)`. Noll av de andra fem tunga jobben föll. **31 av
230 landade träd (13,5 %) fick aldrig någon post-merge-körning alls** i
samma fönster — mätt, inte antaget. Och 16 av post-merge-lagrets egna
larm-ärenden stod **obesvarade i 10–11 dygn** (skapade 2026-09-06/07,
stängda i klump 2026-09-17 — i praktiken under förberedelserna för DENNA
granskning) innan de över huvud taget triagerades.

## Vad jag läste först

Fem tidigare research-pass (samtliga S91, 2026-07-26/27) täcker redan
merparten av den arkitektoniska grunden för denna fråga, och jag bygger
vidare på dem i stället för att upprepa dem:

| Pass | Vad det redan svarar | Ålder |
|---|---|---|
| `docs/research/merge-queue-mot-staging-mutex-2026-07-26.md` | Varför merge queue inte löser mutex-serialiseringen; `concurrency`-räckvidden är repo-global | 7 v — mekaniken oförändrad, verifierad mot dagens `ci-suite.yml` |
| `docs/research/parallell-e2e-mot-delad-backend-2026-07-26.md` | Varför Airtable inte kan klonas per körning; Terraform/Kubernetes-precedent för delad muterbar backend | 7 v — Airtables API-begränsningar (ingen bas-duplicering, `Delete base` enterprise-only) är plattformsfakta, osannolikt ändrade |
| `docs/research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md` | Branschens norm (Ghost, Grafana, Supabase, cal.com, PostHog): ingen kör e2e mot delad, muterbar staging med en CI-mutex | 7 v — höll som avstamp, se § 8.4.9 |
| `docs/research/staging-fixturinventering-2026-08-10.md` | Vilka staging-rader som är bundna/skyddade, `protectedRecordIds`, vad purgen aldrig rör | 5 v — bekräftade permanenta fixturer (bl.a. `recqxaFNwHAdQlAqb`, "ZZ-History Person 01") som VISAR SIG vara exakt den post som pollueras i mitt eget fynd nedan |
| `docs/research/prodbas-synk-staging-till-prod-2026-08-11.md` | Schema-diff staging↔prod: 3 additiva luckor i prod, 0 i staging, ingen semantisk drift | 5 v — jag har INTE kört om diffen (kräver skriv-scope jag saknar denna session); behandlas som "sannolikt oförändrat" |

ADR:erna jag läste i sin helhet: **ADR-050** (isolerad staging, väg C/branching
avvisad som primär), **ADR-077** (riskklassning/dedup/nattnät — och dess
Updates-sektion 2026-08-28 om TASK-334, som redan avgjorde en angränsande
fråga: "kör alltid staging oavsett klass" FÖRKASTADES explicit med en mätt
25-minuters revert-incident som skäl), **ADR-080** (acceptance-klassens
utbrytning ur e2e — förklarar VARFÖR bara 13–14 filer i dag kör skarpt mot
staging i stället för 32) och **ADR-132** (demoläget, 2026-09-06 — **staging
har fått en ANDRA roll sedan denna fråga senast utreddes**: den bär nu även
Lottas demoläge, med en permanent, svep-undantagen fixtur).

**Vad som är nytt i detta pass:** ingen tidigare fil mäter post-merge-lagrets
faktiska röd/grön-kvot, klassar VILKET jobb som fäller, räknar
täckningsluckan i konkreta commits, eller läser larmärendenas faktiska
tid-till-stängning. Det är kärnan i vad som följer.

## Metod

Kodläsning (`ci-suite.yml`, `post-merge.yml`, `nightly.yml`,
`scripts/purge-staging-sentinels.mjs`, `playwright.config.ts`,
`.staging-semaphore-policy.conf`, Edge Function-källkod för mail/PDF).
Levande mätningar via `gh run list`/`gh run view`/`gh issue list` mot
`high-five-group/miranon-media-admin` (läsande anrop, inga skrivningar,
sparsamt — sidor hämtade en gång och sparade i `/tmp`/scratchpad i stället
för att frågas om igen). Ingen kod ändrad, inget test kört mot staging, ingen
Airtable-post rörd.

## Fynd

### 8.4.1 — Kör stagingtesterna mot en miljö som delas mellan flera PR:er?

**Verifierad.** Det finns exakt **en** staging-Airtable-bas
(`apphjj8Q7lkXCMsL4`) och **ett** staging-Supabase-projekt
(`pqtshyierkdgwdnxuirz`), och alla staging-rörande CI-körningar pekar mot
samma par. Sedan `TASK-70.3`/`TASK-70.4` (kommentar i `ci-suite.yml` rad
1–20, ADR-077 § Updates) kör PR-ytan aldrig `Staging (API + E2E)` — `ci.yml`
skickar `run_staging: false` och `run_a11y: false` **villkorslöst** till
`ci-suite.yml`. De enda anroparna som får defaulten `true` är
**`post-merge.yml`** (kör efter varje landning på `main`) och
**`nightly.yml`** (schemalagd ~03:00 Europe/Stockholm). Bärarna av mutexen
`staging-tests` är alltså två, inte tre, och delar dessutom miljön med:

- lokala körningar från en utvecklares/agents maskin (`npm run
  test:api:staging` / `test:e2e:staging` / `purge:staging` / `seed:review`)
- **demoläget** (ADR-132, 2026-09-06): en permanent fixtur ("Lottas morgon")
  som Lotta kör mot samma bas och samma Supabase-projekt, medvetet
  **undantagen från svepet** — en ny, ständigt närvarande hyresgäst i samma
  delade rum, tillkommen efter den senaste gången denna fråga utreddes

### 8.4.2 — Kan två körningar förstöra data för varandra?

**Verifierad, med ett skarpt, aktuellt och namngivet exempel — inte en
teoretisk risk.**

Mekanismen är dokumenterad som **L599** i `tasks/lessons/vol-08.md`:
`update-record.staging.test.ts` sätter ett sentinel-värde
(`Flagga = 'ZZ-S103-flagga-sentinel'`) på en **permanent, delad
fixturperson** (`ZZ-History Person 01`, record-ID `recqxaFNwHAdQlAqb` —
samma post som staging-fixturinventeringen pekade ut som "skyddad men bunden
av sju separata testsviter") och återställer värdet i ett `finally`-block.
Om processen avbryts MELLAN mutationen och återställningen — mutex-timeout,
SIGKILL, en avbruten CI-körning — står sentinelvärdet kvar i den delade
basen. En **helt annan testfil**, `get-person.staging.test.ts:173`
(`expect(person.flagga).toBeNull()`), läser samma post och faller
**deterministiskt, i varje efterföljande körning**, tills en människa läser
posten via MCP och nollställer den för hand.

Detta har hänt **tre gånger** enligt lessons-loggen (2026-08-17, en gång
till, och 2026-09-07). Jag mätte den tredje instansen skarpt i detta pass:

| Tidpunkt (UTC) | Run | Utfall | Fällande jobb |
|---|---|---|---|
| 2026-09-06 14:54–20:00 | 14 post-merge-körningar i rad | RÖTT | `Staging (API + E2E)` |
| 2026-09-06 20:12 | `d99db0ec` | GRÖNT (manuell återställning) | — |
| 2026-09-07 15:57–16:05 | 2 post-merge-körningar | RÖTT IGEN | `Staging (API + E2E)` |
| 2026-09-07 16:17 | `fb814734` | GRÖNT (manuell återställning) | — |

Den **andra** vågen (2026-09-07) visar att motmedlet från den första vågen
inte höll: en ny avbruten körning återskapade exakt samma pollution mindre
än ett dygn senare. Issue `#2447`s egen kommentar bekräftar rotorsaken
ordagrant: *"Rotorsak: sentinel-driften (L599, tredje instansen) — samma
kvarliggande `ZZ-S103-flagga-sentinel` på fixturpersonen ... i staging-
Airtable-basen."* Lessons-posten listar tre motmedels-kandidater (sentinel-
städ i setup-purgen; självläkande läs-assertions; tidsstämplade sentinel-
värden) och slår själv fast: **"Motmedel (a) är fortfarande inte byggt."**
Det gäller fortfarande — jag hittade ingen ändring i `.purge-staging-
policy.json` eller `purge-staging-sentinels.mjs` som stänger den här klassen
(muterbara FÄLTVÄRDEN på en permanent rad, till skillnad från HELA RADER,
som är allt purgen i dag känner till).

**Utanför denna specifika lucka finns riktiga skyddsräcken** (§ 8.4.3–8.4.4)
mot den vanligare kollisionsklassen (två körningar som skapar/raderar egna
rader): en global CI-mutex, en lokal semafor, ett ägar-manifest per körning
och en purge både före och efter. L599 är alltså inte "purgen fungerar
inte" — det är en kollisionsklass purgen aldrig var designad för att se.

### 8.4.3 — Vad gör "Staging sentinel purge" exakt?

**Verifierad, läst rad för rad i `scripts/purge-staging-sentinels.mjs`
(1 142 rader) och `ci-suite.yml`.**

Det är i praktiken **fyra** mekanismer under samma namn, körda i tre
separata CI-jobb (egen runner-VM, egen secret för varje — ADR-060 punkt 2+4,
"EF-only-gränsen": testjobbet får ALDRIG en Airtable-token):

1. **`purge` (Staging sentinel purge, FÖRE)** — körs i `ci-suite.yml` innan
   `test-staging`, gated på `inputs.run_staging`. Läser policyn
   `.purge-staging-policy.json`, listar sentinel-rader per `target` via
   `filterByFormula`, och raderar de som är äldre än en **ålders-guard**
   (60 min).
2. **`purge-efter` (EFTER körningen)** — nytt sedan `TASK-309.15`
   (2026-08-24). Läser ett **ägar-manifest** (`.kastbara/poster.jsonl`) som
   testerna själva skrev under körningen och raderar EXAKT de posterna,
   `if: always()` (även vid rött/avbrutet).
3. **Storage-targets** (`TASK-302.3`) och **Postgres-targets**
   (`TASK-346.3`) — samma skript, andra klasser, gated på fyra `TEST_*`-secrets
   som redan finns i workflow-filen (ingen ny credential-klass).
4. **`--efter-korning`-läget** har en egen **luckdetektion**: en rad som
   FINNS kvar i basen men som INGEN target gör anspråk på fäller jobbet
   (exit 2) i stället för att tigande ackumulera — det var precis den
   defekten som lät två `ZZ-create-event-test-uppdaterad`-rader ligga kvar i
   27–32 dygn innan `staging-fixturinventering-2026-08-10.md` hittade dem.

**Skyddsräcken (fyra, alla hårda, i denna ordning):**

1. **Bas-guard** — `expectedBaseId` måste vara app-formad och FÅR INTE stå i
   `forbiddenBaseIds` (prod hårt blockerad; se `main()`-koden, som avbryter
   direkt med exit 1 vid policy-fel).
2. **Ålders-guard** — bara sentineler äldre än `minAgeMinutes` raderas i
   setup-läget, för att skydda pågående körningar.
3. **Exakt markör-match** — `filterByFormula` grovsorterar server-side,
   koden asserterar exakt mönster per rad (så en fixtur som `ZZ-History...`
   aldrig träffas trots ett liknande prefix).
4. **Länk-guard** (`linkGuard: true`) — en rad med NÅGOT icke-tomt
   länkfält hoppas över och RAPPORTERAS i stället för att raderas
   (fail-safe-riktning: hellre lämna kvar fel rad än radera en länkad).

**Radering, batchning och 429:** Airtable tillåter max **10 record-ID per
DELETE-anrop**. `chunk()` (rad 407–411) delar upp i batchar om
`deleteBatchSize` (policyvärde). Ett 429-svar loggas och väntar **30
sekunder** innan omförsök (`airtableRequest`, rad 526–528) — samma tal som
Airtables egen dokumentation anger (`airtable.com/developers/web/api/
rate-limits`), vilket är en skärpning sedan
`parallell-e2e-mot-delad-backend-2026-07-26.md` noterade att klienten då
bara väntade 1 sekund på andra ställen i kodbasen.

### 8.4.4 — Varför krävs rensningen FÖRE testet (och varför också EFTER)?

**Verifierad, med industriprecedent citerad i koden själv.**

**Före:** för att varje ny sentinel-svit ska börja från ett känt, tomt läge —
annars ackumuleras gamla sentinel-rader från tidigare körningar och riskerar
att träffas av bredare listningar/räkningar i nya tester. ADR-060 citerar
Vlad Mihalcea: *"setup > teardown för test-data-cleanup"* — en teardown körs
inte om processen kraschar, en setup-purge körs alltid (nästa gång, oavsett
vad som hände sist).

**Efter (den nyare, `TASK-309.15`-mekanismen):** setup-purgen är
STRUKTURELLT oförmögen att städa fönstret MELLAN en körning och nästa
staging-jobb. Mätningen som motiverade detta var konkret: **151
kvarliggande "ZZ"-event i staging, samtliga yngre än 2,4 timmar** (mätt
2026-08-24) — setup-purgen HADE kört, men de kastbara eventen bär FRAMTIDA
startdatum och syns därför som **kommande event i Lottas eventväljare** tills
någon rensar dem. Marcus valde ett av dem vid en granskning och fick en tom
genereringsvy — ett produktionsnära UX-fel orsakat av en testartefakt, inte
en bugg i vyn. Efter-purgen stänger just det fönstret genom att städa
DIREKT efter varje körning, oavsett utfall.

### 8.4.5 — Vad händer om rensningen misslyckas halvvägs?

**Verifierad.** Skriptet är byggt för partiellt fel, inte allt-eller-inget:

- **Per target, inte globalt.** `main()`s huvudloop kör varje `target` i ett
  eget `try/catch`. Ett `ApiError` för en target loggas
  (`console.error`) och `hadApiError` sätts, men loopen **fortsätter** till
  nästa target. Jobbet fäller (`process.exit(2)`) först i slutet, om NÅGON
  target fallerade — men allt som gick att städa, städades.
- **Race mot en samtidig purge är hanterat, inte bara upptäckt.**
  `deleteRecords()` provar batch-DELETE (upp till 10 ID:n); fäller batchen på
  "posten finns redan inte" (en annan purge hann före) faller den tillbaka
  till **post-för-post**-radering (`deleteOneByOne`) och räknar de redan
  raderade som en LYCKAD utfall, inte ett fel (`isAlreadyDeletedError`,
  fail-closed i fem led — en 404 av annan orsak fäller fortfarande).
- **Efter-verifiering.** Efter en lyckad radering listas målet OM och om
  några radera-bara sentineler ändå kvarstår kastas ett nytt `ApiError` —
  jobbet accepterar aldrig ett tyst "nästan klart".
- **`purge-efter`s `continue-on-error: true` på manifest-nedladdningen är
  medvetet**, inte slarv: saknas manifestet helt (testjobbet kraschade innan
  det hann ladda upp) loggar skriptet "inget ägar-manifest" och avslutar 0 —
  ett rött städjobb hade annars dolt det VERKLIGA felet bakom ett andra.
- **Storage-/Postgres-targets skippas tyst med en förklarande logg** om
  deras fyra secrets saknas — det räknas inte som fel, bara som en miljö utan
  de credentialsen.

Slutsats: skriptet är **idempotent och fail-closed på rätt axel** (hellre
ett CI-rött än en tyst kvarlämning) — men se § 8.4.2: idempotens gäller
RADER, inte FÄLTVÄRDEN på en delad, aldrig-raderad rad. Ingen CI-wired
testsvit för själva skriptets logik hittades i detta pass utöver de
kontraktstester som redan citeras i filhuvudet
(`scripts/test-seed-review-fixture.mjs` för en näraliggande policy-yta) —
jag har INTE verifierat att det finns en dedikerad `scripts/test-purge-
staging-sentinels.mjs` (ospårat i detta pass, se § Osäkerheter).

### 8.4.6–8.4.7 — Testas riktig autentisering, databas och externa API:er? Riktiga tjänster eller ersättningar?

**Verifierad per tjänst — se paritetstabellen i § Paritet.** Kort: JA på
autentisering, Postgres och Airtable (riktiga, skarpa, staging-instanser);
DELVIS på mail (riktig Resend, men en hård adress-allowlist som stoppar
allt utom fyra testadresser) och PDF (riktig DocRaptor/Prince, men i
leverantörens EGET `test: true`-läge); NEJ på frontend-artefakten (Vite
dev-server i CI-runnern, inte det Vercel-byggda produktionsbygget).

### 8.4.8 — Är staging tillräckligt likt produktion för att testet ska betyda något?

**Starkt indikerad, med två mätta reservationer.**

Enligt `prodbas-synk-staging-till-prod-2026-08-11.md` (5 veckor gammal, ej
omkörd i detta pass) var Airtable-schemat i **synk för alla 19 gemensamma
tabeller**, med enbart tre rent additiva luckor i PROD (som staging redan
bär) och NOLL semantisk drift i de delade fälten. Jag har inte omprövat
denna diff — den kräver skriv-scope (`AIRTABLE_SCHEMA_TOKEN`) jag inte har i
detta pass, och behandlas som "sannolikt oförändrat men overifierat 5 veckor
senare".

**Två mätta gap som SÄNKER paritetsgraden jämfört med vad en läsare intuitivt
antar:**

1. **Edge Functions deployas MANUELLT till staging, aldrig av CI.**
   `grep` över samtliga `.github/workflows/*.yml` gav noll träffar på
   `supabase functions deploy` — bekräftat explicit i
   `docs/reference/prod-driftsattning-runbook.md` ("inget CI-workflow
   refererar `supabase functions deploy`") och i ADR-050 ("Fas 7-skuld").
   Det finns inget skript av `fas4-prod-deploy.sh`-klassen för staging. **Det
   betyder att den kod `test-staging`-jobbet anropar är vad NÅGON senast
   deployade för hand — inte nödvändigtvis den commit som testas.** CLAUDE.md
   dokumenterar precis denna felklass för PROD ("en driftkarta härledd ur git
   är en HYPOTES om prod, aldrig en mätning" — `TASK-272`); samma resonemang
   gäller staging, fast utan motsvarande skarpt bevisad runbook.
2. **Frontend körs i Vite dev-läge, inte produktionsbygget.**
   `playwright.config.ts`s `webServer`-block för `chromium-authenticated`
   startar `npm run dev -- --port ...` (dvs. `vite`, källkodsdriven,
   HMR-kapabel, oförminskad) för varje körning — inte `npm run build` följt
   av en produktionsserver. Koden som testas ÄR exakt den commit som
   checkats ut (ingen drift där), men artefakten som testas är strukturellt
   annorlunda än vad Vercel serverar till Lotta (ingen minifiering, inga
   Vercel-specifika headers/redirects/edge-cache-beteenden).

### 8.4.9 — Körs testet på varje PR för att det behövs, eller bara för att det råkar vara möjligt — och håller "bara efter landning"?

Uppdragets ursprungliga premiss ("körs på varje PR") är **sju veckor
inaktuell** — sedan `TASK-70.3`/`TASK-70.4` (2026-09-06 enligt ADR-077 §
Updates-taggningen, men den mekaniska ändringen själv är äldre) kör
staging-sviten ALDRIG på PR-ytan. Frågan omformulerad, som uppdraget
självt bad om: **är "bara efter landning" rätt avvägning?**

**Vad som TALAR FÖR avvägningen (mätt, inte antaget):**

- ADR-077 § Updates 2026-08-28 dokumenterar att alternativet ("kör alltid
  staging oavsett klass") prövades och avvisades med ett SKARPT, namngivet
  motexempel: en åtta-raders docs-`.md`-ändring tog den globala mutexen i 10
  minuter, en väntande revert-PR fick vänta bakom den och `ci-wait.sh` timade
  ut efter 900 sekunder — revert-vägen (som existerar för att vara SNABB)
  blockerades av en markdown-ändring i 25 minuter 16 sekunder.
- I mitt eget 211-körningars sampel (2026-08-31–2026-09-08) föll **NOLL** av
  de fem andra tunga jobben (`Pure + Build`, `Acceptance`, `A11y`,
  `Webblasarbeteende`, `klassning`). Att flytta staging tillbaka till
  PR-ytan hade alltså inte bara återinfört mutex-kön — det hade koncentrerat
  ALL instabilitet direkt i den ytan som blockerar merge.

**Vad som TALAR EMOT — den mätta täckningsluckan:**

Jag jämförde `git log origin/main --first-parent` (230 landade träd,
2026-08-31–2026-09-08) mot `headSha` för samtliga 211 `post-merge.yml`-
körningar i samma fönster:

| Mått | Värde |
|---|---|
| Landade träd på `main` (first-parent) | **230** |
| Post-merge-körningar i samma fönster | **211** |
| Träd som fick MINST en post-merge-körning | 199 (86,5 %) |
| **Träd som ALDRIG fick en post-merge-körning** | **31 (13,5 %)** |

För samtliga 31 saknade träd finns ett annat, TÄCKT träd som landade
**sekunder till några minuter senare** (kortaste observerade mellanrum: 9
respektive 26 sekunder). Det mönstret är **starkt indikerat men inte
verifierat mot GitHubs egen dokumentation** som en känd "push-event-
sammanslagning" vid snabbt upprepade pushar mot samma ref — jag hittade
ingen förstapartskälla som uttryckligen beskriver detta beteende för
`on: push`, bara det empiriska mönstret att en NÄRLIGGANDE, senare commit
alltid täcker in luckan. Mekanismen kan alternativt vara att flera
merge-queue-poster landar i en enda `push`, där GitHub bara rapporterar EN
`github.sha` (huvudet av pushen) — vilket skulle ge exakt samma observerbara
signatur. Jag har inte kunnat skilja dessa två förklaringar åt inom detta
pass.

**Detta är ett KÄNT, ÖPPET kort — inte mitt eget fynd först.** `TASK-365`
("Post-merge-verifieringen kan aldrig fånga en kod-landning som följs av en
docs-push...", status **To Do**, senast rört 2026-09-02) beskriver EXAKT
denna klass och tillägger en allvarligare precisering efter granskning: den
ursprungliga hypotesen ("sviten avbryts av nästa push") var **delvis
falsifierad** — konkurrensavbrottet gäller BARA i vissa fall (kortets egen
review-kommentar), men **den PRIMÄRA luckan är larmkedjan**: jobbet "Larm
vid rött post-merge" rapporterade `success` i minst sex röda körningar under
~47 timmar utan att en människa eller orkestreraren agerade.

**Larmkedjans faktiska tillstånd, mätt i detta pass — och det är det
allvarligaste enskilda fyndet:**

| Datum-grupp (skapad) | Antal `ci-post-merge`-ärenden | Median tid till stängning |
|---|--:|---:|
| 2026-08-31 | 5 | ~93 h |
| 2026-09-01 | 4 | ~67 h |
| 2026-09-02 | 6 | ~46 h |
| 2026-09-03 | 12 | ~19 h |
| 2026-09-04 | 11 | 1–31 h (blandat) |
| 2026-09-05 | 2 | 1–4 h |
| **2026-09-06–07** | **16** | **~233–258 h (10–11 DYGN)** |

Samtliga 60 `ci-post-merge`-taggade ärenden i repot är i dag **stängda** —
men de sista 16 (skapade 2026-09-06/07, exakt de körningar som L599:s tredje
instans orsakade) stängdes **allihop inom loppet av några minuter
2026-09-17T09:02–09:04Z** — alltså i praktiken **under förberedelserna för
DENNA granskning**, inte som en löpande drift. Triage-kadensen var
förbättrad fram till och med 2026-09-05 (median föll från ~93 till ~1–4
timmar) och kollapsade sedan helt i exakt det fönster där rotorsaken redan
var identifierad (L599 tredje instansen, 2026-09-07) men INGEN läste
larm-ärendena.

**Den ärliga bedömningen, åt båda hållen:**

- **Att flytta tillbaka till PR-ytan** kostar exakt det ADR-077 mätte: en
  återinförd mutex-kö på VARJE PR (inte bara kod-PR:er om klassningen inte
  finslipas), en 25-minutersklass revert-blockering vid nästa docs-ändring,
  och — enligt mitt eget 211-körningssampel — 28 % av alla körningar skulle
  bli den nya, direkta merge-blockeraren i stället för en efterhandssignal.
- **Att stanna kvar där det är** kostar att en äkta regression (t.ex.
  L599-klassens datakorruption, eller en riktig kodregression) kan nå
  `main` — och Vercel Production följer `main` — och stanna där **så länge
  ingen läser larmet**. Mätt: upp till 258 timmar i det värsta observerade
  fallet. Mekanismen (automatiskt `gh issue create` vid rött) fungerar
  perfekt; det är MÄNNISKO-/ORKESTRERINGSLAGRET ovanpå den som mätbart
  brast i elva dagar.
- **Täckningsluckan (13,5 %) är sannolikt ofarlig i sak** (det saknade trädet
  får sin kod indirekt verifierad av en näraliggande, senare, GRÖN körning på
  samma eller nyare kod) MEN ger en falsk känsla av fullständig täckning: en
  regression som INTRODUCERAS i det saknade trädet och sedan RÄTTAS i nästa
  träd inom samma fönster skulle aldrig synas som röd, eftersom ingen
  körning någonsin testade just det trädet.

Min bedömning: **avvägningen "bara efter landning" är fortsatt rimlig för
VÄGGKLOCKAN**, men den vilar i dag på en larmkedja som är obevisad i
praktiken — automatiseringen finns, men det finns ingen mekanism som
tvingar fram en respons, bara en förhoppning om att någon läser GitHub
Issues. Det är precis den typ av "tyst hål bakom en grön fasad" ADR-077 § 3
själv varnar för när den motiverar nattnätet.

## Samtidighetsmatrisen

| Par | Kan de krocka? | Vad skyddar (mekanism, inte prosa) |
|---|---|---|
| Post-merge ∥ Nightly | Ja, om de överlappar i tid | Global jobb-nivå `concurrency: group: staging-tests, queue: max` i `ci-suite.yml` — köar, avbryter inte |
| Två post-merge-körningar tätt efter varandra | Delvis — VARJE körning FÅR ett eget workflow-run (`post-merge-${{ github.sha }}` är per-SHA, `cancel-in-progress: false`), men se § 8.4.9: en icke-trivial andel commits (13,5 % mätt) fick aldrig ett eget run alls | Workflow-nivå per-SHA-grupp (skyddar mot att en körning TAR ÖVER en annans plats); den delade `staging-tests`-mutexen serialiserar de som faktiskt körs |
| Lokal körning (utvecklare/agent) ∥ CI | Ja, samma delade bas | `scripts/staging-semaphore.sh preflight` — frågar GitHubs run-API om `post-merge.yml`/`nightly.yml` har ett staging-rörande jobb aktivt; fäller lokalt (exit 76) om ja. Tyst under `GITHUB_ACTIONS` (CI ser sin egen serialisering). Wirad i BÅDA Playwright-ytorna (`api-setup`/`setup`-projekten) och Node-skriptens `main()` — grindad av `scripts/check-staging-preflight-wiring.mjs`, som körs i `ci.yml` |
| Flera worktree-agenter samtidigt (samma maskin) | Ja | Ett `mkdir`-atomiskt fillås i `/tmp/mm-staging-semaphore.lock` (maskinbrett, delas av alla worktrees på samma dator) serialiserar LOKALA pipelines mot varandra, utöver GitHub-preflighten ovan |
| `seed:review`-fixturer ∥ staging-tester | Nej i normalfallet | Egen `--ort`-namnrymd + livstidsstämpel + `.purge-staging-policy.json`-undantag; korsläst mot purge-policyn i `seed-review-fixture.mjs:main()` |
| Manuell `workflow_dispatch` | Ja, samma mutex | Samma `staging-tests`-grupp som alla andra anrop — ingen särbehandling |
| **Delad FÄLTVÄRDE-mutation på en permanent, aldrig-raderad rad** | **Ja — bevisad tre gånger (L599)** | **Ingen.** Purgen känner bara till HELA rader (sentinel-prefix, ägar-manifest); ett fält som muteras och vars återställning avbryts har inget skyddsräcke alls |
| Demoläget (ADR-132) ∥ staging-tester | Starkt indikerad risk, ej mätt i detta pass | Demofixturen är namngiven för att falla UTANFÖR varje purge-target (riktig ort, `@example.com`) — men den delar samma bas, samma Supabase-projekt och samma rate-limit-budget som testsviten |

## Paritetstabellen — staging mot produktion

| Tjänst | Riktig eller ersättning? | Läge | Källa |
|---|---|---|---|
| Autentisering | **Riktig** Supabase Auth (GoTrue), riktiga persistenta test-konton (`TEST_USER_EMAIL/PASSWORD`, `TEST_ADMIN_EMAIL/PASSWORD`) | Verifierad | `tests/api/auth.setup.ts` (`loginUser` mot riktig `/token`-endpoint) |
| Postgres | **Riktig**, dedikerat staging-projekt (ADR-050) | Verifierad | ADR-050 beslut 1 |
| Airtable | **Riktig**, dedikerad duplicerad bas, IDENTISKA tabell-/fält-ID:n som prod för delade ytor | Starkt indikerad (schema-diff 5 veckor gammal, ej omkörd) | `prodbas-synk-staging-till-prod-2026-08-11.md` |
| Edge Functions | **Riktiga**, men **manuellt deployade** — kan avvika tyst från testad commit | Verifierad (deploy-mekanism); osäker (faktisk drift-grad) | `prod-driftsattning-runbook.md`, ADR-050 § Fas 7-skuld |
| Mail (Resend) | **Riktig tjänst**, hård adress-allowlist (`RESEND_TEST_ADDRESSES`, 4 adresser) — allt annat ger 422 `non_prod_address_refused` | Verifierad | `supabase/functions/_shared/send-bulk.ts:19-24,129-137` |
| PDF (DocRaptor/Prince) | **Riktig tjänst, leverantörens EGET testläge** (`test: true`, vattenstämplad, ingen kvotkostnad) — `const test = ENVIRONMENT !== 'production'` | Verifierad | `supabase/functions/jobb-konsument/index.ts:421` |
| Frontend | **Källkoden ÄR exakt testad commit**, men artefakten är Vite **dev**-server, inte produktionsbygget Vercel serverar | Verifierad | `playwright.config.ts` `webServer`-block (`npm run dev`) |

## Vad jag inte kunde belägga

1. **Om en dedikerad CI-wired testsvit för `purge-staging-sentinels.mjs`s
   egen logik finns.** Jag läste skriptet och dess exporterade funktioner
   (byggda för testbarhet — `export function` genomgående) men verifierade
   inte om en `scripts/test-purge-staging-sentinels.mjs` faktiskt körs i
   `ci.yml`. Kräver: `grep -rn "purge-staging-sentinels" .github/workflows/
   ci.yml` + filens existens.
2. **Vilken av de två förklaringarna för täckningsluckan som är korrekt**
   (push-event-sammanslagning kontra merge-queue-batchning som ger EN
   `github.sha` för flera landade commits). Kräver: en riktad läsning av
   GitHub Actions egen changelog/community-diskussion om `push`-triggerns
   beteende vid snabbt upprepade pushar till samma ref, ELLER en levande
   observation av en merge-queue-batch (`max_entries_to_merge` > 1) i
   ögonblicket den händer.
3. **Om ALLA 16 av de 16 stängda-2026-09-17-ärendena delar EXAKT samma
   rotorsak (L599).** Jag verifierade rotorsaken explicit för `#2447` (via
   dess egen kommentar) och de tidsmässigt sammanhängande körningarna
   (14+2 = 16 röda post-merge-körningar i två vågor 2026-09-06/07), men läste
   inte samtliga 16 ärendens individuella kommentarer.
4. **Huruvida `prodbas-synk-staging-till-prod-2026-08-11.md`s schema-diff
   fortfarande stämmer.** Fem veckor gammal, och basen är enligt ADR-063
   under aktiv, kontinuerlig utveckling ("maxas KONTINUERLIGT"). Kräver
   skriv-scope (`AIRTABLE_SCHEMA_TOKEN`) jag saknar i detta pass, eller en
   ny read-only meta-API-körning mot båda baserna.
5. **Faktisk drift-grad mellan deployad staging-EF-kod och testad commit.**
   Jag visade att MEKANISMEN (manuell deploy, ingen CI-koppling) skapar
   RISKEN, men mätte inte hur ofta staging-EF:er faktiskt ligger EFTER
   `main` i praktiken idag — motsvarande den typ av mätning CLAUDE.md
   efterlyser för prod ("mät artefakten, härled den inte").
6. **Om demoläget (ADR-132) faktiskt har kolliderat med staging-testsviten
   i praktiken.** Beslutet är tre veckor gammalt (2026-09-06); jag hittade
   ingen post-merge-körning eller lessons-post som pekar på en konkret
   demo↔test-kollision, men har heller inte sökt riktat efter en.

## Risker

- **Öppen, obyggd lucka i datakonsistens (L599-klassen).** Detta är den
  enskilt starkaste risken i hela underlaget: en delad, aldrig-raderad
  fixturrad har MUTERBARA fält utan skyddsräcke, och mekanismen för att
  förstöra den (en avbruten körning mellan mutation och `finally`-återställning)
  är strukturell — den kommer att hända igen tills motmedel (a) byggs.
- **Larmkedjan är obevisad som operativ mekanism.** Automatiseringen (skapa
  ärende vid rött) fungerar. Det finns ingen mekanism som säkerställer att
  NÅGON läser det — 11 dygns tystnad är mätt, inte en värsta-tänkbara
  gissning.
- **Manuell EF-deploy till staging är en tyst, omätt risk** för exakt den
  paritet hela testsviten finns för att bevisa: om testad kod och deployad
  kod diverergar syns det ingenstans förrän ett test beter sig oväntat.
- **Demoläget lägger till en ny, permanent samtidig hyresgäst** i en redan
  trång delad miljö, utan att denna gransknings tidsfönster täcker om det
  stör testsviten i praktiken.

## Rekommendationer

**(Markerade som rekommendationer — inte beslut. Marcus/orkestreraren äger
prioriteringen.)**

1. **Bygg L599:s motmedel (a) — sentinel-städ av MUTERBARA FÄLT i
   setup-purgen, inte bara hela rader.** Detta är den enskilt mest
   kostnadseffektiva åtgärden i hela underlaget: tre bevisade instanser, ett
   redan skrivet designförslag i lessons-posten, och en känd, avgränsad
   kodyta (`.purge-staging-policy.json` + `purge-staging-sentinels.mjs`).
2. **Ge post-merge-larmet en mekanisk eskaleringsväg, inte bara ett
   GitHub-ärende.** Samma princip som `heartbeat-svep.sh` redan etablerat
   för merge-kön (level-triggered, inte bara vid övergången) — ett rött
   post-merge-larm som står obesvarat > N timmar borde synas i SAMMA svep,
   inte kräva att någon råkar öppna Issues-fliken.
3. **Kvantifiera täckningsluckans MEKANISM innan den åtgärdas.** Skilj
   push-event-sammanslagning från merge-queue-batchning empiriskt (t.ex.
   genom att observera nästa tillfälle `max_entries_to_merge` > 1 träffar)
   — de två har olika åtgärder (den ena kräver en `merge_group`-medveten
   post-merge-trigger, den andra kräver ingenting eftersom batchens sista
   commit redan bär alla föregåendes innehåll).
4. **Mät faktisk EF-deploy-drift på staging**, samma disciplin CLAUDE.md
   redan kräver för prod (`functions list` mot `updated_at`, jämfört med
   `main`s senaste ändring av samma funktion).
5. **TASK-365 bör omprioriteras uppåt.** Kortet identifierar redan exakt
   den kärnfråga denna granskning ställde ("håller avvägningen?") och
   innehåller redan tre konkreta åtgärdsformer att pröva — det behöver inte
   omdesignas, det behöver köras.

## Källor

**Kod (läst på disk i denna worktree, `main` @ `eeca8c72`):**

- `.github/workflows/ci-suite.yml` (976 rader — `purge`, `test-fast`,
  `acceptance`, `webblasarbeteende`, `a11y`, `test-staging`, `purge-efter`)
- `.github/workflows/post-merge.yml` (554 rader — koncurrency, `klassning`,
  `suite`)
- `.github/workflows/nightly.yml` (koncurrency-grupp `nightly`)
- `scripts/purge-staging-sentinels.mjs` (1 142 rader, hela filen läst)
- `.purge-staging-policy.json`, `.staging-semaphore-policy.conf`,
  `.staging-preflight-hook-policy.conf`
- `playwright.config.ts` (projektdefinitioner, `webServer`-block,
  dependencies)
- `tests/api/auth.setup.ts`, `tests/api/get-person.staging.test.ts`
- `supabase/functions/_shared/send-bulk.ts`,
  `supabase/functions/jobb-konsument/index.ts`,
  `supabase/functions/_shared/mall-render.ts`
- `package.json` (script-definitioner)
- `CONTRIBUTING.md` § "Staging-preflighten", § "Efter-körning-purgen"

**ADR:er:**

- `docs/decisions/ADR-050-isolerad-staging-miljo.md`
- `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md`
  (inkl. § Updates 2026-08-28, TASK-334)
- `docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md`
- `docs/decisions/ADR-132-demolaget-staging-som-maskinrum-bakom-dorr-i-prod-appen.md`
- `docs/decisions/ADR-060-sentinel-setup-purge-create-conformance.md`

**Tidigare research (S91, 2026-07-26/27):**

- `docs/research/merge-queue-mot-staging-mutex-2026-07-26.md`
- `docs/research/parallell-e2e-mot-delad-backend-2026-07-26.md`
- `docs/research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`
- `docs/research/staging-fixturinventering-2026-08-10.md`
- `docs/research/prodbas-synk-staging-till-prod-2026-08-11.md`

**Backlog och lessons:**

- `backlog/tasks/task-365 - Post-merge-verifieringen-kan-aldrig-fånga-en-kod-landning...md`
- `tasks/lessons/vol-08.md` § L599

**Levande mätningar (2026-09-17, `gh` mot `high-five-group/miranon-media-admin`):**

- `gh api repos/high-five-group/miranon-media-admin/commits/main` — bekräftar
  `main` fryst på `eeca8c72` sedan 2026-09-08
- `gh run list --workflow post-merge.yml` (211 körningar,
  2026-08-31–2026-09-08): 152 success / 21 failure / 38 cancelled;
  samtliga 59 icke-gröna i jobbet `Staging (API + E2E)`
- `gh run view <id> --json jobs` mot samtliga 21 misslyckade + samtliga 38
  avbrutna körningar
- `gh issue list --label ci-post-merge --state all --limit 60` (60 ärenden,
  samtliga stängda; tid-till-stängning per skapelsedatum-grupp)
- `gh issue view 2447` (rotorsaks-kommentar, L599 tredje instansen)
- `git log origin/main --first-parent` (230 landade träd i samma fönster)
  jämfört mot post-merge-körningarnas `headSha` (31 träd utan täckning)
