---
id: TASK-18.7
title: 'Skiva: Bor över (bas-fältet + kryss-läget)'
status: In Progress
assignee: []
created_date: '2026-07-21 08:20'
updated_date: '2026-07-22 22:10'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.4
parent_task_id: TASK-18
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bor över-raden (säng-glyf + antal) som sista summeringsrad; radens klick öppnar kryss-läget: alla anmälda i EN kolumn, säng-kryss per person, ikryssade stabilt överst, live-räknare. Kryssfältet föds som ADDITIVT bas-fält per Anmälan (staging först) med egen write-operation; summeringen härleds alltid — aldrig ett lagrat räknefält. Täcker användarberättelser: 17 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Kryssfältet additivt i staging; write-operationen kontraktstestad med teardown
- [x] #2 Kryss-läget bevisat i e2e: en kolumn, stabil sortering, live-räknare; renderat mot facit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementationsnoteringar (task-18.7, AFK-batch S75)

### Nytt bas-fält (ADDITIVT, STAGING FÖRST — ADR-063/ADR-050)
- Tabell: Anmälningar (tbloOcrppVoyrHbrq, staging apphjj8Q7lkXCMsL4)
- Fält: **Bor över** — fält-ID **fldGYYNnQi7XlfbhP**, typ **checkbox** (greenBright/check)
- Live-verifierat frånvaro FÖRE skapande (describe_table 2026-07-22, L294); skapat via MCP additivt; skrivbarhet live-verifierad (PATCH + läs-tillbaka i api-testet).
- **PROD-fältet är INTE skapat** — hård prod-deploy-förutsättning (fält FÖRE EF, per miljö; data-model.md §Kända fällor 37). Prod-deploy = separat Marcus-auktoriserad handling.
- Fixtur-seed: ZZ-arbetsko-fixturens Bekraftad-rad (rec2OjLD2qiKzZCA0) satt Bor över=true; övriga tre urkryssade (1 av 4 = 17.5:s härledda facit). borOverAntal=1 i ARBETSKO_EXPECTED.

### Ny write-operation (allowlist-SSOT)
- **set-registration-lodging** → tableId 'Anmälningar', allowedFields EXAKT ['Bor över']. Samma operation kryssar i OCH ur (allowlisten gatar fältet, inte värdet) → test-teardownens väg.
- Klient: useSetBorOver (src/data/mutations/registrationLodging.ts) — OPTIMISTISK (ADR-016 fem-komponents, mall useSetPaymentStatus); återanvänder generiska dataSource.updateRecord (INGEN ny adapter-metod → ingen SupabaseAdapter-stub behövdes).

### Läs-shape
- get-registrations mappar 'Bor över' === true (checkbox; Airtable utelämnar omarkerad → false, aldrig null). borOver?: boolean i schema + modell (Event-schemats deltagarinfoAutoAvstangt-precedent). Paritetsfilen schemas.assignable.ts auto-täcker (AssertEqual).

### EF-deploy (STAGING)
- get-registrations + update-record deployade till STAGING (--project-ref pqtshyierkdgwdnxuirz, T34-disciplin explicit ref). PROD ej deployad.

### TDD-bevis
- **api RÖTT-FÖRST (18.8-precedent, EF-deploy-bunden):** 3 nya kontraktstester RÖDA före EF-redeploy (get-registrations borOver-läsning + set-registration-lodging deny/allow — 'Unknown operation' + boolean saknas), GRÖNA efter deploy (4/4 grep-mängd; hela api-sviten 347/347).
- **e2e RÖTT-FÖRST:** ny svit event-bor-over.staging.test.ts (6 tester) mekaniskt RÖD med Deltagare.tsx-wiringen bortstashad (5 failed), GRÖN efter (6/6). Ordning + en-kolumn + live-räknare + write-payload + axe-0.

### e2e-körform
- Egen dev-server 5188 + PLAYWRIGHT_TEST_BASE_URL (mockad svit; port 5173 orörd). Full chromium-authenticated 243 passed / 3 skipped på 5188; 2 icke-relaterade fail = hem-AC1 (flaky klock-test, grön i isolering) + skapa-event 'SKARPT mot staging' (sharp EF-read, CORS-blockad på 5188, kräver 4173 — orört av denna skiva). a11y 62/62.

### Rörd systerskivas testyta
- tests/e2e/event-deltagare.staging.test.ts (18.4): summeringsrad-enumerationen utökad med 'Bor över0' (5:e raden) + count 4→5. Bas-fältet föddes här, så 18.4:s öppna bokföring ('raden saknas tills 18.7') är nu uppfylld — samma mönster som 18.4 uppdaterade 18.1:s länk-assertion.

### Öppna review-grindar (Marcus)
- DoD #5 (design-review mot S73-facit) + #6 (facit-avprickning mot bilagor) lämnas ÖPPNA — review-bundna. Rendered computed-verifiering finns i e2e (kolumn-geometri, checked-states, live-räknare); skärmdumps-avprickning mot bilagorna görs vid granskningen.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
