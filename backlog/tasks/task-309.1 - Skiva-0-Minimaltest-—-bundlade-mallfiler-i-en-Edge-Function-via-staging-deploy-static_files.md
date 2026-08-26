---
id: TASK-309.1
title: >-
  Skiva 0: Minimaltest — bundlade mallfiler i en Edge Function via
  staging-deploy (static_files)
status: Done
assignee: []
created_date: '2026-08-23 13:56'
updated_date: '2026-08-24 17:02'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 562000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repots disciplin: nytt approach testas minimalt innan full implementation. ADR-125 § 4 sätter static_files som primär bundlingsväg men maskinen saknar Docker, så deployen går via CLI:ts API-bundling där static_files-stödet är obelagt. Skivan deployar en kastbar EF till staging som läser en delad mallfil och ett typsnitt ur _shared/mallar-katalogen och returnerar byte-längder; mäter skarpt; bokför utfallet. Faller primärvägen prövas fallback-stegen i ADR-125 § 4 i ordning. Täcker användarberättelser: 25, 32.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En minimal staging-EF deployad med static_files-glob mot en delad _shared-katalog läser en HTML- och en TTF-fil skarpt (bytes + storlek verifierade i svaret), via samma deploy-väg som repot använder (CLI utan Docker = API-bundling)
- [x] #2 Utfallet (fungerar / fungerar inte, verbatim CLI-utdata) bokfört i ADR-125 § Updates; om det fallerar: fallback (b) text-import prövad på samma sätt, och vald väg bokförd
- [x] #3 Minimaltestets EF rivs efter mätningen eller bokförs som staging-only testharness i allowlist-policyn — aldrig kvar omärkt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Skiva 0 levererade minimaltestet som AVGJORDE bundlingsvägen för mallfiler i Edge Functions: `static_files` FALLERAR via CLI:ts API-bundling (maskinen saknar Docker), medan TS-strängmoduler fungerar. Utfallet bokfört i ADR-125 § Updates och valt som väg för skiva 3.

BARS AV: PR #1867, commit 32806b96 (MERGED 2026-08-23T15:01Z, 9 filer).
GRIND-UTFALL på den commiten: 11 CheckRuns SUCCESS + 3 SKIPPED + Vercel StatusContext SUCCESS — noll icke-gröna. Landad via merge-kön.

AC #3 ("aldrig kvar omärkt"), verifierat 2026-08-24: minimaltestets EF `test-static-files` är KVAR som STAGING-ONLY testharness, explicit märkt i `supabase/config.toml` § [functions.test-static-files] med TASK-309.1-referens, och MEDVETET utelämnad ur `.prod-functions-allowlist.conf` (test-auth-precedenten — allowlisten är fail-closed och bär raden "test-* saknas fortsatt MEDVETET"). DIVERGENS I BÄRARE, ej i sak: AC-texten pekar på allowlist-policyn, den faktiska bokföringen bor i config.toml plus allowlistens generella test-*-regel.

DoD-belägg: #1 tre av tre AC bockade · #2 CI-jobben "Lint + Audit + TypeCheck" och "Test suite / Pure + Build" SUCCESS på exakt 32806b96 (supermängd av de lokala grindarna) · #3 rollupen ovan · #4 nio filer, samtliga inom skivans scope (EF, mallfiler, ADR-125, staging-test, kortet) · #5 diffen bär noll prod-schemaoperationer; prod-schemat skapades först i TASK-309.9 efter Marcus GO (commit 2290fa8f) · #6 diffen rör ingen klientfil, och lagervakten `tests/api/attachment-layer-independence.test.ts` mätt grön 7/7 exit 0 (2026-08-24).

Stängd av orkestrerad stängningsagent 2026-08-24 mot post-merge-bevis.
<!-- SECTION:FINAL_SUMMARY:END -->
