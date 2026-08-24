---
id: TASK-309.15
title: >-
  API-testsvitens kastbara event städas aldrig — 44 skräp-event i staging
  eventväljare
status: To Do
assignee: []
created_date: '2026-08-24 16:37'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 578000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AVTÄCKT under Marcus granskning 2026-08-24, och det var granskningens egen felkälla.

Marcus granskade 'Fjärrskådning - text-deny-tom-body'. Mätt: det är ett kastbart event från API-testsviten. tests/api/save-event-text.staging.test.ts § createThrowawayEvent skapar event: 'Fjärrskådning', typ: 'Utbildning', ort: sentinelOrt(suffix) = 'ZZ-TASK-309.3-text-<suffix>-<uuid>', startdatum 2026-09-15. Startdatumet gör dem till KOMMANDE event, så de hamnar i eventväljaren.

MÄTT I STAGING (Airtable apphjj8Q7lkXCMsL4, 2026-08-24): 44 kvarvarande event med ort-prefixet ZZ-TASK-309.3-text-, samtliga med startdatum 2026-09-15. Det är bara en av flera sentinel-familjer.

ROTORSAK: sviten har ingen teardown. Rad 9 i filen konstaterar att ingen 'återställ ursprungsvärden'-teardown behövs — sant om FÄLTVÄRDEN, men den skapar också EVENT, och de raderas aldrig. .purge-staging-policy.json HAR en target (FIND('ZZ-TASK-309.3-', {Ort}) = 1), men setup-purgen kör FÖRE varje staging-CI-jobb, inte efter. Mellan en testkörning och nästa staging-jobb ligger skräpet kvar och syns för den som öppnar appen mot staging.

KONSEKVENS UTÖVER STÄDNING: en granskare som väljer ett sådant event ser en genereringsvy där varje block är tomt (testeventet har varken Eventinnehåll-data eller Plats-länk), vilket läser som ett designfel i vyn. Det kostade en granskningsrunda.

Marcus 2026-08-24: 'INGET lappande' — en manuell engångsradering är inte fixen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 save-event-text.staging.test.ts och save-event-content.staging.test.ts raderar sina egna kastbara event i teardown (afterAll eller motsvarande), oavsett testutfall
- [ ] #2 Teardown är robust mot krasch: setup-purgen behålls som andra försvarslinje, den ersätts inte
- [ ] #3 De 44 kvarvarande ZZ-TASK-309.3-text-* -eventen i staging är borta efter en körning
- [ ] #4 Övriga sentinel-familjer inventerade: vilka svitar skapar event utan teardown — dokumenterat i kortet, åtgärdat eller öppet bokfört per familj
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
