---
id: TASK-278
title: 'Leads-ytans hämtningssiffra visar fälla 47:s fält — självmotsägande rad'
status: To Do
assignee: []
created_date: '2026-08-19 09:24'
labels: []
dependencies: []
ordinal: 504000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljning på `TASK-277`. Den skivan pekade om `get-leads`s `LEAD_FILTER` till
`Totalt antal hämtningar (erbjudande)` (AC #6) men lämnade VISNINGSFÄLTET
orört — medvetet, och öppet bokfört i `get-leads/index.ts` som "öppen kant".

## Defekten

`supabase/functions/get-leads/index.ts` mappar `antalHamtningar` från
`{Antal hämtningar}` — fälla 47:s fält, `COUNTA({Engagemang})`.
`src/components/intresserade/Intresserade.tsx:54` renderar det som
`<Field term="Antal hämtningar" value={String(person.antalHamtningar)} />`.

De 33 leads som `TASK-277` gör synliga bär per definition
`Antal hämtningar = 0` (det var precis därför de var osynliga). Efter
`TASK-277`s landning kommer Intresserade-vyn alltså lista en person **för att
hon hämtat något** och i samma rad påstå att hon hämtat **0** gånger.

Det är inte kosmetiskt. Det är en synlig självmotsägelse på exakt den yta
skivan gör synlig, och den drabbar 33 av raderna — inte ett kantfall.

## Vad som ska göras

Mappa `antalHamtningar` från `Totalt antal hämtningar (erbjudande)`
(`fldd782imiCRtFJ4t`) i stället. Fältet är en rollup direkt över `Touchpoints`
(rålogget) och räknar därmed riktiga hämtningar — se fälla 50 i
`data-model.md`, dokumenterad i `TASK-277`.

Kontrollera samtidigt om `allaHamtningar` (`Alla hämtningar`) bär samma klass
av problem, och om `get-person` (singular) har samma mappning — de tre ytorna
ska säga samma sak om samma person.

## Vad som INTE görs här

Ompekning av `Antal hämtningar`-formeln i basen. Det är rotorsaksfixen (fälla
47 + fälla 50 pekar båda på den, maximerings-kandidat `T16`), det är en
PROD-SCHEMAÄNDRING, och den kräver Marcus uttryckliga GO. Denna skiva lagar
appens läsning, inte basens fält.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-leads mappar antalHamtningar från 'Totalt antal hämtningar (erbjudande)', inte från 'Antal hämtningar'
- [ ] #2 allaHamtningar och get-person (singular) korsundersökta för samma felklass; utfall bokfört i kortet oavsett om ändring behövdes eller ej
- [ ] #3 Docblock-citat av mappningen synkade med koden i alla rörda filer (ADR-083-disciplinen)
- [ ] #4 Verifierat mot staging eller fixturvärld att en lead med rollup>0 och COUNTA=0 nu visar ett värde > 0
- [ ] #5 Ingen ändring av basens fält eller formler
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
