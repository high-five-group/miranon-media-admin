---
id: TASK-241.2
title: 'Skiva: Sändytans skal + trygghetstriaden mot facit'
status: To Do
assignee: []
created_date: '2026-08-16 23:01'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.1
parent_task_id: TASK-241
ordinal: 456000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skarp overlay-sändyta ovanpå Hem, promoverad ur /dev/svep-prototyp mot låst facit (ADR-102 B5: formen är godkänd — bygget är dataväg + skarphet, aldrig omdesign). Prototypkoden i src/components/dev/svep-prototyp/ är förlagan. Täcker användarberättelser: 1, 2, 3, 4, 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bekräfta alla på Morgonkollen öppnar sändytan som overlay; Avbryt/Escape stänger utan sidoeffekter — identisk med facit tasks/sessions/bilagor/s102-svep-konvergens/facit.json ytan Sändytan, lägena granska-adresslista + granska-förhandsvisning, desktop 1440 och mobil 390
- [ ] #2 Adresslistan grupperad per event ur VERKLIG data — samma urvalskälla som Morgonkollens räknare för Anmälningar att bekräfta
- [ ] #3 Bläddringsbar per-event-förhandsvisning ifylld ur verklig mall- och mottagardata — identisk med facit-läget förhandsvisning
- [ ] #4 Testmail skickas SKARPT till inloggad användare via Åtgärds-sidans befintliga testmail-kontrakt — identisk med facit-läget testmail
- [ ] #5 Armeringsinteraktionen (dra-för-att-bekräfta) identisk med facit-läget armerat; skarp svep-sändning ligger UTANFÖR skivan (241.3) och frånvaron bokförs öppet i notes
- [ ] #6 Tomt urval renderas identiskt med facit-läget tomt-urval
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s102-svep-konvergens/facit.json (18 bilder) — renderad yta jämförd läge för läge
<!-- DOD:END -->
