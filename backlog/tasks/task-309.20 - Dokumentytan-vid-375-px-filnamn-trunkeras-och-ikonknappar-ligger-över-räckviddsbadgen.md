---
id: TASK-309.20
title: >-
  Dokumentytan vid 375 px: filnamn trunkeras och ikonknappar ligger över
  räckviddsbadgen
status: To Do
assignee: []
created_date: '2026-08-24 17:54'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 586000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Avtäckt av skiva 9-agenten 2026-08-24 under facit-tagningen, bokförd i manifestens not-fält.

Två formdefekter i mobil vyport (375 px):

  1. Event-mallade radens filnamn trunkeras till 'Bekr…' — så kort att raden inte
     längre säger vilket dokument det är.
  2. I räckviddsläget ligger ikonknapparna DELVIS ÖVER räckviddsbadgen.

URSPRUNGET ÄR MÄTT och ligger UTANFÖR skiva 7: TASK-273.4, commit b881fe64 (2026-08-17) — alltså efter s102-stämpeln och före promoveringen. Detta är alltså inte en regression ur bilagespåret; det är en pre-existing defekt som facit nu fryser.

DÄRFÖR ÄR DEN BRÅDSKANDE PÅ ETT SÄRSKILT SÄTT: skiva 9:s facit-manifest avbildar ytan som den ÄR, inklusive dessa två defekter. Stämplar Marcus manifestet blir defekterna en del av det låsta facit, och en framtida fix kommer att FÄLLA grinden och kräva en amendering. Att laga före stämpling är billigare än att laga efter.

Agenten bokförde observationen i manifestens not-fält i stället för att tyst laga — rätt, eftersom en formändring på en yta Marcus just granskat är hans beslut (ADR-103 B2 steg 4).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Filnamnet på Event-mallade rader är läsbart vid 375 px — trunkeringen ger tillräckligt med tecken för att skilja dokumenten åt
- [ ] #2 Ikonknapparna ockluderar inte räckviddsbadgen i räckviddsläget vid 375 px
- [ ] #3 Avgjort och bokfört: lagas FÖRE Marcus stämplar skiva 9:s facit (billigare), eller efter med amendering (ADR-102 klass c)
- [ ] #4 Regressionsskydd: den mobila vyporten bär facit för båda lägena efter fixen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
