---
id: TASK-70.6
title: 'Skiva: delete_branch_on_merge = true'
status: Done
assignee: []
created_date: '2026-07-28 16:34'
updated_date: '2026-07-29 08:47'
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
- [x] #1 gh api repos/high-five-group/miranon-media-admin --jq .delete_branch_on_merge ger true — utdata redovisat
- [x] #2 Nästa mergade PR:s gren är faktiskt borta på fjärren efter merge — verifierat med git ls-remote eller gh api, med PR-nummer och grennamn redovisade
- [x] #3 allow_update_branch och allow_auto_merge är oförändrade — utdata före och efter redovisat, så att inget granne-värde ändrats av misstag
- [x] #4 Ingen fil i repot ändrad av denna skiva; att den enda ändringen är en repo-inställning noteras uttryckligen i kortets slutrapport
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

En boolesk repo-inställning med ett gh api-anrop som utförande och ett gh api-svar som verifiering. Effekten är omedelbart synlig och trivialt reversibel — sätt tillbaka false.

Att skivan rör en GitHub-inställning gör den inte till human-klass. Kriteriet är om UTFÖRANDET kräver mänskligt omdöme, och här finns inget val att göra: värdet är givet av åtgärdsplanen och har ett enda rimligt utfall.

Jämför A7:3, som också rör GitHub men vars felläge kan låsa hela landningsvägen och vars acceptanskriterium kräver att två PR:er armeras samtidigt — en befogenhet bygg-agenter uttryckligen saknar. Det är skillnaden mellan de två korten, och den ligger i konsekvens och befogenhet, inte i att båda råkar tala med samma API.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad 2026-07-29 (femtonde resumen) UNDER ORKESTRERARENS EGEN HAND, inte som spawnad agent-skiva. Skälet står i kortets egen plan: utförandet kräver inget mänskligt omdöme men ändrar heller ingen fil, och en worktree-agent för en boolesk repo-inställning är fel verktyg. Restlistans precedent (TASK-64) är uttrycklig: `ready-for-agent` betyder *kräver inte Marcus omdöme* — inte *ska spawnas som skiva*.

TAGEN FÖRST AV SCHEMALÄGGNINGSSKÄL, inte för att den var enklast: dagens landningar skulle hinna städa sina egna grenar. Grenskulden hade vuxit från 263 fjärr / 191 lokala (fjortonde pausen) till 278 / 205 på några timmar — cirka +6 % på ett halvt dygn.

AC #1 — `gh api repos/high-five-group/miranon-media-admin --jq .delete_branch_on_merge` ger `true`. Utdata redovisat i PR-texten.

AC #2 — BEVISAT MED KONTRASTGRUPP, inte bara med en frånvaro. PR #418 (gren `docs/s91-femtonde-resumen`) mergades 08:46:23Z via merge queue; `git ls-remote --heads origin docs/s91-femtonde-resumen` ger därefter TOMT utdata. Kontrollgruppen är gren `docs/s91-fjortonde-pausen` från PR #417, mergad FÖRE inställningen — den ligger kvar på `b5b2bed`. Frånvaro ensam hade varit ett svagare bevis: en gren kan saknas av många skäl. Paret visar att det är inställningen som gör skillnaden.

AC #3 — grannvärdena verifierade före OCH efter: `allow_update_branch` false → false, `allow_auto_merge` true → true. Även `allow_merge_commit` / `allow_squash_merge` / `allow_rebase_merge` kontrollerade (true ×3, oförändrade), eftersom en PATCH mot repo-objektet i princip kan röra fler fält än det avsedda.

AC #4 — INGEN fil i repot ändrad av skivan. Den enda ändringen är repo-inställningen; denna commit bär kortets stängning, inget annat.

VÄGEN TILLBAKA är ett `gh api -X PATCH ... -F delete_branch_on_merge=false` och kräver ingen landning — inställningen är därmed oberoende av felläget, samma egenskap som gjorde merge queue-aktiveringen (TASK-70.1) försvarbar.

EFTERSPEL SOM MEDVETET INTE INGÅR: de 263 redan ackumulerade mergade fjärrgrenarna raderas INTE av inställningen. Kortet ändrar beteendet framåt. Den retroaktiva städningen är en separat operation som rör 263 delade refs och ligger hos Marcus som beslut — kvantifierad under resumen: 282 fjärrgrenar totalt, 263 mergade i main, 18 ej mergade (varav sex dependabot, sex proto/-grenar som kan vara avsiktligt bevarade, och tre grenar tillhörande arbete som pågår just nu).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
