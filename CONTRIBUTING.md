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

CI drabbas aldrig av kollisionen — den kör projekten som separata
sekventiella steg (`.github/workflows/ci.yml` Test+Build); samma
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

PR till `main` triggar CI (`.github/workflows/ci.yml`) som kör Biome + tsc + test:api + build.
PR mergas först när:

- CI är grön
- Marcus har godkänt
- DoD-checklistan i PR-mallen är fylld
- ADR refererad om arkitekturbeslut tagits

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
