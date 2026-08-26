---
id: TASK-309.17
title: >-
  Block-dialogens datum-läge saknar ariaSnapshot-par — promoverings-grinden
  täcker 3 av 4 lägen
status: Done
assignee: []
created_date: '2026-08-24 17:00'
updated_date: '2026-08-26 05:34'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies: []
parent_task_id: TASK-309
ordinal: 583000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AVTÄCKT 2026-08-24 vid kartläggningen av skiva 9 (TASK-309.10).

TASK-309.10 AC #1 räknar upp 'block-dialog × 4 lägen' som facit-krav. Promoverings-grinden tests/visual/dokument-generering-promoverings-grind.spec.ts bär bara TRE ariaSnapshot-par:

  block-dialog-agenda-visual-desktop.aria.yml
  block-dialog-plats-visual-desktop.aria.yml
  block-dialog-text-visual-desktop.aria.yml

DATUM-läget saknas. Att det ÄR ett eget läge är belagt i koden: blockDefinitioner.ts ger sistaBetalningsdag flaggan 'datum: true' med kommentaren 'Ett datum (ISO-sträng som värde) — redigeras med datumfält, inte text', och BlockDialog.tsx rad ~122 bär en egen segment-form för det ('Ett enda datum — samma segment-form som husets DatumFalt') plus hjälparen datumUtanAr().

Detta är alltså en TÄCKNINGS-lucka i skiva 7:s grind — en annan klass än TASK-309.16, som gäller saknad VYPORT (mobil) för de lägen som redan täcks. Båda gör grinden halv, men på olika axlar, och båda bör stängas i samma pass som skiva 9:s facit tas.

Att det inte fångades har samma orsak som 309.16: visual-testerna bor i visual-baselines.yml (workflow_dispatch) och grindar ingenting i CI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 block-dialogens datum-läge har ett ariaSnapshot-par i promoverings-grinden, i båda vyporterna
- [x] #2 Facit-manifestet för s108-generering bär datum-lägets bild, så AC #1:s 'block-dialog × 4 lägen' är uppfyllt i sak och inte bara i ordalydelse
- [x] #3 Klarlagt och bokfört om andra block-dialog-lägen eller andra promoverings-grindar har motsvarande täckningsluckor
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-309.17, bygg-agentens landning 2026-08-24 (gren task-309.10-skiva9-facit).

KORTETS PREMISS ÄR FALSIFIERAD, mätt mot källan. Kortet antog att BlockDialogs datum-gren saknade ariaSnapshot-par och kunde få ett. Den grenen GÅR INTE ATT NÅ via den levande UI:n. Det enda blocket med 'datum: true' (sistaBetalningsdag, blockDefinitioner.ts rad 90) bor i Inforutan-gruppen, och tre oberoende spärrar i GenereringsVy.tsx stänger vägen dit — var och en tillräcklig: (a) 'lasEndast = r.def.last || arInforutan' (rad ~941) renderar varje Inforuta-rad som div, inte knapp, så ingen oppnaBlock-ingång finns att klicka; (b) varningsrutans 'Fyll i …'-knappar dispatchar 'INFORUTA_IDN.has(id) ? oppnaMorf(id) : oppnaBlock(id)' (rad ~835); (c) dialogRader() filtrerar bort INFORUTA_IDN ur navSyskon (rad ~269), så inte heller dialogens Föregående/Nästa kan nå blocket. Datum-grenen i BlockDialog.tsx (rad ~634) är därmed DÖD KOD i dagens GRUPPER-karta. Detta var redan korrekt bokfört i spec-filens ursprungliga docblock ('MEDVETET UTANFÖR — DATUM-LÄGET'), men kortet skrevs utan den läsningen.

