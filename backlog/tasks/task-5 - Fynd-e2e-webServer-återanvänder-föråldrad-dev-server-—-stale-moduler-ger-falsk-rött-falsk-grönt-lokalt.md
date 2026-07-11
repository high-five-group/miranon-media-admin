---
id: TASK-5
title: >-
  Fynd: e2e-webServer återanvänder föråldrad dev-server — stale moduler ger
  falsk-rött/falsk-grönt lokalt
status: To Do
assignee: []
created_date: '2026-07-11 09:42'
labels: []
dependencies: []
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S61 batch 2, task-4.3-körningen): playwright.config.ts e2e-webServer har reuseExistingServer: !CI → en Vite-process startad 6 juli (S55-eran, PID-livslängd 5 dagar) återanvändes tyst; dess fil-watcher hade slutat invalidera modulgrafen, så servern serverade GAMMAL komponentkod trots färska disk-edits (curl mot /src/components/hem/NastaEventCard.tsx returnerade förra sessionens innehåll medan disken bar nya). Effekt: TDD-grönt-kvittot uteblev (falsk-rött) — spegelfallet till Session 15 K2-fyndet (falsk-grönt) som redan är löst för a11y-projektet via dedikerad port + reuseExistingServer: false + --strictPort. Workaround i körningen: döda den föråldrade processen manuellt → Playwright startade färsk server → grönt.

FÖRVÄNTAT BETEENDE: e2e-körningar möter aldrig en server vars modulgraf kan vara äldre än working tree. Kandidatform (avgörs vid plock): samma mönster som a11y-projektet (dedikerad e2e-port + reuseExistingServer: false + --strictPort), alternativt en färskhets-vakt (t.ex. jämför serverns startdatum mot senaste src-mtime och vägra tyst återanvändning). Trade-off att värdera: dev-ergonomin (snabb lokal iteration mot redan igång server) vs riskklassen falsk-rött/falsk-grönt.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
