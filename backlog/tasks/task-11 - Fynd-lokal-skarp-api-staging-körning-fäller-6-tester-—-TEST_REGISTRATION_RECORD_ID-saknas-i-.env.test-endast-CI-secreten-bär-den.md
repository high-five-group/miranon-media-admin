---
id: TASK-11
title: >-
  Fynd: lokal skarp api-staging-körning fäller 6 tester —
  TEST_REGISTRATION_RECORD_ID saknas i .env.test (endast CI-secreten bär den)
status: Done
assignee: []
created_date: '2026-07-12 17:29'
updated_date: '2026-07-18 11:27'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Registrerat under task-5-körningen (S66 batch 4). Pre-existerande lokalmiljö-gap, INTE orsakat av task-5-ändringen (verifierat: alla 6 fel är exakt samma env-precondition; task-5-diffen rör endast webServer-blocket + test:api*-scriptens PLAYWRIGHT_NO_WEB_SERVER-flagga). CI opåverkad (secreten finns där).

Orkestrator-triage-not (S66 batch 4): TASK-12 är syskon-dubblett — task-6-agentens oberoende återfynd av SAMMA rotorsak (saknad 7:e nyckel TEST_REGISTRATION_RECORD_ID; värdet dokumenterat i BUILD-LOG steg 7b). TASK-12 adderar .env.test.example-mallens lucka. En åtgärd stänger båda — konsolidera vid triage.

S66 batch 2-bekräftelse + diagnostik-nyans (båda pipeline-agenterna träffade klassen oberoende): get-registrations väg D (rad 86/132) kan dessutom timeouta på 30 s vid kall/långsam staging ÄVEN med nyckeln satt — kör riktad omkörning av filen före felklassning (grön omkörning = latens, ej regression). Kandidat vid åtgärd: wire:a nyckeln i .env.test-receptet + runbooken så first-run blir grön utan omkörning (värdet är repo-dokumenterat i BUILD-LOG steg 7b, ej hemligt).

LEVERANS (S67, konsoliderad med TASK-12 — en åtgärd, båda korten): (1) Raden TEST_REGISTRATION_RECORD_ID=recynkk5KWpWirv7k tillagd i .env.test.example (kommentar: exakt vilka 6 fall + BUILD-LOG-referens; värdet är repo-dokumenterat record-ID, ingen credential) OCH i Marcus lokala .env.test (Marcus-kvitterad väg: S67-scope punkt 1 'nyckeln in i .env.test + .env.test.example'). (2) Skipvakts-utökningen 6→7 FÖRKASTAD med motiv: helpers-vakten är svit-global (skip/hård fail för HELA api-sviten) medan nyckeln är 6-falls-lokal — utökning hade skippat 290 friska tester lokalt och ändrat CI-hårdfelets semantik; i stället är nyckeln dokumenterad i helpers.ts-headern med förkastande-motivet inline (framtida läsare ser beslutet där vakten bor). (3) Nyckeluppsättningen dokumenterad på alla tre ytor där .env.test-formen beskrivs: mallen + helpers-headern + CONTRIBUTING § Testkörning-noten. BEVIS: RÖD — nyckeln tvingad tom via kanoniska test:api:staging (update-record): exit≠0, exakt 1 (nyckel-beroende) fall rött / 6 gröna, nya meddelandet renderat; GRÖN — full test:api 295 passed + väg D-fallet rött av LATENS-klassen (kall staging efter 6 dygns vila) → riktad omkörning av filen grön 5/5 per kortets egen diagnostik-nyans = funktionellt 296/296. Sido-observation: första RÖD-försöket via plain 'npx playwright test --project=api-staging' träffade webServer-vägran på upptagna 5173 — TASK-5/6-räckena fungerade exakt som designade (plain-formen är icke-stödd; kanoniska formen användes därefter).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad (S67, konsoliderad med TASK-12 — en åtgärd stängde båda korten) · commit bb65b7f · CI-run 29642391302 grön per jobb (Detect changed files, Lint+Audit+TypeCheck, Test+Build, Docs link check, CI Passed or Skipped — samtliga success; Test+Build KÖRDE på testfil-diffen = fulla svit-beviset) · CI-grön-första-pass: ja · defekter under körning: 0 (väg D-fallet rött av latens-klassen i första fulla körningen → riktad omkörning 5/5 grön per kortets egen diagnostik-nyans — ej regression) · Bevis: RÖD via kanoniska test:api:staging med nyckeln tvingad tom (exit≠0, exakt 1 nyckel-beroende fall rött / 6 gröna, nya .env.test.example-pekande meddelandet renderat) → GRÖN full test:api 295/296 + riktad väg D-omkörning = funktionellt 296/296 · Skipvakts-utökningen 6→7 FÖRKASTAD med motiv (vakten är svit-global, nyckeln 6-falls-lokal — utökning hade skippat 290 friska tester; beslutet dokumenterat i helpers.ts-headern) · Marcus lokala .env.test kompletterad efter explicit S67-scope-kvittens (punkt 1); alla 7 nycklar verifierade på plats.
<!-- SECTION:FINAL_SUMMARY:END -->
