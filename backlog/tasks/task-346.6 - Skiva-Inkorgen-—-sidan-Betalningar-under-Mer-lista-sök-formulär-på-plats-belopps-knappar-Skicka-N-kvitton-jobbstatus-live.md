---
id: TASK-346.6
title: >-
  Skiva: Inkorgen — sidan Betalningar under Mer: lista, sök, formulär på plats,
  belopps-knappar, Skicka N kvitton, jobbstatus live
status: To Do
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-31 01:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.4
parent_task_id: TASK-346
ordinal: 643000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lottas lördag från Hem-kortet (kommer i 346.7) till 'Skicka 8 kvitton'. Byggs som EN skarp variant (ADR-103 § Updates, B3) — Marcus justerar vid morgongranskningen. Täcker användarberättelser: 1, 2, 3, 4, 6, 7, 8, 9, 10, 15, 26, 27, 29, 30.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Route /mer/betalningar bakom miljöflaggan; Mer-listan får raden Betalningar (AMENDERING-sidofil i tasks/sessions/bilagor/s64-mer-konvergens/ med klassen ny form, förhandsmandat S113 Del 11; övriga ytor i manifestet identiska med facit)
- [x] #2 Listan = öppna betalningar (Saknas > 0, status ≠ Avbokad/Ombokad) grupperade per kommande event närmast först; Klara hopfällda; Tidigare event under eget filter; obekräftade märkta; förfallen-märke när slutbetalningens deadline passerat; sökfältet har fokus vid öppning och filtrerar på namn/telefon/belopp; personer med öppna betalningar rankas först, övriga sist med 'registrera ändå'
- [x] #3 Formuläret öppnas på plats i raden: belopps-knappar härledda ([1 000 · anmälningsavgift] [2 500 · allt] [annat…], anpassade efter redan inbetalt), fritt fält som accepterar '2 500,00', betalsätt (senast använda), datum (i dag), ruta Skicka kvitto (förbockad), notering; Enter registrerar; ⌘/Ctrl+Enter och knappen 'Registrera och skicka' gör båda; fel som text vid fältet + aria-live; efter Enter kvitterar raden, listan uppdateras, fokus åter i tomt sökfält
- [ ] #4 Stående knapp 'Skicka N kvitton' när kvitton väntar: klicket kvitteras direkt, raderna tickar skickat/fel med skäl (Delutfall-formen), Skicka igen på fallerade; notis '8 kvitton skickade' via Realtime och vid appöppning
- [x] #5 Belopp som täcker båda facken sägs rakt ut ('2 500 kr täcker anmälningsavgift + slutbetalning'); udda belopp visar saknas-rest
- [ ] #6 Designsystemet rakt av (SidRam, kort, pill, steg-räknare, Delutfall, dra-reglage där relevant); prefers-reduced-motion, prefers-contrast, iPad 820 px (numeriskt tangentbord, radhöjd); axe 0 överträdelser
- [ ] #7 Acceptanstest i browsern mot staging-fixturen: sök → tre registreringar (1 000 / 2 500 / annat) → Skicka 3 kvitton → utfall per rad; skärmdumpar desktop + iPad i PR-kroppen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [ ] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [ ] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
- [ ] #9 Facit-granskning: tasks/sessions/bilagor/s64-mer-konvergens/facit.json — AMENDERING-sidofil skriven, övriga ytor identiska
<!-- DOD:END -->
