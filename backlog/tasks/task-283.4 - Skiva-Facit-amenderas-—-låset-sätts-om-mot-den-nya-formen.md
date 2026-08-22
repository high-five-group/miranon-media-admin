---
id: TASK-283.4
title: 'Skiva: Facit amenderas — låset sätts om mot den nya formen'
status: To Do
assignee: []
created_date: '2026-08-21 08:55'
updated_date: '2026-08-22 12:11'
labels:
  - ready-for-human
dependencies:
  - TASK-283.3
parent_task_id: TASK-283
ordinal: 513000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Facit amenderas så att den låsta ytan beskriver den yta som faktiskt finns.

DENNA SKIVA FÅR INTE PLOCKAS SOM EN VANLIG POST I KÖN. Den är spärrad bakom Marcus visuella godkännande av bokstavsraden, och ordningen är enkelriktad.

ÄNDE TILL ÄNDE: Marcus tittar på den färdiga raden i den körande appen. Godkänner han den — och FÖRST då — regenereras promoverings-grindens sex referenser, och hans ord skrivs in i facit-manifestet som en daterad amendering som beskriver vad som lagts till och vad som lämnats orört. Därefter är låset satt igen, mot den nya formen.

VARFÖR ORDNINGEN INTE FÅR KASTAS OM: låt bygget regenerera referenserna själv och låset återställs av samma arbete som bröt det. Då kan det per definition aldrig fånga den förändring det finns för. Detta är väg A av tre, valt av Marcus 2026-08-21; den generella mekaniken för att amendera ett stämplat facit saknas fortfarande i repot och är en egen öppen tråd.

Det röda fönster som öppnades i skiva två stängs här. Skivan är inte klar förrän samtliga sex referenser är gröna igen.

Täcker användarberättelser: inga nya — säkrar formen som skiva 2 och 3 byggde.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus har SETT den färdiga bokstavsraden i körande app och godkänt den i klartext
- [ ] #2 FÖRST därefter regenereras promoverings-grindens sex ARIA-referenser
- [ ] #3 Facit-manifestet tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json bär en daterad amendering med Marcus citat, som säger vad som lagts till och vad som lämnats orört
- [ ] #4 Samtliga sex referenser är gröna igen — det röda fönstret från skiva 2 är stängt
- [ ] #5 Regenereringen ligger i EGEN commit, aldrig i samma landning som formändringen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-manifestet amenderat med Marcus citat FÖRE ARIA-referenserna regenereras (ADR-102 väg A, T157)
- [ ] #6 Personlistans rad- och listform granskad mot facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — bokstavsraden är ett TILLÄGG ovanför listan och rör inget låst formbeslut
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ÖVERLÄMNING FRÅN TASK-285.11 (2026-08-22, S109 resume 3) — visual-baslinjen hör hit.

TASK-285.11 kunde inte ta sin AC #4 (visual-baslinje för notis, offline, chunk-banner, meddelanderutan) utan att samtidigt skriva om personlistans pixel-lås. Skälet är mätt: visual-baselines.yml kör hela sviten med --update-snapshots, personer.spec.ts bär fyra baselines (två linux), och TASK-286.3 (1b226272) har redan ändrat personlistans sortering. TASK-283.2 ändrar samma yta igen.

Att ta baslinjen före denna skiva vore samma felklass som detta korts egen text förbjuder på struktur-axeln: låset får inte återställas av arbetet som bröt det.

DENNA SKIVA BÄR DÄRFÖR TVÅ LÅS, INTE ETT:
1. ariaSnapshot-referenserna (kortets ursprungliga scope) — sex referenser, brutna sedan TASK-286.3 och vidgade av TASK-283.2
2. Pixel-baslinjerna — notisfamiljens fyra ytor (TASK-285.11 AC #4) plus personlistans egna

Båda regenereras EFTER Marcus godkännande av den färdiga formen, aldrig före. En dispatch, ett granskningstillfälle.

FÖRKRAV ATT MÄTA FÖRE DISPATCH: 'Allow GitHub Actions to create and approve pull requests' är en tre-nivåers kedja (enterprise → org → repo) som slogs AV när repot flyttades till org 2026-07-27. Utan den failar workflowen på gh pr create (empiriskt: run 30079692827, run 30292488425). Se visual-baselines.yml filhuvud. Mät den INNAN dispatchen avfyras — inte mitt i.
<!-- SECTION:NOTES:END -->
