---
id: TASK-16
title: >-
  Fynd: ADR-060-purgens wiring — sentinel-ackumuleringen har nått tröskeln två
  gånger (S52 create-event, S69 create-registration)
status: In Progress
assignee: []
created_date: '2026-07-19 07:54'
updated_date: '2026-07-19 11:22'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM: ADR-060 punkt 5:s interim ('bounded sentinel-ackumulering tolereras; purge manuell/schemalagd') har nu producerat TVÅ tröskel-händelser där ackumulerade sentineler fällde tester på orörd kod: (1) S52 2026-07-06 — 60 create-event-sentineler gjorde get-attendance-conformances fixtursökning ~47 s > 30s-timeout (run 28755566920; interim MCP-radering + strukturkortet task-2); (2) S69 2026-07-19 — 354 create-registration-sentineler (create-test+*@staging.test) på seed-ankarets event × stagings REGISTRATIONS_BATCH_SIZE=2 ⇒ 180 seriella Airtable-anrop i väg D ⇒ ~32 s från EU (EF exekverar i anroparens region; CI:s US-runner under timeouten → CI-grön/lokal-röd, TASK-14; interim MCP-radering av samtliga 354, väg D 32s→1,3s, sviten 294/296→296/296). ÅTERACKUMULERINGSTAKT: ~2–3 sentineler per svitkörning ≈ 250/månad ⇒ ~6 veckors horisont till nästa tröskel. FÖRVÄNTAT BETEENDE (ADR-060 punkt 3–4, redan beslutad form): setup-purge FÖRE test (ej teardown; Vlad Mihalcea-formen) i Airtable-creddad seed-tooling SKILD från test-jobbet (EF-only-gränsen intakt — testet får aldrig token); delar endast sentinel-KONVENTIONEN med testet. Design-frågor för utföraren: var credentialen bor (separat CI-jobb med egen secret / lokal tooling / schemalagd), scope (create-test+ OCH ZZ-create-event-klassen), och trigger-kadens. Blockerar EJ idag (basen nyss städad) — horisonten är deadline-signalen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Purge-mekanismen implementerad per ADR-060 punkt 3–4 (setup-före-test, cred-skild från test-jobbet, markör-matchad) och skarp-bevisad mot staging
- [x] #2 ADR-060 uppdaterad (Updates-post: interim punkt 5 ersatt av wiringen) + CONTRIBUTING/runbok-not om mekanismen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KLASSAD ready-for-agent 2026-07-19 (S70; klassnings-akten = Marcus-ordern 'om den är redo för agent så klassar du den så' + Code-bedömning mot substrat-kontraktet: symptom dubbel-belagt med run-ids, förväntad form redan ADR-beslutad [060 p3–4], design-frågorna explicit inom utförar-ramen, AC verifierbara). Prioritet medium: blockerar ej idag (basen städad S69) — ~6-veckors-återackumuleringshorisonten (≈250 sentineler/månad) är deadline-signalen; nästa tröskel ≈ 2026-08-30. Vid utförande: EF-only-gränsen intakt (testet får ALDRIG token) — credential-placeringen är förstahands-designfrågan, STOPPA vid genuint arkitektur-val.

S71 leverans: purge-mekanismen implementerad per ADR-060 p3-4 — scripts/purge-staging-sentinels.mjs (universell logik; 4 skyddsräcken: bas-guard m. hårt blockerad prod-bas, ålders-guard 60 min i kod på createdTime, exakt markör-match per klass, namn-agnostisk länk-guard) + .purge-staging-policy.json (config-driven) + CI-jobbet 'Staging sentinel purge' (egen runner, egen secret STAGING_AIRTABLE_TOKEN least-privilege scopad till staging-basen; Test+Build needs purge m. skipped-tolerans; ci-passed aggregerar) + npm run purge:staging (.env.seed) + 23 guard-tester (scripts/test-purge-staging-sentinels.mjs, inkl. S52-ZZ-History-skyddet). AC2: ADR-060 Updates-post (interim p5 ERSATT) + CONTRIBUTING §Testkörning. Formlerna live-verifierade via MCP mot staging före push (22 anmälnings- + 50+ event-sentineler träffade, 0 länkade). AC1 skarp-bevis = CI-purge-jobbets logg vid denna push; bockas vid stängning.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
