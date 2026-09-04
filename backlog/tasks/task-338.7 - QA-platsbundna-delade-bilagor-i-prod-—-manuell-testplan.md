---
id: TASK-338.7
title: 'QA: platsbundna delade bilagor i prod — manuell testplan'
status: To Do
assignee: []
created_date: '2026-08-29 08:05'
labels:
  - ready-for-human
dependencies:
  - TASK-338.1
  - TASK-338.2
  - TASK-338.3
  - TASK-338.4
  - TASK-338.5
  - TASK-338.6
parent_task_id: TASK-338
ordinal: 617000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (prod, Marcus): 1) Mer → Dokument → Delade dokument → ladda upp parkeringsbilagan (Rogers förlaga) med 'Delat dokument' + Plats Rönninge, övriga axlar tomma; sammanfattningen säger 'Gäller: alla event i Rönninge'; raden visar badge 'Rönninge'. 2) Ladda upp sushimenyn med Familj RIM + Plats Rönninge; badge 'RIM · Rönninge'. 3) Öppna ett kommande RIM-event i Rönninge: båda dokumenten syns i dokumentlistan med badge, ej raderbara/ersättbara där. 4) Öppna ett Fjärrskådnings-event i Rönninge: parkeringsbilagan syns, sushimenyn inte. 5) Öppna ett event på annan plats (Falköping/Varberg): inget av dem syns. 6) Åtgärds-sidan för Rönninge-eventet: bilageväljaren listar parkeringsbilagan; skicka en bekräftelse till testmottagare → bilagan bifogad. 7) De två dokument som laddades upp 2026-08-29 som 'Alla event': välj 'Ändra räckvidd' i räckviddsläget, sätt Plats Rönninge → badge byter utan omuppladdning; ett event på annan plats tappar dem. 8) Skapa ett nytt event i Rönninge (Plats härleds vid create) → dokumenten finns direkt i dess lista. 9) Tillgänglighet: hela dialogen med tangentbord + VoiceOver; sammanfattningsraden läses upp vid ändring; 375 px. 10) Airtable: en Bilagor-rad läser 'Gemensam · RIM · Rönninge' i kolumnerna (Platsnamn). Varje avvikelse blir nytt fynd-kort. Efter godkännande: ny facit-baslinje för s108-dokumentytan (ADR-074). Täcker användarberättelser: samtliga.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hela testplanen genomförd i prod av Marcus; varje avvikelse bokförd som nytt fynd-kort med exakt symptom och förväntat beteende; godkännandet citerat
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
- [ ] #7 Facit-granskning mot tasks/sessions/bilagor/s108-dokumentytan/facit.json ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren': avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje tas först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->
