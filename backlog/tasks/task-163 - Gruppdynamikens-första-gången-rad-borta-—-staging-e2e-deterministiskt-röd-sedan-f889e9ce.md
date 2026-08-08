---
id: TASK-163
title: >-
  Gruppdynamikens 'första gången'-rad borta — staging-e2e deterministiskt röd
  sedan f889e9ce
status: To Do
assignee: []
created_date: '2026-08-08 17:10'
labels:
  - ready-for-agent
dependencies: []
ordinal: 306000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Testet event-detail.staging.test.ts:1614 ('Första eventet: tom kurshistorik ⇒ första gången-raden, ingen kurshistorik-rad') förväntar att Anna Eks personkort innehåller 'första gången hos Miranon Media' men får 'AEAnna EkEj påbörjat'. Deterministiskt: 6 av 6 försök i post-merge-körningarna 31250759317 och 31267199889 (2026-08-08). Tidigare bokförd som ägarlös FLAKE i S93-handoffen — omklassad till stående rött. Spårad (S93 § Paushistorik sjunde pausen) till f889e9ce = S93 iterationsvåg 19 (2026-08-06, 'gruppdynamikens knappform, personkort och en riven dubbelrad' — Marcus-kvitterad designiteration). HYPOTES, prövas av mottagaren (ADR-086): vågen rev/ändrade raden och testet uppdaterades aldrig — dvs test-mot-itererat-facit-divergens, fixen ligger då på TEST-sidan. MEN: diagnostisera FÖRST mot git show f889e9ce (Gruppdynamik.tsx) och vågens commit-body/sessionsdok-Del — säger designintentionen att raden SKA finnas kvar vid tom kurshistorik är det en src-regression. Genuint tvetydigt designval ⇒ STOPPA och rapportera, avgör inte själv. Staging-e2e kan inte köras lokalt (5173-förbudet); post-merge-nätet är grinden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken fastställd mot f889e9ce:s faktiska diff och bokförd i kortet
- [ ] #2 Fix landad (test- eller src-sida enligt diagnosen, aldrig båda på gissning)
- [ ] #3 Testet bevisat grönt i post-merge-körning på main
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
