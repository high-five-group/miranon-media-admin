---
id: TASK-346.4
title: >-
  Skiva: Domän + adapter + Edge Functions — registrera inbetalning, härledning,
  spegel, makulera/radera, kvittojobb (kö + kick + konsument), Realtime,
  miljöflagga
status: Done
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-31 01:21'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies:
  - TASK-346.2
  - TASK-346.3
parent_task_id: TASK-346
ordinal: 641000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hela kedjan från 'Lotta trycker Enter' till 'kvittot ligger i bucketen och Bengt har mail' — utan UI, bevisad med tester och ett staging-anrop. Täcker användarberättelser: 5, 7, 8, 10, 16, 17, 31, 32.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Domänmodell Inbetalning/Kvitto/Jobb + zod-scheman; DataSourceAdapter får portar (lista öppna betalningar, registrera inbetalning, radera, makulera, lista inbetalningar per anmälan/person, köa kvitton, jobbstatus, visa kvitto (signerad länk), skicka igen) — port-paritet i båda adaptrarna (SupabaseAdapter kastar NOT_IMPLEMENTED där så gäller, ADR-057)
- [x] #2 Funktion registrera-inbetalning: skapar raden i Postgres i en transaktion, härleder facken (avgift klar vid summa ≥ anmälningsavgift, allt vid summa ≥ pris; avtalat pris först; föreläsning = ett pris) och skriver spegeln till Airtable (två valfält, Summa inbetalt, kvittonummer) med omförsök; eftersläpning bokförs på raden; aktivitetsloggen får poster (registrerade/makulerade/raderade)
- [x] #3 Kvittojobbet: enqueue-funktion köar N rad-ID:n, svarar direkt och kickar konsumenten (EdgeRuntime.waitUntil); konsumenten läser batch ur kön, allokerar nummer sekventiellt, renderar PDF med begränsad parallellism, skickar via Resend ett anrop per kvitto med idempotensnyckel per inbetalning, sparar PDF:en i privat bucket, finaliserar ledgern, uppdaterar jobb_rad; fel bär skäl; självläkning: pågår äldre än 5 min → väntar; funktionerna döps INTE send-*
- [x] #4 Hermetiska tester med negativ kontroll för: härledningens fyra fall + avtalat pris + återbetalning + föreläsning; beloppsnormalisering ('2 500,00', '2500,50', 'abc', '1e3'); jobbets tillståndsmaskin inkl. självläkning; dubbelskick fäller på unik nyckel
- [x] #5 Realtime: klienten prenumererar på jobb_rad-ändringar; läser läget vid appöppning
- [x] #6 Miljöflaggan VITE_FEATURE_BETALNINGAR införd (på i .env.development/.env.staging, frånvarande i prod), med rivningsnot
- [x] #7 Funktioner deployade till staging av ORKESTRERAREN före armering (B5); ände-till-ände i staging: registrera → kvitto → mail till Resend-testadress → PDF i bucket → ledgerrad, bokfört i PR-kroppen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [x] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [x] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · Landning: PR #2150 (merge 5b9ded1a, 2026-08-31 ~01:55 UTC) · CI grön per jobb via merge-kön · byggd av Opus@xhigh (bokförd ADR-089-avvikelse) · Nattens största skiva: 39+ filer, nio Edge Functions, nio adapterportar (paritet 9/9/9), domänmodell + zod, jobbmotor-konsument, Realtime-klient, miljöflagga VITE_FEATURE_BETALNINGAR, 92 hermetiska fall · Granskningsloop TRE rundor + TRE fix-rundor (ADR-105/B4): r1 fann 2 error (hermetik-regressionen — flaggan nådde fixturvärlden via delade fixtur-envens allowlist-natur; CI aldrig grön) + 6 warning + 6 info; fixade inkl. falskt 'Ej mottagen' i härledningen (mutationsbevisad negativ kontroll), cache-serverad jobbstatus (refetchOnMount always), tyst makulerings-kapplöpning (.select-mönstret), CLOSED-vid-avsiktlig-nedstängning (flagga före removeChannel, SDK-källbelagd ordning); r2 inga error, risk hög→medel; r3 KONVERGERAD exit 0 (2 info bokförda till 346.6/7) · ask-user-fyndet (inkorgs-filtrets prisnivåer) AVGJORT av orkestreraren under B3: väg (a) — basens Saknas (kr) förblir öppenhets-definitionen (Del 11 beslut 12), fönstret stängs av pris-backfillen · AC #7 UTFÖRT av orkestreraren: nio EF:er deployade till staging (f4732ce3, omdeploy 14dc98d6), KEDJEBEVISET grönt i alla sex steg inkl. spärr-vägen och retry-vägen — registrera 201/härledning/spegel, köa 202/kick, kvitto MM-2026-1003 skickat till delivered@resend.dev med PDF-bilaga (Resend delivered, 51761 bytes), signerad länk PDF-magic, ledger finaliserad, makulerat + fixtur återställd fält för fält (full tabell i PR-kommentaren) · Sidofynd: det kända röda test:api-fallet var INTE TASK-343 utan generate-event-attachment:520 → fynd-kort TASK-347 mintat · OBOCKAT MED AVSIKT: DoD #6 (orkestrerarens slutvandring — sker efter våg 6) och DoD #8 (AMENDERING-sidofiler — 346.6/346.7:s ytor).
<!-- SECTION:FINAL_SUMMARY:END -->
