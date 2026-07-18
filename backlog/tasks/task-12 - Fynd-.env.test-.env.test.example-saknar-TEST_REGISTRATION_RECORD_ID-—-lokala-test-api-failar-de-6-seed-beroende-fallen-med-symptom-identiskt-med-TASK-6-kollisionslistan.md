---
id: TASK-12
title: >-
  Fynd: .env.test + .env.test.example saknar TEST_REGISTRATION_RECORD_ID —
  lokala test:api failar de 6 seed-beroende fallen med symptom identiskt med
  TASK-6-kollisionslistan
status: Done
assignee: []
created_date: '2026-07-12 18:09'
updated_date: '2026-07-18 11:27'
labels: []
dependencies: []
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S66 batch 4, task-6-körningen): lokal 'npm run test:api' med enbart 'set -a; source .env.test; set +a' gav 290 passed + 6 failed — EXAKT samma 6 fall som TASK-6:s kollisionslista (create-registration 89/129/160, get-registrations väg D 86/132, update-record 92) — med felet 'TEST_REGISTRATION_RECORD_ID måste vara satt i staging-env' (hård expect, t.ex. tests/api/create-registration.staging.test.ts rad 73). Mekanik: de 6 fallen är exakt de som använder den seedade ankar-posten; nyckeln finns som CI-secret (ci.yml Test+Build, API tests staging-steget) men VARKEN .env.test (lokal, gitignorad) eller den committade mallen .env.test.example bär den. Symptomet härmar staging-kollisionen → hög felklassningsrisk för nästa agent. VERIFIERAT S66: med värdet ur docs/BUILD-LOG.md steg 7b (syntetisk Anmälningar-rad recynkk5KWpWirv7k, 'TEST_REGISTRATION_RECORD_ID wired', commit a63dda2-eran) injicerat per anrop är sviten 296/296 grön — värdet är alltså fortfarande det aktuella seed-ID:t. FÖRVÄNTAT BETEENDE, som instruktion till utföraren: (1) lägg raden TEST_REGISTRATION_RECORD_ID=recynkk5KWpWirv7k i .env.test.example med kommentar om vilka 6 tester som kräver den och BUILD-LOG-referens; (2) .env.test är Marcus levande cred-fil — skriv ALDRIG till den utan hans kvittens; be honom komplettera sin lokala fil (mallen + CONTRIBUTING-noten är den agent-säkra ytan); (3) överväg att utöka felmeddelandet i de hårda expect:en så det pekar på .env.test.example-raden — då ser nästa agent miljö-orsaken direkt i stället för att jaga staging-kollision.
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
Orkestrator-triage-not (S66 batch 4): syskon-dubblett till TASK-11 (task-5-agentens ursprungsfynd av samma rotorsak, med skipvakts-förslaget helpers.ts 6→7 nycklar). Detta kort adderar mall-luckan (.env.test.example). En åtgärd stänger båda — konsolidera vid triage.

LEVERANS (S67, konsoliderad med TASK-11 — se TASK-11-notes för helhet + bevis): kortets tre punkter utförda. (1) Mallraden i .env.test.example ✓ med kommentar om de 6 fallen + BUILD-LOG-referens. (2) .env.test (Marcus levande cred-fil) kompletterad EFTER explicit Marcus-kvittens (S67 Del 1 scope-punkt 1) — den agent-säkra ytan respekterad: append av en rad, inget annat rört, filen verifierat gitignorad före skrivning. (3) Felmeddelandena i de 3 hårda expect:en (create-registration/get-registrations/update-record) pekar nu på .env.test.example-raden — nästa agent ser miljö-orsaken direkt i stället för att jaga staging-kollision. Därtill: CONTRIBUTING § Testkörning-symptomnoten uppdaterad (pekar på mallen) + föråldrad gitignore-osäkerhets-kommentar i mallens header rättad (verifierad via git check-ignore).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad (S67, konsoliderad med TASK-11 — se TASK-11:s final-summary för fullständigt bevisläge) · commit bb65b7f · CI-run 29642391302 grön per jobb · CI-grön-första-pass: ja · Kortets tre punkter utförda: (1) mallraden TEST_REGISTRATION_RECORD_ID=recynkk5KWpWirv7k i .env.test.example med kommentar om de 6 fallen + BUILD-LOG-referens (2) .env.test kompletterad EFTER explicit Marcus-kvittens i S67-scope — agent-säkra ytan respekterad, gitignore-verifierad före skrivning (3) felmeddelandena i de 3 hårda expect:en pekar nu på mallraden — felklassningsrisken mot staging-kollisions-symptomet stängd · Därtill: CONTRIBUTING § Testkörning-symptomnoten pekar på mallen + mallens föråldrade gitignore-osäkerhetskommentar rättad (verifierad via git check-ignore).
<!-- SECTION:FINAL_SUMMARY:END -->
