---
id: TASK-70.6
title: 'Skiva: delete_branch_on_merge = true'
status: To Do
assignee: []
created_date: '2026-07-28 16:34'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-70
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ren hygien. delete_branch_on_merge är i dag false (verifierat mot gh api repos/high-five-group/miranon-media-admin 2026-07-28), så varje mergad gren blir kvar på fjärren. Granskningen listar det som V3: grenar ackumuleras.

INGA BEROENDEN. Kan tas när som helst, oberoende av spårets övriga skivor.

### ATT VETA

Inställningen raderar HEAD-grenen på fjärren när en PR mergas. Den rör inte lokala grenar och inte git-worktrees: en agent-worktree vars gren raderats på fjärren fortsätter fungera lokalt, men en push till den grenen EFTER merge skapar den på nytt i stället för att uppdatera något. Det är värt att veta för den som pushar en efterföljande rättelse på samma gren i stället för att öppna en ny.

Två närliggande repo-inställningar rörs INTE av denna skiva och är egna frågor:

- allow_update_branch är false, medan flödet förlitar sig på gh pr update-branch (granskningens F3),
- allow_auto_merge är true.

### EFTERSPEL SOM INTE INGÅR

Grenar som redan ackumulerats raderas inte retroaktivt av inställningen. Vill man städa dem är det en separat operation, och den ingår inte här — kortet ändrar beteendet framåt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 gh api repos/high-five-group/miranon-media-admin --jq .delete_branch_on_merge ger true — utdata redovisat
- [ ] #2 Nästa mergade PR:s gren är faktiskt borta på fjärren efter merge — verifierat med git ls-remote eller gh api, med PR-nummer och grennamn redovisade
- [ ] #3 allow_update_branch och allow_auto_merge är oförändrade — utdata före och efter redovisat, så att inget granne-värde ändrats av misstag
- [ ] #4 Ingen fil i repot ändrad av denna skiva; att den enda ändringen är en repo-inställning noteras uttryckligen i kortets slutrapport
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

En boolesk repo-inställning med ett gh api-anrop som utförande och ett gh api-svar som verifiering. Effekten är omedelbart synlig och trivialt reversibel — sätt tillbaka false.

Att skivan rör en GitHub-inställning gör den inte till human-klass. Kriteriet är om UTFÖRANDET kräver mänskligt omdöme, och här finns inget val att göra: värdet är givet av åtgärdsplanen och har ett enda rimligt utfall.

Jämför A7:3, som också rör GitHub men vars felläge kan låsa hela landningsvägen och vars acceptanskriterium kräver att två PR:er armeras samtidigt — en befogenhet bygg-agenter uttryckligen saknar. Det är skillnaden mellan de två korten, och den ligger i konsekvens och befogenhet, inte i att båda råkar tala med samma API.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
