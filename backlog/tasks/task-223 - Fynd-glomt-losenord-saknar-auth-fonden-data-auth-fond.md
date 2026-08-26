---
id: TASK-223
title: 'Fynd: glomt-losenord saknar auth-fonden (data-auth-fond)'
status: To Do
assignee: []
created_date: '2026-08-15 09:05'
updated_date: '2026-08-26 03:33'
labels:
  - ready-for-agent
dependencies: []
ordinal: 426000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Explore-svepets fynd (2026-08-15): fyra av fem auth-ytor sätter data-auth-fond-markören (login, passkey, nytt-losenord, valkommen) och får den gyllene gradienten — glomt-losenord gör det INTE och renderas på vit bakgrund trots samma kortform. Inget dokumenterat undantag hittades. FÖRSTA STEGET är forensik (pre-K-passet): git-historik + spec för ytan — finns ett medvetet skäl rapporteras det och kortet stängs som avsiktligt design; annars läggs markören med exakt samma useEffect-mönster som syskonytorna.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Forensik-utfallet bokfört i notes: medvetet undantag (→ ingen ändring, motiv citerat) ELLER miss (→ fonden lagd)
- [x] #2 Vid ändring: glomt-losenord bär auth-fonden med samma sätt/städ-mönster som de fyra syskonytorna; visuellt verifierad på dev-server
- [x] #3 DoD-kvartetten grön
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
AC#1 FORENSIK-UTFALL: MISS, inte medvetet undantag. Git-historik körd (git log --follow, git show 0d3cb92f): glomt-losenord.tsx och nytt-losenord.tsx skapades i SAMMA commit (0d3cb92f, TASK-127.7, 2026-08-05) — nytt-losenord.tsx fick data-auth-fond DÄR, glomt-losenord.tsx fick det inte. Ingen kommentar, ADR eller kort-notering nämner ett medvetet undantag för just denna sida. Klassat MISS.

AC#2 FIXAT: glomt-losenord.tsx bär nu auth-fonden — exakt samma useEffect-mönster som login.tsx (rot.dataset.authFond='true' vid mount, delete vid unmount). Visuellt verifierat på dev-server (localhost, npm run dev): document.documentElement.dataset.authFond === 'true' på /glomt-losenord (Playwright MCP-evaluate), och skärmdump bekräftar den varma gradient-fonden bakom det vita kortet, konsistent med syskonytorna. DoD-kvartetten grön (se PR).
<!-- SECTION:NOTES:END -->
