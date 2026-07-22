---
id: TASK-19.3
title: 'Skiva: Skapa-sidan till facit'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-22 18:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-19.1
  - TASK-19.2
parent_task_id: TASK-19
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sidan i familjens formklass mot BEFINTLIGA skapa-operationen (server-side shape, allowlist, Airtable-nativ upsert-idempotens med klient-genererad nyckel — ADR-066): fälten Event, Eventtyp, Ort, datum, max antal platser och eventformat med etiketterna 2 dagar respektive 1 dag mappade mot basens Eventformat-poster via befintlig format-läsning; Event/Eventtyp-språket per ORDLISTA med namnkrocken explicit i mappningen; inga obligatorisk-markeringar (allt krävs, inget markeras); publicerings-avsnittet renderar handtaget (utan verkan tills flaggan finns i 19.4); bekräftelseläge efter skapande. Täcker användarberättelser: 2-4, 6-8, 12 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skapa-flödet ände-till-ände mot staging med teardown via befintlig operation; idempotensen regressions-bevakad, byggs inte om
- [ ] #2 Formen renderar per facit-skapa-sidan: fältfacit, språket, formatetiketterna, inga obligatorisk-markeringar
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AVBRUTEN AV MERGE-AGENTEN (S75 batch, ADR-073) — HALT i steg 5 (PR-CI-vakten per jobb). INGEN MERGE.

PR: #80 (https://github.com/marcus803/miranon-media-admin/pull/80) — STÅR KVAR som åtgärdsyta.
Branch: task/19.3 @ 2ab90224254185f36bd4d06d6b74ad5d5331c736 — STÅR KVAR (lokal + remote).
PR-CI-run: 29944497868 — conclusion: failure.

PER JOBB: Detect changed files=success · Lint + Audit + TypeCheck=success · Staging sentinel purge=success · Docs link check=success · Test + Build=FAILURE · CI Passed or Skipped=skipped.
Test + Build per steg: API tests (pure)=success · API tests (staging)=success · Install Playwright Chromium=success · E2E tests (staging)=FAILURE · A11y tests (axe-runner)=skipped · Build=skipped.

E2E-UTFALL (kortets e2e-bevis, pr-ci-bevisformen): 215 passed · 1 failed · 3 skipped av 219.

FALLERANDE TEST (verbatim ur run-loggen):
  [chromium-authenticated] > tests/e2e/skapa-event.staging.test.ts:345:3 > Skapa nytt event — SKARPT mot staging (AC #1) > formuläret skapar ett riktigt event i staging och landar i bekräftelseläget
  Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 401
    > 355 |     expect((await eventsSvar).status()).toBe(200);
    at tests/e2e/skapa-event.staging.test.ts:355:41
  Föll identiskt på Retry #1 och Retry #2 (dvs INTE flake).

TOLKNING (ej åtgärdad av merge-agenten): det är kortets EGET nya SKARPA describe som faller — sidans live-läsning (events-anropet) svarar 401 i CI-miljön, medan de mockade testerna och den ÖVRIGA staging-sviten (inkl. tests/api staging) är gröna. Bygg-agentens lokala e2e-körning skedde off-port mot ett lokalt staging-bygge (port 4173, CORS-tillåten preview-origin) — den miljön bar en auth-form som CI-runnern inte bär. Fixen hör till bygg-agenten (auth/token-vägen för den skarpa läsningen i CI), inte till merge-kedjan.

KORT-TILLSTÅND: status återställd To Do. AC/DoD-bockarna på branchen är INTE landade på main (ingen merge skedde) — kortet på main står orört i sitt för-batch-skick förutom denna not.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
