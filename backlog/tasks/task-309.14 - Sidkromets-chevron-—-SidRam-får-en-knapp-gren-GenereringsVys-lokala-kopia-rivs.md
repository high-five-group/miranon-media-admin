---
id: TASK-309.14
title: >-
  Sidkromets chevron — SidRam får en knapp-gren, GenereringsVys lokala kopia
  rivs
status: Done
assignee: []
created_date: '2026-08-24 16:36'
updated_date: '2026-08-24 17:22'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 577000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-08-24: 'När jag kommer in på bekräftelsebilagans editeringsyta så ser jag att bakåtchevronen sitter för högt upp, jag har varit tydlig med att alla undersidor ska ha samma sidkrom, samma grund, där chevronen sitter längre ned.' Och på frågan om väg: 'INGET lappande.'

REGRESSION mot Marcus eget beslut 2026-08-23, som lever verbatim i SidRam.tsx docblock ('Flytta ner alla. Tanken med sidkromet som komponent var ju att alla undersidor skulle se likadana ut i grunden.') och implementerades som mx-4 mt-2 lg:mt-10.

GenereringsVy.tsx bar en egen KromKnapp — rå <button> vars docblock påstod 'EXAKT DokumentYtas klasser'. Sant när den skrevs, falskt från 2026-08-23 då topp-luften lades till i SidRam men inte i kopian. Den satt därmed både för högt och utan mx-4-indraget. Kopia nummer sju av den geometri ADR-126 just samlat i en primitiv — och den enda som hann glida isär.

Skälet kopian fanns är verkligt men litet: SidRam är wrappad i TanStack Routers createLink och renderar <a href>, medan genereringsvyn går tillbaka INOM sin egen route genom att nolla query-parametern vy. Rätt svar är en andra gren i primitiven, inte en sjunde kopia: geometrin bryts ut till CHEVRON_KLASS och delas av SidRamLink och den nya SidRamKnapp. <button> är dessutom rätt element när ingen URL byts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SidRam.tsx exporterar SidRamKnapp (react-aria-components Button, onTillbaka-callback, obligatorisk tillbakaEtikett) som delar CHEVRON_KLASS med länk-grenen
- [x] #2 GenereringsVy.tsx § KromKnapp är RIVEN; alla tre anropsställen använder SidRamKnapp
- [x] #3 Chevronen i genereringsvyn står på samma höjd och indrag som husets övriga undersidor (mx-4 mt-2 lg:mt-10)
- [x] #4 ariaSnapshot-facit oförändrat — button 'Tillbaka till Dokument' kvar; promoverings-grindens desktop-tester gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad i `d9d973d5` (PR #1889, merge `24c39777`).

**Regression mot Marcus eget beslut 2026-08-23**, som lever verbatim i `SidRam.tsx`s docblock: *"Alla chevrons … sitter ju mycket högre upp än alla andra … Flytta ner alla. Tanken med sidkromet som komponent var ju att alla 'undersidor' skulle se likadana ut i 'grunden'."* Det implementerades som `mx-4 mt-2 lg:mt-10`.

`GenereringsVy.tsx` bar en egen `KromKnapp` — rå `<button>` vars docblock påstod *"EXAKT DokumentYtas klasser"*. Sant när den skrevs, falskt från 2026-08-23 då topp-luften lades till i `SidRam` men inte i kopian. Den satt därmed både för högt och utan `mx-4`-indraget. Kopia nummer sju av den geometri `ADR-126` just samlat i en primitiv — och den enda som hann glida isär.

**Vägen: gren, inte lapp.** Marcus 2026-08-24: *"INGET lappande"*. Skälet kopian fanns är verkligt men litet — `SidRam` är wrappad i TanStack Routers `createLink` och renderar `<a href>`, medan genereringsvyn går tillbaka INOM sin egen route genom att nolla query-parametern `vy`. Det motiverar en andra gren i primitiven, inte en sjunde kopia. `<button>` är dessutom rätt element när ingen URL byts — en `<a>` utan `href` hade varit fel för både skärmläsare och mellanklick.

**#1** `CHEVRON_KLASS` utbruten, delad av `SidRamLink` och nya `SidRamKnapp` (react-aria-components `Button`, obligatorisk `tillbakaEtikett`). **#2** `KromKnapp` riven; alla tre anropsställen använder `SidRamKnapp` (verifierat mot `origin/main`: 0 träffar på `function KromKnapp`, 3 på `<SidRamKnapp tillbakaEtikett`). **#3** `mx-4 mt-2 … lg:mt-10` verifierad i den delade konstanten. **#4** ariaSnapshot-facit oförändrat (`button "Tillbaka till Dokument"` kvar) — promoverings-grindens **desktop-tester 5/5 gröna** mot landad kod.

**DoD-kvittens.** #1 alla AC bockade mot landad kod (belägg i tabellen ovan). #2 lokala grindar för rörd fil-klass gröna: `npm run typecheck` exit 0 · `npx @biomejs/biome check .` exit 0 · `npm run test:acceptance -- dokument` 15/15 · promoverings-grinden visual-desktop 5/5. #3 är en HÄRLEDD rad — Landning: PR #1889 (merge `24c39777`, 12 SUCCESS + 3 SKIPPED, noll fel). #4 path-scopad `git add`, diffen bar tre källfiler och fem kortfiler, inget orelaterat.
<!-- SECTION:FINAL_SUMMARY:END -->
