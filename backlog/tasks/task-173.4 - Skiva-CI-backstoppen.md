---
id: TASK-173.4
title: 'Skiva: CI-backstoppen'
status: To Do
assignee: []
created_date: '2026-08-09 13:14'
updated_date: '2026-08-28 04:39'
labels:
  - ready-for-agent
dependencies:
  - TASK-173.3
parent_task_id: TASK-173
ordinal: 327000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: ett deterministiskt CI-jobb verifierar att varje kod-klassad PR bär ett giltigt granskningsutlåtande (Riskbedömnings-sektionen) och fäller PR:en annars — grinden blir mekaniskt otvingbar i stället för konvention (ADR-105 beslut 2–3; ADR-036-linjen). Täcker användarberättelser: 14 samt den mekaniska delen av 3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En PR i kod-klass utan giltig Riskbedömnings-sektion fälls av backstopp-jobbet (negativ self-test, rött-först-form)
- [ ] #2 En PR med giltig sektion passerar backstoppen (positivt bevis med run-ID)
- [x] #3 D0-klassade PR:er undantas via CI:s befintliga diff-klassning — backstoppen bär ingen egen klassningslogik
- [x] #4 Backstoppen är deterministisk — ingen LLM i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [ ] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-173.4 byggd 2026-08-28 (Opus 5, bygg-agent i egen worktree).

ARKITEKTURVAL — grinden sitter på merge_group-ytan, inte PR-ytan.
Review-grindens sekvens är push → granskning → sektion → armering, så vid PUSH saknas sektionen med nödvändighet. En grind på PR-ytan hade gjort varje kod-PR röd som NORMALTILLSTÅND, vilket bryter mot CONTRIBUTING.md § Rött-först ('rött i CI ska betyda EN sak: oväntad regression'). På kö-ytan är PR:en armerad, alltså måste granskningen ha skett. Priset: en fällning sparkar posten ur kön och konsumerar armeringen — därför finns preflighten 'npm run review:backstopp -- --pr <nr>' som körs FÖRE armering.

KÖ-ANTAGANDE som måste omprövas om rulesetet ändras: kö-grenen namnger EN PR (gh-readonly-queue/main/pr-<nr>-<bas-sha>, verifierat mot 30 skarpa merge_group-körningar 2026-08-28) medan max_entries_to_merge är 3. Att bara pröva den namngivna PR:en är fullständigt SÅ LÄNGE grouping_strategy är ALLGREEN (mätt i ruleset main-skydd, id 19627609, 2026-08-28). Byts den till HEADGREEN faller argumentet.

AC #3 mätt, ej antaget: merge_group-körning 33138424216 (docs-only PR #2033) skippade 'Test suite' på needs.changed.outputs.should_skip_tests — klassningen fungerar alltså på kö-ytan. Backstoppen bär ingen egen glob.

JSON-SCHEMA-DIVERGENSEN (flaggad framåt hit av 173.3): AVGJORD som icke-bugg. z.toJSONSchema() i zod 4.4.3 defaultar till io:'output', där ett .default()-fält alltid är närvarande och därför korrekt 'required' — verifierat mot installerad zod (io:'input' ger [a], io:'output' och default ger [a,b] på probe-schema). Artefakten är utdata-sidans schema. En rå-JSON-konsument (indata-sidan) behöver io:'input', alltså en ANNAN artefakt. 173.4 behövde ingendera: backstoppen parsar den RENDERADE sektionen, aldrig JSON. Ingen regenerering gjord — det vore ett eget beslut.

