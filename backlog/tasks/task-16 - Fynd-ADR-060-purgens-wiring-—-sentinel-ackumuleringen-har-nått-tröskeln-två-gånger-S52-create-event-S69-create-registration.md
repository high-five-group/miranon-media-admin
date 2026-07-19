---
id: TASK-16
title: >-
  Fynd: ADR-060-purgens wiring — sentinel-ackumuleringen har nått tröskeln två
  gånger (S52 create-event, S69 create-registration)
status: To Do
assignee: []
created_date: '2026-07-19 07:54'
labels: []
dependencies: []
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM: ADR-060 punkt 5:s interim ('bounded sentinel-ackumulering tolereras; purge manuell/schemalagd') har nu producerat TVÅ tröskel-händelser där ackumulerade sentineler fällde tester på orörd kod: (1) S52 2026-07-06 — 60 create-event-sentineler gjorde get-attendance-conformances fixtursökning ~47 s > 30s-timeout (run 28755566920; interim MCP-radering + strukturkortet task-2); (2) S69 2026-07-19 — 354 create-registration-sentineler (create-test+*@staging.test) på seed-ankarets event × stagings REGISTRATIONS_BATCH_SIZE=2 ⇒ 180 seriella Airtable-anrop i väg D ⇒ ~32 s från EU (EF exekverar i anroparens region; CI:s US-runner under timeouten → CI-grön/lokal-röd, TASK-14; interim MCP-radering av samtliga 354, väg D 32s→1,3s, sviten 294/296→296/296). ÅTERACKUMULERINGSTAKT: ~2–3 sentineler per svitkörning ≈ 250/månad ⇒ ~6 veckors horisont till nästa tröskel. FÖRVÄNTAT BETEENDE (ADR-060 punkt 3–4, redan beslutad form): setup-purge FÖRE test (ej teardown; Vlad Mihalcea-formen) i Airtable-creddad seed-tooling SKILD från test-jobbet (EF-only-gränsen intakt — testet får aldrig token); delar endast sentinel-KONVENTIONEN med testet. Design-frågor för utföraren: var credentialen bor (separat CI-jobb med egen secret / lokal tooling / schemalagd), scope (create-test+ OCH ZZ-create-event-klassen), och trigger-kadens. Blockerar EJ idag (basen nyss städad) — horisonten är deadline-signalen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Purge-mekanismen implementerad per ADR-060 punkt 3–4 (setup-före-test, cred-skild från test-jobbet, markör-matchad) och skarp-bevisad mot staging
- [ ] #2 ADR-060 uppdaterad (Updates-post: interim punkt 5 ersatt av wiringen) + CONTRIBUTING/runbok-not om mekanismen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
