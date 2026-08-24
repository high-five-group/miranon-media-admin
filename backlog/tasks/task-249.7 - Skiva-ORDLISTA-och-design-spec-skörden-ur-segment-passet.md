---
id: TASK-249.7
title: 'Skiva: ORDLISTA- och design-spec-skörden ur segment-passet'
status: Done
assignee: []
created_date: '2026-08-17 00:36'
updated_date: '2026-08-24 13:10'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-249
ordinal: 469000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Domänspråket kristalliserades under granskningsvarven och Marcus kvitterade termerna i chatten — de skrivs nu, buntas inte. Täcker användarberättelser: 14 (språket), stödjer alla övriga. Oberoende av byggskivorna, kan gå parallellt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ORDLISTA bär de fyra Marcus-kvitterade posterna per sina snitt-regler: Grupp (ENDAST uppdelnings-betydelsen) · Uppsättning (generatorns resultat) · alternativ (verkstadens villkorsgrupper) · Urval av personer (ingressens definition av segment)
- [x] #2 Den låsta korthöjden (tvåraders-reservation, mätt 14 kort à 168 px) är bokförd som APP-GLOBAL regel i design-specen med S104-belägget och Marcus-ordern som källa
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

## Comments

<!-- COMMENTS:BEGIN -->
author: bygg-agent task-249.7
created: 2026-08-17 01:21
---
DIVERGENS bokförd (ADR-086): DoD #5 ("ariaSnapshot-referenserna låsta ur variant d FÖRE flippen") och #6 ("check-facit grön genom flipp OCH rivning") är verbatim-identiska med task-249.1 och 249.5:s DoD — boilerplate från /to-issues-genereringen, kopierad över alla task-249.X-skivor oavsett scope. Denna skiva rör ENDAST ORDLISTA.md + docs/specs/DESIGN-SYSTEM-SPEC.md (dokumentationsskörd); ingen kod i VariantD.tsx rörs, ingen flipp/rivning sker, check-facit har ingen relevant referens att pröva. Item #5/#6 är därför INAPPLICERBARA på denna skiva och lämnas avsiktligt obockade, inte glömda — den faktiska flip-verifieringen hör hemma på task-249.1/249.5.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och landad i natt-orkestreringen S104 2026-08-17 (resume 5). PR: se kortets notes/kommentarer; CI grön per jobb + merge-kö-verifikat. Stängd av orkestreraren efter landnings-verifiering mot origin/main.

S112 bokföringspass (2026-08-24): PR #1475 MERGED, CI SUCCESS (verifierad gh pr view). DoD #5/#6 explicit N/A per kortets egen kommentar #1 (boilerplate, skivan rör bara ORDLISTA.md/DESIGN-SYSTEM-SPEC.md, ingen kod/flipp/rivning) — lämnas orörda.

S112 bokföringspass (2026-08-24), rättelse: DoD #1/#2/#4 missades i första svepet. #1: båda AC checkade i kortet. #2: PR #1475 CI SUCCESS inkluderar Docs link check + check:docs-klassen (docs-only diff). #4: gh pr view 1475 filer = enbart ORDLISTA.md, DESIGN-SYSTEM-SPEC.md, kortfilen — inga orelaterade. Bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
