---
id: TASK-216
title: >-
  Auth-ytornas kortbredd krymps 576→448 px (max-w-xl→max-w-md), hela
  auth-familjen
status: To Do
assignee: []
created_date: '2026-08-15 07:44'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 412000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-GO 2026-08-15 (S102 Lotta-vandringen, punkt 1): login-kortet upplevs lika brett som appens content-yta — mätt 576 px (max-w-xl, src/routes/login.tsx:227) mot AppShells 600 px (src/components/AppShell/AppShell.tsx:38). Beslutet: krymp till max-w-md (448 px) för HELA auth-familjen så formspråket förblir ett — login.tsx:227, glomt-losenord.tsx:98, passkey.tsx:140+204, nytt-losenord.tsx:109+131+232, valkommen.tsx:184+212+343. Fil:rad-belagt av Explore-svepet 2026-08-15. OBS: TabBar max-w-[568px] (TabBar.tsx:55) rörs INTE — den hör till app-ytan, inte auth.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga max-w-xl-förekomster på de fem auth-ytorna (login, glomt-losenord, passkey, nytt-losenord, valkommen) är max-w-md — grep max-w-xl i src/routes/ ger noll auth-träffar
- [ ] #2 Visuell verifiering på dev-server: login-kortet är tydligt smalare än appens content-yta, inga radbrytnings-/overflow-defekter på någon av de fem ytorna i 375 px- och 1440 px-vyport
- [ ] #3 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
