---
owner: marcus803
updated: 2026-09-19
review_by: 2027-02-08
status: stable
---

# Bidrag

> **Äger:** landnings-ordningen, DoD-disciplinens exakta kommandon och
> arbetsformens sessions-/push-disciplin (`ADR-097`). **Kartlägger:**
> `ADR-036` (kvalitetsgrindens beslut), `ADR-076` (merge queue-arkitekturen),
> `ADR-097` (arbetsformens tillståndsbärare) — sak-besluten lever i
> ADR:erna, detta dok operationaliserar dem till konkreta steg. **Vid
> konflikt vinner:** den ADR ett avsnitt pekar till för sitt sak-beslut; CI:s
> faktiska utfall (ADR-100 §1 domän 3) vinner alltid över detta doks
> beskrivning av vad som "borde" hända.

Detta är ett privat projekt med en tydlig roll-fördelning mellan två aktörer.

## Aktörer

| Aktör | Roll | Verktyg |
|---|---|---|
| **Marcus** | Projektägare, beslut, kvalitetsbärare | terminal (Code) + claude.ai (läsyta) |
| **Claude Code** | Planering, arkitektur, implementation, git, filhantering, verifiering | Terminal (`claude` CLI) |

Hub-and-spoke-system: globala principer i `~/Repon/marcus-system/CLAUDE.md`,
projekt-specifika i detta repos `CLAUDE.md`. Universella lärdomar märkta
`[UNIVERSAL]` flödar från spoke till hub.

## Sessions-disciplin

Sessioner körs enligt mönstret etablerat i `marcus-system/CLAUDE.md`:
LÄS → RAPPORTERA → PLANERA → IMPLEMENTERA → VERIFIERA → DOKUMENTERA + COMMITTA → EFTER

Varje session äger ett sessionsdokument i `tasks/sessions/`.

- **Code skapar skelett** vid sessionsstart (dok-födelse, ADR-043)
- **Code bakar in retrospektiv** vid sessionsavslut (sista K)
- **Code rör inte sessionsdokumentet för full retrospektiv** mellan K (P3a-mönstret, etablerat 2026-05-05) — bara korta statusrader vid K-fas-avslut
- Mellan-klungor använder **inline-källor**, aldrig "se sessionsdok Del N" som källa under körning

## Transcript-disciplin

Transcriptet är sanningskällan vid sessionsavslut, inte LLM-minne. På Code-körda
sessioner refereras sessionens transcript-JSONL in-place
(`~/.claude/projects/<projekt-slug>/`) — ingen kopia till repot; sessionsdok,
BUILD-LOG och lessons är de durabla artefakterna (ADR-069; Session 58). Källa:
`marcus-system`-pluginets session-end-skill, "Transcript-disciplin".

## Testkörning — kanoniska former (Playwright)

**VARNING: plain `npx playwright test` är en icke-stödd körform.** Den kör
alla projekt parallellt: `api-staging` och `chromium-authenticated` saknar
inbördes ordning och delar staging-data — e2e-flödena (`mark-paid`,
`event-add-registration` m.fl.) skriver mot samma poster som api-testernas
idempotens-/409-/ordnings-assertions läser. Utfallet är 6 deterministiska
kollisioner (create-registration 89/129/160, get-registrations väg D 86/132,
update-record 92) — felklassa dem INTE som regressioner (TASK-6). Kör de
kanoniska kommandona separat:

| Kommando | Svit |
|---|---|
| `npm run test:api` | API-tester pure + staging (serverfritt) |
| `npm run test:api:pure` | Enbart pure-API |
| `npm run test:api:staging` | Enbart staging-API (CI-formen) |
| `npm run test:e2e:staging` | E2E mot staging (kräver ledig port 5173) |
| `npm run test:acceptance` | Acceptance-klassen: hermetiskt mot fixturvärlden (egen dev-server på port 5399) — se § Acceptance-klassen |
| `npm run test:webblasarbeteende` | Webbläsarbeteende-klassen: fixturfritt, noll nätverksanrop (egen dev-server på port 5499) — se § Webbläsarbeteende-klassen |
| `npm run test:a11y` | Axe-runner (egen dev-server på port 5199) |
| `npm run test:visual` | Visuella regressionstester |
| `npm run vakt:kontrakt` | Kontraktsvakten: fixturvärlden mot skarp staging (nattlig i CI, körbar lokalt med `.env.test` — se § Nattnätet) |
| `npm run test:preview:staging` | Byggt staging-bygge på preview-porten 4173: bygge → bundelgrind → login/Hem-bevis (TASK-10) |
| `npm run purge:staging` | Sentinel-purge av staging-basen (setup-purge, ADR-060) — kräver `.env.seed`; `-- --dry-run` för plan utan radering. Städar TRE klasser: Airtable-sentineler, Storage-objekt under `utkast`, och sedan `TASK-346.3` Postgres-testrader i betalningsdomänen (`ZZ-TASK-346…`, via `purga_testrader`) |
| `npm run seed:review` | Granskningsfixtur i staging: kommande event + bekräftade/obekräftade anmälningar för design-review — kräver `.env.seed`; `-- --dry-run` för plan utan skrivning |
| `npm run seed:review:clean` | Raderar granskningsfixturen igen (samma guards, samma `--dry-run`) |

Lokal browser-verifiering/QA mot staging via byggt bygge har sex kända
fällor (fel-mode-bundle, CORS-blockerad port, saknade test-env-vars,
stale node_modules efter merge, service worker på dev-originet,
localStorage-persistad query-cache) — recept
och sanering i
[`docs/reference/staging-verifiering-runbook.md`](docs/reference/staging-verifiering-runbook.md).

Not: samma 6 fall blir röda även av en helt annan orsak — saknad
`TEST_REGISTRATION_RECORD_ID` i den lokala miljön (felmeddelandet säger det
explicit och pekar på `.env.test.example`, som bär raden sedan TASK-11/12;
seed-ankaret är dokumenterat i `docs/BUILD-LOG.md`, sök på variabelnamnet).
Skilj symptomen åt innan felklassning.

**Sentinel-städning (ADR-060, wirad via TASK-16):** create-conformance-
testerna lämnar markör-märkta rader i staging-basen. Markörerna är åtta:
`create-test+` … `@staging.test` i Anmälningars e-postfält,
`ZZ-create-event-test` i Eventplaneringens `Ort`, `ZZ-note-test+` …
`@sentinel` i Anteckningar, `app-segment-test+` i Segment,
`ZZ-attachment-test-` i Bilagors `Namn` (TASK-146.4), `Bekräftelsebilaga –`/
`Deltagarinformation –` tillsammans med `ZZ-dokumentunderlag-fixtur` i Bilagors
`Namn` (TASK-146.5, bytt fixtur i TASK-309.4 — attach-målet är den PERMANENTA
DOKUMENTUNDERLAG_EVENT_ID-fixturen, se `tests/api/fixtures.ts`, inte en egen
engångsfixtur), `ZZ-TASK-309.3-` i TRE tabeller (Eventplaneringens `Ort`,
Platsers `Namn`, Agendapunkters `Text` — bilagornas skrivvägar, TASK-309.3),
och `ZZ-TASK-309.7-` i Platsers `Namn` (Mer-sidans Platser-yta, TASK-309.7 —
EGEN sentinel-klass skild från 309.3:s: dessa rader föds via
`save-place-standard`s event-lösa läge, utan något throwaway-event i sikte).
Till dem kommer `ZZ-create-event-test-uppdaterad` i Eventplaneringens `Ort`
(TASK-309.15) — den ort `update-event.staging.test.ts` döper om sitt
sentinel-event till mitt i testet och återställer i `finally`. Faller den
återställningen (kraschad körning, avbrutet CI-jobb) matchar raden ingen av de
övriga targets och blir opurgbar för alltid; mätt 2026-08-24 låg två sådana
rader kvar i 26,9 respektive 32,3 dygn.

Och `ZZ-plats-` i Eventplaneringens `Ort` (TASK-309.30) — de event
`create-event.staging.test.ts` skapar för att bevisa Ort-till-Plats-
härledningen. Deras `Ort` MÅSTE vara exakt ett platsnamn (uppslaget matchar
`Platser.Namn` = `Ort`) och kan därför inte bära `ZZ-create-event-test`.
De TVÅ Platser-raderna fixturen vilar på (`ZZ-plats-unik-fixtur` och den
avsiktliga dubbletten `ZZ-plats-dubblett-fixtur`, seedade via Airtable-MCP)
är PERMANENTA och matchar MEDVETET ingen purge-target — dubbletten går inte
att återskapa via någon EF (`save-place-standard` är find-or-create by
`Namn`), så en purgead fixtur hade tyst gjort flera-träffar-grenen oprövbar.
Targeten städar alltså ENBART Eventplanering-raderna, och `Plats` står i dess
`linkGuardExcludeFields` eftersom länken är just det testet bevisar.

Och `ZZ-attachment-filename-test-` i Bilagors `Namn` (TASK-309.22) —
`upload-attachment-ascii-safety.staging.test.ts`s EGEN sentinel-klass, skild
från `ZZ-attachment-test-` ovan eftersom den targetens exakt-mönster bara
tillåter ett UUID-only-suffix och därför inte kan bära det rapporterade
bugg-filnamnet (`2025-HörlurarMiranonMedia.pdf`) som testet medvetet laddar
upp. Städas via ägar-manifestet (`tests/support/kastbara-poster.ts`,
ADR-060 punkt 3), inte setup-purgen — testet självstädar redan i sitt eget
`finally`-block, manifestet är ett säkerhetsnät för en kraschad körning.

Och Resends KANONISKA testadress `delivered@resend.dev` (RESEND_TEST_ADDRESSES,
`_shared/send-bulk.ts`) i Anmälningars `E-post` (TASK-465, granskning runda 1
FYND 2) — `send-action-email-gemensam-bilaga.staging.test.ts`s (TASK-452) EGEN
sentinel-klass. Adressen matchar VARKEN `create-registration-sentineler`s
`create-test+…@staging.test`-formel eller dess exakt-mönster, så en EGEN, smal
exakt-literal-target (`send-action-email-gemensam-bilaga-registration-sentineler`)
krävs vid sidan av ägar-manifestet — utan den fetchar filterByFormula raden
aldrig server-side, och registrering i manifestet ensamt räcker inte.

Uppräkningen hålls komplett mot `.purge-staging-policy.json` av
`scripts/check-listparitet.sh` (paret `sentinel-markorer`) — den stod med
två av fyra tills den grinden byggdes. CI städar dem automatiskt i jobbet **Staging sentinel
purge** FÖRE Test + Build (setup-purge, ADR-060 punkt 3–4; separat jobb med
egen least-privilege-token scopad till enbart staging-basen — test-env bär
ALDRIG Airtable-cred, EF-only-gränsen). Lokalt: `npm run purge:staging`
(token i gitignorade `.env.seed`, se `.env.seed.example`). Endast sentineler
äldre än 60 min rörs (skydd för pågående körningar); alla värden bor i
`.purge-staging-policy.json`, guard-testerna i
`scripts/test-purge-staging-sentinels.mjs`.

**Granskningsfixturer får ALDRIG matcha purge-mönstren** — då raderas
Marcus granskningsdata mitt under granskningen. `npm run seed:review`
(`scripts/seed-review-fixture.mjs`) skapar sådan data med markörer utanför
purgens räckvidd och korsläser dem mot `.purge-staging-policy.json` före
varje körning, så vakten inte kan drifta ifrån den purge som faktiskt körs.
Recept, parametrar och de fyra fällorna: runbookens § Granskningsfixtur.

CI drabbas aldrig av kollisionen — den kör staging-projekten som separata
sekventiella steg (`.github/workflows/ci-suite.yml` `test-staging`; Test+Build
splittades S77 i `test-fast`/`a11y`/`test-staging` där ENDAST
`test-staging` bär staging-mutexen); samma
kollisionsklass hanteras mellan CI-runs av `concurrency: staging-tests` och
mellan parallella lokala pipelines av staging-semaforen
([ADR-073](docs/decisions/ADR-073-parallella-batch-pipelines.md) beslut 3+4).
Serialisering via projekt-dependencies i `playwright.config.ts` förkastades:
`--project`-anrop drar in dependencies transitivt, vilket hade svällt CI:s
e2e-stegs testmängd (bevisat 148 → 259 tester) och fällt steget på saknade
admin-secrets — TASK-6-kortets notes bär hela beviskedjan.

### Efter-körning-purgen — den första försvarslinjen (`TASK-309.15`)

Setup-purgen ovan städar FÖRE varje staging-jobb och kan därför strukturellt
inte städa fönstret MELLAN en körning och nästa staging-jobb. De kastbara
eventen bär framtida `startdatum` och är alltså KOMMANDE event — de dyker upp i
appens eventväljare under hela det fönstret. **Mätt 2026-08-24: 151
kvarliggande ZZ-event i staging, samtliga yngre än 2,4 h** (setup-purgen hade
alltså kört — fönstret är formen, inte ett fel i purgen). Marcus valde ett av
dem vid en granskning och fick en genereringsvy där varje block var tomt, vilket
läste som ett designfel i vyn.

Branschpraxis för integrationstester mot en delad databas är setup-purge
KOMBINERAD med teardown, och det är vad repot kör:

| Linje | Vad | När |
|---|---|---|
| 1 | **Efter-körning-purge** — raderar exakt de rader körningen själv skapade | direkt efter varje staging-körning |
| 2 | **Setup-purge** (oförändrad) — raderar allt sentinel-märkt äldre än 60 min | före varje staging-jobb |

Mekaniken: varje staging-svit som skapar en kastbar Airtable-rad registrerar
dess record-ID i ett **ägar-manifest** (`tests/support/kastbara-poster.ts`,
JSONL i `.kastbara/poster.jsonl` — utanför `test-results/`, som Playwright
rensar vid varje körningsstart). Manifestet bärs över till en Airtable-creddad
kodväg SKILD från testet (ADR-060 punkt 4 verbatim): CI-jobbet **Staging
sentinel purge (efter körning)** i `ci-suite.yml`, `if: always()` så att även en
röd eller avbruten körning städas. Lokalt: `npm run purge:staging:efter`.

Att sviten inte städar själv är inget förbiseende — den KAN inte. Testet får
aldrig en Airtable-token (ADR-060 punkt 2, EF-only-gränsen) och det finns ingen
delete-EF för event. Manifestet bär kunskapen dit credentialen redan finns.

Ålders-guarden är **ersatt, inte borttagen**, i efter-körning-läget: snittet mot
manifestet är ett starkare ägarskapsbevis än åldern, och en samtidig lokal
körnings rader kan per konstruktion aldrig hamna i CI:s manifest. Bas-guard,
`filterByFormula`, exakt markör-match och länk-guard körs oförändrat via samma
`planPurge`.

Läget bär dessutom en **luckdetektion**: en ägd post som finns kvar i basen men
som ingen target gör anspråk på fäller jobbet (exit 2). Det är exakt den lucka
som lät de två `ZZ-create-event-test-uppdaterad`-raderna ligga i en månad.

### Staging-preflighten — lokala körningar frågar CI först (`TASK-77`, `TASK-84`)

