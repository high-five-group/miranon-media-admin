---
id: TASK-479.2
title: >-
  Skiva: SE16 — tidsregel och namngiven ägare för rött efter landning; svepet
  rapporterar nattens och efterkontrollens rött
status: To Do
assignee: []
created_date: '2026-09-19 10:52'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-479
priority: high
ordinal: 832000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ett rött efter landning (ci-post-merge-ärende) och ett rött nattärende har i dag ingen ägare och ingen tidsgräns: 16 larm stod obesvarade i 10–11 dygn (åtgärdsplanen § SE16), och 2026-09-19 stod tre röda efterkontroller på main samtidigt (#2573, #2575, #2577) — alla på SAMMA ärvda testfel från en landning, varav två tillhörde en annan session än den som först såg dem. Inför: (1) en tidsregel i CONTRIBUTING (svar inom X timmar, där svar = åtgärd eller skriven motivering — stängningsregeln finns redan) och en ägarregel: den session vars landning FÖRST blev röd äger ärendet; senare ärvda röda pekar dit; (2) scripts/heartbeat-svep.sh rapporterar öppna ci-post-merge- och nattärenden som en egen rad (level-triggat men GLEST — ett känt, ägt läge ska inte larma var 90:e sekund; mätt problem 2026-09-19, se TASK-473), sessionsmedvetet enligt TASK-462; värden i .heartbeat-svep-policy.conf. TASK-365 AC #3 begär just detta — läs kortet. Källa: tasks/sessions/2026-09-17-session-126.md Del 17 beslut 10 (Marcus kvittens 2026-09-19) och docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md (åtgärdens egen rad). Varje faktapåstående är en HYPOTES tills du prövat den mot disk (ADR-086). Täcker användarberättelser: 4, 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CONTRIBUTING bär tidsregel + ägarregel för rött efter landning och för nattärenden, förenlig med stängningsregeln
- [ ] #2 Svepet rapporterar öppna ci-post-merge- och nattärenden; tvåsidigt bevisat i svepets testsvit (öppet ärende ⇒ rad; inget ärende ⇒ tyst); intervallet är config-drivet
- [ ] #3 Ett ärvt rött (samma felande test som ett äldre öppet ärende) pekas mot det första ärendet i stället för att ge ett nytt revert-förslag mot fel landning — eller, om det inte går mekaniskt, är begränsningen utskriven och kortad
- [ ] #4 TASK-365 AC #3 bockad eller uttryckligen hänvisad hit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
