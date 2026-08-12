---
id: TASK-201.3
title: 'Skiva: Tracer bullet — recordActivity, log-activity-EF, tre pilotmutationer'
status: Done
assignee: []
created_date: '2026-08-11 20:22'
updated_date: '2026-08-12 18:54'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.2
parent_task_id: TASK-201
ordinal: 368000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: FÖRSTA hela vertikalen genom alla lager — ett klick i staging-appen (markera betalning / bekräfta / skicka mail) blir en validerad, korrelerad rad i activity_log. Piloten avtäcker mönstret (EF-form, requestId-väg, fire-and-forget-semantiken) innan den mekaniska utrullningen i nästa skiva. Skrivvägs-förebild: kvitto-EF:ns mönster (ADR-109-landningen).

Täcker användarberättelser: 1, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 recordActivity-modulen (klientsidan av datalagret, via adaptern) bygger Zod-validerade statements och postar till log-activity-EF; fire-and-forget — en fallerad loggning fäller ALDRIG Lottas mutation (api-test bevisar båda riktningarna)
- [x] #2 log-activity-EF validerar inkommande statement med SAMMA Zod-schema server-side (ogiltigt → 4xx, skrivs aldrig), skriver via service-role, uppfyller EF-ribban (SECURITY-SPEC §6.10)
- [x] #3 requestId propageras klient → EF → activity_log-rad — api-staging-test läser tillbaka raden och jämför mot klientens requestId (byggplanens DoD 3)
- [x] #4 Tre pilotmutationer instrumenterade via onSuccess: markera betalning, bekräfta anmälan, mail-åtgärd; e2e-staging-test utför en åtgärd och verifierar rad med rätt aktör, typ och tid
- [x] #5 Sammanfattningar på Lotta-språket (Gunilla-principen), formen "Lotta markerade betalning — Anna Andersson (Fjärrskådning 2)"; IRI-verb under huven
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
- [x] #6 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Byggd (S105 forts., TASK-201.3). Tracer bullet genom alla lager: recordActivity (src/data/activityLog/recordActivity.ts, fire-and-forget via try/catch, aldrig kastar) + activityTypes.ts (verb/objekt-IRIer for de tre pilotmutationerna) + DataSourceAdapter.recordActivity (implementerad identiskt i AirtableAdapter och SupabaseAdapter, activity_log ligger redan helt utanfor Airtable) + log-activity-EF (requireUser -> Zod-validering mot en Deno-sidans schema-spegel, _shared/activity-statement-schema.ts, MEDVETEN duplicering pga inget import_map-mekanism finns i repot -> identitetsbindning actor.account.name matchar JWT annars 403 -> server-side namn-attribution ADR-075-monstret -> insert via service_role -> svar id/requestId/occurredAt) + tre pilotmutationer instrumenterade via onSuccess (useSetPaymentStatus, useSendConfirmationFromDetail, useSendActionEmail). DEPLOY: log-activity deployad till staging ENDAST den funktionen, verifierat lankad mot pqtshyierkdgwdnxuirz aldrig prod. GRINDAR: typecheck 0, biome 0, build 0, test:api 676 grona / 1 kand flake attachment-upload-large.staging.test.ts TASK-196s isolerat gron 15/15 verifierat. 18 nya committade api-tester, samtliga rott-forst bevisade. e2e: 3 nya tester i atgarder-betalningar + 1 utokning av atgarder-bekraftelsemail, rott-forst bevisade mot en EGEN dev-server i worktreen port 5183. KALLMARKT AVVIKELSE: AC 3 kraver skarpt write+readback-bevis, en permanent testrad per korning, flaggat i slutrapport. KAND GAP: bekrafta anmalan-piloten saknar egen e2e-tackning, AnmalanDetail.tsx har noll mock-infrastruktur, ersatt med pure statement-test. KOORDINERINGSSKULD FRAN TASK-201.5: EVENT_ID_EXTENSION_IRI deferrad till TASK-201.4 per orkestrerarens erbjudna vag ut, ingen av mina AC namner den, context.extensions ar medvetet oppen for framtida tillagg.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat via PR #1216 (mergad main e4a110bc, 2026-08-12T18:17:37Z). Levererade: recordActivity (src/data/activityLog/recordActivity.ts, fire-and-forget, aldrig kastar), activityTypes.ts, DataSourceAdapter.recordActivity (AirtableAdapter+SupabaseAdapter), log-activity-EF (requireUser, Zod-validering server-side mot Deno-spegelschema, service_role-insert), tre pilotmutationer instrumenterade (useSetPaymentStatus, useSendConfirmationFromDetail, useSendActionEmail). 18 nya committade api-tester (rött-först), 3 nya e2e-tester + 1 utökning. Deploy: log-activity till staging (pqtshyierkdgwdnxuirz), aldrig prod. Två röd-varv lösta under bygget (check-langa-streck på loggmeddelande, hermetik-vakten via central log-activity-fixture-handler, acceptance 189/7 → 197/0). Stängningsverifiering (denna agent, 2026-08-12): CI per jobb på PR #1216 via 'gh pr checks 1216' — samtliga jobb pass (Analyze x2, CI Passed or Skipped, CodeQL, Detect changed files, Docs link check, Lint+Audit+TypeCheck, Test suite/Acceptance, Test suite/Pure+Build, Test suite/Webblasarbeteende, Vercel), A11y/Staging/Staging-sentinel-purge skipping (normalt), noll fail. Post-merge-sviten (icke-blockerande safety-net, ej required check) på merge-SHA e4a110bc (run 31626912755) var ÄVEN DEN grön — inget att bokföra. KOORDINERINGSSKULD ÖVERFÖRD (ej ouppfylld på detta kort): EVENT_ID_EXTENSION_IRI emitteras inte än av denna skivas write-väg — övertagen av TASK-201.4 via PR #1218 (mergad 6195f8d2, chore(backlog) [TASK-201.4] två skulder överförda från 201.3), verifierat mergat till main. KÄND GAP kvarstår öppet (ej dolt): bekräfta anmälan-piloten saknar egen e2e-täckning (AnmalanDetail.tsx har noll mock-infrastruktur), ersatt med pure statement-test — bokfört, ej löst av denna skiva. Diff-scope e4a110bc: samtliga rörda filer hör till tracer bullet-vertikalen — inga orelaterade.
<!-- SECTION:FINAL_SUMMARY:END -->
