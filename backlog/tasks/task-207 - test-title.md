---
id: TASK-207
title: >-
  Fynd: staging Edge Runtime/Airtable transienta 502/503 i post-merge — tre
  ärenden, två fönster, fem endpoints, ingen relaterad PR-diff
status: To Do
assignee: []
created_date: '2026-08-13 14:52'
updated_date: '2026-08-13 14:55'
labels: []
dependencies: []
priority: medium
ordinal: 382000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge-sviten (post-merge.yml) föll i minst TRE separata körningar 2026-08-12 med genuina 502/503-fel från staging-infrastrukturen (Supabase Edge Runtime och/eller Airtable), spridda över FEM olika endpoints som inte har någon kod- eller testkoppling till varandra. Samtliga tre landande PR:er verifierade OSKYLDIGA via robust first-parent-diff (git diff <merge>^1 <merge> --stat, INTE bara gh pr diff --name-only — se metodnot nedan).

FÖNSTER A, 2026-08-12 ~15:11–15:20Z:

- Issue #1207 (run 31610637080, merge 50afc936bbba, PR #1202/TASK-201.2): tests/api/update-record.staging.test.ts:634 — expect(res.status()).toBe(400), Received: 503 (identiskt 3/3 retries). PR:ens NETTO-diff (git diff 50afc936^1 50afc936 --stat): enbart supabase/migrations/20260812143131_grant_service_role_activity_log.sql + supabase/migrations/README.md. Rör inte update-record-EF:en eller dess test.
- Issue #1208 (run 31610966951, merge aef84b4c8e83, PR #1203/TASK-202, docs-only): TVÅ tester — tests/api/get-event-notes.staging.test.ts:51 (createNote-hjälparen, förväntat 201, Received: 503, kropp verbatim {"code":"SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED","message":"Service is temporarily unavailable"}) och tests/api/get-event.staging.test.ts:48 (förväntat 200, Received: 503). PR:ens NETTO-diff är uteslutande dokumentation/CI/skript (.atkomst-diagnos-policy.conf, .github/workflows/ci.yml, CLAUDE.md, docs/reference/atkomst-och-nycklar.md, package.json, scripts/atkomst-diagnos.sh) — noll app-kod, omöjlig som kodorsak.

FÖNSTER B, 2026-08-12 ~17:36–17:39Z:

- Issue #1222 (run 31623411127, merge 71eba7155d93, PR #1215/TASK-201.5): tests/api/airtable-filter.staging.test.ts:41 (flera fuzz-delfall) — en instans verbatim Expected value: 502 / Received array: [200, 400] (dvs res.status()===502, inte i den tillåtna mängden). SAMMA körnings tests/api/attachment-upload-large.staging.test.ts:145 visar en retry-serie Received: 502 (HTML-felsida) följt av Received: 503 med kroppen {"code":"SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED","message":"Service is temporarily unavailable"} — samma signatur som Fönster A, ANNAN endpoint, 2+ timmar senare. PR:ens NETTO-diff: enbart supabase/functions/get-activity-log/index.ts (ny fil, 258 rader). Rör inte airtable-filter, attachment-upload-large eller deras EF:er (finalize-attachment-upload, create-attachment-upload-ticket otouchade).

VAD DETTA SAMMANTAGET VISAR: fem olika endpoints (update-record, get-event-notes, get-event, airtable-filter, attachment-upload-large), tre olika PR:er utan gemensam kod, två skilda tidsfönster samma kväll — alla exponerar samma felbild (502/503, två av fem med den explicita Supabase-kroppen SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED). Det är strukturellt oförenligt med en kodregression i någon av de tre PR:erna och pekar i stället på transient degradering i staging-miljöns Edge Runtime/Airtable-anrop under dessa fönster.

METODNOT (viktig för framtida triage): gh pr diff <nr> --name-only kan ge FALSKA POSITIVA för PR:er byggda på återanvända/sekventiella worktree-grenar (t.ex. worktree-s103-resume-persondetalj-d, återanvänd över flera PR:er samma dag). Exempel: gh pr diff 1204 --name-only listade tests/api/get-person.staging.test.ts som ändrad, men git diff f42da6e7740e^1 f42da6e7740e -- tests/api/get-person.staging.test.ts gav TOM diff — filen var identisk med huvudgrenen vid själva merge-punkten, eftersom en tidigare PR redan hunnit landa samma innehåll innan denna gren mergades. git diff <merge>^1 <merge> --stat (first-parent-diff mot faktiskt föregående main-topp) är den korrekta metoden för att avgöra vad en merge NETTO införde; gh pr diff kan spegla grenens HELA historik mot sin ursprungliga (äldre) forkpunkt och därmed överrapportera. Se TASK-207 (detta kort) + s105-d3c-post-merge-larm-triage-grenens triage-arbete 2026-08-13.

MÖJLIG SVAG PRECEDENT (ej oberoende verifierad av mig, citerad i TASK-205s Implementation Notes): TASK-201.12-agenten mätte en Airtable-kontentionsflake i update-event.staging.test.ts i just detta fönster (2026-08-11 kväll) — annan natt, annan endpoint, men samma allmänna klass (staging-backend-kontention/degradering under samtidig belastning). Ingen egen backlog-post hittades för den observationen vid sökning 2026-08-13 (grep -rl kontention backlog/tasks/).

NÄSTA STEG FÖR DEN SOM TAR KORTET:
1. Avgör om detta är Supabase-plattformens egen instabilitet (kontrollera Supabase status-historik för pqtshyierkdgwdnxuirz kring dessa tidsfönster) eller självförvållad kontention (flera parallella staging-CI-körningar/agenter samma kväll — sessionsdoket tasks/sessions/2026-08-11-session-105.md bokför TOLV landningar samma dag, hög samtidig aktivitet).
2. Om självförvållad: överväg om post-merge-sviten behöver en mutex/kö mot staging (jämför TASK-77/TASK-78s redan kända gränser för dagens mutex).
3. Om plattforms-instabilitet: detta är per definition icke-blockerande brus för post-merge-grinden — överväg samma typ av signalvärdes-varning som TASK-205 § REVIDERAD NÄSTA-STEG punkt 4.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
