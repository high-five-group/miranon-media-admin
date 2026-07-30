# Bidrag

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
| `npm run test:a11y` | Axe-runner (egen dev-server på port 5199) |
| `npm run test:visual` | Visuella regressionstester |
| `npm run vakt:kontrakt` | Kontraktsvakten: fixturvärlden mot skarp staging (nattlig i CI, körbar lokalt med `.env.test` — se § Nattnätet) |
| `npm run test:preview:staging` | Byggt staging-bygge på preview-porten 4173: bygge → bundelgrind → login/Hem-bevis (TASK-10) |
| `npm run purge:staging` | Sentinel-purge av staging-basen (setup-purge, ADR-060) — kräver `.env.seed`; `-- --dry-run` för plan utan radering |
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
testerna lämnar markör-märkta rader i staging-basen
(`create-test+…@staging.test` i Anmälningar, `Ort='ZZ-create-event-test'` i
Eventplanering). CI städar dem automatiskt i jobbet **Staging sentinel
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
| `purge:staging` | `main()` i `scripts/purge-staging-sentinels.mjs` |
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
kvar på alla fem ytorna, och körs av `ci.yml`-jobbet `Lint + Audit + TypeCheck`.
Playwright-ytorna prövas mot Playwrights EGEN dependency-upplösning
(`--list`), inte mot en regex över configen; Node-ytorna mot att anropet ligger
i `main()`. Vad som räknas som yta — och vilka projekt som är undantagna, med
skäl — bor i `.staging-preflight-wiring-policy.json`; ett nytt Playwright-projekt
eller ett nytt `scripts/`-skript som rör staging fäller vakten tills det
klassats. Tvåsidigt bevis per yta:
`scripts/test-check-staging-preflight-wiring.mjs`.

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
- [ ] Om sessionen ändrade app↔Airtable-interaktionen (EF läser/skriver, filter-mönster, write-allowlist, helper-API): förd till `docs/reference/airtable-interaction.md` (fil:rad-belägg + commit-sha) + dess ändringslogg
- [ ] Om sessionen ändrade samarbets-systemets MEKANIK (ny/borttagen disciplin-skill, reviderad roll-arkitektur, ny governing-/distributions-mekanism, nytt lifecycle-verb): förd till hubbens `SYSTEMET.md` + dess ändringslogg. Tillstånds-ändringar (governing-listans antal, plugin-version, radnummer) triggar INTE uppdatering — doket pekar redan till källan för dem
- [ ] `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` uppdaterad om sessionen har implications för icke-tekniska läsare (per ADR-025)
- [ ] Commits pushade

## Definition of Done — per fas

Utöver per-session-DoD ovan, vid fas-avslut gäller också:

- [ ] `docs/byggplan.md` §2 fas-tabell uppdaterad — fas ✅ KLAR + datum + ev. estimat-summa-justering. Ny `v1.N`-rad i Versionshistorik.
- [ ] `README.md` Status-rad + Projektstatus-sektion + ADR-räkning + Scripts-tabell konsistent med repo-state.
- [ ] `CHANGELOG.md` ny release `[X.Y.0]` med Keep-a-Changelog-kategorier (Added/Changed/Security/Fixed) + compare-länkar.
- [ ] Sessionsdok arkiverad till `tasks/sessions/archive/<år>-<månad>/` via `git mv` + trail-link-uppdateringar atomiskt per Kandidat 1 (semantisk path-ref vs mekanisk prefix-fix-disciplin).
- [ ] UNIVERSAL-lessons hub-synkade till `~/Repon/marcus-system/tasks/lessons.md`.
- [ ] Fas-avsluts-verifierings-rutin körd (se `CLAUDE.md` motsvarande sektion) — cross-doc-grep-check att alla 5 styrande + 3 publika dokument säger samma sak.

Detta är 11/10-disciplinens systemiska skydd mot drift mellan dokument (Kandidat 12-systematisk-tillämpning). Etablerad 2026-05-13 efter Fas 2-avslut exponerade systematisk blind fläck i per-session-checklistan.

## Pull Request-flöde

**Mekaniskt enforce:at sedan 2026-07-23** (ruleset `main-skydd`,
[ADR-076](docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)):
ALLT når `main` via PR — direktpush avvisas av GitHub. PR:n kan mergas
först när required-checken **"CI Passed or Skipped"** är grön på senaste
SHA med up-to-date branch; force-push och deletion av `main` är
blockerade. Bokförings-PR:er (docs/backlog/sessionsdok) landar via
auto-merge (`gh pr merge --auto --merge`).

PR till `main` triggar CI (`.github/workflows/ci.yml`). Utöver den
mekaniska grinden gäller:

- Marcus har godkänt (kod-/UI-ändringar; design-review-grinden per L310 —
  ren bokföring auto-mergar på grön CI)
- DoD-checklistan i PR-mallen är fylld
- ADR refererad om arkitekturbeslut tagits

### Landnings-ordningen — mekaniserad som merge queue sedan 2026-07-29

