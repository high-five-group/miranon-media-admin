---
id: TASK-286.1
title: >-
  Skiva: Adaptern och EF:en lär sig hela registret — breddad fullwalk, båda
  implementationerna, laddtid mätt
status: Done
assignee: []
created_date: '2026-08-21 11:44'
updated_date: '2026-08-22 08:53'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-286
ordinal: 516000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: ett anrop till datalagrets nya parameterlösa registerfråga returnerar samtliga personer som uppfyller basfiltret (minst en anmälan), med exakt de fält listan visar i dag, i ETT svar. Inget i appen konsumerar den ännu — skivan slutar med att EF:en är deployad till staging och verifierad med direktanrop, så nästa skiva kan byta källa mot en EF som redan svarar.

HUR (ADR-123 beslut 1): DataSourceAdapter får kontraktet; AirtableAdapter anropar get-persons i ett nytt parameterlöst läge där EF:ens BEFINTLIGA fullwalk (den som i dag räknar total med fields: ['Namn']) breddas till alla mapPerson-fält och returnerar posterna. Ingen ny mekanism, ingen ny EF. Dagens sök-/cursor-läge är oförändrat (byte-identiskt svar för befintliga anrop — AC). SupabaseAdapter bär stubben med samma signatur. Airtable-constraints P4/P5/P6 gäller: 100 poster per sida, 5 req/s delad — walken är sekventiell, som i dag.

MÄT, ANTA INTE: kall och varm svarstid för registerläget mot staging (som bara har ~60 poster) OCH extrapolerad mot prods 559 (sex sidor); bokför metod och tal i PR:en och i kortets notes. Påstå aldrig en prod-kostnad du inte mätt — skriv 'extrapolerat'.

Täcker användarberättelser: 14, 16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 DataSourceAdapter bär en parameterlös registerfråga, implementerad i AirtableAdapter och som stub i SupabaseAdapter — komponentlagret ser bara kontraktet
- [x] #2 get-persons i registerläget returnerar samtliga poster som uppfyller basfiltret med samma fält som listan visar, via den befintliga fullwalken breddad — ingen andra walk
- [x] #3 Befintliga anrop (sök/cursor, utan registerparametern) ger byte-identiskt svar mot före skivan — bevisat med testfall
- [x] #4 EF:ens staging-svit täcker registerläget (antal = basfiltrets träffmängd, fältmängd, att ZZ-fixturer kommer med)
- [x] #5 Kall och varm svarstid mätt mot staging och extrapolerad till 559 poster, med metod, i PR:en och kortets notes
- [x] #6 EF:en deployad till staging (projekt pqtshyierkdgwdnxuirz — aldrig prod) och verifierad med direktanrop; UPDATED_AT läst, inte VERSION
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [x] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [ ] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #5 - svarstid, MATT + EXTRAPOLERAT (2026-08-21, staging pqtshyierkdgwdnxuirz, direktanrop mot deployad v29). MATT (get-persons?register=true, 60 poster, 1 Airtable-sida): kall 917 ms; varm 888/875/1027 ms (3 rep); svarsstorlek 38505 bytes for 60 poster ca 642 B/post (ADR-123 skattade ca 616 B/post). KALIBRERING (samma tabell, pageSize=10, 6 sekventiella sidor via befintliga paginerade laget): sida 1-6 = 890/973/1011/799/847/3305 ms (sida 6 en outlier - sammanfaller med fyra andra bygg-agenter mot samma staging-Airtable-bas just da, delad 5 req/s-budget P4/P5). Snitt exkl outlier ca 904 ms/sida. EXTRAPOLERAT (ej matt) till prods 559 poster (6 sidor a 100, sekventiellt): grovt 6x~900ms ca 5,4s under normal last - detta ar en EXTRAPOLERING, inte en matning av prod-skalan. Verklig risk: en enskild 429-paus under en 6-sidig walk kan ensam adda minst 30s (Airtables tvingande backoff) - vi sag en 3,3s-variant av just den risken i kalibreringen. Bor matas om i en lugnare miljo/tidpunkt (ADR-123 paragraf Oppet, skalgransen) innan det anvands som hard SLA-siffra.

