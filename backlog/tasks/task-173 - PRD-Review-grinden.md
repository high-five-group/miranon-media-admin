---
id: TASK-173
title: 'PRD: Review-grinden'
status: To Do
assignee: []
created_date: '2026-08-09 13:08'
labels: []
dependencies: []
ordinal: 323000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

När en bygg-agent säger klart finns idag ingen obligatorisk, oberoende granskning innan PR:en armeras. Marcus är näst största fångstkällan (extern fångst dominerar; self-review ~9 %), vilket gör hans lästid till systemets flaskhals och tak — och en granskare som delar kontext med utföraren kan godkänna sin egen förskrivning (incident-klassen som motiverade förlagans färsk-kontext-mekanik). PR:n bär idag inte heller något strukturerat underlag (risk, bevis, fynd) som låter Marcus kalibrera SIN insats per ändring.

### Lösning

En review-grind i landningskedjan: orkestreraren spawnar en granskningsagent i FÄRSK kontext efter bygg-agentens push men FÖRE armering. Granskaren får kortets acceptanskriterier verbatim som intent, diffen, och path-scopade regler lästa ur main. Utlåtandet är strukturerad JSON (fynd med severity/action, risknivå med motivering, bevisreferenser) som deterministiskt renderas till en fast Riskbedömnings-sektion i PR-kroppen. En billig deterministisk CI-backstopp (utan LLM) verifierar att PR:en bär ett utlåtande. Rundtak 2 med error-tröskel i runda 2; vid tak eskaleras öppna fynd till Marcus via STOPPA-OCH-FRÅGA — grinden självgodkänner aldrig. HÖG risk blockerar armering till Marcus granskat; LÅG är informativ tills fångstrate-mätningen bär data. All instrumentering (findings-per-runda, risk-kalibrering, grind-missar) loggas från första körningen.

### Användarberättelser

1. Som Marcus vill jag att varje kod-PR granskats av en oberoende agent i färsk kontext innan den armeras, så att fel fångas mekaniskt före min lästid i stället för att bero på den.
2. Som Marcus vill jag se en fast Riskbedömnings-sektion i varje PR-kropp med nivå och enmenings-motivering, så att jag kan kalibrera min gransknings-insats per ändring i stället för att läsa allt lika djupt.
3. Som Marcus vill jag att HÖG-klassade PR:er inte kan armeras förrän jag uttryckligen granskat dem, så att de farligaste ändringarna aldrig landar på enbart agent-omdöme.
4. Som Marcus vill jag att min granskningsvana INTE ändras av LÅG-stämplar förrän mätdata visar att grinden fångar det jag fångar, så att golvet aldrig rivs på förhoppning.
5. Som Marcus vill jag att varje bevis-påstående bär kommando och run-ID/SHA, så att jag kan verifiera påståendet i efterhand i stället för att lita på prosa.
6. Som Marcus vill jag få öppna fynd som markeringsbar lista i chatten när rundtaket nås, så att jag beslutar om kvarvarande tveksamheter — inte grinden.
7. Som orkestrerare vill jag ett entydigt kontrakt för när granskaren spawnas (efter push, före armering) och vad den får som input, så att grinden inte beror på mitt minne i stunden.
8. Som orkestrerare vill jag att driv-agent och granskare aldrig är samma agent, så att självattesterings-felklassen är strukturellt omöjlig.
9. Som orkestrerare vill jag ett hårt rundtak med eskalerande blockeringströskel, så att granskningsloopen konvergerar i stället för att jaga brus (27-rundors-incidenten i förlagan).
10. Som bygg-agent vill jag få granskningsfynden i strukturerad form med tydlig auto-fix/ask-user-klassning, så att jag vet vad jag får rätta själv och vad som ska till Marcus.
11. Som review-agent vill jag få kortets acceptanskriterier verbatim och pröva dem som antaganden (inte sanningar), så att jag kan flagga fel-ställda AC i stället för att granska mot en felaktig spec.
12. Som review-agent vill jag läsa path-scopade granskningsregler ENDAST ur main, så att en pushad gren aldrig kan manipulera sin egen granskning.
13. Som framtida session vill jag att findings-per-runda, risk-kalibrering och grind-missar loggats från dag ett, så att rundtak och D0-undantag kan omprövas mot egen data i stället för mot gissningar.
14. Som CI-konsument vill jag en deterministisk backstopp som fäller PR:er utan granskningsutlåtande, så att grinden är mekaniskt otvingbar i stället för konvention.
15. Som PR-läsare utan kort-kontext vill jag att PR:er utan kort bär öppet flaggad lägre intent-konfidens, så att jag vet vilken auktoritet granskningen vilar på.

