---
id: TASK-199
title: >-
  Prod-fronten var stale ≥20 h trots Vercel-git-integration — deploy-historiken
  oförklarad, frontend-deploy-vägen saknar dokumenterad kontroll
status: To Do
assignee: []
created_date: '2026-08-11 19:12'
labels: []
dependencies: []
priority: high
ordinal: 364000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (S102-resume 2026-08-11 ~kväll): admin.miranon.dev servade index-CWH3ivIH.js UTAN route-posten event/$eventId/atgarder i route-registret, trots att ingången+routen landade på main redan 2026-08-10 17:59Z (#1133) och main därefter tagit emot ~15 merges. Marcus blockerades i morgonsekvensens steg 3 ('länken leder ingenstans'). Självläkt: när main avancerade till 9800bf6b auto-deployade Vercel (Production, 15 s build) och domänen bytte till index-CvXlcVbm.js MED routen — verifierat via curl + bundle-grep före/efter. Oförklarat: varför inga (fungerande) Production-deploys på ~20 h av mergningar — deploy-lista visade bara Preview 7–10 min + Production 41 s vid mätningen. Åtgärd: gräv Vercel-deploy-historiken, dokumentera frontend-deploy-vägen (T46:s 'frontend-kontrollen'), och överväg CI-grind som diffar deployad bundle-route-register mot HEAD (samma klass som EF-driftens task-37). OBS även PWA-lagret: SW-precache kan hålla gammal bundle hos klienten efter deploy — Lotta-relevant.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
