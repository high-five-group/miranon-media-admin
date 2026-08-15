---
id: TASK-223
title: 'Fynd: glomt-losenord saknar auth-fonden (data-auth-fond)'
status: To Do
assignee: []
created_date: '2026-08-15 09:05'
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
- [ ] #1 Forensik-utfallet bokfört i notes: medvetet undantag (→ ingen ändring, motiv citerat) ELLER miss (→ fonden lagd)
- [ ] #2 Vid ändring: glomt-losenord bär auth-fonden med samma sätt/städ-mönster som de fyra syskonytorna; visuellt verifierad på dev-server
- [ ] #3 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
