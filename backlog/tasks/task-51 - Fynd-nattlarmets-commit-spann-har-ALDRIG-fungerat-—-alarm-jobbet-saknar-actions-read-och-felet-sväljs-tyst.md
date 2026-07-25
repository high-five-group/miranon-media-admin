---
id: TASK-51
title: >-
  Fynd: nattlarmets commit-spann har ALDRIG fungerat — alarm-jobbet saknar
  actions:read och felet sväljs tyst
status: In Progress
assignee: []
created_date: '2026-07-25 19:11'
updated_date: '2026-07-25 20:26'
labels:
  - ready-for-agent
dependencies: []
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (QA-36.8 punkt 7, 2026-07-25): larm-ärendet visar alltid '(ingen tidigare grön nattkörning — första gången eller alla röda)' oavsett hur många gröna nattkörningar som finns. Vid testet fanns FEM gröna, varav en 25 minuter gammal.

GRUNDORSAK (bevisad): alarm-jobbet i .github/workflows/nightly.yml anropar 'gh run list --workflow nightly.yml --branch main --status success' för att härleda commit-spannet, men jobbets permissions är endast 'contents: read' + 'issues: write'. gh run list kräver 'actions: read'. Anropet failar med 403.

Felet blir TYST därför att raden slutar med '|| echo ""'. last_green blir tom sträng, och villkorskedjan väljer då sin FÖRSTA gren — 'ingen tidigare grön nattkörning' — vilket är den mest alarmerande av de tre möjliga texterna. Frånvaro av data presenteras alltså som ett faktapåstående om historiken. Samma klass som L322: signalen ska vara success ELLER failure, aldrig frånvaro.

Jämförelsepunkt i samma fil: nightly-metrics-jobbet (rad 133-135) HAR 'actions: read' just för sitt gh-anrop. Larm-jobbet fick aldrig samma behandling.

SYSTEMATISKT, INTE NYTT: ärende #114 (S79:s larmkedje-test 2026-07-23) bär exakt samma text. Buggen har funnits sedan larmet byggdes. Den upptäcktes aldrig eftersom det ENDA larm-ärendet någonsin var en simulering, och ingen läste commit-spannet kritiskt.

VARFÖR DET SPELAR ROLL: commit-spannet är larmets mest värdefulla fält — det svarar på 'vad ändrades sedan det fungerade?'. Utan det måste mottagaren rekonstruera spannet för hand. QA-punkt 7 frågar ordagrant 'räcker informationen för att veta var man börjar?' och svaret är NEJ.

FÖRVÄNTAT BETEENDE: (1) alarm-jobbet får 'actions: read'. (2) Ett misslyckat gh-anrop får INTE presenteras som 'ingen tidigare grön natt' — skilj på 'kunde inte hämta' och 'finns ingen'. Fjärde gren, eller låt steget fela högt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 alarm-jobbet har actions: read; gh run list returnerar en SHA i skarp körning
- [ ] #2 Rött-först: larm-ärende med KORREKT compare-länk framkallat via simulate_failure, länken klickad och verifierad
- [ ] #3 Misslyckat gh-anrop ger egen text ('kunde inte hämta spannet') — aldrig grenen 'ingen tidigare grön'
- [ ] #4 Ingen annan tyst '|| echo' i nightly.yml eller nightly-watchdog.yml maskerar ett API-fel — hela filerna genomsökta
- [ ] #5 Ärende #114 och #210 refereras i lösningen som de två historiska bevisen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
