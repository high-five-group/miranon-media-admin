---
id: TASK-134
title: >-
  Fokusring vid musklick på varje textfält — Input-primitiven får plain :focus,
  [data-rac]-släckaren smalnas till dropdown-syftet
status: To Do
assignee: []
created_date: '2026-08-04 10:37'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 220000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
BESLUTAT (Marcus 2026-08-04, S96, T117 — båda delarna; bokförs i Del 10). Research-grund: docs/research/focus-ring-auth-musklick-2026-08-03.md — ring vid musklick på skrivytor är webbläsarnas spec-dokumenterade default-heuristik (CSS Selectors L4 § 9.4), 9/9 live-mätta produkter, tre designsystem kodifierar plain :focus på textfält (govuk-frontend 5.14.0, uswds 3.13.0, carbon 1.112.0, verifierat i kompilerad CSS). Fyndet i T117-tråden: det som släcker ringen är React Arias [data-rac]:focus-visible:not([data-focus-visible]) i src/styles/base.css — byggd S73 K85 för popover-dropdowns, träffar ALLA React-Aria-skrivytor.

ARBETE: (1) smalna släckar-regeln till dropdown-/popover-klassen den byggdes för; (2) textfält via Input-primitiven (src/components/primitives/) visar ring vid varje fokus oavsett modalitet. OBS: base.css är OLAGRAD och slår alla Tailwind-lager (T117-mätning — en [&_input:focus]-variant slog aldrig igenom); lösningen ska ligga i base.css/primitiven, inte i Tailwind-varianter. Auth-undantaget .mm-auth-formular (prototyp-grenen, ej landat) ska INTE ärvas in — den breda formen ersätter det (facit-README § Öppet vid låsningen: "faller det ska regeln rivas, inte ärvas").

VERIFIKAT: a11y-tester gröna (WCAG 2.4.7-ribban); /dev/primitives + /login granskas i RIKTIG browser — headless Chromium rapporterar outlineColor fel (T117:s bokförda mätfälla); dropdown-beteendet regressionsprövas (släckaren ska fortsatt verka där).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
