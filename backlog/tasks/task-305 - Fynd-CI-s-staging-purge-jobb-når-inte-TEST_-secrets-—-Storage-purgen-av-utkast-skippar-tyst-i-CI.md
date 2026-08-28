---
id: TASK-305
title: >-
  Fynd: CI:s staging-purge-jobb når inte TEST_*-secrets — Storage-purgen av
  utkast/ skippar tyst i CI
status: Done
assignee: []
created_date: '2026-08-23 00:02'
updated_date: '2026-08-28 03:14'
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
- [x] #1 Marcus beslut bokfört på kortet (secrets in i purge-jobbet ELLER Storage-purgen deklarerad lokal/manuell)
- [x] #2 Vald väg byggd: antingen ci-suite.yml-env-blocket + en grön CI-körning där purge-loggen visar Storage-targeten exekverad, eller runbook + policy-kommentar uppdaterade
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Marcus mandat (orkestrerarens uppdrag, 2026-08-23): secrets in i purge-jobbet, EXAKT de fyra STORAGE_PURGE_ENV_VARS-namnen — ingen secrets: inherit, ingen ny environment:. Grund: docs/research/ci-stadjobbets-credential-scope-2026-08-23.md § Dom (samma fyra TEST_*-secrets flödar redan genom test-staging-jobbet i samma workflow-fil mot samma test-attachments-storage-EF; ingen ny credential-klass, ADR-053-triage). Byggt: .github/workflows/ci-suite.yml (purge-jobbets env-block +4 rader), scripts/purge-staging-sentinels.mjs (kommentar+loggrad rättad till nytt läge), docs/decisions/ADR-124-...md § Updates 2026-08-23 (korrigerar den nu inaktuella 'lokalt/på begäran, inte CI'-raden). AC #2 delvis: env-blocket byggt och grindar gröna lokalt (actionlint/yamllint/test-purge-staging-sentinels/check:docs/typecheck/biome/build/test:api/verify:ci-parity:fast — samtliga exit 0), men skarpt CI-bevis att Storage-targeten faktiskt exekverar (inte 'hoppas över') kräver secrets som bara finns i CI — öppet till nästa post-merge/nightly-körning efter landning.

Stängningssvansen (S108 resume 13): AC #2 bockad. Post-merge-lagret körde inte purge-jobbet (D0-klassning skippade det på PR #1901:s merge 2026-08-24T13:27:10Z). Beviset kommer i stället från Nightly-workflowen (körs ovillkorat, ingen klassning): run 32682955266 (2026-08-24T02:24:27Z, headSha 631aa6758ce03c9f1942235e8a76744df05a5864 — verifierat via git merge-base --is-ancestor att PR #1855:s merge-commit e81d6d024c5ba1f809969240ab230f0543fb648b är förfader till detta träd), jobbet 'Nattlig fullsvit / Staging sentinel purge' (id 97302680131) konkluderade success och loggen visar Storage-targeten EXEKVERAD, inte skippad: 'utkast-drafts (bucket "bilagor", prefix "utkast"): 1 objekt — 1 raderas, 0 för färska' följt av '🗑 1/1 raderade' och 'Purge klar.'. Run-URL: <https://github.com/high-five-group/miranon-media-admin/actions/runs/32682955266/job/97302680131>. DoD #2-4: rörda filer (ci-suite.yml, purge-staging-sentinels.mjs, ADR-124) var redan landade i PR #1855 med gröna lokala grindar per kortets egen Implementation Notes; CI grön (PR #1855 MERGED). Ingen ny kod i denna stängning — kortet stängs på bevis, inte på förändring.
<!-- SECTION:NOTES:END -->
