---
id: TASK-249.2
title: >-
  Skiva: EF-motorn — AND/DNF i membership, server-ägd expansion, via: Par[] i
  svaret
status: Done
assignee: []
created_date: '2026-08-17 00:24'
updated_date: '2026-08-24 13:07'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-249
ordinal: 464000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Serversidan lär sig ADR-115:s regelspråk: och-kombinationer räknas i motorn, aldrig i klienten. Detta är EF-krav 1, 3 och 4 ur facitets pass-nivå. Täcker användarberättelser: 4, 5, 16, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Membership-motorn accepterar regelformen med konjunkt-grupper i med (DNF) och platt utan; ett predikat utan flerledade grupper ger IDENTISK medlemsmängd som dagens par-lista (ingen regression, befintliga api-tester gröna)
- [x] #2 De fjorton Skool-gruppernas regler är uttryckbara och ger korrekta, disjunkta medlemsmängder i api-testerna — inklusive de 10 fall som var outtryckbara i ren OR
- [x] #3 compute-segment tar den nya regelformen och ÄGER expansionen predikat till par server-side; svaret bär via: Par[] per medlem (fördelningen kräver ingen andra fråga)
- [x] #4 Medlemskapsgolvet Närvaropoäng=1 är ORÖRT (ADR-064 beslut 1) — inga golvlättnader
- [x] #5 Testfallen landar som utökningar av de BEFINTLIGA api-sviterna för membership och compute-segment, inte nya klasser
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #6 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
EF-motorn byggd additivt (Par | Konjunkt-union i include, DNF) — noll breaking
change för SegmentBuilder.tsx/VariantA-C/befintliga api-tester. via: Par[]
tillagt i compute-segment-svaret via ny SegmentMemberWithVia (segment-resolution.ts);
send-email-unionen (resolveSegmentMembers) opåverkad, orört SegmentMember-kontrakt
(ADR-067). compute-segment manuellt deployad till staging (ADR-050-disciplin,
CI har inget deploy-steg) för att skarpa AND/DNF+via-testerna i
compute-segment.staging.test.ts ska bevisa mot verklig deployad kod, ej gissning.

DoD #5 (ariaSnapshot-referenser låsta ur variant d) och #6 (check-facit grön
genom flipp/rivning) rör INTE denna skiva — de är forward-looking mot 249.1/
249.5/249.6 (flipp+rivning har inte skett än) och tycks vara boilerplate ur
PRD-DoD-mallen kopierad in på varje barn-skiva. Lämnade omarkerade, ej gissat
klara. Se PR-rapporten för full motivering.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och landad i natt-orkestreringen S104 2026-08-17 (resume 5). PR: se kortets notes/kommentarer; CI grön per jobb + merge-kö-verifikat. Stängd av orkestreraren efter landnings-verifiering mot origin/main.

S112 bokföringspass (2026-08-24): PR #1477 MERGED, CI SUCCESS (verifierad gh pr view). DoD #5/#6 N/A per kortets egen notering (boilerplate ur PRD-mallen, flipp/rivning ägs av 249.1/249.5/249.6) — lämnas orörda.
<!-- SECTION:FINAL_SUMMARY:END -->
