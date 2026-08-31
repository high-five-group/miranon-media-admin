---
id: TASK-346.11
title: 'Skiva: Prod-runbook för Postgres och jobbmotorn + morgonchecklista för Marcus'
status: To Do
assignee: []
created_date: '2026-08-30 18:46'
updated_date: '2026-08-31 04:37'
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
- [x] #1 docs/reference bär en runbook (samma form som prod-driftsattning-runbook.md) för prod: migrationer (db push med prod-ref som argument, aldrig ur config — samma lås som fas4-prod-deploy.sh), extensions, Vault-hemlighet, cron-post, Realtime-publikation, nya funktioner i .prod-functions-allowlist.conf, funktionsdeploy, miljöflaggan i Vercel, prod-fält i basen, backfill-GO, facit-stämplar; varje steg med verifieringskommando och förväntat utfall
- [x] #2 Checklistan är i ordning, kopieringsbar, och pekar på var agenten stannar (prod) och var Marcus tar vid
- [x] #3 npm run check:docs 14 gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [ ] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [ ] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad. Byggd av Sonnet 5 (Sonnet@xhigh, bokford modell). Ny fil docs/reference/prod-driftsattning-betalningsflodet-runbook.md (samma form som prod-driftsattning-runbook.md): 16 steg (lanka, tre migrationer, kvittoseriens golv 1001 plus arssteg, Vault-hemligheterna med digest-verifikat, sekundintervall-kontroll plus cron.alter_job-fallback, Realtime-publikationen, allowlist-forutsattning for nio EF:er, funktionsdeploy, deny-smoke 9x3=27 utfall, prod-falten i basen inkl korrigerad Saknas-formel, priser pa kommande event, backfill-GO-pekare, miljoflaggan i Vercel, valfritt rok-test, facit-stamplar) plus Morgonchecklista (7 punkter) plus Rullbakat R1-R5 plus Fallor-tabell (9 poster). Tva pekare uppdaterade (backfill-inbetalningar.md, supabase/migrations/README.md) fran bar TASK-346.11-referens till konkret lank. PREMISS-DIVERGENS funnen och bokford oppet i runbooken: data-model.md pastar att BADA scripts/create-eventinnehall-modell.mjs OCH scripts/create-betalningsfalt.mjs bar AIRTABLE_PROD_GODKAND_AV_MARCUS-vagen mot prod - verifierat mot kallkod att bara den FORSTA gor det; runbooken ger Marcus tva vagar i stallet for att latsas skriptet redan fungerar mot prod. check:docs 14/14 grona (markdownlint MD031 fallde 17 ganger initialt, fixat). git status ren, tre filer rorda, inga orelaterade. OBOCKAT MED AVSIKT: DoD 5-8 ar PRD-niva-krav som provas pa kodskivorna och QA-kortet 346.13, inte pa en docs-only runbook-skiva.
<!-- SECTION:FINAL_SUMMARY:END -->
