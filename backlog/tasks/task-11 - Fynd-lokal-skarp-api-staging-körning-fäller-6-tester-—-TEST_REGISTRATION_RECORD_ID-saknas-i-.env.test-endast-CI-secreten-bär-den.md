---
id: TASK-11
title: >-
  Fynd: lokal skarp api-staging-körning fäller 6 tester —
  TEST_REGISTRATION_RECORD_ID saknas i .env.test (endast CI-secreten bär den)
status: To Do
assignee: []
created_date: '2026-07-12 17:29'
updated_date: '2026-07-12 20:31'
labels: []
dependencies: []
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S66 batch 4, task-5-körningen): 'set -a; source .env.test; set +a; npm run test:api' ger 290 passed men 6 failed — samtliga 6 med identiska felet 'Error: TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env' (create-registration.staging.test.ts x3, get-registrations.staging.test.ts x2, update-record.staging.test.ts x1; felen faller på 4-43 ms, dvs. lokal precondition före HTTP). Lokala .env.test bär 6 nycklar (TEST_SUPABASE_URL/ANON_KEY, TEST_USER_EMAIL/PASSWORD, TEST_ADMIN_EMAIL/PASSWORD) — TEST_REGISTRATION_RECORD_ID är den 7:e som CI:s api-staging-steg injicerar som Actions-secret (ci.yml) men som aldrig landat i lokala .env.test. tests/api/helpers.ts-skipvakten räknar bara 'saknas N av 6' och fångar inte den 7:e.

FÖRVÄNTAT BETEENDE: lokal skarp api-staging-körning ger samma utfall som CI:s. UTFÖRARE: (1) hämta sentinel-recordets ID (samma värde som Actions-secreten TEST_REGISTRATION_RECORD_ID — Marcus äger secreten; recordet är sentinel-anmälan i staging-basen) och lägg raden i lokala .env.test, (2) överväg att utöka helpers.ts-skipvaktens nyckellista till 7 så att saknad nyckel ger begriplig skip/hård vägran i stället för 6 spridda test-fel, (3) dokumentera nyckeluppsättningen där .env.test-formen beskrivs. OBS: .env.test är INTE incheckad — själva nyckelvärdet får aldrig committas.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Registrerat under task-5-körningen (S66 batch 4). Pre-existerande lokalmiljö-gap, INTE orsakat av task-5-ändringen (verifierat: alla 6 fel är exakt samma env-precondition; task-5-diffen rör endast webServer-blocket + test:api*-scriptens PLAYWRIGHT_NO_WEB_SERVER-flagga). CI opåverkad (secreten finns där).

Orkestrator-triage-not (S66 batch 4): TASK-12 är syskon-dubblett — task-6-agentens oberoende återfynd av SAMMA rotorsak (saknad 7:e nyckel TEST_REGISTRATION_RECORD_ID; värdet dokumenterat i BUILD-LOG steg 7b). TASK-12 adderar .env.test.example-mallens lucka. En åtgärd stänger båda — konsolidera vid triage.

S66 batch 2-bekräftelse + diagnostik-nyans (båda pipeline-agenterna träffade klassen oberoende): get-registrations väg D (rad 86/132) kan dessutom timeouta på 30 s vid kall/långsam staging ÄVEN med nyckeln satt — kör riktad omkörning av filen före felklassning (grön omkörning = latens, ej regression). Kandidat vid åtgärd: wire:a nyckeln i .env.test-receptet + runbooken så first-run blir grön utan omkörning (värdet är repo-dokumenterat i BUILD-LOG steg 7b, ej hemligt).
<!-- SECTION:NOTES:END -->
