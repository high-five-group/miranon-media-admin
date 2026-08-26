---
id: TASK-309.26
title: >-
  Fynd: förhandsgranskningens PDF-fönster blockeras av webbläsaren och toasten
  bär prototyp-text i den skarpa ytan
status: To Do
assignee: []
created_date: '2026-08-26 02:59'
updated_date: '2026-08-26 04:18'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 592000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-26 (S108 resume 11), ordagrant: 'Jag tryckte sedan på förhandsgranska och pdf:en skapades och när den va klar kom de grön inforuta upp "Bekräftelsebilagan är klar att granska. Webbläsaren stoppade det nya fönstret. Öppna det härifrån i stället. (Prototyp: ingen PDF sparas.)". Detta är bara i prototypen eller? Skarpt så måste ju ett chromefönster öppnas direkt.'

TVÅ DEFEKTER, samma ställe (src/components/dokument/GenereringsVy.tsx rad ~995–1003):
(1) Texten '(Prototyp: ingen PDF sparas.)' är en kvarleva från prototypen i den PROMOVERADE ytan — ADR-103 B2 steg 4 säger att prototypens växlar och texter rivs; denna missades. Förhandsgranskningen sparar mycket riktigt ingen PDF (utkast-vägen, ADR-124), men ordet 'Prototyp' är fel i prod. Skriv om eller ta bort: säg det som är sant för användaren ('Förhandsgranskningen sparas inte — tryck Skapa för att spara bilagan') eller inget alls.
(2) Fönstret blockeras: window.open anropas EFTER det asynkrona EF-svaret, utanför användarhändelsens synkrona fönster, så webbläsarens popup-skydd stoppar det (Chrome/Safari kräver att window.open sker i direkt respons på ett klick). Fallback-knappen finns, men Marcus krav är att fönstret öppnas DIREKT.

RESEARCH FÖRST, cite: branschmönstret är att öppna fönstret SYNKRONT i klickhanteraren (window.open('', '_blank') eller about:blank med noopener) och sätta dess location när PDF:en är klar; alternativt rendera PDF:en i samma flik (navigering) eller i en overlay (iframe/objekt) — jämför med hur kvittoförhandsgranskningen (preview-receipt) gör i dag, ytan ska vara konsekvent. Väg för fel: om EF:en faller ska det förhandsöppnade fönstret stängas eller visa ett läsbart fel, aldrig en tom flik. Tänk på mobil (375 px): nya fönster beter sig annorlunda på iOS Safari — bokför vad som gäller där.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Prototyp-texten borta ur den skarpa ytan; toasten säger något sant och Gunilla-begripligt om att förhandsgranskningen inte sparas — svep hela src/components/dokument efter fler 'Prototyp'-kvarlevor och bokför
- [ ] #2 Förhandsgranskningen öppnas direkt i nytt fönster utan popup-blockering i Chrome och Safari (desktop) — bevisat med Playwright (context.waitForEvent('page')) och manuellt i Chrome; fallback-knappen finns kvar för det fall webbläsaren ändå blockerar
- [x] #3 Felväg: EF-fel ger inget tomt fönster kvar; felmeddelande i husets mönster
- [x] #4 Kvittoförhandsgranskningen och bilageförhandsgranskningen delar samma öppningsmönster (konsekvens) — eller avvikelsen är bokförd med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