STÄNGNINGSPASS (register-only, 2026-08-22): PR #1699 (merge-SHA 3ef0168e), CI grön per jobb (gh pr checks 1699 — samtliga pass/förväntat skip). DoD #1 belagd: AC-listan i kortet var redan fullt avbockad. DoD #2 belagd via PR-beskrivningens grindtabell (typecheck 0, biome — 1 pre-existing fel i orörda filer/noll i denna diff, build 0, test:api 927 passed). DoD #4 verifierat mot gh pr diff --name-only (6 filer: adaptrar, EF, två testfiler, kortfilen — inga orelaterade). DoD #5-#7 LÄMNAS OKRYSSADE — byggagenten skrev i PR-beskrivningen att de bedöms ej tillämpliga (sök-/filterlogiken orörd, ingen klientkod som PersonsList.tsx rörd — hör till TASK-286.2), men gjorde INTE den N/A-bedömningen till en bockning själv ('Kortet sätts INTE till Done'). Jag adjudikerar inte den tillämplighetsfrågan i detta register-pass — flaggat i slutrapporten för orkestrerarens beslut.

STÄNGNINGSPASS 2 (kortstängnings-agent, uppdrag efter det flaggade "register-only"-passet ovan): adjudikerar tillämplighetsfrågan som lämnades öppen. Not: mitt FÖRSTA försök i denna session byggde av misstag på en STALE lokal worktree-checkout (fast-forwardades aldrig efter git fetch) och skrev en nu-överskriven felaktig anteckning som påstod att DoD #1-#4 var obockade — det var fel, de var redan korrekt bockade i origin/main (se stängningspasset direkt ovan). Rättat via git reset --hard origin/main innan detta andra försök. Bevisen nedan är oberoende verifierade mot gh pr diff/checks 1699 och facit-manifest, inte ärvda från "register-only"-passets bedömning.

#5 (paritetstest sök/filter, "för varje skiva som rör sök eller filtrering"): OTILLÄMPLIG. gh pr diff 1699 --name-only rör inga klientfiler (ingen PersonsList.tsx, inga sök-/filterhooks). PR-beskrivningens edge-case-tabell visar register=true+search=... ger IDENTISKT resultat som utan search — sökparametern ignoreras helt i registerläget ("search ignoreras helt i registerläget, per ADR-123 'parameterlös'"). Sök-/filterlogiken hör till TASK-286.2 (beroendespärrad på denna skiva, se PRD-kortet TASK-286 vars DoD-lista denna är kopierad ifrån). Kravets förutsättning existerar inte för denna skiva.

#6 (facit-referenser personlistan, "formen är orörd"): BELAGD, bockad. tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json deklarerar personlistan-ytans källor som src/routes/_authenticated/personer/index.tsx och src/components/persons/PersonsList.tsx. gh pr diff 1699 --name-only innehåller INGENDERA fil — formen är därmed bevisligen orörd (fil-frånvaro i diffen, starkare bevis än ett grönt regressionstest). check-facit.sh kört lokalt: exit 0 (12 manifest, 27 ytor, 2 ogodkända) — obs, den grinden avgör uttryckligen INTE visuell korrekthet (se skriptets eget doc-block), primärbeviset är diff-frånvaron.

#7 (nätverksanrop vid skrivning efter första laddningen): OTILLÄMPLIG. Kravet gäller en klient som redan söker/filtrerar i minnet efter första laddningen — denna skiva bygger ingen klientkonsumtion. Kortets egen ÄNDE-TILL-ÄNDE-text: "Inget i appen konsumerar den ännu ... nästa skiva (TASK-286.2) byter listans källa". gh pr diff 1699 bekräftar noll klientfiler rörda. Kravets förutsättning (en fungerande klientläsväg att mäta) existerar inte här.

CI grön per jobb bekräftat separat: gh pr checks 1699 mot merge-commit 3ef0168e — samtliga jobb pass/skipping, noll fällningar.

Kortet sätts Done.
<!-- SECTION:NOTES:END -->
