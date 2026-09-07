---
id: TASK-429
title: >-
  Fynd: Check-in-ingångens onIntent-prefetch i EventDetail är otestbar i
  isolering — sidmount-effekten (416.16 AC #2) värmer samma nyckel ovillkorligt;
  avgör om onIntent på CheckInKort är död kod eller ska bevisas på komponentnivå
status: To Do
assignee: []
created_date: '2026-09-07 16:35'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 757000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: review-runda 1 på PR #2444 (TASK-416.20, 2026-09-07), fynd F1, och byggarens egen upptäckt i tests/acceptance/prefetch-avsikt-regression.acceptance.test.ts § 'EN UPPTÄCKT GRÄNS, BOKFÖRD ÖPPET'. src/components/events/EventDetail.tsx bär två prefetch-vägar för get-attendance: CheckInKort.onIntent={varmNarvaro} (rad ~320) och en ovillkorlig sidmount-useEffect (rad ~169–171, TASK-416.16 AC #2). React Querys dedup gör att mount-effekten alltid hinner före en hover, så test A i 416.20 blir grönt även när enbart onIntent tas bort (mätt av byggaren) och rött först när båda kopplas bort. Konsekvens: en isolerad regression som tar bort onIntent fångas inte. Marcus 2026-09-07 ('OK 2444'): PR:en landar med gapet bokfört; frågan avgörs här. Alternativ: (a) komponent-/unit-test som isolerar onIntent (renderar CheckInKort utan EventDetail:s mount-effekt och asserterar prefetchQuery på hover/fokus); (b) medveten rivning av onIntent på CheckInKort med motivering i 416.16:s notes (mount-effekten täcker redan det event Lotta står på). Bilagornas två mekanismer (hover i EventDetail, sidmount i AtgardsSida) är oberoende och redan bevisade — rörs inte.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beslut a eller b bokfört i notes med motivering; vid (a) finns ett komponenttest som blir rött när onIntent tas bort och grönt annars (tvåsidigt bevisat); vid (b) är onIntent borttaget och 416.20:s docblock uppdaterad
- [ ] #2 Acceptance-klassen och hermetik-självtestet gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
