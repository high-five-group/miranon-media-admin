---
id: TASK-161.8
title: 'Skiva: frys eller återuppliva — tre dok ut ur mellanläget'
status: Done
assignee: []
created_date: '2026-08-07 19:12'
updated_date: '2026-08-08 09:32'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.4
parent_task_id: TASK-161
ordinal: 298000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: de tre mellanläges-doken är antingen ärligt frusna med banderoll eller levande med disk-synk — läsaren kan mekaniskt skilja karta från historik. Täcker användarberättelse: 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 airtable-interaction.md avgjord mot ägar-deklarationens facit: ANTINGEN frys-banderoll (ADR-100 §4:s tre element) + nytt tunt levande kontrakt-dok som pekar på kodens ägda ytor, ELLER fullständig återupplivning mot disk (28 EF, 13 operationer) — beslutet motiveras i PR-texten, aldrig mellanläge
- [x] #2 hur-systemet-funkar.md-tvillingen: deklarerad synk-ägare med riktning (spoken källa, psionautics-kopian bär banderoll med pekare hit) ELLER kapad tvilling — beslut + motivering i PR-texten
- [x] #3 BYGGPLAN-LÄTTLÄST-v3.md klassad mot sin egen text och fas-läget: frys-banderoll eller uppdaterings-plan; vid genuin tveksamhet STOPPA och bokför öppet i stället för att gissa
- [x] #4 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC3 STOP-utfall (genuin tveksamhet, bokfört per kortets egen instruktion):
BYGGPLAN-LÄTTLÄST-v3.md klassad mot byggplan.md §2/§4 — funnen kraftigt
inaktuell (senast uppdaterad 2026-06-25; säger "Fas 6e pågår, sedan 6f/6g/6h"
medan byggplan.md visar 6e/6f/6g/6h ALLA byggda + en helt ny S91-closeout-regel
2026-07-27 (fem facit-lösa ytor: Personer/Hem/Mer/Segment/Mail-handling måste
genom prototyp->Marcus-väljer->facit->PRD->skivor innan Fas 6 stänger) + Fas 7
redan påbörjad parallellt (S95-avvikelsen deploy-pipeline). Varken frys eller
agent-gissad uppdatering valdes: (1) mekanisk drift-rättning räcker inte —
HUR mycket av S91-komplexiteten som ska förenklas till Gunilla-nivå är ett
redaktionellt/stakeholder-beslut, inte en faktakontroll; (2) doket är designat
"levande" (rad 13) för en app som fortfarande byggs — att frysa det vore att
gissa att det inte längre behövs. Full motivering + drift-detaljer skrivna
in i dokets egen header (KÄND DRIFT-banderoll) och Versionshistorik-raden.
Nästa steg äger Marcus: beställ full uppdatering, eller bekräfta frysning.

Premiss-pass-divergenser (ADR-086), registrerade:
- Uppdragets påstående "CLAUDE.md pekar på filen [airtable-interaction.md]
  som kontrakt-ägare" höll INTE mot disk (grep gav 0 träffar i CLAUDE.md).
  Den verkliga aktiva konsumenten är CONTRIBUTING.md §DoD-checklista +
  SECURITY-SPEC.md §6.1 + data-model.md:963 — samma sakliga poäng
  (dokumentet har en riktig konsument, inte en hypotetisk) höll ändå.
- hur-systemet-funkar.md-tvillingens sökväg var FEL på BÅDA sidor:
  spoken angav ~/Repon/psionautics/docs/reference/... (mappen
  docs/reference/ finns inte i psionautics — filen ligger i docs/ direkt);
  psionautics-kopian angav omvänt ~/Repon/miranon-media-admin/docs/... utan
  reference/-prefixet. Rättat på båda sidor i denna landning.
- Twin-repot var inte "manuellt synkat efter varje uppdatering" som spoken
  påstod — senaste psionautics-commit var 2026-04-28 (`53ab498`), 3+ månader
  gammal, och kopian bar redan sin egen förfallna avvecklings-deklaration.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): PR #989 mergad, per-jobb-grön (gh pr checks: 0 fail/pending). Tre mellanläges-beslut, alla motiverade i PR-texten: (1) airtable-interaction TVÅDELAD — nytt tunt levande register §5.0 (28/28 EF mot disk) + gamla narrativet fryst som §5-BILAGA med ADR-100 §4-banderoll; CONTRIBUTING-pekaren följdrättad. (2) Tvillingen KAPAD — psionautics-kopian fryst med banderoll och committad direkt i det repot (d2415cc, konventionen verifierad); sökvägsfel rättade på BÅDA sidor; tvillingen var 3+ månader stale. (3) BYGGPLAN-LÄTTLÄST: STOP-utfall per kortets egen klausul — driften dokumenterad i dokets KÄND DRIFT-banderoll, men Gunilla-nivå-förenklingen av S91-komplexiteten är redaktionellt Marcus-beslut; beställ uppdatering eller bekräfta frysning. Tre premiss-divergenser fångade och bokförda (uppdragets CLAUDE.md-påstående falskt · tvilling-pathen fel åt båda håll · synk-löftet förfallet). Bifynd bokfört: psionautics-remoten pekar på gamla org-namnet. AGENT-SIDAN AV TASK-161 ÄR HÄRMED KOMPLETT — kvar: 161.10 QA (Marcus).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