### Implementationsbeslut

Samtliga sju beslut är låsta i ADR-105 (grillad samsyn S101) — kortet refererar, upprepar inte: (1) BYGG deltana på egna primitiver, ingen verktygsadoption; (2) orkestrerar-spawnad färsk-kontext-granskare + deterministisk CI-backstopp utan LLM; (3) obligatorisk utanför D0-klassen (CI:s befintliga diff-klassning återanvänds — ingen ny klassningslogik), prototyp undantagen men promovering går genom grinden; (4) rundtak 2, error-tröskel i runda 2, STOPPA-OCH-FRÅGA vid tak, findings-per-runda loggas; (5) risk asymmetriskt — HÖG styr formellt nu, LÅG informativ tills mätdata, ribb-flytt är separat framtida Marcus-beslut; (6) bevis text-först med commit-pinning som lag, binärlagring öppet skjuten; (7) kortets AC verbatim som intent, path-regler config-drivet ur main (grindvakts-konventionen), fallback PR-text med flaggad konfidens. Granskarens utlåtande är strukturerad JSON med severity (error/warning/info), action (auto-fix/ask-user, fail-closed till ask-user vid saknad klassning), risknivå + motivering. Granskaren definieras som egen subagent-typ; orkestrerar-kontraktet och bygg-agent-kontraktet amenderas med grind-steget.

### Testbeslut

En skarv (Marcus-kvitterad): den etablerade tvåsidiga skript-testsvits-skarven — varje nytt deterministiskt skript (CI-backstoppen, risk-rendreraren, policy-läsningen, instrumenterings-loggningen) får sin ska-fälla + ska-passera-svit enligt befintligt mönster (10+ förebilder i repot). Testa externt beteende: backstoppen prövas mot PR-tillstånd (utlåtande finns/saknas/malformat), rendreraren mot JSON-indata → exakt sektionsutdata, policy-läsningen mot main-kontra-gren-källa. Review-agentens beteende enhetstest­as inte — det bevisas via skarpbevis i första skarpa körningen + instrumenteringsloggen, och CI-backstoppens grind-verkan bevisas med rött-först-form (positivt bevis + negativ self-test).

### Utanför omfattningen

Flytt av Marcus gransknings-ribba (separat framtida beslut mot mätdata) · binärlagrings-mekanik för bildbevis (öppet skjuten till mätdata) · LLM-granskning i CI · D0-/docs-klassens granskning (omprövas mot mätdata) · transkript-baserad intent-inferens (falsifierad — kortet är starkare källa) · auto-eskalering av granskningsdjup utifrån risknivå (även förlagan har det bara som förslag) · K4/exekverings-hubben (egen arbetsenhet).

### Estimat

6–8 skivor, medelstor arbetsenhet: backstopp-skriptet + CI-jobbet · review-agent-definitionen + orkestrerar-/bygg-agent-kontraktsamenderingarna · risk-rendreraren + PR-mallen · policy-ytan · instrumenteringen · skarpbevis/QA-skivan (ready-for-human). Exakt snittning görs av skivningen.

### ADR-koppling

ADR-105 (styrande huvud — review-grinden, sju beslut) · ADR-036 (CI enda mekaniska enforcement — backstoppens motiv) · ADR-076 (merge-kön äger landningen — grinden ändrar inte kö-mekaniken) · ADR-086 (granskaren prövar kortets premisser) · ADR-096 (subagent-väntekontraktet — granskaren är Activity, orkestreraren äger väntan) · ADR-104 (kanalseparations-prejudikatet för Marcus-styrda grindar).

### Ytterligare anteckningar

Kunskapsunderlag: K1-research-doket (no-mistakes-anatomin, 2026-08-09) + L8-kartläggningen § Fas D K1 — båda i research-katalogen. Varningslampan från förlagan (27 omgranskningsrundor utan konvergensregel, öppet uppströms) är inbyggd i beslut 4. Termerna review-grinden/risk-rad/rundtak lyfts till hubbens systemordlista vid hub-sync (processdomän, ADR-105 § Konsekvenser).
<!-- SECTION:DESCRIPTION:END -->

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
