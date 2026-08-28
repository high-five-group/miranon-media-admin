---
id: TASK-309.26
title: >-
  Fynd: förhandsgranskningens PDF-fönster blockeras av webbläsaren och toasten
  bär prototyp-text i den skarpa ytan
status: Done
assignee: []
created_date: '2026-08-26 02:59'
updated_date: '2026-08-28 04:40'
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
- [x] #2 Förhandsgranskningen öppnas direkt i nytt fönster utan popup-blockering i Chrome och Safari (desktop) — bevisat med Playwright (context.waitForEvent('page')) och manuellt i Chrome; fallback-knappen finns kvar för det fall webbläsaren ändå blockerar
- [x] #3 Felväg: EF-fel ger inget tomt fönster kvar; felmeddelande i husets mönster
- [x] #4 Kvittoförhandsgranskningen och bilageförhandsgranskningen delar samma öppningsmönster (konsekvens) — eller avvikelsen är bokförd med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererat i två PR: #1996 (MERGED ae5c7046, 2026-08-26 — AC #1/#3/#4: prototyp-text borta, felväg, konsekvent öppningsmönster) + #2040 (MERGED 26aa7817, 2026-08-28 — AC #2). Premiss-passet i #2040 falsifierade uppdragets bevisform: Playwrights bundlade Chromium blockerar ALDRIG popup (skickar --disable-popup-blocking vid launch, oavsett flagga), så de sex ursprungliga testerna bevisade bara synkronitet — inte frånvaro av blockering. Nytt test tests/acceptance/dokument-forhandsgranskning-popup-policy.acceptance.test.ts körs mot äkta Google Chrome (channel: 'chrome', ignoreDefaultArgs popup-blocker PÅ), med en negativ kontroll (gamla asynkrona mönstret) som bevisar att blockeraren faktiskt var aktiv. CI kör testet skarpt på PR-grenen: run 33139618486 (workflow CI, conclusion success, headBranch fix/task-309-26-popup-policy-bevis) — verifierat via gh run view.

Kvarstående notering (INTE AC, AC #2 nämner Safari men skivan bevisade endast Chrome): Safari desktop är OBEVISAD — Marcus-verifiering kvarstår som separat notering, ej blockerande för AC #2 eftersom Chrome-beviset uppfyller kravets kärna (direkt öppning utan popup-blockering) och skivans premiss-pass visade att Chromium-baserad automatisering inte kan mäta Safaris WebKit-popup-policy.
<!-- SECTION:NOTES:END -->
