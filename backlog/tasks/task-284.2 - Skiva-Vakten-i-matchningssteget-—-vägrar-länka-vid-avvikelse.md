---
id: TASK-284.2
title: 'Skiva: Vakten i matchningssteget — vägrar länka vid avvikelse'
status: To Do
assignee: []
created_date: '2026-08-21 10:59'
updated_date: '2026-08-21 14:23'
labels:
  - ready-for-agent
dependencies:
  - TASK-284.1
parent_task_id: TASK-284
ordinal: 517000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BETEENDE ÄNDE TILL ÄNDE: en ny anmälan kommer in. Går dess uppgifter ihop med det event nyckeln pekar på, länkas den som förut och allt nedströms fungerar oförändrat. Går de inte ihop, länkas den INTE — den blir liggande utan event, syns omedelbart i appen som en anmälan utan event, och inga följdposter skapas på ett event den kanske inte hör till.

FAIL-CLOSED ÄR HELA POÄNGEN: kraschar skriptet, eller körs det inte alls, blir eventlänken tom — samma utfall som en medveten fällning. Det finns inget felläge där en felkopplad anmälan slinker igenom för att vakten inte kördes. Den egenskapen förutsätter ERSÄTTNINGSFORMEN i AC 1; en vakt som läggs FÖRE den befintliga kopplingen har motsatt egenskap.

MÄTT UNDERLAG (live 2026-08-21): matchningssteget kopplar OVILLKORLIGT — vid noll träffar skriver det en tom lista, inte ingenting. Det finns alltså inget villkorssteg att haka i, vilket är varför ersättning är enda vägen.

STAGING-BYGGE (omklassad 2026-08-21, Marcus GO — ersätter den tidigare PROD-WRITE-raden): automations-ändringen görs i staging-basen apphjj8Q7lkXCMsL4, där A1 bär samma ID som i prod (wflDCKPAv2P6Yu9U6). Prod rörs aldrig av denna skiva, därför ready-for-agent; utrullningen är utbruten till TASK-284.6. Detaljerna står i Implementation Notes.

Täcker användarberättelser: 1, 11, 12, 13, 14, 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skriptsteget ERSÄTTER de två befintliga stegen (sökningen och kopplingen). Det läggs ALDRIG före en kvarvarande ovillkorlig koppling — den formen är mätt fail-open: kopplingen körs även när sökningen gav noll träffar, så ett kraschat valideringssteg före den släpper igenom en felkopplad anmälan
- [ ] #2 En anmälan vars uppgifter avviker från det tilltänkta eventet får INGEN eventlänk — fältet lämnas tomt, inget partiellt tillstånd
- [ ] #3 En anmälan vars uppgifter stämmer länkas precis som förut — inga regressioner i normalflödet
- [ ] #4 En eventnyckel utan prefix normaliseras före jämförelsen, och jämförelsen avgör därefter
- [ ] #5 Expressflödets gren är opåverkad: villkoret är att eventnyckeln är TOM och datum-och-ort-fältet ifyllt (mätt live 2026-08-21 — dokumentationens påstående om noll träffar är falsifierat)
- [ ] #6 En rad skrivs i Error-log vid fällning — som spår, aldrig som enda spår: den tomma eventlänken är den bärande signalen
- [x] #7 Skriptets kod är incheckad i repot som källa, även om datakällan kör sin egen kopia
- [ ] #8 Inga deltaganden skapas för en anmälan som inte kunde länkas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OMKLASSAD 2026-08-21 (Marcus GO): skivan byggs och verifieras mot STAGING-basen apphjj8Q7lkXCMsL4 — inte prod. Prod-utrullningen är utbruten till TASK-284.6.

A1 har SAMMA automation-ID i staging som i prod (wflDCKPAv2P6Yu9U6), men står deploymentStatus: undeployed där. Marcus GO finns för att deploya den i staging så att kedjan kan provas ände-till-ände. Kom ihåg att det ändrar en DELAD testmiljö — andra sessioners tester läser samma bas.

AC 1 ÄR DEN BÄRANDE OCH FÅR INTE MJUKAS UPP. Det befintliga kopplingssteget (wacXLk4YN5AzohqCn, updateRecord) körs OVILLKORLIGT — vid noll träffar skriver det en tom lista. Läggs valideringen FÖRE det steget körs kopplingen ändå när valideringen fallerar, och vakten blir fail-OPEN: exakt motsatsen till ADR-122:s bärande egenskap. Skriptsteget måste ERSÄTTA både findRecords (wacDkQMtkfCRwDYxK) och updateRecord (wacXLk4YN5AzohqCn).

Expressgrenens villkor (mätt live, falsifierar schema_reference som säger 'noll träffar'): EventKey isEmpty AND 'Datum och ort' isNotEmpty. Rör den inte.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
BLOCKERAD PÅ KÄRNAN (AC1): den levande A1-automationen kunde INTE ändras. Endast AC7 (repo-källa) är uppnått — AC1–6 och AC8 kvarstår omärkta, med skäl nedan. Detta avviker från uppdraget och rapporteras öppet i stället för att mjukas upp.

