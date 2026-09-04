---
id: TASK-388
title: 'Försättsbladet: Summa-rutan smalare än sammanställningsrutan (Marcus QA 370.5)'
status: To Do
assignee: []
created_date: '2026-09-04 09:21'
updated_date: '2026-09-04 09:23'
labels:
  - ready-for-agent
dependencies: []
references:
  - TASK-370.5
  - TASK-380
ordinal: 686000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus QA av försättsbladet (TASK-370.5), 2026-09-04, ordagrant: "Rutan för 'Summa' är inte lika bred som rutan över med sammanställningen. Det är det enda som jag ser är 'fel'." Summa-rutan ska vara lika bred och lika placerad som sammanställningsrutan (tabellen) ovanför. Rotorsak (mätt, pdftocairo -svg, gråfyllnadens path-bbox): docs/mallar/bilagor/forsattsblad.css .forsattsblad-tabell hade width:100% TILLSAMMANS med .forsattsblad-box egna margin-left/margin-right:2.5mm — ett CSS2.1 §10.3.3-överkonstruerat uttryck (inget värde auto) dar Prince ignorerar margin-right och räknar om det i stället för att krympa bredden. Tabellen blev därmed 176,586mm bred mot summaradens korrekta 171,592mm (samma vänsterkant 19,076mm, avvikelsen satt på höger sida). Fixat: width: calc(100% - 5mm) på .forsattsblad-tabell, som räknar in marginalparet direkt i bredden i stället för att göra ekvationen överkonstruerad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Summa-rutan lika bred och lika placerad som sammanställningsrutan, mätt med pdftotext -bbox (samt pdftocairo -svg för de faktiska box-kanterna, eftersom pdftotext -bbox bara ger textpositioner) före/efter
- [x] #2 staging bär den nya versionen av preview-receipt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Matpunkter (pdftocairo -svg, grafyllnadens path-bbox i sidans koordinatsystem, PT->mm):

FORE (npm run mall:pdf -- forsattsblad, fixtures/forsattsblad.exempel.json, N=2):
  Sammanstallningsrutan (tabellen): xMin=19,076mm xMax=195,662mm bredd=176,586mm
  Summa-rutan:                      xMin=19,076mm xMax=190,668mm bredd=171,592mm
  Avvikelse: 4,994mm (~5mm) pa hoger sida, vansterkant identisk.

EFTER (samma fixtur, samma rendering-kommando, efter width:100% -> calc(100% - 5mm)):
  Sammanstallningsrutan (tabellen): xMin=19,076mm xMax=190,668mm bredd=171,592mm
  Summa-rutan:                      xMin=19,076mm xMax=190,668mm bredd=171,592mm
  Identiska koordinater, 0mm avvikelse.

N=30 (scratch-fixtur, ej committad, samma monster som TASK-370.2 AC #5): 1 sida,
text 20.42-256.03mm (identiskt med TASK-370.2s egen matning), bada gra rutorna
171,592mm, samma xMin/xMax.

N=40 (scratch, tvingar en sidbrytning som inte forekommer vid N<=30-taket): 2
sidor. Bada sidors gra ytor (tabellfortsattning sida 2 + summarutan sida 2)
mater 171,592mm, xMin=19,076mm xMax=190,668mm - identiskt med sida 1 och med
N=2/N=30. Bredden haller over sidbrytningen.

pdftotext -bbox (textpositioner, kompletterande bevis): identiska ord-koordinater
fore/efter (tabellinnehallets text flyttades inte - endast tabellens HOGERKANT
utanfor sista kolumnen andrades, inga celltextpositioner beror pa aggregatets
box-marginal).

Rotorsak: .forsattsblad-tabell (width:100%) ar ett block-element inuti
.forsattsblad-innehall, som i sin tur ar ett flex-item i .sida--kvitto
(display:flex; flex-direction:column) och darmed STRACKS (align-items:stretch,
default) till hela flex-containerns tvarbredd. Nar tabellens EGNA
width:100% + margin-left/right:2.5mm (fran .forsattsblad-box) da racknas mot
den strackta .forsattsblad-innehall-containerns FULLA bredd blir uttrycket
overkonstruerat (CSS2.1 SS10.3.3: inget varde ar auto) - motorn (Prince 15.1)
ignorerar margin-right och rknar om det i stallet for att krympa width, vilket
ger tabellen en negativ effektiv hogermarginal och en 5mm bredare ruta.
.forsattsblad-summarad ar ISTALLET ett DIREKT flex-item (ingen mellanliggande
wrapper) med width:auto - dar racknar flexboxens stretch-logik in EGNA
marginalerna korrekt (171,592mm), vilket ar exakt containerns bredd minus 5mm.

Fix: width: calc(100% - 5mm) pa .forsattsblad-tabell, en enda radandring plus
en forklarande kommentar. Racknar in marginalparet i bredden direkt sa
ekvationen aldrig blir overkonstruerad.
<!-- SECTION:NOTES:END -->
