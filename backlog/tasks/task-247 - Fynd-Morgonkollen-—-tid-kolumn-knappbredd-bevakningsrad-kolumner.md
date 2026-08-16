---
id: TASK-247
title: 'Fynd: Morgonkollen — tid-kolumn, knappbredd, bevakningsrad-kolumner'
status: To Do
assignee: []
created_date: '2026-08-16 21:08'
labels: []
dependencies: []
ordinal: 455000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Avvikelse-fixvarvet punkt 0.5 ur S102:s resume-sekvens (tasks/sessions/2026-08-10-session-102.md rad 1187-1202). Marcus tre fynd i skarpa Morgonkollen (prod, live via Vercel auto-deploy från main efter TASK-243.1): (a) AVVIKELSE — tid-kolumnen ("för N tim sedan") saknas på Nya anmälningar-raderna i vissa vyer trots att den finns i koden (NyaAnmalningar.tsx) och i facit (tasks/sessions/bilagor/s102-hem-konvergens/facit.json, bilden facit-hem-v1-demo-desktop.png visar tidsangivelser per rad); (b) AVVIKELSE — Bekräfta alla-knappen (NyaAnmalningar.tsx) och Skicka påminnelse till alla-knappen (ForfallnaBetalningar.tsx) är olika breda eftersom BulkAtgardsknapp.tsx:s wrapper är inline-block (shrink-to-fit) i stället för prototypens flex flex-col-stretch-kedja (dev/hem-prototyp/ui.tsx DodIngang) — facit visar båda knapparna fullbredd; (c) NY ÄNDRING (Marcus design-order, medveten facit-amendering per ADR-102/103): bevakningsradernas text delas i kolumner (Eventnamn · X dagar kvar · Eventinfo saknas) så de alignar rakt över varandra i stället för dagens sammanhängande inline-textrad (Bevakningsrad.tsx).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tid-kolumnen syns på alla rader i Nya anmälningar där reg.inskickad är satt, verifierat mot renderad yta (dev-server/preview + screenshot), inte bara kod
- [ ] #2 Bekräfta alla och Skicka påminnelse till alla renderas med identisk bredd (containerns fulla bredd), verifierat mot renderad yta
- [ ] #3 Bevakningsradernas tre delar (eventnamn / dagar kvar / status) renderas i separata kolumner som alignar mellan rader, verifierat mot renderad yta; facit.json amenderas i den form ADR-102/103 föreskriver för en medveten facit-ändring
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
