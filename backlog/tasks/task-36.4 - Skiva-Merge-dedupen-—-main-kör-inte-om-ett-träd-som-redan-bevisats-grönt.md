---
id: TASK-36.4
title: 'Skiva: Merge-dedupen — main kör inte om ett träd som redan bevisats grönt'
status: In Progress
assignee: []
created_date: '2026-07-23 17:13'
updated_date: '2026-07-23 21:45'
labels:
  - ready-for-agent
dependencies:
  - TASK-36.3
parent_task_id: TASK-36
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Varje merge kör idag om exakt det innehåll som nyss körts grönt i PR:en — samma tio minuter, samma mutex, hållen mot nästa PR i kön. Mutex-lasten per ändring är därmed dubbel utan att någon ny information produceras.

Efter denna skiva känner main-körningen igen ett träd den redan sett grönt och hoppar över de tunga jobben. Mutex-lasten per merge-cykel halveras, och kön går snabbare för alla efterföljande PR:ar.

Mekaniken är innehållsadresserad och kräver ingen ny lagringsyta: informationen finns redan hos GitHub. Main-körningen tar merge-commitens andra förälder — den mergade PR-headen — verifierar att merge-commitens träd är identiskt med PR-headens träd, och frågar körnings-API:t om den SHA:n redan har en grön körning. Sundheten vilar på merge-grindens krav att branchen är up-to-date före merge: då är merge-commitens träd per definition identiskt med PR-headens.

VIKTIGT för implementationen: designdokets ursprungliga mekanism (cache-nyckel skriven av PR-körningar, läst av main-körningar) är FALSIFIERAD och får inte byggas. GitHubs dokumentation slår fast att en cache skapad av en pull_request-körning bara kan återställas av omkörningar av samma PR — den är osynlig för main-körningen. Den formen hade gett permanent cache-miss: noll besparing, en onödig skrivning per PR, och inget synligt fel. Formen ovan är bevisad mot faktisk disk och API. Designdoket bär en rättelse-not.

Riktningen på riskerna är asymmetrisk med avsikt: dedupen kan bara orsaka att något körs i onödan, aldrig att något otestat slinker förbi — nyckeln ÄR trädet självt. Varje tvivel faller därför till full körning.

Täcker användarberättelser: 5, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Main-körningen läser merge-commitens andra förälder (den mergade PR-headen) och jämför trädhashar
- [ ] #2 Dedup-träff kräver BÅDE att merge-commitens träd är identiskt med PR-headens träd OCH att den SHA:n har en grön körning enligt körnings-API:t
- [ ] #3 Vid träff hoppas de tunga jobben över; paraply-checken rapporterar fortfarande och blir grön
- [x] #4 Fail-closed på VARJE avvikelse: ingen andra förälder, trädavvikelse, API-fel eller icke-grön körning ⇒ full svit
- [x] #5 Uppslaget använder fullständig SHA — förkortad SHA ger noll träffar mot körnings-API:t (L314)
- [x] #6 Steget bor i jobbet som redan har full historik: fetch-depth-bärar-invarianten är ORÖRD och dess testsvit fortsatt grön
- [ ] #7 Kontrastbevis-paret körd med citerade körnings-ID: merge med träff hoppar över tunga jobb · avvikelse ger full svit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Statiska workflow-grindar gröna på ändrad CI-konfiguration (actionlint, yamllint, shellcheck strict)
- [ ] #6 Kontrastbevis körda och körnings-ID:n citerade på kortet — ett bevis utan ID räknas inte
- [x] #7 L322-invarianten oregresserad: paraply-checken har alltid-kör-villkoret ENSAMT och exit:ar 1 vid failure/cancelled
<!-- DOD:END -->
