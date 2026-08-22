---
id: TASK-286.7
title: >-
  Skiva: Personsök blir diakritik-tolerant — asa hittar Åsa, likvärdig med
  eventväljarens filter (TASK-286.5 JA)
status: To Do
assignee: []
created_date: '2026-08-22 09:32'
updated_date: '2026-08-22 10:26'
labels:
  - ready-for-agent
dependencies:
  - TASK-286.3
parent_task_id: TASK-286
ordinal: 531000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljning på TASK-286.5 (Marcus JA, 2026-08-22): personsökningen breddas till diakritik-TOLERANT matchning, samma beteende som eventväljaren (React Aria `useFilter({ sensitivity: 'base' })`, `react-aria-components` — `src/components/events/EventValjare.tsx` rad 177).

HUR (kortets ursprungsformulering, task-286.5): byt klientfiltret (`src/lib/person-sok.ts`) till `Intl.Collator('sv', { sensitivity: 'base' })`-baserad matchning ELLER samma `useFilter` som eventväljaren. OBS teknisk kant: `useFilter` är en React-HOOK (måste köras i render) — `person-sok.ts`s funktioner (`personMatcharSokterm`, `filtreraPersonregister`) är rena, icke-komponent-funktioner. Väljs `useFilter`-vägen krävs en omstrukturering (t.ex. `contains` injiceras som parameter från en anropande komponent som själv kört hooken); väljs `Intl.Collator`-vägen måste sensitivity-nivån verifieras likvärdig med vad `useFilter({sensitivity:'base'})` faktiskt ger (forskningen `docs/research/forladdat-personregister-klientsok-branschmonster-2026-08-21.md` som `person-sok.ts`s filhuvud redan citerar är utgångspunkten — ingen ny gissning).

PARITETSTESTETS NYA FACIT (ersätter dagens EF-paritet, se AC #2 för fullständig specifikation).

ADR-uppdatering: beslutet bokförs som en ny post under `## Updates` i `docs/decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md` (beslut 2 pekar idag till "eget kort, Marcus beslut" i § Öppet, och medvetet inte beslutat här — den raden uppdateras till att peka på detta kort och den fattade riktningen), daterad 2026-08-22, med TASK-286.5:s motivering (kortets notes) som källa.

Källa för uppdraget: TASK-286.5 notes (Marcus beslut 2026-08-22) + ADR-123 § Öppet, och medvetet inte beslutat här ("Diakritik-tolerant sök (beslut 2) — eget kort, Marcus beslut").
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `src/lib/person-sok.ts` matchar diakritik-tolerant. Konkret, mekaniskt facit: i `tests/api/person-sok.test.ts` (rad ~90-94) vänds testfallet — `personMatcharSokterm(bas({ namn: 'Åsa Öberg' }), 'asa')` ska nu vara `true` (idag `false`); `'åsa'` ger fortsatt `true`. Filhuvudets docstring (rad ~1-13, "DIAKRITIK-känslig... ingen normalisering") och `person-sok.ts`s eget filhuvud (som idag säger "diakritik-KÄNSLIG... paritet med EF:ens SEARCH()-formel... Breddning... är ett SEPARAT, oavgjort produktbeslut (TASK-286.5)") skrivs om till att beskriva den nya, beslutade semantiken.
- [x] #2 `tests/api/get-persons-sok-paritet.staging.test.ts` byter FACIT-KÄLLA: inte längre likhet med EF:ens `SEARCH()`-svar, utan likvärdighet med eventväljarens filter — samma matchningssemantik som `useFilter({ sensitivity: 'base' })` (`react-aria-components`, `EventValjare.tsx` rad 177) applicerad på de fyra sökfälten (Namn, E-post, Telefon, Ort — "något element" för Ort, PRD-valet oförändrat). Konkret, mätbart facit för TERMLISTA: `'åsa'` och `'asa'` ska ge EXAKT samma, icke-tomma träffmängd (båda innehåller `recJoNC9kGJD145XQ`, "Åsa-ZZ-Bokstavsindex Fixture") — före ändringen gav de olika mängder (0 träffar för `'asa'`, 1 för `'åsa'`, mätt i `tests/api/get-persons-sok-paritet.staging.test.ts` filhuvud). `'ås'` ger samma mängd som de två. Testfilens rubrik/kommentarer ("sök-PARITET mellan EF:ens SEARCH()-formel och klientfiltret") skrivs om till att beskriva likvärdighet med eventväljaren, inte EF-paritet. Övriga termer i TERMLISTA (diakritik-fria: `'anna'`/`'ANNA'`, `'ej till'`, `'070'`/`'070-'`/`'070 1'`, `'falköping'`, `'example.com'`, `''`) är opåverkade av bytet.
- [x] #3 Beslutet bokfört som ny daterad post (2026-08-22) under `## Updates` i `docs/decisions/ADR-123-forladdat-personregister-sok-och-bokstavsindex-i-klienten.md`, med TASK-286.5:s motivering som källa; § Öppet, och medvetet inte beslutat här-raden ("Diakritik-tolerant sök (beslut 2) — eget kort, Marcus beslut") uppdateras till att peka på det fattade beslutet i stället för att stå kvar som öppen fråga.
- [x] #4 Grep-svep bekräftar om någon annan yta/konsument bygger på dagens diakritik-KÄNSLIGA klientsemantik (utöver de två testfilerna ovan) — hittas en, bokförs den öppet i PR:en i stället för att brytas tyst.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
