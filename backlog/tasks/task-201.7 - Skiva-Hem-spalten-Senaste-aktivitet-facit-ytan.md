---
id: TASK-201.7
title: 'Skiva: Hem-spalten Senaste aktivitet (facit-ytan)'
status: To Do
assignee: []
created_date: '2026-08-11 20:26'
updated_date: '2026-08-12 18:40'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.3
  - TASK-201.5
  - TASK-201.6
parent_task_id: TASK-201
ordinal: 372000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: hem-vyn på desktop får sin sista facit-sektion — de senaste aktivitetsposterna i exakt K10-form, länkade till fulla historiken. AC pekar på facit, aldrig på delförändringar (ADR-102 B5). OBS Done-flipp: DoD-posten om facit-identitet kan endast Marcus bocka av (stämplingskanalen npm run facit:godkann är hans, ADR-104) — skivan byggs och landas AFK, granskningen är ett Marcus-moment efteråt.

Täcker användarberättelser: 2, 3, 5, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hem-spalten är identisk med facit tasks/sessions/bilagor/s55-hem-konvergens/facit.json ytan "hem-historikspalten (Senaste aktivitet)" — bilden k10-facit-desktop.png (ADR-102 B5)
- [ ] #2 Spalten renderas ENDAST ≥xl; under xl ingen spalt (historiken nås via Mer per B7); brytpunktsgapet lg↔xl avgörs mot facit-bilden och utfallet bokförs i skivans notes (öppet i manifestet)
- [ ] #3 Länken "Se all aktivitetshistorik ›" navigerar till kärnvyn (201.6)
- [ ] #4 ariaSnapshot-referenser skapade för spalten (ADR-103-mönstret) OCH manifestets kallor för spaltytan uppdaterade med de nya källfilerna i samma landning
- [ ] #5 aria-label bär sektionsnamnet (ingen visuell rubrik); INGA ikoner i posterna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Hem-spalten identisk mot facit-manifestets k10-bild (ADR-102 B5) — Marcus-granskad; manifestet: tasks/sessions/bilagor/s55-hem-konvergens/facit.json
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-08-12 (S105 resume 3) — separatorn i hem-spaltens aktivitetsrader: MITTPUNKT `·`, inte långt tankestreck.

Kollisionen som blockerade skivan: facit-bilden `tasks/sessions/bilagor/s55-hem-konvergens/k10-facit-desktop.png` visar långt tankestreck (—) som separator i alla fyra aktivitetsrader, medan grinden `check-langa-streck` förbjuder det och policyns `_readme` citerar Marcus 2026-08-09: 'ALLA 15 långa bindestreck i användarsynlig text MÅSTE bort' (undantagslistan tömdes då). Två Marcus-beslut stod mot varandra.

Marcus avgjorde i klartext 2026-08-12: 'Inga långa bindestreck får användas, larmar det bara på det så är det ok.' Undantagsvägen i policyn är därmed utesluten, och facit-grindens larm på just denna skillnad är ACCEPTERAT — facit följs inte på den punkten. Valet mellan kort bindestreck och mittpunkt föll på mittpunkt `·`, eftersom den redan är appens separator i samma vy (orkestrerarens rekommendation, ej överprövad).

Skivan är därmed AVBLOCKERAD. Beroendet TASK-201.6 (kärnvyn) kvarstår.
<!-- SECTION:NOTES:END -->
