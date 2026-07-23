---
id: TASK-36.1
title: 'Skiva: Gate-proof-workflowen — paraply-checkens FAIL-gren bevisas skarpt'
status: In Progress
assignee: []
created_date: '2026-07-23 17:11'
updated_date: '2026-07-23 17:56'
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
- [x] #1 En riktad, manuellt avfyrbar workflow finns som kör ENDAST det som ska bevisas — den rör aldrig staging-miljön och tar aldrig den delade mutexen
- [ ] #2 Avfyrningen tvingar ett jobb till failure och asserterar att paraply-checken får conclusion failure — inte skipped, inte frånvarande
- [ ] #3 En avfyrning där paraply-checken skippas eller uteblir gör workflowen RÖD (den är sitt eget test)
- [ ] #4 Körnings-ID för minst en grön avfyrning är citerat på kortet
- [ ] #5 S77:s öppna bevis-skuld är kvitterad: sessionsdokets och tråd-kortets referens till skulden pekar på detta bevis
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Leverans: .github/workflows/gate-proof.yml — riktad workflow_dispatch-workflow, egen fil, egen concurrency-grupp (gate-proof-${run_id}), rör aldrig staging/staging-tests-mutexen, ingen checkout.

Design (3 jobb): forced-red (step-nivå continue-on-error → genuint exit 1, jobbet grönt, step-outcome=failure exponeras som jobb-output) → umbrella-replica (if: always() ENSAMT; verbatim ci-passed fail-closed jq-gren matad med forced-reds outcome via jobb-output; step-COE ger observerbar outcome utan att sänka körningen) → assert-proof (enda jobb UTAN continue-on-error, färgar körningen: GRÖN endast om repliken körde rent OCH dess FAIL-gren blev failure; skipped/absent/ej-fyrad → RÖD). Negativ kontroll: workflow_dispatch-input simulate_skip=true tvingar repliken att skippa → assert fångar → RÖD (AC#3, sitt eget test).

Plattforms-tvingade trohets-noter (öppna): (1) GitHub kan inte visa ett rött JOBB i en grön körning, så den avsiktliga failuren manifesteras som en STEP-outcome. (2) Jobb-nivå continue-on-error maskerar failure till success i BÅDE needs.result OCH REST-API:ts conclusion (actions/toolkit#1739, verifierat mot förstapartsdok) — därför används endast STEP-nivå-COE och signalen förmedlas via jobb-output, inte needs.result. jq-fail-closed-uttrycket är byte-för-byte ci-passed; endast shell-testen moderniserad [ ] → [[ ]] för shellcheck-strict.

Lokala grindar gröna: actionlint 1.7.12 (pinnad, kör shellcheck på run:), yamllint 1.38.0 (.yamllint.yml), shellcheck 0.11.0 strict (--severity=style --enable=all). Rött-först lokalt: fail-closed jq körd med SIGNAL=failure→exit 1, SIGNAL=cancelled→exit 1, SIGNAL=success→exit 0. L322-invarianten oregresserad: ci.yml orörd (ci-passed har if: always() ensamt + exit-1-steg). AC#2-5 + DoD#1/#3 kvar till stängning: kräver gate-proof-avfyrning på main + citerat run-ID.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [x] #6 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->
