---
id: TASK-299.11
title: >-
  Skiva: Promovering av sidram till aktivitetshistoriken och dokumentytan — de
  två avvikande dialekt-ytorna
status: To Do
assignee: []
created_date: '2026-08-22 22:46'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 557000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Täckningslucka upptäckt 2026-08-22: skivorna under TASK-299 skars 19:26, FÖRE Marcus omfattningsbeslut, och täcker Mer-familjens fem sidor. PRD:n nämner de två ytor som i dag bär den ANDRA dialekten endast villkorat — 'BERÖRS endast om den bredaste omfattningen väljs'. Marcus valde full omfattning ('jag tycker vi ska köra full omfattning', 2026-08-22), så de är inne, men ingen skiva täckte dem.

YTORNA, namngivna i PRD:ns manifest-lista:
- Aktivitetshistorik-sidan — tasks/sessions/bilagor/s106-aktivitetslogg/facit.json, 2 bilder
- Dokumentytan /mer/anmalningar systeryta /mer/dokument — tasks/sessions/bilagor/s102-dokument-konvergens/facit.json, 5 bilder

BÅDA ÄR FACIT-STÄMPLADE. Det skiljer denna skiva från 299.7/8/9, vars ytor saknar stämpel: här krävs facit-amendering med Marcus citat i EGEN commit, skild från formändringen (ADR-102/103).

OMFATTNINGEN ÄR LÅST OCH SKA INTE TOLKAS OM: full omfattning på ytaxeln, bara SIDKROMET på ägandeskapsaxeln (chevron + kortyta). Rubriken lever kvar i varje sida. SidRam-primitivens rubrik-ägande gren byggs INTE in. Källa: TASK-299 § OMFATTNINGEN LÅST.

BÅDA YTORNA BÄR REDAN DEV-VÄXELN ?sidram=ny från TASK-299.1 (import.meta.env.DEV-grindad, ADR-074 amendering 7-formen). Promoveringen innebär att den valda formen blir permanent och att växeln rivs på just dessa ytor — ADR-103:s promoveringskontrakt: det som rivs efter godkännande är flaggor och växlar, aldrig formen.

MARCUS UNDANTAGSREGEL GÄLLER: 'Ser vi något som inte funkar sedan så är det ju bara att göra ett undantag på den sidan.' Fungerar sidkromet inte på en av dessa två ytor är rätt svar ett lokalt undantag med bokfört skäl — inte att riva den delade formen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Aktivitetshistorik-sidan bär den delade sidramen i sidkrom-omfattning; dess tidigare dialekt är borta
- [ ] #2 Dokumentytan bär den delade sidramen i sidkrom-omfattning; dess tidigare dialekt är borta
- [ ] #3 Dev-växeln ?sidram=ny är riven på BÅDA dessa ytor — formen står kvar utan flagga (ADR-103)
- [ ] #4 Rubrikblocket ägs fortfarande av varje sida; SidRams rubrik-ägande gren är oanvänd
- [ ] #5 Båda ytornas facit-manifest amenderade med daterad post och Marcus citat, i EGEN commit skild från formändringen
- [ ] #6 check-facit grön; ingen yta lämnas med ett manifest som beskriver en form den inte längre bär
- [ ] #7 Inget lokalt undantag infört utan bokfört skäl i kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
