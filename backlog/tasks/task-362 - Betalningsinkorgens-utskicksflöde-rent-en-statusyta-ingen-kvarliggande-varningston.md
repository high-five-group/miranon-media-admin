---
id: TASK-362
title: >-
  Betalningsinkorgens utskicksflöde: rent, en statusyta, ingen kvarliggande
  varningston
status: To Do
assignee: []
created_date: '2026-09-02 09:12'
updated_date: '2026-09-02 09:51'
labels: []
dependencies: []
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Betalningsinkorgens utskicksflöde ("Skicka N kvitton") ska vara RENT — Marcus prod-röktest 2026-09-02 (S113 resume 8): raden stannar i gult efter ett skickat kvitto utan väg att stänga; en grön bekräftelse ligger kvar hela besöket; rutan hoppade i höjd under utskicket. Fixen: granskningsblockets ton blir villkorad (vila/varning), bekräftelsen får kryss + auto-clear vid nästa handling, en statusyta med reserverad höjd (min-h-10) genom köat->pågår->klart, och 'Öppna betalningsinkorgen'-knappen döps om till 'Öppna betalningar' (Marcus tillägg). Källor: docs/research/utskicksbekraftelse-inkorg-auto-dismiss-vs-persistent-2026-09-02.md, s93/s102/s103-facit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Raden i granskningsblocket ('Registrerat nu') visar vilotonen (neutral, ingen gul/varning-fond) när jobbraden är 'skickat' eller 'inget kvitto'; varningston endast medan något väntar/pågår eller har fallerat
- [x] #2 Utfalls-bekräftelsen (intent success) kan stängas med kryss och nollställs automatiskt vid nästa handling (ny registrering eller ny 'Skicka N kvitton'); warning-utfall förblir ostängbara (kryss-regeln)
- [x] #3 En statusyta med reserverad höjd (min-h-10) visar köat->pågår->klart för Lottas egen sessions jobb utan att förskjuta listan under; mätt med getBoundingClientRect före/efter
- [x] #4 'Öppna betalningsinkorgen' bytt till 'Öppna betalningar' i all användarsynlig text (kodidentifierare orörda)
- [x] #5 Tillgänglighet bevarad: role=status/alert-annonsering en gång per tillståndsbyte, krysset har tillgängligt namn, axe 0 nya fel på inkorgen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
