---
id: TASK-54.2
title: 'Skiva: Hermetik-vakten byter form till MSW:s callback'
status: To Do
assignee: []
created_date: '2026-07-27 15:07'
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
- [ ] #1 Ohanterat anrop fäller testet — bevisat med rött-först, inte antaget
- [ ] #2 Felmeddelandet namnger den saknade requesten
- [ ] #3 Felmeddelandet listar vad som var mockat
- [ ] #4 Vaktens option är verifierat satt; defaultens tysta genomsläpp kan inte inträffa
- [ ] #5 Den gamla catch-all-routen är borta — hermetiken vaktas av en mekanism
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Negativt self-test bevisar att vakten fäller OCH namnger saknad request + listar mockade
- [ ] #6 Vaktens option verifierad skarpt satt (bindningens default är tyst genomsläpp)
- [ ] #7 Baseline-dispatchen loggar fortfarande 'Inga baseline-ändringar'
- [ ] #8 Ingen befintlig e2e-fil rörd — diffen visar det
<!-- DOD:END -->
