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
| `npm run test:a11y` | Axe-runner (egen dev-server på port 5199) |
| `npm run test:visual` | Visuella regressionstester |
| `npm run test:preview:staging` | Byggt staging-bygge på preview-porten 4173: bygge → bundelgrind → login/Hem-bevis (TASK-10) |
| `npm run purge:staging` | Sentinel-purge av staging-basen (setup-purge, ADR-060) — kräver `.env.seed`; `-- --dry-run` för plan utan radering |

Lokal browser-verifiering/QA mot staging via byggt bygge har fem kända
fällor (fel-mode-bundle, CORS-blockerad port, saknade test-env-vars,
stale node_modules efter merge, service worker på dev-originet) — recept
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

CI drabbas aldrig av kollisionen — den kör staging-projekten som separata
sekventiella steg (`.github/workflows/ci.yml` `test-staging`; Test+Build
splittades S77 i `test-fast`/`a11y`/`test-staging` där ENDAST
`test-staging` bär staging-mutexen); samma
kollisionsklass hanteras mellan CI-runs av `concurrency: staging-tests` och
mellan parallella lokala pipelines av staging-semaforen
([ADR-073](docs/decisions/ADR-073-parallella-batch-pipelines.md) beslut 3+4).
Serialisering via projekt-dependencies i `playwright.config.ts` förkastades:
`--project`-anrop drar in dependencies transitivt, vilket hade svällt CI:s
e2e-stegs testmängd (bevisat 148 → 259 tester) och fällt steget på saknade
admin-secrets — TASK-6-kortets notes bär hela beviskedjan.

## Definition of Done — per session

- [ ] `npm run test:api` grön (eller motsvarande relevant test-svit)
- [ ] `npm run typecheck` 0 fel
- [ ] `npx @biomejs/biome check .` 0 fel
- [ ] `npm run build` grön
- [ ] CI grön **per jobb** på pushad commit — verifieras med `bash scripts/ci-wait.sh --commit "$(git rev-parse HEAD)"` (topp-nivåns `conclusion` är inte beviset; skippade jobb blockerar inte men bevisar ingenting, L322). Efter push: använd det lokala SHA:t, inte `--pr` — GitHubs PR-API kan returnera föregående head i sekunderna efter push
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

## Visuell regression

**Läge: BYGGD men PR-grinden MEDVETET INAKTIV** (Marcus-beslut A, S81 —
tidig UI-fas; aktiverings-steget bor komplett i tråd
[T87](tasks/threads/T87-visual-grind-aktivering.md), trigger: UI-takten
lugnar). Tills grinden aktiveras körs jämförelsen LOKALT på begäran
(`npm run test:visual`), inte i CI — sanningsfix per
Codex-eftergranskningen 2026-07-24.

Infrastrukturen: incheckade referensbilder (task-36.7) för sex
facit-tunga vyer × två vyportar i en hermetisk fixturvärld
(`tests/visual/support/` — mockade EF-svar, seedad session, pinnad Inter,
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
