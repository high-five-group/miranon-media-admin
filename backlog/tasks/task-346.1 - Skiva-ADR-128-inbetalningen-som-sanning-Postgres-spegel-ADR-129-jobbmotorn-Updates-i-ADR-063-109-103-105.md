---
id: TASK-346.1
title: >-
  Skiva: ADR-128 (inbetalningen som sanning, Postgres, spegel) + ADR-129
  (jobbmotorn) + Updates i ADR-063/109/103/105
status: To Do
assignee: []
created_date: '2026-08-30 18:45'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-346
ordinal: 638000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bokföringen före koden. Fyra dokument: ADR-128, ADR-129, Updates-poster i ADR-063/109/103/105. Alla beslut hämtas ur sessionsdok S113 Del 11 (tretton beslut, Marcus-citat) och verifieringsrapporten (B1–B7). D0-landning utan granskningsgrind. Täcker användarberättelser: 32, 35, 37.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR-128 skriven per docs/decisions/README.md-formen med ADR-bar-stycke, indexrad, § Relaterat (ADR-057, ADR-110); Status Accepted per Marcus kvittens S113 Del 11
- [ ] #2 ADR-129 bemöter öppet research-passets B-rekommendation (asynkront-kvittojobb-byggstenar § 7) och river den med skälen ur Del 11; bär konsumentväg utan dashboard-steg, Vault-seed per miljö, auth-form cron→funktion, per_worker-fällan vid lokal test, Realtime-publikationen
- [ ] #3 Minimaltest i staging utfört och bokfört i ADR-129 § Kontext: pgmq, pg_cron, pg_net aktiverade via SQL, en kö skapad, ett cron-jobb med sekundintervall anropar en befintlig funktion via net.http_post, allt städat efteråt
- [ ] #4 ADR-109 § Updates: (a) omformad till registrera-först-skicka-sedan med förbockad ruta; beslut 2, 5, 7 rivna öppet; (d) kreditkvitto in i v1; öppna punkten 'belopp Lotta-inmatat' stängd; beslut 1, 3, 4, 6 står
- [ ] #5 ADR-063 § Updates: öppen rivning av beslut 2/6 för betalningsdomänen (kvittoledgern flyttar ut; basen förblir förstklassig leverabel för anmälan/event/priser och bär spegeln) — inte 'undantag'
- [ ] #6 ADR-103 § Updates: en prototypvariant byggd skarpt AFK för denna PRD, Marcus-beslut citerat; ADR-105 § Updates: nattmandatet B4 för 2026-08-30, en natt, inte ny norm
- [ ] #7 npm run check:docs 14 gröna; ORDLISTA oförändrad (posten Inbetalning finns)
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
