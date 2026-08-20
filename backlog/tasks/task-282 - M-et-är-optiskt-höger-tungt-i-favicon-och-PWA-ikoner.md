---
id: TASK-282
title: 'M:et är optiskt höger-tungt i favicon och PWA-ikoner'
status: To Do
assignee: []
created_date: '2026-08-20 08:42'
labels:
  - ready-for-agent
dependencies: []
ordinal: 508000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus fångst 2026-08-20, MÄTT och bekräftad: M-formen ser höger-förskjuten ut trots att den är perfekt centrerad i sin ram.

MÄTNINGEN (public/pwa-512x512-120d7838.png, alpha-viktad):
- Geometriskt centrum: 255,5
- Optisk tyngdpunkt x: 259,2
- AVVIKELSE: +3,7 px åt höger = 0,72 % av bredden
- Vikt höger halva 26 655 mot vänster 25 939 — höger bär 2,7 % mer visuell massa

Bounding box är alltså exakt centrerad (marginal vänster 24 = höger 24 i 512-formatet), men formens VISUELLA MASSA ligger till höger. Det är skillnaden mellan matematisk och optisk centrering, och ögat läser den senare.

ÄVEN Y-LEDET, ej efterfrågat av Marcus men mätt i samma pass: tyngdpunkten ligger +15,9 px NEDÅT. Det kan vara avsiktligt (vågformens nedåtgående svansar) eller samma klass av fel. Avgör innan du rör y — en obeställd vertikal justering är en scope-utvidgning.

GÄLLER BÅDA YTORNA: Marcus rapporterar samma sak i favicon (public/favicon/favicon.svg) och i PWA-ikonerna. Faviconen har en egen källa och måste mätas separat — anta inte att samma korrigering gäller.

FIXEN SKA SKE I KÄLLAN, inte i utfilerna. public/miranon-m-original.svg är källan som pwa-assets-generatorn läser. Att nudga pixlar i genererade PNG:er är fel lager och överlever inte nästa regenerering.

OBS PÅ INTERAKTION MED TASK-280: ikonernas filnamn bär nu en innehållshash (scripts/pwa-icon-version.ts, sha256 av källan, 8 hex). Ändras källan ändras hashen, och Chrome ser en ny icons-lista — vilket är HELA POÄNGEN med den mekanismen och fungerar av sig självt. Men det betyder också att varje användare får Chromes 'App Update Available'-flöde igen. Det är väntat, inte en defekt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Den optiska tyngdpunkten i x ligger inom ±1,0 px från geometriskt centrum i den genererade 512-ikonen, mätt med alpha-viktad centroid — inte med bounding box
- [ ] #2 Samma mätning är gjord och godkänd för 192-ikonen och den maskable varianten
- [ ] #3 Faviconen (public/favicon/favicon.svg och dess genererade PNG/ICO) är mätt separat och korrigerad om samma avvikelse finns där — mätvärdet före och efter står i kortets notes
- [ ] #4 Korrigeringen är gjord i källfilen (public/miranon-m-original.svg eller favicon-källan), inte i genererade utfiler
- [ ] #5 Maskable-ikonens safe zone är omräknad efter korrigeringen och klarar fortfarande kravet (kvoten låg på 0,912 mot kravet 0,9 vid paddingen 0,55 — marginalen är tunn)
- [ ] #6 Y-ledets +15,9 px avvikelse är antingen åtgärdad eller uttryckligen bedömd som avsiktlig, med motivering i notes — den lämnas aldrig obesvarad
- [ ] #7 Varje genererad ikon är öppnad som bild och visuellt granskad efter korrigeringen, inte bara mätt numeriskt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
