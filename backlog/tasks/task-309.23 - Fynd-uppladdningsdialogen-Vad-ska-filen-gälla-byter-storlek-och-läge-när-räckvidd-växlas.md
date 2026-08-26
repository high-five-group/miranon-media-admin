---
id: TASK-309.23
title: >-
  Fynd: uppladdningsdialogen 'Vad ska filen gälla?' byter storlek och läge när
  räckvidd växlas
status: To Do
assignee: []
created_date: '2026-08-26 02:24'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 589000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus röktest i prod 2026-08-26 (S108 resume 11): 'När jag laddar upp dokument, första frågan jag får är "Vad ska filen gälla?", och om jag väljer "Alla event" så ändrar rutan storlek, sånt avskyr ju jag, då måste ögat reorientera sig igen. Åtgärda så rutan aldrig ändrar storlek och läge vad jag än väljer eller trycker på.'

ORSAK i koden: src/components/dokument/DokumentYta.tsx (dialogen från rad ~1543, Dialog size="md"): raden med Select 'Familj' (+ ev. nivå-select) renderas VILLKORLIGT ({rackvidd === AttachmentScope.KURSTYP && …}), så dialogens höjd — och därmed dess centrerade läge — hoppar när användaren växlar mellan Detta event / En familj / Alla event. Initialvärdet är EVENT när event finns, annars KURSTYP, så första målningen kan också skilja.

Krav: dialogens yttre mått och position är IDENTISKA i alla tre räckviddslägen och under hela uppladdningen (laddar-läget inkluderat). Lösningsriktning är agentens (t.ex. alltid reserverad rad-höjd med kontrollerna dolda men platsbevarande, eller fast min-höjd härledd ur det högsta läget) — men INGEN layout-shift, mätt. Kontrollera även att Select-menyns öppning inte flyttar dialogen och att sm:-breakpointen (kolumn→rad) inte ger olika höjd per läge. Tillgänglighet: dolda kontroller får inte vara fokuserbara (inert/aria-hidden + tabIndex), skärmläsaren ska fortfarande höra att valet 'En familj' kräver en familj.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dialogens bounding box (x, y, bredd, höjd) är identisk i lägena Detta event / En familj / Alla event och under pågående uppladdning — mätt med Playwright (getBoundingClientRect) i desktop och 375 px, tal redovisade i PR:en
- [ ] #2 Dolda kontroller är inte fokuserbara och inte i tabordningen; axe-svepet grönt; Familj-valet nås med tangentbord som förut
- [ ] #3 Ingen regression i uppladdningsflödet (acceptance-testet för uppladdning grönt)
- [ ] #4 Prototyp-/facit-påverkan bokförd: om dokumentytans facit-bilder berörs anges det i PR:en (dialogen ingår inte i s108-dokumentytans ytor — verifiera mot manifestet)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
