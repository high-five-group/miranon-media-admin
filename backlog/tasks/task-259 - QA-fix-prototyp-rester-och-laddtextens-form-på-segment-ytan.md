---
id: TASK-259
title: 'QA-fix: prototyp-rester och laddtextens form på segment-ytan'
status: To Do
assignee: []
created_date: '2026-08-17 09:34'
labels:
  - qa-fix
dependencies: []
ordinal: 477000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus QA-fynd 2026-08-17 (249.8, prod): 1) PrototypNot ('Prototyp. Inget sparas, inget skickas') RIVS helt — syns på utskicksvyn, 'Dela upp i grupper', 'Nytt segment' och verkstaden; komponent + alla monteringsställen + dess ljugande docblock. 2) Sök-hjälpraden under publikens sökruta ('Söker i den redan hämtade publiken – kostar inget serveranrop') TAS BORT. 3) Steg 3-texten 'Ge segmentet ett namn först' TAS BORT. 4) 'Räknar personer…'-laddtexten görs professionell: shimmer-/våganimation genom texten (design-tokens, prefers-reduced-motion → statisk text), samma mönster på ytans alla Räknar-texter. Berörda ariaSnapshot-referenser re-genereras ÖPPET med diff-bevis — Marcus beställning är kvittensen (samma form som 249.6-re-låsningen). Acceptance + hermetik-självtest gröna (ingen skip).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fyra textfynden åtgärdade och shimmern på plats med reduced-motion-fallback
- [ ] #2 Berörda aria-referenser re-genererade med diff-bevis; övriga byte-identiska
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
