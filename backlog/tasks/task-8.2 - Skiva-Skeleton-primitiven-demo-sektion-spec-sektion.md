---
id: TASK-8.2
title: 'Skiva: Skeleton-primitiven + demo-sektion + spec-sektion'
status: Done
assignee: []
created_date: '2026-07-11 22:54'
updated_date: '2026-07-12 15:31'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-8
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den återanvändbara Skeleton-primitiven (biblioteksribba 11/11/11) som bär Lugnt laddläge-principen (ORDLISTA) för denna och framtida vyer/produkter. Beteende ände-till-ände: primitiven exponerar förenklade block-former (textrad, tal, listrad) som reserverar sina slutdimensioner; färger uteslutande via tokensystemets komponentlager; långsam shimmer vänster→höger som ENDAST körs under prefers-reduced-motion: no-preference (statiska block annars); blocken håller ≥3:1-kontrast (WCAG 1.4.11) och är urskiljbara under prefers-contrast: more samt vid utskrift; a11y-markupen är Roselli-mönstret — aria-busy på innehålls-containern som laddar, aria-hidden på skelettelementen, skärmläsartext för laddbeskedet (aria-busy kompletteras ALLTID med textbeskedet — få skärmläsare honorerar busy ensam). Primitiven får egen sektion på primitiv-demo-sidan med axe-bevis (ADR-045-mönstret), och Lugnt laddläge-principen skrivs in i design-system-specen som laddläges-sektion (samsyn beslut 1 + implementationsbeslut 11). Research-grund käll-verifierad i S63 Del 2 (NN/g, Chung-empirin långsam shimmer, Roselli). Täcker användarberättelser: 12, 13, 14, 15 (grund för 11, 16).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skeleton-primitiv i biblioteket med block-former (textrad, tal, listrad), stylad uteslutande via tokensystemets komponentlager — inga hårdkodade färger
- [x] #2 Långsam shimmer V→H endast under prefers-reduced-motion: no-preference; statiska block annars — verifierat med emulateMedia
- [x] #3 Roselli-markupen på plats (aria-busy på container, aria-hidden på block, skärmläsartext) och axe 0 violations på demo-sidans Skeleton-sektion
- [x] #4 Blocken håller ≥3:1-kontrast computed-style-verifierat + contrast-more- och print-stöd per primitiv-golvet
- [x] #5 Lugnt laddläge-principen dokumenterad som laddläges-sektion i design-system-specen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation (2026-07-12, T76-pilot A3)

### Leverans

- `src/components/primitives/Skeleton.tsx` — CVA-primitiv (ADR-044-idiomet) med block-formerna `text` (1 line-box, full bredd), `number` (1 line-box, ~2ch), `listRow` (3 line-boxar, rounded-lg som zebra-raderna). Höjderna är lh-baserade och följer omgivande typografi → blocken reserverar sina slutdimensioner i varje textskala (computed-bevisat: 24 px i brödtext, 36 px i text-3xl, 72 px listrad). Blocket är ALLTID aria-hidden; konsumenten äger aria-busy-containern + sr-only-beskedet (Roselli — dokumenterat i JSDoc, spec §15 och demo-sektionen).
- Komponent-tokens (`components.css`): `--mm-skeleton-block` (= `--mm-border-field`, ärver den dokumenterade ≥3:1-egenskapen WCAG 1.4.11), `--mm-skeleton-block-contrast` (= `--mm-text-secondary`, ≈7:1 under prefers-contrast: more), `--mm-skeleton-shimmer` (color-mix-glans). Inga hårdkodade färger.
- Shimmer: `--animate-skeleton-shimmer` + keyframes i `tailwind.css` `@theme` — ::after-svep V→H, 2,5 s (Chung-empirin: långsam), konsumerad ENDAST via motion-safe: → deklarationen är media-gated bakom prefers-reduced-motion: no-preference; reduce ger animationName none (inte bara base.css-neutraliserad). Print: border-strong-kontur via border-transparent-mönstret (dimensionsidentisk i alla lägen).
- Demo-sektion på /dev/primitives (rubrik-skeleton) i full Roselli-anatomi + axe-skan i primitives.spec.ts; beteende-spec tests/a11y/Skeleton.spec.ts (resolvedTokenColor-DOM-probe per L272 + WCAG-kontrastkvot beräknad ur computed styles).
- Spec: DESIGN-SYSTEM-SPEC.md §15 (Lugnt laddläge-principen + primitivens API/anatomi/form/tokens) direkt efter §14, egen ändringslogg-rad; §14 orörd.

### Formbeslutet respekterat

task-8.1:s mätlåsta form (kommentar på task-8.4): skeleton från första bildrutan — INGEN framträdande-fördröjningsmekanism byggd i primitiven (ingen delay-prop, ingen CSS-fördröjning).

### TDD (RÖD→GRÖN per beteende)

Alla 8 tester skrivna först och körda RÖDA mot main-koden (sektion/primitiv saknades — locator not found/timeouts), därefter implementation → 31/31 gröna (8 nya + 23 befintliga, noll regression). Per-beteende-cykler slogs ihop till EN röd-körning + EN grön-körning: staging-/server-semaforen (T76) gör per-test-låsfönster ohållbara — öppet bokförd avvägning.

### Grindar (lokalt gröna)

typecheck + typecheck:tests 0 fel · biome 0 errors (baseline 4 warnings/14 infos) · build grön · test:a11y 31/31 · markdownlint 0 errors · vale 0 errors. DoD 3/5/6 lämnas åt orkestrator/Marcus (CI per jobb; design-review i browsern; layout-skift-mätningen på Hem-nivå är task-8.4:s AC — primitiv-nivåns dimensionsbevis är lh-testet ovan).
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-12 13:59
---
Granskningsfärdig (ADR-071): levererad cac0b16 → PR #51 → merge 221e5f9; CI grön per jobb first-pass (PR-run 29194848689 + main-run 29195013238). DoD 5 väntar din design-review i browsern (/dev/primitives, Skeleton-sektionen — Roselli-anatomin + shimmer under motion-safe); DoD 6 (Hem-nivåns layout-skift-mätning) hör till task-8.4; primitiv-nivåns dimensionsbevis är lh-boundingBox-testet. AFK-proveniens: T76-piloten S65 fas 3, pipeline A agent A3, orkestrerad bokföring.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Skeleton-primitiven levererad (cac0b16 → PR #51 → merge 221e5f9; CI first-pass per jobb: PR-run 29194848689 + main-run 29195013238). DoD 5: Marcus design-review i browsern godkänd 2026-07-12 (granskningsvågens kvittens, alla 4 batch-korten). DoD 6: slutdimensioner computed-bevisade (24/36/72 px lh-baserade, se notes) + 15 computed-assertioner i tests/a11y/Skeleton.spec.ts. Proveniens: T76-piloten fas 3 agent A3; spec-paragraf-15-kollisionen designad bort enligt plan.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [x] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
