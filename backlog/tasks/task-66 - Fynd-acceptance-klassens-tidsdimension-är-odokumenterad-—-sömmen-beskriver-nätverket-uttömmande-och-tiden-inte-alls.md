---
id: TASK-66
title: >-
  Fynd: acceptance-klassens tidsdimension är odokumenterad — sömmen beskriver
  nätverket uttömmande och tiden inte alls
status: To Do
assignee: []
created_date: '2026-07-28 12:48'
updated_date: '2026-07-28 15:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-62
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 4, byggagentens slutsats efter att ha skrivit ett test från noll): tests/acceptance/support/acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN beskriver nätverksmekaniken uttömmande — normalläget, network.use(), EF()/json(), den tysta fällan, precedensen mellan page.route och MSW. Den säger ingenting om TID.

Att felytor i denna app kostar ~8-10 s att nå på grund av två lager retry (fetchWithRetry 4 försök + QueryClient retry: 3) finns bara som per-fil-kommentarer — event-anteckningar:243 och mer-vantelista:147 — och de säger olika saker.

KONKRET FELVÄG SOM REDAN FINNS: mer-vantelista rad 148-149 skriver '5xx vore fel testval — då retryar react-query korrekt och alerten dröjer förbi timeouten'. Det gäller den filens komponent, inte generellt, men läses lätt som en allmän regel. En nykomling med ett 5xx-uppdrag ser en rad som verkar förbjuda uppdraget.

FÖRVÄNTAT BETEENDE: en rad i acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN om att felytor bakom retrykedjan kräver räknad timeout, med pekare till var kedjan bor (src/data/utils.ts + src/router.ts). Det är den enda fil en nykomling garanterat läser.

VARFÖR DET ÄR VÄRT EN RAD: klassen är annars ovanligt väldokumenterad, och den dokumentationen betalade sig — samma agent gick inte i någon av de tre nätverksfällor som stod utskrivna. Tidsfällan var den enda som inte stod någonstans centralt, och den var också den enda agenten faktiskt var på väg in i.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 acceptance-bas.ts § SKRIVA ETT TEST I KLASSEN bär en rad om retrykedjans tidskostnad med pekare till källan
- [ ] #2 mer-vantelista rad 148-149 är omformulerad så den inte läses som en allmän regel om 5xx
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
