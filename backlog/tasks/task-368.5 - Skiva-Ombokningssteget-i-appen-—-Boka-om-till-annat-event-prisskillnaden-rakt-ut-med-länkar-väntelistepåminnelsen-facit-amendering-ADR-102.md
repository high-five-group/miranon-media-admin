---
id: TASK-368.5
title: >-
  Skiva: Ombokningssteget i appen — Boka om till annat event, prisskillnaden
  rakt ut med länkar, väntelistepåminnelsen (facit-amendering ADR-102)
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.3
  - TASK-368.4
parent_task_id: TASK-368
ordinal: 671000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: Lotta trycker Avboka anmälan, väljer i stället Boka om till annat event, ser vilket belopp som blir att återbetala eller saknas, och bekräftar. Personen har nu en ny anmälan med pengarna på plats, den gamla är avbokad med skälet ifyllt, och Lotta landar på den nya anmälan. Avbokar hon i stället ser hon hur många som väntar på plats. Ytan amenderas i facitet en gång till. Täcker användarberättelser: 12, 13, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Anmälans sida är identisk med facit tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json ytan anmälningssidan, amenderat per ADR-102 med utskriven klassning + sidofil för ombokningsvalet och väntelistepåminnelsen; ariaSnapshot-referenser uppdaterade och gröna
- [ ] #2 Avbokningssteget har valet Boka om till annat event: en eventväljare (kommande event, samma form som skapa-anmälan) och skälet förifyllt 'Ombokad till <event, datum>' (redigerbart); bekräftelsen anropar ombokningsoperationen och landar på den NYA anmälans sida med ett kvitto i klartext på vad som hände
- [ ] #3 Prisskillnaden sägs rakt ut i steget innan bekräftelse: 'Nya eventet kostar X kr, Y kr blir att återbetala' eller 'saknas Y kr' eller 'samma pris'; efter bekräftelse visas samma text med länk till Registrera återbetalning respektive registrera inbetalning; inkorgen ändras inte
- [ ] #4 När eventet som avbokas har personer på väntelistan visar bekräftelsesteget 'N personer väntar på plats' med länk till väntelistan; ingen automatik, ingen skrivning
- [ ] #5 Acceptanstest i den hermetiska fixturvärlden prövar ombokning med samma pris, dyrare och billigare event, förifyllt och redigerat skäl, väntelistepåminnelsen med och utan väntande, felläget, axe noll överträdelser; desktop och iPad-bredd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning mot tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json (ADR-102 R3): skarpa ytan jämförd bild för bild mot det amenderade facitet innan Done
<!-- DOD:END -->