VAD SOM LEVERERADES I STÄLLET. Det datum-läge en användare FAKTISKT ser är InforutanMorf:s DatumEnkel (samma komponent, importerad ur BlockDialog.tsx) för sistaBetalningsdag, nådd via Inforutans 'Ändra'-rad. Den ytan har nu ariaSnapshot-par i BÅDA vyporterna (inforutan-morf-datum-visual-{desktop,mobile}.aria.yml, byte-identiska) och facit-bild i båda (facit-datum-laget-inforutan-morf-{desktop,mobil}.png). Snapshotten låser segment-formen: group 'Sista betalningsdag' med spinbutton år/månad/dag i svensk ordning.

AC-STATUS. #2 BOCKAD — manifestet bär datum-lägets bild, och kriteriets egen formulering ('uppfyllt i sak och inte bara i ordalydelse') är precis vad som levererats. #3 BOCKAD — mätt på båda axlarna: BlockDialog har exakt TRE kropps-grenar (def.agenda → AgendaEditor, def.datum → DatumEnkel, annars → TextArea) plus ETT ortogonalt tillägg (def.platsFalt && ort → Kryss); grinden täcker nu samtliga fyra (agenda, ren TextArea, TextArea+Kryss, datum). Ingen ytterligare BlockDialog-gren är otäckt. Vyport-axeln: se TASK-309.16 AC #3 — dokument-generering var den enda halva av tolv. Bokfört durabelt i spec-filens docblock § TÄCKNINGEN.

#1 MEDVETET OBOCKAD. Ordalydelsen är 'block-dialogens datum-läge', och det är inte vad som levererades — att uppfylla den bokstavligt hade krävt att FLYTTA sistaBetalningsdag ut ur Inforutan, alltså en FORMÄNDRING som ADR-103 B2 steg 4 uttryckligen fredar, och som en bygg-agent aldrig får göra på eget bevåg.

ÖPPET BESLUT FÖR MARCUS/ORKESTRERAREN: vad ska hända med den döda datum-grenen i BlockDialog.tsx? Två vägar — riv grenen (den är onåbar kod), eller flytta sistaBetalningsdag ut ur Inforutan (formändring, kräver Marcus). Tills dess står den bokförd i spec-filens docblock § DATUM-LÄGET, inte utjämnad.

OBOCKAT MED AVSIKT: AC #1 ('block-dialogens datum-läge har ett ariaSnapshot-par i promoverings-grinden') är OBSOLET, inte bara obockad. TASK-309.19 (Marcus mandat väg A, 2026-08-26) mätte om premissen mot färsk origin/main och bekräftade den ORÄNDRAD: BlockDialog.tsx:s def.datum-gren var obevisligen onåbar från SAMTLIGA fyra callers (GenereringsVy.tsx, mer-eventinnehall, mer-platser, BlockDialog.tsx självt) — inte bara de tre spärrar i GenereringsVy.tsx detta korts egna notes redan bokförde. Väg A (riva grenen, inte flytta sistaBetalningsdag ur Inforutan) valdes explicit av Marcus/orkestreraren. Grenen (def.datum-ternären, resterandeBeloppHjalp-propen, datumUtanAr()) är nu RIVEN ur BlockDialog.tsx — det finns inget block-dialog-datum-läge kvar att ge ett ariaSnapshot-par, varken nu eller i framtiden, så länge dagens Inforutan-grupp-karta gäller. Att bocka AC #1 hade varit en osann utsaga. blockDefinitioner.ts:s datum-flagga och DatumEnkel-komponenten är OFÖRÄNDRADE i sitt kontrakt (verifierat: de driver Inforutans sektionsmorf, en annan renderingsväg) — AC #2/#3:s redan bockade slutsatser (morfens ariaSnapshot-par är det korrekta facit-läget) står därför fast, oberoende av denna stängning. Landning: samma PR som TASK-309.19 (gren fix/task-309-19-riv-blockdialog-datum-gren, öppnas direkt efter denna kort-uppdatering — se TASK-309.19:s notes för PR-referens när den finns). Källmärkt 2026-08-26.
<!-- SECTION:NOTES:END -->
