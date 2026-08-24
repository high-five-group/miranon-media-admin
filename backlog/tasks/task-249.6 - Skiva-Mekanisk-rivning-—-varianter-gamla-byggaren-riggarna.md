---
id: TASK-249.6
title: 'Skiva: Mekanisk rivning — varianter, gamla byggaren, riggarna'
status: Done
assignee: []
created_date: '2026-08-17 00:35'
updated_date: '2026-08-24 13:09'
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
- [x] #1 Variant a/b/c, den gamla segment-byggaren, PrototypRigg (utfallslägena), SkalprovsVaxel och variantväxelns segment-nyckel är rivna — flaggor och växlar, aldrig formen (ADR-103)
- [x] #2 ariaSnapshot-referenserna är ORÖRDA genom rivningen och gröna efteråt — beviset att rivningen tog växlar, aldrig form
- [x] #3 check-facit är grön: godkand-fältet är satt (stämpel sha a40f3543) så rivningsspärren släpper mekaniskt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s104-segment-divergens/facit.json — rivningen får inte röra någon deklarerad yta
- [x] #6 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [x] #7 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: orkestreraren S104
created: 2026-08-17 02:07
---
ORKESTRERAR-BOKFÖRING (S104 resume 5, 2026-08-17, natt-orkestreringen): FÖRUTSÄGBAR GRIND-KANT vid rivningen. task-249.1:s låsta referenser tests/visual/__aria__/segment-promoverings-grind.spec.ts/segment-detaljvyn-visual-{desktop,mobile}.aria.yml bär SkalprovsVaxel SYNLIGT (AC #3 partiell på 249.1-kortet: växeln sitter i PublikSektion mitt i samma div som ToggleButtonGroup/Input — flytt hade brutit Marcus-godkänd DOM, ADR-102). När denna skiva river SkalprovsVaxel fäller ariaSnapshot-matchningen (children: 'contain' kräver att referensens noder FINNS) de två referenserna. DoD-kravet 'referenserna orörda och gröna efteråt' är därför mekaniskt ouppfyllbart för exakt dessa två. LÖSNING KRÄVER KVITTENS: re-låsning av de två referenserna i rivnings-committen är den mekaniska konsekvensen av den redan beslutade rivningen (ytformen ToggleButtonGroup/Input består), men 'orörda' omtolkas inte tyst — Marcus kvitterar formen innan 249.6-agenten bockar det DoD-ledet. Byggagenten: bygg allt övrigt, STOPPA på detta led om kvittens saknas.
---

author: bygg-agent TASK-249.6
created: 2026-08-17 07:45
---
RE-LÅSNINGEN GENOMFÖRD MED MARCUS-KVITTENS (2026-08-17). DoD #7 är bockad i den KVITTERADE formen, inte i bokstavlig "orörda"-mening — här är exakt vad som mättes, så bockningen inte omtolkar ordet tyst.

MEKANIKEN, precis som orkestreraren förutsåg i kommentar #1: rivningen av SkalprovsVaxel tar bort tre noder som låg INUTI segment-detaljvyns testid-scope (PublikSektions delade kontrolldiv). RÖTT-FÖRST MÄTT före re-genereringen: 12 passed, 2 failed — och de två röda var exakt segment-detaljvyn i visual-desktop respektive visual-mobile. Ingen annan referens berördes; premissen att bara dessa två bär växeln är därmed mekaniskt belagd, inte antagen.

RE-GENERERINGEN scopades med -g "segment-detaljvyn" --update-snapshots så inga andra referenser kunde röras.

BEVISET (git diff --stat mot HEAD, tests/visual/__aria__/): 2 files changed, 10 deletions(-) — NOLL insertions. De 12 övriga referensfilerna är byte-identiska. Diffen i de två består uteslutande av SkalprovsVaxels tre noder: dess paragraph med "Prototyp-rigg.", paragrafen om de fjorton förskapade grupperna, och knappen /Skalprov: fyll publiken till \\d+ personer/. Raderna omkring står oförändrade — radiogroup "Visa i publiken" med sina tre radios före, list "Personer i publiken" med båda listitem efter, och hela region "Regeln". Ytformen (ToggleButtonGroup/Input) består alltså rad för rad; det som försvann var växeln.

EFTERÅT: aria-grinden 14/14 grön (PLAYWRIGHT_VISUAL_DEV_SERVER=1, visual-desktop + visual-mobile), check-facit exit 0.

DoD #6 är bockad som historiskt uppfyllt: referenserna låstes ur variant d i TASK-249.1 FÖRE flippen (TASK-249.5) — denna skiva bryter inte den enkelriktade ordningen, den är den sista etappen i den.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och landad i natt-orkestreringen S104 2026-08-17 (resume 5, Opus-agent per ADR-089-avvikelse). CI grön per jobb + merge-kö-verifikat. Stängd av orkestreraren efter landnings-verifiering mot origin/main.

S112 bokföringspass (2026-08-24): PR #1501 MERGED, CI SUCCESS (verifierad gh pr view). DoD #3 bockad mot detta (missad i första svepet, rättad direkt).
<!-- SECTION:FINAL_SUMMARY:END -->
