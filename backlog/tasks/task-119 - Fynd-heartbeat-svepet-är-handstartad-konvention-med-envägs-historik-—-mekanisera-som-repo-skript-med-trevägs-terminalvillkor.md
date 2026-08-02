---
id: TASK-119
title: >-
  Fynd: heartbeat-svepet är handstartad konvention med envägs-historik —
  mekanisera som repo-skript med trevägs-terminalvillkor
status: Done
assignee: []
created_date: '2026-08-01 23:23'
updated_date: '2026-08-02 16:12'
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
- [x] #1 Skriptet finns, trevägs-snapshot (main/rött/DIRTY) med tvåsidigt bevis per väg (planterat fall fälls, rent fall släpps)
- [x] #2 Konfigdrivet (intervall, timeout, repo) per .conf-konventionen — inga hårdkodade projektvärden i skriptet
- [x] #3 CLAUDE.md § Landning pekar på skriptet som stående form (raden om handstartad ~90s-poll ersatt)
- [x] #4 Verktygsvals-prövning redovisad (bygg-eget vs gh extension/watch-verktyg) per A3b-kravet
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Bygg-agent (Sonnet 5, claude-sonnet-5), 2026-08-02.

scripts/heartbeat-svep.sh: config-driven (.heartbeat-svep-policy.conf) heartbeat-monitor. Trevägs-snapshot per svep — main-SHA (edge-triggered: rapporterar avancemang), röda check-rollups + DIRTY-mängd + armerings-kandidater (level-triggered per L443, rapporteras VARJE svep tillståndet håller, inte bara vid övergången — det var exakt bugen i PR #572). Datakälla uteslutande gh (pr list/api graphql), ingen egen HTTP. Exit-bitmask 0/1/2/4 (+kombinationer), 64 användningsfel, 77 sond-fel (fail-closed, samma konvention som staging-semaphore.sh).

A3b-prövning (bygg-eget vs gh extension/watch-verktyg): redovisad i skriptets eget header, dom BYGG EGET — gh pr checks --watch/gh run watch/gh pr merge saknar var för sig kö-medvetenhet, PR-bred vy eller loop; gh dash är en TUI för människor. Grundad i docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md + egen källkods-/live-verifiering 2026-08-02.

Testsvit scripts/test-heartbeat-svep.sh: 22 namngivna fall + 3 delkontroller, alla gröna. Kritisk bugg fångad AV svitens loop-test (T19): sweep_once() togglar set -e/+e internt kring gh-anrop; ett imperativt 'set +e; sweep_once; rc=$?; set -e' vid anropsstället läcker den interna återinkopplingen och avslutade hela skriptet efter EN sopning trots --timeout (reproducerat minimalt, fixat med $(fn || rc=$?)-mönstret, shellcheck SC2310 disable dokumenterat).

CLAUDE.md § Landning rad ~163 uppdaterad att peka på skriptet; ci.yml shellcheck-scope + prosaräkning (nio→tio) uppdaterad för den nya .conf-filen.

Grindar: shellcheck --severity=style --enable=all (CI-scope inkl. nya filer) 0/0/0/0. actionlint -color -ignore 'unexpected key "queue" for "concurrency" section' rent. npm run check:docs → 13 gröna. Live-verifierat (ej stub) mot high-five-group/miranon-media-admin: main-SHA-uppslag, tom PR-lista, och en genuint öppen PR (#613, öppnad av en syskon-agent under bygget) korrekt klassad som ren.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 89fa7587 (merge 1b79220f) · CI-run 30755771428 merge_group per jobb (success) · CI-grön-första-pass: ja (12/12 checks första passet, inga röda) · defekter under körning: 1 — set -e-läcka i loop-läget, självfångad av testfall T19 före push, minimal repro + regressionstest skrivet · TDD: ej tillämplig (tooling-kort; AC#1:s tvåsidiga bevis bär 22 namngivna fall i stället)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Alla AC avbockade
- [x] #6 Lokala grindar gröna för rörd fil-klass
- [x] #7 CI grön per jobb på pushad commit
- [x] #8 Inga orelaterade filer i diffen
<!-- DOD:END -->
