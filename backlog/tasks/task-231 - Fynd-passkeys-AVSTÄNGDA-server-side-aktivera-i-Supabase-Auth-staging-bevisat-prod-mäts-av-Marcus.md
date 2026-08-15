---
id: TASK-231
title: >-
  Fynd: passkeys AVSTÄNGDA server-side - aktivera i Supabase Auth (staging
  bevisat, prod mäts av Marcus)
status: To Do
assignee: []
created_date: '2026-08-15 23:26'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 432000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 Lotta-vandringen punkt 8-rotorsaken (2026-08-16): staging-Supabase svarar 404 passkey_disabled på /auth/v1/passkeys/authentication/options (curl-bevisat med anon key). Klientflödet (127.8/ADR-093) byggdes MEDVETET mot detta läge - passkey.ts topp-kommentaren bokför det och degraderar tyst (probe - servertillgangligt false - vidare utan sedd-markering), exakt vad Marcus upplevde ('Kontrollerar ditt konto' - hem-studs; login-knappens 'Kunde inte logga in med passkey' = samma serverorsak, medvetet oavslöjande copy). Funktionen är alltså KOMPLETT byggd klient-side men VILANDE server-side, och det kommunicerades aldrig som driftläge. GÖR: (1) research-verifiera exakta aktiveringsvägen för Supabase Auth passkeys (hosted dashboard vs config; beta-status, ev. krav) mot forstapartsdocs; (2) aktivera STAGING forst, verifiera probe-svaret flippar + registrering/inloggning fungerar e2e; (3) PROD-aktiveringen ar Marcus HITL-klick (prod-ref-laset TASK-203) - leverera exakt klicklista; (4) darefter ar QA 127.10 steg 6 kortbar. Prod-lagets matning: Marcus kor curl-kommandot sjalv (levererat i chatten).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Aktiveringsvagen kallbelagd mot Supabase forstapartsdocs
- [ ] #2 Staging aktiverad och e2e-verifierad (probe + registrera + logga in)
- [ ] #3 Prod-klicklista levererad till Marcus; prod-aktivering utford av Marcus och verifierad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
