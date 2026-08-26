---
id: TASK-321
title: >-
  Fynd: sex test-deny-*.sh kan dela facit-godkand-skrivnings
  jq/node-PATH-döljningsbugg utan att CI avslöjar det
status: To Do
assignee: []
created_date: '2026-08-26 04:33'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 590000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Under TASK-185:s CI-fix (PR #1992, run 32929323637) hittades rotorsaken till test-deny-facit-godkand-skrivning.sh F1/F2 rött på ubuntu: dess path_utan() tog bort ENDAST katalogen 'command -v ${bin}' råkade resolva till, inte VARJE katalog som håller binären — ubuntu-latest-runners exponerar rutinmässigt både jq och node via fler än en PATH-katalog samtidigt (actions/setup-node PREPENDAR sin hostedtoolcache-katalog, originalinstallationen ligger kvar). Fixad i facit-godkand-skrivning.sh:s test (skannar nu varje PATH-segment för -x "${seg}/${bin}").

SAMMA enkel-katalogs-teknik (path_utan/compute_path_no_jq, en enda command -v-baserad borttagning) finns ORÖRD i SEX andra sviter: test-deny-resend-send.sh, test-deny-arbetsform-push.sh, test-deny-hemlighet-utskrift.sh, test-deny-precompact.sh, test-deny-prod-ref.sh, test-deny-subagent-vantan.sh. Samtliga är GRÖNA i CI idag — men test-deny-arbetsform-push.sh:s F1 visade sig vara VACUOUSLY GREEN (rensa_tillstand körs precis före F-serien, så hookens NEKA-väg är redan avstängd av en annan grind oavsett om jq döljs eller ej — testet bevisar INGET om jq-döljningen). Det är overifierat om samma maskering gäller de fem andra — d.v.s. deras jq-hiding-F-test kan vara lika overifierande, och samma multi-katalogs-bugg kan sitta dold i dem utan att CI någonsin exponerar den, eftersom testet aldrig faktiskt tvingar ett beslut som beror på jq-döljningen.

Föreslagen AC: för var och en av de sex, verifiera om F-testet för jq/node FAKTISKT diskriminerar (dvs. skulle fälla om döljningen inte fungerade) — inte bara att det är grönt. Där det diskriminerar och riskerar samma multi-katalogs-bugg: applicera samma fix (skanna alla PATH-segment). Källa: PR #1992.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
