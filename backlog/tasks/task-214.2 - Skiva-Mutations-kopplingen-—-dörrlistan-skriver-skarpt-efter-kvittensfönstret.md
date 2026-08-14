---
id: TASK-214.2
title: 'Skiva: Mutations-kopplingen — dörrlistan skriver skarpt efter kvittensfönstret'
status: Done
assignee: []
created_date: '2026-08-14 19:13'
updated_date: '2026-08-14 21:57'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.1
parent_task_id: TASK-214
ordinal: 403000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dörrlistan (variant D, DEV-grindad) byter lokal state mot skarp skrivning bakom oförändrad form: incheckning skriver till basen när kvittensfönstret löpt ut, ångra inom fönstret lämnar noll spår, klargruppens urbockning skriver tillbaka, saknad rad överbryggas av create-attendance (backup — rotorsaken läks via 213.12), och felvägen är synlig. Datalagret nås endast via sin adapter. Styrande: PRD task-214, S103 Del 15 (F2, F3), facit-manifestet. Täcker användarberättelser: 2, 3, 4, 5, 8, 9, 10, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En incheckning i dörrlistan (variant-läget) skriver Status Närvarande via set-attendance-status EXAKT när kvittensfönstret (1,2 s) löpt ut — nätverks-observationen bevisar att inget skrivanrop går före fönstrets utgång
- [x] #2 Ångra inom kvittensfönstret ger noll skrivanrop; ångra efter fönstret (bocka ur i klargruppen) skriver Status Ej avstämt
- [x] #3 Saknar personen Deltaganden-rad skapas den via create-attendance i skrivögonblicket — dörren säger aldrig nej; användningen syns i loggen
- [x] #4 Misslyckad skrivning återför raden till arbetslistan med synligt fel — ingen incheckning försvinner tyst
- [x] #5 Dörrlistans renderade form är identisk med facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)' — mutations-kopplingen ändrar ingen form
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [x] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [x] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
- [x] #10 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-214.2 byggd 2026-08-14 (bygg-agent, Opus 5).

RÖRDA FILER
- src/domain/models/Attendance.ts — CreateAttendanceInput + CreatedAttendance (write-shapes).
- src/domain/schemas/Attendance.schema.ts (+ index.ts) — CreatedAttendanceSchema, parsar create-attendance-svaret vid datagränsen (ADR-026).
- src/data/adapters/DataSourceAdapter.ts / AirtableAdapter.ts / SupabaseAdapter.ts — createAttendance i alla tre (dubbel-källa, ADR-056). updateAttendance-docblocket rättat: det påstod att operations-listan är tom, vilket TASK-214.1 gjorde falskt.
- src/data/mutations/attendance.ts (NY) — useSetAttendanceStatus. Bor i mutationskatalogen; en useMutation i komponenten fälls av tests/api/mutation-hemvist-vakt.test.ts.
- src/components/events/CheckinPrototyp.tsx — useDorrLageD blir optimistiskt lager med rollback; skrivningen hängd på kvittensfönstrets timer; fel-yta (MessageBox intent=error, role=alert).
- tests/acceptance/event-checkin-dorrlistan.acceptance.test.ts (NY) — 5 tester.

DESIGNBESLUT UTANFÖR SPEC (motiverade i koden)
1. Optimistiken ligger KVAR i komponent-state, inte i query-cachens onMutate (avsteg från ADR-016 komponent C/D:s vanliga placering). Tvingande skäl: flippen sker vid trycket, mutationen startar 1,2 s senare — en onMutate hade flippat för sent. Rollbacken flyttas med till komponenten (useDorrLageD.aterstall).
2. Skrivnyckeln hålls i en useRef, inte useState: kvittenstimerns callback stänger över sin render, och en frusen karta hade gjort att en urbockning efter CREATE skickat en ny CREATE i stället för en uppdatering.
3. Urbockning på en rad UTAN deltaganderad skickar INGET anrop (frånvaron av rad ÄR "Ej avstämt"). Kan inte nås via UI i dag; defensiv gren.

BEVIS
- ariaSnapshot FÖRE (main) vs EFTER (denna gren), tre tillstånd (utgångsläge / i kvittensfönstret / efter fönstret): diff exit 0, noll skillnad. AC #5.
- Tvåriktnings-bevis: mutant som flyttar skrivningen till trycket fäller 5 av 5 tester; utan mutant 5 av 5 gröna.

ÖPPNA FYND (ej åtgärdade i denna skiva)
- create-attendance saknas i .prod-functions-allowlist.conf. Ingen grind fäller i dag (ef-metod-vakten går allowlist->källkod), men EF:en kan inte deployas till prod förrän raden finns. Behövs före go-live med flippad yta.
- Incheckningen loggar INTE till aktivitetsloggen (recordActivity). PRD § Utanför omfattningen håller aktivitetsloggen utanför vertikalen och ett incheckningsverb är en ny post i activityTypes.ts. Ingen mekanisk grind fäller. Kandidat för egen skiva eller 214.5.
- Preexisterande flake i acceptance-sviten, oberoende av denna skiva: mer-aktivitetshistorik-filter.acceptance.test.ts:457 (strict mode violation på getByText('Aktivitet')) fäller i FULL svit men passerar isolerat — mätt både med och utan denna skivas src-ändringar. hem.acceptance.test.ts:437 fällde i baseline-körningen men inte i skivans.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad av bygg-agent (Opus) 2026-08-14, PR #1301, merge aca14cff via kön. Två varv: huvudleveransen 91d502af (AC 1-5 avbockade, tvåriktnings-bevis: mutant som flyttar skrivningen till trycket fäller 5/5 tester, riven mutant ger 5/5 gröna) + streck-fixen f139ceb3 (CI:s långa-streck-grind föll — grinden bor i Lint-jobbet, inte i DoD-kommandona; agenten reproducerade rött lokalt, rättade genom OMFORMULERING per husets faktiska precedent a4c0a641 och falsifierade därmed orkestrerarens kortstrecks-premiss). Grindar: typecheck 0, biome 0, build 0, test:api 750/750, check:docs 14/14, acceptans ny fil 5/5. Designbeslut bokförda i agentens notes: optimistik i komponent-state (onMutate hade flippat för sent), skrivnyckel i useRef, urbockning på radlös post skickar inget. DoD 5/8-arvet (ariaSnapshot/konsument-svep) hör till 214.3/214.4 — formens oföränderlighet bevisad med engångs-ariaSnapshot-diff (exit 0, tom skillnadslista) i stället; belagt här. Uppföljningar registrerade av orkestreraren: create-attendance saknas i prod-allowlisten (tas i 214.5/go-live), aktivitetslogg-verb för incheckning (kandidat-kort), preexisterande flake i mer-aktivitetshistorik-filtrets acceptanstest (eget fynd-kort). Stängd efter landningsverifikat mot origin/main.
<!-- SECTION:FINAL_SUMMARY:END -->