De två mutexarna ovan bevakar var sin sida och såg länge inte varandra.
`concurrency: staging-tests` serialiserar CI-run mot CI-run och binder
ingenting lokalt; staging-semaforens fillås serialiserar lokala pipelines mot
varandra och binder ingenting i CI. Mellan dem gick ett hål rakt igenom: en
lokal `npm run test:api:staging` kunde stå i samma Airtable-bas som ett
CI-jobb, eftersom staging är EN delad bas (`airtable-constraints.md` P26/P27 —
per-run-isolering är en plattformsvägg, inte ett designval här).

Hålet var inte teoretiskt. `TASK-70.3`:s bygg-agent gick i det TVÅ gånger under
ett och samma pass — andra gången efter att själv ha flaggat det första. En
regel som inte efterlevs av den som känner till den behöver en mekanism, samma
slutsatsform som gjorde landnings-ordningen till en merge queue.

**Mekanismen:** `scripts/staging-semaphore.sh preflight <ägare>` frågar
GitHubs körnings-API om ett staging-rörande jobb är igång eller köat, och
fäller med exit 76 om svaret är ja. Den är tyst under `GITHUB_ACTIONS` — CI
äger redan sin egen serialisering, och en preflight där hade sett CI:s eget
jobb som hållare. Det sista är skarpast för `purge:staging`, som SJÄLVT är
CI-jobbet `Staging sentinel purge`.

**Var haken sitter, per yta.** Samtliga staging-rörande vägar bär den. Fram
till `TASK-84` gjorde tre av dem inte det, vilket är den klass som gör partiell
täckning farlig: en mekanism som täcker de flesta vägar läses som att den
täcker alla.

| Yta | Hake |
|---|---|
| `test:api:staging` + `vakt:kontrakt` | setup-projektet `api-setup` (`tests/api/auth.setup.ts`) |
| `test:e2e:staging` | setup-projektet `setup` (`tests/e2e/auth.setup.ts`) |
| `test:preview:staging` | setup-projektet `preview-setup` (`tests/preview/preflight.setup.ts`) |
| `purge:staging` + `purge:staging:efter` | `main()` i `scripts/purge-staging-sentinels.mjs` |
| `seed:review` + `seed:review:clean` | `main()` i `scripts/seed-review-fixture.mjs` |

Haken sitter i KODVÄGEN, aldrig i kommandonamnet. Playwright-ytorna bär den via
projekt-dependencies, vilket täcker även rå
`npx playwright test --project=api-staging`; Node-ytorna bär den i `main()`,
vilket täcker även rå `node scripts/purge-staging-sentinels.mjs` — den form CI
självt använder. Ett `&&`-prefix i `package.json` hade gått bredvid båda.
Node-ytorna avslutar med semaforens EGEN exit-kod (76 eller 77) i stället för
skriptens `1`, som redan betyder guard-fel.

Node-sidans hake bor i `scripts/lib/staging-preflight.mjs` och
Playwright-sidans i `tests/support/staging-preflight.ts`. Ingen av dem
implementerar logiken: båda anropar samma `staging-semaphore.sh preflight`, som
förblir enda sanningskällan för vad "staging är upptaget" betyder.

Vilka workflows och jobbnamn som räknas bor i
`.staging-semaphore-policy.conf`; testsviten är
`scripts/test-staging-semaphore.sh`. Sonden svarar aldrig med gissning:
misslyckas anropet blir det exit 77, inte grönt ljus.

**Att tabellen ovan fortfarande stämmer är grindat** (`TASK-91`).
`scripts/check-staging-preflight-wiring.mjs` prövar att haken faktiskt sitter
kvar på alla fem ytorna, och körs av `ci.yml`-jobbet `Lint + TypeCheck` (hette
`Lint + Audit + TypeCheck` fram till `TASK-395`, 2026-09-04, då audit-ci flyttade
till det egna jobbet `Audit dependencies (audit-ci)`).
Playwright-ytorna prövas mot Playwrights EGEN dependency-upplösning
(`--list`), inte mot en regex över configen; Node-ytorna mot att anropet ligger
i `main()`. Vad som räknas som yta — och vilka projekt som är undantagna, med
skäl — bor i `.staging-preflight-wiring-policy.json`; ett nytt Playwright-projekt
eller ett nytt `scripts/`-skript som rör staging fäller vakten tills det
klassats. Tvåsidigt bevis per yta:
`scripts/test-check-staging-preflight-wiring.mjs`.

**Samma anrop kör numera ÄVEN i `.githooks/pre-commit`** (T119 (d) item 4,
S97). CI-jobbet var den enda bäraren tidigare — vakten fällde alltså alltid
EFTER push och kö-inträde, när kostnaden att rätta är som störst (bevisat två
gånger: `TASK-131`, PR #651, CI-run `30814438519`, och `TASK-126.4`, merge
`9747a52f` — båda äkta, deterministiska fynd om ett oklassat
Playwright-projekt). Pre-commit-anropet är VILLKORAT — det kör bara när en
staged ändring rör den yta vakten faktiskt sveper (`playwright.config.ts`,
`.staging-preflight-wiring-policy.json`, `scripts/`, `tests/`; config i
`.staging-preflight-hook-policy.conf`) — och skiljer exit 1 (äkta fynd,
STOPPAR commiten) från exit 64 (vakten kunde inte svara — policy-/miljöfel
eller en olöst G0-transient, se nedan — VARNAR men stoppar inte). CI-anropet
är kvar oförändrat: pre-commit kan kringgås med `--no-verify`, CI kan inte.

Skälet att just detta grindas, trots att felet aldrig inträffat: **frånvaron
syns inte.** Tappas en anropsrad märks det först vid en kollision — och ser då
ut som ett slumpmässigt staging-fel, inte som en saknad mekanism. Vakten prövar
ATT wiringen finns; att semaforen FUNGERAR är en annan fråga, besvarad av de 19
fallen i `scripts/test-staging-semaphore.sh`.

**Vägen förbi är ett aktivt val, aldrig default:**

```bash
MM_STAGING_PREFLIGHT=off npm run test:api:staging
```

Använd den när du vet vad du gör — t.ex. när `gh` saknas på maskinen, eller när
CI-jobbet bevisligen rör en annan yta än din körning. Valet skrivs ut i loggen
med flit, så att en kollision i efterhand går att härleda till valet i stället
för till mekanismen.

Flaggan gäller hela tabellen ovan — den läses av semaforen själv, inte av
någon av anroparna, så alla fem ytorna svarar likadant på den.

**Vad en fällning INTE sparar.** `test:preview:staging` bygger och grindar
bundeln innan Playwright ens startar, så en fällning där kommer efter det
lokala bygget. Den sparar det som räknas — noll begäran mot staging — men inte
byggtiden. Att flytta haken före bygget hade krävt just det prefix i
`package.json` som går bredvid rå `--project`-anrop.

