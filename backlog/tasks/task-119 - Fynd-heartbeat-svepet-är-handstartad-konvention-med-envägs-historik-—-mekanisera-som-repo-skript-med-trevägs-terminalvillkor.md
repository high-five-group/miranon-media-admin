---
id: TASK-119
title: >-
  Fynd: heartbeat-svepet är handstartad konvention med envägs-historik —
  mekanisera som repo-skript med trevägs-terminalvillkor
status: To Do
assignee: []
created_date: '2026-08-01 23:23'
updated_date: '2026-08-02 15:08'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 191000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S91 tjugoandra resumen (2026-08-01→02, orkestrerar-empiri). Heartbeaten (landningssvepets väckningsmekanism, CLAUDE.md § Landning) är i dag en bakgrunds-bash orkestreraren skriver för hand varje session. Tre mätta felmoder samma kväll: (1) envägs-nyckling — main-topp-vakten var blind för RÖTT (PR #572, fångad av Marcus, samma klass som fragmentet vakt-som-bara-pollar-lyckat-lage-ar-blind-for-rott som redan låg på fil = tredje L328-beviset att regel utan mekanism inte efterlevs); (2) blind för DIRTY — armerad-men-konfliktad PR (#575) landar aldrig och går aldrig röd, tredje tysta tillståndet; (3) armering-är-inte-minne (#565, #575) — re-arm/disambiguering måste ingå i svepet. Åtgärd: skriv heartbeaten som repo-skript (t.ex. scripts/heartbeat-svep.sh) med TREVÄGS-snapshot inkodad (main-SHA · röda check-rollups · DIRTY-mängd), konfigdrivna intervall/timeout per .conf-konventionen (CLAUDE.md § config-driven grindvakts-logik), och dokumenterad start i § Landning så nästa orkestrerare startar rätt form i stället för att återuppfinna fel. Precedens: docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md (polling+svep är branschform; gh CLI 10s, actions/runner 15-60s backoff, Kubernetes watch+resync).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skriptet finns, trevägs-snapshot (main/rött/DIRTY) med tvåsidigt bevis per väg (planterat fall fälls, rent fall släpps)
- [ ] #2 Konfigdrivet (intervall, timeout, repo) per .conf-konventionen — inga hårdkodade projektvärden i skriptet
- [ ] #3 CLAUDE.md § Landning pekar på skriptet som stående form (raden om handstartad ~90s-poll ersatt)
- [ ] #4 Verktygsvals-prövning redovisad (bygg-eget vs gh extension/watch-verktyg) per A3b-kravet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Alla AC avbockade
- [ ] #6 Lokala grindar gröna för rörd fil-klass
- [ ] #7 CI grön per jobb på pushad commit
- [ ] #8 Inga orelaterade filer i diffen
<!-- DOD:END -->
