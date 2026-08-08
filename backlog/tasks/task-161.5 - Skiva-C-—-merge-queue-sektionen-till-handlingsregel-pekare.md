---
id: TASK-161.5
title: 'Skiva: C — merge-queue-sektionen till handlingsregel + pekare'
status: Done
assignee: []
created_date: '2026-08-07 19:07'
updated_date: '2026-08-08 07:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.2
parent_task_id: TASK-161
ordinal: 295000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: auto-load-ytans största sektion (11 660 tecken) krymper till regel-tät form utan att någon handlingsregel förloras — underlaget bor hemma och pekas. Täcker användarberättelser: 2, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLAUDE.md § Landning sker via MERGE QUEUE omformad: handlingsreglerna bevaras ORDAGRANT (armera med --auto · armera aldrig under bygg-agent · draft-eller-armera-regeln · disambiguerings-receptet · autoMergeRequest-tabellen · svep-regeln) — underlaget (strict-historiken, mäthistorikerna, dequeue-mätningen, Temporal-namngivningen) flyttar till sin utpekade hemvist (CONTRIBUTING § Landnings-ordningen / ADR-076 / ADR-096 / research-filer) med pekare
- [x] #2 Varje flytt prövad mot i-ögonblicket-kriteriet (regeln gäller där ingen slår upp en ADR) och de befintliga varför-raden-står-här-blocken RÖRS INTE utan explicit prövning bokförd i PR-texten; ingen kunskap raderas — allt flyttat är lychee-verifierat nåbart
- [x] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön; diffen visar sektionens tecken-tal före/efter i PR-texten
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): PR #971 mergad 3f4ca4a7, per-jobb-grön (gh pr checks: 0 fail/pending). Merge-queue-sektionen 11 660 → 8 605 tecken (−26,2 %); sex handlingsregler diff-verifierade byte-identiska mot original; underlag flyttat med pekare: strict-historiken → ADR-076 (fanns redan), Temporal-namngivningen → ADR-096 (fanns redan), dequeue/enqueue-mätningen → research-filen (fanns redan), mäthistoriken #705/#796 → NY text i CONTRIBUTING § Landnings-ordningen (fanns INTE där sedan innan, grep-verifierat). Ett av två varför-block eliminerat efter bokförd prövning (ren retrospektiv, redan dubblerad i ADR-076); det andra bevarat. Två extra kompressioner (TASK-128-/TASK-115-PR-listorna) bokförda öppet i PR-texten, källorna verifierade bära full detalj. Lychee 0 fel på 3 810 länkar.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
