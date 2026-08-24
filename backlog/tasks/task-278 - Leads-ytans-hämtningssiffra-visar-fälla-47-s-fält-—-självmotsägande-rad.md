---
id: TASK-278
title: 'Leads-ytans hämtningssiffra visar fälla 47:s fält — självmotsägande rad'
status: Done
assignee: []
created_date: '2026-08-19 09:24'
updated_date: '2026-08-24 13:06'
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
- [x] #1 get-leads mappar antalHamtningar från 'Totalt antal hämtningar (erbjudande)', inte från 'Antal hämtningar'
- [x] #2 allaHamtningar och get-person (singular) korsundersökta för samma felklass; utfall bokfört i kortet oavsett om ändring behövdes eller ej
- [x] #3 Docblock-citat av mappningen synkade med koden i alla rörda filer (ADR-083-disciplinen)
- [x] #4 Verifierat mot staging eller fixturvärld att en lead med rollup>0 och COUNTA=0 nu visar ett värde > 0
- [x] #5 Ingen ändring av basens fält eller formler
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #2 korsundersökning (2026-08-19):

1) allaHamtningar ('Alla hämtningar', get-leads OCH get-person) — INTE samma felklass. Fältet är en rollup DIREKT över Touchpoints (rålogget), samma länk fälla 50 dokumenterar — fälla 47:s egen text bekräftar det (Sofia Isaksson: 'Alla hämtningar bär alla tre med datum'). Ingen ändring behövdes.

2) get-person (singular, PersonDetail) — BÄR SAMMA felklass (antalHamtningar: asNumber(f['Antal hämtningar']), fälla 47/COUNTA(Engagemang)) men MEDVETET LÄMNAT ORÖRT: fältet renderas ingenstans i PersonDetail.tsx (grep bekräftar noll konsumenter) — jämförelse-blocket som en gång visade det revs redan 2026-08-10 av precis detta skäl (se PersonDetail.tsx rad ~1462-1476). fixture-data.ts § RIK_DETALJ dokumenterar samma mismatch ('antalHamtningar: 1 mot tre poster i allaHamtningar') uttryckligen som 'basens verkliga inkonsistens... inte ett slarvfel'. Alltså: ingen synlig självmotsägande rad på den ytan idag, till skillnad från Intresserade-vyn. Rotorsaksfixen (T16, basens formel) löser båda samtidigt; att duplicera den kosmetiska fixen i get-person utan en renderande konsument bedömdes vara scope-expansion utan mätbar nytta (ADR-053-triage: blockerar ej, lågvärde eftersom fältet är dött i UI:t idag) — dokumenterat, inte tyst förkastat.

AC #4 staging-belägg: zz-lead-person-01/02 (T146, nu fixat parallellt) har Totalt antal hämtningar (erbjudande)=1 = Antal hämtningar=1 — diskriminerar INTE mellan gammal/ny mappning. Verklig diskriminerande post hittad i staging: Sofia Isaksson (recxF88ZKUbP9JUs1) — Totalt antal hämtningar (erbjudande)=3, Antal hämtningar (COUNTA)=0 (har dock anmälningar, är alltså inte en 'lead' per LEAD_FILTER just nu). Ingen post i staging matchar alla tre LEAD_FILTER-villkor (rollup>0 ∧ COUNTA=0 ∧ 0 anmälningar) just nu — bokfört öppet, inte dolt.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1621 (fix/task-278-antalhamtningar-mapping) MERGED 2026-08-19T10:00:15Z, samtliga checks SUCCESS (gh pr view 1621). Tråd T147 (staging saknar fixtur av rätt klass) medvetet lämnad ACTIVE — bokförd egen deferral, blockerar inte detta kort. Filer i PR uteslutande leads/person-domänen. Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
