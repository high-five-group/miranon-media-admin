---
id: TASK-194
title: >-
  Facit-hooken nekar varje edit mot ett stämplat manifest, inte bara
  godkand-skrivningar
status: To Do
assignee: []
created_date: '2026-08-10 18:29'
labels:
  - grind
  - facit
  - hook
dependencies: []
ordinal: 359000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hooken deny-facit-godkand-skrivning.sh låser en övergång som ADR-103:s promoveringsform KRÄVER, och den låsningen träffar varje framtida promovering.

MEKANISMEN (verifierad i koden, S103 2026-08-10): scripts/lib/facit-godkand-skrivning.mjs frågar harIckeNullGodkandEfterEdit(...) — alltså om RESULTATET har ett icke-null godkand, inte om ändringen RÖR fältet (rad 103/111: harIckeNullGodkand(content) resp. harIckeNullGodkandEfterEdit). Följden: varje Edit/Write/Bash mot ett redan stämplat manifest nekas, oavsett vilket fält agenten tar i.

LÅSNINGEN, konkret: manifestets ytor[].kallor måste peka på filer som FINNS (facit-validera.mjs kräver existsSync). Före stämplingen är det prototyp-filen. Rivningen (ADR-103 B2 steg 4) byter namn på den — PersonsListPrototyp.tsx blev PersonsList.tsx i S103 — och då MÅSTE kallor uppdateras, annars är check-facit.sh röd. Ingen agent kan utföra den övergången. S103 fastnade skarpt: Marcus fick köra en sed-rad via !-kanalen för att flytta EN sökväg.

VARFÖR DET ÄR EN BUGG OCH INTE AVSIKTEN: ADR-104:s beslut 2 säger att agenter aldrig SÄTTER godkand. En edit som lämnar fältet byte-identiskt sätter det inte. Kanalseparationen är intakt om jämförelsen sker före/efter i stället för på resultatet.

INGEN PRECEDENT ATT LUTA SIG MOT: S102:s rivning i #1133 (PrototypRigg) rörde inget facit-manifest — den uppdaterade en aria.yml-referens. Väggen är alltså oprövad före S103.

RISKEN MED FIXEN, som ska adresseras i bygget: en delta-jämförelse får INTE öppna för att agenten skriver godkand genom att först sätta det till null och sedan till ett värde i två steg, eller genom replace_all-trick. Tvåsidig testsvit krävs — hooken ska fortfarande neka varje FAKTISK sättning, inklusive heredoc/sed/jq-vägarna Kanal B täcker i dag.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hooken jämför godkand FÖRE mot EFTER och nekar endast när fältet faktiskt ändras
- [ ] #2 En edit mot ett stämplat manifest som lämnar godkand byte-identiskt SLÄPPS IGENOM (t.ex. en kallor-sökväg efter rivningens filnamnsbyte)
- [ ] #3 Hooken nekar fortfarande varje faktisk sättning av godkand via Edit, Write OCH Bash (heredoc/redirect/sed/jq), inklusive tvåstegs-försök via null
- [ ] #4 Tvåsidig testsvit: både nekade och släppta fall, med det skarpa S103-fallet (kallor-flytt efter rivning) som positivt test
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
