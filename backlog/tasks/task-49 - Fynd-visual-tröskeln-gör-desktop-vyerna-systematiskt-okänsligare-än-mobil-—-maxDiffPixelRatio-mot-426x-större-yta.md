---
id: TASK-49
title: >-
  Fynd: visual-tröskeln gör desktop-vyerna systematiskt okänsligare än mobil —
  maxDiffPixelRatio mot 4,26x större yta
status: In Progress
assignee: []
created_date: '2026-07-25 18:56'
updated_date: '2026-07-25 20:55'
labels:
  - ready-for-agent
dependencies: []
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (QA-36.8 punkt 11, 2026-07-25): en app-bred ändring av brödtextfärgen (--mm-text → #c0392b) fångades av 4 av 6 MOBILA vyer men av NOLL desktop-vyer. Alla 6 desktop passerade grönt trots att all text bytt färg.

GRUNDORSAK (bevisad, ej hypotes): playwright.config.ts:136 sätter maxDiffPixelRatio: 0.01 globalt. Trösklarna är ANDELAR, och vyportarna har mycket olika yta:
- visual-desktop: 1440x900 @2x = 5 184 000 px → 51 840 px får avvika
- visual-mobile:   375x812 @2x = 1 218 000 px → 12 180 px får avvika

Desktop-layouten har mer whitespace, så textpixlarna utgör en MINDRE andel av ytan. Samma absoluta ändring hamnar därför under tröskeln på desktop och över den på mobil.

BEVIS: med maxDiffPixelRatio sänkt till 0.001 failade ALLA 12 (inklusive samtliga 6 desktop). Med 0.01 failade bara 4 mobila. Tröskeln är alltså den enda skillnaden.

Kommentaren på playwright.config.ts:142 säger 'Ratio-trösklarna ovan är skala-neutrala'. Det stämmer för deviceScaleFactor (2x ändrar täljare och nämnare proportionellt) men INTE mellan vyportar med olika innehållstäthet. Antagandet i kommentaren är alltså för brett.

FÖRVÄNTAT BETEENDE: en app-bred visuell regression ska fångas oavsett vyport. Kandidater: per-projekt-tröskel (striktare på desktop), maxDiffPixels (absolut) i stället för ratio, eller element-scopade snapshots på de täta ytorna. Val kräver research — Playwrights egen dokumentation och hur andra projekt hanterar vyport-asymmetrin.

BÄRARE: fyndet gör T87:s grind-aktivering mindre värd än den ser ut — en aktiv grind hade släppt igenom desktop-regressioner. Bör lösas FÖRE T87 aktiveras.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Grundorsaken bekräftad mot Playwrights dokumentation om maxDiffPixelRatio vs maxDiffPixels
- [ ] #2 Vald form research-belagd mot minst två branschprojekt, inte vald på magkänsla
- [x] #3 Rött-först: samma app-breda textfärgsändring fångas av BÅDE desktop och mobil efter fixen
- [x] #4 Falsklarms-kontroll: 12/12 gröna på oförändrad kod efter fixen
- [ ] #5 T87-kortet noterar att fyndet är löst, eftersom grindens värde hängde på det
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
LÖST S89 2026-07-25 — mätt, inte gissat.

FORM: global maxDiffPixels: 2000 vid sidan av befintlig maxDiffPixelRatio: 0.01. Ingen per-projekt-konfiguration behövdes.

VARFÖR DEN FORMEN (playwright-core 1.61.1, läst i node_modules — starkare källa än dokumentationen, som inte svarar på frågan):

  maxDiffPixels1 = options.maxDiffPixels
  maxDiffPixels2 = ratio !== undefined ? expected.width * expected.height * ratio : undefined
  maxDiffPixels  = Math.min(maxDiffPixels1, maxDiffPixels2)

Två fakta ur den raden: (a) ratio räknas om till ett ABSOLUT tak via bredd*höjd — mekanismen bakom blindheten; (b) sätts båda vinner den STRIKTASTE. Därför biter det absoluta taket på stora bilder medan ratio-taket biter om en vy blir liten nog att 2000 vore slappt. Självreglerande, inget att räkna om per vyport.

KORRIGERING AV KORTETS PREMISS: kortet angav ytkvoten 4,26x som generell. Bilderna är fullPage, så ytan följer sidans HÖJD, inte vyporten. Uppmätta kvoter: event-lista 4,26x · mer-anmalningar 4,26x · hem 3,81x · personer 3,63x · eventsida 3,65x · event-anmalda 2,37x. 4,26x är alltså maxvärdet. Grövre exempel: eventsidans desktop-bild är 2880x7006 = 20 177 280 px, vilket med ratio 0.01 tillät 201 772 avvikande pixlar.

MÄTDATA (app-bred --mm-text -> #c0392b, samma regression som QA-36.8 punkt 11):
- Desktop, äkta regression: 11 357 / 15 602 / 25 640 / 30 010 / 42 024 / 61 335 px
- Mobil, äkta regression: 15 639 / 26 319 / 28 883 / 35 006 / 61 020 px (+1)
- Brusgolv mot FÄRSK baseline: 0 px över tre körningar med maxDiffPixels: 0 — fixturvärlden är genuint frusen (klocka, pinnad Inter, mockat nätverk).
- 2000 ligger 5,7x under minsta äkta fynd och rejält över noll-golvet.

SIDOFYND under mätningen: de 2 816/2 826 px som först såg ut som brus var exakt reproducerbara över tre körningar och bara i event-lista — alltså en STALE lokal darwin-baseline, inte flake. Efter --update-snapshots blev golvet 0. Hade jag kalibrerat mot 2 826 hade tröskeln satts mot fel golv.

BEVIS:
- AC#3 rött-först: före fixen fångade 4 mobila + 0 desktop; efter fixen failar 12/12 (alla sex desktop OCH alla sex mobila).
- AC#4 falsklarm: 12/12 gröna på orörd kod med nya tröskeln.
- typecheck 0, biome 0 fel.

AC#2 — ÄRLIG AVVIKELSE: kriteriet krävde belägg mot 'minst två branschprojekt'. Jag fann INTE två namngivna projekt med publik motivering för vyport-asymmetri; branschguidningen ger bara den generella regeln (ratio för element som varierar i storlek, absoluta tal för fixed-size — våra vyporter ÄR låsta). Belägget blev i stället Playwrights egen källkod, som besvarar designfrågan definitivt i stället för indicerande. Jag bedömer det som starkare än kriteriet krävde, men det är en annan sak än vad som står — därför lämnas AC#2 OKRYSSAD för Marcus bedömning.

ÄRLIG AVGRÄNSNING: brusgolvet är mätt på darwin. Linux-brus i CI är OMÄTT eftersom visual-sviten inte körs i CI förrän T87 aktiverar grinden. Marginalen är tilltagen för det; första CI-körningen är facit. Noterat i konfigen.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
