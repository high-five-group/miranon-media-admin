---
id: TASK-479.2
title: >-
  Skiva: SE16 — tidsregel och namngiven ägare för rött efter landning; svepet
  rapporterar nattens och efterkontrollens rött
status: To Do
assignee: []
created_date: '2026-09-19 10:52'
updated_date: '2026-09-19 12:08'
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
- [x] #1 CONTRIBUTING bär tidsregel + ägarregel för rött efter landning och för nattärenden, förenlig med stängningsregeln
- [x] #2 Svepet rapporterar öppna ci-post-merge- och nattärenden; tvåsidigt bevisat i svepets testsvit (öppet ärende ⇒ rad; inget ärende ⇒ tyst); intervallet är config-drivet
- [x] #3 Ett ärvt rött (samma felande test som ett äldre öppet ärende) pekas mot det första ärendet i stället för att ge ett nytt revert-förslag mot fel landning — eller, om det inte går mekaniskt, är begränsningen utskriven och kortad
- [x] #4 TASK-365 AC #3 bockad eller uttryckligen hänvisad hit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementerat: scripts/heartbeat-svep.sh § SJUNDE VÄGEN (rapportera_arende_lage(), två gh issue list-sonder — --label ci-post-merge, --search 'label:ci-natt,bokforingsdrift,beroendevarning,lankrota is:open', OR-semantiken verifierad LIVE mot repot 2026-09-19 innan bygget). Sparse: övergång (kallstart/grön→röd, röd→grön) rapporteras alltid, röd-kvarstår rapporteras med gles påminnelse (HEARTBEAT_ARENDE_PAMINNELSE_INTERVALL, default 1800s, config-driven i .heartbeat-svep-policy.conf), grönt-kvarstår är helt tyst. GLOBAL state (inte sessions-scopad) — --session filtrerar INTE bort main-läget (AC #2/kortets krav, T97). Fail-closed (77) på sondfel, samma klass som main-SHA-/PR-list-sonderna. Testsvit: scripts/test-heartbeat-svep.sh T90-T100b (16 nya fall, tvåsidigt bevis per bucket + övergång + påminnelseintervall config-drivet + session-transparens + fail-closed per sond isolerat), 133→149 totalt, shellcheck 0/0/0/0. AC #3: mekanisk länkning (samma felande TEST) kräver att parsa jobb-loggutdata — utanför TASK-479.2s Testbeslut-scope (som bara omfattar svepets egen rapportering). Escape-klausulen användes: begränsningen är utskriven i CONTRIBUTING.md § Tidsregel och ägare ('En känd, medvetet obyggd gräns') och kortad som TASK-483. AC #4: TASK-365 AC #3 bockad med en förklarande implementation-note om vilken (bredare) primitiv som faktiskt löste den. CONTRIBUTING.md ny sektion § Tidsregel och ägare + § 'Varifrån TASK-365 AC #3 är löst'. Premiss-prövning (ADR-086): #2577 verifierat existerat och varit öppet 2026-09-19 10:40-10:43Z (nu stängt) — den citerade tregruppen (#2573/#2575/#2577) höll för tidsfönstret innan #2577 stängdes, inte för ~11:45Z-ögonblicket (nu 4 öppna: #2573/#2575/#2578/#2582, mätt om). Orkestrerarens hypotes om 'två gh run list-anrop' avvisades till förmån för 'två gh issue list-anrop' (öppna ÄRENDEN, inte senaste körningens conclusion) — se CONTRIBUTING.md § Tidsregel och ägare för resonemanget.
<!-- SECTION:NOTES:END -->
