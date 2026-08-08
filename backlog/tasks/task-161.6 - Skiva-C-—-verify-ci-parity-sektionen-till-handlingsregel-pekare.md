---
id: TASK-161.6
title: 'Skiva: C — verify:ci-parity-sektionen till handlingsregel + pekare'
status: Done
assignee: []
created_date: '2026-08-07 19:09'
updated_date: '2026-08-08 07:37'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.5
parent_task_id: TASK-161
ordinal: 296000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: näst största auto-load-sektionen (6 976 tecken) blir regel-tät utan förlorad handlingskraft. Täcker användarberättelser: 2, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CLAUDE.md § verify:ci-parity omformad i samma form som 161.5: handlingsregeln (kör INTE före varje push + de tre lägena) bevaras ordagrant; mätserierna, härlednings-mekaniken och diff-klassnings-detaljerna flyttar till research-filen/skriptets huvud med pekare; dubbletten av mättalen (två kopior i samma fil, 73 rader isär) elimineras till EN
- [x] #2 Samma prövnings- och bevarande-regler som 161.5 (i-ögonblicket-kriteriet, varför-block orörda utan prövning, lychee på pekare)
- [x] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön; tecken-tal före/efter i PR-texten
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): PR #977 mergad 5ae24ac4, per-jobb-grön (gh pr checks: 0 fail/pending). verify:ci-parity-sektionen 7 454 → 5 949 tecken (−20,2 %) — agenten mätte om själv: kortets 6 976 var inaktuellt efter 161.2:s D0-glob-expansion samma dag, det verkliga talet användes. Handlingsregeln programmatiskt verifierad byte-identisk (re-extraktion + jämförelse). Mätserie-dubbletten (två kopior 73 rader isär) eliminerad: ADR-036 § Updates 2026-08-05 bär sammanfattningen, research-filen fullserien, skriptets huvud härlednings-/klassnings-mekaniken — alla tre verifierade bära innehållet FÖRE pekare sattes. Ett varför-block föll efter prövning (ordagrant dublett i ADR-036), ett höll. Stray-pekaren 'se § Acceptance-klassen' rättad till CONTRIBUTING. D0-glob-VÄRDENA medvetet orörda (nyss disk-fixade, referensdata). Fullt DoD grönt inkl. test:api 465/465.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
