---
id: TASK-17.6
title: 'QA: Manuell browser-testplan — listan + kalendervyn mot S72-facitet'
status: To Do
assignee: []
created_date: '2026-07-21 08:22'
labels:
  - ready-for-human
dependencies:
  - TASK-17.1
  - TASK-17.2
  - TASK-17.3
  - TASK-17.4
  - TASK-17.5
parent_task_id: TASK-17
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan efter skiv-kedjan (körs i browsern mot staging-data, mobilmått + desktop):
1. Öppna event-listan och jämför sida vid sida mot FACIT-listvyn i S72-bilagan: kort-anatomin, månadsrubrikerna, tomrader/platshållare.
2. Växla Kommande/Tidigare och verifiera ordningen (närmast först respektive senast först); backa i historiken och verifiera att ?period följer med; ladda om på delad URL.
3. Klicka ett kort var som helst på ytan — landa på eventets sida.
4. Verifiera avvikelse-markeringarna: ett Inställt event (dimmat + genomstruket), ett fullbokat (grön kontur + Fullt) och bor över-raden med antal.
5. Växla till kalendervyn och jämför mot FACIT-kalendervyn: dag-plattornas kulör mot legenden, månadssummeringen, vald dag (guld + mörk ring); tryck en dag, se dagens kort, återvänd via Visa hela månaden.
6. Tangentbordssvep: toggle, kort, kalender och dagval utan mus; kontrollera fokusindikationen.
7. Slå på förhöjd kontrast och reducerad rörelse och gå igenom båda vyerna; skriv ut en sida och kontrollera läsbarheten.
8. Kallstart (rensa cache): verifiera Lugnt laddläge — slutgeometri direkt, inga hopp.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
