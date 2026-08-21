---
id: TASK-283.5
title: 'QA: Bokstavsindex i personlistan — manuell vandring'
status: To Do
assignee: []
created_date: '2026-08-21 08:57'
labels:
  - ready-for-human
dependencies:
  - TASK-283.1
  - TASK-283.2
  - TASK-283.3
  - TASK-283.4
parent_task_id: TASK-283
ordinal: 514000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan i webbläsaren. Körs av Marcus efter att skiva 1 till 4 landat.

1. Öppna personlistan. Ligger bokstavsraden direkt under sökrutan, och ser den ut att höra ihop med den?
2. Räkna knapparna. Är det A till Z, sedan Å, Ä, Ö, och sist "Utan namn"?
3. Tryck på en vanlig bokstav, till exempel K. Visas bara personer som börjar på K? Stämmer räknar-radens siffra med vad du ser?
4. Tryck på samma bokstav igen. Kommer hela listan tillbaka?
5. Tryck på Å. Får du de fem Åsa-personerna, och INGA A-namn?
6. Tryck på A. Får du A-namn, och INGA Åsa-personer?
7. Tryck på E. Dyker det upp personer utan namn i listan? Det ska det INTE göra.
8. Tryck på "Utan namn". Får du dem där i stället?
9. Titta på Ä och Ö. Är de nedtonade och omöjliga att trycka på?
10. Skriv något i sökrutan medan en bokstav är vald. Smalnar urvalet av, eller börjar det om?
11. Skriv något som inte kan finnas, till exempel "zzz", med en bokstav vald. Får du ett tydligt tomläge, inte en trasig sida?
12. Byt bokstav några gånger och titta på raden. Flyttar sig något under den? Det ska det inte.
13. Öppna en person, backa tillbaka. Hamnar du i samma filtrerade lista?
14. Ta upp appen i telefonen. Går alla knappar att träffa utan att du råkar välja fel? Ryms raden, eller bryts den snyggt?
15. Tabba genom sidan. Går det att passera hela raden utan att trycka trettio gånger?

Fyller något av stegen dig med tvekan: skriv ett nytt kort med exakt symptom och förväntat beteende. Retuschera aldrig detta kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga 15 steg i testplanen gångna i webbläsaren, desktop och telefon
- [ ] #2 Varje avvikelse har fått ETT EGET kort med exakt symptom och förväntat beteende — detta kort retuscheras aldrig
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
