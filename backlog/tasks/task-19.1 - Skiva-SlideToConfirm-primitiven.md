---
id: TASK-19.1
title: 'Skiva: SlideToConfirm-primitiven'
status: In Progress
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-21 22:36'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-19
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Biblioteket får dra-till-bekräfta-primitiven: drag-vakter, grepp-krav och offset ur konvergensen, drag-tillstånd i ref (L300), tangentbords- och icke-drag-väg som KRAV för 11-ribban (draget är förstärkning, aldrig enda vägen), armerat läge med bock och monotext utan fyllnad, diskret pling med preferens-respekt; minimaltest först, därefter demo- och spec-sektion samt a11y-mönster-spec per primitiv-standarden. Täcker användarberättelser: 5, 9-11 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Armering fungerar med mus-drag OCH tangentbord; tillståndet oarmerat/armerat annonseras begripligt (axe-0 i mönster-specen)
- [x] #2 Plinget respekterar användarens preferenser; armerat läge renderar bock + monotext utan fyllnad mot facit-handtaget
- [x] #3 Minimaltest bevisat före full implementation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
väntar design-review (S75-batchen v2). Leverans: SlideToConfirm-primitiven (APG-switch för hand — RAC/Radix klick-toggle river avsikts-mekaniken K79; förseglat i spec §18) + barrel + demo-sektion (/dev/primitives, facit-instans + tyst defaultSelected-instans) + a11y-mönster-spec tests/a11y/SlideToConfirm.spec.ts (15 tester: semantik/tangentbord/fokusring, K79-drag-vakterna inkl grepp-offset, 90/10-fjädern + text-uttoning, computed-låst facit-form, pling-preferenser via AudioContext-stubb, axe-0 i båda tillstånden) + sektions-skan i primitives.spec.ts + DESIGN-SYSTEM-SPEC §18. Inga komponent-tokens (§16-precedenten — components.css orörd). TDD: minimaltest rött-först (2 röda före komponent), fulla specen rött-först (8 röda före full implementation), därefter grönt 15/15; hela a11y-sviten 61/61. Facit-avprickning (DoD 6): computed-style-assertions i mönster-specen + skärmdumpar (oarmerad/mitt-i-drag/armerad, 390 px) visuellt jämförda mot FACIT-skapa-sidan/FACIT-skapa-handtag-armad — bock+monodomän utan fyllnad verifierat renderat. DoD 7 ej tillämplig: inga bas-ändringar i denna skiva. Grindar: biome exit 0 · typecheck+typecheck:tests 0 fel · test:api 307/307 · build grön · test:a11y 61/61 (allt via staging-semaforen).

CI grönt per jobb: PR-run 29873302703 + main-run 29873758165 (S75-batch v2)

POST-CI-avvikelse öppet bokförd (S75-batch v2): bokförings-runnet 29874196114 RÖTT på audit-steget — NY upstream-advisory GHSA-f88m-g3jw-g9cj (sharp <0.35.0 via vite-plugin-pwa>@vite-pwa/assets-generator, high) ej i audit-ci-allowlisten (tom). Diffen exonererad: 237d37a rörde enbart denna kortfil, identisk package-lock, samma jobb grönt på main-runnet 29873758165 minuter tidigare. Leveransens grindar (PR-run 29873302703 + main-run 29873758165) gröna per jobb — DoD 3 står. Åtgärd = ADR-028 Konvention-flöde (Marcus-beslut), utanför task-19.1-ytan. Runnet på denna bokförings-commit väntas också rött av samma orsak. BATCH-BLOCKER: alla efterföljande runs röda tills allowlist-beslutet tagits.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
