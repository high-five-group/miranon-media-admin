---
id: TASK-17.1
title: 'Skiva: ToggleButtonGroup-primitiven (pill-toggeln)'
status: In Progress
assignee: []
created_date: '2026-07-21 08:19'
updated_date: '2026-07-21 09:24'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-17
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Biblioteket får en ny primitiv på React Aria ToggleButtonGroup i pill-formen: minimaltest först, därefter demo- och spec-sektion per NavCard-precedenten. Period- och vy-toggeln på listan samt eventsidans flik-kapslar blir konsumenterna. Tangentbordsnavigation, fokusindikation och axe-0 per 11/11/11-ribban. Täcker användarberättelser: 1, 2 (TASK-17).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Primitiven finns i biblioteket med demo- och spec-sektion och klarar axe-0 i a11y-mönster-specen
- [x] #2 Tangentbord: pilnavigering + val fungerar; fokusindikationen följer globala ringen
- [x] #3 Minimaltest bevisat före full implementation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S75-batchen (branch task/17.1) — väntar design-review (S75-batchen). Facit-avprickningen (DoD #6), bevisform: (a) computed-style-assertions i tests/a11y/ToggleButtonGroup.spec.ts — track --mm-bg-muted + kapselradie + p-1 4 px; vald pill --mm-bg + font-weight 600 + shadow; ovald --mm-text-secondary + 500 + transparent bg; spread-likbredd <1 px; träffyta pill ≥40 px/track ≥44 px; global fokusring 2 px solid --mm-focus-ring offset 2 px; statisk (ingen transition) + print synlig — 13/13 gröna; (b) skärmdump av demo-sektionen 390×844 jämförd mot FACIT-listvyn.png (S72-bilagan) — pill-grammatiken matchar. TDD: alla 13 tester observerade RÖDA före implementation (13 failed, körlogg) → 13 gröna; AVVIKELSE: minimaltestet och fulla pill-formen landade i samma rött→grönt-pass (en batch-cykel, inte separata cykler per beteende); RAC-mekaniken (radiogroup/radio + toolbar-pilnav) källkodsverifierad i node_modules före kod. Lokala grindar: biome 0 fel · typecheck 0 · typecheck:tests 0 · test:api 296/296 · test:a11y 45/45 (axe-0 inkl. nya sektionen) · build grön · markdownlint 0. Tokens-not: inga komponent-tokens (claims-ytan förbjuder tokens-filerna; RadioGroup-precedentens semantiska token-konsumtion — öppet bokfört i spec §16).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
