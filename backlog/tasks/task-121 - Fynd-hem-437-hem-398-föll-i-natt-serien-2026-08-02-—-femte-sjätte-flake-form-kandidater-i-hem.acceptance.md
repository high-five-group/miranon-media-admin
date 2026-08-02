---
id: TASK-121
title: >-
  Fynd: hem:437 + hem:398 föll i natt-serien 2026-08-02 — femte/sjätte
  flake-form-kandidater i hem.acceptance
status: To Do
assignee: []
created_date: '2026-08-02 07:51'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 193000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur TASK-79:s natt-mätning (docs/research/task-79-flake-baslinje-2026-08-02.md § Oväntat fynd): 2 fällningar av 3060 testresultat, BÅDA i arm B, BÅDA i hem.acceptance.test.ts men på ANDRA rader än 79:ans mål (1114):

- körning 4, hem:437 'AC 1 — dagar-kvar-pillen: tre exakta former, vit pill topp-höger' — toBeVisible-timeout 20569 ms på '1 dag kvar'-texten (loadVidSlut 20,1)
- körning 8, hem:398 'refetchInterval (60s) triggar polling-refetch — falsk klocka' — expect greater than 1, fick 1 (loadVidSlut 17,53)

Delar INTE TASK-79:s felsignatur (byte-identisk skärmdump) och matchar inte TASK-74:s B1/B2/B3. Vidrör möjligen samma dagsgräns-/nuMs-mekanismer som task-79:s karaktärisering (punkt 5) diskuterade för ANDRA vägar — sammanslagning är INTE bevisad och görs inte utan belägg (AC 3-disciplinen: bevisa gemensam orsak innan former slås ihop).

PRIORITET LÅG, öppet motiverad: observerad rat 2/3060 testresultat i en natt-serie; ingen CI-fällning av dessa former är känd. Registrerad per ADR-053 (blockerar ej + värdefullt) i stället för tyst bortkastad.

Rådata: docs/research/task-79-flake-baslinje-2026-08-02-data/(resultat|serie).jsonl — fil, rad, titel, status, varaktighet och felmeddelande per testresultat. Mät med riggen (npm run metrics:flake) — bygg ALDRIG egen mätserie. Läs ut n innan ett noll-resultat tolkas.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda formerna karaktäriserade SEPARAT mot rådatan (+ riggen vid behov): mekanism-hypotes per form, prövad med mätning eller öppet bokförd som obesvarad
- [ ] #2 Prövat mot kända former (TASK-79:s kompositor-karaktärisering · TASK-74 B1/B2/B3 · nuMs/dagsgräns) — svaret redovisat oavsett riktning, ingen sammanslagning utan belägg
- [ ] #3 Ingen fix utan belagd orsak; åtgärdsförslag klassas rotorsak/acceptera/maskera med rekommendation — vägvalet är Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
