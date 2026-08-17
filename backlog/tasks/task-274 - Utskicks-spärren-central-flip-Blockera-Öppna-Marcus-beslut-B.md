---
id: TASK-274
title: 'Utskicks-spärren: central flip Blockera/Öppna (Marcus beslut B)'
status: To Do
assignee: []
created_date: '2026-08-17 14:59'
labels:
  - ready-for-agent
dependencies: []
ordinal: 494000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus vill kunna säga Blockera alla utskick respektive Öppna utskick från appen med ETT kommando, utan process. Bygget: en dedikerad spärr-hemlighet läst per anrop i den delade utskicksvakten (samma ställe som miljö-grinden), tydligt UI-fel när spärrad, semantik där frånvaro = öppet och allt oväntat = blockerat. Kontext: agent-/chattvägen är redan mekaniskt blockerad (mail-låset + prod-ref-låset) och RÖRS INTE — detta kort gäller appens egen sändväg. Marcus beslut B 2026-08-17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Central spärr-vakt i den delade utskickshjälparen som redan bär miljö-fail-closed-logiken; SAMTLIGA fyra utskicks-EF:er (åtgärdsmail, segmentutskick, kvitto, anmälningsbekräftelse) konsumerar den och ingen kan skicka förbi — testbevis per EF i API-sviten
- [ ] #2 Spärr PÅ: varje verklig sändning nekas med tydlig maskinläsbar felkod och ett människoläsbart meddelande som UI:t visar begripligt (Gunilla-nivå: Utskick är blockerade just nu), oavsett miljö
- [ ] #3 Semantik fail-closed åt rätt håll: frånvarande hemlighet eller uttryckligt av-värde = öppet (dagens beteende exakt oförändrat); VARJE annat värde = blockerat — en felskriven flip blockerar hellre än släpper
- [ ] #4 Staging-skarptest: hemlighets-flip UTAN omdeploy bevisad slå igenom, tidsatt och bokförd i rapporten (antagandet att secrets läses per anrop får inte antas — det mäts)
- [ ] #5 Kortets rapport bokför exakt kommandoform för Blockera respektive Öppna (Marcus enda moment vid flip), samt att prod-deploy av EF-ändringen är Marcus separata moment via allowlist-skriptet (prod-ref-låset)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
