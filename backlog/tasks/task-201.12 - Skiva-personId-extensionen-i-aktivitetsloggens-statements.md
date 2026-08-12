---
id: TASK-201.12
title: 'Skiva: personId-extensionen i aktivitetsloggens statements'
status: To Do
assignee: []
created_date: '2026-08-12 20:11'
updated_date: '2026-08-12 20:13'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.4
parent_task_id: TASK-201
ordinal: 380000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: TASK-201.6 byggde navigeringsmekaniken 'klicka en aktivitetspost → gå till personen eller eventet' i AktivitetsHistorik.tsx, men person-halvan är strukturellt omöjlig att aktivera — ingen skiva emitterar någon person-identifierande extension i context.extensions. Denna skiva stänger gapet: en PERSON_ID_EXTENSION_IRI analog med TASK-201.4s EVENT_ID_EXTENSION_IRI, emitterad av varje mutation som har en GENUIN person i sitt sammanhang (aldrig ett tomt/påhittat värde när personen saknas — frånvaro är ett giltigt tillstånd).

Källmärkt bakgrund: TASK-201.6-agentens implementation notes (verbatim i sak): 'Person-navigering är INTE byggd alls: ingen mutation/statement-typ sätter någon person-identifierande extension ännu.' Marcus beslut 2026-08-12: 'Ordentligt är det enda som gäller' — gapet ska byggas bort, inte bokföras vidare.

Täcker användarberättelse 8 (PRD TASK-201): 'Som Lotta vill jag klicka på en post och komma till personen eller eventet det gällde, så att jag kan agera direkt på det jag hittar.'

KÄND DIVERGENS VID BYGGSTART (premiss-pass, källmärkt): TASK-201.6 (PR #1231) hade INTE landat på origin/main vid denna skivas basering (verifierat: git log origin/main visar 7e74c94b som senaste commit, gh pr view 1231 visar state OPEN, mergeStateStatus BLOCKED). AktivitetsHistorik.tsx existerar därmed INTE på denna skivas bas. Bygget genomförs mot den verkliga vyn OM 201.6 hunnit landa innan denna skiva slutförs (ff + bygg vidare, uppdragets egen fallback-instruktion); annars levereras schema+emission+läsväg fullt ut och vy-kopplingen bokförs öppet som extern-beroende skuld i implementation notes, aldrig tyst.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PERSON_ID_EXTENSION_IRI definierad i src/domain/schemas/ActivityStatement.schema.ts, analog konstruktion med EVENT_ID_EXTENSION_IRI (TASK-201.4/201.5-mönstret), exporterad via index.ts-barreln
- [ ] #2 recordActivity() bär personId villkorligt i context.extensions under rätt IRI-nyckel — bevisat i BÅDA riktningar (personId satt → buret; personId utelämnat → nyckeln saknas helt, aldrig tom sträng/undefined-värde)
- [ ] #3 Mutationskatalogen VERIFIERAD mot faktisk kod (ADR-086: mät, anta inte) — varje mutation med en genuin person i sammanhanget emitterar personId, varje mutation utan person emitterar den INTE (ingen fabricerad IRI för en obefintlig konsument); utfallet per mutation redovisas explicit i implementation notes
- [ ] #4 get-activity-log-EF:en verifierad att returnera extensionen oförändrad i statement-blobben — ändring görs ENDAST om mätning visar att den behövs, annars redovisas verifieringen öppet
- [ ] #5 AktivitetsHistorik.tsx (TASK-201.6) kopplas till personId-navigeringen OM 201.6 landat på main innan denna skiva slutförs; annars bokförs kopplingen öppet som blockerad extern-beroende skuld (PR #1231), aldrig tyst bortglömd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
