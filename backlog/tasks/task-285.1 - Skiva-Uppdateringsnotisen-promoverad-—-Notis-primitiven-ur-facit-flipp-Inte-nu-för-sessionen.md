---
id: TASK-285.1
title: >-
  Skiva: Uppdateringsnotisen promoverad — Notis-primitiven ur facit, flipp, Inte
  nu för sessionen
status: To Do
assignee: []
created_date: '2026-08-21 10:54'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-285
ordinal: 516000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när en ny version av appen aktiverats i bakgrunden visas en liten överlagrad notis nere till höger, ovanför TabBar-pillen, på vilken vy Lotta än står — utan att sidan flyttar sig en pixel. Den säger 'Ny version av appen' och 'Ladda om när du är klar med det du gör.' med knapparna 'Inte nu' och 'Ladda om'. Den försvinner aldrig av sig själv. 'Inte nu' döljer den för resten av sessionen; en NY version visar den igen. Skärmläsaren får beskedet artigt, fokus flyttas aldrig, regionen har ett tillgängligt namn och finns alltid i DOM:en — bara innehållet växlar.

FORMEN ÄR LÅST: facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json ytan uppdateringsnotis (amenderad 2026-08-21: ingen kontur). Den körande prototypen är Uppdateringsnotis.tsx vid ?variant=1 — promoveringen (ADR-103) flippar villkoret i AppUpdateBanner så den överlagrade notisen blir info-lägets ovillkorliga form; formen byggs aldrig om. Bygg den som en återanvändbar Notis-primitiv (titel, brödtext, valfri knapprad) med uppdateringsnotisen som första konsument, så offline-beskedet (egen skiva) kan bli den andra. Chunk-läget rörs inte här (egen skiva). Växlaren, ?variant-grenen och prototyp-routen RIVS INTE — de står kvar tills godkand är satt (check-facit.sh fäller annars).

ORDNING (ADR-103 B4): ta ariaSnapshot-referensen av variant-läget FÖRE flippen, flippa, verifiera identisk efter. Test-konsument-svepet (webbläsarbeteende-sviten för uppdateringsbannern) uppdateras i samma commit: tom region i normalläget, notisen tar ingen plats förrän signalen kommer, fokus stjäls inte, omladdning först vid val, Inte nu döljer, återkomst kräver ny version. sessionStorage-läsning och -skrivning i try/catch (privat/låst läge kastar).

Täcker användarberättelser: 1, 2, 3, 4, 13, 16, 18
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Den överlagrade notisen är identisk med facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json ytan uppdateringsnotis i läget ny version finns, vid 390 px och 1280 px (ingen kontur, vänsterkant i info-färg, fast bredd max 22 rem, ovanför TabBar-pillen)
- [ ] #2 Ett anrop utan ?variant visar den överlagrade notisen — info-lägets banner-form finns inte längre i skarp kod
- [ ] #3 Layoutförskjutningen vid visning är 0 mätt med PerformanceObserver layout-shift i testmiljön, vid 390 och 1280 px
- [ ] #4 Inte nu döljer notisen för sessionen (överlever navigering, inte ny flik), och en ny version visar den igen; ingen timer döljer den någonsin
- [ ] #5 role=status-regionen är alltid monterad med aria-live=polite och ett tillgängligt namn; fokus flyttas aldrig; verifierat i webbläsarbeteende-sviten
- [ ] #6 ariaSnapshot-paret variant före == promoverad efter är grönt
- [ ] #7 Inga animationer eller transitions på notisen; print döljer den
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [ ] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [ ] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->
