---
id: TASK-161.1
title: >-
  Skiva: ADR-100-amenderingen — review-bumpens innebörd + ägar-deklarationens
  form
status: Done
assignee: []
created_date: '2026-08-07 19:02'
updated_date: '2026-08-08 06:43'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-161
ordinal: 291000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den som bumpar review_by eller läser ett styrande dok möter en definierad granskningsplikt och en explicit ägar-deklaration — återfalls-skyddets styrande text. Grillad samsyn S99 Del 10; rotorsaks-paketet kvitterat. Täcker användarberättelser: 4, 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR-100 amenderad ÖPPET (additiv Updates-sektion, daterad): review_by-bump KRÄVER mini-audit (drift-koll mot ägd yta + pekar-integritet + ägar-deklarationens giltighet) — kadensgrinden finns redan (check-frontmatter Check 3), amenderingen ger den innebörd
- [x] #2 Ägar-deklarationens form definierad i samma amendering: varje styrande dok bär raden Äger X · Kartlägger Y · vid konflikt vinner Z (husets mönster: segment-arkitektur rad 9, README rad 14)
- [x] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 3 (2026-08-08): PR #961 mergad 0e0eaa2f, per-jobb-grön (gh pr checks: 0 fail/pending). ADR-100 § Updates 2026-08-08: review_by-bump = mini-audit i tre namngivna steg (drift-koll mot ägd yta, pekar-integritet, ägar-deklarationens giltighet); ägar-deklarationens tredelade form (Äger / Kartlägger / Vid konflikt vinner) definierad som prosa-konvention i öppningsstycket. Divergens öppet bokförd i ADR-texten själv: kortets 'husets mönster'-rader (segment-arkitektur, README) var lös prosa-precedent, inte färdiga instanser av tredelade formen — formen är ny, källmärkt mot de verifierade förlagorna.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
