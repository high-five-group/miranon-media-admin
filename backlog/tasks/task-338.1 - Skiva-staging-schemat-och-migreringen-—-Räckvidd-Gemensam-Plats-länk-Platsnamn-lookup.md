---
id: TASK-338.1
title: >-
  Skiva: staging-schemat och migreringen — Räckvidd 'Gemensam', Plats-länk,
  Platsnamn-lookup
status: Done
assignee: []
created_date: '2026-08-29 08:03'
updated_date: '2026-09-04 08:16'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-338
ordinal: 611000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan bär STAGING-basen (apphjj8Q7lkXCMsL4 — prod app8uGPrVCVOm6LfD är FÖRBJUDEN i denna skiva) den nya lagringsformen: Bilagor.Räckvidd har en fjärde option 'Gemensam'; Bilagor har en ny länk 'Plats' → Platser (tbl7ER0wNqAZ9ZhEq) och ett lookup-fält 'Platsnamn' (Platser.Namn); varje befintlig staging-rad med Räckvidd 'Kurstyp' eller 'Alla event' är migrerad till 'Gemensam' med Kursfamilj/Kursnivå bevarade, räkneverifierat före och efter med filterByFormula (samma form som TASK-275:s migrering, data-model.md § Bilagor). De permanenta rollup-fixturerna och .purge-staging-policy.json rörs inte; nya fält behöver ingen purge-target (verifiera och bokför). data-model.md § Bilagor får fält-ID:n för staging med prod-kolumnen markerad 'väntar TASK-338.6'. Airtable-operationer via PAT-MCP:n (mcp__airtable__*) mot staging med bas-guard i varje anrop. Täcker användarberättelser: 13, 14 (staging-halvan).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Staging: option 'Gemensam' finns på Bilagor.Räckvidd; länkfältet Plats (→ Platser) och lookup Platsnamn finns; fält-ID:n bokförda i data-model.md § Bilagor
- [x] #2 Staging: 0 rader med Räckvidd 'Kurstyp' eller 'Alla event' kvar; antal 'Gemensam' = summan före migreringen; Kursfamilj/Kursnivå oförändrade på migrerade rader — talen före/efter i Implementation Notes
- [x] #3 Prod-basen bevisligen orörd (ingen prod-ref i något anrop; bas-ID kontrollerat i varje MCP-anrop och bokfört)
- [x] #4 Befintliga staging-sviter (get-event-attachments, upload-attachment, delete-attachment) körda efter migreringen — utfall bokfört; gamla EF:en läser fortfarande de migrerade raderna tills TASK-338.2 landar (rött här är väntat och bokförs, inte döljs)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Modell-identitet:** Sonnet 5 (Claude Sonnet 5, agent-transcript).

