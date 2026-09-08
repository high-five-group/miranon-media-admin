---
id: TASK-441
title: >-
  Fynd: registrera-inbetalning saknar serversidigt test för aktivitetsloggens
  integritet — noteringens fritext får aldrig läcka in i payloaden
  (pre-existerande, avtäckt av #2459:s granskare)
status: To Do
assignee: []
created_date: '2026-09-08 15:52'
labels:
  - fynd
dependencies: []
ordinal: 768000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur review-agentens info-fynd 3 på PR #2459 (TASK-435, 2026-09-08): klientens integritetsgaranti (fritext läcker aldrig in i aktivitetsloggens payload, S105 Del 2 beslut 2) är testad i `tests/acceptance/atgarder-betalningsnotering-logg.acceptance.test.ts` (omskrivet mot `RegistreraForm` i #2459), men den SERVERSIDIGA motsvarigheten — att `supabase/functions/registrera-inbetalning` aldrig skriver `notering` (eller annan fritext) i aktivitetsloggens payload — saknar test i `tests/api/`. Luckan är pre-existerande (fanns före #2459), inte införd av rivningen. Bokförs som eget kort i stället för att lämnas i en PR-kommentar.
FORM: ett api-test mot staging (`tests/api/registrera-inbetalning*.staging.test.ts`, samma rigg som batch-testet i TASK-437) som registrerar en inbetalning med en avsiktligt igenkännbar notering, läser aktivitetsloggens rad för händelsen och kräver att payloaden inte innehåller noteringstexten — rött-först mot en avsiktligt läckande EF-variant är svårt utan att deploya; bevisa i stället tvåsidigt genom att testet fäller om man tillfälligt låter testet läsa `notering` ur ett svar som bär den (negativ kontroll på assertionen). Läs EF:ens docblock § aktivitetslogg och `docs/reference/data-model.md` innan design.
KÄLLOR: PR #2459 Riskbedömnings-sektion (info 3), `tests/acceptance/atgarder-betalningsnotering-logg.acceptance.test.ts`, `supabase/functions/registrera-inbetalning/index.ts`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 api-test mot staging bevisar att aktivitetsloggens payload för registrera-inbetalning aldrig bär noteringens fritext; negativ kontroll på assertionen bokförd i PR-kroppen
- [ ] #2 Ingen EF-ändring krävs om testet är grönt; krävs en är den ett eget kort (serverspår, prod-deploy via fas4)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
