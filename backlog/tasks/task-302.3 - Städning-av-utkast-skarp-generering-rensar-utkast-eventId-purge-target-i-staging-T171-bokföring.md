---
id: TASK-302.3
title: >-
  Städning av utkast: skarp generering rensar utkast/<eventId>/, purge-target i
  staging, T171-bokföring
status: To Do
assignee: []
created_date: '2026-08-22 21:24'
updated_date: '2026-08-22 23:53'
labels:
  - ready-for-agent
dependencies:
  - TASK-302.2
parent_task_id: TASK-302
priority: medium
ordinal: 555000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skiva 3 av `TASK-302`. Håller den transienta mängden bunden och bokför resten öppet.

## Bygg

1. `generate-event-attachment` (skarp väg, `preview: false`) och kvittots skarpa sändning (`_shared/send-receipt.ts` § `sendReceipt`, efter lyckad sändning): ta bort `utkast/<eventId>/` (`storage.remove` på listade objekt under prefixet) — utkastet är ersatt av den riktiga artefakten. Fel vid städning loggas, fäller aldrig den skarpa operationen.
2. `.purge-staging-policy.json`: target för `utkast/**` i bucket `bilagor` så staging-CI:s setup-purge tar testutkasten. OBS CLAUDE.md § Granskningsdata: `ZZ-GRANSKNING-*` rörs aldrig — utkast-targeten avgränsas till prefixet, inte till events.
3. `T171` (persondata, `tasks/threads/README.md` + ev. kort): bokför att kvitto-utkast med köparuppgifter ligger i privat bucket under signerad 300 s-URL, högst ett per event, borttaget vid skarp sändning — och att prod saknar tidsstyrd städning (känd rest, `ADR-124` § Kända rester).
4. `docs/reference/` — där Storage-layouten för `bilagor` dokumenteras (sök `BILAGOR_BUCKET_ID`/`<eventId>/` i docs): lägg `utkast/`-prefixet i kartan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skarp generering/sändning för event E tar bort utkast/E/ — API-test: utkast finns före, saknas efter, skarp operation lyckas även om remove fallerar
- [x] #2 .purge-staging-policy.json bär utkast-targeten; scripts/check-listparitet.sh och purge-testsviten gröna
- [x] #3 T171 och Storage-layout-dokumentet bär utkast-prefixet; ADR-124 § Kända rester nämner prod-städningen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1-3 matta mot skarp staging (pqtshyierkdgwdnxuirz). test:api 1043/1043 grona (2.4 min). generate-event-attachment.staging.test.ts nytt test AC1(TASK-302.3) bevisar: preview skapar utkast (HEAD 200), skarp generering (201), SAMMA signerade URL ger sedan INTE 200 - rensaUtkast tog bort objektet. send-receipt.test.ts nytt test bevisar cleanupDraft anropas EN gang med ratt eventId efter lyckad sandning, ALDRIG vid avvisad, och ett kastat fel dari fanger INTE en redan lyckad sandning. Best-effort-fallet for klass B (remove fallerar) ar strukturellt garanterat av rensaUtkast try/catch, ej live-forcerat - samma disciplin som delete-attachment.ts Storage-borttagning. typecheck/biome/build grona. check:docs 14/14 grona. check-listparitet 6/6. check-thread-index gron. purge-testsviten: 13 nya tester grona for storageTargets/isStorageObjectOldEnough/planStoragePurge. DEPLOY staging: generate-event-attachment, send-receipt-email, test-attachments-storage - exit 0 vardera, prod ORORD. PURGE-MEKANISMEN LIVE-BEVISAD: npm run purge:staging med .env.seed+.env.test kallade listade 6 riktiga utkast-objekt via nya list_prefix-actionen, raderade 1 som passerat 60-min-guarden via remove_paths, lamnade 5 - efterfoljande dry-run bekraftade 5 kvar. Ny target-klass storageTargets i policy-filen, exekverad via TVA nya JWT-gated actions pa BEFINTLIGA test-attachments-storage-EF:en - ingen ny hemlighet.

AVVIKELSE 1 (bokford, ej tyst): uppdraget antog ett befintligt Storage-layout-dokument i docs/reference/ (grep BILAGOR_BUCKET_ID och eventId/ gav noll traffar - verifierat). Ingen sadan karta fanns. Byggde en minimal ny sektion i data-model.md (Bucket bilagor - Storage-path-formerna) i stallet for att uppfinna en helt ny fil - flaggat explicit i sektionens egen text. AVVIKELSE 2 (bokford): AC3 sager ADR-124 paragraf Kanda rester - den rubriken finns INTE i ADR-124 (heter Oppet och medvetet inte beslutat har, och innehaller redan exakt detta). Ny Updates-post i ADR-124 lankar bade T171 och paragraf Oppet i stallet for att uppfinna en rubrik som inte matchar ADR:ns egen struktur.

AVVIKELSE 3 / MEDVETET SCOPE-BESLUT (for orkestrerarens granskning): .github/workflows/ci-suite.yml Staging sentinel purge-jobbet injicerar idag enbart STAGING_AIRTABLE_TOKEN. Storage-purgen kraver dessutom TEST_SUPABASE_URL/TEST_SUPABASE_ANON_KEY/TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD (redan befintliga secrets, redan nadda av test-staging-jobbet i SAMMA workflow) - men jag har MEDVETET INTE andrat ci.yml/ci-suite.yml for att trada in dem i purge-jobbets env-block, eftersom det ar en egen avvagning om vilka secrets ett CI-jobb nar, utanfor en enskild skivas mandat. Mekanismen ar fullt fungerande och live-bevisad NAR miljovariablerna finns (lokalt, eller en framtida commit) - saknas de SKIPPAR skriptet tyst med tydlig loggrad, aldrig exit 1. Fixen om detta beslut ar fel: en fyraradig andring av purge-jobbets env-block, ingen ny secret. PARALLELL SANNINGSKALLA: test-attachments-storage/index.ts filhuvud EN EF TVA ACTIONS uppdaterat till FYRA ACTIONS i samma commit. PREMISS-PASS: origin/feat/task-302-2-skarpa-preview-ef (c7b172a5) matchade uppdragets SHA exakt. PR 1838 var OPEN och armerad (autoMergeRequest satt, BLOCKED pa kon) - inte annu landad vid start, byggde darfor direkt pa den grenen per instruktion. utkast.ts fanns och preview-receipt importerade laggUtkast efter switchen - bas bekraftad korrekt. Inga ovriga divergenser mot uppdraget.
<!-- SECTION:NOTES:END -->