**Utlösaren först. Känner du inte igen läget tillämpar du inte regeln.** Tre
villkor samtidigt:

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
formerna A och B utförde för hand. **Armera med `gh pr merge --auto --merge`
och sluta tänka på ordningen.**

Kö-parametrarna, med skälen:

| Parameter | Värde | Varför |
|---|---|---|
| `merge_method` | `MERGE` | måste matcha rulesetets `allowed_merge_methods` |
| `min_entries_to_merge` | `1` | en ensam PR landar direkt; vore den 2 väntade varje PR på sällskap |
| `grouping_strategy` | `ALLGREEN` | varje PR i gruppen måste vara grön, inte bara gruppens head |
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

**Den upphävda manuella formen bevaras nedan** — inte som instruktion, utan för
att den förklarar varför kön behövdes. Följ den inte; den är historik.

- ~~**Form A · tyngst först.**~~ Armera den PR vars svit är längst, låt den landa,
  armera nästa därefter. En kort svit hinner ikapp en lång; det omvända gäller
  inte.
- ~~**Form B · `gh pr update-branch` före armering.**~~ Ska en snabb PR ändå
  landa först: uppdatera nästa PR:s gren mot `main` och armera först därefter.

Den gamla regeln löd: *armera aldrig två PR:er samtidigt i hopp om att de klarar
sig; att laga `BEHIND` i efterhand är inte formen, då har svit-fönstret redan
öppnats en gång i onödan.* Resonemanget var riktigt — det är just det arbetet
kön nu utför utan att någon behöver minnas det.

**Bikostnad som hör till form B: CI-vakten måste startas om.** En vakt följer
det SHA den startades mot. `update-branch` skriver en ny commit på grenen, och
i samma stund vaktar den ett SHA som inte längre är HEAD; `cancel-in-progress:
true` (`ci.yml`) avbryter dessutom den pågående körningen, som då rapporteras
`cancelled`. **Stoppa vakten och starta om den mot det nya SHA:t** — annars
byter regeln bara en felklass mot en annan. `scripts/ci-wait.sh` skiljer redan
superseddad (`exit 4`) från röd (`exit 1`) för exakt detta fall: exit 4 är
inget grönt bevis utan en hänvisning till efterträdaren.

**Form B kräver att grenens agent är klar.** `update-branch` pushar till
grenen, och varje push avbryter grenens pågående körning. Kör den aldrig mot en
gren vars bygg-agent fortfarande arbetar — i S91 avbröt orkestrerare och agent
varandra två gånger, en gång **12 minuter in i en grön körning**.
`BEHIND`-hantering hör till orkestreraren, men först efter agentens
slutrapport.

**Agenterna armerar inte — det är andra halvan av samma kontrakt.**
`.claude/agents/bygg-agent.md` föreskriver att en bygg-agent öppnar sin PR och
lämnar armeringen ifrån sig, eftersom ordningen bara kan väljas av den som ser
hela kön. Agenten avstår, orkestreraren sekvenserar.

**Avgränsning: detta är sekvensering för hand, ingen kö-automat.** GitHub merge
queue är branschverktyget för just denna klass, men den är en egen öppen post
(restlistan A4) och prövas mot vår staging-mutex separat. Den föregrips inte
här — tills den finns är ordningen en aktörs ansvar, och formerna ovan är hela
mekaniken.

**Varför regeln står här och inte bara som lärdom.** `L328` har varit
nedskriven sedan S81 och beskriver mekanismen korrekt. Ändå gick orkestreraren
i samma fälla **två gånger under en och samma resume** 2026-07-28: `#313` gick
`BEHIND` när `TASK-61` landades medan `59.5`:s PR låg i luften, och `#316`
gjorde det igen — andra gången rättat före armering i stället för efter. En
lärdom i prosa skyddar bara den som råkar läsa den vid rätt tillfälle. Därför
står regeln vid sidan av armerings-kommandot den gäller, i den sektion som
redan äger `gh pr merge --auto --merge`.

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
| **Bygg-agent** | Förbereder gren, revert-commit och PR — och **armerar aldrig mergen**, samma kontrakt som i § Landnings-ordningen. |
| **Orkestreraren** | Armerar mergen (slår på auto-merge med `gh pr merge --auto --merge`, så PR:n landar av sig själv när CI blir grön), sekvenserar kön och följer CI till grönt. |

Vad brådskan däremot ändrar är **köordningen**: revert-PR:n armeras FÖRST, och
andra landningsklara PR:er får vänta och uppdateras efteråt. Det är form B i
sektionen ovan, inte ett undantag från den. Att armera revert-PR:n samtidigt med
en annan PR är precis den fälla § Landnings-ordningen beskriver — och den fällan
kostar just den tid reverten skulle spara.

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
landar. Blir revert-PR:n `BEHIND` gäller § Landnings-ordningens form B.

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

**Exponeringsfönstret — hur länge ett fel kan ligga i `main`.** Fyra led, vart
och ett mätt i övningen nedan 2026-07-28:

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

