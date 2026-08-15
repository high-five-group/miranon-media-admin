---
id: TASK-230
title: >-
  Fynd: passkey kan inte aktiveras inifrån appen - engångserbjudandet är enda
  vägen
status: To Do
assignee: []
created_date: '2026-08-15 23:15'
updated_date: '2026-08-15 23:37'
labels:
  - ready-for-human
dependencies: []
priority: high
ordinal: 430000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 8-följdfynd (Marcus 2026-08-16, 'vart i hela friden aktiverar jag passkey i appen?'): /passkey-ytan (Skydda ditt konto) nås ENDAST som engångserbjudande efter lösenordsinloggning, gated på kontobundna harSettErbjudandeTidigare (src/routes/passkey.tsx + login.tsx PASSKEY-blocket, TASK-127.8/ADR-093) - har kontot en gång markerats 'sett' finns INGEN väg i appen att aktivera passkey; direktnavigering till /passkey med aktiv session fungerar men är odiscoverbar. Konsekvens för Lotta: ett förbiklickat erbjudande stänger passkey permanent utan URL-kunskap. FÖRSLAG: en yta under Mer (typ 'Inloggning och säkerhet') med aktivera/visa/ta bort passkey; scope och form är Marcus designbeslut - kortet är fyndet, inte facit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har valt form (Mer-yta eller annan vag) - bokfort pa kortet
- [ ] #2 Vald form byggd: passkey kan aktiveras och tas bort fran en permanent, hittbar plats i appen
- [ ] #3 DoD-kvartetten gron
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UPPGRADERAD 2026-08-16 efter Marcus branschfraga: settings-ytan ar BRANSCHGOLV (GitHub/Google-monstret: Settings - Sakerhet - Passkeys med lagg till/namnge/ta bort, flera passkeys per konto; nudge efter login ar komplement, aldrig enda vagen) - inte valfri form. 11/10-regeln: golvet skars aldrig. Direktnavigering till /passkey hjalper INTE heller sa lange kontot redan har passkey eller servern ar disabled (probe-studsen) - ytan ar alltsa HELT onabar idag. Bygget bor ta cue fran task-231 (serveraktiveringen) forst.

FORMVAL KVITTERAT (Marcus 2026-08-16, 'Ja din rekommendation'): rad 'Inloggning & säkerhet' på Mer-sidan → egen sida med passkey-listan (lägg till, namnge, ta bort) — GitHub/Google-mönstret rakt av. Byggordning: EFTER task-231:s staging-aktivering (ytan kan inte e2e-verifieras mot avstängd server).
<!-- SECTION:NOTES:END -->
