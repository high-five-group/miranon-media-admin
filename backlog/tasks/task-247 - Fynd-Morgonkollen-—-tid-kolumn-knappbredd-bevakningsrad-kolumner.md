---
id: TASK-247
title: 'Fynd: Morgonkollen — tid-kolumn, knappbredd, bevakningsrad-kolumner'
status: To Do
assignee: []
created_date: '2026-08-16 21:08'
updated_date: '2026-08-16 21:38'
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
- [x] #2 Bekräfta alla och Skicka påminnelse till alla renderas med identisk bredd (containerns fulla bredd), verifierat mot renderad yta
- [ ] #3 Bevakningsradernas tre delar (eventnamn / dagar kvar / status) renderas i separata kolumner som alignar mellan rader, verifierat mot renderad yta; facit.json amenderas i den form ADR-102/103 föreskriver för en medveten facit-ändring
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 (tid-kolumn) EJ AVBOCKAD, premiss ej reproducerad. NyaAnmalningar.tsx rad 70-71 (oförändrad sedan 243.1/d794669f) beräknar och renderar relTid när inskickadTid(reg) är finite. Byggde staging-mode (npm run build:staging) + vite preview --port 4173 (CORS-tillåten enligt prototyp-verifiering-runbook.md), loggade in som TEST_USER mot RIKTIG staging-data, screenshotade Hem 1440px+390px: tid-kolumnen syns på VARJE synlig rad i BÅDA viewports, före och efter (b)/(c). Kan ej reproducera saknas som kodfel. Trolig förklaring: data-model.md rad ~571 dokumenterar Inskickad (fldNtSHQivkL26B6L) som KÄND ojämnt-ifylld datafälla i Airtable — specifika PROD-anmälningar Marcus granskade kan sakna värdet i BASEN (ADR-063: resolution I BASEN), inte en kodregression. Ingen kodändring gjord för denna del.

AC #2 (knappbredd) AVBOCKAD, verifierad. BulkAtgardsknapp.tsx wrapper ändrad inline-block till flex flex-col (matchar prototypens DodIngang-wrapper i dev/hem-prototyp/ui.tsx). Mätt via Playwright boundingBox före/efter: 124,5px vs 222,75px (olika bredd) till 504px/504px (1440px) och 310px/310px (390px) (identisk bredd) på båda viewports.

AC #3 (bevakningsrad-kolumner) KODEN KLAR OCH VERIFIERAD, FACIT-BOKFÖRINGEN ÖPPEN (STOP per uppdragstext). Bevakningsrad.tsx omskriven med nästlad responsiv grid: mobil (under 640px) staplar eventnamn på egen rad + dagar-status därunder (samma information som originalets sammanhängande rad, ingenting förloras); sm-breakpoint och uppåt blir samma wrapper sm:contents och adopteras som tre riktiga grid-celler (grid-cols-[2fr_7rem_minmax(9rem,1fr)]) som alignar identiskt mellan rader. EN FÖRSTA PLATT 4-KOLUMNSVERSION MÄTTES TRASIG PÅ MOBIL (390px): fasta kolumner plus gap plus chevron summerade till exakt tillgänglig bredd och eventnamn-kolumnen kollapsade till 0 bredd - Fjärrskådning försvann helt ur renderingen. Fångat via mobil-screenshot INNAN commit, aldrig pushat i trasigt läge. Nuvarande responsiva form verifierad på 1440px och 390px, före- och efter-skärmdumpar tagna.

FACIT-BOKFÖRING (STOP, per uppdragstext: STOPPA för c:s bokföringsdel). facit.json har godkand:null (ej Marcus-stämplat via 243.4 ännu) men lasning satt (Varv 4 ser bra ut, lås facit) - dvs LÅST men inte GODKÄNT. ADR-102 B2 tillåter avsteg vid uttryckligt bokfört Marcus-beslut (uppfyllt, S102 sjätte paus rad 1192-1194) men varken ADR-102 eller ADR-103 ger en mekanik för HUR ett sådant avsteg bokförs i facit-registret INNAN 243.4:s stämpel. Två kandidat-mekaniker hittade, ingen uttryckligt matchande: (1) facit-supersede-prejudikatet (arkivflytt + ARKIVERAD.md) - använt när ett HELT manifest ersätts, känns för tungt för en delrad-ändring i ett redan aktivt manifest; (2) en in-place-notering i samma facit.json - ingen prejudikat hittad för denna form. Jag har INTE rört facit.json eller facit-bilderna. Koden är byggd per Marcus order, registret lämnas åt orkestreraren/243.4 att avgöra i rätt mekanik.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Avvikelse-fixvarvet 0.5 klart för (b) och (c)s kod, (a) ej reproducerad och (c)s facit-bokföring öppen (STOP, se notes). Fixade: (b) BulkAtgardsknapp.tsx wrapper inline-block till flex flex-col — knappar nu fullbredd/identisk bredd, verifierat via renderad skärmdump + boundingBox-mätning 1440px och 390px. (c) Bevakningsrad.tsx omskriven till nästlad responsiv grid — kolumner alignar på sm-plus, staplar säkert på mobil (en första platt version kollapsade eventnamn-kolumnen till 0 på 390px, fångat och rättat innan push). (a) Kod oförändrad — kunde inte reproducera saknad tid-kolumn mot riktig staging-data i två viewports; trolig datafälla i Airtable Inskickad-fältet (dokumenterad i data-model.md), inte kodfel. DoD-kvartett grön: test:api 788 passed, typecheck 0 fel, biome 0 fel i rörda filer, build exit 0.
<!-- SECTION:FINAL_SUMMARY:END -->
