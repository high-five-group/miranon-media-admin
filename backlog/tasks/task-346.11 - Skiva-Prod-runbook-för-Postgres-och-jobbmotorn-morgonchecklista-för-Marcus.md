---
id: TASK-346.11
title: 'Skiva: Prod-runbook för Postgres och jobbmotorn + morgonchecklista för Marcus'
status: To Do
assignee: []
created_date: '2026-08-30 18:46'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.3
  - TASK-346.4
parent_task_id: TASK-346
ordinal: 648000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Morgonen ska vara en checklista, inte en utredning. Täcker användarberättelser: 36.

Modell: Sonnet@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/reference bär en runbook (samma form som prod-driftsattning-runbook.md) för prod: migrationer (db push med prod-ref som argument, aldrig ur config — samma lås som fas4-prod-deploy.sh), extensions, Vault-hemlighet, cron-post, Realtime-publikation, nya funktioner i .prod-functions-allowlist.conf, funktionsdeploy, miljöflaggan i Vercel, prod-fält i basen, backfill-GO, facit-stämplar; varje steg med verifieringskommando och förväntat utfall
- [ ] #2 Checklistan är i ordning, kopieringsbar, och pekar på var agenten stannar (prod) och var Marcus tar vid
- [ ] #3 npm run check:docs 14 gröna
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