**Den ärliga gränsen: preflighten är en kontroll vid START, inte ett hållet
lås.** Startar din lokala körning när CI är tyst, och en landning drar igång
post-merge-lagret en minut senare, kolliderar de ändå — preflighten har redan
sagt sitt. Formen krymper fönstret kraftigt (från "hela körningen" till "det
som hinner starta efter din start"), men stänger det inte. Ett verkligt lås
över CI/lokal-gränsen kräver en gemensam sanningskälla utanför både GitHub
Actions och maskinen, vilket är ett större arkitektur-val och inte fattat här.
Vill du ha noll fönster: vänta ut den pågående landningen innan du startar.

## Definition of Done — per session

- [ ] `npm run test:api` grön (eller motsvarande relevant test-svit)
- [ ] `npm run typecheck` 0 fel
- [ ] `npx @biomejs/biome check .` 0 fel
- [ ] `npm run build` grön
- [ ] CI grön **per jobb** på pushad commit — verifieras med `bash scripts/ci-wait.sh --commit "$(git rev-parse HEAD)"` (topp-nivåns `conclusion` är inte beviset; skippade jobb blockerar inte men bevisar ingenting, L322). Efter push: använd det lokala SHA:t, inte `--pr` — GitHubs PR-API kan returnera föregående head i sekunderna efter push. **Exit 4 = superseddad** (körningen avbröts och har en efterträdare på samma gren, typiskt av `cancel-in-progress` vid ny push): utfallet är inaktuellt, inte rött — men det är inte heller ett grönt bevis, så följ efterträdaren som skriptet pekar ut och kräv grönt av den. **Exit 3 = anropsfel**, numera även "workflow-namn saknas": vakten väljer aldrig körning på egen hand utan tar namnet ur `.ci-wait-policy.conf` (`CI_WAIT_WORKFLOW`, här `CI`) eller ur `--workflow`. Fram till 2026-07-28 saknades den kvalificeringen och formen ovan var **inte säker** — `gh run list --limit 1` returnerar senaste körningen för commiten oavsett workflow, och repot kör tre per push (CI, CodeQL, Post-merge) där bara CI bär required-checken; mätt på commit `03d18888` följde vakten Post-merge och rapporterade grönt utan att ha sett CI. Formen är säker igen, men bara så länge policy-filen finns — vakten skriver alltid ut vilken workflow den följer, läs den raden. Endast exit 0 uppfyller denna punkt
- [ ] `docs/BUILD-LOG.md` uppdaterad med sessionens resultat (planerat vs faktiskt, avvikelser, verifieringsoutput)
- [ ] ADR skapad i `docs/decisions/` för varje arkitekturbeslut
- [ ] `tasks/lessons.md` uppdaterad (markera `[UNIVERSAL]` där tillämpligt; lyft till hub inom 7 dagar)
- [ ] Sessionens trådar synkade till `tasks/threads/` (uppfångade/deferrade/förkastade per ADR-053-triagen — registret + ev. tråd-kort)
- [ ] Om sessionen upptäckte en ny strukturell Airtable-vägg: förd till `docs/reference/airtable-constraints.md` + dess ändringslogg
- [ ] Om sessionen ändrade datamodellen (nytt/ändrat/borttaget fält, ändrad formel/rollup, ny/ändrad automation, ny option): förd till `docs/reference/data-model.md` + dess ändringslogg
- [ ] Om sessionen lade till/tog bort en Edge Function: förd till `docs/reference/airtable-interaction.md` §5.0 (namn/tabell/typ/en-rads-syfte, INGET fil:rad-citat — TASK-161.8 tunnade den delen medvetet) + dess ändringslogg. Om sessionen ändrade write-allowlisten (`field-allowlists.ts`): §7-tabellen där (fil:rad-belägg är OK i §7, den är fortsatt levande). §5-BILAGAN (mekanism-narrativ för de 12 ursprungliga EF:erna) är FRUSEN sedan TASK-161.8 — skriv inte ny fil:rad-narrativ dit.
- [ ] Om sessionen ändrade samarbets-systemets MEKANIK (ny/borttagen disciplin-skill, reviderad roll-arkitektur, ny governing-/distributions-mekanism, nytt lifecycle-verb): förd till hubbens `SYSTEMET.md` + dess ändringslogg. Tillstånds-ändringar (governing-listans antal, plugin-version, radnummer) triggar INTE uppdatering — doket pekar redan till källan för dem
- [ ] `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` uppdaterad om sessionen har implications för icke-tekniska läsare (per ADR-025)
- [ ] Commits pushade

## Definition of Done — per fas

Utöver per-session-DoD ovan, vid fas-avslut gäller också:

- [ ] `docs/byggplan.md` §2 fas-tabell uppdaterad — fas ✅ KLAR + datum + ev. estimat-summa-justering. Ny `v1.N`-rad i Versionshistorik.
- [ ] `README.md` Status-rad + Projektstatus-sektion + ADR-räkning + Scripts-tabell konsistent med repo-state.
- [ ] `CHANGELOG.md` ny release `[X.Y.0]` med Keep-a-Changelog-kategorier (Added/Changed/Security/Fixed) + compare-länkar.
- [ ] Sessionsdok arkiverad till `tasks/sessions/archive/<år>-<månad>/` via `git mv` + trail-link-uppdateringar atomiskt per Kandidat 1 (semantisk path-ref vs mekanisk prefix-fix-disciplin).
- [ ] UNIVERSAL-lessons hub-synkade till hubbens aktiva lessons-volym (`~/Repon/marcus-system/tasks/lessons/`; indexet `tasks/lessons.md` pekar ut den — ADR-085).
- [ ] Fas-avsluts-verifierings-rutin körd (se `CLAUDE.md` motsvarande sektion) — cross-doc-grep-check att alla 5 styrande + 3 publika dokument säger samma sak.

Detta är 11/10-disciplinens systemiska skydd mot drift mellan dokument (Kandidat 12-systematisk-tillämpning). Etablerad 2026-05-13 efter Fas 2-avslut exponerade systematisk blind fläck i per-session-checklistan.

## Pull Request-flöde

**Mekaniskt enforce:at sedan 2026-07-23** (ruleset `main-skydd`,
[ADR-076](docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)):
ALLT når `main` via PR — direktpush avvisas av GitHub. PR:n kan mergas
först när required-checken **"CI Passed or Skipped"** är grön på senaste
SHA med up-to-date branch; force-push och deletion av `main` är
blockerade. Bokförings-PR:er (docs/backlog/sessionsdok) landar via
auto-merge (`gh pr merge --auto`).

PR till `main` triggar CI (`.github/workflows/ci.yml`). Utöver den
mekaniska grinden gäller:

- Marcus har godkänt (kod-/UI-ändringar; design-review-grinden per L310 —
  ren bokföring auto-mergar på grön CI)
- DoD-checklistan i PR-mallen är fylld
- ADR refererad om arkitekturbeslut tagits

### Push-kadensen — commit är gratis, push kostar (`TASK-122`)

Kadensen **en commit per PR, och 7–11 PR:er per dag** är rätt, inte en
kompromiss —
[push-kadens-passet](docs/research/push-kadens-agent-arbetstrad-2026-07-26.md)
dömde den mot branschgolven: trunk-based sätter golvet vid minst en
integration per dygn, DORA-elit vid högst tre aktiva brancher, och det gängse
branch→flera-commits→sen-push-flödet är en LÄGRE integrationsfrekvens
(Fowlers *"semi-integration"*).

Regeln att hålla i är **separationen**: commit-frekvens är gratis (lokal
historik — committa så ofta du vill), medan push-frekvens kostar en full
CI-körning. **Inte** en plats i staging-mutexen — sedan A7:5 (`TASK-70.3`)
skickar `ci.yml`s `suite`-anrop `run_staging: false` VILLKORSLÖST (§
Landnings-ordningen ovan), så PR-ytan tar aldrig den globala
`staging-tests`-mutexen; den kontrollen flyttades till post-merge/natt.
Pusha därför när en arbetsenhet är landningsklar — inte per commit, och
inte som slut-dump efter en dags lokalt arbete.

### Landnings-ordningen — mekaniserad som merge queue sedan 2026-07-29

**Behöver du bara veta vad du ska göra: armera med `gh pr merge --auto`
och låt kön välja ordningen.** Resten av sektionen förklarar vilket problem kön
löser och vad som återstår för en människa; ingenting nedanför är en ordning du
själv ska välja.

**Läget som utlöste den gamla, upphävda regeln.** Tre villkor samtidigt:

1. **Två eller fler PR:er är landningsklara samtidigt** — eller den ena landar
   medan den andra redan ligger i luften.
2. **CI-tiderna är heterogena.** En docs-only-PR faller i klass `D0`
   ([ADR-077](docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md))
   och är klar på omkring en minut; en PR som rör kod bär hela
   `Acceptance (hermetisk)` och tar omkring sju. Storleksordningen är poängen,
   inte decimalen.

   **Kö-ledet är borta sedan `TASK-70.3`.** Fram till dess köade varje kod-PR
   dessutom bakom den globala `staging-tests`-mutexen, och det ledet — inte
   sviten — var det som gjorde spridningen oförutsägbar: två körningar med
   identiskt svit-innehåll gav 7,8 respektive 20,3 min, där hela skillnaden var
   väntan. Staging kör numera post-merge (§ Post-merge-lagret), så en PR-körnings
   längd beror bara på dess egen svit. Villkoret ovan håller ändå: `D0` mot kod
   är fortfarande en minut mot sju.
3. **Required-checken är `strict`** (up-to-date-kravet ovan) — varje merge till
   `main` gör varje annan öppen PR `BEHIND`.

Håller alla tre är `BEHIND` inte otur utan följdriktigt: den långsamma PR:en
förlorar racet mot varje snabb landning inom sitt svit-fönster, och
`gh pr update-branch` startar en ny svit som hinner bli omsprungen igen. `L328`
mätte tre sådana varv i S81 innan den parallella strömmen sinade.

**MEKANISERAD 2026-07-29 (`TASK-70.1`, A7:3) — den manuella sekvenseringen
nedan är UPPHÄVD.** `main-skydd` bär numera en `merge_queue`-regel. Kön bygger
varje post mot `main` plus posterna före den, alltså exakt den sekvensering
formerna A och B utförde för hand. **Armera med `gh pr merge --auto`
och sluta tänka på ordningen — strategiflaggan ska INTE anges, kön äger
strategin och `gh` avvisar formen med `! The merge strategy for main is set
by the merge queue`.**

**Strategiflaggan är BORTA ur formen sedan 2026-08-04 (S97).** Formen löd
tidigare `gh pr merge --auto --merge`. Mätt skarpt vid armeringen av `#705`:
`--auto` ensamt gav `EXIT=0` och korrekt `autoMergeRequest.mergeMethod: MERGE`
— den gamla formen med `--merge` avvisas nu i stället för att vara en
harmlös redundans.

**Exitkoden beror på PR:ens läge — meddelandet gör det inte.** Samma
avvisningstext (`! The merge strategy for main is set by the merge queue`)
gav `exit 1` när S97 mätte den vid armering av en OARMERAD PR (2026-08-04,
`#705`-passet). Mätt om 2026-08-05 mot en REDAN ARMERAD PR (`#796`): samma
avvisningstext, men **exit 0**, och den befintliga armeringen lämnades orörd
(`enabledAt` oförändrad). Båda mätningarna står, och skillnaden är operativt
viktig: **läs texten, inte bara exitkoden** — ett skript som bara kollar `$?`
ser formen som lyckad i det ena fallet och misslyckad i det andra, fast den
är fel i båda.

Kö-parametrarna, med skälen:

| Parameter | Värde | Varför |
|---|---|---|
| `merge_method` | `MERGE` | måste matcha rulesetets `allowed_merge_methods` |
| `min_entries_to_merge` | `1` | en ensam PR landar direkt; vore den 2 väntade varje PR på sällskap |
| `grouping_strategy` | `ALLGREEN` | varje PR i gruppen måste vara grön, inte bara gruppens head. **Review-backstoppens fullständighet hänger på detta värde** (`TASK-173.4`): kö-grenen namnger EN PR (`pr-<nr>-<bas-sha>`), och backstoppen prövar bara den. Under `ALLGREEN` bygger varje köad post sin egen spekulativa grupp och måste vara grön, så varje PR prövas av sin egen körning. Byts värdet till `HEADGREEN` faller det argumentet och backstoppen måste räkna upp gruppens ALLA PR:er — annars landar poster ogranskade. Ompröva `scripts/lib/review-backstopp.mjs` § `parsaMergeGroupRef` före ett sådant byte. |
| `max_entries_to_build` | `3` | satt efter uppmätt parallellitet, inte efter optimism |
| `check_response_timeout_minutes` | `60` | kritiska vägen är ~7,5 min — åtta gångers marginal |

**Vägen tillbaka, prövad FÖRE aktivering:** ta bort `merge_queue`-regeln ur
rulesetet med `gh api --method PUT … --input <sparad-array>`. `PUT` **ersätter**
hela `rules`-arrayen, så vägen tillbaka är en fil, inte en procedur — rulesetets
tillstånd sparades innan något rördes. Sekvensen på → verifierad → av →
verifierad kördes skarpt med tom kö innan regeln sattes på riktigt, eftersom
felläget annars är att ingen PR kan landa, inklusive den som fixar felet.

**Vad som fortfarande gäller:** armera aldrig en PR vars bygg-agent fortfarande
arbetar, och kör aldrig `update-branch` mot en sådan gren. Kön löser
maskin-ordningen, inte aktörs-krockar.

**Varför den sista raden överlevde upphävandet.** `update-branch` pushar till
grenen, och varje push till en PR-gren avbryter grenens pågående körning:
`ci.yml` nycklar sin concurrency-grupp på PR-numret och sätter
`cancel-in-progress` för allt utom `merge_group`. I S91 avbröt orkestrerare och
agent varandra två gånger på just den mekaniken, en gång **12 minuter in i en
grön körning**. Gren-uppdatering hör till orkestreraren, men först efter
agentens slutrapport.

**Samma push startar om CI-vakten.** En vakt följer det SHA den startades mot;
en ny commit på grenen gör att den vaktar ett SHA som inte längre är HEAD, och
den avbrutna körningen rapporteras `cancelled`. **Stoppa vakten och starta om
den mot det nya SHA:t.** `scripts/ci-wait.sh` skiljer redan superseddad
(`exit 4`) från röd (`exit 1`) för exakt detta fall: exit 4 är inget grönt bevis
utan en hänvisning till efterträdaren.

**Agenterna armerar inte — men skälet är inte längre ordningen.**
`.claude/agents/bygg-agent.md` föreskriver att en bygg-agent öppnar sin PR och
lämnar armeringen ifrån sig. **Instruktionen står kvar, motiveringen rättades
2026-07-30:** den gamla löd `BEHIND`, och `BEHIND` av parallella landningar är
just det kön gjort omöjligt. Kvar står det kön INTE ser — två diffar som mergar
rent var för sig och ändå är fel tillsammans. Agenten kan inte se sina
syskonagenter; orkestreraren kan, och granskar därför diffen innan den köas.

**Push-ekonomins undantagslista — vad som pushas direkt kontra väntar**
(`ADR-097` § 3). Push-kadensen ovan (§ Push-kadensen) sätter riktningen —
pusha vid en färdig enhet, inte per commit — men riktningen har egna
undantag åt båda hållen:

Pushas direkt, sparas aldrig till en färdig enhet:

- **Nummerbärande artefakter** (ADR-, lesson-, kort-nummer) — en opushad
  numrering förlänger fönstret där en parallell session kan allokera samma
  nästa-lediga-nummer (`CLAUDE.md` § Kortnummer, `TASK-93`-kollisionen).
- **Lifecycle-flippar** (sessionsdokets `paused`/`active`/`done`) —
  orkestrerarens svep och andra sessioner läser tillståndet ur `main`, inte
  ur ett lokalt träd.
- **Allt före paus/handoff** — write-ahead-principen (`ADR-096` § Beslut del
  3, "Persistens före väntan"): persistens är en förutsättning för att gå in
  i väntan, aldrig en eftertanke.
- **Hub-bumps** (plugin-version) — andra sessioner läser den bumpade
  versionen först vid sin egen sessionsstart; en opushad bump är osynlig för
  dem tills dess.
- **Säkerhetsfixar** — kostnaden av att sitta på en känd sårbarhet slår varje
  CI-besparing.

Väntar till en färdig enhet är klar att granskas:

- **Iterationsvarv** — `prototype`-skillens § 5; ett varv är per definition
  inte en färdig enhet (`T126`, `ADR-097` § 1).
- **WIP inom en skiva** — lokal commit per steg, en push när skivan är klar.
- **Utkast** — ett dokument som inte är redo att läsas som beslutat.

**Gransknings-regeln.** Marcus verifieringsmoment pekas mot väntfria ytor —
dev-server (`npm run dev`) eller staging (`CLAUDE.md` §
"Granskningsdata i staging") — aldrig mot en väntad landning. En granskning
som förutsätter att en PR redan är mergad gör granskningen beroende av kön,
vilket är precis den väntan i handlingsögonblicket `ADR-096`/`ADR-097`
flyttar bort.

**Den upphävda manuella formen bevaras nedan** — inte som instruktion, utan för
att den förklarar varför kön behövdes. Följ den inte; den är historik. Här stod
fram till `TASK-96` också en avgränsning om att merge queue var en egen öppen
post (restlistan A4) som inte fick föregripas *"tills den finns"* — den finns
sedan 2026-07-29, och raden är därför struken i stället för bevarad.

- ~~**Form A · tyngst först.**~~ Armera den PR vars svit är längst, låt den landa,
  armera nästa därefter. En kort svit hinner ikapp en lång; det omvända gäller
  inte.
- ~~**Form B · `gh pr update-branch` före armering.**~~ Ska en snabb PR ändå
  landa först: uppdatera nästa PR:s gren mot `main` och armera först därefter.

Den gamla regeln löd: *armera aldrig två PR:er samtidigt i hopp om att de klarar
sig; att laga `BEHIND` i efterhand är inte formen, då har svit-fönstret redan
öppnats en gång i onödan.* Resonemanget var riktigt — det är just det arbetet
kön nu utför utan att någon behöver minnas det.

**Varför regeln står här och inte bara som lärdom.** `L328` har varit
nedskriven sedan S81 och beskriver mekanismen korrekt. Ändå gick orkestreraren
i samma fälla **två gånger under en och samma resume** 2026-07-28: `#313` gick
`BEHIND` när `TASK-61` landades medan `59.5`:s PR låg i luften, och `#316`
gjorde det igen — andra gången rättat före armering i stället för efter. En
lärdom i prosa skyddar bara den som råkar läsa den vid rätt tillfälle, och det
var beviset för att den behövde en mekanism i stället för en läsare. Kön är den
mekanismen. Kvar i prosa står bara aktörs-krocken ovan, och den står vid sidan
av armerings-kommandot den gäller, i den sektion som redan äger
`gh pr merge --auto`.

### Revert-vägen — hur något som redan landat backas ut

**Utlösaren först.** Något ligger redan i `main` och visar sig vara fel: en röd
körning på `main`, ett nattärende, eller en yta som slutat fungera för Lotta.
Sektionen ovan förebygger att två PR:er krockar på väg IN — den här beskriver
vägen UT för något som redan är inne. Två olika lägen med två olika åtgärder;
de ska inte blandas ihop.

**Backa först, förstå sedan.** En revert är billig (siffrorna står nedan) och
går själv att ångra. Ett fel som får ligga kvar i `main` under tiden orsaken
utreds kostar mer, eftersom varje ny gren tas från det trasiga läget.
Forward-fix — att laga framåt i stället för att backa — väljs bara när orsaken
redan är känd OCH fixen är mindre än reverten.

**Vem gör vad. Brådskan ändrar inte rollerna.**

| Aktör | Ansvar i revert-vägen |
|---|---|
| **Marcus** | Beslutar ATT backa. Beslutet behöver inte vänta på att orsaken är utredd. |
| **Bygg-agent** | Förbereder gren, revert-commit och PR — och **armerar aldrig mergen**, samma kontrakt som i § Landnings-ordningen: orkestreraren granskar diffen innan den köas. |
| **Orkestreraren** | Granskar diffen och armerar mergen (`gh pr merge --auto`, så PR:n landar av sig själv när CI blir grön), följer CI till grönt per jobb. Ordningen väljs inte här — den ägs av kön. |

**Brådskan ändrar inte heller ordningen.** Revert-PR:n armeras som vilken
landning som helst: `gh pr merge --auto`, inga andra PR:er hålls
tillbaka, ingen gren uppdateras i efterhand. Det är samma mening som
§ Landnings-ordningen redan bär, och den gäller även när det brinner.

Frågan avgjordes med mätning FÖRE den här sektionen skrevs om
([`docs/research/kohopp-bradskande-revert-2026-07-30.md`](docs/research/kohopp-bradskande-revert-2026-07-30.md),
2026-07-30). **Behovet av kö-företräde är borta**, av fyra skäl som alla är
mätta:

- **Kö-väntan är försumbar.** Efter eget grönt kö-bygg landar en post på median
  **16 s** (p90 27 s), mätt över 30 landningar. Uppmätt värsta fall: 5 min 8 s.
- **Straffet är inverterat mot brådskan.** De tre poster som betalade mer än
  240 s var samtliga docs-klassade och grupperade med en kod-PR; deras
  kod-grannar betalade 14–23 s. Ingen kod-klassad post har någonsin betalat mer
  än 30 s. En revert av *kod* — den dyra sorten — passerar alltså praktiskt
  taget obehindrat, medan bara en docs-revert kan fördröjas nämnvärt.
- **Företräde finns, men biter inte på kostnaden.** GitHubs `jump` omordnar kön
  och hoppar inte över kö-bygget; den kan inte förarmeras (`--auto` köar utan
  den) och saknas i `gh` 2.96.0. Vinsten vore de ~20 sekunderna ovan, priset en
  *"full rebuild of all in-progress pull requests"* — GitHubs egen varning —
  alltså upp till tre poster om ~450 s var. Medvetet vald bort, inte förbisedd:
  ompröva om kö-djupet regelmässigt överstiger `max_entries_to_build` (3),
  eftersom poster bortom taket slutar byggas parallellt.
- **`--admin` förbi kön är stängd för alla, med avsikt.** Bypass-listan är tom
  och GitHubs eget beräknade `current_user_can_bypass` säger `never` även för
  repo-admin (ADR-076 beslut 2). `gh`:s hjälptext påstår motsatsen och är fel
  för det här repot.

Nödvägen är oförändrad och står i steg 3: att synligt inaktivera rulesetet, och
det är Marcus beslut.

**Steg 1 — hitta merge-commiten.** Varje landning i `main` är en
*merge-commit*: en commit som knyter ihop två utvecklingslinjer i stället för
att bära egna ändringar. Fråga PR:n direkt, hellre än att läsa loggen:

```bash
gh pr view <PR-nummer> --json mergeCommit --jq .mergeCommit.oid
```

Är PR-numret okänt går det att lista landningarna, men läs listan noga:

```bash
git log --oneline --merges -10 origin/main
```

**Fällan i den listan:** `main` innehåller TVÅ sorters merge-commits. Rader som
lyder `Merge pull request #N from …` är landningar. Rader som lyder
`Merge branch 'main' into <gren>` är branch-uppdateringar som följde med in i
en PR (`gh pr update-branch`, § Landnings-ordningen) — de är inte landningen och
ska inte revertas. Båda sorterna syns i loggen ovan just nu.

**Steg 2 — skapa reverten på egen gren.**

```bash
git switch -c revert/pr-<PR-nummer> origin/main
git revert -m 1 --no-edit <merge-sha>
```

**Varför `-m 1`, och varför kommandot inte går att köra utan flaggan.** En
merge-commit har två föräldrar: den ena är `main`-linjen, den andra är den gren
som landade. Git vägrar gissa vilken av dem som är "det normala tillståndet" att
återvända till, så en revert utan flaggan avbryts direkt (`exit 128`,
`is a merge but no -m option was given`). `-m 1` pekar ut förälder nummer 1 =
`main`-linjen, alltså "ta bort det grenen förde in". `-m 2` betyder motsatsen
och är tyst farlig: den lyckas ibland utan att ta bort någonting (uppmätt i
övningen nedan — `exit 0`, noll rader ändrade, felet kvar).

Flaggan behövs för att **varje** landning här blir en merge-commit. Rulesetet
`main-skydd` tillåter exakt en merge-metod, `allowed_merge_methods: ["merge"]`
([ADR-076](docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md) beslut 6) —
squash och rebase är avstängda, eftersom merge-dedupen letar PR-trädet via
merge-commitens andra förälder (`HEAD^2`). Ett revert-recept skrivet för
squash-landningar är därför fel recept för detta repo. Ändras metoden någon gång
faller `-m 1`-kravet med den; verifiera inställningen i stället för att lita på
raden:

```bash
gh api repos/high-five-group/miranon-media-admin/rulesets/19627609
```

**Steg 3 — öppna PR:n. Även en akut revert går via PR.** Direktpush till `main`
avvisas av rulesetet, bypass-listan är tom och `current_user_can_bypass` är
`never` (ADR-076 beslut 2) — det finns ingen gräddfil att ta till när det
brådskar, för någon. Nödvägen existerar men är Marcus beslut och ingen agents:
att synligt inaktivera rulesetet, vilket syns i dess historik. En tyst gräddfil
är den uttryckligen inte.

```bash
git push -u origin revert/pr-<PR-nummer>
gh pr create --title "revert: <vad som backas> (PR #<nummer>)" --body "<varför>"
```

Grinden blir ingen flaskhals, av tre skäl som alla är egenskaper hos
konfigurationen: PR-regeln kräver **0 godkännanden**, så ingen väntan på review;
docs-klassade PR:er är gröna på omkring en minut (ADR-077); och required-checken
är `strict`, vilket bara betyder att grenen måste vara aktuell mot `main` när den
landar. Det kravet uppfyller kön själv — den bygger posten mot `main` plus
posterna före den — så `BEHIND` uppstår inte längre av att en annan PR landar
medan reverten är i luften.

**Steg 4 — armering och verifiering (orkestreraren).** Samma kommandon som varje
annan landning; se § Pull Request-flöde för armeringen och Definition of Done för
`scripts/ci-wait.sh`. Reverten är landad först när CI är grön **per jobb** på
merge-commiten i `main`.

**Steg 5 — att landa om det som revertades.** En revertad merge kan inte återföras
genom att grenen mergas igen. Gits egen dokumentation är uttrycklig: *"Reverting a
merge commit declares that you will never want the tree changes brought in by the
merge. As a result, later merges will only bring in tree changes introduced by
commits that are not ancestors of the previously reverted merge"* (`man
git-revert`, `-m`-avsnittet, verifierat mot git 2.50.1). Vägen tillbaka är att
revertera reverten (`git revert <revert-sha>`) och bygga vidare därifrån.

**Exponeringsfönstret — hur länge ett fel kan ligga i `main`.** De fyra första
leden, vart och ett mätt i övningen nedan 2026-07-28:

| Led | Mätt | Not |
|---|---|---|
| `git revert -m 1` | **under 1 s** | samma sekundslag in och ut |
| `git push` | **3 s** | över hemnätet |
| `gh pr create` | **3 s** | |
| CI grön på revert-PR:n | **59 s** | run `30391389399`, docs-klass, grön per jobb |

**Summa: 66 s från beslut till landningsklar revert-PR** — i docs-klass. Talet är
summan av de fyra mätta leden, inte en obruten klockad sträcka: i övningen låg
annat arbete mellan pushen och PR-öppningen, och den pausen är övningens
arbetssätt, inte vägens kostnad.

**Men "landningsklar" är inte "landad", och sedan 2026-07-29 ligger två CI-lopp
emellan.** Under merge queue passerar varje PR först PR-grinden — som måste bli
grön innan `--auto` köar posten — och därefter kö-bygget på `merge_group`-ytan.
Det andra ledet fanns inte när talen ovan mättes. Mätt över 45 landade PR:er
2026-07-29 → 2026-07-31 (samma research-pass som ovan, § 2.3):

| Klass | Median PR-CI | Median kö-CI | Beslut → landad |
|---|---|---|---|
| **Kod** (n = 11) | 435 s | 449 s | **≈ 15 min** |
| **Docs** (n = 34) | 73 s | 75 s | **≈ 3 min** |

Sista kolumnen är de två CI-loppen plus mätt merge-overhead (≈ 16 s), inte en
projektion. Ett konkret genomlopp: PR #483 (kod) tog **16 min 22 s** från
PR-CI-start till landad merge-commit.

**Rättelsen bokförs öppet.** Fram till `TASK-96` stod här att ett kod-fel är ute
ur `main` *"inom omkring åtta minuter från beslut, ett docs-fel inom drygt en"*.
De talen mättes 2026-07-28, före kön, och saknade kö-bygget helt — verkligheten
är ungefär den dubbla i båda klasserna. Det är siffran någon förlitar sig på när
något brinner, och därför den som måste stämma.

Klassen avgör vilken rad som gäller: backas dokumentation kör CI docs-klass
(ADR-077); backas kod bärs PR-grindens kritiska väg av `Acceptance (hermetisk)`,
mätt till 404–452 s.

**Det talet blev förutsägbart med `TASK-70.3`, inte lägre.** Fram till dess bar
en kod-PR även `Staging (API + E2E)` (375 s) *plus* kö på den globala
`staging-tests`-mutexen, och det var kön som gjorde en brådskande revert
oberäknelig. Staging kör numera post-merge (§ Post-merge-lagret), så en
revert-PR:s väg genom grinden beror bara på dess egen svit.

**Och PR-grindens kod-led ligger kvar kring sju minuter — `TASK-75` sänkte det
inte för denna väg.** Urvalet (§ Acceptance-klassen → Urvalet i PR-grinden)
fäller ut endast när diffen rör *enbart* acceptance-spec-filer. En revert av en
kodändring rör per definition källkod, faller därför till full klass, och betalar
samma 422–433 s som förut. Backas i stället en acceptance-spec landar reverten på
delmängden. Skillnaden är värd att veta i förväg — och den betalas två gånger:
kö-bygget kostade i mätningen ungefär detsamma som PR-grinden i samma klass
(449 s mot 435 s för kod, 75 s mot 73 s för docs).

**Vad en revert INTE tar tillbaka.** `git revert` ändrar bara filer i git.
Allt som redan lämnat repot står kvar:

- **Utskickad e-post.** `send-email` och `send-registration-confirmation` har
  redan levererat. Ett mail går inte att kalla tillbaka.
- **Skrivningar i Airtable-basen.** En Edge Function som hunnit skriva har ändrat
  rader; att backa koden stoppar bara framtida skrivningar. Rättning sker i
  basen, enligt [ADR-063](docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md).
- **Deployade Edge Functions.** Deploy är manuell i dag (`scripts/deploy-prod-functions.sh`,
  ingen CI-pipeline). En revert i git rör inte den funktion som körs — den måste
  deployas om från det revertade läget.
- **GitHub-inställningar.** Ruleset, secrets och repo-inställningar bor inte i
  git alls. Rulesets saknar dessutom PATCH: `PUT` ersätter hela objektet, så en
  återställning måste göras från ett komplett block — det ligger som
  återskapnings-underlag i ADR-076 beslut 4.

**Övningen — vad som faktiskt kördes, 2026-07-28.** Vägen är övad skarpt mot en
avsiktligt införd no-op (en HTML-kommentar utan funktionell verkan), aldrig mot
verkligt innehåll. Kedjan ligger i **PR #370**:s historik och går att läsa om:

| Steg | SHA | Utfall |
|---|---|---|
| Utgångsläge (`main`-spets) | `103e5f2` | trädet `4944e1d` |
| No-op-commit | `5e6da95` | +4 rader i `CONTRIBUTING.md` |
| Merge-commit, GitHubs form | `b9dada7` | förälder 1 = `103e5f2`, förälder 2 = `5e6da95` |
| Revert-commit | `31c2146` | −4 rader, trädet åter `4944e1d` |

Tre mätningar, alla mot `b9dada7`:

- `git revert b9dada7` (utan flaggan) → **exit 128**,
  `error: … is a merge but no -m option was given` — utan flaggan går kommandot inte igenom alls.
- `git revert -m 2 --no-commit b9dada7` → **exit 0**, noll rader stagade, no-op:en
  kvar i filen. Fel förälder-nummer misslyckas alltså TYST och ser ut att ha lyckats.
- `git revert -m 1 --no-edit b9dada7` → revert-commit `31c2146`;
  `git diff --stat 103e5f2 HEAD` tomt och `HEAD^{tree}` = `4944e1d`, identiskt
  med utgångsläget. Träd-identitet, inte bara "det såg rätt ut".

**Övningens avgränsning, öppet bokförd.** No-op:en landade på övningsgrenen, inte
i `main`, och steg 4 (armeringen) utfördes inte av bygg-agenten — det är
orkestrerarens knapp, och kontraktet gäller även under en övning. Kedjans
git-mekanik är därmed bevisad hela vägen.

**Det ledet är nu också mätt skarpt — och talet är sämre än väntat.** Samma dag
kördes kedjan hela vägen mot `main` av orkestreraren: no-op:en landade i PR
[#374](https://github.com/high-five-group/miranon-media-admin/pull/374)
(merge-commit `ed51b95`) och backades i PR
[#375](https://github.com/high-five-group/miranon-media-admin/pull/375)
(revert-commit `745ec55`, merge-commit `894a3bd`). Filen försvann ur `main`;
träd-identiteten höll. Alla tre kommandona ovan reproducerades mot en riktig
`main`-landning, inklusive att `-m 2` gav `exit 0` med **noll** rader stagade och
filen kvar.

| Led | Mätt |
|---|---|
| No-op påbörjad → revert-commit skapad | **118 s** |
| Revert-commit → **landad** merge-commit i `main` | **25 min 16 s** |

**Läs det andra talet rätt: det är inte revert-vägens naturliga kostnad.** CI för
en docs-revert är under en minut. Nästan hela tiden var köväntan på
`staging-tests`-mutexen, som hölls av post-merge-lagrets körning på no-op:ens
egen landning — lagret ärvde inte klassningen och körde full staging-svit på en
ändring om åtta rader markdown.

**Orsaken är åtgärdad — `TASK-73`.** `post-merge.yml` har sedan dess ett
`klassning`-jobb som ÄRVER `ci.yml`:s D0-beslut för exakt det landade trädet och
hoppar svit-anropet när PR-grinden redan skippade det. En docs-landning tar
därmed inte längre `staging-tests`-mutexen, och blockerar inte revert-vägen.
Kod-landningar kör full svit som förut: kontrollen är avgränsad, inte borttagen.

**Talet 25 min 16 s står kvar som HISTORISK mätning av läget före fixen.** Det
skrivs inte om från en projektion — ett projicerat tal är ingen mätning.
`TASK-70.3` tar dessutom bort det andra ledet i samma väntan: en revert-PR köar
inte längre bakom mutexen alls, eftersom ingen PR-körning tar den. Kvar som
möjlig fördröjning är enbart post-merge-lagrets egen körning på en *föregående*
landning, och den blockerar inte grinden.

**Vad som ÄR mätt sedan dess** är hela landningsvägens kostnad under kön —
tabellen med de två CI-loppen ovan, 45 landade PR:er. Den mätningen är gjord på
vanliga landningar, inte på en skarp revert; att en revert följer samma väg är
en följd av att den är en PR som alla andra, inte ett eget mätvärde.

**Varför sektionen står här.** A7:5 (`TASK-70.3`, landad) och A7:6
(`TASK-70.4`, öppen) flyttar kontroller från den blockerande PR-grinden till
`main` efter merge. Den flytten är försvarbar bara om vägen tillbaka är kort,
känd och prövad — annars byts en väntan mot en risk. En oskriven revert-väg
prövas första gången under tidspress, av den som har minst marginal att lära sig
den då.

## Rött-först — bevisformen

Rött-först är obligatoriskt för produktkod: testet skrivs och körs RÖTT
lokalt FÖRE den gröna koden. Beviset bärs av det **lokala körutdraget** —
testnamn, observerat felutfall, antal — citerat på kortet och i
sessionsdok. Bärarformen beslutades i
[ADR-071-amenderingen S80](docs/decisions/ADR-071-afk-batch-kontraktet.md);
en röd körning i den delade CI-kön är INTE bevisformen.

- **Rött och grönt pushas IHOP:** CI kör en gång, på grön head;
  historiken behåller båda commits och forensiken går via git.
- **Avsiktligt röda körningar i den delade kön är förbjudna** — rött i CI
  ska betyda EN sak: oväntad regression.
- **Grind-bevis** (att en CI-grind faktiskt fyrar) görs via den riktade
  avfyrningsformen `gate-proof.yml` (`workflow_dispatch`), som bevisar
  sig själv: en avfyrning som inte ger failure är ett underkänt bygge.

## Post-merge-lagret — staging och a11y körs EFTER merge, inte före

`.github/workflows/post-merge.yml` kör den tunga sviten på det **mergade** trädet
vid varje push till `main`. Den är avsiktligt ingen required check och kan
strukturellt inte blockera en landning: den triggar först när mergen redan skett.

**Vad som flyttat hit.** `Staging (API + E2E)` och `Staging sentinel purge` kördes
fram till `TASK-70.3` i den blockerande PR-grinden. Sedan dess skickar `ci.yml`
`run_staging: false` villkorslöst, och de två jobben instansieras aldrig av en
PR-körning. `A11y (axe-runner)` följde med `TASK-70.4` på exakt samma form
(`run_a11y: false`, villkorslöst). `post-merge.yml` och `nightly.yml` utelämnar
inputarna och får därför `ci-suite.yml`:s defaulter `true` — samma svit, samma
`EN KÄLLA`, annan tidpunkt. Av de sex tunga jobben instansierar PR-grinden efter
detta tre: `Pure + Build`, `Acceptance (hermetisk)` och `Webblasarbeteende`
(TASK-131 — se § Webbläsarbeteende-klassen; jobbet bär inget eget `run_x`-
villkor, av samma skäl som `Pure + Build`: det behöver inga secrets och rör
aldrig staging).

**Varför staging-flytten gjordes, och vad den faktiskt köpte.** Inte jobbets
375 s, utan den globala `staging-tests`-mutexen. Den serialiserar över *alla*
staging-rörande körningar, så kritiska vägen växte med antalet parallella PR:er:
två körningar med identiskt svit-innehåll mätte 7,8 respektive 20,3 min, där hela
skillnaden var kö. Ur PR-vägen slutar den växa. Väggklockan för en *ensam* kod-PR
sjunker däremot knappt — `Acceptance (hermetisk)` blir ensam bärare och ligger
kring 7 min. Det är ett känt kvarvarande tak, inte en förbisedd besvikelse.

**Priset: en kod-PR kan landa utan att staging eller a11y någonsin körts mot dess
innehåll.** Det är avsikten. Det gör revert-vägen (§ Revert-vägen) till den
kontroll som bär risken, och den måste därför vara skriven och övad — vilket den
är.

**A11y-flytten är inte samma rörelse som staging-flytten.** Staging *flyttade*
hit. A11y kördes redan här — anropet i `post-merge.yml` skickar inga inputs och
fick defaulten `true` även före `TASK-70.4` (post-merge-körning `30402869073`,
a11y grön på 119 s). Det `TASK-70.4` tog bort var PR-sidans **dubblett**, inte en
kontroll utan hemvist. Därför står vinsten i runner-minuter, inte i väggklocka:
a11y bär 103–104 s men kör parallellt med `Acceptance (hermetisk)` (424 s i samma
körning), som är kritiska vägen både före och efter. Väggklockan för en kod-PR
sjunker alltså **noll sekunder** — det är det förväntade utfallet, inte en
utebliven vinst. Sparat: ~1,7 runner-minuter per kod-PR-körning, och lika mycket
per `merge_group`-körning av samma PR. Av samma skäl rör `TASK-70.4` inte
exponeringsfönstret nedan: post-merge-körningen är exakt lika lång som förut.

**Ribban är orörd — mätpunkten flyttade.** Tillgänglighet är 11 utan undantag
(`CLAUDE.md` § Kvalitetsribba) och axe-runnerns 0-violations-regel
([ADR-045](docs/decisions/ADR-045-a11y-runner-arkitektur.md) § Beslut 2) står
kvar oförändrad. Det enda som ändrats är **när** den mäts: efter merge i stället
för före. Läser någon `TASK-70.4` som en sänkt tillgänglighetsribba är det en
felläsning — varken tolerans, måltavla eller svit är rörd. ADR-045 § Beslut 3
(`test:a11y` hör till den tunga svitens sfär, kod-grindad) håller likaså: jobbet
bor kvar i `ci-suite.yml` och är kod-grindat på post-merge-ytan via
`klassning`-jobbets ärvda `D0`-beslut.

### Exponeringsfönstret — hur länge ett fel kan ligga oupptäckt i `main`

Fönstret är tiden från merge till post-merge-svar. Jobbet
`Exponeringsfönster (merge → svar)` mäter det **varje körning** och skriver talet
till körningens step-summary — det är alltså inte ett tal som mättes en gång vid
bygget och sedan förfaller. Mätt ur skarpa körningar på `main` 2026-07-28:

| Landningsklass | Uppmätt fönster | Körningar |
|---|---|---|
| Kod (full svit på det mergade trädet) | **452–463 s (~7,5–7,7 min)** | `30400572865` · `30402009647` · `30402869073` |
| Docs (ärvd `D0` ⇒ svit-anropet hoppas) | **23–29 s** | `30403050623` · `30403151544` · `30403478649` |

Läs talet rätt: det är **fönstret till upptäckt**, inte till åtgärd. Full tid från
merge till ett rättat `main` är fönstret ovan plus revert-vägens led, som mäts
för sig i § Revert-vägen.

Talen är mätta under det gamla läget, då både PR-körningen och post-merge tog
mutexen. Flytten tar bort den ena av de två — fönstret kan därför bara krympa,
aldrig växa, av `TASK-70.3`. Ett projicerat tal skrivs inte in här; nästa
uppmätning ersätter tabellen.

**Blir post-merge röd** skapas automatiskt ett tilldelat ärende (etikett
`ci-post-merge`) med de röda jobben, en **attribution** och ett revert-förslag
med rätt `-m`-form. Samma stängningsregel som nattnätet nedan: åtgärd,
genomförd revert eller öppet skriven motivering — aldrig tyst. Ärendet bär en
tolkningshjälp som ska läsas FÖRE revert; en ensam röd `Acceptance (hermetisk)`
kan vara `TASK-64`:s kända flake, och en ensam röd mätning betyder att
mätningen gått sönder, inte `main`.

**Attributionen svarar på "är det DEN HÄR landningen?" — och den frågan har
inte alltid svaret ja.** Ärendet läste tidigare bara föregående
post-merge-körnings utfall på workflow-nivå. Men en docs-landning ärver
ci.yml:s `D0`-beslut, svit-anropet hoppas, och körningen blir `success` **utan
att ha mätt någonting** — grönt betyder då "ingen mätning", inte "trädet var
friskt". Larmet skrev ändå att landningen var den primära misstänkta; mätt två
gånger inom 13 minuter 2026-08-28 (ärenden `#2043` och `#2047`), båda med en
rotorsak som låg flera landningar bakåt. Sedan `TASK-334` går
[`scripts/post-merge-attribution.sh`](scripts/post-merge-attribution.sh) i
stället bakåt till senaste körning som FAKTISKT körde sviten, räknar
landningarna däremellan och skriver ut spannet — och påståendet "primär
misstänkt" produceras ENDAST när det är sant. Går något fel står det **OKÄND**
i ärendet, aldrig en gissning. Beslutet, options-rymden och den tidsbaserade
drift-vakt som är flaggad men INTE byggd:
[ADR-077](docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
§ Updates 2026-08-28.

**Öppet bokförd blind fläck:** larm-jobbet bor inne i den körning det bevakar. Ett
`startup_failure` (noll jobb instansieras) lämnar därför inget spår — samma defekt
som `nightly-watchdog.yml` byggdes för på nattsidan. Någon motsvarande vakt finns
inte här, och det är ett medvetet öppet val, inte en förbiseelse.

## Nattnätet

En schemalagd fullsvit (`.github/workflows/nightly.yml`, ~03:00 svensk tid)
prövar hela repot i full bredd varje natt — inklusive det som presubmit-
selektionen (riskklassning/dedup) medvetet hoppade över. Nätet är
förutsättningen som gör selektionen försvarbar: en skipp före merge blir en
fördröjning på högst ett dygn, aldrig ett permanent hål
([ADR-077](docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)).

### Nattens tre larmkanaler

Fram till 2026-09-18 matade nattens åtta kontroller **en** etikett. Det gjorde
rött obrukbart: bokföringsgrindarna färgade lampan nästan varje natt, och ett
verkligt produktfel syntes inte i högen. Mätt över 56 nätter stod
bokföringsgrindarna för 44, 39, 30 och 28 röda nätter medan produktjobben stod
för 15, 9, 3 och 1 — på 25 av 52 nätter var ett produktskyddande jobb rött utan
att kunna urskiljas, och `TASK-239`:s krav på "tre gröna nätter i rad" fick 31 i
följd utan att kunna bockas.

Sedan `TASK-450.1` (planens § N2, Marcus K2-/K1-beslut 2026-09-18) går natten i
**tre kanaler**. Varje kontroll bär exakt en:

| Kanal | Etikett | Form | Utlöses av |
|---|---|---|---|
| **Produkt** | `ci-natt` | **Tilldelat** ärende, ett per natt, med commit-spann | `suite` · `nightly-metrics` · `kontraktsvakt` |
| **Bokföring** | `bokforingsdrift` | **Stående** ärende (ADR-082-formen), kommentar per natt | `backlog-closure` · `pausade-sessioner` · `obesvarade-larm` · `sessionsdok-fonster` |
| **Beroendesäkerhet** | `beroendevarning` | **Stående** ärende | `nightly-audit` |
| *(Länkröta, sedan ADR-082)* | `lankrota` | **Stående** ärende | `nightly-links` |

**Läs rubriken, inte bara färgen.** Ett `ci-natt`-ärende betyder numera exakt en
sak: appen eller dess mätning gick sönder. Ett `bokforingsdrift`-ärende säger
ingenting om appen, och tvärtom.

**Alla fyra ärenden redovisar HELA nattens jobbstatus**, inte bara sin egen
delmängd — det som skiljer kanalerna är vad som UTLÖSER dem. En läsare ska se
hela läget i det ärende hon råkar öppna.

**Produktkanalen har medvetet ingen dubblettspärr.** Ett produktfel som
återkommer natt efter natt är ett verkligt besked, och ett stående ärende hade
dämpat just det. De två stående kanalerna fäller i stället på tillstånd som är
bitvis identiska tills någon åtgärdar dem — där är sjuttio ärenden om samma sak
det som devalverar signalen.

**Bevis-läge:** `gh workflow run nightly.yml -f simulate_failure=<kanal>` där
kanalen är `produkt`, `bokforing` eller `beroende`. Läget fäller EN verklig
grind i den valda kanalen, så ärendet skapas via den riktiga `needs`-vägen — och
**bara den valda kanalens ärendejobb får köra**, vilket är den halva av beviset
som betyder något. Tystnaden garanteras alltså av konstruktionen, inte av att
övriga grindar råkar vara gröna: alla fyra kanaljobb bär en kanalklausul i sitt
`if`. Den tunga nattsviten hoppas över i ett simuleringsläge — larmkedjan
prövas, inte sviten. **Städa testärendet med motivering — och för `produkt`
(som går via `alarm` och etiketten `ci-natt`, samma etikett nattvakten
dedupar mot) ta ÄVEN bort etiketten efter stängning**, se § "Vad nattvakten
vaktar" nedan för hela skälet och instansen (`TASK-484` är den strukturella
fixen, ännu inte byggd).

### Vad nattvakten vaktar — och vad den INTE vaktar

`nightly-watchdog.yml` larmar när nattkörningen inte är grön men inget öppet
`ci-natt`-ärende finns, alltså när larm-jobbet självt kan ha uteblivit. Den
måste därför veta vilka jobb som bär produktkanalen — annars larmar den om
nätter där `alarm` skippades KORREKT. Sedan `TASK-450.1` läser den en
**allowlist** över produktkanalens jobb (`.nattvakt-kanal-policy.conf`) i
stället för den gamla exkluderingen av länkkontrollen.

**Vakten vaktar produktkanalen OCH (sedan `TASK-467`) beroendekanalen —
bokföringskanalen har fortfarande ingen "vaktens vakt".** Faller
bokföringskanalens kanaljobb på gh-I/O syns det bara i körningens logg — en
känd lucka, inte en glömska: kanalen är ett icke-blockerande stående ärende,
och en vakt som larmar tilldelat om den hade återinfört precis den
signalblandning delningen tog bort.

Beroendekanalen var samma klass av lucka tills `TASK-467` (2026-09-19)
byggde ut ett EGET dödmansgrepp för den — inte en generalisering av
produktkanalens vakt, utan en ANNAN relation: i stället för "kördes
körningen alls?" prövar `scripts/check-beroendekanal-dodmansgrepp.sh`
"gavs granskningsjobbet (`nightly-audit`) ett rött resultat UTAN att
ärendejobbet (`beroende-arende`) nådde `success`?" — samma Prometheus
Watchdog-idé applicerad på en tvåleds-relation mellan två jobb i samma
körning i stället för på en ensam heartbeat. `nightly-watchdog.yml`:s jobb
anropar skriptet som ETT STEG i sitt befintliga jobb (samma redan hämtade
jobblista som produktkanal-checken, `gh run view`) — noll nya fakturerade
Actions-minuter. Tystnar kanalen (granskningsjobbet rött, ärendejobbet
inte `success`) skapas samma TILLDELADE `ci-natt`-ärende som produktkanalens
vakt använder, med rubriken "Beroendekanalen tystnade". Bevis-läge:
`gh workflow run nightly-watchdog.yml -f simulate_beroende_tyst=true`.
Byggd först nu och inte i `TASK-450.10` (3A) av skälet ADR-082 § Updates
2026-09-18 "Öppet, ej avgjort här" skriver ut: kanalen blev lastbärande för
hela beroendesäkerheten FÖRST när `TASK-450.5` landade — en vakt byggd
före det hade vaktat en kanal som ännu inte bar något.

**Produktkanal-checken prövas FÖRE beroendekanal-checken samma körning, inte
båda oberoende.** `nightly-watchdog.yml`:s `watch`-jobb kör beroendekanalens
dödmansgrepp bara i `else`-grenen av produktkanal-kontrollen: hittar den
förra ett rött produktjobb vinner rubriken "Nattnätet rött utan larm", och
beroendekanalens check körs aldrig den natten. En människa larmas ändå
(samma `ci-natt`-ärende, samma assignee) — men om BÅDA kanalerna genuint
fallerar tyst samma natt säger ärendet bara "produktkanalen", aldrig att
beroendekanalen också var drabbad. Läs alltså "Nattnätet rött utan larm"
som "minst produktkanalen", inte som ett uteslutande av en tyst
beroendekanal — kontrollflödet är medvetet oförändrat (en riktig fix vore
att köra båda checkarna alltid och redovisa båda, men det är inte gjort).

**Invarianten som måste hållas är TVÅDIMENSIONELL** — och den formulering som
stod här (*"listan ska vara lika med `alarm`-jobbets trigger"*) var för grov.
Triggrarna och `needs`-listan lever i **jobb-ID**-rymden (`suite`,
`nightly-metrics`, `kontraktsvakt`); vaktens lista lever i
**jobb-NAMNPREFIX**-rymden. Kravet har därför två led:

1. **ID-ledet** — de tre kanalernas triggerlistor partitionerar `needs`-listan:
   varje nattjobb utlöser exakt en kanal, inget två, inget noll.
2. **Namn-ledet** — varje jobb-ID i `alarm`-triggern mappar till ett `name:`
   som något prefix i configens lista faktiskt matchar. Byter någon `name:` på
   de tre produktjobben slutar prefixet matcha, och `Nattlig fullsvit` måste
   dessutom förbli ett **prefix** till nattsvitens barnjobb.

Bryts ledet 2 ensamt **tystnar vakten för hela produktkanalen** medan en ren
ID-jämförelse står grön. **Sedan `TASK-450.10` (3A, 2026-09-19) vaktar
`scripts/check-nattkanal-partition.mjs` BÅDA leden**, CI-wirat i `ci.yml`:s
lint-jobb på varje PR — härlett ur `nightly.yml` (js-yaml) och ur
`.nattvakt-kanal-policy.conf` (sourcad i en riktig bash-subprocess, samma
tolkning nightly-watchdog.yml självt gör), ingen femte handhållen lista.

**Sedan `TASK-467` (2026-09-19) vaktar samma skript ETT TREDJE led**:
beroendekanalens dödmansgrepp. `NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN` och
`NATTVAKT_BEROENDE_ARENDE_JOBBNAMN` i `.nattvakt-kanal-policy.conf` måste
matcha de faktiska `name:`-fälten på `nightly-audit` respektive
`beroende-arende`, OCH `nightly-watchdog.yml` måste fortfarande referera
`scripts/check-beroendekanal-dodmansgrepp.sh` — tas endera bort tystnar
dödmansgreppet, precis lika tyst som ett omdöpt produktjobb tystar led 2,
fast för en annan kanal. Tvåsidigt testbevisad, alla tre led:
`scripts/test-check-nattkanal-partition.mjs`.

### Kontraktsvakten — fixturvärlden mot verkligheten

Jobbet **Kontraktsvakt (fixtur mot skarp staging)** anropar varje natt de tre
Edge Functions som bär 103 av 118 skarpa restanrop i testsviten
(`get-event-notes`, `get-registrations`, `get-events` — urvalet är härlett ur
hermetik-mätningen, inte handplockat), parsar **fixtursvaret och det skarpa
svaret genom samma zod-schema** och jämför formen. Stämmer de händer
ingenting; divergerar de fälls jobbet och larm-jobbet skapar samma
`ci-natt`-ärende som en röd natt.

**Varför den behövs:** zod-schemana är halva kontraktet. De fångar att ett
fält byter typ, men inte att fältet betyder något annat — och inte att
*schemat självt* glidit, eftersom schemat är vår bild av funktionen och inte
dess deklaration. Ändras funktion och schema i samma commit finns ingen signal
alls. Airtable-basen byggs dessutom aktivt om under AT-Max-milstolpen, vilket
är precis den period fixturer driftar tyst
([ADR-080](docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
beslut 3).

**Larmet blockerar ingen PR** — och det är en egenskap hos placeringen, inte
en flagga: projektet `kontraktsvakt` körs bara av `nightly.yml` och ingår inte
i `ci-suite.yml`, som är delad mellan natten och presubmit. Lägg det aldrig
där. `continue-on-error` vore fel väg av motsatt skäl: det gör needs-resultatet
grönt och larm-jobbet hade aldrig fyrat.

Larmtexten namnger endpoint, avvikelseklass, de faktiska fältnamnen, vad
följden är och vad man gör härnäst — den ska gå att agera på kl. 03 utan
kontext. Att vakten faktiskt fäller bevisas av
`tests/api/kontraktsvakt-jamforelse.test.ts`, som kör rent i varje PR: en grön
nattkörning kan aldrig visa att en vakt larmar, bara ett medvetet fel kan det.

### Nattvakten — vad larm-jobbet inte kan se

Larm-jobbet bor **inne i** nattkörningen och kan därför bara larma om
körningen faktiskt äger rum. Två fall bryter det, och det ena har hänt:

- **`startup_failure`** — GitHub avvisar hela körningen och noll jobb
  instansieras, alltså inte heller larm-jobbet. Empiriskt: run `30038460735`
  (2026-07-23) lämnade noll spår.
- **Utebliven schemakörning** — GitHub dokumenterar att schemalagda
  körningar kan fördröjas och att köade jobb kan tappas.

`.github/workflows/nightly-watchdog.yml` står därför **utanför** och frågar
API:t en gång per dag: kom natten igång, och är larm-läget konsistent?

**Den ersätter inte larm-jobbet.** Arbetsdelningen följer en verklig gräns —
kan körningen observera sig själv eller inte. Larm-jobbet behåller "natten
körde och något gick sönder" (direktlarm, med commit-spann och flake-signal
som en extern vakt inte kan rekonstruera); vakten tar bara det som annars är
oobserverat. Samma mönster som Prometheus Watchdog, och samma linjal som
Google SRE:s checklista för nya larmregler: *does this rule detect an
otherwise undetected condition?*

Vakten kontrollerar öppna `ci-natt`-ärenden — ELLER ärenden STÄNGDA inom ett
fönster med en skriven motivering (kommentar) — före den skapar ett nytt, så
du aldrig får dubbla ärenden om samma natt. Den senare halvan är `TASK-180`
(2026-08-10, issue `#1042`): en tidigare version frågade bara efter ÖPPNA
ärenden, missade ett larm som redan fanns och nyss stängts med en
rotorsaksmotivering, och larmade själv — ett falsklarm. Beslutet bor i
`scripts/check-nattvakt-dedup.sh` (config: `.nattvakt-dedup-policy.conf`).

**Bevis-läge:** kör vakten via `workflow_dispatch` med `simulate_missing:
true` för att avfyra larmkedjan utan att invänta en äkta incident. En
otestad dödmansgrepp ger falsk trygghet — därför är läget en del av
konstruktionen, inte en eftertanke. Städa testärendet med motivering.
Beroendekanalens dödmansgrepp (`TASK-467`) har sitt EGET, oberoende
bevis-läge — `simulate_beroende_tyst: true` — av samma skäl: `simulate_missing`
prövar bara "kom natten igång?", inte "tystnade beroendekanalen trots att
granskningen var röd?".

**"Städa" betyder BÅDA: stäng ärendet OCH ta bort etiketten `ci-natt` —
ett ÅTAGANDE, ingen mekanism (ADR-083).** Dedupen ovan (`check-nattvakt-
dedup.sh`) läser VARJE `ci-natt`-märkt ärende som är stängt med kommentar
inom `NATTVAKT_DEDUP_FONSTER_TIMMAR` (26 h) — den skiljer inte en äkta natt
från en bevis-dispatch, för dedupen känner bara till etiketten och
kommentaren. Ett bevis-ärende som BARA stängs men behåller `ci-natt` kan
därför tysta ett äkta larm i upp till 26 timmar efter stängningen — dedupen
hittar det stängda bevis-ärendet, kallar avvikelsen "redan täckt" och
skapar aldrig det riktiga larmet. Instans: `TASK-467` (`PR #2590`) lämnade
issue `#2589` stängt-med-motivering `2026-09-19T12:17:05Z` men fortfarande
`ci-natt`-märkt; fönstret stängdes manuellt genom att ta bort etiketten
`2026-09-19T12:35:17Z` (~18 min senare). Gäller VARJE bevis-läge som skapar
ett `ci-natt`-märkt ärende — `simulate_missing`, `simulate_beroende_tyst`
och (sannolikt, oprövat) `nightly.yml`s `simulate_failure=produkt`, som
går via samma `alarm`-jobb och samma etikett. Den strukturella fixen
(dedupen ska inte kunna matcha ett bevis-ärende över huvud taget) är ett
eget kort, `TASK-484` — ändras inte här.

**Öppet bokförd begränsning:** vakten är själv en schemalagd körning och
ärver därmed den defekt den ska täcka. Den fångar det vanliga fallet (en
enskild körning tappas eller vägrar starta) men inte det sällsynta att hela
schemaläggningen ligger nere. Att bryta den rekursionen kräver en klocka
utanför GitHub.

**Stängningsregel — ett nattärende stängs ALDRIG tyst.** Antingen (a) åtgärdas
grundorsaken, eller (b) skrivs en öppen motivering ut i ärendet innan det
stängs. Regeln är larmkedjans motgift mot kyrkogårdseffekten: ett larm ingen
läser är värdelöst, och tyst stängning gör larmet till en kyrkogård.

**Regeln gäller ALLA nattens kanaler** — `ci-natt`, `bokforingsdrift`,
`beroendevarning` och `lankrota`, oavsett om ärendet är tilldelat eller stående.
Kanaldelningen (`TASK-450.1`) delade upp VAD ett rött ärende betyder; den
mildrade ingen kanals stängningsregel. Ett stående ärende stängs när kanalen är
grön igen, eller med en skriven motivering — aldrig för att det blivit gammalt.
Det är just den risk `ADR-077` § Beslut 3 varnar för: en mildare kanal som blir
en kyrkogård ingen läser.

### Tidsregel och ägare — rött efter landning och nattärenden (`TASK-479.2`, SE16)

Stängningsreglerna ovan (§ Exponeringsfönstret, § Nattnätet) säger VAD ett
svar är: en åtgärd, en genomförd revert eller en öppet skriven motivering —
aldrig tyst. Fram till `TASK-479.2` sa de ingenting om NÄR och VEM. **16 larm
stod obesvarade i 10–11 dygn**
(`docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md`
§ SE16) innan denna regel fanns, och 2026-09-19 stod tre röda efterkontroller
på `main` samtidigt (`#2573`, `#2575`, `#2577`) — alla på samma ärvda testfel
från en landning, varav två tillhörde en annan session än den som först såg
felet.

**Tidsregel.** Ett öppet `ci-post-merge`-ärende eller nattärende (`ci-natt`,
`bokforingsdrift`, `beroendevarning`, `lankrota`) ska ha fått ett SVAR — enligt
respektive stängningsregels egen definition, alltså inte nödvändigtvis
STÄNGT — inom **24 timmar** från att det öppnades. Fristen gäller svaret, inte
lösningen: en kommentar som beskriver rotorsak och plan räknas, ett
`ci-natt`-ärende som medvetet väntar på ett namngivet villkor (t.ex.
`TASK-239`:s fönster, § ovan) räknas, en tyst öppen ruta i tio dygn gör det
inte.

**Ägarregel.** Den session vars landning FÖRST gjorde efterkontrollen eller
natten röd äger det ärendet. En landning som råkar ärva ett redan-rött träd —
`post-merge.yml`s attributionstext säger det rakt ut när den kan ("... var
redan RÖD ⇒ felet är sannolikt ÄLDRE än den här landningen. Revertera inte
reflexmässigt") — äger INTE ett nytt ärende bara för att den råkade vara
landningen som mätte igen; den pekar mot det FÖRSTA ärendet i stället för att
öppna en egen utredning mot fel commit.

**Mekaniskt stöd — svepet gör det synligt.**
`scripts/heartbeat-svep.sh` rapporterar sedan `TASK-479.2` öppna
`ci-post-merge`- och nattärenden som en egen, GLES rad (skriptets § SJUNDE
VÄGEN) — ett känt, ägt läge ska inte larma var 90:e sekund, så raden visas
vid ÖVERGÅNG (in i eller ur rött) och därefter med ett konfigurerbart
påminnelseintervall (`HEARTBEAT_ARENDE_PAMINNELSE_INTERVALL`,
`.heartbeat-svep-policy.conf`, default 1800s). Rapporteringen är GLOBAL, inte
sessions-scopad — `--session <ID>` filtrerar RÖTT/DIRTY/ARMERINGS-KANDIDAT för
PR:ar (`CLAUDE.md` § Landning), men huvudgrenens ärenderegister har ingen
sessionsmarkör och angår varje session oavsett flagga. Sveper flera sessioner
samtidigt mot samma delade tillstånd rapporteras ett rött på `main` EN gång
PER MASKIN, inte en gång per session — den ENA session som sveper FÖRST
skriver raden, de övriga läser redan-uppdaterat läge och är tysta; det gles
påminnelseintervallet är vad som når dem, inte en garanti om samtidighet.

**En känd, medvetet obyggd gräns.** Svepet pekar INTE automatiskt mot "det
första ärendet" när flera `ci-post-merge`-ärenden delar samma rotorsak — att
avgöra "samma felande TEST" kräver att parsa jobbets logg-utdata, inte bara
`needs`-resultatets pass/fail per JOBB, och är ett nytt beroende som låg
utanför `TASK-479.2`:s scope (dess Testbeslut-sektion omfattar bara svepets
egen rapportering). Uppföljning kortad: `TASK-483`.

### Varifrån `TASK-365` AC #3 är löst

`TASK-365` AC #3 ("Heartbeat-svepet rapporterar senaste nightly-körningens
rött som RÖTT-rad") löses av § SJUNDE VÄGEN ovan, men på en BREDARE primitiv
än den bokstavliga formuleringen: öppna nattärenden (GitHub Issues), inte
senaste körningens `conclusion`. Skälet är en ADR-086-prövning av kortets
egen hypotes (`gh run list --limit 1`): en grön NÄSTA körning säger inget om
huruvida ett ÄLDRE öppet ärende fortfarande väntar på svar — exakt det
tidsregeln ovan mäter. `gh issue list` är dessutom samma primitiv
`post-merge.yml`/`nightly.yml` SJÄLVA bygger sina ärenden mot, inte en ny
sanningskälla vid sidan av. Avvikelsen är bokförd på kortet, inte tyst.

## CodeQL — advanced setup (`TASK-464.2`)

Säkerhetsskanningen kör sedan `TASK-464.2` (S5,
[`actions-minutbudget-2026-09-18.md`](docs/research/actions-minutbudget-2026-09-18.md)
§ S5) som en egen arbetsflödesfil (`.github/workflows/codeql.yml`,
"advanced setup") i stället för GitHubs "default setup". Skälet är att
default setup saknar en väg att undanta sökvägar — en ren markdown-ändring
körde hela CodeQL-svitet ändå, mätt till ~13 % av augustis Actions-minuter.

**Frågesviternas uppdatering är nu VÅRT ansvar, inte GitHubs.** Default
setup underhölls automatiskt av GitHub — nya query-packs och
frågesvit-revisioner rullade ut utan att någon i repot behövde agera.
Advanced setup äger vi: `codeql.yml` låser språk (`javascript-typescript`,
`actions`) och lämnar `query_suite: default` (ingen `queries:`-override,
se filens eget huvud), men SJÄLVA CODEQL-VERKTYGET — `github/codeql-action`
— är en SHA-pinnad version precis som repots övriga actions, och den
pinningen rör sig inte av sig själv. Underhållspriset är alltså: när
`codeql-action` släpper en ny major/minor med reviderade default-frågor,
måste NÅGON i repot ta emot och landa den uppdateringen, annars fryser vi
tyst kvar på en äldre frågesvit medan default setup (som andra repon kör)
hade rullat framåt automatiskt.

**Var Dependabot fångar det:** `.github/dependabot.yml`s
`github-actions`-ekosystem (`directory: "/"`, `schedule: monthly`,
gruppen `github-actions`) skannar HELA repots `uses:`-yta månadsvis,
`github/codeql-action` inräknat — samma mekanism som håller
`actions/checkout`, `actions/setup-node` m.fl. aktuella. Ingen egen
Dependabot-post krävs för `codeql.yml` specifikt; den kommer med i den
befintliga, redan wirade svepningen. Vad Dependabot INTE fångar: om
GitHub byter namn på eller lägger till en CodeQL-språkidentifierare (t.ex.
en framtida ersättare för `javascript-typescript`) — den sortens ändring
kräver att någon läser `codeql-action`s CHANGELOG, inte bara följer en
versionsbump.

**D0-undantaget gäller BÅDE `pull_request` och `push` (Marcus-mandat,
2026-09-19, samma dag som förstaversionen).** Förstaversionen lämnade
`push` orörd ("push skannas enligt samma regel som i dag" löd AC #3
bokstavligt); Marcus skärpte kravet samma dag — en ren dokument-push till
huvudgrenen skannar kod som inte ändrats sedan den senast skannades, ren
spilld kostnad, medan ny frågekunskap mot oförändrad kod redan bärs av
`schedule` (veckovis, `0 5 * * 1`, oförändrad). `push` bär nu SAMMA
`paths-ignore`-lista som `pull_request` via en YAML-ANKARE
(`&d0-paths`/`*d0-paths` i `codeql.yml`) — inte en andra handhållen kopia;
`.listparitet-policy.conf`s par `klassning-codeql-positiv` behöver därför
bara vakta EN region, eftersom anlaget gör en avvikande kopia strukturellt
omöjlig.

**Vad detta kostar i skydd, citerat mot förstaparten:** GitHubs
dokumentation för `on:push`-triggerns syfte
(`docs.github.com`, "Customizing your advanced setup for code scanning" §
triggers, hämtat 2026-09-19) säger att push-analys låter "alerts
automatically surface on pull requests by comparing the head branch
analysis against the target branch analysis" — push-analysen är alltså
den baslinje en PR:s "nya larm"-jämförelse mäts mot. Skippas en push (D0)
uppdateras inte den baslinjen för just den commiten; nästa kod-push (52 %
av alla PR-körningar, § Kostnad nedan) uppdaterar den igen. Samma källa
beskriver varningsläget `Missing analysis for base commit SHA-HASH` för när
basgrenens SENASTE commit saknar analys — de tre dokumenterade orsakerna
(nytt repo, analys pågår, analys felade) nämner INTE "commit avsiktligt
hoppad via paths-ignore" som ett fjärde fall. Jag har alltså INTE hittat en
verbatim-mening som garanterar att jämförelsen "faller tillbaka på senaste
analyserade commit" för just vårt fall — det är en rimlig läsning av
mekaniken (`code-scanning/analyses` lagrar per REF, och en hoppad push
laddar aldrig upp något som skulle ersätta föregående analys för den
refen) men obelagd som garanti. Flaggat öppet per ADR-086, inte byggt på
som fakta. Skyddsnätet som gör kvarvarande gap ofarligt oavsett utfall:
`schedule` skannar huvudgrenens faktiska innehåll minst en gång per vecka,
så en analys blir aldrig äldre än sju dagar.

**Default setup och advanced setup kan INTE köra parallellt — mätt, inte
antaget.** `TASK-464.2`:s PR öppnades med default setup fortfarande PÅ (per
HÅRD GRÄNS: bygg-agenten stänger aldrig av repo-inställningar). Båda
matrisjobben (`javascript-typescript`, `actions`) körde CodeQL-analysen
fullt ut — databasbygge, frågeutvärdering, SARIF-export — men SARIF-
uppladdningen avvisades av GitHubs backend med exakt detta fel (PR #2558,
körning `35404550404`, båda jobben, 2026-09-18):

```text
##[error]Code Scanning could not process the submitted SARIF file:
CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled
```

**Konsekvens för bytesordningen:** den sekvens kortets AC #4 beskriver
("grön egen körning → jämför larmlistan → stäng av default setup") går INTE
att genomföra i den ordningen — en advanced-setup-körning kan mekaniskt
aldrig bli grön (uppladdningen fälls alltid) medan default setup är
aktivt. Den enda framkomliga ordningen är omvänd: (1) stäng av default
setup, (2) kör advanced setup och verifiera att uppladdningen lyckas, (3)
jämför larmlistan (`code-scanning/alerts`) före/efter avstängningen mot en
sparad ögonblicksbild tagen FÖRE steg 1. Steg 1 är en repo-inställning och
utförs av orkestreraren, aldrig av en agent.

**ROLLBACK — om den egna körningen INTE blir grön efter steg 1 (review
runda 2 fynd 6).** Skriven av bygg-agenten; utförs fortfarande enbart av
orkestreraren, som steg 1 ovan. Ordning:

1. **Stanna, försök inte laga vidare mot advanced setup** — ett rött
   `codeql.yml`-jobb efter att default setup redan stängts av är en signal
   att rulla tillbaka, inte att iterera i produktion.
2. **Återställ default setup**, med SAMMA språk/svit som mättes FÖRE bytet
   (`code-scanning/default-setup`-mätningen i denna PR-kropp/§ AC #1):

   ```bash
   gh api -X PATCH repos/high-five-group/miranon-media-admin/code-scanning/default-setup \
     -f state=configured \
     -f query_suite=default \
     -f runner_type=standard \
     -f threat_model=remote \
     -f 'languages[]=actions' \
     -f 'languages[]=javascript-typescript'
   ```

   **Käll-varning, mätt mot `docs.github.com`s REST-referens (denna
   endpoints `languages`-parameter), 2026-09-19:** skriv-sidans (PATCH)
   `languages`-enum accepterar ENDAST den unifierade `javascript-typescript`
   — INTE bara `javascript`/`typescript` separat, trots att LÄS-sidan (GET,
   det ursprungliga måttet) rapporterade fyra poster inklusive bara
   `javascript` och `typescript`. Ett rollback-anrop som skickar den RÅA
   fyra-postslistan från mätningen riskerar alltså att AVVISAS av API:t.
   Kommandot ovan använder den enda formen skriv-sidan dokumenterar.

3. **Verifiera att inställningen faktiskt är tillbaka:**

   ```bash
   gh api repos/high-five-group/miranon-media-admin/code-scanning/default-setup
   # förväntat: "state":"configured", "languages" innehåller
   # "actions" och "javascript-typescript", "query_suite":"default"
   ```

4. **Verifiera att SKANNINGEN är tillbaka** (inte bara inställningen) —
   default setup analyserar inte omedelbart vid PATCH; vänta på nästa
   push/PR eller det veckovisa schemat, sedan:

   ```bash
   gh api "repos/high-five-group/miranon-media-admin/code-scanning/analyses?per_page=5" \
     --jq '.[] | {ref, category, created_at}'
   # förväntat: en NY post med created_at EFTER PATCH-anropet,
   # category /language:javascript-typescript eller /language:actions
   ```

5. **Städa upp `codeql.yml`** i ett separat, medvetet steg (revert av denna
   PR eller en ny PR som tar bort filen) — annars fortsätter den advanced-
   setup-workflown att köra och röd-markera sig själv vid varje push/PR
   (samma `"CodeQL analyses from advanced configurations cannot be
   processed..."`-fel som § Samexistens ovan), utan att skada något (den
   är inte en required check) men som ren brus i Checks-fliken.

**Ändrar fortfarande INGA repo-inställningar själv** — detta är
dokumentation för orkestreraren att utföra, inte ett kommando bygg-agenten
kör.

**Stale/dubblerade larm vid bytet — riskerna, citerade, och varför de
undviks.** GitHubs felsökningssida "Two CodeQL workflows"
(`docs.github.com/.../troubleshoot-analysis-errors/two-codeql-workflows`)
beskriver exakt den situation en ofullständig övergång ger: *"Default
setup overrides existing CodeQL setups by disabling any existing CodeQL
workflows, and blocking any CodeQL analysis API uploads"* — vilket är
PRECIS felet som mättes ovan, från motsatt håll (default setup är den part
som blockerar). Samma sida namnger två symptom av att ha KVAR två
konfigurationer samtidigt: *"These configurations can generate duplicate
alerts"* och *"stale configurations that no longer run will display
outdated alert statuses, and the stale alerts will stay open
indefinitely"*.

Vår bytesordning (§ ovan) undviker båda, av konstruktion: när default
setup stängs av (steg 1) SLUTAR den producera analyser helt — det blir
aldrig två AKTIVA konfigurationer samtidigt, bara en avstängd och en ny.
"Dubblerade larm" kräver att båda parallellt skriver till OLIKA
identiteter för samma fynd; "stale" kräver att en konfiguration fortsätter
existera efter att den slutat köra. Ingetdera inträffar när ordningen
följs.

**Varför en fortsättning i stället för en duplicering — SARIF-
kategorierna matchar, mätt sida vid sida:**

| Källa | Kategori |
|---|---|
| Default setup, mätt `code-scanning/analyses` (fem körningar, 2026-09-18) | `/language:javascript-typescript`, `/language:actions` |
| `codeql.yml`, `analyze`-stegets `category:`-fält | `"/language:${{ matrix.language }}"` → `/language:javascript-typescript`, `/language:actions` |

Identiska. Kategori är en av de axlar GitHub använder för att gruppera
SARIF-resultat per (verktyg, kategori, ref) — matchande kategori plus
samma verktygsnamn (`CodeQL`, satt av `codeql-action` oavsett setup-typ)
betyder att advanced setups första lyckade uppladdning FORTSÄTTER samma
larm-identitet i stället för att öppna en parallell. Detta är en rimlig
läsning av den dokumenterade mekaniken (fingerprinting för att förhindra
dubblerade larm, `docs.github.com` "SARIF support for code scanning" —
samma sida `codeql-action`s egen loggtext länkar till), inte en verbatim
garanti för just detta scenario; flaggat i samma anda som
`push`-avsnittet ovan.

**Jämför larm PER IDENTITET, inte bara antal — exakt kommando:**

```bash
gh api "repos/high-five-group/miranon-media-admin/code-scanning/alerts?state=open&per_page=100" \
  --paginate \
  --jq '.[] | [.rule.id, .most_recent_instance.location.path, (.most_recent_instance.location.start_line|tostring), (.number|tostring)] | @tsv' \
  | sort > alerts-fore.tsv

# … stäng av default setup, kör en grön codeql.yml-körning …

gh api "repos/high-five-group/miranon-media-admin/code-scanning/alerts?state=open&per_page=100" \
  --paginate \
  --jq '.[] | [.rule.id, .most_recent_instance.location.path, (.most_recent_instance.location.start_line|tostring), (.number|tostring)] | @tsv' \
  | sort > alerts-efter.tsv

diff alerts-fore.tsv alerts-efter.tsv
```

Identiteten är `<regel-ID>\t<fil>\t<startrad>\t<larmnummer>` — `diff`-rader
som börjar med `<` är larm som FÖRSVANN (utred varje en, får aldrig vara
tyst förlorade); rader med `>` är NYA larm (förväntat om en verkligt ny
regel eller ändrad kod hittas, men kontrollera att de inte är dubbletter
av en `<`-rad med samma regel-ID+fil men annat radnummer — ett tecken på
att fingeravtrycket inte matchade). Provkört mot repots verkliga läge
2026-09-19: kommandot returnerar 9 rader (den nuvarande larm-baslinjen —
full lista i PR #2558:s kropp), format bekräftat.

## Acceptance-klassen

Termen bor här och i
[ADR-080](docs/decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md) —
inte i `ORDLISTA.md`, som bara tar projektspecifika domänbegrepp.

**Vad klassen bevisar:** att **appen** renderar och beter sig rätt givet ett
svar av rätt form. **Vad den inte bevisar:** att staging och Airtable
producerar svar av den formen — det är API-svitens uppgift, och den ligger
kvar bakom staging-mutexen just därför. Fogen mellan klasserna är svarsformen,
bevakad av att samma zod-scheman parsar fixturens svar som parsar skarpa svar.
Tillåts ett schema och en fixtur någon gång divergera faller hela argumentet;
den nattliga kontraktsvakten (§ Nattnätet) finns för att fånga det.

Klassen mockar Edge-funktioner **vi själva äger**. Det är en dokumenterad
kompromiss, inte förstahandsvalet: branschens väg ut — efemär skarp backend
per körning — är delvis stängd så länge Airtable-basen varken är självhostbar
eller klonbar. ADR-080 säger det rakt ut och ritar in omprövningen vid Fas E.

**Var den bor:** `tests/acceptance/`, projektet `acceptance`, sömmen
`tests/acceptance/acceptance-bas.ts` (platt fil sedan TASK-123 — katalogen
`tests/acceptance/support/` fanns bara för att härbärgera denna EN fil och
lästes som en falsk tvilling till den klassdelade fixturvärlden
`tests/support/fixturvarld/`; branschmönstret för en klasslokal söm är en fil,
inte en katalog med en fil i, se Cypress `support/e2e.js` + RTL:s
`test-utils`). Komponerad med Playwrights `mergeTests` ur fixturvärlden —
aldrig en egen kopia. Kör lokalt med `npm run test:acceptance`.

**CI:** eget jobb i `ci-suite.yml`, **utan staging-mutex och utan secrets** —
en PR som bara rör renderingen får svar utan att köa bakom `staging-tests`.
Jobbet är blockerande, som alla andra jobb i sviten; `continue-on-error`
används inte och ska inte införas (flaggan gör `needs`-resultatet till
`success` och hade tystat paraply-checken).

### Urvalet i PR-grinden (`TASK-75`)

Klassen kör **hela acceptance-svitens spec-filer** i normalfallet — räkna
aktuellt antal med `npx playwright test --project=acceptance --list` i
stället för att lita på ett hårdkodat tal här; svitens storlek växer
(TASK-106-felklassen: ett kopierat tal blir fel utan att någon märker det).
Rör din diff **enbart acceptance-spec-filer** — plus filer i docs-klassen,
till exempel kortet du bockar av — kör PR-grinden i stället **bara de
spec-filer du ändrat**.

Mekaniken är `scripts/acceptance-urval.sh`, kallad av `ci.yml`:s
`acceptance-urval`-steg och skickad vidare som `acceptance_selection` till
`ci-suite.yml`. Tre saker är värda att veta om den:

- **Den äger noll globar.** Den läser `changed-files`-stegets egen
  `other_changed_files`, alltså "de ändrade filer som inte matchade D0-listan".
  D0:s lista förblir enda hemvist för docs-klassningen — det finns ingen tredje
  kopia som kan drifta ([ADR-077](docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
  § Beslut 1).
- **Allowlist, aldrig blocklist.** Urvalet tillämpas endast när *varenda* post
  är en spec-fil som finns på disk. En källfil, den delade sömmen
  `tests/acceptance/acceptance-bas.ts` (platt fil sedan TASK-123 — faller
  fortfarande till full klass, nu för att namnet inte matchar
  spec-mönstret `*.acceptance.test.ts`, inte för att den ligger i en
  egen katalog), en workflow eller en okänd filtyp ⇒ **full klass**. Vid
  minsta osäkerhet körs allt.
- **Post-merge är nätet.** `post-merge.yml` och `nightly.yml` skickar ingen
  input och kör därför hela klassen på varje mergat träd. Ett urval som missar
  något fångas där, inom minuter — inte aldrig.

**Urval på källkod finns inte, och det är ett medvetet val.** Att mappa
`src/**` till spec-filer kräver en testgraf, och ADR-077 § Beslut 1 lämnar den
slotten öppen med avsikt. Playwrights inbyggda `--only-changed` duger inte som
genväg: dess graf är testfilernas modulgraf, inte appens. Mätt 2026-07-29 på
`playwright 1.61.1` — en ändrad `src/routes/_authenticated/hem.tsx` gav
`Total: 0 tests in 0 files`, alltså exakt den falska grönt-klassen urvalet
finns för att undvika.

**Att skriva ett test i klassen:**

- Normalläget — svaren varje test får utan att säga något — bor i
  `tests/support/fixturvarld/handlers.ts`. Lägg bara till där när svaret ska
  gälla ALLA tester.
- Behöver ETT test ett annat svar: skriv **ingen** egen fixturvärld,
  överskugga lokalt med `network.use(...)`. Bygg mönstret med `EF(namn)` och
  svaret med `json(...)` ur `handlers.ts` — då kan överskuggningen inte drifta
  ifrån det normalläget matchar, och CORS-huvudet kan inte glömmas.
- **Den tysta fällan:** matchar överskuggningens mönster inte det faktiska
  anropet fälls INGENTING — anropet faller igenom till normalläget och testet
  ser det i stället för sitt specialfall. Ett överskuggat test som beter sig
  precis som utan överskuggning ska misstänkas för det. Fullständig
  beskrivning i `hermetic.ts` § Överskugga en delad handler.
- Testa **externt beteende** — aldrig att en handler anropades eller hur många
  gånger. Det vore att testa fixturen.

**Vakten är avbrytande här.** Ett anrop som ingen handler täcker fäller testet
med sin egen URL namngiven och instruktionstext i klartext. En fil som flyttats
hit för tidigt ska bli röd, aldrig grön av fel skäl.

**Att flytta en fil hit kräver tvåsidigt bevis:** att den passerar hermetiskt,
OCH att vakten fäller när dess mockar tas bort. Utan det andra ledet är
hermetiken en förhoppning. Klassningen ska dessutom vara HÄRLEDD ur
hermetik-mätdatan (`PLAYWRIGHT_HERMETIK_RAPPORT=1`), inte handplockad —
räkningen redovisas i PR:n.

## Webbläsarbeteende-klassen

Termen bor här och i
[ADR-094](docs/decisions/ADR-094-webblasarbeteende-testklass.md) — inte i
`ORDLISTA.md`, av samma skäl som acceptance-klassen (§ ovan): en testklass är
inte ett projektspecifikt domänbegrepp.

**Bakgrund (TASK-131):** PRD task-126 § Testbeslut skickade `InstallPrompt`s
11 tester till acceptance-klassen. `scripts/hermetik-sjalvtest.mjs` (ADR-080
beslut 3, VILLKOR för klassens existens) fällde alla 11 — de överlever utan
fixturvärldens svar, eftersom komponenten har **noll databeteende**: hooken
läser `navigator.userAgent`/`platform`/`maxTouchPoints`, `matchMedia` och
lyssnar på `beforeinstallprompt`/`appinstalled`, aldrig ett nätverkssvar.
Vakten gjorde rätt; placeringen var fel. Marcus beslut (TASK-131, alternativ
A): en egen klass för den sortens test, i stället för ett undantag i vakten
(alternativ B, förkastat — det hade urholkat exakt det ADR-080 gjorde
konstitutivt) eller en konstlad koppling till fixturdata komponenten inte rör
(alternativ C, förkastat).

**Vad klassen bevisar:** att en komponent detekterar plattform/tillstånd och
beter sig rätt givet webbläsar-API:er och -events — `navigator`, `matchMedia`,
DOM-events, tangentbord, ARIA. **Vad den inte bevisar, och aldrig ska försöka
bevisa:** något om ett nätverkssvar. Ett test som behöver ett svar av rätt
FORM hör hemma i acceptance-klassen (§ ovan); ett test som behöver en axe-scan
hör hemma i a11y.

**Skillnaden mot acceptance-klassen är gränsen den dras vid, inte hermetiken.**
Båda klasserna är MUTEXFRIA och secret-fria. Acceptance kräver fixturvärlden
(MSW) eftersom dess tester **har** ett databeteende att bevisa formen av.
Webbläsarbeteende-klassen har inget sådant beroende — dess tester rör sig
ALDRIG över nätverket, per konstruktion — och bär därför **ingen**
hermetik-vakt-motsvarighet: `hermetik-sjalvtest.mjs` bevisar att acceptance-
testerna hänger på fixturvärlden, ett bevis som förutsätter att det finns en
fixturvärld att hänga på. Att bygga samma bevisform här hade varit teater —
det finns inget att ta bort för att visa att ett test fäller. (`PROJEKT` i
`hermetik-sjalvtest.mjs` är hårdkodat till `'acceptance'` och rör aldrig denna
klass — oförändrat av TASK-131.)

**Var den bor:** `tests/webblasarbeteende/`, projektet `webblasarbeteende`,
egen alltid-färsk dev-server på dedikerad port 5499 (samma stale-server-skydd
som a11y/visual/acceptance: `reuseExistingServer: false` + `--strictPort`, så
klassen kan köras SAMTIDIGT som de andra tre lokalt). Kör lokalt med
`npm run test:webblasarbeteende`.

**Appen bootar mot samma fiktiva `visual-fixture`-URL som acceptance/visual**
(`src/env.ts` kräver bara ett giltigt URL-format; `AuthProvider.getSession()`
läser enbart local storage vid mount och gör aldrig ett nätverksanrop dit på
en fräsch sida) — men klassen har INGEN MSW och ingen fixturvärld att
komponera med. URL-värdet är en platshållare för app-boot, inte en fixtur
klassens tester konsumerar.

**Google Fonts pinnas inte.** Samma val som a11y (`tests/a11y/fixtures.ts` har
ingen route-interception alls) — a11y har kört så sedan Fas 3.5 utan att det
kostat CI-tillförlitlighet. Att bygga font-pinning bara för denna klass hade
varit en andra, oberoende hemvist för en egenskap a11y redan bevisat vara
onödig.

**CI:** eget jobb i `ci-suite.yml`, **utan staging-mutex och utan secrets** —
exakt samma motivering som Acceptance-jobbet. Jobbet är blockerande, som alla
andra jobb i sviten (inget `run_x`-villkor, inget Dependabot-skip — jobbet
kräver inga secrets och rör aldrig staging, samma logik som `Pure + Build`).
Mätt LOKALT (macOS, 11 tester): 18,1–29,2 s helsvit — ingen CI-mätning
projicerad, se § Flakighet mäts med riggen ovan för varför den skillnaden
hålls isär. Klassen är i skrivande stund långt under både acceptance (~400 s)
och a11y (~100 s) och ligger därmed inte på kritiska vägen — men ingen A7:6-
liknande flytt till post-merge görs utan samma mätta process TASK-70.4
gjorde: att flytta en ny klass ur presubmit UTAN den mätningen vore att göra
halva A7:6:s jobb utan halva dess bevis.

**Bevis i båda riktningar (TASK-131):** att klassen fångar en regression
verifierades skarpt genom att tillfälligt bryta plattformsdetekteringen
(`detectBasePath` i `useInstallPrompt.ts`, iOS-grenen villkorad bort) och köra
`npm run test:webblasarbeteende` — 2 av 11 tester föll med rätt
felsignatur (`toHaveText` väntat `'ios-manuell'`, fick `'chromium-prompt'`),
ändringen reverterades, sviten grön igen (11/11). Ett grönt jobb utan den
kontrollen bevisar bara att inget rört komponenten sedan sist, aldrig att
jobbet KAN se ett fel.

## Visuell regression

**Läge: BYGGD men PR-grinden MEDVETET INAKTIV** (Marcus-beslut A, S81 —
tidig UI-fas; aktiverings-steget bor komplett i tråd
[T87](tasks/threads/T87-visual-grind-aktivering.md), trigger: UI-takten
lugnar). Tills grinden aktiveras körs jämförelsen LOKALT på begäran
(`npm run test:visual`), inte i CI — sanningsfix per
Codex-eftergranskningen 2026-07-24.

Infrastrukturen: incheckade referensbilder (task-36.7) för sex
facit-tunga vyer × två vyportar i en hermetisk fixturvärld
(`tests/support/fixturvarld/` — mockade EF-svar, seedad session, pinnad Inter,
frusen klocka; noll staging, noll mutex). Jämförelsen kör
`--update-snapshots=none`: saknad eller avvikande baseline failar hårt.
När grinden aktiveras (T87) gäller detta som blockerande CI-jobb för
UI- och full-klassen.

**Baselines föds i CI, aldrig lokalt.** Skärmbilder är plattformsbundna —
endast `-linux`-bilder checkas in. Födseln sker via `visual-baselines.yml`
(avfyrbar): den genererar bilderna i rätt miljö och öppnar en baseline-PR,
så varje ändring av vad som anses korrekt är en diff någon GRANSKAT — aldrig
en tyst uppdatering. PR:ns CI står i approval-required-läge (»Approve
workflows to run«) tills granskaren släpper den: samma blick som godkänner
bilderna släpper grinden (medvetet GITHUB_TOKEN-formen — noll extra
secrets).

**Riktad födsel finns sedan `TASK-298` — normalvägen är fortfarande hela
sviten.** Dispatchen bär en VALFRI input `specfilter`: ett regex mot
spec-sökvägen (Playwrights positionsfilter), t.ex.
`personer-promoverings-grind` eller `notis-visual|personer`. Lämnas den tom
kör workflowen exakt som förr. Skälet den finns: körningen är
allt-eller-inget, så en enda familjs röda test blockerar hela födseln — mätt
i run `32587783890` (238 passed, 8 failed, samtliga åtta i hem-familjen,
noll PR skapad, och därmed kunde notisfamiljens och personlistans baslinjer
inte födas).

Två egenskaper gör den till ett verktyg i stället för en fälla, och båda är
grindade av `scripts/test-visual-baselines-scope.sh` (CI-wirad):

- **Scopet syns för granskaren.** En riktad körning märks i grennamnet
  (`visual-baselines/riktad-run-…`), i PR-titeln och i PR-kroppen, där
  filtret och de faktiskt körda spec-sökvägarna skrivs ut. Läs en sådan PR
  som en delmängd: att en vy saknas i diffen betyder INTE att den är
  oförändrad — den kördes aldrig.
- **Fail-closed på skräp-input.** `scripts/visual-baselines-scope.sh` prövar
  inputen och löser upp den mot Playwrights egen fil-lista FÖRE
  bildgenereringen. Ogiltiga tecken, ledande bindestreck, överlängd eller
  noll matchande specar dödar jobbet där — aldrig en tom PR, aldrig en tyst
  full körning.

Approval-grinden och GITHUB_TOKEN-formen är orörda. Fullständigt WHY (varför
inputen når skalet exakt en gång, och varför den aldrig interpoleras in i ett
`run:`-block): workflow-filens eget huvud, `.github/workflows/visual-baselines.yml`
§ RIKTAD KÖRNING.

**Kadens-regeln:** en uppgradering av webbläsare eller testverktyg
(Playwright-bump, Chromium-drift) ger FÖRVÄNTAD baseline-drift. Den
hanteras med en baseline-PR granskad IHOP med uppgraderingen — visual-jobbet
körs därför även på Dependabot-PR:er (inga secrets behövs), så driften blir
synlig på själva uppgraderings-PR:n i stället för att landa tyst och fälla
nästa orelaterade UI-ändring.

**Lokalt:** `npm run test:visual` (egen dev-server på port 5299 med
fixtur-env). Första lokala körningen föder `-darwin`-bilder — de är
PERSONLIGA jämförelse-baselines, gitignorerade, och ska aldrig checkas in.

## Lokala dev-verktyg (frivilligt)

Utöver `npm install` (se [README](README.md#snabbstart)) finns CI-grindvakter
som inte kör automatiskt lokalt. Kör dem i förväg om du vill fånga fynd före
push:

| Verktyg | Install (macOS) | Kör |
|---|---|---|
| yamllint | `brew install yamllint` *eller* `pipx install yamllint` | `yamllint .github/` |
| markdownlint-cli2 | `npm install` (devDependency) *eller* `brew install markdownlint-cli2` | `npx markdownlint-cli2` |
| scripted-checklist-check | (ingår i repo via `scripts/`) | `bash scripts/check-public-checklists.sh` |
| frontmatter-validator | (ingår i repo via `scripts/` + `.frontmatter-policy.conf`) | `bash scripts/check-frontmatter.sh` |
| Vale | `brew install vale` | `vale "docs/" "tasks/" "README.md" "CHANGELOG.md" "SECURITY.md" "CONTRIBUTING.md"` |

typos övervägdes men avvisades per K3-baseline 2026-05-14
(tool-uppgift-mismatch; stavnings-substans flyttades till Vale).

### Agent-spawn-mätningen

```bash
npm run metrics:agents
```

Svarar på hur ofta subagenter spawnas **utan** worktree-isolering, och därmed om
de typade agenterna i `.claude/agents/` räcker som mekanism. Underlaget skrivs
löpande av en icke-blockerande `PreToolUse`-hook till
`.claude/agent-spawn-log.jsonl` (gitignorerad — den beskriver den lokala
maskinens sessioner, inte repots tillstånd). Hooken är
[`scripts/agent-spawn-log.sh`](scripts/agent-spawn-log.sh); den får **aldrig**
blockera en spawn, och dess testsvit är `scripts/test-agent-spawn-log.sh`.

**Loggen bär två format, och brytpunkten är avsiktligt synlig.** Fram till
2026-07-28 loggade hooken `isolation` = anropets parameter, som bara är satt när
anroparen skickar den explicit. Eftersom isoleringen i praktiken kommer ur
agentdefinitionens frontmatter fick varje typad agent `isolation: null` trots att
den körde i egen worktree — mätaren pekade åt det farliga hållet. Från och med
restlistans `A7:2` loggas den **effektiva** isoleringen, plus ett nytt fält
`isolation_kalla` (`frontmatter` · `param` · `null`) som säger vilken av de två
källorna som bar den. De äldre raderna står kvar som de är; `metrics:agents`
räknar dem via en frontmatter-slagning och märker dem *äldre form* i utskriften.

**Läs den innan `permissions.deny` eller en tvingande hook övervägs.** Hela
poängen med steget är att beslutet ska vila på siffror i stället för åsikter;
mätningen är beställd av
[ADR-082-passet](docs/research/hook-mekanisering-worktree-isolering-2026-07-28.md)
som steg 2 av fyra.

En oisolerad spawn är **inte** automatiskt ett fel — en rent läsande agent
behöver ingen worktree. Skriptet skiljer därför på spawns från huvudkatalogen
(där kollisionsrisken finns) och spawns som redan sker inifrån en worktree.

## Verktygsval före nybygge — stående krav (`A3b`)

Innan ett nytt skript eller verktyg byggs i repot: gör
verktygsvals-prövningen — *"hur löser branschledarna detta?"* — och
**redovisa utfallet skriftligt även när domen blir "bygg eget"** (i kortet,
ADR:n eller research-doket som bär bygget). En dom utan nedskrivna skäl kan
varken försvaras när den ifrågasätts eller ärvas av nästa agent.

Kravet är stående sedan 2026-07-27 (S91, restlistans § A3b). Formerna att
härma:
[verktygsvals-passet](docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md)
(fyra prövningar med domar och motiv) och
[ADR-081 § Verktygsvalet](docs/decisions/ADR-081-nummer-tilldelas-vid-landning.md)
(retroaktiv redovisning som öppet klassar sina skäl som resonemang, inte
mätning).

## Kvalitetsribba

Detta projekt arbetar mot **11/11/11**: 11/10 på de tre kanoniska axlarna
**Tillgänglighet**, **Teknik** (teknisk kvalitet) och **Återanvändbarhet**.
Axlarna och deras definitioner ägs av [`docs/specs/KVALITETSDEFINITIONER-11-REACT.md`](docs/specs/KVALITETSDEFINITIONER-11-REACT.md)
(kanonisk källa), konsistent med `CLAUDE.md` Kvalitetsribba-tabellen.

## Resurser

- [`CLAUDE.md`](CLAUDE.md) — projekt-konstitution (läs först)
- [`docs/byggplan.md`](docs/byggplan.md) — styrande fas-plan
- [`docs/decisions/README.md`](docs/decisions/README.md) — ADR-katalog
- [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) — kronologisk sessions-journal
- [`tasks/lessons.md`](tasks/lessons.md) — universella lärdomar
- [`tasks/todo.md`](tasks/todo.md) — aktuell todo-status
