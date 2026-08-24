---
id: TASK-309.17
title: >-
  Block-dialogens datum-läge saknar ariaSnapshot-par — promoverings-grinden
  täcker 3 av 4 lägen
status: To Do
assignee: []
created_date: '2026-08-24 17:00'
labels:
  - ready-for-agent
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
- [ ] #2 Facit-manifestet för s108-generering bär datum-lägets bild, så AC #1:s 'block-dialog × 4 lägen' är uppfyllt i sak och inte bara i ordalydelse
- [ ] #3 Klarlagt och bokfört om andra block-dialog-lägen eller andra promoverings-grindar har motsvarande täckningsluckor
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
