---
id: TASK-309.26
title: >-
  Fynd: förhandsgranskningens PDF-fönster blockeras av webbläsaren och toasten
  bär prototyp-text i den skarpa ytan
status: To Do
assignee: []
created_date: '2026-08-26 02:59'
updated_date: '2026-08-28 03:39'
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## S108 resume 13 (2026-08-28) — AC #2 stängd med ett bevis som faktiskt mäter popup-policy

### Vad #1996 + rundorna landade (verifierat, inte antaget)
PR #1996 MERGED 2026-08-26T07:05:35Z, head 692b802e, merge-commit ae5c7046. Review-rundorna f7d42936 (runda 1: stängt-fönster-vakt, viewport, delad laddningssida) och 48667c8d (runda 3: closed-guard i förhandsvisa, HTML-escaping) verifierade med git log. Koden var REDAN synkron före detta pass: GenereringsVy.tsx rad 732 — window.open med tom URL och _blank är FÖRSTA satsen i skapaDokument, före mutate(); DokumentYta.tsx rad 1094 samma. Ingen omskrivning behövdes — AC #2 saknade bara ett giltigt bevis.

### DIVERGENS mot uppdraget (ADR-086): uppdragets bevisform var omöjlig
Uppdraget bad om ett Playwright-test i Chromium med default popup-policy, alltså utan flaggan --disable-popup-blocking. Den premissen är FALSIFIERAD av mätning 2026-08-28:

| binär / läge | synkron | asynkron 3/6/10 s | utan gest |
|---|---|---|---|
| Chromium, Playwright-default | öppnad | öppnad | öppnad |
| Chromium, UTAN flaggan | öppnad | öppnad | ÖPPNAD |
| Google Chrome, Playwright-default | öppnad | öppnad | (ej mätt) |
| Google Chrome, UTAN flaggan | öppnad | BLOCKERAD | (ej mätt) |

Playwrights bundlade Chromium blockerar ALDRIG en popup — inte ens en helt gestlös. playwright-core 1.62.1 lib/coreBundle.js chromiumSwitches skickar --disable-popup-blocking vid varje launch, och att ta bort den (verifierat borta ur processens kommandorad via ps) ändrar ingenting. Följd: de sex befintliga testerna i dokument-generering-fonster-direkt bevisar SYNKRONITETEN (fönstret finns före det fördröjda EF-svaret) men INTE frånvaro av popup-blockering — de hade passerat även för den gamla, asynkrona koden.

### Vad som byggdes
NY FIL tests/acceptance/dokument-forhandsgranskning-popup-policy.acceptance.test.ts — riktig Google Chrome (channel chrome) med popup-blockeraren PÅ (ignoreDefaultArgs med --disable-popup-blocking), 6000 ms EF-fördröjning (över Chromes transient-activation-tak cirka 5 s). Två led i samma browser, kontext och sida: LED 1 appens Förhandsgranska-knapp öppnar sitt fönster och navigerar till PDF-URL:en; LED 2 negativ kontroll — en injicerad knapp med det GAMLA mönstret (await först, window.open sedan) får null tillbaka. Utan led 2 vore led 1 värdelöst. Skip-guard om Chrome saknas (probe i beforeAll), så CI inte blir rött av miljöskäl.

### Bevis i BÅDA riktningar
GRÖNT på nuvarande kod: exit 0, 4 av 4 vid --repeat-each=4, 9 av 9 med hela klassen, samt headed (--headed) exit 0.
RÖTT på regresserad kod: window.open flyttat tillbaka in i onSuccess gav exit 1, browserContext.waitForEvent timeout — ingen flik öppnades alls, den blockerades. Koden återställd verbatim.

### Fynd värt att minnas (lessons.d-fragment tillagt)
page.evaluate FÖRNYAR sidans transient user activation. Mätt: tyst waitForTimeout gav BLOCKERAD (isActive false); page.evaluate var 100:e ms (det som expect.poll gör) gav ÖPPNAD (isActive true). Ett expect.poll i den negativa kontrollen gör alltså mätningen meningslös, tyst. Första versionen gick i fällan. Dessutom: den öppnade fliken tar fokus, appens sida blir bakgrundsflik, och Chrome strypar timers där — testet fällde med undefined i full svit men passerade ensamt; löst med close på fliken plus bringToFront och tilltagen marginal.

### Öppet, ej bevisat av denna agent
Safari desktop (AC #2 nämner den) — Playwrights WebKit är inte installerad i miljön (Executable doesn't exist, webkit-2336), och WebKit är dessutom inte Safari. Bokförs som Marcus-verifiering. Mekaniskt talar allt för att den håller: Safari är strängare än Chrome och kräver samma synkrona öppning, och samma mönster är redan i skarp drift i useForhandsvisaDokument.ts.
CI-BESLUT SOM INTE TOGS HÄR: filen kräver installerad Google Chrome. Vill man göra den till hård CI-grind räcker playwright install chrome i workflowen — flaggas till orkestreraren, ej beslutat av mig.

### Grindar (exitkoder lästa naket, aldrig genom pipe)
typecheck: 0 · biome check: 0 · build: 0 · check-langa-streck: 0 · check:docs: 0 (14 gröna) · playwright acceptance, 3 filer: 0 med 9 passed
<!-- SECTION:NOTES:END -->
