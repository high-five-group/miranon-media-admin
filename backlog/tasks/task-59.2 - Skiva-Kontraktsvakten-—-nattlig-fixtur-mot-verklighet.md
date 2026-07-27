---
id: TASK-59.2
title: 'Skiva: Kontraktsvakten — nattlig fixtur-mot-verklighet'
status: To Do
assignee: []
created_date: '2026-07-27 20:40'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.1
parent_task_id: TASK-59
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fixturvärldens svar jämförs mot skarp staging varje natt, och avvikelser larmar i den kedja som redan finns och redan bevakas.

BETEENDET ÄNDE-TILL-ÄNDE: natten kör vakten. Den anropar de skarpa Edge Functions vars svar fixturen påstår sig spegla, parsar båda genom samma schema, och jämför. Stämmer de händer ingenting synligt. Divergerar de skapas ett larm som namnger vilken endpoint som glidit och hur. Larmet BLOCKERAR ingen PR — det talar om att en fixtur inte längre säger sanningen.

VARFÖR DEN ÄR VILLKOR OCH INTE TILLÄGG: zod-schemana är halva kontraktet. De fångar att ett fält försvinner eller byter typ. De fångar INTE att fältet finns men betyder något annat, och de fångar inte att schemat självt glidit — schemat är vår bild av funktionen, inte dess deklaration, så ändras funktion och schema i samma commit uppstår ingen signal alls. Airtable-basen kommer dessutom att byggas om aktivt under maximerings-milstolpen, vilket är precis den period fixturer driftar tyst.

ATT VAKTEN BYGGS FÖRE FÖRSTA FLYTTADE FILEN ÄR AVSIKTLIGT och har en fördel utöver ADR-kravet: nästa skivas pilot blir vaktens första skarpa prov mot verkliga fixturer.

EN VAKT SOM ALDRIG SETTS LARMA ÄR INTE VERIFIERAD. Beviset är tvåsidigt: tyst natt när fixturerna stämmer, larm när en fixtur medvetet görs fel.

Täcker användarberättelser: 6, 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Vakten kör nattligt i den befintliga natt-kedjan och är ICKE-blockerande — en avvikelse fäller ingen PR
- [ ] #2 Vakten täcker de endpoints som bär merparten av de skarpa restanropen; urvalet är motiverat mot mätdata, inte handplockat
- [ ] #3 Fixtursvar och skarpt svar parsas genom SAMMA schema före jämförelse — divergerar de är det fixturen som är fel, inte jämförelsen
- [ ] #4 Larmet namnger vilken endpoint som divergerar och på vilket sätt; ett anonymt larm tvingar fram en utredning vakten skulle ha gjort
- [ ] #5 TVÅSIDIGT BEVIS: tyst natt på korrekta fixturer OCH ett skarpt larm framkallat av en medvetet felaktig fixtur — båda körda, båda redovisade
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Kontraktsvakten är i drift och har setts LARMA på en medvetet felaktig fixtur innan sista filen flyttas
- [ ] #6 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
