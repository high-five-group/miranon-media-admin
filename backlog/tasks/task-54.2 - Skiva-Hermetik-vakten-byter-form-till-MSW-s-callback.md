---
id: TASK-54.2
title: 'Skiva: Hermetik-vakten byter form till MSW:s callback'
status: Done
assignee: []
created_date: '2026-07-27 15:07'
updated_date: '2026-07-27 19:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-54.1
parent_task_id: TASK-54
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
När ett test gör ett anrop som ingen handler täcker, fälls testet med ett besked som säger VILKEN request som saknade handler och listar vad som faktiskt VAR mockat. Utvecklaren ser direkt om hen stavat fel eller glömt helt, i stället för att få ett anonymt fel ur avlyssningslagret och behöva gissa.

Formen är lånad från Ghost: felet pekas på testet, inte kastas inne i mockningsbiblioteket. Deras uppställning är en annan — annan testrunner — men felformen är bättre oavsett vilken mekanism som bär den, och det är den som lånas.

Efter skivan är den gamla catch-all-routen borta. Hermetiken vaktas av en enda mekanism i stället för två parallella, och vakten sitter där mockningen sker.

FÄLLAN SOM STYR SKIVAN: bindningens option för ohanterade anrop har defaultvärdet genomsläpp — inte varning, vilket är biblioteksfamiljens vanliga default. Sätts optionen inte alls är vakten AVSTÄNGD, tyst, och sviten ser fortsatt hermetisk ut medan den släpper igenom allt. Optionen måste därför verifieras skarpt satt, inte antas. Av samma skäl duger inte de inbyggda strängnivåerna: de hoppar över statiska tillgångar innan strategin tillämpas. Vakten skrivs som callback som tar hela beslutet själv.

VERIFIERING: negativt self-test i husets rött-först-form — ett test som medvetet gör ett omockat anrop, körs rött först och grönt efter, med båda körningarna pushade ihop. Beviset ska visa tre saker: att testet FÄLLS, att felmeddelandet NAMNGER den saknade requesten, och att det LISTAR vad som var mockat. En grön svit kan aldrig bevisa något av dem.

Därtill: baseline-genereringen via workflow-dispatch ska fortfarande logga "Inga baseline-ändringar". Att byta vakt får inte ändra en enda pixel.

Ingen befintlig e2e-fil rörs.

Täcker användarberättelser: 2, 3, 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ohanterat anrop fäller testet — bevisat med rött-först, inte antaget
- [x] #2 Felmeddelandet namnger den saknade requesten
- [x] #3 Felmeddelandet listar vad som var mockat
- [x] #4 Vaktens option är verifierat satt; defaultens tysta genomsläpp kan inte inträffa
- [x] #5 Den gamla catch-all-routen är borta — hermetiken vaktas av en mekanism
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DoD #7 STÅR ÖPPEN 2026-07-27 — motiverad, ej förbisedd.

Punkten kräver att baseline-dispatchen loggar 'Inga baseline-ändringar'. TASK-55 bokför att de incheckade linux-baselines är stale sedan S90, så en dispatch skulle rapportera ändringar oavsett vad denna skiva gjorde — och riskera att öppna en baseline-PR som blandar S90:s drift med vaktbytet. En känt brusig mätning bevisar ingenting; den skulle bara se ut att göra det.

Vad som ÄR bevisat lokalt: darwin-baselines helt orörda genom bytet (git status mot tests/visual/__screenshots__/ tom), och full visuell svit 22/22 grön. Renderingen är alltså identisk på den plattform som kunde mätas rent.

Punkten kan bockas när TASK-55 är löst och dispatchen ger en ren signal. Kortet står därför In Progress i väntan på Marcus beslut om dispatch-körningen — Done-flippen hålls tillbaka hellre än att en obockad DoD-punkt döljs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit a1c78f9 · CI-run 30286774918 per jobb (8/8, full staging-svit) · CI-grön-första-pass: ja · defekter under körning: 1 (självfångad före commit: */ i citerat glob-mönster stängde JSDoc-blocket) · TDD: 2 cykler (rött 1: modul saknas · rött 2: 'Expected to fail, but passed' med vakten byggd men ej inkopplad → grönt 5/5) · review-pass: UTEBLEV (AgentTool-regeln, märkt i T86-loggen) · DoD 7 stängd 2026-07-27 av dispatch-run 30297097792: 'Inga baseline-ändringar'
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Negativt self-test bevisar att vakten fäller OCH namnger saknad request + listar mockade
- [x] #6 Vaktens option verifierad skarpt satt (bindningens default är tyst genomsläpp)
- [x] #7 Baseline-dispatchen loggar fortfarande 'Inga baseline-ändringar'
- [x] #8 Ingen befintlig e2e-fil rörd — diffen visar det
<!-- DOD:END -->
