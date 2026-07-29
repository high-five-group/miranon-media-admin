---
id: TASK-79
title: >-
  Fynd: hem:1097 är en fjärde flake-form — byte-identisk skärmdump efter
  dubbel-rAF, och den enda klass-B-liknande CI faktiskt ser
status: To Do
assignee: []
created_date: '2026-07-29 00:56'
labels:
  - ready-for-agent
dependencies: []
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Funnen av TASK-74:s diagnos 2026-07-29. Efter att klass A stängdes är detta den ENDA klass-B-liknande flaken som CI faktiskt fäller på: 1 av 14 jobb efter, mot 6 av 14 före.

Formen är ny och matchar ingen av TASK-74:s tre mekanismer (B1 kall route-chunk, B2 vaktens två observatörer, B3 test-budget vid mättnad). Testet tar en skärmdump efter dubbel-rAF och får en BYTE-IDENTISK bild — alltså inte en timing-miss i vanlig mening, utan att den andra bilden är exakt densamma som den första.

### VARFÖR DEN ÄR VÄRD ETT EGET KORT

TASK-74:s agent föreslog egen tråd men tog inte scope-beslutet. Beslutet blev KORT, inte tråd: en tråd är för en öppen fråga utan form. Denna har form (byte-identisk bild), belägg (1/14 mot 6/14) och en avgränsad yta (ett test). Det är plockbart arbete, inte en fråga att fundera på.

Den är dessutom den enda kvarvarande klass-B-liknande signalen i CI. Så länge den lever kan ingen säga att acceptance-sviten är ren, vilket är hela steg 1:s mål ('signalen går att lita på').

### VAD SOM INTE FÅR ANTAS

Att dubbel-rAF är rätt väntemekanism. Byte-identiska bilder kan betyda att rAF-paret returnerar innan den avsedda målningen skett, ELLER att det som väntas på inte påverkar pixlarna alls. De två kräver olika fixar och skiljs bara av mätning.

Angränsar TASK-74:s B1 (kall route-chunk) — pröva om orsaken är gemensam innan formerna slås ihop, men slå INTE ihop dem utan det beviset.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Orsaken lokaliserad och belagd: skiljer 'rAF-paret returnerar för tidigt' från 'väntan mäter fel sak' — med mätning, inte resonemang
- [ ] #2 Fällningsraten mätt före och efter fixen under KONTROLLERAD last, båda talen redovisade; loadavg vid mätningen angiven
- [ ] #3 Prövat mot TASK-74:s B1 om orsaken är gemensam — svaret redovisat oavsett riktning, formerna slås inte ihop utan belägg
- [ ] #4 Ingen ny väntan införd som bara döljer symptomet: negativt self-test som visar att fixen fäller när den ska
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
