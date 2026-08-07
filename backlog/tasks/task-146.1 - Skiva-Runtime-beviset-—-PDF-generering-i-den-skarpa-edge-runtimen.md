---
id: TASK-146.1
title: 'Skiva: Runtime-beviset — PDF-generering i den skarpa edge-runtimen'
status: To Do
assignee: []
created_date: '2026-08-07 09:04'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-146
ordinal: 240000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Innan något byggs ovanpå antagandet att vi kan generera PDF:er inom plattformen ska antagandet stängas skarpt. Research-passet mätte biblioteket under Node som MEDVETEN PROXY eftersom Deno saknades i den körmiljön, och redovisade öppet att beteendet i den skarpa runtimen är overifierat. Denna skiva finns enbart för att stänga den luckan — den är grind mot resten av kortet, inte en byggsten.

Känd öppen risk att hålla utkik efter: ett avbrytande fel i runtimen ('cancelled by supervisor') är rapporterat i plattformens egen diskussionsyta utan känd rotorsak.

Täcker användarberättelser: 9
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En minimal edge-funktion genererar en PDF i den RIKTIGA Supabase-runtimen — inte under Node
- [ ] #2 Svenska tecken (å ä ö Å Ä Ö) återges korrekt med bibliotekets inbyggda typsnitt, verifierat i den genererade filen
- [ ] #3 Minnesåtgång, CPU-tid och kallstart mätta och bokförda mot plattformens tak
- [ ] #4 Utfallet bokfört som BEVIS eller som FALSIFIERING — faller det, stoppas kortets övriga arkitektur och alternativet omprövas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [ ] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [ ] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
