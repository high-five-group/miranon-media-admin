---
id: TASK-464.14
title: >-
  Skiva: efterkontrollens körordning — 'kör senaste, hoppa mellanliggande' (fast
  concurrency-grupp) + spannet räknas från senast AVSLUTADE körning
status: To Do
assignee: []
created_date: '2026-09-19 10:57'
labels:
  - ready-for-agent
dependencies:
  - TASK-464.6
parent_task_id: TASK-464
priority: high
ordinal: 836000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beslut 6b (S126, 2026-09-19): INGEN klocka — researchen docs/research/efterkontroll-pa-klocka-2026-09-19.md fällde hypotesen (sex branschledare utlöser efterkontrollen av händelsen 'kod landade'; GitHubs egen dokumentation säger att schedule kan fördröjas eller utebli under last). Bygg i stället researchens väg 3, BÅDA delarna i SAMMA PR: (1) post-merge.yml:s concurrency-grupp byts från per-SHA till en FAST nyckel, så GitHubs inbyggda kö kör den senaste väntande och hoppar mellanliggande (mätt problem 2026-09-19 09:50Z: tre kodlandningar inom en minut ⇒ den tredjes efterkontroll startade 31 min senare och alla tre betalade fullt pris); (2) scripts/classify-post-merge.sh räknar SAMTIDIGT sitt spann från SHA:t för den senast FAKTISKT AVSLUTADE post-merge-körningen (Actions-API), inte från github.event.before — görs (1) utan (2) återinförs tyst det hål N3 (TASK-450.2) stängde: en hoppad mellanliggande landnings kod hade aldrig klassats. Fail-closed: går den senast avslutade körningen inte att fastställa ⇒ kör sviten och klassa hela det kända spannet. Researchen säger ÖPPET att exakt denna kombination saknar branschprecedent (egen härledning ur GitHubs primitiv) och att kostnadsöverslaget vilar på två dagars data — räkna om mot en hel månad i PR-kroppen (researchens punkt 6). Bisektion av ett rött multi-landningsspann (väg 4) är EN SENARE post (TASK-480). Rör inte nightly.yml. Källa: S126 Del 17 + Del 18; varje faktapåstående är en HYPOTES tills prövad mot disk (ADR-086). Täcker användarberättelser: 1, 2, 3, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tre landningar tätt efter varandra ger högst TVÅ efterkontroller (en pågående + den senaste), bevisat med run-ID eller workflowens självtest; den mellanliggande står som cancelled/superseded, inte som röd
- [ ] #2 Spannet i den körning som faktiskt går täcker ALLA landningar sedan senast avslutade körning — tvåsidigt bevisat i classify-post-merge-sviten (hoppad mellanliggande kodlandning ⇒ klassas som kod; enbart dokument ⇒ sviten hoppas)
- [ ] #3 Fail-closed bevisat: API-fel eller okänd senaste körning ⇒ sviten kör
- [ ] #4 Larmkedjan (ci-post-merge-ärende, spann i ärendetexten) fungerar oförändrat; ett cancelled/superseded-utfall öppnar INGET larm
- [ ] #5 Kostnadsöverslaget omräknat mot en hel månads data, i båda måtten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 PR-kroppen bär sektionen 'Kostnad i två mått': VÄNTETID och FAKTURERADE MINUTER sida vid sida, mätta körningar med run-ID, enheter utskrivna
<!-- DOD:END -->