VAD SOM HÄNDE: update_automation mot wflDCKPAv2P6Yu9U6 (apphjj8Q7lkXCMsL4, verifierad undeployed FÖRE varje ändring) avvisades med isValid:false, node "vaktEventmatchningA1", message "readOnlyNodeType", providedNodeType "customScript" — den customScript-nodtyp AC1 kräver är READ-ONLY i hela mcp__claude_ai_Airtable-ytan (bekräftat: typen "customScript" saknas helt i get_create_automation_instructions kuraterade lista, "available but not yet fully supported"-katalog OCH "exists but not creatable here"-listan — strukturellt exkluderad från write-ytan, inte en dokumentationslucka). Ingen skrivning skedde (tool-kontraktet: "if isValid is false, nothing was saved") — verifierat: get_automation efter försöket är BYTE-IDENTISK med före-läget. A1 lämnas i exakt samma skick jag fann den: deploymentStatus undeployed, ursprungliga findRecords (wacDkQMtkfCRwDYxK) + updateRecord (wacXLk4YN5AzohqCn) + conditionalGroup (wded6gggP5Gk0qSa9) orörda.

DETTA ÄR EN VERKTYGSGRÄNS, INTE ETT DESIGNVAL: ingen deklarativ ersättningsarkitektur (formelfält + conditionalGroup i stället för skript) har prövats — det vore ett arkitekturbeslut som river ADR-122 beslut 6 (vaktens hemvist är A1-skriptet) och ligger utanför mandatet att fatta ensidigt.

VAD SOM ÄR GJORT OCH VERIFIERAT:
1. Skriptet docs/reference/automation-scripts/a1-eventmatchning-vakt.js är skrivet, incheckat (AC7) och biome-rent. Det ERSÄTTER findRecords+updateRecord i sin design, normaliserar EventKey (AC4), jämför tre axlar (Ort/Kurs/Datum) med SAMMA normalisering som Eventmatchning-formeln (fldYz2NRZJjyX8VWB, TASK-284.1) portad verbatim, skriver Error-log vid fällning (AC6), lämnar tom nyckel (expressraden) helt orörd (AC5), och länkar aldrig partiellt (AC2/AC8 följer strukturellt).
2. Logiken är verifierad OFFLINE (Node vm-sandbox som kör den literala filen mot en Airtable Scripting-shim, ingen omimplementation) mot LIVE-hämtade fält från de permanenta TASK-284.1-fixturerna (Event-8755/8756, ZZ-TASK-284.1 Fixtur OK/Avviker/Backfill) plus två syntetiska kanter (ingen match, tom EventKey). Alla sex scenarier gav förväntat utfall. Detta bevisar att SKRIPTET är korrekt; det bevisar inte att A1 kör det, eftersom A1 aldrig kunde uppdateras.
3. FÄLT-ID-DIVERGENS UPPTÄCKT (premiss-pass): ADR-122 §Fynd1 / kortets Implementation Notes anger PROD-fältID:n för "Ort (from Event)" (fld5560T3pQZSUBaJ) och "Kurs (from Event)" (fldfqU6MfBQdaeLUk). Ingen av dem finns i STAGING (apphjj8Q7lkXCMsL4) — get_table_schema gav tomt svar för båda. Staging bär motsvarande fält under andra ID:n (fldUhHceqBud4BHvf / fldcTDSzGBG0bHjl3). Skriptet läser fälten via NAMN, så divergensen påverkar inte körningen — men den är bokförd i skriptets header och här.

REKOMMENDATION: enda kvarvarande vägen att få vakten LIVE i staging är att en människa (eller ett verktyg med UI-åtkomst) klistrar in exakt docs/reference/automation-scripts/a1-eventmatchning-vakt.js i ett nytt "Run a script"-steg i Airtable-UI:t, tar bort de två gamla stegen (wacDkQMtkfCRwDYxK, wacXLk4YN5AzohqCn), lämnar conditionalGroup (wded6gggP5Gk0qSa9) orörd, och deployar. Ingen ny automation skapades, ingen deploy skedde, inga records i staging rördes av mig.

AC-STATUS: AC7 avbockad (repo-källa, literalt uppfyllt). AC1–6, AC8 EJ avbockade — de beskriver den levande automationens beteende, som är oförändrad. DoD: #2 och #4 avbockade (grindar gröna på den rörda fil-klassen; path-scopad diff). #1 EJ avbockad (kräver alla AC — bara 1 av 8 är det). #3 orörd (CI-verifiering, Marcus/orkestreraren).

PR:en skapas som DRAFT — en medveten parkering i väntan på Marcus beslut om vägen framåt, inte normalfallet.
<!-- SECTION:FINAL_SUMMARY:END -->
