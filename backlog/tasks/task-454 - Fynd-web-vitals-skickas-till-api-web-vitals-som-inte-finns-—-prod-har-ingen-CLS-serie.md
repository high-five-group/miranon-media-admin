---
id: TASK-454
title: >-
  Fynd: web-vitals skickas till /api/web-vitals som inte finns — prod har ingen
  CLS-serie
status: To Do
assignee: []
created_date: '2026-09-18 10:42'
labels:
  - fynd
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
priority: low
ordinal: 795000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`src/lib/report-web-vitals.ts` postar till `/api/web-vitals`; repot har ingen `api/`-katalog och `vercel.json` rewritar `/(.*)` till `index.html`. Mätvärdena går i en SPA-vägg (filens egen kommentar: TODO Fas 7). Följd: S3-klassen (layouthopp) går inte att följa i prod. Hör till Fas 7:s web-vitals-punkt i byggplanen — kortet finns så att TODO:n inte är osynlig.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beslut: mottagare för web-vitals (Sentry, Vercel Analytics eller egen EF) valt med research, eller rapporteringen avstängd tills Fas 7 så att inga döda anrop görs
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
