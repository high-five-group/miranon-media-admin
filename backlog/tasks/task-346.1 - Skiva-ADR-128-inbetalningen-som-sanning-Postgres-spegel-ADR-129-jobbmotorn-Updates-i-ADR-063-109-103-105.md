---
id: TASK-346.1
title: >-
  Skiva: ADR-128 (inbetalningen som sanning, Postgres, spegel) + ADR-129
  (jobbmotorn) + Updates i ADR-063/109/103/105
status: Done
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-30 19:47'
labels:
  - ready-for-agent
  - intentionally-unchecked
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
- [x] #1 ADR-128 skriven per docs/decisions/README.md-formen med ADR-bar-stycke, indexrad, § Relaterat (ADR-057, ADR-110); Status Accepted per Marcus kvittens S113 Del 11
- [x] #2 ADR-129 bemöter öppet research-passets B-rekommendation (asynkront-kvittojobb-byggstenar § 7) och river den med skälen ur Del 11; bär konsumentväg utan dashboard-steg, Vault-seed per miljö, auth-form cron→funktion, per_worker-fällan vid lokal test, Realtime-publikationen
- [x] #3 Minimaltest i staging utfört och bokfört i ADR-129 § Kontext: pgmq, pg_cron, pg_net aktiverade via SQL, en kö skapad, ett cron-jobb med sekundintervall anropar en befintlig funktion via net.http_post, allt städat efteråt
- [x] #4 ADR-109 § Updates: (a) omformad till registrera-först-skicka-sedan med förbockad ruta; beslut 2, 5, 7 rivna öppet; (d) kreditkvitto in i v1; öppna punkten 'belopp Lotta-inmatat' stängd; beslut 1, 3, 4, 6 står
- [x] #5 ADR-063 § Updates: öppen rivning av beslut 2/6 för betalningsdomänen (kvittoledgern flyttar ut; basen förblir förstklassig leverabel för anmälan/event/priser och bär spegeln) — inte 'undantag'
- [x] #6 ADR-103 § Updates: en prototypvariant byggd skarpt AFK för denna PRD, Marcus-beslut citerat; ADR-105 § Updates: nattmandatet B4 för 2026-08-30, en natt, inte ny norm
- [x] #7 npm run check:docs 14 gröna; ORDLISTA oförändrad (posten Inbetalning finns)
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
Levererad · Landning: PR #2144 (merge 6433d482, 2026-08-30 ~19:45 UTC) · CI grön per jobb via merge-kön · byggd av Opus@xhigh (bokförd ADR-089-avvikelse) · AC 1–7 bockade med mätta värden (ADR-128 + ADR-129 Accepted; Updates i ADR-063/109/103/105; minimaltest pgmq/pg_cron/pg_net i staging utfört och städat till byte-identiskt utgångsläge; check:docs 14 gröna) · Två mätfynd ändrade ADR-129:s beslut: pgmq_public skapas INTE av extensionen (→ security definer-wrapper) och anon-JWT passerar verify_jwt (→ delad hemlighet som auktorisation) · D0-landning utan granskningsgrind per kortets beskrivning; orkestreraren läste båda ADR:erna + alla fyra Updates-poster i sin helhet före armering · OBOCKAT MED AVSIKT: DoD #5–#8 är PRD-nivå-krav (pengalogikens negativa kontroller, orkestrerarens slutvandring, miljöflaggan, AMENDERING-sidofiler) som en docs-only ADR-skiva strukturellt inte kan uppfylla — de prövas på kodskivorna och QA-kortet 346.13.
<!-- SECTION:FINAL_SUMMARY:END -->
