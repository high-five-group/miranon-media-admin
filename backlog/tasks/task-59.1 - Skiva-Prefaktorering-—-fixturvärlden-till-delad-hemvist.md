---
id: TASK-59.1
title: 'Skiva: Prefaktorering — fixturvärlden till delad hemvist'
status: To Do
assignee: []
created_date: '2026-07-27 20:40'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-59
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fixturvärlden (handlers mot EF-protokollet, seedad session, frusen klocka, pinnade typsnitt, hermetik-vakten och dess tillgångar) flyttas ut ur sin visual-hemvist till en hemvist som är delad mellan testklasser. De sju visuella spec-filerna följer med i sina imports.

BETEENDET ÄNDE-TILL-ÄNDE: ingenting ändras. En utvecklare som kör den visuella sviten före och efter flytten ska få exakt samma utfall — samma antal tester, samma bilder, noll baseline-avvikelse. Skivan gör nästa skiva enkel; den levererar ingen ny förmåga och ska inte låtsas göra det.

VARFÖR EGEN SKIVA: korrekthetsbeviset är att baselines är oförändrade. Det är ett skarpt mekaniskt påstående som grumlas om flytten buntas med nybygge, och flytten är återställbar ensam.

FÄLLA ATT KÄNNA TILL: snapshot-sökvägarnas mall är byggd på testkatalogen. Spec-filerna flyttar INTE, bara stödmodulerna — men den som frestas flytta även specarna river baseline-sökvägarna. Verifiera mot mallen innan något spec-läge rörs.

Täcker användarberättelser: 4
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fixturvärldens stödmoduler bor i en hemvist som inte är visual-specifik, och namnet säger att den är delad
- [ ] #2 Samtliga sju visuella spec-filer importerar från den nya hemvisten; ingen kvarvarande referens pekar på den gamla
- [ ] #3 Den visuella sviten är GRÖN med NOLL baseline-avvikelse — mätt före och efter, inte antaget
- [ ] #4 Referenser till den gamla sökvägen i konfiguration och docblock är uppdaterade, så nästa läsare inte skickas fel
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
