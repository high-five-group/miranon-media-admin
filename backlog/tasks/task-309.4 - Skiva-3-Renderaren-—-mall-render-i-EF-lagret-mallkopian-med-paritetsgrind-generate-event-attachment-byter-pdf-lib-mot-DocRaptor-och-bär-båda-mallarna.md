---
id: TASK-309.4
title: >-
  Skiva 3: Renderaren — mall-render i EF-lagret, mallkopian med paritetsgrind,
  generate-event-attachment byter pdf-lib mot DocRaptor och bär båda mallarna
status: To Do
assignee: []
created_date: '2026-08-23 14:12'
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
- [ ] #1 Delad modul renderaMallPdf(mall, data, { test }) i EF-lagret: läser bundlade mallfiler per skiva 0:s valda väg, fyller i med Eta (autoEscape explicit på, aldrig rå-utskrift av Airtable-text), gör HTML:en självbärande i Deno utan DOM, anropar DocRaptor synkront med test-flagga ur ENVIRONMENT och en retry på 5xx/timeout; enhetstest av ifyllnad + escaping (api-pure) utan nätverk
- [ ] #2 Synk-skript kopierar förlagans html/css och de sex fria typsnitten byte-identiskt till _shared/mallar; CI-grind check-mallparitet fäller på varje byte som skiljer; grindens testsvit prövar båda riktningar; grinden wirad i ci.yml
- [ ] #3 generate-event-attachment tar mall ('bekraftelse' | 'deltagarinfo'), läser ifyllnadsunderlaget (skiva 1:s läsväg), renderar via renderaMallPdf; preview-grenen lägger utkast (ADR-124) och returnerar { url, utgar }; persisterande grenen lägger filen under eventets prefix, skriver Bilagor-rad med Dokumentklass Event-mallad, Mall och Källhash (SHA-256 över kanoniskt serialiserat underlag), rensar utkast; ersatt-läge uppdaterar samma rad och ersätter filen; all pdf-lib-kod i EF:en riven
- [ ] #4 Staging-tester: PDF i Storage med sökbar åäö-text och inbäddat typsnitt (samma kontroller som minimaltestet 2026-08-22), Bilagor-rad med Mall + Källhash, utkast rensat, ersatt-läge ger samma attachmentId; vattenstämpel förväntad i staging (test: true)
- [ ] #5 test-docraptor-render riven ur repot, allowlist-policyn och testerna; dess mätinstrument-roll övertagen av preview-grenen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
