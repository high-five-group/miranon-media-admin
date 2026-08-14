---
id: TASK-214.1
title: >-
  Skiva: WRITE-enabling — allowlist-posten set-attendance-status +
  create-attendance-EF + API-testparet
status: To Do
assignee: []
created_date: '2026-08-14 19:09'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-214
ordinal: 402000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skrivvägen för närvaro byggs och bevisas ände-till-ände i API-skarven, utan att någon UI-yta rörs: en Status-skrivning mot en befintlig Deltaganden-rad går genom den generiska update-record-EF:en via den nya allowlist-posten, och en saknad rad kan skapas atomärt av den nya create-attendance-EF:en (backup-vägen — rotorsaken läks i basen via 213.12). A8 äger Avstämt: appen skriver aldrig tidsstämpeln. Komplett förarbete med beslutstabell, färdig allowlist-rad, testpar och räcken: S90-förarbetets skarpa underlag (tasks/sessions/bilagor/s90-checkin-forarbete). Styrande: PRD task-214, S103 Del 15 (F2, F5), ADR-050/066/104. Täcker användarberättelser: 13, 14, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Allowlist-posten set-attendance-status finns (tabellen Deltaganden per namn, ENDAST fältet Status) och update-record accepterar en Status-skrivning mot en befintlig Deltaganden-rad i staging
- [ ] #2 create-attendance-EF:en skapar en Deltaganden-rad atomärt med server-side-byggda fält (Anmälan-länk, Event-länk, Session, Status satt till Närvarande) enligt husets EF-mönster med auth och DENY/ALLOW-loggning — varje användning syns i loggen
- [ ] #3 API-testparet grönt i staging: deny på Avstämt-skrivning, allow-toggle Närvarande/Ej avstämt verifierad via läsvägen, create-attendance-testet skapar och städar egna rader
- [ ] #4 Testerna asserterar aldrig på Avstämt och rör aldrig historik- eller granskningsfixturer
- [ ] #5 Attribuerings-noten dokumenterad i data-model-referensen: Registrerad av bokför teknisk skribent (lastModifiedBy) för app-skrivna rader (väg a, S103 Del 15 F5)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [ ] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
<!-- DOD:END -->
