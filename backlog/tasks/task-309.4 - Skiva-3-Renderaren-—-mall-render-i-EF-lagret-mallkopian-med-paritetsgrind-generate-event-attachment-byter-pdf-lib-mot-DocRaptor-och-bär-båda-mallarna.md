---
id: TASK-309.4
title: >-
  Skiva 3: Renderaren — mall-render i EF-lagret, mallkopian med paritetsgrind,
  generate-event-attachment byter pdf-lib mot DocRaptor och bär båda mallarna
status: Done
assignee: []
created_date: '2026-08-23 14:12'
updated_date: '2026-08-24 17:03'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.1
  - TASK-309.2
parent_task_id: TASK-309
ordinal: 565000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En renderare i EF-lagret gör varje mall till PDF ur de Marcus-granskade förlagorna, och 'Skapa' får en skarp server-väg som sparar filen på eventet med en hash av det underlag den byggdes från. Efter skivan finns en produktionsduglig EF som kan skapa båda bilagorna för ett riktigt event i staging. Kräver DocRaptor-nyckeln i staging-secret för skarp mätning (Marcus sätter den; tills dess platshållarnyckeln = vattenstämplat testläge, vilket räcker för alla AC). Täcker användarberättelser: 7, 8, 12, 13, 25, 27, 32.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Delad modul renderaMallPdf(mall, data, { test }) i EF-lagret: läser bundlade mallfiler per skiva 0:s valda väg, fyller i med Eta (autoEscape explicit på, aldrig rå-utskrift av Airtable-text), gör HTML:en självbärande i Deno utan DOM, anropar DocRaptor synkront med test-flagga ur ENVIRONMENT och en retry på 5xx/timeout; enhetstest av ifyllnad + escaping (api-pure) utan nätverk
- [x] #2 Synk-skript kopierar förlagans html/css och de sex fria typsnitten byte-identiskt till _shared/mallar; CI-grind check-mallparitet fäller på varje byte som skiljer; grindens testsvit prövar båda riktningar; grinden wirad i ci.yml
- [x] #3 generate-event-attachment tar mall ('bekraftelse' | 'deltagarinfo'), läser ifyllnadsunderlaget (skiva 1:s läsväg), renderar via renderaMallPdf; preview-grenen lägger utkast (ADR-124) och returnerar { url, utgar }; persisterande grenen lägger filen under eventets prefix, skriver Bilagor-rad med Dokumentklass Event-mallad, Mall och Källhash (SHA-256 över kanoniskt serialiserat underlag), rensar utkast; ersatt-läge uppdaterar samma rad och ersätter filen; all pdf-lib-kod i EF:en riven
- [x] #4 Staging-tester: PDF i Storage med sökbar åäö-text och inbäddat typsnitt (samma kontroller som minimaltestet 2026-08-22), Bilagor-rad med Mall + Källhash, utkast rensat, ersatt-läge ger samma attachmentId; vattenstämpel förväntad i staging (test: true)
- [x] #5 test-docraptor-render riven ur repot, allowlist-policyn och testerna; dess mätinstrument-roll övertagen av preview-grenen
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
Skiva 3 levererade renderaren i EF-lagret. `_shared/mall-render.ts`: renderaMallPdf(mall, data, { test }) läser bundlade mallfiler enligt skiva 0:s valda väg (TS-strängmoduler — `static_files` fallerade i API-bundling), fyller i med Eta med autoEscape explicit på, gör HTML:en självbärande i Deno utan DOM och anropar DocRaptor synkront med test-flagga ur ENVIRONMENT plus en retry på 5xx/timeout. Mallkopian synkas byte-identiskt ur de Marcus-granskade förlagorna av `scripts/synka-bilagemallar.mjs`, och paritetsgrinden `scripts/check-mallparitet.sh` fäller på varje avvikande byte — grinden är wirad i ci.yml och har tvåsidig testsvit (`scripts/test-check-mallparitet.sh`). generate-event-attachment tar mall (bekraftelse | deltagarinfo), läser skiva 1:s ifyllnadsunderlag och renderar via renderaMallPdf: preview-grenen lägger utkast per ADR-124, persisterande grenen lägger filen under eventets prefix och skriver Bilagor-rad med Dokumentklass Event-mallad, Mall och Källhash (SHA-256 över kanoniskt serialiserat underlag); ersatt-läget uppdaterar samma rad. All pdf-lib-kod riven ur EF:en.

BARS AV: PR #1877, commit 10f006b6 (MERGED 2026-08-23T17:23Z, 48 filer).
GRIND-UTFALL: 11 CheckRuns SUCCESS + 3 SKIPPED + Vercel SUCCESS på exakt 10f006b6 — noll icke-gröna. Landad via merge-kön.

AC #5 verifierat 2026-08-24: `test-docraptor-render` är RIVEN — EF-katalogen finns inte under supabase/functions/, testfilen är borta, och `supabase/config.toml` rad 141 bär den explicita RIVET-markeringen med hänvisning till ADR-125 § Beslut 5 (mätinstrument-rollen övertagen av preview-grenen). Kvarvarande träffar på namnet i repot är historiska kommentarsreferenser i andra filer, inte funktionen.

DoD-belägg: #1 fem av fem AC bockade · #2 CI-jobben "Lint + Audit + TypeCheck" och "Test suite / Pure + Build" SUCCESS på exakt 10f006b6 (supermängd av de lokala grindarna) · #3 rollupen ovan · #4 48 filer, samtliga inom skivans scope (mall-render, mallmoduler, förlagor, paritetsgrind, EF:er, tester, kortet) · #5 diffen bär noll prod-schemaoperationer; prod-schemat skapades först i TASK-309.9 efter Marcus GO (commit 2290fa8f) · #6 ingen HTML byggs i klienten — renderingen bor helt i EF-lagret; lagervakten `tests/api/attachment-layer-independence.test.ts` mätt 2026-08-24: 7/7 gröna, exit 0, inklusive tvåvägsbevis.

Stängd av orkestrerad stängningsagent 2026-08-24 mot post-merge-bevis.
<!-- SECTION:FINAL_SUMMARY:END -->
