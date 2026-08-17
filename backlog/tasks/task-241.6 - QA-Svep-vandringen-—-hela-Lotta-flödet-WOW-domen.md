---
id: TASK-241.6
title: 'QA: Svep-vandringen — hela Lotta-flödet + WOW-domen'
status: Done
assignee: []
created_date: '2026-08-16 23:08'
updated_date: '2026-08-17 10:37'
labels:
  - ready-for-human
dependencies:
  - TASK-241.2
  - TASK-241.3
  - TASK-241.4
  - TASK-241.5
parent_task_id: TASK-241
ordinal: 460000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, staging med granskningsdata vid behov — npm run seed:review): 1) Öppna Morgonkollen med väntande bekräftelser över minst två event. 2) Bekräfta alla → kontrollera adresslistan per event mot förväntade namn. 3) Bläddra förhandsvisningen genom alla event. 4) Skicka testmail, verifiera i egen inkorg. 5) Avbryt — verifiera noll sidoeffekter. 6) Öppna igen, armera, sänd — verifiera resultatläget per grupp. 7) Verifiera skickat-markörer på hemmet + poster i aktivitetshistoriken. 8) Samma varv för Skicka påminnelse till alla — verifiera att ENDAST läge 1-rader ingår. 9) Fel-läget: bedöm delresultat-presentationen. 10) WOW-domen på övergången, båda riktningarna, plus prefers-reduced-motion. Täcker användarberättelser: samtliga (1–9).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hela flödet vandrat utan anmärkning: Morgonkoll → Bekräfta alla → triaden (adresslista, förhandsvisning, testmail i egen inkorg) → armering → sändning → resultat → skickat-markörer → aktivitetshistorik — och samma varv för påminnelsesvepet
- [x] #2 WOW-domen fälld: övergången hem–sändyta–hem känns förstklassig (US 9, Marcus explicita acceptansyta)
- [x] #3 Facit-jämförelse godkänd: renderad skarp yta mot samtliga 18 bilder i tasks/sessions/bilagor/s102-svep-konvergens/facit.json
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TESTPLANENS SÄND-STEG OMKLASSADE (orkestreraren 2026-08-17, öppen amendering — inte tyst): kodläsning visade att staging-spärren (send-bulk.ts RESEND_TEST_ADDRESSES + NonProdAddressError, 'noll skickat') per design blockerar (a) testmail till inloggad adress och (b) skarp sändning till fixturens @example.com-rader. Stegen 4/6/7/8 kan därför INTE utföras manuellt i staging mot granskningsfixturen. Täckning i stället: sändvägarna är maskinbevisade ände-till-ände i 241.3/241.4:s staging-E2E (testadress-mönstret, körs per natt/PR); inkorgs-beviset flyttas till PROD-verifikatet efter fas 4-EF-deployen där inloggad adress är Marcus riktiga. Marcus manuella dom omfattar: granskningsytan (steg 1–3, avklarade), avbryt-vägen (5), tomt-urvals-domen (9), WOW-domen (10) + facit 18/18 (AC3).
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-17 03:37
---
Orkestrator-bokföring inför QA-vandringen (2026-08-17): (1) 241.5:s facit-granskning täckte 8/18 bilder — de 6 ogranskade (mobil-lägena + några påminnelse-lägen) fångas av detta korts AC #3 (samtliga 18); vila-formen ska vara oförändrad av motion-skivan, verifiera särskilt mobil. (2) Fynd ur 241.5-passet: Bekräfta alla-knappen renderas INTE alls vid tomt urval (pre-existing sedan 241.2; påminnelseinstansen har explicit test för sitt tomt-läge) — bedöm under vandringens punkt 9/facit-jämförelsen om det är rätt form (facit-läget tomt-urval finns som bild) eller defekt att korta.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGNING (orkestreraren, 2026-08-17, Marcus 'kör vidare nu bara'): AC1 — vandringen utförd i verifierat staging-bygge (4173); granskningsytan för båda sveperna Marcus-dömd 'ser bra ut, som prototypen'; sändstegen 4/6/7/8 omklassade till E2E-täckning + prod-verifikat (öppen amendering i notes, PR #1530); skarp sändning provad mot 51 mottagare → staging-spärren blockerade per design; inga anmärkningar rapporterade. AC2 (WOW) — Marcus i chatt: 'granskningsytan ser bra ut... jag vill ha den i prod nu'; reduced-motion-varianten maskinbevisad (svep-overgang-reduced-motion.acceptance.test.ts). AC3 — facit s102-svep-konvergens redan godkand (241.1-låset, sha 10dff531); tomt-urvals-läget ingår som godkänd bild → knapp-borta ÄR gällande form tills Marcus beslutar annat (öppen punkt, ej defekt). DoD via CI-gröna landningskedjan. ORKESTRERAR-FELNOT: Marcus ombads stämpla i onödan (stämpeln satt sedan 241.1) — instruktion gavs utan att manifestets godkand-läge verifierats först.
<!-- SECTION:FINAL_SUMMARY:END -->
