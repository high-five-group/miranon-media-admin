---
id: TASK-324
title: 'Fynd: data-auth-fond saknar prefers-contrast: more/print-fallback'
status: To Do
assignee: []
created_date: '2026-08-26 04:53'
labels:
  - fynd
  - a11y
  - ready-for-agent
dependencies: []
ordinal: 597000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
src/styles/base.css: html[data-auth-fond=true] deklareras rad 131 (och rad 162 för body), utan @media (prefers-contrast: more), print-regel — till skillnad från syskonmekanismen html[data-forberedelse-fond=true] i SAMMA fil, som bär sin fallback rad 191-192. Källmärkt, verifierat mot disk (S112 resume 1, 2026-08-26): grep bekräftar exakt raderna ovan. data-auth-fond appliceras (via el.dataset.authFond) på FYRA rutter, alla verifierade: src/routes/login.tsx (rad 167/169), src/routes/nytt-losenord.tsx (rad 59/84), src/routes/glomt-losenord.tsx (rad 73/75, TASK-223-attribution bekräftad rad 52/69 i samma fil), src/routes/valkommen.tsx (rad 58/94). glomt-losenord.tsx:s egen kommentar (rad 52-53) dokumenterar att fonden lades till 2026-08-15 (S102 Explore-svepets fynd) EFTER att login.tsx redan bar den — TASK-223 stängde det gapet för glomt-losenord men prefers-contrast/print-fallbacken byggdes aldrig för NÅGON av de fyra ytorna. Krav: CLAUDE.md paragraf Design-system ('varje komponent ska klara prefers-contrast: more, prefers-reduced-motion, print'). Källa för review-utlåtandet: PR #1988 (verifierat mergad, SHA 8d2ad561, 2026-08-26).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 fallback-regel tillagd i src/styles/base.css i samma form som html[data-forberedelse-fond=true]s @media (prefers-contrast: more), print-block (rad 191-192)
- [ ] #2 kontrastvakt i TASK-314-mönstret utökad till att täcka minst en av de fyra auth-ytorna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
