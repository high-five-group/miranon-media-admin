---
id: TASK-346.9
title: 'Skiva: Kreditkvitto, återbetalning, makulera och radera i UI'
status: Done
assignee: []
created_date: '2026-08-30 18:46'
updated_date: '2026-08-31 13:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.5
  - TASK-346.6
parent_task_id: TASK-346
ordinal: 646000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bokföringsloopen sluts i appen: fel rättas som poster, aldrig genom radering av utfärdade kvitton. Täcker användarberättelser: 16, 17, 18, 33.

Modell: Sonnet@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Radera: inbetalning utan kvitto kan raderas från raden (bekräftelse), facken räknas om, aktivitetslogg-post
- [x] #2 Makulera: inbetalning med kvitto får 'Makulera' med skäl (obligatoriskt); raden visar makulerad + skäl; kvittot består i ledgern märkt makulerat; summan räknas om; aktivitetslogg
- [x] #3 Återbetalning: 'Registrera återbetalning' på anmälan/rad skapar negativ inbetalning (belopp, betalsätt, datum) med ruta 'Skicka kreditkvitto' förbockad; kreditkvittot får nästa nummer i samma serie, hänvisar till originalkvittot, negativa belopp med samma momsdelning; går via samma jobbmotor
- [x] #4 Hermetiska tester + negativ kontroll: makulerad rad påverkar inte kvittots nummer; kreditkvitto utan original fäller; summan efter återbetalning öppnar facket igen
- [ ] #5 Acceptanstest: makulera ett kvitto, registrera en återbetalning, kreditkvitto skickat till testadress, PDF visar hänvisningen
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
<!-- DOD:END -->
