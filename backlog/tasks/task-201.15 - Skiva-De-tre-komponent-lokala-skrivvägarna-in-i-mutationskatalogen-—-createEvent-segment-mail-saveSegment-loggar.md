---
id: TASK-201.15
title: >-
  Skiva: De tre komponent-lokala skrivvägarna in i mutationskatalogen —
  createEvent, segment-mail, saveSegment loggar
status: To Do
assignee: []
created_date: '2026-08-14 18:29'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-201
ordinal: 399000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus GO 2026-08-14 (S105 Del 9, verbatim: 'INGA genvägar, inga luckor, ingen symptombehandling'). Explore-svepet fann tre useMutation-anrop UTANFÖR src/data/mutations/ som skriver data utan recordActivity: src/components/event/CreateEventForm.tsx:122 (dataSource.createEvent), src/components/segment/SegmentMailCompose.tsx:74 (dataSource.sendEmail), src/components/segment/SegmentBuilder.tsx:91 (dataSource.saveSegment).

ROTORSAKEN är hemvisten, inte bara den saknade loggningen: TASK-201.13:s mekaniska invariant ('varje exporterad mutationshook loggar', mätt 15/15) är mapp-scopad och kan per konstruktion inte se komponent-lokala mutationer. Fixen är EXTRAKTION till katalogen + instrumentering + en mekanisk grind som gör att klassen inte kan återuppstå.

FEATURE-doken (docs/features/FEATURE-ACTIVITY-LOG.md:43-44) kräver loggning för 'Skapa event' och 'skicka manuellt mail'; segment-spar saknas i dess kategoritabell men omfattas av PRD-berättelse 1 ('allt jag gör som ändrar något loggas') — Marcus GO täcker alla tre.

ABSOLUT MAILFÖRBUD: segment-mail-vägen utlöses ALDRIG skarpt; all verifiering mot fixturvärld (MSW).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De tre mutationerna extraherade till src/data/mutations/*.ts som exporterade hooks enligt katalogens etablerade mönster (onSuccess-instrumentering, obligatorisk queryClient-DI per TASK-210, void recordActivity fire-and-forget); komponenterna konsumerar hookarna; beteendet i övrigt oförändrat, bevisat av befintliga sviter
- [ ] #2 Verb/objekt-design motiverad i kod + kort: skapa event (objekt = eventet), segment-mail (bulk-precedenten från useSendActionEmail/TASK-201.13 AC #2: en post per faktiskt sänd mottagare, prövad mot EF-kontraktets FAKTISKA svar — läs koden, anta inte), spara segment (ny objektkategori mintas ENDAST om objektmodellen kräver det, motiveras öppet)
- [ ] #3 Ingen fritext läcker: segment-mailets ämne/innehåll finns aldrig som binding i onSuccess-scopet — payload-nivå-bevis genom den RIKTIGA hooken + fällningsbevis (injicerad läcka fäller)
- [ ] #4 Tvåsidigt bevis per instrumentering: post skapas vid lyckad mutation, INGEN post vid fallen — acceptance-nivå genom levande UI där UI finns
- [ ] #5 Mekanisk grind: gatekeeper-test som fäller varje useMutation utanför src/data/mutations/ — allowlist config-driven per repo-konvention (.conf-fil; prototyp-filer undantagna med skäl), tvåsidigt bevisad (injicerad överträdelse fäller, återställd bit-identiskt)
- [ ] #6 Mutationskatalogen mätt EFTER ändringen: noll differens exporterade hooks/recordActivity-anropsplatser (förväntat 18/18), kommandon bokförda i notes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
