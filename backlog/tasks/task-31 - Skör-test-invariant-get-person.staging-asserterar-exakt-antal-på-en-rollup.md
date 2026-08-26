---
id: TASK-31
title: 'Skör test-invariant: get-person.staging asserterar exakt antal på en rollup'
status: To Do
assignee: []
created_date: '2026-07-22 19:02'
updated_date: '2026-08-26 03:15'
labels:
  - ready-for-agent
dependencies: []
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur S75 batch 3 (task-18.4:s bygg-agent, fångat live).

SYMPTOM: tests/api/get-person.staging.test.ts asserterar 'expect(person.ort).toHaveLength(2)' — en ABSOLUT räkning på ett ROLLUP-fält över Anmälningar. Vilken framtida skiva som helst som länkar en ny anmälan till ZZ-History-personen bryter testet, utan att något faktiskt är fel.

FÅNGAT LIVE: 18.4:s fixtur-seedning länkade först sin anmälan till 'ZZ-History Person 01'. Personer.Ort-rollupen växte då till tre element och hade fällt testet. Länken togs bort omedelbart, rollupen verifierades återställd till två, och en EGEN person (ZZ-Arbetsko Person 01) seedades i stället — men fällan står kvar för nästa kort.

FÖRVÄNTAT: en invariant formulerad som 'innehåller båda orterna' i stället för 'är exakt 2'. Robust mot additiv fixtur-tillväxt, bevarar testets faktiska avsikt.

BREDARE KLASS: värt att svepa efter fler absoluta räkningar på rollups/länkfält i api-sviten.

Oetiketterat per fynd-regeln — människan klassar.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FIXAT (S112 fix-våg 4, bunt B1). Premiss-pass (ADR-086): git fetch origin →
tests/api/get-person.staging.test.ts verifierad oförändrad i sak sedan
kortet skrevs — exakt assertionerna kortet beskriver stod kvar orörda på
rad 219-220 (get-person) och rad 239 (get-persons/search), båda
toHaveLength(2) + toEqual([...].sort()) mot samma EXPECTED_ORTER. Ingen
divergens mot kortets premiss.

FIX (rotorsak, ej sänkt krav): båda assertionerna ändrade från exakt
längd+exakt sorterad likhet till expect(person.ort).toEqual(expect.
arrayContaining(EXPECTED_ORTER)) — bevisar att BÅDA orterna finns
representerade, robust mot att rollupen växer additivt av en framtida
skivas seedning (exakt den klass av fällning kortet dokumenterar från
S75 batch 3).

BREDARE SVEP (kortets "värt att svepa"-not): grep efter toHaveLength i
hela tests/api/*.staging.test.ts. Övriga träffar (get-person.staging.
test.ts:74 historik, create-attendance/get-document-sources/save-event-*)
är antingen skrivningens EGET svar (createdIds/deletedIds — testet
kontrollerar sin egen mutation, ingen delad fixtur) eller en MEDVETET
kontrollerad, icke-additiv fixtur (historik/antalGenomfordaEvent: 3 exakta,
namngivna Deltaganden-poster som INTE växer av att en Anmälan länkas —
skild risk-yta från Ort-rollupen). Ingen av dem rörd — samma
additiv-tillväxt-risk gäller inte dem.

VERIFIERAT LIVE mot staging: npm run test:api → båda de ändrade testerna
gröna (get-person.staging.test.ts:218 + :231), 1179/1179 passed totalt,
exit 0. typecheck/biome/build gröna. Fil rör inte src/ → check-langa-
streck.mjs ej tillämplig (scopead till src/).
<!-- SECTION:NOTES:END -->
