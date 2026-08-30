---
id: TASK-346.3
title: >-
  Skiva: Postgres — inbetalningar, kvittoledger, sekvens, jobbtabeller,
  extensions, RLS, Realtime, purge-policy
status: Done
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-30 22:30'
labels:
  - ready-for-agent
  - intentionally-unchecked
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
- [x] #1 Migrationer i supabase/migrations skapar: inbetalningar (anmälan-record-id, ögonblicksbild namn/event/eventdatum, belopp (negativt = återbetalning), betalsatt, betalningsdatum, typ, status aktiv/makulerad + skäl, bankreferens unik när satt, kvitto-id, skapad av/när), kvitton (kvittonummer unikt, år, löpnummer, inbetalning-id UNIK, lagringsnyckel, skickad-tid, mottagare, typ kvitto/kreditkvitto, original-kvitto-id, status), kvittonummer-sekvens per år startande efter högsta befintliga (staging 1002; prod tom), jobb + jobb_rad (jobbtyp, rad-id, status väntar/pågår/skickat/fel, skäl, försök, tidsstämplar)
- [x] #2 pgmq, pg_cron, pg_net aktiverade via migration; kö skapad; cron-post var ~10 s anropar konsumentfunktionen med delad hemlighet ur Vault (staging seedad av agenten med anon-JWT/delad hemlighet; prod = Marcus, bokfört som öppet AC); konsumentvägen kräver inget dashboard-steg (security definer-wrapper i public eller funktion mot SUPABASE_DB_URL)
- [x] #3 RLS: autentiserad admin läser; skrivning endast via service_role; grant-form dokumenterad (append-only för kvitton); jobb- och inbetalningstabeller i supabase_realtime-publikationen
- [x] #4 Staging-tester (*.staging.test.ts) bevisar RLS och kontrakt-mot-tom; sekvensen bevisas tät, unik och startande efter högsta med hermetiskt test + negativ kontroll; unik nyckel inbetalning-id på kvitton bevisad (andra insättningen fäller)
- [x] #5 .purge-staging-policy.json bär Postgres-targets för testrader (sentinel-form) så nattens staging-tester inte ackumulerar; supabase/migrations/README.md uppdaterad med db push-formen (echo "" | npx supabase link --project-ref <staging>)
- [x] #6 db push mot staging utförd av ORKESTRERAREN före armering (B5) — agenten bokför exakt kommando i PR-kroppen
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
Levererad · Landning: PR #2147 (merge 92f6fb4d, 2026-08-31 ~00:10 UTC) · CI grön per jobb via merge-kön · byggd av Opus@xhigh (bokförd ADR-089-avvikelse) · Granskningsloop FEM rundor (ADR-105 + två orkestrerar-beordrade verifieringsrundor vid taket, bokfört B4-avsteg): r1 fann 1 error (funktions-grants — Supabase default-ACL ger anon EXECUTE, premissen MÄTT mot pg_default_acl) + 1 warning + 5 info → fixade; r2 fann 2 nya warnings i fixdiffen (sekvens-revoke i heta vägen — tuple concurrently updated-klassen källbelagd mot aclchk.c; G4 läste köns äldsta meddelande) → fixade på orkestrerarens B3-avgörande; r3 rent (2 kommentar-info bokförda); r4 verifierade bevis-fixarna (sentinel-id-formen + probkolumnen); r5 KONVERGERAD exit 0 (risk lag för slutspannet; PR-helheten hog per r1–r4 — bokfört i Del 12) · B5-sekvensen skarp: orkestrerarens db push (exit 0, 3 migrationer), golv-seed 2026→1003 (mätt mot Airtable-ledgern), Vault/EF-secret JOBBMOTOR_DELAD_HEMLIGHET seedad av agenten · Den skarpa körningen fångade TRE bevis-verktygsbuggar (sentinel-id 12≠14 tecken; RLS-prob mot obefintlig id-kolumn; G3 obevisbar pga now():s transaktionsstabilitet → trigger bytt till clock_timestamp, staging synkad manuellt med create or replace, öppet bokfört) · Slutbevis: staging-testerna 29/29 + verifierings-SQL exit 0 ALLA KONTROLLER PASSERADE (härledd slutkontroll, inte literal) · OBOCKAT MED AVSIKT: DoD #5–#8 är PRD-nivå-krav som prövas på kodskivorna och QA-kortet 346.13.
<!-- SECTION:FINAL_SUMMARY:END -->
