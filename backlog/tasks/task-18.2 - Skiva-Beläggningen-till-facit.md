---
id: TASK-18.2
title: 'Skiva: Beläggningen till facit'
status: Done
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-23 12:52'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beläggningskortet visar innehållsmodellen som mappar basen 1-till-1 (Reserverade = Extra platser, via formulär = Källa tom, Manuellt tillagda = Manuella platser, Medföljande = Källa +1) med segmenterad mätare och streck-markörer, Väntelista-raden alltid med utanför taket — och Ändra-morfen skriver max antal platser, extra platser och manuella platser via uppdatera-event-operationen. Väntelisteplatsens event-koppling föds som ADDITIVT bas-fält (staging först). Täcker användarberättelser: 6-8 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Per-källa-uppdelningen bevisad i api-test; segmenten summerar mot basens fält
- [x] #2 Platser-morfen skriver alla tre fälten mot staging med teardown; morfen 0 px-diff
- [x] #3 Vänteliste-raden läser event-kopplade Väntelisteplatser via nya fältet; renderat mot facit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
väntar design-review (S75-batchen v2). LEVERANS (task/18.2): Beläggningen till facit — K16-innehållsmodellen (Reserverade='Extra platser' · Anmälda deltagare=Källa TOM-räkning · Manuellt tillagda='Manuella platser' · Medföljande=Källa '+1'-räkning; streck==segment, GitHub-storage-klassen) + segmenterad mätare ('X av Y platser upptagna' + procent + ' · Fullt') + Väntelista-raden ALLTID med utanför taket (K22, utan streck) + Ändra-morfen (Δ=0 px DOM-mätt dokument-relativt; likbredd w-32 per-FORMULÄR K15; ändrar-från; fokus-kontinuitet + fokus-retur; rå-RAC NumberField per prototypens precedent). NYTT BAS-FÄLT (ENDAST staging, additivt, DoD #7): Väntelista.'Event (länk)' fldMD8lVebMqXXow7 (multipleRecordLinks→Eventplanering) + auto-inverse Eventplanering.'Väntelista (länkat fält)' fld3V9HBcrYASnxSh — prod ORÖRD. get-event AGGREGERAR (batch-mönstret, T15-säkert record-ID-batch; aktiv-filter NOT Flyttad) — Fas 6b-L2:s 'ingen aggregering' öppet ersatt; update-event +reserverade/+manuelltTillagda (allowlist +'Extra platser'/'Manuella platser', L294 live-verifierad describe_table 2026-07-21); EventSchema +5 ADDITIVT-optional i eventKey-formen (utelämnas-vid-saknas, aldrig null — ProtoEvent-kollisionen undveks; P1-listan opåverkad); useUpdateEvent MERGE-cachar (räkningarna blinkar aldrig bort). PERMANENT staging-fixtur seedad via MCP (fixtures.ts BELAGGNING_*): event recIFrxHZw165ycXk (Event-681) + 4 Anmälningar (2 TOM/1 '+1'/1 Manuell) + 2 Väntelisterader (1 aktiv/1 flyttad) — enda deterministiska vägen till positiva per-källa-bevis (ingen EF skriver Källa TOM/'+1'/länken); stopp-grinden 'seeda inte i onödan' prövad öppet. MEDVETEN FACIT-AVVIKELSE (design-review-flagga): deltagar-blå är --p-blue-500 #4a6b8a, INTE facit-renderingens #1b4965 — --p-blue-700 är konstitutionellt EXKLUSIV för fokusringen; kategorifärgerna konsumerar primitiver (semantisk beläggnings-roll saknas; token-ytan consumption-only i denna skiva) — e2e asserterar att fokusring-blå ALDRIG förekommer. Grindar: biome 0 · typecheck 0 · test:api 307/307 (+4 nya, rött→grönt: 4 röda före EF-deploy → gröna efter) · build grön · e2e event-detail 25/25 (+10 nya inkl. axe-0 i Beläggnings-morfen, merge-beviset, stale-cache-formen) · angränsande (anmalda/narvaro/add-registration/mark-paid/shell) 31/31. EF:er deployade ENDAST staging (pqtshyierkdgwdnxuirz); get-event/update-event EJ i .prod-functions-allowlist.conf (fail-closed). AVVIKELSE (TDD): api-skarven rött-först bevisad; e2e-skarven skrevs test-först men rött utfall observerades inte före UI-bygget (18.1-klassens kostnadsavvägning, dev-server-cykeln). Facit-avprickningen (DoD #6): renderade skärmdumpar 390×844 (visning/Ändra-läget/mätaren/helsida) + computed-style-assertions (streck- och segmentfärger, Δ=0 px, segmentproportioner) — dumparna i batch-scratchpaden 18.2-*.png.

CI grönt per jobb: PR-run 29869238698 + main-run 29869685191 (S75-batch v2)
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-22 11:50
---
Review-fix-våg 1 del 2 LEVERERAD (PR #79 → merge 68a1aa5; main-run 29916640745 grön per jobb): beläggningsuppdelningens etikett 'Reserverade' → 'Extra platser' per Marcus-beslut 2026-07-22 ('Extra platser funkar, ta den') — basens eget fältnamn, löser termkollisionen mot kortens 'platser reserverade'. Tre render-ställen (läs-rad + morf-rad + AntalFalt-label) + K16-radordnings-assertionen; läs-shapens fältnamn reserverade består. Rött-först K16 → 31/31. DoD #5 STÅR ÖPPEN — omgranskning (Marcus generella signal 2026-07-22: 'allt jag kan se so far ser bra ut' — ej formell flipp).
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Beläggningen till facit levererad i S75-batchen (CI grön per jobb). Omgranskad efter Extra platser-fixen (PR #79: tre render-ställen + K16-assertionen; ORDLISTA-posten). DESIGN-REVIEW GODKÄND av Marcus 2026-07-23 (omgransknings-protokollet Yta 3). DoD #5 bockad; alla AC + DoD gröna.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
