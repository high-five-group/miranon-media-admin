---
id: TASK-283.2
title: 'Skiva: Bokstavsraden under sökrutan — tracer bullet'
status: To Do
assignee: []
created_date: '2026-08-21 08:52'
labels:
  - ready-for-agent
dependencies:
  - TASK-283.1
parent_task_id: TASK-283
ordinal: 511000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bokstavsraden syns under sökrutan och filtrerar listan. Tunnaste kompletta vägen genom alla lager.

ÄNDE TILL ÄNDE: Lotta öppnar personlistan och ser en rad bokstäver direkt under sökrutan. Hon trycker på K och listan visar bara personer vars namn börjar på K; räknar-raden säger hur många de är. Den valda bokstaven är tydligt markerad. Trycker hon på K igen släpper filtret och hela listan kommer tillbaka. Trycker hon på hinken för namnlösa får hon dem. Skriver hon samtidigt i sökrutan smalnar urvalet av ytterligare i stället för att börja om. Ger kombinationen inget syns tomläget, inte en tom sida. Valet ligger i adressfältet, så hon kan öppna en person, backa, och hamna i samma filtrerade lista. Raden går att nå och manövrera med tangentbordet i ett svep, och en skärmläsare annonserar vilken bokstav som är vald.

Ordningen är A till Z, sedan Å, Ä, Ö sist — svensk konvention.

ALLA KNAPPAR ÄR AKTIVA I DENNA SKIVA. Nedtoningen av tomma bokstäver kommer i nästa. Trycker Lotta på en tom bokstav får hon tomläget, vilket är ett ärligt men ofärdigt beteende.

MOBIL-LAYOUTEN AVGÖRS MOT MÄTNING, inte mot antagande: 30 träffmål mot 24 pixlars golv får inte plats på en telefonbredd. Flerraders radbrytning eller horisontellt rullande behållare — välj mot renderad mätning och skriv ned vilket och varför.

HÄR ÖPPNAS ETT KÄNT RÖTT FÖNSTER: promoverings-grindens sex referenser fäller så snart raden finns, eftersom de låser den gamla formen. Det stoppar ingen landning (den sviten är inte en blockerande CI-grind), men fönstret måste stängas av facit-skivan och får inte glömmas.

Täcker användarberättelser: 2, 3, 4, 5, 7, 10, 11, 12, 13, 14, 15, 16, 17
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bokstavsraden renderas direkt under sökrutan i ordningen A-Z, sedan Å, Ä, Ö, sist hinken Utan namn
- [ ] #2 Ett tryck på en bokstav filtrerar listan via serverparametern och räknar-raden speglar det filtrerade antalet
- [ ] #3 Ett tryck på samma bokstav igen släpper filtret
- [ ] #4 Vald bokstav bär tryckt-tillstånd som annonseras av skärmläsare
- [ ] #5 Bokstav plus fritext smalnar av tillsammans; tomt utfall ger tomläget, aldrig en tom sida
- [ ] #6 Valet lever i URL:en — öppna person, backa, samma filtrerade lista
- [ ] #7 Hela raden nås och manövreras med tangentbord i ETT tabbsteg, inte trettio
- [ ] #8 Mobil-layouten vald mot RENDERAD MÄTNING (flerraders eller rullande behållare) och valet nedskrivet med skäl
- [ ] #9 Personlistans rad- och listform är identisk med facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — raden är ett tillägg ovanför, inget låst formbeslut rört
- [ ] #10 Acceptance-sviten täcker filtrering, tryckt-tillstånd, kombination med fritext, tomläge, URL-tillstånd och noll axe-överträdelser
- [ ] #11 Det kända röda fönstret i promoverings-grindens sex referenser är bokfört i skivans slutrapport och överlämnat till facit-skivan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Personlistans rad- och listform granskad mot facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — bokstavsraden är ett TILLÄGG ovanför listan och rör inget låst formbeslut
- [ ] #6 Varje bokstavsknapp minst 24x24 CSS-px — mätt i renderad yta, aldrig läst ur en klass (WCAG 2.5.8 AA)
- [ ] #7 Sentinelen undantagen ur E-filtret — bevisat med testfall, aldrig antaget (fälla 51)
<!-- DOD:END -->
