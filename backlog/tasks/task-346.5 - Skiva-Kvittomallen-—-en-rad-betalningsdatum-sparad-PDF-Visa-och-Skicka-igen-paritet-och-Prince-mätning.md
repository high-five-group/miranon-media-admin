---
id: TASK-346.5
title: >-
  Skiva: Kvittomallen — en rad, betalningsdatum; sparad PDF; Visa och Skicka
  igen; paritet och Prince-mätning
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
ordinal: 642000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kvittot ser ut som Lottas förlaga fast för en inbetalning, sparas, kan visas och skickas igen. Rör INTE adaptern (portarna ligger i 346.4). Täcker användarberättelser: 12, 13, 33, 34.

Modell: Sonnet@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 kvitto.html/css + receipt-content: en rad med inbetalningens belopp (netto/moms/betalt oförändrat), raden Förfallodatum ersatt av Betalningsdatum ur inbetalningen, Datum = utfärdande; kursnamn/etikett orörda (TASK-306 rättelsevarv); fixtur och _kalla uppdaterade
- [x] #2 Bundlad kopia synkad (scripts/synka-bilagemallar.mjs) och scripts/check-mallparitet.sh grön; docs/mallar/bilagor/README.md § Kvittots FORM uppdaterad (tokenytan 1:1)
- [x] #3 Prince ≡ Chrome inom 0,5 mm mätt med npm run mall:pdf + pdftotext -bbox på ny fixtur; benämningen radbryts inte vid 72 tecken
- [x] #4 Visa kvitto ger signerad länk till sparad PDF; Skicka igen skickar samma PDF med samma nummer till angiven adress utan ny allokering (hermetiskt test + negativ kontroll: ett nytt nummer fäller)
- [x] #5 Kreditkvittots mallvariant förberedd som token (rubrik, hänvisning, negativa belopp) men aktiveras i skiva 346.9
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
Levererad · Landning: PR #2152 (merge 9486da6a, 2026-08-31 ~02:20 UTC) · CI grön per jobb via merge-kön · byggd av Sonnet@xhigh · Förlagan läst och MÄTT (aldrig ögonmätt): Prince ≡ Chrome max delta 0,23 mm (krav 0,5); mätningen fångade en verklig layoutregression (dt-kolumnen 17,78→21,80 mm för Betalningsdatum) · Betalningsdatum-raden ur inbetalningen, Datum = utfärdande, kursnamn/etikett orörda (TASK-306) · Kreditkvitto-token förberedd, ej aktiverad (346.9) · Unicode-minus-normalisering fixad med negativ kontroll · Granskningsloop 1 runda: rent (1 kosmetisk info), risk hog av domänskäl — B4-armerad vid konvergens i substans · Orkestreraren omdeployade jobb-konsument/preview-receipt/send-receipt-email från PR-head · OBOCKAT MED AVSIKT: DoD #5–#8 är PRD-nivå (prövas på kodskivorna/QA-kortet).
<!-- SECTION:FINAL_SUMMARY:END -->
