---
id: TASK-284.2
title: 'Skiva: Vakten i matchningssteget — vägrar länka vid avvikelse'
status: To Do
assignee: []
created_date: '2026-08-21 10:59'
updated_date: '2026-08-21 11:35'
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

PROD-WRITE: ändring av automationen i prod-basen kräver Marcus GO — därför ready-for-human.

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
- [ ] #7 Skriptets kod är incheckad i repot som källa, även om datakällan kör sin egen kopia
- [ ] #8 Inga deltaganden skapas för en anmälan som inte kunde länkas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OMKLASSAD 2026-08-21 (Marcus GO): skivan byggs och verifieras mot STAGING-basen apphjj8Q7lkXCMsL4 — inte prod. Prod-utrullningen är utbruten till TASK-284.6.

A1 har SAMMA automation-ID i staging som i prod (wflDCKPAv2P6Yu9U6), men står deploymentStatus: undeployed där. Marcus GO finns för att deploya den i staging så att kedjan kan provas ände-till-ände. Kom ihåg att det ändrar en DELAD testmiljö — andra sessioners tester läser samma bas.

AC 1 ÄR DEN BÄRANDE OCH FÅR INTE MJUKAS UPP. Det befintliga kopplingssteget (wacXLk4YN5AzohqCn, updateRecord) körs OVILLKORLIGT — vid noll träffar skriver det en tom lista. Läggs valideringen FÖRE det steget körs kopplingen ändå när valideringen fallerar, och vakten blir fail-OPEN: exakt motsatsen till ADR-122:s bärande egenskap. Skriptsteget måste ERSÄTTA både findRecords (wacDkQMtkfCRwDYxK) och updateRecord (wacXLk4YN5AzohqCn).

Expressgrenens villkor (mätt live, falsifierar schema_reference som säger 'noll träffar'): EventKey isEmpty AND 'Datum och ort' isNotEmpty. Rör den inte.
<!-- SECTION:NOTES:END -->
