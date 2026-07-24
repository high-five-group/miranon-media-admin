---
id: TASK-36.6
title: 'Skiva: Rött-först byter bärare — röd CI återfår sin betydelse'
status: Done
assignee: []
created_date: '2026-07-23 17:14'
updated_date: '2026-07-24 06:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-36.1
parent_task_id: TASK-36
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idag pushas avsiktligt röda commits ensamma för att ge citerbara röda körningar — sju av de trettio senaste körningarna är sådana. Var och en konsumerar kö och mutex, och tillsammans urvattnar de rött som signal: när rött är vardag slutar rött betyda något. Dessutom har bevisformen ett tyst fel — öppnas PR:en efter att fixen redan committats uteblir det röda varvet helt, och ingen märker det.

Efter denna skiva är rött-först lika obligatoriskt som förut, men beviset bärs av det lokala körutdraget i stället för av en röd körning i den delade kön. Testet skrivs, körs rött, och utdraget citeras — testnamn, felutfall, antal. Rött och grönt pushas sedan ihop, så CI kör en gång på grön head medan historiken behåller båda commits. Forensiken finns kvar; den går via git i stället för via en röd körning.

Grind-bevis — att en CI-grind faktiskt fyrar — flyttar till den riktade avfyrningsformen, som byggs i sin egen skiva och redan bevisar sig själv.

Vinsten är dubbel: kön slipper sju körningar av trettio, och röd CI återfår sin enda ärliga betydelse — OVÄNTAD regression. När rött blir sällsynt blir det åter värt att reagera på.

Formen är en amendering av det befintliga AFK-batch-kontraktet, inte en ny ADR: beslutet ändrar en punkt i ett existerande kontrakt, och det kontraktet har redan en etablerad amenderingsform med bevarad ursprungstext. Beslutet självt låstes av Marcus 2026-07-23.

Täcker användarberättelser: 11, 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AFK-batch-kontraktet amenderas i sin etablerade form: nytt daterat amenderings-block överst, befintlig beslutstext bevarad ORÖRD (immutabilitet)
- [x] #2 Amenderingen slår fast att rött-först förblir OBLIGATORISKT lokalt, med citerat körutdrag (testnamn, felutfall, antal) i kort och sessionsdok
- [x] #3 Amenderingen slår fast att rött och grönt pushas IHOP: CI kör en gång, på grön head; historiken behåller båda commits och forensiken går via git
- [x] #4 Amenderingen pekar ut den riktade avfyrningsformen som hemvist för grind-bevis — inga avsiktligt röda körningar i den delade kön
- [x] #5 Den rad i fix-vågens kontrakt som krävde rött-först-bevis i samma körform är uppdaterad så att kontraktet inte längre säger emot sig självt
- [x] #6 Bidragsguiden speglar den nya bärarformen så att regeln är läsbar där arbetet faktiskt görs
- [x] #7 Ingen ny ADR mintas för detta — bärarbytet ÄR en amendering, och det står öppet varför
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Amenderings-blocket S80 överst i ADR-071 (ursprungstext orörd; fix-vågens rad iv öppet amenderad med bevarad ursprungslydelse). CONTRIBUTING § Rött-först — bevisformen tillagd mellan PR-flödet och Nattnätet. Ingen ny ADR — motivet står i blocket (AC#7).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 5de8aa4 · CI-run 30073375124 per jobb (docs-only, Test suite by-design-skippad, länkkontroll grön) · CI-grön-första-pass: ja · defekter under körning: 0 (en MD028 självfångad lokalt före commit) · TDD: ej tillämplig (docs-kort)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
