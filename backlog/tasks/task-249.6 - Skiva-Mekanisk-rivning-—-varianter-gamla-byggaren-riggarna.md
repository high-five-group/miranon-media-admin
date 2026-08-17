---
id: TASK-249.6
title: 'Skiva: Mekanisk rivning — varianter, gamla byggaren, riggarna'
status: To Do
assignee: []
created_date: '2026-08-17 00:35'
updated_date: '2026-08-17 02:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.5
parent_task_id: TASK-249
ordinal: 468000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rivningen är mekanisk eftersom godkännandet redan är stämplat via kanalseparationen (ADR-104). Efter denna skiva finns EN segmentyta i repot. Täcker användarberättelser: kontraktsuppfyllnad, inga nya.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Variant a/b/c, den gamla segment-byggaren, PrototypRigg (utfallslägena), SkalprovsVaxel och variantväxelns segment-nyckel är rivna — flaggor och växlar, aldrig formen (ADR-103)
- [ ] #2 ariaSnapshot-referenserna är ORÖRDA genom rivningen och gröna efteråt — beviset att rivningen tog växlar, aldrig form
- [ ] #3 check-facit är grön: godkand-fältet är satt (stämpel sha a40f3543) så rivningsspärren släpper mekaniskt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s104-segment-divergens/facit.json — rivningen får inte röra någon deklarerad yta
- [ ] #6 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #7 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: orkestreraren S104
created: 2026-08-17 02:07
---
ORKESTRERAR-BOKFÖRING (S104 resume 5, 2026-08-17, natt-orkestreringen): FÖRUTSÄGBAR GRIND-KANT vid rivningen. task-249.1:s låsta referenser tests/visual/__aria__/segment-promoverings-grind.spec.ts/segment-detaljvyn-visual-{desktop,mobile}.aria.yml bär SkalprovsVaxel SYNLIGT (AC #3 partiell på 249.1-kortet: växeln sitter i PublikSektion mitt i samma div som ToggleButtonGroup/Input — flytt hade brutit Marcus-godkänd DOM, ADR-102). När denna skiva river SkalprovsVaxel fäller ariaSnapshot-matchningen (children: 'contain' kräver att referensens noder FINNS) de två referenserna. DoD-kravet 'referenserna orörda och gröna efteråt' är därför mekaniskt ouppfyllbart för exakt dessa två. LÖSNING KRÄVER KVITTENS: re-låsning av de två referenserna i rivnings-committen är den mekaniska konsekvensen av den redan beslutade rivningen (ytformen ToggleButtonGroup/Input består), men 'orörda' omtolkas inte tyst — Marcus kvitterar formen innan 249.6-agenten bockar det DoD-ledet. Byggagenten: bygg allt övrigt, STOPPA på detta led om kvittens saknas.
---
<!-- COMMENTS:END -->
