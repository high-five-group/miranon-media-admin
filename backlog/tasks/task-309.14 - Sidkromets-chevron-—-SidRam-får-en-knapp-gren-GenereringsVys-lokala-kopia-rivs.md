---
id: TASK-309.14
title: >-
  Sidkromets chevron — SidRam får en knapp-gren, GenereringsVys lokala kopia
  rivs
status: To Do
assignee: []
created_date: '2026-08-24 16:36'
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
- [ ] #1 SidRam.tsx exporterar SidRamKnapp (react-aria-components Button, onTillbaka-callback, obligatorisk tillbakaEtikett) som delar CHEVRON_KLASS med länk-grenen
- [ ] #2 GenereringsVy.tsx § KromKnapp är RIVEN; alla tre anropsställen använder SidRamKnapp
- [ ] #3 Chevronen i genereringsvyn står på samma höjd och indrag som husets övriga undersidor (mx-4 mt-2 lg:mt-10)
- [ ] #4 ariaSnapshot-facit oförändrat — button 'Tillbaka till Dokument' kvar; promoverings-grindens desktop-tester gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
