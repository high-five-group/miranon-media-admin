# Bidrag

Detta är ett privat projekt med en tydlig roll-fördelning mellan tre aktörer.

## Aktörer

| Aktör | Roll | Verktyg |
|---|---|---|
| **Marcus** | Projektägare, beslut, kvalitetsbärare | claude.ai (Chat) + terminal (Code) |
| **Claude Chat** | Strategi, planering, dokumentation, sessions-trail | Web-baserad chat (claude.ai/projects/...) |
| **Claude Code** | Implementation, git, filhantering, verifiering | Terminal (`claude` CLI) |

Hub-and-spoke-system: globala principer i `~/Repon/marcus-system/CLAUDE.md`,
projekt-specifika i detta repos `CLAUDE.md`. Universella lärdomar märkta
`[UNIVERSAL]` flödar från spoke till hub.

## Sessions-disciplin

Sessioner körs enligt mönstret etablerat i `marcus-system/CLAUDE.md`:
LÄS → RAPPORTERA → PLANERA → IMPLEMENTERA → VERIFIERA → DOKUMENTERA + COMMITTA → EFTER

Varje session äger ett sessionsdokument i `tasks/sessions/`.

- **Chat skapar skelett** vid sessionsstart (K1 i klunge-mönstret)
- **Chat bakar in retrospektiv** vid sessionsavslut (sista K)
- **Code rör inte sessionsdokumentet** under arbete (P3a-mönstret, etablerat 2026-05-05)
- Mellan-klungor använder **inline-källor** i Code-prompter, aldrig "se sessionsdok Del N" som källa under körning

## Transcript-disciplin

Transcripts från Chat-sessioner sparas till
`tasks/sessions/transcripts/<datum>.txt` som originalkopia. Transcriptet är
sanningskällan vid sessionsavslut, inte LLM-minne. Källa:
`marcus-system/CLAUDE.md` "Transcript-disciplin"-sektion (commit `03897d7`).

## Definition of Done — per session

- [ ] `npm run test:api` grön (eller motsvarande relevant test-svit)
- [ ] `npx tsc --noEmit` 0 fel
- [ ] `npx @biomejs/biome check .` 0 fel
- [ ] `npm run build` grön
- [ ] `docs/BUILD-LOG.md` uppdaterad med sessionens resultat (planerat vs faktiskt, avvikelser, verifieringsoutput)
- [ ] ADR skapad i `docs/decisions/` för varje arkitekturbeslut
- [ ] `tasks/lessons.md` uppdaterad (markera `[UNIVERSAL]` där tillämpligt; lyft till hub inom 7 dagar)
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

PR till `main` triggar CI (`.github/workflows/ci.yml`) som kör biome + tsc + test:api + build.
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

Tilläggsverktyg läggs till här när Session 6.6 fortsätter (Vale,
scripted-checklist-check) per ADR-030. typos övervägdes men avvisades
per K3-baseline 2026-05-14 (tool-uppgift-mismatch; stavnings-substans
flyttades till Vale).

## Kvalitetsribba

Detta projekt arbetar mot **11/11/11**: 11/10 på data quality, design quality
och code quality. Definitionerna finns i [`docs/specs/KVALITETSDEFINITIONER-11-REACT.md`](docs/specs/KVALITETSDEFINITIONER-11-REACT.md).

## Resurser

- [`CLAUDE.md`](CLAUDE.md) — projekt-konstitution (läs först)
- [`docs/byggplan.md`](docs/byggplan.md) — styrande fas-plan
- [`docs/decisions/README.md`](docs/decisions/README.md) — ADR-katalog
- [`docs/BUILD-LOG.md`](docs/BUILD-LOG.md) — kronologisk sessions-journal
- [`tasks/lessons.md`](tasks/lessons.md) — universella lärdomar
- [`tasks/todo.md`](tasks/todo.md) — aktuell todo-status
