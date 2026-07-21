---
id: TASK-19.3
title: 'Skiva: Skapa-sidan till facit'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
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
