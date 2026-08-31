---
id: TASK-346.6
title: >-
  Skiva: Inkorgen — sidan Betalningar under Mer: lista, sök, formulär på plats,
  belopps-knappar, Skicka N kvitton, jobbstatus live
status: Done
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-31 04:03'
labels:
  - ready-for-agent
  - intentionally-unchecked
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
- [x] #4 Stående knapp 'Skicka N kvitton' när kvitton väntar: klicket kvitteras direkt, raderna tickar skickat/fel med skäl (Delutfall-formen), Skicka igen på fallerade; notis '8 kvitton skickade' via Realtime och vid appöppning
- [x] #5 Belopp som täcker båda facken sägs rakt ut ('2 500 kr täcker anmälningsavgift + slutbetalning'); udda belopp visar saknas-rest
- [x] #6 Designsystemet rakt av (SidRam, kort, pill, steg-räknare, Delutfall, dra-reglage där relevant); prefers-reduced-motion, prefers-contrast, iPad 820 px (numeriskt tangentbord, radhöjd); axe 0 överträdelser
- [x] #7 Acceptanstest i browsern mot staging-fixturen: sök → tre registreringar (1 000 / 2 500 / annat) → Skicka 3 kvitton → utfall per rad; skärmdumpar desktop + iPad i PR-kroppen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [ ] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [x] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
- [ ] #9 Facit-granskning: tasks/sessions/bilagor/s64-mer-konvergens/facit.json — AMENDERING-sidofil skriven, övriga ytor identiska
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · Landning: PR #2154 (merge 32436db1, 2026-08-31 ~03:20 UTC) · CI grön per jobb via merge-kön · byggd av Opus@xhigh · Inkorgen /mer/betalningar: gruppering, sök-ranking, formulär på plats, härledda beloppsknappar, Skicka N kvitton med Delutfall + Realtime, 52 nya testfall, full vandring mot staging (8 skärmdumpar, kvitton MM-2026-1004–1006 konsumerade/makulerade, fixturen återställd fält för fält) · Granskningsloop 2 rundor: r1 fann äkta a11y-golv-fynd (fokus vid öppning/Avbryt) → fixat med husets buttonRef-mönster + Esc, bevisat med activeElement-tabell, axe 0; r2 rent · Divergens hanterad efter regeln: s64-mer-konvergens var ALDRIG ett stämplat facit (facit.json har aldrig funnits; glob matchar inte) — sidofil skriven med divergensen först, verkliga formlåset mer-index.staging.test.ts uppdaterat · Notering-fältet: samsyns-gap i 346.4:s schema, B3-avgjort → uppföljningsmigration med avtalat_pris-kolumnen på Marcus GO (STOPPA-rad) · Tre egna vandringsfynd rättade (cache-serverad inkorg, gammalt jobb som dagens, grupprubrikens namn) · OBOCKAT MED AVSIKT: DoD #5/#6/#8 (PRD-nivå; #8:s stämplade ytor är 346.7:s).
<!-- SECTION:FINAL_SUMMARY:END -->
