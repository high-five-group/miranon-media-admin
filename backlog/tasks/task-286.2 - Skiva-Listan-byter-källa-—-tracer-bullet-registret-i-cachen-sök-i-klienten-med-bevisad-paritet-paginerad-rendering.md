---
id: TASK-286.2
title: >-
  Skiva: Listan byter källa — tracer bullet: registret i cachen, sök i klienten
  med bevisad paritet, paginerad rendering
status: To Do
assignee: []
created_date: '2026-08-21 11:46'
updated_date: '2026-08-21 13:33'
labels:
  - ready-for-agent
dependencies:
  - TASK-286.1
parent_task_id: TASK-286
ordinal: 517000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: Lotta öppnar Personer. Första gången visas skelettet i slutgeometri medan registret laddas (en gång); pekar hon på Personer-fliken innan hon klickar har laddningen redan börjat. Sedan skriver hon i sökrutan och listan smalnar av vid varje tecken — inget skelett, ingen väntan, inget nätverksanrop. Raderar hon ett tecken breddas urvalet omedelbart. Träffarna är exakt desamma som förut: namn, e-post, telefon och ort, skiftlägesokänsligt, diakritik-känsligt (ADR-123 beslut 2). Räknarraden visar antalet träffar. Är träffarna fler än 50 visas de första 50 och 'Ladda fler' hämtar nästa 50 ur arrayen med samma knapp och samma annonsering som i dag. Sökningen står i adressfältet så den kan delas. Skärmläsaren får träffantalet artigt när hon slutat skriva.

HUR: ny query-nyckel för registret (queryKeys.persons.register eller motsvarande), staleTime = globala 5 min (höjs i invaliderings-skivan, inte här), prefetch på avsikt vid hover/fokus på Personer-fliken i TabBar (ADR-078 beslut 3; React Query dedupar), lat laddning annars. PersonsList läser registret via adaptern, filtrerar med ren toLowerCase().includes() per fält (arrayfält: något element), useDeferredValue på söktermen, URL-parametern q skrivs debounced (nuqs som i dag) men FILTRERINGEN är odebouncad. PAGE_SIZE 50 behålls som render-fönster; 'Ladda fler' utökar fönstret. Dagens sök-/cursor-query och total-walken LÄMNAS KVAR i kodbasen denna skiva (rivs i nästa) men har ingen konsument i listan längre.

PARITETSTESTET (DoD, nytt): samma termlista — minst: 'anna', 'ANNA', 'åsa', 'asa', 'ås', 'ej till', '070', '070-', '070 1', en ort, en e-postdel, tom sträng — körs mot EF:ens filterbyggare (formeln mot staging-fixturen) och mot klientfiltret på samma fixtur; träffmängderna ska vara identiska. Avviker de: STOPPA och rapportera vilken term — bygg aldrig vidare på en gissad semantik.

Formen: listans rad- och listform är låst i tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan och rörs inte — bara datakällan bakom raderna byter. Acceptance-sviten för personlistan uppdateras i samma commit (fixturen bär nu hela registret, inte sidor).

Täcker användarberättelser: 1, 2, 3, 7, 8, 9, 10, 11, 12, 15, 16
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Efter första laddningen sker noll nätverksanrop vid skrivning i sökrutan — mätt i acceptance-testet (räknade EF-anrop), inte antaget
- [x] #2 Skelett visas bara vid första laddningen av registret och i slutgeometri; därefter aldrig vid sökning
- [x] #3 Klientfiltret matchar skiftlägesokänsligt och diakritik-känsligt över namn, e-post, telefon och ort; paritetstestet mot EF:ens filter är grönt för hela termlistan
- [x] #4 Prefetch startar vid hover/fokus på Personer-fliken; första besöket efter prefetch visar inget skelett
- [x] #5 50 rader renderas initialt; Ladda fler utökar ur den filtrerade arrayen med oförändrad knapp och aria-live-annonsering; räknarraden speglar arrayens träffantal
- [x] #6 Sökningen står i URL:en (debounced) och återställs vid omladdning; träffantalet annonseras artigt efter skrivpaus, inte per tecken
- [x] #7 Personlistans rad- och listform är identisk med facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — referenserna gröna
- [x] #8 Acceptance-sviten för personlistan täcker: sök utan nätverk, paritet, Ladda fler ur array, URL-tillstånd, axe noll violations
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [ ] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [ ] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->
