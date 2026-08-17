---
id: TASK-219.1
title: 'Skiva: Spec §15 skrivs om till Laddtrappan'
status: Done
assignee: []
created_date: '2026-08-15 08:49'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-219
ordinal: 420000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: designsystem-specens §15 ersätter det ovillkorade indikator-förbudet med Laddtrappans fyra steg per ADR-113 (skeleton för vyer/moduler med känd form · spinner ENDAST knapp-internt i arbetande knappar · determinate bar för längre kända förlopp · aldrig naken Laddar…-textrad som enda besked), med Lugnt laddläge kvar som överordnad princip och artighetsnivå-noten (laddbesked är polite status, aldrig alert — FK-avvikelsen bokförd). Kodkommentarer som citerar §15 med stale radreferens (off-by-14, bl.a. person-listans) rättas till sektionsreferens i stället för radnummer. Täcker användarberättelser: 5, 7 (PRD TASK-219).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Spec §15 bär trappans fyra steg per ADR-113 med Lugnt laddläge som överordnad princip; ORDLISTA-termen Laddtrappan refereras
- [x] #2 Artighetsnivå-noten (polite, ej alert) bokförd i spec-texten
- [x] #3 Stale §15-radreferenser i kodkommentarer rättade till adresserbar sektionsform (grep-belagd lista i notes)
- [x] #4 npm run check:docs grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Genomförande

Spec §15 (docs/specs/DESIGN-SYSTEM-SPEC.md) skriven om per ADR-113: rubrik till Lugnt laddläge — Laddtrappan + Skeleton-primitiven, ny sektion Laddtrappan — fyra steg (ADR-113) med de fyra stegen (skeleton, knapp-intern spinner via kommande isLoading, determinate progress-bar/ADR-112, aldrig naken Laddar…-textrad) samt artighetsnivå-noten (role=status/polite, aldrig role=alert — FK:s FLoader-avvikelse bokförd mot WAI-ARIA ARIA22, källa loading-indikator-branschpraxis-2026-08-15.md §4). Principen-avsnittet ommärkt som trappsteg 1; sista principbullet uppdaterad så att spinner-förbudet gäller SKELETON-steget specifikt, inte hela appen. Ändringsloggrad tillagd.

## Grep-belagd lista — stale §15-radreferenser

Sökt spec:[0-9]+ / SPEC.md:[0-9]+ / SPEC:[0-9]+ över src/ + tests/: EN träff.
- src/components/persons/PersonsList.tsx:343 — citerade spec:1078 (off-by-14 mot regelraden, som låg på rad 1092 i spec-filen FÖRE denna ändring). Rättad till sektionsform: spec §15, Laddtrappans steg 4.

Övriga §15-referenser i kodbasen (grep §15 över src/ + tests/) citerar redan sektionsform (spec §15, DESIGN-SYSTEM-SPEC §15) utan radnummer — rörda ingen: tailwind.css:111, components.css:243, DashboardCard.tsx:15,74,101, SenasteAktivitet.tsx:74, Skeleton.tsx:42, AktivitetsHistorik.tsx:374, PersonsList.tsx:84, PersonDetail.tsx:1630, EventsList.tsx:133, primitives.tsx:236, hem-laddlage.acceptance.test.ts:11, Skeleton.spec.ts:127.

Ingen komponentkod ändrad utöver denna enda kommentarsrad — fix-vågen (TASK-219.3) och Button isLoading-propen (TASK-219.2) är egna skivor.

## Grindar

npm run check:docs → 14/14 gröna, exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1330 (commit ec593d3d, MERGED på main 32cf290d, 2026-08-15). Spec §15 bär Laddtrappans fyra steg per ADR-113 med Lugnt laddläge som orörd överordnad princip + artighetsnivå-noten (polite, källbelagd); enda stale radreferensen (spec:1078, off-by-14) rättad med grep-belagd fullständighetslista i notes. check:docs 14/14 grön; DoD-kvartetten grön lokalt; CI grön per jobb i kön.
<!-- SECTION:FINAL_SUMMARY:END -->
