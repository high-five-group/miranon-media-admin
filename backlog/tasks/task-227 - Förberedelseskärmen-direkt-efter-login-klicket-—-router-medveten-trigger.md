---
id: TASK-227
title: Förberedelseskärmen direkt efter login-klicket — router-medveten trigger
status: To Do
assignee: []
created_date: '2026-08-15 13:18'
labels:
  - ready-for-agent
dependencies: []
ordinal: 429000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljningskort ur TASK-218.3:s öppet bokförda avgränsning (varv 3-fixen, 2026-08-15): warmup-gaten i auth-resolutionens render-gate täcker KALL APPSTART med befintlig session (Lottas PWA-vardag, bevisad i 218.4:s e2e-kallstartsfall) — men skärmen direkt EFTER ett aktivt login-klick på en kall enhet uteblir, eftersom gaten öppnar fritt för auth-ytorna (login/glomt-losenord/nytt-losenord/passkey/valkommen — CI-fångsterna varv 1–2) och inte re-triggar när navigeringen lämnar dem. Rätt ingreppspunkt per research-passet (app-startup-warmup-splash-2026-08-15.md): inloggningens routningsflöde (routaEfterLyckadInloggning) — en router-medveten trigger som startar värmningen när målet är app-ytan och cachen är kall. Respektera gate-lärdomarna i src/main.tsx:s varv 4-kommentar (invalidate-samspelet) och tyst-vid-varmt-regeln (ADR-112 beslut 2).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Aktiv inloggning på kall enhet visar Förberedelseskärmen innan Hem (samma form som appstartsfallet); varm enhet förblir tyst
- [ ] #2 Auth-ytorna skyms aldrig (webbläsarsvitens varv 1–2-fall gröna oförändrade) och invalidate-invarianten består (acceptance-sviten grön)
- [ ] #3 E2E-fall för login-vägen i persist-/auth-sviten enligt befintligt idiom
- [ ] #4 DoD-kvartetten grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
