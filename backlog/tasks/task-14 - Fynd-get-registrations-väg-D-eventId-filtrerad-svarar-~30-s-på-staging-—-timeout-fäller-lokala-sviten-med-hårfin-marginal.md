---
id: TASK-14
title: >-
  Fynd: get-registrations väg D (eventId-filtrerad) svarar ~30 s på staging —
  timeout-fäller lokala sviten med hårfin marginal
status: To Do
assignee: []
created_date: '2026-07-18 17:48'
updated_date: '2026-07-18 19:09'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S67 post-deps-verifieringen, kväll efter en dags intensivt staging-bruk): lokala test:api fäller EXAKT väg D-paret (get-registrations.staging.test.ts rad 89 + 135) på 'Test timeout of 30000ms exceeded' — konsekvent över full svit + riktad omkörning. MÄTDATA (curl mot EF:n med giltig user-JWT, ×3): eventId-FILTRERADE vägen HTTP 200 på 30,9 s · 29,7 s · 30,2 s — OFILTRERADE vägen 1,7 s. Stabilt ~18× långsammare filtrerad gren; Playwright-30s-gränsen fälls med hårfin marginal. INTE en kod-regression: EF:erna ej omdeployade under dagen, test-koden orörd, och main-CI:s Test+Build körde SAMMA fall GRÖNA ~15 min före lokala mätningen (run 29654016580 m.fl.) — fenomenet är tids-/tillståndsberoende på staging-sidan. HYPOTESRYMD (overifierad, prövas vid utförandet): (a) Airtable-throttling efter dagens hamrande [CI-runs ×10 + lokala sviter ×3 + QA] → fetchWithRetry-backoff-kedja i EF:ns filtrerade fler-anropsväg äter ~30 s; (b) data-ackumulering i staging-basens Anmälningar [dagens seed/purge-cykler] gör filterformelns skanning dyr [TASK-2-klassens granne]; (c) Airtable-kostnad för filter på länkat fält. DIAGNOSTIK-RECEPT: JWT ur felloggen/auth-artefakten → curl -w '%{time_total}' mot .../get-registrations?eventId=reci2UQEPBMl3ebNl vs ofiltrerad; mät KALL morgon för transiens-test över dygn. UTFÖRARE: (1) mät igen vid kall staging — sjunkit → transient-klassa + dokumentera i CONTRIBUTING-noten; (2) kvarstår → profilera EF:ns väg D-implementation [antal Airtable-anrop filtrerad vs ofiltrerad] + överväg TASK-2-klassens immunisering; (3) överväg riktad timeout-höjning ENDAST om rotorsaken är legitim Airtable-kostnad [aldrig maskera äkta regression]. Blockerar EJ: CI grön, funktionellt korrekta svar (200 + rätt data — bara långsamt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken klassad med mätserie (transient Airtable-tillstånd / data-ackumulering / filtervägens anropsform) — käll-belagd
- [ ] #2 Åtgärd eller dokumenterad accept per klassningen; lokala fulla sviten grön eller känd-form-noterad i CONTRIBUTING
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S68 R3 (Marcus-order 'vi kör på dina rekommendationer', arbetssätts-briefingen): prioriterad som NÄSTA SESSIONS INGÅNG — kall-morgon-mätningen per kortets diagnostik-recept kräver ohamrat staging-dygn, därför utförs INGET av kortet i S68. Etikett + priority är klassnings-akten på ordern. Kontext: väg D-latensen är CI-svansens dominant-granne (API-staging 96 s av Test+Build 409 s) — rotorsaksfixen har dubbel utdelning (CI-tid + lokal svit-stabilitet).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