ÖPPEN SKULD (DoD #8): (a) skarpbevis för backstopp-JOBBETS wiring på merge_group-ytan kan strukturellt inte tas före landning — jobbet existerar bara på grenar som bär denna ändring, och en avsiktligt röd kö-körning är förbjuden. Det betalas av denna PR:s EGEN merge_group-körning, som kräver att PR:en bär en Riskbedömnings-sektion. (b) gate-proof-workflowen review-backstopp-proof.yml kan inte dispatchas före landning: GitHub registrerar workflow_dispatch först när filen finns på default-grenen. Kör 'gh workflow run review-backstopp-proof.yml' direkt efter merge för AC #1/#2:s run-ID, plus 'gh workflow run review-backstopp-proof.yml -f simulera_gront=true' som negativ kontroll (ska bli RÖD). (c) DoD #7 (instrumenteringsloggen) tillhör TASK-173.6, inte denna skiva — DoD-blocket är ärvt verbatim från förälder-PRD:n.

BEVIS SOM FAKTISKT TOGS (2026-08-28, PR #2049, commit 68831622):
- CI-run 33141087421, jobb 98751954146 (Lint + Audit + TypeCheck) :: success. Steg 26 'Test gatekeeper script suites' körde scripts/test-review-backstopp.mjs — loggrad 2669: 'review-backstopp: 38 gröna, 0 röda'. Sviten bevisar BÅDA riktningar mot en VERKLIG granskad PR-kropp (#2031): utan sektion → FÄLLER (kod 'saknas', CLI exit 1), med sektion → SLÄPPER (CLI exit 0).
- Samma run: jobbet 'Review-backstopp (granskningsutlåtande)' :: SKIPPED på PR-ytan — exakt som designat (event_name != merge_group). Wiringen är alltså live och syns som check.
- AC #3 tvåsidigt mätt på KÖ-ytan: docs-only merge_group 33138424216 → 'Test suite' SKIPPED (should_skip_tests=true ⇒ backstoppen skippar); kod-klassad merge_group 33139822993 (pr-2038) → 'Test suite / Pure + Build' SUCCESS (should_skip_tests=false ⇒ backstoppen kör).
- Rulesetet 'main-skydd' (19627609): enforcement=active, bypass_actors=[] — ingen kan merga förbi kön, alltså kan ingen kod-PR landa förbi backstoppen.
- Lokala grindar: actionlint (CI:s -ignore) 0 · yamllint 0 · biome check . 0 · markdownlint 0 issues · Vale 0 errors/0 warnings · check-langa-streck 0 · check-fetch-depth-invariant 0 · dess testsvit 7/7 · test-verify-ci-parity 69/69 · typecheck 0 · paritets-preflight 0.
- Mutationsbevis (sviten fäller när logiken bryts): STALE-kontrollen bortkopplad → 3 röda; PR-nummer-kontrollen → 2 röda; merge_group-regexen uppluckrad → 1 röd; CLI:ts exitkod låst till 0 → 3 röda.

STOPPA-PUNKT för orkestreraren: AC #1 och #2 är INTE bockade. Verdikt-logiken är CI-bevisad i båda riktningar (ovan), men själva JOBBETS fällning på merge_group-ytan och gate-proof-workflowens run-ID kan strukturellt inte tas före landning — mätt: 'gh workflow run review-backstopp-proof.yml --ref <gren>' ger HTTP 404 'not found on the default branch'. Bocka #1/#2 efter merge, med run-ID från de två dispatch-kommandona i föregående not.

SLUTLIG CI (commit eb6c9ac1, PR #2049): run 33141365973 :: SUCCESS, 'CI Passed or Skipped' :: success. Alla jobb gröna; 'Review-backstopp (granskningsutlåtande)' :: skipped på PR-ytan som designat.

FYND UTANFÖR SCOPE (ADR-053: blockerade tillfälligt, löstes utan åtgärd — registreras, förkastas inte): 'Test suite / Acceptance (hermetisk)' föll i första körningen av 33141365973 på tests/acceptance/dokument-lista-hojdlas.acceptance.test.ts:535 — 'strict mode violation: getByText("Delad 5.pdf") resolved to 2 elements' i alla tre försök (initial + 2 retries). Ingen koppling till detta korts diff (noll src/, noll tests/acceptance). Acceptance var GRÖN på samma bas i post-merge-körning 33140227702 (55d83d0d). 'gh run rerun --failed' på identiskt träd gav SUCCESS ⇒ klassad som FLAKE, inte regression. Kandidat för npm run metrics:flake om den återkommer; testet kom med TASK-309.24 (commits 0ce587d5/b8e0f59b/62c71a3c).
<!-- SECTION:NOTES:END -->
