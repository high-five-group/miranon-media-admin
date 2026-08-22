---
id: TASK-297
title: >-
  Facit-regimernas täckning: kartlägg 27 stämplade ytor, avgör regim per yta,
  wira referenserna till vakten (T172)
status: To Do
assignee: []
created_date: '2026-08-22 17:52'
updated_date: '2026-08-22 17:53'
labels:
  - ready-for-human
dependencies: []
ordinal: 538000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur TASK-292:s grillning (S111, 2026-08-22). Marcus utlösare ordagrant: "vi borde ju för tusan ha bildbaslinjer för alla facitstämplade ytor. Det är väl det som är hela grejen."

MÄTT 2026-08-22 mot origin/main 3849ac5a, `bash scripts/check-facit.sh` exit 0, slutraden verbatim: "12 manifest, 27 ytor deklarerade, 0 ogodkända. Innehållslås (invariant d): 11 referenser låsta mot sha256 i stämplade manifest; 24 stämplade ytor saknar referenser och är därmed INTE innehållslåsta."

TRE ARTEFAKTER SOM BLANDAS IHOP, med olika täckning: (1) facit-bilder i tasks/sessions/bilagor/*/facit.json — 12 av 27 ytor; (2) innehållslås sha256 på fältet referenser — 3 av 27 ytor; (3) pixel-baslinjer i tests/visual/__screenshots__/ — 6 vyer (event-anmalda, event-lista, eventsida, hem, mer-anmalningar, personer). Överlappet mellan facit-stämplade ytor och pixel-baslinjer är TVÅ (hem, personlistan); de fyra övriga baslinjerna vaktar ytor som inte är facit-stämplade. Vakten pekar alltså till stor del bort från det den ska skydda.

FYNDETS KÄRNA är en regimskillnad, inte en lucka: 15 av 27 ytor bär bilder: [] — en DEKLARERAD frånvaro (check-facit invariant b), inte försummelse. Persondetaljens manifest säger verbatim: "VILKA BILDER SOM ÄR FACIT: INGA — bildlistan är tom med avsikt ... DET MEKANISKA FACIT är ariaSnapshot-referenserna under tests/visual/__aria__/persondetalj-promoverings-grind.spec.ts/". Samma val för segment-familjen (7 ytor), åtgärdssidan (3 ytor) och delar av hållplats-prototypen. KONSEKVENS: aria-snapshots fångar tillgänglighetsträdet — roller, namn, struktur — och en marginal som går 16 px till 32 px rör dem inte alls. Persondetaljen och check-in har ett mekaniskt facit som per konstruktion inte kan se visuell drift. Upptäckt när Marcus frågade hur TASK-292:s sidram-byte skulle påverka just de två ytorna, och riggen inte kunde svara.

ATT LYFTA 15 YTOR från aria- till pixel-regim är ett REGIMBYTE, inte städning — Marcus-beslut, per yta eller per klass. En tidslinje (aktivitetshistoriken) och en kortlista har inte samma behov.

AVGRÄNSNING: TASK-292:s eget steg 3 — pixel-baslinjer för de fyra ytor det passet rör (PersonDetail, check-in/dörrlistan, AktivitetsHistorik, DokumentYta) — ingår i DET passet och står kvar oavsett vad detta kort landar i. Detta kort äger de ÖVRIGA ytorna och den principiella regimfrågan.

Tråd: T172 (tasks/threads/T172-facit-regimernas-tackning.md). Besläktat: ADR-102 (prototypen är facit), ADR-103 (promoveringskontraktet), ADR-104 (stämpelns schema), TASK-292.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Karta över alla 27 facit-stämplade ytor: vilket regim var och en bär i dag (bild-facit · aria-facit · sha256-innehållslåst · pixel-baslinje) och vilket den BÖR bära — per yta, inte per klass
- [ ] #2 Marcus har avgjort regimbytet för de 15 ytor som i dag bär bilder: [] (deklarerad frånvaro, aria-facit); valet citeras daterat per yta eller per klass
- [ ] #3 De stämplade referenserna är wirade till en vakt som jämför den KÖRANDE appen mot dem — antingen via motsvarighet i tests/visual/__screenshots__/ eller via en jämförande gren i check-facit.sh
- [ ] #4 Innehållslåset avgjort: 24 av 27 ytor saknar referenser-fältet och är inte sha256-låsta — beslut om fältet ska vara obligatoriskt för ett stämplat manifest
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