Klassen avgör resten. Backas dokumentation kör CI docs-klass (ADR-077); backas
kod bärs PR-grindens kritiska väg av `Acceptance (hermetisk)`, mätt till
404–452 s. Ett kod-fel kan alltså vara ute ur `main` inom omkring åtta minuter
från beslut, ett docs-fel inom drygt en — plus armeringen, som är det enda led
som ännu inte är mätt.

**Det talet blev förutsägbart med `TASK-70.3`, inte lägre.** Fram till dess bar
en kod-PR även `Staging (API + E2E)` (375 s) *plus* kö på den globala
`staging-tests`-mutexen, och det var kön som gjorde en brådskande revert
oberäknelig. Staging kör numera post-merge (§ Post-merge-lagret), så en
revert-PR:s väg genom grinden beror bara på dess egen svit.

**Och taket ligger kvar kring sju minuter — `TASK-75` sänkte det inte för denna
väg.** Urvalet (§ Acceptance-klassen → Urvalet i PR-grinden) fäller ut endast
när diffen rör *enbart* acceptance-spec-filer. En revert av en kodändring rör
per definition källkod, faller därför till full klass, och betalar samma
422–433 s som förut. Backas i stället en acceptance-spec landar reverten på
delmängden. Skillnaden är värd att veta i förväg: den avgör om du ska räkna med
en minut eller sju när något brådskar.

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
nya talet är inte mätt än och skrivs in här först när nästa skarpa revert ger
det — ett projicerat tal är ingen mätning. `TASK-70.3` tar dessutom bort det
andra ledet i samma väntan: en revert-PR köar inte längre bakom mutexen alls,
eftersom ingen PR-körning tar den. Kvar som möjlig fördröjning är enbart
post-merge-lagrets egen körning på en *föregående* landning, och den blockerar
inte grinden.

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
`EN KÄLLA`, annan tidpunkt. Av de fem tunga jobben instansierar PR-grinden efter
detta två: `Pure + Build` och `Acceptance (hermetisk)`.

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
`ci-post-merge`) med de röda jobben, föregående post-merge-körnings utfall och
ett revert-förslag med rätt `-m`-form. Samma stängningsregel som nattnätet
nedan: åtgärd, genomförd revert eller öppet skriven motivering — aldrig tyst.
Ärendet bär en tolkningshjälp som ska läsas FÖRE revert; en ensam röd
`Acceptance (hermetisk)` kan vara `TASK-64`:s kända flake, och en ensam röd
mätning betyder att mätningen gått sönder, inte `main`.

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

En röd nattkörning skapar automatiskt ett tilldelat ärende (etikett
`ci-natt`) med länk till körningen och commit-spannet sedan senaste gröna
natt.

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

Vakten kontrollerar öppna `ci-natt`-ärenden före den skapar ett nytt, så du
aldrig får dubbla ärenden om samma natt.

**Bevis-läge:** kör vakten via `workflow_dispatch` med `simulate_missing:
true` för att avfyra larmkedjan utan att invänta en äkta incident. En
otestad dödmansgrepp ger falsk trygghet — därför är läget en del av
konstruktionen, inte en eftertanke. Städa testärendet med motivering.

**Öppet bokförd begränsning:** vakten är själv en schemalagd körning och
ärver därmed den defekt den ska täcka. Den fångar det vanliga fallet (en
enskild körning tappas eller vägrar starta) men inte det sällsynta att hela
schemaläggningen ligger nere. Att bryta den rekursionen kräver en klocka
utanför GitHub.

**Stängningsregel — ett nattärende stängs ALDRIG tyst.** Antingen (a) åtgärdas
grundorsaken, eller (b) skrivs en öppen motivering ut i ärendet innan det
stängs. Regeln är larmkedjans motgift mot kyrkogårdseffekten: ett larm ingen
läser är värdelöst, och tyst stängning gör larmet till en kyrkogård.

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
`tests/acceptance/support/acceptance-bas.ts` (komponerad med Playwrights
`mergeTests` ur den **klassdelade** fixturvärlden `tests/support/fixturvarld/`
— aldrig en egen kopia). Kör lokalt med `npm run test:acceptance`.

**CI:** eget jobb i `ci-suite.yml`, **utan staging-mutex och utan secrets** —
en PR som bara rör renderingen får svar utan att köa bakom `staging-tests`.
Jobbet är blockerande, som alla andra jobb i sviten; `continue-on-error`
används inte och ska inte införas (flaggan gör `needs`-resultatet till
`success` och hade tystat paraply-checken).

### Urvalet i PR-grinden (`TASK-75`)

Klassen kör **alla 18 spec-filer** i normalfallet. Rör din diff **enbart
acceptance-spec-filer** — plus filer i docs-klassen, till exempel kortet du
bockar av — kör PR-grinden i stället **bara de spec-filer du ändrat**.

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
  `tests/acceptance/support/**`, en workflow eller en okänd filtyp ⇒ **full
  klass**. Vid minsta osäkerhet körs allt.
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
