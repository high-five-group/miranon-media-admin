---
id: TASK-368.3
title: >-
  Skiva: Anmälans sida — Avboka anmälan med bekräftelsesteg, skäl, betalläge och
  återbetalningsväg, samt Återta avbokning (facit-amendering ADR-102)
status: To Do
assignee: []
created_date: '2026-09-03 07:57'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.2
parent_task_id: TASK-368
ordinal: 669000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: Lotta öppnar en anmälan, trycker Avboka anmälan, ser personens betalläge, skriver eventuellt ett skäl och bekräftar. Anmälan blir avbokad, personen lämnar inkorg och dörrlista, händelsen syns i Senaste aktivitet, och skälet syns i basens Notering. Ångrar hon sig trycker hon Återta avbokning på samma sida. Steget lägger inte till något mail. Ytan är facit-stämplad sedan S111 och ändras via ADR-102-amenderingsmekaniken, precedent TASK-349. Täcker användarberättelser: 1, 2, 6, 7, 8, 19, 21, 22.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Anmälans sida är identisk med facit tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json ytan anmälningssidan, amenderat per ADR-102 med utskriven klassning + sidofil för det nya avbokningssteget; ariaSnapshot-referenser uppdaterade och gröna
- [ ] #2 För en aktiv anmälan finns knappen Avboka anmälan i sekundär destruktiv ton; den öppnar ett bekräftelsesteg med frivilligt skäl (fritext), personens betalläge (summa inbetalt och kvar att betala ur Postgres) och, när aktiva inbetalningar finns, en direkt väg till Registrera återbetalning; fokus landar i skälfältet, Avbryt är standardknapp (WAI-ARIA APG)
- [ ] #3 Efter avbokning visas statusen Avbokad på sidan, knappen ersätts av Återta avbokning, personen försvinner ur betalningsinkorgen och dörrlistan och syns under Avbokade på eventsidan; Återta avbokning sätter tillbaka statusen och knappen Avboka anmälan återkommer
- [ ] #4 Fel från servern visas inline vid steget med begriplig text och annonseras; sidan visar oförändrad status tills servern bekräftat
- [ ] #5 Acceptanstest i den hermetiska fixturvärlden (förebild: anmälans detaljsidas acceptanstest) prövar avboka med och utan skäl, återta, knappens synlighet per status, felläget, och axe noll överträdelser i båda lägena; desktop och iPad-bredd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning mot tasks/sessions/bilagor/s111-anmalningssidan-konvergens/facit.json (ADR-102 R3): skarpa ytan jämförd bild för bild mot det amenderade facitet innan Done
<!-- DOD:END -->
