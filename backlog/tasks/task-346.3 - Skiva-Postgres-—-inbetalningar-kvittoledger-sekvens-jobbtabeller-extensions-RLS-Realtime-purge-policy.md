---
id: TASK-346.3
title: >-
  Skiva: Postgres — inbetalningar, kvittoledger, sekvens, jobbtabeller,
  extensions, RLS, Realtime, purge-policy
status: To Do
assignee: []
created_date: '2026-08-30 18:45'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.1
parent_task_id: TASK-346
ordinal: 640000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pengarna får ett hem med garantier: unikhet, sekvens, transaktion, kö. Inget UI ännu. Täcker användarberättelser: 31, 32, 37.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migrationer i supabase/migrations skapar: inbetalningar (anmälan-record-id, ögonblicksbild namn/event/eventdatum, belopp (negativt = återbetalning), betalsatt, betalningsdatum, typ, status aktiv/makulerad + skäl, bankreferens unik när satt, kvitto-id, skapad av/när), kvitton (kvittonummer unikt, år, löpnummer, inbetalning-id UNIK, lagringsnyckel, skickad-tid, mottagare, typ kvitto/kreditkvitto, original-kvitto-id, status), kvittonummer-sekvens per år startande efter högsta befintliga (staging 1002; prod tom), jobb + jobb_rad (jobbtyp, rad-id, status väntar/pågår/skickat/fel, skäl, försök, tidsstämplar)
- [ ] #2 pgmq, pg_cron, pg_net aktiverade via migration; kö skapad; cron-post var ~10 s anropar konsumentfunktionen med delad hemlighet ur Vault (staging seedad av agenten med anon-JWT/delad hemlighet; prod = Marcus, bokfört som öppet AC); konsumentvägen kräver inget dashboard-steg (security definer-wrapper i public eller funktion mot SUPABASE_DB_URL)
- [ ] #3 RLS: autentiserad admin läser; skrivning endast via service_role; grant-form dokumenterad (append-only för kvitton); jobb- och inbetalningstabeller i supabase_realtime-publikationen
- [ ] #4 Staging-tester (*.staging.test.ts) bevisar RLS och kontrakt-mot-tom; sekvensen bevisas tät, unik och startande efter högsta med hermetiskt test + negativ kontroll; unik nyckel inbetalning-id på kvitton bevisad (andra insättningen fäller)
- [ ] #5 .purge-staging-policy.json bär Postgres-targets för testrader (sentinel-form) så nattens staging-tester inte ackumulerar; supabase/migrations/README.md uppdaterad med db push-formen (echo "" | npx supabase link --project-ref <staging>)
- [ ] #6 db push mot staging utförd av ORKESTRERAREN före armering (B5) — agenten bokför exakt kommando i PR-kroppen
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
