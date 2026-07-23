---
id: TASK-36.1
title: 'Skiva: Gate-proof-workflowen — paraply-checkens FAIL-gren bevisas skarpt'
status: To Do
assignee: []
created_date: '2026-07-23 17:11'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-36
ordinal: 90000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Idag kan ingen visa att merge-grindens paraply-check faktiskt STOPPAR en merge när ett jobb blir rött. Att den gör det är konfig-verifierat men aldrig prövat skarpt — och det är exakt den klass av fel som orsakade S77:s end-pass-incident, där en skippad required check räknades som uppfylld och en röd PR auto-mergades.

Efter denna skiva finns en riktad workflow som vem som helst kan avfyra manuellt. Den framkallar ett rött jobb med avsikt, låter paraply-checken köra på det, och asserterar utfallet: paraply-checken MÅSTE bli failure. Blir den skipped, eller uteblir helt, är workflowen röd — beviset är inbyggt i leveransen i stället för att vara något någon läser sig till.

Workflowen bor i EGEN fil, inte i den delade CI-konfigurationen: den ska aldrig konkurrera om staging-mutexen och aldrig störa ordinarie körningar. Den blir samtidigt formen som grind-bevis i allmänhet flyttar till (se rött-först-bärarbytet), så att man aldrig mer behöver pusha avsiktligt rött till den delade sviten för att visa att en grind fyrar.

Täcker användarberättelser: 12, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En riktad, manuellt avfyrbar workflow finns som kör ENDAST det som ska bevisas — den rör aldrig staging-miljön och tar aldrig den delade mutexen
- [ ] #2 Avfyrningen tvingar ett jobb till failure och asserterar att paraply-checken får conclusion failure — inte skipped, inte frånvarande
- [ ] #3 En avfyrning där paraply-checken skippas eller uteblir gör workflowen RÖD (den är sitt eget test)
- [ ] #4 Körnings-ID för minst en grön avfyrning är citerat på kortet
- [ ] #5 S77:s öppna bevis-skuld är kvitterad: sessionsdokets och tråd-kortets referens till skulden pekar på detta bevis
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [ ] #6 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->
