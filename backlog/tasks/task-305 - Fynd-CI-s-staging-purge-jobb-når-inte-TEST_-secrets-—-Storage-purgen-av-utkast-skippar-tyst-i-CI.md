---
id: TASK-305
title: >-
  Fynd: CI:s staging-purge-jobb når inte TEST_*-secrets — Storage-purgen av
  utkast/ skippar tyst i CI
status: To Do
assignee: []
created_date: '2026-08-23 00:02'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 558000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur `TASK-302.3` (S108 natt-körning 2026-08-23, bygg-agentens "Divergens 3 / medvetet scope-beslut"). KORTET SKAPAS, LÖSES INTE HÄR — det är ett beslut om CI-secret-scope som Marcus äger.

## Läget, mätt

`.purge-staging-policy.json` bär sedan `TASK-302.3` en `storageTargets`-klass (`utkast-drafts`, bucket `bilagor`, prefix `utkast`), exekverad av `scripts/purge-staging-sentinels.mjs` via de JWT-gated actionsen `list_prefix`/`remove_paths` på `test-attachments-storage`-EF:en. Mekanismen är live-bevisad lokalt (6 utkast listade, 1 raderat över 60-min-guarden, 5 kvar). Den kräver `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` — secrets som REDAN finns och REDAN nås av `test-staging`-jobbet i `.github/workflows/ci-suite.yml`.

Purge-jobbet ("Staging sentinel purge") injicerar i dag ENBART `STAGING_AIRTABLE_TOKEN`. Storage-purgen skippar därför tyst i CI med en loggrad — Airtable-targets purgas som förut, `utkast/` purgas bara när skriptet körs lokalt. Utkasten är bundna per konstruktion (ett per event/typ, `ADR-124` § Beslut 2), så läckan är begränsad, men staging-testerna skapar utkast för `ZZ-`-events som aldrig får en skarp generering.

## Beslutet

Ska purge-jobbet få de fyra `TEST_*`-secreten i sitt `env:`-block? Kostnad: fyra rader i `ci-suite.yml`, ingen ny secret. Risk: ett purge-jobb med admin-JWT-kapacitet mot staging — samma kapacitet `test-staging` redan har i samma workflow. Alternativ: låta Storage-purgen förbli lokal/manuell (bokförs då i `.purge-staging-policy.json`s kommentar och i `docs/reference/staging-verifiering-runbook.md`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus beslut bokfört på kortet (secrets in i purge-jobbet ELLER Storage-purgen deklarerad lokal/manuell)
- [ ] #2 Vald väg byggd: antingen ci-suite.yml-env-blocket + en grön CI-körning där purge-loggen visar Storage-targeten exekverad, eller runbook + policy-kommentar uppdaterade
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
