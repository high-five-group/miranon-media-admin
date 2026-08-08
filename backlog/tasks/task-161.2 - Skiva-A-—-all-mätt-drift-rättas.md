---
id: TASK-161.2
title: 'Skiva: A — all mätt drift rättas'
status: Done
assignee: []
created_date: '2026-08-07 19:03'
updated_date: '2026-08-08 06:44'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-161
ordinal: 292000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter landningen motsäger ingen styrande prosa disk — de åtta mätta drift-instanserna plus bifynden är rättade eller eliminerade. Täcker användarberättelser: 1, 11
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga drift-instanser ur Explore-kartan (S99 Del 10-referensen) rättade mot disk-facit: airtable-interaction EF-antal + operationsregister + radreferenser; byggplanens döda auktoritets-pekare + ADR-räkningen; CLAUDE.md:s token-exempel (verifiera mot faktiska tokens i src/styles/tokens/) + D0-glob-kopian (mot ci.yml:s paritetsmarkörer) + grind-talens fria kopior; README-badges mot rätt org; ci.yml rad ~573-kommentaren (9→14); hur-systemet-funkar-datummotsägelsen
- [x] #2 tasks/lessons.md RÖRS INTE (volym-split-skivan äger den filen inkl. stale-raderna); varje rättelse är eliminering ELLER disk-synk — ingen ny kopia föds
- [x] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-08 06:23
---
AC3 EJ AVBOCKAD — falsifierad premiss (ADR-086 premiss-pass). Verifierat mot disk (grep hela src/, git log): AtgardsSida.tsx konsumerade tidigare var(--mm-color-primary) (odefinierad token), men buggen är REDAN FIXAD i commit 9d1875ea ([S100][T134] varv 14, 2026-08-07 18:22) — LANDAD på main FÖRE denna PRD ens mintades (d718c161, 2026-08-07 19:01; 9d1875ea är ancestor till d718c161). Nu använder KRYSSRUTA_KLASS riktiga tokens (--mm-input-border/--mm-input-bg/--mm-checkbox-selected-*). Enda kvarvarande träffarna på '--mm-color-primary' i src/ är HISTORISKA kommentarer (components.css § Kryssruta + AtgardsSida.tsx:168) som dokumenterar att felet är åtgärdat — ingen levande konsumtion. Skapade INTE fynd-kortet: det hade dokumenterat en icke-existerande bugg, precis den typ av ny felaktig kopia denna audit finns för att förhindra. Flaggat för orkestrerarens beslut: stäng AC3 som N/A, eller amendera kortet.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): PR #965 mergad 046d65aa, per-jobb-grön (gh pr checks: 0 fail/pending). Samtliga åtta drift-instanser rättade mot uppmätt disk-facit: EF-antal 11→28, operationsregister 3→13 (alla rader), ADR-räkningen →102 (PRD:ns eget tal 100 var självt en approximation — det mätta talet användes), byggplanens döda pekare ×3 (git log --follow till docs/archive/), token-exemplen (5 av 7 fanns inte), D0-glob-kopian (saknade 9 av 17 positiv-poster + 1 undantag), README-badge-orgen, ci.yml-kommentaren 9→14, hur-systemet-funkar-datummotsägelsen. tasks/lessons.md orörd (diff-verifierat). Ursprungliga AC3 BORTTAGEN på falsifierad premiss (ADR-086-premiss-pass): tokenbuggen var redan fixad i 9d1875ea (S100 varv 14, 2026-08-07) — bevisligen ancestor till PRD-mintningen d718c161; inget fynd-kort skapades eftersom det hade dokumenterat en icke-existerande bugg. Full bevisning i kortets kommentar 06:23.
<!-- SECTION:FINAL_SUMMARY:END -->
