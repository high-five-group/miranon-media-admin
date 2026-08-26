---
id: TASK-309.28
title: >-
  Fynd: agenda-dialogens knappar '+ Lägg till punkt' och '+ Lägg till
  meditation' ska vänsterställas, inte centreras
status: To Do
assignee: []
created_date: '2026-08-26 03:26'
updated_date: '2026-08-26 04:15'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 594000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-26 (S108 resume 11), ordagrant: 'En annan sak jag fick se är att "+lägg till punkt" och "+lägg till meditation" behöver vänsterställas centrerat. Just nu ligger knappar med center, center, vilket jag inte gillar. Detta är alltså knapparna inuti "agenda-modalen".'

Tolkning (bekräfta mot koden och mot Marcus formulering, ändra inte mer än detta): knapparna ligger i dag horisontellt centrerade i dialogen; de ska stå vänsterställda i samma vänsterkant som agendaraderna ovanför (samma indrag/linje som radernas text), i sin befintliga inbördes ordning. Ingen annan form i dialogen ändras.

VAR: block-dialogens agenda-läge i genereringsvyn — src/components/dokument/ (BlockDialog / agenda-editorn; grep 'Lägg till punkt' och 'Lägg till meditation'). Läs kommentarerna i komponenten först: flera formval där är Marcus-beställda (prototyp-konvergensen, S108 Del 3–13) och får inte rivas i förbifarten.

FACIT: block-dialogens agenda-läge är en av s108-genererings ytor (facit.json 'block-dialog × 4 lägen' — verifiera vilken bild som avbildar agenda-läget). Manifestet är OSTÄMPLAT: ta om den berörda bilden/bilderna (desktop + mobil om båda finns) med skiva 9:s metod (docs/reference/prototyp-verifiering-runbook.md § Bildtagningens två fällor), uppdatera not-fältet, rör ALDRIG godkand.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Knapparna '+ Lägg till punkt' och '+ Lägg till meditation' är vänsterställda i linje med agendaradernas vänsterkant, i desktop och 375 px — bounding-box-mätning mot radernas x-position i PR:en
- [x] #2 Ingen annan form i dialogen ändrad (ariaSnapshot-paret för block-dialogen oförändrat utöver knappraden)
- [x] #3 Berörda facit-bilder i s108-generering omtagna med skiva 9:s metod; not-fältet uppdaterat; godkand orört; dokumentationsgrindarna exit 0
- [x] #4 Tabordning och knapparnas tillgängliga namn oförändrade; axe grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
