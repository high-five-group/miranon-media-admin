---
id: TASK-18.14
title: 'QA: Manuell browser-testplan — eventsidan mot S73-facitet'
status: Done
assignee: []
created_date: '2026-07-21 08:22'
updated_date: '2026-07-23 14:55'
labels:
  - ready-for-human
dependencies:
  - TASK-18.1
  - TASK-18.2
  - TASK-18.3
  - TASK-18.4
  - TASK-18.5
  - TASK-18.6
  - TASK-18.7
  - TASK-18.8
  - TASK-18.9
  - TASK-18.10
  - TASK-18.11
  - TASK-18.12
  - TASK-18.13
parent_task_id: TASK-18
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan efter skiv-kedjan (körs i browsern mot staging-data; ETT kommande och ETT genomfört event):
1. Jämför helsidan mot FACIT-eventsidan-helsida respektive FACIT-tidigare-event-helsida: sektionsordningen, topprad, grupper utanför kort.
2. Om eventet: tryck Ändra — verifiera att INGET hoppar (morfen), ändra ort och spara, ladda om och se nya värdet; ändra tillbaka.
3. Beläggning: verifiera segmenten mot kända staging-värden, ändra max antal platser och se mätaren följa med; återställ.
4. Anmälda deltagare: klicka en summeringsrad (filter + Rensa), växla kategori-flik, öppna/stäng grupperna; bekräfta EN obekräftad anmälan (mail + status-flip), kör Bekräfta alla och avbryt i kontrollfrågan.
5. Bor över: öppna kryss-läget, kryssa två personer, se live-räknaren och listkortets rad följa med (öppna listan i annan flik).
6. Betalningar: öppna arbetsytan, kryssa en slutbetalning, skriv en notering, öppna Påminn-mailet (ämnesraden bär betalningen), verifiera deadline-badgen (start minus 14 dagar).
7. Närvaro-registret på det genomförda eventet: bockar + Total närvaro-procenten mot kända värden.
8. Gruppdynamik: expandera en nivågrupp (kurshistoriken i kursfärgerna), öppna Läs mer på en motivering.
9. Anteckningar: skriv en anteckning (författare + tidsstämpel), verifiera Under/Efter-etiketterna på det genomförda eventet och auto-grow-rutan (skriv fem rader).
10. Hover-plattorna på åtgärdsraderna; tangentbordssvep genom HELA sidan; förhöjd kontrast + reducerad rörelse; verifiera att prototyp-växlaren är BORTA (rivningen).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
