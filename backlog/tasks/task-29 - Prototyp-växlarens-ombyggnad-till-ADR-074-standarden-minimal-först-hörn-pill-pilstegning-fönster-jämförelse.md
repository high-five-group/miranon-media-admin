---
id: TASK-29
title: >-
  Prototyp-växlarens ombyggnad till ADR-074-standarden (minimal-först hörn-pill
  + pilstegning + fönster-jämförelse)
status: In Progress
assignee: []
created_date: '2026-07-22 14:38'
updated_date: '2026-07-22 15:24'
labels:
  - ready-for-agent
dependencies: []
references:
  - >-
    docs/decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md
  - tasks/sessions/2026-07-22-session-76.md
  - src/components/dev/PrototypeSwitcher.tsx
priority: medium
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bygg om src/components/dev/PrototypeSwitcher.tsx till ADR-074 beslut 2–3 (Vercel-Toolbar-formen). Design LÅST i grillad samsyn S76 Del 3 — inga öppna designfrågor. Stående delad dev-komponent (DEV-grindad); INTE 11/11/11-produktbiblioteket, men körbarhets-golvet gäller. API-ytan mot befintliga call-sites (variants + aliases-props) består; aliases är legacy-only per ADR-074 beslut 1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Default-läget är minimerad hörn-pill nere höger ovanför bottom-naven (aldrig bottom-center); expansion är opt-in och localStorage-minnet består (nyckeln mm-proto-switcher-minimerad återanvänds; default-värdet inverteras)
- [x] #2 Minimal-läget bär ‹/›-pilstegning som cyklar skarpa vyn → varianterna i ordning, och visar aktiv nyckel + steg-badge (identitetsraden i kompakt form)
- [x] #3 Expanderad panel behåller variant-chips + identitetsrad + demo/verklig-växeln och får handlingen 'Öppna i nytt fönster' (window.open på samma route med vald variant-nyckel — jämförelse i fönster-lagret per ADR-074 beslut 3)
- [x] #4 Utseendet stylas med designsystemets tokens (inga hårdkodade färger; den massiva svarta plattan ersätts); a11y-golvet består (aria-pressed, aria-label, synlig fokus, tab-ordning)
- [x] #5 DEV-grinden består (monteras endast bakom import.meta.env.DEV); produktion renderar skarpa vyn oförändrat
- [x] #6 Befintliga call-sites (EventsListPrototype, EventDetailPrototype m.fl.) fungerar utan ändring av sina props
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Leverans S76 (do-work-formen via 1.18.1-cache-läsning — Skill-verktyget registerfryst i körande session, öppet noterat). Grindar: biome 0 · typecheck 0 · test:api grön · build grön. Browser-verifierad L304-formen (fristående Playwright + login per auth.setup-mönstret, egen server 5198, Marcus 5173 orörd): pill-default 'skarp' · pilstegning → 'A · steg 1' + ?variant=A · panel med chips/identitetsrad/nytt-fönster (popup bär variant-nyckeln) · Göm-persistens MIN_KEY=1. TDD: ej tillämplig (dev-verktyg utan test-harness; FAIL-först-kapabla script-assertions som ersättningsform). AC4 okulärt bekräftad (token-yta, primary-tint-chips).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
