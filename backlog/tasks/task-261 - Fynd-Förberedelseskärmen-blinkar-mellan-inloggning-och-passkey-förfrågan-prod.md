---
id: TASK-261
title: >-
  Fynd: Förberedelseskärmen blinkar mellan inloggning och passkey-förfrågan
  (prod)
status: To Do
assignee: []
created_date: '2026-08-17 09:36'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 477000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-observation 2026-08-17 under QA 243.4-morgonkollen, skarp prod (admin.miranon.dev): vid inloggning blinkade Förberedelseskärmen till MELLAN inloggningen och passkey-förfrågan ('Vill du logga in snabbare nästa gång'). TASK-233 (Done) fixade mikro-blinket vid SIDBYTEN (rotens Suspense-fallback fick delay) och TASK-240 (Done) loadingbaren vid utloggning→inloggning — denna övergång (post-login → passkey-prompt) är antingen en ANNAN kodväg utan delay-tröskeln eller ett fall där tröskeln korsas (prod-latens). Lotta-synligt = hög prioritet. Frekvens: 'ibland' (en observation); prod-miljö. Passkey-ytan: p1–p4 i prod, task-231 öppen (p5–6 återstår).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsak identifierad med reproduktion (dev/staging räcker; koppling till 233:s delay-mekanik eller separat kodväg klarlagd)
- [ ] #2 Fix: övergången inloggning→passkey-förfrågan visar ingen Förberedelseskärm-blink
- [ ] #3 Regressionstäckning i lämplig testklass (233:s mönster som förlaga)
- [ ] #4 Verifierad i faktiska login→passkey-övergången (dev/staging; prod-verifikat vid nästa deploy-svep)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