**Premiss-pass (ADR-086):** worktree föddes ur `d1de121b` (`docs/task-338-prd-skivor`, PR #2076). `git fetch` gav inga nya commits på `origin/main` utöver vad worktreen redan hade (`10c0cedf` var HEAD på `main` vid start) — arbetade alltså direkt på worktree-basen, ingen divergens att rapportera. Kortets fält-ID-referenser (data-model.md § Bilagor rad ~305–350, Räckvidd `fldU6i9Ju5HRwSRBf`, Platser `tbl7ER0wNqAZ9ZhEq`/`Namn` `fldSDJcY7cb4dam3Y`) verifierade LIVE mot staging via `describe_table` FÖRE varje skrivoperation — alla stämde exakt mot dokumentationen. Ingen divergens funnen.

**MCP-anropslogg (samtliga mot `apphjj8Q7lkXCMsL4`, staging — bas-ID läst/kontrollerat i varje anrop, prod `app8uGPrVCVOm6LfD` INTE anropad någon gång):**
1. `describe_table` Bilagor (`tblFamrna53MVf1nG`) — verifiera nuvarande schema före skrivning.
2. `describe_table` Platser (`tbl7ER0wNqAZ9ZhEq`) — verifiera länkmålet.
3. `list_records` Bilagor, filter `OR(Räckvidd='Kurstyp', Räckvidd='Alla event')` — RÄKNA FÖRE: 9 rader (6 Kurstyp, 3 Alla event).
4. `list_records` Bilagor, alla 45 rader (Namn+Räckvidd) — helhetsbild (13 Event, 9 mål, 23 utan Räckvidd).
5. `update_field` Bilagor.Räckvidd (`fldU6i9Ju5HRwSRBf`) — beskrivnings-uppdatering (lyckades; name/description-vägen fungerar).
6. `update_field` samma fält med extra `options`-payload — MISSLYCKADES avsiktligt som prov: `INVALID_REQUEST_UNKNOWN` ("name, description, and/or options must be specified") — bevisar att MCP-wrappern stryper `options` innan Airtable ens ser den.
7. Rå Web-API PATCH mot samma fält, SAMMA PAT som MCP-servern (`~/.claude.json` `mcpServers.airtable.env.AIRTABLE_API_KEY`) — MISSLYCKADES med Airtables egen 422 `"Changing a field's type or number precision is not currently supported"` (två varianter provade, med och utan `type`). Bekräftar: plattformens Metadata-API stödjer inte choice-tillägg på befintlig singleSelect, oavsett verktyg.
8. `update_records` Bilagor, 1 rad (`recAxj9idz6ofqoMo`) → `Räckvidd: "Gemensam"` — LYCKADES, Airtables typecast skapade choicen automatiskt (`selxFObtdzHsUJiun`).
9. `describe_table` Bilagor — verifierade choicen föddes korrekt (namn "Gemensam", egen ID).
10. `create_field` Bilagor → `Plats` (multipleRecordLinks → Platser `tbl7ER0wNqAZ9ZhEq`) → `fldmkHUxPNRRA0Rxi`. Auto-född spegel på Platser: `Bilagor` (`fldbdACukM1V52mZT`).
11. `create_field` Bilagor → `Platsnamn` (multipleLookupValues, `Platser.Namn` `fldSDJcY7cb4dam3Y` via `Plats`) → `fldyEDJD3Y3InHJ7J`.
12. `describe_table` Platser — verifierade auto-född spegel `Bilagor` (`fldbdACukM1V52mZT`).
13. `update_records` Bilagor, 8 rader (resterande Kurstyp/Alla event-rader) → `Räckvidd: "Gemensam"` — LYCKADES, samtliga 8 returnerade med `Kursfamilj`/`Kursnivå` oförändrade.
14. `list_records` Bilagor, filter `OR(Räckvidd='Kurstyp', Räckvidd='Alla event')` — RÄKNA EFTER: **0** träffar.
15. `list_records` Bilagor, filter `Räckvidd='Gemensam'` — RÄKNA EFTER: **9** träffar, fält-för-fält jämförda mot före-läsningen (`Kursfamilj`/`Kursnivå` identiska på var och en).

**AC #1 — UPPFYLLT.** Option "Gemensam" finns (`selxFObtdzHsUJiun` på `fldU6i9Ju5HRwSRBf`); `Plats` (`fldmkHUxPNRRA0Rxi`, → Platser) och `Platsnamn` (`fldyEDJD3Y3InHJ7J`, lookup) finns. Fält-ID:n bokförda i `docs/reference/data-model.md` § "Bilagornas Gemensam-räckvidd — Plats-axel" med prod-kolumnen "väntar TASK-338.6".

**AC #2 — UPPFYLLT.** 9 rader (6 "Kurstyp" + 3 "Alla event") FÖRE → 0 kvar EFTER (räknat med `filterByFormula`); `Räckvidd='Gemensam'` → 9 EFTER (= summan FÖRE). `Kursfamilj`/`Kursnivå` verifierat identiska på alla 9 rader, fält för fält, mot före-läsningen.

**AC #3 — UPPFYLLT.** Ingen prod-ref (`app8uGPrVCVOm6LfD`) förekom i något MCP- eller rå-API-anrop; samtliga 15 anrop ovan gick mot `apphjj8Q7lkXCMsL4`, bas-ID läst/kontrollerat i varje anrop.

**AC #4 — UPPFYLLT, men UTFALLET AVVEK FRÅN UPPDRAGETS FÖRVÄNTAN (rapporteras öppet, inte döljs).** Uppdraget förutspådde att rött var VÄNTAT ("gamla EF:en läser fortfarande de migrerade raderna... rött här är väntat"). Faktiskt utfall: **43/43 gröna** (`npm run test:api:staging -- tests/api/get-event-attachments.staging.test.ts tests/api/upload-attachment.staging.test.ts tests/api/delete-attachment.staging.test.ts`, exit 0, 51,5 s). Orsak, verifierad: sviterna är hermetiska — varje test skapar sina EGNA throwaway-fixturer (`ZZ-attachment-test-<uuid>.pdf` via `upload-attachment` i testet självt) och refererar ALDRIG de 9 pre-existerande rader jag migrerade (grep bekräftar noll träffar på "Demo -" i testfilerna). De migrerade raderna blev därför osynliga för den gamla EF:ens Kurstyp/Alla-event-filter UTAN att någon assertion berodde på dem. Ingen regression — bokfört som ett mätt, inte antaget, resultat.

**Ingen ny purge-target.** `.purge-staging-policy.json` läst i sin helhet: migreringen skapade inga nya rader (muterade 9 befintliga, redan sentinel-/demo-täckta), och de två nya fälten (`Plats`/`Platsnamn`) sätts av ingen skrivväg i DENNA skiva. Ingen befintlig target rör de nya fälten; ingen ny target behövs. Bokfört i data-model.md.

**Rollup-fixturer:** ej rörda. Bilagor-tabellen har inga rollup-fält (verifierat via `describe_table`s fälttyper); "permanenta rollup-fixturer" avser Anmälningar/Personer-ort-rollupen (`docs/reference/staging-verifiering-runbook.md`), ej denna tabell.

**Verktygsfakta upptäckt och bokförd (data-model.md):** `mcp__airtable__update_field` kan INTE ändra `options.choices` på ett befintligt select-fält (wrappern stryper okänt fält; Airtables egen Metadata-API-PATCH avvisar det oavsett med 422). Den fungerande vägen för att lägga till en ny choice på ett LEVANDE fält är `update_records` med ett nytt strängvärde — Airtables typecast-beteende skapar choicen. Detta skiljer sig från hur Kurstyp/Alla-event-fältet ursprungligen skapades (task-275.1, `create_field` med alla choices vid FÖDELSEN) — den vägen fungerar bara för NYA fält, inte tillägg på befintliga.

**DoD #4 (prod endast efter Marcus GO):** N/A för denna skiva — inget prod-anrop gjordes alls (se AC #3). Prod-migreringen är TASK-338.6.

**DoD #5 (deny/allow-test per ny/ändrad EF-operation):** N/A — denna skiva ändrar INGEN EF-kod, endast Airtable-schema + dokumentation. Ingen ny/ändrad EF-operation finns att testa.

**DoD #6 (Lagervakten — matchning/validering i EF/_shared):** N/A av samma skäl — ingen matchnings- eller valideringslogik skrevs i denna skiva (det är TASK-338.2/338.3). Ingen klientkod rörd.

Nattgrind-stängning 2026-09-04: DoD bockad mot belägg — samtliga 4 AC redan bockade (mekanisk DoD#1); DoD#2 styrks av PR #2078:s testplan (check:docs 14/14 gröna, staging-sviter 43/43); DoD#3 verifierat mot git show --stat 658e4243 (PR #2078): enbart data-model.md + kortfilen ändrade. DoD#4/#5/#6 KVARSTÅR OBOCKADE — kortets egna notiser klassar dem N/A (inget prod-anrop, ingen EF-kod, ingen klientkod i denna skiva); rapporterat till orkestreraren, inte bockat på gissning.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2078 (mergad 2026-08-29 08:29:59Z, main 658e4243). Staging-schemat: option Gemensam (selxFObtdzHsUJiun), Plats-länk (fldmkHUxPNRRA0Rxi), Platsnamn-lookup (fldyEDJD3Y3InHJ7J); 9 rader (6 Kurstyp + 3 Alla event) → 9 Gemensam, räkneverifierat; prod orörd; staging-sviterna 43/43 gröna efter migreringen. Verktygsfakta bokförd: PAT-MCP:n kan inte lägga till en choice via update_field — update_records med nytt strängvärde (typecast) fungerar.
<!-- SECTION:FINAL_SUMMARY:END -->
